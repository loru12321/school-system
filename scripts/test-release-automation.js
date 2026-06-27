const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function checkSyntax(relativePath) {
  execFileSync(process.execPath, ['--check', relativePath], {
    cwd: root,
    stdio: 'pipe'
  });
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const ciWorkflow = read('.github/workflows/ci.yml');
const deployWorkflow = read('.github/workflows/deploy-cloudflare.yml');
const cleanupWorkflowPath = path.join(root, '.github/workflows/cleanup-beta-releases.yml');
const cleanupWorkflow = fs.readFileSync(cleanupWorkflowPath, 'utf8');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');

checkSyntax('scripts/record-performance-trend.mjs');
checkSyntax('scripts/check-performance-thresholds.mjs');

assert.ok(!exists('.github/workflows/build-apps-beta.yml'), 'beta native app workflow should be removed');
assert.ok(!exists('.github/workflows/release-apps.yml'), 'native app release workflow should be removed');
assert.ok(!exists('scripts/prepare-github-release-assets.mjs'), 'GitHub release asset preparer should be removed');
assert.ok(!exists('scripts/build-release-manifest.mjs'), 'release manifest builder should be removed');
assert.ok(!exists('scripts/prepare-worker-release-chunks.mjs'), 'Worker release chunk builder should be removed');

assert.ok(!scripts['release:prepare-assets'], 'release asset preparation script should be removed');
assert.ok(!scripts['release:prepare-worker-assets'], 'Worker release chunk script should be removed');
assert.ok(!scripts['desktop:build'], 'desktop installer build script should be removed');
assert.ok(!scripts['test:release-manifest'], 'release manifest test script should be removed');
assert.ok(!scripts['test:windows-installer-contract'], 'Windows installer test script should be removed');
assert.ok(!scripts['test:beta-release-workflow'], 'beta app workflow test script should be removed');
assert.ok(!scripts['test:worker-release-chunks'], 'Worker release chunk test script should be removed');
assert.ok(!scripts['test:worker-release-downloads'], 'Worker release download test script should be removed');
assert.strictEqual(scripts['performance:record'], 'node scripts/record-performance-trend.mjs', 'performance trend script should stay stable');
assert.strictEqual(scripts['test:performance-thresholds'], 'node scripts/check-performance-thresholds.mjs', 'performance threshold script should stay stable');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-automation'), 'fast release check should include release automation checks');
assert.strictEqual(scripts['deploy:cloudflare:verified'], 'npm run build && npm run check:release-fast && npx wrangler deploy && npm run smoke:prod-minimal', 'verified Cloudflare deploy script should build, guard, deploy, and smoke production');

assert.ok((ciWorkflow.match(/python -m pip install fonttools brotli/g) || []).length >= 3, 'CI jobs that build or validate should install font subsetting tools');
assert.ok(ciWorkflow.includes('p0-quick:'), 'CI should expose a dedicated P0 quick gate before longer jobs');
assert.ok(ciWorkflow.includes('npm run check:p0'), 'CI P0 quick gate should run check:p0 directly');
assert.ok(ciWorkflow.includes('needs: p0-quick'), 'release guards should wait for the P0 quick gate');
assert.ok(deployWorkflow.includes('workflow_dispatch:'), 'Cloudflare deployment should be manually triggerable');
assert.ok(deployWorkflow.includes('push:'), 'Cloudflare deployment should run automatically after main pushes');
assert.ok(deployWorkflow.includes('main'), 'Cloudflare deployment push trigger should target main');
assert.ok(deployWorkflow.includes("github.actor != 'github-actions[bot]'"), 'Cloudflare deployment should not loop on bot-authored maintenance commits');
assert.ok(deployWorkflow.includes('docs/performance/**'), 'Cloudflare deployment should ignore performance trend doc-only commits');
assert.ok(deployWorkflow.includes('npm run build'), 'Cloudflare deployment should build dist before deploy');
assert.ok(deployWorkflow.includes('python -m pip install fonttools brotli'), 'Cloudflare deployment should install font subsetting tools before build');
assert.ok(deployWorkflow.includes('npm run check:release-fast'), 'Cloudflare deployment should run fast release guards before deploy');
assert.ok(deployWorkflow.includes('npx wrangler deploy'), 'Cloudflare deployment should use the canonical Wrangler deploy command');
assert.ok(deployWorkflow.includes('CLOUDFLARE_API_TOKEN'), 'Cloudflare deployment should use a GitHub secret token');
assert.ok(deployWorkflow.includes('npm run smoke:prod-minimal'), 'Cloudflare deployment should run production smoke after deploy');
assert.ok(deployWorkflow.indexOf('npx wrangler deploy') < deployWorkflow.indexOf('npm run smoke:prod-minimal'), 'production smoke should run after Wrangler deploy');
assert.ok(cleanupWorkflow.includes('schedule:'), 'beta cleanup should run on a schedule');
assert.ok(cleanupWorkflow.includes('workflow_dispatch:'), 'beta cleanup should support manual execution');
assert.ok(cleanupWorkflow.includes('90 days ago'), 'beta retention should be exactly 90 days');
assert.ok(cleanupWorkflow.includes('.prerelease == true'), 'cleanup must select prereleases only');
assert.ok(cleanupWorkflow.includes('startswith("beta-")'), 'cleanup must select beta tags only');
assert.ok(performanceWorkflow.includes('npm run performance:record'), 'performance workflow should record trend output');
assert.ok(performanceWorkflow.includes('npm run test:performance-thresholds'), 'performance workflow should fail on threshold regressions after recording trends');
assert.ok(performanceWorkflow.includes('python -m pip install fonttools brotli'), 'performance workflow should install font subsetting tools before build');
assert.ok(performanceWorkflow.includes('npm run check:release-fast'), 'performance workflow should run fast guards before smoke');
assert.ok(performanceWorkflow.includes('cancel-in-progress: true'), 'performance workflow should cancel stale trend runs');
assert.ok(performanceWorkflow.includes("github.actor != 'github-actions[bot]'"), 'performance workflow should not react to bot-authored trend commits');

console.log(JSON.stringify({
  ok: true,
  nativeReleaseAutomationRemoved: true,
  performanceWorkflow: true
}, null, 2));
