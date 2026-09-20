// @ts-check
import { Pencil, CalendarPlus, Circle } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { categoryById } from '../../lib/categories.js';
import { formatCents } from '../../lib/money.js';
import { shortDate } from '../../lib/date.js';

const row = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)'
};

/** One recurring schedule row with next occurrence + record action. */
export default function RecurringRow({ rec, nextDate, onEdit, onRecord }) {
  const currency = useStore((s) => s.settings.currency);
  const cat = categoryById(rec.categoryId);

  return (
    <div style={row}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: rec.active ? cat.color : 'var(--text-faint)',
          flex: 'none'
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.name}</span>
          {!rec.active && <span className="badge" style={{ color: 'var(--text-faint)' }}>paused</span>}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span>{cat.label}</span>·<span>day {rec.dayOfPeriod}</span>·<span>{rec.frequency}</span>
          {nextDate && <span>· next {shortDate(nextDate)}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="mono" style={{ fontWeight: 650, fontSize: 'var(--fs-sm)' }}>
          {rec.type === 'income' ? '+' : ''}{formatCents(rec.amountCents, currency)}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onRecord} title="Record this occurrence as a transaction">
          <CalendarPlus size={14} /> Record
        </button>
        <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={onEdit} aria-label="Edit schedule">
          <Pencil size={13} />
        </button>
      </div>

      <Circle size={1} style={{ display: 'none' }} />
    </div>
  );
}