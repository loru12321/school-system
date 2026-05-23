# Optimization Backlog

This backlog tracks useful work discovered during maintenance scans. Keep items small enough to validate with the priority checks in `docs/maintenance-runbook.md`.

## P0: production correctness

- Harden default account credentials: replace visible shared defaults with reset-required temporary passwords or server-generated credentials.
- Finish Cloudflare account migration: remove the legacy gateway fallback only after `pending_accounts = 0`.
- Clarify Worker entrypoint ownership: keep `wrangler.jsonc` aligned with the intended production Worker and guard it in release checks.
- Add a post-deploy production smoke: verify `/`, `/api/health`, login shell availability, core modules, and hosted downloads.

## P1: release quality and user experience

- Continue splitting `public/assets/js/app.js` so low-frequency modules load on demand.
- Reduce `src/index.html` inline event handlers by moving behavior into runtime modules.
- Lazy-load heavy vendor libraries such as Excel, SQL, PDF, and charting dependencies.
- Subset or prune Tabler icon fonts so unused font formats do not dominate the release surface.
- Replace alert, confirm, and prompt flows with a shared modal/toast API.
- Tighten immutable cache rules for hashed assets while keeping `sw.js` and HTML revalidation strict.

## P2: sustainable maintenance

- Archive legacy OSS, DNS, certificate, and direct-deploy scripts under a documented legacy folder.
- Split CI into smaller priority jobs so P0 checks return faster than full browser smoke.
- Keep `check:p0`, `check:p1`, and `check:p2` aligned with the maintenance runbook.
- Record each optimization pass with the changed files, commands run, commit hash, and Cloudflare version when deployed.
