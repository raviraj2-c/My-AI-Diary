import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { DiaryEntry as DiaryEntryType } from '../../types';
import { getMoodMeta } from '../../utils/moods';
import { DiaryEntry } from './DiaryEntry';
import { EmptyState } from '../ui';
import { Button } from '../common/Button';

interface DiaryListProps {
  entries: DiaryEntryType[];
  onEdit: (entry: DiaryEntryType) => void;
  onDelete: (id: string) => void;
  onWriteNew?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void> | void;
  isLoading?: boolean;
}

export const DiaryList: React.FC<DiaryListProps> = ({
  entries,
  onEdit,
  onDelete,
  onWriteNew,
  hasMore = false,
  onLoadMore,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-6 h-6" />}
        message={t('journal.noEntries', 'No entries yet')}
        actionLabel={t('journal.writeFirst', 'Write entry')}
        onAction={onWriteNew || (() => {})}
      />
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const isExpanded = expandedId === entry.id;
        const moodMeta = getMoodMeta(entry.mood);
        const entryDate = new Date(entry.entryDate || entry.date || Date.now());
        const hasMedia = (entry.media?.length || 0) > 0 || (entry.images?.length || 0) > 0;

        return (
          <div key={entry.id} className="space-y-2">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              aria-expanded={isExpanded}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface dark:bg-ink-900 border border-border dark:border-ink-800 hover:border-primary-300 dark:hover:border-primary-700 text-left transition-colors"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${moodMeta.stripeClass}`}
                title={moodMeta.label}
              />
              <span className="text-xs text-muted w-16 shrink-0 tabular-nums">
                {entryDate.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
              </span>
              <span className="flex-1 text-sm font-medium text-text dark:text-sky-50 truncate">
                {entry.title || t('journal.untitled', 'Untitled')}
              </span>
              {hasMedia && (
                <ImageIcon className="w-4 h-4 text-muted shrink-0" aria-label={t('journal.hasMedia', 'Media attached')} />
              )}
              <ChevronDown
                className={`w-4 h-4 text-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isExpanded && (
              <div className="pl-2">
                <DiaryEntry entry={entry} onEdit={onEdit} onDelete={onDelete} />
              </div>
            )}
          </div>
        );
      })}
      {hasMore && onLoadMore && (
        <div className="pt-2 text-center">
          <Button variant="outline" size="sm" loading={isLoading} onClick={onLoadMore}>
            {t('common.more', 'More')}
          </Button>
        </div>
      )}
    </div>
  );
};
