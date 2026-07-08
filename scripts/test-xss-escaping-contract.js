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
const reportRender = read('public/assets/js/report-render-runtime.js');
const comparisonRender = read('public/assets/js/comparison-render-runtime.js');

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

// report-render-runtime: student name/school/class flow into report HTML (later
// assigned via innerHTML). Cloud content is attacker-influenceable, so these must
// be HTML-escaped.
// report-render uses the global tmEscapeHtml directly (matching student-details /
// progress-analysis / student-overview runtimes) rather than a local helper, to
// stay within the file's byte budget.
assert.ok(reportRender.includes('${tmEscapeHtml(stu.name)}'), 'report student names must be HTML-escaped');
assert.ok(reportRender.includes('${tmEscapeHtml(stu.school)}'), 'report school names must be HTML-escaped');
assert.ok(reportRender.includes('${tmEscapeHtml(stu.class)}'), 'report class names must be HTML-escaped');
assert.ok(!/\$\{stu\.name\}/.test(reportRender), 'report must not interpolate raw ${stu.name}');
assert.ok(!/\$\{stu\.school\}\s/.test(reportRender), 'report must not interpolate raw ${stu.school}');

// comparison-render-runtime: mutual-aid group member/leader names and select
// option values flow into innerHTML. Must be escaped.
assert.ok(comparisonRender.includes('const comparisonEscapeHtml'), 'comparison-render must define an HTML escaper');
assert.ok(comparisonRender.includes('${comparisonEscapeHtml(m.name)}'), 'aid member names must be HTML-escaped');
assert.ok(comparisonRender.includes('${comparisonEscapeHtml(g.leader.name)}'), 'aid leader names must be HTML-escaped');
assert.ok(comparisonRender.includes('${comparisonEscapeHtml(value)}'), 'select option values must be HTML-escaped');
assert.ok(!/\$\{m\.name\}\s/.test(comparisonRender), 'comparison must not interpolate raw ${m.name}');
assert.ok(!/\$\{g\.leader\.name\}\s/.test(comparisonRender), 'comparison must not interpolate raw ${g.leader.name}');

console.log('xss escaping contract tests passed');
