(() => {
    if (typeof window === 'undefined' || window.VirtualTableRuntime) return;

    const DEFAULT_LIMIT = 80;

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
        scope.querySelectorAll('table[data-virtual-table], .analysis-generated-table, .student-detail-table').forEach((table) => {
            if (enhanceTable(table)) count += 1;
        });
        return count;
    }

    function scheduleEnhance(root) {
        window.requestAnimationFrame
            ? window.requestAnimationFrame(() => enhance(root || document))
            : window.setTimeout(() => enhance(root || document), 16);
    }

    window.VirtualTableRuntime = {
        enhance,
        enhanceTable,
        scheduleEnhance
    };

    document.addEventListener('click', () => scheduleEnhance(document), { passive: true });
    document.addEventListener('DOMContentLoaded', () => scheduleEnhance(document), { once: true });
})();
