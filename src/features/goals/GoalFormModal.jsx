// @ts-check
import { useState } from 'react';
import { useStore } from '../../state/store.js';
import Modal from '../../components/shared/Modal.jsx';
import Field from '../../components/shared/Field.jsx';
import AmountInput from '../../components/shared/AmountInput.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';

/**
 * Create/edit a goal. Kind switch drives the field set:
 *  - savings: target (+ optional deadline)
 *  - sinkingFund: target + monthly contribution (+ optional deadline)
 *  - debt: principal + APR% + min payment (+ optional deadline)
 * Interest is stored in basis points (bps = pct * 100).
 */
export default function GoalFormModal({ open, editing, onClose }) {
  const currency = useStore((s) => s.settings.currency);
  const addGoal = useStore((s) => s.addGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const pushToast = useStore((s) => s.pushToast);

  const [kind, setKind] = useState('savings');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [targetCents, setTargetCents] = useState(null);
  const [monthlyContributionCents, setMonthlyContributionCents] = useState(null);
  const [principalCents, setPrincipalCents] = useState(null);
  const [ratePct, setRatePct] = useState('');
  const [minPaymentCents, setMinPaymentCents] = useState(null);
  const [deadline, setDeadline] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [seedKey, setSeedKey] = useState(null);
  const seedId = open ? (editing?.id ?? 'new') : null;
  if (open && seedId !== seedKey) {
    setSeedKey(seedId);
    setKind(editing?.kind ?? 'savings');
    setName(editing?.name ?? '');
    setNote(editing?.note ?? '');
    setTargetCents(editing?.targetCents ?? null);
    setMonthlyContributionCents(editing?.monthlyContributionCents ?? null);
    setPrincipalCents(editing?.principalCents ?? null);
    setRatePct(editing ? (editing.interestRateBps / 100).toFixed(2) : '');
    setMinPaymentCents(editing?.minPaymentCents ?? null);
    setDeadline(editing?.deadline ?? '');
  }

  if (!open) return null;

  const rateBps = Math.round(parseFloat(ratePct) * 100) || 0;

  const validForKind =
    kind === 'savings'
      ? targetCents > 0
      : kind === 'sinkingFund'
        ? targetCents > 0 && monthlyContributionCents > 0
        : principalCents > 0 && rateBps >= 0 && minPaymentCents > 0;

  const valid = name.trim() && validForKind;

  const save = () => {
    if (!valid) return;
    const base = { name: name.trim(), note: note.trim(), deadline: deadline || null };
    let payload;
    if (kind === 'savings') payload = { ...base, kind, targetCents };
    else if (kind === 'sinkingFund') payload = { ...base, kind, targetCents, monthlyContributionCents };
    else payload = { ...base, kind, principalCents, interestRateBps: rateBps, minPaymentCents };

    if (editing) updateGoal(editing.id, payload);
    else addGoal(payload);
    pushToast(editing ? 'Goal updated' : 'Goal created');
    onClose();
  };

  const remove = () => {
    if (!editing) return;
    deleteGoal(editing.id);
    pushToast('Goal deleted');
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? 'Edit goal' : 'New goal'}
        footer={
          <>
            {editing && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => setConfirmDelete(true)}>Delete</button>}
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-accent" disabled={!valid} onClick={save}>{editing ? 'Save changes' : 'Create goal'}</button>
          </>
        }
      >
        <Field label="Goal type">
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="savings">Savings</option>
            <option value="sinkingFund">Sinking fund</option>
            <option value="debt">Debt payoff</option>
          </select>
        </Field>

        <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Japan trip, Credit card #2" /></Field>

        {kind === 'savings' && (
          <Field label="Target amount"><AmountInput value={targetCents} onChange={setTargetCents} currency={currency} autoFocus /></Field>
        )}
        {kind === 'sinkingFund' && (
          <>
            <Field label="Target amount"><AmountInput value={targetCents} onChange={setTargetCents} currency={currency} autoFocus /></Field>
            <Field label="Monthly contribution"><AmountInput value={monthlyContributionCents} onChange={setMonthlyContributionCents} currency={currency} /></Field>
          </>
        )}
        {kind === 'debt' && (
          <>
            <Field label="Current balance (principal)"><AmountInput value={principalCents} onChange={setPrincipalCents} currency={currency} autoFocus /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="APR %">
                <input className="input" inputMode="decimal" value={ratePct} onChange={(e) => setRatePct(e.target.value)} placeholder="e.g. 22.99" />
              </Field>
              <Field label="Min payment / month"><AmountInput value={minPaymentCents} onChange={setMinPaymentCents} currency={currency} /></Field>
            </div>
          </>
        )}

        <Field label="Deadline (optional)">
          <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>

        <Field label="Note"><textarea className="input textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete goal?"
        message="The goal and its contribution history will be removed."
        confirmLabel="Delete"
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}