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
const reportHistoryFile = 'public/assets/js/report-history-runtime.js';
const studentDetailsFile = 'public/assets/js/student-details-render-runtime.js';
const comparisonRenderFile = 'public/assets/js/comparison-render-runtime.js';
const cloudFile = 'public/assets/js/cloud.js';
const countyFile = 'public/assets/js/county-analysis-runtime.js';
const rankingDataServiceFile = 'public/assets/js/ranking-data-service-runtime.js';
const packageFile = 'package.json';

const reportRender = read(reportRenderFile);
const reportChart = read(reportChartFile);
const reportHistory = read(reportHistoryFile);
const studentDetails = read(studentDetailsFile);
const comparisonRender = read(comparisonRenderFile);
const cloud = read(cloudFile);
const county = read(countyFile);
const rankingDataService = read(rankingDataServiceFile);
const app = read('public/assets/js/app.js');
const compareShared = read('public/assets/js/compare-shared-runtime.js');
const pkg = JSON.parse(read(packageFile));

[
    'ReportRenderPerfCache',
    'getReportRenderSignature',
    'getReportStudentCacheKey',
    'function buildStudentInsightModel(student, passedHistory = null)',
    'function renderStudentInsightOverview(model)',
    'function renderStudentActionPlan(model)',
    'function renderStudentSubjectBoard(model)',
    'function renderStudentRealityNote(model)',
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
    'function renderSingleReportCardHTML(stu, mode, options = {})',
    'Array.isArray(options.reportExamHistory)',
    'ReportRenderPerfCache.html.set',
    'buildStudentRankSnapshot',
    'reportRankIndex',
    'readCurrentRank',
    "readCurrentRank(sub, 'class')",
    "readCurrentRank(sub, 'school')",
    "readCurrentRank(sub, 'county')",
    "renderMetricComparison(stuScores[sub], prevSubScore, 'score')",
    "rankValue !== undefined && rankValue !== null && rankValue !== '' && rankValue !== '-'",
    'readHistoricalRankValue',
    'if (showCountyRank) thHtml += `<th>县排</th>`;',
    "showCountyRank ? renderResponsiveTableCell('全县排名', cRank"
].forEach((token) => assertContains(reportRender, token, reportRenderFile));

[
    'getReportDomCache',
    'getCachedStudentReportHistory',
    'getCurrentReportDataFingerprint',
    'currentFingerprintRows',
    'examFingerprintByExam',
    'getReportExamFingerprint',
    'selectedExamIdsSignature',
    'historyByStudent',
    'hydratingKeys',
    'getHistoricalReportExamIds',
    'lastChartScheduleKey',
    'lastStrengthKey',
    'lastCompareHiddenKey',
    'getReportHistoryForQuery',
    "renderSingleReportCardHTML(stu, 'FULL', {",
    'reportExamHistory: getReportHistoryForQuery()',
    'getMissingReportHistoryExamIds'
].forEach((token) => {
    const reportHistoryToken = [
        'getCachedStudentReportHistory',
        'hydratingKeys',
        'getHistoricalReportExamIds',
        'getReportHistoryForQuery',
        "renderSingleReportCardHTML(stu, 'FULL', {",
        'reportExamHistory: getReportHistoryForQuery()',
        'getMissingReportHistoryExamIds'
    ].includes(token);
    assertContains(reportHistoryToken ? reportHistory : app, token, reportHistoryToken ? reportHistoryFile : 'public/assets/js/app.js');
});

[
    'hasCompleteSubjectRankComparisonHistory',
    'shouldDiscoverCloudHistory',
    'window.__REPORT_HISTORY_VERSION',
    'function refreshHydratedStudentReport(stu, selectedExamIds = [], effectiveCurrentExamId = \'\')',
    'await refreshHydratedStudentReport(stu, selectedReportExamIds, effectiveCurrentExamId);',
    'report-history-hydrate:'
].forEach((token) => assertContains(reportHistory, token, reportHistoryFile));

[
    'function scheduleStudentReportCharts(student, history)',
    'await window.ensureReportChartRuntimeLoaded();',
    'function scheduleStudentReportStrengthAnalysis(student, strengthKey)',
    "window.SystemPerformance.scheduleIdle(run, { label: 'report-strength-analysis'",
    'scheduleStudentReportStrengthAnalysis(stu, strengthKey)'
].forEach((token) => assertContains(token === 'scheduleStudentReportStrengthAnalysis(stu, strengthKey)' ? reportHistory : studentDetails, token, token === 'scheduleStudentReportStrengthAnalysis(stu, strengthKey)' ? reportHistoryFile : studentDetailsFile));

[
    "const chartNarrativeHtml = typeof buildChartNarrative === 'function' ? buildChartNarrative(reportStu) : '';"
].forEach((token) => assertContains(reportRender, token, reportRenderFile));

