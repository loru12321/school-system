const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
    path.resolve(__dirname, '../public/assets/js/cloud-data-service-runtime.js'),
    'utf8'
);

function loadRuntime(root = {}) {
    const windowRoot = {
        ...root,
        structuredClone: global.structuredClone
    };
    const sandbox = {
        window: windowRoot,
        console
    };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: 'cloud-data-service-runtime.js' });
    return windowRoot;
}

async function runCloudApiPathTest() {
    const log = [];
    const root = loadRuntime({
        CloudApi: {
            async selectSystemData(options) {
                log.push({ type: 'select', options: { ...options } });
                return { data: [{ key: options.keyEq || 'ROW', value: 1 }], error: null, source: 'api' };
            },
            async readSystemDataRecord(key, select) {
                log.push({ type: 'read', key, select });
                return { data: { key, content: '{"ok":true}' }, error: null, source: 'api' };
            },
            async upsertSystemData(row) {
                log.push({ type: 'upsert', row: { ...row } });
                return { data: row, error: null, source: 'api' };
            },
            async deleteSystemData(options) {
                log.push({ type: 'delete', options: { ...options } });
                return { data: [], error: null, source: 'api' };
            }
        },
        selectSystemDataRecords() {
            throw new Error('legacy select should not be used when CloudApi exists');
        },
        readSystemDataRecord() {
            throw new Error('legacy read should not be used when CloudApi exists');
        },
        upsertSystemDataRecord() {
            throw new Error('legacy upsert should not be used when CloudApi exists');
        },
        deleteSystemDataRecords() {
            throw new Error('legacy delete should not be used when CloudApi exists');
        }
    });

    const service = root.CloudDataService;
    assert.ok(service, 'CloudDataService should be exposed');

    const firstSelect = await service.selectSystemData({ keyEq: 'A', select: 'key' });
    assert.strictEqual(firstSelect.error, null);
    firstSelect.data[0].key = 'MUTATED';
    const secondSelect = await service.selectSystemData({ keyEq: 'A', select: 'key' });
    assert.deepStrictEqual(secondSelect.data, [{ key: 'A', value: 1 }]);
    assert.strictEqual(log.filter(item => item.type === 'select').length, 1, 'select should reuse cache');

    const record = await service.selectSystemDataRecords({ keyLike: 'B%', select: 'key' });
    assert.strictEqual(record.error, null);
    assert.deepStrictEqual(record.data, [{ key: 'ROW', value: 1 }]);

    const firstRead = await service.readSystemDataRecord('A', 'content');
    assert.strictEqual(firstRead.error, null);
    const secondRead = await service.readSystemDataRecord('A', 'content');
    assert.deepStrictEqual(secondRead.data, { key: 'A', content: '{"ok":true}' });
    assert.strictEqual(log.filter(item => item.type === 'read').length, 1, 'read should reuse cache');

    const upsert = await service.upsertSystemDataRecord({ key: 'A', content: '{}' });
    assert.strictEqual(upsert.error, null);
    await service.readSystemDataRecord('A', 'content');
    assert.strictEqual(log.filter(item => item.type === 'read').length, 2, 'write should invalidate read cache');

    const deleted = await service.deleteSystemDataRecords({ keyEq: 'A' });
    assert.strictEqual(deleted.error, null);
    assert.strictEqual(log.filter(item => item.type === 'delete').length, 1);
}

async function runLegacyFallbackTest() {
    const log = [];
    const root = loadRuntime({
        async selectSystemDataRecords(options) {
            log.push({ type: 'legacy-select', options: { ...options } });
            return { data: [{ key: 'LEGACY' }], error: null, source: 'legacy' };
        },
        async readSystemDataRecord(key, select) {
            log.push({ type: 'legacy-read', key, select });
            return { data: { key, content: 'legacy' }, error: null, source: 'legacy' };
        },
        async upsertSystemDataRecord(row) {
            log.push({ type: 'legacy-upsert', row: { ...row } });
            return { data: row, error: null, source: 'legacy' };
        },
        async deleteSystemDataRecords(options) {
            log.push({ type: 'legacy-delete', options: { ...options } });
            return { data: [], error: null, source: 'legacy' };
        }
    });

    const service = root.CloudDataService;
    const selected = await service.selectSystemDataRecords({ keyLike: 'X%' });
    assert.deepStrictEqual(selected.data, [{ key: 'LEGACY' }]);
    assert.strictEqual(log[0].type, 'legacy-select');

    const read = await service.readSystemDataRecord('X', 'content');
    assert.deepStrictEqual(read.data, { key: 'X', content: 'legacy' });

    const upsert = await service.upsertSystemDataRecord({ key: 'X', content: '{}' });
    assert.strictEqual(upsert.error, null);
    const deleted = await service.deleteSystemDataRecords({ keyEq: 'X' });
    assert.strictEqual(deleted.error, null);

    assert.deepStrictEqual(log.map(item => item.type), [
        'legacy-select',
        'legacy-read',
        'legacy-upsert',
        'legacy-delete'
    ]);
}

async function run() {
    await runCloudApiPathTest();
    await runLegacyFallbackTest();
    console.log('cloud-data-service-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
