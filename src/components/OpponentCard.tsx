import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy } from 'lucide-react';
import { AIFighter, FightResult } from '../types';
import { useFighter } from '../context/FighterContext';
import { useNotification } from '../context/NotificationContext';
import { getOpponentDangerLevel } from '../utils/opponents';
import { FightVisualizer } from './FightVisualizer';

interface OpponentCardProps {
  opponent: AIFighter;
}

export const OpponentCard: React.FC<OpponentCardProps> = ({ opponent }) => {
  const { fighter, fight } = useFighter();
  const { addNotification } = useNotification();
  const [isFighting, setIsFighting] = useState(false);
  const [fightResult, setFightResult] = useState<FightResult | null>(null);

  const dangerLevel = getOpponentDangerLevel(opponent);
  const canFight = fighter && fighter.currentEnergy >= 50 && !isFighting && !fightResult;

  const getDangerColor = () => {
    if (dangerLevel < 50) return 'text-neon-green';
    if (dangerLevel < 70) return 'text-yellow-400';
    return 'text-alert-red';
  };

  const handleFight = async () => {
    if (!canFight) {
      if (fighter && fighter.currentEnergy < 50) {
        addNotification(`Not enough energy! Need 50, have ${Math.ceil(fighter.currentEnergy)}`, 'error');
      }
      return;
    }

    setIsFighting(true);

    // Simulate fight happening
    await new Promise((resolve) => setTimeout(resolve, 300));

    const result = fight(opponent);

    if (result.success && result.result) {
      setFightResult(result.result);
      addNotification(result.message, result.result.winner === 'player' ? 'success' : 'warning', 4000);
    } else {
      addNotification(result.message, 'error');
      setIsFighting(false);
    }
  };

  const handleReset = () => {
    setFightResult(null);
    setIsFighting(false);
  };

  return (
    <motion.div
      whileHover={{ y: canFight ? -8 : 0, scale: canFight ? 1.02 : 1 }}
      className={`bg-dark-secondary border-2 rounded-lg p-6 transition-all ${
        canFight ? 'border-alert-red/60 hover:border-alert-red cursor-pointer' : 'border-gray-600/40 opacity-75'
      }`}
    >
      {!fightResult ? (
        <>
          {/* Opponent Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-5xl">{opponent.avatar}</div>
              <div>
                <h3 className="text-lg font-bold text-white">{opponent.name}</h3>
                <p className="text-sm text-alert-red italic">{opponent.nickname}</p>
              </div>
            </div>
          </div>

          {/* Record */}
          <div className="flex gap-3 mb-4">
            <div className="bg-dark-tertiary rounded px-3 py-1 text-center">
              <p className="text-xs text-gray-400">Wins</p>
              <p className="text-lg font-bold text-neon-green">{opponent.record.wins}</p>
            </div>
            <div className="bg-dark-tertiary rounded px-3 py-1 text-center">
              <p className="text-xs text-gray-400">Losses</p>
              <p className="text-lg font-bold text-alert-red">{opponent.record.losses}</p>
            </div>
            <div className="bg-dark-tertiary rounded px-3 py-1 text-center">
              <p className="text-xs text-gray-400">Draws</p>
              <p className="text-lg font-bold text-gray-400">{opponent.record.draws}</p>
            </div>
          </div>

          {/* Danger Level */}
          <div className="mb-4 p-3 bg-dark-tertiary rounded border border-alert-red/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Overall Rating</span>
              <span className={`text-lg font-bold ${getDangerColor()}`}>{dangerLevel}/100</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(opponent.stats).map(([stat, value]) => (
              <div key={stat} className="bg-dark-tertiary rounded p-2">
                <p className="text-xs text-gray-400 capitalize">{stat}</p>
                <p className="text-sm font-bold text-neon-green">{value}</p>
              </div>
            ))}
          </div>

          {/* Fight Button */}
          <motion.button
            whileHover={{ scale: canFight ? 1.05 : 1 }}
            whileTap={{ scale: canFight ? 0.95 : 1 }}
            onClick={handleFight}
            disabled={!canFight || isFighting}
            className={`w-full py-2 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              isFighting
                ? 'bg-yellow-600 text-dark-bg'
                : canFight
                  ? 'bg-alert-red text-white hover:bg-red-600'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isFighting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }}
                >
                  <Zap size={16} />
                </motion.div>
                Fighting...
              </>
            ) : (
              <>
                <Trophy size={16} />
                Fight
              </>
            )}
          </motion.button>
        </>
      ) : (
        <>
          {/* Fight Result */}
          <div className="mb-4">
            <FightVisualizer logs={fightResult.logs} isComplete={true} />
          </div>

          {/* Result Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-4 text-center ${
              fightResult.winner === 'player'
                ? 'bg-neon-green/20 border border-neon-green/50'
                : 'bg-alert-red/20 border border-alert-red/50'
            }`}
          >
            <p
              className={`text-2xl font-black ${
                fightResult.winner === 'player' ? 'text-neon-green' : 'text-alert-red'
              }`}
            >
              {fightResult.winner === 'player' ? '🏆 VICTORY!' : '⚠️ DEFEAT'}
            </p>
            <p className="text-sm text-gray-300 mt-2">
              Reputation: +{fightResult.playerStats.reputation - (fighter?.reputation || 0)}
            </p>
          </motion.div>

          {/* Reset Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="w-full py-2 px-4 rounded-lg font-bold bg-dark-tertiary text-gray-300 hover:text-white border border-gray-500 transition-colors"
          >
            Back to Opponents
          </motion.button>
        </>
      )}
    </motion.div>
  );
};
