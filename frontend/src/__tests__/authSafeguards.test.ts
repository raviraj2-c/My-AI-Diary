import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from '../config/api';
import { AUTH_KEY, getDraftKey } from '../utils/storage';

describe('Auth Safeguards, Error Codes & Draft Preservation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('wrong PIN / password (401 BAD_CREDENTIALS) keeps the auth token and unsaved drafts intact', async () => {
    // Populate session token and an unsaved draft
    const initialAuth = JSON.stringify({ token: 'active-session-token', user: { id: 'u1' } });
    const draftKey = getDraftKey('u1', 'entry-123');
    const draftContent = JSON.stringify({ title: 'Important thoughts', content: '<p>Do not delete me</p>' });

    localStorage.setItem(AUTH_KEY, initialAuth);
    localStorage.setItem(draftKey, draftContent);

    // Mock fetch to simulate wrong PIN returning 401 { code: 'BAD_CREDENTIALS', attemptsRemaining: 4 }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: false,
        code: 'BAD_CREDENTIALS',
        message: 'Incorrect PIN',
        attemptsRemaining: 4
      })
    });

    // Make an API request
    await expect(
      apiRequest('/auth/app-lock/verify', { method: 'POST', body: JSON.stringify({ pin: '0000' }) })
    ).rejects.toThrow(/Incorrect PIN/);

    // Verify: Auth token was NOT wiped
    expect(localStorage.getItem(AUTH_KEY)).toBe(initialAuth);

    // Verify: Unsaved draft was NOT wiped
    expect(localStorage.getItem(draftKey)).toBe(draftContent);
  });

  it('session expiry (401 TOKEN_EXPIRED) clears auth credentials while PRESERVING unsaved drafts', async () => {
    const initialAuth = JSON.stringify({ token: 'expired-token', user: { id: 'u2' } });
    const draftKey = getDraftKey('u2', 'entry-456');
    const draftContent = JSON.stringify({ title: 'Saved before expiry', content: '<p>Safe draft</p>' });

    localStorage.setItem(AUTH_KEY, initialAuth);
    localStorage.setItem(draftKey, draftContent);

    // Mock fetch returning 401 { code: 'TOKEN_EXPIRED' }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Session expired. Please log in again.'
      })
    });

    await expect(apiRequest('/diary/entries')).rejects.toThrow(/Session expired/);

    // Verify: Auth credentials cleared
    expect(localStorage.getItem(AUTH_KEY)).toBeNull();

    // Verify: Draft is preserved under the user's key so they can resume after re-login
    expect(localStorage.getItem(draftKey)).toBe(draftContent);
  });

  it('server waking up / cold start (503 SERVICE_UNAVAILABLE) keeps session and shows calm waking-up message', async () => {
    const initialAuth = JSON.stringify({ token: 'valid-token', user: { id: 'u3' } });
    const draftKey = getDraftKey('u3', 'entry-789');
    const draftContent = JSON.stringify({ title: 'Draft while waking up', content: '<p>Still here</p>' });

    localStorage.setItem(AUTH_KEY, initialAuth);
    localStorage.setItem(draftKey, draftContent);

    // Mock fetch returning 503 SERVICE_UNAVAILABLE
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: false,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable. Please try again.'
      })
    });

    try {
      await apiRequest('/auth/me');
      expect.fail('Should have thrown an error');
    } catch (err: unknown) {
      const errorObj = err as { message: string; status?: number; code?: string };
      expect(errorObj.message).toMatch(/Server is waking up/i);
      expect(errorObj.status).toBe(503);
    }

    // Verify: Session and draft were NOT logged out or wiped
    expect(localStorage.getItem(AUTH_KEY)).toBe(initialAuth);
    expect(localStorage.getItem(draftKey)).toBe(draftContent);
  });

  it('network error (e.g. Failed to fetch) preserves session and returns calm waking-up message', async () => {
    const initialAuth = JSON.stringify({ token: 'valid-token', user: { id: 'u4' } });
    localStorage.setItem(AUTH_KEY, initialAuth);

    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await apiRequest('/auth/me');
      expect.fail('Should have thrown an error');
    } catch (err: unknown) {
      const errorObj = err as { message: string; status?: number };
      expect(errorObj.message).toMatch(/Server is waking up/i);
      expect(errorObj.status).toBe(503);
    }

    // Token remains intact
    expect(localStorage.getItem(AUTH_KEY)).toBe(initialAuth);
  });
});
