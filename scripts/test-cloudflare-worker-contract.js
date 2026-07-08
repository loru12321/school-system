const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function parseJsonc(relativePath) {
  const content = read(relativePath).replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  return JSON.parse(content);
}

const packageJson = JSON.parse(read('package.json'));
const worker = read('src/worker-dummy.js');
const workerSystemData = read('src/worker-system-data.js');
const workerAssetProtection = read('src/worker-asset-protection.js');
const helpers = read('src/worker-http-helpers.js');
const workerContractSource = [worker, workerSystemData, workerAssetProtection, helpers].join('\n');
const cloudApiRuntime = read('public/assets/js/cloud-api-runtime.js');
const cloudConnectionRuntime = read('public/assets/js/cloud-connection-runtime.js');
const cloudWorkspaceRuntime = read('public/assets/js/cloud-workspace-runtime.js');
const dataCloudRuntime = read('public/assets/js/data-cloud-runtime.js');
const cloudRuntime = read('public/assets/js/cloud.js');
const gateway = read('src/worker-gateway-d1.js');
const gatewayAuth = read('src/worker-auth.js');
const gatewayAccounts = read('src/worker-accounts.js');
const gatewayVersions = read('src/worker-versions.js');
const gatewayDataQuality = read('src/worker-data-quality.js');
const gatewayAssessment = read('src/worker-assessment.js');
const gatewayCrypto = read('src/worker-crypto.js');
const gatewayContractSource = [
  gateway,
  gatewayAuth,
  gatewayAccounts,
  gatewayVersions,
  gatewayDataQuality,
  gatewayAssessment,
  gatewayCrypto
].join('\n');
const supabaseGateway = read('supabase/functions/edu-gateway/index.ts');
const supabaseManagementSchema = read('supabase/sql/001_management_tables.sql');
const gatewayD1Schema = [
  read('cloudflare/d1/002_gateway_data.sql'),
  read('cloudflare/d1/003_gateway_accounts.sql'),
  read('cloudflare/d1/007_snapshot_versions_add_version_columns.sql')
].join('\n');
const systemDataCutoverVerifier = read('scripts/verify-system-data-cloudflare-cutover.js');
const supabaseMigrator = read('scripts/migrate-supabase-project-data.mjs');
const wrangler = parseJsonc('wrangler.jsonc');
const scripts = packageJson.scripts || {};

const requiredWorkerTokens = [
  "url.pathname === '/api/health'",
  "url.pathname === '/api/edu-gateway'",
  "url.pathname === '/api/edu_gateway'",
  "url.pathname === '/api/gateway'",
  "url.pathname === SYSTEM_DATA_API_PATH",
  "url.pathname.startsWith('/sb/')",
  'env.ASSETS.fetch(request)',
  'protectHtmlResponse(request, response)',
  'buildCorsHeaders(request, env)',
  'fetchWithTimeout(targetUrl, proxyInit, PROXY_TIMEOUT_MS)',
  'PROXY_TIMEOUT_MS = 15000',
  'HOP_BY_HOP_HEADERS.forEach((name) => nextHeaders.delete(name))',
  "request.method === 'OPTIONS'",
  'protectAssetResponse(request, response)'
];

requiredWorkerTokens.forEach((token) => {
  assert.ok(workerContractSource.includes(token), `worker contract missing token: ${token}`);
});

assert.ok(!exists('src/worker-release-downloads.mjs'), 'release download proxy should be removed');
assert.ok(!workerContractSource.includes("worker-release-downloads"), 'worker must not import release download handler');
assert.ok(!workerContractSource.includes("url.pathname.startsWith('/downloads/')"), 'worker must not route hosted installers');
assert.ok(!read('public/_headers').includes('/downloads/*'), 'static headers must not expose hosted installer cache policy');

