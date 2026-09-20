// @ts-check
import { createContext, useContext, useMemo } from 'react';
import { useStore, useResolvedMonth, useNavMonth } from '../state/store.js';
import { addMonths } from '../lib/date.js';

const MonthContext = createContext({
  monthKey: '',
  setMonthKey: () => {},
  navMonth: () => {}
});

/**
 * Current-view month context. Backed by the store's `ui.selectedMonth`
 * (null => current month). Components call `navMonth(±1)` to move between
 * months; month keys are `'YYYY-MM'` strings.
 */
export function MonthProvider({ children }) {
  const resolved = useResolvedMonth();
  const setSelectedMonth = useStore((s) => s.setSelectedMonth);
  const navMonth = useNavMonth();

  const value = useMemo(
    () => ({
      monthKey: resolved,
      setMonthKey: setSelectedMonth,
      navMonth
    }),
    [resolved, setSelectedMonth, navMonth]
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonthContext() {
  return useContext(MonthContext);
}

/** Helper: month key shifted by `delta` months from `from` (default context month). */
export function shiftedMonthKey(from, delta) {
  return addMonths(from, delta); // addMonths already returns 'YYYY-MM'
}