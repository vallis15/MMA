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
              background: 'linear-gradient(135deg, rgba(9,9,11,0.97) 0%, rgba(13,14,20,0.97) 100%)',
              border: battleResult
                ? battleResult.winner === 'player'
                  ? '1.5px solid rgba(201,168,76,0.55)'
                  : battleResult.winner === 'draw'
                    ? '1.5px solid rgba(251,191,36,0.55)'
                    : '1.5px solid rgba(139,32,32,0.55)'
                : '1.5px solid rgba(123,143,165,0.22)',
              boxShadow: battleResult
                ? '0 4px 40px rgba(201,168,76,0.1)'
                : '0 4px 32px rgba(123,143,165,0.07)',
            }}
          >
            {/* ── Header bar ── */}
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{
                background: battleResult ? 'rgba(0,0,0,0.5)' : 'rgba(123,143,165,0.04)',
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
                    style={{ boxShadow: '0 0 6px #8B2020' }}
                  />
                ) : (
                  <Swords size={10} className="text-steel/80" />
                )}
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-steel/70">
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
                  background: battleResult ? 'rgba(201,168,76,0.12)' : 'rgba(123,143,165,0.08)',
                  border: battleResult ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(123,143,165,0.2)',
                  color: battleResult ? '#C9A84C' : '#7B8FA5',
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
                    ? 'rgba(201,168,76,0.07)'
                    : battleResult.winner === 'draw'
                      ? 'rgba(251,191,36,0.07)'
                      : 'rgba(139,32,32,0.07)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <p
                  className="text-[11px] font-black uppercase tracking-widest"
                  style={{
                    color: battleResult.winner === 'player' ? '#C9A84C' : battleResult.winner === 'draw' ? '#fbbf24' : '#8B2020',
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
                color="#C9A84C"
                glowColor="#C9A84C"
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
                color="#8B2020"
                glowColor="#C97070"
                align="right"
              />
            </div>

            {/* ── Live ticker ── */}
            {!battleResult && lastEntry && (
              <div
                className="mx-3 mb-2.5 px-2 py-1.5 rounded-lg"
                style={{
                  background: lastEntry.actor === 'player'
                    ? 'rgba(201,168,76,0.05)'
                    : lastEntry.actor === 'opponent'
                      ? 'rgba(200,100,100,0.05)'
                      : 'rgba(123,143,165,0.04)',
                  border: `1px solid ${
                    lastEntry.actor === 'player'
                      ? 'rgba(201,168,76,0.14)'
                      : lastEntry.actor === 'opponent'
                        ? 'rgba(200,100,100,0.14)'
                        : 'rgba(123,143,165,0.1)'
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
