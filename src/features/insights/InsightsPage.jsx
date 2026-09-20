// @ts-check
import { useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useNavMonth } from '../../state/store.js';
import { monthLabel } from '../../lib/date.js';
import { printReport } from '../../lib/pdf.js';
import MonthlyBarsChart from './MonthlyBarsChart.jsx';
import SpendPieChart from './SpendPieChart.jsx';
import MoMComparison from './MoMComparison.jsx';
import SavingsRateCard from './SavingsRateCard.jsx';
import AnomaliesCard from './AnomaliesCard.jsx';
import RolloverCard from './RolloverCard.jsx';
import ChartLegend from '../../components/charts/ChartLegend.jsx';
import { useCategoryBreakdown } from '../../state/selectors.js';
import { useStore } from '../../state/store.js';
import { categoryById } from '../../lib/categories.js';
import { formatCents } from '../../lib/money.js';

const section = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 'var(--sp-4)',
  marginTop: 'var(--sp-4)'
};

export default function InsightsPage() {
  const { monthKey } = useMonthContext();
  const nav = useNavMonth();
  const navigate = useNavigate();
  const currency = useStore((s) => s.settings.currency);
  const breakdown = useCategoryBreakdown(monthKey, 'expense');

  const exportPdf = () => {
    navigate('/print-report');
    setTimeout(() => printReport(), 350);
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Insights</h1>
        <div className="row">
          <div className="row" style={{ gap: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
            <span className="btn btn-ghost btn-sm" style={{ cursor: 'default', fontWeight: 650 }}>{monthLabel(monthKey)}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => nav(1)} aria-label="Next month"><ChevronRight size={16} /></button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={exportPdf}>
            <Printer size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div style={section}>
        <MoMComparison />
        <SavingsRateCard />
      </div>

      <div style={{ ...section, gridTemplateColumns: 'minmax(0, 2fr) minmax(240px, 1fr)', alignItems: 'start' }}>
        <MonthlyBarsChart />
        <div className="card">
          <div className="card-title">Spend by category</div>
          <SpendPieChart />
          <ChartLegend
            items={breakdown.slice(0, 8).map((b) => ({
              color: categoryById(b.categoryId).color,
              label: categoryById(b.categoryId).label,
              value: formatCents(b.amountCents, currency)
            }))}
          />
        </div>
      </div>

      <div style={section}>
        <AnomaliesCard />
        <RolloverCard />
      </div>
    </div>
  );
}