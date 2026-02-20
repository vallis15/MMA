import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Fighter, FighterStats, FighterContextType, TrainingDrill, AIFighter, FightResult, FightRound, FightLog } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  nickname: 'The Champion',
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
  level: 1,
  experience: 0,
  reputation: 0,
  health: 100,
  maxHealth: 100,
  createdAt: new Date(),
});

interface FighterProviderProps {
  children: ReactNode;
}

export const FighterProvider: React.FC<FighterProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [fighter, setFighter] = useState<Fighter>(createDefaultFighter());
  const [timeSinceLastRegen, setTimeSinceLastRegen] = useState<number>(0);

  // Load fighter from Supabase when user logs in
  useEffect(() => {
    if (!user || authLoading) {
      console.log('🔵 [FIGHTER LOAD] User not ready. user:', user, 'authLoading:', authLoading);
      setFighter(createDefaultFighter());
      return;
    }

    console.log('🔵 [FIGHTER LOAD] User authenticated:', user.id);

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
          const fighterData: Fighter = {
            id: data.id,
            name: data.username || 'Fighter',
            nickname: 'The Champion',
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
            level: data.level || 1,
            experience: 0,
            reputation: data.reputation || 0,
            health: 100,
            maxHealth: 100,
            createdAt: data.created_at ? new Date(data.created_at) : new Date(),
          };
          
          console.log('✅ [FIGHTER LOAD] Fighter object created:', fighterData);
          setFighter(fighterData);
        } else {
          console.warn('⚠️ [FIGHTER LOAD] No data returned, using default fighter');
          setFighter(createDefaultFighter());
        }
      } catch (error) {
        console.error('❌ [FIGHTER LOAD] Exception:', error);
        setFighter(createDefaultFighter());
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

        const fighterData: Fighter = {
          id: data.id,
          name: data.username || 'Fighter',
          nickname: fighter?.nickname || 'The Champion',
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
          level: data.level || 1,
          experience: fighter?.experience || 0,
          reputation: data.reputation || 0,
          health: 100,
          maxHealth: 100,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
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
      striking: updates.stats?.striking ?? fighter.stats.striking,
      grappling: updates.stats?.grappling ?? fighter.stats.grappling,
      speed: updates.stats?.speed ?? fighter.stats.speed,
      strength: updates.stats?.strength ?? fighter.stats.strength,
      cardio: updates.stats?.cardio ?? fighter.stats.cardio,
      energy: updates.currentEnergy ?? fighter.currentEnergy,
      wins: updates.record?.wins ?? fighter.record.wins,
      losses: updates.record?.losses ?? fighter.record.losses,
      draws: updates.record?.draws ?? fighter.record.draws,
      reputation: updates.reputation ?? fighter.reputation,
      level: updates.level ?? fighter.level,
      updated_at: new Date().toISOString(),
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
    } catch (error) {
      console.error('❌ [FIGHTER UPDATE] Exception:', error);
    }
  };

  // Energy regeneration effect - +1 energy every 10 seconds WITH immediate sync
  useEffect(() => {
    if (!user) {
      console.log('🔵 [ENERGY REGEN] User not available, skipping energy regeneration');
      return;
    }

    console.log('🔵 [ENERGY REGEN] Energy regeneration interval started for user:', user.id);

    const regenInterval = setInterval(() => {
      setTimeSinceLastRegen((prev) => {
        const newTime = prev + 1;
        
        // Regenerate energy every 10 seconds
        if (newTime >= 10) {
          setFighter((prevFighter) => {
            const updated = {
              ...prevFighter,
              currentEnergy: Math.min(prevFighter.maxEnergy, prevFighter.currentEnergy + 1),
            };
            
            // Immediately sync regenerated energy to Supabase
            console.log('🔵 [ENERGY REGEN] Syncing regenerated energy:', updated.currentEnergy);
            updateFighter(updated).catch(error => 
              console.error('❌ [ENERGY REGEN] Error syncing regenerated energy:', error)
            );
            
            return updated;
          });
          return 0; // Reset the timer
        }
        
        return newTime;
      });
    }, 1000); // Update every second

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
    
    setFighter((prev) => {
      const updated = {
        ...prev,
        currentEnergy: Math.max(0, Math.min(prev.maxEnergy, prev.currentEnergy + amount)),
      };
      
      // Fire and forget sync to Supabase
      updateFighter(updated).catch(error => 
        console.error('❌ [ENERGY UPDATE] Error syncing energy to Supabase:', error)
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
    setFighter((prev) => {
      const newExp = prev.experience + amount;
      const expPerLevel = 100;
      const newLevel = Math.floor(newExp / expPerLevel) + 1;

      return {
        ...prev,
        experience: newExp,
        level: newLevel,
      };
    });
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
    timeSinceLastRegen,
    updateFighterStats,
    updateFighterEnergy,
    createFighter,
    addExperience,
    train,
    fight,
    resetCareer,
    reloadFighter,
  };

  return (
    <FighterContext.Provider value={value}>
      {children}
    </FighterContext.Provider>
  );
};
