import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFighter } from '../context/FighterContext';
import { useLanguage } from '../context/LanguageContext';
import { useFight, HealthStatus, BattleLogEntry, FightPhase, BodyPart, DOMAIN_COLORS, RoundResult } from '../context/FightContext';
import { OpponentCard } from '../components/OpponentCard';
import { FighterSilhouette } from '../components/FighterSilhouette';
import { AIFighter } from '../types';
import { supabase } from '../lib/supabase';

import type { SkillDomain } from '../types/skills';

// ============ TYPES ============












/** Shape of a resolved skill trigger result returned by evaluateSkillTriggers(). */






// ============ DAMAGE RANGES ============



// ============ NEW SYSTEM CONSTANTS ============

/** Stamina drained per event category from the ATTACKER. */


/** Finisher messages when a body part reaches 0. */


/** Determine which body part a strike targets. */


/** Build a body-part location suffix for commentary. */


// ============ EVENT GENERATOR (GROUND GAME STATE MACHINE) ============



// ============ SKILL TRIGGER ENGINE ============









// ============ MAIN ARENA COMPONENT ============

export const Arena: React.FC = () => {
  const { fighter } = useFighter();
  const { t }       = useLanguage();
  const location    = useLocation();

  // ── Global fight state from context (persists across navigation) ─────────
  const fight = useFight();
  const {
    isBattling, battleResult, playerHS, opponentHS, currentRound, timeRemaining,
    battleLog, fightPhase, groundAttackerName, groundTopFighter,
    lastPlayerHitPart, lastOpponentHitPart, lastPlayerHitCategory, lastOpponentHitCategory,
    currentAttacker, roundStats, activeSkillPopup, selectedOpponent, shakeIntensity,
    startBattle, resetFight,
  } = fight;

  // ── Local matchmaking UI state (not part of fight engine) ─────────────────
  const [opponents,        setOpponents]        = useState<AIFighter[]>([]);
  const [localSelected,    setLocalSelected]    = useState<AIFighter | null>(null);
  const [loadingOpponents, setLoadingOpponents] = useState(false);
  const [opponentError,    setOpponentError]    = useState<string | null>(null);

  // Auto-scroll battle log (local UI concern)
  const battleLogRef = useRef<HTMLDivElement>(null);

  const canFight = fighter && fighter.name !== 'Undefined' && fighter.currentEnergy >= 50;

  // ============ AUTO-SCROLL BATTLE LOG ============

  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [battleLog]);

  // ============ MATCHMAKING: FETCH REAL PLAYERS FROM DATABASE ============

  useEffect(() => {
    // If a fight is already running (user navigated back), skip matchmaking
    if (isBattling || battleResult) return;

    const fetchMatchmakingOpponents = async () => {
      if (!fighter || fighter.name === 'Undefined' || opponents.length > 0) {
        return;
      }

      setLoadingOpponents(true);
      setOpponentError(null);

      try {
        console.log('🎯 [ARENA] Fetching matchmaking opponents...');

        // Fetch all players from database sorted by reputation
        const { data: allPlayers, error: fetchError } = await supabase
          .from('profiles')
          .select('id, username, reputation, wins, losses, draws, strength, speed, cardio, striking, grappling')
          .order('reputation', { ascending: false });

        if (fetchError) {
          throw new Error(`Database error: ${fetchError.message}`);
        }

        if (!allPlayers || allPlayers.length === 0) {
          setOpponentError('No players found in database');
          setOpponents([]);
          return;
        }

        // Filter out current player and players without energy
        const availablePlayers = allPlayers.filter(
          (p) => p.username !== fighter.name && p.username && p.id
        );

        console.log('✅ [ARENA] Available players:', availablePlayers.length);

        if (availablePlayers.length === 0) {
          setOpponentError('No other players available to fight');
          setOpponents([]);
          return;
        }

        // Find current player's rank
        const currentReputation = fighter.reputation || 0;

        let selectedPlayers: typeof allPlayers = [];

        if (availablePlayers.length <= 6) {
          // If 6 or fewer players, show all
          selectedPlayers = availablePlayers;
        } else {
          // Matchmaking: 3 above, 3 below based on reputation
          const playersAbove = availablePlayers
            .filter((p) => (p.reputation || 0) > currentReputation)
            .slice(0, 3);

          const playersBelow = availablePlayers
            .filter((p) => (p.reputation || 0) <= currentReputation)
            .slice(0, 3);

          selectedPlayers = [...playersAbove, ...playersBelow];

          // If not enough, fill with remaining players
          if (selectedPlayers.length < 6) {
            const remaining = availablePlayers
              .filter((p) => !selectedPlayers.includes(p))
              .slice(0, 6 - selectedPlayers.length);
            selectedPlayers = [...selectedPlayers, ...remaining];
          }
        }

        // Convert to AIFighter format
        const matchedOpponents: AIFighter[] = selectedPlayers.map((p) => ({
          id: p.id,
          name: p.username || 'Unknown Fighter',
          nickname: `Rank #${allPlayers.findIndex((ap) => ap.id === p.id) + 1}`,
          record: {
            wins: p.wins || 0,
            losses: p.losses || 0,
            draws: p.draws || 0,
          },
          stats: {
            strength: p.strength || 50,
            speed: p.speed || 50,
            cardio: p.cardio || 50,
            striking: p.striking || 50,
            grappling: p.grappling || 50,
          },
          avatar: '🥊',
          health: 100,
          maxHealth: 100,
        }));

        console.log('✅ [ARENA] Matched opponents:', matchedOpponents.length);
        setOpponents(matchedOpponents);

        // Check if there's a pre-selected opponent from navigation state
        const preSelectedOpponent = (location.state as any)?.opponent;
        if (preSelectedOpponent) {
          const foundOpponent = matchedOpponents.find((o) => o.id === preSelectedOpponent.id);
          if (foundOpponent) {
            console.log('✅ [ARENA] Pre-selected opponent:', foundOpponent.name);
            setLocalSelected(foundOpponent);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [ARENA] Matchmaking error:', errorMessage);
        setOpponentError(errorMessage);
        setOpponents([]);
      } finally {
        setLoadingOpponents(false);
      }
    };

    fetchMatchmakingOpponents();
  }, [fighter, opponents.length, location.state, isBattling, battleResult]);

















  // ============ RENDER ============

  return (
    <motion.div
      className="p-8 min-h-screen"
      style={{
        transform:
          shakeIntensity > 0
            ? `translate(${(Math.random() - 0.5) * shakeIntensity * 12}px, ${(Math.random() - 0.5) * shakeIntensity * 12}px)`
            : 'translate(0, 0)',
        transition: 'transform 0.1s',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {battleResult ? (
            <ResultScreen
              key="result"
              result={battleResult}
              roundStats={roundStats}
              onReset={resetFight}
              t={t}
            />
          ) : isBattling && selectedOpponent ? (
            <BattleScreen
              key="battle"
              fighter={fighter!}
              opponent={selectedOpponent}
              currentRound={currentRound}
              timeRemaining={timeRemaining}
              playerHS={playerHS}
              opponentHS={opponentHS}
              battleLog={battleLog}
              battleLogRef={battleLogRef}
              roundStats={roundStats}
              fightPhase={fightPhase}
              groundAttackerName={groundAttackerName}
              lastPlayerHitPart={lastPlayerHitPart}
              lastOpponentHitPart={lastOpponentHitPart}
              lastPlayerHitCategory={lastPlayerHitCategory}
              lastOpponentHitCategory={lastOpponentHitCategory}
              currentAttacker={currentAttacker}
              groundTopFighter={groundTopFighter}
              activeSkillPopup={activeSkillPopup}
              t={t}
            />
          ) : (
            <SetupScreen
              key="setup"
              fighter={fighter}
              opponents={opponents}
              selectedOpponent={localSelected}
              onSelectOpponent={setLocalSelected}
              onStartBattle={() => { if (localSelected) startBattle(localSelected); }}
              canFight={!!canFight}
              loading={loadingOpponents}
              error={opponentError}
              t={t}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ============ BATTLE SCREEN ============

interface BattleScreenProps {
  fighter: any;
  opponent: AIFighter;
  currentRound: number;
  timeRemaining: number;
  playerHS: HealthStatus;
  opponentHS: HealthStatus;
  battleLog: BattleLogEntry[];
  battleLogRef: React.RefObject<HTMLDivElement>;
  roundStats: RoundResult;
  fightPhase: FightPhase;
  groundAttackerName: string | null;
  /** Paperdoll props */
  lastPlayerHitPart: BodyPart | null;
  lastOpponentHitPart: BodyPart | null;
  lastPlayerHitCategory: string | null;
  lastOpponentHitCategory: string | null;
  currentAttacker: 'player' | 'opponent' | null;
  groundTopFighter: 'player' | 'opponent' | null;
  activeSkillPopup: { skillName: string; logText: string; domain: SkillDomain } | null;
  t: (key: string) => string;
}

const BattleScreen: React.FC<BattleScreenProps> = ({
  fighter,
  opponent,
  currentRound,
  timeRemaining,
  playerHS,
  opponentHS,
  battleLog,
  battleLogRef,
  roundStats,
  fightPhase,
  groundAttackerName,
  lastPlayerHitPart,
  lastOpponentHitPart,
  lastPlayerHitCategory,
  lastOpponentHitCategory,
  currentAttacker,
  groundTopFighter,
  activeSkillPopup,
  t,
}) => {
  const isGround = fightPhase === 'GROUND';
  const playerGroundPos = isGround
    ? groundTopFighter === 'player' ? 'TOP' : 'BOTTOM'
    : null;
  const opponentGroundPos = isGround
    ? groundTopFighter === 'opponent' ? 'TOP' : 'BOTTOM'
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* ROUND & TIMER */}
      <motion.div
        className="glass-card-premium rounded-2xl p-6 flex justify-between items-center"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        <div className="text-center flex-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t('round')}</p>
          <p className="text-4xl font-bold text-neon-green">{currentRound}/3</p>
        </div>

        <div className="text-center flex-1 border-x border-gray-700 px-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t('time')}</p>
          <motion.div
            className="font-mono text-5xl font-bold text-alert-red glow-crimson"
            animate={{ scale: timeRemaining <= 10 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.5, repeat: timeRemaining <= 10 ? Infinity : 0 }}
          >
            0:{timeRemaining < 10 ? '0' : ''}
            {timeRemaining}
          </motion.div>
        </div>

        <div className="text-center flex-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t('status')}</p>
          <p className="text-lg font-semibold text-cyan-400 animate-pulse">● {t('live').toUpperCase()}</p>
        </div>
      </motion.div>

      {/* FIGHT PHASE INDICATOR */}
      <AnimatePresence mode="wait">
        {isGround ? (
          <motion.div
            key="ground"
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl px-6 py-4 border-2 border-orange-500/70 bg-orange-950/50 flex items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0"
            />
            <div className="flex-1">
              <p className="text-orange-400 font-black uppercase tracking-widest text-sm">
                ⚠️ GROUND GAME — fight on the mat
              </p>
              {groundAttackerName && (
                <p className="text-orange-300/90 text-xs mt-0.5">
                  🔝 <span className="font-bold">{groundAttackerName}</span> controls from top position
                </p>
              )}
            </div>
            <span className="text-3xl">🤼</span>
          </motion.div>
        ) : (
          <motion.div
            key="standing"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl px-6 py-4 border border-gray-700/60 bg-gray-900/30 flex items-center gap-4"
          >
            <div className="w-3 h-3 rounded-full bg-neon-green flex-shrink-0" />
            <div className="flex-1">
              <p className="text-neon-green font-bold uppercase tracking-widest text-sm">
                STAND-UP — striking range
              </p>
              <p className="text-gray-500 text-xs mt-0.5">fighters on their feet</p>
            </div>
            <span className="text-3xl">🥊</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SKILL ACTIVATION POPUP OVERLAY ───────────────────────────────────── */}
      <AnimatePresence>
        {activeSkillPopup && (
          <motion.div
            key="skill-popup"
            initial={{ opacity: 0, scale: 0.75, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -10 }}
            transition={{ type: 'spring', stiffness: 480, damping: 28 }}
            className="pointer-events-none"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 18px ${DOMAIN_COLORS[activeSkillPopup.domain]}44`,
                  `0 0 38px ${DOMAIN_COLORS[activeSkillPopup.domain]}88`,
                  `0 0 18px ${DOMAIN_COLORS[activeSkillPopup.domain]}44`,
                ],
              }}
              transition={{ duration: 0.75, repeat: 2 }}
              className="rounded-2xl px-5 py-3 flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, #080810, #10101a)',
                border: `2px solid ${DOMAIN_COLORS[activeSkillPopup.domain]}`,
                boxShadow: `0 0 28px ${DOMAIN_COLORS[activeSkillPopup.domain]}50`,
              }}
            >
              {/* Pulsing icon */}
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 0.55, repeat: Infinity }}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: `${DOMAIN_COLORS[activeSkillPopup.domain]}18`,
                  border: `2px solid ${DOMAIN_COLORS[activeSkillPopup.domain]}`,
                }}
              >
                <Zap size={17} style={{ color: DOMAIN_COLORS[activeSkillPopup.domain] }} />
              </motion.div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-black uppercase tracking-[0.28em] mb-0.5"
                  style={{ color: `${DOMAIN_COLORS[activeSkillPopup.domain]}99` }}
                >
                  ⚡ SKILL AKTIVOVÁN — {activeSkillPopup.skillName}
                </p>
                <p
                  className="text-sm font-bold leading-snug"
                  style={{
                    color: DOMAIN_COLORS[activeSkillPopup.domain],
                    textShadow: `0 0 10px ${DOMAIN_COLORS[activeSkillPopup.domain]}`,
                  }}
                >
                  {activeSkillPopup.logText}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 3-COLUMN LAYOUT: Silhouette | Log | Silhouette ────────────────────── */}
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 items-start">

        {/* ─ LEFT: Player silhouette ─ */}
        <div className="rounded-2xl p-3 flex flex-col items-center"
             style={{
               background: 'rgba(0,229,255,0.03)',
               border: '1px solid rgba(0,229,255,0.18)',
               boxShadow: '0 0 20px rgba(0,229,255,0.06) inset',
             }}>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: '0 0 6px #00e5ff' }} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]"
               style={{ color: '#00e5ff', textShadow: '0 0 8px #00e5ff88' }}>YOU</p>
          </div>
          <FighterSilhouette
            name={fighter.name}
            healthStatus={playerHS}
            lastHitPart={lastPlayerHitPart}
            lastHitCategory={lastPlayerHitCategory}
            isAttacking={currentAttacker === 'player'}
            isPlayer={true}
            stance={fightPhase}
            groundPosition={playerGroundPos as 'TOP' | 'BOTTOM' | null}
            mirror={false}
          />
        </div>

        {/* ─ CENTER: Battle log + Round stats ─ */}
        <div className="space-y-3">
          {/* BATTLE LOG */}
          <div
            style={{
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              boxShadow: '0 0 30px rgba(0,229,255,0.04) inset',
              overflow: 'hidden',
            }}
          >
            {/* Log header bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b"
                 style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
              <motion.span
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                style={{ boxShadow: '0 0 6px #00e5ff' }}
              />
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400/70">
                LIVE FEED
              </span>
              <span className="ml-auto text-[8px] font-mono text-gray-600 uppercase tracking-widest">
                {t('live_commentary')}
              </span>
            </div>
            <div ref={battleLogRef} className="h-72 overflow-y-auto space-y-1.5 p-4"
                 style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.2) transparent' }}>
              <AnimatePresence>
                {battleLog.map((entry) => (
                  <LogEntry key={entry.id} entry={entry} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ROUND STATS */}
          <div className="grid grid-cols-2 gap-3 glass-card rounded-2xl p-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('your_damage')}</p>
              <p className="text-2xl font-bold text-neon-green">{roundStats.playerDamage}</p>
              <p className="text-xs text-gray-400 mt-1">({roundStats.playerHits} {t('hits')})</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('opponent_damage')}</p>
              <p className="text-2xl font-bold text-alert-red">{roundStats.opponentDamage}</p>
              <p className="text-xs text-gray-400 mt-1">({roundStats.opponentHits} {t('hits')})</p>
            </div>
          </div>
        </div>

        {/* ─ RIGHT: Opponent silhouette ─ */}
        <div className="rounded-2xl p-3 flex flex-col items-center"
             style={{
               background: 'rgba(255,23,68,0.03)',
               border: '1px solid rgba(255,23,68,0.18)',
               boxShadow: '0 0 20px rgba(255,23,68,0.06) inset',
             }}>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" style={{ boxShadow: '0 0 6px #ff1744' }} />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]"
               style={{ color: '#ff4444', textShadow: '0 0 8px #ff174488' }}>OPP</p>
          </div>
          <FighterSilhouette
            name={opponent.name}
            healthStatus={opponentHS}
            lastHitPart={lastOpponentHitPart}
            lastHitCategory={lastOpponentHitCategory}
            isAttacking={currentAttacker === 'opponent'}
            isPlayer={false}
            stance={fightPhase}
            groundPosition={opponentGroundPos as 'TOP' | 'BOTTOM' | null}
            mirror={true}
          />
        </div>

      </div>
    </motion.div>
  );
};

// ============ LOG ENTRY WITH TYPEWRITER EFFECT ============

const LogEntry: React.FC<{ entry: BattleLogEntry }> = ({ entry }) => {
  const [displayedText, setDisplayedText] = useState('');

  // ── Skill trigger gets its own rendering path ────────────────────────────
  const isSkill     = entry.isSkillTrigger === true;
  const skillColor  = isSkill && entry.skillDomain ? DOMAIN_COLORS[entry.skillDomain] : null;

  const isCritical  = !isSkill && (entry.category === 'CRITICAL_HIT' || entry.category === 'FINISHER');
  const isNegative  = !isSkill && (entry.category === 'MISS' || entry.category === 'DODGE');
  const isTakedown  = !isSkill && (entry.category === 'TAKEDOWN_ATTEMPT' || entry.category === 'TAKEDOWN_DEFENSE');
  const isGndControl = !isSkill && entry.category === 'GROUND_CONTROL';
  const isSub       = !isSkill && entry.category === 'SUBMISSION_ATTEMPT';
  const isSubEscape = !isSkill && entry.category === 'SUBMISSION_ESCAPE';
  const isRoundSep  = entry.message.startsWith('═══');

  // Neon accent color per category
  const accentColor = isSkill     ? (skillColor ?? '#ffd600')
    : isCritical  ? '#ff1744'
    : isTakedown   ? '#ffd600'
    : isSub        ? '#ff6d00'
    : isSubEscape  ? '#00e5ff'
    : isGndControl ? '#ff9100'
    : isNegative   ? 'rgba(80,80,80,0.5)'
    : isRoundSep   ? '#00e5ff'
    : 'rgba(0,229,255,0.25)';

  const textColor = isSkill      ? (skillColor ?? '#ffd600')
    : isCritical  ? '#ff4444'
    : isTakedown   ? '#ffd600'
    : isSub        ? '#ff9100'
    : isSubEscape  ? '#00e5ff'
    : isGndControl ? '#ffab40'
    : isNegative   ? 'rgba(100,100,110,0.8)'
    : isRoundSep   ? '#00e5ff'
    : 'rgba(200,210,220,0.9)';

  useEffect(() => {
    let currentIndex = 0;
    const fullText = entry.message;
    const tickDuration = isSkill ? 30 : isCritical ? 45 : 60;

    const typewriter = setInterval(() => {
      if (currentIndex < fullText.length) {
        currentIndex += 1;
        setDisplayedText(fullText.substring(0, currentIndex));
      } else {
        clearInterval(typewriter);
      }
    }, tickDuration);

    return () => clearInterval(typewriter);
  }, [entry.message]);

  if (isRoundSep) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="my-2 text-center text-[9px] font-black tracking-[0.3em] uppercase"
        style={{ color: '#00e5ff88', borderTop: '1px solid rgba(0,229,255,0.15)', borderBottom: '1px solid rgba(0,229,255,0.15)', padding: '6px 0' }}
      >
        {entry.message}
      </motion.div>
    );
  }

  // ── SKILL TRIGGER — special neon-pulse card ──────────────────────────────
  if (isSkill) {
    const col = skillColor ?? '#ffd600';
    // Split "[SKILL: Name]" prefix from the rest of the message
    const prefixMatch = displayedText.match(/^(\[SKILL:[^\]]+\])(.*)/s);
    const prefix = prefixMatch ? prefixMatch[1] : '';
    const rest   = prefixMatch ? prefixMatch[2] : displayedText;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, x: -8 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        transition={{ duration: 0.2 }}
        style={{
          borderLeft: `3px solid ${col}`,
          paddingLeft: 8,
          paddingTop: 5,
          paddingBottom: 5,
          borderRadius: 4,
          background: `${col}12`,
          boxShadow: `0 0 10px ${col}22, inset 0 0 8px ${col}0a`,
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        {/* Pulsing dot indicator */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <motion.span
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
            transition={{ duration: 0.7, repeat: Infinity }}
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: col,
              boxShadow: `0 0 6px ${col}`,
              flexShrink: 0,
            }}
          />
          <span
            className="text-[8px] font-black uppercase tracking-[0.25em]"
            style={{ color: `${col}99` }}
          >
            skill activated
          </span>
        </div>
        <p className="text-xs font-mono font-bold leading-relaxed" style={{ color: col }}>
          {prefix && (
            <span
              style={{
                color: col,
                textShadow: `0 0 8px ${col}`,
                fontWeight: 900,
                letterSpacing: '0.03em',
              }}
            >
              {prefix}
            </span>
          )}
          <span style={{ color: `${col}cc`, fontWeight: 700 }}>{rest}</span>
          {displayedText.length < entry.message.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.25, repeat: Infinity }}
              className="inline-block w-1.5 h-3 ml-0.5 align-middle"
              style={{ background: col }}
            />
          )}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.25 }}
      style={{
        borderLeft: `2px solid ${accentColor}`,
        paddingLeft: 8,
        paddingTop: 3,
        paddingBottom: 3,
        background: isCritical
          ? 'rgba(255,23,68,0.06)'
          : isSub
            ? 'rgba(255,109,0,0.05)'
            : 'transparent',
      }}
    >
      <p
        className={`text-xs font-mono leading-relaxed ${isCritical ? 'font-bold' : ''}`}
        style={{ color: textColor }}
      >
        {displayedText}
        {displayedText.length < entry.message.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            className="inline-block w-1.5 h-3 ml-0.5 align-middle"
            style={{ background: accentColor }}
          />
        )}
      </p>
    </motion.div>
  );
};

// ============ RESULT SCREEN ============

interface ResultScreenProps {
  result: { winner: 'player' | 'opponent' | 'draw'; method: string };
  roundStats: RoundResult;
  onReset: () => void;
  t: (key: string) => string;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, roundStats, onReset, t }) => {
  const isVictory = result.winner === 'player';
  const isDraw = result.winner === 'draw';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="glass-card-premium rounded-2xl p-12 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 1 }}
        className="text-8xl mb-6"
      >
        {isVictory ? '🏆' : isDraw ? '🤝' : '😔'}
      </motion.div>

      <h1
        className="page-header text-6xl mb-4"
        style={{ color: isVictory ? '#00ff41' : isDraw ? '#fbbf24' : '#dc143c' }}
      >
        {isVictory ? t('victory').toUpperCase() : isDraw ? t('draw').toUpperCase() : t('defeat').toUpperCase()}
      </h1>

      <p className="text-gray-400 text-xl uppercase tracking-widest mb-10">{result.method}</p>

      <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-900/40 p-8 rounded-lg">
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">{t('your_damage')}</p>
          <p className="text-4xl font-bold text-neon-green">{roundStats.playerDamage}</p>
          <p className="text-sm text-gray-500 mt-2">({roundStats.playerHits} {t('hits')})</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">{t('opponent_damage')}</p>
          <p className="text-4xl font-bold text-alert-red">{roundStats.opponentDamage}</p>
          <p className="text-sm text-gray-500 mt-2">({roundStats.opponentHits} {t('hits')})</p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        className="px-10 py-4 bg-gradient-to-r from-neon-green to-emerald-400 text-black font-bold uppercase tracking-wider rounded-lg hover:shadow-xl hover:shadow-neon-green/50 transition-all text-lg"
      >
        {t('return_to_arena')}
      </motion.button>
    </motion.div>
  );
};

// ============ SETUP SCREEN ============

interface SetupScreenProps {
  fighter: any;
  opponents: AIFighter[];
  selectedOpponent: AIFighter | null;
  onSelectOpponent: (opp: AIFighter) => void;
  onStartBattle: () => void;
  canFight: boolean;
  loading: boolean;
  error: string | null;
  t: (key: string) => string;
}

const SetupScreen: React.FC<SetupScreenProps> = ({
  fighter,
  opponents,
  selectedOpponent,
  onSelectOpponent,
  onStartBattle,
  canFight,
  loading,
  error,
  t,
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-4">
          <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Zap size={44} className="text-alert-red glow-crimson" />
          </motion.div>
          <h1 className="page-header text-alert-red glow-crimson text-6xl">{t('pvp_arena').toUpperCase()}</h1>
        </div>
        <p className="text-gray-400 text-lg uppercase tracking-widest font-light">
          {canFight
            ? t('welcome_fighter').replace('{name}', fighter?.name || '')
            : !fighter || fighter.name === 'Undefined'
              ? t('create_fighter_first')
              : t('need_energy')}
        </p>
      </motion.div>

      {/* Can't Fight Messages */}
      {!canFight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-premium rounded-2xl p-12 text-center border-2 border-dashed"
          style={{
            borderColor: !fighter || fighter.name === 'Undefined' ? '#dc143c' : '#fbbf24',
          }}
        >
          <motion.div
            className="text-7xl mb-6"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {!fighter || fighter.name === 'Undefined' ? '⚡' : '😴'}
          </motion.div>
          <h3
            className="section-header text-4xl mb-4"
            style={{
              color: !fighter || fighter.name === 'Undefined' ? '#dc143c' : '#fbbf24',
            }}
          >
            {!fighter || fighter.name === 'Undefined' ? t('no_fighter') : t('low_energy')}
          </h3>
          <p className="text-gray-400 uppercase tracking-widest">
            {!fighter || fighter.name === 'Undefined'
              ? t('create_fighter_dashboard')
              : t('need_energy_current').replace('{energy}', Math.ceil(fighter?.currentEnergy || 0).toString())}
          </p>
        </motion.div>
      )}

      {/* Error State */}
      {canFight && error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-premium rounded-2xl p-8 text-center border-2 border-alert-red"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="section-header text-alert-red text-2xl mb-3">{t('matchmaking_error')}</h3>
          <p className="text-gray-400">{error}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {canFight && loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-neon-green/20 border-t-neon-green rounded-full mx-auto mb-4"
            />
            <p className="text-gray-400 uppercase tracking-wider text-sm">{t('finding_opponents')}</p>
          </div>
        </motion.div>
      )}

      {/* Opponent Selection */}
      {canFight && !loading && !error && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-premium rounded-2xl p-8 border-l-4 border-alert-red"
          >
            <h3 className="section-header text-alert-red text-2xl mb-6 text-center">{t('choose_opponent')}</h3>
            <div className="grid grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">{t('your_fighter')}</p>
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  👊
                </motion.div>
                <p className="text-xl font-bold text-neon-green glow-electric">{fighter?.name}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {fighter?.record.wins}W-{fighter?.record.losses}L-{fighter?.record.draws}D
                </p>
              </div>

              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-6xl font-black text-alert-red glow-crimson"
                >
                  VS
                </motion.div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">
                  {selectedOpponent ? t('selected') : t('choose_below')}
                </p>
                <motion.div
                  className="text-6xl mb-3"
                  animate={{ scale: [1, 0.9, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🥊
                </motion.div>
                <p className="text-xl font-bold text-alert-red">
                  {selectedOpponent?.name || t('select_opponent')}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {opponents.map((opp, idx) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
              >
                <motion.div
                  onClick={() => onSelectOpponent(opp)}
                  className={`cursor-pointer transition-all ${
                    selectedOpponent?.id === opp.id ? 'ring-4 ring-neon-green rounded-2xl' : ''
                  }`}
                  whileHover={{ scale: 1.03 }}
                >
                  <OpponentCard opponent={opp} />
                </motion.div>

                {selectedOpponent?.id === opp.id && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={onStartBattle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full mt-4 py-4 bg-gradient-to-r from-neon-green to-emerald-400 text-black font-bold uppercase tracking-wider rounded-lg hover:shadow-xl hover:shadow-neon-green/60 transition-all text-lg"
                  >
                    ⚡ {t('start_fight').toUpperCase()}
                  </motion.button>
                )}
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </motion.div>
  );
};