const doQueryStart = reportHistory.indexOf('async function doQuery');
const doQueryEnd = reportHistory.length;
const doQuerySource = doQueryStart >= 0 && doQueryEnd > doQueryStart
    ? reportHistory.slice(doQueryStart, doQueryEnd)
    : '';
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
    'return write(state.history, key, value, HISTORY_TTL_MS, { clone: false });',
    "if (typeof value !== 'object') return value;"
].forEach((token) => assertContains(read('public/assets/js/report-performance-runtime.js'), token, 'public/assets/js/report-performance-runtime.js'));

const historyStart = comparisonRender.indexOf('function getStudentExamHistory(student)');
const historyEnd = comparisonRender.indexOf('// 🟢 [新增]：生成进退步胶囊标签', historyStart);
const historySource = historyStart >= 0 && historyEnd > historyStart ? comparisonRender.slice(historyStart, historyEnd) : '';
if (!historySource || historySource.includes('getReportSubjectSortedScores(')) {
    fail('student exam history should not precompute subject percentile score arrays');
}
const historyManualFilter = historySource.indexOf('if (manualExams.length > 0');
const historyFingerprintRead = historySource.indexOf('const examFingerprint = getReportExamFingerprint(exam, examData);');
if (historyManualFilter < 0 || historyFingerprintRead < 0 || historyManualFilter > historyFingerprintRead) {
    fail('student exam history must filter unselected exams before computing full-data fingerprints');
}
[
    'hasUsableStoredHistoryRanks',
    'createHistoryStudentView',
    'getCachedHistoryExamStudent(examData, student, examFingerprint)'
].forEach((token) => assertContains(historySource, token, comparisonRenderFile));
[
    'examStudentLookup: new Map()',
    'function getCachedHistoryExamStudent(examData, student, examFingerprint = \'\')',
    'ReportHistoryPerfCache.examStudentLookup.set(lookupKey, found || null)'
].forEach((token) => assertContains(app, token, 'public/assets/js/app.js'));

const previousRecordStart = comparisonRender.indexOf('function findPreviousRecord(student)');
const previousRecordEnd = comparisonRender.indexOf('function getStudentExamHistory(student)', previousRecordStart);
const previousRecordSource = previousRecordStart >= 0 && previousRecordEnd > previousRecordStart
    ? comparisonRender.slice(previousRecordStart, previousRecordEnd)
    : '';
if (!previousRecordSource || !previousRecordSource.includes('getCurrentReportDataFingerprint()')) {
    fail('findPreviousRecord should reuse cached current report fingerprint');
}
if (!previousRecordSource || previousRecordSource.includes('computeExamDataFingerprint(examData)')) {
    fail('findPreviousRecord should use cached historical exam fingerprints');
}
if (!historySource || historySource.includes('computeExamDataFingerprint(examData)')) {
    fail('student exam history should use cached historical exam fingerprints');
}

[
    'getHistoryPayloadFingerprint',
    "return [String(examId || '').trim(), String(updatedAt || '').trim(), rowCount].join(':');"
].forEach((token) => assertContains(cloud, token, cloudFile));

[
    'county: h.rankCounty || h.subjectRanks?.total?.county ||',
    'examIds: missingHistoricalExamIds',
    'shouldDiscoverCloudHistory',
    'window.SystemPerformance.scheduleTask'
].forEach((token) => assertContains(reportHistory, token, reportHistoryFile));

const cloudHistoryStart = cloud.indexOf('fetchStudentExamHistory: async function');
const cloudHistoryEnd = cloud.indexOf('// 届别考试补拉运行时', cloudHistoryStart);
const cloudHistorySource = cloudHistoryStart >= 0 && cloudHistoryEnd > cloudHistoryStart
    ? cloud.slice(cloudHistoryStart, cloudHistoryEnd)
    : '';
