// @ts-check
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChartBig } from 'lucide-react';
import { useMonthlySeries } from '../../state/selectors.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useStore } from '../../state/store.js';
import { addMonths } from '../../lib/date.js';
import { formatCents } from '../../lib/money.js';
import ChartTooltip from '../../components/charts/ChartTooltip.jsx';

/** Income vs expense bars over the trailing 6 months (view month included). */
export default function MonthlyBarsChart() {
  const currency = useStore((s) => s.settings.currency);
  const { monthKey } = useMonthContext();
  const start = addMonths(monthKey, -5);
  const series = useMonthlySeries(start, monthKey);

  const data = series.map((m) => ({
    month: m.monthKey.slice(5) + '/' + m.monthKey.slice(0, 4),
    income: m.incomeCents,
    expense: m.expenseCents,
    monthKey: m.monthKey
  }));

  return (
    <div className="card">
      <div className="card-title"><BarChartBig size={16} /> 6-month trend</div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={{ stroke: 'var(--chart-grid)' }} tickLine={false} />
            <YAxis tickFormatter={(v) => compact(v / 100)} tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} axisLine={false} tickLine={false} width={42} />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Legend wrapperStyle={{ fontSize: 'var(--fs-xs)' }} />
            <Bar dataKey="income" name="Income" fill="#2dc653" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" fill="#e63946" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function compact(cents) {
  return formatCents(cents * 100, useStore.getState().settings.currency);
}