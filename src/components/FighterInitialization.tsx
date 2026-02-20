import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FightingStyle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  bonusStat: string;
  bonusAmount: number;
  color: string;
  gradient: string;
}

const FIGHTING_STYLES: FightingStyle[] = [
  {
    id: 'striker',
    name: 'Striker',
    description: 'Master of striking techniques and footwork',
    icon: <Flame size={32} />,
    bonusStat: 'striking',
    bonusAmount: 5,
    color: 'border-orange-500',
    gradient: 'from-orange-600/20 to-orange-400/20',
  },
  {
    id: 'wrestler',
    name: 'Wrestler',
    description: 'Expert in takedowns and ground control',
    icon: <Shield size={32} />,
    bonusStat: 'grappling',
    bonusAmount: 5,
    color: 'border-blue-500',
    gradient: 'from-blue-600/20 to-blue-400/20',
  },
  {
    id: 'speedster',
    name: 'Speedster',
    description: 'Lightning-fast movements and reflexes',
    icon: <Zap size={32} />,
    bonusStat: 'speed',
    bonusAmount: 5,
    color: 'border-yellow-500',
    gradient: 'from-yellow-600/20 to-yellow-400/20',
  },
];

interface FighterInitializationProps {
  userId: string;
  onComplete: (fighterName: string, stats: Record<string, number>) => void;
}

export const FighterInitialization: React.FC<FighterInitializationProps> = ({
  userId,
  onComplete,
}) => {
  const [fighterName, setFighterName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartCareer = async () => {
    if (!fighterName.trim() || !selectedStyle) {
      setError('Please enter a fighter name and select a fighting style');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find the selected style
      const style = FIGHTING_STYLES.find((s) => s.id === selectedStyle);
      if (!style) {
        setError('Invalid fighting style selected');
        return;
      }

      console.log('🔵 [FIGHTER INIT] Starting career initialization');
      console.log('🔵 [FIGHTER INIT] Fighter name:', fighterName);
      console.log('🔵 [FIGHTER INIT] Fighting style:', style.name);
      console.log('🔵 [FIGHTER INIT] Stat bonus:', style.bonusStat, '+', style.bonusAmount);

      // Calculate new stats with bonus
      const newStats: Record<string, number> = {
        striking: 40,
        grappling: 40,
        speed: 40,
        strength: 40,
        cardio: 40,
      };

      // Apply fighting style bonus
      if (style.bonusStat in newStats) {
        newStats[style.bonusStat] = Math.min(100, newStats[style.bonusStat] + style.bonusAmount);
      }

      console.log('🔵 [FIGHTER INIT] Updated stats:', newStats);

      // Update profile in Supabase
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: fighterName,
          striking: newStats.striking,
          grappling: newStats.grappling,
          speed: newStats.speed,
          strength: newStats.strength,
          cardio: newStats.cardio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('❌ [FIGHTER INIT] Supabase error:', updateError);
        setError(`Failed to initialize fighter: ${updateError.message}`);
        return;
      }

      console.log('✅ [FIGHTER INIT] Career initialized successfully!', data);
      console.log('✅ [FIGHTER INIT] Fighter name:', fighterName);
      console.log('✅ [FIGHTER INIT] Stats updated:', newStats);

      // Call parent callback
      onComplete(fighterName, newStats);
    } catch (err) {
      console.error('❌ [FIGHTER INIT] Exception:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-gradient-to-br from-dark-secondary via-dark-secondary/90 to-dark-tertiary border-2 border-neon-green/50 rounded-2xl p-8 w-full max-w-2xl shadow-2xl shadow-neon-green/20 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="text-6xl mb-4">🥋</div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-cyan-400 to-neon-green mb-2 tracking-tight">
            Welcome to the Octagon
          </h1>
          <p className="text-gray-300 text-lg">Create your fighter and choose your path to glory</p>
        </motion.div>

        {/* Fighter Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <label className="block text-lg font-bold text-neon-green mb-3">Fighter Name</label>
          <input
            type="text"
            value={fighterName}
            onChange={(e) => {
              setFighterName(e.target.value);
              setError(null);
            }}
            placeholder="Enter your fighter name..."
            className="w-full bg-dark-tertiary/50 border-2 border-neon-green/30 rounded-lg px-5 py-3 text-white text-lg placeholder-gray-500 focus:border-neon-green focus:outline-none focus:shadow-lg focus:shadow-neon-green/30 transition-all"
            disabled={loading}
          />
        </motion.div>

        {/* Fighting Styles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <label className="block text-lg font-bold text-neon-green mb-4">Choose Your Fighting Style</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FIGHTING_STYLES.map((style) => (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedStyle(style.id);
                  setError(null);
                }}
                disabled={loading}
                className={`relative rounded-lg p-6 border-2 transition-all ${
                  selectedStyle === style.id
                    ? `${style.color} bg-gradient-to-br ${style.gradient} shadow-lg shadow-current/50`
                    : 'border-gray-600 bg-dark-tertiary/30 hover:border-gray-400'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Selected Check */}
                {selectedStyle === style.id && (
                  <motion.div
                    layoutId="selected-style"
                    className="absolute inset-0 border-2 border-current rounded-lg"
                  />
                )}

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-4xl mb-3 text-center">{style.icon}</div>
                  <h3 className="text-xl font-bold text-white text-center mb-2">{style.name}</h3>
                  <p className="text-sm text-gray-300 text-center mb-3">{style.description}</p>

                  {/* Bonus Stat */}
                  <div className="text-xs font-semibold uppercase tracking-wider text-center">
                    <span className="text-neon-green">+{style.bonusAmount}</span>
                    <span className="text-gray-400"> {style.bonusStat}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-alert-red/20 border border-alert-red/50 rounded-lg text-alert-red text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Stats Preview */}
        {selectedStyle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-5 bg-dark-tertiary/50 border border-neon-green/30 rounded-lg"
          >
            <h3 className="text-sm font-bold text-neon-green mb-3 uppercase tracking-wider">Starting Stats</h3>
            <div className="space-y-2">
              {Object.entries({
                striking: 40,
                grappling: 40,
                speed: 40,
                strength: 40,
                cardio: 40,
              }).map(([stat, baseValue]) => {
                const styleBonus =
                  FIGHTING_STYLES.find((s) => s.id === selectedStyle)?.bonusStat === stat
                    ? FIGHTING_STYLES.find((s) => s.id === selectedStyle)!.bonusAmount
                    : 0;
                const finalValue = baseValue + styleBonus;

                return (
                  <div key={stat} className="flex items-center gap-3">
                    <span className="capitalize text-gray-400 w-20 text-sm font-medium">{stat}:</span>
                    <div className="flex-1 bg-dark-bg/50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(finalValue / 100) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="h-full bg-gradient-to-r from-neon-green to-cyan-400"
                      />
                    </div>
                    <span className="text-white font-bold w-12 text-right text-sm">
                      {finalValue}
                      {styleBonus > 0 && <span className="text-neon-green">+{styleBonus}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartCareer}
            disabled={loading || !fighterName.trim() || !selectedStyle}
            className="flex-1 bg-gradient-to-r from-neon-green to-cyan-400 text-dark-bg font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-green/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all text-lg"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block"
              >
                ⏳
              </motion.div>
            ) : (
              '⚡ Start Career'
            )}
          </motion.button>
        </motion.div>

        {/* Info Text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Don't worry, you can always change your name and retrain your stats later!
        </p>
      </motion.div>
    </motion.div>
  );
};
