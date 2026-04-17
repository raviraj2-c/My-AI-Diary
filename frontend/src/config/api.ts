const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const API_CONFIG = {
  // Always point to your backend server (port 5000)
  BASE_URL: 'https://ai-diary-e2xo.onrender.com/api',
  
  TIMEOUT: 30000,  
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
      FORGOT_PASSWORD: '/auth/forgot-password',
      SETTINGS: '/auth/settings',
    },
    DIARY: {
      ENTRIES: '/diary/entries',
      ENTRY: (id: string) => `/diary/entries/${id}`,
      TAGS: '/diary/tags',
      STATS: '/diary/stats',
    },
    AI: {
      GENERATE_STORYBOOK: '/ai/generate-storybook',
      STORYBOOKS: '/ai/storybooks',
      STORYBOOK: (id: string) => `/ai/storybooks/${id}`,
    },
    EXPORT: {
      ENTRIES: '/export/entries',
      STORYBOOK_DOWNLOAD: (id: string) => `/export/storybook/${id}/download`,
    },
    HEALTH: '/health',
  },
};

export const getAuthHeaders = (): Record<string, string> => {
  const authData = localStorage.getItem('mydiary_auth');
  if (!authData) return {};
  
  try {
    const { token } = JSON.parse(authData);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return {};
  }
};

export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  console.log('Making request to:', url);
  
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
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      const detailedMessage = [errorData.message, errorData.error]
        .filter(Boolean)
        .join(' - ');
        
      throw new Error(detailedMessage || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API Request Error:', error);
    console.error('Request URL:', url);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};