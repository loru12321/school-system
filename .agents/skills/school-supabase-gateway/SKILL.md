---
name: school-supabase-gateway
description: Work on the school-system Supabase and gateway path safely. Use when Codex changes `edu-gateway-v2`, same-origin `/api/edu-gateway` or `/sb/*` routing, account management flows, Supabase URL/key overrides, or the SQL/RLS migration order for management tables.
---

# School Supabase Gateway

Follow the repo's existing gateway-first architecture.

## Source of truth

Read these files first when the task touches auth, accounts, cloud data, or routing:

- `supabase/EDGE_GATEWAY_SETUP.md`
- `supabase/functions/edu-gateway/index.ts`
- `public/assets/js/boot-runtime.js`

## Current architecture

- The browser prefers same-origin proxy routes at `/api/edu-gateway` and `/sb/*`.
- The front end prefers `edu-gateway-v2` and only falls back to `edu-gateway` when needed.
- Browser overrides for `SUPABASE_URL`, `SUPABASE_KEY`, and `EDGE_GATEWAY_URL` may exist in `localStorage`.

## Safe change order

When a production change touches Supabase auth/account flows:

1. Update `supabase/functions/edu-gateway/index.ts`.
2. Deploy `edu-gateway-v2`.
3. Run SQL in order:
   - `supabase/sql/001_management_tables.sql`
   - `supabase/sql/002_management_rls_minimal.sql`
   - `supabase/sql/003_system_users_password_hardening.sql`
4. Re-test:
   - `login`
   - `session.verify`
   - `account.search`
   - `account.change_password`
5. Run browser smoke checks locally and on production.

## Guardrails

- Do not move account operations back to direct browser table access.
- Do not bypass the same-origin proxy routes without a clear rollback plan.
- When changing auth or account flows, assume there may be coupled regressions in login restore, role routing, and cloud management pages.
- When changing Supabase defaults, check both hard-coded values and `localStorage` override behavior.

## Fast verification

Use the existing script for gateway health:

```powershell
cmd /c npm run smoke:ai-gateway
```

For production browser verification:

```powershell
$env:SMOKE_URL='https://schoolsystem.com.cn/'
$env:SMOKE_USER='admin'
$env:SMOKE_PASS='admin123'
$env:SMOKE_COHORT_YEAR='2022'
node scripts/smoke-all-modules.js
```
