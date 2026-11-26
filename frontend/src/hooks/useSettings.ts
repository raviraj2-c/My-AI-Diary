import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '../types';
import { AuthService } from '../services/authService';
import { getSettingsKey, PUBLIC_THEME_KEY } from '../utils/storage';
import { changeLanguage } from '../i18n';

const defaultSettings: UserSettings = {
  theme: 'system',
  fontSize: 'medium',
  fontFamily: 'inter',
  language: 'en',
  speechLanguage: 'en-US',
  country: 'IN',
  reminderEnabled: false,
  reminderTime: '20:00',
  allowAIFeatures: false,
  allowDiaryAI: false,
  isStudent: false,
  appLockEnabled: false,
  appLockTimeoutMinutes: 5,
  trustedContact: { name: '', phone: '', relation: '' }
};

const resolveTheme = (theme: UserSettings['theme']): 'light' | 'dark' => {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return theme;
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const user = AuthService.getCurrentUser();
    const serverSettings = user?.settings;
    const userId = user?.id;
    const key = getSettingsKey(userId);
    const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    let local: Partial<UserSettings> = {};
    if (saved) {
      try {
        local = JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Server values win over local cached values
    return { ...defaultSettings, ...local, ...(serverSettings || {}) };
  });

  const applyDomSettings = useCallback((currentSettings: UserSettings) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const resolvedTheme = resolveTheme(currentSettings.theme);

    // Apply dark class
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font-size
    root.setAttribute('data-font-size', currentSettings.fontSize);

    // Apply font-family
    root.setAttribute('data-font-family', currentSettings.fontFamily);

    // Save public theme preference for login screen without user data
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(PUBLIC_THEME_KEY, currentSettings.theme);
    }
  }, []);

  useEffect(() => {
    applyDomSettings(settings);
  }, [settings, applyDomSettings]);

  // Synchronize language with i18n on startup and whenever settings.language changes
  useEffect(() => {
    if (settings.language) {
      changeLanguage(settings.language as 'en' | 'hi');
    }
  }, [settings.language]);

  // Listen for background server settings synchronization (from login / /auth/me)
  useEffect(() => {
    const handleServerSync = (e: Event) => {
      const custom = e as CustomEvent<{ settings?: Partial<UserSettings>; userId?: string }>;
      if (custom.detail?.settings) {
        const serverVals = custom.detail.settings;
        const uid = custom.detail.userId || AuthService.getCurrentUser()?.id;
        const key = getSettingsKey(uid);
        setSettings((prev) => {
          // Server values strictly win
          const merged = { ...prev, ...serverVals };
          localStorage.setItem(key, JSON.stringify(merged));
          applyDomSettings(merged);
          if (merged.language) {
            changeLanguage(merged.language as 'en' | 'hi');
          }
          return merged;
        });
      }
    };
    window.addEventListener('minddiary_sync_server_settings', handleServerSync);
    return () => window.removeEventListener('minddiary_sync_server_settings', handleServerSync);
  }, [applyDomSettings]);

  // Listen to system theme preference changes when user selects 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (settings.theme === 'system') {
        applyDomSettings(settings);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings, applyDomSettings]);

  /**
   * Updates settings with rollback on failure and API call outside the React updater.
   */
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const prev = settings;
    const updated = { ...prev, ...newSettings };
    const userId = AuthService.getCurrentUser()?.id;
    const key = getSettingsKey(userId);

    // Optimistically apply local state and DOM changes
    setSettings(updated);
    localStorage.setItem(key, JSON.stringify(updated));
    applyDomSettings(updated);
    if (newSettings.language) {
      changeLanguage(newSettings.language as 'en' | 'hi');
    }

    // If authenticated, persist to server with rollback on error
    if (AuthService.getAuthToken()) {
      try {
        const serverSaved = await AuthService.updateSettings(newSettings);
        if (serverSaved) {
          const finalMerged = { ...updated, ...serverSaved };
          setSettings(finalMerged);
          localStorage.setItem(key, JSON.stringify(finalMerged));
          applyDomSettings(finalMerged);
        }
      } catch (err: unknown) {
        // Roll back immediately
        setSettings(prev);
        localStorage.setItem(key, JSON.stringify(prev));
        applyDomSettings(prev);
        if (prev.language) {
          changeLanguage(prev.language as 'en' | 'hi');
        }

        const msg = err instanceof Error ? err.message : 'Could not sync settings with server';
        window.dispatchEvent(
          new CustomEvent('minddiary_toast', {
            detail: {
              message: `Setting failed: ${msg}. Reverted to previous value.`,
              type: 'error'
            }
          })
        );
        throw err;
      }
    }
  };

  const resetSettings = async () => {
    const prev = settings;
    setSettings(defaultSettings);
    const userId = AuthService.getCurrentUser()?.id;
    const key = getSettingsKey(userId);
    localStorage.removeItem(key);
    applyDomSettings(defaultSettings);

    if (AuthService.getAuthToken()) {
      try {
        await AuthService.updateSettings(defaultSettings);
      } catch (err: unknown) {
        setSettings(prev);
        applyDomSettings(prev);
        const msg = err instanceof Error ? err.message : 'Failed to reset settings';
        window.dispatchEvent(
          new CustomEvent('minddiary_toast', {
            detail: { message: `Reset failed: ${msg}.`, type: 'error' }
          })
        );
      }
    }
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
};
