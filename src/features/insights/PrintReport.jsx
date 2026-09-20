// @ts-check
import { useEffect } from 'react';
import { useStore } from '../../state/store.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { monthLabel, todayISO } from '../../lib/date.js';
import { monthlyTotals, categoryBreakdown, detectAnomalies } from '../../lib/analytics/index.js';
import { categoryById } from '../../lib/categories.js';
import { formatCents } from '../../lib/money.js';

/**
 * Print-only month report rendered at /print-report. On screen this route shows
 * a "Save as PDF" hint; window.print() from Insights triggers the dialog and
 * print.css renders this as a clean doc.
 */
export default function PrintReport() {
  const currency = useStore((s) => s.settings.currency);
  const transactions = useStore((s) => s.transactions);
  const { monthKey } = useMonthContext();

  // Auto-open the print dialog when this route mounts (from Insights Export).
  useEffect(() => {
    const t = setTimeout(() => window.print(), 250);
    return () => clearTimeout(t);
  }, []);

  const totals = monthlyTotals(transactions, monthKey);
  const breakdown = categoryBreakdown(transactions, monthKey, 'expense');
  const anomalies = detectAnomalies(transactions, monthKey);

  const fmt = (c) => formatCents(c, currency);
  const daily = transactions
    .filter((t) => t.date.slice(0, 7) === monthKey)
    .sort((a, b) => b.amountCents - a.amountCents);

  return (
    <div className="print-report page">
      <h1>FinanceTracker — {monthLabel(monthKey)}</h1>
      <p className="muted">Generated {todayISO()} · all amounts in {currency}</p>

      <section>
        <h2>Summary</h2>
        <table>
          <tbody>
            <tr>
              <th className="left">Income</th>
              <td>{fmt(totals.incomeCents)}</td>
            </tr>
            <tr>
              <th className="left">Expenses</th>
              <td>{fmt(-totals.expenseCents)}</td>
            </tr>
            <tr>
              <th className="left">Net</th>
              <td>{fmt(totals.netCents)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Spend by category</h2>
        <table>
          <thead>
            <tr><th className="left">Category</th><th>Amount</th><th>%</th></tr>
          </thead>
          <tbody>
            {breakdown.map((b) => {
              const meta = categoryById(b.categoryId);
              return (
                <tr key={b.categoryId}>
                  <td className="left">{meta.label}</td>
                  <td>{fmt(b.amountCents)}</td>
                  <td>{totals.expenseCents ? Math.round((b.amountCents / totals.expenseCents) * 100) : 0}%</td>
                </tr>
              );
            })}
            {breakdown.length === 0 && (
              <tr><td className="left" colSpan={3}>No expenses recorded.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Largest transactions</h2>
        <table>
          <thead>
            <tr><th className="left">Date</th><th className="left">Description</th><th className="left">Category</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {daily.slice(0, 12).map((tx) => (
              <tr key={tx.id}>
                <td className="left">{tx.date}</td>
                <td className="left">{tx.description || '—'}</td>
                <td className="left">{categoryById(tx.categoryId).label}</td>
                <td>{fmt(tx.type === 'expense' ? -tx.amountCents : tx.amountCents)}</td>
              </tr>
            ))}
            {daily.length === 0 && (
              <tr><td className="left" colSpan={4}>No transactions recorded.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {anomalies.length > 0 && (
        <section>
          <h2>Spending anomalies</h2>
          <table>
            <thead>
              <tr><th className="left">Description</th><th className="left">Category</th><th>Amount</th><th>vs median</th></tr>
            </thead>
            <tbody>
              {anomalies.map((a) => (
                <tr key={a.transaction.id}>
                  <td className="left">{a.transaction.description || '—'}</td>
                  <td className="left">{categoryById(a.transaction.categoryId).label}</td>
                  <td>{fmt(a.transaction.amountCents)}</td>
                  <td>{a.factor}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="muted" style={{ fontSize: '9pt', marginTop: 16 }}>
        Monthly report · FinanceTracker
      </p>
    </div>
  );
}