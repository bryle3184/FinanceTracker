// @ts-check
/** POST /api/auth/logout — client-side token drop; stateless, so this just 200s. */

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, reason: 'method-not-allowed' });
  }
  return json(res, 200, { ok: true });
}