function logAction(type, message) {
    const key = 'ACTION_LOGS';
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    logs.unshift({ time: new Date().toISOString(), type, message });
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 200)));
    renderActionLogs();
}

function renderActionLogs() {
    const list = document.getElementById('starter-log-list');
    if (!list) return;
    const logs = JSON.parse(localStorage.getItem('ACTION_LOGS') || '[]');
    if (!logs.length) {
        list.innerHTML = '<li class="log-item"><small>暂无记录</small></li>';
        return;
    }
    list.innerHTML = logs.slice(0, 30).map(l => {
        const t = new Date(l.time).toLocaleString();
        return `<li class="log-item"><strong>${l.type}</strong><small>${t}</small><span>${l.message}</span></li>`;
    }).join('');
}

function clearActionLogs() {
    localStorage.removeItem('ACTION_LOGS');
    renderActionLogs();
}

function detectSchoolMode() {
    const schools = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
    const count = schools.length;
    if (!count) {
        if ((RAW_DATA || []).length > 0) {
            updateSchoolMode();
            return '单校模式(未标注学校)';
        }
        return '未检测';
    }
    const mode = updateSchoolMode();
    return mode === 'single' ? '单校模式' : `多校模式(${count})`;
}

function formatStoredSyncTime(value) {
    const raw = String(value || '').trim();
    if (!raw) return '未同步';
    const numeric = /^\d{10,16}$/.test(raw) ? Number(raw) : NaN;
    const date = new Date(Number.isFinite(numeric) ? numeric : raw);
    return Number.isNaN(date.getTime()) ? '时间待校准' : date.toLocaleString('zh-CN');
}

function updateSchoolMode() {
    const schools = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
    const count = schools.length;
    const hasScores = (RAW_DATA || []).length > 0;
    const mode = (count <= 1 || (count === 0 && hasScores)) ? 'single' : 'multi';
    CONFIG.mode = mode;
    document.body.dataset.schoolMode = mode;
    return mode;
}

function isSingleSchoolMode() {
    const schools = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
    return CONFIG?.mode === 'single' || schools.length <= 1;
}

function applySchoolModeToTables() {
    const single = isSingleSchoolMode();
    document.querySelectorAll('table').forEach(table => {
        const headerRows = table.querySelectorAll('thead tr');
        if (!headerRows.length) return;
        const headerCells = headerRows[headerRows.length - 1].querySelectorAll('th');
        const hideIdx = [];
        headerCells.forEach((th, idx) => {
            const text = (th.innerText || '').trim();
            if (/镇排|全镇|乡镇/.test(text)) hideIdx.push(idx);
        });
        if (!hideIdx.length) return;
        table.querySelectorAll('tr').forEach(tr => {
            const cells = tr.children;
            hideIdx.forEach(i => {
                if (cells[i]) cells[i].style.display = single ? 'none' : '';
            });
        });
    });
    document.querySelectorAll('[data-township]').forEach(el => {
        el.style.display = single ? 'none' : '';
    });
}

function scanDataIssues() {
    const list = document.getElementById('starter-issue-list');
    if (!list) return;
    const issues = [];
    if (!RAW_DATA || RAW_DATA.length === 0) issues.push('未导入成绩数据');
    if (!TEACHER_MAP || Object.keys(TEACHER_MAP).length === 0) issues.push('未导入任课表');
    if (!MY_SCHOOL) issues.push('未选择本校');

    // 班级一致性
    if (RAW_DATA && RAW_DATA.length && TEACHER_MAP && Object.keys(TEACHER_MAP).length) {
        const classSet = new Set(RAW_DATA.map(s => s.class));
        const missClasses = [];
        Object.keys(TEACHER_MAP).forEach(key => {
            const cls = key.split('_')[0];
            if (!classSet.has(cls)) missClasses.push(cls);
        });
        if (missClasses.length) {
            const sample = [...new Set(missClasses)].slice(0, 5).join('、');
            issues.push(`任课表班级与成绩不匹配：${sample}`);
        }
    }

    // 学科一致性
    if (SUBJECTS && SUBJECTS.length && TEACHER_MAP && Object.keys(TEACHER_MAP).length) {
        const subjSet = new Set(SUBJECTS.map(s => normalizeSubject(s)));
        const missSubs = [];
        Object.keys(TEACHER_MAP).forEach(key => {
            const sub = normalizeSubject(key.split('_')[1] || '');
            if (sub && !subjSet.has(sub)) missSubs.push(sub);
        });
        if (missSubs.length) {
            const sample = [...new Set(missSubs)].slice(0, 5).join('、');
            issues.push(`任课表学科未出现在成绩中：${sample}`);
        }
    }

    if (!issues.length) {
        list.innerHTML = '<li class="issue-item" style="color:#15803d; background:#ecfdf5; border-color:#bbf7d0;">未发现明显异常</li>';
    } else {
        list.innerHTML = issues.map(i => `<li class="issue-item">${i}</li>`).join('');
    }
}

