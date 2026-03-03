import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, RotateCcw, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFighter } from '../context/FighterContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { LeagueBadge } from '../components/LeagueBadge';
import { getLeagueFromReputation } from '../types';

interface DatabasePlayer {
  id: string;
  username?: string;
  reputation?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  nickname?: string;
  avatarEmoji?: string;
  isAI?: boolean;
}

type SortBy = 'reputation' | 'wins';

export const Rankings: React.FC = () => {
  const { fighter, resetCareer } = useFighter();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortBy>('reputation');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [players, setPlayers] = useState<DatabasePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real players + AI fighters from Supabase
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        console.log('🔵 [RANKINGS] Fetching players + AI fighters from Supabase...');
        setLoading(true);
        setError(null);

        // Fetch real players and AI fighters in parallel
        const [playersRes, aiRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, username, reputation, wins, losses, draws, nickname')
            .order('reputation', { ascending: false }),
          supabase
            .from('leaderboard_fighters')
            .select('id, name, nickname, avatar_emoji, reputation, wins, losses, draws')
            .eq('is_active', true),
        ]);

        if (playersRes.error) {
          console.error('❌ [RANKINGS] Profiles error:', playersRes.error.message);
          setError(`Database error: ${playersRes.error.message}`);
          setPlayers([]);
          return;
        }

        const realPlayers: DatabasePlayer[] = (playersRes.data ?? [])
          .filter(p => p.id && p.username)
          .map(p => ({
            id:         p.id,
            username:   p.username ?? undefined,
            reputation: p.reputation ?? 0,
            wins:       p.wins ?? 0,
            losses:     p.losses ?? 0,
            draws:      p.draws ?? 0,
            nickname:   p.nickname ?? undefined,
            isAI:       false,
          }));

        const aiFighters: DatabasePlayer[] = (aiRes.data ?? []).map(ai => ({
          id:          ai.id,
          username:    ai.name,
          reputation:  ai.reputation ?? 0,
          wins:        ai.wins ?? 0,
          losses:      ai.losses ?? 0,
          draws:       ai.draws ?? 0,
          nickname:    ai.nickname ?? undefined,
          avatarEmoji: ai.avatar_emoji ?? '🥊',
          isAI:        true,
        }));

        const combined = [...realPlayers, ...aiFighters];
        console.log('✅ [RANKINGS] Loaded:', realPlayers.length, 'players +', aiFighters.length, 'AI fighters');
        setPlayers(combined);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ [RANKINGS] Connection error:', msg);
        setError(`Connection error: ${msg}`);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Sort players based on selected criteria
  const sortedPlayers = React.useMemo(() => {
    const sorted = [...players];
    
    if (sortBy === 'reputation') {
      sorted.sort((a, b) => (b.reputation ?? 0) - (a.reputation ?? 0));
    } else if (sortBy === 'wins') {
      sorted.sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
    }

    return sorted;
  }, [players, sortBy]);

  // Find player's rank
  const playerRank = React.useMemo(() => {
    if (!fighter || fighter.name === 'Undefined') return null;
    return sortedPlayers.findIndex((p) => p.username === fighter.name) + 1;
  }, [sortedPlayers, fighter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const getRowHighlight = (isPlayer: boolean) => {
    if (!isPlayer) return '';
    return 'bg-neon-green/10 border-l-4 border-neon-green shadow-lg shadow-neon-green/30';
  };

  const getWinRate = (wins?: number, losses?: number, draws?: number) => {
    const w = wins ?? 0;
    const l = losses ?? 0;
    const d = draws ?? 0;
    const total = w + l + d;
    if (total === 0) return '0%';
    return `${((w / total) * 100).toFixed(1)}%`;
  };

  const handleChallenge = (player: DatabasePlayer) => {
    // Safety check: can't challenge yourself
    if (fighter && player.username === fighter.name) {
      return;
    }

    // Safety check: need energy to fight
    if (!fighter || fighter.currentEnergy < 50) {
      alert(t('need_energy_to_fight'));
      return;
    }

    const rank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;

    // Convert player to opponent format
    const opponent = {
      id: player.id,
      name: player.username || 'Unknown Fighter',
      nickname: player.nickname ?? `Rank #${rank}`,
      record: {
        wins:   player.wins   || 0,
        losses: player.losses || 0,
        draws:  player.draws  || 0,
      },
      stats: {
        strength:  50,
        speed:     50,
        cardio:    50,
        striking:  50,
        grappling: 50,
      },
      avatar:    player.avatarEmoji ?? '🥊',
      health:    100,
      maxHealth: 100,
    };

    // Navigate to Arena with pre-selected opponent
    navigate('/arena', { state: { opponent } });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Trophy className="w-8 h-8 text-neon-green glow-electric" />
            </motion.div>
            <h1 className="page-header text-neon-green glow-electric text-4xl">{t('global_leaderboard')}</h1>
          </div>
          {playerRank && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center glass-card px-8 py-4 rounded-lg border-glow-electric"
            >
              <div className="text-3xl font-black text-neon-green glow-electric">#{playerRank}</div>
              <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t('your_rank')}</div>
            </motion.div>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap gap-2">
          {(['reputation', 'wins'] as const).map((sort) => (
            <motion.button
              key={sort}
              onClick={() => setSortBy(sort)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-lg font-semibold transition-all uppercase tracking-wider text-sm ${
                sortBy === sort
                  ? 'bg-neon-green text-dark-bg shadow-lg shadow-neon-green/50'
                  : 'glass-card text-gray-300 hover:text-neon-green border border-neon-green/20 hover:border-neon-green/50'
              }`}
            >
              {sort === 'reputation' && t('sort_by_reputation')}
              {sort === 'wins' && t('sort_by_wins')}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 glass-card-premium p-5 border-l-4 border-alert-red/80 rounded-lg text-alert-red"
        >
          <p className="font-bold uppercase tracking-wider text-sm mb-1">{t('error_loading_leaderboard')}</p>
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
            <div className="w-12 h-12 border-4 border-neon-green/20 border-t-neon-green rounded-full"></div>
          </motion.div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-0 rounded-2xl overflow-hidden glass-card-premium border border-dark-secondary/30"
        >
          {/* Header Row */}
          <div className="bg-dark-secondary/40 grid grid-cols-1 md:grid-cols-7 gap-4 p-4 font-bold text-gray-400 text-xs uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
            <div className="md:col-span-1 text-center">{t('rank')}</div>
            <div className="md:col-span-2">{t('fighter')}</div>
            <div className="text-right">{t('reputation')}</div>
            <div className="text-right">{t('record')}</div>
            <div className="text-right">{t('win_rate')}</div>
            <div className="text-center">{t('action')}</div>
          </div>

          {/* Data Rows */}
          {sortedPlayers.length === 0 ? (
            <div className="text-center p-8 text-gray-400">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p>{t('no_players_found')}</p>
            </div>
          ) : (
            sortedPlayers.map((player, index) => {
              const isCurrentPlayer = !!(fighter && fighter.name === player.username);
              const wins = player.wins ?? 0;
              const losses = player.losses ?? 0;
              const draws = player.draws ?? 0;
              const reputation = player.reputation ?? 0;
              const league = getLeagueFromReputation(reputation);

              return (
                <motion.div
                  key={player.id}
                  variants={rowVariants}
                  className={`grid grid-cols-1 md:grid-cols-7 gap-4 p-4 border-t border-dark-secondary/30 transition-all table-row-stripe ${getRowHighlight(
                    isCurrentPlayer
                  )}`}
                >
                  {/* Rank */}
                  <div className="md:col-span-1 flex items-center justify-center font-bold">
                    <span className="text-lg">#{index + 1}</span>
                  </div>

                  {/* Fighter Info */}
                  <div className="md:col-span-2 flex items-center gap-3">
                    <span className="text-2xl">{player.avatarEmoji ?? '🥊'}</span>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {player.username}
                        {isCurrentPlayer && (
                          <span className="text-neon-green text-xs font-semibold">({t('you').toUpperCase()})</span>
                        )}
                        {player.isAI && (
                          <span className="px-1.5 py-0.5 bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[9px] font-bold uppercase tracking-widest rounded">AI</span>
                        )}
                      </div>
                      {player.nickname && (
                        <div className="text-gray-500 text-xs italic">"{player.nickname}"</div>
                      )}
                    </div>
                  </div>

                  {/* Reputation */}
                  <div className="text-right flex items-center justify-end gap-2">
                    <span className="text-neon-green font-bold">{reputation}</span>
                    <LeagueBadge league={league} showText={false} />
                  </div>

                  {/* Record */}
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {wins}-{losses}-{draws}
                    </div>
                    <div className="text-gray-400 text-xs">{t('w_l_d')}</div>
                  </div>

                  {/* Win Rate */}
                  <div className="text-right">
                    <span className="text-yellow-400 font-semibold">
                      {getWinRate(wins, losses, draws)}
                    </span>
                  </div>

                  {/* Challenge Button */}
                  <div className="flex items-center justify-center">
                    {isCurrentPlayer ? (
                      <span className="text-gray-600 text-xs">-</span>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleChallenge(player)}
                        disabled={!fighter || fighter.currentEnergy < 50}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                          fighter && fighter.currentEnergy >= 50
                            ? 'bg-gradient-to-r from-alert-red to-orange-500 text-white hover:shadow-lg hover:shadow-alert-red/50'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Swords className="w-3 h-3" />
                        {t('fight_button')}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}

      {/* Info Section */}
      {fighter && fighter.name !== 'Undefined' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-dark-secondary rounded-lg border border-neon-green/30"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* League Info */}
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">{t('your_league')}</div>
              <LeagueBadge league={getLeagueFromReputation(fighter.reputation)} />
              <div className="text-gray-500 text-xs mt-2">
                {fighter.reputation < 500 && t('climb_to_regional_pro')}
                {fighter.reputation >= 500 && fighter.reputation < 2000 && t('climb_to_legend')}
                {fighter.reputation >= 2000 && t('you_are_legend')}
              </div>
            </div>

            {/* Stats */}
            <div className="text-center">
              <Award className="w-6 h-6 text-neon-green mx-auto mb-2" />
              <div className="text-gray-400 text-sm mb-1">{t('total_reputation')}</div>
              <div className="text-2xl font-bold text-neon-green">{fighter.reputation}</div>
            </div>

            {/* Reset Button */}
            <div className="text-center">
              {!showResetConfirm ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-alert-red/20 border border-alert-red/50 text-alert-red rounded-lg hover:bg-alert-red/30 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('reset_career')}
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-2"
                >
                  <p className="text-alert-red text-sm font-bold">{t('are_you_sure')}</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        resetCareer();
                        setShowResetConfirm(false);
                      }}
                      className="px-3 py-1 bg-alert-red text-white text-sm rounded hover:bg-alert-red/80 transition"
                    >
                      {t('yes_reset')}
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1 bg-dark-tertiary text-gray-300 text-sm rounded hover:bg-dark-secondary transition"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {(!fighter || fighter.name === 'Undefined') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center p-8 bg-dark-secondary rounded-lg border border-dark-tertiary"
        >
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">{t('create_fighter_to_rank')}</p>
        </motion.div>
      )}
    </div>
  );
};
