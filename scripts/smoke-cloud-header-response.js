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
                modalVisible: window.location.hash === '#cloud-manager-modal'
                    && !!modal && getComputedStyle(modal).display !== 'none',
                heading: String(document.querySelector('#cloud-manager-modal h3')?.textContent || '').trim(),
                currentTab: window.DataManager?.currentTab || '',
                scoreCount: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0
            };
        });
        if (!result.modalVisible) throw new Error('cloud manager modal did not become visible in the click task');
        await page.waitForFunction(() => {
            const shell = document.getElementById('dm-cloud-table-shell');
            const rows = document.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select').length;
            return shell?.dataset?.cloudState === 'ready' && rows > 0;
        }, null, { timeout: 90000 });
        const cloudList = await page.evaluate(() => {
            const keys = Array.from(document.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select'))
                .map((input) => String(input.dataset.key || '').trim())
                .filter(Boolean);
            const sizeKb = Array.from(document.querySelectorAll('#dm-cloud-table tbody tr'))
                .map((row) => Number.parseFloat(String(row.cells?.[3]?.textContent || '0')) || 0);
            return {
                filterCurrent: document.getElementById('cloud-filter-current')?.checked === true,
                filterSnapshotsOnly: document.getElementById('cloud-filter-snapshots')?.checked !== false,
                rowCount: keys.length,
                internalHistoryRows: keys.filter((key) => key.startsWith('STUDENT_HISTORY_V1_')).length,
                positiveSizeRows: sizeKb.filter((size) => size > 0).length,
                summary: String(document.getElementById('dm-cloud-summary')?.textContent || '').replace(/\s+/g, ' ').trim()
            };
        });
        if (cloudList.filterCurrent) throw new Error('cloud list unexpectedly defaults to current-project-only filtering');
        if (!cloudList.filterSnapshotsOnly) throw new Error('cloud list should default to snapshot records');
        if (cloudList.internalHistoryRows > 0) throw new Error('internal student history records leaked into the cloud list');
        if (cloudList.positiveSizeRows < 1) throw new Error('cloud list did not expose stored snapshot sizes');
        console.log(JSON.stringify({
            ok: true,
            buttonVisibleMs,
            clickResponseMs: Date.now() - clickStartedAt,
            ...result,
            cloudList
        }, null, 2));
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
