/**
 * FightContext.tsx
 *
 * Global fight engine that keeps the combat loop alive independently of
 * which route is currently rendered.  Arena.tsx subscribes to this context
 * and acts as a "view-only" layer.  CombatWidget.tsx reads the same state to
 * provide the persistent floating overlay.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { AIFighter, FighterStats, DetailedFighterStats } from '../types';
import { supabase } from '../lib/supabase';
import { useFighter } from './FighterContext';
import { useLanguage } from './LanguageContext';
import {
  getBattleMessage,
  BattleCategory,
  MMA_MOVES,
  TAKEDOWN_MOVES,
  SUBMISSION_MOVES,
} from '../constants/battlePhrases';
import { getSkillById } from '../constants/skillTree';
import type { SkillDomain, MechanicTrigger, MechanicEffect } from '../types/skills';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (re-exported so Arena + Widget can import from one place)
// ─────────────────────────────────────────────────────────────────────────────

export type FightPhase = 'STANDUP' | 'GROUND';
export type BodyPart   = 'head' | 'body' | 'legs';

export interface HealthStatus {
  head: number;
  body: number;
  legs: number;
  stamina: number;
}

type FighterSnapshot = FighterStats;

export interface BattleEvent {
  id: string;
  timestamp: number;
  attacker: 'player' | 'opponent';
  category: BattleCategory;
  move: string;
  damage: number;
  targetPart: BodyPart;
  phase: FightPhase;
  groundAttacker?: 'player' | 'opponent';
}

export interface BattleLogEntry {
  id: string;
  message: string;
  category: BattleCategory;
  displayTime: number;
  isSkillTrigger?: boolean;
  skillDomain?: SkillDomain;
}

interface QueuedEvent {
  event: BattleEvent;
  attackerName: string;
  defenderName: string;
}

export interface RoundResult {
  playerDamage: number;
  opponentDamage: number;
  playerHits: number;
  opponentHits: number;
}

interface SkillTriggerResult {
  skillId: string;
  skillName: string;
  domain: SkillDomain;
  effect: MechanicEffect;
  effectValue?: number;
  logText: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT SHAPE
// ─────────────────────────────────────────────────────────────────────────────

export interface FightContextType {
  // Observable state
  isBattling: boolean;
  battleResult: { winner: 'player' | 'opponent' | 'draw'; method: string } | null;
  playerHS: HealthStatus;
  opponentHS: HealthStatus;
  currentRound: number;
  timeRemaining: number;
  battleLog: BattleLogEntry[];
  fightPhase: FightPhase;
  groundAttackerName: string | null;
  groundTopFighter: 'player' | 'opponent' | null;
  lastPlayerHitPart: BodyPart | null;
  lastOpponentHitPart: BodyPart | null;
  lastPlayerHitCategory: string | null;
  lastOpponentHitCategory: string | null;
  currentAttacker: 'player' | 'opponent' | null;
  roundStats: RoundResult;
  activeSkillPopup: { skillName: string; logText: string; domain: SkillDomain } | null;
  selectedOpponent: AIFighter | null;
  shakeIntensity: number;
  /** True during the 5-second inter-round break between rounds. */
  roundBreak: boolean;
  /** Countdown seconds remaining during roundBreak (5 → 1). */
  roundBreakCountdown: number;
  // Actions
  startBattle: (opponent: AIFighter) => void;
  resetFight: () => void;
}

const FightContext = createContext<FightContextType | undefined>(undefined);

