const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/teaching-assessment-sync-runtime.js'), 'utf8');
const teachingRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/teaching-management-runtime.js'), 'utf8');
const runtimeLoaderSource = fs.readFileSync(path.join(root, 'public/assets/js/runtime-loader-runtime.js'), 'utf8');
const dataManagerRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/data-manager-core-runtime.js'), 'utf8');
const rosterRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/assessment-roster-runtime.js'), 'utf8');
const bootRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');
const teachingCss = fs.readFileSync(path.join(root, 'public/assets/css/teaching-management-module.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const snapshotRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/snapshot-system-runtime.js'), 'utf8');

function buildTeacherStatsFromRows(win) {
  const stats = {};
  const rows = win.RAW_DATA || [];
  Object.entries(win.TEACHER_MAP || {}).forEach(([key, teacherName]) => {
    const [className, subject] = key.split('_');
    const values = rows
      .filter((row) => String(row.class || '').trim() === className)
      .map((row) => Number(row.scores?.[subject]))
      .filter(Number.isFinite);
    if (!values.length) return;
    if (!stats[teacherName]) stats[teacherName] = {};
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    stats[teacherName][subject] = {
      studentCount: values.length,
      excellentRate: values.filter((value) => value >= 85).length / values.length,
      passRate: values.filter((value) => value >= 60).length / values.length,
      avgValue: avg
    };
  });
  win.TEACHER_STATS = stats;
  return stats;
}

const context = {
  console,
  setTimeout: (fn) => {
    if (typeof fn === 'function') fn();
    return 1;
  },
  document: {
    readyState: 'complete',
    getElementById: () => null,
    querySelector: () => null,
    addEventListener: () => {}
  },
  window: {
    RAW_DATA: [
      { school: '银山实验学校', class: '6.1', total: 280, scores: { 语文: 90, 数学: 95, 英语: 94 } },
      { school: '银山实验学校', class: '6.1', total: 240, scores: { 语文: 75, 数学: 85, 英语: 80 } },
      { school: '银山实验学校', class: '6.2', total: 260, scores: { 语文: 80, 数学: 90, 英语: 90 } },
      { school: '兄弟学校', class: '6.1', total: 300, scores: { 语文: 96, 数学: 100, 英语: 98 } }
    ],
    CURRENT_EXAM_ID: '2022级-9年级-2025-2026-下学期-二模-2026-05-27',
    MY_SCHOOL: '银山实验',
    TEACHER_MAP: {
      '6.1_语文': '张老师',
      '6.2_语文': '张老师'
    },
    TEACHER_SCHOOL_MAP: {},
    TEACHER_STATS: {
      张老师: {
        语文: {
          studentCount: 3,
          excellentRate: 1 / 3,
          passRate: 1,
          avgValue: 81.67
        }
      }
    },
    THRESHOLDS: {
      total: { exc: 250, pass: 180 },
      语文: { exc: 85, pass: 60 }, 数学: { exc: 85, pass: 60 }, 英语: { exc: 85, pass: 60 },
      物理: { exc: 70, pass: 45 }, 化学: { exc: 45, pass: 30 }, 政治: { exc: 40, pass: 25 },
      历史: { exc: 80, pass: 60 }, 地理: { exc: 80, pass: 60 }, 生物: { exc: 80, pass: 60 }
    },
    normalizeClass: (value) => String(value || '').trim(),
    normalizeSchoolName: (value) => String(value || '').replace(/学校$/, '').trim(),
    readIndicatorState: () => ({ ind1: '2', ind2: '5', highSchoolLine: '560' })
  }
};
context.window.window = context.window;
context.window.document = context.document;
context.window.console = console;
context.window.setTimeout = context.setTimeout;
context.window.analyzeTeachersV2 = () => buildTeacherStatsFromRows(context.window);
const initialRosterDb = { assessmentRosters: {}, exams: {} };
context.window.CohortDB = { ensure: () => initialRosterDb };
context.window.saveCloudData = async (options) => {
  context.window.__lastRosterCloudSave = options;
  return true;
};

vm.createContext(context);
vm.runInContext(source, context);

