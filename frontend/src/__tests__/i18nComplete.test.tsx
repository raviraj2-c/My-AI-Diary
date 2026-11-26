import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { execSync } from 'child_process';
import path from 'path';
import i18n, { changeLanguage } from '../i18n';
import en from '../i18n/locales/en.json';
import hi from '../i18n/locales/hi.json';
import { SafetyBanner } from '../components/Wellness/SafetyBanner';
import { SOSButton } from '../components/common/SOSButton';
import { UserSettings } from '../components/Settings/UserSettings';
import { ToastProvider } from '../components/common/Toast';

vi.mock('../services/wellnessService', () => ({
  WellnessService: {
    getCopingPlan: vi.fn().mockResolvedValue({
      warningSigns: [],
      copingStrategies: [],
      safePlaces: [],
      reasonsToKeepGoing: [],
      peopleToContact: []
    })
  }
}));

vi.mock('../services/authService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/authService')>();
  return {
    ...actual,
    AuthService: {
      ...actual.AuthService,
      getAuthToken: vi.fn().mockReturnValue('mock-token'),
      getCurrentUser: vi.fn().mockReturnValue({
        id: 'user1',
        email: 'test@example.com',
        settings: {
          language: 'hi',
          allowAIFeatures: true,
          allowDiaryAI: true
        }
      })
    }
  };
});

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getLeafKeys(v as Record<string, unknown>, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

describe('Complete i18n & Localization Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await changeLanguage('en');
  });

  it('1. Parity Test: en.json and hi.json have identical keys with zero divergence', () => {
    const enKeys = getLeafKeys(en as Record<string, unknown>);
    const hiKeys = getLeafKeys(hi as Record<string, unknown>);

    const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
    const missingInEn = hiKeys.filter((k) => !enKeys.includes(k));

    expect(missingInHi, `Missing in hi.json: ${missingInHi.join(', ')}`).toEqual([]);
    expect(missingInEn, `Missing in en.json: ${missingInEn.join(', ')}`).toEqual([]);
    expect(enKeys.length).toBeGreaterThanOrEqual(1000);
  });

  it('2. CI Script Test: check-i18n.js executes cleanly with exit code 0', () => {
    const scriptPath = path.resolve(__dirname, '../../scripts/check-i18n.js');
    const output = execSync(`node "${scriptPath}"`, { encoding: 'utf-8' });
    expect(output).toContain('i18n check passed');
    expect(output).toContain('Both en.json and hi.json have identical');
  });

  it('3. Document Language & Switcher: document.documentElement.lang updates reactively', async () => {
    await changeLanguage('hi');
    expect(document.documentElement.lang).toBe('hi');
    expect(i18n.language).toBe('hi');

    await changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    expect(i18n.language).toBe('en');
  });

  it('4. Hindi Render: SafetyBanner displays Devanagari text in high crisis mode', async () => {
    await changeLanguage('hi');

    const handleDismiss = vi.fn();
    const { container } = render(
      <SafetyBanner
        level="high"
        country="IN"
        onDismiss={handleDismiss}
        trustedContact={{ name: 'राकेश', phone: '+919876543210' }}
      />
    );

    const hasDevanagari = /[\u0900-\u097F]/.test(container.textContent || '');
    expect(hasDevanagari).toBe(true);

    // Verify helpline or crisis words in Hindi
    expect(screen.getByText(/आप अकेले नहीं हैं/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /कॉल/i })).toBeInTheDocument();
  });

  it('5. Hindi Render: SOSButton modal opens with Devanagari text and localized helplines', async () => {
    await changeLanguage('hi');

    render(
      <MemoryRouter>
        <SOSButton />
      </MemoryRouter>
    );

    // Find and click the SOS button
    const sosBtn = screen.getByRole('button');
    fireEvent.click(sosBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialogText = screen.getByRole('dialog').textContent || '';
    const hasDevanagari = /[\u0900-\u097F]/.test(dialogText);
    expect(hasDevanagari).toBe(true);
  });

  it('6. Hindi Render: UserSettings renders localized labels and switches', async () => {
    await changeLanguage('hi');

    const { container } = render(
      <MemoryRouter>
        <ToastProvider>
          <UserSettings />
        </ToastProvider>
      </MemoryRouter>
    );

    const text = container.textContent || '';
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    expect(hasDevanagari).toBe(true);
    expect(screen.getByText(/दिखावट और रूप/i)).toBeInTheDocument();
  });
});
