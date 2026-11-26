import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckIn } from '../components/Wellness/CheckIn';
import { HabitTracker } from '../components/Wellness/HabitTracker';
import { WellnessService } from '../services/wellnessService';
import { CheckIn as CheckInType, HabitLog } from '../types';
import { Heart, Activity, ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '../components/common/Button';

export const CheckInPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'checkin' | 'habits'>('checkin');
  const [initialCheckIn, setInitialCheckIn] = useState<CheckInType | null>(null);
  const [initialHabit, setInitialHabit] = useState<HabitLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      WellnessService.getTodayCheckIn().catch(() => null),
      WellnessService.getTodayHabit().catch(() => null)
    ]).then(([ci, hb]) => {
      if (mounted) {
        setInitialCheckIn(ci);
        setInitialHabit(hb);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back', 'Back to Dashboard')}</span>
        </button>

        <Button
          variant="ghost"
          size="sm"
          icon={TrendingUp}
          onClick={() => navigate('/insights')}
          className="text-xs"
        >
          {t('nav.insights', 'View Insights')}
        </Button>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'checkin'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-soft-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>{t('checkin.title', 'Feelings & Mood Check')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('habits')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'habits'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-soft-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>{t('checkin.habitsTitle', 'Habits & Body Log')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!loading && (
        <div className="animate-fade-in">
          {activeTab === 'checkin' ? (
            <CheckIn
              initialCheckIn={initialCheckIn}
              onSuccess={() => {
                navigate('/insights');
              }}
              onCancel={() => navigate('/')}
            />
          ) : (
            <div className="max-w-2xl mx-auto">
              <HabitTracker
                initialHabit={initialHabit}
                onSaved={() => {
                  navigate('/insights');
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
