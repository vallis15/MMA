import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Zap, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { useFighter } from '../context/FighterContext';
import { useLanguage } from '../context/LanguageContext';
import { GYM_EXERCISES, GymExercise, ExerciseCategory, ExerciseTier } from '../data/gymExercises';
import { performTraining, TrainingResult } from '../utils/training';
import { DetailedFighterStats } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

type CategoryFilter = 'all' | ExerciseCategory;
type TierFilter = 'all' | ExerciseTier;

interface Toast {
  id: number;
  result: TrainingResult;
  exerciseName: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ExerciseCategory, { label: string; color: string; border: string; bg: string; icon: string }> = {
  striking:  { label: 'Striking',  color: 'text-red-400',    border: 'border-red-500/50',    bg: 'bg-red-500/10',    icon: '🥊' },
  wrestling: { label: 'Wrestling', color: 'text-blue-400',   border: 'border-blue-500/50',   bg: 'bg-blue-500/10',   icon: '🤼' },
  bjj:       { label: 'BJJ',       color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10', icon: '🥋' },
  physical:  { label: 'Physical',  color: 'text-green-400',  border: 'border-green-500/50',  bg: 'bg-green-500/10',  icon: '🏋️' },
};

const TIER_CONFIG: Record<ExerciseTier, { label: string; color: string; bg: string; risk?: boolean }> = {
  single:  { label: 'Single',  color: 'text-gray-300',   bg: 'bg-gray-700/60' },
  dual:    { label: 'Dual',    color: 'text-cyan-300',   bg: 'bg-cyan-900/40' },
  complex: { label: 'Complex', color: 'text-yellow-300', bg: 'bg-yellow-900/40' },
  hybrid:  { label: 'Hybrid',  color: 'text-red-300',    bg: 'bg-red-900/40', risk: true },
};

const STAT_LABELS: Record<keyof DetailedFighterStats, string> = {
  jab_precision:       'Jab', cross_power:      'Cross', hook_lethality:   'Hook',
  uppercut_timing:     'Uppercut', leg_kick_hardness: 'Leg Kick', high_kick_speed: 'High Kick',
  spinning_mastery:    'Spin', elbow_sharpness:  'Elbow', knee_impact:      'Knee',
  combination_flow:    'Combo',
  double_leg_explosion:'Dbl Leg', single_leg_grit: 'Sgl Leg', sprawl_technique: 'Sprawl',
  clinch_control:      'Clinch', judo_trips:       'Judo', gnp_pressure:    'GnP',
  top_control_weight:  'Top Ctrl', scramble_ability: 'Scramble',
  choke_mastery:       'Choke', joint_lock_technique: 'Joint Lock', submission_defense: 'Sub Def',
  guard_game:          'Guard', sweep_technique:  'Sweeps', submission_chain: 'Sub Chain',
  cardio:              'Cardio', chin_durability: 'Chin', fight_iq:        'Fight IQ',
  explosive_burst:     'Burst', recovery_rate:   'Recovery', mental_heart:   'Heart',
};

// ─── Toast Component ─────────────────────────────────────────────────────────

const TrainingToast: React.FC<{ toast: Toast; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const { result } = toast;

  return (
    <motion.div
      key={toast.id}
      layout
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-sm ${
        result.success
          ? 'bg-green-950/80 border-green-500/50'
          : 'bg-red-950/80 border-red-500/50'
      }`}
      style={{ minWidth: 260, maxWidth: 320 }}
    >
      {result.success
        ? <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
        : <XCircle    size={20} className="text-red-400   mt-0.5 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${result.success ? 'text-green-300' : 'text-red-300'}`}>
          {toast.exerciseName}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{result.message}</p>
        {result.success && result.skillPointAwarded && (
          <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-yellow-900/50 border border-yellow-500/40">
            <span className="text-base leading-none">⭐</span>
            <span className="text-[11px] font-bold text-yellow-300 uppercase tracking-widest">+1 Skill Point!</span>
          </div>
        )}
        {result.success && result.statChanges && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(result.statChanges).map(([k, v]) => (
              <span
                key={k}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  (v as number) > 0 ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
                }`}
              >
                {STAT_LABELS[k as keyof DetailedFighterStats] ?? k}
                {(v as number) > 0 ? ' +' : ' '}{v}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Exercise Card ────────────────────────────────────────────────────────────

const ExerciseCard: React.FC<{
  exercise: GymExercise;
  currentEnergy: number;
  currentStats: Partial<Record<keyof DetailedFighterStats, number>>;
  currentSkillPoints: number;
  totalTrainingSessions: number;
  fighterId: string;
  onTrainingDone: (result: TrainingResult, exerciseName: string) => void;
}> = ({ exercise, currentEnergy, currentStats, currentSkillPoints, totalTrainingSessions, fighterId, onTrainingDone }) => {
  const [loading, setLoading] = useState(false);
  const catCfg  = CATEGORY_CONFIG[exercise.category];
  const tierCfg = TIER_CONFIG[exercise.tier];
  const canAfford = currentEnergy >= exercise.energyCost;

  const handleTrain = async () => {
    if (loading || !canAfford) return;
    setLoading(true);
    try {
      const result = await performTraining(
        fighterId,
        exercise.id,
        currentEnergy,
        currentStats,
        currentSkillPoints,
        totalTrainingSessions,
      );
      onTrainingDone(result, exercise.name);
    } finally {
      setLoading(false);
    }
  };

  const statEntries = Object.entries(exercise.statChanges) as [keyof DetailedFighterStats, number][];

  return (
    <motion.div
      layout
      whileHover={canAfford ? { y: -4, scale: 1.015 } : {}}
      className={`relative flex flex-col glass-card-premium rounded-2xl p-5 border ${catCfg.border} ${catCfg.bg} overflow-hidden`}
    >
      {/* Tier badge */}
      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${tierCfg.bg} ${tierCfg.color}`}>
        {tierCfg.label}
        {tierCfg.risk && <span className="ml-1">⚠️</span>}
      </div>

      {/* Icon + Name */}
      <div className="flex items-center gap-3 mb-2 pr-16">
        <span className="text-2xl select-none">{exercise.icon}</span>
        <div>
          <h3 className={`font-bold text-sm leading-tight ${catCfg.color}`}>{exercise.name}</h3>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${catCfg.color} opacity-60`}>
            {catCfg.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-xs leading-relaxed mb-3 flex-1">{exercise.description}</p>

      {/* Stat changes */}
      <div className="flex flex-wrap gap-1 mb-4">
        {statEntries.map(([key, delta]) => (
          <span
            key={key}
            className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              delta > 0
                ? 'bg-green-900/50 text-green-300'
                : 'bg-red-900/50 text-red-300'
            }`}
          >
            {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {STAT_LABELS[key] ?? key}
            {delta > 0 ? ` +${delta}` : ` ${delta}`}
          </span>
        ))}
      </div>

