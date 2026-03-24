import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useFighter } from '../context/FighterContext';
import { useLanguage } from '../context/LanguageContext';
import { useFight, HealthStatus, BattleLogEntry, FightPhase, BodyPart, DOMAIN_COLORS, RoundResult } from '../context/FightContext';
import { OpponentCard } from '../components/OpponentCard';
import { FighterVisual } from '../components/FighterVisual';
import { AIFighter, VisualConfig } from '../types';
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
    currentAttacker, roundStats, totalStats, activeSkillPopup, selectedOpponent, shakeIntensity,
    roundBreak, roundBreakCountdown,
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
          .select('id, username, reputation, wins, losses, draws, strength, speed, cardio, striking, grappling, visual_config')
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
          // Use DB stored config or generate a unique random one so each opponent looks different
          visual_config: (p.visual_config as VisualConfig | null) ?? generateRandomVisualConfig(),
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
              totalStats={totalStats}
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
              totalStats={totalStats}
              fightPhase={fightPhase}
              groundAttackerName={groundAttackerName}
              lastPlayerHitPart={lastPlayerHitPart}
              lastOpponentHitPart={lastOpponentHitPart}
              lastPlayerHitCategory={lastPlayerHitCategory}
              lastOpponentHitCategory={lastOpponentHitCategory}
              currentAttacker={currentAttacker}
              groundTopFighter={groundTopFighter}
              activeSkillPopup={activeSkillPopup}
              roundBreak={roundBreak}
              roundBreakCountdown={roundBreakCountdown}
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

// ============ VISUAL HELPERS ============

