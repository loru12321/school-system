/**
 * test-high-school-line-sync.js
 *
 * Verifies the full save→cloud-payload→merge→backfill round-trip for
 * 中考高中过线分数 (highSchoolLine).
 *
 * Scenarios tested:
 * 1. hasPayloadIndicatorParams returns true when only highSchoolLine is set
 * 2. mergeIndicatorPayloadFields does NOT wipe a saved highSchoolLine when a
 *    supplement has empty ind1/ind2 (the original cross-device sync bug)
 * 3. Alias reads: graduateHighSchoolLine / highSchoolAdmissionLine /
 *    highSchoolScoreLine all normalise to the standard highSchoolLine field
 * 4. support-state-runtime normalizeIndicator preserves highSchoolLine across
 *    all alias names
 * 5. applySnapshotPayload backfills the dm_high_school_line_input DOM element
 * 6. 二模 / non-July exam keeps highSchoolAdmissionAllowed=false → 赋分 still 0
 */

const assert = require('assert');
const path = require('path');
const vm = require('vm');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// ─── Load cloud.js into a minimal Node.js context ────────────────────────────

const storage = {
    _store: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._store, k) ? this._store[k] : null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; }
};

const cloudWindow = {
    addEventListener() {},
    localStorage: storage,
    sessionStorage: storage,
    setTimeout(fn) { /* no-op for sync tests */ },
    clearTimeout() {},
    requestIdleCallback() {},
    CloudApi: {},
    sbClient: null,
    idbKeyval: null
};
const cloudContext = { window: cloudWindow, localStorage: storage, sessionStorage: storage, setTimeout() {}, console };
const cloudSource = fs.readFileSync(path.join(root, 'public/assets/js/cloud.js'), 'utf8');
vm.runInNewContext(cloudSource, cloudContext, { filename: 'cloud.js' });

const deps = cloudWindow.CloudWorkspaceRuntimeDeps;
assert.ok(deps, 'CloudWorkspaceRuntimeDeps must be exported by cloud.js');

const { hasPayloadIndicatorParams, mergeIndicatorPayloadFields, needsIndicatorPayloadSupplement } = deps;
assert.strictEqual(typeof hasPayloadIndicatorParams, 'function', 'hasPayloadIndicatorParams must be exported');
assert.strictEqual(typeof mergeIndicatorPayloadFields, 'function', 'mergeIndicatorPayloadFields must be exported');
assert.strictEqual(typeof needsIndicatorPayloadSupplement, 'function', 'needsIndicatorPayloadSupplement must be exported');

// ─── 1. hasPayloadIndicatorParams ────────────────────────────────────────────

// Only highSchoolLine set → must return true
assert.strictEqual(
    hasPayloadIndicatorParams({ INDICATOR_PARAMS: { ind1: '', ind2: '', highSchoolLine: '390' } }),
    true,
    'hasPayloadIndicatorParams: highSchoolLine alone must be considered populated'
);

// Legacy aliases must also satisfy the check
assert.strictEqual(
    hasPayloadIndicatorParams({ INDICATOR_PARAMS: { graduateHighSchoolLine: '390' } }),
    true,
    'hasPayloadIndicatorParams: graduateHighSchoolLine alias must be recognised'
);
assert.strictEqual(
    hasPayloadIndicatorParams({ INDICATOR_PARAMS: { highSchoolAdmissionLine: '390' } }),
    true,
    'hasPayloadIndicatorParams: highSchoolAdmissionLine alias must be recognised'
);
assert.strictEqual(
    hasPayloadIndicatorParams({ INDICATOR_PARAMS: { highSchoolScoreLine: '390' } }),
    true,
    'hasPayloadIndicatorParams: highSchoolScoreLine alias must be recognised'
);
assert.strictEqual(
    hasPayloadIndicatorParams({ INDICATOR_PARAMS: { 中考高中过线分数: '390' } }),
    true,
    'hasPayloadIndicatorParams: Chinese high-school line field must be recognised'
);

