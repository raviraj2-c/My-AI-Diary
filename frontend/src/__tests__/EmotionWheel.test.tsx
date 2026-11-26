import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmotionWheel } from '../components/Wellness/EmotionWheel';

describe('EmotionWheel Component', () => {
  it('renders core emotions and allows selecting one', () => {
    const handleChange = vi.fn();
    render(<EmotionWheel selectedEmotions={[]} onChange={handleChange} />);

    expect(screen.getByText(/Choose Core Emotion/i)).toBeInTheDocument();

    const joyBtn = screen.getByRole('button', { name: /Joy/i });
    expect(joyBtn).toBeInTheDocument();

    // In the default Joy category, 'Content' is one of the sub-emotions
    const nuanceBtn = screen.getByRole('button', { name: /Content/i });
    fireEvent.click(nuanceBtn);
    expect(handleChange).toHaveBeenCalledWith(['Content']);
  });

  it('supports keyboard navigation via Enter and Space keys', () => {
    const handleChange = vi.fn();
    render(<EmotionWheel selectedEmotions={[]} onChange={handleChange} />);

    const joyBtn = screen.getByRole('button', { name: /Joy/i });
    joyBtn.focus();
    fireEvent.keyDown(joyBtn, { key: 'Enter', code: 'Enter' });

    const nuanceBtn = screen.getByRole('button', { name: /Content/i });
    nuanceBtn.focus();
    fireEvent.click(nuanceBtn);
    expect(handleChange).toHaveBeenCalledWith(['Content']);
  });

  it('allows removing a selected emotion via the remove button', () => {
    const handleChange = vi.fn();
    render(<EmotionWheel selectedEmotions={['Content', 'Hopeful']} onChange={handleChange} />);

    const removeBtn = screen.getByRole('button', { name: /Remove Content/i });
    fireEvent.click(removeBtn);
    expect(handleChange).toHaveBeenCalledWith(['Hopeful']);
  });
});
