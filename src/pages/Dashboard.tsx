import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bell, X } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FighterCard } from '../components/FighterCard';
import { FighterInitialization } from '../components/FighterInitialization';
export const Dashboard: React.FC = () => {
  const { fighter, createFighter, reloadFighter } = useFighter();
  const { user } = useAuth();
  const { t } = useLanguage();
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
      className="p-8 min-h-screen"
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
              className="mb-8 glass-card-premium p-5 border-l-4 border-alert-red/80 rounded-lg flex items-start gap-4 backdrop-blur-lg"
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Bell className="w-6 h-6 text-alert-red flex-shrink-0" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold uppercase tracking-wider text-sm mb-1">{t('global_announcement')}</p>
                <p className="text-gray-300 text-sm">{announcement}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.2, rotate: 90 }}
                onClick={() => setShowAnnouncement(false)}
                className="text-gray-400 hover:text-neon-green transition flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div className="mb-12" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-header text-neon-green glow-electric mb-3 text-5xl">{t('dashboard')}</h1>
          <p className="text-gray-400 text-lg uppercase tracking-widest">{t('dashboard_subtitle')}</p>
        </motion.div>

        {/* Fighter Section */}
        <div className="mb-12">
          {fighter && fighter.name !== 'Undefined' ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="section-header text-neon-green mb-8 text-3xl">{t('active_fighter')}</h2>
              <FighterCard fighter={fighter} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-premium rounded-2xl p-12 text-center border-2 border-dashed border-neon-green/40"
            >
              <motion.div className="text-6xl mb-6" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                🥋
              </motion.div>
              <h3 className="text-3xl font-oswald font-bold text-neon-green mb-3 uppercase tracking-wider">{t('no_fighter_yet')}</h3>
              <p className="text-gray-400 mb-8 uppercase tracking-widest text-sm">{t('create_fighter_prompt')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-green to-emerald-400 text-dark-bg font-bold px-8 py-3 rounded-lg hover:shadow-2xl hover:shadow-neon-green/50 transition-all uppercase tracking-wider text-sm border-glow-electric"
              >
                <Plus size={20} />
                {t('create_fighter')}
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Create Fighter Form Modal */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card-premium rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="section-header text-neon-green mb-8 text-2xl">{t('create_new_fighter')}</h3>
              <form onSubmit={handleCreateFighter} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">{t('fighter_name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('placeholder_name')}
                    className="w-full bg-dark-tertiary/50 border border-neon-green/30 focus:border-neon-green rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">{t('nickname')}</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder={t('placeholder_nickname')}
                    className="w-full bg-dark-tertiary/50 border border-neon-green/30 focus:border-neon-green rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-neon-green to-emerald-400 text-dark-bg font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-green/50 transition-all uppercase tracking-wider text-sm"
                  >
                    {t('create')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-dark-tertiary/50 text-gray-300 font-bold py-3 rounded-lg border border-dark-tertiary hover:border-alert-red/50 transition-all uppercase tracking-wider text-sm"
                  >
                    {t('cancel')}
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
