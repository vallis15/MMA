import React from 'react';
import { motion } from 'framer-motion';

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  icon?: React.ReactNode;
  variant?: 'energy' | 'reputation' | 'default';
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  maxValue = 100,
  icon,
  variant = 'default',
}) => {
  const percentage = (value / maxValue) * 100;

  // Color variants for different stat types
  const getVariantClasses = () => {
    switch (variant) {
      case 'energy':
        return {
          gradient: 'from-cyan-500 to-blue-500',
          glow: 'shadow-lg shadow-cyan-500/50',
          text: 'text-cyan-400',
          borderGlow: 'border-cyan-500/30',
        };
      case 'reputation':
        return {
          gradient: 'from-yellow-500 to-amber-500',
          glow: 'shadow-lg shadow-yellow-500/50',
          text: 'text-yellow-400',
          borderGlow: 'border-yellow-500/30',
        };
      default:
        return {
          gradient: 'from-forge-gold to-emerald-500',
          glow: 'shadow-lg shadow-forge-gold/50',
          text: 'text-forge-gold',
          borderGlow: 'border-forge-gold/30',
        };
    }
  };

  const classes = getVariantClasses();

  return (
    <motion.div
      className="space-y-2 group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <motion.div
              className={classes.text}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {icon}
            </motion.div>
          )}
          <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <motion.span
          className={`text-sm font-bold ${classes.text}`}
          animate={{ textShadow: [`0 0 5px currentColor`, `0 0 15px currentColor`, `0 0 5px currentColor`] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {Math.ceil(value)}/{maxValue}
        </motion.span>
      </div>

      {/* Progress Bar Container */}
      <div className={`relative h-3 bg-iron-light/40 rounded-full overflow-hidden border ${classes.borderGlow} backdrop-blur-sm`}>
        {/* Background glow */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-r ${classes.gradient} opacity-0 blur-lg`}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Animated fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${classes.gradient} rounded-full ${classes.glow} relative`}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: [-100, 500] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>

      {/* Percentage Label */}
      <div className="flex justify-between items-center px-1">
        <motion.div
          className="text-xs text-gray-500 uppercase tracking-wider font-semibold group-hover:text-gray-400 transition"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Progress
        </motion.div>
        <span className={`text-xs font-bold ${classes.text}`}>
          {Math.round(percentage)}%
        </span>
      </div>
    </motion.div>
  );
};
