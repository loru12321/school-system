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
const cloudApiRuntimePath = path.resolve(__dirname, '../public/assets/js/cloud-api-runtime.js');
const cloudConnectionRuntimePath = path.resolve(__dirname, '../public/assets/js/cloud-connection-runtime.js');
const systemPerformanceRuntimePath = path.resolve(__dirname, '../public/assets/js/system-performance-runtime.js');
const dataCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/data-cloud-runtime.js');
const issueManagerRuntimePath = path.resolve(__dirname, '../public/assets/js/issue-manager-runtime.js');
const packagerRuntimePath = path.resolve(__dirname, '../public/assets/js/packager-runtime.js');
const helpSystemRuntimePath = path.resolve(__dirname, '../public/assets/js/help-system-runtime.js');
const loggerRuntimePath = path.resolve(__dirname, '../public/assets/js/logger-runtime.js');
const workerApiRuntimePath = path.resolve(__dirname, '../public/assets/js/worker-api-runtime.js');
const accountManagerRuntimePath = path.resolve(__dirname, '../public/assets/js/account-manager-runtime.js');
const dataManagerTeacherRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-teacher-runtime.js');
const dataManagerStudentRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-student-runtime.js');
const dataManagerArchiveRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-archive-runtime.js');
const dataManagerGrade9TemplateRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-grade9-template-runtime.js');
const dataManagerParamsRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-params-runtime.js');
const dataManagerTargetsRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-targets-runtime.js');
const dataManagerSchoolAliasRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-school-alias-runtime.js');
const dataManagerSaveSyncRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-save-sync-runtime.js');
const dataManagerHistoryRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-history-runtime.js');
const dataManagerTabRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-tab-runtime.js');
const compareCloudContextRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-cloud-context-runtime.js');
const compareExamSyncRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-exam-sync-runtime.js');
const townSubmoduleCompareStateRuntimePath = path.resolve(__dirname, '../public/assets/js/town-submodule-compare-state-runtime.js');
const townSubmoduleCompareRuntimePath = path.resolve(__dirname, '../public/assets/js/town-submodule-compare-runtime.js');
const bootRuntimePath = path.resolve(__dirname, '../public/assets/js/boot-runtime.js');
const accountAdminRuntimePath = path.resolve(__dirname, '../public/assets/js/account-admin-runtime.js');
const historyCompareRuntimePath = path.resolve(__dirname, '../public/assets/js/history-compare-runtime.js');
const perfMobileRuntimePath = path.resolve(__dirname, '../public/assets/js/perf-mobile-runtime.js');
const shellRuntimePath = path.resolve(__dirname, '../public/assets/js/shell-runtime.js');
const shellPolishRuntimePath = path.resolve(__dirname, '../public/assets/js/shell-polish-runtime.js');
const moduleEntryRuntimePath = path.resolve(__dirname, '../public/assets/js/module-entry-runtime.js');
const rankingDataServiceRuntimePath = path.resolve(__dirname, '../public/assets/js/ranking-data-service-runtime.js');
const studentJumpRuntimePath = path.resolve(__dirname, '../public/assets/js/student-jump-runtime.js');
const singleSchoolEvalRuntimePath = path.resolve(__dirname, '../public/assets/js/single-school-eval-runtime.js');
const aiHubRuntimePath = path.resolve(__dirname, '../public/assets/js/ai-hub-runtime.js');
const schoolProfileRuntimePath = path.resolve(__dirname, '../public/assets/js/school-profile-runtime.js');
const teachingManagementRuntimePath = path.resolve(__dirname, '../public/assets/js/teaching-management-runtime.js');
const teacherAnalysisCoreRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-analysis-core-runtime.js');
const teacherAnalysisUiRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-analysis-ui-runtime.js');
const teacherAnalysisBridgeRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-analysis-bridge-runtime.js');
const mobileManagerRuntimePath = path.resolve(__dirname, '../public/assets/js/mobile-manager.js');
const dataManagerSqlRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-sql.js');
const reportRenderRuntimePath = path.resolve(__dirname, '../public/assets/js/report-render-runtime.js');
const reportChartRuntimePath = path.resolve(__dirname, '../public/assets/js/report-chart-runtime.js');
const reportExportRuntimePath = path.resolve(__dirname, '../public/assets/js/report-export-runtime.js');
const reportAiRuntimePath = path.resolve(__dirname, '../public/assets/js/report-ai-runtime.js');
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
assert.ok(fs.existsSync(cloudApiRuntimePath), 'cloud-api-runtime.js should exist');
assert.ok(fs.existsSync(cloudConnectionRuntimePath), 'cloud-connection-runtime.js should exist');
assert.ok(fs.existsSync(systemPerformanceRuntimePath), 'system-performance-runtime.js should exist');
assert.ok(fs.existsSync(dataCloudRuntimePath), 'data-cloud-runtime.js should exist');
assert.ok(fs.existsSync(issueManagerRuntimePath), 'issue-manager-runtime.js should exist');
assert.ok(fs.existsSync(packagerRuntimePath), 'packager-runtime.js should exist');
assert.ok(fs.existsSync(helpSystemRuntimePath), 'help-system-runtime.js should exist');
assert.ok(fs.existsSync(loggerRuntimePath), 'logger-runtime.js should exist');
assert.ok(fs.existsSync(workerApiRuntimePath), 'worker-api-runtime.js should exist');
assert.ok(fs.existsSync(accountManagerRuntimePath), 'account-manager-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerTeacherRuntimePath), 'data-manager-teacher-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerStudentRuntimePath), 'data-manager-student-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerArchiveRuntimePath), 'data-manager-archive-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerGrade9TemplateRuntimePath), 'data-manager-grade9-template-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerParamsRuntimePath), 'data-manager-params-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerTargetsRuntimePath), 'data-manager-targets-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerSchoolAliasRuntimePath), 'data-manager-school-alias-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerSaveSyncRuntimePath), 'data-manager-save-sync-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerHistoryRuntimePath), 'data-manager-history-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerTabRuntimePath), 'data-manager-tab-runtime.js should exist');
assert.ok(fs.existsSync(compareCloudContextRuntimePath), 'compare-cloud-context-runtime.js should exist');
assert.ok(fs.existsSync(compareExamSyncRuntimePath), 'compare-exam-sync-runtime.js should exist');
assert.ok(fs.existsSync(townSubmoduleCompareStateRuntimePath), 'town-submodule-compare-state-runtime.js should exist');
assert.ok(fs.existsSync(townSubmoduleCompareRuntimePath), 'town-submodule-compare-runtime.js should exist');
assert.ok(fs.existsSync(bootRuntimePath), 'boot-runtime.js should exist');
assert.ok(fs.existsSync(accountAdminRuntimePath), 'account-admin-runtime.js should exist');
assert.ok(fs.existsSync(historyCompareRuntimePath), 'history-compare-runtime.js should exist');
assert.ok(fs.existsSync(perfMobileRuntimePath), 'perf-mobile-runtime.js should exist');
assert.ok(fs.existsSync(shellRuntimePath), 'shell-runtime.js should exist');
assert.ok(fs.existsSync(shellPolishRuntimePath), 'shell-polish-runtime.js should exist');
assert.ok(fs.existsSync(moduleEntryRuntimePath), 'module-entry-runtime.js should exist');
assert.ok(fs.existsSync(rankingDataServiceRuntimePath), 'ranking-data-service-runtime.js should exist');
assert.ok(fs.existsSync(studentJumpRuntimePath), 'student-jump-runtime.js should exist');
assert.ok(fs.existsSync(singleSchoolEvalRuntimePath), 'single-school-eval-runtime.js should exist');
assert.ok(fs.existsSync(aiHubRuntimePath), 'ai-hub-runtime.js should exist');
assert.ok(fs.existsSync(schoolProfileRuntimePath), 'school-profile-runtime.js should exist');
assert.ok(fs.existsSync(teachingManagementRuntimePath), 'teaching-management-runtime.js should exist');
assert.ok(fs.existsSync(teacherAnalysisCoreRuntimePath), 'teacher-analysis-core-runtime.js should exist');
assert.ok(fs.existsSync(teacherAnalysisUiRuntimePath), 'teacher-analysis-ui-runtime.js should exist');
assert.ok(fs.existsSync(teacherAnalysisBridgeRuntimePath), 'teacher-analysis-bridge-runtime.js should exist');
assert.ok(fs.existsSync(mobileManagerRuntimePath), 'mobile-manager.js should exist');
assert.ok(fs.existsSync(dataManagerSqlRuntimePath), 'data-manager-sql.js should exist');
assert.ok(fs.existsSync(reportRenderRuntimePath), 'report-render-runtime.js should exist');
assert.ok(fs.existsSync(reportChartRuntimePath), 'report-chart-runtime.js should exist');
assert.ok(fs.existsSync(reportExportRuntimePath), 'report-export-runtime.js should exist');
assert.ok(fs.existsSync(reportAiRuntimePath), 'report-ai-runtime.js should exist');
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
const cloudApiRef = './assets/js/cloud-api-runtime.js';
const cloudConnectionRef = './assets/js/cloud-connection-runtime.js';
const systemPerformanceRef = './assets/js/system-performance-runtime.js';
const dataCloudRef = './assets/js/data-cloud-runtime.js';
const issueManagerRef = './assets/js/issue-manager-runtime.js';
const packagerRef = './assets/js/packager-runtime.js';
const helpSystemRef = './assets/js/help-system-runtime.js';
const loggerRef = './assets/js/logger-runtime.js';
const workerApiRef = './assets/js/worker-api-runtime.js';
const accountManagerRef = './assets/js/account-manager-runtime.js';
const dataManagerTeacherRef = './assets/js/data-manager-teacher-runtime.js';
const dataManagerStudentRef = './assets/js/data-manager-student-runtime.js';
const dataManagerArchiveRef = './assets/js/data-manager-archive-runtime.js';
const dataManagerGrade9TemplateRef = './assets/js/data-manager-grade9-template-runtime.js';
const dataManagerParamsRef = './assets/js/data-manager-params-runtime.js';
const dataManagerTargetsRef = './assets/js/data-manager-targets-runtime.js';
const dataManagerSchoolAliasRef = './assets/js/data-manager-school-alias-runtime.js';
const dataManagerSaveSyncRef = './assets/js/data-manager-save-sync-runtime.js';
const dataManagerHistoryRef = './assets/js/data-manager-history-runtime.js';
const dataManagerTabRef = './assets/js/data-manager-tab-runtime.js';
const compareCloudContextRef = './assets/js/compare-cloud-context-runtime.js';
const compareExamSyncRef = './assets/js/compare-exam-sync-runtime.js';
const townSubmoduleCompareStateRef = './assets/js/town-submodule-compare-state-runtime.js';
const townSubmoduleCompareRef = './assets/js/town-submodule-compare-runtime.js';
const compareSelectorsRef = './assets/js/compare-selectors-runtime.js';
const progressAnalysisRef = './assets/js/progress-analysis-runtime.js';
const teacherAnalysisMainRef = './assets/js/teacher-analysis-main-runtime.js';
const teacherAnalysisCoreRef = './assets/js/teacher-analysis-core-runtime.js';
const teacherAnalysisUiRef = './assets/js/teacher-analysis-ui-runtime.js';
const teacherAnalysisBridgeRef = './assets/js/teacher-analysis-bridge-runtime.js';
const cloudWorkspaceRef = './assets/js/cloud-workspace-runtime.js';
const shellRuntimeRef = './assets/js/shell-runtime.js';
const shellPolishRuntimeRef = './assets/js/shell-polish-runtime.js';
const moduleEntryRuntimeRef = './assets/js/module-entry-runtime.js';
const rankingDataServiceRef = './assets/js/ranking-data-service-runtime.js';
const studentJumpRef = './assets/js/student-jump-runtime.js';
const cloudRef = './assets/js/cloud.js';
const appRef = './assets/js/app.js';
const accountAdminRef = './assets/js/account-admin-runtime.js';
const historyCompareRef = './assets/js/history-compare-runtime.js';
const perfMobileRef = './assets/js/perf-mobile-runtime.js';
const singleSchoolEvalRef = './assets/js/single-school-eval-runtime.js';
const aiHubRef = './assets/js/ai-hub-runtime.js';
const schoolProfileRef = './assets/js/school-profile-runtime.js';
const teachingManagementRef = './assets/js/teaching-management-runtime.js';
const mobileManagerRef = './assets/js/mobile-manager.js';
const dataManagerSqlRef = './assets/js/data-manager-sql.js';
const reportRenderRef = './assets/js/report-render-runtime.js';
const reportChartRef = './assets/js/report-chart-runtime.js';
const reportExportRef = './assets/js/report-export-runtime.js';
const reportAiRef = './assets/js/report-ai-runtime.js';
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
const gsapVendorRef = './assets/vendor/gsap/gsap.min.js';
const scrollTriggerVendorRef = './assets/vendor/gsap/ScrollTrigger.min.js';
const popperVendorRef = './assets/vendor/popperjs/popper.min.js';
const tippyVendorRef = './assets/vendor/tippyjs/tippy.umd.min.js';
const simplebarVendorRef = './assets/vendor/simplebar/simplebar.min.js';
const jspdfVendorRef = './assets/vendor/jspdf/jspdf.umd.min.js';
const html2canvasVendorRef = './assets/vendor/html2canvas/html2canvas.min.js';

