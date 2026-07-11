const assert = require('assert');
const path = require('path');

const createDataManagerGrade9TemplateRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-grade9-template-runtime.js'));

function createMemoryStorage() {
    const map = new Map();
    return {
        getItem(key) {
            return map.has(key) ? map.get(key) : null;
        },
        setItem(key, value) {
            map.set(key, String(value));
        },
        removeItem(key) {
            map.delete(key);
        }
    };
}

async function run() {
    const storage = createMemoryStorage();
    const indicatorInput = { value: '' };
    const indicatorInput2 = { value: '' };
    const highSchoolLineInput = { value: '' };
    let indicatorState = { ind1: '', ind2: '', highSchoolLine: '' };
    let targetsState = {};

    const root = {
        CURRENT_COHORT_ID: '2026',
        CONFIG: { name: '' },
        getExamMetaFromUI() {
            return { grade: '9' };
        },
        readWorkspaceCohortId() {
            return 'fallback';
        },
        localStorage: storage,
        readIndicatorState() {
            return indicatorState;
        },
        setIndicatorState(nextState) {
            indicatorState = nextState;
        },
        readTargetsState() {
            return targetsState;
        },
        setTargetsState(nextState) {
            targetsState = nextState;
        },
        document: {
            getElementById(id) {
                if (id === 'ind1') return indicatorInput;
                if (id === 'ind2') return indicatorInput2;
                if (id === 'dm_high_school_line_input') return highSchoolLineInput;
                return null;
            }
        }
    };

    const runtime = createDataManagerGrade9TemplateRuntime(root);

    assert.strictEqual(runtime.isGrade9Context(), true);
    assert.strictEqual(runtime.getGrade9TemplateKey({}, 'INDICATOR'), 'GRADE9_INDICATOR_2026');

    storage.setItem('GRADE9_INDICATOR_2026', JSON.stringify({ ind1: '120', ind2: '300', highSchoolLine: '390' }));
    const restoredIndicator = runtime.restoreGrade9IndicatorTemplate({});
    assert.strictEqual(restoredIndicator, true);
    assert.deepStrictEqual(indicatorState, { ind1: '120', ind2: '300', highSchoolLine: '390' });
    assert.strictEqual(indicatorInput.value, '120');
    assert.strictEqual(indicatorInput2.value, '300');
    assert.strictEqual(highSchoolLineInput.value, '390');

    indicatorState = { ind1: '110', ind2: '260', highSchoolLine: '400' };
    runtime.persistGrade9IndicatorTemplate({});
    assert.deepStrictEqual(JSON.parse(storage.getItem('GRADE9_INDICATOR_2026')), { ind1: '110', ind2: '260', highSchoolLine: '400' });

    storage.setItem('GRADE9_TARGETS_2026', JSON.stringify({ A: { t1: 1, t2: 2 } }));
    const restoredTargets = runtime.restoreGrade9TargetsTemplate({});
    assert.strictEqual(restoredTargets, true);
    assert.deepStrictEqual(targetsState, { A: { t1: 1, t2: 2 } });

    runtime.persistGrade9TargetsTemplate({});
    assert.deepStrictEqual(JSON.parse(storage.getItem('GRADE9_TARGETS_2026')), { A: { t1: 1, t2: 2 } });

    targetsState = {};
    runtime.persistGrade9TargetsTemplate({});
    assert.deepStrictEqual(JSON.parse(storage.getItem('GRADE9_TARGETS_2026')), { A: { t1: 1, t2: 2 } });

    root.CURRENT_COHORT_ID = '';
    root.CONFIG = { name: '非九年级模板' };
    root.getExamMetaFromUI = () => ({ grade: '8' });
    assert.strictEqual(runtime.isGrade9Context(), false);
    assert.strictEqual(runtime.getGrade9TemplateKey({}, 'TARGETS'), 'GRADE9_TARGETS_fallback');
    assert.strictEqual(runtime.restoreGrade9IndicatorTemplate({}), false);
    assert.strictEqual(runtime.restoreGrade9TargetsTemplate({}), false);

    console.log('data-manager-grade9-template-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
