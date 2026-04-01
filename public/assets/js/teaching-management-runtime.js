(() => {
    if (window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__) return;

let TM_CLOUD_OPS_CACHE = {
    key: '',
    fetchedAt: 0,
    warnings: [],
    tasks: [],
    authState: 'unknown',
    error: ''
};
let TM_CLOUD_OPS_REQUEST_ID = 0;
let TM_VERSION_CACHE = {
    key: '',
    fetchedAt: 0,
    records: [],
    authState: 'unknown',
    error: ''
};
let TM_VERSION_REQUEST_ID = 0;
let TM_VERSION_DIFF_STATE = {
    versionId: '',
    html: '',
    title: ''
};

function tmGetCurrentGatewayScope() {
    const school = tmGetSelectDisplayValue(
        ['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'],
        readCurrentSchool() || ''
    );
    return {
        project_key: readWorkspaceProjectKey() || 'cohort::2022',
        cohort_id: readWorkspaceCohortId() || '2022',
        school_name: school && !tmLooksLikePendingValue(school) ? school : ''
    };
}

function tmGetCurrentGatewayRole() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : (window.Auth?.currentUser || null);
    return String(user?.role || '').trim() || 'guest';
}

function tmCanManageCloudOps() {
    return ['admin', 'director', 'grade_director'].includes(tmGetCurrentGatewayRole());
}

function tmNormalizeWarningLevel(level) {
    const raw = String(level || '').trim().toLowerCase();
    if (raw === 'critical') return { text: '严重预警', tone: 'warn' };
    if (raw === 'high') return { text: '高风险', tone: 'warn' };
    if (raw === 'medium') return { text: '中风险', tone: 'info' };
    if (raw === 'low') return { text: '低风险', tone: 'neutral' };
    return { text: '待评估', tone: 'neutral' };
}

function tmNormalizeTaskStatus(status) {
    const raw = String(status || '').trim().toLowerCase();
    if (raw === 'doing') return { text: '进行中', tone: 'info' };
    if (raw === 'done') return { text: '已完成', tone: 'ok' };
    if (raw === 'closed') return { text: '已关闭', tone: 'neutral' };
    return { text: '待处理', tone: 'warn' };
}

function tmFilterCloudRecordsByScope(records, scope, pickSchoolField) {
    const list = Array.isArray(records) ? records : [];
    if (!scope.school_name) return list;
    return list.filter((row) => String(row?.[pickSchoolField] || '').trim() === scope.school_name);
}

function tmBuildCloudWarningTitle(row) {
    const parts = [
        row.school_name,
        row.subject_name,
        row.teacher_name,
        row.class_name
    ].map((item) => String(item || '').trim()).filter(Boolean);
    return parts.length ? parts.join(' / ') : String(row.warning_code || row.warning_type || '云端预警').trim();
}

function tmBuildCloudWarningDesc(row) {
    const desc = String(row.description || '').trim();
    if (desc) return desc;
    const metricName = String(row.metric_name || '').trim();
    const metricValue = row.metric_value !== undefined && row.metric_value !== null ? String(row.metric_value) : '';
    const thresholdValue = row.threshold_value !== undefined && row.threshold_value !== null ? String(row.threshold_value) : '';
    if (metricName && metricValue) {
        return thresholdValue
            ? `${metricName} 当前 ${metricValue}，阈值 ${thresholdValue}`
            : `${metricName} 当前 ${metricValue}`;
    }
    return '该预警来自云端结构化记录，可转为整改任务继续跟进。';
}

function tmBuildCloudTaskDesc(row) {
    const desc = String(row.problem_desc || row.action_plan || '').trim();
    return desc || '该整改任务已进入云端台账，可继续更新责任人、进度和复盘结果。';
}

function tmRenderCloudOpsPanels(state) {
    const allWarnings = Array.isArray(state?.warnings) ? state.warnings : [];
    const warningList = allWarnings.filter((row) => !['ignored', 'resolved'].includes(String(row.status || '').trim().toLowerCase()));
    const taskList = Array.isArray(state?.tasks) ? state.tasks : [];
    const highRiskCount = warningList.filter((row) => ['high', 'critical'].includes(String(row.warning_level || '').trim().toLowerCase())).length;
    const openTaskCount = taskList.filter((row) => !['done', 'closed'].includes(String(row.status || '').trim().toLowerCase())).length;
    const doingTaskCount = taskList.filter((row) => String(row.status || '').trim().toLowerCase() === 'doing').length;
    const authState = String(state?.authState || 'unknown');

    if (authState === 'missing_token') {
        tmSetHtml('tmWarningCount', tmBuildMiniCard('云端预警', '请重新登录后查看'));
        tmSetHtml('tmWarningHigh', tmBuildMiniCard('高风险预警', '待重新登录'));
        tmSetHtml('tmTaskCount', tmBuildMiniCard('整改任务', '请重新登录后查看'));
        tmSetHtml('tmTaskDoing', tmBuildMiniCard('进行中任务', '待重新登录'));
        tmSetHtml('tmCloudOpsList', `
            <div class="tm-cloud-empty" style="grid-column:1/-1;">
                当前浏览器还没有云端网关会话。请重新登录一次系统，随后这里会直接显示云端预警与整改任务。
            </div>
        `);
        return;
    }

    if (authState === 'error') {
        tmSetHtml('tmWarningCount', tmBuildMiniCard('云端预警', '读取失败'));
        tmSetHtml('tmWarningHigh', tmBuildMiniCard('高风险预警', '待重试'));
        tmSetHtml('tmTaskCount', tmBuildMiniCard('整改任务', '读取失败'));
        tmSetHtml('tmTaskDoing', tmBuildMiniCard('进行中任务', '待重试'));
        tmSetHtml('tmCloudOpsList', `
            <div class="tm-cloud-empty" style="grid-column:1/-1;">
                云端预警与整改任务读取失败：${tmEscapeHtml(String(state?.error || '未知错误'))}
            </div>
        `);
        return;
    }

    if (authState === 'loading') {
        tmSetHtml('tmWarningCount', tmBuildMiniCard('云端预警', '正在拉取'));
        tmSetHtml('tmWarningHigh', tmBuildMiniCard('高风险预警', '正在拉取'));
        tmSetHtml('tmTaskCount', tmBuildMiniCard('整改任务', '正在拉取'));
        tmSetHtml('tmTaskDoing', tmBuildMiniCard('进行中任务', '正在拉取'));
        tmSetHtml('tmCloudOpsList', `
            <div class="tm-cloud-empty" style="grid-column:1/-1;">
                正在同步云端预警与整改任务，请稍候...
            </div>
        `);
        return;
    }

    tmSetHtml('tmWarningCount', tmBuildMiniCard('云端预警', warningList.length ? `${warningList.length} 条待处理` : '当前无待处理'));
    tmSetHtml('tmWarningHigh', tmBuildMiniCard('高风险预警', highRiskCount ? `${highRiskCount} 条高风险` : '当前无高风险'));
    tmSetHtml('tmTaskCount', tmBuildMiniCard('整改任务', openTaskCount ? `${openTaskCount} 项未完成` : '当前无未完成'));
    tmSetHtml('tmTaskDoing', tmBuildMiniCard('进行中任务', doingTaskCount ? `${doingTaskCount} 项推进中` : '当前无进行中'));

    const warningHtml = warningList.length
        ? warningList.slice(0, 4).map((row) => {
            const level = tmNormalizeWarningLevel(row.warning_level);
            return `
                <div class="tm-cloud-item warning">
                    <div class="tm-cloud-item-head">
                        <div class="tm-cloud-item-title">${tmEscapeHtml(tmBuildCloudWarningTitle(row))}</div>
                        ${tmBuildStatusChip(level.text, level.tone)}
                    </div>
                    <div class="tm-cloud-item-desc">${tmEscapeHtml(tmBuildCloudWarningDesc(row))}</div>
                    <div class="tm-cloud-item-meta">
                        来源：${tmEscapeHtml(String(row.source_module || row.warning_type || '云端记录'))}
                        ${row.created_at ? ` | 时间：${tmEscapeHtml(String(row.created_at).replace('T', ' ').slice(0, 16))}` : ''}
                    </div>
                    ${tmCanManageCloudOps() ? `
                        <div class="tm-cloud-item-actions">
                            <button type="button" class="btn btn-orange" data-tm-warning-rectify="${tmEscapeHtml(String(row.id || ''))}">生成整改</button>
                            <button type="button" class="btn btn-secondary" data-tm-warning-ignore="${tmEscapeHtml(String(row.id || ''))}">忽略预警</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('')
        : `<div class="tm-cloud-empty">当前范围没有云端预警，说明结构化管理层面暂未发现需要单独挂牌跟进的问题。</div>`;

    const taskHtml = taskList.length
        ? taskList.slice(0, 4).map((row) => {
            const taskState = tmNormalizeTaskStatus(row.status);
            return `
                <div class="tm-cloud-item task">
                    <div class="tm-cloud-item-head">
                        <div class="tm-cloud-item-title">${tmEscapeHtml(String(row.title || '整改任务'))}</div>
                        ${tmBuildStatusChip(taskState.text, taskState.tone)}
                    </div>
                    <div class="tm-cloud-item-desc">${tmEscapeHtml(tmBuildCloudTaskDesc(row))}</div>
                    <div class="tm-cloud-item-meta">
                        负责人：${tmEscapeHtml(String(row.owner_name || '未指派'))}
                        ${row.due_date ? ` | 截止：${tmEscapeHtml(String(row.due_date))}` : ''}
                    </div>
                </div>
            `;
        }).join('')
        : `<div class="tm-cloud-empty">当前范围还没有整改任务，后续可以直接从云端预警一键生成。</div>`;

    tmSetHtml('tmCloudOpsList', `
        <div class="tm-cloud-group">
            <h5>待跟进预警</h5>
            <div class="tm-cloud-stack">${warningHtml}</div>
        </div>
        <div class="tm-cloud-group">
            <h5>整改任务台账</h5>
            <div class="tm-cloud-stack">${taskHtml}</div>
        </div>
    `);

    document.querySelectorAll('[data-tm-warning-ignore]').forEach((btn) => {
        if (btn.dataset.tmBoundIgnore === '1') return;
        btn.dataset.tmBoundIgnore = '1';
        btn.addEventListener('click', async () => {
            await tmIgnoreCloudWarning(btn.dataset.tmWarningIgnore || '');
        });
    });

    document.querySelectorAll('[data-tm-warning-rectify]').forEach((btn) => {
        if (btn.dataset.tmBoundRectify === '1') return;
        btn.dataset.tmBoundRectify = '1';
        btn.addEventListener('click', async () => {
            await tmCreateRectifyTaskFromWarning(btn.dataset.tmWarningRectify || '');
        });
    });
}

async function tmRefreshCloudOps(force = false) {
    const scope = tmGetCurrentGatewayScope();
    const cacheKey = JSON.stringify(scope);
    const hasAuthorizedGateway = !!(window.EdgeGateway && typeof EdgeGateway.canUseAuthorizedRequests === 'function' && EdgeGateway.canUseAuthorizedRequests());

    if (!hasAuthorizedGateway) {
        TM_CLOUD_OPS_CACHE = {
            key: cacheKey,
            fetchedAt: Date.now(),
            warnings: [],
            tasks: [],
            authState: 'missing_token',
            error: ''
        };
        tmRenderCloudOpsPanels(TM_CLOUD_OPS_CACHE);
        if (typeof tmRenderCloudManagementSections === 'function') tmRenderCloudManagementSections();
        return;
    }

    if (!force && TM_CLOUD_OPS_CACHE.key === cacheKey && Date.now() - TM_CLOUD_OPS_CACHE.fetchedAt < 30000) {
        tmRenderCloudOpsPanels(TM_CLOUD_OPS_CACHE);
        if (typeof tmRenderCloudManagementSections === 'function') tmRenderCloudManagementSections();
        return;
    }

    const requestId = ++TM_CLOUD_OPS_REQUEST_ID;
    tmRenderCloudOpsPanels({ authState: 'loading' });
    if (typeof tmRenderCloudManagementSections === 'function') tmRenderCloudManagementSections();

    try {
        const [warningRes, taskRes] = await Promise.all([
            EdgeGateway.listWarnings({ project_key: scope.project_key, cohort_id: scope.cohort_id, limit: 100 }),
            EdgeGateway.listRectifyTasks({ project_key: scope.project_key, cohort_id: scope.cohort_id, limit: 50 })
        ]);

        if (requestId !== TM_CLOUD_OPS_REQUEST_ID) return;

        const warnings = tmFilterCloudRecordsByScope(warningRes?.records, scope, 'school_name');
        const tasks = tmFilterCloudRecordsByScope(taskRes?.records, scope, 'school_name');

        TM_CLOUD_OPS_CACHE = {
            key: cacheKey,
            fetchedAt: Date.now(),
            warnings,
            tasks,
            authState: 'ready',
            error: ''
        };
        tmRenderCloudOpsPanels(TM_CLOUD_OPS_CACHE);
        if (typeof tmRenderCloudManagementSections === 'function') tmRenderCloudManagementSections();
    } catch (error) {
        if (requestId !== TM_CLOUD_OPS_REQUEST_ID) return;
        TM_CLOUD_OPS_CACHE = {
            key: cacheKey,
            fetchedAt: Date.now(),
            warnings: [],
            tasks: [],
            authState: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
        tmRenderCloudOpsPanels(TM_CLOUD_OPS_CACHE);
        if (typeof tmRenderCloudManagementSections === 'function') tmRenderCloudManagementSections();
    }
}

async function tmCreateRectifyTaskFromWarning(warningId) {
    if (!tmCanManageCloudOps()) return;
    const warning = (TM_CLOUD_OPS_CACHE.warnings || []).find((item) => String(item.id || '') === String(warningId || ''));
    if (!warning || !window.EdgeGateway || typeof EdgeGateway.saveRectifyTask !== 'function') return;

    const defaultPlan = '请结合当前预警内容制定整改措施，明确责任人、完成时限和复盘节点。';
    let actionPlan = defaultPlan;
    if (window.Swal && typeof Swal.fire === 'function') {
        const result = await Swal.fire({
            title: '生成整改任务',
            input: 'textarea',
            inputLabel: '整改建议',
            inputValue: defaultPlan,
            inputPlaceholder: '可直接修改整改建议后生成任务',
            showCancelButton: true,
            confirmButtonText: '生成任务',
            cancelButtonText: '取消'
        });
        if (!result.isConfirmed) return;
        actionPlan = String(result.value || '').trim() || defaultPlan;
    }

    const payload = {
        task_type: String(warning.warning_type || 'teacher').trim() || 'teacher',
        title: `[预警整改] ${tmBuildCloudWarningTitle(warning)}`,
        source_warning_id: String(warning.id || '').trim() || null,
        project_key: warning.project_key || tmGetCurrentGatewayScope().project_key,
        cohort_id: warning.cohort_id || tmGetCurrentGatewayScope().cohort_id,
        exam_id: warning.exam_id || null,
        school_name: warning.school_name || tmGetCurrentGatewayScope().school_name || null,
        grade_name: warning.grade_name || null,
        class_name: warning.class_name || null,
        subject_name: warning.subject_name || null,
        teacher_name: warning.teacher_name || null,
        student_name: warning.student_name || null,
        problem_desc: tmBuildCloudWarningDesc(warning),
        action_plan: actionPlan,
        owner_name: warning.teacher_name || null,
        priority: ['critical', 'high'].includes(String(warning.warning_level || '').trim().toLowerCase()) ? 'high' : 'medium',
        status: 'todo',
        progress: 0
    };

    try {
        await EdgeGateway.saveRectifyTask(payload);
        if (window.UI) UI.toast('已生成整改任务', 'success');
        await tmRefreshCloudOps(true);
    } catch (error) {
        if (window.UI) UI.toast(`生成整改任务失败：${error instanceof Error ? error.message : String(error)}`, 'warning');
    }
}

async function tmIgnoreCloudWarning(warningId) {
    if (!tmCanManageCloudOps() || !warningId || !window.EdgeGateway || typeof EdgeGateway.ignoreWarning !== 'function') return;
    try {
        await EdgeGateway.ignoreWarning(warningId);
        if (window.UI) UI.toast('已忽略该条云端预警', 'success');
        await tmRefreshCloudOps(true);
    } catch (error) {
        if (window.UI) UI.toast(`忽略预警失败：${error instanceof Error ? error.message : String(error)}`, 'warning');
    }
}

function tmGetGatewayActorNames() {
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : (window.Auth?.currentUser || null);
    const names = new Set();
    [
        currentUser?.name,
        currentUser?.teacher_name,
        currentUser?.realName,
        currentUser?.username,
        currentUser?.userName
    ].forEach((value) => {
        const text = String(value || '').trim();
        if (text) names.add(text);
    });
    try {
        const raw = sessionStorage.getItem(window.EdgeGateway?.userStorageKey || 'EDGE_GATEWAY_USER_V1');
        const sessionUser = raw ? JSON.parse(raw) : null;
        [sessionUser?.teacher_name, sessionUser?.name, sessionUser?.username].forEach((value) => {
            const text = String(value || '').trim();
            if (text) names.add(text);
        });
    } catch (_) { }
    return Array.from(names);
}

function tmGetCloudScopeText() {
    const scope = tmGetCurrentGatewayScope();
    const schoolText = scope.school_name || '当前届别全部学校';
    return `当前范围：${schoolText} · 届别 ${scope.cohort_id || '未识别'} · 项目 ${scope.project_key || '未识别'}`;
}

function tmBuildCloudObjectScope(row) {
    const parts = [
        row.school_name,
        row.grade_name,
        row.class_name,
        row.subject_name,
        row.teacher_name,
        row.student_name
    ].map((item) => String(item || '').trim()).filter(Boolean);
    return parts.length ? parts.join(' / ') : '当前范围未细分到具体对象';
}

function tmBuildTaskOwnerMeta(row) {
    const parts = [];
    const owner = String(row.owner_name || '').trim();
    const priority = String(row.priority || '').trim();
    const dueDate = String(row.due_date || '').trim();
    const progress = Number(row.progress ?? 0);
    if (owner) parts.push(`负责人：${owner}`);
    if (priority) parts.push(`优先级：${priority}`);
    if (dueDate) parts.push(`截止：${dueDate}`);
    parts.push(`进度：${Number.isFinite(progress) ? progress : 0}%`);
    return parts;
}

function tmGetWarningCenterFilters() {
    return {
        level: String(document.getElementById('tmWarningLevelFilter')?.value || 'all').trim(),
        status: String(document.getElementById('tmWarningStatusFilter')?.value || 'open').trim(),
        type: String(document.getElementById('tmWarningTypeFilter')?.value || 'all').trim()
    };
}

function tmGetRectifyCenterFilters() {
    return {
        status: String(document.getElementById('tmRectifyStatusFilter')?.value || 'open').trim(),
        priority: String(document.getElementById('tmRectifyPriorityFilter')?.value || 'all').trim(),
        owner: String(document.getElementById('tmRectifyOwnerFilter')?.value || 'all').trim()
    };
}

function tmFilterWarningsForCenter(rows) {
    const { level, status, type } = tmGetWarningCenterFilters();
    return (Array.isArray(rows) ? rows : []).filter((row) => {
        const rowLevel = String(row.warning_level || '').trim().toLowerCase();
        const rowStatus = String(row.status || 'open').trim().toLowerCase();
        const rowType = String(row.warning_type || '').trim().toLowerCase();
        if (level !== 'all' && rowLevel !== level) return false;
        if (status !== 'all' && rowStatus !== status) return false;
        if (type !== 'all' && rowType !== type) return false;
        return true;
    });
}

function tmFilterRectifyTasksForCenter(rows) {
    const { status, priority, owner } = tmGetRectifyCenterFilters();
    const actorNames = tmGetGatewayActorNames();
    return (Array.isArray(rows) ? rows : []).filter((row) => {
        const rowStatus = String(row.status || 'todo').trim().toLowerCase();
        const rowPriority = String(row.priority || 'medium').trim().toLowerCase();
        const ownerName = String(row.owner_name || '').trim();
        const assistUsers = Array.isArray(row.assist_users) ? row.assist_users.map((item) => String(item || '').trim()) : [];
        const isMine = actorNames.some((name) => name && (name === ownerName || assistUsers.includes(name)));
        if (status === 'open' && ['done', 'closed'].includes(rowStatus)) return false;
        if (status !== 'all' && status !== 'open' && rowStatus !== status) return false;
        if (priority !== 'all' && rowPriority !== priority) return false;
        if (owner === 'assigned' && !ownerName) return false;
        if (owner === 'unassigned' && ownerName) return false;
        if (owner === 'mine' && !isMine) return false;
        return true;
    });
}

function tmBuildWarningCenterCard(row) {
    const level = tmNormalizeWarningLevel(row.warning_level);
    const scopeText = tmBuildCloudObjectScope(row);
    const meta = [
        `类型：${String(row.warning_type || row.warning_code || '预警').trim() || '预警'}`,
        row.source_module ? `来源：${String(row.source_module).trim()}` : '',
        row.created_at ? `时间：${String(row.created_at).replace('T', ' ').slice(0, 16)}` : ''
    ].filter(Boolean);
    return `
        <div class="tm-center-card warning">
            <div class="tm-center-card-head">
                <div class="tm-center-card-title">${tmEscapeHtml(tmBuildCloudWarningTitle(row))}</div>
                ${tmBuildStatusChip(level.text, level.tone)}
            </div>
            <div class="tm-center-card-scope">${tmEscapeHtml(scopeText)}</div>
            <div class="tm-center-card-desc">${tmEscapeHtml(tmBuildCloudWarningDesc(row))}</div>
            <div class="tm-center-card-meta">
                ${meta.map((item) => `<span class="tm-inline-chip">${tmEscapeHtml(item)}</span>`).join('')}
            </div>
            ${tmCanManageCloudOps() ? `
                <div class="tm-center-card-actions">
                    <button type="button" class="btn btn-orange" data-tm-warning-rectify="${tmEscapeHtml(String(row.id || ''))}">生成整改</button>
                    <button type="button" class="btn btn-secondary" data-tm-warning-ignore="${tmEscapeHtml(String(row.id || ''))}">忽略预警</button>
                </div>
            ` : ''}
        </div>
    `;
}

function tmBuildRectifyCenterCard(row) {
    const state = tmNormalizeTaskStatus(row.status);
    const scopeText = tmBuildCloudObjectScope(row);
    const meta = tmBuildTaskOwnerMeta(row);
    const taskId = tmEscapeHtml(String(row.id || ''));
    const status = String(row.status || 'todo').trim().toLowerCase();
    const canAdvance = tmCanManageCloudOps() && status !== 'doing' && status !== 'done' && status !== 'closed';
    const canFinish = tmCanManageCloudOps() && status !== 'done' && status !== 'closed';
    const canEdit = tmCanManageCloudOps();
    return `
        <div class="tm-center-card task">
            <div class="tm-center-card-head">
                <div class="tm-center-card-title">${tmEscapeHtml(String(row.title || '整改任务'))}</div>
                ${tmBuildStatusChip(state.text, state.tone)}
            </div>
            <div class="tm-center-card-scope">${tmEscapeHtml(scopeText)}</div>
            <div class="tm-center-card-desc">${tmEscapeHtml(tmBuildCloudTaskDesc(row))}</div>
            <div class="tm-center-card-meta">
                ${meta.map((item) => `<span class="tm-inline-chip">${tmEscapeHtml(item)}</span>`).join('')}
            </div>
            ${canAdvance || canFinish || canEdit ? `
                <div class="tm-center-card-actions">
                    ${canAdvance ? `<button type="button" class="btn btn-orange" data-tm-task-status="${taskId}" data-status="doing">推进到进行中</button>` : ''}
                    ${canFinish ? `<button type="button" class="btn btn-green" data-tm-task-status="${taskId}" data-status="done">标记完成</button>` : ''}
                    ${canEdit ? `<button type="button" class="btn btn-secondary" data-tm-task-progress="${taskId}">更新进度</button>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function tmRenderWarningCenter() {
    const container = document.getElementById('tmWarningCenterList');
    if (!container) return;
    const state = TM_CLOUD_OPS_CACHE || { authState: 'unknown', warnings: [] };
    const scopeMeta = document.getElementById('tmWarningScopeMeta');
    if (scopeMeta) scopeMeta.textContent = tmGetCloudScopeText();

    if (String(state.authState || '') === 'missing_token') {
        tmSetHtml('tmWarningSummaryOpen', tmBuildMiniCard('待处理预警', '请重新登录'));
        tmSetHtml('tmWarningSummaryCritical', tmBuildMiniCard('高风险预警', '请重新登录'));
        tmSetHtml('tmWarningSummaryTeacher', tmBuildMiniCard('教师类预警', '请重新登录'));
        tmSetHtml('tmWarningSummaryClass', tmBuildMiniCard('班级类预警', '请重新登录'));
        container.innerHTML = '<div class="tm-cloud-empty">当前浏览器还没有云端网关会话，请重新登录一次系统后再查看异常预警中心。</div>';
        return;
    }

    if (String(state.authState || '') === 'loading') {
        tmSetHtml('tmWarningSummaryOpen', tmBuildMiniCard('待处理预警', '正在同步'));
        tmSetHtml('tmWarningSummaryCritical', tmBuildMiniCard('高风险预警', '正在同步'));
        tmSetHtml('tmWarningSummaryTeacher', tmBuildMiniCard('教师类预警', '正在同步'));
        tmSetHtml('tmWarningSummaryClass', tmBuildMiniCard('班级类预警', '正在同步'));
        container.innerHTML = '<div class="tm-cloud-empty">正在同步云端预警数据，请稍候...</div>';
        return;
    }

    if (String(state.authState || '') === 'error') {
        tmSetHtml('tmWarningSummaryOpen', tmBuildMiniCard('待处理预警', '读取失败'));
        tmSetHtml('tmWarningSummaryCritical', tmBuildMiniCard('高风险预警', '读取失败'));
        tmSetHtml('tmWarningSummaryTeacher', tmBuildMiniCard('教师类预警', '读取失败'));
        tmSetHtml('tmWarningSummaryClass', tmBuildMiniCard('班级类预警', '读取失败'));
        container.innerHTML = `<div class="tm-cloud-empty">云端预警读取失败：${tmEscapeHtml(String(state.error || '未知错误'))}</div>`;
        return;
    }

    const warnings = Array.isArray(state.warnings) ? state.warnings : [];
    const filtered = tmFilterWarningsForCenter(warnings);
    const active = filtered.filter((row) => !['ignored', 'resolved'].includes(String(row.status || '').trim().toLowerCase()));
    const highRisk = filtered.filter((row) => ['high', 'critical'].includes(String(row.warning_level || '').trim().toLowerCase())).length;
    const teacherCount = filtered.filter((row) => String(row.warning_type || '').trim().toLowerCase() === 'teacher').length;
    const classCount = filtered.filter((row) => String(row.warning_type || '').trim().toLowerCase() === 'class').length;

    tmSetHtml('tmWarningSummaryOpen', tmBuildMiniCard('待处理预警', `${active.length} 条`));
    tmSetHtml('tmWarningSummaryCritical', tmBuildMiniCard('高风险预警', `${highRisk} 条`));
    tmSetHtml('tmWarningSummaryTeacher', tmBuildMiniCard('教师类预警', `${teacherCount} 条`));
    tmSetHtml('tmWarningSummaryClass', tmBuildMiniCard('班级类预警', `${classCount} 条`));

    container.innerHTML = filtered.length
        ? filtered.map(tmBuildWarningCenterCard).join('')
        : '<div class="tm-cloud-empty">当前筛选条件下没有匹配的预警记录。</div>';

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
}

function tmRenderRectifyCenter() {
    const container = document.getElementById('tmRectifyCenterList');
    if (!container) return;
    const state = TM_CLOUD_OPS_CACHE || { authState: 'unknown', tasks: [] };
    const scopeMeta = document.getElementById('tmRectifyScopeMeta');
    if (scopeMeta) scopeMeta.textContent = tmGetCloudScopeText();

    if (String(state.authState || '') === 'missing_token') {
        tmSetHtml('tmRectifySummaryOpen', tmBuildMiniCard('未完成任务', '请重新登录'));
        tmSetHtml('tmRectifySummaryDoing', tmBuildMiniCard('进行中任务', '请重新登录'));
        tmSetHtml('tmRectifySummaryDone', tmBuildMiniCard('已完成任务', '请重新登录'));
        tmSetHtml('tmRectifySummaryOverdue', tmBuildMiniCard('临近截止', '请重新登录'));
        container.innerHTML = '<div class="tm-cloud-empty">当前浏览器还没有云端网关会话，请重新登录一次系统后再查看整改任务。</div>';
        return;
    }

    if (String(state.authState || '') === 'loading') {
        tmSetHtml('tmRectifySummaryOpen', tmBuildMiniCard('未完成任务', '正在同步'));
        tmSetHtml('tmRectifySummaryDoing', tmBuildMiniCard('进行中任务', '正在同步'));
        tmSetHtml('tmRectifySummaryDone', tmBuildMiniCard('已完成任务', '正在同步'));
        tmSetHtml('tmRectifySummaryOverdue', tmBuildMiniCard('临近截止', '正在同步'));
        container.innerHTML = '<div class="tm-cloud-empty">正在同步整改任务数据，请稍候...</div>';
        return;
    }

    if (String(state.authState || '') === 'error') {
        tmSetHtml('tmRectifySummaryOpen', tmBuildMiniCard('未完成任务', '读取失败'));
        tmSetHtml('tmRectifySummaryDoing', tmBuildMiniCard('进行中任务', '读取失败'));
        tmSetHtml('tmRectifySummaryDone', tmBuildMiniCard('已完成任务', '读取失败'));
        tmSetHtml('tmRectifySummaryOverdue', tmBuildMiniCard('临近截止', '读取失败'));
        container.innerHTML = `<div class="tm-cloud-empty">云端整改任务读取失败：${tmEscapeHtml(String(state.error || '未知错误'))}</div>`;
        return;
    }

    const tasks = Array.isArray(state.tasks) ? state.tasks : [];
    const filtered = tmFilterRectifyTasksForCenter(tasks);
    const openCount = filtered.filter((row) => !['done', 'closed'].includes(String(row.status || '').trim().toLowerCase())).length;
    const doingCount = filtered.filter((row) => String(row.status || '').trim().toLowerCase() === 'doing').length;
    const doneCount = filtered.filter((row) => String(row.status || '').trim().toLowerCase() === 'done').length;
    const today = new Date();
    const overdueCount = filtered.filter((row) => {
        const dueDate = String(row.due_date || '').trim();
        if (!dueDate) return false;
        const parsed = new Date(`${dueDate}T23:59:59`);
        return !Number.isNaN(parsed.getTime()) && parsed < today && !['done', 'closed'].includes(String(row.status || '').trim().toLowerCase());
    }).length;

    tmSetHtml('tmRectifySummaryOpen', tmBuildMiniCard('未完成任务', `${openCount} 项`));
    tmSetHtml('tmRectifySummaryDoing', tmBuildMiniCard('进行中任务', `${doingCount} 项`));
    tmSetHtml('tmRectifySummaryDone', tmBuildMiniCard('已完成任务', `${doneCount} 项`));
    tmSetHtml('tmRectifySummaryOverdue', tmBuildMiniCard('临近截止', `${overdueCount} 项`));

    container.innerHTML = filtered.length
        ? filtered.map(tmBuildRectifyCenterCard).join('')
        : '<div class="tm-cloud-empty">当前筛选条件下没有整改任务记录。</div>';

    container.querySelectorAll('[data-tm-task-status]').forEach((btn) => {
        if (btn.dataset.tmBoundTaskStatus === '1') return;
        btn.dataset.tmBoundTaskStatus = '1';
        btn.addEventListener('click', async () => {
            await tmUpdateRectifyTaskStatus(btn.dataset.tmTaskStatus || '', btn.dataset.status || '');
        });
    });

    container.querySelectorAll('[data-tm-task-progress]').forEach((btn) => {
        if (btn.dataset.tmBoundTaskProgress === '1') return;
        btn.dataset.tmBoundTaskProgress = '1';
        btn.addEventListener('click', async () => {
            await tmPromptRectifyProgress(btn.dataset.tmTaskProgress || '');
        });
    });
}

function tmRenderCloudManagementSections() {
    tmRenderWarningCenter();
    tmRenderRectifyCenter();
    tmRenderIssueBoard();
}

async function tmUpdateRectifyTaskStatus(taskId, status) {
    if (!taskId || !window.EdgeGateway || typeof EdgeGateway.updateRectifyTask !== 'function') return;
    const nextStatus = String(status || '').trim();
    if (!nextStatus) return;
    try {
        const patch = { id: taskId, status: nextStatus };
        if (nextStatus === 'done') patch.progress = 100;
        await EdgeGateway.updateRectifyTask(patch);
        if (window.UI) UI.toast('整改任务状态已更新', 'success');
        await tmRefreshCloudOps(true);
    } catch (error) {
        if (window.UI) UI.toast(`更新整改任务失败：${error instanceof Error ? error.message : String(error)}`, 'warning');
    }
}

async function tmPromptRectifyProgress(taskId) {
    if (!taskId || !window.EdgeGateway || typeof EdgeGateway.updateRectifyTask !== 'function') return;
    const task = (TM_CLOUD_OPS_CACHE.tasks || []).find((item) => String(item.id || '') === String(taskId));
    if (!task) return;
    let nextProgress = Number(task.progress ?? 0);
    if (window.Swal && typeof Swal.fire === 'function') {
        const result = await Swal.fire({
            title: '更新整改进度',
            input: 'range',
            inputAttributes: { min: 0, max: 100, step: 5 },
            inputValue: String(nextProgress),
            showCancelButton: true,
            confirmButtonText: '保存进度',
            cancelButtonText: '取消'
        });
        if (!result.isConfirmed) return;
        nextProgress = Number(result.value ?? nextProgress);
    } else {
        const raw = prompt('请输入整改进度（0-100）', String(nextProgress));
        if (raw === null) return;
        nextProgress = Number(raw);
    }
    nextProgress = Math.max(0, Math.min(100, Number.isFinite(nextProgress) ? nextProgress : 0));
    try {
        await EdgeGateway.updateRectifyTask({
            id: taskId,
            progress: nextProgress,
            status: nextProgress >= 100 ? 'done' : (String(task.status || '').trim() === 'todo' ? 'doing' : task.status)
        });
        if (window.UI) UI.toast('整改进度已更新', 'success');
        await tmRefreshCloudOps(true);
    } catch (error) {
        if (window.UI) UI.toast(`更新整改进度失败：${error instanceof Error ? error.message : String(error)}`, 'warning');
    }
}

async function tmCreateManualRectifyTask() {
    if (!tmCanManageCloudOps() || !window.EdgeGateway || typeof EdgeGateway.saveRectifyTask !== 'function') return;
    let title = '';
    let actionPlan = '';
    if (window.Swal && typeof Swal.fire === 'function') {
        const titleResult = await Swal.fire({
            title: '新建整改任务',
            input: 'text',
            inputLabel: '任务标题',
            inputPlaceholder: '例如：九年级语文薄弱班级整改',
            showCancelButton: true,
            confirmButtonText: '下一步',
            cancelButtonText: '取消'
        });
        if (!titleResult.isConfirmed) return;
        title = String(titleResult.value || '').trim();
        if (!title) return;
        const planResult = await Swal.fire({
            title: '整改计划',
            input: 'textarea',
            inputLabel: '整改建议',
            inputPlaceholder: '填写整改措施、责任人和复盘节点',
            inputValue: '请结合当前问题制定整改措施，明确责任人、推进节奏和复盘时间。',
            showCancelButton: true,
            confirmButtonText: '保存任务',
            cancelButtonText: '取消'
        });
        if (!planResult.isConfirmed) return;
        actionPlan = String(planResult.value || '').trim();
    } else {
        title = String(prompt('请输入整改任务标题') || '').trim();
        if (!title) return;
        actionPlan = String(prompt('请输入整改计划', '请结合当前问题制定整改措施，明确责任人、推进节奏和复盘时间。') || '').trim();
    }

    const scope = tmGetCurrentGatewayScope();
    try {
        await EdgeGateway.saveRectifyTask({
            title,
            task_type: 'teaching',
            project_key: scope.project_key,
            cohort_id: scope.cohort_id,
            school_name: scope.school_name || null,
            action_plan: actionPlan || null,
            status: 'todo',
            progress: 0
        });
        if (window.UI) UI.toast('已新建整改任务', 'success');
        await tmRefreshCloudOps(true);
        if (typeof switchTab === 'function') switchTab('teaching-rectify-center');
    } catch (error) {
        if (window.UI) UI.toast(`新建整改任务失败：${error instanceof Error ? error.message : String(error)}`, 'warning');
    }
}

window.tmRefreshCloudOps = tmRefreshCloudOps;
window.tmCreateRectifyTaskFromWarning = tmCreateRectifyTaskFromWarning;
window.tmIgnoreCloudWarning = tmIgnoreCloudWarning;
window.tmRenderWarningCenter = tmRenderWarningCenter;
window.tmRenderRectifyCenter = tmRenderRectifyCenter;
window.tmCreateManualRectifyTask = tmCreateManualRectifyTask;

function tmGetOverviewContext() {
    return {
        schoolValue: tmGetSelectRawValue(['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'], String(window.MY_SCHOOL || '').trim()),
        schoolText: tmGetSelectDisplayValue(['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'], String(window.MY_SCHOOL || '').trim() || '未识别'),
        subjectValue: tmGetSelectRawValue(['teacherCompareSubject', 'subjectSelect'], ''),
        subjectText: tmGetSelectDisplayValue(['teacherCompareSubject', 'subjectSelect'], '全部学科'),
        teacherValue: tmGetSelectRawValue(['teacherCompareTeacher', 'teacherNameSelect'], ''),
        teacherText: tmGetSelectDisplayValue(['teacherCompareTeacher', 'teacherNameSelect'], '全部教师'),
        exam1Value: tmGetSelectRawValue(['teacherCompareExam1', 'studentCompareExam1'], ''),
        exam1Text: tmGetSelectDisplayValue(['teacherCompareExam1', 'studentCompareExam1'], '未选择'),
        exam2Value: tmGetSelectRawValue(['teacherCompareExam2', 'studentCompareExam2'], ''),
        exam2Text: tmGetSelectDisplayValue(['teacherCompareExam2', 'studentCompareExam2'], '未选择'),
        periodValue: tmGetSelectRawValue(['teacherComparePeriodCount', 'studentComparePeriodCount'], '2'),
        periodText: tmGetSelectDisplayValue(['teacherComparePeriodCount', 'studentComparePeriodCount'], '2期')
    };
}

function tmJumpToTeachingModule(targetId) {
    const context = tmGetOverviewContext();
    if (typeof switchTab === 'function') switchTab(targetId);

    setTimeout(() => {
        if (targetId === 'teacher-analysis') {
            tmApplySelectValue('teacherCompareSchool', context.schoolValue, context.schoolText);
            tmApplySelectValue('teacherCompareSubject', context.subjectValue, context.subjectText);
            if (typeof updateTeacherCompareTeacherSelect === 'function') updateTeacherCompareTeacherSelect();
            tmApplySelectValue('teacherCompareTeacher', context.teacherValue, context.teacherText);
            tmApplySelectValue('teacherComparePeriodCount', context.periodValue, context.periodText);
            if (typeof updateTeacherCompareExamSelects === 'function') updateTeacherCompareExamSelects();
            tmApplySelectValue('teacherCompareExam1', context.exam1Value, context.exam1Text);
            tmApplySelectValue('teacherCompareExam2', context.exam2Value, context.exam2Text);
            return;
        }

        if (targetId === 'class-comparison') {
            if (typeof updateClassCompSchoolSelect === 'function') updateClassCompSchoolSelect();
            const ok = tmApplySelectValue('classCompSchoolSelect', context.schoolValue, context.schoolText);
            if (ok && typeof renderClassComparison === 'function') renderClassComparison();
            return;
        }

        if (targetId === 'class-diagnosis') {
            if (typeof updateDiagnosisSelects === 'function') updateDiagnosisSelects();
            tmApplySelectValue('diagSchoolSelect', context.schoolValue, context.schoolText);
            const appliedSubject = tmApplySelectValue('diagSubjectSelect', context.subjectValue, context.subjectText);
            if (!appliedSubject) tmApplySelectValue('diagSubjectSelect', 'total', '总分');
            if (typeof renderClassDiagnosis === 'function' && context.schoolValue) renderClassDiagnosis();
            return;
        }

        if (targetId === 'single-school-eval') {
            if (typeof updateSSESchoolSelect === 'function') {
                Promise.resolve(updateSSESchoolSelect()).catch((error) => console.warn(error));
            }
            tmApplySelectValue('sse_school_select', context.schoolValue, context.schoolText);
            if (window.UI && typeof UI.toast === 'function') {
                UI.toast('已带入当前学校，确认后可直接开始绩效计算', 'info');
            }
        }
    }, 60);
}

function tmBuildQuickEntryHtml(icon, title, desc, stateText, tone = 'neutral') {
    return `
        <div class="tm-quick-head">
            <span class="tm-quick-title"><i class="${tmEscapeHtml(icon)}"></i> ${tmEscapeHtml(title)}</span>
            ${tmBuildStatusChip(stateText, tone)}
        </div>
        <div class="tm-quick-desc">${tmEscapeHtml(desc)}</div>
    `;
}

function tmSetQuickEntryState(targetId, icon, title, desc, stateText, tone = 'neutral') {
    const btn = document.querySelector(`#tmQuickEntry [data-target="${targetId}"]`);
    if (!btn) return;
    btn.classList.add('tm-quick-entry-btn');
    btn.innerHTML = tmBuildQuickEntryHtml(icon, title, desc, stateText, tone);
}

function tmRenderQuickEntries(model) {
    tmSetQuickEntryState(
        'teacher-analysis',
        'ti ti-school',
        '教师画像',
        model.teacherReady
            ? (model.teacherInsight.riskTeacherCount > 0 ? `已发现 ${model.teacherInsight.riskTeacherCount} 位风险教师，建议优先查看。` : '任课表和教师画像数据已可直接查看。')
            : '需先同步任课表并生成教师画像。',
        model.teacherReady ? '已就绪' : '待补数据',
        model.teacherReady ? 'ok' : 'warn'
    );
    tmSetQuickEntryState(
        'class-comparison',
        'ti ti-layout-columns',
        '班级对比',
        model.scoreReady && model.schoolReady
            ? `已锁定 ${model.schoolText}，可直接查看班级横向对比。`
            : '需先识别学校并接入成绩数据。',
        model.scoreReady && model.schoolReady ? '可进入' : '待学校',
        model.scoreReady && model.schoolReady ? 'ok' : 'warn'
    );
    tmSetQuickEntryState(
        'class-diagnosis',
        'ti ti-activity',
        '分化诊断',
        model.scoreReady && model.schoolReady
            ? `将沿用当前学校${model.subjectText && model.subjectText !== '全部学科' ? `和学科 ${model.subjectText}` : ''}进入诊断。`
            : '需先有成绩数据，系统才能生成标准差诊断。',
        model.scoreReady && model.schoolReady ? '可诊断' : '待成绩',
        model.scoreReady && model.schoolReady ? 'ok' : 'warn'
    );
    tmSetQuickEntryState(
        'single-school-eval',
        'ti ti-scale',
        '绩效考核',
        model.scoreReady && model.schoolReady
            ? '会自动带入当前学校，进入后确认即可开始计算。'
            : '需先识别学校并准备成绩数据后再计算。',
        model.scoreReady && model.schoolReady ? '可预填' : '待学校',
        model.scoreReady && model.schoolReady ? 'info' : 'warn'
    );
}

function tmRenderNextAction(model) {
    const targetMap = {
        teacher: 'teacher-analysis',
        teacher_sync: 'teacher-analysis',
        score_import: 'teacher-analysis',
        class: 'class-comparison',
        diagnosis: 'class-diagnosis',
        eval: 'single-school-eval'
    };

    let title = '教学入口已就绪';
    let desc = '当前成绩、学校和任课表状态已经满足基本使用条件，可以直接进入分析页面。';
    let stateText = '可直接使用';
    let tone = 'ok';
    let targetKey = 'teacher';

    if (!model.scoreReady) {
        title = '优先补成绩数据';
        desc = '当前届别还没有可用于教学管理的成绩数据，建议先打开教务控制台导入成绩，再进行教师画像和班级分析。';
        stateText = '先导入成绩';
        tone = 'warn';
        targetKey = 'score_import';
    } else if (!model.teacherReady) {
        title = '优先同步任课表';
        desc = '成绩已经到位，但任课表还没有恢复到当前学期。先同步任课表，教师画像和校内绩效口径会更完整。';
        stateText = '先同步任课表';
        tone = 'warn';
        targetKey = 'teacher_sync';
    } else if (model.teacherInsight.riskTeacherCount > 0) {
        title = '优先查看教师画像';
        desc = `当前筛选范围内有 ${model.teacherInsight.riskTeacherCount} 位教师出现风险信号，建议先进入教师教学质量画像定位问题班级与学科。`;
        stateText = '先看教师画像';
        tone = 'warn';
        targetKey = 'teacher';
    } else if (model.compareReady) {
        title = '优先查看班级分化诊断';
        desc = '当前学校、多期数据和任课表都已就绪，适合直接进入班情诊断，查看是否存在明显分化或木桶短板。';
        stateText = '推荐进入诊断';
        tone = 'info';
        targetKey = 'diagnosis';
    } else if (model.schoolReady) {
        title = '优先查看班级横向对比';
        desc = '当前学校已经识别完成，虽然多期条件还未满足，但已经可以先做单次考试的班级横向对比。';
        stateText = '先看班级对比';
        tone = 'info';
        targetKey = 'class';
    }

    tmSetHtml(
        'tmNextAction',
        `
            <div class="tm-next-card">
                <div>
                    <div class="tm-next-title">${tmEscapeHtml(title)}</div>
                    <div class="tm-next-desc">${tmEscapeHtml(desc)}</div>
                    <div class="tm-next-meta">
                        ${tmBuildStatusChip(stateText, tone)}
                        ${model.schoolText ? `<span class="status-chip neutral">${tmEscapeHtml(model.schoolText)}</span>` : ''}
                        ${model.compareReady ? `<span class="status-chip ok">已满足多期条件</span>` : ''}
                    </div>
                </div>
                <button type="button" class="btn tm-next-btn" data-target="${tmEscapeHtml(targetMap[targetKey])}">
                    立即前往
                </button>
            </div>
        `
    );

    const nextBtn = document.querySelector('#tmNextAction .tm-next-btn');
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (targetKey === 'teacher_sync') {
                const syncBtn = document.getElementById('tmQuickSyncTeacherBtn');
                if (syncBtn) syncBtn.click();
                return;
            }
            if (targetKey === 'score_import') {
                const consoleBtn = document.getElementById('tmQuickOpenConsoleBtn');
                if (consoleBtn) consoleBtn.click();
                return;
            }
            tmJumpToTeachingModule(nextBtn.dataset.target);
        };
    }
}

function tmNormalizeFocusIds(focusIds) {
    if (!focusIds) return [];
    const raw = Array.isArray(focusIds) ? focusIds : [focusIds];
    return raw
        .flatMap((item) => String(item || '').split('|'))
        .map((item) => String(item || '').trim())
        .filter(Boolean);
}

function tmIsFocusTargetVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
    if (el.closest('[hidden]')) return false;
    return true;
}

function tmPulseField(el) {
    if (!el) return;
    el.classList.remove('tm-field-flash');
    void el.offsetWidth;
    el.classList.add('tm-field-flash');
    setTimeout(() => el.classList.remove('tm-field-flash'), 1400);
}

function tmFocusStateTarget(focusIds) {
    const ids = tmNormalizeFocusIds(focusIds);
    if (!ids.length) return false;

    const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!targets.length) return false;
    const target = targets.find(tmIsFocusTargetVisible) || targets[0];
    if (!target) return false;

    const details = target.closest('details');
    if (details && !details.open) details.open = true;

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    setTimeout(() => {
        if (typeof target.focus === 'function') {
            try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
        }
        if (target.tagName === 'INPUT' && typeof target.select === 'function') {
            try { target.select(); } catch (_) { }
        }
        tmPulseField(target);
    }, 120);
    return true;
}

function tmBindModuleStateActions(container) {
    if (!container) return;
    container.querySelectorAll('.tm-module-state-item[data-focus-ids]').forEach((item) => {
        if (item.dataset.tmStateBound === '1') return;
        item.dataset.tmStateBound = '1';
        item.addEventListener('click', () => tmFocusStateTarget(item.dataset.focusIds));
    });
}

function tmBuildModuleStateItem(label, value, meta = '', focusIds = null, tone = 'neutral') {
    const ids = tmNormalizeFocusIds(focusIds);
    const isInteractive = ids.length > 0;
    const tag = isInteractive ? 'button' : 'div';
    const attrs = isInteractive
        ? `type="button" class="tm-module-state-item is-interactive tone-${tone}" data-focus-ids="${tmEscapeHtml(ids.join('|'))}" title="点击定位到对应筛选项"`
        : `class="tm-module-state-item tone-${tone}"`;

    return `
        <${tag} ${attrs}>
            <div class="tm-module-state-label">${tmEscapeHtml(label)}</div>
            <div class="tm-module-state-value">${tmEscapeHtml(value || '未设置')}</div>
            ${meta ? `<div class="tm-module-state-meta">${tmEscapeHtml(meta)}</div>` : ''}
            ${isInteractive ? `<div class="tm-module-state-action">点击定位</div>` : ''}
        </${tag}>
    `;
}

function tmRenderModuleStateBar(moduleId) {
    const container = document.getElementById(`tmModuleState-${moduleId}`);
    if (!container) return;

    const statusModel = (window.DataManager && typeof DataManager.getDataManagerStatusModel === 'function')
        ? DataManager.getDataManagerStatusModel()
        : null;
    const exams = tmGetAvailableExamList();
    const teacherCoverage = tmGetTeacherCoverageFromMap();
    const fallbackSchool = readCurrentSchool() || '未识别';
    const teacherStateMap = {
        synced: { text: '已同步并加载', tone: 'ok' },
        synced_unloaded: { text: '已同步待恢复', tone: 'warn' },
        pending: { text: '已导入待同步', tone: 'warn' },
        unknown: { text: '已导入待确认', tone: 'info' },
        missing: { text: '缺任课表', tone: 'warn' }
    };
    const teacherState = teacherStateMap[statusModel?.teachersState]
        || { text: teacherCoverage.mappingCount > 0 ? '已加载' : '缺任课表', tone: teacherCoverage.mappingCount > 0 ? 'ok' : 'warn' };
    const teacherTerm = String(
        statusModel?.teacherSnapshot?.termId
        || readCurrentTeacherTermId()
        || (typeof getPreferredTeacherTermId === 'function' ? getPreferredTeacherTermId() : '')
        || (typeof pickAutoTeacherTerm === 'function' ? pickAutoTeacherTerm() : '')
        || ''
    ).trim() || '未识别';

    let badgeText = '待补数据';
    let badgeTone = 'warn';
    let summary = '当前模块筛选尚未完整';
    let items = [];

    if (moduleId === 'teacher-analysis') {
        const school = tmGetSelectDisplayValue(['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'], fallbackSchool);
        const subject = tmGetSelectDisplayValue(['teacherCompareSubject', 'subjectSelect'], '全部学科');
        const teacher = tmGetSelectDisplayValue(['teacherCompareTeacher', 'teacherNameSelect'], '全部教师');
        const exam1 = tmGetSelectDisplayValue(['teacherCompareExam1', 'studentCompareExam1'], '未选择');
        const exam2 = tmGetSelectDisplayValue(['teacherCompareExam2', 'studentCompareExam2'], '未选择');
        const period = tmGetSelectDisplayValue(['teacherComparePeriodCount', 'studentComparePeriodCount'], '2期');
        let hintText = '当前可直接生成教师画像';
        let hintTone = 'ok';
        let hintFocus = ['teacherCompareSchool', 'teacherCompareExam1'];

        if (!teacherCoverage.mappingCount) {
            hintText = '缺任课表，请先同步任课表';
            hintTone = 'warn';
            hintFocus = ['teacher-sync-cta', 'teacherCompareSchool'];
        } else if (!school || school === '未识别' || school === '未选择') {
            hintText = '缺学校口径，请先选择本校';
            hintTone = 'warn';
            hintFocus = ['teacherCompareSchool', 'mySchoolSelect'];
        } else if (exams.length < 2) {
            hintText = '可对比考试不足 2 期，多期分析会受限';
            hintTone = 'warn';
        }

        badgeText = teacherCoverage.mappingCount > 0 ? '教师画像已就绪' : '待同步任课表';
        badgeTone = teacherCoverage.mappingCount > 0 ? 'ok' : 'warn';
        summary = `任课表 ${teacherCoverage.mappingCount} 条记录，可用考试 ${exams.length} 期`;
        items = [
            tmBuildModuleStateItem('学校', school, school && school !== '未识别' ? '当前教师画像基于该校口径' : '请先识别本校', ['teacherCompareSchool', 'mySchoolSelect']),
            tmBuildModuleStateItem('学科', subject, teacher === '全部教师' ? '当前按学科聚合' : '当前已下钻到教师', 'teacherCompareSubject'),
            tmBuildModuleStateItem('教师', teacher, `当前期数：${period}`, 'teacherCompareTeacher'),
            tmBuildModuleStateItem('第1期 / 第2期', `${exam1} / ${exam2}`, exams.length >= 2 ? `成绩库共 ${exams.length} 期` : '当前可对比考试不足 2 期', ['teacherCompareExam1', 'teacherCompareExam2']),
            tmBuildModuleStateItem('任课表', teacherTerm, `${teacherState.text} · ${statusModel?.teacherSnapshot?.count ?? teacherCoverage.mappingCount} 条记录`, ['teacher-sync-cta', 'teacherCompareSchool']),
            tmBuildModuleStateItem('当前提示', hintText, '点击可回到最相关的筛选项', hintFocus, hintTone)
        ];
    } else if (moduleId === 'class-comparison') {
        const school = tmGetSelectDisplayValue(['classCompSchoolSelect', 'teacherCompareSchool', 'mySchoolSelect'], fallbackSchool);
        const ready = !!school && school !== '未选择' && school !== '未识别' && exams.length > 0;
        const hintText = ready ? '可直接开始对比' : (!school || school === '未识别' || school === '未选择' ? '缺学校，请先选择学校' : '缺成绩库，请先确认成绩数据');

        badgeText = ready ? '班级对比可用' : '待选学校';
        badgeTone = ready ? 'ok' : 'warn';
        summary = ready ? `当前将按 ${school} 的单次成绩做横向对比` : '请先选择学校并确认成绩库';
        items = [
            tmBuildModuleStateItem('学校', school, school && school !== '未识别' ? '班级横向对比仅在校内进行' : '请先选择学校', 'classCompSchoolSelect'),
            tmBuildModuleStateItem('当前成绩库', exams.length ? `${exams.length} 期考试` : '无可用考试', exams.length ? '将优先使用当前考试批次' : '请先导入成绩', 'classCompSchoolSelect'),
            tmBuildModuleStateItem('对比方式', '单次横向对比', '不依赖第1期 / 第2期选择', 'classCompSchoolSelect'),
            tmBuildModuleStateItem('当前提示', hintText, ready ? '点击可回到学校筛选后直接开始对比' : '点击可回到学校筛选项', 'classCompSchoolSelect', ready ? 'ok' : 'warn')
        ];
    } else if (moduleId === 'class-diagnosis') {
        const school = tmGetSelectDisplayValue(['diagSchoolSelect', 'teacherCompareSchool', 'mySchoolSelect'], fallbackSchool);
        const subject = tmGetSelectDisplayValue(['diagSubjectSelect'], '总分');
        const stepValue = tmGetSelectRawValue(['diagStep'], '10');
        const ready = !!school && school !== '未选择' && school !== '未识别' && exams.length > 0;
        const hintText = ready ? '可直接开始诊断' : (!school || school === '未识别' || school === '未选择' ? '缺学校，请先选择学校' : '缺成绩库，请先确认成绩数据');

        badgeText = ready ? '分化诊断可用' : '待补条件';
        badgeTone = ready ? 'ok' : 'warn';
        summary = ready ? `将按 ${school} / ${subject} / ${stepValue} 分档进行诊断` : '请先补齐学校和成绩库';
        items = [
            tmBuildModuleStateItem('学校', school, school && school !== '未识别' ? '当前诊断按校内班级展开' : '请先选择学校', 'diagSchoolSelect'),
            tmBuildModuleStateItem('学科', subject, subject === '总分' ? '当前使用总分口径' : '当前使用单学科口径', 'diagSubjectSelect'),
            tmBuildModuleStateItem('分档步长', `${stepValue || '10'} 分`, '用于标准差与分布可视化', 'diagStep'),
            tmBuildModuleStateItem('成绩库', exams.length ? `${exams.length} 期考试` : '无可用考试', exams.length ? '满足诊断基础数据要求' : '请先导入成绩', 'diagSchoolSelect'),
            tmBuildModuleStateItem('当前提示', hintText, ready ? '点击可回到学校/学科筛选后继续诊断' : '点击可回到最相关筛选项', ['diagSchoolSelect', 'diagSubjectSelect'], ready ? 'ok' : 'warn')
        ];
    } else if (moduleId === 'single-school-eval') {
        const school = tmGetSelectDisplayValue(['sse_school_select', 'teacherCompareSchool', 'mySchoolSelect'], fallbackSchool);
        const enabledMetrics = [
            document.getElementById('sse_check_exc')?.checked ? '优秀率' : '',
            document.getElementById('sse_check_pass')?.checked ? '及格率' : '',
            document.getElementById('sse_check_avg')?.checked ? '均分' : '',
            document.getElementById('sse_check_prog')?.checked ? '生源增值' : ''
        ].filter(Boolean);
        const metricText = enabledMetrics.length ? enabledMetrics.join(' / ') : '未勾选';
        const ready = !!school && school !== '未选择' && school !== '未识别' && exams.length > 0;
        let hintText = '可直接开始计算';
        let hintTone = 'ok';
        let hintFocus = ['sse_school_select'];

        if (!school || school === '未识别' || school === '未选择') {
            hintText = '缺学校，请先选择学校';
            hintTone = 'warn';
        } else if (!enabledMetrics.length) {
            hintText = '缺指标，请至少勾选 1 项';
            hintTone = 'warn';
            hintFocus = ['sse_check_exc', 'sse_check_pass', 'sse_check_avg', 'sse_check_prog'];
        } else if (!exams.length) {
            hintText = '缺成绩库，请先导入成绩';
            hintTone = 'warn';
        }

        badgeText = ready ? '绩效考核可预填' : '待选学校';
        badgeTone = ready ? 'info' : 'warn';
        summary = ready ? `已预填 ${school}，确认后即可开始考核计算` : '请先识别学校并确认成绩库';
        items = [
            tmBuildModuleStateItem('学校', school, school && school !== '未识别' ? '考核只针对当前学校' : '请先选择学校', 'sse_school_select'),
            tmBuildModuleStateItem('成绩库', exams.length ? `${exams.length} 期考试` : '无可用考试', exams.length ? '绩效计算将使用当前成绩库' : '请先导入成绩', 'sse_school_select'),
            tmBuildModuleStateItem('已勾选指标', metricText, enabledMetrics.length ? `共 ${enabledMetrics.length} 项` : '建议至少勾选 1 项', ['sse_check_exc', 'sse_check_pass', 'sse_check_avg', 'sse_check_prog']),
            tmBuildModuleStateItem('当前模式', document.getElementById('sse_check_prog')?.checked ? '含生源增值' : '单次成绩模式', document.getElementById('sse_check_prog')?.checked ? '需要历史数据支撑' : '不依赖历史数据', 'sse_check_prog'),
            tmBuildModuleStateItem('当前提示', hintText, ready ? '点击可回到学校/指标配置后直接开始计算' : '点击可回到最相关配置项', hintFocus, hintTone)
        ];
    }

    container.innerHTML = `
        <div class="tm-module-statebar">
            <div class="tm-module-state-head">
                <div class="tm-module-state-title">当前分析依据</div>
                ${tmBuildStatusChip(badgeText, badgeTone)}
            </div>
            <div class="tm-module-state-meta" style="margin-bottom:12px;">${tmEscapeHtml(summary)}</div>
            <div class="tm-module-state-grid">
                ${items.join('')}
            </div>
        </div>
    `;
    tmBindModuleStateActions(container);
}

function tmRenderTeachingModuleStateBars() {
    bindTeachingOverviewWatchers();
    ['teacher-analysis', 'class-comparison', 'class-diagnosis', 'single-school-eval'].forEach(tmRenderModuleStateBar);
}

function bindTeachingOverviewWatchers() {
    const watchedIds = [
        'teacherCompareSchool',
        'mySchoolSelect',
        'studentSchoolSelect',
        'teacherCompareSubject',
        'subjectSelect',
        'teacherCompareTeacher',
        'teacherNameSelect',
        'teacherCompareExam1',
        'studentCompareExam1',
        'teacherCompareExam2',
        'studentCompareExam2',
        'teacherComparePeriodCount',
        'studentComparePeriodCount',
        'classCompSchoolSelect',
        'diagSchoolSelect',
        'diagSubjectSelect',
        'diagStep',
        'sse_school_select',
        'sse_check_exc',
        'sse_check_pass',
        'sse_check_avg',
        'sse_check_prog'
    ];

    watchedIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.tmOverviewBound === '1') return;
        el.dataset.tmOverviewBound = '1';
        el.addEventListener('change', () => {
            if (typeof renderTeachingOverview === 'function') renderTeachingOverview();
            if (typeof tmRenderTeachingModuleStateBars === 'function') tmRenderTeachingModuleStateBars();
        });
    });
}

