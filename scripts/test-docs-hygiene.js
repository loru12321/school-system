const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts || {};

assert.ok(readme.includes('SmartEdu Analytics'), 'README should use the current project title');
assert.ok(readme.includes('.github/workflows/release-apps.yml'), 'README should document the GitHub Release automation workflow');
assert.ok(readme.includes('.github/workflows/performance-trend.yml'), 'README should document the performance trend workflow');
assert.ok(readme.includes('docs/performance/'), 'README should point readers to the performance trend output');
assert.ok(readme.includes('/downloads/smartedu-windows-latest.zip'), 'README should document the hosted Windows download');
assert.ok(readme.includes('/downloads/school-system-android-v1.0.apk'), 'README should document the hosted APK download');
assert.ok(!readme.includes('school-system-android-latest.apk` 下载地址返回 `404`'), 'README should not keep stale release 404 guidance');
assert.ok(!readme.includes('smartedu-desktop-windows-latest.exe` 下载地址返回 `404`'), 'README should not keep stale Windows release 404 guidance');
assert.ok(!readme.includes('C:\\Users\\loru\\Documents\\New project\\school-system'), 'README should not expose old local workspace paths');
assert.ok(!readme.includes('C:\\Users\\loru\\Desktop\\system\\school-system'), 'README should not point to the old desktop workspace');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:docs-hygiene'), 'fast release check should include docs hygiene');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-automation'), 'fast release check should include release automation checks');

console.log('docs hygiene tests passed');
