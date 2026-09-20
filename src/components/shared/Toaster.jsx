// @ts-check
import { useStore } from '../../state/store.js';
import { X } from 'lucide-react';

const wrap = { display: 'grid', gap: '8px' };

export function Toaster() {
  const toasts = useStore((s) => s.ui.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite" style={wrap}>
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              style={{ color: 'var(--text-faint)', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}