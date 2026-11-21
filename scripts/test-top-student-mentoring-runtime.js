const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/top-student-mentoring-runtime.js'), 'utf8');

const storage = new Map();
const win = {
  CURRENT_COHORT_ID: '2023',
  MY_SCHOOL: '银山实验学校',
  SUBJECTS: ['语文', '数学', '英语'],
  CONFIG: { name: '2026九年级期中考试' },
  PREV_DATA: [
    { name: '林冲', school: '银山实验学校', class: '九.1', total: 505 },
    { name: '武松', school: '银山实验学校', class: '九.2', total: 515 }
  ],
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v))
  }
};
const ctx = { window: win, globalThis: win, Date, Map, Set, Array, Object, Number, String, Math, JSON, console };
vm.runInNewContext(source, ctx, { filename: 'top-student-mentoring-runtime.js' });

const mod = win.TopStudentMentoring;
assert.ok(mod, 'TopStudentMentoring should be exposed on window');

const rows = [
  { name: '林冲', school: '银山实验学校', class: '九.1', total: 520, scores: { 语文: 112, 数学: 118, 英语: 95 } },
  { name: '武松', school: '银山实验学校', class: '九.2', total: 485, scores: { 语文: 100, 数学: 96, 英语: 112 } },
  { name: '鲁智深', school: '银山实验学校', class: '九.1', total: 440, scores: { 语文: 92, 数学: 84, 英语: 90 } },
  { name: '外校生', school: '镇一中', class: '九.1', total: 540, scores: { 语文: 118, 数学: 120, 英语: 115 } }
];

// 1. Cohort-scoped mentoring persistence
const key = mod.getStorageKey('2023');
assert.strictEqual(key, 'TOP_STUDENT_MENTORING_V1:2023');
mod.saveMentoringStore({
  '九.1::林冲': { mentor: '张老师<script>', parentContact: '13800001111', targetNote: '冲刺全镇前5' }
}, '2023');

// 2. Roster building filters to MY_SCHOOL, ranks & assigns tiers, diagnoses subjects, and tracks delta
const roster = mod.buildTopStudentRoster(rows, { topN: 3, cohortKey: '2023' });
assert.strictEqual(roster.list.length, 3, 'external school students must be excluded when MY_SCHOOL matches');
const lin = roster.list[0];
assert.strictEqual(lin.name, '林冲');
assert.strictEqual(lin.gradeRank, 1);
assert.strictEqual(lin.tier, '冲刺梯队');
assert.strictEqual(lin.mentor, '张老师<script>');
assert.strictEqual(lin.history.length, 2, 'should include previous exam and current exam');
assert.strictEqual(lin.history[1].delta, 1, '林冲 rose from rank 2 to rank 1 (+1)');
assert.strictEqual(lin.diagnosis.strengths[0].subject, '数学', '数学 (+18.7 vs avg) should be top strength');
assert.strictEqual(lin.diagnosis.weaknesses[0].subject, '英语', '英语 (-4 vs avg) should be top weakness');

// 3. Printable A4 HTML includes signature lines and escapes XSS
const html = mod.buildPrintableArchiveHtml(lin, roster);
assert.ok(html.includes('尖子生「育苗」包保培养档案'));
assert.ok(html.includes('班主任签字') && html.includes('包保教师签字') && html.includes('教导主任签字'));
assert.ok(!html.includes('<script>'), 'mentor/notes must be HTML-escaped in printable archive');
assert.ok(html.includes('张老师&lt;script&gt;'));
assert.strictEqual(mod.buildArchiveFileName(lin, roster), '育苗培养档案_九.1_林冲_2026九年级期中考试.html');

console.log('top-student-mentoring-runtime tests passed');
