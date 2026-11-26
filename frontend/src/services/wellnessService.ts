import { CheckIn, HabitLog, GratitudeEntry, WellnessInsights, DiaryEntry, CalmSession, SelfCheckResult, CounselorReportSummary, YearPixelsData, CopingPlanData } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';
import { getTodayDateKey } from '../utils/dates';

export class WellnessService {
  // --- Check-Ins ---
  static async saveCheckIn(data: Partial<CheckIn> & { dateKey?: string }): Promise<CheckIn> {
    const payload = {
      dateKey: getTodayDateKey(),
      ...data
    };
    const res = await apiRequest<CheckIn>(API_CONFIG.ENDPOINTS.WELLNESS.CHECKINS, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save check-in');
    }
    const saved = res.data;
    if (res.safety) {
      (saved as CheckIn & { safety?: { level: 'none' | 'concern' | 'high' } }).safety = res.safety as { level: 'none' | 'concern' | 'high' };
    }
    return saved;
  }

  static async getCheckIns(startDate?: string, endDate?: string, limit = 60): Promise<CheckIn[]> {
    let query = `?limit=${limit}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;

    const res = await apiRequest<CheckIn[]>(`${API_CONFIG.ENDPOINTS.WELLNESS.CHECKINS}${query}`);
    return res.data || [];
  }

  static async getTodayCheckIn(): Promise<CheckIn | null> {
    const res = await apiRequest<CheckIn | null>(API_CONFIG.ENDPOINTS.WELLNESS.CHECKIN_TODAY);
    return res.data || null;
  }

  // --- Habits ---
  static async saveHabitLog(data: Partial<HabitLog> & { dateKey?: string }): Promise<HabitLog> {
    const payload = {
      dateKey: getTodayDateKey(),
      ...data
    };
    const res = await apiRequest<HabitLog>(API_CONFIG.ENDPOINTS.WELLNESS.HABITS, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to update habit log');
    }
    return res.data;
  }

  static async getHabits(startDate?: string, endDate?: string): Promise<HabitLog[]> {
    let query = '';
    if (startDate || endDate) {
      query = `?startDate=${startDate || ''}&endDate=${endDate || ''}`;
    }
    const res = await apiRequest<HabitLog[]>(`${API_CONFIG.ENDPOINTS.WELLNESS.HABITS}${query}`);
    return res.data || [];
  }

  static async getTodayHabit(): Promise<HabitLog | null> {
    const res = await apiRequest<HabitLog | null>(API_CONFIG.ENDPOINTS.WELLNESS.HABITS_TODAY);
    return res.data || null;
  }

  // --- Gratitude ---
  static async saveGratitude(items: string[], date?: Date, dateKey?: string): Promise<GratitudeEntry> {
    const payload = {
      items,
      date,
      dateKey: dateKey || getTodayDateKey()
    };
    const res = await apiRequest<GratitudeEntry>(API_CONFIG.ENDPOINTS.WELLNESS.GRATITUDE, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save gratitude moments');
    }
    return res.data;
  }

  static async getGratitudeEntries(limit = 50): Promise<GratitudeEntry[]> {
    const res = await apiRequest<GratitudeEntry[]>(`${API_CONFIG.ENDPOINTS.WELLNESS.GRATITUDE}?limit=${limit}`);
    return res.data || [];
  }

  static async getRandomGratitude(): Promise<{ item: string; date: string } | null> {
    const res = await apiRequest<{ item: string; date: string } | null>(API_CONFIG.ENDPOINTS.WELLNESS.GRATITUDE_RANDOM);
    return res.data || null;
  }

  static async deleteGratitude(id: string): Promise<void> {
    const res = await apiRequest(API_CONFIG.ENDPOINTS.WELLNESS.GRATITUDE_DELETE(id), {
      method: 'DELETE'
    });
    if (!res.success) {
      throw new Error(res.message || 'Failed to delete gratitude entry');
    }
  }

  // --- Favorites & Happy Box ---
  static async toggleFavorite(id: string): Promise<boolean> {
    const res = await apiRequest<{ isFavorite: boolean }>(API_CONFIG.ENDPOINTS.WELLNESS.FAVORITE(id), {
      method: 'POST'
    });
    return Boolean(res.isFavorite);
  }

  static async togglePin(id: string): Promise<boolean> {
    const res = await apiRequest<{ isPinned: boolean }>(API_CONFIG.ENDPOINTS.WELLNESS.PIN(id), {
      method: 'POST'
    });
    return Boolean(res.isPinned);
  }

  static async getHappyBox(): Promise<{
    favorites: DiaryEntry[];
    mediaMemories: DiaryEntry[];
    onThisDay: DiaryEntry[];
  }> {
    const res = await apiRequest<{
      favorites: DiaryEntry[];
      mediaMemories: DiaryEntry[];
      onThisDay: DiaryEntry[];
    }>(API_CONFIG.ENDPOINTS.WELLNESS.HAPPY_BOX);

    return res.data || { favorites: [], mediaMemories: [], onThisDay: [] };
  }

  // --- Insights ---
  static async getInsights(range: 'week' | 'month' | '3months' = 'month'): Promise<WellnessInsights> {
    const res = await apiRequest<WellnessInsights>(API_CONFIG.ENDPOINTS.WELLNESS.INSIGHTS(range));
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch insights');
    }
    return res.data;
  }

  // --- Calm Sessions ---
  static async logCalmSession(session: Partial<CalmSession>): Promise<CalmSession | null> {
    try {
      const res = await apiRequest<CalmSession>(API_CONFIG.ENDPOINTS.WELLNESS.CALM_SESSION, {
        method: 'POST',
        body: JSON.stringify(session)
      });
      return res.data || null;
    } catch {
      // Optional logging - safe failure
      return null;
    }
  }

  // --- Self-Checks (PHQ-9, GAD-7) ---
  static async saveSelfCheck(result: Omit<SelfCheckResult, 'id'>): Promise<SelfCheckResult | null> {
    const res = await apiRequest<SelfCheckResult>(API_CONFIG.ENDPOINTS.WELLNESS.SELF_CHECK, {
      method: 'POST',
      body: JSON.stringify(result)
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save self-check result');
    }
    return res.data;
  }

  static async getSelfChecks(type?: 'PHQ-9' | 'GAD-7'): Promise<SelfCheckResult[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    const res = await apiRequest<SelfCheckResult[]>(`${API_CONFIG.ENDPOINTS.WELLNESS.SELF_CHECK}${query}`);
    return res.data || [];
  }

  // --- Counselor Summary Sharing ---
  static async createCounselorShare(range: 'week' | 'month' | '3months' = 'month'): Promise<{
    token: string;
    sharePath: string;
    expiresAt: string;
  }> {
    const res = await apiRequest<{ token: string; sharePath: string; expiresAt: string }>(
      API_CONFIG.ENDPOINTS.WELLNESS.COUNSELOR_SHARE,
      {
        method: 'POST',
        body: JSON.stringify({ range })
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to generate counselor report');
    }
    return res.data;
  }

  static async getSharedCounselorReport(token: string): Promise<{
    data: CounselorReportSummary;
    expiresAt: string;
  }> {
    const res = await apiRequest<CounselorReportSummary>(API_CONFIG.ENDPOINTS.WELLNESS.COUNSELOR_SHARED_VIEW(token));
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Report not found or has expired');
    }
    const expiresAt = (res as Record<string, unknown>).expiresAt as string || '';
    return { data: res.data, expiresAt };
  }

  static async revokeCounselorShare(token: string): Promise<void> {
    const res = await apiRequest(`${API_CONFIG.ENDPOINTS.WELLNESS.COUNSELOR_SHARE}/${encodeURIComponent(token)}`, {
      method: 'DELETE'
    });
    if (!res.success) {
      throw new Error(res.message || 'Failed to revoke link');
    }
  }

  // --- Year in Pixels ---
  static async getYearPixels(year?: number): Promise<YearPixelsData> {
    const res = await apiRequest<YearPixelsData>(API_CONFIG.ENDPOINTS.WELLNESS.YEAR_PIXELS(year));
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch year in pixels');
    }
    return res.data;
  }

  // --- Personal Safety Coping Plan ---
  static async getCopingPlan(): Promise<CopingPlanData> {
    const res = await apiRequest<CopingPlanData>(API_CONFIG.ENDPOINTS.WELLNESS.COPING_PLAN);
    if (!res.success || !res.data) {
      return {
        warningSigns: [],
        copingStrategies: [],
        peopleToContact: [],
        safePlaces: [],
        reasonsToKeepGoing: []
      };
    }
    return res.data;
  }

  static async saveCopingPlan(data: Partial<CopingPlanData>): Promise<CopingPlanData> {
    const res = await apiRequest<CopingPlanData>(API_CONFIG.ENDPOINTS.WELLNESS.COPING_PLAN, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save coping plan');
    }
    return res.data;
  }

  static async getMoodDays(from?: string, to?: string): Promise<Array<{ date: string; score: number; source: 'checkin' | 'entry'; emotions: string[] }>> {
    const res = await apiRequest<Array<{ date: string; score: number; source: 'checkin' | 'entry'; emotions: string[] }>>(
      API_CONFIG.ENDPOINTS.WELLNESS.MOOD_DAYS(from, to)
    );
    if (!res.success || !Array.isArray(res.data)) {
      throw new Error(res.message || 'Failed to fetch mood days');
    }
    return res.data;
  }

  static async getHomeSummary(): Promise<{
    todayDone: boolean;
    todayScore: number | null;
    weekDays: Array<{ date: string; score: number | null }>;
    streakDays: number;
    lastEntry: { id: string; title: string; date: string; mood: string } | null;
    dueLetters: number;
  }> {
    const res = await apiRequest<{
      todayDone: boolean;
      todayScore: number | null;
      weekDays: Array<{ date: string; score: number | null }>;
      streakDays: number;
      lastEntry: { id: string; title: string; date: string; mood: string } | null;
      dueLetters: number;
    }>(API_CONFIG.ENDPOINTS.WELLNESS.HOME_SUMMARY);
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to fetch home summary');
    }
    return res.data;
  }
}
