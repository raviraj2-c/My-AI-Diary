import { FutureLetterItem } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export class LetterService {
  static async createLetter(data: { title: string; content: string; deliverOn: string }): Promise<{
    letter: FutureLetterItem;
    safety?: { level: 'none' | 'concern' | 'high' };
  }> {
    const res = await apiRequest<FutureLetterItem>(API_CONFIG.ENDPOINTS.LETTERS.BASE, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save letter');
    }
    return {
      letter: res.data,
      safety: (res as Record<string, unknown>).safety as { level: 'none' | 'concern' | 'high' } | undefined
    };
  }

  static async getLetters(): Promise<FutureLetterItem[]> {
    const res = await apiRequest<FutureLetterItem[]>(API_CONFIG.ENDPOINTS.LETTERS.BASE);
    return res.data || [];
  }

  static async getDueLetters(): Promise<Array<{ _id: string; title: string; deliverOn: string | Date }>> {
    const res = await apiRequest<Array<{ _id: string; title: string; deliverOn: string | Date }>>(
      API_CONFIG.ENDPOINTS.LETTERS.DUE
    );
    return res.data || [];
  }

  static async getLetter(id: string): Promise<FutureLetterItem> {
    const res = await apiRequest<FutureLetterItem>(API_CONFIG.ENDPOINTS.LETTERS.DETAIL(id));
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to open letter');
    }
    return res.data;
  }

  static async deleteLetter(id: string): Promise<void> {
    const res = await apiRequest(API_CONFIG.ENDPOINTS.LETTERS.DETAIL(id), {
      method: 'DELETE'
    });
    if (!res.success) {
      throw new Error(res.message || 'Failed to delete letter');
    }
  }
}
