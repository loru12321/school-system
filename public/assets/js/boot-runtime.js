var sbClient = window.sbClient || null;

document.addEventListener('DOMContentLoaded', function () {
    if (typeof initMacroAnomalyConfigUI === 'function') initMacroAnomalyConfigUI();
});

var DIRECT_SUPABASE_URL = 'https://okwcciujnfvobbwaydiv.supabase.co';
var DIRECT_SUPABASE_KEY = 'sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4';
var DIRECT_EDGE_GATEWAY_URL = DIRECT_SUPABASE_URL + '/functions/v1/edu-gateway-v2';

function isLocalSupabaseHost(hostname) {
    var normalized = String(hostname || '').trim().toLowerCase();
    return !normalized
        || normalized === 'localhost'
        || normalized === '127.0.0.1'
        || normalized === '[::1]'
        || normalized.endsWith('.local');
}

function shouldUseSameOriginSupabaseProxy() {
    if (!window.location) return false;
    var protocol = String(window.location.protocol || '').trim().toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    return !isLocalSupabaseHost(window.location.hostname);
}

function getSameOriginSupabaseUrl() {
    if (!window.location || !window.location.origin) return DIRECT_SUPABASE_URL;
    return String(window.location.origin).replace(/\/$/, '') + '/sb';
}

function getSameOriginGatewayUrl() {
    if (!window.location || !window.location.origin) return DIRECT_EDGE_GATEWAY_URL;
    return String(window.location.origin).replace(/\/$/, '') + '/api/edu-gateway';
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

window.__DIRECT_SUPABASE_URL = DIRECT_SUPABASE_URL;
window.__DIRECT_EDGE_GATEWAY_URL = DIRECT_EDGE_GATEWAY_URL;
window.SUPABASE_URL = getBootStorageValue('SUPABASE_URL') || (shouldUseSameOriginSupabaseProxy() ? getSameOriginSupabaseUrl() : DIRECT_SUPABASE_URL);
window.SUPABASE_KEY = getBootStorageValue('SUPABASE_KEY') || DIRECT_SUPABASE_KEY;
window.EDGE_GATEWAY_URL = getBootStorageValue('EDGE_GATEWAY_URL') || (shouldUseSameOriginSupabaseProxy() ? getSameOriginGatewayUrl() : DIRECT_EDGE_GATEWAY_URL);
window.initSupabase = function () {
    if (window.supabase && !sbClient) {
        sbClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY, {
            global: {
                fetch: createSupabaseFetchWithTimeout(15000)
            }
        });
        window.sbClient = sbClient;
        console.log('Supabase client initialized');
    }
};

