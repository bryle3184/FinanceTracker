// @ts-check
import { useEffect, useState } from 'react';

/**
 * Reactive media query hook. Returns true when `query` matches. Works in
 * SSR-less Vite SPA context via window.matchMedia.
 * @param {string} query e.g. '(max-width: 767px)'
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches); // sync in case of hydration
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}