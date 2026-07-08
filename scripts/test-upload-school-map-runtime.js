const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createButton() {
    const listeners = {};
    return {
        addEventListener(type, handler) {
            listeners[type] = handler;
        },
        click() {
            if (listeners.click) listeners.click();
        }
    };
}

function createOverlay(selects) {
    const confirmButton = createButton();
    const cancelButton = createButton();
    return {
        className: '',
        style: { cssText: '' },
        removed: false,
        set innerHTML(value) {
            this._innerHTML = String(value || '');
            selects.length = 0;
            const re = /class="upload-school-map-select"[^>]*data-raw="([^"]+)"[^>]*>[\s\S]*?<option value="([^"]+)" selected>/g;
            let match;
            while ((match = re.exec(this._innerHTML))) {
                const raw = match[1];
                const selected = match[2];
                selects.push({
                    getAttribute(name) {
                        return name === 'data-raw' ? raw : '';
                    },
                    value: selected
                });
            }
        },
        get innerHTML() {
            return this._innerHTML || '';
        },
        querySelector(selector) {
            if (selector === '[data-action="confirm"]') return confirmButton;
            if (selector === '[data-action="cancel"]') return cancelButton;
            return null;
        },
        querySelectorAll(selector) {
            if (selector === '.upload-school-map-select') return selects;
            return [];
        },
        remove() {
            this.removed = true;
        },
        confirmButton,
        cancelButton
    };
}

async function run() {
    const runtimePath = path.resolve(__dirname, '../public/assets/js/upload-school-map-runtime.js');
    const source = fs.readFileSync(runtimePath, 'utf8');
    const selects = [];
    let overlay = null;
    const appended = [];
    const root = {
        window: null,
        document: {
            createElement(tag) {
                assert.strictEqual(tag, 'div');
                overlay = createOverlay(selects);
                return overlay;
            },
            body: {
                appendChild(node) {
                    appended.push(node);
                }
            }
        },
        RAW_DATA: [
            { school: '东平银山实验学校', originalSchoolName: '东平银山实验学校', name: 'A' },
            { school: '东平银山实验学校', originalSchoolName: '东平银山实验学校', name: 'B' }
        ],
        SCHOOL_ALIAS_GROUPS: [
            { canonical: '银山实验学校' }
        ],
        COUNTY_STANDARD_SCHOOL_NAMES: ['银山实验学校'],
        TARGETS: {},
        SCHOOLS: {},
        DEFAULT_MY_SCHOOL_NAME: '银山实验学校',
        bringSchoolModalToFront(node) {
            node.style.zIndex = '1000010';
            node.broughtToFront = true;
        },
        getCanonicalSchoolName(value) {
            return String(value || '') === '东平银山实验学校' ? '银山实验学校' : '';
        },
        setRawData(rows) {
            root.RAW_DATA = rows;
        },
        setSchools(schools) {
            root.SCHOOLS = schools;
        }
    };
    root.window = root;

    vm.runInNewContext(source, root, { filename: runtimePath });

    assert.strictEqual(root.hasUploadSchoolMappingConfirmation(), false);
    const promise = root.confirmUploadSchoolNameMappings();
    assert.strictEqual(appended.length, 1);
    assert.strictEqual(overlay.broughtToFront, true);
    assert.strictEqual(overlay.style.zIndex, '1000010');
    assert.strictEqual(root.hasUploadSchoolMappingConfirmation(), false);

    let settled = false;
    promise.then(() => { settled = true; });
    await Promise.resolve();
    assert.strictEqual(settled, false, 'mapping confirmation must block until the user confirms');

    overlay.confirmButton.click();
    const mapping = await promise;
    assert.strictEqual(settled, true);
    assert.strictEqual(mapping['东平银山实验学校'], '银山实验学校');
    assert.strictEqual(root.hasUploadSchoolMappingConfirmation(), true);
    assert.strictEqual(root.RAW_DATA[0].school, '银山实验学校');
    assert.ok(root.SCHOOLS['银山实验学校']);

    const appSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app.js'), 'utf8');
    const confirmIndex = appSource.indexOf('await confirmUploadSchoolNameMappings();');
    const saveIndex = appSource.indexOf('cloudSynced = await saveCloudData({');
    assert.ok(
        confirmIndex > -1 && saveIndex > -1 && confirmIndex < saveIndex,
        'score upload must confirm school mappings before saveCloudData'
    );
    assert.ok(
        appSource.includes('hasUploadSchoolMappingConfirmation') && appSource.includes('已阻止云端同步'),
        'score upload must guard cloud sync on explicit school mapping confirmation'
    );

    const dialogSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/dialog-runtime.js'), 'utf8');
    assert.ok(dialogSource.includes('bringSchoolModalToFront'), 'shared dialog runtime should expose a top-layer modal helper');
    assert.ok(dialogSource.includes('MutationObserver'), 'shared dialog runtime should watch newly opened modals');

    console.log('upload-school-map-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
