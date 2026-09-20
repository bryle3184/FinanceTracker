// @ts-check
import { useStore } from '../../state/store.js';
import { formatCents } from '../../lib/money.js';
import { assetAllocation } from '../../lib/analytics/index.js';
import ChartLegend from '../../components/charts/ChartLegend.jsx';

const ASSET_COLORS = {
  checking: '#2dc653', savings: '#4cc9a4', cash: '#06d6a0',
  investments: '#48bfe3', retirement: '#3a86ff', real_estate: '#9d4edd', vehicle: '#ff70a6'
};
const LIAB_COLORS = {
  credit_cards: '#e63946', mortgage: '#d00000', auto_loan: '#fb8500', student_loan: '#f4a261', personal_loan: '#b0292f'
};

/** Asset vs liability allocation for the latest snapshot. */
export default function AssetAllocationCard({ snapshot, defaultSnapshot }) {
  const currency = useStore((s) => s.settings.currency);
  const snap = snapshot || defaultSnapshot;

  if (!snap) {
    return (
      <div className="card">
        <div className="card-title">Allocation</div>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>Add a snapshot to see the breakdown.</p>
      </div>
    );
  }

  const items = assetAllocation(snap);
  const totalAssets = snap.assets.reduce((a, x) => a + x.valueCents, 0);
  const totalLiabs = snap.liabilities.reduce((a, x) => a + x.valueCents, 0);

  const legendItems = items.map((i) => ({
    color: i.kind === 'asset' ? ASSET_COLORS[i.class] || '#4cc9a4' : LIAB_COLORS[i.class] || '#e63946',
    label: i.name || i.class,
    value: formatCents(i.valueCents, currency)
  }));

  return (
    <div className="card">
      <div className="card-title">Allocation</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12 }}>
        <div style={{ display: 'grid', gap: 8, minWidth: 170 }}>
          <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Assets</div>
          <div className="mono" style={{ fontWeight: 750 }}>{formatCents(totalAssets, currency)}</div>
          <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Liabilities</div>
          <div className="mono" style={{ fontWeight: 750, color: 'var(--color-danger)' }}>−{formatCents(totalLiabs, currency)}</div>
          <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Net worth</div>
          <div className="mono" style={{ fontWeight: 750, fontSize: 'var(--fs-lg)' }}>{formatCents(totalAssets - totalLiabs, currency)}</div>
        </div>
        <div>
          <ChartLegend items={legendItems.length ? legendItems : [{ color: '#adb5bd', label: 'No assets or liabilities', value: '' }]} />
        </div>
      </div>
    </div>
  );
}