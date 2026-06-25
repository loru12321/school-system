const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
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
const releaseWorkflow = read('.github/workflows/release-apps.yml');
const deployWorkflow = read('.github/workflows/deploy-cloudflare.yml');
const cleanupWorkflowPath = path.join(root, '.github/workflows/cleanup-beta-releases.yml');
assert.ok(fs.existsSync(cleanupWorkflowPath), 'beta cleanup workflow should exist');
const cleanupWorkflow = fs.readFileSync(cleanupWorkflowPath, 'utf8');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');
const betaWorkflow = read('.github/workflows/build-apps-beta.yml');

checkSyntax('scripts/prepare-github-release-assets.mjs');
checkSyntax('scripts/record-performance-trend.mjs');

assert.strictEqual(scripts['release:prepare-assets'], 'node scripts/prepare-github-release-assets.mjs', 'release asset preparation script should stay stable');
assert.strictEqual(scripts['performance:record'], 'node scripts/record-performance-trend.mjs', 'performance trend script should stay stable');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-automation'), 'fast release check should include release automation checks');
assert.ok(!scripts['check:release-fast'].includes('test:app-download-runtime-hygiene'), 'fast release check should not guard the removed app download runtime');
assert.strictEqual(scripts['deploy:cloudflare:verified'], 'npm run build && npm run check:release-fast && npx wrangler deploy && npm run smoke:prod-minimal', 'verified Cloudflare deploy script should build, guard, deploy, and smoke production');

assert.ok(releaseWorkflow.includes('npm run build'), 'release workflow should build dist before packaging app assets');
assert.ok(releaseWorkflow.includes('npm run test:release-surface'), 'release workflow should guard release surface');
assert.ok(releaseWorkflow.includes('npm run test:build-size-budget'), 'release workflow should guard hosted package budgets');
assert.ok(releaseWorkflow.includes('npm run release:prepare-assets'), 'release workflow should prepare immutable release assets');
assert.ok(releaseWorkflow.includes('gh release upload'), 'release workflow should update existing releases');
assert.ok(releaseWorkflow.includes('gh release create'), 'release workflow should create missing releases');
assert.ok(releaseWorkflow.includes('concurrency:'), 'release workflow should serialize release jobs');
assert.ok(releaseWorkflow.includes('runs-on: windows-latest'), 'stable release should build Windows');
assert.ok(releaseWorkflow.includes('runs-on: ubuntu-latest'), 'stable release should build Android and publish');
assert.ok(releaseWorkflow.includes('runs-on: macos-latest'), 'stable release should validate iOS');
assert.ok((releaseWorkflow.match(/node scripts\/resolve-app-version\.mjs/g) || []).length >= 3, 'stable platform jobs should resolve versions');
assert.ok(releaseWorkflow.includes('assembleRelease'), 'stable release should build an Android APK');
assert.ok(releaseWorkflow.includes('CODE_SIGNING_ALLOWED=NO'), 'stable iOS validation should not require Apple credentials');
assert.ok(!releaseWorkflow.includes('--prerelease'), 'stable releases must never be marked prerelease');
assert.ok((ciWorkflow.match(/python -m pip install fonttools brotli/g) || []).length >= 3, 'CI jobs that build or validate should install font subsetting tools');
assert.ok(deployWorkflow.includes('workflow_dispatch:'), 'Cloudflare deployment should be manually triggerable');
assert.ok(deployWorkflow.includes('push:'), 'Cloudflare deployment should run automatically after main pushes');
assert.ok(deployWorkflow.includes('branches:'), 'Cloudflare deployment push trigger should be branch scoped');
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
assert.ok(cleanupWorkflow.includes('gh api --paginate'), 'cleanup should inspect every releases page');
assert.ok(cleanupWorkflow.includes('releases/$release_id'), 'cleanup should delete only selected release IDs');
assert.ok(performanceWorkflow.includes('npm run performance:record'), 'performance workflow should record trend output');
assert.ok(performanceWorkflow.includes('python -m pip install fonttools brotli'), 'performance workflow should install font subsetting tools before build');
assert.ok(performanceWorkflow.includes('npm run check:release-fast'), 'performance workflow should run fast guards before smoke');
assert.ok(performanceWorkflow.includes('cancel-in-progress: true'), 'performance workflow should cancel stale trend runs');
assert.ok(performanceWorkflow.includes("github.actor != 'github-actions[bot]'"), 'performance workflow should not react to bot-authored trend commits');
assert.ok(performanceWorkflow.includes('[skip performance]'), 'performance workflow should support an explicit skip marker');
assert.ok(betaWorkflow.includes('python -m pip install fonttools brotli'), 'beta app workflow should install font subsetting tools before mobile sync builds');
assert.ok(releaseWorkflow.includes('python -m pip install fonttools brotli'), 'stable release workflow should install font subsetting tools before web builds');

console.log(JSON.stringify({
  ok: true,
  releaseWorkflow: true,
  performanceWorkflow: true
}, null, 2));
