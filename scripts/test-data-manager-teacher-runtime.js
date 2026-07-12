const assert = require('assert');
const path = require('path');

const createDataManagerTeacherRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-teacher-runtime.js'));
const fs = require('fs');
const coreSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/data-manager-core-runtime.js'), 'utf8');

assert.ok(
    coreSource.includes('const needsClassSchoolFallback = !inferredSchool')
        && coreSource.includes("} else if (inferredSchool) {")
        && coreSource.includes('? getClassSchoolMapForAllData()'),
    'teacher table should use the known local school before scanning all score rows for class ownership'
);

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
        readCurrentTeacherTermId() {
            return syncedTerm;
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

    root.TEACHER_MAP['901_语文'] = '手工修改后未被覆盖';
    const reusedCurrentTerm = runtime.switchTeacherTerm(manager, '2025-2026_上学期_9年级');
    assert.strictEqual(reusedCurrentTerm, true);
    assert.strictEqual(renderTeachersCount, 1);
    assert.strictEqual(refreshCount, 1);
    assert.strictEqual(root.TEACHER_MAP['901_语文'], '手工修改后未被覆盖');

    syncedTerm = '2025-2026_下学期_9年级';
    root.TEACHER_MAP = { '901_语文': '外部切换学期后的数据' };
    runtime.switchTeacherTerm(manager, '2025-2026_上学期_9年级');
    assert.deepStrictEqual(setMapValue, { '901_语文': '老师A' });
    assert.strictEqual(renderTeachersCount, 2);
    assert.strictEqual(refreshCount, 2);
    root.TEACHER_MAP = { '901_语文': '老师A' };

    root.resolveTeacherHistoryEntry = () => null;
    runtime.switchTeacherTerm(manager, '2024-2025_下学期_8年级');
    assert.strictEqual(loadedTeachers, 1);
    assert.ok(toasts.some((item) => item.type === 'info'));

    runtime.syncTeacherHistory(manager, { termId: '2025-2026_上学期_9年级', timestamp: 123, source: 'local' });
    assert.ok(root.CohortDB._db.teachingHistory);
    assert.deepStrictEqual(root.CohortDB._db.teachingHistory['2025-2026_上学期_9年级'].map, { '901_语文': '老师A' });
    const refreshCountBeforeDeferredHistory = refreshCount;
    runtime.syncTeacherHistory(manager, {
        termId: '2025-2026_下学期_9年级',
        timestamp: 456,
        source: 'cloud',
        deferAnalysis: true
    });
    assert.strictEqual(refreshCount, refreshCountBeforeDeferredHistory);
    assert.deepStrictEqual(root.CohortDB._db.teachingHistory['2025-2026_下学期_9年级'].map, { '901_语文': '老师A' });

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

    const oneSchoolImport = runtime.buildTeacherImportMaps([
        { key: '9.1_数学', teacher: '张老师', school: '银山实验学校' },
        { key: '9.1_数学', teacher: '张老师', school: '银山实验学校' },
        { key: '9.2_数学', teacher: '李老师', school: '银山实验学校' }
    ]);
    assert.strictEqual(oneSchoolImport.count, 2);
    assert.deepStrictEqual(oneSchoolImport.conflicts, []);
    assert.deepStrictEqual(oneSchoolImport.schoolMap, {
        '9.1_数学': '银山实验学校',
        '9.2_数学': '银山实验学校'
    });

    const multiSchoolCollision = runtime.buildTeacherImportMaps([
        { key: '9.1_数学', teacher: '张老师', school: '银山实验学校' },
        { key: '9.1_数学', teacher: '王老师', school: '第二实验学校' }
    ]);
    assert.strictEqual(multiSchoolCollision.conflicts.length, 1);
    assert.strictEqual(multiSchoolCollision.conflicts[0].key, '9.1_数学');
    assert.ok(runtime.formatTeacherImportConflictMessage(multiSchoolCollision.conflicts).includes('原有任课数据未被修改'));
    assert.ok(runtime.formatTeacherSchoolOwnershipConflictMessage('9.1_数学', '甲校', '乙校').includes('不能直接覆盖'));

    const conflictingTeacher = runtime.buildTeacherImportMaps([
        { key: '9.1_数学', teacher: '张老师', school: '银山实验学校' },
        { key: '9.1_数学', teacher: '王老师', school: '银山实验学校' }
    ]);
    assert.strictEqual(conflictingTeacher.conflicts.length, 1);

    const termContext = runtime.parseTeacherTermContext('2025-2026_下学期_9年级', 'fallback');
    assert.deepStrictEqual(termContext, {
        termId: '2025-2026_下学期_9年级',
        academicYear: '2025-2026',
        term: '下学期',
        grade: 9,
        cohortId: '2022',
        label: '2022届 · 2025-2026学年 · 下学期 · 9年级'
    });
    const importContext = runtime.summarizeTeacherImportContext([
        { key: '9.1_数学', teacher: '张老师', school: '银山实验学校' },
        { key: '9.2_语文', teacher: '李老师', school: '银山实验学校' }
    ], '2025-2026_下学期_9年级', '');
    assert.deepStrictEqual(importContext.detectedGrades, [9]);
    assert.deepStrictEqual(importContext.mismatchedGrades, []);
    assert.strictEqual(importContext.subjectCount, 2);
    assert.strictEqual(importContext.schoolCount, 1);

    const wrongGradeImport = runtime.summarizeTeacherImportContext([
        { key: '8.1_数学', teacher: '张老师', school: '银山实验学校' }
    ], '2025-2026_下学期_9年级', '');
    assert.deepStrictEqual(wrongGradeImport.mismatchedGrades, [8]);

    console.log('data-manager-teacher-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