assert.strictEqual(typeof context.window.tmBuildTeacherAssessmentSyncPayload, 'function');
assert.ok(source.includes('watchAssessmentSyncMount'), 'assessment sync panel should remount when teaching overview renders later');
assert.ok(teachingRuntimeSource.includes('tmRenderAssessmentSyncPanel'), 'teaching overview scheduler should call assessment sync panel mount hook');
assert.ok(
  /'teacher-analysis': bootSkill[\s\S]*bootEntry\('teaching-assessment-sync', bootJs\('teaching-assessment-sync-runtime\.js'\)\)/.test(runtimeLoaderSource),
  'teacher analysis page should load assessment sync runtime'
);
assert.ok(source.includes('tmRunAutomaticAssessmentSync'), 'assessment sync should expose an automatic background sync runner');
assert.ok(source.includes('tmBuildTeacherAssessmentSyncAudit'), 'assessment sync should expose a reconciliation audit builder');
assert.ok(source.includes("await root.CloudManager.loadTeachers({ background: true, toast: false })"), 'assessment sync should wait for the active cohort teacher roster before calculating');
assert.ok(source.includes('root.syncRuntimeStateToWindow?.()'), 'assessment roster locks should be published to the workspace before cloud save');
assert.ok(source.includes('名册未保存到云端'), 'a failed roster cloud write must reject the lock instead of reporting a false success');
assert.ok(source.includes('WorkspaceState.setCohortDb(db)'), 'roster locks must update the WorkspaceState serialization source before saving');
assert.ok(source.includes('rollback roster state publish failed'), 'a failed roster cloud write must roll back its in-memory lock mutation');
assert.ok(snapshotRuntimeSource.includes('ASSESSMENT_ROSTERS: workspaceSnapshot.cohortDb?.assessmentRosters || {}'), 'workspace snapshots must carry roster locks in the metadata payload');
assert.ok(snapshotRuntimeSource.includes('COHORT_DB.assessmentRosters = db.ASSESSMENT_ROSTERS'), 'workspace restore must restore dedicated roster locks into CohortDB');
assert.ok(source.includes('AssessmentRosterCore') && source.includes('getAssessmentRosterPanelState'), 'assessment sync should expose a core 95% roster API without coupling it to the UI renderer');
assert.ok(indexHtml.includes('tab-data-assessment-roster'), 'data manager should expose a dedicated assessment roster tab');
assert.ok(dataManagerRuntimeSource.includes("tab === 'assessment-roster'") && runtimeLoaderSource.includes("'assessment-roster'"), 'assessment roster tab should lazy-load its dedicated renderer');
assert.ok(dataManagerRuntimeSource.includes("SystemRuntimeLoader.load('assessment-roster')"), 'assessment roster tab must load its renderer bundle, not only the sync core');
assert.ok(rosterRuntimeSource.includes('根据当前成绩锁定名册') && rosterRuntimeSource.includes('95%目标'), 'assessment roster renderer should show lock controls and 95% target counts');
assert.ok(bootRuntimeSource.includes("'teaching-assessment-sync-runtime.js'"), 'assessment sync runtime should load with the workbench, not only after entering teacher analysis');
assert.ok(indexHtml.includes('考核同步对账'), 'teaching management page should show a fixed assessment sync reconciliation entry');
assert.ok(indexHtml.includes('联考分析的“两率一分”同步也在这里看'), 'fixed sync entry should explain where two-rates-one-score sync is checked');
assert.ok(source.includes('collapseAssessmentResult'), 'assessment sync preview button should collapse the result on second click');
assert.ok(source.includes('assessmentSyncOpen'), 'assessment sync panel should track expanded and collapsed state');
assert.ok(source.includes('fetchAssessmentSyncSettings'), 'assessment sync should read cross-system settings before building payload');
assert.ok(source.includes('findGrade6GrowthBaselineExam'), 'assessment sync should find the confirmed grade 6 growth baseline exam');
assert.ok(source.includes('buildStudentGrowthContext'), 'assessment sync should calculate student-remapped excellent-rate growth context');
assert.ok(source.includes('growth_baseline_exam_id'), 'automatic sync signature should include the selected growth baseline exam');
assert.ok(source.includes('getAssessmentSyncItemDigest'), 'automatic sync signature should include a deterministic item digest');
assert.ok(source.includes('`items:${getAssessmentSyncItemDigest(payload.items)}`'), 'automatic sync should rerun when an eligible item value changes');
assert.ok(source.includes('overwrite_manual: true'), 'automatic sync should replace an existing assessment score with the new calculation');
assert.ok(source.includes('优秀率增幅'), 'two-rates-one-score notes should expose excellent-rate growth scoring');
assert.ok(source.includes('tm-assessment-score-warning'), 'assessment sync should show warnings for ignored unmatched growth students');
assert.ok(teachingCss.includes('min-width: 1180px'), 'assessment sync table should keep a wide scrollable layout');
assert.ok(teachingCss.includes('overscroll-behavior-x: contain'), 'assessment sync table should support horizontal scrolling inside the panel');

