# app.js 分拆交接文档

## Codex 复核更正（2026-07-04）

- 结论：本轮将 `app.js` 大块逻辑拆到 7 个 `*-runtime.js` 的方向合理，符合系统继续模块化的维护路线。
- 已更正：原交接只改了生成后的 `lt.html` 说明，真实构建入口 `public/assets/js/boot-runtime.js` 未加载 7 个新 runtime，构建后会丢文件。已把新 runtime 写入 `APP_MODULES`，并用 `test:runtime-order` 固化顺序。
- 已更正：`cohort-*` 运行时依赖 `app.js` 的状态访问器，不能全部放在 `app.js` 前。当前顺序为：登录、DataManager、学生明细、对比、快照工具在 `app.js` 前；`cohort-exam-meta-runtime.js`、`cohort-db-core-runtime.js` 在 `app.js` 后。
- 已更正：`app.js` 存根注释从日文格式改为 `Moved to ...`，避免混入不一致的注释风格。
- 已更正：工作区核心状态 `COHORT_DB`、`CURRENT_COHORT_ID`、`CURRENT_COHORT_META`、`CURRENT_EXAM_ID` 需要跨 runtime 共享，已从 `let` 调整为全局 `var`，避免拆分后 TDZ/跨脚本访问错误。
- 已更正：本校默认选择重新优先匹配 `银山实验`/`银山实验学校` 等别名，并排除 `教育局` 作为具体本校，防止本校被人数最多学校覆盖。
- 验证：`check:syntax`、`test:runtime-order`、`test:runtime-hygiene`、`test:runtime-registry`、`test:module-inventory`、`test:security-hygiene`、`build`、`smoke:modules:local` 均通过；本地 smoke 显示 `mySchool: 银山实验`、`cohortId: 2022`、当前考试 `2022级-9年级-2025-2026-下学期-二模-2026-05-27`、`scoreCount: 7790`、`errorCount: 0`。
- 观察项：本地 smoke 中 `dm:params` 5074ms，略高于 5000ms 预算 74ms，功能无错误，建议后续作为性能项单独处理。

## 背景

`app.js` 原有 **18,425 行**，640 个顶层声明。项目已有 122 个 `*-runtime.js` 文件，本次按同一命名惯例将 app.js 中最大的逻辑块逐一提取为独立文件。

---

## 已完成的提取（2026-07-04）

| # | 新文件 | 行数 | 原 app.js 行范围 | 内容摘要 |
|---|--------|------|-----------------|----------|
| 1 | `auth-login-runtime.js` | 2,041 | 1671–3710 | `scheduleStartupCloudTask`、`Auth` 对象（登录/登出/账号管理）、`window.openAdminCloudAccountModal`、`window.RoleManager`、`window.alert`/`window.confirm` 覆盖 |
| 2 | `data-manager-core-runtime.js` | 2,328 | 3711–3998 | `DataManager` 对象整体（其内部已委托各 `data-manager-*-runtime.js`） |
| 3 | `student-details-render-runtime.js` | 1,579 | 10196–11774 | `StudentDetailsPerfCache`、`renderStudentDetails`、`buildStudentDetailMobile*`、`exportStudentDetails` |
| 4 | `comparison-render-runtime.js` | 765 | 12495–13258 | `setSingleSelectOptions`、互助分组、`ComparisonRankContextPerfCache`、`findPreviousRecord`、`getStudentExamHistory` |
| 5 | `snapshot-system-runtime.js` | 579 | 16960–17539 | `getCurrentSnapshotPayload`、`createAutoSnapshot`、`applySnapshotPayload`、`saveProjectSnapshot` |
| 6 | `cohort-exam-meta-runtime.js` | 1,147 | 15458–16064 | `COHORT_STORAGE_KEY`、Cohort Picker UI、`CohortManager`、`buildExamKey`、`setCurrentExamMeta`、`isArchiveLocked` |
| 7 | `cohort-db-core-runtime.js` | 355 | 16605–16958 | `CohortDB` 对象（云端/本地 DB 读写） |

**app.js 当前行数：9,640 行**（原 18,425，减少 **8,785 行 ↓47.7%**）

---

## lt.html 加载顺序（当前，约第 1565 行）

```js
'auth-login-runtime.js',
'data-manager-core-runtime.js',
'student-details-render-runtime.js',
'comparison-render-runtime.js',
'snapshot-system-runtime.js',
'app.js',
'cohort-exam-meta-runtime.js',
'cohort-db-core-runtime.js'
```

路径基准：`BOOT_JS_BASE = './public/assets/js/'`

---

## 提取原则

1. **沿用命名惯例**：所有新文件命名为 `*-runtime.js`，放入 `public/assets/js/`
2. **不改变全局接口**：所有 `window.X = ...` 赋值保持不变，对外行为零变化
3. **app.js 中替换为单行存根注释**：格式 `// Moved to xxx-runtime.js (...)`
4. **加载顺序**：`auth-login-runtime.js`、`data-manager-core-runtime.js`、学生明细、对比渲染和快照工具运行时位于 `app.js` 前；依赖 `app.js` 状态访问器的 `cohort-*` 位于 `app.js` 后。
5. **每次提取后验证**：通过 `node` 读取文件确认无语法错误

---

## 剩余建议提取（优先级 3）

| 文件 | 预计行数 | 内容 |
|------|---------|------|
| `report-history-runtime.js` | ~571 | `getCachedStudentReportHistory`、报告缓存逻辑 |
| `indicator-calc-runtime.js` | ~546 | `calcIndicators`、`analyzeTargetGap` |
| `segment-analysis-runtime.js` | ~465 | `renderSegmentAnalysis`、`SB_*` 学科均衡 |
| `starter-guide-runtime.js` | ~423 | `openStarterGuide`，独立引导页逻辑 |

完成后 app.js 预计可进一步降至约 **7,600 行**。

---

## State Fallback 层（暂不动）

app.js 开头约 1,600 行是对 `workspace-state-runtime.js` 等的兜底封装（`window.XRuntime || null` 模式）。
待所有 runtime 文件稳定后统一审查是否可精简。

---

## 关键文件路径

- 新 runtime 文件目录：`public/assets/js/`
- HTML 入口：`lt.html`
- 裁剪后的主文件：`public/assets/js/app.js`
