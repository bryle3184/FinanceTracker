# FinanceTracker

A local-first personal finance tracker PWA — income, expenses, budgets, goals,
net worth, splits & insights. Works offline; data lives in this browser.

## Optional Neon cloud sync

Deploy the API (Vercel) and set `VITE_API_URL` to enable optional sync across
devices. Without it the app is 100% local.

### Deploy

1. [Create a Neon project](https://neon.tech) and copy the connection string
   (the `DATABASE_URL`).
2. Run the schema: `psql "$DATABASE_URL" -f db/schema.sql`
3. In the Vercel project settings, add two environment variables:
   - `DATABASE_URL` → your Neon connection string
   - `JWT_SECRET` → a random 32+ char secret (the app signs auth JWTs with it)
   - `VITE_API_URL` → the deployed app's URL (or leave blank to serve API on the
     same origin)
4. Deploy: `vercel --prod`

`vercel.json` maps `/api/*` to Node 22 serverless functions (`api/*.js`) and
injects `DATABASE_URL`/`JWT_SECRET` into them.

### Local dev

```bash
npm install
npm run dev
```

The API functions aren't run by Vite — to test sync locally, deploy to Vercel or
run a small server (e.g. `vercel dev`) that serves both `dist/` and `api/`.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — production build → `dist/`
- `npm run smoke` — pure-logic self-tests for the analytics/money/date layers