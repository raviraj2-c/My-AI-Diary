import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '../components/Auth/LoginForm';
import { SignUpForm } from '../components/Auth/SignUpForm';
import { ForgotPassword } from '../components/Auth/ForgotPassword';
import { Feather, Heart } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-calm-50 via-warm-50 to-primary-50 dark:from-[#0b1120] dark:via-[#0f172a] dark:to-[#131d31] flex flex-col items-center justify-center p-4 selection:bg-primary-100">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <span className="p-2.5 rounded-2xl bg-primary-500 text-white shadow-soft">
              <Feather className="w-6 h-6" />
            </span>
            <span className="font-serif font-bold text-3xl tracking-tight text-calm-900 dark:text-calm-50">
              {t('common.appName')}
            </span>
          </div>
          <p className="text-sm text-calm-600 dark:text-calm-400 font-sans">
            {t('auth.tagline')}
          </p>
        </div>

        {mode === 'login' && (
          <LoginForm
            onToggleForm={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot')}
          />
        )}

        {mode === 'signup' && (
          <SignUpForm
            onToggleForm={() => setMode('login')}
          />
        )}

        {mode === 'forgot' && (
          <ForgotPassword
            onBack={() => setMode('login')}
          />
        )}

        <footer className="mt-8 text-center text-xs text-calm-500 dark:text-calm-500 flex items-center justify-center gap-1.5">
          <span>{t('auth.footerSafe')}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            {t('auth.madeWith')} <Heart className="w-3 h-3 text-danger-soft fill-danger-soft" />
          </span>
        </footer>
      </div>
    </div>
  );
};
