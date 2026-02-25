import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFighter } from '../context/FighterContext';
import { useLanguage } from '../context/LanguageContext';
import { OpponentCard } from '../components/OpponentCard';
import { AIFighter, FighterStats, DetailedFighterStats } from '../types';
import { supabase } from '../lib/supabase';
import { getBattleMessage, BattleCategory, MMA_MOVES, TAKEDOWN_MOVES, SUBMISSION_MOVES } from '../constants/battlePhrases';

// ============ TYPES ============

export type FightPhase = 'STANDUP' | 'GROUND';
export type BodyPart = 'head' | 'body' | 'legs';

/** Localized damage state for one fighter. */
export interface HealthStatus {
  head: number;    // → 0 = Knockout
  body: number;    // → 0 = TKO (body)
  legs: number;    // → 0 = TKO (immobility)
  stamina: number; // drains over the fight; scales attacker damage
}

/** Core stats snapshot used by the battle engine. */
type FighterSnapshot = FighterStats;

interface BattleEvent {
  id: string;
  timestamp: number;
  attacker: 'player' | 'opponent';
  category: BattleCategory;
  move: string;
  damage: number;
  targetPart: BodyPart;   // which body part receives the damage
  phase: FightPhase;
  // For ground phase: who is on top controlling
  groundAttacker?: 'player' | 'opponent';
}

interface BattleLogEntry {
  id: string;
  message: string;
  category: BattleCategory;
  displayTime: number;
}

interface QueuedEvent {
  event: BattleEvent;
  attackerName: string;
  defenderName: string;
}

interface RoundResult {
  playerDamage: number;
  opponentDamage: number;
  playerHits: number;
  opponentHits: number;
}

// ============ DAMAGE RANGES ============

const getDamageRange = (category: BattleCategory): [number, number] => {
  switch (category) {
    case 'LIGHT_HIT':
      return [3, 12];
    case 'MEDIUM_HIT':
      return [13, 25];
    case 'HEAVY_HIT':
      return [26, 40];
    case 'CRITICAL_HIT':
      return [41, 60];
    case 'FINISHER':
      return [61, 100];
    // Ground game
    case 'TAKEDOWN_ATTEMPT':
      return [5, 14];   // impact of hitting the canvas
    case 'TAKEDOWN_DEFENSE':
      return [0, 0];
    case 'GROUND_CONTROL':
      return [12, 28];  // ground and pound
    case 'SUBMISSION_ATTEMPT':
      return [8, 18];   // submission squeeze damage
    case 'SUBMISSION_ESCAPE':
      return [0, 0];
    default:
      return [0, 0];
  }
};

// ============ NEW SYSTEM CONSTANTS ============

/** Stamina drained per event category from the ATTACKER. */
const STAMINA_DRAIN: Partial<Record<BattleCategory, number>> = {
  MISS: 3, DODGE: 2,
  LIGHT_HIT: 5, MEDIUM_HIT: 8, HEAVY_HIT: 12, CRITICAL_HIT: 15, FINISHER: 22,
  TAKEDOWN_ATTEMPT: 11, TAKEDOWN_DEFENSE: 5,
  GROUND_CONTROL: 7, SUBMISSION_ATTEMPT: 9, SUBMISSION_ESCAPE: 5,
};

/** Finisher messages when a body part reaches 0. */
const FINISHER_MSGS: Record<BodyPart, (winner: string, loser: string) => string> = {
  head: (w, l) => `💥 KNOCKOUT!! ${w} drops ${l} with a devastating blow to the head! The referee waves it off!`,
  body: (_w, l) => `🛑 TKO!! The referee stops the fight — ${l}'s body has taken too much punishment!`,
  legs: (_w, l) => `🦵 TKO!! ${l}'s legs give out completely! The referee stops the contest!`,
};

/** Determine which body part a strike targets. */
const getTargetPart = (move: string, category: BattleCategory): BodyPart => {
  const m = move.toLowerCase();
  // Leg kicks — English, Czech and Polish terms
  if (
    (m.includes('leg kick') || m.includes('low kick') || m.includes('kopnięcie nogi')) &&
    category !== 'TAKEDOWN_ATTEMPT' && category !== 'TAKEDOWN_DEFENSE'
  ) return 'legs';
  // Body kicks and knees
  if (
    m.includes('body kick') || m.includes('kop na tělo') || m.includes('kopnięcie w korpus') ||
    m.includes('knee') || m.includes('koleno') || m.includes('kolano')
  ) return Math.random() < 0.8 ? 'body' : 'head';
  // Takedowns → body impact on canvas
  if (category === 'TAKEDOWN_ATTEMPT' || category === 'TAKEDOWN_DEFENSE') return 'body';
  // Ground and pound — mix of head (45%) and body (55%)
  if (category === 'GROUND_CONTROL') return Math.random() < 0.45 ? 'head' : 'body';
  // Submissions squeeze the body
  if (category === 'SUBMISSION_ATTEMPT' || category === 'SUBMISSION_ESCAPE') return 'body';
  // Default striking (jabs, hooks, crosses, etc.) — head 68%, body 32%
  return Math.random() < 0.68 ? 'head' : 'body';
};

/** Build a body-part location suffix for commentary. */
const partLabel = (part: BodyPart): string =>
  part === 'head' ? 'to the head' : part === 'body' ? 'to the body' : 'to the legs';

