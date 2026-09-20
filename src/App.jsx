// @ts-check
import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { ThemeProvider } from './context/ThemeProvider.jsx';
import { MonthProvider } from './context/MonthProvider.jsx';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';

export default function App() {
  useKeyboardShortcuts();

  return (
    <ThemeProvider>
      <MonthProvider>
        <RouterProvider router={router} />
      </MonthProvider>
    </ThemeProvider>
  );
}