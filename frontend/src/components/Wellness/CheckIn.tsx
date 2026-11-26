import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../../services/wellnessService';
import { EmotionWheel } from './EmotionWheel';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useToast } from '../common/Toast';
import { Heart, Sparkles, Moon, Battery, Flame, Wind, CheckCircle2, Zap } from 'lucide-react';
import { CheckIn as CheckInType } from '../../types';
import { SafetyBanner } from './SafetyBanner';
import { useSettings } from '../../hooks/useSettings';

interface CheckInProps {
  initialCheckIn?: CheckInType | null;
  onSuccess?: (checkIn: CheckInType) => void;
  onCancel?: () => void;
}

const MOOD_EMOJIS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '🌧️', label: 'Very Heavy', color: 'text-blue-500' },
  2: { emoji: '☁️', label: 'Struggling', color: 'text-blue-400' },
  3: { emoji: '🌥️', label: 'Low', color: 'text-indigo-400' },
  4: { emoji: '⛅', label: 'Tired / Meh', color: 'text-calm-500' },
  5: { emoji: '🌤️', label: 'Okay / Neutral', color: 'text-calm-600' },
  6: { emoji: '🌱', label: 'Mildly Good', color: 'text-emerald-500' },
  7: { emoji: '🌿', label: 'Peaceful', color: 'text-emerald-600' },
  8: { emoji: '☀️', label: 'Happy', color: 'text-amber-500' },
  9: { emoji: '✨', label: 'Vibrant', color: 'text-amber-600' },
  10: { emoji: '🌟', label: 'Thriving', color: 'text-yellow-500' },
};

const QUICK_TAG_SUGGESTIONS = [
  'Work', 'Family', 'Rest', 'Nature', 'Exercise', 'Reading', 'Friends',
  'Creativity', 'Study', 'Overwhelmed', 'Grateful', 'Coffee', 'Solitude'
];

