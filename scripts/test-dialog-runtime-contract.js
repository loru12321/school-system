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
const freshmanExam = read('public/assets/js/freshman-exam-runtime.js');
const assessmentRoster = read('public/assets/js/assessment-roster-runtime.js');
const schoolAlias = read('public/assets/js/data-manager-school-alias-runtime.js');
const targetsRuntime = read('public/assets/js/data-manager-targets-runtime.js');
const archiveRuntime = read('public/assets/js/data-manager-archive-runtime.js');
const historyRuntime = read('public/assets/js/data-manager-history-runtime.js');
const saveSyncRuntime = read('public/assets/js/data-manager-save-sync-runtime.js');
const studentRuntime = read('public/assets/js/data-manager-student-runtime.js');
const comparisonRender = read('public/assets/js/comparison-render-runtime.js');
const reportHistory = read('public/assets/js/report-history-runtime.js');

assert.ok(bootRuntime.includes("'dialog-runtime.js'"), 'dialog runtime should load before app.js');
assert.ok(bootRuntime.indexOf("'dialog-runtime.js'") < bootRuntime.indexOf("'app.js'"), 'dialog runtime should precede app.js in the boot module list');
assert.ok(dialogRuntime.includes('SchoolDialogRuntime'), 'dialog runtime should expose a named contract');
assert.ok(
  dialogRuntime.includes('if (assignedZIndex > 0 && currentZIndex === assignedZIndex) return assignedZIndex;')
    && dialogRuntime.includes('delete node.dataset.schoolTopLayer;'),
  'top-layer modal observer should be idempotent and clear its marker while hidden instead of looping on its own style mutation'
);
assert.ok(dialogRuntime.includes('UI.alert = async function'), 'shared UI should expose async alert from dialog runtime');
assert.ok(dialogRuntime.includes('UI.confirm = async function'), 'shared UI should expose async confirm from dialog runtime');
assert.ok(dialogRuntime.includes('UI.prompt = async function'), 'shared UI should expose async prompt from dialog runtime');
assert.ok(appRuntime.includes('const UI = Object.assign(window.UI || {}, {'), 'app.js should extend the shared UI object instead of owning dialog APIs');
assert.ok(appRuntime.includes('window.UI = UI;'), 'app.js should publish loading and toast helpers on window.UI');
assert.ok(appRuntime.includes('async function appConfirmDialog(message, options = {})'), 'app.js should expose a shared confirm helper for high-frequency flows');
assert.ok(appRuntime.includes('if (!options.skipConfirm && !await appConfirmDialog('), 'cohort switching should use the shared confirm dialog');
assert.ok(appRuntime.includes('const ok = await appConfirmDialog(`⚠️ 检测到考试批次'), 'score upload overwrite should use the shared confirm dialog');
assert.ok(appRuntime.includes('return appAlertDialog("⛔ 当前考试已封存，禁止上传新数据", \'warning\')'), 'score upload guards should use the shared alert dialog');
[
  'window.alert(String(message ||',
  'window.confirm(String(message ||',
  'window.prompt(String(message ||'
].forEach((token) => {
  assert.ok(!appRuntime.includes(token), 'app.js should not own native dialog fallbacks');
});
assert.ok(!/(^|[^\w$.])alert\s*\(/m.test(appRuntime),
  'app.js should route remaining alerts through the shared non-blocking dialog API');

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
  ['grade scheduler import alert', gradeScheduler, 'window.UI.alert("请先导入教师任课数据，或先添加手动非考核科目/项目")'],
  ['progress analysis export alert', progressAnalysis, 'window.UI.alert("暂无分析结果，请先进行分析")'],
  ['skin settings logo alert', skinSettings, 'window.UI.alert("Logo 图片过大，请使用 500KB 以内的图片")'],
  ['freshman scenario prompt', freshmanExam, "await window.UI.prompt(\"请输入方案名称"],
  ['freshman scenario confirm', freshmanExam, "await window.UI.confirm(`确定要加载 [${name}] 方案吗？"],
  ['freshman standalone notify wrapper', freshmanExam, 'const notify = (message) => window.alert(message);'],
  ['assessment roster lock confirm', assessmentRoster, 'await confirmAction(`确认锁定 ${state.academicYear} ${state.grade} 的考核名册吗？'],
  ['assessment roster failure alert', assessmentRoster, 'await showAlert(`锁定失败：${error?.message || error}`)'],
  ['school alias delete confirm', schoolAlias, 'await confirmAction(`确定删除对应：${current.alias} → ${current.canonical} 吗？`)'],
  ['targets delete confirm', targetsRuntime, "await confirmAction('确定删除？')"],
  ['targets alert', targetsRuntime, 'root.UI.alert(text)'],
  ['archive delete confirm', archiveRuntime, 'await confirmAction(`⚠️ 确定要删除【${target}】吗？`)'],
  ['archive rename prompt', archiveRuntime, "await promptAction('重命名为：', sourceName)"],
  ['history import alerts', historyRuntime, 'root.UI.alert(String(text || \'\'))'],
  ['save sync confirm', saveSyncRuntime, 'await confirmAction(\'⚠️ 确定要应用所有修改并同步到云端吗？'],
  ['save sync alerts', saveSyncRuntime, 'root.UI.alert(String(text || \'\'))'],
  ['student batch delete confirm', studentRuntime, 'await confirmAction(`⚠️ 确定删除选中的 ${indexes.length} 名学生吗？`)'],
  ['student batch delete alert', studentRuntime, "await safeAlert('请先勾选要删除的学生')"],
  ['comparison mutual aid alerts', comparisonRender, 'comparisonSafeAlert("班级人数不足以分组")'],
  ['report history alerts', reportHistory, 'reportHistorySafeAlert("未找到该学生")']
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
  ['skin-settings-runtime.js', skinSettings],
  ['freshman-exam-runtime.js', freshmanExam],
  ['assessment-roster-runtime.js', assessmentRoster],
  ['data-manager-school-alias-runtime.js', schoolAlias],
  ['data-manager-targets-runtime.js', targetsRuntime],
  ['data-manager-archive-runtime.js', archiveRuntime],
  ['data-manager-history-runtime.js', historyRuntime],
  ['data-manager-save-sync-runtime.js', saveSyncRuntime],
  ['data-manager-student-runtime.js', studentRuntime],
  ['comparison-render-runtime.js', comparisonRender],
  ['report-history-runtime.js', reportHistory]
].forEach(([file, source]) => {
  assert.ok(!/(^|[^\w$.])prompt\s*\(/.test(source), `${file} should not call bare prompt()`);
  assert.ok(!/(^|[^\w$.])confirm\s*\(/.test(source), `${file} should not call bare confirm()`);
  assert.ok(!/(^|[^\w$.])alert\s*\(/.test(source), `${file} should not call bare alert()`);
});

assert.ok(scripts['check:release-fast']?.includes('test:dialog-runtime-contract'), 'fast release checks should include dialog runtime contract');

console.log(JSON.stringify({
  ok: true,
  guardedRuntimes: 31
}, null, 2));
