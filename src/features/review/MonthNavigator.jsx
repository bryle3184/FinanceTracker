// @ts-check
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useNavMonth } from '../../state/store.js';
import { monthLabel } from '../../lib/date.js';

/** Prev / next month arrows with the current month label. */
export default function MonthNavigator() {
  const { monthKey } = useMonthContext();
  const nav = useNavMonth();

  return (
    <div className="row" style={{ gap: 4 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
      <span className="btn btn-ghost btn-sm" style={{ cursor: 'default', fontWeight: 650, minWidth: 96, textAlign: 'center' }}>
        {monthLabel(monthKey)}
      </span>
      <button className="btn btn-ghost btn-sm" onClick={() => nav(1)} aria-label="Next month"><ChevronRight size={16} /></button>
    </div>
  );
}