// All empty → must return false
assert.strictEqual(
    hasPayloadIndicatorParams({ INDICATOR_PARAMS: { ind1: '', ind2: '', highSchoolLine: '' } }),
    false,
    'hasPayloadIndicatorParams: all-empty params must return false'
);
assert.strictEqual(
    hasPayloadIndicatorParams({}),
    false,
    'hasPayloadIndicatorParams: missing INDICATOR_PARAMS must return false'
);

console.log('✅ 1. hasPayloadIndicatorParams — passed');

// ─── 2. mergeIndicatorPayloadFields does NOT clobber highSchoolLine ───────────

// Simulate device-B loading: payload has highSchoolLine=390, empty ind1/ind2;
// supplement (older exam) has ind1/ind2 set but empty highSchoolLine.
const basePayload = {
    INDICATOR_PARAMS: { ind1: '', ind2: '', highSchoolLine: '390' },
    TARGETS: {},
    SCHOOL_ALIAS_SETTINGS: []
};
const supplementPayload = {
    INDICATOR_PARAMS: { ind1: '222', ind2: '1353', highSchoolLine: '' },
    TARGETS: { '银山实验学校': { t1: 5, t2: 10 } },
    SCHOOL_ALIAS_SETTINGS: [{ canonical: '州城中学', alias: '州城一中' }]
};

const merged = mergeIndicatorPayloadFields(basePayload, supplementPayload);

// highSchoolLine must be preserved from base (not wiped by supplement)
assert.strictEqual(
    merged.INDICATOR_PARAMS.highSchoolLine,
    '390',
    'mergeIndicatorPayloadFields: existing highSchoolLine must NOT be overwritten by supplement'
);
// Empty ind1/ind2 in base should be back-filled from supplement
assert.strictEqual(merged.INDICATOR_PARAMS.ind1, '222', 'mergeIndicatorPayloadFields: empty ind1 must be filled from supplement');
assert.strictEqual(merged.INDICATOR_PARAMS.ind2, '1353', 'mergeIndicatorPayloadFields: empty ind2 must be filled from supplement');
// TARGETS and SCHOOL_ALIAS_SETTINGS from supplement should be applied (base was empty)
assert.ok(merged.TARGETS['银山实验学校'], 'mergeIndicatorPayloadFields: TARGETS from supplement must be applied when base is empty');
assert.ok(Array.isArray(merged.SCHOOL_ALIAS_SETTINGS) && merged.SCHOOL_ALIAS_SETTINGS.length > 0,
    'mergeIndicatorPayloadFields: SCHOOL_ALIAS_SETTINGS from supplement must be applied when base is empty');

// When base already has all three fields, supplement must not overwrite any
const fullBase = { INDICATOR_PARAMS: { ind1: '100', ind2: '200', highSchoolLine: '390' }, TARGETS: { A: { t1: 1, t2: 2 } }, SCHOOL_ALIAS_SETTINGS: [{}] };
const fullSupp = { INDICATOR_PARAMS: { ind1: '999', ind2: '888', highSchoolLine: '500' }, TARGETS: { B: {} }, SCHOOL_ALIAS_SETTINGS: [{}] };
const fullMerge = mergeIndicatorPayloadFields(fullBase, fullSupp);
assert.strictEqual(fullMerge.INDICATOR_PARAMS.ind1, '100', 'mergeIndicatorPayloadFields: existing ind1 must NOT be overwritten');
assert.strictEqual(fullMerge.INDICATOR_PARAMS.highSchoolLine, '390', 'mergeIndicatorPayloadFields: existing highSchoolLine must NOT be overwritten');

console.log('✅ 2. mergeIndicatorPayloadFields — passed (no clobber)');

// ─── 3. needsIndicatorPayloadSupplement: highSchoolLine-only payload is satisfied ─

// A payload with only highSchoolLine should NOT trigger supplement when TARGETS and aliases are present
const paramsOnlyPayload = {
    INDICATOR_PARAMS: { ind1: '', ind2: '', highSchoolLine: '390' },
    TARGETS: { '银山实验学校': { t1: 5, t2: 10 } },
    SCHOOL_ALIAS_SETTINGS: [{ canonical: '州城中学', alias: '州城一中' }]
};
assert.strictEqual(
    needsIndicatorPayloadSupplement(paramsOnlyPayload),
    false,
    'needsIndicatorPayloadSupplement: highSchoolLine-only payload with TARGETS and aliases must NOT need supplement'
);

