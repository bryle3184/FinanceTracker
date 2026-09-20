// @ts-check
import { useMemo } from 'react';
import { useStore, useResolvedMonth } from './store.js';
import {
  monthlyTotals,
  monthlySeries,
  categoryBreakdown,
  momComparison,
  savingsRate,
  savingsRateTrend,
  detectAnomalies,
  budgetStatus,
  projectRecurring,
  billsDue,
  computeSettlements,
  netWorthSeries,
  assetAllocation,
  goalProgress
} from '../lib/analytics/index.js';
import { todayISO } from '../lib/date.js';

/**
 * Selection hooks. Each re-runs a pure analytics function against the live store
 * via useMemo keyed on the exact slices it reads, so components subscribe to the
 * narrowest shape and never recompute on unrelated writes.
 */

/** Resolved month key for the current view (never null). */
export function useMonth() {
  return useResolvedMonth();
}

/** Resolved month + setter, for month navigation. */
export function useSetMonth() {
  return useStore((s) => s.setSelectedMonth);
}

export function useMonthlyTotals(monthKeyStr = useResolvedMonth()) {
  const transactions = useStore((s) => s.transactions);
  return useMemo(() => monthlyTotals(transactions, monthKeyStr), [transactions, monthKeyStr]);
}

export function useCategoryBreakdown(monthKeyStr = useResolvedMonth(), kind = 'expense') {
  const transactions = useStore((s) => s.transactions);
  return useMemo(
    () => categoryBreakdown(transactions, monthKeyStr, kind),
    [transactions, monthKeyStr, kind]
  );
}

export function useMonthlySeries(startMonth, endMonth) {
  const transactions = useStore((s) => s.transactions);
  return useMemo(
    () => monthlySeries(transactions, startMonth, endMonth),
    [transactions, startMonth, endMonth]
  );
}

export function useMomComparison(monthKeyStr = useResolvedMonth()) {
  const transactions = useStore((s) => s.transactions);
  return useMemo(() => momComparison(transactions, monthKeyStr), [transactions, monthKeyStr]);
}

export function useSavingsRate(monthKeyStr = useResolvedMonth()) {
  const transactions = useStore((s) => s.transactions);
  const { incomeCents, expenseCents } = useMemo(
    () => monthlyTotals(transactions, monthKeyStr),
    [transactions, monthKeyStr]
  );
  return useMemo(() => savingsRate(incomeCents, expenseCents), [incomeCents, expenseCents]);
}

export function useSavingsRateTrend(months = 6) {
  const transactions = useStore((s) => s.transactions);
  return useMemo(
    () => savingsRateTrend(transactions, months, useResolvedMonth()),
    [transactions, months]
  );
}

export function useAnomalies(monthKeyStr = useResolvedMonth(), opts) {
  const transactions = useStore((s) => s.transactions);
  return useMemo(
    () => detectAnomalies(transactions, monthKeyStr, opts),
    [transactions, monthKeyStr, opts]
  );
}

export function useBudgetStatus(monthKeyStr = useResolvedMonth()) {
  const budgets = useStore((s) => s.budgets);
  const transactions = useStore((s) => s.transactions);
  return useMemo(
    () => budgetStatus(budgets, transactions, monthKeyStr),
    [budgets, transactions, monthKeyStr]
  );
}

/** All upcoming recurring occurrences in the next `horizon` days. */
export function useUpcomingRecurring(horizon = 30) {
  const recurring = useStore((s) => s.recurring);
  const now = todayISO();
  return useMemo(() => projectRecurring(recurring, now, horizon), [recurring, now, horizon]);
}

/** Bills (expense recurring) due within `days` days. */
export function useBillsDue(days = 7) {
  const recurring = useStore((s) => s.recurring);
  const now = todayISO();
  return useMemo(() => billsDue(recurring, now, days), [recurring, now, days]);
}

/** Settlement computation over a month range. `range` is `{from,to}` month keys. */
export function useSettlements(range) {
  const transactions = useStore((s) => s.transactions);
  const members = useStore((s) => s.members);
  return useMemo(
    () => computeSettlements(transactions, members, range),
    [transactions, members, range]
  );
}

/** Monthly net-worth series (sorted by monthKey, upserted snapshots only). */
export function useNetWorthSeries() {
  const netWorth = useStore((s) => s.netWorth);
  return useMemo(() => netWorthSeries(netWorth), [netWorth]);
}

export function useNetWorthAllocation(snapshot) {
  return useMemo(() => assetAllocation(snapshot), [snapshot]);
}

export function useGoalProgress(goal) {
  return useMemo(() => goalProgress(goal), [goal]);
}