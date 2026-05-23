var DIRECT_SUPABASE_URL = 'https://dpwsxxgojpqevzwyxrot.supabase.co';
var DIRECT_SUPABASE_KEY = String(window.PUBLIC_SUPABASE_KEY || '').trim();
var DIRECT_EDGE_GATEWAY_URL = 'https://dpwsxxgojpqevzwyxrot.supabase.co/functions/v1/edu-gateway-v2';
var DIRECT_PROXY_ORIGIN = 'https://schoolsystem.com.cn';
var DIRECT_CLOUDFLARE_GATEWAY_URL = 'https://schoolsystem.com.cn/api/edu-gateway';
var BOOT_ASSET_VERSION_FALLBACK = '20260511-workspace-split-v1';

function bootDebugLog(...args) {
    try {
        if (window.SCHOOL_SYSTEM_DEBUG === true || window.localStorage?.getItem('SCHOOL_SYSTEM_DEBUG') === 'true') {
            console.debug(...args);
        }
    } catch (_) {}
}

function getBootRuntimeAssetVersion() {
    const currentScript = document.currentScript;
    const scripts = Array.from(document.scripts || []);
    const bootScript = (currentScript && /boot-runtime\.js/i.test(String(currentScript.src || '')))
        ? currentScript
        : scripts.slice().reverse().find((script) => /boot-runtime\.js/i.test(String(script.src || '')));
    const src = String(bootScript && bootScript.src || '');
    const match = src.match(/[?&]v=([^&#]+)/i);
    if (match && match[1]) {
        try {
            return decodeURIComponent(match[1]);
        } catch (_) {
            return match[1];
        }
    }
    return String(window.__CORE_VERSION__ || '').trim() || BOOT_ASSET_VERSION_FALLBACK;
}

function getVersionedAssetPath(src) {
    const cleanSrc = String(src || '').trim();
    if (!cleanSrc) return cleanSrc;
    const version = String(window.__BOOT_ASSET_VERSION__ || window.__CORE_VERSION__ || BOOT_ASSET_VERSION_FALLBACK).trim();
    if (!version) return cleanSrc;
    const separator = cleanSrc.includes('?') ? '&' : '?';
    return `${cleanSrc}${separator}v=${encodeURIComponent(version)}`;
}

function clearAuthReadySafetyTimeout() {
    if (window.__AUTH_READY_TIMEOUT_ID__) {
        clearTimeout(window.__AUTH_READY_TIMEOUT_ID__);
        window.__AUTH_READY_TIMEOUT_ID__ = 0;
    }
}

function markAuthReadyResolved() {
    if (window.__AUTH_READY__) return;
    window.__AUTH_READY__ = true;
    clearAuthReadySafetyTimeout();
    if (typeof window.resolveAuthReady === 'function') {
        const resolve = window.resolveAuthReady;
        window.resolveAuthReady = null;
        resolve();
    }
}

function markAppModulesReady() {
    if (window.__APP_MODULES_LOADED__ === true) return;
    window.__APP_MODULES_LOADED__ = true;
    if (typeof window.wrapXlsxRuntimeExports === 'function') window.wrapXlsxRuntimeExports();
    window.dispatchEvent(new CustomEvent('school:app-modules-ready'));
}

function armAuthReadySafetyTimeout(timeoutMs = 15000) {
    if (window.__AUTH_READY__ || window.__AUTH_READY_TIMEOUT_ID__) return;
    window.__AUTH_READY_TIMEOUT_ID__ = window.setTimeout(() => {
        if (window.__AUTH_READY__) return;
        console.warn('[boot-runtime] AuthReady safety timeout reached');
        markAuthReadyResolved();
    }, timeoutMs);
}

// Initialize AuthReady promise early to guard the UI transition
window.__BOOT_ASSET_VERSION__ = window.__BOOT_ASSET_VERSION__ || getBootRuntimeAssetVersion();
window.AuthReady = new Promise((resolve) => {
    window.resolveAuthReady = resolve;
});
window.markAuthReadyResolved = markAuthReadyResolved;
window.armAuthReadySafetyTimeout = armAuthReadySafetyTimeout;
window.waitForAuthReady = function waitForAuthReady(timeoutMs = 15000) {
    armAuthReadySafetyTimeout(timeoutMs);
    return window.AuthReady;
};

var sbClient = window.sbClient || null;

document.addEventListener('DOMContentLoaded', function () {
    if (typeof initMacroAnomalyConfigUI === 'function') initMacroAnomalyConfigUI();
    scheduleAppModuleWarmup();
});

var BOOT_VENDOR_MODULES = [
    './assets/vendor/alpinejs/cdn.min.js'
];

var DEFERRED_APP_MODULES = [];

var SYSTEM_RUNTIME_SKILLS = {
    'crypto-vendor': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['CryptoJS', 'freshman-simulator', 'inquiry-package'],
        entries: [
            { key: 'crypto-vendor', src: './assets/vendor/crypto-js/crypto-js.min.js' }
        ]
    },
    'shell-polish': {
        mode: 'idle',
        warmup: 'demand',
        triggers: ['shell-polish', 'refreshShellEnhancements'],
        entries: [
            { key: 'shell-polish', src: './assets/js/shell-polish-runtime.js' }
        ]
    },
    'sweetalert-vendor': {
        mode: 'idle',
        warmup: 'demand',
        triggers: ['Swal', 'uiAlert', 'modal-alert'],
        entries: [
            { key: 'sweetalert-vendor', src: './assets/vendor/sweetalert2/sweetalert2.all.min.js' }
        ]
    },
    'chart-vendor': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['Chart', 'chart-render'],
        entries: [
            { key: 'chart-vendor', src: './assets/vendor/chart.js/chart.umd.min.js' }
        ]
    },
    'shell-enhancements': {
        mode: 'idle',
        warmup: 'demand',
        triggers: ['app-shell', 'hover-tooltips', 'scroll-effects'],
        entries: [
            { key: 'gsap-vendor', src: './assets/vendor/gsap/gsap.min.js' },
            { key: 'scroll-trigger-vendor', src: './assets/vendor/gsap/ScrollTrigger.min.js' },
            { key: 'popper-vendor', src: './assets/vendor/popperjs/popper.min.js' },
            { key: 'tippy-vendor', src: './assets/vendor/tippyjs/tippy.umd.min.js' },
            { key: 'simplebar-vendor', src: './assets/vendor/simplebar/simplebar.min.js' }
        ]
    },
    'pdf-export': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['downloadSingleReportPDF', 'batchGeneratePDF'],
        entries: [
            { key: 'jspdf-vendor', src: './assets/vendor/jspdf/jspdf.umd.min.js' },
            { key: 'html2canvas-vendor', src: './assets/vendor/html2canvas/html2canvas.min.js' }
        ]
    },
    'report-render': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['report-generator', 'printSingleReport', 'renderSingleReportCardHTML'],
        entries: [
            { key: 'chart-vendor', src: './assets/vendor/chart.js/chart.umd.min.js' },
            { key: 'report-render', src: './assets/js/report-render-runtime.js' },
            { key: 'report-chart', src: './assets/js/report-chart-runtime.js' },
            { key: 'report-export', src: './assets/js/report-export-runtime.js' }
        ]
    },
    'teacher-analysis': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['teacher-analysis', 'cohort-growth', 'correlation-analysis'],
        entries: [
            { key: 'teacher-analysis-core', src: './assets/js/teacher-analysis-core-runtime.js' },
            { key: 'teacher-analysis-ui', src: './assets/js/teacher-analysis-ui-runtime.js' },
            { key: 'teacher-analysis-bridge', src: './assets/js/teacher-analysis-bridge-runtime.js' },
            { key: 'teacher-analysis-main', src: './assets/js/teacher-analysis-main-runtime.js' }
        ]
    },
    'teaching-management': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['student-overview'],
        entries: [
            { key: 'teaching-management', src: './assets/js/teaching-management-runtime.js' },
            { key: 'teaching-management-cloud', src: './assets/js/teaching-management-cloud-runtime.js' },
            { key: 'teaching-management-overview', src: './assets/js/teaching-management-overview-runtime.js' },
            { key: 'student-overview', src: './assets/js/student-overview-runtime.js' },
            { key: 'teaching-management-version', src: './assets/js/teaching-management-version-runtime.js' }
        ]
    },
    'student-compare': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['student-details', 'renderStudentMultiPeriodComparison'],
        entries: [
            { key: 'student-compare-result', src: './assets/js/student-compare-result-runtime.js' },
            { key: 'student-compare-generate', src: './assets/js/student-compare-generate-runtime.js' },
            { key: 'student-compare-cloud', src: './assets/js/student-compare-cloud-runtime.js' }
        ]
    },
    'town-submodule-compare': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['summary', 'town-submodule-compare', 'renderTownSubmoduleMultiPeriodComparison'],
        entries: [
            { key: 'town-submodule-compare', src: './assets/js/town-submodule-compare-runtime.js' }
        ]
    },
    'teacher-compare': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['renderTeacherMultiPeriodComparison'],
        entries: [
            { key: 'teacher-compare-result', src: './assets/js/teacher-compare-result-runtime.js' },
            { key: 'teacher-compare-cloud', src: './assets/js/teacher-compare-cloud-runtime.js' }
        ]
    },
    'macro-compare': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['renderMacroMultiPeriodComparison'],
        entries: [
            { key: 'macro-compare-result', src: './assets/js/macro-compare-result-runtime.js' },
            { key: 'macro-compare-cloud', src: './assets/js/macro-compare-cloud-runtime.js' }
        ]
    },
    'app-download': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['app-download-center'],
        entries: [
            { key: 'app-download', src: './assets/js/app-download-runtime.js' }
        ]
    },
    'school-profile': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['summary', 'showSchoolProfile'],
        entries: [
            { key: 'chart-vendor', src: './assets/vendor/chart.js/chart.umd.min.js' },
            { key: 'school-profile', src: './assets/js/school-profile-runtime.js' }
        ]
    },
    'county-analysis': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['county-analysis', 'county-teacher-portrait', 'county-school-horizontal'],
        entries: [
            { key: 'county-school-horizontal', src: './assets/js/county-school-horizontal-runtime.js' },
            { key: 'county-analysis', src: './assets/js/county-analysis-runtime.js' }
        ]
    },
    'progress-analysis': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['progress-analysis'],
        entries: [
            { key: 'chart-vendor', src: './assets/vendor/chart.js/chart.umd.min.js' },
            { key: 'progress-analysis', src: './assets/js/progress-analysis-runtime.js' }
        ]
    },
    'data-manager-sql': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['data-manager-sql', 'talkToData'],
        entries: [
            { key: 'data-manager-sql', src: './assets/js/data-manager-sql.js' }
        ]
    },
    'mobile-manager': {
        mode: 'conditional',
        warmup: 'mobile',
        triggers: ['mobile-layout'],
        entries: [
            { key: 'mobile-manager', src: './assets/js/mobile-app-runtime.js' }
        ]
    },
    'account-admin': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['account-admin', 'AccountExcel'],
        entries: [
            { key: 'account-admin', src: './assets/js/account-admin-runtime.js' }
        ]
    },
    'history-compare': {
        mode: 'demand',
        warmup: 'full',
        triggers: ['history-compare'],
        entries: [
            { key: 'chart-vendor', src: './assets/vendor/chart.js/chart.umd.min.js' },
            { key: 'history-compare', src: './assets/js/history-compare-runtime.js' }
        ]
    },
    'zhongkao-countdown': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['zhongkao-countdown'],
        entries: [
            { key: 'zhongkao-countdown', src: './assets/js/zhongkao-countdown-runtime.js' }
        ]
    },
    'freshman-exam': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['freshman-simulator', 'exam-arranger'],
        entries: [
            { key: 'chart-vendor', src: './assets/vendor/chart.js/chart.umd.min.js' },
            { key: 'freshman-exam', src: './assets/js/freshman-exam-runtime.js' }
        ]
    },
    'grade-scheduler': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['exam-arranger', 'grade-scheduler'],
        entries: [
            { key: 'grade-scheduler', src: './assets/js/grade-scheduler-runtime.js' }
        ]
    },
    'voice-control': {
        mode: 'idle',
        warmup: 'demand',
        triggers: ['voice-control', 'voice-fab', 'VoiceControl.toggle'],
        entries: [
            { key: 'voice-control', src: './assets/js/voice-control-runtime.js' }
        ]
    },
    'module-help': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['showModuleHelp', 'ensureModuleHelpButton', 'module-help'],
        entries: [
            { key: 'module-help', src: './assets/js/module-help-runtime.js' }
        ]
    },
    'packager': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['exportDistributableHTML'],
        entries: [
            { key: 'packager', src: './assets/js/packager-runtime.js' }
        ]
    },
    'worker-api': {
        mode: 'demand',
        warmup: 'demand',
        triggers: ['WorkerAPI.run'],
        entries: [
            { key: 'worker-api', src: './assets/js/worker-api-runtime.js' }
        ]
    }
};

if (window.SchoolRuntime && typeof window.SchoolRuntime.registerSkill === 'function') {
    Object.keys(SYSTEM_RUNTIME_SKILLS).forEach(function (skillId) {
        window.SchoolRuntime.registerSkill(skillId, SYSTEM_RUNTIME_SKILLS[skillId]);
    });
}

function getLoadedSweetAlertVendor() {
    const swal = window.Swal;
    return swal && !swal.__schoolLazyProxy && typeof swal.fire === 'function' ? swal : null;
}

function buildLazySweetAlertFallbackResult() {
    return {
        isConfirmed: false,
        isDenied: false,
        isDismissed: true,
        dismiss: 'loader-error'
    };
}

function showLazySweetAlertFallback(args, error) {
    console.warn('[boot-runtime] SweetAlert2 lazy load failed:', error);
    try {
        const first = args && args[0];
        const title = typeof first === 'string' ? first : (first && (first.title || first.text || first.html));
        if (title && typeof window.alert === 'function') {
            window.alert(String(title).replace(/<[^>]+>/g, ' '));
        }
    } catch (_) {}
    return buildLazySweetAlertFallbackResult();
}

