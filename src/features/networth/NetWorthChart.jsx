// @ts-check
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import { monthLabel } from '../../lib/date.js';
import ChartTooltip from '../../components/charts/ChartTooltip.jsx';

/** Net worth trend: area for net, lines for assets and liabilities. */
export default function NetWorthChart({ series }) {
  const currency = useStore((s) => s.settings.currency);

  const data = series.map((s) => ({
    month: monthLabel(s.monthKey),
    net: s.netWorth,
    assets: s.totalAssets,
    liabilities: s.totalLiabilities
  }));

  return (
    <div className="card">
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={{ stroke: 'var(--chart-grid)' }} tickLine={false} />
            <YAxis tickFormatter={(v) => formatCents(v, currency, { compact: true }).replace(/\.00$/, '')} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} width={46} />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Legend wrapperStyle={{ fontSize: 'var(--fs-xs)' }} />
            <Area type="monotone" dataKey="net" name="Net worth" fill="var(--color-accent)" stroke="var(--color-accent-strong)" strokeWidth={2} fillOpacity={0.18} />
            <Line type="monotone" dataKey="assets" name="Assets" stroke="#2dc653" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="liabilities" name="Liabilities" stroke="#e63946" strokeWidth={2} dot={false} strokeDasharray="4 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}