const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../src/index.html');
const runtimePath = path.resolve(__dirname, '../public/assets/js/auth-state-runtime.js');
const workspaceRuntimePath = path.resolve(__dirname, '../public/assets/js/workspace-state-runtime.js');
const examRuntimePath = path.resolve(__dirname, '../public/assets/js/exam-state-runtime.js');
const schoolRuntimePath = path.resolve(__dirname, '../public/assets/js/school-state-runtime.js');
const schoolNormalizationRuntimePath = path.resolve(__dirname, '../public/assets/js/school-normalization-runtime.js');
const indicatorCalcRuntimePath = path.resolve(__dirname, '../public/assets/js/indicator-calc-runtime.js');
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
const snapshotSystemRuntimePath = path.resolve(__dirname, '../public/assets/js/snapshot-system-runtime.js');
const systemPerformanceRuntimePath = path.resolve(__dirname, '../public/assets/js/system-performance-runtime.js');
const dataCloudRuntimePath = path.resolve(__dirname, '../public/assets/js/data-cloud-runtime.js');
const issueManagerRuntimePath = path.resolve(__dirname, '../public/assets/js/issue-manager-runtime.js');
const packagerRuntimePath = path.resolve(__dirname, '../public/assets/js/packager-runtime.js');
const helpSystemRuntimePath = path.resolve(__dirname, '../public/assets/js/help-system-runtime.js');
const loggerRuntimePath = path.resolve(__dirname, '../public/assets/js/logger-runtime.js');
const workerApiRuntimePath = path.resolve(__dirname, '../public/assets/js/worker-api-runtime.js');
const accountManagerRuntimePath = path.resolve(__dirname, '../public/assets/js/account-manager-runtime.js');
const managementFacadesRuntimePath = path.resolve(__dirname, '../public/assets/js/management-facades-runtime.js');
const cohortExamHydrationRuntimePath = path.resolve(__dirname, '../public/assets/js/cohort-exam-hydration-runtime.js');
const cohortExamMetaRuntimePath = path.resolve(__dirname, '../public/assets/js/cohort-exam-meta-runtime.js');
const cohortDbCoreRuntimePath = path.resolve(__dirname, '../public/assets/js/cohort-db-core-runtime.js');
const dataManagerCoreRuntimePath = path.resolve(__dirname, '../public/assets/js/data-manager-core-runtime.js');
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
const loginEntryRuntimePath = path.resolve(__dirname, '../public/assets/js/login-entry-runtime.js');
const authLoginRuntimePath = path.resolve(__dirname, '../public/assets/js/auth-login-runtime.js');
const loginShellStateRuntimePath = path.resolve(__dirname, '../public/assets/js/login-shell-state-runtime.js');
const appFoundationRuntimePath = path.resolve(__dirname, '../public/assets/js/app-foundation-runtime.js');
const studentDetailsRenderRuntimePath = path.resolve(__dirname, '../public/assets/js/student-details-render-runtime.js');
const comparisonRenderRuntimePath = path.resolve(__dirname, '../public/assets/js/comparison-render-runtime.js');
const reportHistoryRuntimePath = path.resolve(__dirname, '../public/assets/js/report-history-runtime.js');
const runtimeLoaderRuntimePath = path.resolve(__dirname, '../public/assets/js/runtime-loader-runtime.js');
const accountAdminRuntimePath = path.resolve(__dirname, '../public/assets/js/account-admin-runtime.js');
const historyCompareRuntimePath = path.resolve(__dirname, '../public/assets/js/history-compare-runtime.js');
const perfMobileRuntimePath = path.resolve(__dirname, '../public/assets/js/perf-mobile-runtime.js');
const shellRuntimePath = path.resolve(__dirname, '../public/assets/js/shell-runtime.js');
const shellPolishRuntimePath = path.resolve(__dirname, '../public/assets/js/shell-polish-runtime.js');
const moduleEntryRuntimePath = path.resolve(__dirname, '../public/assets/js/module-entry-runtime.js');
const marginalPushRuntimePath = path.resolve(__dirname, '../public/assets/js/marginal-push-runtime.js');
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
assert.ok(fs.existsSync(snapshotSystemRuntimePath), 'snapshot-system-runtime.js should exist');
assert.ok(fs.existsSync(systemPerformanceRuntimePath), 'system-performance-runtime.js should exist');
assert.ok(fs.existsSync(dataCloudRuntimePath), 'data-cloud-runtime.js should exist');
assert.ok(fs.existsSync(issueManagerRuntimePath), 'issue-manager-runtime.js should exist');
assert.ok(fs.existsSync(packagerRuntimePath), 'packager-runtime.js should exist');
assert.ok(fs.existsSync(helpSystemRuntimePath), 'help-system-runtime.js should exist');
assert.ok(fs.existsSync(loggerRuntimePath), 'logger-runtime.js should exist');
assert.ok(fs.existsSync(workerApiRuntimePath), 'worker-api-runtime.js should exist');
assert.ok(fs.existsSync(accountManagerRuntimePath), 'account-manager-runtime.js should exist');
assert.ok(fs.existsSync(managementFacadesRuntimePath), 'management-facades-runtime.js should exist');
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
assert.ok(fs.existsSync(loginEntryRuntimePath), 'login-entry-runtime.js should exist');
assert.ok(fs.existsSync(runtimeLoaderRuntimePath), 'runtime-loader-runtime.js should exist');
assert.ok(fs.existsSync(accountAdminRuntimePath), 'account-admin-runtime.js should exist');
assert.ok(fs.existsSync(historyCompareRuntimePath), 'history-compare-runtime.js should exist');
assert.ok(fs.existsSync(perfMobileRuntimePath), 'perf-mobile-runtime.js should exist');
assert.ok(fs.existsSync(shellRuntimePath), 'shell-runtime.js should exist');
assert.ok(fs.existsSync(shellPolishRuntimePath), 'shell-polish-runtime.js should exist');
assert.ok(fs.existsSync(moduleEntryRuntimePath), 'module-entry-runtime.js should exist');
assert.ok(fs.existsSync(marginalPushRuntimePath), 'marginal-push-runtime.js should exist');
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
const bootRuntimeSource = fs.readFileSync(bootRuntimePath, 'utf8');
const loginEntryRuntime = fs.readFileSync(loginEntryRuntimePath, 'utf8');
const authLoginRuntime = fs.readFileSync(authLoginRuntimePath, 'utf8');
const loginShellStateRuntime = fs.readFileSync(loginShellStateRuntimePath, 'utf8');
const studentDetailsRenderRuntime = fs.readFileSync(studentDetailsRenderRuntimePath, 'utf8');
const comparisonRenderRuntime = fs.readFileSync(comparisonRenderRuntimePath, 'utf8');
const cohortExamMetaRuntime = fs.readFileSync(cohortExamMetaRuntimePath, 'utf8');
const cohortDbCoreRuntime = fs.readFileSync(cohortDbCoreRuntimePath, 'utf8');
const dataManagerCoreRuntime = fs.readFileSync(dataManagerCoreRuntimePath, 'utf8');
const dataCloudRuntime = fs.readFileSync(dataCloudRuntimePath, 'utf8');
const runtimeLoaderRuntime = fs.readFileSync(runtimeLoaderRuntimePath, 'utf8');
const bootRuntime = `${bootRuntimeSource}\n${runtimeLoaderRuntime}`;
const shellRuntime = fs.readFileSync(shellRuntimePath, 'utf8');
const shellPolishRuntime = fs.readFileSync(shellPolishRuntimePath, 'utf8');
const schoolNormalizationRuntime = fs.readFileSync(schoolNormalizationRuntimePath, 'utf8');
const indicatorCalcRuntime = fs.readFileSync(indicatorCalcRuntimePath, 'utf8');
const moduleEntryRuntime = fs.readFileSync(moduleEntryRuntimePath, 'utf8');
const marginalPushRuntime = fs.readFileSync(marginalPushRuntimePath, 'utf8');
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
const teacherAnalysisBridgeRuntime = fs.readFileSync(teacherAnalysisBridgeRuntimePath, 'utf8');
const countyAnalysisRuntime = fs.readFileSync(countyAnalysisRuntimePath, 'utf8');
const mobileAppRuntime = fs.readFileSync(mobileAppRuntimePath, 'utf8');
const supportMetricsRuntime = fs.readFileSync(supportMetricsRuntimePath, 'utf8');
const mainCss = fs.readFileSync(path.resolve(__dirname, '../src/assets/css/main.css'), 'utf8');
const layoutRefinementCss = fs.readFileSync(path.resolve(__dirname, '../src/assets/css/layout-refinement.css'), 'utf8');
const cloudWorkspaceRuntime = fs.readFileSync(cloudWorkspaceRuntimePath, 'utf8');
const snapshotSystemRuntime = fs.readFileSync(snapshotSystemRuntimePath, 'utf8');
const popperVendorSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/vendor/popperjs/popper.min.js'), 'utf8');
const tippyVendorSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/vendor/tippyjs/tippy.umd.min.js'), 'utf8');
const appSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app.js'), 'utf8');
const edgeGatewaySource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/edge-gateway-runtime.js'), 'utf8');
const appFoundationRuntime = fs.readFileSync(appFoundationRuntimePath, 'utf8');
const reportHistoryRuntime = fs.readFileSync(reportHistoryRuntimePath, 'utf8');
const townSubmoduleCompareRuntime = fs.readFileSync(townSubmoduleCompareRuntimePath, 'utf8');
const cloudRuntime = fs.readFileSync(cloudRuntimePath, 'utf8');
const smokeAllModules = fs.readFileSync(smokeAllModulesPath, 'utf8');
const initSupabaseMatches = bootRuntime.match(/window\.initSupabase\s*=\s*function/g) || [];
const supabaseUrlAssignments = bootRuntime.match(/window\.SUPABASE_URL\s*=/g) || [];
const supabaseKeyAssignments = bootRuntime.match(/window\.SUPABASE_KEY\s*=/g) || [];
const gatewayUrlAssignments = bootRuntime.match(/window\.EDGE_GATEWAY_URL\s*=/g) || [];
const switchTabDefinitions = appSource.match(/function\s+switchTab\s*\(/g) || [];
const switchTabOverrides = appSource.match(/switchTab\s*=\s*function\s*\(/g) || [];
const gatewaySessionSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/gateway-session-runtime.js'), 'utf8');
const hostedGatewayCandidatesIndex = edgeGatewaySource.indexOf('pushCandidate(this.resolvedGatewayUrl);');
const edgeSameOriginGatewayCandidateIndex = edgeGatewaySource.indexOf('pushCandidate(window.EDGE_GATEWAY_URL);', hostedGatewayCandidatesIndex);
const edgeDirectGatewayCandidateIndex = edgeGatewaySource.indexOf('pushCandidate(DIRECT_EDGE_GATEWAY_URL);', hostedGatewayCandidatesIndex);
const gatewaySessionRef = './assets/js/gateway-session-runtime.js';
const grade9TotalSubjectContract = /totalSubs:\s*\['语文',\s*'数学',\s*'英语',\s*'物理',\s*'化学'\]/;
const grade9PoliticsDisplayContract = /extraDisplaySubs:\s*\['政治'\]/;
const authStateRef = './assets/js/auth-state-runtime.js';
const edgeGatewayRef = './assets/js/edge-gateway-runtime.js';
const workspaceStateRef = './assets/js/workspace-state-runtime.js';
const examStateRef = './assets/js/exam-state-runtime.js';
const schoolStateRef = './assets/js/school-state-runtime.js';
const teacherStateRef = './assets/js/teacher-state-runtime.js';
const dataStateRef = './assets/js/data-state-runtime.js';
const supportStateRef = './assets/js/support-state-runtime.js';
const supportMetricsRef = './assets/js/support-metrics-runtime.js';
const marginalPushRef = './assets/js/marginal-push-runtime.js';
const seatAdjustmentRef = './assets/js/seat-adjustment-runtime.js';
const subjectBalanceRef = './assets/js/subject-balance-runtime.js';
const segmentAnalysisRef = './assets/js/segment-analysis-runtime.js';
const starterGuideRef = './assets/js/starter-guide-runtime.js';
const potentialAnalysisRef = './assets/js/potential-analysis-runtime.js';
const tableHeatmapRef = './assets/js/table-heatmap-runtime.js';
const dataDoctorRef = './assets/js/data-doctor-runtime.js';
const blankScoreAuditRef = './assets/js/blank-score-audit-runtime.js';
const targetGapAnalysisRef = './assets/js/target-gap-analysis-runtime.js';
const autoDiagnosisRef = './assets/js/auto-diagnosis-runtime.js';
const indicatorBottom3ExportRef = './assets/js/indicator-bottom3-export-runtime.js';
const summaryTableExportRef = './assets/js/summary-table-export-runtime.js';
const templateDownloadRef = './assets/js/template-download-runtime.js';
const highScoreExportRef = './assets/js/high-score-export-runtime.js';
const cohortGrowthRef = './assets/js/cohort-growth-runtime.js';
const macroAnalysisCompatRef = './assets/js/macro-analysis-compat-runtime.js';
const schoolNormalizationRef = './assets/js/school-normalization-runtime.js';
const indicatorCalcRef = './assets/js/indicator-calc-runtime.js';
const compareSharedRef = './assets/js/compare-shared-runtime.js';
const progressStateRef = './assets/js/progress-state-runtime.js';
const reportSessionStateRef = './assets/js/report-session-state-runtime.js';
const reportCompareRef = './assets/js/report-compare-runtime.js';
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
const loginSessionRef = './assets/js/login-session-runtime.js';
const managementFacadesRef = './assets/js/management-facades-runtime.js';
const cohortExamHydrationRef = './assets/js/cohort-exam-hydration-runtime.js';
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
const runtimeAccessorsRef = './assets/js/runtime-accessors-runtime.js';
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
const reportInsightRef = './assets/js/report-insight-runtime.js';
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
const bootRuntimeMatch = indexHtml.match(/\.\/assets\/js\/boot-runtime-runtime-[0-9a-f]{12}\.js/);
const bootRuntimeRef = bootRuntimeMatch ? bootRuntimeMatch[0] : '';
const runtimeLoaderRuntimeRef = './assets/js/runtime-loader-runtime.js';
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
const earlyBootRuntimeModulesMatch = bootRuntime.match(/var EARLY_BOOT_RUNTIME_MODULES = \[[\s\S]*?\]\.map\(bootJs\);/)
    || bootRuntime.match(/var EARLY_BOOT_RUNTIME_MODULES = \[[\s\S]*?\];/);
assert.ok(earlyBootRuntimeModulesMatch, 'boot-runtime.js should declare early boot runtime modules');
const earlyBootRuntimeManifest = earlyBootRuntimeModulesMatch[0];
const normalizedEarlyBootRuntimeManifest = earlyBootRuntimeManifest.includes('.map(bootJs)')
    ? earlyBootRuntimeManifest.replace(/'([^']+\.js)'/g, "'./assets/js/$1'")
    : earlyBootRuntimeManifest;
assert.ok(normalizedModuleManifest.includes(schoolNormalizationRef), 'school-normalization-runtime.js should load with core app modules');
assert.ok(
    normalizedModuleManifest.indexOf(schoolNormalizationRef) < normalizedModuleManifest.indexOf('./assets/js/app.js'),
    'school-normalization-runtime.js should load before app.js so township-scoped analysis cannot fall back to all schools'
);
assert.ok(normalizedModuleManifest.includes(indicatorCalcRef), 'indicator-calc-runtime.js should load with core app modules');
assert.ok(
    normalizedModuleManifest.indexOf(schoolNormalizationRef) < normalizedModuleManifest.indexOf(indicatorCalcRef)
        && normalizedModuleManifest.indexOf(indicatorCalcRef) < normalizedModuleManifest.indexOf('./assets/js/app.js'),
    'indicator-calc-runtime.js should load after school-normalization (its bucket/target/scoreInd deps) and before app.js so window.calcIndicators is defined before app.js bare callers run'
);
const bootVendorMatch = bootRuntime.match(/var BOOT_VENDOR_MODULES = \[[\s\S]*?\];/);
assert.ok(bootVendorMatch, 'boot-runtime.js should declare BOOT_VENDOR_MODULES');
const bootVendorManifest = bootVendorMatch[0];
const deferredVendorMatch = bootRuntime.match(/var DEFERRED_APP_MODULES = \[[\s\S]*?\]\.map\(bootJs\);/)
    || bootRuntime.match(/var DEFERRED_APP_MODULES = \[[\s\S]*?\];/);
assert.ok(deferredVendorMatch, 'boot-runtime.js should declare DEFERRED_APP_MODULES');
const deferredVendorManifest = deferredVendorMatch[0];
const normalizedDeferredManifest = deferredVendorManifest.includes('.map(bootJs)')
    ? deferredVendorManifest.replace(/'([^']+\.js)'/g, "'./assets/js/$1'")
    : deferredVendorManifest;
