// Runtime skill manifest and optional loader helpers are split from boot-runtime.js
// so the boot path can stay focused on login, gateway setup, and core app modules.
var BOOT_JS_BASE = window.BOOT_JS_BASE || './assets/js/';
var BOOT_VENDOR_BASE = window.BOOT_VENDOR_BASE || './assets/vendor/';
function bootJs(name) { return BOOT_JS_BASE + name; }
function bootVend(name) { return BOOT_VENDOR_BASE + name; }

function bootEntry(key, src) { return { key, src }; }
function bootSkill(mode, warmup, triggers, entries) { return { mode, warmup, triggers, entries }; }

var SYSTEM_RUNTIME_SKILLS = {
'crypto-vendor': bootSkill('demand', 'demand', ['CryptoJS', 'freshman-simulator', 'inquiry-package'], [
    bootEntry('crypto-vendor', bootVend('crypto-js/crypto-js.min.js'))
]),
'shell-polish': bootSkill('idle', 'demand', ['shell-polish', 'refreshShellEnhancements'], [
    bootEntry('shell-polish', bootJs('shell-polish-runtime.js'))
]),
'sweetalert-vendor': bootSkill('idle', 'demand', ['Swal', 'uiAlert', 'modal-alert'], [
    bootEntry('sweetalert-vendor', bootVend('sweetalert2/sweetalert2.all.min.js'))
]),
'chart-vendor': bootSkill('demand', 'demand', ['Chart', 'chart-render'], [
    bootEntry('chart-vendor', bootVend('chart.js/chart.umd.min.js'))
]),
'shell-enhancements': bootSkill('idle', 'demand', ['app-shell', 'hover-tooltips', 'scroll-effects'], [
    bootEntry('gsap-vendor', bootVend('gsap/gsap.min.js')),
    bootEntry('scroll-trigger-vendor', bootVend('gsap/ScrollTrigger.min.js')),
    bootEntry('popper-vendor', bootVend('popperjs/popper.min.js')),
    bootEntry('tippy-vendor', bootVend('tippyjs/tippy.umd.min.js')),
    bootEntry('simplebar-vendor', bootVend('simplebar/simplebar.min.js'))
]),
'pdf-export': bootSkill('demand', 'full', ['downloadSingleReportPDF', 'batchGeneratePDF'], [
    bootEntry('jspdf-vendor', bootVend('jspdf/jspdf.umd.min.js')),
    bootEntry('html2canvas-vendor', bootVend('html2canvas/html2canvas.min.js'))
]),
'report-render': bootSkill('demand', 'demand', ['report-generator', 'renderSingleReportCardHTML'], [
    bootEntry('compare-cloud-context', bootJs('compare-cloud-context-runtime.js')),
    bootEntry('report-insight', bootJs('report-insight-runtime.js')),
    bootEntry('report-render', bootJs('report-render-runtime.js'))
]),
'report-chart': bootSkill('demand', 'demand', ['renderRadarChart', 'renderVarianceChart', 'analyzeStrengthsAndWeaknesses'], [
    bootEntry('chart-vendor', bootVend('chart.js/chart.umd.min.js')),
    bootEntry('report-chart', bootJs('report-chart-runtime.js'))
]),
'report-export': bootSkill('demand', 'demand', ['printSingleReport', 'copyReport'], [
    bootEntry('report-export', bootJs('report-export-runtime.js'))
]),
'teacher-analysis': bootSkill('demand', 'demand', ['teacher-analysis'], [
    bootEntry('teacher-analysis-core', bootJs('teacher-analysis-core-runtime.js')),
    bootEntry('teacher-pairing', bootJs('teacher-pairing-runtime.js')),
    bootEntry('teacher-analysis-ui', bootJs('teacher-analysis-ui-runtime.js')),
    bootEntry('teacher-analysis-bridge', bootJs('teacher-analysis-bridge-runtime.js')),
    bootEntry('teacher-analysis-main', bootJs('teacher-analysis-main-runtime.js')),
    bootEntry('teaching-assessment-sync', bootJs('teaching-assessment-sync-runtime.js'))
]),
'cohort-growth': bootSkill('demand', 'balanced', ['cohort-growth'], [
    bootEntry('cohort-growth', bootJs('cohort-growth-runtime.js'))
]),
    'teacher-correlation': bootSkill('demand', 'demand', ['correlation-analysis', 'renderCorrelationAnalysis', 'updateCorrelationSchoolSelect'], [
        bootEntry('teacher-analysis-bridge', bootJs('teacher-analysis-bridge-runtime.js'))
    ]),
'student-overview': bootSkill('demand', 'demand', ['student-overview'], [
    bootEntry('student-overview', bootJs('student-overview-runtime.js'))
]),
'teaching-management': bootSkill('demand', 'full', ['teaching-overview', 'teaching-issue-board', 'teaching-warning-center', 'teaching-rectify-center', 'teaching-version-center'], [
    bootEntry('teaching-management', bootJs('teaching-management-runtime.js')),
    bootEntry('teaching-management-cloud', bootJs('teaching-management-cloud-runtime.js')),
    bootEntry('teaching-management-overview', bootJs('teaching-management-overview-runtime.js')),
    bootEntry('teaching-assessment-sync', bootJs('teaching-assessment-sync-runtime.js')),
    bootEntry('teaching-management-version', bootJs('teaching-management-version-runtime.js'))
]),
'student-compare': bootSkill('demand', 'demand', ['renderStudentMultiPeriodComparison', 'saveStudentCompareToCloud', 'viewCloudStudentCompares'], [
    bootEntry('student-compare-result', bootJs('student-compare-result-runtime.js')),
    bootEntry('student-compare-generate', bootJs('student-compare-generate-runtime.js')),
    bootEntry('student-compare-cloud', bootJs('student-compare-cloud-runtime.js'))
]),
'town-submodule-compare': bootSkill('demand', 'demand', ['summary', 'town-submodule-compare', 'renderTownSubmoduleMultiPeriodComparison'], [
    bootEntry('town-submodule-compare', bootJs('town-submodule-compare-runtime.js'))
]),
'teacher-compare': bootSkill('demand', 'full', ['renderTeacherMultiPeriodComparison'], [
    bootEntry('teacher-compare-result', bootJs('teacher-compare-result-runtime.js')),
    bootEntry('teacher-compare-cloud', bootJs('teacher-compare-cloud-runtime.js'))
]),
'macro-compare': bootSkill('demand', 'full', ['renderMacroMultiPeriodComparison'], [
    bootEntry('macro-compare-result', bootJs('macro-compare-result-runtime.js')),
    bootEntry('macro-compare-cloud', bootJs('macro-compare-cloud-runtime.js'))
]),
'school-profile': bootSkill('demand', 'demand', ['summary', 'showSchoolProfile'], [
    bootEntry('chart-vendor', bootVend('chart.js/chart.umd.min.js')),
    bootEntry('school-profile', bootJs('school-profile-runtime.js'))
]),
'county-analysis': bootSkill('demand', 'demand', ['county-analysis', 'county-teacher-portrait', 'county-school-horizontal'], [
    bootEntry('county-school-horizontal', bootJs('county-school-horizontal-runtime.js')),
    bootEntry('county-analysis', bootJs('county-analysis-runtime.js'))
]),
'macro-analysis-compat': bootSkill('demand', 'demand', ['analysis', 'renderHorizontalTable', 'exportHorizontalExcel', 'exportMacroTables'], [
    bootEntry('macro-analysis-compat', bootJs('macro-analysis-compat-runtime.js'))
]),
'progress-analysis': bootSkill('demand', 'full', ['progress-analysis'], [
    bootEntry('progress-analysis', bootJs('progress-analysis-runtime.js'))
]),
'data-manager-sql': bootSkill('demand', 'full', ['data-manager-sql', 'talkToData'], [
    bootEntry('data-manager-sql', bootJs('data-manager-sql.js'))
]),
'assessment-roster': bootSkill('demand', 'full', ['assessment-roster', 'AssessmentRoster'], [
    bootEntry('teaching-assessment-sync', bootJs('teaching-assessment-sync-runtime.js')),
    bootEntry('assessment-roster', bootJs('assessment-roster-runtime.js'))
]),
'mobile-manager': bootSkill('conditional', 'mobile', ['mobile-layout'], [
    bootEntry('mobile-manager', bootJs('mobile-app-runtime.js'))
]),
'account-admin': bootSkill('demand', 'full', ['account-admin', 'AccountExcel'], [
    bootEntry('account-admin', bootJs('account-admin-runtime.js'))
]),
'history-compare': bootSkill('demand', 'full', ['history-compare'], [
    bootEntry('chart-vendor', bootVend('chart.js/chart.umd.min.js')),
    bootEntry('history-compare', bootJs('history-compare-runtime.js'))
]),
'zhongkao-countdown': bootSkill('demand', 'demand', ['zhongkao-countdown'], [
    bootEntry('zhongkao-countdown', bootJs('zhongkao-countdown-runtime.js'))
]),
'freshman-exam': bootSkill('demand', 'demand', ['freshman-simulator', 'exam-arranger'], [
    bootEntry('freshman-exam', bootJs('freshman-exam-runtime.js'))
]),
'grade-scheduler': bootSkill('demand', 'demand', ['grade-scheduler'], [
    bootEntry('grade-scheduler', bootJs('grade-scheduler-runtime.js'))
]),
'voice-control': bootSkill('idle', 'demand', ['voice-control', 'voice-fab', 'VoiceControl.toggle'], [
    bootEntry('voice-control', bootJs('voice-control-runtime.js'))
]),
'module-help': bootSkill('demand', 'demand', ['showModuleHelp', 'ensureModuleHelpButton', 'module-help'], [
    bootEntry('module-help', bootJs('module-help-runtime.js'))
]),
'packager': bootSkill('demand', 'demand', ['exportDistributableHTML'], [
    bootEntry('packager', bootJs('packager-runtime.js'))
]),
'exam-analysis-package': bootSkill('demand', 'demand', ['downloadExamAnalysisPackage'], [
    bootEntry('jszip-vendor', bootVend('jszip/jszip.min.js')),
    bootEntry('xlsx-js-style-vendor', bootVend('xlsx-js-style/xlsx.min.js')),
    bootEntry('exam-analysis-package', bootJs('exam-analysis-package-runtime.js'))
]),
'worker-api': bootSkill('demand', 'demand', ['WorkerAPI.run'], [
    bootEntry('worker-api', bootJs('worker-api-runtime.js'))
])
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

function getRuntimeRetryCandidate(src) {
const value = String(src || '');
return `${value}${value.includes('?') ? '&' : '?'}runtime_retry=${Date.now()}`;
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

const readyValue = getOptionalRuntimeReadyValue(key);
if (readyValue) {
    window.__optionalRuntimeLoaders[key] = Promise.resolve(readyValue);
    return window.__optionalRuntimeLoaders[key];
}

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
            try {
                await injectOptionalRuntimeScript(key, getRuntimeRetryCandidate(candidate));
                return;
            } catch (retryError) {
                lastError = retryError;
            }
        }
    }
    throw lastError || new Error(`Failed to load runtime: ${src}`);
})().catch((error) => {
    delete window.__optionalRuntimeLoaders[key];
    throw error;
});
return window.__optionalRuntimeLoaders[key];
}

