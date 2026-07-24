const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
    path.resolve(__dirname, '../public/assets/js/workspace-unload-guard-runtime.js'),
    'utf8'
);
const bootRuntime = fs.readFileSync(
    path.resolve(__dirname, '../public/assets/js/boot-runtime.js'),
    'utf8'
);
let beforeUnloadHandler = null;
const root = {
    addEventListener(type, handler) {
        if (type === 'beforeunload') beforeUnloadHandler = handler;
    },
    DataManager: {
        readDataManagerSyncState: () => ({ pendingCloudSync: false })
    }
};
root.window = root;

vm.runInNewContext(source, root, { filename: 'workspace-unload-guard-runtime.js' });
assert.ok(beforeUnloadHandler, 'unload guard should register a beforeunload handler');
assert.ok(root.WorkspaceUnloadGuard, 'unload guard should expose its focused policy API');
assert.ok(
    bootRuntime.indexOf("'workspace-unload-guard-runtime.js'") < bootRuntime.indexOf("'app.js'"),
    'unload guard must load before app.js'
);

const syncedEvent = {
    prevented: false,
    preventDefault() { this.prevented = true; },
    returnValue: ''
};
assert.strictEqual(beforeUnloadHandler(syncedEvent), undefined);
assert.strictEqual(syncedEvent.prevented, false, 'synced cloud data must not block normal refresh');

root.DataManager.readDataManagerSyncState = () => ({ pendingCloudSync: true });
const pendingEvent = {
    prevented: false,
    preventDefault() { this.prevented = true; },
    returnValue: ''
};
assert.match(beforeUnloadHandler(pendingEvent), /同步到云端/);
assert.strictEqual(pendingEvent.prevented, true, 'pending cloud writes must still protect against accidental refresh');
assert.match(String(pendingEvent.returnValue), /同步到云端/);

console.log('workspace unload guard runtime tests passed');
