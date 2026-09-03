const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const cloudSource = fs.readFileSync(path.join(root, 'public/assets/js/cloud.js'), 'utf8');
const workspaceSource = fs.readFileSync(path.join(root, 'public/assets/js/cloud-workspace-runtime.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
const parseRowsSource = fs.readFileSync(path.join(root, 'public/assets/js/parse-rows-runtime.js'), 'utf8');
const cohortExamMetaSource = fs.readFileSync(path.join(root, 'public/assets/js/cohort-exam-meta-runtime.js'), 'utf8');
const cohortDbCoreSource = fs.readFileSync(path.join(root, 'public/assets/js/cohort-db-core-runtime.js'), 'utf8');

const storage = {
    getItem() {
        return null;
    },
    setItem() {},
    removeItem() {}
};
const window = {
    addEventListener() {},
    localStorage: storage,
    sessionStorage: storage,
    setTimeout() {},
    CloudApi: {}
};
const context = {
    window,
    localStorage: storage,
    sessionStorage: storage,
    setTimeout() {},
    console
};

vm.runInNewContext(cloudSource, context, { filename: 'cloud.js' });

const normalize = window.CloudWorkspaceRuntimeDeps.normalizeWorkspacePayload;
assert.strictEqual(typeof normalize, 'function', 'workspace normalizer must be shared with the hydration runtime');
const getWorkspaceExamOrderScore = window.CloudWorkspaceRuntimeDeps.getWorkspaceExamOrderScore;
assert.strictEqual(typeof getWorkspaceExamOrderScore, 'function', 'workspace exam ordering helper must be shared');

function rows(count, school) {
    return Array.from({ length: count }, (_, index) => ({
        school,
        class: '1',
        name: `学生${index}`,
        total: 100,
        scores: {}
    }));
}

const staleRows = rows(480, '实验完全中学');
const latestRows = rows(7809, '银山实验学校');
const payload = {
    CURRENT_COHORT_ID: '2022',
    CURRENT_COHORT_META: { id: '2026', year: '2026', startGrade: 6 },
    CURRENT_EXAM_ID: '2026_校内首模',
    FINGERPRINT: 'stale',
    RAW_DATA: staleRows,
    SCHOOLS: {},
    COHORT_DB: {
        currentExamId: '2026_校内首模',
        exams: {
            '2022级-9年级-2025-2026-上学期-期末-2026-01-31': {
                meta: { date: '2026-01-31', grade: '9' },
                data: rows(2029, '银山实验学校'),
                createdAt: Date.parse('2026-01-31T00:00:00Z')
            },
            '2022级-9年级-2025-2026-下学期-一模-2026-04-16': {
                meta: { date: '2026-04-16', grade: '9' },
                data: latestRows,
                createdAt: Date.parse('2026-04-16T00:00:00Z')
            }
        }
    }
};

const normalized = normalize(payload);
assert.strictEqual(
    normalized.CURRENT_EXAM_ID,
    '2022级-9年级-2025-2026-下学期-一模-2026-04-16',
    'latest real exam belonging to the selected cohort should be activated'
);
assert.strictEqual(normalized.RAW_DATA.length, 7809, 'stale workspace rows should be replaced by current exam rows');
assert.ok(!normalized.COHORT_DB.exams['2026_校内首模'], 'cross-cohort stale exam should not survive normalization');
assert.strictEqual(normalized.CURRENT_COHORT_META.id, '2022', 'workspace cohort metadata should follow the selected cohort');
assert.strictEqual(
    normalize({ CURRENT_COHORT_ID: '2022', CURRENT_COHORT_META: { id: '2026', year: '2026' } }).CURRENT_COHORT_META.id,
    '2022',
    'split metadata payload should repair cohort metadata before exam data is hydrated'
);
assert.strictEqual(
    normalize({ CURRENT_COHORT_ID: '2025', CURRENT_PROJECT_KEY: 'cohort::2022' }).CURRENT_PROJECT_KEY,
    'cohort::2025',
    'workspace normalizer should repair stale project keys when a cloud payload belongs to another cohort'
);

const erMoRows = rows(7812, '银山实验学校');
const erMoPayload = normalize({
    CURRENT_COHORT_ID: '2022',
    CURRENT_COHORT_META: { id: '2022', year: '2022', startGrade: 6 },
    CURRENT_EXAM_ID: '2022级-9年级-2025-2026-上学期-期末',
    RAW_DATA: staleRows,
    SCHOOLS: {},
    COHORT_DB: {
        currentExamId: '2022级-9年级-2025-2026-上学期-期末',
        exams: {
            '2022级-9年级-2025-2026-上学期-期末': {
                meta: { grade: '9' },
                data: rows(2029, '银山实验学校'),
                updatedAt: '2026-06-25T12:00:00.000Z'
            },
            '2022级-9年级-2025-2026-下学期-一模': {
                meta: { grade: '9' },
                data: latestRows,
                updatedAt: '2026-06-24T12:00:00.000Z'
            },
            '2022级-9年级-2025-2026-下学期-二模': {
                meta: { grade: '9' },
                data: erMoRows,
                updatedAt: '2026-06-23T12:00:00.000Z'
            }
        }
    }
});
assert.strictEqual(
    erMoPayload.CURRENT_EXAM_ID,
    '2022级-9年级-2025-2026-下学期-二模',
    'second mock exam should outrank first mock and final exam even when storage timestamps are newer for older exams'
);
assert.strictEqual(erMoPayload.RAW_DATA.length, 7812, 'second mock exam rows should become current workspace rows');
assert.ok(
    getWorkspaceExamOrderScore('2022级-9年级-2025-2026-下学期-二模', { updatedAt: '2026-06-23T12:00:00.000Z' })
        > getWorkspaceExamOrderScore('2022级-9年级-2025-2026-上学期-期末', { updatedAt: '2026-06-25T12:00:00.000Z' }),
    'exam ordering should prefer exam phase over storage recency when explicit exam dates are missing'
);
assert.ok(
    workspaceSource.includes('normalizeWorkspacePayload: normalizeCloudWorkspacePayload'),
    'workspace runtime should consume the shared normalizer'
);
assert.ok(
    workspaceSource.includes('normalizedPayload = await supplementIndicatorPayload'),
    'cached workspace payloads should be normalized before application'
);
const dataCloudSource = fs.readFileSync(path.join(root, 'public/assets/js/data-cloud-runtime.js'), 'utf8');
assert.ok(
    dataCloudSource.includes('function compareWorkspaceExamRows')
        && dataCloudSource.includes('readSplitExamPayload(\'\', payload)')
        && dataCloudSource.includes('return normalizeWorkspacePayload(mergeSplitWorkspacePayload'),
    'data-cloud split workspace restore should choose the latest same-cohort exam shard and normalize the merged payload'
);
assert.ok(
    workspaceSource.includes('async function assertWorkspaceBundleSafeForUpload'),
    'workspace sync should guard against stale cohort snapshots overwriting newer cloud exams'
);
assert.ok(
    workspaceSource.includes('const WORKSPACE_BUNDLE_UPLOAD_CHUNK_SIZE = 1'),
    'workspace bundle sync should upload split exam shards one-by-one to avoid oversized Worker/D1 batch writes'
);
assert.ok(
    workspaceSource.includes("await upsertSystemDataRecordChunks(rows, '工作区分片同步')"),
    'workspace bundle upload should use chunked system_data upserts instead of one large POST'
);
assert.ok(
    workspaceSource.includes('return this._workspaceSyncFlushTask.then(() => this.flushWorkspaceSyncQueue(opts));'),
    'manual save should rerun queue flush after an active background flush so the newly queued overwrite is uploaded'
);
assert.ok(
    workspaceSource.includes("document.getElementById('dm_high_school_line_input')")
        && workspaceSource.includes('function readWorkspaceParamValue')
        && workspaceSource.includes('ind1: readWorkspaceParamValue(ind1, currentIndicator.ind1)')
        && workspaceSource.includes('highSchoolLine: readWorkspaceParamValue(highSchoolLineInput, currentIndicator.highSchoolLine)'),
    'cloud sync should preserve existing indicator params and the high-school admission score line when input boxes are blank'
);
assert.ok(
    workspaceSource.includes("key = String(opts.examKey || '').trim() || getCurrentExamIdFromPayload(payload) || String(window.CURRENT_EXAM_ID || '').trim() || key;"),
    'exam-mode saves should use the canonical current exam id instead of the legacy CloudManager key'
);
assert.ok(
    /saveCloudData\(\{[\s\S]*mode:\s*'exam'[\s\S]*examKey:\s*currentExamId/.test(appSource),
    'score imports should pass the locked exam key into cloud sync'
);
assert.ok(
    appSource.includes('getLegacyDbSaveOptionsForKey'),
    'legacy DB autosave should centralize cloud-save options'
);
assert.ok(
    /getLegacyDbSaveOptionsForKey[\s\S]*cloud\s*:\s*(?:false|!1)/.test(appSource),
    'cohort workspace autosaves should not duplicate full cloud writes through the legacy DB path'
);
assert.ok(
    appSource.includes('DB.save(currentKey, snapshotPayload, getLegacyDbSaveOptionsForKey(currentKey'),
    'large cohort workspace autosaves should stay local while split cloud sync owns remote writes'
);
assert.ok(
    workspaceSource.includes('云端连接未就绪，请重新登录或稍后重试'),
    'manual score sync should persist a clear cloud readiness failure instead of a generic error'
);
assert.ok(
    workspaceSource.includes('已阻止云端覆盖：本地当前考试'),
    'stale workspace guard should show an actionable blocked-sync reason'
);
assert.ok(
    workspaceSource.includes('getExamKeyOrderScore(currentExamId)'),
    'stale workspace guard should compare exam order without using cloud updated_at recency'
);
assert.ok(
    workspaceSource.includes('limit: COHORT_EXAM_LATEST_META_LIMIT') && workspaceSource.includes('getExamKeyRecencyScore(right.key, right.updated_at)'),
    'latest exam fallback should inspect a wider candidate set and sort by exam recency'
);
assert.ok(
    workspaceSource.includes('const backgroundLatestOnly = options.background === true && !forceSync;')
        && workspaceSource.includes('const latestMetaOnly = latestOnly || backgroundLatestOnly || maxFetch > 0;'),
    'background cloud restore should use latest metadata mode instead of paging through full cohort history'
);
assert.ok(
    workspaceSource.includes('if (remotePayload)') && workspaceSource.includes('if (latestPayload)'),
    'stale workspace guard should not swallow intentional blocked-upload errors'
);
assert.ok(
    cohortExamMetaSource.includes('preferredMatchesCohort'),
    'post-hydration exam restoration should reject a foreign-cohort active snapshot'
);
assert.ok(
    cohortExamMetaSource.includes('ensureCohortRegistered(normalizedCohortId);'),
    'post-hydration exam restoration should repair stale cohort metadata'
);
assert.ok(
    cohortExamMetaSource.includes('CohortDB.applyExamToWorkspace(preferredExamId, {')
        && cohortExamMetaSource.includes('recalculate: !currentSchoolMetricsReady'),
    'post-hydration exam restoration should refresh stale grade-derived settings'
);
assert.ok(
    cohortExamMetaSource.includes('function hasUsableProcessedSchoolMetrics'),
    'workspace restore should distinguish rebuilt school rosters from processed school metrics'
);
assert.ok(
    cohortExamMetaSource.includes('const currentSchoolMetricsReady = hasUsableProcessedSchoolMetrics(SCHOOLS);'),
    'auto restore should detect split cloud payloads that have rows but missing school metrics'
);
assert.ok(
    /(?:const|let) shouldRecalculate = options\.recalculate !== false \|\| !hasProcessedSchools \|\| !hasProcessedSchoolMetrics;/.test(cohortDbCoreSource),
    'exam restore should recalculate when restored school metrics are missing even if school rosters exist'
);
assert.ok(
    appSource.includes('function normalizeStudentTotalsForCurrentConfig'),
    'score processing should normalize restored student totals to the active grade total-subject policy'
);
assert.ok(
    appSource.includes('const totalNormalization = normalizeStudentTotalsForCurrentConfig(RAW_DATA, SUBJECTS, CONFIG);'),
    'processData should repair stale cloud totals before thresholds and metrics are calculated'
);
assert.ok(
    parseRowsSource.includes('rowHasExplicitScoreEvidence')
        && parseRowsSource.includes('if (!nameStr && !idStr && !rowHasExplicitScoreEvidence) continue;'),
    'score import should preserve score-only rows by auto-generating a student name'
);

console.log('cloud workspace normalization tests passed');
