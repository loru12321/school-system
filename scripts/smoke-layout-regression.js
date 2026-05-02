try {
    require.resolve('playwright');
} catch (error) {
    console.error('playwright is required for smoke-layout-regression. Run: npm install --no-save playwright');
    process.exit(1);
}

const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const user = process.env.SMOKE_USER || 'admin';
const pass = process.env.SMOKE_PASS || 'admin123';
const cohortYear = process.env.SMOKE_COHORT_YEAR || '2022';

function isIgnorableMessage(text) {
    return /favicon|GitHub release API|fetch releases|cloudflareinsights|beacon\.min\.js|Failed to load resource/i.test(String(text || ''));
}

async function loginAndEnterCohort(page) {
    await page.goto(url, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForSelector('#login-user', { state: 'visible', timeout: 90000 });
    await page.fill('#login-user', user);
    await page.fill('#login-pass', pass);
    await page.click('#login-submit-button');

    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const mask = document.getElementById('mode-mask');
        const app = document.getElementById('app');
        return (!overlay || getComputedStyle(overlay).display === 'none')
            && (!!mask || !!app || document.body?.dataset?.authState === 'logged_in');
    }, null, { timeout: 90000 });

    await page.waitForFunction(() => typeof window.enterCohortFromMask === 'function', null, { timeout: 30000 }).catch(() => {});
    const maskVisible = await page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        return !!mask && getComputedStyle(mask).display !== 'none';
    });
    if (maskVisible) {
        const input = page.locator('#entry-cohort-year');
        if (await input.count()) await input.fill(cohortYear);
        await page.evaluate(async () => {
            if (typeof window.enterCohortFromMask === 'function') {
                await window.enterCohortFromMask();
                return;
            }
            document.querySelector('button[onclick="enterCohortFromMask()"]')?.click();
        });
    }

    await page.waitForFunction(() => {
        const cohortId = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        return !!cohortId && rawDataLen > 0;
    }, null, { timeout: 90000 });
}

async function openUploadModule(page) {
    await page.waitForFunction(() => typeof window.switchTab === 'function', null, { timeout: 60000 });
    await page.evaluate(() => window.switchTab('upload'));
    await page.waitForFunction(() => {
        const upload = document.getElementById('upload');
        return !!upload && upload.classList.contains('active') && getComputedStyle(upload).display !== 'none';
    }, null, { timeout: 30000 });
    await page.waitForTimeout(500);
}

async function openModule(page, id) {
    await page.waitForFunction(() => typeof window.switchTab === 'function', null, { timeout: 60000 });
    await page.evaluate((moduleId) => window.switchTab(moduleId), id);
    await page.waitForFunction((moduleId) => {
        const section = document.getElementById(moduleId);
        return !!section && section.classList.contains('active') && getComputedStyle(section).display !== 'none';
    }, id, { timeout: 45000 });
    await page.waitForTimeout(500);
}

async function openStudentDetailsModule(page) {
    await openModule(page, 'student-details');
    await page.evaluate(() => {
        if (typeof window.renderStudentDetails === 'function') window.renderStudentDetails();
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('student-details');
        const table = document.getElementById('studentDetailTable');
        const rows = table ? table.querySelectorAll('tbody tr').length : 0;
        return !!section && !!table && rows > 0;
    }, null, { timeout: 45000 });
    await page.waitForTimeout(500);
}

async function openReportGeneratorModule(page) {
    await openModule(page, 'report-generator');
    await page.evaluate(() => {
        if (typeof window.updateSchoolSelect === 'function') window.updateSchoolSelect();
        if (typeof window.updateReportCompareExamSelects === 'function') window.updateReportCompareExamSelects();
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('report-generator');
        const school = document.getElementById('sel-school');
        const name = document.getElementById('inp-name');
        return !!section && !!school && !!name && section.classList.contains('active');
    }, null, { timeout: 45000 });
    await page.waitForTimeout(500);
}

