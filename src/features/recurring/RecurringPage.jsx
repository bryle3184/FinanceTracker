// @ts-check
import { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { todayISO } from '../../lib/date.js';
import { occurrencesOnOrAfter } from '../../lib/analytics/index.js';
import RecurringFormModal from './RecurringFormModal.jsx';
import RecurringRow from './RecurringRow.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';

export default function RecurringPage() {
  const recurring = useStore((s) => s.recurring);
  const members = useStore((s) => s.members);
  const addTransaction = useStore((s) => s.addTransaction);
  const pushToast = useStore((s) => s.pushToast);

  const [editing, setEditing] = useState(null); // null | recurring object | 'new'
  const openForms = editing !== null;

  const now = todayISO();
  const rows = recurring.map((r) => ({
    rec: r,
    nextDate: occurrencesOnOrAfter(r, now, 90)[0]?.dueDate ?? null
  }));

  const recordNow = (r) => {
    const occ = occurrencesOnOrAfter(r, now, 90)[0];
    if (!occ) {
      pushToast('No upcoming occurrence — check the schedule dates.', 'warn');
      return;
    }
    addTransaction({
      type: r.type,
      amountCents: r.amountCents,
      categoryId: r.categoryId,
      date: occ.dueDate,
      description: r.name,
      notes: '',
      paidByMemberId: r.paidByMemberId ?? (members.find((m) => m.isActive)?.id ?? null),
      splits: [],
      recurringId: r.id
    });
    pushToast(`Recorded "${r.name}" for ${occ.dueDate}`);
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Recurring</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
            {recurring.length} {recurring.length === 1 ? 'schedule' : 'schedules'} · auto-projected into Upcoming + Bills due
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setEditing('new')}>
          <Plus size={16} /> Add schedule
        </button>
      </div>

      {recurring.length === 0 ? (
        <div style={{ marginTop: 'var(--sp-5)' }}>
          <EmptyState icon={Repeat} title="No recurring schedules" hint="Add rent, subscriptions, salary — anything that repeats monthly or yearly.">
            <button className="btn btn-accent" onClick={() => setEditing('new')}>Add schedule</button>
          </EmptyState>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 'var(--sp-4)' }}>
          {rows.map(({ rec, nextDate }) => (
            <RecurringRow
              key={rec.id}
              rec={rec}
              nextDate={nextDate}
              onEdit={() => setEditing(rec)}
              onRecord={() => recordNow(rec)}
            />
          ))}
        </div>
      )}

      <RecurringFormModal
        open={openForms}
        editing={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}