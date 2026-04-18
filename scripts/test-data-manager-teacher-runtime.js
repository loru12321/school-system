const assert = require('assert');
const path = require('path');

const createDataManagerTeacherRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-teacher-runtime.js'));

async function run() {
    let cohortIdSet = '';
    let syncedTerm = '';
    let loadedTeachers = 0;
    let setMapValue = null;
    let setSchoolMapValue = null;
    const toasts = [];

    const root = {
        UI: {
            toast(text, type) {
                toasts.push({ text, type });
            }
        },
        syncTeacherTermStorage(termId) {
            syncedTerm = String(termId || '');
            return { baseTermId: String(termId || '').split('_').slice(0, 2).join('_') };
        },
        writeWorkspaceCohortId(value) {
            cohortIdSet = String(value || '');
        },
        resolveTeacherHistoryEntry(termId) {
            if (String(termId || '').includes('2025-2026')) {
                return {
                    key: '2025-2026_上学期_9年级',
                    map: { '901_语文': '老师A' },
                    schoolMap: { '901_语文': '学校A' }
                };
            }
            return null;
        },
        setTeacherMap(value) {
            setMapValue = value;
        },
        setTeacherSchoolMap(value) {
            setSchoolMapValue = value;
        },
        CloudManager: {
            loadTeachers() {
                loadedTeachers += 1;
                return Promise.resolve(false);
            }
        },
        getPreferredTeacherTermId() {
            return '2025-2026_上学期_9年级';
        },
        buildTeacherTermId() {
            return '2025-2026_上学期_9年级';
        },
        getExamMetaFromUI() {
            return { termId: '2025-2026_上学期_9年级' };
        },
        CohortDB: {
            _db: {},
            ensure() {
                return this._db;
            }
        },
        TEACHER_MAP: { '901_语文': '老师A' },
        TEACHER_SCHOOL_MAP: { '901_语文': '学校A' },
        document: {
            getElementById(id) {
                if (id === 'teacher-analysis') {
                    return { classList: { contains: (name) => name === 'active' } };
                }
                return null;
            }
        },
        syncTeacherAnalysisSchoolContext() {},
        renderTeacherAnalysisState() {},
        updateStatusPanel() {}
    };

    const runtime = createDataManagerTeacherRuntime(root);
    let renderTeachersCount = 0;
    let refreshCount = 0;
    const manager = {
        renderTeachers() {
            renderTeachersCount += 1;
        },
        refreshTeacherAnalysis() {
            refreshCount += 1;
        }
    };

    runtime.switchTeacherTerm(manager, '2025-2026_上学期_9年级');
    assert.strictEqual(cohortIdSet, '2022');
    assert.strictEqual(syncedTerm, '2025-2026_上学期_9年级');
    assert.deepStrictEqual(setMapValue, { '901_语文': '老师A' });
    assert.deepStrictEqual(setSchoolMapValue, { '901_语文': '学校A' });
    assert.strictEqual(renderTeachersCount, 1);
    assert.strictEqual(refreshCount, 1);

    root.resolveTeacherHistoryEntry = () => null;
    runtime.switchTeacherTerm(manager, '2024-2025_下学期_8年级');
    assert.strictEqual(loadedTeachers, 1);
    assert.ok(toasts.some((item) => item.type === 'info'));

    runtime.syncTeacherHistory(manager, { termId: '2025-2026_上学期_9年级', timestamp: 123, source: 'local' });
    assert.ok(root.CohortDB._db.teachingHistory);
    assert.deepStrictEqual(root.CohortDB._db.teachingHistory['2025-2026_上学期_9年级'].map, { '901_语文': '老师A' });

    root.TEACHER_MAP = {};
    root.resolveTeacherHistoryEntry = () => ({
        key: '2025-2026_上学期_9年级',
        map: { '902_数学': '老师B' },
        schoolMap: { '902_数学': '学校A' }
    });
    const ensured = runtime.ensureTeacherMap(manager, false);
    assert.strictEqual(ensured, true);
    assert.deepStrictEqual(setMapValue, { '902_数学': '老师B' });

    let analysisSyncCount = 0;
    let analysisRenderCount = 0;
    let statusPanelCount = 0;
    root.syncTeacherAnalysisSchoolContext = () => { analysisSyncCount += 1; };
    root.renderTeacherAnalysisState = () => { analysisRenderCount += 1; };
    root.updateStatusPanel = () => { statusPanelCount += 1; };
    runtime.refreshTeacherAnalysis();
    assert.strictEqual(analysisSyncCount, 1);
    assert.strictEqual(analysisRenderCount, 1);
    assert.strictEqual(statusPanelCount, 1);

    console.log('data-manager-teacher-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