async function openSummaryModule(page) {
    await openModule(page, 'summary');
    await page.evaluate(async () => {
        if (typeof window.ensureTownSubmoduleCompareRuntimeLoaded === 'function') {
            await window.ensureTownSubmoduleCompareRuntimeLoaded();
        }
        if (typeof window.ensureTownSubmoduleCompareUIs === 'function') {
            await window.ensureTownSubmoduleCompareUIs();
        }
        if (typeof window.calcSummary === 'function') {
            window.calcSummary(true);
        }
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('summary');
        const rows = document.querySelectorAll('#tb-summary tbody tr').length;
        const panel = document.querySelector('#summary .town-submodule-compare-panel[data-submodule="summary"]');
        return !!section && section.classList.contains('active') && rows > 0 && !!panel;
    }, null, { timeout: 45000 });
    await page.waitForTimeout(500);
}

async function ensureMobileShell(page) {
    await page.evaluate(() => window.ensureMobileManagerRuntimeLoaded?.()).catch(() => {});
    await page.evaluate(() => window.MobileQueryUI?.refresh?.()).catch(() => {});
    await page.waitForFunction(() => {
        const shell = document.getElementById('apk-mobile-shell');
        return document.body?.dataset?.mobileQuery === 'true'
            && document.body?.dataset?.mobileArchitecture === 'apk-v2'
            && !!shell
            && shell.getAttribute('aria-hidden') === 'false';
    }, null, { timeout: 30000 });
}

