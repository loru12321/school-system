const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const user = process.env.SMOKE_USER || 'admin';
const pass = process.env.SMOKE_PASS || 'admin123';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const startedAt = Date.now();
    page.on('dialog', dialog => dialog.dismiss().catch(() => {}));

    try {
        await page.goto(url, { waitUntil: 'commit', timeout: 90000 });
        await page.waitForFunction(() => document.getElementById('login-overlay') || document.getElementById('app'), null, { timeout: 90000 });
        const loginUser = page.locator('#login-user');
        if (!(await loginUser.isVisible().catch(() => false))) {
            await page.evaluate(() => window.Auth?.openLoginPortalModal?.('school'));
            await loginUser.waitFor({ state: 'visible', timeout: 30000 });
        }
        await loginUser.fill(user);
        await page.locator('#login-pass').fill(pass);
        await page.locator('#login-submit-button').click();

        const button = page.locator('#header-data-mgr-btn');
        await button.waitFor({ state: 'visible', timeout: 90000 });
        await page.waitForFunction(() => Array.isArray(window.RAW_DATA)
            && window.RAW_DATA.length > 0
            && typeof window.hasUsableProcessedSchoolMetrics === 'function'
            && window.hasUsableProcessedSchoolMetrics(window.SCHOOLS), null, { timeout: 90000 });
        const buttonVisibleMs = Date.now() - startedAt;
        const clickStartedAt = Date.now();
        const result = await page.evaluate(() => {
            document.getElementById('header-data-mgr-btn')?.click();
            const modal = document.getElementById('cloud-manager-modal');
            return {
                modalVisible: !!modal && getComputedStyle(modal).display !== 'none',
                heading: String(document.querySelector('#cloud-manager-modal h3')?.textContent || '').trim(),
                currentTab: window.DataManager?.currentTab || '',
                scoreCount: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0
            };
        });
        if (!result.modalVisible) throw new Error('cloud manager modal did not become visible in the click task');
        console.log(JSON.stringify({
            ok: true,
            buttonVisibleMs,
            clickResponseMs: Date.now() - clickStartedAt,
            ...result
        }, null, 2));
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
