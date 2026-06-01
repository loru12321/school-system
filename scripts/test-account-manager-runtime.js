const assert = require('assert');
const fs = require('fs');
const path = require('path');

const createAccountManagerRuntime = require(path.resolve(__dirname, '../public/assets/js/account-manager-runtime.js'));

async function run() {
    const hintEl = { innerHTML: '' };
    const inputEl = { value: '', focusCalled: false, focus() { this.focusCalled = true; } };
    const modalEl = { style: { display: 'none' } };
    const tbody = {
        innerHTML: '',
        handlers: {},
        addEventListener(type, handler) {
            this.handlers[type] = handler;
        }
    };
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
    const editCalls = [];
    const resetCalls = [];
    const manager = {
        renderTable(list) { return runtime.renderTable.call(this, list); },
        search() { return runtime.search(this); },
        editAttributes(username, role, className) { editCalls.push({ username, role, className }); },
        resetPassword(username) { resetCalls.push(username); }
    };
    root.AccountManager = manager;

    runtime.open();
    assert.ok(hintEl.innerHTML.includes('管理员权限'));
    assert.strictEqual(modalEl.style.display, 'flex');
    assert.strictEqual(inputEl.focusCalled, true);

    inputEl.value = 'abc';
    await runtime.search(manager);
    assert.strictEqual(gatewayCalls.length, 1);
    assert.strictEqual(gatewayCalls[0].keyword, 'abc');
    assert.ok(String(tbody.innerHTML).includes('data-account-action="edit"'));
    assert.ok(!String(tbody.innerHTML).includes('onclick="AccountManager.'));
    assert.strictEqual(typeof tbody.handlers.click, 'function');

    tbody.handlers.click({
        target: {
            closest(selector) {
                assert.strictEqual(selector, '[data-account-action]');
                return {
                    disabled: false,
                    dataset: {
                        accountAction: 'edit',
                        accountUsername: 'u1',
                        accountRole: 'parent',
                        accountClass: '701'
                    }
                };
            }
        }
    });
    assert.deepStrictEqual(editCalls[0], { username: 'u1', role: 'parent', className: '701' });

    tbody.handlers.click({
        target: {
            closest() {
                return {
                    disabled: false,
                    dataset: {
                        accountAction: 'reset-password',
                        accountUsername: 'u1'
                    }
                };
            }
        }
    });
    assert.deepStrictEqual(resetCalls, ['u1']);

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

    const rootDir = path.resolve(__dirname, '..');
    const html = fs.readFileSync(path.join(rootDir, 'src/index.html'), 'utf8');
    const app = fs.readFileSync(path.join(rootDir, 'public/assets/js/app.js'), 'utf8');
    assert.ok(html.includes('一键生成所有账号 (教师)'), 'account manager should expose a teacher-only bulk generation button');
    assert.ok(html.includes('一键生成所有账号 (家长)'), 'account manager should expose a parent-only bulk generation button');
    assert.ok(!html.includes('一键生成所有账号 (教师+家长)'), 'combined teacher+parent bulk generation button should be removed');
    assert.ok(html.includes('Auth.generateTeacherAccounts()'), 'teacher bulk button should call the teacher-only entry');
    assert.ok(html.includes('Auth.generateParentAccounts()'), 'parent bulk button should call the parent-only entry');
    assert.ok(app.includes("generateTeacherAccounts: function ()"), 'Auth should expose a teacher-only account generator');
    assert.ok(app.includes("generateParentAccounts: function ()"), 'Auth should expose a parent-only account generator');
    assert.ok(app.includes("options.accountType === 'teacher'"), 'account generation should support teacher-only scope');
    assert.ok(app.includes("options.accountType === 'parent'"), 'account generation should support parent-only scope');

    console.log('account-manager-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
