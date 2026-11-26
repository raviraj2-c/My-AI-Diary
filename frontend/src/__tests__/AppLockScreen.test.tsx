import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppLockScreen } from '../components/common/AppLockScreen';
import { AuthService } from '../services/authService';

// Mock AuthService
vi.mock('../services/authService', () => ({
  AuthService: {
    verifyAppLock: vi.fn(),
    disableAppLock: vi.fn(),
  },
}));

// Mock useSettings
vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      appLockEnabled: true,
      appLockTimeoutMinutes: 5,
    },
    updateSettings: vi.fn(),
  }),
}));

// Mock useAuth
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Test User' },
    logout: vi.fn(),
  }),
}));

describe('AppLockScreen Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  it('renders lock screen when locked', () => {
    render(
      <AppLockScreen>
        <div>Protected App Content</div>
      </AppLockScreen>
    );

    expect(screen.getByText(/MindDiary Locked/i)).toBeInTheDocument();
    expect(screen.queryByText(/Protected App Content/i)).not.toBeInTheDocument();
  });

  it('shows error message on wrong PIN and locks out after 5 failed attempts', async () => {
    vi.mocked(AuthService.verifyAppLock).mockResolvedValue({ success: false, message: 'Invalid PIN' });

    render(
      <AppLockScreen>
        <div>Protected App Content</div>
      </AppLockScreen>
    );

    const pinInput = screen.getByLabelText(/Enter App Lock Passcode/i);
    const unlockBtn = screen.getByRole('button', { name: /Unlock Diary/i });

    // 1st failed attempt
    fireEvent.change(pinInput, { target: { value: '1111' } });
    fireEvent.click(unlockBtn);
    await waitFor(() => {
      expect(screen.getByText(/Incorrect PIN. 4 attempts remaining./i)).toBeInTheDocument();
    });

    // 2nd
    fireEvent.click(unlockBtn);
    await waitFor(() => {
      expect(screen.getByText(/Incorrect PIN. 3 attempts remaining./i)).toBeInTheDocument();
    });

    // 3rd
    fireEvent.click(unlockBtn);
    await waitFor(() => {
      expect(screen.getByText(/Incorrect PIN. 2 attempts remaining./i)).toBeInTheDocument();
    });

    // 4th
    fireEvent.click(unlockBtn);
    await waitFor(() => {
      expect(screen.getByText(/Incorrect PIN. 1 attempts remaining./i)).toBeInTheDocument();
    });

    // 5th attempt -> lockout
    fireEvent.click(unlockBtn);
    await waitFor(() => {
      expect(screen.getByText(/Too many wrong attempts. Locked for 60 seconds./i)).toBeInTheDocument();
    });
  });
});
