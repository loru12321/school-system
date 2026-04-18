const assert = require('assert');
const path = require('path');

const createAccountManagerRuntime = require(path.resolve(__dirname, '../public/assets/js/account-manager-runtime.js'));

async function run() {
    const hintEl = { innerHTML: '' };
    const inputEl = { value: '', focusCalled: false, focus() { this.focusCalled = true; } };
    const modalEl = { style: { display: 'none' } };
    const tbody = { innerHTML: '' };
    const resultTable = { querySelector: () => tbody };

    const alerts = [];
    const toasts = [];
    const loadingCalls = [];
    const gatewayCalls = [];

    const root = {
        Auth: { currentUser: { name: 'admin1', role: 'admin' } },
        UI: {
            toast(text, type) { toasts.push({ text, type }); },
            loading(show, text) { loadingCalls.push({ show, text }); }
        },
        EdgeGateway: {
            async searchAccounts(keyword, options) {
                gatewayCalls.push({ keyword, options });
                return {
                    records: [{
                        username: 'u1',
                        role: 'parent',
                        class_name: '701',
                        password_display: '***'
                    }]
                };
            }
        },
        alert(msg) {
            alerts.push(String(msg || ''));
        },
        document: {
            getElementById(id) {
                if (id === 'acc-permission-hint') return hintEl;
                if (id === 'acc-search-input') return inputEl;
                if (id === 'account-manager-modal') return modalEl;
                if (id === 'acc-result-table') return resultTable;
                return null;
            },
            querySelector(selector) {
                if (selector === '#acc-result-table tbody') return tbody;
                return null;
            }
        }
    };

    const runtime = createAccountManagerRuntime(root);
    const manager = {
        renderTable(list) { return runtime.renderTable.call(this, list); },
        search() { return runtime.search(this); }
    };

    runtime.open();
    assert.ok(hintEl.innerHTML.includes('管理员权限'));
    assert.strictEqual(modalEl.style.display, 'flex');
    assert.strictEqual(inputEl.focusCalled, true);

    inputEl.value = 'abc';
    await runtime.search(manager);
    assert.strictEqual(gatewayCalls.length, 1);
    assert.strictEqual(gatewayCalls[0].keyword, 'abc');
    assert.ok(String(tbody.innerHTML).includes('AccountManager.editAttributes'));

    inputEl.value = '';
    await runtime.search(manager);
    assert.strictEqual(toasts.length > 0, true);
    assert.strictEqual(toasts[toasts.length - 1].type, 'warning');

    const deniedRoot = {
        ...root,
        Auth: { currentUser: { name: 't1', role: 'teacher' } }
    };
    const deniedRuntime = createAccountManagerRuntime(deniedRoot);
    deniedRuntime.open();
    assert.ok(alerts.some((msg) => msg.includes('权限不足')));

    console.log('account-manager-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
