import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/authService';
import { UNLOCKED_KEY } from '../../utils/storage';
import { Lock, KeyRound, AlertCircle, LogOut } from 'lucide-react';
import { Button } from './Button';

export const AppLockScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { logout, user } = useAuth();

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (!settings.appLockEnabled) return false;
    return sessionStorage.getItem(UNLOCKED_KEY) !== 'true';
  });

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot PIN state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');

  const lastActivityRef = useRef<number>(Date.now());

  // Inactivity tracking
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!settings.appLockEnabled || isLocked) return;

    const timeoutMs = (settings.appLockTimeoutMinutes || 5) * 60 * 1000;

    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= timeoutMs) {
        sessionStorage.removeItem(UNLOCKED_KEY);
        setIsLocked(true);
        setPin('');
      }
    }, 15000);

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((ev) => window.addEventListener(ev, resetInactivityTimer, { passive: true }));

    return () => {
      clearInterval(checkInterval);
      events.forEach((ev) => window.removeEventListener(ev, resetInactivityTimer));
    };
  }, [settings.appLockEnabled, settings.appLockTimeoutMinutes, isLocked, resetInactivityTimer]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // If appLockEnabled is toggled off in settings, unlock immediately
  useEffect(() => {
    if (!settings.appLockEnabled) {
      setIsLocked(false);
    }
  }, [settings.appLockEnabled]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (!pin) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await AuthService.verifyAppLock(pin);
      if (res.success) {
        sessionStorage.setItem(UNLOCKED_KEY, 'true');
        setIsLocked(false);
        setPin('');
        setWrongAttempts(0);
        lastActivityRef.current = Date.now();
      } else {
        const nextAttempts = wrongAttempts + 1;
        setWrongAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLockoutSeconds(60);
          setErrorMsg(t('applock.tooManyAttempts'));
        } else {
          setErrorMsg(t('applock.attemptsRemaining', { count: 5 - nextAttempts }));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      if (msg.includes('429') || msg.includes('wait')) {
        setLockoutSeconds(60);
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthService.disableAppLock(accountPassword);
      sessionStorage.setItem(UNLOCKED_KEY, 'true');
      setIsLocked(false);
      setShowForgotModal(false);
      setAccountPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password verification failed';
      setErrorMsg(msg);
    }
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1120] text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#131d31] rounded-3xl p-8 border border-gray-800 shadow-soft-2xl text-center space-y-6 animate-fade-in">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary-950/60 text-primary-400 mx-auto flex items-center justify-center border border-primary-800/60 shadow-soft-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-gray-100">{t('applock.title')}</h2>
          <p className="text-xs text-gray-400 mt-1 font-serif">
            {t('applock.subtitle', { name: user?.name?.split(' ')[0] || 'Friend' })}
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={6}
              autoFocus
              disabled={lockoutSeconds > 0 || isSubmitting}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="••••"
              aria-label="Enter App Lock Passcode"
              className="w-48 mx-auto px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-2xl text-2xl font-mono text-center tracking-[0.5em] text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-danger animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {lockoutSeconds > 0 && (
            <p className="text-xs font-mono text-sky-400">
              {t('applock.waitTime', { seconds: lockoutSeconds })}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!pin || lockoutSeconds > 0}
            loading={isSubmitting}
            className="w-full"
          >
            {t('applock.unlock')}
          </Button>
        </form>

        <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-gray-800/80">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="hover:text-gray-200 underline"
          >
            {t('applock.forgotPin')}
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(UNLOCKED_KEY);
              logout();
            }}
            className="hover:text-gray-200 inline-flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>{t('applock.signOut')}</span>
          </button>
        </div>
      </div>

      {/* Forgot PIN / Reset using Account Password Modal */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#131d31] rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-gray-800 space-y-4 shadow-soft-2xl text-left">
            <div className="flex items-center gap-2 text-primary-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-base font-serif font-bold text-white">{t('applock.resetTitle')}</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('applock.resetDesc')}
            </p>

            <form onSubmit={handleForgotPin} className="space-y-4">
              <input
                type="password"
                placeholder="Account password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0f172a] border border-gray-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-primary-400 outline-none"
                required
              />

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgotModal(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  {t('applock.unlockReset')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
