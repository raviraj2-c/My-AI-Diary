import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { Button, Card } from '../common';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset request failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 shadow-xl border-border dark:border-ink-800 text-center">
        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-sky-100 dark:bg-ink-800 text-primary-600 dark:text-primary-300 mb-4">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('auth.requestReceivedTitle')}</h2>
        <p className="mt-3 text-sm text-muted dark:text-muted leading-relaxed">
          {t('auth.requestReceivedDesc')}
        </p>
        <p className="mt-2 text-xs text-muted dark:text-muted">
          {t('auth.checkSpamDesc')}
        </p>
        <Button
          onClick={onBack}
          variant="secondary"
          size="md"
          className="mt-6 w-full"
        >
          {t('auth.backToSignIn')}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8 shadow-xl border-border dark:border-ink-800">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted dark:text-muted hover:text-ink-800 dark:hover:text-border mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('auth.backToSignIn')}
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-sky-100 dark:bg-ink-800 rounded-2xl mb-3 text-primary-600 dark:text-primary-400">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('auth.resetPasswordTitle')}</h2>
        <p className="text-sm text-muted dark:text-muted mt-1">
          {t('auth.resetPasswordSubtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-danger-soft/10 border border-danger-soft/30 rounded-xl text-sm text-danger-soft dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-1.5">
            {t('auth.emailLabel')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-sm text-ink-900 dark:text-sky-100 placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors"
              placeholder="you@example.com"
              autoComplete="email"
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
          {loading ? t('auth.sendingLink') : t('auth.sendResetLink')}
        </Button>
      </form>
    </Card>
  );
};
