// @ts-check
import { TrendingUp } from 'lucide-react';
import { useSavingsRate, useSavingsRateTrend } from '../../state/selectors.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import { monthLabel } from '../../lib/date.js';

/** Savings rate for the view month + a small 6-month trend bar strip. */
export default function SavingsRateCard() {
  const currency = useStore((s) => s.settings.currency);
  const { monthKey } = useMonthContext();
  const rate = useSavingsRate(monthKey);
  const trend = useSavingsRateTrend(6, monthKey);

  const maxRate = Math.max(1, ...trend.map((t) => t.rate ?? 0));

  return (
    <div className="card">
      <div className="card-title"><TrendingUp size={16} /> Savings rate</div>

      {/* Hero rate */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="mono" style={{ fontSize: 'var(--fs-2xl)', fontWeight: 750, color: rate == null ? 'var(--text-faint)' : rate >= 0.2 ? 'var(--color-accent-strong)' : 'var(--color-warn)' }}>
          {rate == null ? '—' : Math.round(rate * 100) + '%'}
        </span>
        <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
          of income saved in {monthLabel(monthKey)}
        </span>
      </div>

      {/* 6-month trend as bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, marginTop: 'var(--sp-4)' }}>
        {trend.map((t, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4, height: '100%' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {t.rate == null ? '—' : Math.round(t.rate * 100) + '%'}
            </span>
            <div
              title={`${monthLabel(t.monthKey)}: ${t.rate == null ? 'n/a' : Math.round(t.rate * 100) + '%'}`}
              style={{
                width: '100%',
                maxWidth: 28,
                height: `${Math.max(4, ((t.rate ?? 0) / maxRate) * 100)}%`,
                borderRadius: '4px 4px 0 0',
                background: t.rate == null ? 'var(--bg-sunken)' : t.rate >= 0.2 ? 'var(--color-accent)' : t.rate >= 0 ? 'var(--color-warn)' : 'var(--color-danger)',
                minHeight: 4
              }}
            />
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 6, textAlign: 'center' }}>
        {trend[0] && trend[trend.length - 1] ? `${monthLabel(trend[0].monthKey)} → ${monthLabel(trend[trend.length - 1].monthKey)}` : ''}
        <span className="faint"> · {formatCents(trend.reduce((a, t) => a + t.incomeCents, 0), currency)} income, {formatCents(trend.reduce((a, t) => a + t.expenseCents, 0), currency)} spent (6 mo total)</span>
      </p>
    </div>
  );
}