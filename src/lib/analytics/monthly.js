// @ts-check
/**
 * Pure monthly aggregation helpers. All functions take full entity arrays and
 * return plain objects; callers memoize with selector hooks.
 */
import { monthKey } from '../date.js';

/**
 * Totals for one month.
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} monthKeyStr 'YYYY-MM'
 * @returns {{incomeCents:number, expenseCents:number, netCents:number}}
 */
export function monthlyTotals(transactions, monthKeyStr) {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const tx of transactions) {
    if (monthKey(tx.date) !== monthKeyStr) continue;
    if (tx.type === 'income') incomeCents += tx.amountCents;
    else expenseCents += tx.amountCents;
  }
  return { incomeCents, expenseCents, netCents: incomeCents - expenseCents };
}

/**
 * Series of monthly totals over an inclusive month range.
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} startMonth 'YYYY-MM'
 * @param {string} endMonth 'YYYY-MM'
 * @returns {Array<{monthKey:string, incomeCents:number, expenseCents:number, netCents:number}>}
 */
export function monthlySeries(transactions, startMonth, endMonth) {
  const byMonth = new Map();
  for (const tx of transactions) {
    const mk = monthKey(tx.date);
    if (mk < startMonth || mk > endMonth) continue;
    const row = byMonth.get(mk) || { incomeCents: 0, expenseCents: 0 };
    if (tx.type === 'income') row.incomeCents += tx.amountCents;
    else row.expenseCents += tx.amountCents;
    byMonth.set(mk, row);
  }
  // Build contiguous range including empty months (policy: missing months count as zero).
  const out = [];
  let [sy, sm] = startMonth.split('-').map(Number);
  const [ey, em] = endMonth.split('-').map(Number);
  let guard = 0;
  while ((sy < ey || (sy === ey && sm <= em)) && guard++ < 600) {
    const mk = `${sy}-${String(sm).padStart(2, '0')}`;
    const row = byMonth.get(mk) || { incomeCents: 0, expenseCents: 0 };
    out.push({ monthKey: mk, ...row, netCents: row.incomeCents - row.expenseCents });
    sm += 1;
    if (sm > 12) {
      sm = 1;
      sy += 1;
    }
  }
  return out;
}