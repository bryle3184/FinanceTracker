// @ts-check
/**
 * Progress bar for budgets/goals. `value` is 0..1. Colors flip to warn/over
 * via the CSS classes when thresholds are crossed.
 */
export default function ProgressBar({ value, warnAt = 0.8, overAt = 1, children }) {
  const clamped = Math.max(0, Math.min(1, value || 0));
  const cls = clamped >= overAt ? 'over' : clamped >= warnAt ? 'warn' : '';

  return (
    <div style={{ display: 'grid', gap: '4px' }}>
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(clamped * 100)} aria-valuemin={0} aria-valuemax={100} style={{ height: 8 }}>
        <div className={`progress-fill ${cls}`} style={{ width: `${clamped * 100}%` }} />
      </div>
      {children && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{children}</div>}
    </div>
  );
}