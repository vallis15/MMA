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
      className="p-8 min-h-screen bg-gradient-to-br from-dark-bg via-dark-secondary/30 to-dark-bg"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={32} className="text-alert-red" />
            <h1 className="text-5xl font-black text-alert-red tracking-tight">Arena - Fights</h1>
          </div>
          <p className="text-gray-400 text-lg">
            {canFight
              ? `Welcome ${fighter?.name}! Choose your opponent and prepare for battle.`
              : !fighter || fighter.name === 'Undefined'
                ? 'Create a fighter first to compete in the Arena!'
                : 'You need 50 Energy to fight. Train or rest to recover!'}
          </p>
        </div>

        {/* No Fighter Message */}
        {!fighter || fighter.name === 'Undefined' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-secondary border-2 border-dashed border-alert-red/50 rounded-lg p-12 text-center"
          >
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold text-alert-red mb-2">No Fighter Yet</h3>
            <p className="text-gray-400">Create your first fighter on the Dashboard to enter the Arena!</p>
          </motion.div>
        ) : !canFight ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-secondary border-2 border-dashed border-yellow-500/50 rounded-lg p-12 text-center"
          >
            <div className="text-6xl mb-4">😴</div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-2">Not Enough Energy</h3>
            <p className="text-gray-400 mb-4">
              You need 50 Energy to fight. You have {Math.ceil(fighter?.currentEnergy || 0)}.
            </p>
            <p className="text-gray-400">Go to the Gym to train and regain energy!</p>
          </motion.div>
        ) : (
          <>
            {/* Fighter vs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-secondary border border-alert-red/30 rounded-lg p-6 mb-12 text-center"
            >
              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Player */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">You</p>
                  <div className="text-5xl mb-2">👊</div>
                  <p className="text-lg font-bold text-neon-green">{fighter?.name}</p>
                  <p className="text-xs text-gray-400">
                    {fighter?.record.wins}W-{fighter?.record.losses}L-{fighter?.record.draws}D
                  </p>
                </div>

                {/* VS */}
                <div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl font-black text-alert-red"
                  >
                    VS
                  </motion.div>
                  <p className="text-xs text-gray-400 mt-2">Energy: {Math.ceil(fighter?.currentEnergy || 0)}</p>
                </div>

                {/* Opponent Placeholder */}
                <div>
                  <p className="text-gray-400 text-sm mb-2">Opponent</p>
                  <div className="text-5xl mb-2">🥊</div>
                  <p className="text-lg font-bold text-alert-red">Choose Your Opponent</p>
                </div>
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
