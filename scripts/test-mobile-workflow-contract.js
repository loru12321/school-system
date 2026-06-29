const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const runtime = read('public/assets/js/mobile-app-runtime.js');
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

console.log('mobile workflow contract passed');
