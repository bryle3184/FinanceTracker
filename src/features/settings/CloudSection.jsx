// @ts-check
import { useState } from 'react';
import { Cloud, CloudOff, LogIn, UserPlus, RefreshCw, ArrowUpToLine } from 'lucide-react';
import { useStore } from '../../state/store.js';
import { syncMode, signInWithPassword, signUp, signOut, pushSnapshot, pullSnapshot, isConfigured } from '../../lib/sync.js';
import Field from '../../components/shared/Field.jsx';

/**
 * Cloud sync over Neon (Vercel serverless). Only active when the API is
 * deployed — otherwise this section tells the user why it's greyed out.
 *
 * Flow: sign in/up -> on "Sync now" or "Migrate local → cloud", push the
 * current snapshot; on sign-in, if remote is newer, pull it. LWW by updatedAt.
 */
export default function CloudSection() {
  const getPersistedData = useStore((s) => s.getPersistedData);
  const importState = useStore((s) => s.importState);
  const meta = useStore((s) => s.meta);
  const setLastSyncedAt = useStore((s) => s.setLastSyncedAt);
  const pushToast = useStore((s) => s.pushToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'

  const doAuth = async () => {
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp({ email, password });
      } else {
        await signInWithPassword({ email, password });
      }
      setSignedIn(true);
      const remote = await pullSnapshot();
      if (remote.ok && remote.data && remote.updatedAt > (meta.lastSyncedAt || '')) {
        importState(remote.data);
        pushToast('Synced newer cloud data to this device');
      } else {
        await pushSnapshot(getPersistedData());
      }
      setLastSyncedAt(new Date().toISOString());
      pushToast(mode === 'signup' ? 'Account created + synced' : 'Signed in + synced');
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
          Everything is stored in this browser. Deploy the API (see README) and set
          <code>VITE_API_URL</code> to enable optional sync.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">
        <Cloud size={16} /> Cloud sync
        <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
          {signedIn ? 'signed in' : syncMode()}
        </span>
      </div>

      {!signedIn ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Password"><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          </div>
          <button className="btn btn-ghost" disabled={busy || !email || !password} onClick={doAuth}>
            {mode === 'signup' ? <UserPlus size={14} /> : <LogIn size={14} />}
            {busy ? 'Working…' : mode === 'signup' ? 'Create account & sync' : 'Sign in & sync'}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} disabled={busy} onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
            {mode === 'signup' ? 'Have an account? Sign in' : 'No account? Create one'}
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
          <button className="btn btn-ghost btn-sm" onClick={async () => { signOut(); setSignedIn(false); pushToast('Signed out'); }}>
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