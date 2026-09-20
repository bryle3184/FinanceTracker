// @ts-check
import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { currentMonthKey, monthLabel } from '../../lib/date.js';
import { netWorthSeries } from '../../lib/analytics/index.js';
import NetWorthChart from './NetWorthChart.jsx';
import AssetAllocationCard from './AssetAllocationCard.jsx';
import SnapshotFormModal from './SnapshotFormModal.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';

export default function NetWorthPage() {
  const netWorth = useStore((s) => s.netWorth);
  const series = netWorthSeries(netWorth);

  const [open, setOpen] = useState(false);
  const latest = series[series.length - 1];
  const latestSnapshot = latest
    ? netWorth.find((n) => n.monthKey === latest.monthKey)
    : null;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Net Worth</h1>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
            {series.length === 0
              ? 'No snapshots yet'
              : `Latest: ${monthLabel(latest.monthKey)} · ${series.length} ${series.length === 1 ? 'snapshot' : 'snapshots'}`}
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setOpen(true)}>
          <Plus size={16} /> {latest ? 'Add snapshot' : 'First snapshot'}
        </button>
      </div>

      {series.length === 0 ? (
        <div style={{ marginTop: 'var(--sp-5)' }}>
          <EmptyState icon={TrendingUp} title="Track your net worth" hint="Log assets (cash, investing, home…) and liabilities once a month to see the trend.">
            <button className="btn btn-accent" onClick={() => setOpen(true)}>First snapshot</button>
          </EmptyState>
        </div>
      ) : (
        <>
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <NetWorthChart series={series} />
          </div>
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <AssetAllocationCard snapshot={latestSnapshot} />
          </div>
        </>
      )}

      <SnapshotFormModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}