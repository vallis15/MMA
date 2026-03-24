import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification, NotificationType } from '../context/NotificationContext';

const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-900/90',
        border: 'border-forge-gold',
        icon: <CheckCircle size={20} className="text-forge-gold" />,
        text: 'text-forge-gold',
      };
    case 'error':
      return {
        bg: 'bg-red-900/90',
        border: 'border-red-800',
        icon: <AlertCircle size={20} className="text-red-400" />,
        text: 'text-red-400',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-900/90',
        border: 'border-yellow-500',
        icon: <AlertTriangle size={20} className="text-yellow-400" />,
        text: 'text-yellow-300',
      };
    case 'info':
    default:
      return {
        bg: 'bg-blue-900/90',
        border: 'border-blue-500',
        icon: <Info size={20} className="text-blue-400" />,
        text: 'text-blue-300',
      };
  }
};

export const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-6 right-6 z-[9999] max-w-md pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => {
          const styles = getNotificationStyles(notification.type);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className={`mb-3 pointer-events-auto`}
            >
              <div
                className={`${styles.bg} border ${styles.border} rounded-lg p-4 flex items-start gap-3 shadow-2xl`}
              >
                <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
                <div className={`flex-1 ${styles.text} text-sm font-medium`}>
                  {notification.message}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
