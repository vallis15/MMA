import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFighter } from '../context/FighterContext';
import { useLanguage } from '../context/LanguageContext';
import { OpponentCard } from '../components/OpponentCard';
import { AIFighter } from '../types';
import { supabase } from '../lib/supabase';
import { getBattleMessage, BattleCategory, MMA_MOVES, TAKEDOWN_MOVES, SUBMISSION_MOVES } from '../constants/battlePhrases';

// ============ TYPES ============

export type FightPhase = 'STANDUP' | 'GROUND';

interface BattleEvent {
  id: string;
  timestamp: number;
  attacker: 'player' | 'opponent';
  category: BattleCategory;
  move: string;
  damage: number;
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

// ============ EVENT GENERATOR (GROUND GAME STATE MACHINE) ============

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateBattleEvents = (
  roundDuration: number = 60,
  language: string = 'en',
  playerGrappling: number = 50,
  opponentGrappling: number = 50,
): BattleEvent[] => {
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

  const mkEvent = (
    category: BattleCategory,
    attacker: 'player' | 'opponent',
    move: string,
    curPhase: FightPhase,
    gTop?: 'player' | 'opponent',
  ): BattleEvent => {
    const [mn, mx] = getDamageRange(category);
    return {
      id: `ev-${eid++}-${Date.now()}`,
      timestamp: time,
      attacker,
      category,
      move,
      damage: mn > 0 ? randInt(mn, mx) : 0,
      phase: curPhase,
      groundAttacker: gTop,
    };
  };

  // Takedown probability scales with grappling stat (50-base = neutral)
  const tdChancePlayer = 0.10 + (playerGrappling - 50) / 400;   // ~5–22%
  const tdChanceOpponent = 0.10 + (opponentGrappling - 50) / 400;

  while (time < roundDuration) {
    // Spacing between events: tighter on ground (quick exchanges), wider standing
    const spacing = phase === 'GROUND' ? randInt(2, 4) : randInt(2, 5);
    time += spacing;
    if (time >= roundDuration) break;

    // ─── GROUND PHASE ───────────────────────────────────────────
    if (phase === 'GROUND') {
      // Natural standup by referee or escape back to feet
      if (time >= groundEndTime) {
        // Insert "back to standing" system log entry
        events.push({
          id: `standup-sys-${eid++}`,
          timestamp: time,
          attacker: groundTopFighter,
          category: 'TAKEDOWN_DEFENSE',   // reuse this category for "defended / stood up"
          move: lang === 'cs' ? 'vstávání po obraně' : 'scramble back to feet',
          damage: 0,
          phase: 'STANDUP',
          groundAttacker: undefined,
        });
        phase = 'STANDUP';
        continue;
      }

      const roll = Math.random();
      const bottom = groundTopFighter === 'player' ? 'opponent' : 'player';

      if (roll < 0.18) {
        // ── Submission attempt by the top fighter
        const sub = randItem(subMoves);
        events.push(mkEvent('SUBMISSION_ATTEMPT', groundTopFighter, sub, 'GROUND', groundTopFighter));

        // Immediate tap check: ~9% chance of finish
        if (Math.random() < 0.09) {
          time += 1;
          events.push(mkEvent('FINISHER', groundTopFighter, sub, 'GROUND', groundTopFighter));
          break; // round over — submission finish
        }

        // Escape check: ~40% chance defender fights out
        if (Math.random() < 0.40) {
          time += randInt(1, 3);
          if (time >= roundDuration) break;
          events.push(mkEvent('SUBMISSION_ESCAPE', bottom, sub, 'GROUND', groundTopFighter));

          // After escape: 50% chance back to standup, 50% stay ground (bottom takes top)
          if (Math.random() < 0.50) {
            phase = 'STANDUP';
          } else {
            // Reversal — bottom fighter takes top
            groundTopFighter = bottom;
            groundEndTime = time + randInt(10, 20);
          }
        }
      } else if (roll < 0.55) {
        // ── Ground and pound (dominant position)
        events.push(mkEvent('GROUND_CONTROL', groundTopFighter, lang === 'cs' ? 'ground and pound' : 'ground and pound', 'GROUND', groundTopFighter));
      } else if (roll < 0.70) {
        // ── Bottom fighter tries to escape / sweep
        events.push(mkEvent('SUBMISSION_ESCAPE', bottom, lang === 'cs' ? 'práce z gardu' : 'guard work', 'GROUND', groundTopFighter));
        // Partial escape — might return to standup
        if (Math.random() < 0.25) {
          phase = 'STANDUP';
        }
      } else if (roll < 0.82) {
        // ── Another submission attempt (different move)
        const sub = randItem(subMoves);
        events.push(mkEvent('SUBMISSION_ATTEMPT', groundTopFighter, sub, 'GROUND', groundTopFighter));
      } else {
        // ── Ground control / positional advancement
        events.push(mkEvent('GROUND_CONTROL', groundTopFighter, lang === 'cs' ? 'kontrola pozice' : 'positional control', 'GROUND', groundTopFighter));
      }

    // ─── STANDUP PHASE ──────────────────────────────────────────
    } else {
      const tdAttemptChance = Math.random() < 0.5 ? tdChancePlayer : tdChanceOpponent;
      const roll = Math.random();

      if (roll < tdAttemptChance) {
        // ── Takedown sequence
        const attacker: 'player' | 'opponent' = Math.random() < 0.5 ? 'player' : 'opponent';
        const defender: 'player' | 'opponent' = attacker === 'player' ? 'opponent' : 'player';
        const td = randItem(tdMoves);
        events.push(mkEvent('TAKEDOWN_ATTEMPT', attacker, td, 'STANDUP'));

        // Defense roll: attacker grappling vs defender grappling
        const atkGrappling = attacker === 'player' ? playerGrappling : opponentGrappling;
        const defGrappling = defender === 'player' ? playerGrappling : opponentGrappling;
        const tdSuccessChance = 0.45 + (atkGrappling - defGrappling) / 200; // 45% base ± diff

        if (Math.random() > tdSuccessChance) {
          // defended!
          time += randInt(1, 2);
          if (time >= roundDuration) break;
          events.push(mkEvent('TAKEDOWN_DEFENSE', defender, td, 'STANDUP'));
        } else {
          // Takedown landed — enter ground phase
          time += 1;
          phase = 'GROUND';
          groundTopFighter = attacker;
          groundEndTime = time + randInt(20, 35); // 20-35 s on the ground
        }

      } else {
        // ── Standard striking exchange
        const attacker: 'player' | 'opponent' = Math.random() < 0.5 ? 'player' : 'opponent';
        const move = randItem(strikingMoves);
        let category: BattleCategory;
        let damage = 0;

        const sr = Math.random();
        if (sr < 0.12) {
          category = 'MISS';
        } else if (sr < 0.22) {
          category = 'DODGE';
        } else if (sr < 0.50) {
          category = 'LIGHT_HIT';
          const [mn, mx] = getDamageRange('LIGHT_HIT');
          damage = randInt(mn, mx);
        } else if (sr < 0.72) {
          category = 'MEDIUM_HIT';
          const [mn, mx] = getDamageRange('MEDIUM_HIT');
          damage = randInt(mn, mx);
        } else if (sr < 0.88) {
          category = 'HEAVY_HIT';
          const [mn, mx] = getDamageRange('HEAVY_HIT');
          damage = randInt(mn, mx);
        } else if (sr < 0.96) {
          category = 'CRITICAL_HIT';
          const [mn, mx] = getDamageRange('CRITICAL_HIT');
          damage = randInt(mn, mx);
        } else {
          category = 'FINISHER';
          const [mn, mx] = getDamageRange('FINISHER');
          damage = randInt(mn, mx);
        }

        events.push({
          id: `ev-${eid++}-${Date.now()}`,
          timestamp: time,
          attacker,
          category,
          move,
          damage,
          phase: 'STANDUP',
        });
      }
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
};

// ============ MAIN ARENA COMPONENT ============

export const Arena: React.FC = () => {
  const { fighter, updateFighterStats } = useFighter();
  const { language, t } = useLanguage();
  const location = useLocation();

  // Opponent selection
  const [opponents, setOpponents] = useState<AIFighter[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<AIFighter | null>(null);
  const [loadingOpponents, setLoadingOpponents] = useState(false);
  const [opponentError, setOpponentError] = useState<string | null>(null);

  // Battle state
  const [isBattling, setIsBattling] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);

  // Pre-calculated events
  const eventsRef = useRef<BattleEvent[]>([]);
  const processedEventIds = useRef<Set<string>>(new Set());

  // Battle log
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const battleLogRef = useRef<HTMLDivElement>(null);

  // Display queue for dramatic timing
  const displayQueueRef = useRef<QueuedEvent[]>([]);
  const isProcessingQueueRef = useRef(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isBattlingRef = useRef(false);

  // Round stats
  const [roundStats, setRoundStats] = useState<RoundResult>({
    playerDamage: 0,
    opponentDamage: 0,
    playerHits: 0,
    opponentHits: 0,
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTime = useRef<number>(0);

  const canFight = fighter && fighter.name !== 'Undefined' && fighter.currentEnergy >= 50;

  // Sync isBattling state to ref for queue processor
  useEffect(() => {
    isBattlingRef.current = isBattling;
  }, [isBattling]);

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
        const currentPlayerIndex = allPlayers.findIndex((p) => p.username === fighter.name);
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
      setTimeRemaining((prev) => {
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

        // Check for KO
        if (playerHealth <= 0 || opponentHealth <= 0) {
          endBattle(playerHealth <= 0 ? 'opponent' : 'player', 'Knockout');
          return 0;
        }

        // Round time expired
        if (newTime <= 0) {
          if (currentRound >= 3) {
            // All rounds complete - judges' decision
            endBattle('judges', "Judges' Decision");
          } else {
            // Next round
            startNextRound();
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
}, [isBattling, battleResult, currentRound, playerHealth, opponentHealth, fighter, selectedOpponent, language]);  // language must be here to avoid stale closure

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

    // Resolve message HERE (at display time) so language is always current
    const message = getBattleMessage(event.category, attackerName, defenderName, event.move, language);

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

    // Wait for typewriter to complete before updating HP
    setTimeout(() => {
      // Apply damage and visual effects
      if (event.damage > 0) {
        if (event.attacker === 'player') {
          setOpponentHealth((hp) => Math.max(0, hp - event.damage));
          setRoundStats((stats) => ({
            ...stats,
            playerDamage: stats.playerDamage + event.damage,
            playerHits: stats.playerHits + 1,
          }));
        } else {
          setPlayerHealth((hp) => Math.max(0, hp - event.damage));
          setRoundStats((stats) => ({
            ...stats,
            opponentDamage: stats.opponentDamage + event.damage,
            opponentHits: stats.opponentHits + 1,
          }));
        }

        // Trigger screen shake for heavy hits and ground events
        if (
          event.category === 'HEAVY_HIT' ||
          event.category === 'CRITICAL_HIT' ||
          event.category === 'FINISHER' ||
          event.category === 'TAKEDOWN_ATTEMPT'
        ) {
          const intensity =
            event.category === 'FINISHER' ? 3
            : event.category === 'CRITICAL_HIT' ? 2
            : event.category === 'TAKEDOWN_ATTEMPT' ? 2
            : 1;
          setShakeIntensity(intensity);
          setTimeout(() => setShakeIntensity(0), 400);
        }
      }

      // Dead air pause (1-2 seconds) before next message
      const pauseDuration = 1000 + Math.random() * 1000; // 1-2 seconds
      setTimeout(() => {
        isProcessingQueueRef.current = false;
        // Process next event
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

    // Generate all events upfront, passing grappling stats for ground game
    const events = generateBattleEvents(
      60,
      language,
      fighter.stats?.grappling ?? 50,
      selectedOpponent.stats?.grappling ?? 50,
    );
    eventsRef.current = events;
    processedEventIds.current.clear();
    displayQueueRef.current = [];
    isProcessingQueueRef.current = false;

    // Reset battle state
    setIsBattling(true);
    setCurrentRound(1);
    setTimeRemaining(60);
    setPlayerHealth(100);
    setOpponentHealth(100);
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
    // Generate new events for next round, passing grappling stats
    const events = generateBattleEvents(
      60,
      language,
      fighter?.stats?.grappling ?? 50,
      selectedOpponent?.stats?.grappling ?? 50,
    );
    eventsRef.current = events;
    processedEventIds.current.clear();
    displayQueueRef.current = [];
    isProcessingQueueRef.current = false;

    // Reset for next round
    setCurrentRound((r) => r + 1);
    setTimeRemaining(60);
    setPlayerHealth(100);
    setOpponentHealth(100);
    setFightPhase('STANDUP');
    setGroundAttackerName(null);
    setRoundStats({
      playerDamage: 0,
      opponentDamage: 0,
      playerHits: 0,
      opponentHits: 0,
    });

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

    // Determine actual winner for judges' decision
    let finalWinner = winner;
    if (winner === 'judges') {
      const playerScore = roundStats.playerDamage + roundStats.playerHits * 5;
      const opponentScore = roundStats.opponentDamage + roundStats.opponentHits * 5;

      if (playerScore > opponentScore) {
        finalWinner = 'player';
      } else if (opponentScore > playerScore) {
        finalWinner = 'opponent';
      } else {
        finalWinner = 'draw';
      }
    }

    setBattleResult({ winner: finalWinner, method });

    // Update database ONLY NOW
    if (fighter) {
      if (finalWinner === 'player') {
        const xpGain = 50 + roundStats.playerDamage;
        const reputationGain = 10 + roundStats.playerHits * 2;

        updateFighterStats({
          xp: fighter.xp + xpGain,
          reputation: fighter.reputation + reputationGain,
          currentEnergy: Math.max(0, fighter.currentEnergy - 50),
        });
      } else {
        updateFighterStats({
          currentEnergy: Math.max(0, fighter.currentEnergy - 50),
        });
      }
    }
  };

  const resetArena = () => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    setIsBattling(false);
    setBattleResult(null);
    setSelectedOpponent(null);
    setBattleLog([]);
    setCurrentRound(1);
    setTimeRemaining(60);
    setPlayerHealth(100);
    setOpponentHealth(100);
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
              playerHealth={playerHealth}
              opponentHealth={opponentHealth}
              battleLog={battleLog}
              battleLogRef={battleLogRef}
              roundStats={roundStats}
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
              canFight={canFight}
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
  playerHealth: number;
  opponentHealth: number;
  battleLog: BattleLogEntry[];
  battleLogRef: React.RefObject<HTMLDivElement>;
  roundStats: RoundResult;
  fightPhase: FightPhase;
  groundAttackerName: string | null;
  t: (key: string) => string;
}

const BattleScreen: React.FC<BattleScreenProps> = ({
  fighter,
  opponent,
  currentRound,
  timeRemaining,
  playerHealth,
  opponentHealth,
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
        <motion.div
          key={fightPhase}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`rounded-xl px-6 py-3 flex items-center justify-center gap-3 border ${
            isGround
              ? 'bg-orange-950/60 border-orange-500/60'
              : 'bg-gray-900/40 border-gray-700/40'
          }`}
        >
          <motion.span
            animate={isGround ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1.2, repeat: isGround ? Infinity : 0 }}
            className="text-2xl"
          >
            {isGround ? '🤼' : '🥊'}
          </motion.span>
          <div>
            <p
              className={`text-xs uppercase tracking-widest font-bold ${
                isGround ? 'text-orange-400' : 'text-neon-green'
              }`}
            >
              {isGround ? 'GROUND FIGHT' : 'STANDING'}
            </p>
            {isGround && groundAttackerName && (
              <p className="text-xs text-orange-300/80">
                {groundAttackerName} is on top
              </p>
            )}
          </div>
          {isGround && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-orange-400 ml-2"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* HEALTH BARS */}
      <div className="grid grid-cols-2 gap-6">
        {/* Player */}
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl text-neon-green glow-electric">{fighter.name}</h3>
            <p className="text-lg font-bold text-neon-green">{Math.ceil(playerHealth)}/100</p>
          </div>
          <motion.div className="w-full h-8 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-green to-emerald-400 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${playerHealth}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </motion.div>
        </motion.div>

        {/* Opponent */}
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl text-alert-red glow-crimson">{opponent.name}</h3>
            <p className="text-lg font-bold text-alert-red">{Math.ceil(opponentHealth)}/100</p>
          </div>
          <motion.div className="w-full h-8 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-alert-red to-orange-500 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${opponentHealth}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </motion.div>
        </motion.div>
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
