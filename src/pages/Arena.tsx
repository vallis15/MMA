import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFighter } from '../context/FighterContext';
import { useLanguage } from '../context/LanguageContext';
import { OpponentCard } from '../components/OpponentCard';
import { FighterSilhouette } from '../components/FighterSilhouette';
import { AIFighter, FighterStats, DetailedFighterStats } from '../types';
import { supabase } from '../lib/supabase';
import { getBattleMessage, BattleCategory, MMA_MOVES, TAKEDOWN_MOVES, SUBMISSION_MOVES } from '../constants/battlePhrases';
import { getSkillById } from '../constants/skillTree';
import type { SkillDomain, MechanicTrigger, MechanicEffect } from '../types/skills';

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
  /** When true this entry represents a skill activation – rendered with neon domain colour + pulse. */
  isSkillTrigger?: boolean;
  /** Which domain the triggered skill belongs to (for colour coding). */
  skillDomain?: SkillDomain;
}

/** Shape of a resolved skill trigger result returned by evaluateSkillTriggers(). */
interface SkillTriggerResult {
  skillId: string;
  skillName: string;
  domain: SkillDomain;
  effect: MechanicEffect;
  effectValue?: number;
  logText: string;
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

// ============ SKILL TRIGGER ENGINE ============

/** Neon accent colours per skill domain – used in the battle log. */
const DOMAIN_COLORS: Record<SkillDomain, string> = {
  striking:  '#ff1744',   // red
  wrestling: '#ffd600',   // gold
  bjj:       '#ce93d8',   // purple
  defense:   '#00e5ff',   // cyan
};

/**
 * Evaluates which skills fire for the current combat event.
 *
 * Trigger routing:
 *  • on_attack / on_takedown_attempt  → attacker's skills only
 *  • on_defend / on_low_health        → defender's skills only
 *  • legacy symmetric triggers        → both sides, filtered by mechanic.isDefensive
 *
 * Chance normalisation: values > 1 are treated as 0–100 integers (÷ 100).
 */
const evaluateSkillTriggers = (
  attackerSkillIds: string[],
  defenderSkillIds: string[],
  triggerType: MechanicTrigger,
  _currentPhase: FightPhase,
): SkillTriggerResult[] => {
  const results: SkillTriggerResult[] = [];

  const tryFire = (id: string, isDefender: boolean) => {
    const node = getSkillById(id);
    if (!node?.mechanic) return;
    const m = node.mechanic;
    if (m.trigger !== triggerType) return;
    // Respect explicit isDefensive flag when set
    if (m.isDefensive === true  && !isDefender) return;
    if (m.isDefensive === false &&  isDefender) return;
    // Normalise chance: new skills use 0-100 int, legacy use 0-1 decimal
    const normalizedChance = m.chance > 1 ? m.chance / 100 : m.chance;
    if (Math.random() < normalizedChance) {
      results.push({
        skillId:     id,
        skillName:   node.name,
        domain:      node.domain,
        effect:      m.effect,
        effectValue: m.effectValue,
        logText:     m.logText,
      });
    }
  };

  if (triggerType === 'on_attack' || triggerType === 'on_takedown_attempt') {
    attackerSkillIds.forEach(id => tryFire(id, false));
  } else if (
    triggerType === 'on_defend' ||
    triggerType === 'on_low_health' ||
    triggerType === 'on_miss_received'
  ) {
    defenderSkillIds.forEach(id => tryFire(id, true));
  } else {
    // Legacy / symmetric triggers – let isDefensive flag filter direction
    attackerSkillIds.forEach(id => tryFire(id, false));
    defenderSkillIds.forEach(id => tryFire(id, true));
  }

  return results;
};

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

  // ── Skill system: stun turns remaining + permanent fracture debuff ──────
  const stunRef      = useRef<{ player: number; opponent: number }>({ player: 0, opponent: 0 });
  const fractureRef  = useRef<{ player: boolean; opponent: boolean }>({ player: false, opponent: false });
  // Mirror of fighter.unlocked_skills – kept in a ref so the queue processor
  // always reads the latest value without stale-closure issues.
  const playerSkillsRef = useRef<string[]>([]);

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

  // Ref zrcadlí fighter – předchází stale closure při zápisu výsledku do Supabase
  const fighterRef = useRef(fighter);
  useEffect(() => { fighterRef.current = fighter; }, [fighter]);
  // Keep skill ref in sync with fighter state
  useEffect(() => { playerSkillsRef.current = fighter?.unlocked_skills ?? []; }, [fighter]);

