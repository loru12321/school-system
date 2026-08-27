/*
 * workspace-ui-refresh-runtime.js
 *
 * Orchestration-only scheduling shell extracted from app.js (phase 5 of the
 * app.js modularization). This runtime owns ONLY the *debounce + timing* of a
 * workspace UI refresh request: it collapses a burst of refresh calls into a
 * single trailing timer (the leading `delay`), then hands the already-built
 * refresh callback to StartupHydrationScheduler so the actual DOM work runs on
 * an idle callback / double-rAF / timeout.
 *
 * It performs NO data mutation and knows NOTHING about what the refresh does:
 * it never touches RAW_DATA / COHORT_DB, never normalizes school/class names,
 * never identifies exams, never triggers processData or any calculation, and
 * never restores a snapshot. The refresh callback body — and every app.js-local
 * function it closes over (updateSchoolSelect / updateMySchoolSelect /
 * renderTables / generateTeacherInputs / updateStatusPanel) plus the MY_SCHOOL
 * global — stays in app.js. This shell only decides *when* that callback fires
 * and guarantees at most one pending refresh at a time.
 *
 * app.js keeps a compatibility fallback: if this runtime is absent it rebuilds
 * an equivalent debounce inline. Load order: registered in boot-runtime.js
 * APP_MODULES before app.js (and it reads StartupHydrationScheduler lazily at
 * fire time, so relative order with that runtime does not matter).
 */
(function (root) {
    if (!root || root.WorkspaceUiRefreshScheduler) return;

    let refreshTimer = null;

    function schedule(label, refresh, options = {}) {
        if (typeof refresh !== 'function') return;

        if (refreshTimer) {
            root.clearTimeout(refreshTimer);
            refreshTimer = null;
        }

        const delay = Math.max(0, Number(options.delay || 120));
        const run = () => {
            refreshTimer = null;
            const hydration = root.StartupHydrationScheduler;
            const hydrationOptions = {
                idle: options.idle !== false,
                timeout: Number(options.timeout || 1600)
            };
            if (hydration && typeof hydration.run === 'function') {
                hydration.run(label, refresh, hydrationOptions);
                return;
            }
            try {
                refresh();
            } catch (error) {
                console.warn(`[WorkspaceUiRefresh:${label}]`, error);
            }
        };

        refreshTimer = root.setTimeout(run, delay);
    }

    root.WorkspaceUiRefreshScheduler = { schedule };
})(typeof window !== 'undefined' ? window : this);
