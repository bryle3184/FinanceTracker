// @ts-check
import { clampDayToMonth, monthKey, addDaysISO, daysBetween } from '../date.js';

/**
 * Compute the occurrence dates of ONE recurring schedule inside
 * `[fromISO, fromISO + horizon-1]` (a half-open window of `horizon` days).
 * Clamps `dayOfPeriod` into each month's real number of days, respects
 * startDate/endDate/active.
 *
 * @param {import('../../types.js').Recurring} r
 * @param {string} fromISO 'YYYY-MM-DD'
 * @param {number} [horizon=30]
 * @returns {Array<{dueDate:string, recurringId:string, name:string, amountCents:number, categoryId:string, type:string}>}
 */
export function occurrencesOnOrAfter(r, fromISO, horizon = 30) {
  if (!r.active) return [];
  const fromDate = new Date(`${fromISO}T00:00:00Z`);
  const windowEnd = addDaysISO(fromISO, horizon); // exclusive

  const start = r.startDate > fromISO ? r.startDate : fromISO;
  const startKey = monthKey(start);
  const endKey = r.endDate ? monthKey(r.endDate) : null;

  const out = [];
  let mk = startKey;
  let guard = 0;
  while (guard++ < 36) {
    const due = clampDayToMonth(mk, r.dayOfPeriod);
    if (due >= fromISO && due < windowEnd) {
      if (r.endDate && due > r.endDate) break;
      out.push({
        dueDate: due,
        recurringId: r.id,
        name: r.name,
        amountCents: r.amountCents,
        categoryId: r.categoryId,
        type: r.type
      });
    }
    if (mk === endKey) break;
    // advance by exactly one period (month/year)
    mk = advancePeriod(mk, r.frequency);
  }
  return out;
}

function advancePeriod(monthKeyStr, frequency) {
  const [y, m] = monthKeyStr.split('-').map(Number);
  if (frequency === 'yearly') return `${y + 1}-${String(m).padStart(2, '0')}`;
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

/**
 * Project all recurring schedules to upcoming occurrences.
 * @param {import('../../types.js').Recurring[]} recurring
 * @param {string} fromISO
 * @param {number} [horizon=30]
 */
export function projectRecurring(recurring, fromISO, horizon = 30) {
  const all = [];
  for (const r of recurring) all.push(...occurrencesOnOrAfter(r, fromISO, horizon));
  return all.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Bills due within the next `days` days (expenses only).
 * @param {import('../../types.js').Recurring[]} recurring
 * @param {string} fromISO
 * @param {number} [days=7]
 */
export function billsDue(recurring, fromISO, days = 7) {
  return projectRecurring(recurring, fromISO, days).filter((o) => o.type === 'expense');
}

/** Human countdown label for an occurrence, e.g. "in 3 days", "today". */
export function dueLabel(dueDate, fromISO) {
  const diff = daysBetween(fromISO, dueDate);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `in ${diff} days`;
}