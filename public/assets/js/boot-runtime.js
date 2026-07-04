var DIRECT_SUPABASE_URL = String(window.PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '');
var DIRECT_SUPABASE_KEY = String(window.PUBLIC_SUPABASE_KEY || '').trim();
var DIRECT_EDGE_GATEWAY_URL = DIRECT_SUPABASE_URL ? DIRECT_SUPABASE_URL + '/functions/v1/edu-gateway-v2' : '';
var DIRECT_PROXY_ORIGIN = 'https://schoolsystem.com.cn';
var DIRECT_CLOUDFLARE_GATEWAY_URL = 'https://schoolsystem.com.cn/api/edu-gateway';
var BOOT_ASSET_VERSION_FALLBACK = 'runtime-15149e2b181b';

var COHORT_DB = window.COHORT_DB || null;
var CURRENT_COHORT_ID = String(window.CURRENT_COHORT_ID || window.localStorage?.getItem('CURRENT_COHORT_ID') || '').trim();
var CURRENT_COHORT_META = window.CURRENT_COHORT_META || null;
var CURRENT_EXAM_ID = String(window.CURRENT_EXAM_ID || window.localStorage?.getItem('CURRENT_EXAM_ID') || '').trim();
window.COHORT_DB = COHORT_DB;
window.CURRENT_COHORT_ID = CURRENT_COHORT_ID;
window.CURRENT_COHORT_META = CURRENT_COHORT_META;
window.CURRENT_EXAM_ID = CURRENT_EXAM_ID;

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

function isDesktopShellRuntime() {
return !!(window.DesktopShell && window.DesktopShell.isDesktopApp === true);
}

function applyDesktopShellBootDefaults() {
if (!isDesktopShellRuntime()) return;
try {
    window.__SCHOOL_DESKTOP_BOOT__ = true;
    if (!localStorage.getItem('SYSTEM_LOAD_PROFILE')) localStorage.setItem('SYSTEM_LOAD_PROFILE', 'full');
    localStorage.setItem('SCHOOL_RUNTIME_HOTSPOT_HYDRATE', 'true');
    localStorage.setItem('SYSTEM_APP_PRELOAD_LIMIT', localStorage.getItem('SYSTEM_APP_PRELOAD_LIMIT') || '36');
    localStorage.setItem('SYSTEM_APP_LATE_PREFETCH_LIMIT', localStorage.getItem('SYSTEM_APP_LATE_PREFETCH_LIMIT') || '48');
    localStorage.setItem('SYSTEM_APP_PREFETCH_CHUNK_SIZE', localStorage.getItem('SYSTEM_APP_PREFETCH_CHUNK_SIZE') || '8');
    if (typeof window.DesktopShell.warmCloud === 'function') {
        Promise.resolve(window.DesktopShell.warmCloud()).catch(() => {});
    }
} catch (_) {}
}

applyDesktopShellBootDefaults();

document.addEventListener('DOMContentLoaded', function () {
if (typeof initMacroAnomalyConfigUI === 'function') initMacroAnomalyConfigUI();
applyDesktopShellBootDefaults();
scheduleLoginPrefetch();
scheduleAppModuleWarmup();
});

var BOOT_JS_BASE='./assets/js/';
var BOOT_VENDOR_BASE='./assets/vendor/';
var BOOT_VENDOR_MODULES = [BOOT_VENDOR_BASE + 'alpinejs/cdn.min.js'];
var DEFERRED_APP_MODULES = [
'support-metrics-runtime.js',
'marginal-push-runtime.js',
'seat-adjustment-runtime.js',
'cohort-growth-runtime.js',
'macro-analysis-compat-runtime.js',
'compare-cloud-context-runtime.js',
'compare-exam-sync-runtime.js',
'report-compare-runtime.js',
'compare-selectors-runtime.js',
'town-submodule-compare-state-runtime.js'
].map(bootJs);

