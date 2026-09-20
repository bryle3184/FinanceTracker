// @ts-check
import { AlarmClock } from 'lucide-react';
import { useBillsDue } from '../../state/selectors.js';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import { dueLabel } from '../../lib/analytics/index.js';
import { todayISO } from '../../lib/date.js';

/** Dashboard card: recurring bills due within the next 7 days. */
export default function BillsDueCard() {
  const currency = useStore((s) => s.settings.currency);
  const bills = useBillsDue(7);

  return (
    <div className="card">
      <div className="card-title">
        <AlarmClock size={16} />
        Bills due
        {bills.length > 0 && <span className="badge badge-warn" style={{ marginLeft: 'auto' }}>{bills.length}</span>}
      </div>
      {bills.length === 0 ? (
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>No bills in the next 7 days.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {bills.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{b.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{dueLabel(b.dueDate, todayISO())}</span>
                <span className="mono" style={{ fontWeight: 650 }}>{formatCents(b.amountCents, currency)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}