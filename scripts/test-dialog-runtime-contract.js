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
const bootRuntime = read('public/assets/js/boot-runtime.js');
const dialogRuntime = read('public/assets/js/dialog-runtime.js');
const teachingCloud = read('public/assets/js/teaching-management-cloud-runtime.js');
const teachingVersion = read('public/assets/js/teaching-management-version-runtime.js');
const teacherSync = read('public/assets/js/teacher-sync-runtime.js');
const reportExport = read('public/assets/js/report-export-runtime.js');
const perfMobile = read('public/assets/js/perf-mobile-runtime.js');
const zhongkaoCountdown = read('public/assets/js/zhongkao-countdown-runtime.js');
const accountAdmin = read('public/assets/js/account-admin-runtime.js');
const dataManagerSql = read('public/assets/js/data-manager-sql.js');
const cloudWorkspace = read('public/assets/js/cloud-workspace-runtime.js');
const cloudCore = read('public/assets/js/cloud.js');
const macroCompareCloud = read('public/assets/js/macro-compare-cloud-runtime.js');
const macroCompareResult = read('public/assets/js/macro-compare-result-runtime.js');
const studentCompareCloud = read('public/assets/js/student-compare-cloud-runtime.js');
const studentCompareResult = read('public/assets/js/student-compare-result-runtime.js');
const teacherCompareCloud = read('public/assets/js/teacher-compare-cloud-runtime.js');
const teacherCompareResult = read('public/assets/js/teacher-compare-result-runtime.js');
const townSubmoduleCompare = read('public/assets/js/town-submodule-compare-runtime.js');
const gradeScheduler = read('public/assets/js/grade-scheduler-runtime.js');
const progressAnalysis = read('public/assets/js/progress-analysis-runtime.js');
const skinSettings = read('public/assets/js/skin-settings-runtime.js');

assert.ok(bootRuntime.includes("'dialog-runtime.js'"), 'dialog runtime should load before app.js');
assert.ok(bootRuntime.indexOf("'dialog-runtime.js'") < bootRuntime.indexOf("'app.js'"), 'dialog runtime should precede app.js in the boot module list');
assert.ok(dialogRuntime.includes('SchoolDialogRuntime'), 'dialog runtime should expose a named contract');
assert.ok(dialogRuntime.includes('UI.alert = async function'), 'shared UI should expose async alert from dialog runtime');
assert.ok(dialogRuntime.includes('UI.confirm = async function'), 'shared UI should expose async confirm from dialog runtime');
assert.ok(dialogRuntime.includes('UI.prompt = async function'), 'shared UI should expose async prompt from dialog runtime');
assert.ok(appRuntime.includes('const UI = Object.assign(window.UI || {}, {'), 'app.js should extend the shared UI object instead of owning dialog APIs');
assert.ok(appRuntime.includes('window.UI = UI;'), 'app.js should publish loading and toast helpers on window.UI');
[
  'window.alert(String(message ||',
  'window.confirm(String(message ||',
  'window.prompt(String(message ||'
].forEach((token) => {
  assert.ok(!appRuntime.includes(token), 'app.js should not own native dialog fallbacks');
});

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
  ['account admin import confirm', accountAdmin, 'await window.UI.confirm(`解析到 ${json.length} 条账号数据'],
  ['data manager sql history confirm', dataManagerSql, "await window.UI.confirm('确定清空 SQL 历史吗？')"],
  ['cloud workspace save alert', cloudWorkspace, "window.UI.alert(`同步失败: ${e.message || e}`)"],
  ['student compare cloud access alert', studentCompareCloud, "window.UI.alert('☁️ 云端服务未连接，无法保存')"],
  ['town submodule compare permission alert', townSubmoduleCompare, "window.UI.alert('权限不足：该多期对比仅管理员、教务主任、级部主任可用')"],
  ['grade scheduler import alert', gradeScheduler, 'window.UI.alert("请先导入教师任课数据")'],
  ['progress analysis export alert', progressAnalysis, 'window.UI.alert("暂无分析结果，请先进行分析")'],
  ['skin settings logo alert', skinSettings, 'window.UI.alert("Logo 图片过大，请使用 500KB 以内的图片")']
].forEach(([label, source, token]) => {
  assert.ok(source.includes(token), `${label} should prefer the shared UI dialog API`);
});

[
  ['teaching-management-cloud-runtime.js', teachingCloud],
  ['teaching-management-version-runtime.js', teachingVersion],
  ['teacher-sync-runtime.js', teacherSync],
  ['report-export-runtime.js', reportExport],
  ['perf-mobile-runtime.js', perfMobile],
  ['zhongkao-countdown-runtime.js', zhongkaoCountdown],
  ['account-admin-runtime.js', accountAdmin],
  ['data-manager-sql.js', dataManagerSql],
  ['cloud-workspace-runtime.js', cloudWorkspace],
  ['cloud.js', cloudCore],
  ['macro-compare-cloud-runtime.js', macroCompareCloud],
  ['macro-compare-result-runtime.js', macroCompareResult],
  ['student-compare-cloud-runtime.js', studentCompareCloud],
  ['student-compare-result-runtime.js', studentCompareResult],
  ['teacher-compare-cloud-runtime.js', teacherCompareCloud],
  ['teacher-compare-result-runtime.js', teacherCompareResult],
  ['town-submodule-compare-runtime.js', townSubmoduleCompare],
  ['grade-scheduler-runtime.js', gradeScheduler],
  ['progress-analysis-runtime.js', progressAnalysis],
  ['skin-settings-runtime.js', skinSettings]
].forEach(([file, source]) => {
  assert.ok(!/(^|[^\w$.])prompt\s*\(/.test(source), `${file} should not call bare prompt()`);
  assert.ok(!/(^|[^\w$.])confirm\s*\(/.test(source), `${file} should not call bare confirm()`);
  assert.ok(!/(^|[^\w$.])alert\s*\(/.test(source), `${file} should not call bare alert()`);
});

assert.ok(scripts['check:release-fast']?.includes('test:dialog-runtime-contract'), 'fast release checks should include dialog runtime contract');

console.log(JSON.stringify({
  ok: true,
  guardedRuntimes: 21
}, null, 2));
