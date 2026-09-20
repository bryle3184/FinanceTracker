// @ts-check
import { addMonths } from '../date.js';
import { monthlyTotals } from './monthly.js';

/** pct from prev to current. Returns null when previous is 0 or absent. */
function pctChange(current, previous) {
  if (previous === 0 || previous == null) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Month-over-month comparison of income/expense/net.
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} monthKeyStr 'YYYY-MM'
 * @returns {{current:object, previous:object, pctChange:{expenseCents:number|null, incomeCents:number|null, netCents:number|null}}}
 */
export function momComparison(transactions, monthKeyStr) {
  const current = monthlyTotals(transactions, monthKeyStr);
  const previousMonth = addMonths(monthKeyStr, -1);
  const previous = monthlyTotals(transactions, previousMonth);
  return {
    current,
    previous,
    pctChange: {
      expenseCents: pctChange(current.expenseCents, previous.expenseCents),
      incomeCents: pctChange(current.incomeCents, previous.incomeCents),
      netCents: pctChange(current.netCents, previous.netCents)
    }
  };
}