  // Battle result
  const [battleResult, setBattleResult] = useState<{
    winner: 'player' | 'opponent' | 'draw';
    method: string;
  } | null>(null);

  // Fight phase (standup vs ground)
  const [fightPhase, setFightPhase] = useState<FightPhase>('STANDUP');
  const [groundAttackerName, setGroundAttackerName] = useState<string | null>(null);

  // Paper Doll — last hit zone + hit category + current attacker
  const [lastPlayerHitPart, setLastPlayerHitPart] = useState<BodyPart | null>(null);
  const [lastOpponentHitPart, setLastOpponentHitPart] = useState<BodyPart | null>(null);
  const [lastPlayerHitCategory, setLastPlayerHitCategory] = useState<string | null>(null);
  const [lastOpponentHitCategory, setLastOpponentHitCategory] = useState<string | null>(null);
  const [currentAttacker, setCurrentAttacker] = useState<'player' | 'opponent' | null>(null);
  // Kdo je na pozici TOP v ground game (pro FighterSilhouette groundPosition)
  const [groundTopFighter, setGroundTopFighter] = useState<'player' | 'opponent' | null>(null);

  // Screen shake
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Floating skill activation popup
  const [activeSkillPopup, setActiveSkillPopup] = useState<{
    skillName: string;
    logText: string;
    domain: SkillDomain;
  } | null>(null);
  const skillPopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          .select('id, username, reputation, wins, losses, draws, strength, speed, cardio, striking, grappling')
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

