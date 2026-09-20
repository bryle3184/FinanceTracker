// @ts-check
import { MessageCircle, Users } from 'lucide-react';
import { categoryById } from '../../lib/categories.js';
import { formatCents } from '../../lib/money.js';
import { shortDate } from '../../lib/date.js';
import { useStore } from '../../state/store.js';
import Avatar from '../../components/shared/Avatar.jsx';

const row = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 4px',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left',
  background: 'transparent'
};

/**
 * One transaction row. Clicking opens the edit modal (handled by parent via
 * onOpen). Shows category dot, description, member avatar, amount, and badges
 * for splits / comments.
 */
export default function TransactionRow({ tx, members, onOpen }) {
  const cat = categoryById(tx.categoryId);
  const payer = members.find((m) => m.id === tx.paidByMemberId);
  const currency = useStore((s) => s.settings.currency);
  const commentCount = useStore((s) => s.comments.filter((c) => c.transactionId === tx.id).length);

  return (
    <button style={row} onClick={onOpen} aria-label={`Edit ${tx.description || 'transaction'}`}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flex: 'none' }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tx.description || cat.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
          <span>{shortDate(tx.date)}</span>
          <span>·</span>
          <span>{cat.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {tx.splits && tx.splits.length > 1 && (
          <span className="badge" title="Split">
            <Users size={12} /> {tx.splits.length}
          </span>
        )}
        {commentCount > 0 && (
          <span className="badge" title="Comments">
            <MessageCircle size={12} /> {commentCount}
          </span>
        )}
        {payer && <Avatar member={payer} size={24} />}
        <span
          className="mono"
          style={{
            fontWeight: 650,
            fontSize: 'var(--fs-sm)',
            color: tx.type === 'expense' ? 'var(--text)' : 'var(--color-accent-strong)'
          }}
        >
          {formatCents(tx.amountCents, currency, { signed: tx.type === 'expense' })}
        </span>
      </div>
    </button>
  );
}