// @ts-check
/**
 * Auth: password hashing + JWT. Neon has no built-in auth, so the serverless
 * functions own it. Passwords are scrypt'd; tokens are HS256 JWTs signed with
 * JWT_SECRET, valid for 30 days.
 *
 * The client stores the token in localStorage under 'ft_token' and sends it
 * as Authorization: Bearer <token> on every sync request.
 */

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');

const SALT_LEN = 16;
const KEY_LEN = 64;
const SCHEME = 'scrypt';
const JWT_EXPIRES = '30d';

/** Hash a password -> '$scrypt$<hex-salt>$<hex-hash>'. */
export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LEN).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString('hex');
  return `${SCHEME}:${salt}:${hash}`;
}

/** Verify a password against a stored hash. Constant-time via scrypt. */
export function verifyPassword(password, stored) {
  const [, salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, KEY_LEN).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(test), Buffer.from(hash));
  } catch {
    return false;
  }
}

/** Sign a JWT for a user id. */
export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/** Decode + verify a JWT, returning the user id or null. */
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Read the Authorization header from a request and return the user id.
 * Returns null when missing/invalid — the caller decides whether to 401.
 */
export function reqUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return token ? verifyToken(token) : null;
}

/** Create a user. Returns the user row, or null if the email is taken. */
export async function createUser(email, password) {
  const existing = await query('select id from users where email = $1', [email.toLowerCase()]);
  if (existing.length) return null;
  const id = crypto.randomUUID();
  await query(
    `insert into users (id, email, password_hash) values ($1, $2, $3)`,
    [id, email.toLowerCase(), hashPassword(password)]
  );
  return { id, email: email.toLowerCase() };
}

/** Look up a user by email (no password). */
export async function getUserByEmail(email) {
  const rows = await query('select id, email from users where email = $1', [email.toLowerCase()]);
  return rows[0] || null;
}