import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, ageConfirmed?: boolean) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = AuthService.getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const verifiedUser = await AuthService.getCurrentUserFromAPI();
        setUser(verifiedUser);
        if (verifiedUser.settings) {
          window.dispatchEvent(
            new CustomEvent('minddiary_sync_server_settings', {
              detail: { settings: verifiedUser.settings, userId: verifiedUser.id }
            })
          );
        }
      } catch (error) {
        const status = (error as { status?: number })?.status;
        const code = (error as { code?: string })?.code;
        if (status === 503 || code === 'SERVICE_UNAVAILABLE') {
          console.warn('Server is waking up or temporarily unavailable. Keeping session credentials.');
        } else {
          console.warn('Authentication token invalid or expired. Logging out.', error);
          AuthService.logout();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('minddiary_logout', handleLogout);
    return () => window.removeEventListener('minddiary_logout', handleLogout);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const userData = await AuthService.login(email, password);
      setUser(userData);
      if (userData.settings) {
        window.dispatchEvent(
          new CustomEvent('minddiary_sync_server_settings', {
            detail: { settings: userData.settings, userId: userData.id }
          })
        );
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, ageConfirmed = true): Promise<void> => {
    setLoading(true);
    try {
      const userData = await AuthService.register(name, email, password, ageConfirmed);
      setUser(userData);
      if (userData.settings) {
        window.dispatchEvent(
          new CustomEvent('minddiary_sync_server_settings', {
            detail: { settings: userData.settings, userId: userData.id }
          })
        );
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    AuthService.logout();
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    await AuthService.resetPassword(email);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
