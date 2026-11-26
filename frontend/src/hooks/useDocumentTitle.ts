import { useEffect } from 'react';

export function useDocumentTitle(title?: string, suffix = 'MindDiary'): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = title ? `${title} | ${suffix}` : suffix;
  }, [title, suffix]);
}
