// @ts-check
import { useEffect } from 'react';
import { useStore } from '../state/store.js';

/**
 * Global keyboard shortcuts:
 *   - Cmd/Ctrl+N  -> open quick-entry transaction modal
 *   - Esc         -> close any active modal
 * Extend with more shortcuts here as features land.
 */
export function useKeyboardShortcuts() {
  const setActiveModal = useStore((s) => s.setActiveModal);
  const activeModal = useStore((s) => s.ui.activeModal);

  useEffect(() => {
    const isTypingTarget = (t) => {
      const el = /** @type {HTMLElement} */ (t);
      if (el.isContentEditable) return true;
      const tag = el.tagName?.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select';
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === 'n' || e.key === 'N')) {
        // Let the user type N in inputs without triggering quick entry.
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        setActiveModal('quickEntry');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setActiveModal, activeModal]);
}