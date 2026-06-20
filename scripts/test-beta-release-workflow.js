const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'build-apps-beta.yml');
assert.ok(fs.existsSync(workflowPath), 'beta build workflow should exist');

const workflow = fs.readFileSync(workflowPath, 'utf8');
assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/, 'beta builds should run for every main commit');
assert.match(workflow, /workflow_dispatch:/, 'beta builds should support manual dispatch');
assert.match(workflow, /cancel-in-progress:\s*true/, 'stale beta builds should be cancelled');
assert.match(workflow, /runs-on:\s*windows-latest/, 'workflow should build Windows');
assert.match(workflow, /runs-on:\s*ubuntu-latest/, 'workflow should build Android and publish');
assert.match(workflow, /runs-on:\s*macos-latest/, 'workflow should validate iOS');
assert.ok((workflow.match(/node scripts\/resolve-app-version\.mjs/g) || []).length >= 3, 'every platform job should resolve its native version');
assert.ok((workflow.match(/actions\/upload-artifact@v4/g) || []).length >= 3, 'every platform job should upload evidence');
assert.match(workflow, /assembleRelease[^\n]*-PappVersionName=.*-PappVersionCode=/, 'Android release should receive resolved version metadata');
assert.match(workflow, /CODE_SIGNING_ALLOWED=NO/, 'iOS simulator build must not require Apple signing');
assert.match(workflow, /MARKETING_VERSION=.*CURRENT_PROJECT_VERSION=/, 'iOS build should receive resolved version metadata');
assert.match(workflow, /build-release-manifest\.mjs/, 'publish job should generate the release manifest');
assert.match(workflow, /gh release create[\s\S]*--prerelease/, 'beta publication must create a prerelease');
assert.match(workflow, /ANDROID_TEST_KEYSTORE_FILE/, 'Android signing should come from GitHub secrets');
assert.doesNotMatch(workflow, /\bxcrun\s+(?:altool|notarytool)\b|app-store|testflight/i, 'Apple upload must remain disabled until credentials exist');

const gradle = fs.readFileSync(path.join(root, 'android', 'app', 'build.gradle'), 'utf8');
assert.match(gradle, /findProperty\(['"]appVersionName['"]\)/, 'Android should consume the workflow version name');
assert.match(gradle, /findProperty\(['"]appVersionCode['"]\)/, 'Android should consume the workflow build number');

console.log('beta release workflow contract tests passed');
