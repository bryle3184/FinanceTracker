// @ts-check
/** POST /api/auth/login { email, password } -> { ok, token, user } or 401. */

import { ensureSchema } from '../_lib/db.js';
import { getUserByEmail, verifyPassword, signToken } from '../_lib/auth.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  await ensureSchema();

  // Already logged in — just refresh the token.
  const existing = reqUser(req);
  if (existing) {
    return json(res, 200, { ok: true, token: signToken(existing), user: { id: existing } });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, reason: 'method-not-allowed' });
  }

  let body = {};
  try {
    body = req.body ? JSON.parse(req.body) : {};
  } catch {
    return json(res, 400, { ok: false, reason: 'invalid-json' });
  }

  const email = String(body.email || '').toLowerCase().trim();
  const password = String(body.password || '');
  if (!email || !password) return json(res, 400, { ok: false, reason: 'missing-credentials' });

  const user = await getUserByEmail(email);
  if (!user) return json(res, 401, { ok: false, reason: 'invalid-credentials' });

  const hashRow = await (await import('../_lib/db.js')).query(
    'select password_hash from users where id = $1',
    [user.id]
  );
  const stored = hashRow[0]?.password_hash;
  if (!stored || !verifyPassword(password, stored)) {
    return json(res, 401, { ok: false, reason: 'invalid-credentials' });
  }

  return json(res, 200, { ok: true, token: signToken(user.id), user });
}