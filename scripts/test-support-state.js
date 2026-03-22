const assert = require('assert');
const path = require('path');

const createSupportStateRuntime = require(path.resolve(__dirname, '../public/assets/js/support-state-runtime.js'));

function run() {
    const root = {
        SYS_VARS: {
            indicator: { ind1: '120', ind2: '240' },
            targets: { SchoolA: { t1: 10, t2: 20 } },
            schoolAliases: [{ canonical: 'SchoolA', alias: 'AliasA' }],
            dataManagerSyncState: { paramsSignature: '120::240' }
        },
        TARGETS: { SchoolA: { t1: 10, t2: 20 } },
        PREV_DATA: [{ name: 'Alice' }],
        HISTORY_ARCHIVE: { exam1: { rows: 10 } },
        FB_CLASSES: [{ name: 'Class1', students: [] }],
        MP_SNAPSHOTS: { task1: { count: 5 } }
    };

    const supportState = createSupportStateRuntime(root);

    assert.deepStrictEqual(supportState.getIndicator(), { ind1: '120', ind2: '240' });
    assert.deepStrictEqual(supportState.getTargets(), { SchoolA: { t1: 10, t2: 20 } });
    assert.deepStrictEqual(supportState.getSchoolAliases(), [{ canonical: 'SchoolA', alias: 'AliasA' }]);
    assert.deepStrictEqual(supportState.getDataManagerSyncState(), { paramsSignature: '120::240' });
    assert.deepStrictEqual(supportState.getPrevData(), [{ name: 'Alice' }]);
    assert.deepStrictEqual(supportState.getHistoryArchive(), { exam1: { rows: 10 } });
    assert.deepStrictEqual(supportState.getFbClasses(), [{ name: 'Class1', students: [] }]);
    assert.deepStrictEqual(supportState.getMpSnapshots(), { task1: { count: 5 } });

    const snapshot = supportState.syncSupportState({
        indicator: { ind1: '100', ind2: '200' },
        targets: { SchoolB: { t1: 12, t2: 18 } },
        schoolAliases: [{ canonical: 'SchoolB', alias: 'AliasB' }],
        dataManagerSyncState: { paramsSignature: '100::200', targetsSignature: 'SchoolB:12:18' },
        prevData: [{ name: 'Bob' }],
        historyArchive: { exam2: { rows: 12 } },
        fbClasses: [{ name: 'Class2', students: [{ name: 'Bob' }] }],
        mpSnapshots: { task2: { count: 8 } }
    });

    assert.deepStrictEqual(snapshot.indicator, { ind1: '100', ind2: '200' });
    assert.deepStrictEqual(snapshot.targets, { SchoolB: { t1: 12, t2: 18 } });
    assert.deepStrictEqual(snapshot.schoolAliases, [{ canonical: 'SchoolB', alias: 'AliasB' }]);
    assert.deepStrictEqual(snapshot.dataManagerSyncState, { paramsSignature: '100::200', targetsSignature: 'SchoolB:12:18' });
    assert.deepStrictEqual(snapshot.prevData, [{ name: 'Bob' }]);
    assert.deepStrictEqual(snapshot.historyArchive, { exam2: { rows: 12 } });
    assert.deepStrictEqual(snapshot.fbClasses, [{ name: 'Class2', students: [{ name: 'Bob' }] }]);
    assert.deepStrictEqual(snapshot.mpSnapshots, { task2: { count: 8 } });

    supportState.clearSupportState();
    assert.deepStrictEqual(supportState.getIndicator(), { ind1: '', ind2: '' });
    assert.deepStrictEqual(supportState.getTargets(), {});
    assert.deepStrictEqual(supportState.getSchoolAliases(), []);
    assert.deepStrictEqual(supportState.getDataManagerSyncState(), {});
    assert.deepStrictEqual(supportState.getPrevData(), []);
    assert.deepStrictEqual(supportState.getHistoryArchive(), {});
    assert.deepStrictEqual(supportState.getFbClasses(), []);
    assert.deepStrictEqual(supportState.getMpSnapshots(), {});

    console.log('support-state-runtime tests passed');
}

run();
