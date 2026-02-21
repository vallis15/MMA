import React from 'react';
import { motion } from 'framer-motion';
import { AIFighter } from '../types';
import { getOpponentDangerLevel } from '../utils/opponents';

interface OpponentCardProps {
  opponent: AIFighter;
}

export const OpponentCard: React.FC<OpponentCardProps> = ({ opponent }) => {
  const dangerLevel = getOpponentDangerLevel(opponent);

  const getDangerColor = () => {
    if (dangerLevel < 50) return 'text-neon-green';
    if (dangerLevel < 70) return 'text-yellow-400';
    return 'text-alert-red';
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-dark-secondary border-2 rounded-lg p-6 transition-all border-alert-red/60 hover:border-alert-red cursor-pointer"
    >
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
        <div className="bg-dark-tertiary rounded px-3 py-1 text-center flex-1">
          <p className="text-xs text-gray-400">W</p>
          <p className="text-lg font-bold text-neon-green">{opponent.record.wins}</p>
        </div>
        <div className="bg-dark-tertiary rounded px-3 py-1 text-center flex-1">
          <p className="text-xs text-gray-400">L</p>
          <p className="text-lg font-bold text-alert-red">{opponent.record.losses}</p>
        </div>
        <div className="bg-dark-tertiary rounded px-3 py-1 text-center flex-1">
          <p className="text-xs text-gray-400">D</p>
          <p className="text-lg font-bold text-gray-400">{opponent.record.draws}</p>
        </div>
      </div>

      {/* Danger Level */}
      <div className="mb-4 p-3 bg-dark-tertiary rounded border border-alert-red/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Danger Rating</span>
          <span className={`text-lg font-bold ${getDangerColor()}`}>{Math.round(dangerLevel)}/100</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(opponent.stats).map(([stat, value]) => (
          <div key={stat} className="bg-dark-tertiary rounded p-2">
            <p className="text-xs text-gray-400 capitalize">{stat}</p>
            <p className="text-sm font-bold text-neon-green">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
