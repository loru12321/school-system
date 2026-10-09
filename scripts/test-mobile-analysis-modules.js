const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const runtime = fs.readFileSync(path.join(root, 'public/assets/js/mobile-app-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/assets/css/mobile-experience-system.css'), 'utf8');
const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;

for (const id of ['analysis', 'correlation-analysis', 'progress-analysis', 'marginal-push', 'seat-adjustment', 'cohort-growth', 'mutual-aid', 'county-analysis', 'teacher-detail-comparison', 'teacher-pairing']) {
  assert.ok(runtime.includes(`'${id}'`), `missing analysis mobile coverage: ${id}`);
}
assert.match(runtime, /annotateAnalysisMobileModules/);
assert.match(runtime, /mobileSurface = 'analysis'/);
assert.match(css, /data-mobile-surface="analysis"[\s\S]*?canvas/);
assert.match(css, /data-mobile-surface="analysis"[\s\S]*?flex-wrap:\s*wrap/);
assert.match(css, /data-mobile-surface="analysis"[\s\S]*?font-variant-numeric:\s*tabular-nums/);
assert.equal(scripts['test:mobile-analysis-modules'], 'node scripts/test-mobile-analysis-modules.js');
console.log('mobile analysis module contract passed');
