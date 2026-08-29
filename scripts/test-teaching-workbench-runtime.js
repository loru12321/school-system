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
assert.ok(freshman.includes("!['transfer', 'not_enrolled'].includes(item.reason)"), 'dropout roster students should remain eligible for post-division allocation');
assert.ok(freshman.includes('辍学/长期离校（不参与分班）'), 'roster reconciliation should provide an explicit dropout reason');
assert.ok(indexHtml.includes('data-fb-pick="fbDropoutInput"'), 'freshman UI should provide a dropout roster upload');
assert.ok(freshman.includes('window.FB_loadRosterList = FB_loadRosterList'), 'freshman roster upload handler must be exported for declarative file input binding');
assert.ok(freshman.includes('function FB_loadDropoutList'), 'freshman runtime should parse dropout roster uploads');
assert.ok(freshman.includes('fbIsDropout(rosterRow)'), 'dropout roster matches should be diverted before exam aggregation');
assert.ok(freshman.includes('function fbIsTransferred(row)'), 'transfer roster matching should have a dedicated exclusion helper');
assert.ok(freshman.includes("student.name === row.name"), 'transfer exclusion should fall back to name regardless of gender entry');
assert.ok(freshman.includes('nameExamRows'), 'duplicate detection should track names per exam to avoid cross-exam false positives');
assert.ok(freshman.includes('record.count > 1'), 'duplicate detection should only warn for repeated names within one exam');
assert.ok(!freshman.includes('window.confirm('), 'freshman runtime must not use native confirm that blocks mobile browsers');
assert.ok(freshman.includes('function fbAcademicYearStart'), 'freshman exam selection should normalize exam dates to academic-year starts');
assert.ok(freshman.includes('function fbCurrentCohortEntryYear'), 'freshman exam selection should read the active cohort entry year');
assert.ok(freshman.includes('function fbGetRecentExams(limit = 3, targetGrade = \'\')'), 'freshman exam selection should accept the target grade');
assert.ok(freshman.includes('targetAcademicYear - 1'), 'new grade selection should include the prior grade before September');
assert.ok(freshman.includes('fbGetRecentExams(examLimit, targetGrade)'), 'cloud assembly should filter exams using the selected target grade');
assert.ok(freshman.includes('9月前按上一年级，9月后按目标年级'), 'freshman result summary should disclose the new-grade transition rule');
assert.ok(freshman.includes('不同考试的考号可能重新编排'), 'roster reconciliation should document cross-exam id changes');
assert.ok(freshman.includes('const stableKey = (row)'), 'exam aggregation should use a stable cross-exam student key');
assert.ok(freshman.includes('duplicateNames.has(nm) ? fbStudentKey(row) : `name:${nm}`'), 'only same-exam duplicate names should fall back to exam ids');
const stableAggregationBlock = freshman.match(/const stableByKey = new Map\(\);[\s\S]*?\/\/ 用稳定键结果替换前面按原始考号聚合的结果。/)?.[0] || '';
assert.ok(stableAggregationBlock.includes('if (!fbExamBelongsToCurrentSchool(row, ex.meta)) return;'), 'stable cross-exam aggregation must keep the current-school filter before replacing the first pass');
assert.ok(freshman.includes("<th>男生</th><th>女生</th><th>有效成绩人数</th>"), 'freshman stage balance tables must show male and female counts separately');
assert.ok(freshman.includes("['班级', '总人数', '男生', '女生', '有效成绩人数']"), 'freshman balance export must include separate male and female columns');
assert.ok(freshman.includes('function fbResolveSubjectThreshold(subject, kind, scores)'), 'freshman two-rate metrics must resolve thresholds from the current exam before falling back to quantiles');
assert.ok(freshman.includes("const excellentLine = fbResolveSubjectThreshold(subject, 'excellent', allValues)"), 'freshman subject metrics must use one global excellent line across classes');
assert.ok(freshman.includes("const passLine = fbResolveSubjectThreshold(subject, 'pass', allValues)"), 'freshman subject metrics must use one global pass line across classes');
assert.ok(freshman.includes("const excLine = fbResolveSubjectThreshold(sub, 'excellent', globalValues)"), 'freshman optimizer must use the same global excellent line as the displayed metrics');
assert.ok(freshman.includes("const passLine = fbResolveSubjectThreshold(sub, 'pass', globalValues)"), 'freshman optimizer must use the same global pass line as the displayed metrics');
assert.ok(freshman.includes('function fbBalanceGenderCounts(classes, k)'), 'freshman strict gender mode should have a deterministic balancing pass');
assert.ok(freshman.includes('fbBalanceGenderCounts(classes, k);'), 'freshman generation should apply the deterministic gender balancing pass');
assert.ok(indexHtml.includes('data-fb-pick="fbTransferInput"'), 'freshman UI should provide a transfer-out roster upload');
assert.ok(indexHtml.includes('data-fb-pick="fbTransferInInput"'), 'freshman UI should provide a transfer-in roster upload');
assert.ok(freshman.includes('function FB_loadTransferList'), 'freshman runtime should parse transfer-out roster uploads');
assert.ok(freshman.includes('function FB_loadTransferInList'), 'freshman runtime should parse transfer-in roster uploads');
assert.ok(freshman.includes('fbIsTransferred(rosterRow)'), 'transfer decisions should be excluded from exam aggregation');
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
