import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useRef } from 'react';
import { Fighter, FighterStats, FighterContextType, TrainingDrill, AIFighter, FightResult, FightRound, FightLog, DetailedFighterStats } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { calculateEnhancedStats, canLearnSkill as checkCanLearnSkill } from '../utils/stats';
import { ALL_SKILLS } from '../constants/skillTree';

// ─── Energy recovery constants ────────────────────────────────────────────────
// 10 stamina per minute = 1 stamina every 6 seconds
const ENERGY_REGEN_PER_MINUTE = 10;
const ENERGY_REGEN_INTERVAL_S = 60 / ENERGY_REGEN_PER_MINUTE; // 6 seconds

// ─── localStorage helpers for offline energy recovery ─────────────────────────
const energyTsKey = (userId: string) => `mma_energy_ts_${userId}`;

const saveEnergyTs = (userId: string, energy: number): void => {
  try {
    localStorage.setItem(energyTsKey(userId), JSON.stringify({ energy, ts: Date.now() }));
  } catch { /* ignore storage errors */ }
};

const loadEnergyTs = (userId: string): { energy: number; ts: number } | null => {
  try {
    const raw = localStorage.getItem(energyTsKey(userId));
    return raw ? (JSON.parse(raw) as { energy: number; ts: number }) : null;
  } catch {
    return null;
  }
};

const FighterContext = createContext<FighterContextType | undefined>(undefined);

export const useFighter = () => {
  const context = useContext(FighterContext);
  if (!context) {
    throw new Error('useFighter must be used within FighterProvider');
  }
  return context;
};

const createDefaultFighter = (): Fighter => ({
  id: '1',
  name: 'Undefined',
  nickname: '',
  country_code: undefined,
  record: { wins: 0, losses: 0, draws: 0 },
  stats: {
    strength: 40,
    speed: 40,
    cardio: 40,
    striking: 40,
    grappling: 40,
  },
  currentEnergy: 100,
  maxEnergy: 100,
  experience: 0,
  reputation: 0,
  health: 100,
  maxHealth: 100,
  createdAt: new Date(),
  skill_points: 1,
  unlocked_skills: [],
  visual_config: undefined,
  has_character: false,
});

interface FighterProviderProps {
  children: ReactNode;
}