    // ── STUN CHECK: skip this event if the attacker is stunned ───────────────
    if (stunRef.current[event.attacker] > 0) {
      stunRef.current = {
        ...stunRef.current,
        [event.attacker]: stunRef.current[event.attacker] - 1,
      };
      const stunMsg = `🌀 ${attackerName} is still stunned — turn skipped!`;
      setBattleLog(log => [
        ...log,
        { id: `stun-skip-${event.id}`, message: stunMsg, category: 'DODGE' as BattleCategory, displayTime: Date.now() },
      ]);
      const skipPause = 900 + Math.random() * 500;
      setTimeout(() => {
        isProcessingQueueRef.current = false;
        processNextQueuedEvent();
      }, skipPause);
      return;
    }

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
      setGroundTopFighter(event.groundAttacker);
    } else if (event.phase === 'STANDUP') {
      setGroundAttackerName(null);
      setGroundTopFighter(null);
    }

    // Nastav aktuálního útčníka pro glow efekt na silhouette
    setCurrentAttacker(event.attacker);
    // Zastav glow po 700ms
    setTimeout(() => setCurrentAttacker(null), 700);

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

        // ── SKILL TRIGGER EVALUATION ─────────────────────────────────────────
        // attackerSkillIds: player's skills when player attacks; [] when AI attacks
        // defenderSkillIds: player's skills when player defends; [] when player attacks
        const attackerSkillIds = event.attacker === 'player' ? playerSkillsRef.current : [];
        const defenderSkillIds = event.attacker === 'player' ? [] : playerSkillsRef.current;
        let effectiveDamage = event.damage;
        const skillLogEntries: BattleLogEntry[] = [];

        // 1. on_defend — defender skills fire FIRST; DODGE can zero out damage
        const defendResults = evaluateSkillTriggers(attackerSkillIds, defenderSkillIds, 'on_defend', event.phase);
        for (const r of defendResults) {
          skillLogEntries.push({
            id: `sk-def-${r.skillId}-${Date.now()}`,
            message: `[SKILL: ${r.skillName}] ${r.logText}`,
            category: event.category,
            displayTime: Date.now(),
            isSkillTrigger: true,
            skillDomain: r.domain,
          });
          if (r.effect === 'reflect_damage' || r.effect === 'intercept') {
            // Defender negates the incoming damage
            effectiveDamage = 0;
          } else if (r.effect === 'counter' || r.effect === 'auto_counter') {
            // Immediately queue a counter-strike at the front of the display queue
            const ctrAtk: 'player' | 'opponent' = event.attacker === 'player' ? 'opponent' : 'player';
            const ctrAtkName = ctrAtk === 'player' ? fighter!.name : selectedOpponent!.name;
            const ctrDefName = ctrAtk === 'player' ? selectedOpponent!.name : fighter!.name;
            const ctrDmg = Math.round(10 + Math.random() * 12 + (r.effectValue ?? 0));
            const counterEv: BattleEvent = {
              id: `ctr-${Date.now()}`,
              timestamp: event.timestamp,
              attacker: ctrAtk,
              category: 'MEDIUM_HIT',
              move: 'counter strike',
              damage: ctrDmg,
              targetPart: 'head',
              phase: event.phase,
            };
            displayQueueRef.current.unshift({
              event: counterEv,
              attackerName: ctrAtkName,
              defenderName: ctrDefName,
            });
          }
        }

        // 2. on_attack / on_takedown_attempt — attacker skills fire next
        const attackTrigger: MechanicTrigger =
          event.category === 'TAKEDOWN_ATTEMPT' ? 'on_takedown_attempt' : 'on_attack';
        const attackResults = evaluateSkillTriggers(attackerSkillIds, defenderSkillIds, attackTrigger, event.phase);
        for (const r of attackResults) {
          skillLogEntries.push({
            id: `sk-atk-${r.skillId}-${Date.now()}`,
            message: `[SKILL: ${r.skillName}] ${r.logText}`,
            category: event.category,
            displayTime: Date.now(),
            isSkillTrigger: true,
            skillDomain: r.domain,
          });
          if (r.effect === 'extra_damage' || r.effect === 'knockdown') {
            effectiveDamage += r.effectValue ?? 10;
          } else if (r.effect === 'stun') {
            const defKey: 'player' | 'opponent' = event.attacker === 'player' ? 'opponent' : 'player';
            stunRef.current[defKey] = Math.max(stunRef.current[defKey], r.effectValue ?? 1);
          } else if (r.effect === 'fracture') {
            const defKey: 'player' | 'opponent' = event.attacker === 'player' ? 'opponent' : 'player';
            fractureRef.current[defKey] = true;
          } else if (r.effect === 'leg_catch' || r.effect === 'intercept') {
            effectiveDamage += r.effectValue ?? 8;
          } else if (r.effect === 'slam') {
            effectiveDamage += r.effectValue ?? 12;
          }
        }

        // 3. Fracture: permanently fractured fighters deal 30 % less damage
        if (fractureRef.current[event.attacker as 'player' | 'opponent']) {
          effectiveDamage = Math.round(effectiveDamage * 0.7);
        }
        // ─────────────────────────────────────────────────────────────────────

        if (isPlayerAttacking) {
          // ── Damage to opponent's body part ──
          const newOppHS = {
            ...opponentHSRef.current,
            [tPart]: Math.max(0, opponentHSRef.current[tPart] - effectiveDamage),
          };
          opponentHSRef.current = newOppHS;
          setOpponentHS(newOppHS);
          // Nastav hit zone na soupeři pro flash animaci siluety
          setLastOpponentHitPart(tPart);
          setTimeout(() => setLastOpponentHitPart(null), 400);
          // Track hit category for critical shake
          setLastOpponentHitCategory(event.category);
          setTimeout(() => setLastOpponentHitCategory(null), 400);
          playerHSRef.current = { ...playerHSRef.current, stamina: Math.max(5, playerHSRef.current.stamina - drain) };
          setPlayerHS({ ...playerHSRef.current });
          opponentHSRef.current = { ...opponentHSRef.current, stamina: Math.min(100, opponentHSRef.current.stamina + 1) };
          setOpponentHS({ ...opponentHSRef.current });

          setRoundStats((stats) => {
            const next = { ...stats, playerDamage: stats.playerDamage + effectiveDamage, playerHits: stats.playerHits + 1 };
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
            [tPart]: Math.max(0, playerHSRef.current[tPart] - effectiveDamage),
          };
          playerHSRef.current = newPlHS;
          setPlayerHS(newPlHS);
          // Nastav hit zone na háčeči pro flash animaci siluety
          setLastPlayerHitPart(tPart);
          setTimeout(() => setLastPlayerHitPart(null), 400);
          // Track hit category for critical shake
          setLastPlayerHitCategory(event.category);
          setTimeout(() => setLastPlayerHitCategory(null), 400);
          // Drain opponent stamina, slight recovery for player
          opponentHSRef.current = { ...opponentHSRef.current, stamina: Math.max(5, opponentHSRef.current.stamina - drain) };
          setOpponentHS({ ...opponentHSRef.current });
          playerHSRef.current = { ...playerHSRef.current, stamina: Math.min(100, playerHSRef.current.stamina + 1) };
          setPlayerHS({ ...playerHSRef.current });

          setRoundStats((stats) => {
            const next = { ...stats, opponentDamage: stats.opponentDamage + effectiveDamage, opponentHits: stats.opponentHits + 1 };
            roundStatsRef.current = next;
            return next;
          });

          // ── on_low_health: player survival skills (Zombie Mode etc.) ─────────
          const playerTotalHP = newPlHS.head + newPlHS.body + newPlHS.legs;
          if (playerTotalHP <= 105 && !battleEndedRef.current) {
            const lowHpResults = evaluateSkillTriggers(
              attackerSkillIds, defenderSkillIds, 'on_low_health', event.phase,
            );
            for (const r of lowHpResults) {
              skillLogEntries.push({
                id: `sk-lh-${r.skillId}-${Date.now()}`,
                message: `[SKILL: ${r.skillName}] ${r.logText}`,
                category: 'HEAVY_HIT',
                displayTime: Date.now(),
                isSkillTrigger: true,
                skillDomain: r.domain,
              });
              // zombie_mode: survive a lethal hit by restoring the damaged body part
              if (r.effect === 'zombie_mode' && newPlHS[tPart] <= 0) {
                const restoreAmt = r.effectValue ?? 15;
                const zombieHS: HealthStatus = { ...playerHSRef.current, [tPart]: restoreAmt };
                playerHSRef.current = zombieHS;
                setPlayerHS(zombieHS);
              }
              // stamina_restore: recover some stamina on the brink
              if (r.effect === 'stamina_restore') {
                const restoreAmt = r.effectValue ?? 20;
                const recoveredHS: HealthStatus = {
                  ...playerHSRef.current,
                  stamina: Math.min(100, playerHSRef.current.stamina + restoreAmt),
                };
                playerHSRef.current = recoveredHS;
                setPlayerHS(recoveredHS);
              }
            }
          }

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

        // ── Flush skill trigger log entries to battle log ─────────────────────
        if (skillLogEntries.length > 0) {
          setBattleLog(log => [...log, ...skillLogEntries]);
          // Show floating overlay popup for the first triggered skill
          const first = skillLogEntries.find(e => e.isSkillTrigger && e.skillDomain);
          if (first && first.skillDomain) {
            if (skillPopupTimeoutRef.current) clearTimeout(skillPopupTimeoutRef.current);
            const rawName = first.message.match(/\[SKILL:\s*([^\]]+)\]/)?.[1]?.trim() ?? '';
            const rawText = first.message.replace(/^\[SKILL:[^\]]+\]\s*/, '');
            setActiveSkillPopup({ skillName: rawName, logText: rawText, domain: first.skillDomain });
            skillPopupTimeoutRef.current = setTimeout(() => setActiveSkillPopup(null), 2800);
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
    stunRef.current = { player: 0, opponent: 0 };
    fractureRef.current = { player: false, opponent: false };
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
    stunRef.current = { player: 0, opponent: 0 };
    fractureRef.current = { player: false, opponent: false };
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
    setGroundTopFighter(null);
    setLastPlayerHitPart(null);
    setLastOpponentHitPart(null);
    setLastPlayerHitCategory(null);
    setLastOpponentHitCategory(null);
    setCurrentAttacker(null);

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

    // Update database ONLY NOW — use fighterRef.current to avoid stale closure
    const currentFighter = fighterRef.current;
    if (currentFighter) {
      // ── Dynamic energy cost based on fight difficulty ──────────────────────
      const totalPlayerHPLeft = playerHSRef.current.head + playerHSRef.current.body + playerHSRef.current.legs;
      const hpLostFraction = (300 - totalPlayerHPLeft) / 300;

      let energyCost: number;
      const isKO = method.includes('Knockout') || method.includes('TKO') || method.includes('Submission');
      if (finalWinner === 'player') {
        energyCost = Math.round(20 + hpLostFraction * 55);
        if (isKO) energyCost = Math.min(55, Math.round(energyCost * 1.1));
      } else if (finalWinner === 'opponent') {
        energyCost = Math.round(45 + hpLostFraction * 45);
        if (isKO) energyCost = Math.min(80, Math.round(energyCost * 1.2));
      } else {
        energyCost = Math.round(30 + hpLostFraction * 30);
      }
      energyCost = Math.max(15, Math.min(80, energyCost));

      const energyAfter    = Math.max(0, currentFighter.currentEnergy - energyCost);
      const xpGain         = 50 + roundStatsRef.current.playerDamage;
      const reputationGain = finalWinner === 'player'
        ? 10 + roundStatsRef.current.playerHits * 2
        : finalWinner === 'draw' ? 2 : 0;

      // ── Determine method category for stats ───────────────────────────────
      const methodCat: 'ko' | 'submission' | 'decision' =
        method.toLowerCase().includes('submission') ? 'submission' :
        (method.includes('Knockout') || method.includes('TKO')) ? 'ko' : 'decision';

      // ── Build profile update payload ──────────────────────────────────────
      const profileUpdate: Record<string, unknown> = {
        energy:              energyAfter,
        experience:          (currentFighter.experience || 0) + xpGain,
        total_fights:        (currentFighter.record.wins + currentFighter.record.losses + currentFighter.record.draws) + 1,
        total_damage_dealt:  roundStatsRef.current.playerDamage,
        total_damage_taken:  roundStatsRef.current.opponentDamage,
        total_hits_landed:   roundStatsRef.current.playerHits,
        last_fight_at:       new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      };

      if (finalWinner === 'player') {
        profileUpdate.wins         = (currentFighter.record.wins || 0) + 1;
        profileUpdate.reputation   = (currentFighter.reputation || 0) + reputationGain;
        if (methodCat === 'ko')          profileUpdate.wins_by_ko         = 1;
        else if (methodCat === 'submission') profileUpdate.wins_by_submission = 1;
        else                             profileUpdate.wins_by_decision   = 1;
      } else if (finalWinner === 'opponent') {
        profileUpdate.losses       = (currentFighter.record.losses || 0) + 1;
        if (methodCat === 'ko')          profileUpdate.losses_by_ko         = 1;
        else if (methodCat === 'submission') profileUpdate.losses_by_submission = 1;
        else                             profileUpdate.losses_by_decision   = 1;
      } else {
        profileUpdate.draws        = (currentFighter.record.draws || 0) + 1;
      }

      // ── Write profile update ──────────────────────────────────────────────
      supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', currentFighter.id)
        .then(() => reloadFighter());

      // ── Insert fight_history row ──────────────────────────────────────────
      const opponentRef = selectedOpponent;
      if (opponentRef) {
        const isAIOpponent = opponentRef.id.startsWith('ai_');
        supabase
          .from('fight_history')
          .insert({
            fighter_id:          currentFighter.id,
            opponent_id:         isAIOpponent ? null : opponentRef.id,
            opponent_name:       opponentRef.name,
            opponent_nickname:   opponentRef.nickname ?? null,
            result:              finalWinner === 'player' ? 'win' : finalWinner === 'opponent' ? 'loss' : 'draw',
            method,
            method_category:     methodCat,
            rounds_completed:    currentRoundRef.current,
            damage_dealt:        roundStatsRef.current.playerDamage,
            damage_taken:        roundStatsRef.current.opponentDamage,
            hits_landed:         roundStatsRef.current.playerHits,
            hits_received:       roundStatsRef.current.opponentHits,
            energy_cost:         energyCost,
            reputation_gain:     reputationGain,
            xp_gain:             xpGain,
            fighter_level:       currentFighter.level,
            fighter_reputation:  currentFighter.reputation,
            // Fighter stats snapshot
            snap_strength:   currentFighter.stats?.strength  ?? null,
            snap_speed:      currentFighter.stats?.speed     ?? null,
            snap_cardio:     currentFighter.stats?.cardio    ?? null,
            snap_striking:   currentFighter.stats?.striking  ?? null,
            snap_grappling:  currentFighter.stats?.grappling ?? null,
            // Opponent stats snapshot
            opp_snap_strength:   opponentRef.stats?.strength  ?? null,
            opp_snap_speed:      opponentRef.stats?.speed     ?? null,
            opp_snap_cardio:     opponentRef.stats?.cardio    ?? null,
            opp_snap_striking:   opponentRef.stats?.striking  ?? null,
            opp_snap_grappling:  opponentRef.stats?.grappling ?? null,
          })
          .then(({ error: insErr }) => {
            if (insErr) console.error('❌ [FIGHT HISTORY] Insert error:', insErr.message);
            else console.log('✅ [FIGHT HISTORY] Fight saved to history');
          });
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
    setGroundTopFighter(null);
    setLastPlayerHitPart(null);
    setLastOpponentHitPart(null);
    setLastPlayerHitCategory(null);
    setLastOpponentHitCategory(null);
    setCurrentAttacker(null);
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
              lastPlayerHitPart={lastPlayerHitPart}
              lastOpponentHitPart={lastOpponentHitPart}
              lastPlayerHitCategory={lastPlayerHitCategory}
              lastOpponentHitCategory={lastOpponentHitCategory}
              currentAttacker={currentAttacker}
              groundTopFighter={groundTopFighter}
              activeSkillPopup={activeSkillPopup}
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
  /** Paperdoll props */
  lastPlayerHitPart: BodyPart | null;
  lastOpponentHitPart: BodyPart | null;
  lastPlayerHitCategory: string | null;
  lastOpponentHitCategory: string | null;
  currentAttacker: 'player' | 'opponent' | null;
  groundTopFighter: 'player' | 'opponent' | null;
  activeSkillPopup: { skillName: string; logText: string; domain: SkillDomain } | null;
  t: (key: string) => string;
}

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
  lastPlayerHitPart,
  lastOpponentHitPart,
  lastPlayerHitCategory,
  lastOpponentHitCategory,
  currentAttacker,
  groundTopFighter,
  activeSkillPopup,
  t,
}) => {
  const isGround = fightPhase === 'GROUND';
  const playerGroundPos = isGround
    ? groundTopFighter === 'player' ? 'TOP' : 'BOTTOM'
    : null;
  const opponentGroundPos = isGround
    ? groundTopFighter === 'opponent' ? 'TOP' : 'BOTTOM'
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
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

      {/* ─── SKILL ACTIVATION POPUP OVERLAY ───────────────────────────────────── */}
      <AnimatePresence>
        {activeSkillPopup && (
          <motion.div
            key="skill-popup"
            initial={{ opacity: 0, scale: 0.75, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -10 }}
            transition={{ type: 'spring', stiffness: 480, damping: 28 }}
            className="pointer-events-none"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 18px ${DOMAIN_COLORS[activeSkillPopup.domain]}44`,
                  `0 0 38px ${DOMAIN_COLORS[activeSkillPopup.domain]}88`,
                  `0 0 18px ${DOMAIN_COLORS[activeSkillPopup.domain]}44`,
                ],
              }}
              transition={{ duration: 0.75, repeat: 2 }}
              className="rounded-2xl px-5 py-3 flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, #080810, #10101a)',
                border: `2px solid ${DOMAIN_COLORS[activeSkillPopup.domain]}`,
                boxShadow: `0 0 28px ${DOMAIN_COLORS[activeSkillPopup.domain]}50`,
              }}
            >
              {/* Pulsing icon */}
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 0.55, repeat: Infinity }}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: `${DOMAIN_COLORS[activeSkillPopup.domain]}18`,
                  border: `2px solid ${DOMAIN_COLORS[activeSkillPopup.domain]}`,
                }}
              >
                <Zap size={17} style={{ color: DOMAIN_COLORS[activeSkillPopup.domain] }} />
              </motion.div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.28em] mb-0.5"
                  style={{ color: `${DOMAIN_COLORS[activeSkillPopup.domain]}99` }}
                >
                  ⚡ SKILL AKTIVOVÁN — {activeSkillPopup.skillName}
                </p>
                <p
                  className="text-sm font-bold leading-snug"
                  style={{
                    color: DOMAIN_COLORS[activeSkillPopup.domain],
                    textShadow: `0 0 10px ${DOMAIN_COLORS[activeSkillPopup.domain]}`,
                  }}
                >
                  {activeSkillPopup.logText}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 3-COLUMN LAYOUT: Silhouette | Log | Silhouette ────────────────────── */}
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 items-start">

        {/* ─ LEFT: Player silhouette ─ */}
        <div className="rounded-2xl p-3 flex flex-col items-center"
             style={{
               background: 'rgba(0,229,255,0.03)',
               border: '1px solid rgba(0,229,255,0.18)',
               boxShadow: '0 0 20px rgba(0,229,255,0.06) inset',
             }}>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: '0 0 6px #00e5ff' }} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]"
               style={{ color: '#00e5ff', textShadow: '0 0 8px #00e5ff88' }}>YOU</p>
          </div>
          <FighterSilhouette
            name={fighter.name}
            healthStatus={playerHS}
            lastHitPart={lastPlayerHitPart}
            lastHitCategory={lastPlayerHitCategory}
            isAttacking={currentAttacker === 'player'}
            isPlayer={true}
            stance={fightPhase}
            groundPosition={playerGroundPos as 'TOP' | 'BOTTOM' | null}
            mirror={false}
          />
        </div>

        {/* ─ CENTER: Battle log + Round stats ─ */}
        <div className="space-y-3">
          {/* BATTLE LOG */}
          <div
            style={{
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              boxShadow: '0 0 30px rgba(0,229,255,0.04) inset',
              overflow: 'hidden',
            }}
          >
            {/* Log header bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b"
                 style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
              <motion.span
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                style={{ boxShadow: '0 0 6px #00e5ff' }}
              />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400/70">
                LIVE FEED
              </span>
              <span className="ml-auto text-[8px] font-mono text-gray-600 uppercase tracking-widest">
                {t('live_commentary')}
              </span>
            </div>
            <div ref={battleLogRef} className="h-72 overflow-y-auto space-y-1.5 p-4"
                 style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.2) transparent' }}>
              <AnimatePresence>
                {battleLog.map((entry) => (
                  <LogEntry key={entry.id} entry={entry} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ROUND STATS */}
          <div className="grid grid-cols-2 gap-3 glass-card rounded-2xl p-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('your_damage')}</p>
              <p className="text-2xl font-bold text-neon-green">{roundStats.playerDamage}</p>
              <p className="text-xs text-gray-400 mt-1">({roundStats.playerHits} {t('hits')})</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('opponent_damage')}</p>
              <p className="text-2xl font-bold text-alert-red">{roundStats.opponentDamage}</p>
              <p className="text-xs text-gray-400 mt-1">({roundStats.opponentHits} {t('hits')})</p>
            </div>
          </div>
        </div>

        {/* ─ RIGHT: Opponent silhouette ─ */}
        <div className="rounded-2xl p-3 flex flex-col items-center"
             style={{
               background: 'rgba(255,23,68,0.03)',
               border: '1px solid rgba(255,23,68,0.18)',
               boxShadow: '0 0 20px rgba(255,23,68,0.06) inset',
             }}>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" style={{ boxShadow: '0 0 6px #ff1744' }} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]"
               style={{ color: '#ff4444', textShadow: '0 0 8px #ff174488' }}>OPP</p>
          </div>
          <FighterSilhouette
            name={opponent.name}
            healthStatus={opponentHS}
            lastHitPart={lastOpponentHitPart}
            lastHitCategory={lastOpponentHitCategory}
            isAttacking={currentAttacker === 'opponent'}
            isPlayer={false}
            stance={fightPhase}
            groundPosition={opponentGroundPos as 'TOP' | 'BOTTOM' | null}
            mirror={true}
          />
        </div>

      </div>
    </motion.div>
  );
};

// ============ LOG ENTRY WITH TYPEWRITER EFFECT ============

const LogEntry: React.FC<{ entry: BattleLogEntry }> = ({ entry }) => {
  const [displayedText, setDisplayedText] = useState('');

  // ── Skill trigger gets its own rendering path ────────────────────────────
  const isSkill     = entry.isSkillTrigger === true;
  const skillColor  = isSkill && entry.skillDomain ? DOMAIN_COLORS[entry.skillDomain] : null;

  const isCritical  = !isSkill && (entry.category === 'CRITICAL_HIT' || entry.category === 'FINISHER');
  const isNegative  = !isSkill && (entry.category === 'MISS' || entry.category === 'DODGE');
  const isTakedown  = !isSkill && (entry.category === 'TAKEDOWN_ATTEMPT' || entry.category === 'TAKEDOWN_DEFENSE');
  const isGndControl = !isSkill && entry.category === 'GROUND_CONTROL';
  const isSub       = !isSkill && entry.category === 'SUBMISSION_ATTEMPT';
  const isSubEscape = !isSkill && entry.category === 'SUBMISSION_ESCAPE';
  const isRoundSep  = entry.message.startsWith('═══');

  // Neon accent color per category
  const accentColor = isSkill     ? (skillColor ?? '#ffd600')
    : isCritical  ? '#ff1744'
    : isTakedown   ? '#ffd600'
    : isSub        ? '#ff6d00'
    : isSubEscape  ? '#00e5ff'
    : isGndControl ? '#ff9100'
    : isNegative   ? 'rgba(80,80,80,0.5)'
    : isRoundSep   ? '#00e5ff'
    : 'rgba(0,229,255,0.25)';

  const textColor = isSkill      ? (skillColor ?? '#ffd600')
    : isCritical  ? '#ff4444'
    : isTakedown   ? '#ffd600'
    : isSub        ? '#ff9100'
    : isSubEscape  ? '#00e5ff'
    : isGndControl ? '#ffab40'
    : isNegative   ? 'rgba(100,100,110,0.8)'
    : isRoundSep   ? '#00e5ff'
    : 'rgba(200,210,220,0.9)';

  useEffect(() => {
    let currentIndex = 0;
    const fullText = entry.message;
    const tickDuration = isSkill ? 30 : isCritical ? 45 : 60;

    const typewriter = setInterval(() => {
      if (currentIndex < fullText.length) {
        currentIndex += 1;
        setDisplayedText(fullText.substring(0, currentIndex));
      } else {
        clearInterval(typewriter);
      }
    }, tickDuration);

    return () => clearInterval(typewriter);
  }, [entry.message]);

  if (isRoundSep) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="my-2 text-center text-[9px] font-black tracking-[0.3em] uppercase"
        style={{ color: '#00e5ff88', borderTop: '1px solid rgba(0,229,255,0.15)', borderBottom: '1px solid rgba(0,229,255,0.15)', padding: '6px 0' }}
      >
        {entry.message}
      </motion.div>
    );
  }

  // ── SKILL TRIGGER — special neon-pulse card ──────────────────────────────
  if (isSkill) {
    const col = skillColor ?? '#ffd600';
    // Split "[SKILL: Name]" prefix from the rest of the message
    const prefixMatch = displayedText.match(/^(\[SKILL:[^\]]+\])(.*)/s);
    const prefix = prefixMatch ? prefixMatch[1] : '';
    const rest   = prefixMatch ? prefixMatch[2] : displayedText;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, x: -8 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        transition={{ duration: 0.2 }}
        style={{
          borderLeft: `3px solid ${col}`,
          paddingLeft: 8,
          paddingTop: 5,
          paddingBottom: 5,
          borderRadius: 4,
          background: `${col}12`,
          boxShadow: `0 0 10px ${col}22, inset 0 0 8px ${col}0a`,
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        {/* Pulsing dot indicator */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <motion.span
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
            transition={{ duration: 0.7, repeat: Infinity }}
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: col,
              boxShadow: `0 0 6px ${col}`,
              flexShrink: 0,
            }}
          />
          <span
            className="text-[8px] font-black uppercase tracking-[0.25em]"
            style={{ color: `${col}99` }}
          >
            skill activated
          </span>
        </div>
        <p className="text-xs font-mono font-bold leading-relaxed" style={{ color: col }}>
          {prefix && (
            <span
              style={{
                color: col,
                textShadow: `0 0 8px ${col}`,
                fontWeight: 900,
                letterSpacing: '0.03em',
              }}
            >
              {prefix}
            </span>
          )}
          <span style={{ color: `${col}cc`, fontWeight: 700 }}>{rest}</span>
          {displayedText.length < entry.message.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.25, repeat: Infinity }}
              className="inline-block w-1.5 h-3 ml-0.5 align-middle"
              style={{ background: col }}
            />
          )}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.25 }}
      style={{
        borderLeft: `2px solid ${accentColor}`,
        paddingLeft: 8,
        paddingTop: 3,
        paddingBottom: 3,
        background: isCritical
          ? 'rgba(255,23,68,0.06)'
          : isSub
            ? 'rgba(255,109,0,0.05)'
            : 'transparent',
      }}
    >
      <p
        className={`text-xs font-mono leading-relaxed ${isCritical ? 'font-bold' : ''}`}
        style={{ color: textColor }}
      >
        {displayedText}
        {displayedText.length < entry.message.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            className="inline-block w-1.5 h-3 ml-0.5 align-middle"
            style={{ background: accentColor }}
          />
        )}
      </p>
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
