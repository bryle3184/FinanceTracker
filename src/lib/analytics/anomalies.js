// @ts-check
import { monthKey, addMonths } from '../date.js';

/**
 * Median of a sorted numeric array.
 * @param {number[]} arr
 */
function median(arr) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Flag expenses that look anomalous for their category.
 * Baseline = median of the same category over the PRIOR 12 months
 * (excluding the month being checked). Recurring-linked transactions are
 * excluded (fixed bills like rent would flag every month).
 *
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} monthKeyStr 'YYYY-MM'
 * @param {object} [opts]
 * @param {number} [opts.factor=2.5]
 * @param {number} [opts.minCents=15000]
 * @returns {Array<{transaction:object, factor:number, medianCents:number, monthKey:string}>}
 */
export function detectAnomalies(transactions, monthKeyStr, opts = {}) {
  const factor = opts.factor ?? 2.5;
  const minCents = opts.minCents ?? 15000;

  // Baseline: per-category median across the 12 months before monthKeyStr.
  const baseline = new Map(); // categoryId -> { sums:number[], counts:number[], median }
  const priorStart = addMonths(monthKeyStr, -12);
  const seenThisMonth = new Set();

  for (const tx of transactions) {
    const mk = monthKey(tx.date);
    if (tx.type !== 'expense') continue;
    if (mk === monthKeyStr) {
      seenThisMonth.add(tx.id);
      continue;
    }
    if (mk >= priorStart && mk < monthKeyStr) {
      // only count expense transactions in the prior window
      const row = baseline.get(tx.categoryId) || { sums: [], counts: 0 };
      row.sums.push(tx.amountCents);
      row.counts += 1;
      baseline.set(tx.categoryId, row);
    }
  }

  // Build a lazy map of median per category.
  const medians = new Map();
  for (const [categoryId, row] of baseline) {
    medians.set(categoryId, median(row.sums));
  }

  const out = [];
  for (const tx of transactions) {
    if (!seenThisMonth.has(tx.id)) continue;
    if (tx.type !== 'expense') continue;
    if (tx.recurringId) continue; // projected recurring bills are expected
    const med = medians.get(tx.categoryId) ?? 0;
    if (med <= 0 || tx.amountCents < minCents) continue;
    const f = tx.amountCents / med;
    if (f > factor) {
      out.push({ transaction: tx, factor: Math.round(f * 10) / 10, medianCents: med, monthKey: monthKeyStr });
    }
  }
  return out.sort((a, b) => b.factor - a.factor);
}