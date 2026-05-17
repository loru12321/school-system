const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts || {};

assert.ok(readme.includes('C:\\Users\\loru\\Documents\\New project\\school-system'), 'README should show the current workspace path');
assert.ok(!readme.includes('C:\\Users\\loru\\Desktop\\system\\school-system'), 'README should not point to the old desktop workspace');
assert.ok(readme.includes('截至 `2026-05-17`'), 'README release status date should be current for this optimization pass');
assert.ok(readme.includes('未验证到真实 release 资产前，APK / EXE 直达下载按钮默认禁用'), 'README should document the download center verification guard');
assert.ok(readme.includes('RELEASE_ASSETS_ALLOW_MISSING=true'), 'README should mention the non-failing release asset report mode');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:docs-hygiene'), 'fast release check should include docs hygiene');

console.log('docs hygiene tests passed');
