import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearAppStorage,
  migrateStorageKeys,
  AUTH_KEY,
  UNLOCKED_KEY,
  PUBLIC_LANG_KEY,
  PUBLIC_THEME_KEY,
  getDraftKey,
  getSettingsKey
} from '../utils/storage';

describe('Storage Management & Logout Cleanup', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('logout cleanup removes auth and session keys while PRESERVING unsaved drafts by default', () => {
    // Populate user keys
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: 'jwt-123', user: { id: 'u1' } }));
    localStorage.setItem(getSettingsKey('u1'), JSON.stringify({ theme: 'dark', language: 'hi' }));
    localStorage.setItem(getDraftKey('u1', 'entry-1'), JSON.stringify({ title: 'My secret draft' }));
    localStorage.setItem('minddiary:custom_user_key', 'some-sensitive-data');

    // Populate public login screen key
    localStorage.setItem(PUBLIC_LANG_KEY, 'hi');
    localStorage.setItem(PUBLIC_THEME_KEY, 'dark');

    // Populate sessionStorage (app lock)
    sessionStorage.setItem(UNLOCKED_KEY, 'true');

    // Call logout cleanup (default: preserveDrafts: true)
    clearAppStorage();

    // Verify: Auth, settings, custom keys are cleared
    expect(localStorage.getItem(AUTH_KEY)).toBeNull();
    expect(localStorage.getItem(getSettingsKey('u1'))).toBeNull();
    expect(localStorage.getItem('minddiary:custom_user_key')).toBeNull();

    // Verify: Unsaved user drafts are PRESERVED
    expect(localStorage.getItem(getDraftKey('u1', 'entry-1'))).toContain('My secret draft');

    // Verify: sessionStorage is completely cleared
    expect(sessionStorage.getItem(UNLOCKED_KEY)).toBeNull();
    expect(sessionStorage.length).toBe(0);

    // Verify: Public keys for login screen (theme/lang) are preserved
    expect(localStorage.getItem(PUBLIC_LANG_KEY)).toBe('hi');
    expect(localStorage.getItem(PUBLIC_THEME_KEY)).toBe('dark');

    // When preserveDrafts is false (e.g. permanent delete-account), drafts are wiped too
    clearAppStorage({ preserveDrafts: false });
    expect(localStorage.getItem(getDraftKey('u1', 'entry-1'))).toBeNull();
  });

  it('migrateStorageKeys migrates legacy mydiary_ keys to minddiary: and minddiary-public: without data loss', () => {
    localStorage.setItem('mydiary_auth', JSON.stringify({ token: 'old-token', user: { id: 'u123' } }));
    localStorage.setItem('mydiary_lang', 'hi');
    localStorage.setItem('mydiary_settings_u123', JSON.stringify({ theme: 'light' }));
    localStorage.setItem('mydiary_draft_u123_entry456', JSON.stringify({ title: 'Unsaved draft' }));
    sessionStorage.setItem('mydiary_unlocked', 'true');

    migrateStorageKeys();

    // Old keys should be cleaned up
    expect(localStorage.getItem('mydiary_auth')).toBeNull();
    expect(localStorage.getItem('mydiary_lang')).toBeNull();
    expect(localStorage.getItem('mydiary_settings_u123')).toBeNull();
    expect(localStorage.getItem('mydiary_draft_u123_entry456')).toBeNull();
    expect(sessionStorage.getItem('mydiary_unlocked')).toBeNull();

    // New keys should contain the migrated data
    expect(localStorage.getItem(AUTH_KEY)).toContain('old-token');
    expect(localStorage.getItem(PUBLIC_LANG_KEY)).toBe('hi');
    expect(localStorage.getItem('minddiary:settings_u123')).toContain('light');
    expect(localStorage.getItem('minddiary:draft_u123_entry456')).toContain('Unsaved draft');
    expect(sessionStorage.getItem(UNLOCKED_KEY)).toBe('true');
  });
});
