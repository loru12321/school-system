// 深色模式切换逻辑
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme-dark', isDark);
    // 定义颜色变量
    const textColor = isDark ? '#cbd5e1' : '#666';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    // 更新 Chart.js 全局默认配置
    if (window.Chart) {
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;
    }

    // 刷新页面上已存在的特定图表实例
    // 注意：这里列出了你代码中定义过的所有图表实例变量
    const charts = [
        window.radarChartInstance,
        window.historyChartInstance,
        window.varianceChartInstance,
        window.segmentChartInstance,
        window.balanceChartInstance,
        window.schoolRadarInstance,
        window.schoolDistInstance,
        window.sankeyChartInstance, // 桑基图
        window.trendChartInstance   // 散点图
    ];

    charts.forEach(chart => {
        if (chart) {
            // 更新图表配置
            chart.options.scales.x && (chart.options.scales.x.grid.color = gridColor);
            chart.options.scales.y && (chart.options.scales.y.grid.color = gridColor);

            // 特殊处理雷达图
            if (chart.config.type === 'radar') {
                chart.options.scales.r.grid.color = gridColor;
                chart.options.scales.r.pointLabels.color = textColor;
            }

            chart.update(); // 重绘
        }
    });

    // 提示用户
    if (window.UI) UI.toast(isDark ? "🌙 已切换深色模式" : "☀️ 已切换浅色模式");
}

function openSpotlight() {
    const mask = document.getElementById('spotlight-mask');
    const input = document.getElementById('spotlight-input');
    if (mask) {
        const active = document.activeElement;
        if (active && active !== document.body) mask.__spotlightReturnFocus = active;
        mask.style.display = 'flex';
        mask.classList.add('is-open');
        mask.setAttribute('aria-hidden', 'false');
    }
    if (input) {
        input.value = '';
        input.focus();
    }
    // 命令面板：打开即列出全部模块分组（空查询默认态），无需先输入。
    if (typeof window.doSpotlightSearch === 'function') window.doSpotlightSearch();
}

function closeSpotlight() {
    const mask = document.getElementById('spotlight-mask');
    if (!mask) return;
    mask.style.display = 'none';
    mask.classList.remove('is-open');
    mask.setAttribute('aria-hidden', 'true');
    const returnFocus = mask.__spotlightReturnFocus;
    mask.__spotlightReturnFocus = null;
    if (returnFocus && typeof returnFocus.focus === 'function' && document.contains(returnFocus)) {
        setTimeout(() => returnFocus.focus(), 0);
    }
}

function showCertificate(name, honorType) {
    document.getElementById('cert-name').innerText = name;
    document.getElementById('cert-honor').innerText = honorType;
    document.getElementById('cert-exam-name').innerText = CONFIG.name || "本次考试";
    document.getElementById('cert-school-footer').innerText = MY_SCHOOL || "教务处";
    document.getElementById('cert-date').innerText = new Date().toLocaleDateString();
    document.getElementById('cert-modal').style.display = 'flex';
}

