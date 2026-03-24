import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Settings, Bell, LogOut, Zap, Sword, Heart, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface UserProfile {
  id: string;
  username?: string;
  avatar_url?: string;
  striking?: number;
  grappling?: number;
  speed?: number;
  strength?: number;
  cardio?: number;
  energy?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  reputation?: number;
  updated_at?: string;
}

const AdminDashboardContent: React.FC = () => {
  const { signOut, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editingStat, setEditingStat] = useState<{ user: string; stat: string; value: number } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [adminCheckPassed, setAdminCheckPassed] = useState(false);
  const [redirectReason, setRedirectReason] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showCharResetConfirm, setShowCharResetConfirm] = useState(false);
  const [charResetLoading, setCharResetLoading] = useState(false);
  const [charResetResult, setCharResetResult] = useState<{ success: boolean; message: string } | null>(null);

  // Ensure admin access with useEffect
  useEffect(() => {
    // Check if user has admin status set in context
    if (!isAdmin) {
      navigate('/', { replace: true });
      return;
    }

    setAdminCheckPassed(true);
  }, [isAdmin, navigate, user]);

  // Load users from Supabase
  useEffect(() => {
    console.log('--- ADMIN LOAD USERS DEBUG ---');
    console.log('🔵 [ADMIN LOAD] Admin check passed:', adminCheckPassed);
    console.log('🔵 [ADMIN LOAD] isAdmin state:', isAdmin);
    
    if (!adminCheckPassed) {
      console.log('🔵 [ADMIN LOAD] Admin check not yet passed, skipping user load');
      return;
    }

    const loadUsers = async () => {
      try {
        console.log('🔵 [ADMIN LOAD] Starting user load from Supabase...');
        setError(null);
        setLoading(true);

        const { data, error: supabaseError } = await supabase
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false });

        if (supabaseError) {
          console.error('❌ [ADMIN LOAD] Supabase error:', supabaseError.message);
          setError(`Database Error: ${supabaseError.message}`);
          setUsers([]);
        } else if (data) {
          console.log('✅ [ADMIN LOAD] Loaded users:', data.length);
          // Filter out invalid/corrupted records
          const validUsers = data.filter((user) => {
            if (!user.id || !user.username) {
              console.warn('⚠️ [ADMIN LOAD] Skipping corrupted user record:', user);
              return false;
            }
            return true;
          });
          console.log('✅ [ADMIN LOAD] Valid users after filtering:', validUsers.length);
          setUsers(validUsers);
        } else {
          console.warn('⚠️ [ADMIN LOAD] No data returned from Supabase');
          setUsers([]);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ [ADMIN LOAD] Connection error:', errorMessage);
        setError(`Connection Error: ${errorMessage}`);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [adminCheckPassed, isAdmin]);

  const handleLogout = async () => {
    console.log('--- ADMIN LOGOUT DEBUG ---');
    console.log('🔵 [ADMIN LOGOUT] Starting logout...');
    console.log('🔵 [ADMIN LOGOUT] User ID:', user?.id);
    console.log('🔵 [ADMIN LOGOUT] User Email:', user?.email);
    
    await signOut();
    
    console.log('✅ [ADMIN LOGOUT] Sign out complete');
    console.log('✅ [ADMIN LOGOUT] isAdmin after logout:', isAdmin);
    console.log('✅ [ADMIN LOGOUT] Redirecting to login...');
    
    navigate('/login', { replace: true });
  };

  const handleStatEdit = async (userId: string, stat: string, value: number) => {
    console.log(`--- ADMIN STAT EDIT DEBUG ---`);
    console.log(`🔵 [ADMIN EDIT] Updating ${stat} for user ${userId} to ${value}`);
    console.log(`🔵 [ADMIN EDIT] Current user making edit: ${user?.email}`);
    
    try {
      if (!userId || !stat) {
        console.error('❌ [ADMIN EDIT] Invalid user or stat for edit');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ [stat]: value, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        console.error(`❌ [ADMIN EDIT] Supabase error:`, error);
        throw error;
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, [stat]: value } : user))
      );
      setEditingStat(null);
      setShowEditor(false);
      console.log(`✅ [ADMIN EDIT] Successfully updated ${stat}`);
    } catch (error) {
      console.error(`❌ [ADMIN EDIT] Error updating ${stat}:`, error);
    }
  };

  const handleEnergyRefill = async (userId: string) => {
    await handleStatEdit(userId, 'energy', 100);
  };

  const DEFAULT_PLAYER_STATS = {
    striking: 40,
    grappling: 40,
    speed: 40,
    strength: 40,
    cardio: 40,
    energy: 100,
    wins: 0,
    losses: 0,
    draws: 0,
    reputation: 0,
    updated_at: new Date().toISOString(),
  };

  const handleResetAllPlayers = async () => {
    setResetLoading(true);
    setResetResult(null);

    const resetPayload = {
      ...DEFAULT_PLAYER_STATS,
      updated_at: new Date().toISOString(),
    };

    const failed: string[] = [];

    // Update each user individually – batch update is blocked by RLS for anon key
    for (const u of users) {
      if (!u.id) continue;
      const { error } = await supabase
        .from('profiles')
        .update(resetPayload)
        .eq('id', u.id);

      if (error) {
        failed.push(u.username ?? u.id);
      }
    }

    if (failed.length === 0) {
      // Reflect changes locally so UI updates immediately
      setUsers((prev) =>
        prev.map((u) => ({ ...u, ...resetPayload }))
      );
      setResetResult({
        success: true,
        message: `✅ Resetováno ${users.length} hráčů. Změny jsou okamžitě aktivní.`,
      });
    } else {
      setResetResult({
        success: false,
        message: `⚠️ ${users.length - failed.length}/${users.length} hráčů resetováno. Selhalo: ${failed.join(', ')}`,
      });
    }

    setResetLoading(false);
    setShowResetConfirm(false);
  };

  // ── Nuclear: reset ALL characters (forces re-onboarding) ────────────────
  const handleResetAllCharacters = async () => {
    setCharResetLoading(true);
    setCharResetResult(null);

    const failed: string[] = [];

    for (const u of users) {
      if (!u.id) continue;

      // Step 1: reset username so legacy name-check in CharacterGate also fails
      const { error: nameError } = await supabase
        .from('profiles')
        .update({ username: 'Undefined', updated_at: new Date().toISOString() })
        .eq('id', u.id);

      if (nameError) { failed.push(u.username ?? u.id); continue; }

      // Step 2: clear visual_config (ignore error if column doesn't exist)
      await supabase
        .from('profiles')
        .update({ visual_config: null, updated_at: new Date().toISOString() })
        .eq('id', u.id);

      // Step 3: set has_character = false (ignore error if column doesn't exist)
      await supabase
        .from('profiles')
        .update({ has_character: false, updated_at: new Date().toISOString() })
        .eq('id', u.id);
    }

    if (failed.length === 0) {
      setUsers(prev => prev.map(u => ({ ...u, username: 'Undefined' })));
      setCharResetResult({ success: true, message: `✅ ${users.length} účtů resetováno. Všichni hráči budou přesměrováni na /create-fighter.` });
    } else {
      setCharResetResult({ success: false, message: `⚠️ ${users.length - failed.length}/${users.length} resetováno. Selhalo: ${failed.join(', ')}` });
    }

    setCharResetLoading(false);
    setShowCharResetConfirm(false);
  };

  const saveAnnouncement = () => {
    console.log('--- ADMIN ANNOUNCEMENT DEBUG ---');
    console.log('🔵 [ADMIN ANNOUNCE] Saving announcement');
    console.log('🔵 [ADMIN ANNOUNCE] Message:', announcement);
    console.log('🔵 [ADMIN ANNOUNCE] Admin user:', user?.email);
    
    if (!announcement.trim()) {
      console.warn('⚠️ [ADMIN ANNOUNCE] Empty announcement');
      return;
    }
    localStorage.setItem('global_announcement', announcement);
    console.log('✅ [ADMIN ANNOUNCE] Announcement saved to localStorage');
    alert('Announcement saved!');
    setAnnouncement('');
  };

  return (
    <div className="min-h-screen bg-iron-dark p-6">
      {/* DEBUG INFO PANEL - ALWAYS VISIBLE */}
      {!adminCheckPassed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-yellow-900/40 border-2 border-yellow-500 rounded-lg text-yellow-300 font-mono text-xs"
        >
          <h3 className="font-bold mb-2 text-yellow-400">🔍 ADMIN CHECK FAILED - DEBUG INFO</h3>
          <p className="mb-2">{redirectReason}</p>
          <p className="mb-1">isAdmin: <span className="text-red-400 font-bold">{isAdmin.toString()}</span></p>
          <p className="mb-1">User: <span className="text-gray-300">{user?.email || 'null'}</span></p>
          <p className="mb-1">localStorage.isAdmin: <span className="text-gray-300">{localStorage.getItem('isAdmin')}</span></p>
          <p className="text-yellow-500 mt-2">⏱️ Redirecting in 3 seconds... Check console for details (F12)</p>
        </motion.div>
      )}

      {/* DEBUG INFO PANEL - WHEN PASSED */}
      {adminCheckPassed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-forge-gold/20 border-2 border-forge-gold rounded-lg text-forge-gold font-mono text-xs"
        >
          <h3 className="font-bold mb-2">✅ ADMIN ACCESS GRANTED</h3>
          <p className="mb-1">Admin User: <span className="text-gray-300">{user?.email}</span></p>
          <p className="mb-1">User ID: <span className="text-gray-300">{user?.id}</span></p>
          <p className="mb-1">isAdmin: <span className="text-forge-gold font-bold">true</span></p>
        </motion.div>
      )}
      {/* Main Content - Only show if admin check passed */}
      {!adminCheckPassed ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Admin Access Required</h2>
            <p className="text-gray-400">Your login is being verified. Check the console (F12) for debug information.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-800/20 border border-red-800/50 rounded-lg flex items-start gap-3"
            >
              <div className="flex-1">
                <p className="text-red-400 font-bold">⚠️ Database Connection Error</p>
                <p className="text-gray-300 text-sm mt-1">{error}</p>
                <p className="text-gray-400 text-xs mt-2">
                  ℹ️ Make sure the 'profiles' table is created in Supabase. See BACKEND_SETUP.md for instructions.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-red-800/30 text-red-400 rounded text-xs hover:bg-red-800/50 transition flex-shrink-0 whitespace-nowrap"
              >
                Retry
              </motion.button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="flex items-center justify-center min-h-screen">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-12 h-12 border-4 border-forge-gold/20 border-t-forge-gold rounded-full"></div>
              </motion.div>
            </div>
          )}

          {/* Main Content */}
          {!loading && (
            <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-between items-center"
          >
            <div>
              <h1 className="text-4xl font-black text-red-400 mb-2">ADMIN DASHBOARD</h1>
              <p className="text-gray-400">System Control Center</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-800/80 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-iron-mid border border-forge-gold/20 rounded-lg p-4">
              <Users className="w-6 h-6 text-forge-gold mb-2" />
              <div className="text-3xl font-bold text-forge-gold">{users?.length || 0}</div>
              <p className="text-gray-400 text-sm">Total Players</p>
            </div>

            <div className="bg-iron-mid border border-yellow-400/20 rounded-lg p-4">
              <Heart className="w-6 h-6 text-yellow-400 mb-2" />
              <div className="text-3xl font-bold text-yellow-400">
                {users?.reduce((sum, u) => sum + (u?.wins || 0), 0) || 0}
              </div>
              <p className="text-gray-400 text-sm">Total Wins</p>
            </div>

            <div className="bg-iron-mid border border-blue-400/20 rounded-lg p-4">
              <Sword className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-3xl font-bold text-blue-400">
                {Math.round(users?.reduce((sum, u) => sum + (u?.striking || 0), 0) / Math.max(users?.length || 1, 1)) || 0}
              </div>
              <p className="text-gray-400 text-sm">Avg Striking</p>
            </div>

            <div className="bg-iron-mid border border-red-800/20 rounded-lg p-4">
              <Zap className="w-6 h-6 text-red-400 mb-2" />
              <div className="text-3xl font-bold text-red-400">
                {Math.round(users?.reduce((sum, u) => sum + (u?.reputation || 0), 0) / Math.max(users?.length || 1, 1)) || 0}
              </div>
              <p className="text-gray-400 text-sm">Avg Reputation</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Users List */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-iron-mid border border-iron-light rounded-lg overflow-hidden"
              >
                <div className="p-6 border-b border-iron-light">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-forge-gold" />
                    Player Management
                  </h2>
                </div>

                {loading ? (
                  <div className="p-6 text-center text-gray-400">Loading users...</div>
                ) : (users?.length || 0) === 0 ? (
                  <div className="p-6 text-center text-gray-400">No users found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-iron-light text-gray-400 text-xs font-semibold">
                        <tr>
                          <th className="px-6 py-3 text-left">Player</th>
                          <th className="px-6 py-3 text-right">W-L-D</th>
                          <th className="px-6 py-3 text-right">Rep</th>
                          <th className="px-6 py-3 text-right">Striking</th>
                          <th className="px-6 py-3 text-right">Energy</th>
                          <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users?.map((user, idx) => {
                          // Safe property access with nullish coalescing
                          const username = user?.username ?? 'Unknown';
                          const wins = user?.wins ?? 0;
                          const losses = user?.losses ?? 0;
                          const draws = user?.draws ?? 0;
                          const reputation = user?.reputation ?? 0;
                          const striking = user?.striking ?? 0;
                          const energy = user?.energy ?? 100;
                          const userId = user?.id;

                          if (!userId) {
                            console.warn('⚠️ [ADMIN TABLE] Skipping user with no ID');
                            return null;
                          }

                          return (
                            <motion.tr
                              key={userId}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="border-t border-iron-light hover:bg-iron-light/50 transition cursor-pointer"
                              onClick={() => setSelectedUser(user)}
                            >
                              <td className="px-6 py-3 text-white font-semibold">{username}</td>
                              <td className="px-6 py-3 text-right text-gray-300">
                                {wins}-{losses}-{draws}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <span className="text-forge-gold font-bold">{reputation}</span>
                              </td>
                              <td className="px-6 py-3 text-right text-blue-400">{striking}</td>
                              <td className="px-6 py-3 text-right">
                                <span className={energy > 50 ? 'text-forge-gold' : 'text-red-400'}>
                                  {Math.ceil(energy)}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-center">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnergyRefill(userId);
                                  }}
                                  className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs hover:bg-yellow-600/40 transition"
                                >
                                  Refill
                                </motion.button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Global Announcement */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-iron-mid border border-iron-light rounded-lg p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-400" />
                  Global Announcement
                </h3>
                <div className="space-y-3">
                  <textarea
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    placeholder="Enter announcement message..."
                    className="w-full h-24 bg-iron-light border border-iron-light focus:border-red-800 rounded p-3 text-white placeholder-gray-500 focus:outline-none resize-none"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveAnnouncement}
                    className="w-full py-2 px-4 bg-gradient-to-r from-red-800 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-red-900/50 transition"
                  >
                    Broadcast Message
                  </motion.button>
                  <p className="text-xs text-gray-500">Message will appear on all player dashboards</p>
                </div>
              </motion.div>

              {/* Reset All Players */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-iron-mid border border-red-800/30 rounded-lg p-6"
              >
                <h3 className="text-lg font-bold text-red-400 mb-1 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Reset hráčů
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Resetuje všem hráčům skóre (W/L/D), statistiky (vše na 40) a energii (100). Pouze pro testovací účely.
                </p>

                {resetResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-3 p-3 rounded text-xs font-semibold ${
                      resetResult.success
                        ? 'bg-forge-gold/10 text-forge-gold border border-forge-gold/30'
                        : 'bg-red-800/10 text-red-400 border border-red-800/30'
                    }`}
                  >
                    {resetResult.message}
                  </motion.div>
                )}

                <AnimatePresence>
                  {!showResetConfirm ? (
                    <motion.button
                      key="reset-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setShowResetConfirm(true); setResetResult(null); }}
                      className="w-full py-2 px-4 bg-red-800/20 text-red-400 border border-red-800/40 font-bold rounded-lg hover:bg-red-800/30 transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset všech hráčů
                    </motion.button>
                  ) : (
                    <motion.div
                      key="confirm-panel"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="space-y-3"
                    >
                      <div className="flex items-start gap-2 p-3 bg-red-800/10 border border-red-800/30 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-400">
                          Tato akce je nevratná! Opravdu chceš resetovat <span className="font-bold">{users.length} hráčů</span>?
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleResetAllPlayers}
                          disabled={resetLoading}
                          className="flex-1 py-2 px-3 bg-red-800 text-white font-bold rounded-lg hover:bg-red-800/80 transition text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {resetLoading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            'Ano, resetovat'
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowResetConfirm(false)}
                          disabled={resetLoading}
                          className="flex-1 py-2 px-3 bg-iron-light text-gray-300 rounded-lg hover:bg-iron-light/80 transition text-sm"
                        >
                          Zrušit
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ── DANGER: Reset All Characters ──────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-iron-mid border-2 border-red-700/60 rounded-lg p-6"
                style={{ boxShadow: '0 0 24px rgba(220,38,38,0.12)' }}
              >
                <h3 className="text-lg font-black text-red-500 mb-1 flex items-center gap-2 uppercase tracking-widest">
                  <AlertTriangle className="w-5 h-5" />
                  DANGER ZONE
                </h3>
                <p className="text-sm font-bold text-white mb-1">Reset All User Characters</p>
                <p className="text-xs text-gray-500 mb-4">
                  Vymaže <span className="text-red-400 font-semibold">visual_config</span> a nastaví <span className="text-red-400 font-semibold">username = 'Undefined'</span> pro všechny účty. Každý hráč bude po přihlášení přesměrován na <code className="text-yellow-400">/create-fighter</code> a nebude mít přístup na dashboard, dokud nedokončí tvorbu postavy.
                </p>

                {charResetResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className={`mb-3 p-3 rounded text-xs font-semibold ${charResetResult.success ? 'bg-forge-gold/10 text-forge-gold border border-forge-gold/30' : 'bg-red-800/10 text-red-400 border border-red-800/30'}`}
                  >
                    {charResetResult.message}
                  </motion.div>
                )}

                <AnimatePresence>
                  {!showCharResetConfirm ? (
                    <motion.button
                      key="char-reset-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setShowCharResetConfirm(true); setCharResetResult(null); }}
                      className="w-full py-3 px-4 bg-red-600 text-white font-black rounded-lg hover:bg-red-500 transition flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      DANGER: Reset All User Characters
                    </motion.button>
                  ) : (
                    <motion.div
                      key="char-confirm-panel"
                      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                      className="space-y-3"
                    >
                      <div className="flex items-start gap-2 p-3 bg-red-950/60 border border-red-700/50 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-red-300 space-y-1">
                          <p className="font-black text-red-400 text-sm">⚠️ NEVRATNÁ AKCE</p>
                          <p>Všechny postavy budou smazány. <span className="font-bold text-white">{users.length} hráčů</span> bude přesměrováno na create-fighter.</p>
                          <p className="text-red-500">Opravdu to chceš spustit?</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={handleResetAllCharacters}
                          disabled={charResetLoading}
                          className="flex-1 py-2 px-3 bg-red-600 text-white font-black rounded-lg hover:bg-red-500 transition text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {charResetLoading ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                              <RotateCcw className="w-4 h-4" />
                            </motion.div>
                          ) : 'ANO, SMAZAT VŠE'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setShowCharResetConfirm(false)}
                          disabled={charResetLoading}
                          className="flex-1 py-2 px-3 bg-iron-light text-gray-300 rounded-lg hover:bg-iron-light/80 transition text-sm"
                        >
                          Zrušit
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* User Details / Editor */}
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-iron-mid border border-forge-gold/20 rounded-lg p-6"
                >
                  <h3 className="text-lg font-bold text-forge-gold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    God Mode Editor
                  </h3>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-semibold">{selectedUser?.username ?? 'Unknown'}</span> | Lv. ~
                      {Math.floor((selectedUser?.reputation ?? 0) / 100)}
                    </p>
                  </div>

                  {!showEditor ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowEditor(true)}
                      className="w-full py-2 px-4 bg-forge-gold text-iron-dark font-bold rounded-lg hover:shadow-lg hover:shadow-forge-gold/50 transition"
                    >
                      Edit Stats
                    </motion.button>
                  ) : (
                    <div className="space-y-3">
                      {['striking', 'grappling', 'speed', 'strength', 'cardio'].map((stat) => (
                        <div key={stat} className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs w-16 capitalize">{stat}:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={selectedUser?.[stat as keyof UserProfile] ?? 0}
                            onChange={(e) => setEditingStat({ user: selectedUser?.id ?? '', stat, value: parseInt(e.target.value) })}
                            className="flex-1 bg-iron-light border border-forge-gold/30 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-forge-gold"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (editingStat && editingStat.stat === stat && selectedUser?.id) {
                                handleStatEdit(selectedUser.id, stat, editingStat.value);
                              }
                            }}
                            className="px-2 py-1 bg-forge-gold/20 text-forge-gold rounded text-xs hover:bg-forge-gold/40 transition"
                          >
                            Save
                          </motion.button>
                        </div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowEditor(false)}
                        className="w-full py-2 px-4 bg-iron-light text-gray-300 rounded-lg hover:bg-iron-light/80 transition"
                      >
                        Done
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  return (
    <ErrorBoundary>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
};
