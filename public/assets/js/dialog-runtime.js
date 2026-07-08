(function installDialogRuntime(root) {
    if (!root) return;

    const nativeAlert = typeof root.alert === 'function' ? root.alert.bind(root) : null;
    const nativeConfirm = typeof root.confirm === 'function' ? root.confirm.bind(root) : null;
    const nativePrompt = typeof root.prompt === 'function' ? root.prompt.bind(root) : null;
    const UI = root.UI || {};

    function text(value) {
        return String(value == null ? '' : value);
    }

    function inferAlertIcon(message, fallback = 'info') {
        const value = text(message);
        if (/[❌失败错误异常中断]/.test(value)) return 'error';
        if (/[⚠️警告注意风险]/.test(value)) return 'warning';
        if (/[✅成功完成]/.test(value)) return 'success';
        return fallback;
    }

    function getSwal() {
        return root.Swal && typeof root.Swal.fire === 'function' ? root.Swal : null;
    }

    const TOP_MODAL_BASE_Z_INDEX = 1000000;
    let topModalZIndex = TOP_MODAL_BASE_Z_INDEX;

    function isTopLayerCandidate(node) {
        if (!node || node.nodeType !== 1) return false;
        if (node.matches?.('.modal, .upload-school-map-modal, .swal2-container, [role="dialog"], [aria-modal="true"]')) return true;
        return false;
    }

    function isDisplayed(node) {
        if (!node || node.nodeType !== 1) return false;
        const style = root.getComputedStyle ? root.getComputedStyle(node) : null;
        if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
        return node.style?.display !== 'none';
    }

    function bringSchoolModalToFront(node) {
        if (!isTopLayerCandidate(node) || !isDisplayed(node)) return 0;
        topModalZIndex += 10;
        node.style.zIndex = String(topModalZIndex);
        node.dataset.schoolTopLayer = String(topModalZIndex);
        return topModalZIndex;
    }

    function scanTopLayerCandidates(rootNode) {
        if (!rootNode || !rootNode.querySelectorAll) return;
        if (isTopLayerCandidate(rootNode)) bringSchoolModalToFront(rootNode);
        rootNode.querySelectorAll('.modal, .upload-school-map-modal, .swal2-container, [role="dialog"], [aria-modal="true"]').forEach((node) => {
            bringSchoolModalToFront(node);
        });
    }

    function installTopLayerObserver() {
        if (!root.document || !root.MutationObserver || root.__SCHOOL_TOP_LAYER_OBSERVER__) return;
        root.__SCHOOL_TOP_LAYER_OBSERVER__ = new root.MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(scanTopLayerCandidates);
                    return;
                }
                if (mutation.type === 'attributes') {
                    bringSchoolModalToFront(mutation.target);
                }
            });
        });
        root.__SCHOOL_TOP_LAYER_OBSERVER__.observe(root.document.documentElement || root.document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'open', 'aria-hidden']
        });
    }

    installTopLayerObserver();

    UI.alert = async function alertDialog(message, type = 'info') {
        const swal = getSwal();
        if (swal) {
            await swal.fire({
                icon: type === 'info' ? inferAlertIcon(message, 'info') : type,
                title: type === 'error' ? '操作未完成' : '提示',
                text: text(message),
                confirmButtonText: '确定'
            });
            return;
        }
        if (nativeAlert) nativeAlert(text(message));
    };

    UI.confirm = async function confirmDialog(message, options = {}) {
        const swal = getSwal();
        if (swal) {
            const result = await swal.fire({
                icon: options.icon || 'warning',
                title: options.title || '请确认',
                text: text(message),
                showCancelButton: true,
                confirmButtonText: options.confirmText || '确认',
                cancelButtonText: options.cancelText || '取消',
                reverseButtons: true,
                focusCancel: options.focusCancel !== false
            });
            return !!result.isConfirmed;
        }
        return nativeConfirm ? !!nativeConfirm(text(message)) : false;
    };

    UI.prompt = async function promptDialog(message, defaultValue = '', options = {}) {
        const swal = getSwal();
        if (swal) {
            const result = await swal.fire({
                icon: options.icon || 'question',
                title: options.title || '请输入',
                text: text(message),
                input: options.input || 'text',
                inputValue: text(defaultValue),
                inputAttributes: options.inputAttributes || {},
                showCancelButton: true,
                confirmButtonText: options.confirmText || '确认',
                cancelButtonText: options.cancelText || '取消',
                inputValidator: options.inputValidator
            });
            return result.isConfirmed ? result.value : null;
        }
        return nativePrompt ? nativePrompt(text(message), text(defaultValue)) : null;
    };

    root.UI = UI;
    root.SchoolDialogRuntime = {
        alert: UI.alert,
        confirm: UI.confirm,
        prompt: UI.prompt,
        bringToFront: bringSchoolModalToFront
    };
    root.bringSchoolModalToFront = bringSchoolModalToFront;
})(window);
