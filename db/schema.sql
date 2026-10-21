-- FinanceTracker cloud sync schema (Neon / PostgreSQL).
-- Run this in the Neon SQL editor. Idempotent: can be re-run.

-- One user per account. Passwords are scrypt'd server-side; the client only
-- holds a 30-day JWT.
create table if not exists users (
  id            text primary key,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- One row per user, holding the full app snapshot as JSONB.
create table if not exists snapshots (
  user_id     text primary key references users (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Bump updated_at on every upsert.
create or replace function public.touch_snapshots() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists snapshots_touch on public.snapshots;
create trigger snapshots_touch
  before update on public.snapshots
  for each row execute function public.touch_snapshots();