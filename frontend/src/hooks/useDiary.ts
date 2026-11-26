import { useDiaryContext } from '../contexts/DiaryContext';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useDiary = (_userId?: string) => {
  return useDiaryContext();
};