function getOptionalRuntimeReadyValue(key) {
switch (String(key || '').trim()) {
    case 'report-insight':
        return window.ReportInsightRuntime || null;
    case 'report-render':
        return window.__REPORT_RENDER_RUNTIME_PATCHED__ ? true : null;
    case 'town-submodule-compare':
        return window.__TOWN_SUBMODULE_COMPARE_RUNTIME_PATCHED__ ? true : null;
    case 'teacher-analysis-core':
        return window.__TEACHER_ANALYSIS_CORE_RUNTIME_PATCHED__ ? true : null;
    case 'teacher-pairing':
        return window.__TEACHER_PAIRING_RUNTIME_PATCHED__ ? true : null;
    case 'teacher-analysis-bridge':
        return window.__TEACHER_ANALYSIS_BRIDGE_RUNTIME_PATCHED__ ? true : null;
    case 'cohort-growth':
        return window.CohortGrowth || null;
    case 'chart-vendor':
        return window.Chart || null;
    case 'sweetalert-vendor':
        return getLoadedSweetAlertVendor();
    case 'crypto-vendor':
        return window.CryptoJS || null;
    case 'xlsx-vendor':
        return window.XLSX && window.XLSX.utils ? window.XLSX : null;
    default:
        return null;
}
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

function ensureOptionalGlobalRuntime(readValue, key, src, label) {
const current = readValue();
if (current) return Promise.resolve(current);
return loadOptionalRuntime(key, src).then(() => {
    const loaded = readValue();
    if (!loaded) throw new Error(`${label} runtime unavailable`);
    return loaded;
});
}

window.ensureCohortDbRuntime = function () {
const existing = window.CohortDB;
if (existing && typeof existing.ensure === 'function') return Promise.resolve(existing);

// CohortDB is the final core boot module. A cohort switch can be requested
// immediately after login while that ordered boot queue is still finishing.
// Waiting for that queue avoids injecting the same classic script a second
// time (which redeclares its top-level `const CohortDB` and blocks the first
// potential-analysis render).
const bootPromise = window.__APP_MODULES_LOAD_PROMISE__;
if (bootPromise && window.__APP_MODULES_LOADED__ === 'loading') {
    return Promise.resolve(bootPromise).catch(() => null).then(() => {
        const loaded = window.CohortDB;
        if (loaded && typeof loaded.ensure === 'function') return loaded;
        return ensureOptionalGlobalRuntime(
            () => window.CohortDB,
            'cohort-db-core',
            './assets/js/cohort-db-core-runtime.js',
            'CohortDB'
        );
    });
}

return ensureOptionalGlobalRuntime(() => window.CohortDB, 'cohort-db-core', './assets/js/cohort-db-core-runtime.js', 'CohortDB');
};

window.ensureCryptoJsVendorLoaded = function () {
return ensureOptionalGlobalRuntime(() => window.CryptoJS, 'crypto-vendor', './assets/vendor/crypto-js/crypto-js.min.js', 'CryptoJS');
};

window.ensureSweetAlertVendorLoaded = function () {
return ensureOptionalGlobalRuntime(getLoadedSweetAlertVendor, 'sweetalert-vendor', './assets/vendor/sweetalert2/sweetalert2.all.min.js', 'SweetAlert2');
};

window.ensureGsapVendorLoaded = function () {
return ensureOptionalGlobalRuntime(() => window.gsap, 'gsap-vendor', './assets/vendor/gsap/gsap.min.js', 'GSAP');
};

window.ensureChartVendorLoaded = function () {
return ensureOptionalGlobalRuntime(() => window.Chart, 'chart-vendor', './assets/vendor/chart.js/chart.umd.min.js', 'Chart');
};

window.ensureXlsxVendorLoaded = function () {
return ensureOptionalGlobalRuntime(() => window.XLSX && window.XLSX.utils && window.XLSX, 'xlsx-vendor', './assets/vendor/xlsx/xlsx.full.min.js', 'XLSX');
};

window.ensurePdfExportVendorsLoaded = function () {
return window.SystemRuntimeLoader.load('pdf-export');
};

window.ensureReportRenderRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('report-render');
};

