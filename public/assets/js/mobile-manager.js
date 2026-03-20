(() => {
    if (typeof window === 'undefined' || window.__MOBILE_MANAGER_PATCHED__) return;

    const MOBILE_BREAKPOINT = 960;

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

    function syncViewport() {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes');
        }
    }

    function hideLegacyMobileShell() {
        const mobApp = document.getElementById('mobile-manager-app');
        if (!mobApp) return;
        mobApp.style.display = 'none';
    }

    function showDesktopAppForMobile(role = '') {
        if (role === 'parent') return;
        const appEl = document.getElementById('app');
        if (appEl) {
            appEl.classList.remove('hidden');
            appEl.style.display = '';
        }
        const header = document.querySelector('header');
        if (header) header.style.display = '';
        const nav = document.querySelector('.nav-wrapper');
        if (nav) nav.style.display = '';
        const subNav = document.getElementById('sub-nav-container');
        if (subNav) subNav.style.display = '';
    }

    function markResponsiveTables(scope = document) {
        if (!isMobileViewport()) return;
        const tables = scope.querySelectorAll('.table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable');
        tables.forEach((table) => {
            if (table.dataset.mobileEnhanced === '1') return;
            const headerRows = table.querySelectorAll('thead tr');
            const headerCells = headerRows.length ? Array.from(headerRows[headerRows.length - 1].children) : [];
            if (!headerCells.length) return;

            table.classList.add('mobile-card-table');
            Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
                Array.from(row.children).forEach((cell, index) => {
                    if (!(cell instanceof HTMLElement)) return;
                    if (cell.hasAttribute('colspan')) return;
                    const headerText = headerCells[index]?.textContent?.replace(/\s+/g, ' ').trim() || `字段${index + 1}`;
                    cell.setAttribute('data-label', headerText);
                });
            });
            table.dataset.mobileEnhanced = '1';
        });
    }

    function scheduleRefresh() {
        [80, 260, 900].forEach(delay => {
            setTimeout(refreshMobileEnhancements, delay);
        });
    }

    function refreshMobileEnhancements() {
        syncViewport();
        hideLegacyMobileShell();
        const role = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser.role : '';
        document.body.dataset.mobileQuery = isMobileViewport() ? 'true' : 'false';
        if (isMobileViewport()) {
            showDesktopAppForMobile(role);
            markResponsiveTables(document);
        }
    }

    const MobMgr = {
        init() {
            refreshMobileEnhancements();
            return true;
        },
        switchTab(tabName) {
            const map = {
                home: 'starter-hub',
                students: 'student-details',
                analysis: 'summary',
                me: 'starter-hub'
            };
            if (typeof switchTab === 'function' && map[tabName]) {
                switchTab(map[tabName]);
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
        }
    };

    window.MobMgr = MobMgr;
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

    if (typeof window.switchTab === 'function') {
        const originalSwitchTab = window.switchTab;
        window.switchTab = function (id) {
            const result = originalSwitchTab.apply(this, arguments);
            scheduleRefresh();
            return result;
        };
    }

    window.addEventListener('resize', () => {
        scheduleRefresh();
    });

    scheduleRefresh();
    window.__MOBILE_MANAGER_PATCHED__ = true;
})();
