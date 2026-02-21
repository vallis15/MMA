import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { OpponentCard } from '../components/OpponentCard';
import { AIFighter } from '../types';
import { getRandomOpponents } from '../utils/opponents';
import { getBattleMessage, BattleCategory } from '../constants/battlePhrases';

interface BattleLog {
  id: string;
  message: string;
  category: BattleCategory;
  timestamp: number;
}

interface RoundStats {
  playerDamage: number;
  opponentDamage: number;
  playerHits: number;
  opponentHits: number;
}

interface BattleState {
  currentRound: number;
  timeRemaining: number;
  playerHealth: number;
  opponentHealth: number;
  isActive: boolean;
  nextActionIn: number;
}

const MMA_MOVES = [
  'jab',
  'cross',
  'hook',
  'uppercut',
  'body kick',
  'leg kick',
  'spinning backfist',
  'knee strike',
  'elbow strike',
  'takedown',
  'submission attempt',
  'power punch',
  'spinning heel kick',
  'teep',
  'overhand right',
  'roundhouse',
];

const getDamageRange = (category: BattleCategory): [number, number] => {
  switch (category) {
    case 'LIGHT_HIT':
      return [1, 15];
    case 'MEDIUM_HIT':
      return [16, 35];
    case 'HEAVY_HIT':
      return [36, 60];
    case 'CRITICAL_HIT':
      return [61, 100];
    case 'FINISHER':
      return [101, 200];
    default:
      return [0, 0];
  }
};