function bindTeachingOverviewActions() {
    tmRepairVersionToolbarLayout();

    bindTeachingOverviewWatchers();

    const refreshCloudBtn = document.getElementById('tmRefreshCloudOpsBtn');
    if (refreshCloudBtn && refreshCloudBtn.dataset.tmBound !== '1') {
        refreshCloudBtn.dataset.tmBound = '1';
        refreshCloudBtn.onclick = () => {
            tmRefreshCloudOps(true);
        };
    }

    const syncBtn = document.getElementById('tmQuickSyncTeacherBtn');
    if (syncBtn) {
        syncBtn.onclick = async () => {
            if (typeof openTeacherSync === 'function') await openTeacherSync();
            renderTeachingOverview();
            if (typeof tmRenderTeachingModuleStateBars === 'function') tmRenderTeachingModuleStateBars();
        };
    }

    const consoleBtn = document.getElementById('tmQuickOpenConsoleBtn');
    if (consoleBtn) {
        consoleBtn.onclick = () => {
            if (window.DataManager && typeof DataManager.open === 'function') {
                DataManager.open();
                if (typeof DataManager.switchTab === 'function') DataManager.switchTab('teacher');
                return;
            }
            if (typeof switchTab === 'function') switchTab('teacher-analysis');
        };
    }

    const exportBtn = document.getElementById('tmQuickExportBtn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            if (typeof switchTab === 'function') switchTab('teacher-analysis');
            setTimeout(() => {
                if (typeof exportTeacherAnalysis === 'function') exportTeacherAnalysis();
            }, 120);
        };
    }

    document.querySelectorAll('#tmQuickEntry [data-target]').forEach((btn) => {
        btn.onclick = () => {
            tmJumpToTeachingModule(btn.dataset.target);
        };
    });

    const warningRefreshBtn = document.getElementById('tmWarningCenterRefreshBtn');
    if (warningRefreshBtn && warningRefreshBtn.dataset.tmBound !== '1') {
        warningRefreshBtn.dataset.tmBound = '1';
        warningRefreshBtn.onclick = () => {
            tmRefreshCloudOps(true);
        };
    }

    const rectifyRefreshBtn = document.getElementById('tmRectifyCenterRefreshBtn');
    if (rectifyRefreshBtn && rectifyRefreshBtn.dataset.tmBound !== '1') {
        rectifyRefreshBtn.dataset.tmBound = '1';
        rectifyRefreshBtn.onclick = () => {
            tmRefreshCloudOps(true);
        };
    }

    const rectifyCreateBtn = document.getElementById('tmRectifyCreateBtn');
    if (rectifyCreateBtn && rectifyCreateBtn.dataset.tmBound !== '1') {
        rectifyCreateBtn.dataset.tmBound = '1';
        rectifyCreateBtn.onclick = () => {
            tmCreateManualRectifyTask();
        };
    }

    const issueRefreshBtn = document.getElementById('tmIssueBoardRefreshBtn');
    if (issueRefreshBtn && issueRefreshBtn.dataset.tmBound !== '1') {
        issueRefreshBtn.dataset.tmBound = '1';
        issueRefreshBtn.onclick = () => {
            tmRefreshCloudOps(true);
            tmRenderIssueBoard();
        };
    }

    const versionRefreshBtn = document.getElementById('tmVersionRefreshBtn');
    if (versionRefreshBtn && versionRefreshBtn.dataset.tmBound !== '1') {
        versionRefreshBtn.dataset.tmBound = '1';
        versionRefreshBtn.onclick = () => {
            tmRefreshVersionCenter(true);
        };
    }

    const versionCreateBtn = document.getElementById('tmVersionCreateBtn');
    if (versionCreateBtn && versionCreateBtn.dataset.tmBound !== '1') {
        versionCreateBtn.dataset.tmBound = '1';
        versionCreateBtn.onclick = () => {
            tmCreateCurrentVersionSnapshot();
        };
    }

    const versionCompareStableBtn = document.getElementById('tmVersionCompareStableBtn');
    if (versionCompareStableBtn && versionCompareStableBtn.dataset.tmBound !== '1') {
        versionCompareStableBtn.dataset.tmBound = '1';
        versionCompareStableBtn.onclick = () => {
            const versionId = String(versionCompareStableBtn.dataset.versionId || '').trim();
            if (!versionId) return;
            tmShowVersionDiff(versionId);
        };
    }

    const versionMarkLatestStableBtn = document.getElementById('tmVersionMarkLatestStableBtn');
    if (versionMarkLatestStableBtn && versionMarkLatestStableBtn.dataset.tmBound !== '1') {
        versionMarkLatestStableBtn.dataset.tmBound = '1';
        versionMarkLatestStableBtn.onclick = () => {
            tmMarkLatestVersionStable();
        };
    }

    const versionSearchInput = document.getElementById('tmVersionSearchInput');
    if (versionSearchInput && versionSearchInput.dataset.tmBound !== '1') {
        versionSearchInput.dataset.tmBound = '1';
        versionSearchInput.addEventListener('input', () => {
            tmRenderVersionCenter();
        });
    }

    const versionStableFilter = document.getElementById('tmVersionStableFilter');
    if (versionStableFilter && versionStableFilter.dataset.tmBound !== '1') {
        versionStableFilter.dataset.tmBound = '1';
        versionStableFilter.addEventListener('change', () => {
            tmRenderVersionCenter();
        });
    }

    const versionSortOrder = document.getElementById('tmVersionSortOrder');
    if (versionSortOrder && versionSortOrder.dataset.tmBound !== '1') {
        versionSortOrder.dataset.tmBound = '1';
        versionSortOrder.addEventListener('change', () => {
            tmRenderVersionCenter();
        });
    }

    const versionDiffOnlyBtn = document.getElementById('tmVersionDiffOnlyBtn');
    if (versionDiffOnlyBtn && versionDiffOnlyBtn.dataset.tmBound !== '1') {
        versionDiffOnlyBtn.dataset.tmBound = '1';
        versionDiffOnlyBtn.dataset.active = versionDiffOnlyBtn.dataset.active || '0';
        tmUpdateVersionDiffOnlyButton();
        tmUpdateVersionNormalDiffButton();
        versionDiffOnlyBtn.addEventListener('click', () => {
            versionDiffOnlyBtn.dataset.active = versionDiffOnlyBtn.dataset.active === '1' ? '0' : '1';
            tmUpdateVersionDiffOnlyButton();
            tmUpdateVersionNormalDiffButton();
            tmRenderVersionCenter();
        });
    }

    const versionNormalDiffBtn = document.getElementById('tmVersionNormalDiffBtn');
    if (versionNormalDiffBtn && versionNormalDiffBtn.dataset.tmBound !== '1') {
        versionNormalDiffBtn.dataset.tmBound = '1';
        tmUpdateVersionNormalDiffButton();
        versionNormalDiffBtn.addEventListener('click', () => {
            const stableFilter = document.getElementById('tmVersionStableFilter');
            const versionDiffOnly = document.getElementById('tmVersionDiffOnlyBtn');
            const active = tmUpdateVersionNormalDiffButton();
            if (stableFilter) stableFilter.value = active ? 'all' : 'normal';
            if (versionDiffOnly) versionDiffOnly.dataset.active = active ? '0' : '1';
            tmUpdateVersionDiffOnlyButton();
            tmUpdateVersionNormalDiffButton();
            tmRenderVersionCenter();
        });
    }

    [
        ['tmWarningLevelFilter', tmRenderWarningCenter],
        ['tmWarningStatusFilter', tmRenderWarningCenter],
        ['tmWarningTypeFilter', tmRenderWarningCenter],
        ['tmRectifyStatusFilter', tmRenderRectifyCenter],
        ['tmRectifyPriorityFilter', tmRenderRectifyCenter],
        ['tmRectifyOwnerFilter', tmRenderRectifyCenter]
    ].forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.tmBound !== '1') {
            if (!el) return;
            el.dataset.tmBound = '1';
            el.addEventListener('change', () => {
                if (typeof handler === 'function') handler();
            });
        }
    });
}

