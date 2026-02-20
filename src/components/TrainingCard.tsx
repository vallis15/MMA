import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Check } from 'lucide-react';
import { TrainingDrill } from '../types';
import { useFighter } from '../context/FighterContext';
import { useNotification } from '../context/NotificationContext';

interface TrainingCardProps {
  drill: TrainingDrill;
  onTrainComplete?: () => void;
}

export const TrainingCard: React.FC<TrainingCardProps> = ({ drill, onTrainComplete }) => {
  const { fighter, train } = useFighter();
  const { addNotification } = useNotification();
  const [isTraining, setIsTraining] = useState(false);
  const [showStatGain, setShowStatGain] = useState(false);

  const canTrain = fighter && fighter.currentEnergy >= drill.energyCost;
  const energyColor = canTrain ? 'text-neon-green' : 'text-alert-red';

  const handleTrain = async () => {
    if (!canTrain) {
      addNotification(`Not enough energy! Need ${drill.energyCost}, have ${Math.ceil(fighter?.currentEnergy || 0)}`, 'error');
      return;
    }

    setIsTraining(true);
    setShowStatGain(true);

    // Simulate training animation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = train(drill);
    
    if (result.success) {
      addNotification(result.message, 'success', 2000);
      onTrainComplete?.();
    } else {
      addNotification(result.message, 'error');
    }

    setIsTraining(false);
    setTimeout(() => setShowStatGain(false), 1000);
  };

  return (
    <motion.div
      whileHover={{ y: canTrain ? -8 : 0, scale: canTrain ? 1.02 : 1 }}
      whileTap={{ scale: 0.98 }}
      className={`relative bg-dark-secondary border-2 rounded-lg p-6 transition-all ${
        canTrain ? 'border-neon-green/60 hover:border-neon-green cursor-pointer' : 'border-gray-600/40 opacity-75'
      }`}
    >
      {/* Icon */}
      <div className="text-4xl mb-4">{drill.icon}</div>

      {/* Title and Description */}
      <h3 className="text-lg font-bold text-white mb-2">{drill.name}</h3>
      <p className="text-sm text-gray-300 mb-4">{drill.description}</p>

      {/* Stats Gained */}
      <div className="bg-dark-tertiary rounded p-3 mb-4 space-y-2">
        {drill.benefits.map((benefit, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-gray-300">
              {benefit.stat === 'all' 
                ? 'All Stats' 
                : benefit.stat.charAt(0).toUpperCase() + benefit.stat.slice(1)
              }
            </span>
            <span className="text-neon-green font-bold">
              +{benefit.amount.toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Energy Cost */}
      <div className="flex items-center gap-2 mb-5">
        <Zap size={16} className={energyColor} />
        <span className={`text-sm font-bold ${energyColor}`}>
          {drill.energyCost} Energy
        </span>
      </div>

      {/* Train Button */}
      <motion.button
        whileHover={{ scale: canTrain ? 1.05 : 1 }}
        whileTap={{ scale: canTrain ? 0.95 : 1 }}
        onClick={handleTrain}
        disabled={!canTrain || isTraining}
        className={`w-full py-2 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
          isTraining
            ? 'bg-yellow-600 text-dark-bg'
            : canTrain
              ? 'bg-neon-green text-dark-bg hover:bg-green-400'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isTraining ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }}
            >
              <Zap size={16} />
            </motion.div>
            Training...
          </>
        ) : (
          <>
            <Check size={16} />
            Train
          </>
        )}
      </motion.button>

      {/* Stat Gain Animation */}
      {showStatGain && (
        <>
          {drill.benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 0, y: -50 }}
              transition={{ duration: 1, delay: idx * 0.2 }}
              className="absolute top-6 right-6 text-neon-green font-bold text-lg pointer-events-none"
            >
              +{benefit.amount.toFixed(1)}
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
};