function installLazySweetAlertProxy() {
    const current = getLoadedSweetAlertVendor();
    if (current) return current;
    if (window.Swal && window.Swal.__schoolLazyProxy) return window.Swal;

    const state = { closeRequested: false };
    const proxy = {
        __schoolLazyProxy: true,
        fire(...args) {
            state.closeRequested = false;
            return window.ensureSweetAlertVendorLoaded()
                .then((swal) => {
                    if (state.closeRequested) {
                        state.closeRequested = false;
                        if (swal && typeof swal.close === 'function') swal.close();
                        return buildLazySweetAlertFallbackResult();
                    }
                    return swal.fire(...args);
                })
                .catch((error) => showLazySweetAlertFallback(args, error));
        },
        close(...args) {
            const swal = getLoadedSweetAlertVendor();
            if (swal && typeof swal.close === 'function') return swal.close(...args);
            state.closeRequested = true;
            return undefined;
        },
        isVisible() {
            const swal = getLoadedSweetAlertVendor();
            return !!(swal && typeof swal.isVisible === 'function' && swal.isVisible());
        },
        getTitle() {
            const swal = getLoadedSweetAlertVendor();
            return swal && typeof swal.getTitle === 'function' ? swal.getTitle() : null;
        },
        showValidationMessage(message) {
            const swal = getLoadedSweetAlertVendor();
            if (swal && typeof swal.showValidationMessage === 'function') {
                return swal.showValidationMessage(message);
            }
            return undefined;
        }
    };

    window.Swal = proxy;
    return proxy;
}

installLazySweetAlertProxy();

var APP_MODULES = [
    './assets/js/auth-state-runtime.js',
    './assets/js/login-entry-runtime.js',
    './assets/js/workspace-state-runtime.js',
    './assets/js/exam-state-runtime.js',
    './assets/js/school-state-runtime.js',
    './assets/js/teacher-state-runtime.js',
    './assets/js/data-state-runtime.js',
    './assets/js/support-state-runtime.js',
    './assets/js/progress-state-runtime.js',
    './assets/js/report-session-state-runtime.js',
    './assets/js/report-performance-runtime.js',
    './assets/js/compare-session-state-runtime.js',
    './assets/js/compare-result-state-runtime.js',
    './assets/js/compare-summary-state-runtime.js',
    './assets/js/cloud-api-runtime.js',
    './assets/js/cloud-connection-runtime.js',
    './assets/js/cloud-data-service-runtime.js',
    './assets/js/cloud.js',
    './assets/js/system-performance-runtime.js',
    './assets/js/cloud-workspace-runtime.js',
    './assets/js/data-cloud-runtime.js',
    './assets/js/issue-manager-runtime.js',
    './assets/js/help-system-runtime.js',
    './assets/js/logger-runtime.js',
    './assets/js/account-manager-runtime.js',
    './assets/js/data-manager-teacher-runtime.js',
    './assets/js/data-manager-student-runtime.js',
    './assets/js/data-manager-archive-runtime.js',
    './assets/js/data-manager-grade9-template-runtime.js',
    './assets/js/data-manager-params-runtime.js',
    './assets/js/data-manager-targets-runtime.js',
    './assets/js/data-manager-school-alias-runtime.js',
    './assets/js/data-manager-save-sync-runtime.js',
    './assets/js/data-manager-history-runtime.js',
    './assets/js/data-manager-tab-runtime.js',
    './assets/js/config-transfer-runtime.js',
    './assets/js/shell-runtime.js',
    './assets/js/workspace-rail-runtime.js',
    './assets/js/virtual-table-runtime.js',
    './assets/js/module-entry-runtime.js',
    './assets/js/ranking-data-service-runtime.js',
    './assets/js/analytics-kernel-runtime.js',
    './assets/js/student-jump-runtime.js',
    './assets/js/student-details-guard-runtime.js',
    './assets/js/teaching-management-modules-runtime.js',
    './assets/js/app-foundation-runtime.js',
    './assets/js/permission-policy-runtime.js',
    './assets/js/teacher-card-store-runtime.js',
    './assets/js/ui-actions-runtime.js',
    './assets/js/runtime-accessors-runtime.js',
    './assets/js/teacher-visibility-runtime.js',
    './assets/js/skin-settings-runtime.js',
    './assets/js/starter-status-runtime.js',
    './assets/js/teacher-sync-runtime.js',
    './assets/js/app.js',
    './assets/js/support-metrics-runtime.js',
    './assets/js/marginal-push-runtime.js',
    './assets/js/seat-adjustment-runtime.js',
    './assets/js/cohort-growth-runtime.js',
    './assets/js/macro-analysis-compat-runtime.js',
    './assets/js/school-normalization-runtime.js',
    './assets/js/compare-shared-runtime.js',
    './assets/js/compare-cloud-context-runtime.js',
    './assets/js/compare-exam-sync-runtime.js',
    './assets/js/report-compare-runtime.js',
    './assets/js/compare-selectors-runtime.js',
    './assets/js/town-submodule-compare-state-runtime.js'
];

var APP_MODULE_PRELOAD_LIMIT = 10;
var APP_MODULE_MOBILE_PRELOAD_LIMIT = 6;
var APP_MODULE_LATE_PREFETCH_LIMIT = 18;
var APP_MODULE_PREFETCH_CHUNK_SIZE = 6;
var APP_MODULE_DESKTOP_BATCH_SIZE = 8;

window.__BOOT_SCRIPT_REGISTRY__ = window.__BOOT_SCRIPT_REGISTRY__ || {};

function normalizeBootModuleKey(src) {
    let value = String(src || '').trim();
    if (!value) return '';
    try {
        value = new URL(value, window.location.href).pathname;
    } catch (_) {}
    value = value.split('#')[0].split('?')[0].replace(/\\/g, '/');
    return value.replace(/^\.?\//, '').replace(/^\/+/, '');
}

function getBootScriptState(src) {
    const key = normalizeBootModuleKey(src);
    return key ? window.__BOOT_SCRIPT_REGISTRY__[key] || '' : '';
}

function markBootScriptState(src, state, script) {
    const key = normalizeBootModuleKey(src);
    if (!key) return;
    window.__BOOT_SCRIPT_REGISTRY__[key] = state;
    if (script) {
        script.dataset.bootKey = key;
        if (state === 'loaded') script.dataset.bootLoaded = 'true';
    }
}

function findBootScriptElement(src, loadedOnly = false) {
    const needle = normalizeBootModuleKey(src);
    if (!needle) return null;
    const state = getBootScriptState(src);
    if (state === 'loaded' && loadedOnly) return { dataset: { bootLoaded: 'true' } };

    const scripts = Array.from(document.scripts || []);
    const found = scripts.find((script) => {
        const bootKey = String(script.dataset?.bootKey || '').trim();
        if (bootKey && bootKey === needle) return !loadedOnly || script.dataset.bootLoaded === 'true';
        const candidate = normalizeBootModuleKey(script.getAttribute('src') || script.src || '');
        return candidate === needle && (!loadedOnly || script.dataset.bootLoaded === 'true');
    }) || null;
    if (found) {
        markBootScriptState(src, found.dataset.bootLoaded === 'true' ? 'loaded' : 'loading', found);
    }
    return found;
}

function isBootScriptLoaded(src) {
    return !!findBootScriptElement(src, true);
}

function hasBootScriptElement(src) {
    const key = normalizeBootModuleKey(src);
    return !!key && (!!getBootScriptState(src) || !!findBootScriptElement(src));
}

function prefetchAppModuleList(modules, key) {
    const head = document.head;
    if (!head) return;
    modules.forEach((src) => {
        const href = getVersionedAssetPath(src);
        const attr = `data-${key}-prefetch`;
        if (!href || hasBootScriptElement(src) || head.querySelector(`link[${attr}="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'script';
        link.href = href;
        link.setAttribute(attr, href);
        head.appendChild(link);
    });
}

function preloadAppModuleList(modules, key) {
    const head = document.head;
    if (!head) return;
    modules.forEach((src) => {
        const href = getVersionedAssetPath(src);
        const attr = `data-${key}-preload`;
        if (!href || head.querySelector(`link[${attr}="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = href;
        link.setAttribute(attr, href);
        head.appendChild(link);
    });
}

function getAppModulePreloadLimit() {
    try {
        const stored = Number(localStorage.getItem('SYSTEM_APP_PRELOAD_LIMIT') || 0);
        if (Number.isFinite(stored) && stored > 0) return Math.max(1, Math.floor(stored));
    } catch (_) {}
    if (isRuntimeMobileViewport() || getRuntimeLoadProfile() === 'lazy') {
        return APP_MODULE_MOBILE_PRELOAD_LIMIT;
    }
    return APP_MODULE_PRELOAD_LIMIT;
}

function shouldPrefetchLateAppCoreModules() {
    if (isRuntimeMobileViewport()) return false;
    if (getRuntimeLoadProfile() === 'lazy') return false;
    try {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
        if (connection?.saveData) return false;
        const effectiveType = String(connection?.effectiveType || '').toLowerCase();
        if (effectiveType === 'slow-2g' || effectiveType === '2g') return false;
    } catch (_) {}
    return true;
}

function getLateAppCorePrefetchLimit() {
    try {
        const stored = Number(localStorage.getItem('SYSTEM_APP_LATE_PREFETCH_LIMIT') || 0);
        if (Number.isFinite(stored) && stored >= 0) return Math.max(0, Math.floor(stored));
    } catch (_) {}
    return APP_MODULE_LATE_PREFETCH_LIMIT;
}

function getAppModulePrefetchChunkSize() {
    try {
        const stored = Number(localStorage.getItem('SYSTEM_APP_PREFETCH_CHUNK_SIZE') || 0);
        if (Number.isFinite(stored) && stored > 0) return Math.max(1, Math.floor(stored));
    } catch (_) {}
    return APP_MODULE_PREFETCH_CHUNK_SIZE;
}

function scheduleIdleBootTask(task, timeoutMs = 1600) {
    if (typeof task !== 'function') return;
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(task, { timeout: timeoutMs });
        return;
    }
    window.setTimeout(task, Math.max(0, timeoutMs));
}

function scheduleLateAppCorePrefetch(modules) {
    if (!Array.isArray(modules) || !modules.length) return;
    if (!shouldPrefetchLateAppCoreModules()) return;
    if (window.__APP_CORE_LATE_PREFETCH_SCHEDULED__) return;

    const limit = getLateAppCorePrefetchLimit();
    if (limit <= 0) return;
    const targets = modules.slice(0, limit);
    if (!targets.length) return;

    window.__APP_CORE_LATE_PREFETCH_SCHEDULED__ = true;
    const chunkSize = getAppModulePrefetchChunkSize();
    let cursor = 0;
    const runNextChunk = () => {
        if (window.__APP_MODULES_LOADED__ === true) return;
        const chunk = targets.slice(cursor, cursor + chunkSize);
        cursor += chunk.length;
        prefetchAppModuleList(chunk, 'app-core-late');
        if (cursor < targets.length) scheduleIdleBootTask(runNextChunk, 900);
    };
    scheduleIdleBootTask(runNextChunk, 1600);
}

function hintAppCoreModules() {
    const preloadCount = Math.min(getAppModulePreloadLimit(), APP_MODULES.length);
    preloadAppModuleList(APP_MODULES.slice(0, preloadCount), 'app-core');
    if (preloadCount < APP_MODULES.length) {
        scheduleLateAppCorePrefetch(APP_MODULES.slice(preloadCount));
    }
}

function warmAppModuleCache() {
    if (window.__APP_MODULE_WARMUP_STARTED__) return;
    window.__APP_MODULE_WARMUP_STARTED__ = true;
    if (isRuntimeMobileViewport()) return;
    prefetchAppModuleList(DEFERRED_APP_MODULES, 'app-deferred');
}

function scheduleAppModuleWarmup() {
    if (window.__APP_MODULES_LOADED__ !== true) return;
    if (window.__APP_MODULE_WARMUP_SCHEDULED__) return;
    if (getRuntimeLoadProfile() === 'lazy') return;
    if (!DEFERRED_APP_MODULES.length && !getRuntimeWarmupSkillIds(getRuntimeLoadProfile()).length) return;
    window.__APP_MODULE_WARMUP_SCHEDULED__ = true;
    const runWarmup = () => {
        warmAppModuleCache();
        window.setTimeout(() => {
            if (typeof loadDeferredAppModules === 'function') {
                loadDeferredAppModules().catch((error) => {
                    console.warn('[boot-runtime] Deferred module hydration failed:', error);
                });
            }
        }, 1200);
    };
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(runWarmup, { timeout: 1800 });
        return;
    }
    window.setTimeout(runWarmup, 1200);
}

function loadBootScript(src, timeoutMs) {
    return new Promise((resolve) => {
        if (isBootScriptLoaded(src)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = getVersionedAssetPath(src);
        markBootScriptState(src, 'loading', script);

        let finished = false;
        const timeout = setTimeout(() => {
            console.warn(`[boot-runtime] Script load timeout (${timeoutMs}ms): ${src}`);
            markBootScriptState(src, 'timeout', script);
            finished = true;
            resolve();
        }, timeoutMs);

        script.onload = () => {
            markBootScriptState(src, 'loaded', script);
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            resolve();
        };
        script.onerror = () => {
            console.warn(`[boot-runtime] Script load error: ${src}`);
            markBootScriptState(src, 'error', script);
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            resolve();
        };
        document.head.appendChild(script);
    });
}

function getAppModuleTimeoutMs(src) {
    const moduleSrc = String(src || '');
    return moduleSrc.includes('app.js') || moduleSrc.includes('auth-state') ? 15000 : 8000;
}

function getBootScriptBatchSize() {
    try {
        const stored = Number(localStorage.getItem('SYSTEM_BOOT_BATCH_SIZE') || 0);
        if (Number.isFinite(stored) && stored > 0) return Math.max(1, Math.floor(stored));
    } catch (_) {}
    try {
        if (getRuntimeLoadProfile() === 'lazy') return 4;
        if (isRuntimeMobileViewport()) return 6;
        const lowCpu = Number(navigator.hardwareConcurrency || 0) > 0
            && Number(navigator.hardwareConcurrency || 0) <= 4;
        if (lowCpu) return 8;
    } catch (_) {}
    return APP_MODULE_DESKTOP_BATCH_SIZE;
}

function yieldBootScriptBatchFrame() {
    return new Promise((resolve) => {
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => resolve());
            return;
        }
        window.setTimeout(resolve, 0);
    });
}

async function loadOrderedBootScripts(sources, options = {}) {
    const list = Array.isArray(sources) ? sources.filter(Boolean) : [];
    if (!list.length) return;

    let settledCount = 0;
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : function () { };
    const configuredBatchSize = getBootScriptBatchSize();
    const batchSize = configuredBatchSize > 0 ? Math.min(configuredBatchSize, list.length) : list.length;

    for (let index = 0; index < list.length; index += batchSize) {
        const batch = list.slice(index, index + batchSize);
        await new Promise((resolve) => {
            const settle = (src, status) => {
                settledCount += 1;
                onProgress(settledCount, list.length, src, status);
                if (settledCount >= index + batch.length) resolve();
            };

            batch.forEach((src) => {
                if (window.__BOOT_SKIP_INIT__ === true) {
                    settle(src, 'skipped');
                    return;
                }

                if (isBootScriptLoaded(src)) {
                    settle(src, 'cached');
                    return;
                }

                const script = document.createElement('script');
                script.src = getVersionedAssetPath(src);
                script.async = false;
                markBootScriptState(src, 'loading', script);

                let finished = false;
                const timeoutMs = getAppModuleTimeoutMs(src);
                const finish = (status) => {
                    if (status === 'loaded') {
                        markBootScriptState(src, 'loaded', script);
                    }
                    if (finished) return;
                    finished = true;
                    clearTimeout(timeout);
                    if (status !== 'loaded') markBootScriptState(src, status, script);
                    if (status === 'loaded' && typeof window.wrapXlsxRuntimeExports === 'function') window.wrapXlsxRuntimeExports();
                    settle(src, status);
                };
                const timeout = setTimeout(() => {
                    console.warn(`[boot-runtime] Ordered script load timeout (${timeoutMs}ms): ${src}`);
                    finish('timeout');
                }, timeoutMs);

                script.onload = () => finish('loaded');
                script.onerror = () => {
                    console.warn(`[boot-runtime] Ordered script load error: ${src}`);
                    finish('error');
                };
                document.head.appendChild(script);
            });
        });

        if (index + batchSize < list.length) {
            await yieldBootScriptBatchFrame();
        }
    }
}

function loadDeferredAppModules() {
    if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.warmup === 'function') {
        return window.SystemRuntimeLoader.warmup();
    }
    if (!DEFERRED_APP_MODULES.length) return Promise.resolve();
    return loadOptionalRuntimeBundle('deferred-app-modules', DEFERRED_APP_MODULES.map((src, index) => ({
        key: `deferred-app-module-${index}`,
        src
    }))).then((result) => {
        window.dispatchEvent(new CustomEvent('school:deferred-vendors-ready'));
        return result;
    });
}

