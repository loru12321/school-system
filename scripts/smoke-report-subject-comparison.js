const assert = require('assert');

try {
    require.resolve('playwright');
} catch (_) {
    throw new Error('playwright is required for report subject comparison smoke');
}

const { chromium } = require('playwright');

async function enterWorkspace(page) {
    await page.goto(process.env.SMOKE_URL || 'https://schoolsystem.com.cn/', {
        waitUntil: 'networkidle',
        timeout: 60000
    });
    await page.fill('#login-user', process.env.SMOKE_USER || 'admin');
    await page.fill('#login-pass', process.env.SMOKE_PASS || 'admin123');
    await page.click('#login-submit-button, [data-login-submit]');
    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        return !overlay || getComputedStyle(overlay).display === 'none';
    }, { timeout: 30000 });
    await page.waitForFunction(() => Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0, {
        timeout: 45000
    });
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    try {
        await enterWorkspace(page);
        const result = await page.evaluate(async () => {
            const sameSchool = (left, right) => typeof window.sameAppSchoolName === 'function'
                ? window.sameAppSchoolName(left, right)
                : String(left || '').trim() === String(right || '').trim();
            const student = (window.RAW_DATA || []).find((item) => (
                String(item?.name || '').trim() === '解洪旭'
                && sameSchool(item?.school, '银山实验学校')
                && String(item?.class || '').trim() === '9.4'
            ));
            if (!student) return { ok: false, reason: 'target student unavailable' };

            if (typeof window.switchTab === 'function') window.switchTab('report-generator');
            await new Promise(resolve => window.setTimeout(resolve, 500));
            const historyResponse = await window.CloudManager?.fetchStudentExamHistory?.(student);
            if (historyResponse?.success && typeof window.applyCloudStudentHistoryToPrevData === 'function') {
                window.applyCloudStudentHistoryToPrevData(student, historyResponse, [], window.getEffectiveCurrentExamId?.() || '');
            }
            if (typeof window.updateReportCompareExamSelects === 'function') window.updateReportCompareExamSelects();
            await window.doQuery(student);

            const readRows = () => Array.from(document.querySelectorAll('#report-card-capture-area #tb-query tbody tr'))
                .map((row) => ({
                    subject: String(row.querySelector('td[data-label="科目"]')?.textContent || '').trim(),
                    classRank: String(row.querySelector('td[data-label="本学科班排"]')?.textContent || '').replace(/\s+/g, ' ').trim(),
                    schoolRank: String(row.querySelector('td[data-label="本学科校排"]')?.textContent || '').replace(/\s+/g, ' ').trim()
                }));
            const startedAt = Date.now();
            let rows = readRows();
            while (Date.now() - startedAt < 12000) {
                const coreRows = rows.filter((row) => row.subject && !row.subject.includes('总分'));
                const ready = coreRows.length >= 5 && coreRows.every((row) => (
                    /(上次\s*\d+|上次未考|历史排名未归档)/.test(row.classRank)
                    && /(上次\s*\d+|上次未考|历史排名未归档)/.test(row.schoolRank)
                ));
                if (ready) break;
                await new Promise(resolve => window.setTimeout(resolve, 300));
                rows = readRows();
            }
            const subjects = rows.filter((row) => row.subject && !row.subject.includes('总分'));
            const comparedSubjects = subjects.filter((row) => (
                /上次\s*\d+/.test(row.classRank) && /上次\s*\d+/.test(row.schoolRank)
            ));
            const reportCapture = document.getElementById('report-card-capture-area');
            const reportResult = document.getElementById('single-report-result');
            return {
                ok: subjects.length >= 5
                    && comparedSubjects.length >= 5
                    && subjects.every((row) => (
                        /(上次\s*\d+|上次未考)/.test(row.classRank)
                        && /(上次\s*\d+|上次未考)/.test(row.schoolRank)
                    )),
                historyCount: Array.isArray(historyResponse?.data) ? historyResponse.data.length : 0,
                historySubjectRanks: historyResponse?.data?.[0]?.subjectRanks || null,
                reportDiagnostics: {
                    active: document.getElementById('report-generator')?.classList.contains('active') || false,
                    visible: !!reportResult && !reportResult.classList.contains('hidden'),
                    captureLength: String(reportCapture?.innerHTML || '').length,
                    capturePreview: String(reportCapture?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 360),
                    renderRuntimeReady: typeof window.renderSingleReportCardHTML === 'function'
                },
                subjects,
                comparedSubjects
            };
        });
        assert.ok(result.ok, `subject rank comparison is incomplete: ${JSON.stringify(result)}`);
        console.log(JSON.stringify(result, null, 2));
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
