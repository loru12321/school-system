(function installModuleUrlState(root) {
    'use strict';

    if (!root || root.__MODULE_URL_STATE_INSTALLED__) return;
    root.__MODULE_URL_STATE_INSTALLED__ = true;

    let applyingHistory = false;
    let ready = false;

    function readModuleFromUrl() {
        try {
            return String(new URL(root.location.href).searchParams.get('module') || '').trim();
        } catch (_) {
            return '';
        }
    }

    function writeModuleToUrl(moduleId) {
        const id = String(moduleId || '').trim();
        if (!id || applyingHistory || !ready) return;
        try {
            const url = new URL(root.location.href);
            if (url.searchParams.get('module') === id) return;
            url.searchParams.set('module', id);
            root.history.pushState({ ...(root.history.state || {}), schoolModule: id }, '', url);
        } catch (_) {}
    }

    function activateUrlModule() {
        const id = readModuleFromUrl();
        if (!id || typeof root.switchTab !== 'function') return false;
        applyingHistory = true;
        try {
            root.switchTab(id);
            return !!root.document?.getElementById(id)?.classList.contains('active');
        } finally {
            applyingHistory = false;
        }
    }

    function queueUrlActivation() {
        const run = () => {
            if (activateUrlModule()) return;
            root.setTimeout(activateUrlModule, 500);
            root.setTimeout(activateUrlModule, 1500);
        };
        root.setTimeout(run, 0);
    }

    root.addEventListener('school:module-changed', (event) => {
        writeModuleToUrl(event?.detail?.id);
    });
    root.addEventListener('popstate', () => activateUrlModule());

    const appReady = root.__APP_MODULES_LOADED__ === true
        ? Promise.resolve()
        : new Promise((resolve) => root.addEventListener('school:app-modules-ready', resolve, { once: true }));
    const authReady = root.AuthReady && typeof root.AuthReady.then === 'function'
        ? root.AuthReady.catch(() => undefined)
        : Promise.resolve();

    Promise.all([appReady, authReady]).then(() => {
        ready = true;
        queueUrlActivation();
    });
}(window));
