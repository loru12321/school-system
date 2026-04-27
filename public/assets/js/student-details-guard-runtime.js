(() => {
    if (typeof window === 'undefined' || window.StudentDetailsGuardRuntime) return;

    function afterStudentDetailsRender(root = document) {
        const section = document.getElementById('student-details');
        if (!section) return;
        if (window.VirtualTableRuntime && typeof window.VirtualTableRuntime.scheduleEnhance === 'function') {
            window.VirtualTableRuntime.scheduleEnhance(section);
        }
        section.querySelectorAll('table').forEach((table) => {
            if (!table.dataset.virtualTable) table.dataset.virtualTable = 'student-details';
        });
    }

    function install() {
        if (window.__STUDENT_DETAILS_GUARD_INSTALLED__) return;
        window.__STUDENT_DETAILS_GUARD_INSTALLED__ = true;
        const originalSwitchTab = window.switchTab;
        if (typeof originalSwitchTab === 'function') {
            window.switchTab = function patchedSwitchTab(id, ...rest) {
                const result = originalSwitchTab.call(this, id, ...rest);
                if (id === 'student-details') window.setTimeout(afterStudentDetailsRender, 80);
                return result;
            };
        }
        document.addEventListener('click', (event) => {
            const target = event.target?.closest?.('[onclick*="renderStudentDetails"], [data-module-id="student-details"]');
            if (target) window.setTimeout(afterStudentDetailsRender, 120);
        }, { passive: true });
    }

    window.StudentDetailsGuardRuntime = {
        install,
        afterStudentDetailsRender
    };
    install();
})();
