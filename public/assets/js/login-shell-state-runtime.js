(function installLoginShellStateRuntime(root) {
    'use strict';

    if (root.LoginShellState?.runtimeVersion === '1') return;

    function setOverlayVisibility(overlay, visible, options = {}) {
        if (!overlay || !overlay.style) return false;
        const shouldShow = !!visible;

        // The login skin intentionally uses display:flex!important. Applying the
        // matching priority here keeps authentication state authoritative.
        overlay.style.setProperty('display', shouldShow ? 'flex' : 'none', 'important');
        overlay.style.visibility = shouldShow ? 'visible' : 'hidden';
        overlay.style.opacity = shouldShow ? '1' : '0';
        overlay.style.pointerEvents = shouldShow ? 'auto' : 'none';
        overlay.setAttribute?.('aria-hidden', shouldShow ? 'false' : 'true');
        try { overlay.inert = !shouldShow; } catch (_) { /* inert is best-effort */ }

        if (options.loginState) overlay.dataset.loginState = options.loginState;
        if (options.loginModal) overlay.dataset.loginModal = options.loginModal;
        return true;
    }

    root.LoginShellState = {
        runtimeVersion: '1',
        setOverlayVisibility
    };
    root.setLoginOverlayVisibility = setOverlayVisibility;
}(window));
