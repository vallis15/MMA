import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const PLAYLIST = [
  'alexzavesa-devil-forces-10944.mp3',
  'businessstar-knockout-coach-374651.mp3',
  'crab_audio-achievements-in-sports-303270.mp3',
  'crab_audio-the-main-one-in-the-ring-304205.mp3',
  'dimmysad-speed-fire-384405.mp3',
  'frostime-fight-482665.mp3',
  'soulprodmusic-escape-143112.mp3',
  'tunetank-powerful-sport-rock-music-349200.mp3',
  'u_98o9hlkn7r-sport-trap-hip-hop-energy-281102.mp3',
];

const TRACK_NAMES: Record<string, string> = {
  'alexzavesa-devil-forces-10944': 'Devil Forces',
  'businessstar-knockout-coach-374651': 'Knockout Coach',
  'crab_audio-achievements-in-sports-303270': 'Achievements In Sports',
  'crab_audio-the-main-one-in-the-ring-304205': 'The Main One In The Ring',
  'dimmysad-speed-fire-384405': 'Speed Fire',
  'frostime-fight-482665': 'Fight',
  'soulprodmusic-escape-143112': 'Escape',
  'tunetank-powerful-sport-rock-music-349200': 'Powerful Sport Rock',
  'u_98o9hlkn7r-sport-trap-hip-hop-energy-281102': 'Sport Trap Hip-Hop',
};

function getTrackName(filename: string): string {
  const key = filename.replace(/\.mp3$/, '');
  return TRACK_NAMES[key] ?? key;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MusicContextType {
  isMuted: boolean;
  isStarted: boolean;
  nowPlaying: string | null;
  startPlayback: () => void;
  toggleMute: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = (): MusicContextType => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<string[]>(shuffle(PLAYLIST));
  const indexRef = useRef(0);
  const isMutedRef = useRef(false);
  const startedRef = useRef(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);

  const playTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    // Remove old ended listener, add fresh one
    const track = playlistRef.current[index];
    audio.src = `/music/${track}`;
    audio.volume = isMutedRef.current ? 0 : 0.25;
    audio.play().catch(() => {});
    setNowPlaying(getTrackName(track));
  }, []);

  const advanceTrack = useCallback(() => {
    const next = (indexRef.current + 1) % playlistRef.current.length;
    if (next === 0) playlistRef.current = shuffle(PLAYLIST);
    indexRef.current = next;
    playTrack(next);
  }, [playTrack]);

  const startPlayback = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const audio = new Audio();
    audio.volume = 0.25;
    audio.addEventListener('ended', advanceTrack);
    audioRef.current = audio;

    setIsStarted(true);
    const track = playlistRef.current[0];
    audio.src = `/music/${track}`;
    audio.play().catch(() => {});
    setNowPlaying(getTrackName(track));
  }, [advanceTrack]);

  const nextTrack = useCallback(() => {
    if (!audioRef.current) return;
    const next = (indexRef.current + 1) % playlistRef.current.length;
    if (next === 0) playlistRef.current = shuffle(PLAYLIST);
    indexRef.current = next;
    playTrack(next);
  }, [playTrack]);

  const prevTrack = useCallback(() => {
    if (!audioRef.current) return;
    const prev = (indexRef.current - 1 + playlistRef.current.length) % playlistRef.current.length;
    indexRef.current = prev;
    playTrack(prev);
  }, [playTrack]);

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    setIsMuted(isMutedRef.current);
    if (audioRef.current) {
      audioRef.current.volume = isMutedRef.current ? 0 : 0.25;
    }
  }, []);

  return (
    <MusicContext.Provider value={{ isMuted, isStarted, nowPlaying, startPlayback, toggleMute, nextTrack, prevTrack }}>
      {children}
    </MusicContext.Provider>
  );
};
