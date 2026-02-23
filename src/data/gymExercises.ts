import { DetailedFighterStats } from '../types';

export type ExerciseCategory = 'striking' | 'wrestling' | 'bjj' | 'physical';
export type ExerciseTier = 'single' | 'dual' | 'complex' | 'hybrid';

export interface GymExercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  tier: ExerciseTier;
  icon: string;
  energyCost: number;
  moneyCost: number;
  statChanges: Partial<Record<keyof DetailedFighterStats, number>>;
}

// ─── TIER: SINGLE (+4 to one stat) — 60 exercises ────────────────────────────

const SINGLE: GymExercise[] = [
  // JAB PRECISION (×2)
  { id: 's-jab-1', name: 'Jab Rhythm Drill', description: 'Double-end bag work focusing on speed and accuracy of the jab at full extension.', category: 'striking', tier: 'single', icon: '👊', energyCost: 10, moneyCost: 60, statChanges: { jab_precision: 4 } },
  { id: 's-jab-2', name: 'Mirror Jab Precision', description: 'Shadowboxing in front of a mirror, drilling snapping jab with chin tucked and shoulder raised.', category: 'striking', tier: 'single', icon: '👊', energyCost: 10, moneyCost: 50, statChanges: { jab_precision: 4 } },
  // CROSS POWER (×2)
  { id: 's-cross-1', name: 'Power Cross on Heavy Bag', description: 'Full hip rotation cross thrown in 4-count bursts against a 100lb bag anchored to the floor.', category: 'striking', tier: 'single', icon: '💥', energyCost: 12, moneyCost: 80, statChanges: { cross_power: 4 } },
  { id: 's-cross-2', name: 'Sledgehammer Cross Conditioning', description: 'Sledgehammer strikes on a tire to overload hip rotation for devastating cross power.', category: 'striking', tier: 'single', icon: '💥', energyCost: 13, moneyCost: 90, statChanges: { cross_power: 4 } },
  // HOOK LETHALITY (×2)
  { id: 's-hook-1', name: 'Body Hook Targeting', description: 'Targeting pads for liver hooks and ribcage body shots from both orthodox and southpaw stances.', category: 'striking', tier: 'single', icon: '🥊', energyCost: 11, moneyCost: 70, statChanges: { hook_lethality: 4 } },
  { id: 's-hook-2', name: 'Short Hook Wall Drill', description: 'Standing close to a wall to engrain tight short hooks without telegraphing the shoulder.', category: 'striking', tier: 'single', icon: '🥊', energyCost: 10, moneyCost: 60, statChanges: { hook_lethality: 4 } },
  // UPPERCUT TIMING (×2)
  { id: 's-upper-1', name: 'Slip & Uppercut Timing', description: 'Slipping an imaginary jab then firing a counter uppercut into rising pads — timing is everything.', category: 'striking', tier: 'single', icon: '⬆️', energyCost: 11, moneyCost: 75, statChanges: { uppercut_timing: 4 } },
  { id: 's-upper-2', name: 'Uppercut at Clinch Range', description: 'Inside-range uppercut drills from clinch position — forcing opponents to break with chins exposed.', category: 'striking', tier: 'single', icon: '⬆️', energyCost: 10, moneyCost: 65, statChanges: { uppercut_timing: 4 } },
  // LEG KICK HARDNESS (×2)
  { id: 's-legkick-1', name: 'Banana Bag Low Kick Marathon', description: '10 rounds of 50 leg kicks per round against a banana bag filled with hard foam — hardens the shin.', category: 'striking', tier: 'single', icon: '🦵', energyCost: 14, moneyCost: 100, statChanges: { leg_kick_hardness: 4 } },
  { id: 's-legkick-2', name: 'Shin Conditioning on Post', description: 'Traditional Muay Thai shin rolling on a hardwood post to build low kick bone density and impact.', category: 'striking', tier: 'single', icon: '🦵', energyCost: 12, moneyCost: 80, statChanges: { leg_kick_hardness: 4 } },
  // HIGH KICK SPEED (×2)
  { id: 's-highkick-1', name: 'Thai Roundhouse Speed Series', description: 'Parachute-assisted high roundhouse kick drill to develop explosive hip snap and chamber speed.', category: 'striking', tier: 'single', icon: '🦶', energyCost: 13, moneyCost: 85, statChanges: { high_kick_speed: 4 } },
  { id: 's-highkick-2', name: 'Taekwondo Head Kick Flexibility', description: 'Resistance band hip flexor stretching combined with snapping head kick acceleration for height and speed.', category: 'striking', tier: 'single', icon: '🦶', energyCost: 11, moneyCost: 70, statChanges: { high_kick_speed: 4 } },
  // SPINNING MASTERY (×2)
  { id: 's-spin-1', name: 'Spinning Back Kick Drill', description: 'Eye-level back kick rotation against a wall target — drilling pivot speed and heel contact accuracy.', category: 'striking', tier: 'single', icon: '🌀', energyCost: 12, moneyCost: 80, statChanges: { spinning_mastery: 4 } },
  { id: 's-spin-2', name: 'Spinning Elbow Pattern Work', description: '360-spinning elbow drill with footwork — developing balance before, during and after the rotation.', category: 'striking', tier: 'single', icon: '🌀', energyCost: 11, moneyCost: 75, statChanges: { spinning_mastery: 4 } },
  // ELBOW SHARPNESS (×2)
  { id: 's-elbow-1', name: 'Thai Clinch Elbow Slicers', description: 'Muay Thai diagonal and horizontal elbows inside the clinch — working full extension and sharp descent.', category: 'striking', tier: 'single', icon: '⚡', energyCost: 11, moneyCost: 65, statChanges: { elbow_sharpness: 4 } },
  { id: 's-elbow-2', name: 'Pad Work Elbow Sequences', description: 'Coach-held pad sequences combining horizontal, upward and spinning elbows in rapid succession.', category: 'striking', tier: 'single', icon: '⚡', energyCost: 12, moneyCost: 80, statChanges: { elbow_sharpness: 4 } },
  // KNEE IMPACT (×2)
  { id: 's-knee-1', name: 'Clinch Knee to Body', description: 'Partner-clinch knee strikes targeting padded midsection — drilling knee thrust with hip drive.', category: 'striking', tier: 'single', icon: '🦴', energyCost: 12, moneyCost: 75, statChanges: { knee_impact: 4 } },
  { id: 's-knee-2', name: 'Flying Knee Landing Drill', description: 'Running start to a flying knee from southpaw and orthodox — building commitment and landing power.', category: 'striking', tier: 'single', icon: '🦴', energyCost: 13, moneyCost: 90, statChanges: { knee_impact: 4 } },
  // COMBINATION FLOW (×2)
  { id: 's-combo-1', name: 'Rory MacDonald Three-Punch Flow', description: '1-2-3 combo repeated 200× at medium intensity — building automatic hand speed and rhythm.', category: 'striking', tier: 'single', icon: '🔥', energyCost: 13, moneyCost: 85, statChanges: { combination_flow: 4 } },
  { id: 's-combo-2', name: 'Chain Strike Ghost Sparring', description: 'Solo 10-minute round flowing from one combination into the next without stopping — offensive momentum.', category: 'striking', tier: 'single', icon: '🔥', energyCost: 12, moneyCost: 80, statChanges: { combination_flow: 4 } },

  // DOUBLE LEG EXPLOSION (×2)
  { id: 's-dleg-1', name: 'Level-Change Explosive Shots', description: 'Hip explosion double-leg penetration step drill — changing levels and driving through a hanging bag.', category: 'wrestling', tier: 'single', icon: '💨', energyCost: 14, moneyCost: 100, statChanges: { double_leg_explosion: 4 } },
  { id: 's-dleg-2', name: 'Resisted Double-Leg Band Drill', description: 'Resistance band around waist forcing explosive extension on every shot — builds drive power.', category: 'wrestling', tier: 'single', icon: '💨', energyCost: 13, moneyCost: 90, statChanges: { double_leg_explosion: 4 } },
  // SINGLE LEG GRIT (×2)
  { id: 's-sleg-1', name: 'Running Man Single-Leg', description: 'Capturing a single leg and driving until the opponent (dummy) is moved 5 metres across the mat.', category: 'wrestling', tier: 'single', icon: '🦿', energyCost: 13, moneyCost: 85, statChanges: { single_leg_grit: 4 } },
  { id: 's-sleg-2', name: 'Back Arch Single-Leg Finish', description: 'High crotch to back arch finish — drilling the inside trip finish when opponent defends.', category: 'wrestling', tier: 'single', icon: '🦿', energyCost: 12, moneyCost: 75, statChanges: { single_leg_grit: 4 } },
  // SPRAWL TECHNIQUE (×2)
  { id: 's-sprawl-1', name: 'Sprawl & Re-Launch Reaction', description: 'Partner shoots — you sprawl, disengage, and immediately return to guard stance. 50 reps.', category: 'wrestling', tier: 'single', icon: '🛡️', energyCost: 12, moneyCost: 80, statChanges: { sprawl_technique: 4 } },
  { id: 's-sprawl-2', name: 'Whizzer Sprawl Series', description: 'Overhook whizzer combined with hip sprawl to flatten opponent — blocking the finish after sprawl.', category: 'wrestling', tier: 'single', icon: '🛡️', energyCost: 13, moneyCost: 90, statChanges: { sprawl_technique: 4 } },
  // CLINCH CONTROL (×2)
  { id: 's-clinch-1', name: 'Muay Thai Plum Position', description: 'Double collar tie drilling — pulling head down while redirecting opponent for knee openings.', category: 'wrestling', tier: 'single', icon: '🤝', energyCost: 11, moneyCost: 70, statChanges: { clinch_control: 4 } },
  { id: 's-clinch-2', name: 'Body Lock Clinch Dominance', description: 'Underhook battle to body lock — isolating opponent arms to establish full body lock position.', category: 'wrestling', tier: 'single', icon: '🤝', energyCost: 12, moneyCost: 80, statChanges: { clinch_control: 4 } },
  // JUDO TRIPS (×2)
  { id: 's-judo-1', name: 'Osoto Gari Hip Throw Entry', description: 'Judo outer reap practiced 100× against a crash mat — drilling entry, kuzushi and hip contact.', category: 'wrestling', tier: 'single', icon: '🥋', energyCost: 13, moneyCost: 90, statChanges: { judo_trips: 4 } },
  { id: 's-judo-2', name: 'Uchi Mata Transition Drill', description: 'Inner thigh trip combined with hip rotation — drilling both throw and the post-throw transition to top.', category: 'wrestling', tier: 'single', icon: '🥋', energyCost: 12, moneyCost: 80, statChanges: { judo_trips: 4 } },
  // GNP PRESSURE (×2)
  { id: 's-gnp-1', name: 'Ground and Pound Burst Drill', description: 'Mount position — 10-second all-out GnP bursts alternating punches and elbows on a dummy.', category: 'wrestling', tier: 'single', icon: '⬇️', energyCost: 14, moneyCost: 100, statChanges: { gnp_pressure: 4 } },
  { id: 's-gnp-2', name: 'Half-Guard Hammerfist Series', description: 'Half guard top position — short horizontal punches and hammerfists targeting head and ribcage gaps.', category: 'wrestling', tier: 'single', icon: '⬇️', energyCost: 13, moneyCost: 90, statChanges: { gnp_pressure: 4 } },
  // TOP CONTROL WEIGHT (×2)
  { id: 's-top-1', name: 'Side Control Pressure Holds', description: 'Chest-to-chest cross facing side control — practicing full dead weight pressure without hands.', category: 'wrestling', tier: 'single', icon: '⚖️', energyCost: 12, moneyCost: 75, statChanges: { top_control_weight: 4 } },
  { id: 's-top-2', name: 'Knee-On-Belly Transitions', description: 'Knee-on-belly positional control with full switchbacks — crushing weight redistribution to block escapes.', category: 'wrestling', tier: 'single', icon: '⚖️', energyCost: 12, moneyCost: 80, statChanges: { top_control_weight: 4 } },
  // SCRAMBLE ABILITY (×2)
  { id: 's-scram-1', name: 'Live Sit-Out Scramble Drill', description: 'Referee position — partner attacks, you perform sit-out, granby roll, or standup in 3-second windows.', category: 'wrestling', tier: 'single', icon: '🔀', energyCost: 14, moneyCost: 100, statChanges: { scramble_ability: 4 } },
  { id: 's-scram-2', name: 'Turtle Escape Intensive', description: '20 reps of being broken down from turtle and escaping before flat — building quick inversion instinct.', category: 'wrestling', tier: 'single', icon: '🔀', energyCost: 13, moneyCost: 85, statChanges: { scramble_ability: 4 } },

  // CHOKE MASTERY (×2)
  { id: 's-choke-1', name: '10-Finger Guillotine Mechanics', description: 'Proper 10-finger guillotine setup — head position, elbow flare, and squeeze mechanics against a dummy.', category: 'bjj', tier: 'single', icon: '🔒', energyCost: 12, moneyCost: 80, statChanges: { choke_mastery: 4 } },
  { id: 's-choke-2', name: 'Rear Naked Choke Tightener', description: 'RNC finishing drill — drilling the hand position, chin trap and body triangle to seal the submission.', category: 'bjj', tier: 'single', icon: '🔒', energyCost: 11, moneyCost: 70, statChanges: { choke_mastery: 4 } },
  // JOINT LOCK TECHNIQUE (×2)
  { id: 's-joint-1', name: 'Kimura Figure-4 Mechanics', description: 'Solo kimura lock isometric drilling — elbow position, shoulder rotation and fulcrum point precision.', category: 'bjj', tier: 'single', icon: '💀', energyCost: 11, moneyCost: 70, statChanges: { joint_lock_technique: 4 } },
  { id: 's-joint-2', name: 'Armbar Extension Mechanics', description: 'Armbar from guard — hip-out, arm isolation, opponent hand control and synchronized hip extension.', category: 'bjj', tier: 'single', icon: '💀', energyCost: 12, moneyCost: 80, statChanges: { joint_lock_technique: 4 } },
  // SUBMISSION DEFENSE (×2)
  { id: 's-subdef-1', name: 'Tap-or-Defend Protocol Drilling', description: 'Partner applies chokes at 60% — you drill proper hand fighting, tuck defenses and frame creation.', category: 'bjj', tier: 'single', icon: '🛡️', energyCost: 12, moneyCost: 80, statChanges: { submission_defense: 4 } },
  { id: 's-subdef-2', name: 'Non-Tap Squeeze Conditioning', description: 'Resistance isometrics: attempt to survive partner\'s armbar hold for 10 seconds — builds tap resistance.', category: 'bjj', tier: 'single', icon: '🛡️', energyCost: 13, moneyCost: 90, statChanges: { submission_defense: 4 } },
  // GUARD GAME (×2)
  { id: 's-guard-1', name: 'De La Riva Transitions', description: 'De La Riva hook drilling — switching to reverse De La Riva, X-guard and berimbolo entries.', category: 'bjj', tier: 'single', icon: '🕸️', energyCost: 12, moneyCost: 80, statChanges: { guard_game: 4 } },
  { id: 's-guard-2', name: 'Spider Guard Lasso Retention', description: 'Lasso guard retention against a passing partner — feet on biceps, lasso hook and hip movement.', category: 'bjj', tier: 'single', icon: '🕸️', energyCost: 11, moneyCost: 70, statChanges: { guard_game: 4 } },
  // SWEEP TECHNIQUE (×2)
  { id: 's-sweep-1', name: 'Scissor Sweep Chain', description: 'Scissor sweep into butterfly sweep into overhead sweep chain — drilling sweep combinations from closed guard.', category: 'bjj', tier: 'single', icon: '↩️', energyCost: 12, moneyCost: 80, statChanges: { sweep_technique: 4 } },
  { id: 's-sweep-2', name: 'X-Guard Elevate and Finish', description: 'X-guard position — sweeping to top with standing finish — drilling control before, during and after sweep.', category: 'bjj', tier: 'single', icon: '↩️', energyCost: 13, moneyCost: 90, statChanges: { sweep_technique: 4 } },
  // SUBMISSION CHAIN (×2)
  { id: 's-chain-1', name: 'Triangle-Armbar-Omoplata Flow', description: 'Classic submission chain from closed guard — smoothly pivoting between three submissions as partner defends.', category: 'bjj', tier: 'single', icon: '⛓️', energyCost: 13, moneyCost: 90, statChanges: { submission_chain: 4 } },
  { id: 's-chain-2', name: 'Heel Hook Entry Chain', description: 'Outside heel hook to inside heel hook to kneebar transition — leg lock entanglement chain from 50/50.', category: 'bjj', tier: 'single', icon: '⛓️', energyCost: 14, moneyCost: 100, statChanges: { submission_chain: 4 } },

  // CARDIO (×2)
  { id: 's-cardio-1', name: 'Sprawl & Brawl Conditioning', description: '5 rounds of 3 minutes: 1 min striking, 1 min sprawl reps, 1 min striking — simulates round pacing.', category: 'physical', tier: 'single', icon: '❤️', energyCost: 15, moneyCost: 110, statChanges: { cardio: 4 } },
  { id: 's-cardio-2', name: 'Zone 2 Road Run', description: '45-minute aerobic road run at 65% max HR — building the aerobic base for late-round performance.', category: 'physical', tier: 'single', icon: '❤️', energyCost: 14, moneyCost: 60, statChanges: { cardio: 4 } },
  // CHIN DURABILITY (×2)
  { id: 's-chin-1', name: 'Neck Bridge Isometrics', description: 'Wrestler bridge and neck isometrics to build neck muscle — absorbs shock before it reaches the brain.', category: 'physical', tier: 'single', icon: '🪨', energyCost: 12, moneyCost: 70, statChanges: { chin_durability: 4 } },
  { id: 's-chin-2', name: 'Harness Neck Resistance Training', description: 'Plate-loaded neck harness: front raises, side flexion — thickening all four planes of neck movement.', category: 'physical', tier: 'single', icon: '🪨', energyCost: 13, moneyCost: 90, statChanges: { chin_durability: 4 } },
  // FIGHT IQ (×2)
  { id: 's-iq-1', name: 'Film Study — Pattern Recognition', description: 'Watch 3 hours of opponent footage with a coach — identifying tendencies, setups and openings.', category: 'physical', tier: 'single', icon: '🧠', energyCost: 10, moneyCost: 50, statChanges: { fight_iq: 4 } },
  { id: 's-iq-2', name: 'Chess-Board Fight Simulation', description: 'Positional sparring with coach calling out pre-defined scenarios to drill game plans under pressure.', category: 'physical', tier: 'single', icon: '🧠', energyCost: 11, moneyCost: 75, statChanges: { fight_iq: 4 } },
  // EXPLOSIVE BURST (×2)
  { id: 's-burst-1', name: 'Banded Resisted Plyometrics', description: 'Resistance band squat jumps, lateral bounds and 10-yard sprint bursts — recruiting fast-twitch fibres.', category: 'physical', tier: 'single', icon: '💢', energyCost: 14, moneyCost: 100, statChanges: { explosive_burst: 4 } },
  { id: 's-burst-2', name: 'Contrast Method Lifting', description: 'Pairing heavy deadlift with immediate box jump — post-activation potentiation for peak power output.', category: 'physical', tier: 'single', icon: '💢', energyCost: 15, moneyCost: 120, statChanges: { explosive_burst: 4 } },
  // RECOVERY RATE (×2)
  { id: 's-recov-1', name: 'Cold Water Immersion Protocol', description: '15-minute ice bath at 10°C post-training — reducing inflammation and accelerating muscle repair.', category: 'physical', tier: 'single', icon: '🔋', energyCost: 10, moneyCost: 90, statChanges: { recovery_rate: 4 } },
  { id: 's-recov-2', name: 'Yoga Mobility & Breathwork', description: 'Deep tissue yoga combined with Wim Hof breathing — promoting parasympathetic recovery dominance.', category: 'physical', tier: 'single', icon: '🔋', energyCost: 10, moneyCost: 60, statChanges: { recovery_rate: 4 } },
  // MENTAL HEART (×2)
  { id: 's-heart-1', name: 'Adversity Pressure Sparring', description: 'Sparring where you are placed in losing positions intentionally — forging the will to keep fighting.', category: 'physical', tier: 'single', icon: '💜', energyCost: 15, moneyCost: 110, statChanges: { mental_heart: 4 } },
  { id: 's-heart-2', name: 'Meditation & Visualization', description: '30-minute fight-night visualization — fully rehearsing a winning performance in vivid mental detail.', category: 'physical', tier: 'single', icon: '💜', energyCost: 10, moneyCost: 40, statChanges: { mental_heart: 4 } },
];

