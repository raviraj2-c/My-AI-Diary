import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'calm';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'danger',
  loading = false
}) => {
  const { t } = useTranslation();
  const resolvedCancel = cancelText || cancelLabel || t('common.cancel');
  const resolvedConfirm = confirmText || confirmLabel || t('common.confirm');

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
          variant === 'danger'
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            : 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
        }`}>
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-calm-900 dark:text-calm-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-calm-500 dark:text-calm-400 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {resolvedCancel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
            }}
            loading={loading}
            className="flex-1"
          >
            {resolvedConfirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
