const assert = require('assert');
const path = require('path');

const createDataStateRuntime = require(path.resolve(__dirname, '../public/assets/js/data-state-runtime.js'));

function run() {
    const root = {
        RAW_DATA: [{ name: 'Alice', total: 650 }],
        SCHOOLS: { SchoolA: { name: 'SchoolA', students: [{ name: 'Alice' }] } },
        SUBJECTS: ['Chinese', 'Math'],
        THRESHOLDS: { total: { exc: 600, pass: 420 } },
        CONFIG: { name: 'Grade9', mode: 'multi' }
    };

    const dataState = createDataStateRuntime(root);

    assert.deepStrictEqual(dataState.getRawData(), [{ name: 'Alice', total: 650 }]);
    assert.deepStrictEqual(dataState.getSchools(), { SchoolA: { name: 'SchoolA', students: [{ name: 'Alice' }] } });
    assert.deepStrictEqual(dataState.getSubjects(), ['Chinese', 'Math']);
    assert.deepStrictEqual(dataState.getThresholds(), { total: { exc: 600, pass: 420 } });
    assert.deepStrictEqual(dataState.getConfig(), { name: 'Grade9', mode: 'multi' });

    const snapshot = dataState.syncDataState({
        rawData: [{ name: 'Bob', total: 620 }],
        schools: { SchoolB: { name: 'SchoolB', students: [{ name: 'Bob' }] } },
        subjects: ['English'],
        thresholds: { English: { exc: 90, pass: 60 } },
        config: { name: 'Grade8', mode: 'single' }
    });

    assert.deepStrictEqual(snapshot.rawData, [{ name: 'Bob', total: 620 }]);
    assert.deepStrictEqual(snapshot.schools, { SchoolB: { name: 'SchoolB', students: [{ name: 'Bob' }] } });
    assert.deepStrictEqual(snapshot.subjects, ['English']);
    assert.deepStrictEqual(snapshot.thresholds, { English: { exc: 90, pass: 60 } });
    assert.deepStrictEqual(snapshot.config, { name: 'Grade8', mode: 'single' });

    dataState.clearDataState();
    assert.deepStrictEqual(dataState.getRawData(), []);
    assert.deepStrictEqual(dataState.getSchools(), {});
    assert.deepStrictEqual(dataState.getSubjects(), []);
    assert.deepStrictEqual(dataState.getThresholds(), {});
    assert.deepStrictEqual(dataState.getConfig(), {});

    console.log('data-state-runtime tests passed');
}

run();
