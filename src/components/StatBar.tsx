import React from 'react';
import { motion } from 'framer-motion';

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  icon?: React.ReactNode;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, maxValue = 100, icon }) => {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-neon-green">{icon}</div>}
          <span className="text-sm font-medium text-gray-300">{label}</span>
        </div>
        <span className="text-sm font-bold text-neon-green">{value}/{maxValue}</span>
      </div>
      <div className="relative h-2 bg-dark-tertiary rounded-full overflow-hidden border border-dark-tertiary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-neon-green to-green-500 rounded-full shadow-lg shadow-neon-green/50"
        />
      </div>
    </div>
  );
};
