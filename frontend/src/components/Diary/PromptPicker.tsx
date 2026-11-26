import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROMPT_CATEGORIES, getRandomPrompt, PromptCategory } from '../../data/prompts';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sparkles, Dices, ChevronRight } from 'lucide-react';

interface PromptPickerProps {
  onSelectPrompt: (prompt: string) => void;
  className?: string;
}

export const PromptPicker: React.FC<PromptPickerProps> = ({ onSelectPrompt, className = '' }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PromptCategory>(PROMPT_CATEGORIES[0]);
  const [quickRandom, setQuickRandom] = useState<string>(getRandomPrompt());

  const handleSelect = (promptText: string) => {
    onSelectPrompt(promptText);
    setIsOpen(false);
  };

  const rollNewPrompt = () => {
    setQuickRandom(getRandomPrompt());
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 transition-colors ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-primary-600" />
        <span>{t('write.pickPrompt', 'Give me a prompt')}</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('write.pickPrompt', 'Inspirational Writing Prompts')}
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Quick Random Spotlight */}
          <div className="p-4 rounded-2xl bg-surface   dark: dark: border border-primary-200/60 dark:border-primary-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                {t('promptPicker.spark')}
              </span>
              <p className="text-sm font-serif italic text-ink-900 dark:text-sky-100">
                "{quickRandom}"
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={rollNewPrompt}
                className="p-2 rounded-xl bg-white dark:bg-[#1e293b] border border-border text-muted hover:text-ink-900 dark:hover:text-sky-100 text-xs flex items-center gap-1 transition-colors"
                title={t('promptPicker.useThis')}
              >
                <Dices className="w-4 h-4" />
              </button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => handleSelect(quickRandom)}
              >
                {t('promptPicker.useThis')}
              </Button>
            </div>
          </div>

          {/* Categories Grid and Prompts List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category tabs */}
            <div className="space-y-1 md:border-r border-sky-100 dark:border-ink-800 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block px-2 mb-1">
                {t('promptPicker.categories')}
              </span>
              {PROMPT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    activeCategory.id === cat.id
                      ? 'bg-primary-600 text-white font-semibold shadow-xs'
                      : 'text-text dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-ink-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>

            {/* Prompts in active category */}
            <div className="md:col-span-2 space-y-2 max-h-72 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block px-1 mb-1">
                {t('promptPicker.categoryPrompts', { category: activeCategory.name })}
              </span>
              {activeCategory.prompts.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(p)}
                  className="p-3 rounded-xl border border-border dark:border-ink-800 bg-white dark:bg-[#1e293b] hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 cursor-pointer transition-all text-xs font-serif text-ink-800 dark:text-border leading-relaxed group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span>{p}</span>
                    <span className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity font-sans text-[11px] shrink-0 font-medium">
                      {t('promptPicker.insert')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
