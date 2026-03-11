import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bell, X, Swords, Shield, Atom, Brain, ChevronRight, Zap, Trophy, TrendingUp, Dumbbell, BookOpen, RotateCcw } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { ALL_SKILLS } from '../constants/skillTree';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FighterInitialization } from '../components/FighterInitialization';
import { LoadingScreen } from '../components/LoadingScreen';
import { useNavigate } from 'react-router-dom';
import { DetailedFighterStats } from '../types';
import { FighterVisual } from '../components/FighterVisual';
import { supabase } from '../lib/supabase';

// ─── Aggregation helpers ─────────────────────────────────────────────────────

const d10 = (v: number | undefined | null) => (typeof v === 'number' && !isNaN(v) ? v : 10);

const avg = (vals: (number | undefined | null)[]) =>
  Math.round(vals.reduce<number>((s, v) => s + d10(v), 0) / vals.length);

const getIndices = (ds?: DetailedFighterStats) => ({
  striking: avg([
    ds?.jab_precision, ds?.cross_power, ds?.hook_lethality, ds?.uppercut_timing,
    ds?.leg_kick_hardness, ds?.high_kick_speed, ds?.spinning_mastery,
    ds?.elbow_sharpness, ds?.knee_impact, ds?.combination_flow,
  ]),
  grappling: avg([
    ds?.double_leg_explosion, ds?.single_leg_grit, ds?.sprawl_technique,
    ds?.clinch_control, ds?.judo_trips, ds?.gnp_pressure,
    ds?.top_control_weight, ds?.scramble_ability,
  ]),
  bjj: avg([
    ds?.choke_mastery, ds?.joint_lock_technique, ds?.submission_defense,
    ds?.guard_game, ds?.sweep_technique, ds?.submission_chain,
  ]),
  physical: avg([
    ds?.cardio, ds?.chin_durability, ds?.fight_iq,
    ds?.explosive_burst, ds?.recovery_rate, ds?.mental_heart,
  ]),
});

// ─── Circular progress ring ──────────────────────────────────────────────────

interface RingProps {
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  glowColor: string;
}

const Ring: React.FC<RingProps> = ({ value, size = 96, stroke = 7, color, glowColor }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black leading-none" style={{ color }}>{value}</span>
        <span className="text-[9px] text-gray-500 uppercase tracking-wider">OVR</span>
      </div>
    </div>
  );
};

// ─── Index hero card ─────────────────────────────────────────────────────────

interface IndexCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  ringColor: string;
  glowColor: string;
  borderClass: string;
  textClass: string;
  subLabel: string;
  delay: number;
}

