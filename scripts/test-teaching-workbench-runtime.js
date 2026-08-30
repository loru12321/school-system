const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const scheduler = read('public/assets/js/grade-scheduler-runtime.js');
const freshman = read('public/assets/js/freshman-exam-runtime.js');
const freshmanInsight = read('public/assets/js/freshman-constraint-insight-runtime.js');
const runtimeLoader = read('public/assets/js/runtime-loader-runtime.js');
const teacherSyncEntry = read('public/assets/js/teacher-sync-entry-runtime.js');
const moduleEntry = read('public/assets/js/module-entry-runtime.js');
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
assert.ok(scheduler.includes('sessionMatch'), 'teacher busy parser should accept session-specific Chinese slots such as 下午第2节');
assert.ok(scheduler.includes('teacherBlocks:'), 'scheduler should expose teacher subject block weights');
assert.ok(scheduler.includes('getTeacherSubjectBlockScore'), 'scheduler should score same-teacher same-subject blocks');
assert.ok(scheduler.includes('getClassSubjectBalanceScore'), 'scheduler should score daily subject distribution');
assert.ok(scheduler.includes('getTeacherBlockStats'), 'scheduler should summarize teacher block quality');
assert.ok(scheduler.includes('refreshTeacherBusyOptions'), 'scheduler should refresh teacher busy datalist after import');
assert.ok(scheduler.includes('同一教师同一天重复添加会自动合并') || indexHtml.includes('同一教师同一天重复添加会自动合并'), 'busy rule should document multi-slot merge behavior');
assert.ok(scheduler.includes("document.getElementById('sch_run_btn')"), 'run state should bind to the dedicated run button');
assert.ok(scheduler.includes("'学年联合排课导入模板.xlsx'"), 'scheduler should export a dedicated joint-scheduling Excel template');
assert.ok(scheduler.includes("'联合总课表'"), 'scheduler export should include a round-trippable joint timetable sheet');
assert.ok(scheduler.includes("'教师总表'"), 'scheduler export should include a cross-grade teacher review sheet');

