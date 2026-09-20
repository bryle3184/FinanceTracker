// @ts-check
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartPie } from 'lucide-react';
import { useCategoryBreakdown } from '../../state/selectors.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useStore } from '../../state/store.js';
import { categoryById } from '../../lib/categories.js';
import { formatCents } from '../../lib/money.js';
import ChartTooltip from '../../components/charts/ChartTooltip.jsx';
import ChartLegend from '../../components/charts/ChartLegend.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';

/**
 * Spend-by-category donut for the view month. Top 6 categories rendered
 * individually; the rest roll into an "Other" slice.
 */
export default function SpendByCategoryCard() {
  const currency = useStore((s) => s.settings.currency);
  const { monthKey } = useMonthContext();
  const breakdown = useCategoryBreakdown(monthKey, 'expense');

  if (breakdown.length === 0) {
    return (
      <div className="card">
        <div className="card-title"><ChartPie size={16} /> Spend by category</div>
        <EmptyState title="Nothing spent yet" hint="Expenses this month will appear here." />
      </div>
    );
  }

  const total = breakdown.reduce((a, b) => a + b.amountCents, 0);
  const top = breakdown.slice(0, 6);
  const rest = breakdown.slice(6);
  const restSum = rest.reduce((a, b) => a + b.amountCents, 0);

  const data = rest.length
    ? [...top.map((c) => ({ name: categoryById(c.categoryId).label, value: c.amountCents, color: categoryById(c.categoryId).color })), { name: 'Other', value: restSum, color: '#adb5bd' }]
    : top.map((c) => ({ name: categoryById(c.categoryId).label, value: c.amountCents, color: categoryById(c.categoryId).color }));

  return (
    <div className="card">
      <div className="card-title"><ChartPie size={16} /> Spend by category</div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={data.map((d) => ({
          color: d.color,
          label: d.name,
          value: formatCents(d.value, currency)
        }))}
      />
      <div className="muted" style={{ fontSize: 'var(--fs-sm)', textAlign: 'right', marginTop: 8 }}>
        Total {formatCents(total, currency)}
      </div>
    </div>
  );
}