window.ensureReportChartRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('report-chart');
};

window.ensureReportExportRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('report-export');
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

window.ensureStudentOverviewRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('student-overview');
};

window.ensureTeacherAnalysisMainRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('teacher-analysis');
};

window.ensureCohortGrowthRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('cohort-growth');
};

window.ensureTeacherCorrelationRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('teacher-correlation');
};

window.ensureCountyAnalysisRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('county-analysis');
};

window.ensureMacroAnalysisCompatRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('macro-analysis-compat');
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

window.ensureExamAnalysisPackageRuntimeLoaded = function () {
return window.SystemRuntimeLoader.load('exam-analysis-package');
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
'downloadExamAnalysisPackage',
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
installOptionalRuntimeMethod(name, window.ensureReportExportRuntimeLoaded);
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

['renderHorizontalTable', 'exportHorizontalExcel', 'exportMacroTables'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureMacroAnalysisCompatRuntimeLoaded);
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

['renderSingleReportCardHTML'].forEach((name) => {
installOptionalRuntimeMethod(name, window.ensureReportRenderRuntimeLoaded);
});

['renderRadarChart', 'renderVarianceChart', 'analyzeStrengthsAndWeaknesses'].forEach((name) => {
installOptionalRuntimeMethod(name, window.ensureReportChartRuntimeLoaded);
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
installOptionalRuntimeMethod('downloadExamAnalysisPackage', window.ensureExamAnalysisPackageRuntimeLoaded);
window.wrapXlsxRuntimeExports();

if (typeof window.ensureModuleHelpButton !== 'function') {
window.ensureModuleHelpButton = function (sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const titleEl = section.querySelector('.sec-head h2') || section.querySelector('.module-desc-bar h3');
    if (!titleEl || titleEl.querySelector('.module-help-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'module-help-btn';
    btn.innerHTML = '<i class="ti ti-info-circle"></i><span>口径说明</span>';
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

function scheduleDataManagerSqlIdleWarmup() {
if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) return;
if (window.__DATA_MANAGER_SQL_IDLE_WARMUP__) return;
window.__DATA_MANAGER_SQL_IDLE_WARMUP__ = true;
runAfterAppModulesReady(() => {
    const prefetch = () => {
        const skill = SYSTEM_RUNTIME_SKILLS['data-manager-sql'];
        if (skill && Array.isArray(skill.entries)) {
            prefetchAppModuleList(skill.entries.map((entry) => entry.src), 'data-manager-sql-prefetch');
        }
    };
    window.setTimeout(prefetch, 8000);
});
}

scheduleDataManagerSqlIdleWarmup();

function scheduleHotspotRuntimeWarmup() {
if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) return;
if (window.__HOTSPOT_RUNTIME_WARMUP_SCHEDULED__ || getRuntimeLoadProfile() === 'lazy' || isRuntimeMobileViewport()) return;
window.__HOTSPOT_RUNTIME_WARMUP_SCHEDULED__ = true;
const HOTSPOT_RUNTIME_HYDRATE_DELAY_MS = 2200;
const prioritySteps = [
{ label: 'report-render', loader: () => window.ensureReportRenderRuntimeLoaded?.() },
{ label: 'school-profile', loader: () => window.ensureSchoolProfileRuntimeLoaded?.() },
{ label: 'town-submodule-compare', loader: () => window.ensureTownSubmoduleCompareRuntimeLoaded?.() }
];
const deferredSteps = [];
const preload = () => {
prioritySteps.concat(deferredSteps).forEach((step) => {
const skill = SYSTEM_RUNTIME_SKILLS[step.label];
if (skill && Array.isArray(skill.entries)) {
const modules = skill.entries.map((entry) => entry.src);
// Report runtimes are demand-loaded. Keep this as a low-priority network hint
// so login and current-cohort restoration retain the available bandwidth.
prefetchAppModuleList(modules, `hotspot-runtime-${step.label}`);
}
});
};
const warmStep = (step) => Promise.resolve(step.loader()).catch(() => {});
const scheduleWarmup = (label, run) => {
if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') window.SystemPerformance.scheduleIdle(run, { label, delay: 120, timeout: 2200 });
else if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 2200 });
else window.setTimeout(run, 120);
};
const runStepsSequentially = (queue, index = 0, done) => {
if (index >= queue.length) { if (typeof done === 'function') done(); return; }
scheduleWarmup(`hotspot-runtime:${queue[index].label}`, () => warmStep(queue[index]).finally(() => window.setTimeout(() => runStepsSequentially(queue, index + 1, done), 650)));
};
const runPrioritySteps = () => runStepsSequentially(prioritySteps, 0, () => window.setTimeout(() => runStepsSequentially(deferredSteps), 650));
runAfterAppModulesReady(() => {
window.setTimeout(preload, 240);
window.setTimeout(() => {
try { if (localStorage.getItem('SCHOOL_RUNTIME_HOTSPOT_HYDRATE') !== 'true') return; } catch (_) { return; }
scheduleWarmup('hotspot-runtime:priority', runPrioritySteps);
}, HOTSPOT_RUNTIME_HYDRATE_DELAY_MS);
});
}

scheduleHotspotRuntimeWarmup();

function scheduleTeachingManagementFastWarmup() {
if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) return;
if (window.__TEACHING_FAST_WARMUP_SCHEDULED__) return;
window.__TEACHING_FAST_WARMUP_SCHEDULED__ = true;
runAfterAppModulesReady(() => {
const preload = () => {
const skill = SYSTEM_RUNTIME_SKILLS['teaching-management'];
if (skill && Array.isArray(skill.entries)) prefetchAppModuleList(skill.entries.map((entry) => entry.src), 'teaching-management-fast-prefetch');
};
window.setTimeout(preload, 520);
try { if (localStorage.getItem('SCHOOL_RUNTIME_HOTSPOT_HYDRATE') !== 'true') return; } catch (_) { return; }
const run = () => window.ensureTeacherAnalysisMainRuntimeLoaded?.();
if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') window.SystemPerformance.scheduleIdle(run, { label: 'teacher-analysis-fast-warmup', delay: 12000, timeout: 1800 });
else if (typeof window.requestIdleCallback === 'function') window.setTimeout(() => window.requestIdleCallback(run, { timeout: 1800 }), 12000);
else window.setTimeout(run, 12000);
});
}

scheduleTeachingManagementFastWarmup();

function installHistoryDoQueryWrapper() {
if (window.__historyDoQueryWrapped || typeof window.doQuery !== 'function') return false;
const base = window.doQuery;
const wrapped = async function (...args) {
    const syncCompareTargetIfReady = () => {
        if (typeof window.setCloudCompareTarget !== 'function') return;
        const currentStudent = typeof window.readCurrentReportStudentState === 'function'
            ? window.readCurrentReportStudentState()
            : null;
        if (currentStudent) window.setCloudCompareTarget(currentStudent);
    };
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
        window.SystemPerformance.scheduleIdle(syncCompareTargetIfReady, { label: 'report-history-compare-target-sync', delay: 80, timeout: 1500 });
    } else {
        window.setTimeout(syncCompareTargetIfReady, 80);
    }
    // Keep this lightweight hook stable.  The previous self-reassignment
    // could select the wrapper itself on a later call, recurse until the
    // report stayed on its loading skeleton, and hide an otherwise completed
    // cloud-history render.
    return base.apply(this, args);
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

runAfterAppModulesReady(function () {
    retryInstallLateHook(installHistoryDoQueryWrapper, {
    onExhausted: function () {
        console.warn('[boot-runtime] history compare hook install timed out');
    }
});

retryInstallLateHook(installDataManagerSqlHooks, {
    onExhausted: function () {
        console.warn('[boot-runtime] SQL hook timeout');
    }
});
});