[
    'sch_preflight_area',
    'sch_manual_undo',
    'sch_run_btn',
    'sch_busy_teacher_options',
    'sch_teacher_blocks_enabled',
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
assert.ok(freshman.includes('function FB_viewClassViolations'), 'freshman class cards should expose a violation roster viewer');
assert.ok(freshman.includes('data-fb-action="view-violations"'), 'freshman class cards should render a clickable violation count');
assert.ok(freshman.includes('function FB_viewClassRoster'), 'freshman class cards should expose a general roster viewer for count links');
assert.ok(freshman.includes('data-fb-action="view-roster"'), 'freshman class cards should render clickable roster count links');
assert.ok(freshman.includes('data-fb-roster-kind="post"'), 'freshman class cards should expose a combined post-assignment roster link');
assert.ok(stylesheet.includes('.fb-card-count-link'), 'freshman roster count links should have a shared wavy-underline style');
assert.ok(freshman.includes('fbDecorateRosterExportSheet'), 'freshman exports should style violation and dropout rows');
assert.ok(freshman.includes('fbAppendClassRosterSheets'), 'freshman exports should include one worksheet per class');
assert.ok(freshman.includes('fbSafeExportSheetName'), 'freshman class worksheet names should be Excel-safe and unique');
assert.ok(freshman.includes("'新转入': ['DBEAFE', '1D4ED8']"), 'freshman exports should color-code transfer-in students');
assert.ok(freshman.includes("'学籍在册未考试': ['FEF3C7', '92400E']"), 'freshman exports should color-code no-exam roster students');
assert.ok(freshman.includes('特殊学生整行着色'), 'freshman exports should color the full special-student row');
assert.ok(freshman.includes('状态说明'), 'freshman exports should include a human-readable special-student explanation column');
assert.ok(freshman.includes('未参加考试'), 'freshman exports and seat map should label no-exam students instead of showing a fake score');
assert.ok(freshman.includes('is-no-exam'), 'freshman seat map should apply a dedicated no-exam color class');
assert.ok(stylesheet.includes('.desk.is-no-exam'), 'freshman seat map no-exam color should be defined in the shared stylesheet');
assert.ok(teacherSyncEntry.includes('window.openTeacherSync = openTeacherSync'), 'teacher sync entry should be exposed by its deferred runtime');
assert.ok(runtimeLoader.includes("loadOptionalRuntime('teacher-sync-entry', bootJs('teacher-sync-entry-runtime.js'))"), 'teacher sync entry should be demand-loaded from its dedicated runtime');
assert.ok(indexHtml.includes('data-open-teacher-sync'), 'teacher sync entry points should use declarative bindings');
assert.ok(!/onclick="openTeacherSync\(\)"/.test(indexHtml), 'teacher sync entry points should not keep inline onclick handlers');
assert.ok(indexHtml.includes('data-fb-pick="fbTransferInput"'), 'freshman UI should provide a transfer-out roster upload');
assert.ok(indexHtml.includes('data-fb-pick="fbTransferInInput"'), 'freshman UI should provide a transfer-in roster upload');
assert.ok(indexHtml.includes('accept=".xlsx,.xls,.csv" hidden data-fb-change="FB_loadRelatedRosterPack"'), 'freshman related roster package should accept CSV uploads');
assert.ok(freshman.includes('inferSingleSheet'), 'freshman related roster package should infer a single-sheet upload from filename or headers');
assert.ok(indexHtml.includes('data-fb-pick="fbFixedClassInput"'), 'freshman UI should provide a fixed-class roster upload');
assert.ok(indexHtml.includes('data-fb-action="run-division"'), 'freshman generation should use declarative action binding');
assert.ok(indexHtml.includes('data-fb-action="export-result-balance"'), 'freshman balance export should use declarative action binding');
assert.ok(indexHtml.includes('data-fb-action="auto-seat"'), 'freshman seat generation should use declarative action binding');
assert.ok(freshman.includes("action === 'run-division'"), 'freshman binder should dispatch generation action');
assert.ok(freshman.includes("action === 'auto-seat'"), 'freshman binder should dispatch seat generation action');
assert.ok(freshman.includes('function FB_loadTransferList'), 'freshman runtime should parse transfer-out roster uploads');
assert.ok(freshman.includes('function FB_loadTransferInList'), 'freshman runtime should parse transfer-in roster uploads');
assert.ok(freshman.includes('function FB_loadFixedClassList'), 'freshman runtime should parse fixed-class roster uploads');
assert.ok(freshman.includes('function FB_createSameClassGroup'), 'freshman runtime should create same-class groups');
assert.ok(freshman.includes('function FB_loadSameClassList'), 'freshman runtime should parse same-class group uploads');
assert.ok(freshman.includes('fbResolveSameClassGroups'), 'same-class groups should be resolved before placement');
assert.ok(freshman.includes('s1.sameGroupId || s2.sameGroupId'), 'optimizer swaps must not split same-class groups');
assert.ok(indexHtml.includes('id="fb_same_class_student"'), 'freshman UI should provide a same-class student selector');
assert.ok(indexHtml.includes('data-fb-action="create-same-group"'), 'freshman UI should provide same-class group creation');
assert.ok(indexHtml.includes('data-fb-pick="fbSameClassInput"'), 'freshman UI should provide same-class group upload');
assert.ok(indexHtml.includes('组合编号、姓名'), 'same-class group upload should document the row format');
assert.ok(indexHtml.includes('id="fb_separate_student"'), 'freshman UI should provide a separate-group student selector');
assert.ok(indexHtml.includes('data-fb-action="create-separate-group"'), 'freshman UI should provide separate-group creation');
assert.ok(indexHtml.includes('data-fb-pick="fbSeparateInput"'), 'freshman UI should provide a violation separate-group upload');
assert.ok(freshman.includes('function FB_loadSeparateList'), 'freshman runtime should parse separate-group uploads');
assert.ok(freshman.includes('fbResolveSeparateGroups'), 'separate groups should be resolved before placement');
assert.ok(freshman.includes('fbValidateSeparateGroups'), 'separate groups should be validated before generation');
assert.ok(freshman.includes('每人将进入不同班级'), 'separate-group UI should explain the hard constraint');
assert.ok(freshman.includes('违纪分开组'), 'freshman exports should include separate-group labels');
assert.ok(moduleEntry.includes('initDeepLinkedModule'), 'freshman deep links should initialize their runtime');
assert.ok(freshman.includes('fbFixedAssignmentCandidates'), 'fixed-class student selector should use uploaded roster candidates before cloud assembly');
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
