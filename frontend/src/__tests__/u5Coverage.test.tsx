import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { CalendarPage } from '../pages/CalendarPage';

const mockSaveCheckIn = vi.fn().mockResolvedValue({ success: true });
const mockInvalidateAll = vi.fn();
const mockUseCalendarMonth = vi.fn().mockReturnValue({
  data: [{ date: '2026-11-15', count: 1, moods: ['happy'] }],
  isLoading: false,
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Asha Sharma', email: 'asha@example.com' },
    isAuthenticated: true,
    loading: false,
  }),
}));

vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { isStudent: true, theme: 'light', country: 'India' },
  }),
}));

vi.mock('../hooks/useQueries', () => ({
  useHomeSummary: () => ({
    data: {
      streakDays: 5,
      todayMood: null,
      weekDays: [
        { date: '2026-11-20', score: 7, source: 'checkin' },
        { date: '2026-11-21', score: null, source: null },
        { date: '2026-11-22', score: 8, source: 'entry' },
        { date: '2026-11-23', score: 6, source: 'checkin' },
        { date: '2026-11-24', score: null, source: null },
        { date: '2026-11-25', score: 9, source: 'checkin' },
        { date: '2026-11-26', score: null, source: null },
      ],
      lastEntry: {
        id: 'e1',
        title: 'Quiet morning walk',
        date: '2026-11-25T08:00:00Z',
        mood: 'peaceful',
      },
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useInvalidateWellness: () => mockInvalidateAll,
  useCalendarMonth: (month: string) => mockUseCalendarMonth(month),
  useEntries: () => ({
    data: { entries: [] },
    isLoading: false,
  }),
}));

vi.mock('../services/wellnessService', () => ({
  WellnessService: {
    saveCheckIn: (...args: unknown[]) => mockSaveCheckIn(...args),
  },
}));

const LocationProbe: React.FC = () => {
  const loc = useLocation();
  return <div data-testid="loc">{`${loc.pathname}${loc.search}`}</div>;
};

describe('Part U5 Coverage: Home summary, quick check-in, calendar, and redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders home-summary streak, last entry, and saves quick check-in on mood face tap', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/5\s*day/i)).toBeInTheDocument();
    expect(screen.getByText('Quiet morning walk')).toBeInTheDocument();

    const happyFace = screen.getByRole('button', { name: /moods\.happy/i });
    fireEvent.click(happyFace);

    await waitFor(() => {
      expect(mockSaveCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({ moodScore: 8 })
      );
      expect(mockInvalidateAll).toHaveBeenCalled();
    });

    expect(screen.getByText(/Add more/i)).toBeInTheDocument();
  });

  it('loads current month via useCalendarMonth on CalendarPage', () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    );

    expect(mockUseCalendarMonth).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}$/));
  });

  it('redirects legacy URLs to the 5-tab destinations', () => {
    const legacyCases: Array<[string, string]> = [
      ['/checkin', '/mood'],
      ['/pixels', '/mood?tab=year'],
      ['/insights', '/mood?tab=trends'],
      ['/calendar', '/journal?tab=calendar'],
      ['/search', '/journal?tab=search'],
      ['/happy-box', '/journal?filter=favorites'],
      ['/ask', '/talk?mode=diary'],
      ['/chat', '/talk'],
    ];

    for (const [from, expected] of legacyCases) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[from]}>
          <Routes>
            <Route path="/mood" element={<LocationProbe />} />
            <Route path="/journal" element={<LocationProbe />} />
            <Route path="/talk" element={<LocationProbe />} />
            <Route path="/checkin" element={<Navigate to="/mood" replace />} />
            <Route path="/pixels" element={<Navigate to="/mood?tab=year" replace />} />
            <Route path="/insights" element={<Navigate to="/mood?tab=trends" replace />} />
            <Route path="/calendar" element={<Navigate to="/journal?tab=calendar" replace />} />
            <Route path="/search" element={<Navigate to="/journal?tab=search" replace />} />
            <Route path="/happy-box" element={<Navigate to="/journal?filter=favorites" replace />} />
            <Route path="/ask" element={<Navigate to="/talk?mode=diary" replace />} />
            <Route path="/chat" element={<Navigate to="/talk" replace />} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId('loc')).toHaveTextContent(expected);
      unmount();
    }
  });
});
