// @ts-check
import { useState } from 'react';
import { Cloud, CloudOff, LogIn, RefreshCw, ArrowUpToLine } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { syncMode, signInWithPassword, signOut, pushSnapshot, pullSnapshot, isConfigured } from '../../lib/supabase.js';
import Field from '../../components/shared/Field.jsx';

/**
 * Optional cloud sync. Only active when VITE_SUPABASE_URL + anon key are set
 * (see .env.example). Local mode is fully functional — this section just tells
 * the user why sync is greyed out.
 *
 * Flow: sign in -> on "Sync now" or "Migrate local → cloud", push the current
 * snapshot; on sign-in, if remote is newer, pull it. LWW by updated_at.
 */
export default function SupabaseSection() {
  const getPersistedData = useStore((s) => s.getPersistedData);
  const importState = useStore((s) => s.importState);
  const meta = useStore((s) => s.meta);
  const setLastSyncedAt = useStore((s) => s.setLastSyncedAt);
  const pushToast = useStore((s) => s.pushToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const mode = syncMode();

  const doSignIn = async () => {
    if (mode !== 'configured') return;
    setBusy(true);
    try {
      await signInWithPassword({ email, password });
      setSignedIn(true);
      const remote = await pullSnapshot();
      if (remote.ok && remote.data && remote.updatedAt > (meta.lastSyncedAt || '')) {
        importState(remote.data);
        pushToast('Synced newer cloud data to this device');
      } else {
        await pushSnapshot(getPersistedData());
      }
      setLastSyncedAt(new Date().toISOString());
      pushToast('Signed in + synced');
    } catch (err) {
      pushToast(err.message || 'Sign-in failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const doSync = async () => {
    setBusy(true);
    try {
      const remote = await pullSnapshot();
      if (remote.ok && remote.data && remote.updatedAt > (meta.lastSyncedAt || '')) {
        importState(remote.data);
      } else {
        await pushSnapshot(getPersistedData());
      }
      setLastSyncedAt(new Date().toISOString());
      pushToast('Sync complete');
    } catch (err) {
      pushToast(err.message || 'Sync failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const doMigrate = async () => {
    setBusy(true);
    try {
      await pushSnapshot(getPersistedData());
      setLastSyncedAt(new Date().toISOString());
      pushToast('Local data uploaded to cloud');
    } catch (err) {
      pushToast(err.message || 'Upload failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!isConfigured()) {
    return (
      <div className="card" style={{ opacity: 0.8 }}>
        <div className="card-title"><CloudOff size={16} /> Cloud sync</div>
        <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 0 }}>
          <span className="badge">local-only</span>
          Everything is stored in this browser. To enable optional sync, add VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY to <code>.env</code> and rebuild.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">
        <Cloud size={16} /> Cloud sync
        <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
          {signedIn ? 'signed in' : 'configured'}
        </span>
      </div>

      {!signedIn ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password"><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          </div>
          <button className="btn btn-ghost" disabled={busy || !email || !password} onClick={doSignIn}>
            <LogIn size={14} /> {busy ? 'Working…' : 'Sign in & sync'}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} disabled={busy} onClick={doMigrate}>
            <ArrowUpToLine size={13} /> Upload local → cloud
          </button>
        </>
      ) : (
        <div className="row wrap">
          <button className="btn btn-ghost" disabled={busy} onClick={doSync}>
            <RefreshCw size={14} /> {busy ? 'Syncing…' : 'Sync now'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={async () => { await signOut(); setSignedIn(false); pushToast('Signed out'); }}>
            Sign out
          </button>
        </div>
      )}

      {meta.lastSyncedAt && (
        <p className="muted" style={{ fontSize: 'var(--fs-xs)', margin: '12px 0 0' }}>
          Last synced: {new Date(meta.lastSyncedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}