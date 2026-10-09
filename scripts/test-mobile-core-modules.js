const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'public/assets/js/mobile-app-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/assets/css/mobile-experience-system.css'), 'utf8');
const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;

for (const id of ['upload', 'summary', 'teacher-analysis', 'student-details', 'report-generator', 'exam-arranger']) {
  assert.match(html, new RegExp(`id="${id}"[^>]*data-mobile-surface="core"`), `${id} needs a core mobile surface`);
  assert.ok(runtime.includes(`'${id}'`), `${id} needs runtime enhancement coverage`);
}
assert.match(runtime, /annotateCoreMobileModules/);
assert.match(runtime, /data-mobile-action-bar/);
assert.match(css, /data-mobile-surface="core"[\s\S]*?max-width:\s*100%/);
assert.match(css, /data-mobile-surface="core"[\s\S]*?scroll-margin-bottom/);
assert.equal(scripts['test:mobile-core-modules'], 'node scripts/test-mobile-core-modules.js');
console.log('mobile core module contract passed');
