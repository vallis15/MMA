import React, { useState } from 'react';
import { Menu, X, Home, Dumbbell, Zap, Trophy, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab = 'dashboard', onTabChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Home', path: '/' },
    { id: 'gym', label: 'Gym', icon: Dumbbell, description: 'Training', path: '/gym' },
    { id: 'arena', label: 'Arena', icon: Zap, description: 'Fights', path: '/arena' },
    { id: 'rankings', label: 'Rankings', icon: Trophy, description: 'Leaderboards', path: '/rankings' },
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
        className="fixed top-4 left-4 z-50 p-2 bg-dark-tertiary hover:bg-dark-secondary rounded-lg transition-colors lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-screen w-64 bg-dark-secondary border-r border-dark-tertiary z-40 lg:relative lg:translate-x-0 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-dark-tertiary">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-neon-green rounded-lg flex items-center justify-center font-bold text-dark-bg">
              MMA
            </div>
            <div>
              <h1 className="text-xl font-bold text-neon-green">MMA Manager</h1>
              <p className="text-xs text-gray-400">Fight Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.path)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-neon-green text-dark-bg font-semibold shadow-lg shadow-neon-green/20'
                    : 'text-gray-300 hover:bg-dark-tertiary'
                }`}
              >
                <Icon size={20} />
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dark-tertiary bg-dark-secondary space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-alert-red/20 border border-alert-red/30 text-alert-red rounded-lg hover:bg-alert-red/40 transition"
          >
            <LogOut size={16} />
            Logout
          </motion.button>
          <p className="text-xs text-gray-500 text-center">v1.0.0</p>
        </div>
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