async function inspectSectionLayout(page, mode, options = {}) {
    const sectionId = options.sectionId || 'upload';
    const targetSelector = options.targetSelector || '#uploadBox';
    await page.locator(targetSelector).scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(({ layoutMode, focusSelector }) => {
        const target = document.querySelector(focusSelector);
        if (!target) return;
        target.scrollIntoView({ block: 'start', inline: 'nearest' });
        if (layoutMode !== 'mobile') return;
        const shell = document.querySelector('#apk-mobile-shell .apk-shell-top');
        if (!shell) return;
        const shellRect = shell.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const desiredTop = Math.round(shellRect.bottom + 12);
        if (targetRect.top >= desiredTop) return;
        const appMain = document.querySelector('.app-main');
        const delta = Math.round(targetRect.top - desiredTop);
        if (appMain && appMain.scrollHeight > appMain.clientHeight) {
            appMain.scrollTop += delta;
            return;
        }
        window.scrollBy(0, delta);
    }, { layoutMode: mode, focusSelector: targetSelector }).catch(() => {});
    await page.waitForTimeout(250);
    return page.evaluate(({ layoutMode, targetSectionId, focusSelector, requiredSelectors }) => {
        function selectorFor(el) {
            if (!el) return '';
            if (el.id) return `#${el.id}`;
            const classes = Array.from(el.classList || []).slice(0, 3).join('.');
            const tag = String(el.tagName || '').toLowerCase();
            return classes ? `${tag}.${classes}` : tag;
        }

        function isVisible(el) {
            if (!el) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            if (rect.right < -100 || rect.bottom < -100 || rect.left > window.innerWidth + 100 || rect.top > window.innerHeight + 100) return false;
            return rect.width > 1 && rect.height > 1;
        }

        function hasManagedHorizontalScroll(el, boundary) {
            let node = el.parentElement;
            while (node && node !== boundary && node !== document.body && node !== document.documentElement) {
                const style = getComputedStyle(node);
                const managesOverflow = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX);
                if (managesOverflow && node.scrollWidth > node.clientWidth + 2) return true;
                node = node.parentElement;
            }
            return false;
        }

        function rectOf(selector) {
            const el = document.querySelector(selector);
            if (!isVisible(el)) return null;
            const rect = el.getBoundingClientRect();
            return {
                selector,
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                top: Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }

        function intersects(a, b) {
            if (!a || !b) return false;
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        }

        function containsPoint(rect, point) {
            if (!rect || !point) return false;
            return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
        }

        function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }

        const viewportWidth = Math.round(document.documentElement.clientWidth || window.innerWidth || 0);
        const viewportHeight = Math.round(document.documentElement.clientHeight || window.innerHeight || 0);
        const appMain = document.querySelector('.app-main');
        const scrollRoot = layoutMode === 'mobile' && appMain ? appMain : document.scrollingElement;
        const rootOverflow = scrollRoot ? Math.round(scrollRoot.scrollWidth - scrollRoot.clientWidth) : 0;
        const documentOverflow = Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const activeSection = document.querySelector(`#${CSS.escape(targetSectionId)}.section.active`);
        const scope = activeSection || document.getElementById(targetSectionId) || document.body;

        const overflowIssues = Array.from(scope.querySelectorAll('*'))
            .filter(isVisible)
            .map((el) => {
                const rect = el.getBoundingClientRect();
                const style = getComputedStyle(el);
                return {
                    selector: selectorFor(el),
                    width: Math.round(rect.width),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    position: style.position,
                    tag: String(el.tagName || '').toLowerCase(),
                    scrollManaged: hasManagedHorizontalScroll(el, scope)
                };
            })
            .filter((item) => {
                if (item.position === 'fixed') return false;
                if (item.scrollManaged) return false;
                if (item.right <= viewportWidth + 2 && item.left >= -2) return false;
                if (/table|thead|tbody|tr|th|td/.test(item.tag)) return false;
                return true;
            })
            .slice(0, 12);

        const tabsRect = rectOf('#apk-mobile-shell .apk-shell-tabs');
        const topShellRect = rectOf('#apk-mobile-shell .apk-shell-top');
        const topbarRect = rectOf('#apk-mobile-shell .apk-shell-topbar');
        const focusTarget = document.querySelector(focusSelector);
        const focusRect = rectOf(focusSelector);
        let focusHitOk = false;
        let focusHitSelector = '';
        let focusHitPoint = null;
        if (focusRect && focusTarget) {
            const safeTop = Math.max(1, topShellRect?.bottom || 1, topbarRect?.bottom || 1) + 6;
            const safeBottom = Math.min(viewportHeight - 2, tabsRect?.top ? tabsRect.top - 6 : viewportHeight - 2);
            const focusInset = Math.min(8, Math.max(2, focusRect.height / 3));
            const minFocusY = focusRect.top + focusInset;
            const maxFocusY = focusRect.bottom - focusInset;
            const minY = Math.max(minFocusY, safeTop);
            const maxY = Math.min(maxFocusY, safeBottom);
            const preferredY = Math.min(focusRect.top + 72, focusRect.top + focusRect.height / 2);
            const x = clamp(focusRect.left + focusRect.width / 2, 1, viewportWidth - 2);
            const y = minY <= maxY
                ? clamp(preferredY, minY, maxY)
                : clamp(focusRect.top + focusRect.height / 2, 1, viewportHeight - 2);
            focusHitPoint = { x: Math.round(x), y: Math.round(y) };
            const hit = document.elementFromPoint(x, y);
            focusHitSelector = selectorFor(hit);
            focusHitOk = hit === focusTarget || focusTarget.contains(hit);
        }

        const requiredPieces = {};
        Object.entries(requiredSelectors || {}).forEach(([key, selector]) => {
            requiredPieces[key] = !!document.querySelector(selector);
        });

        return {
            mode: layoutMode,
            sectionId: targetSectionId,
            viewportWidth,
            bodyMobileQuery: String(document.body?.dataset?.mobileQuery || ''),
            bodyMobileArchitecture: String(document.body?.dataset?.mobileArchitecture || ''),
            sectionActive: !!activeSection,
            viewportHeight,
            rootOverflow,
            documentOverflow,
            overflowIssues,
            requiredPieces,
            focusRect,
            focusHitPoint,
            focusHitOk,
            focusHitSelector,
            tabsRect,
            topShellRect,
            topbarRect,
            tabsOverlapFocus: containsPoint(tabsRect, focusHitPoint),
            topShellOverlapFocus: containsPoint(topShellRect, focusHitPoint),
            topbarOverlapFocus: containsPoint(topbarRect, focusHitPoint)
        };
    }, {
        layoutMode: mode,
        targetSectionId: sectionId,
        focusSelector: targetSelector,
        requiredSelectors: options.requiredSelectors || {}
    });
}

async function inspectUploadLayout(page, mode) {
    return inspectSectionLayout(page, mode, {
        sectionId: 'upload',
        targetSelector: '#uploadBox',
        requiredSelectors: {
            summary: '#upload-summary-strip',
            notice: '#upload-flow-notice',
            workbench: '#upload .upload-workbench-grid',
            intake: '#upload .upload-intake-grid',
            ops: '#upload .upload-ops-grid',
            uploadBox: '#uploadBox'
        }
    });
}

async function inspectStudentDetailsLayout(page, mode) {
    return inspectSectionLayout(page, mode, {
        sectionId: 'student-details',
        targetSelector: '#student-details .student-details-primary-flow',
        requiredSelectors: {
            schoolSelect: '#studentSchoolSelect',
            classSelect: '#studentClassSelect',
            detailTable: '#studentDetailTable',
            detailRows: '#studentDetailTable tbody tr',
            compareToolbar: '#student-details .student-compare-toolbar'
        }
    });
}

