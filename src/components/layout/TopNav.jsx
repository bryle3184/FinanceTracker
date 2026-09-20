// @ts-check
import { Menu, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { useMonthContext } from '../../context/MonthProvider.jsx';
import { useNavMonth } from '../../state/store.js';
import { monthLabel } from '../../lib/date.js';
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js';

const bar = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  height: 'var(--topbar-h)',
  padding: '0 16px',
  borderBottom: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  flex: '0 0 var(--topbar-h)'
};

const brand = {
  fontWeight: 750,
  fontSize: '18px',
  letterSpacing: '-0.02em',
  color: 'var(--color-brand)',
  marginRight: '8px'
};

const monthBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 10px',
  borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border-strong)',
  background: 'transparent',
  fontSize: 'var(--fs-sm)',
  fontWeight: 600,
  color: 'var(--text)'
};

export default function TopNav() {
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const { monthKey } = useMonthContext();
  const nav = useNavMonth();
  const { canInstall, install } = useInstallPrompt();

  return (
    <header style={bar}>
      <button onClick={() => toggleSidebar()} aria-label="Toggle sidebar" style={{ display: 'flex' }}>
        <Menu size={20} />
      </button>

      <span className="only-mobile" style={brand}>FinanceTracker</span>
      <span className="only-desktop" style={brand}>FinanceTracker</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
        <button onClick={() => nav(-1)} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <span style={monthBtn}>{monthLabel(monthKey)}</span>
        <button onClick={() => nav(1)} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      {canInstall && (
        <button
          onClick={install}
          aria-label="Install app"
          title="Install FinanceTracker"
          style={{ display: 'flex', color: 'var(--color-accent)', marginLeft: '8px' }}
        >
          <Download size={18} />
        </button>
      )}
    </header>
  );
}