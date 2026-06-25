import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const historyPath = path.resolve(rootDir, process.env.PERFORMANCE_HISTORY_JSON || 'docs/performance/performance-history.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function envNumber(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fail(message, details) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

const history = readJson(historyPath);
if (!Array.isArray(history) || history.length === 0) {
  fail(`Performance history is empty or invalid: ${path.relative(rootDir, historyPath)}`);
}

const latest = history[history.length - 1];
const previous = history.length > 1 ? history[history.length - 2] : null;
const thresholds = {
  maxBudgetFailures: envNumber('PERF_MAX_BUDGET_FAILURES', 0),
  maxErrors: envNumber('PERF_MAX_ERRORS', 0),
  maxLongTaskMs: envNumber('PERF_MAX_LONG_TASK_MS', 1200),
  maxLongTaskCount: envNumber('PERF_MAX_LONG_TASK_COUNT', 20),
  maxTotalRegressionMs: envNumber('PERF_MAX_TOTAL_REGRESSION_MS', 15000),
  maxLoginRegressionMs: envNumber('PERF_MAX_LOGIN_REGRESSION_MS', 8000),
  maxAppReadyRegressionMs: envNumber('PERF_MAX_APP_READY_REGRESSION_MS', 8000)
};

const failures = [];
if (num(latest.budgetFailureCount) > thresholds.maxBudgetFailures) {
  failures.push(`budget failures ${latest.budgetFailureCount} > ${thresholds.maxBudgetFailures}`);
}
if (num(latest.errorCount) > thresholds.maxErrors) {
  failures.push(`smoke errors ${latest.errorCount} > ${thresholds.maxErrors}`);
}
if (num(latest.maxLongTaskMs) > thresholds.maxLongTaskMs) {
  failures.push(`max long task ${latest.maxLongTaskMs}ms > ${thresholds.maxLongTaskMs}ms`);
}
if (num(latest.longTaskCount) > thresholds.maxLongTaskCount) {
  failures.push(`long task count ${latest.longTaskCount} > ${thresholds.maxLongTaskCount}`);
}

if (previous) {
  const totalRegression = num(latest.totalMs) - num(previous.totalMs);
  const loginRegression = num(latest.loginMs) - num(previous.loginMs);
  const appReadyRegression = num(latest.appReadyMs) - num(previous.appReadyMs);
  if (totalRegression > thresholds.maxTotalRegressionMs) {
    failures.push(`total smoke regression +${totalRegression}ms > ${thresholds.maxTotalRegressionMs}ms`);
  }
  if (loginRegression > thresholds.maxLoginRegressionMs) {
    failures.push(`login regression +${loginRegression}ms > ${thresholds.maxLoginRegressionMs}ms`);
  }
  if (appReadyRegression > thresholds.maxAppReadyRegressionMs) {
    failures.push(`app-ready regression +${appReadyRegression}ms > ${thresholds.maxAppReadyRegressionMs}ms`);
  }
}

const result = {
  ok: failures.length === 0,
  latest: {
    commit: latest.commit || 'local',
    totalMs: num(latest.totalMs),
    loginMs: num(latest.loginMs),
    appReadyMs: num(latest.appReadyMs),
    longTaskCount: num(latest.longTaskCount),
    maxLongTaskMs: num(latest.maxLongTaskMs),
    budgetFailureCount: num(latest.budgetFailureCount),
    errorCount: num(latest.errorCount)
  },
  thresholds,
  failures
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) {
  process.exit(1);
}
