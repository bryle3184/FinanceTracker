// @ts-check
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useMomComparison } from '../../state/selectors.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import { addMonths, monthLabel } from '../../lib/date.js';

/** Month-over-month deltas for income/expense/net. */
export default function MoMComparison() {
  const currency = useStore((s) => s.settings.currency);
  const { monthKey } = useMonthContext();
  const cmp = useMomComparison(monthKey);

  const rows = [
    { label: 'Income', cur: cmp.current.incomeCents, prev: cmp.previous.incomeCents, pct: cmp.pctChange.incomeCents },
    { label: 'Expenses', cur: cmp.current.expenseCents, prev: cmp.previous.expenseCents, pct: cmp.pctChange.expenseCents },
    { label: 'Net', cur: cmp.current.netCents, prev: cmp.previous.netCents, pct: cmp.pctChange.netCents }
  ];

  return (
    <div className="card">
      <div className="card-title">vs {monthLabel(addMonths(monthKey, -1))}</div>
      {rows.map((r) => {
        const up = r.pct != null && (r.pct >= 0) === (r.label !== 'Expenses');
        const down = r.pct != null && (r.pct < 0) === (r.label !== 'Expenses');
        const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
        const color = up ? 'var(--color-accent-strong)' : down ? 'var(--color-danger)' : 'var(--text-faint)';
        return (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span className="muted">{r.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ fontWeight: 650 }}>{formatCents(r.cur, currency)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 'var(--fs-xs)', color }}>
                <Icon size={13} />
                {r.pct == null ? '—' : `${Math.abs(r.pct).toFixed(1)}%`}
              </span>
            </span>
          </div>
        );
      })}
      <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 8 }}>Comparing {monthLabel(monthKey)} with {monthLabel(addMonths(monthKey, -1))}.</p>
    </div>
  );
}