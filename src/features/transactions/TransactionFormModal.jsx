// @ts-check
import { useState } from 'react';
import { Users, Scissors } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { todayISO } from '../../lib/date.js';
import { fairShares } from '../../lib/money.js';
import Modal from '../../components/shared/Modal.jsx';
import Field from '../../components/shared/Field.jsx';
import AmountInput from '../../components/shared/AmountInput.jsx';
import CategoryPicker from '../../components/shared/CategoryPicker.jsx';
import MemberPicker from '../../components/shared/MemberPicker.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';

/**
 * Transaction create/edit modal. Driven by `ui.activeModal`:
 *   { key:'transaction', payload:{ txId|null, defaultDate? } }
 * Supports one-per-line splitting across household members. Invariant
 * `Σ shares === amountCents` is enforced in the store's normalizeTransaction.
 */
export default function TransactionFormModal() {
  const modal = useStore((s) => s.ui.activeModal);
  const close = useStore((s) => s.setActiveModal.bind(null, null));
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const pushToast = useStore((s) => s.pushToast);
  const currency = useStore((s) => s.settings.currency);
  const members = useStore((s) => s.members);
  const defaultMemberId = useStore((s) => s.settings.defaultMemberId);

  const open = modal?.key === 'transaction' || modal?.key === 'quickEntry';
  const editing = open && Boolean(modal.payload?.txId);
  const existing = open
    ? useStore.getState().transactions.find((t) => t.id === modal.payload.txId)
    : null;

  const [type, setType] = useState('expense');
  const [amountCents, setAmountCents] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [paidByMemberId, setPaidByMemberId] = useState(null);
  const [splitOn, setSplitOn] = useState(false);
  const [splits, setSplits] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeMembers = members.filter((m) => m.isActive);

  // Seed form state whenever the modal opens/editing tx changes.
  const [seedKey, setSeedKey] = useState(null);
  const seedId = open ? (editing ? existing?.id : null) : null;
  if (open && seedId !== seedKey) {
    setSeedKey(seedId);
    if (existing) {
      setType(existing.type);
      setAmountCents(existing.amountCents);
      setCategoryId(existing.categoryId);
      setDate(existing.date);
      setDescription(existing.description || '');
      setNotes(existing.notes || '');
      setPaidByMemberId(existing.paidByMemberId ?? null);
      setSplitOn(Boolean(existing.splits?.length));
      setSplits(existing.splits?.length ? existing.splits.map((s) => ({ ...s })) : []);
    } else {
      const def = modal.payload?.defaultDate || todayISO();
      setType('expense');
      setAmountCents(null);
      setCategoryId(null);
      setDate(def);
      setDescription('');
      setNotes('');
      setPaidByMemberId(defaultMemberId ?? null);
      setSplitOn(false);
      setSplits([]);
    }
  }

  if (!open) return null;

  const diff = splitOn
    ? (amountCents || 0) - (splits || []).reduce((a, s) => a + (s.shareCents || 0), 0)
    : 0;

  const enableSplit = () => {
    setSplitOn(true);
    if (!splits.length && activeMembers.length) {
      setSplits(
        activeMembers.map((m, i) => ({
          memberId: m.id,
          shareCents: fairShares(amountCents || 0, activeMembers.length)[i] || 0
        }))
      );
    }
  };

  const splitEqual = () => {
    setSplits(
      activeMembers.map((m, i) => ({
        memberId: m.id,
        shareCents: fairShares(amountCents || 0, activeMembers.length)[i] || 0
      }))
    );
  };

  const valid =
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    categoryId &&
    type === 'income'
      ? true
      : !splitOn || diff === 0;

  const save = () => {
    const payload = {
      type,
      amountCents,
      categoryId,
      date,
      description: description.trim(),
      notes: notes.trim(),
      paidByMemberId: paidByMemberId ?? null,
      splits: splitOn ? splits.filter((s) => s.shareCents > 0 && s.memberId) : []
    };
    if (editing) updateTransaction(existing.id, payload);
    else addTransaction(payload);
    pushToast(editing ? 'Transaction updated' : 'Transaction added');
    close();
  };

  const remove = () => {
    if (!editing) return;
    deleteTransaction(existing.id);
    pushToast('Transaction deleted');
    setConfirmDelete(false);
    close();
  };

  const footer = (
    <>
      {editing && (
        <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      )}
      <button className="btn btn-ghost" onClick={close}>Cancel</button>
      <button className="btn btn-accent" disabled={!valid} onClick={save}>
        {editing ? 'Save changes' : 'Add'}
      </button>
    </>
  );

  return (
    <>
      <Modal open onClose={close} title={editing ? 'Edit transaction' : 'New transaction'} footer={footer}>
        {/* Type toggle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <button
            className={`btn ${type === 'expense' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setType('expense'); setCategoryId(null); }}
          >
            Expense
          </button>
          <button
            className={`btn ${type === 'income' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setType('income'); setCategoryId(null); }}
          >
            Income
          </button>
        </div>

        <Field label="Amount">
          <AmountInput value={amountCents} onChange={setAmountCents} currency={currency} autoFocus />
        </Field>

        <Field label="Date">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="Category">
          <CategoryPicker type={type} value={categoryId} onChange={setCategoryId} />
        </Field>

        <Field label="Description">
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Weekly groceries" />
        </Field>

        {type === 'expense' && (
          <>
            <Field label="Paid by">
              <MemberPicker value={paidByMemberId} onChange={setPaidByMemberId} allowNone />
            </Field>

            {/* Split editor */}
            <div style={{ marginTop: 4, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                <input type="checkbox" checked={splitOn} onChange={() => (splitOn ? setSplitOn(false) : enableSplit())} />
                <Users size={14} /> Split with others
              </label>
            </div>

            {splitOn && (
              <div style={{ display: 'grid', gap: '8px', marginBottom: '12px', background: 'var(--bg-sunken)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                {splits.map((s, i) => {
                  const member = members.find((m) => m.id === s.memberId);
                  return (
                    <div key={s.memberId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        className="select"
                        style={{ flex: 1, minHeight: 36 }}
                        value={s.memberId}
                        onChange={(e) => {
                          const next = splits.slice();
                          next[i] = { ...next[i], memberId: e.target.value };
                          setSplits(next);
                        }}
                      >
                        {activeMembers.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <AmountInput
                        value={s.shareCents}
                        onChange={(c) => {
                          const next = splits.slice();
                          next[i] = { ...next[i], shareCents: c || 0 };
                          setSplits(next);
                        }}
                        currency={currency}
                        className="input"
                        style={{ width: 110, textAlign: 'right', minHeight: 36 }}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 4 }}
                        aria-label="Remove split"
                        onClick={() => setSplits(splits.filter((_, j) => j !== i))}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                <div className="row wrap">
                  <button className="btn btn-ghost btn-sm" onClick={splitEqual}>
                    <Scissors size={12} /> Split equally ({activeMembers.length})
                  </button>
                  {diff !== 0 && (
                    <span className="badge badge-warn">
                      Off by {(diff > 0 ? '+' : '−') + (Math.abs(diff) / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <Field label="Notes">
          <textarea className="input textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note for this entry" />
        </Field>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete transaction?"
        message="This removes the entry and its comments. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}