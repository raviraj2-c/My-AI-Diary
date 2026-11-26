import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs, Chip } from '../components/ui';
import { DiaryPage } from './DiaryPage';
import { CalendarPage } from './CalendarPage';
import { SearchPage } from './SearchPage';
import { HappyBox } from './HappyBox';

export const JournalPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const filter = searchParams.get('filter');
  const activeTab = rawTab === 'calendar' || rawTab === 'search' ? rawTab : 'entries';
  const showFavorites = filter === 'favorites';

  const setTab = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    if (id !== 'entries') next.delete('filter');
    setSearchParams(next, { replace: true });
  };

  const toggleFavorites = () => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'entries');
    if (showFavorites) next.delete('filter');
    else next.set('filter', 'favorites');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={[
            { id: 'entries', label: t('nav.entries', 'Entries') },
            { id: 'calendar', label: t('nav.calendar', 'Calendar') },
            { id: 'search', label: t('search.title', 'Search') },
          ]}
          value={activeTab}
          onChange={setTab}
        />

        {activeTab === 'entries' && (
          <button type="button" onClick={toggleFavorites} aria-pressed={showFavorites}>
            <Chip selected={showFavorites} tone="sky">
              {t('nav.favorites', 'Favorites')}
            </Chip>
          </button>
        )}
      </div>

      {activeTab === 'entries' && (showFavorites ? <HappyBox /> : <DiaryPage />)}
      {activeTab === 'calendar' && <CalendarPage />}
      {activeTab === 'search' && <SearchPage />}
    </div>
  );
};

export default JournalPage;
