import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Save,
  X,
  Tag,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  FileCheck2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { DiaryEntry, MediaItem } from '../../types';
import { getAllMoods, getMoodMeta } from '../../utils/moods';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';
import { useSettings } from '../../hooks/useSettings';
import { AIService } from '../../services/aiService';
import { MediaUploader } from './MediaUploader';
import { VoiceInput } from './VoiceInput';
import { PromptPicker } from './PromptPicker';
import { EmotionWheel } from '../Wellness/EmotionWheel';
import { useAuth } from '../../contexts/AuthContext';
import { getDraftKey, cleanExpiredDrafts } from '../../utils/storage';
import { getLocalDateKey, getTodayDateKey } from '../../utils/dates';

interface DiaryEditorProps {
  entry?: DiaryEntry;
  onSave: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const allMoods = getAllMoods();

export const DiaryEditor: React.FC<DiaryEditorProps> = ({ entry, onSave, onCancel }) => {
  const { t } = useTranslation();
  const { info, success } = useToast();
  const { settings } = useSettings();
  const { user } = useAuth();
  const draftKey = getDraftKey(user?.id, entry?.id);

  useEffect(() => {
    cleanExpiredDrafts(30);
  }, []);

  const initialDateStr = entry?.entryDate
    ? getLocalDateKey(entry.entryDate)
    : entry?.date
    ? getLocalDateKey(entry.date)
    : getTodayDateKey();

  const [title, setTitle] = useState(entry?.title || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [mood, setMood] = useState<DiaryEntry['mood']>(entry?.mood || 'peaceful');
  const [moodScore, setMoodScore] = useState<number>(entry?.moodScore ?? 5);
  const [emotions, setEmotions] = useState<string[]>(entry?.emotions || []);
  const [prompt, setPrompt] = useState<string | undefined>(entry?.prompt);
  const [showEmotionsSection, setShowEmotionsSection] = useState(false);
  const [date, setDate] = useState<string>(initialDateStr);
  const [media, setMedia] = useState<MediaItem[]>(entry?.media || []);
  const [aiExcluded, setAiExcluded] = useState<boolean>(Boolean(entry?.aiExcluded));
  const [newTag, setNewTag] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // AI Mood Discrepancy & Writing Starters
  const [moodDiscrepancy, setMoodDiscrepancy] = useState<{ suggestedScore: number; suggestedEmotions: string[] } | null>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const [isLoadingStarters, setIsLoadingStarters] = useState(false);
  const [showStartersMenu, setShowStartersMenu] = useState(false);
  const [isCheckingMood, setIsCheckingMood] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'How is your heart feeling today? Pour your thoughts here without judgment...'
      })
    ],
    content: entry?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[360px] font-serif leading-relaxed text-gray-800 dark:text-gray-200'
      }
    }
  });

  // Live word count & reading time
  const [wordCount, setWordCount] = useState(0);
  const updateStats = useCallback(() => {
    if (!editor) return;
    const text = editor.getText();
    const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
  }, [editor]);

  const handleGetStarters = async () => {
    if (!settings.allowAIFeatures) {
      info('AI features are disabled in Settings. Enable them to use writing starters.');
      return;
    }
    setIsLoadingStarters(true);
    try {
      const result = await AIService.getWritingStarters(prompt || title);
      setStarters(result);
      setShowStartersMenu(true);
    } catch {
      info('Could not fetch starters right now.');
    } finally {
      setIsLoadingStarters(false);
    }
  };

  const handleInsertStarter = (starterText: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`<p>${starterText} </p>`).run();
    }
    setShowStartersMenu(false);
  };

  const handleCheckMood = async () => {
    if (!settings.allowAIFeatures) {
      info('AI features are disabled in Settings. Enable them to use tone analysis.');
      return;
    }
    if (aiExcluded) {
      info('This entry is hidden from AI features.');
      return;
    }
    if (!editor) return;
    const currentText = editor.getText();
    if (!currentText || currentText.trim().split(/\s+/).length < 10) {
      info('Write a little more before checking tone.');
      return;
    }
    setIsCheckingMood(true);
    try {
      const analysis = await AIService.analyzeMood(currentText);
      const isUserHappy = moodScore >= 7 || ['happy', 'excited', 'grateful'].includes(mood);
      if (isUserHappy && analysis.suggestedScore <= 4) {
        setMoodDiscrepancy({
          suggestedScore: analysis.suggestedScore,
          suggestedEmotions: analysis.suggestedEmotions
        });
      } else {
        setMoodDiscrepancy(null);
        info(`Detected tone: ${analysis.suggestedEmotions.join(', ')} (score: ${analysis.suggestedScore}/10)`);
      }
    } catch {
      info('Could not analyze mood tone right now.');
    } finally {
      setIsCheckingMood(false);
    }
  };

  useEffect(() => {
    if (!editor) return;
    editor.on('update', updateStats);
    updateStats();
    return () => {
      editor.off('update', updateStats);
    };
  }, [editor, updateStats]);

  // Restore draft on mount if available
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.content && parsed.content !== entry?.content) {
          setTitle(parsed.title || '');
          setMood(parsed.mood || 'peaceful');
          if (parsed.moodScore != null) setMoodScore(parsed.moodScore);
          if (Array.isArray(parsed.emotions)) setEmotions(parsed.emotions);
          if (parsed.prompt) setPrompt(parsed.prompt);
          setDate(parsed.date || initialDateStr);
          setTags(parsed.tags || []);
          if (parsed.aiExcluded !== undefined) setAiExcluded(Boolean(parsed.aiExcluded));
          if (Array.isArray(parsed.media)) {
            setMedia(parsed.media);
          }
          if (editor && parsed.content) {
            editor.commands.setContent(parsed.content);
          }
          setDraftSavedAt(new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          info('Restored your unsaved draft.');
        }
      }
    } catch {
      // ignore
    }
  }, [draftKey, editor, entry?.content, info, initialDateStr]);

  // Periodic autosave every 5 seconds if changed
  const lastSavedRef = useRef<string>('');
  useEffect(() => {
    const timer = setInterval(() => {
      if (!editor) return;
      const currentContent = editor.getHTML();
      const payload = {
        title,
        content: currentContent,
        mood,
        moodScore,
        emotions,
        prompt,
        date,
        tags,
        media,
        aiExcluded,
        savedAt: new Date().toISOString()
      };
      const stringified = JSON.stringify(payload);
      if (stringified !== lastSavedRef.current && (title.trim() || editor.getText().trim() || media.length > 0)) {
        localStorage.setItem(draftKey, stringified);
        lastSavedRef.current = stringified;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setDraftSavedAt(now);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [draftKey, editor, title, mood, moodScore, emotions, prompt, date, tags, media, aiExcluded]);

  const handleSave = () => {
    if (!editor || !title.trim()) return;

    const content = editor.getHTML();
    const parsedDate = new Date(date);

    onSave({
      userId: entry?.userId || '',
      title: title.trim(),
      content,
      tags,
      mood,
      moodScore,
      emotions,
      prompt,
      media,
      images: media.filter(m => m.type === 'image').map(m => m.url),
      aiExcluded,
      entryDate: parsedDate,
      date: parsedDate
    });

    localStorage.removeItem(draftKey);
    success('Diary entry saved.');
  };

  const handleCancel = () => {
    localStorage.removeItem(draftKey);
    onCancel();
  };

  const addTag = () => {
    const clean = newTag.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const activeMoodMeta = getMoodMeta(mood);
  const MoodIcon = activeMoodMeta.icon;

  return (
    <div className={`transition-all duration-300 ${focusMode
      ? 'fixed inset-0 z-50 bg-white dark:bg-[#0b1120] overflow-y-auto p-4 sm:p-12 flex flex-col items-center'
      : 'max-w-4xl mx-auto'
      }`}>
      <div className={`w-full bg-white dark:bg-[#131d31] rounded-3xl border border-gray-100 dark:border-gray-800/80 shadow-soft-md overflow-hidden ${focusMode ? 'max-w-3xl my-auto border-none shadow-none dark:bg-transparent' : ''
        }`}>
        {/* Top bar with focus toggle & draft indicator */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3">
            <span className="text-xl" role="img" aria-hidden="true">{t('diary.editorEmoji')}</span>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {entry?.id ? t('write.editTitle') : t('write.title')}
              </h2>
              {draftSavedAt && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <FileCheck2 className="h-3 w-3 text-calm-600 dark:text-calm-400" />
                  <span>{t('write.draftSaved', { time: draftSavedAt })}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFocusMode((prev) => !prev)}
              aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors"
            >
              {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>
          </div>
        </div>

        {/* Title input */}
        <div className="p-6 pb-4 border-b border-gray-50 dark:border-gray-800/60">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('write.titlePlaceholder', 'Give this moment a title...')}
            className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:ring-0"
          />
        </div>

        {/* Metadata Controls (Date & Mood) */}
        {!focusMode && (
          <div className="p-6 py-4 border-b border-gray-100 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-900/20 space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('calendar.title', 'Entry Date')}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('write.moodLabel', 'Current Mood')}
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-none pb-1">
                    {allMoods.map((m) => {
                      const isSelected = mood === m.value;
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMood(m.value)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${isSelected
                            ? `${m.badgeClass} ring-2 ring-offset-1 ring-calm-400 font-semibold shadow-soft-sm`
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mood Score Slider */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t('diary.moodScoreLabel')}
                    </label>
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {t('diary.moodScoreDisplay', { score: moodScore })}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodScore}
                    onChange={(e) => setMoodScore(parseInt(e.target.value, 10))}
                    className="w-24 sm:w-28 accent-primary-600 cursor-pointer"
                  />
                </div>

                {/* Nuanced feelings button */}
                <div className="self-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => setShowEmotionsSection((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${emotions.length > 0 || showEmotionsSection
                      ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                      }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{emotions.length > 0 ? `${emotions.length} Feelings` : 'Feelings Wheel'}</span>
                    {showEmotionsSection ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Explicit Check My Mood Button (On-demand AI) */}
                {settings.allowAIFeatures && !aiExcluded && (
                  <div className="self-end pb-0.5">
                    <button
                      type="button"
                      onClick={handleCheckMood}
                      disabled={isCheckingMood}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 transition-colors"
                      title={t('diary.checkMoodTitle')}
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-primary-500 ${isCheckingMood ? 'animate-spin' : ''}`} />
                      <span>{isCheckingMood ? t('diary.checkingTone') : t('diary.checkMood')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mood reminder label */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <MoodIcon className="h-3.5 w-3.5 text-calm-500" />
                <span>{activeMoodMeta.description}</span>
              </div>
            </div>

            {/* Tone Discrepancy Soft Suggestion */}
            {moodDiscrepancy && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {t('diary.moodDiscrepancyNotice', { emotions: moodDiscrepancy.suggestedEmotions.join(', ') })}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMood('sad');
                      setMoodScore(moodDiscrepancy.suggestedScore);
                      setMoodDiscrepancy(null);
                    }}
                    className="px-2.5 py-1 bg-amber-200 dark:bg-amber-900/50 rounded-lg font-medium hover:bg-amber-300 transition-colors"
                  >
                    {t('diary.adjustToReflective')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoodDiscrepancy(null)}
                    className="text-amber-600 hover:text-amber-800 text-[11px] underline"
                  >
                    {t('diary.keepAsIs')}
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Emotion Wheel */}
            {showEmotionsSection && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {t('diary.selectEmotionsHint')}
                </p>
                <EmotionWheel
                  selectedEmotions={emotions}
                  onChange={setEmotions}
                  maxSelection={5}
                />
              </div>
            )}
          </div>
        )}

        {/* Floating/Sticky Clean Toolbar */}
        <div className="sticky top-16 z-20 px-6 py-2 bg-white/95 dark:bg-[#131d31]/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              aria-label="Bold text"
              className={`p-2 rounded-lg text-xs transition-colors ${editor?.isActive('bold')
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              aria-label="Italic text"
              className={`p-2 rounded-lg text-xs transition-colors ${editor?.isActive('italic')
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <Italic className="h-4 w-4" />
            </button>
            <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              aria-label="Bullet list"
              className={`p-2 rounded-lg text-xs transition-colors ${editor?.isActive('bulletList')
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              aria-label="Ordered list"
              className={`p-2 rounded-lg text-xs transition-colors ${editor?.isActive('orderedList')
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Voice to text dictation inside toolbar */}
            <VoiceInput
              onInsertText={(text) => {
                if (editor) {
                  editor.chain().focus().insertContent(text).run();
                }
              }}
            />

            <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Writing Prompt Picker */}
            <PromptPicker
              onSelectPrompt={(pickedPrompt) => {
                setPrompt(pickedPrompt);
                if (editor) {
                  editor.chain().focus().insertContent(`<blockquote><p><strong>${pickedPrompt}</strong></p></blockquote><p></p>`).run();
                }
              }}
            />

            <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* AI Writing Helper: Help me get started */}
            <div className="relative">
              <button
                type="button"
                onClick={handleGetStarters}
                disabled={isLoadingStarters}
                title="Help me get started with sentence openers"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">{isLoadingStarters ? 'Thinking...' : 'Get Started'}</span>
              </button>

              {showStartersMenu && starters.length > 0 && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-[#1a253d] border border-calm-200 dark:border-calm-700 rounded-2xl shadow-soft-lg p-3 z-50 animate-fade-in space-y-2">
                  <div className="flex items-center justify-between border-b border-calm-100 dark:border-calm-800 pb-1.5">
                    <span className="text-xs font-semibold text-calm-800 dark:text-calm-200">{t('diary.sentenceStarters')}</span>
                    <button
                      type="button"
                      onClick={() => setShowStartersMenu(false)}
                      className="text-calm-400 hover:text-calm-600 text-[10px]"
                    >
                      {t('common.close')}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {starters.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleInsertStarter(s)}
                        className="w-full text-left p-2 rounded-xl text-xs text-calm-700 dark:text-calm-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-900 dark:hover:text-purple-200 transition-colors"
                      >
                        "{s}"
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats: Word count & reading time */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span>{t('write.wordCount', { count: wordCount, defaultValue: `${wordCount} words` })}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{t('write.readingTime', { count: Math.max(1, Math.ceil(wordCount / 200)), defaultValue: `${Math.max(1, Math.ceil(wordCount / 200))} min read` })}</span>
            </span>
          </div>
        </div>

        {/* TipTap Editor Writing Area */}
        <div className="p-6 sm:p-8 min-h-[360px]">
          <EditorContent editor={editor} />
        </div>

        {/* Media Uploader Section (hidden in focus mode to preserve concentration) */}
        {!focusMode && (
          <div className="px-6 py-6 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/30 dark:bg-gray-900/20">
            <MediaUploader
              media={media}
              onChange={setMedia}
              maxItems={10}
            />
          </div>
        )}

        {/* Tags Section */}
        {!focusMode && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-900/10">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              {tags.map((tag) => (
                <Badge key={tag} size="sm" variant="calm" className="flex items-center gap-1">
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="hover:text-rose-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyPress}
                  placeholder={t('write.tagsPlaceholder', 'Add a tag...')}
                  className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-primary-500 w-28"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                >
                  {t('write.addTag', 'Add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Exclusion Toggle */}
        {!focusMode && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-900/10 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="aiExcludedToggle" className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="aiExcludedToggle"
                type="checkbox"
                checked={aiExcluded}
                onChange={(e) => setAiExcluded(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('write.hideFromAI', 'Hide this entry from AI')}
              </span>
            </label>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {t('write.hideFromAIDesc', 'Excluded from Ask My Diary and AI Storybooks')}
            </span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Sparkles className="h-3.5 w-3.5 text-calm-500" />
            <span>{t('write.contentPlaceholder', 'Honest expression heals the mind.')}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
            >
              {t('write.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="calm"
              icon={Save}
              onClick={handleSave}
              disabled={!title.trim()}
            >
              {t('write.saveEntry', 'Save Entry')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
