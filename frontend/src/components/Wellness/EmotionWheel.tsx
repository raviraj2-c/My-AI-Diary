import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMOTION_WHEEL, CoreEmotion } from '../../data/emotions';
import { X, Check } from 'lucide-react';
import { Badge } from '../common/Badge';

interface EmotionWheelProps {
  selectedEmotions: string[];
  onChange: (emotions: string[]) => void;
  maxSelection?: number;
}

export const EmotionWheel: React.FC<EmotionWheelProps> = ({
  selectedEmotions = [],
  onChange,
  maxSelection = 5
}) => {
  const { t } = useTranslation();
  const [activeCore, setActiveCore] = useState<CoreEmotion | null>(EMOTION_WHEEL[0]);

  const toggleEmotion = (emotionName: string) => {
    if (selectedEmotions.includes(emotionName)) {
      onChange(selectedEmotions.filter((e) => e !== emotionName));
    } else {
      if (selectedEmotions.length < maxSelection) {
        onChange([...selectedEmotions, emotionName]);
      }
    }
  };

  const removeEmotion = (name: string) => {
    onChange(selectedEmotions.filter((e) => e !== name));
  };

  return (
    <div className="space-y-4">
      {/* Selected emotions pill strip */}
      {selectedEmotions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-calm-50 dark:bg-calm-900/40 border border-calm-100 dark:border-calm-800">
          <span className="text-xs font-semibold text-calm-500 mr-1">{t('emotionWheel.selected')}</span>
          {selectedEmotions.map((em) => (
            <Badge key={em} variant="primary" size="sm" className="flex items-center gap-1">
              <span>{em}</span>
              <button
                type="button"
                onClick={() => removeEmotion(em)}
                aria-label={t('emotionWheel.removeEmotion', { name: em })}
                className="hover:opacity-75 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {selectedEmotions.length >= maxSelection && (
            <span className="text-[10px] text-calm-400 ml-auto">{t('emotionWheel.maxReached', { max: maxSelection })}</span>
          )}
        </div>
      )}

      {/* Step 1: Core Emotions */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-calm-700 dark:text-calm-300 mb-2">
          {t('emotionWheel.chooseCore')}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {EMOTION_WHEEL.map((core) => {
            const isCurrent = activeCore?.id === core.id;
            return (
              <button
                key={core.id}
                type="button"
                onClick={() => {
                  setActiveCore(core);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  isCurrent
                    ? `${core.badgeClass} ring-2 ring-primary-500 font-semibold shadow-soft-sm scale-[1.02]`
                    : 'bg-white dark:bg-[#1e293b] border-calm-200 dark:border-calm-800 hover:border-calm-300 text-calm-800 dark:text-calm-200'
                }`}
              >
                <span className="text-xl">{core.emoji}</span>
                <span className="text-xs">{core.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Nuanced Emotion Branches */}
      {activeCore && (
        <div className="p-4 rounded-2xl bg-calm-50/50 dark:bg-calm-900/20 border border-calm-200/80 dark:border-calm-800 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-calm-800 dark:text-calm-200 flex items-center gap-1.5">
              <span>{activeCore.emoji}</span>
              <span>{t('emotionWheel.exploreNuances', { name: activeCore.name })}</span>
            </span>
            <span className="text-calm-400">{t('emotionWheel.clickToSelect')}</span>
          </div>

          <div className="space-y-2.5">
            {activeCore.subEmotions.map((subGroup) => (
              <div key={subGroup.name} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleEmotion(subGroup.name)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      selectedEmotions.includes(subGroup.name)
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-white dark:bg-[#1e293b] border-calm-200 dark:border-calm-700 text-calm-700 dark:text-calm-300 hover:bg-calm-100'
                    }`}
                  >
                    {selectedEmotions.includes(subGroup.name) && <Check className="w-3 h-3" />}
                    <span>{subGroup.name}</span>
                  </button>
                  <span className="text-calm-300 text-xs">→</span>
                  <div className="flex flex-wrap gap-1.5">
                    {subGroup.subEmotions.map((sub) => {
                      const isSelected = selectedEmotions.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleEmotion(sub)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-primary-500 text-white border-primary-500 font-medium'
                              : 'bg-white/80 dark:bg-[#0f172a]/60 border-calm-200 dark:border-calm-700/80 text-calm-600 dark:text-calm-400 hover:border-calm-300'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