async function inspectReportGeneratorLayout(page, mode) {
    return inspectSectionLayout(page, mode, {
        sectionId: 'report-generator',
        targetSelector: '#report-generator .report-query-panel',
        requiredSelectors: {
            queryCopy: '#report-generator .report-query-copy',
            queryPanel: '#report-generator .report-query-panel',
            schoolSelect: '#sel-school',
            classSelect: '#sel-class',
            nameInput: '#inp-name',
            comparePanel: '#report-generator .analysis-inline-panel',
            comparePeriod: '#reportComparePeriodCount',
            compareExam1: '#reportCompareExam1',
            resultSlot: '#single-report-result',
            marginalSelect: '#marginalSchoolSelect'
        }
    });
}

async function inspectSummaryLayout(page, mode) {
    return inspectSectionLayout(page, mode, {
        sectionId: 'summary',
        targetSelector: '#summary .analysis-summary-table',
        requiredSelectors: {
            hero: '#summary .analysis-hero',
            shellHead: '#summary .analysis-shell-head',
            actions: '#summary .analysis-actions .btn',
            meta: '#summary .analysis-table-meta',
            comparePanel: '#summary .town-submodule-compare-panel[data-submodule="summary"]',
            compareResult: '#town-submodule-compare-result-summary',
            summaryTable: '#tb-summary',
            summaryRows: '#tb-summary tbody tr',
            mobileLabels: '#tb-summary tbody td[data-label="学校名称"]',
            rankLabels: '#tb-summary tbody td[data-label="总排名"]'
        }
    });
}

function assertSectionLayout(state, label) {
    assert.ok(state.sectionActive, `${state.mode} ${label} section is not active`);
    for (const [key, exists] of Object.entries(state.requiredPieces)) {
        assert.ok(exists, `${state.mode} ${label} required piece missing: ${key}`);
    }
    assert.ok(Math.abs(state.rootOverflow) <= 2, `${state.mode} ${label} root has horizontal overflow: ${state.rootOverflow}px`);
    assert.ok(state.documentOverflow <= 2, `${state.mode} ${label} document has horizontal overflow: ${state.documentOverflow}px`);
    assert.deepStrictEqual(state.overflowIssues, [], `${state.mode} ${label} visible overflow issues: ${JSON.stringify(state.overflowIssues)}`);
    assert.ok(state.focusRect && state.focusRect.width > 120 && state.focusRect.height > 40, `${state.mode} ${label} focus surface is not usable`);
    assert.ok(state.focusHitOk, `${state.mode} ${label} focus surface is visually covered at center by ${state.focusHitSelector || 'unknown element'}`);
    if (state.mode === 'mobile') {
        assert.strictEqual(state.bodyMobileQuery, 'true', 'mobile viewport was not detected');
        assert.strictEqual(state.bodyMobileArchitecture, 'apk-v2', 'mobile shell architecture did not activate');
        assert.strictEqual(state.tabsOverlapFocus, false, `mobile bottom tabs overlap ${label}`);
        assert.strictEqual(state.topShellOverlapFocus, false, `mobile top shell overlaps ${label}`);
        assert.strictEqual(state.topbarOverlapFocus, false, `mobile topbar overlaps ${label}`);
    }
}

function assertUploadLayout(state) {
    assertSectionLayout(state, 'upload');
}

function assertStudentDetailsLayout(state) {
    assertSectionLayout(state, 'student-details');
}

function assertReportGeneratorLayout(state) {
    assertSectionLayout(state, 'report-generator');
}

function assertSummaryLayout(state) {
    assertSectionLayout(state, 'summary');
}

async function openDataManager(page, tab = 'student') {
    await page.evaluate(() => {
        if (window.DataManager && typeof window.DataManager.open === 'function') {
            window.DataManager.open();
        }
    });
    await page.waitForFunction(() => {
        const modal = document.getElementById('data-manager-modal');
        return !!modal && getComputedStyle(modal).display !== 'none';
    }, null, { timeout: 45000 });
    await page.evaluate((targetTab) => window.DataManager?.switchTab?.(targetTab), tab).catch(() => {});
    await page.waitForTimeout(700);
}