// ============ EVENT GENERATOR (GROUND GAME STATE MACHINE) ============

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateBattleEvents = (
  roundDuration: number = 60,
  language: string = 'en',
  player: FighterSnapshot = { grappling: 50, strength: 50, speed: 50, striking: 50, cardio: 50 },
  opponent: FighterSnapshot = { grappling: 50, strength: 50, speed: 50, striking: 50, cardio: 50 },
  playerDetail?: Partial<DetailedFighterStats>,
  opponentDetail?: Partial<DetailedFighterStats>,
): BattleEvent[] => {
  const playerGrappling = player.grappling;
  const opponentGrappling = opponent.grappling;

  // ── Simulated stamina (affects damage scaling and TD success) ──
  let playerStaminaSim = 100;
  let opponentStaminaSim = 100;

  // ── Stat-based damage modifier for a specific body part ──
  const applyStatMod = (
    baseDmg: number,
    targetPart: BodyPart,
    atkDetail: Partial<DetailedFighterStats> | undefined,
    defDetail: Partial<DetailedFighterStats> | undefined,
    atkStamina: number,
  ): number => {
    let d = baseDmg * (atkStamina / 100); // stamina scales output
    if (targetPart === 'legs') {
      // Attacker's leg kick hardness boosts leg damage
      d *= 1 + ((atkDetail?.leg_kick_hardness ?? 50) - 50) / 200;
    } else if (targetPart === 'head') {
      // Defender chin durability reduces head damage
      d /= 1 + (defDetail?.chin_durability ?? 50) / 200;
      // Attacker striking power (best of cross/hook/uppercut) boosts head damage
      const strike = Math.max(atkDetail?.cross_power ?? 50, atkDetail?.hook_lethality ?? 50, atkDetail?.uppercut_timing ?? 50);
      d *= 1 + (strike - 50) / 300;
    } else {
      // Body: GnP pressure + knee impact
      d *= 1 + ((atkDetail?.gnp_pressure ?? 50) - 50) / 300;
      d *= 1 + ((atkDetail?.knee_impact ?? 50) - 50) / 300;
    }
    return Math.round(Math.max(1, d));
  };

  const events: BattleEvent[] = [];
  const lang = language as 'en' | 'cs' | 'pl';
  const strikingMoves = MMA_MOVES[lang];
  const tdMoves = TAKEDOWN_MOVES[lang];
  const subMoves = SUBMISSION_MOVES[lang];

  let time = 0;
  let eid = 0;
  let phase: FightPhase = 'STANDUP';
  let groundTopFighter: 'player' | 'opponent' = 'player';
  let groundEndTime = 0;

  // Base td chances (modified by stamina exhaustion)
  const tdChancePlayer   = 0.10 + (playerGrappling   - 50) / 400;
  const tdChanceOpponent = 0.10 + (opponentGrappling - 50) / 400;

  /** Build a BattleEvent with body part targeting + stat/stamina-scaled damage. */
  const mkEvent = (
    category: BattleCategory,
    attacker: 'player' | 'opponent',
    move: string,
    curPhase: FightPhase,
    gTop?: 'player' | 'opponent',
  ): BattleEvent => {
    const [mn, mx] = getDamageRange(category);
    const tPart = getTargetPart(move, category);
    const atkStamina = attacker === 'player' ? playerStaminaSim : opponentStaminaSim;
    const atkDetail  = attacker === 'player' ? playerDetail : opponentDetail;
    const defDetail  = attacker === 'player' ? opponentDetail : playerDetail;
    const rawDmg = mn > 0 ? randInt(mn, mx) : 0;
    const finalDmg = rawDmg > 0 ? applyStatMod(rawDmg, tPart, atkDetail, defDetail, atkStamina) : 0;

    // Drain attacker stamina, fractional recovery for defender
    const drain = STAMINA_DRAIN[category] ?? 5;
    if (attacker === 'player') {
      playerStaminaSim   = Math.max(5, playerStaminaSim - drain);
      opponentStaminaSim = Math.min(100, opponentStaminaSim + 1);
    } else {
      opponentStaminaSim = Math.max(5, opponentStaminaSim - drain);
      playerStaminaSim   = Math.min(100, playerStaminaSim + 1);
    }

    return {
      id: `ev-${eid++}-${Date.now()}`,
      timestamp: time,
      attacker,
      category,
      move,
      damage: finalDmg,
      targetPart: tPart,
      phase: curPhase,
      groundAttacker: gTop,
    };
  };

  while (time < roundDuration) {
    const spacing = phase === 'GROUND' ? randInt(2, 4) : randInt(2, 5);
    time += spacing;
    if (time >= roundDuration) break;

    // ─── GROUND PHASE ───────────────────────────────────────────
    if (phase === 'GROUND') {
      if (time >= groundEndTime) {
        events.push({
          id: `standup-sys-${eid++}`,
          timestamp: time,
          attacker: groundTopFighter,
          category: 'TAKEDOWN_DEFENSE',
          move: lang === 'cs' ? 'vstávání po obraně' : lang === 'pl' ? 'powrót na nogi' : 'scramble back to feet',
          damage: 0,
          targetPart: 'body',
          phase: 'STANDUP',
          groundAttacker: undefined,
        });
        phase = 'STANDUP';
        continue;
      }

      const roll = Math.random();
      const bottom: 'player' | 'opponent' = groundTopFighter === 'player' ? 'opponent' : 'player';

      if (roll < 0.18) {
        const sub = randItem(subMoves);
        events.push(mkEvent('SUBMISSION_ATTEMPT', groundTopFighter, sub, 'GROUND', groundTopFighter));
        if (Math.random() < 0.09) {
          time += 1;
          events.push(mkEvent('FINISHER', groundTopFighter, sub, 'GROUND', groundTopFighter));
          break;
        }
        if (Math.random() < 0.40) {
          time += randInt(1, 3);
          if (time >= roundDuration) break;
          events.push(mkEvent('SUBMISSION_ESCAPE', bottom, sub, 'GROUND', groundTopFighter));
          if (Math.random() < 0.50) {
            phase = 'STANDUP';
          } else {
            groundTopFighter = bottom;
            groundEndTime = time + randInt(10, 20);
          }
        }
      } else if (roll < 0.55) {
        const gnpMove = lang === 'cs' ? 'ground and pound' : lang === 'pl' ? 'ground and pound' : 'ground and pound';
        events.push(mkEvent('GROUND_CONTROL', groundTopFighter, gnpMove, 'GROUND', groundTopFighter));
      } else if (roll < 0.70) {
        const guardWork = lang === 'cs' ? 'práce z gardu' : lang === 'pl' ? 'praca z gardy' : 'guard work';
        events.push(mkEvent('SUBMISSION_ESCAPE', bottom, guardWork, 'GROUND', groundTopFighter));
        if (Math.random() < 0.25) phase = 'STANDUP';
      } else if (roll < 0.82) {
        const sub = randItem(subMoves);
        events.push(mkEvent('SUBMISSION_ATTEMPT', groundTopFighter, sub, 'GROUND', groundTopFighter));
      } else {
        const posWork = lang === 'cs' ? 'kontrola pozice' : lang === 'pl' ? 'kontrola pozycji' : 'positional control';
        events.push(mkEvent('GROUND_CONTROL', groundTopFighter, posWork, 'GROUND', groundTopFighter));
      }

    // ─── STANDUP PHASE ──────────────────────────────────────────
    } else {
      const tdAttemptChance = Math.random() < 0.5 ? tdChancePlayer : tdChanceOpponent;
      const roll = Math.random();

      if (roll < tdAttemptChance) {
        const attacker: 'player' | 'opponent' = Math.random() < 0.5 ? 'player' : 'opponent';
        const defender: 'player' | 'opponent' = attacker === 'player' ? 'opponent' : 'player';
        const td = randItem(tdMoves);
        events.push(mkEvent('TAKEDOWN_ATTEMPT', attacker, td, 'STANDUP'));

        const atkGrappling = attacker === 'player' ? playerGrappling : opponentGrappling;
        const defGrappling = defender === 'player' ? playerGrappling : opponentGrappling;
        // Low stamina (< 20%) on defender → 50% easier to take down
        const defStamina = defender === 'player' ? playerStaminaSim : opponentStaminaSim;
        const exhaustionBonus = defStamina < 20 ? 1.5 : 1.0;
        const tdSuccessChance = (0.45 + (atkGrappling - defGrappling) / 200) * exhaustionBonus;

        if (Math.random() > tdSuccessChance) {
          time += randInt(1, 2);
          if (time >= roundDuration) break;
          events.push(mkEvent('TAKEDOWN_DEFENSE', defender, td, 'STANDUP'));
        } else {
          time += 1;
          phase = 'GROUND';
          groundTopFighter = attacker;
          groundEndTime = time + randInt(20, 35);
        }
      } else {
        const attacker: 'player' | 'opponent' = Math.random() < 0.5 ? 'player' : 'opponent';
        const move = randItem(strikingMoves);
        // Low stamina on attacker shifts distribution to lighter hits
        const atkStaminaNow = attacker === 'player' ? playerStaminaSim : opponentStaminaSim;
        const fatiguedBias = atkStaminaNow < 30 ? 0.15 : 0; // shift thresholds up = fewer crits

        let category: BattleCategory;
        const sr = Math.random();
        if (sr < 0.12 + fatiguedBias) {
          category = 'MISS';
        } else if (sr < 0.22 + fatiguedBias) {
          category = 'DODGE';
        } else if (sr < 0.50 + fatiguedBias) {
          category = 'LIGHT_HIT';
        } else if (sr < 0.72 + fatiguedBias) {
          category = 'MEDIUM_HIT';
        } else if (sr < 0.88) {
          category = 'HEAVY_HIT';
        } else if (sr < 0.96) {
          category = 'CRITICAL_HIT';
        } else {
          category = 'FINISHER';
        }
        events.push(mkEvent(category, attacker, move, 'STANDUP'));
      }
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
};

// ============ MAIN ARENA COMPONENT ============

export const Arena: React.FC = () => {
  const { fighter, reloadFighter } = useFighter();
  const { language, t } = useLanguage();
  const location = useLocation();

  // Opponent selection
  const [opponents, setOpponents] = useState<AIFighter[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<AIFighter | null>(null);
  const [loadingOpponents, setLoadingOpponents] = useState(false);
  const [opponentError, setOpponentError] = useState<string | null>(null);

  // ── Health / Stamina state (Localized Damage System) ──
  const defaultHS = (): HealthStatus => ({ head: 100, body: 100, legs: 100, stamina: 100 });
  const [playerHS, setPlayerHS] = useState<HealthStatus>(defaultHS);
  const [opponentHS, setOpponentHS] = useState<HealthStatus>(defaultHS);
  // Refs mirror state for the queue processor (avoids stale closure issues)
  const playerHSRef   = useRef<HealthStatus>(defaultHS());
  const opponentHSRef = useRef<HealthStatus>(defaultHS());
  const battleEndedRef = useRef(false);

  // Battle state
  const [isBattling, setIsBattling] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(60);

  // Pre-calculated events
  const eventsRef = useRef<BattleEvent[]>([]);
  const processedEventIds = useRef<Set<string>>(new Set());

  // Battle log
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const battleLogRef = useRef<HTMLDivElement>(null);

  // Display queue for dramatic timing
  const displayQueueRef = useRef<QueuedEvent[]>([]);
  const isProcessingQueueRef = useRef(false);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBattlingRef = useRef(false);

  // Round stats
  const [roundStats, setRoundStats] = useState<RoundResult>({
    playerDamage: 0,
    opponentDamage: 0,
    playerHits: 0,
    opponentHits: 0,
  });
  // Ref zrcadlí roundStats – předchází stale closure v endBattle (judges decision)
  const roundStatsRef = useRef<RoundResult>({
    playerDamage: 0, opponentDamage: 0, playerHits: 0, opponentHits: 0,
  });

  // Battle result
  const [battleResult, setBattleResult] = useState<{
    winner: 'player' | 'opponent' | 'draw';
    method: string;
  } | null>(null);

  // Fight phase (standup vs ground)
  const [fightPhase, setFightPhase] = useState<FightPhase>('STANDUP');
  const [groundAttackerName, setGroundAttackerName] = useState<string | null>(null);

  // Screen shake
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Timer control
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundStartTime = useRef<number>(0);
  // Ref zrcadlí currentRound – používá se v timer callbacku aby se předešlo stale closure
  const currentRoundRef = useRef(1);
  // Ref pro zrušení FINISHER timeoutů (aby se nezavolal endBattle v dalším kole)
  const pendingFinishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canFight = fighter && fighter.name !== 'Undefined' && fighter.currentEnergy >= 50;

  // Sync isBattling state to ref for queue processor
  useEffect(() => {
    isBattlingRef.current = isBattling;
  }, [isBattling]);

  // Sync currentRound to ref – předchází stale closure v setInterval callbacku
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  // ============ MATCHMAKING: FETCH REAL PLAYERS FROM DATABASE ============

  useEffect(() => {
    const fetchMatchmakingOpponents = async () => {
      if (!fighter || fighter.name === 'Undefined' || opponents.length > 0) {
        return;
      }

      setLoadingOpponents(true);
      setOpponentError(null);

      try {
        console.log('🎯 [ARENA] Fetching matchmaking opponents...');

        // Fetch all players from database sorted by reputation
        const { data: allPlayers, error: fetchError } = await supabase
          .from('profiles')
          .select('id, username, reputation, wins, losses, draws, level, strength, speed, cardio, striking, grappling')
          .order('reputation', { ascending: false });

        if (fetchError) {
          throw new Error(`Database error: ${fetchError.message}`);
        }

        if (!allPlayers || allPlayers.length === 0) {
          setOpponentError('No players found in database');
          setOpponents([]);
          return;
        }

        // Filter out current player and players without energy
        const availablePlayers = allPlayers.filter(
          (p) => p.username !== fighter.name && p.username && p.id
        );

        console.log('✅ [ARENA] Available players:', availablePlayers.length);

        if (availablePlayers.length === 0) {
          setOpponentError('No other players available to fight');
          setOpponents([]);
          return;
        }

        // Find current player's rank
        const currentReputation = fighter.reputation || 0;

        let selectedPlayers: typeof allPlayers = [];

        if (availablePlayers.length <= 6) {
          // If 6 or fewer players, show all
          selectedPlayers = availablePlayers;
        } else {
          // Matchmaking: 3 above, 3 below based on reputation
          const playersAbove = availablePlayers
            .filter((p) => (p.reputation || 0) > currentReputation)
            .slice(0, 3);

          const playersBelow = availablePlayers
            .filter((p) => (p.reputation || 0) <= currentReputation)
            .slice(0, 3);

          selectedPlayers = [...playersAbove, ...playersBelow];

          // If not enough, fill with remaining players
          if (selectedPlayers.length < 6) {
            const remaining = availablePlayers
              .filter((p) => !selectedPlayers.includes(p))
              .slice(0, 6 - selectedPlayers.length);
            selectedPlayers = [...selectedPlayers, ...remaining];
          }
        }

        // Convert to AIFighter format
        const matchedOpponents: AIFighter[] = selectedPlayers.map((p) => ({
          id: p.id,
          name: p.username || 'Unknown Fighter',
          nickname: `Rank #${allPlayers.findIndex((ap) => ap.id === p.id) + 1}`,
          record: {
            wins: p.wins || 0,
            losses: p.losses || 0,
            draws: p.draws || 0,
          },
          stats: {
            strength: p.strength || 50,
            speed: p.speed || 50,
            cardio: p.cardio || 50,
            striking: p.striking || 50,
            grappling: p.grappling || 50,
          },
          level: p.level || 1,
          avatar: '🥊',
          health: 100,
          maxHealth: 100,
        }));

        console.log('✅ [ARENA] Matched opponents:', matchedOpponents.length);
        setOpponents(matchedOpponents);

        // Check if there's a pre-selected opponent from navigation state
        const preSelectedOpponent = (location.state as any)?.opponent;
        if (preSelectedOpponent) {
          const foundOpponent = matchedOpponents.find((o) => o.id === preSelectedOpponent.id);
          if (foundOpponent) {
            console.log('✅ [ARENA] Pre-selected opponent:', foundOpponent.name);
            setSelectedOpponent(foundOpponent);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [ARENA] Matchmaking error:', errorMessage);
        setOpponentError(errorMessage);
        setOpponents([]);
      } finally {
        setLoadingOpponents(false);
      }
    };

    fetchMatchmakingOpponents();
  }, [fighter, opponents.length, location.state]);

  // ============ BATTLE CLOCK (PLAYBACK ENGINE) ============

  useEffect(() => {
    if (!isBattling || battleResult) {
      return;
    }

    timerRef.current = setInterval(() => {
      // Pokud byl zápas již ukončen finisherem, timer dál nepracuje
      if (battleEndedRef.current) return;

      setTimeRemaining((prev) => {
        if (prev <= 0) return 0; // Pojistka: nenechej jít záporně
        const newTime = prev - 1;
        const elapsedTime = 60 - newTime;

        // Check for events at this timestamp
        const eventsToFire = eventsRef.current.filter(
          (event) => event.timestamp === elapsedTime && !processedEventIds.current.has(event.id)
        );

        // Add events to display queue instead of showing immediately
        eventsToFire.forEach((event) => {
          processedEventIds.current.add(event.id);

          const attackerName = event.attacker === 'player' ? fighter!.name : selectedOpponent!.name;
          const defenderName = event.attacker === 'player' ? selectedOpponent!.name : fighter!.name;

          // NOTE: message is resolved in the queue processor (not here)
          // to always use the current language, not a stale closure value.
          displayQueueRef.current.push({
            event,
            attackerName,
            defenderName,
          });
        });

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isBattling, battleResult, fighter, selectedOpponent, language]);

  // ============ ROUND TRANSITION (separátní effect – netáhne closeures z timeru) ============

  useEffect(() => {
    // Spustí se pouze když timeRemaining dosáhne přesně 0 a zápas běží
    if (!isBattling || battleResult || timeRemaining !== 0) return;
    // Pokud byl zápas již ukončen finisherem, nepřecházíme do dalšího kola
    if (battleEndedRef.current) return;

    if (currentRoundRef.current >= 3) {
      endBattle('judges', "Judges' Decision");
    } else {
      startNextRound();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, isBattling, battleResult]);

  // ============ QUEUE PROCESSOR (DRAMATIC TIMING) ============

  const processNextQueuedEvent = () => {
    if (!isBattlingRef.current || isProcessingQueueRef.current || displayQueueRef.current.length === 0) {
      // Schedule check again soon if still battling
      if (isBattlingRef.current) {
        processingTimeoutRef.current = setTimeout(processNextQueuedEvent, 100);
      }
      return;
    }

    isProcessingQueueRef.current = true;
    const queuedEvent = displayQueueRef.current.shift();

    if (!queuedEvent) {
      isProcessingQueueRef.current = false;
      processingTimeoutRef.current = setTimeout(processNextQueuedEvent, 100);
      return;
    }

    const { event, attackerName, defenderName } = queuedEvent;

    // ── Build message with body-part location ──────────────────
    const baseMsg = getBattleMessage(event.category, attackerName, defenderName, event.move, language);
    const isStrike = event.damage > 0 && (
      event.category === 'LIGHT_HIT' || event.category === 'MEDIUM_HIT' ||
      event.category === 'HEAVY_HIT' || event.category === 'CRITICAL_HIT'
    );
    const locationSuffix = isStrike ? ` [${partLabel(event.targetPart)}]` : '';
    const message = baseMsg + locationSuffix;

    // Console log at DISPLAY time (not generation time)
    console.log('💬 [COMMENTARY]', message);

    // Update fight phase indicator immediately when event is displayed
    setFightPhase(event.phase);
    if (event.phase === 'GROUND' && event.groundAttacker) {
      const topName = event.groundAttacker === 'player' ? fighter!.name : selectedOpponent!.name;
      setGroundAttackerName(topName);
    } else if (event.phase === 'STANDUP') {
      setGroundAttackerName(null);
    }

    // Add to battle log (typewriter will animate it)
    setBattleLog((log) => [
      ...log,
      {
        id: event.id,
        message,
        category: event.category,
        displayTime: Date.now(),
      },
    ]);

    // Calculate typewriter duration (60ms per character)
    const typewriterDuration = message.length * 60;

    // Wait for typewriter to complete before updating HealthStatus
    setTimeout(() => {
      if (event.damage > 0) {
        const tPart = event.targetPart;
        const isPlayerAttacking = event.attacker === 'player';
        const drain = STAMINA_DRAIN[event.category] ?? 5;

        if (isPlayerAttacking) {
          // ── Damage to opponent's body part ──
          const newOppHS = {
            ...opponentHSRef.current,
            [tPart]: Math.max(0, opponentHSRef.current[tPart] - event.damage),
          };
          opponentHSRef.current = newOppHS;
          setOpponentHS(newOppHS);
          // Drain player stamina, slight recovery for opponent
          playerHSRef.current = { ...playerHSRef.current, stamina: Math.max(5, playerHSRef.current.stamina - drain) };
          setPlayerHS({ ...playerHSRef.current });
          opponentHSRef.current = { ...opponentHSRef.current, stamina: Math.min(100, opponentHSRef.current.stamina + 1) };
          setOpponentHS({ ...opponentHSRef.current });

          setRoundStats((stats) => {
            const next = { ...stats, playerDamage: stats.playerDamage + event.damage, playerHits: stats.playerHits + 1 };
            roundStatsRef.current = next;
            return next;
          });

          // ── Finisher check: HP zóna dosáhla 0 (KO / TKO) ──
          if (newOppHS[tPart] <= 0 && !battleEndedRef.current) {
            battleEndedRef.current = true;
            const method = tPart === 'head' ? 'Knockout' : tPart === 'body' ? 'TKO — Body Damage' : 'TKO — Leg Damage';
            setBattleLog((log) => [...log, { id: `finish-${Date.now()}`, message: FINISHER_MSGS[tPart](attackerName, defenderName), category: 'FINISHER', displayTime: Date.now() }]);
            if (pendingFinishTimeoutRef.current) clearTimeout(pendingFinishTimeoutRef.current);
            pendingFinishTimeoutRef.current = setTimeout(() => endBattle('player', method), 1200);
          // ── Finisher check: FINISHER event → submise (tap-out/choke-out) nebo drtivý úder ──
          // Submission finishery VŽDY ukončí zápas – HP nemusí dosáhnout 0
          } else if (event.category === 'FINISHER' && !battleEndedRef.current) {
            battleEndedRef.current = true;
            const isSubmission = event.phase === 'GROUND';
            const method = isSubmission
              ? `Submission — ${event.move}`
              : (tPart === 'head' ? 'Knockout' : tPart === 'body' ? 'TKO — Body Damage' : 'TKO — Leg Damage');
            const finishMsg = isSubmission
              ? `🔒 SUBMISSION!! ${defenderName} odklepal! ${attackerName} vítězí przez submission — ${event.move}!`
              : FINISHER_MSGS[tPart](attackerName, defenderName);
            setBattleLog((log) => [...log, { id: `finish-sub-${Date.now()}`, message: finishMsg, category: 'FINISHER', displayTime: Date.now() }]);
            if (pendingFinishTimeoutRef.current) clearTimeout(pendingFinishTimeoutRef.current);
            pendingFinishTimeoutRef.current = setTimeout(() => endBattle('player', method), 1200);
          }
        } else {
          // ── Damage to player's body part ──
          const newPlHS = {
            ...playerHSRef.current,
            [tPart]: Math.max(0, playerHSRef.current[tPart] - event.damage),
          };
          playerHSRef.current = newPlHS;
          setPlayerHS(newPlHS);
          // Drain opponent stamina, slight recovery for player
          opponentHSRef.current = { ...opponentHSRef.current, stamina: Math.max(5, opponentHSRef.current.stamina - drain) };
          setOpponentHS({ ...opponentHSRef.current });
          playerHSRef.current = { ...playerHSRef.current, stamina: Math.min(100, playerHSRef.current.stamina + 1) };
          setPlayerHS({ ...playerHSRef.current });

          setRoundStats((stats) => {
            const next = { ...stats, opponentDamage: stats.opponentDamage + event.damage, opponentHits: stats.opponentHits + 1 };
            roundStatsRef.current = next;
            return next;
          });

          // ── Finisher check: HP zóna dosáhla 0 (KO / TKO) ──
          if (newPlHS[tPart] <= 0 && !battleEndedRef.current) {
            battleEndedRef.current = true;
            const method = tPart === 'head' ? 'Knockout' : tPart === 'body' ? 'TKO — Body Damage' : 'TKO — Leg Damage';
            setBattleLog((log) => [...log, { id: `finish-${Date.now()}`, message: FINISHER_MSGS[tPart](defenderName, attackerName), category: 'FINISHER', displayTime: Date.now() }]);
            if (pendingFinishTimeoutRef.current) clearTimeout(pendingFinishTimeoutRef.current);
            pendingFinishTimeoutRef.current = setTimeout(() => endBattle('opponent', method), 1200);
          // ── Finisher check: FINISHER event → soupeř nasadil submisi (tap-out / choke-out) ──
          } else if (event.category === 'FINISHER' && !battleEndedRef.current) {
            battleEndedRef.current = true;
            const isSubmission = event.phase === 'GROUND';
            const method = isSubmission
              ? `Submission — ${event.move}`
              : (tPart === 'head' ? 'Knockout' : tPart === 'body' ? 'TKO — Body Damage' : 'TKO — Leg Damage');
            const finishMsg = isSubmission
              ? `🔒 SUBMISSION!! ${attackerName} odklepal! ${defenderName} vítězí przez submission — ${event.move}!`
              : FINISHER_MSGS[tPart](defenderName, attackerName);
            setBattleLog((log) => [...log, { id: `finish-sub-${Date.now()}`, message: finishMsg, category: 'FINISHER', displayTime: Date.now() }]);
            if (pendingFinishTimeoutRef.current) clearTimeout(pendingFinishTimeoutRef.current);
            pendingFinishTimeoutRef.current = setTimeout(() => endBattle('opponent', method), 1200);
          }
        }

        // Trigger screen shake for heavy hits
        if (event.category === 'HEAVY_HIT' || event.category === 'CRITICAL_HIT' || event.category === 'FINISHER' || event.category === 'TAKEDOWN_ATTEMPT') {
          const intensity = event.category === 'FINISHER' ? 3 : event.category === 'CRITICAL_HIT' ? 2 : event.category === 'TAKEDOWN_ATTEMPT' ? 2 : 1;
          setShakeIntensity(intensity);
          setTimeout(() => setShakeIntensity(0), 400);
        }
      }

      // Dead air pause (1-2 seconds) before next message
      const pauseDuration = 1000 + Math.random() * 1000;
      setTimeout(() => {
        isProcessingQueueRef.current = false;
        processNextQueuedEvent();
      }, pauseDuration);
    }, typewriterDuration);
  };

  // Start queue processor when battle begins
  useEffect(() => {
    if (isBattling && !processingTimeoutRef.current) {
      processNextQueuedEvent();
    }

    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    };
  }, [isBattling]);

  // ============ AUTO-SCROLL BATTLE LOG ============

  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleLog]);

  // ============ BATTLE CONTROL FUNCTIONS ============

  const startBattle = () => {
    if (!selectedOpponent || !fighter) return;

    const playerSnap: FighterSnapshot = {
      grappling:  fighter.stats?.grappling ?? 50,
      strength:   fighter.stats?.strength  ?? 50,
      speed:      fighter.stats?.speed     ?? 50,
      striking:   fighter.stats?.striking  ?? 50,
      cardio:     fighter.stats?.cardio    ?? 50,
    };
    const opponentSnap: FighterSnapshot = {
      grappling:  selectedOpponent.stats?.grappling ?? 50,
      strength:   selectedOpponent.stats?.strength  ?? 50,
      speed:      selectedOpponent.stats?.speed     ?? 50,
      striking:   selectedOpponent.stats?.striking  ?? 50,
      cardio:     selectedOpponent.stats?.cardio    ?? 50,
    };

    const events = generateBattleEvents(60, language, playerSnap, opponentSnap, fighter.detailedStats, undefined);
    eventsRef.current = events;
    processedEventIds.current.clear();
    displayQueueRef.current = [];
    isProcessingQueueRef.current = false;

    // Reset battle state
    const freshHS = defaultHS();
    playerHSRef.current   = freshHS;
    opponentHSRef.current = freshHS;
    battleEndedRef.current = false;
    currentRoundRef.current = 1;
    roundStatsRef.current = { playerDamage: 0, opponentDamage: 0, playerHits: 0, opponentHits: 0 };
    if (pendingFinishTimeoutRef.current) { clearTimeout(pendingFinishTimeoutRef.current); pendingFinishTimeoutRef.current = null; }
    setPlayerHS({ ...freshHS });
    setOpponentHS({ ...freshHS });
    setIsBattling(true);
    setCurrentRound(1);
    setTimeRemaining(60);
    setBattleLog([]);
    setFightPhase('STANDUP');
    setGroundAttackerName(null);
    setRoundStats({
      playerDamage: 0,
      opponentDamage: 0,
      playerHits: 0,
      opponentHits: 0,
    });
    setBattleResult(null);
    roundStartTime.current = Date.now();
  };

  const startNextRound = () => {
    const playerSnap: FighterSnapshot = {
      grappling:  fighter?.stats?.grappling ?? 50,
      strength:   fighter?.stats?.strength  ?? 50,
      speed:      fighter?.stats?.speed     ?? 50,
      striking:   fighter?.stats?.striking  ?? 50,
      cardio:     fighter?.stats?.cardio    ?? 50,
    };
    const opponentSnap: FighterSnapshot = {
      grappling:  selectedOpponent?.stats?.grappling ?? 50,
      strength:   selectedOpponent?.stats?.strength  ?? 50,
      speed:      selectedOpponent?.stats?.speed     ?? 50,
      striking:   selectedOpponent?.stats?.striking  ?? 50,
      cardio:     selectedOpponent?.stats?.cardio    ?? 50,
    };
    const events = generateBattleEvents(60, language, playerSnap, opponentSnap, fighter?.detailedStats, undefined);
    eventsRef.current = events;
    processedEventIds.current.clear();
    displayQueueRef.current = [];
    isProcessingQueueRef.current = false;

    // Reset for next round — health resets, stamina carries over (fatigued!)
    const roundFreshHS = defaultHS();
    const carryoverPlayerStamina = playerHSRef.current.stamina;
    const carryoverOppStamina    = opponentHSRef.current.stamina;
    playerHSRef.current   = { ...roundFreshHS, stamina: carryoverPlayerStamina };
    opponentHSRef.current = { ...roundFreshHS, stamina: carryoverOppStamina };
    // Zruš případný nevyřízený FINISHER timeout z předchozího kola
    if (pendingFinishTimeoutRef.current) {
      clearTimeout(pendingFinishTimeoutRef.current);
      pendingFinishTimeoutRef.current = null;
    }
    // Zastav starý interval okamžitě – nový spustí useEffect po re-renderu
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    battleEndedRef.current = false;
    setPlayerHS({ ...playerHSRef.current });
    setOpponentHS({ ...opponentHSRef.current });
    // Aktualizujeme ref synchronně uvnitř updatru – předchází stale closure v setInterval
    setCurrentRound((r) => {
      currentRoundRef.current = r + 1;
      return r + 1;
    });
    // Reset roundStats včetně refu
    roundStatsRef.current = { playerDamage: 0, opponentDamage: 0, playerHits: 0, opponentHits: 0 };
    setRoundStats({ playerDamage: 0, opponentDamage: 0, playerHits: 0, opponentHits: 0 });
    setTimeRemaining(60);
    setFightPhase('STANDUP');
    setGroundAttackerName(null);

    setBattleLog((log) => [
      ...log,
      {
        id: `round-${currentRound + 1}-start`,
        message: `═══ ROUND ${currentRound + 1} BEGINS ═══`,
        category: 'MISS',
        displayTime: Date.now(),
      },
    ]);
  };

  const endBattle = (winner: 'player' | 'opponent' | 'judges' | 'draw', method: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    // Zruš případný nevyřízený FINISHER timeout
    if (pendingFinishTimeoutRef.current) {
      clearTimeout(pendingFinishTimeoutRef.current);
      pendingFinishTimeoutRef.current = null;
    }

    // Determine actual winner for judges' decision
    // Používáme REF (ne state) aby se předešlo stale closure → remíza 0:0
    let finalWinner = winner;
    if (winner === 'judges') {
      const playerScore = roundStatsRef.current.playerDamage + roundStatsRef.current.playerHits * 5;
      const opponentScore = roundStatsRef.current.opponentDamage + roundStatsRef.current.opponentHits * 5;

      if (playerScore > opponentScore) {
        finalWinner = 'player';
      } else if (opponentScore > playerScore) {
        finalWinner = 'opponent';
      } else {
        finalWinner = 'draw';
      }
    }

    setBattleResult({ winner: finalWinner as 'player' | 'opponent' | 'draw', method });

    // Update database ONLY NOW
    if (fighter) {
      const energyAfter = Math.max(0, fighter.currentEnergy - 50);
      if (finalWinner === 'player') {
        const xpGain = 50 + roundStats.playerDamage;
        const reputationGain = 10 + roundStats.playerHits * 2;
        supabase.from('profiles').update({
          wins: (fighter.record.wins || 0) + 1,
          reputation: (fighter.reputation || 0) + reputationGain,
          experience: (fighter.experience || 0) + xpGain,
          energy: energyAfter,
        }).eq('id', fighter.id).then(() => reloadFighter());
      } else if (finalWinner === 'opponent') {
        supabase.from('profiles').update({
          losses: (fighter.record.losses || 0) + 1,
          energy: energyAfter,
        }).eq('id', fighter.id).then(() => reloadFighter());
      } else {
        supabase.from('profiles').update({
          draws: (fighter.record.draws || 0) + 1,
          energy: energyAfter,
        }).eq('id', fighter.id).then(() => reloadFighter());
      }
    }
  };

  const resetArena = () => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    if (pendingFinishTimeoutRef.current) {
      clearTimeout(pendingFinishTimeoutRef.current);
      pendingFinishTimeoutRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsBattling(false);
    setBattleResult(null);
    setSelectedOpponent(null);
    setBattleLog([]);
    setCurrentRound(1);
    setTimeRemaining(60);
    const resetHS = defaultHS();
    playerHSRef.current   = resetHS;
    opponentHSRef.current = resetHS;
    battleEndedRef.current = false;
    currentRoundRef.current = 1;
    roundStatsRef.current = { playerDamage: 0, opponentDamage: 0, playerHits: 0, opponentHits: 0 };
    setPlayerHS({ ...resetHS });
    setOpponentHS({ ...resetHS });
    setFightPhase('STANDUP');
    setGroundAttackerName(null);
    eventsRef.current = [];
    processedEventIds.current.clear();
    displayQueueRef.current = [];
    isProcessingQueueRef.current = false;
  };

  // ============ RENDER ============

  return (
    <motion.div
      className="p-8 min-h-screen"
      style={{
        transform:
          shakeIntensity > 0
            ? `translate(${(Math.random() - 0.5) * shakeIntensity * 12}px, ${(Math.random() - 0.5) * shakeIntensity * 12}px)`
            : 'translate(0, 0)',
        transition: 'transform 0.1s',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {battleResult ? (
            <ResultScreen
              key="result"
              result={battleResult}
              roundStats={roundStats}
              onReset={resetArena}
              t={t}
            />
          ) : isBattling && selectedOpponent ? (
            <BattleScreen
              key="battle"
              fighter={fighter!}
              opponent={selectedOpponent}
              currentRound={currentRound}
              timeRemaining={timeRemaining}
              playerHS={playerHS}
              opponentHS={opponentHS}
              battleLog={battleLog}
              battleLogRef={battleLogRef}
              roundStats={roundStats}
              fightPhase={fightPhase}
              groundAttackerName={groundAttackerName}
              t={t}
            />
          ) : (
            <SetupScreen
              key="setup"
              fighter={fighter}
              opponents={opponents}
              selectedOpponent={selectedOpponent}
              onSelectOpponent={setSelectedOpponent}
              onStartBattle={startBattle}
              canFight={!!canFight}
              loading={loadingOpponents}
              error={opponentError}
              t={t}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ============ BATTLE SCREEN ============

interface BattleScreenProps {
  fighter: any;
  opponent: AIFighter;
  currentRound: number;
  timeRemaining: number;
  playerHS: HealthStatus;
  opponentHS: HealthStatus;
  battleLog: BattleLogEntry[];
  battleLogRef: React.RefObject<HTMLDivElement>;
  roundStats: RoundResult;
  fightPhase: FightPhase;
  groundAttackerName: string | null;
  t: (key: string) => string;
}

// ─── Part Bar: single health segment (Head / Body / Legs / Stamina) ──────────
const PartBar: React.FC<{
  label: string;
  value: number;
  baseGradient: string;
  height?: string;
}> = ({ label, value, baseGradient, height = 'h-3' }) => {
  const isLow  = value < 20;
  const isMid  = value < 50 && !isLow;
  const gradient = isLow
    ? 'from-red-600 to-red-400'
    : isMid
    ? 'from-orange-500 to-yellow-400'
    : baseGradient;
  const labelColor = isLow ? 'text-red-400' : isMid ? 'text-orange-400' : 'text-gray-400';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-bold uppercase w-10 text-right ${labelColor}`}>{label}</span>
      <div className={`flex-1 ${height} bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/40`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} ${isLow ? 'animate-pulse' : ''}`}
          animate={{ width: `${Math.max(0, value)}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 12 }}
        />
      </div>
      <span className={`text-[10px] font-mono w-7 text-right ${isLow ? 'text-red-400 font-bold' : isMid ? 'text-orange-400' : 'text-gray-500'}`}>
        {Math.ceil(value)}
      </span>
    </div>
  );
};

// ─── Fighter HUD: compact status card for one fighter ────────────────────────
const FighterHUD: React.FC<{
  name: string;
  hs: HealthStatus;
  isPlayer: boolean;
  align?: 'left' | 'right';
}> = ({ name, hs, isPlayer, align = 'left' }) => {
  const nameColor  = isPlayer ? 'text-neon-green glow-electric' : 'text-alert-red glow-crimson';
  const gradient   = isPlayer ? 'from-neon-green to-emerald-400' : 'from-alert-red to-orange-500';

  return (
    <motion.div
      className="glass-card rounded-2xl p-4 space-y-2"
      initial={{ opacity: 0, x: isPlayer ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Fighter name */}
      <div className={`flex items-center justify-between mb-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <h3 className={`font-black text-base truncate ${nameColor}`}>{name}</h3>
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">
          {isPlayer ? '👊 FIGHTER' : '🥊 OPPONENT'}
        </span>
      </div>

      {/* Stamina bar — large, prominent */}
      <div>
        <div className="flex justify-between text-[9px] text-gray-500 mb-1">
          <span className="uppercase tracking-widest font-bold">Stamina</span>
          <span className={`font-bold ${hs.stamina < 20 ? 'text-red-400 animate-pulse' : hs.stamina < 40 ? 'text-orange-400' : 'text-cyan-400'}`}>
            {Math.ceil(hs.stamina)}%
          </span>
        </div>
        <div className="h-4 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/40">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${
              hs.stamina < 20
                ? 'from-red-600 to-red-400 animate-pulse'
                : hs.stamina < 40
                ? 'from-orange-500 to-yellow-400'
                : 'from-cyan-500 to-blue-400'
            }`}
            animate={{ width: `${Math.max(0, hs.stamina)}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 12 }}
          />
        </div>
      </div>

      {/* Head / Body / Legs */}
      <div className="space-y-1.5 pt-1">
        <PartBar label="HEAD" value={hs.head} baseGradient={gradient} />
        <PartBar label="BODY" value={hs.body} baseGradient={gradient} />
        <PartBar label="LEGS" value={hs.legs} baseGradient={gradient} />
      </div>
    </motion.div>
  );
};

const BattleScreen: React.FC<BattleScreenProps> = ({
  fighter,
  opponent,
  currentRound,
  timeRemaining,
  playerHS,
  opponentHS,
  battleLog,
  battleLogRef,
  roundStats,
  fightPhase,
  groundAttackerName,
  t,
}) => {
  const isGround = fightPhase === 'GROUND';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* ROUND & TIMER */}
      <motion.div
        className="glass-card-premium rounded-2xl p-6 flex justify-between items-center"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        <div className="text-center flex-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t('round')}</p>
          <p className="text-4xl font-bold text-neon-green">{currentRound}/3</p>
        </div>

        <div className="text-center flex-1 border-x border-gray-700 px-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t('time')}</p>
          <motion.div
            className="font-mono text-5xl font-bold text-alert-red glow-crimson"
            animate={{ scale: timeRemaining <= 10 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.5, repeat: timeRemaining <= 10 ? Infinity : 0 }}
          >
            0:{timeRemaining < 10 ? '0' : ''}
            {timeRemaining}
          </motion.div>
        </div>

        <div className="text-center flex-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t('status')}</p>
          <p className="text-lg font-semibold text-cyan-400 animate-pulse">● {t('live').toUpperCase()}</p>
        </div>
      </motion.div>

      {/* FIGHT PHASE INDICATOR */}
      <AnimatePresence mode="wait">
        {isGround ? (
          <motion.div
            key="ground"
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl px-6 py-4 border-2 border-orange-500/70 bg-orange-950/50 flex items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0"
            />
            <div className="flex-1">
              <p className="text-orange-400 font-black uppercase tracking-widest text-sm">
                ⚠️ GROUND GAME — fight on the mat
              </p>
              {groundAttackerName && (
                <p className="text-orange-300/90 text-xs mt-0.5">
                  🔝 <span className="font-bold">{groundAttackerName}</span> controls from top position
                </p>
              )}
            </div>
            <span className="text-3xl">🤼</span>
          </motion.div>
        ) : (
          <motion.div
            key="standing"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl px-6 py-4 border border-gray-700/60 bg-gray-900/30 flex items-center gap-4"
          >
            <div className="w-3 h-3 rounded-full bg-neon-green flex-shrink-0" />
            <div className="flex-1">
              <p className="text-neon-green font-bold uppercase tracking-widest text-sm">
                STAND-UP — striking range
              </p>
              <p className="text-gray-500 text-xs mt-0.5">fighters on their feet</p>
            </div>
            <span className="text-3xl">🥊</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PAPER DOLL HUD — Localized Damage Display ─────────────── */}
      <div className="grid grid-cols-2 gap-6">
        <FighterHUD name={fighter.name} hs={playerHS}   isPlayer={true}  align="left"  />
        <FighterHUD name={opponent.name} hs={opponentHS} isPlayer={false} align="right" />
      </div>

      {/* BATTLE LOG */}
      <motion.div
        className="glass-card-premium rounded-2xl p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="section-header text-gray-300 mb-4 sticky top-0 bg-gray-900/90 py-2">
          {t('live_commentary').toUpperCase()}
        </h3>
        <div ref={battleLogRef} className="h-80 overflow-y-auto space-y-2 pr-2">
          <AnimatePresence>
            {battleLog.map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ROUND STATS */}
      <div className="grid grid-cols-2 gap-4 glass-card rounded-2xl p-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('your_damage')}</p>
          <p className="text-3xl font-bold text-neon-green">{roundStats.playerDamage}</p>
          <p className="text-xs text-gray-400 mt-1">({roundStats.playerHits} {t('hits')})</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('opponent_damage')}</p>
          <p className="text-3xl font-bold text-alert-red">{roundStats.opponentDamage}</p>
          <p className="text-xs text-gray-400 mt-1">({roundStats.opponentHits} {t('hits')})</p>
        </div>
      </div>
    </motion.div>
  );
};

// ============ LOG ENTRY WITH TYPEWRITER EFFECT ============

const LogEntry: React.FC<{ entry: BattleLogEntry }> = ({ entry }) => {
  const [displayedText, setDisplayedText] = useState('');
  const isCritical = entry.category === 'CRITICAL_HIT' || entry.category === 'FINISHER';
  const isNegative = entry.category === 'MISS' || entry.category === 'DODGE';
  const isGround = (
    entry.category === 'GROUND_CONTROL' ||
    entry.category === 'SUBMISSION_ATTEMPT' ||
    entry.category === 'SUBMISSION_ESCAPE'
  );
  const isTakedown = entry.category === 'TAKEDOWN_ATTEMPT' || entry.category === 'TAKEDOWN_DEFENSE';

  useEffect(() => {
    let currentIndex = 0;
    const fullText = entry.message;
    const charactersPerTick = 1;
    const tickDuration = 60; // 60ms per character for dramatic pacing

    const typewriter = setInterval(() => {
      if (currentIndex < fullText.length) {
        currentIndex += charactersPerTick;
        setDisplayedText(fullText.substring(0, currentIndex));
      } else {
        clearInterval(typewriter);
      }
    }, tickDuration);

    return () => clearInterval(typewriter);
  }, [entry.message]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`text-sm font-mono leading-relaxed ${
        isCritical
          ? 'font-bold text-alert-red glow-crimson text-base'
          : isNegative
            ? 'italic text-gray-500'
          : isTakedown
            ? 'font-semibold text-yellow-400'
          : isGround && entry.category === 'SUBMISSION_ATTEMPT'
            ? 'font-bold text-orange-400'
          : isGround && entry.category === 'SUBMISSION_ESCAPE'
            ? 'italic text-cyan-400'
          : isGround
            ? 'text-orange-300'
            : 'text-gray-300'
      }`}
    >
      {displayedText}
      {displayedText.length < entry.message.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-2 h-4 bg-neon-green ml-1"
        />
      )}
    </motion.div>
  );
};

// ============ RESULT SCREEN ============

interface ResultScreenProps {
  result: { winner: 'player' | 'opponent' | 'draw'; method: string };
  roundStats: RoundResult;
  onReset: () => void;
  t: (key: string) => string;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, roundStats, onReset, t }) => {
  const isVictory = result.winner === 'player';
  const isDraw = result.winner === 'draw';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="glass-card-premium rounded-2xl p-12 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 1 }}
        className="text-8xl mb-6"
      >
        {isVictory ? '🏆' : isDraw ? '🤝' : '😔'}
      </motion.div>

      <h1
        className="page-header text-6xl mb-4"
        style={{ color: isVictory ? '#00ff41' : isDraw ? '#fbbf24' : '#dc143c' }}
      >
        {isVictory ? t('victory').toUpperCase() : isDraw ? t('draw').toUpperCase() : t('defeat').toUpperCase()}
      </h1>

      <p className="text-gray-400 text-xl uppercase tracking-widest mb-10">{result.method}</p>

      <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-900/40 p-8 rounded-lg">
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">{t('your_damage')}</p>
          <p className="text-4xl font-bold text-neon-green">{roundStats.playerDamage}</p>
          <p className="text-sm text-gray-500 mt-2">({roundStats.playerHits} {t('hits')})</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">{t('opponent_damage')}</p>
          <p className="text-4xl font-bold text-alert-red">{roundStats.opponentDamage}</p>
          <p className="text-sm text-gray-500 mt-2">({roundStats.opponentHits} {t('hits')})</p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        className="px-10 py-4 bg-gradient-to-r from-neon-green to-emerald-400 text-black font-bold uppercase tracking-wider rounded-lg hover:shadow-xl hover:shadow-neon-green/50 transition-all text-lg"
      >
        {t('return_to_arena')}
      </motion.button>
    </motion.div>
  );
};

// ============ SETUP SCREEN ============

interface SetupScreenProps {
  fighter: any;
  opponents: AIFighter[];
  selectedOpponent: AIFighter | null;
  onSelectOpponent: (opp: AIFighter) => void;
  onStartBattle: () => void;
  canFight: boolean;
  loading: boolean;
  error: string | null;
  t: (key: string) => string;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  fighter,
  opponents,
  selectedOpponent,
  onSelectOpponent,
  onStartBattle,
  canFight,
  loading,
  error,
  t,
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-4">
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Zap size={44} className="text-alert-red glow-crimson" />
          </motion.div>
          <h1 className="page-header text-alert-red glow-crimson text-6xl">{t('pvp_arena').toUpperCase()}</h1>
        </div>
        <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
          {canFight
            ? t('welcome_fighter').replace('{name}', fighter?.name || '')
            : !fighter || fighter.name === 'Undefined'
              ? t('create_fighter_first')
              : t('need_energy')}
        </p>
      </motion.div>

      {/* Can't Fight Messages */}
      {!canFight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-premium rounded-2xl p-12 text-center border-2 border-dashed"
          style={{
            borderColor: !fighter || fighter.name === 'Undefined' ? '#dc143c' : '#fbbf24',
          }}
        >
          <motion.div
            className="text-7xl mb-6"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {!fighter || fighter.name === 'Undefined' ? '⚡' : '😴'}
          </motion.div>
          <h3
            className="section-header text-4xl mb-4"
            style={{
              color: !fighter || fighter.name === 'Undefined' ? '#dc143c' : '#fbbf24',
            }}
          >
            {!fighter || fighter.name === 'Undefined' ? t('no_fighter') : t('low_energy')}
          </h3>
          <p className="text-gray-400 uppercase tracking-widest">
            {!fighter || fighter.name === 'Undefined'
              ? t('create_fighter_dashboard')
              : t('need_energy_current').replace('{energy}', Math.ceil(fighter?.currentEnergy || 0).toString())}
          </p>
        </motion.div>
      )}

      {/* Error State */}
      {canFight && error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-premium rounded-2xl p-8 text-center border-2 border-alert-red"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="section-header text-alert-red text-2xl mb-3">{t('matchmaking_error')}</h3>
          <p className="text-gray-400">{error}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {canFight && loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-neon-green/20 border-t-neon-green rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400 uppercase tracking-wider text-sm">{t('finding_opponents')}</p>
          </div>
        </motion.div>
      )}

      {/* Opponent Selection */}
      {canFight && !loading && !error && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-premium rounded-2xl p-8 border-l-4 border-alert-red"
          >
            <h3 className="section-header text-alert-red text-2xl mb-6 text-center">{t('choose_opponent')}</h3>
            <div className="grid grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">{t('your_fighter')}</p>
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  👊
                </motion.div>
                <p className="text-xl font-bold text-neon-green glow-electric">{fighter?.name}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {fighter?.record.wins}W-{fighter?.record.losses}L-{fighter?.record.draws}D
                </p>
              </div>

              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-6xl font-black text-alert-red glow-crimson"
                >
                  VS
                </motion.div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">
                  {selectedOpponent ? t('selected') : t('choose_below')}
                </p>
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ scale: [1, 0.9, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🥊
                </motion.div>
                <p className="text-xl font-bold text-alert-red">
                  {selectedOpponent?.name || t('select_opponent')}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {opponents.map((opp, idx) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                <motion.div
                  onClick={() => onSelectOpponent(opp)}
                  className={`cursor-pointer transition-all ${
                    selectedOpponent?.id === opp.id ? 'ring-4 ring-neon-green rounded-2xl' : ''
                  }`}
                  whileHover={{ scale: 1.03 }}
                >
                  <OpponentCard opponent={opp} />
                </motion.div>

                {selectedOpponent?.id === opp.id && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={onStartBattle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-neon-green to-emerald-400 text-black font-bold uppercase tracking-wider rounded-lg hover:shadow-xl hover:shadow-neon-green/60 transition-all text-lg"
                  >
                    ⚡ {t('start_fight').toUpperCase()}
                  </motion.button>
                )}
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
};
