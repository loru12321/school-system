const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const scheduler = read('public/assets/js/grade-scheduler-runtime.js');
const freshman = read('public/assets/js/freshman-exam-runtime.js');
const freshmanInsight = read('public/assets/js/freshman-constraint-insight-runtime.js');
const runtimeLoader = read('public/assets/js/runtime-loader-runtime.js');
const indexHtml = read('src/index.html');
const stylesheet = read('src/assets/css/main.css');

[
    'preflight: function',
    'getActivitySlots: function',
    'onActivityRangeChange: function',
    'selectScheduleCell: function',
    'swapScheduleCells: function',
    'undoManualMove: function',
    'canPlaceManualCell: function',
    'bindDeclarativeHandlers: function',
    'importExisting: async function',
    'importLockedSchedule: async function',
    'readExistingSchedule: function',
    'parseImportedPeriod: function',
    'parseJointDemandRows: function',
    'rebuildProjectFromDemands: function',
    'rebuildResourceDataFromSchedule: function',
    'getScheduleResourceConflicts: function'
].forEach(token => assert.ok(scheduler.includes(token), `grade scheduler should expose ${token}`));

assert.ok(!scheduler.includes('功能开发中：支持上传 Excel 反向解析课表'), 'existing timetable import must not remain a placeholder');
assert.ok(scheduler.includes("p === '上午'"), 'teacher busy parser should accept documented 上午 shorthand');
assert.ok(scheduler.includes("p === '下午'"), 'teacher busy parser should accept documented 下午 shorthand');
assert.ok(scheduler.includes("p === '晚自习'"), 'teacher busy parser should accept documented 晚自习 shorthand');
assert.ok(scheduler.includes("document.getElementById('sch_run_btn')"), 'run state should bind to the dedicated run button');
assert.ok(scheduler.includes("'学年联合排课导入模板.xlsx'"), 'scheduler should export a dedicated joint-scheduling Excel template');
assert.ok(scheduler.includes("'联合总课表'"), 'scheduler export should include a round-trippable joint timetable sheet');
assert.ok(scheduler.includes("'教师总表'"), 'scheduler export should include a cross-grade teacher review sheet');

[
    'sch_preflight_area',
    'sch_manual_undo',
    'sch_run_btn',
    'sch_project_status',
    'schedulerLockedImportFile',
    'sch_comb_scope',
    'sch_meet_scope',
    'sch_act_scope',
    'data-scheduler-change="activity-range"',
    'data-scheduler-click="preflight"',
    'data-fb-insight-action="preflight"',
    'fb_constraint_review'
].forEach(token => assert.ok(indexHtml.includes(token), `workbench UI should include ${token}`));

assert.ok(!indexHtml.includes('onclick="SCHEDULER.preflight()"'), 'scheduler preflight must not add an inline handler');
assert.ok(!indexHtml.includes('onclick="FB_preflight()"'), 'freshman preflight must not add an inline handler');
assert.ok(!indexHtml.includes('onchange="SCHEDULER.onActivityRangeChange(this)"'), 'activity range must not add an inline handler');
assert.ok(scheduler.includes("[data-scheduler-click]") && scheduler.includes("[data-scheduler-slot]"), 'scheduler actions and dynamic cells should use safe delegated bindings');
assert.ok(scheduler.includes("/^d[1-5]_(?:am|pm|eve)_\\d+$/"), 'scheduler cell slots must be format-validated before dispatch');

assert.ok(freshman.includes('get assignmentDataStatus()'), 'freshman runtime should expose non-sensitive assignment readiness metadata');
assert.ok(freshman.includes('exam_present'), 'exam-only students should default to participating as enrolled students');
assert.ok(freshman.includes('在校参加考试（按学籍处理）'), 'exam-only reconciliation should explain the enrolled participation default');
assert.ok(freshman.includes("['transfer', 'not_enrolled'].includes(item.reason)"), 'only explicit transfer/non-enrolled decisions should exclude exam-only students');
assert.ok(freshman.includes('FB_TRANSFER_STUDENTS.some(student => fbFindRosterMatch'), 'transfer decisions should be excluded from exam aggregation');
assert.ok(freshmanInsight.includes('window.FB_preflight = preflight'), 'freshman insight should expose the review action');
assert.ok(freshmanInsight.includes('分班条件检查通过'), 'freshman insight should give an actionable result');
assert.ok(freshmanInsight.includes('[data-fb-insight-action]'), 'freshman review action should use a scoped declarative binding');
assert.ok(runtimeLoader.includes("bootEntry('freshman-constraint-insight', bootJs('freshman-constraint-insight-runtime.js'))"), 'freshman review must load with the existing demand runtime');

[
    '.scheduler-preflight',
    '.scheduler-project-status',
    '.scheduler-cell.is-selected',
    '.freshman-constraint-review',
    '.freshman-rule-chip'
].forEach(token => assert.ok(stylesheet.includes(token), `stylesheet should include ${token}`));

console.log(JSON.stringify({ ok: true, contract: 'teaching-workbench-real-interaction' }, null, 2));
