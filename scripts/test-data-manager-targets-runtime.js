const assert = require('assert');
const path = require('path');

const createDataManagerTargetsRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-targets-runtime.js'));

function waitTick() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function run() {
    const tbody = { innerHTML: '' };
    const toasts = [];
    const alerts = [];
    const swalCalls = [];
    let normalizeCalls = 0;
    let saveCloudCalls = 0;
    let renderTargetsCalls = 0;
    let persistTemplateCalls = 0;
    let renderStatusCalls = 0;
    let restoreCalls = 0;

    const root = {
        window: {
            TARGETS: {
                A: { t1: 10, t2: 20 }
            }
        },
        TARGETS: {
            A: { t1: 10, t2: 20 }
        },
        SCHOOLS: {
            B: { name: 'B' }
        },
        readTargetsState() {
            return this.window.TARGETS;
        },
        setTargetsState(nextTargets) {
            this.window.TARGETS = nextTargets;
            this.TARGETS = nextTargets;
            return nextTargets;
        },
        ensureNormalizedTargets() {
            normalizeCalls += 1;
            return this.window.TARGETS;
        },
        resolveSchoolNameFromCollection(collection, rawName) {
            return Object.prototype.hasOwnProperty.call(collection || {}, rawName) ? rawName : '';
        },
        getCanonicalSchoolName(rawName) {
            return String(rawName || '').trim();
        },
        normalizeSchoolName(name) {
            return String(name || '').trim().toLowerCase();
        },
        isArchiveLocked() {
            return false;
        },
        FileReader: class {
            readAsArrayBuffer(file) {
                if (typeof this.onload === 'function') {
                    this.onload({ target: { result: file } });
                }
            }
        },
        XLSX: {
            read() {
                return {
                    SheetNames: ['S1'],
                    Sheets: {
                        S1: { __type: 'sheet' }
                    }
                };
            },
            utils: {
                sheet_to_json() {
                    return [
                        { 学校名称: 'A', 指标一目标人数: '11', 指标二目标人数: '22' },
                        { 学校名称: 'C', 指标一目标人数: 'x', 指标二目标人数: '3' },
                        { 学校名称: 'A', 指标一目标人数: '12', 指标二目标人数: '24' }
                    ];
                }
            }
        },
        document: {
            getElementById(id) {
                if (id === 'dm-targets-tbody') return tbody;
                if (id === 'swal-t1') return { value: '99' };
                if (id === 'swal-t2') return { value: '199' };
                return null;
            }
        },
        UI: {
            toast(text, type) {
                toasts.push({ text, type });
            }
        },
        alert(message) {
            alerts.push(String(message || ''));
        },
        Swal: {
            fire(...args) {
                swalCalls.push(args);
                if (args.length === 1 && typeof args[0] === 'object') {
                    return Promise.resolve({ isConfirmed: true, value: { t1: 30, t2: 60 } });
                }
                return Promise.resolve(true);
            }
        },
        confirm() {
            return true;
        },
        saveCloudData() {
            saveCloudCalls += 1;
            return Promise.resolve(true);
        }
    };

    const runtime = createDataManagerTargetsRuntime(root);
    const manager = {
        restoreGrade9TargetsTemplate() {
            restoreCalls += 1;
            return false;
        },
        renderSchoolAliasMappings() {},
        renderDataManagerStatus() {
            renderStatusCalls += 1;
        },
        renderTargets() {
            renderTargetsCalls += 1;
        },
        persistGrade9TargetsTemplate() {
            persistTemplateCalls += 1;
        }
    };

    runtime.renderTargets(manager);
    assert.strictEqual(normalizeCalls > 0, true);
    assert.strictEqual(restoreCalls, 0);
    assert.ok(String(tbody.innerHTML).includes('A'));
    assert.strictEqual(renderStatusCalls > 0, true);

    await runtime.editTarget(manager, 'A');
    assert.deepStrictEqual(root.window.TARGETS.A, { t1: 30, t2: 60 });
    assert.strictEqual(renderTargetsCalls > 0, true);
    assert.strictEqual(persistTemplateCalls > 0, true);
    assert.strictEqual(saveCloudCalls, 1);
    assert.strictEqual(toasts[toasts.length - 1].type, 'success');

    await runtime.deleteTarget(manager, 'A');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(root.window.TARGETS, 'A'), false);
    assert.strictEqual(saveCloudCalls, 2);
    assert.strictEqual(renderStatusCalls > 1, true);

    const uploadInput = { files: [{}], value: 'selected' };
    runtime.handleTargetUpload(manager, uploadInput);
    await waitTick();
    assert.deepStrictEqual(root.window.TARGETS.A, { t1: 12, t2: 24 });
    assert.strictEqual(saveCloudCalls, 3);
    assert.strictEqual(uploadInput.value, '');
    assert.strictEqual(swalCalls.length >= 2, true);
    assert.strictEqual(toasts.some((item) => item.type === 'success'), true);

    root.isArchiveLocked = () => true;
    const lockedInput = { files: [{}], value: 'locked' };
    runtime.handleTargetUpload(manager, lockedInput);
    assert.strictEqual(alerts.some((msg) => msg.includes('已封存')), true);

    root.window.TARGETS = {};
    runtime.renderTargets(manager);
    assert.ok(String(tbody.innerHTML).includes('暂无数据'));

    console.log('data-manager-targets-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
