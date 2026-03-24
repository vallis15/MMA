import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError(t('email_password_required'));
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  // 3D Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotX = (y - centerY) / 20;
    const rotY = (centerX - x) / 20;
    
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Grid */}
      <motion.div
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
        animate={{ backgroundPosition: ['0px 0px', '50px 50px'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* Glowing Orbs */}
      <motion.div
        className="fixed top-20 left-10 w-60 h-60 bg-forge-gold/8 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed bottom-20 right-10 w-72 h-72 bg-oxblood/5 rounded-full blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo & Title Section */}
        <div className="text-center mb-12">
          {/* CSS Octagon Logo with Lightning */}
          <motion.div
            className="flex justify-center mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative w-24 h-24">
              {/* Octagon Shape */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-20 h-20 border-2 border-forge-gold/70"
                  style={{
                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
                    boxShadow: '0 0 20px #C9A84C, inset 0 0 20px rgba(201, 168, 76, 0.15)',
                  }}
                />
              </div>

              {/* Lightning Bolt Inside */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                style={{ filter: 'drop-shadow(0 0 8px #C9A84C)' }}
              >
                <path
                  d="M50 10 L60 35 L75 35 L50 70 L55 90 L30 50 L15 50 Z"
                  fill="none"
                  stroke="#C9A84C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>

          {/* Main Title with Slam & Shake */}
          <motion.div
            className="slam-animate shake-animate"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring', stiffness: 120 }}
          >
            <h1 className="title-mma text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-forge-gold via-yellow-400 to-forge-gold tracking-wider mb-3">
              {t('mma_manager')}
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-300 font-light tracking-widest uppercase"
          >
            {t('enter_octagon').split(' ').map((word, index) => (
              <span key={index}>
                {index > 0 && ' '}
                {word === 'Octagon' || word === 'oktagonu' || word === 'oktagonu' ? (
                  <span className="text-forge-gold">{word}</span>
                ) : (
                  word
                )}
              </span>
            ))}
          </motion.p>
        </div>

        {/* Form Card with Glass Effect & 3D Tilt */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX: rotateX,
            rotateY: rotateY,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="glass-card-premium rounded-2xl p-8 shadow-2xl tilt-card"
        >
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                {t('email_address')}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-forge-gold/60 group-focus-within:text-forge-gold transition" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('placeholder_email')}
                  className="w-full bg-iron-light/50 border border-iron-light group-focus-within:border-forge-gold/50 pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-600 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                {t('password')}
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-forge-gold/60 group-focus-within:text-forge-gold transition" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('placeholder_password')}
                  className="w-full bg-iron-light/50 border border-iron-light group-focus-within:border-forge-gold/50 pl-12 pr-4 py-3 rounded-lg text-white placeholder-gray-600 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Show Password Checkbox */}
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-500"
              />
              {t('show_password')}
            </label>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm backdrop-blur-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Login Button with Shimmer */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="relative w-full py-3 px-4 font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-iron-dark shimmer-button overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t('entering_arena')}
                  </>
                ) : (
                  t('login')
                )}
              </span>
            </motion.button>

            {/* Sign Up Link */}
            <div className="pt-2">
              <p className="text-center text-gray-400 text-sm">
                {t('new_fighter_question')}{' '}
                <motion.button
                  type="button"
                  onClick={() => navigate('/register')}
                  whileHover={{ scale: 1.05 }}
                  className="text-forge-gold hover:underline font-semibold hover:text-yellow-300 transition"
                >
                  {t('create_account')}
                </motion.button>
              </p>
            </div>
          </form>

          {/* Admin Panel Section */}
          <motion.div
            className="mt-8 pt-8 border-t border-forge-gold/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-center text-gray-500 text-xs uppercase tracking-wider font-semibold mb-4">
              {t('executive_access')}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate('/admin-login')}
              className="pulse-button w-full py-3 px-4 bg-gradient-to-r from-red-900/30 to-orange-700/30 border border-red-800/50 text-red-400 font-semibold rounded-lg hover:from-red-900/40 hover:to-orange-700/40 transition-all uppercase tracking-wider text-sm"
            >
              {t('admin_panel')}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-gray-600 text-xs mt-8 uppercase tracking-wide"
        >
          {t('championship_system')}
        </motion.p>
      </motion.div>
    </div>
  );
};
