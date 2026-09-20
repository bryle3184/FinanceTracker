// @ts-check
import { Coins, Palette, Users, Sparkles, Check, Info } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { CURRENCIES } from '../../lib/money.js';
import { useTheme } from '../../context/ThemeProvider.jsx';
import MembersManager from './MembersManager.jsx';
import SupabaseSection from './SupabaseSection.jsx';
import pkg from '../../../package.json';

const CHANGELOG = [
  {
    version: '1.0.0',
    date: '2026-09-13',
    items: [
      'Local-first PWA: works offline, installable on any device',
      'Transactions with household splitting + thread comments',
      'Budgets (per category, with rollover), recurring schedules with Upcoming/Bills projections',
      'Goals (savings / sinking funds / debt amortization), net-worth snapshots',
      'Splits & settlement calculator — minimal transfers only',
      'Insights: 6-month trend, MoM, savings rate, anomaly detection, printable PDF report',
      'Month Review retrospective, CSV import, JSON backup/restore',
      'Optional Supabase cloud sync (activate via .env)'
    ]
  }
];

const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' }
];

const sectionTitle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-md)', margin: '0 0 var(--sp-2)' };

export default function SettingsPage() {
  const currency = useStore((s) => s.settings.currency);
  const setSettings = useStore((s) => s.setSettings);
  const lastSeen = useStore((s) => s.settings.whatIsNewLastSeenVersion);
  const { theme, resolvedTheme, setTheme } = useTheme();

  const latest = CHANGELOG[0];
  const hasNew = lastSeen !== latest.version;

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 2 }}>Settings</h1>
      <p className="page-sub">App-wide preferences, household, and sync.</p>

      <div style={{ display: 'grid', gap: 'var(--sp-4)', maxWidth: 720 }}>
        {/* Currency */}
        <div className="card">
          <h2 style={sectionTitle}><Coins size={16} /> Currency</h2>
          <select
            className="select"
            style={{ maxWidth: 260 }}
            value={currency}
            onChange={(e) => setSettings({ currency: e.target.value })}
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>{c.label} ({c.symbol})</option>
            ))}
          </select>
          <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 8 }}>
            Stored amounts are unchanged when you switch — only formatting changes.
          </p>
        </div>

        {/* Theme */}
        <div className="card">
          <h2 style={sectionTitle}><Palette size={16} /> Theme</h2>
          <div className="row">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`btn ${theme === t.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTheme(t.id)}
              >
                {t.label}
                {theme === t.id && <Check size={13} />}
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 8 }}>
            {theme === 'system' ? `Following your device (${resolvedTheme} now).` : `${resolvedTheme} mode active.`}
          </p>
        </div>

        {/* Household */}
        <div className="card">
          <h2 style={sectionTitle}><Users size={16} /> Household members</h2>
          <MembersManager />
        </div>

        {/* Cloud sync */}
        <SupabaseSection />

        {/* What's new */}
        <div className="card">
          <h2 style={sectionTitle}>
            <Sparkles size={16} /> What's new
            {hasNew && <span className="badge badge-accent">v{latest.version}</span>}
            {hasNew && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => setSettings({ whatIsNewLastSeenVersion: latest.version })}
              >
                <Check size={12} /> Mark read
              </button>
            )}
          </h2>
          {CHANGELOG.map((c) => (
            <div key={c.version} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 650, fontSize: 'var(--fs-sm)' }}>v{c.version} · {c.date}</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                {c.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="card" style={{ fontSize: 'var(--fs-sm)' }}>
          <h2 style={sectionTitle}><Info size={16} /> About</h2>
          <p style={{ margin: 0 }}>
            <strong>FinanceTracker</strong> v{pkg.version} · local-first personal finance
          </p>
          <p className="muted" style={{ fontSize: 'var(--fs-xs)', margin: '6px 0 0' }}>
            Your data lives in this browser (localStorage). Export a JSON backup regularly.
          </p>
        </div>
      </div>
    </div>
  );
}