function tmRepairVersionToolbarLayout() {
    const versionToolbar = document.querySelector('#teaching-version-center .tm-center-toolbar');
    if (!versionToolbar) return;

    const sortSelect = document.getElementById('tmVersionSortOrder');
    if (sortSelect && !versionToolbar.contains(sortSelect)) {
        const wrap = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = '时间排序';
        wrap.appendChild(label);
        wrap.appendChild(sortSelect);
        versionToolbar.appendChild(wrap);
    }

    const diffBtn = document.getElementById('tmVersionDiffOnlyBtn');
    const normalBtn = document.getElementById('tmVersionNormalDiffBtn');
    if (diffBtn && normalBtn && !versionToolbar.contains(diffBtn)) {
        const outer = document.createElement('div');
        outer.style.display = 'flex';
        outer.style.alignItems = 'flex-end';
        const inner = document.createElement('div');
        inner.style.display = 'flex';
        inner.style.gap = '8px';
        inner.style.flexWrap = 'wrap';
        inner.appendChild(diffBtn);
        inner.appendChild(normalBtn);
        outer.appendChild(inner);
        versionToolbar.appendChild(outer);
    }
}

function renderTeachingOverview() {
    const statusModel = (window.DataManager && typeof DataManager.getDataManagerStatusModel === 'function')
        ? DataManager.getDataManagerStatusModel()
        : null;
    const teacherCoverage = tmGetTeacherCoverageFromMap();
    const exams = tmGetAvailableExamList();
    const selectedSubjectValue = tmGetSelectRawValue(['teacherCompareSubject', 'subjectSelect'], '');
    const selectedTeacherValue = tmGetSelectRawValue(['teacherCompareTeacher', 'teacherNameSelect'], '');
    const teacherInsight = tmBuildTeacherInsight(selectedSubjectValue, selectedTeacherValue);
    const versionDrift = tmBuildVersionDriftState();

    const school = tmGetSelectDisplayValue(
        ['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'],
        String(window.MY_SCHOOL || '').trim() || '未识别'
    );
    const subject = tmGetSelectDisplayValue(['teacherCompareSubject', 'subjectSelect'], '全部学科');
    const teacher = tmGetSelectDisplayValue(['teacherCompareTeacher', 'teacherNameSelect'], '全部教师');
    const exam1 = tmGetSelectDisplayValue(['teacherCompareExam1', 'studentCompareExam1'], '未选择');
    const exam2 = tmGetSelectDisplayValue(['teacherCompareExam2', 'studentCompareExam2'], '未选择');
    const period = tmGetSelectDisplayValue(['teacherComparePeriodCount', 'studentComparePeriodCount'], '2期');
    const examMeta = typeof getExamMetaFromUI === 'function' ? (getExamMetaFromUI() || {}) : {};
    const currentExamText = [
        examMeta.cohortLabel || examMeta.cohortId || '',
        examMeta.gradeLabel || examMeta.grade || '',
        examMeta.year || '',
        examMeta.term || '',
        examMeta.examName || examMeta.name || ''
    ].filter(Boolean).join(' ');
    const currentExam = currentExamText
        || exam1
        || String(readWorkspaceExamId() || window.CURRENT_EXAM_ID || '').trim()
        || '未选择';
    const teacherTerm = String(
        statusModel?.teacherSnapshot?.termId
        || readCurrentTeacherTermId()
        || (typeof getPreferredTeacherTermId === 'function' ? getPreferredTeacherTermId() : '')
        || (typeof pickAutoTeacherTerm === 'function' ? pickAutoTeacherTerm() : '')
        || readCurrentTermId()
        || ''
    ).trim() || '未识别';
    const lastSyncText = String(statusModel?.lastSyncText || '').trim() || '尚未记录';
    const lastSyncSource = String(statusModel?.lastSyncSource || '').trim() || '暂无云端同步记录';

    const versionAuthState = String(TM_VERSION_CACHE?.authState || 'unknown');
    const canShowStableState = tmCanManageVersions() && versionAuthState === 'ready';
    const stableSummary = tmCanManageVersions()
        ? (canShowStableState
            ? (versionDrift.hasStable
                ? (versionDrift.changedCount ? `稳定版有 ${versionDrift.changedCount} 项变化` : '已与稳定版对齐')
                : '尚未设置稳定版')
            : (versionAuthState === 'missing_token' ? '重新登录后可查看稳定版' : '稳定版状态待刷新'))
        : '稳定版状态仅管理角色可见';
    const scoreReady = exams.length > 0;
    const teacherReady = teacherCoverage.mappingCount > 0;
    const schoolReady = !!school && school !== '未识别' && school !== '未选择';
    const compareReady = exams.length >= 2 && exam1 !== '未选择' && exam2 !== '未选择' && exam1 !== exam2;
    const overviewModel = {
        scoreReady,
        teacherReady,
        schoolReady,
        compareReady,
        schoolText: school,
        subjectText: subject,
        teacherInsight
    };

    const teacherStateMap = {
        synced: { text: '已同步并加载', tone: 'ok' },
        synced_unloaded: { text: '已同步待恢复', tone: 'warn' },
        pending: { text: '已导入待同步', tone: 'warn' },
        unknown: { text: '已导入待确认', tone: 'info' },
        missing: { text: '缺任课表', tone: 'warn' }
    };
    const teacherState = teacherStateMap[statusModel?.teachersState] || { text: teacherReady ? '已加载' : '缺任课表', tone: teacherReady ? 'ok' : 'warn' };

    tmSetHtml('tmStatExam', tmBuildStatCard(
        '当前成绩库',
        scoreReady ? '已接入' : '缺成绩',
        scoreReady ? 'ok' : 'warn',
        currentExam,
        `当前届别已识别 ${exams.length} 期考试`
    ));
    tmSetHtml('tmStatTeacher', tmBuildStatCard(
        '当前学期任课表',
        teacherState.text,
        teacherState.tone,
        teacherTerm,
        `任课记录 ${statusModel?.teacherSnapshot?.count ?? teacherCoverage.mappingCount} 条`
    ));
    tmSetHtml('tmStatCompare', tmBuildStatCard(
        '多期对比',
        compareReady ? '可分析' : '待补期数',
        compareReady ? 'ok' : 'warn',
        compareReady ? `${exam1} vs ${exam2}` : '未完成选择',
        `当前可用考试 ${exams.length} 期`
    ));
    tmSetHtml('tmStatSync', tmBuildStatCard(
        '最近同步',
        lastSyncText === '尚未记录' ? '未记录' : '已记录',
        lastSyncText === '尚未记录' ? 'neutral' : 'info',
        lastSyncText,
        `${lastSyncSource} · ${stableSummary}`
    ));

    tmSetHtml('tmCtxSchool', tmBuildMiniCard('学校', school));
    tmSetHtml('tmCtxSubject', tmBuildMiniCard('学科', subject));
    tmSetHtml('tmCtxTeacher', tmBuildMiniCard('教师', teacher));
    tmSetHtml('tmCtxExam1', tmBuildMiniCard('第1期', exam1));
    tmSetHtml('tmCtxExam2', tmBuildMiniCard('第2期', exam2));
    tmSetHtml('tmCtxPeriod', tmBuildMiniCard('期数', period));

    tmSetHtml('tmReadyScore', tmBuildMiniCard('成绩数据', scoreReady ? `已导入 ${exams.length} 期考试` : '未导入'));
    tmSetHtml('tmReadyTeacherMap', tmBuildMiniCard('任课表', teacherReady ? `已加载 ${teacherCoverage.mappingCount} 条记录` : '未加载'));
    tmSetHtml('tmReadySchool', tmBuildMiniCard('本校识别', schoolReady ? school : '未识别'));
    tmSetHtml('tmReadyCompareExam', tmBuildMiniCard('多期对比', compareReady ? '条件已满足' : '还不能对比'));

    const alerts = [];
    if (canShowStableState) {
        if (!versionDrift.hasStable) {
            alerts.push('当前还没有稳定版基线，建议在本轮成绩、任课表和目标人数确认无误后标记一版稳定版。');
        } else if (versionDrift.changedCount > 0) {
            const changeText = versionDrift.topChanges.length
                ? `，主要变化包括：${versionDrift.topChanges.join('、')}${versionDrift.changedCount > versionDrift.topChanges.length ? ' 等' : ''}`
                : '';
            alerts.push(`当前环境相对稳定版已有 ${versionDrift.changedCount} 项变化${changeText}。如需确认影响，可到“版本归档中心”查看差异。`);
        } else {
            alerts.push('当前环境与稳定版保持一致，适合作为日常分析和导出基线。');
        }
    } else if (tmCanManageVersions() && versionAuthState === 'missing_token') {
        alerts.push('当前浏览器还没有云端网关会话，重新登录后可查看稳定版基线和版本差异。');
    }
    if (!scoreReady) alerts.push('当前届别还没有成绩数据，建议先导入成绩。');
    if (!teacherReady) alerts.push('当前学期任课表未加载，建议先同步任课表。');
    if (!schoolReady) alerts.push('当前本校尚未识别完成，部分教学分析会缺少本校口径。');
    if (statusModel?.teachersState === 'synced_unloaded') alerts.push('任课表已经同步成功，但还没有恢复到当前分析页面，可以点击“同步任课表”。');
    if (exams.length < 2) alerts.push('可用于教学对比的考试不足 2 期，多期对比会受限。');
    if (teacherInsight.teacherCount > 0) {
        if (teacherInsight.riskTeacherCount > 0) {
            alerts.push(`当前筛选范围内有 ${teacherInsight.riskTeacherCount} 位教师存在风险信号，其中低分率偏高 ${teacherInsight.lowRiskTeacherCount} 位、公平绩效偏低或基线校正为负 ${teacherInsight.scoreRiskTeacherCount} 位。`);
        } else {
            alerts.push(`当前筛选范围内 ${teacherInsight.teacherCount} 位教师已完成画像分析，暂未发现明显风险信号。`);
        }
        if (teacherInsight.focusSubject && teacherInsight.subjectCount > 1 && teacherInsight.focusSubject.riskCount > 0) {
            alerts.push(`风险更集中在 ${teacherInsight.focusSubject.subjectName}，当前均值低分率约 ${(teacherInsight.focusSubject.avgLowRate * 100).toFixed(1)}%。`);
        }
    } else if (scoreReady && teacherReady) {
        alerts.push('当前核心数据已就绪，但教师画像还未生成，切换到教师教学质量画像后会自动分析。');
    }
    if (!alerts.length) alerts.push('当前教学管理所需的核心数据已就绪，可以直接进入各分析页使用。');

    tmSetHtml(
        'tmAlertList',
        `<ul class="plain-list">${alerts.map((item) => `<li>${tmEscapeHtml(item)}</li>`).join('')}</ul>`
    );

    tmSetHtml('tmSummaryTeacherCount', tmBuildMiniCard('可分析教师', `${teacherInsight.teacherCount || teacherCoverage.teacherCount} 人`));
    tmSetHtml('tmSummaryClassCount', tmBuildMiniCard('覆盖班级', `${teacherInsight.classCount || teacherCoverage.classCount} 个`));
    tmSetHtml('tmSummarySubjectCount', tmBuildMiniCard('风险教师', `${teacherInsight.riskTeacherCount} 人`));
    tmSetHtml('tmSummaryExamCount', tmBuildMiniCard('考试期数', `${exams.length} 期`));

    tmRenderNextAction(overviewModel);
    tmRenderQuickEntries(overviewModel);
    tmRenderTeachingModuleStateBars();
    bindTeachingOverviewActions();
    tmRefreshCloudOps(false);
}

