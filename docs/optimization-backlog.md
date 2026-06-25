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
| 2026-06-23 | P0 | 移除 wrangler.jsonc 硬编码 Supabase URL（改为 Wrangler Secrets）；handleAccountUpsertMany 加批量上限 50 条 + 改为 db.batch() 原子写入；新增 Supabase migration 004 安全 DROP plaintext password 列；新增 migration 005 清理 `password_display`；routeGatewayAction 在 APP_SESSION_SECRET 缺失时返回 503 而非静默降级 | `npm run test:cloudflare-worker-contract`, `npm run check:release-fast` |
| 2026-06-23 | P1 | handleWarningList / handleRectifyList 把 school 过滤推入 SQL WHERE 减少 D1 读行数；handleManagedRestTable GET 改为 LIMIT n+1 省去 COUNT 查询；buildSystemDataJsonResponse R2 读改为 Promise.all 并发 | `npm run test:worker-api-runtime`, `npm run check:performance` |
| 2026-06-23 | P2 | worker-http-helpers.js 新增 normalizeText / fetchWithTimeout 共享导出；worker-dummy.js 和 worker-gateway-d1.js 删除重复定义改为 import；wrangler.jsonc 补充 CLOUD_SYSTEM_DATA_DB 注释说明 | `npm run check:p2`, `npm run test:cloudflare-worker-contract` |
| 2026-06-24 | P0/P2 | 新增 `deploy:cloudflare:verified` 与 `Deploy Cloudflare` workflow，把 build、fast release guards、`wrangler deploy` 和部署后 `smoke:prod-minimal` 串成固定生产发布链路 | `npm run test:release-automation`, `npm run test:maintenance-priority-contract`, `npm run test:docs-hygiene` |
| 2026-06-24 | P0 | D1 远程账号迁移报告显示 `pending_accounts = 0` 后，移除登录、`session.verify`、改密和未知网关动作的旧 Edge Function fallback，认证路径切换为 Cloudflare-only | `node scripts/report-account-migration-status.mjs`, `npm run test:cloudflare-worker-contract`, `npm run test:security-hygiene` |
| 2026-06-24 | P1 | Worker HTML 响应统一使用 `no-cache, max-age=0, must-revalidate, no-transform`，与 `_headers` 的入口 HTML 重验证策略对齐，避免生产端继续命中旧壳代码 | `npm run test:cloudflare-worker-contract`, `npm run test:release-surface`, `npm run test:maintenance-priority-contract` |
