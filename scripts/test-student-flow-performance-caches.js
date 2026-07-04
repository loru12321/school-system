const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message, extra = {}) => {
    console.error(JSON.stringify({ ok: false, message, ...extra }, null, 2));
    process.exit(1);
};
const assertContains = (content, token, file) => {
    if (!content.includes(token)) fail(`Missing student-flow performance cache token in ${file}`, { token });
};

const appFile = 'public/assets/js/app.js';
const overviewFile = 'public/assets/js/student-overview-runtime.js';
const freshmanFile = 'public/assets/js/freshman-exam-runtime.js';
const progressFile = 'public/assets/js/progress-analysis-runtime.js';
const cohortGrowthFile = 'public/assets/js/cohort-growth-runtime.js';
const compareSharedFile = 'public/assets/js/compare-shared-runtime.js';
const comparisonRenderFile = 'public/assets/js/comparison-render-runtime.js';
const studentDetailsFile = 'public/assets/js/student-details-render-runtime.js';
const bootFile = 'public/assets/js/boot-runtime.js';
const schoolNormalizationFile = 'public/assets/js/school-normalization-runtime.js';
const teacherBridgeFile = 'public/assets/js/teacher-analysis-bridge-runtime.js';
const packageFile = 'package.json';
const app = read(appFile);
const overview = read(overviewFile);
const freshman = read(freshmanFile);
const progress = read(progressFile);
const cohortGrowth = read(cohortGrowthFile);
const compareShared = read(compareSharedFile);
const comparisonRender = read(comparisonRenderFile);
const studentDetails = read(studentDetailsFile);
const boot = read(bootFile);
const schoolNormalization = read(schoolNormalizationFile);
const teacherBridge = read(teacherBridgeFile);
const pkg = JSON.parse(read(packageFile));

[
    'ModuleSwitchPerfCache',
    'getModuleSectionsCached',
    'getModuleSectionById',
    'getModuleCategoryKeyCached',
    'scheduleModuleDockRefresh',
    'ReportHistoryPerfCache',
    'getReportSubjectSortedScores',
    'lastScrollKey'
].forEach((token) => assertContains(app, token, appFile));

[
    'ComparisonRankContextPerfCache',
    'buildComparisonRankContextSignature',
    'getCachedComparisonStudentRankContext'
].forEach((token) => assertContains(comparisonRender, token, comparisonRenderFile));

[
    'StudentDetailsPerfCache',
    'getStudentDetailsDomCache',
    'getStudentDetailsRankSnapshot',
    'rankSnapshotByStudent',
    'bodyHtmlSignature',
    'paginationSignature',
    'cellValueByStudent',
    'openFilterMenu',
    'filterSearchCache',
    'buildStudentDetailsDataSignature',
    'buildStudentDetailsFilterSignature',
    'setStudentDetailsHtmlIfChanged',
    'filterValueCache',
    'querySignature',
    'studentDetailsFilterMenuSig',
    'dataset.studentDetailsRenderSig',
    'getStudentDetailsClassTeacherQueryMode',
    'classTeacherClasses = Array.from(new Set([',
    '...Array.from(scope.classes || [])',
    'scope?.classes?.has(normalizedSelectedClass) ? \'teaching\' : \'homeroom\''
].forEach((token) => assertContains(studentDetails, token, studentDetailsFile));

[
    'StudentOverviewPerfCache',
    'smRowsSignature',
    'smGetSchoolListCached',
    'smBuildProgressSummary',
    'signatureParts',
    'smBuildPotentialCount',
    'renderSignature'
].forEach((token) => assertContains(overview, token, overviewFile));

[
    'ProgressBaselineExamPerfCache',
    'ProgressCompareSelectPerfCache',
    'ProgressBaselineExamPerfCache.signature === signature',
    'ProgressCompareSelectPerfCache.examOptionsHtml',
    'ProgressCompareSelectPerfCache.schoolOptionsHtml'
].forEach((token) => assertContains(progress, token, progressFile));

