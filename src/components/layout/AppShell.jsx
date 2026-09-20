// @ts-check
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import TopNav from './TopNav.jsx';
import { Toaster } from '../shared/Toaster.jsx';
import TransactionFormModal from '../../features/transactions/TransactionFormModal.jsx';

/**
 * Root shell. TopNav everywhere, Sidebar on desktop, BottomNav on mobile,
 * plus the matched route via <Outlet />.
 */
export default function AppShell() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const root = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  };
  const body = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  };
  const main = {
    flex: 1,
    overflow: 'auto',
    padding: '0 0 12px'
  };

  return (
    <div className="app-root" style={root}>
      <TopNav />

      <div style={body}>
        {!isMobile && <Sidebar />}
        <main style={main}>
          <Outlet />
        </main>
      </div>

      {isMobile && <BottomNav />}
      <TransactionFormModal />
      <Toaster />
    </div>
  );
}