// @ts-check
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useMonthlyTotals, useCategoryBreakdown } from '../../state/selectors.js';
import { monthLabel } from '../../lib/date.js';
import { formatCents } from '../../lib/money.js';
import { categoryById } from '../../lib/categories.js';
import MonthNavigator from './MonthNavigator.jsx';
import BigExpensesCard from './BigExpensesCard.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { BookOpen } from 'lucide-react';

/** End-of-month retrospective for any month. */
export default function MonthReviewPage() {
  const currency = useStore((s) => s.settings.currency);
  const collections = useStore((s) => s.transactions.length);
  const { monthKey } = useMonthContext();
  const totals = useMonthlyTotals(monthKey);
  const breakdown = useCategoryBreakdown(monthKey, 'expense');

  const savings = totals.incomeCents > 0 ? (totals.netCents / totals.incomeCents) * 100 : null;
  const topCategory = breakdown[0];

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Month Review</h1>
        <MonthNavigator />
      </div>

      {collections === 0 ? (
        <div style={{ marginTop: 'var(--sp-5)' }}>
          <EmptyState icon={BookOpen} title="No data yet" hint="Add a few transactions, then come back for your month's retrospective." />
        </div>
      ) : (
        <>
          {/* Verdict */}
          {totals.expenseCents > 0 || totals.incomeCents > 0 ? (
            <div className="card" style={{ marginTop: 'var(--sp-4)', borderLeft: '3px solid var(--color-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} color="var(--color-accent-strong)" />
                <span style={{ fontSize: 'var(--fs-sm)' }}>
                  In {monthLabel(monthKey)} you{' '}
                  {savings == null
                    ? 'had no income to measure savings against.'
                    : savings >= 0.2
                      ? `saved ${savings.toFixed(0)}% of your income — great discipline!`
                      : savings >= 0
                        ? `saved ${savings.toFixed(0)}% of your income.`
                        : `spent ${Math.abs(savings).toFixed(0)}% more than you earned.`}
                </span>
              </div>
              {topCategory && (
                <p className="muted" style={{ fontSize: 'var(--fs-xs)', margin: '6px 0 0' }}>
                  Biggest spend category: <strong>{categoryById(topCategory.categoryId).label}</strong> ({formatCents(topCategory.amountCents, currency)}).
                </p>
              )}
            </div>
          ) : null}

          {/* Summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={12} color="var(--color-accent-strong)" /> Income</span>
              <span className="mono" style={{ fontWeight: 750 }}>{formatCents(totals.incomeCents, currency)}</span>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingDown size={12} color="var(--color-danger)" /> Expenses</span>
              <span className="mono" style={{ fontWeight: 750 }}>{formatCents(-totals.expenseCents, currency)}</span>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Net</span>
              <span className="mono" style={{ fontWeight: 750, color: totals.netCents >= 0 ? 'var(--color-accent-strong)' : 'var(--color-danger)' }}>
                {formatCents(totals.netCents, currency)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
            <BigExpensesCard />

            <div className="card">
              <div className="card-title">Spend by category</div>
              {breakdown.length === 0 ? (
                <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>No expenses recorded this month.</p>
              ) : (
                <div style={{ display: 'grid' }}>
                  {breakdown.map((b) => {
                    const cat = categoryById(b.categoryId);
                    const pct = totals.expenseCents ? (b.amountCents / totals.expenseCents) * 100 : 0;
                    return (
                      <div key={b.categoryId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 'var(--fs-sm)' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flex: 'none' }} />
                        <span style={{ flex: 1 }}>{cat.label}</span>
                        <span className="muted" style={{ fontSize: 'var(--fs-xs)', width: 40, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                        <span className="mono" style={{ fontWeight: 650, minWidth: 90, textAlign: 'right' }}>{formatCents(b.amountCents, currency)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}