import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaItem } from '../../types';
import { UploadService } from '../../services/uploadService';
import {
  UploadCloud,
  X,
  Image as ImageIcon,
  Film,
  Mic,
  Square,
  AlertCircle,
  FileAudio
} from 'lucide-react';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';

interface MediaUploaderProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  maxItems?: number;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  media = [],
  onChange,
  maxItems = 10
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const isFull = media.length >= maxItems;

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileList = Array.from(files);

    if (fileList.length === 0) return;

    if (media.length + fileList.length > maxItems) {
      setErrorMessage(`You can attach at most ${maxItems} media items per entry (currently ${media.length}).`);
      return;
    }

    for (const file of fileList) {
      const check = UploadService.validateFileLocally(file);
      if (!check.valid) {
        setErrorMessage(check.error || 'Invalid file');
        return;
      }
    }

    // Upload sequentially to track progress cleanly
    const newItems: MediaItem[] = [...media];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        setUploadProgress(0);
        const uploadedItem = await UploadService.uploadMedia(file, (pct) => {
          setUploadProgress(pct);
        });
        newItems.push(uploadedItem);
        onChange([...newItems]);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
        break;
      } finally {
        setUploadProgress(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isFull) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isFull) return;
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveItem = async (index: number) => {
    const itemToRemove = media[index];
    const updated = media.filter((_, idx) => idx !== index);
    onChange(updated);

    // Asynchronously cleanup from Cloudinary
    if (itemToRemove?.publicId) {
      try {
        await UploadService.deleteMedia(itemToRemove.publicId, itemToRemove.type);
      } catch {
        // Ignored; server deletes orphaned assets on entry update
      }
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...media];
    updated[index] = { ...updated[index], caption };
    onChange(updated);
  };

  // --- Voice Note Recording with MediaRecorder ---
  const startVoiceNoteRecording = async () => {
    setErrorMessage(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setIsRecordingAudio(false);
        setRecordingSeconds(0);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
          type: 'audio/webm'
        });

        await handleFiles([audioFile]);
      };

      recorder.start(200);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
    }
  };

  const stopVoiceNoteRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4">
      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-danger-soft/10 border border-danger-soft/30 text-xs text-danger-soft dark:text-red-300 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-muted hover:text-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {!isFull && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center ${
            isDragging
              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30'
              : 'border-border dark:border-text bg-sky-50 dark:bg-[#0f172a]/50 hover:border-sky-200'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/webm,audio/wav,audio/mp4"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />

          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-ink-800 text-primary-600 dark:text-primary-300 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-medium text-ink-800 dark:text-sky-100">
              {t('media.dragDrop')}
            </p>
            <p className="text-xs text-muted dark:text-muted mt-1 max-w-sm">
              {t('media.sizeLimits', { count: media.length, max: maxItems })}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                icon={<ImageIcon className="w-3.5 h-3.5" />}
              >
                {t('media.chooseFiles')}
              </Button>

              {!isRecordingAudio ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={startVoiceNoteRecording}
                  icon={<Mic className="w-3.5 h-3.5 text-primary-600" />}
                >
                  {t('media.recordVoiceNote')}
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={stopVoiceNoteRecording}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold animate-pulse shadow-soft"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>{t('media.recordingStop', { time: formatSeconds(recordingSeconds) })}</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress bar overlay during upload */}
          {uploadProgress !== null && (
            <div className="mt-4 pt-4 border-t border-border dark:border-ink-800">
              <div className="flex items-center justify-between text-xs text-muted dark:text-muted mb-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <Spinner size="sm" />
                  <span>{t('media.uploadingMedia')}</span>
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-sky-100 dark:bg-ink-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attached Media List */}
      {media.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
            <span>{t('media.attachedMediaCount', { count: media.length, max: maxItems })}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {media.map((item, index) => (
              <div
                key={item.publicId || item.url || index}
                className="relative rounded-xl border border-border dark:border-ink-800 bg-white dark:bg-[#1e293b] p-2.5 flex flex-col justify-between group shadow-xs"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-sky-100 dark:bg-ink-900 flex items-center justify-center">
                  {item.type === 'image' && (
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt={item.caption || 'Attached image'}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {item.type === 'video' && (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="p-2 rounded-full bg-black/60 text-white">
                          <Film className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  )}

                  {item.type === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-950/40 text-primary-600 p-2">
                      <FileAudio className="w-8 h-8 mb-1" />
                      <audio controls src={item.url} className="w-full h-7 mt-1 scale-90" />
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    aria-label="Remove media"
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Caption input */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    placeholder="Add caption..."
                    maxLength={200}
                    className="w-full px-2 py-1 text-xs bg-sky-50 dark:bg-[#0f172a] border border-border dark:border-text rounded-lg text-ink-800 dark:text-border placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
