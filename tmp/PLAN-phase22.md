# Phase 22 — 抽取 decorateExcelSheet(+XLS_STYLES)到 CORE 槽 excel-style-runtime.js

## 为什么选它(候选评估结论)
重测各函数真实大小后,剩余最大的几个(switchCohort 307 / processDataInner 283 /
initializeAppStartup 228 / parseRows 204 / calcSummary 144)都是编排/数据管线/口径写
的高耦合核心,属 bridge-only。纯搬迁候选里 `decorateExcelSheet` 风险最低、收益明确:

- **纯函数**:入参 (ws, headers),只改传入的 worksheet 对象,无返回、零口径、零 app 状态写、零 DOM。
- **依赖极简**:仅 `XLSX`(window 全局)+ `XLS_STYLES`(app.js:3278 的 const,**零外部引用** → 随它一起搬)。
- **已是事实上的共享工具**:5 处外部调用者已在用它 —— county-analysis / macro-analysis-compat(×2)/ summary-table-export 经 `typeof window.decorateExcelSheet` 守卫调用;student-details-render:1648 裸调。
- 无测试契约 pin `decorateExcelSheet`/`XLS_STYLES` 到 app.js;不在 XLSX_RUNTIME_FUNCTIONS 懒包装列表(它是同步 helper,不该被包装)。
- `XLS_STYLES`(3278-3299)与 decorateExcelSheet(3301-3362)相邻且自成一块,约 85 行连续块。

## 为什么用 CORE 槽(不是 DEFERRED)
调用只发生在真实导出点击时(都在 XLSX.utils.aoa_to_sheet/table_to_sheet 之后),远晚于模块加载。
但 student-details-render:1648 是**裸调**(无守卫),要求 decorateExcelSheet 在它之前已定义在 window。
CORE 槽(school-normalization 之后、app.js 之前,同 Phase 21)保证所有调用者——core 与 deferred——
运行时它都已就位。导出族兄弟(summary-table-export 等)在 DEFERRED,晚于 core,不受影响。

## 步骤
1. **建 `public/assets/js/excel-style-runtime.js`**(IIFE,`(function(root){...})(window)`):
   - 搬入 `XLS_STYLES` 常量 + `decorateExcelSheet` 函数(逐字,body 内 `XLSX`→`root.XLSX`;`XLS_STYLES` 变模块内 const,直接引用)。
   - 回挂:`root.decorateExcelSheet = decorateExcelSheet; root.ExcelStyleRuntime = { decorateExcelSheet, XLS_STYLES };`
2. **app.js**:node-splice 删除 3278-3362(XLS_STYLES + JSDoc + decorateExcelSheet),换单行 `// Moved to` 存根。边界断言(前后行、块内含 `XLS_STYLES.HEADER`/`ws['!freeze']`、不越界到下一函数)。
3. **boot-runtime.js**:APP_MODULES 在 `'school-normalization-runtime.js'` 之后插 `'excel-style-runtime.js'`(与 indicator-calc 同族,均 core、app.js 前)。
4. **test-runtime-order.js**:加载序断言 excel-style 在 app.js 之前(轻量,仿 indicator-calc 的断言)。
5. **验证全绿**(口径导出路径,验证从严):
   - `npm run build`(integrity)
   - `test:calculation-snapshot:local`(字节一致基线不回归)+ `:contract`
   - `smoke:modules:local`(errorCount=0;导出相关 deep-check ok)
   - `test-runtime-order` / `test-runtime-hygiene` / `test-xss-escaping-contract`
   - `check:release-fast`(含 wrangler dry-run)
   - build 可复现
6. **提交 + 部署**:公共链 `git add public/ src/ scripts/`,dist 分开 `git add -f`(gitignored,含新模块 dist 副本);boot/sw hash 会滚动(rename)。rebase perf-trend bot(若有)→ push → 等 Deploy Cloudflare + 生产冒烟绿。
7. 内存 Phase 22 记录 + 逐行归一化 diff 兜底(strip root./window. → 0 diff)。

## 预期
app.js 7990 → ~7905 行(-85)。零口径/状态/DOM 改动,是本轮最干净的一次纯搬迁。
