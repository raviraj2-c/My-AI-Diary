import { User } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

const AUTH_KEY = 'mydiary_auth';

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
        body: JSON.stringify({ email, password }),
      });

      if (!data.success) {
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
        body: JSON.stringify({ name, email, password }),
      });

      if (!data.success) {
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
    localStorage.removeItem(AUTH_KEY);
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

  static getAuthToken(): string | null {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) return null;
    
    try {
      const { token } = JSON.parse(authData);
      return token;
    } catch (error) {
      return null;
    }
  }

  static async updateSettings(settings: any): Promise<any> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AUTH.SETTINGS, {
        method: 'PUT',
        body: JSON.stringify({ settings }),
      });

      if (!data.success) {
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

      if (!data.success) {
        throw new Error(data.message || 'Failed to get user data');
      }

      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }
}