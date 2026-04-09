(function () {
    const SIMPLEBAR_TARGETS = [
        { selector: '#sidebar-nav', options: { autoHide: false } },
        { selector: '#spotlight-results', options: { autoHide: false } }
    ];

    let refreshHandle = 0;
    let tooltipInstances = [];
    let observersBound = false;
    let spotlightPatched = false;
    let pulseTweenBound = false;
    let scrollFxBound = false;
    let lastSectionId = '';

    function scheduleRefresh() {
        clearTimeout(refreshHandle);
        refreshHandle = window.setTimeout(refreshEnhancements, 70);
    }

    function isElementVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function isAppVisible() {
        const app = document.getElementById('app');
        return !!app && !app.classList.contains('hidden') && isElementVisible(app);
    }

    function getText(element, selector) {
        const target = selector ? element.querySelector(selector) : element;
        return target ? String(target.textContent || '').trim() : '';
    }

    function setTooltipText(element, text) {
        if (!element || !text) return;
        element.setAttribute('data-shell-tooltip', text);
    }

    function ensureSpotlightAnimationPatch() {
        if (spotlightPatched || typeof window.openSpotlight !== 'function' || !window.gsap) return;
        spotlightPatched = true;
        const originalOpenSpotlight = window.openSpotlight;
        window.openSpotlight = function () {
            originalOpenSpotlight.apply(this, arguments);
            const spotlightBox = document.querySelector('#spotlight-mask .spotlight-box');
            if (!spotlightBox) return;
            window.gsap.fromTo(
                spotlightBox,
                { autoAlpha: 0, y: 18, scale: 0.985 },
                { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out', overwrite: 'auto' }
            );
        };
    }

    function ensureSimpleBar() {
        if (typeof window.SimpleBar !== 'function') return;
        SIMPLEBAR_TARGETS.forEach(({ selector, options }) => {
            const element = document.querySelector(selector);
            if (!element || element.dataset.simplebarBound === 'true') return;
            if (selector === '#sidebar-nav' && !isAppVisible()) return;
            element.dataset.simplebarBound = 'true';
            try {
                new window.SimpleBar(element, options);
            } catch (error) {
                console.warn('[shell-polish] SimpleBar init skipped:', selector, error);
            }
        });
    }

    function destroyTooltips() {
        const instances = Array.isArray(tooltipInstances) ? tooltipInstances : [tooltipInstances];
        instances.forEach((instance) => {
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        });
        tooltipInstances = [];
    }

    function collectTooltipTargets() {
        const targets = [];

        const searchBox = document.getElementById('global-search-container');
        if (searchBox) {
            setTooltipText(searchBox, searchBox.getAttribute('data-shell-tooltip') || 'Search modules, reports, and shortcuts.');
            targets.push(searchBox);
        }

        document.querySelectorAll('.sidebar-footer-item').forEach((item) => {
            setTooltipText(item, item.getAttribute('title') || getText(item));
            targets.push(item);
        });

        const sidebarWorkbench = document.querySelector('.sidebar-workbench-card');
        if (sidebarWorkbench) {
            setTooltipText(sidebarWorkbench, sidebarWorkbench.getAttribute('data-shell-tooltip') || getText(sidebarWorkbench));
            targets.push(sidebarWorkbench);
        }

        document.querySelectorAll('.sidebar-workbench-trigger, .shell-launcher-button, .shell-overview-launcher, .workspace-drawer-close').forEach((item) => {
            setTooltipText(item, item.getAttribute('title') || getText(item));
            targets.push(item);
        });

        document.querySelectorAll('#sidebar-nav .sidebar-menu-item').forEach((item) => {
            const title = getText(item, '.sidebar-menu-item__title');
            const meta = getText(item, '.sidebar-menu-item__meta');
            const summary = item.getAttribute('data-shell-summary') || '';
            setTooltipText(item, summary || [title, meta].filter(Boolean).join(' · '));
            targets.push(item);
        });

        document.querySelectorAll('#sub-nav-container .shell-story-card').forEach((card) => {
            const title = getText(card, '.shell-story-card__title');
            const desc = getText(card, '.shell-story-card__desc');
            const meta = getText(card, '.shell-story-card__meta');
            setTooltipText(card, [title, desc, meta].filter(Boolean).join(' · '));
            targets.push(card);
        });

        document.querySelectorAll('#shell-module-rail .shell-module-rail-chip').forEach((chip) => {
            const text = getText(chip);
            const summary = chip.getAttribute('data-shell-summary') || '';
            setTooltipText(chip, summary || text);
            targets.push(chip);
        });

        [
            ['#shell-module-count', 'Current visible modules'],
            ['#shell-cohort-chip', 'Current cohort'],
            ['#shell-mode-chip', 'Workspace mode'],
            ['#shell-role-pill', 'Current role'],
            ['#shell-active-module', 'Current focus'],
            ['#shell-active-hint', 'Current hint']
        ].forEach(([selector, prefix]) => {
            const element = document.querySelector(selector);
            if (!element) return;
            const text = getText(element);
            setTooltipText(element, `${prefix}: ${text}`);
            targets.push(element);
        });

        return targets.filter((element, index, array) => array.indexOf(element) === index);
    }

    function ensureTooltips() {
        if (typeof window.tippy !== 'function') return;
        destroyTooltips();
        const targets = collectTooltipTargets();
        if (!targets.length) return;
        tooltipInstances = window.tippy(targets, {
            content(reference) {
                return reference.getAttribute('data-shell-tooltip') || reference.getAttribute('title') || '';
            },
            allowHTML: false,
            arrow: true,
            animation: 'shift-away',
            duration: [220, 160],
            delay: [80, 30],
            maxWidth: 320,
            placement: 'bottom',
            theme: 'shell',
            appendTo: document.body,
            touch: ['hold', 350]
        });
    }

    function animateNodes(nodes, fromVars, toVars) {
        if (!window.gsap || !nodes.length) return;
        window.gsap.fromTo(nodes, fromVars, toVars);
    }

    function ensurePulseTween() {
        if (!window.gsap || pulseTweenBound) return;
        const nodes = Array.from(document.querySelectorAll('#shell-overview .shell-pulse-item'));
        if (!nodes.length) return;
        pulseTweenBound = true;
        window.gsap.to(nodes, {
            y: -3,
            duration: 2.6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: {
                each: 0.18,
                from: 'start'
            }
        });
    }

    function ensureScrollEffects() {
        if (!window.gsap || !window.ScrollTrigger || scrollFxBound) return;
        scrollFxBound = true;
        window.gsap.registerPlugin(window.ScrollTrigger);
        document.querySelectorAll('#shell-overview .shell-overview-card').forEach((card) => {
            if (card.dataset.shellScrollBound === 'true') return;
            card.dataset.shellScrollBound = 'true';
            window.gsap.to(card, {
                y: -14,
                ease: 'none',
                scrollTrigger: {
                    trigger: card,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.6
                }
            });
        });
    }

    function animateShellChrome() {
        if (!window.gsap || !isAppVisible()) return;

        const header = document.getElementById('main-header');
        if (header && header.dataset.shellAnimated !== 'true') {
            header.dataset.shellAnimated = 'true';
            animateNodes(
                header,
                { autoAlpha: 0, y: 22 },
                { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power3.out' }
            );
        }

        const overviewCards = Array.from(document.querySelectorAll('#shell-overview .shell-overview-card'))
            .filter((node) => node.dataset.shellAnimated !== 'true');
        overviewCards.forEach((node) => { node.dataset.shellAnimated = 'true'; });
        animateNodes(
            overviewCards,
            { autoAlpha: 0, y: 24, scale: 0.985 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.56, ease: 'power3.out', stagger: 0.08 }
        );

        const sidebarItems = Array.from(document.querySelectorAll('#sidebar-nav .sidebar-menu-item'))
            .filter((node) => node.dataset.shellAnimated !== 'true');
        sidebarItems.forEach((node) => { node.dataset.shellAnimated = 'true'; });
        animateNodes(
            sidebarItems,
            { autoAlpha: 0, x: -18 },
            { autoAlpha: 1, x: 0, duration: 0.42, ease: 'power2.out', stagger: 0.04 }
        );

        const navCards = Array.from(document.querySelectorAll('#sub-nav-container .shell-story-card'))
            .filter((node) => node.dataset.shellAnimated !== 'true');
        navCards.forEach((node) => { node.dataset.shellAnimated = 'true'; });
        animateNodes(
            navCards,
            { autoAlpha: 0, y: 18, scale: 0.985 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.46, ease: 'power2.out', stagger: 0.05 }
        );

        const railChips = Array.from(document.querySelectorAll('#shell-module-rail .shell-module-rail-chip'))
            .filter((node) => node.dataset.shellAnimated !== 'true');
        railChips.forEach((node) => { node.dataset.shellAnimated = 'true'; });
        animateNodes(
            railChips,
            { autoAlpha: 0, y: 12, scale: 0.985 },
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: 'power2.out', stagger: 0.03 }
        );

        const activeSection = document.querySelector('.section.active');
        const activeSectionId = activeSection ? activeSection.id : '';
        if (!activeSection || !activeSectionId || activeSectionId === lastSectionId) return;
        lastSectionId = activeSectionId;
        const sectionBlocks = Array.from(
            activeSection.querySelectorAll('.module-desc-bar, .analysis-shell-head, .analysis-inline-panel, .card-box')
        ).slice(0, 6);
        animateNodes(
            sectionBlocks,
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power2.out', stagger: 0.045, clearProps: 'opacity,transform' }
        );
    }

    function bindObservers() {
        if (observersBound) return;
        observersBound = true;

        const app = document.getElementById('app');
        if (app) {
            const appObserver = new MutationObserver(scheduleRefresh);
            appObserver.observe(app, { attributes: true, attributeFilter: ['class'] });
        }

        window.addEventListener('resize', scheduleRefresh, { passive: true });
    }

    function refreshEnhancements() {
        ensureSpotlightAnimationPatch();
        ensureSimpleBar();
        ensureTooltips();
        ensurePulseTween();
        ensureScrollEffects();
        animateShellChrome();
        if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
            window.ScrollTrigger.refresh();
        }
    }

    window.refreshShellEnhancements = scheduleRefresh;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            bindObservers();
            scheduleRefresh();
        }, { once: true });
    } else {
        bindObservers();
        scheduleRefresh();
    }
})();
