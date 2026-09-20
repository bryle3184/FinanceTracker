// @ts-check
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, PiggyBank, BarChart3 } from 'lucide-react';

const links = [
  { to: '/',             icon: LayoutDashboard, label: 'Home' },
  { to: '/transactions', icon: ArrowRightLeft,  label: 'History' },
  { to: '/budgets',      icon: PiggyBank,       label: 'Budgets' },
  { to: '/insights',     icon: BarChart3,       label: 'Insights' }
];

const nav = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  height: 'var(--bottomnav-h)',
  background: 'var(--bg-elevated)',
  borderTop: '1px solid var(--border)',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)'
};
const linkStyle = (isActive) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  fontSize: '10px',
  color: isActive ? 'var(--color-accent)' : 'var(--text-muted)',
  textDecoration: 'none',
  fontWeight: isActive ? 650 : 500
});

export default function BottomNav() {
  return (
    <nav style={nav}>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          style={({ isActive }) => linkStyle(isActive)}
        >
          <l.icon size={20} />
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}