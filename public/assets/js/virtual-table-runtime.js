(() => {
    if (typeof window === 'undefined' || window.VirtualTableRuntime) return;

    const DEFAULT_LIMIT = 80;
    const TABLE_SELECTOR = 'table[data-virtual-table], .analysis-generated-table, .student-detail-table';
    const pendingRoots = new Set();
    let enhanceFrameId = 0;
    let activeSectionObserver = null;

    function enhanceTable(table, options = {}) {
        if (!table || table.dataset.virtualEnhanced === '1') return false;
        const tbody = table.tBodies && table.tBodies[0];
        if (!tbody) return false;
        const rows = Array.from(tbody.rows || []);
        const limit = Number(options.limit || table.dataset.virtualLimit || DEFAULT_LIMIT);
        if (!Number.isFinite(limit) || rows.length <= limit) return false;

        table.dataset.virtualEnhanced = '1';
        rows.forEach((row, index) => {
            if (index >= limit) row.hidden = true;
        });

        const footer = document.createElement('div');
        footer.className = 'virtual-table-footer';
        footer.innerHTML = `
            <span>已优先显示前 ${limit} 行，共 ${rows.length} 行</span>
            <button type="button" class="btn btn-sm btn-secondary">显示全部</button>
        `;
        footer.querySelector('button')?.addEventListener('click', () => {
            rows.forEach((row) => { row.hidden = false; });
            footer.remove();
            table.dataset.virtualExpanded = '1';
        });

        const shell = table.closest('.table-wrap') || table.parentElement;
        if (shell && !shell.querySelector(':scope > .virtual-table-footer')) {
            shell.appendChild(footer);
        }
        return true;
    }

    function enhance(root = document) {
        const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
        let count = 0;
        if (scope.matches?.(TABLE_SELECTOR) && enhanceTable(scope)) count += 1;
        scope.querySelectorAll(TABLE_SELECTOR).forEach((table) => {
            if (enhanceTable(table)) count += 1;
        });
        return count;
    }

    function scheduleEnhance(root) {
        const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
        pendingRoots.add(scope);
        if (enhanceFrameId) return;

        const flush = () => {
            enhanceFrameId = 0;
            const roots = Array.from(pendingRoots);
            pendingRoots.clear();
            roots.forEach((pendingRoot) => enhance(pendingRoot));
        };
        enhanceFrameId = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame(flush)
            : window.setTimeout(flush, 16);
    }

    function collectAffectedTables(mutations) {
        const tables = new Set();
        (mutations || []).forEach((mutation) => {
            const targetTable = mutation.target?.closest?.(TABLE_SELECTOR);
            if (targetTable) tables.add(targetTable);
            mutation.addedNodes?.forEach?.((node) => {
                if (!node || node.nodeType !== 1) return;
                if (node.matches?.(TABLE_SELECTOR)) tables.add(node);
                const parentTable = node.closest?.(TABLE_SELECTOR);
                if (parentTable) tables.add(parentTable);
                node.querySelectorAll?.(TABLE_SELECTOR).forEach((table) => tables.add(table));
            });
        });
        tables.forEach((table) => scheduleEnhance(table));
    }

    function observeActiveSection(section) {
        if (activeSectionObserver) activeSectionObserver.disconnect();
        activeSectionObserver = null;
        if (!section || typeof window.MutationObserver !== 'function') return;
        activeSectionObserver = new window.MutationObserver(collectAffectedTables);
        activeSectionObserver.observe(section, { childList: true, subtree: true });
    }

    function activateSection(sectionId = '') {
        const section = sectionId ? document.getElementById(sectionId) : document.querySelector('.section.active');
        if (!section) return;
        observeActiveSection(section);
        scheduleEnhance(section);
    }

    window.VirtualTableRuntime = {
        enhance,
        enhanceTable,
        scheduleEnhance
    };

    // Never rescan the entire application after every click. Large hidden result
    // tables can contain thousands of rows; the former document-level click
    // handler made an unrelated tab click pay that full DOM cost. Only watch the
    // active module and tables that are actually added or updated there.
    window.addEventListener('school:module-changed', (event) => {
        activateSection(String(event?.detail?.id || ''));
    });
    document.addEventListener('DOMContentLoaded', () => activateSection(), { once: true });
})();