function smSchoolMatches(rowSchool, selectedSchool) {
    const useRowSchool = String(rowSchool || '').trim();
    const useSelectedSchool = String(selectedSchool || '').trim();
    if (!useSelectedSchool) return true;
    if (!useRowSchool) return false;
    if (useRowSchool === useSelectedSchool) return true;
    if (typeof areSchoolNamesEquivalent === 'function') {
        try {
            return !!areSchoolNamesEquivalent(useRowSchool, useSelectedSchool);
        } catch (_) {
            return false;
        }
    }
    return false;
}

function smBuildUniqueStudentCount(rawList, schoolName = '', className = '') {
    const rows = Array.isArray(rawList) ? rawList : [];
    const selectedSchool = String(schoolName || '').trim();
    const selectedClass = normalizeClass(className || '');
    const seen = new Set();

    rows.forEach((row) => {
        if (!row) return;
        if (selectedSchool && !smSchoolMatches(row.school, selectedSchool)) return;
        const rowClass = normalizeClass(row.class || '');
        if (selectedClass && rowClass !== selectedClass) return;
        const key = [
            String(row.school || '').trim(),
            rowClass,
            String(row.name || '').trim()
        ].join('|');
        if (key !== '||') seen.add(key);
    });

    return seen.size;
}

function smBuildMarginalSummary() {
    const source = (window.MARGINAL_STUDENTS && typeof window.MARGINAL_STUDENTS === 'object') ? window.MARGINAL_STUDENTS : {};
    let classCount = 0;
    let total = 0;
    Object.entries(source).forEach(([, subjectMap]) => {
        classCount += 1;
        Object.values(subjectMap || {}).forEach((subjectData) => {
            const excellentList = Array.isArray(subjectData?.excellentMarginal) ? subjectData.excellentMarginal : [];
            const passList = Array.isArray(subjectData?.passMarginal) ? subjectData.passMarginal : [];
            total += excellentList.length + passList.length;
        });
    });
    return { classCount, total };
}

