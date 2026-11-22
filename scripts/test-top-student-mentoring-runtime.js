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
  SUBJECTS: ['语文', '数学', '英语', '物理', '历史'],
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
  { name: '林冲', school: '银山实验学校', class: '九.1', total: 520, scores: { 语文: 112, 数学: 118, 英语: 95, 物理: 90, 历史: 88 } },
  { name: '武松', school: '银山实验学校', class: '九.2', total: 485, scores: { 语文: 100, 数学: 96, 英语: 112, 物理: 85, 历史: 84 } },
  { name: '鲁智深', school: '银山实验学校', class: '九.1', total: 440, scores: { 语文: 92, 数学: 84, 英语: 90, 物理: 76, 历史: 80 } },
  { name: '外校生', school: '镇一中', class: '九.1', total: 540, scores: { 语文: 118, 数学: 120, 英语: 115, 物理: 95, 历史: 92 } }
];

// 1. Cohort-scoped mentoring persistence
const key = mod.getStorageKey('2023');
assert.strictEqual(key, 'TOP_STUDENT_MENTORING_V1:2023');
mod.saveMentoringStore({
  '九.1::林冲': { mentor: '张老师<script>', parentContact: '13800001111', targetNote: '冲刺全镇前5' }
}, '2023');

// 2. Grade 9 vs Grade 7 Roster Differentiation
const roster9 = mod.buildTopStudentRoster(rows, { grade: '9', topN: 3, cohortKey: '2023' });
assert.strictEqual(roster9.gradeProfile.grade, '9');
assert.strictEqual(roster9.list.length, 3, 'external school students must be excluded when MY_SCHOOL matches');
const lin = roster9.list[0];
assert.strictEqual(lin.name, '林冲');
assert.strictEqual(lin.gradeRank, 1);
assert.strictEqual(lin.townRank, 2, '林冲 (520) should be ranked #2 in township behind 外校生 (540)');
assert.ok(lin.diagnosis.townGoal.includes('全镇第 2 名'), 'township goal direction should be generated');
assert.strictEqual(lin.tier, '冲刺梯队');
assert.strictEqual(lin.mentor, '张老师<script>');
assert.strictEqual(lin.history.length, 2, 'should include previous exam and current exam');
assert.strictEqual(lin.history[1].delta, 1, '林冲 rose from rank 2 to rank 1 (+1)');

const roster7 = mod.buildTopStudentRoster(rows, { grade: '7', topN: 3, cohortKey: '2023' });
assert.strictEqual(roster7.gradeProfile.grade, '7');
assert.strictEqual(roster7.list[0].majorTotal, 325, 'Grade 7 major total should sum only 语+数+英 (112+118+95=325)');
assert.ok(roster7.list[0].diagnosis.townGoal.includes('语数英三科主科'), 'Grade 7 goal should emphasize 语数英三科主科');

// 3. Printable A4 HTML includes signature lines, grade mode label, and escapes XSS
const html = mod.buildPrintableArchiveHtml(lin, roster9);
assert.ok(html.includes('尖子生「育苗」包保培养档案'));
assert.ok(html.includes('9年级490+与指标生育苗'));
assert.ok(html.includes('班主任签字') && html.includes('包保教师签字') && html.includes('教导主任签字'));
assert.ok(!html.includes('<script>'), 'mentor/notes must be HTML-escaped in printable archive');
assert.ok(html.includes('张老师&lt;script&gt;'));
assert.strictEqual(mod.buildArchiveFileName(lin, roster9), '育苗培养档案_9年级490+与指标生育苗_九.1_林冲_2026九年级期中考试.html');

console.log('top-student-mentoring-runtime tests passed');
