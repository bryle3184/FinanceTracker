// @ts-check
import { formatCents } from '../../lib/money.js';

/**
 * Shared Recharts tooltip. `currency` formats values; fires from the chart of
 * origin for items that have a `.payload.currency` (money formatter fallback).
 */
export default function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: chartVar('--bg-elevated', '#fff'),
        border: `1px solid ${chartVar('--border', '#e2e8f0')}`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-md)',
        padding: '8px 10px',
        fontSize: 'var(--fs-sm)',
        minWidth: 160
      }}
    >
      {label && <div style={{ fontWeight: 650, marginBottom: 4 }}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: chartVar('--text-muted', '#5b6b82') }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: entry.color || entry.payload?.color || '#888', display: 'inline-block' }} />
            {entry.name}
          </span>
          <span style={{ fontWeight: 650 }}>
            {formatCents(Math.round(entry.value), currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

function chartVar(name, fallback) {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}