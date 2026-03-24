import React, { useState } from 'react';
import { Menu, X, Home, Dumbbell, Zap, Trophy, LogOut, UserCog, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab = 'dashboard', onTabChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', icon: Home, path: '/' },
    { id: 'profile', icon: UserCog, path: '/profile' },
    { id: 'gym', icon: Dumbbell, path: '/gym' },
    { id: 'skills', icon: GitBranch, path: '/skills' },
    { id: 'arena', icon: Zap, path: '/arena' },
    { id: 'rankings', icon: Trophy, path: '/rankings' },
  ];

  const handleNavClick = (itemId: string, path: string) => {
    onTabChange?.(itemId);
    navigate(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-iron-light hover:bg-iron-mid rounded-lg transition-colors lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-screen w-64 z-40 lg:relative lg:translate-x-0 flex flex-col glass-card-premium border-r border-steel/20 texture-brushed-steel"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 border-b border-steel/15 arena-floodlight"
        >
          <div className="flex items-center gap-3">
            {/* Octagon Logo */}
            <div
              className="w-10 h-10 border-2 border-forge-gold flex items-center justify-center font-bold text-forge-gold text-xs"
              style={{
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                boxShadow: '0 0 12px rgba(201,168,76,0.25)',
                background: 'rgba(201,168,76,0.06)',
              }}
            >
              MMA
            </div>
            <div>
              <h1 className="text-lg font-montserrat font-bold text-forge-gold glow-gold uppercase tracking-wider">
                MMA Manager
              </h1>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Fight System</p>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
                onClick={() => handleNavClick(item.id, item.path)}
                whileHover={{ x: 6 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-forge-gold/15 border border-forge-gold/70 text-forge-gold font-semibold border-glow-electric'
                    : 'text-gray-300 hover:bg-iron-light/50 border border-transparent hover:border-steel/25'
                }`}
              >
                {/* Glow background on active */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-forge-gold/8 -z-10"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                <Icon size={20} className="group-hover:text-forge-gold transition-colors" />
                <div className="text-left">
                  <div className="font-semibold uppercase text-xs tracking-wider">{t(item.id)}</div>
                  <div className="text-xs opacity-60 group-hover:opacity-80 transition">{t(`${item.id}_description`)}</div>
                </div>

                {/* Right border glow */}
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-forge-gold to-burnished shadow-sm shadow-forge-gold/30" />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 border-t border-steel/15 bg-iron-light/30 space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-oxblood/25 to-red-950/25 border border-oxblood/40 text-oxblood rounded-lg hover:from-oxblood/40 hover:to-red-950/40 transition-all duration-300 font-semibold uppercase text-xs tracking-wider group"
          >
            <LogOut size={16} className="group-hover:animate-pulse" />
            {t('logout')}
          </motion.button>
          <p className="text-xs text-gray-500 text-center font-oswald uppercase tracking-wider">v1.0.0</p>
        </motion.div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
};
