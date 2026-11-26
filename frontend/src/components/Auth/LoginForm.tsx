import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../common';

interface LoginFormProps {
  onToggleForm: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm, onForgotPassword }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [slowNotice, setSlowNotice] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setSlowNotice(false);
      return;
    }
    const timer = setTimeout(() => setSlowNotice(true), 3500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 shadow-xl border-border dark:border-ink-800">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 dark:bg-primary-950/60 rounded-2xl mb-3 text-primary-600 dark:text-primary-300">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('auth.loginTitle')}</h2>
        <p className="text-sm text-muted dark:text-muted mt-1">{t('auth.loginSubtitle')}</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-danger-soft/10 border border-danger-soft/30 rounded-xl text-sm text-danger-soft dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-1.5">
            {t('auth.emailLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-sm text-ink-900 dark:text-sky-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200">
              {t('auth.passwordLabel')}
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-11 py-2.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-sm text-ink-900 dark:text-sky-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-muted dark:hover:text-border"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full mt-2"
        >
          {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
        </Button>

        {slowNotice && (
          <p className="text-xs text-center text-muted dark:text-muted animate-fade-in bg-sky-50 dark:bg-ink-900 p-2 rounded-lg border border-border dark:border-ink-800">
            {t('auth.serverWakeNotice')}
          </p>
        )}
      </form>

      <div className="mt-6 pt-5 border-t border-sky-100 dark:border-ink-800 text-center">
        <p className="text-xs text-muted dark:text-muted">
          {t('auth.noAccountPrompt')}{' '}
          <button
            onClick={onToggleForm}
            className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
          >
            {t('auth.createOneHere')}
          </button>
        </p>
      </div>
    </Card>
  );
};
