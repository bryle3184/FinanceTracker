// @ts-check
import { monthKey } from '../date.js';
import { categoryById } from '../categories.js';

/**
 * Spending (or income) by category for a month, sorted descending by amount.
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} monthKeyStr 'YYYY-MM'
 * @param {'expense'|'income'} kind
 * @returns {Array<{categoryId:string, amountCents:number, count:number, color:string, label:string}>}
 */
export function categoryBreakdown(transactions, monthKeyStr, kind = 'expense') {
  const map = new Map();
  for (const tx of transactions) {
    if (monthKey(tx.date) !== monthKeyStr) continue;
    if (tx.type !== kind) continue;
    const row = map.get(tx.categoryId) || { amountCents: 0, count: 0 };
    row.amountCents += tx.amountCents;
    row.count += 1;
    map.set(tx.categoryId, row);
  }
  return Array.from(map.entries())
    .map(([categoryId, row]) => ({
      categoryId,
      amountCents: row.amountCents,
      count: row.count,
      color: categoryById(categoryId).color,
      label: categoryById(categoryId).label
    }))
    .sort((a, b) => b.amountCents - a.amountCents);
}

/**
 * Merged breakdown across categories that appear in a month range (for trends).
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {string} fromMonth 'YYYY-MM'
 * @param {string} toMonth 'YYYY-MM'
 */
export function categoryRangeTotals(transactions, fromMonth, toMonth) {
  const map = new Map();
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const mk = monthKey(tx.date);
    if (mk < fromMonth || mk > toMonth) continue;
    const row = map.get(tx.categoryId) || { amountCents: 0, count: 0 };
    row.amountCents += tx.amountCents;
    row.count += 1;
    map.set(tx.categoryId, row);
  }
  return Array.from(map.entries())
    .map(([categoryId, row]) => ({
      categoryId,
      amountCents: row.amountCents,
      count: row.count,
      color: categoryById(categoryId).color,
      label: categoryById(categoryId).label
    }))
    .sort((a, b) => b.amountCents - a.amountCents);
}