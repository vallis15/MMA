import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('--- ADMIN LOGIN DEBUG ---');
    console.log('🔵 [ADMIN LOGIN] Starting admin login...');
    console.log('🔵 [ADMIN LOGIN] Username entered:', username);
    console.log('🔵 [ADMIN LOGIN] Password length:', password.length);
    
    setError(null);

    if (!username || !password) {
      console.warn('❌ [ADMIN LOGIN] Missing credentials');
      setError('Username and password are required');
      return;
    }

    console.log('🔵 [ADMIN LOGIN] Credentials provided, calling adminLogin()...');
    setLoading(true);
    const success = await adminLogin(username, password);

    console.log('🔵 [ADMIN LOGIN] adminLogin() returned:', success);
    console.log('🔵 [ADMIN LOGIN] localStorage.isAdmin after login:', localStorage.getItem('isAdmin'));

    if (success) {
      navigate('/admin-vallis');
    } else {
      console.error('❌ [ADMIN LOGIN] Login failed! Invalid credentials');
      setError('Invalid admin credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-dark via-iron-mid to-iron-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-orange-500 mb-2"
          >
            ADMIN PANEL
          </motion.div>
          <p className="text-gray-400">Restricted Access</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-iron-mid border border-red-900/25 rounded-lg p-8 backdrop-blur-sm"
        >
          <form onSubmit={handleAdminLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-red-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin username"
                  className="w-full bg-iron-light border border-iron-light focus:border-red-700 pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-red-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full bg-iron-light border border-iron-light focus:border-red-700 pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-red-800 to-orange-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-red-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Accessing Admin Panel...
                </>
              ) : (
                'Enter Admin Panel'
              )}
            </motion.button>

            {/* Back Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex items-center justify-center gap-2 w-full text-gray-400 hover:text-forge-gold text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </form>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-red-400 text-xs text-center"
        >
          ⚠️ Unauthorized access attempts are monitored and logged
        </motion.div>
      </motion.div>
    </div>
  );
};
