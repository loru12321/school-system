const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../src/index.html');
const runtimePath = path.resolve(__dirname, '../public/assets/js/auth-state-runtime.js');
const workspaceRuntimePath = path.resolve(__dirname, '../public/assets/js/workspace-state-runtime.js');
const examRuntimePath = path.resolve(__dirname, '../public/assets/js/exam-state-runtime.js');
const schoolRuntimePath = path.resolve(__dirname, '../public/assets/js/school-state-runtime.js');
const teacherRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-state-runtime.js');
const dataRuntimePath = path.resolve(__dirname, '../public/assets/js/data-state-runtime.js');
const supportRuntimePath = path.resolve(__dirname, '../public/assets/js/support-state-runtime.js');
const progressRuntimePath = path.resolve(__dirname, '../public/assets/js/progress-state-runtime.js');
const reportSessionRuntimePath = path.resolve(__dirname, '../public/assets/js/report-session-state-runtime.js');
const compareSessionRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-session-state-runtime.js');
const compareResultRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-result-state-runtime.js');
const compareSummaryRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-summary-state-runtime.js');
const compareCloudContextRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-cloud-context-runtime.js');
const compareExamSyncRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-exam-sync-runtime.js');
const townSubmoduleCompareStateRuntimePath = path.resolve(__dirname, '../public/assets/js/town-submodule-compare-state-runtime.js');
const townSubmoduleCompareRuntimePath = path.resolve(__dirname, '../public/assets/js/town-submodule-compare-runtime.js');
const bootRuntimePath = path.resolve(__dirname, '../public/assets/js/boot-runtime.js');
const accountAdminRuntimePath = path.resolve(__dirname, '../public/assets/js/account-admin-runtime.js');
const historyCompareRuntimePath = path.resolve(__dirname, '../public/assets/js/history-compare-runtime.js');
const perfMobileRuntimePath = path.resolve(__dirname, '../public/assets/js/perf-mobile-runtime.js');
const mobileManagerRuntimePath = path.resolve(__dirname, '../public/assets/js/mobile-manager.js');
const dataManagerSqlRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-sql.js');
const reportRenderRuntimePath = path.resolve(__dirname, '../public/assets/js/report-render-runtime.js');
const studentCompareGenerateRuntimePath = path.resolve(__dirname, '../public/assets/js/student-compare-generate-runtime.js');
const studentCompareResultRuntimePath = path.resolve(__dirname, '../public/assets/js/student-compare-result-runtime.js');
const studentCompareCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/student-compare-cloud-runtime.js');
const teacherCompareResultRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-compare-result-runtime.js');
const teacherCompareCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-compare-cloud-runtime.js');
const macroCompareResultRuntimePath = path.resolve(__dirname, '../public/assets/js/macro-compare-result-runtime.js');
const macroCompareCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/macro-compare-cloud-runtime.js');

