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
assert.ok(smoke.includes('loginMs: 30000'), 'login performance budget should protect the optimized entry path');
assert.ok(smoke.includes('appReadyMs: 15000'), 'app-ready performance budget should catch startup regressions');
assert.ok(smoke.includes('moduleSwitchMs: 6000'), 'module switch performance budget should catch slow navigation');
assert.ok(smoke.includes('dataManagerTabMs: 5000'), 'data manager performance budget should catch slow tab changes');
assert.ok(performanceWorkflow.includes('SMOKE_PERF_STRICT: "true"'), 'performance workflow should fail when a browser timing budget regresses');
assert.ok(schedulerTest.includes('scheduleTask'), 'system performance scheduler test should still cover task scheduling');
assert.ok(schedulerTest.includes('requestIdleCallback'), 'system performance scheduler test should still cover idle scheduling');

assert.ok(scripts['test:performance-budget'] === 'node scripts/test-performance-budget.js', 'package script should expose performance budget test');
assert.ok(scripts['check:performance'] && scripts['check:performance'].includes('test:performance-budget'), 'performance check bundle should include budget test');
assert.ok(scripts['check:performance'] && scripts['check:performance'].includes('test:system-performance-scheduler'), 'performance check bundle should include scheduler test');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('check:performance'), 'fast release check should include performance guards');
assert.strictEqual(scripts['check:syntax'], 'node scripts/test-syntax.js', 'syntax check should use recursive syntax coverage');

const budgets = {
  publicAppJs: 930_000,
  publicBootJs: 85_000,
  publicRuntimeLoaderJs: 58_000,
  publicCountyAnalysisJs: 125_000,
  publicProgressAnalysisJs: 95_000,
  publicTeacherAnalysisCoreJs: 85_000,
  publicReportRenderJs: 65_000
};

const actual = {
  publicAppJs: size('public/assets/js/app.js'),
  publicBootJs: size('public/assets/js/boot-runtime.js'),
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
    longTasks: true,
    strictMode: true
  }
}, null, 2));
