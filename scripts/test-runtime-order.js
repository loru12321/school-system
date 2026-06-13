const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../src/index.html');
const runtimePath = path.resolve(__dirname, '../public/assets/js/auth-state-runtime.js');
const workspaceRuntimePath = path.resolve(__dirname, '../public/assets/js/workspace-state-runtime.js');
const examRuntimePath = path.resolve(__dirname, '../public/assets/js/exam-state-runtime.js');
const schoolRuntimePath = path.resolve(__dirname, '../public/assets/js/school-state-runtime.js');
const schoolNormalizationRuntimePath = path.resolve(__dirname, '../public/assets/js/school-normalization-runtime.js');
const teacherRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-state-runtime.js');
const dataRuntimePath = path.resolve(__dirname, '../public/assets/js/data-state-runtime.js');
const supportRuntimePath = path.resolve(__dirname, '../public/assets/js/support-state-runtime.js');
const supportMetricsRuntimePath = path.resolve(__dirname, '../public/assets/js/support-metrics-runtime.js');
const progressRuntimePath = path.resolve(__dirname, '../public/assets/js/progress-state-runtime.js');
const progressAnalysisRuntimePath = path.resolve(__dirname, '../public/assets/js/progress-analysis-runtime.js');
const reportSessionRuntimePath = path.resolve(__dirname, '../public/assets/js/report-session-state-runtime.js');
const compareSessionRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-session-state-runtime.js');
const compareResultRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-result-state-runtime.js');
const compareSummaryRuntimePath = path.resolve(__dirname, '../public/assets/js/compare-summary-state-runtime.js');
const cloudApiRuntimePath = path.resolve(__dirname, '../public/assets/js/cloud-api-runtime.js');
const cloudConnectionRuntimePath = path.resolve(__dirname, '../public/assets/js/cloud-connection-runtime.js');
const cloudWorkspaceRuntimePath = path.resolve(__dirname, '../public/assets/js/cloud-workspace-runtime.js');
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
const permissionPolicyRuntimePath = path.resolve(__dirname, '../public/assets/js/permission-policy-runtime.js');
const rankingDataServiceRuntimePath = path.resolve(__dirname, '../public/assets/js/ranking-data-service-runtime.js');
const studentJumpRuntimePath = path.resolve(__dirname, '../public/assets/js/student-jump-runtime.js');
const schoolProfileRuntimePath = path.resolve(__dirname, '../public/assets/js/school-profile-runtime.js');
const teachingManagementRuntimePath = path.resolve(__dirname, '../public/assets/js/teaching-management-runtime.js');
const teachingManagementCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/teaching-management-cloud-runtime.js');
const teachingManagementOverviewRuntimePath = path.resolve(__dirname, '../public/assets/js/teaching-management-overview-runtime.js');
const studentOverviewRuntimePath = path.resolve(__dirname, '../public/assets/js/student-overview-runtime.js');
const teachingManagementVersionRuntimePath = path.resolve(__dirname, '../public/assets/js/teaching-management-version-runtime.js');
const teacherAnalysisCoreRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-analysis-core-runtime.js');
const teacherAnalysisUiRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-analysis-ui-runtime.js');
const teacherAnalysisBridgeRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-analysis-bridge-runtime.js');
const countyAnalysisRuntimePath = path.resolve(__dirname, '../public/assets/js/county-analysis-runtime.js');
const mobileAppRuntimePath = path.resolve(__dirname, '../public/assets/js/mobile-app-runtime.js');
const dataManagerSqlRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-sql.js');
const reportRenderRuntimePath = path.resolve(__dirname, '../public/assets/js/report-render-runtime.js');
const reportChartRuntimePath = path.resolve(__dirname, '../public/assets/js/report-chart-runtime.js');
const reportExportRuntimePath = path.resolve(__dirname, '../public/assets/js/report-export-runtime.js');
const studentCompareGenerateRuntimePath = path.resolve(__dirname, '../public/assets/js/student-compare-generate-runtime.js');
const studentCompareResultRuntimePath = path.resolve(__dirname, '../public/assets/js/student-compare-result-runtime.js');
const studentCompareCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/student-compare-cloud-runtime.js');
const teacherCompareResultRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-compare-result-runtime.js');
const teacherCompareCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-compare-cloud-runtime.js');
const macroCompareResultRuntimePath = path.resolve(__dirname, '../public/assets/js/macro-compare-result-runtime.js');
const macroCompareCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/macro-compare-cloud-runtime.js');
const cloudRuntimePath = path.resolve(__dirname, '../public/assets/js/cloud.js');
const smokeAllModulesPath = path.resolve(__dirname, './smoke-all-modules.js');

