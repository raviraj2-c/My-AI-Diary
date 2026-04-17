import { DiaryEntry, StorybookExport } from '../types';
import { apiRequest, API_CONFIG } from '../config/api';

export class AIService {
  static async generateStorybook(
    entries: DiaryEntry[],
    theme: 'romantic' | 'dramatic' | 'adventure' | 'mystery' | 'comedy',
    timeframe: { start: Date; end: Date }
  ): Promise<StorybookExport> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AI.GENERATE_STORYBOOK, {
        method: 'POST',
        body: JSON.stringify({
          theme,
          startDate: timeframe.start.toISOString(),
          endDate: timeframe.end.toISOString(),
        }),
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to generate storybook');
      }

      return {
        id: data.data.id,
        title: data.data.title,
        theme: data.data.theme,
        timeframe: {
          start: new Date(data.data.timeframe.start),
          end: new Date(data.data.timeframe.end),
        },
        entries,
        generatedContent: data.data.generatedContent,
        createdAt: new Date(data.data.createdAt),
      };
    } catch (error) {
      console.error('Generate storybook error:', error);
      throw error;
    }
  }

  static async getStorybooks(): Promise<StorybookExport[]> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AI.STORYBOOKS);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch storybooks');
      }

      return data.data.map((storybook: any) => ({
        id: storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: new Date(storybook.timeframe.start),
          end: new Date(storybook.timeframe.end),
        },
        entries: storybook.entries || [],
        generatedContent: storybook.generatedContent || '',
        createdAt: new Date(storybook.createdAt),
      }));
    } catch (error) {
      console.error('Get storybooks error:', error);
      throw error;
    }
  }

  static async getStorybook(id: string): Promise<StorybookExport> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AI.STORYBOOK(id));

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch storybook');
      }

      const storybook = data.data;
      return {
        id: storybook._id,
        title: storybook.title,
        theme: storybook.theme,
        timeframe: {
          start: new Date(storybook.timeframe.start),
          end: new Date(storybook.timeframe.end),
        },
        entries: storybook.entries || [],
        generatedContent: storybook.generatedContent,
        createdAt: new Date(storybook.createdAt),
      };
    } catch (error) {
      console.error('Get storybook error:', error);
      throw error;
    }
  }

  static async deleteStorybook(id: string): Promise<void> {
    try {
      const data = await apiRequest(API_CONFIG.ENDPOINTS.AI.STORYBOOK(id), {
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
}