const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexSource = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
const authLoginSource = fs.readFileSync(path.join(root, 'public/assets/js/auth-login-runtime.js'), 'utf8');
const cohortDbSource = fs.readFileSync(path.join(root, 'public/assets/js/cohort-db-core-runtime.js'), 'utf8');
const cohortExamMetaSource = fs.readFileSync(path.join(root, 'public/assets/js/cohort-exam-meta-runtime.js'), 'utf8');
const cloudSource = fs.readFileSync(path.join(root, 'public/assets/js/cloud.js'), 'utf8');
const dataCloudSource = fs.readFileSync(path.join(root, 'public/assets/js/data-cloud-runtime.js'), 'utf8');
const cloudWorkspaceSource = fs.readFileSync(path.join(root, 'public/assets/js/cloud-workspace-runtime.js'), 'utf8');
const snapshotSystemSource = fs.readFileSync(path.join(root, 'public/assets/js/snapshot-system-runtime.js'), 'utf8');
const examAnalysisPackageSource = fs.readFileSync(path.join(root, 'public/assets/js/exam-analysis-package-runtime.js'), 'utf8');
const smokeSource = fs.readFileSync(path.join(root, 'scripts/smoke-all-modules.js'), 'utf8');

assert.ok(
    /function showCohortPicker\(\)[\s\S]*CohortManager\.addCohort\(\{ year, startGrade: 6 \}, \{\s*skipConfirm: true,\s*fastEnter: true,\s*requireCloudData: false\s*\}\)/.test(cohortExamMetaSource),
    'automatic cohort picker entry should fast-enter from local data and hydrate cloud data in the background'
);

assert.ok(
    /async function enterCohortFromMask\(options = \{\}\)[\s\S]*const entered = await CohortManager\.addCohort\(\{ year, startGrade \}, \{\s*skipConfirm: true,\s*fastEnter: options\.fastEnter !== false,\s*requireCloudData: options\.requireCloudData === true\s*\}\);[\s\S]*return entered !== false;/.test(cohortExamMetaSource),
    'login-selected cohort entry should return whether the target cohort was actually entered'
);

assert.ok(
    /if \(options\.requireCloudData === true\) \{[\s\S]*setManualCohortSelectionGate\(true\);[\s\S]*return false;[\s\S]*\}\s*clearDataRuntimeState\(\);/.test(appSource),
    'cloud-required cohort entry should stop before creating an empty workspace when restore fails'
);

assert.ok(
    authLoginSource.includes('const clearRuntimeForSelectedLoginCohort = (cohortId) =>')
        && authLoginSource.includes('currentProjectKey: `cohort::${normalizedCohortId}`')
        && authLoginSource.includes("currentExamId: ''")
        && authLoginSource.includes('cohortDb: null')
        && authLoginSource.includes('clearDataRuntimeState()')
        && authLoginSource.includes("CURRENT_EXAM_ID = '';")
        && authLoginSource.includes('COHORT_DB = null;'),
    'login-selected cohort entry should clear stale runtime exam/data before restoring the target cohort'
);

