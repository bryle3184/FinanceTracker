// @ts-check
import { ArrowRightLeft } from 'lucide-react';
import { useBudgetStatus } from '../../state/selectors.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import { categoryById } from '../../lib/categories.js';

/**
 * Budget rollover preview: what each category carries into next month
 * (surplus you roll forward, or a deficit you'll need to cover).
 */
export default function RolloverCard() {
  const currency = useStore((s) => s.settings.currency);
  const { monthKey } = useMonthContext();
  const statuses = useBudgetStatus(monthKey);

  if (statuses.length === 0) {
    return (
      <div className="card">
        <div className="card-title"><ArrowRightLeft size={16} /> Budget rollover</div>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>Set a budget first to see what carries over.</p>
      </div>
    );
  }

  const rows = statuses.map((s) => {
    const roll = s.availableCents - s.spentCents; // negative => deficit carried forward
    return { ...s, roll };
  });

  const totalRoll = rows.reduce((a, r) => a + r.roll, 0);

  return (
    <div className="card">
      <div className="card-title">
        <ArrowRightLeft size={16} /> Budget rollover
        <span className="badge" style={{ marginLeft: 'auto' }}>next month: {formatCents(totalRoll, currency)}</span>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {rows.map((r) => {
          const cat = categoryById(r.budget.categoryId);
          const positive = r.roll >= 0;
          return (
            <div key={r.budget.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flex: 'none' }} />
              <span style={{ flex: 1 }}>{cat.label}</span>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                {r.spentCents > r.limitCents ? 'overspent' : 'left over'}
              </span>
              <span className="mono" style={{ fontWeight: 650, color: positive ? 'var(--color-accent-strong)' : 'var(--color-danger)' }}>
                {formatCents(r.roll, currency, { signed: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}