const IndexCard: React.FC<IndexCardProps> = ({
  label, value, icon, ringColor, glowColor, borderClass, textClass, subLabel, delay,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay }}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className={`flex items-center gap-4 p-5 rounded-2xl border bg-dark-secondary/70 backdrop-blur-sm ${borderClass}`}
    style={{ boxShadow: `0 0 20px ${glowColor}18` }}
  >
    <Ring value={value} color={ringColor} glowColor={glowColor} />
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className={textClass}>{icon}</span>
        <span className={`font-oswald font-bold text-base uppercase tracking-widest ${textClass}`}>{label}</span>
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{subLabel}</p>
      {/* Mini bar */}
      <div className="mt-2 h-1.5 rounded-full bg-gray-800 overflow-hidden w-32">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${ringColor}cc, ${ringColor})` }}
        />
      </div>
    </div>
  </motion.div>
);

// ─── Prominent Energy Banner ──────────────────────────────────────────────────

interface EnergyBannerProps {
  current: number;
  max: number;
  delay?: number;
}

const EnergyBanner: React.FC<EnergyBannerProps> = ({ current, max, delay = 0.2 }) => {
  const pct = Math.min(100, Math.round((current / max) * 100));
  const isLow = pct <= 30;
  const isMid = pct > 30 && pct <= 60;

  const barColor = isLow
    ? 'linear-gradient(90deg,#dc2626,#f87171)'
    : isMid
    ? 'linear-gradient(90deg,#d97706,#fbbf24)'
    : 'linear-gradient(90deg,#eab308,#facc15,#fef08a)';

  const glowColor = isLow ? 'rgba(220,38,38,0.4)' : isMid ? 'rgba(217,119,6,0.4)' : 'rgba(234,179,8,0.45)';
  const borderColor = isLow ? 'border-red-500/40' : isMid ? 'border-yellow-600/40' : 'border-yellow-400/40';
  const textColor = isLow ? 'text-red-400' : isMid ? 'text-yellow-400' : 'text-yellow-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-2xl border ${borderColor} bg-dark-secondary/80 backdrop-blur-sm p-5`}
      style={{ boxShadow: `0 0 32px ${glowColor}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [1, 0.8, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className={`text-2xl leading-none`}
          >
            ⚡
          </motion.div>
          <span className={`font-oswald font-bold text-lg uppercase tracking-widest ${textColor}`}>
            Training Energy
          </span>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest hidden sm:inline">
            — used for Gym sessions
          </span>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black leading-none ${textColor}`}>{Math.ceil(current)}</span>
          <span className="text-sm text-gray-500 font-normal"> / {max}</span>
        </div>
      </div>

      {/* Big glowing bar */}
      <div className="h-6 rounded-full overflow-hidden bg-gray-900/80 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, delay: delay + 0.1, ease: 'easeOut' }}
          className="h-full rounded-full relative"
          style={{
            background: barColor,
            boxShadow: `0 0 14px ${glowColor}`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.35) 0%,transparent 60%)' }}
          />
          {/* Animated shimmer */}
          <motion.div
            className="absolute inset-y-0 w-8 rounded-full opacity-30"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)' }}
            animate={{ left: ['-8%', '110%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 0.8 }}
          />
        </motion.div>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white/70 uppercase tracking-widest pointer-events-none">
          {pct}%
        </span>
      </div>

      {isLow && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-2 text-xs text-red-400 uppercase tracking-wider"
        >
          ⚠ Energy critically low — rest to recover
        </motion.p>
      )}
    </motion.div>
  );
};

// ─── Mastered Techniques / Unlocked Skills ────────────────────────────────────

const DOMAIN_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  striking:  { bg: 'bg-red-950/60',     border: 'border-red-500/40',     text: 'text-red-300',    dot: 'bg-red-500' },
  wrestling: { bg: 'bg-blue-950/60',    border: 'border-blue-500/40',    text: 'text-blue-300',   dot: 'bg-blue-500' },
  bjj:       { bg: 'bg-purple-950/60',  border: 'border-purple-500/40',  text: 'text-purple-300', dot: 'bg-purple-500' },
  defense:   { bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', text: 'text-emerald-300',dot: 'bg-emerald-500' },
};

const DOMAIN_LABELS: Record<string, string> = {
  striking: 'Striking',
  wrestling: 'Wrestling',
  bjj: 'BJJ',
  defense: 'Defense',
};

interface MasteredTechniquesProps {
  unlockedIds: string[];
  delay?: number;
}

