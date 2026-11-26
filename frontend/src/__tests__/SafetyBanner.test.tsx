import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SafetyBanner } from '../components/Wellness/SafetyBanner';

describe('SafetyBanner Component', () => {
  it('renders nothing when level is none', () => {
    const { container } = render(<SafetyBanner level="none" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders supportive message on concern level with national helpline', () => {
    render(<SafetyBanner level="concern" country="IN" />);
    expect(screen.getByText(/We are here with you/i)).toBeInTheDocument();
    // India has Tele-MANAS
    expect(screen.getByText(/Tele-MANAS/i)).toBeInTheDocument();
  });

  it('renders full-screen calm modal on high level with call and SMS/contact links', () => {
    const handleDismiss = vi.fn();
    render(
      <SafetyBanner
        level="high"
        country="US"
        onDismiss={handleDismiss}
        trustedContact={{ name: 'Alex', phone: '+1234567890' }}
      />
    );

    expect(screen.getByText(/You matter. You are not alone./i)).toBeInTheDocument();
    // In US, 988 Lifeline is primary
    const callLinks = screen.getAllByRole('link', { name: /988/i });
    expect(callLinks.length).toBeGreaterThan(0);
    expect(callLinks[0]).toHaveAttribute('href', 'tel:988');

    // Trusted contact link
    const contactLink = screen.getByRole('link', { name: /Reach My Trusted Contact/i });
    expect(contactLink).toHaveAttribute('href', 'tel:+1234567890');

    // Pressing Escape dismisses the modal
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleDismiss).toHaveBeenCalled();
  });

  it('SafetyScreen shows helplines, a "Call now" button, and "I\'m okay for now, continue"', () => {
    const handleDismiss = vi.fn();
    render(
      <SafetyBanner
        level="high"
        country="IN"
        onDismiss={handleDismiss}
      />
    );

    // Call helpline now button/link
    const callNowBtn = screen.getByRole('link', { name: /Call Helpline Now/i });
    expect(callNowBtn).toBeInTheDocument();
    expect(callNowBtn).toHaveAttribute('href', expect.stringContaining('tel:'));

    // National helplines displayed
    expect(screen.getAllByText(/Tele-MANAS/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/KIRAN/i)).toBeInTheDocument();

    // "I'm okay for now, continue" button
    const continueBtn = screen.getByRole('button', { name: /I'm okay for now, continue/i });
    expect(continueBtn).toBeInTheDocument();

    // Clicking continue triggers dismiss
    fireEvent.click(continueBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
