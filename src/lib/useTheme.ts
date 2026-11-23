import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';

/** Theme is applied to <html data-theme>; index.html sets the initial value before first paint. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch { /* ignore */ }
      return next;
    });
  }, []);
  return [theme, toggle];
}