/** Generate a unique random visual config for NPC opponents */
function generateRandomVisualConfig(): VisualConfig {
  const bodyIds = [1, 2, 3, 4, 5, 6, 7, 8] as const;
  const skinIds = ['light', 'fair', 'medium', 'olive', 'dark', 'deep'] as const;
  // 0 = bald (appears twice for higher weight)
  const hairIds = [0, 0, 2, 3, 4, 5, 6, 7, 8, 9] as const;
  const hairColorIds = ['black', 'darkbrown', 'brown', 'auburn', 'blond', 'gray'] as const;
  // 0 = no beard (appears twice for higher weight)
  const beardIds = [0, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
  return {
    bodyId: pick(bodyIds),
    skinToneId: pick(skinIds),
    hairId: pick(hairIds),
    hairColor: pick(hairColorIds),
    beardId: pick(beardIds),
  };
}

/** HP → neon color for zone mini-bars */
const getZoneNeonColor = (hp: number): string => {
  if (hp <= 0)  return '#2a0000';
  if (hp <= 20) return '#ff1744';
  if (hp <= 40) return '#ff3d00';
  if (hp <= 60) return '#ff9100';
  if (hp <= 80) return '#c6ff00';
  return '#00e5ff';
};

const combatShakeVariants = {
  idle:  { x: 0, y: 0 },
  shake: {
    x: [0, -9, 11, -11, 9, -7, 7, -4, 4, 0],
    y: [0, 4, -5, 4, -3, 3, -2, 2, -1, 0],
    transition: { duration: 0.20, ease: 'linear' },
  },
};

// ============ ARENA COMBATANT – replaces FighterSilhouette ============

interface ArenaCombatantProps {
  visualConfig?: VisualConfig | null;
  name: string;
  healthStatus: HealthStatus;
  lastHitPart: BodyPart | null;
  lastHitCategory?: string | null;
  isAttacking: boolean;
  isPlayer: boolean;
  stance: FightPhase;
  groundPosition?: 'TOP' | 'BOTTOM' | null;
  mirror?: boolean;
}

const ArenaCombatant: React.FC<ArenaCombatantProps> = ({
  visualConfig,
  name,
  healthStatus,
  lastHitPart,
  lastHitCategory,
  isAttacking,
  isPlayer,
  stance,
  groundPosition,
  mirror = false,
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const shakeControls = useAnimation();

  const resolvedConfig: VisualConfig = visualConfig ?? { bodyId: 1, skinToneId: 'medium' };
  const accentColor = isPlayer ? '#00e5ff' : '#ff1744';
  const nameColor   = isPlayer ? '#00e5ff' : '#ff4444';
  const isGround    = stance === 'GROUND';
  const isDominant  = isGround && groundPosition === 'TOP';

  // Damage flash: red filter on each hit
  useEffect(() => {
    if (!lastHitPart) return;
    setIsFlashing(true);
    const t = setTimeout(() => setIsFlashing(false), 200);
    return () => clearTimeout(t);
  }, [lastHitPart]);

  // Full-body shake on critical/finisher
  useEffect(() => {
    if (lastHitCategory === 'CRITICAL_HIT' || lastHitCategory === 'FINISHER') {
      shakeControls.start('shake').then(() => shakeControls.start('idle'));
    }
  }, [lastHitCategory, shakeControls]);

  // Preload fighter images so they're ready when the fight starts
  useEffect(() => {
    const { bodyId, hairId = 0, beardId = 0 } = resolvedConfig;
    const urls: string[] = [`/images/body0${bodyId}.png`];
    if (hairId > 1) urls.push(`/images/hair${String(hairId).padStart(2, '0')}.png`);
    if (beardId > 1) urls.push(`/images/beard${String(beardId).padStart(2, '0')}.png`);
    resolvedConfig.tattoos?.forEach((t) => urls.push(`/images/${t.id}.png`));
    urls.forEach((url) => { const img = new window.Image(); img.src = url; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Combined filter: glow when attacking + red flash when hit
  const filterParts: string[] = [];
  if (isAttacking) filterParts.push(`drop-shadow(0 0 18px ${accentColor}bb) drop-shadow(0 0 8px ${accentColor}66)`);
  if (isFlashing)  filterParts.push('brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)');
  const combinedFilter = filterParts.join(' ') || undefined;

  return (
    <div className="flex flex-col items-center gap-2 select-none w-full">
      {/* Ground position badge */}
      <AnimatePresence>
        {isGround && groundPosition && (
          <motion.div
            key="ground-badge"
            initial={{ opacity: 0, y: -8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.8 }}
            className={`text-[9px] font-black tracking-widest uppercase px-3 py-0.5 rounded-full border ${
              groundPosition === 'TOP'
                ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            {groundPosition === 'TOP' ? '▲ TOP' : '▼ BOTTOM'}
          </motion.div>
        )}
      </AnimatePresence>

      {/*
       * Fighter visual – ground layout wrapper.
       * When isGround: fixed-height container (overflow:visible) reserves layout
       * space while the fighter rotates 90° so they appear lying on the mat.
       * Player rotates +90° (head toward center); opponent's outer scaleX(-1)
       * mirrors the rotation so they face inward from the right side too.
       */}
      <div style={isGround ? {
        height: 110,
        width: '100%',
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      } : undefined}>
        {/* Flip wrapper keeps name/bars unmirrored */}
        <div style={{ transform: mirror ? 'scaleX(-1)' : undefined }}>
          <motion.div
            variants={combatShakeVariants}
            animate={shakeControls}
            className="relative"
            style={isGround ? {
              transform: 'rotate(90deg) scale(0.70)',
              transformOrigin: 'center center',
            } : undefined}
          >
            {/* Dominant ground pulse ring */}
            {isDominant && (
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-full"
                animate={{
                  boxShadow: [
                    `0 0 0 0 ${accentColor}00`,
                    `0 0 0 14px ${accentColor}44`,
                    `0 0 0 0 ${accentColor}00`,
                  ],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Glow + damage flash applied to the full layered visual stack
                (Body + Hair + Beard + Tattoos all receive the effect) */}
            <div
              style={{
                filter: combinedFilter,
                transition: 'filter 0.08s ease',
                // z-index: fighters sit above background, below floating UI
                position: 'relative',
                zIndex: 1,
              }}
            >
              <FighterVisual
                config={resolvedConfig as any}
                height={220}
                disableAnimation={false}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Name + Stamina bar */}
      <div className="w-full" style={{ maxWidth: 140 }}>
        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest mb-1">
          <span style={{ color: nameColor, textShadow: `0 0 8px ${nameColor}88` }}>
            {name.length > 10 ? name.slice(0, 10) + '…' : name}
          </span>
          <span
            className={healthStatus.stamina < 25 ? 'animate-pulse' : ''}
            style={{ color: healthStatus.stamina < 25 ? '#ff1744' : '#00e5ff' }}
          >
            ⚡{Math.ceil(healthStatus.stamina)}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: healthStatus.stamina < 25
                ? 'linear-gradient(90deg,#ff1744,#ff4444)'
                : healthStatus.stamina < 50
                  ? 'linear-gradient(90deg,#ff9100,#ffab40)'
                  : 'linear-gradient(90deg,#00b8d9,#00e5ff)',
              boxShadow: healthStatus.stamina < 25 ? '0 0 6px #ff174488' : '0 0 4px #00e5ff55',
            }}
            animate={{ width: `${Math.max(0, healthStatus.stamina)}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 16 }}
          />
        </div>
      </div>

      {/* Zone HP mini-bars: HEAD / BODY / LEGS */}
      <div className="w-full space-y-0.5" style={{ maxWidth: 140 }}>
        {(['head', 'body', 'legs'] as BodyPart[]).map((zone) => {
          const hp     = healthStatus[zone];
          const stroke = getZoneNeonColor(hp);
          const label  = zone === 'head' ? 'HEAD' : zone === 'body' ? 'BODY' : 'LEGS';
          return (
            <div key={zone} className="flex items-center gap-1">
              <span className="text-[8px] font-bold w-7 uppercase"
                    style={{ color: 'rgba(130,140,150,0.7)' }}>
                {label}
              </span>
              <div className="flex-1 h-[3px] rounded-full overflow-hidden"
                   style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: stroke, boxShadow: `0 0 4px ${stroke}66` }}
                  animate={{ width: `${Math.max(0, hp)}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                />
              </div>
              <span className="text-[8px] font-mono w-5 text-right"
                    style={{ color: hp <= 20 ? '#ff1744' : 'rgba(130,140,150,0.6)' }}>
                {Math.ceil(hp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
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
  /** Cumulative stats for the whole fight. */
  totalStats: RoundResult;
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
  /** Inter-round break state */
  roundBreak: boolean;
  roundBreakCountdown: number;
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
  totalStats,
  fightPhase,
  groundAttackerName,
  lastPlayerHitPart,
  lastOpponentHitPart,
  lastPlayerHitCategory,
  lastOpponentHitCategory,
  currentAttacker,
  groundTopFighter,
  activeSkillPopup,
  roundBreak,
  roundBreakCountdown,
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
      className="space-y-4 relative"
    >
      {/* ─── INTER-ROUND BREAK OVERLAY ─────────────────────────────────────────── */}
      <AnimatePresence>
        {roundBreak && (
          <motion.div
            key="round-break-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
          >
            {/* ROUND NUMBER banner */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="text-center mb-8"
            >
              <p
                className="text-[10px] font-black uppercase tracking-[0.4em] mb-3"
                style={{ color: '#00e5ff88' }}
              >
                ● END OF ROUND {currentRound}
              </p>
              <div
                className="text-[7rem] md:text-[10rem] font-black leading-none"
                style={{
                  fontFamily: 'Oswald, Impact, sans-serif',
                  WebkitTextStroke: '2px #00e5ff',
                  color: 'transparent',
                  textShadow: '0 0 60px rgba(0,229,255,0.4)',
                  letterSpacing: '-0.02em',
                }}
              >
                ROUND {currentRound + 1}
              </div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.4em] mt-4"
                style={{ color: '#00e5ffaa' }}
              >
                BEGINS IN {roundBreakCountdown}s
              </p>
            </motion.div>

            {/* Corner advice cards */}
            <div className="flex gap-6 w-full max-w-2xl px-6">
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex-1 rounded-2xl p-5 border"
                style={{ border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.06)' }}
              >
                <p className="text-[9px] font-black uppercase tracking-wider mb-2" style={{ color: '#00e5ffaa' }}>
                  YOUR CORNER
                </p>
                <p className="text-white font-bold text-sm mb-1">{fighter.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  💧 Hydrate. Breathe deep. Watch for patterns — your opponent telegraphs before striking. Stay composed.
                </p>
              </motion.div>

              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex-1 rounded-2xl p-5 border"
                style={{ border: '1px solid rgba(255,23,68,0.3)', background: 'rgba(255,23,68,0.06)' }}
              >
                <p className="text-[9px] font-black uppercase tracking-wider mb-2" style={{ color: '#ff1744aa' }}>
                  OPPONENT'S CORNER
                </p>
                <p className="text-white font-bold text-sm mb-1">{opponent.name}</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  🥊 Adjust strategy. Find the gaps. Finish strong in round {currentRound + 1}.
                </p>
              </motion.div>
            </div>

            {/* Countdown ring */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center gap-3"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <motion.div
                  key={n}
                  animate={{ scale: roundBreakCountdown === n ? [1, 1.3, 1] : 1, opacity: roundBreakCountdown === n ? 1 : 0.25 }}
                  transition={{ duration: 0.6, repeat: roundBreakCountdown === n ? Infinity : 0 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                  style={{
                    border: '2px solid',
                    borderColor: roundBreakCountdown === n ? '#00e5ff' : '#374151',
                    color: roundBreakCountdown === n ? '#00e5ff' : '#4b5563',
                    boxShadow: roundBreakCountdown === n ? '0 0 12px rgba(0,229,255,0.5)' : 'none',
                  }}
                >
                  {n}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ROUND & TIMER */}
      <motion.div
        className="glass-card-premium rounded-2xl p-6 flex justify-between items-center"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        <div className="text-center flex-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t('round')}</p>
          <p className="text-4xl font-bold text-forge-gold">{currentRound}/3</p>
        </div>

        <div className="text-center flex-1 border-x border-gray-700 px-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{t('time')}</p>
          <motion.div
            className="font-mono text-5xl font-bold text-red-400"
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
            <div className="w-3 h-3 rounded-full bg-forge-gold flex-shrink-0" />
            <div className="flex-1">
              <p className="text-forge-gold font-bold uppercase tracking-widest text-sm">
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
          <ArenaCombatant
            visualConfig={fighter.visual_config}
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
          <div className="glass-card rounded-2xl p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500 mb-3 text-center">Round {currentRound} Stats</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('your_damage')}</p>
                <p className="text-2xl font-bold text-forge-gold">{roundStats.playerDamage}</p>
                <p className="text-xs text-gray-400 mt-0.5">({roundStats.playerHits} {t('hits')})</p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Total: <span className="text-forge-gold/55">{totalStats.playerDamage} dmg / {totalStats.playerHits} hits</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('opponent_damage')}</p>
                <p className="text-2xl font-bold text-red-400">{roundStats.opponentDamage}</p>
                <p className="text-xs text-gray-400 mt-0.5">({roundStats.opponentHits} {t('hits')})</p>
                <p className="text-[10px] text-gray-600 mt-1">
                  Total: <span className="text-red-400/55">{totalStats.opponentDamage} dmg / {totalStats.opponentHits} hits</span>
                </p>
              </div>
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
          <ArenaCombatant
            visualConfig={opponent.visual_config}
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
// Color-coding logic:
//   player  → Neon Green  #4ade80  (player lands a hit / takedown / submission)
//   opponent → Neon Red   #f87171  (player takes damage / opponent attacks)
//   neutral  → Neon Blue  #60a5fa  (dodges, misses, round markers, stun messages)
// Font-weight scales with impact:
//   high   → 900  (CRITICAL_HIT, FINISHER)   + shake animation + background glow
//   medium → 700  (HEAVY_HIT, MEDIUM_HIT, takedowns, submissions)
//   low    → 400  (LIGHT_HIT, misses, dodges)

const LogEntry: React.FC<{ entry: BattleLogEntry }> = ({ entry }) => {
  const [displayedText, setDisplayedText] = useState('');

  // ── Skill trigger gets its own rendering path ────────────────────────────
  const isSkill    = entry.isSkillTrigger === true;
  const skillColor = isSkill && entry.skillDomain ? DOMAIN_COLORS[entry.skillDomain] : null;
  const isRoundSep = entry.message.startsWith('═══');

  // ── Actor / impact derived from the log entry metadata ───────────────────
  const actor  = entry.actor  ?? 'neutral';
  const impact = entry.impact ?? 'low';

  // Base color: skill keeps its domain color; others use actor → color table
  const baseColor: string = isSkill
    ? (skillColor ?? '#ffd600')
    : actor === 'player'
      ? '#4ade80'          // neon green  — player attacking
      : actor === 'opponent'
        ? '#f87171'        // neon red    — opponent attacking
        : '#60a5fa';       // neon blue   — neutral / round info

  const fontWeight = isSkill ? 700 : impact === 'high' ? 900 : impact === 'medium' ? 700 : 400;
  const isCritical = !isSkill && impact === 'high';

  // Subtle background glow for high-impact hits so they jump out of the log
  const bgGlow = isCritical
    ? actor === 'player'
      ? 'rgba(74,222,128,0.08)'
      : actor === 'opponent'
        ? 'rgba(248,113,113,0.08)'
        : 'rgba(96,165,250,0.08)'
    : 'transparent';

  useEffect(() => {
    let currentIndex = 0;
    const fullText   = entry.message;
    // Critical hits type faster for dramatic effect
    const tickDuration = isSkill ? 30 : isCritical ? 38 : 60;

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

  // ── Round separator line ─────────────────────────────────────────────────
  if (isRoundSep) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="my-2 text-center text-[9px] font-black tracking-[0.3em] uppercase"
        style={{ color: '#60a5fa88', borderTop: '1px solid rgba(96,165,250,0.2)', borderBottom: '1px solid rgba(96,165,250,0.2)', padding: '6px 0' }}
      >
        {entry.message}
      </motion.div>
    );
  }

  // ── SKILL TRIGGER — special neon-pulse card ──────────────────────────────
  if (isSkill) {
    const col = skillColor ?? '#ffd600';
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

  // ── Normal combat log entry ───────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      // High-impact hits get a brief horizontal shake on entry
      animate={isCritical
        ? { opacity: 1, x: [-12, 7, -5, 3, 0] }
        : { opacity: 1, x: 0 }
      }
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: isCritical ? 0.35 : 0.25 }}
      style={{
        borderLeft: `${isCritical ? 3 : 2}px solid ${baseColor}${isCritical ? '' : '99'}`,
        paddingLeft: 8,
        paddingTop: 3,
        paddingBottom: 3,
        background: bgGlow,
        // Extra outer glow for critical/finisher lines
        boxShadow: isCritical ? `0 0 8px ${baseColor}22` : 'none',
      }}
    >
      <p
        className="text-xs font-mono leading-relaxed"
        style={{
          color: isCritical ? baseColor : `${baseColor}cc`,
          fontWeight,
          // Slight text-shadow glow on medium+ for readability against dark bg
          textShadow: impact === 'high'
            ? `0 0 10px ${baseColor}88`
            : impact === 'medium'
              ? `0 0 6px ${baseColor}44`
              : 'none',
        }}
      >
        {displayedText}
        {displayedText.length < entry.message.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}
            className="inline-block w-1.5 h-3 ml-0.5 align-middle"
            style={{ background: baseColor }}
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
  totalStats: RoundResult;
  onReset: () => void;
  t: (key: string) => string;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, roundStats, totalStats, onReset, t }) => {
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
        style={{ color: isVictory ? '#C9A84C' : isDraw ? '#fbbf24' : '#8B2020' }}
      >
        {isVictory ? t('victory').toUpperCase() : isDraw ? t('draw').toUpperCase() : t('defeat').toUpperCase()}
      </h1>

      <p className="text-gray-400 text-xl uppercase tracking-widest mb-10">{result.method}</p>

      <div className="grid grid-cols-2 gap-8 mb-10 bg-gray-900/40 p-8 rounded-lg">
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">{t('your_damage')}</p>
          <p className="text-4xl font-bold text-forge-gold">{totalStats.playerDamage}</p>
          <p className="text-sm text-gray-500 mt-2">({totalStats.playerHits} {t('hits')} total)</p>
          <p className="text-xs text-gray-600 mt-1">Last round: {roundStats.playerDamage} dmg / {roundStats.playerHits} hits</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-sm mb-3">{t('opponent_damage')}</p>
          <p className="text-4xl font-bold text-red-400">{totalStats.opponentDamage}</p>
          <p className="text-sm text-gray-500 mt-2">({totalStats.opponentHits} {t('hits')} total)</p>
          <p className="text-xs text-gray-600 mt-1">Last round: {roundStats.opponentDamage} dmg / {roundStats.opponentHits} hits</p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        className="px-10 py-4 bg-gradient-to-r from-forge-gold to-yellow-500 text-iron-dark font-bold uppercase tracking-wider rounded-lg hover:shadow-xl hover:shadow-forge-gold/40 transition-all text-lg"
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
            <Zap size={44} className="text-red-500" />
          </motion.div>
          <h1 className="page-header text-red-400 text-6xl">{t('pvp_arena').toUpperCase()}</h1>
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
            borderColor: !fighter || fighter.name === 'Undefined' ? '#8B2020' : '#C9A84C',
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
              color: !fighter || fighter.name === 'Undefined' ? '#8B2020' : '#C9A84C',
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
          className="glass-card-premium rounded-2xl p-8 text-center border-2 border-red-800"
        >
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="section-header text-red-400 text-2xl mb-3">{t('matchmaking_error')}</h3>
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
              className="w-16 h-16 border-4 border-forge-gold/20 border-t-forge-gold rounded-full mx-auto mb-4"
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
            className="glass-card-premium rounded-2xl p-8 border-l-4 border-red-800"
          >
            <h3 className="section-header text-red-400 text-2xl mb-6 text-center">{t('choose_opponent')}</h3>
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
                <p className="text-xl font-bold text-forge-gold">{fighter?.name}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {fighter?.record.wins}W-{fighter?.record.losses}L-{fighter?.record.draws}D
                </p>
              </div>

              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-6xl font-black text-red-500"
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
                <p className="text-xl font-bold text-red-400">
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
                    selectedOpponent?.id === opp.id ? 'ring-4 ring-forge-gold rounded-2xl' : ''
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
                    className="w-full mt-4 py-4 bg-gradient-to-r from-forge-gold to-yellow-500 text-iron-dark font-bold uppercase tracking-wider rounded-lg hover:shadow-xl hover:shadow-forge-gold/50 transition-all text-lg"
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
