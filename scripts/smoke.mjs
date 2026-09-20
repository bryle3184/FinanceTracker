#!/usr/bin/env node
/**
 * Pure-logic smoke tests for the analytics + money + date layers.
 * Run: node scripts/smoke.mjs
 * No test framework — a non-zero exit plus a printed summary on failure.
 */
import {
  parseCents, formatCents, fairShares, floorDiv
} from '../src/lib/money.js';
import {
  monthKey, monthEndISO, addMonths, addDaysISO, clampDayToMonth,
  monthsBetween, todayISO
} from '../src/lib/date.js';
import {
  monthlyTotals, monthlySeries
} from '../src/lib/analytics/monthly.js';
import { categoryBreakdown } from '../src/lib/analytics/categories.js';
import { momComparison } from '../src/lib/analytics/comparison.js';
import { savingsRate, savingsRateTrend } from '../src/lib/analytics/savingsRate.js';
import { detectAnomalies } from '../src/lib/analytics/anomalies.js';
import { budgetStatus } from '../src/lib/analytics/budgets.js';
import { projectRecurring, billsDue, occurrencesOnOrAfter } from '../src/lib/analytics/recurring.js';
import { netPositions, minimalSettlements, computeSettlements } from '../src/lib/analytics/settlement.js';
import { goalProgress, amortize } from '../src/lib/analytics/goals.js';