assert.ok(worker.includes('Production Cloudflare Worker entrypoint'), 'worker entrypoint responsibility should be documented');
assert.ok(gateway.includes('not the Wrangler main entrypoint'), 'D1 gateway module responsibility should be documented');
assert.ok(gatewayContractSource.includes('let nextSchool = normalizeText(payload.school ?? existing.school);'), 'account update must preserve/update bound school');
assert.ok(gatewayContractSource.includes('const nextRoles = payloadRoles.length'), 'account update must preserve existing role memberships unless roles are explicitly provided');
assert.ok(gatewayContractSource.includes('const ensuredLoginSessionDbs = new WeakSet();'), 'login session table setup should be cached per Worker isolate');
assert.ok(gatewayContractSource.includes('ensuredLoginSessionDbs.has(db)'), 'login session table setup should skip repeated D1 schema calls');
assert.ok(gatewayContractSource.includes('const requestedLimit = Number(payload.limit ?? 500);'), 'alias list should use a bounded default limit');
assert.ok(gatewayContractSource.includes('Math.min(Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 500, 500)'), 'alias list should clamp caller-provided limits');
assert.ok(gatewayContractSource.includes('LIMIT ?'), 'alias list query should include a D1 row limit');
assert.ok(gatewayContractSource.includes("if (nextRole === 'director' || nextRole === 'admin') nextClassName = '';"), 'director/admin account updates should not require a grade/class range');
assert.ok(gatewayContractSource.includes("Director can only manage accounts in own school"), 'director account edits must remain school-scoped');
assert.ok(gatewayContractSource.includes("error: 'Invalid username or password'"), 'managed D1 account passwords should not fall back to stale legacy credentials');
assert.ok(!gatewayContractSource.includes('proxyGatewayActionToLegacyGateway'), 'D1 auth should not proxy login/session/change-password to the legacy gateway');
assert.ok(worker.includes("error: 'CLOUDFLARE_GATEWAY_ACTION_NOT_SUPPORTED'"), 'unsupported gateway actions should fail closed instead of proxying to legacy Edge Functions');
assert.ok(worker.includes("from './worker-http-helpers.js'"), 'worker should import shared HTTP helpers');
assert.ok(gateway.includes("from './worker-http-helpers.js'"), 'gateway should import shared HTTP helpers');
assert.ok(helpers.includes('DEFAULT_ALLOWED_CORS_ORIGINS'), 'shared helpers must keep explicit CORS allowlist usage');
assert.ok(helpers.includes('DEFAULT_ALLOWED_CORS_HEADERS'), 'shared helpers must use a fixed CORS request-header allowlist');
assert.ok(!helpers.includes("request.headers.get('Access-Control-Request-Headers')"), 'shared helpers must not reflect arbitrary request headers in CORS responses');
assert.ok(helpers.includes("if (normalizedOrigin === 'null') return '';"), 'shared helpers must not reflect null Origin');
assert.ok(helpers.includes('HOP_BY_HOP_HEADERS'), 'shared helpers must keep hop-by-hop header list');
assert.ok(helpers.includes("'https://schoolsystem.com.cn'"), 'root production origin must be allowed');
assert.ok(helpers.includes("'https://www.schoolsystem.com.cn'"), 'www production origin must be allowed');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(workerContractSource), 'worker must not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(gatewayContractSource), 'gateway must not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(helpers), 'shared helpers must not emit wildcard CORS');
assert.ok(workerContractSource.includes("headers['Cache-Control'] = cacheControl;"), 'JSON API responses should set Cache-Control centrally');
assert.ok(workerContractSource.includes("headers['X-Content-Type-Options'] = 'nosniff';"), 'JSON API responses should set nosniff');
assert.ok(workerContractSource.includes("headers['X-School-System-Gateway'] = 'cloudflare-worker';"), 'JSON API responses should identify the gateway');
assert.ok(!workerContractSource.includes("headers['Content-Encoding'] = 'gzip';"), 'worker must not manually gzip JSON API responses because it can break response.text() decoding');
assert.ok(!workerContractSource.includes("pipeThrough(new CompressionStream('gzip'))"), 'worker should leave JSON transport compression to Cloudflare');
assert.ok(workerContractSource.includes("const DEFAULT_LEGACY_GATEWAY_ORIGIN = '';"), 'Worker must not hardcode a default Supabase project origin');
assert.ok(workerContractSource.includes("!hasSystemDataStorage(env) && hasSupabaseRestOrigin(env)"), 'system_data should only fall back to Supabase when an origin is explicitly configured');
assert.ok(workerContractSource.includes("!hasGatewayDataStorage(env) && hasSupabaseRestOrigin(env)"), 'managed REST should only fall back to Supabase when an origin is explicitly configured');
assert.ok(workerContractSource.includes("env.SUPABASE_REST_API_KEY"), 'Supabase REST key must be read from env');
assert.ok(!workerSystemData.includes("request.headers.get('apikey')"), 'Supabase REST proxy must not trust browser-provided apikey headers');
assert.ok(workerSystemData.includes("import { resolveSession, hasAnyRole, isAdmin } from './worker-auth.js';"), 'system_data auth must reuse gateway session and role helpers');
assert.ok(workerSystemData.includes('const auth = await requireSystemDataSession(request, env);'), 'system_data reads and writes must require an app session before backend dispatch');
assert.ok(workerSystemData.includes("hasAnyRole(session, ['admin', 'director', 'grade_director'])"), 'system_data writes should preserve existing management-role writers');
assert.ok(workerSystemData.includes("const PROTECTED_REST_PATHS = new Set"), 'managed REST write paths should be explicitly protected');
assert.ok(workerSystemData.includes("'POST', 'PUT', 'PATCH', 'DELETE'"), 'protected REST write methods should require a session');
assert.ok(workerSystemData.includes('requireRestWriteSession(request, env)'), 'protected REST writes should enforce session validation before mutation');
assert.ok(workerContractSource.includes("Authorization: `Bearer ${apikey}`"), 'Supabase proxy must forward bearer auth');
assert.ok(workerContractSource.includes("return jsonResponse(405, { ok: false, error: 'SYSTEM_DATA_METHOD_NOT_ALLOWED' }, request);"), 'system data route must fail closed for unsupported methods');
assert.ok(worker.includes("const ENTRANCE_AUDIO_MANIFEST_API_PATH = '/api/entrance-audio-manifest';"), 'file runtime should have a Worker-served entrance audio manifest route');
assert.ok(worker.includes("return new Response('Not Found', { status: 404 });"), 'asset fallback should return 404 instead of crashing');
assert.ok(worker.includes('buildWorkerErrorBody(error, env)'), 'worker crash responses should use sanitized error bodies');
assert.ok(workerContractSource.includes('WORKER_DEBUG_ERRORS'), 'worker crash stack traces should require an explicit debug flag');
assert.ok(workerContractSource.includes('function getHtmlShellCacheControl()'), 'HTML shell cache policy should be centralized');
assert.ok(workerContractSource.includes("return 'no-store, max-age=0, must-revalidate, no-transform';"), 'HTML responses should bypass CDN and browser storage');
assert.ok(workerContractSource.includes("pathname.startsWith('/assets/audio/')"), 'hosted entrance audio should expose matching CORS for file:// lt.html');
assert.ok(workerContractSource.includes("return 'public, max-age=31536000, immutable';"), 'versioned static assets should get immutable caching');
assert.ok(workerContractSource.includes("return 'public, max-age=3600, stale-while-revalidate=86400';"), 'unversioned static assets should get short browser caching');
assert.ok(workerContractSource.includes("pathname === '/sw.js'"), 'service worker script should stay revalidation-friendly');
assert.ok(workerContractSource.includes('buildWorkerErrorHeaders()'), 'worker crash responses should use hardened headers');
assert.ok(workerContractSource.includes("if (method === 'GET' || method === 'HEAD') return null;"), 'GET/HEAD proxy requests should not attach a body');
assert.ok(workerContractSource.includes("Math.min(Math.floor(raw), 1000)"), 'system_data read limit should be capped');
assert.ok(workerContractSource.includes("'LIMIT ? OFFSET ?'"), 'system_data reads should push pagination into D1 instead of slicing in memory');
assert.ok(workerContractSource.includes("function buildSystemDataKeyFilterClause(filter)"), 'system_data reads should optimize compatible key filters before querying D1');
assert.ok(workerContractSource.includes("value.match(/^(\\d{4})%$/)"), 'cohort exam key-prefix reads should be recognized without scanning generic keys');
assert.ok(workerContractSource.includes("'cohort_id = ?'") && workerContractSource.includes("\"kind = 'exam'\""), 'cohort exam reads should use structured D1 metadata filters without an OR key scan');
assert.ok(workerContractSource.includes("value.match(/^TEACHERS_(\\d{4})%$/i)") && workerContractSource.includes("'key_prefix = ?'"), 'teacher cohort reads should use structured D1 metadata filters');
assert.ok(workerContractSource.includes("/^cohort::\\d{4}::exam::/i.test(text)") && workerContractSource.includes("keyPrefix = 'cohort_exam';"), 'split exam shard keys should be classified as exam rows instead of workspace rows');
assert.ok(workerContractSource.includes('function appendSystemDataMetadataFilter'), 'system_data reads should accept explicit metadata filters');
assert.ok(workerContractSource.includes("url, 'kind', 'kind'") && workerContractSource.includes("url, 'cohort_id', 'cohort_id'"), 'Worker should map explicit kind/cohort_id query params into D1 filters');
assert.ok(cloudApiRuntime.includes("url.searchParams.set('kind', `eq.${kind}`)") && cloudApiRuntime.includes("url.searchParams.set('cohort_id', `eq.${cohortId}`)"), 'CloudApi should forward metadata filters to the Worker API');
assert.ok(cloudApiRuntime.includes("url.searchParams.set('cache_version', cacheVersion)"), 'CloudApi should forward version tokens for safe content edge caching');
assert.ok(cloudConnectionRuntime.includes("if (options.kind) query = query.eq('kind', options.kind);") && cloudConnectionRuntime.includes("if (options.cohortId) query = query.eq('cohort_id', options.cohortId);"), 'direct Supabase fallback should support metadata filters');
assert.ok(cloudWorkspaceRuntime.includes("kind: 'exam',\n                cohortId: cid"), 'cohort workspace restore should fetch exam metadata through indexed kind/cohort filters');
assert.ok(cloudWorkspaceRuntime.includes("cacheVersion: remoteUpdatedAt"), 'workspace content reads should pass updated_at as a safe cache version');
assert.ok(cloudWorkspaceRuntime.includes('async function fetchVersionedExamContentRows(keysToFetch, candidateRows, options = {})')
  && cloudWorkspaceRuntime.includes('keyEq: key,')
  && cloudWorkspaceRuntime.includes('maybeSingle: true,')
  && cloudWorkspaceRuntime.includes('cacheVersion: candidate.updated_at')
  && cloudWorkspaceRuntime.includes('const contentRows = await fetchVersionedExamContentRows(keysToFetch, candidates, { latestOnly, maxFetch });'),
  'latest cohort exam restores should use exact-key versioned content reads so Cloudflare edge cache can serve large exam payloads');
