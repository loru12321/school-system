(function () {
    const root = window;
    const nav = root.navigator;
    const loc = root.location;
    const SERVICE_WORKER_PATH = './sw.js';
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

    function registerServiceWorker() {
        if (!canRegisterServiceWorker()) return;
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
