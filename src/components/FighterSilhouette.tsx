import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { HealthStatus } from '../pages/Arena';
import type { BodyPart } from '../pages/Arena';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FighterSilhouetteProps {
  /** Display name shown below the silhouette */
  name: string;
  /** Current health status for all zones */
  healthStatus: HealthStatus;
  /** Which body part was just hit (triggers flash animation) */
  lastHitPart: BodyPart | null;
  /** Whether this fighter is currently attacking (glow effect) */
  isAttacking: boolean;
  /** Whether this is the player or opponent (affects glow color) */
  isPlayer: boolean;
  /** Combat phase — affects silhouette orientation */
  stance: 'STANDUP' | 'GROUND';
  /** For ground: is this fighter on top or bottom? */
  groundPosition?: 'TOP' | 'BOTTOM' | null;
  /** Mirror the silhouette horizontally (opponent faces player) */
  mirror?: boolean;
}

// ─── Health → Color mapping ───────────────────────────────────────────────────

const getZoneColor = (hp: number): string => {
  if (hp <= 0)  return '#1a0505';   // black-red — incapacitated
  if (hp <= 20) return '#7f1d1d';   // deep crimson — critical
  if (hp <= 40) return '#dc2626';   // red — serious damage
  if (hp <= 60) return '#ea580c';   // burnt orange — moderate
  if (hp <= 80) return '#d97706';   // amber — light damage
  return '#16a34a';                  // vivid green — healthy
};

const getZoneGlow = (hp: number): string => {
  if (hp <= 0)  return 'none';
  if (hp <= 20) return '0 0 12px #dc2626aa';
  if (hp <= 40) return '0 0 8px #ea580c88';
  if (hp <= 60) return '0 0 6px #d9770666';
  return 'none';
};

const isZonePulsing = (hp: number): boolean => hp > 0 && hp <= 20;

// ─── Hit flash animation variants ────────────────────────────────────────────