function smGetCurrentStudentContext() {
    const fallbackSchool = readCurrentSchool();
    const schoolValue = tmGetSelectRawValue(
        ['studentSchoolSelect', 'progressSchoolSelect', 'progressCompareSchool', 'marginalSchoolSelect', 'sbSchoolSelect', 'potSchoolSelect', 'segSchoolSelect', 'corrSchoolSelect', 'sel-school'],
        fallbackSchool
    );
    const schoolText = tmGetSelectDisplayValue(
        ['studentSchoolSelect', 'progressSchoolSelect', 'progressCompareSchool', 'marginalSchoolSelect', 'sbSchoolSelect', 'potSchoolSelect', 'segSchoolSelect', 'corrSchoolSelect', 'sel-school'],
        fallbackSchool || '未识别'
    );
    const classValue = tmGetSelectRawValue(['studentClassSelect', 'sbClassSelect', 'sel-class'], '');
    const classText = tmGetSelectDisplayValue(['studentClassSelect', 'sbClassSelect', 'sel-class'], '全部班级');
    const exam1Value = tmGetSelectRawValue(['studentCompareExam1', 'progressCompareExam1'], '');
    const exam1Text = tmGetSelectDisplayValue(['studentCompareExam1', 'progressCompareExam1'], '未选择');
    const exam2Value = tmGetSelectRawValue(['studentCompareExam2', 'progressCompareExam2'], '');
    const exam2Text = tmGetSelectDisplayValue(['studentCompareExam2', 'progressCompareExam2'], '未选择');
    const periodValue = tmGetSelectRawValue(['studentComparePeriodCount', 'progressComparePeriodCount'], '2');
    const periodText = tmGetSelectDisplayValue(['studentComparePeriodCount', 'progressComparePeriodCount'], '2期');
    const focusText = tmGetSelectDisplayValue(['segSubjectSelect'], '总分/综合视角');

    return {
        schoolValue,
        schoolText,
        classValue,
        classText,
        exam1Value,
        exam1Text,
        exam2Value,
        exam2Text,
        periodValue,
        periodText,
        focusText
    };
}

