const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const cloudWorkspace = read('public/assets/js/cloud-workspace-runtime.js');
const dataCloud = read('public/assets/js/data-cloud-runtime.js');
const cloud = read('public/assets/js/cloud.js');
const dataManagerCore = read('public/assets/js/data-manager-core-runtime.js');

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

// Canonical user-prefix helper must be exposed on window so other cache writers
// (cloud.js, data-manager-core) reuse one implementation instead of drifting copies.
assert.ok(cloudWorkspace.includes('window.getIdbUserCachePrefix = getIdbUserPrefix;'),
  'canonical getIdbUserPrefix must be exposed on window for reuse');

// cloud.js snapshot cache (stores full-cohort PII payloads) must be user-scoped.
assert.ok(cloud.includes('function getScopedCacheKey(key)'), 'cloud.js must centralize scoped IDB cache keys');
assert.ok(cloud.includes('window.getIdbUserCachePrefix'), 'cloud.js scoped cache key must reuse the canonical user prefix');
assert.ok(cloud.includes('idbKeyval.get(getScopedCacheKey(snapshotKey))'), 'cloud.js snapshot cache reads must be user-scoped');
assert.ok(cloud.includes('idbKeyval.set(getScopedCacheKey(snapshotKey), payload)'), 'cloud.js snapshot cache writes must be user-scoped');
assert.ok(cloud.includes('idbKeyval.set(getScopedCacheKey(preferredKey), merged)'), 'cloud.js merged-payload cache writes must be user-scoped');
// No bare unprefixed idbKeyval cache_ keys may remain in cloud.js.
assert.ok(!/idbKeyval\.(get|set|del)\(`cache_\$\{/.test(cloud),
  'cloud.js must not use bare unprefixed cache_ IDB keys');

// data-manager-core exam cache delete must be user-scoped.
assert.ok(dataManagerCore.includes('getScopedCacheKey: function (key)'), 'data-manager-core must centralize scoped IDB cache keys');
assert.ok(dataManagerCore.includes('window.idbKeyval.del(this.getScopedCacheKey(key))'), 'data-manager-core exam cache delete must be user-scoped');
assert.ok(!/idbKeyval\??\.del\(`cache_\$\{/.test(dataManagerCore),
  'data-manager-core must not use bare unprefixed cache_ IDB keys');

console.log('local cache scope contract tests passed');
