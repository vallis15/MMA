import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bell, X } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { useAuth } from '../context/AuthContext';
import { FighterCard } from '../components/FighterCard';
import { FighterInitialization } from '../components/FighterInitialization';
export const Dashboard: React.FC = () => {
  const { fighter, createFighter, reloadFighter } = useFighter();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInitialization, setShowInitialization] = useState(false);
  const [formData, setFormData] = useState({ name: '', nickname: '' });
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // Check if user needs fighter initialization on mount
  useEffect(() => {
    const checkNeedsInitialization = async () => {
      if (!user || !fighter) return;

      // Check if fighter is uninitialized (just has email prefix as name)
      // Email prefix would be all lowercase, no spaces, looks like "user" not "John Doe"
      const isEmailPrefix = fighter.name === fighter.name.toLowerCase() && !fighter.name.includes(' ');
      const isDefault = fighter.name === 'Fighter' || fighter.name === 'Undefined';

      console.log('🔵 [INIT CHECK] Fighter name:', fighter.name);
      console.log('🔵 [INIT CHECK] Is email prefix:', isEmailPrefix);
      console.log('🔵 [INIT CHECK] Is default:', isDefault);

      // If using email prefix as name, show initialization modal
      if (isEmailPrefix && !isDefault) {
        console.log('✅ [INIT CHECK] New user detected, showing initialization');
        setShowInitialization(true);
      } else {
        console.log('🔵 [INIT CHECK] User already initialized or custom name set');
        setShowInitialization(false);
      }
    };

    checkNeedsInitialization();
  }, [fighter, user]);

  // Load announcement from admin dashboard
  useEffect(() => {
    const savedAnnouncement = localStorage.getItem('global_announcement');
    if (savedAnnouncement) {
      setAnnouncement(savedAnnouncement);
      setShowAnnouncement(true);
    }
  }, []);

  const handleInitializationComplete = async (fighterName: string) => {
    console.log('🔵 [INIT COMPLETE] Initializing complete, updating FighterContext');

    // Update FighterContext with new stats
    createFighter(fighterName, fighter?.nickname || 'The Champion');

    console.log('✅ [INIT COMPLETE] Fighter initialized with name:', fighterName);

    // Reload fighter data from Supabase to get all updated stats and info
    await reloadFighter();

    setShowInitialization(false);

    console.log('✅ [INIT COMPLETE] Fighter data reloaded from Supabase');
  };

  const handleCreateFighter = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.nickname) {
      createFighter(formData.name, formData.nickname);
      setFormData({ name: '', nickname: '' });
      setShowCreateForm(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 min-h-screen bg-gradient-to-br from-dark-bg via-dark-secondary/30 to-dark-bg"
    >
      <div className="max-w-7xl mx-auto">
        {/* Fighter Initialization Modal */}
        <AnimatePresence>
          {showInitialization && user && (
            <FighterInitialization
              userId={user.id}
              onComplete={handleInitializationComplete}
            />
          )}
        </AnimatePresence>
        {/* Global Announcement Banner */}
        <AnimatePresence>
          {announcement && showAnnouncement && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-gradient-to-r from-alert-red/20 to-orange-500/20 border border-alert-red/50 rounded-lg flex items-start gap-3"
            >
              <Bell className="w-5 h-5 text-alert-red mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-semibold">Global Announcement</p>
                <p className="text-gray-300 text-sm">{announcement}</p>
              </div>
              <button
                onClick={() => setShowAnnouncement(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-neon-green mb-2 tracking-tight">Dashboard</h1>
          <p className="text-gray-400 text-lg">Your complete MMA fighter management system</p>
        </div>

        {/* Fighter Section */}
        <div className="mb-12">
          {fighter && fighter.name !== 'Undefined' ? (
            <>
              <h2 className="text-3xl font-bold text-neon-green mb-8">Active Fighter</h2>
              <FighterCard fighter={fighter} />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-secondary border-2 border-dashed border-neon-green/50 rounded-lg p-12 text-center"
            >
              <div className="text-6xl mb-4">🥋</div>
              <h3 className="text-2xl font-bold text-neon-green mb-2">No Fighter Yet</h3>
              <p className="text-gray-400 mb-6">Create your first fighter to get started!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 bg-neon-green text-dark-bg font-bold px-6 py-3 rounded-lg hover:bg-green-400 transition-colors shadow-lg shadow-neon-green/50"
              >
                <Plus size={20} />
                Create Fighter
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Create Fighter Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-dark-secondary border border-neon-green/50 rounded-lg p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-neon-green mb-6">Create New Fighter</h3>
              <form onSubmit={handleCreateFighter} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fighter Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., John Smith"
                    className="w-full bg-dark-tertiary border border-neon-green/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-neon-green focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nickname</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="e.g., The Champion"
                    className="w-full bg-dark-tertiary border border-neon-green/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-neon-green focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 bg-neon-green text-dark-bg font-bold py-2 rounded-lg hover:bg-green-400 transition-colors"
                  >
                    Create
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-dark-tertiary text-gray-300 font-bold py-2 rounded-lg border border-dark-tertiary hover:border-neon-green/50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
