import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../services/wellnessService';
import { GratitudeEntry } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { Sparkles, Heart, Dices, Plus, Trash2, Calendar, Sun } from 'lucide-react';

export const GratitudePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [items, setItems] = useState<string[]>(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [randomItem, setRandomItem] = useState<{ item: string; date: string } | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    loadGratitude();
  }, []);

  const loadGratitude = async () => {
    try {
      const data = await WellnessService.getGratitudeEntries(50);
      setEntries(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.map((i) => i.trim()).filter(Boolean);

    if (validItems.length === 0) {
      toast.warning('Please enter at least one moment you are grateful for today.');
      return;
    }

    setIsSubmitting(true);
    try {
      await WellnessService.saveGratitude(validItems);
      toast.success('Your gratitude moments have been placed in your jar.');
      setItems(['', '', '']);
      loadGratitude();
    } catch (err) {
      console.error(err);
      toast.error('Could not save gratitude.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealRandom = async () => {
    setIsRolling(true);
    try {
      const found = await WellnessService.getRandomGratitude();
      setRandomItem(found);
      if (!found) {
        toast.info('Your gratitude jar is empty so far. Add 3 things you love below!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRolling(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await WellnessService.deleteGratitude(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.info('Removed from gratitude collection.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-xs font-semibold mb-1">
            <Heart className="w-4 h-4 fill-current" />
            <span>{t('gratitude.title', 'Gratitude Sanctuary')}</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('gratitude.title', 'Gratitude Jar')}</h1>
          <p className="text-sm text-calm-500 mt-1">
            {t('gratitude.subtitle', 'Noticing small wonders trains the mind to perceive safety and warmth.')}
          </p>
        </div>

        {/* Random Jar Button */}
        <Button
          onClick={handleRevealRandom}
          variant="secondary"
          loading={isRolling}
          icon={<Dices className="w-4 h-4 text-primary-600" />}
          className="self-start sm:self-auto"
        >
          {t('gratitude.showSomethingGood')}
        </Button>
      </div>

      {/* Random Flashback Spotlight from the Jar */}
      {randomItem && (
        <Card className="p-6 md:p-8 bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/30 dark:to-emerald-950/20 border-amber-200/70 dark:border-amber-900/40 animate-slide-up shadow-soft-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center shrink-0">
              <Sun className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                {t('gratitude.memoryFromJar')}
              </span>
              <p className="text-lg font-serif italic text-calm-900 dark:text-calm-100">
                "{randomItem.item}"
              </p>
              <p className="text-xs text-calm-400 pt-1">
                {t('gratitude.recordedOn', { date: new Intl.DateTimeFormat(i18n.language, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(randomItem.date)) })}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Form: 3 Good Things Today */}
      <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-calm-100 dark:border-calm-800">
          <div className="w-10 h-10 rounded-xl bg-calm-100 dark:bg-calm-800 text-calm-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-calm-900 dark:text-calm-50">{t('gratitude.threeGoodThings')}</h2>
            <p className="text-xs text-calm-500">{t('gratitude.threeGoodThingsSubtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-calm-100 dark:bg-calm-800 text-calm-600 dark:text-calm-300 text-xs font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                value={item}
                maxLength={200}
                onChange={(e) => handleItemChange(idx, e.target.value)}
                placeholder={
                  idx === 0
                    ? t('gratitude.item1Placeholder', 'A morning coffee, a kind smile, clean sheets...')
                    : idx === 1
                    ? t('gratitude.item2Placeholder', 'A problem resolved, a breath of cool air...')
                    : t('gratitude.item3Placeholder', 'Something unexpected that made you smile...')
                }
                className="flex-1 px-4 py-2.5 rounded-xl border border-calm-200 dark:border-calm-700 bg-white dark:bg-[#0f172a] text-sm text-calm-900 dark:text-calm-100 placeholder-calm-400 focus:ring-2 focus:ring-primary-400 focus:outline-none"
              />
            </div>
          ))}

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              icon={<Plus className="w-4 h-4" />}
            >
              {t('gratitude.save', 'Add to My Jar')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Gratitude Jar Entries List */}
      <div className="space-y-4">
        <h3 className="text-base font-serif font-bold text-calm-900 dark:text-calm-50">
          {t('gratitude.collectedMoments', { count: entries.length })}
        </h3>

        {entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-5 border-calm-200 dark:border-calm-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-calm-400 mb-3 pb-2 border-b border-calm-100 dark:border-calm-800">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      aria-label={t('common.delete')}
                      className="text-calm-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {entry.items.map((it, i) => (
                      <li key={i} className="text-xs font-serif text-calm-800 dark:text-calm-200 flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-calm-400 py-6 text-center italic">
            {t('gratitude.emptyJar')}
          </p>
        )}
      </div>
    </div>
  );
};
