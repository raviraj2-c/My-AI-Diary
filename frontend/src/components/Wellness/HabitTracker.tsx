import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../../services/wellnessService';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { Droplet, Moon, Dumbbell, Monitor, Plus, Minus, Save } from 'lucide-react';
import { HabitLog } from '../../types';

interface HabitTrackerProps {
  initialHabit?: HabitLog | null;
  onSaved?: (habit: HabitLog) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ initialHabit, onSaved }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [isYesterday, setIsYesterday] = useState(false);
  const [water, setWater] = useState(initialHabit?.waterGlasses || 0);
  const [sleep, setSleep] = useState(initialHabit?.sleepHours || 7.5);
  const [exercise, setExercise] = useState(initialHabit?.exerciseMinutes || 0);
  const [screenTime, setScreenTime] = useState(initialHabit?.screenTimeHours || 0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialHabit) {
      setWater(initialHabit.waterGlasses || 0);
      if (initialHabit.sleepHours != null) setSleep(initialHabit.sleepHours);
      setExercise(initialHabit.exerciseMinutes || 0);
      setScreenTime(initialHabit.screenTimeHours || 0);
    }
  }, [initialHabit]);

  const getTargetDate = () => {
    const d = new Date();
    if (isYesterday) d.setDate(d.getDate() - 1);
    return d;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await WellnessService.saveHabitLog({
        date: getTargetDate(),
        waterGlasses: water,
        sleepHours: sleep,
        exerciseMinutes: exercise,
        screenTimeHours: screenTime
      });
      toast.success(isYesterday ? 'Yesterday’s habits updated.' : 'Daily habits saved.');
      if (onSaved) onSaved(saved);
    } catch (err) {
      console.error(err);
      toast.error('Could not save habit log.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 md:p-8 border-border dark:border-ink-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-sky-100 dark:border-ink-800">
        <div>
          <h3 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-50">{t('checkin.habitsTitle', 'Daily Habits')}</h3>
          <p className="text-xs text-muted">{t('checkin.subtitle', 'Gentle tracking of physical foundations')}</p>
        </div>

        {/* Date Selector / Yesterday Shortcut */}
        <div className="flex items-center gap-1.5 bg-sky-100 dark:bg-ink-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setIsYesterday(false)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              !isYesterday
                ? 'bg-white dark:bg-[#1e293b] text-ink-900 dark:text-sky-100 shadow-xs'
                : 'text-muted hover:text-ink-800 dark:hover:text-border'
            }`}
          >
            {t('checkin.loggedToday', 'Today')}
          </button>
          <button
            type="button"
            onClick={() => setIsYesterday(true)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              isYesterday
                ? 'bg-white dark:bg-[#1e293b] text-ink-900 dark:text-sky-100 shadow-xs'
                : 'text-muted hover:text-ink-800 dark:hover:text-border'
            }`}
          >
            {t('common.back', 'Yesterday')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
        {/* Water Glasses */}
        <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
              <Droplet className="w-4 h-4 fill-sky-500 text-sky-500" />
              <span>{t('checkin.waterGlasses', 'Water (Glasses)')}</span>
            </span>
            <span className="text-xl font-bold text-sky-900 dark:text-sky-100">{water}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWater((w) => Math.max(0, w - 1))}
              aria-label="Decrease water"
              className="p-1.5 rounded-lg bg-white dark:bg-[#0f172a] text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center text-xs text-sky-600 dark:text-sky-400 font-medium">
              ~{(water * 0.25).toFixed(1)} L
            </div>
            <button
              type="button"
              onClick={() => setWater((w) => w + 1)}
              aria-label="Increase water"
              className="p-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sleep Hours */}
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-ink-900 border border-sky-100 dark:border-ink-900 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-200">
              <Moon className="w-4 h-4 text-sky-500" />
              <span>{t('checkin.sleepHours', 'Sleep')}</span>
            </span>
            <span className="text-xl font-bold text-ink-900 dark:text-sky-100">{sleep} {t('common.done', 'hrs')}</span>
          </div>

          <input
            type="range"
            min={0}
            max={14}
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(Number(e.target.value))}
            aria-label="Sleep hours slider"
            className="w-full h-2 bg-sky-200 dark:bg-sky-700 rounded-lg appearance-none cursor-pointer accent-sky-700"
          />
        </div>

        {/* Exercise Minutes */}
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-ink-900 border border-sky-100 dark:border-ink-900 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-200">
              <Dumbbell className="w-4 h-4 text-sky-500" />
              <span>{t('checkin.exerciseMinutes')}</span>
            </span>
            <span className="text-xl font-bold text-ink-900 dark:text-sky-100">{t('common.minutesShort', { count: exercise })}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0, 15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setExercise(mins)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  exercise === mins
                    ? 'bg-sky-700 text-white border-sky-700 font-bold'
                    : 'bg-white dark:bg-[#0f172a] border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-200'
                }`}
              >
                {t('common.minutesShort', { count: mins })}
              </button>
            ))}
          </div>
        </div>

        {/* Screen Time Hours */}
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-900 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-800 dark:text-border">
              <Monitor className="w-4 h-4 text-muted" />
              <span>{t('checkin.screenTimeHours', 'Screen Time')}</span>
            </span>
            <span className="text-xl font-bold text-ink-900 dark:text-sky-100">{screenTime} {t('common.done', 'hrs')}</span>
          </div>

          <input
            type="range"
            min={0}
            max={16}
            step={0.5}
            value={screenTime}
            onChange={(e) => setScreenTime(Number(e.target.value))}
            aria-label="Screen time slider"
            className="w-full h-2 bg-border dark:bg-text rounded-lg appearance-none cursor-pointer accent-muted"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-sky-100 dark:border-ink-800 flex justify-end">
        <Button
          onClick={handleSave}
          variant="primary"
          size="sm"
          loading={isSaving}
          icon={<Save className="w-3.5 h-3.5" />}
        >
          {isSaving ? t('checkin.saving', 'Saving...') : t('checkin.save', 'Save Habits')}
        </Button>
      </div>
    </Card>
  );
};
