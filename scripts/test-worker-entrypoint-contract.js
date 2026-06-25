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

function listRootWorkerConfigs() {
  return fs.readdirSync(root)
    .filter((name) => /^wrangler\.(jsonc|json|toml)$/.test(name) || /^wrangler\..+\.(jsonc|json|toml)$/.test(name))
    .sort();
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const wrangler = parseJsonc('wrangler.jsonc');
const worker = read('src/worker-dummy.js');
const releaseSurface = read('scripts/test-release-surface.js');
const maintenanceContract = read('scripts/test-maintenance-priority-contract.js');
const ciWorkflow = read('.github/workflows/ci.yml');
const releaseWorkflow = read('.github/workflows/release-apps.yml');
const rootConfigs = listRootWorkerConfigs();
const routePatterns = (wrangler.routes || []).map((route) => route.pattern).sort();
const d1Bindings = (wrangler.d1_databases || []).map((db) => db.binding).sort();

assert.deepStrictEqual(rootConfigs, ['wrangler.jsonc'], 'repository root should expose exactly one Wrangler config');
assert.strictEqual(wrangler.name, 'school-system', 'Wrangler Worker name should match the repository and product name');
assert.strictEqual(wrangler.main, 'src/worker-dummy.js', 'Wrangler main must point at the production Worker entrypoint');
assert.ok(exists(wrangler.main), 'Wrangler main Worker entrypoint must exist');
assert.ok(worker.includes('Production Cloudflare Worker entrypoint'), 'Worker entrypoint should document production ownership');
assert.ok(worker.includes('env.ASSETS.fetch(request)'), 'production Worker must serve Cloudflare Assets');
assert.ok(worker.includes("url.pathname === '/api/health'"), 'production Worker must own health checks');
assert.ok(worker.includes("url.pathname === '/api/edu-gateway'"), 'production Worker must own gateway routing');
assert.ok(worker.includes("url.pathname === SYSTEM_DATA_API_PATH"), 'production Worker must own system_data routing');
assert.strictEqual(wrangler.assets?.directory, './dist', 'Wrangler assets directory must remain the built dist folder');
assert.strictEqual(wrangler.assets?.binding, 'ASSETS', 'Wrangler assets binding must remain ASSETS');
assert.deepStrictEqual(routePatterns, ['schoolsystem.com.cn/*', 'www.schoolsystem.com.cn/*'], 'Wrangler routes should only target canonical production domains');
assert.ok(d1Bindings.includes('GATEWAY_DATA_DB'), 'Gateway D1 binding must be present for production auth/data routes');
assert.strictEqual(wrangler.vars?.CLOUD_SYSTEM_DATA_MODE, 'supabase', 'production system_data mode should remain explicit until D1 cutover is verified');
assert.ok(!('SUPABASE_ORIGIN' in (wrangler.vars || {})), 'Supabase origin must not be hardcoded in Wrangler vars');
assert.ok(!('SUPABASE_REST_API_KEY' in (wrangler.vars || {})), 'Supabase REST key must not be hardcoded in Wrangler vars');
assert.strictEqual(scripts['check:cloudflare'], 'npx wrangler deploy --dry-run', 'Cloudflare dry-run should use the canonical Wrangler config');
assert.ok(scripts['check:release-fast']?.includes('test:worker-entrypoint-contract'), 'fast release checks must guard the Worker entrypoint');
assert.ok(releaseSurface.includes("wrangler.main, 'src/worker-dummy.js'"), 'release surface should also guard the Worker entrypoint');
assert.ok(maintenanceContract.includes("wrangler.main, 'src/worker-dummy.js'"), 'maintenance contract should also guard the Worker entrypoint');
assert.ok(ciWorkflow.includes('npm run check:release-fast'), 'CI release guards should run fast release checks');
assert.ok(!ciWorkflow.includes('wrangler deploy --config'), 'CI should not deploy using an alternate Wrangler config');
assert.ok(!releaseWorkflow.includes('wrangler deploy --config'), 'release workflow should not deploy using an alternate Wrangler config');

console.log(JSON.stringify({
  ok: true,
  worker: {
    name: wrangler.name,
    main: wrangler.main,
    assets: wrangler.assets,
    routes: routePatterns,
    d1Bindings
  }
}, null, 2));
