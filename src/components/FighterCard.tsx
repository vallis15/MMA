import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy } from 'lucide-react';
import { Fighter } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { StatBar } from './StatBar';
import { EnergyBar } from './EnergyBar';

interface FighterCardProps {
  fighter: Fighter;
}

export const FighterCard: React.FC<FighterCardProps> = ({ fighter }) => {
  const { t } = useLanguage();
  const totalWins = fighter.record.wins + fighter.record.losses + fighter.record.draws;
  const winRate = totalWins > 0 ? ((fighter.record.wins / totalWins) * 100).toFixed(1) : 0;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-2xl mx-auto"
    >
      {/* Fighter Header */}
      <motion.div variants={itemVariants} className="bg-dark-secondary border border-neon-green/30 rounded-lg p-8 mb-6 shadow-2xl shadow-neon-green/10">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-black text-neon-green mb-2 tracking-tight">{fighter.name}</h1>
          <p className="text-2xl text-alert-red font-bold italic">"{fighter.nickname}"</p>
        </div>

        {/* Record */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-dark-tertiary rounded-lg p-4 text-center border border-neon-green/20">
            <p className="text-sm text-gray-400 mb-1">{t('wins')}</p>
            <p className="text-3xl font-bold text-neon-green">{fighter.record.wins}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-dark-tertiary rounded-lg p-4 text-center border border-alert-red/20">
            <p className="text-sm text-gray-400 mb-1">{t('losses')}</p>
            <p className="text-3xl font-bold text-alert-red">{fighter.record.losses}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-dark-tertiary rounded-lg p-4 text-center border border-gray-500/20">
            <p className="text-sm text-gray-400 mb-1">{t('draws')}</p>
            <p className="text-3xl font-bold text-gray-400">{fighter.record.draws}</p>
          </motion.div>
        </div>

        {/* Reputation */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-dark-tertiary rounded-lg p-4 text-center border border-yellow-500/20">
            <p className="text-sm text-gray-400 mb-1">{t('reputation')}</p>
            <p className="text-3xl font-bold text-yellow-400">{fighter.reputation}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-dark-tertiary rounded-lg p-4 text-center border border-neon-green/20">
            <p className="text-sm text-gray-400 mb-1">{t('energy')}</p>
            <motion.p
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl font-bold text-yellow-400"
            >
              {Math.ceil(fighter.currentEnergy)}
            </motion.p>
          </motion.div>
        </div>

        {/* Win Rate */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-dark-tertiary px-4 py-2 rounded-full border border-neon-green/30">
            <Trophy size={18} className="text-neon-green" />
            <span className="text-gray-300">{t('win_rate_label')} </span>
            <span className="font-bold text-neon-green">{winRate}%</span>
          </div>
        </div>
      </motion.div>

      {/* Energy & Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Energy */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <EnergyBar />
        </motion.div>
      </div>

      {/* Fighter Stats */}
      <motion.div variants={itemVariants} className="bg-dark-secondary border border-neon-green/20 rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-neon-green mb-6 flex items-center gap-2">
          <Zap size={24} />
          {t('fighter_stats')}
        </h2>

        <div className="space-y-5">
          <StatBar
            label={t('strength')}
            value={fighter.stats.strength}
            maxValue={100}
            icon="💪"
          />
          <StatBar
            label={t('speed')}
            value={fighter.stats.speed}
            maxValue={100}
            icon="⚡"
          />
          <StatBar
            label={t('cardio')}
            value={fighter.stats.cardio}
            maxValue={100}
            icon="🫁"
          />
          <StatBar
            label={t('striking')}
            value={fighter.stats.striking}
            maxValue={100}
            icon="👊"
          />
          <StatBar
            label={t('grappling')}
            value={fighter.stats.grappling}
            maxValue={100}
            icon="🤼"
          />
        </div>

        {/* Average Stat */}
        <motion.div whileHover={{ scale: 1.02 }} className="mt-6 pt-6 border-t border-dark-tertiary">
          <div className="flex justify-between items-center bg-dark-tertiary rounded-lg p-4 border border-neon-green/20">
            <span className="text-gray-300 font-medium">{t('average_stat')}</span>
            <span className="text-2xl font-bold text-neon-green">
              {Math.round(
                (fighter.stats.strength +
                  fighter.stats.speed +
                  fighter.stats.cardio +
                  fighter.stats.striking +
                  fighter.stats.grappling) /
                  5
              )}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
