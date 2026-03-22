// Performance monitor helpers
window.PerformanceMonitor = {
    getMetrics: function () {
        if (!window.performance || !performance.timing) {
            return { error: '浏览器不支持性能API' };
        }

        const t = performance.timing;
        return {
            DNS解析: t.domainLookupEnd - t.domainLookupStart,
            TCP连接: t.connectEnd - t.connectStart,
            请求响应: t.responseEnd - t.requestStart,
            DOM解析: t.domComplete - t.domLoading,
            页面完全加载: t.loadEventEnd - t.navigationStart,
            白屏时间: t.responseStart - t.navigationStart,
            首屏时间: t.domContentLoadedEventEnd - t.navigationStart
        };
    },

    report: function () {
        const metrics = this.getMetrics();
        console.group('📊 系统性能报告');
        for (const key in metrics) {
            if (typeof metrics[key] === 'number') {
                console.log(`${key}: ${metrics[key]}ms`);
            }
        }
        console.groupEnd();

        if (performance.memory) {
            const memory = performance.memory;
            console.log(`💾 内存使用: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB / ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`);
        }

        return metrics;
    },

    getSuggestions: function () {
        const metrics = this.getMetrics();
        const suggestions = [];

        if (metrics['页面完全加载'] > 5000) {
            suggestions.push('⚠️ 页面加载时间超过5秒，建议优化网络或减少外部资源');
        }
        if (metrics['DOM解析'] > 2000) {
            suggestions.push('⚠️ DOM解析较慢，考虑减少DOM节点或延迟加载非关键内容');
        }
        if (performance.memory && performance.memory.usedJSHeapSize > 100 * 1048576) {
            suggestions.push('⚠️ 内存占用较高(>100MB)，建议定期刷新页面');
        }
        if (suggestions.length === 0) {
            suggestions.push('✅ 系统运行良好，无需优化');
        }

        return suggestions;
    }
};

window.MemoryCleaner = {
    clean: function () {
        console.log('🧹 开始清理内存...');

        if (window.Chart && Chart.instances) {
            Object.values(Chart.instances).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            console.log('✅ 已清理图表实例');
        }

        console.log('💡 建议: 刷新页面以完全释放内存');
        if (confirm('是否刷新页面以完全清理内存?')) {
            location.reload();
        }
    }
};

if (localStorage.getItem('DEV_MODE') === 'true') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            PerformanceMonitor.report();
            PerformanceMonitor.getSuggestions().forEach(s => console.log(s));
        }, 1000);
    });
}

// Mobile dashboard helper
const MobDashboardMgr = {
    init: function () {
        if (window.innerWidth > 768) return;

        console.log('📱 Mobile Dashboard Initialized');

        const date = new Date();
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
        const dateEl = document.getElementById('mob-date-display');
        if (dateEl) dateEl.innerText = dateStr;

        this.checkLoginAndRender();
        setInterval(() => this.checkLoginAndRender(), 2000);
    },

    checkLoginAndRender: function () {
        if (window.innerWidth > 768) return;

        const loginOverlay = document.getElementById('login-overlay');
        const isLogged = loginOverlay && loginOverlay.style.display === 'none';

        if (isLogged) {
            if (window.Auth && Auth.currentUser) {
                const nameEl = document.getElementById('mob-dash-user');
                if (nameEl && nameEl.innerText === '老师') {
                    nameEl.innerText = Auth.currentUser.name || '老师';
                }
            }

            this.renderStats();
        }
    },

    renderStats: function () {
        if (window.Data && window.Data.cleanData && window.Data.cleanData.length > 0) {
            const students = window.Data.cleanData;
            const total = students.length;

            let totalScore = 0;
            let count = 0;
            students.forEach(s => {
                const score = parseFloat(s['总分']);
                if (!isNaN(score)) {
                    totalScore += score;
                    count++;
                }
            });
            const avg = count > 0 ? (totalScore / count).toFixed(1) : '--';
            const classCount = new Set(students.map(s => s['班级'])).size;

            const elTotal = document.getElementById('mob-stat-total');
            const elAvg = document.getElementById('mob-stat-avg');
            const elPass = document.getElementById('mob-stat-pass');

            if (elTotal) elTotal.innerText = total;
            if (elAvg) elAvg.innerText = avg;
            if (elPass) {
                elPass.innerHTML = `${classCount} <span style="font-size:10px;color:#94a3b8">个班</span>`;
                elPass.style.color = '#3b82f6';
            }
        }
    },

    showToast: function (msg) {
        if (window.showToast) window.showToast(msg);
        else alert(msg);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobDashboardMgr.init());
} else {
    MobDashboardMgr.init();
}
