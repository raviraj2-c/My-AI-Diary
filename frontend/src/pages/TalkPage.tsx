import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SegmentedControl, BottomSheet, Button } from '../components/ui';
import { useSettings } from '../hooks/useSettings';
import { ChatPage } from './ChatPage';
import { AskDiaryPage } from './AskDiaryPage';

export const TalkPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawMode = searchParams.get('mode');
  const mode = rawMode === 'diary' ? 'diary' : 'chat';
  const diaryAllowed = Boolean(settings.allowAIFeatures && settings.allowDiaryAI);
  const [consentSheetOpen, setConsentSheetOpen] = useState(false);

  useEffect(() => {
    if (mode === 'diary' && !diaryAllowed) {
      setConsentSheetOpen(true);
    }
  }, [mode, diaryAllowed]);

  const setMode = (id: string) => {
    setSearchParams({ mode: id }, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SegmentedControl
          items={[
            { id: 'chat', label: t('talk.tabChat', 'Chat') },
            { id: 'diary', label: t('talk.tabMyDiary', 'My diary') },
          ]}
          value={mode}
          onChange={setMode}
        />
      </div>

      {mode === 'chat' ? <ChatPage /> : <AskDiaryPage />}

      <BottomSheet
        open={consentSheetOpen}
        onClose={() => setConsentSheetOpen(false)}
        title={t('askDiary.diaryOffTitle', 'Diary AI Consent')}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {t('privacy.aiUsageDesc')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConsentSheetOpen(false)}>
              {t('common.close', 'Close')}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConsentSheetOpen(false);
                navigate('/settings');
              }}
            >
              {t('askDiary.goToSettings', 'Go to Settings')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default TalkPage;
