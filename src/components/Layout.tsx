import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CombatWidget } from './CombatWidget';
import { NowPlayingToast } from './NowPlayingToast';

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
    <div className="flex min-h-screen bg-gradient-to-br from-iron-dark via-iron-mid to-iron-dark relative overflow-hidden">
      {/* Animated Background Grid — Blueprint / Structural */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(123,143,165,0.055) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(123,143,165,0.055) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.6,
        }}
        animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
      />

      {/* Language Switcher - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50 pointer-events-auto">
        <LanguageSwitcher />
      </div>

      {/* MiniPlayer — fixed top center, slides in after music starts */}
      <NowPlayingToast />

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