// ─── TIER: DUAL (+2 to two stats) — 45 exercises ─────────────────────────────

const DUAL: GymExercise[] = [
  // STRIKING combos
  { id: 'd-str-1', name: 'Southpaw Jab-Cross Power Series', description: 'Drilling the 1-2 combo with focus on snapping the jab and loading the cross simultaneously.', category: 'striking', tier: 'dual', icon: '🥊', energyCost: 15, moneyCost: 160, statChanges: { jab_precision: 2, cross_power: 2 } },
  { id: 'd-str-2', name: 'Hook Body-Hook Head Pairing', description: 'Low hook to liver followed immediately by high hook to temple — doubling up the hook from both levels.', category: 'striking', tier: 'dual', icon: '🔥', energyCost: 16, moneyCost: 170, statChanges: { hook_lethality: 2, combination_flow: 2 } },
  { id: 'd-str-3', name: 'Uppercut Slip Counter', description: 'Slipping a jab and simultaneously firing an uppercut — building timing and power in the same drill.', category: 'striking', tier: 'dual', icon: '⬆️', energyCost: 15, moneyCost: 155, statChanges: { uppercut_timing: 2, jab_precision: 2 } },
  { id: 'd-str-4', name: 'Muay Thai Leg Kick Switch', description: 'Switch stance and deliver a leg kick — drilling the surprise step plus shin hardness from the off-side.', category: 'striking', tier: 'dual', icon: '🦵', energyCost: 16, moneyCost: 175, statChanges: { leg_kick_hardness: 2, high_kick_speed: 2 } },
  { id: 'd-str-5', name: 'Jump Spinning Heel Precision', description: 'Jump spin plus heel kick snapping to a target at head height — speed and accuracy together.', category: 'striking', tier: 'dual', icon: '🌀', energyCost: 17, moneyCost: 190, statChanges: { spinning_mastery: 2, high_kick_speed: 2 } },
  { id: 'd-str-6', name: 'Elbow-Knee Clinch Sequence', description: 'Inside the clinch — horizontal elbow then driving knee — classic Muay Thai close-range pairing.', category: 'striking', tier: 'dual', icon: '⚡', energyCost: 16, moneyCost: 180, statChanges: { elbow_sharpness: 2, knee_impact: 2 } },
  { id: 'd-str-7', name: 'Combination Entry Drill', description: 'Opening a combination with a jab feint then launching a 5-punch sequence — flow and entry together.', category: 'striking', tier: 'dual', icon: '👊', energyCost: 16, moneyCost: 170, statChanges: { combination_flow: 2, jab_precision: 2 } },
  { id: 'd-str-8', name: 'Power Cross + Liver Hook', description: 'Two-punch power drill: right cross to the head, pivot and left hook to the body without resetting.', category: 'striking', tier: 'dual', icon: '💥', energyCost: 17, moneyCost: 185, statChanges: { cross_power: 2, hook_lethality: 2 } },
  { id: 'd-str-9', name: 'Head Kick Combination Exit', description: 'End every combination with a high kick — learning to finish combinations at range before restarting.', category: 'striking', tier: 'dual', icon: '🦶', energyCost: 17, moneyCost: 190, statChanges: { high_kick_speed: 2, combination_flow: 2 } },
  { id: 'd-str-10', name: 'Spinning Elbow Off The Jab', description: 'Jab to create reaction, pivot, spinning elbow — drilling deceptive entry into the spinning technique.', category: 'striking', tier: 'dual', icon: '🌀', energyCost: 16, moneyCost: 180, statChanges: { spinning_mastery: 2, elbow_sharpness: 2 } },

  // WRESTLING combos
  { id: 'd-wr-1', name: 'Blast Double with GnP Finish', description: 'Explosive double leg followed immediately by mount GnP — chaining the takedown to dominant position work.', category: 'wrestling', tier: 'dual', icon: '💨', energyCost: 18, moneyCost: 200, statChanges: { double_leg_explosion: 2, gnp_pressure: 2 } },
  { id: 'd-wr-2', name: 'High Crotch to Mat Return', description: 'Single leg high crotch to mat return — finishing the shot and immediately claiming top control.', category: 'wrestling', tier: 'dual', icon: '🦿', energyCost: 17, moneyCost: 190, statChanges: { single_leg_grit: 2, top_control_weight: 2 } },
  { id: 'd-wr-3', name: 'Sprawl-and-Brawl Live Drill', description: 'Defend the shot with a full sprawl, immediately fire clinch knees — combining TD defense with offense.', category: 'wrestling', tier: 'dual', icon: '🛡️', energyCost: 18, moneyCost: 200, statChanges: { sprawl_technique: 2, clinch_control: 2 } },
  { id: 'd-wr-4', name: 'Judo Throw to Top Position', description: 'Seoi nage throw immediately landing in uke\'s mount — drilling throw-to-position fluid transition.', category: 'wrestling', tier: 'dual', icon: '🥋', energyCost: 17, moneyCost: 195, statChanges: { judo_trips: 2, top_control_weight: 2 } },
  { id: 'd-wr-5', name: 'Scramble to Top Gate Drill', description: 'From referee position — attack-swap, scramble and whoever ends on top immediately posts before reset.', category: 'wrestling', tier: 'dual', icon: '🔀', energyCost: 18, moneyCost: 205, statChanges: { scramble_ability: 2, top_control_weight: 2 } },
  { id: 'd-wr-6', name: 'Clinch Knee to Takedown', description: 'Body clinch knees to opponent posturing up — capturing the single leg entry mid-clinch.', category: 'wrestling', tier: 'dual', icon: '🤝', energyCost: 17, moneyCost: 185, statChanges: { clinch_control: 2, single_leg_grit: 2 } },
  { id: 'd-wr-7', name: 'Double Leg Off The Jab Feint', description: 'Jab to make opponent react high, level change into double leg — striking feint into wrestling entry.', category: 'wrestling', tier: 'dual', icon: '💨', energyCost: 17, moneyCost: 190, statChanges: { double_leg_explosion: 2, scramble_ability: 2 } },
  { id: 'd-wr-8', name: 'GnP Pressure Switching Drill', description: 'Mount GnP then side control to mount transition while maintaining constant pressure — position plus damage.', category: 'wrestling', tier: 'dual', icon: '⬇️', energyCost: 18, moneyCost: 200, statChanges: { gnp_pressure: 2, top_control_weight: 2 } },

  // BJJ combos
  { id: 'd-bjj-1', name: 'RNC Setup from Body Triangle', description: 'Body triangle squeeze to force a reaction, then sneak the RNC arm under the chin — choke chain.', category: 'bjj', tier: 'dual', icon: '🔒', energyCost: 16, moneyCost: 180, statChanges: { choke_mastery: 2, submission_chain: 2 } },
  { id: 'd-bjj-2', name: 'Armbar to Wristlock Flow', description: 'Standard armbar overhook — if they stack, pivot to wristlock — drilling two submissions off one entry.', category: 'bjj', tier: 'dual', icon: '💀', energyCost: 15, moneyCost: 170, statChanges: { joint_lock_technique: 2, submission_chain: 2 } },
  { id: 'd-bjj-3', name: 'Guard Retention + Sub Defense', description: 'Partner attempts to pass — you retain guard and simultaneously defend a choke attempt each rep.', category: 'bjj', tier: 'dual', icon: '🛡️', energyCost: 16, moneyCost: 175, statChanges: { guard_game: 2, submission_defense: 2 } },
  { id: 'd-bjj-4', name: 'Scissor Sweep to Kimura', description: 'Scissor sweep — if they posture, catch the kimura grip immediately — offense from the sweep.', category: 'bjj', tier: 'dual', icon: '↩️', energyCost: 16, moneyCost: 180, statChanges: { sweep_technique: 2, joint_lock_technique: 2 } },
  { id: 'd-bjj-5', name: 'Triangle Choke Mechanics', description: 'Closed guard arm isolation to triangle set up — lock it tight and drill the hip angle adjustment to finish.', category: 'bjj', tier: 'dual', icon: '🔒', energyCost: 16, moneyCost: 180, statChanges: { choke_mastery: 2, guard_game: 2 } },
  { id: 'd-bjj-6', name: 'Heel Hook Body Reading', description: 'Entering heel hook from outside 50/50 — learning to read the hip direction to finish safely in training.', category: 'bjj', tier: 'dual', icon: '⛓️', energyCost: 17, moneyCost: 195, statChanges: { joint_lock_technique: 2, submission_defense: 2 } },
  { id: 'd-bjj-7', name: 'Butterfly Sweep Grip Fighting', description: 'Butterfly guard — fighting for the underhook grip before committing to the sweep — timing and control.', category: 'bjj', tier: 'dual', icon: '↩️', energyCost: 16, moneyCost: 175, statChanges: { sweep_technique: 2, guard_game: 2 } },

  // PHYSICAL combos
  { id: 'd-ph-1', name: 'Hill Sprint Intervals', description: '10 x 40m uphill sprints at 90% — simultaneously building explosiveness and VO2 max capacity.', category: 'physical', tier: 'dual', icon: '💢', energyCost: 18, moneyCost: 190, statChanges: { explosive_burst: 2, cardio: 2 } },
  { id: 'd-ph-2', name: 'Neck & Jaw Resistance Circuit', description: 'Neck harness work plus jaw isometrics — building the full shock absorber system from neck to chin.', category: 'physical', tier: 'dual', icon: '🪨', energyCost: 14, moneyCost: 130, statChanges: { chin_durability: 2, recovery_rate: 2 } },
  { id: 'd-ph-3', name: 'Pressure Sparring IQ Rounds', description: 'Sparring with a specific game plan — learning when to engage, disengage and set traps under pressure.', category: 'physical', tier: 'dual', icon: '🧠', energyCost: 18, moneyCost: 200, statChanges: { fight_iq: 2, mental_heart: 2 } },
  { id: 'd-ph-4', name: 'Kettlebell Complex Circuit', description: '5 kettlebell movements back-to-back without rest — full-body conditioning and grip strength.', category: 'physical', tier: 'dual', icon: '🔥', energyCost: 17, moneyCost: 180, statChanges: { cardio: 2, explosive_burst: 2 } },
  { id: 'd-ph-5', name: 'Sauna Recovery Adaptation', description: 'Post-training sauna 20 min at 80°C — raises heat shock proteins and growth hormone for faster recovery.', category: 'physical', tier: 'dual', icon: '🔋', energyCost: 12, moneyCost: 110, statChanges: { recovery_rate: 2, chin_durability: 2 } },
  { id: 'd-ph-6', name: 'Combat Mindset Coaching Session', description: 'One-on-one sports psychology session — building resilience frameworks for adversity mid-fight.', category: 'physical', tier: 'dual', icon: '💜', energyCost: 13, moneyCost: 200, statChanges: { mental_heart: 2, fight_iq: 2 } },
  { id: 'd-ph-7', name: 'Loaded Carry Farmer Walk', description: 'Heavy kettlebell farmer carries 20m lengths — building grip, core anti-rotation and explosive step.', category: 'physical', tier: 'dual', icon: '💢', energyCost: 15, moneyCost: 140, statChanges: { explosive_burst: 2, chin_durability: 2 } },
  { id: 'd-ph-8', name: 'Altitude Training Mask HIIT', description: 'HIIT on treadmill wearing altitude restriction mask — simulating high-altitude cardio adaptation.', category: 'physical', tier: 'dual', icon: '❤️', energyCost: 18, moneyCost: 210, statChanges: { cardio: 2, recovery_rate: 2 } },
  { id: 'd-ph-9', name: 'Visualization Competition Dry Run', description: 'Full fight visualization with heart rate monitor and coach — rehearsing adversity and decision moments.', category: 'physical', tier: 'dual', icon: '🧠', energyCost: 12, moneyCost: 130, statChanges: { fight_iq: 2, mental_heart: 2 } },
  { id: 'd-ph-10', name: 'EMS Muscle Recovery Session', description: 'Electrical muscle stimulation on key muscle groups post-training — accelerating waste product removal.', category: 'physical', tier: 'dual', icon: '🔋', energyCost: 10, moneyCost: 220, statChanges: { recovery_rate: 2, explosive_burst: 2 } },
];