function bootJs(name) { return BOOT_JS_BASE + name; }
var APP_MODULES = [
'dialog-runtime.js',
'auth-state-runtime.js',
'login-entry-runtime.js',
'edge-gateway-runtime.js',
'teaching-assessment-sync-runtime.js',
'workspace-state-runtime.js',
'exam-state-runtime.js',
'school-state-runtime.js',
'teacher-state-runtime.js',
'data-state-runtime.js',
'support-state-runtime.js',
'progress-state-runtime.js',
'report-session-state-runtime.js',
'report-performance-runtime.js',
'compare-session-state-runtime.js',
'compare-result-state-runtime.js',
'compare-summary-state-runtime.js',
'school-normalization-runtime.js',
'cloud-api-runtime.js',
'cloud-connection-runtime.js',
'cloud-data-service-runtime.js',
'cloud.js',
'system-performance-runtime.js',
'cloud-workspace-runtime.js',
'data-cloud-runtime.js',
'issue-manager-runtime.js',
'help-system-runtime.js',
'logger-runtime.js',
'account-manager-runtime.js',
'login-session-runtime.js',
'data-manager-teacher-runtime.js',
'data-manager-student-runtime.js',
'data-manager-archive-runtime.js',
'data-manager-grade9-template-runtime.js',
'data-manager-params-runtime.js',
'data-manager-targets-runtime.js',
'data-manager-school-alias-runtime.js',
'data-manager-save-sync-runtime.js',
'data-manager-history-runtime.js',
'data-manager-tab-runtime.js',
'config-transfer-runtime.js',
'data-quality-runtime.js',
'shell-runtime.js',
'workflow-insight-runtime.js',
'workspace-rail-runtime.js',
'virtual-table-runtime.js',
'module-entry-runtime.js',
'comparison-panel-collapse-runtime.js',
'ranking-data-service-runtime.js',
'compare-shared-runtime.js',
'analytics-kernel-runtime.js',
'student-jump-runtime.js',
'student-details-guard-runtime.js',
'teaching-management-modules-runtime.js',
'app-foundation-runtime.js',
'permission-policy-runtime.js',
'teacher-card-store-runtime.js',
'ui-actions-runtime.js',
'runtime-accessors-runtime.js',
'teacher-visibility-runtime.js',
'skin-settings-runtime.js',
'starter-status-runtime.js',
'teacher-sync-runtime.js',
'management-facades-runtime.js',
'cohort-exam-hydration-runtime.js',
'auth-login-runtime.js',
'data-manager-core-runtime.js',
'student-details-render-runtime.js',
'comparison-render-runtime.js',
'snapshot-system-runtime.js',
'app.js',
'cohort-exam-meta-runtime.js',
'cohort-db-core-runtime.js',
].map(bootJs);

var APP_MODULE_PRELOAD_LIMIT = 36;
var APP_MODULE_MOBILE_PRELOAD_LIMIT = 4;
var APP_MODULE_LATE_PREFETCH_LIMIT = 34;
var APP_MODULE_PREFETCH_CHUNK_SIZE = 8;
var APP_MODULE_DESKTOP_BATCH_SIZE = 18;
var APP_MODULE_MOBILE_BATCH_SIZE = 18;
var LOGIN_MODULE_PREFETCH_LIMIT = 8;
var LOGIN_MODULE_PREFETCH_DELAY_MS = 2200;

window.__BOOT_SCRIPT_REGISTRY__ = window.__BOOT_SCRIPT_REGISTRY__ || {};
if (window.ReportInsightRuntime) {
window.__BOOT_SCRIPT_REGISTRY__['assets/js/report-insight-runtime.js'] = 'loaded';
}
if (window.__REPORT_RENDER_RUNTIME_PATCHED__) {
window.__BOOT_SCRIPT_REGISTRY__['assets/js/report-render-runtime.js'] = 'loaded';
}
if (window.__TOWN_SUBMODULE_COMPARE_RUNTIME_PATCHED__) {
window.__BOOT_SCRIPT_REGISTRY__['assets/js/town-submodule-compare-runtime.js'] = 'loaded';
}

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

function shouldPrefetchLoginModules() {
return shouldPrefetchLateAppCoreModules();
}

