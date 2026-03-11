import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, validateUsername } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Lock, User, AtSign, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import { Loader } from '@/components/ui/Loader';

const Register = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Валидация username в реальном времени
    if (name === 'username') {
      const validation = validateUsername(value);
      setUsernameError(validation.valid ? '' : validation.error || '');
    }
  };

  const getRegisterErrorMessage = (err: unknown) => {
    const apiError = err as { error?: { statusCode?: number; code?: string; message?: string } } | null;
    const statusCode = apiError?.error?.statusCode;
    const code = apiError?.error?.code;

    if (statusCode === 409 || code === "CONFLICT") {
      return t("registerError");
    }

    return apiError?.error?.message || t("registerError");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      setError(t("auth.allFieldsRequired"));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (formData.password.length < 6) {
      setError(t("passwordError"));
      return;
    }

    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.valid) {
      setError(usernameValidation.error || t("usernameError"));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(formData.email, formData.password, formData.name, formData.username);
      navigate('/feed');
    } catch (err: unknown) {
      setError(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-1 mt-1 flex justify-center"
          >
            <Loader size={48} />
          </motion.div>
          <h1 className="font-semibold text-2xl text-white">
            {t("register")}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            {t("joinNetwork")}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-sm text-white/70"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-white">
              {t("name")}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="glass-input w-full pl-10 pr-4 py-3 text-sm text-white"
                placeholder={t("enterName")}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="glass-input w-full pl-10 pr-4 py-3 text-sm text-white"
                placeholder={t("enterEmail")}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-white">
              {t("username")}
            </label>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`glass-input w-full pl-10 pr-4 py-3 text-sm text-white ${usernameError ? 'border-red-200/40' : ''}`}
                placeholder={t("chooseUsername")}
              />
            </div>
            {usernameError && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-1 text-xs text-red-200"
              >
                {usernameError}
              </motion.p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white">
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="glass-input w-full pl-10 pr-10 py-3 text-sm text-white"
                placeholder={t("createPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-white">
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="glass-input w-full pl-10 pr-10 py-3 text-sm text-white"
                placeholder={t("confirmPasswordPlaceholder")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            className="btn-glass w-full"
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("creatingAccount")}...
              </span>
            ) : (
              t("createAccount")
            )}
          </motion.button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-white/60">
          <p>
            {t("hasAccount")}{' '}
            <Link to="/login" className="font-medium text-white hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default Register;
