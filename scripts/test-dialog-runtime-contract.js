const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const appRuntime = read('public/assets/js/app.js');
const teachingCloud = read('public/assets/js/teaching-management-cloud-runtime.js');
const teachingVersion = read('public/assets/js/teaching-management-version-runtime.js');
const teacherSync = read('public/assets/js/teacher-sync-runtime.js');
const reportExport = read('public/assets/js/report-export-runtime.js');
const perfMobile = read('public/assets/js/perf-mobile-runtime.js');
const zhongkaoCountdown = read('public/assets/js/zhongkao-countdown-runtime.js');

assert.ok(appRuntime.includes('alert: async'), 'shared UI should expose async alert');
assert.ok(appRuntime.includes('confirm: async'), 'shared UI should expose async confirm');
assert.ok(appRuntime.includes('prompt: async'), 'shared UI should expose async prompt');

[
  ['teaching management cloud', teachingCloud, 'tmPromptInput'],
  ['teaching management version', teachingVersion, 'tmVersionPrompt'],
  ['teaching management version confirm', teachingVersion, 'tmVersionConfirm'],
  ['teacher sync', teacherSync, 'promptTeacherTermId'],
  ['report export', reportExport, 'confirmReportExport'],
  ['mobile memory cleaner', perfMobile, "UI.confirm('是否刷新页面以完全清理内存?"],
  ['mobile toast fallback', perfMobile, "UI.alert(msg)"],
  ['zhongkao countdown reset', zhongkaoCountdown, "global.UI.confirm('恢复默认设置"]
].forEach(([label, source, token]) => {
  assert.ok(source.includes(token), `${label} should prefer the shared UI dialog API`);
});

[
  ['teaching-management-cloud-runtime.js', teachingCloud],
  ['teaching-management-version-runtime.js', teachingVersion],
  ['teacher-sync-runtime.js', teacherSync],
  ['report-export-runtime.js', reportExport],
  ['perf-mobile-runtime.js', perfMobile],
  ['zhongkao-countdown-runtime.js', zhongkaoCountdown]
].forEach(([file, source]) => {
  assert.ok(!/(^|[^\w$.])prompt\s*\(/.test(source), `${file} should not call bare prompt()`);
  assert.ok(!/(^|[^\w$.])confirm\s*\(/.test(source), `${file} should not call bare confirm()`);
  assert.ok(!/(^|[^\w$.])alert\s*\(/.test(source), `${file} should not call bare alert()`);
});

assert.ok(scripts['check:release-fast']?.includes('test:dialog-runtime-contract'), 'fast release checks should include dialog runtime contract');

console.log(JSON.stringify({
  ok: true,
  guardedRuntimes: 6
}, null, 2));
