const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const fail = (message, extra = {}) => {
    console.error(JSON.stringify({ ok: false, message, ...extra }, null, 2));
    process.exit(1);
};
const assertContains = (content, token, file) => {
    if (!content.includes(token)) fail(`Missing performance cache token in ${file}`, { token });
};

const reportRenderFile = 'public/assets/js/report-render-runtime.js';
const reportChartFile = 'public/assets/js/report-chart-runtime.js';
const cloudFile = 'public/assets/js/cloud.js';
const countyFile = 'public/assets/js/county-analysis-runtime.js';
const packageFile = 'package.json';

const reportRender = read(reportRenderFile);
const reportChart = read(reportChartFile);
const cloud = read(cloudFile);
const county = read(countyFile);
const app = read('public/assets/js/app.js');
const compareShared = read('public/assets/js/compare-shared-runtime.js');
const pkg = JSON.parse(read(packageFile));

[
    'ReportRenderPerfCache',
    'getReportRenderSignature',
    'getReportStudentCacheKey',
    'getCachedComparisonStudentView',
    'comparisonStudentByKey',
    'getCachedCloudCompareHint',
    'cloudHintByKey',
    'getCachedPreviousRecord',
    'previousRecordByKey',
    'getCachedStudentExamHistory',
    'examHistoryByKey',
    'getCachedRankScope',
    'getCachedCountyScopeMap',
    'getCachedSchoolCandidates',
    'student?.id || student?.examNo',
    'getPreviousHistoryEntryForReport',
    'hasUsablePrevHistoryStudent ? null : getCachedPreviousRecord',
    'cacheableReportHtml',
    'ReportRenderPerfCache.html.set'
].forEach((token) => assertContains(reportRender, token, reportRenderFile));

[
    'getReportDomCache',
    'getCachedStudentReportHistory',
    'getCurrentReportDataFingerprint',
    'currentFingerprintRows',
    'selectedExamIdsSignature',
    'historyByStudent',
    'hydratingKeys',
    'lastChartScheduleKey',
    'lastStrengthKey',
    'lastCompareHiddenKey'
].forEach((token) => assertContains(app, token, 'public/assets/js/app.js'));

const refreshReportStart = app.indexOf('async function refreshRenderedStudentReportAfterHistory');
const refreshReportEnd = app.indexOf('function hydrateStudentReportHistoryInBackground', refreshReportStart);
const refreshReportSource = refreshReportStart >= 0 && refreshReportEnd > refreshReportStart
    ? app.slice(refreshReportStart, refreshReportEnd)
    : '';
const doQueryStart = app.indexOf('async function doQuery');
const doQueryEnd = app.indexOf('function setSingleSelectOptions', doQueryStart);
const doQuerySource = doQueryStart >= 0 && doQueryEnd > doQueryStart
    ? app.slice(doQueryStart, doQueryEnd)
    : '';
if (!refreshReportSource || refreshReportSource.includes('container.innerHTML !== nextReportHtml')) {
    fail('refreshRenderedStudentReportAfterHistory should trust reportHtmlCacheKey instead of serializing report innerHTML');
}
if (!doQuerySource || doQuerySource.includes('container.innerHTML !== nextReportHtml')) {
    fail('doQuery should trust reportHtmlCacheKey instead of serializing report innerHTML');
}

[
    'CompareExamListPerfCache',
    'getCompareExamListSignature',
    'return cloneCompareExamList(CompareExamListPerfCache.result);',
    'TM_AVAILABLE_EXAM_LIST_CACHE',
    'cloudHistorySignature'
].forEach((token) => {
    const inApp = token === 'TM_AVAILABLE_EXAM_LIST_CACHE' || token === 'cloudHistorySignature';
    const file = inApp ? 'public/assets/js/app.js' : 'public/assets/js/compare-shared-runtime.js';
    assertContains(inApp ? app : compareShared, token, file);
});

[
    'return read(state.history, key, { clone: false });',
    'return write(state.history, key, value, HISTORY_TTL_MS, { clone: false });'
].forEach((token) => assertContains(read('public/assets/js/report-performance-runtime.js'), token, 'public/assets/js/report-performance-runtime.js'));

const historyStart = app.indexOf('function getStudentExamHistory(student)');
const historyEnd = app.indexOf('// 🟢 [新增]：生成进退步胶囊标签', historyStart);
const historySource = historyStart >= 0 && historyEnd > historyStart ? app.slice(historyStart, historyEnd) : '';
if (!historySource || historySource.includes('getReportSubjectSortedScores(')) {
    fail('student exam history should not precompute subject percentile score arrays');
}
[
    'hasUsableStoredHistoryRanks',
    'createHistoryStudentView'
].forEach((token) => assertContains(historySource, token, 'public/assets/js/app.js'));

const previousRecordStart = app.indexOf('function findPreviousRecord(student)');
const previousRecordEnd = app.indexOf('// 🟢 [Bug #5 新增] 获取学生在所有历史考试中的记录', previousRecordStart);
const previousRecordSource = previousRecordStart >= 0 && previousRecordEnd > previousRecordStart
    ? app.slice(previousRecordStart, previousRecordEnd)
    : '';
if (!previousRecordSource || !previousRecordSource.includes('getCurrentReportDataFingerprint()')) {
    fail('findPreviousRecord should reuse cached current report fingerprint');
}

[
    'getHistoryPayloadFingerprint',
    "return [String(examId || '').trim(), String(updatedAt || '').trim(), rowCount].join(':');"
].forEach((token) => assertContains(cloud, token, cloudFile));

const cloudHistoryStart = cloud.indexOf('fetchStudentExamHistory: async function');
const cloudHistoryEnd = cloud.indexOf('// 届别考试补拉运行时', cloudHistoryStart);
const cloudHistorySource = cloudHistoryStart >= 0 && cloudHistoryEnd > cloudHistoryStart
    ? cloud.slice(cloudHistoryStart, cloudHistoryEnd)
    : '';
if (!cloudHistorySource || cloudHistorySource.includes('computeExamDataFingerprint(')) {
    fail('student report cloud history fetch should not compute full exam fingerprints during query hydration');
}

[
    'ReportChartPerfCache',
    'getReportChartSignature',
    'getCachedChartComparisonStudent',
    'getScoreStatsForRows',
    'getPercentileFromStats'
].forEach((token) => assertContains(reportChart, token, reportChartFile));

[
    'lastRenderHtmlSignature',
    'lastRenderHtml',
    'root.innerHTML !== html'
].forEach((token) => assertContains(county, token, countyFile));

if (pkg.scripts['test:report-performance-caches'] !== 'node scripts/test-report-performance-caches.js') {
    fail('test:report-performance-caches script is missing or changed');
}
if (!String(pkg.scripts['check:performance'] || '').includes('test:report-performance-caches')) {
    fail('check:performance must include report performance cache guard');
}
if (String(pkg.scripts['check:syntax'] || '') !== 'node scripts/test-syntax.js') {
    fail('check:syntax must use recursive syntax coverage');
}

console.log(JSON.stringify({
    ok: true,
    reportRenderCacheTokens: 16,
    appReportCacheTokens: 10,
    compareExamListCacheTokens: 5,
    reportChartCacheTokens: 5,
    countyDomSkipTokens: 3
}, null, 2));
