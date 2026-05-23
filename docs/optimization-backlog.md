# Optimization Backlog

This backlog tracks useful work discovered during maintenance scans. Keep items small enough to validate with the priority checks in `docs/maintenance-runbook.md`.

## P0: production correctness

- Harden default account credentials: replace visible shared defaults with reset-required temporary passwords or server-generated credentials.
- Finish Cloudflare account migration: remove the legacy gateway fallback only after `pending_accounts = 0`.
- Clarify Worker entrypoint ownership: keep `wrangler.jsonc` aligned with the intended production Worker and guard it in release checks.
- Add a post-deploy production smoke: verify `/`, `/api/health`, login shell availability, core modules, and hosted downloads.
- Keep `check:p0` tied to data-safe release checks and UI copy integrity.
- Keep Worker crash responses no-store, nosniff, and gateway-identified.
- Keep `/api/health` returning JSON before any deploy is considered complete.
- Keep hosted APK and Windows package signatures checked before release.

## P1: release quality and user experience

- Continue splitting `public/assets/js/app.js` so low-frequency modules load on demand.
- Reduce `src/index.html` inline event handlers by moving behavior into runtime modules.
- Lazy-load heavy vendor libraries such as Excel, SQL, PDF, and charting dependencies.
- Subset or prune Tabler icon fonts so unused font formats do not dominate the release surface.
- Replace alert, confirm, and prompt flows with a shared modal/toast API.
- Tighten immutable cache rules for hashed assets while keeping `sw.js` and HTML revalidation strict.
- Keep `Content-Type: text/html; charset=utf-8` on `/` and `/index.html`.
- Keep `SERVICE_WORKER_VERSION` and the early refresh version aligned.
- Keep `CACHE_VERSION` explicit when service worker app-shell behavior changes.
- Keep `check:p1` tied to HTML, service worker, release surface, runtime, and CSS hygiene.
- Keep heavy vendor libraries behind demand loaders instead of boot loading.
- Keep bundle and hosted download budgets from drifting upward silently.

## P2: sustainable maintenance

- Archive legacy OSS, DNS, certificate, and direct-deploy scripts under a documented legacy folder. Status: `scripts/legacy/README.md` now identifies Wrangler as the recommended path.
- Split CI into smaller priority jobs so P0 checks return faster than full browser smoke.
- Keep `check:p0`, `check:p1`, and `check:p2` aligned with the maintenance runbook.
- Record each optimization pass with the changed files, commands run, commit hash, and Cloudflare version when deployed.
- Keep `test:maintenance-priority-contract` guarding at least 20 maintenance constraints.
- Keep README deployment commands portable and free of local machine paths.
- Keep `docs/optimization-backlog.md` linked from README and checked by docs hygiene.
- Keep release and performance workflows protected by concurrency settings.
- Keep production verification available through `npm run verify:prod-minimal`.
- Keep production minimal smoke available through `npm run smoke:prod-minimal` after Cloudflare deployments.
- Keep `check:release-fast` as the shared gate for release, performance, and P2 checks.

## Optimization pass log

| Date | Priority | Scope | Verification |
| --- | --- | --- | --- |
| 2026-05-23 | P0 | Managed account password hardening, weak default removal, Worker ownership clarification | `npm run check:release-fast`, Cloudflare version `5fa1dc97-3cfa-4d3d-87a1-9e6337ccee65` |
| 2026-05-23 | P1 | Login runtime binding, CI split, JS cache policy, build warning contract | `npm run check:p1`, `npm run check:release-fast`, Cloudflare version `d2afbb6a-52cd-4caa-bb48-33d7c4b51963` |
| 2026-05-23 | P2 | Legacy script archive, shared Worker HTTP helpers, dialog API guardrails, production minimal smoke alias | commit `08a0fc6`, Cloudflare version `2268aef9-8324-498d-ab2d-0e2b92b2496d` |
