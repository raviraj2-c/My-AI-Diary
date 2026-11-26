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
  Info,
  Image as ImageIcon,
  EyeOff,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { DiaryEntry, MediaItem } from '../../types';
import { getAllMoods, getMoodMeta } from '../../utils/moods';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { BottomSheet } from '../ui';
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
  const [date, setDate] = useState<string>(initialDateStr);
  const [media, setMedia] = useState<MediaItem[]>(entry?.media || []);
  const [aiExcluded, setAiExcluded] = useState<boolean>(Boolean(entry?.aiExcluded));
  const [newTag, setNewTag] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'media' | 'tags'>('none');

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
  void activeMoodMeta;

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
                  <FileCheck2 className="h-3 w-3 text-muted dark:text-muted" />
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
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMood(m.value)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${isSelected
                            ? `${m.badgeClass} ring-2 ring-offset-1 ring-muted font-semibold shadow-soft-sm`
                            : 'bg-surface dark:bg-ink-900 text-muted border border-border dark:border-ink-800 hover:border-primary-300'
                            }`}
                        >
                          <span>{m.emoji}</span>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 1-line Tone Discrepancy Soft Suggestion */}
            {moodDiscrepancy && (
              <div className="px-3 py-2 bg-sky-50 dark:bg-ink-900 border border-sky-200 dark:border-ink-800 rounded-xl text-xs flex items-center justify-between gap-2 text-ink-900 dark:text-sky-200">
                <div className="flex items-center gap-2 min-w-0">
                  <Info className="w-4 h-4 text-sky-700 shrink-0" />
                  <span className="truncate">
                    {t('diary.moodDiscrepancyShort', 'Your words sound heavier than your mood.')}
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
                    className="px-2 py-0.5 bg-sky-200 dark:bg-ink-800 rounded-lg font-medium"
                  >
                    {t('diary.adjustToReflective', 'Adjust')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMoodDiscrepancy(null)}
                    className="text-sky-700 dark:text-sky-400 underline"
                  >
                    {t('diary.keepAsIs', 'Keep')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TipTap Editor Writing Area */}
        <div className="p-6 sm:p-8 min-h-[380px]">
          <EditorContent editor={editor} />
        </div>

        {/* Toggleable Photo / Media Drawer */}
        {!focusMode && activeDrawer === 'media' && (
          <div className="px-6 py-4 border-t border-border dark:border-ink-800 bg-bg/40 dark:bg-ink-950/40">
            <MediaUploader
              media={media}
              onChange={setMedia}
              maxItems={10}
            />
          </div>
        )}

        {/* Toggleable Tags Drawer */}
        {!focusMode && activeDrawer === 'tags' && (
          <div className="px-6 py-3 border-t border-border dark:border-ink-800 bg-bg/40 dark:bg-ink-950/40">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-muted shrink-0" />
              {tags.map((tag) => (
                <Badge key={tag} size="sm" variant="calm" className="flex items-center gap-1">
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="hover:text-danger transition-colors"
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
                  className="px-2.5 py-1 text-xs rounded-lg border border-border dark:border-ink-800 bg-surface dark:bg-ink-900 text-text dark:text-sky-100 outline-none focus:ring-1 focus:ring-primary-500 w-28"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="text-xs px-2 py-1 bg-sky-100 dark:bg-ink-800 text-text dark:text-sky-200 rounded-lg"
                >
                  {t('write.addTag', 'Add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Bottom Toolbar (5 icons + More) & Save */}
        <div className="sticky bottom-0 z-20 px-4 py-3 border-t border-border dark:border-ink-800 bg-surface/95 dark:bg-ink-900/95 backdrop-blur-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* 1. Mic */}
            <VoiceInput
              onInsertText={(text) => {
                if (editor) {
                  editor.chain().focus().insertContent(text).run();
                }
              }}
            />
            {/* 2. Photo */}
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === 'media' ? 'none' : 'media')}
              aria-label={t('write.addMedia', 'Add photo')}
              title={t('write.addMedia', 'Add photo')}
              className={`p-2 rounded-lg transition-colors ${activeDrawer === 'media' || media.length > 0 ? 'bg-sky-100 text-primary-700 dark:bg-ink-800 dark:text-sky-300' : 'text-muted hover:bg-sky-50 dark:hover:bg-ink-800'}`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            {/* 3. Prompt */}
            <PromptPicker
              onSelectPrompt={(pickedPrompt) => {
                setPrompt(pickedPrompt);
                if (editor) {
                  editor.chain().focus().insertContent(`<blockquote><p><strong>${pickedPrompt}</strong></p></blockquote><p></p>`).run();
                }
              }}
            />
            {/* 4. Tags */}
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === 'tags' ? 'none' : 'tags')}
              aria-label={t('write.tags', 'Tags')}
              title={t('write.tags', 'Tags')}
              className={`p-2 rounded-lg transition-colors ${activeDrawer === 'tags' || tags.length > 0 ? 'bg-sky-100 text-primary-700 dark:bg-ink-800 dark:text-sky-300' : 'text-muted hover:bg-sky-50 dark:hover:bg-ink-800'}`}
            >
              <Tag className="w-4 h-4" />
            </button>
            {/* 5. AI-hide */}
            <button
              type="button"
              onClick={() => setAiExcluded((prev) => !prev)}
              aria-label={t('write.hideFromAI', 'Hide from AI')}
              title={aiExcluded ? t('write.hiddenFromAI', 'Hidden from AI') : t('write.hideFromAI', 'Hide from AI')}
              className={`p-2 rounded-lg transition-colors ${aiExcluded ? 'bg-sky-100 text-primary-700 dark:bg-ink-800 dark:text-sky-300' : 'text-muted hover:bg-sky-50 dark:hover:bg-ink-800'}`}
            >
              {aiExcluded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* More */}
            <button
              type="button"
              onClick={() => setShowMoreSheet(true)}
              aria-label={t('common.more', 'More')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:bg-sky-50 dark:hover:bg-ink-800"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.more', 'More')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              {t('write.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="calm"
              size="sm"
              icon={Save}
              onClick={handleSave}
              disabled={!title.trim()}
            >
              {t('write.saveEntry', 'Save')}
            </Button>
          </div>
        </div>
      </div>

      {/* More Sheet: EmotionWheel, Focus Mode, Formatting, AI helpers */}
      <BottomSheet
        open={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        title={t('common.more', 'More')}
      >
        <div className="space-y-5">
          {/* Focus Mode & Formatting */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border dark:border-ink-800">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                aria-label="Bold"
                className={`p-2 rounded-lg ${editor?.isActive('bold') ? 'bg-sky-100 text-primary-700 dark:bg-ink-800' : 'text-muted'}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                aria-label="Italic"
                className={`p-2 rounded-lg ${editor?.isActive('italic') ? 'bg-sky-100 text-primary-700 dark:bg-ink-800' : 'text-muted'}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                aria-label="Bullet list"
                className={`p-2 rounded-lg ${editor?.isActive('bulletList') ? 'bg-sky-100 text-primary-700 dark:bg-ink-800' : 'text-muted'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                aria-label="Ordered list"
                className={`p-2 rounded-lg ${editor?.isActive('orderedList') ? 'bg-sky-100 text-primary-700 dark:bg-ink-800' : 'text-muted'}`}
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setFocusMode((prev) => !prev);
                setShowMoreSheet(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border dark:border-ink-800 text-text dark:text-sky-200"
            >
              {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{focusMode ? t('write.exitFocus', 'Exit focus') : t('write.focusMode', 'Focus mode')}</span>
            </button>
          </div>

          {/* Mood Score */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-text dark:text-sky-200">{t('diary.moodScoreLabel')}</span>
              <span className="font-semibold text-primary-600">{moodScore}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(parseInt(e.target.value, 10))}
              className="w-full accent-primary-600 cursor-pointer"
            />
          </div>

          {/* Emotion Wheel */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-text dark:text-sky-200 mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('diary.feelingsWheel', 'Feelings wheel')}</span>
            </div>
            <EmotionWheel
              selectedEmotions={emotions}
              onChange={setEmotions}
              maxSelection={5}
            />
          </div>

          {/* AI Helpers */}
          {settings.allowAIFeatures && !aiExcluded && (
            <div className="pt-3 border-t border-border dark:border-ink-800 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleCheckMood();
                    setShowMoreSheet(false);
                  }}
                  disabled={isCheckingMood}
                  icon={Sparkles}
                >
                  {isCheckingMood ? t('diary.checkingTone') : t('diary.checkMood')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetStarters}
                  disabled={isLoadingStarters}
                  icon={Sparkles}
                >
                  {isLoadingStarters ? t('common.loading', 'Loading...') : t('diary.getStarted', 'Get started')}
                </Button>
              </div>

              {showStartersMenu && starters.length > 0 && (
                <div className="space-y-1.5">
                  {starters.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleInsertStarter(s);
                        setShowMoreSheet(false);
                      }}
                      className="w-full text-left p-2 rounded-xl text-xs bg-sky-50 dark:bg-ink-800 text-text dark:text-sky-200 hover:bg-sky-100"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted pt-2 border-t border-border dark:border-ink-800">
            <span>{t('write.wordCount', { count: wordCount, defaultValue: `${wordCount} words` })}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{t('write.readingTime', { count: Math.max(1, Math.ceil(wordCount / 200)), defaultValue: `${Math.max(1, Math.ceil(wordCount / 200))} min read` })}</span>
            </span>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
