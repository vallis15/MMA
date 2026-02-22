import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { useLanguage } from '../context/LanguageContext';
import { TrainingCard } from '../components/TrainingCard';
import { TrainingDrill } from '../types';

const TRAINING_DRILLS: TrainingDrill[] = [
  {
    id: 'heavy-bag',
    name: 'drill_heavy_bag',
    description: 'drill_heavy_bag_desc',
    icon: '🥊',
    energyCost: 10,
    benefits: [{ stat: 'striking', amount: 0.5 }],
  },
  {
    id: 'bjj-rolling',
    name: 'drill_bjj_rolling',
    description: 'drill_bjj_rolling_desc',
    icon: '🤼',
    energyCost: 15,
    benefits: [{ stat: 'grappling', amount: 0.8 }],
  },
  {
    id: 'sprints',
    name: 'drill_sprints',
    description: 'drill_sprints_desc',
    icon: '🏃',
    energyCost: 20,
    benefits: [{ stat: 'speed', amount: 1.0 }],
  },
  {
    id: 'weightlifting',
    name: 'drill_weightlifting',
    description: 'drill_weightlifting_desc',
    icon: '🏋️',
    energyCost: 20,
    benefits: [{ stat: 'strength', amount: 1.0 }],
  },
  {
    id: 'sparring',
    name: 'drill_sparring',
    description: 'drill_sparring_desc',
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
    name: 'drill_intense_cardio',
    description: 'drill_intense_cardio_desc',
    icon: '🫁',
    energyCost: 15,
    benefits: [{ stat: 'cardio', amount: 1.2 }],
  },
];

export const Gym: React.FC = () => {
  const { fighter } = useFighter();
  const { t } = useLanguage();
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
            <h1 className="page-header text-neon-green glow-electric text-5xl">{t('gym')}</h1>
          </div>
          <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
            {canTrain
              ? t('gym_welcome').replace('{name}', fighter?.name || '')
              : t('gym_no_fighter')}
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
            <h3 className="section-header text-neon-green mb-3 text-3xl">{t('no_fighter_yet')}</h3>
            <p className="text-gray-400 uppercase tracking-widest text-sm">{t('gym_create_prompt')}</p>
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
            <h3 className="section-header text-neon-green mb-8 text-xl">{t('fighter_status')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">{t('energy')}</p>
                <p className="text-3xl font-bold text-cyan-400 glow-electric">
                  {Math.ceil(fighter?.currentEnergy || 0)}/100
                </p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">{t('level')}</p>
                <p className="text-3xl font-bold text-neon-green glow-electric">{fighter?.level}</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">{t('reputation')}</p>
                <p className="text-3xl font-bold text-yellow-400">{fighter?.reputation}</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">{t('avg_stats')}</p>
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
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">{t('wins')}</p>
                <p className="text-3xl font-bold text-neon-green glow-electric">{fighter?.record.wins || 0}</p>
              </motion.div>
              <motion.div className="text-center" whileHover={{ y: -4 }}>
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">{t('nickname')}</p>
                <p className="text-lg font-bold text-alert-red italic truncate">{fighter?.nickname}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
