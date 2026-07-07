/*
 * startup-hydration-runtime.js
 *
 * Orchestration-only scheduling shell extracted from app.js (phase 4 of the
 * app.js modularization). This runtime owns ONLY the *timing decision* for a
 * startup/hydration callback: whether it runs on an idle callback, a double
 * requestAnimationFrame, or a plain timeout, with an optional leading delay,
 * and it wraps the callback in a try/catch so one failing hydration step can
 * never break boot.
 *
 * It performs NO data mutation: it never touches RAW_DATA / COHORT_DB, never
 * normalizes school/class names, never identifies exams, never triggers
 * processData or any calculation, and never restores a snapshot. The callback
 * body — and every app.js-local variable it closes over — stays in app.js.
 * This shell only decides *when* that already-built callback fires.
 *
 * app.js keeps a compatibility fallback: if this runtime is absent it rebuilds
 * an equivalent scheduler inline. Load order: registered in boot-runtime.js
 * APP_MODULES before app.js.
 */
(function (root) {
    if (!root || root.StartupHydrationScheduler) return;

    function run(label, callback, options = {}) {
        if (typeof callback !== 'function') return;

        const safeRun = () => {
            try {
                callback();
            } catch (error) {
                console.warn(`[StartupHydration:${label}]`, error);
            }
        };

        const trigger = () => {
            if (options.idle) {
                if (typeof root.requestIdleCallback === 'function') {
                    root.requestIdleCallback(() => safeRun(), { timeout: Number(options.timeout || 1200) });
                    return;
                }
                root.setTimeout(safeRun, Math.max(0, Number(options.timeout || 180)));
                return;
            }

            if (typeof root.requestAnimationFrame === 'function') {
                root.requestAnimationFrame(() => root.requestAnimationFrame(safeRun));
                return;
            }

            root.setTimeout(safeRun, 0);
        };

        const delay = Math.max(0, Number(options.delay || 0));
        if (delay > 0) {
            root.setTimeout(trigger, delay);
            return;
        }

        trigger();
    }

    root.StartupHydrationScheduler = { run };
})(typeof window !== 'undefined' ? window : this);
