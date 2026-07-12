const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const removedFiles = [
    'public/assets/js/admin-dashboard.js',
    'public/assets/js/audit-logger.js',
    'public/assets/js/automated-reports.js',
    'public/assets/js/chart-interactivity.js',
    'public/assets/js/comparison-engine-v2.js',
    'public/assets/js/data-anonymizer.js',
    'public/assets/js/data-pagination.js',
    'public/assets/js/drag-drop-lab.js',
    'public/assets/js/parent-growth-portal.js',
    'public/assets/js/responsive-table.js',
    'public/assets/js/school-resource-monitor.js',
    'public/assets/js/student-learning-nav.js',
    'public/assets/js/sync-push-center.js',
    'public/assets/js/teacher-collab-hub.js',
    'public/assets/js/voice-assistant.js',
    'src/patch.js'
];

const forbiddenRuntimeTokens = [
    'ai-analysis',
    'ai-hub-runtime.js',
    'report-ai-runtime.js',
    'ai-diagnosis.js',
    '/api/ai/',
    'LLM_API_KEY',
    'BATCH_AI',
    'IS_BATCH_AI'
];

const sourceFiles = [
    'src/index.html',
    'src/worker-dummy.js',
    'public/assets/js/app.js',
    'public/assets/js/boot-runtime.js',
    'public/assets/js/runtime-loader-runtime.js',
    'public/assets/js/shell-runtime.js',
    'public/assets/js/module-entry-runtime.js',
    'public/assets/js/permission-policy-runtime.js',
    'scripts/build/inline-scripts.mjs',
    'package.json'
];

const quietRuntimeFiles = [
    'public/assets/js/boot-runtime.js',
    'public/assets/js/runtime-loader-runtime.js',
    'public/assets/js/data-cloud-runtime.js',
    'public/assets/js/history-compare-runtime.js',
    'public/assets/js/student-compare-generate-runtime.js',
    'public/assets/js/student-compare-result-runtime.js'
];

removedFiles.forEach((relativePath) => {
    assert.strictEqual(
        fs.existsSync(path.join(root, relativePath)),
        false,
        `${relativePath} should remain removed`
    );
});

sourceFiles.forEach((relativePath) => {
    const filePath = path.join(root, relativePath);
    const text = fs.readFileSync(filePath, 'utf8');
    forbiddenRuntimeTokens.forEach((token) => {
        assert.strictEqual(
            text.includes(token),
            false,
            `${relativePath} should not contain removed runtime token: ${token}`
        );
    });
});

quietRuntimeFiles.forEach((relativePath) => {
    const text = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.ok(!/console\.log\([^)]*学生对比/.test(text), `${relativePath} should not emit student compare console.log noise`);
    assert.ok(!/console\.log\([^)]*班级下拉框/.test(text), `${relativePath} should not emit class filter console.log noise`);
    assert.ok(!text.includes('console.log('), `${relativePath} should not emit default console.log noise`);
});

