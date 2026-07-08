const assert = require('assert');
const path = require('path');

const createCloudApiRuntime = require(path.resolve(__dirname, '../public/assets/js/cloud-api-runtime.js'));

function createMockStorage(initialState = {}) {
    const state = new Map(Object.entries(initialState));
    return {
        getItem(key) {
            return state.has(key) ? state.get(key) : null;
        },
        setItem(key, value) {
            state.set(key, String(value));
        },
        removeItem(key) {
            state.delete(key);
        }
    };
}

function createRuntimeRoot(callLog = []) {
    const sessionStorage = createMockStorage({
        'edu:session:token': 'legacy-session-token',
        EDGE_GATEWAY_TOKEN_V1: 'edge-session-token',
        EDGE_GATEWAY_USER_V1: '{"username":"admin"}',
        CURRENT_USER: '{"name":"admin"}'
    });
    const root = {
        location: {
            protocol: 'https:',
            origin: 'https://schoolsystem.com.cn',
            hostname: 'schoolsystem.com.cn',
            href: 'https://schoolsystem.com.cn/'
        },
        SUPABASE_KEY: 'sb_publishable_example',
        sessionStorage,
        EdgeGateway: {
            clearSession() {
                callLog.push('clearSession');
                sessionStorage.removeItem('EDGE_GATEWAY_TOKEN_V1');
                sessionStorage.removeItem('EDGE_GATEWAY_USER_V1');
            }
        },
        AuthState: {
            clearCurrentUser() {
                callLog.push('clearCurrentUser');
                sessionStorage.removeItem('CURRENT_USER');
                sessionStorage.removeItem('CURRENT_ROLE');
                sessionStorage.removeItem('CURRENT_ROLES');
            }
        },
        Auth: {
            syncLoginOverlayState(visible) {
                callLog.push(`syncLoginOverlayState:${visible}`);
            }
        },
        UI: {
            toast(message, type) {
                callLog.push(`toast:${type}:${message}`);
            }
        }
    };
    return root;
}

async function run() {
    const firstLog = [];
    const firstRoot = createRuntimeRoot(firstLog);
    const firstRuntime = createCloudApiRuntime(firstRoot);

    assert.ok(firstRuntime._test && typeof firstRuntime._test.handleCloudSessionExpired === 'function');
    assert.strictEqual(firstRuntime._test.handleCloudSessionExpired({ status: 401 }), true);
    assert.strictEqual(firstRoot.sessionStorage.getItem('edu:session:token'), null);
    assert.strictEqual(firstRoot.sessionStorage.getItem('EDGE_GATEWAY_TOKEN_V1'), null);
    assert.strictEqual(firstRoot.sessionStorage.getItem('EDGE_GATEWAY_USER_V1'), null);
    assert.strictEqual(firstRoot.sessionStorage.getItem('CURRENT_USER'), null);
    assert.deepStrictEqual(firstLog.slice(0, 3), [
        'clearSession',
        'clearCurrentUser',
        'syncLoginOverlayState:true'
    ]);
    assert.strictEqual(
        firstLog.indexOf('clearCurrentUser') < firstLog.indexOf('syncLoginOverlayState:true'),
        true,
        'CURRENT_USER must be cleared before the login overlay state is synced'
    );

    const nonAuthLog = [];
    const nonAuthRoot = createRuntimeRoot(nonAuthLog);
    const nonAuthRuntime = createCloudApiRuntime(nonAuthRoot);
    assert.strictEqual(nonAuthRuntime._test.handleCloudSessionExpired({ status: 500 }), false);
    assert.strictEqual(nonAuthRoot.sessionStorage.getItem('edu:session:token'), 'legacy-session-token');
    assert.deepStrictEqual(nonAuthLog, []);

    const idempotentLog = [];
    const idempotentRoot = createRuntimeRoot(idempotentLog);
    const idempotentRuntime = createCloudApiRuntime(idempotentRoot);
    assert.strictEqual(idempotentRuntime._test.handleCloudSessionExpired({ status: 401 }), true);
    assert.strictEqual(idempotentRuntime._test.handleCloudSessionExpired({ status: 401 }), true);
    assert.strictEqual(idempotentLog.filter((item) => item === 'syncLoginOverlayState:true').length, 1);
    assert.strictEqual(idempotentLog.filter((item) => item === 'clearCurrentUser').length, 1);

    console.log('test-cloud-session-expiry passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
