const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'public/assets/js/mobile-app-runtime.js'), 'utf8');
const permission = fs.readFileSync(path.join(root, 'public/assets/js/permission-policy-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/assets/css/mobile-experience-system.css'), 'utf8');
const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;

assert.match(html, /id="data-manager-modal"[^>]*data-mobile-surface="management"/);
for (const tab of ['student', 'exams', 'teacher', 'assessment-roster', 'params', 'targets', 'sql', 'cloud']) {
  assert.match(html, new RegExp(`data-dm-arg="${tab}"`), `DataManager tab missing: ${tab}`);
}
assert.match(runtime, /annotateManagementMobileSurfaces/);
assert.match(runtime, /data-manager-modal/);
assert.match(runtime, /account-manager-modal/);
assert.match(permission, /function|=>/, 'permission policy runtime must remain executable');
assert.match(css, /data-mobile-surface="management"[\s\S]*?\.login-tab[\s\S]*?min-height:\s*var\(--mobile-control-min/);
assert.equal(scripts['test:mobile-management-modules'], 'node scripts/test-mobile-management-modules.js');
console.log('mobile management module contract passed');
