export interface FighterStats {
  strength: number;
  speed: number;
  cardio: number;
  striking: number;
  grappling: number;
}

// 30 detailed MMA attributes from Supabase profiles table
export interface DetailedFighterStats {
  // Striking (10)
  jab_precision: number;
  cross_power: number;
  hook_lethality: number;
  uppercut_timing: number;
  leg_kick_hardness: number;
  high_kick_speed: number;
  spinning_mastery: number;
  elbow_sharpness: number;
  knee_impact: number;
  combination_flow: number;
  // Wrestling (8)
  double_leg_explosion: number;
  single_leg_grit: number;
  sprawl_technique: number;
  clinch_control: number;
  judo_trips: number;
  gnp_pressure: number;
  top_control_weight: number;
  scramble_ability: number;
  // BJJ (6)
  choke_mastery: number;
  joint_lock_technique: number;
  submission_defense: number;
  guard_game: number;
  sweep_technique: number;
  submission_chain: number;
  // Physical / Mental (6)
  cardio: number;
  chin_durability: number;
  fight_iq: number;
  explosive_burst: number;
  recovery_rate: number;
  mental_heart: number;
}

export interface FighterRecord {
  wins: number;
  losses: number;
  draws: number;
}

export interface Fighter {
  id: string;
  name: string;
  nickname: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "CZ", "US". Optional. */
  country_code?: string;
  record: FighterRecord;
  stats: FighterStats;
  detailedStats?: DetailedFighterStats;
  currentEnergy: number;
  maxEnergy: number;
  experience: number;
  reputation: number;
  health: number;
  maxHealth: number;
  createdAt: Date;
  /** Unspent skill points available to unlock new skills. */
  skill_points: number;
  /** Array of unlocked skill node ids, e.g. ["striking_1_jab_mastery"]. */
  unlocked_skills: string[];
}

export interface AIFighter {
  id: string;
  name: string;
  nickname: string;
  record: FighterRecord;
  stats: FighterStats;
  avatar: string;
  health?: number;
  maxHealth?: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  nickname: string;
  record: FighterRecord;
  reputation: number;
  league: 'Amateur' | 'Regional Pro' | 'MMA Legend';
  avatarEmoji?: string;
  isPlayer?: boolean;
}

export type LeagueType = 'Amateur' | 'Regional Pro' | 'MMA Legend';

export const getLeagueFromReputation = (reputation: number): LeagueType => {
  if (reputation >= 2000) return 'MMA Legend';
  if (reputation >= 500) return 'Regional Pro';
  return 'Amateur';
};

export const getLeagueColor = (league: LeagueType): string => {
  switch (league) {
    case 'Amateur':
      return 'text-yellow-600'; // Bronze
    case 'Regional Pro':
      return 'text-gray-400'; // Silver
    case 'MMA Legend':
      return 'text-yellow-400'; // Gold/Neon
    default:
      return 'text-gray-500';
  }
};

export const getLeagueBgColor = (league: LeagueType): string => {
  switch (league) {
    case 'Amateur':
      return 'bg-yellow-600/20 border border-yellow-600/50';
    case 'Regional Pro':
      return 'bg-gray-400/20 border border-gray-400/50';
    case 'MMA Legend':
      return 'bg-yellow-400/20 border border-yellow-400/50';
    default:
      return 'bg-gray-500/20';
  }
};

export interface FightRound {
  roundNumber: number;
  playerAction: string;
  opponentAction: string;
  playerWon: boolean;
}

export interface FightLog {
  text: string;
  timestamp: number;
  playerHealthDrop?: number;
  opponentHealthDrop?: number;
}

export interface FightResult {
  winner: 'player' | 'opponent';
  rounds: FightRound[];
  logs: FightLog[];
  playerStats: { wins: number; reputation: number };
}

export interface TrainingDrill {
  id: string;
  name: string;
  description: string;
  icon: string;
  energyCost: number;
  benefits: {
    stat: keyof FighterStats | 'all';
    amount: number;
  }[];
}

export interface FighterContextType {
  fighter: Fighter | null;
  /** True while the fighter profile is being fetched from Supabase after login. */
  fighterLoading: boolean;
  /** DetailedFighterStats with all passive skill bonuses applied. */
  enhancedDetailedStats: DetailedFighterStats | null;
  timeSinceLastRegen?: number;
  updateFighterStats: (stats: Partial<FighterStats>) => void;
  updateFighterEnergy: (amount: number) => void;
  createFighter: (name: string, nickname: string) => void;
  addExperience: (amount: number) => void;
  train: (drill: TrainingDrill) => { success: boolean; message: string };
  fight: (opponent: AIFighter) => { success: boolean; message: string; result?: FightResult };
  resetCareer: () => void;
  reloadFighter: () => Promise<void>;
  /** Check if the current fighter can unlock a skill. */
  canLearnSkill: (skillId: string) => { canLearn: boolean; reason?: string };
  /** Unlock a skill: deducts 1 skill_point, persists to Supabase. */
  learnSkill: (skillId: string) => Promise<{ success: boolean; message: string }>;
}
