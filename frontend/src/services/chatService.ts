import { apiRequest, API_CONFIG } from '../config/api';
import { ChatMessage, UsedDiaryEntry, AskDiaryResponse } from '../types';

export type ChatMode = 'general' | 'diary';

interface GeneralChatApiResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  quotaRemaining?: number;
}

interface AskDiaryApiResponse {
  answer: string;
  usedEntries: UsedDiaryEntry[];
  usedEntryIds: string[];
  quotaRemaining?: number;
}

export class ChatService {
  static async getMessages(mode: ChatMode = 'general'): Promise<ChatMessage[]> {
    if (mode === 'diary') {
      const res = await apiRequest<ChatMessage[]>(API_CONFIG.ENDPOINTS.AI.ASK_DIARY_HISTORY);
      return Array.isArray(res.data) ? res.data : [];
    }
    const res = await apiRequest<ChatMessage[]>(API_CONFIG.ENDPOINTS.CHAT.MESSAGES);
    return Array.isArray(res.data) ? res.data : [];
  }

  static async sendMessage(
    message: string,
    mode: ChatMode = 'general',
    options?: { attachCheckIn?: boolean }
  ): Promise<{
    userMessage?: ChatMessage;
    assistantMessage?: ChatMessage;
    safety: { level: 'none' | 'concern' | 'high' };
    quotaRemaining?: number;
    blocked?: boolean;
    diaryResult?: AskDiaryResponse;
  }> {
    if (mode === 'diary') {
      const res = await apiRequest<AskDiaryApiResponse>(API_CONFIG.ENDPOINTS.AI.ASK_DIARY, {
        method: 'POST',
        body: JSON.stringify({ question: message })
      });
      const safetyLevel = ((res as { safety?: { level?: string } }).safety?.level || 'none') as 'none' | 'concern' | 'high';
      const payload = res.data!;
      return {
        safety: { level: safetyLevel },
        quotaRemaining: payload.quotaRemaining,
        diaryResult: {
          answer: payload.answer,
          usedEntries: payload.usedEntries || [],
          usedEntryIds: payload.usedEntryIds || [],
          quotaRemaining: payload.quotaRemaining
        }
      };
    }

    const res = await apiRequest<GeneralChatApiResponse>(API_CONFIG.ENDPOINTS.CHAT.MESSAGES, {
      method: 'POST',
      body: JSON.stringify({ message, attachCheckIn: Boolean(options?.attachCheckIn) })
    });
    const safetyLevel = ((res as { safety?: { level?: string } }).safety?.level || 'none') as 'none' | 'concern' | 'high';
    const payload = res.data!;
    return {
      userMessage: payload.userMessage,
      assistantMessage: payload.assistantMessage,
      safety: { level: safetyLevel },
      quotaRemaining: payload.quotaRemaining,
      blocked: Boolean((res as { blocked?: boolean }).blocked)
    };
  }

  static async clearMessages(mode: ChatMode = 'general'): Promise<void> {
    if (mode === 'diary') {
      await apiRequest(API_CONFIG.ENDPOINTS.AI.ASK_DIARY_HISTORY, { method: 'DELETE' });
      return;
    }
    await apiRequest(API_CONFIG.ENDPOINTS.CHAT.MESSAGES, { method: 'DELETE' });
  }
}
