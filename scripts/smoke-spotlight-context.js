try {
    require.resolve('playwright');
} catch (_) {
    console.error('playwright is required for spotlight smoke');
    process.exit(1);
}

const assert = require('assert');
const { chromium } = require('playwright');

const url = String(process.env.SMOKE_URL || 'https://schoolsystem.com.cn/').trim();
const user = String(process.env.SMOKE_USER || 'admin').trim();
const pass = String(process.env.SMOKE_PASS || 'admin123').trim();
const cohort = String(process.env.SMOKE_COHORT_YEAR || '2022').trim();

async function ensureLoggedIn(page) {
    await page.goto(url, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForFunction(() => !!document.getElementById('login-overlay') || !!document.getElementById('app'), undefined, { timeout: 90000 });
    const needsLogin = await page.evaluate(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        return !overlay || getComputedStyle(overlay).display !== 'none' || !app || getComputedStyle(app).display === 'none';
    });
    if (needsLogin) {
        const input = page.locator('#login-user');
        if (!(await input.isVisible().catch(() => false))) {
            await page.evaluate(() => window.Auth?.openLoginPortalModal?.('school'));
        }
        await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });
        const selector = page.locator('#login-cohort-select');
        if (await selector.count()) await selector.selectOption(cohort);
        await page.fill('#login-user', user);
        await page.fill('#login-pass', pass);
        await page.click('#login-submit-button');
    }
    await page.waitForFunction((expectedCohort) => {
        const app = document.getElementById('app');
        const overlay = document.getElementById('login-overlay');
        const mask = document.getElementById('mode-mask');
        const current = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
        return !!app
            && getComputedStyle(app).display !== 'none'
            && (!overlay || getComputedStyle(overlay).display === 'none')
            && (!mask || getComputedStyle(mask).display === 'none')
            && current === expectedCohort
            && Array.isArray(window.RAW_DATA)
            && window.RAW_DATA.length > 0;
    }, cohort, { timeout: 90000 });
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
        await ensureLoggedIn(page);
        await page.waitForFunction(() => (
            typeof window.openSpotlight === 'function'
            && typeof window.doSpotlightSearch === 'function'
            && !!window.SpotlightRuntime
        ), undefined, { timeout: 45000 });
        await page.evaluate(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'k',
                ctrlKey: true,
                bubbles: true,
                cancelable: true
            }));
        });
        await page.waitForFunction(() => {
            const mask = document.getElementById('spotlight-mask');
            return !!mask && getComputedStyle(mask).display === 'flex';
        }, undefined, { timeout: 15000 });

        const defaultState = await page.evaluate(() => ({
            runtimeReady: !!window.SpotlightRuntime,
            maskOpen: document.getElementById('spotlight-mask')?.classList.contains('is-open'),
            ariaVisible: document.getElementById('spotlight-mask')?.getAttribute('aria-hidden') === 'false',
            listbox: document.getElementById('spotlight-results')?.getAttribute('role') === 'listbox',
            groups: Array.from(document.querySelectorAll('#spotlight-results .spotlight-group-label')).map((node) => node.textContent.trim()),
            options: document.querySelectorAll('#spotlight-results .spotlight-item[role="option"]').length
        }));
        assert.ok(defaultState.runtimeReady, 'Spotlight runtime should be available');
        assert.ok(defaultState.maskOpen && defaultState.ariaVisible, 'Spotlight should expose its open state');
        assert.ok(defaultState.listbox, 'Spotlight should expose result-list semantics');
        assert.ok(defaultState.groups.some((label) => label.startsWith('当前工作区')), 'default state should prioritize current workspace');
        assert.ok(defaultState.options > 0, 'default state should contain accessible module entries');

        await page.keyboard.press('ArrowDown');
        const keyboardState = await page.evaluate(() => ({
            selected: document.querySelectorAll('#spotlight-results .spotlight-item[aria-selected="true"]').length,
            active: document.querySelectorAll('#spotlight-results .spotlight-item.active').length
        }));
        assert.strictEqual(keyboardState.selected, 1, 'keyboard navigation should select exactly one result');
        assert.strictEqual(keyboardState.active, 1, 'keyboard navigation should keep visual selection in sync');

        const studentName = await page.evaluate(() => String(window.RAW_DATA?.[0]?.name || '').trim());
        assert.ok(studentName, 'smoke dataset should contain a student name');
        await page.fill('#spotlight-input', studentName);
        await page.waitForFunction((name) => Array.from(document.querySelectorAll('#spotlight-results .spotlight-item__title'))
            .some((node) => String(node.textContent || '').includes(name)), studentName, { timeout: 10000 });
        const searchState = await page.evaluate(() => ({
            labels: Array.from(document.querySelectorAll('#spotlight-results .spotlight-group-label')).map((node) => node.textContent.trim()),
            hasStudent: Array.from(document.querySelectorAll('#spotlight-results .spotlight-item__title'))
                .some((node) => String(node.textContent || '').includes(String(window.RAW_DATA?.[0]?.name || '')))
        }));
        assert.ok(searchState.labels.some((label) => label.startsWith('学生')), 'student queries should preserve student search results');
        assert.ok(searchState.hasStudent, 'student query should display the matched student');

        await page.keyboard.press('Escape');
        const closeState = await page.evaluate(() => ({
            hidden: getComputedStyle(document.getElementById('spotlight-mask')).display === 'none',
            ariaHidden: document.getElementById('spotlight-mask')?.getAttribute('aria-hidden') === 'true'
        }));
        assert.ok(closeState.hidden && closeState.ariaHidden, 'Escape should close the Spotlight dialog cleanly');
        console.log(JSON.stringify({ ok: true, defaultState, searchState }, null, 2));
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
