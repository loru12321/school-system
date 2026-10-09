const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const runtime = read('public/assets/js/mobile-app-runtime.js');
const workbenchCss = read('src/assets/css/workbench-design-language.css');
const shellCss = read('src/assets/css/apk-mobile-shell.css');
const mobileSystemCss = read('src/assets/css/mobile-experience-system.css');
const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};

[
  'ROLE_QUICK_MODULE_IDS',
  "admin: ['upload', 'summary', 'data-manager'",
  "director: ['summary', 'county-analysis'",
  "grade_director: ['teacher-analysis', 'summary'",
  "class_teacher: ['student-details', 'student-overview'",
  "teacher: ['teacher-analysis', 'student-details'",
  'roleQuickModules.map((moduleId) => findAllowedItem(moduleId))',
  'getRecentModules(limit)',
  'findAllowedItem(getHomeModuleId())',
  'QUICK_MODULE_IDS.map((moduleId) => findAllowedItem(moduleId))',
  'uniqueItems(modules).slice(0, limit)'
].forEach((token) => {
  assert.ok(runtime.includes(token), `mobile workflow runtime missing token: ${token}`);
});

const roleBlock = runtime.slice(
  runtime.indexOf('const ROLE_QUICK_MODULE_IDS'),
  runtime.indexOf('const RECENT_MODULE_STORAGE_KEY')
);
['upload', 'summary', 'teacher-analysis', 'student-details', 'report-generator', 'progress-analysis', 'cohort-growth'].forEach((moduleId) => {
  assert.ok(roleBlock.includes(`'${moduleId}'`), `role quick modules should keep frequent task: ${moduleId}`);
});

assert.ok(scripts['test:mobile-workflow'] === 'node scripts/test-mobile-workflow-contract.js', 'package script should expose mobile workflow contract');
assert.ok(scripts['validate:build']?.includes('test:mobile-workflow'), 'validate:build should include mobile workflow contract');
assert.ok(scripts['check:release-fast']?.includes('test:mobile-workflow'), 'release fast check should include mobile workflow contract');
assert.ok(scripts['check:performance']?.includes('test:performance-thresholds'), 'performance check should include trend threshold guard');
assert.match(
  runtime,
  /Prefer layout viewport measurements[\s\S]*window\.visualViewport\?\.width[\s\S]*Screen dimensions are a last-resort fallback/s,
  'mobile viewport detection must prefer layout viewport measurements over stale iPad screen dimensions'
);
assert.ok(
  !runtime.slice(runtime.indexOf('const candidates = ['), runtime.indexOf('if (candidates.length)')).match(/Number\(window\.screen\?\.width/),
  'screen.width must not participate in the primary mobile viewport minimum'
);
assert.match(
  workbenchCss,
  /@media \(max-width: 820px\)[\s\S]*?#app\.app-layout\.hidden\s*\{\s*display:\s*none\s*!important;/,
  'mobile workbench CSS must keep the hidden app from intercepting login interactions'
);

const shellTemplate = runtime.slice(runtime.indexOf('root.innerHTML = `'), runtime.indexOf('root.addEventListener', runtime.indexOf('root.innerHTML = `')));
assert.equal((shellTemplate.match(/data-apk-tab=/g) || []).length, 5, 'mobile shell must expose exactly five bottom entries');
assert.match(shellTemplate, /data-apk-tab="library"/, 'module library must be a bottom navigation entry');
assert.match(runtime, /dataMobileCurrentModule|mobileCurrentModule/, 'shell state must publish the current module');
assert.match(runtime, /mobileSheetOpen/, 'shell state must publish whether a sheet is open');
assert.match(runtime, /mobileLibraryOpen/, 'shell state must publish whether the library is open');
assert.match(runtime, /syncCompactState\(document\)/, 'compact state must remain idempotently synchronized');
assert.match(shellCss, /\.apk-shell-title[\s\S]*?-webkit-line-clamp:\s*2/, 'long mobile titles must clamp to two lines');
assert.match(shellCss, /\.app-main[\s\S]*?overflow-y:\s*auto/, '.app-main must own vertical business scrolling');
assert.match(mobileSystemCss, /data-mobile-sheet-open="true"[\s\S]*?overflow:\s*hidden/, 'open sheets must lock background scrolling');
assert.match(shellCss, /safe-area-inset-bottom|--app-safe-bottom/, 'bottom navigation must respect the safe area');

console.log('mobile workflow contract passed');