const staleGrade9Payload = {
    CURRENT_EXAM_ID: '2022级-9年级-2025-2026-下学期-二模-2026-05-27',
    ARCHIVE_META: { grade: '9', year: '2025-2026', term: '下学期', examName: '二模' },
    INDICATOR_PARAMS: { ind1: '222', ind2: '1353', highSchoolLine: '' },
    TARGETS: { '银山实验学校': { t1: 5, t2: 10 } },
    SCHOOL_ALIAS_SETTINGS: [{ canonical: '州城中学', alias: '州城一中' }]
};
assert.strictEqual(
    needsIndicatorPayloadSupplement(staleGrade9Payload),
    true,
    'needsIndicatorPayloadSupplement: grade-9 payload with ind1/ind2 but missing highSchoolLine must refresh from cloud'
);

console.log('✅ 3. needsIndicatorPayloadSupplement — passed (no spurious supplement)');

// ─── 4. support-state-runtime normalizeIndicator ─────────────────────────────

const supportSource = fs.readFileSync(path.join(root, 'public/assets/js/support-state-runtime.js'), 'utf8');
const supportWindow = { SupportState: null };
const supportContext = { window: supportWindow, globalThis: supportWindow, module: { exports: {} }, require: () => ({}) };
vm.runInNewContext(supportSource, supportContext, { filename: 'support-state-runtime.js' });

const SupportState = supportWindow.SupportState;
assert.ok(SupportState, 'SupportState must be registered on window by support-state-runtime.js');

// Standard field
SupportState.setIndicator({ ind1: '222', ind2: '1353', highSchoolLine: '390' });
let ind = SupportState.getIndicator();
assert.strictEqual(ind.highSchoolLine, '390', 'support-state: standard highSchoolLine field must be preserved');

// Alias: graduateHighSchoolLine
SupportState.setIndicator({ ind1: '', ind2: '', graduateHighSchoolLine: '410' });
ind = SupportState.getIndicator();
assert.strictEqual(ind.highSchoolLine, '410', 'support-state: graduateHighSchoolLine alias must normalise to highSchoolLine');

// Alias: highSchoolAdmissionLine
SupportState.setIndicator({ ind1: '', ind2: '', highSchoolAdmissionLine: '420' });
ind = SupportState.getIndicator();
assert.strictEqual(ind.highSchoolLine, '420', 'support-state: highSchoolAdmissionLine alias must normalise to highSchoolLine');

// Alias: highSchoolScoreLine
SupportState.setIndicator({ ind1: '', ind2: '', highSchoolScoreLine: '430' });
ind = SupportState.getIndicator();
assert.strictEqual(ind.highSchoolLine, '430', 'support-state: highSchoolScoreLine alias must normalise to highSchoolLine');

// Chinese field name
SupportState.setIndicator({ ind1: '', ind2: '', 中考高中过线分数: '440' });
ind = SupportState.getIndicator();
assert.strictEqual(ind.highSchoolLine, '440', 'support-state: Chinese high-school line field must normalise to highSchoolLine');

// Round-trip: clearSupportState resets to empty string (not undefined)
SupportState.clearSupportState();
ind = SupportState.getIndicator();
assert.strictEqual(ind.highSchoolLine, '', 'support-state: cleared state must have empty string highSchoolLine');

console.log('✅ 4. support-state-runtime normalizeIndicator — passed');

// ─── 5. applySnapshotPayload backfills dm_high_school_line_input ─────────────
// (Structural contract check — verifying the snapshot code path exists)

const snapshotSource = fs.readFileSync(path.join(root, 'public/assets/js/snapshot-system-runtime.js'), 'utf8');
assert.ok(
    snapshotSource.includes("document.getElementById('dm_high_school_line_input')"),
    "snapshot-system-runtime: applySnapshotPayload must backfill 'dm_high_school_line_input'"
);
assert.ok(
    snapshotSource.includes("highSchoolLineInput.value = indicator.highSchoolLine"),
    'snapshot-system-runtime: applySnapshotPayload must write indicator.highSchoolLine into the input'
);

