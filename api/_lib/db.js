// @ts-check
/**
 * Neon (PostgreSQL) connection pool for Vercel serverless functions.
 *
 * @neondatabase/serverless keeps a per-invocation connection, which is what
 * Vercel's cold starts need — a plain `pg` pool would leak sockets across
 * invocations. The pool is cached module-wide so warm functions reuse it.
 */

import { Pool } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!url) {
  throw new Error('DATABASE_URL (or POSTGRES_URL) is not set');
}

/** Neon serverless pool. WebSockets are the default transport. */
export const pool = new Pool({
  connectionString: url,
  maxUses: 7500, // refresh connection before Vercel reuses it too long
});

/** Run a query, returning rows. Throws on SQL error. */
export async function query(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

/** Ensure the sync tables exist. Idempotent — safe to call on every request. */
export async function ensureSchema() {
  await pool.query(`
    create table if not exists users (
      id          text primary key,
      email       text not null unique,
      password_hash text not null,
      created_at  timestamptz not null default now()
    );

    create table if not exists snapshots (
      user_id     text primary key references users (id) on delete cascade,
      data        jsonb not null default '{}'::jsonb,
      updated_at  timestamptz not null default now()
    );
  `);
}