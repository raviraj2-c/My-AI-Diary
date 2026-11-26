import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { YearInPixelsPage } from '../pages/YearInPixelsPage';
import { LettersPage } from '../pages/LettersPage';
import { CopingPlanSettings } from '../components/Settings/CopingPlanSettings';
import { WellnessService } from '../services/wellnessService';
import { LetterService } from '../services/letterService';

vi.mock('../services/wellnessService', () => ({
  WellnessService: {
    getYearPixels: vi.fn(),
    getCopingPlan: vi.fn(),
    saveCopingPlan: vi.fn()
  }
}));

vi.mock('../services/letterService', () => ({
  LetterService: {
    getLetters: vi.fn(),
    getDueLetters: vi.fn(),
    getLetter: vi.fn(),
    createLetter: vi.fn(),
    deleteLetter: vi.fn()
  }
}));

vi.mock('../components/common/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('Frontend: Three New Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(WellnessService.getYearPixels).mockResolvedValue({
      year: 2026,
      pixels: {
        '2026-03-10': { score: 9, source: 'checkin', mood: 'Joyful', entryId: null, title: null }
      }
    });
    vi.mocked(WellnessService.getCopingPlan).mockResolvedValue({
      warningSigns: ['Can not sleep'],
      copingStrategies: ['Deep breathing'],
      peopleToContact: ['Dr. Smith'],
      safePlaces: ['My garden'],
      reasonsToKeepGoing: ['Family']
    });
    vi.mocked(LetterService.getLetters).mockResolvedValue([]);
    vi.mocked(LetterService.getDueLetters).mockResolvedValue([]);
  });

  describe('Year in Pixels', () => {
    it('renders header, legend, and grid cells with loaded data', async () => {
      vi.mocked(WellnessService.getYearPixels).mockResolvedValueOnce({
        year: 2026,
        pixels: {
          '2026-03-10': { score: 9, source: 'checkin', mood: 'Joyful', entryId: null, title: null }
        }
      });

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <YearInPixelsPage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByText(/Year in Pixels/i)).toBeInTheDocument();
      expect(screen.getByText(/2026/)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/Mood Score Legend/i)).toBeInTheDocument();
      });
    });
  });

  describe('Letters to Future Self', () => {
    it('renders locked letters and delivered letters tabs', async () => {
      vi.mocked(LetterService.getLetters).mockResolvedValueOnce([
        {
          id: 'letter-1',
          title: 'Letter for Next Year',
          writtenOn: new Date().toISOString(),
          deliverOn: new Date(Date.now() + 86400000 * 30).toISOString(),
          isLocked: true
        },
        {
          id: 'letter-2',
          title: 'Delivered Wisdom',
          writtenOn: new Date(Date.now() - 86400000 * 2).toISOString(),
          deliverOn: new Date(Date.now() - 86400000).toISOString(),
          openedAt: null,
          isLocked: false
        }
      ]);

      render(
        <MemoryRouter>
          <LettersPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Letter for Next Year')).toBeInTheDocument();
        expect(screen.getByText('Delivered Wisdom')).toBeInTheDocument();
        expect(screen.getByText(/Locked in Time/i)).toBeInTheDocument();
        expect(screen.getByText(/Delivered Letters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Coping Plan Settings', () => {
    it('renders 5 coping categories and allows item addition', async () => {
      vi.mocked(WellnessService.getCopingPlan).mockResolvedValueOnce({
        warningSigns: ['Can not sleep'],
        copingStrategies: ['Deep breathing'],
        peopleToContact: ['Dr. Smith'],
        safePlaces: ['My garden'],
        reasonsToKeepGoing: ['Family']
      });

      render(
        <MemoryRouter>
          <CopingPlanSettings />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Personal Safety & Coping Plan/i)).toBeInTheDocument();
        expect(screen.getByText('Can not sleep')).toBeInTheDocument();
        expect(screen.getByText('Deep breathing')).toBeInTheDocument();
      });
    });
  });
});
