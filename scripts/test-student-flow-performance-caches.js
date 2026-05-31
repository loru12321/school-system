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
const packageFile = 'package.json';
const app = read(appFile);
const overview = read(overviewFile);
const freshman = read(freshmanFile);
const pkg = JSON.parse(read(packageFile));

[
    'StudentDetailsPerfCache',
    'ComparisonRankContextPerfCache',
    'buildComparisonRankContextSignature',
    'getCachedComparisonStudentRankContext',
    'ModuleSwitchPerfCache',
    'getModuleSectionsCached',
    'getModuleSectionById',
    'getModuleCategoryKeyCached',
    'scheduleModuleDockRefresh',
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
    'ReportHistoryPerfCache',
    'getReportSubjectSortedScores',
    'lastScrollKey'
].forEach((token) => assertContains(app, token, appFile));

[
    'StudentOverviewPerfCache',
    'smRowsSignature',
    'smGetSchoolListCached',
    'smBuildProgressSummary',
    'signatureParts',
    'smBuildPotentialCount',
    'renderSignature'
].forEach((token) => assertContains(overview, token, overviewFile));

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
    'freshmanBalanceSig'
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
    freshmanTokens: 6,
    entryTokens: 3
}, null, 2));
