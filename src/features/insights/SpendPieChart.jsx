// @ts-check
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCategoryBreakdown } from '../../state/selectors.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useStore } from '../../state/store.js';
import { categoryById } from '../../lib/categories.js';
import { formatCents } from '../../lib/money.js';
import ChartTooltip from '../../components/charts/ChartTooltip.jsx';

/** Full-size spend pie for the insights page (top 8 + Other). */
export default function SpendPieChart() {
  const currency = useStore((s) => s.settings.currency);
  const { monthKey } = useMonthContext();
  const breakdown = useCategoryBreakdown(monthKey, 'expense');

  const top = breakdown.slice(0, 8);
  const rest = breakdown.slice(8);
  const restSum = rest.reduce((a, b) => a + b.amountCents, 0);

  const data = [
    ...top.map((c) => {
      const meta = categoryById(c.categoryId);
      return { name: meta.label, value: c.amountCents, color: meta.color };
    }),
    ...(rest.length ? [{ name: 'Other', value: restSum, color: '#adb5bd' }] : [])
  ];

  if (data.length === 0) {
    return <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>No expenses this month.</p>;
  }

  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}