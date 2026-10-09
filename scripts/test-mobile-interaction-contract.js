const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runtime = fs.readFileSync(path.join(root, 'public/assets/js/mobile-app-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/assets/css/mobile-experience-system.css'), 'utf8');
const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;

for (const api of ['openSheet', 'closeSheet', 'syncActionBar', 'focusFirstInvalid']) {
  assert.match(runtime, new RegExp(`\\b${api}\\b`), `missing MobileExperienceRuntime.${api}`);
}
assert.match(runtime, /event\.key === 'Escape'/, 'Escape must close the active sheet');
assert.match(runtime, /data-mobile-sheet-dismiss/, 'sheet backdrops must expose a dismiss hook');
assert.match(runtime, /previousSheetTrigger.*focus|sheetTrigger.*focus/s, 'closing a sheet must restore trigger focus');
assert.match(runtime, /aria-invalid|:invalid/, 'invalid forms must focus their first error');
assert.match(runtime, /data-mobile-overflow-action/, 'action bars must classify overflow actions');
assert.match(runtime, /mobile-action-more/, 'overflow actions must be reachable under a More control');

assert.match(css, /data-mobile-action-bar[\s\S]*?safe-area-inset-bottom/, 'action bars must respect bottom safe areas');
assert.match(css, /data-mobile-overflow-action[\s\S]*?display:\s*none/, 'overflow actions must collapse by default');
assert.match(css, /aria-invalid="true"[\s\S]*?outline|:invalid[\s\S]*?outline/, 'inline errors must remain visually identifiable');
assert.match(css, /data-mobile-sheet][\s\S]*?position:\s*fixed/, 'mobile sheets must use a viewport surface');

assert.equal(scripts['test:mobile-interaction'], 'node scripts/test-mobile-interaction-contract.js');
assert.match(scripts['validate:build'], /test:mobile-interaction/);

console.log('mobile interaction contract passed');
