const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createStorage() {
    const values = new Map();
    return {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

const source = fs.readFileSync(
    path.resolve(__dirname, '../public/assets/js/gateway-session-runtime.js'),
    'utf8'
);
const root = {
    location: {
        href: 'https://schoolsystem.com.cn/',
        origin: 'https://schoolsystem.com.cn'
    },
    sessionStorage: createStorage(),
    URL,
    setTimeout,
    clearTimeout
};
root.window = root;

vm.runInNewContext(source, root, { filename: 'gateway-session-runtime.js' });
const firstRuntime = root.GatewaySessionRuntime;
firstRuntime.setToken('fresh-login-token');

// Dynamic module loading can evaluate the same runtime twice. The second pass
// must preserve the active in-memory token until the user explicitly logs out.
vm.runInNewContext(source, root, { filename: 'gateway-session-runtime.js' });

assert.strictEqual(root.GatewaySessionRuntime, firstRuntime);
assert.strictEqual(root.GatewaySessionRuntime.getToken(), 'fresh-login-token');
assert.strictEqual(root.sessionStorage.getItem('EDGE_GATEWAY_TOKEN_V1'), null);
assert.strictEqual(root.GatewaySessionRuntime.isAuthoritativeSessionFailure(new Error('Invalid or expired app session token')), true);
assert.strictEqual(root.GatewaySessionRuntime.isAuthoritativeSessionFailure(new Error('Missing bearer token')), true);
assert.strictEqual(root.GatewaySessionRuntime.isAuthoritativeSessionFailure(new Error('EDGE_GATEWAY_HTTP_401')), true);
assert.strictEqual(root.GatewaySessionRuntime.isAuthoritativeSessionFailure(new Error('EDGE_GATEWAY_INVALID_RESPONSE')), false);
assert.strictEqual(root.GatewaySessionRuntime.isAuthoritativeSessionFailure(new Error('AbortError: signal is aborted')), false);
console.log('gateway-session-runtime tests passed');