      {/* Footer: costs + button */}
      <div className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-1 text-xs font-bold ${canAfford ? 'text-cyan-300' : 'text-red-400'}`}>
          <Zap size={12} />
          {exercise.energyCost}
        </span>
        <motion.button
          whileTap={canAfford ? { scale: 0.93 } : {}}
          onClick={handleTrain}
          disabled={!canAfford || loading}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            canAfford
              ? `${catCfg.bg} hover:brightness-125 ${catCfg.color} border ${catCfg.border} cursor-pointer`
              : 'bg-gray-800/50 text-gray-600 border border-gray-700/30 cursor-not-allowed'
          }`}
        >
          {loading ? '...' : canAfford ? 'Train' : 'Low Energy'}
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Gym: React.FC = () => {
  const { fighter, reloadFighter } = useFighter();
  const { t } = useLanguage();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [tierFilter,     setTierFilter]     = useState<TierFilter>('all');
  const [toasts,         setToasts]         = useState<Toast[]>([]);
  const [toastCounter,   setToastCounter]   = useState(0);

  const canTrain = !!(fighter && fighter.name && fighter.name !== 'Undefined');

  const filteredExercises = GYM_EXERCISES.filter(ex => {
    const catOk  = categoryFilter === 'all' || ex.category === categoryFilter;
    const tierOk = tierFilter     === 'all' || ex.tier     === tierFilter;
    return catOk && tierOk;
  });

  const handleTrainingDone = useCallback(
    async (result: TrainingResult, exerciseName: string) => {
      const id = toastCounter + 1;
      setToastCounter(id);
      setToasts(prev => [...prev, { id, result, exerciseName }]);
      if (result.success) {
        await reloadFighter();
      }
    },
    [toastCounter, reloadFighter],
  );

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const currentEnergy           = Math.ceil(fighter?.currentEnergy ?? 0);
  const currentStats            = (fighter?.detailedStats ?? {}) as Partial<Record<keyof DetailedFighterStats, number>>;
  const currentSkillPoints      = fighter?.skill_points ?? 0;
  const totalTrainingSessions   = (fighter as any)?.total_training_sessions ?? 0;
  const fighterId               = fighter?.id ?? '';

  return (
    <div className="relative p-6 min-h-screen">
      {/* Toast container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <TrainingToast toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-3">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <Dumbbell size={32} className="text-neon-green glow-electric" />
            </motion.div>
            <h1 className="page-header text-neon-green glow-electric text-4xl">{t('gym')}</h1>
          </div>
          <p className="text-gray-400 text-sm uppercase tracking-widest font-light">
            {canTrain
              ? (t('gym_welcome') ?? 'Training grounds').replace('{name}', fighter?.name ?? '')
              : (t('gym_no_fighter') ?? 'Create a fighter first')}
          </p>
        </motion.div>

        {/* ── Fighter Status Bar ── */}
        {canTrain && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {/* Energy */}
            <div className="glass-card-premium rounded-xl p-4 border border-cyan-500/30 bg-cyan-900/10">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('energy') ?? 'Energy'}</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-cyan-300">{currentEnergy}</span>
                <span className="text-xs text-gray-500 mb-0.5">/ 100</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentEnergy}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>

            {/* Reputation */}
            <div className="glass-card-premium rounded-xl p-4 border border-yellow-500/30 bg-yellow-900/10">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('reputation') ?? 'Rep'}</p>
              <span className="text-2xl font-black text-yellow-300">{fighter?.reputation ?? 0}</span>
            </div>

            {/* Record */}
            <div className="glass-card-premium rounded-xl p-4 border border-gray-600/30 bg-gray-800/20">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{t('record') ?? 'Record'}</p>
              <span className="text-xl font-black text-gray-200">
                <span className="text-green-400">{fighter?.record?.wins ?? 0}</span>
                -
                <span className="text-red-400">{fighter?.record?.losses ?? 0}</span>
                -
                <span className="text-gray-400">{fighter?.record?.draws ?? 0}</span>
              </span>
            </div>
          </motion.div>
        )}

        {/* ── No Fighter ── */}
        {!canTrain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-premium rounded-2xl p-16 text-center border-2 border-dashed border-neon-green/40"
          >
            <motion.div className="text-6xl mb-6" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              🥋
            </motion.div>
            <h3 className="section-header text-neon-green mb-3 text-3xl">{t('no_fighter_yet') ?? 'No fighter yet'}</h3>
            <p className="text-gray-400 uppercase tracking-widest text-sm">{t('gym_create_prompt') ?? 'Register a fighter first'}</p>
          </motion.div>
        )}

        {canTrain && (
          <>
            {/* ── Filter Row ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-3 mb-6"
            >
              {/* Category filters */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'striking', 'wrestling', 'bjj', 'physical'] as CategoryFilter[]).map(cat => {
                  const active = categoryFilter === cat;
                  const cfg = cat !== 'all' ? CATEGORY_CONFIG[cat] : null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all duration-200 ${
                        active
                          ? cfg
                            ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                            : 'bg-neon-green/20 text-neon-green border-neon-green/50'
                          : 'bg-gray-800/40 text-gray-500 border-gray-700/30 hover:border-gray-500/50 hover:text-gray-300'
                      }`}
                    >
                      {cat === 'all' ? '⚔️ All' : `${cfg!.icon} ${cfg!.label}`}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-700/50 self-stretch hidden sm:block" />

              {/* Tier filters */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'single', 'dual', 'complex', 'hybrid'] as TierFilter[]).map(tier => {
                  const active = tierFilter === tier;
                  const cfg = tier !== 'all' ? TIER_CONFIG[tier] : null;
                  return (
                    <button
                      key={tier}
                      onClick={() => setTierFilter(tier)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-200 border ${
                        active
                          ? cfg
                            ? `${cfg.bg} ${cfg.color} border-white/10`
                            : 'bg-gray-600/40 text-gray-200 border-gray-500/40'
                          : 'bg-gray-800/30 text-gray-600 border-gray-700/20 hover:text-gray-400'
                      }`}
                    >
                      {tier === 'all' ? 'All Tiers' : cfg!.label}
                      {tier !== 'all' && TIER_CONFIG[tier].risk && ' ⚠️'}
                    </button>
                  );
                })}
              </div>

              {/* Count */}
              <div className="ml-auto self-center text-xs text-gray-600 font-mono hidden sm:block">
                {filteredExercises.length} / {GYM_EXERCISES.length} exercises
              </div>
            </motion.div>

            {/* ── Exercise Grid ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${categoryFilter}-${tierFilter}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredExercises.map((exercise, idx) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.035, 0.5) }}
                  >
                    <ExerciseCard
                      exercise={exercise}
                      currentEnergy={currentEnergy}
                      currentStats={currentStats}
                      currentSkillPoints={currentSkillPoints}
                      totalTrainingSessions={totalTrainingSessions}
                      fighterId={fighterId}
                      onTrainingDone={handleTrainingDone}
                    />
                  </motion.div>
                ))}

                {filteredExercises.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-16 text-gray-600 text-sm uppercase tracking-widest"
                  >
                    No exercises found for this filter combination.
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};


