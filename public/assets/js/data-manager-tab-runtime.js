(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerTabRuntime) return;
    root.DataManagerTabRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerTabRuntime(root) {
    function renderCurrentTab(manager) {
        if (!manager) return;
        const input = root.document && typeof root.document.getElementById === 'function'
            ? root.document.getElementById('dm-search-input')
            : null;
        const keyword = input ? String(input.value || '').trim().toLowerCase() : '';

        if (manager.currentTab === 'student') {
            if (typeof manager.renderStudents === 'function') manager.renderStudents(keyword);
            return;
        }
        if (manager.currentTab === 'teacher') {
            if (typeof manager.renderTeachers === 'function') manager.renderTeachers();
            return;
        }
        if (manager.currentTab === 'archive') {
            if (typeof manager.renderArchives === 'function') manager.renderArchives();
            return;
        }
        if (manager.currentTab === 'params') {
            if (typeof manager.renderParams === 'function') manager.renderParams();
            return;
        }
        if (manager.currentTab === 'targets') {
            if (typeof manager.renderTargets === 'function') manager.renderTargets();
        }
    }

    function updatePaginationUI(manager, totalPages) {
        if (!manager) return;
        const el = root.document && typeof root.document.getElementById === 'function'
            ? root.document.getElementById('dm-page-info')
            : null;
        if (!el) return;
        el.innerText = `${manager.pagination.page} / ${totalPages}`;
    }

    return {
        renderCurrentTab,
        updatePaginationUI
    };
});
