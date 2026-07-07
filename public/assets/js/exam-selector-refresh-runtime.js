/*
 * exam-selector-refresh-runtime.js
 *
 * Orchestration-only shell extracted from app.js (phase 3 of the app.js
 * modularization). This runtime owns the *coalescing/dedup scheduling* of the
 * exam-selector UI refresh functions (the `update*ExamSelects` family) after a
 * cohort/exam hydration or switch. It performs NO data mutation: it never
 * touches RAW_DATA / COHORT_DB, never normalizes school/class names, never
 * identifies exams, and never triggers processData or any calculation. It only
 * decides *when* the already-defined global UI refreshers run, and collapses
 * bursts of refresh requests into a single idle pass.
 *
 * The target refresh functions are resolved lazily by name at run time (via
 * typeof guards), so this runtime can load before them regardless of order.
 *
 * app.js keeps a compatibility fallback: if this runtime is absent it rebuilds
 * an equivalent scheduler inline. Load order: registered in boot-runtime.js
 * APP_MODULES before app.js.
 */
(function (root) {
    if (!root || root.ExamSelectorRefreshScheduler) return;

    let queued = false;
    let pending = null;

    const DEFAULT_FLAGS = {
        status: true,
        macro: true,
        teacher: true,
        teacherCompareTeacher: false,
        studentCompare: true,
        reportCompare: true,
        progress: true,
        progressBaseline: false
    };

    function mergeOptions(options = {}) {
        pending = Object.assign({}, DEFAULT_FLAGS, pending || {}, options);
    }

    function callRefresh(name, callback, warnLabel) {
        if (typeof callback !== 'function') return;
        try {
            callback();
        } catch (error) {
            console.warn(warnLabel || `${name} refresh failed:`, error);
        }
    }

    function fn(name) {
        return typeof root[name] === 'function' ? root[name] : null;
    }

    function run(options = {}) {
        const flags = Object.assign({}, DEFAULT_FLAGS, pending || {}, options);
        pending = null;
        queued = false;

        if (flags.status) callRefresh('examHistoryStatusBar', fn('updateExamHistoryStatusBar'), '状态条刷新异常:');
        if (flags.macro) callRefresh('macroMultiExamSelects', fn('updateMacroMultiExamSelects'));
        if (flags.teacher) callRefresh('teacherMultiExamSelects', fn('updateTeacherMultiExamSelects'));
        if (flags.teacherCompareTeacher) callRefresh('teacherCompareTeacherSelect', fn('updateTeacherCompareTeacherSelect'));
        if (flags.studentCompare) callRefresh('studentCompareExamSelects', fn('updateStudentCompareExamSelects'));
        if (flags.reportCompare) callRefresh('reportCompareExamSelects', fn('updateReportCompareExamSelects'));
        if (flags.progress) callRefresh('progressMultiExamSelects', fn('updateProgressMultiExamSelects'));
        if (flags.progressBaseline) callRefresh('progressBaselineSelect', fn('updateProgressBaselineSelect'));
    }

    function schedule(options = {}) {
        if (options.immediate) {
            run(options);
            return;
        }

        mergeOptions(options);
        if (queued) return;
        queued = true;

        const execute = () => run();
        if (typeof root.requestIdleCallback === 'function') {
            root.requestIdleCallback(execute, { timeout: Number(options.timeout || 700) });
            return;
        }
        if (typeof root.requestAnimationFrame === 'function') {
            root.requestAnimationFrame(() => root.setTimeout(execute, 0));
            return;
        }
        root.setTimeout(execute, 0);
    }

    root.ExamSelectorRefreshScheduler = { schedule, run };
})(typeof window !== 'undefined' ? window : this);
