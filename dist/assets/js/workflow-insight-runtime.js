(function installWorkflowInsightRuntime(global) {
    'use strict';

    const FLOW_CATEGORY_ORDER = ['data', 'town', 'county', 'class', 'student', 'tools'];
    const CALCULATION_POLICY_TAGS = [
        '满分按年级口径',
        '空分按 0 参与',
        '学校别名归一',
        '同班级跨校隔离'
    ];
    const CALCULATION_POLICY_MODULES = new Set([
        'summary',
        'analysis',
        'high-score',
        'indicator',
        'bottom3',
        'county-teacher-portrait',
        'county-school-horizontal',
        'teacher-analysis',
        'student-overview',
        'student-details',
        'blank-score-audit',
        'progress-analysis',
        'cohort-growth'
    ]);

    function ensureWorkflowStyles() {
        if (document.getElementById('workflow-insight-style')) return;
        const style = document.createElement('style');
        style.id = 'workflow-insight-style';
        style.textContent = '.workflow-path{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.workflow-path__step{border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#475569;font:inherit;font-size:12px;padding:6px 8px;cursor:pointer}.workflow-path__step.is-active{border-color:var(--shell-accent,#2563eb);color:#0f172a}.workflow-path__index{color:var(--shell-accent,#2563eb);font-size:11px}.workflow-path__label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.table-affordance-shell{outline:none}.table-affordance-shell:focus{outline:2px solid #93c5fd}.calculation-policy-strip{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px}.calculation-policy-strip__tag{border:1px solid #cbd5e1;border-radius:999px;background:#f8fafc;color:#334155;font-size:12px;font-weight:700;padding:5px 8px}';
        document.head?.appendChild(style);
    }

    function getNav() {
        return global.NAV_STRUCTURE || {};
    }

    function getCurrentCategoryKey() {
        if (typeof global.getCurrentNavCategory === 'function') {
            return global.getCurrentNavCategory();
        }
        return 'data';
    }

    function getActiveSectionId() {
        const active = document.querySelector('.section.active, .section[style*="display: block"]');
        return active ? String(active.id || '').trim() : '';
    }

    function renderWorkflowPath() {
        const nav = getNav();
        const current = getCurrentCategoryKey();
        const targets = [
            document.getElementById('shell-workflow-path'),
            document.getElementById('workspace-drawer-workflow')
        ].filter(Boolean);
        if (!targets.length) return;

        const keys = FLOW_CATEGORY_ORDER.filter((key) => nav[key]);
        const signature = keys.map((key) => `${key}:${nav[key]?.title || key}`).join('|');
        targets.forEach((target) => {
            // This runtime is also watched by a document-level observer below.
            // Replacing innerHTML on every unrelated content mutation made the
            // observer schedule itself forever, keeping the main thread busy
            // after login. Build only when the workflow itself changes; a
            // category switch merely updates the existing active state.
            if (target.dataset.workflowSignature !== signature) {
                target.innerHTML = keys.map((key, index) => {
                    const category = nav[key] || {};
                    const active = key === current ? ' is-active' : '';
                    const title = category.title || key;
                    return `
                        <button type="button" class="workflow-path__step${active}" data-workflow-key="${key}" data-shell-tooltip="${category.summary || title}">
                            <span class="workflow-path__index">${String(index + 1).padStart(2, '0')}</span>
                            <span class="workflow-path__label">${title}</span>
                        </button>`;
                }).join('');
                target.dataset.workflowSignature = signature;
            }
            target.querySelectorAll('[data-workflow-key]').forEach((step) => {
                step.classList.toggle('is-active', step.dataset.workflowKey === current);
            });
        });
    }

    function decorateTableAffordances(root = document) {
        root.querySelectorAll('.analysis-table-shell, .table-wrap').forEach((shell) => {
            if (!shell.querySelector('table')) return;
            shell.classList.add('table-affordance-shell');
            shell.setAttribute('data-table-affordance', 'scroll-sticky-export');
            if (!shell.hasAttribute('tabindex')) shell.setAttribute('tabindex', '0');
            if (!shell.hasAttribute('aria-label')) shell.setAttribute('aria-label', '结果表格，可滚动查看');
        });
    }

    function renderCalculationPolicyStrip(root = document) {
        const sectionId = getActiveSectionId();
        if (!CALCULATION_POLICY_MODULES.has(sectionId)) return;
        const section = document.getElementById(sectionId);
        if (!section || section.querySelector('.calculation-policy-strip')) return;
        const anchor = section.querySelector('.analysis-shell-head, .module-desc-bar, .analysis-inline-panel, .sub-header');
        if (!anchor || !anchor.parentElement) return;
        const strip = document.createElement('div');
        strip.className = 'calculation-policy-strip';
        strip.setAttribute('aria-label', '计算口径');
        strip.innerHTML = CALCULATION_POLICY_TAGS
            .map((label) => `<span class="calculation-policy-strip__tag">${label}</span>`)
            .join('');
        anchor.parentElement.insertBefore(strip, anchor.nextSibling);
    }

    function refreshWorkflowInsights(root = document) {
        ensureWorkflowStyles();
        renderWorkflowPath();
        decorateTableAffordances(root);
        renderCalculationPolicyStrip(root);
    }

    document.addEventListener('click', (event) => {
        const step = event.target.closest('[data-workflow-key]');
        if (!step) return;
        const key = String(step.dataset.workflowKey || '').trim();
        if (key && typeof global.switchNavCategory === 'function') {
            global.switchNavCategory(key);
            global.setTimeout(() => refreshWorkflowInsights(), 80);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        refreshWorkflowInsights();
        global.setTimeout(() => refreshWorkflowInsights(), 250);
    });

    let workflowRefreshScheduled = false;
    function scheduleWorkflowRefresh(root = document) {
        if (workflowRefreshScheduled) return;
        workflowRefreshScheduled = true;
        const run = () => {
            workflowRefreshScheduled = false;
            ensureWorkflowStyles();
            renderWorkflowPath();
            decorateTableAffordances(root);
            renderCalculationPolicyStrip(root);
        };
        if (typeof global.requestIdleCallback === 'function') {
            global.requestIdleCallback(run, { timeout: 800 });
        } else if (typeof global.requestAnimationFrame === 'function') {
            global.requestAnimationFrame(run);
        } else {
            global.setTimeout(run, 80);
        }
    }

    function isRuntimeOwnedNode(node) {
        if (!node || node.nodeType !== 1) return false;
        return !!node.closest?.('.workflow-path, .calculation-policy-strip, #workspace-context-bar, #shell-module-rail-shell, #shell-module-rail-floating-shell');
    }

    function mutationNeedsWorkflowRefresh(mutation) {
        if (!mutation.addedNodes || !mutation.addedNodes.length) return false;
        return Array.from(mutation.addedNodes).some((node) => {
            if (!node || node.nodeType !== 1 || isRuntimeOwnedNode(node)) return false;
            if (node.matches?.('.section, .analysis-table-shell, .table-wrap, .analysis-shell-head')) return true;
            return !!node.querySelector?.('.section, .analysis-table-shell, .table-wrap, .analysis-shell-head');
        });
    }

    const observer = new MutationObserver((mutations) => {
        if (!mutations.some(mutationNeedsWorkflowRefresh)) return;
        const roots = [];
        mutations.forEach((mutation) => {
            mutation.addedNodes && mutation.addedNodes.forEach((node) => {
                if (node && node.nodeType === 1 && !isRuntimeOwnedNode(node)) roots.push(node);
            });
        });
        const root = roots.length === 1 ? roots[0] : document;
        scheduleWorkflowRefresh(root);
    });

    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    global.WorkflowInsightRuntime = Object.freeze({
        renderWorkflowPath,
        decorateTableAffordances,
        renderCalculationPolicyStrip,
        refresh: refreshWorkflowInsights
    });
}(window));
