// 「本次决策摘要」的轻量交互层。
//
// 摘要本身只读取各分析模块已经算好的结果；本文件只为每条摘要补一个可追溯的
// 「核对」入口。入口固定指向系统内已存在的模块/锚点，绝不产生新指标、修改数据，
// 也不绕过模块权限。
(function installDecisionBriefRuntime(global) {
    'use strict';

    if (!global || global.__DECISION_BRIEF_RUNTIME__) return;
    global.__DECISION_BRIEF_RUNTIME__ = true;

    const ACTIONS = {
        'summary-highlights': [
            { match: '综合评价总排名', label: '核对总排名', target: 'tb-summary' },
            { match: '两率一分三项名次', label: '查看两率一分', module: 'analysis', target: 'anchor-total' },
            { match: '后段学生', label: '查看后段学生', module: 'bottom3' },
            { match: '临界学生', label: '查看临界学生', module: 'marginal-push' }
        ],
        'analysis-highlights': [
            { match: '两率一分三项名次', label: '核对全科表', target: 'anchor-total' },
            { match: '两率一分逐项对比', label: '查看各科明细', target: 'two-rate-table-jumpbar' },
            { match: '优秀率（同校各科对比）', label: '查看各科明细', target: 'two-rate-table-jumpbar' }
        ],
        'teacher-highlights': [
            { match: '教师表现（riskLevel）', label: '查看教师明细', target: 'anchor-cards' },
            { match: '教师表现（样本提示）', label: '查看样本提示', target: 'anchor-cards' },
            { match: '教师表现', label: '查看教师卡片', target: 'anchor-cards' }
        ]
    };

    function canUseModule(moduleId) {
        if (!moduleId) return true;
        return typeof global.canAccessModule !== 'function' || global.canAccessModule(moduleId);
    }

    function resolveAction(containerId, source) {
        const candidates = ACTIONS[String(containerId || '')] || [];
        const matched = candidates.find((candidate) => String(source || '').includes(candidate.match));
        if (!matched || !canUseModule(matched.module)) return null;
        return { ...matched };
    }

    function focusTarget(targetId) {
        const id = String(targetId || '').trim();
        if (!id) return;
        if (typeof global.scrollToAnchor === 'function') {
            global.scrollToAnchor(id);
            return;
        }
        const target = global.document?.getElementById(id);
        if (target && typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function runAction(action) {
        if (!action) return;
        if (!action.module || typeof global.switchTab !== 'function') {
            focusTarget(action.target);
            return;
        }

        // switchTab 可能同步，也可能在懒加载模块时返回 Promise；两种情况都在切换完成后
        // 再定位，避免用户被带到尚未挂载的空容器。
        Promise.resolve(global.switchTab(action.module))
            .catch((error) => console.warn('[decision-brief] 打开核对模块失败:', error))
            .finally(() => {
                if (action.target) global.setTimeout(() => focusTarget(action.target), 80);
            });
    }

    function decorateContainer(container) {
        if (!container || container.hidden) return;
        const containerId = String(container.id || '').trim();
        if (!containerId) return;

        container.querySelectorAll('.summary-highlights-item[data-insight-source]').forEach((item) => {
            if (item.querySelector('.decision-brief-action')) return;
            const action = resolveAction(containerId, item.dataset.insightSource);
            if (!action) return;

            const button = global.document.createElement('button');
            button.type = 'button';
            button.className = 'decision-brief-action';
            button.textContent = action.label;
            button.setAttribute('aria-label', `${action.label}（来源：${item.dataset.insightSource}）`);
            button.addEventListener('click', () => runAction(action));

            const meta = item.querySelector('.summary-highlights-meta');
            (meta || item).appendChild(button);
        });
    }

    function refresh(containerId = '') {
        if (!global.document) return;
        if (containerId) {
            decorateContainer(global.document.getElementById(containerId));
            return;
        }
        Object.keys(ACTIONS).forEach((id) => decorateContainer(global.document.getElementById(id)));
    }

    global.addEventListener('school:decision-brief-render', (event) => {
        refresh(event?.detail?.containerId);
    });

    if (global.document?.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', () => refresh(), { once: true });
    } else {
        refresh();
    }

    global.DecisionBriefRuntime = Object.freeze({
        refresh,
        resolveAction,
        runAction
    });
}(window));
