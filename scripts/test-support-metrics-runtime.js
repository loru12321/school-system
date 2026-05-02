const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const runtimePath = path.resolve(__dirname, '../public/assets/js/support-metrics-runtime.js');
const source = fs.readFileSync(runtimePath, 'utf8');

function createElement() {
    return { textContent: '' };
}

const elementIds = [
    'bottom3-school-count',
    'bottom3-average-score',
    'bottom3-top-school',
    'label-exc',
    'indicator-school-count',
    'indicator-top-score',
    'indicator-top-school',
    'indicator-missing-target-count'
];
const elements = new Map(elementIds.map((id) => [id, createElement()]));

const schools = {
    Alpha: {
        name: 'Alpha',
        bottom3: { totalN: 30, bottomN: 10, excN: 1, avg: 72 },
        scoreBottom: 98,
        rankBottom: 1
    },
    Beta: {
        name: 'Beta',
        bottom3: { totalN: 27, bottomN: 9, excN: 1, avg: 68 },
        scoreBottom: 88,
        rankBottom: 2
    },
    County: {
        name: 'County',
        bottom3: { totalN: 99, bottomN: 33, excN: 4, avg: 99 },
        scoreBottom: 100,
        rankBottom: 1
    }
};
const originalSchoolsJson = JSON.stringify(schools);

let renderTablesCalls = 0;
let calcIndicatorsCalls = 0;
const root = {
    document: {
        readyState: 'complete',
        getElementById(id) {
            return elements.get(id) || null;
        },
        addEventListener() {}
    },
    setTimeout(task) {
        task();
        return 0;
    },
    SCHOOLS: schools,
    CONFIG: { excRate: 0.12 },
    isTownshipManagedSchool(name) {
        return name !== 'County';
    },
    renderTables() {
        renderTablesCalls += 1;
        return 'rendered';
    },
    calcIndicators() {
        calcIndicatorsCalls += 1;
        return [
            {
                name: 'Alpha',
                finalScore: 62.5,
                score1: 32,
                score2: 30.5,
                base1: 30,
                base2: 28,
                bonus1: 2,
                bonus2: 2.5,
                rank: 2
            },
            {
                name: 'Beta',
                finalScore: 66.5,
                score1: 35,
                score2: 31.5,
                base1: 30,
                base2: 30,
                bonus1: 5,
                bonus2: 1.5,
                rank: 1,
                missingTarget: true
            }
        ];
    }
};

const context = { window: root, globalThis: root, setTimeout: root.setTimeout, console };
vm.createContext(context);
vm.runInContext(source, context, { filename: runtimePath });

assert.ok(root.SupportMetricsRuntime, 'support metrics runtime should be installed');
assert.strictEqual(typeof root.SupportMetricsRuntime.refreshAll, 'function');
assert.strictEqual(root.renderTables.__supportMetricsWrapped, true, 'renderTables should be wrapped');
assert.strictEqual(root.calcIndicators.__supportMetricsWrapped, true, 'calcIndicators should be wrapped');

assert.strictEqual(root.renderTables(), 'rendered', 'renderTables wrapper should preserve return value');
assert.strictEqual(renderTablesCalls, 1, 'renderTables wrapper should call original once');
assert.strictEqual(elements.get('bottom3-school-count').textContent, '2');
assert.strictEqual(elements.get('bottom3-average-score').textContent, '70.00');
assert.strictEqual(elements.get('bottom3-top-school').textContent, 'Alpha');
assert.strictEqual(elements.get('label-exc').textContent, '12%');

const indicatorResult = root.calcIndicators();
assert.strictEqual(calcIndicatorsCalls, 1, 'calcIndicators wrapper should call original once');
assert.strictEqual(root.INDICATOR_LAST_RESULT, indicatorResult, 'indicator result should be cached for display refresh');
assert.strictEqual(elements.get('indicator-school-count').textContent, '2');
assert.strictEqual(elements.get('indicator-top-score').textContent, '66.50');
assert.strictEqual(elements.get('indicator-top-school').textContent, 'Beta');
assert.strictEqual(elements.get('indicator-missing-target-count').textContent, '1');

assert.strictEqual(JSON.stringify(root.SupportMetricsRuntime.getLastBottom3Summary()), JSON.stringify({
    ok: true,
    count: 2,
    finite: true,
    averageScore: 70,
    topSchool: 'Alpha',
    excRate: 12
}));
assert.strictEqual(JSON.stringify(root.SupportMetricsRuntime.getLastIndicatorSummary()), JSON.stringify({
    ok: true,
    count: 2,
    finite: true,
    topScore: 66.5,
    topSchool: 'Beta',
    issueCount: 1
}));
assert.strictEqual(JSON.stringify(schools), originalSchoolsJson, 'display summaries must not mutate school calculations');

console.log('support-metrics-runtime tests passed');
