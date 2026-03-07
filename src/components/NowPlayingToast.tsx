import { motion, AnimatePresence } from 'framer-motion';
import { SkipBack, SkipForward, Volume2, VolumeX, Music2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const NowPlayingToast: React.FC = () => {
  const { isMuted, isStarted, nowPlaying, toggleMute, nextTrack, prevTrack } = useMusic();

  return (
    <AnimatePresence>
      {isStarted && (
        <motion.div
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="mini-player"
        >
          {/* Equalizer bars */}
          <div className={`mini-player-eq${isMuted ? ' mini-player-eq--paused' : ''}`} aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          {/* Prev */}
          <button className="mini-player-btn" onClick={prevTrack} title="Předchozí" aria-label="Předchozí">
            <SkipBack size={14} />
          </button>

          {/* Track info */}
          <div className="mini-player-info">
            <span className="mini-player-label">NOW PLAYING</span>
            <span className="mini-player-track">{nowPlaying ?? '—'}</span>
          </div>

          {/* Next */}
          <button className="mini-player-btn" onClick={nextTrack} title="Další" aria-label="Další">
            <SkipForward size={14} />
          </button>

          {/* Mute */}
          <button className="mini-player-btn mini-player-btn--mute" onClick={toggleMute} title={isMuted ? 'Zapnout zvuk' : 'Ztlumit'} aria-label={isMuted ? 'Zapnout zvuk' : 'Ztlumit'}>
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

