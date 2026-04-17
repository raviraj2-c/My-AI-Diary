import { useState, useEffect } from 'react';
import { UserSettings } from '../types';

const SETTINGS_KEY = 'mydiary_settings';

const defaultSettings: UserSettings = {
  theme: 'light',
  fontSize: 'medium',
  fontFamily: 'inter',
  language: 'en'
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_KEY);
  };

  return {
    settings,
    updateSettings,
    resetSettings
  };
};