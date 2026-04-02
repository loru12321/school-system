(() => {
    if (typeof window === 'undefined' || window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__) return;
    if (typeof window.refreshTeacherPerformanceCopy === 'function') {
        window.refreshTeacherPerformanceCopy();
    }
    window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__ = true;
})();
