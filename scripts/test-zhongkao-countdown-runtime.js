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

const lifecycle = context.ZhongkaoCountdownModule._test;
assert.strictEqual(
    lifecycle.getAnnualExamDate(new Date(2026, 5, 15)),
    '2026-06-13',
    'June 15 should still belong to the current annual exam cycle'
);
assert.strictEqual(
    lifecycle.getAnnualExamDate(new Date(2026, 5, 16)),
    '2027-06-13',
    'June 16 should roll the countdown to next year June 13'
);
assert.strictEqual(
    lifecycle.resolveAutoExamDate('2026-06-13', new Date(2026, 5, 16)),
    '2027-06-13',
    'saved annual exam dates should auto-roll after June 15'
);
assert.strictEqual(
    lifecycle.resolveAutoExamDate('2026-07-01', new Date(2026, 5, 16)),
    '2026-07-01',
    'custom future dates should not be overwritten by the annual rollover'
);
assert.strictEqual(
    lifecycle.normalizeConfig({ examDate: '2026-06-13' }).examDate,
    lifecycle.getAnnualExamDate(),
    'normal config loading should apply the current annual countdown target'
);

assert.ok(
    !source.includes('默认按 2026-06-13'),
    'countdown UI copy should not describe the stale fixed 2026 target date'
);
assert.ok(
    source.includes('每年 6 月 16 日起自动切到下一年 6 月 13 日'),
    'countdown hero copy should explain the annual rollover rule'
);
assert.ok(
    !source.includes('rgba(17,24,39,.96)'),
    'countdown hero should avoid the old dark gradient background'
);
assert.ok(
    source.includes('rgba(255,251,247,.96)'),
    'countdown hero should use the light redesigned background'
);

console.log('zhongkao countdown runtime tests passed');
