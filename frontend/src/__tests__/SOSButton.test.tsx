import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SOSButton } from '../components/common/SOSButton';
import { WellnessService } from '../services/wellnessService';
import { AuthService } from '../services/authService';

vi.mock('../services/wellnessService', () => ({
  WellnessService: {
    getCopingPlan: vi.fn(),
  },
}));

vi.mock('../services/authService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/authService')>();
  return {
    ...actual,
    AuthService: {
      ...actual.AuthService,
      getAuthToken: vi.fn(),
      getCurrentUser: vi.fn().mockReturnValue(null),
    },
  };
});

describe('SOSButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the floating SOS button and opens help dialog when clicked', () => {
    vi.mocked(AuthService.getAuthToken).mockReturnValue(null);

    render(
      <MemoryRouter>
        <SOSButton />
      </MemoryRouter>
    );

    const sosButton = screen.getByRole('button', { name: /Open emergency help/i });
    expect(sosButton).toBeInTheDocument();

    // Click to open modal
    fireEvent.click(sosButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Crisis Support & Grounding/i)).toBeInTheDocument();
  });

  it('renders on both unauthenticated and authenticated route views', () => {
    vi.mocked(AuthService.getAuthToken).mockReturnValue(null);

    // 1. Unauthenticated route
    const { unmount } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
        <SOSButton />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Open emergency help/i })).toBeInTheDocument();
    unmount();

    // 2. Authenticated route
    render(
      <MemoryRouter initialEntries={['/write']}>
        <Routes>
          <Route path="/write" element={<div>Diary Editor</div>} />
        </Routes>
        <SOSButton />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Open emergency help/i })).toBeInTheDocument();
  });

  it('makes NO network call to getCopingPlan when user is unauthenticated', async () => {
    vi.mocked(AuthService.getAuthToken).mockReturnValue(null);

    render(
      <MemoryRouter>
        <SOSButton />
      </MemoryRouter>
    );

    const sosButton = screen.getByRole('button', { name: /Open emergency help/i });
    fireEvent.click(sosButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Must NOT call coping plan endpoint when unauthenticated
    expect(WellnessService.getCopingPlan).not.toHaveBeenCalled();
  });

  it('fetches coping plan when user is authenticated, and displays plan items if present', async () => {
    vi.mocked(AuthService.getAuthToken).mockReturnValue('valid-test-token');
    vi.mocked(WellnessService.getCopingPlan).mockResolvedValue({
      warningSigns: ['Feeling exhausted'],
      copingStrategies: ['Deep breathing', 'Walk outside'],
      peopleToContact: ['Dr. Sarah'],
      safePlaces: ['My garden'],
      reasonsToKeepGoing: ['My family', 'Tomorrow']
    });

    render(
      <MemoryRouter>
        <SOSButton />
      </MemoryRouter>
    );

    const sosButton = screen.getByRole('button', { name: /Open emergency help/i });
    fireEvent.click(sosButton);

    await waitFor(() => {
      expect(WellnessService.getCopingPlan).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Deep breathing/i)).toBeInTheDocument();
      expect(screen.getByText(/My safe places:/i)).toBeInTheDocument();
    });
  });

  it('handles coping plan fetch failure gracefully without disrupting helplines', async () => {
    vi.mocked(AuthService.getAuthToken).mockReturnValue('valid-test-token');
    vi.mocked(WellnessService.getCopingPlan).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <SOSButton />
      </MemoryRouter>
    );

    const sosButton = screen.getByRole('button', { name: /Open emergency help/i });
    fireEvent.click(sosButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // National Helplines are still displayed
      expect(screen.getByText(/Helplines/i)).toBeInTheDocument();
    });
  });

  it('renders SOSButton during initial app loading state so crisis help is immediately accessible', () => {
    render(
      <MemoryRouter>
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
          <p>Opening your sanctuary...</p>
          <SOSButton />
        </div>
      </MemoryRouter>
    );

    expect(screen.getByText(/Opening your sanctuary/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open emergency help/i })).toBeInTheDocument();
  });
});
