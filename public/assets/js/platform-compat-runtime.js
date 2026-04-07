(() => {
    if (typeof window === 'undefined' || window.__PLATFORM_COMPAT_RUNTIME__) return;
    window.__PLATFORM_COMPAT_RUNTIME__ = true;

    const root = document.documentElement;
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    function resolveViewport() {
        const visual = window.visualViewport;
        const width = Math.max(
            0,
            Math.round(
                Math.min(
                    Number(visual?.width || 0) || Infinity,
                    Number(window.innerWidth || 0) || Infinity,
                    Number(root.clientWidth || 0) || Infinity
                )
            )
        ) || Math.round(Number(window.innerWidth || root.clientWidth || 0));
        const height = Math.max(
            0,
            Math.round(Number(visual?.height || window.innerHeight || root.clientHeight || 0))
        );
        const layoutHeight = Math.round(Number(window.innerHeight || root.clientHeight || height || 0));
        const offsetTop = Math.max(0, Math.round(Number(visual?.offsetTop || 0)));
        const offsetLeft = Math.max(0, Math.round(Number(visual?.offsetLeft || 0)));
        const keyboardInset = Math.max(0, layoutHeight - height - offsetTop);
        return { width, height, offsetTop, offsetLeft, keyboardInset };
    }

    function computeViewportClass(width, height) {
        const shortEdge = Math.min(width || Number.MAX_SAFE_INTEGER, height || Number.MAX_SAFE_INTEGER);
        if (shortEdge <= 520) return 'compact';
        if (shortEdge <= 960) return 'medium';
        return 'expanded';
    }

    function detectPlatform() {
        const userAgent = String(window.navigator?.userAgent || '');
        const isAndroid = /android/i.test(userAgent);
        const isIOS = /iphone|ipad|ipod/i.test(userAgent);
        const isStandalone = Boolean(
            window.navigator?.standalone ||
            window.matchMedia?.('(display-mode: standalone)').matches
        );
        const isWebView = Boolean(
            window.Capacitor ||
            /\bwv\b/i.test(userAgent) ||
            (isIOS && /applewebkit/i.test(userAgent) && !/safari/i.test(userAgent))
        );
        const platformOs = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
        const platformFormFactor = Math.min(
            Number(window.innerWidth || root.clientWidth || 0),
            Number(window.innerHeight || root.clientHeight || 0)
        ) <= 820 ? 'phone' : 'tablet-desktop';
        return { platformOs, isStandalone, isWebView, platformFormFactor };
    }

    function applyPlatformMetrics() {
        const { width, height, offsetTop, offsetLeft, keyboardInset } = resolveViewport();
        const { platformOs, isStandalone, isWebView, platformFormFactor } = detectPlatform();
        if (width > 0) root.style.setProperty('--app-vw', `${width * 0.01}px`);
        if (height > 0) root.style.setProperty('--app-vh', `${height * 0.01}px`);
        root.style.setProperty('--app-visual-offset-top', `${offsetTop}px`);
        root.style.setProperty('--app-visual-offset-left', `${offsetLeft}px`);
        root.style.setProperty('--app-keyboard-inset', `${keyboardInset}px`);
        root.style.setProperty('--app-device-pixel-ratio', `${window.devicePixelRatio || 1}`);

        const pointerMode = coarsePointerQuery.matches ? 'coarse' : 'fine';
        const reducedMotion = reducedMotionQuery.matches ? 'reduce' : 'full';
        const viewportClass = computeViewportClass(width, height);
        const orientation = width > height ? 'landscape' : 'portrait';
        const keyboardState = keyboardInset >= 120 ? 'open' : 'closed';

        root.dataset.pointerMode = pointerMode;
        root.dataset.motion = reducedMotion;
        root.dataset.viewportClass = viewportClass;
        root.dataset.orientation = orientation;
        root.dataset.keyboard = keyboardState;
        root.dataset.platformOs = platformOs;
        root.dataset.appMode = isStandalone ? 'standalone' : 'browser';
        root.dataset.webview = isWebView ? 'true' : 'false';
        root.dataset.formFactor = platformFormFactor;

        if (document.body) {
            document.body.dataset.platformShell = 'apple';
            document.body.dataset.viewportClass = viewportClass;
            document.body.dataset.orientation = orientation;
            document.body.dataset.platformOs = platformOs;
            document.body.dataset.formFactor = platformFormFactor;
            document.body.classList.add('platform-compat-ready');
            document.body.classList.toggle('platform-keyboard-open', keyboardState === 'open');
            document.body.classList.toggle('platform-touch', pointerMode === 'coarse');
        }
    }

    function bindPlatformEvents() {
        const refresh = () => window.requestAnimationFrame(applyPlatformMetrics);
        window.addEventListener('resize', refresh, { passive: true });
        window.addEventListener('orientationchange', refresh, { passive: true });
        window.addEventListener('pageshow', refresh, { passive: true });
        window.addEventListener('focus', refresh, { passive: true });
        document.addEventListener('focusin', refresh, { passive: true });
        document.addEventListener('focusout', refresh, { passive: true });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', refresh, { passive: true });
            window.visualViewport.addEventListener('scroll', refresh, { passive: true });
        }

        if (typeof coarsePointerQuery.addEventListener === 'function') {
            coarsePointerQuery.addEventListener('change', refresh, { passive: true });
        }
        if (typeof reducedMotionQuery.addEventListener === 'function') {
            reducedMotionQuery.addEventListener('change', refresh, { passive: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPlatformMetrics, { once: true });
    } else {
        applyPlatformMetrics();
    }

    bindPlatformEvents();
})();
