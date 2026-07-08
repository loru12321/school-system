const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const dataManager = read('public/assets/js/data-manager-core-runtime.js');
const studentDetails = read('public/assets/js/student-details-render-runtime.js');
const app = read('public/assets/js/app.js');

assert.ok(dataManager.includes('escapeDataManagerHtml(s.school)'), 'student table school names must be HTML-escaped');
assert.ok(dataManager.includes('escapeDataManagerHtml(s.name)'), 'student table names must be HTML-escaped');
assert.ok(dataManager.includes('dataManagerJsStringLiteral(t.key)'), 'teacher action keys must use JS string literals');
assert.ok(dataManager.includes('dataManagerJsStringLiteral(t.name)'), 'teacher action names must use JS string literals');
assert.ok(!dataManager.includes("onclick=\"DataManager.editTeacher('${t.key}', '${t.name}')"), 'teacher edit onclick must not interpolate raw quoted values');
assert.ok(!dataManager.includes('value="${s.name}"'), 'student edit modal values must not interpolate raw names');

assert.ok(studentDetails.includes('updateStudentScore(${jsStringLiteral(student.name)}, ${jsStringLiteral(student.class)}, ${jsStringLiteral(sub)}, ${scoreArg})'), 'student score editing onclick must use safe JS literals');
assert.ok(studentDetails.includes('${tmEscapeHtml(student.name || \'-\')}</a>'), 'student detail links must escape displayed names');
assert.ok(!studentDetails.includes("updateStudentScore('${student.name}', '${student.class}', '${sub}'"), 'student detail score onclick must not interpolate raw quoted values');

[
  "handleHighClick(${safeNameArg})",
  "handleExcludedClick(${safeNameArg})",
  "analyzeTargetGap(${safeNameArg}, 'ind1'",
  "handleIndicatorClick(${safeNameArg}, 'ind1')",
  'jumpToDetail(${schoolArg}, ${subjectArg})',
  'removeTagFromWidget(${jsStringLiteral(wrapperId)}, ${jsStringLiteral(hiddenInputId)}, ${jsStringLiteral(tag)})'
].forEach((needle) => {
  assert.ok(app.includes(needle), `app.js should contain safe pattern: ${needle}`);
});

[
  "handleHighClick('${d.name}')",
  "handleExcludedClick('${s.name}')",
  "jumpToDetail('${s.name}', '${sub}')",
  "addTagToWidget('${wrapperId}', '${hiddenInputId}', '${s.name}')",
  "removeTagFromWidget('${wrapperId}', '${hiddenInputId}', '${tag}')",
  "DrillSystem.renderStudentView('${cls}')"
].forEach((needle) => {
  assert.ok(!app.includes(needle), `app.js must not contain raw interpolation pattern: ${needle}`);
});

console.log('xss escaping contract tests passed');
