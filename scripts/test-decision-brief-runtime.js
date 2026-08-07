// 决策摘要的入口测试：只允许跳转到既有模块，且必须尊重权限。
const assert = require('assert');
const path = require('path');

const RUNTIME_PATH = path.resolve(__dirname, '../public/assets/js/decision-brief-runtime.js');

function loadRuntime(win) {
    delete require.cache[require.resolve(RUNTIME_PATH)];
    win.window = win;
    win.addEventListener = () => {};
    win.document = { readyState: 'complete', getElementById: () => null };
    global.window = win;
    require(RUNTIME_PATH);
    return win.DecisionBriefRuntime;
}

{
    const runtime = loadRuntime({ canAccessModule: () => true });
    assert.deepStrictEqual(
        runtime.resolveAction('summary-highlights', '两率一分三项名次'),
        { match: '两率一分三项名次', label: '查看两率一分', module: 'analysis', target: 'anchor-total' },
        '综合摘要应回到既有的两率一分模块核对'
    );
    assert.deepStrictEqual(
        runtime.resolveAction('analysis-highlights', '优秀率（同校各科对比）'),
        { match: '优秀率（同校各科对比）', label: '查看各科明细', target: 'two-rate-table-jumpbar' },
        '两率一分摘要应定位到既有的各科导航'
    );
}

{
    const runtime = loadRuntime({ canAccessModule: (id) => id !== 'marginal-push' });
    assert.strictEqual(
        runtime.resolveAction('summary-highlights', '临界学生（分值可在该模块调整）'),
        null,
        '没有临界学生模块权限时，摘要不得生成旁路入口'
    );
}

{
    const runtime = loadRuntime({ canAccessModule: () => true });
    assert.strictEqual(
        runtime.resolveAction('summary-highlights', '未知来源'),
        null,
        '没有受控映射的来源不得产生猜测性跳转'
    );
}

console.log('decision-brief-runtime tests passed');
