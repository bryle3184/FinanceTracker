// @ts-check
import { useState } from 'react';
import { useStore } from '../../state/store.js';
import { currentMonthKey } from '../../lib/date.js';
import { formatCents } from '../../lib/money.js';
import Modal from '../../components/shared/Modal.jsx';
import Field from '../../components/shared/Field.jsx';
import AmountInput from '../../components/shared/AmountInput.jsx';
import MonthPicker from '../../components/shared/MonthPicker.jsx';

const ASSET_CLASSES = [
  'checking', 'savings', 'cash', 'investments', 'retirement', 'real_estate', 'vehicle'
];
const LIABILITY_CLASSES = [
  'credit_cards', 'mortgage', 'auto_loan', 'student_loan', 'personal_loan'
];

const label = (cls) =>
  cls.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

/**
 * Monthly net-worth snapshot. One per month (upsert). Every nonzero class is
 * stored; empty ones are omitted so exports stay lean.
 */
export default function SnapshotFormModal({ open, onClose }) {
  const currency = useStore((s) => s.settings.currency);
  const upsertNetWorth = useStore((s) => s.upsertNetWorth);
  const pushToast = useStore((s) => s.pushToast);

  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [assets, setAssets] = useState(() => Object.fromEntries(ASSET_CLASSES.map((c) => [c, null])));
  const [liabilities, setLiabilities] = useState(() => Object.fromEntries(LIABILITY_CLASSES.map((c) => [c, null])));
  const [note, setNote] = useState('');

  if (!open) return null;

  const setA = (cls, v) => setAssets({ ...assets, [cls]: v });
  const setL = (cls, v) => setLiabilities({ ...liabilities, [cls]: v });

  const payload = {
    monthKey,
    assets: ASSET_CLASSES.filter((c) => assets[c] > 0).map((c) => ({ class: c, name: null, valueCents: assets[c] })),
    liabilities: LIABILITY_CLASSES.filter((c) => liabilities[c] > 0).map((c) => ({ class: c, name: null, valueCents: liabilities[c] })),
    note: note.trim() || null
  };

  const hasAny = ASSET_CLASSES.some((c) => assets[c] > 0) || LIABILITY_CLASSES.some((c) => liabilities[c] > 0);

  const save = () => {
    if (!hasAny) return;
    upsertNetWorth(payload);
    pushToast(`Snapshot saved for ${monthKey}`);
    onClose();
  };

  const assetTotal = ASSET_CLASSES.reduce((a, c) => a + (assets[c] || 0), 0);
  const liabTotal = LIABILITY_CLASSES.reduce((a, c) => a + (liabilities[c] || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Net worth snapshot"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" disabled={!hasAny} onClick={save}>
            Save snapshot
          </button>
        </>
      }
    >
      <Field label="Month">
        <MonthPicker value={monthKey} onChange={setMonthKey} />
      </Field>

      <h3 style={{ fontSize: 'var(--fs-md)', marginTop: 4 }}>Assets</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ASSET_CLASSES.map((c) => (
          <Field key={c} label={label(c)}>
            <AmountInput value={assets[c]} onChange={(v) => setA(c, v)} currency={currency} />
          </Field>
        ))}
      </div>
      <div style={{ textAlign: 'right', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 4 }}>
        Total {formatCents(assetTotal, currency)}
      </div>

      <h3 style={{ fontSize: 'var(--fs-md)', marginTop: 16 }}>Liabilities</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {LIABILITY_CLASSES.map((c) => (
          <Field key={c} label={label(c)}>
            <AmountInput value={liabilities[c]} onChange={(v) => setL(c, v)} currency={currency} />
          </Field>
        ))}
      </div>
      <div style={{ textAlign: 'right', fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: 4 }}>
        Total {formatCents(-liabTotal, currency)} ·{' '}
        <span style={{ fontWeight: 650, color: assetTotal - liabTotal >= 0 ? 'var(--color-accent-strong)' : 'var(--color-danger)' }}>
          net {formatCents(assetTotal - liabTotal, currency)}
        </span>
      </div>

      <Field label="Note (optional)">
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. end-of-quarter check" />
      </Field>
    </Modal>
  );
}