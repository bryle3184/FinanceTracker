// @ts-check
import { useStore } from '../../state/store.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import TransactionRow from './TransactionRow.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import { ReceiptText } from 'lucide-react';

/**
 * Transactions for the current view month + type filter. Sorted newest first.
 * `onOpen(tx)` opens the edit modal.
 */
export default function TransactionList({ type = 'all', onOpen, onAdd }) {
  const transactions = useStore((s) => s.transactions);
  const members = useStore((s) => s.members);
  const { monthKey } = useMonthContext();

  const rows = transactions
    .filter((t) => t.date.slice(0, 7) === monthKey)
    .filter((t) => type === 'all' || t.type === type)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  if (rows.length === 0) {
    return (
      <EmptyState icon={ReceiptText} title="No transactions this month" hint="Add one to start tracking.">
        <button className="btn btn-accent btn-sm" onClick={onAdd}>Add transaction</button>
      </EmptyState>
    );
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      {rows.map((tx) => (
        <TransactionRow key={tx.id} tx={tx} members={members} onOpen={() => onOpen(tx)} />
      ))}
    </div>
  );
}