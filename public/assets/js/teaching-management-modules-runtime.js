(() => {
    if (typeof window === 'undefined' || window.TeachingManagementModulesRuntime) return;

    const MODULE_GROUPS = {
        overview: ['teaching-overview'],
        portrait: ['teacher-analysis'],
        issue: ['teaching-issue-board'],
        warning: ['teaching-warning-center'],
        rectify: ['teaching-rectify-center'],
        version: ['teaching-version-center']
    };

    const MODULE_TITLES = {
        'teaching-overview': '教学管理工作台',
        'teaching-issue-board': '教学问题清单',
        'teaching-warning-center': '质量预警中心',
        'teaching-rectify-center': '整改跟踪中心',
        'teaching-version-center': '版本归档中心'
    };

    const SECTION_IDS = Object.values(MODULE_GROUPS).flat().filter((id) => id !== 'teacher-analysis');

    function getGroupForModule(id) {
        const moduleId = String(id || '').trim();
        return Object.entries(MODULE_GROUPS).find(([, ids]) => ids.includes(moduleId))?.[0] || 'overview';
    }

    function markActiveGroup(id) {
        const group = getGroupForModule(id);
        document.body.dataset.teachingManagementGroup = group;
        return group;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildHero(title, desc, icon = 'ti-layout-dashboard') {
        return `
            <div class="analysis-hero">
                <div>
                    <span class="analysis-kicker"><i class="ti ${escapeHtml(icon)}"></i> Teaching Ops</span>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(desc)}</p>
                </div>
                <div class="analysis-actions tm-overview-actions">
                    <button type="button" class="btn btn-secondary" onclick="switchTab('teacher-analysis')">
                        <i class="ti ti-school"></i> 教师画像
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="switchTab('teaching-overview')">
                        <i class="ti ti-layout-dashboard"></i> 回到工作台
                    </button>
                </div>
            </div>
        `;
    }

    function buildPanel(title, innerHtml, actionHtml = '') {
        return `
            <div class="analysis-inline-panel">
                <div class="tm-section-head">
                    <h4>${escapeHtml(title)}</h4>
                    ${actionHtml}
                </div>
                ${innerHtml}
            </div>
        `;
    }

    function buildOverviewSection() {
        return `
            ${buildHero('教学管理工作台', '把成绩库、任课表、对比条件、云端预警和下一步动作拆开汇总，先判断该进哪个子模块。', 'ti-layout-dashboard')}
            <div class="tm-overview-card-grid analysis-board-grid">
                <div id="tmStatExam" class="tm-overview-slot"></div>
                <div id="tmStatTeacher" class="tm-overview-slot"></div>
                <div id="tmStatCompare" class="tm-overview-slot"></div>
                <div id="tmStatSync" class="tm-overview-slot"></div>
            </div>
            ${buildPanel('下一步建议', '<div id="tmNextAction"></div>')}
            ${buildPanel('当前筛选口径', '<div class="tm-context-grid"><div id="tmCtxSchool"></div><div id="tmCtxSubject"></div><div id="tmCtxTeacher"></div><div id="tmCtxExam1"></div><div id="tmCtxExam2"></div><div id="tmCtxPeriod"></div></div>')}
            ${buildPanel('准备度检查', '<div class="tm-readiness-grid"><div id="tmReadyScore"></div><div id="tmReadyTeacherMap"></div><div id="tmReadySchool"></div><div id="tmReadyCompareExam"></div></div>')}
            ${buildPanel('风险与提示', '<div id="tmAlertList" class="tm-cloud-empty">正在读取教学管理状态...</div>')}
            ${buildPanel('子模块快切', `
                <div id="tmQuickEntry" class="tm-quick-grid">
                    <button type="button" data-target="teacher-analysis">教师画像</button>
                    <button type="button" data-target="teaching-issue-board">问题清单</button>
                    <button type="button" data-target="teaching-warning-center">质量预警</button>
                    <button type="button" data-target="teaching-rectify-center">整改跟踪</button>
                    <button type="button" data-target="teaching-version-center">版本归档</button>
                </div>
            `)}
            ${buildPanel('汇总数量', '<div class="tm-summary-grid"><div id="tmSummaryTeacherCount"></div><div id="tmSummaryClassCount"></div><div id="tmSummarySubjectCount"></div><div id="tmSummaryExamCount"></div></div>')}
            ${buildPanel('快捷动作', `
                <div class="tm-center-toolbar">
                    <button type="button" class="btn btn-blue" id="tmRefreshCloudOpsBtn"><i class="ti ti-refresh"></i> 刷新云端状态</button>
                    <button type="button" class="btn btn-green" id="tmQuickSyncTeacherBtn"><i class="ti ti-users"></i> 同步任课表</button>
                    <button type="button" class="btn btn-secondary" id="tmQuickOpenConsoleBtn"><i class="ti ti-database"></i> 打开教务控制台</button>
                    <button type="button" class="btn btn-orange" id="tmQuickExportBtn"><i class="ti ti-download"></i> 导出教师画像</button>
                </div>
            `)}
        `;
    }

    function buildIssueSection() {
        return `
            ${buildHero('教学问题清单', '把教师风险、云端预警和整改任务收成一个清单，便于主任快速定位优先级。', 'ti-clipboard-list')}
            ${buildPanel('问题概览', '<div class="tm-center-summary-grid"><div id="tmIssueSummaryTeacherRisk"></div><div id="tmIssueSummaryWarnings"></div><div id="tmIssueSummaryTasks"></div><div id="tmIssueSummaryFocus"></div></div>', '<button type="button" class="btn btn-blue" id="tmIssueBoardRefreshBtn"><i class="ti ti-refresh"></i> 刷新清单</button>')}
            <div id="tmIssueBoardList" class="tm-center-list"><div class="tm-cloud-empty">正在整理教学问题清单...</div></div>
        `;
    }

    function buildWarningSection() {
        return `
            ${buildHero('质量预警中心', '集中查看云端结构化预警，按风险等级、状态和类型过滤。', 'ti-alert-triangle')}
            ${buildPanel('预警筛选', `
                <div class="tm-center-toolbar">
                    <div><label for="tmWarningLevelFilter">风险等级</label><select id="tmWarningLevelFilter"><option value="all">全部等级</option><option value="critical">严重预警</option><option value="high">高风险</option><option value="medium">中风险</option><option value="low">低风险</option></select></div>
                    <div><label for="tmWarningStatusFilter">状态</label><select id="tmWarningStatusFilter"><option value="open">待处理</option><option value="all">全部状态</option><option value="resolved">已解决</option><option value="ignored">已忽略</option></select></div>
                    <div><label for="tmWarningTypeFilter">类型</label><select id="tmWarningTypeFilter"><option value="all">全部类型</option><option value="teacher">教师类</option><option value="class">班级类</option><option value="student">学生类</option><option value="score">成绩类</option></select></div>
                    <button type="button" class="btn btn-blue" id="tmWarningCenterRefreshBtn"><i class="ti ti-refresh"></i> 刷新预警</button>
                </div>
                <div id="tmWarningScopeMeta" class="tm-center-scope"></div>
            `)}
            ${buildPanel('预警概览', '<div class="tm-center-summary-grid"><div id="tmWarningSummaryOpen"></div><div id="tmWarningSummaryCritical"></div><div id="tmWarningSummaryTeacher"></div><div id="tmWarningSummaryClass"></div></div>')}
            <div id="tmWarningCenterList" class="tm-center-list"><div class="tm-cloud-empty">正在读取质量预警...</div></div>
        `;
    }

    function buildRectifySection() {
        return `
            ${buildHero('整改跟踪中心', '把预警转成任务，并按状态、优先级、负责人持续跟进。', 'ti-checkup-list')}
            ${buildPanel('整改筛选', `
                <div class="tm-center-toolbar">
                    <div><label for="tmRectifyStatusFilter">任务状态</label><select id="tmRectifyStatusFilter"><option value="open">未完成</option><option value="all">全部状态</option><option value="todo">待处理</option><option value="doing">进行中</option><option value="done">已完成</option><option value="closed">已关闭</option></select></div>
                    <div><label for="tmRectifyPriorityFilter">优先级</label><select id="tmRectifyPriorityFilter"><option value="all">全部优先级</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></div>
                    <div><label for="tmRectifyOwnerFilter">负责人</label><select id="tmRectifyOwnerFilter"><option value="all">全部负责人</option><option value="mine">与我相关</option><option value="assigned">已指派</option><option value="unassigned">未指派</option></select></div>
                    <button type="button" class="btn btn-green" id="tmRectifyCreateBtn"><i class="ti ti-plus"></i> 新建整改</button>
                    <button type="button" class="btn btn-blue" id="tmRectifyCenterRefreshBtn"><i class="ti ti-refresh"></i> 刷新任务</button>
                </div>
                <div id="tmRectifyScopeMeta" class="tm-center-scope"></div>
            `)}
            ${buildPanel('整改概览', '<div class="tm-center-summary-grid"><div id="tmRectifySummaryOpen"></div><div id="tmRectifySummaryDoing"></div><div id="tmRectifySummaryDone"></div><div id="tmRectifySummaryOverdue"></div></div>')}
            <div id="tmRectifyCenterList" class="tm-center-list"><div class="tm-cloud-empty">正在读取整改任务...</div></div>
        `;
    }

    function buildVersionSection() {
        return `
            ${buildHero('版本归档中心', '为成绩库、任课表、目标人数和别名规则保存结构化基线，方便回看差异。', 'ti-versions')}
            ${buildPanel('版本操作', `
                <div class="tm-center-toolbar">
                    <div><label for="tmVersionSearchInput">搜索版本</label><input id="tmVersionSearchInput" type="search" placeholder="版本名、创建人、范围"></div>
                    <div><label for="tmVersionStableFilter">版本类型</label><select id="tmVersionStableFilter"><option value="all">全部版本</option><option value="stable">稳定版</option><option value="normal">普通版</option></select></div>
                    <div><label for="tmVersionSortOrder">时间排序</label><select id="tmVersionSortOrder"><option value="desc">最新优先</option><option value="asc">最早优先</option></select></div>
                    <div class="tm-toolbar-actions"><div class="tm-toolbar-button-row"><button type="button" class="btn btn-blue" id="tmVersionRefreshBtn"><i class="ti ti-refresh"></i> 刷新版本</button><button type="button" class="btn btn-green" id="tmVersionCreateBtn"><i class="ti ti-plus"></i> 生成当前版本</button><button type="button" class="btn btn-orange" id="tmVersionMarkLatestStableBtn"><i class="ti ti-star"></i> 最新设为稳定版</button></div></div>
                    <div class="tm-toolbar-actions"><div class="tm-toolbar-button-row"><button type="button" class="btn btn-secondary" id="tmVersionDiffOnlyBtn" data-active="0">只看有差异</button><button type="button" class="btn btn-secondary" id="tmVersionNormalDiffBtn">普通版差异</button></div></div>
                </div>
                <div id="tmVersionScopeMeta" class="tm-center-scope"></div>
                <div id="tmVersionStableMeta" class="tm-center-scope"></div>
                <button type="button" class="btn btn-secondary" id="tmVersionCompareStableBtn" style="display:none;"></button>
            `)}
            ${buildPanel('当前环境', '<div class="tm-center-summary-grid"><div id="tmVersionSummaryCurrent"></div><div id="tmVersionSummaryScores"></div><div id="tmVersionSummaryTeachers"></div><div id="tmVersionSummaryTargets"></div></div>')}
            ${buildPanel('版本差异', '<div id="tmVersionDiffEmpty" class="tm-cloud-empty">选择一个版本后可查看与当前环境的差异。</div><div id="tmVersionDiffPanel" class="tm-version-diff-panel" style="display:none;"></div>')}
            <div id="tmVersionCenterList" class="tm-center-list"><div class="tm-cloud-empty">正在读取版本归档...</div></div>
        `;
    }

    function buildSectionContent(id) {
        if (id === 'teaching-overview') return buildOverviewSection();
        if (id === 'teaching-issue-board') return buildIssueSection();
        if (id === 'teaching-warning-center') return buildWarningSection();
        if (id === 'teaching-rectify-center') return buildRectifySection();
        if (id === 'teaching-version-center') return buildVersionSection();
        return '';
    }

    function createSection(id) {
        const section = document.createElement('div');
        const versionClass = id === 'teaching-version-center' ? ' analysis-workspace-version' : '';
        section.id = id;
        section.className = `section card-box analysis-workspace analysis-workspace-management${versionClass}`;
        section.dataset.teachingManagementSection = 'true';
        section.setAttribute('aria-label', MODULE_TITLES[id] || id);
        section.innerHTML = buildSectionContent(id);
        return section;
    }

    function findInsertionAnchor() {
        return document.getElementById('teacher-analysis')
            || document.getElementById('county-analysis')
            || document.querySelector('.section');
    }

    function ensureTeachingManagementSections() {
        const anchor = findInsertionAnchor();
        if (!anchor || !anchor.parentNode) return false;
        let previous = anchor;
        SECTION_IDS.forEach((id) => {
            let section = document.getElementById(id);
            if (!section) {
                section = createSection(id);
                previous.parentNode.insertBefore(section, previous.nextSibling);
            } else if (section.dataset.teachingManagementSection !== 'true') {
                section.dataset.teachingManagementSection = 'true';
            }
            previous = section;
        });
        return true;
    }

    function refreshTeachingManagementAfterSwitch(moduleId) {
        markActiveGroup(moduleId);
        if (typeof window.bindTeachingOverviewActions === 'function') {
            window.bindTeachingOverviewActions();
        }
        if (typeof window.tmRenderTeachingModuleStateBars === 'function') {
            window.tmRenderTeachingModuleStateBars(moduleId);
        }
    }

    function install() {
        ensureTeachingManagementSections();
        if (window.__TEACHING_MANAGEMENT_MODULES_INSTALLED__) return;
        window.__TEACHING_MANAGEMENT_MODULES_INSTALLED__ = true;
        const originalSwitchTab = window.switchTab;
        if (typeof originalSwitchTab === 'function') {
            window.switchTab = function patchedTeachingSwitchTab(id, ...rest) {
                const moduleId = String(id || '').trim();
                ensureTeachingManagementSections();
                const result = originalSwitchTab.call(this, id, ...rest);
                if (MODULE_TITLES[moduleId] || moduleId === 'teacher-analysis') {
                    refreshTeachingManagementAfterSwitch(moduleId);
                }
                return result;
            };
        }
    }

    window.TeachingManagementModulesRuntime = {
        MODULE_GROUPS,
        getGroupForModule,
        markActiveGroup,
        ensureTeachingManagementSections,
        install
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install, { once: true });
    } else {
        install();
    }
})();
