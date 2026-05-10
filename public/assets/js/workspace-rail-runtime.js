(function () {
    const DESKTOP_MEDIA_QUERY = '(min-width: 1100px)';
    const DEFAULT_DESKTOP_COLLAPSED = true;
    let refreshFrame = 0;
    let desktopSidebarCollapsed = DEFAULT_DESKTOP_COLLAPSED;
    const analysisRailStates = new Map();
    let moduleDockFrame = 0;
    let moduleDockBound = false;
    let moduleDockLastSignature = '';

    function isDesktopViewport() {
        return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
    }

    function getSidebar() {
        return document.getElementById('app-sidebar');
    }

    function getSidebarToggleButtons() {
        return Array.from(document.querySelectorAll('[data-sidebar-toggle="true"]'));
    }

    function syncSidebarToggleButtons(collapsed) {
        getSidebarToggleButtons().forEach((button) => {
            const isCollapsed = !!collapsed;
            const label = isCollapsed ? '展开左侧工作区' : '收起左侧工作区';
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
            button.setAttribute('aria-pressed', isCollapsed ? 'true' : 'false');

            const icon = button.querySelector('[data-sidebar-toggle-icon="true"]');
            if (icon) {
                icon.className = 'ti ' + (isCollapsed ? 'ti-chevrons-right' : 'ti-chevrons-left');
            }
        });
    }

    function setAppSidebarCollapsed(collapsed, options) {
        const sidebar = getSidebar();
        if (!sidebar) return;

        const rememberState = !options || options.rememberState !== false;
        const desiredCollapsed = !!collapsed;
        const shouldCollapse = desiredCollapsed && isDesktopViewport();

        if (rememberState) {
            desktopSidebarCollapsed = desiredCollapsed;
        }

        sidebar.classList.toggle('is-collapsed', shouldCollapse);
        document.body.classList.toggle('shell-sidebar-collapsed', shouldCollapse);

        if (!isDesktopViewport()) {
            sidebar.classList.remove('is-collapsed');
            document.body.classList.remove('shell-sidebar-collapsed');
        }

        syncSidebarToggleButtons(shouldCollapse);

        if (typeof window.refreshShellEnhancements === 'function') {
            window.refreshShellEnhancements();
        }
    }

    function toggleAppSidebar(force) {
        const sidebar = getSidebar();
        if (!sidebar) return;

        if (!isDesktopViewport()) {
            sidebar.classList.toggle('show-mobile');
            return;
        }

        const nextState = typeof force === 'boolean'
            ? !!force
            : !sidebar.classList.contains('is-collapsed');

        setAppSidebarCollapsed(nextState);
    }

    function restoreAppSidebar() {
        setAppSidebarCollapsed(desktopSidebarCollapsed, { rememberState: false });
    }

    function resolveAnalysisLayoutId(layout) {
        const owner = layout.closest('.section[id]');
        if (owner && owner.id) return owner.id;
        if (layout.id) return layout.id;
        return 'analysis-layout-' + Array.from(document.querySelectorAll('.analysis-results-layout')).indexOf(layout);
    }

    function getAnalysisRailState(layout) {
        const stateKey = resolveAnalysisLayoutId(layout);
        if (!analysisRailStates.has(stateKey)) {
            analysisRailStates.set(stateKey, DEFAULT_DESKTOP_COLLAPSED);
        }
        return analysisRailStates.get(stateKey);
    }

    function countAnalysisEntries(sideNav) {
        return sideNav ? sideNav.querySelectorAll('.side-nav-link').length : 0;
    }

    function syncAnalysisRailUi(layout) {
        const sideNav = layout.__analysisSideNav;
        const collapseButton = layout.__analysisCollapseButton;
        const revealButton = layout.__analysisRevealButton;
        if (!sideNav || !collapseButton || !revealButton) return;

        const titleText = layout.__analysisRailTitle || '功能导航';
        const count = countAnalysisEntries(sideNav);
        const collapsed = layout.classList.contains('is-side-collapsed');

        const collapseLabel = collapseButton.querySelector('[data-rail-label="true"]');
        if (collapseLabel) collapseLabel.textContent = '收起' + titleText;

        const revealLabel = revealButton.querySelector('[data-rail-label="true"]');
        if (revealLabel) revealLabel.textContent = '展开' + titleText;

        const collapseCount = collapseButton.querySelector('[data-rail-count="true"]');
        if (collapseCount) collapseCount.textContent = String(count);

        const revealCount = revealButton.querySelector('[data-rail-count="true"]');
        if (revealCount) revealCount.textContent = String(count);

        collapseButton.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
        revealButton.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
    }

    function setAnalysisRailCollapsed(layout, collapsed, options) {
        if (!layout) return;

        const rememberState = !options || options.rememberState !== false;
        const desiredCollapsed = !!collapsed;
        const shouldCollapse = desiredCollapsed && isDesktopViewport();
        const stateKey = resolveAnalysisLayoutId(layout);

        if (rememberState) {
            analysisRailStates.set(stateKey, desiredCollapsed);
        }

        layout.classList.toggle('is-side-collapsed', shouldCollapse);
        syncAnalysisRailUi(layout);
    }

    function createRailButton(className, labelText, iconName) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.innerHTML =
            '<i class="ti ' + iconName + '"></i>' +
            '<span data-rail-label="true">' + labelText + '</span>' +
            '<span class="' +
            (className.indexOf('reveal') >= 0 ? 'analysis-side-reveal__count' : 'analysis-side-toggle__count') +
            '" data-rail-count="true">0</span>';
        return button;
    }

    function getActiveModuleId() {
        const activeSection = document.querySelector('.section.active[id]');
        return activeSection ? activeSection.id : '';
    }

    function ensureModuleDockStyles() {
        if (document.getElementById('module-subnav-dock-style')) return;
        const style = document.createElement('style');
        style.id = 'module-subnav-dock-style';
        style.textContent = `
            .module-subnav-dock {
                position:fixed;
                right:18px;
                top:50%;
                transform:translateY(-50%);
                z-index:760;
                width:58px;
                max-height:min(68vh, 640px);
                padding:10px 8px;
                border:1px solid rgba(148, 163, 184, 0.28);
                border-radius:24px;
                background:rgba(255, 255, 255, 0.88);
                box-shadow:0 18px 46px rgba(15, 23, 42, 0.12);
                backdrop-filter:blur(20px) saturate(160%);
                overflow:hidden;
                transition:width 180ms ease, border-radius 180ms ease, box-shadow 180ms ease;
            }
            .module-subnav-dock:hover,
            .module-subnav-dock:focus-within {
                width:238px;
                border-radius:22px;
                box-shadow:0 24px 68px rgba(15, 23, 42, 0.16);
            }
            .module-subnav-dock__head {
                display:flex;
                align-items:center;
                gap:10px;
                min-height:36px;
                padding:0 5px 8px;
                border-bottom:1px solid rgba(226, 232, 240, 0.86);
                margin-bottom:8px;
                white-space:nowrap;
            }
            .module-subnav-dock__head i {
                width:34px;
                height:34px;
                border-radius:14px;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                color:var(--dock-accent, #2563eb);
                background:var(--dock-soft, rgba(37, 99, 235, 0.10));
                flex:0 0 auto;
            }
            .module-subnav-dock__title {
                min-width:0;
                opacity:0;
                transform:translateX(-4px);
                transition:opacity 160ms ease, transform 160ms ease;
            }
            .module-subnav-dock:hover .module-subnav-dock__title,
            .module-subnav-dock:focus-within .module-subnav-dock__title {
                opacity:1;
                transform:none;
            }
            .module-subnav-dock__title strong {
                display:block;
                font-size:13px;
                line-height:1.25;
                color:#0f172a;
            }
            .module-subnav-dock__title span {
                display:block;
                margin-top:2px;
                font-size:11px;
                color:#64748b;
            }
            .module-subnav-dock__list {
                display:flex;
                flex-direction:column;
                gap:6px;
                max-height:calc(min(68vh, 640px) - 58px);
                overflow-y:auto;
                scrollbar-width:none;
            }
            .module-subnav-dock__list::-webkit-scrollbar { width:0; height:0; }
            .module-subnav-dock__item {
                appearance:none;
                width:100%;
                min-height:42px;
                border:0;
                border-radius:16px;
                background:transparent;
                color:#475569;
                display:grid;
                grid-template-columns:34px minmax(0, 1fr);
                align-items:center;
                gap:10px;
                padding:4px 6px;
                cursor:pointer;
                text-align:left;
                transition:background 140ms ease, color 140ms ease, transform 140ms ease;
            }
            .module-subnav-dock__item:hover {
                background:rgba(241, 245, 249, 0.92);
                transform:translateX(-1px);
            }
            .module-subnav-dock__item.is-active {
                color:var(--dock-accent, #2563eb);
                background:var(--dock-soft, rgba(37, 99, 235, 0.12));
                font-weight:800;
            }
            .module-subnav-dock__icon {
                width:34px;
                height:34px;
                border-radius:14px;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                color:inherit;
                background:rgba(241, 245, 249, 0.88);
                flex:0 0 auto;
            }
            .module-subnav-dock__item.is-active .module-subnav-dock__icon {
                background:rgba(255, 255, 255, 0.76);
            }
            .module-subnav-dock__label {
                min-width:0;
                opacity:0;
                transform:translateX(-4px);
                transition:opacity 160ms ease, transform 160ms ease;
            }
            .module-subnav-dock:hover .module-subnav-dock__label,
            .module-subnav-dock:focus-within .module-subnav-dock__label {
                opacity:1;
                transform:none;
            }
            .module-subnav-dock__label strong {
                display:block;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                font-size:12px;
                line-height:1.25;
            }
            .module-subnav-dock__label span {
                display:block;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                margin-top:2px;
                font-size:10px;
                color:#94a3b8;
            }
            @media (max-width: 1100px) {
                .module-subnav-dock {
                    right:12px;
                    top:auto;
                    bottom:86px;
                    transform:none;
                    width:52px;
                    max-height:50vh;
                    padding:8px 7px;
                }
                .module-subnav-dock:hover,
                .module-subnav-dock:focus-within {
                    width:min(232px, calc(100vw - 28px));
                }
            }
            @media print {
                .module-subnav-dock { display:none !important; }
            }
        `;
        document.head.appendChild(style);
    }

    function getCurrentDockCategory() {
        const nav = window.NAV_STRUCTURE || {};
        const currentKey = typeof window.getCurrentNavCategory === 'function' ? window.getCurrentNavCategory() : '';
        const activeId = getActiveModuleId();
        if (currentKey && nav[currentKey]) return { key: currentKey, category: nav[currentKey] };
        const found = Object.entries(nav).find(([, category]) => {
            return Array.isArray(category.items) && category.items.some((item) => item.id === activeId);
        });
        return found ? { key: found[0], category: found[1] } : null;
    }

    function getModuleDockSignature(context, items, activeId) {
        const key = context?.key || '';
        const ids = items.map((item) => item.id).join('|');
        return [key, activeId, ids].join('::');
    }

    function syncModuleDockActiveState(dock, activeId) {
        if (!dock) return;
        dock.querySelectorAll('[data-dock-module-id]').forEach((button) => {
            const isActive = button.getAttribute('data-dock-module-id') === activeId;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    function bindModuleDockClick(dock) {
        if (!dock || dock.dataset.clickBound === 'true') return;
        dock.dataset.clickBound = 'true';
        dock.addEventListener('click', (event) => {
            const button = event.target?.closest?.('[data-dock-module-id]');
            if (!button || !dock.contains(button)) return;
            const moduleId = button.getAttribute('data-dock-module-id');
            if (!moduleId) return;
            if (typeof window.switchTab === 'function') window.switchTab(moduleId);
            window.setTimeout(() => {
                const section = document.getElementById(moduleId);
                if (section) section.scrollIntoView({ block: 'start', behavior: 'smooth' });
                scheduleModuleSubnavDockSync();
            }, 80);
        });
    }

    function syncModuleSubnavDock() {
        ensureModuleDockStyles();
        const app = document.getElementById('app');
        const modeMask = document.getElementById('mode-mask');
        let dock = document.getElementById('module-subnav-dock');
        const context = getCurrentDockCategory();
        const category = context && context.category;
        const items = Array.isArray(category?.items) ? category.items : [];
        const maskHidden = !modeMask || getComputedStyle(modeMask).display === 'none';
        const shouldShow = !!app && getComputedStyle(app).display !== 'none' && maskHidden && items.length > 1;

        if (!shouldShow) {
            if (dock) dock.remove();
            moduleDockLastSignature = '';
            return;
        }

        if (!dock) {
            dock = document.createElement('nav');
            dock.id = 'module-subnav-dock';
            dock.className = 'module-subnav-dock';
            dock.setAttribute('aria-label', '当前母模块子模块导航');
            document.body.appendChild(dock);
            moduleDockLastSignature = '';
        }
        bindModuleDockClick(dock);

        const activeId = getActiveModuleId();
        const nextSignature = getModuleDockSignature(context, items, activeId);
        if (moduleDockLastSignature === nextSignature) {
            syncModuleDockActiveState(dock, activeId);
            return;
        }
        moduleDockLastSignature = nextSignature;

        const accent = category.color || '#2563eb';
        dock.style.setProperty('--dock-accent', accent);
        dock.style.setProperty('--dock-soft', `color-mix(in srgb, ${accent} 14%, white)`);
        dock.innerHTML = `
            <div class="module-subnav-dock__head">
                <i class="ti ${category.icon || 'ti-layout-grid'}"></i>
                <span class="module-subnav-dock__title">
                    <strong>${category.title || '模块导航'}</strong>
                    <span>${items.length} 个子模块</span>
                </span>
            </div>
            <div class="module-subnav-dock__list">
                ${items.map((item, index) => `
                    <button type="button"
                        class="module-subnav-dock__item${item.id === activeId ? ' is-active' : ''}"
                        data-dock-module-id="${item.id}"
                        title="${item.text || ''}"
                        aria-label="${item.text || ''}"
                        aria-current="${item.id === activeId ? 'page' : 'false'}">
                        <span class="module-subnav-dock__icon"><i class="ti ${item.icon || 'ti-circle'}"></i></span>
                        <span class="module-subnav-dock__label">
                            <strong>${String(item.text || `子模块 ${index + 1}`)}</strong>
                            <span>${String(item.hint || '点击切换')}</span>
                        </span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function scheduleModuleSubnavDockSync() {
        if (moduleDockFrame) return;
        moduleDockFrame = window.requestAnimationFrame(() => {
            moduleDockFrame = 0;
            syncModuleSubnavDock();
        });
    }

    function bindModuleDockSyncEvents() {
        if (moduleDockBound) return;
        moduleDockBound = true;
        document.addEventListener('cloud-load-state', scheduleModuleSubnavDockSync);
        window.addEventListener('hashchange', scheduleModuleSubnavDockSync);
        window.addEventListener('popstate', scheduleModuleSubnavDockSync);
    }

    function enhanceAnalysisLayout(layout) {
        if (!layout || layout.dataset.analysisRailReady === 'true') return;

        const sideNav = layout.querySelector('.analysis-side-nav');
        const contentArea = layout.querySelector('.content-area');
        if (!sideNav || !contentArea) return;

        const titleText = (sideNav.querySelector('.side-nav-title')?.textContent || '功能导航').trim();
        const toolbar = document.createElement('div');
        toolbar.className = 'analysis-side-toolbar';

        const collapseButton = createRailButton('analysis-side-toggle', '收起' + titleText, 'ti-chevrons-left');
        collapseButton.addEventListener('click', function () {
            setAnalysisRailCollapsed(layout, true);
        });
        toolbar.appendChild(collapseButton);
        sideNav.prepend(toolbar);

        const revealHost = contentArea.querySelector('.analysis-content-stack') || contentArea;
        const revealWrap = document.createElement('div');
        revealWrap.className = 'analysis-side-reveal';

        const revealButton = createRailButton('analysis-side-reveal-btn', '展开' + titleText, 'ti-chevrons-right');
        revealButton.addEventListener('click', function () {
            setAnalysisRailCollapsed(layout, false);
        });
        revealWrap.appendChild(revealButton);
        revealHost.prepend(revealWrap);

        layout.__analysisSideNav = sideNav;
        layout.__analysisCollapseButton = collapseButton;
        layout.__analysisRevealButton = revealButton;
        layout.__analysisRailTitle = titleText;
        layout.dataset.analysisRailReady = 'true';

        syncAnalysisRailUi(layout);
    }

    function refreshAnalysisSideRails() {
        const layouts = Array.from(document.querySelectorAll('.analysis-results-layout'));
        layouts.forEach((layout) => {
            enhanceAnalysisLayout(layout);
            setAnalysisRailCollapsed(layout, getAnalysisRailState(layout), { rememberState: false });
        });
        scheduleModuleSubnavDockSync();
    }

    function scheduleAnalysisRailRefresh() {
        if (refreshFrame) return;
        refreshFrame = window.requestAnimationFrame(function () {
            refreshFrame = 0;
            refreshAnalysisSideRails();
        });
    }

    function handleViewportChange() {
        restoreAppSidebar();
        refreshAnalysisSideRails();
    }

    function mutationTouchesRailSkeleton(mutation) {
        const target = mutation.target;
        if (target?.classList?.contains?.('analysis-results-layout')) return true;
        if (target?.id === 'app' || target?.id === 'sub-nav-container') return true;
        return Array.from(mutation.addedNodes || []).some((node) => {
            if (!node || node.nodeType !== 1) return false;
            if (node.matches?.('.analysis-results-layout, .analysis-side-nav, .content-area')) return true;
            return !!node.querySelector?.('.analysis-results-layout, .analysis-side-nav, .content-area');
        });
    }

    window.toggleAppSidebar = toggleAppSidebar;
    window.setAppSidebarCollapsed = setAppSidebarCollapsed;
    window.refreshAnalysisSideRails = scheduleAnalysisRailRefresh;
    window.refreshModuleSubnavDock = scheduleModuleSubnavDockSync;

    document.addEventListener('DOMContentLoaded', function () {
        bindModuleDockSyncEvents();
        restoreAppSidebar();
        refreshAnalysisSideRails();
        syncModuleSubnavDock();

        const observer = new MutationObserver((mutations) => {
            if (mutations.some(mutationTouchesRailSkeleton)) {
                scheduleAnalysisRailRefresh();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    window.addEventListener('resize', handleViewportChange);
})();
