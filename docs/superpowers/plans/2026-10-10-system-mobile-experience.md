# 全系统手机端体验优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变计算、权限、同步、导出和桌面布局的前提下，为 320–768px 视口建立统一的全系统手机端体验，并迁移全部业务模块。

**Architecture:** 新增一个位于现有模块样式之后的全局移动组件层，集中管理令牌、触控、表单、操作栏、表格和弹层；保留 `apk-mobile-shell` 作为壳层，扩展 `mobile-app-runtime.js` 与 `mobile-table-scroll-runtime.js` 协调导航、工作表和表格类型。模块按四批迁移，每批都有独立契约、浏览器烟测与桌面回归。

**Tech Stack:** HTML、CSS、Vanilla JavaScript、Playwright、现有 Vite/Cloudflare 构建链。

**Spec:** `docs/superpowers/specs/2026-10-10-system-mobile-experience-design.md`

## Global Constraints

- 支持 320–768px，主要验收视口为 390×844，同时覆盖 320×568、360×800、430×932 和横屏。
- 高频按钮和表单控件最小触控区域 44px；主要输入和主按钮最小高度 46px。
- `.app-main` 是业务页面唯一纵向滚动容器；弹层使用 `overscroll-behavior: contain`。
- 页面底部留白必须包含移动导航高度和 `env(safe-area-inset-bottom)`。
- 不改变成绩、排名、评价、增幅等计算口径，不改变角色权限、云端同步和导出字段。
- 不引入新前端框架，不复制整套移动 DOM，不向 `public/assets/js/app.js` 增加移动端业务分支。
- 桌面 1440px 布局、计算快照、模块切换与现有导出必须持续通过。

## Review Focus

- 320px 窄屏和超长中文学校/模块名称必须换行或截断，不产生页面级横向溢出；由 Task 2、6、8 的浏览器断言覆盖。
- iPhone 安全区、软键盘和固定操作栏不能遮挡最后一项、首个错误或当前焦点；由 Task 3、4、9 覆盖。
- 空表、50+ 行名单和宽分析矩阵必须分别得到空状态、分页/虚拟化和固定关键列；由 Task 5、7 覆盖。
- 横屏、平板和混合触控设备不得错误启用双重导航或禁用浏览器原生返回/下拉刷新；由 Task 2、9 覆盖。
- 深色模式下原生输入、选择框、弹层和滚动提示必须保持可读；由 Task 1、4、9 覆盖。

---

### Task 1: 建立全局移动组件层与测试门禁

**Files:**
- Create: `src/assets/css/mobile-experience-system.css`
- Create: `scripts/test-mobile-experience-system.js`
- Modify: `src/assets/css/application.css`
- Modify: `scripts/test-css-loading-contract.js`
- Modify: `package.json`

**Interfaces:**
- Produces CSS tokens: `--mobile-page-gutter`, `--mobile-control-min`, `--mobile-control-primary`, `--mobile-shell-top`, `--mobile-shell-bottom`, `--mobile-content-bottom`.
- Produces semantic hooks: `[data-mobile-surface]`, `[data-mobile-action-bar]`, `[data-mobile-table]`, `[data-mobile-sheet]`.
- Later tasks consume these tokens and hooks without redefining their values.

- [ ] **Step 1: Write the failing `test-mobile-experience-system.js` contract**

Assert the new CSS layer is imported after `ux-review-2026.css` and before `utility-classes.css`; assert the six tokens, 44/46px minimums, safe-area padding, `touch-action: manipulation`, `:focus-visible`, reduced-motion handling and dark native-control colors exist. Add `test:mobile-experience-system` to `validate:build` and `check:release-fast`.

- [ ] **Step 2: Run the contract and verify it fails**

Run: `node scripts/test-mobile-experience-system.js`  
Expected: FAIL because the CSS file/import/tokens do not exist.

- [ ] **Step 3: Implement the minimal global layer and package wiring**

Create the token and primitive rules under `@media screen and (max-width: 768px)`; keep `responsive-login-final.css` as the final CSS layer; update the historical cascade assertion.

- [ ] **Step 4: Verify the contract and existing CSS gates**