function scheduleGatewayPreflight() {
    if (window.__GATEWAY_PREFLIGHT_STARTED__) {
        return window.__GATEWAY_PREFLIGHT_PROMISE__ || Promise.resolve(window.__GATEWAY_PREFLIGHT_STATUS__ || 'started');
    }
    window.__GATEWAY_PREFLIGHT_STARTED__ = true;

    if (isLocalFileRuntime() || isLocalSupabaseHost(window.location && window.location.hostname)) {
        window.__GATEWAY_PREFLIGHT_STATUS__ = 'skipped';
        bootDebugLog('[boot-runtime] Skipping gateway pre-flight in local mode');
        window.__GATEWAY_PREFLIGHT_PROMISE__ = Promise.resolve('skipped');
        return window.__GATEWAY_PREFLIGHT_PROMISE__;
    }

    const run = async () => {
        let controller = null;
        let timeoutId = null;
        try {
            controller = typeof AbortController === 'function' ? new AbortController() : null;
            timeoutId = window.setTimeout(() => {
                if (controller) controller.abort();
            }, 3200);

            await fetch(DIRECT_PROXY_ORIGIN + '/api/health', {
                method: 'GET',
                mode: 'no-cors',
                signal: controller ? controller.signal : undefined
            });
            window.__GATEWAY_PREFLIGHT_STATUS__ = 'ok';
            bootDebugLog('[boot-runtime] Gateway pre-flight successful');
            return 'ok';
        } catch (fetchErr) {
            window.__GATEWAY_PREFLIGHT_STATUS__ = 'fallback';
            console.warn('[boot-runtime] Gateway pre-flight failed, activating fallback:', fetchErr);
            window.__API_FALLBACK_ACTIVE__ = true;
            return 'fallback';
        } finally {
            if (timeoutId) window.clearTimeout(timeoutId);
        }
    };

    window.__GATEWAY_PREFLIGHT_STATUS__ = 'running';
    window.__GATEWAY_PREFLIGHT_PROMISE__ = run();
    return window.__GATEWAY_PREFLIGHT_PROMISE__;
}

async function loadAppModules() {
    if (window.__APP_MODULES_LOAD_PROMISE__) {
        return window.__APP_MODULES_LOAD_PROMISE__;
    }

    const hideGlobalLoader = (delay = 500) => {
        setTimeout(() => {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    loader.classList.add('hidden');
                    bootDebugLog('[boot-runtime] Global loader hidden');
                }, 300);
            }
        }, delay);
    };

    if (window.__APP_MODULES_LOADED__ === true || window.__APP_MODULES_LOADED__ === 'loading') {
        bootDebugLog('[boot-runtime] Module load already in progress or completed');
        return window.__APP_MODULES_LOAD_PROMISE__;
    }

    // Check if Auth is already defined (e.g. by Vite bundle) to avoid duplicate load
    if (window.Auth && !window.Auth.__bootLoginShell) {
        bootDebugLog('[boot-runtime] Auth module already present, skipping dynamic load');
        markAppModulesReady();
        markAuthReadyResolved();
        return Promise.resolve();
    }

    armAuthReadySafetyTimeout();
    window.__APP_MODULES_LOADED__ = 'loading';
    window.__APP_MODULES_LOAD_PROMISE__ = (async () => {
    const loaderText = document.getElementById('loader-text');

    scheduleGatewayPreflight();

    const total = BOOT_VENDOR_MODULES.length + APP_MODULES.length;
    let loadedCount = 0;
    hintAppCoreModules();

    if (BOOT_VENDOR_MODULES.length) {
        if (loaderText) loaderText.textContent = `正在并行加载基础组件 (0/${BOOT_VENDOR_MODULES.length})...`;
        await Promise.all(BOOT_VENDOR_MODULES.map(async (src) => {
            await loadBootScript(src, 12000);
            loadedCount += 1;
            if (loaderText) loaderText.textContent = `正在并行加载基础组件 (${loadedCount}/${BOOT_VENDOR_MODULES.length})...`;
        }));
    }

    if (APP_MODULES.length) {
        if (loaderText) loaderText.textContent = `正在并行准备核心组件 (${loadedCount}/${total})...`;
        await loadOrderedBootScripts(APP_MODULES, {
            onProgress: (moduleLoadedCount) => {
                loadedCount = BOOT_VENDOR_MODULES.length + moduleLoadedCount;
                if (loaderText) loaderText.textContent = `正在初始化核心组件 (${loadedCount}/${total})...`;
            }
        });
    }
    markAppModulesReady();
    if (loaderText) loaderText.textContent = '核心组件就绪，正在同步状态...';
    bootDebugLog('[boot-runtime] All modules loaded');
    scheduleAppModuleWarmup();

    hideGlobalLoader(500);
    })();

    return window.__APP_MODULES_LOAD_PROMISE__;
}

function enterCohort(year) {
    const yearInput = document.getElementById('entry-cohort-year');
    if (yearInput) yearInput.value = year;

    if (typeof window.enterCohortFromMask === 'function') {
        window.enterCohortFromMask();
    } else {
        // Fallback: hide login overlay manually if state manager isn't loaded yet
        if (window.Auth) window.Auth.syncLoginOverlayState(false);
    }
}

window.enterCohort = enterCohort;
if (typeof window.enterCohortFromMask !== 'function') {
    window.enterCohortFromMask = async function bootEnterCohortFromMask() {
        const yearInput = document.getElementById('entry-cohort-year');
        await loadAppModules();
        if (typeof window.enterCohortFromMask === 'function'
            && window.enterCohortFromMask !== bootEnterCohortFromMask) {
            return window.enterCohortFromMask();
        }
        return enterCohort(yearInput ? yearInput.value : '');
    };
}


function isLocalSupabaseHost(hostname) {
    var normalized = String(hostname || '').trim().toLowerCase();
    return !normalized
        || normalized === 'localhost'
        || normalized === '127.0.0.1'
        || normalized === '[::1]'
        || normalized.endsWith('.local');
}

function isNativeCapacitorShell() {
    if (typeof window === 'undefined') return false;
    try {
        if (window.Capacitor) {
            if (typeof window.Capacitor.isNativePlatform === 'function') {
                return !!window.Capacitor.isNativePlatform();
            }
            if (typeof window.Capacitor.getPlatform === 'function') {
                return window.Capacitor.getPlatform() !== 'web';
            }
            return true;
        }
    } catch (error) { }

    var protocol = String(window.location && window.location.protocol || '').trim().toLowerCase();
    if (protocol === 'capacitor:' || protocol === 'ionic:' || protocol === 'app:') return true;

    var hostname = String(window.location && window.location.hostname || '').trim().toLowerCase();
    var userAgent = String(window.navigator && window.navigator.userAgent || '').trim().toLowerCase();
    return isLocalSupabaseHost(hostname) && /\bwv\b/.test(userAgent);
}

function isLocalFileRuntime() {
    if (!window.location) return false;
    return String(window.location.protocol || '').trim().toLowerCase() === 'file:';
}

function shouldUseSameOriginSupabaseProxy() {
    if (!window.location) return false;
    var protocol = String(window.location.protocol || '').trim().toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    if (isLocalSupabaseHost(window.location.hostname)) {
        return getBootStorageValue('SUPABASE_DIRECT_LOCAL') !== 'true';
    }
    return true;
}

function shouldUseSameOriginCloudProxy() {
    return shouldUseSameOriginSupabaseProxy();
}

function normalizeProxyOrigin(origin) {
    var text = String(origin || '').trim().replace(/\/$/, '');
    if (text.indexOf('schoolsystem.com.cn') !== -1 && text.startsWith('http:')) {
        console.warn('[boot-runtime] Enforcing HTTPS for production domain:', text);
        text = text.replace('http:', 'https:');
    }
    return text;
}

function getHostedSupabaseProxyOrigin() {
    if (isLocalFileRuntime()) return '';
    return normalizeProxyOrigin(getBootStorageValue('SUPABASE_PROXY_ORIGIN') || DIRECT_PROXY_ORIGIN);
}

function getSupabaseProxyOrigin() {
    if (!window.location) return '';
    if (shouldUseSameOriginSupabaseProxy()) {
        return normalizeProxyOrigin(window.location.origin);
    }
    if (isNativeCapacitorShell()) {
        return getHostedSupabaseProxyOrigin();
    }
    return '';
}

function shouldUseSupabaseProxy() {
    return !!getSupabaseProxyOrigin();
}

function shouldUseCloudProxy() {
    return shouldUseSupabaseProxy();
}

function getSameOriginSupabaseUrl() {
    var proxyOrigin = getSupabaseProxyOrigin();
    return proxyOrigin ? proxyOrigin + '/sb' : DIRECT_SUPABASE_URL;
}

function getSameOriginGatewayUrl() {
    if (window.__API_FALLBACK_ACTIVE__) {
        return DIRECT_EDGE_GATEWAY_URL;
    }
    if (window.location && /^(https?:)$/i.test(String(window.location.protocol || '').trim())) {
        return normalizeProxyOrigin(window.location.origin) + '/api/edu-gateway';
    }
    var hostedProxyOrigin = getHostedSupabaseProxyOrigin();
    return hostedProxyOrigin ? hostedProxyOrigin + '/api/edu-gateway' : DIRECT_EDGE_GATEWAY_URL;
}

function getBootStorageValue(key) {
    try {
        if (!window.localStorage || typeof window.localStorage.getItem !== 'function') return '';
        return String(window.localStorage.getItem(key) || '').trim();
    } catch (error) {
        return '';
    }
}

function createSupabaseFetchWithTimeout(timeoutMs) {
    var requestTimeoutMs = Number(timeoutMs || 15000);
    return function (input, init) {
        var controller = typeof AbortController === 'function' ? new AbortController() : null;
        var parentSignal = init && init.signal;
        var cleanupParentAbort = function () { };
        var timer = null;
        if (controller && parentSignal && typeof parentSignal.addEventListener === 'function') {
            if (parentSignal.aborted) {
                controller.abort();
            } else {
                var abortFromParent = function () {
                    controller.abort();
                };
                parentSignal.addEventListener('abort', abortFromParent, { once: true });
                cleanupParentAbort = function () {
                    parentSignal.removeEventListener('abort', abortFromParent);
                };
            }
        }
        if (controller && requestTimeoutMs > 0) {
            timer = window.setTimeout(function () {
                controller.abort();
            }, requestTimeoutMs);
        }
        var nextInit = Object.assign({}, init || {});
        if (controller) nextInit.signal = controller.signal;
        return fetch(input, nextInit).finally(function () {
            if (timer) window.clearTimeout(timer);
            cleanupParentAbort();
        });
    };
}

function getBootSessionValue(key) {
    try {
        if (!window.sessionStorage || typeof window.sessionStorage.getItem !== 'function') return '';
        return String(window.sessionStorage.getItem(key) || '').trim();
    } catch (error) {
        return '';
    }
}

function getCloudflareRestBaseUrl() {
    if (isLocalFileRuntime()) {
        return normalizeProxyOrigin(DIRECT_SUPABASE_URL) + '/rest/v1';
    }
    if (window.__API_FALLBACK_ACTIVE__) {
        return normalizeProxyOrigin(DIRECT_SUPABASE_URL) + '/rest/v1';
    }
    if (
        window.location
        && /^(https?:)$/i.test(String(window.location.protocol || '').trim())
        && isLocalSupabaseHost(window.location.hostname)
    ) {
        if (shouldUseSameOriginSupabaseProxy()) {
            return normalizeProxyOrigin(window.location.origin) + '/sb/rest/v1';
        }
        return normalizeProxyOrigin(DIRECT_SUPABASE_URL) + '/rest/v1';
    }
    var proxyOrigin = getSupabaseProxyOrigin();
    if (proxyOrigin) return proxyOrigin + '/sb/rest/v1';
    if (window.location && /^(https?:)$/i.test(String(window.location.protocol || '').trim())) {
        return normalizeProxyOrigin(window.location.origin) + '/sb/rest/v1';
    }
    var hostedProxyOrigin = getHostedSupabaseProxyOrigin();
    if (hostedProxyOrigin) {
        return hostedProxyOrigin + '/sb/rest/v1';
    }
    // Fall back to direct REST only when no hosted proxy origin is available.
    if (typeof DIRECT_SUPABASE_URL !== 'undefined' && DIRECT_SUPABASE_URL) {
        return normalizeProxyOrigin(DIRECT_SUPABASE_URL) + '/rest/v1';
    }
    return '';
}

function parseCompatCount(value) {
    var text = String(value || '').trim();
    var match = text.match(/\/(\d+|\*)$/);
    if (!match || match[1] === '*') return null;
    var count = Number(match[1]);
    return Number.isFinite(count) ? count : null;
}

function createCompatError(message, status, body) {
    var error = new Error(String(message || '').trim() || 'CLOUDFLARE_REST_ERROR');
    error.status = Number(status || 0);
    error.body = body || null;
    return error;
}

