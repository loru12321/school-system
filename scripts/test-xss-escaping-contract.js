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
const highScore = read('public/assets/js/high-score-runtime.js');
const indicatorCalc = read('public/assets/js/indicator-calc-runtime.js');
const reportRender = read('public/assets/js/report-render-runtime.js');
const comparisonRender = read('public/assets/js/comparison-render-runtime.js');
const drillSystem = read('public/assets/js/drill-system-runtime.js');

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
  'removeTagFromWidget(${jsStringLiteral(wrapperId)}, ${jsStringLiteral(hiddenInputId)}, ${jsStringLiteral(tag)})'
].forEach((needle) => {
  const source = needle.startsWith('handleHighClick') ? highScore : app;
  assert.ok(source.includes(needle), `${needle.startsWith('handleHighClick') ? 'high-score-runtime.js' : 'app.js'} should contain safe pattern: ${needle}`);
});

// indicator table onclicks moved to indicator-calc-runtime.js (window.calcIndicators) —
// still must use the escaped ${safeNameArg} JS literal, not raw interpolation.
[
  "analyzeTargetGap(${safeNameArg}, 'ind1'",
  "handleIndicatorClick(${safeNameArg}, 'ind1')"
].forEach((needle) => {
  assert.ok(indicatorCalc.includes(needle), `indicator-calc-runtime.js should contain safe pattern: ${needle}`);
});

[
  "handleHighClick('${d.name}')",
  "handleExcludedClick('${s.name}')",
  "addTagToWidget('${wrapperId}', '${hiddenInputId}', '${s.name}')",
  "removeTagFromWidget('${wrapperId}', '${hiddenInputId}', '${tag}')",
  "DrillSystem.renderStudentView('${cls}')",
  'DrillSystem.renderStudentView(${jsStringLiteral(cls)})'
].forEach((needle) => {
  assert.ok(!app.includes(needle) && !highScore.includes(needle), `app.js/high-score-runtime.js must not contain raw interpolation pattern: ${needle}`);
});

assert.ok(drillSystem.includes('data-drill-class="${escapeHtml(className)}"'), 'drill class buttons must use escaped data attributes');
assert.ok(drillSystem.includes('data-drill-student="${encoded}"'), 'drill student buttons must use encoded data attributes');
assert.ok(!/onclick\s*=/.test(drillSystem), 'drill runtime must not generate inline onclick handlers');

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

// runtime-registry exposes the canonical escapeHtml (String(value ?? '') + the
// shared character map). Runtimes with a local escapeHtml should delegate to it and
// keep their own copy only as a load-order fallback, so a fix to the canonical
// escaper reaches every caller instead of having to be applied file by file.
// runtime-registry-runtime.js is loaded before boot-runtime (asserted in
// test-html-hygiene.js), so the delegation always resolves in practice.
assert.ok(
    read('public/assets/js/runtime-registry-runtime.js').includes('escapeHtml'),
    'runtime-registry must expose the canonical escapeHtml on SchoolRuntime'
);
[
    'public/assets/js/account-manager-runtime.js',
    'public/assets/js/county-analysis-runtime.js',
    'public/assets/js/data-cloud-runtime.js',
    'public/assets/js/data-manager-archive-runtime.js',
    'public/assets/js/data-manager-targets-runtime.js',
    'public/assets/js/login-session-runtime.js',
    'public/assets/js/mobile-app-runtime.js',
    'public/assets/js/teaching-management-modules-runtime.js',
    'public/assets/js/upload-school-map-runtime.js'
].forEach((relPath) => {
    assert.ok(
        /SchoolRuntime\.escapeHtml/.test(read(relPath)),
        `${relPath}: local escapeHtml must delegate to SchoolRuntime.escapeHtml`
    );
});

// Two runtimes keep different semantics on purpose: data-quality trims before
// escaping (normalizeText), teaching-assessment-sync delegates to the global
// tmEscapeHtml. Guard both so nobody "unifies" them and silently changes output.
assert.ok(
    read('public/assets/js/data-quality-runtime.js').includes('normalizeText(value).replace'),
    'data-quality escapeHtml must keep its trimming semantics'
);
assert.ok(
    read('public/assets/js/teaching-assessment-sync-runtime.js').includes('tmEscapeHtml'),
    'teaching-assessment-sync escapeHtml must keep delegating to tmEscapeHtml'
);

console.log('xss escaping contract tests passed');
