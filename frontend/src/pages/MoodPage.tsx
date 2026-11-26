import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs } from '../components/ui';
import { CheckInPage } from './CheckInPage';
import { InsightsPage } from './InsightsPage';
import { YearInPixelsPage } from './YearInPixelsPage';

export const MoodPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab = rawTab === 'trends' || rawTab === 'year' ? rawTab : 'today';

  const setTab = (id: string) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <Tabs
        items={[
          { id: 'today', label: t('nav.today', 'Today') },
          { id: 'trends', label: t('nav.trends', 'Trends') },
          { id: 'year', label: t('nav.year', 'Year') },
        ]}
        value={activeTab}
        onChange={setTab}
      />

      {activeTab === 'today' && <CheckInPage />}
      {activeTab === 'trends' && <InsightsPage />}
      {activeTab === 'year' && <YearInPixelsPage />}
    </div>
  );
};

export default MoodPage;
