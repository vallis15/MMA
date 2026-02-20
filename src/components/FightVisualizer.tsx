import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FightLog } from '../types';

interface FightVisualizerProps {
  logs: FightLog[];
  isComplete: boolean;
}

export const FightVisualizer: React.FC<FightVisualizerProps> = ({ logs, isComplete }) => {
  const [displayedLogs, setDisplayedLogs] = useState<FightLog[]>([]);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);

  useEffect(() => {
    if (logs.length === 0) return;

    // Display logs one by one with delay and update health
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < logs.length) {
        const log = logs[currentIndex];
        setDisplayedLogs((prev) => [...prev, log]);
        
        // Update health based on drops
        if (log.playerHealthDrop) {
          setPlayerHealth((prev) => Math.max(0, prev - log.playerHealthDrop!));
        }
        if (log.opponentHealthDrop) {
          setOpponentHealth((prev) => Math.max(0, prev - log.opponentHealthDrop!));
        }
        
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 600); // 600ms between each log line

    return () => clearInterval(interval);
  }, [logs]);

  return (
    <div className="space-y-4">
      {/* Health Bars */}
      <div className="grid grid-cols-2 gap-4">
        {/* Player Health */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-white">You</span>
            <span className={`text-sm font-bold ${playerHealth > 30 ? 'text-neon-green' : 'text-alert-red'}`}>
              {Math.ceil(playerHealth)} HP
            </span>
          </div>
          <div className="h-6 bg-dark-tertiary rounded border border-dark-secondary overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${playerHealth}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`h-full transition-colors ${
                playerHealth > 50
                  ? 'bg-gradient-to-r from-neon-green to-green-500'
                  : playerHealth > 25
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                    : 'bg-gradient-to-r from-alert-red to-red-500'
              }`}
            />
          </div>
          {playerHealth <= 0 && (
            <div className="mt-2 text-center font-bold text-alert-red text-sm">🔥 KNOCKOUT! 🔥</div>
          )}
        </div>

        {/* Opponent Health */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-bold text-white">Opponent</span>
            <span className={`text-sm font-bold ${opponentHealth > 30 ? 'text-neon-green' : 'text-alert-red'}`}>
              {Math.ceil(opponentHealth)} HP
            </span>
          </div>
          <div className="h-6 bg-dark-tertiary rounded border border-dark-secondary overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${opponentHealth}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`h-full transition-colors ${
                opponentHealth > 50
                  ? 'bg-gradient-to-r from-neon-green to-green-500'
                  : opponentHealth > 25
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                    : 'bg-gradient-to-r from-alert-red to-red-500'
              }`}
            />
          </div>
          {opponentHealth <= 0 && (
            <div className="mt-2 text-center font-bold text-alert-red text-sm">🔥 KNOCKOUT! 🔥</div>
          )}
        </div>
      </div>

      {/* Fight Log */}
      <div className="bg-dark-secondary border border-alert-red/50 rounded-lg p-6 max-h-96 overflow-y-auto space-y-2">
        {displayedLogs.map((log, idx) => (
          <motion.div
            key={`log-${idx}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-sm font-medium whitespace-pre-wrap ${
              log.text.includes('WINS') || log.text.includes('Victory')
                ? 'text-neon-green'
                : log.text.includes('Defeat') || log.text.includes('edges out') || log.text.includes('KNOCKOUT')
                  ? 'text-alert-red'
                  : 'text-gray-300'
            }`}
          >
            {log.text}
          </motion.div>
        ))}

        {isComplete && displayedLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="pt-4 mt-4 border-t border-alert-red/30 text-center"
          >
            <p className="text-yellow-400 font-bold">Fight Complete!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
