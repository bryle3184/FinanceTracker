// @ts-check
import Modal from './Modal.jsx';

/**
 * Confirmation dialog built on Modal. Default confirm is accent; pass
 * `danger` to style it as destructive.
 */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title ?? 'Are you sure?'}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-accent'}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{message}</p>
    </Modal>
  );
}