const studentCompareResult = fs.readFileSync(path.join(root, 'public/assets/js/student-compare-result-runtime.js'), 'utf8');
assert.ok(studentCompareResult.includes('escapeStudentCompareHtml'), 'student compare class filter options should escape dynamic class names');
const historyCompareRuntime = fs.readFileSync(path.join(root, 'public/assets/js/history-compare-runtime.js'), 'utf8');
assert.ok(historyCompareRuntime.includes('escapeHistoryHtml(h.examId)'), 'history compare should escape dynamic exam names');
assert.ok(historyCompareRuntime.includes('escapeHistoryHtml(k[0])'), 'history compare should escape dynamic subject names');
const schoolProfileRuntime = fs.readFileSync(path.join(root, 'public/assets/js/school-profile-runtime.js'), 'utf8');
assert.ok(schoolProfileRuntime.includes('escapeSchoolProfileHtml(schoolName)'), 'school profile should escape dynamic school names');
assert.ok(schoolProfileRuntime.includes('escapeSchoolProfileHtml(maxSub)'), 'school profile should escape dynamic advantage subject names');
assert.ok(schoolProfileRuntime.includes('escapeSchoolProfileHtml(minSub)'), 'school profile should escape dynamic weak subject names');
const appRuntime = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
const reportHistoryRuntime = fs.readFileSync(path.join(root, 'public/assets/js/report-history-runtime.js'), 'utf8');
const analyticsKernelRuntime = fs.readFileSync(path.join(root, 'public/assets/js/analytics-kernel-runtime.js'), 'utf8');
const countyAnalysisRuntime = fs.readFileSync(path.join(root, 'public/assets/js/county-analysis-runtime.js'), 'utf8');
const teacherAnalysisCoreRuntime = fs.readFileSync(path.join(root, 'public/assets/js/teacher-analysis-core-runtime.js'), 'utf8');
const smokeAllModulesRuntime = fs.readFileSync(path.join(root, 'scripts/smoke-all-modules.js'), 'utf8');
assert.ok(analyticsKernelRuntime.includes('normalizeProcessCacheLimit(root.ANALYTICS_PROCESS_CACHE_LIMIT, 5)'), 'analytics process cache should be configurable and default to five entries');
assert.ok(analyticsKernelRuntime.includes("hashText(hash, '[')"), 'analytics hashJson arrays should open with [');
assert.ok(analyticsKernelRuntime.includes("hashText(listHash, ']'"), 'analytics hashJson arrays should close with ]');
assert.ok(countyAnalysisRuntime.includes('function isCountyGrade9Context()'), 'county analysis should use normalized grade inference');
assert.ok(!countyAnalysisRuntime.includes("String(window.CONFIG?.name || '').trim();\n        return name.includes('9')"), 'county analysis should not infer grade 9 from arbitrary names containing 9');
assert.ok(countyAnalysisRuntime.includes('assignCompetitionRanks(rankingData, (item) => item.avg'), 'county teacher rankings should handle ties');
assert.ok(countyAnalysisRuntime.includes('state.teacherContextPromise.catch'), 'county teacher context refresh should consume async failures');
assert.ok(teacherAnalysisCoreRuntime.includes('function teacherIsGrade9Context()'), 'teacher analysis should use normalized grade inference');
assert.ok(!teacherAnalysisCoreRuntime.includes("String(window.CONFIG?.name || '').includes('9')"), 'teacher analysis should not infer grade 9 from arbitrary names containing 9');
assert.ok(!teacherAnalysisCoreRuntime.includes("|| '银山实验'"), 'teacher analysis should not hardcode a real school as fallback');
assert.ok(!appRuntime.includes("onclick=\"showSchoolProfile('${s.name}')\""), 'summary table should not inject dynamic school names into inline handlers');
assert.ok(appRuntime.includes('const safeSchoolName = escapeAppHtml(s.name)'), 'summary table should escape dynamic school names before rendering');
assert.ok(appRuntime.includes('data-school-profile-name="${safeSchoolName}"'), 'summary table should bind school profile actions through a safe data attribute');
assert.ok(reportHistoryRuntime.includes('window.SystemPerformance.scheduleTask(`report-history-hydrate:${hydrateKey}`, task'), 'report history hydration should be delayed as a scheduled background task');
assert.ok(reportHistoryRuntime.includes('delay: 400'), 'report history hydration should follow first paint promptly instead of leaving comparison content empty');
assert.ok(appRuntime.includes('function buildSummaryDependencySignature'), 'summary stale prompt should compare dependency signatures');
assert.ok(appRuntime.includes('markSummaryDataChangedIfDependencyChanged('), 'summary stale prompt should not be triggered unconditionally by prerequisite renders');
assert.ok(appRuntime.includes("buildSummaryDependencySignature('twoRateBottom', townshipSchools)"), 'two-rate/bottom3 refresh should use a stable dependency signature');
assert.ok(appRuntime.includes("buildSummaryDependencySignature('indicator', calcData)"), 'indicator refresh should use a stable dependency signature');
assert.ok(appRuntime.includes("buildSummaryDependencySignature('highScore', list)"), 'high-score refresh should use a stable dependency signature');
assert.ok(!appRuntime.includes("markSummaryDataChanged('两率一分或后1/3结果已更新，请重新生成总排名。');"), 'two-rate/bottom3 refresh should not always mark summary stale');
assert.ok(!appRuntime.includes("markSummaryDataChanged('指标生核算结果已更新，请重新生成总排名。');"), 'indicator refresh should not always mark summary stale');
assert.ok(!appRuntime.includes("markSummaryDataChanged('高分段赋分已更新，请重新生成总排名。');"), 'high-score refresh should not always mark summary stale');
assert.ok(smokeAllModulesRuntime.includes('summaryStalePromptAbsent'), 'summary smoke should fail if unchanged data shows a stale regeneration prompt');
assert.ok(smokeAllModulesRuntime.includes('/数据已变更|请重新生成/'), 'summary smoke should inspect stale prompt text directly');
const archiveRuntime = fs.readFileSync(path.join(root, 'public/assets/js/data-manager-archive-runtime.js'), 'utf8');
assert.ok(!archiveRuntime.includes('onclick="DataManager.renameHistoryExam('), 'history archive rows should not inject exam names into inline handlers');
assert.ok(archiveRuntime.includes('data-history-exam-action="rename"'), 'history archive rows should bind rename actions through data attributes');
const targetsRuntime = fs.readFileSync(path.join(root, 'public/assets/js/data-manager-targets-runtime.js'), 'utf8');
assert.ok(!targetsRuntime.includes('onclick="DataManager.editTarget('), 'target rows should not inject school names into inline handlers');
assert.ok(targetsRuntime.includes('data-target-action="edit"'), 'target rows should bind edit actions through data attributes');
const dataCloudRuntime = fs.readFileSync(path.join(root, 'public/assets/js/data-cloud-runtime.js'), 'utf8');
assert.ok(!dataCloudRuntime.includes('onclick="DataManager.loadCloudBackup('), 'cloud backup rows should not inject keys into inline handlers');
assert.ok(dataCloudRuntime.includes('data-cloud-backup-action="download"'), 'cloud backup rows should bind download actions through data attributes');
assert.ok(dataCloudRuntime.includes('data-cloud-snapshot-key="${safeKey}"'), 'cloud snapshot rows should bind delete actions through data attributes');
const renderCloudBackupsStart = dataCloudRuntime.indexOf('async function renderCloudBackups(manager');
const renderCloudBackupsEnd = dataCloudRuntime.indexOf('function toggleCloudSelection(manager, inputEl)', renderCloudBackupsStart);
const renderCloudBackupsSource = renderCloudBackupsStart >= 0 && renderCloudBackupsEnd > renderCloudBackupsStart
    ? dataCloudRuntime.slice(renderCloudBackupsStart, renderCloudBackupsEnd)
    : '';
