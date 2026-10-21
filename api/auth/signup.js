// @ts-check
/** POST /api/auth/signup { email, password } -> { ok, token, user } or 409/400. */

import { ensureSchema } from '../_lib/db.js';
import { createUser, signToken } from '../_lib/auth.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  await ensureSchema();
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
  if (password.length < 8) return json(res, 400, { ok: false, reason: 'password-too-short' });

  const user = await createUser(email, password);
  if (!user) return json(res, 409, { ok: false, reason: 'email-taken' });

  return json(res, 201, { ok: true, token: signToken(user.id), user });
}