// ─── TIER: COMPLEX (+2×3 stats, +1×1 stat) — 30 exercises ───────────────────

const COMPLEX: GymExercise[] = [
  // STRIKING CAMPS
  { id: 'c-str-1', name: 'Full Muay Thai Striking Camp', description: '3-day Muay Thai intensive — stand-up, clinch, elbows, knees. All four limbs as weapons.', category: 'striking', tier: 'complex', icon: '🔥', energyCost: 22, moneyCost: 300, statChanges: { combination_flow: 2, elbow_sharpness: 2, knee_impact: 2, high_kick_speed: 1 } },
  { id: 'c-str-2', name: 'Precision Boxing Intensive', description: '2-day boxing camp — jab mechanics, cross power and combination transitions with elite boxing coach.', category: 'striking', tier: 'complex', icon: '🥊', energyCost: 21, moneyCost: 280, statChanges: { jab_precision: 2, cross_power: 2, uppercut_timing: 2, hook_lethality: 1 } },
  { id: 'c-str-3', name: 'Spinning Techniques Seminar', description: 'Half-day spinning attack seminar — back kick, spinning heel, spinning elbow mechanics with video analysis.', category: 'striking', tier: 'complex', icon: '🌀', energyCost: 20, moneyCost: 270, statChanges: { spinning_mastery: 2, elbow_sharpness: 2, high_kick_speed: 2, combination_flow: 1 } },
  { id: 'c-str-4', name: 'Low Line Leg Attack System', description: 'Structured leg kick clinic — inside, outside, front and calf kicks plus counter combinations.', category: 'striking', tier: 'complex', icon: '🦵', energyCost: 21, moneyCost: 290, statChanges: { leg_kick_hardness: 2, combination_flow: 2, high_kick_speed: 2, jab_precision: 1 } },
  { id: 'c-str-5', name: 'Elite Pad Work Session', description: 'Full elite-level pad session — 12 rounds covering every striking technique with a professional Thai training.', category: 'striking', tier: 'complex', icon: '👊', energyCost: 23, moneyCost: 350, statChanges: { combination_flow: 2, cross_power: 2, hook_lethality: 2, knee_impact: 1 } },
  { id: 'c-str-6', name: 'Inside Fighting Mastery', description: 'Close-range striking session — elbows, uppercuts and short hooks when clinched at body-lock range.', category: 'striking', tier: 'complex', icon: '⚡', energyCost: 21, moneyCost: 280, statChanges: { elbow_sharpness: 2, uppercut_timing: 2, knee_impact: 2, combination_flow: 1 } },
  { id: 'c-str-7', name: 'Counter Striking System', description: 'Pure counter fighting — slipping, rolling, parrying and immediately firing back with the correct weapon.', category: 'striking', tier: 'complex', icon: '💥', energyCost: 22, moneyCost: 310, statChanges: { jab_precision: 2, hook_lethality: 2, uppercut_timing: 2, cross_power: 1 } },
  { id: 'c-str-8', name: 'Head Movement Attack Camp', description: 'Integrated head movement and counter — drilling the attack off every defensive movement.', category: 'striking', tier: 'complex', icon: '🦶', energyCost: 22, moneyCost: 300, statChanges: { combination_flow: 2, jab_precision: 2, spinning_mastery: 2, uppercut_timing: 1 } },

  // WRESTLING CAMPS
  { id: 'c-wr-1', name: 'Wrestling Intensive Camp', description: '2-day intensive with a Division I wrestling coach — live takedown rounds plus mat return sequences.', category: 'wrestling', tier: 'complex', icon: '💨', energyCost: 23, moneyCost: 350, statChanges: { double_leg_explosion: 2, single_leg_grit: 2, sprawl_technique: 2, scramble_ability: 1 } },
  { id: 'c-wr-2', name: 'Top Pressure MMA Grappling', description: 'Full MMA grappling session focusing on top control — transitions, GnP mechanics and positional dominance.', category: 'wrestling', tier: 'complex', icon: '⬇️', energyCost: 22, moneyCost: 330, statChanges: { top_control_weight: 2, gnp_pressure: 2, clinch_control: 2, scramble_ability: 1 } },
  { id: 'c-wr-3', name: 'Freestyle Wrestling System', description: 'Freestyle wrestling focused on reaction — defending shots, counter shots and leg lace entries.', category: 'wrestling', tier: 'complex', icon: '🔀', energyCost: 22, moneyCost: 320, statChanges: { scramble_ability: 2, double_leg_explosion: 2, sprawl_technique: 2, single_leg_grit: 1 } },
  { id: 'c-wr-4', name: 'Judo for MMA Clinic', description: 'Judo throws adapted for MMA rules — uchi mata, osoto gari, harai goshi and follow-through to top position.', category: 'wrestling', tier: 'complex', icon: '🥋', energyCost: 21, moneyCost: 300, statChanges: { judo_trips: 2, clinch_control: 2, top_control_weight: 2, gnp_pressure: 1 } },
  { id: 'c-wr-5', name: 'Clinch MMA Control Workshop', description: 'Full half-day clinch control workshop — Muay Thai plum, body lock, underhook battle and takedown entries.', category: 'wrestling', tier: 'complex', icon: '🤝', energyCost: 21, moneyCost: 290, statChanges: { clinch_control: 2, judo_trips: 2, gnp_pressure: 2, top_control_weight: 1 } },
  { id: 'c-wr-6', name: 'Catch Wrestling Fundamentals', description: 'Catch wrestling system — pins, gut wrenches, cradles and turning opponents to their back.', category: 'wrestling', tier: 'complex', icon: '⚖️', energyCost: 22, moneyCost: 310, statChanges: { top_control_weight: 2, scramble_ability: 2, single_leg_grit: 2, double_leg_explosion: 1 } },
  { id: 'c-wr-7', name: 'Defensive Wrestling Marathon', description: 'Full session of defending shots from multiple styles — freestyle, folkstyle and GnP defense from bad positions.', category: 'wrestling', tier: 'complex', icon: '🛡️', energyCost: 22, moneyCost: 310, statChanges: { sprawl_technique: 2, scramble_ability: 2, clinch_control: 2, judo_trips: 1 } },

  // BJJ CAMPS
  { id: 'c-bjj-1', name: 'Leg Lock Systemization Camp', description: '3-day leg lock camp with a submission grappling specialist — entries, finishes and defensive protocols.', category: 'bjj', tier: 'complex', icon: '⛓️', energyCost: 22, moneyCost: 340, statChanges: { joint_lock_technique: 2, submission_chain: 2, submission_defense: 2, guard_game: 1 } },
  { id: 'c-bjj-2', name: 'Guard Mastery System', description: 'Full closed guard system — sweeps, submissions, back takes and guard retention against advanced passers.', category: 'bjj', tier: 'complex', icon: '🕸️', energyCost: 21, moneyCost: 310, statChanges: { guard_game: 2, sweep_technique: 2, choke_mastery: 2, submission_chain: 1 } },
  { id: 'c-bjj-3', name: 'Back Control Mastery', description: 'Back take entries, body triangle mechanics and RNC variations — the most dominant position in BJJ/MMA.', category: 'bjj', tier: 'complex', icon: '🔒', energyCost: 22, moneyCost: 330, statChanges: { choke_mastery: 2, joint_lock_technique: 2, submission_chain: 2, sweep_technique: 1 } },
  { id: 'c-bjj-4', name: 'Submission Defense Workshop', description: 'Surviving elite submission attacks — guillotines, rear nakeds, armbars, triangles and heel hooks.', category: 'bjj', tier: 'complex', icon: '🛡️', energyCost: 21, moneyCost: 300, statChanges: { submission_defense: 2, guard_game: 2, sweep_technique: 2, choke_mastery: 1 } },
  { id: 'c-bjj-5', name: 'Upper Body Submission Chain', description: 'Drilling the full arm triangle — kimura — armbar — omoplata chain until transitions feel automatic.', category: 'bjj', tier: 'complex', icon: '💀', energyCost: 21, moneyCost: 290, statChanges: { submission_chain: 2, joint_lock_technique: 2, choke_mastery: 2, guard_game: 1 } },
  { id: 'c-bjj-6', name: 'Open Guard Attack System', description: 'Full open guard attacking system — spider, lasso, De La Riva, X-guard into sweeps and subs.', category: 'bjj', tier: 'complex', icon: '↩️', energyCost: 21, moneyCost: 295, statChanges: { guard_game: 2, sweep_technique: 2, submission_chain: 2, joint_lock_technique: 1 } },
  { id: 'c-bjj-7', name: 'Competition BJJ Preparation', description: 'Full BJJ competition prep session — live rolling with a focus on points, advantages and match strategy.', category: 'bjj', tier: 'complex', icon: '🏆', energyCost: 23, moneyCost: 360, statChanges: { submission_chain: 2, guard_game: 2, sweep_technique: 2, submission_defense: 1 } },

  // PHYSICAL CAMPS
  { id: 'c-ph-1', name: 'S&C Full Periodization Camp', description: '4-day strength and conditioning camp — maximal strength, power and energy systems in sport-specific order.', category: 'physical', tier: 'complex', icon: '💢', energyCost: 25, moneyCost: 400, statChanges: { explosive_burst: 2, cardio: 2, recovery_rate: 2, chin_durability: 1 } },
  { id: 'c-ph-2', name: 'Fight Camp Mental Fortitude', description: 'High adversity training camp replicating fight camp pressure — building mental toughness and IQ under fatigue.', category: 'physical', tier: 'complex', icon: '💜', energyCost: 24, moneyCost: 380, statChanges: { mental_heart: 2, fight_iq: 2, cardio: 2, recovery_rate: 1 } },
  { id: 'c-ph-3', name: 'Olympic Lifting Power Camp', description: 'Snatch and clean & jerk coaching with an Olympic coach — complete neuromuscular power development.', category: 'physical', tier: 'complex', icon: '🔥', energyCost: 24, moneyCost: 390, statChanges: { explosive_burst: 2, cardio: 2, chin_durability: 2, recovery_rate: 1 } },
  { id: 'c-ph-4', name: 'Full Body Resilience Camp', description: 'Anti-fragility camp — chin conditioning, neck work, mindset coaching and recovery protocol in sequence.', category: 'physical', tier: 'complex', icon: '🪨', energyCost: 23, moneyCost: 360, statChanges: { chin_durability: 2, recovery_rate: 2, mental_heart: 2, fight_iq: 1 } },
  { id: 'c-ph-5', name: 'Combat IQ Strategic Seminar', description: '2-day seminar with an elite fight coach — studying elite game plans, transitions and fight math.', category: 'physical', tier: 'complex', icon: '🧠', energyCost: 20, moneyCost: 320, statChanges: { fight_iq: 2, mental_heart: 2, cardio: 2, explosive_burst: 1 } },
  { id: 'c-ph-6', name: 'Altitude High Performance Training', description: 'Full week altitude training camp at 2400m — maximizing aerobic base, mental resilience and recovery.', category: 'physical', tier: 'complex', icon: '❤️', energyCost: 25, moneyCost: 500, statChanges: { cardio: 2, recovery_rate: 2, mental_heart: 2, explosive_burst: 1 } },
  { id: 'c-ph-7', name: 'Full Body Power Activation', description: 'Plyometric complex, med ball throws, resisted sprint work and sport adaptation — pure athleticism.', category: 'physical', tier: 'complex', icon: '💢', energyCost: 23, moneyCost: 360, statChanges: { explosive_burst: 2, cardio: 2, fight_iq: 2, mental_heart: 1 } },
  { id: 'c-ph-8', name: 'Total Recovery Protocol', description: 'Full 2-day recovery protocol — sleep optimization, breathing, cold/hot contrast, soft tissue work.', category: 'physical', tier: 'complex', icon: '🔋', energyCost: 15, moneyCost: 300, statChanges: { recovery_rate: 2, chin_durability: 2, mental_heart: 2, fight_iq: 1 } },
];