function getLoginModulePrefetchLimit() {
try {
    const stored = Number(localStorage.getItem('SYSTEM_LOGIN_PREFETCH_LIMIT') || 0);
    if (Number.isFinite(stored) && stored >= 0) return Math.floor(stored);
} catch (_) {}
return LOGIN_MODULE_PREFETCH_LIMIT;
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

function scheduleLoginPrefetch() {
if (window.__LOGIN_PREFETCH__) return;
window.__LOGIN_PREFETCH__ = true;
scheduleIdleBootTask(() => {
    if (window.__APP_MODULES_LOADED__) return;
    if (!shouldPrefetchLoginModules()) return;
    const limit = Math.min(getLoginModulePrefetchLimit(), 12, APP_MODULES.length);
    if (limit <= 0) return;
    const firstBatchLimit = Math.min(LOGIN_MODULE_PREFETCH_LIMIT, limit);
    prefetchAppModuleList(APP_MODULES.slice(0, firstBatchLimit), 'lh');
    if (limit <= firstBatchLimit) return;
    scheduleIdleBootTask(() => {
        if (window.__APP_MODULES_LOADED__) return;
        prefetchAppModuleList(APP_MODULES.slice(firstBatchLimit, limit), 'lh2');
    }, LOGIN_MODULE_PREFETCH_DELAY_MS);
}, LOGIN_MODULE_PREFETCH_DELAY_MS);
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
if (isRuntimeMobileViewport()) return moduleSrc.includes('app.js') || moduleSrc.includes('auth-state') ? 20000 : 15000;
return moduleSrc.includes('app.js') || moduleSrc.includes('auth-state') ? 15000 : 8000;
}

function getBootScriptBatchSize() {
try {
    const stored = Number(localStorage.getItem('SYSTEM_BOOT_BATCH_SIZE') || 0);
    if (Number.isFinite(stored) && stored > 0) return Math.max(1, Math.floor(stored));
} catch (_) {}
try {
    if (getRuntimeLoadProfile() === 'lazy') return 4;
    if (isRuntimeMobileViewport()) return APP_MODULE_MOBILE_BATCH_SIZE;
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
const runtimeWarmupPromise = window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.warmup === 'function'
    ? window.SystemRuntimeLoader.warmup()
    : Promise.resolve();
const deferredModulesPromise = DEFERRED_APP_MODULES.length && typeof loadOptionalRuntimeBundle === 'function'
    ? loadOptionalRuntimeBundle('deferred-app-modules', DEFERRED_APP_MODULES.map((src, index) => ({
        key: `deferred-app-module-${index}`,
        src
    })))
    : Promise.resolve();
return Promise.all([runtimeWarmupPromise, deferredModulesPromise]).then((result) => {
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
        }, 1500);

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

function getDefaultCloudBaseUrl() {
if (isLocalFileRuntime()) {
    var hostedOrigin = getHostedSupabaseProxyOrigin();
    return DIRECT_SUPABASE_URL || (hostedOrigin ? hostedOrigin + '/sb' : '');
}
return shouldUseCloudProxy() ? getSameOriginSupabaseUrl() : DIRECT_SUPABASE_URL;
}

function getSameOriginGatewayUrl() {
if (window.__API_FALLBACK_ACTIVE__ && DIRECT_EDGE_GATEWAY_URL) {
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
    var hostedOrigin = getHostedSupabaseProxyOrigin();
    return DIRECT_SUPABASE_URL
        ? normalizeProxyOrigin(DIRECT_SUPABASE_URL) + '/rest/v1'
        : (hostedOrigin ? hostedOrigin + '/sb/rest/v1' : '');
}
if (window.__API_FALLBACK_ACTIVE__ && DIRECT_SUPABASE_URL) {
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
    return DIRECT_SUPABASE_URL ? normalizeProxyOrigin(DIRECT_SUPABASE_URL) + '/rest/v1' : '';
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

                    if ((response.status >= 500 || response.status === 404) && !window.__API_FALLBACK_ACTIVE__) {
                        console.warn('[boot-runtime] Proxy fallback', response.status);
                        window.__API_FALLBACK_ACTIVE__ = true;
                    }

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
                    console.warn('[boot-runtime] Network fallback', error);
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
window.CLOUD_REST_URL = getBootStorageValue('CLOUD_REST_URL') || getBootStorageValue('SUPABASE_URL') || getDefaultCloudBaseUrl();
window.CLOUD_API_KEY = getBootStorageValue('CLOUD_API_KEY') || getBootStorageValue('SUPABASE_KEY') || DIRECT_SUPABASE_KEY;
window.SUPABASE_URL = getBootStorageValue('SUPABASE_URL') || window.CLOUD_REST_URL;
window.SUPABASE_KEY = getBootStorageValue('SUPABASE_KEY') || window.CLOUD_API_KEY;
window.EDGE_GATEWAY_URL = getSameOriginGatewayUrl();
window.SYSTEM_DATA_API_URL = getBootStorageValue('SYSTEM_DATA_API_URL')
    || (isLocalFileRuntime() ? `${DIRECT_PROXY_ORIGIN}/api/system-data` : (window.SYSTEM_DATA_API_URL || ''));
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
const BOOT_LOGIN_GRADUATE_TARGET_KEY = 'LOGIN_GRADUATE_COHORT_TARGET_V1';
const BOOT_GATEWAY_REQUEST = createSupabaseFetchWithTimeout(12000);
function getBootAcademicYear(now = new Date()) {
    return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}
function getBootCurrentGrade9CohortYear(now = new Date()) {
    return String(getBootAcademicYear(now) - 3);
}
function getBootLoginCohortYears(now = new Date()) {
    const grade9CohortYear = Number(getBootCurrentGrade9CohortYear(now));
    const years = [];
    for (let offset = 0; offset < 5; offset += 1) years.push(String(grade9CohortYear + offset));
    return years;
}
function getBootGraduatedCohortYears(now = new Date()) {
    const grade9CohortYear = Number(getBootCurrentGrade9CohortYear(now));
    const years = new Set();
    for (let offset = 1; offset <= 6; offset += 1) {
        const year = grade9CohortYear - offset;
        if (year >= 2000) years.add(String(year));
    }
    try {
        const stored = JSON.parse(localStorage.getItem('COHORT_LIST') || '[]');
        (Array.isArray(stored) ? stored : []).forEach((item) => {
            const id = String(item?.id || item?.year || '').match(/\d{4}/)?.[0] || '';
            if (id && Number(id) < grade9CohortYear) years.add(id);
        });
    } catch (error) { }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
}
function readBootGraduateCohortTarget() {
    try {
        const value = sessionStorage.getItem(BOOT_LOGIN_GRADUATE_TARGET_KEY) || '';
        return /^\d{4}$/.test(value) ? value : '';
    } catch (error) {
        return '';
    }
}
function writeBootGraduateCohortTarget(year) {
    const value = String(year || '').trim();
    try {
        if (/^\d{4}$/.test(value)) sessionStorage.setItem(BOOT_LOGIN_GRADUATE_TARGET_KEY, value);
        else sessionStorage.removeItem(BOOT_LOGIN_GRADUATE_TARGET_KEY);
    } catch (error) { }
    return /^\d{4}$/.test(value) ? value : '';
}
function getBootSelectedLoginCohortYear() {
    return readBootGraduateCohortTarget()
        || String(document.getElementById('login-cohort-select')?.value || '').trim();
}
function syncBootGraduateCohortPanel(portal) {
    const panel = document.getElementById('login-graduate-cohort-panel');
    const select = document.getElementById('login-graduate-cohort-select');
    if (!panel || !select) return '';
    const years = getBootGraduatedCohortYears();
    const shouldShow = portal !== 'parent' && years.length > 0;
    panel.hidden = !shouldShow;
    panel.style.display = shouldShow ? '' : 'none';
    panel.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    if (!shouldShow) {
        writeBootGraduateCohortTarget('');
        return '';
    }
    const signature = years.join('|');
    if (select.dataset.cohortYears !== signature) {
        select.innerHTML = years.map((year) => `<option value="${year}">${year}届 · 已毕业</option>`).join('');
        select.dataset.cohortYears = signature;
    }
    const target = readBootGraduateCohortTarget();
    if (target && years.includes(target)) {
        select.value = target;
        panel.classList.add('is-selected');
    } else {
        panel.classList.remove('is-selected');
    }
    return select.value || '';
}
function bindBootGraduateCohortPanel() {
    const button = document.getElementById('login-graduate-cohort-button');
    const select = document.getElementById('login-graduate-cohort-select');
    const helper = document.getElementById('login-graduate-cohort-helper');
    const activeSelect = document.getElementById('login-cohort-select');
    if (activeSelect && activeSelect.dataset.graduateResetBound !== '1') {
        activeSelect.dataset.graduateResetBound = '1';
        activeSelect.addEventListener('change', () => {
            writeBootGraduateCohortTarget('');
            document.getElementById('login-graduate-cohort-panel')?.classList.remove('is-selected');
        });
    }
    if (!button || button.dataset.graduateBound === '1') return;
    button.dataset.graduateBound = '1';
    button.addEventListener('click', () => {
        const year = writeBootGraduateCohortTarget(select?.value || '');
        document.getElementById('login-graduate-cohort-panel')?.classList.toggle('is-selected', !!year);
        if (helper) helper.textContent = year ? `已选择 ${year}届毕业生档案，登录后进入该届成绩。` : '请选择毕业届。';
        if (year) setBootHelperMessage(`已选择 ${year}届毕业生成绩档案，请完成登录。`, 'info');
    });
}
function syncBootLoginCohortSelect(portal) {
    const select = document.getElementById('login-cohort-select');
    const group = document.getElementById('login-cohort-group');
    if (!select) return '';
    const years = getBootLoginCohortYears();
    const defaultYear = getBootCurrentGrade9CohortYear();
    const preserveSelection = select.dataset.cohortInitialized === '1' && years.includes(select.value);
    const selected = preserveSelection ? select.value : defaultYear;
    const html = years.map((year) => `<option value="${year}">${year}届</option>`).join('');
    if (select.dataset.cohortYears !== years.join('|')) {
        select.innerHTML = html;
        select.dataset.cohortYears = years.join('|');
    }
    select.value = selected;
    select.dataset.cohortInitialized = '1';
    if (group) {
        group.style.display = portal === 'parent' ? 'none' : '';
        group.setAttribute('aria-hidden', portal === 'parent' ? 'true' : 'false');
    }
    bindBootGraduateCohortPanel();
    syncBootGraduateCohortPanel(portal);
    return selected;
}
async function enterSelectedBootCohort(year) {
    const selectedYear = String(year || getBootSelectedLoginCohortYear() || '').trim();
    if (!selectedYear) return false;
    writeBootGraduateCohortTarget('');
    const yearInput = document.getElementById('entry-cohort-year');
    if (yearInput) yearInput.value = selectedYear;
    if (typeof window.enterCohortFromMask === 'function') {
        await window.enterCohortFromMask();
        return true;
    }
    return false;
}
window.BootCohortLifecycle = {
    getAcademicYear: getBootAcademicYear,
    getCurrentGrade9CohortYear: getBootCurrentGrade9CohortYear,
    getLoginCohortYears: getBootLoginCohortYears,
    getGraduatedCohortYears: getBootGraduatedCohortYears,
    getSelectedLoginCohortYear: getBootSelectedLoginCohortYear,
    clearGraduateTarget: () => writeBootGraduateCohortTarget('')
};
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
            pushCandidate(window.DIRECT_CLOUDFLARE_GATEWAY_URL);
            pushCandidate(DIRECT_EDGE_GATEWAY_URL);
            return candidates;
        }
        pushCandidate(this.resolvedGatewayUrl);
        pushCandidate(window.DIRECT_CLOUDFLARE_GATEWAY_URL);
        pushCandidate(DIRECT_EDGE_GATEWAY_URL);
        pushCandidate(window.EDGE_GATEWAY_URL);
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
    getClientDeviceInfo() {
        const nav = typeof navigator !== 'undefined' ? navigator : {};
        const screenObj = typeof screen !== 'undefined' ? screen : {};
        const ua = String(nav.userAgent || '');
        const browser = /Edg\//.test(ua) ? 'Microsoft Edge'
            : /Chrome\//.test(ua) ? 'Chrome'
            : /Firefox\//.test(ua) ? 'Firefox'
            : /Safari\//.test(ua) ? 'Safari'
            : 'Browser';
        const os = /Windows/i.test(ua) ? 'Windows'
            : /Mac OS X/i.test(ua) ? 'macOS'
            : /Android/i.test(ua) ? 'Android'
            : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
            : String(nav.platform || 'Unknown');
        const screenText = screenObj.width && screenObj.height ? `${screenObj.width}x${screenObj.height}` : '';
        return {
            device_label: `${browser} / ${os}${screenText ? ` / ${screenText}` : ''}`,
            device_type: /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop',
            browser,
            os,
            platform: String(nav.platform || ''),
            language: String(nav.language || ''),
            timezone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '',
            screen: screenText,
            user_agent: ua
        };
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
                        console.error('[boot-runtime] file:// blocks direct API; use npm run dev.');
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
            class_name: className || '',
            device: this.getClientDeviceInfo()
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

function readBootSessionToken() {
    try {
        return String(
            sessionStorage.getItem('EDGE_GATEWAY_TOKEN_V1')
            || sessionStorage.getItem('edu:session:token')
            || ''
        ).trim();
    } catch (error) {
        return '';
    }
}

function hasBootAuthenticatedSession() {
    const user = readBootSessionUser() || (window.Auth && window.Auth.currentUser) || null;
    return !!(user && readBootSessionToken());
}

function clearStaleBootSession() {
    if (hasBootAuthenticatedSession()) return false;
    try {
        sessionStorage.removeItem('CURRENT_USER');
        sessionStorage.removeItem('CURRENT_ROLE');
        sessionStorage.removeItem('CURRENT_ROLES');
    } catch (error) { }
    if (window.Auth && window.Auth.currentUser) {
        try { window.Auth.currentUser = null; } catch (error) { }
    }
    return true;
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
    const transition = document.getElementById('login-entry-transition');
    const busy = !!options.busy;
    if (button) {
        button.disabled = busy;
        button.dataset.bootBusy = busy ? '1' : '0';
        button.setAttribute('aria-busy', busy ? 'true' : 'false');
        if (options.text) button.textContent = options.text;
    }
    if (transition) {
        const title = transition.querySelector('[data-login-transition-title]');
        const copy = transition.querySelector('[data-login-transition-copy]');
        transition.classList.toggle('is-visible', busy);
        transition.setAttribute('aria-hidden', busy ? 'false' : 'true');
        if (title && (options.title || options.text)) title.textContent = options.title || options.text;
        if (copy && options.copy) copy.textContent = options.copy;
    }
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
    const shouldShowLogin = !!visible || !hasBootAuthenticatedSession();
    if (shouldShowLogin) clearStaleBootSession();

    document.body.classList.toggle('login-overlay-active', shouldShowLogin);
    document.body.dataset.authState = shouldShowLogin ? 'logged_out' : 'logged_in';

    if (overlay) {
        overlay.style.display = shouldShowLogin ? 'flex' : 'none';
        overlay.style.visibility = shouldShowLogin ? 'visible' : 'hidden';
        overlay.style.opacity = shouldShowLogin ? '1' : '0';
        overlay.style.pointerEvents = shouldShowLogin ? 'auto' : 'none';
        overlay.setAttribute('aria-hidden', shouldShowLogin ? 'false' : 'true');
    }
    if (loader && !shouldShowLogin) {
        loader.classList.add('hidden');
        setTimeout(() => { if (loader.classList.contains('hidden')) loader.style.display = 'none'; }, 300);
    }
    if (app) {
        app.classList.toggle('hidden', shouldShowLogin);
        app.setAttribute('aria-hidden', shouldShowLogin ? 'true' : 'false');
    }
}

function finalizeBootLoginUi(portal = 'school') {
    if (window.Auth && typeof window.Auth.syncLoginOverlayState === 'function') window.Auth.syncLoginOverlayState(false);
    else syncBootLoginOverlayState(false);
    setBootSubmitState({ busy: false, text: getPortalConfig(portal).submit });
    repairAuthenticatedShellVisibility();
    [250,1000,3000,1e4,3e4].forEach((delay) => window.setTimeout(repairAuthenticatedShellVisibility, delay));
    startAuthenticatedShellRepairWindow();
    window.setTimeout(() => {
        try { window.ensureMobileManagerRuntimeLoaded?.(); } catch (_) {}
        try { window.MobileQueryUI?.refresh?.(); } catch (_) {}
    }, 0);
}

function repairAuthenticatedShellVisibility() {
    if (!hasBootAuthenticatedSession()) {
        clearStaleBootSession();
        syncBootLoginOverlayState(true);
        return false;
    }
    const overlay = document.getElementById('login-overlay');
    const app = document.getElementById('app');
    document.body.classList.remove('login-overlay-active');
    document.body.dataset.authState = 'logged_in';
    if (overlay) {
        overlay.style.setProperty('display', 'none', 'important');
        overlay.setAttribute('aria-hidden', 'true');
    }
    if (app) {
        app.classList.remove('hidden');
        app.style.setProperty('display', 'flex', 'important');
        app.setAttribute('aria-hidden', 'false');
    }
    return true;
}

function startAuthenticatedShellRepairWindow() {
    if (window.__AUTH_SHELL_REPAIR_INTERVAL__) return;
    const startedAt = Date.now();
    window.__AUTH_SHELL_REPAIR_INTERVAL__ = window.setInterval(() => {
        if (Date.now() - startedAt > 120000) {
            window.clearInterval(window.__AUTH_SHELL_REPAIR_INTERVAL__);
            window.__AUTH_SHELL_REPAIR_INTERVAL__ = 0;
            return;
        }
        repairAuthenticatedShellVisibility();
    }, 1000);
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
        syncBootLoginCohortSelect(nextPortal);
        if (!this.__bootLoginBusy) {
            setBootHelperMessage(config.helper, 'info');
            setBootSubmitState({ busy: false, text: config.submit });
        }
    },
    init() {
        this.syncLoginPortalUI(this.getLoginPortal());
        if (!hasBootAuthenticatedSession()) {
            clearStaleBootSession();
            this.syncLoginOverlayState(true);
        } else {
            bootDebugLog('[boot-auth] User already logged in, bypassing overlay and loading modules');
            this.syncLoginOverlayState(false);
            loadAppModules();
        }
    },
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
        if (portal === 'school') syncBootLoginCohortSelect(portal);
        const cohortYear = portal === 'school' ? getBootSelectedLoginCohortYear() : '';

        if (!user || !pass) {
            setBootHelperMessage('请输入账号和密码。', 'error');
            return;
        }
        if (portal === 'parent' && !className) {
            setBootHelperMessage('家长端请输入学生班级。', 'error');
            return;
        }

        this.__bootLoginBusy = true;
        window.__BOOT_LOGIN_SUBMIT_LOCK__ = true;
        setBootSubmitState({
            busy: true,
            text: '正在验证身份...',
            title: '正在进入学校工作台',
            copy: '正在验证身份并准备载入数据模块，请稍候。'
        });

        try {
            const result = await bootGateway.login(user, pass, className);

            if (result && result.user) {
                const matchedUser = result.user;
                writeBootSessionUser(matchedUser);
                setBootHelperMessage('身份验证成功，正在载入工作台。', 'success');
                setBootSubmitState({
                    busy: true,
                    text: '正在载入工作台...',
                    title: '正在载入学校工作台',
                    copy: '正在同步菜单、权限和当前届别数据。'
                });
                const loader = document.getElementById('global-loader');
                if (loader) {
                    loader.style.opacity = '0';
                    loader.style.display = 'none';
                    loader.classList.add('hidden');
                }
                finalizeBootLoginUi(portal);
                window.__BOOT_BACKGROUND_HYDRATING__ = true;
                Promise.resolve()
                    .then(() => loadAppModules())
                    .then(() => {
                        finalizeBootLoginUi(portal);
                        if (portal !== 'school' || !cohortYear) return null;
                        return Promise.resolve()
                            .then(() => {
                                if (typeof window.waitForAuthReady === 'function') return window.waitForAuthReady(3500);
                                return null;
                            })
                            .catch(() => null)
                            .then(() => enterSelectedBootCohort(cohortYear));
                    })
                    .catch((error) => console.warn('[boot-auth] background module/cohort restore failed:', error))
                    .finally(() => {
                        if (loader) {
                            loader.style.opacity = '0';
                            setTimeout(() => {
                                loader.style.display = 'none';
                                loader.classList.add('hidden');
                            }, 300);
                        }
                        window.__BOOT_BACKGROUND_HYDRATING__ = false;
                    });
            } else {
                setBootHelperMessage('验证失败：' + (result?.error || '账号密码错误'), 'error');
                setBootSubmitState({ busy: false, text: getPortalConfig(portal).submit });
            }
        } catch (error) {
            setBootHelperMessage('验证失败：' + (error.message || '网络连接异常'), 'error');
            setBootSubmitState({ busy: false, text: getPortalConfig(portal).submit });
        } finally {
            this.__bootLoginBusy = false;
            window.__BOOT_LOGIN_SUBMIT_LOCK__ = false;
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
    window.__BOOT_LOGIN_CLICKED__ = false;
    if (window.__BOOT_LOGIN_SUBMIT_LOCK__) return;
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
    if (window.__BOOT_LOGIN_CLICKED__) {
        window.__BOOT_LOGIN_CLICKED__ = false;
        setTimeout(submitBootLogin);
    }
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
