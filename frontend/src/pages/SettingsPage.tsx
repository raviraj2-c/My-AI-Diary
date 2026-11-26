import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { UserSettings } from '../components/Settings/UserSettings';
import { PrivacySettings } from '../components/Settings/PrivacySettings';
import { CopingPlanSettings } from '../components/Settings/CopingPlanSettings';
import { Sliders, Shield, HeartHandshake } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'preferences' | 'privacy' | 'copingPlan'>(() => {
    if (window.location.hash === '#coping-plan') return 'copingPlan';
    return 'preferences';
  });

  useEffect(() => {
    if (location.hash === '#coping-plan') {
      setActiveTab('copingPlan');
    }
  }, [location.hash]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('settings.title')}</h1>
        <p className="text-sm text-calm-500 dark:text-calm-400 mt-0.5">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-calm-200 dark:border-calm-800">
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preferences'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-semibold'
              : 'border-transparent text-calm-500 hover:text-calm-800 dark:hover:text-calm-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          {t('settings.tabsPreferences')}
        </button>

        <button
          onClick={() => setActiveTab('copingPlan')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'copingPlan'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-semibold'
              : 'border-transparent text-calm-500 hover:text-calm-800 dark:hover:text-calm-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          {t('settings.tabsCopingPlan', 'Coping Plan')}
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'privacy'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-semibold'
              : 'border-transparent text-calm-500 hover:text-calm-800 dark:hover:text-calm-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          {t('settings.tabsPrivacy')}
        </button>
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {activeTab === 'preferences' && <UserSettings />}
        {activeTab === 'copingPlan' && <CopingPlanSettings />}
        {activeTab === 'privacy' && <PrivacySettings />}
      </div>
    </div>
  );
};
