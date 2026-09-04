// 考核学科口径：政治/历史/地理/生物在所有年级只展示、不计考核；6/7 年级考核=语数英，
// 8/9 年级=语数英物化。老考试加载时必须收敛到同一口径（SUBJECTS、total、exam.config）。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
const cohortExamMetaSource = fs.readFileSync(path.join(root, 'public/assets/js/cohort-exam-meta-runtime.js'), 'utf8');
const cohortDbSource = fs.readFileSync(path.join(root, 'public/assets/js/cohort-db-core-runtime.js'), 'utf8');
const parseRowsSource = fs.readFileSync(path.join(root, 'public/assets/js/parse-rows-runtime.js'), 'utf8');

// vm 上下文里的数组原型与宿主不同，deepStrictEqual 会因原型不同判不等，统一按 JSON 比较。
function same(actual, expected, message) {
    assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected), message);
}

function extractFunction(source, name) {
    const pattern = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`);
    const match = pattern.exec(source);
    assert.ok(match, `${name} should exist`);
    const start = match.index;
    const next = source.slice(start + 1).search(/\n(?:async\s+)?function\s+|\nconst\s+[A-Z_]+\s*=|\nwindow\./);
    return source.slice(start, next >= 0 ? start + 1 + next : source.length);
}

function extractConst(source, name) {
    const start = source.indexOf(`const ${name} =`);
    assert.ok(start >= 0, `${name} should exist`);
    const end = source.indexOf(';\n', start);
    return source.slice(start, end + 1);
}

// ── 源码契约 ─────────────────────────────────────────────────────────────────
assert.ok(!/analysisSubs: 'auto'/.test(extractFunction(cohortExamMetaSource, 'getGradeModeConfig')),
    'no grade may fall back to the old "all detected subjects count" mode');
assert.ok(/normalizeCohortExamSubjectPolicy\(COHORT_DB, currentExamId \? \{ onlyExamIds: \[currentExamId\] \}/.test(cohortDbSource) && /scheduleDeferredCohortExamSubjectPolicy\(COHORT_DB\)/.test(cohortDbSource),
    'CohortDB.ensure must migrate stored exams to the subject policy');
assert.ok(/const modeResult = applyModeByGrade\([\s\S]*?if \(modeResult && modeResult\.changed\) \{[\s\S]*?shouldRecalculate = true;/.test(cohortDbSource),
    'applyExamToWorkspace must force recalculation when stored SUBJECTS still carried display-only subjects');
assert.ok(parseRowsSource.includes('root.applyConfiguredAnalysisSubjects(root.CONFIG)'),
    'parseRows must use the shared analysis-subject filter');

// ── 组装最小运行环境 ─────────────────────────────────────────────────────────
const context = {
    console,
    window: null,
    document: { getElementById: () => null, querySelectorAll: () => [] },
    CONFIG: { name: '6-8年级', label: '全科总', totalSubs: 'auto', analysisSubs: 'auto', extraDisplaySubs: [], mode: 'multi' },
    SUBJECTS: [],
    Date
};
context.window = context;
context.setConfigState = (config) => { context.CONFIG = config; context.window.CONFIG = config; return config; };
context.setSubjects = (subjects) => { context.SUBJECTS = Array.isArray(subjects) ? subjects : []; context.window.SUBJECTS = context.SUBJECTS; return context.SUBJECTS; };
context.getEffectiveGrade = (meta) => String(meta?.grade || '');

const script = [
    extractFunction(appSource, 'getConfiguredDisplaySubjects'),
    extractFunction(appSource, 'getTotalSubjectsForLabel'),
    extractFunction(appSource, 'getTotalSubjectLabel'),
    extractFunction(appSource, 'applyConfiguredAnalysisSubjects'),
    extractFunction(appSource, 'normalizeStudentTotalsForCurrentConfig'),
    'function refreshTotalSubjectPresentation() { CONFIG.label = getTotalSubjectLabel({ config: CONFIG, subjects: SUBJECTS }); return CONFIG.label; }',
    extractConst(cohortExamMetaSource, 'GRADE_MODE_ASSESSMENT_SUBJECTS'),
    extractConst(cohortExamMetaSource, 'GRADE_MODE_DISPLAY_ONLY_SUBJECTS'),
    extractConst(cohortExamMetaSource, 'SUBJECT_POLICY_VERSION'),
    extractFunction(cohortExamMetaSource, 'normalizeGradeModeKey'),
    extractFunction(cohortExamMetaSource, 'getGradeModeConfig'),
    extractFunction(cohortExamMetaSource, 'applyModeByGrade'),
    extractFunction(cohortExamMetaSource, 'normalizeCohortExamSubjectPolicy'),
    'this.getGradeModeConfig = getGradeModeConfig; this.applyModeByGrade = applyModeByGrade; this.normalizeCohortExamSubjectPolicy = normalizeCohortExamSubjectPolicy; this.normalizeStudentTotalsForCurrentConfig = normalizeStudentTotalsForCurrentConfig; this.getTotalSubjectLabel = getTotalSubjectLabel;'
].join('\n');
vm.runInNewContext(script, context, { filename: 'subject-policy.js' });

// ── 1. 各年级口径 ────────────────────────────────────────────────────────────
same(context.getGradeModeConfig('6').totalSubs, ['语文', '数学', '英语']);
same(context.getGradeModeConfig('7').totalSubs, ['语文', '数学', '英语']);
same(context.getGradeModeConfig('8').totalSubs, ['语文', '数学', '英语', '物理', '化学']);
same(context.getGradeModeConfig('9').totalSubs, ['语文', '数学', '英语', '物理', '化学']);
['6', '7', '8'].forEach((grade) => {
    same(context.getGradeModeConfig(grade).extraDisplaySubs, ['政治', '历史', '地理', '生物'], `grade ${grade} display-only subjects`);
});
same(context.getGradeModeConfig('9').extraDisplaySubs, ['政治'], 'grade 9 keeps politics as the only display-only subject');
assert.strictEqual(context.getGradeModeConfig(9).excRate, 0.06);
assert.strictEqual(context.getGradeModeConfig('7年级').excRate, 0.05);

// ── 2. applyModeByGrade 收敛存档 SUBJECTS ────────────────────────────────────
context.setSubjects(['语文', '数学', '英语', '政治', '历史', '地理', '生物']);
let result = context.applyModeByGrade('7');
assert.strictEqual(result.changed, true);
same(result.removed, ['政治', '历史', '地理', '生物']);
same(context.SUBJECTS, ['语文', '数学', '英语']);
assert.strictEqual(context.CONFIG.label, '三科总');
assert.strictEqual(context.CONFIG.name, '7年级');

// 8 年级成绩表没有化学：SUBJECTS 只留四科，总分名称也只数四科，不能写“五科总”。
context.setSubjects(['语文', '数学', '英语', '物理', '政治', '历史', '地理', '生物']);
result = context.applyModeByGrade('8');
same(context.SUBJECTS, ['语文', '数学', '英语', '物理']);
assert.strictEqual(context.CONFIG.label, '四科总');

// 已经是口径内的 SUBJECTS 再调一次不报 changed（幂等）。
result = context.applyModeByGrade('8');
assert.strictEqual(result.changed, false);

// 9 年级维持原有五科 + 政治展示。
context.setSubjects(['语文', '数学', '英语', '物理', '化学', '政治']);
result = context.applyModeByGrade('9');
same(context.SUBJECTS, ['语文', '数学', '英语', '物理', '化学']);
assert.strictEqual(context.CONFIG.label, '五科总');

// ── 3. 老考试迁移 ────────────────────────────────────────────────────────────
const makeRow = (uuid, name, scores) => ({ uuid, name, school: '银山实验学校', class: '6.1', scores, total: Object.values(scores).reduce((a, b) => a + b, 0) });
const db = {
    exams: {
        'g6-old': {
            meta: { grade: '6', type: '期末' },
            subjects: ['语文', '数学', '英语', '政治', '历史', '地理', '生物'],
            config: { name: '6-8年级', totalSubs: 'auto', analysisSubs: 'auto', mode: 'single' },
            schools: { '银山实验学校': { metrics: { total: { avg: 500 } } } },
            data: [
                makeRow('u1', '甲', { 语文: 100, 数学: 100, 英语: 100, 政治: 80, 历史: 40, 地理: 40, 生物: 40 }),
                makeRow('u2', '乙', { 语文: 90, 数学: 90, 英语: 90, 政治: 70, 历史: 30, 地理: 30, 生物: 30 })
            ]
        },
        'g9-ok': {
            meta: { grade: '9', type: '期末' },
            subjects: ['语文', '数学', '英语', '物理', '化学'],
            config: { name: '9年级' },
            schools: { '银山实验学校': { metrics: { total: { avg: 400 } } } },
            data: [makeRow('u1', '甲', { 语文: 100, 数学: 100, 英语: 100, 物理: 50, 化学: 50 })]
        }
    },
    students: {
        u1: { uuid: 'u1', name: '甲', lastExamId: 'g6-old', lastScore: 500, history: [{ examId: 'g6-old', total: 500 }, { examId: 'g9-ok', total: 400 }] },
        u2: { uuid: 'u2', name: '乙', lastExamId: 'g6-old', lastScore: 430, history: [{ examId: 'g6-old', total: 430 }] }
    }
};
// 迁移前 g9-ok 的 total 本来就是口径内合计，用来验证“未变的考试不被动到”。
db.exams['g9-ok'].data[0].total = 400;

let migration = context.normalizeCohortExamSubjectPolicy(db);
same(migration.migrated, ['g6-old'], 'only the stale exam is migrated');
assert.strictEqual(migration.totalsChanged, 2);
const migrated = db.exams['g6-old'];
same(migrated.subjects, ['语文', '数学', '英语'], 'stored SUBJECTS drop display-only subjects');
assert.strictEqual(migrated.data[0].total, 300, 'student total is recomputed from assessment subjects only');
assert.strictEqual(migrated.data[1].total, 270);
assert.strictEqual(migrated.data[0].scores.政治, 80, 'display-only scores are never deleted');
assert.strictEqual(migrated.data[0].scores.历史, 40);
same(migrated.config.totalSubs, ['语文', '数学', '英语']);
assert.strictEqual(migrated.config.mode, 'single', 'exam.config.mode is preserved');
same(migrated.schools, {}, 'stale school metrics are cleared so the next load recalculates');
assert.strictEqual(migrated.subjectPolicy, 'assessment-core-v1');
assert.strictEqual(db.exams['g9-ok'].subjectPolicy, 'assessment-core-v1', 'clean exams are stamped too');
same(db.exams['g9-ok'].schools, { '银山实验学校': { metrics: { total: { avg: 400 } } } }, 'clean exams keep their school metrics');
assert.strictEqual(db.students.u1.history[0].total, 300, 'roster history total follows the migrated exam');
assert.strictEqual(db.students.u1.history[1].total, 400, 'roster history for untouched exams stays');
assert.strictEqual(db.students.u1.lastScore, 300);
assert.strictEqual(db.students.u2.lastScore, 270);

// 幂等：第二次不再迁移任何考试。
migration = context.normalizeCohortExamSubjectPolicy(db);
same(migration.migrated, []);
assert.strictEqual(migration.totalsChanged, 0);

// 空/异常 db 不抛错。
same(context.normalizeCohortExamSubjectPolicy(null).migrated, []);
same(context.normalizeCohortExamSubjectPolicy({}).migrated, []);

// ── 4. 分批与只处理指定考试 ──────────────────────────────────────────────────
{
    const mk = (grade, subjects) => ({ meta: { grade }, subjects, config: {}, schools: { x: { metrics: { total: {} } } }, data: [makeRow('u9', '丙', Object.fromEntries(subjects.map((s, i) => [s, 50 + i])))] });
    const batchDb = { exams: { a: mk('6', ['语文', '数学', '英语', '政治']), b: mk('7', ['语文', '数学', '英语', '历史']), c: mk('8', ['语文', '数学', '英语', '物理', '地理']) }, students: {} };
    // 只处理指定考试：其余标记为 remaining，且不被打上版本戳
    let r = context.normalizeCohortExamSubjectPolicy(batchDb, { onlyExamIds: ['b'] });
    same(r.migrated, ['b']);
    assert.strictEqual(r.remaining, 2);
    assert.strictEqual(batchDb.exams.a.subjectPolicy, undefined, 'exams outside onlyExamIds must stay unstamped for the deferred pass');
    assert.strictEqual(batchDb.exams.b.subjectPolicy, 'assessment-core-v1');
    // 分批：每批 1 场，剩余数递减到 0
    r = context.normalizeCohortExamSubjectPolicy(batchDb, { maxExams: 1 });
    assert.strictEqual(r.migrated.length, 1);
    assert.strictEqual(r.remaining, 1);
    r = context.normalizeCohortExamSubjectPolicy(batchDb, { maxExams: 1 });
    assert.strictEqual(r.migrated.length, 1);
    assert.strictEqual(r.remaining, 0);
    r = context.normalizeCohortExamSubjectPolicy(batchDb, { maxExams: 1 });
    same(r.migrated, []);
    assert.strictEqual(r.remaining, 0);
    same(batchDb.exams.c.subjects, ['语文', '数学', '英语', '物理']);
}

console.log('test-subject-policy-runtime passed');
