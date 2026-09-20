// @ts-check
import { useState } from 'react';
import { Plus, PiggyBank } from 'lucide-react';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useBudgetStatus } from '../../state/selectors.js';
import { monthLabel } from '../../lib/date.js';
import BudgetCard from './BudgetCard.jsx';
import BudgetFormModal from './BudgetFormModal.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';

export default function BudgetsPage() {
  const { monthKey } = useMonthContext();
  const statuses = useBudgetStatus(monthKey);

  const [editing, setEditing] = useState(null); // null | budget or 'new'

  const totalLimit = statuses.reduce((a, s) => a + s.limitCents, 0);
  const totalSpent = statuses.reduce((a, s) => a + s.spentCents, 0);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Budgets</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
            {monthLabel(monthKey)} · {statuses.length} {statuses.length === 1 ? 'category' : 'categories'}
            {totalLimit > 0 && <> · <span className="mono" style={{ fontWeight: 650 }}>${(totalSpent / 100).toLocaleString()} / ${(totalLimit / 100).toLocaleString()}</span></>}
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setEditing('new')}>
          <Plus size={16} /> Set budget
        </button>
      </div>

      {statuses.length === 0 ? (
        <div style={{ marginTop: 'var(--sp-5)' }}>
          <EmptyState icon={PiggyBank} title="No budgets for this month" hint="Set limits per category — spending tracks against them automatically.">
            <button className="btn btn-accent" onClick={() => setEditing('new')}>Set budget</button>
          </EmptyState>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
          {statuses.map((s) => (
            <BudgetCard key={s.budget.id} status={s} onEdit={() => setEditing(s.budget)} />
          ))}
        </div>
      )}

      <BudgetFormModal open={editing !== null} editing={editing === 'new' ? null : editing} monthKey={monthKey} onClose={() => setEditing(null)} />
    </div>
  );
}