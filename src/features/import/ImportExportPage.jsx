// @ts-check
import { Upload, Database, FileDown, FileUp } from 'lucide-react';
import CsvImportSection from './CsvImportSection.jsx';
import JsonBackupSection from './JsonBackupSection.jsx';

export default function ImportExportPage() {
  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 2 }}>Import &amp; Export</h1>
      <p className="page-sub">Bring data in from a CSV, or back up / restore your full FinanceTracker dataset as JSON.</p>

      <div style={{ display: 'grid', gap: 'var(--sp-4)' }}>
        <CsvImportSection />
        <JsonBackupSection />
      </div>
    </div>
  );
}