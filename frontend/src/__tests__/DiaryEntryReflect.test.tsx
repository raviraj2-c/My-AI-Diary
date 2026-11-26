import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DiaryEntry } from '../components/Diary/DiaryEntry';
import { AIService } from '../services/aiService';
import { DiaryEntry as DiaryEntryType } from '../types';

vi.mock('../services/aiService', () => ({
  AIService: {
    reflectOnEntry: vi.fn(),
  },
}));

vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      theme: 'light',
      fontSize: 'medium',
      fontFamily: 'inter',
      language: 'en',
      country: 'US',
      allowAIFeatures: true,
      allowDiaryAI: true,
    },
    updateSettings: vi.fn(),
  }),
}));

const mockEntry: DiaryEntryType = {
  id: 'entry-1',
  userId: 'user-1',
  title: 'My Peaceful Morning',
  content: '<p>Woke up early, drank warm tea, and listened to birds.</p>',
  tags: ['peaceful', 'tea'],
  mood: 'peaceful',
  date: new Date('2026-11-20T08:00:00Z'),
};

describe('DiaryEntry "Reflect with me" Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Reflect with me" button and handles AI-disabled error state with link to settings', async () => {
    const err = new Error('AI reflection features are disabled in your account settings.');
    (err as unknown as { status: number; code: string }).status = 403;
    (err as unknown as { status: number; code: string }).code = 'AI_DISABLED';
    vi.mocked(AIService.reflectOnEntry).mockRejectedValueOnce(err);

    render(
      <MemoryRouter>
        <DiaryEntry entry={mockEntry} onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>
    );

    const reflectBtn = screen.getByRole('button', { name: /Reflect with me/i });
    expect(reflectBtn).toBeInTheDocument();

    fireEvent.click(reflectBtn);

    await waitFor(() => {
      expect(screen.getByText(/AI reflection is turned off in your settings/i)).toBeInTheDocument();
    });

    const settingsLink = screen.getByRole('link', { name: /Enable in Settings/i });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('handles safety "high" response by rendering SafetyBanner and suppressing AI text', async () => {
    vi.mocked(AIService.reflectOnEntry).mockResolvedValueOnce({
      reflection: 'Harmful thoughts detected secret string that should not show',
      safety: { level: 'high' },
    });

    render(
      <MemoryRouter>
        <DiaryEntry entry={mockEntry} onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>
    );

    const reflectBtn = screen.getByRole('button', { name: /Reflect with me/i });
    fireEvent.click(reflectBtn);

    await waitFor(() => {
      // SafetyBanner header must be displayed
      expect(screen.getByText(/You matter. You are not alone./i)).toBeInTheDocument();
    });

    // AI text MUST NOT be displayed
    expect(screen.queryByText(/Harmful thoughts detected secret string that should not show/i)).not.toBeInTheDocument();
  });

  it('hides "Reflect with me" button on entries marked aiExcluded === true', () => {
    const excludedEntry: DiaryEntryType = {
      ...mockEntry,
      aiExcluded: true,
    };

    render(
      <MemoryRouter>
        <DiaryEntry entry={excludedEntry} onEdit={vi.fn()} onDelete={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /Reflect with me/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Hidden from AI/i)).toBeInTheDocument();
  });
});