function normalizeCompatFilterValue(value) {
    if (value == null) return '';
    return String(value).trim();
}

function createCloudflareCompatClient() {
    var fetchWithTimeout = createSupabaseFetchWithTimeout(15000);

    function buildHeaders(extraHeaders, targetUrl) {
        var headers = Object.assign({}, extraHeaders || {});
        var apikey = String(
            getBootStorageValue('CLOUD_API_KEY')
            || getBootStorageValue('SUPABASE_KEY')
            || window.CLOUD_API_KEY
            || window.SUPABASE_KEY
            || DIRECT_SUPABASE_KEY
            || ''
        ).trim();
        var token = getBootSessionValue('EDGE_GATEWAY_TOKEN_V1');
        if (apikey && !headers.apikey) headers.apikey = apikey;

        // Only send the gateway token if we are NOT talking directly to Supabase REST.
        // Standard Supabase REST doesn't know our custom gateway secret.
        var isDirectSupabase = false;
        if (targetUrl) {
            try {
                var urlObj = new URL(targetUrl);
                if (DIRECT_SUPABASE_URL && urlObj.origin === new URL(DIRECT_SUPABASE_URL).origin) {
                    isDirectSupabase = true;
                }
            } catch (e) {}
        }

        if (token && !headers.Authorization && !isDirectSupabase) {
            headers.Authorization = 'Bearer ' + token;
        }
        return headers;
    }

    function getTableEndpoint(tableName) {
        var baseUrl = getCloudflareRestBaseUrl();
        if (!baseUrl) return '';
        return baseUrl + '/' + encodeURIComponent(String(tableName || '').trim());
    }

    function appendFilter(params, filter) {
        if (!filter || !filter.column || !filter.op) return;
        var column = String(filter.column).trim();
        if (!column) return;
        if (filter.op === 'or') {
            params.set('or', String(filter.value || ''));
            return;
        }
        if (filter.op === 'in') {
            var values = Array.isArray(filter.value)
                ? filter.value.map(function (item) { return normalizeCompatFilterValue(item); }).filter(Boolean)
                : [];
            if (!values.length) return;
            params.append(column, 'in.(' + values.join(',') + ')');
            return;
        }
        if (filter.op === 'not') {
            params.append(column, 'not.' + String(filter.operator || 'eq').trim() + '.' + normalizeCompatFilterValue(filter.value));
            return;
        }
        params.append(column, String(filter.op).trim() + '.' + normalizeCompatFilterValue(filter.value));
    }

    function finalizeSelectResult(state, payload, count) {
        var data = payload;
        if (state.single || state.maybeSingle) {
            var rows = Array.isArray(payload)
                ? payload
                : (payload == null ? [] : [payload]);
            if (rows.length === 1) {
                data = rows[0];
            } else if (rows.length === 0) {
                if (state.maybeSingle) {
                    data = null;
                } else {
                    return {
                        data: null,
                        error: createCompatError('PGRST116_SINGLE_ROW_NOT_FOUND', 406),
                        count: count
                    };
                }
            } else {
                return {
                    data: null,
                    error: createCompatError('PGRST117_MULTIPLE_ROWS_RETURNED', 406),
                    count: count
                };
            }
        }
        return {
            data: data,
            error: null,
            count: count
        };
    }

    function createQuery(tableName) {
        var state = {
            table: String(tableName || '').trim(),
            action: 'select',
            select: '*',
            filters: [],
            order: '',
            ascending: true,
            limit: 0,
            single: false,
            maybeSingle: false,
            head: false,
            count: '',
            payload: null,
            upsertOptions: null
        };
        var execution = null;

        function execute() {
            if (execution) return execution;
            execution = (async function () {
                var endpoint = getTableEndpoint(state.table);
                if (!endpoint) {
                    return {
                        data: state.single || state.maybeSingle ? null : [],
                        error: createCompatError('CLOUDFLARE_REST_UNAVAILABLE'),
                        count: null
                    };
                }

                var url = new URL(endpoint);
                if (state.action === 'select') {
                    if (state.select) url.searchParams.set('select', state.select);
                    if (state.order) {
                        url.searchParams.set('order', state.order + '.' + (state.ascending ? 'asc' : 'desc'));
                    }
                    if (state.limit > 0) {
                        url.searchParams.set('limit', String(state.limit));
                    }
                }

                state.filters.forEach(function (filter) {
                    appendFilter(url.searchParams, filter);
                });

                var method = 'GET';
                var headers = buildHeaders(null, url.toString());
                var body = null;
                if (state.action === 'select') {
                    method = state.head ? 'HEAD' : 'GET';
                } else if (state.action === 'insert' || state.action === 'upsert') {
                    method = 'POST';
                    headers['Content-Type'] = 'application/json';
                    if (state.action === 'upsert') {
                        var upsertOptions = state.upsertOptions || {};
                        var onConflict = String(upsertOptions.onConflict || upsertOptions.on_conflict || '').trim();
                        if (onConflict) {
                            url.searchParams.set('on_conflict', onConflict);
                        }
                        headers['Prefer'] = headers['Prefer']
                            ? headers['Prefer'] + ',resolution=merge-duplicates'
                            : 'resolution=merge-duplicates';
                    }
                    body = JSON.stringify(state.payload);
                } else if (state.action === 'update') {
                    method = 'PATCH';
                    headers['Content-Type'] = 'application/json';
                    body = JSON.stringify(state.payload || {});
                } else if (state.action === 'delete') {
                    method = 'DELETE';
                }

                try {
                    var response = await fetchWithTimeout(url.toString(), {
                        method: method,
                        headers: headers,
                        body: body
                    });
                    var count = parseCompatCount(response.headers.get('Content-Range'));

                    if (!response.ok) {
                        var errorBody = null;
                        try {
                            errorBody = await response.json();
                        } catch (error) { }

                        var rawMsg = (errorBody && (errorBody.error || errorBody.message)) || ('CLOUDFLARE_REST_HTTP_' + response.status);
                        var finalMsg = rawMsg;

                        // Trigger fallback if proxy returns 500 or 502
                        if ((response.status >= 500 || response.status === 404) && !window.__API_FALLBACK_ACTIVE__) {
                            console.warn('[boot-runtime] Proxy error detected, activating direct Supabase fallback', response.status);
                            window.__API_FALLBACK_ACTIVE__ = true;
                        }

                        // 友好化处理特定的底层错误
                        if (rawMsg.includes('No suitable key') || rawMsg.includes('wrong key type')) {
                            finalMsg = '云端身份验证失败 (请检查登录状态或网络连接)';
                        }

                        return {
                            data: state.single || state.maybeSingle ? null : [],
                            error: createCompatError(finalMsg, response.status, errorBody),
                            count: count
                        };
                    }

                    if (method === 'HEAD') {
                        return { data: null, error: null, count: count };
                    }

                    var payload = null;
                    try {
                        payload = await response.json();
                    } catch (error) {
                        payload = state.single || state.maybeSingle ? null : [];
                    }

                    if (state.action === 'select') {
                        return finalizeSelectResult(state, payload, count);
                    }

                    return {
                        data: payload,
                        error: null,
                        count: count
                    };
                } catch (error) {
                    if (!window.__API_FALLBACK_ACTIVE__) {
                        console.warn('[boot-runtime] Network error detected, activating direct Supabase fallback', error);
                        window.__API_FALLBACK_ACTIVE__ = true;
                    }
                    return {
                        data: state.single || state.maybeSingle ? null : [],
                        error: error instanceof Error ? error : createCompatError(String(error || 'CLOUDFLARE_REST_FETCH_FAILED')),
                        count: null
                    };
                }
            })();
            return execution;
        }

        var query = {
            select: function (columns, options) {
                state.action = 'select';
                state.select = String(columns || '*').trim() || '*';
                state.head = !!(options && options.head);
                state.count = options && options.count ? String(options.count) : '';
                return query;
            },
            insert: function (rows) {
                state.action = 'insert';
                state.payload = rows;
                return query;
            },
            upsert: function (rows, options) {
                state.action = 'upsert';
                state.payload = rows;
                state.upsertOptions = options || null;
                return query;
            },
            update: function (values) {
                state.action = 'update';
                state.payload = values;
                return query;
            },
            delete: function (options) {
                state.action = 'delete';
                state.count = options && options.count ? String(options.count) : '';
                return query;
            },
            eq: function (column, value) {
                state.filters.push({ column: column, op: 'eq', value: value });
                return query;
            },
            neq: function (column, value) {
                state.filters.push({ column: column, op: 'neq', value: value });
                return query;
            },
            like: function (column, value) {
                state.filters.push({ column: column, op: 'like', value: value });
                return query;
            },
            ilike: function (column, value) {
                state.filters.push({ column: column, op: 'ilike', value: value });
                return query;
            },
            "in": function (column, values) {
                state.filters.push({ column: column, op: 'in', value: values });
                return query;
            },
            not: function (column, operator, value) {
                state.filters.push({ column: column, op: 'not', operator: operator, value: value });
                return query;
            },
            or: function (expression) {
                state.filters.push({ op: 'or', value: expression });
                return query;
            },
            order: function (column, options) {
                state.order = String(column || '').trim();
                state.ascending = !!(options && options.ascending);
                return query;
            },
            limit: function (value) {
                state.limit = Math.max(0, Math.floor(Number(value) || 0));
                return query;
            },
            single: function () {
                state.single = true;
                state.maybeSingle = false;
                return query;
            },
            maybeSingle: function () {
                state.maybeSingle = true;
                state.single = false;
                return query;
            },
            then: function (resolve, reject) {
                return execute().then(resolve, reject);
            },
            catch: function (reject) {
                return execute().catch(reject);
            },
            finally: function (handler) {
                return execute().finally(handler);
            }
        };

        return query;
    }

    return {
        from: function (tableName) {
            return createQuery(tableName);
        }
    };
}

window.__DIRECT_SUPABASE_URL = DIRECT_SUPABASE_URL;
window.__DIRECT_EDGE_GATEWAY_URL = DIRECT_EDGE_GATEWAY_URL;
window.__DIRECT_PROXY_ORIGIN = DIRECT_PROXY_ORIGIN;
window.__SUPABASE_PROXY_ORIGIN = getSupabaseProxyOrigin();
window.__DIRECT_CLOUD_REST_URL = DIRECT_SUPABASE_URL;
window.__DIRECT_CLOUD_PROXY_ORIGIN = DIRECT_PROXY_ORIGIN;
window.__CLOUD_PROXY_ORIGIN = window.__SUPABASE_PROXY_ORIGIN;
window.__IS_LOCAL_FILE_RUNTIME__ = isLocalFileRuntime();
window.isNativeCapacitorShell = isNativeCapacitorShell;
window.isLocalFileRuntime = isLocalFileRuntime;
window.shouldUseSupabaseProxy = shouldUseSupabaseProxy;
window.shouldUseSameOriginCloudProxy = shouldUseSameOriginCloudProxy;
window.shouldUseCloudProxy = shouldUseCloudProxy;
window.CLOUD_REST_URL = isLocalFileRuntime()
    ? DIRECT_SUPABASE_URL
    : (getBootStorageValue('CLOUD_REST_URL') || getBootStorageValue('SUPABASE_URL') || (shouldUseCloudProxy() ? getSameOriginSupabaseUrl() : DIRECT_SUPABASE_URL));
window.CLOUD_API_KEY = getBootStorageValue('CLOUD_API_KEY') || getBootStorageValue('SUPABASE_KEY') || DIRECT_SUPABASE_KEY;
window.SUPABASE_URL = isLocalFileRuntime()
    ? DIRECT_SUPABASE_URL
    : (getBootStorageValue('SUPABASE_URL') || window.CLOUD_REST_URL);
window.SUPABASE_KEY = getBootStorageValue('SUPABASE_KEY') || window.CLOUD_API_KEY;
window.EDGE_GATEWAY_URL = getSameOriginGatewayUrl();
window.initSupabase = function () {
    if (!sbClient) {
        sbClient = createCloudflareCompatClient();
        window.sbClient = sbClient;
        window.cloudClient = sbClient;
        bootDebugLog('Cloud data compatibility client initialized');
    } else if (!window.cloudClient) {
        window.cloudClient = sbClient;
    }
    return sbClient;
};
window.initCloudClient = function () {
    return window.initSupabase();
};
window.initCloudClient();

