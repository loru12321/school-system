var sbClient = window.sbClient || null;
window.SUPABASE_URL = localStorage.getItem('SUPABASE_URL') || 'https://okwcciujnfvobbwaydiv.supabase.co';
window.SUPABASE_KEY = localStorage.getItem('SUPABASE_KEY') || 'sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4';
window.EDGE_GATEWAY_URL = localStorage.getItem('EDGE_GATEWAY_URL') || 'https://okwcciujnfvobbwaydiv.supabase.co/functions/v1/edu-gateway-v2';
window.initSupabase = function () {
    if (window.supabase && !sbClient) {
        sbClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
        window.sbClient = sbClient;
        console.log('✅ Supabase 连接初始化成功');
    }
};

document.addEventListener('DOMContentLoaded', function () {
    if (typeof initMacroAnomalyConfigUI === 'function') initMacroAnomalyConfigUI();
});

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

window.addEventListener('scroll', function () {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    if (window.scrollY > 300) {
        btn.style.display = 'block';
        btn.style.opacity = '1';
    } else {
        btn.style.display = 'none';
    }
});

window.__optionalRuntimeLoaders = window.__optionalRuntimeLoaders || {};
function getOptionalRuntimeCandidates(src) {
    const normalized = String(src || '').trim();
    const candidates = [normalized];
    if (window.location && window.location.protocol === 'file:' && normalized.startsWith('./assets/js/')) {
        const relativePath = normalized.replace(/^\.\//, '');
        candidates.push(`./dist/${relativePath}`);
        candidates.push(`./public/${relativePath}`);
    }
    return Array.from(new Set(candidates.filter(Boolean)));
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
                inlineScript.dataset.runtimeLoaded = 'true';
                inlineScript.text = inlineSource;
                document.head.appendChild(inlineScript);
                resolve();
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

window.ensureAccountAdminRuntimeLoaded = function () {
    return loadOptionalRuntime('account-admin', './assets/js/account-admin-runtime.js');
};

window.ensureHistoryCompareRuntimeLoaded = function () {
    return loadOptionalRuntime('history-compare', './assets/js/history-compare-runtime.js');
};

window.ensurePerfMobileRuntimeLoaded = function () {
    return loadOptionalRuntime('perf-mobile', './assets/js/perf-mobile-runtime.js');
};

window.ensureReportRenderRuntimeLoaded = function () {
    return loadOptionalRuntime('report-render', './assets/js/report-render-runtime.js');
};

window.ensureStudentCompareRuntimeLoaded = function () {
    return loadOptionalRuntimeBundle('student-compare-bundle', [
        { key: 'student-compare-result', src: './assets/js/student-compare-result-runtime.js' },
        { key: 'student-compare-generate', src: './assets/js/student-compare-generate-runtime.js' },
        { key: 'student-compare-cloud', src: './assets/js/student-compare-cloud-runtime.js' }
    ]);
};

window.ensureTeacherCompareRuntimeLoaded = function () {
    return loadOptionalRuntimeBundle('teacher-compare-bundle', [
        { key: 'teacher-compare-result', src: './assets/js/teacher-compare-result-runtime.js' },
        { key: 'teacher-compare-cloud', src: './assets/js/teacher-compare-cloud-runtime.js' }
    ]);
};

window.ensureMacroCompareRuntimeLoaded = function () {
    return loadOptionalRuntimeBundle('macro-compare-bundle', [
        { key: 'macro-compare-result', src: './assets/js/macro-compare-result-runtime.js' },
        { key: 'macro-compare-cloud', src: './assets/js/macro-compare-cloud-runtime.js' }
    ]);
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

['printSingleReport', 'downloadSingleReportPDF', 'batchGeneratePDF', 'copyReport', 'exportToWord'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureReportRenderRuntimeLoaded);
});

['renderStudentMultiPeriodComparison', 'saveStudentCompareToCloud', 'viewCloudStudentCompares', 'exportStudentMultiPeriodComparison', 'loadCloudStudentCompare'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureStudentCompareRuntimeLoaded);
});

['renderTeacherMultiPeriodComparison', 'renderAllTeachersMultiPeriodComparison', 'exportAllTeachersMultiPeriodDiff', 'exportTeacherMultiPeriodComparison', 'saveTeacherMultiPeriodCompareToCloud', 'viewCloudTeacherCompares', 'loadCloudTeacherCompare'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureTeacherCompareRuntimeLoaded);
});

['renderMacroMultiPeriodComparison', 'exportMacroMultiPeriodComparison', 'saveMacroMultiPeriodCompareToCloud', 'viewCloudMacroCompares', 'loadCloudMacroCompare'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureMacroCompareRuntimeLoaded);
});

['renderSingleReportCardHTML', 'renderRadarChart', 'renderVarianceChart', 'analyzeStrengthsAndWeaknesses'].forEach((name) => {
    installOptionalRuntimePlaceholder(name, `${name} runtime not loaded`);
});

if (window.innerWidth <= 768 || localStorage.getItem('DEV_MODE') === 'true') {
    window.ensurePerfMobileRuntimeLoaded().catch((error) => {
        console.warn(error);
    });
}

function installHistoryDoQueryWrapper() {
    if (window.__historyDoQueryWrapped || typeof window.doQuery !== 'function') return false;
    const base = window.doQuery;
    const wrapped = async function (...args) {
        try {
            await window.ensureStudentCompareRuntimeLoaded();
        } catch (error) {
            console.warn(error);
        }
        try {
            await window.ensureHistoryCompareRuntimeLoaded();
        } catch (error) {
            console.warn(error);
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

if (!installHistoryDoQueryWrapper()) {
    let tries = 0;
    const timer = setInterval(() => {
        tries += 1;
        if (installHistoryDoQueryWrapper() || tries >= 30) {
            clearInterval(timer);
        }
    }, 250);
}
