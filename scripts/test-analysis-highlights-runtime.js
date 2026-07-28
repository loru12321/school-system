// 两率一分「本次要点」的单元测试。
//
// 重点覆盖 smoke 覆盖不到的部分：smoke 以 admin 登录、全科可见，所以「学科作用域」
// 在那里恒真；任课教师只能看到自己任教学科这条约束必须在这里验证——它是权限边界，
// 要点绝不能成为越权披露的旁路。
const assert = require('assert');
const path = require('path');

const RUNTIME_PATH = path.resolve(__dirname, '../public/assets/js/analysis-highlights-runtime.js');

function loadRuntime(win) {
    delete require.cache[require.resolve(RUNTIME_PATH)];
    win.document = { getElementById: () => null };
    win.window = win;
    global.window = win;
    require(RUNTIME_PATH);
    return win.AnalysisHighlightsRuntime;
}

function buildSchools() {
    return {
        本校: {
            name: '本校',
            metrics: {
                语文: { avg: 95, passRate: 0.90, count: 100 },
                数学: { avg: 70, passRate: 0.50, count: 100 },
                英语: { avg: 88, passRate: 0.78, count: 100 }
            },
            rankings: { 语文: { avg: 1 }, 数学: { avg: 8 }, 英语: { avg: 4 } }
        },
        邻校: {
            name: '邻校',
            metrics: {
                语文: { avg: 100, passRate: 0.95, count: 100 },
                数学: { avg: 92, passRate: 0.85, count: 100 },
                英语: { avg: 90, passRate: 0.80, count: 100 }
            },
            rankings: {}
        }
    };
}

// ── 1. 正常情况：三条规则都能产出，且都指向真实最弱学科 ──────────────────────
{
    const runtime = loadRuntime({
        MY_SCHOOL: '本校',
        SUBJECTS: ['语文', '数学', '英语'],
        SCHOOLS: buildSchools(),
        getTownAnalysisVisibleSubjectsForCurrentUser: () => ['语文', '数学', '英语']
    });
    const items = runtime.buildItems();
    assert.strictEqual(items.length, 3, '全科可见时应产出三条要点');
    const joined = items.map((item) => item.text).join(' ');
    assert.ok(joined.includes('数学'), '数学是各项最弱学科，要点里必须点出来');
    items.forEach((item) => {
        assert.ok(item.source && item.text, '每条要点都必须带文本与来源');
    });
}

// ── 2. 权限边界：任课教师只可见部分学科时，要点不得提及其他学科 ────────────────
{
    const runtime = loadRuntime({
        MY_SCHOOL: '本校',
        // SUBJECTS 里有英语，但该教师不可见——要点绝不能提到它。
        SUBJECTS: ['语文', '数学', '英语'],
        SCHOOLS: buildSchools(),
        getTownAnalysisVisibleSubjectsForCurrentUser: () => ['语文', '数学']
    });
    const items = runtime.buildItems();
    assert.ok(items.length > 0, '两科可见时仍应产出要点');
    const joined = items.map((item) => item.text).join(' ');
    assert.ok(!joined.includes('英语'), '要点不得提及教师不可见的学科（越权披露）');
}

// ── 3. 可见学科不足 2 个时整块不产出（无从比较，不硬凑）───────────────────────
{
    const runtime = loadRuntime({
        MY_SCHOOL: '本校',
        SUBJECTS: ['语文', '数学', '英语'],
        SCHOOLS: buildSchools(),
        getTownAnalysisVisibleSubjectsForCurrentUser: () => ['数学']
    });
    assert.strictEqual(runtime.buildItems().length, 0, '仅 1 科可见时不应产出要点');
}

// ── 4. 过滤函数缺失时保守取空，绝不回退成「全部学科」──────────────────────────
{
    const runtime = loadRuntime({
        MY_SCHOOL: '本校',
        SUBJECTS: ['语文', '数学', '英语'],
        SCHOOLS: buildSchools()
        // 故意不提供 getTownAnalysisVisibleSubjectsForCurrentUser
    });
    assert.strictEqual(runtime.buildItems().length, 0,
        '学科可见性函数缺失时必须保守取空，不得回退为全部学科');
}

// ── 5. 未识别本校时整块不产出 ────────────────────────────────────────────────
{
    const runtime = loadRuntime({
        MY_SCHOOL: '',
        SUBJECTS: ['语文', '数学'],
        SCHOOLS: buildSchools(),
        getTownAnalysisVisibleSubjectsForCurrentUser: () => ['语文', '数学']
    });
    assert.strictEqual(runtime.buildItems().length, 0, '未识别本校时不应产出要点');
}

// ── 6. 各科均衡时不输出「及格率最低」这条（差距 <10 个百分点不值得提示）─────────
{
    const schools = buildSchools();
    schools.本校.metrics.数学 = { avg: 93, passRate: 0.86, count: 100 };
    schools.本校.rankings.数学 = { avg: 2 };
    const runtime = loadRuntime({
        MY_SCHOOL: '本校',
        SUBJECTS: ['语文', '数学'],
        SCHOOLS: schools,
        getTownAnalysisVisibleSubjectsForCurrentUser: () => ['语文', '数学']
    });
    const sources = runtime.buildItems().map((item) => item.source);
    assert.ok(!sources.some((source) => source.includes('及格率')),
        '及格率差距小于 10 个百分点时不应输出该条');
}

console.log('analysis-highlights-runtime tests passed');
