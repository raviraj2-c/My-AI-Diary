import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WellnessService } from '../../services/wellnessService';
import { CopingPlanData } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { useToast } from '../common/Toast';
import {
  HeartHandshake,
  AlertCircle,
  Wind,
  Users,
  Compass,
  Sparkles,
  Plus,
  X,
  Save,
  Lock
} from 'lucide-react';

type CopingCategoryKey = 'warningSigns' | 'copingStrategies' | 'peopleToContact' | 'safePlaces' | 'reasonsToKeepGoing';

interface CategoryConfig {
  key: CopingCategoryKey;
  titleKey: string;
  defaultTitle: string;
  subtitleKey: string;
  defaultSubtitle: string;
  placeholderKey: string;
  defaultPlaceholder: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'warningSigns',
    titleKey: 'copingPlan.warningSignsTitle',
    defaultTitle: '1. Personal Warning Signs',
    subtitleKey: 'copingPlan.warningSignsSubtitle',
    defaultSubtitle: 'Feelings, thoughts, or changes in behavior that signal things are getting heavy.',
    placeholderKey: 'copingPlan.warningSignsPlaceholder',
    defaultPlaceholder: 'e.g. Can not sleep, withdrawing from friends, racing thoughts',
    icon: AlertCircle,
    colorClass: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-ink-900'
  },
  {
    key: 'copingStrategies',
    titleKey: 'copingPlan.strategiesTitle',
    defaultTitle: '2. What Helps Me Cope',
    subtitleKey: 'copingPlan.strategiesSubtitle',
    defaultSubtitle: 'Things you can do on your own to soothe distress or steady yourself.',
    placeholderKey: 'copingPlan.strategiesPlaceholder',
    defaultPlaceholder: 'e.g. Box breathing, cold water on wrists, listening to lo-fi beats, going for a brisk walk',
    icon: Wind,
    colorClass: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40'
  },
  {
    key: 'peopleToContact',
    titleKey: 'copingPlan.peopleTitle',
    defaultTitle: '3. People & Connections I Can Reach Out To',
    subtitleKey: 'copingPlan.peopleSubtitle',
    defaultSubtitle: 'Trusted friends, family, or counselors who offer a listening ear.',
    placeholderKey: 'copingPlan.peoplePlaceholder',
    defaultPlaceholder: 'e.g. Maya (sister) - 555-0192, Dr. Sharma, Campus counseling line',
    icon: Users,
    colorClass: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-ink-900'
  },
  {
    key: 'safePlaces',
    titleKey: 'copingPlan.safePlacesTitle',
    defaultTitle: '4. Safe Places & Calming Environments',
    subtitleKey: 'copingPlan.safePlacesSubtitle',
    defaultSubtitle: 'Physical spots that bring you a sense of grounding and safety.',
    placeholderKey: 'copingPlan.safePlacesPlaceholder',
    defaultPlaceholder: 'e.g. My bedroom with warm lamp, quiet corner at library, the neighborhood park bench',
    icon: Compass,
    colorClass: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-ink-900'
  },
  {
    key: 'reasonsToKeepGoing',
    titleKey: 'copingPlan.reasonsTitle',
    defaultTitle: '5. Reasons to Keep Going',
    subtitleKey: 'copingPlan.reasonsSubtitle',
    defaultSubtitle: 'What anchors you to hope, meaning, and tomorrow.',
    placeholderKey: 'copingPlan.reasonsPlaceholder',
    defaultPlaceholder: 'e.g. My dog Bruno, wanting to see the ocean again, my future self',
    icon: Sparkles,
    colorClass: 'text-danger dark:text-danger bg-sky-50 dark:bg-danger'
  }
];

