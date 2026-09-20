// @ts-check
import { useState } from 'react';
import { useStore } from '../../state/store.js';
import { todayISO } from '../../lib/date.js';
import Modal from '../../components/shared/Modal.jsx';
import Field from '../../components/shared/Field.jsx';
import AmountInput from '../../components/shared/AmountInput.jsx';
import CategoryPicker from '../../components/shared/CategoryPicker.jsx';
import MemberPicker from '../../components/shared/MemberPicker.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';

export default function RecurringFormModal({ open, editing, onClose }) {
  const currency = useStore((s) => s.settings.currency);
  const defaultMemberId = useStore((s) => s.settings.defaultMemberId);
  const addRecurring = useStore((s) => s.addRecurring);
  const updateRecurring = useStore((s) => s.updateRecurring);
  const deleteRecurring = useStore((s) => s.deleteRecurring);
  const pushToast = useStore((s) => s.pushToast);

  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [amountCents, setAmountCents] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfPeriod, setDayOfPeriod] = useState(1);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [paidByMemberId, setPaidByMemberId] = useState(defaultMemberId ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [seedKey, setSeedKey] = useState(null);
  const seedId = open ? (editing?.id ?? 'new') : null;
  if (open && seedId !== seedKey) {
    setSeedKey(seedId);
    setType(editing?.type ?? 'expense');
    setName(editing?.name ?? '');
    setAmountCents(editing?.amountCents ?? null);
    setCategoryId(editing?.categoryId ?? null);
    setFrequency(editing?.frequency ?? 'monthly');
    setDayOfPeriod(editing?.dayOfPeriod ?? 1);
    setStartDate(editing?.startDate ?? todayISO());
    setEndDate(editing?.endDate ?? '');
    setActive(editing?.active ?? true);
    setNotes(editing?.notes ?? '');
    setPaidByMemberId(editing?.paidByMemberId ?? defaultMemberId ?? null);
  }

  if (!open) return null;

  const valid =
    name.trim() &&
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    categoryId &&
    dayOfPeriod >= 1 &&
    dayOfPeriod <= 31;

  const save = () => {
    if (!valid) return;
    const payload = {
      name: name.trim(),
      type,
      amountCents,
      categoryId,
      frequency,
      dayOfPeriod: Math.round(dayOfPeriod),
      startDate,
      endDate: endDate || null,
      active,
      notes: notes.trim(),
      paidByMemberId: paidByMemberId ?? null
    };
    if (editing) updateRecurring(editing.id, payload);
    else addRecurring(payload);
    pushToast(editing ? 'Schedule updated' : 'Schedule added');
    onClose();
  };

  const remove = () => {
    if (!editing) return;
    deleteRecurring(editing.id);
    pushToast('Schedule deleted');
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? 'Edit schedule' : 'New recurring schedule'}
        footer={
          <>
            {editing && (
              <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => setConfirmDelete(true)}>Delete</button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-accent" disabled={!valid} onClick={save}>{editing ? 'Save changes' : 'Add'}</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <button className={`btn ${type === 'expense' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setType('expense'); setCategoryId(null); }}>Expense</button>
          <button className={`btn ${type === 'income' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setType('income'); setCategoryId(null); }}>Income</button>
        </div>

        <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rent" /></Field>

        <Field label="Amount"><AmountInput value={amountCents} onChange={setAmountCents} currency={currency} autoFocus /></Field>

        <Field label="Category"><CategoryPicker type={type} value={categoryId} onChange={setCategoryId} /></Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Frequency">
            <select className="select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>
          <Field label="Day of period (1–31)">
            <input
              type="number"
              className="input"
              min={1}
              max={31}
              value={dayOfPeriod}
              onChange={(e) => setDayOfPeriod(Number(e.target.value))}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Starts"><input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="Ends (optional)"><input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
        </div>

        <Field label="Default payer"><MemberPicker value={paidByMemberId} onChange={setPaidByMemberId} /></Field>

        <Field label="Notes"><textarea className="input textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></Field>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active (projected into Upcoming / Bills due)
        </label>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete schedule?"
        message="Future occurrences stop being projected. Recorded transactions are kept."
        confirmLabel="Delete"
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}