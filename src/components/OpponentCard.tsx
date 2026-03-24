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
    if (dangerLevel < 50) return 'text-forge-gold';
    if (dangerLevel < 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-iron-mid border-2 rounded-lg p-6 transition-all border-red-800/60 hover:border-red-800 cursor-pointer"
    >
      {/* Opponent Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-5xl">{opponent.avatar}</div>
          <div>
            <h3 className="text-lg font-bold text-white">{opponent.name}</h3>
            <p className="text-sm text-red-400 italic">{opponent.nickname}</p>
          </div>
        </div>
      </div>

      {/* Record */}
      <div className="flex gap-3 mb-4">
        <div className="bg-iron-light rounded px-3 py-1 text-center flex-1">
          <p className="text-xs text-gray-400">W</p>
          <p className="text-lg font-bold text-forge-gold">{opponent.record.wins}</p>
        </div>
        <div className="bg-iron-light rounded px-3 py-1 text-center flex-1">
          <p className="text-xs text-gray-400">L</p>
          <p className="text-lg font-bold text-red-400">{opponent.record.losses}</p>
        </div>
        <div className="bg-iron-light rounded px-3 py-1 text-center flex-1">
          <p className="text-xs text-gray-400">D</p>
          <p className="text-lg font-bold text-gray-400">{opponent.record.draws}</p>
        </div>
      </div>

      {/* Danger Level */}
      <div className="mb-4 p-3 bg-iron-light rounded border border-red-800/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Danger Rating</span>
          <span className={`text-lg font-bold ${getDangerColor()}`}>{Math.round(dangerLevel)}/100</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(opponent.stats).map(([stat, value]) => (
          <div key={stat} className="bg-iron-light rounded p-2">
            <p className="text-xs text-gray-400 capitalize">{stat}</p>
            <p className="text-sm font-bold text-forge-gold">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
