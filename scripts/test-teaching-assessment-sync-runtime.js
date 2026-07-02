const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/teaching-assessment-sync-runtime.js'), 'utf8');
const teachingRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/teaching-management-runtime.js'), 'utf8');
const runtimeLoaderSource = fs.readFileSync(path.join(root, 'public/assets/js/runtime-loader-runtime.js'), 'utf8');
const bootRuntimeSource = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');

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
    normalizeSchoolName: (value) => String(value || '').replace(/学校$/, '').trim()
  }
};
context.window.window = context.window;
context.window.document = context.document;
context.window.console = console;
context.window.setTimeout = context.setTimeout;

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
assert.ok(bootRuntimeSource.includes("'teaching-assessment-sync-runtime.js'"), 'assessment sync runtime should load with the workbench, not only after entering teacher analysis');

context.window.tmBuildTeacherAssessmentSyncPayload().then((payload) => {
  assert.match(payload.academic_year, /^20\d{2}-20\d{2}$/);
  assert.ok(payload.items.length >= 4, 'sync payload should include multiple assessment score items');
  const projectIds = new Set(payload.items.map((item) => item.project_id));
  assert.ok(projectIds.has('teacher_two_rates_one_score'), 'payload should include two-rates-one-score');
  assert.ok(projectIds.has('teacher_class_collaboration'), 'payload should include class collaboration');
  assert.ok(projectIds.has('teacher_subject_collaboration'), 'payload should include subject collaboration');
  assert.ok(projectIds.has('teacher_bottom_third'), 'payload should include bottom-third score');
  assert.ok(!projectIds.has('teacher_excellent_contribution'), 'non-July exams must not include excellent contribution');
  assert.ok(!projectIds.has('teacher_workload'), 'payload must not include workload scores');
  payload.items.forEach((item) => {
    assert.ok(Number.isFinite(Number(item.score)), `score should be numeric for ${item.project_id}`);
    assert.ok(Number(item.score) >= 0, `score should be non-negative for ${item.project_id}`);
  });
  context.window.CURRENT_EXAM_ID = '2022级-9年级-2025-2026-暑假-7月质量监测-2026-07-12';
  return context.window.tmBuildTeacherAssessmentSyncPayload().then((julyPayload) => {
    const julyProjectIds = new Set(julyPayload.items.map((item) => item.project_id));
    assert.ok(julyProjectIds.has('teacher_excellent_contribution'), 'July exams should include excellent contribution when top student data exists');
    console.log(JSON.stringify({ ok: true, items: payload.items.length, projects: Array.from(projectIds).sort(), julyItems: julyPayload.items.length }, null, 2));
  });
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