Run: `npm run test:mobile-experience-system && npm run test:css-loading-contract && npm run test:css-hygiene`  
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/assets/css/mobile-experience-system.css src/assets/css/application.css scripts/test-mobile-experience-system.js scripts/test-css-loading-contract.js package.json && git commit -m "feat(mobile): establish system experience primitives"`

### Task 2: 收敛移动壳层、导航与滚动所有权

**Files:**
- Modify: `public/assets/js/mobile-app-runtime.js`
- Modify: `src/assets/css/apk-mobile-shell.css`
- Modify: `src/assets/css/mobile-experience-system.css`
- Modify: `scripts/test-mobile-workflow-contract.js`
- Modify: `scripts/smoke-mobile-shell.js`

**Interfaces:**
- Consumes Task 1 tokens.
- Produces `MobileExperienceRuntime.syncCompactState()` behavior for one top shell, one `.app-main` scroll root, four role-aware primary tabs and one module-library entry.
- Produces `data-mobile-sheet-open`, `data-mobile-library-open` and `data-mobile-current-module` state on `#apk-mobile-shell`.

- [ ] **Step 1: Extend shell tests first**

Add assertions for exactly five bottom entries, current module visibility, long-title truncation, `.app-main` as the only vertical scroll root, safe-area bottom padding, background scroll lock for sheets and no duplicate shell after viewport changes.

- [ ] **Step 2: Run shell tests and verify the new assertions fail**

Run: `npm run test:mobile-workflow && npm run smoke:mobile:local`  
Expected: FAIL on the newly added navigation/scroll assertions.

- [ ] **Step 3: Implement shell state and layout changes**

Keep existing role module selection and recent-module persistence. Move search/account/cloud details into existing sheet/library surfaces; keep top title to two lines; make bottom tabs safe-area aware; preserve native page pull-to-refresh on coarse pointers.

- [ ] **Step 4: Verify shell at 320, 390, 430 and landscape widths**

Run: `npm run test:mobile-workflow && npm run smoke:mobile:local`  
Expected: PASS with one shell, active entry and no body overflow.

- [ ] **Step 5: Commit**

Run: `git add public/assets/js/mobile-app-runtime.js src/assets/css/apk-mobile-shell.css src/assets/css/mobile-experience-system.css scripts/test-mobile-workflow-contract.js scripts/smoke-mobile-shell.js && git commit -m "feat(mobile): unify shell navigation and scrolling"`

### Task 3: 优化登录与首次进入

**Files:**
- Modify: `src/assets/css/mobile-login.css`
- Modify: `src/assets/css/responsive-login-final.css`
- Modify: `src/index.html`
- Modify: `scripts/test-responsive-login-contract.js`
- Modify: `scripts/test-responsive-login-layout.js`
- Modify: `scripts/test-login-performance-contract.js`

**Interfaces:**
- Consumes Task 1 form/control tokens.
- Preserves existing login element IDs, role switching, auth handlers and cohort selection values.
- Produces a mobile login first screen containing account, password, cohort and submit action at 390×844.

- [ ] **Step 1: Add failing login layout assertions**

Assert mobile controls are at least 44px, submit action bottom is within 844px after initial render, brand copy is compact, auxiliary archive/help content is after the primary action and collapsed, no autofocus opens the soft keyboard, and 320px has no horizontal overflow.

- [ ] **Step 2: Run login tests and verify failure**

Run: `npm run test:responsive-login-contract && npm run test:responsive-login-layout && npm run test:login-performance-contract`  
Expected: FAIL on first-screen visibility/touch size assertions.

- [ ] **Step 3: Implement the compact login hierarchy**

Retain desktop appearance. On mobile, reduce branding height and prose, keep visible labels, preserve password display/error/loading states, and move archive/help blocks below the submit action in collapsed disclosures.

- [ ] **Step 4: Verify login and auth state contracts**