const hitFlashVariants = {
  idle: {
    filter: 'brightness(1)',
    scale: 1,
    x: 0,
  },
  hit: {
    filter: ['brightness(1)', 'brightness(3.5)', 'brightness(1.6)', 'brightness(1)'],
    scale: [1, 1.04, 0.97, 1],
    x: [0, -3, 3, -2, 0],
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// ─── SVG Zone Component ───────────────────────────────────────────────────────

const SvgZone: React.FC<{
  d: string;
  zone: BodyPart;
  hp: number;
  isHit: boolean;
  isCircle?: boolean;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
}> = ({ d, zone, hp, isHit, isCircle, cx, cy, rx, ry }) => {
  const color      = getZoneColor(hp);
  const glowStyle  = getZoneGlow(hp);
  const pulsing    = isZonePulsing(hp);

  return (
    <motion.g
      key={`zone-${zone}`}
      variants={hitFlashVariants}
      initial="idle"
      animate={isHit ? 'hit' : 'idle'}
    >
      {/* Subtle dark outline for zone separation */}
      {isCircle ? (
        <ellipse
          cx={cx} cy={cy} rx={rx} ry={ry}
          fill={color}
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="1.2"
          style={{
            filter: glowStyle !== 'none' ? `drop-shadow(${glowStyle})` : undefined,
            animation: pulsing ? 'silhouettePulse 1.2s ease-in-out infinite' : undefined,
          }}
        />
      ) : (
        <path
          d={d}
          fill={color}
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="1.2"
          strokeLinejoin="round"
          style={{
            filter: glowStyle !== 'none' ? `drop-shadow(${glowStyle})` : undefined,
            animation: pulsing ? 'silhouettePulse 1.2s ease-in-out infinite' : undefined,
          }}
        />
      )}
      {/* HP label overlay */}
      {hp <= 40 && hp > 0 && (
        <text
          x={isCircle ? cx : undefined}
          y={isCircle ? (cy ?? 0) + 4 : undefined}
          fontSize="7"
          fill="rgba(255,255,255,0.75)"
          textAnchor="middle"
          fontWeight="bold"
          style={{ pointerEvents: 'none', fontFamily: 'monospace' }}
        >
          {Math.ceil(hp)}
        </text>
      )}
    </motion.g>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const FighterSilhouette: React.FC<FighterSilhouetteProps> = ({
  name,
  healthStatus,
  lastHitPart,
  isAttacking,
  isPlayer,
  stance,
  groundPosition,
  mirror = false,
}) => {
  const [hitPart, setHitPart] = useState<BodyPart | null>(null);

  // Briefly set the hit zone, then clear (triggers animation once)
  useEffect(() => {
    if (!lastHitPart) return;
    setHitPart(lastHitPart);
    const t = setTimeout(() => setHitPart(null), 380);
    return () => clearTimeout(t);
  }, [lastHitPart]);

  const attackingGlowColor = isPlayer ? '#00ff41' : '#dc143c';
  const nameColor = isPlayer ? '#00ff41' : '#dc143c';
  const isGround  = stance === 'GROUND';

  // ── SVG PATHS — anatomical MMA fighter (viewBox 0 0 100 270) ──────────────
  //
  //  HEAD  — ellipse (drawn separately for clean circle)
  //  TORSO — shoulders, chest, flanks, integrated guard-up arms
  //  LEFT LEG  — hip through foot, left side
  //  RIGHT LEG — hip through foot, right side
  //
  // Coordinate origin: top-center of head at (50, 8)
  // Total height: ~270 units; width: ~100 units

  // HEAD ellipse params
  const headCx = 50, headCy = 26, headRx = 16, headRy = 19;

  // TORSO — fighting stance, arms raised slightly in guard
  const torsoPath = [
    'M 44,44',             // left neck join
    'C 30,46 18,51 10,64', // left shoulder slope
    'L 4,82',              // left outer arm going down
    'C 2,92 4,104 8,110',  // left elbow area
    'L 16,130',            // left forearm inner
    'C 20,140 24,148 26,155', // left hip/flank
    'L 34,157',            // left crotch
    'L 66,157',            // right crotch
    'C 76,155 80,148 84,140', // right hip/flank
    'L 84,130',
    'C 88,120 94,110 92,104', // right forearm
    'L 96,82',             // right outer arm
    'C 90,51 74,46 56,44', // right shoulder slope
    'Z',
  ].join(' ');

  // LEFT LEG — natural slightly-bent stance
  const leftLegPath = [
    'M 34,157',
    'C 30,162 26,168 24,178',
    'L 20,210',
    'C 18,224 16,238 14,252',
    'L 12,265',
    'L 26,265',
    'L 34,252',
    'C 38,240 40,228 42,212',
    'L 48,178',
    'C 50,168 50,162 50,157',
    'Z',
  ].join(' ');

  // RIGHT LEG — mirror of left
  const rightLegPath = [
    'M 66,157',
    'C 70,162 74,168 76,178',
    'L 80,212',
    'C 82,228 86,240 90,252',
    'L 98,265',
    'L 84,265',
    'L 80,252',
    'C 76,238 74,224 72,210',
    'L 66,178',
    'C 62,168 52,162 50,157',
    'Z',
  ].join(' ');

  // ── Ground stance: rotate 90°, scale down ─────────────────────────────────
  const groundTransform = isGround
    ? mirror
      ? 'rotate(90, 50, 137) scale(0.88)'
      : 'rotate(-90, 50, 137) scale(0.88)'
    : '';

  return (
    <div className="flex flex-col items-center gap-2 select-none">

      {/* Ground position badge */}
      {isGround && groundPosition && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${
            groundPosition === 'TOP'
              ? 'bg-emerald-900/60 border-emerald-500/60 text-emerald-300'
              : 'bg-red-900/60 border-red-600/50 text-red-300'
          }`}
        >
          {groundPosition === 'TOP' ? '▲ TOP' : '▼ BOTTOM'}
        </motion.div>
      )}

      {/* SVG silhouette wrapper */}
      <motion.div
        className="relative"
        animate={
          isAttacking
            ? {
                filter: [
                  `drop-shadow(0 0 0px ${attackingGlowColor}00)`,
                  `drop-shadow(0 0 14px ${attackingGlowColor}cc)`,
                  `drop-shadow(0 0 8px ${attackingGlowColor}88)`,
                ],
              }
            : { filter: 'drop-shadow(0 0 0px transparent)' }
        }
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          transform: mirror ? 'scaleX(-1)' : undefined,
        }}
      >
        <svg
          viewBox="0 0 100 275"
          width="100%"
          height="100%"
          style={{ maxWidth: 110, minWidth: 72 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            @keyframes silhouettePulse {
              0%,100% { opacity: 1; }
              50%      { opacity: 0.55; }
            }
          `}</style>

          {/* Background subtle fill so zones "pop" against dark bg */}
          <rect
            x="0" y="0" width="100" height="275"
            fill="rgba(0,0,0,0.0)"
          />

          <g transform={groundTransform}>
            {/* RIGHT LEG */}
            <SvgZone
              d={rightLegPath}
              zone="legs"
              hp={healthStatus.legs}
              isHit={hitPart === 'legs'}
            />

            {/* LEFT LEG */}
            <SvgZone
              d={leftLegPath}
              zone="legs"
              hp={healthStatus.legs}
              isHit={hitPart === 'legs'}
            />

            {/* TORSO */}
            <SvgZone
              d={torsoPath}
              zone="body"
              hp={healthStatus.body}
              isHit={hitPart === 'body'}
            />

            {/* HEAD */}
            <SvgZone
              d=""
              zone="head"
              hp={healthStatus.head}
              isHit={hitPart === 'head'}
              isCircle
              cx={headCx}
              cy={headCy}
              rx={headRx}
              ry={headRy}
            />
          </g>

          {/* HP zero markers */}
          {healthStatus.head <= 0 && (
            <text x="50" y="30" textAnchor="middle" fontSize="14" fill="rgba(255,50,50,0.9)">✖</text>
          )}
        </svg>
      </motion.div>

      {/* Stamina strip */}
      <div className="w-full max-w-[110px] space-y-1">
        <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider"
             style={{ color: nameColor }}>
          <span>{name.length > 9 ? name.slice(0, 9) + '…' : name}</span>
          <span className={healthStatus.stamina < 25 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}>
            ⚡{Math.ceil(healthStatus.stamina)}
          </span>
        </div>
        {/* Stamina bar */}
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: healthStatus.stamina < 25
                ? '#dc2626'
                : healthStatus.stamina < 50
                  ? '#d97706'
                  : '#06b6d4',
            }}
            animate={{ width: `${Math.max(0, healthStatus.stamina)}%` }}
            transition={{ type: 'spring', stiffness: 70, damping: 14 }}
          />
        </div>
      </div>

      {/* Zone HP mini-legend */}
      <div className="w-full max-w-[110px] space-y-0.5">
        {(['head', 'body', 'legs'] as BodyPart[]).map((zone) => {
          const hp = healthStatus[zone];
          const color = getZoneColor(hp);
          const label = zone === 'head' ? 'HEAD' : zone === 'body' ? 'BODY' : 'LEGS';
          return (
            <div key={zone} className="flex items-center gap-1">
              <span className="text-[8px] font-bold w-7 uppercase" style={{ color: 'rgba(150,150,150,0.8)' }}>
                {label}
              </span>
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  animate={{ width: `${Math.max(0, hp)}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                />
              </div>
              <span
                className="text-[8px] font-mono w-5 text-right"
                style={{ color: hp <= 20 ? '#f87171' : 'rgba(150,150,150,0.7)' }}
              >
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
