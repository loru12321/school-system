# Supabase Edge Gateway Setup

This project currently uses a custom login flow backed by `system_users`.
So the recommended path is:

- keep the current front-end login
- protect new management tables with RLS
- access those new tables only through one Edge Function endpoint

The front end currently prefers `edu-gateway-v2` and will automatically fall back to `edu-gateway` if the v2 endpoint is not deployed yet.

## Files added

- `supabase/sql/001_management_tables.sql`
- `supabase/sql/002_management_rls_minimal.sql`
- `supabase/functions/edu-gateway/index.ts`

## Step 1: Create the management tables

In Supabase Dashboard:

1. Open `SQL Editor`
2. Run `supabase/sql/001_management_tables.sql`
3. Run `supabase/sql/002_management_rls_minimal.sql`

Result:

- the new tables are created
- RLS is enabled
- browser direct access is blocked for `anon` and `authenticated`

## Step 2: Create the Edge Function

In Supabase Dashboard:

1. Open `Edge Functions`
2. Create a new function named `edu-gateway-v2` (recommended, matches the default front-end config)
3. Replace the default code with `supabase/functions/edu-gateway/index.ts`
4. Deploy

If you already have a function named `edu-gateway`, the current front end will still fall back to it automatically. Keeping both names deployed is also safe during migration.

## Step 3: Add secrets

In Supabase Dashboard:

1. Open `Project Settings`
2. Open `Edge Functions`
3. Add these secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_SESSION_SECRET`

`APP_SESSION_SECRET` should be a long random string.

## Step 4: Test actions

Recommended test order:

1. `login`
2. `session.verify`
3. `alias.list`
4. `warning.list`
5. `rectify.list`

## Sample request body

### login

```json
{
  "action": "login",
  "payload": {
    "username": "admin",
    "password": "admin123"
  }
}
```

### warning.list

```json
{
  "action": "warning.list",
  "payload": {
    "project_key": "cohort::2022",
    "cohort_id": "2022",
    "limit": 50
  }
}
```

## If the Supabase project URL or publishable key changes

This app currently reads:

- `SUPABASE_URL`
- `SUPABASE_KEY`

from browser `localStorage` first, and only falls back to the hard-coded defaults.

So the fastest browser-side switch is:

1. Open Chrome DevTools
2. Open `Console`
3. Run:

```js
localStorage.setItem('SUPABASE_URL', 'https://YOUR_PROJECT.supabase.co');
localStorage.setItem('SUPABASE_KEY', 'YOUR_PUBLISHABLE_KEY');
location.reload();
```

If you want to clear the browser override and go back to the hard-coded default:

```js
localStorage.removeItem('SUPABASE_URL');
localStorage.removeItem('SUPABASE_KEY');
location.reload();
```

## If you want to permanently change the defaults in the code

Update these files:

- `src/index.html`
- `lt.html`
- `inline-scripts.mjs`

Search for:

- `window.SUPABASE_URL`
- `window.SUPABASE_KEY`
- `window.EDGE_GATEWAY_URL`

## Notes

- This setup is intentionally compatible with the current project.
- It does not require moving login to Supabase Auth right now.
- Later, you can upgrade to Supabase Auth + JWT claims and then move more permission logic into RLS itself.
