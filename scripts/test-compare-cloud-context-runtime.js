const assert = require('assert');
const path = require('path');

function run() {
    const runtimePath = path.resolve(__dirname, '../public/assets/js/compare-cloud-context-runtime.js');
    const createRuntime = require(runtimePath);
    const root = {};
    const runtime = createRuntime(root);

    assert.ok(runtime);
    assert.ok(root.CompareCloudContext);
    assert.strictEqual(root.CompareCloudContext, runtime);
    assert.strictEqual(runtime.normalizeCompareName(' Alice Zhang '), 'alicezhang');

    const normalizeClass = (value) => String(value || '').trim().replace(/[^0-9]/g, '');
    assert.strictEqual(runtime.isClassEquivalent('Class 09', '9', { normalizeClass }), true);
    assert.strictEqual(runtime.isClassEquivalent('Class 09', '10', { normalizeClass }), false);

    const context = {
        owner: {
            name: 'Alice Zhang',
            class: 'Class 09'
        }
    };

    const exactStudent = { name: 'Alice Zhang', class: '9' };
    const targetStudent = { name: 'Alicia', class: 'Class 09' };
    const otherStudent = { name: 'Bob', class: 'Class 10' };
    const currentTarget = { name: 'Alicia', class: '9' };

    assert.strictEqual(runtime.isContextMatchStudent(context, exactStudent, { normalizeClass }), true);
    assert.strictEqual(runtime.isContextMatchStudent(context, otherStudent, { normalizeClass }), false);
    assert.strictEqual(runtime.isLikelyCurrentTarget(context, targetStudent, currentTarget, { normalizeClass }), true);
    assert.strictEqual(runtime.isLikelyCurrentTarget(context, otherStudent, currentTarget, { normalizeClass }), false);

    console.log('compare-cloud-context-runtime tests passed');
}

run();
