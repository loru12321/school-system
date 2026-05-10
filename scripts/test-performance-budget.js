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
const bootRuntime = read('public/assets/js/boot-runtime.js');
const shellRuntime = read('public/assets/js/shell-runtime.js');
const html = read('src/index.html');
const modernOsShell = fs.existsSync(path.join(root, 'src/assets/css/modern-os-shell.css'))
  ? read('src/assets/css/modern-os-shell.css')
  : '';

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
assert.ok(smoke.includes('summary.dataManagerTabs.push({ ...tabResult, performance: tabTiming })'), 'data manager tab results should include timing payloads');
assert.ok(smoke.includes('STRICT_PERFORMANCE_BUDGETS && summary.performance.budgetFailures.length > 0'), 'strict performance mode should fail on budget regressions');
assert.ok(schedulerTest.includes('scheduleTask'), 'system performance scheduler test should still cover task scheduling');
assert.ok(schedulerTest.includes('requestIdleCallback'), 'system performance scheduler test should still cover idle scheduling');
assert.ok(bootRuntime.includes('getAppCoreModuleCount'), 'boot runtime should derive the core module boundary from app.js');
assert.ok(bootRuntime.includes('loadIdleHydrationModules'), 'boot runtime should hydrate secondary modules in idle chunks');
assert.ok(bootRuntime.includes('__APP_CORE_MODULES_LOADED__'), 'boot runtime should expose app-core readiness separately');
assert.ok(bootRuntime.includes('__APP_SECONDARY_MODULES_LOADED__'), 'boot runtime should track secondary module hydration');
assert.ok(shellRuntime.includes('DEFAULT_CATEGORY'), 'shell runtime should use a stable default category');
assert.ok(shellRuntime.includes('CATEGORY_ALIASES'), 'shell runtime should map legacy categories into the reordered shell');
assert.ok(shellRuntime.includes("macro: {"), 'shell runtime should split macro analysis out of the old all-in-one analysis group');
assert.ok(shellRuntime.includes("teaching: {"), 'shell runtime should expose a dedicated teaching/class diagnosis group');
assert.ok(shellRuntime.includes("student: {"), 'shell runtime should expose a dedicated student growth group');
assert.ok(shellRuntime.includes("intervention: {"), 'shell runtime should expose a dedicated intervention/calculation group');
assert.ok(shellRuntime.includes("id: 'student-details'"), 'reordered shell should keep student details accessible');
assert.ok(shellRuntime.includes("id: 'report-generator'"), 'reordered shell should keep report generator accessible');
assert.ok(shellRuntime.includes("id: 'county-analysis'"), 'reordered shell should keep county analysis accessible');
assert.ok(!html.includes('data-shell-module-rail-shell="floating"'), 'shell should not render the old floating module rail that can cover content');
assert.ok(modernOsShell.includes('prefers-reduced-motion'), 'modern OS shell should respect reduced motion');
assert.ok(modernOsShell.includes('@supports not'), 'modern OS shell should include a low-cost fallback for unsupported blur');

assert.ok(scripts['test:performance-budget'] === 'node scripts/test-performance-budget.js', 'package script should expose performance budget test');
assert.ok(scripts['check:performance'] && scripts['check:performance'].includes('test:performance-budget'), 'performance check bundle should include budget test');
assert.ok(scripts['check:performance'] && scripts['check:performance'].includes('test:system-performance-scheduler'), 'performance check bundle should include scheduler test');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('check:performance'), 'fast release check should include performance guards');
assert.ok(scripts['check:syntax'] && scripts['check:syntax'].includes('scripts/test-performance-budget.js'), 'syntax check should cover performance budget test');

const budgets = {
  publicAppJs: 930_000,
  publicBootJs: 135_000,
  publicCountyAnalysisJs: 125_000,
  publicProgressAnalysisJs: 95_000,
  publicTeacherAnalysisCoreJs: 85_000,
  publicReportRenderJs: 65_000
};

const actual = {
  publicAppJs: size('public/assets/js/app.js'),
  publicBootJs: size('public/assets/js/boot-runtime.js'),
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
    longTasks: true,
    strictMode: true
  }
}, null, 2));