(function installBootLoginShell() {
    const BOOT_LOGIN_PORTAL_STORAGE_KEY = 'LOGIN_PORTAL_V1';
    const BOOT_GATEWAY_REQUEST = createSupabaseFetchWithTimeout(12000);
    const bootPortalConfigs = {
        school: {
            badge: '学校工作台',
            copy: '统一验证后，直接进入教学分析、数据维护与学校工作台。',
            userLabel: '账号 / 姓名',
            userPlaceholder: '管理员账号 / 教师姓名',
            userHelper: '支持管理员、教务、年级、班主任与教师账号登录。',
            classNote: '(学校端无需填写)',
            classPlaceholder: '学校端无需填写',
            helper: '当前为学校工作台，可在上方切换家长端入口。',
            submit: '进入学校工作台',
            success: '验证成功，正在进入学校工作台...'
        },
        parent: {
            badge: '家长成长入口',
            copy: '输入学生姓名、班级与密码，查看成长报告、成绩与家校提醒。',
            userLabel: '学生姓名',
            userPlaceholder: '请输入学生姓名',
            userHelper: '建议使用学生姓名登录，并完整填写班级信息。',
            classNote: '(家长端必填，如 701)',
            classPlaceholder: '请输入学生班级，如 701',
            helper: '当前为家长端，登录后进入成长报告与成绩视图。',
            submit: '进入家长端',
            success: '验证成功，正在进入成长报告...'
        }
    };

    const bootGateway = window.EdgeGateway || {
        tokenStorageKey: 'EDGE_GATEWAY_TOKEN_V1',
        userStorageKey: 'EDGE_GATEWAY_USER_V1',
        resolvedGatewayUrl: '',
        normalizeGatewayUrl(url) {
            return String(url || '').trim().replace(/\/$/, '');
        },
        getGatewayCandidates() {
            const candidates = [];
            const pushCandidate = (value) => {
                const normalized = this.normalizeGatewayUrl(value);
                if (!normalized || candidates.includes(normalized)) return;
                candidates.push(normalized);
            };
            if (isLocalFileRuntime()) {
                pushCandidate(DIRECT_EDGE_GATEWAY_URL);
                return candidates;
            }
            pushCandidate(window.EDGE_GATEWAY_URL);
            pushCandidate(this.resolvedGatewayUrl);
            pushCandidate(localStorage.getItem('EDGE_GATEWAY_URL'));
            pushCandidate(window.DIRECT_CLOUDFLARE_GATEWAY_URL);
            pushCandidate(DIRECT_EDGE_GATEWAY_URL);
            return candidates;
        },
        isHostedGatewayUrl(url) {
            try {
                const parsed = new URL(url, window.location.href);
                return parsed.origin === window.location.origin || parsed.pathname === '/api/edu-gateway';
            } catch (_) {
                return false;
            }
        },
        getGatewayUrl() {
            return this.getGatewayCandidates()[0] || '';
        },
        getPublishableKey() {
            return String(
                localStorage.getItem('CLOUD_API_KEY')
                || localStorage.getItem('SUPABASE_KEY')
                || window.CLOUD_API_KEY
                || window.SUPABASE_KEY
                || ''
            ).trim();
        },
        getToken() {
            return String(sessionStorage.getItem(this.tokenStorageKey) || '').trim();
        },
        setToken(token) {
            if (!token) return;
            sessionStorage.setItem(this.tokenStorageKey, String(token).trim());
        },
        clearSession() {
            sessionStorage.removeItem(this.tokenStorageKey);
            sessionStorage.removeItem(this.userStorageKey);
        },
        hasGatewayConfig() {
            const urls = this.getGatewayCandidates();
            return !!(urls.length && (this.getPublishableKey() || urls.some((url) => this.isHostedGatewayUrl(url))));
        },
        shouldRetryRequest(status, message) {
            if (status === 404 || status >= 500) return true;
            const text = String(message || '').trim().toLowerCase();
            return text.includes('function not found')
                || text.includes('edge_gateway_http_404')
                || text.includes('failed to fetch')
                || text.includes('networkerror');
        },
        async request(action, payload = {}, options = {}) {
            const urls = this.getGatewayCandidates();
            const apikey = this.getPublishableKey();
            if (!urls.length || (!apikey && !urls.some((url) => this.isHostedGatewayUrl(url)))) {
                throw new Error('EDGE_GATEWAY_NOT_CONFIGURED');
            }
            const headers = {
                'Content-Type': 'application/json'
            };
            if (apikey) headers.apikey = apikey;
            const token = options.allowAnonymous ? '' : (options.token || this.getToken());
            if (!options.allowAnonymous) {
                if (!token) throw new Error('EDGE_GATEWAY_SESSION_MISSING');
                headers.Authorization = `Bearer ${token}`;
            }
            let lastError = null;
            for (let i = 0; i < urls.length; i += 1) {
                const url = urls[i];
                try {
                    const response = await BOOT_GATEWAY_REQUEST(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ action, payload })
                    });
                    let data = null;
                    try {
                        data = await response.json();
                    } catch (error) { }
                    if (response.ok && data?.ok) {
                        this.resolvedGatewayUrl = url;
                        return data;
                    }
                    const message = data?.error || `EDGE_GATEWAY_HTTP_${response.status}`;
                    lastError = new Error(message);
                    if (i < urls.length - 1 && this.shouldRetryRequest(response.status, message)) {
                        continue;
                    }
                    throw lastError;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));

                    // Diagnostic logging for CORS and Origin issues
                    const isNetworkError = lastError.message.toLowerCase().includes('failed to fetch') || lastError.message.toLowerCase().includes('networkerror');
                    if (isNetworkError) {
                        const origin = window.location ? window.location.origin : 'unknown';
                        console.warn(`[boot-runtime] Network error for ${url}:`, {
                            message: lastError.message,
                            origin: origin,
                            protocol: window.location ? window.location.protocol : 'unknown',
                            isLocalFile: origin === 'null' || (window.location && window.location.protocol === 'file:')
                        });

                        if (origin === 'null' || (window.location && window.location.protocol === 'file:')) {
                            console.error('[boot-runtime] CRITICAL: Running via file:// protocol. Direct API calls may be blocked by CORS (Origin: null). Please use a web server (npm run dev).');
                        }
                    }

                    if (i < urls.length - 1 && this.shouldRetryRequest(0, lastError.message)) {
                        bootDebugLog(`[boot-runtime] Retrying with next candidate due to error: ${lastError.message}`);
                        continue;
                    }
                    throw lastError;
                }
            }
            throw lastError || new Error('EDGE_GATEWAY_REQUEST_FAILED');
        },
        async login(username, password, className = '') {
            const data = await this.request('login', {
                username,
                password,
                class_name: className || ''
            }, { allowAnonymous: true });
            if (data?.token) this.setToken(data.token);
            if (data?.user) sessionStorage.setItem(this.userStorageKey, JSON.stringify(data.user));
            return data;
        }
    };

    if (!window.EdgeGateway) {
        window.EdgeGateway = bootGateway;
    }

    function readBootSessionUser() {
        try {
            const raw = sessionStorage.getItem('CURRENT_USER');
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function writeBootSessionUser(user) {
        if (!user || typeof user !== 'object') return;
        sessionStorage.setItem('CURRENT_USER', JSON.stringify(user));
        sessionStorage.setItem('CURRENT_ROLE', String(user.role || 'guest').trim() || 'guest');
        sessionStorage.setItem('CURRENT_ROLES', JSON.stringify(Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean)));
    }

    function getPortalConfig(portal) {
        return portal === 'parent' ? bootPortalConfigs.parent : bootPortalConfigs.school;
    }

    function setBootSubmitState(options = {}) {
        const button = document.getElementById('login-submit-button');
        if (!button) return;
        const busy = !!options.busy;
        button.disabled = busy;
        button.dataset.bootBusy = busy ? '1' : '0';
        if (options.text) button.textContent = options.text;
    }

    function setBootHelperMessage(message, tone = 'info') {
        const helper = document.getElementById('login-portal-helper');
        if (!helper) return;
        helper.textContent = String(message || '').trim();
        const palette = {
            info: '#475569',
            success: '#166534',
            error: '#b91c1c'
        };
        helper.style.color = palette[tone] || palette.info;
    }

    function syncBootLoginOverlayState(visible) {
        const overlay = document.getElementById('login-overlay');
        const loader = document.getElementById('global-loader');
        const app = document.getElementById('app');

        document.body.classList.toggle('login-overlay-active', !!visible);
        document.body.dataset.authState = visible ? 'logged_out' : 'logged_in';

        if (overlay) {
            overlay.style.display = visible ? 'flex' : 'none';
            overlay.style.visibility = visible ? 'visible' : 'hidden';
            overlay.style.opacity = visible ? '1' : '0';
            overlay.style.pointerEvents = visible ? 'auto' : 'none';
            overlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
        }
        if (loader && !visible) {
            loader.classList.add('hidden');
            // Ensure display is also set to none to be safe
            setTimeout(() => { if (loader.classList.contains('hidden')) loader.style.display = 'none'; }, 300);
        }
        if (app) {
            app.classList.toggle('hidden', !!visible);
            app.setAttribute('aria-hidden', visible ? 'true' : 'false');
        }
    }

    const bootAuth = window.Auth || {
        __bootLoginShell: true,
        __bootLoginBusy: false,
        loginPortalStorageKey: BOOT_LOGIN_PORTAL_STORAGE_KEY,
        getLoginPortal() {
            return localStorage.getItem(this.loginPortalStorageKey) === 'parent' ? 'parent' : 'school';
        },
        setLoginPortal(portal) {
            const nextPortal = portal === 'parent' ? 'parent' : 'school';
            localStorage.setItem(this.loginPortalStorageKey, nextPortal);
            this.syncLoginPortalUI(nextPortal);
            return nextPortal;
        },
        syncLoginOverlayState(visible) {
            syncBootLoginOverlayState(visible);
        },
        syncLoginPortalUI(portal = this.getLoginPortal()) {
            const nextPortal = portal === 'parent' ? 'parent' : 'school';
            const overlay = document.getElementById('login-overlay');
            const config = getPortalConfig(nextPortal);
            if (overlay) overlay.dataset.loginPortal = nextPortal;
            document.querySelectorAll('.role-pill-btn, .role-btn').forEach((button) => {
                const isActive = button.id === `btn-role-${nextPortal}`;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            document.querySelectorAll('.login-portal-card[data-portal]').forEach((card) => {
                card.classList.toggle('active', card.dataset.portal === nextPortal);
            });
            const badgeEl = document.getElementById('login-portal-badge');
            const copyEl = document.getElementById('login-portal-copy');
            const userLabel = document.getElementById('login-user-label');
            const userInput = document.getElementById('login-user');
            const userHelper = document.getElementById('login-user-helper');
            const classGroup = document.getElementById('login-class-group');
            const classNote = document.getElementById('login-class-label-note');
            const classInput = document.getElementById('login-class');
            if (badgeEl) badgeEl.textContent = config.badge;
            if (copyEl) copyEl.textContent = config.copy;
            if (userLabel) userLabel.textContent = config.userLabel;
            if (userInput) userInput.placeholder = config.userPlaceholder;
            if (userHelper) userHelper.textContent = config.userHelper;
            if (classNote) classNote.textContent = config.classNote;
            if (classInput) classInput.placeholder = config.classPlaceholder;
            if (classGroup) {
                classGroup.style.display = nextPortal === 'parent' ? 'block' : 'none';
                classGroup.setAttribute('aria-hidden', nextPortal === 'parent' ? 'false' : 'true');
            }
            if (!this.__bootLoginBusy) {
                setBootHelperMessage(config.helper, 'info');
                setBootSubmitState({ busy: false, text: config.submit });
            }
        },
        init() {
            this.syncLoginPortalUI(this.getLoginPortal());
            if (!readBootSessionUser()) {
                this.syncLoginOverlayState(true);
            } else {
                bootDebugLog('[boot-auth] User already logged in, bypassing overlay and loading modules');
                this.syncLoginOverlayState(false);
                loadAppModules();
            }
        },
        // Stub to prevent race condition crashes if app.js calls it before replacing window.Auth
        ensureLoginWorkbench() {
            bootDebugLog('[boot-auth] ensureLoginWorkbench called on shell, waiting for modules...');
            return null;
        },
        async login() {
            if (window.Auth && window.Auth !== this && !window.Auth.__bootLoginShell && typeof window.Auth.login === 'function') {
                return window.Auth.login();
            }
            if (this.__bootLoginBusy) return;
            const portal = this.getLoginPortal();
            const user = String(document.getElementById('login-user')?.value || '').trim();
            const pass = String(document.getElementById('login-pass')?.value || '').trim();
            const className = String(document.getElementById('login-class')?.value || '').trim();

            if (!user || !pass) {
                setBootHelperMessage('请输入账号和密码。', 'error');
                return;
            }
            if (portal === 'parent' && !className) {
                setBootHelperMessage('家长端请输入学生班级。', 'error');
                return;
            }

            this.__bootLoginBusy = true;
            setBootSubmitState({ busy: true, text: '正在验证身份...' });

            try {
                const result = await bootGateway.login(user, pass, className);

                if (result && result.user) {
                    const matchedUser = result.user;
                    writeBootSessionUser(matchedUser);
                    setBootHelperMessage('身份验证成功', 'success');
                    // Phase transition to Cohort Selection (School only)
                    if (portal === 'school' && window.gsap) {
                        const form = document.getElementById('login-form');
                        const cohortPhase = document.getElementById('login-cohort-phase');
                        const submitBtn = document.getElementById('login-submit-button');

                        if (form && cohortPhase) {
                            window.gsap.to(form, { opacity: 0, x: -20, duration: 0.4, onComplete: () => {
                                form.style.display = 'none';
                                cohortPhase.style.display = 'block';
                                if (submitBtn) submitBtn.style.display = 'none';
                                window.gsap.fromTo(cohortPhase, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.4 });
                                // Start loading modules and wait for auth readiness
                                (async () => {
                                    await loadAppModules();
                                    await window.waitForAuthReady();
                                    const loader = document.getElementById('global-loader');
                                    if (loader) {
                                        loader.style.opacity = '0';
                                        setTimeout(() => {
                                            loader.style.display = 'none';
                                            loader.classList.add('hidden');
                                        }, 300);
                                    }
                                })();
                            }});
                            return;
                        }
                    }

                    // Fallback or Parent Portal: Load and enter
                    const loader = document.getElementById('global-loader');
                    if (loader) loader.classList.remove('hidden');
                    await loadAppModules();
                    await window.waitForAuthReady();
                    this.syncLoginOverlayState(false);
                    if (loader) {
                        loader.style.opacity = '0';
                        setTimeout(() => {
                            loader.style.display = 'none';
                            loader.classList.add('hidden');
                        }, 300);
                    }
                } else {
                    setBootHelperMessage('验证失败：' + (result?.error || '账号密码错误'), 'error');
                    setBootSubmitState({ busy: false, text: getPortalConfig(portal).submit });
                }
            } catch (error) {
                setBootHelperMessage('验证失败：' + (error.message || '网络连接异常'), 'error');
                setBootSubmitState({ busy: false, text: getPortalConfig(portal).submit });
            } finally {
                this.__bootLoginBusy = false;
            }
        },
        logout() {
            if (typeof bootGateway.clearSession === 'function') bootGateway.clearSession();
            sessionStorage.removeItem('CURRENT_USER');
            sessionStorage.removeItem('CURRENT_ROLE');
            sessionStorage.removeItem('CURRENT_ROLES');
            this.__bootLoginBusy = false;
            this.syncLoginOverlayState(true);
            this.syncLoginPortalUI(this.getLoginPortal());
        }
    };

    function submitBootLogin() {
        if (window.Auth && typeof window.Auth.login === 'function') {
            window.Auth.login();
        }
    }

    function bindBootLoginActions() {
        document.querySelectorAll('[data-login-portal-action]').forEach((button) => {
            if (button.dataset.bootLoginBound === '1') return;
            button.dataset.bootLoginBound = '1';
            button.addEventListener('click', () => {
                const portal = button.dataset.loginPortalAction === 'parent' ? 'parent' : 'school';
                if (window.Auth && typeof window.Auth.setLoginPortal === 'function') {
                    window.Auth.setLoginPortal(portal);
                }
            });
        });
        document.querySelectorAll('[data-login-submit]').forEach((button) => {
            if (button.dataset.bootLoginBound === '1') return;
            button.dataset.bootLoginBound = '1';
            button.addEventListener('click', submitBootLogin);
        });
        document.querySelectorAll('[data-login-submit-on-enter]').forEach((input) => {
            if (input.dataset.bootLoginBound === '1') return;
            input.dataset.bootLoginBound = '1';
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') submitBootLogin();
            });
        });
    }

    // Protect window.Auth from being overwritten by late-loading legacy entry points.
    if (!window.Auth || window.Auth.__bootLoginShell) {
        Object.defineProperty(window, 'Auth', {
            value: bootAuth,
            writable: true,
            configurable: true
        });
    }

    function initBootAuthOnce() {
        if (window.__BOOT_AUTH_INIT_DONE__) return;
        window.__BOOT_AUTH_INIT_DONE__ = true;
        bindBootLoginActions();
        bootAuth.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBootAuthOnce, { once: true });
    } else {
        initBootAuthOnce();
    }
})();

