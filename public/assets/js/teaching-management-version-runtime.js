// Teaching management runtime: version center and issue board.
const TM_VERSION_FRESH_MS = 45 * 1000;
const TM_VERSION_STALE_MS = 10 * 60 * 1000;
const TM_VERSION_STORAGE_KEY = 'schoolSystemTeachingVersionCacheV1';

function tmNormalizeVersionSnapshot(value, cacheKey, maxAgeMs = TM_VERSION_STALE_MS) {
    if (!value || typeof value !== 'object') return null;
    if (String(value.key || '') !== String(cacheKey || '')) return null;
    const fetchedAt = Number(value.fetchedAt || 0);
    if (!Number.isFinite(fetchedAt) || fetchedAt <= 0 || Date.now() - fetchedAt > maxAgeMs) return null;
    return {
        key: String(value.key || ''),
        fetchedAt,
        records: Array.isArray(value.records) ? value.records : [],
        authState: String(value.authState || 'ready'),
        error: String(value.error || '')
    };
}

function tmReadVersionSnapshot(cacheKey) {
    try {
        const raw = window.sessionStorage?.getItem(TM_VERSION_STORAGE_KEY);
        if (!raw) return null;
        return tmNormalizeVersionSnapshot(JSON.parse(raw), cacheKey);
    } catch (error) {
        return null;
    }
}

