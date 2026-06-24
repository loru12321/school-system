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

async function inspectMobileReleaseCenter(page) {
    await page.evaluate(() => window.switchTab?.('app-download-center'));
    await page.waitForSelector('#app-release-focused-detail', { state: 'visible', timeout: 45000 });
    await page.waitForFunction(() => (
        !!window.__APP_DOWNLOAD_RUNTIME_PATCHED__
        && !!document.querySelector('[data-app-download-platform][aria-selected="true"]')
    ), null, { timeout: 45000 });
    const firstTab = page.locator('[data-app-download-platform="windows"]');
    await firstTab.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const keyboardSelectedPlatform = await page.locator('[data-app-download-platform][aria-selected="true"]').getAttribute('data-app-download-platform');
    await page.locator('[data-open-release-history]').click();
    await page.waitForSelector('#app-release-history-drawer:not([hidden])', { state: 'visible', timeout: 10000 });
    const state = await page.evaluate(() => {
        const rect = (selector) => {
            const node = document.querySelector(selector);
            if (!node) return null;
            const value = node.getBoundingClientRect();
            return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width };
        };
        const tabs = document.querySelector('.app-release-platform-tabs');
        return {
            viewportWidth: window.innerWidth,
            detail: rect('#app-release-focused-detail'),
            timeline: rect('#app-release-timeline'),
            tabCount: document.querySelectorAll('[data-app-download-platform]').length,
            tabsScrollable: !!tabs && getComputedStyle(tabs).overflowX === 'auto' && tabs.scrollWidth > tabs.clientWidth,
            drawer: rect('.app-release-history-sheet'),
            drawerVisible: !document.getElementById('app-release-history-drawer')?.hidden,
        };
    });
    await page.locator('[data-close-release-history]').click();
    return { ...state, keyboardSelectedPlatform };
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
    const releaseCenterState = await inspectMobileReleaseCenter(page);

    await browser.close();

    const actionableMessages = messages.filter((message) => !isIgnorableMessage(message));
    assert.strictEqual(state.mobileQuery, 'true', 'mobile viewport was not detected');
    assert.ok(state.shellExists, 'mobile shell root was not created');
    assert.strictEqual(state.mobileArchitecture, 'apk-v2', 'mobile shell architecture did not activate');
    assert.ok(state.shellVisible, 'mobile shell was not visible');
    assert.ok(state.railChips > 0, 'mobile rail chips were not rendered');
    assert.ok(state.activeRailChip, 'mobile rail active chip was missing');
    assert.ok(state.mobileExperienceRuntime, 'merged mobile experience runtime was not exposed');
    assert.ok(state.compactViewportClass, 'compact viewport class was not synchronized');
    assert.strictEqual(state.perfRuntimeLoaded, false, 'perf-mobile runtime should not load during normal mobile bootstrap');
    assert.ok(state.currentCohortId, 'cohort was not selected');
    assert.ok(state.rawDataLen > 0, 'exam data was not loaded');
    assert.strictEqual(releaseCenterState.tabCount, 3, 'release center should expose all three native platforms');
    assert.strictEqual(releaseCenterState.keyboardSelectedPlatform, 'ios', 'arrow keys should reach every platform tab');
    assert.ok(releaseCenterState.timeline.top >= releaseCenterState.detail.bottom - 1, 'mobile release timeline should follow focused detail');
    assert.ok(releaseCenterState.tabsScrollable, 'mobile platform tabs should scroll horizontally');
    assert.ok(releaseCenterState.drawerVisible, 'mobile release history drawer should open');
    assert.ok(releaseCenterState.drawer.width >= releaseCenterState.viewportWidth - 2, 'mobile release history drawer should fill the viewport width');
    assert.ok(
        !actionableMessages.some((message) => /ReferenceError|TypeError|scrollActiveRailChipIntoView|pageerror/i.test(message)),
        `mobile shell console errors found: ${actionableMessages.join('\n')}`
    );

    console.log(JSON.stringify({ state, releaseCenterState, actionableMessages }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