function smBuildOverviewModel() {
    const context = smGetCurrentStudentContext();
    const rawData = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
    const exams = tmGetAvailableExamList();
    const schoolList = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare()
        : Object.keys(window.SCHOOLS || {});
    const selectedClass = normalizeClass(context.classValue || '');
    const fullProgressRows = readProgressCacheFullState();
    const progressRows = fullProgressRows.length
        ? fullProgressRows.slice()
        : readProgressCacheState().slice();
    const progressScopedRows = progressRows.filter((row) => {
        if (context.schoolValue && !smSchoolMatches(row.school, context.schoolValue)) return false;
        if (selectedClass && normalizeClass(row.class || '') !== selectedClass) return false;
        return true;
    });
    const improveCount = progressScopedRows.filter((row) => Number(row.change || 0) > 0).length;
    const declineCount = progressScopedRows.filter((row) => Number(row.change || 0) < 0).length;
    const stableCount = progressScopedRows.filter((row) => Number(row.change || 0) === 0).length;
    const marginalSummary = smBuildMarginalSummary();
    const potentialRows = (Array.isArray(window.POTENTIAL_STUDENTS_CACHE) ? window.POTENTIAL_STUDENTS_CACHE : []).filter((row) => {
        if (context.schoolValue && !smSchoolMatches(row.school, context.schoolValue)) return false;
        if (selectedClass && normalizeClass(row.class || '') !== selectedClass) return false;
        return true;
    });
    const uniqueStudentCount = smBuildUniqueStudentCount(rawData, context.schoolValue, selectedClass);
    const scoreReady = rawData.length > 0 && exams.length > 0;
    const schoolReady = !!context.schoolText && context.schoolText !== '未识别' && context.schoolText !== '未选择';
    const compareReady = exams.length >= 2 && context.exam1Text !== '未选择' && context.exam2Text !== '未选择' && context.exam1Text !== context.exam2Text;
    const progressReady = progressScopedRows.length > 0;
    const supportReady = marginalSummary.total > 0 || potentialRows.length > 0;

    return {
        context,
        exams,
        rawData,
        schoolList,
        uniqueStudentCount,
        scoreReady,
        schoolReady,
        compareReady,
        progressReady,
        supportReady,
        progressCount: progressScopedRows.length,
        improveCount,
        declineCount,
        stableCount,
        marginalClassCount: marginalSummary.classCount,
        marginalRecordCount: marginalSummary.total,
        potentialCount: potentialRows.length
    };
}

