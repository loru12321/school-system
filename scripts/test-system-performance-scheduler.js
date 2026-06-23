const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'system-performance-runtime.js'), 'utf8');

const activeTimers = new Set();

function setTimer(callback, delay) {
  const id = setTimeout(() => {
    activeTimers.delete(id);
    callback();
  }, Math.max(0, Number(delay) || 0));
  activeTimers.add(id);
  return id;
}

function clearTimer(id) {
  clearTimeout(id);
  activeTimers.delete(id);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  const fakeWindow = {
    setTimeout: setTimer,
    clearTimeout: clearTimer,
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: (callback) => setTimer(() => callback(Date.now()), 0),
    cancelAnimationFrame: clearTimer,
    requestIdleCallback: (callback) => setTimer(() => callback({
      didTimeout: false,
      timeRemaining: () => 50
    }), 0),
    cancelIdleCallback: clearTimer,
    CloudManager: {}
  };
  fakeWindow.window = fakeWindow;

  vm.runInNewContext(source, {
    window: fakeWindow,
    console,
    Date,
    JSON,
    Map,
    Set,
    Promise,
    Number,
    String,
    Object,
    Array,
    Math,
    Error,
    PerformanceObserver: undefined
  });

  const scheduler = fakeWindow.SystemPerformance;
  assert.strictEqual(typeof scheduler.scheduleTask, 'function');
  assert.strictEqual(typeof scheduler.clearScheduledTask, 'function');

  const replaceRuns = [];
  scheduler.scheduleTask('replace-me', () => replaceRuns.push('first'), { delay: 30 });
  scheduler.scheduleTask('replace-me', () => replaceRuns.push('second'), { delay: 5 });
  await wait(50);
  assert.deepStrictEqual(replaceRuns, ['second']);

  const keepRuns = [];
  scheduler.scheduleTask('keep-first', () => keepRuns.push('first'), { delay: 5, replace: false });
  scheduler.scheduleTask('keep-first', () => keepRuns.push('second'), { delay: 5, replace: false });
  await wait(30);
  assert.deepStrictEqual(keepRuns, ['first']);

  const cancelRuns = [];
  scheduler.scheduleTask('cancel-me', () => cancelRuns.push('ran'), { delay: 20 });
  assert.strictEqual(scheduler.clearScheduledTask('cancel-me'), true);
  await wait(40);
  assert.deepStrictEqual(cancelRuns, []);

  const idleRuns = [];
  scheduler.scheduleTask('idle-task', () => idleRuns.push('idle'), { idle: true, timeout: 20 });
  await wait(30);
  assert.deepStrictEqual(idleRuns, ['idle']);

  let cohortFetches = 0;
  fakeWindow.CloudManager.fetchCohortExamsToLocal = () => new Promise((resolve) => {
    cohortFetches += 1;
    setTimer(() => resolve({ success: true, cohortFetches }), 1250);
  });
  scheduler.patchCloudManager();
  await fakeWindow.CloudManager.fetchCohortExamsToLocal('2022', { background: true, minCount: 1, latestOnly: true });
  await fakeWindow.CloudManager.fetchCohortExamsToLocal('2022', { background: true, minCount: 1, latestOnly: false });
  const snapshotAfterBackgroundFetch = scheduler.getSnapshot();
  assert.strictEqual(cohortFetches, 2, 'latestOnly and full cohort fetches should use distinct cache keys');
  assert.strictEqual(
    snapshotAfterBackgroundFetch.longTasks.some((item) => String(item.key || '').includes('fetchCohortExamsToLocal')),
    false,
    'background cohort fetch duration should not be reported as a main-thread long task'
  );

  assert.strictEqual(scheduler.getSnapshot().scheduled, 0);
  activeTimers.forEach(clearTimer);
  console.log('system-performance scheduler tests passed');
})().catch((error) => {
  activeTimers.forEach(clearTimer);
  console.error(error);
  process.exit(1);
});