window.scrollToAnchor = function (id, triggerEl) {
    var el = document.getElementById(id);
    if (el) {
        var headerH = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
        var y = el.getBoundingClientRect().top + window.pageYOffset - headerH - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
};

window.ensureTeacherDataAlpineStore = function () {
    if (!window.Alpine || typeof window.Alpine.store !== 'function') return;
    const existing = window.Alpine.store('teacherData');
    if (existing) {
        if (!Array.isArray(existing.list)) existing.list = [];
        return;
    }
    window.Alpine.store('teacherData', { list: [] });
};
document.addEventListener('alpine:init', window.ensureTeacherDataAlpineStore);

let __backToTopSyncTimer = 0;

function isVisibleBackToTopTarget(element) {
    if (!element) return false;
    if (element === document.documentElement || element === document.body || element === document.scrollingElement) {
        return true;
    }

    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function canScrollBackToTopTarget(element) {
    if (!element || typeof element.scrollTo !== 'function') return false;
    return (Number(element.scrollHeight || 0) - Number(element.clientHeight || 0)) > 24;
}

function readBackToTopScrollTop(element) {
    if (!element) return 0;
    if (element === window) {
        return Number(window.scrollY || window.pageYOffset || 0);
    }
    return Number(element.scrollTop || 0);
}

function scrollBackToTopTarget(element, behavior) {
    if (!element) return;

    if (element === window) {
        window.scrollTo({ top: 0, behavior: behavior || 'smooth' });
        return;
    }

    if (typeof element.scrollTo === 'function') {
        element.scrollTo({ top: 0, behavior: behavior || 'smooth' });
        return;
    }

    element.scrollTop = 0;
}

function pushBackToTopTarget(targets, element) {
    if (!element || targets.indexOf(element) !== -1) return;
    targets.push(element);
}

function collectBackToTopTargets() {
    const targets = [];

    [
        '.workspace-drawer.is-open .workspace-drawer-panel',
        '.modal[style*="display:block"] .modal-content',
        '.modal[style*="display: block"] .modal-content',
        '.modal.show .modal-content',
        'main.app-main'
    ].forEach((selector) => {
        pushBackToTopTarget(targets, document.querySelector(selector));
    });

    pushBackToTopTarget(targets, document.scrollingElement || document.documentElement || document.body);
    return targets.filter(isVisibleBackToTopTarget);
}

function resolveBackToTopTarget() {
    const targets = collectBackToTopTargets();
    return targets.find((element) => canScrollBackToTopTarget(element) && readBackToTopScrollTop(element) > 1)
        || targets.find((element) => canScrollBackToTopTarget(element))
        || null;
}

function ensureBackToTopButton() {
    let button = document.getElementById('back-to-top');
    if (button) return button;
    if (!document.body) return null;

    button = document.createElement('button');
    button.type = 'button';
    button.id = 'back-to-top';
    button.setAttribute('aria-label', '回到顶部');
    button.setAttribute('title', '回到顶部');
    button.setAttribute('aria-hidden', 'true');
    button.innerHTML = '<i class="ti ti-arrow-up"></i><span>顶部</span>';
    button.addEventListener('click', function () {
        window.scrollAppToTop('smooth');
    });
    document.body.appendChild(button);
    return button;
}

function bindBackToTopScrollTargets() {
    collectBackToTopTargets().forEach((element) => {
        if (!element || typeof element.addEventListener !== 'function') return;
        if (element === document.scrollingElement || element === document.documentElement || element === document.body) return;
        if (element.dataset.backToTopScrollBound === 'true') return;

        element.dataset.backToTopScrollBound = 'true';
        element.addEventListener('scroll', syncBackToTopButton, { passive: true });
    });
}

function syncBackToTopButton() {
    const button = ensureBackToTopButton();
    if (!button) return;
    bindBackToTopScrollTargets();

    const target = resolveBackToTopTarget();
    const isVisible = !!target && readBackToTopScrollTop(target) > 260;

    button.classList.toggle('is-visible', isVisible);
    button.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
}

function scheduleBackToTopButtonSync() {
    clearTimeout(__backToTopSyncTimer);
    __backToTopSyncTimer = window.setTimeout(syncBackToTopButton, 60);
}

window.scrollAppToTop = function (behavior) {
    let didScroll = false;

    collectBackToTopTargets().forEach((element) => {
        if (!canScrollBackToTopTarget(element) || readBackToTopScrollTop(element) <= 1) return;
        scrollBackToTopTarget(element, behavior || 'smooth');
        didScroll = true;
    });

    if (!didScroll && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: behavior || 'smooth' });
    }

    window.requestAnimationFrame(syncBackToTopButton);
};

function bindBackToTopButton() {
    if (window.__backToTopButtonBound) return;
    window.__backToTopButtonBound = true;

    ensureBackToTopButton();
    document.addEventListener('scroll', syncBackToTopButton, true);
    document.addEventListener('click', scheduleBackToTopButtonSync, true);
    window.addEventListener('scroll', syncBackToTopButton, { passive: true });
    window.addEventListener('resize', scheduleBackToTopButtonSync, { passive: true });
    window.addEventListener('load', scheduleBackToTopButtonSync, { once: true });
    scheduleBackToTopButtonSync();
    window.setTimeout(scheduleBackToTopButtonSync, 300);
    window.setTimeout(scheduleBackToTopButtonSync, 1200);
}

window.syncBackToTopButton = syncBackToTopButton;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindBackToTopButton, { once: true });
} else {
    bindBackToTopButton();
}

window.ensureLazySectionLoaded = function (sectionId) {
    const id = String(sectionId || '').trim();
    if (!id) return null;

    const section = document.getElementById(id);
    if (!section) return null;

    const templateId = String(section.dataset.lazySectionTemplate || '').trim();
    if (!templateId) return section;

    const templateNode = document.getElementById(templateId);
    if (!templateNode) return section;

    const html = String(templateNode.textContent || '').trim();
    if (!html) return section;

    const parser = document.createElement('template');
    parser.innerHTML = html;
    const replacement = parser.content.firstElementChild;
    if (!replacement || replacement.id !== id) {
        console.warn(`[lazy-section] invalid template for ${id}`);
        return section;
    }

    section.replaceWith(replacement);
    templateNode.remove();
    return replacement;
};

window.__optionalRuntimeLoaders = window.__optionalRuntimeLoaders || {};
window.__optionalStylesheetLoaders = window.__optionalStylesheetLoaders || {};
function getOptionalAssetCandidates(src, localPrefixes = []) {
    const normalized = String(src || '').trim();
    const candidates = [];
    const relativePath = normalized.replace(/^(\.\/|\/)/, '');
    const assetRelativePath = relativePath.replace(/^(?:dist|public)\//, '');
    const currentPath = String(window.location && window.location.pathname || '').replace(/\\/g, '/');
    const currentDir = currentPath.replace(/[^/]*$/, '');
    const isDistDocument = /\/dist\/$/i.test(currentDir);
    const isPublicDocument = /\/public\/$/i.test(currentDir);
    const normalizedPrefixes = Array.isArray(localPrefixes)
        ? localPrefixes
            .map((prefix) => String(prefix || '').trim().replace(/^(\.\/|\/)/, ''))
            .filter(Boolean)
        : [];
    const matchesLocalPrefix = normalizedPrefixes.some((prefix) => {
        const assetPrefix = prefix.replace(/^(?:dist|public)\//, '');
        return relativePath.startsWith(prefix)
            || assetRelativePath.startsWith(prefix)
            || assetRelativePath.startsWith(assetPrefix);
    });
    const referencesLocalAsset = /(^|\/)assets\//.test(relativePath);
    if (window.location
        && window.location.protocol === 'file:'
        && (matchesLocalPrefix || referencesLocalAsset)) {
        candidates.push(`./${assetRelativePath}`);
        if (!isDistDocument) {
            candidates.push(`./dist/${assetRelativePath}`);
        }
        if (!isPublicDocument && !isDistDocument) {
            candidates.push(`./public/${assetRelativePath}`);
        }
    }
    candidates.push(normalized);
    return Array.from(new Set(candidates.filter(Boolean)));
}

function getOptionalRuntimeCandidates(src) {
    return getOptionalAssetCandidates(src, ['./assets/js/', './assets/vendor/']);
}

function getOptionalStylesheetCandidates(href) {
    return getOptionalAssetCandidates(href, ['./assets/css/', './assets/vendor/']);
}

function getInlineOptionalRuntimeSource(src) {
    const normalized = String(src || '').trim();
    if (!window.__INLINE_RUNTIME_SOURCES || typeof window.__INLINE_RUNTIME_SOURCES !== 'object') {
        return '';
    }
    if (typeof window.__INLINE_RUNTIME_SOURCES[normalized] === 'string') {
        return window.__INLINE_RUNTIME_SOURCES[normalized];
    }
    const relativePath = normalized
        .replace(/^\.\/dist\/assets\/js\//, './assets/js/')
        .replace(/^\.\/public\/assets\/js\//, './assets/js/');
    return typeof window.__INLINE_RUNTIME_SOURCES[relativePath] === 'string'
        ? window.__INLINE_RUNTIME_SOURCES[relativePath]
        : '';
}

function injectOptionalRuntimeScript(key, src) {
    return new Promise((resolve, reject) => {
        const inlineSource = getInlineOptionalRuntimeSource(src);
        if (inlineSource) {
            try {
                const inlineScript = document.createElement('script');
                inlineScript.defer = true;
                inlineScript.async = true;
                inlineScript.dataset.runtime = key;
                inlineScript.dataset.runtimeCandidate = src;
                if (typeof Blob === 'function' && window.URL && typeof window.URL.createObjectURL === 'function') {
                    const blobUrl = window.URL.createObjectURL(new Blob([inlineSource], { type: 'application/javascript' }));
                    inlineScript.src = blobUrl;
                    inlineScript.onload = () => {
                        inlineScript.dataset.runtimeLoaded = 'true';
                        window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 0);
                        if (typeof window.wrapXlsxRuntimeExports === 'function') window.wrapXlsxRuntimeExports();
                        resolve();
                    };
                    inlineScript.onerror = () => {
                        window.URL.revokeObjectURL(blobUrl);
                        inlineScript.remove();
                        reject(new Error(`Failed to load inline runtime: ${src}`));
                    };
                } else {
                inlineScript.dataset.runtimeLoaded = 'true';
                inlineScript.text = inlineSource;
            }
            document.head.appendChild(inlineScript);
            if (!inlineScript.src) {
                if (typeof window.wrapXlsxRuntimeExports === 'function') window.wrapXlsxRuntimeExports();
                resolve();
            }
            } catch (error) {
                reject(error);
            }
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.async = true;
        script.dataset.runtime = key;
        script.dataset.runtimeCandidate = src;
        script.onload = () => {
            script.dataset.runtimeLoaded = 'true';
            if (typeof window.wrapXlsxRuntimeExports === 'function') window.wrapXlsxRuntimeExports();
            resolve();
        };
        script.onerror = () => {
            script.remove();
            reject(new Error(`Failed to load runtime: ${src}`));
        };
        document.head.appendChild(script);
    });
}

function loadOptionalRuntime(key, src) {
    if (window.__optionalRuntimeLoaders[key]) return window.__optionalRuntimeLoaders[key];

    const existing = document.querySelector(`script[data-runtime="${key}"][data-runtime-loaded="true"]`);
    if (existing) {
        window.__optionalRuntimeLoaders[key] = Promise.resolve();
        return window.__optionalRuntimeLoaders[key];
    }

    window.__optionalRuntimeLoaders[key] = (async () => {
        let lastError = null;
        for (const candidate of getOptionalRuntimeCandidates(src)) {
            try {
                await injectOptionalRuntimeScript(key, candidate);
                return;
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error(`Failed to load runtime: ${src}`);
    })().catch((error) => {
        delete window.__optionalRuntimeLoaders[key];
        throw error;
    });
    return window.__optionalRuntimeLoaders[key];
}

function injectOptionalStylesheet(key, href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.optionalStylesheet = key;
        link.dataset.optionalStylesheetCandidate = href;
        link.onload = () => {
            link.dataset.optionalStylesheetLoaded = 'true';
            resolve();
        };
        link.onerror = () => {
            link.remove();
            reject(new Error(`Failed to load stylesheet: ${href}`));
        };
        document.head.appendChild(link);
    });
}

function loadOptionalStylesheet(key, href) {
    if (window.__optionalStylesheetLoaders[key]) return window.__optionalStylesheetLoaders[key];

    const existing = document.querySelector(`link[data-optional-stylesheet="${key}"][data-optional-stylesheet-loaded="true"]`);
    if (existing) {
        window.__optionalStylesheetLoaders[key] = Promise.resolve(existing);
        return window.__optionalStylesheetLoaders[key];
    }

    window.__optionalStylesheetLoaders[key] = (async () => {
        let lastError = null;
        for (const candidate of getOptionalStylesheetCandidates(href)) {
            try {
                await injectOptionalStylesheet(key, candidate);
                return document.querySelector(`link[data-optional-stylesheet="${key}"][data-optional-stylesheet-loaded="true"]`);
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error(`Failed to load stylesheet: ${href}`);
    })().catch((error) => {
        delete window.__optionalStylesheetLoaders[key];
        throw error;
    });
    return window.__optionalStylesheetLoaders[key];
}

function loadOptionalRuntimeBundle(key, entries) {
    if (window.__optionalRuntimeLoaders[key]) return window.__optionalRuntimeLoaders[key];
    window.__optionalRuntimeLoaders[key] = entries.reduce((chain, entry) => {
        return chain.then(() => loadOptionalRuntime(entry.key, entry.src));
    }, Promise.resolve()).catch((error) => {
        delete window.__optionalRuntimeLoaders[key];
        throw error;
    });
    return window.__optionalRuntimeLoaders[key];
}

function yieldRuntimeWarmupFrame() {
    return new Promise((resolve) => {
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(resolve, { timeout: 220 });
            return;
        }
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => resolve());
            return;
        }
        window.setTimeout(resolve, 0);
    });
}

function isRuntimeMobileViewport() {
    return typeof window.matchMedia === 'function'
        && window.matchMedia('(max-width: 768px)').matches;
}

function getRuntimeLoadProfile() {
    try {
        const stored = String(localStorage.getItem('SYSTEM_LOAD_PROFILE') || '').trim().toLowerCase();
        if (stored === 'full' || stored === 'lazy' || stored === 'balanced') return stored;
    } catch (_) {}
    try {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
        const saveData = !!connection?.saveData;
        const effectiveType = String(connection?.effectiveType || '').toLowerCase();
        const slowNetwork = effectiveType === 'slow-2g' || effectiveType === '2g';
        const lowMemory = Number(navigator.deviceMemory || 0) > 0 && Number(navigator.deviceMemory || 0) <= 2;
        const lowCpu = Number(navigator.hardwareConcurrency || 0) > 0 && Number(navigator.hardwareConcurrency || 0) <= 4;
        if (saveData || slowNetwork || lowMemory || (isRuntimeMobileViewport() && lowCpu)) return 'lazy';
    } catch (_) {}
    return 'balanced';
}

function getRuntimeSkillEntries(skillId) {
    const skill = SYSTEM_RUNTIME_SKILLS[skillId];
    return skill && Array.isArray(skill.entries) ? skill.entries.slice() : [];
}

function shouldWarmRuntimeSkill(skill, profile) {
    if (!skill) return false;
    if (profile === 'lazy') return false;
    if (profile === 'full') return skill.warmup !== 'mobile';
    if (isRuntimeMobileViewport()) return skill.warmup === 'mobile';
    return skill.warmup === 'balanced';
}

function getRuntimeWarmupSkillIds(profile = getRuntimeLoadProfile()) {
    return Object.keys(SYSTEM_RUNTIME_SKILLS)
        .filter((skillId) => shouldWarmRuntimeSkill(SYSTEM_RUNTIME_SKILLS[skillId], profile));
}

function createSystemRuntimeLoader() {
    const loadSkill = function (skillId) {
        const id = String(skillId || '').trim();
        const skill = SYSTEM_RUNTIME_SKILLS[id];
        if (!skill) return Promise.reject(new Error(`Unknown runtime skill: ${id}`));
        return loadOptionalRuntimeBundle(`runtime-skill:${id}`, getRuntimeSkillEntries(id));
    };
    const loadMany = function (skillIds) {
        return (Array.isArray(skillIds) ? skillIds : [])
            .reduce((chain, skillId, index) => chain
                .then(() => (index > 0 ? yieldRuntimeWarmupFrame() : undefined))
                .then(() => loadSkill(skillId)), Promise.resolve());
    };
    const preloadSkill = function (skillId) {
        const entries = getRuntimeSkillEntries(skillId);
        prefetchAppModuleList(entries.map((entry) => entry.src), `runtime-skill-${String(skillId || '').replace(/[^a-z0-9-]/gi, '-')}`);
        return Promise.resolve(true);
    };
    const warmup = function (profile = getRuntimeLoadProfile()) {
        if (window.__RUNTIME_SKILL_WARMUP_PROMISE__) return window.__RUNTIME_SKILL_WARMUP_PROMISE__;
        const skillIds = getRuntimeWarmupSkillIds(profile);
        skillIds.forEach(preloadSkill);
        window.__RUNTIME_SKILL_WARMUP_PROMISE__ = loadMany(skillIds).then((result) => {
            window.dispatchEvent(new CustomEvent('school:runtime-skills-ready', {
                detail: { profile, skillIds }
            }));
            window.dispatchEvent(new CustomEvent('school:deferred-vendors-ready'));
            return result;
        }).catch((error) => {
            delete window.__RUNTIME_SKILL_WARMUP_PROMISE__;
            throw error;
        });
        return window.__RUNTIME_SKILL_WARMUP_PROMISE__;
    };
    return {
        manifest: SYSTEM_RUNTIME_SKILLS,
        profile: getRuntimeLoadProfile,
        load: loadSkill,
        loadMany,
        preload: preloadSkill,
        warmup,
        loadAll() {
            return warmup('full');
        }
    };
}

window.SystemRuntimeLoader = window.SystemRuntimeLoader || createSystemRuntimeLoader();

window.ensureAccountAdminRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('account-admin');
};

window.ensureHistoryCompareRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('history-compare');
};

window.ensurePerfMobileRuntimeLoaded = function () {
    return loadOptionalRuntime('perf-mobile', './assets/js/perf-mobile-runtime.js');
};

window.ensureShellPolishRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('shell-polish');
};