async function downloadCertificate() {
    const area = document.getElementById('cert-capture-area');
    const canvas = await html2canvas(area, { scale: 2 });
    const link = document.createElement('a');
    link.download = `奖状_${document.getElementById('cert-name').innerText}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

(() => {
    if (typeof window === 'undefined' || window.__UI_ACTIONS_DELEGATE_INSTALLED__) return;
    window.__UI_ACTIONS_DELEGATE_INSTALLED__ = true;

    const callGlobal = (name, ...args) => {
        const fn = window[name];
        if (typeof fn !== 'function') {
            console.warn(`[ui-actions] missing handler: ${name}`);
            return undefined;
        }
        return fn(...args);
    };

    const actionHandlers = {
        'mobile-open-upload': () => {
            document.getElementById('mobile-manager-app')?.style.setProperty('display', 'none');
            document.getElementById('app')?.classList.remove('hidden');
            callGlobal('switchTab', 'upload');
        },
        'open-starter-guide': () => callGlobal('openStarterGuide'),
        'open-user-password': () => callGlobal('openUserPasswordModal'),
        'toggle-sidebar': () => callGlobal('toggleAppSidebar'),
        'open-spotlight': () => callGlobal('openSpotlight'),
        'open-admin-issues': () => window.IssueManager?.openAdminPanel?.(),
        'open-admin-accounts': () => callGlobal('openAdminCloudAccountModal'),
        'close-workspace-drawer': () => callGlobal('closeWorkspaceDrawer'),
        'auto-detect-school': () => callGlobal('autoDetectMySchool'),
        'load-demo-data': () => callGlobal('loadDemoData'),
        'switch-tab': (target) => callGlobal('switchTab', target?.dataset?.uiValue || ''),
        'run-auto-diagnosis': () => callGlobal('runAutoDiagnosis'),
        'scan-data-issues': () => callGlobal('scanDataIssues'),
        'run-data-doctor': () => callGlobal('runDataDoctor'),
        'clear-action-logs': () => callGlobal('clearActionLogs'),
        'save-project-snapshot': () => callGlobal('saveProjectSnapshot'),
        'download-template': (target) => callGlobal('downloadTemplate', target?.dataset?.uiValue || ''),
        'add-cohort': () => window.CohortManager?.addFromUI?.(),
        'reset-cohort-selection': () => callGlobal('resetCohortSelection'),
        'set-current-exam-meta': () => callGlobal('setCurrentExamMeta'),
        'archive-current-exam': () => callGlobal('archiveCurrentExam'),
        'unlock-archive': () => callGlobal('unlockArchive'),
        'load-exam-from-select': () => window.CohortDB?.loadExamFromSelect?.(),
        'show-compare-source': () => callGlobal('showMultiCompareDataSourceDiag'),
        'reset-system': () => callGlobal('resetSystem'),
        'create-auto-snapshot': () => callGlobal('createAutoSnapshot', callGlobal('getCurrentSnapshotPayload')),
        'load-cloud-data': () => callGlobal('loadCloudData'),
        'toggle-dark-mode': () => callGlobal('toggleDarkMode'),
        'logout': () => window.Auth?.logout?.(),
        'confirm-logout': () => {
            if (window.confirm('确定退出登录吗？')) window.Auth?.logout?.();
        },
        'mobile-switch-tab': (target) => window.MobMgr?.switchTab?.(target?.dataset?.uiValue || 'home'),
        'mobile-scroll-target': (target) => {
            const id = String(target?.dataset?.uiTarget || '').trim();
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const message = String(target?.dataset?.uiToast || '').trim();
            if (message) window.MobDashboardMgr?.showToast?.(message);
        },
        'mobile-scroll-top': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        'open-cloud-backups': () => {
            window.DataManager?.renderCloudBackups?.();
            document.getElementById('dm-cloud-modal')?.classList.remove('hidden');
        },
        'open-skin-modal': () => callGlobal('openSkinModal'),
        'open-target-editor': () => window.SystemRuntimeLoader?.load('target-editor').then(() => window.openTargetEditor?.()),
        'save-target-editor': () => window.SystemRuntimeLoader?.load('target-editor').then(() => window.saveTargetEditor?.()),
        'toggle-sub-nav': (target) => callGlobal('toggleSubNav', target),
        'exam-switch-view': (target) => callGlobal('EXAM_switchView', target?.dataset?.uiValue || 'overview', target),
        'voice-toggle': () => window.VoiceControl?.toggle?.(),
        'voice-stop': () => window.VoiceControl?.stop?.(),
        'set-theme-color': (target) => callGlobal('setThemeColor', target?.dataset?.uiValue || ''),
        'export-student-details': () => callGlobal('exportStudentDetails'),
        'render-student-details': () => callGlobal('renderStudentDetails'),
        'generate-mobile-long-image': () => callGlobal('generateMobileLongImage'),
        'generate-inquiry-package': () => callGlobal('generateInquiryPackage'),
        // 分析区高频操作统一走声明式委托，避免移动端被内联事件/CSP 拦截。
        'render-horizontal-table': () => callGlobal('renderHorizontalTable'),
        'toggle-horizontal-heatmap': () => callGlobal('toggleTableHeatmap', 'horizontal-table'),
        'export-macro-tables': () => callGlobal('exportMacroTables'),
        'export-horizontal-excel': () => callGlobal('exportHorizontalExcel'),
        'export-high-score-excel': () => callGlobal('exportHighScoreExcel'),
        'export-bottom3': () => callGlobal('exportExcel', 'bottom3'),
        'calc-indicators': () => callGlobal('calcIndicators'),
        'export-indicator': () => callGlobal('exportExcel', 'indicator'),
        'calc-summary': () => callGlobal('calcSummary'),
        'export-summary-table': () => callGlobal('exportSummaryTable'),
        'download-exam-analysis-package': () => callGlobal('downloadExamAnalysisPackage'),
        'render-segment-analysis': () => callGlobal('renderSegmentAnalysis'),
        'export-segment-excel': () => callGlobal('exportSegmentExcel'),
        'switch-value-added-view': (target) => callGlobal('switchValueAddedView', target?.dataset?.uiValue || '', target),
        'export-value-added-excel': () => callGlobal('exportValueAddedExcel'),
        'render-student-multi-period-comparison': () => callGlobal('renderStudentMultiPeriodComparison'),
        'save-student-compare-cloud': () => callGlobal('saveStudentCompareToCloud'),
        'view-cloud-student-compares': () => callGlobal('viewCloudStudentCompares'),
        'export-student-multi-period-comparison': () => callGlobal('exportStudentMultiPeriodComparison'),
        'filter-student-compare-name': () => callGlobal('filterStudentCompareByName'),
        'filter-student-compare-progress': (target) => callGlobal('filterByProgress', target?.dataset?.uiValue || ''),
        'clear-student-compare-filter': () => callGlobal('clearStudentCompareFilter')
    };

    const changeHandlers = {
        'switch-cohort': (target) => window.CohortManager?.switchTo?.(target?.value || ''),
        'refresh-exam-preview': () => {
            callGlobal('refreshExamGradePreview');
            callGlobal('onExamTermChange');
        },
        'load-project-snapshot': (target) => callGlobal('loadProjectSnapshot', target),
        'student-compare-period-count': () => callGlobal('onStudentComparePeriodCountChange'),
        'filter-student-compare-class': () => callGlobal('filterStudentCompareByClass'),
        'sort-student-compare': () => callGlobal('sortStudentCompare'),
        'student-compare-page-size': () => callGlobal('changePageSize')
    };

    const inputHandlers = {
        'mobile-student-search': () => window.MobMgr?.renderStudentList?.()
    };

    function runAction(target, action) {
        const handler = actionHandlers[action] || changeHandlers[action];
        if (typeof handler !== 'function') return false;
        handler(target);
        return true;
    }

    document.addEventListener('click', (event) => {
        const target = event.target?.closest?.('[data-ui-action]');
        if (!target) return;
        const action = target.dataset.uiAction;
        if (!action || !runAction(target, action)) return;
        event.preventDefault();
    });

    document.addEventListener('change', (event) => {
        const target = event.target?.closest?.('[data-ui-change]');
        if (!target) return;
        const action = target.dataset.uiChange;
        if (!action) return;
        runAction(target, action);
    });

    document.addEventListener('input', (event) => {
        const target = event.target?.closest?.('[data-ui-input]');
        if (!target) return;
        const action = target.dataset.uiInput;
        const handler = inputHandlers[action];
        if (typeof handler === 'function') handler(target);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            const actionTarget = event.target?.closest?.('[role="button"][data-ui-action]');
            const action = actionTarget?.dataset?.uiAction;
            if (action && runAction(actionTarget, action)) {
                event.preventDefault();
                return;
            }
        }
        if (event.key !== 'Enter') return;
        const target = event.target?.closest?.('[data-ui-enter]');
        if (!target) return;
        const action = target.dataset.uiEnter;
        if (!action || !runAction(target, action)) return;
        event.preventDefault();
    });
})();
