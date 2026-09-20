// @ts-check
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Repeat,
  PiggyBank,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  BookOpen,
  Settings,
  Upload
} from 'lucide-react';

const links = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowRightLeft,  label: 'Transactions' },
  { to: '/recurring',  icon: Repeat,           label: 'Recurring' },
  { to: '/budgets',    icon: PiggyBank,        label: 'Budgets' },
  { to: '/goals',      icon: Target,           label: 'Goals' },
  { to: '/networth',   icon: TrendingUp,       label: 'Net Worth' },
  { to: '/splits',     icon: Users,            label: 'Splits' },
  { to: '/insights',   icon: BarChart3,        label: 'Insights' },
  { to: '/review',     icon: BookOpen,         label: 'Month Review' },
  { to: '/settings',   icon: Settings,         label: 'Settings' },
  { to: '/import',     icon: Upload,           label: 'Import / Export' }
];

const base = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '16px 12px',
  width: 'var(--sidebar-w)',
  flex: '0 0 var(--sidebar-w)',
  background: 'var(--bg-elevated)',
  borderRight: '1px solid var(--border)',
  overflowY: 'auto'
};
const link = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  fontWeight: isActive ? 650 : 500,
  color: isActive ? 'var(--color-accent)' : 'var(--text)',
  textDecoration: 'none',
  transition: 'background 120ms ease'
});

export default function Sidebar() {
  return (
    <aside style={base}>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          style={({ isActive }) => link(isActive)}
        >
          <l.icon size={18} />
          {l.label}
        </NavLink>
      ))}
    </aside>
  );
}