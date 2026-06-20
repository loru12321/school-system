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
const releaseWorkflow = read('.github/workflows/release-apps.yml');
const cleanupWorkflowPath = path.join(root, '.github/workflows/cleanup-beta-releases.yml');
assert.ok(fs.existsSync(cleanupWorkflowPath), 'beta cleanup workflow should exist');
const cleanupWorkflow = fs.readFileSync(cleanupWorkflowPath, 'utf8');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');

checkSyntax('scripts/prepare-github-release-assets.mjs');
checkSyntax('scripts/record-performance-trend.mjs');

assert.strictEqual(scripts['release:prepare-assets'], 'node scripts/prepare-github-release-assets.mjs', 'release asset preparation script should stay stable');
assert.strictEqual(scripts['performance:record'], 'node scripts/record-performance-trend.mjs', 'performance trend script should stay stable');
assert.strictEqual(scripts['test:app-download-clicks'], 'node scripts/test-app-download-clicks.js', 'download click smoke test should be exposed');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-automation'), 'fast release check should include release automation checks');

assert.ok(releaseWorkflow.includes('npm run build'), 'release workflow should build dist before packaging app assets');
assert.ok(releaseWorkflow.includes('npm run test:app-download-runtime-hygiene'), 'release workflow should guard download runtime hygiene');
assert.ok(releaseWorkflow.includes('npm run test:release-surface'), 'release workflow should guard release surface');
assert.ok(releaseWorkflow.includes('npm run test:build-size-budget'), 'release workflow should guard hosted package budgets');
assert.ok(releaseWorkflow.includes('npm run test:app-download-clicks'), 'release workflow should smoke-test hosted download clicks');
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
assert.ok(cleanupWorkflow.includes('schedule:'), 'beta cleanup should run on a schedule');
assert.ok(cleanupWorkflow.includes('workflow_dispatch:'), 'beta cleanup should support manual execution');
assert.ok(cleanupWorkflow.includes('90 days ago'), 'beta retention should be exactly 90 days');
assert.ok(cleanupWorkflow.includes('.prerelease == true'), 'cleanup must select prereleases only');
assert.ok(cleanupWorkflow.includes('startswith("beta-")'), 'cleanup must select beta tags only');
assert.ok(cleanupWorkflow.includes('gh api --paginate'), 'cleanup should inspect every releases page');
assert.ok(cleanupWorkflow.includes('releases/$release_id'), 'cleanup should delete only selected release IDs');
assert.ok(performanceWorkflow.includes('npm run performance:record'), 'performance workflow should record trend output');
assert.ok(performanceWorkflow.includes('npm run check:release-fast'), 'performance workflow should run fast guards before smoke');
assert.ok(performanceWorkflow.includes('cancel-in-progress: true'), 'performance workflow should cancel stale trend runs');
assert.ok(performanceWorkflow.includes("github.actor != 'github-actions[bot]'"), 'performance workflow should not react to bot-authored trend commits');
assert.ok(performanceWorkflow.includes('[skip performance]'), 'performance workflow should support an explicit skip marker');

console.log(JSON.stringify({
  ok: true,
  releaseWorkflow: true,
  performanceWorkflow: true
}, null, 2));
