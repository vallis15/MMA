import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

interface ToastData {
  id: number;
  track: string;
}

export const NowPlayingToast: React.FC = () => {
  const { nowPlaying } = useMusic();
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    if (!nowPlaying) return;

    setToast({ id: Date.now(), track: nowPlaying });

    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [nowPlaying]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="now-playing-toast"
          >
            <div className="now-playing-icon">
              <Music2 size={15} />
            </div>
            <div className="now-playing-text">
              <span className="now-playing-label">NOW PLAYING</span>
              <span className="now-playing-track">{toast.track}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
