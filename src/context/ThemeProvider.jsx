// @ts-check
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useStore } from '../state/store.js';

const ThemeContext = createContext({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {}
});

function resolveTheme(theme) {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(resolved) {
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
}

/**
 * Theme provider. Settings.theme is one of 'light' | 'dark' | 'system'.
 * The inline script in index.html pre-applies the theme to avoid FOUC; this
 * provider re-applies it and keeps it in sync when the OS scheme changes.
 */
export function ThemeProvider({ children }) {
  const theme = useStore((s) => s.settings.theme);
  const setTheme = useStore((s) => s.setSettings);

  const resolved = useMemo(() => resolveTheme(theme), [theme]);

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    if (theme !== 'system') return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(resolveTheme('system'));
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme: resolved, setTheme: (t) => setTheme({ theme: t }) }),
    [theme, resolved, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}