window.ensureMobileManagerRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('mobile-manager');
};

window.ensureDataManagerSqlRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('data-manager-sql');
};

window.ensureAlasqlVendorLoaded = function () {
    return loadOptionalRuntime('alasql-vendor', './assets/vendor/alasql/alasql.min.js');
};

window.ensureCryptoJsVendorLoaded = function () {
    if (window.CryptoJS) return Promise.resolve(window.CryptoJS);
    return loadOptionalRuntime('crypto-vendor', './assets/vendor/crypto-js/crypto-js.min.js').then(() => {
        if (!window.CryptoJS) {
            throw new Error('CryptoJS runtime unavailable');
        }
        return window.CryptoJS;
    });
};

window.ensureSweetAlertVendorLoaded = function () {
    const loaded = getLoadedSweetAlertVendor();
    if (loaded) return Promise.resolve(loaded);
    return loadOptionalRuntime('sweetalert-vendor', './assets/vendor/sweetalert2/sweetalert2.all.min.js').then(() => {
        const swal = getLoadedSweetAlertVendor();
        if (!swal) {
            throw new Error('SweetAlert2 runtime unavailable');
        }
        return swal;
    });
};

window.ensureGsapVendorLoaded = function () {
    if (window.gsap) return Promise.resolve(window.gsap);
    return loadOptionalRuntime('gsap-vendor', './assets/vendor/gsap/gsap.min.js').then(() => {
        if (!window.gsap) {
            throw new Error('GSAP runtime unavailable');
        }
        return window.gsap;
    });
};

window.ensureChartVendorLoaded = function () {
    if (window.Chart) return Promise.resolve(window.Chart);
    return loadOptionalRuntime('chart-vendor', './assets/vendor/chart.js/chart.umd.min.js').then(() => {
        if (!window.Chart) {
            throw new Error('Chart runtime unavailable');
        }
        return window.Chart;
    });
};

window.ensureXlsxVendorLoaded = function () {
    if (window.XLSX && window.XLSX.utils) return Promise.resolve(window.XLSX);
    return loadOptionalRuntime('xlsx-vendor', './assets/vendor/xlsx/xlsx.full.min.js').then(() => {
        if (!window.XLSX || !window.XLSX.utils) {
            throw new Error('XLSX runtime unavailable');
        }
        return window.XLSX;
    });
};

window.ensurePdfExportVendorsLoaded = function () {
    return window.SystemRuntimeLoader.load('pdf-export');
};

window.ensureReportRenderRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('report-render');
};

window.ensureOptionalStylesheetLoaded = function (key, href) {
    return loadOptionalStylesheet(key, href);
};

window.ensureSchoolProfileRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('school-profile');
};

window.ensureTeachingManagementRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('teaching-management');
};

window.ensureAppDownloadRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('app-download');
};

window.ensureTeacherAnalysisMainRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('teacher-analysis');
};

window.ensureCountyAnalysisRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('county-analysis');
};

window.ensureProgressAnalysisRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('progress-analysis');
};

window.ensureStudentCompareRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('student-compare');
};

window.ensureTownSubmoduleCompareRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('town-submodule-compare').then((result) => {
        if (typeof window.wrapXlsxRuntimeExports === 'function') window.wrapXlsxRuntimeExports();
        return result;
    });
};

window.ensureTeacherCompareRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('teacher-compare');
};

window.ensureMacroCompareRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('macro-compare');
};

window.ensureZhongkaoCountdownRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('zhongkao-countdown');
};

window.ensureFreshmanExamRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('freshman-exam');
};

window.ensureGradeSchedulerRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('grade-scheduler');
};

window.ensureVoiceControlRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('voice-control');
};

window.ensureModuleHelpRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('module-help');
};

window.ensurePackagerRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('packager');
};

window.ensureWorkerApiRuntimeLoaded = function () {
    return window.SystemRuntimeLoader.load('worker-api');
};

function installOptionalRuntimeMethod(name, loader) {
    if (typeof window[name] === 'function') return;
    window[name] = function (...args) {
        const current = window[name];
        return loader().then(() => {
            const next = window[name];
            if (typeof next === 'function' && next !== current) {
                return next.apply(this, args);
            }
            throw new Error(`${name} runtime not loaded`);
        });
    };
}

function installOptionalRuntimePlaceholder(name, message) {
    if (typeof window[name] === 'function') return;
    window[name] = function () {
        throw new Error(message || `${name} runtime not loaded`);
    };
}

const XLSX_RUNTIME_FUNCTIONS = [
    'exportHighScoreExcel',
    'exportStudentDetails',
    'importTeacherExcel',
    'exportMutualAidGroups',
    'exportSummaryTable',
    'exportSegmentExcel',
    'exportHorizontalExcel',
    'exportMacroTables',
    'SB_exportExcel',
    'exportPotentialAnalysis',
    'exportCorrelationExcel',
    'exportExcel',
    'downloadTemplate',
    'exportMarginalTasks',
    'exportCountyAnalysisSection',
    'SSE_export',
    'exportValueAddedExcel',
    'exportMultiPeriodComparison',
    'exportProgressAnalysis',
    'exportStudentMultiPeriodComparison',
    'exportAllTeachersMultiPeriodDiff',
    'exportTeacherMultiPeriodComparison',
    'exportMacroMultiPeriodComparison',
    'exportTownSubmoduleCompare',
    'exportTeacherComparisonExcel',
    'exportTeacherComparisonExcelV2',
    'exportTeacherTownshipRankExcel',
    'FB_loadData',
    'FB_exportResult',
    'EXAM_loadData',
    'EXAM_exportResult'
];

const XLSX_RUNTIME_OBJECT_METHODS = [
    { owner: 'Auth', methods: ['exportAccounts', 'exportAllCloudAccounts'] },
    { owner: 'DataManager', methods: ['handleHistoryUpload', 'handleTeacherUpload', 'handleTargetUpload', 'exportSQLResult'] },
    { owner: 'AccountExcel', methods: ['downloadTemplate', 'upload'] },
    { owner: 'SCHEDULER', methods: ['downloadTemplate', 'loadData', 'exportResult', 'importExisting'] },
    { owner: 'GradeSchedulerRuntime', methods: ['downloadTemplate', 'loadData', 'exportResult', 'importExisting'] },
    { owner: 'DrillSystem', methods: ['exportExcel'] },
    { owner: 'CohortGrowth', methods: ['exportVolatility'] }
];

function isXlsxRuntimeReady() {
    return !!(window.XLSX && window.XLSX.utils);
}

function reportXlsxLoadFailure(error) {
    console.warn('[boot-runtime] XLSX runtime load failed:', error);
    const message = `Excel 组件加载失败：${error && error.message ? error.message : error}`;
    if (window.UI && typeof window.UI.toast === 'function') {
        window.UI.toast(message, 'error');
        return;
    }
    if (typeof window.alert === 'function') window.alert(message);
}

function wrapXlsxRuntimeFunction(owner, name) {
    if (!owner || typeof owner[name] !== 'function') return;
    const original = owner[name];
    if (original.__xlsxRuntimeWrapped) return;
    const wrapped = function (...args) {
        if (isXlsxRuntimeReady()) return original.apply(this, args);
        return window.ensureXlsxVendorLoaded()
            .then(() => original.apply(this, args))
            .catch((error) => {
                reportXlsxLoadFailure(error);
                throw error;
            });
    };
    wrapped.__xlsxRuntimeWrapped = true;
    wrapped.__xlsxRuntimeOriginal = original;
    owner[name] = wrapped;
}

window.wrapXlsxRuntimeExports = function () {
    XLSX_RUNTIME_FUNCTIONS.forEach((name) => wrapXlsxRuntimeFunction(window, name));
    XLSX_RUNTIME_OBJECT_METHODS.forEach((group) => {
        const owner = window[group.owner];
        if (!owner) return;
        group.methods.forEach((name) => wrapXlsxRuntimeFunction(owner, name));
    });
};

function warmOptionalRuntimeAfterLoad(flagName, loader, delayMs = 1200) {
    if (typeof loader !== 'function') return;
    const run = () => {
        if (flagName && window[flagName]) return;
        loader().catch((error) => {
            console.warn(error);
        });
    };
    if (document.readyState === 'complete') {
        window.setTimeout(run, delayMs);
        return;
    }
    window.addEventListener('load', () => {
        window.setTimeout(run, delayMs);
    }, { once: true });
}

const accountAdminStub = {
    downloadTemplate(...args) {
        return window.ensureAccountAdminRuntimeLoaded().then(() => {
            if (window.AccountExcel !== accountAdminStub && typeof window.AccountExcel?.downloadTemplate === 'function') {
                return window.AccountExcel.downloadTemplate(...args);
            }
            throw new Error('AccountExcel runtime not loaded');
        });
    },
    upload(...args) {
        return window.ensureAccountAdminRuntimeLoaded().then(() => {
            if (window.AccountExcel !== accountAdminStub && typeof window.AccountExcel?.upload === 'function') {
                return window.AccountExcel.upload(...args);
            }
            throw new Error('AccountExcel runtime not loaded');
        });
    }
};

if (!window.AccountExcel) {
    window.AccountExcel = accountAdminStub;
}

['toggleAdminManualInput', 'changeAdminPass', 'openUserPasswordModal', 'submitUserPasswordChange'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureAccountAdminRuntimeLoaded);
});

['printSingleReport', 'downloadSingleReportPDF', 'batchGeneratePDF', 'copyReport'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureReportRenderRuntimeLoaded);
});

['showSchoolProfile', 'jumpToModule'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureSchoolProfileRuntimeLoaded);
});

[
    'analyzeTeachers',
    'generateTeacherPairing',
    'renderTeacherCards',
    'showTeacherDetails',
    'renderTeacherComparisonTable',
    'renderTeacherTownshipRanking',
    'updateCorrelationSchoolSelect',
    'renderCorrelationAnalysis',
    'exportTeacherComparisonExcel',
    'exportTeacherTownshipRankExcel'
].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureTeacherAnalysisMainRuntimeLoaded);
});

[
    'updateSSESchoolSelect',
    'SSE_calculate',
    'SSE_export'
].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureSingleSchoolEvalRuntimeLoaded);
});

[
    'renderCountyAnalysis',
    'exportCountyAnalysisSection',
    'setCountyAnalysisSchoolNameFromInput',
    'generateCountySchoolHorizontalTable'
].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureCountyAnalysisRuntimeLoaded);
});

