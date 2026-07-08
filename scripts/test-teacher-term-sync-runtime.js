const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const cohortExamMeta = read('public/assets/js/cohort-exam-meta-runtime.js');
const cloud = read('public/assets/js/cloud.js');
const dataManagerCore = read('public/assets/js/data-manager-core-runtime.js');
const teacherSync = read('public/assets/js/teacher-sync-runtime.js');

assert.ok(
  cohortExamMeta.includes('function isTeacherTermSelectActive(selectEl)')
    && cohortExamMeta.includes("teacherArea.style.display === 'none'")
    && cohortExamMeta.includes('teacherArea.getClientRects().length === 0'),
  'teacher term preference should ignore hidden DataManager teacher term select values'
);

assert.ok(
  cloud.includes('function isTeacherTermSelectActive(selectEl)')
    && cloud.includes("teacherArea.style.display === 'none'")
    && cloud.includes('teacherArea.getClientRects().length === 0'),
  'CloudManager teacher key/load paths should also ignore hidden DataManager teacher term select values'
);

assert.ok(
  /function promptTeacherSyncIfNeeded\(\)[\s\S]*if \(!shouldAutoLoadTeacherData\(\)\) return false;[\s\S]*applyTeacherTermWithoutPrompt\(pickAutoTeacherTerm\(\)\)/.test(teacherSync)
    && /async function tryAutoRestoreTeacherMap\(\)[\s\S]*const preferredTerm = getPreferredTeacherTermId\(\) \|\| '';/.test(teacherSync),
  'teacher auto-restore must not apply an old history term before confirming the active module should load teachers'
);

assert.ok(
  cohortExamMeta.includes('function readArchiveExamMetaForTeacherTerm()')
    && cohortExamMeta.includes('function getTeacherTermMetaFromRuntime()')
    && /function getPreferredTeacherTermId\(\)[\s\S]*const uiMeta = getTeacherTermMetaFromRuntime\(\)/.test(cohortExamMeta)
    && /function getTeacherTermCandidates\(termId\)[\s\S]*const uiMeta = getTeacherTermMetaFromRuntime\(\)/.test(cohortExamMeta),
  'teacher term preference should use the active archive exam meta when form controls or saved terms are stale'
);

assert.ok(
  /function getPreferredTeacherTermId\(\)[\s\S]*selectedTeacherTermId[\s\S]*\|\| uiTeacherTermId[\s\S]*\|\| readCurrentTeacherTermId\(\)/.test(cohortExamMeta),
  'current exam teacher term should outrank stale CURRENT_TEACHER_TERM_ID when the teacher tab is not active'
);

assert.ok(
  /\[\s*preferred,\s*uiTeacherTermId,\s*savedTeacherTermId,\s*getTeacherTermBase\(preferred\),\s*getTeacherTermBase\(uiTeacherTermId\),\s*getTeacherTermBase\(savedTeacherTermId\),\s*savedBaseTerm\s*\]\.forEach\(pushUnique\)/.test(cohortExamMeta),
  'teacher term candidates should prefer the current exam-derived term before saved stale terms'
);

assert.ok(
  cloud.includes('const preferredTeacherTermId = typeof window.getPreferredTeacherTermId === \'function\'')
    && /const termId = explicitTermId[\s\S]*\|\| selectedTeacherTermId[\s\S]*\|\| preferredTeacherTermId[\s\S]*\|\| exactUiTeacherTerm[\s\S]*\|\| getCurrentTeacherTermId\(\)/.test(cloud),
  'CloudManager teacher keys should prefer the current exam teacher term before stale saved terms'
);
assert.ok(
  cloud.includes('const explicitTermId = options && typeof options === \'object\' ? String(options.termId || \'\').trim() : \'\'')
    && /const termId = explicitTermId[\s\S]*\|\| selectedTeacherTermId[\s\S]*\|\| preferredTeacherTermId/.test(cloud)
    && cloud.includes('const key = this.getTeacherKey(opts)')
    && cloud.includes('const schoolKey = this.getTeacherKey({ ...opts, schoolName: getCurrentSchoolName() })'),
  'CloudManager.saveTeachers should write to the explicit upload termId when one is passed'
);

