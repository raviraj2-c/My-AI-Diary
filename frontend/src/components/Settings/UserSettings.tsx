import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { useReminders } from '../../hooks/useReminders';
import { UserSettings as UserSettingsType } from '../../types';
import { Sun, Moon, Laptop, Globe, RotateCcw, Type, Palette, Mic, Bell, Sparkles } from 'lucide-react';
import { Card, Button } from '../common';
import { useToast } from '../common/Toast';

import { changeLanguage } from '../../i18n';
import { getUserTimezone } from '../../utils/dates';

export const UserSettings: React.FC<{ section?: 'look' | 'language' | 'all' }> = ({ section = 'all' }) => {
  const { t } = useTranslation();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { isEnabled, requestPermission, showGentleReminder } = useReminders();
  const toast = useToast();

  const themeOptions: Array<{ value: UserSettingsType['theme']; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: 'system', label: 'System', icon: Laptop },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  const fontSizeOptions: Array<{ value: UserSettingsType['fontSize']; label: string; sample: string }> = [
    { value: 'small', label: 'Compact', sample: '14px' },
    { value: 'medium', label: 'Balanced', sample: '16px' },
    { value: 'large', label: 'Comfortable', sample: '18px' },
  ];

  const fontFamilyOptions: Array<{ value: UserSettingsType['fontFamily']; label: string; description: string }> = [
    { value: 'inter', label: 'Inter', description: 'Clean modern sans-serif for UI & focus' },
    { value: 'serif', label: 'Lora', description: 'Warm editorial serif for journaling' },
    { value: 'mono', label: 'Monospace', description: 'Technical, typewriter aesthetic' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi (हिन्दी)' },
  ];

  const speechLanguageOptions = [
    { value: 'en-US', label: 'English (United States)' },
    { value: 'en-IN', label: 'English (India)' },
    { value: 'en-GB', label: 'English (United Kingdom)' },
    { value: 'hi-IN', label: 'Hindi (हिन्दी)' },
    { value: 'es-ES', label: 'Spanish (Español)' },
    { value: 'fr-FR', label: 'French (Français)' },
    { value: 'de-DE', label: 'German (Deutsch)' },
    { value: 'ja-JP', label: 'Japanese (日本語)' }
  ];

  const handleThemeChange = (newTheme: UserSettingsType['theme']) => {
    updateSettings({ theme: newTheme });
    toast.success(`Theme set to ${newTheme}`);
  };

  const handleReset = () => {
    resetSettings();
    toast.info('Preferences restored to default');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {(section === 'all' || section === 'look') && (
      <Card className="p-6 md:p-8 border-border dark:border-ink-800">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sky-100 dark:border-ink-800">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 flex items-center justify-center">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('settings.appearanceTitle')}</h2>
            <p className="text-xs text-muted dark:text-muted">{t('settings.appearanceSubtitle')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2.5">
              {t('settings.themeLabel')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(option => {
                const isSelected = settings.theme === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${isSelected
                      ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/50 text-primary-700 dark:text-primary-200 ring-1 ring-primary-500'
                      : 'border-border dark:border-ink-800 hover:border-sky-200 dark:hover:border-text bg-white dark:bg-[#1e293b] text-text dark:text-sky-200'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2.5">
              {t('settings.fontSizeLabel')}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {fontSizeOptions.map(option => {
                const isSelected = settings.fontSize === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ fontSize: option.value })}
                    className={`p-3 rounded-xl border text-center transition-all ${isSelected
                      ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/50 text-primary-700 dark:text-primary-200 ring-1 ring-primary-500'
                      : 'border-border dark:border-ink-800 hover:border-sky-200 dark:hover:border-text bg-white dark:bg-[#1e293b] text-text dark:text-sky-200'
                      }`}
                  >
                    <div className="text-xs font-medium">{option.label}</div>
                    <div className="text-[10px] text-muted mt-0.5">{option.sample}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Type className="w-4 h-4 text-muted" />
              <label className="text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200">
                {t('settings.fontFamilyLabel')}
              </label>
            </div>
            <div className="space-y-2">
              {fontFamilyOptions.map(option => {
                const isSelected = settings.fontFamily === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ fontFamily: option.value })}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${isSelected
                      ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/50 text-primary-900 dark:text-primary-100 ring-1 ring-primary-500'
                      : 'border-border dark:border-ink-800 hover:border-sky-200 dark:hover:border-text bg-white dark:bg-[#1e293b] text-text dark:text-sky-200'
                      }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{option.label}</div>
                      <div className="text-[11px] text-muted mt-0.5">{option.description}</div>
                    </div>
                    <span className="text-xs font-serif italic text-muted">{t('settings.fontSample')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      )}

      {/* Gentle Daily Reminder & Region */}
      {(section === 'all' || section === 'language') && (
      <>
      <Card className="p-6 md:p-8 border-border dark:border-ink-800">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sky-100 dark:border-ink-800">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-ink-900 text-sky-700 dark:text-sky-200 flex items-center justify-center">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('settings.remindersRegionTitle')}</h2>
            <p className="text-xs text-muted dark:text-muted">{t('settings.remindersRegionSubtitle')}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Daily Reminder Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-800 dark:text-border">{t('settings.dailyReminder')}</p>
              <p className="text-xs text-muted dark:text-muted">
                {t('settings.dailyReminderDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!isEnabled) {
                  const granted = await requestPermission();
                  if (granted) {
                    toast.success('Gentle check-in reminder enabled');
                  } else {
                    toast.error('Notification permission was not granted by your browser');
                  }
                } else {
                  updateSettings({ reminderEnabled: false });
                  toast.info('Gentle reminders paused');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${isEnabled
                ? 'bg-sky-700 text-white shadow-soft-sm'
                : 'bg-sky-100 dark:bg-ink-800 text-text dark:text-sky-200 hover:bg-border'
                }`}
            >
              {isEnabled ? t('settings.enabled') : t('settings.enableReminder')}
            </button>
          </div>

          {isEnabled && (
            <div className="flex items-center justify-between pt-2">
              <label htmlFor="reminder-time" className="text-xs font-medium text-text dark:text-sky-200">
                {t('settings.preferredTime')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="reminder-time"
                  type="time"
                  value={settings.reminderTime || '20:00'}
                  onChange={(e) => {
                    updateSettings({ reminderTime: e.target.value });
                    toast.success(`Reminder time set to ${e.target.value}`);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-xs text-ink-800 dark:text-border focus:ring-2 focus:ring-primary-400 outline-none"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    showGentleReminder();
                    toast.info('Sample reminder sent!');
                  }}
                  className="text-xs"
                >
                  {t('settings.test')}
                </Button>
              </div>
            </div>
          )}

          {/* Country / Region for Helplines */}
          <div className="pt-3 border-t border-sky-100 dark:border-ink-800">
            <label htmlFor="settings-country" className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2">
              {t('settings.countryLabel')}
            </label>
            <select
              id="settings-country"
              value={settings.country || 'IN'}
              onChange={(e) => {
                updateSettings({ country: e.target.value });
                toast.success('Region preference updated');
              }}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-sm text-ink-800 dark:text-border focus:ring-2 focus:ring-primary-400 focus:outline-none"
            >
              <option value="IN">{t('settings.countryIN')}</option>
              <option value="US">{t('settings.countryUS')}</option>
              <option value="UK">{t('settings.countryUK')}</option>
              <option value="CA">{t('settings.countryCA')}</option>
              <option value="AU">{t('settings.countryAU')}</option>
              <option value="GLOBAL">{t('settings.countryGLOBAL')}</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="pt-3 border-t border-sky-100 dark:border-ink-800">
            <label htmlFor="settings-timezone" className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2">
              {t('settings.timezoneLabel')}
            </label>
            <input
              id="settings-timezone"
              type="text"
              value={settings.timezone || getUserTimezone()}
              onChange={(e) => {
                updateSettings({ timezone: e.target.value });
              }}
              placeholder={t('settings.timezonePlaceholder')}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-sm text-ink-800 dark:text-border focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
            <p className="text-xs text-muted dark:text-muted mt-1">
              {t('settings.timezoneDesc')}
            </p>
          </div>

          {/* Trusted Support Contact */}
          <div className="pt-4 border-t border-sky-100 dark:border-ink-800 space-y-3">
            <div>
              <p className="text-sm font-semibold text-ink-800 dark:text-border">{t('settings.trustedContactTitle')}</p>
              <p className="text-xs text-muted dark:text-muted">
                {t('settings.trustedContactDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="trusted-name" className="block text-xs text-muted dark:text-muted mb-1">
                  {t('settings.contactName')}
                </label>
                <input
                  id="trusted-name"
                  type="text"
                  placeholder="e.g. Alex"
                  value={settings.trustedContact?.name || ''}
                  onChange={(e) => {
                    updateSettings({
                      trustedContact: {
                        name: e.target.value,
                        phone: settings.trustedContact?.phone || '',
                        relation: settings.trustedContact?.relation || ''
                      }
                    });
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-xs text-ink-800 dark:text-border focus:ring-2 focus:ring-primary-400 outline-none"
                />
              </div>

              <div>
                <label htmlFor="trusted-phone" className="block text-xs text-muted dark:text-muted mb-1">
                  {t('settings.contactPhone')}
                </label>
                <input
                  id="trusted-phone"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={settings.trustedContact?.phone || ''}
                  onChange={(e) => {
                    updateSettings({
                      trustedContact: {
                        name: settings.trustedContact?.name || '',
                        phone: e.target.value,
                        relation: settings.trustedContact?.relation || ''
                      }
                    });
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-xs text-ink-800 dark:text-border focus:ring-2 focus:ring-primary-400 outline-none"
                />
              </div>

              <div>
                <label htmlFor="trusted-rel" className="block text-xs text-muted dark:text-muted mb-1">
                  {t('settings.contactRelation')}
                </label>
                <input
                  id="trusted-rel"
                  type="text"
                  placeholder="e.g. Sister, Friend"
                  value={settings.trustedContact?.relation || ''}
                  onChange={(e) => {
                    updateSettings({
                      trustedContact: {
                        name: settings.trustedContact?.name || '',
                        phone: settings.trustedContact?.phone || '',
                        relation: e.target.value
                      }
                    });
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-xs text-ink-800 dark:text-border focus:ring-2 focus:ring-primary-400 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Language & Voice Settings */}
      <Card className="p-6 md:p-8 border-border dark:border-ink-800">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-sky-100 dark:border-ink-800">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-ink-800 text-muted dark:text-sky-200 flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-sky-50">{t('settings.languageVoiceTitle')}</h2>
            <p className="text-xs text-muted dark:text-muted">{t('settings.languageVoiceSubtitle')}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* UI Language */}
          <div>
            <label htmlFor="settings-language" className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2">
              {t('settings.languageLabel')}
            </label>
            <select
              id="settings-language"
              value={settings.language}
              onChange={(e) => {
                const lang = e.target.value as UserSettingsType['language'];
                updateSettings({ language: lang });
                if (lang === 'en' || lang === 'hi') {
                  changeLanguage(lang);
                }
                toast.success('Interface language updated');
              }}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-sm text-ink-800 dark:text-border focus:ring-2 focus:ring-primary-400 focus:outline-none"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Dictation Language */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-3.5 h-3.5 text-primary-600" />
              <label htmlFor="settings-speech-language" className="text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200">
                {t('settings.speechLanguageLabel')}
              </label>
            </div>
            <select
              id="settings-speech-language"
              value={settings.speechLanguage || 'en-US'}
              onChange={(e) => {
                updateSettings({ speechLanguage: e.target.value });
                toast.success(`Speech recognition set to ${e.target.value}`);
              }}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-sm text-ink-800 dark:text-border focus:ring-2 focus:ring-primary-400 focus:outline-none"
            >
              {speechLanguageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-muted dark:text-muted">
              {t('settings.speechLanguageDesc')}
            </p>
          </div>

          {/* Student Mode Toggle */}
          <div className="pt-4 border-t border-sky-100 dark:border-ink-800 flex items-center justify-between">
            <div className="pr-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200">
                {t('settings.isStudent')}
              </span>
              <p className="text-xs text-muted dark:text-muted">
                {t('settings.isStudentDesc')}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-label={t('settings.isStudent')}
              aria-checked={Boolean(settings.isStudent)}
              onClick={() => {
                const nextVal = !settings.isStudent;
                updateSettings({ isStudent: nextVal });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                settings.isStudent ? 'bg-sky-700' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.isStudent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Allow AI Features Toggle */}
          <div className="pt-4 border-t border-sky-100 dark:border-ink-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200">
                    {t('settings.aiToggleLabel')}
                  </span>
                  <p className="text-xs text-muted dark:text-muted">
                    {t('settings.aiToggleDesc')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(settings.allowAIFeatures)}
                onClick={() => {
                  const nextVal = !settings.allowAIFeatures;
                  updateSettings({ allowAIFeatures: nextVal });
                  toast.success(nextVal ? 'AI features enabled (Max 30/day)' : 'AI features disabled');
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 ${settings.allowAIFeatures ? 'bg-sky-700' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.allowAIFeatures ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* Separate Consent: Allow Assistant to Read Diary */}
            <div className="pt-3 border-t border-sky-100 dark:border-ink-900 flex items-center justify-between">
              <div className="pr-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200">
                  {t('settings.diaryAIToggleLabel', 'Allow Assistant to Read Diary')}
                </span>
                <p className="text-xs text-muted dark:text-muted mt-0.5 leading-relaxed">
                  {t('settings.diaryAIToggleDesc', 'Let the assistant read short pieces of my diary entries to answer my questions. Only the pieces needed for each question are sent to the AI provider.')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(settings.allowDiaryAI)}
                onClick={() => {
                  const nextVal = !settings.allowDiaryAI;
                  updateSettings({ allowDiaryAI: nextVal });
                  toast.success(nextVal ? 'Diary reading enabled' : 'Diary reading disabled');
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 ${settings.allowDiaryAI ? 'bg-sky-700' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.allowDiaryAI ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="p-3 bg-sky-50 dark:bg-ink-900 border border-sky-100 dark:border-ink-900 rounded-xl text-[11px] text-sky-700 dark:text-sky-200 leading-relaxed">
              {t('settings.aiPrivacyNote')}
            </div>
          </div>

          {/* Reset Defaults */}
          <div className="pt-4 border-t border-sky-100 dark:border-ink-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-ink-800 dark:text-border">{t('settings.resetDefaults')}</p>
              <p className="text-[11px] text-muted">{t('settings.resetDefaultsDesc')}</p>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              {t('settings.resetDefaults')}
            </Button>
          </div>
        </div>
      </Card>
      </>
      )}
    </div>
  );
};
