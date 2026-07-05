const assert = require('assert');
const path = require('path');

const createDataManagerParamsRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-params-runtime.js'));

async function run() {
    let indicatorState = { ind1: '', ind2: '' };
    let ensureCalled = 0;
    let saveCloudCalls = 0;
    const toasts = [];

    const elements = {
        'dm-params-area': { style: { display: 'block' } },
        ind1: { value: '100' },
        ind2: { value: '200' },
        dm_ind1_input: { value: '' },
        dm_ind2_input: { value: '' }
    };

    const root = {
        window: {},
        document: {
            getElementById(id) {
                return Object.prototype.hasOwnProperty.call(elements, id) ? elements[id] : null;
            }
        },
        isIndicatorPromptAllowed() {
            return true;
        },
        isIndicatorAllowed() {
            return true;
        },
        ensureSupportSysVars() {
            ensureCalled += 1;
        },
        readIndicatorState() {
            return indicatorState;
        },
        setIndicatorState(nextState) {
            indicatorState = nextState;
        },
        UI: {
            toast(text, type) {
                toasts.push({ text, type });
            }
        },
        saveCloudData() {
            saveCloudCalls += 1;
            return Promise.resolve(true);
        }
    };

    const runtime = createDataManagerParamsRuntime(root);
    let renderStatusCalls = 0;
    let restoreCalls = 0;
    let persistCalls = 0;
    let scheduledStatusCalls = 0;
    const manager = {
        renderDataManagerStatus() {
            renderStatusCalls += 1;
        },
        scheduleDataManagerStatusRender(options = {}) {
            scheduledStatusCalls += 1;
            assert.strictEqual(options.delay, 0);
            assert.strictEqual(options.timeout, 900);
            this.renderDataManagerStatus();
        },
        restoreGrade9IndicatorTemplate() {
            restoreCalls += 1;
            indicatorState = { ind1: '111', ind2: '222' };
            return true;
        },
        persistGrade9IndicatorTemplate() {
            persistCalls += 1;
        }
    };

    runtime.renderParams(manager);
    assert.strictEqual(restoreCalls, 1);
    assert.strictEqual(elements.dm_ind1_input.value, '111');
    assert.strictEqual(elements.dm_ind2_input.value, '222');
    assert.strictEqual(renderStatusCalls > 0, true);
    assert.strictEqual(scheduledStatusCalls, 1);

    elements.dm_ind1_input.value = '130';
    elements.dm_ind1_input.oninput();
    assert.strictEqual(indicatorState.ind1, '130');
    assert.strictEqual(scheduledStatusCalls, 2);

    elements.dm_ind2_input.value = '270';
    elements.dm_ind2_input.oninput();
    assert.strictEqual(indicatorState.ind2, '270');
    assert.strictEqual(scheduledStatusCalls, 3);

    await runtime.saveParamsLocally(manager, false);
    assert.strictEqual(ensureCalled > 0, true);
    assert.strictEqual(persistCalls, 1);
    assert.strictEqual(elements.ind1.value, '130');
    assert.strictEqual(elements.ind2.value, '270');
    assert.strictEqual(saveCloudCalls, 1);
    assert.strictEqual(toasts.some((item) => item.type === 'info'), true);
    assert.strictEqual(toasts.some((item) => item.type === 'success'), true);

    toasts.length = 0;
    await runtime.saveParamsLocally(manager, true);
    assert.strictEqual(toasts.length, 1);
    assert.strictEqual(toasts[0].type, 'success');

    root.isIndicatorPromptAllowed = () => false;
    runtime.renderParams(manager);
    assert.strictEqual(elements['dm-params-area'].style.display, 'none');

    let idleOptions = null;
    let idleRenderStatusCalls = 0;
    const idleRoot = {
        ...root,
        isIndicatorPromptAllowed() {
            return true;
        },
        SystemPerformance: {
            scheduleIdle(callback, options) {
                idleOptions = options;
                callback();
            }
        }
    };
    const idleRuntime = createDataManagerParamsRuntime(idleRoot);
    idleRuntime.renderParams({
        restoreGrade9IndicatorTemplate() {
            return true;
        },
        renderDataManagerStatus() {
            idleRenderStatusCalls += 1;
        }
    });
    assert.strictEqual(idleOptions.delay, 0);
    assert.strictEqual(idleOptions.timeout, 900);
    assert.strictEqual(idleRenderStatusCalls, 1);

    root.isIndicatorAllowed = () => false;
    const currentSaveCalls = saveCloudCalls;
    await runtime.saveParamsLocally(manager, false);
    assert.strictEqual(saveCloudCalls, currentSaveCalls);

    console.log('data-manager-params-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
