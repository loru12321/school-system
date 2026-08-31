(function () {
    const root = window;
    const nav = root.navigator;
    const loc = root.location;
    const SERVICE_WORKER_VERSION = 'runtime-d7e86e61bbbb';
    const SERVICE_WORKER_PATH = './sw-runtime-d7e86e61bbbb.js';
    const ALLOWED_HOSTS = new Set([
        'schoolsystem.com.cn',
        'www.schoolsystem.com.cn',
        'localhost',
        '127.0.0.1'
    ]);

    function isDebugEnabled() {
        try {
            return root.localStorage && root.localStorage.SCHOOL_SW_DEBUG === 'true';
        } catch (error) {
            return false;
        }
    }

    function canRegisterServiceWorker() {
        if (!nav || !('serviceWorker' in nav)) return false;
        if (!root.isSecureContext && loc.hostname !== 'localhost' && loc.hostname !== '127.0.0.1') return false;
        return ALLOWED_HOSTS.has(loc.hostname);
    }

    function scheduleRegistration(task) {
        if (typeof root.requestIdleCallback === 'function') {
            root.requestIdleCallback(task, { timeout: 3000 });
            return;
        }
        root.setTimeout(task, 1500);
    }

    function isLoginOverlayVisible() {
        try {
            const overlay = root.document && root.document.getElementById('login-overlay');
            if (!overlay) return false;
            const style = root.getComputedStyle ? root.getComputedStyle(overlay) : null;
            return style ? style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' : true;
        } catch (_) {
            return false;
        }
    }

    function shouldReloadAfterControllerChange() {
        if (isLoginOverlayVisible()) return false;
        try {
            const app = root.document && root.document.getElementById('app');
            const appVisible = app && root.getComputedStyle
                ? root.getComputedStyle(app).display !== 'none'
                : !!app;
            const loggedIn = root.document && root.document.body && /role-/.test(root.document.body.className || '');
            return !!(appVisible && loggedIn);
        } catch (_) {
            return false;
        }
    }

    function registerServiceWorker() {
        if (!canRegisterServiceWorker()) return;
        const hadController = !!nav.serviceWorker.controller;
        nav.serviceWorker.addEventListener('controllerchange', function () {
            if (!hadController) return;
            if (!shouldReloadAfterControllerChange()) return;
            try {
                if (root.sessionStorage && root.sessionStorage.SCHOOL_SW_RELOADED_VERSION === SERVICE_WORKER_VERSION) return;
                if (root.sessionStorage) root.sessionStorage.SCHOOL_SW_RELOADED_VERSION = SERVICE_WORKER_VERSION;
            } catch (_) {}
            root.location.reload();
        });
        scheduleRegistration(function () {
            nav.serviceWorker.register(SERVICE_WORKER_PATH).catch(function (error) {
                if (isDebugEnabled() && root.console && typeof root.console.warn === 'function') {
                    root.console.warn('[SW] registration skipped:', error);
                }
            });
        });
    }

    if (document.readyState === 'complete') {
        registerServiceWorker();
    } else {
        root.addEventListener('load', registerServiceWorker, { once: true });
    }
}());
