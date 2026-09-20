// @ts-check
import { daysBetween, addMonths, todayISO, currentMonthKey, clampDayToMonth, monthsBetween } from '../date.js';

/**
 * Progress/projection for a goal, derived from contributions + schedule.
 *
 * @param {import('../../types.js').Goal} goal
 * @returns {{contributedCents:number, targetCents:number|null, pct:number, projectedDateISO:string|null, monthsRemaining:number|null, detail:object}}
 */
export function goalProgress(goal) {
  const contributedCents = goal.contributions.reduce((acc, c) => acc + c.amountCents, 0);
  const today = todayISO();

  switch (goal.kind) {
    case 'savings': {
      const target = goal.targetCents;
      const pct = target > 0 ? Math.min(1, contributedCents / target) : 0;
      let projected = null;
      if (contributedCents < target) {
        const monthsOfContributions = monthlyContributions(goal.contributions);
        if (goal.contributions.length > 0 && monthsOfContributions > 0) {
          const remaining = target - contributedCents;
          const perMonth = contributedCents / monthsOfContributions;
          const monthsNeeded = Math.ceil(remaining / Math.max(perMonth, 1));
          projected = addMonths(currentMonthKey(), monthsNeeded) + '-01';
          projected = clampDayToMonth(projected.slice(0, 7), 1);
        }
      } else {
        projected = null; // achieved
      }
      return {
        contributedCents,
        targetCents: target,
        pct: Math.round(pct * 1000) / 10,
        projectedDateISO: projected,
        monthsRemaining: projected ? monthsBetween(currentMonthKey(), projected.slice(0, 7)) : 0,
        detail: {}
      };
    }

    case 'sinkingFund': {
      const target = goal.targetCents;
      const monthly = goal.monthlyContributionCents;
      const pct = target > 0 ? Math.min(1, contributedCents / target) : 0;
      let projected = null;
      if (contributedCents < target && monthly > 0) {
        const monthsNeeded = Math.ceil((target - contributedCents) / monthly);
        projected = addMonths(currentMonthKey(), monthsNeeded) + '-01';
      }
      return {
        contributedCents,
        targetCents: target,
        pct: Math.round(pct * 1000) / 10,
        projectedDateISO: projected,
        monthsRemaining: projected ? monthsBetween(currentMonthKey(), projected.slice(0, 7)) : 0,
        detail: { monthlyContributionCents: monthly }
      };
    }

    case 'debt': {
      // Amortization simulation with monthly compounding (simple monthly interest).
      const principal = Math.max(0, goal.principalCents - contributedCents);
      const rateMonthly = goal.interestRateBps / 10000 / 12;
      const minPmt = goal.minPaymentCents;
      const result = amortize(principal, rateMonthly, minPmt);
      const pct = goal.principalCents > 0 ? (contributedCents / goal.principalCents) * 100 : 0;
      let projected = null;
      if (principal > 0 && result.months != null) {
        projected = addMonths(currentMonthKey(), result.months) + '-01';
      }
      return {
        contributedCents,
        targetCents: goal.principalCents,
        pct: Math.round(pct * 10) / 10,
        projectedDateISO: projected,
        monthsRemaining: projected ? monthsBetween(currentMonthKey(), projected.slice(0, 7)) : null,
        detail: { monthsToPayoff: result.months, totalInterestCents: result.totalInterestCents }
      };
    }

    default:
      return { contributedCents, targetCents: null, pct: 0, projectedDateISO: null, monthsRemaining: null, detail: {} };
  }
}

/**
 * Amortize a principal with a fixed min payment at monthly interest.
 * @param {number} principalCents
 * @param {number} monthlyRate (fraction, e.g. 0.0075)
 * @param {number} minPaymentCents
 * @returns {{months:number|null, totalInterestCents:number}}
 */
export function amortize(principalCents, monthlyRate, minPaymentCents) {
  if (principalCents <= 0) return { months: 0, totalInterestCents: 0 };
  if (minPaymentCents <= 0) return { months: null, totalInterestCents: NaN }; // would never pay off
  let balance = principalCents;
  let months = 0;
  let totalInterest = 0;
  // Integer-friendly iteration with float interest accumulated and rounded.
  while (balance > 0 && months < 1200) {
    const interest = Math.round(balance * monthlyRate);
    if (interest >= minPaymentCents && balance + interest > minPaymentCents && minPaymentCents <= interest) {
      // min payment doesn't even cover interest -> balloon (won't finish)
      return { months: null, totalInterestCents: totalInterest };
    }
    if (balance + interest <= minPaymentCents) {
      totalInterest += Math.max(interest, 0);
      balance = 0;
    } else {
      balance = balance + interest - minPaymentCents;
      totalInterest += interest;
    }
    months += 1;
  }
  return { months: balance <= 0 ? months : null, totalInterestCents: totalInterest };
}

/** Approximate number of months spanned by a contribution history. */
function monthlyContributions(contributions) {
  if (contributions.length === 0) return 0;
  const sorted = [...contributions].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0].date.slice(0, 7);
  const last = sorted[sorted.length - 1].date.slice(0, 7);
  return Math.max(1, monthsBetween(first, last));
}

/** Seed helper: convert a goal to its "achieved" state quickly. */
export function isGoalAchieved(goal) {
  const p = goalProgress(goal);
  return !!p.projectedDateISO === false && goal.kind !== 'debt'
    ? p.contributedCents >= (p.targetCents || 0)
    : goal.kind === 'debt' && p.detail.monthsToPayoff === 0;
}

/**
 * date of latest contribution.
 * @param {import('../../types.js').Goal} goal
 */
export function lastContributionDate(goal) {
  if (!goal.contributions.length) return null;
  return goal.contributions.reduce((a, b) => (a.date > b.date ? a : b)).date;
}