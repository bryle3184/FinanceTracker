// @ts-check
import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useStore } from '../../state/store.js';
import GoalCard from './GoalCard.jsx';
import GoalFormModal from './GoalFormModal.jsx';
import ContributionModal from './ContributionModal.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';

export default function GoalsPage() {
  const goals = useStore((s) => s.goals);
  const [editing, setEditing] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Goals</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
            {goals.length ? `${goals.length} active ${goals.length === 1 ? 'goal' : 'goals'}` : 'Savings, debt payoff, sinking funds'}
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setEditing('new')}>
          <Plus size={16} /> New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div style={{ marginTop: 'var(--sp-5)' }}>
          <EmptyState icon={Target} title="No goals yet" hint="Save for a trip, track credit-card payoff, or build a sinking fund.">
            <button className="btn btn-accent" onClick={() => setEditing('new')}>New goal</button>
          </EmptyState>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => setEditing(g)}
              onContribute={() => setContributingGoal(g)}
            />
          ))}
        </div>
      )}

      <GoalFormModal open={editing !== null} editing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      <ContributionModal goal={contributingGoal} onClose={() => setContributingGoal(null)} />
    </div>
  );
}