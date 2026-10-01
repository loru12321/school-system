// Display-only disclosures. Keep original panels and their event handlers in place.
(() => {
    if (typeof window === 'undefined' || window.__COMPARISON_PANEL_COLLAPSE_RUNTIME__) return;
    window.__COMPARISON_PANEL_COLLAPSE_RUNTIME__ = true;
    const COMPARISONS = '.analysis-inline-panel, .town-submodule-compare-panel';
    const POLICIES = '.calculation-policy-strip, details.analysis-doc-panel, #summary > .analysis-table-meta';
    const CONTENT = `${COMPARISONS}, ${POLICIES}, #summary-highlights, #analysis-highlights, #teacher-highlights`;
    const states = new WeakMap();
    let nextId = 0;

    function isComparisonPanel(panel) {
        if (panel.dataset.compareCollapsibleSkip === 'true') return false;
        return panel.classList.contains('town-submodule-compare-panel')
            || !!panel.querySelector('[id*="Compare"], [id*="compare"], [onclick*="Compare"], [onclick*="Comparison"], [onclick*="compare"]')
            || /多期|历史对比|对比/i.test(panel.querySelector('.analysis-inline-title')?.textContent || '');
    }

    function readPreference(key) {
        try { return window.localStorage.getItem(key) === 'open'; } catch (_) { return false; }
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
        const head = section.querySelector('.analysis-shell-head, .sec-head, .module-desc-bar, .sub-header');
        if (!head) return;
        const entries = new Map();
        function add(key, kind, label, target, title = label) {
            if (!target.id) target.id = `analysis-auxiliary-${++nextId}`;
            if (!entries.has(key)) entries.set(key, { kind, label, title, targets: [] });
            entries.get(key).targets.push(target);
        }
        section.querySelectorAll(CONTENT).forEach(target => {
            if (target.closest('.section') !== section) return;
            if (target.matches(COMPARISONS)) {
                if (!isComparisonPanel(target)) return;
                const title = target.querySelector('.analysis-inline-title, [data-compare-panel-title]')?.textContent?.trim() || '多期对比';
                // Existing control IDs survive lazy remounts and provide stable preference keys.
                const identity = target.dataset.submodule || target.querySelector('[id]')?.id || title;
                add(`compare:${identity}`, 'compare', /历史/.test(title) ? '历史对比' : '多期对比', target, title);
            } else if (target.matches(POLICIES)) {
                add('policy', 'policy', '口径说明', target);
            } else {
                add('brief', 'brief', '分析摘要', target);
            }
        });
        if (!entries.size) return;
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
        const order = { compare: 0, policy: 1, brief: 2 };
        [...state.groups.values()].sort((a, b) => order[a.kind] - order[b.kind]).forEach((group, index) => {
            if (state.bar.children[index] !== group.button) state.bar.insertBefore(group.button, state.bar.children[index] || null);
        });
        state.bar.hidden = [...state.groups.values()].every(group => group.button.hidden);
    }

    function applyComparisonPanelCollapses(root = document) {
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
            Array.from(mutation.addedNodes).forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.matches?.(CONTENT) || node.querySelector?.(CONTENT)) schedule(node.closest('.section') || node);
            });
        })).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    }
})();