export const useFight = (): FightContextType => {
  const ctx = useContext(FightContext);
  if (!ctx) throw new Error('useFight must be used within FightProvider');
  return ctx;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & PURE HELPERS (unchanged from Arena.tsx)
// ─────────────────────────────────────────────────────────────────────────────

const getDamageRange = (category: BattleCategory): [number, number] => {
  switch (category) {
    case 'LIGHT_HIT':           return [3, 12];
    case 'MEDIUM_HIT':          return [13, 25];
    case 'HEAVY_HIT':           return [26, 40];
    case 'CRITICAL_HIT':        return [41, 60];
    case 'FINISHER':            return [61, 100];
    case 'TAKEDOWN_ATTEMPT':    return [5, 14];
    case 'TAKEDOWN_DEFENSE':    return [0, 0];
    case 'GROUND_CONTROL':      return [12, 28];
    case 'SUBMISSION_ATTEMPT':  return [8, 18];
    case 'SUBMISSION_ESCAPE':   return [0, 0];
    default:                    return [0, 0];
  }
};

const STAMINA_DRAIN: Partial<Record<BattleCategory, number>> = {
  MISS: 3, DODGE: 2,
  LIGHT_HIT: 5, MEDIUM_HIT: 8, HEAVY_HIT: 12, CRITICAL_HIT: 15, FINISHER: 22,
  TAKEDOWN_ATTEMPT: 11, TAKEDOWN_DEFENSE: 5,
  GROUND_CONTROL: 7, SUBMISSION_ATTEMPT: 9, SUBMISSION_ESCAPE: 5,
};

const FINISHER_MSGS: Record<BodyPart, (winner: string, loser: string) => string> = {
  head: (w, l) => `💥 KNOCKOUT!! ${w} drops ${l} with a devastating blow to the head! The referee waves it off!`,
  body: (_w, l) => `🛑 TKO!! The referee stops the fight — ${l}'s body has taken too much punishment!`,
  legs: (_w, l) => `🦵 TKO!! ${l}'s legs give out completely! The referee stops the contest!`,
};

export const DOMAIN_COLORS: Record<SkillDomain, string> = {
  striking:  '#ff1744',
  wrestling: '#ffd600',
  bjj:       '#ce93d8',
  defense:   '#00e5ff',
};

const getTargetPart = (move: string, category: BattleCategory): BodyPart => {
  const m = move.toLowerCase();
  if (
    (m.includes('leg kick') || m.includes('low kick') || m.includes('kopnięcie nogi')) &&
    category !== 'TAKEDOWN_ATTEMPT' && category !== 'TAKEDOWN_DEFENSE'
  ) return 'legs';
  if (
    m.includes('body kick') || m.includes('kop na tělo') || m.includes('kopnięcie w korpus') ||
    m.includes('knee') || m.includes('koleno') || m.includes('kolano')
  ) return Math.random() < 0.8 ? 'body' : 'head';
  if (category === 'TAKEDOWN_ATTEMPT' || category === 'TAKEDOWN_DEFENSE') return 'body';
  if (category === 'GROUND_CONTROL') return Math.random() < 0.45 ? 'head' : 'body';
  if (category === 'SUBMISSION_ATTEMPT' || category === 'SUBMISSION_ESCAPE') return 'body';
  return Math.random() < 0.68 ? 'head' : 'body';
};

export const partLabel = (part: BodyPart): string =>
  part === 'head' ? 'to the head' : part === 'body' ? 'to the body' : 'to the legs';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const evaluateSkillTriggers = (
  attackerSkillIds: string[],
  defenderSkillIds: string[],
  triggerType: MechanicTrigger,
  _currentPhase: FightPhase,
): SkillTriggerResult[] => {
  const results: SkillTriggerResult[] = [];
  const tryFire = (id: string, isDefender: boolean) => {
    const node = getSkillById(id);
    if (!node?.mechanic) return;
    const m = node.mechanic;
    if (m.trigger !== triggerType) return;
    if (m.isDefensive === true  && !isDefender) return;
    if (m.isDefensive === false &&  isDefender) return;
    const normalizedChance = m.chance > 1 ? m.chance / 100 : m.chance;
    if (Math.random() < normalizedChance) {
      results.push({ skillId: id, skillName: node.name, domain: node.domain, effect: m.effect, effectValue: m.effectValue, logText: m.logText });
    }
  };
  if (triggerType === 'on_attack' || triggerType === 'on_takedown_attempt') {
    attackerSkillIds.forEach(id => tryFire(id, false));
  } else if (triggerType === 'on_defend' || triggerType === 'on_low_health' || triggerType === 'on_miss_received') {
    defenderSkillIds.forEach(id => tryFire(id, true));
  } else {
    attackerSkillIds.forEach(id => tryFire(id, false));
    defenderSkillIds.forEach(id => tryFire(id, true));
  }
  return results;
};

const generateBattleEvents = (
  roundDuration = 60,
  language = 'en',
  player: FighterSnapshot = { grappling: 50, strength: 50, speed: 50, striking: 50, cardio: 50 },
  opponent: FighterSnapshot = { grappling: 50, strength: 50, speed: 50, striking: 50, cardio: 50 },
  playerDetail?: Partial<DetailedFighterStats>,
  opponentDetail?: Partial<DetailedFighterStats>,
): BattleEvent[] => {
  const playerGrappling  = player.grappling;
  const opponentGrappling = opponent.grappling;
  let playerStaminaSim  = 100;
  let opponentStaminaSim = 100;

  const applyStatMod = (
    baseDmg: number, targetPart: BodyPart,
    atkDetail: Partial<DetailedFighterStats> | undefined,
    defDetail: Partial<DetailedFighterStats> | undefined,
    atkStamina: number,
  ): number => {
    let d = baseDmg * (atkStamina / 100);
    if (targetPart === 'legs') {
      d *= 1 + ((atkDetail?.leg_kick_hardness ?? 50) - 50) / 200;
    } else if (targetPart === 'head') {
      d /= 1 + (defDetail?.chin_durability ?? 50) / 200;
      const strike = Math.max(atkDetail?.cross_power ?? 50, atkDetail?.hook_lethality ?? 50, atkDetail?.uppercut_timing ?? 50);
      d *= 1 + (strike - 50) / 300;
    } else {
      d *= 1 + ((atkDetail?.gnp_pressure ?? 50) - 50) / 300;
      d *= 1 + ((atkDetail?.knee_impact   ?? 50) - 50) / 300;
    }
    return Math.round(Math.max(1, d));
  };

  const events: BattleEvent[] = [];
  const lang = language as 'en' | 'cs' | 'pl';
  const strikingMoves = MMA_MOVES[lang];
  const tdMoves       = TAKEDOWN_MOVES[lang];
  const subMoves      = SUBMISSION_MOVES[lang];

  let time = 0, eid = 0;
  let phase: FightPhase = 'STANDUP';
  let groundTopFighter: 'player' | 'opponent' = 'player';
  let groundEndTime = 0;

  const tdChancePlayer   = 0.10 + (playerGrappling   - 50) / 400;
  const tdChanceOpponent = 0.10 + (opponentGrappling - 50) / 400;

  const mkEvent = (
    category: BattleCategory, attacker: 'player' | 'opponent',
    move: string, curPhase: FightPhase, gTop?: 'player' | 'opponent',
  ): BattleEvent => {
    const [mn, mx] = getDamageRange(category);
    const tPart    = getTargetPart(move, category);
    const atkStamina = attacker === 'player' ? playerStaminaSim : opponentStaminaSim;
    const atkDetail  = attacker === 'player' ? playerDetail : opponentDetail;
    const defDetail  = attacker === 'player' ? opponentDetail : playerDetail;
    const rawDmg   = mn > 0 ? randInt(mn, mx) : 0;
    const finalDmg = rawDmg > 0 ? applyStatMod(rawDmg, tPart, atkDetail, defDetail, atkStamina) : 0;
    const drain = STAMINA_DRAIN[category] ?? 5;
    if (attacker === 'player') {
      playerStaminaSim   = Math.max(5, playerStaminaSim - drain);
      opponentStaminaSim = Math.min(100, opponentStaminaSim + 1);
    } else {
      opponentStaminaSim = Math.max(5, opponentStaminaSim - drain);
      playerStaminaSim   = Math.min(100, playerStaminaSim + 1);
    }
    return { id: `ev-${eid++}-${Date.now()}`, timestamp: time, attacker, category, move, damage: finalDmg, targetPart: tPart, phase: curPhase, groundAttacker: gTop };
  };

  while (time < roundDuration) {
    const spacing = phase === 'GROUND' ? randInt(2, 4) : randInt(2, 5);
    time += spacing;
    if (time >= roundDuration) break;

    if (phase === 'GROUND') {
      if (time >= groundEndTime) {
        events.push({ id: `standup-sys-${eid++}`, timestamp: time, attacker: groundTopFighter, category: 'TAKEDOWN_DEFENSE', move: lang === 'cs' ? 'vstávání po obraně' : lang === 'pl' ? 'powrót na nogi' : 'scramble back to feet', damage: 0, targetPart: 'body', phase: 'STANDUP', groundAttacker: undefined });
        phase = 'STANDUP'; continue;
      }
      const roll  = Math.random();
      const bottom: 'player' | 'opponent' = groundTopFighter === 'player' ? 'opponent' : 'player';
      if (roll < 0.18) {
        const sub = randItem(subMoves);
        events.push(mkEvent('SUBMISSION_ATTEMPT', groundTopFighter, sub, 'GROUND', groundTopFighter));
        if (Math.random() < 0.09) { time += 1; events.push(mkEvent('FINISHER', groundTopFighter, sub, 'GROUND', groundTopFighter)); break; }
        if (Math.random() < 0.40) {
          time += randInt(1, 3); if (time >= roundDuration) break;
          events.push(mkEvent('SUBMISSION_ESCAPE', bottom, sub, 'GROUND', groundTopFighter));
          if (Math.random() < 0.50) { phase = 'STANDUP'; } else { groundTopFighter = bottom; groundEndTime = time + randInt(10, 20); }
        }
      } else if (roll < 0.55) {
        events.push(mkEvent('GROUND_CONTROL', groundTopFighter, 'ground and pound', 'GROUND', groundTopFighter));
      } else if (roll < 0.70) {
        const guardWork = lang === 'cs' ? 'práce z gardu' : lang === 'pl' ? 'praca z gardy' : 'guard work';
        events.push(mkEvent('SUBMISSION_ESCAPE', bottom, guardWork, 'GROUND', groundTopFighter));
        if (Math.random() < 0.25) phase = 'STANDUP';
      } else if (roll < 0.82) {
        const sub = randItem(subMoves);
        events.push(mkEvent('SUBMISSION_ATTEMPT', groundTopFighter, sub, 'GROUND', groundTopFighter));
      } else {
        const posWork = lang === 'cs' ? 'kontrola pozice' : lang === 'pl' ? 'kontrola pozycji' : 'positional control';
        events.push(mkEvent('GROUND_CONTROL', groundTopFighter, posWork, 'GROUND', groundTopFighter));
      }
    } else {
      const tdAttemptChance = Math.random() < 0.5 ? tdChancePlayer : tdChanceOpponent;
      const roll = Math.random();
      if (roll < tdAttemptChance) {
        const attacker: 'player' | 'opponent' = Math.random() < 0.5 ? 'player' : 'opponent';
        const defender: 'player' | 'opponent' = attacker === 'player' ? 'opponent' : 'player';
        const td = randItem(tdMoves);
        events.push(mkEvent('TAKEDOWN_ATTEMPT', attacker, td, 'STANDUP'));
        const atkGrappling = attacker === 'player' ? playerGrappling : opponentGrappling;
        const defGrappling = defender === 'player' ? playerGrappling : opponentGrappling;
        const defStamina   = defender === 'player' ? playerStaminaSim : opponentStaminaSim;
        const exhaustionBonus = defStamina < 20 ? 1.5 : 1.0;
        const tdSuccessChance = (0.45 + (atkGrappling - defGrappling) / 200) * exhaustionBonus;
        if (Math.random() > tdSuccessChance) {
          time += randInt(1, 2); if (time >= roundDuration) break;
          events.push(mkEvent('TAKEDOWN_DEFENSE', defender, td, 'STANDUP'));
        } else {
          time += 1; phase = 'GROUND'; groundTopFighter = attacker; groundEndTime = time + randInt(20, 35);
        }
      } else {
        const attacker: 'player' | 'opponent' = Math.random() < 0.5 ? 'player' : 'opponent';
        const move = randItem(strikingMoves);
        const atkStaminaNow = attacker === 'player' ? playerStaminaSim : opponentStaminaSim;
        const fatiguedBias  = atkStaminaNow < 30 ? 0.15 : 0;
        let category: BattleCategory;
        const sr = Math.random();
        if      (sr < 0.12 + fatiguedBias) category = 'MISS';
        else if (sr < 0.22 + fatiguedBias) category = 'DODGE';
        else if (sr < 0.50 + fatiguedBias) category = 'LIGHT_HIT';
        else if (sr < 0.72 + fatiguedBias) category = 'MEDIUM_HIT';
        else if (sr < 0.88)                category = 'HEAVY_HIT';
        else if (sr < 0.96)                category = 'CRITICAL_HIT';
        else                               category = 'FINISHER';
        events.push(mkEvent(category, attacker, move, 'STANDUP'));
      }
    }
  }
  return events.sort((a, b) => a.timestamp - b.timestamp);
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT STATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const defaultHS = (): HealthStatus => ({ head: 100, body: 100, legs: 100, stamina: 100 });
const defaultRoundStats = (): RoundResult => ({ playerDamage: 0, opponentDamage: 0, playerHits: 0, opponentHits: 0 });

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export const FightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { fighter, reloadFighter } = useFighter();
  const { language }               = useLanguage();

  // ── Refs that mirror critical state (stale-closure prevention) ────────────
  const fighterRef        = useRef(fighter);
  const languageRef       = useRef(language);
  const selectedOppRef    = useRef<AIFighter | null>(null);
  const playerHSRef       = useRef<HealthStatus>(defaultHS());
  const opponentHSRef     = useRef<HealthStatus>(defaultHS());
  const battleEndedRef    = useRef(false);
  const stunRef           = useRef<{ player: number; opponent: number }>({ player: 0, opponent: 0 });
  const fractureRef       = useRef<{ player: boolean; opponent: boolean }>({ player: false, opponent: false });
  const playerSkillsRef   = useRef<string[]>([]);
  const eventsRef         = useRef<BattleEvent[]>([]);
  const processedEventIds = useRef<Set<string>>(new Set());
  const displayQueueRef   = useRef<QueuedEvent[]>([]);
  const isProcessingQueueRef  = useRef(false);
  const processingTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBattlingRef         = useRef(false);
  const currentRoundRef       = useRef(1);
  const roundStatsRef         = useRef<RoundResult>(defaultRoundStats());
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingFinishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skillPopupTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardsProcessedRef   = useRef(false); // guard: process rewards exactly once

  // Keep refs in sync with context/state values
  useEffect(() => { fighterRef.current     = fighter; },  [fighter]);
  useEffect(() => { languageRef.current    = language; }, [language]);
  useEffect(() => { playerSkillsRef.current = fighter?.unlocked_skills ?? []; }, [fighter]);

  // ── Displayable state ─────────────────────────────────────────────────────
  const [isBattling,            setIsBattling]            = useState(false);
  const [battleResult,          setBattleResult]          = useState<{ winner: 'player' | 'opponent' | 'draw'; method: string } | null>(null);
  const [playerHS,              setPlayerHS]              = useState<HealthStatus>(defaultHS());
  const [opponentHS,            setOpponentHS]            = useState<HealthStatus>(defaultHS());
  const [currentRound,          setCurrentRound]          = useState(1);
  const [timeRemaining,         setTimeRemaining]         = useState(60);
  const [battleLog,             setBattleLog]             = useState<BattleLogEntry[]>([]);
  const [fightPhase,            setFightPhase]            = useState<FightPhase>('STANDUP');
  const [groundAttackerName,    setGroundAttackerName]    = useState<string | null>(null);
  const [groundTopFighter,      setGroundTopFighter]      = useState<'player' | 'opponent' | null>(null);
  const [lastPlayerHitPart,     setLastPlayerHitPart]     = useState<BodyPart | null>(null);
  const [lastOpponentHitPart,   setLastOpponentHitPart]   = useState<BodyPart | null>(null);
  const [lastPlayerHitCategory, setLastPlayerHitCategory] = useState<string | null>(null);
  const [lastOpponentHitCategory, setLastOpponentHitCategory] = useState<string | null>(null);
  const [currentAttacker,       setCurrentAttacker]       = useState<'player' | 'opponent' | null>(null);
  const [roundStats,            setRoundStats]            = useState<RoundResult>(defaultRoundStats());
  const [activeSkillPopup, setActiveSkillPopup] = useState<{ skillName: string; logText: string; domain: SkillDomain } | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<AIFighter | null>(null);
  const [shakeIntensity,        setShakeIntensity]        = useState(0);
  const [roundBreak,            setRoundBreak]            = useState(false);
  const [roundBreakCountdown,   setRoundBreakCountdown]   = useState(5);
  const roundBreakRef = useRef(false);

  // Keep selectedOppRef in sync
  useEffect(() => { selectedOppRef.current = selectedOpponent; }, [selectedOpponent]);
  // Keep isBattlingRef in sync
  useEffect(() => { isBattlingRef.current = isBattling; }, [isBattling]);
  // Keep currentRoundRef in sync
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);
  // Keep roundBreakRef in sync
  useEffect(() => { roundBreakRef.current = roundBreak; }, [roundBreak]);

  // ─────────────────────────────────────────────────────────────────────────
  // REWARD PROCESSING (exactly once per fight)
  // ─────────────────────────────────────────────────────────────────────────
  const processRewards = useCallback((
    finalWinner: 'player' | 'opponent' | 'draw',
    method: string,
  ) => {
    if (rewardsProcessedRef.current) return;
    rewardsProcessedRef.current = true;

    const currentFighter = fighterRef.current;
    const opponentRef    = selectedOppRef.current;
    if (!currentFighter) return;

    const totalPlayerHPLeft   = playerHSRef.current.head + playerHSRef.current.body + playerHSRef.current.legs;
    const hpLostFraction      = (300 - totalPlayerHPLeft) / 300;
    const isKO                = method.includes('Knockout') || method.includes('TKO') || method.includes('Submission');

    let energyCost: number;
    if (finalWinner === 'player') {
      energyCost = Math.round(20 + hpLostFraction * 55);
      if (isKO) energyCost = Math.min(55, Math.round(energyCost * 1.1));
    } else if (finalWinner === 'opponent') {
      energyCost = Math.round(45 + hpLostFraction * 45);
      if (isKO) energyCost = Math.min(80, Math.round(energyCost * 1.2));
    } else {
      energyCost = Math.round(30 + hpLostFraction * 30);
    }
    energyCost = Math.max(15, Math.min(80, energyCost));

    const energyAfter    = Math.max(0, currentFighter.currentEnergy - energyCost);
    const xpGain         = 50 + roundStatsRef.current.playerDamage;
    const reputationGain = finalWinner === 'player'
      ? 10 + roundStatsRef.current.playerHits * 2
      : finalWinner === 'draw' ? 2 : 0;

    const methodCat: 'ko' | 'submission' | 'decision' =
      method.toLowerCase().includes('submission') ? 'submission' :
      (method.includes('Knockout') || method.includes('TKO')) ? 'ko' : 'decision';

    const profileUpdate: Record<string, unknown> = {
      energy:             energyAfter,
      experience:         (currentFighter.experience || 0) + xpGain,
      total_fights:       (currentFighter.record.wins + currentFighter.record.losses + currentFighter.record.draws) + 1,
      total_damage_dealt: roundStatsRef.current.playerDamage,
      total_damage_taken: roundStatsRef.current.opponentDamage,
      total_hits_landed:  roundStatsRef.current.playerHits,
      last_fight_at:      new Date().toISOString(),
      updated_at:         new Date().toISOString(),
    };

    if (finalWinner === 'player') {
      profileUpdate.wins       = (currentFighter.record.wins || 0) + 1;
      profileUpdate.reputation = (currentFighter.reputation || 0) + reputationGain;
      if      (methodCat === 'ko')         profileUpdate.wins_by_ko         = 1;
      else if (methodCat === 'submission') profileUpdate.wins_by_submission = 1;
      else                                profileUpdate.wins_by_decision   = 1;
    } else if (finalWinner === 'opponent') {
      profileUpdate.losses = (currentFighter.record.losses || 0) + 1;
      if      (methodCat === 'ko')         profileUpdate.losses_by_ko         = 1;
      else if (methodCat === 'submission') profileUpdate.losses_by_submission = 1;
      else                                profileUpdate.losses_by_decision   = 1;
    } else {
      profileUpdate.draws = (currentFighter.record.draws || 0) + 1;
    }

    supabase.from('profiles').update(profileUpdate).eq('id', currentFighter.id)
      .then(() => reloadFighter());

    if (opponentRef) {
      const isAIOpponent = opponentRef.id.startsWith('ai_');
      supabase.from('fight_history').insert({
        fighter_id:        currentFighter.id,
        opponent_id:       isAIOpponent ? null : opponentRef.id,
        opponent_name:     opponentRef.name,
        opponent_nickname: opponentRef.nickname ?? null,
        result:            finalWinner === 'player' ? 'win' : finalWinner === 'opponent' ? 'loss' : 'draw',
        method,
        method_category:   methodCat,
        rounds_completed:  currentRoundRef.current,
        damage_dealt:      roundStatsRef.current.playerDamage,
        damage_taken:      roundStatsRef.current.opponentDamage,
        hits_landed:       roundStatsRef.current.playerHits,
        hits_received:     roundStatsRef.current.opponentHits,
        energy_cost:       energyCost,
        reputation_gain:   reputationGain,
        xp_gain:           xpGain,
        fighter_reputation: currentFighter.reputation,
        snap_strength:   currentFighter.stats?.strength  ?? null,
        snap_speed:      currentFighter.stats?.speed     ?? null,
        snap_cardio:     currentFighter.stats?.cardio    ?? null,
        snap_striking:   currentFighter.stats?.striking  ?? null,
        snap_grappling:  currentFighter.stats?.grappling ?? null,
        opp_snap_strength:  opponentRef.stats?.strength  ?? null,
        opp_snap_speed:     opponentRef.stats?.speed     ?? null,
        opp_snap_cardio:    opponentRef.stats?.cardio    ?? null,
        opp_snap_striking:  opponentRef.stats?.striking  ?? null,
        opp_snap_grappling: opponentRef.stats?.grappling ?? null,
      }).then(({ error: insErr }) => {
        if (insErr) console.error('❌ [FIGHT HISTORY] Insert error:', insErr.message);
        else        console.log('✅ [FIGHT HISTORY] Fight saved to history');
      });
    }
  }, [reloadFighter]);

  // ─────────────────────────────────────────────────────────────────────────
  // endBattle
  // ─────────────────────────────────────────────────────────────────────────
  const endBattle = useCallback((
    winner: 'player' | 'opponent' | 'judges' | 'draw',
    method: string,
  ) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pendingFinishTimeoutRef.current) { clearTimeout(pendingFinishTimeoutRef.current); pendingFinishTimeoutRef.current = null; }

    let finalWinner = winner;
    if (winner === 'judges') {
      const ps = roundStatsRef.current.playerDamage + roundStatsRef.current.playerHits * 5;
      const os = roundStatsRef.current.opponentDamage + roundStatsRef.current.opponentHits * 5;
      finalWinner = ps > os ? 'player' : os > ps ? 'opponent' : 'draw';
    }

    const resolvedWinner = finalWinner as 'player' | 'opponent' | 'draw';
    setBattleResult({ winner: resolvedWinner, method });
    setIsBattling(false);

    processRewards(resolvedWinner, method);
  }, [processRewards]);

  // ─────────────────────────────────────────────────────────────────────────
  // QUEUE PROCESSOR
  // ─────────────────────────────────────────────────────────────────────────
  const processNextQueuedEvent = useCallback(() => {
    if (!isBattlingRef.current || isProcessingQueueRef.current || displayQueueRef.current.length === 0) {
      if (isBattlingRef.current) {
        processingTimeoutRef.current = setTimeout(processNextQueuedEvent, 100);
      }
      return;
    }

    isProcessingQueueRef.current = true;
    const queuedEvent = displayQueueRef.current.shift();
    if (!queuedEvent) {
      isProcessingQueueRef.current = false;
      processingTimeoutRef.current = setTimeout(processNextQueuedEvent, 100);
      return;
    }

    const { event, attackerName, defenderName } = queuedEvent;

    // Stun check
    if (stunRef.current[event.attacker] > 0) {
      stunRef.current = { ...stunRef.current, [event.attacker]: stunRef.current[event.attacker] - 1 };
      const stunMsg = `🌀 ${attackerName} is still stunned — turn skipped!`;
      setBattleLog(log => [...log, { id: `stun-skip-${event.id}`, message: stunMsg, category: 'DODGE' as BattleCategory, displayTime: Date.now() }]);
      setTimeout(() => { isProcessingQueueRef.current = false; processNextQueuedEvent(); }, 900 + Math.random() * 500);
      return;
    }

    const lang     = languageRef.current;
    const baseMsg  = getBattleMessage(event.category, attackerName, defenderName, event.move, lang);
    const isStrike = event.damage > 0 && (['LIGHT_HIT', 'MEDIUM_HIT', 'HEAVY_HIT', 'CRITICAL_HIT'] as BattleCategory[]).includes(event.category);
    const message  = baseMsg + (isStrike ? ` [${partLabel(event.targetPart)}]` : '');

    setFightPhase(event.phase);
    if (event.phase === 'GROUND' && event.groundAttacker) {
      const topName = event.groundAttacker === 'player' ? fighterRef.current?.name ?? 'Player' : selectedOppRef.current?.name ?? 'Opponent';
      setGroundAttackerName(topName);
      setGroundTopFighter(event.groundAttacker);
    } else if (event.phase === 'STANDUP') {
      setGroundAttackerName(null);
      setGroundTopFighter(null);
    }

    setCurrentAttacker(event.attacker);
    setTimeout(() => setCurrentAttacker(null), 700);

    setBattleLog(log => [...log, { id: event.id, message, category: event.category, displayTime: Date.now() }]);

    const typewriterDuration = message.length * 60;

    setTimeout(() => {
      if (event.damage > 0) {
        const tPart             = event.targetPart;
        const isPlayerAttacking = event.attacker === 'player';
        const drain             = STAMINA_DRAIN[event.category] ?? 5;

        const attackerSkillIds = event.attacker === 'player' ? playerSkillsRef.current : [];
        const defenderSkillIds = event.attacker === 'player' ? [] : playerSkillsRef.current;
        let effectiveDamage    = event.damage;
        const skillLogEntries: BattleLogEntry[] = [];

        // on_defend
        const defendResults = evaluateSkillTriggers(attackerSkillIds, defenderSkillIds, 'on_defend', event.phase);
        for (const r of defendResults) {
          skillLogEntries.push({ id: `sk-def-${r.skillId}-${Date.now()}`, message: `[SKILL: ${r.skillName}] ${r.logText}`, category: event.category, displayTime: Date.now(), isSkillTrigger: true, skillDomain: r.domain });
          if (r.effect === 'reflect_damage' || r.effect === 'intercept') { effectiveDamage = 0; }
          else if (r.effect === 'counter' || r.effect === 'auto_counter') {
            const ctrAtk: 'player' | 'opponent' = event.attacker === 'player' ? 'opponent' : 'player';
            const ctrAtkName = ctrAtk === 'player' ? fighterRef.current?.name ?? 'Player' : selectedOppRef.current?.name ?? 'Opponent';
            const ctrDefName = ctrAtk === 'player' ? selectedOppRef.current?.name ?? 'Opponent' : fighterRef.current?.name ?? 'Player';
            const ctrDmg = Math.round(10 + Math.random() * 12 + (r.effectValue ?? 0));
            const counterEv: BattleEvent = { id: `ctr-${Date.now()}`, timestamp: event.timestamp, attacker: ctrAtk, category: 'MEDIUM_HIT', move: 'counter strike', damage: ctrDmg, targetPart: 'head', phase: event.phase };
            displayQueueRef.current.unshift({ event: counterEv, attackerName: ctrAtkName, defenderName: ctrDefName });
          }
        }

        // on_attack
        const attackTrigger: MechanicTrigger = event.category === 'TAKEDOWN_ATTEMPT' ? 'on_takedown_attempt' : 'on_attack';
        const attackResults = evaluateSkillTriggers(attackerSkillIds, defenderSkillIds, attackTrigger, event.phase);
        for (const r of attackResults) {
          skillLogEntries.push({ id: `sk-atk-${r.skillId}-${Date.now()}`, message: `[SKILL: ${r.skillName}] ${r.logText}`, category: event.category, displayTime: Date.now(), isSkillTrigger: true, skillDomain: r.domain });
          if (r.effect === 'extra_damage' || r.effect === 'knockdown') { effectiveDamage += r.effectValue ?? 10; }
          else if (r.effect === 'stun') { const defKey: 'player' | 'opponent' = event.attacker === 'player' ? 'opponent' : 'player'; stunRef.current[defKey] = Math.max(stunRef.current[defKey], r.effectValue ?? 1); }
          else if (r.effect === 'fracture') { const defKey: 'player' | 'opponent' = event.attacker === 'player' ? 'opponent' : 'player'; fractureRef.current[defKey] = true; }
          else if (r.effect === 'leg_catch' || r.effect === 'intercept') { effectiveDamage += r.effectValue ?? 8; }
          else if (r.effect === 'slam') { effectiveDamage += r.effectValue ?? 12; }
        }

        // fracture debuff
        if (fractureRef.current[event.attacker as 'player' | 'opponent']) { effectiveDamage = Math.round(effectiveDamage * 0.7); }

        if (isPlayerAttacking) {
          const newOppHS = { ...opponentHSRef.current, [tPart]: Math.max(0, opponentHSRef.current[tPart] - effectiveDamage) };
          opponentHSRef.current = newOppHS; setOpponentHS(newOppHS);
          setLastOpponentHitPart(tPart); setTimeout(() => setLastOpponentHitPart(null), 400);
          setLastOpponentHitCategory(event.category); setTimeout(() => setLastOpponentHitCategory(null), 400);
          playerHSRef.current  = { ...playerHSRef.current,  stamina: Math.max(5,   playerHSRef.current.stamina  - drain) }; setPlayerHS({ ...playerHSRef.current });
          opponentHSRef.current = { ...opponentHSRef.current, stamina: Math.min(100, opponentHSRef.current.stamina + 1)   }; setOpponentHS({ ...opponentHSRef.current });

          setRoundStats(stats => { const next = { ...stats, playerDamage: stats.playerDamage + effectiveDamage, playerHits: stats.playerHits + 1 }; roundStatsRef.current = next; return next; });

          if (newOppHS[tPart] <= 0 && !battleEndedRef.current) {
            battleEndedRef.current = true;
            const method = tPart === 'head' ? 'Knockout' : tPart === 'body' ? 'TKO — Body Damage' : 'TKO — Leg Damage';
            setBattleLog(log => [...log, { id: `finish-${Date.now()}`, message: FINISHER_MSGS[tPart](attackerName, defenderName), category: 'FINISHER', displayTime: Date.now() }]);
            if (pendingFinishTimeoutRef.current) clearTimeout(pendingFinishTimeoutRef.current);
            pendingFinishTimeoutRef.current = setTimeout(() => endBattle('player', method), 1200);
          } else if (event.category === 'FINISHER' && !battleEndedRef.current) {
            battleEndedRef.current = true;
            const isSubmission = event.phase === 'GROUND';
            const method = isSubmission ? `Submission — ${event.move}` : (tPart === 'head' ? 'Knockout' : tPart === 'body' ? 'TKO — Body Damage' : 'TKO — Leg Damage');
            const finishMsg = isSubmission ? `🔒 SUBMISSION!! ${defenderName} tapped out! ${attackerName} wins by submission — ${event.move}!` : FINISHER_MSGS[tPart](attackerName, defenderName);
            setBattleLog(log => [...log, { id: `finish-sub-${Date.now()}`, message: finishMsg, category: 'FINISHER', displayTime: Date.now() }]);
            if (pendingFinishTimeoutRef.current) clearTimeout(pendingFinishTimeoutRef.current);
            pendingFinishTimeoutRef.current = setTimeout(() => endBattle('player', method), 1200);
          }
        } else {
          const newPlHS = { ...playerHSRef.current, [tPart]: Math.max(0, playerHSRef.current[tPart] - effectiveDamage) };
          playerHSRef.current = newPlHS; setPlayerHS(newPlHS);
          setLastPlayerHitPart(tPart); setTimeout(() => setLastPlayerHitPart(null), 400);
          setLastPlayerHitCategory(event.category); setTimeout(() => setLastPlayerHitCategory(null), 400);
          opponentHSRef.current = { ...opponentHSRef.current, stamina: Math.max(5,   opponentHSRef.current.stamina - drain) }; setOpponentHS({ ...opponentHSRef.current });
          playerHSRef.current   = { ...playerHSRef.current,   stamina: Math.min(100, playerHSRef.current.stamina   + 1)   }; setPlayerHS({ ...playerHSRef.current });

          setRoundStats(stats => { const next = { ...stats, opponentDamage: stats.opponentDamage + effectiveDamage, opponentHits: stats.opponentHits + 1 }; roundStatsRef.current = next; return next; });

          // on_low_health
          const playerTotalHP = newPlHS.head + newPlHS.body + newPlHS.legs;
          if (playerTotalHP <= 105 && !battleEndedRef.current) {
            const lowHpResults = evaluateSkillTriggers(attackerSkillIds, defenderSkillIds, 'on_low_health', event.phase);
            for (const r of lowHpResults) {
              skillLogEntries.push({ id: `sk-lh-${r.skillId}-${Date.now()}`, message: `[SKILL: ${r.skillName}] ${r.logText}`, category: 'HEAVY_HIT', displayTime: Date.now(), isSkillTrigger: true, skillDomain: r.domain });
              if (r.effect === 'zombie_mode' && newPlHS[tPart] <= 0) {
                const restoreAmt = r.effectValue ?? 15;
                const zombieHS: HealthStatus = { ...playerHSRef.current, [tPart]: restoreAmt };
                playerHSRef.current = zombieHS; setPlayerHS(zombieHS);
              }
              if (r.effect === 'stamina_restore') {
                const restoreAmt = r.effectValue ?? 20;
                const recoveredHS: HealthStatus = { ...playerHSRef.current, stamina: Math.min(100, playerHSRef.current.stamina + restoreAmt) };
                playerHSRef.current = recoveredHS; setPlayerHS(recoveredHS);
              }
            }
          }

          if (newPlHS[tPart] <= 0 && !battleEndedRef.current) {
            battleEndedRef.current = true;
            const method = tPart === 'head' ? 'Knockout' : tPart === 'body' ? 'TKO — Body Damage' : 'TKO — Leg Damage';
            setBattleLog(log => [...log, { id: `finish-${Date.now()}`, message: FINISHER_MSGS[tPart](defenderName, attackerName), category: 'FINISHER', displayTime: Date.now() }]);
            if (pendingFinishTimeoutRef.current) clearTimeout(pendingFinishTimeoutRef.current);
            pendingFinishTimeoutRef.current = setTimeout(() => endBattle('opponent', method), 1200);
          } else if (event.category === 'FINISHER' && !battleEndedRef.current) {
            battleEndedRef.current = true;
            const isSubmission = event.phase === 'GROUND';
            const method = isSubmission ? `Submission — ${event.move}` : (tPart === 'head' ? 'Knockout' : tPart === 'body' ? 'TKO — Body Damage' : 'TKO — Leg Damage');
            const finishMsg = isSubmission ? `🔒 SUBMISSION!! ${attackerName} tapped out! ${defenderName} wins by submission — ${event.move}!` : FINISHER_MSGS[tPart](defenderName, attackerName);
            setBattleLog(log => [...log, { id: `finish-sub-${Date.now()}`, message: finishMsg, category: 'FINISHER', displayTime: Date.now() }]);
            if (pendingFinishTimeoutRef.current) clearTimeout(pendingFinishTimeoutRef.current);
            pendingFinishTimeoutRef.current = setTimeout(() => endBattle('opponent', method), 1200);
          }
        }

        // Flush skill logs
        if (skillLogEntries.length > 0) {
          setBattleLog(log => [...log, ...skillLogEntries]);
          const first = skillLogEntries.find(e => e.isSkillTrigger && e.skillDomain);
          if (first && first.skillDomain) {
            if (skillPopupTimeoutRef.current) clearTimeout(skillPopupTimeoutRef.current);
            const rawName = first.message.match(/\[SKILL:\s*([^\]]+)\]/)?.[1]?.trim() ?? '';
            const rawText = first.message.replace(/^\[SKILL:[^\]]+\]\s*/, '');
            setActiveSkillPopup({ skillName: rawName, logText: rawText, domain: first.skillDomain });
            skillPopupTimeoutRef.current = setTimeout(() => setActiveSkillPopup(null), 2800);
          }
        }

        // Screen shake
        if (['HEAVY_HIT', 'CRITICAL_HIT', 'FINISHER', 'TAKEDOWN_ATTEMPT'].includes(event.category)) {
          const intensity = event.category === 'FINISHER' ? 3 : event.category === 'CRITICAL_HIT' ? 2 : event.category === 'TAKEDOWN_ATTEMPT' ? 2 : 1;
          setShakeIntensity(intensity);
          setTimeout(() => setShakeIntensity(0), 400);
        }
      }

      const pauseDuration = 1000 + Math.random() * 1000;
      setTimeout(() => { isProcessingQueueRef.current = false; processNextQueuedEvent(); }, pauseDuration);
    }, typewriterDuration);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endBattle]);

  // ─────────────────────────────────────────────────────────────────────────
  // BATTLE CLOCK
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isBattling || battleResult || roundBreak) return;

    timerRef.current = setInterval(() => {
      if (battleEndedRef.current || roundBreakRef.current) return;
      setTimeRemaining(prev => {
        if (prev <= 0) return 0;
        const newTime    = prev - 1;
        const elapsedTime = 60 - newTime;

        const eventsToFire = eventsRef.current.filter(
          ev => ev.timestamp === elapsedTime && !processedEventIds.current.has(ev.id),
        );

        eventsToFire.forEach(ev => {
          processedEventIds.current.add(ev.id);
          const attackerName = ev.attacker === 'player' ? fighterRef.current?.name ?? 'Player' : selectedOppRef.current?.name ?? 'Opponent';
          const defenderName = ev.attacker === 'player' ? selectedOppRef.current?.name ?? 'Opponent' : fighterRef.current?.name ?? 'Player';
          displayQueueRef.current.push({ event: ev, attackerName, defenderName });
        });

        return newTime;
      });
    }, 1000);

    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBattling, battleResult, roundBreak, currentRound]);

  // ─────────────────────────────────────────────────────────────────────────
  // ROUND TRANSITION
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isBattling || battleResult || timeRemaining !== 0) return;
    if (battleEndedRef.current) return;

    if (currentRoundRef.current >= 3) {
      endBattle('judges', "Judges' Decision");
    } else {
      // Pause between rounds: show "Corner Advice" overlay for 5 seconds, then start next round
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      const upcomingRound = currentRoundRef.current + 1;
      setBattleLog(log => [...log, {
        id: `round-${currentRoundRef.current}-end`,
        message: `═══ END OF ROUND ${currentRoundRef.current} — Corner break ═══`,
        category: 'MISS' as BattleCategory,
        displayTime: Date.now(),
      }]);
      setRoundBreak(true);
      roundBreakRef.current = true;
      setRoundBreakCountdown(5);

      let countdown = 5;
      const countdownInterval = setInterval(() => {
        countdown -= 1;
        setRoundBreakCountdown(countdown);
        if (countdown <= 0) { clearInterval(countdownInterval); }
      }, 1000);

      const breakTimeout = setTimeout(() => {
        clearInterval(countdownInterval);
        setRoundBreak(false);
        roundBreakRef.current = false;
        setBattleLog(log => [...log, {
          id: `round-${upcomingRound}-announce`,
          message: `═══ ROUND ${upcomingRound} BEGINS ═══`,
          category: 'MISS' as BattleCategory,
          displayTime: Date.now(),
        }]);
        startNextRound();
      }, 5000);

      return () => { clearInterval(countdownInterval); clearTimeout(breakTimeout); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, isBattling, battleResult]);

  // ─────────────────────────────────────────────────────────────────────────
  // START QUEUE PROCESSOR WHEN BATTLE BEGINS
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isBattling && !processingTimeoutRef.current) {
      processNextQueuedEvent();
    }
    return () => {
      if (processingTimeoutRef.current) { clearTimeout(processingTimeoutRef.current); processingTimeoutRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBattling]);

  // ─────────────────────────────────────────────────────────────────────────
  // startNextRound (kept inside provider to close over setters)
  // ─────────────────────────────────────────────────────────────────────────
  const startNextRound = () => {
    const f   = fighterRef.current;
    const opp = selectedOppRef.current;
    const playerSnap: FighterSnapshot   = { grappling: f?.stats?.grappling ?? 50, strength: f?.stats?.strength  ?? 50, speed: f?.stats?.speed ?? 50, striking: f?.stats?.striking ?? 50, cardio: f?.stats?.cardio ?? 50 };
    const opponentSnap: FighterSnapshot = { grappling: opp?.stats?.grappling ?? 50, strength: opp?.stats?.strength ?? 50, speed: opp?.stats?.speed ?? 50, striking: opp?.stats?.striking ?? 50, cardio: opp?.stats?.cardio ?? 50 };

    eventsRef.current = generateBattleEvents(60, languageRef.current, playerSnap, opponentSnap, f?.detailedStats, undefined);
    processedEventIds.current.clear();
    displayQueueRef.current   = [];
    isProcessingQueueRef.current = false;

    const roundFreshHS = defaultHS();
    const carryoverPlayerStamina = playerHSRef.current.stamina;
    const carryoverOppStamina    = opponentHSRef.current.stamina;
    playerHSRef.current   = { ...roundFreshHS, stamina: carryoverPlayerStamina };
    opponentHSRef.current = { ...roundFreshHS, stamina: carryoverOppStamina };

    if (pendingFinishTimeoutRef.current) { clearTimeout(pendingFinishTimeoutRef.current); pendingFinishTimeoutRef.current = null; }
    if (timerRef.current)               { clearInterval(timerRef.current); timerRef.current = null; }

    battleEndedRef.current = false;
    stunRef.current    = { player: 0, opponent: 0 };
    fractureRef.current = { player: false, opponent: false };

    setPlayerHS({ ...playerHSRef.current });
    setOpponentHS({ ...opponentHSRef.current });
    setCurrentRound(r => { currentRoundRef.current = r + 1; return r + 1; });
    roundStatsRef.current = defaultRoundStats();
    setRoundStats(defaultRoundStats());
    setTimeRemaining(60);
    setFightPhase('STANDUP');
    setGroundAttackerName(null);
    setGroundTopFighter(null);
    setLastPlayerHitPart(null);
    setLastOpponentHitPart(null);
    setLastPlayerHitCategory(null);
    setLastOpponentHitCategory(null);
    setCurrentAttacker(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // startBattle (public action)
  // ─────────────────────────────────────────────────────────────────────────
  const startBattle = useCallback((opponent: AIFighter) => {
    const f = fighterRef.current;
    if (!f) return;

    const playerSnap: FighterSnapshot   = { grappling: f.stats?.grappling ?? 50, strength: f.stats?.strength  ?? 50, speed: f.stats?.speed ?? 50, striking: f.stats?.striking ?? 50, cardio: f.stats?.cardio ?? 50 };
    const opponentSnap: FighterSnapshot = { grappling: opponent.stats?.grappling ?? 50, strength: opponent.stats?.strength ?? 50, speed: opponent.stats?.speed ?? 50, striking: opponent.stats?.striking ?? 50, cardio: opponent.stats?.cardio ?? 50 };

    eventsRef.current = generateBattleEvents(60, languageRef.current, playerSnap, opponentSnap, f.detailedStats, undefined);
    processedEventIds.current.clear();
    displayQueueRef.current   = [];
    isProcessingQueueRef.current = false;

    const freshHS = defaultHS();
    playerHSRef.current   = freshHS;
    opponentHSRef.current = freshHS;
    battleEndedRef.current  = false;
    rewardsProcessedRef.current = false; // reset reward guard for new fight
    stunRef.current         = { player: 0, opponent: 0 };
    fractureRef.current     = { player: false, opponent: false };
    currentRoundRef.current = 1;
    roundStatsRef.current   = defaultRoundStats();
    if (pendingFinishTimeoutRef.current) { clearTimeout(pendingFinishTimeoutRef.current); pendingFinishTimeoutRef.current = null; }

    setSelectedOpponent(opponent);
    setPlayerHS({ ...freshHS });
    setOpponentHS({ ...freshHS });
    setIsBattling(true);
    setCurrentRound(1);
    setTimeRemaining(60);
    setBattleLog([]);
    setFightPhase('STANDUP');
    setGroundAttackerName(null);
    setGroundTopFighter(null);
    setRoundStats(defaultRoundStats());
    setBattleResult(null);
    setShakeIntensity(0);
    setActiveSkillPopup(null);
    setRoundBreak(false);
    setRoundBreakCountdown(5);
    roundBreakRef.current = false;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // resetFight (public action)
  // ─────────────────────────────────────────────────────────────────────────
  const resetFight = useCallback(() => {
    if (processingTimeoutRef.current)  { clearTimeout(processingTimeoutRef.current);  processingTimeoutRef.current  = null; }
    if (pendingFinishTimeoutRef.current){ clearTimeout(pendingFinishTimeoutRef.current); pendingFinishTimeoutRef.current = null; }
    if (timerRef.current)              { clearInterval(timerRef.current); timerRef.current = null; }

    setIsBattling(false);
    setBattleResult(null);
    setSelectedOpponent(null);
    setBattleLog([]);
    setCurrentRound(1);
    setTimeRemaining(60);

    const resetHS = defaultHS();
    playerHSRef.current   = resetHS;
    opponentHSRef.current = resetHS;
    battleEndedRef.current  = false;
    currentRoundRef.current = 1;
    roundStatsRef.current   = defaultRoundStats();

    setPlayerHS({ ...resetHS });
    setOpponentHS({ ...resetHS });
    setFightPhase('STANDUP');
    setGroundAttackerName(null);
    setGroundTopFighter(null);
    setLastPlayerHitPart(null);
    setLastOpponentHitPart(null);
    setLastPlayerHitCategory(null);
    setLastOpponentHitCategory(null);
    setCurrentAttacker(null);
    setShakeIntensity(0);
    setActiveSkillPopup(null);
    setRoundStats(defaultRoundStats());
    setRoundBreak(false);
    setRoundBreakCountdown(5);
    roundBreakRef.current = false;

    eventsRef.current = [];
    processedEventIds.current.clear();
    displayQueueRef.current = [];
    isProcessingQueueRef.current = false;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────
  const value: FightContextType = {
    isBattling,
    battleResult,
    playerHS,
    opponentHS,
    currentRound,
    timeRemaining,
    battleLog,
    fightPhase,
    groundAttackerName,
    groundTopFighter,
    lastPlayerHitPart,
    lastOpponentHitPart,
    lastPlayerHitCategory,
    lastOpponentHitCategory,
    currentAttacker,
    roundStats,
    activeSkillPopup,
    selectedOpponent,
    shakeIntensity,
    roundBreak,
    roundBreakCountdown,
    startBattle,
    resetFight,
  };

  return <FightContext.Provider value={value}>{children}</FightContext.Provider>;
};
