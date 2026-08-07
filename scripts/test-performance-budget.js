const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function size(relativePath) {
  return fs.statSync(path.join(root, relativePath)).size;
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const smoke = read('scripts/smoke-all-modules.js');
const schedulerTest = read('scripts/test-system-performance-scheduler.js');
const moduleEntryRuntime = read('public/assets/js/module-entry-runtime.js');
const runtimeLoaderRuntime = read('public/assets/js/runtime-loader-runtime.js');
const countyAnalysisRuntime = read('public/assets/js/county-analysis-runtime.js');
const cohortGrowthRuntime = read('public/assets/js/cohort-growth-runtime.js');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');

const requiredSmokeTokens = [
  'PERFORMANCE_BUDGETS',
  'STRICT_PERFORMANCE_BUDGETS',
  'SMOKE_PERF_STRICT',
  'measureAsync',
  'buildBudgetStatus',
  'readPerformanceSnapshot',
  'loginMs',
  'appReadyMs',
  'moduleTimings',
  'dataManagerTimings',
  'slowestModules',
  'slowestDataManagerTabs',
  'systemPerformanceSnapshot',
  'nativeLongTasks',
  'scheduledTasks',
  'networkWaitMs',
  'longTasks',
  'budgetFailures',
  'switchMs',
  'deepCheckMs',
  'totalMs',
  'dataManagerTabMs'
];

requiredSmokeTokens.forEach((token) => {
  assert.ok(smoke.includes(token), `smoke performance instrumentation missing token: ${token}`);
});

assert.ok(smoke.includes('window.SystemPerformance'), 'smoke should read SystemPerformance snapshots');
assert.ok(smoke.includes('summary.switchModules.push({ ...normalizedSwitchResult, ...timingPayload'), 'module switch results should include timing payloads');
assert.ok(smoke.includes('summary.dataManagerTabs.push({ ...tabResult, performance: tabTiming, cohortGuard })'), 'data manager tab results should include timing and cohort guard payloads');
assert.ok(smoke.includes('const DATA_MANAGER_TAB_STABILIZE_MS'), 'smoke should use per-tab stabilization instead of one fixed wait for all data-manager tabs');
assert.ok(smoke.includes("sql: 120"), 'SQL data-manager smoke tab should use a short stabilization wait because it only checks runtime hooks');
assert.ok(smoke.includes("cloud: 800"), 'cloud data-manager smoke tab should keep a longer stabilization wait for archive row checks');
assert.ok(smoke.includes("default: 320"), 'ordinary data-manager smoke tabs should avoid the old 800ms fixed wait');
assert.ok(smoke.includes('STRICT_PERFORMANCE_BUDGETS && summary.performance.budgetFailures.length > 0'), 'strict performance mode should fail on budget regressions');
assert.ok(smoke.includes('loginMs: 30000'), 'login performance budget should protect the optimized entry path');
assert.ok(smoke.includes('appReadyMs: 15000'), 'app-ready performance budget should catch startup regressions');
assert.ok(smoke.includes('moduleSwitchMs: 1000'), 'module switch performance budget should catch perceptible navigation stalls');
assert.ok(smoke.includes('MODULE_SWITCH_READY_TIMEOUT_MS = 5000'), 'module switch readiness should retain the known-good cap while activation timing stays under the switch budget');
assert.ok(smoke.includes('activationMs: activationTiming.durationMs'), 'switch timing should use the in-page activation measurement when the target activates synchronously');
assert.ok(smoke.includes('let switchMs = Number.isFinite(switchResult?.activationMs)'), 'strict performance budgets should use the real module activation time instead of Playwright RPC delay');
assert.ok(
  smoke.includes("'starter-hub': 0")
    && smoke.includes("'audio-debug': 0")
    && smoke.includes("'data-quality': 0"),
  'lightweight and deferred-render shells should not include the complex-module settle delay in switch timing'
);
assert.ok(smoke.includes('default: 0'), 'module switch timing should measure activation only; deep checks own content readiness');
assert.ok(smoke.includes('dataManagerTabMs: 3000'), 'data manager performance budget should catch slow tab changes');
assert.ok(performanceWorkflow.includes('SMOKE_PERF_STRICT: "true"'), 'performance workflow should fail when a browser timing budget regresses');
assert.ok(schedulerTest.includes('scheduleTask'), 'system performance scheduler test should still cover task scheduling');
assert.ok(schedulerTest.includes('requestIdleCallback'), 'system performance scheduler test should still cover idle scheduling');
assert.ok(
  moduleEntryRuntime.includes('let moduleEntryEpoch = 0;')
    && moduleEntryRuntime.includes('entryEpoch !== moduleEntryEpoch')
    && moduleEntryRuntime.includes('now - lastModuleEntry.at < 250'),
  'module entry should cancel stale async initialization and coalesce rapid duplicate navigation'
);
assert.ok(
  moduleEntryRuntime.includes("scheduleActiveModuleTask('data-quality', 'data-quality-render'")
    && moduleEntryRuntime.includes('{ delay: 1200, idle: true, timeout: 2000 }'),
  'data-quality analysis should run after the navigation shell is ready and cancel when the user leaves'
);
assert.ok(
  runtimeLoaderRuntime.includes('window.ensureFreshmanSimulatorRuntimeLoaded = function ()')
    && runtimeLoaderRuntime.includes('window.ensureExamArrangerRuntimeLoaded = function ()')
    && runtimeLoaderRuntime.includes('window.ensureXlsxVendorLoaded()')
    && runtimeLoaderRuntime.includes('window.ensureChartVendorLoaded()'),
  'new-student and exam-arranger entries should prepare their real interactive vendors on entry'
);
assert.ok(
  moduleEntryRuntime.includes("id === 'freshman-simulator'")
    && moduleEntryRuntime.includes('window.ensureFreshmanSimulatorRuntimeLoaded')
    && moduleEntryRuntime.includes('window.ensureExamArrangerRuntimeLoaded'),
  'module entry should use the scoped, concurrent readiness loaders instead of a core-runtime-only shell'
);
assert.ok(
  countyAnalysisRuntime.includes('function releaseCountyAnalysisHeavyDom()')
    && countyAnalysisRuntime.includes('root.replaceChildren();')
    && countyAnalysisRuntime.includes('clearCountyRenderCache(id);'),
  'county analysis should release inactive heavy DOM while preserving source data'
);
assert.ok(
  cohortGrowthRuntime.includes('releaseHeavyDom()')
    && cohortGrowthRuntime.includes('tbody.replaceChildren();')
    && moduleEntryRuntime.includes('window.CohortGrowth.cacheSignature'),
  'cohort growth should release inactive table DOM and restore it from calculation cache'
);

assert.ok(scripts['test:performance-budget'] === 'node scripts/test-performance-budget.js', 'package script should expose performance budget test');
assert.ok(scripts['check:performance'] && scripts['check:performance'].includes('test:performance-budget'), 'performance check bundle should include budget test');
assert.ok(scripts['check:performance'] && scripts['check:performance'].includes('test:performance-thresholds'), 'performance check bundle should include trend threshold guard');
assert.ok(scripts['check:performance'] && scripts['check:performance'].includes('test:system-performance-scheduler'), 'performance check bundle should include scheduler test');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('check:performance'), 'fast release check should include performance guards');
assert.strictEqual(scripts['check:syntax'], 'node scripts/test-syntax.js', 'syntax check should use recursive syntax coverage');

