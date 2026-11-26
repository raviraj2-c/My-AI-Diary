import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WellnessService } from '../services/wellnessService';
import { DiaryService } from '../services/diaryService';

export const STALE_TIME_MS = 60 * 1000;

export const queryKeys = {
  homeSummary: ['homeSummary'] as const,
  moodDays: (from?: string, to?: string) => ['moodDays', from ?? '', to ?? ''] as const,
  entries: (page: number, startDate?: string, endDate?: string) =>
    ['entries', page, startDate ?? '', endDate ?? ''] as const,
  calendarMonth: (month: string) => ['calendarMonth', month] as const,
  today: ['today'] as const,
  insights: (range: 'week' | 'month' | '3months') => ['insights', range] as const,
  happyBox: ['happyBox'] as const,
  yearPixels: (year: number) => ['yearPixels', year] as const,
  copingPlan: ['copingPlan'] as const
};

export function useHomeSummary() {
  return useQuery({
    queryKey: queryKeys.homeSummary,
    queryFn: () => WellnessService.getHomeSummary(),
    staleTime: STALE_TIME_MS
  });
}

export function useMoodDays(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.moodDays(from, to),
    queryFn: () => WellnessService.getMoodDays(from, to),
    staleTime: STALE_TIME_MS
  });
}

export function useEntries(page = 1, filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.entries(page, filters?.startDate, filters?.endDate),
    queryFn: async () => {
      if (filters?.startDate && filters?.endDate) {
        const entries = await DiaryService.searchEntriesAsync({
          dateRange: { start: new Date(filters.startDate), end: new Date(filters.endDate) }
        });
        return { entries, total: entries.length, pages: 1, page: 1 };
      }
      return DiaryService.fetchEntries(page, 20);
    },
    staleTime: STALE_TIME_MS
  });
}

export function useCalendarMonth(month: string) {
  return useQuery({
    queryKey: queryKeys.calendarMonth(month),
    queryFn: () => DiaryService.getCalendarMonth(month),
    enabled: /^\d{4}-\d{2}$/.test(month),
    staleTime: STALE_TIME_MS
  });
}

export function useToday() {
  return useQuery({
    queryKey: queryKeys.today,
    queryFn: async () => {
      const [checkIn, habit] = await Promise.all([
        WellnessService.getTodayCheckIn().catch(() => null),
        WellnessService.getTodayHabit().catch(() => null)
      ]);
      return { checkIn, habit };
    },
    staleTime: STALE_TIME_MS
  });
}

export function useInsights(range: 'week' | 'month' | '3months') {
  return useQuery({
    queryKey: queryKeys.insights(range),
    queryFn: () => WellnessService.getInsights(range),
    staleTime: STALE_TIME_MS
  });
}

export function useHappyBox() {
  return useQuery({
    queryKey: queryKeys.happyBox,
    queryFn: () => WellnessService.getHappyBox(),
    staleTime: STALE_TIME_MS
  });
}

export function useYearPixels(year: number) {
  return useQuery({
    queryKey: queryKeys.yearPixels(year),
    queryFn: () => WellnessService.getYearPixels(year),
    staleTime: STALE_TIME_MS
  });
}

export function useCopingPlan(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.copingPlan,
    queryFn: () => WellnessService.getCopingPlan(),
    enabled,
    staleTime: 5 * 60 * 1000
  });
}

export function useInvalidateWellness() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.homeSummary }),
      queryClient.invalidateQueries({ queryKey: ['moodDays'] }),
      queryClient.invalidateQueries({ queryKey: ['entries'] }),
      queryClient.invalidateQueries({ queryKey: ['calendarMonth'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.today }),
      queryClient.invalidateQueries({ queryKey: ['insights'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.happyBox }),
      queryClient.invalidateQueries({ queryKey: ['yearPixels'] })
    ]);
  }, [queryClient]);
}
