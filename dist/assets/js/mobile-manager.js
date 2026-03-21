(() => {
    if (typeof window === 'undefined' || window.__MOBILE_MANAGER_PATCHED__) return;

    const MOBILE_BREAKPOINT = 960;
    const REFRESH_DELAYS = [80, 260, 900];
    const SHORTCUT_ORDER = [
        'starter-hub',
        'summary',
        'teacher-analysis',
        'student-details',
        'progress-analysis',
        'report-generator',
        'teaching-warning-center',
        'teaching-rectify-center',
        'analysis',
        'class-comparison'
    ];
    const ROLE_LABELS = {
        admin: '管理员',
        director: '校级管理',
        grade_director: '级部主任',
        class_teacher: '班主任',
        teacher: '教师',
        parent: '家长',
        student: '学生',
        guest: '访客'
    };
    const HOME_BY_ROLE = {
        admin: 'starter-hub',
        director: 'starter-hub',
        grade_director: 'starter-hub',
        class_teacher: 'student-details',
        teacher: 'teacher-analysis'
    };
    const MESSAGE_ROLES = ['admin', 'director', 'grade_director', 'class_teacher'];
    const ACCOUNT_MANAGER_ROLES = ['admin', 'director', 'grade_director', 'class_teacher'];
    const DATA_MANAGER_ROLES = ['admin', 'director'];

    let currentSheetMode = '';

    function getEffectiveViewportWidth() {
        const candidates = [
            Number(window.innerWidth || 0),
            Number(document.documentElement?.clientWidth || 0),
            Number(window.outerWidth || 0),
            Number(window.screen?.width || 0),
            Number(window.screen?.availWidth || 0)
        ].filter(value => Number.isFinite(value) && value > 0);
        return candidates.length ? Math.min(...candidates) : 0;
    }

    function isMobileViewport() {
        return getEffectiveViewportWidth() <= MOBILE_BREAKPOINT;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function stripEmoji(text) {
        return String(text || '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').replace(/\s+/g, ' ').trim();
    }

    function getCurrentUser() {
        if (window.Auth && window.Auth.currentUser) return window.Auth.currentUser;
        try {
            const raw = sessionStorage.getItem('CURRENT_USER');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function getCurrentRole() {
        return String(getCurrentUser()?.role || document.body.dataset.role || 'guest').trim() || 'guest';
    }

    function getCurrentRoles() {
        const user = getCurrentUser();
        const rawRoles = Array.isArray(user?.roles) && user.roles.length ? user.roles : [user?.role].filter(Boolean);
        return rawRoles.map(role => String(role || '').trim()).filter(Boolean);
    }

    function hasRole(allowedRoles) {
        const roleSet = new Set(getCurrentRoles());
        return allowedRoles.some(role => roleSet.has(role));
    }

    function getCurrentSchool() {
        return String(
            getCurrentUser()?.school ||
            window.MY_SCHOOL ||
            localStorage.getItem('MY_SCHOOL') ||
            ''
        ).trim();
    }

    function humanizeRole(role) {
        return ROLE_LABELS[String(role || '').trim()] || String(role || '访客');
    }

    function getNavStructure() {
        if (window.NAV_STRUCTURE) return window.NAV_STRUCTURE;
        try {
            return NAV_STRUCTURE;
        } catch {
            return null;
        }
    }

    function getCurrentCategoryKey() {
        if (typeof window.getCurrentNavCategory === 'function') {
            return String(window.getCurrentNavCategory() || '').trim();
        }
        try {
            return String(currentCategory || '').trim();
        } catch {
            return '';
        }
    }

    function switchCategoryKey(key) {
        if (!key) return;
        if (typeof window.switchNavCategory === 'function') {
            window.switchNavCategory(key);
            return;
        }
        try {
            if (typeof switchCategory === 'function') switchCategory(key);
        } catch {
            // ignore
        }
    }

    function canUseModule(id) {
        const role = getCurrentRole();
        if ((role === 'teacher' || role === 'class_teacher') && typeof window.canAccessModule === 'function' && !window.canAccessModule(id)) {
            return false;
        }
        if (role === 'teacher' && ['single-school-eval', 'exam-arranger', 'freshman-simulator'].includes(id)) {
            return false;
        }
        if (id === 'report-generator' && typeof window.CONFIG !== 'undefined' && window.CONFIG && !window.CONFIG.showQuery) {
            return false;
        }
        return true;
    }

    function getAllowedCategories() {
        const nav = getNavStructure();
        if (!nav) return [];

        const role = getCurrentRole();
        const isRestricted = ['teacher', 'class_teacher'].includes(role);
        const isTeacherRole = isRestricted;

        return Object.keys(nav).filter((key) => {
            if (isRestricted && (key === 'data' || key === 'tools')) return false;
            if (isTeacherRole && key === 'town') return false;
            return true;
        }).map((key) => {
            const category = nav[key];
            return {
                ...category,
                key,
                items: Array.isArray(category?.items) ? category.items.filter(item => canUseModule(item.id)) : []
            };
        }).filter(category => category.items.length > 0);
    }

    function findAllowedItem(itemId) {
        const categories = getAllowedCategories();
        for (const category of categories) {
            const match = category.items.find(item => item.id === itemId);
            if (match) {
                return {
                    ...match,
                    categoryKey: category.key,
                    categoryTitle: category.title,
                    categoryColor: category.color
                };
            }
        }
        return null;
    }

    function getActiveSectionId() {
        return document.querySelector('.section.active')?.id || '';
    }

    function getPrimaryModuleId() {
        const role = getCurrentRole();
        const preferred = HOME_BY_ROLE[role] || 'starter-hub';
        const preferredItem = findAllowedItem(preferred);
        if (preferredItem) return preferredItem.id;
        return getAllowedCategories()[0]?.items?.[0]?.id || 'starter-hub';
    }

    function getActiveItem() {
        return findAllowedItem(getActiveSectionId()) || findAllowedItem(getPrimaryModuleId()) || null;
    }

    function getCurrentCategory() {
        const categories = getAllowedCategories();
        const activeItem = getActiveItem();
        if (activeItem) {
            const category = categories.find(item => item.key === activeItem.categoryKey);
            if (category) return category;
        }
        return categories.find(item => item.key === getCurrentCategoryKey()) || categories[0] || null;
    }

    function getShortcutItems() {
        const allowMap = new Map();
        const shortlist = [];
        const seen = new Set();

        getAllowedCategories().forEach(category => {
            category.items.forEach(item => {
                allowMap.set(item.id, {
                    ...item,
                    categoryKey: category.key,
                    categoryTitle: category.title,
                    categoryColor: category.color
                });
            });
        });

        [getPrimaryModuleId(), ...SHORTCUT_ORDER].forEach((itemId) => {
            if (!itemId || seen.has(itemId) || !allowMap.has(itemId)) return;
            seen.add(itemId);
            shortlist.push(allowMap.get(itemId));
        });

        return shortlist.slice(0, 6);
    }

    function getSelectedText(selectId, fallback = '') {
        const select = document.getElementById(selectId);
        if (!select || !select.selectedOptions || !select.selectedOptions[0]) return fallback;
        const text = String(select.selectedOptions[0].textContent || '').trim();
        return text || fallback;
    }

    function getModeBadgeText() {
        const badge = document.getElementById('mode-badge');
        const text = String(badge?.textContent || '').trim();
        if (text) return text;
        return String(window.CONFIG?.name || '当前模式').trim();
    }

    function getCohortLabel() {
        return getSelectedText('cohort-selector', '请选择届别');
    }

    function getCohortOptions() {
        const select = document.getElementById('cohort-selector');
        if (!select) return [];
        return Array.from(select.options || [])
            .filter(option => String(option.value || '').trim())
            .map(option => ({
                value: String(option.value || '').trim(),
                label: String(option.textContent || option.value || '').trim()
            }));
    }

    function setCohortValue(value) {
        const select = document.getElementById('cohort-selector');
        if (!select || !value) return;
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function syncViewport() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes');
        }
    }

    function hideLegacyMobileShell() {
        const mobApp = document.getElementById('mobile-manager-app');
        if (mobApp) {
            mobApp.style.display = 'none';
        }
    }

    function showDesktopAppForMobile(role = '') {
        if (role === 'parent') return;
        const appEl = document.getElementById('app');
        if (appEl) {
            appEl.classList.remove('hidden');
            appEl.style.display = '';
        }
    }

    function markResponsiveTables(scope = document) {
        if (!isMobileViewport()) return;
        const tables = scope.querySelectorAll('.table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable');
        tables.forEach((table) => {
            const headerRows = table.querySelectorAll('thead tr');
            const headerCells = headerRows.length ? Array.from(headerRows[headerRows.length - 1].children) : [];
            if (!headerCells.length) return;

            table.classList.add('mobile-card-table');
            Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
                let title = '';
                Array.from(row.children).forEach((cell, index) => {
                    if (!(cell instanceof HTMLElement)) return;
                    if (cell.hasAttribute('colspan')) return;
                    const headerText = headerCells[index]?.textContent?.replace(/\s+/g, ' ').trim() || `字段${index + 1}`;
                    const cellText = cell.textContent?.replace(/\s+/g, ' ').trim() || '';
                    if (!title && cellText && index <= 1) {
                        title = cellText;
                    }
                    cell.setAttribute('data-label', headerText);
                });
                if (title) {
                    row.setAttribute('data-mobile-card-title', title);
                }
            });
            table.dataset.mobileEnhanced = '1';
        });
    }

    function markResponsiveLayouts(scope = document) {
        if (!isMobileViewport()) return;

        scope.querySelectorAll('.section [style*="grid-template-columns"]').forEach((element) => {
            if (element.closest('#parent-view-container')) return;
            element.classList.add('mobile-stack-grid');
        });

        scope.querySelectorAll('.section [style*="display:flex"]').forEach((element) => {
            if (element.closest('#parent-view-container') || element.closest('#mobile-query-shell')) return;
            if (element.children.length < 2) return;
            element.classList.add('mobile-wrap-row');
        });
    }

    function isLoggedIn() {
        const overlay = document.getElementById('login-overlay');
        const overlayVisible = !!(overlay && getComputedStyle(overlay).display !== 'none');
        return !!getCurrentUser() && !overlayVisible;
    }

    function buildInlineSubnavHtml() {
        const currentCategory = getCurrentCategory();
        if (!currentCategory || !currentCategory.items.length) {
            return '<div class="mq-inline-empty">当前分类暂无可用子模块</div>';
        }

        const activeItem = getActiveItem();
        return currentCategory.items.map(item => {
            const isActive = activeItem?.id === item.id;
            return `
                <button type="button" class="mq-inline-chip ${isActive ? 'is-active' : ''}" data-mobile-target="module" data-id="${escapeHtml(item.id)}" data-category="${escapeHtml(currentCategory.key)}">
                    <i class="ti ${escapeHtml(item.icon || 'ti-layout-grid')}"></i>
                    <span>${escapeHtml(stripEmoji(item.text || item.id))}</span>
                </button>
            `;
        }).join('');
    }

    function ensureMobileShell() {
        let root = document.getElementById('mobile-query-shell');
        if (root) return root;

        root = document.createElement('div');
        root.id = 'mobile-query-shell';
        root.setAttribute('aria-hidden', 'true');
        root.innerHTML = `
            <div class="mq-topbar">
                <button type="button" class="mq-icon-btn" data-mobile-action="home" aria-label="返回工作台">
                    <i class="ti ti-layout-grid"></i>
                </button>
                <div class="mq-topbar-copy">
                    <div class="mq-role-line" data-field="role">访客</div>
                    <div class="mq-title-line" data-field="title">手机查询工作台</div>
                    <div class="mq-subtitle-line" data-field="subtitle">完整数据已适配到手机查询界面</div>
                </div>
                <button type="button" class="mq-icon-btn" data-mobile-sheet="modules" aria-label="打开模块面板">
                    <i class="ti ti-category-2"></i>
                </button>
            </div>
            <div class="mq-toolbar">
                <div class="mq-toolbar-row">
                    <div class="mq-mode-badge" data-field="mode">当前模式</div>
                    <button type="button" class="mq-toolbar-pill" data-mobile-sheet="cohorts">
                        <i class="ti ti-folders"></i>
                        <span data-field="cohort">请选择届别</span>
                    </button>
                    <button type="button" class="mq-toolbar-pill" data-mobile-action="search">
                        <i class="ti ti-search"></i>
                        <span>搜索</span>
                    </button>
                </div>
                <div class="mq-inline-subnav"></div>
            </div>
            <div class="mq-backdrop"></div>
            <div class="mq-sheet">
                <div class="mq-sheet-panel"></div>
            </div>
            <div class="mq-tabs">
                <button type="button" class="mq-tab" data-mobile-action="home">
                    <i class="ti ti-home-2"></i>
                    <span>工作台</span>
                </button>
                <button type="button" class="mq-tab" data-mobile-sheet="modules">
                    <i class="ti ti-layout-list"></i>
                    <span>模块</span>
                </button>
                <button type="button" class="mq-tab" data-mobile-sheet="quick">
                    <i class="ti ti-bolt"></i>
                    <span>快捷</span>
                </button>
                <button type="button" class="mq-tab" data-mobile-sheet="account">
                    <i class="ti ti-user-circle"></i>
                    <span>我的</span>
                </button>
            </div>
        `;

        root.addEventListener('click', handleShellClick);
        root.querySelector('.mq-backdrop')?.addEventListener('click', () => setSheetMode(''));
        document.body.appendChild(root);
        return root;
    }

    function getSheetPanel() {
        return ensureMobileShell().querySelector('.mq-sheet-panel');
    }

    function setSheetMode(mode = '') {
        const root = ensureMobileShell();
        const panel = getSheetPanel();
        currentSheetMode = mode;
        root.dataset.sheetOpen = mode ? '1' : '0';
        root.dataset.sheetMode = mode || '';
        root.setAttribute('aria-hidden', mode ? 'false' : 'true');

        if (!mode) {
            panel.innerHTML = '';
            return;
        }

        if (mode === 'modules') renderModuleSheet(panel);
        if (mode === 'quick') renderQuickSheet(panel);
        if (mode === 'account') renderAccountSheet(panel);
        if (mode === 'cohorts') renderCohortSheet(panel);
    }

    function renderModuleSheet(panel) {
        const categories = getAllowedCategories();
        if (!categories.length) {
            panel.innerHTML = `
                <div class="mq-sheet-head">
                    <div>
                        <strong>模块面板</strong>
                        <span>当前角色还没有可用模块</span>
                    </div>
                    <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
                </div>
            `;
            return;
        }

        const activeItem = getActiveItem();
        const currentCategoryKey = panel.dataset.categoryKey && categories.some(cat => cat.key === panel.dataset.categoryKey)
            ? panel.dataset.categoryKey
            : (activeItem?.categoryKey || getCurrentCategoryKey() || categories[0].key);
        const selectedCategory = categories.find(cat => cat.key === currentCategoryKey) || categories[0];
        panel.dataset.categoryKey = selectedCategory.key;

        const pillsHtml = categories.map(category => `
            <button type="button" class="mq-pill ${category.key === selectedCategory.key ? 'is-active' : ''}" data-mobile-target="category" data-key="${escapeHtml(category.key)}">
                <i class="ti ${escapeHtml(category.icon || 'ti-layout-grid')}"></i>
                <span>${escapeHtml(stripEmoji(category.title || '模块'))}</span>
            </button>
        `).join('');

        const itemsHtml = selectedCategory.items.map(item => {
            const isActive = activeItem?.id === item.id;
            return `
                <button type="button" class="mq-module-card ${isActive ? 'is-active' : ''}" data-mobile-target="module" data-id="${escapeHtml(item.id)}" data-category="${escapeHtml(selectedCategory.key)}">
                    <div class="mq-module-card-head">
                        <span class="mq-module-icon"><i class="ti ${escapeHtml(item.icon || 'ti-layout-grid')}"></i></span>
                        <span class="mq-module-state">${isActive ? '当前子模块' : '点击进入'}</span>
                    </div>
                    <strong>${escapeHtml(stripEmoji(item.text || item.id))}</strong>
                    <span>${escapeHtml(stripEmoji(selectedCategory.title || '模块分组'))}</span>
                </button>
            `;
        }).join('');

        panel.innerHTML = `
            <div class="mq-sheet-head">
                <div>
                    <strong>模块导航</strong>
                    <span>先选模块分类，再进入对应子模块</span>
                </div>
                <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
            </div>
            <div class="mq-pill-row">${pillsHtml}</div>
            <div class="mq-module-grid">${itemsHtml}</div>
        `;
    }

    function renderQuickSheet(panel) {
        const shortcuts = getShortcutItems();
        const activeItem = getActiveItem();
        const school = getCurrentSchool() || '未绑定学校';
        const dataCount = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;

        const utilityActions = [
            `
                <button type="button" class="mq-account-action" data-mobile-action="search">
                    <i class="ti ti-search"></i>
                    <span>全局搜索</span>
                </button>
            `,
            `
                <button type="button" class="mq-account-action" data-mobile-sheet="cohorts">
                    <i class="ti ti-folders"></i>
                    <span>切换届别</span>
                </button>
            `
        ];

        if (hasRole(MESSAGE_ROLES) && window.IssueManager && typeof window.IssueManager.openAdminPanel === 'function') {
            utilityActions.push(`
                <button type="button" class="mq-account-action" data-mobile-action="messages">
                    <i class="ti ti-bell"></i>
                    <span>消息中心</span>
                </button>
            `);
        }

        if (hasRole(DATA_MANAGER_ROLES) && window.DataManager && typeof window.DataManager.open === 'function') {
            utilityActions.push(`
                <button type="button" class="mq-account-action" data-mobile-action="data-manager">
                    <i class="ti ti-database-edit"></i>
                    <span>数据中心</span>
                </button>
            `);
        }

        if (hasRole(ACCOUNT_MANAGER_ROLES) && window.AccountManager && typeof window.AccountManager.open === 'function') {
            utilityActions.push(`
                <button type="button" class="mq-account-action" data-mobile-action="account-manager">
                    <i class="ti ti-user-cog"></i>
                    <span>账号权限</span>
                </button>
            `);
        }

        panel.innerHTML = `
            <div class="mq-sheet-head">
                <div>
                    <strong>快捷操作</strong>
                    <span>手机端常用操作和高频入口集中在这里</span>
                </div>
                <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
            </div>
            <div class="mq-info-card">
                <div class="mq-info-row">
                    <span>当前子模块</span>
                    <strong>${escapeHtml(stripEmoji(activeItem?.text || '未进入模块'))}</strong>
                </div>
                <div class="mq-info-row">
                    <span>当前学校</span>
                    <strong>${escapeHtml(school)}</strong>
                </div>
                <div class="mq-info-row">
                    <span>已载入记录</span>
                    <strong>${escapeHtml(String(dataCount))}</strong>
                </div>
            </div>
            <div class="mq-utility-grid">${utilityActions.join('')}</div>
            <div class="mq-section-title">高频入口</div>
            <div class="mq-shortcut-grid">
                ${shortcuts.map(item => `
                    <button type="button" class="mq-shortcut-card ${activeItem?.id === item.id ? 'is-active' : ''}" data-mobile-target="module" data-id="${escapeHtml(item.id)}" data-category="${escapeHtml(item.categoryKey || '')}">
                        <i class="ti ${escapeHtml(item.icon || 'ti-bolt')}"></i>
                        <strong>${escapeHtml(stripEmoji(item.text || item.id))}</strong>
                        <span>${escapeHtml(stripEmoji(item.categoryTitle || '快捷入口'))}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderAccountSheet(panel) {
        const user = getCurrentUser();
        const roles = getCurrentRoles();
        const school = getCurrentSchool() || '未绑定学校';
        const roleChips = roles.length
            ? roles.map(role => `<span class="mq-role-chip">${escapeHtml(humanizeRole(role))}</span>`).join('')
            : '<span class="mq-role-chip">访客</span>';

        const extraActions = [];
        if (typeof window.showModuleHelp === 'function') {
            extraActions.push(`
                <button type="button" class="mq-account-action" data-mobile-action="permissions">
                    <i class="ti ti-shield-lock"></i>
                    <span>权限说明</span>
                </button>
            `);
        }
        if (typeof window.openSpotlight === 'function') {
            extraActions.push(`
                <button type="button" class="mq-account-action" data-mobile-action="search">
                    <i class="ti ti-search"></i>
                    <span>全局搜索</span>
                </button>
            `);
        }

        panel.innerHTML = `
            <div class="mq-sheet-head">
                <div>
                    <strong>当前会话</strong>
                    <span>账号、角色和系统操作都集中在这里</span>
                </div>
                <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
            </div>
            <div class="mq-account-card">
                <div class="mq-account-name">${escapeHtml(user?.name || '未登录')}</div>
                <div class="mq-account-school">${escapeHtml(school)}</div>
                <div class="mq-role-chip-row">${roleChips}</div>
            </div>
            <div class="mq-account-actions">
                <button type="button" class="mq-account-action" data-mobile-action="password">
                    <i class="ti ti-key"></i>
                    <span>修改密码</span>
                </button>
                <button type="button" class="mq-account-action" data-mobile-action="theme">
                    <i class="ti ti-moon"></i>
                    <span>深色模式</span>
                </button>
                ${extraActions.join('')}
                <button type="button" class="mq-account-action is-danger" data-mobile-action="logout">
                    <i class="ti ti-logout"></i>
                    <span>退出登录</span>
                </button>
            </div>
        `;
    }

    function renderCohortSheet(panel) {
        const options = getCohortOptions();
        const currentValue = document.getElementById('cohort-selector')?.value || '';

        panel.innerHTML = `
            <div class="mq-sheet-head">
                <div>
                    <strong>切换届别</strong>
                    <span>手机端也可以直接切换当前届别</span>
                </div>
                <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
            </div>
            <div class="mq-cohort-list">
                ${options.map(option => `
                    <button type="button" class="mq-cohort-option ${option.value === currentValue ? 'is-active' : ''}" data-mobile-target="cohort" data-value="${escapeHtml(option.value)}">
                        <strong>${escapeHtml(option.label)}</strong>
                        <span>${option.value === currentValue ? '当前届别' : '点击切换'}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function handleParentJump(target) {
        const container = document.getElementById('parent-view-container');
        if (!container) return;

        if (target === 'top') {
            container.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const scoreTarget = container.querySelector('#tb-query, table.fluent-table, table');
        const chartTarget = container.querySelector('canvas, .fluent-chart, .chart-box');

        if (target === 'scores' && scoreTarget) {
            scoreTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (target === 'charts' && chartTarget) {
            chartTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function handleShellClick(event) {
        const trigger = event.target.closest('[data-mobile-action], [data-mobile-sheet], [data-mobile-target], [data-parent-jump]');
        if (!trigger) return;

        const sheetMode = trigger.getAttribute('data-mobile-sheet');
        if (sheetMode) {
            setSheetMode(currentSheetMode === sheetMode ? '' : sheetMode);
            return;
        }

        const targetType = trigger.getAttribute('data-mobile-target');
        if (targetType === 'category') {
            const panel = getSheetPanel();
            panel.dataset.categoryKey = trigger.getAttribute('data-key') || '';
            renderModuleSheet(panel);
            return;
        }

        if (targetType === 'module') {
            const categoryKey = trigger.getAttribute('data-category') || '';
            const moduleId = trigger.getAttribute('data-id') || '';
            setSheetMode('');
            const shouldDelay = categoryKey && categoryKey !== getCurrentCategoryKey();
            if (shouldDelay) switchCategoryKey(categoryKey);
            if (typeof window.switchTab === 'function' && moduleId) {
                if (shouldDelay) {
                    setTimeout(() => window.switchTab(moduleId), 90);
                } else {
                    window.switchTab(moduleId);
                }
            }
            scheduleRefresh();
            return;
        }

        if (targetType === 'cohort') {
            const value = trigger.getAttribute('data-value') || '';
            setSheetMode('');
            setCohortValue(value);
            scheduleRefresh();
            return;
        }

        const action = trigger.getAttribute('data-mobile-action');
        if (action === 'close-sheet') {
            setSheetMode('');
            return;
        }
        if (action === 'home') {
            setSheetMode('');
            if (typeof window.switchTab === 'function') {
                window.switchTab(getPrimaryModuleId());
            }
            scheduleRefresh();
            return;
        }
        if (action === 'search' && typeof window.openSpotlight === 'function') {
            setSheetMode('');
            window.openSpotlight();
            return;
        }
        if (action === 'password' && typeof window.openUserPasswordModal === 'function') {
            setSheetMode('');
            window.openUserPasswordModal();
            return;
        }
        if (action === 'theme' && typeof window.toggleDarkMode === 'function') {
            window.toggleDarkMode();
            scheduleRefresh();
            return;
        }
        if (action === 'permissions' && typeof window.showModuleHelp === 'function') {
            setSheetMode('');
            window.showModuleHelp('permissions');
            return;
        }
        if (action === 'messages' && window.IssueManager && typeof window.IssueManager.openAdminPanel === 'function') {
            setSheetMode('');
            window.IssueManager.openAdminPanel();
            return;
        }
        if (action === 'data-manager' && window.DataManager && typeof window.DataManager.open === 'function') {
            setSheetMode('');
            window.DataManager.open();
            return;
        }
        if (action === 'account-manager' && window.AccountManager && typeof window.AccountManager.open === 'function') {
            setSheetMode('');
            window.AccountManager.open();
            return;
        }
        if (action === 'logout' && window.Auth && typeof window.Auth.logout === 'function') {
            setSheetMode('');
            window.Auth.logout();
            return;
        }
        if (action === 'refresh-parent' && window.Auth && typeof window.Auth.renderParentView === 'function') {
            window.Auth.renderParentView();
            return;
        }
        if (action === 'logout-parent' && window.Auth && typeof window.Auth.logout === 'function') {
            window.Auth.logout();
            return;
        }

        const parentJump = trigger.getAttribute('data-parent-jump');
        if (parentJump) {
            handleParentJump(parentJump);
        }
    }

    function syncShellState() {
        const root = ensureMobileShell();
        const role = getCurrentRole();
        const activeItem = getActiveItem();
        const school = getCurrentSchool();
        const subtitle = school
            ? `${school} · 手机端已切到完整查询模式`
            : '手机端已切到完整查询模式';

        root.querySelector('[data-field="role"]').textContent = humanizeRole(role);
        root.querySelector('[data-field="title"]').textContent = stripEmoji(activeItem?.text || '手机查询工作台');
        root.querySelector('[data-field="subtitle"]').textContent = subtitle;
        root.querySelector('[data-field="mode"]').textContent = getModeBadgeText();
        root.querySelector('[data-field="cohort"]').textContent = getCohortLabel();
        root.querySelector('.mq-inline-subnav').innerHTML = buildInlineSubnavHtml();
        document.body.dataset.mobileSection = activeItem?.id || '';

        root.querySelectorAll('.mq-tab').forEach((tab) => {
            tab.classList.remove('is-active');
            const tabSheetMode = tab.getAttribute('data-mobile-sheet');
            const action = tab.getAttribute('data-mobile-action');
            if (tabSheetMode && currentSheetMode === tabSheetMode) {
                tab.classList.add('is-active');
            }
            if (action === 'home' && !currentSheetMode) {
                tab.classList.add('is-active');
            }
        });

        if (currentSheetMode === 'modules') renderModuleSheet(getSheetPanel());
        if (currentSheetMode === 'quick') renderQuickSheet(getSheetPanel());
        if (currentSheetMode === 'account') renderAccountSheet(getSheetPanel());
        if (currentSheetMode === 'cohorts') renderCohortSheet(getSheetPanel());
    }

    function syncShellVisibility() {
        const root = ensureMobileShell();
        const shouldShow = isMobileViewport() && isLoggedIn() && getCurrentRole() !== 'parent';
        root.style.display = shouldShow ? 'block' : 'none';
        if (!shouldShow) {
            setSheetMode('');
            return;
        }
        syncShellState();
    }

    function enhanceParentView() {
        const container = document.getElementById('parent-view-container');
        if (!container || !isMobileViewport() || getCurrentRole() !== 'parent') return;

        const user = getCurrentUser();
        let header = container.querySelector('.mobile-parent-header');
        if (!header) {
            header = document.createElement('div');
            header.className = 'mobile-parent-header';
            container.prepend(header);
        }

        header.innerHTML = `
            <div class="mobile-parent-header-top">
                <div>
                    <div class="mobile-parent-role">家长端报告</div>
                    <div class="mobile-parent-name">${escapeHtml(user?.name || '学生')}</div>
                    <div class="mobile-parent-meta">${escapeHtml(user?.class || '未绑定班级')}${user?.school ? ` · ${escapeHtml(user.school)}` : ''}</div>
                </div>
                <button type="button" class="mobile-parent-logout" data-mobile-action="logout-parent">退出</button>
            </div>
            <div class="mobile-parent-chip-row">
                <span class="mobile-parent-chip">手机端展示完整报告</span>
                <span class="mobile-parent-chip">与电脑端保持同一份数据</span>
            </div>
            <div class="mobile-parent-action-row">
                <button type="button" class="mobile-parent-action" data-parent-jump="top">总览</button>
                <button type="button" class="mobile-parent-action" data-parent-jump="scores">成绩表</button>
                <button type="button" class="mobile-parent-action" data-parent-jump="charts">图表</button>
                <button type="button" class="mobile-parent-action" data-mobile-action="refresh-parent">刷新</button>
            </div>
        `;

        markResponsiveTables(container);
    }

    function scheduleRefresh() {
        REFRESH_DELAYS.forEach((delay) => {
            setTimeout(refreshMobileEnhancements, delay);
        });
    }

    function refreshMobileEnhancements() {
        syncViewport();
        hideLegacyMobileShell();
        document.body.dataset.mobileQuery = isMobileViewport() ? 'true' : 'false';

        if (!isMobileViewport()) {
            syncShellVisibility();
            return;
        }

        if (getCurrentRole() !== 'parent') {
            showDesktopAppForMobile(getCurrentRole());
        }

        markResponsiveTables(document);
        markResponsiveLayouts(document);
        enhanceParentView();
        syncShellVisibility();
    }

    const MobMgr = {
        init() {
            refreshMobileEnhancements();
            return true;
        },
        switchTab(tabName) {
            const map = {
                home: getPrimaryModuleId(),
                students: 'student-details',
                analysis: 'summary',
                me: getPrimaryModuleId()
            };
            if (typeof window.switchTab === 'function' && map[tabName]) {
                window.switchTab(map[tabName]);
                setTimeout(refreshMobileEnhancements, 80);
            }
        },
        renderStudentList() {
            refreshMobileEnhancements();
        },
        showStudentDetail() {
            refreshMobileEnhancements();
        },
        renderAnalysis() {
            refreshMobileEnhancements();
        },
        openModules() {
            setSheetMode('modules');
        },
        openQuickActions() {
            setSheetMode('quick');
        },
        openAccountSheet() {
            setSheetMode('account');
        },
        openCohortSheet() {
            setSheetMode('cohorts');
        },
        refresh: refreshMobileEnhancements
    };

    window.MobMgr = MobMgr;
    window.MobileQueryUI = {
        refresh: refreshMobileEnhancements,
        openModules: () => setSheetMode('modules'),
        openQuick: () => setSheetMode('quick'),
        openAccount: () => setSheetMode('account'),
        openCohorts: () => setSheetMode('cohorts')
    };
    window.switchMobileTab = function (tabName) {
        MobMgr.switchTab(tabName);
    };

    if (typeof Auth !== 'undefined' && typeof Auth.applyRoleView === 'function') {
        const originalApplyRoleView = Auth.applyRoleView;
        Auth.applyRoleView = function () {
            originalApplyRoleView.call(this);
            scheduleRefresh();
        };
    }

    if (typeof Auth !== 'undefined' && typeof Auth.renderParentView === 'function') {
        const originalRenderParentView = Auth.renderParentView;
        Auth.renderParentView = function () {
            originalRenderParentView.call(this);
            scheduleRefresh();
        };
    }

    if (typeof window.renderNavigation === 'function') {
        const originalRenderNavigation = window.renderNavigation;
        window.renderNavigation = function () {
            const result = originalRenderNavigation.apply(this, arguments);
            scheduleRefresh();
            return result;
        };
    }

    if (typeof window.switchTab === 'function') {
        const originalSwitchTab = window.switchTab;
        window.switchTab = function () {
            const result = originalSwitchTab.apply(this, arguments);
            scheduleRefresh();
            return result;
        };
    }

    if (typeof window.switchCategory === 'function') {
        const originalSwitchCategory = window.switchCategory;
        window.switchCategory = function () {
            const result = originalSwitchCategory.apply(this, arguments);
            scheduleRefresh();
            return result;
        };
    }

    window.addEventListener('resize', scheduleRefresh);

    scheduleRefresh();
    window.__MOBILE_MANAGER_PATCHED__ = true;
})();
