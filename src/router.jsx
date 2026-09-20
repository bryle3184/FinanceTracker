// @ts-check
import { createHashRouter } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import DashboardPage from './features/dashboard/DashboardPage.jsx';
import TransactionsPage from './features/transactions/TransactionsPage.jsx';
import RecurringPage from './features/recurring/RecurringPage.jsx';
import BudgetsPage from './features/budgets/BudgetsPage.jsx';
import GoalsPage from './features/goals/GoalsPage.jsx';
import NetWorthPage from './features/networth/NetWorthPage.jsx';
import SplitsPage from './features/splits/SplitsPage.jsx';
import InsightsPage from './features/insights/InsightsPage.jsx';
import MonthReviewPage from './features/review/MonthReviewPage.jsx';
import SettingsPage from './features/settings/SettingsPage.jsx';
import ImportExportPage from './features/import/ImportExportPage.jsx';
import PrintReport from './features/insights/PrintReport.jsx';

/**
 * HashRouter so the built app works from any static host or even file://.
 * All feature pages live under AppShell; /print-report is a dedicated screen
 * shell for the print stylesheet (no chrome).
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'recurring', element: <RecurringPage /> },
      { path: 'budgets', element: <BudgetsPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'networth', element: <NetWorthPage /> },
      { path: 'splits', element: <SplitsPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'review', element: <MonthReviewPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'import', element: <ImportExportPage /> }
    ]
  },
  {
    path: '/print-report',
    element: <PrintReport />
  }
]);