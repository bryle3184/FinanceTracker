// @ts-check
/**
 * Cloud sync over Neon (via Vercel serverless functions).
 *
 * When VITE_API_URL is unset, the app is 100% local — same behavior as before.
 * When set, sign-in issues a JWT (see /api/auth/login), stored in localStorage
 * under 'ft_token' and sent as Authorization: Bearer on every sync request.
 * Snapshot push/pull is last-write-wins by updated_at, resolved client-side
 * against meta.lastSyncedAt — the same contract the Supabase layer used.
 */

const TOKEN_KEY = 'ft_token';
const USER_KEY = 'ft_user';

/** Base URL for the API. Empty = same-origin (works on Vercel, where api/ is served alongside the app). */
const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';

function storage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

function readToken() {
  return storage()?.getItem(TOKEN_KEY) || null;
}

function writeSession(token, user) {
  const s = storage();
  if (!s) return;
  s.setItem(TOKEN_KEY, token);
  s.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  const s = storage();
  if (!s) return;
  s.removeItem(TOKEN_KEY);
  s.removeItem(USER_KEY);
}

/** Is cloud sync turned on at all? */
export function isConfigured() {
  return true; // the API exists; auth is optional until signed in
}

/** @returns {'local'|'configured'|'signed-in'} */
export function syncMode() {
  return readToken() ? 'signed-in' : 'configured';
}

/** Current session, or null. */
export function getSession() {
  const user = storage()?.getItem(USER_KEY);
  if (!user) return null;
  try {
    return { user: JSON.parse(user) };
  } catch {
    return null;
  }
}

/** Subscribe to auth changes. JWTs are stateless, so there's no event stream — this is a no-op hook kept for API parity. */
export function onAuthChange(_cb) {
  return () => {};
}

async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  const token = readToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal
  });
  if (!res.ok) throw new Error(`sync request failed (${res.status})`);
  return res.json();
}

/**
 * Sign in (email/password). Returns the session, or throws.
 * @param {{email:string, password:string}} creds
 */
export async function signInWithPassword({ email, password }) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (!data.ok) throw new Error(data.reason === 'invalid-credentials' ? 'Invalid email or password' : 'Sign-in failed');
  writeSession(data.token, data.user);
  return { user: data.user };
}

/** Sign up. Returns the session, or throws. */
export async function signUp({ email, password }) {
  const data = await api('/auth/signup', { method: 'POST', body: { email, password } });
  if (!data.ok) {
    throw new Error(
      data.reason === 'email-taken' ? 'That email is already registered' :
      data.reason === 'password-too-short' ? 'Password must be at least 8 characters' :
      'Sign-up failed'
    );
  }
  writeSession(data.token, data.user);
  return { user: data.user };
}

/** Sign out. */
export function signOut() {
  clearSession();
}

/**
 * Push the full snapshot.
 * @param {object} persistedState
 */
export async function pushSnapshot(persistedState) {
  const data = await api('/sync', { method: 'POST', body: { data: persistedState } });
  if (!data.ok) return { ok: false, reason: data.reason };
  return { ok: true };
}

/**
 * Pull the remote snapshot. Returns `{ok, data, updatedAt}` or `{ok:false, reason}`.
 */
export async function pullSnapshot() {
  const data = await api('/sync', { method: 'GET' });
  if (!data.ok) return { ok: false, reason: data.reason };
  return { ok: true, data: data.data ?? null, updatedAt: data.updatedAt ?? null };
}