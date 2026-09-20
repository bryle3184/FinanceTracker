// @ts-check
import { Plus, Zap } from 'lucide-react';
import { useStore } from '../../state/store.js';
import MonthlySummaryCard from './MonthlySummaryCard.jsx';
import SpendByCategoryCard from './SpendByCategoryCard.jsx';
import BillsDueCard from './BillsDueCard.jsx';
import UpcomingRecurringCard from './UpcomingRecurringCard.jsx';

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 'var(--sp-4)',
  marginTop: 'var(--sp-4)'
};

export default function DashboardPage() {
  const setActiveModal = useStore((s) => s.setActiveModal);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Dashboard</h1>
        <div className="row">
          <button className="btn btn-accent" onClick={() => setActiveModal('transaction', { txId: null })}>
            <Plus size={16} /> Add transaction
          </button>
          <button className="btn btn-ghost" onClick={() => setActiveModal('quickEntry', {})} title="Cmd/Ctrl+N">
            <Zap size={16} /> Quick entry
          </button>
        </div>
      </div>

      <div style={{ marginTop: 'var(--sp-4)' }}>
        <MonthlySummaryCard />
      </div>

      <div style={grid}>
        <SpendByCategoryCard />
        <div style={{ display: 'grid', gap: 'var(--sp-4)', alignContent: 'start' }}>
          <BillsDueCard />
          <UpcomingRecurringCard />
        </div>
      </div>
    </div>
  );
}