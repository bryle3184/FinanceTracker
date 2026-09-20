// @ts-check
import { Pencil, Star } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { categoryById } from '../../lib/categories.js';
import { formatCents } from '../../lib/money.js';
import ProgressBar from '../../components/shared/ProgressBar.jsx';

/**
 * One budget card: category, limit, spent, progress bar, remaining and
 * rollover badges.
 */
export default function BudgetCard({ status, onEdit }) {
  const currency = useStore((s) => s.settings.currency);
  const cat = categoryById(status.budget.categoryId);
  const remaining = status.availableCents - status.spentCents;
  const over = remaining < 0;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flex: 'none' }} />
        <span style={{ fontWeight: 650, flex: 1 }}>
          {cat.label}
        </span>
        {status.budget.essential && (
          <span className="badge badge-accent" title="Essential"><Star size={11} /> Essential</span>
        )}
        <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={onEdit} aria-label="Edit budget">
          <Pencil size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span className="mono" style={{ fontSize: 'var(--fs-sm)' }}>
          <span style={{ fontWeight: 750, color: over ? 'var(--color-danger)' : 'var(--text)' }}>
            {formatCents(status.spentCents, currency)}
          </span>
          {' / '}
          <span className="muted">{formatCents(status.limitCents, currency)}</span>
        </span>
        <span className="mono" style={{ fontSize: 'var(--fs-xs)', color: over ? 'var(--color-danger)' : 'var(--color-accent-strong)' }}>
          {formatCents(remaining, currency, { signed: true })}
        </span>
      </div>

      <ProgressBar value={status.progress} warnAt={0.8} overAt={1}>
        <span>{Math.round(status.progress * 100)}%</span>
        {status.carryInCents !== 0 && (
          <span title="Rolled over from last month">
            carry {formatCents(status.carryInCents, currency, { signed: true })}
          </span>
        )}
      </ProgressBar>
    </div>
  );
}