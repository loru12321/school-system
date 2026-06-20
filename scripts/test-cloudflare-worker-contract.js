const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function count(source, pattern) {
  return (source.match(pattern) || []).length;
}

const packageJson = JSON.parse(read('package.json'));
const worker = read('src/worker-dummy.js');
const releaseDownloads = read('src/worker-release-downloads.mjs');
const gateway = read('src/worker-gateway-d1.js');
const helpers = read('src/worker-http-helpers.js');
const wrangler = JSON.parse(read('wrangler.jsonc'));
const scripts = packageJson.scripts || {};

const requiredWorkerTokens = [
  "url.pathname === '/api/health'",
  "url.pathname === '/api/edu-gateway'",
  "url.pathname === '/api/edu_gateway'",
  "url.pathname === SYSTEM_DATA_API_PATH",
  "url.pathname.startsWith('/sb/')",
  "url.pathname.startsWith('/downloads/')",
  'env.ASSETS.fetch(request)',
  'protectHtmlResponse(request, response)',
  'buildCorsHeaders(request, env)',
  'fetchWithTimeout(targetUrl, proxyInit, PROXY_TIMEOUT_MS)',
  'PROXY_TIMEOUT_MS = 15000',
  'HOP_BY_HOP_HEADERS.forEach((name) => nextHeaders.delete(name))',
  'request.method === \'OPTIONS\'',
  'protectAssetResponse(request, response)'
];

requiredWorkerTokens.forEach((token) => {
  assert.ok(worker.includes(token), `worker contract missing token: ${token}`);
});