Run: `npm run test:responsive-login-contract && npm run test:responsive-login-layout && npm run test:login-performance-contract && npm run test:login-shell-state`  
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/assets/css/mobile-login.css src/assets/css/responsive-login-final.css src/index.html scripts/test-responsive-login-contract.js scripts/test-responsive-login-layout.js scripts/test-login-performance-contract.js && git commit -m "feat(mobile): bring login actions into the first screen"`

### Task 4: 统一表单、筛选器、弹层与固定操作栏

**Files:**
- Modify: `src/assets/css/mobile-experience-system.css`
- Modify: `public/assets/js/mobile-app-runtime.js`
- Create: `scripts/test-mobile-interaction-contract.js`
- Modify: `package.json`

**Interfaces:**
- Consumes `[data-mobile-surface]`, `[data-mobile-sheet]`, `[data-mobile-action-bar]`.
- Produces `MobileExperienceRuntime.openSheet(id, trigger)`, `closeSheet(reason)` and `syncActionBar(section)` while preserving existing click handlers.

- [ ] **Step 1: Write failing interaction tests**

Test 44/46px controls, visible labels, one primary plus one secondary action, overflow actions under “更多”, body scroll lock, Escape/backdrop close, focus restoration, safe-area padding and inline first-error focus.

- [ ] **Step 2: Run the test and verify failure**

Run: `node scripts/test-mobile-interaction-contract.js`  
Expected: FAIL because the sheet/action APIs and contracts are absent.

- [ ] **Step 3: Implement shared interactions**

Add minimal shell helpers and CSS; reuse existing semantic buttons, labels and dialogs; do not clone business controls or change submit handlers.

- [ ] **Step 4: Verify interaction and accessibility contracts**

Run: `npm run test:mobile-interaction && npm run test:visual-contracts && npm run test:html-hygiene`  
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add src/assets/css/mobile-experience-system.css public/assets/js/mobile-app-runtime.js scripts/test-mobile-interaction-contract.js package.json && git commit -m "feat(mobile): standardize sheets forms and action bars"`

### Task 5: 建立三类移动表格策略

**Files:**
- Modify: `public/assets/js/mobile-table-scroll-runtime.js`
- Modify: `src/assets/css/mobile-experience-system.css`
- Modify: `src/assets/css/main.css`
- Create: `scripts/test-mobile-table-strategies.js`
- Modify: `scripts/test-runtime-order.js`
- Modify: `package.json`

**Interfaces:**
- Produces `TableScrollIndicators.classifyTable(table): 'list' | 'summary' | 'matrix'`.
- Produces `TableScrollIndicators.setupTableWrap(wrap)` with idempotent `data-mobile-table` and scroll state.
- `list` uses card rows, `summary` uses prioritized columns, `matrix` uses sticky first column plus scroll hints.

- [ ] **Step 1: Write failing table strategy tests**

Cover empty tables, student/teacher/room lists, summary tables, wide matrices, repeated initialization, 50+ row performance, sticky first-column state and left/right hint updates.

- [ ] **Step 2: Run tests and verify failure**

Run: `node scripts/test-mobile-table-strategies.js`  
Expected: FAIL because `classifyTable` and semantic table states do not exist.

- [ ] **Step 3: Implement classification and presentation rules**

Prefer explicit `data-mobile-table`; infer only for existing unannotated tables. Preserve desktop table markup and export code. Remove inline overflow writes where CSS hooks replace them.

- [ ] **Step 4: Verify table and runtime gates**

