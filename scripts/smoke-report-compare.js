try {
    require.resolve('playwright');
} catch (e) {
    console.error('playwright is required for smoke-report-compare. Run: npm install --no-save playwright');
    process.exit(1);
}

const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
    const baseUrl = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
    const user = process.env.SMOKE_USER || 'admin';
    const pass = process.env.SMOKE_PASS || 'admin123';

    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('#login-user', user);
    await page.fill('#login-pass', pass);
    await page.click('button[onclick="window.Auth?.login()"]');
    await page.waitForTimeout(10000);

    const result = await page.evaluate(async () => {
        const cohortId = localStorage.getItem('CURRENT_COHORT_ID') || window.CURRENT_COHORT_ID || '';
        const fetchRes = await window.CloudManager.fetchCohortExamsToLocal(cohortId);
        if (typeof window.switchTab === 'function') window.switchTab('report-generator');
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (typeof window.updateReportCompareExamSelects === 'function') window.updateReportCompareExamSelects();

        const schools = Object.keys(window.SCHOOLS || {});
        const school = schools[0];
        const student = window.SCHOOLS?.[school]?.students?.[0] || null;
        return {
            cohortId,
            fetchRes,
            compareExamCount: typeof window.listAvailableExamsForCompare === 'function'
                ? window.listAvailableExamsForCompare().length
                : -1,
            sampleStudent: student ? { school, name: student.name, class: student.class } : null
        };
    });

    console.log(JSON.stringify(result, null, 2));
    await browser.close();
})();
