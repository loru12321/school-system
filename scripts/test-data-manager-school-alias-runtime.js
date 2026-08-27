const assert = require('assert');
const path = require('path');

const createDataManagerSchoolAliasRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-school-alias-runtime.js'));

function waitTick() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function run() {
    let aliasStore = [{ canonical: '甲学校', alias: '甲校' }];
    let ensureCalls = 0;
    let persistLocalCalls = 0;
    let setAliasCalls = 0;
    let replaceCalls = 0;
    let renderAliasCalls = 0;
    let renderStatusCalls = 0;
    const toasts = [];
    const confirms = [];

    const defaultTbody = { innerHTML: '' };
    const customTbody = { innerHTML: '' };
    const summaryEl = { innerHTML: '' };

    const root = {
        window: {
            Auth: { currentUser: { role: 'admin' } }
        },
        SCHOOL_ALIAS_GROUPS: [
            { canonical: '实验学校', aliases: ['实验中学', '实验校'] }
        ],
        ensureSchoolAliasStore() {
            ensureCalls += 1;
            return aliasStore;
        },
        setSchoolAliasState(nextStore) {
            setAliasCalls += 1;
            aliasStore = nextStore;
        },
        persistSchoolAliasSettingsLocal() {
            persistLocalCalls += 1;
        },
        getCurrentUser() {
            return { role: 'admin' };
        },
        mapGatewaySchoolAliasRows(records) {
            return records.map((item) => ({ canonical: item.canonical, alias: item.alias }));
        },
        replaceCustomSchoolAliasStore(rows) {
            replaceCalls += 1;
            aliasStore = rows;
        },
        buildSchoolAliasGatewayRows() {
            return [{ canonical_name: '甲学校', alias_name: '甲校' }];
        },
        sanitizeSchoolText(value) {
            return String(value || '').trim().toLowerCase();
        },
        saveCloudData() {
            return Promise.resolve(true);
        },
        EdgeGateway: {
            canUseAuthorizedRequests() {
                return true;
            },
            listAliasRules() {
                return Promise.resolve({ records: [{ canonical: '乙学校', alias: '乙校' }] });
            },
            saveAliasRules() {
                return Promise.resolve(true);
            }
        },
        UI: {
            toast(text, type) {
                toasts.push({ text, type });
            },
            confirm(message) {
                confirms.push(message);
                return Promise.resolve(true);
            }
        },
        document: {
            getElementById(id) {
                if (id === 'dm-default-school-aliases-tbody') return defaultTbody;
                if (id === 'dm-custom-school-aliases-tbody') return customTbody;
                if (id === 'dm-school-aliases-summary') return summaryEl;
                if (id === 'swal-school-canonical') return { value: '丙学校' };
                if (id === 'swal-school-alias') return { value: '丙校' };
                return null;
            }
        },
        confirm() {
            return true;
        },
        Swal: {
            showValidationMessage() {},
            fire(options) {
                if (options && typeof options === 'object' && options.title) {
                    return Promise.resolve({ isConfirmed: true, value: { canonical: '丙学校', alias: '丙校' } });
                }
                return Promise.resolve(true);
            }
        }
    };

    const runtime = createDataManagerSchoolAliasRuntime(root);
    const manager = {
        renderDataManagerStatus() {
            renderStatusCalls += 1;
        },
        renderSchoolAliasMappings() {
            renderAliasCalls += 1;
        },
        persistSchoolAliasSettings() {
            return runtime.persistSchoolAliasSettings(this);
        }
    };

    runtime.renderSchoolAliasMappings(manager);
    assert.ok(String(summaryEl.innerHTML).includes('默认规则'));
    assert.ok(String(defaultTbody.innerHTML).includes('实验学校'));
    assert.ok(String(customTbody.innerHTML).includes('甲学校'));
    assert.strictEqual(renderStatusCalls > 0, true);

    const synced = await runtime.syncSchoolAliasSettingsFromGateway(manager);
    assert.strictEqual(synced, true);
    assert.strictEqual(replaceCalls, 1);
    assert.strictEqual(renderAliasCalls > 0, true);
    assert.deepStrictEqual(aliasStore, [{ canonical: '乙学校', alias: '乙校' }]);

    const persisted = await runtime.persistSchoolAliasSettings(manager);
    assert.strictEqual(persisted, true);
    assert.strictEqual(ensureCalls > 0, true);
    assert.strictEqual(persistLocalCalls > 0, true);

    runtime.openSchoolAliasEditor(manager, -1);
    await waitTick();
    assert.strictEqual(setAliasCalls > 0, true);
    assert.strictEqual(toasts.some((item) => item.type === 'success'), true);

    aliasStore = [{ canonical: '丁学校', alias: '丁校' }];
    await runtime.deleteSchoolAliasMapping(manager, 0);
    assert.deepStrictEqual(aliasStore, []);
    assert.strictEqual(confirms.length, 1);
    assert.strictEqual(toasts.filter((item) => item.type === 'success').length >= 2, true);

    root.getCurrentUser = () => ({ role: 'teacher' });
    const denied = await runtime.syncSchoolAliasSettingsFromGateway(manager);
    assert.strictEqual(denied, false);

    console.log('data-manager-school-alias-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
