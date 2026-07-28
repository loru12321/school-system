// 教师表现「本次要点」的单元测试。
//
// 最重要的一条：**要点绝不能点名教师**。教师评价涉及考核，评价分未做生源校正，
// 单次考试样本有限；系统只应汇总规模与已有提示，把「谁强谁弱」的判断留给人。
// 这条约束靠 smoke 很难守（要看渲染文本里有没有人名），必须在单测里锁。
const assert = require('assert');
const path = require('path');

const RUNTIME_PATH = path.resolve(__dirname, '../public/assets/js/teacher-highlights-runtime.js');

function loadRuntime(win) {
    delete require.cache[require.resolve(RUNTIME_PATH)];
    win.document = { getElementById: () => null };
    if (!Object.prototype.hasOwnProperty.call(win, 'RAW_DATA')) win.RAW_DATA = [{ total: 400 }];
    win.window = win;
    global.window = win;
    require(RUNTIME_PATH);
    return win.TeacherHighlightsRuntime;
}

const TEACHER_NAMES = ['张三', '李四', '王五', '赵六'];

function makeStats(overrides = {}) {
    return {
        张三: { 数学: { fairScore: 55, riskLevel: 'risk', lowRate: 0.15, sampleWarning: false, ...(overrides.张三 || {}) } },
        李四: { 语文: { fairScore: 88, riskLevel: 'normal', sampleWarning: true, teacherChangeProtected: true, ...(overrides.李四 || {}) } },
        王五: { 英语: { fairScore: 76, riskLevel: 'normal', sampleWarning: false, ...(overrides.王五 || {}) } },
        赵六: { 物理: { fairScore: 91, riskLevel: 'normal', sampleWarning: false, ...(overrides.赵六 || {}) } }
    };
}

// ── 1. 底线：任何情况下都不得出现教师姓名 ────────────────────────────────────
{
    const runtime = loadRuntime({ TEACHER_STATS: makeStats() });
    const items = runtime.buildItems();
    assert.ok(items.length > 0, '有数据时应产出要点');
    const joined = items.map((item) => item.text).join(' ');
    TEACHER_NAMES.forEach((name) => {
        assert.ok(!joined.includes(name), `要点不得点名教师（出现了 ${name}）`);
    });
}

// ── 2. 也不得出现学科级的「谁最弱」式指名（只允许统计口径的学科计数）───────────
{
    const runtime = loadRuntime({ TEACHER_STATS: makeStats() });
    const joined = runtime.buildItems().map((item) => item.text).join(' ');
    ['最弱', '最差', '垫底', '排名最后'].forEach((word) => {
        assert.ok(!joined.includes(word), `要点不得使用评判性措辞「${word}」`);
    });
}

// ── 3. 覆盖面统计正确 ────────────────────────────────────────────────────────
{
    const runtime = loadRuntime({ TEACHER_STATS: makeStats() });
    const item = runtime.buildItems().find((entry) => entry.text.includes('纳入评价'));
    assert.ok(item, '应产出覆盖面要点');
    assert.ok(/<strong>4<\/strong> 位教师/.test(item.text), `教师数应为 4，实际：${item.text}`);
    assert.ok(item.text.includes('4 个学科'), `学科数应为 4，实际：${item.text}`);
}

// ── 4. 需关注比例过高时改口径：说整体性偏低，不指向个别教师 ────────────────────
{
    const stats = makeStats();
    // 4 个里 3 个 risk = 75%
    stats.李四.语文.riskLevel = 'risk';
    stats.王五.英语.riskLevel = 'risk';
    const runtime = loadRuntime({ TEACHER_STATS: stats });
    const item = runtime.buildItems().find((entry) => entry.source.includes('riskLevel'));
    assert.ok(item.text.includes('整体性偏低'),
        `比例过半时应提示整体性偏低，实际：${item.text}`);
    assert.ok(!item.text.includes('逐个查看'), '高比例时不应引导逐个追责');
}

// ── 5. 需关注比例低时正常引导查看明细 ────────────────────────────────────────
{
    const runtime = loadRuntime({ TEACHER_STATS: makeStats() });
    const item = runtime.buildItems().find((entry) => entry.source.includes('riskLevel'));
    assert.ok(item.text.includes('逐个查看'), `低比例时应引导查看明细，实际：${item.text}`);
    assert.ok(!item.text.includes('整体性偏低'), '低比例时不应说整体性偏低');
}

// ── 6. 无 risk 条目时明确说「没有」，不留空白让人猜 ───────────────────────────
{
    const stats = makeStats();
    stats.张三.数学.riskLevel = 'normal';
    const runtime = loadRuntime({ TEACHER_STATS: stats });
    const item = runtime.buildItems().find((entry) => entry.text.includes('没有'));
    assert.ok(item, '无需关注条目时应明确说明');
}

// ── 7. 全部样本不足时说清原因（历史基线不足），而非只报数字 ────────────────────
{
    const stats = makeStats();
    Object.keys(stats).forEach((teacher) => {
        Object.keys(stats[teacher]).forEach((subject) => { stats[teacher][subject].sampleWarning = true; });
    });
    const runtime = loadRuntime({ TEACHER_STATS: stats });
    const item = runtime.buildItems().find((entry) => entry.source.includes('样本提示'));
    assert.ok(item.text.includes('全部 4 个'), `应指出是全部条目，实际：${item.text}`);
    assert.ok(item.text.includes('历史基线不足'), '应说明原因而不是只报数字');
}

// ── 8. 口径提醒必须存在（防止把评价分当成教学水平的唯一证据）───────────────────
{
    const runtime = loadRuntime({ TEACHER_STATS: makeStats() });
    const item = runtime.buildItems().find((entry) => entry.source === '口径说明');
    assert.ok(item, '必须保留口径提醒');
    assert.ok(item.text.includes('未做生源校正'), '口径提醒必须点明未做生源校正');
}

// ── 9. 当前届别无成绩数据时一条都不产出 ──────────────────────────────────────
{
    const runtime = loadRuntime({ TEACHER_STATS: makeStats(), RAW_DATA: [] });
    assert.strictEqual(runtime.buildItems().length, 0, '无成绩数据时不得产出要点');
}

// ── 10. 没有任课数据（TEACHER_STATS 为空）时不产出 ────────────────────────────
{
    const runtime = loadRuntime({ TEACHER_STATS: {} });
    assert.strictEqual(runtime.buildItems().length, 0, '没有任课数据时不得产出要点');
}

console.log('teacher-highlights-runtime tests passed');