console.log('✅ 5. applySnapshotPayload DOM backfill — passed');

// ─── 6. 二模 / non-July exam: admission gate remains intact ──────────────────
// Verify the isHighSchoolAdmissionExamAllowed gating still exists in app.js /
// exam-analysis-package-runtime.js — we must not have accidentally removed it.

const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
assert.ok(
    appSource.includes('function isHighSchoolAdmissionExamAllowed'),
    'app.js: isHighSchoolAdmissionExamAllowed function must still exist (calculation gate)'
);
assert.ok(
    appSource.includes('isHighSchoolAdmissionExamAllowed()'),
    'app.js: isHighSchoolAdmissionExamAllowed() must still be called in the calculation path'
);

const pkgSource = fs.readFileSync(
    path.join(root, 'public/assets/js/exam-analysis-package-runtime.js'), 'utf8');
assert.ok(
    pkgSource.includes('isHighSchoolAdmissionExamAllowed') || pkgSource.includes('getHighSchoolAdmissionLine'),
    'exam-analysis-package-runtime: admission gate must still be applied in Excel export path'
);

// Verify this test itself was written after the known-good commit that added the
// export-side gate (b40a1b5f), so we confirm the existing regression guard is in place.
assert.ok(
    pkgSource.includes('typeof window.isHighSchoolAdmissionExamAllowed'),
    'exam-analysis-package-runtime: export-side gate must use typeof window.isHighSchoolAdmissionExamAllowed guard'
);

// The gate must be fail-CLOSED: when the gate function is unavailable the export
// has to return 0, not fall through to reading highSchoolLine. The old
// `typeof ... === 'function' && !allowed()` form skipped the gate entirely on a
// missing dependency, which is the same divergence the comment above warns about.
assert.ok(
    /typeof window\.isHighSchoolAdmissionExamAllowed !== 'function'\)\s*\{[\s\S]{0,240}?return 0;/.test(pkgSource),
    'exam-analysis-package-runtime: a missing admission gate must fail closed (return 0), never skip the gate'
);
assert.ok(
    !/typeof window\.isHighSchoolAdmissionExamAllowed === 'function'\s*\n?\s*&&\s*!window\.isHighSchoolAdmissionExamAllowed\(\)/.test(pkgSource),
    'exam-analysis-package-runtime: the fail-open guard form must not come back'
);

// ─── 7. 正式中考高中上线总分：五科 + 体育 ───────────────────────────────────

const admissionTotalBlock = appSource.match(
    /const GRADE9_ZHONGKAO_ADMISSION_SUBJECTS[\s\S]*?window\.getHighSchoolAdmissionTotal = getHighSchoolAdmissionTotal;/
);
assert.ok(admissionTotalBlock, 'app.js must expose the dedicated Grade 9 Zhongkao admission-total helper');
const admissionWindow = {};
vm.runInNewContext(admissionTotalBlock[0], { window: admissionWindow, Number, Object });
assert.strictEqual(typeof admissionWindow.getHighSchoolAdmissionTotal, 'function', 'admission-total helper must be callable by export and assessment runtimes');

