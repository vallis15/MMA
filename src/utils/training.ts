import { supabase } from '../lib/supabase';
import { GYM_EXERCISES, GymExercise } from '../data/gymExercises';
import { DetailedFighterStats } from '../types';

// All stat keys from DetailedFighterStats
const STAT_KEYS: (keyof DetailedFighterStats)[] = [
  'jab_precision', 'cross_power', 'hook_lethality', 'uppercut_timing',
  'leg_kick_hardness', 'high_kick_speed', 'spinning_mastery', 'elbow_sharpness',
  'knee_impact', 'combination_flow',
  'double_leg_explosion', 'single_leg_grit', 'sprawl_technique', 'clinch_control',
  'judo_trips', 'gnp_pressure', 'top_control_weight', 'scramble_ability',
  'choke_mastery', 'joint_lock_technique', 'submission_defense', 'guard_game',
  'sweep_technique', 'submission_chain',
  'cardio', 'chin_durability', 'fight_iq', 'explosive_burst', 'recovery_rate',
  'mental_heart',
];

export interface TrainingResult {
  success: boolean;
  message: string;
  statChanges?: Partial<Record<keyof DetailedFighterStats, number>>;
  newEnergy?: number;
  /** True when this session happened to award a bonus skill point (~15% chance). */
  skillPointAwarded?: boolean;
}

/**
 * Performs a training exercise for a fighter.
 * 1. Validates energy
 * 2. Applies stat changes (clamped 1–250)
 * 3. Deducts energy
 * 4. 15% chance to award +1 skill point (≈ 1 per 6–7 sessions)
 * 5. Upserts Supabase profiles row
 * 6. Inserts training_sessions log row
 * @param fighterLevel Optional: current fighter level (stored in session log).
 */
export const performTraining = async (
  fighterId: string,
  exerciseId: string,
  currentEnergy: number,
  currentStats: Partial<Record<keyof DetailedFighterStats, number>>,
  currentSkillPoints: number = 0,
  currentTotalSessions: number = 0,
  fighterLevel: number = 1,
): Promise<TrainingResult> => {
  const exercise: GymExercise | undefined = GYM_EXERCISES.find(e => e.id === exerciseId);

  if (!exercise) {
    return { success: false, message: 'Exercise not found.' };
  }

  if (currentEnergy < exercise.energyCost) {
    return {
      success: false,
      message: `Not enough energy. Need ${exercise.energyCost}, have ${Math.ceil(currentEnergy)}.`,
    };
  }

  // Build updated stat object — clamp each value to [1, 100]
  const updatedStats: Record<string, number> = {};
  for (const key of STAT_KEYS) {
    const current = currentStats[key] ?? 10;
    const delta = exercise.statChanges[key] ?? 0;
    updatedStats[key] = Math.min(250, Math.max(1, current + delta));
  }

  const newEnergy = Math.max(0, currentEnergy - exercise.energyCost);
  
  // ~15% chance per session of earning a bonus skill point (≈ 1 per 6-7 sessions).
  // This keeps skill points genuinely scarce — a consistent trainer earns roughly
  // one point per real-world day of play.
  const SKILL_POINT_CHANCE = 0.15;
  const awardSkillPoint = Math.random() < SKILL_POINT_CHANCE;
  const newSkillPoints = currentSkillPoints + (awardSkillPoint ? 1 : 0);

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updatedStats,
      energy:                  newEnergy,
      skill_points:            newSkillPoints,
      total_training_sessions: currentTotalSessions + 1,
      last_training_at:        now,
      updated_at:              now,
    })
    .eq('id', fighterId);

  if (error) {
    console.error('[performTraining] Supabase error:', error);
    return { success: false, message: `Training failed: ${error.message}` };
  }

  // ── Log the training session ──────────────────────────────────────────────
  const { error: logErr } = await supabase
    .from('training_sessions')
    .insert({
      fighter_id:           fighterId,
      exercise_id:          exercise.id,
      exercise_name:        exercise.name,
      category:             exercise.category,
      tier:                 exercise.tier,
      energy_cost:          exercise.energyCost,
      money_cost:           exercise.moneyCost,
      stat_changes:         exercise.statChanges,
      skill_point_awarded:  awardSkillPoint,
      fighter_level:        fighterLevel,
    });

  if (logErr) {
    console.error('[performTraining] training_sessions insert error:', logErr);
  }

  // Return the actual delta (what changed) for display
  const deltaResults: Partial<Record<keyof DetailedFighterStats, number>> = {};
  for (const [key, delta] of Object.entries(exercise.statChanges) as [keyof DetailedFighterStats, number][]) {
    if (delta !== 0) deltaResults[key] = delta;
  }

  return {
    success: true,
    message: `${exercise.name} complete!`,
    statChanges: deltaResults,
    newEnergy,
    skillPointAwarded: awardSkillPoint || undefined,
  };
};
