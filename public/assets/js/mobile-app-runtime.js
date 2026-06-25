(() => {
    if (typeof window === 'undefined' || window.__MOBILE_APP_RUNTIME_PATCHED__) return;

    const MOBILE_BREAKPOINT = 960;
    const REFRESH_DELAYS = [80, 260, 900];
    const MODULE_FOCUS_DELAYS = [140, 420, 980, 1600];
    const HOME_BY_ROLE = {
        admin: 'starter-hub',
        director: 'starter-hub',
        grade_director: 'teacher-analysis',
        class_teacher: 'student-details',
        teacher: 'teacher-analysis'
    };
    const QUICK_MODULE_IDS = [
        'student-details',
        'summary',
        'teacher-analysis',
        'report-generator',
        'progress-analysis',
        'analysis'
    ];
    const RECENT_MODULE_STORAGE_KEY = 'apk-recent-modules-v1';
    const RECENT_MODULE_LIMIT = 8;
    const QUICK_MODULE_LIMIT = 6;
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

    const isNativeApp = !!(
        window.Capacitor
        && (
            (typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform())
            || (typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() !== 'web')
        )
    );

    let refreshHandle = 0;
    let sheetMode = '';
    let libraryOpen = false;
    let libraryQuery = '';
    let shellGesture = null;
    let themeMedia = null;
    let responsiveObserverRoot = null;
    let allowedCategoriesCacheKey = '';
    let allowedCategoriesCache = null;
    let allowedItemCache = new Map();

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function setTextIfChanged(node, value) {
        if (!node) return false;
        const nextValue = String(value ?? '');
        if (node.textContent === nextValue) return false;
        node.textContent = nextValue;
        return true;
    }

    function setHtmlIfChanged(node, html) {
        if (!node) return false;
        const nextHtml = String(html ?? '');
        if (node.__apkLastHtml === nextHtml) return false;
        node.innerHTML = nextHtml;
        node.__apkLastHtml = nextHtml;
        return true;
    }

    function setDatasetIfChanged(node, key, value) {
        if (!node?.dataset) return false;
        const nextValue = String(value ?? '');
        if (node.dataset[key] === nextValue) return false;
        node.dataset[key] = nextValue;
        return true;
    }

    function setStylePropertyIfChanged(node, key, value) {
        if (!node?.style) return false;
        const nextValue = String(value ?? '');
        if (node.style.getPropertyValue(key) === nextValue) return false;
        node.style.setProperty(key, nextValue);
        return true;
    }

    function toggleClassIfChanged(node, className, force) {
        if (!node?.classList) return false;
        const nextValue = !!force;
        if (node.classList.contains(className) === nextValue) return false;
        node.classList.toggle(className, nextValue);
        return true;
    }

    function getViewportWidth() {
        const candidates = [
            Number(window.innerWidth || 0),
            Number(document.documentElement?.clientWidth || 0),
            Number(window.outerWidth || 0),
            Number(window.screen?.width || 0),
            Number(window.screen?.availWidth || 0)
        ].filter((value) => Number.isFinite(value) && value > 0);
        return candidates.length ? Math.min(...candidates) : 0;
    }

    function isMobileViewport() {
        return getViewportWidth() <= MOBILE_BREAKPOINT;
    }

    function isCompactViewport() {
        if (window.matchMedia) return window.matchMedia('(max-width: 900px)').matches;
        return getViewportWidth() <= 900;
    }

    function syncCompactState(scope = document) {
        document.documentElement.classList.toggle('is-compact-viewport', isCompactViewport());
        const targetScope = scope && typeof scope.querySelectorAll === 'function'
            ? scope
            : document;
        targetScope.querySelectorAll('.analysis-table-shell, .table-wrap').forEach((shell) => {
            if (!shell.dataset.mobileHint) shell.dataset.mobileHint = '可横向滑动查看完整表格';
        });
    }

    function installMobileExperienceRuntime() {
        syncCompactState(document);
    }

    function scrollActiveRailChipIntoView(root) {
        const rail = root?.querySelector?.('[data-apk-rail]');
        if (!rail) return;
        const activeChip = rail.querySelector('.apk-rail-chip.is-active');
        if (!activeChip || typeof activeChip.scrollIntoView !== 'function') return;
        activeChip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    }

    function getCurrentUser() {
        if (window.AuthState && typeof window.AuthState.getCurrentUser === 'function') {
            return window.AuthState.getCurrentUser();
        }
        if (window.Auth && window.Auth.currentUser) return window.Auth.currentUser;
        return null;
    }

    function getCurrentRole() {
        if (window.AuthState && typeof window.AuthState.getCurrentRole === 'function') {
            return window.AuthState.getCurrentRole();
        }
        return String(getCurrentUser()?.role || document.body?.dataset?.role || 'guest').trim() || 'guest';
    }

    function getCurrentRoles() {
        if (window.AuthState && typeof window.AuthState.getCurrentRoles === 'function') {
            return window.AuthState.getCurrentRoles();
        }
        const user = getCurrentUser();
        const rawRoles = Array.isArray(user?.roles) && user.roles.length
            ? user.roles
            : [user?.role].filter(Boolean);
        return rawRoles.map((role) => String(role || '').trim()).filter(Boolean);
    }

    function hasRole(expectedRoles) {
        const roleSet = new Set(getCurrentRoles());
        return expectedRoles.some((role) => roleSet.has(role));
    }

    function isParentLikeRole(role = getCurrentRole()) {
        const normalizedRole = String(role || '').trim();
        return normalizedRole === 'parent' || normalizedRole === 'student';
    }

    function humanizeRole(role = getCurrentRole()) {
        return ROLE_LABELS[String(role || '').trim()] || String(role || '访客');
    }

    function getCurrentSchool() {
        if (window.SchoolState && typeof window.SchoolState.getCurrentSchool === 'function') {
            return String(
                getCurrentUser()?.school
                || window.SchoolState.getCurrentSchool()
                || ''
            ).trim();
        }
        return String(
            getCurrentUser()?.school
            || window.MY_SCHOOL
            || localStorage.getItem('MY_SCHOOL')
            || ''
        ).trim();
    }

    function isLoggedIn() {
        const overlay = document.getElementById('login-overlay');
        const overlayVisible = !!(overlay && getComputedStyle(overlay).display !== 'none');
        return !!getCurrentUser() && !overlayVisible;
    }

    function getNavStructure() {
        if (window.NAV_STRUCTURE) return window.NAV_STRUCTURE;
        try {
            return NAV_STRUCTURE;
        } catch {
            return null;
        }
    }

    function resetMobileNavCache() {
        allowedCategoriesCacheKey = '';
        allowedCategoriesCache = null;
        allowedItemCache = new Map();
    }

    function getAllowedCategoriesCacheKey(nav, role) {
        const roles = getCurrentRoles().join('|');
        const navKeys = nav ? Object.keys(nav).join('|') : '';
        const reportVisible = window.CONFIG && window.CONFIG.showQuery ? 'report:1' : 'report:0';
        return [role, roles, navKeys, reportVisible].join('::');
    }

    function canUseModule(id) {
        if (typeof window.canAccessModule === 'function' && !window.canAccessModule(id)) {
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
        const cacheKey = getAllowedCategoriesCacheKey(nav, role);
        if (allowedCategoriesCache && allowedCategoriesCacheKey === cacheKey) {
            return allowedCategoriesCache;
        }

        const categories = Object.keys(nav)
            .map((key) => {
                const category = nav[key];
                return {
                    ...category,
                    key,
                    items: Array.isArray(category?.items)
                        ? category.items.filter((item) => canUseModule(item.id))
                        : []
                };
            })
            .filter((category) => category.items.length > 0);

        allowedCategoriesCacheKey = cacheKey;
        allowedCategoriesCache = categories;
        allowedItemCache = new Map();
        return categories;
    }

    function findAllowedItem(moduleId) {
        if (!moduleId) return null;
        if (allowedItemCache.has(moduleId)) return allowedItemCache.get(moduleId);
        const categories = getAllowedCategories();
        for (const category of categories) {
            const match = category.items.find((item) => item.id === moduleId);
            if (match) {
                const item = {
                    ...match,
                    categoryKey: category.key,
                    categoryTitle: category.title,
                    categoryColor: category.color
                };
                allowedItemCache.set(moduleId, item);
                return item;
            }
        }
        allowedItemCache.set(moduleId, null);
        return null;
    }

    function getHomeModuleId() {
        const preferred = HOME_BY_ROLE[getCurrentRole()] || 'starter-hub';
        const preferredItem = findAllowedItem(preferred);
        if (preferredItem) return preferredItem.id;
        return getAllowedCategories()[0]?.items?.[0]?.id || 'starter-hub';
    }

    function getActiveModuleId() {
        return document.querySelector('.section.active')?.id || getHomeModuleId();
    }

    function getActiveItem() {
        return findAllowedItem(getActiveModuleId()) || findAllowedItem(getHomeModuleId()) || null;
    }

    function getCurrentCategory() {
        const categories = getAllowedCategories();
        const activeItem = getActiveItem();
        if (activeItem) {
            const match = categories.find((category) => category.key === activeItem.categoryKey);
            if (match) return match;
        }
        const currentKey = typeof window.getCurrentNavCategory === 'function'
            ? String(window.getCurrentNavCategory() || '').trim()
            : '';
        return categories.find((category) => category.key === currentKey) || categories[0] || null;
    }

    function uniqueItems(items) {
        const seen = new Set();
        return items.filter((item) => {
            if (!item || !item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }

    function readRecentModuleIds() {
        try {
            const parsed = JSON.parse(localStorage.getItem(RECENT_MODULE_STORAGE_KEY) || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed
                .map((value) => String(value || '').trim())
                .filter(Boolean);
        } catch {
            return [];
        }
    }

    function writeRecentModuleIds(moduleIds) {
        try {
            localStorage.setItem(
                RECENT_MODULE_STORAGE_KEY,
                JSON.stringify(
                    moduleIds
                        .map((value) => String(value || '').trim())
                        .filter(Boolean)
                        .slice(0, RECENT_MODULE_LIMIT)
                )
            );
        } catch {}
    }

    function rememberRecentModule(moduleId) {
        const item = findAllowedItem(moduleId);
        if (!item) return;
        writeRecentModuleIds([
            item.id,
            ...readRecentModuleIds().filter((id) => id !== item.id)
        ]);
    }

    function getRecentModules(limit = RECENT_MODULE_LIMIT) {
        return uniqueItems(
            readRecentModuleIds()
                .map((moduleId) => findAllowedItem(moduleId))
                .filter(Boolean)
        ).slice(0, limit);
    }

    function getQuickModules(limit = QUICK_MODULE_LIMIT) {
        const modules = [
            ...getRecentModules(limit),
            getActiveItem(),
            findAllowedItem(getHomeModuleId()),
            ...QUICK_MODULE_IDS.map((moduleId) => findAllowedItem(moduleId))
        ];
        return uniqueItems(modules).slice(0, limit);
    }

    function getModeLabel() {
        const badge = document.getElementById('mode-badge');
        const badgeText = String(badge?.textContent || '').trim();
        if (badgeText) return badgeText;
        return String(window.CONFIG?.name || '学校工作台').trim();
    }

    function getCurrentCohortLabel() {
        const select = document.getElementById('cohort-selector');
        if (!select?.selectedOptions?.[0]) return '届别未选择';
        return String(select.selectedOptions[0].textContent || select.value || '届别未选择').trim() || '届别未选择';
    }

    function getCohortOptions() {
        const select = document.getElementById('cohort-selector');
        if (!select) return [];
        return Array.from(select.options || [])
            .filter((option) => String(option.value || '').trim())
            .map((option) => ({
                value: String(option.value || '').trim(),
                label: String(option.textContent || option.value || '').trim()
            }));
    }

    function getAppMain() {
        return document.querySelector('main.app-main');
    }

    function scrollPrimaryViewportToTop() {
        const appMain = getAppMain();
        if (appMain && typeof appMain.scrollTo === 'function') {
            appMain.scrollTo({ top: 0, behavior: 'auto' });
            return;
        }
        const scrollingEl = document.scrollingElement || document.documentElement || document.body;
        if (scrollingEl && typeof scrollingEl.scrollTo === 'function') {
            scrollingEl.scrollTo({ top: 0, behavior: 'auto' });
            return;
        }
        if (typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }

    function markResponsiveTables(scope = document) {
        if (!isMobileViewport()) return;
        const tables = scope.querySelectorAll('.table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable');
        tables.forEach((table) => {
            const columns = extractResponsiveTableHeaders(table);
            if (!columns.length) return;
            table.classList.add('mobile-card-table');
            Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
                let title = String(row.getAttribute('data-mobile-card-title') || '').trim();
                Array.from(row.children).forEach((cell, index) => {
                    if (!(cell instanceof HTMLElement) || cell.hasAttribute('colspan')) return;
                    const label = String(columns[index] || `字段${index + 1}`).replace(/\s+/g, ' ').trim();
                    const value = String(cell.textContent || '').replace(/\s+/g, ' ').trim();
                    if (!title && value && index <= 1) title = value;
                    cell.setAttribute('data-label', label);
                });
                if (title) row.setAttribute('data-mobile-card-title', title);
            });
        });
    }

    function extractResponsiveTableHeaders(table) {
        const headerRows = Array.from(table.querySelectorAll('thead tr'));
        if (!headerRows.length) return [];
        const grid = [];
        let maxColumns = 0;
        headerRows.forEach((row, rowIndex) => {
            if (!grid[rowIndex]) grid[rowIndex] = [];
            let columnIndex = 0;
            Array.from(row.children).forEach((cell) => {
                while (grid[rowIndex][columnIndex]) columnIndex += 1;
                const colspan = Math.max(parseInt(cell.getAttribute('colspan') || '1', 10) || 1, 1);
                const rowspan = Math.max(parseInt(cell.getAttribute('rowspan') || '1', 10) || 1, 1);
                const text = String(cell.textContent || '').replace(/\s+/g, ' ').trim();
                for (let r = 0; r < rowspan; r += 1) {
                    if (!grid[rowIndex + r]) grid[rowIndex + r] = [];
                    for (let c = 0; c < colspan; c += 1) {
                        grid[rowIndex + r][columnIndex + c] = text;
                    }
                }
                columnIndex += colspan;
                if (columnIndex > maxColumns) maxColumns = columnIndex;
            });
        });
        return Array.from({ length: maxColumns }, (_, columnIndex) => {
            const parts = [];
            grid.forEach((row) => {
                const text = String(row?.[columnIndex] || '').trim();
                if (!text || parts[parts.length - 1] === text) return;
                parts.push(text);
            });
            return parts.join(' / ');
        });
    }

    function refreshResponsiveTablesNow(scope = document) {
        if (!isMobileViewport()) return;
        const targetScope = scope && typeof scope.querySelectorAll === 'function'
            ? scope
            : (document.querySelector('.section.active') || document);
        markResponsiveTables(targetScope);
    }

    function scheduleResponsiveTableRefresh(scope = document) {
        if (!isMobileViewport()) return;
        const targetScope = scope && typeof scope.querySelectorAll === 'function'
            ? scope
            : (document.querySelector('.section.active') || document);
        clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__ || 0);
        window.__RESPONSIVE_TABLE_REFRESH_TIMER__ = window.setTimeout(() => {
            refreshResponsiveTablesNow(targetScope);
        }, 60);
    }

    function installResponsiveTableObserver(scope = document.querySelector('.section.active') || document.getElementById('app') || document.body) {
        if (typeof MutationObserver !== 'function') return;
        const root = scope instanceof HTMLElement
            ? scope
            : (document.querySelector('.section.active') || document.getElementById('app') || document.body || document.documentElement);
        if (!root) return;
        if (window.__RESPONSIVE_TABLE_OBSERVER__ && responsiveObserverRoot === root) return;
        if (window.__RESPONSIVE_TABLE_OBSERVER__ && typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect === 'function') {
            window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();
        }
        const observer = new MutationObserver((mutations) => {
            if (!isMobileViewport()) return;
            const shouldRefresh = mutations.some((mutation) => {
                return Array.from(mutation.addedNodes || []).some((node) => {
                    if (!(node instanceof HTMLElement)) return false;
                    return node.matches('table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container')
                        || !!node.querySelector?.('table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table');
                });
            });
            if (shouldRefresh) scheduleResponsiveTableRefresh(root);
        });
        observer.observe(root, {
            childList: true,
            subtree: true
        });
        window.__RESPONSIVE_TABLE_OBSERVER__ = observer;
        responsiveObserverRoot = root;
    }
    window.refreshResponsiveMobileTables = refreshResponsiveTablesNow;

    function markFlexibleRows(scope = document) {
        if (!isMobileViewport()) return;
        scope.querySelectorAll('.section [style*="grid-template-columns"]').forEach((element) => {
            if (element.closest('#parent-view-container')) return;
            element.classList.add('mobile-stack-grid');
        });
        scope.querySelectorAll('.section [style*="display:flex"]').forEach((element) => {
            if (element.closest('#parent-view-container') || element.closest('#apk-mobile-shell')) return;
            if (element.children.length < 2) return;
            element.classList.add('mobile-wrap-row');
        });
    }

    function ensureMobileExperienceStyles() {
        if (document.getElementById('mobile-experience-styles')) return;
        const style = document.createElement('style');
        style.id = 'mobile-experience-styles';
        style.textContent = `
            @media screen and (max-width: 960px) {
                body[data-mobile-architecture="apk-v2"] {
                    overflow-x: hidden;
                    overscroll-behavior-y: contain;
                    touch-action: manipulation;
                }
                body[data-mobile-architecture="apk-v2"] #app {
                    max-width: 100vw;
                    overflow-x: hidden;
                }
                body[data-mobile-architecture="apk-v2"] main.app-main {
                    width: 100%;
                    max-width: 100vw;
                    padding: calc(var(--app-safe-top, 0px) + 148px) 10px calc(var(--app-safe-bottom, 0px) + 110px) !important;
                    -webkit-overflow-scrolling: touch;
                    scroll-padding-top: calc(var(--app-safe-top, 0px) + 148px);
                    scroll-padding-bottom: calc(var(--app-safe-bottom, 0px) + 120px);
                }
                body[data-mobile-architecture="apk-v2"] .section.active {
                    max-width: 100%;
                    overflow: visible;
                }
                body[data-mobile-architecture="apk-v2"] .module-desc-bar,
                body[data-mobile-architecture="apk-v2"] .analysis-shell-head,
                body[data-mobile-architecture="apk-v2"] .analysis-inline-panel,
                body[data-mobile-architecture="apk-v2"] .analysis-anchor-panel,
                body[data-mobile-architecture="apk-v2"] .card-box {
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                    border-radius: 18px !important;
                }
                body[data-mobile-architecture="apk-v2"] input,
                body[data-mobile-architecture="apk-v2"] select,
                body[data-mobile-architecture="apk-v2"] textarea {
                    min-height: 44px;
                    font-size: 16px !important;
                }
                body[data-mobile-architecture="apk-v2"] button,
                body[data-mobile-architecture="apk-v2"] .btn {
                    min-height: 44px;
                }
                body[data-mobile-architecture="apk-v2"] .table-wrap {
                    width: 100%;
                    max-width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior-x: contain;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) {
                    display: block;
                    width: 100%;
                    min-width: 0 !important;
                    border-collapse: separate;
                    border-spacing: 0 10px;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) thead {
                    display: none !important;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) tbody,
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) tr,
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) td {
                    display: block;
                    width: 100%;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) tr {
                    padding: 12px;
                    border: 1px solid rgba(148, 163, 184, .22);
                    border-radius: 16px;
                    background: rgba(255, 255, 255, .92);
                    box-shadow: 0 14px 28px -24px rgba(15, 23, 42, .45);
                }
                body.dark-mode[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) tr {
                    background: rgba(15, 23, 42, .92);
                    border-color: rgba(148, 163, 184, .2);
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) td {
                    padding: 8px 2px !important;
                    border: 0 !important;
                    display: grid;
                    grid-template-columns: minmax(86px, 34%) minmax(0, 1fr);
                    gap: 10px;
                    align-items: start;
                    text-align: right;
                    white-space: normal;
                    word-break: break-word;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) td::before {
                    content: attr(data-label);
                    color: #64748b;
                    font-weight: 700;
                    font-size: 12px;
                    text-align: left;
                    line-height: 1.45;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-title,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-subtitle,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-rail-chip {
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-rail-chip {
                    max-width: 56vw;
                    scroll-snap-align: center;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-rail {
                    scroll-snap-type: x proximity;
                    padding-bottom: 8px;
                }
                body[data-mobile-architecture="apk-v2"] .swal2-popup {
                    width: min(92vw, 420px) !important;
                    max-height: calc(100dvh - var(--app-safe-top, 0px) - var(--app-safe-bottom, 0px) - 24px);
                    overflow: auto;
                }
            }
            @media screen and (max-width: 420px) {
                body[data-mobile-architecture="apk-v2"] main.app-main {
                    padding-left: 8px !important;
                    padding-right: 8px !important;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-topbar {
                    grid-template-columns: 40px minmax(0, 1fr) 40px;
                    gap: 8px;
                    padding: 10px;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-icon {
                    width: 40px;
                    height: 40px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function refreshContentEnhancements() {
        const scope = document.querySelector('.section.active') || document;
        ensureMobileExperienceStyles();
        syncCompactState(scope);
        refreshResponsiveTablesNow(scope);
        scheduleResponsiveTableRefresh(scope);
        installResponsiveTableObserver(scope);
        markFlexibleRows(scope);
    }

    function isVisiblyRendered(node) {
        if (!(node instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) {
            return false;
        }
        if (node.getAttribute('aria-hidden') === 'true' || node.hidden) return false;
        return node.getClientRects().length > 0;
    }

    function isBlockingDialogVisible() {
        dismissPassiveSwal();
        if (window.Swal && typeof window.Swal.isVisible === 'function' && window.Swal.isVisible()) {
            return true;
        }
        const selectors = [
            '.swal2-container',
            '.modal',
            '[role="dialog"]',
            '[aria-modal="true"]',
            '.dialog-overlay',
            '.dialog-backdrop'
        ];
        return Array.from(document.querySelectorAll(selectors.join(','))).some((node) => {
            if (!(node instanceof HTMLElement) || node.closest('#apk-mobile-shell')) return false;
            if (!isVisiblyRendered(node)) return false;
            const style = window.getComputedStyle(node);
            const zIndex = Number(style.zIndex || 0);
            return style.position === 'fixed' || zIndex >= 1000;
        });
    }

    function dismissPassiveSwal() {
        const container = document.querySelector('.swal2-container.swal2-backdrop-show');
        if (!isMobileViewport() || !container) return false;
        if (container.querySelector('input,textarea,select,.swal2-cancel,.swal2-deny')) return false;
        if (container.querySelector('.swal2-icon-error,.swal2-icon-warning,.swal2-icon-question')) return false;
        const text = String(container.innerText || '');
        if (/(安全|警告|失败|错误|确认|请确认|未完成|必须|需要完成|删除|覆盖|退出|清空)/.test(text)) return false;
        if (window.Swal && typeof window.Swal.close === 'function') window.Swal.close();
        else container.remove();
        return true;
    }

    function syncShellModalState(root = document.getElementById('apk-mobile-shell')) {
        if (!root) return;
        root.dataset.modalOpen = isBlockingDialogVisible() ? 'true' : 'false';
    }

    function scheduleStudentDetailsModuleFocus() {
        MODULE_FOCUS_DELAYS.forEach((delay, index) => {
            window.setTimeout(() => {
                const section = document.getElementById('student-details');
                if (!section || !section.classList.contains('active')) return;
                if (typeof window.requestStudentDetailsPrimaryFocus === 'function') {
                    window.requestStudentDetailsPrimaryFocus(index);
                    return;
                }
                if (typeof window.focusStudentDetailsPrimaryFlow === 'function') {
                    window.focusStudentDetailsPrimaryFlow();
                }
            }, delay);
        });
    }

    function hideLegacyMobileShells() {
        ['mobile-manager-app', 'mobile-query-shell'].forEach((id) => {
            const node = document.getElementById(id);
            if (!node) return;
            node.setAttribute('aria-hidden', 'true');
            node.style.display = 'none';
        });
    }

    function syncDesktopAppVisibility() {
        const app = document.getElementById('app');
        if (!app) return;

        if (!isMobileViewport()) {
            app.classList.remove('hidden');
            app.style.display = '';
            return;
        }

        if (!isLoggedIn()) {
            app.classList.add('hidden');
            app.style.display = 'none';
            return;
        }

        if (!isParentLikeRole()) {
            app.classList.remove('hidden');
            app.style.display = '';
        }
    }

    function syncThemeColorMeta() {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        meta.setAttribute('content', document.body.classList.contains('dark-mode') ? '#08111d' : '#eef3f8');
    }

    function syncSystemTheme() {
        const isDark = !!themeMedia?.matches;
        document.body.dataset.nativeApp = isNativeApp ? 'true' : 'false';
        document.body.dataset.systemTheme = isDark ? 'dark' : 'light';
        if (isNativeApp && isMobileViewport()) {
            document.body.classList.toggle('dark-mode', isDark);
            localStorage.setItem('theme-dark', isDark ? 'true' : 'false');
        }
        document.documentElement.style.colorScheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        syncThemeColorMeta();
    }

    function switchCohort(value) {
        const selector = document.getElementById('cohort-selector');
        if (!selector || !value) return;
        selector.value = value;
        selector.dispatchEvent(new Event('change', { bubbles: true }));
        setSheetMode('');
        REFRESH_DELAYS.forEach((delay) => {
            window.setTimeout(() => {
                scrollPrimaryViewportToTop();
                scheduleRefresh();
            }, delay);
        });
    }
    function getShellCopy() {
        return {
            workbench: '学校工作台',
            mobileWorkbench: '移动工作台',
            mobilePreparing: '移动工作台正在准备中',
            openLibrary: '打开模块资源库',
            openSearch: '打开全局搜索',
            closeSheet: '关闭面板',
            closeLibrary: '关闭模块资源库',
            cohortPlaceholder: '届别未选择',
            home: '工作台',
            modules: '模块',
            recent: '最近',
            account: '我的',
            openModule: '打开该模块',
            currentCategoryEmpty: '当前分类暂无可用模块',
            current: '当前',
            open: '打开',
            workspaceNote: 'Workspace',
            moduleOverviewTitle: '模块总览',
            moduleOverviewCopy: '按分类切换工作模块，减少手机端来回翻找入口的次数。',
            noModules: '当前账号还没有可切换的模块入口。',
            quickTitle: '最近与常用',
            quickCopy: '先给你最近用过的模块，再补高频入口，减少反复进出分类面板。',
            quickHeroTitle: '跨分类切换先看这里',
            quickHeroCopy: '默认优先展示最近使用，同时保留完整模块资源库入口。',
            recentModulesTitle: '最近使用',
            recentModulesNote: 'Recent Modules',
            suggestedTitle: '高频推荐',
            suggestedNote: 'Suggested',
            utilitiesTitle: '系统动作',
            utilitiesNote: 'Utilities',
            noRecent: '还没有可回跳的最近模块，可以先从当前分类或全部模块进入。',
            appLibraryTitle: '模块资源库',
            appLibraryCopy: '像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。',
            appLibrarySearch: '搜索模块、功能或分类',
            appLibrarySearchTitle: '搜索结果',
            appLibrarySearchNote: 'Results',
            appLibrarySearchEmpty: '没有匹配的模块，试试更短的关键词。',
            appLibraryCurrentTitle: '当前分类',
            appLibraryCurrentNote: 'Now Browsing',
            appLibraryAllTitle: '全部分类',
            appLibraryAllNote: 'App Library',
            allModulesTitle: '全部模块',
            allModulesCopy: '找不到所需功能时，直接打开完整模块总览。',
            searchTitle: '全局搜索',
            searchCopy: '快速搜索学生、模块和常用入口。',
            cohortsTitle: '切换届别',
            cohortsCopy: '在不同届别工作区之间快速跳转。',
            passwordTitle: '修改密码',
            passwordCopy: '直接打开当前账号的密码修改入口。',
            logoutTitle: '退出登录',
            logoutCopy: '返回登录页，重新选择账号进入。',
            accountTitle: '账号与设置',
            accountCopy: 'APK 默认跟随系统主题，并把常用设置集中到这一层。',
            currentSchool: '当前学校',
            currentCohort: '当前届别',
            themeMode: '主题模式',
            themeDark: '深色',
            themeLight: '浅色',
            followSystem: '跟随系统',
            runtimeEnv: '运行环境',
            mobileBrowser: '移动浏览器',
            notLoggedIn: '未登录',
            unknownSchool: '未识别学校',
            switchCohortTitle: '切换届别',
            switchCohortCopy: '统一从这里切届别，避免手机端入口与工作区状态脱节。',
            noCohorts: '暂无可切换届别。',
            noCohortChoices: '当前没有可切换的届别，请先完成数据恢复。',
            usingCurrentCohort: '当前正在使用的届别。',
            switchToThisCohort: '点击切换到这个届别。'
        };
    }

    function getThemeLabel() {
        return document.body.dataset.systemTheme === 'dark' ? getShellCopy().themeDark : getShellCopy().themeLight;
    }

    function getModuleSearchText(item, category = null) {
        return [
            item?.text,
            item?.hint,
            item?.id,
            category?.title,
            category?.eyebrow
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
    }

    function getLibrarySearchResults() {
        const needle = String(libraryQuery || '').trim().toLowerCase();
        if (!needle) return [];

        return uniqueItems(
            getAllowedCategories().flatMap((category) => category.items
                .filter((item) => getModuleSearchText(item, category).includes(needle))
                .map((item) => ({
                    ...item,
                    categoryTitle: category.title,
                    categoryKey: category.key,
                    categoryColor: category.color
                })))
        );
    }

    function buildSheetHeader(title, copy) {
        return `
            <div class="apk-sheet-header">
                <div>
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml(copy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-sheet" aria-label="${escapeHtml(getShellCopy().closeSheet)}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `;
    }

    function buildSectionHead(title, note) {
        return `
            <div class="apk-sheet-section-head">
                <span class="apk-sheet-section-title">${escapeHtml(title)}</span>
                <span class="apk-sheet-section-note">${escapeHtml(note)}</span>
            </div>
        `;
    }

    function buildModuleCard(item, activeId) {
        const copy = getShellCopy();
        const active = item.id === activeId ? ' is-active' : '';
        return `
            <button type="button" class="apk-sheet-card${active}" data-apk-module="${escapeHtml(item.id)}">
                <strong>${escapeHtml(item.text || item.id)}</strong>
                <span>${escapeHtml(item.hint || item.categoryTitle || copy.openModule)}</span>
            </button>
        `;
    }

    function buildActionCard(action, title, copy, icon, extraClass = '') {
        return `
            <button type="button" class="apk-sheet-card apk-sheet-card--action${extraClass ? ` ${extraClass}` : ''}" data-apk-action="${escapeHtml(action)}">
                <i class="${escapeHtml(icon)}"></i>
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(copy)}</span>
            </button>
        `;
    }

    function buildSwitchRow(item, activeId) {
        const copy = getShellCopy();
        const active = item.id === activeId;
        return `
            <button type="button" class="apk-switch-row${active ? ' is-active' : ''}" data-apk-module="${escapeHtml(item.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${escapeHtml(item.text || item.id)}</strong>
                    <span>${escapeHtml(item.hint || item.categoryTitle || '跨分类快速直达')}</span>
                </span>
                <span class="apk-switch-row-meta">${active ? copy.current : copy.open}</span>
            </button>
        `;
    }

    function buildLibraryMiniTile(item, activeId) {
        const badge = String(item.text || item.id || '').trim().slice(0, 2) || '模块';
        return `
            <button type="button" class="apk-library-mini${item.id === activeId ? ' is-active' : ''}" data-apk-module="${escapeHtml(item.id)}">
                <span class="apk-library-mini-badge">${escapeHtml(badge)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${escapeHtml(item.text || item.id)}</strong>
                    <span>${escapeHtml(item.hint || item.categoryTitle || '模块')}</span>
                </span>
            </button>
        `;
    }

    function buildLibraryCategoryCard(category, activeId) {
        return `
            <article class="apk-library-card" style="--apk-library-accent:${escapeHtml(category.color || '#2563eb')}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${escapeHtml(category.title)}</strong>
                        <span>${escapeHtml(`${category.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${escapeHtml(String(category.items.length).padStart(2, '0'))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${category.items.slice(0, 4).map((item) => buildLibraryMiniTile({
                        ...item,
                        categoryTitle: category.title
                    }, activeId)).join('')}
                </div>
            </article>
        `;
    }

    function buildLibraryHtml() {
        const copy = getShellCopy();
        const activeId = getActiveModuleId();
        const searchValue = String(libraryQuery || '').trim();
        const searchResults = getLibrarySearchResults();
        const currentCategory = getCurrentCategory();
        const recentModules = uniqueItems([
            ...getRecentModules(6),
            getActiveItem()
        ]).slice(0, 6);
        const recentIds = new Set(recentModules.map((item) => item.id));
        const suggestedModules = getQuickModules(6 + recentIds.size)
            .filter((item) => !recentIds.has(item.id))
            .slice(0, 6);
        const categories = getAllowedCategories();

        return `
            <div class="apk-library-head">
                <div class="apk-library-head-copy">
                    <strong>${escapeHtml(copy.appLibraryTitle)}</strong>
                    <span>${escapeHtml(copy.appLibraryCopy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-library" aria-label="${escapeHtml(copy.closeLibrary)}">
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>
            <label class="apk-library-search">
                <i class="ti ti-search"></i>
                <input type="search" data-apk-library-search value="${escapeHtml(searchValue)}" placeholder="${escapeHtml(copy.appLibrarySearch)}" autocomplete="off" />
            </label>
            ${searchValue
                ? `
                    <section class="apk-library-section">
                        ${buildSectionHead(copy.appLibrarySearchTitle, copy.appLibrarySearchNote)}
                        ${searchResults.length
                            ? `<div class="apk-sheet-grid apk-library-results">${searchResults.map((item) => buildModuleCard(item, activeId)).join('')}</div>`
                            : `<div class="apk-sheet-empty">${escapeHtml(copy.appLibrarySearchEmpty)}</div>`}
                    </section>
                `
                : `
                    <section class="apk-library-section">
                        ${buildSectionHead(copy.recentModulesTitle, copy.recentModulesNote)}
                        ${recentModules.length
                            ? `<div class="apk-switch-list">${recentModules.map((item) => buildSwitchRow(item, activeId)).join('')}</div>`
                            : `<div class="apk-sheet-empty">${escapeHtml(copy.noRecent)}</div>`}
                    </section>
                    ${suggestedModules.length
                        ? `
                            <section class="apk-library-section">
                                ${buildSectionHead(copy.suggestedTitle, copy.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${suggestedModules.map((item) => buildModuleCard(item, activeId)).join('')}
                                </div>
                            </section>
                        `
                        : ''}
                    ${currentCategory?.items?.length
                        ? `
                            <section class="apk-library-section">
                                ${buildSectionHead(copy.appLibraryCurrentTitle, copy.appLibraryCurrentNote)}
                                <article class="apk-library-spotlight" style="--apk-library-accent:${escapeHtml(currentCategory.color || '#2563eb')}">
                                    <div class="apk-library-card-head">
                                        <div>
                                            <strong>${escapeHtml(currentCategory.title)}</strong>
                                            <span>${escapeHtml(`${currentCategory.items.length} 个模块`)}</span>
                                        </div>
                                        <span class="apk-library-card-count">${escapeHtml(String(currentCategory.items.length).padStart(2, '0'))}</span>
                                    </div>
                                    <div class="apk-library-mini-grid">
                                        ${currentCategory.items.slice(0, 4).map((item) => buildLibraryMiniTile({
                                            ...item,
                                            categoryTitle: currentCategory.title
                                        }, activeId)).join('')}
                                    </div>
                                </article>
                            </section>
                        `
                        : ''}
                    <section class="apk-library-section">
                        ${buildSectionHead(copy.appLibraryAllTitle, copy.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${categories.map((category) => buildLibraryCategoryCard(category, activeId)).join('')}
                        </div>
                    </section>
                `}
        `;
    }

    function ensureShellRoot() {
        let root = document.getElementById('apk-mobile-shell');
        if (root) return root;

        const copy = getShellCopy();
        root = document.createElement('div');
        root.id = 'apk-mobile-shell';
        root.setAttribute('aria-hidden', 'true');
        root.innerHTML = `
            <div class="apk-shell-top">
                <div class="apk-shell-topbar apk-shell-surface">
                    <button type="button" class="apk-shell-icon" data-apk-action="library" aria-label="${escapeHtml(copy.openLibrary)}">
                        <i class="ti ti-layout-sidebar-left-expand"></i>
                    </button>
                    <div class="apk-shell-copy">
                        <span class="apk-shell-kicker" data-apk-field="role">${escapeHtml(copy.workbench)}</span>
                        <strong class="apk-shell-title" data-apk-field="title">校衡台</strong>
                        <span class="apk-shell-subtitle" data-apk-field="subtitle">${escapeHtml(copy.mobilePreparing)}</span>
                    </div>
                    <button type="button" class="apk-shell-icon" data-apk-action="search" aria-label="${escapeHtml(copy.openSearch)}">
                        <i class="ti ti-search"></i>
                    </button>
                </div>
                <div class="apk-shell-meta">
                    <button type="button" class="apk-shell-pill apk-shell-surface" data-apk-action="cohorts">
                        <i class="ti ti-id-badge-2"></i>
                        <span data-apk-field="cohort">${escapeHtml(copy.cohortPlaceholder)}</span>
                    </button>
                    <div class="apk-shell-pill apk-shell-surface is-static">
                        <i class="ti ti-device-imac"></i>
                        <span data-apk-field="mode">${escapeHtml(copy.workbench)}</span>
                    </div>
                </div>
                <div class="apk-shell-rail" data-apk-rail></div>
            </div>
            <button type="button" class="apk-shell-library-backdrop" data-apk-action="close-library" aria-label="${escapeHtml(copy.closeLibrary)}"></button>
            <div class="apk-shell-library">
                <div class="apk-shell-library-panel apk-shell-surface" data-apk-library-panel></div>
            </div>
            <button type="button" class="apk-shell-backdrop" data-apk-action="close-sheet" aria-label="${escapeHtml(copy.closeSheet)}"></button>
            <div class="apk-shell-sheet">
                <div class="apk-shell-sheet-panel apk-shell-surface" data-apk-sheet-panel></div>
            </div>
            <div class="apk-shell-tabs apk-shell-surface">
                <button type="button" class="apk-shell-tab" data-apk-tab="home">
                    <i class="ti ti-home"></i>
                    <span>${escapeHtml(copy.home)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="modules">
                    <i class="ti ti-layout-grid"></i>
                    <span>${escapeHtml(copy.modules)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="quick">
                    <i class="ti ti-history"></i>
                    <span>${escapeHtml(copy.recent)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="account">
                    <i class="ti ti-user-circle"></i>
                    <span>${escapeHtml(copy.account)}</span>
                </button>
            </div>
        `;

        root.addEventListener('click', handleShellClick);
        root.addEventListener('input', handleShellInput);
        document.body.appendChild(root);
        return root;
    }

    function buildModulesSheetHtml() {
        const copy = getShellCopy();
        const categories = getAllowedCategories();
        const activeId = getActiveModuleId();

        if (!categories.length) {
            return `${buildSheetHeader(copy.moduleOverviewTitle, copy.noModules)}
                <div class="apk-sheet-empty">${escapeHtml(copy.noModules)}</div>`;
        }

        return [
            buildSheetHeader(copy.moduleOverviewTitle, copy.moduleOverviewCopy),
            ...categories.map((category) => `
                <section class="apk-sheet-section">
                    ${buildSectionHead(category.title, category.eyebrow || copy.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${category.items.map((item) => buildModuleCard({
                            ...item,
                            categoryTitle: category.title
                        }, activeId)).join('')}
                    </div>
                </section>
            `)
        ].join('');
    }

    function buildRecentQuickSheetHtml() {
        const copy = getShellCopy();
        const activeId = getActiveModuleId();
        const recentModules = uniqueItems([
            ...getRecentModules(RECENT_MODULE_LIMIT),
            getActiveItem()
        ]).slice(0, 4);
        const recentIds = new Set(recentModules.map((item) => item.id));
        const quickModules = getQuickModules(QUICK_MODULE_LIMIT + recentIds.size)
            .filter((item) => !recentIds.has(item.id))
            .slice(0, QUICK_MODULE_LIMIT);
        const quickActions = [
            buildActionCard('library', copy.allModulesTitle, copy.allModulesCopy, 'ti ti-layout-sidebar-left-expand'),
            buildActionCard('search', copy.searchTitle, copy.searchCopy, 'ti ti-search'),
            buildActionCard('cohorts', copy.cohortsTitle, copy.cohortsCopy, 'ti ti-id-badge-2'),
            typeof window.openUserPasswordModal === 'function'
                ? buildActionCard('password', copy.passwordTitle, copy.passwordCopy, 'ti ti-lock')
                : '',
            buildActionCard('logout', copy.logoutTitle, copy.logoutCopy, 'ti ti-logout', 'is-danger')
        ].filter(Boolean);

        return `
            ${buildSheetHeader(copy.quickTitle, copy.quickCopy)}
            <section class="apk-quick-hero">
                <div class="apk-quick-hero-copy">
                    <strong>${escapeHtml(copy.quickHeroTitle)}</strong>
                    <span>${escapeHtml(copy.quickHeroCopy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="library" aria-label="${escapeHtml(copy.openLibrary)}">
                    <i class="ti ti-layout-sidebar-left-expand"></i>
                </button>
            </section>
            <section class="apk-sheet-section">
                ${buildSectionHead(copy.recentModulesTitle, copy.recentModulesNote)}
                ${recentModules.length
                    ? `<div class="apk-switch-list">${recentModules.map((item) => buildSwitchRow(item, activeId)).join('')}</div>`
                    : `<div class="apk-sheet-empty">${escapeHtml(copy.noRecent)}</div>`}
            </section>
            ${quickModules.length
                ? `
                    <section class="apk-sheet-section">
                        ${buildSectionHead(copy.suggestedTitle, copy.suggestedNote)}
                        <div class="apk-sheet-grid">
                            ${quickModules.map((item) => buildModuleCard(item, activeId)).join('')}
                        </div>
                    </section>
                `
                : ''}
            <section class="apk-sheet-section">
                ${buildSectionHead(copy.utilitiesTitle, copy.utilitiesNote)}
                <div class="apk-sheet-grid">
                    ${quickActions.join('')}
                </div>
            </section>
        `;
    }

    function buildAccountSheetHtml() {
        const copy = getShellCopy();
        const user = getCurrentUser();

        return `
            ${buildSheetHeader(copy.accountTitle, copy.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${escapeHtml(user?.name || copy.notLoggedIn)}</div>
                    <div class="apk-account-role">${escapeHtml(humanizeRole())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${escapeHtml(copy.currentSchool)}</span>
                            <strong>${escapeHtml(getCurrentSchool() || copy.unknownSchool)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${escapeHtml(copy.currentCohort)}</span>
                            <strong>${escapeHtml(getCurrentCohortLabel())}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${escapeHtml(copy.themeMode)}</span>
                            <strong>${escapeHtml(`${copy.followSystem} · ${getThemeLabel()}`)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${escapeHtml(copy.runtimeEnv)}</span>
                            <strong>${escapeHtml(copy.mobileBrowser)}</strong>
                        </div>
                    </div>
                </div>
            </section>
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${buildActionCard('cohorts', copy.cohortsTitle, copy.cohortsCopy, 'ti ti-id-badge-2')}
                    ${buildActionCard('search', copy.searchTitle, copy.searchCopy, 'ti ti-search')}
                    ${buildActionCard('library', copy.allModulesTitle, copy.allModulesCopy, 'ti ti-layout-sidebar-left-expand')}
                    ${typeof window.openUserPasswordModal === 'function'
                        ? buildActionCard('password', copy.passwordTitle, copy.passwordCopy, 'ti ti-lock')
                        : ''}
                    ${buildActionCard('logout', copy.logoutTitle, copy.logoutCopy, 'ti ti-logout', 'is-danger')}
                </div>
            </section>
        `;
    }

    function buildCohortsSheetHtml() {
        const copy = getShellCopy();
        const options = getCohortOptions();
        const currentValue = document.getElementById('cohort-selector')?.value || '';

        if (!options.length) {
            return `${buildSheetHeader(copy.switchCohortTitle, copy.noCohortChoices)}
                <div class="apk-sheet-empty">${escapeHtml(copy.noCohorts)}</div>`;
        }

        return `
            ${buildSheetHeader(copy.switchCohortTitle, copy.switchCohortCopy)}
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${options.map((option) => `
                        <button type="button" class="apk-sheet-card${option.value === currentValue ? ' is-active' : ''}" data-apk-cohort="${escapeHtml(option.value)}">
                            <strong>${escapeHtml(option.label)}</strong>
                            <span>${escapeHtml(option.value === currentValue ? copy.usingCurrentCohort : copy.switchToThisCohort)}</span>
                        </button>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderLibrary(root) {
        const panel = root.querySelector('[data-apk-library-panel]');
        if (!panel) return;
        setHtmlIfChanged(panel, libraryOpen ? buildLibraryHtml() : '');
    }

    function renderSheet() {
        const root = ensureShellRoot();
        const panel = root.querySelector('[data-apk-sheet-panel]');
        if (!panel) return;

        if (!sheetMode) {
            setHtmlIfChanged(panel, '');
            return;
        }
        if (sheetMode === 'modules') {
            setHtmlIfChanged(panel, buildModulesSheetHtml());
            return;
        }
        if (sheetMode === 'quick') {
            setHtmlIfChanged(panel, buildRecentQuickSheetHtml());
            return;
        }
        if (sheetMode === 'account') {
            setHtmlIfChanged(panel, buildAccountSheetHtml());
            return;
        }
        if (sheetMode === 'cohorts') {
            setHtmlIfChanged(panel, buildCohortsSheetHtml());
        }
    }

    function renderRail(root) {
        const copy = getShellCopy();
        const rail = root.querySelector('[data-apk-rail]');
        if (!rail) return;

        const currentCategory = getCurrentCategory();
        const activeId = getActiveModuleId();

        if (!currentCategory?.items?.length) {
            setHtmlIfChanged(rail, `<div class="apk-rail-empty">${escapeHtml(copy.currentCategoryEmpty)}</div>`);
            return;
        }

        const railHtml = currentCategory.items.map((item) => `
            <button type="button" class="apk-rail-chip${item.id === activeId ? ' is-active' : ''}" data-apk-module="${escapeHtml(item.id)}">
                ${escapeHtml(item.text || item.id)}
            </button>
        `).join('');

        if (setHtmlIfChanged(rail, railHtml)) {
            window.requestAnimationFrame(() => scrollActiveRailChipIntoView(root));
        }
    }

    function renderTabs(root) {
        const activeId = getActiveModuleId();
        const homeId = getHomeModuleId();
        root.querySelectorAll('.apk-shell-tab').forEach((button) => {
            const tab = button.getAttribute('data-apk-tab');
            const active = (
                !libraryOpen
                && (
                    (tab === 'home' && !sheetMode && activeId === homeId)
                    || (tab === 'modules' && sheetMode === 'modules')
                    || (tab === 'quick' && sheetMode === 'quick')
                    || (tab === 'account' && sheetMode === 'account')
                )
            );
            toggleClassIfChanged(button, 'is-active', active);
        });
    }

    function renderShell() {
        const copy = getShellCopy();
        const root = ensureShellRoot();
        const activeItem = getActiveItem();
        const currentCategory = getCurrentCategory();
        const subtitle = [
            getCurrentSchool() || copy.unknownSchool,
            currentCategory?.title || copy.workbench,
            getCurrentCohortLabel()
        ].filter(Boolean).join(' · ');

        setStylePropertyIfChanged(root, '--apk-accent', activeItem?.categoryColor || currentCategory?.color || '#2563eb');
        root.setAttribute('aria-hidden', 'false');
        setDatasetIfChanged(root, 'sheetOpen', sheetMode ? 'true' : 'false');
        setDatasetIfChanged(root, 'sheetMode', sheetMode || '');
        setDatasetIfChanged(root, 'libraryOpen', libraryOpen ? 'true' : 'false');

        const fields = {
            role: `${humanizeRole()}工作台`,
            title: activeItem?.text || '校衡台',
            subtitle,
            cohort: getCurrentCohortLabel(),
            mode: copy.workbench
        };

        Object.entries(fields).forEach(([key, value]) => {
            const node = root.querySelector(`[data-apk-field="${key}"]`);
            setTextIfChanged(node, value);
        });

        syncShellModalState(root);
        renderRail(root);
        renderSheet();
        renderLibrary(root);
        renderTabs(root);
    }

    function setLibraryOpen(nextOpen, options = {}) {
        libraryOpen = !!nextOpen;
        if (libraryOpen) {
            sheetMode = '';
        }
        if (!libraryOpen && options.resetQuery !== false) {
            libraryQuery = '';
        }
        renderShell();
    }

    function toggleLibrary(forceOpen) {
        const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : !libraryOpen;
        setLibraryOpen(nextOpen);
    }

    function setSheetMode(mode = '') {
        sheetMode = mode;
        if (mode) {
            libraryOpen = false;
            libraryQuery = '';
        }
        renderShell();
    }

    function toggleSheet(mode) {
        setSheetMode(sheetMode === mode ? '' : mode);
    }

    function activateModule(moduleId) {
        if (!moduleId || typeof window.switchTab !== 'function') return;
        sheetMode = '';
        libraryOpen = false;
        libraryQuery = '';
        renderShell();
        scrollPrimaryViewportToTop();
        window.switchTab(moduleId);
        rememberRecentModule(moduleId);
        if (moduleId === 'student-details') {
            scheduleStudentDetailsModuleFocus();
        }
        REFRESH_DELAYS.forEach((delay) => {
            window.setTimeout(() => {
                if (document.getElementById(moduleId)?.classList.contains('active')) {
                    refreshContentEnhancements();
                    if (moduleId === 'student-details' && typeof window.requestStudentDetailsPrimaryFocus === 'function') {
                        window.requestStudentDetailsPrimaryFocus();
                    }
                }
                scheduleRefresh();
            }, delay);
        });
    }

    function openSpotlightSearch() {
        libraryOpen = false;
        libraryQuery = '';
        setSheetMode('');
        if (typeof window.openSpotlight === 'function') {
            window.openSpotlight();
        }
    }

    function openPasswordModal() {
        libraryOpen = false;
        libraryQuery = '';
        setSheetMode('');
        if (typeof window.openUserPasswordModal === 'function') {
            window.openUserPasswordModal();
        }
    }

    function handleTab(tabName) {
        if (tabName === 'home') {
            activateModule(getHomeModuleId());
            return;
        }
        if (tabName === 'modules') {
            toggleSheet('modules');
            return;
        }
        if (tabName === 'quick') {
            toggleSheet('quick');
            return;
        }
        if (tabName === 'account') {
            toggleSheet('account');
        }
    }

    function handleShellInput(event) {
        const searchInput = event.target.closest('[data-apk-library-search]');
        if (!searchInput) return;
        const caret = typeof searchInput.selectionStart === 'number'
            ? searchInput.selectionStart
            : String(searchInput.value || '').length;
        libraryQuery = String(searchInput.value || '');
        renderShell();
        if (!libraryOpen) return;
        const nextInput = document.querySelector('[data-apk-library-search]');
        if (!nextInput) return;
        if (typeof nextInput.focus === 'function') {
            nextInput.focus({ preventScroll: true });
        }
        if (typeof nextInput.setSelectionRange === 'function') {
            nextInput.setSelectionRange(caret, caret);
        }
    }

    function handleShellClick(event) {
        const trigger = event.target.closest('[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]');
        if (!trigger) return;

        event.preventDefault();

        const moduleId = trigger.getAttribute('data-apk-module');
        if (moduleId) {
            activateModule(moduleId);
            return;
        }

        const cohortValue = trigger.getAttribute('data-apk-cohort');
        if (cohortValue) {
            switchCohort(cohortValue);
            return;
        }

        const tabName = trigger.getAttribute('data-apk-tab');
        if (tabName) {
            handleTab(tabName);
            return;
        }

        const action = trigger.getAttribute('data-apk-action');
        if (action === 'close-sheet') {
            setSheetMode('');
            return;
        }
        if (action === 'library') {
            toggleLibrary();
            return;
        }
        if (action === 'close-library') {
            toggleLibrary(false);
            return;
        }
        if (action === 'modules') {
            toggleSheet('modules');
            return;
        }
        if (action === 'quick') {
            toggleSheet('quick');
            return;
        }
        if (action === 'account') {
            toggleSheet('account');
            return;
        }
        if (action === 'cohorts') {
            toggleSheet('cohorts');
            return;
        }
        if (action === 'search') {
            openSpotlightSearch();
            return;
        }
        if (action === 'password') {
            openPasswordModal();
            return;
        }
        if (action === 'logout' && window.Auth && typeof window.Auth.logout === 'function') {
            libraryOpen = false;
            libraryQuery = '';
            setSheetMode('');
            window.Auth.logout();
        }
    }

    function handleShellTouchStart(event) {
        if (!isMobileViewport() || !isLoggedIn() || isParentLikeRole() || isBlockingDialogVisible()) return;
        const touch = event.touches?.[0];
        if (!touch) return;
        shellGesture = {
            startX: touch.clientX,
            startY: touch.clientY,
            canOpenLibrary: !libraryOpen && !sheetMode && touch.clientX <= 28,
            canCloseLibrary: libraryOpen
        };
    }

    function handleShellTouchMove(event) {
        if (!shellGesture) return;
        const touch = event.touches?.[0];
        if (!touch) return;
        const deltaX = touch.clientX - shellGesture.startX;
        const deltaY = touch.clientY - shellGesture.startY;
        if (Math.abs(deltaY) > 42) {
            shellGesture = null;
            return;
        }
        if (shellGesture.canOpenLibrary && deltaX >= 80) {
            toggleLibrary(true);
            shellGesture = null;
            return;
        }
        if (shellGesture.canCloseLibrary && deltaX <= -80) {
            toggleLibrary(false);
            shellGesture = null;
        }
    }

    function handleShellTouchEnd() {
        shellGesture = null;
    }

    function wrapMethod(target, methodName, marker) {
        if (!target || typeof target[methodName] !== 'function' || target[methodName][marker]) return;
        const original = target[methodName];
        const wrapped = function () {
            const result = original.apply(this, arguments);
            scheduleRefresh();
            REFRESH_DELAYS.forEach((delay) => {
                window.setTimeout(scheduleRefresh, delay);
            });
            return result;
        };
        wrapped[marker] = true;
        target[methodName] = wrapped;
    }

    function hookSwalLifecycle() {
        if (!window.Swal) return;
        wrapMethod(window.Swal, 'close', '__apkMobileWrapped__');
        if (typeof window.Swal.fire === 'function' && !window.Swal.fire.__apkMobileWrapped__) {
            const originalFire = window.Swal.fire;
            const wrappedFire = function () {
                const result = originalFire.apply(window.Swal, arguments);
                scheduleRefresh();
                window.setTimeout(dismissPassiveSwal, 1200);
                REFRESH_DELAYS.forEach((delay) => {
                    window.setTimeout(scheduleRefresh, delay);
                });
                if (result && typeof result.finally === 'function') {
                    result.finally(() => {
                        REFRESH_DELAYS.forEach((delay) => {
                            window.setTimeout(scheduleRefresh, delay);
                        });
                    });
                }
                return result;
            };
            wrappedFire.__apkMobileWrapped__ = true;
            window.Swal.fire = wrappedFire;
        }
    }

    function ensureHooks() {
        wrapMethod(window, 'switchTab', '__apkMobileWrapped__');
        wrapMethod(window, 'renderNavigation', '__apkMobileWrapped__');
        wrapMethod(window, 'switchNavCategory', '__apkMobileWrapped__');
        if (window.Auth) {
            wrapMethod(window.Auth, 'applyRoleView', '__apkMobileWrapped__');
            wrapMethod(window.Auth, 'renderParentView', '__apkMobileWrapped__');
        }
        hookSwalLifecycle();
    }

    function refreshMobileArchitecture() {
        resetMobileNavCache();
        ensureHooks();
        syncSystemTheme();

        const isMobile = isMobileViewport();
        const shouldUseShell = isMobile && isLoggedIn() && !isParentLikeRole();

        document.body.dataset.mobileQuery = isMobile ? 'true' : 'false';
        if (shouldUseShell) {
            document.body.dataset.mobileArchitecture = 'apk-v2';
        } else {
            delete document.body.dataset.mobileArchitecture;
        }

        syncDesktopAppVisibility();
        hideLegacyMobileShells();

        const root = ensureShellRoot();
        root.style.display = shouldUseShell ? 'block' : 'none';
        root.setAttribute('aria-hidden', shouldUseShell ? 'false' : 'true');

        if (!shouldUseShell) {
            sheetMode = '';
            libraryOpen = false;
            libraryQuery = '';
            root.dataset.sheetOpen = 'false';
            root.dataset.sheetMode = '';
            root.dataset.libraryOpen = 'false';
            root.dataset.modalOpen = 'false';
            return;
        }

        refreshContentEnhancements();
        renderShell();
    }

    function scheduleRefresh() {
        clearTimeout(refreshHandle);
        refreshHandle = window.setTimeout(refreshMobileArchitecture, 60);
    }

    const MobMgr = {
        switchTab(tabName) {
            const map = {
                home: getHomeModuleId(),
                students: 'student-details',
                analysis: 'summary'
            };
            if (tabName === 'me') {
                setSheetMode('account');
                return;
            }
            const moduleId = map[tabName] || tabName;
            activateModule(moduleId);
        },
        renderStudentList() {
            scheduleRefresh();
        },
        showStudentDetail() {
            scheduleRefresh();
        },
        renderAnalysis() {
            scheduleRefresh();
        },
        openModules() {
            setSheetMode('modules');
        },
        openLibrary() {
            toggleLibrary(true);
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
        refresh: scheduleRefresh
    };

    window.MobMgr = MobMgr;
    window.MobileQueryUI = {
        refresh: scheduleRefresh,
        openLibrary: () => toggleLibrary(true),
        openModules: () => setSheetMode('modules'),
        openQuick: () => setSheetMode('quick'),
        openAccount: () => setSheetMode('account'),
        openCohorts: () => setSheetMode('cohorts')
    };
    window.MobileExperienceRuntime = window.MobileExperienceRuntime || {
        install: installMobileExperienceRuntime,
        syncCompactState,
        isCompactViewport
    };
    window.MobDashboardMgr = window.MobDashboardMgr || {
        showToast(msg) {
            if (window.UI && typeof window.UI.toast === 'function') window.UI.toast(msg, 'info');
            else if (typeof window.showToast === 'function') window.showToast(msg);
            else window.alert(msg);
        }
    };
    window.switchMobileTab = (tabName) => MobMgr.switchTab(tabName);

    if (window.matchMedia) {
        themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        if (typeof themeMedia.addEventListener === 'function') {
            themeMedia.addEventListener('change', scheduleRefresh);
        } else if (typeof themeMedia.addListener === 'function') {
            themeMedia.addListener(scheduleRefresh);
        }
    }

    window.addEventListener('cloud-load-state', scheduleRefresh);
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('orientationchange', scheduleRefresh);
    window.addEventListener('load', scheduleRefresh);
    window.addEventListener('pageshow', scheduleRefresh);
    window.addEventListener('focus', scheduleRefresh);
    document.addEventListener('touchstart', handleShellTouchStart, { passive: true });
    document.addEventListener('touchmove', handleShellTouchMove, { passive: true });
    document.addEventListener('touchend', handleShellTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleShellTouchEnd, { passive: true });
    document.addEventListener('resume', scheduleRefresh, false);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) scheduleRefresh();
    });

    installMobileExperienceRuntime();
    REFRESH_DELAYS.forEach((delay) => {
        window.setTimeout(scheduleRefresh, delay);
    });

    scheduleRefresh();
    window.__MOBILE_MANAGER_PATCHED__ = true;
    window.__MOBILE_APP_RUNTIME_PATCHED__ = true;
})();
