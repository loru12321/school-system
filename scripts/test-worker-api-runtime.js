const assert = require('assert');
const path = require('path');

const createWorkerApiRuntime = require(path.resolve(__dirname, '../public/assets/js/worker-api-runtime.js'));

async function run() {
    let blobParts = null;
    let workerCreatedCount = 0;
    let lastPostedPayload = null;

    class MockBlob {
        constructor(parts) {
            blobParts = Array.isArray(parts) ? parts.slice() : [];
        }
    }

    class MockWorker {
        constructor(url) {
            this.url = url;
            this.onmessage = null;
            this.onerror = null;
            workerCreatedCount += 1;
        }

        postMessage(payload) {
            lastPostedPayload = payload;
            if (typeof this.onmessage === 'function') {
                this.onmessage({
                    data: {
                        status: 'ok',
                        RAW_DATA: [{ id: 1 }],
                        SCHOOLS: { A: { name: 'A' } }
                    }
                });
            }
        }
    }

    const root = {
        Blob: MockBlob,
        Worker: MockWorker,
        URL: {
            createObjectURL() {
                return 'blob:worker-source';
            }
        }
    };

    const runtime = createWorkerApiRuntime(root);
    const manager = { worker: null };

    const lite = runtime.buildSchoolsLite({
        SCHOOLS: {
            S1: { students: [{ name: 'a' }], metrics: { avg: 1 } },
            S2: { students: [{ name: 'b' }], rank: 2 }
        }
    });
    assert.deepStrictEqual(lite, {
        S1: { metrics: { avg: 1 } },
        S2: { rank: 2 }
    });

    const result = await runtime.run(manager, {
        RAW_DATA: [{ id: 1 }],
        SCHOOLS: {
            S1: { students: [{ id: 'x' }], score: 99 }
        }
    }, 'self.onmessage = function(){};');

    assert.strictEqual(workerCreatedCount, 1);
    assert.ok(Array.isArray(blobParts));
    assert.ok(String(blobParts[0]).includes('self.onmessage'));
    assert.strictEqual(result.status, 'ok');
    assert.ok(lastPostedPayload);
    assert.strictEqual(lastPostedPayload.cmd, 'PROCESS_ALL');
    assert.deepStrictEqual(lastPostedPayload.data.SCHOOLS_LITE, {
        S1: { score: 99 }
    });
    assert.strictEqual(typeof manager.worker.postMessage, 'function');

    await runtime.run(manager, {
        RAW_DATA: [],
        SCHOOLS: {}
    }, 'self.onmessage = function(){};');
    assert.strictEqual(workerCreatedCount, 1);

    const urlManager = { worker: null };
    blobParts = null;
    await runtime.run(urlManager, {
        RAW_DATA: [],
        SCHOOLS: {}
    }, '', './assets/js/data-processing-worker.js?v=test');
    assert.strictEqual(workerCreatedCount, 2);
    assert.strictEqual(urlManager.worker.url, './assets/js/data-processing-worker.js?v=test');
    assert.strictEqual(blobParts, null, 'script URL workers should not create blob sources');

    console.log('worker-api-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