assert.ok(fs.existsSync(runtimePath), 'auth-state-runtime.js should exist');
assert.ok(fs.existsSync(workspaceRuntimePath), 'workspace-state-runtime.js should exist');
assert.ok(fs.existsSync(examRuntimePath), 'exam-state-runtime.js should exist');
assert.ok(fs.existsSync(schoolRuntimePath), 'school-state-runtime.js should exist');
assert.ok(fs.existsSync(teacherRuntimePath), 'teacher-state-runtime.js should exist');
assert.ok(fs.existsSync(dataRuntimePath), 'data-state-runtime.js should exist');
assert.ok(fs.existsSync(supportRuntimePath), 'support-state-runtime.js should exist');
assert.ok(fs.existsSync(progressRuntimePath), 'progress-state-runtime.js should exist');
assert.ok(fs.existsSync(reportSessionRuntimePath), 'report-session-state-runtime.js should exist');
assert.ok(fs.existsSync(compareSessionRuntimePath), 'compare-session-state-runtime.js should exist');
assert.ok(fs.existsSync(compareResultRuntimePath), 'compare-result-state-runtime.js should exist');
assert.ok(fs.existsSync(compareSummaryRuntimePath), 'compare-summary-state-runtime.js should exist');
assert.ok(fs.existsSync(compareCloudContextRuntimePath), 'compare-cloud-context-runtime.js should exist');
assert.ok(fs.existsSync(compareExamSyncRuntimePath), 'compare-exam-sync-runtime.js should exist');
assert.ok(fs.existsSync(townSubmoduleCompareStateRuntimePath), 'town-submodule-compare-state-runtime.js should exist');
assert.ok(fs.existsSync(townSubmoduleCompareRuntimePath), 'town-submodule-compare-runtime.js should exist');
assert.ok(fs.existsSync(bootRuntimePath), 'boot-runtime.js should exist');
assert.ok(fs.existsSync(accountAdminRuntimePath), 'account-admin-runtime.js should exist');
assert.ok(fs.existsSync(historyCompareRuntimePath), 'history-compare-runtime.js should exist');
assert.ok(fs.existsSync(perfMobileRuntimePath), 'perf-mobile-runtime.js should exist');
assert.ok(fs.existsSync(mobileManagerRuntimePath), 'mobile-manager.js should exist');
assert.ok(fs.existsSync(dataManagerSqlRuntimePath), 'data-manager-sql.js should exist');
assert.ok(fs.existsSync(reportRenderRuntimePath), 'report-render-runtime.js should exist');
assert.ok(fs.existsSync(studentCompareGenerateRuntimePath), 'student-compare-generate-runtime.js should exist');
assert.ok(fs.existsSync(studentCompareResultRuntimePath), 'student-compare-result-runtime.js should exist');
assert.ok(fs.existsSync(studentCompareCloudRuntimePath), 'student-compare-cloud-runtime.js should exist');
assert.ok(fs.existsSync(teacherCompareResultRuntimePath), 'teacher-compare-result-runtime.js should exist');
assert.ok(fs.existsSync(teacherCompareCloudRuntimePath), 'teacher-compare-cloud-runtime.js should exist');
assert.ok(fs.existsSync(macroCompareResultRuntimePath), 'macro-compare-result-runtime.js should exist');
assert.ok(fs.existsSync(macroCompareCloudRuntimePath), 'macro-compare-cloud-runtime.js should exist');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const bootRuntime = fs.readFileSync(bootRuntimePath, 'utf8');
const appSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app.js'), 'utf8');
const initSupabaseMatches = bootRuntime.match(/window\.initSupabase\s*=\s*function/g) || [];
const supabaseUrlAssignments = bootRuntime.match(/window\.SUPABASE_URL\s*=/g) || [];
const supabaseKeyAssignments = bootRuntime.match(/window\.SUPABASE_KEY\s*=/g) || [];
const gatewayUrlAssignments = bootRuntime.match(/window\.EDGE_GATEWAY_URL\s*=/g) || [];
const switchTabDefinitions = appSource.match(/function\s+switchTab\s*\(/g) || [];
const switchTabOverrides = appSource.match(/switchTab\s*=\s*function\s*\(/g) || [];
const authStateRef = './assets/js/auth-state-runtime.js';
const workspaceStateRef = './assets/js/workspace-state-runtime.js';
const examStateRef = './assets/js/exam-state-runtime.js';
const schoolStateRef = './assets/js/school-state-runtime.js';
const teacherStateRef = './assets/js/teacher-state-runtime.js';
const dataStateRef = './assets/js/data-state-runtime.js';
const supportStateRef = './assets/js/support-state-runtime.js';
const progressStateRef = './assets/js/progress-state-runtime.js';
const reportSessionStateRef = './assets/js/report-session-state-runtime.js';
const compareSessionStateRef = './assets/js/compare-session-state-runtime.js';
const compareResultStateRef = './assets/js/compare-result-state-runtime.js';
const compareSummaryStateRef = './assets/js/compare-summary-state-runtime.js';
const compareCloudContextRef = './assets/js/compare-cloud-context-runtime.js';
const compareExamSyncRef = './assets/js/compare-exam-sync-runtime.js';
const townSubmoduleCompareStateRef = './assets/js/town-submodule-compare-state-runtime.js';
const townSubmoduleCompareRef = './assets/js/town-submodule-compare-runtime.js';
const compareSelectorsRef = './assets/js/compare-selectors-runtime.js';
const progressAnalysisRef = './assets/js/progress-analysis-runtime.js';
const teacherAnalysisMainRef = './assets/js/teacher-analysis-main-runtime.js';
const cloudWorkspaceRef = './assets/js/cloud-workspace-runtime.js';
const cloudRef = './assets/js/cloud.js';
const appRef = './assets/js/app.js';
const accountAdminRef = './assets/js/account-admin-runtime.js';
const historyCompareRef = './assets/js/history-compare-runtime.js';
const perfMobileRef = './assets/js/perf-mobile-runtime.js';
const mobileManagerRef = './assets/js/mobile-manager.js';
const dataManagerSqlRef = './assets/js/data-manager-sql.js';
const reportRenderRef = './assets/js/report-render-runtime.js';
const studentCompareGenerateRef = './assets/js/student-compare-generate-runtime.js';
const studentCompareResultRef = './assets/js/student-compare-result-runtime.js';
const studentCompareCloudRef = './assets/js/student-compare-cloud-runtime.js';
const teacherCompareResultRef = './assets/js/teacher-compare-result-runtime.js';
const teacherCompareCloudRef = './assets/js/teacher-compare-cloud-runtime.js';
const macroCompareResultRef = './assets/js/macro-compare-result-runtime.js';
const macroCompareCloudRef = './assets/js/macro-compare-cloud-runtime.js';
const holographicRef = './assets/js/holographic-student-3d.js';
const predictiveRef = './assets/js/predictive-simulation-lab.js';
const metaverseRef = './assets/js/metaverse-collab-space.js';
const emotionalRef = './assets/js/emotional-ai-monitor.js';
const bootRuntimeRef = './assets/js/boot-runtime.js';
const tablerIconsRef = '/assets/vendor/tabler-icons/tabler-icons.min.css';
const supabaseVendorRef = './assets/vendor/supabase/supabase.min.js';
const lzStringVendorRef = './assets/vendor/lz-string/lz-string.min.js';
const cryptoJsVendorRef = './assets/vendor/crypto-js/crypto-js.min.js';
const xlsxVendorRef = './assets/vendor/xlsx/xlsx.full.min.js';
const alpineVendorRef = './assets/vendor/alpinejs/cdn.min.js';
const chartVendorRef = './assets/vendor/chart.js/chart.umd.min.js';
const jszipVendorRef = './assets/vendor/jszip/jszip.min.js';
const pptxgenVendorRef = './assets/vendor/pptxgenjs/pptxgen.min.js';
const alasqlVendorRef = './assets/vendor/alasql/alasql.min.js';
const sweetalertVendorRef = './assets/vendor/sweetalert2/sweetalert2.all.min.js';
const jspdfVendorRef = './assets/vendor/jspdf/jspdf.umd.min.js';
const html2canvasVendorRef = './assets/vendor/html2canvas/html2canvas.min.js';

function findScriptTag(html, src) {
    const normalizedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(new RegExp(`<script[^>]*src=["']${normalizedSrc}[^"']*["'][^>]*>`, 'i'));
    return match ? match[0] : '';
}

const authStateIndex = indexHtml.indexOf(authStateRef);
const workspaceStateIndex = indexHtml.indexOf(workspaceStateRef);
const examStateIndex = indexHtml.indexOf(examStateRef);
const schoolStateIndex = indexHtml.indexOf(schoolStateRef);
const teacherStateIndex = indexHtml.indexOf(teacherStateRef);
const dataStateIndex = indexHtml.indexOf(dataStateRef);
const supportStateIndex = indexHtml.indexOf(supportStateRef);
const progressStateIndex = indexHtml.indexOf(progressStateRef);
const reportSessionStateIndex = indexHtml.indexOf(reportSessionStateRef);
const compareSessionStateIndex = indexHtml.indexOf(compareSessionStateRef);
const compareResultStateIndex = indexHtml.indexOf(compareResultStateRef);
const compareSummaryStateIndex = indexHtml.indexOf(compareSummaryStateRef);
const compareCloudContextIndex = indexHtml.indexOf(compareCloudContextRef);
const compareExamSyncIndex = indexHtml.indexOf(compareExamSyncRef);
const townSubmoduleCompareStateIndex = indexHtml.indexOf(townSubmoduleCompareStateRef);
const townSubmoduleCompareIndex = indexHtml.indexOf(townSubmoduleCompareRef);
const compareSelectorsIndex = indexHtml.indexOf(compareSelectorsRef);
const progressAnalysisIndex = indexHtml.indexOf(progressAnalysisRef);
const cloudIndex = indexHtml.indexOf(cloudRef);
const cloudWorkspaceIndex = indexHtml.indexOf(cloudWorkspaceRef);
const appIndex = indexHtml.indexOf(appRef);
const bootRuntimeIndex = indexHtml.indexOf(bootRuntimeRef);
const accountAdminIndex = indexHtml.indexOf(accountAdminRef);
const historyCompareIndex = indexHtml.indexOf(historyCompareRef);
const perfMobileIndex = indexHtml.indexOf(perfMobileRef);

assert.ok(authStateIndex >= 0, 'index.html should load auth-state-runtime.js');
assert.ok(bootRuntimeIndex >= 0, 'index.html should load boot-runtime.js');
assert.ok(workspaceStateIndex >= 0, 'index.html should load workspace-state-runtime.js');
assert.ok(examStateIndex >= 0, 'index.html should load exam-state-runtime.js');
assert.ok(schoolStateIndex >= 0, 'index.html should load school-state-runtime.js');
assert.ok(teacherStateIndex >= 0, 'index.html should load teacher-state-runtime.js');
assert.ok(dataStateIndex >= 0, 'index.html should load data-state-runtime.js');
assert.ok(supportStateIndex >= 0, 'index.html should load support-state-runtime.js');
assert.ok(progressStateIndex >= 0, 'index.html should load progress-state-runtime.js');
assert.ok(reportSessionStateIndex >= 0, 'index.html should load report-session-state-runtime.js');
assert.ok(compareSessionStateIndex >= 0, 'index.html should load compare-session-state-runtime.js');
assert.ok(compareResultStateIndex >= 0, 'index.html should load compare-result-state-runtime.js');
assert.ok(compareSummaryStateIndex >= 0, 'index.html should load compare-summary-state-runtime.js');
assert.ok(compareCloudContextIndex >= 0, 'index.html should load compare-cloud-context-runtime.js');
assert.ok(compareExamSyncIndex >= 0, 'index.html should load compare-exam-sync-runtime.js');
assert.ok(townSubmoduleCompareStateIndex >= 0, 'index.html should load town-submodule-compare-state-runtime.js');
assert.ok(townSubmoduleCompareIndex >= 0, 'index.html should load town-submodule-compare-runtime.js');
assert.ok(compareSelectorsIndex >= 0, 'index.html should load compare-selectors-runtime.js');
assert.ok(progressAnalysisIndex >= 0, 'index.html should load progress-analysis-runtime.js');
assert.ok(cloudIndex >= 0, 'index.html should load cloud.js');
assert.ok(cloudWorkspaceIndex >= 0, 'index.html should load cloud-workspace-runtime.js');
assert.ok(appIndex >= 0, 'index.html should load app.js');
assert.ok(bootRuntime.includes(teacherAnalysisMainRef), 'boot-runtime.js should reference teacher-analysis-main-runtime.js for lazy loading');
assert.strictEqual(initSupabaseMatches.length, 1, 'boot-runtime.js should define initSupabase exactly once');
assert.strictEqual(supabaseUrlAssignments.length, 1, 'boot-runtime.js should resolve SUPABASE_URL exactly once');
assert.strictEqual(supabaseKeyAssignments.length, 1, 'boot-runtime.js should resolve SUPABASE_KEY exactly once');
assert.strictEqual(gatewayUrlAssignments.length, 1, 'boot-runtime.js should resolve EDGE_GATEWAY_URL exactly once');
assert.strictEqual(switchTabDefinitions.length, 1, 'app.js should define switchTab exactly once');
assert.strictEqual(switchTabOverrides.length, 0, 'app.js should not reassign switchTab after definition');

[
    bootRuntimeRef,
    supabaseVendorRef,
    lzStringVendorRef,
    cryptoJsVendorRef,
    xlsxVendorRef,
    alpineVendorRef,
    chartVendorRef,
    jszipVendorRef,
    pptxgenVendorRef,
    alasqlVendorRef,
    sweetalertVendorRef,
    jspdfVendorRef,
    html2canvasVendorRef,
    authStateRef,
    workspaceStateRef,
    examStateRef,
    schoolStateRef,
    teacherStateRef,
    dataStateRef,
    supportStateRef,
    progressStateRef,
    reportSessionStateRef,
    compareSessionStateRef,
    compareResultStateRef,
    compareSummaryStateRef,
    cloudRef,
    cloudWorkspaceRef,
    appRef,
    compareCloudContextRef,
    compareExamSyncRef,
    compareSelectorsRef,
    progressAnalysisRef,
    townSubmoduleCompareStateRef,
    townSubmoduleCompareRef
].forEach((src) => {
    const scriptTag = findScriptTag(indexHtml, src);
    assert.ok(scriptTag, `index.html should contain a script tag for ${src}`);
    assert.ok(/\sdefer(\s|>|=)/i.test(scriptTag), `${src} should load with defer`);
});

assert.ok(indexHtml.includes(tablerIconsRef), 'index.html should load local tabler icons CSS');

[
    accountAdminRef,
    historyCompareRef,
    perfMobileRef,
    mobileManagerRef,
    dataManagerSqlRef,
    reportRenderRef,
    teacherAnalysisMainRef,
    studentCompareGenerateRef,
    studentCompareResultRef,
    studentCompareCloudRef,
    teacherCompareResultRef,
    teacherCompareCloudRef,
    macroCompareResultRef,
    macroCompareCloudRef,
    holographicRef,
    predictiveRef,
    metaverseRef,
    emotionalRef
].forEach((src) => {
    assert.strictEqual(indexHtml.includes(src), false, `${src} should not be eagerly loaded on boot`);
});
assert.ok(authStateIndex < workspaceStateIndex, 'auth-state-runtime.js must load before workspace-state-runtime.js');
assert.ok(workspaceStateIndex < examStateIndex, 'workspace-state-runtime.js must load before exam-state-runtime.js');
assert.ok(examStateIndex < schoolStateIndex, 'exam-state-runtime.js must load before school-state-runtime.js');
assert.ok(schoolStateIndex < teacherStateIndex, 'school-state-runtime.js must load before teacher-state-runtime.js');
assert.ok(teacherStateIndex < dataStateIndex, 'teacher-state-runtime.js must load before data-state-runtime.js');
assert.ok(dataStateIndex < supportStateIndex, 'data-state-runtime.js must load before support-state-runtime.js');
assert.ok(supportStateIndex < progressStateIndex, 'support-state-runtime.js must load before progress-state-runtime.js');
assert.ok(progressStateIndex < reportSessionStateIndex, 'progress-state-runtime.js must load before report-session-state-runtime.js');
assert.ok(reportSessionStateIndex < compareSessionStateIndex, 'report-session-state-runtime.js must load before compare-session-state-runtime.js');
assert.ok(compareSessionStateIndex < compareResultStateIndex, 'compare-session-state-runtime.js must load before compare-result-state-runtime.js');
assert.ok(compareResultStateIndex < compareSummaryStateIndex, 'compare-result-state-runtime.js must load before compare-summary-state-runtime.js');
assert.ok(compareExamSyncIndex < compareSelectorsIndex, 'compare-exam-sync-runtime.js must load before compare-selectors-runtime.js');
assert.ok(compareExamSyncIndex < progressAnalysisIndex, 'compare-exam-sync-runtime.js must load before progress-analysis-runtime.js');
assert.ok(compareSummaryStateIndex < townSubmoduleCompareStateIndex, 'compare-summary-state-runtime.js must load before town-submodule-compare-state-runtime.js');
assert.ok(townSubmoduleCompareStateIndex < townSubmoduleCompareIndex, 'town-submodule-compare-state-runtime.js must load before town-submodule-compare-runtime.js');
assert.ok(progressStateIndex < cloudIndex, 'progress-state-runtime.js must load before cloud.js');
assert.ok(progressStateIndex < cloudWorkspaceIndex, 'progress-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(progressStateIndex < appIndex, 'progress-state-runtime.js must load before app.js');
assert.ok(reportSessionStateIndex < cloudIndex, 'report-session-state-runtime.js must load before cloud.js');
assert.ok(reportSessionStateIndex < cloudWorkspaceIndex, 'report-session-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(reportSessionStateIndex < appIndex, 'report-session-state-runtime.js must load before app.js');
assert.ok(compareSessionStateIndex < cloudIndex, 'compare-session-state-runtime.js must load before cloud.js');
assert.ok(compareSessionStateIndex < cloudWorkspaceIndex, 'compare-session-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(compareSessionStateIndex < appIndex, 'compare-session-state-runtime.js must load before app.js');
assert.ok(compareResultStateIndex < cloudIndex, 'compare-result-state-runtime.js must load before cloud.js');
assert.ok(compareResultStateIndex < cloudWorkspaceIndex, 'compare-result-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(compareResultStateIndex < appIndex, 'compare-result-state-runtime.js must load before app.js');
assert.ok(compareSummaryStateIndex < cloudIndex, 'compare-summary-state-runtime.js must load before cloud.js');
assert.ok(compareSummaryStateIndex < cloudWorkspaceIndex, 'compare-summary-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(compareSummaryStateIndex < appIndex, 'compare-summary-state-runtime.js must load before app.js');
assert.ok(supportStateIndex < cloudIndex, 'support-state-runtime.js must load before cloud.js');
assert.ok(supportStateIndex < cloudWorkspaceIndex, 'support-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(supportStateIndex < appIndex, 'support-state-runtime.js must load before app.js');
assert.ok(dataStateIndex < cloudIndex, 'data-state-runtime.js must load before cloud.js');
assert.ok(dataStateIndex < cloudWorkspaceIndex, 'data-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(dataStateIndex < appIndex, 'data-state-runtime.js must load before app.js');
assert.ok(teacherStateIndex < cloudIndex, 'teacher-state-runtime.js must load before cloud.js');
assert.ok(teacherStateIndex < cloudWorkspaceIndex, 'teacher-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(teacherStateIndex < appIndex, 'teacher-state-runtime.js must load before app.js');
assert.ok(schoolStateIndex < cloudIndex, 'school-state-runtime.js must load before cloud.js');
assert.ok(schoolStateIndex < cloudWorkspaceIndex, 'school-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(schoolStateIndex < appIndex, 'school-state-runtime.js must load before app.js');
assert.ok(examStateIndex < cloudIndex, 'exam-state-runtime.js must load before cloud.js');
assert.ok(examStateIndex < cloudWorkspaceIndex, 'exam-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(examStateIndex < appIndex, 'exam-state-runtime.js must load before app.js');
assert.ok(workspaceStateIndex < cloudIndex, 'workspace-state-runtime.js must load before cloud.js');
assert.ok(workspaceStateIndex < cloudWorkspaceIndex, 'workspace-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(workspaceStateIndex < appIndex, 'workspace-state-runtime.js must load before app.js');
assert.ok(bootRuntimeIndex < authStateIndex, 'boot-runtime.js should load before auth-state-runtime.js');
assert.ok(authStateIndex < cloudWorkspaceIndex, 'auth-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(authStateIndex < appIndex, 'auth-state-runtime.js must load before app.js');

console.log('runtime order tests passed');
