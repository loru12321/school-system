try {
    require.resolve('playwright');
} catch (error) {
    console.error('playwright is required for smoke-mobile-shell. Run: npm install --no-save playwright');
    process.exit(1);
}

const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const user = process.env.SMOKE_USER || 'admin';
const pass = process.env.SMOKE_PASS || 'admin123';
const cohortYear = process.env.SMOKE_COHORT_YEAR || '2023';

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
    }, null, { timeout: 90000 }).catch(async (error) => {
        console.error('[mobile-smoke] login boundary diagnostics', await page.evaluate(() => ({
            readyState: document.readyState,
            overlay: document.getElementById('login-overlay')?.getAttribute('aria-hidden'),
            overlayDisplay: document.getElementById('login-overlay') ? getComputedStyle(document.getElementById('login-overlay')).display : '',
            appDisplay: document.getElementById('app') ? getComputedStyle(document.getElementById('app')).display : '',
            authState: document.body?.dataset?.authState || '',
            userStored: !!localStorage.getItem('currentUser'),
            runtimeErrors: window.__BOOT_ERROR__ || window.__AUTH_ERROR__ || ''
        })).catch(() => ({})));
        throw error;
    });

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
    }, null, { timeout: 90000 }).catch(async (error) => {
        console.error('[mobile-smoke] cohort boundary diagnostics', await page.evaluate(() => ({
            authState: document.body?.dataset?.authState || '',
            cohortId: String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || ''),
            rawDataLen: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            modeMask: document.getElementById('mode-mask') ? getComputedStyle(document.getElementById('mode-mask')).display : '',
            bodyText: document.body?.innerText?.slice(0, 240) || ''
        })).catch(() => ({})));
        throw error;
    });
}

async function readMobileShellState(page) {
    return page.evaluate(() => {
        const shell = document.getElementById('apk-mobile-shell');
        const rootDisplay = shell ? getComputedStyle(shell).display : '';
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        return {
            mobileQuery: document.body?.dataset?.mobileQuery || '',
            mobileArchitecture: document.body?.dataset?.mobileArchitecture || '',
            shellExists: !!shell,
            shellVisible: !!shell && rootDisplay !== 'none' && shell.getAttribute('aria-hidden') === 'false',
            railChips: document.querySelectorAll('#apk-mobile-shell .apk-rail-chip').length,
            activeRailChip: !!document.querySelector('#apk-mobile-shell .apk-rail-chip.is-active'),
            shellCount: document.querySelectorAll('#apk-mobile-shell').length,
            bottomEntries: document.querySelectorAll('#apk-mobile-shell [data-apk-tab]').length,
            currentModule: shell?.dataset?.mobileCurrentModule || '',
            mobileSheetOpen: shell?.dataset?.mobileSheetOpen || '',
            mobileLibraryOpen: shell?.dataset?.mobileLibraryOpen || '',
            titleLineClamp: shell ? getComputedStyle(shell.querySelector('.apk-shell-title')).webkitLineClamp : '',
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            verticalScrollOwners: [...document.querySelectorAll('body, #app, #apk-mobile-shell, #apk-mobile-shell .apk-shell-content, main.app-main')]
                .filter((node) => /auto|scroll/.test(getComputedStyle(node).overflowY))
                .map((node) => node.matches('main.app-main') ? 'app-main' : (node.id || node.tagName.toLowerCase())),
            mobileExperienceRuntime: typeof window.MobileExperienceRuntime?.syncCompactState === 'function',
            compactViewportClass: document.documentElement.classList.contains('is-compact-viewport'),
            perfRuntimeLoaded: !!window.PerformanceMonitor,
            currentCohortId: String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim(),
            rawDataLen
        };
    });
}

async function waitForMobileShellReady(page) {
    let state = await readMobileShellState(page);
    const deadline = Date.now() + 25000;
    while (
        Date.now() < deadline
        && !(
            state.mobileArchitecture === 'apk-v2'
            && state.shellVisible
            && state.railChips > 0
            && state.activeRailChip
        )
    ) {
        await page.evaluate(() => window.MobileQueryUI?.refresh?.()).catch(() => {});
        await page.waitForTimeout(500);
        state = await readMobileShellState(page);
    }
    return state;
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3
    });

    const messages = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            messages.push(`${msg.type()}: ${msg.text()}`);
        }
    });
    page.on('pageerror', (error) => {
        messages.push(`pageerror: ${error.message}`);
    });

    await loginAndEnterCohort(page);
    await page.evaluate(() => window.ensureMobileManagerRuntimeLoaded?.()).catch(() => {});
    await page.evaluate(() => window.MobileQueryUI?.refresh?.()).catch(() => {});
    const state = await waitForMobileShellReady(page);

    const viewportStates = [];
    for (const viewport of [
        { width: 320, height: 568, name: '320' },
        { width: 390, height: 844, name: '390' },
        { width: 430, height: 932, name: '430' },
        { width: 844, height: 390, name: 'landscape' }
    ]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => window.MobileQueryUI?.refresh?.()).catch(() => {});
        await page.waitForTimeout(250);
        viewportStates.push({ name: viewport.name, ...(await readMobileShellState(page)) });
    }

    await browser.close();

    const actionableMessages = messages.filter((message) => !isIgnorableMessage(message));
    assert.strictEqual(state.mobileQuery, 'true', 'mobile viewport was not detected');
    assert.ok(state.shellExists, 'mobile shell root was not created');
    assert.strictEqual(state.mobileArchitecture, 'apk-v2', 'mobile shell architecture did not activate');
    assert.ok(state.shellVisible, 'mobile shell was not visible');
    assert.ok(state.railChips > 0, 'mobile rail chips were not rendered');
    assert.ok(state.activeRailChip, 'mobile rail active chip was missing');
    for (const viewportState of viewportStates) {
        assert.strictEqual(viewportState.shellCount, 1, `${viewportState.name}: duplicate mobile shell found`);
        assert.strictEqual(viewportState.bottomEntries, 5, `${viewportState.name}: bottom navigation must have five entries`);
        assert.ok(viewportState.currentModule, `${viewportState.name}: current module state was not published`);
        assert.strictEqual(viewportState.mobileSheetOpen, 'false', `${viewportState.name}: unexpected open sheet`);
        assert.strictEqual(viewportState.mobileLibraryOpen, 'false', `${viewportState.name}: unexpected open library`);
        assert.strictEqual(viewportState.titleLineClamp, '2', `${viewportState.name}: title must clamp to two lines`);
        assert.strictEqual(viewportState.horizontalOverflow, false, `${viewportState.name}: document has horizontal overflow`);
        assert.deepStrictEqual(viewportState.verticalScrollOwners, ['app-main'], `${viewportState.name}: .app-main must be the only vertical scroll root`);
    }
    assert.ok(state.mobileExperienceRuntime, 'merged mobile experience runtime was not exposed');
    assert.ok(state.compactViewportClass, 'compact viewport class was not synchronized');
    assert.strictEqual(state.perfRuntimeLoaded, false, 'perf-mobile runtime should not load during normal mobile bootstrap');
    assert.ok(state.currentCohortId, 'cohort was not selected');
    assert.ok(state.rawDataLen > 0, 'exam data was not loaded');
    assert.ok(
        !actionableMessages.some((message) => /ReferenceError|TypeError|scrollActiveRailChipIntoView|pageerror/i.test(message)),
        `mobile shell console errors found: ${actionableMessages.join('\n')}`
    );

    console.log(JSON.stringify({ state, viewportStates, actionableMessages }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
