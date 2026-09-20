// @ts-check
import { useRef, useState } from 'react';
import { Database, FileUp, FileDown } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { exportBackup, downloadJSON, readFileAsText, parseBackup } from '../../lib/backup.js';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';

/** Full JSON backup (export) & restore (import, with confirm). */
export default function JsonBackupSection() {
  const getPersistedData = useStore((s) => s.getPersistedData);
  const importState = useStore((s) => s.importState);
  const pushToast = useStore((s) => s.pushToast);
  const inputRef = useRef(null);
  const [pending, setPending] = useState(null); // parsed backup awaiting confirm

  const onExport = () => {
    const json = exportBackup(getPersistedData());
    const date = new Date().toISOString().slice(0, 10);
    downloadJSON(json, `finance-tracker-backup-${date}.json`);
    pushToast('Backup downloaded');
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readFileAsText(file);
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      pushToast(parsed.error, 'error');
      return;
    }
    setPending(parsed.data);
    e.target.value = '';
  };

  const doRestore = () => {
    if (!pending) return;
    importState(pending);
    pushToast('Backup restored — data replaced');
    setPending(null);
  };

  return (
    <div className="card">
      <div className="card-title"><Database size={16} /> JSON backup &amp; restore</div>
      <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 0 }}>
        Backups hold every collection plus settings. Restoring replaces the current dataset — export regularly.
      </p>
      <div className="row">
        <button onClick={onExport} className="btn btn-ghost">
          <FileDown size={14} /> Export backup
        </button>
        <button onClick={() => inputRef.current?.click()} className="btn btn-ghost">
          <FileUp size={14} /> Restore from file
        </button>
        <input ref={inputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={onFile} />
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Restore backup?"
        message="This REPLACES all current data (transactions, budgets, goals…) with the backup contents. This cannot be undone. Consider exporting your current data first."
        confirmLabel="Restore"
        danger
        onConfirm={doRestore}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}