const assert = require('assert');
const path = require('path');

const createDataManagerSaveSyncRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-save-sync-runtime.js'));

async function run() {
    const alerts = [];
    const loadingCalls = [];
    const swalCalls = [];
    const confirms = [];
    let cloudCalls = 0;
    let processDataCalls = 0;
    let renderTablesCalls = 0;
    let syncTeacherHistoryCalls = 0;
    let saveParamsCalls = 0;
    let targetsSet = null;
    let aliasSet = null;

    const root = {
        window: { RAW_DATA: [{ id: 1 }] },
        isArchiveLocked() {
            return false;
        },
        UI: {
            async confirm(message) {
                confirms.push(String(message || ''));
                return true;
            },
            async alert(message) {
                alerts.push(String(message || ''));
            },
            loading(show, text) {
                loadingCalls.push({ show, text });
            }
        },
        setTargetsState(value) {
            targetsSet = value;
        },
        ensureNormalizedTargets() {
            return { A: { t1: 1, t2: 2 } };
        },
        setSchoolAliasState(value) {
            aliasSet = value;
        },
        ensureSchoolAliasStore() {
            return [{ canonical: 'A', alias: 'A校' }];
        },
        processData() {
            processDataCalls += 1;
            return Promise.resolve();
        },
        renderTables() {
            renderTablesCalls += 1;
        },
        saveCloudData() {
            cloudCalls += 1;
            return Promise.resolve(true);
        },
        Swal: {
            fire(...args) {
                swalCalls.push(args);
                return Promise.resolve(true);
            }
        }
    };

    const runtime = createDataManagerSaveSyncRuntime(root);
    const manager = {
        saveParamsLocally(skipCloudSync) {
            saveParamsCalls += 1;
            assert.strictEqual(skipCloudSync, true);
            return Promise.resolve();
        },
        syncTeacherHistory() {
            syncTeacherHistoryCalls += 1;
        }
    };

    await runtime.saveAndSync(manager);
    assert.strictEqual(confirms.length, 1);
    assert.strictEqual(saveParamsCalls, 1);
    assert.strictEqual(syncTeacherHistoryCalls, 1);
    assert.deepStrictEqual(targetsSet, { A: { t1: 1, t2: 2 } });
    assert.deepStrictEqual(aliasSet, [{ canonical: 'A', alias: 'A校' }]);
    assert.strictEqual(processDataCalls, 1);
    assert.strictEqual(renderTablesCalls, 1);
    assert.strictEqual(cloudCalls, 1);
    assert.strictEqual(loadingCalls[0].show, true);
    assert.strictEqual(loadingCalls[loadingCalls.length - 1].show, false);
    assert.strictEqual(swalCalls.length, 1);

    root.UI.confirm = async () => false;
    const cloudBeforeCancel = cloudCalls;
    await runtime.saveAndSync(manager);
    assert.strictEqual(cloudCalls, cloudBeforeCancel);

    root.UI.confirm = async () => true;
    root.isArchiveLocked = () => true;
    await runtime.saveAndSync(manager);
    assert.strictEqual(alerts.some((msg) => msg.includes('已封存')), true);

    root.isArchiveLocked = () => false;
    root.saveCloudData = () => Promise.resolve(false);
    await runtime.saveAndSync(manager);
    assert.strictEqual(alerts.some((msg) => msg.includes('保存失败')), true);

    root.SAVE_SYNC_TIMEOUT_MS = 100;
    root.saveCloudData = () => new Promise(() => {});
    await runtime.saveAndSync(manager);
    assert.strictEqual(alerts.some((msg) => msg.includes('云端同步超时')), true);
    assert.strictEqual(loadingCalls[loadingCalls.length - 1].show, false);

    console.log('data-manager-save-sync-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
