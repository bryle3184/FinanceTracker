// @ts-check
import { Pencil, Plus, Target, PiggyBank, HandCoins, CalendarDays } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { goalProgress } from '../../lib/analytics/index.js';
import { formatCents } from '../../lib/money.js';
import { longDate } from '../../lib/date.js';
import ProgressBar from '../../components/shared/ProgressBar.jsx';

const KIND_META = {
  savings: { label: 'Savings', icon: Target, color: '#4cc9a4' },
  sinkingFund: { label: 'Sinking fund', icon: PiggyBank, color: '#3a86ff' },
  debt: { label: 'Debt payoff', icon: HandCoins, color: '#e63946' }
};

/** One goal card: kind, progress bar, key numbers, actions. */
export default function GoalCard({ goal, onEdit, onContribute }) {
  const currency = useStore((s) => s.settings.currency);
  const p = goalProgress(goal);
  const meta = KIND_META[goal.kind] || KIND_META.savings;
  const Icon = meta.icon;

  const fmt = (c) => formatCents(c, currency);

  let numbers;
  if (goal.kind === 'debt') {
    const remaining = Math.max(0, (goal.principalCents || 0) - p.contributedCents);
    numbers = (
      <div style={{ display: 'grid', gap: 2, fontSize: 'var(--fs-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Remaining</span><span className="mono" style={{ fontWeight: 650 }}>{fmt(remaining)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Interest</span><span className="mono">{(goal.interestRateBps / 100).toFixed(2)}% APR</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Min payment</span><span className="mono">{fmt(goal.minPaymentCents)}/mo</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Payoff</span><span className="mono" style={{ fontWeight: 650 }}>{p.detail.monthsToPayoff == null ? '—' : `${p.detail.monthsToPayoff} mo`}</span></div>
      </div>
    );
  } else if (goal.kind === 'sinkingFund') {
    numbers = (
      <div style={{ fontSize: 'var(--fs-sm)' }}>
        <span className="muted">Fund at </span>
        <span className="mono" style={{ fontWeight: 650 }}>{fmt(goal.monthlyContributionCents)}/mo</span>
      </div>
    );
  } else {
    numbers = null;
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: meta.color }}><Icon size={18} /></span>
        <span style={{ fontWeight: 650, flex: 1 }}>{goal.name}</span>
        <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={onEdit} aria-label="Edit goal"><Pencil size={13} /></button>
      </div>
      <span className="badge" style={{ alignSelf: 'flex-start', color: meta.color }}>{meta.label}</span>

      {goal.note && <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>{goal.note}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="mono" style={{ fontWeight: 750 }}>{fmt(p.contributedCents)}</span>
        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>of {fmt(p.targetCents)}</span>
      </div>
      <ProgressBar value={p.pct / 100} warnAt={0.75} overAt={1.05} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
        {numbers}
        {p.projectedDateISO && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
            <CalendarDays size={12} /> ~{longDate(p.projectedDateISO)}
          </span>
        )}
      </div>

      <button className="btn btn-accent btn-sm" onClick={onContribute} style={{ marginTop: 'auto' }}>
        <Plus size={13} /> Contribute
      </button>
    </div>
  );
}