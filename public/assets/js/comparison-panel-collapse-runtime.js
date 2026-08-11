(() => {
    if (typeof window === 'undefined' || window.__COMPARISON_PANEL_COLLAPSE_RUNTIME__) return;
    window.__COMPARISON_PANEL_COLLAPSE_RUNTIME__ = true;

    function isComparisonPanel(panel) {
        if (!panel || panel.dataset.compareCollapsibleSkip === 'true') return false;
        if (panel.classList.contains('town-submodule-compare-panel')) return true;
        if (!panel.classList.contains('analysis-inline-panel')) return false;
        if (panel.querySelector('[id*="Compare"], [id*="compare"], [onclick*="Compare"], [onclick*="Comparison"], [onclick*="compare"]')) return true;
        return /多期|云端对比|历史对比|对比|compare|comparison/i.test(String(panel.textContent || ''));
    }

    function getPanelTitle(panel) {
        const titleEl = panel.querySelector('.analysis-inline-title, [data-compare-panel-title]');
        const text = String((titleEl || panel).textContent || '').replace(/\s+/g, ' ').trim();
        return text || '对比';
    }

    function togglePanel(panel, button, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const collapsed = panel.classList.toggle('is-collapsed');
        const expanded = !collapsed;
        if (button) {
            button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            const label = button.querySelector('span');
            if (label) label.textContent = expanded ? '收起' : '展开';
        }
    }

    function bindPanel(panel) {
        if (!isComparisonPanel(panel) || panel.dataset.compareCollapsibleBound === 'true') return;
        const firstBlock = panel.firstElementChild;
        if (!firstBlock) return;

        panel.dataset.compareCollapsibleBound = 'true';
        panel.classList.add('compare-collapsible-panel', 'is-collapsed');

        let header = firstBlock;
        if (!header.classList.contains('analysis-inline-top') && !header.classList.contains('compare-collapsible-header')) {
            header = document.createElement('div');
            header.className = 'compare-collapsible-header';
            header.innerHTML = `<div class="compare-collapsible-title">${getPanelTitle(panel)}</div>`;
            panel.insertBefore(header, firstBlock);
        } else {
            header.classList.add('compare-collapsible-header');
        }

        const body = document.createElement('div');
        body.className = 'compare-collapsible-body';
        let node = header.nextSibling;
        while (node) {
            const next = node.nextSibling;
            body.appendChild(node);
            node = next;
        }
        panel.appendChild(body);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'compare-collapsible-toggle';
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = '<i class="ti ti-chevron-down"></i><span>展开</span>';
        button.addEventListener('click', (event) => togglePanel(panel, button, event));
        header.addEventListener('click', (event) => {
            if (event.target.closest('button, a, input, select, textarea, label')) return;
            togglePanel(panel, button, event);
        });
        header.appendChild(button);
    }

    const PANEL_SELECTOR = '.analysis-inline-panel, .town-submodule-compare-panel';

    function applyComparisonPanelCollapses(root = document) {
        const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
        if (scope.matches?.(PANEL_SELECTOR)) bindPanel(scope);
        scope.querySelectorAll(PANEL_SELECTOR).forEach(bindPanel);
    }

    let applyTimer = 0;
    const pendingRoots = new Set();
    function scheduleComparisonPanelCollapses(root = document) {
        const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
        pendingRoots.add(scope);
        if (applyTimer) return;
        applyTimer = window.setTimeout(() => {
            applyTimer = 0;
            const roots = Array.from(pendingRoots);
            pendingRoots.clear();
            roots.forEach(applyComparisonPanelCollapses);
        }, 80);
    }

    window.applyComparisonPanelCollapses = applyComparisonPanelCollapses;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyComparisonPanelCollapses, { once: true });
    } else {
        applyComparisonPanelCollapses();
    }
    window.addEventListener('load', applyComparisonPanelCollapses, { once: true });
    if (window.MutationObserver) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => Array.from(mutation.addedNodes || []).forEach((node) => {
                if (!node || node.nodeType !== 1) return;
                if (node.matches?.(PANEL_SELECTOR) || node.querySelector?.(PANEL_SELECTOR)) {
                    scheduleComparisonPanelCollapses(node);
                }
            }));
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
})();