const MasteredTechniques: React.FC<MasteredTechniquesProps> = ({ unlockedIds, delay = 0.35 }) => {
  const skills = unlockedIds
    .map(id => ALL_SKILLS.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="rounded-2xl border border-gray-700/50 bg-dark-secondary/70 p-5"
    >
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
        <BookOpen size={13} className="text-purple-400" />
        Mastered Techniques
        {skills.length > 0 && (
          <span className="ml-auto text-purple-400 font-black text-xs">{skills.length}</span>
        )}
      </h3>

      {skills.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Dumbbell size={28} className="text-gray-700" />
          <p className="text-sm text-gray-600 max-w-xs">
            No techniques mastered yet.{' '}
            <span className="text-gray-500">Visit the Gym and Skill Tree to begin.</span>
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => {
            const style = DOMAIN_STYLES[skill.domain] ?? DOMAIN_STYLES.defense;
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: delay + i * 0.04 }}
                title={`${DOMAIN_LABELS[skill.domain]} · ${skill.description?.slice(0, 80) ?? ''}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide cursor-default select-none ${style.bg} ${style.border} ${style.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
                {skill.name}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const { fighter, createFighter, reloadFighter, fighterLoading } = useFighter();
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInitialization, setShowInitialization] = useState(false);
  const [formData, setFormData] = useState({ name: '', nickname: '' });
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleAdminReset = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      await supabase
        .from('profiles')
        .update({ visual_config: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      await reloadFighter();
      navigate('/create-fighter', { replace: true });
    } catch (err) {
      console.error('Admin reset failed:', err);
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  useEffect(() => {
    if (!user || !fighter) return;
    const isEmailPrefix = fighter.name === fighter.name.toLowerCase() && !fighter.name.includes(' ');
    const isDefault = fighter.name === 'Fighter' || fighter.name === 'Undefined';
    setShowInitialization(isEmailPrefix && !isDefault);
  }, [fighter, user]);

  useEffect(() => {
    const saved = localStorage.getItem('global_announcement');
    if (saved) { setAnnouncement(saved); setShowAnnouncement(true); }
  }, []);

  const handleInitializationComplete = async (_fighterName: string) => {
    await reloadFighter();
    setShowInitialization(false);
  };

  const handleCreateFighter = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.nickname) {
      createFighter(formData.name, formData.nickname);
      setFormData({ name: '', nickname: '' });
      setShowCreateForm(false);
    }
  };

  const indices = getIndices(fighter?.detailedStats);
  const overallRating = Math.round((indices.striking + indices.grappling + indices.bjj + indices.physical) / 4);

  // Show a themed loading screen while fighter profile is being fetched
  if (fighterLoading) {
    return <LoadingScreen message="Checking Fighter Profile..." />;
  }

  const totalFights = (fighter?.record.wins ?? 0) + (fighter?.record.losses ?? 0) + (fighter?.record.draws ?? 0);
  const winRate = totalFights > 0 ? Math.round((fighter!.record.wins / totalFights) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Initialization modal */}
        <AnimatePresence>
          {showInitialization && user && (
            <FighterInitialization userId={user.id} onComplete={handleInitializationComplete} />
          )}
        </AnimatePresence>

        {/* Announcement banner */}
        <AnimatePresence>
          {announcement && showAnnouncement && (
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="glass-card-premium p-4 border-l-4 border-alert-red/80 rounded-xl flex items-start gap-4"
            >
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Bell className="w-5 h-5 text-alert-red flex-shrink-0 mt-0.5" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold uppercase tracking-wider text-xs mb-1">{t('global_announcement')}</p>
                <p className="text-gray-300 text-sm">{announcement}</p>
              </div>
              <button onClick={() => setShowAnnouncement(false)} className="text-gray-500 hover:text-white transition flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {fighter && fighter.name !== 'Undefined' ? (
          <>
            {/* ── Fighter Hero Header ─────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl border border-neon-green/20 bg-gradient-to-br from-dark-secondary via-dark-tertiary to-dark-secondary p-6 md:p-8"
              style={{ boxShadow: '0 0 50px rgba(0,255,65,0.05)' }}
            >
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-neon-green/5 rounded-full blur-3xl pointer-events-none" />

              {/* ── Admin reset button (hidden in corner, admin-only) ── */}
              {isAdmin && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                  {showResetConfirm ? (
                    <div className="flex items-center gap-2 bg-red-950/90 border border-red-700/60 rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm">
                      <span className="text-red-400 font-semibold">Reset character?</span>
                      <button
                        onClick={handleAdminReset}
                        disabled={isResetting}
                        className="text-red-300 hover:text-white font-black uppercase tracking-wider transition-colors"
                      >
                        {isResetting ? '...' : 'YES'}
                      </button>
                      <span className="text-gray-600">|</span>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="text-gray-500 hover:text-gray-300 font-semibold uppercase tracking-wider transition-colors"
                      >
                        NO
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      title="Admin: Reset Character"
                      className="text-gray-700 hover:text-red-500 transition-colors p-1 rounded"
                    >
                      <RotateCcw size={11} />
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-end gap-6">
                {/* ── Fighter Visual (3D silhouette with idle float) ── */}
                <div className="flex-shrink-0 self-center md:self-auto relative">
                  {fighter.visual_config ? (
                    <>
                      <FighterVisual
                        config={fighter.visual_config}
                        height={260}
                        className="drop-shadow-[0_0_24px_rgba(0,255,65,0.12)]"
                      />
                      {/* OVR pill pinned below the figure */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-neon-green text-dark-primary text-[10px] font-black px-2 py-0.5 rounded-md leading-none whitespace-nowrap z-10">
                        OVR {overallRating}
                      </div>
                    </>
                  ) : (
                    /* Fallback octagon letter avatar */
                    <div className="relative">
                      <div
                        className="w-20 h-20 flex items-center justify-center text-3xl font-black bg-dark-tertiary border-2 border-neon-green/50 text-neon-green"
                        style={{
                          clipPath: 'polygon(30% 0%,70% 0%,100% 30%,100% 70%,70% 100%,30% 100%,0% 70%,0% 30%)',
                          boxShadow: '0 0 24px rgba(0,255,65,0.25)',
                        }}
                      >
                        {fighter.name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-neon-green text-dark-primary text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                        {overallRating}
                      </div>
                    </div>
                  )}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl md:text-4xl font-oswald font-black text-white uppercase tracking-wide leading-none mb-1">
                    {fighter.name}
                    {fighter.country_code && (
                      <span className="ml-3 text-2xl md:text-3xl align-middle font-normal normal-case tracking-normal">
                        ({fighter.country_code}){' '}
                        {[...fighter.country_code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')}
                      </span>
                    )}
                  </h1>
                  {fighter.nickname ? (
                    <p className="text-alert-red font-bold italic text-sm mb-4">&ldquo;{fighter.nickname}&rdquo;</p>
                  ) : (
                    <p className="text-gray-600 italic text-sm mb-4">No nickname set</p>
                  )}
                  <div className="flex flex-wrap gap-4">
                    {[
                      { label: 'Wins', val: fighter.record.wins, cls: 'text-neon-green' },
                      { label: 'Losses', val: fighter.record.losses, cls: 'text-alert-red' },
                      { label: 'Draws', val: fighter.record.draws, cls: 'text-gray-400' },
                      { label: 'Rep', val: fighter.reputation, cls: 'text-purple-400' },
                    ].map(({ label, val, cls }) => (
                      <div key={label} className="text-center">
                        <div className={`text-2xl font-black leading-none ${cls}`}>{val}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Win Rate badge */}
                <div className="hidden md:flex flex-col items-center gap-1 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-dark-tertiary px-4 py-2 rounded-full border border-neon-green/30">
                    <Trophy size={14} className="text-neon-green" />
                    <span className="text-gray-400 text-xs uppercase tracking-wider">Win Rate</span>
                    <span className="font-black text-neon-green text-sm">{winRate}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-[10px] uppercase tracking-wider">
                    <TrendingUp size={10} />
                    {totalFights} fights
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Energy Banner ──────────────────────────────────── */}
            <EnergyBanner
              current={fighter.currentEnergy}
              max={fighter.maxEnergy}
              delay={0.18}
            />

            {/* ── 4 Index Hero Cards ──────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <IndexCard
                label="Striking" value={indices.striking} delay={0.05}
                icon={<Swords size={16} />}
                ringColor="#ef4444" glowColor="#ef4444"
                borderClass="border-red-500/30" textClass="text-red-400"
                subLabel="10 striking attributes"
              />
              <IndexCard
                label="Grappling" value={indices.grappling} delay={0.12}
                icon={<Shield size={16} />}
                ringColor="#3b82f6" glowColor="#3b82f6"
                borderClass="border-blue-500/30" textClass="text-blue-400"
                subLabel="8 wrestling attributes"
              />
              <IndexCard
                label="BJJ" value={indices.bjj} delay={0.19}
                icon={<Atom size={16} />}
                ringColor="#a855f7" glowColor="#a855f7"
                borderClass="border-purple-500/30" textClass="text-purple-400"
                subLabel="6 BJJ attributes"
              />
              <IndexCard
                label="Physicality" value={indices.physical} delay={0.26}
                icon={<Brain size={16} />}
                ringColor="#10b981" glowColor="#10b981"
                borderClass="border-emerald-500/30" textClass="text-emerald-400"
                subLabel="6 physical / mental attributes"
              />
            </div>

            {/* ── Mastered Techniques ──────────────────────────── */}
            <MasteredTechniques
              unlockedIds={fighter.unlocked_skills ?? []}
              delay={0.32}
            />

            {/* ── Quick Action ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,255,65,0.2)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/profile')}
                className="flex-1 flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-neon-green/10 to-emerald-500/10 border border-neon-green/30 hover:border-neon-green/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                    <TrendingUp size={16} className="text-neon-green" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-neon-green uppercase tracking-wider">Fighter Profile</div>
                    <div className="text-xs text-gray-500">View all 30 detailed attributes</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neon-green/50 group-hover:text-neon-green group-hover:translate-x-1 transition-all" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/gym')}
                className="flex-1 flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-700/30 hover:border-blue-500/60 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Zap size={16} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-blue-400 uppercase tracking-wider">Go Train</div>
                    <div className="text-xs text-gray-500">Improve your stats in the Gym</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-blue-400/50 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </motion.button>
            </motion.div>
          </>
        ) : (
          // ── No fighter yet ─────────────────────────────────────────
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card-premium rounded-2xl p-12 text-center border-2 border-dashed border-neon-green/40"
          >
            <motion.div className="text-6xl mb-6" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              🥋
            </motion.div>
            <h3 className="text-3xl font-oswald font-bold text-neon-green mb-3 uppercase tracking-wider">{t('no_fighter_yet')}</h3>
            <p className="text-gray-400 mb-8 uppercase tracking-widest text-sm">{t('create_fighter_prompt')}</p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-green to-emerald-400 text-dark-bg font-bold px-8 py-3 rounded-lg hover:shadow-2xl hover:shadow-neon-green/50 transition-all uppercase tracking-wider text-sm"
            >
              <Plus size={20} />
              {t('create_fighter')}
            </motion.button>
          </motion.div>
        )}

        {/* Create Fighter modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="glass-card-premium rounded-2xl p-8 w-full max-w-md shadow-2xl"
              >
                <h3 className="section-header text-neon-green mb-8 text-2xl">{t('create_new_fighter')}</h3>
                <form onSubmit={handleCreateFighter} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">{t('fighter_name')}</label>
                    <input
                      type="text" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('placeholder_name')}
                      className="w-full bg-dark-tertiary/50 border border-neon-green/30 focus:border-neon-green rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">{t('nickname')}</label>
                    <input
                      type="text" value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder={t('placeholder_nickname')}
                      className="w-full bg-dark-tertiary/50 border border-neon-green/30 focus:border-neon-green rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit"
                      className="flex-1 bg-gradient-to-r from-neon-green to-emerald-400 text-dark-bg font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-green/50 transition-all uppercase tracking-wider text-sm">
                      {t('create')}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-dark-tertiary/50 text-gray-300 font-bold py-3 rounded-lg border border-dark-tertiary hover:border-alert-red/50 transition-all uppercase tracking-wider text-sm">
                      {t('cancel')}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};
