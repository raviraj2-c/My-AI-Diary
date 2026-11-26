import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';

vi.mock('../services/authService', () => ({
  AuthService: {
    getAuthToken: vi.fn(),
    getCurrentUserFromAPI: vi.fn(),
    logout: vi.fn(),
  },
}));

const TestConsumer: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <div>Loading auth...</div>;
  return (
    <div>
      <div>Status: {isAuthenticated ? 'Authenticated' : 'Unauthenticated'}</div>
      <div>User: {user ? user.name : 'None'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs out and sets user to null when token is invalid or 401', async () => {
    vi.mocked(AuthService.getAuthToken).mockReturnValue('invalid-token');
    vi.mocked(AuthService.getCurrentUserFromAPI).mockRejectedValue(new Error('Unauthorized (401)'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Status: Unauthenticated/i)).toBeInTheDocument();
      expect(screen.getByText(/User: None/i)).toBeInTheDocument();
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });

  it('sets user successfully when token is valid', async () => {
    vi.mocked(AuthService.getAuthToken).mockReturnValue('valid-token');
    vi.mocked(AuthService.getCurrentUserFromAPI).mockResolvedValue({
      id: '123',
      name: 'Ravi',
      email: 'ravi@example.com',
      createdAt: new Date().toISOString(),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Status: Authenticated/i)).toBeInTheDocument();
      expect(screen.getByText(/User: Ravi/i)).toBeInTheDocument();
    });
  });
});
