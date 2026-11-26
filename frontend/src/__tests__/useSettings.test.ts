import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../hooks/useSettings';
import { AuthService } from '../services/authService';

vi.mock('../services/authService', () => ({
  AuthService: {
    getCurrentUser: vi.fn(),
    getAuthToken: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('useSettings Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('merges default settings with server settings on initial render', () => {
    vi.mocked(AuthService.getCurrentUser).mockReturnValue({
      id: 'user1',
      settings: {
        theme: 'dark',
        country: 'US',
        allowAIFeatures: true,
      },
    } as unknown as ReturnType<typeof AuthService.getCurrentUser>);

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.country).toBe('US');
    expect(result.current.settings.allowAIFeatures).toBe(true);
  });

  it('settings merge strictly prefers server values over local cached values', () => {
    // Put stale/different values in localStorage
    localStorage.setItem(
      'minddiary:settings_user1',
      JSON.stringify({
        theme: 'light',
        country: 'US',
        allowAIFeatures: false,
      })
    );

    // Server returns newer / source-of-truth values
    vi.mocked(AuthService.getCurrentUser).mockReturnValue({
      id: 'user1',
      settings: {
        theme: 'dark',
        country: 'IN',
        allowAIFeatures: true,
      },
    } as unknown as ReturnType<typeof AuthService.getCurrentUser>);

    const { result } = renderHook(() => useSettings());

    // Server values win
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.country).toBe('IN');
    expect(result.current.settings.allowAIFeatures).toBe(true);
  });

  it('rolls back settings if server sync fails', async () => {
    vi.mocked(AuthService.getCurrentUser).mockReturnValue({
      id: 'user1',
      settings: {
        theme: 'light',
        country: 'IN',
      },
    } as unknown as ReturnType<typeof AuthService.getCurrentUser>);
    vi.mocked(AuthService.getAuthToken).mockReturnValue('valid-jwt-token');
    vi.mocked(AuthService.updateSettings).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.theme).toBe('light');

    await act(async () => {
      try {
        await result.current.updateSettings({ theme: 'dark' });
      } catch {
        // error caught
      }
    });

    // Rolled back to 'light'
    expect(result.current.settings.theme).toBe('light');
  });
});
