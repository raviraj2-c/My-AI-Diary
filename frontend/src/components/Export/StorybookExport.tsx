import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DiaryEntry, StorybookExport as StorybookExportType } from '../../types';
import { AIService } from '../../services/aiService';
import { ExportService } from '../../services/exportService';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { StoryCover } from './StoryCover';
import { StoryReader } from './StoryReader';
import { StoryEditModal } from './StoryEditModal';
import { SafetyBanner } from '../Wellness/SafetyBanner';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../common/Toast';
import {
  BookOpen,
  Sparkles,
  Download,
  Edit3,
  FileText,
  RefreshCw,
  CheckSquare,
  Wand2,
  Smile,
  Layers,
  Languages
} from 'lucide-react';

interface StorybookExportProps {
  entries: DiaryEntry[];
}

export const StorybookExport: React.FC<StorybookExportProps> = ({ entries }) => {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [selectedTheme, setSelectedTheme] = useState<StorybookExportType['theme']>('dramatic');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [protagonistNickname, setProtagonistNickname] = useState<string>('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [language, setLanguage] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [tone, setTone] = useState<'gentle' | 'hopeful' | 'funny' | 'reflective'>('reflective');
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [isEntryPickerOpen, setIsEntryPickerOpen] = useState(false);
  const [storybookError, setStorybookError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [storybook, setStorybook] = useState<StorybookExportType | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState(false);

  const toast = useToast();

  const themes: Array<{ value: StorybookExportType['theme']; label: string; description: string; emoji: string }> = [
    { value: 'romantic', label: t('export.themeRomantic'), description: t('export.themeRomanticDesc'), emoji: '💌' },
    { value: 'dramatic', label: t('export.themeDramatic'), description: t('export.themeDramaticDesc'), emoji: '🎭' },
    { value: 'adventure', label: t('export.themeAdventure'), description: t('export.themeAdventureDesc'), emoji: '🧭' },
    { value: 'mystery', label: t('export.themeMystery'), description: t('export.themeMysteryDesc'), emoji: '🔍' },
    { value: 'comedy', label: t('export.themeComedy'), description: t('export.themeComedyDesc'), emoji: '☀️' },
  ];

  const handleToggleEntry = (id: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEntries = () => {
    if (selectedEntryIds.length === entries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(entries.map((e) => e.id).filter(Boolean));
    }
  };

  const handleGenerate = async () => {
    if (entries.length === 0) {
      toast.warning(t('export.noEntries'));
      return;
    }

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (startDate) {
      start = new Date(startDate);
      end = new Date();
    } else if (endDate) {
      start = new Date(0);
      end = new Date(endDate);
    } else {
      start = new Date();
      end = new Date();
    }

    setIsGenerating(true);
    setStorybookError(null);
    try {
      const generatedStorybook = await AIService.generateStorybook(
        entries,
        selectedTheme,
        { start, end },
        {
          protagonistNickname: protagonistNickname.trim() || undefined,
          length,
          language,
          tone,
          entryIds: selectedEntryIds.length > 0 ? selectedEntryIds : undefined
        }
      );
      setStorybook(generatedStorybook);
      if (generatedStorybook.excludedCount && generatedStorybook.excludedCount > 0) {
        setCrisisAlert(true);
      } else {
        setCrisisAlert(false);
      }
      toast.success(t('export.storybookWoven'));
    } catch (error) {
      console.error('Error generating storybook:', error);
      if ((error as unknown as { safety?: { level?: string } })?.safety?.level === 'high') {
        setCrisisAlert(true);
      }
      const apiErr = error as { code?: string; message?: string };
      const msg = apiErr?.code === 'AI_BLOCKED'
        ? t('ai.blocked')
        : apiErr?.code === 'AI_TRUNCATED'
          ? t('ai.truncated')
          : apiErr?.code === 'AI_EMPTY'
            ? t('ai.empty')
            : (error instanceof Error ? error.message : t('common.error'));
      setStorybookError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!storybook) return;
    setIsExportingPdf(true);
    try {
      await ExportService.exportToPDF(storybook);
      toast.success(t('export.toastPdfSuccess'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(t('export.toastPdfError'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportText = () => {
    if (!storybook) return;
    try {
      ExportService.exportToText(storybook);
      toast.success(t('export.toastTextSuccess'));
    } catch (error) {
      console.error('Error exporting text:', error);
      toast.error(t('export.toastTextError'));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-sky-50">
                {t('export.generatorTitle')}
              </h2>
              <p className="text-xs text-muted dark:text-muted">
                {t('export.generatorSubtitle')}
              </p>
            </div>
          </div>

          <Link to="/stories">
            <Button variant="outline" size="sm" icon={<BookOpen className="w-3.5 h-3.5" />}>
              {t('export.viewLibrary')}
            </Button>
          </Link>
        </div>

        {storybookError && (
          <div className="mb-4 p-3.5 rounded-xl bg-sky-50 dark:bg-danger border border-danger dark:border-danger flex items-center justify-between gap-3">
            <span className="text-xs text-danger dark:text-danger">{storybookError}</span>
            <Button variant="outline" size="sm" onClick={handleGenerate} className="shrink-0 text-xs">
              {t('ai.retry')}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Theme & Tone */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-3">
                {t('export.chooseTone')}
              </label>
              <div className="space-y-2.5">
                {themes.map((theme) => {
                  const isSelected = selectedTheme === theme.value;
                  return (
                    <label
                      key={theme.value}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100 shadow-xs'
                          : 'border-border dark:border-ink-800 hover:border-sky-200 dark:hover:border-text bg-white dark:bg-[#1e293b]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={theme.value}
                        checked={isSelected}
                        onChange={(e) => setSelectedTheme(e.target.value as StorybookExportType['theme'])}
                        className="mt-1 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-1.5 text-ink-900 dark:text-sky-100">
                          <span>{theme.emoji}</span>
                          <span>{theme.label}</span>
                        </div>
                        <div className="text-xs text-muted dark:text-muted mt-0.5">
                          {theme.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Tone & Length Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2">
                  <Smile className="w-3.5 h-3.5 text-muted" />
                  <span>{t('export.toneLabel')}</span>
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as typeof tone)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-xs text-ink-800 dark:text-sky-100 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                >
                  <option value="reflective">{t('export.toneReflective')}</option>
                  <option value="gentle">{t('export.toneGentle')}</option>
                  <option value="hopeful">{t('export.toneHopeful')}</option>
                  <option value="funny">{t('export.toneFunny')}</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2">
                  <Layers className="w-3.5 h-3.5 text-muted" />
                  <span>{t('export.lengthLabel')}</span>
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as typeof length)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-xs text-ink-800 dark:text-sky-100 focus:ring-2 focus:ring-primary-400 focus:outline-none"
                >
                  <option value="short">{t('export.lengthShort')}</option>
                  <option value="medium">{t('export.lengthMedium')}</option>
                  <option value="long">{t('export.lengthLong')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200 mb-2">
                <Languages className="w-3.5 h-3.5 text-muted" />
                <span>{t('export.storyLang')}</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as typeof language)}
                className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-xs text-ink-800 dark:text-sky-100 focus:ring-2 focus:ring-primary-400 focus:outline-none"
              >
                <option value="en">{t('export.langEn')}</option>
                <option value="hi">{t('export.langHi')}</option>
                <option value="hinglish">{t('export.langHinglish')}</option>
              </select>
            </div>
          </div>

          {/* Right Column: Time Horizon, Protagonist & Optional Entry Picker */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text dark:text-sky-200">
                {t('export.step2Title')}
              </label>

              <div>
                <label
                  htmlFor="sb-protagonist"
                  className="block text-xs text-muted dark:text-muted mb-1 font-medium"
                >
                  {t('export.protagonistNameWithLimit')}
                </label>
                <input
                  id="sb-protagonist"
                  type="text"
                  maxLength={30}
                  placeholder={t('export.protagonistPlaceholder')}
                  value={protagonistNickname}
                  onChange={(e) => setProtagonistNickname(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-xl text-sm text-ink-800 dark:text-sky-100 focus:ring-2 focus:ring-primary-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Date Range Fields */}
              <div className="p-3.5 rounded-xl border border-border dark:border-ink-800 bg-sky-50 dark:bg-ink-900 space-y-3">
                <div className="text-xs font-semibold text-text dark:text-sky-200 flex items-center justify-between">
                  <span>{t('export.dateHorizon')}</span>
                  {selectedEntryIds.length > 0 && (
                    <span className="text-[11px] font-normal text-primary-600 dark:text-primary-400">
                      {t('export.bypassedByPicker')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="sb-start-date" className="block text-[11px] text-muted mb-1">
                      {t('export.from')}
                    </label>
                    <input
                      id="sb-start-date"
                      type="date"
                      disabled={selectedEntryIds.length > 0}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-lg text-xs text-ink-800 dark:text-sky-100 focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label htmlFor="sb-end-date" className="block text-[11px] text-muted mb-1">
                      {t('export.until')}
                    </label>
                    <input
                      id="sb-end-date"
                      type="date"
                      disabled={selectedEntryIds.length > 0}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-border dark:border-text rounded-lg text-xs text-ink-800 dark:text-sky-100 focus:ring-2 focus:ring-primary-400 focus:outline-none disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Specific Entry Selection Accordion */}
              <div className="border border-border dark:border-ink-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsEntryPickerOpen(!isEntryPickerOpen)}
                  className="w-full px-3.5 py-2.5 bg-sky-50 dark:bg-ink-900 flex items-center justify-between text-xs font-semibold text-text dark:text-sky-200 hover:bg-sky-100 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-primary-500" />
                    <span>{t('export.chooseSpecific', { count: selectedEntryIds.length })}</span>
                  </span>
                  <span className="text-[11px] text-primary-600 font-normal">
                    {isEntryPickerOpen ? t('export.hidePicker') : t('export.openPicker')}
                  </span>
                </button>

                {isEntryPickerOpen && (
                  <div className="p-3 bg-white dark:bg-[#0f172a] border-t border-sky-100 dark:border-ink-800 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-sky-100 dark:border-ink-800 text-[11px] text-muted">
                      <span>{t('export.selectIndividual')}</span>
                      <button
                        type="button"
                        onClick={handleSelectAllEntries}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {selectedEntryIds.length === entries.length ? t('export.deselectAll') : t('export.selectAll')}
                      </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {entries.length === 0 ? (
                        <p className="text-xs text-muted py-2">{t('export.noEntriesFound')}</p>
                      ) : (
                        entries.map((entry) => {
                          const id = entry.id;
                          const isChecked = selectedEntryIds.includes(id);
                          return (
                            <label
                              key={id}
                              className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                isChecked
                                  ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-900 dark:text-primary-100'
                                  : 'hover:bg-sky-50 dark:hover:bg-ink-800 text-text dark:text-sky-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleEntry(id)}
                                className="rounded text-primary-600 focus:ring-primary-500"
                              />
                              <span className="truncate flex-1 font-medium">
                                {entry.title || t('diary.untitled')}
                              </span>
                              <span className="text-[10px] text-muted shrink-0">
                                {new Intl.DateTimeFormat(i18n.language === 'hi' ? 'hi-IN' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                }).format(new Date(entry.entryDate || entry.createdAt || Date.now()))}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!settings.allowAIFeatures && (
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-900 text-xs text-sky-700 dark:text-sky-200 flex items-center justify-between">
                  <span>{t('export.aiDisabled')}</span>
                  <Link to="/settings" className="underline font-semibold ml-2 hover:text-ink-900">
                    {t('export.enableInSettings')}
                  </Link>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              variant="primary"
              size="lg"
              loading={isGenerating}
              icon={<Wand2 className="h-4 w-4" />}
              className="w-full mt-6"
            >
              {isGenerating
                ? t('export.generatingStorybook')
                : t('export.generateStorybook')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Safety Alert if all entries were high-risk */}
      {crisisAlert && !storybook && (
        <div className="space-y-3">
          <SafetyBanner
            level="high"
            country={settings.country}
            trustedContact={settings.trustedContact}
            onDismiss={() => setCrisisAlert(false)}
          />
        </div>
      )}

      {/* Generated Storybook Display */}
      {storybook && (
        <Card className="p-6 md:p-8 animate-slide-up border-border dark:border-ink-800 space-y-6">
          {/* Gentle crisis notice if any entries were excluded */}
          {((storybook.excludedCount ?? 0) > 0 || storybook.safety?.level === 'high') && (
            <div className="space-y-3 border-b border-sky-100 dark:border-ink-800 pb-6">
              <SafetyBanner
                level="high"
                country={settings.country}
                trustedContact={settings.trustedContact}
              />
              <p className="text-xs text-sky-700 dark:text-sky-200 bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-sky-700 rounded-xl p-3 font-serif">
                {t('storybook.excludedEntriesGentleNotice')}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-sky-100 dark:border-ink-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('export.chapterBadge')}</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-ink-900 dark:text-sky-50">
                {storybook.title}
              </h3>
            </div>

            {/* Actions: Read Book Mode, Regenerate, Edit, PDF, Text */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setIsReaderOpen(true)}
                variant="primary"
                size="sm"
                icon={<BookOpen className="h-4 w-4" />}
              >
                {t('export.readBook')}
              </Button>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                size="sm"
                icon={<Edit3 className="h-4 w-4" />}
              >
                {t('export.edit')}
              </Button>
              <Button
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                loading={isGenerating}
                icon={<RefreshCw className="h-4 w-4" />}
                title={t('export.regenerateTooltip')}
              >
                {t('export.regenerate')}
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
                loading={isExportingPdf}
                icon={<Download className="h-4 w-4" />}
              >
                {t('storybook.pdf')}
              </Button>
              <Button
                onClick={handleExportText}
                variant="secondary"
                size="sm"
                icon={<FileText className="h-4 w-4" />}
              >
                {t('export.text')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
            {/* Visual Cover Preview */}
            <div className="flex justify-center md:justify-start">
              <StoryCover
                theme={storybook.theme}
                title={storybook.title}
                protagonist={storybook.protagonist?.name}
                timeframe={storybook.timeframe}
                size="md"
              />
            </div>

            {/* Chapters Text Preview */}
            <div className="md:col-span-2 space-y-6">
              {storybook.protagonist?.name && (
                <div className="text-sm font-medium text-muted dark:text-muted italic">
                  <span>{t('export.protagonistLabel', { name: storybook.protagonist.name })}</span>
                </div>
              )}
              {storybook.chapters && storybook.chapters.length > 0 ? (
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                  {storybook.chapters.map((ch, idx) => (
                    <article
                      key={idx}
                      className="space-y-2 border-b border-sky-100 dark:border-ink-800 pb-6 last:border-b-0"
                    >
                      <h4 className="text-lg font-serif font-bold text-ink-900 dark:text-sky-100">
                        {ch.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-text dark:text-sky-200 whitespace-pre-line font-serif">
                        {ch.content}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-text dark:text-sky-200 whitespace-pre-line font-serif">
                  {storybook.generatedContent.replace(/[#*]/g, '').trim()}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Reader Fullscreen Modal */}
      {isReaderOpen && storybook && (
        <StoryReader
          storybook={storybook}
          onClose={() => setIsReaderOpen(false)}
          onUpdate={(updated) => setStorybook(updated)}
        />
      )}

      {/* Inline Edit Modal */}
      {isEditModalOpen && storybook && (
        <StoryEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          storybook={storybook}
          onSave={(updated) => setStorybook(updated)}
        />
      )}
    </div>
  );
};

export default StorybookExport;
