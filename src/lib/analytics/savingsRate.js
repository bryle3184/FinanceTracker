// @ts-check
import { addMonths } from '../date.js';
import { monthlyTotals } from './monthly.js';

/**
 * Savings rate = (income - expense) / income, in 0..1. null when income <= 0.
 * @param {number} incomeCents
 * @param {number} expenseCents
 */
export function savingsRate(incomeCents, expenseCents) {
  if (incomeCents <= 0) return null;
  return (incomeCents - expenseCents) / incomeCents;
}

/**
 * Savings rate trend over trailing months ending at endMonth (inclusive).
 * @param {import('../../types.js').Transaction[]} transactions
 * @param {number} [months=6]
 * @param {string} [endMonth='YYYY-MM of last available tx or current']
 * @returns {Array<{monthKey:string, rate:number|null, incomeCents:number, expenseCents:number}>}
 */
export function savingsRateTrend(transactions, months = 6, endMonth) {
  const monthsArr = [];
  const anchor = endMonth || (transactions.map((t) => t.date.slice(0, 7)).sort().reverse()[0]);
  if (!anchor) return [];
  for (let i = months - 1; i >= 0; i--) {
    monthsArr.push(addMonths(anchor, -i));
  }
  return monthsArr.map((mk) => {
    const t = monthlyTotals(transactions, mk);
    return {
      monthKey: mk,
      rate: savingsRate(t.incomeCents, t.expenseCents),
      incomeCents: t.incomeCents,
      expenseCents: t.expenseCents
    };
  });
}