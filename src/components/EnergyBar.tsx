import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap } from 'lucide-react';
import { useFighter } from '../context/FighterContext';

export const EnergyBar: React.FC = () => {
  const { fighter, timeSinceLastRegen } = useFighter();

  if (!fighter) return null;

  const percentage = (fighter.currentEnergy / fighter.maxEnergy) * 100;
  const timeUntilNextRegen = 10 - (timeSinceLastRegen || 0);

  // Format time display (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}s`;
  };

  // Pulse animation for the energy bar
  const pulseVariants = {
    pulse: {
      boxShadow: [
        '0 0 0 0 rgba(0, 255, 65, 0.4)',
        '0 0 0 8px rgba(0, 255, 65, 0)',
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
  };

  // Glow animation for the fill
  const glowVariants = {
    glow: {
      textShadow: [
        '0 0 10px rgba(0, 255, 65, 0.5)',
        '0 0 20px rgba(0, 255, 65, 1)',
        '0 0 10px rgba(0, 255, 65, 0.5)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.div
      variants={pulseVariants}
      animate="pulse"
      className="bg-dark-secondary border border-yellow-500/30 rounded-lg p-6 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart size={24} className="text-alert-red animate-pulse" />
        <h3 className="text-lg font-bold text-yellow-400">Energy</h3>
        <div className="flex-1" />
        <motion.span
          variants={glowVariants}
          animate="glow"
          className="text-sm font-bold text-yellow-300"
        >
          {Math.round(percentage)}%
        </motion.span>
      </div>

      {/* Energy Bar */}
      <div className="relative h-3 bg-dark-tertiary rounded-full overflow-hidden border border-yellow-500/50 mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 rounded-full shadow-2xl shadow-yellow-400/60"
        />
      </div>

      {/* Energy Value and Regeneration Timer */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-300">
          {fighter.currentEnergy.toFixed(0)} / {fighter.maxEnergy}
        </span>
        <motion.span
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="flex items-center gap-1 text-xs font-bold text-yellow-300"
        >
          <Zap size={14} />
          Next: {formatTime(timeUntilNextRegen)}
        </motion.span>
      </div>

      {/* Progress indicator for next regen */}
      <div className="relative h-1 bg-dark-tertiary rounded-full overflow-hidden border border-yellow-300/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((10 - timeUntilNextRegen) / 10) * 100}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
          className="h-full bg-yellow-400 rounded-full"
        />
      </div>
    </motion.div>
  );
};
