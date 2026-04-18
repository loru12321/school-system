const assert = require('assert');
const path = require('path');

const createHelpSystemRuntime = require(path.resolve(__dirname, '../public/assets/js/help-system-runtime.js'));

function createStorage(initial = {}) {
    const state = new Map(Object.entries(initial));
    return {
        getItem(key) {
            return state.has(key) ? state.get(key) : null;
        },
        setItem(key, value) {
            state.set(key, String(value));
        }
    };
}

async function run() {
    const fireCalls = [];
    const root = {
        Swal: {
            fire(config) {
                fireCalls.push(config);
                return Promise.resolve({ isConfirmed: false });
            }
        },
        localStorage: createStorage(),
        setTimeout(fn) {
            if (typeof fn === 'function') fn();
            return 1;
        },
        getComputedStyle() {
            return { display: 'none' };
        },
        document: {
            getElementById() {
                return null;
            }
        },
        AuthState: {
            hasActiveSession() {
                return false;
            }
        },
        WorkspaceState: {
            hasSavedWorkspace() {
                return false;
            }
        },
        RAW_DATA: []
    };

    const runtime = createHelpSystemRuntime(root);
    const help = {
        content: runtime.createDefaultContent(),
        show(key) {
            return runtime.show(this, key);
        },
        startTour() {
            return runtime.startTour(this);
        },
        checkFirstRun() {
            return runtime.checkFirstRun(this);
        }
    };

    assert.ok(help.content.upload);
    assert.ok(help.content.macro);
    assert.ok(help.content.teacher);
    assert.ok(String(help.content.teacher.html).includes('联考赋分 + 基线校正 + 置信修正'));

    help.show('upload');
    assert.strictEqual(fireCalls.length, 1);
    assert.strictEqual(fireCalls[0].title, help.content.upload.title);

    help.show('non-existing-key');
    assert.strictEqual(fireCalls.length, 1);

    const tourCalls = [];
    root.Swal.fire = (config) => {
        tourCalls.push(config);
        return Promise.resolve({ isConfirmed: tourCalls.length === 1 });
    };
    help.startTour();
    await Promise.resolve();
    await Promise.resolve();
    assert.ok(tourCalls.length >= 2);
    assert.strictEqual(tourCalls[0].showCancelButton, true);

    const seenStorage = createStorage({ hasSeenV3Tour: 'true' });
    const seenRoot = {
        ...root,
        localStorage: seenStorage
    };
    const seenRuntime = createHelpSystemRuntime(seenRoot);
    let scheduledCount = 0;
    seenRoot.setTimeout = () => {
        scheduledCount += 1;
        return 1;
    };
    seenRuntime.checkFirstRun({
        startTour() {
            scheduledCount += 10;
        }
    });
    assert.strictEqual(scheduledCount, 0);

    const firstRunStorage = createStorage();
    let firstRunScheduled = 0;
    let firstRunTourCount = 0;
    const firstRunRoot = {
        ...root,
        localStorage: firstRunStorage,
        setTimeout(fn, delay) {
            firstRunScheduled += 1;
            assert.strictEqual(delay, 1000);
            if (typeof fn === 'function') fn();
            return 1;
        }
    };
    const firstRunRuntime = createHelpSystemRuntime(firstRunRoot);
    firstRunRuntime.checkFirstRun({
        startTour() {
            firstRunTourCount += 1;
        }
    });
    assert.strictEqual(firstRunScheduled, 1);
    assert.strictEqual(firstRunTourCount, 1);
    assert.strictEqual(firstRunStorage.getItem('hasSeenV3Tour'), 'true');

    const overlayStorage = createStorage();
    let overlayScheduled = 0;
    const overlayRoot = {
        ...root,
        localStorage: overlayStorage,
        document: {
            getElementById(id) {
                if (id === 'login-overlay') return {};
                return null;
            }
        },
        getComputedStyle() {
            return { display: 'flex' };
        },
        setTimeout() {
            overlayScheduled += 1;
            return 1;
        }
    };
    const overlayRuntime = createHelpSystemRuntime(overlayRoot);
    overlayRuntime.checkFirstRun({
        startTour() {
            overlayScheduled += 10;
        }
    });
    assert.strictEqual(overlayScheduled, 0);
    assert.strictEqual(overlayStorage.getItem('hasSeenV3Tour'), null);

    console.log('help-system-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