(function installBootLoginShell() {
    const BOOT_LOGIN_PORTAL_STORAGE_KEY = 'LOGIN_PORTAL_V1';
    const BOOT_GATEWAY_REQUEST = createSupabaseFetchWithTimeout(12000);
    const bootPortalConfigs = {
        school: {
            badge: '学校端入口',
            copy: '教务、年级、班主任与教师统一进入教学分析与管理工作台',
            userLabel: '账号 / 姓名',
            userPlaceholder: '管理员账号 / 教师姓名',
            userHelper: '学校端支持管理员、教务、年级、班主任与教师账号登录。',
            classNote: '(学校端无需填写)',
            classPlaceholder: '学校端无需填写',
            helper: '学校端用于成绩分析、教学管理与数据维护。',
            submit: '进入学校端',
            success: '验证成功，正在进入工作台...'
        },
        parent: {
            badge: '家长端入口',
            copy: '输入学生姓名、班级和密码，进入成长报告与成绩查询视图',
            userLabel: '学生姓名',
            userPlaceholder: '请输入学生姓名',
            userHelper: '家长端建议使用学生姓名登录，并完整填写班级信息',
            classNote: '(家长端必填，如 701)',
            classPlaceholder: '请输入学生班级，如 701',
            helper: '家长端将进入成长报告、成绩单与家校沟通视图。',
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
            pushCandidate(this.resolvedGatewayUrl);
            pushCandidate(localStorage.getItem('EDGE_GATEWAY_URL'));
            pushCandidate(window.EDGE_GATEWAY_URL);
            const supabaseUrl = this.normalizeGatewayUrl(localStorage.getItem('SUPABASE_URL') || window.SUPABASE_URL || '');
            if (supabaseUrl) {
                pushCandidate(`${supabaseUrl}/functions/v1/edu-gateway-v2`);
                pushCandidate(`${supabaseUrl}/functions/v1/edu-gateway`);
            }
            return candidates;
        },
        getGatewayUrl() {
            return this.getGatewayCandidates()[0] || '';
        },
        getPublishableKey() {
            return String(localStorage.getItem('SUPABASE_KEY') || window.SUPABASE_KEY || '').trim();
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
            return !!(this.getGatewayUrl() && this.getPublishableKey());
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
            if (!urls.length || !apikey) {
                throw new Error('EDGE_GATEWAY_NOT_CONFIGURED');
            }
            const headers = {
                'Content-Type': 'application/json',
                'apikey': apikey
            };
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
                    if (i < urls.length - 1 && this.shouldRetryRequest(0, lastError.message)) {
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
        const app = document.getElementById('app');
        document.body.classList.toggle('login-overlay-active', !!visible);
        document.body.dataset.authState = visible ? 'logged_out' : 'logged_in';
        if (overlay) overlay.style.display = visible ? 'flex' : 'none';
        if (app && visible) app.classList.add('hidden');
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
            }
        },
        async login() {
            if (window.Auth && window.Auth !== this && !window.Auth.__bootLoginShell && typeof window.Auth.login === 'function') {
                return window.Auth.login();
            }
            if (this.__bootLoginBusy) return;
            const portal = this.getLoginPortal();
            const config = getPortalConfig(portal);
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
            if (!bootGateway.hasGatewayConfig()) {
                setBootHelperMessage('登录模块仍在加载，请稍候再试。', 'error');
                return;
            }
            this.__bootLoginBusy = true;
            setBootSubmitState({ busy: true, text: '正在验证身份...' });
            setBootHelperMessage('正在连接云端验证身份，请稍候...', 'info');
            try {
                const result = await bootGateway.login(user, pass, className);
                const matchedUser = result?.user || null;
                if (!matchedUser) {
                    throw new Error('Invalid username or password');
                }
                writeBootSessionUser(matchedUser);
                const nextPortal = Array.isArray(matchedUser.roles) && matchedUser.roles.some((role) => role === 'parent' || role === 'student')
                    || matchedUser.role === 'parent'
                    || matchedUser.role === 'student'
                    ? 'parent'
                    : 'school';
                localStorage.setItem(this.loginPortalStorageKey, nextPortal);
                setBootHelperMessage(getPortalConfig(nextPortal).success, 'success');
                setBootSubmitState({ busy: true, text: '正在进入...' });
                const loader = document.getElementById('global-loader');
                const loaderText = loader ? loader.querySelector('.loader-text') : null;
                if (loader) loader.classList.remove('hidden');
                if (loaderText) loaderText.textContent = getPortalConfig(nextPortal).success;
                window.__BOOT_AUTH_PENDING_HANDOFF__ = true;
            } catch (error) {
                const message = String(error?.message || '').trim();
                const nextMessage = message.includes('Invalid username or password')
                    ? '账号、密码或班级不正确，请检查后重试。'
                    : '云端登录暂时失败，请稍后再试。';
                setBootHelperMessage(nextMessage, 'error');
                this.__bootLoginBusy = false;
                this.syncLoginPortalUI(portal);
            }
        },
        logout() {
            bootGateway.clearSession();
            sessionStorage.removeItem('CURRENT_USER');
            sessionStorage.removeItem('CURRENT_ROLE');
            sessionStorage.removeItem('CURRENT_ROLES');
            this.__bootLoginBusy = false;
            this.syncLoginOverlayState(true);
            this.syncLoginPortalUI(this.getLoginPortal());
        }
    };

    if (!window.Auth || window.Auth.__bootLoginShell) {
        window.Auth = bootAuth;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => bootAuth.init(), { once: true });
    } else {
        bootAuth.init();
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

window.ensureMobileManagerRuntimeLoaded = function () {
    return loadOptionalRuntime('mobile-manager', './assets/js/mobile-manager.js');
};

window.ensureDataManagerSqlRuntimeLoaded = function () {
    return loadOptionalRuntime('data-manager-sql', './assets/js/data-manager-sql.js');
};

window.ensureReportRenderRuntimeLoaded = function () {
    return loadOptionalRuntime('report-render', './assets/js/report-render-runtime.js');
};

window.ensureTeacherAnalysisMainRuntimeLoaded = function () {
    return loadOptionalRuntime('teacher-analysis-main', './assets/js/teacher-analysis-main-runtime.js');
};

window.ensureSingleSchoolEvalRuntimeLoaded = function () {
    return loadOptionalRuntime('single-school-eval', './assets/js/single-school-eval-runtime.js');
};

window.ensureProgressAnalysisRuntimeLoaded = function () {
    return loadOptionalRuntime('progress-analysis', './assets/js/progress-analysis-runtime.js');
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
    'switchValueAddedView',
    'exportValueAddedExcel',
    'updateProgressSchoolSelect',
    'updateProgressBaselineSelect',
    'onProgressComparePeriodCountChange',
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

['renderTeacherMultiPeriodComparison', 'renderAllTeachersMultiPeriodComparison', 'exportAllTeachersMultiPeriodDiff', 'exportTeacherMultiPeriodComparison', 'saveTeacherMultiPeriodCompareToCloud', 'viewCloudTeacherCompares', 'loadCloudTeacherCompare'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureTeacherCompareRuntimeLoaded);
});

['renderMacroMultiPeriodComparison', 'exportMacroMultiPeriodComparison', 'saveMacroMultiPeriodCompareToCloud', 'viewCloudMacroCompares', 'loadCloudMacroCompare'].forEach((name) => {
    installOptionalRuntimeMethod(name, window.ensureMacroCompareRuntimeLoaded);
});

['renderSingleReportCardHTML', 'renderRadarChart', 'renderVarianceChart', 'analyzeStrengthsAndWeaknesses'].forEach((name) => {
    installOptionalRuntimePlaceholder(name, `${name} runtime not loaded`);
});

if (window.innerWidth <= 960 || localStorage.getItem('DEV_MODE') === 'true') {
    window.ensureMobileManagerRuntimeLoaded().catch((error) => {
        console.warn(error);
    });
}

if (window.innerWidth <= 768 || localStorage.getItem('DEV_MODE') === 'true') {
    window.ensureMobileManagerRuntimeLoaded().then(() => {
        return window.ensurePerfMobileRuntimeLoaded();
    }).catch((error) => {
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

if (!installHistoryDoQueryWrapper()) {
    let tries = 0;
    const timer = setInterval(() => {
        tries += 1;
        if (installHistoryDoQueryWrapper() || tries >= 30) {
            clearInterval(timer);
        }
    }, 250);
}

if (!installDataManagerSqlHooks()) {
    let tries = 0;
    const timer = setInterval(() => {
        tries += 1;
        if (installDataManagerSqlHooks() || tries >= 30) {
            clearInterval(timer);
        }
    }, 250);
}