function tmWriteVersionSnapshot(snapshot) {
    try {
        const normalized = tmNormalizeVersionSnapshot(snapshot, snapshot?.key, TM_VERSION_STALE_MS);
        if (!normalized || normalized.authState !== 'ready') return;
        window.sessionStorage?.setItem(TM_VERSION_STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
        // Snapshot cache only shortens repeat navigation; cloud remains authoritative.
    }
}

function tmCanManageVersions() {
    return ['admin', 'director'].includes(tmGetCurrentGatewayRole());
}

function tmGetVersionTimeValue(row) {
    const createdAt = String(row?.created_at || '').trim();
    const time = Date.parse(createdAt);
    return Number.isFinite(time) ? time : 0;
}

function tmVersionRecordHasCurrentDiff(row, currentPayload = null) {
    if (!row || typeof row !== 'object') return false;
    const payload = currentPayload || tmBuildCurrentVersionPayload('__current__');
    return tmBuildVersionDiffRows(row, payload).some((item) => !!item?.changed);
}

function tmUpdateVersionDiffOnlyButton() {
    const btn = document.getElementById('tmVersionDiffOnlyBtn');
    if (!btn) return false;
    const active = btn.dataset.active === '1';
    btn.textContent = active ? '查看全部版本' : '只看有差异';
    btn.className = `btn ${active ? 'btn-orange' : 'btn-secondary'}`;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    return active;
}

function tmUpdateVersionNormalDiffButton() {
    const btn = document.getElementById('tmVersionNormalDiffBtn');
    if (!btn) return false;
    const stableFilter = String(document.getElementById('tmVersionStableFilter')?.value || 'all').trim();
    const diffActive = document.getElementById('tmVersionDiffOnlyBtn')?.dataset.active === '1';
    const active = diffActive && stableFilter === 'normal';
    btn.textContent = active ? '退出普通版差异' : '普通版差异';
    btn.className = `btn ${active ? 'btn-orange' : 'btn-secondary'}`;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    return active;
}

function tmGetVersionDiffCount(row, currentPayload = null) {
    if (!row || typeof row !== 'object') return 0;
    const payload = currentPayload || tmBuildCurrentVersionPayload('__current__');
    return tmBuildVersionDiffRows(row, payload).filter((item) => !!item?.changed).length;
}

function tmGetFilteredVersionRecords(records) {
    const source = Array.isArray(records) ? records : [];
    const keyword = String(document.getElementById('tmVersionSearchInput')?.value || '').trim().toLowerCase();
    const stableFilter = String(document.getElementById('tmVersionStableFilter')?.value || 'all').trim();
    const sortOrder = String(document.getElementById('tmVersionSortOrder')?.value || 'desc').trim();
    const diffOnly = tmUpdateVersionDiffOnlyButton();
    tmUpdateVersionNormalDiffButton();
    const currentPayload = diffOnly ? tmBuildCurrentVersionPayload('__current__') : null;

    const filtered = source.filter((row) => {
        const isStable = !!row?.is_stable;
        if (stableFilter === 'stable' && !isStable) return false;
        if (stableFilter === 'normal' && isStable) return false;
        if (diffOnly && !tmVersionRecordHasCurrentDiff(row, currentPayload)) return false;
        if (!keyword) return true;

        const haystack = [
            row?.version_name,
            row?.created_by,
            row?.snapshot_key,
            row?.project_key,
            row?.exam_scope
        ].map((item) => String(item || '').toLowerCase()).join(' ');

        return haystack.includes(keyword);
    });

    return filtered.sort((a, b) => {
        const diff = tmGetVersionTimeValue(b) - tmGetVersionTimeValue(a);
        return sortOrder === 'asc' ? -diff : diff;
    });
}

async function tmMarkLatestVersionStable() {
    if (!tmCanManageVersions()) return;
    const records = Array.isArray(TM_VERSION_CACHE?.records) ? TM_VERSION_CACHE.records : [];
    if (!records.length) {
        if (window.UI && typeof UI.toast === 'function') UI.toast('当前还没有可操作的版本记录', 'warning');
        return;
    }

    const latest = [...records].sort((a, b) => tmGetVersionTimeValue(b) - tmGetVersionTimeValue(a))[0];
    if (!latest?.id) return;
    if (latest.is_stable) {
        if (window.UI && typeof UI.toast === 'function') UI.toast('最新版本已经是稳定版', 'info');
        return;
    }

    await tmToggleStableVersion(String(latest.id || ''), true);
}

function tmBuildTeacherRiskRows(subjectFilter = '', teacherFilter = '') {
    const stats = readTeacherStats();
    const useSubjectFilter = String(subjectFilter || '').trim();
    const useTeacherFilter = String(teacherFilter || '').trim();
    const rows = [];

    Object.entries(stats).forEach(([teacherName, subjectMap]) => {
        if (useTeacherFilter && useTeacherFilter !== '全部教师' && teacherName !== useTeacherFilter) return;
        Object.entries(subjectMap || {}).forEach(([subjectName, data]) => {
            if (useSubjectFilter && useSubjectFilter !== '全部学科' && subjectName !== useSubjectFilter) return;
            const lowRate = Number(data?.lowRate || 0);
            const passRate = Number(data?.passRate || 0);
            const fairScore = Number(data?.fairScore ?? data?.finalScore ?? 0);
            const baselineAdjustment = Number(data?.baselineAdjustment || 0);
            const sampleStabilityRate = Number(data?.sampleStabilityRate || 0);
            const sampleShiftCount = Number(data?.sampleShiftCount || 0);
            const teacherChangeProtected = !!data?.teacherChangeProtected;
            const conversionScore = Number(data?.conversionScore || 50);
            let riskScore = 0;
            if (lowRate >= 0.12) riskScore += 3;
            if (passRate > 0 && passRate < 0.6) riskScore += 2;
            if (fairScore > 0 && fairScore < 60) riskScore += 2;
            if (baselineAdjustment <= -6) riskScore += 2;
            if (teacherChangeProtected) riskScore += 1;
            if (conversionScore < 45) riskScore += 1;
            if (sampleStabilityRate > 0 && sampleStabilityRate < 0.75 && sampleShiftCount >= 3) riskScore += 1;
            if (!riskScore) return;

            rows.push({
                teacherName,
                subjectName,
                classes: Array.isArray(data?.classes) ? data.classes.join(',') : String(data?.classes || ''),
                lowRate,
                passRate,
                fairScore,
                baselineAdjustment,
                sampleStabilityRate,
                sampleShiftCount,
                teacherChangeProtected,
                conversionScore,
                riskScore
            });
        });
    });

    return rows.sort((a, b) => {
        if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
        if (b.lowRate !== a.lowRate) return b.lowRate - a.lowRate;
        return a.fairScore - b.fairScore;
    });
}

function tmBuildIssueTeacherCard(row) {
    return `
        <div class="tm-center-card warning">
            <div class="tm-center-card-head">
                <div class="tm-center-card-title">${tmEscapeHtml(`${row.teacherName} · ${row.subjectName}`)}</div>
                ${tmBuildStatusChip('教师风险', 'warn')}
            </div>
            <div class="tm-center-card-scope">${tmEscapeHtml(row.classes || '当前任课班级未识别')}</div>
            <div class="tm-center-card-desc">低分率 ${(row.lowRate * 100).toFixed(1)}%，及格率 ${(row.passRate * 100).toFixed(1)}%，教学质量分 ${row.fairScore.toFixed(1)}，基线校正 ${row.baselineAdjustment >= 0 ? '+' : ''}${row.baselineAdjustment.toFixed(1)}，转化分 ${row.conversionScore.toFixed(1)}，样本稳定 ${(row.sampleStabilityRate * 100).toFixed(0)}%${row.sampleShiftCount ? `（变动 ${row.sampleShiftCount} 人）` : ''}${row.teacherChangeProtected ? '，已启用换老师保护' : ''}。</div>
            <div class="tm-center-card-actions">
                <button type="button" class="btn btn-orange" data-tm-issue-teacher="${tmEscapeHtml(row.teacherName)}" data-tm-issue-subject="${tmEscapeHtml(row.subjectName)}">定位教师画像</button>
            </div>
        </div>
    `;
}

function tmJumpToTeacherIssue(teacherName, subjectName) {
    tmApplySelectValue('teacherCompareSubject', subjectName, subjectName);
    tmApplySelectValue('teacherCompareTeacher', teacherName, teacherName);
    if (typeof switchTab === 'function') switchTab('teacher-analysis');
    setTimeout(() => {
        if (typeof analyzeTeachers === 'function') analyzeTeachers();
    }, 120);
}

function tmRenderIssueBoard() {
    const container = document.getElementById('tmIssueBoardList');
    if (!container) return;

    const authState = String(TM_CLOUD_OPS_CACHE.authState || 'unknown');
    if (authState === 'missing_token') {
        tmSetHtml('tmIssueSummaryTeacherRisk', tmBuildMiniCard('风险教师', '待登录'));
        tmSetHtml('tmIssueSummaryWarnings', tmBuildMiniCard('待跟进预警', '待登录'));
        tmSetHtml('tmIssueSummaryTasks', tmBuildMiniCard('整改任务', '待登录'));
        tmSetHtml('tmIssueSummaryFocus', tmBuildMiniCard('风险聚焦学科', '待登录'));
        container.innerHTML = '<div class="tm-cloud-empty">当前浏览器还没有云端网关会话，请重新登录后查看教学问题清单。</div>';
        return;
    }
    if (authState === 'loading') {
        container.innerHTML = '<div class="tm-cloud-empty">正在汇总教师风险、预警和整改任务，请稍候...</div>';
        return;
    }

    const selectedSubjectValue = tmGetSelectRawValue(['teacherCompareSubject', 'subjectSelect'], '');
    const selectedTeacherValue = tmGetSelectRawValue(['teacherCompareTeacher', 'teacherNameSelect'], '');
    const teacherInsight = tmBuildTeacherInsight(selectedSubjectValue, selectedTeacherValue);
    const teacherRows = tmBuildTeacherRiskRows(selectedSubjectValue, selectedTeacherValue).slice(0, 6);
    const warningRows = (TM_CLOUD_OPS_CACHE.warnings || []).filter((row) => !['ignored', 'resolved'].includes(String(row.status || '').trim().toLowerCase())).slice(0, 4);
    const taskRows = (TM_CLOUD_OPS_CACHE.tasks || []).filter((row) => !['done', 'closed'].includes(String(row.status || '').trim().toLowerCase())).slice(0, 4);

    tmSetHtml('tmIssueSummaryTeacherRisk', tmBuildMiniCard('风险教师', `${teacherInsight.riskTeacherCount} 人`));
    tmSetHtml('tmIssueSummaryWarnings', tmBuildMiniCard('待跟进预警', `${warningRows.length} 条`));
    tmSetHtml('tmIssueSummaryTasks', tmBuildMiniCard('整改任务', `${taskRows.length} 项`));
    tmSetHtml('tmIssueSummaryFocus', tmBuildMiniCard('风险聚焦学科', teacherInsight.focusSubject?.subjectName || '暂无'));

    const teacherHtml = teacherRows.length
        ? teacherRows.map(tmBuildIssueTeacherCard).join('')
        : '<div class="tm-cloud-empty">当前筛选范围内没有教师风险项。</div>';
    const warningHtml = warningRows.length
        ? warningRows.map(tmBuildWarningCenterCard).join('')
        : '<div class="tm-cloud-empty">当前没有待跟进的云端预警。</div>';
    const taskHtml = taskRows.length
        ? taskRows.map(tmBuildRectifyCenterCard).join('')
        : '<div class="tm-cloud-empty">当前没有未完成的整改任务。</div>';

    container.innerHTML = `
        <div class="tm-cloud-group">
            <h5>教师风险清单</h5>
            <div class="tm-cloud-stack">${teacherHtml}</div>
        </div>
        <div class="tm-cloud-group">
            <h5>待跟进预警</h5>
            <div class="tm-cloud-stack">${warningHtml}</div>
        </div>
        <div class="tm-cloud-group">
            <h5>整改任务进展</h5>
            <div class="tm-cloud-stack">${taskHtml}</div>
        </div>
    `;

    container.querySelectorAll('[data-tm-issue-teacher]').forEach((btn) => {
        if (btn.dataset.tmIssueBound === '1') return;
        btn.dataset.tmIssueBound = '1';
        btn.addEventListener('click', () => {
            tmJumpToTeacherIssue(btn.dataset.tmIssueTeacher || '', btn.dataset.tmIssueSubject || '');
        });
    });

    container.querySelectorAll('[data-tm-warning-ignore]').forEach((btn) => {
        if (btn.dataset.tmBoundIgnore === '1') return;
        btn.dataset.tmBoundIgnore = '1';
        btn.addEventListener('click', async () => {
            await tmIgnoreCloudWarning(btn.dataset.tmWarningIgnore || '');
        });
    });

    container.querySelectorAll('[data-tm-warning-rectify]').forEach((btn) => {
        if (btn.dataset.tmBoundRectify === '1') return;
        btn.dataset.tmBoundRectify = '1';
        btn.addEventListener('click', async () => {
            await tmCreateRectifyTaskFromWarning(btn.dataset.tmWarningRectify || '');
        });
    });

    container.querySelectorAll('[data-tm-task-status]').forEach((btn) => {
        if (btn.dataset.tmBoundTaskStatus === '1') return;
        btn.dataset.tmBoundTaskStatus = '1';
        btn.addEventListener('click', async () => {
            await tmUpdateRectifyTaskStatus(btn.dataset.tmTaskStatus || '', btn.dataset.status || '');
        });
    });
}

function tmBuildAliasSignature() {
    const rows = typeof ensureSchoolAliasStore === 'function' ? (ensureSchoolAliasStore() || []) : (window.SYS_VARS?.schoolAliases || []);
    return (Array.isArray(rows) ? rows : [])
        .map((row) => `${String(row.alias || '').trim()}=>${String(row.standard || '').trim()}`)
        .sort((a, b) => a.localeCompare(b, 'zh-CN'))
        .join('|');
}

function tmBuildScoreSignature(exams) {
    const examList = Array.isArray(exams) ? exams : [];
    const examSig = examList
        .map((item) => `${String(item.id || '').trim()}:${String(item.label || '').trim()}`)
        .sort((a, b) => a.localeCompare(b, 'zh-CN'))
        .join('|');
    return `rows:${Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0}|exams:${examSig}`;
}

var TM_CURRENT_VERSION_PAYLOAD_CACHE = { key: '', payload: null };

function tmBuildCurrentVersionPayload(versionName) {
    const scope = tmGetCurrentGatewayScope();
    const exams = tmGetAvailableExamList();
    const teacherCoverage = tmGetTeacherCoverageFromMap();
    const targets = typeof ensureNormalizedTargets === 'function' ? (ensureNormalizedTargets() || {}) : (window.TARGETS || {});
    const aliasRows = typeof ensureSchoolAliasStore === 'function' ? (ensureSchoolAliasStore() || []) : (window.SYS_VARS?.schoolAliases || []);
    const paramsSignature = window.DataManager?.getParamsSyncSignature ? DataManager.getParamsSyncSignature() : '';
    const targetsSignature = window.DataManager?.getTargetsSyncSignature ? DataManager.getTargetsSyncSignature() : '';
    const teacherSignature = window.DataManager?.buildTeacherSignature
        ? DataManager.buildTeacherSignature(window.TEACHER_MAP || {}, window.TEACHER_SCHOOL_MAP || {})
        : `teacher:${teacherCoverage.mappingCount}`;
    const scoreHash = tmBuildScoreSignature(exams);
    const aliasHash = tmBuildAliasSignature();
    const configHash = `${String(window.CONFIG?.name || '').trim()}|${paramsSignature}`;
    const isCurrentPayload = String(versionName || '') === '__current__';
    const cacheKey = isCurrentPayload
        ? [
            scope.project_key,
            scope.cohort_id,
            scope.school_name,
            scoreHash,
            teacherSignature,
            targetsSignature,
            aliasHash,
            configHash,
            Object.keys(targets || {}).length,
            Array.isArray(aliasRows) ? aliasRows.length : 0
        ].join('::')
        : '';

    if (isCurrentPayload && TM_CURRENT_VERSION_PAYLOAD_CACHE.key === cacheKey && TM_CURRENT_VERSION_PAYLOAD_CACHE.payload) {
        return TM_CURRENT_VERSION_PAYLOAD_CACHE.payload;
    }

    const payload = {
        version_name: versionName,
        project_key: scope.project_key,
        cohort_id: scope.cohort_id,
        snapshot_key: readWorkspaceProjectKey() || null,
        exam_scope: exams.map((item) => item.label || item.id).join(' | ') || null,
        score_hash: scoreHash,
        teacher_hash: teacherSignature,
        target_hash: targetsSignature,
        alias_hash: aliasHash,
        config_hash: configHash,
        summary_json: {
            school_name: scope.school_name || null,
            exams_count: exams.length,
            score_rows: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            teacher_mappings: teacherCoverage.mappingCount,
            target_schools: Object.keys(targets || {}).length,
            alias_rules: Array.isArray(aliasRows) ? aliasRows.length : 0
        }
    };
    if (isCurrentPayload) {
        TM_CURRENT_VERSION_PAYLOAD_CACHE = { key: cacheKey, payload };
    }
    return payload;
}

function tmFormatVersionValue(value, fallback = '未记录') {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    return text ? text : fallback;
}

function tmGetStableVersionRecord() {
    const records = Array.isArray(TM_VERSION_CACHE?.records) ? TM_VERSION_CACHE.records : [];
    return records.find((item) => !!item?.is_stable) || null;
}

function tmBuildVersionDriftState() {
    const stableRecord = tmGetStableVersionRecord();
    if (!stableRecord) {
        return {
            hasStable: false,
            stableRecord: null,
            rows: [],
            changedRows: [],
            changedCount: 0,
            unchangedCount: 0,
            topChanges: [],
            summary: '当前还没有稳定版基线'
        };
    }

    const currentPayload = tmBuildCurrentVersionPayload('__current__');
    const rows = tmBuildVersionDiffRows(stableRecord, currentPayload);
    const changedRows = rows.filter((row) => row.changed);
    const topChanges = changedRows.slice(0, 3).map((row) => row.label);

    return {
        hasStable: true,
        stableRecord,
        rows,
        changedRows,
        changedCount: changedRows.length,
        unchangedCount: rows.length - changedRows.length,
        topChanges,
        summary: changedRows.length
            ? `当前环境相对稳定版有 ${changedRows.length} 项变化`
            : '当前环境与稳定版保持一致'
    };
}

function tmGetVersionSummaryValue(summary, key) {
    const value = summary && typeof summary === 'object' ? summary[key] : '';
    if (value === null || value === undefined || value === '') return '未记录';
    return String(value);
}

function tmBuildVersionDiffRows(saved, currentPayload) {
    const rows = [];
    const summaryFields = [
        { key: 'exams_count', label: '考试期数' },
        { key: 'score_rows', label: '成绩条数' },
        { key: 'teacher_mappings', label: '任课表映射' },
        { key: 'target_schools', label: '目标人数学校' },
        { key: 'alias_rules', label: '别名规则' }
    ];
    const hashFields = [
        { key: 'score_hash', label: '成绩库签名' },
        { key: 'teacher_hash', label: '任课表签名' },
        { key: 'target_hash', label: '目标人数签名' },
        { key: 'alias_hash', label: '别名规则签名' },
        { key: 'config_hash', label: '参数签名' }
    ];

    hashFields.forEach(({ key, label }) => {
        const before = tmFormatVersionValue(saved?.[key]);
        const after = tmFormatVersionValue(currentPayload?.[key]);
        rows.push({ label, before, after, changed: before !== after });
    });

    summaryFields.forEach(({ key, label }) => {
        const before = tmGetVersionSummaryValue(saved?.summary_json, key);
        const after = tmGetVersionSummaryValue(currentPayload?.summary_json, key);
        rows.push({ label, before, after, changed: before !== after });
    });

    rows.push({
        label: '考试范围',
        before: tmFormatVersionValue(saved?.exam_scope),
        after: tmFormatVersionValue(currentPayload?.exam_scope),
        changed: tmFormatVersionValue(saved?.exam_scope) !== tmFormatVersionValue(currentPayload?.exam_scope)
    });

    return rows;
}

function tmRenderVersionDiffPanel() {
    const panel = document.getElementById('tmVersionDiffPanel');
    const empty = document.getElementById('tmVersionDiffEmpty');
    if (!panel) return;

    const versionId = String(TM_VERSION_DIFF_STATE.versionId || '').trim();
    if (!versionId) {
        panel.style.display = 'none';
        panel.innerHTML = '';
        if (empty) empty.style.display = '';
        return;
    }

    const record = (TM_VERSION_CACHE.records || []).find((item) => String(item.id || '') === versionId);
    if (!record) {
        TM_VERSION_DIFF_STATE = { versionId: '', html: '', title: '' };
        panel.style.display = 'none';
        panel.innerHTML = '';
        if (empty) empty.style.display = '';
        return;
    }

    const currentPayload = tmBuildCurrentVersionPayload('__current__');
    const rows = tmBuildVersionDiffRows(record, currentPayload);
    const changedRows = rows.filter((row) => row.changed);
    const unchangedRows = rows.filter((row) => !row.changed);

    panel.style.display = '';
    if (empty) empty.style.display = 'none';
    panel.innerHTML = `
        <div class="tm-version-diff-card">
            <div class="tm-version-diff-head">
                <div>
                    <div class="tm-version-diff-title">与当前环境差异</div>
                    <div class="tm-version-diff-subtitle">${tmEscapeHtml(String(record.version_name || '未命名版本'))} · ${tmEscapeHtml(record.is_stable ? '稳定版' : '普通版')}</div>
                </div>
                <button type="button" class="btn btn-secondary" id="tmVersionDiffCloseBtn">收起对比</button>
            </div>
            <div class="tm-version-diff-summary">
                ${tmBuildStatusChip(`变化 ${changedRows.length} 项`, changedRows.length ? 'warn' : 'ok')}
                ${tmBuildStatusChip(`一致 ${unchangedRows.length} 项`, 'info')}
                <span class="tm-inline-chip">版本时间：${tmEscapeHtml(String(record.created_at || '').replace('T', ' ').slice(0, 16) || '未记录')}</span>
            </div>
            <div class="tm-version-diff-grid">
                ${rows.map((row) => `
                    <div class="tm-version-diff-item ${row.changed ? 'changed' : ''}">
                        <div class="tm-version-diff-label">${tmEscapeHtml(row.label)}</div>
                        <div class="tm-version-diff-values">
                            <div>
                                <div class="tm-version-diff-caption">归档版本</div>
                                <div class="tm-version-diff-value">${tmEscapeHtml(row.before)}</div>
                            </div>
                            <div>
                                <div class="tm-version-diff-caption">当前环境</div>
                                <div class="tm-version-diff-value">${tmEscapeHtml(row.after)}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const closeBtn = document.getElementById('tmVersionDiffCloseBtn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            TM_VERSION_DIFF_STATE = { versionId: '', html: '', title: '' };
            tmRenderVersionDiffPanel();
        };
    }
}

