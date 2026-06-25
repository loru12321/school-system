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
assert.doesNotMatch(workflow, /Build test-signed Android APK|assembleRelease|ANDROID_TEST_/i, 'beta workflow should not build or sign Android packages');
assert.doesNotMatch(workflow, /Validate iOS simulator build|xcodebuild|CODE_SIGNING_ALLOWED|TestFlight/i, 'beta workflow should not validate or publish iOS packages');
assert.ok((workflow.match(/node scripts\/resolve-app-version\.mjs/g) || []).length >= 1, 'Windows job should resolve its native version');
assert.ok((workflow.match(/actions\/upload-artifact@v4/g) || []).length >= 1, 'Windows job should upload evidence');
assert.match(workflow, /build-release-manifest\.mjs/, 'publish job should generate the release manifest');
assert.match(workflow, /gh release create[\s\S]*--prerelease/, 'beta publication must create a prerelease');
assert.doesNotMatch(workflow, /\bxcrun\s+(?:altool|notarytool)\b|app-store|testflight/i, 'Apple upload must remain disabled until credentials exist');

console.log('beta release workflow contract tests passed');
