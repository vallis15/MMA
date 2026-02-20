import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { OpponentCard } from '../components/OpponentCard';
import { AIFighter } from '../types';
import { getRandomOpponents } from '../utils/opponents';

export const Arena: React.FC = () => {
  const { fighter } = useFighter();
  const [opponents, setOpponents] = useState<AIFighter[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (fighter && fighter.name !== 'Undefined' && !hasGenerated) {
      setOpponents(getRandomOpponents(3));
      setHasGenerated(true);
    }
  }, [fighter, hasGenerated]);

  const canFight = fighter && fighter.name !== 'Undefined' && fighter.currentEnergy >= 50;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="mb-12" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-4">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Zap size={36} className="text-alert-red glow-crimson" />
            </motion.div>
            <h1 className="page-header text-alert-red glow-crimson text-5xl">Arena</h1>
          </div>
          <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
            {canFight
              ? `Welcome ${fighter?.name}! Choose your opponent and prepare for battle.`
              : !fighter || fighter.name === 'Undefined'
                ? 'Create a fighter first to compete in the Arena!'
                : 'You need 50 Energy to fight. Train or rest to recover!'}
          </p>
        </motion.div>

        {/* No Fighter Message */}
        {!fighter || fighter.name === 'Undefined' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-premium rounded-2xl p-12 text-center border-2 border-dashed border-alert-red/40"
          >
            <motion.div className="text-6xl mb-6" animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              ⚡
            </motion.div>
            <h3 className="section-header text-alert-red mb-3 text-3xl">No Fighter Yet</h3>
            <p className="text-gray-400 uppercase tracking-widest text-sm">Create your first fighter on the Dashboard to enter the Arena!</p>
          </motion.div>
        ) : !canFight ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-premium rounded-2xl p-12 text-center border-2 border-dashed border-yellow-500/40"
          >
            <motion.div className="text-6xl mb-6" animate={{ y: [0, -8, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
              😴
            </motion.div>
            <h3 className="section-header text-yellow-400 mb-3 text-3xl">Not Enough Energy</h3>
            <p className="text-gray-300 uppercase tracking-widest text-sm mb-4">
              You need 50 Energy to fight. You have {Math.ceil(fighter?.currentEnergy || 0)}.
            </p>
            <p className="text-gray-400 uppercase tracking-widest text-sm">Go to the Gym to train and regain energy!</p>
          </motion.div>
        ) : (
          <>
            {/* Fighter vs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card-premium rounded-2xl p-8 mb-12 border-l-4 border-alert-red/50"
            >
              <h3 className="section-header text-alert-red text-xl mb-8 text-center">Choose Your Opponent</h3>
              <div className="grid grid-cols-3 gap-8 items-center">
                {/* Player */}
                <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                  <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-3">Your Fighter</p>
                  <motion.div className="text-5xl mb-4" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    👊
                  </motion.div>
                  <p className="text-lg font-bold text-neon-green glow-electric">{fighter?.name}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-2">
                    {fighter?.record.wins}W-{fighter?.record.losses}L-{fighter?.record.draws}D
                  </p>
                </motion.div>

                {/* VS */}
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-5xl font-black text-alert-red glow-crimson mb-4"
                  >
                    VS
                  </motion.div>
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Energy</p>
                    <p className="text-2xl font-bold text-cyan-400 glow-electric">{Math.ceil(fighter?.currentEnergy || 0)}</p>
                  </div>
                </div>

                {/* Opponent Placeholder */}
                <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                  <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-3">Select Below</p>
                  <motion.div className="text-5xl mb-4" animate={{ scale: [1, 0.95, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    🥊
                  </motion.div>
                  <p className="text-lg font-bold text-alert-red uppercase tracking-wider">Choose Opponent</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Opponents Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {opponents.map((opponent, idx) => (
                <motion.div
                  key={opponent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <OpponentCard opponent={opponent} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};
