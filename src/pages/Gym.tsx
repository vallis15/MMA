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
      className="p-8 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="mb-12" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-4">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Dumbbell size={36} className="text-neon-green glow-electric" />
            </motion.div>
            <h1 className="page-header text-neon-green glow-electric text-5xl">Gym</h1>
          </div>
          <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
            {canTrain
              ? `Welcome ${fighter?.name}! Choose a training drill to improve your stats.`
              : 'Create a fighter first to start training!'}
          </p>
        </motion.div>

        {/* No Fighter Message */}
        {!canTrain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-premium rounded-2xl p-12 text-center border-2 border-dashed border-neon-green/40"
          >
            <motion.div className="text-6xl mb-6" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              🥋
            </motion.div>
            <h3 className="section-header text-neon-green mb-3 text-3xl">No Fighter Yet</h3>
            <p className="text-gray-400 uppercase tracking-widest text-sm">Create your first fighter on the Dashboard to start training!</p>
          </motion.div>
        )}

        {/* Training Grid */}
        {canTrain && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, staggerChildren: 0.1 }}
          >
            {TRAINING_DRILLS.map((drill, idx) => (
              <motion.div
                key={drill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
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
            className="mt-12 glass-card-premium rounded-2xl p-8 border-l-4 border-neon-green/50"
          >
            <h3 className="section-header text-neon-green mb-8 text-xl">Fighter Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">Energy</p>
                <p className="text-3xl font-bold text-cyan-400 glow-electric">
                  {Math.ceil(fighter?.currentEnergy || 0)}/100
                </p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">Level</p>
                <p className="text-3xl font-bold text-neon-green glow-electric">{fighter?.level}</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">Reputation</p>
                <p className="text-3xl font-bold text-yellow-400">{fighter?.reputation}</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">Avg Stats</p>
                <p className="text-3xl font-bold text-neon-green glow-electric">
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
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">Wins</p>
                <p className="text-3xl font-bold text-neon-green glow-electric">{fighter?.record.wins || 0}</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">Nickname</p>
                <p className="text-lg font-bold text-alert-red italic truncate">{fighter?.nickname}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