function manualBackup() {
    const key = readWorkspaceProjectKey() || 'autosave_backup';
    if (typeof getCurrentSnapshotPayload === 'function') {
        DB.save(key, getCurrentSnapshotPayload());
    } else {
        DB.save(key, { RAW_DATA, SCHOOLS, SUBJECTS, THRESHOLDS, TEACHER_MAP, CONFIG, MY_SCHOOL });
    }
    localStorage.setItem('MANUAL_BACKUP_AT', new Date().toISOString());
    logAction('备份', `已备份到 ${key}`);
    if (typeof updateUploadWorkbenchStatus === 'function') updateUploadWorkbenchStatus();
    if (window.UI) UI.toast('✅ 备份完成', 'success');
}

async function manualRestore() {
    const key = readWorkspaceProjectKey() || 'autosave_backup';
    const data = await DB.get(key);
    if (!data) return window.UI.alert('未找到备份数据');
    if (typeof applySnapshotPayload === 'function') {
        applySnapshotPayload(data);
    } else {
        syncDataRuntimeState({
            rawData: data.RAW_DATA || [],
            schools: data.SCHOOLS || {},
            subjects: data.SUBJECTS || [],
            thresholds: data.THRESHOLDS || {},
            config: data.CONFIG || readConfigState()
        });
        setTeacherMap(data.TEACHER_MAP || {});
        setTeacherSchoolMap(data.TEACHER_SCHOOL_MAP || {});
        writeCurrentSchool(data.MY_SCHOOL || readCurrentSchool());
    }
    updateStatusPanel();
    if (typeof updateUploadWorkbenchStatus === 'function') updateUploadWorkbenchStatus();
    logAction('恢复', `已从 ${key} 恢复`);
    if (window.UI) UI.toast('✅ 恢复完成', 'success');
}