[
    'switchValueAddedView',
    'exportValueAddedExcel',
    'updateProgressSchoolSelect',
    'updateProgressBaselineSelect',
    'onProgressComparePeriodCountChange',
    'renderMultiPeriodComparison',
    'exportMultiPeriodComparison',
    'setProgressBaselineStatus',
    'ensureProgressBaselineData',
    'updateProgressMultiExamSelects',
    'renderValueAddedReport',
    'performSilentMatching',
    'exportProgressAnalysis',
    'setProgressQuickFilter',
    'renderProgressAnalysis',
    'applyProgressFilter',
    'resetProgressFilter'
].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureProgressAnalysisRuntimeLoaded);
});

['renderStudentMultiPeriodComparison', 'saveStudentCompareToCloud', 'viewCloudStudentCompares', 'exportStudentMultiPeriodComparison', 'loadCloudStudentCompare'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureStudentCompareRuntimeLoaded);
});

[
    'ensureTownSubmoduleCompareUIs',
    'getTownSubmoduleSeries',
    'openTownSubmoduleCompareDialog',
    'renderTownSubmoduleMultiPeriodComparison',
    'exportTownSubmoduleCompare',
    'saveTownSubmoduleCompareToCloud',
    'viewCloudTownSubmoduleCompares',
    'loadCloudTownSubmoduleCompare'
].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureTownSubmoduleCompareRuntimeLoaded);
});

['renderTeacherMultiPeriodComparison', 'renderAllTeachersMultiPeriodComparison', 'exportAllTeachersMultiPeriodDiff', 'exportTeacherMultiPeriodComparison', 'saveTeacherMultiPeriodCompareToCloud', 'viewCloudTeacherCompares', 'loadCloudTeacherCompare'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureTeacherCompareRuntimeLoaded);
});

['renderMacroMultiPeriodComparison', 'exportMacroMultiPeriodComparison', 'saveMacroMultiPeriodCompareToCloud', 'viewCloudMacroCompares', 'loadCloudMacroCompare'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureMacroCompareRuntimeLoaded);
});

['renderSingleReportCardHTML', 'renderRadarChart', 'renderVarianceChart', 'analyzeStrengthsAndWeaknesses'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureReportRenderRuntimeLoaded);
});

[
    'FB_loadData',
    'FB_runDivision',
    'FB_applyScheme',
    'FB_openSeatMap',
    'FB_autoSeatAlgo',
    'FB_renderSeatMap',
    'FB_toggleLock',
    'FB_toggleViewRotation',
    'FB_saveToLocal',
    'FB_exportResult',
    'addBindPair',
    'FB_initScenarioSelect',
    'FB_saveScenario',
    'FB_loadScenario',
    'FB_deleteScenario',
    'EXAM_loadData',
    'EXAM_generate',
    'EXAM_switchView',
    'EXAM_generateDeskLabels',
    'EXAM_initProctorUI',
    'EXAM_assignProctors',
    'EXAM_exportResult'
].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureFreshmanExamRuntimeLoaded);
});

if (!window.SCHEDULER) {
    const schedulerStub = {};
    [
        'addConstraint',
        'removeConstraint',
        'downloadTemplate',
        'loadData',
        'run',
        'auditFatigue',
        'renderTable',
        'exportResult',
        'importExisting'
    ].forEach((name) => {
        schedulerStub[name] = function (...args) {
            const current = window.SCHEDULER && window.SCHEDULER !== schedulerStub ? window.SCHEDULER : null;
            if (current && typeof current[name] === 'function') return current[name](...args);
            return window.ensureGradeSchedulerRuntimeLoaded().then(() => {
                const next = window.SCHEDULER;
                if (next && next !== schedulerStub && typeof next[name] === 'function') {
                    return next[name](...args);
                }
                throw new Error(`SCHEDULER.${name} runtime not loaded`);
            });
        };
    });
    window.SCHEDULER = schedulerStub;
}

if (!window.VoiceControl) {
    const voiceControlStub = {};
    ['init', 'toggle', 'stop', 'processCommand', 'toggleFullScreen'].forEach((name) => {
        voiceControlStub[name] = function (...args) {
            const current = window.VoiceControl && window.VoiceControl !== voiceControlStub ? window.VoiceControl : null;
            if (current && typeof current[name] === 'function') return current[name](...args);
            return window.ensureVoiceControlRuntimeLoaded().then(() => {
                const next = window.VoiceControl;
                if (next && next !== voiceControlStub && typeof next[name] === 'function') {
                    return next[name](...args);
                }
                throw new Error(`VoiceControl.${name} runtime not loaded`);
            });
        };
    });
    window.VoiceControl = voiceControlStub;
}

installOptionalRuntimeMethod('showModuleHelp', window.ensureModuleHelpRuntimeLoaded);
window.wrapXlsxRuntimeExports();

if (typeof window.ensureModuleHelpButton !== 'function') {
    window.ensureModuleHelpButton = function (sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const titleEl = section.querySelector('.sec-head h2') || section.querySelector('.module-desc-bar h3');
        if (!titleEl || titleEl.querySelector('.module-help-btn')) return;
        const btn = document.createElement('span');
        btn.className = 'module-help-btn';
        btn.textContent = '📘 模型说明';
        btn.onclick = () => window.showModuleHelp(sectionId);
        titleEl.appendChild(btn);
    };
}

function runAfterAppModulesReady(task) {
    if (typeof task !== 'function') return;
    if (window.__APP_MODULES_LOADED__ === true) {
        task();
        return;
    }
    let done = false;
    const run = () => {
        if (done) return;
        done = true;
        task();
    };
    if (window.__APP_MODULES_LOAD_PROMISE__ && typeof window.__APP_MODULES_LOAD_PROMISE__.then === 'function') {
        window.__APP_MODULES_LOAD_PROMISE__.then(run).catch(run);
    }
    window.addEventListener('school:app-modules-ready', run, { once: true });
}

function scheduleMobileRuntimeBootstrap(options = {}) {
    const maxWidth = Number(options.maxWidth || 960);
    const includePerf = !!options.includePerf;
    const delayMs = Number(options.delayMs || 0);
    const devMode = localStorage.getItem('DEV_MODE') === 'true';
    const shouldIncludePerf = includePerf && devMode;
    if (!(window.innerWidth <= maxWidth || devMode)) return;
    const flagName = shouldIncludePerf ? '__MOBILE_PERF_BOOTSTRAP_SCHEDULED__' : '__MOBILE_RUNTIME_BOOTSTRAP_SCHEDULED__';
    if (window[flagName]) return;
    window[flagName] = true;

    runAfterAppModulesReady(() => {
        const load = () => {
            window.ensureMobileManagerRuntimeLoaded()
                .then(() => (shouldIncludePerf ? window.ensurePerfMobileRuntimeLoaded() : undefined))
                .catch((error) => {
                    console.warn(error);
                });
        };
        const run = () => {
            if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
                window.SystemPerformance.scheduleIdle(load, { label: 'mobile-runtime-bootstrap', delay: delayMs, timeout: 1800 });
                return;
            }
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(load, { timeout: 1800 });
                return;
            }
            window.setTimeout(load, delayMs);
        };
        window.setTimeout(run, delayMs);
    });
}

scheduleMobileRuntimeBootstrap({ maxWidth: 960, delayMs: 120 });
scheduleMobileRuntimeBootstrap({ maxWidth: 768, includePerf: true, delayMs: 480 });

function scheduleHotspotRuntimeWarmup() {
    if (window.__HOTSPOT_RUNTIME_WARMUP_SCHEDULED__) return;
    if (getRuntimeLoadProfile() === 'lazy' || isRuntimeMobileViewport()) return;
    window.__HOTSPOT_RUNTIME_WARMUP_SCHEDULED__ = true;

    const steps = [
        { label: 'xlsx-vendor', loader: () => window.ensureXlsxVendorLoaded?.() },
        { label: 'town-submodule-compare', loader: () => window.ensureTownSubmoduleCompareRuntimeLoaded?.() },
        { label: 'school-profile', loader: () => window.ensureSchoolProfileRuntimeLoaded?.() },
        { label: 'teacher-analysis', loader: () => window.ensureTeacherAnalysisMainRuntimeLoaded?.() },
        { label: 'teaching-management', loader: () => window.ensureTeachingManagementRuntimeLoaded?.() },
        { label: 'student-compare', loader: () => window.ensureStudentCompareRuntimeLoaded?.() },
        { label: 'report-render', loader: () => window.ensureReportRenderRuntimeLoaded?.() },
        { label: 'freshman-exam', loader: () => window.ensureFreshmanExamRuntimeLoaded?.() },
        { label: 'app-download', loader: () => window.ensureAppDownloadRuntimeLoaded?.() }
    ];

    const preload = () => {
        try {
            prefetchAppModuleList(['./assets/vendor/xlsx/xlsx.full.min.js'], 'hotspot-runtime-xlsx');
            steps.forEach((step) => {
                const skill = SYSTEM_RUNTIME_SKILLS[step.label];
                if (skill && Array.isArray(skill.entries)) {
                    prefetchAppModuleList(skill.entries.map((entry) => entry.src), `hotspot-runtime-${step.label}`);
                }
            });
        } catch (error) {
            console.warn('[boot-runtime] hotspot runtime prefetch failed:', error);
        }
    };

    const runStep = (index = 0) => {
        if (index >= steps.length) return;
        const step = steps[index];
        const run = () => {
            Promise.resolve()
                .then(() => (typeof step.loader === 'function' ? step.loader() : undefined))
                .catch((error) => console.warn(`[boot-runtime] hotspot runtime warmup failed: ${step.label}`, error))
                .finally(() => {
                    window.setTimeout(() => runStep(index + 1), 650);
                });
        };
        if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
            window.SystemPerformance.scheduleIdle(run, { label: `hotspot-runtime:${step.label}`, delay: 120, timeout: 2200 });
            return;
        }
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(run, { timeout: 2200 });
            return;
        }
        window.setTimeout(run, 120);
    };

    runAfterAppModulesReady(() => {
        window.setTimeout(() => {
            preload();
            runStep(0);
        }, 1800);
    });
}

scheduleHotspotRuntimeWarmup();

function installHistoryDoQueryWrapper() {
    if (window.__historyDoQueryWrapped || typeof window.doQuery !== 'function') return false;
    const base = window.doQuery;
    const wrapped = async function (...args) {
        const warmHistoryRuntime = () => {
            Promise.allSettled([
                window.ensureStudentCompareRuntimeLoaded?.(),
                window.ensureHistoryCompareRuntimeLoaded?.()
            ]).then(() => {
                const currentStudent = typeof window.readCurrentReportStudentState === 'function'
                    ? window.readCurrentReportStudentState()
                    : null;
                if (currentStudent && typeof window.setCloudCompareTarget === 'function') {
                    window.setCloudCompareTarget(currentStudent);
                }
            }).catch((error) => console.warn(error));
        };
        if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
            window.SystemPerformance.scheduleIdle(warmHistoryRuntime, { label: 'report-history-runtime-warmup', delay: 80, timeout: 1500 });
        } else {
            window.setTimeout(warmHistoryRuntime, 80);
        }
        const next = window.doQuery !== wrapped ? window.doQuery : base;
        if (window.doQuery !== wrapped) {
            window.doQuery = wrapped;
        }
        return next.apply(this, args);
    };
    window.doQuery = wrapped;
    window.__historyDoQueryWrapped = true;
    return true;
}

function installDataManagerSqlHooks() {
    if (window.__dataManagerSqlHooksInstalled || !window.DataManager || typeof window.DataManager !== 'object') return false;

    [
        'renderSQLHistory',
        'applySQLHistory',
        'saveNamedSQL',
        'clearSQLHistory',
        'setQuickSQL',
        'runSQL',
        'exportSQLResult'
    ].forEach((name) => {
        if (typeof window.DataManager[name] === 'function') return;
        window.DataManager[name] = function (...args) {
            const current = window.DataManager[name];
            return window.ensureDataManagerSqlRuntimeLoaded().then(() => {
                const next = window.DataManager[name];
                if (typeof next === 'function' && next !== current) {
                    return next.apply(window.DataManager, args);
                }
                throw new Error(`${name} runtime not loaded`);
            });
        };
    });

    if (typeof window.talkToData !== 'function') {
        window.talkToData = function (...args) {
            const current = window.talkToData;
            return window.ensureDataManagerSqlRuntimeLoaded().then(() => {
                const next = window.talkToData;
                if (typeof next === 'function' && next !== current) {
                    return next.apply(window, args);
                }
                throw new Error('talkToData runtime not loaded');
            });
        };
    }

    if (!window.__dataManagerSqlSwitchWrapped && typeof window.DataManager.switchTab === 'function') {
        const baseSwitchTab = window.DataManager.switchTab;
        window.DataManager.switchTab = async function (tab, ...args) {
            if (tab === 'sql') {
                try {
                    await window.ensureDataManagerSqlRuntimeLoaded();
                } catch (error) {
                    console.warn(error);
                }
            }
            return baseSwitchTab.call(this, tab, ...args);
        };
        window.__dataManagerSqlSwitchWrapped = true;
    }

    window.__dataManagerSqlHooksInstalled = true;
    return true;
}

function retryInstallLateHook(installer, options) {
    const opts = options || {};
    const maxTries = Number(opts.maxTries || 480);
    const intervalMs = Number(opts.intervalMs || 250);
    const onExhausted = typeof opts.onExhausted === 'function' ? opts.onExhausted : null;

    // Attempt immediate installation
    try {
        if (installer()) return;
    } catch (e) {
        console.warn('[boot-runtime] Hook install error (initial):', e);
    }

    let tries = 0;
    const timer = setInterval(() => {
        tries += 1;
        try {
            const success = installer();
            if (success || tries >= maxTries) {
                clearInterval(timer);
                if (tries >= maxTries && !success && onExhausted) onExhausted();
            }
        } catch (e) {
            console.warn('[boot-runtime] Hook install error (retry):', e);
            if (tries >= maxTries) {
                clearInterval(timer);
                if (onExhausted) onExhausted();
            }
        }
    }, intervalMs);

    if (typeof window.addEventListener === 'function') {
        const runOnce = () => {
            try {
                installer();
            } catch (e) {}
        };
        window.addEventListener('load', runOnce, { once: true });
        window.addEventListener('focus', runOnce, { once: true });
    }
}

retryInstallLateHook(installHistoryDoQueryWrapper, {
    onExhausted: function () {
        console.warn('[boot-runtime] history compare hook install timed out');
    }
});

retryInstallLateHook(installDataManagerSqlHooks, {
    onExhausted: function () {
        console.warn('[boot-runtime] data manager SQL hook install timed out');
    }
});
