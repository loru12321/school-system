// Display-only disclosures. Keep original panels and their event handlers in place.
(() => {
    if (typeof window === 'undefined' || window.__COMPARISON_PANEL_COLLAPSE_RUNTIME__) return;
    window.__COMPARISON_PANEL_COLLAPSE_RUNTIME__ = true;
    const COMPARISONS = '.analysis-inline-panel, .town-submodule-compare-panel, .student-details-secondary-flow';
    const STATIC_BANDS = ['correlation-analysis', 'marginal-push', 'potential-analysis', 'mutual-aid', 'seat-adjustment']
        .map(id => `#${id} > .analysis-info-band`).join(', ');
    const GUIDANCE = `.analysis-flow-banner, .analysis-action-note, .analysis-side-note, .report-query-copy, [data-auxiliary-policy], ${STATIC_BANDS}`;
    const POLICIES = `.calculation-policy-strip, details.analysis-doc-panel, ${GUIDANCE}`;
    const BRIEFS = '#summary-highlights, #analysis-highlights, #teacher-highlights';
    const CONTENT = `${COMPARISONS}, ${POLICIES}, .analysis-table-meta, .marginal-cycle-panel, #grade-scheduler .constraints-box, ${BRIEFS}`;
    const states = new WeakMap();
    let nextId = 0;

    function isComparisonPanel(panel) {
        if (panel.dataset.compareCollapsibleSkip === 'true') return false;
        return panel.matches('.town-submodule-compare-panel, .student-details-secondary-flow')
            || !!panel.querySelector('[id*="Compare"], [id*="compare"], [onclick*="Compare"], [onclick*="Comparison"], [onclick*="compare"]')
            || /多期|历史对比|对比/i.test(panel.querySelector('.analysis-inline-title')?.textContent || '');
    }

    function readPreference(key) {
        try { return window.localStorage.getItem(key) === 'open'; } catch (_) { return false; }
    }

    function isPolicy(target) {
        if (target.matches(POLICIES)) return true;
        // Only static reading/export guidance belongs here. Live counts, warnings,
        // filters and data summaries can share this CSS class and must stay visible.
        if (!target.matches('.analysis-table-meta') || target.id
            || target.matches('[role], [aria-live]')
            || target.querySelector('input, select, textarea, button, table, canvas')) return false;
        if (!/^(阅读建议|导出建议|用途|提示|输出内容|口径|同学科完整排名)[：:]/.test(target.textContent.trim())) return false;
        target.dataset.auxiliaryPolicy = 'true';
        return true;
    }

    function applyGroup(group) {
        const available = group.targets.filter(target => !target.hidden && target.style.display !== 'none');
        group.button.hidden = !available.length;
        const count = group.kind === 'brief'
            ? available.reduce((sum, target) => sum + target.querySelectorAll('.summary-highlights-item').length, 0) : 0;
        const label = group.kind === 'brief' ? `分析摘要 · ${count} 条` : group.label;
        if (group.button.textContent !== label) group.button.textContent = label;
        group.button.setAttribute('aria-label', label);
        group.button.setAttribute('aria-expanded', String(group.open));
        group.button.setAttribute('aria-controls', group.targets.map(target => target.id).join(' '));
        group.targets.forEach(target => {
            target.classList.add('analysis-auxiliary-content');
            target.classList.toggle('is-auxiliary-collapsed', !group.open);
            if (target.tagName === 'DETAILS') {
                target.classList.add('analysis-auxiliary-doc');
                target.open = group.open;
            }
        });
    }

    function refreshSection(section) {
        const head = section.querySelector('.analysis-shell-head, .sec-head')
            || section.querySelector('.module-desc-bar, .sub-header');
        if (!head) return;
        const entries = new Map();
        function add(key, kind, label, target, title = label) {
            if (!target.id) target.id = `analysis-auxiliary-${++nextId}`;
            if (!entries.has(key)) entries.set(key, { kind, label, title, targets: [] });
            entries.get(key).targets.push(target);
        }
        section.querySelectorAll(CONTENT).forEach(target => {
            if (target.closest('.section') !== section) return;
            if (target.parentElement?.closest('.student-details-secondary-flow')) return;
            if (target.matches(COMPARISONS)) {
                if (!isComparisonPanel(target)) return;
                const title = target.querySelector('.analysis-inline-title, [data-compare-panel-title]')?.textContent?.trim() || '多期对比';
                // Existing control IDs survive lazy remounts and provide stable preference keys.
                const identity = target.dataset.submodule || target.querySelector('[id]')?.id || title;
                add(`compare:${identity}`, 'compare', /历史/.test(title) ? '历史对比' : '多期对比', target, title);
            } else if (isPolicy(target)) {
                if (target.matches(GUIDANCE) || target.matches('.analysis-table-meta')) target.classList.add('analysis-auxiliary-guidance');
                add('policy', 'policy', '口径说明', target);
            } else if (target.matches('.marginal-cycle-panel')) {
                add('followup', 'followup', '转化跟踪', target);
            } else if (target.matches('#grade-scheduler .constraints-box')) {
                add('settings', 'settings', '高级设置', target);
            } else if (target.matches(BRIEFS)) {
                add('brief', 'brief', '分析摘要', target);
            }
        });
        if (!entries.size) {
            states.get(section)?.bar.remove();
            states.delete(section);
            return;
        }
        let state = states.get(section);
        if (!state) {
            const bar = document.createElement('div');
            bar.className = 'analysis-auxiliary-toolbar';
            bar.setAttribute('role', 'group');
            bar.setAttribute('aria-label', '辅助查看工具');
            state = { bar, groups: new Map() };
            states.set(section, state);
        }
        if (head.nextElementSibling !== state.bar) head.after(state.bar);
        entries.forEach((entry, key) => {
            let group = state.groups.get(key);
            if (!group) {
                const storageKey = `school:auxiliary:v1:${section.id}:${key}`;
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'analysis-auxiliary-toggle';
                group = { ...entry, button, storageKey, open: readPreference(storageKey) };
                button.addEventListener('click', () => {
                    group.open = !group.open;
                    try { window.localStorage.setItem(storageKey, group.open ? 'open' : 'closed'); } catch (_) {}
                    applyGroup(group);
                });
                state.groups.set(key, group);
            }
            Object.assign(group, entry);
            group.button.title = entry.title;
            applyGroup(group);
        });
        state.groups.forEach((group, key) => {
            if (!entries.has(key)) { group.button.remove(); state.groups.delete(key); }
        });
        // Keep the toolbar predictable even when policy/summary panels arrive later.
        const order = { compare: 0, policy: 1, brief: 2, followup: 3, settings: 4 };
        [...state.groups.values()].sort((a, b) => order[a.kind] - order[b.kind]).forEach((group, index) => {
            if (state.bar.children[index] !== group.button) state.bar.insertBefore(group.button, state.bar.children[index] || null);
        });
        state.bar.hidden = [...state.groups.values()].every(group => group.button.hidden);
    }

    function applyCompactNavigation() {
        const overview = document.getElementById('shell-overview');
        const meta = overview?.querySelector('#shell-module-rail-shell .shell-module-rail-meta');
        if (!meta || meta.querySelector('[data-auxiliary-navigation]')) return;
        const storageKey = 'school:auxiliary:v1:navigation';
        let open = readPreference(storageKey);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'analysis-auxiliary-toggle';
        button.dataset.auxiliaryNavigation = 'true';
        button.setAttribute('aria-controls', 'shell-module-rail shell-category-desc shell-workflow-path');
        function render() {
            overview.classList.toggle('is-navigation-compact', !open);
            button.textContent = open ? '收起导航' : '展开导航';
            button.setAttribute('aria-label', button.textContent);
            button.setAttribute('aria-expanded', String(open));
        }
        button.addEventListener('click', () => {
            open = !open;
            try { window.localStorage.setItem(storageKey, open ? 'open' : 'closed'); } catch (_) {}
            render();
            // Keep the selected module reachable when the card grid becomes a row.
            overview.querySelector('.shell-module-rail-chip[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
        meta.appendChild(button);
        render();
    }

    function applyComparisonPanelCollapses(root = document) {
        applyCompactNavigation();
        const scope = root?.querySelectorAll ? root : document;
        const section = scope.closest?.('.section');
        if (section) refreshSection(section);
        else scope.querySelectorAll('.section').forEach(refreshSection);
    }

    let timer = 0;
    const pending = new Set();
    function schedule(section) {
        if (!section) return;
        pending.add(section);
        if (timer) return;
        timer = window.setTimeout(() => {
            timer = 0;
            const roots = [...pending];
            pending.clear();
            roots.forEach(applyComparisonPanelCollapses);
        }, 40);
    }

    window.applyComparisonPanelCollapses = applyComparisonPanelCollapses;
    window.addEventListener('school:decision-brief-render', event => {
        const container = document.getElementById(event.detail?.containerId);
        if (container) applyComparisonPanelCollapses(container);
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => applyComparisonPanelCollapses(), { once: true });
    else applyComparisonPanelCollapses();
    if (window.MutationObserver) {
        new MutationObserver(mutations => mutations.forEach(mutation => {
            if (mutation.target.closest?.('.analysis-auxiliary-toolbar')) return;
            if (mutation.type === 'attributes') {
                if (mutation.target.matches?.(CONTENT)) schedule(mutation.target.closest('.section'));
                return;
            }
            // Ignore table cell updates; only auxiliary content needs disclosure decoration.
            if (mutation.target.closest?.(CONTENT)) schedule(mutation.target.closest('.section'));
            if (Array.from(mutation.removedNodes).some(node => node.nodeType === 1
                && (node.matches?.(CONTENT) || node.querySelector?.(CONTENT)))) schedule(mutation.target.closest?.('.section'));
            Array.from(mutation.addedNodes).forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.matches?.(CONTENT) || node.querySelector?.(CONTENT)) schedule(node.closest('.section') || node);
            });
        })).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    }
})();