assert.ok(!normalizedDeferredManifest.includes(schoolNormalizationRef), 'school-normalization-runtime.js must not be deferred past first analysis render');
assert.ok(normalizedEarlyBootRuntimeManifest.includes(gatewaySessionRef), 'gateway session runtime should be registered as an early boot dependency');
assert.ok(normalizedEarlyBootRuntimeManifest.includes(edgeGatewayRef), 'edge gateway runtime should be registered as an early boot dependency');
assert.ok(!normalizedModuleManifest.includes(gatewaySessionRef), 'stateful gateway session runtime must not be loaded again with core app modules');
assert.ok(!normalizedModuleManifest.includes(edgeGatewayRef), 'edge gateway runtime must not be loaded again with core app modules');
const moduleOrderManifest = `${normalizedEarlyBootRuntimeManifest}\n${normalizedModuleManifest}\n${normalizedDeferredManifest}`;
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
assert.ok(!bootRuntimeSource.includes('var SYSTEM_RUNTIME_SKILLS = {'), 'boot-runtime.js should not carry the optional runtime skill manifest');
assert.ok(runtimeLoaderRuntime.includes('var SYSTEM_RUNTIME_SKILLS = {'), 'runtime-loader-runtime.js should declare the optional runtime skill manifest');
assert.ok(bootRuntime.includes("'shell-polish': bootSkill('idle', 'demand'"), 'shell polish should stay behind the on-demand runtime loader');
assert.ok(bootRuntime.includes('window.ensureShellPolishRuntimeLoaded'), 'shell polish should still expose an explicit loader');
const postAppDeferredRefs = [
    supportMetricsRef,
    marginalPushRef,
    seatAdjustmentRef,
    subjectBalanceRef,
    segmentAnalysisRef,
    starterGuideRef,
    potentialAnalysisRef,
    tableHeatmapRef,
    dataDoctorRef,
    blankScoreAuditRef,
    targetGapAnalysisRef,
    autoDiagnosisRef,
    indicatorBottom3ExportRef,
    summaryTableExportRef,
    templateDownloadRef,
    highScoreExportRef,
    cohortGrowthRef,
    macroAnalysisCompatRef,
    compareCloudContextRef,
    compareExamSyncRef,
    reportCompareRef,
    compareSelectorsRef,
    townSubmoduleCompareStateRef
];
postAppDeferredRefs.forEach((ref) => {
    assert.ok(!normalizedModuleManifest.includes(ref), `${ref} should not block core app module hydration`);
    assert.ok(normalizedDeferredManifest.includes(ref), `${ref} should hydrate through DEFERRED_APP_MODULES`);
});
assert.ok(
    /function loadDeferredAppModules\(\)[\s\S]*runtimeWarmupPromise[\s\S]*loadOptionalRuntimeBundle\('deferred-app-modules'[\s\S]*Promise\.all\(\[runtimeWarmupPromise, deferredModulesPromise\]\)/.test(bootRuntime),
    'deferred app module hydration should run explicit deferred modules even when SystemRuntimeLoader warmup is available'
);
const authStateIndex = moduleOrderManifest.indexOf(authStateRef);
const edgeGatewayIndex = moduleOrderManifest.indexOf(edgeGatewayRef);
const workspaceStateIndex = moduleOrderManifest.indexOf(workspaceStateRef);
const examStateIndex = moduleOrderManifest.indexOf(examStateRef);
const schoolStateIndex = moduleOrderManifest.indexOf(schoolStateRef);
const teacherStateIndex = moduleOrderManifest.indexOf(teacherStateRef);
const dataStateIndex = moduleOrderManifest.indexOf(dataStateRef);
const supportStateIndex = moduleOrderManifest.indexOf(supportStateRef);
const supportMetricsIndex = moduleOrderManifest.indexOf(supportMetricsRef);
const progressStateIndex = moduleOrderManifest.indexOf(progressStateRef);
const reportSessionStateIndex = moduleOrderManifest.indexOf(reportSessionStateRef);
const compareSessionStateIndex = moduleOrderManifest.indexOf(compareSessionStateRef);
const compareResultStateIndex = moduleOrderManifest.indexOf(compareResultStateRef);
const compareSummaryStateIndex = moduleOrderManifest.indexOf(compareSummaryStateRef);
const cloudApiIndex = moduleOrderManifest.indexOf(cloudApiRef);
const cloudConnectionIndex = moduleOrderManifest.indexOf(cloudConnectionRef);
const systemPerformanceIndex = moduleOrderManifest.indexOf(systemPerformanceRef);
const dataCloudIndex = moduleOrderManifest.indexOf(dataCloudRef);
const issueManagerIndex = moduleOrderManifest.indexOf(issueManagerRef);
const packagerIndex = moduleOrderManifest.indexOf(packagerRef);
const helpSystemIndex = moduleOrderManifest.indexOf(helpSystemRef);
const loggerIndex = moduleOrderManifest.indexOf(loggerRef);
const workerApiIndex = moduleOrderManifest.indexOf(workerApiRef);
const accountManagerIndex = moduleOrderManifest.indexOf(accountManagerRef);
const loginSessionIndex = moduleOrderManifest.indexOf(loginSessionRef);
const managementFacadesIndex = moduleOrderManifest.indexOf(managementFacadesRef);
const cohortExamHydrationIndex = moduleOrderManifest.indexOf(cohortExamHydrationRef);
const dataManagerTeacherIndex = moduleOrderManifest.indexOf(dataManagerTeacherRef);
const dataManagerStudentIndex = moduleOrderManifest.indexOf(dataManagerStudentRef);
const dataManagerArchiveIndex = moduleOrderManifest.indexOf(dataManagerArchiveRef);
const dataManagerGrade9TemplateIndex = moduleOrderManifest.indexOf(dataManagerGrade9TemplateRef);
const dataManagerParamsIndex = moduleOrderManifest.indexOf(dataManagerParamsRef);
const dataManagerTargetsIndex = moduleOrderManifest.indexOf(dataManagerTargetsRef);
const dataManagerSchoolAliasIndex = moduleOrderManifest.indexOf(dataManagerSchoolAliasRef);
const dataManagerSaveSyncIndex = moduleOrderManifest.indexOf(dataManagerSaveSyncRef);
const dataManagerHistoryIndex = moduleOrderManifest.indexOf(dataManagerHistoryRef);
const dataManagerTabIndex = moduleOrderManifest.indexOf(dataManagerTabRef);
const compareCloudContextIndex = moduleOrderManifest.indexOf(compareCloudContextRef);
const compareExamSyncIndex = moduleOrderManifest.indexOf(compareExamSyncRef);
const townSubmoduleCompareStateIndex = moduleOrderManifest.indexOf(townSubmoduleCompareStateRef);
const compareSelectorsIndex = moduleOrderManifest.indexOf(compareSelectorsRef);
const progressAnalysisIndex = moduleOrderManifest.indexOf(progressAnalysisRef);
const cloudIndex = moduleOrderManifest.indexOf(cloudRef);
const cloudWorkspaceIndex = moduleOrderManifest.indexOf(cloudWorkspaceRef);
const shellRuntimeIndex = moduleOrderManifest.indexOf(shellRuntimeRef);
const shellPolishRuntimeIndex = moduleOrderManifest.indexOf(shellPolishRuntimeRef);
const moduleEntryRuntimeIndex = moduleOrderManifest.indexOf(moduleEntryRuntimeRef);
const runtimeAccessorsIndex = moduleOrderManifest.indexOf(runtimeAccessorsRef);
const rankingDataServiceIndex = moduleOrderManifest.indexOf(rankingDataServiceRef);
const compareSharedIndex = moduleOrderManifest.indexOf(compareSharedRef);
const studentJumpIndex = moduleOrderManifest.indexOf(studentJumpRef);
const appIndex = moduleOrderManifest.indexOf(appRef);
const bootRuntimeIndex = indexHtml.indexOf(bootRuntimeRef);
const runtimeLoaderRuntimeIndex = indexHtml.indexOf(runtimeLoaderRuntimeRef);
const edgeGatewayHtmlIndex = indexHtml.indexOf(edgeGatewayRef);
const popperVendorIndex = bootRuntimeReferenceIndex(popperVendorRef);
const tippyVendorIndex = bootRuntimeReferenceIndex(tippyVendorRef);
const accountAdminIndex = indexHtml.indexOf(accountAdminRef);
const historyCompareIndex = indexHtml.indexOf(historyCompareRef);
const perfMobileIndex = indexHtml.indexOf(perfMobileRef);

assert.ok(authStateIndex >= 0, 'index.html should load auth-state-runtime.js');
assert.ok(edgeGatewayIndex >= 0, 'boot manifest should register edge-gateway-runtime.js before app modules');
const gatewaySessionIndex = indexHtml.indexOf(gatewaySessionRef);
assert.ok(gatewaySessionIndex >= 0, 'index.html should load gateway-session-runtime.js');
assert.ok(bootRuntimeIndex >= 0, 'index.html should load boot-runtime.js');
assert.ok(runtimeLoaderRuntimeIndex >= 0, 'index.html should load runtime-loader-runtime.js');
assert.ok(runtimeLoaderRuntimeIndex < bootRuntimeIndex, 'runtime-loader-runtime.js should load before boot-runtime.js');
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
assert.ok(managementFacadesIndex >= 0, 'index.html should load management-facades-runtime.js');
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
assert.strictEqual(indexHtml.includes(townSubmoduleCompareRef), false, 'town-submodule compare runtime should lazy-load after login instead of blocking the login page');
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
assert.ok(loginSessionIndex >= 0, 'index.html should load login-session-runtime.js');
assert.ok(loginSessionIndex < appIndex, 'login-session-runtime.js should load before app.js');
assert.ok(indexHtml.includes('id="login-session-btn"'), 'login status button should be present in the toolbar');
assert.ok(indexHtml.includes('id="login-session-modal"'), 'login status modal should be present');
assert.ok(
    edgeGatewaySource.includes('const edgeGateway = Object.assign(root.EdgeGateway || {}, {')
        && edgeGatewaySource.includes('root.EdgeGateway = edgeGateway;')
        && !edgeGatewaySource.includes('var EdgeGateway'),
    'edge gateway runtime should install its API through window without creating a conflicting global declaration'
);
assert.ok(
    fs.readFileSync(path.resolve(__dirname, '../public/assets/js/edge-gateway-runtime.js'), 'utf8').includes('device: this.getClientDeviceInfo()'),
    'gateway login should persist device metadata for session audit records'
);
assert.ok(gatewaySessionIndex < edgeGatewayHtmlIndex, 'gateway-session-runtime.js should load before edge-gateway-runtime.js');
assert.ok(edgeGatewayIndex < accountManagerIndex, 'edge-gateway-runtime.js should load before account-manager-runtime.js');
assert.ok(edgeGatewayIndex < appIndex, 'edge-gateway-runtime.js should load before app.js');
assert.ok(managementFacadesIndex < appIndex, 'management-facades-runtime.js should load before app.js');
assert.ok(cohortExamHydrationIndex >= 0, 'index.html should load cohort-exam-hydration-runtime.js');
assert.ok(cohortExamHydrationIndex < appIndex, 'cohort-exam-hydration-runtime.js should load before app.js');
assert.ok(runtimeAccessorsIndex < managementFacadesIndex, 'runtime-accessors-runtime.js should load before management-facades-runtime.js');
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
assert.ok(runtimeAccessorsIndex >= 0, 'index.html should load runtime-accessors-runtime.js');
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
assert.ok(bootRuntime.includes('var APP_MODULE_DESKTOP_BATCH_SIZE = 6;'), 'desktop boot scripts should use responsive bounded batches during login recovery');
assert.ok(bootRuntime.includes('var APP_MODULE_MOBILE_BATCH_SIZE = 4;'), 'mobile boot scripts should use smaller batches during login recovery');
assert.ok(bootRuntime.includes('var APP_MODULE_MAX_BATCH_SIZE = 6;'), 'stored boot batch overrides must have a responsiveness cap');
assert.ok(bootRuntime.includes('Math.min(APP_MODULE_MAX_BATCH_SIZE, Math.max(1, Math.floor(stored)))'), 'legacy boot batch overrides must not restore page-freezing batches');
assert.ok(bootRuntime.includes('if (isRuntimeMobileViewport()) return APP_MODULE_MOBILE_BATCH_SIZE;'), 'mobile boot script loading should use the dedicated mobile batch size');
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
[
    'cohort-exam-meta-runtime.js',
    'auth-login-runtime.js',
    'data-manager-core-runtime.js',
    'student-details-render-runtime.js',
    'comparison-render-runtime.js',
    'snapshot-system-runtime.js',
    'report-history-runtime.js'
].forEach((runtimeName) => {
    assert.ok(
        bootRuntime.indexOf(`'${runtimeName}'`) >= 0 && bootRuntime.indexOf(`'${runtimeName}'`) < bootRuntime.indexOf("'app.js'"),
        `${runtimeName} should load before app.js`
    );
});
assert.ok(
    bootRuntime.indexOf("'cohort-exam-meta-runtime.js'") < bootRuntime.indexOf("'auth-login-runtime.js'")
        && bootRuntime.indexOf("'cohort-exam-meta-runtime.js'") < bootRuntime.indexOf("'snapshot-system-runtime.js'"),
    'cohort exam metadata runtime should load before login/snapshot runtimes that call cohort helpers'
);
assert.ok(
    bootRuntime.indexOf("'cohort-db-core-runtime.js'") > bootRuntime.indexOf("'app.js'"),
    'cohort-db-core-runtime.js should load after app.js state accessors'
);
[
    'window.getCohortKey = window.getCohortKey || getCohortKey;',
    'window.showCohortPicker = window.showCohortPicker || showCohortPicker;',
    'window.refreshExamGradePreview = window.refreshExamGradePreview || refreshExamGradePreview;',
    'window.onExamTermChange = window.onExamTermChange || onExamTermChange;'
].forEach((needle) => {
    assert.ok(cohortExamMetaRuntime.includes(needle), `cohort-exam-meta-runtime.js should expose ${needle}`);
});
[
    'function readWorkspaceProjectKey()',
    'function readWorkspaceCohortId()',
    'function readWorkspaceCohortMeta()',
    'function readWorkspaceExamId()',
    'function lockRuntimeCohortId(cohortId)',
    'function writeWorkspaceCohortMeta(meta, options = {})',
    'function writeWorkspaceExamId(examId)',
    'function clearWorkspaceRuntimeIdentity(options = {})',
    'function syncWorkspaceRuntimeState(patch = {})'
].forEach((needle) => {
    assert.ok(cohortExamMetaRuntime.includes(needle), `cohort-exam-meta-runtime.js should own early workspace helper ${needle}`);
});
assert.ok(
    cohortExamMetaRuntime.includes("typeof window.syncShellChromeBridge === 'function'"),
    'cohort-exam-meta-runtime.js should guard shell chrome bridge because it runs before app.js'
);
assert.strictEqual(
    cohortExamMetaRuntime.includes('\n        syncShellChromeBridge();'),
    false,
    'cohort-exam-meta-runtime.js should not call syncShellChromeBridge before app.js without a guard'
);
assert.ok(bootRuntime.includes('function scheduleMobileRuntimeBootstrap'), 'boot-runtime.js should defer mobile runtime bootstrapping');
assert.ok(bootRuntime.includes('runAfterAppModulesReady'), 'boot-runtime.js should wait for core modules before mobile runtime bootstrap');
assert.ok(bootRuntime.includes('function repairAuthenticatedShellVisibility()'), 'boot-runtime.js should repair authenticated mobile shell visibility after login');
assert.ok(bootRuntime.includes('syncBootLoginOverlayState(false);'), 'boot login repair should restore the authenticated shell through one state transition');
assert.ok(bootRuntime.includes('function setBootLoginOverlayVisibility'), 'boot login shell should have a backward-compatible shared-state fallback');
assert.ok(loginShellStateRuntime.includes('function setOverlayVisibility'), 'login shell state should live in one early runtime');
assert.ok(loginShellStateRuntime.includes("overlay.style.setProperty('display', shouldShow ? 'flex' : 'none', 'important');"), 'shared login shell state should enforce the skin-safe display priority');
assert.ok(!bootRuntime.includes('startAuthenticatedShellRepairWindow()'), 'shared login shell state should remove repeated repair timers');
assert.ok(bootRuntime.includes("window.__BOOT_LOGIN_CLICKED__"), 'boot-runtime.js should replay login clicks made before boot handlers bind');
assert.ok(bootRuntime.includes('window.__BOOT_LOGIN_CLICKED__ = false;'), 'boot login replay should consume the queued early click flag');
assert.ok(loginEntryRuntime.includes('window.__BOOT_LOGIN_CLICKED__ = false;'), 'login entry submit should clear stale queued early click state');
assert.ok(authLoginRuntime.includes('window.__BOOT_LOGIN_CLICKED__ = false;'), 'full Auth.login should clear stale queued early click state');
const bootLoginSuccessIndex = bootRuntime.indexOf('if (result && result.user) {');
const bootLoginSuccessEndIndex = bootRuntime.indexOf("} else {\n                setBootHelperMessage", bootLoginSuccessIndex);
const bootLoginFinalizeIndex = bootRuntime.indexOf('finalizeBootLoginUi(portal);', bootLoginSuccessIndex);
const bootLoginLoadIndex = bootRuntime.indexOf('loadAppModules()', bootLoginFinalizeIndex);
const bootLoginBackgroundAuthIndex = bootRuntime.indexOf('window.waitForAuthReady(3500)', bootLoginFinalizeIndex);
const bootLoginBackgroundCohortIndex = bootRuntime.indexOf('enterSelectedBootCohort(cohortYear)', bootLoginBackgroundAuthIndex);
assert.ok(
    bootLoginSuccessIndex >= 0 && bootLoginSuccessEndIndex > bootLoginSuccessIndex && bootLoginFinalizeIndex > bootLoginSuccessIndex && bootLoginLoadIndex > bootLoginFinalizeIndex && bootLoginBackgroundAuthIndex > bootLoginLoadIndex && bootLoginBackgroundCohortIndex > bootLoginBackgroundAuthIndex,
    'boot login should reveal the workbench before loading full app modules and restore the selected school cohort in the background'
);
const bootLoginSuccessBlock = bootRuntime.slice(bootLoginSuccessIndex, bootLoginSuccessEndIndex);
assert.ok(!bootLoginSuccessBlock.includes('await loadAppModules();'), 'boot login should not block entry on full app module loading');
assert.ok(
    !bootLoginSuccessBlock.includes("loader.classList.remove('hidden')"),
    'boot login should not swap the login overlay for the full-screen global loader'
);
assert.ok(
    bootLoginSuccessBlock.includes('window.__BOOT_BACKGROUND_HYDRATING__ = true;')
        && bootLoginSuccessBlock.includes('window.__BOOT_BACKGROUND_HYDRATING__ = false;'),
    'boot login should mark background hydration so full app UI does not reopen the global loader'
);
assert.ok(
    appSource.includes('window.__BOOT_BACKGROUND_HYDRATING__ === true')
        && appSource.includes('return;'),
    'UI.loading should suppress full-screen loader show requests during boot background hydration'
);
const globalLoaderCssStart = mainCss.indexOf('#global-loader {');
const globalLoaderCssEnd = mainCss.indexOf('.loader-spinner', globalLoaderCssStart);
const globalLoaderCssBlock = globalLoaderCssStart >= 0 && globalLoaderCssEnd > globalLoaderCssStart
    ? mainCss.slice(globalLoaderCssStart, globalLoaderCssEnd)
    : '';
assert.ok(
    globalLoaderCssBlock.includes('pointer-events: none;'),
    'global loader should never intercept clicks while background hydration is running'
);
assert.ok(
    appSource.includes("loader.style.pointerEvents = 'none';"),
    'UI.loading should keep the global loader visually passive when shown or fading out'
);
assert.ok(
    dataManagerCoreRuntime.includes("open: function (initialTab = 'student')"),
    'DataManager.open should accept an initial tab so targeted entries avoid rendering the student tab first'
);
assert.ok(
    dataManagerCoreRuntime.includes("this.switchTab(initialTab || 'student');"),
    'DataManager.open should switch directly to the requested initial tab'
);
assert.ok(
    dataManagerCoreRuntime.includes("window.setTimeout(() => {\n                if (manager.currentTab === 'cloud') manager.renderCloudBackups();\n            }, 0);"),
    'cloud backup rendering should run after the click stack so the cloud button remains actionable'
);
assert.ok(
    dataManagerCoreRuntime.includes('openCloudManager: function ()'),
    'DataManager should expose a cloud manager entry'
);
assert.ok(
    authLoginRuntime.includes('DataManager.openCloudManager();'),
    'header cloud data button should open the cloud manager'
);
assert.ok(
    dataManagerCoreRuntime.includes("this.open('cloud');")
        && !dataManagerCoreRuntime.includes('mountCloudAreaInCloudManager')
        && !dataManagerCoreRuntime.includes('body.appendChild(cloudArea)'),
    'header cloud data should reuse the existing cloud tab without moving its large DOM subtree'
);
assert.ok(
    appSource.includes("function openCloudRollback()") && appSource.includes('DataManager.openCloudManager();'),
    'cloud rollback entry should also open the shared cloud manager'
);
assert.ok(
    (cloudRuntime.match(/select: 'key,content,updated_at'/g) || []).length >= 4
        && cloudRuntime.includes('if (metaRow.content) {\n                        row = metaRow;'),
    'teacher assignment hydration should reuse exact and fallback payloads instead of paying for a second gateway round trip'
);
assert.ok(
    !authLoginRuntime.includes("DataManager.open();\n                setTimeout(() =>"),
    'header cloud data button should not render the student tab before switching to cloud'
);
assert.ok(
    dataManagerCoreRuntime.includes("modal.setAttribute('data-mojibake-skip', 'true');")
        && appFoundationRuntime.includes("closest('[data-mojibake-skip=\"true\"]')"),
    'data manager modal should opt out of global mojibake subtree scans'
);
assert.ok(
    indicatorCalcRuntime.includes("DataManager.open('params');")
        && indicatorCalcRuntime.includes("DataManager.open('targets');")
        && appSource.includes("DataManager.open('teacher');"),
    'targeted data manager entries should open their requested tabs directly'
);
assert.ok(!bootRuntime.includes('await window.waitForAuthReady();'), 'boot login should not block workbench entry on Auth readiness');
assert.ok(!bootRuntime.includes('await enterSelectedBootCohort(cohortYear);'), 'boot login should not block workbench entry on cohort restoration');
assert.ok(indexHtml.includes('type="button" class="advanced-submit login-clean-submit"'), 'login submit button should not default-submit before boot handlers bind');
assert.ok(indexHtml.includes("window.__BOOT_LOGIN_CLICKED__=true"), 'login submit button should queue early clicks before boot runtime is ready');
const authStateRuntime = fs.readFileSync(runtimePath, 'utf8');
assert.ok(authStateRuntime.includes("root.getCurrentUser = runtime.getCurrentUser"), 'auth-state-runtime.js should expose legacy getCurrentUser for parallel mobile module boot');
assert.ok(authStateRuntime.includes("root.setCurrentUser = runtime.setCurrentUser"), 'auth-state-runtime.js should expose legacy setCurrentUser for older modules');
assert.ok(authStateRuntime.includes("root.clearCurrentUser = runtime.clearCurrentUser"), 'auth-state-runtime.js should expose legacy clearCurrentUser for older modules');
assert.ok(mobileAppRuntime.includes('function dismissPassiveSwal()'), 'mobile-app-runtime.js should dismiss passive mobile SweetAlert overlays');
assert.ok(mobileAppRuntime.includes("container.querySelector('.swal2-icon-error,.swal2-icon-warning,.swal2-icon-question')"), 'mobile passive SweetAlert dismissal should preserve error and confirmation dialogs');
assert.ok(bootRuntime.includes("prefetchAppModuleList(skill.entries.map((entry) => entry.src), 'data-manager-sql-prefetch')"), 'boot-runtime.js should prefetch data manager SQL runtime without executing it during login');
assert.ok(!bootRuntime.includes("{ label: 'data-manager-sql', loader: () => window.ensureDataManagerSqlRuntimeLoaded?.() }"), 'boot-runtime.js should not execute data manager SQL runtime during login warmup');
assert.ok(bootRuntime.includes("'teacher-analysis':"), 'runtime skill manifest should include teacher-analysis');
assert.ok(bootRuntime.includes("'teacher-correlation':"), 'runtime skill manifest should include teacher-correlation');
assert.ok(bootRuntime.includes("'teacher-correlation': bootSkill('demand', 'demand', ['correlation-analysis', 'renderCorrelationAnalysis', 'updateCorrelationSchoolSelect'], [\n        bootEntry('teacher-analysis-bridge', bootJs('teacher-analysis-bridge-runtime.js'))\n    ])"), 'correlation analysis should load only the lightweight bridge runtime');
assert.ok(bootRuntime.includes("case 'teacher-analysis-bridge':"), 'boot-runtime.js should detect an already-loaded teacher-analysis bridge runtime');
assert.ok(bootRuntime.includes("window.ensureTeacherCorrelationRuntimeLoaded = function ()"), 'boot-runtime.js should expose ensureTeacherCorrelationRuntimeLoaded');
assert.ok(
    teacherAnalysisBridgeRuntime.includes("window.filterRowsByAppSchool(rawRows, normalizedScope)"),
    'correlation analysis should derive scoped students from RAW_DATA when compact cloud shards omit SCHOOLS students'
);
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
const summaryEntryEnd = moduleEntryRuntime.indexOf("if (id === 'analysis')", summaryEntryStart);
const summaryEntrySource = summaryEntryStart >= 0 && summaryEntryEnd > summaryEntryStart
    ? moduleEntryRuntime.slice(summaryEntryStart, summaryEntryEnd)
    : '';
assert.ok(summaryEntrySource, 'summary entry source should be present');
assert.ok(!summaryEntrySource.includes('ensureSchoolProfileRuntimeLoaded'), 'summary entry should not parse school profile runtime before a profile click');
assert.ok(bootRuntime.includes('window.setTimeout(preload, 240);'), 'desktop hotspot prefetch should begin before runtime hydration work');
assert.ok(bootRuntime.includes('const prioritySteps = ['), 'desktop hotspot warmup should declare an interactive priority batch');
assert.ok(bootRuntime.includes('SCHOOL_RUNTIME_HOTSPOT_HYDRATE'), 'desktop hotspot runtime hydration should require an explicit local switch');
assert.ok(bootRuntime.includes('runStepsSequentially(prioritySteps'), 'interactive runtime warmup should avoid concurrent hot bundle parsing during user interaction');
assert.ok(bootRuntime.includes("const HOTSPOT_RUNTIME_HYDRATE_DELAY_MS = 2200"), 'desktop hotspot runtime hydration should start soon after app-ready instead of waiting through early navigation');
assert.ok(bootRuntime.includes("scheduleWarmup('hotspot-runtime:priority', runPrioritySteps)"), 'interactive runtime warmup should retain idle scheduling for boot responsiveness');
assert.ok(bootRuntime.indexOf("{ label: 'town-submodule-compare'") < bootRuntime.indexOf('const deferredSteps = ['), 'summary interaction runtimes should remain in the priority batch');
assert.ok(!bootRuntime.includes("{ label: 'teacher-analysis', loader: () => window.ensureTeacherAnalysisMainRuntimeLoaded?.() }"), 'teacher analysis runtime should not execute from generic hotspot warmup after login');
const teachingFastWarmupStart = bootRuntime.indexOf('function scheduleTeachingManagementFastWarmup()');
const teachingFastWarmupEnd = bootRuntime.indexOf('function installHistoryDoQueryWrapper()', teachingFastWarmupStart);
const teachingFastWarmupSource = teachingFastWarmupStart >= 0 && teachingFastWarmupEnd > teachingFastWarmupStart
    ? bootRuntime.slice(teachingFastWarmupStart, teachingFastWarmupEnd)
    : '';
assert.ok(teachingFastWarmupSource, 'teaching fast warmup source should be present');
assert.ok(!teachingFastWarmupSource.includes('ensureTeachingManagementRuntimeLoaded'), 'teaching management legacy bundle should stay demand-loaded outside legacy module entry');
assert.ok(teachingFastWarmupSource.includes('teaching-management-fast-prefetch'), 'teaching management runtime files should be prefetched after app entry');
assert.ok(teachingFastWarmupSource.includes('ensureTeacherAnalysisMainRuntimeLoaded'), 'teacher analysis runtime should remain fast-warmed for teacher insight modules');
assert.ok(teachingFastWarmupSource.includes('delay: 12000'), 'teacher analysis fast warmup should wait until after the login-critical window');
assert.ok(teachingManagementVersionRuntime.includes('TM_VERSION_INFLIGHT'), 'teaching version center should coalesce duplicate cloud reads');
assert.ok(teachingManagementVersionRuntime.includes('schoolSystemTeachingVersionCacheV1'), 'teaching version center should keep a short session snapshot');
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
assert.ok(indexHtml.includes('<span>全部功能</span>'), 'shell overview launcher should use the centralized Chinese command copy');
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
assert.ok(moduleEntryRuntime.includes('const TEACHER_ANALYSIS_RENDER_DELAY_MS = 16;'), 'teacher analysis should render real content on the first frame after activation');
assert.ok(moduleEntryRuntime.includes('function canReuseTeacherAnalysisStats()'), 'teacher submodules should reuse the current teacher analysis instead of rescanning all students on every switch');
assert.ok(moduleEntryRuntime.includes("const renderDelay = moduleId === 'teacher-analysis' ? TEACHER_ANALYSIS_RENDER_DELAY_MS : 80;"), 'teacher submodules should yield one paint before any required recalculation');
assert.ok(moduleEntryRuntime.includes('ensureTeacherAnalysisMainRuntimeLoaded()'), 'teacher portrait entry should load its runtime automatically');
assert.ok(moduleEntryRuntime.includes('function scheduleTeacherCompareAutoRender'), 'teacher multi-period compare should auto-render from default selectors');
assert.ok(moduleEntryRuntime.includes('function scheduleActiveModuleTask'), 'module entry should defer non-critical active-module work');
assert.ok(moduleEntryRuntime.includes("'analysis-entry-selects'"), 'analysis module should defer selector and hint refresh off the switch frame');
assert.ok(moduleEntryRuntime.includes("`county-analysis-render:${id}`"), 'county analysis should schedule heavy rendering after the switch frame');
assert.ok(moduleEntryRuntime.includes("'report-generator-selects'"), 'report generator should defer selector refresh off the switch frame');
assert.ok(moduleEntryRuntime.includes('function prewarmReportGeneratorRuntimes'), 'report generator should prewarm query runtimes after entry');
assert.ok(moduleEntryRuntime.includes("'report-generator-runtime-prewarm'"), 'report generator runtime prewarm should be scheduled off the switch frame');
assert.ok(moduleEntryRuntime.includes("{ delay: 40, idle: true, timeout: 1800 }"), 'report generator render runtime should prewarm immediately after entry paint');
assert.ok(moduleEntryRuntime.includes('ensureReportRenderRuntimeLoaded'), 'report generator prewarm should include report rendering runtime');
assert.ok(moduleEntryRuntime.includes('function initSummaryEntry()'), 'summary module should have a dedicated automatic entry initializer');
assert.ok(moduleEntryRuntime.includes('window.calcSummary(true)'), 'summary module entry should automatically calculate the overview table');
assert.ok(moduleEntryRuntime.includes('function prewarmStudentDiagnosisRuntimes'), 'student diagnosis should prewarm shared runtimes after the active module paints');
assert.ok(moduleEntryRuntime.includes("SystemRuntimeLoader.load('student-overview')"), 'student diagnosis prewarm should cover the overview runtime');
assert.ok(moduleEntryRuntime.includes("SystemRuntimeLoader.load('report-render')"), 'student diagnosis prewarm should cover the report query runtime');
assert.ok(!moduleEntryRuntime.includes("SystemRuntimeLoader.load('report-chart')"), 'student diagnosis entry should not prewarm chart rendering on the shared switch path');
assert.ok(moduleEntryRuntime.includes("'student-diagnosis-report-prewarm'"), 'report query prewarm should use a separate idle window from student overview');
assert.ok(moduleEntryRuntime.includes('{ delay: 2600, idle: true, timeout: 5200 }'), 'report query prewarm should not merge into the first diagnosis paint task');
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
assert.ok(appSource.includes('Moved to report-history-runtime.js'), 'app.js should keep a stub for the split report history runtime');
assert.ok(reportHistoryRuntime.includes('function examKeyEq'), 'report history should use a local safe exam-key comparator');
assert.ok(!/[^.\w]isExamKeyEquivalentForCompare\s*\(/.test(appSource), 'app.js should not call compare-shared exam-key helper as an unguarded global');
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
assert.ok(shellRuntime.includes('function activateCurrentCategoryDefaultModule'), 'shell should expose a shared helper for entering a category default module');
assert.ok(shellRuntime.includes('activateCurrentCategoryDefaultModule(key)'), 'clicking an already-active parent category should re-enter its default visible child module');
assert.ok(appSource.includes("const fallbackIds = ['starter-hub', 'teacher-analysis', 'student-overview', 'report-generator'];"), 'base config guard should redirect to the first role-visible module instead of forcing starter hub');
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
const teacherEntryStart = moduleEntryRuntime.indexOf("function initTeacherAnalysisEntry(moduleId = 'teacher-analysis')");
const teacherEntryEnd = moduleEntryRuntime.indexOf('function releaseTeacherAnalysisHeavyDom()', teacherEntryStart);
const teacherEntrySource = moduleEntryRuntime.slice(teacherEntryStart, teacherEntryEnd);
assert.ok(teacherEntrySource.includes("'teacher-analysis-auto-render'"), 'teacher-analysis entry should auto-generate the portrait after the switch frame');
assert.ok(moduleEntryRuntime.includes("const TEACHER_ANALYSIS_ENTRY_LABELS = [\n        'teacher-analysis-auto-render'"), 'teacher analysis auto-render should be cancelled when navigating between teacher submodules');
assert.ok(teacherEntrySource.includes('scheduleTeacherCompareAutoRender(16);'), 'teacher-analysis entry should initialize teacher compare selectors immediately after the switch frame');
assert.ok(
    teacherEntrySource.includes('renderTeacherAnalysisAfterRuntimeReady(moduleId)')
        && moduleEntryRuntime.includes('window.ensureTeacherAnalysisMainRuntimeLoaded()'),
    'teacher-analysis entry should load the analysis runtime before rendering locally or asynchronously restored teacher data'
);
assert.ok(!teacherEntrySource.includes('ensureTeacherMap(true)'), 'teacher-analysis entry should not auto-load teacher maps on switch');
assert.ok(!teacherEntrySource.includes('updateTeacherCompareExamSelects'), 'teacher-analysis entry should not scan compare exam selectors on switch');
assert.ok(!teacherEntrySource.includes('inferTeacherSchoolIfNeeded'), 'teacher-analysis entry should not infer teacher school on switch');
assert.ok(moduleEntryRuntime.includes('window.tmScheduleTeachingOverviewRender()'), 'module entry should schedule teaching overview refreshes after teacher analysis phases');
assert.ok(moduleEntryRuntime.includes('historyLimit: 0'), 'teacher-analysis entry should use a fast no-history first render');
assert.ok(moduleEntryRuntime.includes("function scheduleTeacherAnalysisRenderWork(delay = TEACHER_ANALYSIS_RENDER_DELAY_MS, moduleId = 'teacher-analysis')"), 'teacher analysis rendering should be scoped to the active teacher module');
assert.ok(moduleEntryRuntime.includes("if (targetModuleId === 'teacher-detail-comparison') {"), 'teacher detail entry should render only its own computed table');
assert.ok(moduleEntryRuntime.includes("function showTeacherAnalysisPendingState(moduleId = 'teacher-analysis')"), 'teacher pending states should be scoped to the active teacher module');
assert.ok(moduleEntryRuntime.includes("function releaseTeacherAnalysisHeavyDom() {\n        const section = document.getElementById('teacher-analysis');\n        if (!section || isTeacherAnalysisActive()) return;\n        clearTeacherAnalysisDeferredRender();"), 'teacher DOM cleanup must not cancel work while a teacher submodule remains active');
assert.ok(moduleEntryRuntime.includes("section?.dataset.teacherSubmoduleRendered === '1'"), 'township entry should reuse a completed dedicated render instead of recalculating it');
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
assert.ok(studentDetailsRenderRuntime.includes('const displaySourceList = STD_STATE.cacheData.slice(startIdx, endIdx);'), 'student details should paginate before comparison rank normalization');
assert.ok(studentDetailsRenderRuntime.includes('const displayList = displaySourceList.map((student) => getComparisonStudentView(student, RAW_DATA, comparisonContext));'), 'student details should normalize comparison rank data only for the visible page');
assert.ok(!studentDetailsRenderRuntime.includes('data = getComparisonStudentList(data, RAW_DATA);'), 'student details should avoid full-list comparison normalization before pagination');
assert.ok(!bootRuntime.includes("'student-compare': bootSkill('demand', 'demand', ['student-details'"), 'student compare runtime should not be triggered by entering student details');
assert.ok(bootRuntime.includes("'student-compare': bootSkill('demand', 'demand', ['renderStudentMultiPeriodComparison', 'saveStudentCompareToCloud', 'viewCloudStudentCompares']"), 'student compare runtime should load only for explicit multi-period actions');
assert.ok(!bootRuntime.includes("{ label: 'student-compare', loader: () => window.ensureStudentCompareRuntimeLoaded?.() }"), 'student compare runtime should not be part of hotspot warmup');
assert.ok(moduleEntryRuntime.includes('const canUseStudentMultiPeriod = role ==='), 'student details should gate multi-period prewarm by role');
assert.ok(moduleEntryRuntime.includes("delay: 1400, idle: true, timeout: 3200"), 'student details should defer multi-period prewarm after first render');
assert.ok(schoolNormalizationRuntime.includes('const townshipEligibilityCache = new Map();'), 'shared township row filtering should cache per-school eligibility');
assert.ok(schoolNormalizationRuntime.includes('townshipEligibilityCache.get(school)'), 'shared township row filtering should reuse per-school eligibility checks');
assert.ok(comparisonRenderRuntime.includes('const totalsBySchool = new Map();'), 'student comparison rank context should pre-group totals by school');
assert.ok(comparisonRenderRuntime.includes('const totalsByClass = new Map();'), 'student comparison rank context should pre-group totals by class');
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
assert.ok(dataManagerCoreRuntime.includes('const teacherRowsHtml = displayList.map'), 'teacher table rendering should build rows off-DOM before writing to tbody');
assert.ok(dataManagerCoreRuntime.includes("tbody.innerHTML = teacherRowsHtml.join('');"), 'teacher table rendering should write teacher rows to the DOM once');
assert.ok(!dataManagerCoreRuntime.includes('displayList.forEach(t => {'), 'teacher table rendering should avoid per-row DOM writes');
assert.ok(
    indexHtml.includes('id="dm-teacher-context-status"')
        && dataManagerCoreRuntime.includes('renderTeacherContextStatus: function ()')
        && dataManagerCoreRuntime.includes('更换任课教师')
        && dataManagerCoreRuntime.includes('summarizeTeacherImportContext'),
    'teacher maintenance should show the active cohort/term, confirm imports, and expose an explicit teacher replacement flow'
);
assert.ok(
    appSource.includes("const openTeacherManager = () => {")
        && appSource.includes("DataManager.open('teacher');")
        && appSource.includes('openTeacherManager();'),
    'starter teacher shortcut should open the editable teacher manager after restoring or syncing assignments'
);
assert.ok(
    moduleEntryRuntime.includes('function restoreTeacherMapFromLocalHistory()')
        && moduleEntryRuntime.includes('window.DataManager.ensureTeacherMap(false);')
        && moduleEntryRuntime.includes('function ensureTeacherAnalysisSectionLoaded()')
        && moduleEntryRuntime.includes("section.dataset.lazySectionPlaceholder !== '1'")
        && moduleEntryRuntime.includes("function renderTeacherAnalysisAfterRuntimeReady(moduleId = 'teacher-analysis')")
        && moduleEntryRuntime.includes('const settledLoadTask = Promise.resolve(loadTask).then(() => restoreTeacherMapFromLocalHistory());')
        && !moduleEntryRuntime.includes('if (ready && isTeacherAnalysisActive()) renderTeacherAnalysisAfterRuntimeReady();'),
    'teaching management entry should restore local teacher history before cloud access without triggering a duplicate render'
);
assert.ok(
    dataCloudRuntime.includes('<strong>当前参数归属：</strong>')
        && dataCloudRuntime.includes('参数按届别单独保存；切换到另一届后，会读取另一届自己的指标参数。'),
    'indicator parameter status should identify the active cohort, school year, term, and grade'
);
assert.ok(!dataCloudRuntime.includes('category: normalizeText(category)'), 'cloud archive metadata cache should be shared across category tabs');
assert.ok(dataCloudRuntime.includes('school-system:teacher-preview:'), 'teacher preview summaries should be cached for the browser session');
assert.ok(dataCloudRuntime.includes('readTeacherPreviewCache(item)'), 'teacher preview hydration should reuse cached summaries before downloading full maps');
assert.ok(appSource.includes('const teacherInputFragment = document.createDocumentFragment();'), 'teacher input generation should collect controls in a fragment');
assert.ok(appSource.includes('container.appendChild(teacherInputFragment);'), 'teacher input generation should attach controls with one fragment append');
assert.ok(!appSource.includes('container.appendChild(inputDiv);'), 'teacher input generation should avoid per-control container appends');
assert.ok(appSource.includes('const targetRowsHtml = Object.keys(SCHOOLS).map'), 'target editor should build school rows off-DOM before writing to tbody');
assert.ok(appSource.includes("tbody.innerHTML = targetRowsHtml.join('');"), 'target editor should write school target rows to the DOM once');
assert.ok(appSource.includes('const spotlightRowsHtml = [];'), 'spotlight search should collect result rows before writing to the result container');
assert.ok(appSource.includes("resDiv.innerHTML = spotlightRowsHtml.join('');"), 'spotlight search should write results to the DOM once per query');
assert.ok(!appSource.includes('resDiv.innerHTML +='), 'spotlight search should avoid per-result DOM writes');
// 命令面板契约：模块入口必须从 NAV_STRUCTURE（唯一真源）读取，不得回退到硬编码模块列表。
assert.ok(
    /const spotlightNav = \(typeof NAV_STRUCTURE/.test(appSource),
    'command palette should enumerate modules from NAV_STRUCTURE, not a hardcoded list'
);
assert.ok(
    appSource.includes('// 命令面板默认态：无输入时按分类分组列出全部可进入模块'),
    'command palette should render all accessible modules grouped by category when the query is empty'
);
assert.ok(marginalPushRuntime.includes('const ticketHtml = [];'), 'marginal ticket generation should collect cards off-DOM');
assert.ok(marginalPushRuntime.includes('ticketHtml.push(`'), 'marginal ticket generation should append card HTML to an off-DOM buffer');
assert.ok(marginalPushRuntime.includes("container.innerHTML = ticketHtml.join('');"), 'marginal ticket generation should write cards to the DOM once');
assert.ok(!marginalPushRuntime.includes('container.innerHTML +='), 'marginal ticket generation should avoid per-card DOM writes');
assert.ok(marginalPushRuntime.includes('function setSelectOptions'), 'marginal push selectors should share batched option rendering');
assert.ok(marginalPushRuntime.includes('.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)'), 'marginal push school/class selectors should batch option rendering');
assert.ok(marginalPushRuntime.includes('.map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`)'), 'marginal push subject selector should batch option rendering');
assert.ok(marginalPushRuntime.includes('setSelectOptions(classSelect, classes'), 'marginal push class selector should use batched option rendering');
assert.ok(dataManagerCoreRuntime.includes('const schoolOptionsHtml = [...schools]'), 'teacher school selector should build option HTML once');
assert.ok(marginalPushRuntime.includes('const options = Object.keys(snapshots)'), 'marginal snapshot selector should batch historical task options');
assert.ok(marginalPushRuntime.includes("select.innerHTML = `<option value=\"\">-- 选择历史任务 --</option>${options.join('')}`;"), 'marginal snapshot selector should write options once');
assert.ok(comparisonRenderRuntime.includes('const aidGroupFragment = document.createDocumentFragment();'), 'mutual aid group rendering should collect cards in a fragment');
assert.ok(comparisonRenderRuntime.includes('container.appendChild(aidGroupFragment);'), 'mutual aid group rendering should attach cards with one fragment append');
assert.ok(!comparisonRenderRuntime.includes('container.appendChild(card);'), 'mutual aid group rendering should avoid per-card container appends');
assert.ok(!appSource.includes('innerHTML +='), 'app.js should avoid repeated innerHTML appends');
assert.ok(teacherCompareResultRuntime.includes('function scheduleTeacherMultiPeriodAutoRender'), 'teacher multi-period compare should still respond to selector changes');
assert.ok(teacherCompareResultRuntime.includes('teacherCompareExamStatsCache'), 'teacher compare result runtime should cache per-exam teacher stats');
assert.ok(!teacherCompareResultRuntime.includes('if (!ready) return;\n        renderTeacherMultiPeriodComparison();'), 'teacher compare selectors should not auto-run heavy multi-period calculation');
assert.ok(teacherCompareResultRuntime.includes('bindTeacherCompareAutoControls();'), 'teacher compare runtime should bind selector auto-refresh controls');
assert.ok(moduleEntryRuntime.includes('teacherCompareManualReady'), 'teacher-analysis entry should prepare manual compare state instead of auto-rendering compare results');
assert.ok(teacherSyncRuntime.includes('rawPreferred'), 'teacher sync should honor preferred school candidates');
assert.ok(teacherSyncRuntime.includes('teacherClasses'), 'teacher sync should infer the active school from teacher assignment classes');
assert.ok(teacherSyncRuntime.includes("window.addEventListener('cloud-load-state'"), 'teacher sync should retry automatically after cloud workspace hydration');
assert.ok(teacherSyncRuntime.includes("scheduleTeacherSyncPrompt({ startup: true, force: true })"), 'cloud workspace hydration should force a silent teacher assignment retry');
assert.ok(progressAnalysisRuntime.includes('function filterProgressCompareRowsToTownshipScope'), 'progress comparison should have a township-scope filter for town ranks');
assert.ok(progressAnalysisRuntime.includes('const townshipRows = filterProgressCompareRowsToTownshipScope(allRows);'), 'progress comparison should derive town ranks from township-scoped rows');
assert.ok(progressAnalysisRuntime.includes('const rankTownMap = buildCompetitionRankMap(townshipRows'), 'progress comparison town ranks should not be built from full county rows');
assert.ok(progressAnalysisRuntime.includes("console.warn('[progress-compare] no comparable data:'"), 'progress comparison missing data should render as a warning instead of a console error');
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
assert.ok(!appSource.includes('const CohortGrowth = {'), 'app.js should not duplicate the dedicated cohort-growth runtime');
assert.ok(!appSource.includes('window.CohortGrowth = CohortGrowth'), 'app.js should not overwrite the dedicated cohort-growth runtime');
assert.ok(!appSource.includes('const IssueManager = {'), 'app.js should not duplicate management facades');
assert.ok(!appSource.includes('const Packager = {'), 'app.js should not duplicate management facades');
assert.ok(!appSource.includes('const HelpSystem = {'), 'app.js should not duplicate management facades');
assert.ok(!appSource.includes('const WorkerAPI = {'), 'app.js should not duplicate management facades');
assert.ok(!appSource.includes('const Logger = {'), 'app.js should not duplicate management facades');
assert.ok(!appSource.includes('const AccountManager = {'), 'app.js should not duplicate management facades');

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
    loginSessionRef,
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
assert.ok(bootScriptTag, 'index.html should contain a content-versioned boot runtime script tag');
assert.ok(/\sdefer(\s|>|=)/i.test(bootScriptTag), 'boot-runtime.js should load with defer');
const runtimeLoaderScriptTag = findScriptTag(indexHtml, runtimeLoaderRuntimeRef);
assert.ok(runtimeLoaderScriptTag, 'index.html should contain a script tag for runtime-loader-runtime.js');
assert.ok(/\sdefer(\s|>|=)/i.test(runtimeLoaderScriptTag), 'runtime-loader-runtime.js should load with defer');
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
    holographicRef,
    predictiveRef,
    metaverseRef,
    emotionalRef
].forEach((src) => {
    assert.strictEqual(indexHtml.includes(src), false, `${src} should not be eagerly loaded on boot`);
});
assert.strictEqual(
    indexHtml.includes(reportRenderRef),
    false,
    'report-render runtime should lazy-load after login instead of blocking the login page'
);
assert.strictEqual(
    indexHtml.includes(reportInsightRef),
    false,
    'report-insight runtime should lazy-load after login instead of blocking the login page'
);
assert.ok(
    edgeSameOriginGatewayCandidateIndex >= 0
        && edgeDirectGatewayCandidateIndex >= 0
        && edgeSameOriginGatewayCandidateIndex < edgeDirectGatewayCandidateIndex,
    'gateway should prefer the same-origin route so HttpOnly cookie sessions restore without cross-origin fallback latency'
);
assert.ok(
    gatewaySessionSource.includes("credentials: cookieRoute ? 'include' : 'omit'"),
    'same-origin gateway calls should include the HttpOnly session cookie'
);
// The authoritative 9年级 config now lives in cohort-exam-meta-runtime.js (setConfigState);
// the old initSystem copy in app.js was removed as dead code.
assert.ok(grade9TotalSubjectContract.test(cohortExamMetaRuntime), 'grade 9 total score must remain limited to Chinese, Math, English, Physics, Chemistry');
assert.ok(grade9PoliticsDisplayContract.test(cohortExamMetaRuntime), 'grade 9 politics should be configured as display-only subject');
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
    appSource.includes('function normalizeImportedClassForGrade'),
    'score import should expose grade-aware class normalization'
);
assert.ok(
    schoolNormalizationRuntime.includes("'东平银山实验学校'")
        && /canonical:\s*'银山实验'[\s\S]*东平银山实验学校/.test(schoolNormalizationRuntime),
    'school alias normalization should treat 东平银山实验学校 as 银山实验'
);
assert.ok(
    /function ensureWorkspaceDefaultSchool\(\)[\s\S]*const defaultSchool = findAvailableSchool\(DEFAULT_MY_SCHOOL_NAME\);[\s\S]*candidateSet\.add\(defaultSchool\)/.test(appSource)
        && appSource.includes("boundSchool && boundSchool !== '教育局'"),
    'workspace default school should prefer 银山实验 aliases and ignore 教育局 as a concrete school'
);
assert.ok(
    appSource.includes('classStr = normalizeImportedClassForGrade(r[idxMap.class], importGrade);'),
    'parseRows should normalize bare imported class numbers with the current exam grade'
);
assert.ok(
    appSource.includes('function beginScoreImportGuard')
        && appSource.includes('function isScoreImportInProgress')
        && appSource.includes('window.__SCORE_IMPORT_IN_PROGRESS__'),
    'score import should hold a runtime guard while parsing and cloud sync are in progress'
);
assert.ok(
    appSource.includes('same exam overwrite checked without destructive cleanup')
        && !/async function prepareSameExamOverwrite[\s\S]*?deleteSystemDataRecords[\s\S]*?function getUploadExamDataRowCount/.test(appSource),
    'same-exam score import overwrite should check existing data without deleting local or cloud records before upload'
);
{
    const uploadStart = appSource.indexOf("document.getElementById('fileInput').addEventListener('change'");
    const cloudSaveIndex = appSource.indexOf('cloudSynced = await saveCloudData({', uploadStart);
    const cohortSyncIndex = appSource.indexOf('await CohortDB.syncCurrentExam();', uploadStart);
    assert.ok(
        uploadStart >= 0 && cloudSaveIndex > uploadStart && cohortSyncIndex > cloudSaveIndex,
        'score import should upload the exam shard to cloud before overwriting the local CohortDB archive'
    );
    const hardResetIndex = appSource.indexOf('setRawData([]);', uploadStart);
    const readExcelIndex = appSource.indexOf('for (let f of files) await readExcel(f);', uploadStart);
    assert.ok(
        hardResetIndex > uploadStart && readExcelIndex > hardResetIndex
            && appSource.indexOf('setSchools({});', uploadStart) > uploadStart
            && appSource.indexOf('setSubjects([]);', uploadStart) > uploadStart
            && appSource.indexOf('setThresholds({});', uploadStart) > uploadStart,
        'score import should explicitly clear stale score state before reading the selected Excel file'
    );
}
assert.ok(
    /function tryAutoRestoreWorkspaceExam\(options = \{\}\) \{\s*if \(isScoreImportInProgress\(\)\)/.test(cohortExamMetaRuntime),
    'background exam auto-restore must not overwrite the workspace during score import'
);
assert.ok(
    /applyExamToWorkspace: function \(examId, options = \{\}\) \{\s*if \(isScoreImportInProgress\(\) && options\.allowDuringImport !== true\)/.test(cohortDbCoreRuntime),
    'history exam apply should be blocked while score import is in progress unless explicitly allowed'
);
assert.ok(
    /if \(mode === 'exam'\) \{\s*key = String\(opts\.examKey/.test(cloudWorkspaceRuntime)
        && cloudWorkspaceRuntime.includes('const examShardPayload = buildExamShardPayload(payload, key, buildCurrentExamEntry(payload, key));')
        && cloudWorkspaceRuntime.includes('if (examShardPayload) payload = examShardPayload;'),
    'exam cloud save should upload the current exam shard instead of the full workspace snapshot'
);
assert.ok(
    cloudWorkspaceRuntime.includes('const uploadPayload = legacyShard || payload;')
        && cloudWorkspaceRuntime.includes('const content = packPayload(uploadPayload);'),
    'legacy exam cloud save path should also upload the exam shard instead of the full workspace snapshot'
);
assert.ok(
    cloudWorkspaceRuntime.includes('students: {},')
        && cloudWorkspaceRuntime.includes('teachingHistory: {},'),
    'exam shard payloads should not include bulky cross-exam student history objects'
);
assert.ok(
    cloudWorkspaceRuntime.includes('function compactExamShardRows')
        && cloudWorkspaceRuntime.includes('function compactSchoolMetricsForShard')
        && cloudWorkspaceRuntime.includes('RAW_DATA: compactRows,')
        && cloudWorkspaceRuntime.includes('SCHOOLS: processedSchools,')
        && cloudWorkspaceRuntime.includes("if (field === 'students') return;")
        && cloudWorkspaceRuntime.includes('TEACHER_MAP: {},')
        && cloudWorkspaceRuntime.includes('TARGETS: {},'),
    'exam cloud shards should store compact score rows and school metrics without duplicating bulky student arrays'
);
assert.ok(
    cloudWorkspaceRuntime.includes('this.flushWorkspaceSyncQueue({ targetKey: key, forceUpload: opts.forceUpload === true })')
        && cloudWorkspaceRuntime.includes("if (!opts.forceUpload && currentMeta.lastUploadedHash && currentMeta.lastUploadedHash === contentHash)"),
    'forced exam cloud saves must force the queue flush instead of being skipped by a stale uploaded hash'
);
assert.ok(
    cloudWorkspaceRuntime.includes("if (targetKey && aKey === targetKey && bKey !== targetKey) return -1;")
        && cloudWorkspaceRuntime.includes("if (targetKey && bKey === targetKey && aKey !== targetKey) return 1;"),
    'workspace sync queue should prioritize the explicitly saved exam key before older pending jobs'
);
assert.ok(
    cloudWorkspaceRuntime.includes('const cacheWritten = await writeCachedWorkspaceSnapshot(key, payload);')
        && cloudWorkspaceRuntime.includes("if (!cacheWritten && mode === 'exam' && payload && typeof payload === 'object')")
        && cloudWorkspaceRuntime.includes('queueJob.inlinePayload = payload;')
        && cloudWorkspaceRuntime.includes("job.inlinePayload && typeof job.inlinePayload === 'object'"),
    'exam cloud saves should fall back to an inline compact payload when IndexedDB cache writes are unavailable'
);
assert.ok(
    cloudWorkspaceRuntime.includes('const workspaceSyncInlinePayloads = new Map();')
        && cloudWorkspaceRuntime.includes('workspaceSyncInlinePayloads.set(key, payload);')
        && cloudWorkspaceRuntime.includes('workspaceSyncInlinePayloads.has(cacheKey) ? workspaceSyncInlinePayloads.get(cacheKey) : null')
        && cloudWorkspaceRuntime.includes("lastCloudError: '本地同步缓存不可用，请刷新后重试'"),
    'foreground workspace cloud saves should keep an in-memory payload fallback when IndexedDB cache writes are unavailable'
);
assert.ok(
    cloudWorkspaceRuntime.includes('function scheduleCachedWorkspaceSnapshotWrite')
        && cloudWorkspaceRuntime.includes('function scheduleCompareSelectorsRefresh')
        && cloudWorkspaceRuntime.includes('refreshCompareSelectorsForMode(options.background === true)')
        && cloudWorkspaceRuntime.includes('scheduleCachedWorkspaceSnapshotWrite(row.key, payload, { updatedAt: row.updated_at })'),
    'background cloud hydration should defer cache writes and compare selector refreshes off the critical load path'
);
assert.ok(
    snapshotSystemRuntime.includes('function scheduleSnapshotPostApplyRender')
        && snapshotSystemRuntime.includes('function runSnapshotPostApplyLightRender')
        && snapshotSystemRuntime.includes('snapshot-post-apply-light-render')
        && cloudWorkspaceRuntime.includes('applySnapshotPayload(payload, { deferRender: true })')
        && cloudWorkspaceRuntime.includes('applySnapshotPayload(normalizedPayload, { deferRender: true })'),
    'cloud workspace restore should use light deferred post-apply rendering off the critical load path'
);
assert.ok(
    /CohortManager\.addCohort\(\{ year, startGrade \}, \{\s*skipConfirm: true,\s*fastEnter: options\.fastEnter !== false,\s*requireCloudData: options\.requireCloudData === true\s*\}\)/.test(cohortExamMetaRuntime),
    'login cohort entry should fast-enter and hydrate cloud cohort data in the background unless explicitly requested'
);
assert.ok(
    cohortExamMetaRuntime.includes('function requestCohortSwitchRuntime(cohortId, switchOptions)')
        && cohortExamMetaRuntime.includes("typeof window.switchCohort === 'function'")
        && cohortExamMetaRuntime.includes('__PENDING_COHORT_SWITCH_QUEUE__')
        && cohortExamMetaRuntime.includes('return requestCohortSwitchRuntime(cohortId, switchOptions);')
        && appSource.includes('window.switchCohort = switchCohort;')
        && appSource.includes('function flushPendingCohortSwitches()')
        && appSource.includes('window.__flushPendingCohortSwitches = flushPendingCohortSwitches;'),
    'early CohortManager switching should queue until app switchCohort is exported'
);
assert.ok(
    appSource.includes('void hydrateFromExamArchive();'),
    'fast cohort entry should restore the downloaded cloud snapshot into the already-open workspace'
);
assert.ok(appSource.includes('function setCohortSyncStatus'), 'cohort cloud restore should expose visible sync state');
assert.ok(indexHtml.includes('cohort-sync-status-runtime.js'), 'cohort sync status should load outside the main application bundle');
assert.ok(appSource.includes('function retryCurrentCohortSync'), 'failed cohort cloud restore should provide an explicit retry path');
assert.ok(indexHtml.includes('id="shell-sync-chip"'), 'workspace shell should render the cohort sync status chip');
assert.ok(
    appSource.includes('latestOnly: true') && appSource.includes('后台历史考试补全失败'),
    'login cohort entry should restore the latest exam first and hydrate historical exams in the background'
);
assert.ok(
    cloudWorkspaceRuntime.includes('function getExamKeyRecencyScore')
        && cloudWorkspaceRuntime.includes('const backgroundContentLimit = options.background === true && !forceSync ? minCount : 0;')
        && cloudWorkspaceRuntime.includes('const maxKeysToFetch = maxFetch > 0 ? maxFetch : (latestOnly ? 1 : backgroundContentLimit);')
        && cloudWorkspaceRuntime.includes('keysToFetch.length = maxKeysToFetch'),
    'limited cohort hydration should pick recency-ranked exam snapshots and cap background payload fetches'
);
assert.ok(
    appSource.includes('const dispatchModuleEnter = () => {')
        && appSource.includes('const activeSection = getModuleSectionById(id);')
        && appSource.includes("if (!activeSection || !activeSection.classList.contains('active')) return false;")
        && appSource.includes('window.setTimeout(dispatchModuleEnter, 700);'),
    'delayed module-entry dispatch should not let a previous module steal active state after a fast switch'
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
assert.ok(runtimeLoaderRuntimeIndex < bootRuntimeIndex, 'index.html should load runtime-loader-runtime.js before boot-runtime.js');
assert.ok(authStateIndex < cloudWorkspaceIndex, 'auth-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(authStateIndex < appIndex, 'auth-state-runtime.js must load before app.js');
assert.ok(shellRuntimeIndex < appIndex, 'shell-runtime.js must load before app.js');
assert.ok(shellRuntimeIndex < moduleEntryRuntimeIndex, 'shell-runtime.js must load before module-entry-runtime.js');
assert.ok(moduleEntryRuntimeIndex < rankingDataServiceIndex, 'module-entry-runtime.js must load before ranking-data-service-runtime.js');
assert.ok(rankingDataServiceIndex < appIndex, 'ranking-data-service-runtime.js must load before app.js');
assert.ok(compareSharedIndex >= 0, 'compare-shared-runtime.js should load with core app modules');
assert.ok(rankingDataServiceIndex < compareSharedIndex, 'ranking-data-service-runtime.js must load before compare-shared-runtime.js');
assert.ok(compareSharedIndex < appIndex, 'compare-shared-runtime.js must load before app.js');
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
assert.ok(indicatorCalcRuntime.includes('const IndicatorCalcPerfCache'), 'indicator should cache repeated silent calculations');
assert.ok(indicatorCalcRuntime.includes('function buildIndicatorCalcSignature'), 'indicator cache should use an explicit dependency signature');
assert.ok(indicatorCalcRuntime.includes('isSilent') && indicatorCalcRuntime.includes('IndicatorCalcPerfCache.signature === calcSignature'), 'indicator cache should only short-circuit repeated silent calculations');
assert.ok(appSource.includes('function scheduleIndicatorAutoScoreAfterDataReady'), 'indicator should keep a deferred auto-score path after data restore');
assert.ok(appSource.includes("scheduleIndicatorAutoScoreAfterDataReady('processData')"), 'processData should trigger deferred indicator auto-score after restoring school data');
assert.ok(schoolNormalizationRuntime.includes('const IndicatorSchoolBucketPerfCache'), 'indicator school normalization should cache repeated bucket builds');
assert.ok(schoolNormalizationRuntime.includes('function getIndicatorSchoolBucketSignature'), 'indicator bucket cache should use an explicit dependency signature');
assert.ok(schoolNormalizationRuntime.includes('scoreNameMap'), 'indicator score sync should cache repeated school-name matching');
assert.ok(moduleEntryRuntime.includes("node.dataset.released === 'true'"), 'teacher heavy DOM release should not rewrite already released placeholders on later module switches');
assert.ok(
    reportHistoryRuntime.includes('background: true')
        && reportHistoryRuntime.includes('delay: 3000')
        && reportHistoryRuntime.includes('idle: true'),
    'student report history should hydrate after the initial report paint'
);
assert.ok(reportHistoryRuntime.includes('cloudHistoryByStudent') && reportHistoryRuntime.includes('refreshHydratedStudentReport'), 'student report cloud history should refresh its own report without replacing cohort progress data');
assert.ok(moduleEntryRuntime.includes('const TEACHER_ANALYSIS_RENDER_DELAY_MS = 16;'), 'teacher analysis should not leave an activated shell empty for over a second');
assert.ok(smokeAllModules.includes('waitForTeacherAutoRestore(page)'), 'module smoke should observe startup teacher auto restore before prewarming');
assert.ok(!smokeAllModules.includes("name: 'restoreTeacherMap'"), 'module smoke must not repair teacher assignments during prewarm');
assert.ok(smokeAllModules.includes('teacherCardsRendered'), 'teacher analysis smoke should require real teacher cards instead of accepting the shell');
assert.ok(smokeAllModules.includes("String(item?.name || '').trim() === '解洪旭'"), 'report smoke should prefer the known production student');
assert.ok(smokeAllModules.includes('classRankChangeReady') && smokeAllModules.includes('schoolRankChangeReady'), 'report smoke should verify rank-change content');
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
