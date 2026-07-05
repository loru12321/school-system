const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/teaching-assessment-sync-runtime.js'), 'utf8');
const teachingRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/teaching-management-runtime.js'), 'utf8');
const runtimeLoaderSource = fs.readFileSync(path.join(root, 'public/assets/js/runtime-loader-runtime.js'), 'utf8');
const bootRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');
const teachingCss = fs.readFileSync(path.join(root, 'public/assets/css/teaching-management-module.css'), 'utf8');

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
    normalizeClass: (value) => String(value || '').trim(),
    normalizeSchoolName: (value) => String(value || '').replace(/学校$/, '').trim(),
    readIndicatorState: () => ({ ind1: '2', ind2: '5', highSchoolLine: '600' })
  }
};
context.window.window = context.window;
context.window.document = context.document;
context.window.console = console;
context.window.setTimeout = context.setTimeout;
context.window.analyzeTeachersV2 = () => buildTeacherStatsFromRows(context.window);

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
assert.ok(bootRuntimeSource.includes("'teaching-assessment-sync-runtime.js'"), 'assessment sync runtime should load with the workbench, not only after entering teacher analysis');
const indexHtml = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
assert.ok(indexHtml.includes('考核同步对账'), 'teaching management page should show a fixed assessment sync reconciliation entry');
assert.ok(indexHtml.includes('联考分析的“两率一分”同步也在这里看'), 'fixed sync entry should explain where two-rates-one-score sync is checked');
assert.ok(source.includes('collapseAssessmentResult'), 'assessment sync preview button should collapse the result on second click');
assert.ok(source.includes('assessmentSyncOpen'), 'assessment sync panel should track expanded and collapsed state');
assert.ok(source.includes('fetchAssessmentSyncSettings'), 'assessment sync should read cross-system settings before building payload');
assert.ok(source.includes('findGrade6GrowthBaselineExam'), 'assessment sync should find the confirmed grade 6 growth baseline exam');
assert.ok(source.includes('buildStudentGrowthContext'), 'assessment sync should calculate student-remapped excellent-rate growth context');
assert.ok(source.includes('growth_baseline_exam_id'), 'automatic sync signature should include the selected growth baseline exam');
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
  return context.window.tmBuildTeacherAssessmentSyncPayload().then((julyPayload) => {
    const julyProjectIds = new Set(julyPayload.items.map((item) => item.project_id));
    assert.ok(julyProjectIds.has('teacher_two_rates_one_score'), 'July payload should include two-rates-one-score');
    assert.ok(julyProjectIds.has('teacher_class_collaboration'), 'July payload should include class collaboration');
    assert.ok(julyProjectIds.has('teacher_subject_collaboration'), 'July payload should include subject collaboration');
    assert.ok(julyProjectIds.has('teacher_bottom_third'), 'July payload should include bottom-third score');
    assert.ok(julyProjectIds.has('teacher_excellent_contribution'), 'July exams should include excellent contribution when top student data exists');
    const audit = context.window.tmBuildTeacherAssessmentSyncAudit(payload, { written: 4, skipped: [] });
    assert.strictEqual(audit.exam.month, 5, 'audit should expose source exam month');
    assert.strictEqual(audit.projects.teacher_excellent_contribution.requiresJuly, true, 'excellent contribution should be marked as July-only');
    assert.strictEqual(audit.projects.teacher_two_rates_one_score.requiresJuly, true, 'two-rates-one-score should be marked as July baseline');
    assert.strictEqual(audit.projects.teacher_excellent_contribution.syncable, 0, 'non-July audit should show zero excellent contribution items');
    assert.strictEqual(audit.projects.teacher_two_rates_one_score.syncable, 0, 'non-July audit should show zero two-rates-one-score items');
    assert.match(audit.formulas.teacher_two_rates_one_score, /54/, 'audit should explain two-rates-one-score body score');
    context.window.CURRENT_EXAM_ID = '2023级-8年级-2025-2026-暑假-7月质量监测-2026-07-12';
    context.window.RAW_DATA = [
      { name: '学生甲', school: '银山实验学校', class: '8.1', total: 270, scores: { 语文: 90, 数学: 91, 英语: 89 } },
      { name: '学生乙', school: '银山实验学校', class: '8.1', total: 240, scores: { 语文: 78, 数学: 80, 英语: 82 } },
      { name: '学生丙', school: '兄弟学校', class: '8.1', total: 280, scores: { 语文: 92, 数学: 94, 英语: 93 } }
    ];
    context.window.TEACHER_MAP = { '8.1_历史': '史老师' };
    context.window.TEACHER_STATS = {};
    context.window.CohortDB = {
      ensure: () => ({
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
      })
    };
    return context.window.tmBuildTeacherAssessmentSyncPayload().then((grade8Payload) => {
      const historyItems = grade8Payload.items.filter((item) => item.subject === '历史');
      assert.ok(historyItems.length > 0, '8th grade history teacher should sync from July + second mock composite rows');
      assert.strictEqual(grade8Payload.composite_mode, 'july_with_second_mock_makeup');
      assert.deepStrictEqual(Array.from(grade8Payload.makeup_subjects), ['历史', '地理', '生物']);
      assert.match(grade8Payload.items[0].note, /7 月基准 \+ 二模补科/);
      assert.match(grade8Payload.items[0].note, /二模来源/);

      context.window.CURRENT_EXAM_ID = '2022级-9年级-2025-2026-暑假-7月中考-2026-07-12';
      context.window.RAW_DATA = [
        { name: '九甲', school: '银山实验学校', class: '9.1', total: 620, scores: { 语文: 108, 数学: 112, 英语: 110, 物理: 96, 化学: 94 } },
        { name: '九乙', school: '银山实验学校', class: '9.1', total: 560, scores: { 语文: 98, 数学: 101, 英语: 100, 物理: 88, 化学: 86 } },
        { name: '九丁', school: '银山实验学校', class: '9.2', total: 610, scores: { 语文: 106, 数学: 110, 英语: 108, 物理: 94, 化学: 92 } },
        { name: '九戊', school: '银山实验学校', class: '9.2', total: 605, scores: { 语文: 105, 数学: 109, 英语: 107, 物理: 93, 化学: 91 } },
        { name: '九丙', school: '兄弟学校', class: '9.1', total: 630, scores: { 语文: 110, 数学: 114, 英语: 112, 物理: 98, 化学: 96 } }
      ];
      context.window.TEACHER_MAP = { '9.1_政治': '政一', '9.2_政治': '政二', '9.1_语文': '语一', '9.2_语文': '语二' };
      context.window.TEACHER_STATS = {};
      context.window.CohortDB = {
        ensure: () => ({
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
        })
      };
      return context.window.tmBuildTeacherAssessmentSyncPayload().then((grade9Payload) => {
        assert.ok(grade9Payload.items.some((item) => item.subject === '政治'), '9th grade politics teacher should sync from second mock makeup');
        assert.deepStrictEqual(Array.from(grade9Payload.makeup_subjects), ['政治']);
        const grade9ExcellentItems = grade9Payload.items.filter((item) => item.project_id === 'teacher_excellent_contribution');
        assert.ok(grade9ExcellentItems.length > 0, '9th grade excellent contribution should be generated from 550/600 high-score tiers');
        assert.ok(grade9ExcellentItems.every((item) => /600分以上为优秀尖子/.test(item.note)), '9th grade excellent contribution notes should explain 550/600 rules');
        assert.ok(!grade9ExcellentItems.some((item) => /前 150 名/.test(item.note)), '9th grade excellent contribution must not use non-graduating top-150 logic');
        const classTargetItems = grade9Payload.preview_items.filter((item) => item.project_id === 'class_target_grad');
        assert.ok(!grade9Payload.items.some((item) => item.project_id === 'class_target_grad'), 'class target completion must stay out of formal sync payload');
        assert.ok(classTargetItems.length >= 2, '9th grade class target completion should be available as preview rows');
        assert.ok(classTargetItems.every((item) => item.max_score === 33), 'class target completion max should include extra 5 and 8 bonus points');
        assert.ok(classTargetItems.every((item) => /额外最高\+5分/.test(item.note) && /额外最高\+8分/.test(item.note)), 'class target notes should mark the 5 and 8 points as extra bonus');
        assert.ok(classTargetItems.every((item) => item.preview_only === true), 'class target completion should be marked preview-only');
        const highSchoolItems = grade9Payload.preview_items.filter((item) => item.project_id === 'class_high_school_contribution_grad');
        assert.ok(!grade9Payload.items.some((item) => item.project_id === 'class_high_school_contribution_grad'), 'high-school contribution must stay out of formal sync payload');
        assert.ok(highSchoolItems.length >= 2, '9th grade July exam should preview own-school class high-school contribution rows');
        assert.ok(highSchoolItems.every((item) => item.max_score === 15), 'high-school contribution max score should be 15');
        const highSchoolScores = Object.fromEntries(highSchoolItems.map((item) => [item.teacher_name, item.score]));
        assert.strictEqual(highSchoolScores['政一'], 7.5, 'class 9.1 rate 1/2 should score 7.5 against own-school best class rate 1');
        assert.strictEqual(highSchoolScores['政二'], 15, 'class 9.2 rate 2/2 should score 15 as own-school best class');
        assert.strictEqual(highSchoolScores['语一'], 7.5, 'class 9.1 language teacher should receive the same class high-school contribution score');
        assert.strictEqual(highSchoolScores['语二'], 15, 'class 9.2 language teacher should receive the same class high-school contribution score');
        assert.ok(highSchoolItems.every((item) => /本校级部班级最高过线率/.test(item.note)), 'notes should explain own-school grade best-class denominator');
        assert.ok(highSchoolItems.every((item) => item.preview_only === true), 'high-school contribution should be marked preview-only');
        const highScoreItems = grade9Payload.preview_items.filter((item) => item.project_id === 'class_high_score_grad');
        assert.ok(highScoreItems.length >= 2, '9th grade high-score contribution should be available as preview rows');
        assert.ok(highScoreItems.every((item) => item.max_score === 15 && /550分以上/.test(item.note)), 'high-score preview should explain the 550-point rule');
        const previewAudit = context.window.tmBuildTeacherAssessmentSyncAudit(grade9Payload, { written: grade9Payload.items.length, skipped: [] });
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
        context.window.CohortDB = {
          ensure: () => ({
            currentExamId: context.window.CURRENT_EXAM_ID,
            exams: {
              [context.window.CURRENT_EXAM_ID]: {
                examId: context.window.CURRENT_EXAM_ID,
                data: context.window.RAW_DATA,
                meta: { cohortId: '2023', year: '2025-2026', type: '期末', date: '2026-07-12', grade: '8年级' }
              }
            }
          })
        };
        return context.window.tmBuildTeacherAssessmentSyncPayload().then((missingPayload) => {
          assert.ok(!missingPayload.items.some((item) => item.subject === '历史'), 'missing second mock data should not write pseudo history scores');
          assert.ok(missingPayload.skipped.some((item) => /未找到同届同学年度二模/.test(item)), 'missing second mock should be visible in audit skipped reasons');
          console.log(JSON.stringify({ ok: true, items: payload.items.length, projects: Array.from(projectIds).sort(), julyItems: julyPayload.items.length, grade8Items: grade8Payload.items.length, grade9Items: grade9Payload.items.length, auditProjects: Object.keys(audit.projects).length }, null, 2));
        });
      });
    });
  });
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