export const CopingPlanSettings: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [plan, setPlan] = useState<CopingPlanData>({
    warningSigns: [],
    copingStrategies: [],
    peopleToContact: [],
    safePlaces: [],
    reasonsToKeepGoing: []
  });

  const [inputs, setInputs] = useState<Record<string, string>>({
    warningSigns: '',
    copingStrategies: '',
    peopleToContact: '',
    safePlaces: '',
    reasonsToKeepGoing: ''
  });

  useEffect(() => {
    let mounted = true;
    WellnessService.getCopingPlan()
      .then((data) => {
        if (mounted && data) {
          setPlan({
            warningSigns: Array.isArray(data.warningSigns) ? data.warningSigns : [],
            copingStrategies: Array.isArray(data.copingStrategies) ? data.copingStrategies : [],
            peopleToContact: Array.isArray(data.peopleToContact) ? data.peopleToContact : [],
            safePlaces: Array.isArray(data.safePlaces) ? data.safePlaces : [],
            reasonsToKeepGoing: Array.isArray(data.reasonsToKeepGoing) ? data.reasonsToKeepGoing : []
          });
        }
      })
      .catch((err) => {
        if (mounted) {
          showToast(err.message || 'Could not load coping plan', 'error');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const handleAddItem = (categoryKey: CopingCategoryKey) => {
    const text = (inputs[categoryKey] || '').trim();
    if (!text) return;

    const currentList = (plan[categoryKey] || []) as string[];
    if (currentList.length >= 10) {
      showToast(t('copingPlan.maxItems', 'Maximum 10 items per category'), 'info');
      return;
    }

    setPlan((prev: CopingPlanData) => ({
      ...prev,
      [categoryKey]: [...(prev[categoryKey] as string[]), text.slice(0, 200)]
    }));

    setInputs((prev: Record<string, string>) => ({
      ...prev,
      [categoryKey]: ''
    }));
  };

  const handleRemoveItem = (
    categoryKey: CopingCategoryKey,
    index: number
  ) => {
    setPlan((prev: CopingPlanData) => ({
      ...prev,
      [categoryKey]: (prev[categoryKey] as unknown[]).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await WellnessService.saveCopingPlan(plan);
      showToast(t('copingPlan.saveSuccess', 'Coping plan saved and encrypted securely!'), 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save plan';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl" id="coping-plan">
      {/* Intro Box */}
      <Card className="p-5 bg-surface   dark: dark: border-primary-100 dark:border-primary-900/40">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary-600 text-white shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-base text-ink-900 dark:text-sky-100">
              {t('copingPlan.heading', 'Personal Safety & Coping Plan')}
            </h3>
            <p className="text-xs text-muted dark:text-sky-200 leading-relaxed font-serif">
              {t(
                'copingPlan.introText',
                'When intense emotions or crisis thoughts arrive, thinking clearly is hard. Having your own written anchors ready makes all the difference. Your plan is saved with AES-256 encryption and shown directly in the SOS panel.'
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Categories */}
      <div className="space-y-5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const items = (plan[cat.key] || []) as Array<string | { name?: string; phone?: string }>;
          const inputValue = inputs[cat.key] || '';

          return (
            <Card key={cat.key} className="p-5 space-y-3 bg-white/80 dark:bg-slate-900/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`p-2 rounded-xl ${cat.colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-sm text-ink-900 dark:text-sky-100">
                      {t(cat.titleKey, cat.defaultTitle)}
                    </h4>
                    <p className="text-xs text-muted dark:text-muted">
                      {t(cat.subtitleKey, cat.defaultSubtitle)}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-muted font-mono">
                  {items.length}/10
                </span>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {items.map((item, idx) => {
                    const text = typeof item === 'string' ? item : `${item.name || ''} ${item.phone || ''}`.trim();
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-100 dark:bg-slate-800 text-xs text-ink-800 dark:text-border border border-border dark:border-slate-700 animate-fade-in"
                      >
                        <span>{text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(cat.key, idx)}
                          className="text-muted hover:text-danger dark:hover:text-danger transition-colors ml-0.5"
                          aria-label="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Add item input */}
              {items.length < 10 && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    maxLength={200}
                    value={inputValue}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [cat.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem(cat.key);
                      }
                    }}
                    placeholder={t(cat.placeholderKey, cat.defaultPlaceholder)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border dark:border-ink-800 bg-white dark:bg-slate-900 text-xs text-ink-900 dark:text-sky-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem(cat.key)}
                    disabled={!inputValue.trim()}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    {t('common.add', 'Add')}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Save Button & Security Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border dark:border-ink-800">
        <div className="flex items-center gap-1.5 text-xs text-muted dark:text-muted">
          <Lock className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400 shrink-0" />
          <span>{t('copingPlan.encryptedFooter', 'Encrypted at rest with AES-256. Private to your account.')}</span>
        </div>

        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          icon={<Save className="w-4 h-4" />}
          className="sm:w-auto w-full"
        >
          {t('copingPlan.saveButton', 'Save Coping Plan')}
        </Button>
      </div>
    </div>
  );
};
