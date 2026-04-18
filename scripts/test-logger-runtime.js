const assert = require('assert');
const path = require('path');

const createLoggerRuntime = require(path.resolve(__dirname, '../public/assets/js/logger-runtime.js'));

function createSelectQuery(result, calls) {
    const query = {
        select(value) {
            calls.push({ method: 'select', value });
            return query;
        },
        order(field, options) {
            calls.push({ method: 'order', field, options });
            return query;
        },
        limit(value) {
            calls.push({ method: 'limit', value });
            return query;
        },
        eq(field, value) {
            calls.push({ method: 'eq', field, value });
            return query;
        },
        or(value) {
            calls.push({ method: 'or', value });
            return query;
        },
        then(resolve, reject) {
            return Promise.resolve(result).then(resolve, reject);
        }
    };
    return query;
}

async function run() {
    const insertCalls = [];
    const logRoot = {
        AuthState: {
            getCurrentUser() {
                return { name: 'alice', role: 'admin' };
            }
        },
        sbClient: {
            from(table) {
                assert.strictEqual(table, 'system_logs');
                return {
                    async insert(rows) {
                        insertCalls.push(rows);
                        return { data: null, error: null };
                    }
                };
            }
        }
    };
    const logRuntime = createLoggerRuntime(logRoot);
    await logRuntime.log('同步账号', '同步了 3 个账号');
    assert.strictEqual(insertCalls.length, 1);
    assert.strictEqual(insertCalls[0][0].operator, 'alice (admin)');
    assert.strictEqual(insertCalls[0][0].action, '同步账号');
    assert.strictEqual(insertCalls[0][0].status, 'normal');

    const normalCalls = [];
    const normalListEl = { innerHTML: '' };
    const normalRoot = {
        document: {
            getElementById(id) {
                if (id === 'admin-log-list') return normalListEl;
                return null;
            }
        },
        sbClient: {
            from(table) {
                assert.strictEqual(table, 'system_logs');
                return createSelectQuery({
                    data: [{
                        id: 1,
                        created_at: '2026-04-12T00:00:00.000Z',
                        operator: 'alice (admin)',
                        action: '同步账号',
                        details: '同步了 3 个账号'
                    }],
                    error: null
                }, normalCalls);
            }
        }
    };
    const normalRuntime = createLoggerRuntime(normalRoot);
    await normalRuntime.loadLogs({ isHistoryMode: false });
    assert.ok(normalCalls.some((item) => item.method === 'or' && item.value === 'status.eq.normal,status.is.null'));
    assert.ok(String(normalListEl.innerHTML).includes('<table'));
    assert.ok(String(normalListEl.innerHTML).includes('同步账号'));

    const historyCalls = [];
    const historyListEl = { innerHTML: '' };
    const historyRoot = {
        document: {
            getElementById(id) {
                if (id === 'admin-log-list') return historyListEl;
                return null;
            }
        },
        sbClient: {
            from(table) {
                assert.strictEqual(table, 'system_logs');
                return createSelectQuery({
                    data: [],
                    error: null
                }, historyCalls);
            }
        }
    };
    const historyRuntime = createLoggerRuntime(historyRoot);
    await historyRuntime.loadLogs({ isHistoryMode: true });
    assert.ok(historyCalls.some((item) => item.method === 'eq' && item.field === 'status' && item.value === 'deleted'));

    const checkboxes = [{ checked: false, value: '1' }, { checked: false, value: '2' }];
    const checkedBoxes = [{ checked: true, value: '2' }];
    const selectRoot = {
        document: {
            querySelectorAll(selector) {
                if (selector === '.log-item-check') return checkboxes;
                if (selector === '.log-item-check:checked') return checkedBoxes;
                return [];
            }
        }
    };
    const selectRuntime = createLoggerRuntime(selectRoot);
    selectRuntime.toggleSelectAll({}, { checked: true });
    assert.strictEqual(checkboxes[0].checked, true);
    assert.strictEqual(checkboxes[1].checked, true);
    assert.deepStrictEqual(selectRuntime.getCheckedIds(), ['2']);

    console.log('logger-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
