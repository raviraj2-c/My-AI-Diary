import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StorybookExport } from '../../types';
import { StoryCover } from './StoryCover';
import { StoryEditModal } from './StoryEditModal';
import { ExportService } from '../../services/exportService';
import { Button } from '../common';
import { useToast } from '../common/Toast';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Edit3,
  Download,
  FileText,
  X,
  List,
  Volume2,
  Square
} from 'lucide-react';

interface StoryReaderProps {
  storybook: StorybookExport;
  onClose: () => void;
  onUpdate?: (updated: StorybookExport) => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({
  storybook: initialStorybook,
  onClose,
  onUpdate
}) => {
  const { t } = useTranslation();
  const [storybook, setStorybook] = useState<StorybookExport>(initialStorybook);
  const [currentPage, setCurrentPage] = useState<number>(0); // 0 = Cover, 1..N = Chapters
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const toast = useToast();
  const touchStartX = useRef<number | null>(null);

  const chapters = storybook.chapters && storybook.chapters.length > 0
    ? storybook.chapters
    : [{ chapterNumber: 1, title: 'Reflections', content: storybook.generatedContent || '' }];

  const totalPages = chapters.length + 1; // 0 = Cover, 1..chapters.length

  const handlePrev = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const activeChapter = currentPage > 0 ? chapters[currentPage - 1] : null;

  // Stop speech when chapter changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
    }
  }, [currentPage]);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleReadAloud = () => {
    if (!isSpeechSupported) return;

    if (isPlayingSpeech) {
      window.speechSynthesis.cancel();
      setIsPlayingSpeech(false);
      return;
    }

    window.speechSynthesis.cancel();

    let textToRead = '';
    if (currentPage === 0) {
      textToRead = `${storybook.title}. ${storybook.theme} memoir. ${storybook.protagonist?.name ? `Protagonist: ${storybook.protagonist.name}.` : ''}`;
    } else if (activeChapter) {
      textToRead = `${activeChapter.title}. ${activeChapter.content}`;
    }

    if (!textToRead.trim()) return;

    const cleanText = textToRead
      .replace(/<[^>]*>/g, ' ')
      .replace(/[#*_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Language: hi-IN for hi, en-IN for en and hinglish
    const isHindiText = /[\u0900-\u097F]/.test(cleanText);
    const langCode = (storybook.language === 'hi' || isHindiText) ? 'hi-IN' : 'en-IN';
    utterance.lang = langCode;

    try {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2)));
      if (match) utterance.voice = match;
    } catch {
      // Fallback
    }

    utterance.onend = () => setIsPlayingSpeech(false);
    utterance.onerror = () => setIsPlayingSpeech(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingSpeech(true);
  };

  // Keyboard navigation: Left/Right arrows & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditModalOpen) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen, handlePrev, handleNext, onClose]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      await ExportService.exportToPDF(storybook);
      toast.success(t('storybook.pdfSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('storybook.pdfError'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportText = () => {
    try {
      ExportService.exportToText(storybook);
      toast.success(t('storybook.textSuccess'));
    } catch (err) {
      console.error(err);
      toast.error(t('storybook.textError'));
    }
  };

  const handleSaveUpdate = (updated: StorybookExport) => {
    setStorybook(updated);
    if (onUpdate) onUpdate(updated);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#faf8f5] dark:bg-[#0b1120] text-ink-900 dark:text-sky-100 flex flex-col justify-between overflow-hidden select-none motion-reduce:transition-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Reading Navigation Bar */}
      <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-border dark:border-ink-800 bg-white/80 dark:bg-[#131d31]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted dark:text-muted hover:bg-sky-100 dark:hover:bg-ink-800 transition-colors"
            title={t('storybook.closeReader')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <h2 className="text-sm font-serif font-bold text-ink-900 dark:text-sky-100 truncate max-w-xs md:max-w-md">
              {storybook.title}
            </h2>
            <p className="text-[11px] text-muted capitalize">
              {t('storybook.memoirWithChapters', { theme: storybook.theme, count: chapters.length })}
            </p>
          </div>
        </div>

        {/* Center Chapter Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsChapterMenuOpen(!isChapterMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border dark:border-text bg-white dark:bg-[#1e293b] text-xs font-medium text-ink-800 dark:text-border hover:border-sky-200 shadow-soft-sm"
          >
            <List className="w-3.5 h-3.5 text-muted" />
            <span>
              {currentPage === 0
                ? t('storybook.coverPage')
                : t('storybook.chapterLabel', { num: currentPage, title: activeChapter?.title || '' })}
            </span>
          </button>

          {isChapterMenuOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white dark:bg-[#1e293b] border border-border dark:border-text shadow-soft-xl p-1.5 z-30 animate-fade-in">
              <button
                onClick={() => {
                  setCurrentPage(0);
                  setIsChapterMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  currentPage === 0
                    ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 font-semibold'
                    : 'text-text dark:text-sky-200 hover:bg-sky-50 dark:hover:bg-ink-800'
                }`}
              >
                {t('storybook.coverPage')}
              </button>
              {chapters.map((ch, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentPage(idx + 1);
                    setIsChapterMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors truncate ${
                    currentPage === idx + 1
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 font-semibold'
                      : 'text-text dark:text-sky-200 hover:bg-sky-50 dark:hover:bg-ink-800'
                  }`}
                >
                  {ch.chapterNumber || idx + 1}. {ch.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {isSpeechSupported && (
            <Button
              variant={isPlayingSpeech ? 'primary' : 'outline'}
              size="sm"
              onClick={handleToggleReadAloud}
              icon={isPlayingSpeech ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              <span>{isPlayingSpeech ? t('storybook.stopReadAloud') : t('storybook.readAloud')}</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
          >
            {t('storybook.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            loading={isExportingPdf}
            icon={<Download className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            {t('storybook.pdf')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportText}
            icon={<FileText className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            {t('storybook.text')}
          </Button>
        </div>
      </header>

      {/* Main Book Reader Canvas */}
      <main className="flex-1 overflow-y-auto px-4 md:px-12 py-8 flex items-center justify-center">
        <div className="max-w-3xl w-full mx-auto">
          {currentPage === 0 ? (
            /* Cover Page */
            <div className="flex flex-col items-center justify-center py-6 animate-fade-in motion-reduce:transition-none">
              <StoryCover
                theme={storybook.theme}
                title={storybook.title}
                protagonist={storybook.protagonist?.name}
                timeframe={storybook.timeframe}
                size="full"
              />
              <p className="mt-6 text-xs text-muted dark:text-muted font-mono tracking-wide">
                {t('storybook.pressRightArrow')}
              </p>
            </div>
          ) : (
            /* Chapter Page */
            <article
              key={currentPage}
              className="bg-white/90 dark:bg-[#131d31]/90 rounded-3xl p-6 sm:p-12 md:p-16 border border-border dark:border-ink-800 shadow-soft-lg animate-fade-in motion-reduce:transition-none"
            >
              <div className="mb-8 pb-4 border-b border-sky-100 dark:border-ink-800 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-widest font-mono text-primary-600 dark:text-primary-400 font-semibold">
                    {t('storybook.chapterOnly', { num: activeChapter?.chapterNumber || currentPage })}
                  </span>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-ink-900 dark:text-sky-50 mt-1">
                    {activeChapter?.title}
                  </h3>
                </div>
                <BookOpen className="w-6 h-6 text-sky-200 dark:text-text shrink-0" />
              </div>

              <div className="font-serif text-lg sm:text-xl md:text-2xl leading-relaxed sm:leading-loose text-ink-800 dark:text-border whitespace-pre-line tracking-wide">
                {activeChapter?.content}
              </div>
            </article>
          )}
        </div>
      </main>

      {/* Bottom Footer Navigation Bar */}
      <footer className="h-16 px-4 md:px-8 flex items-center justify-between border-t border-border dark:border-ink-800 bg-white/80 dark:bg-[#131d31]/80 backdrop-blur-md z-20">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentPage === 0}
          icon={<ChevronLeft className="w-4 h-4" />}
        >
          {t('storybook.prev')}
        </Button>

        <div className="flex items-center gap-3">
          {isSpeechSupported && (
            <Button
              variant={isPlayingSpeech ? 'primary' : 'outline'}
              size="sm"
              onClick={handleToggleReadAloud}
              icon={isPlayingSpeech ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            >
              <span>{isPlayingSpeech ? t('storybook.stopReadAloud') : t('storybook.readAloud')}</span>
            </Button>
          )}
          <span className="text-xs font-mono text-muted dark:text-muted">
            {t('storybook.pageOf', { current: currentPage + 1, total: totalPages })}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleNext}
          disabled={currentPage >= totalPages - 1}
        >
          <span>{t('storybook.next')}</span>
          <ChevronRight className="w-4 h-4 ml-1.5" />
        </Button>
      </footer>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <StoryEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          storybook={storybook}
          onSave={handleSaveUpdate}
        />
      )}
    </div>
  );
};

export default StoryReader;
