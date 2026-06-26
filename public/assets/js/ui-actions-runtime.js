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
    document.getElementById('spotlight-mask').style.display = 'flex';
    document.getElementById('spotlight-input').focus();
}

function closeSpotlight() {
    document.getElementById('spotlight-mask').style.display = 'none';
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
        'export-student-details': () => callGlobal('exportStudentDetails'),
        'render-student-details': () => callGlobal('renderStudentDetails'),
        'generate-mobile-long-image': () => callGlobal('generateMobileLongImage'),
        'generate-inquiry-package': () => callGlobal('generateInquiryPackage'),
        'render-student-multi-period-comparison': () => callGlobal('renderStudentMultiPeriodComparison'),
        'save-student-compare-cloud': () => callGlobal('saveStudentCompareToCloud'),
        'view-cloud-student-compares': () => callGlobal('viewCloudStudentCompares'),
        'export-student-multi-period-comparison': () => callGlobal('exportStudentMultiPeriodComparison'),
        'filter-student-compare-name': () => callGlobal('filterStudentCompareByName'),
        'filter-student-compare-progress': (target) => callGlobal('filterByProgress', target?.dataset?.uiValue || ''),
        'clear-student-compare-filter': () => callGlobal('clearStudentCompareFilter')
    };

    const changeHandlers = {
        'student-compare-period-count': () => callGlobal('onStudentComparePeriodCountChange'),
        'filter-student-compare-class': () => callGlobal('filterStudentCompareByClass'),
        'sort-student-compare': () => callGlobal('sortStudentCompare'),
        'student-compare-page-size': () => callGlobal('changePageSize')
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

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const target = event.target?.closest?.('[data-ui-enter]');
        if (!target) return;
        const action = target.dataset.uiEnter;
        if (!action || !runAction(target, action)) return;
        event.preventDefault();
    });
})();
