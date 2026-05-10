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
    'buildStudentDetailsDataSignature',
    'buildStudentDetailsFilterSignature',
    'setStudentDetailsHtmlIfChanged',
    'filterValueCache',
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
    'smBuildPotentialCount',
    'renderSignature'
].forEach((token) => assertContains(overview, token, overviewFile));

[
    'FreshmanExamPerfCache',
    'fbClassSignature',
    'fbCalcClassStats',
    'freshmanSchemeSig',
    'freshmanDashboardSig',
    'freshmanBalanceSig'
].forEach((token) => assertContains(freshman, token, freshmanFile));

if (pkg.scripts['test:student-flow-performance-caches'] !== 'node scripts/test-student-flow-performance-caches.js') {
    fail('test:student-flow-performance-caches script is missing or changed');
}
if (!String(pkg.scripts['check:performance'] || '').includes('test:student-flow-performance-caches')) {
    fail('check:performance must include student-flow cache guard');
}
if (!String(pkg.scripts['check:syntax'] || '').includes('scripts/test-student-flow-performance-caches.js')) {
    fail('check:syntax must syntax-check student-flow cache guard');
}

console.log(JSON.stringify({
    ok: true,
    studentDetailsTokens: 8,
    overviewTokens: 6,
    freshmanTokens: 6
}, null, 2));
