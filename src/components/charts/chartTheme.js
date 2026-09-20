// @ts-check
/**
 * Recharts theme: resolves current CSS custom property values at render time so
 * charts pick up light/dark theme changes without a hardcode. Cheap enough.
 */

export function cssVar(name, fallback) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Fresh theme snapshot for a chart render. */
export function chartTheme() {
  return {
    grid: cssVar('--chart-grid', '#e2e8f0'),
    tick: cssVar('--chart-tick', '#8a99b3'),
    text: cssVar('--text', '#0f1b2d'),
    axis: cssVar('--border-strong', '#cbd5e1'),
    bg: cssVar('--bg-elevated', '#ffffff'),
    border: cssVar('--border', '#e2e8f0')
  };
}