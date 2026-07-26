// Contract: cold-login batched-read bootstrap endpoint + frontend fast path.
// Guards the wiring that collapses the cold-device login (4-6 serial trans-Pacific
// round-trips) into one batched request, WITHOUT changing which exam is restored.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const workerSystemData = read('src/worker-system-data.js');
const workerDummy = read('src/worker-dummy.js');
const cloudApi = read('public/assets/js/cloud-api-runtime.js');
const dataCloud = read('public/assets/js/data-cloud-runtime.js');
const appJs = read('public/assets/js/app.js');

// --- Backend: route + auth + batched read -------------------------------------

assert.ok(
  workerSystemData.includes("export const SYSTEM_DATA_BOOTSTRAP_API_PATH = '/api/system-data-bootstrap'"),
  'worker should export the bootstrap path constant'
);
assert.ok(
  workerSystemData.includes('export async function handleSystemDataBootstrapProxy'),
  'worker should export the bootstrap proxy handler'
);
assert.ok(
  /handleSystemDataBootstrapProxy[\s\S]*requireSystemDataSession[\s\S]*authorizeSystemDataRead/.test(workerSystemData),
  'bootstrap must require a session and authorize as a READ (never a write) despite the POST verb'
);
assert.ok(
  /handleSystemDataBootstrapProxy[\s\S]*shouldProxySystemDataToSupabase\(env\)[\s\S]*501/.test(workerSystemData),
  'bootstrap must return 501 on supabase-only deployments so the client falls back'
);
assert.ok(
  /handleSystemDataBootstrap\b[\s\S]*db\.batch\(statements\)/.test(workerSystemData),
  'bootstrap must run the workspace row + exam metadata reads in one db.batch()'
);
assert.ok(
  workerSystemData.includes("kind = 'exam'") && /ORDER BY updated_at DESC LIMIT \?/.test(workerSystemData),
  'bootstrap exam-metadata query must be cohort-scoped and bounded'
);
// Selection authority stays on the client: the server prefetches the newest row
// only as a hint and returns currentShard, but must not decide the workspace exam.
assert.ok(
  /newestExamKey[\s\S]*currentShard/.test(workerSystemData),
  'bootstrap should prefetch the newest exam shard as a hint (currentShard)'
);

// Route registration + OPTIONS preflight whitelist in the entrypoint.
assert.ok(
  workerDummy.includes('SYSTEM_DATA_BOOTSTRAP_API_PATH') && workerDummy.includes('handleSystemDataBootstrapProxy'),
  'entrypoint must import the bootstrap path + handler'
);
assert.ok(
  /url\.pathname === SYSTEM_DATA_BOOTSTRAP_API_PATH[\s\S]*handleSystemDataBootstrapProxy\(request, env\)/.test(workerDummy),
  'entrypoint must route POST /api/system-data-bootstrap to the bootstrap handler'
);
assert.ok(
  /OPTIONS[\s\S]*SYSTEM_DATA_BOOTSTRAP_API_PATH/.test(workerDummy)
    || workerDummy.split('SYSTEM_DATA_BOOTSTRAP_API_PATH').length >= 3,
  'entrypoint must include the bootstrap path in the CORS preflight whitelist'
);

// --- Frontend: transport + fallback -------------------------------------------

assert.ok(
  cloudApi.includes('function fetchColdLoginBundle') && cloudApi.includes('fetchColdLoginBundle,'),
  'CloudApi must define and export fetchColdLoginBundle'
);
assert.ok(
  /fetchColdLoginBundle[\s\S]*\/api\/system-data-bootstrap/.test(cloudApi),
  'fetchColdLoginBundle must target the bootstrap endpoint'
);
assert.ok(
  /fetchColdLoginBundle[\s\S]*getBackendMode\(\) !== 'api'[\s\S]*return null/.test(cloudApi),
  'fetchColdLoginBundle must return null (fall back) outside api backend mode'
);

// --- Frontend: warm-up + selection safety -------------------------------------

assert.ok(
  dataCloud.includes('async function warmColdLoginCaches') && dataCloud.includes('warmColdLoginCaches,'),
  'data-cloud must define and export warmColdLoginCaches'
);
// The restore-the-latest-exam contract: selection stays client-side and the
// prefetched shard is only used when the client's own pick matches.
assert.ok(
  /warmColdLoginCaches[\s\S]*compareWorkspaceExamRows[\s\S]*shardKey !== normalizeText\(selectedKey\)[\s\S]*return false/.test(dataCloud),
  'warmColdLoginCaches must re-run client-side selection and bail when the prefetched shard is not the selected exam'
);
assert.ok(
  /warmColdLoginCaches[\s\S]*workspacePayloadMatchesKey\(key, payload\)[\s\S]*return false/.test(dataCloud),
  'warmColdLoginCaches must keep the cross-cohort cache guard'
);
assert.ok(
  /warmColdLoginCaches[\s\S]*writeLocalCache\(key, hydrated/.test(dataCloud),
  'warmColdLoginCaches must seed the workspace local cache so DB.get(localOnly) hits'
);

// --- app.js: cold-path trigger + guarded fallback -----------------------------

assert.ok(
  /warmColdLoginCaches\(cohortKey\)/.test(appJs),
  'switchCohort must warm caches before the cold local-cache read'
);
assert.ok(
  /options\.requireCloudData === true[\s\S]*warmColdLoginCaches\(cohortKey\)/.test(appJs),
  'cold-login warm-up must only run for a cloud-required (login-selected) entry'
);
const warmIdx = appJs.indexOf('DB.warmColdLoginCaches(cohortKey)');
const dbGetIdx = appJs.indexOf("DB.get(cohortKey, { localOnly: true })");
assert.ok(warmIdx >= 0 && dbGetIdx >= 0 && warmIdx < dbGetIdx,
  'warm-up must run BEFORE the local-cache DB.get so the primed cache is read');
// The DB wrapper is a hand-written delegate object, not an auto-proxy — it must
// explicitly forward warmColdLoginCaches to the runtime, or the trigger silently
// no-ops (typeof DB.warmColdLoginCaches === 'undefined').
assert.ok(
  /warmColdLoginCaches:\s*async[\s\S]*requireDataCloudRuntime\(\)[\s\S]*warmColdLoginCaches/.test(appJs),
  'app.js DB wrapper must delegate warmColdLoginCaches to the data-cloud runtime'
);

console.log('cold-login bundle contract tests passed');
