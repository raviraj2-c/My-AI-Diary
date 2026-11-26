import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/authService';
import { UNLOCKED_KEY } from '../../utils/storage';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import {
  Lock,
  Unlock,
  Download,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Clock
} from 'lucide-react';

export const PrivacySettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // App Lock PIN Setup state
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  // Disable Lock state
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);

  // Export Data state
  const [isExporting, setIsExporting] = useState(false);

  // Delete Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error('PIN must be 4 to 6 numbers.');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PIN confirmation does not match.');
      return;
    }

    setIsSubmittingPin(true);
    try {
      await AuthService.setupAppLock(pin, accountPassword || undefined, settings.appLockTimeoutMinutes || 5);
      updateSettings({ appLockEnabled: true });
      // Store local hashed flag so lock screen knows
      sessionStorage.setItem(UNLOCKED_KEY, 'true');
      toast.success('App Lock PIN has been enabled.');
      setShowPinSetup(false);
      setPin('');
      setConfirmPin('');
      setAccountPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not set up PIN';
      toast.error(msg);
    } finally {
      setIsSubmittingPin(false);
    }
  };

  const handleDisableLock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AuthService.disableAppLock(disablePassword || undefined);
      updateSettings({ appLockEnabled: false });
      sessionStorage.removeItem(UNLOCKED_KEY);
      toast.info('App lock has been disabled.');
      setShowDisableModal(false);
      setDisablePassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disable lock';
      toast.error(msg);
    }
  };

  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      await AuthService.downloadAllData();
      toast.success('Complete data archive downloaded.');
    } catch {
      toast.error('Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion.');
      return;
    }
    setIsDeleting(true);
    try {
      await AuthService.deleteAccount(deletePassword);
      toast.info('Your account and all associated data have been deleted.');
      logout();
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed';
      toast.error(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. App Lock & Inactivity Timeout */}
      <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-calm-100 dark:border-calm-800">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 flex items-center justify-center">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('settings.appLockTitle')}</h2>
            <p className="text-xs text-calm-500">{t('settings.appLockDesc')}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-calm-800 dark:text-calm-200">{t('settings.passcodeProtection')}</p>
              <p className="text-xs text-calm-500 dark:text-calm-400">
                {t('settings.passcodeProtectionDesc')}
              </p>
            </div>
            {settings.appLockEnabled ? (
              <Button
                variant="outline"
                size="sm"
                icon={Unlock}
                onClick={() => setShowDisableModal(true)}
              >
                {t('settings.disablePin')}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Lock}
                onClick={() => setShowPinSetup(true)}
              >
                {t('settings.enablePin')}
              </Button>
            )}
          </div>

          {/* Auto-Lock Inactivity Timeout */}
          {settings.appLockEnabled && (
            <div className="pt-3 border-t border-calm-100 dark:border-calm-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-calm-400" />
                <label htmlFor="autolock-timeout" className="text-xs font-medium text-calm-700 dark:text-calm-300">
                  {t('settings.autoLockTimeout')}
                </label>
              </div>
              <select
                id="autolock-timeout"
                value={settings.appLockTimeoutMinutes || 5}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateSettings({ appLockTimeoutMinutes: val });
                  toast.success(`Auto-lock set to ${val} minutes`);
                }}
                className="px-3 py-1.5 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 focus:ring-2 focus:ring-primary-400 outline-none"
              >
                <option value={1}>{t('settings.oneMinute')}</option>
                <option value={5}>{t('settings.fiveMinutes')}</option>
                <option value={15}>{t('settings.fifteenMinutes')}</option>
                <option value={30}>{t('settings.thirtyMinutes')}</option>
              </select>
            </div>
          )}

          {/* PIN Setup Form */}
          {showPinSetup && (
            <form onSubmit={handleSetupPin} className="p-4 rounded-2xl bg-calm-50/70 dark:bg-calm-950/40 border border-calm-200/80 dark:border-calm-800 space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-calm-800 dark:text-calm-200 uppercase tracking-wider">
                {t('settings.createPinTitle')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="setup-pin" className="block text-xs text-calm-600 dark:text-calm-400 mb-1">
                    {t('settings.newPin')}
                  </label>
                  <input
                    id="setup-pin"
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="4–6 digits"
                    className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 font-mono tracking-widest text-center focus:ring-2 focus:ring-primary-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm-pin" className="block text-xs text-calm-600 dark:text-calm-400 mb-1">
                    {t('settings.confirmPin')}
                  </label>
                  <input
                    id="confirm-pin"
                    type="password"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Repeat digits"
                    className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-calm-200 dark:border-calm-700 rounded-xl text-xs text-calm-800 dark:text-calm-200 font-mono tracking-widest text-center focus:ring-2 focus:ring-primary-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPinSetup(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmittingPin}
                >
                  {t('settings.savePasscode')}
                </Button>
              </div>
            </form>
          )}

          {/* Disable Lock Form */}
          {showDisableModal && (
            <form onSubmit={handleDisableLock} className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3 animate-fade-in">
              <p className="text-xs text-rose-800 dark:text-rose-200 font-medium">
                {t('settings.disableLockTitle')}
              </p>
              <input
                type="password"
                placeholder="Account password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#0f172a] border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-calm-800 dark:text-calm-200 outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDisableModal(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                >
                  {t('settings.disableLock')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* 2. Data Portability & Complete Backup */}
      <Card className="p-6 md:p-8 border-calm-200 dark:border-calm-800 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-calm-100 dark:border-calm-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-calm-900 dark:text-calm-50">{t('settings.dataPortability')}</h2>
            <p className="text-xs text-calm-500">{t('settings.dataPortabilityDesc')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-calm-800 dark:text-calm-200">
              {t('settings.dataPortability')}
            </p>
            <p className="text-xs text-calm-500 dark:text-calm-400 leading-relaxed font-serif max-w-md">
              {t('settings.dataPortabilityDesc')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            loading={isExporting}
            onClick={handleDownloadData}
            className="shrink-0 self-start sm:self-center"
          >
            {t('settings.downloadBackup')}
          </Button>
        </div>
      </Card>

      {/* 3. Encryption & Transparency Notice */}
      <Card className="p-6 border-calm-200 dark:border-calm-800 bg-calm-50/40 dark:bg-calm-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-calm-800 dark:text-calm-200 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{t('privacy.howEncryptedTitle')}</span>
          </div>
          <Link
            to="/privacy"
            className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            <span>{t('privacy.title')}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs text-calm-600 dark:text-calm-400 leading-relaxed font-serif">
          {t('privacy.encryptedDesc')}
        </p>
      </Card>

      {/* 4. Danger Zone: Delete Account */}
      <Card className="p-6 md:p-8 border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-400">
          <Trash2 className="h-5 w-5" />
          <div>
            <h3 className="text-base font-serif font-bold">{t('settings.deleteAccountTitle')}</h3>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">{t('settings.deleteAccountDesc')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-red-700/90 dark:text-red-300/80 leading-relaxed max-w-md">
            {t('settings.deleteAccountWarning')}
          </p>

          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 self-start sm:self-center"
          >
            {t('settings.deleteButton')}
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white dark:bg-[#131d31] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-red-200 dark:border-red-900/60 space-y-4 shadow-soft-2xl">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-gray-100">
                {t('settings.confirmPermanentDeletion')}
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('settings.permanentDeletionDesc')}
            </p>

            <div>
              <label htmlFor="confirm-del-pw" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.enterPasswordConfirm')}
              </label>
              <input
                id="confirm-del-pw"
                type="password"
                placeholder={t('settings.enterPasswordPlaceholder')}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isDeleting}
                onClick={handleDeleteAccount}
              >
                {t('settings.permanentlyDeleteEverything')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
