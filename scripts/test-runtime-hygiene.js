const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const removedFiles = [
    'public/assets/js/admin-dashboard.js',
    'public/assets/js/audit-logger.js',
    'public/assets/js/automated-reports.js',
    'public/assets/js/chart-interactivity.js',
    'public/assets/js/comparison-engine-v2.js',
    'public/assets/js/data-anonymizer.js',
    'public/assets/js/data-pagination.js',
    'public/assets/js/drag-drop-lab.js',
    'public/assets/js/parent-growth-portal.js',
    'public/assets/js/responsive-table.js',
    'public/assets/js/school-resource-monitor.js',
    'public/assets/js/student-learning-nav.js',
    'public/assets/js/sync-push-center.js',
    'public/assets/js/teacher-collab-hub.js',
    'public/assets/js/voice-assistant.js',
    'src/patch.js'
];

const forbiddenRuntimeTokens = [
    'ai-analysis',
    'ai-hub-runtime.js',
    'report-ai-runtime.js',
    'ai-diagnosis.js',
    '/api/ai/',
    'LLM_API_KEY',
    'BATCH_AI',
    'IS_BATCH_AI'
];

const sourceFiles = [
    'src/index.html',
    'src/worker-dummy.js',
    'public/assets/js/app.js',
    'public/assets/js/boot-runtime.js',
    'public/assets/js/shell-runtime.js',
    'public/assets/js/module-entry-runtime.js',
    'public/assets/js/permission-policy-runtime.js',
    'scripts/build/inline-scripts.mjs',
    'package.json'
];

const quietRuntimeFiles = [
    'public/assets/js/history-compare-runtime.js',
    'public/assets/js/student-compare-generate-runtime.js',
    'public/assets/js/student-compare-result-runtime.js'
];

removedFiles.forEach((relativePath) => {
    assert.strictEqual(
        fs.existsSync(path.join(root, relativePath)),
        false,
        `${relativePath} should remain removed`
    );
});

sourceFiles.forEach((relativePath) => {
    const filePath = path.join(root, relativePath);
    const text = fs.readFileSync(filePath, 'utf8');
    forbiddenRuntimeTokens.forEach((token) => {
        assert.strictEqual(
            text.includes(token),
            false,
            `${relativePath} should not contain removed runtime token: ${token}`
        );
    });
});

quietRuntimeFiles.forEach((relativePath) => {
    const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.ok(!/console\.log\([^)]*学生对比/.test(text), `${relativePath} should not emit student compare console.log noise`);
    assert.ok(!/console\.log\([^)]*班级下拉框/.test(text), `${relativePath} should not emit class filter console.log noise`);
    assert.ok(!text.includes('console.log('), `${relativePath} should not emit default console.log noise`);
});

const studentCompareResult = fs.readFileSync(path.join(root, 'public/assets/js/student-compare-result-runtime.js'), 'utf8');
assert.ok(studentCompareResult.includes('escapeStudentCompareHtml'), 'student compare class filter options should escape dynamic class names');
const historyCompareRuntime = fs.readFileSync(path.join(root, 'public/assets/js/history-compare-runtime.js'), 'utf8');
assert.ok(historyCompareRuntime.includes('escapeHistoryHtml(h.examId)'), 'history compare should escape dynamic exam names');
assert.ok(historyCompareRuntime.includes('escapeHistoryHtml(k[0])'), 'history compare should escape dynamic subject names');
const schoolProfileRuntime = fs.readFileSync(path.join(root, 'public/assets/js/school-profile-runtime.js'), 'utf8');
assert.ok(schoolProfileRuntime.includes('escapeSchoolProfileHtml(schoolName)'), 'school profile should escape dynamic school names');
assert.ok(schoolProfileRuntime.includes('escapeSchoolProfileHtml(maxSub)'), 'school profile should escape dynamic advantage subject names');
assert.ok(schoolProfileRuntime.includes('escapeSchoolProfileHtml(minSub)'), 'school profile should escape dynamic weak subject names');
const appRuntime = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
assert.ok(!appRuntime.includes("onclick=\"showSchoolProfile('${s.name}')\""), 'summary table should not inject dynamic school names into inline handlers');
assert.ok(appRuntime.includes('const safeSchoolName = escapeAppHtml(s.name)'), 'summary table should escape dynamic school names before rendering');
assert.ok(appRuntime.includes('data-school-profile-name="${safeSchoolName}"'), 'summary table should bind school profile actions through a safe data attribute');

console.log('runtime hygiene tests passed');