Run: `npm run test:mobile-table-strategies && npm run test:runtime-order && npm run test:calculation-output-invariance`  
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add public/assets/js/mobile-table-scroll-runtime.js src/assets/css/mobile-experience-system.css src/assets/css/main.css scripts/test-mobile-table-strategies.js scripts/test-runtime-order.js package.json && git commit -m "feat(mobile): add semantic table strategies"`

### Task 6: 迁移高频工作流模块

**Files:**
- Modify: `src/index.html`
- Modify: `src/assets/css/mobile-experience-system.css`
- Modify: module-specific rules in `src/assets/css/main.css`
- Modify: `public/assets/js/mobile-app-runtime.js`
- Create: `scripts/test-mobile-core-modules.js`
- Modify: `scripts/smoke-layout-regression.js`

**Interfaces:**
- Consumes Tasks 1–5 primitives without introducing new global patterns.
- Annotates data preparation/upload, summary, teacher analysis/ranking, student details, report generator and exam arranger with semantic mobile hooks.

- [ ] **Step 1: Add failing module contracts**

For each target module assert visible page title/range/primary action, no body overflow at 320/390/430px, correct table strategy, maximum two always-visible actions, collapsible auxiliary explanation and unobscured final content.

- [ ] **Step 2: Run core module tests and verify failure**

Run: `node scripts/test-mobile-core-modules.js` and focused local layout smoke.  
Expected: FAIL on missing hooks or layout conditions.

- [ ] **Step 3: Migrate the six high-frequency workflows**

Apply semantic attributes/classes in source markup and module renderers. Compact metric grids, move advanced filters to sheets, keep primary actions near the thumb zone, and use Task 5 table types.

- [ ] **Step 4: Verify core workflows and desktop parity**

Run: `npm run test:mobile-core-modules && npm run smoke:layout:local && npm run validate:exam-arranger`  
Expected: PASS; desktop and mobile smoke report no overflow or overlap.

- [ ] **Step 5: Commit**

Run: `git add src/index.html src/assets/css/mobile-experience-system.css src/assets/css/main.css public/assets/js/mobile-app-runtime.js scripts/test-mobile-core-modules.js scripts/smoke-layout-regression.js && git commit -m "feat(mobile): migrate core school workflows"`

### Task 7: 迁移分析与教学改进模块

**Files:**
- Modify: affected renderers under `public/assets/js/*-runtime.js`
- Modify: `src/assets/css/mobile-experience-system.css`
- Modify: module-specific styles in `src/assets/css/main.css`
- Create: `scripts/test-mobile-analysis-modules.js`
- Modify: `scripts/smoke-layout-regression.js`

**Interfaces:**
- Consumes shared sheets, action bars and table strategies.
- Covers horizontal comparison, correlation, progress, marginal push, seating, cohort growth, joint exam, county analysis and teaching improvement.

- [ ] **Step 1: Add failing analysis-module assertions**

Assert charts fit the viewport, matrices retain sticky identity columns, legends wrap, long filters enter sheets, task cards preserve actions, numeric values remain readable and no module removes an existing export or drill-down action.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node scripts/test-mobile-analysis-modules.js` with focused layout smoke.  
Expected: FAIL on at least one legacy module layout.

- [ ] **Step 3: Migrate analysis modules**

Use module-specific hooks only where shared primitives are insufficient. Preserve chart data, formulas, comparison state and drill-down functions.

- [ ] **Step 4: Verify analysis, calculations and desktop output**

Run: `npm run test:mobile-analysis-modules && npm run test:calculation-output-invariance && npm run test:calculation-snapshot:local && npm run smoke:layout:local`  
Expected: PASS with unchanged calculation hashes/snapshots.

- [ ] **Step 5: Commit**

Run: `git add public/assets/js src/assets/css/mobile-experience-system.css src/assets/css/main.css scripts/test-mobile-analysis-modules.js scripts/smoke-layout-regression.js && git commit -m "feat(mobile): migrate analysis and improvement modules"`

### Task 8: 迁移管理、账号与角色专属模块

**Files:**
- Modify: `src/index.html`
- Modify: affected management runtimes under `public/assets/js/`
- Modify: `src/assets/css/mobile-experience-system.css`
- Create: `scripts/test-mobile-management-modules.js`
- Modify: `scripts/smoke-all-modules.js`

**Interfaces:**
- Consumes shared primitives and preserves current role visibility policies.
- Covers DataManager tabs, account manager, cloud/history/settings and remaining admin/parent/teacher surfaces.

- [ ] **Step 1: Add failing role and management tests**

Assert all five DataManager tabs activate, role-hidden actions stay hidden, account/cloud tables use list or summary strategy, destructive operations keep confirmation, and module library only lists allowed modules.

- [ ] **Step 2: Run tests and verify failure**

Run: `node scripts/test-mobile-management-modules.js` and focused module smoke.  
Expected: FAIL on missing mobile hooks or touch/layout assertions.

- [ ] **Step 3: Migrate management and role-specific screens**

Keep permissions and event handlers unchanged; move secondary controls into sheets/menus and annotate tables/actions.

- [ ] **Step 4: Verify roles, management tabs and all modules**

Run: `npm run test:mobile-management-modules && npm run test:permission-policy-runtime && npm run test:teacher-visibility-runtime && npm run smoke:modules:local`  
Expected: PASS for all allowed modules and five DataManager tabs.

- [ ] **Step 5: Commit**

Run: `git add src/index.html public/assets/js src/assets/css/mobile-experience-system.css scripts/test-mobile-management-modules.js scripts/smoke-all-modules.js && git commit -m "feat(mobile): complete management and role surfaces"`

### Task 9: 建立多视口视觉与交互回归

**Files:**
- Create: `scripts/smoke-mobile-experience.js`
- Modify: `scripts/smoke-layout-regression.js`
- Modify: `scripts/test-build-size-budget.js`
- Modify: `package.json`
- Create: `docs/qa/mobile-experience-checklist.md`

**Interfaces:**
- Produces `smoke:mobile-experience:local` and `smoke:mobile-experience:prod`.
- Produces JSON evidence per viewport: overflow, focus overlap, minimum target size, shell count, visible actions, scroll roots, console errors and accepted screenshots.

- [ ] **Step 1: Write the browser smoke before final polish**

Cover 320×568, 360×800, 390×844, 430×932, 844×390 and desktop 1440×1000. Exercise login, shell, module library, filter sheet, core modules, an analysis matrix, DataManager and exam arranger output.

- [ ] **Step 2: Run smoke and record all failures**

Run: `npm run smoke:mobile-experience:local`  
Expected: FAIL until all remaining overlap, target-size, overflow or console issues are fixed.

- [ ] **Step 3: Fix only evidence-backed remaining issues**

Change the responsible shared or module rule; do not add broad `!important` overrides unless the existing cascade contract requires it and the reason is documented.

- [ ] **Step 4: Verify visual, size and performance budgets**

Run: `npm run smoke:mobile-experience:local && npm run test:build-size-budget && npm run test:mobile-workflow && npm run test:mobile-table-strategies`  
Expected: PASS at every viewport with no budget regression.

- [ ] **Step 5: Commit**

Run: `git add scripts/smoke-mobile-experience.js scripts/smoke-layout-regression.js scripts/test-build-size-budget.js package.json docs/qa/mobile-experience-checklist.md && git commit -m "test(mobile): cover full system experience"`

### Task 10: 全量验证、推送、部署与生产验收

**Files:**
- Modify generated build artifacts under `dist/`, `lt.html`, and hashed public runtime files as produced by the existing build.
- Update implementation ledger under `.superpowers/sdd/` if the execution workflow created one.

**Interfaces:**
- Consumes every prior task.
- Produces a clean `main`, deployed Cloudflare version and production mobile smoke evidence.

- [ ] **Step 1: Run the complete local validation**

Run: `npm run validate`  
Expected: exit 0 with build, hygiene, state, data, mobile, calculation and layout gates passing.

- [ ] **Step 2: Run focused local delivery smokes**

Run: `npm run smoke:mobile-experience:local`, `npm run smoke:modules:local`, and the same mobile smoke against `file:///.../lt.html`.  
Expected: PASS with no actionable console error, overlap or horizontal body overflow.

- [ ] **Step 3: Review and commit generated artifacts**

Run `git diff --check`, inspect runtime hashes and size budgets, then commit the release artifacts with a focused release message.

- [ ] **Step 4: Sync `origin/main` safely**

Fetch, verify `origin/main` is an ancestor, push `HEAD:main`, and confirm `git ls-remote origin refs/heads/main` equals local `HEAD`.

- [ ] **Step 5: Deploy and verify production**

Run `npx wrangler deploy`, `npm run smoke:prod-minimal`, `npm run smoke:mobile-experience:prod`, and focused production module smoke. Confirm the current Cloudflare deployment version and required GitHub Actions.

- [ ] **Step 6: Final clean-state evidence**

Run `git status --short --branch`; expected clean. Report commit, Cloudflare version, production checks, any network-only retry evidence and the saved mobile QA screenshots.

## Self-Review Result

- Spec coverage: login, shell, global primitives, tables, sheets, action bars, all four module batches, accessibility, performance, multi-viewport QA and release are assigned to Tasks 1–10.
- Step scan: every task follows test failure → minimal implementation → verification → commit.
- Interface consistency: Tasks 2–8 consume the tokens/hooks from Task 1; Task 5 owns `data-mobile-table` and `TableScrollIndicators`; Tasks 6–8 do not redefine them.
- Review focus: all five risks are pinned to explicit browser or contract tests.
- Proportion: the plan records file boundaries, interfaces and gates without prescribing full implementation bodies.
