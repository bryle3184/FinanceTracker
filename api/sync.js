// @ts-check
/**
 * POST /api/sync — push the full snapshot.
 * GET  /api/sync — pull the remote snapshot (last-write-wins handled client-side).
 *
 * Auth: Authorization: Bearer <jwt>. Stateless — the token carries the user id.
 */

import { reqUser } from './_lib/auth.js';
import { ensureSchema, query } from './_lib/db.js';
import { pushSnapshot, pullSnapshot } from './_lib/snapshot.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  await ensureSchema();
  const userId = reqUser(req);
  if (!userId) return json(res, 401, { ok: false, reason: 'unauthorized' });

  if (req.method === 'POST') {
    let body = {};
    try {
      body = req.body ? JSON.parse(req.body) : {};
    } catch {
      return json(res, 400, { ok: false, reason: 'invalid-json' });
    }
    if (!body.data || typeof body.data !== 'object') {
      return json(res, 400, { ok: false, reason: 'missing-data' });
    }
    try {
      await pushSnapshot(userId, body.data);
      return json(res, 200, { ok: true });
    } catch (err) {
      console.error('push failed', err);
      return json(res, 500, { ok: false, reason: 'server-error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const snap = await pullSnapshot(userId);
      return json(res, 200, { ok: true, data: snap?.data ?? null, updatedAt: snap?.updatedAt ?? null });
    } catch (err) {
      console.error('pull failed', err);
      return json(res, 500, { ok: false, reason: 'server-error' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return json(res, 405, { ok: false, reason: 'method-not-allowed' });
}