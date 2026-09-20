// @ts-check
import { useState } from 'react';
import { useStore } from '../../state/store.js';
import { EXPENSE_CATEGORIES } from '../../lib/categories.js';
import Modal from '../../components/shared/Modal.jsx';
import Field from '../../components/shared/Field.jsx';
import AmountInput from '../../components/shared/AmountInput.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';

/**
 * Set / edit a per-category monthly budget. One budget per (category, month).
 * `editing` is an existing budget object (edit) or null (create). `monthKey`
 * is fixed to the page's current month so the numbers land in the right row.
 */
export default function BudgetFormModal({ open, editing, monthKey, onClose }) {
  const currency = useStore((s) => s.settings.currency);
  const upsertBudget = useStore((s) => s.upsertBudget);
  const updateBudget = useStore((s) => s.updateBudget);
  const deleteBudget = useStore((s) => s.deleteBudget);
  const pushToast = useStore((s) => s.pushToast);

  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? null);
  const [limitCents, setLimitCents] = useState(editing?.limitCents ?? null);
  const [essential, setEssential] = useState(editing?.essential ?? false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-seed when switching between create/edit.
  const [seedKey, setSeedKey] = useState(null);
  const seedId = open ? (editing?.id ?? 'new') : null;
  if (open && seedId !== seedKey) {
    setSeedKey(seedId);
    setCategoryId(editing?.categoryId ?? null);
    setLimitCents(editing?.limitCents ?? null);
    setEssential(editing?.essential ?? false);
  }

  if (!open) return null;

  const save = () => {
    if (!categoryId || !Number.isFinite(limitCents) || limitCents <= 0) return;
    const payload = { categoryId, monthKey, limitCents, essential };
    if (editing) updateBudget(editing.id, payload);
    else upsertBudget(payload);
    pushToast(editing ? 'Budget updated' : 'Budget set');
    onClose();
  };

  const remove = () => {
    if (!editing) return;
    deleteBudget(editing.id);
    pushToast('Budget removed');
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? 'Edit budget' : `Set budget · ${monthKey}`}
        footer={
          <>
            {editing && (
              <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => setConfirmDelete(true)}>Delete</button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-accent" disabled={!categoryId || !limitCents} onClick={save}>
              {editing ? 'Save changes' : 'Set budget'}
            </button>
          </>
        }
      >
        <Field label="Category">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6 }}>
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`btn btn-sm ${categoryId === c.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setCategoryId(c.id)}
                style={{ justifyContent: 'flex-start', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{ width: 9, height: 9, borderRadius: 2, background: c.color, flex: 'none' }} />
                {c.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Monthly limit">
          <AmountInput value={limitCents} onChange={setLimitCents} currency={currency} autoFocus />
        </Field>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={essential} onChange={(e) => setEssential(e.target.checked)} />
          Essential category (flags this budget as must-pay)
        </label>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete budget?"
        message="This removes the budget for this month. Transactions are kept."
        confirmLabel="Delete"
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}