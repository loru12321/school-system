(() => {
    if (typeof window === 'undefined' || window.MobileExperienceRuntime) return;

    function isCompactViewport() {
        return window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
    }

    function syncCompactState() {
        document.documentElement.classList.toggle('is-compact-viewport', isCompactViewport());
        document.querySelectorAll('.analysis-table-shell, .table-wrap').forEach((shell) => {
            if (!shell.dataset.mobileHint) shell.dataset.mobileHint = '可横向滑动查看完整表格';
        });
    }

    function install() {
        if (window.__MOBILE_EXPERIENCE_RUNTIME_INSTALLED__) return;
        window.__MOBILE_EXPERIENCE_RUNTIME_INSTALLED__ = true;
        syncCompactState();
        window.addEventListener('resize', syncCompactState, { passive: true });
        document.addEventListener('DOMContentLoaded', syncCompactState, { once: true });
        document.addEventListener('click', () => window.setTimeout(syncCompactState, 80), { passive: true });
    }

    window.MobileExperienceRuntime = {
        install,
        syncCompactState,
        isCompactViewport
    };
    install();
})();
