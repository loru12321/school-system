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
        const result = await Promise.race([
            page.evaluate(() => {
                document.getElementById('header-data-mgr-btn')?.click();
                const modal = document.getElementById('data-manager-modal');
                return {
                    modalVisible: !!modal && getComputedStyle(modal).display !== 'none',
                    heading: String(document.querySelector('#data-manager-modal h3')?.textContent || '').trim(),
                    currentTab: window.DataManager?.currentTab || '',
                    scoreCount: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0
                };
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('cloud header click blocked the browser main thread for over 10 seconds')), 10000))
        ]);
        const clickResponseMs = Date.now() - clickStartedAt;
        if (!result.modalVisible) throw new Error('cloud manager modal did not become visible in the click task');
        await page.waitForFunction(() => {
            const shell = document.getElementById('dm-cloud-table-shell');
            const rows = document.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select').length;
            return shell?.dataset?.cloudState === 'ready' && rows > 0;
        }, null, { timeout: 90000 });
        const readCloudList = () => page.evaluate(() => {
            const keys = Array.from(document.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select'))
                .map((input) => String(input.dataset.key || '').trim())
                .filter(Boolean);
            const sizeKb = Array.from(document.querySelectorAll('#dm-cloud-table tbody tr'))
                .map((row) => Number.parseFloat(String(row.cells?.[3]?.textContent || '0')) || 0);
            return {
                filterCurrent: document.getElementById('cloud-filter-current')?.checked === true,
                activeCategory: document.querySelector('[data-cloud-category].is-active')?.dataset?.cloudCategory || '',
                rowCount: keys.length,
                internalHistoryRows: keys.filter((key) => key.startsWith('STUDENT_HISTORY_V1_')).length,
                teacherRows: keys.filter((key) => key.startsWith('TEACHERS_')).length,
                backupRows: keys.filter((key) => key.startsWith('BACKUP_')).length,
                positiveSizeRows: sizeKb.filter((size) => size > 0).length,
                summary: String(document.getElementById('dm-cloud-summary')?.textContent || '').replace(/\s+/g, ' ').trim(),
                teacherPreview: Array.from(document.querySelectorAll('[data-cloud-teacher-preview]'))
                    .map((node) => String(node.textContent || '').replace(/\s+/g, ' ').trim())
                    .filter(Boolean),
                loadButtonLabels: Array.from(document.querySelectorAll('[data-cloud-backup-action="load"]'))
                    .map((button) => String(button.textContent || '').replace(/\s+/g, ' ').trim())
            };
        });
        const scoreList = await readCloudList();
        const categoryCounts = await page.evaluate(() => Object.fromEntries(
            Array.from(document.querySelectorAll('[data-cloud-category]')).map((button) => [
                button.dataset.cloudCategory,
                Number(button.querySelector('[data-cloud-category-count]')?.textContent || 0)
            ])
        ));
        await page.locator('[data-cloud-category="teacher"]').click();
        await page.waitForFunction(() => document.querySelector('[data-cloud-category="teacher"]')?.classList.contains('is-active')
            && document.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select').length > 0, null, { timeout: 30000 });
        await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-cloud-teacher-preview]'))
            .some((node) => !String(node.textContent || '').includes('正在读取')), null, { timeout: 30000 });
        const teacherList = await readCloudList();
        await page.locator('[data-cloud-category="workspace"]').click();
        await page.waitForFunction(() => document.querySelector('[data-cloud-category="workspace"]')?.classList.contains('is-active')
            && document.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select').length > 0, null, { timeout: 30000 });
        const workspaceList = await readCloudList();
        await page.locator('[data-cloud-category="backup"]').click();
        await page.waitForFunction(() => document.querySelector('[data-cloud-category="backup"]')?.classList.contains('is-active')
            && document.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select').length > 0, null, { timeout: 30000 });
        const backupList = await readCloudList();
        const cloudList = { scoreList, teacherList, workspaceList, backupList, categoryCounts };
        if (scoreList.filterCurrent) throw new Error('cloud list unexpectedly defaults to current-project-only filtering');
        if (scoreList.activeCategory !== 'score' || scoreList.teacherRows || scoreList.backupRows) throw new Error('score category mixed unrelated cloud records');
        if (teacherList.activeCategory !== 'teacher' || teacherList.teacherRows < 1) throw new Error('teacher category did not isolate timetable records');
        if (!teacherList.loadButtonLabels.some((label) => label.includes('加载并编辑'))) throw new Error('teacher records do not expose the editable entry');
        if (!teacherList.teacherPreview.some((text) => /\d+\s*科/.test(text) && text.includes('位教师'))) throw new Error('teacher subject/name preview did not hydrate');
        if (workspaceList.activeCategory !== 'workspace' || workspaceList.rowCount < 1) throw new Error('workspace/indicator category is empty');
        if (backupList.activeCategory !== 'backup' || backupList.backupRows < 1) throw new Error('backup category did not isolate historical backups');
        if ([scoreList, teacherList, workspaceList, backupList].some((item) => item.internalHistoryRows > 0)) throw new Error('internal student history records leaked into a cloud category');
        if (Object.values(categoryCounts).reduce((sum, count) => sum + count, 0) < 26) throw new Error('cloud category counts are incomplete');
        await page.evaluate(() => window.DataManager?.switchTab?.('teacher'));
        await page.waitForFunction(() => {
            const text = String(document.getElementById('dm-teacher-context-status')?.textContent || '');
            return text.includes('当前正在维护') && text.includes('2022届') && text.includes('9年级');
        }, null, { timeout: 10000 });
        const teacherContext = await page.evaluate(() => ({
            termId: String(document.getElementById('dm-teacher-term-select')?.value || ''),
            text: String(document.getElementById('dm-teacher-context-status')?.textContent || '').replace(/\s+/g, ' ').trim()
        }));
        await page.evaluate(() => window.DataManager?.switchTab?.('params'));
        await page.waitForFunction(() => {
            const text = String(document.getElementById('dm-params-status')?.textContent || '');
            return text.includes('当前参数归属') && text.includes('2022届') && text.includes('2025-2026学年')
                && text.includes('下学期') && text.includes('9年级');
        }, null, { timeout: 10000 });
        const paramsContext = await page.evaluate(() => String(document.getElementById('dm-params-status')?.textContent || '').replace(/\s+/g, ' ').trim());
        await page.locator('#data-manager-modal .modal-close-btn').click();
        await page.waitForFunction(() => {
            const modal = document.getElementById('data-manager-modal');
            return !!modal && getComputedStyle(modal).display === 'none';
        }, null, { timeout: 10000 });
        const modalClosed = true;
        console.log(JSON.stringify({
            ok: true,
            buttonVisibleMs,
            clickResponseMs,
            ...result,
            modalClosed,
            teacherContext,
            paramsContext,
            cloudList
        }, null, 2));
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
