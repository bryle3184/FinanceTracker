// @ts-check
/**
 * Snapshot push/pull over Neon. One row per user in `snapshots`, full app
 * state as JSONB. Last-write-wins by updated_at, resolved on the client by
 * comparing against meta.lastSyncedAt — the same contract the Supabase layer
 * used, so the UI layer is unchanged.
 */

import { query } from './db.js';

/** Upsert the user's snapshot. */
export async function pushSnapshot(userId, data) {
  await query(
    `insert into snapshots (user_id, data, updated_at)
       values ($1, $2, now())
       on conflict (user_id) do update
       set data = $2, updated_at = now()`,
    [userId, JSON.stringify(data)]
  );
}

/**
 * Pull the user's snapshot. Returns { data, updatedAt } or null when the user
 * has never pushed (fresh account).
 */
export async function pullSnapshot(userId) {
  const rows = await query(
    'select data, updated_at from snapshots where user_id = $1',
    [userId]
  );
  const row = rows[0];
  if (!row) return null;
  return { data: row.data, updatedAt: row.updated_at };
}