function updateUploadWorkbenchStatus() {
    const summaryEl = document.getElementById('upload-summary-strip');
    const noticeEl = document.getElementById('upload-flow-notice');
    const feedbackEl = document.getElementById('upload-feedback-board');
    const msgBox = document.getElementById('msg-box');
    if (!summaryEl && !noticeEl && !feedbackEl && !msgBox) return;

    const termId = readCurrentTermId() || (typeof getTermId === 'function' ? getTermId(getExamMetaFromUI()) : '');
    const examId = CURRENT_EXAM_ID || readWorkspaceExamId() || '未设置';
    const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId() || '';
    const cohortLabel = String(document.getElementById('cohort-current-label')?.innerText || '').trim() || (cohortId || '未选择');
    const gradeLabel = String(document.getElementById('exam-grade-label')?.innerText || '').trim() || '-';
    const mySchool = readCurrentSchool() || '未选择';
    const scoreCount = Array.isArray(RAW_DATA) ? RAW_DATA.length : 0;
    const teacherCount = window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? Object.keys(window.TEACHER_MAP).length : 0;
    const syncCloud = localStorage.getItem('CLOUD_SYNC_AT');
    const syncTeacher = localStorage.getItem('TEACHER_SYNC_AT');
    const manualBackupAt = localStorage.getItem('MANUAL_BACKUP_AT');
    const locked = isArchiveLocked();

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : (window.COHORT_DB || null);
    const examCount = db?.exams ? Object.keys(db.exams).length : 0;
    const snapshots = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const latestSnapshot = snapshots.reduce((acc, item) => {
        const ts = Number(item?.ts || 0);
        return ts > acc.ts ? { ts, key: String(item?.key || '').trim() || '未知项目' } : acc;
    }, { ts: 0, key: '' });
    const latestSnapshotText = latestSnapshot.ts > 0 ? `${latestSnapshot.key}｜${new Date(latestSnapshot.ts).toLocaleString('zh-CN')}` : '暂无自动快照';

    const flowReady = {
        cohort: !!cohortId,
        exam: examId && examId !== '未设置',
        scores: scoreCount > 0,
        teacher: teacherCount > 0,
        school: !!mySchool && mySchool !== '未选择'
    };
    const readyCount = Object.values(flowReady).filter(Boolean).length;
    const noticeText = readyCount === 5
        ? '当前届别、考试、本校、成绩和任课表都已就绪，可以直接进入分析模块。'
        : readyCount >= 3
            ? '当前基础链路已部分就绪，建议先补齐剩余项，再进行全量分析与导出。'
            : '当前仍处在导入准备阶段，建议先完成届别、考试和成绩导入。';

    const summaryCards = [
        { label: '当前届别', value: cohortLabel, meta: flowReady.cohort ? '成长主线已锁定' : '先创建或切换届别' },
        { label: '当前考试', value: examId, meta: flowReady.exam ? `年级 ${gradeLabel}` : '请先设置当前考试' },
        { label: '成绩数据', value: flowReady.scores ? `${scoreCount} 条` : '未导入', meta: flowReady.scores ? '可进入成绩分析' : '请先上传成绩 Excel' },
        { label: '任课表', value: flowReady.teacher ? `${teacherCount} 条` : '未导入', meta: flowReady.teacher ? '教学画像可用' : '建议同步任课表' },
        { label: '本校定位', value: mySchool, meta: flowReady.school ? '筛选口径已锁定' : '请先选择本校' }
    ];

    if (summaryEl) {
        summaryEl.innerHTML = summaryCards.map((card) => `
            <div class="upload-summary-card">
                <span>${card.label}</span>
                <strong>${card.value}</strong>
                <em>${card.meta}</em>
            </div>
        `).join('');
    }

    if (noticeEl) {
        noticeEl.textContent = noticeText;
    }

    if (feedbackEl) {
        const cloudBadge = syncCloud
            ? '<span class="status-badge badge-ok">云端已同步</span>'
            : '<span class="status-badge badge-warn">待同步</span>';
        const teacherBadge = syncTeacher
            ? '<span class="status-badge badge-ok">任课已同步</span>'
            : '<span class="status-badge badge-warn">待同步</span>';
        const archiveBadge = locked
            ? '<span class="status-badge badge-err">只读模式</span>'
            : '<span class="status-badge badge-ok">可编辑</span>';
        const backupBadge = manualBackupAt
            ? '<span class="status-badge badge-ok">已有文件备份</span>'
            : '<span class="status-badge badge-warn">建议先保存到文件</span>';

        feedbackEl.innerHTML = `
            <div class="upload-feedback-card">
                <h4><i class="ti ti-cloud-check"></i> 云端与任课同步</h4>
                ${cloudBadge}
                ${teacherBadge}
                <p>全量云端同步：${syncCloud ? formatStoredSyncTime(syncCloud) : '尚未同步'}<br>任课同步：${syncTeacher ? formatStoredSyncTime(syncTeacher) : '尚未同步'}</p>
            </div>
            <div class="upload-feedback-card">
                <h4><i class="ti ti-lock-access"></i> 当前考试状态</h4>
                ${archiveBadge}
                <p>当前考试：${examId}<br>当前年级：${gradeLabel}<br>历史考试：${examCount} 期</p>
            </div>
            <div class="upload-feedback-card">
                <h4><i class="ti ti-history-toggle"></i> 快照与恢复</h4>
                ${backupBadge}
                <p>最近文件备份：${manualBackupAt ? new Date(manualBackupAt).toLocaleString('zh-CN') : '尚未创建'}<br>最近自动快照：${latestSnapshotText}</p>
            </div>
        `;
    }

    if (msgBox && !String(msgBox.textContent || '').trim()) {
        msgBox.className = 'upload-message-box';
        msgBox.textContent = noticeText;
    }
}

function setUploadMessage(message, tone = 'neutral') {
    const msgBox = document.getElementById('msg-box');
    if (!msgBox) return;
    msgBox.className = 'upload-message-box';
    if (tone === 'success') msgBox.classList.add('is-success');
    else if (tone === 'warning') msgBox.classList.add('is-warning');
    else if (tone === 'error') msgBox.classList.add('is-error');
    msgBox.textContent = String(message || '').trim();
}

const StarterStatusPerfState = {
    signature: '',
    deferredSignature: ''
};

