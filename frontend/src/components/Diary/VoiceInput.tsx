import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { useSettings } from '../../hooks/useSettings';
import { Mic, MicOff, AlertCircle, Info, Shield } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface VoiceInputProps {
  onInsertText: (text: string) => void;
  className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onInsertText, className = '' }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [showUnsupportedModal, setShowUnsupportedModal] = useState(false);
  const [showPrivacyTooltip, setShowPrivacyTooltip] = useState(false);

  const speechLang = settings.speechLanguage || 'en-US';

  const {
    isSupported,
    isListening,
    interimTranscript,
    error,
    startListening,
    stopListening
  } = useSpeechToText({
    lang: speechLang,
    continuous: true,
    onFinalResult: (finalChunk) => {
      if (finalChunk.trim()) {
        onInsertText(finalChunk.trim() + ' ');
      }
    }
  });

  const handleToggle = () => {
    if (!isSupported) {
      setShowUnsupportedModal(true);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {/* Mic Action Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isListening ? t('voice.stopDictation') : t('voice.startDictation')}
        className={`p-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
          isListening
            ? 'bg-rose-500 text-white ring-2 ring-rose-300 dark:ring-rose-800 animate-pulse shadow-soft'
            : 'text-calm-600 dark:text-calm-300 hover:bg-calm-100 dark:hover:bg-calm-800'
        }`}
        title={isSupported ? t('voice.clickToDictate') : t('voice.notSupported')}
      >
        {isListening ? (
          <>
            <MicOff className="w-4 h-4" />
            <span className="hidden sm:inline">{t('voice.listening')}</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="hidden sm:inline">{t('voice.dictate')}</span>
          </>
        )}
      </button>

      {/* Privacy note icon */}
      <button
        type="button"
        onClick={() => setShowPrivacyTooltip(!showPrivacyTooltip)}
        aria-label={t('voice.privacyNotice')}
        className="p-1 text-calm-400 hover:text-calm-600 dark:hover:text-calm-200"
        title={t('voice.privacyDetails')}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {/* Floating interim preview while speaking */}
      {isListening && interimTranscript && (
        <div className="absolute top-full left-0 mt-2 z-30 p-2.5 rounded-xl bg-calm-900/90 text-white text-xs backdrop-blur-md shadow-soft-lg max-w-xs animate-fade-in pointer-events-none">
          <span className="italic text-calm-300">{`"${interimTranscript}"`}</span>
        </div>
      )}

      {/* Error banner if permission denied or error occurred */}
      {error && (
        <div className="absolute top-full left-0 mt-2 z-30 p-2.5 rounded-xl bg-danger-soft/10 border border-danger-soft/30 text-danger-soft dark:text-red-300 text-xs shadow-soft max-w-sm flex items-start gap-1.5 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Privacy tooltip dropdown */}
      {showPrivacyTooltip && (
        <div className="absolute top-full right-0 mt-2 z-30 w-64 p-3 bg-white dark:bg-[#1e293b] border border-calm-200 dark:border-calm-800 rounded-xl shadow-soft-lg text-xs space-y-1.5 animate-fade-in">
          <div className="flex items-center gap-1.5 font-semibold text-calm-900 dark:text-calm-100">
            <Shield className="w-3.5 h-3.5 text-primary-600" />
            <span>{t('voice.voicePrivacy')}</span>
          </div>
          <p className="text-calm-500 dark:text-calm-400 leading-relaxed text-[11px]">
            {t('voice.voicePrivacyDesc')}
          </p>
          <div className="pt-1 text-[10px] text-calm-400">
            {t('voice.languageIndicator', { lang: speechLang })}
          </div>
        </div>
      )}

      {/* Unsupported Browser Friendly Modal */}
      <Modal
        isOpen={showUnsupportedModal}
        onClose={() => setShowUnsupportedModal(false)}
        title={t('voice.unsupportedModalTitle')}
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-calm-100 dark:bg-calm-800 text-calm-600 dark:text-calm-300 flex items-center justify-center mx-auto">
            <MicOff className="w-6 h-6" />
          </div>
          <p className="text-sm text-calm-600 dark:text-calm-300 leading-relaxed">
            {t('voice.unsupportedTitle')}
          </p>
          <p className="text-xs text-calm-400 dark:text-calm-500">
            {t('voice.unsupportedDesc')}
          </p>
          <Button
            onClick={() => setShowUnsupportedModal(false)}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            {t('common.understood')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
