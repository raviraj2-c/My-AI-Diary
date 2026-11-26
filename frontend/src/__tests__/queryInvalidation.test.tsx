import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHomeSummary, useInvalidateWellness } from '../hooks/useQueries';
import { WellnessService } from '../services/wellnessService';

vi.mock('../services/wellnessService', () => ({
  WellnessService: {
    getHomeSummary: vi.fn(),
  },
}));

function TestHarness() {
  const { data, isLoading } = useHomeSummary();
  const invalidate = useInvalidateWellness();

  if (isLoading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="score">{data?.todayScore ?? 'none'}</span>
      <button type="button" onClick={() => void invalidate()}>
        invalidate
      </button>
    </div>
  );
}

describe('React Query caching and invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches home-summary once and refetches after invalidation', async () => {
    vi.mocked(WellnessService.getHomeSummary)
      .mockResolvedValueOnce({
        todayDone: false,
        todayScore: 5,
        weekDays: [],
        streakDays: 1,
        lastEntry: null,
        dueLetters: 0
      })
      .mockResolvedValueOnce({
        todayDone: true,
        todayScore: 9,
        weekDays: [],
        streakDays: 2,
        lastEntry: null,
        dueLetters: 0
      });

    const qc = new QueryClient({
      defaultOptions: { queries: { staleTime: 60000, retry: false } }
    });

    render(
      <QueryClientProvider client={qc}>
        <TestHarness />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByTestId('score').textContent).toBe('5'));
    expect(WellnessService.getHomeSummary).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('invalidate'));
    await waitFor(() => expect(screen.getByTestId('score').textContent).toBe('9'));
    expect(WellnessService.getHomeSummary).toHaveBeenCalledTimes(2);
  });
});
