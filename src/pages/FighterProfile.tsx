import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Swords, Atom, Brain, ChevronRight, TrendingUp, LucideIcon } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { DetailedFighterStats } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = 'striking' | 'wrestling' | 'bjj' | 'physical';

interface StatDef {
  key: keyof DetailedFighterStats;
  label: string;
  icon: string;
}

// ─── Stat definitions ────────────────────────────────────────────────────────

const STRIKING_STATS: StatDef[] = [
  { key: 'jab_precision',     label: 'Jab Precision',    icon: '👊' },
  { key: 'cross_power',       label: 'Cross Power',      icon: '💥' },
  { key: 'hook_lethality',    label: 'Hook Lethality',   icon: '🥊' },
  { key: 'uppercut_timing',   label: 'Uppercut Timing',  icon: '⬆️' },
  { key: 'leg_kick_hardness', label: 'Leg Kick Hardness',icon: '🦵' },
  { key: 'high_kick_speed',   label: 'High Kick Speed',  icon: '🦶' },
  { key: 'spinning_mastery',  label: 'Spinning Mastery', icon: '🌀' },
  { key: 'elbow_sharpness',   label: 'Elbow Sharpness',  icon: '⚡' },
  { key: 'knee_impact',       label: 'Knee Impact',      icon: '🦴' },
  { key: 'combination_flow',  label: 'Combination Flow', icon: '🔥' },
];

const WRESTLING_STATS: StatDef[] = [
  { key: 'double_leg_explosion', label: 'Double Leg Explosion', icon: '💨' },
  { key: 'single_leg_grit',      label: 'Single Leg Grit',      icon: '🦿' },
  { key: 'sprawl_technique',     label: 'Sprawl Technique',     icon: '🛡️' },
  { key: 'clinch_control',       label: 'Clinch Control',       icon: '🤝' },
  { key: 'judo_trips',           label: 'Judo Trips',           icon: '🥋' },
  { key: 'gnp_pressure',         label: 'GnP Pressure',         icon: '⬇️' },
  { key: 'top_control_weight',   label: 'Top Control Weight',   icon: '⚖️' },
  { key: 'scramble_ability',     label: 'Scramble Ability',     icon: '🔀' },
];

const BJJ_STATS: StatDef[] = [
  { key: 'choke_mastery',        label: 'Choke Mastery',         icon: '🔒' },
  { key: 'joint_lock_technique', label: 'Joint Lock Technique',  icon: '💀' },
  { key: 'submission_defense',   label: 'Submission Defense',    icon: '🛡️' },
  { key: 'guard_game',           label: 'Guard Game',            icon: '🕸️' },
  { key: 'sweep_technique',      label: 'Sweep Technique',       icon: '↩️' },
  { key: 'submission_chain',     label: 'Submission Chain',      icon: '⛓️' },
];

const PHYSICAL_STATS: StatDef[] = [
  { key: 'cardio',          label: 'Cardio',          icon: '❤️' },
  { key: 'chin_durability', label: 'Chin Durability', icon: '🪨' },
  { key: 'fight_iq',        label: 'Fight IQ',        icon: '🧠' },
  { key: 'explosive_burst', label: 'Explosive Burst', icon: '💢' },
  { key: 'recovery_rate',   label: 'Recovery Rate',   icon: '🔋' },
  { key: 'mental_heart',    label: 'Mental Heart',    icon: '💜' },
];

// ─── Config per tab ────────────────────────────────────────────────────────

const TAB_CONFIG: Record<Tab, {
  label: string;
  icon: LucideIcon;
  stats: StatDef[];
  colorFrom: string;
  colorTo: string;
  border: string;
  glow: string;
  bgActive: string;
  textActive: string;
  barBg: string;
}> = {
  striking: {
    label: 'Striking',
    icon: Swords,
    stats: STRIKING_STATS,
    colorFrom: 'from-red-600',
    colorTo: 'to-orange-500',
    border: 'border-red-500/60',
    glow: 'shadow-red-500/30',
    bgActive: 'bg-red-500/20 border-red-500',
    textActive: 'text-red-400',
    barBg: 'bg-gradient-to-r from-red-600 to-orange-500',
  },
  wrestling: {
    label: 'Wrestling',
    icon: Shield,
    stats: WRESTLING_STATS,
    colorFrom: 'from-blue-600',
    colorTo: 'to-cyan-500',
    border: 'border-blue-500/60',
    glow: 'shadow-blue-500/30',
    bgActive: 'bg-blue-500/20 border-blue-500',
    textActive: 'text-blue-400',
    barBg: 'bg-gradient-to-r from-blue-600 to-cyan-500',
  },
  bjj: {
    label: 'BJJ',
    icon: Atom,
    stats: BJJ_STATS,
    colorFrom: 'from-purple-600',
    colorTo: 'to-violet-500',
    border: 'border-purple-500/60',
    glow: 'shadow-purple-500/30',
    bgActive: 'bg-purple-500/20 border-purple-500',
    textActive: 'text-purple-400',
    barBg: 'bg-gradient-to-r from-purple-600 to-violet-500',
  },
  physical: {
    label: 'Physical',
    icon: Brain,
    stats: PHYSICAL_STATS,
    colorFrom: 'from-emerald-600',
    colorTo: 'to-teal-500',
    border: 'border-emerald-500/60',
    glow: 'shadow-emerald-500/30',
    bgActive: 'bg-emerald-500/20 border-emerald-500',
    textActive: 'text-emerald-400',
    barBg: 'bg-gradient-to-r from-emerald-600 to-teal-500',
  },
};