assert.ok(
  /const desiredTerms = \[\s*selectedTeacherTermId,\s*preferredTeacherTermId,\s*exactUiTeacherTerm,\s*getCurrentTeacherTermId\(\),\s*getCurrentTermId\(\)\s*\]/.test(cloud),
  'CloudManager teacher load fallback order should try current exam term before stale saved terms'
);
assert.ok(
  cloud.includes('const primaryDesiredTerms = [')
    && cloud.includes('const metaMatchesDesiredTerm = primaryDesiredTerms.some')
    && cloud.includes('const currentApplyTerms = [')
    && cloud.includes('const metaMatchesCurrentTerm = currentApplyTerms.some')
    && cloud.includes('const applyTermId = metaMatchesCurrentTerm')
    && cloud.includes(': (currentApplyTerms[0] || primaryDesiredTerms[0] || desiredTerms[0] || keyTermId)')
    && cloud.includes('const localApplyTermId = applyTermId || localEntry.key || keyTermId')
    && cloud.includes('applyLoadedTeacherPayload(payload.map, payload.schoolMap, applyTermId || keyTermId'),
  'CloudManager.loadTeachers may reuse fallback teacher payloads but must keep the current desired teacher term'
);

assert.ok(
  dataManagerCore.includes('const termId = getPreferredTeacherTermId() || buildTeacherTermId(getExamMetaFromUI()) || readCurrentTermId()'),
  'teacher upload should save under the preferred exact teacher term, not only the base current term'
);

assert.ok(
  dataManagerCore.includes("DataManager.syncTeacherHistory({ termId, source: 'upload' })")
    && dataManagerCore.includes('CloudManager.saveTeachers({ termId })'),
  'teacher upload should pass the same resolved termId through local history and cloud teacher save'
);

const dataCloud = read('public/assets/js/data-cloud-runtime.js');
assert.ok(
  dataCloud.includes('const teacherHasBaseline = !!teacherBaselineSignature && !!teacherBaselineTerm')
    && dataCloud.includes('&& !!teacherSnapshot.termId')
    && dataCloud.includes('teacherBaselineTerm === teacherSnapshot.termId'),
  'teacher sync status must not report synced when the saved baseline or current snapshot has no termId'
);

const snapshotRuntime = read('public/assets/js/snapshot-system-runtime.js');
assert.ok(
  snapshotRuntime.includes('function resolveSnapshotTeacherMaps')
    && snapshotRuntime.includes('Object.keys(window.TEACHER_MAP).length > 0')
    && snapshotRuntime.includes('db.COHORT_DB?.teachingHistory || COHORT_DB?.teachingHistory')
    && snapshotRuntime.includes('baseTerms.includes(getSnapshotTeacherTermBase(text))')
    && snapshotRuntime.includes('const resolvedTeachers = resolveSnapshotTeacherMaps(db, incomingTeacherMap, incomingTeacherSchoolMap)'),
  'workspace snapshot apply should preserve or backfill teacher maps when a newer cloud payload has empty TEACHER_MAP'
);
assert.ok(
  snapshotRuntime.includes('const snapshotHasTeacherMap')
    && snapshotRuntime.includes("currentTeacherTermId: snapshotHasTeacherMap ? (db.CURRENT_TEACHER_TERM_ID || readCurrentTeacherTermId()) : readCurrentTeacherTermId()"),
  'workspace snapshot apply should not overwrite the current teacher term with an empty teacher snapshot'
);

// ─── Behavioral: buildWorkspaceMetaPayload bundles compatible teachingHistory ──
// Save-side fix (direction 2): when a teacher map is loaded at save time, the
// workspace meta payload must carry a same-cohort + same-grade teachingHistory
// so a later restore resolves it locally (no live TEACHERS_* round-trip), while
// keeping the current exam term intact (never writing an old semester back).
const vm = require('vm');

const behaviorStorage = {
  _s: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; }
};
const behaviorWindow = {
  addEventListener() {},
  localStorage: behaviorStorage,
  sessionStorage: behaviorStorage,
  setTimeout() {},
  clearTimeout() {},
  requestIdleCallback() {},
  CloudApi: {},
  sbClient: null,
  idbKeyval: null
};
const behaviorCtx = { window: behaviorWindow, localStorage: behaviorStorage, sessionStorage: behaviorStorage, setTimeout() {}, clearTimeout() {}, console };

