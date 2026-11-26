import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button, Card } from '../common';

interface SignUpFormProps {
  onToggleForm: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleForm }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSlowNotice(false);
      return;
    }
    const timer = setTimeout(() => setSlowNotice(true), 3500);
    return () => clearTimeout(timer);
  }, [loading]);
  const { register } = useAuth();

  const hasMinLength = password.length >= 8 && password.length <= 72;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your name');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError('Password must be 8-72 characters and contain both letters and numbers');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 shadow-xl border-calm-200/80 dark:border-calm-800">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-calm-100 dark:bg-calm-800 rounded-2xl mb-3 text-calm-700 dark:text-calm-200">
          <Sparkles className="w-7 h-7 text-primary-500" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('auth.registerTitle')}</h2>
        <p className="text-sm text-calm-500 dark:text-calm-400 mt-1">{t('auth.registerSubtitle')}</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-danger-soft/10 border border-danger-soft/30 rounded-xl text-sm text-danger-soft dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-1.5">
            {t('auth.nameLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-calm-400">
              <User className="h-4 w-4" />
            </div>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-sm text-calm-900 dark:text-calm-100 placeholder-calm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-1.5">
            {t('auth.emailLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-calm-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-sm text-calm-900 dark:text-calm-100 placeholder-calm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-1.5">
            {t('auth.passwordLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-calm-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full pl-10 pr-11 py-2.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-sm text-calm-900 dark:text-calm-100 placeholder-calm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-calm-400 hover:text-calm-600 dark:hover:text-calm-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password && (
            <div className="mt-2 flex items-center gap-3 text-xs text-calm-500">
              <span className={`inline-flex items-center gap-1 ${hasMinLength ? 'text-calm-700 dark:text-calm-300 font-medium' : ''}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-primary-600' : 'text-calm-300'}`} />
                {t('auth.charMin')}
              </span>
              <span className={`inline-flex items-center gap-1 ${hasLetter ? 'text-calm-700 dark:text-calm-300 font-medium' : ''}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasLetter ? 'text-primary-600' : 'text-calm-300'}`} />
                {t('auth.letters')}
              </span>
              <span className={`inline-flex items-center gap-1 ${hasNumber ? 'text-calm-700 dark:text-calm-300 font-medium' : ''}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'text-primary-600' : 'text-calm-300'}`} />
                {t('auth.numbers')}
              </span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-1.5">
            {t('auth.confirmNewPasswordLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-calm-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="signup-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-sm text-calm-900 dark:text-calm-100 placeholder-calm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          {loading ? t('auth.registering') : t('auth.registerButton')}
        </Button>

        {slowNotice && (
          <p className="text-xs text-center text-calm-500 dark:text-calm-400 animate-fade-in bg-calm-50 dark:bg-calm-900/40 p-2 rounded-lg border border-calm-200 dark:border-calm-800">
            {t('auth.serverWakeNotice')}
          </p>
        )}
      </form>

      <div className="mt-6 pt-5 border-t border-calm-100 dark:border-calm-800 text-center">
        <p className="text-xs text-calm-600 dark:text-calm-400">
          {t('auth.haveAccountPrompt')}{' '}
          <button
            onClick={onToggleForm}
            className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {t('auth.signInLink')}
          </button>
        </p>
      </div>
    </Card>
  );
};
