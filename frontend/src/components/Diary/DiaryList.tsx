import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiaryEntry } from './DiaryEntry';
import { DiaryEntry as DiaryEntryType } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { PenTool, ArrowDown } from 'lucide-react';

interface DiaryListProps {
  entries: DiaryEntryType[];
  onEdit: (entry: DiaryEntryType) => void;
  onDelete: (id: string) => void;
  onWriteNew?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export const DiaryList: React.FC<DiaryListProps> = ({
  entries,
  onEdit,
  onDelete,
  onWriteNew,
  hasMore = false,
  loadingMore = false,
  isLoading = false,
  onLoadMore
}) => {
  const { t } = useTranslation();
  const isBusy = loadingMore || isLoading;

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={PenTool}
        title={t('write.noEntriesFound', 'Your sanctuary awaits')}
        description={t('write.contentPlaceholder', 'No diary entries found. Take a gentle breath and write down your first thought for today.')}
        actionLabel={onWriteNew ? t('dashboard.writeEntry', 'Write First Entry') : undefined}
        onAction={onWriteNew}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {entries.map(entry => (
          <DiaryEntry
            key={entry.id}
            entry={entry}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="pt-6 flex justify-center">
          <Button
            onClick={onLoadMore}
            variant="outline"
            size="md"
            loading={isBusy}
            icon={isBusy ? <Spinner size="sm" /> : <ArrowDown className="w-4 h-4" />}
          >
            {t('common.continue', 'Load earlier reflections')}
          </Button>
        </div>
      )}
    </div>
  );
};
