# Optimization Backlog

This backlog tracks useful work discovered during maintenance scans. Keep items small enough to validate with the priority checks in `docs/maintenance-runbook.md`.

## P0: production correctness

- Harden default account credentials: replace visible shared defaults with reset-required temporary passwords or server-generated credentials.
- Finish Cloudflare account migration: remove the legacy gateway fallback only after `pending_accounts = 0`.
- Clarify Worker entrypoint ownership: keep `wrangler.jsonc` aligned with the intended production Worker and guard it in release checks.
- Add a post-deploy production smoke: verify `/`, `/api/health`, login shell availability, and core modules.
- Keep `check:p0` tied to data-safe release checks and UI copy integrity.
- Keep Worker crash responses no-store, nosniff, and gateway-identified.
- Keep `/api/health` returning JSON before any deploy is considered complete.
- Keep Windows、Android、iOS 安装包链路彻底移除；生产发布只保留 Web/Cloudflare 路径。

## P1: release quality and user experience

- Continue splitting `public/assets/js/app.js` so low-frequency modules load on demand.
- Reduce `src/index.html` inline event handlers by moving behavior into runtime modules.
- Lazy-load heavy vendor libraries such as Excel, SQL, PDF, and charting dependencies. Status: guarded so heavy vendors stay out of first-screen HTML and offline `lt.html` runtime source maps.
- Subset or prune Tabler icon fonts so unused font formats do not dominate the release surface.
- Replace alert, confirm, and prompt flows with a shared modal/toast API.
- Tighten immutable cache rules for versioned assets while keeping `sw.js` and HTML revalidation strict. Status: runtime JS/CSS now use build-generated content versions before immutable caching, including Service Worker cache-first handling for explicitly versioned assets.
- Keep `Content-Type: text/html; charset=utf-8` on `/` and `/index.html`.
- Keep `SERVICE_WORKER_VERSION` and the early refresh version aligned. Status: guarded by `test:runtime-cache-version`.
- Keep `CACHE_VERSION` explicit when service worker app-shell behavior changes. Status: derived from the same generated runtime version.
- Keep `check:p1` tied to HTML, service worker, release surface, runtime, and CSS hygiene.
- Keep heavy vendor libraries behind demand loaders instead of boot loading.
- Keep bundle budgets from drifting upward silently. Status: `lt.html` budget tightened after excluding vendor payloads from the inline runtime source map, and `lt.html.br` is generated with a Brotli budget.
- Reduce first-screen render blocking from the many source CSS links. Status: production `dist/index.html` still emits a single optimized CSS file, but source CSS module consolidation remains queued.
- Continue CSP hardening toward hash/nonce-based inline script execution. Status: enforced CSP is now shipped alongside report-only reporting; removing `unsafe-inline` requires inline script hashing or nonce injection in the build pipeline.

## P2: sustainable maintenance

