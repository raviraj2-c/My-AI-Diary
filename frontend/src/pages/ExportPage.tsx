import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { StorybookExport } from '../components/Export/StorybookExport';
import { Card, Button } from '../components/common';
import { useToast } from '../components/common/Toast';
import { Download, FileText, Database, ShieldCheck, BookOpen } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { entries } = useDiary(user?.id || '');
  const toast = useToast();

  const handleExportJSON = () => {
    try {
      if (entries.length === 0) {
        toast.info(t('export.noEntries', 'No entries to export yet.'));
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `minddiary-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(t('export.downloadSuccess', 'Your JSON diary backup was downloaded successfully.'));
    } catch (err) {
      console.error(err);
      toast.error('Could not export your diary data.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('export.title')}</h1>
          <p className="text-sm text-calm-500 dark:text-calm-400 mt-0.5">
            {t('export.subtitle')}
          </p>
        </div>
        <Link to="/stories">
          <Button variant="outline" size="sm" icon={<BookOpen className="w-4 h-4" />}>
            {t('export.storybookLibrary')}
          </Button>
        </Link>
      </div>

      <StorybookExport entries={entries} />

      <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800">
        <h3 className="text-base font-semibold text-calm-900 dark:text-calm-50 mb-1">{t('export.ownershipTitle')}</h3>
        <p className="text-xs text-calm-500 dark:text-calm-400 mb-6">
          {t('export.ownershipDesc')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-calm-200 dark:border-calm-800 bg-calm-50/50 dark:bg-calm-900/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2 text-primary-600 dark:text-primary-400">
                <FileText className="h-5 w-5" />
                <h4 className="font-semibold text-sm text-calm-900 dark:text-calm-100">{t('export.storybookCardTitle')}</h4>
              </div>
              <p className="text-xs text-calm-600 dark:text-calm-400 leading-relaxed">
                {t('export.storybookCardDesc')}
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs text-calm-400">
              <span>{t('export.storybookConfigurable')}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-calm-200 dark:border-calm-800 bg-calm-50/50 dark:bg-calm-900/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2 text-calm-700 dark:text-calm-200">
                <Database className="h-5 w-5" />
                <h4 className="font-semibold text-sm text-calm-900 dark:text-calm-100">{t('export.jsonCardTitle')}</h4>
              </div>
              <p className="text-xs text-calm-600 dark:text-calm-400 leading-relaxed">
                {t('export.jsonCardDesc')}
              </p>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleExportJSON}
                variant="secondary"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                {t('export.downloadJson')}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-calm-100 dark:border-calm-800 flex items-center gap-2 text-xs text-calm-400">
          <ShieldCheck className="w-4 h-4 text-calm-500" />
          <span>{t('export.browserNotice')}</span>
        </div>
      </Card>
    </div>
  );
};