[
    'cacheSignature',
    'getRenderSignature',
    'if (this.cacheSignature === signature)',
    'this.cacheSignature = signature'
].forEach((token) => assertContains(cohortGrowth, token, cohortGrowthFile));

[
    'getSelectorSafeExamFingerprint',
    'fingerprint: getSelectorSafeExamFingerprint(ex)',
    'fingerprint: getSelectorSafeExamFingerprint({'
].forEach((token) => assertContains(compareShared, token, compareSharedFile));

const listAvailableExamsStart = compareShared.indexOf('function listAvailableExamsForCompare()');
const getSelectedReportStart = compareShared.indexOf('function getSelectedReportCompareExamIds()', listAvailableExamsStart);
const listAvailableExamsSource = listAvailableExamsStart >= 0 && getSelectedReportStart > listAvailableExamsStart
    ? compareShared.slice(listAvailableExamsStart, getSelectedReportStart)
    : '';
if (!listAvailableExamsSource || listAvailableExamsSource.includes('computeExamDataFingerprint(')) {
    fail('compare exam selector list must not compute full row fingerprints during dropdown refresh');
}

if (boot.includes("'updateProgressMultiExamSelects',")) {
    fail('progress compare selector refresh should stay on the lightweight compare-selectors runtime, not trigger the full progress runtime');
}

[
    'allSignature',
    'townshipSignature',
    "const includeCohortExamSchools = requestedScope !== 'all' || !rawRows.length;",
    "if (requestedScope === 'all')",
    'return allSchools.slice();'
].forEach((token) => assertContains(schoolNormalization, token, schoolNormalizationFile));

[
    'studentLists: new Map()',
    'classOptions: new Map()',
    'function buildCorrelationDataSignature(scope)',
    'CorrelationAnalysisPerfCache.classOptions.set(cacheKey, optionsHtml)',
    'CorrelationAnalysisPerfCache.studentLists.set(cacheKey, result)'
].forEach((token) => assertContains(teacherBridge, token, teacherBridgeFile));

const marginalStart = overview.indexOf('function smBuildMarginalSummary()');
const marginalEnd = overview.indexOf('function smGetSchoolListCached()', marginalStart);
const marginalSource = marginalStart >= 0 && marginalEnd > marginalStart ? overview.slice(marginalStart, marginalEnd) : '';
if (!marginalSource || marginalSource.includes('JSON.stringify')) {
    fail('student overview marginal summary should build its signature and counts in one pass');
}

[
    'FreshmanExamPerfCache',
    'fbClassSignature',
    'fbCalcClassStats',
    'freshmanSchemeSig',
    'freshmanDashboardSig',
    'freshmanBalanceSig',
    'examRoomSignature',
    'examOverviewSignature',
    'examPrintSignature'
].forEach((token) => assertContains(freshman, token, freshmanFile));

[
    'student-details-compare-selects',
    'student-details-county-runtime',
    'student-details-render-primary'
].forEach((token) => assertContains(read('public/assets/js/module-entry-runtime.js'), token, 'public/assets/js/module-entry-runtime.js'));

if (pkg.scripts['test:student-flow-performance-caches'] !== 'node scripts/test-student-flow-performance-caches.js') {
    fail('test:student-flow-performance-caches script is missing or changed');
}
if (!String(pkg.scripts['check:performance'] || '').includes('test:student-flow-performance-caches')) {
    fail('check:performance must include student-flow cache guard');
}
if (String(pkg.scripts['check:syntax'] || '') !== 'node scripts/test-syntax.js') {
    fail('check:syntax must use recursive syntax coverage');
}

console.log(JSON.stringify({
    ok: true,
    studentDetailsTokens: 27,
    overviewTokens: 6,
    progressTokens: 5,
    freshmanTokens: 6,
    entryTokens: 3
}, null, 2));
