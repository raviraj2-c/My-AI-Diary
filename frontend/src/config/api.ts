import { User, UserSettings } from '../types';
import { AUTH_KEY, clearAppStorage } from '../utils/storage';

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',

  // 60-second timeout to accommodate cold starts on free tier hosting (e.g., Render)
  TIMEOUT: 60000,

  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      SETTINGS: '/auth/settings',
      APP_LOCK_SETUP: '/auth/app-lock/setup',
      APP_LOCK_VERIFY: '/auth/app-lock/verify',
      APP_LOCK_DISABLE: '/auth/app-lock/disable',
      EXPORT_DATA: '/auth/export-data',
      DELETE_ACCOUNT: '/auth/delete-account',
    },
    DIARY: {
      ENTRIES: '/diary/entries',
      ENTRY: (id: string) => `/diary/entries/${id}`,
      CALENDAR: (month: string) => `/diary/calendar?month=${encodeURIComponent(month)}`,
      TAGS: '/diary/tags',
      STATS: '/diary/stats',
    },
    AI: {
      GENERATE_STORYBOOK: '/ai/generate-storybook',
      STORYBOOKS: '/ai/storybooks',
      STORYBOOK: (id: string) => `/ai/storybooks/${id}`,
      REFLECT: '/ai/reflect',
      ANALYZE_MOOD: '/ai/analyze-mood',
      CHALLENGE_THOUGHT: '/ai/challenge-thought',
      WRITING_STARTERS: '/ai/writing-starters',
      USAGE: '/ai/usage',
      THOUGHTS: '/ai/thoughts',
      THOUGHT: (id: string) => `/ai/thoughts/${id}`,
      ASK_DIARY: '/ai/ask-diary',
      ASK_DIARY_HISTORY: '/ai/ask-diary/history',
    },
    CHAT: {
      MESSAGES: '/chat/messages',
    },
    EXPORT: {
      ENTRIES: '/export/entries',
      STORYBOOK_DOWNLOAD: (id: string) => `/export/storybook/${id}/download`,
    },
    UPLOAD: {
      UPLOAD: '/upload',
      DELETE: (publicId: string) => `/upload/${encodeURIComponent(publicId)}`,
    },
    WELLNESS: {
      CHECKINS: '/wellness/checkins',
      CHECKIN_TODAY: '/wellness/checkins/today',
      HABITS: '/wellness/habits',
      HABITS_TODAY: '/wellness/habits/today',
      GRATITUDE: '/wellness/gratitude',
      GRATITUDE_RANDOM: '/wellness/gratitude/random',
      GRATITUDE_DELETE: (id: string) => `/wellness/gratitude/${id}`,
      FAVORITE: (id: string) => `/wellness/favorites/${id}`,
      PIN: (id: string) => `/wellness/pins/${id}`,
      HAPPY_BOX: '/wellness/happy-box',
      INSIGHTS: (range: string = 'month') => `/wellness/insights?range=${range}`,
      CALM_SESSION: '/wellness/calm-sessions',
      SELF_CHECK: '/wellness/self-checks',
      COUNSELOR_SHARE: '/wellness/counselor-share',
      COUNSELOR_SHARED_VIEW: (token: string) => `/wellness/shared/${encodeURIComponent(token)}`,
      YEAR_PIXELS: (year?: number) => `/wellness/year-pixels${year ? `?year=${year}` : ''}`,
      MOOD_DAYS: (from?: string, to?: string) => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const q = params.toString();
        return `/wellness/mood-days${q ? `?${q}` : ''}`;
      },
      HOME_SUMMARY: '/wellness/home-summary',
      COPING_PLAN: '/wellness/coping-plan',
    },
    LETTERS: {
      BASE: '/letters',
      DUE: '/letters/due',
      DETAIL: (id: string) => `/letters/${id}`,
    },
    STUDENT: {
      EXAMS: '/student/exams',
      EXAM_DELETE: (id: string) => `/student/exams/${id}`,
      STUDY_SESSION: '/student/study-session',
      STUDY_STATS: '/student/study-stats',
      BURNOUT_STATUS: '/student/burnout-status',
      SMALL_WINS: '/student/small-wins',
    },
    HEALTH: '/health',
  },
};

export const getAuthHeaders = (): Record<string, string> => {
  const authData = localStorage.getItem(AUTH_KEY);
  if (!authData) return {};

  try {
    const { token } = JSON.parse(authData);
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return {};
  }
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  token?: string;
  user?: User;
  settings?: UserSettings;
  [key: string]: unknown;
}

export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const defaultOptions: RequestInit = {
    headers,
    credentials: 'include',
  };

  const config = { ...defaultOptions, ...options };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: { message?: string; error?: string; code?: string } = {};
      try {
        errorData = (await response.json()) as { message?: string; error?: string; code?: string };
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      const errorCode = errorData.code;

      // On 401 response: ONLY clear auth & redirect if token is explicitly invalid or expired
      // Never wipe drafts or session on wrong PIN, wrong password, or other 401s (BAD_CREDENTIALS)
      // Never redirect from crisis/coping-plan calls
      const isTokenInvalid = errorCode === 'TOKEN_INVALID' || errorCode === 'TOKEN_EXPIRED';
      if (response.status === 401 && isTokenInvalid && !endpoint.includes('/coping-plan')) {
        clearAppStorage({ preserveDrafts: true });
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }

      const detailedMessage = [errorData.message, errorData.error]
        .filter(Boolean)
        .join(' - ');

      let userFacingMessage = detailedMessage || `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 503 || errorCode === 'SERVICE_UNAVAILABLE') {
        userFacingMessage = 'Server is waking up. Please give it a few moments and try again.';
      }

      const err = new Error(userFacingMessage);
      (err as unknown as { status?: number }).status = response.status;
      if (errorCode) {
        (err as unknown as { code?: string }).code = errorCode;
      }
      if ((errorData as Record<string, unknown>).attemptsRemaining !== undefined) {
        (err as unknown as { attemptsRemaining?: number }).attemptsRemaining = (errorData as Record<string, unknown>).attemptsRemaining as number;
      }
      if ((errorData as Record<string, unknown>).lockedSeconds !== undefined) {
        (err as unknown as { lockedSeconds?: number }).lockedSeconds = (errorData as Record<string, unknown>).lockedSeconds as number;
      }
      if ((errorData as Record<string, unknown>).safety) {
        (err as unknown as { safety: unknown }).safety = (errorData as Record<string, unknown>).safety;
      }
      if ((errorData as Record<string, unknown>).excludedCount !== undefined) {
        (err as unknown as { excludedCount: unknown }).excludedCount = (errorData as Record<string, unknown>).excludedCount;
      }
      throw err;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as ApiResponse<T>;
    }

    return (await response.text()) as unknown as ApiResponse<T>;
  } catch (error) {
    console.error('API Request Error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('Network request failed')) {
        const netErr = new Error('Server is waking up. Please give it a few moments and try again.');
        (netErr as unknown as { status?: number }).status = 503;
        (netErr as unknown as { code?: string }).code = 'SERVICE_UNAVAILABLE';
        throw netErr;
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};