function findScriptTag(html, src) {
    const normalizedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(new RegExp(`<script[^>]*src=["']${normalizedSrc}[^"']*["'][^>]*>`, 'i'));
    return match ? match[0] : '';
}

const appModulesMatch = bootRuntime.match(/var APP_MODULES = \[[\s\S]*?\];/);
assert.ok(appModulesMatch, 'boot-runtime.js should declare APP_MODULES');
const moduleManifest = appModulesMatch[0];
const authStateIndex = moduleManifest.indexOf(authStateRef);
const workspaceStateIndex = moduleManifest.indexOf(workspaceStateRef);
const examStateIndex = moduleManifest.indexOf(examStateRef);
const schoolStateIndex = moduleManifest.indexOf(schoolStateRef);
const teacherStateIndex = moduleManifest.indexOf(teacherStateRef);
const dataStateIndex = moduleManifest.indexOf(dataStateRef);
const supportStateIndex = moduleManifest.indexOf(supportStateRef);
const progressStateIndex = moduleManifest.indexOf(progressStateRef);
const reportSessionStateIndex = moduleManifest.indexOf(reportSessionStateRef);
const compareSessionStateIndex = moduleManifest.indexOf(compareSessionStateRef);
const compareResultStateIndex = moduleManifest.indexOf(compareResultStateRef);
const compareSummaryStateIndex = moduleManifest.indexOf(compareSummaryStateRef);
const cloudApiIndex = moduleManifest.indexOf(cloudApiRef);
const cloudConnectionIndex = moduleManifest.indexOf(cloudConnectionRef);
const systemPerformanceIndex = moduleManifest.indexOf(systemPerformanceRef);
const dataCloudIndex = moduleManifest.indexOf(dataCloudRef);
const issueManagerIndex = moduleManifest.indexOf(issueManagerRef);
const packagerIndex = moduleManifest.indexOf(packagerRef);
const helpSystemIndex = moduleManifest.indexOf(helpSystemRef);
const loggerIndex = moduleManifest.indexOf(loggerRef);
const workerApiIndex = moduleManifest.indexOf(workerApiRef);
const accountManagerIndex = moduleManifest.indexOf(accountManagerRef);
const dataManagerTeacherIndex = moduleManifest.indexOf(dataManagerTeacherRef);
const dataManagerStudentIndex = moduleManifest.indexOf(dataManagerStudentRef);
const dataManagerArchiveIndex = moduleManifest.indexOf(dataManagerArchiveRef);
const dataManagerGrade9TemplateIndex = moduleManifest.indexOf(dataManagerGrade9TemplateRef);
const dataManagerParamsIndex = moduleManifest.indexOf(dataManagerParamsRef);
const dataManagerTargetsIndex = moduleManifest.indexOf(dataManagerTargetsRef);
const dataManagerSchoolAliasIndex = moduleManifest.indexOf(dataManagerSchoolAliasRef);
const dataManagerSaveSyncIndex = moduleManifest.indexOf(dataManagerSaveSyncRef);
const dataManagerHistoryIndex = moduleManifest.indexOf(dataManagerHistoryRef);
const dataManagerTabIndex = moduleManifest.indexOf(dataManagerTabRef);
const compareCloudContextIndex = moduleManifest.indexOf(compareCloudContextRef);
const compareExamSyncIndex = moduleManifest.indexOf(compareExamSyncRef);
const townSubmoduleCompareStateIndex = moduleManifest.indexOf(townSubmoduleCompareStateRef);
const townSubmoduleCompareIndex = moduleManifest.indexOf(townSubmoduleCompareRef);
const compareSelectorsIndex = moduleManifest.indexOf(compareSelectorsRef);
const progressAnalysisIndex = moduleManifest.indexOf(progressAnalysisRef);
const cloudIndex = moduleManifest.indexOf(cloudRef);
const cloudWorkspaceIndex = moduleManifest.indexOf(cloudWorkspaceRef);
const shellRuntimeIndex = moduleManifest.indexOf(shellRuntimeRef);
const shellPolishRuntimeIndex = moduleManifest.indexOf(shellPolishRuntimeRef);
const moduleEntryRuntimeIndex = moduleManifest.indexOf(moduleEntryRuntimeRef);
const rankingDataServiceIndex = moduleManifest.indexOf(rankingDataServiceRef);
const studentJumpIndex = moduleManifest.indexOf(studentJumpRef);
const appIndex = moduleManifest.indexOf(appRef);
const bootRuntimeIndex = indexHtml.indexOf(bootRuntimeRef);
const popperVendorIndex = bootRuntime.indexOf(popperVendorRef);
const tippyVendorIndex = bootRuntime.indexOf(tippyVendorRef);
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
assert.ok(cloudApiIndex >= 0, 'index.html should load cloud-api-runtime.js');
assert.ok(cloudConnectionIndex >= 0, 'index.html should load cloud-connection-runtime.js');
assert.ok(systemPerformanceIndex >= 0, 'index.html should load system-performance-runtime.js');
assert.ok(dataCloudIndex >= 0, 'index.html should load data-cloud-runtime.js');
assert.ok(issueManagerIndex >= 0, 'index.html should load issue-manager-runtime.js');
assert.strictEqual(packagerIndex, -1, 'packager-runtime.js should be lazy-loaded instead of boot-loaded');
assert.ok(helpSystemIndex >= 0, 'index.html should load help-system-runtime.js');
assert.ok(loggerIndex >= 0, 'index.html should load logger-runtime.js');
assert.strictEqual(workerApiIndex, -1, 'worker-api-runtime.js should be lazy-loaded instead of boot-loaded');
assert.ok(accountManagerIndex >= 0, 'index.html should load account-manager-runtime.js');
assert.ok(dataManagerTeacherIndex >= 0, 'index.html should load data-manager-teacher-runtime.js');
assert.ok(dataManagerStudentIndex >= 0, 'index.html should load data-manager-student-runtime.js');
assert.ok(dataManagerArchiveIndex >= 0, 'index.html should load data-manager-archive-runtime.js');
assert.ok(dataManagerGrade9TemplateIndex >= 0, 'index.html should load data-manager-grade9-template-runtime.js');
assert.ok(dataManagerParamsIndex >= 0, 'index.html should load data-manager-params-runtime.js');
assert.ok(dataManagerTargetsIndex >= 0, 'index.html should load data-manager-targets-runtime.js');
assert.ok(dataManagerSchoolAliasIndex >= 0, 'index.html should load data-manager-school-alias-runtime.js');
assert.ok(dataManagerSaveSyncIndex >= 0, 'index.html should load data-manager-save-sync-runtime.js');
assert.ok(dataManagerHistoryIndex >= 0, 'index.html should load data-manager-history-runtime.js');
assert.ok(dataManagerTabIndex >= 0, 'index.html should load data-manager-tab-runtime.js');
assert.ok(compareCloudContextIndex >= 0, 'index.html should load compare-cloud-context-runtime.js');
assert.ok(compareExamSyncIndex >= 0, 'index.html should load compare-exam-sync-runtime.js');
assert.ok(townSubmoduleCompareStateIndex >= 0, 'index.html should load town-submodule-compare-state-runtime.js');
assert.ok(townSubmoduleCompareIndex >= 0, 'index.html should load town-submodule-compare-runtime.js');
assert.ok(compareSelectorsIndex >= 0, 'index.html should load compare-selectors-runtime.js');
assert.ok(cloudIndex >= 0, 'index.html should load cloud.js');
assert.ok(cloudWorkspaceIndex >= 0, 'index.html should load cloud-workspace-runtime.js');
assert.ok(cloudApiIndex < cloudConnectionIndex, 'cloud-api-runtime.js should load before cloud-connection-runtime.js');
assert.ok(cloudConnectionIndex < cloudIndex, 'cloud-connection-runtime.js should load before cloud.js');
assert.ok(cloudConnectionIndex < appIndex, 'cloud-connection-runtime.js should load before app.js');
assert.ok(cloudIndex < systemPerformanceIndex, 'system-performance-runtime.js should load after cloud.js');
assert.ok(systemPerformanceIndex < cloudWorkspaceIndex, 'system-performance-runtime.js should load before cloud-workspace-runtime.js');
assert.ok(dataCloudIndex < appIndex, 'data-cloud-runtime.js should load before app.js');
assert.ok(issueManagerIndex < appIndex, 'issue-manager-runtime.js should load before app.js');
assert.ok(helpSystemIndex < appIndex, 'help-system-runtime.js should load before app.js');
assert.ok(loggerIndex < appIndex, 'logger-runtime.js should load before app.js');
assert.ok(accountManagerIndex < appIndex, 'account-manager-runtime.js should load before app.js');
assert.ok(dataManagerTeacherIndex < appIndex, 'data-manager-teacher-runtime.js should load before app.js');
assert.ok(dataManagerStudentIndex < appIndex, 'data-manager-student-runtime.js should load before app.js');
assert.ok(dataManagerArchiveIndex < appIndex, 'data-manager-archive-runtime.js should load before app.js');
assert.ok(dataManagerGrade9TemplateIndex < appIndex, 'data-manager-grade9-template-runtime.js should load before app.js');
assert.ok(dataManagerParamsIndex < appIndex, 'data-manager-params-runtime.js should load before app.js');
assert.ok(dataManagerTargetsIndex < appIndex, 'data-manager-targets-runtime.js should load before app.js');
assert.ok(dataManagerSchoolAliasIndex < appIndex, 'data-manager-school-alias-runtime.js should load before app.js');
assert.ok(dataManagerSaveSyncIndex < appIndex, 'data-manager-save-sync-runtime.js should load before app.js');
assert.ok(dataManagerHistoryIndex < appIndex, 'data-manager-history-runtime.js should load before app.js');
assert.ok(dataManagerTabIndex < appIndex, 'data-manager-tab-runtime.js should load before app.js');
assert.ok(shellRuntimeIndex >= 0, 'index.html should load shell-runtime.js');
assert.ok(shellPolishRuntimeIndex >= 0, 'index.html should load shell-polish-runtime.js');
assert.ok(moduleEntryRuntimeIndex >= 0, 'index.html should load module-entry-runtime.js');
assert.ok(rankingDataServiceIndex >= 0, 'index.html should load ranking-data-service-runtime.js');
assert.ok(appIndex >= 0, 'index.html should load app.js');
assert.ok(bootRuntime.includes(progressAnalysisRef), 'boot-runtime.js should reference progress-analysis-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(teacherAnalysisMainRef), 'boot-runtime.js should reference teacher-analysis-main-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(teacherAnalysisCoreRef), 'boot-runtime.js should reference teacher-analysis-core-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(teacherAnalysisUiRef), 'boot-runtime.js should reference teacher-analysis-ui-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(teacherAnalysisBridgeRef), 'boot-runtime.js should reference teacher-analysis-bridge-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(singleSchoolEvalRef), 'boot-runtime.js should reference single-school-eval-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(aiHubRef), 'boot-runtime.js should reference ai-hub-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(schoolProfileRef), 'boot-runtime.js should reference school-profile-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(teachingManagementRef), 'boot-runtime.js should reference teaching-management-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(reportChartRef), 'boot-runtime.js should reference report-chart-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(reportExportRef), 'boot-runtime.js should reference report-export-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(reportAiRef), 'boot-runtime.js should reference report-ai-runtime.js for lazy loading');
assert.ok(bootRuntime.includes(alasqlVendorRef), 'boot-runtime.js should reference alasql.min.js for lazy loading');
assert.ok(bootRuntime.includes(jspdfVendorRef), 'boot-runtime.js should reference jspdf.umd.min.js for lazy loading');
assert.ok(bootRuntime.includes(html2canvasVendorRef), 'boot-runtime.js should reference html2canvas.min.js for lazy loading');
assert.ok(bootRuntime.includes("window.ensureAlasqlVendorLoaded = function ()"), 'boot-runtime.js should expose ensureAlasqlVendorLoaded');
assert.ok(bootRuntime.includes("window.ensurePdfExportVendorsLoaded = function ()"), 'boot-runtime.js should expose ensurePdfExportVendorsLoaded');
assert.ok(!bootRuntime.includes("window.ensurePresentationVendorsLoaded = function ()"), 'boot-runtime.js should not expose removed PPT vendor loader');
assert.ok(bootRuntime.includes('var SYSTEM_RUNTIME_SKILLS = {'), 'boot-runtime.js should declare a runtime skill manifest');
assert.ok(bootRuntime.includes('window.SystemRuntimeLoader'), 'boot-runtime.js should expose the runtime skill loader');
assert.ok(bootRuntime.includes('function getBootScriptBatchSize()'), 'boot-runtime.js should batch boot script insertion on constrained devices');
assert.ok(bootRuntime.includes('function yieldBootScriptBatchFrame()'), 'boot-runtime.js should yield between boot script batches');
assert.ok(bootRuntime.includes('if (isRuntimeMobileViewport()) return;'), 'boot-runtime.js should skip desktop deferred vendor prefetch on mobile');
assert.ok(bootRuntime.includes('function shouldPrefetchLateAppCoreModules()'), 'boot-runtime.js should gate late app-core prefetches');
assert.ok(bootRuntime.includes('preloadCount < APP_MODULES.length && shouldPrefetchLateAppCoreModules()'), 'boot-runtime.js should avoid late app-core prefetches on mobile or lazy profiles');
assert.ok(bootRuntime.includes('function markAppModulesReady()'), 'boot-runtime.js should mark app modules ready through a shared helper');
assert.ok(bootRuntime.includes('school:app-modules-ready'), 'boot-runtime.js should dispatch an app modules ready event');
assert.ok(bootRuntime.includes('function scheduleMobileRuntimeBootstrap'), 'boot-runtime.js should defer mobile runtime bootstrapping');
assert.ok(bootRuntime.includes('runAfterAppModulesReady'), 'boot-runtime.js should wait for core modules before mobile runtime bootstrap');
assert.ok(bootRuntime.includes("'teacher-analysis':"), 'runtime skill manifest should include teacher-analysis');
assert.ok(!bootRuntime.includes("'presentation-export':"), 'runtime skill manifest should not include removed PPT export skill');
assert.ok(bootRuntime.includes("'zhongkao-countdown':"), 'runtime skill manifest should include zhongkao-countdown');
assert.ok(bootRuntime.includes("'packager':"), 'runtime skill manifest should include packager');
assert.ok(bootRuntime.includes("'worker-api':"), 'runtime skill manifest should include worker-api');
assert.ok(bootRuntime.includes("window.ensureZhongkaoCountdownRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureZhongkaoCountdownRuntimeLoaded');
assert.ok(bootRuntime.includes("window.ensurePackagerRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensurePackagerRuntimeLoaded');
assert.ok(bootRuntime.includes("window.ensureWorkerApiRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureWorkerApiRuntimeLoaded');
assert.ok(bootRuntime.includes('loadAll()'), 'runtime skill loader should support full loading');
assert.strictEqual(initSupabaseMatches.length, 1, 'boot-runtime.js should define initSupabase exactly once');
assert.strictEqual(supabaseUrlAssignments.length, 1, 'boot-runtime.js should resolve SUPABASE_URL exactly once');
assert.strictEqual(supabaseKeyAssignments.length, 1, 'boot-runtime.js should resolve SUPABASE_KEY exactly once');
assert.strictEqual(gatewayUrlAssignments.length, 1, 'boot-runtime.js should resolve EDGE_GATEWAY_URL exactly once');
assert.strictEqual(switchTabDefinitions.length, 1, 'app.js should define switchTab exactly once');
assert.strictEqual(switchTabOverrides.length, 0, 'app.js should not reassign switchTab after definition');

[
    cryptoJsVendorRef,
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
    cloudApiRef,
    systemPerformanceRef,
    dataCloudRef,
    issueManagerRef,
    helpSystemRef,
    loggerRef,
    accountManagerRef,
    dataManagerTeacherRef,
    dataManagerStudentRef,
    dataManagerArchiveRef,
    dataManagerGrade9TemplateRef,
    dataManagerParamsRef,
    dataManagerTargetsRef,
    dataManagerSchoolAliasRef,
    dataManagerSaveSyncRef,
    dataManagerHistoryRef,
    dataManagerTabRef,
    cloudRef,
    cloudWorkspaceRef,
    shellRuntimeRef,
    shellPolishRuntimeRef,
    moduleEntryRuntimeRef,
    rankingDataServiceRef,
    appRef,
    compareCloudContextRef,
    compareExamSyncRef,
    compareSelectorsRef,
    townSubmoduleCompareStateRef,
    townSubmoduleCompareRef
].forEach((src) => {
    assert.ok(bootRuntime.includes(src), `boot-runtime.js should contain boot/core module entry for ${src}`);
});

assert.ok(!findScriptTag(indexHtml, supabaseVendorRef), 'index.html should not load the legacy supabase SDK script');

[
    xlsxVendorRef,
    alpineVendorRef,
    chartVendorRef,
    sweetalertVendorRef
].forEach((src) => {
    assert.ok(bootRuntime.includes(src), `boot-runtime.js should contain deferred module entry for ${src}`);
});

[
    scrollTriggerVendorRef,
    popperVendorRef,
    tippyVendorRef,
    simplebarVendorRef
].forEach((src) => {
    assert.ok(bootRuntime.includes(src), `boot-runtime.js should contain deferred module entry for ${src}`);
});

const bootScriptTag = findScriptTag(indexHtml, bootRuntimeRef);
assert.ok(bootScriptTag, 'index.html should contain a script tag for boot-runtime.js');
assert.ok(/\sdefer(\s|>|=)/i.test(bootScriptTag), 'boot-runtime.js should load with defer');
const lzScriptTag = findScriptTag(indexHtml, lzStringVendorRef);
assert.ok(lzScriptTag, 'index.html should contain a script tag for lz-string.min.js');
assert.ok(/\sdefer(\s|>|=)/i.test(lzScriptTag), 'lz-string.min.js should load with defer');
const gsapScriptTag = findScriptTag(indexHtml, gsapVendorRef);
assert.ok(gsapScriptTag, 'index.html should contain a script tag for gsap.min.js');
assert.ok(/\sdefer(\s|>|=)/i.test(gsapScriptTag), 'gsap.min.js should load with defer');

assert.ok(indexHtml.includes(tablerIconsRef), 'index.html should load local tabler icons CSS');

[
    alasqlVendorRef,
    jspdfVendorRef,
    html2canvasVendorRef,
    accountAdminRef,
    historyCompareRef,
    perfMobileRef,
    singleSchoolEvalRef,
    mobileManagerRef,
    dataManagerSqlRef,
    reportRenderRef,
    reportChartRef,
    reportExportRef,
    reportAiRef,
    teacherAnalysisCoreRef,
    teacherAnalysisUiRef,
    teacherAnalysisBridgeRef,
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
assert.ok(bootRuntimeIndex >= 0, 'index.html should load boot-runtime.js before dynamic modules are requested');
assert.ok(authStateIndex < cloudWorkspaceIndex, 'auth-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(authStateIndex < appIndex, 'auth-state-runtime.js must load before app.js');
assert.ok(shellRuntimeIndex < appIndex, 'shell-runtime.js must load before app.js');
assert.ok(shellRuntimeIndex < shellPolishRuntimeIndex, 'shell-runtime.js must load before shell-polish-runtime.js');
assert.ok(shellPolishRuntimeIndex < moduleEntryRuntimeIndex, 'shell-polish-runtime.js must load before module-entry-runtime.js');
assert.ok(moduleEntryRuntimeIndex < rankingDataServiceIndex, 'module-entry-runtime.js must load before ranking-data-service-runtime.js');
assert.ok(rankingDataServiceIndex < appIndex, 'ranking-data-service-runtime.js must load before app.js');
assert.ok(studentJumpIndex >= 0, 'index.html should load student-jump-runtime.js');
assert.ok(rankingDataServiceIndex < studentJumpIndex, 'ranking-data-service-runtime.js must load before student-jump-runtime.js');
assert.ok(studentJumpIndex < appIndex, 'student-jump-runtime.js must load before app.js');
assert.ok(popperVendorIndex < tippyVendorIndex, 'popper.min.js must load before tippy.umd.min.js');

console.log('runtime order tests passed');