// ─── TIER: HYBRID (+6 to two stats, -3 to one) — 15 exercises ────────────────

const HYBRID: GymExercise[] = [
  { id: 'h-1', name: 'Berserker Sparring Protocol', description: 'All-out pressure sparring with no defensive coaching — go forward, eat shots, keep firing. Jab precision and combination flow boom; IQ suffers from aggression tunnel vision.', category: 'striking', tier: 'hybrid', icon: '☠️', energyCost: 28, moneyCost: 500, statChanges: { jab_precision: 6, combination_flow: 6, fight_iq: -3 } },
  { id: 'h-2', name: 'Overloaded Power Training', description: 'Max load bench + max load dead on consecutive days — raw cross power and explosive burst skyrocket; recovery rate tanks.', category: 'striking', tier: 'hybrid', icon: '☠️', energyCost: 30, moneyCost: 520, statChanges: { cross_power: 6, explosive_burst: 6, recovery_rate: -3 } },
  { id: 'h-3', name: 'High Kick Flexibility Overreach', description: 'Extreme daily stretching and loaded stretching for 2 weeks of high kick speed — accelerates hip flexibility but soft tissue overwork hurts chin durability.', category: 'striking', tier: 'hybrid', icon: '☠️', energyCost: 25, moneyCost: 480, statChanges: { high_kick_speed: 6, spinning_mastery: 6, chin_durability: -3 } },
  { id: 'h-4', name: 'Leg Kick Hardening Spar', description: 'Taking and giving unblocked leg kicks for shin conditioning and impact — bone density and power both jump; recovery tanks.', category: 'striking', tier: 'hybrid', icon: '☠️', energyCost: 27, moneyCost: 490, statChanges: { leg_kick_hardness: 6, hook_lethality: 6, recovery_rate: -3 } },
  { id: 'h-5', name: 'Ground and Pound Exposure Camp', description: 'Being dominated from top position while defending — GnP defense and scramble ability explode; chin takes damage from repeated GnP.', category: 'wrestling', tier: 'hybrid', icon: '☠️', energyCost: 30, moneyCost: 540, statChanges: { scramble_ability: 6, sprawl_technique: 6, chin_durability: -3 } },
  { id: 'h-6', name: 'Suicide Shot Drill — No Regard', description: 'Shooting double legs at full speed on concrete mats without full knee pads — explosion and grit explode; recovery suffers from impact.', category: 'wrestling', tier: 'hybrid', icon: '☠️', energyCost: 29, moneyCost: 510, statChanges: { double_leg_explosion: 6, single_leg_grit: 6, recovery_rate: -3 } },
  { id: 'h-7', name: 'Chain Submission Live Rolling', description: '60-minute non-stop live rolling focused on submission chains — joint lock and chain mastery explode; mental heart suffers from exhaustion.', category: 'bjj', tier: 'hybrid', icon: '☠️', energyCost: 32, moneyCost: 560, statChanges: { submission_chain: 6, joint_lock_technique: 6, mental_heart: -3 } },
  { id: 'h-8', name: 'Leg Lock Gauntlet', description: 'Running through 10 leg lock specialists back to back — heel hook mastery explodes but cardio gets buried.', category: 'bjj', tier: 'hybrid', icon: '☠️', energyCost: 32, moneyCost: 580, statChanges: { joint_lock_technique: 6, guard_game: 6, cardio: -3 } },
  { id: 'h-9', name: 'Over-Rolling Submission Defense', description: '4 hours of continuous rolling against submissions — defense becomes elite but IQ drops from exhaustion patterns.', category: 'bjj', tier: 'hybrid', icon: '☠️', energyCost: 33, moneyCost: 600, statChanges: { submission_defense: 6, choke_mastery: 6, fight_iq: -3 } },
  { id: 'h-10', name: 'Maximum Intensity HIIT Block', description: '8 × 90-second all-out sprint intervals — cardio and explosiveness soar but recovery is torched for days.', category: 'physical', tier: 'hybrid', icon: '☠️', energyCost: 30, moneyCost: 505, statChanges: { cardio: 6, explosive_burst: 6, recovery_rate: -3 } },
  { id: 'h-11', name: 'Iron Chin Tempering', description: 'Controlled head movement drilling while absorbing light blows — chin durability goes elite but combination flow suffers.', category: 'physical', tier: 'hybrid', icon: '☠️', energyCost: 28, moneyCost: 490, statChanges: { chin_durability: 6, mental_heart: 6, combination_flow: -3 } },
  { id: 'h-12', name: 'Ego-Smashing Fight Simulation', description: 'Placed against a much better fighter intentionally — mental heart and IQ explode from learning; jab precision drops from habit disruption.', category: 'physical', tier: 'hybrid', icon: '☠️', energyCost: 28, moneyCost: 495, statChanges: { mental_heart: 6, fight_iq: 6, jab_precision: -3 } },
  { id: 'h-13', name: 'Sleep Deprivation Camp Simulation', description: 'Multi-day low sleep training block simulating fight camp stress — mental resilience and recovery adapt; chin takes punishment.', category: 'physical', tier: 'hybrid', icon: '☠️', energyCost: 25, moneyCost: 470, statChanges: { recovery_rate: 6, mental_heart: 6, chin_durability: -3 } },
  { id: 'h-14', name: 'Explosive Burst Overdrive', description: 'Two-a-day power sessions for 4 days — explosiveness and cardio peak; joints suffer from overuse (recovery damage).', category: 'physical', tier: 'hybrid', icon: '☠️', energyCost: 33, moneyCost: 580, statChanges: { explosive_burst: 6, cardio: 6, recovery_rate: -3 } },
  { id: 'h-15', name: 'Positional Domination Marathon', description: 'Top control and GnP non-stop rounds against resisting partners — top control weight and GnP soar; combination flow from striking degrades.', category: 'wrestling', tier: 'hybrid', icon: '☠️', energyCost: 30, moneyCost: 540, statChanges: { top_control_weight: 6, gnp_pressure: 6, combination_flow: -3 } },
];

// ─── Full database (150 exercises) ────────────────────────────────────────────

export const GYM_EXERCISES: GymExercise[] = [
  ...SINGLE,   // 60
  ...DUAL,     // 45
  ...COMPLEX,  // 30
  ...HYBRID,   // 15
];
