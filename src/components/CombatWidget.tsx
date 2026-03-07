/**
 * CombatWidget.tsx
 *
 * A persistent floating widget that shows live fight status independent of
 * the current route.  It is rendered inside <Layout> so it survives
 * navigation.  It is hidden on the /arena route (the full view is there).
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Swords, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFight } from '../context/FightContext';
import type { HealthStatus } from '../context/FightContext';

// ─── Tiny HP bar ─────────────────────────────────────────────────────────────
const MiniHpBar: React.FC<{
  label: string;
  hs: HealthStatus;
  color: string;
  glowColor: string;
  align: 'left' | 'right';
}> = ({ label, hs, color, glowColor, align }) => {
  const totalHp     = hs.head + hs.body + hs.legs;
  const totalMaxHp  = 300;
  const pct         = Math.max(0, Math.min(100, (totalHp / totalMaxHp) * 100));
  const isLeft      = align === 'left';

  return (
    <div className={`flex flex-col gap-1 ${isLeft ? 'items-start' : 'items-end'} min-w-0 flex-1`}>
      <p
        className="text-[9px] font-black uppercase tracking-widest truncate max-w-[80px]"
        style={{ color, textShadow: `0 0 8px ${glowColor}` }}
      >
        {label}
      </p>

      {/* Total HP bar */}
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${glowColor})`, boxShadow: `0 0 6px ${glowColor}` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Zone bars: Head / Body / Legs */}
      <div className={`flex gap-0.5 w-full ${isLeft ? '' : 'flex-row-reverse'}`}>
        {(['head', 'body', 'legs'] as const).map(part => {
          const zonePct = Math.max(0, Math.min(100, hs[part]));
          const zoneColor = zonePct < 30 ? '#ff1744' : zonePct < 60 ? '#ffd600' : color;
          return (
            <div key={part} className="h-1 flex-1 rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-sm"
                style={{ background: zoneColor }}
                animate={{ width: `${zonePct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          );
        })}
      </div>

      <p className="text-[7px] text-gray-500 font-mono">{Math.round(totalHp)}/300</p>
    </div>
  );
};

// ─── Ticker (scrolling last log entry) ───────────────────────────────────────
const LogTicker: React.FC<{ message: string }> = ({ message }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(message.slice(0, i));
      if (i >= message.length) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [message]);

  return (
    <p className="text-[9px] font-mono text-gray-400 truncate leading-none">
      {displayed}
      {displayed.length < message.length && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.3, repeat: Infinity }} className="inline-block w-1 h-2.5 ml-0.5 align-middle bg-cyan-400" />
      )}
    </p>
  );
};

// ─── Main widget ─────────────────────────────────────────────────────────────
export const CombatWidget: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const fight     = useFight();

  const { isBattling, battleResult, playerHS, opponentHS, currentRound, battleLog, selectedOpponent } = fight;
  const isOnArena = location.pathname === '/arena';

  // Show only when relevant AND not on Arena page (the full UI is there)
  const shouldShow = (isBattling || !!battleResult) && !isOnArena && !!selectedOpponent;

  const lastEntry = battleLog.length > 0 ? battleLog[battleLog.length - 1] : null;

  const handleGoToArena = () => navigate('/arena');

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="combat-widget"
          initial={{ y: 120, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 120, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="fixed bottom-5 right-5 z-50 select-none"
          style={{ width: 320 }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(6,6,16,0.97) 0%, rgba(12,12,28,0.97) 100%)',
              border: battleResult
                ? battleResult.winner === 'player'
                  ? '1.5px solid rgba(0,255,65,0.6)'
                  : battleResult.winner === 'draw'
                    ? '1.5px solid rgba(251,191,36,0.6)'
                    : '1.5px solid rgba(220,20,60,0.6)'
                : '1.5px solid rgba(0,229,255,0.25)',
              boxShadow: battleResult
                ? '0 4px 40px rgba(0,229,255,0.12)'
                : '0 4px 32px rgba(0,229,255,0.08)',
            }}
          >
            {/* ── Header bar ── */}
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{
                background: battleResult ? 'rgba(0,0,0,0.5)' : 'rgba(0,229,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-center gap-1.5">
                {/* Live pulse or finished icon */}
                {!battleResult ? (
                  <motion.span
                    className="w-2 h-2 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ boxShadow: '0 0 6px #ff1744' }}
                  />
                ) : (
                  <Swords size={10} className="text-cyan-400" />
                )}
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400/80">
                  {battleResult ? 'fight finished' : `live · round ${currentRound}/3`}
                </span>
              </div>

              {/* Return to arena button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleGoToArena}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest"
                style={{
                  background: battleResult ? 'rgba(0,255,65,0.12)' : 'rgba(0,229,255,0.08)',
                  border: battleResult ? '1px solid rgba(0,255,65,0.35)' : '1px solid rgba(0,229,255,0.2)',
                  color: battleResult ? '#00ff41' : '#00e5ff',
                }}
              >
                {battleResult ? (
                  <>View Results <ChevronRight size={8} /></>
                ) : (
                  <><Maximize2 size={8} /> Back to Fight</>
                )}
              </motion.button>
            </div>

            {/* ── Fight result banner ── */}
            {battleResult && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-1.5 text-center"
                style={{
                  background: battleResult.winner === 'player'
                    ? 'rgba(0,255,65,0.07)'
                    : battleResult.winner === 'draw'
                      ? 'rgba(251,191,36,0.07)'
                      : 'rgba(220,20,60,0.07)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <p
                  className="text-[11px] font-black uppercase tracking-widest"
                  style={{
                    color: battleResult.winner === 'player' ? '#00ff41' : battleResult.winner === 'draw' ? '#fbbf24' : '#dc143c',
                  }}
                >
                  {battleResult.winner === 'player' ? '🏆 VICTORY' : battleResult.winner === 'draw' ? '🤝 DRAW' : '😔 DEFEAT'}
                  <span className="text-gray-500 font-normal"> — {battleResult.method}</span>
                </p>
              </motion.div>
            )}

            {/* ── HP bars ── */}
            <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
              {/* Player HP */}
              <MiniHpBar
                label="You"
                hs={playerHS}
                color="#00e5ff"
                glowColor="#00e5ff"
                align="left"
              />

              {/* VS divider */}
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <p className="text-[10px] font-black text-gray-600">VS</p>
              </div>

              {/* Opponent HP */}
              <MiniHpBar
                label={selectedOpponent.name}
                hs={opponentHS}
                color="#ff1744"
                glowColor="#ff4444"
                align="right"
              />
            </div>

            {/* ── Live ticker ── */}
            {!battleResult && lastEntry && (
              <div
                className="mx-3 mb-2.5 px-2 py-1.5 rounded-lg"
                style={{
                  background: lastEntry.actor === 'player'
                    ? 'rgba(74,222,128,0.05)'
                    : lastEntry.actor === 'opponent'
                      ? 'rgba(248,113,113,0.05)'
                      : 'rgba(96,165,250,0.04)',
                  border: `1px solid ${
                    lastEntry.actor === 'player'
                      ? 'rgba(74,222,128,0.15)'
                      : lastEntry.actor === 'opponent'
                        ? 'rgba(248,113,113,0.15)'
                        : 'rgba(96,165,250,0.1)'
                  }`,
                }}
              >
                <LogTicker message={lastEntry.message} />
              </div>
            )}

            {/* ── Pulsing live indicator strip ── */}
            {!battleResult && (
              <motion.div
                className="h-0.5 w-full"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.5), transparent)' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
