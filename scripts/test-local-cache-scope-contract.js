const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const cloudWorkspace = read('public/assets/js/cloud-workspace-runtime.js');
const dataCloud = read('public/assets/js/data-cloud-runtime.js');

assert.ok(cloudWorkspace.includes('function getIdbUserPrefix()'), 'workspace IDB cache must derive a user prefix');
assert.ok(cloudWorkspace.includes('function getWorkspaceSyncQueueStorageKey()'), 'workspace sync queue must have a scoped storage key helper');
assert.ok(cloudWorkspace.includes('return userPrefix ? `${WORKSPACE_SYNC_QUEUE_KEY}::${userPrefix}` : WORKSPACE_SYNC_QUEUE_KEY;'), 'workspace queue key must be user-scoped when logged in');
assert.ok(cloudWorkspace.includes('return `${WORKSPACE_SYNC_META_PREFIX}${userPrefix}${encodeURIComponent'), 'workspace meta keys must use the same user prefix as IDB payload keys');
assert.ok(cloudWorkspace.includes('readStoredJson(getWorkspaceSyncQueueStorageKey(), {})'), 'workspace queue reads must use the scoped queue key');
assert.ok(cloudWorkspace.includes('writeStoredJson(getWorkspaceSyncQueueStorageKey(), queue'), 'workspace queue writes must use the scoped queue key');
assert.ok(cloudWorkspace.includes('key.startsWith(`${WORKSPACE_SYNC_QUEUE_KEY}::`)'), 'storage invalidation must cover scoped queue keys');

assert.ok(dataCloud.includes('function getIdbUserPrefix()'), 'data cloud cache must derive a user prefix');
assert.ok(dataCloud.includes('function getLocalCacheStorageKey(key, suffix = \'\')'), 'data cloud cache must centralize scoped IDB keys');
assert.ok(dataCloud.includes('await store.set(getLocalCacheStorageKey(key), value)'), 'data cloud payload writes must use scoped IDB keys');
assert.ok(dataCloud.includes('await store.set(getLocalCacheStorageKey(key, \'_meta\')'), 'data cloud meta writes must use scoped IDB keys');
assert.ok(dataCloud.includes('return store.get(getLocalCacheStorageKey(key))'), 'data cloud payload reads must use scoped IDB keys');
assert.ok(dataCloud.includes('const meta = await store.get(getLocalCacheStorageKey(key, \'_meta\'))'), 'data cloud meta reads must use scoped IDB keys');
assert.ok(dataCloud.includes('await store.del(getLocalCacheStorageKey(key))'), 'data cloud cache deletes must use scoped IDB keys');

console.log('local cache scope contract tests passed');
