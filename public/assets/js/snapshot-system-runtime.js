// snapshot-system-runtime.js — Snapshot payload, auto-snapshot, applySnapshotPayload, saveProjectSnapshot (extracted from app.js)
function getCurrentSnapshotPayload() {
    window.getCurrentSnapshotPayload = getCurrentSnapshotPayload;
    const workspaceSnapshot = readWorkspaceSnapshot();
    const ExamStateRuntime = window.ExamState || null;
    const examSnapshot = ExamStateRuntime && typeof ExamStateRuntime.snapshotExamState === 'function'
        ? ExamStateRuntime.snapshotExamState()
        : {
            archiveMeta: readArchiveMeta(),
            currentTermId: readCurrentTermId(),
            currentTeacherTermId: readCurrentTeacherTermId(),
            archiveLocked: readArchiveLockState().locked,
            archiveLockedKey: readArchiveLockState().lockedKey
        };
    return {
        CURRENT_PROJECT_KEY: workspaceSnapshot.currentProjectKey || '',
        COHORT_DB: workspaceSnapshot.cohortDb || null,
        CURRENT_COHORT_ID: workspaceSnapshot.currentCohortId || '',
        CURRENT_COHORT_META: workspaceSnapshot.currentCohortMeta || null,
        CURRENT_EXAM_ID: workspaceSnapshot.currentExamId || '',
        CURRENT_TERM_ID: examSnapshot.currentTermId || '',
        CURRENT_TEACHER_TERM_ID: examSnapshot.currentTeacherTermId || '',
        ARCHIVE_META: examSnapshot.archiveMeta || null,
        ARCHIVE_LOCKED: examSnapshot.archiveLocked ? 'true' : 'false',
        ARCHIVE_LOCKED_KEY: examSnapshot.archiveLockedKey || '',
        RAW_DATA: readRawData(),
        SCHOOLS: readSchools(),
        SUBJECTS: readSubjects(),
        THRESHOLDS: readThresholds(),
        TEACHER_MAP: window.TEACHER_MAP || {},
        TEACHER_SCHOOL_MAP: window.TEACHER_SCHOOL_MAP || {},
        CONFIG: readConfigState(),
        MY_SCHOOL: readCurrentSchool(),
        TARGETS: readTargetsState(),
        INDICATOR_PARAMS: readIndicatorState(),
        SCHOOL_ALIAS_SETTINGS: readSchoolAliasState(),
        PREV_DATA: readPrevDataState(),
        PROGRESS_CACHE: readProgressCacheState(),
        PROGRESS_CACHE_FULL: readProgressCacheFullState(),
        MANUAL_ID_MAPPINGS: readManualIdMappingsState(),
        LAST_VA_DATA: readLastVaDataState(),
        VA_VIEW_MODE: readProgressViewModeState(),
        __PROGRESS_QUICK_MODE: readProgressQuickModeState(),
        CURRENT_REPORT_STUDENT: readCurrentReportStudentState(),
        CURRENT_CONTEXT_STUDENTS: readCurrentContextStudentsState(),
        TEACHER_STATS: window.TEACHER_STATS || {},
        HISTORY_ARCHIVE: readHistoryArchiveState(),
        FB_CLASSES: readFbClassesState(),
        MP_SNAPSHOTS: readMpSnapshotsState(),
        FINGERPRINT: computeExamDataFingerprint(readRawData()),
        timestamp: new Date().getTime()
    };
}

function createAutoSnapshot(payload) {
    try {
        if (!payload) return;
        const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
        const item = {
            ts: Date.now(),
            key: String(payload.CURRENT_PROJECT_KEY || readWorkspaceProjectKey() || 'autosave_backup').trim(),
            data: "LZ|" + LZString.compressToUTF16(JSON.stringify(payload))
        };
        list.unshift(item);
        const trimmed = list.slice(0, 5);
        localStorage.setItem('AUTO_SNAPSHOTS', JSON.stringify(trimmed));
        renderAutoSnapshotsUI();
        updateExamHistoryStatusBar();
    } catch (e) {
        console.warn('自动快照失败:', e);
    }
}

