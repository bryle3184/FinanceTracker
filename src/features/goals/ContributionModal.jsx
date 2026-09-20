// @ts-check
import { useEffect, useState } from 'react';
import { useStore } from '../../state/store.js';
import { todayISO } from '../../lib/date.js';
import Modal from '../../components/shared/Modal.jsx';
import Field from '../../components/shared/Field.jsx';
import AmountInput from '../../components/shared/AmountInput.jsx';

/** Record a contribution (or debt payment) toward a goal. */
export default function ContributionModal({ goal, onClose }) {
  const currency = useStore((s) => s.settings.currency);
  const addContribution = useStore((s) => s.addContribution);
  const pushToast = useStore((s) => s.pushToast);

  const [amountCents, setAmountCents] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');

  // Reset per goal.
  useEffect(() => {
    if (goal) {
      setAmountCents(null);
      setDate(todayISO());
      setNote('');
    }
  }, [goal?.id]);

  if (!goal) return null;

  const save = () => {
    if (!Number.isFinite(amountCents) || amountCents <= 0) return;
    addContribution(goal.id, { amountCents, date, note: note.trim() });
    pushToast(`Contribution added to "${goal.name}"`);
    onClose();
  };

  return (
    <Modal
      open={Boolean(goal)}
      onClose={onClose}
      title={goal.kind === 'debt' ? `Payment toward ${goal.name}` : `Contribute to ${goal.name}`}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" disabled={!amountCents || amountCents <= 0} onClick={save}>Add</button>
        </>
      }
    >
      <Field label="Amount"><AmountInput value={amountCents} onChange={setAmountCents} currency={currency} autoFocus /></Field>
      <Field label="Date"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Note (optional)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. March paycheck" /></Field>
    </Modal>
  );
}