function smSetQuickEntryState(button, enabled, hint = '') {
    if (!button) return;
    button.disabled = !enabled;
    button.style.opacity = enabled ? '1' : '0.55';
    button.style.cursor = enabled ? 'pointer' : 'not-allowed';
    button.title = enabled ? '' : hint;
}

function smRenderQuickEntries(model) {
    const states = {
        'student-details': {
            enabled: model.scoreReady,
            hint: '需要先有成绩数据'
        },
        'progress-analysis': {
            enabled: model.scoreReady && model.exams.length >= 2,
            hint: '需要至少 2 期考试数据'
        },
        'marginal-push': {
            enabled: model.scoreReady && model.schoolReady,
            hint: '需要先识别学校并加载成绩'
        },
        'subject-balance': {
            enabled: model.scoreReady && model.schoolReady,
            hint: '需要先识别学校并加载成绩'
        },
        'potential-analysis': {
            enabled: model.scoreReady,
            hint: '需要先有成绩数据'
        },
        'report-generator': {
            enabled: model.scoreReady,
            hint: '需要先有成绩数据'
        }
    };

    document.querySelectorAll('#smQuickEntry [data-target]').forEach((btn) => {
        const config = states[btn.dataset.target] || { enabled: true, hint: '' };
        smSetQuickEntryState(btn, config.enabled, config.hint);
    });

    smSetQuickEntryState(document.getElementById('smQuickStudentBtn'), states['student-details'].enabled, states['student-details'].hint);
    smSetQuickEntryState(document.getElementById('smQuickProgressBtn'), states['progress-analysis'].enabled, states['progress-analysis'].hint);
    smSetQuickEntryState(document.getElementById('smQuickReportBtn'), states['report-generator'].enabled, states['report-generator'].hint);
}

