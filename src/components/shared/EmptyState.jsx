// @ts-check
/**
 * Empty-state placeholder with icon, short title, one-line hint and optional
 * action slot (e.g. a "Add" button).
 */
export default function EmptyState({ icon: Icon, title, hint, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={32} />}
      <h3 style={{ margin: '4px 0 2px', color: 'var(--text)' }}>{title}</h3>
      {hint && <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: children ? 12 : 0 }}>{hint}</p>}
      {children && <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>{children}</div>}
    </div>
  );
}