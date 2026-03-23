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
- `supabase/sql/003_system_users_password_hardening.sql`
- `supabase/functions/edu-gateway/index.ts`

## Step 1: Create the management tables

In Supabase Dashboard:

1. Open `SQL Editor`
2. Run `supabase/sql/001_management_tables.sql`
3. Run `supabase/sql/002_management_rls_minimal.sql`
4. Run `supabase/sql/003_system_users_password_hardening.sql`

Result:

- the new tables are created
- RLS is enabled
- browser direct access is blocked for `anon` and `authenticated`
- `system_users.password` is migrated to bcrypt hashes in `password_hash`
- legacy plaintext passwords are cleared after migration

## Step 2: Create the Edge Function

In Supabase Dashboard:

1. Open `Edge Functions`
2. Create a new function named `edu-gateway-v2` (recommended, matches the default front-end config)
3. Replace the default code with `supabase/functions/edu-gateway/index.ts`
4. Deploy

If you already have a function named `edu-gateway`, the current front end will still fall back to it automatically. Keeping both names deployed is also safe during migration.
Deploy the updated function before running the hardening SQL in production.

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
3. `account.search`
4. `account.change_password`
5. `alias.list`
6. `warning.list`
7. `rectify.list`

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
- Passwords are now expected to be stored as bcrypt hashes in `system_users.password_hash`.
- After the hardening SQL is applied, browser direct access to `system_users` should remain disabled and all account operations should go through `edu-gateway-v2`.
- The production site now prefers same-origin proxy routes at `https://schoolsystem.com.cn/api/edu-gateway` and `https://schoolsystem.com.cn/sb/*`.
- Those Worker routes forward traffic to the Supabase project and reduce direct cross-border browser requests from mainland China.
- Later, you can upgrade to Supabase Auth + JWT claims and then move more permission logic into RLS itself.