async function inspectDataManagerLayout(page, mode, tab = 'student') {
    await openDataManager(page, tab);
    return page.evaluate((layoutMode) => {
        function isVisible(el) {
            if (!el) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            if (rect.right < -100 || rect.bottom < -100 || rect.left > window.innerWidth + 100 || rect.top > window.innerHeight + 100) return false;
            return rect.width > 1 && rect.height > 1;
        }

        function isRendered(el) {
            if (!el) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 1 && rect.height > 1;
        }

        function selectorFor(el) {
            if (!el) return '';
            if (el.id) return `#${el.id}`;
            const classes = Array.from(el.classList || []).slice(0, 3).join('.');
            const tag = String(el.tagName || '').toLowerCase();
            return classes ? `${tag}.${classes}` : tag;
        }

        function hasManagedHorizontalScroll(el, boundary) {
            let node = el.parentElement;
            while (node && node !== boundary && node !== document.body && node !== document.documentElement) {
                const style = getComputedStyle(node);
                const managesOverflow = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX);
                if (managesOverflow && node.scrollWidth > node.clientWidth + 2) return true;
                node = node.parentElement;
            }
            return false;
        }

        function toRect(selector) {
            const el = document.querySelector(selector);
            if (!isVisible(el)) return null;
            const rect = el.getBoundingClientRect();
            return {
                selector,
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                top: Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }

        const viewportWidth = Math.round(document.documentElement.clientWidth || window.innerWidth || 0);
        const viewportHeight = Math.round(document.documentElement.clientHeight || window.innerHeight || 0);
        const modal = document.getElementById('data-manager-modal');
        const content = modal?.querySelector('.modal-content');
        const contentRect = toRect('#data-manager-modal .modal-content');
        const tabBar = document.getElementById('tab-data-stu')?.parentElement;
        const tabBarRect = tabBar && isVisible(tabBar)
            ? (() => {
                const rect = tabBar.getBoundingClientRect();
                return {
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    top: Math.round(rect.top),
                    bottom: Math.round(rect.bottom),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                };
            })()
            : null;
        const activeTab = document.querySelector('#data-manager-modal .login-tab.active');
        const visibleArea = ['dm-student-table', 'dm-teacher-area', 'dm-params-area', 'dm-targets-area', 'dm-sql-area', 'dm-cloud-area']
            .map((id) => document.getElementById(id))
            .find(isRendered);
        const scope = content || document.body;
        const overflowIssues = Array.from(scope.querySelectorAll('*'))
            .filter(isVisible)
            .map((el) => {
                const rect = el.getBoundingClientRect();
                const style = getComputedStyle(el);
                return {
                    selector: selectorFor(el),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    width: Math.round(rect.width),
                    position: style.position,
                    tag: String(el.tagName || '').toLowerCase(),
                    scrollManaged: hasManagedHorizontalScroll(el, scope)
                };
            })
            .filter((item) => {
                if (item.position === 'fixed') return false;
                if (item.scrollManaged) return false;
                if (item.right <= viewportWidth + 2 && item.left >= -2) return false;
                if (/table|thead|tbody|tr|th|td/.test(item.tag)) return false;
                return true;
            })
            .slice(0, 12);

        return {
            mode: layoutMode,
            modalVisible: !!modal && getComputedStyle(modal).display !== 'none',
            currentTab: String(window.DataManager?.currentTab || ''),
            viewportWidth,
            viewportHeight,
            contentRect,
            tabBarRect,
            activeTabText: String(activeTab?.textContent || '').trim(),
            visibleAreaSelector: selectorFor(visibleArea),
            overflowIssues,
            contentScrollWidth: content ? Math.round(content.scrollWidth) : 0,
            contentClientWidth: content ? Math.round(content.clientWidth) : 0,
            requiredPieces: {
                intro: !!document.getElementById('dm-layout-intro'),
                workflow: !!document.getElementById('dm-workflow-strip'),
                tabBar: !!tabBar,
                activeTab: !!activeTab,
                visibleArea: !!visibleArea
            }
        };
    }, mode);
}