const fullZhongkaoRow = {
    scores: { 语文: 110, 数学: 108, 英语: 105, 物理: 70, 化学: 45, 体育: 56, 政治: 49 }
};
assert.strictEqual(
    admissionWindow.getHighSchoolAdmissionTotal(fullZhongkaoRow),
    494,
    'admission total must include 体育 but exclude 政治'
);
assert.strictEqual(
    admissionWindow.getHighSchoolAdmissionTotal({ scores: { ...fullZhongkaoRow.scores, 体育: 0 } }),
    438,
    '体育 0 分 is a valid Zhongkao score and must not be treated as missing'
);
assert.strictEqual(
    admissionWindow.getHighSchoolAdmissionTotal({ scores: { 语文: 110, 数学: 108, 英语: 105, 物理: 70, 化学: 45 } }),
    null,
    'missing 体育 must fail closed instead of falling back to the five-subject total'
);
assert.strictEqual(
    admissionWindow.getHighSchoolAdmissionTotal({
        zhongkaoTotal: 503,
        scores: { 语文: 110, 数学: 108, 英语: 105, 物理: 70, 化学: 45, 政治: 49 }
    }),
    503,
    'an explicit 中考总分（含体育） must be used even when 体育 is not a separate column'
);
assert.ok(
    /getHighSchoolAdmissionTotal\(student\)/.test(pkgSource),
    'analysis package must use the same Zhongkao admission total as the web summary'
);
assert.ok(
    pkgSource.includes('高中上线率班级明细') && pkgSource.includes('buildHighSchoolAdmissionClassRows'),
    'analysis package must include a per-class admission sheet when the source contains classes'
);
assert.ok(
    appSource.includes('function handleHighSchoolAdmissionClick(schoolName)')
        && appSource.includes('data-drill="high-school-admission"')
        && appSource.includes('查看${escapeAppHtml(d.name)}各班高中上线情况'),
    'summary admission-score cell must open the selected school\'s per-class admission detail'
);
assert.ok(
    appSource.includes('const canCalculate = item.complete && allowed && line > 0;'),
    'class admission detail must show complete classes even when another class in the school has missing Zhongkao totals'
);
assert.ok(
    appSource.includes('function handleHighSchoolAdmissionClassClick(schoolName, className)')
        && appSource.includes('handleHighSchoolAdmissionClassClick(${jsStringLiteral(schoolName)}, ${jsStringLiteral(item.className)})')
        && appSource.includes('学生姓名')
        && appSource.includes('中考总分（含体育）'),
    'each class admission result must open the admitted student names and Zhongkao totals'
);
assert.ok(
    appSource.includes('Number(entry.total) >= line')
        && appSource.includes('classStats.entries'),
    'class admission student list must use the same Zhongkao admission total and line as the score calculation'
);
const assessmentSource = fs.readFileSync(path.join(root, 'public/assets/js/teaching-assessment-sync-runtime.js'), 'utf8');
assert.ok(
    assessmentSource.includes('isGrade9ZhongkaoExam(examContext, rows)')
        && assessmentSource.includes('getGrade9ZhongkaoAdmissionTotal(row)'),
    'teacher assessment preview must use the official Zhongkao-only admission total'
);
assert.ok(
    assessmentSource.includes('const directTotal = row?.zhongkaoTotal'),
    'teacher assessment fallback must retain a saved 中考总分 across runtime load order changes'
);

const parseRowsSource = fs.readFileSync(path.join(root, 'public/assets/js/parse-rows-runtime.js'), 'utf8');
assert.ok(
    parseRowsSource.includes('zhongkaoTotal: -1')
        && parseRowsSource.includes("['中考总分', '中考总成绩', '中招总分']")
        && parseRowsSource.includes('stu.zhongkaoTotal'),
    'score import must retain an explicit Zhongkao total separately from the five-subject total'
);
assert.ok(
    /skipHidden:\s*false/.test(appSource),
    'score import must explicitly read all worksheet rows regardless of Excel filters or hidden rows'
);

console.log('✅ 6. 二模 admission gate intact (fail-closed) — passed');
console.log('✅ 7. 正式中考高中上线总分（五科+体育）— passed');

// ─── 7. cloud-workspace-runtime hasWorkspaceIndicatorParams includes highSchoolLine ─

const workspaceSource = fs.readFileSync(
    path.join(root, 'public/assets/js/cloud-workspace-runtime.js'), 'utf8');
