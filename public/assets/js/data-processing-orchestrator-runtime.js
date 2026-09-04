// data-processing-orchestrator-runtime.js — processData phase orchestration shell
// (extracted from app.js, phase 2 of the app.js slimming effort).
//
// This runtime owns ONLY the *sequencing* of processData's phases: the order in
// which the perf-instrumented phases run, where the main-thread yields sit, when
// the worker result is applied, and where the autosave/status hooks attach.
//
// It performs NO score calculation, NO school normalization, NO Excel shaping and
// NO assessment (考核) logic. Every phase *body* — thresholds, worker submit,
// worker-result application, class ranks, summary, autosave, status — stays in
// app.js as a closure over app.js-local state (RAW_DATA / SCHOOLS / THRESHOLDS /
// fuseInstance / setRawData / calcSummary ...). app.js injects those closures
// through the orchestration context bag on each run; nothing app.js-local is
// forced onto window. The perf helpers below only read window.SystemPerformance,
// which is already a global, so they can live here without new coupling.
//
// Ordering, phase labels and yield placement are byte-for-byte identical to the
// former inline processDataInner(); this is a pure code-location change.
(function () {
    function yieldToMain() {
        const runtime = window.SystemPerformance;
        if (runtime && typeof runtime.yieldToMain === 'function') return runtime.yieldToMain();
        return Promise.resolve();
    }

    function beginPhase(label) {
        const runtime = window.SystemPerformance;
        if (runtime && typeof runtime.beginPhase === 'function') return runtime.beginPhase(label);
        return () => {};
    }

    async function runPhase(label, task) {
        const endPhase = beginPhase(label);
        try {
            return await task();
        } finally {
            endPhase();
        }
    }

    // Synchronous phase wrapper for the worker-submit step. The original code
    // opened the 'processData:worker-submit' phase, called WorkerAPI.run(...)
    // synchronously, then closed the phase in a finally — the returned task is
    // awaited later, outside the phase. Preserved exactly.
    function runSyncPhase(label, task) {
        const endPhase = beginPhase(label);
        try {
            return task();
        } finally {
            endPhase();
        }
    }

    // Drive the processData phase sequence. `o` is the orchestration bag built by
    // app.js; each member is a closure that runs one phase body against app.js
    // local state. This function contributes only the ordering + perf phases.
    async function run(o = {}) {
        const isSingleSchool = await runPhase('processData:thresholds', () => o.runThresholds());

        // Worker input prep (high-school line, township name set) runs OUTSIDE the
        // worker-submit phase, exactly as before — only WorkerAPI.run() is timed.
        const workerInput = o.prepareWorkerInput();
        const workerTask = runSyncPhase('processData:worker-submit', () => o.submitWorker(workerInput));

        await yieldToMain();
        const result = await workerTask;
        await runPhase('processData:worker-result', async () => {});
        // Worker 结果属于提交时的那份 RAW_DATA/届别；期间切届或清空过工作区就整轮作废，
        // 不写回、不算校排、不自动保存——否则上一届的数据会顶着新届别身份复活。
        if (typeof o.isRunStale === 'function' && o.isRunStale()) {
            console.warn('[processData] discarded stale worker result after workspace/cohort change');
            return;
        }

        if (typeof o.receiveWorkerResult === 'function') o.receiveWorkerResult(result);

        await yieldToMain();
        await runPhase('processData:apply-worker-result', () => o.applyWorkerResult(result));

        await yieldToMain();
        await runPhase('processData:class-ranks', () => o.computeClassRanks());

        if (typeof o.finalizeSchools === 'function') o.finalizeSchools(isSingleSchool);

        await yieldToMain();
        await runPhase('processData:summary', () => o.runSummary());

        await yieldToMain();
        await runPhase('processData:autosave', () => o.runAutosave());

        await yieldToMain();
        await runPhase('processData:status', () => o.runStatus());
    }

    window.DataProcessingOrchestrator = window.DataProcessingOrchestrator || {
        run,
        // Exposed so app.js's compatibility fallback can reuse the identical perf
        // helpers instead of keeping its own duplicates when the runtime is loaded.
        yieldToMain,
        beginPhase,
        runPhase,
        runSyncPhase
    };
})();
