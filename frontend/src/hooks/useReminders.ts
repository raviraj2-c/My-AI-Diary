import { useState, useEffect, useCallback } from 'react';
import { useSettings } from './useSettings';

export const useReminders = () => {
  const { settings, updateSettings } = useSettings();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        updateSettings({ reminderEnabled: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [updateSettings]);

  const showGentleReminder = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification('A Gentle Moment 🌿', {
          body: 'Want to take a quiet breath and check in with yourself today?',
          icon: '/favicon.ico'
        });
      } catch {
        // ignore notification error
      }
    }
  }, []);

  // Check every minute if the time matches the user's scheduled reminderTime
  useEffect(() => {
    if (!settings.reminderEnabled || permission !== 'granted') return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (currentTimeStr === (settings.reminderTime || '20:00') && now.getSeconds() < 10) {
        showGentleReminder();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [settings.reminderEnabled, settings.reminderTime, permission, showGentleReminder]);

  return {
    isSupported: typeof window !== 'undefined' && 'Notification' in window,
    permission,
    isEnabled: settings.reminderEnabled && permission === 'granted',
    reminderTime: settings.reminderTime || '20:00',
    requestPermission,
    showGentleReminder
  };
};
