import { AIFighter } from '../types';

const OPPONENT_POOL: Omit<AIFighter, 'id'>[] = [
  {
    name: 'Alexei Volkov',
    nickname: 'The Bear',
    record: { wins: 8, losses: 2, draws: 0 },
    stats: {
      strength: 85,
      speed: 60,
      cardio: 70,
      striking: 78,
      grappling: 72,
    },
    level: 5,
    avatar: '🐻',
  },
  {
    name: 'Jade Chen',
    nickname: 'The Dragon',
    record: { wins: 6, losses: 1, draws: 1 },
    stats: {
      strength: 70,
      speed: 82,
      cardio: 80,
      striking: 85,
      grappling: 65,
    },
    level: 4,
    avatar: '🐉',
  },
  {
    name: 'Marcus Johnson',
    nickname: 'The Machine',
    record: { wins: 7, losses: 3, draws: 0 },
    stats: {
      strength: 75,
      speed: 70,
      cardio: 85,
      striking: 72,
      grappling: 78,
    },
    level: 5,
    avatar: '⚙️',
  },
  {
    name: 'Sofia Petrov',
    nickname: 'Ice Queen',
    record: { wins: 5, losses: 0, draws: 1 },
    stats: {
      strength: 68,
      speed: 78,
      cardio: 75,
      striking: 80,
      grappling: 70,
    },
    level: 4,
    avatar: '❄️',
  },
  {
    name: 'Kenji Tanaka',
    nickname: 'The Tsunami',
    record: { wins: 9, losses: 1, draws: 0 },
    stats: {
      strength: 78,
      speed: 75,
      cardio: 82,
      striking: 81,
      grappling: 80,
    },
    level: 6,
    avatar: '🌊',
  },
  {
    name: 'Diego Reyes',
    nickname: 'El Fuego',
    record: { wins: 4, losses: 2, draws: 1 },
    stats: {
      strength: 72,
      speed: 76,
      cardio: 78,
      striking: 79,
      grappling: 68,
    },
    level: 3,
    avatar: '🔥',
  },
];

export const getRandomOpponents = (count: number = 3): AIFighter[] => {
  const shuffled = [...OPPONENT_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((opp, idx) => ({
    ...opp,
    id: `ai_${idx}_${Date.now()}`,
  }));
};

export const getOpponentDangerLevel = (opponent: AIFighter): number => {
  const avgStats =
    (opponent.stats.strength +
      opponent.stats.speed +
      opponent.stats.cardio +
      opponent.stats.striking +
      opponent.stats.grappling) /
    5;
  return Math.round(avgStats);
};