const TABS: Tab[] = ['striking', 'wrestling', 'bjj', 'physical'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the "primary discipline" label based on highest average among groups */
const getPrimaryDiscipline = (ds: DetailedFighterStats): string => {
  const avg = (keys: (keyof DetailedFighterStats)[]) =>
    keys.reduce((s, k) => s + (ds[k] ?? 10), 0) / keys.length;

  const scores: Record<Tab, number> = {
    striking:  avg(STRIKING_STATS.map(s => s.key)),
    wrestling: avg(WRESTLING_STATS.map(s => s.key)),
    bjj:       avg(BJJ_STATS.map(s => s.key)),
    physical:  avg(PHYSICAL_STATS.map(s => s.key)),
  };

  const best = (Object.entries(scores) as [Tab, number][]).reduce((a, b) => b[1] > a[1] ? b : a);

  const labels: Record<Tab, string> = {
    striking:  'Striker',
    wrestling: 'Wrestler',
    bjj:       'BJJ Specialist',
    physical:  'Complete Fighter',
  };
  return labels[best[0]];
};

/** Color for an individual stat value */
const statColor = (v: number): string => {
  if (v >= 80) return 'text-yellow-400';
  if (v >= 60) return 'text-green-400';
  if (v >= 40) return 'text-blue-400';
  return 'text-gray-400';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatRowProps {
  stat: StatDef;
  value: number;
  barBg: string;
  delay: number;
}

const StatRow: React.FC<StatRowProps> = ({ stat, value, barBg, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35, delay }}
    className="flex items-center gap-3"
  >
    <span className="text-base w-6 text-center flex-shrink-0">{stat.icon}</span>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-300 font-medium uppercase tracking-wide truncate">{stat.label}</span>
        <span className={`text-sm font-black ml-2 flex-shrink-0 ${statColor(value)}`}>{value}</span>
      </div>
      <div className="h-2 bg-gray-800/80 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, delay: delay + 0.1, ease: 'easeOut' }}
          className={`h-full rounded-full ${barBg}`}
          style={{ boxShadow: value >= 70 ? '0 0 6px rgba(255,255,255,0.2)' : undefined }}
        />
      </div>
    </div>
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const FighterProfile: React.FC = () => {
  const { fighter } = useFighter();
  const [activeTab, setActiveTab] = useState<Tab>('striking');

  // Build defaulted stats (null → 10)
  const ds: DetailedFighterStats = fighter?.detailedStats ?? {
    jab_precision: 10, cross_power: 10, hook_lethality: 10, uppercut_timing: 10,
    leg_kick_hardness: 10, high_kick_speed: 10, spinning_mastery: 10, elbow_sharpness: 10,
    knee_impact: 10, combination_flow: 10, double_leg_explosion: 10, single_leg_grit: 10,
    sprawl_technique: 10, clinch_control: 10, judo_trips: 10, gnp_pressure: 10,
    top_control_weight: 10, scramble_ability: 10, choke_mastery: 10, joint_lock_technique: 10,
    submission_defense: 10, guard_game: 10, sweep_technique: 10, submission_chain: 10,
    cardio: 10, chin_durability: 10, fight_iq: 10, explosive_burst: 10,
    recovery_rate: 10, mental_heart: 10,
  };

  const cfg = TAB_CONFIG[activeTab];
  const { record } = fighter ?? { record: { wins: 0, losses: 0, draws: 0 } };
  const discipline = getPrimaryDiscipline(ds);

  // Overall rating — average of all 30 stats
  const overallRating = Math.round(
    Object.values(ds).reduce((s, v) => s + v, 0) / 30
  );

  return (
    <div className="min-h-screen bg-dark-primary p-4 md:p-6 space-y-6">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-neon-green/20 bg-gradient-to-br from-dark-secondary via-dark-tertiary to-dark-secondary p-6 md:p-8"
        style={{ boxShadow: '0 0 40px rgba(0,255,65,0.05)' }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-neon-green/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-neon-green/5 rounded-full blur-2xl" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 flex items-center justify-center text-3xl font-black bg-dark-tertiary border-2 border-neon-green/40"
              style={{
                clipPath: 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
                boxShadow: '0 0 20px rgba(0,255,65,0.2)',
              }}
            >
              {fighter?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            {/* Overall badge */}
            <div className="absolute -bottom-2 -right-2 bg-neon-green text-dark-primary text-xs font-black px-1.5 py-0.5 rounded-md">
              {overallRating}
            </div>
          </div>

          {/* Fighter info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-oswald font-black text-white uppercase tracking-wider leading-none">
                {fighter?.name ?? 'Fighter'}
              </h1>
              <span className="mt-0.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-semibold uppercase tracking-wider">
                {discipline}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-3 uppercase tracking-widest">&ldquo;{fighter?.nickname ?? 'The Fighter'}&rdquo;</p>

            {/* Record */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-green-400">{record.wins}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Wins</div>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <div className="text-2xl font-black text-red-400">{record.losses}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Losses</div>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <div className="text-2xl font-black text-gray-400">{record.draws}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Draws</div>
              </div>
            </div>
          </div>

          {/* Overall ring */}
          <div className="hidden md:flex flex-col items-center gap-1 flex-shrink-0">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a2a1a" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#00ff41" strokeWidth="2.5"
                  strokeDasharray={`${overallRating} 100`}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,65,0.6))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-neon-green leading-none">{overallRating}</span>
                <span className="text-[9px] text-gray-500 uppercase">OVR</span>
              </div>
            </div>
            <TrendingUp size={14} className="text-neon-green/60" />
          </div>
        </div>
      </motion.div>

      {/* ── Category Tabs ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-4 gap-2"
      >
        {TABS.map((tab) => {
          const c = TAB_CONFIG[tab];
          const Icon = c.icon;
          const isActive = activeTab === tab;

          // Quick average for this tab
          const tabAvg = Math.round(
            c.stats.reduce((s, st) => s + (ds[st.key] ?? 10), 0) / c.stats.length
          );

          return (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-300 ${
                isActive
                  ? `${c.bgActive} shadow-lg ${c.glow}`
                  : 'border-gray-700/50 bg-dark-secondary/50 hover:border-gray-600'
              }`}
            >
              <Icon size={18} className={isActive ? c.textActive : 'text-gray-500'} />
              <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? c.textActive : 'text-gray-500'}`}>
                {c.label}
              </span>
              <span className={`text-lg font-black leading-none ${isActive ? c.textActive : 'text-gray-600'}`}>
                {tabAvg}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Stats Grid ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl border ${cfg.border} bg-dark-secondary/60 p-5 md:p-6`}
          style={{ boxShadow: `0 0 30px ${activeTab === 'striking' ? 'rgba(239,68,68,0.08)' : activeTab === 'wrestling' ? 'rgba(59,130,246,0.08)' : activeTab === 'bjj' ? 'rgba(168,85,247,0.08)' : 'rgba(16,185,129,0.08)'}` }}
        >
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            {React.createElement(cfg.icon, { size: 20, className: cfg.textActive })}
            <h2 className={`font-oswald font-bold text-lg uppercase tracking-widest ${cfg.textActive}`}>
              {cfg.label} Skills
            </h2>
            <ChevronRight size={14} className="text-gray-600 ml-auto" />
            <span className={`text-xs font-semibold ${cfg.textActive} uppercase tracking-wider`}>
              {cfg.stats.length} attributes
            </span>
          </div>

          {/* Stats list — two columns on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cfg.stats.map((stat, i) => (
              <StatRow
                key={stat.key}
                stat={stat}
                value={ds[stat.key] ?? 10}
                barBg={cfg.barBg}
                delay={i * 0.04}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Discipline rating summary ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-4 gap-2"
      >
        {TABS.map((tab) => {
          const c = TAB_CONFIG[tab];
          const avg = Math.round(
            c.stats.reduce((s, st) => s + (ds[st.key] ?? 10), 0) / c.stats.length
          );
          const Icon = c.icon;
          return (
            <div
              key={tab}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${c.border} bg-dark-tertiary/30`}
            >
              <Icon size={14} className={c.textActive} />
              <div className={`text-xl font-black ${c.textActive}`}>{avg}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider text-center">{c.label}</div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${avg}%` }}
                  transition={{ duration: 1, delay: 0.5 + TABS.indexOf(tab) * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full bg-gradient-to-r ${c.colorFrom} ${c.colorTo}`}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      <p className="text-center text-xs text-gray-600 pb-4 uppercase tracking-widest">
        Fighter Profile · View Only · Training in Gym section
      </p>
    </div>
  );
};