assert.ok(dataCloudRuntime.includes("const select = 'key, created_at, updated_at, size_bytes';"), 'cloud backup list should request stored metadata without hydrating snapshot content');
assert.ok(!dataCloudRuntime.includes("const select = 'key, content, created_at, updated_at, size_bytes';"), 'cloud backup list should not request snapshot content');
assert.ok(
    dataCloudRuntime.includes("{ kind: 'exam' }")
        && dataCloudRuntime.includes("{ kind: 'workspace' }")
        && dataCloudRuntime.includes("{ kind: 'teacher_map' }")
        && dataCloudRuntime.includes("{ kind: 'backup' }")
        && dataCloudRuntime.includes("{ keyLike: 'BACKUP_%' }"),
    'all-project cloud view should query user-visible record types separately so internal index records stay hidden'
);
assert.ok(dataCloudRuntime.includes('function getCloudBackupListQueryOptions(filterCurrent)'), 'cloud backup list should build bounded query options');
assert.ok(dataCloudRuntime.includes('options.keyIn = Array.from(keys);'), 'cloud backup list should query exact current workspace keys');
assert.ok(!dataCloudRuntime.includes('options.keyLike = `%${cohortId}%`;'), 'current cloud backup list should not use wildcard cohort scans');
assert.ok(dataCloudRuntime.includes('limit: filterCurrent ? 800 : 500'), 'cloud backup list should cap metadata list reads');
assert.ok(dataCloudRuntime.includes('const MAX_CLOUD_BACKUP_RENDER_ROWS = 80'), 'cloud backup list should cap rows rendered into the DOM');

const teachingModulesRuntime = fs.readFileSync(path.join(root, 'public/assets/js/teaching-management-modules-runtime.js'), 'utf8');
const moduleEntryRuntime = fs.readFileSync(path.join(root, 'public/assets/js/module-entry-runtime.js'), 'utf8');
assert.ok(
    teachingModulesRuntime.includes('function findTeacherTownshipRankingPanel()'),
    'teaching management split should resolve the real teacher township ranking panel'
);
assert.ok(
    teachingModulesRuntime.includes("!panel.classList.contains('teacher-split-placeholder')"),
    'teacher township relocation should not move the split placeholder into the ranking slot'
);
assert.ok(
    teachingModulesRuntime.includes('ensureTeacherTownshipRankingSlotReady'),
    'teacher township submodule should retry relocation after the lazy teacher template loads'
);
assert.ok(
    !teachingModulesRuntime.includes("moveNodeToSlot(document.querySelector('.analysis-ranking-panel'), 'teacher-township-ranking-slot')"),
    'teacher township relocation should not select the first ranking panel blindly'
);
assert.ok(
    moduleEntryRuntime.includes("window.ensureLazySectionLoaded('teacher-analysis')"),
    'teacher insight submodule entry should load the teacher analysis lazy template before rendering split panels'
);
assert.ok(
    moduleEntryRuntime.includes('ensureTeacherTownshipRankingSlotReady'),
    'teacher insight submodule entry should ready the township ranking slot for direct navigation'
);
assert.ok(renderCloudBackupsSource.includes('const displayRows = visibleRows.slice(0, MAX_CLOUD_BACKUP_RENDER_ROWS);'), 'cloud backup list should render a bounded page of rows');
assert.ok(renderCloudBackupsSource.includes('displayRows.forEach((item) => {'), 'cloud backup table should iterate the bounded display rows');
assert.ok(!dataCloudRuntime.includes('fallbackQueryOptions'), 'current cloud backup list should not fall back to a full metadata scan');
assert.ok(!renderCloudBackupsSource.includes("select: 'key, created_at, updated_at, content'"), 'cloud backup list should not fetch full content while rendering rows');

console.log('runtime hygiene tests passed');