- Archive legacy OSS, DNS, certificate, and direct-deploy scripts under a documented legacy folder. Status: `scripts/legacy/README.md` now identifies Wrangler as the recommended path.
- Split CI into smaller priority jobs so `check:p0` and `check:release-fast` run before full browser smoke and root validation.
- Keep `check:p0`, `check:p1`, and `check:p2` aligned with the maintenance runbook.
- Record each optimization pass with the changed files, commands run, commit hash, and Cloudflare version when deployed.
- Keep `test:maintenance-priority-contract` guarding at least 20 maintenance constraints.
- Keep README deployment commands portable and free of local machine paths.
- Keep `docs/optimization-backlog.md` linked from README and checked by docs hygiene.
- Keep release and performance workflows protected by concurrency settings.
- Keep performance trend recording paired with threshold checks so regressions fail in CI instead of only updating reports.
- Keep the native installer release chain removed; Windows/Android/iOS package jobs, signing checks, manifests, downloads, and historical package records must stay removed.
- Keep the production Worker name aligned with the project name in `wrangler.jsonc`.
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
| 2026-06-25 | P1 | `lt.html` 离线构建不再内联 heavy vendor payloads，仅保留 runtime source map；新增 vendor 首屏守卫并收紧 `lt.html` 预算；更新 sitemap `lastmod` | `npm run build`, `npm run test:inline-scripts`, `npm run test:vendor-budget`, `npm run test:build-size-budget` |
| 2026-06-25 | P2 | Cloudflare deploy workflow 增加 main push 自动触发与 bot/doc-only 防循环保护；GitHub build jobs 安装 fonttools/brotli 以支持 Tabler 字体子集化；第三方收藏审计资料从 tracked docs/scripts 移至 ignored scratch 归档；明确忽略并清理根目录 `.tmp-smoke-*` 临时输出 | `npm run build`, `npm run check:release-fast`, `npm run smoke:modules:local`, `npm run smoke:prod-minimal`, production `node scripts/smoke-all-modules.js`, `npm run test:release-automation`, Cloudflare version `cbb6c6c9-e235-4007-88da-724adc4afd38` |
| 2026-06-26 | P1/P2 | 性能趋势 workflow 增加 `test:performance-thresholds` 自动红线；Cloudflare Worker 名称统一为 `school-system`，生产路由迁移到新 Worker 并补齐 Cloudflare Secrets | `npm run build`, `npm run check:release-fast`, `npm run smoke:modules:local`, `npm run smoke:prod-minimal`, production `node scripts/smoke-all-modules.js`, Cloudflare version `434814dd-1087-49d3-91a3-01b2ce50dead` |
| 2026-06-26 | P0/P1/P2 | system_data 切换为 D1 primary 并绑定 `CLOUD_SYSTEM_DATA_DB`；Supabase bootstrap 不再创建旧 `password text`；客户端安装包发布链收敛为 Windows-only，移除 Android/iOS 包历史、清单、工作流和签名检查 | `npm run build`, `npm run check:release-fast`, `npm run smoke:mobile:local`, `npm run smoke:modules:local`, `npm run smoke:prod-minimal`, production `node scripts/smoke-all-modules.js`, Cloudflare version `b60d777a-221f-41c8-94f4-7000523f206a` |
| 2026-06-26 | P0/P1/P2 | CI 增加 P0 快速通道；Supabase `system_users` / `system_users_staging` 补齐 RLS 与 anon/authenticated revoke；build 拆成 pre/core/post；`lt.html` 生成 Brotli 产物；README 明确 Windows 代码签名负责人和稳定版目标 | commit `713ca360`, `npm run build`, `npm run check:release-fast`, `npm run smoke:mobile:local`, `npm run smoke:modules:local`, `npm run smoke:prod-minimal`, production `node scripts/smoke-all-modules.js`, Cloudflare version `c7e06635-9f10-4d07-bb5b-b50427ec915e` |
| 2026-06-27 | P1/P2 | Session TTL 12h → 8h（worker-gateway-d1.js + edu-gateway/index.ts 统一）；CSP-RO 改为监控去除 `unsafe-eval` 的严格策略；新增 tsconfig.json 启用 JS 类型检查；新增 .npmrc save-exact=true；精确锁定 playwright/esbuild/wrangler 版本；10个运行时死依赖（gsap/tippy/simplebar/ali-oss/mime-types/@alicloud/*/@fontsource/*）归入 devDependencies；删除两个无引用死 CSS 文件（login-instagram-refresh.css、login-qq-final.css）；performance-trend.yml 删除冗余第二次 npm run build；wrangler.jsonc compatibility_date 推进到 2026-06-27 | `node scripts/test-security-hygiene.js`, `node scripts/test-service-worker-contract.js`, `node scripts/test-cloudflare-worker-contract.js`, `node scripts/test-css-hygiene.js`, `node scripts/test-html-hygiene.js` |
| 2026-06-27 | P0/P1/P2 | Windows、Android、iOS 安装包链路彻底移除：删除公开下载目录、安装包清单、分片文件、Worker 下载代理、Windows 桌面壳、安装器源码、本地共享盘客户端更新脚本、native release workflows 和相关校验脚本；生产 smoke 改为只验证 Web 系统 | `npm run test:cloudflare-worker-contract`, `npm run test:release-automation`, `npm run test:release-hardening`, `npm run test:docs-hygiene` |
| 2026-07-03 | P1 | 提前桌面热点运行时水合窗口，成绩单模块进入后更早预热 report-render runtime；为 `cohort-growth` 增加届别/筛选范围计算缓存，减少重复切换后的全量扫描 | `node scripts/test-runtime-order.js`, `node scripts/test-student-flow-performance-caches.js`, `node scripts/test-report-performance-caches.js`, `node scripts/test-summary-report-performance-caches.js`, `npm run check:syntax`, `npm run build`, `npm run smoke:modules:local`, focused local hotspot profile |
| 2026-07-27 | P2 | 修复两个过时/未跟进的契约门禁（`test:login-cohort-runtime` 正则写死旧源码行，冷登录预热插入 `bootstrapPreloaded` 后连红 6 个提交；`test:html-hygiene` 内联 handler 棘轮未随新生分班上调），并补齐漏提交的 `dist/` 构建产物；新增 warmColdLoginCaches 守卫断言 | commit `825f8171`, `npm run validate`, `npm run test:calculation-snapshot:local`, `npm run check:release-fast`, `npm run smoke:modules:local`, CI 三项全绿 |
| 2026-07-27 | P1 | 新生分班 6 个内联 `onclick`/`onchange` 改为声明式 `data-fb-pick` / `data-fb-change` + 运行时 `FB_bindDeclarativeHandlers()` 绑定（幂等、`FB_*` 白名单）；内联 handler 棘轮 359→352（低于改造前 356）；新增 markup↔binder 双向契约与 smoke 真实 DOM 事件探针 | commit `b031db2c`, `npm run validate`, `npm run build`, `npm run test:calculation-snapshot:local`, `npm run check:release-fast`, `npm run smoke:modules:local`（`declarativeChangeBound` / `declarativePickBound` 均 true），双向变异验证 |
| 2026-08-27 | P1 | `snapshot_versions` Worker 管理接口统一使用显式列投影，移除 5 处 `SELECT *`，减少 D1 返回与 JSON 序列化开销；新增 Cloudflare Worker 契约守卫 | commit `d490f413`, `npm run validate`, `npm run check:release-fast`, `npm run smoke:prod-minimal`, Cloudflare version `26019a1f-8b70-45b7-ae01-2992131ec442` |
| 2026-08-27 | P1 | 数据质量 Worker 管理接口（`config_alias_rules`、`warning_records`、`rectify_tasks`）统一使用显式列投影，移除相关 `SELECT *`，减少 D1 返回字段与 JSON 序列化开销；新增契约守卫防止回退 | commit `3ecd24b4`, `npm run validate`, `npm run check:release-fast`, `npm run smoke:prod-minimal`, Cloudflare version `29cf8a90-6560-43b5-b72e-e30c2c7be5dd` |
| 2026-08-27 | P1 | 考核名册锁定/解锁流程改用统一 `UI.confirm` / `UI.alert` 异步对话框，移除原生阻塞对话框并纳入共享 dialog 契约守卫 | commit `ce014f67`, `npm run validate`, `npm run check:release-fast`, `npm run test:docs-hygiene`, `npm run smoke:prod-minimal`, Cloudflare version `bf3a4b52-cf6e-4f23-bbc2-18de73d350e1` |
| 2026-07-27 | P1 | 跨模块 29 个纯 DOM 样板内联 handler（17 个弹层关闭 + 12 个 file-pick）收敛为 `data-close-modal` / `data-pick-file` 属性 + `app-foundation-runtime.js` 单个 **捕获阶段** document 委托监听；捕获阶段是必须的（`.modal-content` 上的 `onclick="event.stopPropagation()"` 会掐断冒泡监听，学校画像关闭按钮正在其内部）；含防递归守卫（隐藏 input 嵌在 upload-box 内）与封存态 `disabled` 兼容；棘轮 352→323 | commit `47b3fd92`, `npm run validate`, `npm run build`, `npm run test:calculation-snapshot:local`, `npm run check:release-fast`, `npm run smoke:modules:local`, `npm run smoke:mobile:local`，变异验证（改回冒泡 → hygiene 报错且 smoke `schoolProfileCloseWorks:false` EXIT 1）|
| 2026-07-27 | P0/P1 | 全模块扫描后的口径与健壮性加固：导出侧高中上线率门禁改 **fail-closed**（原 `typeof && !gate()` 形式在依赖缺失时会整体跳过门禁去读分数线）；后1/3 补赋分自一致性断言（归一化基准是**乡镇范围**而非全量 SCHOOLS，按全量算期望值会等比偏小）；`escapeHtml` 收敛到既有 `SchoolRuntime.escapeHtml`（6 处加委托，刻意保留 data-quality 的 trim 与 teaching-assessment-sync 的 tmEscapeHtml 差异并加断言锁住）；快照恢复 3 处静默 catch 补 warn（`applyExamToWorkspace` 失败会让工作区仍是上一份考试数据） | commit `026298bd`, `npm run validate`, `npm run test:calculation-snapshot:local`(rawData=7790), `npm run check:release-fast`, `npm run smoke:modules:local`, `npm run smoke:mobile:local`，四项均变异验证，CI 三项全绿 + 生产已核 |
| 2026-07-27 | P1 | 新增前置条件状态条 `prerequisite-status-runtime.js`（试点 summary / county-analysis / teacher-analysis）：把隐式依赖链显式化——学校归一、本校识别、高中线/任课数据；未满足项用「中性说明 + 后果」呈现（如「未配置公办高中录取线 → 上线率显示 0」），非 7 月中考时说明「按口径不计上线率」以区分「真 0」与「漏配」。只读现有状态、不触发重算、不参与赋分；用 idle 任务运行时注入以规避 teacher-analysis 的 lazy-section 时序 | commit `4b71a4fb`, `npm run validate`, `npm run build`, `npm run test:calculation-snapshot:local`(rawData=7790), `npm run check:release-fast`, `npm run smoke:modules:local`（新增 `prerequisiteBarRendered` / `prerequisiteBarHasItems`，实测渲染文案正确）, `npm run smoke:mobile:local`，变异验证（移除注入 → smoke EXIT 1）|
