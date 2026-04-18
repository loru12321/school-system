# Cloudflare Auth Cutover Plan

Last updated: `2026-04-18`

## Current state

- Production data reads and writes are already Cloudflare-first.
- Login still keeps a legacy gateway fallback for accounts that do not yet have a local password hash in D1.
- Current remote D1 status:
  - `total_accounts`: `414`
  - `migrated_accounts`: `151`
  - `pending_accounts`: `263`

## Why fallback still exists

The fallback is still required because removing it today would strand `263` active accounts that have no local password hash yet.

The current safe behavior is:

1. Try local D1 password verification first.
2. If the account has no local hash, verify against the legacy gateway.
3. On successful legacy login, write a new local Cloudflare password hash back into D1.

That means every successful legacy login reduces the pending count over time.

## Cutover target

The auth path can switch to Cloudflare-only when both conditions are true:

- `pending_accounts = 0`
- Production smoke checks pass for:
  - `login`
  - `session.verify`
  - `account.search`
  - `account.change_password`

## Recommended rollout

### Phase 1: keep fallback, reduce pending accounts

- Keep legacy fallback enabled in production.
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

When the pending count reaches zero:

1. Remove legacy login and `session.verify` fallback from `src/worker-gateway-d1.js`
2. Remove legacy upstream proxying from `src/worker-dummy.js`
3. Delete the deprecated `supabase/` reference folder and migration scripts if no longer needed
4. Redeploy `school-system1`
5. Run production smoke checks again

## Rollback

If Cloudflare-only login fails after cutover:

1. Restore the legacy fallback branch in `src/worker-gateway-d1.js`
2. Redeploy the Worker
3. Re-check `account.change_password` and `session.verify`

## Operator note

Do not delete the legacy reference files or gateway origin configuration until the pending account count is zero and production smoke has passed.
