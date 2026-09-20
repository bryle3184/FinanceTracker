// @ts-check
import { Wallet, TrendingUp, TrendingDown, PieChart as PieIcon } from 'lucide-react';
import { useMonthlyTotals } from '../../state/selectors.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';

/**
 * Dashboard hero: income / expense / net for the view month, plus savings rate.
 */
export default function MonthlySummaryCard() {
  const currency = useStore((s) => s.settings.currency);
  const { monthKey } = useMonthContext();
  const { incomeCents, expenseCents, netCents } = useMonthlyTotals(monthKey);

  const fmt = (c) => formatCents(c, currency);
  const savings = incomeCents > 0 ? ((incomeCents - expenseCents) / incomeCents) : null;

  const Item = ({ icon: Icon, label, value, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-sunken)', padding: '12px', borderRadius: 'var(--radius-sm)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
        <Icon size={14} color={color} />
        {label}
      </div>
      <div className="mono" style={{ fontWeight: 750, fontSize: 'var(--fs-lg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--sp-3)' }}>
        <Wallet size={16} />
        <span className="card-title" style={{ margin: 0 }}>This month</span>
        <span className="badge" style={{ marginLeft: 'auto' }}>
          <PieIcon size={12} /> Balance
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
        <Item icon={TrendingUp} label="Income" value={fmt(incomeCents)} color="var(--color-accent-strong)" />
        <Item icon={TrendingDown} label="Expenses" value={fmt(-expenseCents)} color="var(--color-danger)" />
        <Item icon={Wallet} label="Net" value={fmt(netCents)} color={netCents >= 0 ? 'var(--color-accent-strong)' : 'var(--color-danger)'} />
        <Item
          icon={Wallet}
          label="Savings rate"
          value={savings === null ? '—' : `${Math.round(savings * 100)}%`}
          color="var(--color-info)"
        />
      </div>
    </div>
  );
}