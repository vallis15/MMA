import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Settings, Bell, LogOut, Zap, Sword, Heart } from 'lucide-react';
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

  // ✅ HARDCODED ADMIN ID - Change this if your auth.uid() has changed
  const ADMIN_ID = 'vallis'; // User email or ID that should be admin
  const HARDCODED_ADMIN_EMAIL = 'admin@admin.com'; // Fallback email to check

  // Ensure admin access with useEffect - with 3-second delay hack
  useEffect(() => {
    console.log('--- ADMIN LOGIN DEBUG ---');
    console.log('🔵 [ADMIN CHECK] Start of admin access verification');
    console.log('🔵 [ADMIN CHECK] isAdmin state:', isAdmin);
    console.log('🔵 [ADMIN CHECK] user object:', user ? { id: user.id, email: user.email } : 'null');
    console.log('🔵 [ADMIN CHECK] Hardcoded expected admin:', ADMIN_ID);
    
    // Check if user has admin status set in context
    if (!isAdmin) {
      const reason = `isAdmin is FALSE - user is not authorized as admin`;
      console.warn(`❌ [ADMIN CHECK] ${reason}`);
      console.warn('🔵 [ADMIN CHECK] Current user info:', user);
      console.warn('🔵 [ADMIN CHECK] localStorage.isAdmin:', localStorage.getItem('isAdmin'));
      console.warn('🔵 [ADMIN CHECK] Redirecting to home page in 3 seconds...');
      setRedirectReason(reason);

      // 3-second delay so user can see the console message
      const timeout = setTimeout(() => {
        console.warn('⏰ [ADMIN CHECK] 3-second delay complete, now redirecting');
        navigate('/', { replace: true });
      }, 3000);

      return () => clearTimeout(timeout);
    }

    console.log('✅ [ADMIN CHECK] isAdmin is TRUE - admin access confirmed!');
    console.log('✅ [ADMIN CHECK] User ID:', user?.id);
    console.log('✅ [ADMIN CHECK] User Email:', user?.email);
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
    console.log('🔵 [ADMIN REFILL] Refilling energy for user:', userId);
    await handleStatEdit(userId, 'energy', 100);
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
    <div className="min-h-screen bg-dark-bg p-6">
      {/* DEBUG INFO PANEL - ALWAYS VISIBLE */}
      {!adminCheckPassed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-yellow-900/40 border-2 border-yellow-500 rounded-lg text-yellow-300 font-mono text-xs"
        >
          <h3 className="font-bold mb-2 text-yellow-400">🔍 ADMIN CHECK FAILED - DEBUG INFO</h3>
          <p className="mb-2">{redirectReason}</p>
          <p className="mb-1">isAdmin: <span className="text-alert-red font-bold">{isAdmin.toString()}</span></p>
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
          className="mb-8 p-4 bg-neon-green/20 border-2 border-neon-green rounded-lg text-neon-green font-mono text-xs"
        >
          <h3 className="font-bold mb-2">✅ ADMIN ACCESS GRANTED</h3>
          <p className="mb-1">Admin User: <span className="text-gray-300">{user?.email}</span></p>
          <p className="mb-1">User ID: <span className="text-gray-300">{user?.id}</span></p>
          <p className="mb-1">isAdmin: <span className="text-neon-green font-bold">true</span></p>
        </motion.div>
      )}
      {/* Main Content - Only show if admin check passed */}
      {!adminCheckPassed ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-alert-red mb-2">Admin Access Required</h2>
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
              className="mb-8 p-4 bg-alert-red/20 border border-alert-red/50 rounded-lg flex items-start gap-3"
            >
              <div className="flex-1">
                <p className="text-alert-red font-bold">⚠️ Database Connection Error</p>
                <p className="text-gray-300 text-sm mt-1">{error}</p>
                <p className="text-gray-400 text-xs mt-2">
                  ℹ️ Make sure the 'profiles' table is created in Supabase. See BACKEND_SETUP.md for instructions.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-alert-red/30 text-alert-red rounded text-xs hover:bg-alert-red/50 transition flex-shrink-0 whitespace-nowrap"
              >
                Retry
              </motion.button>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="flex items-center justify-center min-h-screen">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-12 h-12 border-4 border-neon-green/20 border-t-neon-green rounded-full"></div>
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
              <h1 className="text-4xl font-black text-alert-red mb-2">ADMIN DASHBOARD</h1>
              <p className="text-gray-400">System Control Center</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-alert-red text-white rounded-lg hover:bg-alert-red/80 transition"
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
            <div className="bg-dark-secondary border border-neon-green/20 rounded-lg p-4">
              <Users className="w-6 h-6 text-neon-green mb-2" />
              <div className="text-3xl font-bold text-neon-green">{users?.length || 0}</div>
              <p className="text-gray-400 text-sm">Total Players</p>
            </div>

            <div className="bg-dark-secondary border border-yellow-400/20 rounded-lg p-4">
              <Heart className="w-6 h-6 text-yellow-400 mb-2" />
              <div className="text-3xl font-bold text-yellow-400">
                {users?.reduce((sum, u) => sum + (u?.wins || 0), 0) || 0}
              </div>
              <p className="text-gray-400 text-sm">Total Wins</p>
            </div>

            <div className="bg-dark-secondary border border-blue-400/20 rounded-lg p-4">
              <Sword className="w-6 h-6 text-blue-400 mb-2" />
              <div className="text-3xl font-bold text-blue-400">
                {Math.round(users?.reduce((sum, u) => sum + (u?.striking || 0), 0) / Math.max(users?.length || 1, 1)) || 0}
              </div>
              <p className="text-gray-400 text-sm">Avg Striking</p>
            </div>

            <div className="bg-dark-secondary border border-alert-red/20 rounded-lg p-4">
              <Zap className="w-6 h-6 text-alert-red mb-2" />
              <div className="text-3xl font-bold text-alert-red">
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
                className="bg-dark-secondary border border-dark-tertiary rounded-lg overflow-hidden"
              >
                <div className="p-6 border-b border-dark-tertiary">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-neon-green" />
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
                      <thead className="bg-dark-tertiary text-gray-400 text-xs font-semibold">
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
                              className="border-t border-dark-tertiary hover:bg-dark-tertiary/50 transition cursor-pointer"
                              onClick={() => setSelectedUser(user)}
                            >
                              <td className="px-6 py-3 text-white font-semibold">{username}</td>
                              <td className="px-6 py-3 text-right text-gray-300">
                                {wins}-{losses}-{draws}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <span className="text-neon-green font-bold">{reputation}</span>
                              </td>
                              <td className="px-6 py-3 text-right text-blue-400">{striking}</td>
                              <td className="px-6 py-3 text-right">
                                <span className={energy > 50 ? 'text-neon-green' : 'text-alert-red'}>
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
                className="bg-dark-secondary border border-dark-tertiary rounded-lg p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-alert-red" />
                  Global Announcement
                </h3>
                <div className="space-y-3">
                  <textarea
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    placeholder="Enter announcement message..."
                    className="w-full h-24 bg-dark-tertiary border border-dark-tertiary focus:border-alert-red rounded p-3 text-white placeholder-gray-500 focus:outline-none resize-none"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveAnnouncement}
                    className="w-full py-2 px-4 bg-gradient-to-r from-alert-red to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-alert-red/50 transition"
                  >
                    Broadcast Message
                  </motion.button>
                  <p className="text-xs text-gray-500">Message will appear on all player dashboards</p>
                </div>
              </motion.div>

              {/* User Details / Editor */}
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-dark-secondary border border-neon-green/20 rounded-lg p-6"
                >
                  <h3 className="text-lg font-bold text-neon-green mb-4 flex items-center gap-2">
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
                      className="w-full py-2 px-4 bg-neon-green text-dark-bg font-bold rounded-lg hover:shadow-lg hover:shadow-neon-green/50 transition"
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
                            className="flex-1 bg-dark-tertiary border border-neon-green/30 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-neon-green"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              if (editingStat && editingStat.stat === stat && selectedUser?.id) {
                                handleStatEdit(selectedUser.id, stat, editingStat.value);
                              }
                            }}
                            className="px-2 py-1 bg-neon-green/20 text-neon-green rounded text-xs hover:bg-neon-green/40 transition"
                          >
                            Save
                          </motion.button>
                        </div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowEditor(false)}
                        className="w-full py-2 px-4 bg-dark-tertiary text-gray-300 rounded-lg hover:bg-dark-tertiary/80 transition"
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
