// 综合评价「本次要点」的单元测试。
//
// 重点覆盖两类曾出过问题的地方：
// 1. **名次必须取主表总排名**，不能自己按均分或两率一分单项重排（三种口径实测给出
//    第 11 / 第 3 / 第 2 三个不同答案，用户在同页看到两个数字就会失去信任）。
// 2. **临界分值必须与「临界学生」模块同源**（#mpGap，缺失时默认 5），此前硬编码 10。
const assert = require('assert');
const path = require('path');

const RUNTIME_PATH = path.resolve(__dirname, '../public/assets/js/summary-highlights-runtime.js');

// 构造一个最小可用的 DOM：只需要 #tb-summary 主表和可选的 #mpGap 输入框。
function makeDom({ rows, mpGap }) {
    const table = {
        querySelectorAll: (selector) => (selector === 'tbody tr' ? rows : [])
    };
    return {
        getElementById: (id) => {
            if (id === 'tb-summary') return table;
            if (id === 'mpGap') return mpGap === undefined ? null : { value: mpGap };
            return null;
        }
    };
}

// 主表行：末两列固定为「综合总分」「总排名」。
function makeRow(cells) {
    return {
        innerText: cells.join(' '),
        querySelectorAll: (selector) => (selector === 'td'
            ? cells.map((text) => ({ innerText: text }))
            : [])
    };
}

function loadRuntime(win) {
    delete require.cache[require.resolve(RUNTIME_PATH)];
    win.window = win;
    global.window = win;
    require(RUNTIME_PATH);
    return win.SummaryHighlightsRuntime;
}

function baseSchools() {
    return {
        本校: {
            name: '本校',
            metrics: {
                total: { avg: 300, count: 276 },
                语文: { avg: 95, excRate: 0.20, passRate: 0.82, count: 276 },
                数学: { avg: 70, excRate: 0.06, passRate: 0.50, count: 276 }
            },
            rankings: {
                语文: { avg: 1, excRate: 3, passRate: 2 },
                数学: { avg: 10, excRate: 11, passRate: 10 }
            },
            bottom3: { totalN: 276, bottomN: 92, avg: 177.6 },
            // 4 人落在 413.4 的 5 分内，10 人落在 20 分内。
            students: [410, 411, 412, 413, 400, 401, 402, 403, 404, 405, 300, 250]
                .map((total) => ({ total }))
        }
    };
}

function makeWin({ rows, mpGap, schools }) {
    return {
        MY_SCHOOL: '本校',
        // 默认给一条成绩数据：运行时有「当前届别无数据则不产出」的守卫，
        // 不给的话所有用例都会被那道守卫拦掉、变成恒真的空断言。
        RAW_DATA: [{ total: 400 }],
        SUBJECTS: ['语文', '数学'],
        THRESHOLDS: { total: { exc: 413.4 } },
        SCHOOLS: schools || baseSchools(),
        getTownAnalysisVisibleSubjectsForCurrentUser: () => ['语文', '数学'],
        document: makeDom({ rows, mpGap })
    };
}

// ── 1. 名次取自主表末两列，不自行重排 ────────────────────────────────────────
{
    const rows = [
        makeRow(['沙河站中学', '170.0', '40.0', '315.6', '1']),
        makeRow(['本校', '158.7', '39.9', '295.4', '2']),
        makeRow(['其他校', '150.0', '38.0', '280.0', '3'])
    ];
    const runtime = loadRuntime(makeWin({ rows }));
    const rankItem = runtime.buildItems().find((item) => /排第/.test(item.text));
    assert.ok(rankItem, '应产出名次要点');
    assert.ok(/排第 <strong>2<\/strong>/.test(rankItem.text),
        `名次必须与主表末列一致（期望第 2），实际：${rankItem.text}`);
    assert.ok(rankItem.text.includes('3 所'), '参评学校数应等于主表行数');
    assert.ok(rankItem.text.includes('295.4'), '综合总分应取自主表倒数第二列');
    assert.ok(rankItem.text.includes('沙河站中学'), '应指出第 1 名是谁');
}

