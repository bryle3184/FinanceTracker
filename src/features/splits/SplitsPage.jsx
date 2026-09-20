// @ts-check
import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { useSettlements } from '../../state/selectors.js';
import { currentMonthKey, addMonths } from '../../lib/date.js';
import MonthPicker from '../../components/shared/MonthPicker.jsx';
import SettlementResult from './SettlementResult.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';

export default function SplitsPage() {
  const transactions = useStore((s) => s.transactions);

  // Default range: from the earliest transaction month to the current month.
  const earliest = useMemo(() => {
    const mks = transactions.map((t) => t.date.slice(0, 7));
    return mks.length ? mks.sort()[0] : currentMonthKey();
  }, [transactions]);

  const [from, setFrom] = useState(earliest);
  const [to, setTo] = useState(currentMonthKey());

  const info = useSettlements({ fromMonthKey: from, toMonthKey: to });

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 2 }}>Splits &amp; Settlement</h1>
      <p className="page-sub">Who paid for what, netted across members, reduced to the fewest transfers.</p>

      <div className="row wrap" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="row" style={{ gap: 8 }}>
          <MonthPicker value={from} onChange={(v) => v && setFrom(v)} />
          <span className="muted">→</span>
          <MonthPicker value={to} onChange={(v) => v && setTo(v)} />
        </div>
      </div>

      {info.nets.length === 0 || info.settlements.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nothing to settle"
          hint="Splits show up here once transactions are marked paid-by someone and split with others."
        />
      ) : (
        <SettlementResult nets={info.nets} settlements={info.settlements} />
      )}
    </div>
  );
}