function buildStarterStatusSignature() {
    return [
        String(window.__RAW_DATA_VERSION || 0),
        Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
        TEACHER_MAP ? Object.keys(TEACHER_MAP).length : 0,
        TEACHER_STATS ? Object.keys(TEACHER_STATS).length : 0,
        CURRENT_COHORT_ID || readWorkspaceCohortId() || '',
        CURRENT_EXAM_ID || readWorkspaceExamId() || '',
        readCurrentSchool() || '',
        localStorage.getItem('CLOUD_SYNC_AT') || '',
        localStorage.getItem('TEACHER_SYNC_AT') || ''
    ].join('::');
}

function scheduleStarterStatusDeferred(signature) {
    if (StarterStatusPerfState.deferredSignature === signature) return;
    const run = () => {
        if (StarterStatusPerfState.signature !== signature) return;
        StarterStatusPerfState.deferredSignature = signature;
        renderActionLogs();
        scanDataIssues();
        updateRoleHint();
        updateUploadWorkbenchStatus();
    };
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleTask === 'function') {
        window.SystemPerformance.scheduleTask('starter-status-deferred', run, {
            delay: 32,
            idle: true,
            lane: 'background',
            timeout: 600
        });
        return;
    }
    window.setTimeout(run, 32);
}

function updateStatusPanel() {
    if (!document.getElementById('starter-status-panel')) return;
    const signature = buildStarterStatusSignature();
    if (StarterStatusPerfState.signature === signature) {
        scheduleStarterStatusDeferred(signature);
        return;
    }
    StarterStatusPerfState.signature = signature;
    StarterStatusPerfState.deferredSignature = '';
    const panel = document.getElementById('starter-status-panel');
    const termId = readCurrentTermId() || (typeof getTermId === 'function' ? getTermId(getExamMetaFromUI()) : '');
    const examId = CURRENT_EXAM_ID || readWorkspaceExamId() || '未选择';
    const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId() || '未选择';
    const mySchool = readCurrentSchool() || '未选择';
    const hasScores = RAW_DATA && RAW_DATA.length > 0;
    const teacherCount = window.TEACHER_MAP ? Object.keys(window.TEACHER_MAP).length : 0;
    const syncCloud = localStorage.getItem('CLOUD_SYNC_AT');
    const syncTeacher = localStorage.getItem('TEACHER_SYNC_AT');
    const syncCloudText = formatStoredSyncTime(syncCloud);
    const syncTeacherText = formatStoredSyncTime(syncTeacher);
    const schoolMode = detectSchoolMode();

    const badge = (ok) => ok ? '<span class="status-badge badge-ok">已完成</span>' : '<span class="status-badge badge-warn">未完成</span>';

    panel.innerHTML = `
            <div class="status-item"><strong>当前学期</strong>${termId || '未选择'} ${badge(!!termId)}</div>
            <div class="status-item"><strong>本校</strong>${mySchool} ${badge(!!mySchool && mySchool !== '未选择')}</div>
            <div class="status-item"><strong>学校模式</strong>${schoolMode}</div>
            <div class="status-item"><strong>成绩数据</strong>${hasScores ? RAW_DATA.length + ' 条' : '未导入'} ${badge(hasScores)}</div>
            <div class="status-item"><strong>任课表</strong>${teacherCount ? teacherCount + ' 条' : '未导入'} ${badge(teacherCount > 0)}</div>
            <div class="status-item"><strong>全量云端同步</strong>${syncCloudText} ${syncCloud ? '<span class="status-badge badge-ok">已完成</span>' : '<span class="status-badge badge-err">未完成</span>'}</div>
            <div class="status-item"><strong>任课同步</strong>${syncTeacherText} ${syncTeacher ? '<span class="status-badge badge-ok">已完成</span>' : '<span class="status-badge badge-err">未完成</span>'}</div>
            <div class="status-item"><strong>届别 / 考试</strong>${cohortId} / ${examId}</div>
        `;

    const tasks = document.querySelectorAll('#starter-task-list .task-item');
    tasks.forEach(item => {
        const key = item.getAttribute('data-task');
        let done = false;
        if (key === 'term') done = !!termId && !!cohortId;
        if (key === 'scores') done = hasScores;
        if (key === 'teacher') done = teacherCount > 0;
        if (key === 'school') done = !!mySchool && mySchool !== '未选择';
        if (key === 'analysis') done = TEACHER_STATS && Object.keys(TEACHER_STATS).length > 0;
        item.classList.toggle('done', done);
    });
    scheduleStarterStatusDeferred(signature);
}
window.updateStatusPanel = updateStatusPanel;
