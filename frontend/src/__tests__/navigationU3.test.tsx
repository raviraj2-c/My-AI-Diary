import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomBar } from '../components/common/MobileBottomBar';
import { Header } from '../components/common/Header';
import { ToastProvider } from '../components/common/Toast';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Asha', email: 'asha@example.com' },
    logout: vi.fn(),
  }),
}));

describe('Part U3 Navigation & Top Bar', () => {
  it('MobileBottomBar renders 5 tabs and central Write button', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileBottomBar />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Home')).toHaveAttribute('href', '/');
    expect(screen.getByLabelText('Journal')).toHaveAttribute('href', '/journal');
    expect(screen.getByLabelText('Mood')).toHaveAttribute('href', '/mood');
    expect(screen.getByLabelText('Calm')).toHaveAttribute('href', '/calm');
    expect(screen.getByLabelText('Talk')).toHaveAttribute('href', '/talk');
    expect(screen.getByLabelText('Write')).toHaveAttribute('href', '/write');
  });

  it('Sidebar renders slim rail with Write button and 5 tabs', () => {
    render(
      <MemoryRouter initialEntries={['/journal']}>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(screen.getByLabelText('Journal')).toHaveAttribute('aria-current', 'page');
  });

  it('Header renders SOS pill and Avatar menu with all secondary destinations', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <Header />
        </ToastProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /SOS/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /User account menu/i }));

    for (const label of ['Settings', 'Student', 'Stories', 'Letters', 'Happy Box', 'Export', 'Privacy', 'Log out']) {
      expect(screen.getByRole('menuitem', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
  });
});