assert.ok(
    workspaceSource.includes('params.highSchoolLine')
        && workspaceSource.includes('params.graduateHighSchoolLine')
        && workspaceSource.includes('params.highSchoolAdmissionLine'),
    'cloud-workspace-runtime: hasWorkspaceIndicatorParams must include highSchoolLine in the check'
);
assert.ok(
    workspaceSource.includes("params.highSchoolScoreLine")
        && workspaceSource.includes("params['中考高中过线分数']"),
    'cloud-workspace-runtime: hasWorkspaceIndicatorParams must include all highSchoolLine aliases'
);
assert.ok(
    workspaceSource.includes('function hasWorkspaceHighSchoolLine(payload)')
        && workspaceSource.includes('function isGrade9WorkspacePayload(payload)')
        && workspaceSource.includes('(isGrade9WorkspacePayload(payload) && !hasWorkspaceHighSchoolLine(payload))'),
    'cloud-workspace-runtime: stale grade-9 workspace payload without highSchoolLine must require remote refresh'
);
assert.ok(
    workspaceSource.includes('cachedMeta.pendingCloudSync && !lastAppliedCachedNeedsIndicatorRefresh'),
    'cloud-workspace-runtime: pending local cache must not block remote refresh when highSchoolLine is missing'
);
assert.ok(
    workspaceSource.includes('zhongkaoTotal: row?.zhongkaoTotal'),
    'cloud-workspace-runtime: exam shards must preserve Zhongkao total for cross-device restore'
);
assert.ok(
    workspaceSource.includes('async function shouldDeferPendingWorkspaceFlush')
        && workspaceSource.includes('fetchWorkspaceSnapshotMeta(normalizedKey)')
        && workspaceSource.includes('return remoteTs <= localTs + 1000')
        && workspaceSource.includes('await shouldDeferPendingWorkspaceFlush(this, requestedKey, cachedMeta)')
        && workspaceSource.includes('await shouldDeferPendingWorkspaceFlush(this, key, cachedMeta)'),
    'cloud-workspace-runtime: pending local flush must compare remote/local timestamps before skipping foreground refresh'
);
assert.ok(
    workspaceSource.includes('const wouldEraseTargets = hasWorkspaceTargetConfig(remotePayload)')
        && workspaceSource.includes('const wouldEraseIndicator = hasWorkspaceIndicatorParams(remotePayload)')
        && workspaceSource.includes('已阻止云端覆盖：本地九年级指标配置为空'),
    'cloud-workspace-runtime must refuse to replace non-empty remote grade-9 support settings with an empty local payload'
);
assert.ok(
    !/function mergeWorkspaceSplitPayload[\s\S]*\[\s*[\s\S]*'TARGETS'[\s\S]*'INDICATOR_PARAMS'[\s\S]*'SCHOOL_ALIAS_SETTINGS'[\s\S]*\]\.forEach/.test(workspaceSource),
    'cloud-workspace-runtime: split exam shard merge must not let old exam config overwrite workspace TARGETS/INDICATOR_PARAMS/SCHOOL_ALIAS_SETTINGS'
);
assert.ok(
    !/function mergeWorkspaceSplitPayload[\s\S]*\[\s*[\s\S]*'TEACHER_MAP'[\s\S]*'TEACHER_SCHOOL_MAP'[\s\S]*\]\.forEach/.test(workspaceSource),
    'cloud-workspace-runtime: split exam shard merge must not let compact empty teacher maps overwrite workspace teacher maps'
);
assert.ok(
    workspaceSource.includes('teachingHistory: {')
        && workspaceSource.includes('...(metaDb.teachingHistory || {})')
        && workspaceSource.includes('...(currentDb.teachingHistory || {})'),
    'cloud-workspace-runtime: split exam shard merge must preserve workspace teachingHistory instead of replacing it with compact empty history'
);
assert.ok(
    workspaceSource.includes('payload = isSplitWorkspacePayload(payload)')
        && workspaceSource.includes('await hydrateSplitWorkspacePayload(key, payload)')
        && !workspaceSource.includes('let payload = parsePayload(data.content);\n                payload = normalizeWorkspacePayload(payload);'),
    'cloud-workspace-runtime: foreground cloud load must hydrate split workspace payload before applying it'
);

console.log('✅ 7. cloud-workspace-runtime highSchoolLine restore guards — passed');

// ─── 8. cloud.js exports normalizeIndicatorParams (new helper used in merge) ──

