import { User, UserSettings } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';
import { clearAppStorage, AUTH_KEY } from '../utils/storage';
import { getUserTimezone } from '../utils/dates';

export class AuthService {
  static getCurrentUser(): User | null {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) {
      return null;
    }

    try {
      const { token, user } = JSON.parse(authData);
      if (token && user) {
        return user;
      }
    } catch (error) {
      console.error('❌ Error parsing auth data:', error);
      localStorage.removeItem(AUTH_KEY);
    }

    return null;
  }

  static async login(email: string, password: string): Promise<User> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password, timezone: getUserTimezone() }),
      });

      if (!data.success || !data.user) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem(AUTH_KEY, JSON.stringify({
        token: data.token,
        user: data.user
      }));

      return data.user;
    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      throw error;
    }
  }

  static async register(name: string, email: string, password: string): Promise<User> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, timezone: getUserTimezone() }),
      });

      if (!data.success || !data.user) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem(AUTH_KEY, JSON.stringify({
        token: data.token,
        user: data.user
      }));

      return data.user;
    } catch (error) {
      console.error('❌ AuthService: Registration error:', error);
      throw error;
    }
  }

  static logout(): void {
    clearAppStorage();
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!data.success) {
        throw new Error(data.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  static async confirmResetPassword(token: string, newPassword: string): Promise<void> {
    const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
    if (!data.success) {
      throw new Error(data.message || 'Password reset failed');
    }
  }

  static getAuthToken(): string | null {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) return null;

    try {
      const { token } = JSON.parse(authData);
      return token;
    } catch {
      return null;
    }
  }

  static async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.SETTINGS, {
        method: 'PUT',
        body: JSON.stringify({ settings }),
      });

      if (!data.success || !data.settings) {
        throw new Error(data.message || 'Settings update failed');
      }

      return data.settings;
    } catch (error) {
      console.error('Settings update error:', error);
      throw error;
    }
  }

  static async getCurrentUserFromAPI(): Promise<User> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.ME);

      if (!data.success || !data.user) {
        throw new Error(data.message || 'Failed to get user data');
      }

      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  static async setupAppLock(pin: string, password?: string, timeoutMinutes = 5): Promise<void> {
    const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.APP_LOCK_SETUP, {
      method: 'POST',
      body: JSON.stringify({ pin, password, timeoutMinutes })
    });
    if (!data.success) {
      throw new Error(data.message || 'Failed to setup app lock');
    }
  }

  static async verifyAppLock(pin: string): Promise<{ success: boolean; message?: string; lockedSeconds?: number }> {
    const data = await apiRequest<{ success: boolean; message?: string; lockedSeconds?: number }>(
      API_CONFIG.ENDPOINTS.AUTH.APP_LOCK_VERIFY,
      {
        method: 'POST',
        body: JSON.stringify({ pin })
      }
    );
    return data;
  }

  static async disableAppLock(password?: string, pin?: string): Promise<void> {
    const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.APP_LOCK_DISABLE, {
      method: 'POST',
      body: JSON.stringify({ password, pin })
    });
    if (!data.success) {
      throw new Error(data.message || 'Failed to disable app lock');
    }
  }

  static async downloadAllData(): Promise<void> {
    const token = this.getAuthToken();
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.EXPORT_DATA}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      throw new Error('Failed to export data');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minddiary_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async deleteAccount(password: string): Promise<void> {
    const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.DELETE_ACCOUNT, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete account');
    }
    this.logout();
  }
}
