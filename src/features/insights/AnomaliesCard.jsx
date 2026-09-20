// @ts-check
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAnomalies } from '../../state/selectors.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import { categoryById } from '../../lib/categories.js';
import { shortDate } from '../../lib/date.js';

/**
 * Unknown/big spending alerts for the view month: expenses flagged against
 * their own category's prior-12-month median. Recurring-linked entries skipped.
 */
export default function AnomaliesCard() {
  const currency = useStore((s) => s.settings.currency);
  const { monthKey } = useMonthContext();
  const anomalies = useAnomalies(monthKey);

  if (anomalies.length === 0) {
    return (
      <div className="card">
        <div className="card-title"><ShieldCheck size={16} /> Spending anomalies</div>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>Nothing unusual this month.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--color-warn) 40%, transparent)' }}>
      <div className="card-title"><ShieldAlert size={16} /> Possible spending anomalies</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {anomalies.map((a) => {
          const cat = categoryById(a.transaction.categoryId);
          return (
            <div key={a.transaction.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.transaction.description || cat.label}
                </div>
                <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                  {shortDate(a.transaction.date)} · {cat.label} · median {formatCents(a.medianCents, currency)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-warn">{a.factor}× usual</span>
                <span className="mono" style={{ fontWeight: 650 }}>{formatCents(a.transaction.amountCents, currency)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}