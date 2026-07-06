const assert = require('assert');
const path = require('path');

const createDataManagerParamsRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-params-runtime.js'));

async function run() {
    let indicatorState = { ind1: '', ind2: '', highSchoolLine: '' };
    let ensureCalled = 0;
    let saveCloudCalls = 0;
    const toasts = [];

    const elements = {
        'dm-params-area': { style: { display: 'block' } },
        ind1: { value: '100' },
        ind2: { value: '200' },
        dm_ind1_input: { value: '' },
        dm_ind2_input: { value: '' },
        dm_high_school_line_input: { value: '' },
        dm_high_school_line_summary: { innerHTML: '' }
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
        },
        requestAnimationFrame(callback) {
            callback();
        }
    };

    const runtime = createDataManagerParamsRuntime(root);
    let renderStatusCalls = 0;
    let restoreCalls = 0;
    let persistCalls = 0;
    const manager = {
        renderDataManagerStatus() {
            renderStatusCalls += 1;
        },
        restoreGrade9IndicatorTemplate() {
            restoreCalls += 1;
            indicatorState = { ind1: '111', ind2: '222', highSchoolLine: '420' };
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
    assert.strictEqual(elements.dm_high_school_line_input.value, '420');
    assert.strictEqual(renderStatusCalls > 0, true);
    assert.strictEqual(renderStatusCalls, 1);

    elements.dm_ind1_input.value = '130';
    elements.dm_ind1_input.oninput();
    assert.strictEqual(indicatorState.ind1, '130');
    assert.strictEqual(renderStatusCalls, 2);

    elements.dm_ind2_input.value = '270';
    elements.dm_ind2_input.oninput();
    assert.strictEqual(indicatorState.ind2, '270');
    assert.strictEqual(renderStatusCalls, 3);

    elements.dm_high_school_line_input.value = '430';
    elements.dm_high_school_line_input.oninput();
    assert.strictEqual(indicatorState.highSchoolLine, '430');
    assert.strictEqual(renderStatusCalls, 4);

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

    let idleRenderStatusCalls = 0;
    const idleRoot = {
        ...root,
        isIndicatorPromptAllowed() {
            return true;
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
    assert.strictEqual(idleRenderStatusCalls, 1);

    root.isIndicatorAllowed = () => false;
    elements.dm_high_school_line_input.value = '';
    const currentSaveCalls = saveCloudCalls;
    await runtime.saveParamsLocally(manager, false);
    assert.strictEqual(saveCloudCalls, currentSaveCalls);
    assert.strictEqual(toasts[toasts.length - 1].type, 'warning');

    elements.dm_high_school_line_input.value = '390';
    await runtime.saveParamsLocally(manager, false);
    assert.strictEqual(indicatorState.highSchoolLine, '390');
    assert.strictEqual(saveCloudCalls, currentSaveCalls + 1);

    console.log('data-manager-params-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