function tmRenderVersionStableMeta() {
    const meta = document.getElementById('tmVersionStableMeta');
    const compareBtn = document.getElementById('tmVersionCompareStableBtn');
    if (!meta) return;

    const authState = String(TM_VERSION_CACHE?.authState || 'unknown');
    if (compareBtn) {
        compareBtn.style.display = 'none';
        compareBtn.dataset.versionId = '';
    }

    if (!tmCanManageVersions()) {
        meta.innerHTML = '稳定版基线状态仅对管理角色开放。';
        return;
    }
    if (authState === 'missing_token') {
        meta.innerHTML = '当前浏览器还没有云端网关会话，重新登录后才能读取稳定版基线。';
        return;
    }
    if (authState === 'loading') {
        meta.innerHTML = '正在检查稳定版基线，请稍候...';
        return;
    }
    if (authState === 'error') {
        meta.innerHTML = `稳定版状态读取失败：${tmEscapeHtml(String(TM_VERSION_CACHE?.error || '未知错误'))}`;
        return;
    }

    const drift = tmBuildVersionDriftState();
    if (!drift.hasStable) {
        meta.innerHTML = '当前还没有稳定版基线，建议在本轮数据确认无误后先标记一版稳定版。';
        return;
    }

    const stableRecord = drift.stableRecord || {};
    const stableTime = String(stableRecord.created_at || '').replace('T', ' ').slice(0, 16) || '未记录';
    const changeText = drift.changedCount
        ? `当前环境相对稳定版已有 ${drift.changedCount} 项变化${drift.topChanges.length ? `：${tmEscapeHtml(drift.topChanges.join('、'))}${drift.changedCount > drift.topChanges.length ? ' 等' : ''}` : ''}。`
        : '当前环境与稳定版保持一致，可直接作为分析基线。';

    meta.innerHTML = `
        <span class="tm-inline-chip">稳定版：${tmEscapeHtml(String(stableRecord.version_name || '未命名版本'))}</span>
        <span class="tm-inline-chip">时间：${tmEscapeHtml(stableTime)}</span>
        <span class="tm-inline-chip">${changeText}</span>
    `;
    if (compareBtn) {
        compareBtn.style.display = '';
        compareBtn.dataset.versionId = String(stableRecord.id || '');
        compareBtn.innerHTML = `<i class="ti ti-arrows-diff"></i> ${drift.changedCount ? '查看稳定版差异' : '查看稳定版'}`;
    }
}