export const FighterProvider: React.FC<FighterProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [fighter, setFighter] = useState<Fighter>(createDefaultFighter());
  const [fighterLoading, setFighterLoading] = useState(true);
  const [timeSinceLastRegen, setTimeSinceLastRegen] = useState<number>(0);
  
  // Track last manual update to prevent energy regen from overwriting it
  const lastManualUpdateRef = useRef<number>(0);

  // ─── Enhanced stats (memoized) ─────────────────────────────────────────────
  // Re-computed only when base detailedStats or unlocked_skills change.
  // This is the object that all UI components should read for display.
  const enhancedDetailedStats = useMemo<DetailedFighterStats | null>(() => {
    if (!fighter.detailedStats) return null;
    return calculateEnhancedStats(
      fighter.detailedStats,
      fighter.unlocked_skills,
      ALL_SKILLS,
    );
  }, [fighter.detailedStats, fighter.unlocked_skills]);

  // Load fighter from Supabase when user logs in
  useEffect(() => {
    if (!user || authLoading) {
      console.log('🔵 [FIGHTER LOAD] User not ready. user:', user, 'authLoading:', authLoading);
      setFighter(createDefaultFighter());
      if (!authLoading) setFighterLoading(false);
      return;
    }

    console.log('🔵 [FIGHTER LOAD] User authenticated:', user.id);

    setFighterLoading(true);
    const loadFighterFromSupabase = async () => {
      try {
        console.log('🔵 [FIGHTER LOAD] Querying Supabase for profile ID:', user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('🔵 [FIGHTER LOAD] Supabase response:', { error: error?.message, dataExists: !!data });

        if (error) {
          console.error('❌ [FIGHTER LOAD] Supabase error:', error.message, error.code, error.details);
          setFighter(createDefaultFighter());
          return;
        }

        if (data) {
          console.log('✅ [FIGHTER LOAD] Profile found! Data:', data);
          
          // Convert Supabase profile to Fighter object
          const d10 = (v: unknown) => (typeof v === 'number' && !isNaN(v) ? v : 10);
          const detailedStats: DetailedFighterStats = {
            // Striking
            jab_precision:       d10(data.jab_precision),
            cross_power:         d10(data.cross_power),
            hook_lethality:      d10(data.hook_lethality),
            uppercut_timing:     d10(data.uppercut_timing),
            leg_kick_hardness:   d10(data.leg_kick_hardness),
            high_kick_speed:     d10(data.high_kick_speed),
            spinning_mastery:    d10(data.spinning_mastery),
            elbow_sharpness:     d10(data.elbow_sharpness),
            knee_impact:         d10(data.knee_impact),
            combination_flow:    d10(data.combination_flow),
            // Wrestling
            double_leg_explosion: d10(data.double_leg_explosion),
            single_leg_grit:      d10(data.single_leg_grit),
            sprawl_technique:     d10(data.sprawl_technique),
            clinch_control:       d10(data.clinch_control),
            judo_trips:           d10(data.judo_trips),
            gnp_pressure:         d10(data.gnp_pressure),
            top_control_weight:   d10(data.top_control_weight),
            scramble_ability:     d10(data.scramble_ability),
            // BJJ
            choke_mastery:        d10(data.choke_mastery),
            joint_lock_technique: d10(data.joint_lock_technique),
            submission_defense:   d10(data.submission_defense),
            guard_game:           d10(data.guard_game),
            sweep_technique:      d10(data.sweep_technique),
            submission_chain:     d10(data.submission_chain),
            // Physical / Mental
            cardio:               d10(data.cardio),
            chin_durability:      d10(data.chin_durability),
            fight_iq:             d10(data.fight_iq),
            explosive_burst:      d10(data.explosive_burst),
            recovery_rate:        d10(data.recovery_rate),
            mental_heart:         d10(data.mental_heart),
          };

          const fighterData: Fighter = {
            id: data.id,
            name: data.username || 'Fighter',
            nickname: data.nickname || '',
            country_code: data.country_code || undefined,
            record: {
              wins: data.wins || 0,
              losses: data.losses || 0,
              draws: data.draws || 0,
            },
            stats: {
              strength: data.strength || 40,
              speed: data.speed || 40,
              cardio: data.cardio || 40,
              striking: data.striking || 40,
              grappling: data.grappling || 40,
            },
            currentEnergy: data.energy || 100,
            maxEnergy: 100,
            experience: 0,
            reputation: data.reputation || 0,
            health: 100,
            maxHealth: 100,
            createdAt: data.created_at ? new Date(data.created_at) : new Date(),
            detailedStats,
            // ── Skill Tree ────────────────────────────────────────────────────
            skill_points: typeof data.skill_points === 'number' ? data.skill_points : 0,
            unlocked_skills: Array.isArray(data.unlocked_skills) ? (data.unlocked_skills as string[]) : [],
            // ── Visual / Character (load) ──────────────────────────────────────────────────
            // If has_character is explicitly false OR username was reset to 'Undefined',
            // NEVER fall back to localStorage — the admin wants a forced re-onboard.
            visual_config: (() => {
              if (data.has_character === false || data.username === 'Undefined') return undefined;
              if (data.visual_config != null) return data.visual_config;
              try {
                const local = localStorage.getItem(`visual_config_${user.id}`);
                return local ? JSON.parse(local) : undefined;
              } catch { return undefined; }
            })(),
            has_character: (() => {
              // Explicit false from DB → always false (admin reset)
              if (data.has_character === false) return false;
              // Explicit true from DB
              if (data.has_character === true) return true;
              // Username reset to 'Undefined' → treat as not created
              if (data.username === 'Undefined') return false;
              // Column doesn’t exist — fall back to visual_config / localStorage
              return (data.visual_config != null || !!localStorage.getItem(`visual_config_${user.id}`));
            })(),
          };

          // ── Offline energy recovery ──────────────────────────────────────────
          // Calculate how much energy recovered while the user was logged out
          const storedEnergyTs = loadEnergyTs(user.id);
          const baseEnergy = fighterData.currentEnergy;
          if (storedEnergyTs && baseEnergy < fighterData.maxEnergy) {
            const elapsedSec = (Date.now() - storedEnergyTs.ts) / 1000;
            const offlineRecovered = Math.floor(elapsedSec / ENERGY_REGEN_INTERVAL_S);
            if (offlineRecovered > 0) {
              fighterData.currentEnergy = Math.min(
                fighterData.maxEnergy,
                baseEnergy + offlineRecovered,
              );
              console.log(`✅ [OFFLINE REGEN] Recovered ${offlineRecovered} energy after ${Math.round(elapsedSec)}s offline. New energy: ${fighterData.currentEnergy}`);
            }
          }

          console.log('✅ [FIGHTER LOAD] Fighter object created:', fighterData);
          setFighter(fighterData);
          setFighterLoading(false);
          saveEnergyTs(user.id, fighterData.currentEnergy);

          // Persist offline-recovered energy back to Supabase
          if (fighterData.currentEnergy !== baseEnergy) {
            supabase
              .from('profiles')
              .update({ energy: fighterData.currentEnergy, updated_at: new Date().toISOString() })
              .eq('id', user.id)
              .then(({ error: updateErr }) => {
                if (updateErr) console.error('❌ [OFFLINE REGEN] Failed to save recovered energy:', updateErr.message);
                else console.log('✅ [OFFLINE REGEN] Recovered energy saved to Supabase:', fighterData.currentEnergy);
              });
          }
        } else {
          console.warn('⚠️ [FIGHTER LOAD] No data returned, using default fighter');
          setFighter(createDefaultFighter());
          setFighterLoading(false);
        }
      } catch (error) {
        console.error('❌ [FIGHTER LOAD] Exception:', error);
        setFighter(createDefaultFighter());
        setFighterLoading(false);
      }
    };

    loadFighterFromSupabase();
  }, [user, authLoading]);

  // Reload fighter data from Supabase (useful after initialization or updates)
  const reloadFighter = async () => {
    if (!user) {
      console.warn('⚠️ [FIGHTER RELOAD] No user available');
      return;
    }

    console.log('🔵 [FIGHTER RELOAD] Reloading fighter data from Supabase for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ [FIGHTER RELOAD] Supabase error:', error.message);
        return;
      }

      if (data) {
        console.log('✅ [FIGHTER RELOAD] Profile data fetched:', data);

        const d10 = (v: unknown) => (typeof v === 'number' && !isNaN(v) ? v : 10);
        const detailedStats: DetailedFighterStats = {
          jab_precision: d10(data.jab_precision), cross_power: d10(data.cross_power),
          hook_lethality: d10(data.hook_lethality), uppercut_timing: d10(data.uppercut_timing),
          leg_kick_hardness: d10(data.leg_kick_hardness), high_kick_speed: d10(data.high_kick_speed),
          spinning_mastery: d10(data.spinning_mastery), elbow_sharpness: d10(data.elbow_sharpness),
          knee_impact: d10(data.knee_impact), combination_flow: d10(data.combination_flow),
          double_leg_explosion: d10(data.double_leg_explosion), single_leg_grit: d10(data.single_leg_grit),
          sprawl_technique: d10(data.sprawl_technique), clinch_control: d10(data.clinch_control),
          judo_trips: d10(data.judo_trips), gnp_pressure: d10(data.gnp_pressure),
          top_control_weight: d10(data.top_control_weight), scramble_ability: d10(data.scramble_ability),
          choke_mastery: d10(data.choke_mastery), joint_lock_technique: d10(data.joint_lock_technique),
          submission_defense: d10(data.submission_defense), guard_game: d10(data.guard_game),
          sweep_technique: d10(data.sweep_technique), submission_chain: d10(data.submission_chain),
          cardio: d10(data.cardio), chin_durability: d10(data.chin_durability),
          fight_iq: d10(data.fight_iq), explosive_burst: d10(data.explosive_burst),
          recovery_rate: d10(data.recovery_rate), mental_heart: d10(data.mental_heart),
        };

        const fighterData: Fighter = {
          id: data.id,
          name: data.username || 'Fighter',
          nickname: data.nickname || '',
          country_code: data.country_code || undefined,
          record: {
            wins: data.wins || 0,
            losses: data.losses || 0,
            draws: data.draws || 0,
          },
          stats: {
            strength: data.strength || 40,
            speed: data.speed || 40,
            cardio: data.cardio || 40,
            striking: data.striking || 40,
            grappling: data.grappling || 40,
          },
          currentEnergy: data.energy || 100,
          maxEnergy: 100,
          experience: fighter?.experience || 0,
          reputation: data.reputation || 0,
          health: 100,
          maxHealth: 100,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
          detailedStats,
          // ── Skill Tree ──────────────────────────────────────────────────
          skill_points: typeof data.skill_points === 'number' ? data.skill_points : 0,
          unlocked_skills: Array.isArray(data.unlocked_skills) ? (data.unlocked_skills as string[]) : [],
          // ── Visual / Character (reload) ───────────────────────────────────────
          visual_config: (() => {
            if (data.has_character === false || data.username === 'Undefined') return undefined;
            if (data.visual_config != null) return data.visual_config;
            try {
              const local = localStorage.getItem(`visual_config_${user.id}`);
              return local ? JSON.parse(local) : undefined;
            } catch { return undefined; }
          })(),
          has_character: (() => {
            if (data.has_character === false) return false;
            if (data.has_character === true) return true;
            if (data.username === 'Undefined') return false;
            return (data.visual_config != null || !!localStorage.getItem(`visual_config_${user.id}`));
          })(),
        };

        console.log('✅ [FIGHTER RELOAD] Fighter object updated:', fighterData);
        setFighter(fighterData);
      }
    } catch (error) {
      console.error('❌ [FIGHTER RELOAD] Exception:', error);
    }
  };

  const updateFighter = async (updates: Partial<Fighter>): Promise<void> => {
    if (!user || !fighter.id) {
      console.warn('⚠️ [FIGHTER UPDATE] Cannot update: user:', user, 'fighterId:', fighter.id);
      return;
    }

    const updateData = {
      striking:    updates.stats?.striking   ?? fighter.stats.striking,
      grappling:   updates.stats?.grappling  ?? fighter.stats.grappling,
      speed:       updates.stats?.speed      ?? fighter.stats.speed,
      strength:    updates.stats?.strength   ?? fighter.stats.strength,
      cardio:      updates.stats?.cardio     ?? fighter.stats.cardio,
      energy:      updates.currentEnergy     ?? fighter.currentEnergy,
      wins:        updates.record?.wins      ?? fighter.record.wins,
      losses:      updates.record?.losses    ?? fighter.record.losses,
      draws:       updates.record?.draws     ?? fighter.record.draws,
      reputation:  updates.reputation        ?? fighter.reputation,
      experience:  updates.experience        ?? fighter.experience,
      nickname:    updates.nickname          ?? fighter.nickname,
      updated_at:  new Date().toISOString(),
    };

    console.log('🔵 [FIGHTER UPDATE] Updating profile ID:', user.id);
    console.log('🔵 [FIGHTER UPDATE] Data being sent:', updateData);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('❌ [FIGHTER UPDATE] Supabase error:', error.message, error.code, error.details);
        return;
      }

      console.log('✅ [FIGHTER UPDATE] Success! Updated rows:', data);

      // CRUCIAL: Refetch from Supabase immediately after update to sync local state
      // This prevents stale data from being pushed back to the DB
      console.log('🔵 [FIGHTER UPDATE] Refetching fighter data to sync with DB...');
      await reloadFighter();
      
      // Mark this as a manual update to prevent energy regen from immediately overwriting
      lastManualUpdateRef.current = Date.now();
      console.log('✅ [FIGHTER UPDATE] Local state synced with Supabase');
    } catch (error) {
      console.error('❌ [FIGHTER UPDATE] Exception:', error);
    }
  };

  // Energy regeneration – 10 stamina/min = +1 every 6 seconds, synced to Supabase
  useEffect(() => {
    if (!user) {
      console.log('🔵 [ENERGY REGEN] User not available, skipping energy regeneration');
      return;
    }

    console.log(`🔵 [ENERGY REGEN] Energy regeneration started for user ${user.id} (${ENERGY_REGEN_PER_MINUTE}/min, +1 every ${ENERGY_REGEN_INTERVAL_S}s)`);

    const regenInterval = setInterval(() => {
      setTimeSinceLastRegen((prev) => {
        const newTime = prev + 1;

        // Skip regen for 5 seconds after any manual update to avoid race conditions
        const timeSinceManualUpdate = Date.now() - lastManualUpdateRef.current;
        if (timeSinceManualUpdate < 5000) {
          return newTime;
        }

        // +1 energy every ENERGY_REGEN_INTERVAL_S seconds (10 per minute)
        if (newTime >= ENERGY_REGEN_INTERVAL_S) {
          setFighter((prevFighter) => {
            if (prevFighter.currentEnergy >= prevFighter.maxEnergy) {
              // Already full – just update the timestamp so offline calc stays correct
              saveEnergyTs(user.id, prevFighter.currentEnergy);
              return prevFighter;
            }

            const updated = {
              ...prevFighter,
              currentEnergy: Math.min(prevFighter.maxEnergy, prevFighter.currentEnergy + 1),
            };

            console.log('🔵 [ENERGY REGEN] +1 energy →', updated.currentEnergy);
            // Persist to Supabase
            updateFighter(updated).catch(err =>
              console.error('❌ [ENERGY REGEN] Sync error:', err),
            );
            // Persist timestamp locally so offline recovery works on next login
            saveEnergyTs(user.id, updated.currentEnergy);

            return updated;
          });
          return 0; // reset counter
        }

        return newTime;
      });
    }, 1000); // tick every second

    return () => {
      console.log('🔵 [ENERGY REGEN] Cleaning up energy regeneration interval');
      clearInterval(regenInterval);
    };
  }, [user]);

  const updateFighterStats = async (stats: Partial<FighterStats>) => {
    console.log('🔵 [STAT UPDATE] Updating stats:', stats);
    
    setFighter((prev) => {
      const updated = {
        ...prev,
        stats: {
          ...prev.stats,
          ...stats,
        },
      };
      
      // Fire and forget sync to Supabase
      updateFighter(updated).catch(error => 
        console.error('❌ [STAT UPDATE] Error syncing stats to Supabase:', error)
      );
      
      return updated;
    });
  };

  const updateFighterEnergy = async (amount: number) => {
    console.log('🔵 [ENERGY UPDATE] Updating energy by:', amount);

    // Mark this as a manual update to prevent energy regen from immediately overwriting
    lastManualUpdateRef.current = Date.now();

    setFighter((prev) => {
      const updated = {
        ...prev,
        currentEnergy: Math.max(0, Math.min(prev.maxEnergy, prev.currentEnergy + amount)),
      };

      // Persist timestamp locally so offline recovery knows current energy
      if (user) saveEnergyTs(user.id, updated.currentEnergy);

      // Fire and forget sync to Supabase
      updateFighter(updated).catch(error =>
        console.error('❌ [ENERGY UPDATE] Error syncing energy to Supabase:', error),
      );

      return updated;
    });
  };

  const createFighter = (name: string, nickname: string) => {
    setFighter((prev) => ({
      ...prev,
      name,
      nickname,
      id: `fighter_${Date.now()}`,
      createdAt: new Date(),
    }));
  };

  const addExperience = (amount: number) => {
    setFighter((prev) => ({
      ...prev,
      experience: prev.experience + amount,
    }));
  };

  const fight = (opponent: AIFighter): { success: boolean; message: string; result?: FightResult } => {
    if (!fighter || fighter.name === 'Undefined') {
      return { success: false, message: 'No fighter created yet!' };
    }

    if (fighter.currentEnergy < 50) {
      return { 
        success: false, 
        message: `Not enough energy to fight! Need 50, have ${Math.ceil(fighter.currentEnergy)}` 
      };
    }

    // Generate fight logs and rounds with health tracking
    const logs: FightLog[] = [];
    const rounds: FightRound[] = [];
    let playerRoundsWon = 0;
    let opponentRoundsWon = 0;
    let playerHealth = 100;
    let opponentHealth = 100;

    const addLog = (text: string, playerHealthDrop?: number, opponentHealthDrop?: number) => {
      logs.push({ 
        text, 
        timestamp: logs.length,
        playerHealthDrop: playerHealthDrop || 0,
        opponentHealthDrop: opponentHealthDrop || 0,
      });
      if (playerHealthDrop) playerHealth = Math.max(0, playerHealth - playerHealthDrop);
      if (opponentHealthDrop) opponentHealth = Math.max(0, opponentHealth - opponentHealthDrop);
    };

    // Round 1: Striking
    addLog(`Round 1: ${fighter.name} and ${opponent.name} circle each other.`);
    const strikingFighterScore = fighter.stats.striking + fighter.stats.speed * 0.3;
    const strikingOpponentScore = opponent.stats.striking + opponent.stats.speed * 0.3;
    const rand1 = Math.random();
    const strikingRNG = rand1 < 0.05 ? (strikingFighterScore > strikingOpponentScore ? false : true) : strikingFighterScore > strikingOpponentScore;
    
    if (strikingRNG) {
      addLog(`${fighter.name} lands a devastating combination of strikes!`, 0, 20);
      playerRoundsWon++;
    } else {
      addLog(`${opponent.name} counters with precise striking!`, 20, 0);
      opponentRoundsWon++;
    }
    rounds.push({
      roundNumber: 1,
      playerAction: 'Striking',
      opponentAction: 'Counterstriking',
      playerWon: strikingRNG,
    });

    // Round 2: Grappling
    addLog(`\nRound 2: The fighters close distance.`);
    const grappleFighterScore = fighter.stats.grappling + fighter.stats.strength * 0.3;
    const grappleOpponentScore = opponent.stats.grappling + opponent.stats.strength * 0.3;
    const rand2 = Math.random();
    const grappleRNG = rand2 < 0.05 ? (grappleFighterScore > grappleOpponentScore ? false : true) : grappleFighterScore > grappleOpponentScore;
    
    if (grappleRNG) {
      addLog(`${fighter.name} executes a perfect takedown!`, 0, 25);
      playerRoundsWon++;
    } else {
      addLog(`${opponent.name} maintains their position and controls the clinch.`, 25, 0);
      opponentRoundsWon++;
    }
    rounds.push({
      roundNumber: 2,
      playerAction: 'Grappling',
      opponentAction: 'Clinch Control',
      playerWon: grappleRNG,
    });

    // Round 3: Cardio/Overall
    addLog(`\nRound 3: It's all on the line!`);
    const conditionFighterScore = fighter.stats.cardio;
    const conditionOpponentScore = opponent.stats.cardio;
    const rand3 = Math.random();
    const conditionRNG = rand3 < 0.05 ? (conditionFighterScore > conditionOpponentScore ? false : true) : conditionFighterScore > conditionOpponentScore;
    
    if (conditionRNG) {
      addLog(`${fighter.name} is still strong while ${opponent.name} is fading!`, 0, 30);
      playerRoundsWon++;
    } else {
      addLog(`${opponent.name} shows incredible cardio and dominates the final round!`, 30, 0);
      opponentRoundsWon++;
    }
    rounds.push({
      roundNumber: 3,
      playerAction: 'All-Out Offense',
      opponentAction: 'Tough Defense',
      playerWon: conditionRNG,
    });

    // Check for KO
    if (playerHealth <= 0) {
      addLog(`\n${fighter.name} IS DOWN! KNOCKOUT!`, 0, 0);
    }
    if (opponentHealth <= 0) {
      addLog(`\n${opponent.name} IS DOWN! KNOCKOUT!`, 0, 0);
    }

    // Determine winner and add final log
    const playerWins = playerRoundsWon > opponentRoundsWon;
    let winText = '';
    let reputationGain = 0;

    if (playerWins) {
      winText = `\nIT'S ALL OVER! ${fighter.name.toUpperCase()} WINS BY DOMINANT DECISION!`;
      reputationGain = 50;
    } else {
      winText = `\nWhat a match! ${opponent.name} edges out the decision... ${fighter.name} puts up a valiant effort.`;
      reputationGain = 10;
    }
    addLog(winText);

    // Update fighter
    const newRecord = { ...fighter.record };
    if (playerWins) {
      newRecord.wins += 1;
    } else {
      newRecord.losses += 1;
    }

    const updatedFighter = {
      ...fighter,
      record: newRecord,
      currentEnergy: Math.max(0, fighter.currentEnergy - 50),
      reputation: fighter.reputation + reputationGain,
    };

    console.log('🔵 [FIGHT] Fight complete! Updating fighter state...');
    console.log('🔵 [FIGHT] Result:', { winner: playerWins ? 'player' : 'opponent', reputationGain, newRecord });
    
    setFighter(updatedFighter);

    // Sync to Supabase asynchronously (fire and forget)
    updateFighter(updatedFighter).catch(error => 
      console.error('❌ [FIGHT] Error syncing fight to Supabase:', error)
    );

    console.log('✅ [FIGHT] Synced to Supabase');

    // Add experience
    addExperience(25);

    const result: FightResult = {
      winner: playerWins ? 'player' : 'opponent',
      rounds,
      logs,
      playerStats: {
        wins: playerWins ? newRecord.wins : newRecord.wins - 1,
        reputation: updatedFighter.reputation,
      },
    };

    return { 
      success: true, 
      message: playerWins ? `Victory! You gained ${reputationGain} reputation!` : `Defeat... You gained ${reputationGain} reputation anyway.`,
      result 
    };
  };

  const train = (drill: TrainingDrill): { success: boolean; message: string } => {
    // Check if fighter exists
    if (!fighter || fighter.name === 'Undefined') {
      return { success: false, message: 'No fighter created yet!' };
    }

    // Check if enough energy
    if (fighter.currentEnergy < drill.energyCost) {
      return { 
        success: false, 
        message: `Not enough energy! Need ${drill.energyCost}, have ${Math.ceil(fighter.currentEnergy)}` 
      };
    }

    // Deduct energy
    const newEnergy = fighter.currentEnergy - drill.energyCost;

    // Apply stat increases
    const newStats: FighterStats = { ...fighter.stats };

    drill.benefits.forEach((benefit) => {
      if (benefit.stat === 'all') {
        // Apply to all stats
        newStats.strength = Math.min(100, newStats.strength + benefit.amount);
        newStats.speed = Math.min(100, newStats.speed + benefit.amount);
        newStats.cardio = Math.min(100, newStats.cardio + benefit.amount);
        newStats.striking = Math.min(100, newStats.striking + benefit.amount);
        newStats.grappling = Math.min(100, newStats.grappling + benefit.amount);
      } else {
        // Apply to specific stat
        newStats[benefit.stat] = Math.min(100, newStats[benefit.stat] + benefit.amount);
      }
    });

    // Update fighter
    const updatedFighter = {
      ...fighter,
      currentEnergy: newEnergy,
      stats: newStats,
    };

    console.log('🔵 [TRAIN] Updated fighter state, syncing to Supabase...');
    setFighter(updatedFighter);

    // Sync to Supabase asynchronously (fire and forget)
    updateFighter(updatedFighter).catch(error => 
      console.error('❌ [TRAIN] Error syncing training to Supabase:', error)
    );

    console.log('✅ [TRAIN] Training complete! Stats updated:', { energy: newEnergy, stats: newStats });

    // Add experience
    addExperience(10);

    return { success: true, message: `Training complete! +${drill.benefits.map(b => b.amount).join(', ')} stats!` };
  };

  // ─── Skill Tree: canLearnSkill ─────────────────────────────────────────────
  const canLearnSkill = (skillId: string) =>
    checkCanLearnSkill(fighter, skillId, ALL_SKILLS);

  // ─── Skill Tree: learnSkill ────────────────────────────────────────────────
  const learnSkill = async (skillId: string): Promise<{ success: boolean; message: string }> => {
    const check = checkCanLearnSkill(fighter, skillId, ALL_SKILLS);
    if (!check.canLearn) {
      return { success: false, message: check.reason ?? 'Cannot learn this skill.' };
    }

    if (!user) return { success: false, message: 'Not authenticated.' };

    // Ověř, že hráč má alespoň 1 skill point k útratě
    if ((fighter.skill_points ?? 0) < 1) {
      return { success: false, message: 'Not enough skill points. Keep training!' };
    }

    const newUnlocked   = [...fighter.unlocked_skills, skillId];
    const newSP         = (fighter.skill_points ?? 0) - 1;

    // Optimistic local update first for instant UI feedback
    setFighter(prev => ({
      ...prev,
      unlocked_skills: newUnlocked,
      skill_points:    newSP,
    }));

    console.log('🔵 [SKILL] Unlocking skill:', skillId, '| remaining SP:', newSP);

    const { error } = await supabase
      .from('profiles')
      .update({
        unlocked_skills: newUnlocked,
        skill_points:    newSP,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      // Rollback optimistic update on failure
      console.error('❌ [SKILL] Supabase update failed:', error.message);
      setFighter(prev => ({
        ...prev,
        unlocked_skills: fighter.unlocked_skills,
        skill_points:    fighter.skill_points,
      }));
      return { success: false, message: 'Failed to save skill – please try again.' };
    }

    console.log('✅ [SKILL] Skill unlocked and persisted:', skillId, '| SP remaining:', newSP);
    return { success: true, message: 'Skill unlocked!' };
  };

  const resetCareer = () => {
    const newFighter = createDefaultFighter();
    newFighter.name = fighter.name;
    newFighter.nickname = fighter.nickname;
    
    console.log('🔵 [RESET] Resetting career, syncing to Supabase...');
    setFighter(newFighter);

    // Sync reset to Supabase asynchronously
    updateFighter(newFighter).catch(error => 
      console.error('❌ [RESET] Error syncing career reset to Supabase:', error)
    );
    
    console.log('✅ [RESET] Career reset complete');
  };

  const value: FighterContextType = {
    fighter,
    fighterLoading,
    enhancedDetailedStats,
    timeSinceLastRegen,
    updateFighterStats,
    updateFighterEnergy,
    createFighter,
    addExperience,
    train,
    fight,
    resetCareer,
    reloadFighter,
    canLearnSkill,
    learnSkill,
  };

  return (
    <FighterContext.Provider value={value}>
      {children}
    </FighterContext.Provider>
  );
};