function smJumpToStudentModule(targetId) {
    const context = smGetCurrentStudentContext();
    if (typeof switchTab === 'function') switchTab(targetId);

    setTimeout(() => {
        if (targetId === 'student-details') {
            if (typeof updateStudentSchoolSelect === 'function') updateStudentSchoolSelect();
            if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
            tmApplySelectValue('studentSchoolSelect', context.schoolValue, context.schoolText);
            setTimeout(() => {
                tmApplySelectValue('studentClassSelect', context.classValue, context.classText);
                tmApplySelectValue('studentComparePeriodCount', context.periodValue, context.periodText);
                if (typeof onStudentComparePeriodCountChange === 'function') onStudentComparePeriodCountChange();
                if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
                tmApplySelectValue('studentCompareExam1', context.exam1Value, context.exam1Text);
                tmApplySelectValue('studentCompareExam2', context.exam2Value, context.exam2Text);
                if (context.schoolValue && typeof renderStudentDetails === 'function') renderStudentDetails(true);
            }, 80);
            return;
        }

        if (targetId === 'progress-analysis') {
            if (typeof updateProgressSchoolSelect === 'function') updateProgressSchoolSelect();
            if (typeof updateProgressBaselineSelect === 'function') updateProgressBaselineSelect();
            if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
            tmApplySelectValue('progressSchoolSelect', context.schoolValue, context.schoolText);
            tmApplySelectValue('progressCompareSchool', context.schoolValue, context.schoolText);
            tmApplySelectValue('progressComparePeriodCount', context.periodValue, context.periodText);
            if (typeof onProgressComparePeriodCountChange === 'function') onProgressComparePeriodCountChange();
            if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
            tmApplySelectValue('progressCompareExam1', context.exam1Value, context.exam1Text);
            tmApplySelectValue('progressCompareExam2', context.exam2Value, context.exam2Text);
            if (context.schoolValue && typeof renderProgressAnalysis === 'function') renderProgressAnalysis();
            return;
        }

        if (targetId === 'marginal-push') {
            if (typeof updateMarginalSchoolSelect === 'function') updateMarginalSchoolSelect();
            tmApplySelectValue('marginalSchoolSelect', context.schoolValue, context.schoolText);
            if (context.schoolValue && typeof analyzeMarginalStudents === 'function') analyzeMarginalStudents();
            return;
        }

        if (targetId === 'subject-balance') {
            if (typeof updateSubjectBalanceSelects === 'function') updateSubjectBalanceSelects();
            tmApplySelectValue('sbSchoolSelect', context.schoolValue, context.schoolText);
            setTimeout(() => {
                tmApplySelectValue('sbClassSelect', context.classValue, context.classText);
                if (context.schoolValue && typeof SB_renderTable === 'function') SB_renderTable();
            }, 80);
            return;
        }

        if (targetId === 'potential-analysis') {
            if (typeof updatePotentialSchoolSelect === 'function') updatePotentialSchoolSelect();
            tmApplySelectValue('potSchoolSelect', context.schoolValue || 'ALL', context.schoolText || '全乡镇');
            if (typeof renderPotentialAnalysis === 'function') renderPotentialAnalysis();
            return;
        }

        if (targetId === 'report-generator') {
            if (typeof updateClassSelect === 'function') updateClassSelect();
            tmApplySelectValue('sel-school', context.schoolValue, context.schoolText);
            setTimeout(() => {
                tmApplySelectValue('sel-class', context.classValue, context.classText);
            }, 80);
        }
    }, 120);
}

function bindStudentOverviewActions() {
    const rerender = () => {
        const active = document.getElementById('student-overview');
        if (active && active.classList.contains('active') && typeof renderStudentOverview === 'function') {
            renderStudentOverview();
        }
    };

    const watchIds = [
        'studentSchoolSelect',
        'studentClassSelect',
        'studentCompareExam1',
        'studentCompareExam2',
        'studentComparePeriodCount',
        'progressSchoolSelect',
        'progressCompareSchool',
        'progressCompareExam1',
        'progressCompareExam2',
        'progressComparePeriodCount',
        'marginalSchoolSelect',
        'sbSchoolSelect',
        'sbClassSelect',
        'potSchoolSelect',
        'segSchoolSelect',
        'corrSchoolSelect',
        'sel-school',
        'sel-class'
    ];

    watchIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.smOverviewBound === '1') return;
        el.dataset.smOverviewBound = '1';
        el.addEventListener('change', rerender);
    });

    const topActions = {
        smQuickStudentBtn: 'student-details',
        smQuickProgressBtn: 'progress-analysis',
        smQuickReportBtn: 'report-generator'
    };

    Object.entries(topActions).forEach(([id, target]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.onclick = () => {
            if (!btn.disabled) smJumpToStudentModule(target);
        };
    });

    document.querySelectorAll('#smQuickEntry [data-target]').forEach((btn) => {
        btn.onclick = () => {
            if (!btn.disabled) smJumpToStudentModule(btn.dataset.target || '');
        };
    });
}

function renderStudentOverview() {
    const model = smBuildOverviewModel();
    const { context } = model;

    tmSetHtml('smStatScores', tmBuildStatCard(
        '当前成绩库',
        model.scoreReady ? '已接入' : '缺成绩',
        model.scoreReady ? 'ok' : 'warn',
        model.scoreReady ? `${model.exams.length} 期 / ${model.rawData.length} 条` : '待导入成绩',
        model.scoreReady ? '已识别当前届别的成绩与考试期次' : '请先导入成绩后再进行学情分析'
    ));

    tmSetHtml('smStatScope', tmBuildStatCard(
        '分析范围',
        model.schoolReady ? '已识别' : '待选学校',
        model.schoolReady ? 'ok' : 'warn',
        context.schoolText || '未识别',
        `班级：${context.classText || '全部班级'}`
    ));

    tmSetHtml('smStatProgress', tmBuildStatCard(
        '进退步状态',
        model.progressReady ? '已生成' : '待分析',
        model.progressReady ? 'ok' : 'warn',
        model.progressReady ? `${model.progressCount} 条记录` : '尚未生成进退步结果',
        model.progressReady
            ? `进步 ${model.improveCount} 人 / 退步 ${model.declineCount} 人 / 持平 ${model.stableCount} 人`
            : '进入进退步/增值评价后可自动生成结果'
    ));

    tmSetHtml('smStatSupport', tmBuildStatCard(
        '干预准备',
        model.supportReady ? '已准备' : '待补结果',
        model.supportReady ? 'ok' : 'warn',
        model.supportReady
            ? `边缘生 ${model.marginalRecordCount} 人 / 潜力生 ${model.potentialCount} 人`
            : '边缘生与潜力生名单还未生成',
        `涉及 ${model.marginalClassCount} 个班级的边缘生缓存`
    ));

    tmSetHtml('smCtxSchool', tmBuildMiniCard('学校', context.schoolText || '未识别'));
    tmSetHtml('smCtxClass', tmBuildMiniCard('班级', context.classText || '全部班级'));
    tmSetHtml('smCtxExam1', tmBuildMiniCard('第1期', context.exam1Text || '未选择'));
    tmSetHtml('smCtxExam2', tmBuildMiniCard('第2期', context.exam2Text || '未选择'));
    tmSetHtml('smCtxPeriod', tmBuildMiniCard('期数', context.periodText || '2期'));
    tmSetHtml('smCtxFocus', tmBuildMiniCard('当前聚焦', context.focusText || '总分/综合视角'));

    tmSetHtml('smReadyScore', tmBuildMiniCard('成绩数据', model.scoreReady ? `已导入 ${model.exams.length} 期考试` : '未导入'));
    tmSetHtml('smReadySchool', tmBuildMiniCard('学校范围', model.schoolReady ? context.schoolText : '未识别'));
    tmSetHtml('smReadyProgress', tmBuildMiniCard('进退步结果', model.progressReady ? `已生成 ${model.progressCount} 条` : '未生成'));
    tmSetHtml('smReadySupport', tmBuildMiniCard('干预名单', model.supportReady ? '边缘生/潜力生已准备' : '待生成'));

    const insights = [];
    if (!model.scoreReady) insights.push('当前届别还没有可用于学情诊断的成绩数据，建议先导入成绩。');
    if (!model.schoolReady) insights.push('当前还没有锁定学校范围，部分学情分析会以全范围口径展示。');
    if (model.exams.length < 2) insights.push('可用于学情对比的考试不足 2 期，进退步和多期对比会受限。');
    if (model.progressReady) {
        insights.push(`当前筛选范围内已生成 ${model.progressCount} 条进退步记录，其中进步 ${model.improveCount} 人、退步 ${model.declineCount} 人。`);
    } else if (model.scoreReady) {
        insights.push('成绩已就绪，但还没有生成进退步结果，建议进入“进退步/增值评价”完成一次分析。');
    }
    if (model.marginalRecordCount > 0) {
        insights.push(`边缘生缓存已覆盖 ${model.marginalClassCount} 个班级，共 ${model.marginalRecordCount} 人，可直接进入“临界生精准干预”。`);
    } else if (model.schoolReady && model.scoreReady) {
        insights.push('当前学校还没有边缘生分析结果，可进入“临界生精准干预”快速生成名单。');
    }
    if (model.potentialCount > 0) {
        insights.push(`当前筛选范围内已识别 ${model.potentialCount} 名偏科潜力生，可结合家校沟通继续跟进。`);
    }
    if (!insights.length) insights.push('当前学情诊断所需的数据已经基本就绪，可以直接进入学生明细、进退步和潜力分析模块。');

    tmSetHtml(
        'smInsightList',
        `<ul class="plain-list">${insights.map((item) => `<li>${tmEscapeHtml(item)}</li>`).join('')}</ul>`
    );

    tmSetHtml('smSummarySchools', tmBuildMiniCard('学校数', `${model.schoolList.length} 所`));
    tmSetHtml('smSummaryStudents', tmBuildMiniCard('学生数', `${model.uniqueStudentCount} 人`));
    tmSetHtml('smSummaryProgress', tmBuildMiniCard('进退步记录', `${model.progressCount} 条`));
    tmSetHtml('smSummaryPotential', tmBuildMiniCard('潜力/边缘', `${model.potentialCount + model.marginalRecordCount} 人`));

    smRenderQuickEntries(model);
    bindStudentOverviewActions();
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
            <div class="tm-center-card-desc">低分率 ${(row.lowRate * 100).toFixed(1)}%，及格率 ${(row.passRate * 100).toFixed(1)}%，公平绩效 ${row.fairScore.toFixed(1)}，基线校正 ${row.baselineAdjustment >= 0 ? '+' : ''}${row.baselineAdjustment.toFixed(1)}，转化分 ${row.conversionScore.toFixed(1)}，样本稳定 ${(row.sampleStabilityRate * 100).toFixed(0)}%${row.sampleShiftCount ? `（变动 ${row.sampleShiftCount} 人）` : ''}${row.teacherChangeProtected ? '，已启用换老师保护' : ''}。</div>
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

    return {
        version_name: versionName,
        project_key: scope.project_key,
        cohort_id: scope.cohort_id,
        snapshot_key: readWorkspaceProjectKey() || null,
        exam_scope: exams.map((item) => item.label || item.id).join(' | ') || null,
        score_hash: tmBuildScoreSignature(exams),
        teacher_hash: teacherSignature,
        target_hash: targetsSignature,
        alias_hash: tmBuildAliasSignature(),
        config_hash: `${String(window.CONFIG?.name || '').trim()}|${paramsSignature}`,
        summary_json: {
            school_name: scope.school_name || null,
            exams_count: exams.length,
            score_rows: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            teacher_mappings: teacherCoverage.mappingCount,
            target_schools: Object.keys(targets || {}).length,
            alias_rules: Array.isArray(aliasRows) ? aliasRows.length : 0
        }
    };
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
        renderTeachingOverview();
    }
}

async function tmRefreshVersionCenter(force = false) {
    const scope = tmGetCurrentGatewayScope();
    const cacheKey = `${scope.project_key}::${scope.cohort_id}`;
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

    if (!force && TM_VERSION_CACHE.key === cacheKey && Date.now() - TM_VERSION_CACHE.fetchedAt < 30000) {
        tmRenderVersionCenter();
        tmSyncVersionOverviewState();
        return;
    }

    const requestId = ++TM_VERSION_REQUEST_ID;
    TM_VERSION_CACHE = { key: cacheKey, fetchedAt: Date.now(), records: [], authState: 'loading', error: '' };
    tmRenderVersionCenter();
    tmSyncVersionOverviewState();

    try {
        const res = await EdgeGateway.listVersions({ project_key: scope.project_key, cohort_id: scope.cohort_id, limit: 20 });
        if (requestId !== TM_VERSION_REQUEST_ID) return;
        TM_VERSION_CACHE = {
            key: cacheKey,
            fetchedAt: Date.now(),
            records: Array.isArray(res?.records) ? res.records : [],
            authState: 'ready',
            error: ''
        };
        if (TM_VERSION_DIFF_STATE.versionId && !TM_VERSION_CACHE.records.some((item) => String(item.id || '') === TM_VERSION_DIFF_STATE.versionId)) {
            TM_VERSION_DIFF_STATE = { versionId: '', html: '', title: '' };
        }
        tmRenderVersionCenter();
        tmSyncVersionOverviewState();
    } catch (error) {
        if (requestId !== TM_VERSION_REQUEST_ID) return;
        TM_VERSION_CACHE = {
            key: cacheKey,
            fetchedAt: Date.now(),
            records: [],
            authState: 'error',
            error: error instanceof Error ? error.message : String(error)
        };
        tmRenderVersionCenter();
        tmSyncVersionOverviewState();
    }
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
})();
