(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.WorkerApiRuntime) return;
    root.WorkerApiRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createWorkerApiRuntime(root) {
    function getBlobCtor() {
        if (typeof root.Blob === 'function') return root.Blob;
        if (typeof Blob === 'function') return Blob;
        return null;
    }

    function getWorkerCtor() {
        if (typeof root.Worker === 'function') return root.Worker;
        if (typeof Worker === 'function') return Worker;
        return null;
    }

    function getUrlApi() {
        return root.URL && typeof root.URL.createObjectURL === 'function' ? root.URL : null;
    }

    function buildSchoolsLite(data) {
        const schools = data && data.SCHOOLS && typeof data.SCHOOLS === 'object' ? data.SCHOOLS : {};
        const schoolsLite = {};
        Object.keys(schools).forEach((key) => {
            const item = schools[key] || {};
            const next = {};
            Object.keys(item).forEach((field) => {
                if (field === 'students') return;
                next[field] = item[field];
            });
            schoolsLite[key] = next;
        });
        return schoolsLite;
    }

    function getAnalyticsKernel() {
        return root && root.AnalyticsKernel && typeof root.AnalyticsKernel === 'object'
            ? root.AnalyticsKernel
            : null;
    }

    function init(manager, workerSource, workerScriptUrl) {
        if (!manager) throw new Error('WorkerAPI manager unavailable');
        if (manager.worker) return manager.worker;

        const WorkerCtor = getWorkerCtor();
        if (!WorkerCtor) {
            throw new Error('Worker runtime unavailable');
        }

        const scriptUrl = String(workerScriptUrl || '').trim();
        if (scriptUrl) {
            manager.worker = new WorkerCtor(scriptUrl);
            return manager.worker;
        }

        const BlobCtor = getBlobCtor();
        const urlApi = getUrlApi();
        if (!BlobCtor || !urlApi) {
            throw new Error('Worker runtime unavailable');
        }

        const source = String(workerSource || '');
        const blob = new BlobCtor([source], { type: 'application/javascript' });
        manager.worker = new WorkerCtor(urlApi.createObjectURL(blob));
        return manager.worker;
    }

    function run(manager, data, workerSource, workerScriptUrl) {
        const worker = init(manager, workerSource, workerScriptUrl);
        const kernel = getAnalyticsKernel();
        const signature = kernel && typeof kernel.buildProcessSignature === 'function'
            ? kernel.buildProcessSignature(data || {})
            : '';
        if (signature && typeof kernel.getProcessResult === 'function') {
            const cached = kernel.getProcessResult(signature);
            if (cached && cached.status === 'ok') return Promise.resolve(cached);
        }
        return new Promise((resolve, reject) => {
            worker.onmessage = (event) => {
                if (event && event.data && event.data.status === 'ok') {
                    if (signature && typeof kernel?.setProcessResult === 'function') {
                        kernel.setProcessResult(signature, event.data);
                    }
                    resolve(event.data);
                } else reject(event && event.data ? event.data.msg : 'worker-error');
            };
            worker.onerror = (event) => reject(event && event.message ? event.message : 'worker-error');

            const schoolsLite = buildSchoolsLite(data || {});
            worker.postMessage({
                cmd: 'PROCESS_ALL',
                data: Object.assign({}, data || {}, { SCHOOLS_LITE: schoolsLite })
            });
        });
    }

    return {
        init,
        run,
        buildSchoolsLite
    };
});
