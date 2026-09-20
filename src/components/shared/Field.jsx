// @ts-check
/**
 * Labeled form field wrapper. Put the native control as children; this renders
 * the label + optional hint + layout plumbing so every form stays consistent.
 */
export default function Field({ label, hint, htmlFor, children, className = '' }) {
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)' }}>{hint}</span>}
    </div>
  );
}