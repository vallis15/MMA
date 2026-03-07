import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair, Zap, Flame, Layers, Move, Activity, TrendingUp,
  RotateCw, Target, Star, Award, Trophy, Shield, Brain, Lock,
  Eye, X, ChevronRight, Sparkles, CheckCircle, XCircle,
} from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { SKILL_TREE, ALL_SKILLS } from '../constants/skillTree';
import { calculateEnhancedStats } from '../utils/stats';
import type { SkillNode, SkillDomain } from '../types/skills';

// ─── Domain theming ────────────────────────────────────────────────────────────

const DOMAIN_THEME: Record<SkillDomain, {
  label: string;
  color: string;          // hex for inline styles / SVG
  colorClass: string;     // tailwind text-*
  bgClass: string;        // tailwind bg-*/10
  borderClass: string;    // tailwind border-*
  glowStyle: string;      // CSS drop-shadow string
  ringStyle: string;
  tabGrad: string;        // gradient for active tab
}> = {
  striking: {
    label: 'Striking',
    color: '#ff3333',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/60',
    glowStyle: '0 0 12px #ff3333, 0 0 24px #ff333366',
    ringStyle: '0 0 0 2px #ff3333, 0 0 16px #ff333380',
    tabGrad: 'from-red-600 to-red-800',
  },
  wrestling: {
    label: 'Wrestling',
    color: '#3b82f6',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/60',
    glowStyle: '0 0 12px #3b82f6, 0 0 24px #3b82f666',
    ringStyle: '0 0 0 2px #3b82f6, 0 0 16px #3b82f680',
    tabGrad: 'from-blue-600 to-blue-800',
  },
  bjj: {
    label: 'BJJ',
    color: '#a855f7',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/60',
    glowStyle: '0 0 12px #a855f7, 0 0 24px #a855f766',
    ringStyle: '0 0 0 2px #a855f7, 0 0 16px #a855f780',
    tabGrad: 'from-purple-600 to-purple-800',
  },
  defense: {
    label: 'Defense',
    color: '#00ff41',
    colorClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/60',
    glowStyle: '0 0 12px #00ff41, 0 0 24px #00ff4166',
    ringStyle: '0 0 0 2px #00ff41, 0 0 16px #00ff4180',
    tabGrad: 'from-green-500 to-green-700',
  },
};

// Domain-specific column (path) labels – shown as branch names in the tree header
const DOMAIN_PATH_LABELS: Record<SkillDomain, [string, string, string, string]> = {
  striking:  ['Boxing',     'Kicking',    'Muay Thai',  'Universal'],
  wrestling: ['Double Leg', 'Single Leg', 'Clinch',     'Scramble'],
  bjj:       ['Choking',    'Joint Lock', 'Guard',      'Sub Chain'],
  defense:   ['Chin',       'Cardio',     'Fight IQ',   'Mental'],
};

// ─── Icon map ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ElementType> = {
  Crosshair, Zap, Flame, Layers, Move, Activity, TrendingUp,
  RotateCw, Target, Star, Award, Trophy, Shield, Brain, Lock, Eye, Sparkles,
};

const SkillIcon: React.FC<{ name: string; size?: number; className?: string }> = ({
  name, size = 18, className = '',
}) => {
  const Comp = ICON_MAP[name] as React.ElementType;
  if (!Comp) return <Sparkles size={size} className={className} />;
  return <Comp size={size} className={className} />;
};

// ─── Stat boost display names ─────────────────────────────────────────────────

