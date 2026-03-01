// ─── Skill Tree Type Definitions ─────────────────────────────────────────────
// Phase 1 Foundation – defines the shape of every node in the skill tree.

/** Whether a skill is always active (passive bonus) or triggered during a fight (active). */
export type SkillType = 'passive' | 'active';

// ─── Combat Mechanic Types ─────────────────────────────────────────────────

/** When the mechanic fires relative to a combat event. */
export type MechanicTrigger =
  // ── Legacy triggers (BJJ / Defense domains) ──────────────────────────────
  | 'on_any_hit'         // any damaging strike connects
  | 'on_body_hit'        // strike lands on the body
  | 'on_leg_kick'        // leg kick lands
  | 'on_critical_hit'    // HEAVY_HIT or CRITICAL_HIT category fires
  | 'on_miss_received'   // opponent's attack misses or is dodged
  | 'on_takedown'        // a TAKEDOWN_ATTEMPT event fires
  | 'on_ground_top'      // fighter is on top (GROUND_CONTROL / SUBMISSION_ATTEMPT)
  | 'on_submission'      // a SUBMISSION_ATTEMPT fires
  | 'on_standup'         // any strike during STANDUP phase
  | 'on_any_event'       // fires on every single combat event
  // ── New triggers (Striking / Wrestling v2) ────────────────────────────────
  | 'on_attack'          // owner launches an offensive action
  | 'on_defend'          // owner is absorbing / avoiding an opponent action
  | 'on_low_health'      // owner's HP drops below 35 % – survival instinct fires
  | 'on_takedown_attempt'; // owner initiates or defends a takedown attempt

/** What happens when the mechanic triggers. */
export type MechanicEffect =
  // ── Legacy effects ────────────────────────────────────────────────────────
  | 'stun'              // opponent skips N turns
  | 'bleed'             // stack bonus damage on opponent's next hits received
  | 'stamina_drain'     // drain opponent stamina by effectValue
  | 'stamina_restore'   // restore own stamina by effectValue (isDefensive)
  | 'damage_multiplier' // multiply current event damage by effectValue
  | 'knockdown'         // generate a follow-up heavy damage event (effectValue = bonus dmg)
  | 'instant_ko'        // effectValue = fractional chance (e.g. 0.05 = 5%) to trigger FINISHER
  | 'zombie_mode'       // one-time: survive a lethal hit, restore effectValue HP (isDefensive)
  | 'reflect_damage'    // deal back effectValue% of incoming damage (isDefensive)
  | 'stat_debuff'       // reduce opponent simulated stamina cap by effectValue
  | 'fracture'          // one-time: permanent large stamina cap cut on opponent
  | 'auto_counter'      // push an immediate counter strike event (effectValue = bonus dmg)
  // ── New effects (Striking / Wrestling v2) ─────────────────────────────────
  | 'extra_damage'      // add flat bonus damage on top of current hit
  | 'counter'           // fire an immediate counter-strike after opponent's action
  | 'intercept'         // interrupt opponent's attack mid-motion with own strike
  | 'knockout'          // high-level: attempt a decisive finishing blow (chance-based)
  | 'leg_catch'         // wrestling: catch opponent's leg mid-kick, reversal follows
  | 'slam'              // wrestling: lift and drive opponent to the canvas with impact
  | 'cage_pin'          // wrestling: pin opponent to the fence, restricting movement
  | 'scramble';         // wrestling: gain positional advantage after a chaotic exchange

/**
 * A combat mechanic attached to a skill node.
 * When the trigger fires and the chance check passes, the effect is applied during the fight.
 *
 * NOTE – chance scale:
 *  • Legacy skills (BJJ / Defense):  0–1  decimal  (e.g. 0.25 = 25 %)
 *  • New skills (Striking / Wrestling v2):  0–100  integer  (e.g. 25 = 25 %)
 *    The Arena evaluator normalises automatically: if (chance > 1) chance /= 100.
 */
export interface SkillMechanic {
  trigger: MechanicTrigger;
  /** Probability the mechanic fires.  Use 0–100 integer for new skills, 0–1 for legacy. */
  chance: number;
  effect: MechanicEffect;
  /**
   * Optional magnitude – only required for legacy effects that need a numeric value.
   *  - stun → turns skipped
   *  - bleed → stack count
   *  - stamina_drain/restore → points
   *  - damage_multiplier → multiplier  (1.5 = +50 %)
   *  - knockdown → bonus damage
   *  - instant_ko → fractional KO chance  (0.05 = 5 %)
   *  - zombie_mode → HP restored
   *  - reflect_damage → % reflected
   *  - stat_debuff/fracture → stamina cap reduction
   *  - auto_counter / extra_damage → bonus damage added
   */
  effectValue?: number;
  /** Displayed in the battle log with neon highlight when triggered. */
  logText: string;
  /**
   * When true the mechanic fires when the OWNER is DEFENDING.
   * Used by legacy defensive skills and the new 'on_defend' trigger family.
   * Default: false  (fires when owner attacks).
   */
  isDefensive?: boolean;
}

/** The four combat domains a skill can belong to. */
export type SkillDomain = 'striking' | 'wrestling' | 'bjj' | 'defense';

/**
 * A single attribute requirement for unlocking a skill.
 * The fighter's enhanced stats (base + skill bonuses) must meet or exceed `value`.
 */
export interface SkillRequirement {
  /** The stat key, e.g. "hook_lethality", "double_leg_explosion". */
  attribute: string;
  /** The minimum enhanced-stat value needed. */
  value: number;
}

/**
 * A single node in the skill tree.
 * `parentId` is null for root skills and the parent node's id for every
 * subsequent tier.
 */
export interface SkillNode {
  /** Unique identifier, e.g. "striking_7_boxing_hook_lethality" */
  id: string;
  name: string;
  description: string;
  domain: SkillDomain;
  type: SkillType;
  /**
   * Attribute requirements that must ALL be met (enhanced stats) to unlock this skill.
   * Empty array = no requirements (root skills).
   */
  requirements: SkillRequirement[];
  /** Id of the prerequisite skill node. Null for root skills. */
  parentId: string | null;
  /** Icon identifier used by the UI (maps to an emoji or SVG asset). */
  iconName: string;
  /** Optional flat stat boosts applied permanently when skill is unlocked. */
  statBoosts?: Partial<Record<string, number>>;
  /** Optional in-fight combat mechanic triggered probabilistically during battles. */
  mechanic?: SkillMechanic;
}

/** Aggregated domain entry used by the skill tree UI. */
export interface SkillTreeDomain {
  domain: SkillDomain;
  /** Human-readable label */
  label: string;
  skills: SkillNode[];
}

/** Slice of state that lives on the Fighter / Profile. */
export interface SkillTreeState {
  skill_points: number;
  unlocked_skills: string[];
}