let failures = 0;
const checks = [];
function check(name, cond, detail = '') {
  checks.push(name);
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ---------------------------------------------------------------- money
check('parseCents USD 12.34 -> 1234', parseCents('12.34', 'USD') === 1234);
check('parseCents USD $1,999.90 -> 199990', parseCents('$1,999.90', 'USD') === 199990);
check('parseCents JPY 12345 -> 1234500', parseCents('12345', 'JPY') === 1234500, String(parseCents('12345', 'JPY')));
check('parseCents JPY empty -> null', parseCents('', 'JPY') === null);
check('parseCents negative', parseCents('-5.50', 'USD') === -550);
check('formatCents JPY 0 decimals', formatCents(1234500, 'JPY').includes('.') === false);
check('fairShares sum invariant (1007/3)', fairShares(1007, 3).reduce((a, b) => a + b, 0) === 1007);
check('fairShares remainder to front', JSON.stringify(fairShares(1007, 3)) === '[336,336,335]');
check('floorDiv rounds toward -inf', floorDiv(5, 3) === 1);

// ---------------------------------------------------------------- date
check('monthKey slices YYYY-MM', monthKey('2026-09-15') === '2026-09');
check('monthEndISO 2026-02 -> 28', monthEndISO('2026-02') === '2026-02-28');
check('monthEndISO leap 2024-02 -> 29', monthEndISO('2024-02') === '2024-02-29');
check('addMonths Dec -> Jan', addMonths('2025-12', 1) === '2026-01');
check('addDaysISO wraps year', addDaysISO('2025-12-31', 1) === '2026-01-01');
check('clampDayToMonth 31 in Apr -> 30', clampDayToMonth('2026-04', 31) === '2026-04-30');
check('clampDayToMonth leap Feb 31 -> 29', clampDayToMonth('2024-02', 31) === '2024-02-29');
check('monthsBetween', monthsBetween('2025-11', '2026-02') === 3);
check('todayISO format', /^\d{4}-\d{2}-\d{2}$/.test(todayISO()));

// ---------------------------------------------------------------- monthly aggregates
const TX = [
  { id: '1', type: 'expense', amountCents: 10000, date: '2026-09-05', categoryId: 'food' },
  { id: '2', type: 'expense', amountCents: 5000, date: '2026-09-20', categoryId: 'transport' },
  { id: '3', type: 'income', amountCents: 200000, date: '2026-09-01', categoryId: 'salary' },
  { id: '4', type: 'expense', amountCents: 30000, date: '2026-08-30', categoryId: 'food' }
];
const tSep = monthlyTotals(TX, '2026-09');
check('monthlyTotals income', tSep.incomeCents === 200000);
check('monthlyTotals expense', tSep.expenseCents === 15000);
check('monthlyTotals net', tSep.netCents === 185000);

const series = monthlySeries(TX, '2026-08', '2026-09');
check('monthlySeries length 2', series.length === 2);
check('monthlySeries empty month zeroed', series[0].expenseCents === 30000 && series[1].incomeCents === 200000);

const foodShare = categoryBreakdown(TX, '2026-09', 'expense').find((b) => b.categoryId === 'food');
check('categoryBreakdown food 10000', foodShare && foodShare.amountCents === 10000);

// ---------------------------------------------------------------- comparison / savings
const cmp = momComparison(TX, '2026-09');
check('momComparison expense pct', cmp.pctChange.expenseCents != null && Math.abs(cmp.pctChange.expenseCents - (-50)) < 0.01);
check('savingsRate 0 income -> null', savingsRate(0, 50) === null);
check('savingsRate 200k/185k ~7.5%', Math.round(savingsRate(200000, 185000) * 10) / 10 === 0.1);
const trend = savingsRateTrend(TX, 3, '2026-09');
check('savingsRateTrend shape', Array.isArray(trend) && trend.length === 3);

// ---------------------------------------------------------------- anomalies
const SPIKE_MONTH = '2026-05';
const annoTx = [];
for (let m = 0; m < 12; m++) {
  const mk = monthKey(addDaysISO(`${2025 + Math.floor((4 + m) / 12)}-${String((((4 + m) % 12) + 1) || 12).padStart(2, '0')}-01`, 5).slice(0, 10));
  annoTx.push({ id: `a${m}`, type: 'expense', amountCents: 2000, date: `${mk}-10`, categoryId: 'food', recurringId: null });
}
annoTx.push({ id: 'spike', type: 'expense', amountCents: 200000, date: `${SPIKE_MONTH}-15`, categoryId: 'food', recurringId: null });
const anomalies = detectAnomalies(annoTx, SPIKE_MONTH, { factor: 2.5, minCents: 5000 });
check('anomaly flags the spike', anomalies.some((a) => a.transaction.id === 'spike'));

// recurring-linked history shouldn't flag (fixed bills)
const recTx = [...annoTx.slice(0, 12)].map((a, i) => ({ ...a, recurringId: i }));
const recAnomalies = detectAnomalies(recTx, SPIKE_MONTH, { factor: 2.5, minCents: 5000 });
check('no anomaly for recurring-linked', recAnomalies.length === 0);

// ---------------------------------------------------------------- recurring projection
const R = [
  { id: 'r1', name: 'Rent', amountCents: 100000, type: 'expense', categoryId: 'housing', frequency: 'monthly', dayOfPeriod: 31, startDate: '2026-01-01', endDate: null, active: true },
  { id: 'r2', name: 'Salary', amountCents: 250000, type: 'income', categoryId: 'salary', frequency: 'monthly', dayOfPeriod: 1, startDate: '2026-01-01', endDate: '2026-09-30', active: true },
  { id: 'r3', name: 'Paused sub', amountCents: 1500, type: 'expense', categoryId: 'entertainment', frequency: 'monthly', dayOfPeriod: 15, startDate: '2026-01-01', endDate: null, active: false }
];
const proj = projectRecurring(R, '2026-09-01', 62);
// 62-day window from Sep 1 -> up to Nov 2: Rent (Sep 30, Oct 31) + Salary (Sep 1) = 3
check('projection over 62-day window = 3', proj.length === 3, `len=${proj.length}`);
check('projection clamps Apr rent to 30th', occurrencesOnOrAfter(R[0], '2026-04-01', 31).some((o) => o.dueDate === '2026-04-30'));
const bills = billsDue(R, '2026-09-28', 7);
check('billsDue within 7 days excludes income + paused', bills.length === 1 && bills[0].name === 'Rent');

// ---------------------------------------------------------------- budgets + rollover
const B_RENT = { id: 'b1', categoryId: 'housing', monthKey: '2026-08', limitCents: 100000, essential: true, carryInCents: null };
const B_RENT_SEP = { id: 'b2', categoryId: 'housing', monthKey: '2026-09', limitCents: 110000, essential: true, carryInCents: null };
const budTx = [
  { id: 't1', type: 'expense', amountCents: 80000, date: '2026-08-10', categoryId: 'housing' },
  { id: 't2', type: 'expense', amountCents: 100000, date: '2026-09-10', categoryId: 'housing' }
];
const statuses = budgetStatus([B_RENT, B_RENT_SEP], budTx, '2026-09');
const sep = statuses[0];
check('rollover carry-in = prev remaining (+20k)', sep.carryInCents === 20000, `carry=${sep.carryInCents}`);
check('budgetStatus spent', sep.spentCents === 100000);
check('budgetStatus available = limit+carry', sep.availableCents === 130000);

// ---------------------------------------------------------------- settlement
const parts = [
  { id: 'p1', name: 'Ann', initials: 'AN', color: '#aaa', isActive: true },
  { id: 'p2', name: 'Bo', initials: 'BO', color: '#bbb', isActive: true },
  { id: 'p3', name: 'Cy', initials: 'CY', color: '#ccc', isActive: true }
];
const setTx = [
  { id: 's1', type: 'expense', amountCents: 9000, date: '2026-09-01', paidByMemberId: 'p1', splits: [{ memberId: 'p1', shareCents: 3000 }, { memberId: 'p2', shareCents: 3000 }, { memberId: 'p3', shareCents: 3000 }] },
  { id: 's2', type: 'expense', amountCents: 6000, date: '2026-09-02', paidByMemberId: 'p2', splits: [{ memberId: 'p2', shareCents: 3000 }, { memberId: 'p3', shareCents: 3000 }] }
];
const full = computeSettlements(setTx, parts, { fromMonthKey: '2026-09', toMonthKey: '2026-09' });
const sumNets = full.nets.reduce((a, n) => a + n.netCents, 0);
check('settlement nets sum to 0', sumNets === 0, `sum=${sumNets}`);
check('settlement transfers < members', full.settlements.length <= parts.length - 1, `n=${full.settlements.length}`);
// Ann fronts 9000, owes 3000 -> net +6000; Bo fronts 6000, owes 6000 -> 0; Cy owes 6000.
const ann = full.nets.find((n) => n.memberId === 'p1');
check('Ann owed 6000', ann && ann.netCents === 6000);
const cy = full.nets.find((n) => n.memberId === 'p3');
check('Cy owes 6000', cy && cy.netCents === -6000);
check('minimal transfer Cy->Ann 6000', full.settlements.some((s) => s.fromMemberId === 'p3' && s.toMemberId === 'p1' && s.amountCents === 6000));

// 1-cent residual resolves in a single transfer (epsilon guard, no ping-pong).
const residual = minimalSettlements(new Map([['a', 1], ['b', -1]]));
check('1-cent residual resolves in one transfer', residual.length === 1, `n=${residual.length}`);
check('sub-unit residual produces no transfer', minimalSettlements(new Map([['a', 0], ['b', 0]])).length === 0);

// ---------------------------------------------------------------- goals
const goal = {
  kind: 'savings', name: 'Trip', targetCents: 100000,
  contributions: [
    { id: 'c1', amountCents: 10000, date: '2026-08-01' },
    { id: 'c2', amountCents: 10000, date: '2026-09-01' }
  ]
};
const gp = goalProgress(goal);
check('goal contributed 20000', gp.contributedCents === 20000);
check('goal pct 20', gp.pct === 20);

const am = amortize(1000000, 0.01, 300000);
check('amortize pays off ~4 months', am.months != null && am.months <= 5, `months=${am.months}`);
const balloon = amortize(1000000, 0.30, 1000);
check('amortize min payment < interest -> null', balloon.months === null);

// ---------------------------------------------------------------- summary
console.log(`smoke: ${checks.length} checks, ${failures} failures`);
if (failures > 0) process.exit(1);
console.log('All good.');