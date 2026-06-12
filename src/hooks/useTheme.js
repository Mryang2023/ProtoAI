import { useState, useCallback } from 'react';

const THEME_KEY = 'protoai_theme';

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
        return saved;
      }
    } catch {}
    return 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch {}
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
