// @ts-check
import { useState } from 'react';
import { Plus, Pencil, RotateCcw, Trash2, User } from 'lucide-react';
import { useStore } from '../../state/store.js';
import Avatar from '../../components/shared/Avatar.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';

const PALETTE = ['#4cc9a4', '#48bfe3', '#f4a261', '#ff70a6', '#9d4edd', '#3a86ff', '#e63946', '#80b918'];

/** Household members: add, rename, deactivate/reactivate (soft-delete). */
export default function MembersManager() {
  const members = useStore((s) => s.members);
  const defaultMemberId = useStore((s) => s.settings.defaultMemberId);
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);
  const deactivateMember = useStore((s) => s.deactivateMember);
  const reactivateMember = useStore((s) => s.reactivateMember);
  const deleteMember = useStore((s) => s.deleteMember);
  const pushToast = useStore((s) => s.pushToast);

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMember(deleteTarget.id);
    pushToast(`${deleteTarget.name} permanently deleted`);
    setDeleteTarget(null);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addMember(trimmed, PALETTE[members.length % PALETTE.length]);
    setName('');
    pushToast(`Added ${trimmed}`);
  };

  const saveEdit = (id) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    updateMember(id, { name: trimmed, initials: trimmed.slice(0, 2).toUpperCase() });
    setEditingId(null);
    pushToast('Member updated');
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {members.map((m) => (
        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--fs-sm)' }}>
          <Avatar member={m} size={30} />
          {editingId === m.id ? (
            <input
              className="input"
              style={{ flex: 1, minHeight: 34 }}
              value={editName}
              autoFocus
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEdit(m.id)}
            />
          ) : (
            <span style={{ flex: 1, fontWeight: 600, color: m.isActive ? 'var(--text)' : 'var(--text-faint)' }}>
              {m.name}
              {m.id === defaultMemberId && <span className="badge" style={{ marginLeft: 8 }}>default</span>}
              {!m.isActive && <span className="badge" style={{ marginLeft: 8, color: 'var(--text-faint)' }}>hidden</span>}
            </span>
          )}

          {editingId === m.id ? (
            <button className="btn btn-accent btn-sm" onClick={() => saveEdit(m.id)}>Save</button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} aria-label="Rename member" onClick={() => { setEditingId(m.id); setEditName(m.name); }}>
                <Pencil size={13} />
              </button>
              {m.isActive ? (
                <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} title="Hide member" aria-label="Hide member" onClick={() => { deactivateMember(m.id); pushToast(`${m.name} hidden`); }}>
                  <User size={13} className="muted" />
                </button>
              ) : (
                <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} title="Reactivate member" onClick={() => { reactivateMember(m.id); pushToast(`${m.name} reactivated`); }}>
                  <RotateCcw size={13} />
                </button>
              )}
              <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} title="Delete permanently" aria-label="Delete member permanently" onClick={() => setDeleteTarget(m)}>
                <Trash2 size={13} className="muted" />
              </button>
            </>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input
          className="input"
          style={{ flex: 1, minHeight: 38 }}
          placeholder="Add a household member…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button className="btn btn-accent" onClick={submit} disabled={!name.trim()}>
          <Plus size={14} /> Add
        </button>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${deleteTarget?.name}?`}
        message="They'll be removed from the household permanently. Transactions, splits, and comments they were part of stay in your history but will show as Unknown."
        confirmLabel="Delete permanently"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}