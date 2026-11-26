import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../../services/wellnessService';
import { EmotionWheel } from './EmotionWheel';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useToast } from '../common/Toast';
import { Moon, Battery, Flame, Wind, CheckCircle2 } from 'lucide-react';
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
  3: { emoji: '🌥️', label: 'Low', color: 'text-sky-400' },
  4: { emoji: '⛅', label: 'Tired / Meh', color: 'text-muted' },
  5: { emoji: '🌤️', label: 'Okay / Neutral', color: 'text-muted' },
  6: { emoji: '🌱', label: 'Mildly Good', color: 'text-sky-500' },
  7: { emoji: '🌿', label: 'Peaceful', color: 'text-sky-700' },
  8: { emoji: '☀️', label: 'Happy', color: 'text-sky-500' },
  9: { emoji: '✨', label: 'Vibrant', color: 'text-sky-700' },
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
  const [mode] = useState<'quick' | 'full'>('quick');
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

  const [step, setStep] = useState<1 | 2 | 3>(1);

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

      if (mode === 'full' || step > 1) {
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

      <Card className="p-6 md:p-8 max-w-2xl mx-auto border-border dark:border-ink-800 animate-fade-in shadow-soft-md">
      {/* Header & 3-Step Progress Bar */}
      <div className="space-y-4 pb-5 border-b border-sky-100 dark:border-ink-800">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-sky-50">
            {t('dashboard.howAreYouFeeling', 'How are you feeling today?')}
          </h2>
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 tabular-nums shrink-0">
            {t('checkin.stepProgress', { step, defaultValue: `${step} / 3` })}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-sky-100 dark:bg-ink-800 overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-6">
        {step === 1 && (
          <>
            {/* Step 1: Mood */}
            <div className="text-center p-6 rounded-2xl bg-sky-50 dark:bg-ink-900 border border-sky-100 dark:border-ink-800">
              <div className="text-5xl mb-2 select-none">
                {currentMoodMeta.emoji}
              </div>
              <div className="text-lg font-serif font-bold text-ink-900 dark:text-sky-50">
                {currentMoodMeta.label}
              </div>
              <div className="text-xs text-muted font-medium mt-0.5">
                {t('checkin.ratingScore', { score: moodScore })}
              </div>

              <div className="mt-5 px-2">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={moodScore}
                  onChange={(e) => setMoodScore(Number(e.target.value))}
                  aria-label={t('checkin.moodSliderAria', 'Mood score slider')}
                  className="w-full h-2.5 bg-border dark:bg-text rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[11px] text-muted mt-2 font-medium">
                  <span>{t('checkin.moodHeavy')}</span>
                  <span>{t('checkin.moodNeutral')}</span>
                  <span>{t('checkin.moodVibrant')}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2">
                {t('checkin.emotionsPrompt', 'Emotions')}
              </label>
              <EmotionWheel
                selectedEmotions={emotions}
                onChange={setEmotions}
                maxSelection={5}
              />
            </div>

            <div className="pt-4 border-t border-sky-100 dark:border-ink-800 flex items-center justify-between gap-3">
              {onCancel ? (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  {t('common.cancel', 'Cancel')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="ghost"
                  loading={isSubmitting}
                >
                  {isSubmitting ? t('checkin.saving', 'Saving...') : t('checkin.save', 'Save Check-In')}
                </Button>
              )}

              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button type="submit" variant="outline" loading={isSubmitting}>
                    {isSubmitting ? t('checkin.saving', 'Saving...') : t('checkin.save', 'Save Check-In')}
                  </Button>
                )}
                <Button type="button" variant="primary" onClick={() => setStep(2)}>
                  {t('common.next', 'Next')}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Step 2: Body (sleep, energy, stress, anxiety) */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-text dark:text-sky-200">
                    <Moon className="w-4 h-4 text-primary-500" />
                    <span>{t('checkin.sleepHours', 'Sleep')}</span>
                  </span>
                  <span className="font-bold text-ink-900 dark:text-sky-100">
                    {t('checkin.sleepValue', { hours: sleepHours, defaultValue: `${sleepHours}h` })}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={14}
                  step={0.5}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full h-2 bg-border dark:bg-text rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-text dark:text-sky-200">
                    <Battery className="w-4 h-4 text-sky-500" />
                    <span>{t('checkin.energyLevel')}</span>
                  </span>
                  <span className="font-bold text-ink-900 dark:text-sky-100">{t('checkin.outOfFive', { score: energy })}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full h-2 bg-border dark:bg-text rounded-lg appearance-none cursor-pointer accent-sky-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="flex items-center gap-1 text-text dark:text-sky-200">
                      <Flame className="w-3.5 h-3.5 text-danger" />
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
                    className="w-full h-2 bg-border dark:bg-text rounded-lg appearance-none cursor-pointer accent-danger"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="flex items-center gap-1 text-text dark:text-sky-200">
                      <Wind className="w-3.5 h-3.5 text-sky-500" />
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
                    className="w-full h-2 bg-border dark:bg-text rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-sky-100 dark:border-ink-800 flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                {t('common.back', 'Back')}
              </Button>
              <Button type="button" variant="primary" onClick={() => setStep(3)}>
                {t('common.next', 'Next')}
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Step 3: Gratitude / Note (optional) */}
            <div className="space-y-4">
              <div>
                <label htmlFor="checkin-note" className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-1.5">
                  {t('checkin.gratitudeLabel', 'Gratitude or note')}
                </label>
                <input
                  id="checkin-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  placeholder={t('checkin.notePlaceholder')}
                  className="w-full p-3 rounded-xl border border-border dark:border-text bg-white dark:bg-[#0f172a] text-sm text-ink-800 dark:text-border placeholder-muted focus:ring-2 focus:ring-primary-400 focus:outline-none"
                />
              </div>

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
                          : 'bg-white dark:bg-[#1e293b] border-border dark:border-text text-text dark:text-sky-200 hover:bg-sky-100'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-sky-100 dark:border-ink-800 flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                {t('common.back', 'Back')}
              </Button>
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
          </>
        )}
      </form>
    </Card>
    </>
  );
};