export const Arena: React.FC = () => {
  const { fighter, updateFighterStats } = useFighter();
  const [opponents, setOpponents] = useState<AIFighter[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<AIFighter | null>(null);

  // Battle state
  const [isBattling, setIsBattling] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [battleLog, setBattleLog] = useState<BattleLog[]>([]);
  const [roundStats, setRoundStats] = useState<RoundStats>({
    playerDamage: 0,
    opponentDamage: 0,
    playerHits: 0,
    opponentHits: 0,
  });
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [battleResult, setBattleResult] = useState<{
    winner: 'player' | 'opponent' | 'judges';
    method: string;
  } | null>(null);

  // Refs for internal state (no stale closures)
  const battleStateRef = useRef<BattleState>({
    currentRound: 1,
    timeRemaining: 60,
    playerHealth: 100,
    opponentHealth: 100,
    isActive: false,
    nextActionIn: 0,
  });

  const intervalRefsRef = useRef<{
    timer: NodeJS.Timeout | null;
    action: NodeJS.Timeout | null;
  }>({
    timer: null,
    action: null,
  });

  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize opponents on mount
  useEffect(() => {
    if (fighter && fighter.name !== 'Undefined' && opponents.length === 0) {
      setOpponents(getRandomOpponents(3));
    }
  }, [fighter, opponents.length]);

  const canFight = fighter && fighter.name !== 'Undefined' && fighter.currentEnergy >= 50;

  const addBattleLog = useCallback((message: string, category: BattleCategory) => {
    setBattleLog((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        message,
        category,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  const triggerShake = useCallback((intensity: number = 1) => {
    setShakeIntensity(intensity);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => setShakeIntensity(0), 600);
  }, []);

  const simulateBattleAction = useCallback(() => {
    if (!battleStateRef.current.isActive) return;
    if (battleStateRef.current.playerHealth <= 0 || battleStateRef.current.opponentHealth <= 0) return;

    const attacker = Math.random() > 0.5 ? 'player' : 'opponent';
    const move = MMA_MOVES[Math.floor(Math.random() * MMA_MOVES.length)];

    // Determine action with weighted probability
    const actionRoll = Math.random();
    let category: BattleCategory;
    let damage = 0;

    if (actionRoll < 0.15) {
      category = 'MISS';
    } else if (actionRoll < 0.25) {
      category = 'DODGE';
    } else if (actionRoll < 0.5) {
      category = 'LIGHT_HIT';
      const [min, max] = getDamageRange('LIGHT_HIT');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (actionRoll < 0.7) {
      category = 'MEDIUM_HIT';
      const [min, max] = getDamageRange('MEDIUM_HIT');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (actionRoll < 0.85) {
      category = 'HEAVY_HIT';
      const [min, max] = getDamageRange('HEAVY_HIT');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (actionRoll < 0.95) {
      category = 'CRITICAL_HIT';
      const [min, max] = getDamageRange('CRITICAL_HIT');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
      triggerShake(2);
    } else {
      category = 'FINISHER';
      const [min, max] = getDamageRange('FINISHER');
      damage = Math.floor(Math.random() * (max - min + 1)) + min;
      triggerShake(3);
    }

    const attackerName = attacker === 'player' ? fighter!.name : selectedOpponent!.name;
    const defenderName = attacker === 'player' ? selectedOpponent!.name : fighter!.name;
    const message = getBattleMessage(category, attackerName, defenderName, move);

    addBattleLog(message, category);

    // Apply damage
    if (category !== 'MISS' && category !== 'DODGE') {
      if (attacker === 'player') {
        battleStateRef.current.opponentHealth = Math.max(0, battleStateRef.current.opponentHealth - damage);
        setOpponentHealth(battleStateRef.current.opponentHealth);

        setRoundStats((prev) => ({
          ...prev,
          playerDamage: prev.playerDamage + damage,
          playerHits: prev.playerHits + 1,
        }));

        // Check for KO
        if (battleStateRef.current.opponentHealth <= 0) {
          console.log('🏆 [BATTLE] Opponent knocked out!');
          battleStateRef.current.isActive = false;
          if (intervalRefsRef.current.timer) clearInterval(intervalRefsRef.current.timer);
          if (intervalRefsRef.current.action) clearTimeout(intervalRefsRef.current.action);
          addBattleLog('OPPONENT IS DOWN! ' + fighter!.name.toUpperCase() + ' WINS!', 'FINISHER');
          setBattleResult({ winner: 'player', method: 'Knockout' });
        }
      } else {
        battleStateRef.current.playerHealth = Math.max(0, battleStateRef.current.playerHealth - damage);
        setPlayerHealth(battleStateRef.current.playerHealth);

        setRoundStats((prev) => ({
          ...prev,
          opponentDamage: prev.opponentDamage + damage,
          opponentHits: prev.opponentHits + 1,
        }));

        // Check for KO
        if (battleStateRef.current.playerHealth <= 0) {
          console.log('💀 [BATTLE] Player knocked out!');
          battleStateRef.current.isActive = false;
          if (intervalRefsRef.current.timer) clearInterval(intervalRefsRef.current.timer);
          if (intervalRefsRef.current.action) clearTimeout(intervalRefsRef.current.action);
          addBattleLog('YOU ARE DOWN! ' + selectedOpponent!.name.toUpperCase() + ' WINS!', 'FINISHER');
          setBattleResult({ winner: 'opponent', method: 'Knockout' });
        }
      }
    }
  }, [fighter, selectedOpponent, addBattleLog, triggerShake]);

  const scheduleNextAction = useCallback(() => {
    if (!battleStateRef.current.isActive) return;

    const timeRemaining = battleStateRef.current.timeRemaining;
    const isFinalFlurry = timeRemaining <= 10 && timeRemaining > 0;

    // Random interval: 3-5s normally, 1-2s in final 10s
    const minInterval = isFinalFlurry ? 1000 : 3000;
    const maxInterval = isFinalFlurry ? 2000 : 5000;
    const nextInterval = minInterval + Math.random() * (maxInterval - minInterval);

    if (intervalRefsRef.current.action) clearTimeout(intervalRefsRef.current.action);
    intervalRefsRef.current.action = setTimeout(() => {
      simulateBattleAction();
      scheduleNextAction();
    }, nextInterval);
  }, [simulateBattleAction]);

  const endRound = useCallback(() => {
    if (battleStateRef.current.currentRound >= 3) {
      // All 3 rounds complete - calculate decision
      console.log('📊 [BATTLE] All 3 rounds complete. Judges\' decision...');

      const playerScore = roundStats.playerDamage + roundStats.playerHits * 5;
      const opponentScore = roundStats.opponentDamage + roundStats.opponentHits * 5;

      let winner: 'player' | 'opponent' | 'judges';
      if (playerScore > opponentScore) {
        winner = 'player';
      } else if (opponentScore > playerScore) {
        winner = 'opponent';
      } else {
        winner = 'judges';
      }

      addBattleLog(`JUDGES' DECISION: ${winner === 'player' ? 'VICTORY FOR ' + fighter!.name.toUpperCase() : winner === 'opponent' ? 'DEFEAT - ' + selectedOpponent!.name.toUpperCase() + ' WINS' : 'DRAW'}`, 'FINISHER');
      battleStateRef.current.isActive = false;
      setBattleResult({ winner, method: 'Judges\' Decision' });
    } else {
      // Next round
      console.log('🔧 [BATTLE] Round', battleStateRef.current.currentRound, 'complete. Corner break...');
      addBattleLog(`END OF ROUND ${battleStateRef.current.currentRound}. CORNER BREAK. Next round in 3 seconds...`, 'MISS');

      roundEndTimeoutRef.current = setTimeout(() => {
        battleStateRef.current.currentRound += 1;
        battleStateRef.current.timeRemaining = 60;
        battleStateRef.current.playerHealth = 100;
        battleStateRef.current.opponentHealth = 100;

        setCurrentRound(battleStateRef.current.currentRound);
        setTimeRemaining(60);
        setPlayerHealth(100);
        setOpponentHealth(100);
        setRoundStats({ playerDamage: 0, opponentDamage: 0, playerHits: 0, opponentHits: 0 });

        // Restart timer and actions
        startTimerLoop();
        scheduleNextAction();
      }, 3000);
    }
  }, [fighter, selectedOpponent, roundStats, battleLog, addBattleLog, scheduleNextAction]);

  const startTimerLoop = useCallback(() => {
    if (intervalRefsRef.current.timer) clearInterval(intervalRefsRef.current.timer);

    intervalRefsRef.current.timer = setInterval(() => {
      battleStateRef.current.timeRemaining -= 1;
      setTimeRemaining(battleStateRef.current.timeRemaining);

      if (battleStateRef.current.timeRemaining <= 0) {
        if (intervalRefsRef.current.timer) clearInterval(intervalRefsRef.current.timer);
        endRound();
      }
    }, 1000);
  }, [endRound]);

  const startBattle = useCallback(() => {
    if (!selectedOpponent || !fighter) return;

    console.log('🔴 [BATTLE] Starting battle!', {
      player: fighter.name,
      opponent: selectedOpponent.name,
    });

    setIsBattling(true);
    setBattleLog([]);
    setRoundStats({ playerDamage: 0, opponentDamage: 0, playerHits: 0, opponentHits: 0 });
    setCurrentRound(1);
    setTimeRemaining(60);
    setPlayerHealth(100);
    setOpponentHealth(100);

    // Initialize battle ref state
    battleStateRef.current = {
      currentRound: 1,
      timeRemaining: 60,
      playerHealth: 100,
      opponentHealth: 100,
      isActive: true,
      nextActionIn: 0,
    };

    startTimerLoop();
    scheduleNextAction();
  }, [selectedOpponent, fighter, startTimerLoop, scheduleNextAction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRefsRef.current.timer) clearInterval(intervalRefsRef.current.timer);
      if (intervalRefsRef.current.action) clearTimeout(intervalRefsRef.current.action);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (roundEndTimeoutRef.current) clearTimeout(roundEndTimeoutRef.current);
    };
  }, []);

  const handleBattleComplete = useCallback(async () => {
    if (!battleResult || !fighter) return;

    console.log('✅ [BATTLE] Battle complete! Result:', battleResult);

    // ONLY sync to database here, at the very end
    if (battleResult.winner === 'player') {
      const xpGain = 50 + roundStats.playerDamage;
      const reputationGain = 10 + roundStats.playerHits * 2;

      console.log('💪 [VICTORY] Syncing to database:', { xpGain, reputationGain });

      await updateFighterStats({
        xp: fighter.xp + xpGain,
        reputation: fighter.reputation + reputationGain,
        currentEnergy: fighter.currentEnergy - 50,
      });
    } else if (battleResult.winner === 'opponent' || battleResult.winner === 'judges') {
      console.log('😔 [DEFEAT] Deducting energy cost');

      await updateFighterStats({
        currentEnergy: fighter.currentEnergy - 50,
      });
    }
  }, [battleResult, fighter, roundStats, updateFighterStats]);

  return (
    <motion.div
      className="p-8 min-h-screen"
      style={{
        transform:
          shakeIntensity > 0
            ? `translate(${Math.random() * shakeIntensity * 10 - shakeIntensity * 5}px, ${Math.random() * shakeIntensity * 10 - shakeIntensity * 5}px)`
            : 'translate(0, 0)',
        transition: 'transform 0.05s',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {battleResult ? (
            <BattleResultScreen
              key="result"
              result={battleResult}
              playerDamage={roundStats.playerDamage}
              opponentDamage={roundStats.opponentDamage}
              onConfirm={async () => {
                await handleBattleComplete();
                setIsBattling(false);
                setBattleResult(null);
                setSelectedOpponent(null);
              }}
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
              roundStats={roundStats}
            />
          ) : (
            <ArenaSetupScreen
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
  battleLog: BattleLog[];
  roundStats: RoundStats;
}

const BattleScreen: React.FC<BattleScreenProps> = ({
  fighter,
  opponent,
  currentRound,
  timeRemaining,
  playerHealth,
  opponentHealth,
  battleLog,
  roundStats,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Round and Time Info */}
      <motion.div
        className="flex justify-between items-center glass-card-premium rounded-2xl p-6"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        <div className="text-center flex-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Round</p>
          <p className="text-4xl font-bold text-neon-green">{currentRound}/3</p>
        </div>

        <div className="text-center flex-1 border-x border-gray-600 px-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Time</p>
          <motion.div className="font-mono text-4xl font-bold text-alert-red glow-crimson">
            0:{timeRemaining < 10 ? '0' : ''}
            {timeRemaining}
          </motion.div>
        </div>

        <div className="text-center flex-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Status</p>
          <p className="text-lg font-semibold text-cyan-400 animate-pulse">LIVE</p>
        </div>
      </motion.div>

      {/* Health Bars */}
      <div className="grid grid-cols-2 gap-8">
        {/* Player Health */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-neon-green glow-electric">{fighter.name}</h3>
            <p className="text-lg font-bold text-neon-green">{Math.ceil(playerHealth)}/100 HP</p>
          </div>
          <motion.div
            className="w-full h-8 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700"
            animate={{
              boxShadow: playerHealth < 30 ? '0 0 20px rgba(0, 255, 65, 0.8)' : '0 0 0px rgba(0, 255, 65, 0)',
            }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-neon-green/80 to-emerald-400 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${playerHealth}%` }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </motion.div>

        {/* Opponent Health */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-alert-red glow-crimson">{opponent.name}</h3>
            <p className="text-lg font-bold text-alert-red">{Math.ceil(opponentHealth)}/100 HP</p>
          </div>
          <motion.div
            className="w-full h-8 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700"
            animate={{
              boxShadow: opponentHealth < 30 ? '0 0 20px rgba(220, 20, 60, 0.8)' : '0 0 0px rgba(220, 20, 60, 0)',
            }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-alert-red/80 to-orange-500 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: `${opponentHealth}%` }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Battle Commentary Log */}
      <motion.div
        className="glass-card-premium rounded-2xl p-6 h-96 overflow-y-auto space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="section-header text-gray-300 sticky top-0 bg-gray-900/80 py-2">LIVE COMMENTARY</h3>
        <AnimatePresence>
          {battleLog.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Round Stats */}
      <motion.div className="grid grid-cols-2 gap-4 glass-card rounded-2xl p-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Your Damage</p>
          <p className="text-2xl font-bold text-neon-green">{roundStats.playerDamage}</p>
          <p className="text-xs text-gray-400">({roundStats.playerHits} hits)</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Opponent Damage</p>
          <p className="text-2xl font-bold text-alert-red">{roundStats.opponentDamage}</p>
          <p className="text-xs text-gray-400">({roundStats.opponentHits} hits)</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============ BATTLE LOG ENTRY ============

const LogEntry: React.FC<{ log: BattleLog }> = ({ log }) => {
  const isCritical = log.category === 'CRITICAL_HIT' || log.category === 'FINISHER';
  const isNegative = log.category === 'MISS' || log.category === 'DODGE';

  return (
    <motion.div
      initial={
        isCritical
          ? { opacity: 0, scale: 0.8, x: 50 }
          : isNegative
            ? { opacity: 0, x: 50 }
            : { opacity: 0, x: 50 }
      }
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: -50,
      }}
      transition={{
        duration: isNegative ? 0.3 : 0.5,
        ease: 'easeOut',
      }}
      className={`font-mono text-sm leading-relaxed ${
        isCritical
          ? 'font-bold text-alert-red glow-crimson'
          : isNegative
            ? 'italic text-gray-500'
            : 'text-gray-300'
      }`}
    >
      <TypewriterText text={log.message} speed={isCritical ? 20 : 30} />
    </motion.div>
  );
};

// ============ TYPEWRITER EFFECT ============

const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 30 }) => {
  const [displayedText, setDisplayedText] = React.useState('');

  React.useEffect(() => {
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, text, speed]);

  return <span>{displayedText}</span>;
};

// ============ BATTLE RESULT SCREEN ============

interface BattleResultScreenProps {
  result: { winner: 'player' | 'opponent' | 'judges'; method: string };
  playerDamage: number;
  opponentDamage: number;
  onConfirm: () => Promise<void>;
}

const BattleResultScreen: React.FC<BattleResultScreenProps> = ({
  result,
  playerDamage,
  opponentDamage,
  onConfirm,
}) => {
  const isVictory = result.winner === 'player';
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="glass-card-premium rounded-2xl p-12 text-center border border-gray-600"
    >
      <motion.div
        animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 1.2 }}
        className="text-8xl mb-8"
      >
        {isVictory ? '🏆' : '😔'}
      </motion.div>

      <h1
        className="page-header text-5xl mb-6"
        style={{ color: isVictory ? '#00ff41' : '#dc143c' }}
      >
        {isVictory ? 'VICTORY' : 'DEFEAT'}
      </h1>

      <p className="text-gray-400 text-xl uppercase tracking-widest mb-12">{result.method}</p>

      <div className="grid grid-cols-2 gap-8 mb-12 bg-gray-900/50 p-8 rounded-lg">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">Your Damage</p>
          <p className="text-4xl font-bold text-neon-green">{playerDamage}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">Opponent Damage</p>
          <p className="text-4xl font-bold text-alert-red">{opponentDamage}</p>
        </motion.div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleConfirm}
        disabled={isProcessing}
        className="px-8 py-4 bg-gradient-to-r from-neon-green to-emerald-400 text-black font-bold uppercase tracking-wider rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-neon-green/50 transition-all"
      >
        {isProcessing ? 'Updating...' : 'Return to Arena'}
      </motion.button>
    </motion.div>
  );
};

// ============ ARENA SETUP SCREEN ============

interface ArenaSetupScreenProps {
  fighter: any;
  opponents: AIFighter[];
  selectedOpponent: AIFighter | null;
  onSelectOpponent: (opponent: AIFighter) => void;
  onStartBattle: () => void;
  canFight: boolean;
}

const ArenaSetupScreen: React.FC<ArenaSetupScreenProps> = ({
  fighter,
  opponents,
  selectedOpponent,
  onSelectOpponent,
  onStartBattle,
  canFight,
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-4">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Zap size={40} className="text-alert-red glow-crimson" />
          </motion.div>
          <h1 className="page-header text-alert-red glow-crimson text-5xl">ARENA</h1>
        </div>
        <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
          {canFight
            ? `Welcome ${fighter?.name}! Select your opponent and enter the octagon.`
            : !fighter || fighter.name === 'Undefined'
              ? 'Create a fighter first to compete in the Arena!'
              : 'You need 50 Energy to fight. Train or rest to recover!'}
        </p>
      </motion.div>

      {/* Status Messages */}
      {!canFight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-premium rounded-2xl p-12 text-center border-2 border-dashed"
          style={{ borderColor: fighter?.name === 'Undefined' ? '#dc143c' : '#fbbf24' }}
        >
          <motion.div
            className="text-6xl mb-6"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {fighter?.name === 'Undefined' ? '⚡' : '😴'}
          </motion.div>
          <h3
            className="section-header text-3xl mb-3"
            style={{ color: fighter?.name === 'Undefined' ? '#dc143c' : '#fbbf24' }}
          >
            {fighter?.name === 'Undefined' ? 'No Fighter Yet' : 'Not Enough Energy'}
          </h3>
          <p className="text-gray-400 uppercase tracking-widest text-sm">
            {fighter?.name === 'Undefined'
              ? 'Create your first fighter on the Dashboard to enter the Arena!'
              : `You need 50 Energy to fight. You have ${Math.ceil(fighter?.currentEnergy || 0)}. Train in the Gym to recover!`}
          </p>
        </motion.div>
      )}

      {canFight && (
        <>
          {/* Fighter vs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-premium rounded-2xl p-8 border-l-4 border-alert-red/50"
          >
            <h3 className="section-header text-alert-red text-xl mb-8 text-center">Select Your Opponent</h3>
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Your Fighter */}
              <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-3">Your Fighter</p>
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  👊
                </motion.div>
                <p className="text-lg font-bold text-neon-green glow-electric">{fighter?.name}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-2">
                  {fighter?.record.wins}W-{fighter?.record.losses}L-{fighter?.record.draws}D
                </p>
              </motion.div>

              {/* VS */}
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl font-black text-alert-red glow-crimson mb-4"
                >
                  VS
                </motion.div>
                <div className="glass-card rounded-lg p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Energy</p>
                  <p className="text-3xl font-bold text-cyan-400 glow-electric">{Math.ceil(fighter?.currentEnergy || 0)}</p>
                </div>
              </div>

              {/* Opponent Slot */}
              <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-3">
                  {selectedOpponent ? 'Selected' : 'Select Below'}
                </p>
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ scale: [1, 0.95, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🥊
                </motion.div>
                <p className="text-lg font-bold text-alert-red uppercase tracking-wider">
                  {selectedOpponent ? selectedOpponent.name : 'Choose Opponent'}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Opponents Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {opponents.map((opponent, idx) => (
              <motion.div
                key={opponent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
              >
                <motion.div
                  onClick={() => onSelectOpponent(opponent)}
                  className={`cursor-pointer transition-all ${
                    selectedOpponent?.id === opponent.id ? 'ring-2 ring-neon-green' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <OpponentCard opponent={opponent} />
                </motion.div>

                {selectedOpponent?.id === opponent.id && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={onStartBattle}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-neon-green to-emerald-400 text-black font-bold uppercase tracking-wider rounded-lg hover:shadow-lg hover:shadow-neon-green/50 transition-all text-lg"
                  >
                    Start Fight
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
