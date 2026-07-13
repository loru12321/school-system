const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/teaching-assessment-sync-runtime.js'), 'utf8');
const assessmentAppPath = path.resolve(root, '..', '教学质量评价方案', 'app.html');

function normalizeClass(value) {
  return String(value || '').trim().replace(/班$/, '');
}

function buildTeacherStatsFromRows(win) {
  const stats = {};
  Object.entries(win.TEACHER_MAP || {}).forEach(([key, teacherName]) => {
    const [className, subject] = key.split('_');
    const values = (win.RAW_DATA || [])
      .filter((row) => normalizeClass(row.class) === normalizeClass(className))
      .map((row) => Number(row.scores?.[subject]))
      .filter(Number.isFinite);
    if (!values.length) return;
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (!stats[teacherName]) stats[teacherName] = {};
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

function createContext({ examId, rows, teacherMap, exams = {}, syncSettings = { grade6_growth_baseline: 'first_term_final' } }) {
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
      RAW_DATA: rows,
      CURRENT_EXAM_ID: examId,
      MY_SCHOOL: '银山实验学校',
      TEACHER_MAP: teacherMap,
      TEACHER_SCHOOL_MAP: {},
      TEACHER_STATS: {},
      THRESHOLDS: {
        total: { exc: 250, pass: 180 },
        语文: { exc: 85, pass: 60 }, 数学: { exc: 85, pass: 60 }, 英语: { exc: 85, pass: 60 },
        物理: { exc: 70, pass: 45 }, 化学: { exc: 45, pass: 30 }, 政治: { exc: 40, pass: 25 },
        历史: { exc: 80, pass: 60 }, 地理: { exc: 80, pass: 60 }, 生物: { exc: 80, pass: 60 }
      },
      normalizeClass,
      normalizeSchoolName: (value) => String(value || '').replace(/学校$/, '').trim(),
      getCanonicalSchoolName: (value) => {
        const raw = String(value || '').trim();
        return /银山实验/.test(raw) ? '银山实验学校' : raw.replace(/学校$/, '');
      },
      readIndicatorState: () => ({ ind1: '2', ind2: '4', highSchoolLine: '390' }),
      EdgeGateway: {
        getAssessmentSyncSettings: async () => ({ settings: syncSettings })
      }
    }
  };
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.console = console;
  context.window.setTimeout = context.setTimeout;
  context.window.analyzeTeachersV2 = () => buildTeacherStatsFromRows(context.window);
  const db = {
    assessmentRosters: {},
      currentExamId: examId,
      exams: {
        [examId]: {
          examId,
          data: rows,
          meta: {},
          createdAt: Date.parse('2026-07-12')
        },
        ...exams
      }
  };
  context.window.CohortDB = { ensure: () => db };
  vm.createContext(context);
  vm.runInContext(source, context);
  // Lock the current own-school classes in the test fixture so formal automatic scores
  // exercise the same 95% roster gate used in production.
  context.window.AssessmentRosterCore.lockCurrentRoster();
  context.window.__assessmentTestDb = db;
  return context.window;
}

async function checkGrade6GrowthStudentRemap() {
  const examId = '2023级-6年级-2025-2026-暑假-7月质量监测-2026-07-12';
  const baselineId = '2023级-6年级-2025-2026-上学期-期末-2026-01-12';
  const rows = [
    { name: '重名', school: '银山实验学校', class: '6.1', total: 280, scores: { 语文: 96, 数学: 92, 英语: 92 } },
    { name: '重名', school: '银山实验学校', class: '6.1', total: 210, scores: { 语文: 72, 数学: 70, 英语: 68 } },
    { name: '转班甲', school: '银山实验学校', class: '6.1', total: 265, scores: { 语文: 90, 数学: 88, 英语: 87 } },
    { name: '病假缺基准', school: '银山实验学校', class: '6.1', total: 240, scores: { 语文: 82, 数学: 80, 英语: 78 } },
    { name: '六乙', school: '银山实验学校', class: '6.2', total: 250, scores: { 语文: 86, 数学: 84, 英语: 80 } }
  ];
  const baselineRows = [
    { name: '重名', school: '银山实验学校', class: '6.9', total: 290, scores: { 语文: 98, 数学: 96, 英语: 96 } },
    { name: '重名', school: '银山实验学校', class: '6.8', total: 180, scores: { 语文: 60, 数学: 60, 英语: 60 } },
    { name: '转班甲', school: '银山实验学校', class: '6.3', total: 200, scores: { 语文: 64, 数学: 68, 英语: 68 } },
    { name: '无关旧6.1', school: '银山实验学校', class: '6.1', total: 300, scores: { 语文: 100, 数学: 100, 英语: 100 } }
  ];
  const win = createContext({
    examId,
    rows,
    teacherMap: { '6.1_语文': '六语一', '6.2_语文': '六语二' },
    exams: {
      [baselineId]: {
        examId: baselineId,
        data: baselineRows,
        meta: { cohortId: '2023', year: '2025-2026', type: '期末', term: '上学期', date: '2026-01-12', grade: '6年级' },
        createdAt: Date.parse('2026-01-12')
      }
    },
    syncSettings: { grade6_growth_baseline: 'first_term_final' }
  });
  const payload = await win.tmBuildTeacherAssessmentSyncPayload();
  const item = payload.items.find((entry) => entry.teacher_name === '六语一' && entry.project_id === 'teacher_two_rates_one_score');
  assert.ok(item, '6年级语文教师应生成两率一分');
  assert.ok(/重组基准成绩 3\/4 人/.test(item.note), '6年级增幅应按当前班级学生名单重组基准成绩，并忽略无基准学生');
  assert.ok(/顺位配对 2 人/.test(item.note), '同年级重名学生应按当前/基准总分高低顺位配对');
  assert.ok(/1 名学生因只有一次可比成绩/.test(item.note), '只有一次可比成绩的学生应在说明中透明提示');
  assert.ok(item.warning && /病假缺基准/.test(item.warning.message), '分值旁应提供可点击警示说明，列出被忽略学生');
  assert.ok(/厌学、生病、缺考/.test(item.warning.message), '警示说明应覆盖现实缺考/生病等原因');
  assert.ok(!/无关旧6\.1/.test(item.note), '旧班号里的无关学生不得进入当前班级基准');
  assert.ok(payload.growth_baseline_exam_id === baselineId, 'payload 应记录实际增幅基准考试');
  return payload;
}

async function checkGrade7GrowthPreviousJulyStudentRemap() {
  const examId = '2023级-7年级-2025-2026-暑假-7月质量监测-2026-07-12';
  const baselineId = '2023级-6年级-2024-2025-暑假-7月质量监测-2025-07-12';
  const rows = [
    { name: '七甲', school: '银山实验学校', class: '7.1', total: 275, scores: { 语文: 95, 数学: 90, 英语: 90 } },
    { name: '七乙', school: '银山实验学校', class: '7.1', total: 235, scores: { 语文: 80, 数学: 80, 英语: 75 } }
  ];
  const baselineRows = [
    { name: '七甲', school: '银山实验学校', class: '6.3', total: 210, scores: { 语文: 70, 数学: 70, 英语: 70 } },
    { name: '七乙', school: '银山实验学校', class: '6.4', total: 200, scores: { 语文: 68, 数学: 66, 英语: 66 } }
  ];
  const win = createContext({
    examId,
    rows,
    teacherMap: { '7.1_语文': '七语一' },
    exams: {
      [baselineId]: {
        examId: baselineId,
        data: baselineRows,
        meta: { cohortId: '2023', year: '2024-2025', type: '期末', date: '2025-07-12', grade: '6年级' },
        createdAt: Date.parse('2025-07-12')
      }
    }
  });
  const payload = await win.tmBuildTeacherAssessmentSyncPayload();
  const item = payload.items.find((entry) => entry.teacher_name === '七语一' && entry.project_id === 'teacher_two_rates_one_score');
  assert.ok(item, '7年级教师应生成两率一分');
  assert.ok(/优秀率增幅基准：上年度7月同一批学生/.test(item.note), '7年级增幅应使用上年度7月同一批学生');
  assert.ok(/重组基准成绩 2\/2 人/.test(item.note), '7年级增幅应按当前学生名单重组上一年7月成绩');
  assert.strictEqual(payload.growth_baseline_exam_id, baselineId);
  return payload;
}

function nonGradRows(grade) {
  return [
    { name: `${grade}甲`, school: '银山实验学校', class: `${grade}.1`, total: 285, scores: { 语文: 96, 数学: 95, 英语: 94 } },
    { name: `${grade}乙`, school: '银山实验学校', class: `${grade}.1`, total: 252, scores: { 语文: 84, 数学: 85, 英语: 83 } },
    { name: `${grade}丙`, school: '银山实验学校', class: `${grade}.2`, total: 270, scores: { 语文: 90, 数学: 89, 英语: 91 } },
    { name: `${grade}丁`, school: '兄弟学校', class: `${grade}.1`, total: 300, scores: { 语文: 100, 数学: 100, 英语: 100 } }
  ];
}

function secondMockExam(examId, rows, grade, subjects) {
  return {
    [examId]: {
      examId,
      data: rows.map((row) => ({
        ...row,
        scores: subjects.reduce((scores, subject, index) => {
          scores[subject] = 80 + index + (row.school === '兄弟学校' ? 10 : 0);
          return scores;
        }, {})
      })),
      meta: { cohortId: '2023', year: '2025-2026', type: '二模', date: '2026-05-27', grade: `${grade}年级` },
      createdAt: Date.parse('2026-05-27')
    }
  };
}

async function checkNonGrad(grade) {
  const rows = nonGradRows(grade);
  const examId = `2023级-${grade}年级-2025-2026-暑假-7月质量监测-2026-07-12`;
  const teacherMap = {
    [`${grade}.1_语文`]: `${grade}语一`,
    [`${grade}.2_语文`]: `${grade}语二`
  };
  const win = createContext({ examId, rows, teacherMap });
  const payload = await win.tmBuildTeacherAssessmentSyncPayload();
  const projectIds = new Set(payload.items.map((item) => item.project_id));
  assert.ok(projectIds.has('teacher_two_rates_one_score'), `${grade}年级应生成教师两率一分`);
  assert.ok(projectIds.has('teacher_class_collaboration'), `${grade}年级应生成班级协调`);
  assert.ok(projectIds.has('teacher_subject_collaboration'), `${grade}年级应生成学科协作`);
  assert.ok(projectIds.has('teacher_bottom_third'), `${grade}年级应生成后1/3`);
  assert.ok(projectIds.has('teacher_excellent_contribution'), `${grade}年级应生成尖子生培养`);
  assert.ok(!projectIds.has('class_high_school_contribution_grad'), `${grade}年级不应正式生成高中过线率`);
  assert.ok(payload.preview_items.every((item) => item.preview_only), `${grade}年级预览项必须标记 preview_only`);
  const audit = win.tmBuildTeacherAssessmentSyncAudit(payload, { written: payload.items.length, skipped: [] });
  assert.ok(audit.formulas.teacher_two_rates_one_score.includes('乡镇最高值比较含银山实验本校'));
  assert.ok(audit.formulas.teacher_two_rates_one_score.includes('当前任教班级学生名单反查基准考试'));
  assert.ok(audit.formulas.class_average_non_grad.includes('本校同级部最高班级平均分'));
  assert.ok(payload.items.some((item) => /含本校/.test(item.note)), `${grade}年级说明应体现最高值含本校`);
  return payload;
}

async function checkGrade8Makeup() {
  const grade = 8;
  const rows = nonGradRows(grade).map((row) => ({ ...row, scores: { 语文: row.scores.语文, 数学: row.scores.数学, 英语: row.scores.英语 } }));
  const examId = '2023级-8年级-2025-2026-暑假-7月质量监测-2026-07-12';
  const mockId = '2023级-8年级-2025-2026-下学期-二模-2026-05-27';
  const win = createContext({
    examId,
    rows,
    teacherMap: { '8.1_历史': '八史一', '8.2_历史': '八史二' },
    exams: secondMockExam(mockId, rows, 8, ['历史', '地理', '生物'])
  });
  const payload = await win.tmBuildTeacherAssessmentSyncPayload();
  assert.strictEqual(payload.composite_mode, 'july_plain_with_second_mock_teacher_source');
  assert.deepStrictEqual(Array.from(payload.grade8_second_mock_subjects), ['历史', '地理', '生物']);
  assert.strictEqual(payload.makeup_subjects.length, 0, '8年级7月期末不应再合并二模补科');
  assert.ok(payload.items.some((item) => item.subject === '历史' && item.second_mock_source === true), '8年级历史应从二模源单独生成');
  assert.ok(payload.items.some((item) => /单独读取二模结果/.test(item.note)), '8年级史地生说明应写明二模单独来源');
  assert.ok(!payload.items.some((item) => /7 月基准 \+ 二模补科/.test(item.note)), '8年级同步说明不能再声称7月+二模合成');
  return payload;
}

async function checkGrade9() {
  const rows = [
    { name: '九甲', school: '银山实验学校', class: '9.1', scores: { 语文: 120, 数学: 115, 英语: 112, 物理: 85, 化学: 58, 政治: 10, 体育: 60 } },
    { name: '九乙', school: '银山实验学校', class: '9.1', scores: { 语文: 86, 数学: 84, 英语: 80, 物理: 68, 化学: 45, 政治: 12, 体育: 5 } },
    { name: '九丙', school: '银山实验学校', class: '9.2', scores: { 语文: 128, 数学: 124, 英语: 120, 物理: 88, 化学: 60, 政治: 30, 体育: 60 } },
    { name: '九丁', school: '银山实验学校', class: '9.2', scores: { 语文: 124, 数学: 120, 英语: 116, 物理: 84, 化学: 58, 政治: 28, 体育: 60 } },
    { name: '外校高分', school: '兄弟学校', class: '9.1', scores: { 语文: 130, 数学: 128, 英语: 126, 物理: 90, 化学: 60, 政治: 46, 体育: 60 } }
  ];
  rows.forEach((row) => {
    row.total = Object.values(row.scores).reduce((sum, value) => sum + value, 0);
  });
  const examId = '2022级-2025-2026学年-9年级-7月中考-2026-07-12';
  const win = createContext({
    examId,
    rows,
    teacherMap: { '9.1_语文': '九语一', '9.2_语文': '九语二', '9.1_体育': '九体一', '9.2_体育': '九体二' }
  });
  const payload = await win.tmBuildTeacherAssessmentSyncPayload();
  assert.ok(!payload.items.some((item) => item.subject === '体育'), '9年级体育教师不应参与教师考核同步项目');
  assert.ok(!payload.preview_items.some((item) => item.subject === '体育'), '9年级体育教师不应出现在教师考核预览项目中');
  const excellentItems = payload.items.filter((item) => item.project_id === 'teacher_excellent_contribution');
  assert.ok(excellentItems.length > 0, '9年级应生成文化学科教师尖子生培养贡献');
  assert.ok(excellentItems.every((item) => /体育60分/.test(item.note) && /体育教师不进入教师考核/.test(item.note)), '9年级尖子生贡献说明应写明体育只计入总分、不考核体育教师');
  const highSchoolItems = payload.preview_items.filter((item) => item.project_id === 'class_high_school_contribution_grad');
  assert.ok(highSchoolItems.length >= 2, '9年级应生成高中过线率预览项');
  assert.ok(highSchoolItems.every((item) => item.preview_only), '9年级高中过线率只能预览，不能正式同步');
  const scores = Object.fromEntries(highSchoolItems.map((item) => [item.teacher_name, item.score]));
  assert.strictEqual(scores['九语一'], 7.5, '9.1 在390线下过线率1/2，应按本校最高1折算7.5分');
  assert.strictEqual(scores['九语二'], 15, '9.2 在390线下过线率2/2，应按本校最高1折算15分');
  assert.ok(highSchoolItems.every((item) => /高中过线分数 390/.test(item.note)), '9年级测试必须使用390过线分数');
  assert.ok(highSchoolItems.every((item) => /2\/2|1\/2/.test(item.note)), '9年级过线率应按含体育后的总分统计');
  assert.ok(highSchoolItems.every((item) => /本校级部班级最高过线率/.test(item.note)), '9年级过线率分母必须是本校级部班级最高');
  assert.ok(!payload.items.some((item) => item.project_id === 'class_high_school_contribution_grad'), '9年级过线率不能进入正式同步 items');
  assert.ok(payload.preview_items.some((item) => item.project_id === 'class_target_grad' && item.max_score === 33), '毕业班指标完成应按33分预览');
  return payload;
}

function checkAssessmentAppGradeNormalizer() {
  if (!fs.existsSync(assessmentAppPath)) {
    console.warn(`[assessment-app] skip external app normalizer check: ${assessmentAppPath} not found`);
    return;
  }
  const html = fs.readFileSync(assessmentAppPath, 'utf8');
  assert.ok(html.includes('9\\s*年级'), '考核管理系统应显式识别9年级');
  assert.ok(!html.includes('/[6六]/.test(text)'), '考核管理系统年级识别不能被年份中的6误导');
  assert.ok(html.includes('同年级重名学生按当前成绩高低与基准成绩高低顺位对应'), '考核管理系统应说明重名学生增幅配对规则');
  assert.ok(html.includes('只有一次可比成绩的学生按规则忽略'), '考核管理系统应说明单次成绩学生在增幅中忽略并提示');
}

async function checkThresholdRosterAndTownNormalization() {
  const examId = '2023级-6年级-2025-2026-暑假-7月质量监测-2026-07-12';
  const rows = [
    { name: '本校甲', school: '银山实验学校', class: '6.1', total: 210, scores: { 语文: 70, 数学: 70, 英语: 70 } },
    { name: '本校乙', school: '银山实验学校', class: '6.1', total: 180, scores: { 语文: 60, 数学: 60, 英语: 60 } },
    { name: '外校甲', school: '兄弟学校', class: '6.1', total: 300, scores: { 语文: 100, 数学: 100, 英语: 100 } },
    { name: '外校乙', school: '兄弟学校', class: '6.1', total: 285, scores: { 语文: 95, 数学: 95, 英语: 95 } }
  ];
  const win = createContext({ examId, rows, teacherMap: { '6.1_语文': '本校语文' } });
  const payload = await win.tmBuildTeacherAssessmentSyncPayload();
  const classItem = payload.items.find((item) => item.project_id === 'teacher_class_collaboration');
  const subjectItem = payload.items.find((item) => item.project_id === 'teacher_subject_collaboration');
  assert.ok(classItem && classItem.score < 10, '班级协调必须按全镇班级最高原始成绩折算，不能让本校唯一教师直接满分');
  assert.ok(subjectItem && subjectItem.score < 10, '学科协同必须按全镇同学科最高原始成绩折算，不能按100分或本校最高归一化');
  assert.match(classItem.note, /全镇班级最高原始成绩/, '班级协调批注应记录全镇原始分母');
  assert.match(subjectItem.note, /全镇同学科最高原始成绩/, '学科协同批注应记录全镇原始分母');

  const snapshot = Object.values(win.__assessmentTestDb.assessmentRosters)[0];
  snapshot.initial_count = 20;
  snapshot.target_count = 19;
  const rosterPayload = await win.tmBuildTeacherAssessmentSyncPayload();
  const rosterBottom = rosterPayload.items.find((item) => item.project_id === 'teacher_bottom_third');
  assert.ok(/95%名册补零 17 人/.test(rosterBottom.note), '95%目标高于有效实考人数时，后1/3计算必须补零并留下批注');

  const thresholdWin = createContext({ examId, rows, teacherMap: { '6.1_语文': '本校语文' } });
  delete thresholdWin.THRESHOLDS.语文;
  const missingThreshold = await thresholdWin.tmBuildTeacherAssessmentSyncPayload();
  assert.strictEqual(missingThreshold.items.length, 0, '缺少联考分析已确认的学科分数线时不得写入正式自动分');
  assert.ok(missingThreshold.skipped.some((reason) => /缺少已确认的语文优秀线\/及格线/.test(reason)), '对账应明确指出缺失的联考分析分数线');
}

async function checkNonGradTop150SubjectTotal() {
  const examId = '2023级-6年级-2025-2026-暑假-7月质量监测-2026-07-12';
  const rows = [
    { name: '语数外优先', school: '银山实验学校', class: '6.1', total: 1, scores: { 语文: 100, 数学: 100, 英语: 100, 历史: 0 } },
    ...Array.from({ length: 150 }, (_, index) => ({
      name: `总分干扰${index + 1}`,
      school: '银山实验学校',
      class: '6.2',
      total: 999,
      scores: { 语文: 90, 数学: 90, 英语: 90, 历史: 100 }
    }))
  ];
  const win = createContext({ examId, rows, teacherMap: { '6.1_语文': '前150语文' } });
  const payload = await win.tmBuildTeacherAssessmentSyncPayload();
  const item = payload.items.find((entry) => entry.project_id === 'teacher_excellent_contribution' && entry.teacher_name === '前150语文');
  assert.ok(item, '6年级前150名必须按语数外合成总分选出本应入围的学生');
  assert.match(item.note, /贡献值 1/, 'Excel其它科目总分字段不得挤出语数外合成总分更高的学生');
  assert.match(item.note, /固定为语文、数学、英语之和/, '批注应公开前150名总分的固定科目口径');
}

function makeCrossGradeItems(teacherName, grade, subject, score) {
  return [
    'teacher_two_rates_one_score', 'teacher_class_collaboration', 'teacher_subject_collaboration', 'teacher_bottom_third', 'teacher_excellent_contribution'
  ].map((project_id) => ({ teacher_name: teacherName, grade, subject, project_id, score, max_score: project_id === 'teacher_two_rates_one_score' ? 60 : 10 }));
}

function checkCrossGradeRules() {
  const win = createContext({
    examId: '2023级-6年级-2025-2026-暑假-7月质量监测-2026-07-12',
    rows: nonGradRows(6),
    teacherMap: { '6.1_语文': '占位教师' }
  });
  const averaged = win.tmApplyCrossGradeAssessmentRule([
    ...makeCrossGradeItems('跨级语文', '6', '语文', 10),
    ...makeCrossGradeItems('跨级语文', '7', '语文', 6),
    ...makeCrossGradeItems('六年级第二', '6', '数学', 9),
    ...makeCrossGradeItems('七年级第一', '7', '数学', 10),
    ...makeCrossGradeItems('七年级第二', '7', '英语', 9),
    ...makeCrossGradeItems('七年级第三', '7', '物理', 8)
  ], []);
  const mergedItems = averaged.items.filter((item) => item.teacher_name === '跨级语文');
  assert.strictEqual(mergedItems.length, 5, '同名同学科跨两个年级应合并为一套教师项目');
  assert.ok(mergedItems.every((item) => item.cross_grade_mode === 'project_average' && item.score === 8), '名次差超过2时必须按项目算术平均并归属名次靠前年级');
  assert.strictEqual(averaged.summary.merged[0].rank_difference, 3, '跨级审计应记录两年级教师个人总分名次差');

  const manual = win.tmApplyCrossGradeAssessmentRule([
    ...makeCrossGradeItems('跨级不同学科', '6', '语文', 9),
    ...makeCrossGradeItems('跨级不同学科', '7', '数学', 9)
  ], []);
  assert.strictEqual(manual.items.length, 0, '同名跨级但学科不同不得自动写入任何项目');
  assert.strictEqual(manual.summary.manual_review.length, 1, '跨级不同学科必须进入管理员人工复核');
}

(async () => {
  const grade6Growth = await checkGrade6GrowthStudentRemap();
  const grade7Growth = await checkGrade7GrowthPreviousJulyStudentRemap();
  const grade6 = await checkNonGrad(6);
  const grade7 = await checkNonGrad(7);
  const grade8 = await checkGrade8Makeup();
  const grade9 = await checkGrade9();
  await checkThresholdRosterAndTownNormalization();
  await checkNonGradTop150SubjectTotal();
  checkCrossGradeRules();
  checkAssessmentAppGradeNormalizer();
  console.log(JSON.stringify({
    ok: true,
    injected: 'memory-only',
    highSchoolLine: 390,
    grade6GrowthItems: grade6Growth.items.length,
    grade7GrowthItems: grade7Growth.items.length,
    grade6Items: grade6.items.length,
    grade7Items: grade7.items.length,
    grade8Items: grade8.items.length,
    grade9Items: grade9.items.length,
    grade9PreviewItems: grade9.preview_items.length
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
