// @ts-check
import { useRef, useState } from 'react';
import { Upload, FileDown, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { parseTransactions, buildCsvTemplate } from '../../lib/csv.js';
import { readFileAsText, downloadJSON } from '../../lib/backup.js';
import { fairShares } from '../../lib/money.js';

/**
 * CSV import with preview: parse -> show valid rows + quarantined malformed
 * rows -> confirm to add. Rows with unknown payer/category/amount are listed,
 * never silently dropped.
 */
export default function CsvImportSection() {
  const members = useStore((s) => s.members);
  const currency = useStore((s) => s.settings.currency);
  const addTransaction = useStore((s) => s.addTransaction);
  const pushToast = useStore((s) => s.pushToast);
  const inputRef = useRef(null);

  const [result, setResult] = useState(null); // { valid, errors }
  const [fileName, setFileName] = useState('');

  const memberIndex = {
    byId: new Map(members.map((m) => [m.id, m.id])),
    byName: new Map(members.map((m) => [m.name.toLowerCase(), m.id]))
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await readFileAsText(file);
    setResult(parseTransactions(text, memberIndex, currency));
    e.target.value = '';
  };

  const importRows = () => {
    if (!result) return;
    let added = 0;
    for (const row of result.valid) {
      const splits =
        row.splitMemberIds.length > 1
          ? row.splitMemberIds.map((memberId, i) => ({
              memberId,
              shareCents: fairShares(row.amountCents, row.splitMemberIds.length)[i] || 0
            }))
          : [];
      addTransaction({
        type: row.type,
        amountCents: row.amountCents,
        categoryId: row.categoryId,
        date: row.date,
        description: row.description,
        notes: row.notes || '',
        paidByMemberId: row.paidByMemberId,
        splits
      });
      added += 1;
    }
    pushToast(`Imported ${added} transactions from ${fileName}.`);
    setResult(null);
    setFileName('');
  };

  return (
    <div className="card">
      <div className="card-title">
        <Upload size={16} /> CSV import
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => downloadJSON(buildCsvTemplate(), 'finance-tracker-template.csv')}
        >
          <FileDown size={13} /> Template
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={onFile}
      />

      <button className="btn btn-ghost" onClick={() => inputRef.current?.click()}>
        <Upload size={14} /> Choose CSV file
      </button>

      {fileName && (
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 8 }}>{fileName}</p>
      )}

      {result && (
        <div style={{ marginTop: 'var(--sp-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span className="badge badge-accent"><CheckCircle2 size={12} /> {result.valid.length} valid</span>
            <span className={`badge ${result.errors.length ? 'badge-danger' : ''}`}>
              <XCircle size={12} /> {result.errors.length} quarantined
            </span>
          </div>

          {result.errors.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10, marginBottom: 12, maxHeight: 180, overflow: 'auto' }}>
              <div className="muted" style={{ fontSize: 'var(--fs-xs)', marginBottom: 6 }}>Malformed rows (skipped):</div>
              {result.errors.map((err, i) => (
                <div key={i} style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-danger)', display: 'flex', gap: 8 }}>
                  <span className="faint">row {err.row}</span>
                  {err.reason}
                </div>
              ))}
            </div>
          )}

          {result.valid.length > 0 && (
            <button className="btn btn-accent" onClick={importRows}>
              Import {result.valid.length} {result.valid.length === 1 ? 'transaction' : 'transactions'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}