async function tmToggleStableVersion(versionId, nextStable) {
    if (!tmCanManageVersions() || !window.EdgeGateway || typeof EdgeGateway.updateVersion !== 'function') return;
    const cleanId = String(versionId || '').trim();
    if (!cleanId) return;

    try {
        await EdgeGateway.updateVersion({ id: cleanId, is_stable: !!nextStable });
        if (window.UI && typeof UI.toast === 'function') {
            UI.toast(nextStable ? '已标记为稳定版' : '已取消稳定版', 'success');
        }
        await tmRefreshVersionCenter(true);
    } catch (error) {
        if (window.UI && typeof UI.toast === 'function') {
            UI.toast(`更新版本状态失败：${error instanceof Error ? error.message : String(error)}`, 'warning');
        }
    }
}

async function tmDeleteVersion(versionId) {
    if (!tmCanManageVersions() || !window.EdgeGateway || typeof EdgeGateway.deleteVersion !== 'function') return;
    const cleanId = String(versionId || '').trim();
    if (!cleanId) return;
    const row = (TM_VERSION_CACHE.records || []).find((item) => String(item.id || '') === cleanId);
    const versionName = String(row?.version_name || '当前版本').trim() || '当前版本';
    const stableHint = row?.is_stable ? '该版本当前还是稳定版，删除后将失去这份基线。' : '删除后无法恢复，请确认这是误生成或不再需要的版本。';

    let confirmed = false;
    if (window.Swal && typeof Swal.fire === 'function') {
        const result = await Swal.fire({
            title: '删除版本归档',
            text: `${versionName} 将被永久删除。${stableHint}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '确认删除',
            cancelButtonText: '取消'
        });
        confirmed = !!result.isConfirmed;
    } else {
        confirmed = window.confirm(`确定删除版本“${versionName}”吗？\n${stableHint}`);
    }
    if (!confirmed) return;

    try {
        await EdgeGateway.deleteVersion(cleanId);
        if (TM_VERSION_DIFF_STATE.versionId === cleanId) {
            TM_VERSION_DIFF_STATE = { versionId: '', html: '', title: '' };
        }
        if (window.UI && typeof UI.toast === 'function') {
            UI.toast('已删除该版本归档', 'success');
        }
        await tmRefreshVersionCenter(true);
    } catch (error) {
        if (window.UI && typeof UI.toast === 'function') {
            UI.toast(`删除版本失败：${error instanceof Error ? error.message : String(error)}`, 'warning');
        }
    }
}

function tmShowVersionDiff(versionId) {
    TM_VERSION_DIFF_STATE = {
        versionId: String(versionId || '').trim(),
        html: '',
        title: ''
    };
    tmRenderVersionDiffPanel();
    tmRenderVersionStableMeta();
    const panel = document.getElementById('tmVersionDiffPanel');
    if (panel && typeof panel.scrollIntoView === 'function') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function tmRenderVersionCenter() {
    const container = document.getElementById('tmVersionCenterList');
    if (!container) return;

    const scopeMeta = document.getElementById('tmVersionScopeMeta');
    if (scopeMeta) scopeMeta.textContent = tmGetCloudScopeText();

    const exams = tmGetAvailableExamList();
    const teacherCoverage = tmGetTeacherCoverageFromMap();
    const targets = typeof ensureNormalizedTargets === 'function' ? (ensureNormalizedTargets() || {}) : (window.TARGETS || {});
    tmSetHtml('tmVersionSummaryCurrent', tmBuildMiniCard('当前届别', tmGetCurrentGatewayScope().cohort_id || '未识别'));
    tmSetHtml('tmVersionSummaryScores', tmBuildMiniCard('成绩库', `${exams.length} 期 / ${(window.RAW_DATA || []).length} 条`));
    tmSetHtml('tmVersionSummaryTeachers', tmBuildMiniCard('任课表', `${teacherCoverage.mappingCount} 条映射`));
    tmSetHtml('tmVersionSummaryTargets', tmBuildMiniCard('目标人数', `${Object.keys(targets || {}).length} 所学校`));
    tmRenderVersionDiffPanel();

    if (!tmCanManageVersions()) {
        container.innerHTML = '<div class="tm-cloud-empty">版本归档中心仅对管理员和教导主任开放。你仍可使用“云端存档管理”查看普通快照。</div>';
        return;
    }

    const state = TM_VERSION_CACHE;
    if (state.authState === 'missing_token') {
        container.innerHTML = '<div class="tm-cloud-empty">当前浏览器还没有云端网关会话，请重新登录一次系统后再查看版本归档。</div>';
        return;
    }
    if (state.authState === 'loading') {
        container.innerHTML = '<div class="tm-cloud-empty">正在读取版本归档，请稍候...</div>';
        return;
    }
    if (state.authState === 'error') {
        container.innerHTML = `<div class="tm-cloud-empty">版本归档读取失败：${tmEscapeHtml(String(state.error || '未知错误'))}</div>`;
        return;
    }

    const allRecords = Array.isArray(state.records) ? state.records : [];
    const records = tmGetFilteredVersionRecords(allRecords);
    const currentPayload = tmBuildCurrentVersionPayload('__current__');
    container.innerHTML = records.length
        ? records.map((row) => `
            <div class="tm-center-card task">
                <div class="tm-center-card-head">
                    <div class="tm-center-card-title">${tmEscapeHtml(String(row.version_name || '未命名版本'))}</div>
                    ${tmBuildStatusChip(row.is_stable ? '稳定版' : '普通版', row.is_stable ? 'ok' : 'info')}
                </div>
                <div class="tm-center-card-scope">${tmEscapeHtml(String(row.snapshot_key || row.project_key || '未关联快照'))}</div>
                <div class="tm-center-card-desc">
                    成绩 ${(row.summary_json?.score_rows ?? 0)} 条，考试 ${(row.summary_json?.exams_count ?? 0)} 期，
                    任课表 ${(row.summary_json?.teacher_mappings ?? 0)} 条，目标人数 ${(row.summary_json?.target_schools ?? 0)} 所学校。
                </div>
                <div class="tm-center-card-meta">
                    <span class="tm-inline-chip">创建人：${tmEscapeHtml(String(row.created_by || '未记录'))}</span>
                    <span class="tm-inline-chip">时间：${tmEscapeHtml(String(row.created_at || '').replace('T', ' ').slice(0, 16) || '未记录')}</span>
                </div>
                <div class="tm-center-card-actions">
                    <button type="button" class="btn btn-secondary" data-tm-version-diff="${tmEscapeHtml(String(row.id || ''))}">查看与当前差异</button>
                    <button type="button" class="btn ${row.is_stable ? 'btn-orange' : 'btn-green'}" data-tm-version-stable="${tmEscapeHtml(String(row.id || ''))}" data-next-stable="${row.is_stable ? '0' : '1'}">${row.is_stable ? '取消稳定版' : '标记稳定版'}</button>
                    <button type="button" class="btn btn-danger" data-tm-version-delete="${tmEscapeHtml(String(row.id || ''))}">删除版本</button>
                </div>
            </div>
        `).join('')
        : '<div class="tm-cloud-empty">当前届别还没有结构化版本归档，点击“生成当前版本”即可创建第一版。</div>';

    if (!records.length && allRecords.length) {
        container.innerHTML = '<div class="tm-cloud-empty">当前筛选条件下没有匹配的版本记录，请调整搜索词或版本类型。</div>';
    }

    if (records.length) {
        Array.from(container.querySelectorAll('.tm-center-card.task')).forEach((card, index) => {
            const row = records[index];
            if (!row) return;
            const changedCount = tmGetVersionDiffCount(row, currentPayload);
            const meta = card.querySelector('.tm-center-card-meta');
            if (!meta || meta.querySelector('[data-tm-version-diff-chip="1"]')) return;
            const chip = document.createElement('span');
            chip.className = 'tm-inline-chip';
            chip.dataset.tmVersionDiffChip = '1';
            chip.textContent = `当前差异：${changedCount} 项`;
            meta.appendChild(chip);
        });
    }

    container.querySelectorAll('[data-tm-version-diff]').forEach((btn) => {
        if (btn.dataset.tmBoundVersionDiff === '1') return;
        btn.dataset.tmBoundVersionDiff = '1';
        btn.addEventListener('click', () => {
            tmShowVersionDiff(btn.dataset.tmVersionDiff || '');
        });
    });

    container.querySelectorAll('[data-tm-version-stable]').forEach((btn) => {
        if (btn.dataset.tmBoundVersionStable === '1') return;
        btn.dataset.tmBoundVersionStable = '1';
        btn.addEventListener('click', async () => {
            await tmToggleStableVersion(btn.dataset.tmVersionStable || '', btn.dataset.nextStable === '1');
        });
    });

    container.querySelectorAll('[data-tm-version-delete]').forEach((btn) => {
        if (btn.dataset.tmBoundVersionDelete === '1') return;
        btn.dataset.tmBoundVersionDelete = '1';
        btn.addEventListener('click', async () => {
            await tmDeleteVersion(btn.dataset.tmVersionDelete || '');
        });
    });
}

function tmSyncVersionOverviewState() {
    const overview = document.getElementById('teaching-overview');
    if (overview && overview.classList.contains('active') && typeof renderTeachingOverview === 'function') {
        tmScheduleTeachingOverviewRender();
    }
}

async function tmRefreshVersionCenter(force = false) {
    const scope = tmGetCurrentGatewayScope();
    const cacheKey = `${scope.project_key}::${scope.cohort_id}`;
    const now = Date.now();
    const hasAuthorizedGateway = !!(window.EdgeGateway && typeof EdgeGateway.canUseAuthorizedRequests === 'function' && EdgeGateway.canUseAuthorizedRequests());

    if (!tmCanManageVersions()) {
        TM_VERSION_CACHE = { key: cacheKey, fetchedAt: Date.now(), records: [], authState: 'forbidden', error: '' };
        tmRenderVersionCenter();
        tmSyncVersionOverviewState();
        return;
    }

    if (!hasAuthorizedGateway) {
        TM_VERSION_CACHE = { key: cacheKey, fetchedAt: Date.now(), records: [], authState: 'missing_token', error: '' };
        tmRenderVersionCenter();
        tmSyncVersionOverviewState();
        return;
    }

    let renderedSnapshot = false;
    const memorySnapshot = tmNormalizeVersionSnapshot(TM_VERSION_CACHE, cacheKey);
    if (!force && memorySnapshot) {
        TM_VERSION_CACHE = memorySnapshot;
        tmRenderVersionCenter();
        tmSyncVersionOverviewState();
        if (now - memorySnapshot.fetchedAt < TM_VERSION_FRESH_MS) return TM_VERSION_CACHE;
        renderedSnapshot = true;
    } else if (!force) {
        const storedSnapshot = tmReadVersionSnapshot(cacheKey);
        if (storedSnapshot) {
            TM_VERSION_CACHE = storedSnapshot;
            tmRenderVersionCenter();
            tmSyncVersionOverviewState();
            if (now - storedSnapshot.fetchedAt < TM_VERSION_FRESH_MS) return TM_VERSION_CACHE;
            renderedSnapshot = true;
        }
    }

    if (!force && TM_VERSION_INFLIGHT && TM_VERSION_INFLIGHT_KEY === cacheKey) {
        return TM_VERSION_INFLIGHT;
    }

    const requestId = ++TM_VERSION_REQUEST_ID;
    if (!renderedSnapshot) {
        TM_VERSION_CACHE = { key: cacheKey, fetchedAt: Date.now(), records: [], authState: 'loading', error: '' };
        tmRenderVersionCenter();
        tmSyncVersionOverviewState();
    }

    const task = (async () => {
        const res = await EdgeGateway.listVersions({ project_key: scope.project_key, cohort_id: scope.cohort_id, limit: 20 });
        if (requestId !== TM_VERSION_REQUEST_ID) return;
        TM_VERSION_CACHE = {
            key: cacheKey,
            fetchedAt: Date.now(),
            records: Array.isArray(res?.records) ? res.records : [],
            authState: 'ready',
            error: ''
        };
        tmWriteVersionSnapshot(TM_VERSION_CACHE);
        if (TM_VERSION_DIFF_STATE.versionId && !TM_VERSION_CACHE.records.some((item) => String(item.id || '') === TM_VERSION_DIFF_STATE.versionId)) {
            TM_VERSION_DIFF_STATE = { versionId: '', html: '', title: '' };
        }
        tmRenderVersionCenter();
        tmSyncVersionOverviewState();
    })()
        .catch((error) => {
            if (requestId !== TM_VERSION_REQUEST_ID) return;
            if (renderedSnapshot && TM_VERSION_CACHE.key === cacheKey) {
                TM_VERSION_CACHE = Object.assign({}, TM_VERSION_CACHE, {
                    authState: 'ready',
                    error: error instanceof Error ? error.message : String(error)
                });
                tmRenderVersionCenter();
                tmSyncVersionOverviewState();
                return;
            }
            TM_VERSION_CACHE = {
                key: cacheKey,
                fetchedAt: Date.now(),
                records: [],
                authState: 'error',
                error: error instanceof Error ? error.message : String(error)
            };
            tmRenderVersionCenter();
            tmSyncVersionOverviewState();
        })
        .finally(() => {
            if (TM_VERSION_INFLIGHT === task) {
                TM_VERSION_INFLIGHT = null;
                TM_VERSION_INFLIGHT_KEY = '';
            }
        });

    TM_VERSION_INFLIGHT = task;
    TM_VERSION_INFLIGHT_KEY = cacheKey;
    return task;
}

async function tmCreateCurrentVersionSnapshot() {
    if (!tmCanManageVersions() || !window.EdgeGateway || typeof EdgeGateway.createVersion !== 'function') return;
    const schoolText = tmGetCurrentGatewayScope().school_name || '全范围';
    const defaultName = `教学版本-${schoolText}-${new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').replace(/:/g, '-')}`;
    let versionName = defaultName;
    if (window.Swal && typeof Swal.fire === 'function') {
        const result = await Swal.fire({
            title: '生成当前版本',
            input: 'text',
            inputLabel: '版本名称',
            inputValue: defaultName,
            showCancelButton: true,
            confirmButtonText: '生成版本',
            cancelButtonText: '取消'
        });
        if (!result.isConfirmed) return;
        versionName = String(result.value || '').trim();
    } else {
        versionName = String(prompt('请输入版本名称', defaultName) || '').trim();
    }
    if (!versionName) return;

    try {
        await EdgeGateway.createVersion(tmBuildCurrentVersionPayload(versionName));
        if (window.UI) UI.toast('已生成当前版本归档', 'success');
        await tmRefreshVersionCenter(true);
    } catch (error) {
        if (window.UI) UI.toast(`生成版本失败：${error instanceof Error ? error.message : String(error)}`, 'warning');
    }
}

window.renderTeachingOverview = renderTeachingOverview;
window.tmRenderTeachingModuleStateBars = tmRenderTeachingModuleStateBars;
window.tmRenderIssueBoard = tmRenderIssueBoard;
window.tmScheduleTeachingOverviewRender = tmScheduleTeachingOverviewRender;
window.smScheduleStudentOverviewRender = smScheduleStudentOverviewRender;
window.tmRefreshVersionCenter = tmRefreshVersionCenter;
window.tmCreateCurrentVersionSnapshot = tmCreateCurrentVersionSnapshot;
window.tmShowVersionDiff = tmShowVersionDiff;
window.tmDeleteVersion = tmDeleteVersion;

    window.bindTeachingOverviewActions = bindTeachingOverviewActions;
    window.tmRenderVersionCenter = tmRenderVersionCenter;
    window.tmMarkLatestVersionStable = tmMarkLatestVersionStable;
    window.tmUpdateRectifyTaskStatus = tmUpdateRectifyTaskStatus;
    window.tmPromptRectifyProgress = tmPromptRectifyProgress;
    window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__ = true;