function assertDataManagerLayout(state, expectedTab) {
    assert.ok(state.modalVisible, `${state.mode} data manager modal is not visible`);
    assert.strictEqual(state.currentTab, expectedTab, `${state.mode} data manager tab mismatch`);
    for (const [key, exists] of Object.entries(state.requiredPieces)) {
        assert.ok(exists, `${state.mode} data manager required piece missing: ${key}`);
    }
    assert.ok(state.contentRect, `${state.mode} data manager content is not visible`);
    assert.ok(state.contentRect.left >= -1 && state.contentRect.top >= -1, `${state.mode} data manager content starts outside viewport`);
    assert.ok(state.contentRect.right <= state.viewportWidth + 1, `${state.mode} data manager content exceeds viewport width`);
    assert.ok(state.contentRect.bottom <= state.viewportHeight + 1, `${state.mode} data manager content exceeds viewport height`);
    assert.ok(state.tabBarRect && state.tabBarRect.height >= 32, `${state.mode} data manager tab strip is not usable`);
    assert.ok(state.tabBarRect.top >= state.contentRect.top - 1 && state.tabBarRect.bottom <= state.contentRect.bottom + 1, `${state.mode} data manager tab strip is outside the modal viewport`);
    assert.ok(state.contentScrollWidth - state.contentClientWidth <= 2, `${state.mode} data manager content has horizontal overflow`);
    assert.deepStrictEqual(state.overflowIssues, [], `${state.mode} data manager visible overflow issues: ${JSON.stringify(state.overflowIssues)}`);
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const messages = [];
    const makePage = async (options) => {
        const page = await browser.newPage(options);
        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warning') messages.push(`${msg.type()}: ${msg.text()}`);
        });
        page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
        return page;
    };

    const desktopPage = await makePage({ viewport: { width: 1440, height: 1000 } });
    await loginAndEnterCohort(desktopPage);
    await openUploadModule(desktopPage);
    const desktopState = await inspectUploadLayout(desktopPage, 'desktop');
    assertUploadLayout(desktopState);
    await openSummaryModule(desktopPage);
    const desktopSummaryState = await inspectSummaryLayout(desktopPage, 'desktop');
    assertSummaryLayout(desktopSummaryState);
    await openStudentDetailsModule(desktopPage);
    const desktopStudentState = await inspectStudentDetailsLayout(desktopPage, 'desktop');
    assertStudentDetailsLayout(desktopStudentState);
    await openReportGeneratorModule(desktopPage);
    const desktopReportState = await inspectReportGeneratorLayout(desktopPage, 'desktop');
    assertReportGeneratorLayout(desktopReportState);
    const desktopDataManagerState = await inspectDataManagerLayout(desktopPage, 'desktop', 'student');
    assertDataManagerLayout(desktopDataManagerState, 'student');
    await desktopPage.close();

    const mobilePage = await makePage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3
    });
    await loginAndEnterCohort(mobilePage);
    await ensureMobileShell(mobilePage);
    await openUploadModule(mobilePage);
    const mobileState = await inspectUploadLayout(mobilePage, 'mobile');
    assertUploadLayout(mobileState);
    await openSummaryModule(mobilePage);
    const mobileSummaryState = await inspectSummaryLayout(mobilePage, 'mobile');
    assertSummaryLayout(mobileSummaryState);
    await openStudentDetailsModule(mobilePage);
    const mobileStudentState = await inspectStudentDetailsLayout(mobilePage, 'mobile');
    assertStudentDetailsLayout(mobileStudentState);
    await openReportGeneratorModule(mobilePage);
    const mobileReportState = await inspectReportGeneratorLayout(mobilePage, 'mobile');
    assertReportGeneratorLayout(mobileReportState);
    const mobileDataManagerState = await inspectDataManagerLayout(mobilePage, 'mobile', 'student');
    assertDataManagerLayout(mobileDataManagerState, 'student');
    await mobilePage.close();

    await browser.close();

    const actionableMessages = messages.filter((message) => !isIgnorableMessage(message));
    assert.ok(
        !actionableMessages.some((message) => /ReferenceError|TypeError|pageerror/i.test(message)),
        `layout smoke console errors found: ${actionableMessages.join('\n')}`
    );

    console.log(JSON.stringify({
        desktopState,
        desktopSummaryState,
        desktopStudentState,
        desktopReportState,
        desktopDataManagerState,
        mobileState,
        mobileSummaryState,
        mobileStudentState,
        mobileReportState,
        mobileDataManagerState,
        actionableMessages
    }, null, 2));
}

main().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
