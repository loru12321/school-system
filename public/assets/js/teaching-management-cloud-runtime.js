// Teaching management runtime: cloud warning and rectify task panels.
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

    if (!force && TM_CLOUD_OPS_INFLIGHT && TM_CLOUD_OPS_INFLIGHT_KEY === cacheKey) {
        return TM_CLOUD_OPS_INFLIGHT;
    }

    const requestId = ++TM_CLOUD_OPS_REQUEST_ID;
    tmRenderCloudOpsPanels({ authState: 'loading' });
    if (typeof tmRenderCloudManagementSections === 'function') tmRenderCloudManagementSections();

    const task = (async () => {
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
    })()
        .catch((error) => {
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
        })
        .finally(() => {
            if (TM_CLOUD_OPS_INFLIGHT === task) {
                TM_CLOUD_OPS_INFLIGHT = null;
                TM_CLOUD_OPS_INFLIGHT_KEY = '';
            }
        });

    TM_CLOUD_OPS_INFLIGHT = task;
    TM_CLOUD_OPS_INFLIGHT_KEY = cacheKey;
    return task;
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
window.tmScheduleTeachingOverviewRender = tmScheduleTeachingOverviewRender;
