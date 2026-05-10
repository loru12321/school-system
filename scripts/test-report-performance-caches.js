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
const countyFile = 'public/assets/js/county-analysis-runtime.js';
const packageFile = 'package.json';

const reportRender = read(reportRenderFile);
const reportChart = read(reportChartFile);
const county = read(countyFile);
const pkg = JSON.parse(read(packageFile));

[
    'ReportRenderPerfCache',
    'getReportRenderSignature',
    'getReportStudentCacheKey',
    'getCachedComparisonStudentView',
    'getCachedCloudCompareHint',
    'getCachedPreviousRecord',
    'getCachedStudentExamHistory',
    'getCachedRankScope',
    'getCachedCountyScopeMap',
    'getCachedSchoolCandidates',
    'cacheableReportHtml',
    'ReportRenderPerfCache.html.set'
].forEach((token) => assertContains(reportRender, token, reportRenderFile));

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
if (!String(pkg.scripts['check:syntax'] || '').includes('scripts/test-report-performance-caches.js')) {
    fail('check:syntax must syntax-check report performance cache guard');
}

console.log(JSON.stringify({
    ok: true,
    reportRenderCacheTokens: 12,
    reportChartCacheTokens: 5,
    countyDomSkipTokens: 3
}, null, 2));
