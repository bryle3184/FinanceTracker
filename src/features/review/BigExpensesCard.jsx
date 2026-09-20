// @ts-check
import { Flame } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { formatCents } from '../../lib/money.js';
import { shortDate } from '../../lib/date.js';
import { categoryById } from '../../lib/categories.js';

/** Top 5 expenses of the reviewed month. */
export default function BigExpensesCard() {
  const currency = useStore((s) => s.settings.currency);
  const transactions = useStore((s) => s.transactions);
  const { monthKey } = useMonthContext();

  const top = transactions
    .filter((t) => t.type === 'expense' && t.date.slice(0, 7) === monthKey)
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="card">
        <div className="card-title"><Flame size={16} /> Biggest expenses</div>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>Nothing this month.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title"><Flame size={16} /> Biggest expenses</div>
      <div style={{ display: 'grid' }}>
        {top.map((tx) => {
          const cat = categoryById(tx.categoryId);
          return (
            <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 'var(--fs-sm)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.description || cat.label}
                </div>
                <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{shortDate(tx.date)} · {cat.label}</div>
              </div>
              <span className="mono" style={{ fontWeight: 650 }}>{formatCents(tx.amountCents, currency)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}