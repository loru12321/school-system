const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message, extra = {}) => {
    console.error(JSON.stringify({ ok: false, message, ...extra }, null, 2));
    process.exit(1);
};
const assertContains = (content, token, file) => {
    if (!content.includes(token)) fail(`Missing summary/report cache token in ${file}`, { token });
};

const appFile = 'public/assets/js/app.js';
const profileFile = 'public/assets/js/school-profile-runtime.js';
const townCompareFile = 'public/assets/js/town-submodule-compare-runtime.js';
const studentDetailsFile = 'public/assets/js/student-details-render-runtime.js';
const packageFile = 'package.json';
const app = read(appFile);
const profile = read(profileFile);
const townCompare = read(townCompareFile);
const studentDetails = read(studentDetailsFile);
const pkg = JSON.parse(read(packageFile));

[
    'SummaryRenderPerfCache',
    'getSummaryRenderSignature',
    'getSummaryTownshipSchools',
    'setSummaryHtmlIfChanged',
    'bindSummaryProfileEvents',
    'const maxAvg = list.reduce((max, school) => (',
    'Math.min(100, m.avg / maxAvg * 100).toFixed(1)',
    'subjectRenderKey',
    'dataset.summaryRenderSig',
    'reportHtmlCacheKey'
].forEach((token) => assertContains(app, token, appFile));

[
    'SchoolProfilePerfCache',
    'getSchoolProfileSignature',
    'getProfileSchoolList',
    'getProfileTownshipRows',
    'getSubjectTownAverage',
    'buildDistribution',
    'getTownDistribution',
    'getSchoolDistribution',
    'getSchoolProfileModel',
    'currentModalSchool === (resolvedKey || schoolName)',
    "modal.style.display = 'flex';",
    '&& schoolRadarInstance',
    '&& schoolDistInstance'
].forEach((token) => assertContains(profile, token, profileFile));

[
    'TownSubmoduleComparePerfCache',
    'getTownSubmoduleCompareDataSignature',
    'getCachedTownSubmoduleExamRows',
    'getCachedTownSubmoduleSchoolRows',
    'getCachedTownSubmoduleSchoolSummary',
    'renderedHtml',
    'dataset.townSubmoduleCompareRenderSig',
    'buildSchoolSummaryForExam(rows)',
    'filterRowsBySchool(rows, school)'
].forEach((token) => assertContains(townCompare, token, townCompareFile));

[
    'reportChartCacheKey'
].forEach((token) => assertContains(studentDetails, token, studentDetailsFile));

if (pkg.scripts['test:summary-report-performance-caches'] !== 'node scripts/test-summary-report-performance-caches.js') {
    fail('test:summary-report-performance-caches script is missing or changed');
}
if (!String(pkg.scripts['check:performance'] || '').includes('test:summary-report-performance-caches')) {
    fail('check:performance must include summary/report cache guard');
}
if (String(pkg.scripts['check:syntax'] || '') !== 'node scripts/test-syntax.js') {
    fail('check:syntax must use recursive syntax coverage');
}

console.log(JSON.stringify({
    ok: true,
    summaryTokens: 9,
    schoolProfileTokens: 9
}, null, 2));
