import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { TrainingCard } from '../components/TrainingCard';
import { TrainingDrill } from '../types';

const TRAINING_DRILLS: TrainingDrill[] = [
  {
    id: 'heavy-bag',
    name: 'Heavy Bag',
    description: 'Pound the heavy bag to improve striking technique.',
    icon: '🥊',
    energyCost: 10,
    benefits: [{ stat: 'striking', amount: 0.5 }],
  },
  {
    id: 'bjj-rolling',
    name: 'BJJ Rolling',
    description: 'Practice ground fighting and submissions.',
    icon: '🤼',
    energyCost: 15,
    benefits: [{ stat: 'grappling', amount: 0.8 }],
  },
  {
    id: 'sprints',
    name: 'Sprints',
    description: 'High-intensity cardio training.',
    icon: '🏃',
    energyCost: 20,
    benefits: [{ stat: 'speed', amount: 1.0 }],
  },
  {
    id: 'weightlifting',
    name: 'Weightlifting',
    description: 'Build raw power and strength.',
    icon: '🏋️',
    energyCost: 20,
    benefits: [{ stat: 'strength', amount: 1.0 }],
  },
  {
    id: 'sparring',
    name: 'Sparring',
    description: 'Full-contact training with all techniques.',
    icon: '⚡',
    energyCost: 30,
    benefits: [
      { stat: 'striking', amount: 0.5 },
      { stat: 'grappling', amount: 0.5 },
      { stat: 'speed', amount: 0.5 },
    ],
  },
  {
    id: 'cardio',
    name: 'Intense Cardio',
    description: 'Improve overall conditioning and stamina.',
    icon: '🫁',
    energyCost: 15,
    benefits: [{ stat: 'cardio', amount: 1.2 }],
  },
];

export const Gym: React.FC = () => {
  const { fighter } = useFighter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTrainComplete = () => {
    // Trigger re-render to update UI
    setRefreshKey((prev) => prev + 1);
  };

  const canTrain = fighter && fighter.name !== 'Undefined';

  return (
    <motion.div
      key={refreshKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 min-h-screen bg-gradient-to-br from-dark-bg via-dark-secondary/30 to-dark-bg"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell size={32} className="text-neon-green" />
            <h1 className="text-5xl font-black text-neon-green tracking-tight">Gym - Training</h1>
          </div>
          <p className="text-gray-400 text-lg">
            {canTrain
              ? `Welcome ${fighter?.name}! Choose a training drill to improve your stats.`
              : 'Create a fighter first to start training!'}
          </p>
        </div>

        {/* No Fighter Message */}
        {!canTrain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-secondary border-2 border-dashed border-neon-green/50 rounded-lg p-12 text-center"
          >
            <div className="text-6xl mb-4">🥋</div>
            <h3 className="text-2xl font-bold text-neon-green mb-2">No Fighter Yet</h3>
            <p className="text-gray-400">Create your first fighter on the Dashboard to start training!</p>
          </motion.div>
        )}

        {/* Training Grid */}
        {canTrain && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {TRAINING_DRILLS.map((drill, idx) => (
              <motion.div
                key={drill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <TrainingCard drill={drill} onTrainComplete={handleTrainComplete} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Fighter Status Footer */}
        {canTrain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-dark-secondary border border-neon-green/30 rounded-lg p-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-sm mb-1">Energy</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {Math.ceil(fighter?.currentEnergy || 0)}/100
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Level</p>
                <p className="text-2xl font-bold text-neon-green">{fighter?.level}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Reputation</p>
                <p className="text-2xl font-bold text-yellow-400">{fighter?.reputation}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Avg Stats</p>
                <p className="text-2xl font-bold text-neon-green">
                  {fighter
                    ? Math.round(
                        (fighter.stats.strength +
                          fighter.stats.speed +
                          fighter.stats.cardio +
                          fighter.stats.striking +
                          fighter.stats.grappling) /
                          5
                      )
                    : 0}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Wins</p>
                <p className="text-2xl font-bold text-neon-green">{fighter?.record.wins || 0}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Nickname</p>
                <p className="text-lg font-bold text-alert-red italic truncate">{fighter?.nickname}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