assert.ok(
    typeof deps.mergeIndicatorPayloadFields === 'function',
    'cloud.js: mergeIndicatorPayloadFields must be exported for use by workspace runtime'
);
assert.ok(
    cloudSource.includes('function normalizeTeacherSchoolMapForApply')
        && cloudSource.includes('!hasExplicitSchool && fallbackSchool && Object.keys(teacherMap).length')
        && cloudSource.includes('nextSchoolMap[key] = fallbackSchool'),
    'cloud.js: legacy teacher maps without TEACHER_SCHOOL_MAP must be restored as current-school teacher mappings'
);
assert.ok(
    cloudSource.includes('const payloadTeacherMap = payload?.TEACHER_MAP')
        && cloudSource.includes('existing.teacherMap = clonePayloadFragment(payloadTeacherMap)')
        && cloudSource.includes('db.teachingHistory[termId] = {'),
    'cloud.js: workspace-level TEACHER_MAP must seed empty current exam teacherMap and teachingHistory during restore'
);
assert.ok(
    cloudSource.includes('window.loadIndicatorSupportFromCloud = () =>')
        && cloudSource.includes('loadSnapshotPayloadByKey(`cohort::${cohortId}`)')
        && cloudSource.includes('BACKUP_cohort::${cohortId}_pre_split_%')
        && cloudSource.includes('payload = mergeIndicatorPayloadFields(payload, backupPayload)')
        && !/function ensureIndicatorWorkspaceFromCloud[\s\S]*loadCloudData\(\{ refresh: true \}\)/.test(appSource),
    'indicator support restore must use lightweight cohort metadata and the bounded pre-split backup instead of reapplying score snapshots'
);
assert.ok(
    cloudSource.includes('const preferredTeacherMap = preferredCurrentExamPayload.teacherMap')
        && cloudSource.includes('Object.keys(preferredTeacherMap).length > 0'),
    'cloud.js: empty compact exam teacherMap must not overwrite workspace-level TEACHER_MAP'
);

const cohortDbCoreSource = fs.readFileSync(
    path.join(root, 'public/assets/js/cohort-db-core-runtime.js'), 'utf8');
assert.ok(
    cohortDbCoreSource.includes('const examTeacherMap = exam.teacherMap')
        && cohortDbCoreSource.includes('Object.keys(examTeacherMap).length > 0')
        && !cohortDbCoreSource.includes('setTeacherMap(exam.teacherMap || {})'),
    'cohort-db-core-runtime: applyExamToWorkspace must preserve workspace teacher map when exam has no teacher map'
);

const cohortExamMetaSource = fs.readFileSync(
    path.join(root, 'public/assets/js/cohort-exam-meta-runtime.js'), 'utf8');
assert.ok(
    !/本地无 \$\{baseTerm\} 的任课数据[\s\S]*setTeacherMap\(\{\}\)[\s\S]*setTeacherSchoolMap\(\{\}\)/.test(cohortExamMetaSource),
    'cohort-exam-meta-runtime: missing local term history must not clear workspace teacher maps before cloud fallback'
);

console.log('✅ 8. cloud.js exports — passed');

// ─── 9. Explicit parameter saves must wait for cloud flush ──────────────────

const paramsRuntimeSource = fs.readFileSync(
    path.join(root, 'public/assets/js/data-manager-params-runtime.js'), 'utf8');
assert.ok(
    paramsRuntimeSource.includes("saveCloudData({ background: false, forceUpload: true, sourceLabel: 'params-save' })"),
    'parameter save must foreground-flush highSchoolLine to cloud before showing success'
);

const saveSyncSource = fs.readFileSync(
    path.join(root, 'public/assets/js/data-manager-save-sync-runtime.js'), 'utf8');
assert.ok(
    saveSyncSource.includes("saveCloudData({ background: false, forceUpload: true, sourceLabel: 'save-and-sync' })"),
    'save-and-sync must foreground-flush to cloud instead of only creating a background queue'
);

const coreRuntimeSource = fs.readFileSync(
    path.join(root, 'public/assets/js/data-manager-core-runtime.js'), 'utf8');
assert.ok(
    coreRuntimeSource.includes("saveCloudData({ background: false, forceUpload: true, sourceLabel: 'params-save' })"),
    'legacy data-manager params save must also foreground-flush highSchoolLine to cloud'
);

console.log('✅ 9. explicit cloud flush contract — passed');

console.log('\n✅ All highSchoolLine sync round-trip tests passed.');
