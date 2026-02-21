import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { OpponentCard } from '../components/OpponentCard';
import { AIFighter } from '../types';
import { getRandomOpponents } from '../utils/opponents';
import { getBattleMessage, BattleCategory, MMA_MOVES } from '../constants/battlePhrases';

// ============ TYPES ============

interface BattleEvent {
  id: string;
  timestamp: number;
  attacker: 'player' | 'opponent';
  category: BattleCategory;
  move: string;
  damage: number;
}

interface BattleLogEntry {
  id: string;
  message: string;
  category: BattleCategory;
  displayTime: number;
}

interface QueuedEvent {
  event: BattleEvent;
  message: string;
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
    default:
      return [0, 0];
  }
};

// ============ EVENT GENERATOR ============

const generateBattleEvents = (roundDuration: number = 60): BattleEvent[] => {
  const events: BattleEvent[] = [];
  const eventCount = 20 + Math.floor(Math.random() * 11); // 20-30 events

  for (let i = 0; i < eventCount; i++) {
    // Distribute events across the round duration
    const timestamp = Math.floor((roundDuration / eventCount) * i) + Math.floor(Math.random() * 2);

    const attacker = Math.random() > 0.5 ? 'player' : 'opponent';
    const move = MMA_MOVES[Math.floor(Math.random() * MMA_MOVES.length)];

    // Weighted probability for action types
    const roll = Math.random();
    let category: BattleCategory;
    let damage = 0;

    if (roll < 0.12) {
      category = 'MISS';
    } else if (roll < 0.22) {
      category = 'DODGE';
    } else if (roll < 0.50) {
      category = 'LIGHT_HIT';
      const [min, max] = getDamageRange('LIGHT_HIT');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (roll < 0.72) {
      category = 'MEDIUM_HIT';
      const [min, max] = getDamageRange('MEDIUM_HIT');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (roll < 0.88) {
      category = 'HEAVY_HIT';
      const [min, max] = getDamageRange('HEAVY_HIT');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (roll < 0.96) {
      category = 'CRITICAL_HIT';
      const [min, max] = getDamageRange('CRITICAL_HIT');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      category = 'FINISHER';
      const [min, max] = getDamageRange('FINISHER');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    events.push({
      id: `event-${i}-${Date.now()}`,
      timestamp,
      attacker,
      category,
      move,
      damage,
    });
  }

  // Sort by timestamp
  return events.sort((a, b) => a.timestamp - b.timestamp);
};

// ============ MAIN ARENA COMPONENT ============

export const Arena: React.FC = () => {
  const { fighter, updateFighterStats } = useFighter();

  // Opponent selection
  const [opponents, setOpponents] = useState<AIFighter[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<AIFighter | null>(null);

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

  // Screen shake
  const [shakeIntensity, setShakeIntensity] = useState(0);

  // Timer control
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTime = useRef<number>(0);

  // Initialize opponents
  useEffect(() => {
    if (fighter && fighter.name !== 'Undefined' && opponents.length === 0) {
      setOpponents(getRandomOpponents(3));
    }
  }, [fighter, opponents.length]);

  const canFight = fighter && fighter.name !== 'Undefined' && fighter.currentEnergy >= 50;

  // Sync isBattling state to ref for queue processor
  useEffect(() => {
    isBattlingRef.current = isBattling;
  }, [isBattling]);

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
          const message = getBattleMessage(event.category, attackerName, defenderName, event.move);

          displayQueueRef.current.push({
            event,
            message,
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
  }, [isBattling, battleResult, currentRound, playerHealth, opponentHealth, fighter, selectedOpponent]);

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

    const { event, message } = queuedEvent;

    // Console log at DISPLAY time (not generation time)
    console.log('💬 [COMMENTARY]', message);

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

        // Trigger screen shake for heavy hits
        if (event.category === 'HEAVY_HIT' || event.category === 'CRITICAL_HIT' || event.category === 'FINISHER') {
          const intensity = event.category === 'FINISHER' ? 3 : event.category === 'CRITICAL_HIT' ? 2 : 1;
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

    // Generate all events upfront
    const events = generateBattleEvents(60);
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
    // Generate new events for next round
    const events = generateBattleEvents(60);
    eventsRef.current = events;
    processedEventIds.current.clear();
    displayQueueRef.current = [];
    isProcessingQueueRef.current = false;

    // Reset for next round
    setCurrentRound((r) => r + 1);
    setTimeRemaining(60);
    setPlayerHealth(100);
    setOpponentHealth(100);
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
}) => {
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
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Round</p>
          <p className="text-4xl font-bold text-neon-green">{currentRound}/3</p>
        </div>

        <div className="text-center flex-1 border-x border-gray-700 px-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Time</p>
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
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Status</p>
          <p className="text-lg font-semibold text-cyan-400 animate-pulse">● LIVE</p>
        </div>
      </motion.div>

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
          LIVE COMMENTARY
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
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Your Damage</p>
          <p className="text-3xl font-bold text-neon-green">{roundStats.playerDamage}</p>
          <p className="text-xs text-gray-400 mt-1">({roundStats.playerHits} hits)</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Opponent Damage</p>
          <p className="text-3xl font-bold text-alert-red">{roundStats.opponentDamage}</p>
          <p className="text-xs text-gray-400 mt-1">({roundStats.opponentHits} hits)</p>
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
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, roundStats, onReset }) => {
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
        {isVictory ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
      </h1>

      <p className="text-gray-400 text-xl uppercase tracking-widest mb-10">{result.method}</p>

      <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-900/40 p-8 rounded-lg">
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">Your Damage</p>
          <p className="text-4xl font-bold text-neon-green">{roundStats.playerDamage}</p>
          <p className="text-sm text-gray-500 mt-2">({roundStats.playerHits} hits)</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">Opponent Damage</p>
          <p className="text-4xl font-bold text-alert-red">{roundStats.opponentDamage}</p>
          <p className="text-sm text-gray-500 mt-2">({roundStats.opponentHits} hits)</p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        className="px-10 py-4 bg-gradient-to-r from-neon-green to-emerald-400 text-black font-bold uppercase tracking-wider rounded-lg hover:shadow-xl hover:shadow-neon-green/50 transition-all text-lg"
      >
        Return to Arena
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
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  fighter,
  opponents,
  selectedOpponent,
  onSelectOpponent,
  onStartBattle,
  canFight,
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-4">
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Zap size={44} className="text-alert-red glow-crimson" />
          </motion.div>
          <h1 className="page-header text-alert-red glow-crimson text-6xl">ARENA</h1>
        </div>
        <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
          {canFight
            ? `Welcome ${fighter?.name}! Select your opponent and step into the octagon.`
            : !fighter || fighter.name === 'Undefined'
              ? 'Create a fighter first to enter the Arena!'
              : 'You need 50 Energy to fight. Train to recover!'}
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
            {!fighter || fighter.name === 'Undefined' ? 'No Fighter' : 'Low Energy'}
          </h3>
          <p className="text-gray-400 uppercase tracking-widest">
            {!fighter || fighter.name === 'Undefined'
              ? 'Create your fighter on the Dashboard!'
              : `You need 50 Energy. Current: ${Math.ceil(fighter?.currentEnergy || 0)}`}
          </p>
        </motion.div>
      )}

      {/* Opponent Selection */}
      {canFight && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-premium rounded-2xl p-8 border-l-4 border-alert-red"
          >
            <h3 className="section-header text-alert-red text-2xl mb-6 text-center">Choose Your Opponent</h3>
            <div className="grid grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Your Fighter</p>
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
                  {selectedOpponent ? 'Selected' : 'Choose Below'}
                </p>
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ scale: [1, 0.9, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🥊
                </motion.div>
                <p className="text-xl font-bold text-alert-red">
                  {selectedOpponent?.name || 'Select Opponent'}
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
                    ⚡ START FIGHT
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