// ── 2. 本校排第 1 时措辞不同，且不输出「距第 1 名差」──────────────────────────
{
    const rows = [
        makeRow(['本校', '170.0', '40.0', '315.6', '1']),
        makeRow(['其他校', '150.0', '38.0', '280.0', '2'])
    ];
    const runtime = loadRuntime(makeWin({ rows }));
    const rankItem = runtime.buildItems().find((item) => /排第/.test(item.text));
    assert.ok(/排第 1/.test(rankItem.text), '第 1 名应明确说排第 1');
    assert.ok(!rankItem.text.includes('距第 1 名'), '本校即第 1 时不应输出与自己的差距');
}

// ── 3. 主表未渲染（行数不足）时不输出名次要点，绝不编造 ───────────────────────
{
    const runtime = loadRuntime(makeWin({ rows: [] }));
    const rankItem = runtime.buildItems().find((item) => /排第/.test(item.text));
    assert.ok(!rankItem, '主表为空时不应输出名次要点');
}

// ── 4. 临界分值：#mpGap 缺失时用默认 5，措辞为「默认口径」──────────────────────
{
    const rows = [
        makeRow(['沙河站中学', '170.0', '40.0', '315.6', '1']),
        makeRow(['本校', '158.7', '39.9', '295.4', '2'])
    ];
    const runtime = loadRuntime(makeWin({ rows }));
    const item = runtime.buildItems().find((entry) => entry.text.includes('优秀线'));
    assert.ok(item, '应产出临界生要点');
    assert.ok(item.text.includes('默认口径 5 分内'),
        `#mpGap 缺失时应说默认口径 5 分，实际：${item.text}`);
    assert.ok(/有 <strong>4<\/strong> 人/.test(item.text),
        `5 分内应为 4 人，实际：${item.text}`);
}

// ── 5. 临界分值：#mpGap 有值时跟随它，措辞为「当前设定」───────────────────────
{
    const rows = [
        makeRow(['沙河站中学', '170.0', '40.0', '315.6', '1']),
        makeRow(['本校', '158.7', '39.9', '295.4', '2'])
    ];
    const runtime = loadRuntime(makeWin({ rows, mpGap: '20' }));
    const item = runtime.buildItems().find((entry) => entry.text.includes('优秀线'));
    assert.ok(item.text.includes('当前设定 20 分内'),
        `#mpGap=20 时应跟随该值，实际：${item.text}`);
    assert.ok(/有 <strong>10<\/strong> 人/.test(item.text),
        `20 分内应为 10 人，实际：${item.text}`);
}

// ── 6b. 当前届别无成绩数据时一条都不产出（防止复述上一届结论）────────────────
// 真实场景：切到还没导入成绩的届别，系统按设计保留上一届已生成的综合评价表，
// 若不守这一道，要点会把上一届的「排第 1」当成本届结果说出来。
{
    const rows = [
        makeRow(['沙河站中学', '170.0', '40.0', '315.6', '1']),
        makeRow(['本校', '158.7', '39.9', '295.4', '2'])
    ];
    const win = makeWin({ rows });
    win.RAW_DATA = [];
    const runtime = loadRuntime(win);
    assert.strictEqual(runtime.buildItems().length, 0,
        '当前届别没有成绩数据时不得产出任何要点（旧表仍在页面上）');
}

// ── 6c. 有成绩数据时正常产出（确认上一条不是恒真的空断言）─────────────────────
{
    const rows = [
        makeRow(['沙河站中学', '170.0', '40.0', '315.6', '1']),
        makeRow(['本校', '158.7', '39.9', '295.4', '2'])
    ];
    const win = makeWin({ rows });
    win.RAW_DATA = [{ total: 400 }];
    const runtime = loadRuntime(win);
    assert.ok(runtime.buildItems().length > 0, '有成绩数据时应正常产出要点');
}

// ── 7. 学科结论走三项名次，且尊重学科可见性 ──────────────────────────────────
{
    const rows = [
        makeRow(['沙河站中学', '170.0', '40.0', '315.6', '1']),
        makeRow(['本校', '158.7', '39.9', '295.4', '2'])
    ];
    const win = makeWin({ rows });
    win.getTownAnalysisVisibleSubjectsForCurrentUser = () => ['语文'];
    const runtime = loadRuntime(win);
    const subjectItem = runtime.buildItems().find((item) => item.source === '两率一分三项名次');
    assert.ok(!subjectItem, '可见学科不足 2 个时不应输出学科结论');
}

console.log('summary-highlights-runtime tests passed');
