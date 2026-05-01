# Optimization Pass 2026-05-01

This pass keeps calculation behavior stable and focuses on guardrails around the production system.

## Completed Scope

- Security: Cloudflare gateway sessions fail closed when `APP_SESSION_SECRET` is missing; the static fallback signing secret was removed.
- Security: Worker CORS now uses an explicit allowlist plus localhost development origins.
- Security: boot runtime no longer embeds a Supabase publishable key. Hosted same-origin gateway calls can run without a browser-side key.
- Security: Supabase publishable keys were removed from Worker source, migration script defaults, and `wrangler.jsonc`; production now expects Cloudflare secrets or runtime environment variables for legacy Supabase proxy credentials.
- Local verification: localhost now uses the same-origin `/sb` proxy by default, so smoke and calculation snapshots do not need browser-embedded Supabase keys. Set `localStorage.SUPABASE_DIRECT_LOCAL = "true"` only for a deliberate local Supabase instance.
- Caching: the Service Worker no longer caches sensitive API data; only `/api/health` remains cache-eligible.
- Runtime governance: added `SchoolRuntime` as a small registry for future runtime exports and runtime skill metadata.
- Asset size: production builds prune the local `dist/downloads` bundle so the APK is not shipped as part of every Cloudflare static deployment.
- Loading: shell polish is no longer warmed by default on desktop; it loads on demand through the runtime loader.
- Download center: latest release assets are now verified from GitHub release metadata. Missing APK/EXE assets disable direct download actions instead of silently using links that may 404.
- Build hygiene: removed the build-time string patch from `inline-scripts.mjs`; source code is now the only behavior source.
- XSS surface: account manager table output now escapes dynamic account fields before assigning HTML.
- Budgets: tightened build size budgets and added HTML/vendor/security/release hygiene tests.

## Calculation Safety

No score formula, rank calculation, comparison formula, report calculation, teacher-analysis metric, or county ranking formula was changed in this pass. Calculation safety is enforced by:

- `npm run test:calculation-snapshot:local`
- `npm run smoke:modules:local`
- existing compare/report/runtime state tests in `npm run validate`

Any future formula simplification should first add or update calculation snapshots, then compare before/after output on the same fixture data.