if (!cloudHistorySource || cloudHistorySource.includes('computeExamDataFingerprint(')) {
    fail('student report cloud history fetch should not compute full exam fingerprints during query hydration');
}
[
    'fetchStudentExamHistory: async function (student, options = {})',
    'const requestedExamIds = Array.from(new Set(',
    'const requestedExamIdSet = new Set(requestedExamIds);',
    'const targetSchool = String(student.school ||',
    'const targetClassRaw = String(student.class ||',
    'const targetStudentId = String(student.id || student.examNo ||',
    'const currentExamId = String(options?.currentExamId ||',
    'STUDENT_HISTORY_INDEX_PREFIX',
    'readIndexedHistory',
    'keyIn: examKeys',
    'const missingRequestedExamIds = requestedExamIds',
    'keyIn: fallbackExamIds',
    'const examEquivalentCache = new Map();',
    'const isExamEquivalent = (left, right) => {',
    'examEquivalentCache.set(cacheKey, result);',
    'const isRequestedExam = (examId) => {',
    'const isCurrentExam = (examId) => currentExamId && isExamEquivalent(examId, currentExamId);',
    'const findStudentInRows = (list, scopedToTargetSchool = false) => {',
    'const directSchool = schools[targetSchool];',
    'const buildHistoryRankSnapshot = (payload, match) => {',
    'window.RankingDataService.buildStudentRankSnapshot(',
    'const fillHistoryRanks = (payload, match) => {',
    'const hasCompleteHistoryComparisonRanks = (entry) => {',
    'getCountyRankFallback',
    'countyRankFallbackCache',
    '_studentHistoryPayloadCache',
    'parseHistoryPayloadRow',
    'cache.size > 12',
    'buildStudentHistoryIndexRowFromEntry',
    'historyIndexBackfillRows',
    "upsertSystemData(historyIndexBackfillRows).catch",
    'const scoreCounts = new Map();',
    'Array.from(scoreCounts.keys()).sort((a, b) => b - a).forEach(value => {',
    'subjectCache.set(subjectKey, rankByScore);',
    'const subjectRanks = { ...(match.ranks || {}) };',
    'const ranks = { ...(subjectRanks[subject] || {}) };',
    'const readExamSortTime = (exam) => {',
    'normalizedCohort: normalizeCohortId(exam?.cohort || exam?.meta?.cohort || examId)',
    'const localHistoryExamKeys = localHistory',
    'const indexedIncompleteKeys = indexedResult.incompleteKeys || new Set();',
    'indexedIncompleteKeys.size === 0',
    '!Array.from(indexedCoveredKeys).some(historyId => isExamEquivalent(historyId, rowKey))',
    "return { success: true, data: indexedHistory, source: 'student-history-index' };",
    'const dedupedHistory = Array.from(history.reduce((map, entry) => {'
].forEach((token) => assertContains(cloudHistorySource, token, cloudFile));
if (cloudHistorySource.includes('queueExamHistoryIndexBackfill')) {
    fail('single-student report hydration must not queue a full-exam student index backfill');
}

[
    'STUDENT_HISTORY_INDEX_PREFIX',
    'STUDENT_HISTORY_INDEX_UPLOAD_CHUNK_SIZE',
    'buildStudentHistoryIndexRowsForExam',
    'buildStudentHistoryIndexRowsForBundle',
    'uploadStudentHistoryIndexRows',
    'scheduleStudentHistoryIndexUpload',
    'i += STUDENT_HISTORY_INDEX_UPLOAD_CHUNK_SIZE',
    'student history index backfill skipped',
    'legacyHistoryIndexRows',
    'COHORT_EXAM_META_CACHE_MS',
    'const COHORT_EXAM_META_CACHE_MS = 2 * 60 * 1000',
    'function clearCohortExamMetaMemoryCache(manager, cohortId = \'\')',
    'clearCohortExamMetaMemoryCache(',
    'COHORT_EXAM_LATEST_META_LIMIT',
    'fetchCohortExamMetaRows',
    'offset',
    'writeCachedCohortExamMetaRows'
].forEach((token) => assertContains(read('public/assets/js/cloud-workspace-runtime.js'), token, 'public/assets/js/cloud-workspace-runtime.js'));
if (read('public/assets/js/cloud-workspace-runtime.js').includes("currentExamId && String(examRow?.key || '').trim() !== currentExamId")) {
    fail('workspace student history index should cover every split exam, not only the current exam');
}

[
    'totalRanks.county ?? row?.countyRank ?? row?.rankCounty ?? null',
    'const tuple = [ranks.class ?? null, ranks.school ?? null, ranks.township ?? null, ranks.county ?? null];',
    'if (totalRanks[3] !== null && totalRanks[3] !== undefined) {',
    'if (tuple[3] !== null && tuple[3] !== undefined) rankMap.county = tuple[3];'
].forEach((token) => assertContains(cloud, token, cloudFile));

[
    'ReportChartPerfCache',
    'getReportChartSignature',
    'getCachedChartComparisonStudent',
    'getScoreStatsForRows',
    'getPercentileFromStats'
].forEach((token) => assertContains(reportChart, token, reportChartFile));

[
    'const countyScopeCache = new Map();',
    'if (countyScopeCache.has(cacheKey)) return countyScopeCache.get(cacheKey);',
    'countyScopeCache.set(cacheKey, result);',
    'if (!hasCountyScope(scopeRows, options)) return false;',
    'scopedOptions = { ...options, forceCounty: true };'
].forEach((token) => assertContains(rankingDataService, token, rankingDataServiceFile));

[
    'renderCache: new Map()',
    'function getCountyRenderCache(activeId)',
    "clearCountyRenderCache('county-school-horizontal')",
    'renderCache.fastSignature === fastSignature',
    'lastRenderHtmlSignature',
    'lastRenderHtml',
    'root.innerHTML !== html',
    'function precomputeCountyTeacherThresholdLines',
    'thresholdLinesBySubject',
    'summarizeCountyTeacherScores(data.subject, data.students, schoolRows, thresholdLinesBySubject.get(normalizedSubject))'
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
    countyDomSkipTokens: 3,
    cloudCountyRankTokens: 10
}, null, 2));
