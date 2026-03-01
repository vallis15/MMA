import React, { useEffect, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import type { HealthStatus } from '../pages/Arena';
import type { BodyPart } from '../pages/Arena';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FighterSilhouetteProps {
  /** Display name shown below the silhouette */
  name: string;
  /** Current health status for all zones */
  healthStatus: HealthStatus;
  /** Which body part was just hit (triggers ping animation) */
  lastHitPart: BodyPart | null;
  /** Category of last hit — CRITICAL_HIT / FINISHER triggers full shake */
  lastHitCategory?: string | null;
  /** Whether this fighter is currently attacking (glow pulse) */
  isAttacking: boolean;
  /** Whether this is the player or opponent (affects accent color) */
  isPlayer: boolean;
  /** Combat phase — GROUND rotates silhouette 90° smoothly */
  stance: 'STANDUP' | 'GROUND';
  /** For ground phase: is this fighter on top or bottom? */
  groundPosition?: 'TOP' | 'BOTTOM' | null;
  /** Mirror horizontally so opponent faces the player */
  mirror?: boolean;
}

// ─── Neon color palette mapped to HP ─────────────────────────────────────────

const getNeonStroke = (hp: number): string => {
  if (hp <= 0)  return '#2a0000';
  if (hp <= 20) return '#ff1744'; // Neon Red
  if (hp <= 40) return '#ff3d00'; // Neon Orange-Red
  if (hp <= 60) return '#ff9100'; // Orange
  if (hp <= 80) return '#c6ff00'; // Neon Yellow-Green
  return '#00e5ff';               // Cyan / Electric Blue
};

const getNeonFill = (hp: number): string => {
  if (hp <= 0)  return 'rgba(28, 0, 0, 0.92)';
  if (hp <= 20) return 'rgba(40, 4, 4, 0.82)';
  if (hp <= 40) return 'rgba(38, 14, 4, 0.78)';
  if (hp <= 60) return 'rgba(32, 20, 4, 0.75)';
  return 'rgba(6, 14, 24, 0.72)';
};

const getNeonGlowFilter = (hp: number): string => {
  if (hp <= 0)  return 'none';
  if (hp <= 20) return 'drop-shadow(0 0 6px #ff174488) drop-shadow(0 0 14px #ff174433)';
  if (hp <= 40) return 'drop-shadow(0 0 5px #ff3d0066) drop-shadow(0 0 10px #ff3d0033)';
  if (hp <= 60) return 'drop-shadow(0 0 5px #ff910055) drop-shadow(0 0 8px #ff910022)';
  if (hp <= 80) return 'drop-shadow(0 0 4px #c6ff0044) drop-shadow(0 0 8px #c6ff0022)';
  return 'drop-shadow(0 0 6px #00e5ff55) drop-shadow(0 0 12px #00e5ff22)';
};

// ─── Keyframe CSS ─────────────────────────────────────────────────────────────

const KEYFRAMES_CSS = `
  @keyframes neonPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.42; }
  }
`;

// ─── Zone Hit "Ping" variants ─────────────────────────────────────────────────

const pingVariants = {
  idle: { scale: 1, filter: 'brightness(1)' },
  hit: {
    scale:  [1, 1.12, 0.95, 1.04, 1],
    filter: ['brightness(1)', 'brightness(7)', 'brightness(2.5)', 'brightness(1.5)', 'brightness(1)'],
    transition: { duration: 0.30, ease: 'easeOut' },
  },
};

// Full-silhouette shake on CRITICAL / FINISHER
const shakeVariants = {
  idle: { x: 0, y: 0 },
  shake: {
    x: [0, -9, 11, -11, 9, -7, 7, -4, 4, 0],
    y: [0, 4, -5, 4, -3, 3, -2, 2, -1, 0],
    transition: { duration: 0.20, ease: 'linear' },
  },
};

// ─── SVG Zone Component ───────────────────────────────────────────────────────

interface ZoneProps {
  zone: BodyPart;
  hp: number;
  isHit: boolean;
  isCircle?: boolean;
  cx?: number; cy?: number; rx?: number; ry?: number;
  d?: string;
  strokeWidth?: number;
}

const SvgZone: React.FC<ZoneProps> = ({ zone, hp, isHit, isCircle, cx, cy, rx, ry, d, strokeWidth = 1.8 }) => {
  const stroke    = getNeonStroke(hp);
  const fill      = getNeonFill(hp);
  const glowF     = getNeonGlowFilter(hp);
  const isPulsing = hp > 0 && hp <= 20;

  const shapeStyle: React.CSSProperties = {
    filter: glowF !== 'none' ? glowF : undefined,
    animation: isPulsing ? 'neonPulse 1.1s ease-in-out infinite' : undefined,
    transition: 'stroke 0.5s ease, fill 0.5s ease, filter 0.5s ease',
  };

  const commonProps = {
    fill,
    stroke,
    strokeWidth,
    strokeLinejoin: 'round' as const,
    strokeLinecap:  'round' as const,
    style: shapeStyle,
  };

  return (
    <motion.g
      variants={pingVariants}
      initial="idle"
      animate={isHit ? 'hit' : 'idle'}
      key={`zone-${zone}-${isHit}`}
    >
      {isCircle ? (
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...commonProps} />
      ) : (
        <path d={d} {...commonProps} />
      )}
    </motion.g>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const FighterSilhouette: React.FC<FighterSilhouetteProps> = ({
  name,
  healthStatus,
  lastHitPart,
  lastHitCategory,
  isAttacking,
  isPlayer,
  stance,
  groundPosition,
  mirror = false,
}) => {
  const [hitPart, setHitPart] = useState<BodyPart | null>(null);
  const shakeControls = useAnimation();

  // Briefly set the hit zone, then clear (triggers ping once)
  useEffect(() => {
    if (!lastHitPart) return;
    setHitPart(lastHitPart);
    const t = setTimeout(() => setHitPart(null), 380);
    return () => clearTimeout(t);
  }, [lastHitPart]);

  // Full-silhouette shake on CRITICAL_HIT or FINISHER
  useEffect(() => {
    if (!lastHitCategory) return;
    if (lastHitCategory === 'CRITICAL_HIT' || lastHitCategory === 'FINISHER') {
      shakeControls.start('shake').then(() => shakeControls.start('idle'));
    }
  }, [lastHitCategory, shakeControls]);

  const accentColor = isPlayer ? '#00e5ff' : '#ff1744';
  const nameColor   = isPlayer ? '#00e5ff' : '#ff4444';
  const isGround    = stance === 'GROUND';
  const isDominant  = isGround && groundPosition === 'TOP';

  // ── SVG PATHS — realistic human silhouette (viewBox 0 0 100 275) ──────────
  // Head: slightly oval, narrower at top (like a real skull)
  const headCx = 50, headCy = 25, headRx = 13, headRy = 17;

  // Torso: neck → broad shoulders → slight waist → hips
  // All corners use cubic beziers for smooth, ring-like edges
  const torsoPath = [
    'M 44,42',                          // left neck base
    'C 38,42 20,50 13,64',             // sweep to left shoulder
    'C 9,72  9,84  11,98',             // upper-left side
    'C 13,112 17,126 21,140',          // waist left (slight inward)
    'C 23,150 24,158 26,164',          // hip swell left
    'C 36,166 44,166 50,166',          // across left hip floor
    'C 56,166 64,166 74,164',          // across right hip floor
    'C 76,158 77,150 79,140',          // hip swell right
    'C 83,126 87,112 89,98',           // waist right
    'C 91,84  91,72  87,64',           // upper-right side
    'C 80,50  62,42  56,42',           // sweep to right shoulder
    'C 54,41  52,40  50,40',           // neck top right
    'C 48,40  46,41  44,42',           // neck top left
    'Z',
  ].join(' ');

  // Left leg: outer thigh → knee → calf bulge → ankle → foot (toes left)
  const leftLegPath = [
    'M 26,164',                        // left hip outer
    'C 21,168 14,178 12,194',         // outer upper thigh
    'C 10,207 12,216 16,222',         // outer knee
    'C 19,228 20,238 18,248',         // outer calf
    'C 16,254 12,258  8,262',         // outer ankle to heel
    'C  7,265  7,268 10,269',         // heel curve
    'C 14,270 22,270 30,269',         // heel to midfoot
    'C 37,268 44,266 48,263',         // midfoot to toes
    'C 50,261 50,258 48,255',         // toe tip
    'C 46,251 42,248 39,244',         // inner ankle
    'C 37,236 36,226 38,218',         // inner calf
    'C 40,210 42,202 43,192',         // inner knee area
    'C 45,178 47,168 50,164',         // inner thigh to groin
    'Z',
  ].join(' ');

  // Right leg: mirror of left leg
  const rightLegPath = [
    'M 74,164',                        // right hip outer
    'C 79,168 86,178 88,194',         // outer upper thigh
    'C 90,207 88,216 84,222',         // outer knee
    'C 81,228 80,238 82,248',         // outer calf
    'C 84,254 88,258 92,262',         // outer ankle to heel
    'C 93,265 93,268 90,269',         // heel curve
    'C 86,270 78,270 70,269',         // heel to midfoot
    'C 63,268 56,266 52,263',         // midfoot to toes
    'C 50,261 50,258 52,255',         // toe tip
    'C 54,251 58,248 61,244',         // inner ankle
    'C 63,236 64,226 62,218',         // inner calf
    'C 60,210 58,202 57,192',         // inner knee area
    'C 55,178 53,168 50,164',         // inner thigh to groin
    'Z',
  ].join(' ');

  // Ground rotation angle — with smooth CSS transition
  const groundAngle = mirror ? 90 : -90;

  return (
    <div className="flex flex-col items-center gap-2 select-none w-full">
      <style>{KEYFRAMES_CSS}</style>

      {/* Ground position badge */}
      <AnimatePresence>
        {isGround && groundPosition && (
          <motion.div
            key="ground-badge"
            initial={{ opacity: 0, y: -8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            className={`text-[9px] font-black tracking-widest uppercase px-3 py-0.5 rounded-full border ${
              groundPosition === 'TOP'
                ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            {groundPosition === 'TOP' ? '▲ TOP' : '▼ BOTTOM'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SVG wrapper: whole-silhouette shake + attacker glow ── */}
      <motion.div
        variants={shakeVariants}
        animate={shakeControls}
        className="relative"
        style={{
          filter: isAttacking
            ? `drop-shadow(0 0 18px ${accentColor}bb) drop-shadow(0 0 8px ${accentColor}66)`
            : undefined,
          transition: 'filter 0.3s ease',
          // Mirror for opponent
          transform: mirror ? 'scaleX(-1)' : undefined,
        }}
      >
        {/* Dominant ground position pulse ring */}
        {isDominant && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-full"
            animate={{
              boxShadow: [
                `0 0 0 0 ${accentColor}00`,
                `0 0 0 14px ${accentColor}44`,
                `0 0 0 0 ${accentColor}00`,
              ],
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <svg
          viewBox="0 0 100 280"
          width="100%"
          height="100%"
          style={{ maxWidth: 118, minWidth: 80, display: 'block' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`scanFade-${isPlayer ? 'p' : 'o'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
              <stop offset="50%"  stopColor={isPlayer ? 'rgba(0,229,255,0.03)' : 'rgba(255,23,68,0.03)'} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>

          {/* Ground-stance rotation with CSS transition */}
          <g
            style={{
              transformOrigin: '50px 140px',
              transform: isGround
                ? `rotate(${groundAngle}deg) scale(0.86)`
                : 'rotate(0deg) scale(1)',
              transition: 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Right Leg */}
            <SvgZone d={rightLegPath} zone="legs"
              hp={healthStatus.legs} isHit={hitPart === 'legs'} />

            {/* Left Leg */}
            <SvgZone d={leftLegPath} zone="legs"
              hp={healthStatus.legs} isHit={hitPart === 'legs'} />

            {/* Torso */}
            <SvgZone d={torsoPath} zone="body"
              hp={healthStatus.body} isHit={hitPart === 'body'} strokeWidth={2} />

            {/* Head */}
            <SvgZone zone="head" hp={healthStatus.head}
              isHit={hitPart === 'head'} isCircle
              cx={headCx} cy={headCy} rx={headRx} ry={headRy} strokeWidth={2.2} />
          </g>

          {/* KO X marker */}
          {healthStatus.head <= 0 && (
            <text x="50" y="32" textAnchor="middle" fontSize="16"
              fill="rgba(255,23,68,0.9)"
              style={{ filter: 'drop-shadow(0 0 6px #ff1744aa)' }}>
              ✖
            </text>
          )}

          {/* Subtle scanline shimmer overlay */}
          <rect x="0" y="0" width="100" height="280"
            fill={`url(#scanFade-${isPlayer ? 'p' : 'o'})`}
            pointerEvents="none" opacity="0.7" />
        </svg>
      </motion.div>

      {/* ── Name + Stamina ── */}
      <div className="w-full" style={{ maxWidth: 118 }}>
        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest mb-1">
          <span style={{ color: nameColor, textShadow: `0 0 8px ${nameColor}88` }}>
            {name.length > 10 ? name.slice(0, 10) + '…' : name}
          </span>
          <span
            className={healthStatus.stamina < 25 ? 'animate-pulse' : ''}
            style={{ color: healthStatus.stamina < 25 ? '#ff1744' : '#00e5ff' }}
          >
            ⚡{Math.ceil(healthStatus.stamina)}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: healthStatus.stamina < 25
                ? 'linear-gradient(90deg,#ff1744,#ff4444)'
                : healthStatus.stamina < 50
                  ? 'linear-gradient(90deg,#ff9100,#ffab40)'
                  : 'linear-gradient(90deg,#00b8d9,#00e5ff)',
              boxShadow: healthStatus.stamina < 25 ? '0 0 6px #ff174488' : '0 0 4px #00e5ff55',
            }}
            animate={{ width: `${Math.max(0, healthStatus.stamina)}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 16 }}
          />
        </div>
      </div>

      {/* ── Zone HP mini-bars ── */}
      <div className="w-full space-y-0.5" style={{ maxWidth: 118 }}>
        {(['head', 'body', 'legs'] as BodyPart[]).map((zone) => {
          const hp     = healthStatus[zone];
          const stroke = getNeonStroke(hp);
          const label  = zone === 'head' ? 'HEAD' : zone === 'body' ? 'BODY' : 'LEGS';
          return (
            <div key={zone} className="flex items-center gap-1">
              <span className="text-[8px] font-bold w-7 uppercase"
                    style={{ color: 'rgba(130,140,150,0.7)' }}>
                {label}
              </span>
              <div className="flex-1 h-[3px] rounded-full overflow-hidden"
                   style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: stroke,
                    boxShadow: `0 0 4px ${stroke}66`,
                  }}
                  animate={{ width: `${Math.max(0, hp)}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                />
              </div>
              <span className="text-[8px] font-mono w-5 text-right"
                    style={{ color: hp <= 20 ? '#ff1744' : 'rgba(130,140,150,0.6)' }}>
                {Math.ceil(hp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FighterSilhouette;