const budgets = {
  publicAppJs: 835_000,
  publicCohortExamHydrationJs: 7_000,
  // 2026-07-07: 85_700 -> 85_800 for phase-4 startup-hydration-runtime.js manifest registration.
  publicBootJs: 85_800,
  publicRuntimeLoaderJs: 58_000,
  publicCountyAnalysisJs: 125_000,
  publicProgressAnalysisJs: 95_000,
  publicTeacherAnalysisCoreJs: 85_000,
  // 2026-07-08: 65_000 -> 65_200 for P1-S3 XSS escaping (6 tmEscapeHtml wraps on
  // attacker-influenceable student name/school/class before innerHTML). File was
  // already 13 bytes under the old ceiling; the security fix is at minimum size
  // (bare global tmEscapeHtml, no local helper) so a small bump is unavoidable.
  // 66_400（2026-07-27）：家长端排名披露开关。多地教育主管部门要求不得向家长公布学生
  // 具体排名，成绩卡片改为默认只显示所处区间（年级前 30% 等），由 shouldShowParentRank()
  // 控制、学校确认政策后可恢复。该文件在上一次调整后只剩 48 字节余量，属合规必需功能，
  // 代码已收紧到最小实现（三元链、共用 bandStyle、无冗余常量），故按既有惯例小幅上调。
  // 67_200（2026-07-29）：个人报告的展示类科目可见脚注。报告会打印或导出 PDF 给家长，
  // 纸面上没有 tooltip，政治那一行带着班排/校排/镇排，没有可见说明会被当成本次中考的
  // 科目成绩，属口径合规必需。上一次调整后该文件只剩 141 字节余量，任何可见实现都放不进。
  // 已做三轮压缩：合并 DOM 层级 + 样式提成 .report-display-note 类；HTML 构造整体下沉到
  // app.js 的 buildDisplayOnlySubjectFootnote()（本文件只留一次调用）；再砍注释与守卫后
  // 仍超 279 字节，即纯压缩无法达标。注意本预算量的是 public/ 未压缩源码，实际交付的
  // dist/assets/js/report-render-runtime.js 约 45.9KB 且不在本表内，故用户下载体积不变。
  publicReportRenderJs: 67_200
};

const actual = {
  publicAppJs: size('public/assets/js/app.js'),
  publicBootJs: size('public/assets/js/boot-runtime.js'),
  publicCohortExamHydrationJs: size('public/assets/js/cohort-exam-hydration-runtime.js'),
  publicRuntimeLoaderJs: size('public/assets/js/runtime-loader-runtime.js'),
  publicCountyAnalysisJs: size('public/assets/js/county-analysis-runtime.js'),
  publicProgressAnalysisJs: size('public/assets/js/progress-analysis-runtime.js'),
  publicTeacherAnalysisCoreJs: size('public/assets/js/teacher-analysis-core-runtime.js'),
  publicReportRenderJs: size('public/assets/js/report-render-runtime.js')
};

const failures = Object.entries(actual)
  .filter(([key, value]) => value > budgets[key])
  .map(([key, value]) => `${key} exceeds budget: ${value} > ${budgets[key]}`);

assert.deepStrictEqual(failures, [], failures.join('\n'));

console.log(JSON.stringify({
  ok: true,
  budgets,
  actual,
  guards: {
    moduleTimings: true,
    dataManagerTimings: true,
    nativeLongTasks: true,
    scheduledTasks: true,
    longTasks: true,
    strictMode: true
  }
}, null, 2));
