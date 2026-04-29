(() => {
    if (typeof window === 'undefined' || window.TeachingManagementModulesRuntime) return;

    const MODULE_GROUPS = {};

    function getGroupForModule(id) {
        const moduleId = String(id || '').trim();
        return Object.entries(MODULE_GROUPS).find(([, ids]) => ids.includes(moduleId))?.[0] || 'overview';
    }

    function markActiveGroup(id) {
        const group = getGroupForModule(id);
        document.body.dataset.teachingManagementGroup = group;
        return group;
    }

    function install() {
        if (window.__TEACHING_MANAGEMENT_MODULES_INSTALLED__) return;
        window.__TEACHING_MANAGEMENT_MODULES_INSTALLED__ = true;
        const originalSwitchTab = window.switchTab;
        if (typeof originalSwitchTab === 'function') {
            window.switchTab = function patchedTeachingSwitchTab(id, ...rest) {
                const moduleId = String(id || '');
                return originalSwitchTab.call(this, id, ...rest);
            };
        }
    }

    window.TeachingManagementModulesRuntime = {
        MODULE_GROUPS,
        getGroupForModule,
        markActiveGroup,
        install
    };
    install();
})();