assert.ok(
    /const selectedCohortReady = await pendingLoginCohortEntry;[\s\S]*if \(selectedCohortReady\) \{[\s\S]*tryResumeReadyWorkspace\(\);[\s\S]*\} else \{[\s\S]*setManualCohortSelectionGate\(true\);[\s\S]*showCohortPicker/.test(authLoginSource),
    'failed selected-cohort cloud restore should not fall back to the previous cached workspace'
);

assert.ok(
    /function requestCohortSwitchRuntime\(cohortId, switchOptions\) \{[\s\S]*typeof window\.switchCohort === 'function'[\s\S]*__PENDING_COHORT_SWITCH_QUEUE__[\s\S]*return requestCohortSwitchRuntime\(cohortId, switchOptions\);/.test(cohortExamMetaSource)
        && appSource.includes('window.switchCohort = switchCohort;')
        && appSource.includes('function flushPendingCohortSwitches()')
        && appSource.includes('window.__flushPendingCohortSwitches = flushPendingCohortSwitches;'),
    'selected login cohort should fast-enter through a guarded early-runtime bridge until app switchCohort is ready'
);

assert.ok(
    /else if \(options\.fastEnter === true\) \{\s*setCohortSyncStatus\('local'/.test(appSource),
    'fast-enter cohort switching must leave the top sync chip in local/background mode instead of staying stuck in syncing'
);

assert.ok(
    appSource.includes('const preserveTeacherState = !!previousCohortId && previousCohortId === targetCohortId;')
        && appSource.includes('if (!preserveTeacherState) {')
        && appSource.includes('const restoredTeacherMap = data.TEACHER_MAP && Object.keys(data.TEACHER_MAP).length')
        && appSource.includes(': preservedTeacherMap;')
        && appSource.includes('const liveTeacherMap = preserveTeacherState ? { ...(readTeacherMap() || {}) } : {};')
        && appSource.includes('const fallbackTeacherMap = Object.keys(liveTeacherMap).length > 0 ? liveTeacherMap : preservedTeacherMap;')
        && appSource.includes('Object.keys(readTeacherMap() || {}).length === 0')
        && appSource.includes('setTeacherMap(fallbackTeacherMap);')
        && appSource.includes("CloudManager.loadTeachers({ background: true, force: true, toast: false, blocking: false })"),
    'same-cohort background restore must not erase an already loaded teacher assignment map when the cloud snapshot omits it'
);

assert.ok(
    authLoginSource.includes('const hasSessionUser = !!(window.AuthState')
        && authLoginSource.includes('const shouldShowLogin = !!visible || !hasSessionUser;')
        && authLoginSource.includes("document.body.dataset.authState = shouldShowLogin ? 'logged_out' : 'logged_in';"),
    'login overlay state must fail closed and keep the app hidden when no authenticated session exists'
);

assert.ok(
    appSource.includes('function enforceLoggedOutShellGate()')
        && appSource.includes("sessionStorage.getItem('EDGE_GATEWAY_TOKEN_V1')")
        && appSource.includes("app.classList.add('hidden');")
        && appSource.includes("window.addEventListener('load', runLoggedOutGate, { once: true });")
        && appSource.includes('setTimeout(runLoggedOutGate, 16000);'),
    'logged-out shell gate should re-hide the app even if another startup branch exposes it'
);

const bootSource = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');
assert.ok(
    bootSource.includes('function hasBootAuthenticatedSession()')
        && bootSource.includes("sessionStorage.getItem('EDGE_GATEWAY_TOKEN_V1')")
        && bootSource.includes('const shouldShowLogin = !!visible || !hasBootAuthenticatedSession();')
        && bootSource.includes('clearStaleBootSession();'),
    'boot login shell must require a real token and fail closed instead of exposing stale admin sessions'
);

assert.ok(
    cloudSource.includes("raw.startsWith('LZB64|')") && cloudSource.includes("return 'LZB64|' + LZString.compressToBase64(json);"),
    'workspace cloud payloads should use the smaller LZB64 format while keeping legacy LZ reads'
);

assert.ok(
    /const transientKeys = new Set\(\['_tempRank'\]\);[\s\S]*if \(!reservedKeys\.has\(key\) && !transientKeys\.has\(key\)\) extras\[key\] = clonePayloadFragment\(row\[key\]\);/.test(cloudSource),
    'packed student rows should not persist transient calculation fields such as _tempRank'
);

assert.ok(
    cloudSource.includes('compactStudentExtras(extras, subjects, PACKED_T_SCORE_SCALE)')
        && cloudSource.includes('next.tScores = subjects.map((subject) =>')
        && cloudSource.includes('restoreStudentExtrasFromPacked(extras, subjects, scale)')
        && cloudSource.includes('extras.tScores = tScores;'),
    'packed student rows should store tScores as subject-aligned arrays and restore them as objects'
);

assert.ok(
    cloudSource.includes('const PACKED_T_SCORE_SCALE = 10;')
        && cloudSource.includes('tScoreScale: PACKED_T_SCORE_SCALE,')
        && cloudSource.includes('scalePackedScoreValue(extras.totalTScore, PACKED_T_SCORE_SCALE)')
        && cloudSource.includes('scalePackedScoreValue(value, scale)')
        && cloudSource.includes('restorePackedScoreValue(value, scale)')
        && cloudSource.includes('const scale = Number(packedRows.tScoreScale) || 1;')
        && cloudSource.includes('row.totalTScore = restorePackedScoreValue(entry[11], scale);'),
    'packed student rows should store one-decimal tScores and totalTScore as scaled integers with a compatible scale marker'
);

assert.ok(
    cloudSource.includes('const totalTScore = typeof extras.totalTScore === \'number\'')
        && cloudSource.includes('delete next.totalTScore;')
        && cloudSource.includes('delete next.hasValidScore;')
        && cloudSource.includes('delete next.examRoom;')
        && cloudSource.includes('delete next.countyScope;')
        && cloudSource.includes('row.totalTScore = restorePackedScoreValue(entry[11], scale);')
        && cloudSource.includes("row.examRoom = restoredExtras.examRoom || '-';")
        && cloudSource.includes('row.hasValidScore = Object.values(row.scores || {}).some((value) => typeof value === \'number\' && Number.isFinite(value));')
        && cloudSource.includes("row.countyScope = row.townshipRank ? 'township' : 'county';"),
    'packed student rows should omit default/derivable extras and restore them after load'
);

assert.ok(
    cloudSource.includes('nextExam.schools = shrinkSchoolMapForStorage(nextExam.schools);')
        && cloudSource.includes('next.SCHOOLS = shrinkSchoolMapForStorage(next.SCHOOLS);')
        && /function shrinkSchoolMapForStorage\(schoolMap\) \{[\s\S]*if \(key === 'students'\) return;/.test(cloudSource),
    'cloud snapshots should preserve calculated school metrics without duplicating student rows'
);

assert.ok(
    dataCloudSource.includes("parsed.startsWith('LZB64|')") && dataCloudSource.includes('root.LZString.compressToBase64'),
    'data cloud runtime should read and write the smaller LZB64 payload format'
);

assert.ok(
    dataCloudSource.includes("getLocalCacheStorageKey(key, '_meta')")
        && dataCloudSource.includes("readSystemDataRecord(examKey, 'updated_at')")
        && dataCloudSource.includes('isLocalCacheFresh(localMeta, remoteUpdatedAt)')
        && dataCloudSource.includes("readSystemDataRecord(normalizedKey, 'content,updated_at')"),
    'split workspace restore should reuse fresh local exam shards before downloading large cloud content'
);

assert.ok(
    cloudWorkspaceSource.includes('readCachedWorkspaceSnapshotMeta(exactKey)')
        && cloudWorkspaceSource.includes("fetchWorkspaceSnapshotRow(currentExamKey, { preferCache: true })")
        && cloudWorkspaceSource.includes('isCachedWorkspaceSnapshotFresh(cachedMeta, remoteUpdatedAt)')
        && cloudWorkspaceSource.includes("updatedAt: String(meta.updatedAt || meta.updated_at || new Date().toISOString()).trim()"),
    'cloud workspace split restore should reuse fresh local exam shards before downloading large cloud content'
);

const supplementPolicyMatch = cloudSource.match(/function needsIndicatorPayloadSupplement\(payload\) \{([\s\S]*?)\n    \}/);
assert.ok(supplementPolicyMatch, 'cloud runtime should expose the workspace supplement policy');
assert.ok(
    !supplementPolicyMatch[1].includes('hasPayloadAliasSettings'),
    'missing school aliases alone must not download and inflate historical exam snapshots during cold login'
);
assert.ok(
    snapshotSystemSource.includes('DataManager.syncSchoolAliasSettingsFromGateway().catch'),
    'school aliases should refresh through the lightweight gateway path after snapshot apply'
);

assert.ok(
    !indexSource.includes('id="cloud-manager-modal"')
        && indexSource.includes('id="data-manager-modal"')
        && indexSource.includes('class="dm-cloud-category-tabs"')
        && indexSource.includes('onclick="DataManager.closeCloudManager()"'),
    'the cloud header entry should reuse the existing tabbed data manager instead of a duplicate modal shell'
);

assert.ok(
    /id="cloud-filter-current"\s+onchange=/.test(indexSource)
        && !/id="cloud-filter-current"\s+checked/.test(indexSource),
    'cloud data management should show all user-visible snapshots by default instead of silently limiting the list to the current workspace'
);
assert.ok(
    fs.readFileSync(path.join(root, 'public/assets/js/data-cloud-runtime.js'), 'utf8')
        .includes("const select = 'key, created_at, updated_at, size_bytes';"),
    'cloud snapshot metadata queries should include stored byte sizes for the list summary'
);
assert.ok(
    fs.readFileSync(path.join(root, 'public/assets/js/data-cloud-runtime.js'), 'utf8')
        .includes("{ kind: 'exam' }")
        && fs.readFileSync(path.join(root, 'public/assets/js/data-cloud-runtime.js'), 'utf8')
            .includes("{ kind: 'workspace' }")
        && fs.readFileSync(path.join(root, 'public/assets/js/data-manager-core-runtime.js'), 'utf8')
            .includes("if (/^STUDENT_HISTORY_V1_/i.test(text)) return 'student-history';"),
    'the default cloud list should query user-visible snapshots without exposing internal student history index rows'
);

assert.ok(
    /openCloudManager: function \(\) \{[\s\S]*this\.open\('cloud'\);/.test(fs.readFileSync(path.join(root, 'public/assets/js/data-manager-core-runtime.js'), 'utf8'))
        && !fs.readFileSync(path.join(root, 'public/assets/js/data-manager-core-runtime.js'), 'utf8').includes('mountCloudAreaInCloudManager')
        && !fs.readFileSync(path.join(root, 'public/assets/js/data-manager-core-runtime.js'), 'utf8').includes('body.appendChild(cloudArea)'),
    'the cloud manager should keep the large cloud table in its original tab and never move its DOM subtree'
);
assert.ok(
    /closeCloudManager: function \(\) \{[\s\S]*dataManagerModal\.style\.display = 'none'/.test(fs.readFileSync(path.join(root, 'public/assets/js/data-manager-core-runtime.js'), 'utf8')),
    'cloud manager close should explicitly hide the shared data manager modal'
);

assert.ok(
    /CohortDB\.applyExamToWorkspace\(COHORT_DB\.currentExamId, \{\s*renderTables: false,\s*recalculate: false\s*\}\)/.test(appSource),
    'cold cohort restore should reuse persisted processed metrics and only recalculate when the metric guard finds them unusable'
);
assert.ok(
    /CohortDB\.applyExamToWorkspace\(autoExamId, \{\s*renderTables: false,\s*recalculate: false\s*\}\)/.test(cohortExamMetaSource),
    'automatic exam fallback should reuse persisted processed metrics instead of blocking the post-login main thread'
);
assert.ok(
    /CohortDB\.applyExamToWorkspace\(window\.COHORT_DB\.currentExamId, \{\s*renderTables: false,\s*recalculate: false\s*\}\)/.test(snapshotSystemSource),
    'snapshot apply should avoid a duplicate full recompute when its processed metrics are already usable'
);

assert.ok(
    /const payload = parsePayload\(row\.content\);[\s\S]*writeCachedWorkspaceSnapshot\(row\.key, payload, \{ updatedAt: row\.updated_at \}\)/.test(cloudWorkspaceSource),
    'cohort exam background sync should persist downloaded exam shards into the shared local cache'
);

assert.ok(
    (cloudWorkspaceSource.match(/fetchCohortExamsToLocal\(cohortId, \{ background: true, latestOnly: true, minCount: 1 \}\)/g) || []).length >= 3
        && (appSource.match(/latestOnly: true,\s*minCount: 1,/g) || []).length >= 4,
    'automatic startup hydration should keep only the current exam hot; history remains an on-demand module fetch'
);

assert.ok(
    /if \(!appliedCached\) \{[\s\S]*const row = await fetchWorkspaceSnapshotRow\(key\);[\s\S]*return true;[\s\S]*\}\s*const remoteMeta = await fetchWorkspaceSnapshotMeta\(key\);/.test(cloudWorkspaceSource),
    'cold workspace restore should skip the separate updated_at preflight and fetch the small split metadata row directly'
);

assert.ok(
    /function compactExamMetadata\(examId, examPayload = \{\}\) \{[\s\S]*if \(field === 'data' \|\| field === 'schools' \|\| field === 'teacherMap'\) return;[\s\S]*\}/.test(cloudWorkspaceSource)
        && /const compactExam = compactExamMetadata\(exactExamId, \{[\s\S]*\.\.\.exam,[\s\S]*data: compactRows[\s\S]*\}\);[\s\S]*shard\.COHORT_DB\.exams = \{ \[exactExamId\]: compactExam \};/.test(cloudWorkspaceSource),
    'exam shards should keep row data only at the top level and avoid duplicating it inside COHORT_DB.exams'
);

assert.ok(
    /function buildWorkspaceSplitUploadBundle\(workspaceKey, payload\) \{[\s\S]*const metaPayload = buildWorkspaceMetaPayload\(payload, workspaceKey\);[\s\S]*const metaContent = packPayload\(metaPayload\);[\s\S]*examRows\.push\(\{ key: exactExamId, content: packPayload\(shard\), shard \}\);/.test(cloudWorkspaceSource),
    'future cohort workspace uploads should automatically split the light cohort meta row from exam detail shards'
);

assert.ok(
    /function buildWorkspaceMetaPayload\(payload, workspaceKey\) \{[\s\S]*if \(WORKSPACE_META_ONLY_FIELDS\.has\(field\)\) delete source\[field\];[\s\S]*source\.__CLOUD_WORKSPACE_SPLIT_VERSION = WORKSPACE_SPLIT_VERSION;[\s\S]*source\.__CURRENT_EXAM_KEY = source\.CURRENT_EXAM_ID;/.test(cloudWorkspaceSource),
    'future cohort meta rows should omit large runtime fields and point to the current exam shard'
);

assert.ok(
    /function compactSchoolMetricsForShard\(schoolMap\) \{[\s\S]*if \(field === 'students'\) return;/.test(cloudWorkspaceSource)
        && cloudWorkspaceSource.includes('SCHOOLS: processedSchools,')
        && cloudWorkspaceSource.includes('compactExam.schools = clonePayloadFragment(processedSchools);'),
    'exam shards should retain calculated school metrics without duplicating student arrays'
);

assert.ok(
    /function compactExamMetadata\(examId, examPayload = \{\}\) \{[\s\S]*if \(field === 'data' \|\| field === 'schools' \|\| field === 'teacherMap'\) return;[\s\S]*if \(rowCount\) next\.rowCount = rowCount;/.test(cloudWorkspaceSource),
    'future exam shard metadata should preserve row counts without duplicating student rows'
);

assert.ok(
    /const rows = \[[\s\S]*\{ key: bundle\.workspaceKey, content: bundle\.metaContent, updated_at: syncedAt \},[\s\S]*\.\.\.bundle\.examRows\.map\(row => \(\{ key: row\.key, content: row\.content, updated_at: syncedAt \}\)\)[\s\S]*\];/.test(cloudWorkspaceSource),
    'future cloud saves should upload the cohort meta key and exam keys as separate system_data rows'
);

assert.ok(
    snapshotSystemSource.includes('function getSnapshotPayloadCohortId(db)')
        && snapshotSystemSource.includes('blocked cross-cohort snapshot apply')
        && snapshotSystemSource.includes('return false;')
        && snapshotSystemSource.includes('return true;'),
    'snapshot restores should reject cross-cohort payloads before they can overwrite the active workspace'
);

assert.ok(
    /applyExamToWorkspace: function \(examId, options = \{\}\) \{[\s\S]*const examCohortId = inferCohortIdFromValue\(examId\)[\s\S]*blocked cross-cohort exam apply[\s\S]*return false;/.test(cohortDbSource),
    'applying an exam batch to the workspace should reject exam IDs from another cohort'
);

assert.ok(
    cohortExamMetaSource.includes('function getExplicitCohortSelection()')
        && /if \(explicitSelection && current === explicitSelection && restoreActiveCohortUI\(current\)\) \{[\s\S]*rememberUserCohort\(current\);[\s\S]*return;[\s\S]*\}/.test(cohortExamMetaSource)
        && cohortExamMetaSource.includes('if (explicitSelection && saved !== explicitSelection)'),
    'login-selected cohorts should take precedence over stale saved cohort preferences'
);

assert.ok(
    /function getRuntimeCohortGuardId\(\) \{[\s\S]*window\.__LOCKED_LOGIN_COHORT_ID__[\s\S]*sessionStorage\.getItem\('LOCKED_LOGIN_COHORT_ID'\)[\s\S]*getExplicitCohortSelection/.test(appSource),
    'runtime cohort guard should prefer the active locked cohort over a stale hidden login selection'
);

assert.ok(
    appSource.includes('function persistSchoolAliasSettingsLocal()')
        && appSource.includes("localStorage.setItem('CUSTOM_SCHOOL_ALIAS_SETTINGS'")
        && appSource.includes('window.persistSchoolAliasSettingsLocal = window.persistSchoolAliasSettingsLocal || persistSchoolAliasSettingsLocal;'),
    'cohort switching should have a local school-alias persistence fallback before optional normalization runtime loads'
);

assert.ok(
    /const currentExamCohortId = normalizeCompareCohortId\(currentExamId\);[\s\S]*const targetCohortId = normalizeCompareCohortId\(cohortId\);[\s\S]*const readyDataMatchesTarget = !!targetCohortId && !!currentExamCohortId && currentExamCohortId === targetCohortId;[\s\S]*if \(current === cohortKey && currentExamId && hasReadyData && readyDataMatchesTarget\)/.test(appSource),
    'cohort switching should not early-return when the loaded exam still belongs to another cohort'
);

assert.ok(
    /async function switchCohort\(cohortId, options = \{\}\) \{[\s\S]*if \(!cohortId\) return;[\s\S]*lockRuntimeCohortId\(cohortId\);[\s\S]*const cohortKey = getAppCohortKey\(cohortId\);/.test(appSource),
    'direct cohort switches should refresh the runtime cohort guard before restoring target cloud data'
);

assert.ok(
    /switchTo: function \(cohortId, options = \{\}\) \{[\s\S]*lockRuntimeCohortId\(cohortId\);[\s\S]*CURRENT_EXAM_ID = '';[\s\S]*window\.CURRENT_EXAM_ID = '';[\s\S]*currentExamId: '',/.test(cohortExamMetaSource),
    'manual cohort switching should clear the previous exam before syncing the target cohort identity'
);

assert.ok(
    /COHORT_DB = data\.COHORT_DB \|\| null;[\s\S]*CURRENT_EXAM_ID = persistWorkspaceExamIdentity\(data\.CURRENT_EXAM_ID \|\| COHORT_DB\?\.currentExamId \|\| '', COHORT_DB,[\s\S]*cohortId: CURRENT_COHORT_ID \|\| cohortId,[\s\S]*sync: false/.test(appSource),
    'cohort restores should persist the current exam id even when split workspace meta omits the top-level exam id'
);

assert.ok(
    appSource.includes('function persistWorkspaceExamIdentity(examId, db = COHORT_DB, options = {})')
        && appSource.includes('window.persistWorkspaceExamIdentity = window.persistWorkspaceExamIdentity || persistWorkspaceExamIdentity;')
        && cohortExamMetaSource.includes('if (!persistWorkspaceExamIdentity(preferredExamId, db, { cohortId: normalizedCohortId })) return false;')
        && cohortExamMetaSource.includes('if (!persistWorkspaceExamIdentity(autoExamId, db, { cohortId: normalizedCohortId })) return false;'),
    'auto restored exams should update CURRENT_EXAM_ID, localStorage, and COHORT_DB through one guarded persistence path'
);

assert.ok(
    /if \(!readWorkspaceExamId\(\) && Array\.isArray\(RAW_DATA\) && RAW_DATA\.length > 0\) \{[\s\S]*const fallbackExamId = getAutoRestoreExamId\(COHORT_DB, CURRENT_COHORT_ID \|\| cohortId\);[\s\S]*persistWorkspaceExamIdentity\(fallbackExamId, COHORT_DB, \{ cohortId: CURRENT_COHORT_ID \|\| cohortId \}\);/.test(appSource),
    'project snapshot restores with rows but an empty current exam should infer and persist a cohort-local exam id'
);

assert.ok(
    smokeSource.includes('window.__resolveSmokeRuntimeExamId')
        && smokeSource.includes('window.COHORT_DB?.currentExamId'),
    'smoke cohort readiness should accept runtime or COHORT_DB exam ids instead of only localStorage'
);

assert.ok(
    smokeSource.includes('function resolveSmokeRuntimeExamId(cohortId = \'\')')
        && smokeSource.includes('window.getAutoRestoreExamId(db, normalizedCohortId)')
        && smokeSource.includes('Object.entries(db?.exams || {})')
        && smokeSource.includes('window.__resolveSmokeRuntimeExamId = resolveSmokeRuntimeExamId;'),
    'smoke readiness should infer a cohort-local exam id when raw rows are restored before CURRENT_EXAM_ID'
);

assert.ok(
    smokeSource.includes('function resolveSmokeRuntimeTermId(examId = \'\')')
        && smokeSource.includes('window.getTermId(examMeta)')
        && smokeSource.includes('window.__resolveSmokeRuntimeTermId = resolveSmokeRuntimeTermId;'),
    'smoke app readiness should infer CURRENT_TERM_ID from restored exam metadata or exam key'
);

assert.ok(
    cloudWorkspaceSource.includes('const loadedKeys = [];')
        && cloudWorkspaceSource.includes('if (loadedCount > beforeCount) loadedKeys.push(row.key);')
        && cloudWorkspaceSource.includes('function promoteCachedCohortExamIfMissing(db, cid, candidateKeys = [])')
        && cloudWorkspaceSource.includes('if (typeof window.persistWorkspaceExamIdentity === \'function\')')
        && cloudWorkspaceSource.includes('promoteCachedCohortExamIfMissing(db, cid, candidates.map(row => row.key));')
        && cloudWorkspaceSource.includes('promoteCachedCohortExamIfMissing(db, cid, loadedKeys.length ? loadedKeys : candidates.map(row => row.key));'),
    'exam snapshot restore should promote cached or loaded latest exams to current when the workspace has no current exam id'
);

assert.ok(
    !cloudWorkspaceSource.includes('root.persistWorkspaceExamIdentity'),
    'cloud workspace runtime should use the browser global instead of an undefined root variable'
);

assert.ok(
    appSource.includes('blocked stale local backup restore')
        && appSource.includes('const backupCohortId = getSnapshotPayloadCohortId(backup);')
        && appSource.includes('const activeCohortId = getExplicitCohortSelection() || CURRENT_COHORT_ID || readWorkspaceCohortId();'),
    'local backup restore should not overwrite an explicitly selected active cohort'
);

assert.ok(
    appSource.includes('[DataRuntime] blocked cross-cohort data write')
        && appSource.includes('const incomingRows = patch.rawData ?? patch.RAW_DATA;')
        && appSource.includes('const incomingCohortId = getSnapshotPayloadCohortId({'),
    'low-level data writes should reject score rows from a different active cohort'
);

assert.ok(
    examAnalysisPackageSource.includes('function currentExamMatchesActiveCohort()')
        && examAnalysisPackageSource.includes('if (!currentExamMatchesActiveCohort()) return {};')
        && examAnalysisPackageSource.includes('getEffectiveCohortGrade(examMeta)')
        && examAnalysisPackageSource.includes('currentExamMatchesActiveCohort() ? (configName.match')
        && examAnalysisPackageSource.includes("if (!currentExamMatchesActiveCohort()) return DEFAULT_EXAM_DATE;")
        && examAnalysisPackageSource.includes('const source = currentExamMatchesActiveCohort()'),
    'exam analysis package labels should ignore stale cross-cohort exam/config state'
);

assert.ok(
    cloudWorkspaceSource.includes('function workspaceKeyMatchesCurrentCohort(key)')
        && cloudWorkspaceSource.includes('if (key && !workspaceKeyMatchesCurrentCohort(key)) return false;')
        && cloudWorkspaceSource.includes('if (applied === false) return false;'),
    'cloud workspace loads should drop stale cross-cohort requests and respect rejected snapshot applies'
);

assert.ok(
    cloudWorkspaceSource.includes('const allowCrossCohort = options.allowCrossCohort === true;')
        && cloudWorkspaceSource.includes('const initialCurrentCohortId = getCurrentCohortId();')
        && cloudWorkspaceSource.includes('const currentCohortBeforeApply = getCurrentCohortId();')
        && cloudWorkspaceSource.includes('staleCohort: true'),
    'cohort exam history sync should skip stale cross-cohort background tasks before they mutate the active workspace'
);

console.log('cohort entry cloud restore tests passed');