// 1. Default (production-like) context must NOT expose the test hooks. Simulate a
//    normal visit with no test switch and a production-looking location.
const prodWindow = {
  addEventListener() {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  sessionStorage: behaviorStorage,
  setTimeout() {}, clearTimeout() {}, requestIdleCallback() {},
  location: { search: '', hostname: 'schoolsystem.com.cn' },
  CloudApi: {}, sbClient: null, idbKeyval: null
};
const prodCtx = { window: prodWindow, localStorage: prodWindow.localStorage, sessionStorage: behaviorStorage, setTimeout() {}, clearTimeout() {}, console };
vm.runInNewContext(read('public/assets/js/cloud.js'), prodCtx, { filename: 'cloud.js' });
vm.runInNewContext(read('public/assets/js/cloud-workspace-runtime.js'), prodCtx, { filename: 'cloud-workspace-runtime.js' });
assert.ok(!prodWindow.__CloudWorkspaceRuntimeTestHooks,
  'production visit (no test switch) must NOT expose __CloudWorkspaceRuntimeTestHooks');

// 2. With the explicit test switch on, the hooks become available.
behaviorWindow.__SCHOOL_SYSTEM_TEST_MODE__ = true;
vm.runInNewContext(read('public/assets/js/cloud.js'), behaviorCtx, { filename: 'cloud.js' });
vm.runInNewContext(read('public/assets/js/cloud-workspace-runtime.js'), behaviorCtx, { filename: 'cloud-workspace-runtime.js' });

const hooks = behaviorWindow.__CloudWorkspaceRuntimeTestHooks;
assert.ok(hooks && typeof hooks.buildWorkspaceMetaPayload === 'function',
  'cloud-workspace-runtime must expose buildWorkspaceMetaPayload test hook when test switch is on');

const savePayload = {
  CURRENT_COHORT_ID: '2022',
  CURRENT_PROJECT_KEY: 'cohort::2022',
  CURRENT_EXAM_ID: '2022级_9年级_2025-2026_下学期_二模_2026-05-27',
  CURRENT_TEACHER_TERM_ID: '2025-2026_下学期_9年级',
  CURRENT_TERM_ID: '9年级_下学期',
  ARCHIVE_META: { year: '2025-2026', term: '下学期', grade: '9', cohortId: '2022' },
  INDICATOR_PARAMS: { ind1: '222', ind2: '1353', highSchoolLine: '390' },
  // Loaded roster is compatible 上学期 content, currently displayed under 下学期.
  TEACHER_MAP: { '9.1_语文': '张老师', '9.2_数学': '李老师' },
  TEACHER_SCHOOL_MAP: { '9.1_语文': '银山实验学校', '9.2_数学': '银山实验学校' },
  COHORT_DB: {
    cohortId: '2022',
    currentExamId: '2022级_9年级_2025-2026_下学期_二模_2026-05-27',
    exams: {},
    teachingHistory: {
      '2025-2026_上学期_9年级': { map: { '9.1_语文': '张老师' }, schoolMap: { '9.1_语文': '银山实验学校' }, savedAt: 1000 },
      '2025-2026_下学期_8年级': { map: { '8.1_语文': '王老师' }, schoolMap: {}, savedAt: 900 },
      '2021-2022_下学期_9年级': { map: { '9.1_语文': '赵老师' }, schoolMap: {}, savedAt: 800 }
    }
  }
};

const meta = hooks.buildWorkspaceMetaPayload(savePayload, 'cohort::2022');
const metaHistory = (meta && meta.COHORT_DB && meta.COHORT_DB.teachingHistory) || {};

// 1. Current-term entry bundled with a non-empty map.
const currentEntry = metaHistory['2025-2026_下学期_9年级'];
assert.ok(currentEntry && currentEntry.map && Object.keys(currentEntry.map).length === 2,
  'buildWorkspaceMetaPayload must bundle the loaded teacher map under the current exam term');

// 2. Same-cohort + same-grade compatible history retained.
assert.ok(metaHistory['2025-2026_上学期_9年级'],
  'buildWorkspaceMetaPayload must keep same-cohort same-grade compatible teachingHistory');

// 3. Other grade / other cohort dropped.
assert.ok(!metaHistory['2025-2026_下学期_8年级'],
  'buildWorkspaceMetaPayload must drop other-grade teachingHistory');
assert.ok(!metaHistory['2021-2022_下学期_9年级'],
  'buildWorkspaceMetaPayload must drop other-cohort teachingHistory');

// 4. Current term semantics preserved — no 上学期 written into current-term fields.
assert.strictEqual(meta.CURRENT_TEACHER_TERM_ID, '2025-2026_下学期_9年级',
  'buildWorkspaceMetaPayload must not rewrite CURRENT_TEACHER_TERM_ID to an old semester');
assert.strictEqual(meta.CURRENT_TERM_ID, '9年级_下学期',
  'buildWorkspaceMetaPayload must not rewrite CURRENT_TERM_ID to an old semester');

// 5. highSchoolLine survives in the meta payload.
assert.strictEqual(meta.INDICATOR_PARAMS.highSchoolLine, '390',
  'buildWorkspaceMetaPayload must preserve highSchoolLine=390');

// 6. Derive helper returns the current exam term, never a compatible old term.
assert.strictEqual(hooks.deriveBundleCurrentTeacherTermId(savePayload), '2025-2026_下学期_9年级',
  'deriveBundleCurrentTeacherTermId must return the current exam teacher term');

console.log('workspace meta teachingHistory bundle tests passed');

console.log('teacher term sync runtime tests passed');
