# Cloudflare Auth Cutover Plan

Last updated: `2026-06-24`

## Current state

- Production account login, session verification, account search, and password changes are Cloudflare D1 native.
- The legacy auth fallback has been removed from the Worker gateway after the remote D1 account report reached `pending_accounts = 0`.
- Current remote D1 status from `node scripts/report-account-migration-status.mjs`:
  - `total_accounts`: `16`
  - `migrated_accounts`: `16`
  - `pending_accounts`: `0`

## Why fallback can stay removed

The fallback is no longer required because all active accounts have a local password hash in D1.

The current safe behavior is:

1. Try local D1 password verification first.
2. If the account has no local hash or the password does not match, fail closed with `401`.
3. Use admin reset or managed account upsert flows to repair any future account missing a local hash.

## Cutover target

The auth path has switched to Cloudflare-only because both conditions are true:

- `pending_accounts = 0`
- Production smoke checks pass for:
  - `login`
  - `session.verify`
  - `account.search`
  - `account.change_password`

## Recommended rollout

### Phase 1: keep fallback, reduce pending accounts

- Completed. Legacy fallback is no longer enabled in production.
- Monitor `account.migration_status` from the admin UI.
- Encourage users who have not logged in recently to log in once, or reset passwords through the admin flow.

### Phase 2: drive the pending count to zero

Use one or both of these paths:

- Normal login backfill:
  - user logs in once
  - Worker writes a local hash
- Admin reset:
  - admin resets the password in Cloudflare
  - account becomes Cloudflare-native immediately

### Phase 3: verify cutover readiness

- Confirm `pending_accounts = 0`
- Confirm `fallback.mode = cloudflare-only-ready`
- Run:

```bash
npm run validate
npm run smoke:modules:local
```

- Then run a production smoke login on `https://schoolsystem.com.cn/`

### Phase 4: remove fallback

Completed in the Cloudflare-only auth cutover:

1. Removed legacy login and `session.verify` fallback from `src/worker-gateway-d1.js`
2. Removed legacy upstream gateway proxying from `src/worker-dummy.js`
3. Kept Supabase REST compatibility for `system_data` while `CLOUD_SYSTEM_DATA_MODE` remains `supabase`
4. Redeploy and run production smoke checks after every auth-path change

## Rollback

If Cloudflare-only login fails after cutover:

1. Revert the Cloudflare-only auth cutover commit.
2. Redeploy the Worker.
3. Re-check `login`, `session.verify`, `account.search`, and `account.change_password`.

## Operator note

Do not delete the remaining Supabase REST compatibility path until `system_data` is fully verified and `CLOUD_SYSTEM_DATA_MODE` is moved away from `supabase`.

## Migration credential safety

The two one-off migration scripts do not contain a shared administrator password. Before running either migration, provide the source gateway administrator password explicitly through `MIGRATION_ADMIN_PASS`; the scripts fail closed when it is missing:

```powershell
$env:MIGRATION_ADMIN_USER = 'admin'
$env:MIGRATION_ADMIN_PASS = '<source-admin-password>'
npm run migrate:gateway-data:cloudflare
# or
npm run migrate:supabase:project
```

Use a temporary administrator password where possible, rotate it after the migration, and never commit the value to the repository or a shell history file.