assert.ok(dataCloudRuntime.includes("kind: 'exam',\n            cohortId,"), 'data cloud split fallback should fetch exam shards through indexed kind/cohort filters');
assert.ok(dataCloudRuntime.includes("cacheVersion: remoteUpdatedAt"), 'data cloud split reads should pass updated_at as a safe cache version');
assert.ok(cloudRuntime.includes("kind: 'exam',\n            cohortId") && cloudRuntime.includes("kind: 'exam',\n                        cohortId"), 'cloud history/supplement fallback should fetch exam rows through indexed kind/cohort filters');
assert.ok(workerContractSource.includes('function isSystemDataEdgeCacheEligible(request, url)'), 'system_data edge cache eligibility should be centralized and fail closed');
assert.ok(workerContractSource.includes('function getSystemDataEdgeCacheKey(request, url)'), 'system_data edge cache key should include request representation details');
assert.ok(workerContractSource.includes("cacheUrl.searchParams.set('__accept', String(request.headers.get('accept') || 'application/json'));"), 'system_data edge cache key should separate maybeSingle object responses from array responses');
assert.ok(workerContractSource.includes("searchParams.has('select')") && workerContractSource.includes("(searchParams.has('key') || searchParams.has('limit'))"), 'system_data edge cache should only store bounded explicit readonly selects');
assert.ok(workerContractSource.includes("searchParams.get('cache_version') || searchParams.get('v')"), 'system_data content edge cache should require an explicit payload version');
assert.ok(workerContractSource.includes("return !!version && /^eq\\./i.test(normalizeText(searchParams.get('key')))"), 'versioned content cache should only allow exact-key reads');
assert.ok(workerContractSource.includes("const cacheControl = selectSet.has('content') && !versionedContent ? 'no-store' : SYSTEM_DATA_READ_CACHE_CONTROL;"), 'unversioned content reads should still bypass shared edge caches');
assert.ok(workerContractSource.includes('const cache = globalThis.caches && globalThis.caches.default;'), 'system_data reads should use Cloudflare Cache API when available');
assert.ok(workerContractSource.includes("headers.set('X-School-System-Cache', cacheStatus);"), 'system_data cache responses should expose hit/miss status for diagnosis');
assert.ok(/if \(isSystemDataHybridMode\(env\)\) \{[\s\S]*method === 'GET'[\s\S]*handleCachedSystemDataRead\(request, env, url\)/.test(workerContractSource), 'hybrid system_data GET reads should use the same edge cache path as D1 primary reads');
const cloudSystemDataRestoreIndexes = fs.readFileSync(path.join(root, 'cloudflare/d1/006_cloud_system_data_restore_indexes.sql'), 'utf8');
assert.ok(cloudSystemDataRestoreIndexes.includes('idx_cloud_system_data_cohort_kind_updated'), 'cloud restore should have a cohort/kind/updated_at composite index');
assert.ok(cloudSystemDataRestoreIndexes.includes('idx_cloud_system_data_prefix_cohort_updated'), 'teacher cloud restore should have a key_prefix/cohort/updated_at composite index');
assert.ok(workerContractSource.includes('const [d1Response, supabaseResponse] = await Promise.all(['), 'hybrid system_data writes should dual-write D1 and Supabase concurrently');
assert.ok(workerContractSource.includes("cloudSystemDataBackend === 'hybrid'") && workerContractSource.includes("hasSystemDataStorage(env) && hasSupabaseRestOrigin(env)"), 'health should require both D1 and Supabase readiness for hybrid mode');
assert.ok(wrangler.vars && wrangler.vars.CLOUD_SYSTEM_DATA_MODE === 'primary', 'production data mode should use D1 primary storage');
assert.ok((wrangler.d1_databases || []).some((db) => db.binding === 'CLOUD_SYSTEM_DATA_DB'), 'system_data D1 binding should be configured for primary storage');
assert.ok(!wrangler.vars.SUPABASE_ORIGIN, 'Supabase origin must not be hardcoded in wrangler config');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:cloudflare-worker-contract'), 'fast release check must include Cloudflare Worker contract guard');
assert.ok(scripts['verify:system-data:cloudflare-cutover'] === 'node scripts/verify-system-data-cloudflare-cutover.js', 'system_data cutover verifier should be runnable from npm scripts');
assert.ok(systemDataCutoverVerifier.includes("DEFAULT_EXPECTED_BACKEND = 'hybrid,d1'"), 'system_data cutover verifier must reject same-backend Supabase comparisons by default');
assert.ok(supabaseMigrator.includes("const DEFAULT_TARGET_PROJECT_REF = '';"), 'Supabase project migration must require an explicit target project ref');
assert.ok(gatewayD1Schema.includes('idx_system_logs_operator_created'), 'system_logs should index operator history lookups by created_at');
assert.ok(gatewayD1Schema.includes('idx_rectify_tasks_project_cohort_status_school_created'), 'rectify tasks should index dashboard list filters');
assert.ok(gatewayD1Schema.includes('CREATE TABLE IF NOT EXISTS login_sessions'), 'gateway schema should persist login device/session records');
assert.ok(gatewayD1Schema.includes('idx_login_sessions_username_login'), 'login session records should index self history lookups');
assert.ok(gatewayD1Schema.includes('uq_snapshot_versions_single_stable'), 'D1 schema should enforce one stable snapshot version per project/cohort');
assert.ok(gatewayContractSource.includes('const wantsStable = Boolean(payload.is_stable);')
  && gatewayContractSource.includes('await db.batch([clearStmt, insertStmt]);')
  && gatewayContractSource.includes('await db.batch([clearStmt, setStmt]);'),
  'D1 version create/update should clear other stable rows and set the target in one batch');
assert.ok(supabaseManagementSchema.includes('uq_snapshot_versions_single_stable')
  && supabaseManagementSchema.includes('version integer not null default 0')
  && supabaseManagementSchema.includes('trg_snapshot_versions_updated_at'),
  'Supabase management schema should include snapshot version columns, stable uniqueness, and updated_at trigger');
assert.ok(supabaseGateway.includes('const wantsStable = Boolean(payload.is_stable ?? false);')
  && supabaseGateway.includes('.update({ is_stable: true, updated_at: nowIso, version:')
  && supabaseGateway.includes('.eq("is_stable", true)'),
  'Supabase version create/update should handle stable marking through the same guarded path');
assert.ok(gatewayContractSource.includes("case 'account.login_sessions'"), 'gateway should expose scoped login session lookup action');
assert.ok(gatewayContractSource.includes('recordLoginSession(db, request, session'), 'gateway login should record device/session metadata');
assert.ok(worker.includes('handleGatewayRequest(request, env, ctx)'), 'Worker should pass execution context into the D1 gateway');
assert.ok(gatewayContractSource.includes('function scheduleLoginAuditWrite(ctx, task)'), 'gateway login audit writes should be schedulable in the background');
assert.ok(gatewayContractSource.includes('ctx.waitUntil(task.catch'), 'gateway should use waitUntil for successful login audit writes');
assert.ok(gatewayContractSource.includes('return performGatewayLogin(request, env, body, ctx);'), 'login action should receive execution context for non-blocking audit writes');
assert.ok(gatewayContractSource.includes('Only admin can view all login sessions'), 'all-account login session lookup should be admin-only');
assert.ok(gatewayContractSource.includes("case 'assessment.sync_scores'"), 'gateway should expose assessment score sync through authenticated edu-gateway');
assert.ok(gatewayContractSource.includes("case 'assessment.get_sync_settings'"), 'gateway should expose assessment sync settings through authenticated edu-gateway');
assert.ok(gatewayContractSource.includes('assessment_sync_settings'), 'gateway should read assessment sync settings from the assessment Supabase project');
assert.ok(gatewayContractSource.includes('ASSESSMENT_SUPABASE_SERVICE_ROLE_KEY'), 'assessment sync service role key must be read from Worker env only');
assert.ok(gatewayContractSource.includes("change_tag: 'system_sync'"), 'assessment sync writes should mark rows as system_sync');
assert.ok(gatewayContractSource.includes('dry_run: dryRun') && gatewayContractSource.includes('rows.length && !dryRun'), 'assessment sync should support a no-write dry-run match check');
assert.ok(gatewayContractSource.includes('findAssessmentTeacherMatch') && gatewayContractSource.includes('目标考核系统教师匹配不唯一'), 'assessment sync should skip ambiguous teacher matches instead of writing to a guessed account');
assert.ok(gatewayContractSource.includes('teacher_workload') === false, 'assessment sync must not write workload scores without a system data source');

console.log(JSON.stringify({
  ok: true,
  installerDownloadsRemoved: true,
  workerRoutes: [
    '/api/health',
    '/api/edu-gateway',
    '/api/gateway',
    '/api/system-data',
    '/sb/*',
    'ASSETS'
  ],
  proxyTimeoutMs: 15000
}, null, 2));
