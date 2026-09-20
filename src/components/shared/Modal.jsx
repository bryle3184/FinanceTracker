// @ts-check
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const overlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 27, 45, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  zIndex: 90,
  backdropFilter: 'blur(2px)'
};

const panel = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  width: 'min(560px, 100%)',
  maxHeight: 'min(85vh, 720px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const header = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  borderBottom: '1px solid var(--border)',
  fontWeight: 650,
  fontSize: 'var(--fs-lg)'
};

const body = { padding: '18px', overflow: 'auto' };
const footer = {
  padding: '12px 18px',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px'
};

/**
 * Accessible modal via portal. Esc closes, overlay click closes, body scroll
 * locks while open. `footer` is optional; omit it for content-only modals.
 */
export default function Modal({ open, title, onClose, children, footer: footerNode, width }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      style={overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={{ ...panel, ...(width ? { width } : {}) }} role="dialog" aria-modal="true" aria-label={title}>
        <div style={header}>
          <span>{title}</span>
          <button onClick={onClose} aria-label="Close modal" style={{ color: 'var(--text-faint)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
        <div style={body}>{children}</div>
        {footerNode && <div style={footer}>{footerNode}</div>}
      </div>
    </div>,
    document.body
  );
}