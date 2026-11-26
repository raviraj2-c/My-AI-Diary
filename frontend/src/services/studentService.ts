import { ExamItem, StudyStats, BurnoutStatus, SmallWinTask } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';
import { getTodayDateKey } from '../utils/dates';

export class StudentService {
  static async getExams(): Promise<ExamItem[]> {
    const res = await apiRequest<ExamItem[]>(API_CONFIG.ENDPOINTS.STUDENT.EXAMS);
    return res.data || [];
  }

  static async addExam(exam: { subject: string; date: string; notes?: string }): Promise<ExamItem> {
    const res = await apiRequest<ExamItem>(API_CONFIG.ENDPOINTS.STUDENT.EXAMS, {
      method: 'POST',
      body: JSON.stringify(exam)
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save exam');
    }
    return res.data;
  }

  static async deleteExam(id: string): Promise<void> {
    const res = await apiRequest(API_CONFIG.ENDPOINTS.STUDENT.EXAM_DELETE(id), {
      method: 'DELETE'
    });
    if (!res.success) {
      throw new Error(res.message || 'Failed to delete exam');
    }
  }

  static async logStudySession(durationMinutes: number, technique = 'pomodoro-25'): Promise<void> {
    const res = await apiRequest(API_CONFIG.ENDPOINTS.STUDENT.STUDY_SESSION, {
      method: 'POST',
      body: JSON.stringify({ durationMinutes, technique })
    });
    if (!res.success) {
      throw new Error(res.message || 'Failed to log study session');
    }
  }

  static async getStudyStats(): Promise<StudyStats> {
    const res = await apiRequest<StudyStats>(API_CONFIG.ENDPOINTS.STUDENT.STUDY_STATS);
    return res.data || { todayMinutes: 0, weekMinutes: 0, totalSessions: 0, recentSessions: [] };
  }

  static async getBurnoutStatus(): Promise<BurnoutStatus> {
    const res = await apiRequest<{
      warning?: boolean;
      status?: string;
      code?: 'BURNOUT_WARNING' | 'BURNOUT_SAFE';
      params?: { highStressDays: number; avgSleepHours: number };
      message?: string;
      highStressDays?: number;
      avgSleepHours?: number;
      avgSleep?: number;
    }>(API_CONFIG.ENDPOINTS.STUDENT.BURNOUT_STATUS);
    const d = res.data || {};
    const isWarning = Boolean(d.warning || d.status === 'notice');
    return {
      warning: isWarning,
      status: isWarning ? 'notice' : 'safe',
      code: d.code || (isWarning ? 'BURNOUT_WARNING' : 'BURNOUT_SAFE'),
      params: d.params || {
        highStressDays: d.highStressDays || 0,
        avgSleepHours: d.avgSleepHours ?? d.avgSleep ?? 7
      },
      message: d.message || '',
      highStressDays: d.highStressDays || 0,
      avgSleep: d.avgSleepHours ?? d.avgSleep ?? 7,
      avgSleepHours: d.avgSleepHours ?? d.avgSleep ?? 7
    };
  }

  static async getSmallWins(dateKey?: string): Promise<SmallWinTask[]> {
    const key = dateKey || getTodayDateKey();
    const res = await apiRequest<{ tasks: SmallWinTask[] }>(`${API_CONFIG.ENDPOINTS.STUDENT.SMALL_WINS}?date=${key}`);
    return res.data?.tasks || [];
  }

  static async saveSmallWins(tasks: SmallWinTask[], dateKey?: string): Promise<SmallWinTask[]> {
    const key = dateKey || getTodayDateKey();
    const res = await apiRequest<{ tasks: SmallWinTask[] }>(API_CONFIG.ENDPOINTS.STUDENT.SMALL_WINS, {
      method: 'POST',
      body: JSON.stringify({ tasks, dateKey: key })
    });
    return res.data?.tasks || [];
  }
}