assert.ok(worker.includes('Production Cloudflare Worker entrypoint'), 'worker entrypoint responsibility should be documented');
assert.ok(gateway.includes('not the Wrangler main entrypoint'), 'D1 gateway module responsibility should be documented');
assert.ok(gateway.includes('let nextSchool = normalizeText(payload.school ?? existing.school);'), 'account update must preserve/update bound school');
assert.ok(gateway.includes("if (nextRole === 'director' || nextRole === 'admin') nextClassName = '';"), 'director/admin account updates should not require a grade/class range');
assert.ok(gateway.includes("Director can only manage accounts in own school"), 'director account edits must remain school-scoped');
assert.ok(gateway.includes("error: 'Invalid username or password'"), 'managed D1 account passwords should not fall back to stale legacy credentials');
assert.ok(gateway.includes("if (remoteUser.role !== 'admin')"), 'legacy fallback must not recreate deleted non-admin accounts');
assert.ok(worker.includes("from './worker-http-helpers.js'"), 'worker should import shared HTTP helpers');
assert.ok(worker.includes("from './worker-release-downloads.mjs'"), 'worker should import the release download handler');
assert.ok(gateway.includes("from './worker-http-helpers.js'"), 'gateway should import shared HTTP helpers');
assert.ok(helpers.includes('DEFAULT_ALLOWED_CORS_ORIGINS'), 'shared helpers must keep explicit CORS allowlist usage');
assert.ok(helpers.includes('HOP_BY_HOP_HEADERS'), 'shared helpers must keep hop-by-hop header list');
assert.ok(helpers.includes('Access-Control-Max-Age'), 'shared helpers must keep CORS preflight max age');
assert.ok(helpers.includes("'https://schoolsystem.com.cn'"), 'root production origin must be allowed');
assert.ok(helpers.includes("'https://www.schoolsystem.com.cn'"), 'www production origin must be allowed');
assert.ok(helpers.includes("'https://school-system.hkakjiweu.workers.dev'"), 'workers.dev origin must remain allowed for diagnostics');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(worker), 'worker must not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(gateway), 'gateway must not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(helpers), 'shared helpers must not emit wildcard CORS');
assert.ok(worker.includes("return normalizeOrigin(env.LEGACY_GATEWAY_ORIGIN || env.SUPABASE_ORIGIN || DEFAULT_LEGACY_GATEWAY_ORIGIN);"), 'legacy origin resolution must prefer env values');
assert.ok(releaseDownloads.includes("if (!['GET', 'HEAD'].includes(request.method))"), 'release downloads must reject unsupported methods');
assert.ok(releaseDownloads.includes("return plainResponse(404, 'Not Found')"), 'release downloads must fail closed for unknown files');
assert.ok(releaseDownloads.includes("'Content-Disposition': `attachment; filename=\"${entry.filename}\"`"), 'release downloads must preserve the package filename');
assert.ok(releaseDownloads.includes("'X-Content-SHA256': entry.sha256"), 'release downloads must expose the verified SHA-256');
assert.ok(worker.includes("headers['Cache-Control'] = 'no-store';"), 'JSON API responses should be no-store');
assert.ok(worker.includes("headers['X-Content-Type-Options'] = 'nosniff';"), 'JSON API responses should set nosniff');
assert.ok(worker.includes("headers['X-School-System-Gateway'] = 'cloudflare-worker';"), 'JSON API responses should identify the gateway');
assert.ok(worker.includes("env.SUPABASE_REST_API_KEY"), 'Supabase REST key must be read from env');
assert.ok(worker.includes("request.headers.get('apikey')"), 'Supabase proxy may use request apikey fallback for compatibility');
assert.ok(worker.includes("Authorization: `Bearer ${apikey}`"), 'Supabase proxy must forward bearer auth');
assert.ok(worker.includes("targetUrl.searchParams.set('on_conflict', 'key')"), 'system_data writes must keep upsert conflict key');
assert.ok(worker.includes("Prefer: 'resolution=merge-duplicates,return=representation'"), 'system_data writes must request merge upserts');
assert.ok(worker.includes("return jsonResponse(405, { ok: false, error: 'SYSTEM_DATA_METHOD_NOT_ALLOWED' }, request);"), 'system data route must fail closed for unsupported methods');
assert.ok(worker.includes("return jsonResponse(404"), 'unsupported managed REST paths should return JSON 404');
assert.ok(worker.includes("return new Response('Not Found', { status: 404 });"), 'asset fallback should return 404 instead of crashing');
assert.ok(worker.includes('buildWorkerErrorBody(error, env)'), 'worker crash responses should use sanitized error bodies');
assert.ok(worker.includes('WORKER_DEBUG_ERRORS'), 'worker crash stack traces should require an explicit debug flag');
assert.ok(!worker.includes("stack: error instanceof Error ? error.stack : ''"), 'worker must not expose stack traces by default');
assert.ok(worker.includes("headers.set('Cache-Control', mergeCacheControl"), 'HTML responses should preserve and extend cache control');
assert.ok(worker.includes("'public', 'no-transform'"), 'HTML response protection should include no-transform');
assert.ok(worker.includes("return 'public, max-age=31536000, immutable';"), 'versioned static assets should get immutable caching');
assert.ok(worker.includes("return 'public, max-age=3600, stale-while-revalidate=86400';"), 'unversioned static assets should get short browser caching');
assert.ok(worker.includes("pathname.startsWith('/downloads/')"), 'hosted downloads should have an explicit cache policy');
assert.ok(worker.includes("pathname === '/sw.js'"), 'service worker script should stay revalidation-friendly');
assert.ok(worker.includes('buildWorkerErrorHeaders()'), 'worker crash responses should use hardened headers');
assert.ok(worker.includes("headers.set('Cache-Control', 'no-store');"), 'forwarded API responses should be no-store');
assert.ok(worker.includes("headers.set('X-Content-Type-Options', 'nosniff');"), 'forwarded API responses should set nosniff');
assert.ok(worker.includes("if (method === 'GET' || method === 'HEAD') return null;"), 'GET/HEAD proxy requests should not attach a body');
assert.ok(worker.includes("proxyInit.headers.set('x-forwarded-host', url.host);"), 'proxy requests should include forwarded host');
assert.ok(worker.includes("proxyInit.headers.set('x-forwarded-proto', url.protocol.replace(':', ''));"), 'proxy requests should include forwarded proto');
assert.ok(worker.includes("Math.min(Math.floor(raw), 1000)"), 'system_data read limit should be capped');
assert.ok(wrangler.vars && wrangler.vars.CLOUD_SYSTEM_DATA_MODE === 'supabase', 'production data mode should remain explicit');
assert.ok(wrangler.vars && /^https:\/\/[^/]+\.supabase\.co$/.test(wrangler.vars.SUPABASE_ORIGIN || ''), 'Supabase origin should be an origin URL only');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:cloudflare-worker-contract'), 'fast release check must include Cloudflare Worker contract guard');

console.log(JSON.stringify({
  ok: true,
  corsOrigins: count(worker, /https:\/\/[^'"]+/g),
  workerRoutes: [
    '/api/health',
    '/api/edu-gateway',
    '/api/system-data',
    '/sb/*',
    '/downloads/*',
    'ASSETS'
  ],
  proxyTimeoutMs: 15000
}, null, 2));