context.window.tmBuildTeacherAssessmentSyncPayload().then((payload) => {
  assert.match(payload.academic_year, /^20\d{2}-20\d{2}$/);
  assert.strictEqual(payload.items.length, 0, 'non-July exams must not produce any teacher assessment sync items');
  const projectIds = new Set(payload.items.map((item) => item.project_id));
  assert.ok(payload.skipped.some((item) => /7 月成绩为基准/.test(item)), 'non-July exams should explain the July baseline rule');
  assert.ok(!projectIds.has('teacher_two_rates_one_score'), 'non-July payload must not include two-rates-one-score');
  assert.ok(!projectIds.has('teacher_class_collaboration'), 'non-July payload must not include class collaboration');
  assert.ok(!projectIds.has('teacher_subject_collaboration'), 'non-July payload must not include subject collaboration');
  assert.ok(!projectIds.has('teacher_bottom_third'), 'non-July payload must not include bottom-third score');
  assert.ok(!projectIds.has('teacher_excellent_contribution'), 'non-July exams must not include excellent contribution');
  assert.ok(!projectIds.has('teacher_workload'), 'payload must not include workload scores');
  payload.items.forEach((item) => {
    assert.ok(Number.isFinite(Number(item.score)), `score should be numeric for ${item.project_id}`);
    assert.ok(Number(item.score) >= 0, `score should be non-negative for ${item.project_id}`);
  });
  context.window.CURRENT_EXAM_ID = '2025级-6年级-2025-2026-暑假-7月质量监测-2026-07-12';
  return context.window.AssessmentRosterCore.lockCurrentRoster().then(() => {
    assert.strictEqual(context.window.__lastRosterCloudSave?.mode, 'workspace', 'locking must save the workspace snapshot');
    assert.strictEqual(context.window.__lastRosterCloudSave?.forceUpload, true, 'locking must force the cloud write');
    assert.strictEqual(context.window.__lastRosterCloudSave?.sourceLabel, 'assessment-roster-lock', 'locking must mark the cloud write source');
    context.window.saveCloudData = async () => false;
    return context.window.AssessmentRosterCore.lockCurrentRoster()
      .then(() => assert.fail('a failed cloud save must not report a roster lock success'))
      .catch((error) => assert.match(String(error?.message || error), /名册未保存到云端/));
  }).then(() => {
    context.window.saveCloudData = async (options) => {
      context.window.__lastRosterCloudSave = options;
      return true;
    };
    return context.window.tmBuildTeacherAssessmentSyncPayload();
  }).then((julyPayload) => {
    const julyProjectIds = new Set(julyPayload.items.map((item) => item.project_id));
    assert.ok(julyProjectIds.has('teacher_two_rates_one_score'), 'July payload should include two-rates-one-score');
    assert.ok(julyProjectIds.has('teacher_class_collaboration'), 'July payload should include class collaboration');
    assert.ok(julyProjectIds.has('teacher_subject_collaboration'), 'July payload should include subject collaboration');
    assert.ok(julyProjectIds.has('teacher_bottom_third'), 'July payload should include bottom-third score');
    assert.ok(julyProjectIds.has('teacher_excellent_contribution'), 'July exams should include excellent contribution when top student data exists');
    const bottomThirdItems = julyPayload.items.filter((item) => item.project_id === 'teacher_bottom_third');
    assert.ok(bottomThirdItems.length > 0, 'July payload should generate bottom-third teacher items');
    assert.ok(bottomThirdItems.every((item) => /只按总分平均分核算/.test(item.note)), 'bottom-third sync should follow the teacher-personal average-only formula');
    assert.ok(!bottomThirdItems.some((item) => /优秀率|及格率|三项|两率一分三项/.test(item.note)), 'bottom-third teacher sync must not use excellent/pass-rate scoring');
    const audit = context.window.tmBuildTeacherAssessmentSyncAudit(payload, { written: 4, skipped: [] });
    assert.strictEqual(audit.exam.month, 5, 'audit should expose source exam month');
    assert.strictEqual(audit.projects.teacher_excellent_contribution.requiresJuly, true, 'excellent contribution should be marked as July-only');
    assert.strictEqual(audit.projects.teacher_two_rates_one_score.requiresJuly, true, 'two-rates-one-score should be marked as July baseline');
    assert.strictEqual(audit.projects.teacher_excellent_contribution.syncable, 0, 'non-July audit should show zero excellent contribution items');
    assert.strictEqual(audit.projects.teacher_two_rates_one_score.syncable, 0, 'non-July audit should show zero two-rates-one-score items');
    assert.match(audit.formulas.teacher_two_rates_one_score, /54/, 'audit should explain two-rates-one-score body score');
    assert.match(audit.formulas.teacher_bottom_third, /只看平均分/, 'audit should document bottom-third as average-only per teacher personal formula');
    context.window.CURRENT_EXAM_ID = '2023级-8年级-2025-2026-暑假-7月质量监测-2026-07-12';
    context.window.RAW_DATA = [
      { name: '学生甲', school: '银山实验学校', class: '8.1', total: 270, scores: { 语文: 90, 数学: 91, 英语: 89 } },
      { name: '学生乙', school: '银山实验学校', class: '8.1', total: 240, scores: { 语文: 78, 数学: 80, 英语: 82 } },
      { name: '学生丙', school: '兄弟学校', class: '8.1', total: 280, scores: { 语文: 92, 数学: 94, 英语: 93 } }
    ];
    context.window.TEACHER_MAP = { '8.1_历史': '史老师' };
    context.window.TEACHER_STATS = {};
    context.window.CohortDB = (() => {
      const db = {
        assessmentRosters: {},
        currentExamId: context.window.CURRENT_EXAM_ID,
        exams: {
          [context.window.CURRENT_EXAM_ID]: {
            examId: context.window.CURRENT_EXAM_ID,
            data: context.window.RAW_DATA,
            meta: { cohortId: '2023', year: '2025-2026', type: '期末', date: '2026-07-12', grade: '8年级' },
            createdAt: Date.parse('2026-07-12')
          },
          '2023级-8年级-2025-2026-下学期-二模-2026-05-27': {
            examId: '2023级-8年级-2025-2026-下学期-二模-2026-05-27',
            data: [
              { name: '学生甲', school: '银山实验学校', class: '8.1', total: 260, scores: { 历史: 88, 地理: 86, 生物: 90 } },
              { name: '学生乙', school: '银山实验学校', class: '8.1', total: 230, scores: { 历史: 76, 地理: 79, 生物: 81 } },
              { name: '学生丙', school: '兄弟学校', class: '8.1', total: 260, scores: { 历史: 92, 地理: 90, 生物: 91 } }
            ],
            meta: { cohortId: '2023', year: '2025-2026', type: '二模', date: '2026-05-27', grade: '8年级' },
            createdAt: Date.parse('2026-05-27')
          }
        }
      };
      return { ensure: () => db };
    })();
    return context.window.AssessmentRosterCore.lockCurrentRoster().then(() => context.window.tmBuildTeacherAssessmentSyncPayload()).then((grade8Payload) => {
      const historyItems = grade8Payload.items.filter((item) => item.subject === '历史');
      assert.ok(historyItems.length > 0, '8th grade history teacher should sync from second mock rows only');
      assert.strictEqual(grade8Payload.composite_mode, 'july_plain_with_second_mock_teacher_source');
      assert.deepStrictEqual(Array.from(grade8Payload.grade8_second_mock_subjects), ['历史', '地理', '生物']);
      assert.strictEqual(grade8Payload.makeup_subjects.length, 0, '8th grade July final rows must not be patched with second mock makeup subjects');
      assert.ok(historyItems.every((item) => item.source_exam_id === '2023级-8年级-2025-2026-下学期-二模-2026-05-27'), '8th grade history items should use the second mock source exam');
      assert.ok(historyItems.every((item) => item.second_mock_source === true), '8th grade history items should be marked as second-mock sourced');
      assert.match(historyItems[0].note, /单独读取二模结果/);
      assert.match(historyItems[0].note, /不参与本系统7月期末任何模块统计/);
      assert.deepStrictEqual(context.window.RAW_DATA.map((row) => row.scores), [
        { 语文: 90, 数学: 91, 英语: 89 },
        { 语文: 78, 数学: 80, 英语: 82 },
        { 语文: 92, 数学: 94, 英语: 93 }
      ], 'building assessment sync payload must not mutate July final RAW_DATA with history/geography/biology scores');

      context.window.CURRENT_EXAM_ID = '2022级-9年级-2025-2026-暑假-7月中考-2026-07-12';
      context.window.RAW_DATA = [
        { name: '九甲', school: '银山实验学校', class: '9.1', total: 620, scores: { 语文: 108, 数学: 112, 英语: 110, 物理: 96, 化学: 94, 政治: 83, 体育: 58 } },
        { name: '九乙', school: '银山实验学校', class: '9.1', total: 560, scores: { 语文: 98, 数学: 101, 英语: 100, 物理: 88, 化学: 86, 政治: 71, 体育: 55 } },
        { name: '九丁', school: '银山实验学校', class: '9.2', total: 610, scores: { 语文: 106, 数学: 110, 英语: 108, 物理: 94, 化学: 92, 政治: 81, 体育: 56 } },
        { name: '九戊', school: '银山实验学校', class: '9.2', total: 605, scores: { 语文: 105, 数学: 109, 英语: 107, 物理: 93, 化学: 91, 政治: 76, 体育: 57 } },
        { name: '九丙', school: '兄弟学校', class: '9.1', total: 630, scores: { 语文: 110, 数学: 114, 英语: 112, 物理: 98, 化学: 96, 政治: 89, 体育: 58 } }
      ];
      context.window.TEACHER_MAP = { '9.1_政治': '政一', '9.2_政治': '政二', '9.1_语文': '语一', '9.2_语文': '语二', '9.1_体育': '体一', '9.2_体育': '体二' };
      context.window.TEACHER_STATS = {};
      context.window.CohortDB = (() => {
        const db = {
          assessmentRosters: {},
          currentExamId: context.window.CURRENT_EXAM_ID,
          exams: {
            [context.window.CURRENT_EXAM_ID]: {
              examId: context.window.CURRENT_EXAM_ID,
              data: context.window.RAW_DATA,
              meta: { cohortId: '2022', year: '2025-2026', type: '中考', date: '2026-07-12', grade: '9年级' },
              createdAt: Date.parse('2026-07-12')
            },
            '2022级-9年级-2025-2026-下学期-二模-2026-05-27': {
              examId: '2022级-9年级-2025-2026-下学期-二模-2026-05-27',
              data: [
                { name: '九甲', school: '银山实验学校', class: '9.1', total: 620, scores: { 政治: 88 } },
                { name: '九乙', school: '银山实验学校', class: '9.1', total: 560, scores: { 政治: 78 } },
                { name: '九丁', school: '银山实验学校', class: '9.2', total: 610, scores: { 政治: 86 } },
                { name: '九戊', school: '银山实验学校', class: '9.2', total: 605, scores: { 政治: 84 } },
                { name: '九丙', school: '兄弟学校', class: '9.1', total: 630, scores: { 政治: 90 } }
              ],
              meta: { cohortId: '2022', year: '2025-2026', type: '二模', date: '2026-05-27', grade: '9年级' },
              createdAt: Date.parse('2026-05-27')
            }
          }
        };
        return { ensure: () => db };
      })();
      return context.window.AssessmentRosterCore.lockCurrentRoster().then(() => context.window.tmBuildTeacherAssessmentSyncPayload()).then((grade9Payload) => {
        const grade9PoliticsItems = grade9Payload.items.filter((item) => item.subject === '政治');
        assert.ok(grade9PoliticsItems.length > 0, '9th grade politics teacher should produce formal assessment items from the curated column');
        assert.ok(grade9PoliticsItems.every((item) => item.curated_politics_source === true), '9th grade politics must be marked as the curated Zhongkao politics source');
        assert.ok(grade9PoliticsItems.every((item) => item.second_mock_source !== true), '9th grade politics must not read raw second-mock rows');
        assert.ok(grade9PoliticsItems.every((item) => item.source_exam_id === context.window.CURRENT_EXAM_ID && /人工整理的二模政治列/.test(item.note)), '9th grade politics must come from the current Zhongkao archive column');
        assert.deepStrictEqual(Array.from(grade9Payload.second_mock_subjects), [], 'raw second-mock subjects are reserved for grade 8 history/geography/biology');
        assert.strictEqual(grade9Payload.grade9_curated_politics_source, true, 'payload should expose the curated politics provenance');
        assert.ok(/政治:89\/81/.test(grade9Payload.threshold_snapshot), 'missing archive lines must be rebuilt from the current curated Zhongkao politics column, not the raw second mock');
        assert.strictEqual(grade9Payload.grade9_curated_politics_threshold_source, '按中考整理表重建（前15% / 前50%）', 'payload should retain the fallback threshold provenance');
        assert.deepStrictEqual(Array.from(grade9Payload.makeup_subjects), [], 'second mock source rows should not be reported as July makeup subjects');
        const grade9ExcellentItems = grade9Payload.items.filter((item) => item.project_id === 'teacher_excellent_contribution');
        assert.ok(grade9ExcellentItems.length > 0, '9th grade excellent contribution should be generated from 550/600 high-score tiers');
        assert.ok(grade9ExcellentItems.every((item) => /600分以上为优秀尖子/.test(item.note)), '9th grade excellent contribution notes should explain 550/600 rules');
        assert.ok(grade9ExcellentItems.every((item) => /体育教师不进入教师考核/.test(item.note)), '9th grade excellent contribution notes should exclude PE teachers from assessment');
        assert.ok(!grade9ExcellentItems.some((item) => /前 150 名/.test(item.note)), '9th grade excellent contribution must not use non-graduating top-150 logic');
        assert.ok(!grade9Payload.items.some((item) => item.subject === '体育'), 'PE teachers must not be included in formal teacher assessment items');
        assert.ok(!grade9Payload.preview_items.some((item) => item.subject === '体育'), 'PE teachers must not be included in preview teacher assessment rows');
        const classTargetItems = grade9Payload.preview_items.filter((item) => item.project_id === 'class_target_grad');
        assert.ok(!grade9Payload.items.some((item) => item.project_id === 'class_target_grad'), 'class target completion must stay out of formal sync payload');
        assert.ok(classTargetItems.length >= 2, '9th grade class target completion should be available as preview rows');
        assert.ok(classTargetItems.every((item) => item.max_score === 33), 'class target completion max should include extra 5 and 8 bonus points');
        assert.ok(classTargetItems.every((item) => /额外最高\+5分/.test(item.note) && /额外最高\+8分/.test(item.note)), 'class target notes should mark the 5 and 8 points as extra bonus');
        assert.ok(classTargetItems.every((item) => item.preview_only === true), 'class target completion should be marked preview-only');
        const highSchoolItems = grade9Payload.preview_items.filter((item) => item.project_id === 'class_high_school_contribution_grad');
        assert.ok(!grade9Payload.items.some((item) => item.project_id === 'class_high_school_contribution_grad'), 'high-school contribution must stay out of formal sync payload');
        assert.ok(highSchoolItems.length >= 2, '9th grade Zhongkao should preview own-school class high-school contribution rows');
        assert.ok(highSchoolItems.every((item) => item.max_score === 15), 'high-school contribution max score should be 15');
        const highSchoolScores = Object.fromEntries(highSchoolItems.map((item) => [item.teacher_name, item.score]));
        assert.strictEqual(highSchoolScores['政一'], 7.5, 'class 9.1 rate 1/2 should score 7.5 against own-school best class rate 1');
        assert.strictEqual(highSchoolScores['政二'], 15, 'class 9.2 rate 2/2 should score 15 as own-school best class');
        assert.strictEqual(highSchoolScores['语一'], 7.5, 'class 9.1 language teacher should receive the same class high-school contribution score');
        assert.strictEqual(highSchoolScores['语二'], 15, 'class 9.2 language teacher should receive the same class high-school contribution score');
        assert.ok(highSchoolItems.every((item) => /本校级部班级最高过线率/.test(item.note)), 'notes should explain own-school grade best-class denominator');
        assert.ok(highSchoolItems.every((item) => /语数外物化\+体育/.test(item.note)), 'high-school contribution must use the five-subject-plus-PE Zhongkao total');
        assert.ok(highSchoolItems.every((item) => item.preview_only === true), 'high-school contribution should be marked preview-only');
        const highScoreItems = grade9Payload.preview_items.filter((item) => item.project_id === 'class_high_score_grad');
        assert.ok(highScoreItems.length >= 2, '9th grade high-score contribution should be available as preview rows');
        assert.ok(highScoreItems.every((item) => item.max_score === 15 && /550分以上/.test(item.note)), 'high-score preview should explain the 550-point rule');
        const previewAudit = context.window.tmBuildTeacherAssessmentSyncAudit(grade9Payload, { written: grade9Payload.items.length, skipped: [] });
        assert.deepStrictEqual(Array.from(previewAudit.composite.secondMockSubjects), [], 'audit must not label curated politics as raw second-mock data');
        assert.strictEqual(previewAudit.composite.grade9CuratedPoliticsSource, true, 'audit should expose the curated politics source');
        assert.strictEqual(previewAudit.composite.grade9CuratedPoliticsExamDate, '2026-07-12', 'audit should show the Zhongkao archive date for curated politics');
        assert.ok(source.includes('中考整理表的人工二模政治列'), 'audit UI should explicitly label the curated politics rule');
        assert.strictEqual(previewAudit.projects.class_target_grad.mode, 'preview', 'class target should be represented as preview-only in audit');
        assert.strictEqual(previewAudit.projects.class_target_grad.preview, classTargetItems.length, 'audit should count preview-only class target rows');
        assert.strictEqual(previewAudit.projects.class_high_school_contribution_grad.mode, 'preview', 'high-school contribution should be represented as preview-only in audit');
        assert.strictEqual(previewAudit.projects.teacher_workload.mode, 'manual', 'workload should stay manual');

        context.window.CURRENT_EXAM_ID = '2023级-8年级-2025-2026-暑假-7月质量监测-2026-07-12';
        context.window.RAW_DATA = [
          { name: '缺失甲', school: '银山实验学校', class: '8.1', total: 270, scores: { 语文: 90 } }
        ];
        context.window.TEACHER_MAP = { '8.1_历史': '史老师' };
        context.window.TEACHER_STATS = {};
        context.window.CohortDB = (() => {
          const db = {
            assessmentRosters: {},
            currentExamId: context.window.CURRENT_EXAM_ID,
            exams: {
              [context.window.CURRENT_EXAM_ID]: {
                examId: context.window.CURRENT_EXAM_ID,
                data: context.window.RAW_DATA,
                meta: { cohortId: '2023', year: '2025-2026', type: '期末', date: '2026-07-12', grade: '8年级' }
              }
            }
          };
          return { ensure: () => db };
        })();
        return context.window.AssessmentRosterCore.lockCurrentRoster().then(() => context.window.tmBuildTeacherAssessmentSyncPayload()).then((missingPayload) => {
          assert.ok(!missingPayload.items.some((item) => item.subject === '历史'), 'missing second mock data should not write pseudo history scores');
          assert.ok(missingPayload.skipped.some((item) => /8年级历史、地理、生物教师考核需从同届同学年度二模读取/.test(item)), 'missing second mock should be visible in audit skipped reasons');
          console.log(JSON.stringify({ ok: true, items: payload.items.length, projects: Array.from(projectIds).sort(), julyItems: julyPayload.items.length, grade8Items: grade8Payload.items.length, grade9Items: grade9Payload.items.length, auditProjects: Object.keys(audit.projects).length }, null, 2));
        });
      });
    });
  });
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
