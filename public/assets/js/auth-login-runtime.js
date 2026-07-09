// auth-login-runtime.js — Auth login system, RoleManager, alert/confirm UI overrides (extracted from app.js)
function scheduleStartupCloudTask(task, options = {}) {
    const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : 1200;
    const timeout = Number.isFinite(Number(options.timeout)) ? Number(options.timeout) : 2500;
    const run = () => {
        const execute = () => {
            try {
                task();
            } catch (error) {
                console.warn('[startup-cloud] deferred task failed:', error);
            }
        };
        if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
            window.SystemPerformance.scheduleIdle(execute, { timeout });
            return;
        }
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(execute, { timeout });
            return;
        }
        window.setTimeout(execute, 0);
    };
    return window.setTimeout(run, Math.max(0, delay));
}

var Auth = {
    currentUser: null,
    _parentDataRecovering: false,
    _parentRenderRetrying: false,
    normalizeManagedClass: function (value) {
        if (typeof AuthState !== 'undefined' && AuthState && typeof AuthState.normalizeClassName === 'function') {
            return AuthState.normalizeClassName(value);
        }
        return normalizeClass(value);
    },
    areEquivalentClasses: function (left, right) {
        if (typeof AuthState !== 'undefined' && AuthState && typeof AuthState.areEquivalentClasses === 'function') {
            return AuthState.areEquivalentClasses(left, right);
        }
        return normalizeClass(left) === normalizeClass(right);
    },
    syncParentMobileScrollRoot: function (enabled) {
        const canUseMatchMedia = typeof window.matchMedia === 'function';
        const shouldEnable = !!enabled && (!canUseMatchMedia || window.matchMedia('(max-width: 960px)').matches);
        document.documentElement.classList.toggle('parent-mobile-scroll-root', shouldEnable);
        document.body.classList.toggle('parent-mobile-scroll-root', shouldEnable);
    },

    db: (typeof AuthState.readLocalAuthDb === 'function'
        ? AuthState.readLocalAuthDb()
        : sanitizeLocalAuthDb(JSON.parse(localStorage.getItem('SYS_USERS')) || {
            admin: { pass: MASKED_PASSWORD_DISPLAY },
            teachers: [],
            parents: []
        })),

    loginPortalStorageKey: 'LOGIN_PORTAL_V1',

    getLoginPortal: function () {
        return localStorage.getItem(this.loginPortalStorageKey) === 'parent' ? 'parent' : 'school';
    },

    setLoginPortal: function (portal) {
        const nextPortal = portal === 'parent' ? 'parent' : 'school';
        localStorage.setItem(this.loginPortalStorageKey, nextPortal);
        this.syncLoginPortalUI(nextPortal);
        return nextPortal;
    },

    rebuildInstagramLoginShell: function () {
        return window.LoginEntryRuntime?.rebuildInstagramLoginShell?.() || null;
    },

    rebuildCommandDeckLoginShell: function () {
        return window.LoginEntryRuntime?.rebuildCommandDeckLoginShell?.() || null;
    },

    rebuildPassportLoginShell: function () {
        return window.LoginEntryRuntime?.rebuildPassportLoginShell?.() || null;
    },

    ensureLoginWorkbench: function () {
        const existingOverlay = document.getElementById('login-overlay');
        if (existingOverlay?.querySelector('.login-clean-shell')) {
            existingOverlay.dataset.loginLayout = 'clean';
            existingOverlay.dataset.loginSkin = 'clean';
            existingOverlay.dataset.loginModal = 'inline';
            this.ensureSystemIntroModal();
            return existingOverlay;
        }

        const overlay = this.rebuildPassportLoginShell();
        const panel = document.getElementById('login-portal-hub');
        const modalBackdrop = document.getElementById('login-modal-backdrop');
        if (!overlay || !panel) return;
        this.ensureSystemIntroModal();

        if (modalBackdrop && modalBackdrop.dataset.loginModalBound !== 'true') {
            modalBackdrop.addEventListener('click', (event) => {
                if (event.target === modalBackdrop) this.closeLoginPortalModal();
            });
            modalBackdrop.dataset.loginModalBound = 'true';
        }

        const navLinks = Array.from(overlay.querySelectorAll('.login-stage-nav-links a'));
        const navLinksWrap = overlay.querySelector('.login-stage-nav-links');
        const navButton = overlay.querySelector('.login-stage-nav-login');
        const introLink = navLinks[0];
        const modalLink = navLinks[1];

        if (navLinksWrap && modalLink && introLink) {
            [modalLink, introLink].forEach((link) => navLinksWrap.appendChild(link));
        }

        [introLink, modalLink].forEach((link) => {
            if (link) link.classList.remove('active');
        });

        if (introLink) {
            introLink.textContent = '系统介绍';
            introLink.href = '#';
            introLink.dataset.nav = 'intro';
            introLink.onclick = (event) => {
                event.preventDefault();
                this.openSystemIntroModal(this.getLoginPortal());
            };
        }

        if (modalLink) {
            modalLink.textContent = '登录验证';
            modalLink.href = '#';
            modalLink.dataset.nav = 'modal';
            modalLink.classList.add('active');
            modalLink.onclick = (event) => {
                event.preventDefault();
                this.openLoginPortalModal(this.getLoginPortal());
            };
        }

        if (navButton) {
            navButton.textContent = '切到学校端';
            navButton.onclick = () => this.openLoginPortalModal('school');
        }

        overlay.dataset.loginModal = 'inline';
        this.setLoginWorkbenchNavState(document.body.classList.contains('login-system-intro-open') ? 'intro' : 'modal');
        panel.dataset.loginWorkbenchReady = 'true';
    },

    focusLoginWorkbench: function (options = {}) {
        this.ensureLoginWorkbench();
        const focusTarget = document.getElementById('login-user');
        const backdrop = document.getElementById('login-modal-backdrop');

        if (options.scroll !== false && backdrop) {
            backdrop.scrollTop = 0;
        }

        if (options.focus === false) return;

        setTimeout(() => {
            if (focusTarget && typeof focusTarget.focus === 'function') {
                focusTarget.focus({ preventScroll: true });
            }
        }, typeof options.delay === 'number' ? options.delay : 60);
    },

    setLoginWorkbenchNavState: function (activeNav = 'modal') {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return;
        overlay.querySelectorAll('.login-stage-nav-links a[data-nav]').forEach((link) => {
            link.classList.toggle('active', link.dataset.nav === activeNav);
        });
    },

    ensureSystemIntroModal: function () {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return null;

        let backdrop = document.getElementById('login-system-intro-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'login-system-intro-backdrop';
            backdrop.className = 'login-system-intro-backdrop';
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
            backdrop.innerHTML = `
                <div class="login-system-intro-dialog" role="dialog" aria-modal="true" aria-labelledby="login-system-intro-title">
                    <div class="login-system-intro-hero">
                        <div class="login-system-intro-top">
                            <span class="login-system-intro-chip" data-intro-chip>系统介绍</span>
                            <button type="button" class="login-system-intro-close" data-intro-close aria-label="关闭系统介绍">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="login-system-intro-copy-block">
                            <h2 id="login-system-intro-title" class="login-system-intro-title" data-intro-title tabindex="-1">系统介绍</h2>
                            <p class="login-system-intro-copy" data-intro-copy></p>
                        </div>
                        <section class="login-system-intro-focus" aria-label="当前入口重点">
                            <span class="login-system-intro-focus-label" data-intro-focus-label></span>
                            <strong class="login-system-intro-focus-title" data-intro-focus-title></strong>
                            <p class="login-system-intro-focus-copy" data-intro-focus-copy></p>
                        </section>
                        <div class="login-system-intro-quickstats" data-intro-quickstats></div>
                    </div>
                    <div class="login-system-intro-body" data-intro-body></div>
                </div>
            `;
            overlay.appendChild(backdrop);
        }

        if (backdrop.dataset.introBound !== 'true') {
            backdrop.addEventListener('click', (event) => {
                if (event.target === backdrop) this.closeSystemIntroModal();
            });
            const closeButton = backdrop.querySelector('[data-intro-close]');
            if (closeButton) {
                closeButton.addEventListener('click', () => this.closeSystemIntroModal());
            }
            backdrop.dataset.introBound = 'true';
        }

        return backdrop;
    },

    getSystemIntroContent: function (portal = this.getLoginPortal()) {
        return window.LoginEntryRuntime?.getSystemIntroContent?.(portal) || { sections: [], quickStats: [] };
    },

    renderSystemIntroModal: function (portal = this.getLoginPortal()) {
        return window.LoginEntryRuntime?.renderSystemIntroModal?.(portal) || null;
    },

    openSystemIntroModal: function (portal) {
        this.ensureLoginWorkbench();
        this.ensureSystemIntroModal();
        const nextPortal = this.setLoginPortal(portal || this.getLoginPortal());
        this.closeLoginPortalModal();
        const backdrop = this.renderSystemIntroModal(nextPortal);
        if (backdrop) {
            backdrop.style.display = 'flex';
            backdrop.setAttribute('aria-hidden', 'false');
        }
        document.body.classList.add('login-system-intro-open');
        this.setLoginWorkbenchNavState('intro');
        setTimeout(() => {
            const title = backdrop?.querySelector('[data-intro-title]');
            if (title && typeof title.focus === 'function') {
                title.focus({ preventScroll: true });
            }
        }, 60);
        return nextPortal;
    },

    closeSystemIntroModal: function () {
        const backdrop = document.getElementById('login-system-intro-backdrop');
        if (backdrop) {
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('login-system-intro-open');
        this.setLoginWorkbenchNavState('modal');
    },

    closeDownloadHubModal: function () {
        const selectors = [
            '#download-hub-modal',
            '#download-hub-backdrop',
            '[data-download-hub-modal]',
            '[data-download-hub-backdrop]'
        ];
        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((node) => {
                if (!(node instanceof HTMLElement)) return;
                node.style.display = 'none';
                node.setAttribute('aria-hidden', 'true');
            });
        });
        document.body.classList.remove('download-hub-open');
    },

    openLoginPortalModal: function (portal) {
        this.ensureLoginWorkbench();
        this.closeSystemIntroModal();
        this.closeDownloadHubModal?.();
        const nextPortal = this.setLoginPortal(portal);
        const overlay = document.getElementById('login-overlay');
        const backdrop = document.getElementById('login-modal-backdrop');
        if (overlay) overlay.dataset.loginModal = 'inline';
        if (backdrop) {
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('login-modal-open');
        this.setLoginWorkbenchNavState('modal');
        this.focusLoginWorkbench({ scroll: false });
        return nextPortal;
    },

    closeLoginPortalModal: function () {
        const overlay = document.getElementById('login-overlay');
        const backdrop = document.getElementById('login-modal-backdrop');
        if (overlay) overlay.dataset.loginModal = 'inline';
        if (backdrop) {
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
        }
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
        document.body.classList.remove('login-modal-open');
        if (!document.body.classList.contains('login-system-intro-open')) {
            this.setLoginWorkbenchNavState('modal');
        }
    },

    syncLoginOverlayState: function (visible) {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const hasSessionUser = !!(window.AuthState && typeof AuthState.getCurrentUser === 'function' && AuthState.getCurrentUser());
        const shouldShowLogin = !!visible || !hasSessionUser;
        this.closeSystemIntroModal();
        this.closeDownloadHubModal?.();
        this.closeLoginPortalModal();
        if (shouldShowLogin) {
            this.syncParentMobileScrollRoot(false);
            setManualCohortSelectionGate(false);
            if (this._parentRenderTimer) {
                clearTimeout(this._parentRenderTimer);
                this._parentRenderTimer = null;
            }
        }
        document.body.classList.toggle('login-overlay-active', shouldShowLogin);
        document.body.dataset.authState = shouldShowLogin ? 'logged_out' : 'logged_in';
        if (shouldShowLogin) {
            document.body.dataset.role = 'guest';
            document.body.className = document.body.className.replace(/\brole-\w+\b/g, '').trim();
            document.body.classList.add('role-guest');
        }
        if (overlay) {
            if (!shouldShowLogin && overlay.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            overlay.style.display = shouldShowLogin ? 'flex' : 'none';
            overlay.style.visibility = shouldShowLogin ? 'visible' : 'hidden';
            overlay.style.opacity = shouldShowLogin ? '1' : '0';
            overlay.style.pointerEvents = shouldShowLogin ? 'auto' : 'none';
            overlay.setAttribute('aria-hidden', shouldShowLogin ? 'false' : 'true');
            try { overlay.inert = !shouldShowLogin; } catch (_) { /* inert is best-effort */ }
            overlay.dataset.loginState = shouldShowLogin ? 'active' : 'hidden';
            if (shouldShowLogin) overlay.dataset.loginModal = 'inline';
            if (!shouldShowLogin) overlay.dataset.loginModal = 'hidden';
        }
        if (app) {
            app.classList.toggle('hidden', shouldShowLogin);
            app.setAttribute('aria-hidden', shouldShowLogin ? 'true' : 'false');
        }
    },

    syncLoginPortalUI: function (portal = this.getLoginPortal()) {
        return window.LoginEntryRuntime?.syncLoginPortalUI?.(portal);
    },

    resolveLocalManagedSchool: function (name, className = '') {
        const normalizedName = String(name || '').trim();
        const normalizedClass = this.normalizeManagedClass(className);
        if (normalizedName && normalizedClass && Array.isArray(RAW_DATA)) {
            const parentRow = RAW_DATA.find(row =>
                String(row?.name || '').trim() === normalizedName
                && this.areEquivalentClasses(row?.class, normalizedClass)
            );
            if (parentRow && parentRow.school) return String(parentRow.school).trim();
        }
        if (normalizedName && typeof TEACHER_SCHOOL_MAP === 'object' && TEACHER_SCHOOL_MAP) {
            const teacherSchool = TEACHER_SCHOOL_MAP[normalizedName];
            if (teacherSchool) return String(teacherSchool).trim();
        }
        if (normalizedName && typeof TEACHER_MAP === 'object' && TEACHER_MAP && Array.isArray(RAW_DATA)) {
            for (const [key, teacherName] of Object.entries(TEACHER_MAP)) {
                if (String(teacherName || '').trim() !== normalizedName) continue;
                const cls = String(key || '').split('_')[0];
                const classRow = RAW_DATA.find(row => String(row?.class || '').trim() === cls);
                if (classRow && classRow.school) return String(classRow.school).trim();
            }
        }
        return readCurrentSchool();
    },

    tryLocalManagedLogin: function (username, password, inputClass = '') {
        const canUseLocalManagedLogin = !!window.EMBEDDED_DB || window.location.protocol === 'file:' || !navigator.onLine || !EdgeGateway.hasGatewayConfig();
        if (!canUseLocalManagedLogin) return null;
        const match = AuthState.findManagedAccount(this.db, username, inputClass);
        if (!match || !AuthState.matchesManagedPassword(match.record, match.role, password)) return null;

        const normalizedClass = String(match.record?.class || inputClass || '').trim();
        const localSchool = String(match.record?.school || '').trim() || this.resolveLocalManagedSchool(match.record?.name, normalizedClass);
        const role = match.role;
        let className = normalizedClass;
        if (role === 'teacher') className = '教师';
        else if (role === 'director' || role === 'admin') className = '';
        return {
            username: String(match.record?.name || username).trim(),
            role,
            roles: [role],
            school: localSchool,
            class_name: className,
            local_only: true,
            must_change_password: match.record?.must_change_password !== false
        };
    },

    init: async function () {
        this.ensureLoginWorkbench();
        this.syncLoginPortalUI();
        this.closeSystemIntroModal();
        this.closeLoginPortalModal();
        if (!this._loginModalEscapeBound) {
            document.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape') return;
                if (document.body.classList.contains('login-system-intro-open')) {
                    this.closeSystemIntroModal();
                    return;
                }
                this.closeLoginPortalModal();
            });
            this._loginModalEscapeBound = true;
        }
        const sessionUser = AuthState.getCurrentUser();
        this.syncLoginOverlayState(!sessionUser);
        if (sessionUser) {
            this.currentUser = sessionUser;
            this.setLoginPortal(isParentLikeUser(this.currentUser) ? 'parent' : 'school');
            if (window.EdgeGateway && typeof EdgeGateway.verify === 'function' && EdgeGateway.getToken()) {
                EdgeGateway.verify().catch(err => {
                    console.warn('[EdgeGateway] session verify failed:', err?.message || err);
                    try { sessionStorage.removeItem('edu:session:token'); } catch (_) { }
                    EdgeGateway.clearSession();
                    if (window.AuthState && typeof AuthState.clearCurrentUser === 'function') {
                        AuthState.clearCurrentUser();
                    }
                    this.syncLoginOverlayState(true);
                });
            }
            this.syncLoginOverlayState(false);
            this.applyRoleView();

            if (isParentLikeUser(this.currentUser)) {
                if (!this.currentUser.local_only && (!RAW_DATA || RAW_DATA.length === 0) && typeof loadCloudData === 'function' && !this._parentDataRecovering) {
                    this._parentDataRecovering = true;
                    scheduleStartupCloudTask(() => {
                        Promise.resolve()
                            .then(() => loadCloudData())
                            .then(() => {
                                if (isParentLikeUser(this.currentUser)) this.renderParentView();
                            })
                            .catch(e => console.warn('[Auth.init] parent background cloud restore failed:', e))
                            .finally(() => {
                                this._parentDataRecovering = false;
                            });
                    }, { delay: 250, timeout: 2600 });
                }
                this.renderParentView();
            }
            else if (!isParentLikeUser(this.currentUser)) {
                if (typeof renderNavigation === 'function') renderNavigation();
                const restoredCohortId = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
                const restoredExamId = String(CURRENT_EXAM_ID || readWorkspaceExamId() || COHORT_DB?.currentExamId || '').trim();
                const hasReadyWorkspace = !!restoredCohortId
                    && !!restoredExamId
                    && Array.isArray(RAW_DATA)
                    && RAW_DATA.length > 0;
                if (hasReadyWorkspace) {
                    tryAutoRestoreWorkspaceExam({ preferredExamId: restoredExamId, cohortId: restoredCohortId });
                    tryAutoEnterReadyCohortWorkspace();
                } else {
                    if (typeof window.showCohortPicker === 'function') window.showCohortPicker();
                }
                if (!this.currentUser.local_only && (!RAW_DATA || RAW_DATA.length === 0) && typeof loadCloudData === 'function') {
                    scheduleStartupCloudTask(() => {
                        withTimeout(loadCloudData(), CLOUD_STARTUP_LOAD_TIMEOUT_MS, 'cloud-load-timeout')
                            .then(() => {
                                tryAutoRestoreWorkspaceExam({
                                    preferredExamId: CURRENT_EXAM_ID || readWorkspaceExamId() || COHORT_DB?.currentExamId || '',
                                    cohortId: CURRENT_COHORT_ID || readWorkspaceCohortId() || ''
                                });
                                tryAutoEnterReadyCohortWorkspace();
                                if (typeof scheduleTeacherSyncPrompt === 'function') {
                                    setTimeout(() => scheduleTeacherSyncPrompt(), 200);
                                }
                            })
                            .catch(e => console.warn('[Auth.init] background cloud load failed:', e));
                    }, { delay: 1400, timeout: 2600 });
                } else if (typeof scheduleTeacherSyncPrompt === 'function') {
                    setTimeout(() => scheduleTeacherSyncPrompt(), 200);
                }
            }
        }
    },

    /* 👇👇👇 ✋ 🟢 [此处开始替换] 重写 login 函数 (登录后立即刷新主界面) 🟢 ✋ 👇👇👇 */

    login: async function () {
        window.__BOOT_LOGIN_CLICKED__ = false;
        const user = document.getElementById('login-user').value.trim();
        const pass = document.getElementById('login-pass').value.trim();
        const loginPortal = this.getLoginPortal();
        const classInputEl = document.getElementById('login-class');
        const inputClass = classInputEl ? classInputEl.value.trim() : '';
        if (loginPortal === 'parent' && user && pass && !inputClass) return UI.toast('家长端请输入学生班级', 'error');

        if (!user || !pass) return UI.toast('请输入账号和密码', 'error');

        UI.loading(true, "正在验证身份...");

        try {
            let data = null;
            let gatewayError = null;
            const canUseGatewayLogin = !!(window.EdgeGateway && typeof EdgeGateway.login === 'function' && EdgeGateway.hasGatewayConfig());
            const canUseLocalManagedLogin = !!window.EMBEDDED_DB || window.location.protocol === 'file:' || !navigator.onLine || !canUseGatewayLogin;

            if (canUseGatewayLogin) {
                try {
                    const gatewayRes = await EdgeGateway.login(user, pass, inputClass);
                    data = gatewayRes?.user || null;
                } catch (error) {
                    gatewayError = error instanceof Error ? error : new Error(String(error));
                }
            }

            if (!data && canUseLocalManagedLogin) {
                data = this.tryLocalManagedLogin(user, pass, inputClass);
            }

            /* legacy browser-direct login fallback removed
                    alert("❌ 系统连接失败！\n\n网关暂不可用，且云端数据库尚未加载完毕。\n\n请稍后刷新页面重试。");
                const directRes = { error: new Error('EDGE_GATEWAY_REQUIRED'), data: null };
                if (directRes.error) {
                    UI.loading(false);
                    console.error("Database Login Error:", directRes.error);
                    return alert("系统连接错误：" + directRes.error.message);
                }
                data = directRes.data || null;
            }

            */
            UI.loading(false);

            if (!data) {
                if (gatewayError) {
                    const message = String(gatewayError.message || '').trim();
                    if (message.includes('class_name mismatch')) {
                        return alert(`❌ 班级不匹配！\n\n您输入的班级：${inputClass || '未填写'}\n请核对后重试。`);
                    }
                    if (message.includes('Invalid username or password')) {
                        return alert("❌ 登录失败！\n\n可能原因：\n1. 账号或密码错误\n2. 管理员尚未将账号同步到云端");
                    }
                    return alert("❌ 登录失败：" + message);
                }
                if (!canUseGatewayLogin) {
                    return alert("❌ 登录失败！\n\n当前页面未配置云端账号网关，且在本地分发账号中未找到匹配用户。");
                }
                return alert("❌ 登录失败！\n\n可能原因：\n1. 账号或密码错误\n2. 管理员尚未将账号【同步到云端】");
            }

            /* 👇👇👇 🟢 新增代码：家长角色强制校验班级 🟢 👇👇👇 */
            if (isParentLikeRole(data.role) || data.role === 'class_teacher') {
                if (!inputClass) {
                    if (isParentLikeRole(data.role)) {
                        return alert("❌ 登录失败：家长/学生必须输入【班级】才能登录。");
                    }
                }

                const dbClass = String(data.class_name || '').trim();
                const userClass = String(inputClass || '').trim();
                const classMatches = userClass
                    && dbClass
                    && this.areEquivalentClasses(dbClass, userClass);

                if (userClass && (!dbClass || !classMatches)) {
                    return alert(`❌ 班级不匹配！\n\n您输入的班级：${inputClass}\n系统记录的班级：${data.class_name || '未录入'}\n\n请核对后重试。`);
                }
            }
            /* 👆👆👆 🟢 结束 🟢 👆👆👆 */

            const matchedUser = {
                session_id: data.session_id || '',
                name: data.username || data.name,
                role: data.role, // 主角色（兼容）
                roles: data.roles || [data.role], // 🆕 支持多角色数组
                school: data.school,
                class: data.class_name, // 数据库字段名
                class_name: data.class_name,
                teacher_name: data.teacher_name || data.display_name || data.username || data.name,
                local_only: !!data.local_only,
                must_change_password: !!data.must_change_password
            };

            const isLocalOnlySession = !!data.local_only;
            this.currentUser = AuthState.setCurrentUser(matchedUser) || matchedUser;
            this.setLoginPortal(isParentLikeUser(this.currentUser) ? 'parent' : 'school');
            const selectedLoginCohort = String(
                window.BootCohortLifecycle?.getSelectedLoginCohortYear?.()
                || document.getElementById('login-cohort-select')?.value
                || ''
            ).trim();
            const clearRuntimeForSelectedLoginCohort = (cohortId) => {
                const normalizedCohortId = String(cohortId || '').trim();
                if (!normalizedCohortId) return;
                try {
                    if (typeof syncWorkspaceRuntimeState === 'function') {
                        syncWorkspaceRuntimeState({
                            currentProjectKey: `cohort::${normalizedCohortId}`,
                            currentCohortId: normalizedCohortId,
                            currentExamId: '',
                            cohortDb: null
                        });
                    } else if (window.WorkspaceState && typeof window.WorkspaceState.syncWorkspaceState === 'function') {
                        window.WorkspaceState.syncWorkspaceState({
                            currentProjectKey: `cohort::${normalizedCohortId}`,
                            currentCohortId: normalizedCohortId,
                            currentExamId: '',
                            cohortDb: null
                        });
                    }
                    if (typeof clearDataRuntimeState === 'function') clearDataRuntimeState();
                    else {
                        window.RAW_DATA = [];
                        window.SCHOOLS = {};
                        window.SUBJECTS = [];
                        window.THRESHOLDS = {};
                        window.CONFIG = {};
                    }
                    if (typeof setTeacherMap === 'function') setTeacherMap({});
                    if (typeof setTeacherSchoolMap === 'function') setTeacherSchoolMap({});
                    CURRENT_EXAM_ID = '';
                    window.CURRENT_EXAM_ID = '';
                    COHORT_DB = null;
                    window.COHORT_DB = null;
                } catch (clearError) {
                    console.warn('[Auth] failed to clear stale workspace before selected cohort entry:', clearError?.message || clearError);
                }
            };
            let pendingLoginCohortEntry = null;
            if (!isParentLikeUser(this.currentUser) && selectedLoginCohort) {
                const yearInput = document.getElementById('entry-cohort-year');
                if (yearInput) yearInput.value = selectedLoginCohort;
                lockRuntimeCohortId(selectedLoginCohort);
                clearRuntimeForSelectedLoginCohort(selectedLoginCohort);
                if (typeof enterCohortFromMask === 'function') {
                    pendingLoginCohortEntry = Promise.resolve()
                        .then(() => enterCohortFromMask({ fastEnter: false, requireCloudData: true }))
                        .then((entered) => {
                            if (window.BootCohortLifecycle?.clearGraduateTarget) {
                                window.BootCohortLifecycle.clearGraduateTarget();
                            }
                            return entered !== false;
                        })
                        .catch((cohortError) => {
                            console.warn('[Auth] failed to enter selected login cohort:', cohortError?.message || cohortError);
                            return false;
                        });
                    window.setTimeout(() => {
                        pendingLoginCohortEntry?.catch(() => { });
                    }, 0);
                } else if (window.BootCohortLifecycle?.clearGraduateTarget) {
                    try {
                        if (window.BootCohortLifecycle?.clearGraduateTarget) {
                            window.BootCohortLifecycle.clearGraduateTarget();
                        }
                    } catch (e) { }
                }
            }
            if (!isLocalOnlySession && (!window.EdgeGateway || !EdgeGateway.getToken()) && window.EdgeGateway && typeof EdgeGateway.login === 'function') {
                const gatewayClassName = (isParentLikeUser(this.currentUser) || this.currentUser.role === 'class_teacher') ? inputClass : '';
                EdgeGateway.login(user, pass, gatewayClassName).catch(err => {
                    console.warn('[EdgeGateway] login skipped:', err?.message || err);
                });
            }
            this.syncLoginOverlayState(false);
            this.applyRoleView();
            updateAdminOnlyButtons();
            updateWatermark();
            updateRoleHint();

            const rolesInfo = this.currentUser.roles && this.currentUser.roles.length > 1
                ? `${this.currentUser.role} (${this.currentUser.roles.join(', ')})`
                : this.currentUser.role;
            logAction('登录', `用户 ${this.currentUser.name} (${rolesInfo}) 登录`);

            const isDefaultPass = AuthState.isDefaultManagedPassword(this.currentUser.role, pass);

            if (isDefaultPass || this.currentUser.must_change_password) {
                this.syncLoginOverlayState(false); // 先关掉登录框

                alert("⚠️ 安全警告：\n检测到当前账号需要完成首次改密。\n为了保障账号安全，请立即修改密码。");

                setTimeout(() => openUserPasswordModal(true), 500);
                return; // ⛔ 终止后续加载，直到密码修改完成
            }
            const loginUserEl = document.getElementById('login-user');
            const loginPassEl = document.getElementById('login-pass');
            const loginClassEl = document.getElementById('login-class');
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            [loginUserEl, loginPassEl, loginClassEl].forEach(el => {
                if (el && typeof el.blur === 'function') el.blur();
            });
            this.syncLoginOverlayState(false);

            if (window.UI) UI.toast(`登录成功！欢迎 ${this.currentUser.name}`, 'success');

            const shouldHydrateCloudInBackground = !isLocalOnlySession && typeof loadCloudData === 'function';
            const tryResumeReadyWorkspace = () => {
                tryAutoRestoreWorkspaceExam({
                    preferredExamId: CURRENT_EXAM_ID || readWorkspaceExamId() || COHORT_DB?.currentExamId || '',
                    cohortId: CURRENT_COHORT_ID || readWorkspaceCohortId() || ''
                });
                const restoredCohortId = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
                const restoredExamId = String(CURRENT_EXAM_ID || readWorkspaceExamId() || '').trim();
                const hasReadyWorkspace = !!restoredCohortId
                    && !!restoredExamId
                    && Array.isArray(RAW_DATA)
                    && RAW_DATA.length > 0;
                if (!hasReadyWorkspace) return false;
                const mask = document.getElementById('mode-mask');
                const app = document.getElementById('app');
                const maskVisible = !!mask && getComputedStyle(mask).display !== 'none';
                const appHidden = !!app && app.classList.contains('hidden');
                if (maskVisible && appHidden) setManualCohortSelectionGate(false);
                return tryAutoEnterReadyCohortWorkspace();
            };
            const startBackgroundCloudHydration = (loaderText) => {
                if (!shouldHydrateCloudInBackground) return;
                const needsManualCohort = typeof requiresManualCohortSelection === 'function' && requiresManualCohortSelection();
                if (needsManualCohort) return;
                const runHydration = () => {
                    if (window.__COHORT_SWITCH_IN_PROGRESS__) return;
                    if (Array.isArray(RAW_DATA) && RAW_DATA.length > 0) return;
                    withTimeout(loadCloudData(), CLOUD_STARTUP_LOAD_TIMEOUT_MS, 'cloud-load-timeout')
                    .then(() => {
                        tryResumeReadyWorkspace();
                        if (typeof scheduleTeacherSyncPrompt === 'function') {
                            setTimeout(() => scheduleTeacherSyncPrompt(), 200);
                        }
                    })
                    .catch(err => {
                        console.warn('[Auth.login] background cloud load failed:', err);
                        if (typeof loadCloudData === 'function') {
                            loadCloudData()
                                .then(() => {
                                    tryResumeReadyWorkspace();
                                    if (typeof scheduleTeacherSyncPrompt === 'function') {
                                        setTimeout(() => scheduleTeacherSyncPrompt(), 200);
                                    }
                                })
                                .catch(bgErr => console.warn('[Auth.login] delayed cloud retry failed:', bgErr));
                        }
                    });
                };
                if (window.__STARTUP_CLOUD_HYDRATION_TIMER__) clearTimeout(window.__STARTUP_CLOUD_HYDRATION_TIMER__);
                window.__STARTUP_CLOUD_HYDRATION_TIMER__ = scheduleStartupCloudTask(runHydration, { delay: 1400, timeout: 2600 });
            };

            if (isParentLikeUser(this.currentUser)) {
                if (!isLocalOnlySession && (!RAW_DATA || RAW_DATA.length === 0) && typeof loadCloudData === 'function') {
                    scheduleStartupCloudTask(() => {
                        Promise.resolve()
                            .then(() => withTimeout(loadCloudData(), CLOUD_STARTUP_LOAD_TIMEOUT_MS, 'cloud-load-timeout'))
                            .then(() => {
                                if (isParentLikeUser(this.currentUser)) this.renderParentView();
                            })
                            .catch(e => {
                                console.warn('[Auth.login] parent background cloud load timeout/fail:', e);
                                if (typeof loadCloudData === 'function') {
                                    Promise.resolve()
                                        .then(() => loadCloudData())
                                        .then(() => {
                                            if (isParentLikeUser(this.currentUser)) this.renderParentView();
                                        })
                                        .catch(err => console.warn('[Auth.login] parent delayed cloud load failed:', err));
                                }
                            });
                    }, { delay: 250, timeout: 2600 });
                }
                this.renderParentView();
            } else {
                if (typeof renderNavigation === 'function') renderNavigation();
                if (typeof updateSchoolSelect === 'function') updateSchoolSelect();

                if (typeof CohortManager !== 'undefined') {
                    CohortManager.init();
                }
                const restoredCohortId = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
                const restoredExamId = String(CURRENT_EXAM_ID || readWorkspaceExamId() || '').trim();
                const hasReadyWorkspace = !!restoredCohortId
                    && !!restoredExamId
                    && Array.isArray(RAW_DATA)
                    && RAW_DATA.length > 0;
                if (pendingLoginCohortEntry) {
                    setManualCohortSelectionGate(false);
                    const selectedCohortReady = await pendingLoginCohortEntry;
                    if (selectedCohortReady) {
                        tryResumeReadyWorkspace();
                    } else {
                        setManualCohortSelectionGate(true);
                        if (typeof window.showCohortPicker === 'function') window.showCohortPicker();
                    }
                } else {
                    setManualCohortSelectionGate(!hasReadyWorkspace);
                    if (typeof window.showCohortPicker === 'function') window.showCohortPicker();
                }
                if (!pendingLoginCohortEntry && hasReadyWorkspace) {
                    tryResumeReadyWorkspace();
                }


                if (this.currentUser.school) {
                    writeCurrentSchool(this.currentUser.school);

                    const sel = document.getElementById('mySchoolSelect');
                    if (sel) {
                        sel.value = readCurrentSchool();
                        sel.dispatchEvent(new Event('change'));
                    }
                }

                if (this.currentUser.role === 'teacher') {
                    UI.toast(`欢迎您，${this.currentUser.name}老师`, "success");
                }
                else if (this.currentUser.role === 'class_teacher') {
                    UI.toast(`欢迎您，${this.currentUser.class}班班主任`, "success");

                    setTimeout(() => {
                        const clsSel = document.getElementById('studentClassSelect');
                        if (clsSel) {
                            clsSel.value = this.currentUser.class;
                            clsSel.dispatchEvent(new Event('change')); // 触发筛选
                        }
                    }, 500);
                }
                else if (this.currentUser.role === 'grade_director') {

                    UI.toast(`欢迎您，${this.currentUser.class}年级主任`, "success");

                    const msgBtn = document.getElementById('admin-msg-btn');
                    if (msgBtn) msgBtn.style.display = 'block'; // 显示铃铛

                }
                /* 👆👆👆 🟢 结束 🟢 👆👆👆 */

                startBackgroundCloudHydration("正在后台恢复成绩数据...");
            }

        } catch (err) {
            UI.loading(false);
            console.error(err);
            alert("登录异常中断：" + err.message);
        }
    },

    logout: function () {
        logAction('登出', '退出登录');
        AuthState.clearCurrentUser();
        if (window.EdgeGateway && typeof EdgeGateway.clearSession === 'function') {
            EdgeGateway.clearSession();
        }
        location.reload(); // 刷新页面最彻底，清除所有临时状态
    },

    applyRoleView: function () {
        if (!this.currentUser) return;

        RoleManager.applyRolesToBody(this.currentUser);
        applyRoleAllowVisibility(document);
        this.syncParentMobileScrollRoot(isParentLikeUser(this.currentUser));

        const role = this.currentUser.role; // 主角色（兼容旧代码）

        if (role === 'grade_director' && this.currentUser.class) {
            window.USER_GRADE_FILTER = String(this.currentUser.class).trim();
            appDebug(`[权限] 级部主任年级过滤已启用: ${window.USER_GRADE_FILTER}`);
        } else {
            window.USER_GRADE_FILTER = null;
        }

        const msgBtn = document.getElementById('admin-msg-btn');
        if (msgBtn) {
            const canSeeMessages = RoleManager.hasAnyRole(this.currentUser, ['admin', 'director', 'grade_director', 'class_teacher']);

            if (canSeeMessages) {
                msgBtn.style.display = 'block';

                if (typeof IssueManager !== 'undefined') {
                    IssueManager.checkIssues();
                    if (window.msgInterval) clearInterval(window.msgInterval);
                    window.msgInterval = setInterval(() => IssueManager.checkIssues(), 30000);
                }
            } else {
                msgBtn.style.display = 'none';
            }
        }

        let accountActionsContainer = document.getElementById('account-actions');

        if (accountActionsContainer) {
            accountActionsContainer.innerHTML = ''; // 清空重新渲染

            accountActionsContainer.innerHTML = `
                <button class="btn" onclick="openUserPasswordModal()" style="background:transparent; border:none; color:var(--text-color); font-size: 22px; padding: 8px; border-radius: 50%; display:flex; align-items:center; justify-content:center; width:40px; height:40px;" title="修改密码">
                    <i class="ti ti-key"></i>
                </button>
                <div onclick="Auth.logout()" style="cursor:pointer; background:var(--primary); color:white; font-size: 16px; font-weight:bold; border-radius: 50%; display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin-left:8px;" title="退出登录 (${this.currentUser.name})">
                    ${this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
            `;
        }

        const currentRole = this.currentUser.role;
        const allowedRoles = ['admin', 'director', 'grade_director', 'class_teacher'];

        const toolbar = document.querySelector('#main-header > div:last-child');

        const oldBtn = document.getElementById('header-acc-mgr-btn');
        if (oldBtn) oldBtn.remove();

        if (toolbar && allowedRoles.includes(currentRole)) {
            const mgrBtn = document.createElement('button');
            mgrBtn.id = 'header-acc-mgr-btn';
            mgrBtn.className = 'btn';
            mgrBtn.style.cssText = 'background:transparent; border:none; color:var(--text-color); font-size: 22px; padding: 8px; border-radius: 50%; display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px;';
            mgrBtn.innerHTML = '<i class="ti ti-user-cog"></i>';
            mgrBtn.title = "账号权限管理";

            mgrBtn.onclick = () => AccountManager.open();

            const msgBtnNode = document.getElementById('admin-msg-btn');
            if (msgBtnNode && msgBtnNode.parentNode === toolbar) {
                toolbar.insertBefore(mgrBtn, msgBtnNode);
            } else {
                toolbar.insertBefore(mgrBtn, toolbar.firstChild);
            }
        }

        const dataRoles = ['admin', 'director'];

        const oldDataBtn = document.getElementById('header-data-mgr-btn');
        if (oldDataBtn) oldDataBtn.remove();

        if (toolbar && dataRoles.includes(currentRole)) {
            const dataBtn = document.createElement('button');
            dataBtn.id = 'header-data-mgr-btn';
            dataBtn.className = 'btn shell-cloud-data-button';
            dataBtn.style.cssText = 'background:linear-gradient(135deg,#0f766e 0%,#14b8a6 100%); border:none; color:#ffffff; font-size:13px; font-weight:800; padding:9px 14px; border-radius:999px; display:inline-flex; align-items:center; justify-content:center; gap:7px; min-width:96px; height:40px; box-shadow:0 14px 28px rgba(20,184,166,0.22); white-space:nowrap;';
            dataBtn.innerHTML = '<i class="ti ti-cloud-data-connection" style="font-size:18px;"></i><span>云端数据</span>';
            dataBtn.title = "打开云端教务数据管理";

            dataBtn.onclick = () => {
                DataManager.open('cloud');
            };

            toolbar.insertBefore(dataBtn, toolbar.firstChild);
        }

    },

    renderParentView: function () {
        const app = document.getElementById('app');
        const header = document.querySelector('header');
        const nav = document.querySelector('.nav-wrapper');
        const overlay = document.getElementById('login-overlay');
        const loader = document.getElementById('global-loader');

        if (this._parentRenderTimer) {
            clearTimeout(this._parentRenderTimer);
            this._parentRenderTimer = null;
        }

        if (app) app.style.display = 'none'; // 关键：隐藏主应用
        if (header) header.style.display = 'none';
        if (nav) nav.style.display = 'none';
        if (overlay) this.syncLoginOverlayState(false);
        if (loader) loader.classList.add('hidden');

        let container = document.getElementById('parent-view-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'parent-view-container';
            document.body.appendChild(container);
        }

        container.style.display = 'block';
        container.scrollTop = 0;
        this.syncParentMobileScrollRoot(true);

        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes');
        }

        container.innerHTML = `
                <div class="sk-card skeleton"><div class="sk-header"></div></div>
                <div class="sk-card skeleton"><div class="sk-block" style="width:80%"></div></div>
                <div style="display:flex; gap:10px;">
                    <div class="sk-card skeleton" style="flex:1;"><div class="sk-chart"></div></div>
                    <div class="sk-card skeleton" style="flex:1;"><div class="sk-chart"></div></div>
                </div>
            `;

        this._parentRenderTimer = setTimeout(async () => {
            this._parentRenderTimer = null;
            if (!isParentLikeUser(this.currentUser)) return;
            if (!RAW_DATA || RAW_DATA.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:50px; color:#666;">
                        <i class="ti ti-database-off" style="font-size:48px; margin-bottom:10px; display:block;"></i>
                        数据加载中...<br><small>请稍候 (如长时间无反应请刷新)</small>
                    </div>`;

                if (!this._parentRenderRetrying && typeof loadCloudData === 'function') {
                    this._parentRenderRetrying = true;
                    loadCloudData()
                        .then(() => {
                            if (RAW_DATA && RAW_DATA.length > 0) {
                                this.renderParentView();
                            }
                        })
                        .catch(e => {
                            console.warn('家长视图自动重试拉取失败:', e);
                        })
                        .finally(() => {
                            this._parentRenderRetrying = false;
                        });
                }
                return;
            }

            const currentReportStudent = readCurrentReportStudentState();
            const normalizeParentName = typeof normalizeCompareName === 'function'
                ? (value) => normalizeCompareName(value)
                : (value) => String(value || '').replace(/\s+/g, '').toLowerCase();
            const normalizeParentClass = typeof normalizeClass === 'function'
                ? (value) => normalizeClass(value)
                : (value) => String(value || '').replace(/\s+/g, '');
            const stuFromCurrent = currentReportStudent && currentReportStudent.scores && (
                normalizeParentName(currentReportStudent.name || '') === normalizeParentName(this.currentUser?.name || '')
            ) ? currentReportStudent : null;

            const boundStudent = typeof getCurrentBoundStudentFromUser === 'function'
                ? getCurrentBoundStudentFromUser(this.currentUser)
                : null;
            if (!boundStudent && typeof getCurrentBoundStudentFromUser !== 'function') {
                console.warn('[ParentView] getCurrentBoundStudentFromUser is unavailable, fallback to RAW_DATA lookup');
            }
            const stu = stuFromCurrent
                || boundStudent
                || RAW_DATA.find(s =>
                    normalizeParentName(s?.name || '') === normalizeParentName(this.currentUser?.name || '') &&
                    normalizeParentClass(s?.class || '') === normalizeParentClass(this.currentUser?.class || '')
                );

            if (!stu) {
                container.innerHTML = `<div style="text-align:center; padding:50px; color:red;">
                        ❌ 未找到学生【${this.currentUser.name}】（${this.currentUser.class}班）的数据。<br>
                        请联系班主任确认名单是否已上传。
                    </div>`;
                return;
            }

            if (typeof window.ensureReportRenderRuntimeLoaded === 'function') {
                try {
                    await window.ensureReportRenderRuntimeLoaded();
                } catch (error) {
                    console.error('Failed to load report render runtime for parent view:', error);
                    container.innerHTML = `<div style="text-align:center; padding:50px; color:red;">
                        Report runtime failed to load. Please refresh and try again.
                    </div>`;
                    return;
                }
            }

            setCurrentReportStudentState(stu);

            let reportHtml = renderSingleReportCardHTML(stu, 'A4');

            const teacherName = TEACHER_MAP[stu.class + '_班主任'] || '班主任';
            reportHtml = reportHtml.replace(/<input.*id="inp-teacher-name".*?>/, `<span style="font-weight:bold">${teacherName}</span>`);

            const safeName = stu.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeClass = stu.class.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeSchool = stu.school.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            reportHtml += `
                    <div style="text-align:center; margin-top:30px; padding-bottom:80px; border-top:1px dashed #e5e7eb; padding-top:20px;">
                        <p style="font-size:14px; color:#64748b; margin-bottom:15px;">数据有疑问？</p>
                        <!-- 核心修复：使用转义后的变量 -->
                        <button class="btn" style="background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; font-size:16px; padding:10px 20px; margin-bottom:20px;"
                                onclick="IssueManager.openSubmitModal('${safeName}', '${safeClass}', '${safeSchool}')">
                            <i class="ti ti-alert-circle"></i> 申请成绩核查
                        </button>

                        <br>
                        <button onclick="Auth.logout()" style="background:none; border:none; color:#94a3b8; text-decoration:underline; font-size:14px; cursor:pointer;">
                            退出登录
                        </button>
                    </div>
                `;

            container.innerHTML = reportHtml;
            enhanceStudentReportMetrics(container);

            setTimeout(() => {
                try {
                    if (typeof renderRadarChart === 'function') renderRadarChart(stu);
                    if (typeof renderVarianceChart === 'function') renderVarianceChart(stu);
                } catch (e) { console.error("图表渲染失败:", e); }
            }, 200);

        }, 500);
    },

    renderSchoolCheckboxes: function () {
        const container = document.getElementById('admin-gen-school-list');
        this.populateManualSchoolSelect();
        if (!container) return; // 如果找不到容器（比如非管理员），直接返回，不报错

        if (typeof SCHOOLS === 'undefined' || Object.keys(SCHOOLS).length === 0) {
            container.innerHTML = '<div style="color:#999; text-align:center; padding:10px;">暂无数据，请先上传成绩</div>';
            return;
        }

        let html = '';
        Object.keys(SCHOOLS).forEach(sch => {
            html += `
                    <label style="display:flex; align-items:center; margin-bottom:3px; cursor:pointer;">
                        <input type="checkbox" class="gen-school-check" value="${sch}" checked>
                        <span style="margin-left:5px;">${sch}</span>
                    </label>
                `;
        });
        container.innerHTML = html;
    },

    getAccountSchoolOptions: function () {
        const names = new Set();
        if (typeof SCHOOLS !== 'undefined' && SCHOOLS && typeof SCHOOLS === 'object') {
            Object.keys(SCHOOLS).forEach(name => {
                const clean = String(name || '').trim();
                if (clean) names.add(clean);
            });
        }
        if (Array.isArray(RAW_DATA)) {
            RAW_DATA.forEach(row => {
                const clean = String(row?.school || '').trim();
                if (clean) names.add(clean);
            });
        }
        const currentSchool = String(
            this.currentUser?.school
            || MY_SCHOOL
            || (typeof readCurrentSchool === 'function' ? readCurrentSchool() : '')
            || ''
        ).trim();
        if (currentSchool && currentSchool !== '系统') names.add(currentSchool);
        return Array.from(names).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    },

    populateManualSchoolSelect: function () {
        const select = document.getElementById('manual-school');
        if (!select || String(select.tagName || '').toLowerCase() !== 'select') return;
        const previous = String(select.value || '').trim();
        const options = this.getAccountSchoolOptions();
        const htmlEscape = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char]));
        select.innerHTML = '<option value="">选择所属学校</option>' + options
            .map(name => `<option value="${htmlEscape(name)}">${htmlEscape(name)}</option>`)
            .join('');
        if (previous && options.some(name => sameAppSchoolName(name, previous) || name === previous)) {
            const matched = options.find(name => sameAppSchoolName(name, previous) || name === previous);
            select.value = matched || previous;
        } else if (this.currentUser?.school && this.currentUser.school !== '系统') {
            const matched = options.find(name => sameAppSchoolName(name, this.currentUser.school) || name === this.currentUser.school);
            if (matched) select.value = matched;
        }
    },

    toggleAllSchools: function (check) {
        document.querySelectorAll('.gen-school-check').forEach(el => el.checked = check);
    },

    generateRecoverableAccountsForSchools: function (selectedSchools, options = {}) {
        const accountType = options.accountType === 'teacher'
            ? 'teacher'
            : (options.accountType === 'parent' ? 'parent' : 'all');
        const shouldGenerateParents = accountType === 'all' || accountType === 'parent';
        const shouldGenerateTeachers = accountType === 'all' || accountType === 'teacher';
        const schools = Array.isArray(selectedSchools)
            ? Array.from(new Set(selectedSchools.map(item => String(item || '').trim()).filter(Boolean)))
            : [];
        if (!RAW_DATA.length) {
            return { ok: false, error: "请先在【数据中心】上传成绩数据" };
        }
        if (!schools.length) {
            return { ok: false, error: "请至少选择一所学校" };
        }

        let countParentNew = 0;
        let countParentUpd = 0;
        let countTeacherNew = 0;

        const selectedSchoolSet = new Set(schools);
        const targetStudents = RAW_DATA.filter(s => schools.some(school => sameAppSchoolName(school, s.school) || school === s.school));
        if (shouldGenerateParents) {
            targetStudents.forEach(s => {
                const studentSchool = String(s.school || '').trim();
                const existIdx = this.db.parents.findIndex(p =>
                    p.name === s.name
                    && p.class === s.class
                    && (!p.school || sameAppSchoolName(p.school, studentSchool) || p.school === studentSchool)
                );
                const newAccount = {
                    name: s.name,
                    class: s.class,
                    school: studentSchool,
                    pass: createManagedTemporaryPassword('parent'),
                    password_mode: 'temporary',
                    must_change_password: true
                };
                if (existIdx >= 0) {
                    this.db.parents[existIdx] = newAccount;
                    countParentUpd++;
                } else {
                    this.db.parents.push(newAccount);
                    countParentNew++;
                }
            });
        }

        const targetClasses = new Map();
        targetStudents.forEach(s => {
            const cls = String(s.class || '').trim();
            const sch = String(s.school || '').trim();
            if (!cls || !sch) return;
            if (!targetClasses.has(cls)) targetClasses.set(cls, new Set());
            targetClasses.get(cls).add(sch);
        });

        const targetTeachers = new Map();
        if (shouldGenerateTeachers && Object.keys(TEACHER_MAP).length > 0) {
            Object.entries(TEACHER_MAP).forEach(([key, teacherName]) => {
                const [cls] = key.split('_');
                if (!targetClasses.has(cls) || !teacherName) return;
                const explicitSchool = String((TEACHER_SCHOOL_MAP || {})[key] || '').trim();
                const candidateSchools = explicitSchool
                    ? [explicitSchool]
                    : Array.from(targetClasses.get(cls) || []);
                candidateSchools.forEach(schoolName => {
                    const inSelected = Array.from(selectedSchoolSet).some(selected => sameAppSchoolName(selected, schoolName) || selected === schoolName);
                    if (!inSelected) return;
                    const teacherKey = String(teacherName || '').trim();
                    if (teacherKey && !targetTeachers.has(teacherKey)) targetTeachers.set(teacherKey, schoolName);
                });
            });
        } else if (shouldGenerateTeachers) {
            console.warn("未配置教师任课表，仅能生成家长账号");
        }

        if (shouldGenerateTeachers) {
            targetTeachers.forEach((schoolName, tName) => {
                const existIdx = this.db.teachers.findIndex(t =>
                    t.name === tName
                    && (!t.school || sameAppSchoolName(t.school, schoolName) || t.school === schoolName)
                );
                const newAccount = {
                    name: tName,
                    school: schoolName,
                    pass: createManagedTemporaryPassword('teacher'),
                    password_mode: 'temporary',
                    must_change_password: true,
                    grade: 'all'
                };
                if (existIdx >= 0) {
                    this.db.teachers[existIdx] = {
                        ...this.db.teachers[existIdx],
                        school: schoolName,
                        pass: createManagedTemporaryPassword('teacher'),
                        password_mode: 'temporary',
                        must_change_password: true,
                        grade: this.db.teachers[existIdx].grade || 'all'
                    };
                } else {
                    this.db.teachers.push(newAccount);
                    countTeacherNew++;
                }
            });
        }

        if (options.persist !== false) {
            this.db = persistLocalAuthDb(this.db);
        }

        return {
            ok: true,
            selectedSchools: schools,
            parentNew: countParentNew,
            parentReset: countParentUpd,
            teacherNew: countTeacherNew,
            teacherTouched: targetTeachers.size,
            targetStudentCount: targetStudents.length,
            accountType
        };
    },

    generateAccounts: function (accountType = 'all') {
        if (!RAW_DATA.length) return alert("请先在【数据中心】上传成绩数据");

        const checkboxes = document.querySelectorAll('.gen-school-check:checked');
        const selectedSchools = Array.from(checkboxes).map(cb => cb.value);

        if (selectedSchools.length === 0) {
            return alert("请至少勾选一所学校！\n(如果列表为空，请先上传数据)");
        }

        const normalizedType = accountType === 'teacher' ? 'teacher' : (accountType === 'parent' ? 'parent' : 'all');
        const typeLabel = normalizedType === 'teacher' ? '教师' : (normalizedType === 'parent' ? '家长' : '教师+家长');
        const scopeText = normalizedType === 'teacher'
            ? '仅生成/更新选中学校相关班级的老师账号。'
            : (normalizedType === 'parent'
                ? '仅生成/更新选中学校学生对应的家长账号。'
                : '仅生成/更新选中学校的学生和老师账号。');
        if (!confirm(`⚠️ 确定要为选中的 [${selectedSchools.length}] 所学校生成【${typeLabel}】账号吗？\n\n1. ${scopeText}\n2. 未选中学校的现有账号将【保留】。\n3. 系统会生成一次性临时密码，账号首次登录后必须改密。`)) return;
        const generation = this.generateRecoverableAccountsForSchools(selectedSchools, { persist: true, accountType: normalizedType });
        if (!generation.ok) {
            return alert(`❌ ${generation.error}`);
        }

        let msg = `✅ 操作完成！\n\n`;
        msg += `覆盖学校：${generation.selectedSchools.join(', ')}\n`;
        if (normalizedType !== 'teacher') msg += `家长账号：新增 ${generation.parentNew} / 重置 ${generation.parentReset}\n`;
        if (normalizedType !== 'parent') msg += `教师账号：新增 ${generation.teacherNew} / 涉及 ${generation.teacherTouched}\n`;
        msg += `\n(提示：未选中学校的旧账号已自动保留)`;

        alert(msg);

        if (window.UI) UI.toast(`✅ ${typeLabel}账号生成操作完成`, "success");
    },

    generateTeacherAccounts: function () {
        return this.generateAccounts('teacher');
    },

    generateParentAccounts: function () {
        return this.generateAccounts('parent');
    },


    exportAccounts: function () {
        if (!this.db.teachers.length && !this.db.parents.length) {
            return alert("当前没有生成任何普通账号，请先点击“一键生成”。");
        }

        const checkboxes = document.querySelectorAll('.gen-school-check:checked');
        const selectedSchools = Array.from(checkboxes).map(cb => cb.value);

        const isFiltering = selectedSchools.length > 0;

        const wb = XLSX.utils.book_new();
        const data = [['角色', '用户名/姓名', '登录班级 (家长必填)', '密码', '所属学校/备注']];

        data.push(['管理员', 'admin', '-', MASKED_PASSWORD_DISPLAY, '最高权限（明文口令不导出）']);
        const dirPass = MASKED_PASSWORD_DISPLAY;
        data.push(['教务主任', 'director', '-', dirPass, '查看除账号外所有信息']);

        let validClasses = new Set();   // 选中学校包含的所有班级

        if (isFiltering) {
            RAW_DATA.forEach(s => {
                if (selectedSchools.some(school => sameAppSchoolName(school, s.school) || school === s.school)) {
                    validClasses.add(s.class);
                }
            });
        }

        let teacherCount = 0;
        this.db.teachers.forEach(t => {
            let shouldExport = true;
            if (isFiltering) {
                let isRelevant = t.school
                    ? selectedSchools.some(school => sameAppSchoolName(school, t.school) || school === t.school)
                    : false;
                for (const [key, tName] of Object.entries(TEACHER_MAP)) {
                    if (isRelevant) break;
                    if (tName === t.name) {
                        const [cls, sub] = key.split('_');
                        const teacherSchool = String((TEACHER_SCHOOL_MAP || {})[key] || '').trim();
                        const schoolMatches = !teacherSchool
                            || selectedSchools.some(school => sameAppSchoolName(school, teacherSchool) || school === teacherSchool);
                        if (validClasses.has(cls) && schoolMatches) {
                            isRelevant = true;
                            break;
                        }
                    }
                }
                shouldExport = isRelevant;
            }

            if (shouldExport) {
                data.push(['教师', t.name, '-', getRecoverableManagedPassword(t, 'teacher'), `${isFiltering ? '关联选中学校；' : ''}首次登录后必须改密`]);
                teacherCount++;
            }
        });

        let parentCount = 0;
        this.db.parents.forEach(p => {
            let shouldExport = true;
            let schoolName = String(p.school || '').trim();

            const stuRecord = RAW_DATA.find(r =>
                r.name === p.name
                && r.class === p.class
                && (!schoolName || sameAppSchoolName(r.school, schoolName) || r.school === schoolName)
            );
            if (stuRecord) schoolName = stuRecord.school;

            if (isFiltering) {
                if (schoolName && selectedSchools.some(school => sameAppSchoolName(school, schoolName) || school === schoolName)) {
                    shouldExport = true;
                } else {
                    shouldExport = false;
                }
            }

            if (shouldExport) {
                data.push(['家长', p.name, p.class, getRecoverableManagedPassword(p, 'parent'), `${schoolName || '未知/已删除'}；首次登录后必须改密`]);
                parentCount++;
            }
        });

        this.db = persistLocalAuthDb(this.db);

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];

        let fileName = `账号清单_${new Date().toLocaleDateString()}.xlsx`;
        if (isFiltering) {
            if (selectedSchools.length === 1) fileName = `${selectedSchools[0]}_账号清单.xlsx`;
            else fileName = `特定学校账号清单(共${selectedSchools.length}校).xlsx`;
        }

        XLSX.utils.book_append_sheet(wb, ws, "账号列表");
        XLSX.writeFile(wb, fileName);

        /*
        if (isFiltering) {
            alert(`✅ 已导出选定范围的账号：\n教师: ${teacherCount} 人\n家长: ${parentCount} 人`);
        }
        */
    },


    addCloudAccount: async function () {
        const role = document.getElementById('manual-role').value;
        const username = document.getElementById('manual-name').value.trim();
        const password = document.getElementById('manual-pass').value.trim();
        const school = document.getElementById('manual-school').value.trim();

        const classInput = document.getElementById('manual-class');
        const gradeInput = document.getElementById('manual-grade');

        let className = "";

        if (role === 'parent' || role === 'class_teacher') {
            if (classInput) className = classInput.value.trim();
        }
        else if (role === 'grade_director') {
            if (gradeInput) className = gradeInput.value.trim();
        }
        else if (role === 'teacher') {
            className = "教师";
        }

        if (!username || !password) return alert("❌ 请填写账号和密码");
        if (password.length < 8) return alert("❌ 临时密码至少需要 8 位，并将在首次登录后强制修改。");

        if (role !== 'admin' && !school) return alert("❌ 请填写所属学校");

        if ((role === 'parent' || role === 'class_teacher') && !className) {
            return alert("❌ 请填写【班级】(例如: 701)");
        }
        if (role === 'grade_director' && !className) {
            return alert("❌ 请填写【级部/年级】(例如: 7)");
        }

        if (!window.EdgeGateway || typeof EdgeGateway.upsertAccounts !== 'function') {
            return alert("❌ 账号网关未就绪，请稍后重试。");
        }

        UI.loading(true, "正在写入账号库...");

        const newUserData = {
            username: username,
            password: password,
            role: role,
            school: role === 'admin' ? '系统' : school, // 管理员默认学校
            class_name: className // 这是一个复用字段：对家长/班主任是班级，对级部主任是年级
        };

        let error = null;
        try {
            await EdgeGateway.upsertAccounts([newUserData]);
        } catch (e) {
            error = e;
        }

        UI.loading(false);

        if (error) {
            console.error(error);
            alert("❌ 操作失败：" + (error.message || error));
        } else {
            UI.toast(`✅ 账号 [${username}] 已添加/更新成功！`, "success");
            if (typeof this.refreshCloudAccountMigrationStatus === 'function') {
                this.refreshCloudAccountMigrationStatus();
            }
            document.getElementById('manual-name').value = '';
            if (role !== 'parent') {
                if (classInput) classInput.value = '';
                if (gradeInput) gradeInput.value = '';
            }
        }
    },
    buildRecoverableCloudAccountRows: function () {
        const parents = this.db.parents || [];
        const teachers = this.db.teachers || [];
        const uniqueMap = new Map(); // key: username, value: dataObj
        const globalDefaultSchool = window.MY_SCHOOL || "默认学校";

        const getSchool = (name, cls, storedSchool = '') => {
            const cleanStoredSchool = String(storedSchool || '').trim();
            if (cleanStoredSchool) return cleanStoredSchool;
            if (typeof RAW_DATA !== 'undefined') {
                const s = RAW_DATA.find(r => r.name === name && r.class == cls);
                if (s) return s.school;
            }
            return globalDefaultSchool;
        };

        const cleanStr = (str) => String(str || "").trim().replace(/\s+/g, "");

        parents.forEach(p => {
            const user = cleanStr(p.name);
            if (!user) return;

            uniqueMap.set(user, {
                username: user,
                password: cleanStr(getRecoverableManagedPassword(p, 'parent')),
                role: 'parent',
                school: getSchool(p.name, p.class, p.school),
                class_name: cleanStr(p.class) // 班级
            });
        });

        const teaSchMap = {};
        if (typeof TEACHER_MAP !== 'undefined') {
            Object.entries(TEACHER_MAP).forEach(([k, v]) => {
                const cls = k.split('_')[0];
                if (typeof SCHOOLS !== 'undefined') {
                    for (let sName in SCHOOLS) {
                        const schoolRecord = getAppSchoolRecord(sName);
                        if ((schoolRecord?.students || []).some(s => s.class == cls)) {
                            teaSchMap[v] = sName; break;
                        }
                    }
                }
            });
        }

        teachers.forEach(t => {
            const user = cleanStr(t.name);
            if (!user) return;

            uniqueMap.set(user, { // 写入 Map，自动覆盖同名 Key
                username: user,
                password: cleanStr(getRecoverableManagedPassword(t, 'teacher')),
                role: 'teacher',
                school: cleanStr(t.school) || teaSchMap[t.name] || globalDefaultSchool,
                class_name: '教师',
                teacher_name: user
            });
        });

        this.db = persistLocalAuthDb(this.db);

        return {
            parents,
            teachers,
            batchData: Array.from(uniqueMap.values())
        };
    },

    uploadRecoverableCloudAccounts: async function (batchData) {
        if (!window.EdgeGateway || typeof EdgeGateway.upsertAccounts !== 'function') {
            throw new Error("账号网关未就绪，请稍后重试。");
        }
        const safeRows = Array.isArray(batchData) ? batchData : [];
        if (!safeRows.length) {
            return { successCount: 0, failCount: 0, errorDetails: [] };
        }

        appDebug(`[同步准备] 去重后:${safeRows.length}`);

        const BATCH_SIZE = 10; // 保守批次大小
        let successCount = 0;
        let failCount = 0;
        let errorDetails = [];

        const uploadOneByOne = async (items) => {
            let ok = 0;
            for (let item of items) {
                try {
                    await EdgeGateway.upsertAccounts([item]);
                    ok++;
                    successCount++;
                } catch (error) {
                    console.warn(`❌ 单条写入失败 [${item.username}]:`, error?.message || error);
                    failCount++;
                    errorDetails.push(`${item.username}: ${error?.message || error}`);
                }
            }
            return ok;
        };

        for (let i = 0; i < safeRows.length; i += BATCH_SIZE) {
            const chunk = safeRows.slice(i, i + BATCH_SIZE);

            const pct = Math.round(((i + chunk.length) / safeRows.length) * 100);
            try {
                await EdgeGateway.upsertAccounts(chunk);
                successCount += chunk.length;
            } catch (error) {
                console.warn(`⚠️ 批次 ${Math.ceil(i / BATCH_SIZE) + 1} 报错 (HTTP 500/409)，自动降级为单条上传模式...`);
                await uploadOneByOne(chunk);
            }

            UI.loading(true, `☁️ 同步中... ${pct}% (成功:${successCount} / 失败:${failCount})`);
            if (failCount > 50) throw new Error("错误过多，中止上传"); // 熔断机制
            await new Promise(r => setTimeout(r, 50));
        }

        return { successCount, failCount, errorDetails };
    },

    syncBatchToCloud: async function () {
        const payload = this.buildRecoverableCloudAccountRows();
        const parents = payload.parents || [];
        const teachers = payload.teachers || [];
        const batchData = payload.batchData || [];

        if (parents.length === 0 && teachers.length === 0) {
            return alert("⚠️ 本地账号为空！请先点击【👤 一键生成所有账号】。");
        }

        if (!confirm(`⚠️ 准备同步账号到云端：\n\n👨‍👩‍👧 家长：${parents.length}\n👨‍🏫 教师：${teachers.length}\n\n确定覆盖云端数据吗？`)) return;

        UI.loading(true, "正在清洗并去重数据...");

        try {
            const result = await this.uploadRecoverableCloudAccounts(batchData);
            UI.loading(false);

            if (result.failCount > 0) {
                console.error("失败详情:", result.errorDetails);
                alert(`⚠️ 同步完成，但有 ${result.failCount} 个账号失败！\n\n✅ 成功：${result.successCount}\n❌ 失败：${result.failCount}\n\n可能原因：账号包含非法字符或数据库字段超长。\n按 F12 查看控制台可看具体失败名单。`);
            } else {
                UI.toast(`✅ 完美同步！共 ${result.successCount} 个账号已上线`, "success");
                if (window.Logger) Logger.log('同步账号', `同步了 ${result.successCount} 个账号`);
            }

            if (typeof this.refreshCloudAccountMigrationStatus === 'function') {
                this.refreshCloudAccountMigrationStatus();
            }

        } catch (e) {
            UI.loading(false);
            console.error(e);
            alert("❌ 同步中断：" + e.message);
        }
    },

    migrateRecoverableAccountsToCloud: async function () {
        const payload = this.buildRecoverableCloudAccountRows();
        const batchData = payload.batchData || [];

        if (!batchData.length) {
            this.setCloudAccountMigrationInlineMessage(
                '当前浏览器没有本地可恢复账号。这个按钮只会补迁本浏览器已保存的老师/家长账号，不会直接重置云端现有密码。请先点击上方“生成账号”或“一键同步所有账号到云端”。',
                'warning'
            );
            return alert("⚠️ 当前浏览器还没有可恢复密码的老师/家长账号。\n\n请先导入或生成账号，或改用“管理员/主任登录一次、后台改密一次”的方式完成迁移。");
        }

        const roleSummary = `👨‍👩‍👧 家长：${(payload.parents || []).length}\n👨‍🏫 教师：${(payload.teachers || []).length}\n🔐 可补迁账号：${batchData.length}`;
        const ok = confirm(`⚠️ 准备将本地可恢复密码的账号批量补迁到 Cloudflare。\n\n${roleSummary}\n\n说明：\n1. 只会补迁本地能恢复密码的账号\n2. 管理员/主任若未回填，仍需登录一次或后台改密\n3. 同名账号会直接更新为 Cloudflare 哈希\n\n是否继续？`);
        if (!ok) return;

        UI.loading(true, "正在补迁本地可恢复账号...");
        try {
            const result = await this.uploadRecoverableCloudAccounts(batchData);
            UI.loading(false);

            if (result.failCount > 0) {
                console.error("失败详情:", result.errorDetails);
                alert(`⚠️ 补迁完成，但有 ${result.failCount} 个账号失败！\n\n✅ 成功：${result.successCount}\n❌ 失败：${result.failCount}`);
            } else {
                UI.toast(`✅ 已补迁 ${result.successCount} 个本地可恢复账号`, "success");
            }

            if (window.Logger) {
                Logger.log('补迁账号', `从本地密码库补迁了 ${result.successCount} 个可恢复账号到 Cloudflare`);
            }
            if (typeof this.refreshCloudAccountMigrationStatus === 'function') {
                this.refreshCloudAccountMigrationStatus();
            }
        } catch (error) {
            UI.loading(false);
            console.error(error);
            alert("❌ 补迁失败：" + (error?.message || error));
        }
    },

    deleteCloudAccounts: async function () {
        if (!window.EdgeGateway || typeof EdgeGateway.deleteManagedAccounts !== 'function') {
            return alert("❌ 账号网关未就绪，请稍后重试。");
        }

        if (!confirm("⚠️【高风险操作】⚠️\n\n您确定要清空云端数据库中的所有【家长】和【教师】账号吗？\n\n注意：\n1. 此操作不可撤销！\n2. 管理员账号会被保留，不会被删除。\n3. 删除后用户将无法登录，直到您再次同步。")) {
            return;
        }

        const input = prompt("🔴 请输入 '确认删除' 四个字以执行清空操作：");
        if (input !== "确认删除") {
            return alert("操作已取消。");
        }

        UI.loading(true, "正在清理云端账号库...");

        try {
            const { count } = await EdgeGateway.deleteManagedAccounts();

            UI.loading(false);

            alert(`✅ 清理完成！\n共删除了 ${count !== null ? count : '若干'} 个云端账号。\n\n现在您可以重新生成并同步新名单了。`);

            Logger.log('清空账号', `管理员执行了清空云端普通账号操作 (影响:${count}人)`);
            if (typeof this.refreshCloudAccountMigrationStatus === 'function') {
                this.refreshCloudAccountMigrationStatus();
            }

        } catch (e) {
            UI.loading(false);
            console.error(e);
            alert("❌ 删除失败：" + e.message);
        }
    },

    exportAllCloudAccounts: async function () {
        if (!window.EdgeGateway || typeof EdgeGateway.exportAccounts !== 'function') {
            return alert("❌ 账号网关未就绪，无法导出。");
        }

        if (!confirm("⚠️ 准备从云端下载所有账号数据。\n\n这将包含数据库中存储的：\n1. 管理员\n2. 教师/班主任/主任\n3. 家长/学生\n\n确定要导出吗？")) return;

        UI.loading(true, "正在从云端拉取所有账号...");

        try {
            const { records: data } = await EdgeGateway.exportAccounts();

            if (!data || data.length === 0) {
                throw new Error("云端数据库为空，没有账号可导出。");
            }

            const headers = ['角色', '学校', '班级/范围', '账号/姓名', '密码状态'];
            const excelData = [headers];

            const roleMap = {
                'admin': '👑 管理员',
                'director': '🎓 教务主任',
                'grade_director': '🚀 级部主任',
                'class_teacher': '📋 班主任',
                'teacher': '👨‍🏫 科任教师',
                'parent': '👨‍👩‍👧 家长/学生'
            };

            data.forEach(u => {
                const roleName = roleMap[u.role] || u.role;
                excelData.push([
                    roleName,
                    u.school || '-',       // 学校
                    u.class_name || '-',   // 班级
                    u.username,            // 账号
                    getManagedPasswordStatus(u)
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(excelData);

            ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];

            XLSX.utils.book_append_sheet(wb, ws, "云端全量账号");

            const fileName = `云端全量账号备份_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);

            UI.loading(false);
            UI.toast(`✅ 导出成功！共 ${data.length} 条数据`, "success");

        } catch (err) {
            UI.loading(false);
            console.error(err);
            alert("❌ 导出失败: " + err.message);
        }
    },

    formatCloudAccountMigrationRoleLabel: function (role) {
        const roleMap = {
            admin: '管理员',
            director: '教务主任',
            grade_director: '级部主任',
            class_teacher: '班主任',
            teacher: '教师',
            parent: '家长/学生'
        };
        return roleMap[String(role || '').trim()] || String(role || '未知角色').trim() || '未知角色';
    },

    renderCloudAccountMigrationStatus: function (payload) {
        const summaryEl = document.getElementById('cloud-account-migration-status');
        const updatedEl = document.getElementById('cloud-account-migration-updated');
        if (!summaryEl) return;

        const summary = payload && payload.summary ? payload.summary : {};
        const total = Number(summary.total_accounts || 0);
        const migrated = Number(summary.migrated_accounts || 0);
        const pending = Number(summary.pending_accounts || 0);
        const rate = Number(summary.completion_rate || 0);
        const roles = Array.isArray(payload?.roles) ? payload.roles : [];
        const sources = Array.isArray(payload?.sources) ? payload.sources : [];

        const roleRows = roles.slice(0, 6).map((row) => {
            const label = this.formatCloudAccountMigrationRoleLabel(row.role);
            const roleMigrated = Number(row.migrated_accounts || 0);
            const roleTotal = Number(row.total_accounts || 0);
            return `<div style="display:flex; justify-content:space-between; gap:10px;"><span>${label}</span><span>${roleMigrated}/${roleTotal}</span></div>`;
        }).join('');

        const sourceText = sources.slice(0, 3).map((row) => {
            const labelMap = {
                pending: '待迁移',
                supabase_export: '历史导入待激活',
                supabase_login: '旧登录回填',
                legacy_login_backfill: '旧登录回填',
                cloudflare_upsert: '云端同步',
                cloudflare_reset: '后台重置',
                cloudflare_change: '用户改密'
            };
            const label = labelMap[String(row.password_source || '').trim()] || String(row.password_source || 'unknown').trim();
            return `${label} ${Number(row.account_count || 0)} 个`;
        }).join(' / ');

        summaryEl.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin-bottom:10px;">
                <div style="background:white; border-radius:8px; padding:10px; border:1px solid #dbeafe;">
                    <div style="font-size:11px; color:#64748b;">活跃账号</div>
                    <div style="font-size:18px; font-weight:700; color:#0f172a;">${total}</div>
                </div>
                <div style="background:white; border-radius:8px; padding:10px; border:1px solid #dbeafe;">
                    <div style="font-size:11px; color:#64748b;">已迁移</div>
                    <div style="font-size:18px; font-weight:700; color:#166534;">${migrated}</div>
                </div>
                <div style="background:white; border-radius:8px; padding:10px; border:1px solid #dbeafe;">
                    <div style="font-size:11px; color:#64748b;">待迁移</div>
                    <div style="font-size:18px; font-weight:700; color:#b45309;">${pending}</div>
                </div>
            </div>
            <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:4px;">
                    <span>旧登录回退收口进度</span>
                    <span>${rate.toFixed(1)}%</span>
                </div>
                <div style="height:8px; border-radius:999px; background:#dbeafe; overflow:hidden;">
                    <div style="height:100%; width:${Math.max(0, Math.min(rate, 100))}%; background:linear-gradient(90deg,#2563eb,#16a34a);"></div>
                </div>
            </div>
            <div style="display:grid; gap:4px; font-size:12px; color:#334155; margin-bottom:8px;">
                ${roleRows || '<div>暂无角色分布数据</div>'}
            </div>
            <div style="font-size:12px; color:#64748b;">
                ${sourceText || '待迁移账号会在首次成功登录、后台重置密码或重新同步账号后自动补迁到 Cloudflare。'}
            </div>
        `;

        if (updatedEl) {
            updatedEl.textContent = `最近刷新：${new Date().toLocaleString()}`;
        }
    },

    setCloudAccountMigrationInlineMessage: function (message, tone = 'info') {
        const summaryEl = document.getElementById('cloud-account-migration-status');
        const updatedEl = document.getElementById('cloud-account-migration-updated');
        if (!summaryEl) return;
        const colorMap = {
            info: '#475569',
            warning: '#b45309',
            error: '#b91c1c',
            success: '#166534'
        };
        summaryEl.innerHTML = `<div style="font-size:13px; color:${colorMap[tone] || colorMap.info}; line-height:1.8;">${String(message || '').trim()}</div>`;
        if (updatedEl) {
            updatedEl.textContent = `最近提示：${new Date().toLocaleString()}`;
        }
    },

    refreshCloudAccountMigrationStatus: async function () {
        const summaryEl = document.getElementById('cloud-account-migration-status');
        const updatedEl = document.getElementById('cloud-account-migration-updated');
        if (!summaryEl) return;
        const canUseWorkerStatus = typeof shouldUseCloudProxy === 'function'
            ? shouldUseCloudProxy()
            : (typeof shouldUseSupabaseProxy === 'function'
                ? shouldUseSupabaseProxy()
                : (typeof shouldUseSameOriginCloudProxy === 'function'
                    ? shouldUseSameOriginCloudProxy()
                    : (typeof shouldUseSameOriginSupabaseProxy === 'function'
                        ? shouldUseSameOriginSupabaseProxy()
                        : false)));
        if (!canUseWorkerStatus) {
            summaryEl.innerHTML = '<span style="color:#64748b;">本地开发或离线环境下不显示迁移看板，请在线上域名查看 Cloudflare 迁移进度。</span>';
            if (updatedEl) updatedEl.textContent = '当前环境不支持';
            return;
        }
        if (!window.EdgeGateway || typeof EdgeGateway.getAccountMigrationStatus !== 'function') {
            summaryEl.innerHTML = '<span style="color:#b91c1c;">账号网关未就绪，暂时无法读取迁移状态。</span>';
            return;
        }

        summaryEl.innerHTML = '<span style="color:#475569;">正在读取 Cloudflare 迁移状态...</span>';
        if (updatedEl) updatedEl.textContent = '刷新中...';

        try {
            const payload = await EdgeGateway.getAccountMigrationStatus();
            this.renderCloudAccountMigrationStatus(payload || {});
        } catch (error) {
            console.warn(error);
            summaryEl.innerHTML = `<span style="color:#b91c1c;">读取失败：${error?.message || error}</span>`;
            if (updatedEl) updatedEl.textContent = '刷新失败';
        }
    },

    clearAccounts: function () {
        if (!confirm("⚠️ 确定清空所有教师和家长账号吗？\n(管理员密码不会被清除)")) return;
        this.db.teachers = [];
        this.db.parents = [];
        this.db = persistLocalAuthDb(this.db);
        alert("✅ 所有普通账号已清空");
    }
};

window.Auth = Auth;
Auth.ensureLoginWorkbench();
Auth.syncLoginPortalUI();

if (typeof window.markAuthReadyResolved === 'function') {
    window.markAuthReadyResolved();
    appDebug('[app] AuthReady signaled to portal');
} else if (typeof window.resolveAuthReady === 'function') {
    window.__AUTH_READY__ = true;
    window.resolveAuthReady();
    appDebug('[app] AuthReady signaled to portal');
}
window.openAdminCloudAccountModal = function () {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.style.display = 'flex';
    if (window.Auth && typeof window.Auth.renderSchoolCheckboxes === 'function') {
        window.Auth.renderSchoolCheckboxes();
    }
    if (window.Auth && typeof window.Auth.refreshCloudAccountMigrationStatus === 'function') {
        window.Auth.refreshCloudAccountMigrationStatus();
    }
};

window.RoleManager = {
    getUserRoles: function (user) {
        return AuthState.getUserRoles(user);
    },
    hasRole: function (user, roleName) {
        return AuthState.hasRole(user, roleName);
    },
    hasAnyRole: function (user, roleNames) {
        return AuthState.hasAnyRole(user, roleNames);
    },
    hasAllRoles: function (user, roleNames) {
        return AuthState.hasAllRoles(user, roleNames);
    },
    getPrimaryRole: function (user) {
        return AuthState.getPrimaryRole(user);
    },
    applyRolesToBody: function (user) {
        const primaryRole = AuthState.applyRolesToBody(user);
        if (user) {
            const roles = AuthState.getUserRoles(user);
            appDebug(`🎭 用户角色：${roles.join(', ')} (主角色：${primaryRole})`);
        }
    },

    addRoleToCurrentUser: function (roleName) {
        if (!Auth.currentUser) {
            console.error('❌ 没有登录用户');
            return;
        }

        const currentRoles = this.getUserRoles(Auth.currentUser);
        if (currentRoles.includes(roleName)) {
            console.warn(`⚠️ 用户已拥有角色: ${roleName}`);
            return;
        }

        const newRoles = [...currentRoles, roleName];
        Auth.currentUser.roles = newRoles;

        AuthState.setCurrentUser(Auth.currentUser);

        this.applyRolesToBody(Auth.currentUser);

        if (typeof updateRoleHint === 'function') {
            updateRoleHint();
        }

        appDebug(`✅ 已添加角色 ${roleName}，当前角色：${newRoles.join(', ')}`);
        appDebug('💡 提示：这只是临时测试，刷新页面后会恢复。要永久设置，请在数据库中修改用户数据。');
    },

    showCurrentPermissions: function () {
        const user = Auth.currentUser;
        if (!user) {
            appDebug('❌ 没有登录用户');
            return;
        }

        const roles = this.getUserRoles(user);
        appDebug('%c当前用户权限信息', 'color: #10b981; font-weight: bold; font-size: 16px;');
        appDebug('用户名:', user.name);
        appDebug('所有角色:', roles.join(', '));
        appDebug('主角色:', this.getPrimaryRole(user));
        appDebug('\n权限检查示例:');
        appDebug('- 是否是管理员:', this.hasRole(user, 'admin'));
        appDebug('- 是否是教师类角色:', this.hasAnyRole(user, ['teacher', 'class_teacher']));
        appDebug('- 是否是管理类角色:', this.hasAnyRole(user, ['admin', 'director', 'grade_director']));
    }
};

window.alert = function (msg, icon = 'info') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            text: msg,
            icon: (msg.includes('成功') || msg.includes('✅')) ? 'success' : ((msg.includes('失败') || msg.includes('错误')) ? 'error' : 'info'),
            confirmButtonColor: '#4f46e5',
            timer: 2000,
            timerProgressBar: true
        });
    } else {
        UI.toast(msg);
    }
};


if (!window.originalConfirm) window.originalConfirm = window.confirm;

window.confirm = function (msg) {

    return window.originalConfirm ? window.originalConfirm(msg) : true;
};

if (!window.originalConfirm) window.originalConfirm = window.confirm;
