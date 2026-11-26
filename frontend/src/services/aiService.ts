import {
  DiaryEntry,
  StorybookExport,
  StorybookMetadata,
  StorybookGenerationOptions,
  AIReflection,
  AIMoodAnalysis,
  AIUsage,
  ChatMessage,
  ThoughtRecord,
  AskDiaryFilters,
  AskDiaryResponse
} from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

interface RawStorybook {
  _id: string;
  id?: string;
  title: string;
  theme: StorybookExport['theme'];
  timeframe: {
    start: string | Date;
    end: string | Date;
  };
  entries?: DiaryEntry[];
  generatedContent?: string;
  protagonist?: {
    name?: string;
    journey?: string;
  };
  chapterCount?: number;
  wordCount?: number;
  pageCount?: number;
  status?: string;
  chapters?: Array<{
    chapterNumber?: number;
    title: string;
    content: string;
  }>;
  createdAt: string | Date;
}

export class AIService {
  static async generateStorybook(
    entries: DiaryEntry[],
    theme: StorybookExport['theme'],
    timeframe: { start: Date; end: Date },
    options?: StorybookGenerationOptions | string
  ): Promise<StorybookExport> {
    try {
      const opts = typeof options === 'string'
        ? { protagonistNickname: options }
        : (options || {});

      const bodyPayload: Record<string, unknown> = {
        theme,
        startDate: timeframe.start.toISOString(),
        endDate: timeframe.end.toISOString(),
        protagonistNickname: opts.protagonistNickname,
        length: opts.length,
        language: opts.language,
        tone: opts.tone,
        entryIds: opts.entryIds
      };

      const data = await apiRequest<RawStorybook>(API_CONFIG.ENDPOINTS.AI.GENERATE_STORYBOOK, {
        method: 'POST',
        body: JSON.stringify(bodyPayload),
      });

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to generate storybook');
      }

      return {
        id: data.data.id || data.data._id,
        title: data.data.title,
        theme: data.data.theme,
        timeframe: {
          start: new Date(data.data.timeframe.start),
          end: new Date(data.data.timeframe.end),
        },
        entries,
        generatedContent: data.data.generatedContent || '',
        protagonist: data.data.protagonist,
        chapters: data.data.chapters || [],
        createdAt: new Date(data.data.createdAt),
        language: opts.language,
        safety: (data as unknown as { safety?: { level: 'none' | 'concern' | 'high' } }).safety,
        excludedCount: (data as unknown as { excludedCount?: number }).excludedCount,
      };
    } catch (error) {
      console.error('Generate storybook error:', error);
      throw error;
    }
  }

  static async getStorybooks(): Promise<StorybookMetadata[]> {
    try {
      const data = await apiRequest<RawStorybook[]>(API_CONFIG.ENDPOINTS.AI.STORYBOOKS);

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to fetch storybooks');
      }

      return data.data.map((storybook: RawStorybook) => ({
        id: storybook.id || storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: new Date(storybook.timeframe.start),
          end: new Date(storybook.timeframe.end),
        },
        protagonist: storybook.protagonist,
        chapterCount: storybook.chapterCount ?? (storybook.chapters ? storybook.chapters.length : 0),
        wordCount: storybook.wordCount,
        pageCount: storybook.pageCount,
        status: storybook.status,
        createdAt: new Date(storybook.createdAt),
      }));
    } catch (error) {
      console.error('Get storybooks error:', error);
      throw error;
    }
  }

  static async getStorybook(id: string): Promise<StorybookExport> {
    try {
      const data = await apiRequest<RawStorybook>(API_CONFIG.ENDPOINTS.AI.STORYBOOK(id));

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to fetch storybook');
      }

      const storybook = data.data;
      return {
        id: storybook.id || storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: new Date(storybook.timeframe.start),
          end: new Date(storybook.timeframe.end),
        },
        entries: storybook.entries || [],
        generatedContent: storybook.generatedContent || '',
        protagonist: storybook.protagonist,
        chapters: storybook.chapters || [],
        createdAt: new Date(storybook.createdAt),
      };
    } catch (error) {
      console.error('Get storybook error:', error);
      throw error;
    }
  }

  static async updateStorybook(
    id: string,
    updates: {
      title?: string;
      chapters?: Array<{ chapterNumber?: number; title: string; content: string }>;
    }
  ): Promise<StorybookExport> {
    try {
      const data = await apiRequest<RawStorybook>(API_CONFIG.ENDPOINTS.AI.STORYBOOK(id), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to update storybook');
      }

      const storybook = data.data;
      return {
        id: storybook.id || storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: new Date(storybook.timeframe.start),
          end: new Date(storybook.timeframe.end),
        },
        entries: storybook.entries || [],
        generatedContent: storybook.generatedContent || '',
        protagonist: storybook.protagonist,
        chapters: storybook.chapters || [],
        createdAt: new Date(storybook.createdAt),
      };
    } catch (error) {
      console.error('Update storybook error:', error);
      throw error;
    }
  }

  static async deleteStorybook(id: string): Promise<void> {
    try {
      const data = await apiRequest<{ message: string }>(API_CONFIG.ENDPOINTS.AI.STORYBOOK(id), {
        method: 'DELETE',
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to delete storybook');
      }
    } catch (error) {
      console.error('Delete storybook error:', error);
      throw error;
    }
  }

  // Gentle reflection under entry
  static async reflectOnEntry(content: string, mood?: string): Promise<AIReflection> {
    const res = await apiRequest<AIReflection>(API_CONFIG.ENDPOINTS.AI.REFLECT, {
      method: 'POST',
      body: JSON.stringify({ content, mood })
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Could not generate reflection');
    }
    return res.data;
  }

  // Emotional tone analyzer
  static async analyzeMood(text: string): Promise<AIMoodAnalysis> {
    const res = await apiRequest<AIMoodAnalysis>(API_CONFIG.ENDPOINTS.AI.ANALYZE_MOOD, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Could not analyze mood');
    }
    return res.data;
  }

  // CBT thought reframing
  static async challengeThought(params: {
    situation: string;
    thought: string;
    evidenceFor?: string;
    evidenceAgainst?: string;
  }): Promise<{ balancedThought: string; safety?: { level: string } }> {
    const res = await apiRequest<{ balancedThought: string; safety?: { level: string } }>(
      API_CONFIG.ENDPOINTS.AI.CHALLENGE_THOUGHT,
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Could not reframe thought');
    }
    return res.data;
  }

  // Writing starters helper
  static async getWritingStarters(prompt?: string): Promise<string[]> {
    const res = await apiRequest<{ starters: string[] }>(API_CONFIG.ENDPOINTS.AI.WRITING_STARTERS, {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });
    return res.data?.starters || [];
  }

  // AI Usage status
  static async getAIUsage(): Promise<AIUsage> {
    const res = await apiRequest<AIUsage>(API_CONFIG.ENDPOINTS.AI.USAGE);
    return res.data || { count: 0, limit: 30, remaining: 30, allowAIFeatures: false };
  }

  // Thought records (CBT)
  static async getThoughtRecords(): Promise<ThoughtRecord[]> {
    const res = await apiRequest<ThoughtRecord[]>(API_CONFIG.ENDPOINTS.AI.THOUGHTS);
    return res.data || [];
  }

  static async saveThoughtRecord(data: Partial<ThoughtRecord>): Promise<ThoughtRecord> {
    const res = await apiRequest<ThoughtRecord>(API_CONFIG.ENDPOINTS.AI.THOUGHTS, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to save thought record');
    }
    return res.data;
  }

  static async deleteThoughtRecord(id: string): Promise<void> {
    await apiRequest(API_CONFIG.ENDPOINTS.AI.THOUGHT(id), { method: 'DELETE' });
  }

  // Companion Chat
  static async getChatMessages(): Promise<ChatMessage[]> {
    const res = await apiRequest<ChatMessage[]>(API_CONFIG.ENDPOINTS.CHAT.MESSAGES);
    return res.data || [];
  }

  static async sendChatMessage(message: string, attachCheckIn: boolean = false): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    safety?: { level: string };
    quotaRemaining?: number;
  }> {
    const res = await apiRequest<{
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
      quotaRemaining?: number;
    }>(API_CONFIG.ENDPOINTS.CHAT.MESSAGES, {
      method: 'POST',
      body: JSON.stringify({ message, attachCheckIn })
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to send message to AI companion');
    }
    return {
      ...res.data,
      safety: (res as unknown as { safety?: { level: string } }).safety
    };
  }

  static async clearChat(): Promise<void> {
    await apiRequest(API_CONFIG.ENDPOINTS.CHAT.MESSAGES, { method: 'DELETE' });
  }

  // Ask My Diary (question-answering with entry attribution)
  static async askDiary(
    question: string,
    filters?: AskDiaryFilters
  ): Promise<AskDiaryResponse> {
    const res = await apiRequest<AskDiaryResponse>(API_CONFIG.ENDPOINTS.AI.ASK_DIARY, {
      method: 'POST',
      body: JSON.stringify({ question, ...filters })
    });
    if (!res.success || !res.data) {
      throw new Error(res.message || 'Failed to ask your diary');
    }
    const safetyObj = (res as unknown as { safety?: { level: 'none' | 'concern' | 'high' } }).safety;
    return {
      ...res.data,
      safetyLevel: safetyObj?.level,
      usedEntries: res.data.usedEntries || [],
      usedEntryIds: res.data.usedEntryIds || []
    };
  }

  static async getAskDiaryHistory(): Promise<Array<{
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    sources?: string[];
    createdAt: string | Date;
  }>> {
    const res = await apiRequest<Array<{
      id: string;
      sender: 'user' | 'assistant';
      content: string;
      sources?: string[];
      createdAt: string | Date;
    }>>(API_CONFIG.ENDPOINTS.AI.ASK_DIARY_HISTORY);
    return res.data || [];
  }

  static async clearAskDiaryHistory(): Promise<void> {
    await apiRequest(API_CONFIG.ENDPOINTS.AI.ASK_DIARY_HISTORY, { method: 'DELETE' });
  }
}
