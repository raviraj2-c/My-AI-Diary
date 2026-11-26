import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckIn } from '../components/Wellness/CheckIn';
import { WellnessService } from '../services/wellnessService';

vi.mock('../services/wellnessService', () => ({
  WellnessService: {
    saveCheckIn: vi.fn(),
  },
}));

vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      country: 'India',
      trustedContact: { name: 'Friend', phone: '123' },
    },
  }),
}));

vi.mock('../components/common/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('CheckIn Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders check-in options and submits valid check-in', async () => {
    const handleSuccess = vi.fn();
    vi.mocked(WellnessService.saveCheckIn).mockResolvedValue({
      success: true,
      data: {
        id: 'ci_1',
        user: 'u1',
        date: new Date().toISOString(),
        moodScore: 8,
        emotions: ['Joyful'],
        sleepHours: 8,
        energy: 4,
        stress: 1,
        anxiety: 1,
        tags: ['Exercise'],
        note: 'Feeling good today',
        createdAt: new Date().toISOString(),
      },
      safety: { level: 'none' },
    } as unknown as Awaited<ReturnType<typeof WellnessService.saveCheckIn>>);

    render(<CheckIn onSuccess={handleSuccess} />);

    expect(screen.getByText(/How are you feeling today/i)).toBeInTheDocument();
    expect(screen.getByText(/Save Check-In/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Save Check-In/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(WellnessService.saveCheckIn).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
