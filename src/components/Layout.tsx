import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CombatWidget } from './CombatWidget';

interface LayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-dark-bg via-dark-secondary to-dark-bg relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
        animate={{ backgroundPosition: ['0px 0px', '50px 50px'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Language Switcher - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50 pointer-events-auto">
        <LanguageSwitcher />
      </div>

      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* Main Content */}
      <motion.main
        className="flex-1 overflow-auto"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={containerVariants}>
          {children}
        </motion.div>
      </motion.main>

      {/* Persistent Combat Widget — visible across all routes except /arena */}
      <CombatWidget />
    </div>
  );
};
