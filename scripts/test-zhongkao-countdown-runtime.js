const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/zhongkao-countdown-runtime.js'), 'utf8');

const context = {
    window: {},
    console,
    Date,
    setTimeout() {},
    clearTimeout() {},
    setInterval() {},
    clearInterval() {}
};
context.window = context;

vm.runInNewContext(source, context, { filename: 'zhongkao-countdown-runtime.js' });

const metrics = context.ZhongkaoCountdownModule._test.computeCountdownMetrics(
    {
        examDate: '2026-06-13',
        excludeWeekends: true,
        holidays: []
    },
    new Date(2026, 5, 4)
);

assert.strictEqual(metrics.totalDays, 9, 'natural day countdown should still include the exam day');
assert.strictEqual(metrics.weekendDays, 2, 'ordinary weekend rest should exclude the exam day and count only 2026-06-06 and 2026-06-07');
assert.strictEqual(metrics.studyDays, 6, 'study days should classify 2026-06-05 and 2026-06-08 through 2026-06-12');
assert.strictEqual(metrics.classificationStart, '2026-06-05');
assert.strictEqual(metrics.classificationEnd, '2026-06-12');

console.log('zhongkao countdown runtime tests passed');