assert.ok(fs.existsSync(runtimePath), 'auth-state-runtime.js should exist');
assert.ok(fs.existsSync(workspaceRuntimePath), 'workspace-state-runtime.js should exist');
assert.ok(fs.existsSync(examRuntimePath), 'exam-state-runtime.js should exist');
assert.ok(fs.existsSync(schoolRuntimePath), 'school-state-runtime.js should exist');
assert.ok(fs.existsSync(schoolNormalizationRuntimePath), 'school-normalization-runtime.js should exist');
assert.ok(fs.existsSync(teacherRuntimePath), 'teacher-state-runtime.js should exist');
assert.ok(fs.existsSync(dataRuntimePath), 'data-state-runtime.js should exist');
assert.ok(fs.existsSync(supportRuntimePath), 'support-state-runtime.js should exist');
assert.ok(fs.existsSync(supportMetricsRuntimePath), 'support-metrics-runtime.js should exist');
assert.ok(fs.existsSync(progressRuntimePath), 'progress-state-runtime.js should exist');
assert.ok(fs.existsSync(progressAnalysisRuntimePath), 'progress-analysis-runtime.js should exist');
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
assert.ok(fs.existsSync(permissionPolicyRuntimePath), 'permission-policy-runtime.js should exist');
assert.ok(fs.existsSync(rankingDataServiceRuntimePath), 'ranking-data-service-runtime.js should exist');
assert.ok(fs.existsSync(studentJumpRuntimePath), 'student-jump-runtime.js should exist');
assert.ok(fs.existsSync(schoolProfileRuntimePath), 'school-profile-runtime.js should exist');
assert.ok(fs.existsSync(teachingManagementRuntimePath), 'teaching-management-runtime.js should exist');
assert.ok(fs.existsSync(teachingManagementCloudRuntimePath), 'teaching-management-cloud-runtime.js should exist');
assert.ok(fs.existsSync(teachingManagementOverviewRuntimePath), 'teaching-management-overview-runtime.js should exist');
assert.ok(fs.existsSync(studentOverviewRuntimePath), 'student-overview-runtime.js should exist');
assert.ok(fs.existsSync(teachingManagementVersionRuntimePath), 'teaching-management-version-runtime.js should exist');
assert.ok(fs.existsSync(teacherAnalysisCoreRuntimePath), 'teacher-analysis-core-runtime.js should exist');
assert.ok(fs.existsSync(teacherAnalysisUiRuntimePath), 'teacher-analysis-ui-runtime.js should exist');
assert.ok(fs.existsSync(teacherAnalysisBridgeRuntimePath), 'teacher-analysis-bridge-runtime.js should exist');
assert.ok(fs.existsSync(countyAnalysisRuntimePath), 'county-analysis-runtime.js should exist');
assert.ok(fs.existsSync(mobileAppRuntimePath), 'mobile-app-runtime.js should exist');
assert.ok(fs.existsSync(dataManagerSqlRuntimePath), 'data-manager-sql.js should exist');
assert.ok(fs.existsSync(reportRenderRuntimePath), 'report-render-runtime.js should exist');
assert.ok(fs.existsSync(reportChartRuntimePath), 'report-chart-runtime.js should exist');
assert.ok(fs.existsSync(reportExportRuntimePath), 'report-export-runtime.js should exist');
assert.ok(fs.existsSync(studentCompareGenerateRuntimePath), 'student-compare-generate-runtime.js should exist');
assert.ok(fs.existsSync(studentCompareResultRuntimePath), 'student-compare-result-runtime.js should exist');
assert.ok(fs.existsSync(studentCompareCloudRuntimePath), 'student-compare-cloud-runtime.js should exist');
assert.ok(fs.existsSync(teacherCompareResultRuntimePath), 'teacher-compare-result-runtime.js should exist');
assert.ok(fs.existsSync(teacherCompareCloudRuntimePath), 'teacher-compare-cloud-runtime.js should exist');
assert.ok(fs.existsSync(macroCompareResultRuntimePath), 'macro-compare-result-runtime.js should exist');
assert.ok(fs.existsSync(macroCompareCloudRuntimePath), 'macro-compare-cloud-runtime.js should exist');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const bootRuntime = fs.readFileSync(bootRuntimePath, 'utf8');
const shellRuntime = fs.readFileSync(shellRuntimePath, 'utf8');
const shellPolishRuntime = fs.readFileSync(shellPolishRuntimePath, 'utf8');
const schoolNormalizationRuntime = fs.readFileSync(schoolNormalizationRuntimePath, 'utf8');
const moduleEntryRuntime = fs.readFileSync(moduleEntryRuntimePath, 'utf8');
const permissionPolicyRuntime = fs.readFileSync(permissionPolicyRuntimePath, 'utf8');
const teacherCompareResultRuntime = fs.readFileSync(teacherCompareResultRuntimePath, 'utf8');
const teacherCompareCloudRuntime = fs.readFileSync(teacherCompareCloudRuntimePath, 'utf8');
const teacherSyncRuntime = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/teacher-sync-runtime.js'), 'utf8');
const progressAnalysisRuntime = fs.readFileSync(progressAnalysisRuntimePath, 'utf8');
const teacherStateRuntime = fs.readFileSync(teacherRuntimePath, 'utf8');
const teachingManagementRuntime = fs.readFileSync(teachingManagementRuntimePath, 'utf8');
const teachingManagementOverviewRuntime = fs.readFileSync(teachingManagementOverviewRuntimePath, 'utf8');
const teachingManagementVersionRuntime = fs.readFileSync(teachingManagementVersionRuntimePath, 'utf8');
const studentOverviewRuntime = fs.readFileSync(studentOverviewRuntimePath, 'utf8');
const teacherAnalysisCoreRuntime = fs.readFileSync(teacherAnalysisCoreRuntimePath, 'utf8');
const teacherAnalysisUiRuntime = fs.readFileSync(teacherAnalysisUiRuntimePath, 'utf8');
const countyAnalysisRuntime = fs.readFileSync(countyAnalysisRuntimePath, 'utf8');
const mobileAppRuntime = fs.readFileSync(mobileAppRuntimePath, 'utf8');
const supportMetricsRuntime = fs.readFileSync(supportMetricsRuntimePath, 'utf8');
const mainCss = fs.readFileSync(path.resolve(__dirname, '../src/assets/css/main.css'), 'utf8');
const layoutRefinementCss = fs.readFileSync(path.resolve(__dirname, '../src/assets/css/layout-refinement.css'), 'utf8');
const cloudWorkspaceRuntime = fs.readFileSync(cloudWorkspaceRuntimePath, 'utf8');
const popperVendorSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/vendor/popperjs/popper.min.js'), 'utf8');
const tippyVendorSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/vendor/tippyjs/tippy.umd.min.js'), 'utf8');
const appSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app.js'), 'utf8');
const townSubmoduleCompareRuntime = fs.readFileSync(townSubmoduleCompareRuntimePath, 'utf8');
const cloudRuntime = fs.readFileSync(cloudRuntimePath, 'utf8');
const smokeAllModules = fs.readFileSync(smokeAllModulesPath, 'utf8');
const initSupabaseMatches = bootRuntime.match(/window\.initSupabase\s*=\s*function/g) || [];
const supabaseUrlAssignments = bootRuntime.match(/window\.SUPABASE_URL\s*=/g) || [];
const supabaseKeyAssignments = bootRuntime.match(/window\.SUPABASE_KEY\s*=/g) || [];
const gatewayUrlAssignments = bootRuntime.match(/window\.EDGE_GATEWAY_URL\s*=/g) || [];
const switchTabDefinitions = appSource.match(/function\s+switchTab\s*\(/g) || [];
const switchTabOverrides = appSource.match(/switchTab\s*=\s*function\s*\(/g) || [];
const bootDirectGatewayCandidateIndex = bootRuntime.indexOf('pushCandidate(DIRECT_EDGE_GATEWAY_URL);', bootRuntime.indexOf('installBootLoginShell'));
const bootSameOriginGatewayCandidateIndex = bootRuntime.indexOf('pushCandidate(window.EDGE_GATEWAY_URL);', bootRuntime.indexOf('installBootLoginShell'));
const grade9TotalSubjectContract = /totalSubs:\s*\['语文',\s*'数学',\s*'英语',\s*'物理',\s*'化学'\]/;
const grade9PoliticsDisplayContract = /extraDisplaySubs:\s*\['政治'\]/;
const authStateRef = './assets/js/auth-state-runtime.js';
const workspaceStateRef = './assets/js/workspace-state-runtime.js';
const examStateRef = './assets/js/exam-state-runtime.js';
const schoolStateRef = './assets/js/school-state-runtime.js';
const teacherStateRef = './assets/js/teacher-state-runtime.js';
const dataStateRef = './assets/js/data-state-runtime.js';
const supportStateRef = './assets/js/support-state-runtime.js';
const supportMetricsRef = './assets/js/support-metrics-runtime.js';
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
const schoolProfileRef = './assets/js/school-profile-runtime.js';
const teachingManagementRef = './assets/js/teaching-management-runtime.js';
const teachingManagementCloudRef = './assets/js/teaching-management-cloud-runtime.js';
const teachingManagementOverviewRef = './assets/js/teaching-management-overview-runtime.js';
const studentOverviewRef = './assets/js/student-overview-runtime.js';
const teachingManagementVersionRef = './assets/js/teaching-management-version-runtime.js';
const mobileAppRef = './assets/js/mobile-app-runtime.js';
const dataManagerSqlRef = './assets/js/data-manager-sql.js';
const reportRenderRef = './assets/js/report-render-runtime.js';
const reportChartRef = './assets/js/report-chart-runtime.js';
const reportExportRef = './assets/js/report-export-runtime.js';
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

const appModulesMatch = bootRuntime.match(/var APP_MODULES = \[[\s\S]*?\]\.map\(bootJs\);/)
    || bootRuntime.match(/var APP_MODULES = \[[\s\S]*?\];/);
assert.ok(appModulesMatch, 'boot-runtime.js should declare APP_MODULES');
const moduleManifest = appModulesMatch[0];
const normalizedModuleManifest = moduleManifest.includes('.map(bootJs)')
    ? moduleManifest.replace(/'([^']+\.js)'/g, "'./assets/js/$1'")
    : moduleManifest;
const bootVendorMatch = bootRuntime.match(/var BOOT_VENDOR_MODULES = \[[\s\S]*?\];/);
assert.ok(bootVendorMatch, 'boot-runtime.js should declare BOOT_VENDOR_MODULES');
const bootVendorManifest = bootVendorMatch[0];
const deferredVendorMatch = bootRuntime.match(/var DEFERRED_APP_MODULES = \[[\s\S]*?\];/);
assert.ok(deferredVendorMatch, 'boot-runtime.js should declare DEFERRED_APP_MODULES');
const deferredVendorManifest = deferredVendorMatch[0];
const bootRuntimeReferences = (ref) => bootRuntime.includes(ref) || bootRuntime.includes(ref.split('/').pop());
const bootRuntimeReferenceIndex = (ref) => {
    const fullIndex = bootRuntime.indexOf(ref);
    if (fullIndex >= 0) return fullIndex;
    return bootRuntime.indexOf(ref.split('/').pop());
};
assert.ok(!bootVendorManifest.includes(cryptoJsVendorRef), 'crypto-js should not be part of the first boot vendor batch');
assert.ok(!bootVendorManifest.includes(xlsxVendorRef), 'xlsx should not be part of the first boot vendor batch');
assert.ok(!bootVendorManifest.includes(chartVendorRef), 'chart.js should not be part of the first boot vendor batch');
assert.ok(!bootVendorManifest.includes(sweetalertVendorRef), 'sweetalert2 should not be part of the first boot vendor batch');
assert.ok(!deferredVendorManifest.includes(gsapVendorRef), 'gsap should not be part of the generic post-boot vendor batch');
assert.ok(!deferredVendorManifest.includes(scrollTriggerVendorRef), 'ScrollTrigger should not be part of the generic post-boot vendor batch');
assert.ok(!deferredVendorManifest.includes(popperVendorRef), 'popper should not be part of the generic post-boot vendor batch');
assert.ok(!deferredVendorManifest.includes(tippyVendorRef), 'tippy should not be part of the generic post-boot vendor batch');
assert.ok(!deferredVendorManifest.includes(simplebarVendorRef), 'simplebar should not be part of the generic post-boot vendor batch');
assert.ok(bootRuntime.includes('window.__BOOT_SCRIPT_REGISTRY__'), 'boot-runtime.js should cache boot script lookup state');
assert.ok(bootRuntime.includes('function isBootScriptLoaded'), 'boot-runtime.js should reuse cached script load checks');
assert.ok(bootRuntime.includes("'shell-polish': bootSkill('idle', 'demand'"), 'shell polish should stay behind the on-demand runtime loader');
assert.ok(bootRuntime.includes('window.ensureShellPolishRuntimeLoaded'), 'shell polish should still expose an explicit loader');
const authStateIndex = normalizedModuleManifest.indexOf(authStateRef);
const workspaceStateIndex = normalizedModuleManifest.indexOf(workspaceStateRef);
const examStateIndex = normalizedModuleManifest.indexOf(examStateRef);
const schoolStateIndex = normalizedModuleManifest.indexOf(schoolStateRef);
const teacherStateIndex = normalizedModuleManifest.indexOf(teacherStateRef);
const dataStateIndex = normalizedModuleManifest.indexOf(dataStateRef);
const supportStateIndex = normalizedModuleManifest.indexOf(supportStateRef);
const supportMetricsIndex = normalizedModuleManifest.indexOf(supportMetricsRef);
const progressStateIndex = normalizedModuleManifest.indexOf(progressStateRef);
const reportSessionStateIndex = normalizedModuleManifest.indexOf(reportSessionStateRef);
const compareSessionStateIndex = normalizedModuleManifest.indexOf(compareSessionStateRef);
const compareResultStateIndex = normalizedModuleManifest.indexOf(compareResultStateRef);
const compareSummaryStateIndex = normalizedModuleManifest.indexOf(compareSummaryStateRef);
const cloudApiIndex = normalizedModuleManifest.indexOf(cloudApiRef);
const cloudConnectionIndex = normalizedModuleManifest.indexOf(cloudConnectionRef);
const systemPerformanceIndex = normalizedModuleManifest.indexOf(systemPerformanceRef);
const dataCloudIndex = normalizedModuleManifest.indexOf(dataCloudRef);
const issueManagerIndex = normalizedModuleManifest.indexOf(issueManagerRef);
const packagerIndex = normalizedModuleManifest.indexOf(packagerRef);
const helpSystemIndex = normalizedModuleManifest.indexOf(helpSystemRef);
const loggerIndex = normalizedModuleManifest.indexOf(loggerRef);
const workerApiIndex = normalizedModuleManifest.indexOf(workerApiRef);
const accountManagerIndex = normalizedModuleManifest.indexOf(accountManagerRef);
const dataManagerTeacherIndex = normalizedModuleManifest.indexOf(dataManagerTeacherRef);
const dataManagerStudentIndex = normalizedModuleManifest.indexOf(dataManagerStudentRef);
const dataManagerArchiveIndex = normalizedModuleManifest.indexOf(dataManagerArchiveRef);
const dataManagerGrade9TemplateIndex = normalizedModuleManifest.indexOf(dataManagerGrade9TemplateRef);
const dataManagerParamsIndex = normalizedModuleManifest.indexOf(dataManagerParamsRef);
const dataManagerTargetsIndex = normalizedModuleManifest.indexOf(dataManagerTargetsRef);
const dataManagerSchoolAliasIndex = normalizedModuleManifest.indexOf(dataManagerSchoolAliasRef);
const dataManagerSaveSyncIndex = normalizedModuleManifest.indexOf(dataManagerSaveSyncRef);
const dataManagerHistoryIndex = normalizedModuleManifest.indexOf(dataManagerHistoryRef);
const dataManagerTabIndex = normalizedModuleManifest.indexOf(dataManagerTabRef);
const compareCloudContextIndex = normalizedModuleManifest.indexOf(compareCloudContextRef);
const compareExamSyncIndex = normalizedModuleManifest.indexOf(compareExamSyncRef);
const townSubmoduleCompareStateIndex = normalizedModuleManifest.indexOf(townSubmoduleCompareStateRef);
const townSubmoduleCompareIndex = normalizedModuleManifest.indexOf(townSubmoduleCompareRef);
const compareSelectorsIndex = normalizedModuleManifest.indexOf(compareSelectorsRef);
const progressAnalysisIndex = normalizedModuleManifest.indexOf(progressAnalysisRef);
const cloudIndex = normalizedModuleManifest.indexOf(cloudRef);
const cloudWorkspaceIndex = normalizedModuleManifest.indexOf(cloudWorkspaceRef);
const shellRuntimeIndex = normalizedModuleManifest.indexOf(shellRuntimeRef);
const shellPolishRuntimeIndex = normalizedModuleManifest.indexOf(shellPolishRuntimeRef);
const moduleEntryRuntimeIndex = normalizedModuleManifest.indexOf(moduleEntryRuntimeRef);
const rankingDataServiceIndex = normalizedModuleManifest.indexOf(rankingDataServiceRef);
const studentJumpIndex = normalizedModuleManifest.indexOf(studentJumpRef);
const appIndex = normalizedModuleManifest.indexOf(appRef);
const bootRuntimeIndex = indexHtml.indexOf(bootRuntimeRef);
const popperVendorIndex = bootRuntimeReferenceIndex(popperVendorRef);
const tippyVendorIndex = bootRuntimeReferenceIndex(tippyVendorRef);
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
assert.ok(supportMetricsIndex >= 0, 'index.html should load support-metrics-runtime.js');
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
assert.strictEqual(townSubmoduleCompareIndex, -1, 'town-submodule-compare-runtime.js should be lazy-loaded instead of boot-loaded');
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
assert.strictEqual(shellPolishRuntimeIndex, -1, 'shell-polish-runtime.js should be idle-loaded instead of blocking core app boot');
assert.ok(moduleEntryRuntimeIndex >= 0, 'index.html should load module-entry-runtime.js');
assert.ok(rankingDataServiceIndex >= 0, 'index.html should load ranking-data-service-runtime.js');
assert.ok(appIndex >= 0, 'index.html should load app.js');
assert.ok(bootRuntimeReferences(progressAnalysisRef), 'boot-runtime.js should reference progress-analysis-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(teacherAnalysisMainRef), 'boot-runtime.js should reference teacher-analysis-main-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(teacherAnalysisCoreRef), 'boot-runtime.js should reference teacher-analysis-core-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(teacherAnalysisUiRef), 'boot-runtime.js should reference teacher-analysis-ui-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(teacherAnalysisBridgeRef), 'boot-runtime.js should reference teacher-analysis-bridge-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(schoolProfileRef), 'boot-runtime.js should reference school-profile-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(teachingManagementRef), 'boot-runtime.js should reference teaching-management-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(teachingManagementCloudRef), 'boot-runtime.js should reference teaching-management-cloud-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(teachingManagementOverviewRef), 'boot-runtime.js should reference teaching-management-overview-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(studentOverviewRef), 'boot-runtime.js should reference student-overview-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(teachingManagementVersionRef), 'boot-runtime.js should reference teaching-management-version-runtime.js for lazy loading');
assert.ok(bootRuntime.includes("'student-overview': bootSkill('demand', 'demand', ['student-overview']"), 'student overview should have its own demand runtime skill');
assert.ok(bootRuntime.includes("window.ensureStudentOverviewRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureStudentOverviewRuntimeLoaded');
assert.ok(bootRuntime.includes("'report-render': bootSkill('demand', 'demand', ['report-generator', 'renderSingleReportCardHTML']"), 'report HTML rendering should have its own lightweight demand runtime skill');
assert.ok(bootRuntime.includes("'report-chart': bootSkill('demand', 'demand', ['renderRadarChart', 'renderVarianceChart', 'analyzeStrengthsAndWeaknesses']"), 'report charts should have their own demand runtime skill');
assert.ok(bootRuntime.includes("'report-export': bootSkill('demand', 'demand', ['printSingleReport', 'copyReport']"), 'report export should have its own demand runtime skill');
assert.ok(bootRuntime.includes("window.ensureReportChartRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureReportChartRuntimeLoaded');
assert.ok(bootRuntime.includes("window.ensureReportExportRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureReportExportRuntimeLoaded');
assert.ok(bootRuntimeReferences(reportChartRef), 'boot-runtime.js should reference report-chart-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(reportExportRef), 'boot-runtime.js should reference report-export-runtime.js for lazy loading');
assert.ok(!indexHtml.includes('id="ai-analysis"'), 'index.html should not include the removed analysis module');
assert.ok(!indexHtml.includes('lazy-section-template-ai-analysis'), 'index.html should not include the removed analysis template');
assert.ok(!bootRuntime.includes('ai-hub-runtime.js'), 'boot-runtime.js should not reference removed hub runtime');
assert.ok(!bootRuntime.includes('report-ai-runtime.js'), 'boot-runtime.js should not reference removed report runtime');
assert.ok(!shellRuntime.includes('AI分析'), 'shell navigation should not include removed analysis category');
assert.ok(!bootRuntime.includes('login-instagram-runtime.js'), 'boot-runtime.js should not mention removed login prototype runtime');
assert.ok(!fs.existsSync(path.resolve(__dirname, '../public/history-grade.js')), 'removed history-grade.js patch should not remain in public assets');
assert.ok(!fs.existsSync(path.resolve(__dirname, '../public/assets/js/login-instagram-runtime.js')), 'removed login-instagram-runtime.js should not remain in public assets');
assert.ok(!fs.existsSync(path.resolve(__dirname, '../public/assets/vendor/web-llm/index.js')), 'removed WebLLM vendor should not remain after AI cleanup');
assert.ok(bootRuntimeReferences(cryptoJsVendorRef), 'boot-runtime.js should reference crypto-js.min.js for lazy loading');
assert.ok(bootRuntimeReferences(townSubmoduleCompareRef), 'boot-runtime.js should reference town-submodule-compare-runtime.js for lazy loading');
assert.ok(bootRuntimeReferences(alasqlVendorRef), 'boot-runtime.js should reference alasql.min.js for lazy loading');
assert.ok(bootRuntimeReferences(sweetalertVendorRef), 'boot-runtime.js should reference sweetalert2.all.min.js for lazy loading');
assert.ok(bootRuntimeReferences(gsapVendorRef), 'boot-runtime.js should reference gsap.min.js for lazy loading');
assert.ok(bootRuntimeReferences(chartVendorRef), 'boot-runtime.js should reference chart.umd.min.js for lazy loading');
assert.ok(bootRuntimeReferences(xlsxVendorRef), 'boot-runtime.js should reference xlsx.full.min.js for lazy loading');
assert.ok(bootRuntimeReferences(jspdfVendorRef), 'boot-runtime.js should reference jspdf.umd.min.js for lazy loading');
assert.ok(bootRuntimeReferences(html2canvasVendorRef), 'boot-runtime.js should reference html2canvas.min.js for lazy loading');
assert.ok(!fs.existsSync(path.resolve(__dirname, '../public/assets/vendor/popperjs/popper.min.js.map')), 'production Popper sourcemap should not be shipped');
assert.ok(!fs.existsSync(path.resolve(__dirname, '../public/assets/vendor/tippyjs/tippy.umd.min.js.map')), 'production Tippy sourcemap should not be shipped');
assert.ok(!popperVendorSource.includes('sourceMappingURL=popper.min.js.map'), 'Popper vendor should not request a removed sourcemap');
assert.ok(!tippyVendorSource.includes('sourceMappingURL=tippy.umd.min.js.map'), 'Tippy vendor should not request a removed sourcemap');
assert.ok(bootRuntime.includes("window.ensureAlasqlVendorLoaded = function ()"), 'boot-runtime.js should expose ensureAlasqlVendorLoaded');
assert.ok(bootRuntime.includes("window.ensureCryptoJsVendorLoaded = function ()"), 'boot-runtime.js should expose ensureCryptoJsVendorLoaded');
assert.ok(bootRuntime.includes("window.ensureSweetAlertVendorLoaded = function ()"), 'boot-runtime.js should expose ensureSweetAlertVendorLoaded');
assert.ok(bootRuntime.includes('function installLazySweetAlertProxy'), 'boot-runtime.js should install a lazy SweetAlert proxy');
assert.ok(bootRuntime.includes("window.ensureGsapVendorLoaded = function ()"), 'boot-runtime.js should expose ensureGsapVendorLoaded');
assert.ok(bootRuntime.includes("window.ensureChartVendorLoaded = function ()"), 'boot-runtime.js should expose ensureChartVendorLoaded');
assert.ok(bootRuntime.includes("window.ensureXlsxVendorLoaded = function ()"), 'boot-runtime.js should expose ensureXlsxVendorLoaded');
assert.ok(bootRuntime.includes('window.wrapXlsxRuntimeExports = function ()'), 'boot-runtime.js should wrap Excel entry points with lazy XLSX loading');
assert.ok(bootRuntime.includes("window.ensureTownSubmoduleCompareRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureTownSubmoduleCompareRuntimeLoaded');
const townCompareUiStart = townSubmoduleCompareRuntime.indexOf("function ensureTownSubmoduleCompareUIs(submoduleId = '')");
const townCompareUiEnd = townSubmoduleCompareRuntime.indexOf('function getTownSubmoduleSeries', townCompareUiStart);
assert.ok(townCompareUiStart >= 0 && townCompareUiEnd > townCompareUiStart, 'town submodule compare UI function should be discoverable');
const townCompareUiSource = townSubmoduleCompareRuntime.slice(townCompareUiStart, townCompareUiEnd);
const townCompareLoopStart = townCompareUiSource.indexOf('getTownSubmoduleCompareEntries(submoduleId).forEach');
const townCompareLoopEnd = townCompareUiSource.indexOf('    if (didChange)', townCompareLoopStart);
assert.ok(townCompareLoopStart >= 0 && townCompareLoopEnd > townCompareLoopStart, 'town submodule compare UI should batch refreshes after the insert loop');
const townCompareInsertLoop = townCompareUiSource.slice(townCompareLoopStart, townCompareLoopEnd);
assert.ok(!townCompareInsertLoop.includes('applyComparisonPanelCollapses'), 'town submodule compare UI should not refresh panel collapses once per submodule insert');
assert.ok(!townCompareInsertLoop.includes('refreshShellEnhancements'), 'town submodule compare UI should not refresh shell enhancements once per submodule insert');
assert.ok(!townCompareUiSource.includes('refreshShellEnhancements'), 'town submodule compare UI should not trigger a full shell enhancement refresh');
assert.ok(!townCompareInsertLoop.includes('section.querySelector'), 'town submodule compare UI should not deep scan large module sections during entry');
assert.ok(townSubmoduleCompareRuntime.includes('function getTownSubmoduleSecHead(section)'), 'town submodule compare UI should locate section headers with a shallow helper');
assert.ok(townSubmoduleCompareRuntime.includes('function scheduleTownSubmoduleCompareCollapseBinding()'), 'town submodule compare collapse binding should be scheduled');
assert.ok(townSubmoduleCompareRuntime.includes('window.requestAnimationFrame'), 'town submodule compare collapse binding should defer DOM binding off the module-enter path');
assert.ok(moduleEntryRuntime.includes("scheduleModuleTask('town-submodule-compare-ui'"), 'town submodule compare UI should be scheduled outside the synchronous module-enter path');
assert.ok(moduleEntryRuntime.includes("{ delay: 420, idle: true, timeout: 1800 }"), 'town submodule compare UI should wait for idle time instead of competing with first-entry renders');
assert.ok(townSubmoduleCompareRuntime.includes('function getTownSubmoduleCompareEntries(submoduleId = \'\')'), 'town submodule compare UI should support targeted per-module creation');
assert.ok(townSubmoduleCompareRuntime.includes('getTownSubmoduleCompareEntries(submoduleId).forEach'), 'town submodule compare UI should avoid inserting every panel during single-module entry');
assert.ok(moduleEntryRuntime.includes('ensureTownSubmoduleCompareUIs(id)'), 'module entry should create only the active town submodule compare UI');
assert.ok(bootRuntime.includes("window.ensurePdfExportVendorsLoaded = function ()"), 'boot-runtime.js should expose ensurePdfExportVendorsLoaded');
assert.ok(!bootRuntime.includes("window.ensurePresentationVendorsLoaded = function ()"), 'boot-runtime.js should not expose removed PPT vendor loader');
assert.ok(bootRuntime.includes('var SYSTEM_RUNTIME_SKILLS = {'), 'boot-runtime.js should declare a runtime skill manifest');
assert.ok(bootRuntime.includes('window.SystemRuntimeLoader'), 'boot-runtime.js should expose the runtime skill loader');
assert.ok(bootRuntime.includes('function getBootScriptBatchSize()'), 'boot-runtime.js should batch boot script insertion on constrained devices');
assert.ok(bootRuntime.includes('var APP_MODULE_DESKTOP_BATCH_SIZE = 6;'), 'desktop boot scripts should also load in bounded batches');
assert.ok(bootRuntime.includes('return APP_MODULE_DESKTOP_BATCH_SIZE;'), 'desktop boot script loading should yield between bounded batches');
assert.ok(bootRuntime.includes('function yieldBootScriptBatchFrame()'), 'boot-runtime.js should yield between boot script batches');
assert.ok(bootRuntime.includes('if (isRuntimeMobileViewport()) return;'), 'boot-runtime.js should skip desktop deferred vendor prefetch on mobile');
assert.ok(bootRuntime.includes('function shouldPrefetchLateAppCoreModules()'), 'boot-runtime.js should gate late app-core prefetches');
assert.ok(bootRuntime.includes('function scheduleLateAppCorePrefetch'), 'boot-runtime.js should schedule late app-core prefetches outside the critical boot path');
assert.ok(bootRuntime.includes('window.__APP_CORE_LATE_PREFETCH_SCHEDULED__'), 'boot-runtime.js should avoid duplicate late app-core prefetch scheduling');
assert.ok(bootRuntime.includes('SYSTEM_APP_LATE_PREFETCH_LIMIT'), 'boot-runtime.js should make late app-core prefetch limits configurable');
assert.ok(bootRuntime.includes('scheduleLateAppCorePrefetch(APP_MODULES.slice(preloadCount));'), 'boot-runtime.js should defer late app-core prefetches on mobile or lazy profiles');
assert.ok(bootRuntime.includes('if (window.__APP_MODULES_LOADED__ === true) return;'), 'late app-core prefetch should stop once core modules are already loaded');
assert.ok(bootRuntime.includes('function getRuntimeWarmupSkillIds'), 'boot-runtime.js should compute runtime warmup targets before scheduling idle work');
assert.ok(bootRuntime.includes('!DEFERRED_APP_MODULES.length && !getRuntimeWarmupSkillIds(getRuntimeLoadProfile()).length'), 'boot-runtime.js should skip idle warmup when there are no runtime targets');
assert.ok(bootRuntime.includes('function scheduleGatewayPreflight()'), 'boot-runtime.js should run gateway pre-flight through a dedicated scheduler');
assert.ok(bootRuntime.includes('window.__GATEWAY_PREFLIGHT_PROMISE__'), 'boot-runtime.js should expose gateway pre-flight state for diagnostics');
assert.ok(bootRuntime.includes('scheduleGatewayPreflight();\n\n    const total = BOOT_VENDOR_MODULES.length + APP_MODULES.length;'), 'gateway pre-flight should not block core module loading');
assert.strictEqual(bootRuntime.includes('正在检测网关连接'), false, 'gateway pre-flight should not hold the boot loader on a network probe');
assert.ok(bootRuntime.includes('function markAppModulesReady()'), 'boot-runtime.js should mark app modules ready through a shared helper');
assert.ok(bootRuntime.includes('school:app-modules-ready'), 'boot-runtime.js should dispatch an app modules ready event');
assert.ok(bootRuntime.includes('function scheduleMobileRuntimeBootstrap'), 'boot-runtime.js should defer mobile runtime bootstrapping');
assert.ok(bootRuntime.includes('runAfterAppModulesReady'), 'boot-runtime.js should wait for core modules before mobile runtime bootstrap');
assert.ok(bootRuntime.includes("{ label: 'data-manager-sql', loader: () => window.ensureDataManagerSqlRuntimeLoaded?.() }"), 'boot-runtime.js should idle-warm data manager SQL runtime');
assert.ok(bootRuntime.includes("'teacher-analysis':"), 'runtime skill manifest should include teacher-analysis');
assert.ok(bootRuntime.includes("'teacher-correlation':"), 'runtime skill manifest should include teacher-correlation');
assert.ok(bootRuntime.includes("window.ensureTeacherCorrelationRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureTeacherCorrelationRuntimeLoaded');
assert.ok(!bootRuntime.includes("'teacher-analysis', 'cohort-growth', 'correlation-analysis'"), 'correlation analysis should not pull the full teacher-analysis skill');
assert.ok(bootRuntime.includes("'crypto-vendor':"), 'runtime skill manifest should include crypto-vendor');
assert.ok(bootRuntime.includes("'shell-enhancements':"), 'runtime skill manifest should include shell-enhancements');
assert.ok(bootRuntime.includes("'shell-enhancements': bootSkill('idle', 'demand'"), 'shell-enhancements should stay demand-loaded instead of warming during post-boot idle');
assert.ok(bootRuntime.includes("'sweetalert-vendor': bootSkill('idle', 'demand'"), 'sweetalert-vendor should stay demand-loaded instead of warming during post-boot idle');
assert.ok(bootRuntime.includes("'town-submodule-compare':"), 'runtime skill manifest should include town-submodule-compare');
assert.ok(bootRuntime.includes("'sweetalert-vendor':"), 'runtime skill manifest should include sweetalert-vendor');
assert.ok(bootRuntime.includes("'chart-vendor':"), 'runtime skill manifest should include chart-vendor');
assert.ok(!bootRuntime.includes("'presentation-export':"), 'runtime skill manifest should not include removed PPT export skill');
assert.ok(bootRuntime.includes("'zhongkao-countdown':"), 'runtime skill manifest should include zhongkao-countdown');
assert.ok(bootRuntime.includes("'packager':"), 'runtime skill manifest should include packager');
assert.ok(bootRuntime.includes("'worker-api':"), 'runtime skill manifest should include worker-api');
assert.ok(bootRuntime.includes("window.ensureZhongkaoCountdownRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureZhongkaoCountdownRuntimeLoaded');
assert.ok(bootRuntime.includes("window.ensurePackagerRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensurePackagerRuntimeLoaded');
assert.ok(bootRuntime.includes("window.ensureWorkerApiRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureWorkerApiRuntimeLoaded');
assert.ok(!bootRuntime.includes("{ label: 'xlsx-vendor', loader: () => window.ensureXlsxVendorLoaded?.() }"), 'spreadsheet vendor should not actively warm during normal navigation');
assert.ok(!bootRuntime.includes("{ label: 'freshman-exam', loader: () => window.ensureFreshmanExamRuntimeLoaded?.() }"), 'freshman runtime should stay demand-loaded outside freshman/exam modules');
const summaryEntryStart = moduleEntryRuntime.indexOf("if (id === 'summary')");
const summaryEntryEnd = moduleEntryRuntime.indexOf("if (id === 'app-download-center')", summaryEntryStart);
const summaryEntrySource = summaryEntryStart >= 0 && summaryEntryEnd > summaryEntryStart
    ? moduleEntryRuntime.slice(summaryEntryStart, summaryEntryEnd)
    : '';
assert.ok(summaryEntrySource, 'summary entry source should be present');
assert.ok(!summaryEntrySource.includes('ensureSchoolProfileRuntimeLoaded'), 'summary entry should not parse school profile runtime before a profile click');
assert.ok(bootRuntime.includes('window.setTimeout(preload, 240);'), 'desktop hotspot prefetch should begin before runtime hydration work');
assert.ok(bootRuntime.includes('const prioritySteps = ['), 'desktop hotspot warmup should declare an interactive priority batch');
assert.ok(bootRuntime.includes('SCHOOL_RUNTIME_HOTSPOT_HYDRATE'), 'desktop hotspot runtime hydration should require an explicit local switch');
assert.ok(bootRuntime.includes('runStepsSequentially(prioritySteps'), 'interactive runtime warmup should avoid concurrent hot bundle parsing during user interaction');
assert.ok(bootRuntime.includes("scheduleWarmup('hotspot-runtime:priority', runPrioritySteps)"), 'interactive runtime warmup should retain idle scheduling for boot responsiveness');
assert.ok(bootRuntime.indexOf("{ label: 'town-submodule-compare'") < bootRuntime.indexOf('const deferredSteps = ['), 'summary interaction runtimes should remain in the priority batch');
assert.ok(bootRuntime.includes('runAfterAppModulesReady(function () {\n    retryInstallLateHook(installHistoryDoQueryWrapper'), 'late workspace hooks should not retry on the unauthenticated login screen');
assert.ok(bootRuntime.includes("'renderMultiPeriodComparison'"), 'boot-runtime.js should keep the progress multi-period compare entry lazy-loadable');
assert.ok(bootRuntime.includes("'exportMultiPeriodComparison'"), 'boot-runtime.js should keep the progress multi-period export entry lazy-loadable');
assert.ok(bootRuntime.includes('loadAll()'), 'runtime skill loader should support full loading');
assert.ok(shellPolishRuntime.includes('function scheduleEnhancementRuntimeLoad()'), 'shell-polish-runtime.js should schedule shell enhancement hydration itself');
assert.ok(shellPolishRuntime.includes("window.SystemRuntimeLoader.load('shell-enhancements')"), 'shell-polish-runtime.js should demand-load shell-enhancements after the app is visible');
assert.ok(shellPolishRuntime.includes("getRuntimeLoadProfile() === 'lazy'"), 'shell-polish-runtime.js should respect the lazy runtime profile');
assert.ok(shellPolishRuntime.includes('if (isMobileViewport()) return false;'), 'shell-polish-runtime.js should skip desktop shell enhancements on mobile');
assert.ok(indexHtml.includes('shell-overview-context-row'), 'shell overview should move workspace context into the top right row');
assert.ok(indexHtml.includes('shell-overview-pills--dock'), 'shell overview should dock cohort and mode chips in the context row');
assert.ok(indexHtml.includes('<span>Workspace</span>'), 'shell overview workspace launcher should use compact English copy');
assert.ok(!indexHtml.includes('id="shell-active-module"'), 'shell overview should remove the current-focus card from the top hero');
assert.ok(!indexHtml.includes('id="shell-active-hint"'), 'shell overview should remove the next-step card from the top hero');
assert.ok(!indexHtml.includes('shell-pulse-grid shell-pulse-grid--dock'), 'shell overview should not render the docked pulse grid');
assert.ok(!shellRuntime.includes('shell-active-module'), 'shell runtime should not query the removed current-focus card');
assert.ok(!shellRuntime.includes('shell-active-hint'), 'shell runtime should not query the removed next-step card');
assert.ok(!shellPolishRuntime.includes('#shell-active-module'), 'shell polish runtime should not bind tooltip to removed current-focus card');
assert.ok(!shellPolishRuntime.includes('#shell-active-hint'), 'shell polish runtime should not bind tooltip to removed next-step card');
assert.ok(shellRuntime.includes('function formatOverviewCohortText'), 'shell overview should compact cohort chip text for the docked row');
assert.ok(shellRuntime.includes('function formatOverviewModeText'), 'shell overview should compact mode chip text for the docked row');
assert.ok(shellRuntime.includes('function buildModuleRailSignature'), 'module rail should cache its rendered structure between module switches');
assert.ok(shellRuntime.includes('function syncModuleRailActiveState'), 'module rail should update active chips without rebuilding the rail');
assert.ok(shellRuntime.includes('dataset.moduleRailSignature'), 'module rail should store a render signature on the rail element');
assert.ok(shellRuntime.includes('dataset.moduleRailDelegated'), 'module rail should use delegated clicks instead of rebinding each chip');
assert.ok(!shellRuntime.includes("rail.querySelectorAll('.shell-module-rail-chip').forEach((button) => {\n            button.addEventListener('click'"), 'module rail should avoid per-render chip click listeners');
assert.ok(moduleEntryRuntime.includes('const TEACHER_ANALYSIS_RENDER_DELAY_MS = 16;'), 'teacher portrait should auto-render on the next frame after entering the module');
assert.ok(moduleEntryRuntime.includes('ensureTeacherAnalysisMainRuntimeLoaded()'), 'teacher portrait entry should load its runtime automatically');
assert.ok(moduleEntryRuntime.includes('function scheduleTeacherCompareAutoRender'), 'teacher multi-period compare should auto-render from default selectors');
assert.ok(moduleEntryRuntime.includes('function scheduleActiveModuleTask'), 'module entry should defer non-critical active-module work');
assert.ok(moduleEntryRuntime.includes("'analysis-entry-selects'"), 'analysis module should defer selector and hint refresh off the switch frame');
assert.ok(moduleEntryRuntime.includes("`county-analysis-render:${id}`"), 'county analysis should schedule heavy rendering after the switch frame');
assert.ok(moduleEntryRuntime.includes("'report-generator-selects'"), 'report generator should defer selector refresh off the switch frame');
assert.ok(moduleEntryRuntime.includes('function prewarmReportGeneratorRuntimes'), 'report generator should prewarm query runtimes after entry');
assert.ok(moduleEntryRuntime.includes("'report-generator-runtime-prewarm'"), 'report generator runtime prewarm should be scheduled off the switch frame');
assert.ok(moduleEntryRuntime.includes('ensureReportRenderRuntimeLoaded'), 'report generator prewarm should include report rendering runtime');
const reportPrewarmStart = moduleEntryRuntime.indexOf('function prewarmReportGeneratorRuntimes');
const reportPrewarmEnd = moduleEntryRuntime.indexOf('function runModuleSpecificInit', reportPrewarmStart);
const reportPrewarmSource = reportPrewarmStart >= 0 && reportPrewarmEnd > reportPrewarmStart
    ? moduleEntryRuntime.slice(reportPrewarmStart, reportPrewarmEnd)
    : '';
const studentOverviewEntryStart = moduleEntryRuntime.indexOf('function initStudentOverviewEntry()');
const studentOverviewEntryEnd = moduleEntryRuntime.indexOf('function renderTeacherAnalysisEmptyState()', studentOverviewEntryStart);
const studentOverviewEntrySource = studentOverviewEntryStart >= 0 && studentOverviewEntryEnd > studentOverviewEntryStart
    ? moduleEntryRuntime.slice(studentOverviewEntryStart, studentOverviewEntryEnd)
    : '';
assert.ok(reportPrewarmSource, 'report generator prewarm source should be present');
assert.ok(!reportPrewarmSource.includes('ensureHistoryCompareRuntimeLoaded'), 'report generator should not prewarm legacy history compare runtime during normal report entry');
assert.ok(!reportPrewarmSource.includes('ensureStudentCompareRuntimeLoaded'), 'report generator should not prewarm student compare runtime during normal report entry');
assert.ok(!reportPrewarmSource.includes('ensureReportChartRuntimeLoaded'), 'report generator should not prewarm chart runtime during normal report entry');
assert.ok(!reportPrewarmSource.includes('ensureReportExportRuntimeLoaded'), 'report generator should not prewarm export runtime during normal report entry');
const reportRenderSkillStart = bootRuntime.indexOf("'report-render':");
const reportChartSkillStart = bootRuntime.indexOf("'report-chart':");
const reportRenderSkillSource = reportRenderSkillStart >= 0 && reportChartSkillStart > reportRenderSkillStart
    ? bootRuntime.slice(reportRenderSkillStart, reportChartSkillStart)
    : '';
assert.ok(reportRenderSkillSource, 'report-render skill source should be present');
assert.ok(!reportRenderSkillSource.includes('chart-vendor'), 'report-render should not load Chart.js on the query critical path');
assert.ok(!reportRenderSkillSource.includes('report-chart-runtime.js'), 'report-render should not load report chart runtime on the query critical path');
assert.ok(!reportRenderSkillSource.includes('report-export-runtime.js'), 'report-render should not load report export runtime on the query critical path');
const historyDoQueryWrapperStart = bootRuntime.indexOf('function installHistoryDoQueryWrapper()');
const historyDoQueryWrapperEnd = bootRuntime.indexOf('function installDataManagerSqlHooks', historyDoQueryWrapperStart);
const historyDoQueryWrapperSource = historyDoQueryWrapperStart >= 0 && historyDoQueryWrapperEnd > historyDoQueryWrapperStart
    ? bootRuntime.slice(historyDoQueryWrapperStart, historyDoQueryWrapperEnd)
    : '';
assert.ok(historyDoQueryWrapperSource.includes('report-history-compare-target-sync'), 'report history hook should only sync compare targets when the compare runtime is already loaded');
assert.ok(!historyDoQueryWrapperSource.includes('ensureStudentCompareRuntimeLoaded'), 'report history hook should not load the student compare runtime during normal report generation');
assert.ok(!appSource.includes('report-student-compare-warmup'), 'report queries should not warm student compare runtime unless the user opens compare features');
assert.ok(!moduleEntryRuntime.includes("id === 'exam-arranger'\n            && typeof window.ensureGradeSchedulerRuntimeLoaded"), 'exam arranger should not eagerly load the grade scheduler runtime');
assert.ok(bootRuntime.includes("'grade-scheduler': bootSkill('demand', 'demand', ['grade-scheduler']"), 'grade scheduler runtime should load only for the grade scheduler module');
assert.ok(!moduleEntryRuntime.includes('initClassComparisonEntry'), 'removed class comparison should not have an entry initializer');
assert.ok(!indexHtml.includes('id="class-comparison"'), 'removed class comparison section should not be present in the app shell');
assert.ok(!moduleEntryRuntime.includes('initClassDiagnosisEntry'), 'removed class diagnosis should not have an entry initializer');
assert.ok(appSource.includes("'single-school-eval': 'teacher-analysis'"), 'removed performance fairness module should redirect to teacher analysis');
assert.ok(!mobileAppRuntime.includes("grade_director: 'starter-hub'"), 'grade director mobile home should not default to the hidden data management starter hub');
assert.ok(mobileAppRuntime.includes("grade_director: 'teacher-analysis'"), 'grade director mobile home should default to teacher analysis');
assert.ok(shellRuntime.includes('function isVisibleModuleActive(activeSectionId, visibleItems)'), 'shell should verify that the active module is visible for the current role');
assert.ok(shellRuntime.includes('if (!firstCard || activeIsVisible) return;'), 'shell should auto-enter the first visible module when the default active section is forbidden');
assert.ok(appSource.includes("const fallbackIds = ['starter-hub', 'teacher-analysis', 'student-overview', 'report-generator', 'app-download-center'];"), 'base config guard should redirect to the first role-visible module instead of forcing starter hub');
assert.ok(appSource.includes('function getTownAnalysisVisibleSubjectsForCurrentUser()'), 'town analysis should centralize role-aware subject detail visibility');
assert.ok(appSource.includes("if (role !== 'teacher') return allSubjects;"), 'only teacher role should hide non-teaching subject detail tables');
assert.ok(appSource.includes('visibleSubjects.forEach(sub => {'), 'town analysis subject detail tables should render only visible subjects');
assert.ok(indexHtml.includes('data-role-allow="admin,director,grade_director"'), 'teacher multi-period compare panel should only be visible to admin, director, and grade director');
assert.ok(appSource.includes('function applyRoleAllowVisibility(root = document)'), 'role-limited local panels should be hidden by a shared runtime helper');
assert.ok(indexHtml.includes('class="analysis-action-stack" data-role-allow="admin,director,grade_director"'), 'student detail export actions should be admin/director/grade-director only');
assert.ok(indexHtml.includes('class="explain-panel analysis-doc-panel" data-role-allow="admin,director,grade_director"'), 'student detail usage advice should be admin/director/grade-director only');
assert.ok(indexHtml.includes('class="student-details-secondary-flow" data-role-allow="admin,director,grade_director"'), 'student multi-period compare flow should be admin/director/grade-director only');
assert.ok(moduleEntryRuntime.includes('applyStudentDetailsRoleVisibility'), 'student details lazy entry should reapply role visibility after template insertion');
assert.ok(teacherCompareResultRuntime.includes('function canUseTeacherMultiPeriodCompare()'), 'teacher multi-period compare runtime should have a role guard');
assert.ok(teacherCompareResultRuntime.includes('guardTeacherMultiPeriodCompare(hintEl, resultEl)'), 'teacher multi-period compare generation should enforce the role guard');
assert.ok(teacherCompareCloudRuntime.includes('function guardTeacherMultiPeriodCloudAction()'), 'teacher multi-period cloud actions should enforce the role guard');
assert.ok(permissionPolicyRuntime.includes("roleChecks.push(ownTeacherMetric || (!!normalizedSubject && teachingScope.subjects.has(normalizedSubject)));"), 'teacher-analysis should allow teachers to see same-school same-subject teacher metrics');
assert.ok(teacherAnalysisCoreRuntime.includes("const useSchoolWideTeacherPeerScope = useAdminTeacherMetricScope || (isTeacherUser && !isClassTeacherUser);"), 'teacher-analysis should allow township ranking to use admin teacher metric scope');
assert.ok(teacherAnalysisCoreRuntime.includes('useSchoolWideTeacherPeerScope ? null : user'), 'teacher-analysis baselines should use school-wide peer scope for teacher comparison rows');
assert.ok(teacherAnalysisCoreRuntime.includes("teacherMetricScope: 'admin'"), 'teacher township ranking should be able to calculate from admin-scope teacher stats');
assert.ok(teacherAnalysisUiRuntime.includes("window.calculateTeacherTownshipRanking({ teacherMetricScope: 'admin' });"), 'teacher township ranking UI should use admin-scope metric values for all roles');
assert.ok(!shellRuntime.includes("text: '绩效公平考核模型'"), 'teaching management quick switch should not expose the removed performance fairness module');
assert.ok(!teachingManagementOverviewRuntime.includes("tmSetQuickEntryState(\n        'single-school-eval'"), 'teaching management overview should not render a performance fairness quick entry');
assert.ok(teachingManagementOverviewRuntime.includes("const supportedModules = ['teacher-analysis'];"), 'teaching management state bars should only cover retained modules');
assert.ok(moduleEntryRuntime.includes("if (id === 'single-school-eval') return false;"), 'module entry runtime should not initialize the removed performance fairness module');
assert.ok(indexHtml.includes('onclick="renderTeacherAnalysisNow()">刷新教师画像'), 'teacher portrait should expose an explicit refresh action');
const teacherEntryStart = moduleEntryRuntime.indexOf('function initTeacherAnalysisEntry()');
const teacherEntryEnd = moduleEntryRuntime.indexOf('function releaseTeacherAnalysisHeavyDom()', teacherEntryStart);
const teacherEntrySource = moduleEntryRuntime.slice(teacherEntryStart, teacherEntryEnd);
assert.ok(teacherEntrySource.includes("'teacher-analysis-auto-render'"), 'teacher-analysis entry should auto-generate the portrait after the switch frame');
assert.ok(teacherEntrySource.includes('scheduleTeacherCompareAutoRender(16);'), 'teacher-analysis entry should initialize teacher compare selectors immediately after the switch frame');
assert.ok(teacherEntrySource.includes('ensureTeacherAnalysisMainRuntimeLoaded'), 'teacher-analysis entry should load the analysis runtime from the fast auto-render task');
assert.ok(!teacherEntrySource.includes('ensureTeacherMap(true)'), 'teacher-analysis entry should not auto-load teacher maps on switch');
assert.ok(!teacherEntrySource.includes('updateTeacherCompareExamSelects'), 'teacher-analysis entry should not scan compare exam selectors on switch');
assert.ok(!teacherEntrySource.includes('inferTeacherSchoolIfNeeded'), 'teacher-analysis entry should not infer teacher school on switch');
assert.ok(moduleEntryRuntime.includes('window.tmScheduleTeachingOverviewRender()'), 'module entry should schedule teaching overview refreshes after teacher analysis phases');
assert.ok(moduleEntryRuntime.includes('historyLimit: 0'), 'teacher-analysis entry should use a fast no-history first render');
assert.ok(moduleEntryRuntime.includes('window.smScheduleStudentOverviewRender()'), 'module entry should schedule student overview first renders');
assert.ok(teacherStateRuntime.includes('function peekTeacherStats()'), 'teacher-state-runtime.js should expose a non-cloning stats read path for hot overview renders');
assert.ok(appSource.includes('TeacherStateRuntime.peekTeacherStats'), 'app.js readTeacherStats should avoid deep cloning teacher stats on hot paths');
assert.ok(teachingManagementRuntime.includes('window.tmScheduleTeachingOverviewRender = tmScheduleTeachingOverviewRender'), 'teaching overview refresh should be externally schedulable');
assert.ok(moduleEntryRuntime.includes('const scheduleTeachingRender = (label, task, options = {}) =>'), 'teaching management modules should share a deferred render helper');
assert.ok(moduleEntryRuntime.includes("scheduleTeachingRender('warning-center'"), 'teaching warning center should render after the module switch frame');
assert.ok(moduleEntryRuntime.includes("scheduleTeachingRender('version-center'"), 'teaching version center should render after the module switch frame');
assert.ok(moduleEntryRuntime.includes("loadScriptOnce('compare-selectors'"), 'teacher analysis should load compare selector runtime before refreshing multi-period controls');
assert.ok(moduleEntryRuntime.includes("scheduleTeacherAnalysisPhase(token, 'teacher-analysis-refresh-compare-selects'"), 'teacher analysis should refresh multi-period selectors after first render');
assert.ok(appSource.includes('var TM_TEACHER_COVERAGE_CACHE'), 'teaching overview should cache teacher coverage for repeated renders');
assert.ok(appSource.includes('var TM_TEACHER_INSIGHT_CACHE'), 'teaching overview should cache teacher insight scans for repeated renders');
assert.ok(teachingManagementVersionRuntime.includes('var TM_CURRENT_VERSION_PAYLOAD_CACHE'), 'teaching version center should cache the current version payload');
assert.ok(teachingManagementVersionRuntime.includes('TM_CURRENT_VERSION_PAYLOAD_CACHE = { key: cacheKey, payload };'), 'teaching version center should reuse current payload across one render cycle');
assert.ok(teacherAnalysisCoreRuntime.includes('window.tmScheduleTeachingOverviewRender()'), 'teacher analysis should schedule overview refresh instead of blocking the same render frame');
assert.ok(teacherAnalysisCoreRuntime.includes('const townshipSchoolEligibilityCache = new Map();'), 'teacher township ranking should cache school eligibility checks');
assert.ok(teacherAnalysisCoreRuntime.includes('townshipSchoolEligibilityCache.get(normalizedSchool)'), 'teacher township ranking should reuse cached township school matches');
assert.ok(teacherAnalysisUiRuntime.includes('teacher-township-jumpbar'), 'teacher township ranking should expose subject jump links');
assert.ok(teacherAnalysisUiRuntime.includes('teacher-township-quick-view'), 'teacher township ranking should expose compact teacher rank summaries');
assert.ok(mainCss.includes('.teacher-township-jumpbar'), 'teacher township jump links should have desktop styles');
assert.ok(countyAnalysisRuntime.includes('function createCountyTownshipMatcher'), 'county analysis should reuse a cached township school matcher');
assert.ok(countyAnalysisRuntime.includes('const isTownshipSchool = createCountyTownshipMatcher(scope.townshipSchools);'), 'county rank application should not fuzzy-match township schools per row');
assert.ok(countyAnalysisRuntime.includes('const isTownshipSchool = createCountyTownshipMatcher(normalized.townshipSchools);'), 'county teacher ranking should not fuzzy-match township schools repeatedly');
assert.ok(appSource.includes('const displaySourceList = STD_STATE.cacheData.slice(startIdx, endIdx);'), 'student details should paginate before comparison rank normalization');
assert.ok(appSource.includes('const displayList = displaySourceList.map((student) => getComparisonStudentView(student, RAW_DATA, comparisonContext));'), 'student details should normalize comparison rank data only for the visible page');
assert.ok(!appSource.includes('data = getComparisonStudentList(data, RAW_DATA);'), 'student details should avoid full-list comparison normalization before pagination');
assert.ok(!bootRuntime.includes("'student-compare': bootSkill('demand', 'demand', ['student-details'"), 'student compare runtime should not be triggered by entering student details');
assert.ok(bootRuntime.includes("'student-compare': bootSkill('demand', 'demand', ['renderStudentMultiPeriodComparison', 'saveStudentCompareToCloud', 'viewCloudStudentCompares']"), 'student compare runtime should load only for explicit multi-period actions');
assert.ok(!bootRuntime.includes("{ label: 'student-compare', loader: () => window.ensureStudentCompareRuntimeLoaded?.() }"), 'student compare runtime should not be part of hotspot warmup');
assert.ok(moduleEntryRuntime.includes('const canUseStudentMultiPeriod = role ==='), 'student details should gate multi-period prewarm by role');
assert.ok(moduleEntryRuntime.includes("delay: 1400, idle: true, timeout: 3200"), 'student details should defer multi-period prewarm after first render');
assert.ok(schoolNormalizationRuntime.includes('const townshipEligibilityCache = new Map();'), 'shared township row filtering should cache per-school eligibility');
assert.ok(schoolNormalizationRuntime.includes('townshipEligibilityCache.get(school)'), 'shared township row filtering should reuse per-school eligibility checks');
assert.ok(appSource.includes('const totalsBySchool = new Map();'), 'student comparison rank context should pre-group totals by school');
assert.ok(appSource.includes('const totalsByClass = new Map();'), 'student comparison rank context should pre-group totals by class');
assert.ok(teachingManagementRuntime.includes('function smScheduleStudentOverviewRender()'), 'student overview should coalesce filter-change refreshes into one frame');
assert.ok(studentOverviewRuntime.includes('function smScheduleStudentOverviewRender()'), 'student overview scheduler should live with the student overview runtime');
assert.ok(studentOverviewEntrySource.includes("window.SystemRuntimeLoader.load('student-overview')"), 'student overview entry should load only the student overview runtime');
assert.ok(!studentOverviewEntrySource.includes("window.SystemRuntimeLoader.load('teaching-management')"), 'student overview entry should not load the teaching-management bundle');
assert.ok(moduleEntryRuntime.includes('student-overview-deferred-select'), 'student overview should defer cross-module selector refreshes off the switch frame');
assert.ok(moduleEntryRuntime.includes('const deferredSelectorUpdates = ['), 'student overview should batch non-critical selector refreshes');
assert.ok(!studentOverviewEntrySource.includes('updateCorrelationSchoolSelect'), 'student overview should not refresh hidden correlation-analysis selectors on entry');
assert.ok(moduleEntryRuntime.includes('ensureTeacherCorrelationRuntimeLoaded'), 'correlation-analysis entry should load only the correlation runtime');
assert.ok(moduleEntryRuntime.includes("return Promise.reject(new Error('student overview runtime loader unavailable'))"), 'student overview entry should explicitly wait for its runtime loader before first render');
assert.ok(!moduleEntryRuntime.includes('window.ensureTeachingManagementRuntimeLoaded()\n                .then(() => {\n                    if (document.getElementById(\'student-overview\')?.classList.contains(\'active\')) renderNow();\n                })\n                .catch((error) => console.warn(error));\n            renderNow();'), 'student overview entry should not render once before the lazy runtime resolves');
assert.ok(studentOverviewRuntime.includes('const progressRows = fullProgressRows.length ? fullProgressRows : readProgressCacheState();'), 'student overview should avoid copying the progress cache for counts');
assert.ok(studentOverviewRuntime.includes('let progressCount = 0;'), 'student overview should count progress rows in a single pass');
assert.ok(studentOverviewRuntime.includes('const rerender = () => smScheduleStudentOverviewRender();'), 'student overview watchers should use scheduled rendering');
assert.ok(appSource.includes('const teacherRowsHtml = displayList.map'), 'teacher table rendering should build rows off-DOM before writing to tbody');
assert.ok(appSource.includes("tbody.innerHTML = teacherRowsHtml.join('');"), 'teacher table rendering should write teacher rows to the DOM once');
assert.ok(!appSource.includes('displayList.forEach(t => {'), 'teacher table rendering should avoid per-row DOM writes');
assert.ok(appSource.includes('const teacherInputFragment = document.createDocumentFragment();'), 'teacher input generation should collect controls in a fragment');
assert.ok(appSource.includes('container.appendChild(teacherInputFragment);'), 'teacher input generation should attach controls with one fragment append');
assert.ok(!appSource.includes('container.appendChild(inputDiv);'), 'teacher input generation should avoid per-control container appends');
assert.ok(appSource.includes('const targetRowsHtml = Object.keys(SCHOOLS).map'), 'target editor should build school rows off-DOM before writing to tbody');
assert.ok(appSource.includes("tbody.innerHTML = targetRowsHtml.join('');"), 'target editor should write school target rows to the DOM once');
assert.ok(appSource.includes('const spotlightRowsHtml = [];'), 'spotlight search should collect result rows before writing to the result container');
assert.ok(appSource.includes("resDiv.innerHTML = spotlightRowsHtml.join('');"), 'spotlight search should write results to the DOM once per query');
assert.ok(!appSource.includes('resDiv.innerHTML +='), 'spotlight search should avoid per-result DOM writes');
assert.ok(appSource.includes('const redTrafficRows = [];'), 'traffic light analysis should collect red rows off-DOM');
assert.ok(appSource.includes("listRed.innerHTML = cntRed === 0"), 'traffic light analysis should write red rows once after classification');
assert.ok(appSource.includes("redTrafficRows.join('')"), 'traffic light analysis should batch red rows into one DOM write');
assert.ok(appSource.includes("yellowTrafficRows.join('')"), 'traffic light analysis should batch yellow rows into one DOM write');
assert.ok(appSource.includes("greenTrafficRows.join('')"), 'traffic light analysis should batch green rows into one DOM write');
assert.ok(!appSource.includes('listRed.innerHTML +='), 'traffic light analysis should avoid per-row red DOM writes');
assert.ok(!appSource.includes('listYellow.innerHTML +='), 'traffic light analysis should avoid per-row yellow DOM writes');
assert.ok(!appSource.includes('listGreen.innerHTML +='), 'traffic light analysis should avoid per-row green DOM writes');
assert.ok(appSource.includes('const marginalTicketRows = [];'), 'marginal ticket generation should collect cards off-DOM');
assert.ok(appSource.includes("container.innerHTML = hasData\n        ? marginalTicketRows.join('')"), 'marginal ticket generation should write cards to the DOM once');
assert.ok(!appSource.includes('container.innerHTML +='), 'marginal ticket generation should avoid per-card DOM writes');
assert.ok(appSource.includes("schoolList.map(s => `<option value=\"${s}\">${s}</option>`).join('')"), 'marginal push school selector should batch option rendering');
assert.ok(appSource.includes("SUBJECTS.map(s => `<option value=\"${s}\">${s}</option>`).join('')"), 'marginal push subject selector should batch option rendering');
assert.ok(appSource.includes("classes.map(c => `<option value=\"${c}\">${c}</option>`).join('')"), 'marginal push class selector should batch option rendering');
assert.ok(appSource.includes('const schoolOptionsHtml = [...schools]'), 'teacher school selector should build option HTML once');
assert.ok(appSource.includes("const snapshotOptions = Object.keys(MP_SNAPSHOTS).map"), 'marginal snapshot selector should batch historical task options');
assert.ok(appSource.includes('const aidGroupFragment = document.createDocumentFragment();'), 'mutual aid group rendering should collect cards in a fragment');
assert.ok(appSource.includes('container.appendChild(aidGroupFragment);'), 'mutual aid group rendering should attach cards with one fragment append');
assert.ok(!appSource.includes('container.appendChild(card);'), 'mutual aid group rendering should avoid per-card container appends');
assert.ok(!appSource.includes('innerHTML +='), 'app.js should avoid repeated innerHTML appends');
assert.ok(teacherCompareResultRuntime.includes('function scheduleTeacherMultiPeriodAutoRender'), 'teacher multi-period compare should still respond to selector changes');
assert.ok(teacherCompareResultRuntime.includes('teacherCompareExamStatsCache'), 'teacher compare result runtime should cache per-exam teacher stats');
assert.ok(!teacherCompareResultRuntime.includes('if (!ready) return;\n        renderTeacherMultiPeriodComparison();'), 'teacher compare selectors should not auto-run heavy multi-period calculation');
assert.ok(teacherCompareResultRuntime.includes('bindTeacherCompareAutoControls();'), 'teacher compare runtime should bind selector auto-refresh controls');
assert.ok(moduleEntryRuntime.includes('teacherCompareManualReady'), 'teacher-analysis entry should prepare manual compare state instead of auto-rendering compare results');
assert.ok(teacherSyncRuntime.includes('rawPreferred'), 'teacher sync should honor preferred school candidates');
assert.ok(teacherSyncRuntime.includes('teacherClasses'), 'teacher sync should infer the active school from teacher assignment classes');
assert.ok(progressAnalysisRuntime.includes('function filterProgressCompareRowsToTownshipScope'), 'progress comparison should have a township-scope filter for town ranks');
assert.ok(progressAnalysisRuntime.includes('const townshipRows = filterProgressCompareRowsToTownshipScope(allRows);'), 'progress comparison should derive town ranks from township-scoped rows');
assert.ok(progressAnalysisRuntime.includes('const rankTownMap = buildCompetitionRankMap(townshipRows'), 'progress comparison town ranks should not be built from full county rows');
assert.ok(progressAnalysisRuntime.includes('function scheduleProgressVisualRender'), 'progress analysis should defer chart rendering off the filter call stack');
assert.ok(progressAnalysisRuntime.includes('function runProgressSankeyWhenIdle'), 'progress analysis should render the secondary chart during idle time');
assert.ok(progressAnalysisRuntime.includes('scheduleProgressVisualRender();'), 'progress filters should schedule visual refreshes instead of drawing both charts synchronously');
assert.ok(progressAnalysisRuntime.includes("typeof window.requestIdleCallback === 'function'"), 'progress secondary chart should use idle rendering when available');
assert.strictEqual(initSupabaseMatches.length, 1, 'boot-runtime.js should define initSupabase exactly once');
assert.strictEqual(supabaseUrlAssignments.length, 1, 'boot-runtime.js should resolve SUPABASE_URL exactly once');
assert.strictEqual(supabaseKeyAssignments.length, 1, 'boot-runtime.js should resolve SUPABASE_KEY exactly once');
assert.strictEqual(gatewayUrlAssignments.length, 1, 'boot-runtime.js should resolve EDGE_GATEWAY_URL exactly once');
assert.ok(bootRuntime.includes("return normalizeProxyOrigin(window.location.origin) + '/api/edu-gateway';"), 'HTTP runtimes should prefer the same-origin gateway proxy before direct Edge fallback');
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
    supportMetricsRef,
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
    assert.ok(bootRuntimeReferences(src), `boot-runtime.js should contain boot/core module entry for ${src}`);
});

assert.ok(!findScriptTag(indexHtml, supabaseVendorRef), 'index.html should not load the legacy supabase SDK script');

[
    xlsxVendorRef,
    alpineVendorRef,
    chartVendorRef,
    sweetalertVendorRef
].forEach((src) => {
    assert.ok(bootRuntimeReferences(src), `boot-runtime.js should contain deferred module entry for ${src}`);
});

const mobileManagerSkillSource = bootRuntime.slice(
    bootRuntime.indexOf("'mobile-manager':"),
    bootRuntime.indexOf("'account-admin':")
);
assert.ok(mobileManagerSkillSource.includes(mobileAppRef) || mobileManagerSkillSource.includes('mobile-app-runtime.js'), 'mobile manager skill should load mobile-app-runtime.js');
assert.ok(!mobileManagerSkillSource.includes(perfMobileRef), 'mobile manager skill should not auto-load perf-mobile-runtime.js');
assert.ok(!bootRuntime.includes('./assets/js/mobile-experience-runtime.js'), 'mobile experience helper should be merged into mobile-app-runtime.js');

[
    scrollTriggerVendorRef,
    popperVendorRef,
    tippyVendorRef,
    simplebarVendorRef
].forEach((src) => {
    assert.ok(bootRuntimeReferences(src), `boot-runtime.js should contain deferred module entry for ${src}`);
});

const bootScriptTag = findScriptTag(indexHtml, bootRuntimeRef);
assert.ok(bootScriptTag, 'index.html should contain a script tag for boot-runtime.js');
assert.ok(/\sdefer(\s|>|=)/i.test(bootScriptTag), 'boot-runtime.js should load with defer');
const lzScriptTag = findScriptTag(indexHtml, lzStringVendorRef);
assert.ok(lzScriptTag, 'index.html should contain a script tag for lz-string.min.js');
assert.ok(/\sdefer(\s|>|=)/i.test(lzScriptTag), 'lz-string.min.js should load with defer');
const gsapScriptTag = findScriptTag(indexHtml, gsapVendorRef);
assert.ok(!gsapScriptTag, 'index.html should not block first paint on gsap.min.js');

assert.ok(indexHtml.includes(tablerIconsRef), 'index.html should load local tabler icons CSS');

[
    alasqlVendorRef,
    jspdfVendorRef,
    html2canvasVendorRef,
    accountAdminRef,
    historyCompareRef,
    perfMobileRef,
    mobileAppRef,
    dataManagerSqlRef,
    reportChartRef,
    reportExportRef,
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
    townSubmoduleCompareRef,
    holographicRef,
    predictiveRef,
    metaverseRef,
    emotionalRef
].forEach((src) => {
    assert.strictEqual(indexHtml.includes(src), false, `${src} should not be eagerly loaded on boot`);
});
assert.strictEqual(
    indexHtml.includes(reportRenderRef),
    true,
    'report-render runtime should be preloaded on boot to avoid report query cold-load stalls'
);
assert.ok(
    bootDirectGatewayCandidateIndex >= 0 && bootSameOriginGatewayCandidateIndex >= 0 && bootDirectGatewayCandidateIndex < bootSameOriginGatewayCandidateIndex,
    'boot login should try the direct Cloudflare gateway before the same-origin proxy fallback'
);
assert.ok(grade9TotalSubjectContract.test(appSource), 'grade 9 total score must remain limited to Chinese, Math, English, Physics, Chemistry');
assert.ok(grade9PoliticsDisplayContract.test(appSource), 'grade 9 politics should be configured as display-only subject');
assert.ok(appSource.includes('function getConfiguredDisplaySubjects'), 'app.js should merge display-only subjects without changing total score subjects');
assert.ok(
    appSource.includes('getConfiguredDisplaySubjects(CONFIG, { includeExtra: false })'),
    'grade 9 display-only politics must not enter the heavy analysis subject list'
);
assert.ok(appSource.includes('function getConfiguredExtraDisplaySubjects'), 'app.js should expose display-only subjects for lightweight detail views');
assert.ok(
    appSource.includes('detectedSubjects.forEach(sub =>'),
    'parseRows should store display-only subject scores without adding them to global heavy subjects'
);
assert.ok(
    appSource.includes('CohortManager.addCohort({ year, startGrade }, { skipConfirm: true, fastEnter: false })'),
    'login cohort entry should wait for cloud data instead of opening an empty fast-enter workspace'
);
assert.ok(
    appSource.includes('latestOnly: true') && appSource.includes('后台历史考试补全失败'),
    'login cohort entry should restore the latest exam first and hydrate historical exams in the background'
);
assert.ok(
    cloudWorkspaceRuntime.includes('function getExamKeyRecencyScore') && cloudWorkspaceRuntime.includes('keysToFetch.length = 1'),
    'latest-only cohort hydration should pick one recency-ranked exam snapshot'
);
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
assert.ok(shellRuntimeIndex < moduleEntryRuntimeIndex, 'shell-runtime.js must load before module-entry-runtime.js');
assert.ok(moduleEntryRuntimeIndex < rankingDataServiceIndex, 'module-entry-runtime.js must load before ranking-data-service-runtime.js');
assert.ok(rankingDataServiceIndex < appIndex, 'ranking-data-service-runtime.js must load before app.js');
assert.ok(studentJumpIndex >= 0, 'index.html should load student-jump-runtime.js');
assert.ok(rankingDataServiceIndex < studentJumpIndex, 'ranking-data-service-runtime.js must load before student-jump-runtime.js');
assert.ok(studentJumpIndex < appIndex, 'student-jump-runtime.js must load before app.js');
assert.ok(appIndex < supportMetricsIndex, 'support-metrics-runtime.js must load after app.js');
assert.ok(popperVendorIndex < tippyVendorIndex, 'popper.min.js must load before tippy.umd.min.js');
assert.ok(indexHtml.includes('id="btn-summary-generate"'), 'summary should expose a stable generate button id for stale-data reminders');
assert.ok(indexHtml.includes('id="summary-refresh-notice"'), 'summary should include a stale-data reminder region');
assert.ok(appSource.includes('function markSummaryDataChanged'), 'summary stale-data state helper should exist');
assert.ok(appSource.includes('function markSummaryFresh'), 'summary fresh-state helper should exist');
assert.ok(appSource.includes('handleExcludedClick(${safeSchoolArg})'), 'summary bottom-third score should drill into excluded students');
assert.ok(appSource.includes('handleHighClick(${safeSchoolArg})'), 'summary high-score score should drill into high-score students');
assert.ok(layoutRefinementCss.includes('#summary #tb-summary thead th') && layoutRefinementCss.includes('position: sticky'), 'summary table header should remain sticky');
assert.ok(layoutRefinementCss.includes('.summary-generate-btn.is-stale'), 'summary stale generate button styling should exist');
assert.ok(teacherAnalysisCoreRuntime.includes('function buildTeacherRowsFingerprint'), 'teacher analysis cache signature should include a row fingerprint helper');
assert.ok(teacherAnalysisCoreRuntime.includes('computeExamDataFingerprint'), 'teacher analysis cache should reuse the shared exam data fingerprint when available');
assert.ok(layoutRefinementCss.includes('#teacher-township-ranking .analysis-table-shell') && layoutRefinementCss.includes('#teacherComparisonTable thead th'), 'teacher analysis tables should keep sticky grid affordances');
assert.ok(layoutRefinementCss.includes('#data-manager-modal #dm-teacher-table thead th'), 'teacher assignment management table should keep sticky headers');
assert.ok(appSource.includes('function renderBottom3TableOnly'), 'bottom3 should expose a lightweight table-only render path');
assert.ok(moduleEntryRuntime.includes("activeModuleId === 'bottom3'") && moduleEntryRuntime.includes('window.renderBottom3TableOnly()'), 'bottom3 module entry should avoid full macro table rerenders');
assert.ok(supportMetricsRuntime.includes('root.getSummaryTownshipSchools'), 'support metrics should reuse summary township school cache instead of rematching schools');
assert.ok(appSource.includes('const IndicatorCalcPerfCache'), 'indicator should cache repeated silent calculations');
assert.ok(appSource.includes('function buildIndicatorCalcSignature'), 'indicator cache should use an explicit dependency signature');
assert.ok(appSource.includes('isSilent') && appSource.includes('IndicatorCalcPerfCache.signature === calcSignature'), 'indicator cache should only short-circuit repeated silent calculations');
assert.ok(moduleEntryRuntime.includes("node.dataset.released === 'true'"), 'teacher heavy DOM release should not rewrite already released placeholders on later module switches');
assert.ok(appSource.includes('background: true') && appSource.includes('delay: 4800'), 'student report cloud-history hydration should stay delayed and low priority');
const countyRankFallbackStart = cloudRuntime.indexOf('const getCountyRankFallback = (payload, match, subject =');
const countyRankFallbackEnd = cloudRuntime.indexOf('const buildHistoryEntry =', countyRankFallbackStart);
const countyRankFallbackSource = countyRankFallbackStart >= 0 && countyRankFallbackEnd > countyRankFallbackStart
    ? cloudRuntime.slice(countyRankFallbackStart, countyRankFallbackEnd)
    : '';
assert.ok(countyRankFallbackSource.includes('rankByScore.set(value, seen + 1)'), 'student history county-rank fallback should use counting rank');
assert.ok(countyRankFallbackSource.includes('const scoreCounts = new Map();'), 'student history county-rank fallback should aggregate each score once');
assert.ok(countyRankFallbackSource.includes('Array.from(scoreCounts.keys()).sort((a, b) => b - a)'), 'student history county-rank fallback should build reusable descending ranks');
const bottom3SmokeStart = smokeAllModules.indexOf("if (id === 'bottom3')");
const bottom3SmokeEnd = smokeAllModules.indexOf("if (id === 'indicator')", bottom3SmokeStart);
const bottom3SmokeSource = bottom3SmokeStart >= 0 && bottom3SmokeEnd > bottom3SmokeStart
    ? smokeAllModules.slice(bottom3SmokeStart, bottom3SmokeEnd)
    : '';
assert.ok(bottom3SmokeSource.includes('snapshotBottom3State'), 'bottom3 smoke should keep mutation guard');
assert.ok(!bottom3SmokeSource.includes('JSON.stringify'), 'bottom3 smoke mutation guard should use compact signatures instead of serializing full objects');
const indicatorSmokeStart = smokeAllModules.indexOf("if (id === 'indicator')");
const indicatorSmokeEnd = smokeAllModules.indexOf("if (id === 'marginal-push')", indicatorSmokeStart);
const indicatorSmokeSource = indicatorSmokeStart >= 0 && indicatorSmokeEnd > indicatorSmokeStart
    ? smokeAllModules.slice(indicatorSmokeStart, indicatorSmokeEnd)
    : '';
assert.ok(indicatorSmokeSource.includes('snapshotIndicatorState'), 'indicator smoke should keep a compact mutation guard');
assert.ok(!indicatorSmokeSource.includes('JSON.stringify'), 'indicator smoke mutation guard should avoid serializing full school objects');

console.log('runtime order tests passed');
