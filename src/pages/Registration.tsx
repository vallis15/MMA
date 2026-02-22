import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const Registration: React.FC = () => {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError(t('all_fields_required'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('invalid_email_format'));
      return false;
    }
    if (password.length < 8) {
      setError(t('password_min_8'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('passwords_no_match'));
      return false;
    }
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-secondary to-dark-bg flex items-center justify-center p-4">
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
            className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-green-400 mb-2"
          >
            {t('mma_manager')}
          </motion.div>
          <p className="text-gray-400">{t('create_fighter_account')}</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-secondary border border-neon-green/20 rounded-lg p-8 backdrop-blur-sm"
        >
          {!success ? (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-neon-green" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('placeholder_email_short')}
                    className="w-full bg-dark-tertiary border border-dark-tertiary focus:border-neon-green pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neon-green" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('placeholder_min_8_chars')}
                    className="w-full bg-dark-tertiary border border-dark-tertiary focus:border-neon-green pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">{t('confirm_password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neon-green" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('placeholder_confirm_password')}
                    className="w-full bg-dark-tertiary border border-dark-tertiary focus:border-neon-green pl-10 pr-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Show Password Checkbox */}
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4"
                />
                {t('show_password')}
              </label>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-alert-red/20 border border-alert-red/50 rounded-lg text-alert-red text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              {/* Sign Up Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-neon-green to-green-400 text-dark-bg font-bold rounded-lg hover:shadow-lg hover:shadow-neon-green/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {t('creating_account')}
                  </>
                ) : (
                  t('create_account')
                )}
              </motion.button>

              {/* Login Link */}
              <p className="text-center text-gray-400 text-sm">
                {t('already_have_account')}{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-neon-green hover:underline font-semibold"
                >
                  {t('login_here')}
                </button>
              </p>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
              <h2 className="text-xl font-bold text-neon-green mb-2">{t('account_created')}</h2>
              <p className="text-gray-400 mb-4">
                {t('check_email_confirm')}
              </p>
              <div className="w-8 h-8 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin mx-auto" />
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          {t('terms_and_privacy')}
        </p>
      </motion.div>
    </div>
  );
};
