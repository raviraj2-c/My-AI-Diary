/**
 * Shared storage management for MindDiary.
 * Ensures strict privacy by wiping all local user data on logout/deletion,
 * namespacing drafts and settings by userId under 'minddiary:',
 * maintaining public login preferences under 'minddiary-public:',
 * and automatically expiring stale drafts after 30 days.
 */

export const STORAGE_PREFIX = 'minddiary:';
export const PUBLIC_STORAGE_PREFIX = 'minddiary-public:';

export const AUTH_KEY = `${STORAGE_PREFIX}auth`;
export const UNLOCKED_KEY = `${STORAGE_PREFIX}unlocked`;
export const PUBLIC_LANG_KEY = `${PUBLIC_STORAGE_PREFIX}lang`;
export const PUBLIC_THEME_KEY = `${PUBLIC_STORAGE_PREFIX}theme`;

/**
 * Migrates legacy 'mydiary_' keys to the single 'minddiary:' and 'minddiary-public:' prefixes
 * on first load so users never lose drafts, settings, or sessions.
 */
export function migrateStorageKeys(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // 1. Auth migration
    const legacyAuth = localStorage.getItem('mydiary_auth');
    if (legacyAuth) {
      if (!localStorage.getItem(AUTH_KEY)) {
        localStorage.setItem(AUTH_KEY, legacyAuth);
      }
      localStorage.removeItem('mydiary_auth');
    }

    // 2. Language preference migration (public login screen key)
    const legacyLang = localStorage.getItem('mydiary_lang');
    if (legacyLang) {
      if (!localStorage.getItem(PUBLIC_LANG_KEY)) {
        localStorage.setItem(PUBLIC_LANG_KEY, legacyLang);
      }
      localStorage.removeItem('mydiary_lang');
    }

    // 3. Drafts and settings migration
    const keysToMigrate: { oldKey: string; newKey: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mydiary_')) {
        const suffix = key.replace(/^mydiary_/, '');
        keysToMigrate.push({ oldKey: key, newKey: `${STORAGE_PREFIX}${suffix}` });
      }
    }
    keysToMigrate.forEach(({ oldKey, newKey }) => {
      const val = localStorage.getItem(oldKey);
      if (val && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, val);
      }
      localStorage.removeItem(oldKey);
    });

    // 4. Session storage (App lock unlock status)
    if (typeof sessionStorage !== 'undefined') {
      const legacyUnlocked = sessionStorage.getItem('mydiary_unlocked');
      if (legacyUnlocked) {
        if (!sessionStorage.getItem(UNLOCKED_KEY)) {
          sessionStorage.setItem(UNLOCKED_KEY, legacyUnlocked);
        }
        sessionStorage.removeItem('mydiary_unlocked');
      }
    }
  } catch (err) {
    console.warn('Storage migration warning:', err);
  }
}

// Auto-run migration when loaded in browser
if (typeof window !== 'undefined') {
  migrateStorageKeys();
}

/**
 * Removes user auth & session state from localStorage and sessionStorage.
 * Preserves unsaved drafts by default under their user key so work is never lost on session expiration.
 * Pass { preserveDrafts: false } on permanent account deletion to purge all local data.
 */
export function clearAppStorage(options: { preserveDrafts?: boolean } = { preserveDrafts: true }): void {
  if (typeof window === 'undefined') return;
  try {
    const preserveDrafts = options?.preserveDrafts ?? true;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Keep user drafts safe on session expiry / logout
      if (preserveDrafts && (key.includes('draft_') || key.startsWith(`${STORAGE_PREFIX}draft_`))) {
        continue;
      }

      // Remove all user keys with 'minddiary:' or legacy prefixes
      // Never remove public keys starting with 'minddiary-public:'
      if (
        (key.startsWith(STORAGE_PREFIX) || key.startsWith('mydiary_') || key.startsWith('minddiary_')) &&
        !key.startsWith(PUBLIC_STORAGE_PREFIX)
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Clear session storage (e.g. app lock session)
    sessionStorage.clear();

    // Broadcast logout event so all React contexts clear in-memory state
    window.dispatchEvent(new CustomEvent('minddiary_logout'));
  } catch (err) {
    console.error('Error clearing app storage:', err);
  }
}

/**
 * Returns a userId-namespaced draft key under 'minddiary:'.
 */
export function getDraftKey(userId?: string | null, entryId?: string | null): string {
  const safeUser = userId || 'anon';
  const safeEntry = entryId || 'new';
  return `${STORAGE_PREFIX}draft_${safeUser}_${safeEntry}`;
}

/**
 * Returns a userId-namespaced settings key under 'minddiary:'.
 */
export function getSettingsKey(userId?: string | null): string {
  const safeUser = userId || 'default';
  return `${STORAGE_PREFIX}settings_${safeUser}`;
}

/**
 * Automatically purges unsaved drafts older than maxDays (default: 30 days).
 */
export function cleanExpiredDrafts(maxDays = 30): void {
  if (typeof window === 'undefined') return;
  try {
    const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;
    const keysToCheck: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(`${STORAGE_PREFIX}draft_`) || key.startsWith('mydiary_draft_'))) {
        keysToCheck.push(key);
      }
    }

    keysToCheck.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed.savedAt) {
          const savedTime = new Date(parsed.savedAt).getTime();
          if (savedTime < cutoff) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn('Failed cleaning expired drafts:', err);
  }
}
