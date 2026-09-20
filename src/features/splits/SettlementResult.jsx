// @ts-check
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import Avatar from '../../components/shared/Avatar.jsx';

/**
 * Netted positions (per member) + minimal transfer instructions.
 * Positive netCents = owed to them; negative = they owe.
 */
export default function SettlementResult({ nets, settlements }) {
  const currency = useStore((s) => s.settings.currency);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--sp-4)' }}>
      <div className="card">
        <div className="card-title">Net positions</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {nets.map((n) => (
            <div key={n.memberId} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--fs-sm)' }}>
              <Avatar member={n} size={26} />
              <span style={{ flex: 1, fontWeight: 600 }}>{n.name}</span>
              <span
                className="mono"
                style={{ fontWeight: 700, color: n.netCents >= 0 ? 'var(--color-accent-strong)' : 'var(--color-danger)' }}
              >
                {n.netCents >= 0 ? '+' : '−'}{formatCents(Math.abs(n.netCents), currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">To settle, transfer</div>
        <MembersSettlements settlements={settlements} currency={currency} />
      </div>
    </div>
  );
}

/**
 * Renders each transfer "A → B : amount", resolving member ids against the
 * store's household list.
 */
function MembersSettlements({ settlements, currency }) {
  const members = useStore((s) => s.members);
  const nameOf = (id) => members.find((m) => m.id === id)?.name || 'Unknown';

  if (settlements.length === 0) {
    return <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>Already settled!</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {settlements.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--fs-sm)', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 650 }}>{nameOf(s.fromMemberId)}</div>
            <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>pays to</div>
          </div>
          <ArrowRight size={16} className="muted" />
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontWeight: 650 }}>{nameOf(s.toMemberId)}</div>
          </div>
          <span className="mono" style={{ fontWeight: 750, minWidth: 90, textAlign: 'right' }}>{formatCents(s.amountCents, currency)}</span>
        </div>
      ))}
    </div>
  );
}