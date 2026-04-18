(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerGrade9TemplateRuntime) return;
    root.DataManagerGrade9TemplateRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerGrade9TemplateRuntime(root) {
    function safeParseJson(text) {
        try {
            return JSON.parse(text);
        } catch (_) {
            return null;
        }
    }

    function getExamMeta() {
        return typeof root.getExamMetaFromUI === 'function' ? root.getExamMetaFromUI() : null;
    }

    function isGrade9Context() {
        const meta = getExamMeta();
        if (meta && String(meta.grade || '') === '9') return true;
        if (root.CONFIG && String(root.CONFIG.name || '').includes('9')) return true;
        return false;
    }

    function getGrade9TemplateKey(_manager, type) {
        const cohortId = root.CURRENT_COHORT_ID
            || (typeof root.readWorkspaceCohortId === 'function' ? root.readWorkspaceCohortId() : '')
            || 'GLOBAL';
        return `GRADE9_${String(type || '').trim()}_${cohortId}`;
    }

    function getIndicatorState() {
        if (typeof root.readIndicatorState === 'function') {
            const state = root.readIndicatorState();
            if (state && typeof state === 'object') return state;
        }
        return { ind1: '', ind2: '' };
    }

    function getTargetsState() {
        if (typeof root.readTargetsState === 'function') {
            const state = root.readTargetsState();
            if (state && typeof state === 'object' && !Array.isArray(state)) return state;
        }
        return {};
    }

    function restoreGrade9IndicatorTemplate(manager) {
        if (!isGrade9Context(manager)) return false;
        const key = getGrade9TemplateKey(manager, 'INDICATOR');
        const storage = root.localStorage;
        if (!storage || typeof storage.getItem !== 'function') return false;

        const raw = storage.getItem(key);
        if (!raw) return false;
        const saved = safeParseJson(raw);
        if (!saved || (!saved.ind1 && !saved.ind2)) return false;

        if (typeof root.setIndicatorState === 'function') {
            root.setIndicatorState({ ind1: saved.ind1 || '', ind2: saved.ind2 || '' });
        }
        const doc = root.document;
        const main1 = doc && typeof doc.getElementById === 'function' ? doc.getElementById('ind1') : null;
        const main2 = doc && typeof doc.getElementById === 'function' ? doc.getElementById('ind2') : null;
        if (main1 && !main1.value) main1.value = saved.ind1 || '';
        if (main2 && !main2.value) main2.value = saved.ind2 || '';
        return true;
    }

    function persistGrade9IndicatorTemplate(manager) {
        if (!isGrade9Context(manager)) return;
        const indicator = getIndicatorState();
        const payload = { ind1: indicator.ind1 || '', ind2: indicator.ind2 || '' };
        if (!payload.ind1 && !payload.ind2) return;

        const key = getGrade9TemplateKey(manager, 'INDICATOR');
        const storage = root.localStorage;
        if (!storage || typeof storage.setItem !== 'function') return;
        storage.setItem(key, JSON.stringify(payload));
    }

    function restoreGrade9TargetsTemplate(manager) {
        if (!isGrade9Context(manager)) return false;
        const key = getGrade9TemplateKey(manager, 'TARGETS');
        const storage = root.localStorage;
        if (!storage || typeof storage.getItem !== 'function') return false;

        const raw = storage.getItem(key);
        if (!raw) return false;
        const saved = safeParseJson(raw);
        if (!saved || !Object.keys(saved).length) return false;

        if (typeof root.setTargetsState === 'function') {
            root.setTargetsState(saved);
        }
        return true;
    }

    function persistGrade9TargetsTemplate(manager) {
        if (!isGrade9Context(manager)) return;
        const targets = getTargetsState();
        const key = getGrade9TemplateKey(manager, 'TARGETS');
        const storage = root.localStorage;
        if (!storage || typeof storage.removeItem !== 'function' || typeof storage.setItem !== 'function') return;

        if (!Object.keys(targets).length) {
            storage.removeItem(key);
            return;
        }
        storage.setItem(key, JSON.stringify(targets));
    }

    return {
        isGrade9Context,
        getGrade9TemplateKey,
        restoreGrade9IndicatorTemplate,
        persistGrade9IndicatorTemplate,
        restoreGrade9TargetsTemplate,
        persistGrade9TargetsTemplate
    };
});
