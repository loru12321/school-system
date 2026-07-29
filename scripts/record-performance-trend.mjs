import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const inputPath = path.resolve(rootDir, process.env.PERFORMANCE_SMOKE_JSON || process.argv[2] || 'docs/performance/latest-smoke.json');
const outputDir = path.resolve(rootDir, process.env.PERFORMANCE_REPORT_DIR || 'docs/performance');
const historyPath = path.join(outputDir, 'performance-history.json');
const reportPath = path.join(outputDir, 'performance-report.md');
const maxHistory = Number(process.env.PERFORMANCE_HISTORY_LIMIT || 80);

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function topBy(items, key, count) {
  return (Array.isArray(items) ? items : [])
    .slice()
    .sort((left, right) => num(right?.[key]) - num(left?.[key]))
    .slice(0, count);
}

function buildRun(smoke) {
  const perf = smoke?.performance || {};
  const moduleTimings = Array.isArray(perf.moduleTimings) ? perf.moduleTimings : [];
  const dataManagerTimings = Array.isArray(perf.dataManagerTimings) ? perf.dataManagerTimings : [];
  const budgetFailures = Array.isArray(perf.budgetFailures) ? perf.budgetFailures : [];
  const nativeLongTasks = Array.isArray(perf.nativeLongTasks)
    ? perf.nativeLongTasks
    : (Array.isArray(perf.longTasks) ? perf.longTasks : []);
  const scheduledTasks = Array.isArray(perf.scheduledTasks) ? perf.scheduledTasks : [];
  return {
    recordedAt: new Date().toISOString(),
    commit: String(process.env.GITHUB_SHA || process.env.PERFORMANCE_COMMIT || '').slice(0, 12),
    branch: String(process.env.GITHUB_REF_NAME || process.env.PERFORMANCE_BRANCH || ''),
    runId: String(process.env.GITHUB_RUN_ID || ''),
    runAttempt: String(process.env.GITHUB_RUN_ATTEMPT || ''),
    url: String(process.env.SMOKE_URL || ''),
    errorCount: num(smoke?.errorCount),
    loginMs: num(perf.loginMs),
    appReadyMs: num(perf.appReadyMs),
    totalMs: num(perf.totalMs),
    moduleCount: moduleTimings.length,
    slowestModules: topBy(moduleTimings, 'totalMs', 8).map((item) => ({
      id: item.id,
      switchMs: num(item.switchMs),
      deepCheckMs: num(item.deepCheckMs),
      totalMs: num(item.totalMs)
    })),
    slowestDataManagerTabs: topBy(dataManagerTimings, 'durationMs', 4).map((item) => ({
      id: item.id,
      durationMs: num(item.durationMs)
    })),
    // Keep longTask* fields for existing thresholds/history. They now mean only
    // PerformanceObserver native long tasks, never end-to-end cloud waits.
    longTaskCount: nativeLongTasks.length,
    maxLongTaskMs: nativeLongTasks.reduce((max, item) => Math.max(max, num(item?.duration)), 0),
    nativeLongTaskCount: nativeLongTasks.length,
    maxNativeLongTaskMs: nativeLongTasks.reduce((max, item) => Math.max(max, num(item?.duration)), 0),
    scheduledTaskCount: scheduledTasks.length,
    maxScheduledTaskMs: scheduledTasks.reduce((max, item) => Math.max(max, num(item?.durationMs)), 0),
    maxNetworkWaitMs: scheduledTasks.reduce((max, item) => Math.max(max, num(item?.networkWaitMs)), 0),
    budgetFailureCount: budgetFailures.length,
    budgetFailures: budgetFailures.map((item) => ({
      label: item.label,
      durationMs: num(item.durationMs),
      budgetMs: num(item.budgetMs)
    }))
  };
}

function delta(current, previous, key) {
  if (!previous) return '';
  const diff = num(current?.[key]) - num(previous?.[key]);
  if (diff === 0) return '0';
  return `${diff > 0 ? '+' : ''}${diff}`;
}

function markdownTable(rows, headers, renderRow) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${renderRow(row).join(' | ')} |`)
  ].join('\n');
}

function buildReport(history) {
  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const recent = history.slice(-15).reverse();
  const lines = [
    '# Performance Trend Report',
    '',
    'This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.',
    '',
    '## Latest Run',
    '',
    `- Commit: \`${latest.commit || 'local'}\``,
    `- Recorded at: ${latest.recordedAt}`,
    `- Total smoke time: ${latest.totalMs} ms ${delta(latest, previous, 'totalMs') ? `(${delta(latest, previous, 'totalMs')} ms vs previous)` : ''}`,
    `- Login: ${latest.loginMs} ms`,
    `- App ready: ${latest.appReadyMs} ms`,
    `- Native long tasks: ${latest.nativeLongTaskCount ?? latest.longTaskCount}, max ${latest.maxNativeLongTaskMs ?? latest.maxLongTaskMs} ms`,
    `- Scheduled task samples: ${latest.scheduledTaskCount || 0}, max end-to-end ${latest.maxScheduledTaskMs || 0} ms, max derived network wait ${latest.maxNetworkWaitMs || 0} ms`,
    `- Budget failures: ${latest.budgetFailureCount}`,
    `- Errors: ${latest.errorCount}`,
    '',
    '## Slowest Modules In Latest Run',
    '',
    markdownTable(latest.slowestModules, ['Module', 'Switch', 'Deep check', 'Total'], (item) => [
      `\`${item.id}\``,
      `${item.switchMs} ms`,
      `${item.deepCheckMs} ms`,
      `${item.totalMs} ms`
    ]),
    '',
    '## Recent Runs',
    '',
    markdownTable(recent, ['Commit', 'Total', 'Login', 'App ready', 'Native long tasks', 'Scheduled tasks', 'Budget failures', 'Errors'], (item) => [
      `\`${item.commit || 'local'}\``,
      `${item.totalMs} ms`,
      `${item.loginMs} ms`,
      `${item.appReadyMs} ms`,
      String(item.nativeLongTaskCount ?? item.longTaskCount),
      String(item.scheduledTaskCount || 0),
      String(item.budgetFailureCount),
      String(item.errorCount)
    ]),
    '',
    '## Data Files',
    '',
    '- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.',
    '- `performance-history.json`: compact cross-commit trend history.',
    '- `performance-report.md`: human-readable trend report.'
  ];
  return `${lines.join('\n')}\n`;
}

const smoke = readJson(inputPath);
if (!smoke || typeof smoke !== 'object') {
  throw new Error(`Performance smoke JSON is empty or invalid: ${inputPath}`);
}

fs.mkdirSync(outputDir, { recursive: true });
const history = readJson(historyPath, []);
if (!Array.isArray(history)) {
  throw new Error(`Performance history is not an array: ${historyPath}`);
}

const run = buildRun(smoke);
history.push(run);
const compactHistory = history.slice(Math.max(0, history.length - maxHistory));

fs.copyFileSync(inputPath, path.join(outputDir, 'latest-smoke.json'));
fs.writeFileSync(historyPath, `${JSON.stringify(compactHistory, null, 2)}\n`, 'utf8');
fs.writeFileSync(reportPath, buildReport(compactHistory), 'utf8');

console.log(JSON.stringify({
  ok: true,
  latest: run,
  historyCount: compactHistory.length,
  report: path.relative(rootDir, reportPath).replace(/\\/g, '/')
}, null, 2));
