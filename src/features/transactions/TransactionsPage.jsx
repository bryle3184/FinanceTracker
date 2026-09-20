// @ts-check
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { monthEndISO, monthStartISO } from '../../lib/date.js';
import { formatCents } from '../../lib/money.js';
import TransactionList from './TransactionList.jsx';
import TransactionFormModal from './TransactionFormModal.jsx';
import Field from '../../components/shared/Field.jsx';

const fmt = (cents, cur) => formatCents(cents || 0, cur);

export default function TransactionsPage() {
  const currency = useStore((s) => s.settings.currency);
  const transactions = useStore((s) => s.transactions);
  const setActiveModal = useStore((s) => s.setActiveModal);
  const { monthKey } = useMonthContext();

  const [typeFilter, setTypeFilter] = useState('all');

  const range = transactions.filter((t) => {
    const mk = t.date.slice(0, 7);
    return mk === monthKey && (typeFilter === 'all' || t.type === typeFilter);
  });
  const total = range.reduce((a, t) => a + (t.type === 'expense' ? -t.amountCents : t.amountCents), 0);

  const openAdd = () => setActiveModal('transaction', { txId: null, defaultDate: monthStartISO(monthKey) });

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Transactions</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            {range.length} {range.length === 1 ? 'entry' : 'entries'} ·{' '}
            <span className="mono" style={{ fontWeight: 650 }}>{fmt(total, currency)}</span>
          </p>
        </div>
        <button className="btn btn-accent" onClick={openAdd}>
          <Plus size={16} /> Add transaction
        </button>
      </div>

      <div className="row wrap" style={{ marginBottom: 'var(--sp-4)' }}>
        {['all', 'expense', 'income'].map((t) => (
          <button
            key={t}
            className={`btn btn-ghost btn-sm ${typeFilter === t ? 'btn-primary' : ''}`}
            onClick={() => setTypeFilter(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card">
        <TransactionList type={typeFilter} onOpen={(tx) => setActiveModal('transaction', { txId: tx.id })} onAdd={openAdd} />
      </div>

      <TransactionFormModal />
    </div>
  );
}