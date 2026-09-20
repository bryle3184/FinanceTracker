// @ts-check
import { CalendarClock, TrendingUp } from 'lucide-react';
import { useUpcomingRecurring } from '../../state/selectors.js';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import { shortDate } from '../../lib/date.js';

/** Dashboard card: recurring occurrences upcoming in the next 30 days. */
export default function UpcomingRecurringCard() {
  const currency = useStore((s) => s.settings.currency);
  const upcoming = useUpcomingRecurring(30);
  const expenseTotal = upcoming.filter((o) => o.type === 'expense').reduce((a, o) => a + o.amountCents, 0);

  return (
    <div className="card">
      <div className="card-title">
        <CalendarClock size={16} /> Upcoming (30 days)
        <span className="badge" style={{ marginLeft: 'auto' }}>
          <TrendingUp size={12} /> {formatCents(-expenseTotal, currency)}
        </span>
      </div>
      {upcoming.length === 0 ? (
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>No recurring items scheduled.</p>
      ) : (
        <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>
          {upcoming.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', gap: 8 }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{o.name}</span>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)', marginLeft: 6 }}>{shortDate(o.dueDate)}</span>
              </span>
              <span className="mono" style={{ fontWeight: 650, flex: 'none' }}>
                {o.type === 'expense' ? '' : '+'}{formatCents(o.amountCents, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}