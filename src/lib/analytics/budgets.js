// @ts-check
import { monthKey } from '../date.js';

/**
 * Compute the amount available for the current month's budget, including
 * carry-over from the previous month. Negative carry (overspend) carries
 * forward — surfaced in the UI rather than silently zeroed.
 *
 * @param {import('../../types.js').Budget[]} budgets
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} monthKeyStr 'YYYY-MM'
 * @param {string} categoryId
 * @param {object} [opts]
 * @param {number|null} [opts.manualCarryCents] persisted override, else computed
 * @returns {{limitCents:number, carryInCents:number, spentCents:number, availableCents:number, remainingCents:number}}
 */
export function rolloverFor(budgets, transactions, monthKeyStr, categoryId, opts = {}) {
  const budget = budgets.find((b) => b.monthKey === monthKeyStr && b.categoryId === categoryId);
  const limitCents = budget?.limitCents ?? 0;

  const spentCents = transactions.reduce((acc, tx) => {
    if (tx.type === 'expense' && monthKey(tx.date) === monthKeyStr && tx.categoryId === categoryId) {
      return acc + tx.amountCents;
    }
    return acc;
  }, 0);

  // carry-in = previous month's remaining = prev.limit + prev.carry - prev.spent
  const prev = budgets
    .filter((b) => b.categoryId === categoryId && b.monthKey < monthKeyStr)
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0];

  let carryInCents = 0;
  if (opts.manualCarryCents != null) {
    carryInCents = opts.manualCarryCents;
  } else if (prev) {
    const prevSpent = transactions.reduce((acc, tx) => {
      if (tx.type === 'expense' && monthKey(tx.date) === prev.monthKey && tx.categoryId === categoryId) {
        return acc + tx.amountCents;
      }
      return acc;
    }, 0);
    const prevCarry =
      prev.carryInCents != null
        ? prev.carryInCents
        : rolloverFor(budgets, transactions, prev.monthKey, categoryId).carryInCents;
    carryInCents = prev.limitCents + prevCarry - prevSpent;
  }

  const availableCents = limitCents + carryInCents;
  return {
    limitCents,
    carryInCents,
    spentCents,
    availableCents,
    remainingCents: availableCents - spentCents
  };
}

/**
 * Budget status for a whole month across all budgeted categories.
 * @param {import('../../types.js').Budget[]} budgets
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} monthKeyStr 'YYYY-MM'
 * @returns {Array<{budget:object, limitCents:number, carryInCents:number, spentCents:number, availableCents:number, progress:number}>}
 */
export function budgetStatus(budgets, transactions, monthKeyStr) {
  const monthBudgets = budgets.filter((b) => b.monthKey === monthKeyStr);
  return monthBudgets.map((budget) => {
    const r = rolloverFor(budgets, transactions, monthKeyStr, budget.categoryId, {
      manualCarryCents: budget.carryInCents
    });
    return {
      budget,
      limitCents: r.limitCents,
      carryInCents: r.carryInCents,
      spentCents: r.spentCents,
      availableCents: r.availableCents,
      progress: r.limitCents > 0 ? r.spentCents / r.limitCents : 0
    };
  });
}

/** True when the previous month was over or nearly-over budget (used for badges). */
export function isOverBudget(status) {
  return status.availableCents - status.spentCents < 0;
}