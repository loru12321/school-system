(function () {
    const DESKTOP_MEDIA_QUERY = '(min-width: 1100px)';
    const DEFAULT_DESKTOP_COLLAPSED = true;
    let refreshFrame = 0;
    let desktopSidebarCollapsed = DEFAULT_DESKTOP_COLLAPSED;
    const analysisRailStates = new Map();

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

    window.toggleAppSidebar = toggleAppSidebar;
    window.setAppSidebarCollapsed = setAppSidebarCollapsed;
    window.refreshAnalysisSideRails = scheduleAnalysisRailRefresh;

    document.addEventListener('DOMContentLoaded', function () {
        restoreAppSidebar();
        refreshAnalysisSideRails();

        const observer = new MutationObserver(scheduleAnalysisRailRefresh);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    window.addEventListener('resize', handleViewportChange);
})();