function updateExamHistoryStatusBar() {
    const statusEl = document.getElementById('exam-history-status');
    if (!statusEl) return;

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : (window.COHORT_DB || null);
    const examCount = db?.exams ? Object.keys(db.exams).length : 0;

    const snapshots = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const latest = snapshots.reduce((acc, item) => {
        const ts = Number(item?.ts || 0);
        if (ts > acc.ts) {
            return { ts, key: (item?.key || '').trim() || '未知项目' };
        }
        return acc;
    }, { ts: 0, key: '' });

    const latestText = latest.ts > 0
        ? `${latest.key}（${new Date(latest.ts).toLocaleString('zh-CN')}）`
        : '无';
    statusEl.textContent = `历史考试: ${examCount} 期｜最近快照: ${latestText}`;
    if (typeof updateUploadWorkbenchStatus === 'function') updateUploadWorkbenchStatus();
}

function showMultiCompareDataSourceDiag() {
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId() || '(未选择届别)';
    const currentExamId = CURRENT_EXAM_ID || readWorkspaceExamId() || '(未设置当前考试)';
    const exams = Object.entries(db?.exams || {})
        .sort(compareExamRecordsByDateDesc)
        .map(([, exam]) => exam);

    const lines = exams.map((ex, idx) => {
        const id = ex?.examId || '(无ID)';
        const created = ex?.createdAt ? new Date(ex.createdAt).toLocaleString('zh-CN') : '未知时间';
        const count = Array.isArray(ex?.data) ? ex.data.length : 0;
        const tag = id === currentExamId ? '【当前】' : '';
        return `${idx + 1}. ${id}${tag}｜${created}｜数据${count}条`;
    });

    const summary = [
        `届别：${cohortId}`,
        `当前考试：${currentExamId}`,
        `历史考试总数：${exams.length}`,
        '',
        exams.length ? '历史考试明细：' : '历史考试明细：暂无',
        ...(exams.length ? lines : [])
    ].join('\n');

    if (window.Swal) {
        Swal.fire({
            title: '多期数据源诊断',
            html: `<pre style="text-align:left; white-space:pre-wrap; font-size:12px; line-height:1.7; color:#334155; margin:0;">${summary.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
            width: 760,
            confirmButtonText: '知道了',
            confirmButtonColor: '#0ea5e9'
        });
        return;
    }

    alert(summary);
}

function renderAutoSnapshotsUI() {
    const container = document.getElementById('auto-snapshot-list');
    if (!container) return;
    const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    if (list.length === 0) {
        container.innerHTML = '<div class="upload-inline-status upload-inline-status--block">暂无快照</div>';
        return;
    }
    container.innerHTML = list.map((item, idx) => {
        const time = new Date(item.ts).toLocaleString();
        return `<div class="auto-snapshot-card">
                <div class="auto-snapshot-copy">
                    <strong>⏱️ ${time}</strong>
                    <span>${item.key}</span>
                </div>
                <button class="btn btn-sm btn-gray" onclick="restoreAutoSnapshot(${idx})">回滚</button>
            </div>`;
    }).join('');
}

async function restoreAutoSnapshot(index) {
    if (!(await UI.confirm('确定回滚到该快照吗？当前未保存的修改将丢失。', {
        title: '回滚自动快照',
        confirmText: '回滚'
    }))) return;
    const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const item = list[index];
    if (!item || !item.data) return;
    try {
        let dataStr = item.data;
        if (typeof dataStr === 'string' && dataStr.startsWith('LZ|')) {
            dataStr = LZString.decompressFromUTF16(dataStr.substring(3));
        }
        const db = JSON.parse(dataStr);
        applySnapshotPayload(db);
        if (window.UI) UI.toast('✅ 已回滚到快照', 'success');
    } catch (e) {
        alert('回滚失败: ' + e.message);
    }
}

function restoreLatestAutoSnapshotDirect() {
    const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const item = list[0];
    if (!item || !item.data) return false;
    try {
        let dataStr = item.data;
        if (typeof dataStr === 'string' && dataStr.startsWith('LZ|')) {
            dataStr = LZString.decompressFromUTF16(dataStr.substring(3));
        }
        const db = JSON.parse(dataStr);
        applySnapshotPayload(db);
        updateExamHistoryStatusBar();
        if (window.UI) UI.toast('✅ 已从最近自动快照恢复历史考试数据', 'success');
        return true;
    } catch (e) {
        console.error('最近快照恢复失败:', e);
        if (window.UI) UI.toast('❌ 最近快照恢复失败：' + e.message, 'error');
        return false;
    }
}

async function promptHistoryRecoveryIfEmpty() {
    return;
    const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId() || '';
    if (!cohortId) return;

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const hasHistory = !!(db?.exams && Object.keys(db.exams).length > 0);
    if (hasHistory) return;

    const guardKey = `HISTORY_EMPTY_PROMPTED_${cohortId}`;
    if (sessionStorage.getItem(guardKey) === '1') return;
    sessionStorage.setItem(guardKey, '1');

    const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const hasSnapshots = list.length > 0;

    if (!window.Swal) {
        if (hasSnapshots && await UI.confirm('⚠️ 检测到当前届别历史考试为空。\n是否一键回滚最近自动快照进行恢复？', {
            title: '历史考试为空',
            confirmText: '恢复最近快照'
        })) {
            restoreLatestAutoSnapshotDirect();
            if (typeof CohortDB !== 'undefined') CohortDB.renderExamList();
        }
        return;
    }

    Swal.fire({
        title: '⚠️ 历史考试为空',
        html: hasSnapshots
            ? '<div style="text-align:left; font-size:13px; color:#475569; line-height:1.8;">检测到当前届别没有历史考试记录。<br>可尝试一键回滚最近自动快照恢复历史数据。</div>'
            : '<div style="text-align:left; font-size:13px; color:#475569; line-height:1.8;">检测到当前届别没有历史考试记录。<br>且本地暂无自动快照可恢复，请检查云端项目键或重新导入。</div>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: hasSnapshots ? '一键恢复最近快照' : '知道了',
        cancelButtonText: '暂不处理',
        confirmButtonColor: '#0ea5e9'
    }).then(r => {
        if (!r.isConfirmed) return;
        if (!hasSnapshots) return;
        const ok = restoreLatestAutoSnapshotDirect();
        if (ok && typeof CohortDB !== 'undefined') CohortDB.renderExamList();
    });
}

function getSnapshotPayloadCohortId(db) {
    if (!db || typeof db !== 'object') return '';
    return normalizeCompareCohortId(
        db.CURRENT_COHORT_ID
        || db.COHORT_DB?.cohortId
        || (typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(db.CURRENT_EXAM_ID) : '')
        || (typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(db.CURRENT_PROJECT_KEY) : '')
        || ''
    );
}

function getSnapshotTeacherTermBase(termId) {
    if (typeof getTeacherTermBase === 'function') {
        try { return String(getTeacherTermBase(termId) || '').trim(); } catch (e) { }
    }
    const text = String(termId || '').trim();
    const parts = text.split('_').filter(Boolean);
    if (parts.length >= 2 && /^\d{4}-\d{4}$/.test(parts[0])) return parts.slice(0, 2).join('_');
    return text;
}

function cloneSnapshotTeacherObject(value) {
    if (!value || typeof value !== 'object') return {};
    try { return JSON.parse(JSON.stringify(value)); } catch (e) { return { ...value }; }
}

function resolveSnapshotTeacherMaps(db = {}, incomingMap = {}, incomingSchoolMap = {}) {
    if (incomingMap && typeof incomingMap === 'object' && Object.keys(incomingMap).length > 0) {
        return {
            map: incomingMap,
            schoolMap: incomingSchoolMap && typeof incomingSchoolMap === 'object' ? incomingSchoolMap : {},
            termId: db.CURRENT_TEACHER_TERM_ID || ''
        };
    }

    if (window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' && Object.keys(window.TEACHER_MAP).length > 0) {
        return {
            map: cloneSnapshotTeacherObject(window.TEACHER_MAP),
            schoolMap: cloneSnapshotTeacherObject(window.TEACHER_SCHOOL_MAP || {}),
            termId: readCurrentTeacherTermId()
        };
    }

    const history = db.COHORT_DB?.teachingHistory || COHORT_DB?.teachingHistory || {};
    const candidates = [];
    const pushUnique = (value) => {
        const text = String(value || '').trim();
        if (text && !candidates.includes(text)) candidates.push(text);
    };
    const preferred = typeof getPreferredTeacherTermId === 'function' ? getPreferredTeacherTermId() : '';
    [
        db.CURRENT_TEACHER_TERM_ID,
        preferred,
        readCurrentTeacherTermId(),
        db.CURRENT_TERM_ID,
        readCurrentTermId(),
        getSnapshotTeacherTermBase(db.CURRENT_TEACHER_TERM_ID),
        getSnapshotTeacherTermBase(preferred)
    ].forEach(pushUnique);

    const baseTerms = [...new Set(candidates.map(getSnapshotTeacherTermBase).filter(Boolean))];
    Object.keys(history || {}).forEach((key) => {
        const text = String(key || '').trim();
        if (!text || candidates.includes(text)) return;
        if (baseTerms.includes(getSnapshotTeacherTermBase(text))) pushUnique(text);
    });

    for (const key of candidates) {
        const entry = history[key];
        const map = entry?.map && typeof entry.map === 'object' ? entry.map : (entry || {});
        if (map && typeof map === 'object' && Object.keys(map).length > 0) {
            const schoolMap = entry?.schoolMap && typeof entry.schoolMap === 'object' ? entry.schoolMap : {};
            return {
                map: cloneSnapshotTeacherObject(map),
                schoolMap: cloneSnapshotTeacherObject(schoolMap),
                termId: key
            };
        }
    }

    return { map: {}, schoolMap: {}, termId: db.CURRENT_TEACHER_TERM_ID || '' };
}

function runSnapshotPostApplyRender() {
    try { if (typeof renderTables === 'function') renderTables(); } catch (e) { }
    try { if (typeof updateSchoolSelect === 'function') updateSchoolSelect(); } catch (e) { }
    try { if (typeof renderAll === 'function') renderAll(); } catch (e) { }
    try {
        if (typeof DataManager !== 'undefined' && typeof DataManager.renderSchoolAliasMappings === 'function') {
            DataManager.renderSchoolAliasMappings();
        }
        if (typeof DataManager !== 'undefined' && typeof DataManager.syncSchoolAliasSettingsFromGateway === 'function') {
            DataManager.syncSchoolAliasSettingsFromGateway().catch(err => console.warn('[EdgeGateway] post-load alias refresh skipped:', err?.message || err));
        }
    } catch (e) { }
    try { updateExamHistoryStatusBar(); } catch (e) { }
    if (typeof DataManager !== 'undefined' && DataManager.renderHistoryPreview) DataManager.renderHistoryPreview();
}

function runSnapshotPostApplyLightRender() {
    try { if (typeof updateSchoolSelect === 'function') updateSchoolSelect(); } catch (e) { }
    try {
        if (typeof DataManager !== 'undefined' && typeof DataManager.renderSchoolAliasMappings === 'function') {
            DataManager.renderSchoolAliasMappings();
        }
        if (typeof DataManager !== 'undefined' && typeof DataManager.syncSchoolAliasSettingsFromGateway === 'function') {
            DataManager.syncSchoolAliasSettingsFromGateway().catch(err => console.warn('[EdgeGateway] post-load alias refresh skipped:', err?.message || err));
        }
    } catch (e) { }
    try { updateExamHistoryStatusBar(); } catch (e) { }
    if (typeof DataManager !== 'undefined' && DataManager.renderHistoryPreview) DataManager.renderHistoryPreview();
}

function scheduleSnapshotPostApplyRender() {
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleTask === 'function') {
        window.SystemPerformance.scheduleTask('snapshot-post-apply-light-render', runSnapshotPostApplyLightRender, { idle: true, timeout: 1800 });
        return;
    }
    setTimeout(runSnapshotPostApplyLightRender, 0);
}

function applySnapshotPayload(db, options = {}) {
    window.applySnapshotPayload = applySnapshotPayload;
    const incomingCohortId = getSnapshotPayloadCohortId(db);
    const currentCohortId = normalizeCompareCohortId(CURRENT_COHORT_ID || readWorkspaceCohortId() || '');
    if (!options.allowCrossCohort && incomingCohortId && currentCohortId && incomingCohortId !== currentCohortId) {
        console.warn('[WorkspaceRestore] blocked cross-cohort snapshot apply', {
            currentCohortId,
            incomingCohortId,
            currentExamId: CURRENT_EXAM_ID || readWorkspaceExamId() || '',
            incomingExamId: db?.CURRENT_EXAM_ID || ''
        });
        if (window.UI && typeof UI.toast === 'function') {
            UI.toast('已阻止其他届别数据覆盖当前工作区', 'warning');
        }
        return false;
    }
    COHORT_DB = db.COHORT_DB || COHORT_DB || null;
    CURRENT_COHORT_ID = db.CURRENT_COHORT_ID || CURRENT_COHORT_ID || '';
    CURRENT_COHORT_META = db.CURRENT_COHORT_META || CURRENT_COHORT_META || null;
    CURRENT_EXAM_ID = db.CURRENT_EXAM_ID || CURRENT_EXAM_ID || '';
    const snapshotHasTeacherMap = !!(db.TEACHER_MAP && typeof db.TEACHER_MAP === 'object' && Object.keys(db.TEACHER_MAP).length > 0);
    syncExamRuntimeState({
        currentTermId: db.CURRENT_TERM_ID || readCurrentTermId(),
        currentTeacherTermId: snapshotHasTeacherMap ? (db.CURRENT_TEACHER_TERM_ID || readCurrentTeacherTermId()) : readCurrentTeacherTermId(),
        archiveMeta: db.ARCHIVE_META || readArchiveMeta(),
        archiveLocked: String(db.ARCHIVE_LOCKED || '').trim() === 'true',
        archiveLockedKey: db.ARCHIVE_LOCKED_KEY || ''
    });
    syncWorkspaceRuntimeState({
        currentProjectKey: String(db.CURRENT_PROJECT_KEY || '').trim() || (CURRENT_COHORT_ID
            ? (typeof window.getCohortKey === 'function' ? window.getCohortKey(CURRENT_COHORT_ID) : `cohort::${CURRENT_COHORT_ID}`)
            : readWorkspaceProjectKey()),
        cohortDb: COHORT_DB,
        currentCohortId: CURRENT_COHORT_ID,
        currentCohortMeta: CURRENT_COHORT_META,
        currentExamId: CURRENT_EXAM_ID
    });
    if (readWorkspaceExamId()) {
        try {
            const meta = readArchiveMeta();
            const termId = getTermId(meta || {});
            if (termId) writeCurrentTermId(termId);
        } catch (e) { }
    }
    syncDataRuntimeState({
        rawData: db.RAW_DATA || [],
        schools: db.SCHOOLS || {},
        subjects: db.SUBJECTS || [],
        thresholds: db.THRESHOLDS || {},
        config: db.CONFIG || readConfigState()
    });
    const incomingTeacherMap = db.TEACHER_MAP && typeof db.TEACHER_MAP === 'object' ? db.TEACHER_MAP : {};
    const incomingTeacherSchoolMap = db.TEACHER_SCHOOL_MAP && typeof db.TEACHER_SCHOOL_MAP === 'object' ? db.TEACHER_SCHOOL_MAP : {};
    const resolvedTeachers = resolveSnapshotTeacherMaps(db, incomingTeacherMap, incomingTeacherSchoolMap);
    if (resolvedTeachers.termId && typeof syncTeacherTermStorage === 'function') {
        try { syncTeacherTermStorage(resolvedTeachers.termId); } catch (e) { }
    }
    setTeacherMap(resolvedTeachers.map || {});
    setTeacherSchoolMap(resolvedTeachers.schoolMap || {});
    writeCurrentSchool(db.MY_SCHOOL || '');
    if (Object.prototype.hasOwnProperty.call(db, 'TARGETS')) {
        setTargetsState(db.TARGETS || {});
    }
    setSchoolAliasState(Array.isArray(db.SCHOOL_ALIAS_SETTINGS) ? db.SCHOOL_ALIAS_SETTINGS : readSchoolAliasState());
    persistSchoolAliasSettingsLocal();
    if (db.INDICATOR_PARAMS) {
        const indicator = setIndicatorState(db.INDICATOR_PARAMS);
        const dm1 = document.getElementById('dm_ind1_input');
        const dm2 = document.getElementById('dm_ind2_input');
        const highSchoolLineInput = document.getElementById('dm_high_school_line_input');
        const main1 = document.getElementById('ind1');
        const main2 = document.getElementById('ind2');
        if (dm1) dm1.value = indicator.ind1;
        if (dm2) dm2.value = indicator.ind2;
        if (highSchoolLineInput) highSchoolLineInput.value = indicator.highSchoolLine || '';
        if (main1) main1.value = indicator.ind1;
        if (main2) main2.value = indicator.ind2;
    }
    if (db.PREV_DATA) setPrevDataState(db.PREV_DATA);
    syncProgressRuntimeState({
        progressCache: db.PROGRESS_CACHE || [],
        progressCacheFull: db.PROGRESS_CACHE_FULL || [],
        manualIdMappings: db.MANUAL_ID_MAPPINGS || {},
        lastVaData: db.LAST_VA_DATA || [],
        vaViewMode: Object.prototype.hasOwnProperty.call(db, 'VA_VIEW_MODE')
            ? db.VA_VIEW_MODE
            : readProgressViewModeState(),
        quickMode: Object.prototype.hasOwnProperty.call(db, '__PROGRESS_QUICK_MODE')
            ? db.__PROGRESS_QUICK_MODE
            : readProgressQuickModeState()
    });
    syncReportSessionRuntimeState({
        currentReportStudent: Object.prototype.hasOwnProperty.call(db, 'CURRENT_REPORT_STUDENT')
            ? (db.CURRENT_REPORT_STUDENT || null)
            : readCurrentReportStudentState(),
        currentContextStudents: Object.prototype.hasOwnProperty.call(db, 'CURRENT_CONTEXT_STUDENTS')
            ? (db.CURRENT_CONTEXT_STUDENTS || [])
            : readCurrentContextStudentsState()
    });
    if (Object.prototype.hasOwnProperty.call(db, 'TEACHER_STATS')) {
        setTeacherStats(db.TEACHER_STATS || {});
    }
    if (db.HISTORY_ARCHIVE) setHistoryArchiveState(db.HISTORY_ARCHIVE);
    if (db.FB_CLASSES) setFbClassesState(db.FB_CLASSES);
    if (db.MP_SNAPSHOTS) setMpSnapshotsState(db.MP_SNAPSHOTS);
    syncRuntimeStateToWindow();

    if (window.COHORT_DB && window.COHORT_DB.currentExamId) {
        try { CohortDB.applyExamToWorkspace(window.COHORT_DB.currentExamId, { renderTables: false }); } catch (e) { }
    }

    if (options.deferRender === true) scheduleSnapshotPostApplyRender();
    else runSnapshotPostApplyRender();
    closeBaseConfigGuardModalIfRecovered();
    flushDeferredGuardResume('snapshot');
    return true;
}
function getConfigTransferRuntime() {
    if (window.ConfigTransferRuntime) return window.ConfigTransferRuntime;
    return {
        downloadJson(data, options = {}) {
            const fileName = String(options.fileName || 'config.json').trim() || 'config.json';
            const space = typeof options.space === 'number' ? options.space : 2;
            const content = typeof data === 'string' ? data : JSON.stringify(data, null, space);
            const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            return fileName;
        },
        async readJson(file) {
            if (!file) throw new Error('未选择文件');
            const text = typeof file.text === 'function'
                ? await file.text()
                : await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result || ''));
                    reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
                    reader.readAsText(file, 'utf-8');
                });
            return JSON.parse(text);
        }
    };
}

function buildProjectSnapshotFileName() {
    const dateStr = new Date().toLocaleDateString('en-CA').replace(/\//g, '-');
    return `system-project-backup-${dateStr}.json`;
}

function markProjectFileBackupSaved(fileName) {
    localStorage.setItem('MANUAL_BACKUP_AT', new Date().toISOString());
    if (typeof logAction === 'function') logAction('文件备份', `已保存到 ${fileName}`);
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof updateUploadWorkbenchStatus === 'function') updateUploadWorkbenchStatus();
}

function saveProjectSnapshot() {
    const hasData = RAW_DATA.length > 0 || Object.keys(TEACHER_MAP).length > 0;
    const hasConfig = localStorage.getItem('app_skin_config');

    if (!hasData && !hasConfig) {
        return alert("当前系统为空，无需备份！");
    }

    const elInd1 = document.getElementById('ind1');
    const elInd2 = document.getElementById('ind2');
    const freshmanExamState = window.FreshmanExamRuntime || null;

    const snapshot = {
        meta: {
            version: "3.3",
            timestamp: new Date().toISOString(),
            desc: "全量备份(含指标参数)"
        },
        db: {
            CONFIG, MY_SCHOOL, RAW_DATA, SCHOOLS, SUBJECTS, THRESHOLDS,
            TARGETS, // 👈 确保这里包含目标人数对象
            TEACHER_MAP, TEACHER_STATS, TEACHER_TOWNSHIP_RANKINGS, TEACHER_STAMP_BASE64,
            PREV_DATA,
            PROGRESS_CACHE: readProgressCacheState(),
            PROGRESS_CACHE_FULL: readProgressCacheFullState(),
            MANUAL_ID_MAPPINGS: readManualIdMappingsState(),
            LAST_VA_DATA: readLastVaDataState(),
            VA_VIEW_MODE: readProgressViewModeState(),
            __PROGRESS_QUICK_MODE: readProgressQuickModeState(),
            CURRENT_REPORT_STUDENT: readCurrentReportStudentState(),
            CURRENT_CONTEXT_STUDENTS: readCurrentContextStudentsState(),
            MARGINAL_STUDENTS, POTENTIAL_STUDENTS_CACHE,
            MP_DATA_CACHE,
            FB_STUDENTS: freshmanExamState?.students || FB_STUDENTS,
            FB_CLASSES: typeof readFbClassesState === 'function' ? readFbClassesState() : FB_CLASSES,
            FB_SIMULATED_DATA: freshmanExamState?.simulatedData || FB_SIMULATED_DATA,
            EXAM_DATA: freshmanExamState?.examData || EXAM_DATA,
            EXAM_ROOMS: freshmanExamState?.examRooms || EXAM_ROOMS,
            AID_GROUPS_CACHE, HISTORY_ARCHIVE, ROLLER_COASTER_STUDENTS,
            MP_SNAPSHOTS,

            INDICATOR_PARAMS: {
                ind1: elInd1 ? elInd1.value : '',
                ind2: elInd2 ? elInd2.value : '',
                highSchoolLine: typeof readIndicatorState === 'function'
                    ? (readIndicatorState().highSchoolLine || '')
                    : ''
            }
        },
        settings: {
            skin: localStorage.getItem('app_skin_config'),
            themeDark: localStorage.getItem('theme-dark'),
            hasSeenTour: localStorage.getItem('hasSeenV3Tour')
        }
    };

    try {
        const transfer = getConfigTransferRuntime();
        const fileName = transfer.downloadJson(snapshot, { fileName: buildProjectSnapshotFileName() });
        markProjectFileBackupSaved(fileName);
        UI.toast("✅ 当前项目已保存到文件", "success");
    } catch (e) {
        console.error(e);
        alert("保存失败：" + e.message);
    }
}

async function loadProjectSnapshot(input) {
    if (isArchiveLocked()) return alert("⛔ 当前考试已封存，禁止从文件恢复项目");
    const file = input && input.files ? input.files[0] : input;
    if (!file) return;

    if (!(await UI.confirm("⚠️ 警告：从文件恢复会覆盖当前系统中的所有数据！\n确定要继续吗？", {
        title: '从文件恢复项目',
        confirmText: '恢复'
    }))) {
        if (input && input.value !== undefined) input.value = '';
        return;
    }

    try {
        UI.loading(true, "正在从文件恢复全站数据...");
        const transfer = getConfigTransferRuntime();
        const snapshot = await transfer.readJson(file);

        if (!snapshot.meta || (!snapshot.data && !snapshot.db)) {
            throw new Error("文件格式不兼容或已损坏");
        }

        const db = snapshot.db || snapshot.data || {};
        const settings = snapshot.settings || {};

        if (settings.skin) localStorage.setItem('app_skin_config', settings.skin);
        if (settings.themeDark) localStorage.setItem('theme-dark', settings.themeDark);
        if (settings.hasSeenTour) localStorage.setItem('hasSeenV3Tour', settings.hasSeenTour);

        if (Object.keys(db).length > 0) {
            /* 👇👇👇 🟢 关键：恢复全局变量 TARGETS (防止刷新前点击无效) 🟢 👇👇👇 */
            setTargetsState(db.TARGETS || {});

            await DB.save('autosave_backup', {
                timestamp: Date.now(),
                RAW_DATA: db.RAW_DATA || [],
                SCHOOLS: db.SCHOOLS || {},
                SUBJECTS: db.SUBJECTS || [],
                THRESHOLDS: db.THRESHOLDS || {},

                /* 👇👇👇 🟢 关键：写入 TARGETS 到缓存 🟢 👇👇👇 */
                TARGETS: db.TARGETS || {},

                /* 👇👇👇 🟢 关键：写入 指标参数 到缓存 🟢 👇👇👇 */
                INDICATOR_PARAMS: db.INDICATOR_PARAMS || { ind1: '', ind2: '', highSchoolLine: '' },

                TEACHER_MAP: db.TEACHER_MAP || {},
                TEACHER_STATS: db.TEACHER_STATS || {},
                FB_CLASSES: db.FB_CLASSES || [],
                CONFIG: db.CONFIG || {},
                MY_SCHOOL: db.MY_SCHOOL || "",
                TEACHER_TOWNSHIP_RANKINGS: db.TEACHER_TOWNSHIP_RANKINGS || {},
                PREV_DATA: db.PREV_DATA || [],
                PROGRESS_CACHE: db.PROGRESS_CACHE || [],
                PROGRESS_CACHE_FULL: db.PROGRESS_CACHE_FULL || [],
                MANUAL_ID_MAPPINGS: db.MANUAL_ID_MAPPINGS || {},
                LAST_VA_DATA: db.LAST_VA_DATA || [],
                VA_VIEW_MODE: db.VA_VIEW_MODE || 'school',
                __PROGRESS_QUICK_MODE: db.__PROGRESS_QUICK_MODE || 'all',
                CURRENT_REPORT_STUDENT: db.CURRENT_REPORT_STUDENT || null,
                CURRENT_CONTEXT_STUDENTS: db.CURRENT_CONTEXT_STUDENTS || [],
                MARGINAL_STUDENTS: db.MARGINAL_STUDENTS || {},
                POTENTIAL_STUDENTS_CACHE: db.POTENTIAL_STUDENTS_CACHE || [],
                FB_STUDENTS: db.FB_STUDENTS || [],
                FB_SIMULATED_DATA: db.FB_SIMULATED_DATA || {},
                EXAM_DATA: db.EXAM_DATA || [],
                EXAM_ROOMS: db.EXAM_ROOMS || [],
                AID_GROUPS_CACHE: db.AID_GROUPS_CACHE || [],
                HISTORY_ARCHIVE: db.HISTORY_ARCHIVE || {},
                ROLLER_COASTER_STUDENTS: db.ROLLER_COASTER_STUDENTS || []
            });

            if (db.MP_SNAPSHOTS) {
                localStorage.setItem('MP_SNAPSHOTS', JSON.stringify(db.MP_SNAPSHOTS));
            }
        }

        if (typeof logAction === 'function') logAction('文件恢复', `已从 ${file.name || '备份文件'} 恢复项目`);

        localStorage.setItem('SYS_FORCE_RESTORE', 'true');

        UI.loading(false);

        Swal.fire({
            title: '恢复成功',
            text: '项目已从文件恢复，系统即将重启以应用更改...',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            location.reload();
        });

    } catch (err) {
        UI.loading(false);
        console.error(err);
        alert("❌ 恢复失败：所选文件可能已损坏。\nDEBUG: " + err.message);
    } finally {
        if (input && input.value !== undefined) input.value = '';
    }
}