const STAT_LABELS: Record<string, string> = {
  jab_precision: 'Jab Precision',
  cross_power: 'Cross Power',
  hook_lethality: 'Hook Lethality',
  uppercut_timing: 'Uppercut Timing',
  leg_kick_hardness: 'Leg Kick',
  high_kick_speed: 'High Kick',
  spinning_mastery: 'Spinning',
  elbow_sharpness: 'Elbow',
  knee_impact: 'Knee',
  combination_flow: 'Combo Flow',
  double_leg_explosion: 'Double Leg',
  single_leg_grit: 'Single Leg',
  sprawl_technique: 'Sprawl',
  clinch_control: 'Clinch Control',
  judo_trips: 'Judo Trips',
  gnp_pressure: 'G&P Pressure',
  top_control_weight: 'Top Control',
  scramble_ability: 'Scramble',
  choke_mastery: 'Choke',
  joint_lock_technique: 'Joint Lock',
  submission_defense: 'Sub Defense',
  guard_game: 'Guard Game',
  sweep_technique: 'Sweeps',
  submission_chain: 'Sub Chain',
  cardio: 'Cardio',
  chin_durability: 'Chin',
  fight_iq: 'Fight IQ',
  explosive_burst: 'Explosiveness',
  recovery_rate: 'Recovery',
  mental_heart: 'Mental Heart',
};

// ─── Pentagon component ───────────────────────────────────────────────────────
// Pointing-up regular pentagon via clip-path

type NodeState = 'locked' | 'available' | 'unlocked';

interface PentagonNodeProps {
  skill: SkillNode;
  state: NodeState;
  domain: SkillDomain;
  isActive: boolean;  // whether the player is hovering / selected
  onClick: () => void;
  flashId: string | null;
}

