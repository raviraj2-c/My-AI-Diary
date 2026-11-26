import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { UserSettings } from '../components/Settings/UserSettings';
import { PrivacySettings } from '../components/Settings/PrivacySettings';
import { CopingPlanSettings } from '../components/Settings/CopingPlanSettings';
import {
  Palette,
  Globe,
  HeartHandshake,
  Shield,
  UserCheck,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

type SettingsSection = 'menu' | 'look' | 'language' | 'safety' | 'privacy' | 'account';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const [section, setSection] = useState<SettingsSection>(() => {
    if (window.location.hash === '#coping-plan') return 'safety';
    return 'menu';
  });

  useEffect(() => {
    if (location.hash === '#coping-plan') {
      setSection('safety');
    }
  }, [location.hash]);

  const rows: Array<{
    id: Exclude<SettingsSection, 'menu'>;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'look',
      label: t('settings.rowLook', 'Look'),
      desc: t('settings.rowLookDesc', 'Theme, font, and text size'),
      icon: Palette,
    },
    {
      id: 'language',
      label: t('settings.rowLanguage', 'Language'),
      desc: t('settings.rowLanguageDesc', 'App language, voice, and reminders'),
      icon: Globe,
    },
    {
      id: 'safety',
      label: t('settings.rowSafety', 'Safety'),
      desc: t('settings.rowSafetyDesc', 'Coping plan and trusted contacts'),
      icon: HeartHandshake,
    },
    {
      id: 'privacy',
      label: t('settings.rowPrivacy', 'AI & privacy'),
      desc: t('settings.rowPrivacyDesc', 'AI permissions and data controls'),
      icon: Shield,
    },
    {
      id: 'account',
      label: t('settings.rowAccount', 'Account'),
      desc: t('settings.rowAccountDesc', 'App lock, export, and account'),
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        {section !== 'menu' && (
          <button
            type="button"
            onClick={() => setSection('menu')}
            aria-label={t('common.back', 'Back')}
            className="p-2 rounded-xl border border-border dark:border-ink-800 bg-surface dark:bg-ink-900 text-text dark:text-sky-100 hover:bg-sky-50 dark:hover:bg-ink-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h1 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">
          {section === 'menu'
            ? t('settings.title')
            : rows.find((r) => r.id === section)?.label}
        </h1>
      </div>

      {section === 'menu' ? (
        <div className="divide-y divide-border dark:divide-ink-800 rounded-2xl border border-border dark:border-ink-800 bg-surface dark:bg-ink-900 overflow-hidden">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSection(row.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-sky-50 dark:hover:bg-ink-800/60 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-ink-800 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text dark:text-sky-50">
                    {row.label}
                  </div>
                  <div className="text-xs text-muted truncate">
                    {row.desc}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pt-1">
          {section === 'look' && <UserSettings section="look" />}
          {section === 'language' && <UserSettings section="language" />}
          {section === 'safety' && <CopingPlanSettings />}
          {(section === 'privacy' || section === 'account') && <PrivacySettings />}
        </div>
      )}
    </div>
  );
};
