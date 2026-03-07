// ─── Skill-Stat Processor ─────────────────────────────────────────────────────
// Combines a fighter's raw DetailedFighterStats with the passive bonuses
// from every skill they've unlocked to produce the final "enhanced" stats
// that drive both the UI display and the fight engine.

import type { DetailedFighterStats } from '../types';
import type { SkillNode } from '../types/skills';

// ─────────────────────────────────────────────────────────────────────────────
//  calculateEnhancedStats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clones `baseStats` and ADDS the statBoosts of every unlocked skill.
 * Boosts are additive and uncapped here – the UI can clamp display values.
 *
 * @param baseStats        The raw 30-attribute stats stored in Supabase.
 * @param unlockedSkillIds The fighter's `unlocked_skills` array.
 * @param allSkillsData    The master skill list (ALL_SKILLS from skillTree.ts).
 * @returns                A new object – never mutates baseStats.
 */
export function calculateEnhancedStats(
  baseStats: DetailedFighterStats,
  unlockedSkillIds: string[],
  allSkillsData: SkillNode[],
): DetailedFighterStats {
  // Shallow clone – we only deal with number values so this is sufficient
  const enhanced: DetailedFighterStats = { ...baseStats };

  if (!unlockedSkillIds.length) return enhanced;

  // Build a lookup map so iteration is O(n) instead of O(n²)
  const skillMap = new Map<string, SkillNode>(
    allSkillsData.map(s => [s.id, s]),
  );

  for (const skillId of unlockedSkillIds) {
    const skill = skillMap.get(skillId);
    if (!skill?.statBoosts) continue;

    for (const [key, boost] of Object.entries(skill.statBoosts)) {
      if (boost === undefined) continue;
      // Object.prototype.hasOwnProperty guards against prototype pollution
      if (Object.prototype.hasOwnProperty.call(enhanced, key)) {
        (enhanced as unknown as Record<string, number>)[key] += boost;
      }
    }
  }

  return enhanced;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Stat label map (mirrors SkillTree UI labels)
// ─────────────────────────────────────────────────────────────────────────────

const STAT_LABELS: Record<string, string> = {
  jab_precision: 'Jab Precision',
  cross_power: 'Cross Power',
  hook_lethality: 'Hook Lethality',
  uppercut_timing: 'Uppercut Timing',
  leg_kick_hardness: 'Leg Kick',
  high_kick_speed: 'High Kick',
  spinning_mastery: 'Spinning',
  elbow_sharpness: 'Elbow Sharpness',
  knee_impact: 'Knee Impact',
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

// ─────────────────────────────────────────────────────────────────────────────
//  canLearnSkill
// ─────────────────────────────────────────────────────────────────────────────

export interface CanLearnResult {
  canLearn: boolean;
  reason?: string;
}

/**
 * Pure validation – returns whether a fighter can unlock a given skill.
 * Gates:
 *   1. Skill exists in the tree.
 *   2. Skill not already unlocked.
 *   3. If skill has a parentId, that parent must already be unlocked.
 *   4. All skill.requirements are met by the fighter's enhanced stats.
 *
 * IMPORTANT: Uses fighter.detailedStats (the 30-attribute breakdown) for
 * requirement checks, NOT the top-level fighter.stats object.
 */
export function canLearnSkill(
  fighter: { unlocked_skills: string[]; detailedStats?: DetailedFighterStats; skill_points?: number },
  skillId: string,
  allSkillsData: SkillNode[],
): CanLearnResult {
  const skill = allSkillsData.find(s => s.id === skillId);

  if (!skill) {
    return { canLearn: false, reason: 'Skill not found in the skill tree.' };
  }

  if (fighter.unlocked_skills.includes(skillId)) {
    return { canLearn: false, reason: 'You have already unlocked this skill.' };
  }

  // Parent prerequisite check – must come BEFORE attribute check for clear messaging
  if (skill.parentId && !fighter.unlocked_skills.includes(skill.parentId)) {
    const parentSkill = allSkillsData.find(s => s.id === skill.parentId);
    return {
      canLearn: false,
      reason: `Requires previous skill: ${parentSkill?.name ?? skill.parentId}`,
    };
  }

  // Compute enhanced stats using detailedStats (the 30-stat breakdown from Supabase)
  // Falls back to empty object if detailedStats not yet loaded – all requirements = 0
  const baseStats = fighter.detailedStats ?? ({} as DetailedFighterStats);
  const enhanced = calculateEnhancedStats(
    baseStats,
    fighter.unlocked_skills,
    allSkillsData,
  );

  // Check every attribute requirement – ALL must pass
  for (const req of skill.requirements) {
    const current = (enhanced as unknown as Record<string, number>)[req.attribute] ?? 0;
    if (current < req.value) {
      const label = STAT_LABELS[req.attribute] ?? req.attribute.replace(/_/g, ' ');
      return {
        canLearn: false,
        reason: `Not enough ${label}: ${current} / ${req.value} required`,
      };
    }
  }

  // Skill point check – last gate so attribute messages are shown first
  if ((fighter.skill_points ?? 0) < 1) {
    return { canLearn: false, reason: 'No skill points available. Keep training to earn more!' };
  }

  return { canLearn: true };
}