const PentagonNode: React.FC<PentagonNodeProps> = ({
  skill, state, domain, isActive, onClick, flashId,
}) => {
  const theme = DOMAIN_THEME[domain];

  const bgColor = {
    locked: `${theme.color}10`,
    available: '#0d0d1a',
    unlocked: '#0d0d1a',
  }[state];

  const borderColor = {
    locked: `${theme.color}55`,
    available: theme.color,
    unlocked: theme.color,
  }[state];

  const iconOpacity = state === 'locked' ? 0.7 : 1;
  const isFlashing = flashId === skill.id;

  const clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
      {/* Flash animation on unlock */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            key="flash"
            className="absolute inset-[-8px] z-20 rounded-full"
            style={{
              clipPath,
              background: `radial-gradient(circle, white 0%, ${theme.color} 60%, transparent 100%)`,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Pulsing ring for "available" state */}
      {state === 'available' && (
        <motion.div
          className="absolute inset-[-4px] z-0"
          style={{
            clipPath,
            background: 'transparent',
            border: `2px solid ${theme.color}`,
            filter: `blur(1px)`,
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Main pentagon body */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className="relative z-10 flex items-center justify-center cursor-pointer focus:outline-none"
        style={{
          width: 60,
          height: 60,
          clipPath,
          background: bgColor,
          border: 'none',
          outline: 'none',
          filter: 'none',
          opacity: 1,
          boxShadow: state !== 'locked'
            ? (isActive ? theme.ringStyle : `0 0 8px ${borderColor}55`)
            : 'none',
        }}
        title={skill.name}
      >
        {/* Border via pseudo-backdrop */}
        <div
          className="absolute inset-0"
          style={{
            clipPath,
            background: `linear-gradient(135deg, ${borderColor}44, ${borderColor}22)`,
            border: `2px solid ${borderColor}`,
          }}
        />

        {/* Unlocked fill glow */}
        {state === 'unlocked' && (
          <div
            className="absolute inset-0"
            style={{
              clipPath,
              background: `radial-gradient(circle at 50% 45%, ${theme.color}22, transparent 70%)`,
            }}
          />
        )}

        {/* Icon */}
        <div
          className="relative z-10"
          style={{
            opacity: iconOpacity,
            color: theme.color,
            filter: state === 'unlocked'
              ? `drop-shadow(0 0 4px ${theme.color})`
              : state === 'available'
                ? `drop-shadow(0 0 3px ${theme.color}aa)`
                : `drop-shadow(0 0 2px ${theme.color}60)`,
          }}
        >
          <SkillIcon name={skill.iconName} size={20} />
        </div>
      </motion.button>

      {/* Lock icon overlay for locked skills */}
      {state === 'locked' && (
        <div
          className="absolute -bottom-1 -right-1 z-20 flex items-center justify-center rounded-full"
          style={{
            width: 18,
            height: 18,
            background: '#0a0a0a',
            border: `1.5px solid ${theme.color}70`,
            boxShadow: `0 0 8px ${theme.color}60, inset 0 0 6px ${theme.color}20`,
          }}
        >
          <Lock size={9} style={{ color: theme.color, filter: `drop-shadow(0 0 3px ${theme.color})` }} />
        </div>
      )}

      {/* Active skill [A] badge – only shown when skill is actually unlocked */}
      {skill.type === 'active' && state === 'unlocked' && (
        <div
          className="absolute -top-1 -right-1 z-20 text-[9px] font-black px-1 rounded"
          style={{
            background: theme.color,
            color: '#000',
            lineHeight: '14px',
          }}
        >
          A
        </div>
      )}
    </div>
  );
};

// ─── Connector line ───────────────────────────────────────────────────────────

const ConnectorLine: React.FC<{ color: string; unlocked: boolean }> = ({ color, unlocked }) => (
  <div className="flex items-center justify-center" style={{ height: 20, width: 64 }}>
    <motion.div
      style={{
        width: 2,
        height: '100%',
        background: unlocked
          ? `linear-gradient(to bottom, ${color}, ${color})`
          : `linear-gradient(to bottom, ${color}25, ${color}15)`,
        boxShadow: unlocked ? `0 0 6px ${color}` : `0 0 3px ${color}15`,
        borderRadius: 2,
      }}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.4 }}
    />
  </div>
);

// ─── Skill Detail Modal / Sidebar ─────────────────────────────────────────────

interface SkillDetailProps {
  skill: SkillNode;
  domain: SkillDomain;
  onClose: () => void;
  onLearn: () => void;
  state: NodeState;
  canLearn: boolean;
  canLearnReason?: string;
  isLearning: boolean;
  enhancedStats: Record<string, number> | null;
  /** All skills from ALL domains, used to show what children this skill unlocks */
  allSkills: SkillNode[];
  unlockedSkills: string[];
}

const SkillDetailPanel: React.FC<SkillDetailProps> = ({
  skill, domain, onClose, onLearn, state, canLearn, canLearnReason, isLearning, enhancedStats,
  allSkills, unlockedSkills,
}) => {
  const theme = DOMAIN_THEME[domain];
  const boosts = skill.statBoosts ? Object.entries(skill.statBoosts) : [];
  const mechanic = skill.mechanic;
  // Child skills that this node directly unlocks (branching)
  const childSkills = allSkills.filter(s => s.parentId === skill.id);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dimmed backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <motion.div
        className="relative pointer-events-auto w-full max-w-sm h-full flex flex-col overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #111114 100%)',
          borderLeft: `2px solid ${theme.color}`,
          boxShadow: `inset 0 0 40px ${theme.color}12, -8px 0 32px ${theme.color}20`,
        }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 35 }}
      >
        {/* Header strip */}
        <div
          className="px-6 pt-6 pb-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${theme.color}30` }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Domain badge */}
          <div
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
            style={{
              background: `${theme.color}20`,
              border: `1px solid ${theme.color}50`,
              color: theme.color,
            }}
          >
            <span>{theme.label}</span>
            {skill.type === 'active' && state === 'unlocked' && <span className="ml-1">• ACTIVE</span>}
          </div>

          {/* Icon + Name */}
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: 56,
                height: 56,
                background: `${theme.color}18`,
                border: `2px solid ${theme.color}60`,
                boxShadow: state === 'unlocked' ? `0 0 16px ${theme.color}50` : 'none',
                color: state === 'locked' ? '#444' : theme.color,
              }}
            >
              <SkillIcon name={skill.iconName} size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-tight">{skill.name}</h2>
              {skill.requirements.length === 0 && (
                <p className="text-xs mt-0.5 text-gray-500">Foundation skill</p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-4 space-y-5">
          {/* Description */}
          <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 pl-3"
            style={{ borderColor: `${theme.color}60` }}>
            "{skill.description}"
          </p>

          {/* Special Ability */}
          {mechanic && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <h3
                className="text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ color: theme.color }}
              >
                <Zap size={11} />
                SPECIAL ABILITY
              </h3>
              <div
                className="rounded-xl px-4 py-3 space-y-2"
                style={{
                  background: `${theme.color}12`,
                  border: `1px solid ${theme.color}45`,
                  boxShadow: `inset 0 0 12px ${theme.color}0a`,
                }}
              >
                {/* Log text – how it looks in fight log */}
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: theme.color, textShadow: `0 0 10px ${theme.color}88` }}
                >
                  {mechanic.logText}
                </p>
                {/* Trigger + chance row */}
                <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${theme.color}25` }}>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">
                    {mechanic.trigger.replace(/_/g, ' ')}
                  </span>
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: `${theme.color}22`, color: theme.color, border: `1px solid ${theme.color}50` }}
                  >
                    {mechanic.chance}% chance
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Passive bonus (minimální) */}
          {boosts.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Passive Bonus
              </h3>
              <div className="flex flex-wrap gap-2">
                {boosts.map(([key, val]) => (
                  <span
                    key={key}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-md"
                    style={{ background: `${theme.color}10`, border: `1px solid ${theme.color}25`, color: `${theme.color}cc` }}
                  >
                    +{val} {STAT_LABELS[key] ?? key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unlocks section – shows branching children */}
          {childSkills.length > 0 && (
            <div>
              <h3
                className="text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ color: theme.color }}
              >
                <ChevronRight size={11} />
                Unlocks Path To
              </h3>
              <div className="space-y-1.5">
                {childSkills.map(child => {
                  const childUnlocked = unlockedSkills.includes(child.id);
                  return (
                    <div
                      key={child.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs"
                      style={{
                        background: childUnlocked ? `${theme.color}12` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${childUnlocked ? theme.color + '40' : '#2a2a2a'}`,
                      }}
                    >
                      <SkillIcon
                        name={child.iconName}
                        size={14}
                        className="flex-shrink-0"
                      />
                      <span
                        className="font-semibold"
                        style={{ color: childUnlocked ? theme.color : '#888' }}
                      >
                        {child.name}
                      </span>
                      {childUnlocked && (
                        <CheckCircle size={11} className="ml-auto flex-shrink-0" style={{ color: theme.color }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attribute Requirements */}
          {skill.requirements.length > 0 && (
            <div>
              <h3
                className="text-[11px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ color: '#aaa' }}
              >
                <ChevronRight size={11} />
                Requirements
              </h3>
              <div className="space-y-1.5">
                {skill.requirements.map(req => {
                  const current = (enhancedStats as unknown as Record<string, number>)?.[req.attribute] ?? 0;
                  const met = current >= req.value;
                  const label = STAT_LABELS[req.attribute] ?? req.attribute.replace(/_/g, ' ');
                  const pct = Math.min(100, Math.round((current / req.value) * 100));
                  return (
                    <div
                      key={req.attribute}
                      className="px-3 py-2 rounded-lg text-xs"
                      style={{
                        background: met ? 'rgba(0,255,65,0.08)' : 'rgba(255,50,50,0.08)',
                        border: `1px solid ${met ? '#00ff4130' : '#ff323230'}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold" style={{ color: met ? '#00ff41' : '#ff5555' }}>
                          {met
                            ? <CheckCircle size={12} />
                            : <XCircle size={12} />}
                          {label}
                        </span>
                        {/* Format: current/required (pct%) */}
                        <span
                          className="font-black tabular-nums text-sm"
                          style={{ color: met ? '#00ff41' : '#ff5555' }}
                        >
                          {current}<span className="font-normal text-gray-600">/{req.value}</span>
                          {!met && (
                            <span className="ml-1 font-normal text-xs" style={{ color: '#888' }}>
                              ({pct}%)
                            </span>
                          )}
                        </span>
                      </div>
                      {/* Progress bar */}
                      {!met && (
                        <div
                          className="mt-1.5 h-1 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              background: pct < 25
                                ? 'linear-gradient(90deg, #8b0000, #cc2200)'
                                : pct < 60
                                  ? 'linear-gradient(90deg, #cc4400, #ff8800)'
                                  : 'linear-gradient(90deg, #cc9900, #ffdd00)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer – action button */}
        <div className="px-6 pb-6 flex-shrink-0" style={{ borderTop: `1px solid ${theme.color}20` }}>
          {state === 'unlocked' ? (
            <div
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-widest"
              style={{
                background: `${theme.color}20`,
                border: `2px solid ${theme.color}`,
                color: theme.color,
                boxShadow: `0 0 20px ${theme.color}40`,
              }}
            >
              <Trophy size={16} />
              SKILL UNLOCKED
            </div>
          ) : (
            <motion.button
              onClick={canLearn ? onLearn : undefined}
              disabled={!canLearn || isLearning}
              whileHover={canLearn ? { scale: 1.03 } : {}}
              whileTap={canLearn ? { scale: 0.97 } : {}}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
              style={
                canLearn
                  ? {
                      background: `linear-gradient(135deg, ${theme.color}30, ${theme.color}15)`,
                      border: `2px solid ${theme.color}`,
                      color: theme.color,
                      boxShadow: `0 0 20px ${theme.color}50`,
                      cursor: 'pointer',
                    }
                  : {
                      background: '#1a1a1a',
                      border: '2px solid #333',
                      color: '#555',
                      cursor: 'not-allowed',
                    }
              }
            >
              {isLearning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                >
                  <RotateCw size={16} />
                </motion.div>
              ) : (
                <Lock size={15} />
              )}
              {isLearning ? 'Unlocking…' : 'UNLOCK SKILL'}
            </motion.button>
          )}

          {/* Reason why can't learn */}
          {!canLearn && state !== 'unlocked' && canLearnReason && (
            <div
              className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)' }}
            >
              <XCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#ff5555' }} />
              <p className="text-xs leading-snug" style={{ color: '#ff8080' }}>{canLearnReason}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main SkillTree page ──────────────────────────────────────────────────────

export const SkillTree: React.FC = () => {
  const { fighter, canLearnSkill, learnSkill } = useFighter();
  const [activeDomain, setActiveDomain] = useState<SkillDomain>('striking');
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [isLearning, setIsLearning] = useState(false);
  const [notify, setNotify] = useState<{ success: boolean; msg: string } | null>(null);

  const theme = DOMAIN_THEME[activeDomain];

  // Enhanced stats for requirement checks (base detailedStats + currently unlocked skill bonuses).
  // IMPORTANT: Must use fighter.detailedStats (the 30-attribute breakdown), NOT fighter itself.
  const enhancedStats = useMemo(() => {
    if (!fighter?.detailedStats) return null;
    return calculateEnhancedStats(
      fighter.detailedStats,
      fighter.unlocked_skills,
      ALL_SKILLS,
    );
  }, [fighter?.detailedStats, fighter?.unlocked_skills]);

  // Skills for current domain, indexed by row (4 skills per row, ordered by definition)
  const domainData = useMemo(() => {
    const entry = SKILL_TREE.find(d => d.domain === activeDomain);
    const skills = entry?.skills ?? [];
    // Use all skills in the domain, chunk into groups of 4
    const totalRows = Math.ceil(skills.length / 4);
    return Array.from({ length: totalRows }, (_, i) => skills.slice(i * 4, i * 4 + 4));
  }, [activeDomain]);

  // Compute a map of parentId → array of child skills (for fork detection + "Unlocks" display)
  const childrenMap = useMemo(() => {
    const entry = SKILL_TREE.find(d => d.domain === activeDomain);
    const skills = entry?.skills ?? [];
    const map = new Map<string, SkillNode[]>();
    for (const skill of skills) {
      if (skill.parentId) {
        const existing = map.get(skill.parentId) ?? [];
        existing.push(skill);
        map.set(skill.parentId, existing);
      }
    }
    return map;
  }, [activeDomain]);

  // Helper: get node state for a skill
  const getNodeState = useCallback(
    (skill: SkillNode): NodeState => {
      if (!fighter) return 'locked';
      if (fighter.unlocked_skills.includes(skill.id)) return 'unlocked';
      // Available if prerequisites met and all attribute requirements satisfied
      const prereqMet = !skill.parentId || fighter.unlocked_skills.includes(skill.parentId);
      const reqsMet = skill.requirements.every(req => {
        const current = (enhancedStats as unknown as Record<string, number>)?.[req.attribute] ?? 0;
        return current >= req.value;
      });
      return prereqMet && reqsMet ? 'available' : 'locked';
    },
    [fighter, enhancedStats],
  );

  // Whether the connector FROM the previous level TO this skill is "lit"
  const isConnectorLit = useCallback(
    (skill: SkillNode): boolean => {
      if (!fighter) return false;
      // Lit if previous row (parentId) is unlocked
      if (!skill.parentId) return fighter.unlocked_skills.includes(skill.id);
      return fighter.unlocked_skills.includes(skill.parentId);
    },
    [fighter],
  );

  const handleLearn = useCallback(async () => {
    if (!selectedSkill) return;
    setIsLearning(true);
    const result = await learnSkill(selectedSkill.id);
    if (result.success) {
      setFlashId(selectedSkill.id);
      setTimeout(() => setFlashId(null), 700);
      setNotify({ success: true, msg: '✅ Skill unlocked!' });
    } else {
      setNotify({ success: false, msg: result.message });
    }
    setIsLearning(false);
    setTimeout(() => setNotify(null), 3500);
  }, [selectedSkill, learnSkill]);

  const selectedCanLearn = selectedSkill ? canLearnSkill(selectedSkill.id) : null;

  const domainTabs: SkillDomain[] = ['striking', 'wrestling', 'bjj', 'defense'];

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-20">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-dark-bg/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4">

          {/* Header */}
          <div className="flex items-center justify-between pt-4 pb-2">
            <h1 className="text-xl font-black uppercase tracking-widest text-white">
              Skill Tree
            </h1>

          </div>

          {/* Domain tabs */}
          <div className="flex gap-1 pb-3">
            {domainTabs.map(d => {
              const t = DOMAIN_THEME[d];
              const isActive = d === activeDomain;
              return (
                <motion.button
                  key={d}
                  onClick={() => { setActiveDomain(d); setSelectedSkill(null); }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all relative overflow-hidden"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${t.color}30, ${t.color}12)`
                      : 'transparent',
                    border: `1px solid ${isActive ? t.color : '#2a2a2a'}`,
                    color: isActive ? t.color : '#555',
                    boxShadow: isActive ? `0 0 12px ${t.color}30` : 'none',
                  }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
                      layoutId="domainUnderline"
                    />
                  )}
                  {t.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tree grid ───────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* Branch path header labels */}
        <div className="grid grid-cols-4 gap-2 mb-4 px-2">
          {DOMAIN_PATH_LABELS[activeDomain].map((label, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-bold uppercase tracking-widest px-1 py-1 rounded-md"
              style={{
                color: theme.color,
                background: `${theme.color}10`,
                border: `1px solid ${theme.color}25`,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Rows – dynamically generated, supports any number of rows */}
        {domainData.map((rowSkills, rowIdx) => {

          return (
            <div key={rowIdx}>
              {/* Connector row (except before first row) */}
              {rowIdx > 0 && (
                <div className="grid grid-cols-4 gap-2 px-2">
                  {[0, 1, 2, 3].map(colIdx => {
                    const skill = rowSkills[colIdx];
                    const lit = skill ? isConnectorLit(skill) : false;
                    return (
                      <div key={colIdx} className="flex items-center justify-center">
                        <ConnectorLine color={theme.color} unlocked={lit} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Node row */}
              <motion.div
                className="grid grid-cols-4 gap-2 px-2 items-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIdx * 0.04 }}
              >
                {[0, 1, 2, 3].map(colIdx => {
                  const skill = rowSkills[colIdx];
                  if (!skill) {
                    return (
                      <div key={colIdx} className="flex items-center justify-center h-16">
                        <div
                          className="opacity-10 rounded text-[10px] text-gray-700 text-center"
                          style={{ width: 60, height: 60, clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', background: '#111' }}
                        />
                      </div>
                    );
                  }

                  const nodeState = getNodeState(skill);
                  const forkChildren = childrenMap.get(skill.id) ?? [];
                  const isForkPoint = forkChildren.length >= 2;

                  return (
                    <div key={colIdx} className="flex flex-col items-center gap-0.5">
                      <PentagonNode
                        skill={skill}
                        state={nodeState}
                        domain={activeDomain}
                        isActive={selectedSkill?.id === skill.id}
                        onClick={() => setSelectedSkill(skill)}
                        flashId={flashId}
                      />
                      {/* Skill name label */}
                      <p
                        className="text-center text-[9px] leading-tight font-medium max-w-[68px] truncate"
                        style={{
                          color: nodeState === 'locked' ? `${theme.color}55`
                            : nodeState === 'unlocked' ? theme.color
                            : '#aaa',
                        }}
                      >
                        {skill.name}
                      </p>
                      {/* Fork badge – shown when this node branches into 2+ paths */}
                      {isForkPoint && (
                        <div
                          className="text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{
                            background: `${theme.color}22`,
                            border: `1px solid ${theme.color}60`,
                            color: theme.color,
                          }}
                        >
                          ⇕ {forkChildren.length}× větví
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Level label on the far edge */}
                <div
                  className="absolute right-2 text-[10px] font-bold uppercase text-gray-700 select-none"
                  style={{ pointerEvents: 'none' }}
                >
                </div>
              </motion.div>

              {/* Thin separator line between rows (replaces level badge) */}
              <div className="flex items-center justify-center my-1">
                <div className="w-full h-px" style={{ background: '#1a1a1a' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Legend ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center justify-center gap-6 text-[10px] text-gray-600 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-700" />
            Locked
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: `${theme.color}30`, border: `1px solid ${theme.color}` }} />
            Available
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: `${theme.color}20`, border: `2px solid ${theme.color}`, boxShadow: `0 0 6px ${theme.color}` }} />
            Unlocked
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="text-[9px] font-black px-1 rounded"
              style={{ background: theme.color, color: '#000' }}
            >
              A
            </div>
            Active Skill
          </div>
        </div>
      </div>

      {/* ── Skill unlock toast notification ─────────────────── */}
      <AnimatePresence>
        {notify && (
          <motion.div
            key="skill-notify"
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-6 left-1/2 z-[100] -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2.5 shadow-2xl pointer-events-none"
            style={
              notify.success
                ? { background: 'rgba(0,20,5,0.95)', border: '1.5px solid #00ff41', color: '#00ff41', boxShadow: '0 0 24px #00ff4180' }
                : { background: 'rgba(20,5,5,0.95)', border: '1.5px solid #ff4444', color: '#ff6666', boxShadow: '0 0 24px #ff444460' }
            }
          >
            {notify.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {notify.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedSkill && (
          <SkillDetailPanel
            key={selectedSkill.id}
            skill={selectedSkill}
            domain={activeDomain}
            onClose={() => setSelectedSkill(null)}
            onLearn={handleLearn}
            state={getNodeState(selectedSkill)}
            canLearn={selectedCanLearn?.canLearn ?? false}
            canLearnReason={selectedCanLearn?.reason}
            isLearning={isLearning}
            enhancedStats={enhancedStats as Record<string, number> | null}
            allSkills={ALL_SKILLS}
            unlockedSkills={fighter?.unlocked_skills ?? []}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
