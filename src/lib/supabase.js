// @ts-check
/**
 * Optional Supabase cloud sync.
 *
 * When VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are both set, this module
 * provides auth + snapshot sync (last-write-wins by updatedAt). Otherwise all
 * functions are no-ops and the app is 100% local. The supabase client is
 * created lazily via dynamic import so the local bundle stays lean.
 */

const configured =
  typeof import.meta !== 'undefined' &&
  Boolean(import.meta.env?.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env?.VITE_SUPABASE_ANON_KEY);

/** @returns {Promise<import('@supabase/supabase-js').SupabaseClient|null>} */
async function getClient() {
  if (!configured) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  } catch {
    return null;
  }
}

export function isConfigured() {
  return configured;
}

/** @returns {'local'|'configured'|'signed-in'} */
export function syncMode() {
  return configured ? 'configured' : 'local';
}

/**
 * Sign in (email/password). Returns a session or throws.
 * @param {{email:string, password:string}} creds
 */
export async function signInWithPassword({ email, password }) {
  const client = await getClient();
  if (!client) throw new Error('Supabase is not configured.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Sign out. */
export async function signOut() {
  const client = await getClient();
  if (!client) return;
  await client.auth.signOut();
}

/** Current session, or null. */
export async function getSession() {
  const client = await getClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session;
}

/** Subscribe to auth changes. Returns an unsubscribe fn (or noop). */
export function onAuthChange(cb) {
  if (!configured) return () => {};
  let unsub = () => {};
  getClient().then((client) => {
    if (client) {
      const { data } = client.auth.onAuthStateChange((event) => cb(event));
      unsub = () => data.subscription.unsubscribe();
    }
  });
  return unsub;
}

/**
 * Push the full snapshot to Supabase (upsert the user's row).
 * @param {object} persistedState
 */
export async function pushSnapshot(persistedState) {
  const client = await getClient();
  const session = await getSession();
  if (!client || !session) return { ok: false, reason: 'no-session' };
  const { error } = await client.from('profiles').upsert(
    { id: session.user.id, data: persistedState, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

/**
 * Pull the remote snapshot. Returns `{ok, data, updatedAt}` or `{ok:false, reason}`.
 */
export async function pullSnapshot() {
  const client = await getClient();
  const session = await getSession();
  if (!client || !session) return { ok: false, reason: 'no-session' };
  const { data, error } = await client
    .from('profiles')
    .select('data, updated_at')
    .eq('id', session.user.id)
    .maybeSingle();
  if (error) return { ok: false, reason: error.message };
  return { ok: true, data: data?.data ?? null, updatedAt: data?.updated_at ?? null };
}