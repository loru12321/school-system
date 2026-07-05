(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerParamsRuntime) return;
    root.DataManagerParamsRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerParamsRuntime(root) {
    let pendingStatusRender = false;

    function call(fn, fallback) {
        if (typeof fn !== 'function') return fallback;
        return fn();
    }

    function getIndicatorState() {
        return call(root.readIndicatorState, { ind1: '', ind2: '' }) || { ind1: '', ind2: '' };
    }

    function setIndicatorState(nextState) {
        if (typeof root.setIndicatorState === 'function') root.setIndicatorState(nextState || { ind1: '', ind2: '' });
    }

    function readInputValue(id) {
        const doc = root.document;
        if (!doc || typeof doc.getElementById !== 'function') return '';
        const el = doc.getElementById(id);
        return el ? String(el.value || '') : '';
    }

    function writeInputValue(id, value) {
        const doc = root.document;
        if (!doc || typeof doc.getElementById !== 'function') return null;
        const el = doc.getElementById(id);
        if (el) el.value = value || '';
        return el;
    }

    function safeToast(text, type) {
        if (root.UI && typeof root.UI === 'object' && typeof root.UI.toast === 'function') {
            root.UI.toast(text, type);
        }
    }

    function renderStatus(manager) {
        if (manager && typeof manager.renderDataManagerStatus === 'function') {
            manager.renderDataManagerStatus();
            return;
        }
        const globalManager = root.window && root.window.DataManager ? root.window.DataManager : null;
        if (globalManager && typeof globalManager.renderDataManagerStatus === 'function') {
            globalManager.renderDataManagerStatus();
        }
    }

    function scheduleStatusRender(manager) {
        if (manager && typeof manager.scheduleDataManagerStatusRender === 'function') {
            manager.scheduleDataManagerStatusRender({ delay: 0, timeout: 900 });
            return;
        }
        if (root.SystemPerformance && typeof root.SystemPerformance.scheduleIdle === 'function') {
            if (pendingStatusRender) return;
            pendingStatusRender = true;
            root.SystemPerformance.scheduleIdle(() => {
                pendingStatusRender = false;
                renderStatus(manager);
            }, { label: 'data-manager-params-status', delay: 0, timeout: 900 });
            return;
        }
        const raf = typeof root.requestAnimationFrame === 'function' ? root.requestAnimationFrame : null;
        const timer = typeof root.setTimeout === 'function' ? root.setTimeout : null;
        if (!raf && !timer) {
            renderStatus(manager);
            return;
        }
        if (pendingStatusRender) return;
        pendingStatusRender = true;
        const run = function () {
            pendingStatusRender = false;
            renderStatus(manager);
        };
        if (raf) raf(run);
        else timer(run, 0);
    }

    function renderParams(manager) {
        if (!manager) return;

        const indicatorPromptAllowed = typeof root.isIndicatorPromptAllowed === 'function'
            ? root.isIndicatorPromptAllowed()
            : false;
        if (!indicatorPromptAllowed) {
            const doc = root.document;
            const area = doc && typeof doc.getElementById === 'function' ? doc.getElementById('dm-params-area') : null;
            if (area && area.style) area.style.display = 'none';
            renderStatus(manager);
            return;
        }

        if (typeof root.ensureSupportSysVars === 'function') root.ensureSupportSysVars();

        let i1 = getIndicatorState().ind1;
        let i2 = getIndicatorState().ind2;
        if (!i1 && !i2 && typeof manager.restoreGrade9IndicatorTemplate === 'function') {
            manager.restoreGrade9IndicatorTemplate();
            i1 = getIndicatorState().ind1;
            i2 = getIndicatorState().ind2;
        }

        const mainInput1 = writeInputValue('ind1', readInputValue('ind1'));
        const mainInput2 = writeInputValue('ind2', readInputValue('ind2'));
        if (!i1 && mainInput1) i1 = mainInput1.value;
        if (!i2 && mainInput2) i2 = mainInput2.value;

        const el1 = writeInputValue('dm_ind1_input', i1 || '');
        const el2 = writeInputValue('dm_ind2_input', i2 || '');

        if (el1) {
            el1.oninput = function () {
                setIndicatorState({ ...getIndicatorState(), ind1: this.value });
                scheduleStatusRender(manager);
            };
        }
        if (el2) {
            el2.oninput = function () {
                setIndicatorState({ ...getIndicatorState(), ind2: this.value });
                scheduleStatusRender(manager);
            };
        }

        scheduleStatusRender(manager);
    }

    async function saveParamsLocally(manager, skipCloudSync = false) {
        const indicatorAllowed = typeof root.isIndicatorAllowed === 'function'
            ? root.isIndicatorAllowed()
            : false;
        if (!indicatorAllowed) return;
        if (typeof root.ensureSupportSysVars === 'function') root.ensureSupportSysVars();

        const v1 = readInputValue('dm_ind1_input');
        const v2 = readInputValue('dm_ind2_input');
        setIndicatorState({ ind1: v1, ind2: v2 });

        writeInputValue('ind1', v1);
        writeInputValue('ind2', v2);

        if (manager && typeof manager.persistGrade9IndicatorTemplate === 'function') {
            manager.persistGrade9IndicatorTemplate();
        }

        if (!skipCloudSync && typeof root.saveCloudData === 'function') {
            safeToast('💾 参数已暂存，正在后台同步...', 'info');
            const ok = await root.saveCloudData({ background: true, sourceLabel: 'params-auto-save' });
            if (ok) safeToast('✅ 参数已写入本地缓存，云端将继续后台同步', 'success');
            else safeToast('⚠️ 参数已暂存，本次未成功同步到云端', 'warning');
            return;
        }
        safeToast('✅ 参数已暂存到内存 (未连接云端)', 'success');
    }

    return {
        renderParams,
        saveParamsLocally
    };
});