export const CheckIn: React.FC<CheckInProps> = ({
  initialCheckIn,
  onSuccess,
  onCancel
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { settings } = useSettings();
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [safetyLevel, setSafetyLevel] = useState<'none' | 'concern' | 'high'>('none');

  const [moodScore, setMoodScore] = useState<number>(initialCheckIn?.moodScore || 7);
  const [emotions, setEmotions] = useState<string[]>(initialCheckIn?.emotions || []);
  const [sleepHours, setSleepHours] = useState<number>(initialCheckIn?.sleepHours || 7.5);
  const [energy, setEnergy] = useState<number>(initialCheckIn?.energy || 3);
  const [stress, setStress] = useState<number>(initialCheckIn?.stress || 2);
  const [anxiety, setAnxiety] = useState<number>(initialCheckIn?.anxiety || 2);
  const [tags, setTags] = useState<string[]>(initialCheckIn?.tags || []);
  const [note, setNote] = useState<string>(initialCheckIn?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCheckIn) {
      setMoodScore(initialCheckIn.moodScore);
      setEmotions(initialCheckIn.emotions || []);
      if (initialCheckIn.sleepHours != null) setSleepHours(initialCheckIn.sleepHours);
      if (initialCheckIn.energy != null) setEnergy(initialCheckIn.energy);
      if (initialCheckIn.stress != null) setStress(initialCheckIn.stress);
      if (initialCheckIn.anxiety != null) setAnxiety(initialCheckIn.anxiety);
      setTags(initialCheckIn.tags || []);
      setNote(initialCheckIn.note || '');
    }
  }, [initialCheckIn]);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Partial<CheckInType> = {
        moodScore,
        emotions,
        tags,
        date: new Date()
      };

      if (mode === 'full') {
        payload.sleepHours = sleepHours;
        payload.energy = energy;
        payload.stress = stress;
        payload.anxiety = anxiety;
        payload.note = note.trim();
      }

      const saved = await WellnessService.saveCheckIn(payload);
      toast.success('Your daily reflection was noted with care.');

      const safetyReturned = (saved as CheckInType & { safety?: { level: 'none' | 'concern' | 'high' } })?.safety?.level;
      if (safetyReturned && safetyReturned !== 'none') {
        setSafetyLevel(safetyReturned);
      } else if (onSuccess) {
        onSuccess(saved);
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not save your check-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMoodMeta = MOOD_EMOJIS[moodScore] || MOOD_EMOJIS[7];

  return (
    <>
      <SafetyBanner
        level={safetyLevel}
        onDismiss={() => {
          setSafetyLevel('none');
          if (onSuccess && initialCheckIn) onSuccess(initialCheckIn);
        }}
        country={settings.country}
        trustedContact={settings.trustedContact}
      />

      <Card className="p-6 md:p-8 max-w-2xl mx-auto border-calm-200 dark:border-calm-800 animate-fade-in shadow-soft-md">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-calm-100 dark:border-calm-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-semibold mb-1">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>{t('checkin.title', 'Daily Wellness Check-In')}</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-calm-900 dark:text-calm-50">
            {t('dashboard.howAreYouFeeling', 'How are you feeling today?')}
          </h2>
          <p className="text-xs text-calm-500 mt-0.5">{t('checkin.subtitle', 'Take a gentle pause to listen to yourself.')}</p>
        </div>

        <div className="flex items-center bg-calm-100 dark:bg-calm-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              mode === 'quick'
                ? 'bg-white dark:bg-[#1e293b] text-calm-900 dark:text-calm-100 shadow-xs'
                : 'text-calm-500 hover:text-calm-800 dark:hover:text-calm-200'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{t('dashboard.tenSecCheckIn', 'Quick (10s)')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              mode === 'full'
                ? 'bg-white dark:bg-[#1e293b] text-calm-900 dark:text-calm-100 shadow-xs'
                : 'text-calm-500 hover:text-calm-800 dark:hover:text-calm-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-primary-500" />
            <span>{t('checkin.title', 'Full Check-In')}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-6">
        {/* Mood Score Slider (1 - 10) */}
        <div className="text-center p-6 rounded-2xl bg-calm-50/60 dark:bg-calm-900/30 border border-calm-100 dark:border-calm-800">
          <div className="text-5xl mb-2 animate-bounce-subtle select-none">
            {currentMoodMeta.emoji}
          </div>
          <div className="text-lg font-serif font-bold text-calm-900 dark:text-calm-50">
            {currentMoodMeta.label}
          </div>
          <div className="text-xs text-calm-400 font-medium mt-0.5">
            {t('checkin.ratingScore', { score: moodScore })}
          </div>

          <div className="mt-6 px-4">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              aria-label={t('checkin.moodSliderAria', 'Mood score slider')}
              className="w-full h-2.5 bg-calm-200 dark:bg-calm-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-[11px] text-calm-400 mt-2 font-medium">
              <span>{t('checkin.moodHeavy')}</span>
              <span>{t('checkin.moodNeutral')}</span>
              <span>{t('checkin.moodVibrant')}</span>
            </div>
          </div>
        </div>

        {/* Emotion Wheel */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-2">
            {t('checkin.emotionsPrompt', 'Emotions Present Right Now')}
          </label>
          <EmotionWheel
            selectedEmotions={emotions}
            onChange={setEmotions}
            maxSelection={5}
          />
        </div>

        {/* Quick Context Tags */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-2">
            {t('write.tagsPlaceholder', 'Influencing Topics')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAG_SUGGESTIONS.map((tag) => {
              const isSelected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600 shadow-xs font-semibold'
                      : 'bg-white dark:bg-[#1e293b] border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 hover:bg-calm-100'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Full Check-In Mode Additional Sliders */}
        {mode === 'full' && (
          <div className="space-y-6 pt-4 border-t border-calm-100 dark:border-calm-800 animate-fade-in">
            {/* Sleep Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="flex items-center gap-1.5 text-calm-700 dark:text-calm-300">
                  <Moon className="w-4 h-4 text-primary-500" />
                  <span>{t('checkin.sleepHours', 'Sleep Last Night')}</span>
                </span>
                <span className="font-bold text-calm-900 dark:text-calm-100">{sleepHours} {t('common.done', 'hours')}</span>
              </div>
              <input
                type="range"
                min={0}
                max={14}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full h-2 bg-calm-200 dark:bg-calm-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
            </div>

            {/* Energy Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-medium">
                <span className="flex items-center gap-1.5 text-calm-700 dark:text-calm-300">
                  <Battery className="w-4 h-4 text-emerald-500" />
                  <span>{t('checkin.energyLevel')}</span>
                </span>
                <span className="font-bold text-calm-900 dark:text-calm-100">{t('checkin.outOfFive', { score: energy })}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="w-full h-2 bg-calm-200 dark:bg-calm-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Stress & Anxiety Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1 text-calm-700 dark:text-calm-300">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>{t('checkin.stressLevel')}</span>
                  </span>
                  <span className="font-bold">{t('checkin.outOfFive', { score: stress })}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full h-2 bg-calm-200 dark:bg-calm-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1 text-calm-700 dark:text-calm-300">
                    <Wind className="w-3.5 h-3.5 text-purple-500" />
                    <span>{t('checkin.anxietyLevel')}</span>
                  </span>
                  <span className="font-bold">{t('checkin.outOfFive', { score: anxiety })}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={anxiety}
                  onChange={(e) => setAnxiety(Number(e.target.value))}
                  className="w-full h-2 bg-calm-200 dark:bg-calm-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Optional Personal Note */}
            <div>
              <label htmlFor="checkin-note" className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-1.5">
                {t('checkin.privateNote')}
              </label>
              <textarea
                id="checkin-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder={t('checkin.notePlaceholder')}
                className="w-full p-3 rounded-xl border border-calm-200 dark:border-calm-700 bg-white dark:bg-[#0f172a] text-sm text-calm-800 dark:text-calm-200 placeholder-calm-400 focus:ring-2 focus:ring-primary-400 focus:outline-none"
              />
              <div className="text-right text-[10px] text-calm-400 mt-1">{t('checkin.charCount', { current: note.length, max: 500 })}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-calm-100 dark:border-calm-800 flex items-center justify-between gap-3">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t('common.cancel', 'Cancel')}
            </Button>
          ) : <div />}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isSubmitting ? t('checkin.saving', 'Saving...') : t('checkin.save', 'Save Check-In')}
          </Button>
        </div>
      </form>
    </Card>
    </>
  );
};
