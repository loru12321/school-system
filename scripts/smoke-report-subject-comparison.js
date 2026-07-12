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

            // This is the verified cloud snapshot for the target record. Keep
            // the smoke independent of manual history fetching so it exercises
            // the report's own background synchronization path.
            const expectedPrevious = {
                examId: '2022级-9年级-2025-2026-下学期-一模-2026-04-16',
                subjectRanks: {
                    '语文': { class: 4, school: 8 },
                    '数学': { class: 1, school: 10 },
                    '英语': { class: 2, school: 2 },
                    '物理': { class: 1, school: 5 },
                    '化学': { class: 1, school: 3 }
                }
            };
            if (typeof window.switchTab === 'function') window.switchTab('report-generator');
            await new Promise(resolve => window.setTimeout(resolve, 500));
            await window.doQuery(student);

            const readRows = () => Array.from(document.querySelectorAll('#report-card-capture-area #tb-query tbody tr'))
                .map((row) => ({
                    subject: String(row.querySelector('td[data-label="科目"]')?.textContent || '').trim(),
                    classRank: String(row.querySelector('td[data-label="班排对比"]')?.textContent || '').replace(/\s+/g, ' ').trim(),
                    schoolRank: String(row.querySelector('td[data-label="校排对比"]')?.textContent || '').replace(/\s+/g, ' ').trim()
                }));
            const startedAt = Date.now();
            let rows = readRows();
            while (Date.now() - startedAt < 12000) {
                const coreRows = rows.filter((row) => row.subject && !row.subject.includes('总分'));
                const ready = coreRows.length >= 5 && coreRows.every((row) => (
                    /本次\s*\d+\s*上次\s*\d+\s*变化/.test(row.classRank)
                    && /本次\s*\d+\s*上次\s*\d+\s*变化/.test(row.schoolRank)
                ));
                if (ready) break;
                await new Promise(resolve => window.setTimeout(resolve, 300));
                rows = readRows();
            }
            const subjects = rows.filter((row) => row.subject && !row.subject.includes('总分'));
            const comparedSubjects = subjects.filter((row) => (
                /本次\s*\d+\s*上次\s*\d+\s*变化/.test(row.classRank)
                && /本次\s*\d+\s*上次\s*\d+\s*变化/.test(row.schoolRank)
            ));
            const expectedSubjectRanks = expectedPrevious?.subjectRanks || {};
            const expectedSubjects = Object.entries(expectedSubjectRanks)
                .filter(([subject]) => subject !== 'total')
                .filter(([, ranks]) => ranks?.class != null && ranks?.school != null);
            const matchesCloudRanks = expectedSubjects.every(([subject, ranks]) => {
                const row = subjects.find((item) => item.subject === subject);
                return !!row
                    && new RegExp(`上次\\s*${ranks.class}(?:\\D|$)`).test(row.classRank)
                    && new RegExp(`上次\\s*${ranks.school}(?:\\D|$)`).test(row.schoolRank);
            });
            const selectedExamIds = typeof window.getSelectedReportCompareExamIds === 'function'
                ? window.getSelectedReportCompareExamIds()
                : [];
            const currentExamId = typeof window.getEffectiveCurrentExamId === 'function'
                ? window.getEffectiveCurrentExamId()
                : '';
            const cachedHistory = typeof window.getCachedStudentReportHistory === 'function'
                ? window.getCachedStudentReportHistory(student, selectedExamIds, currentExamId)
                : [];
            return {
                ok: subjects.length >= 5
                    && comparedSubjects.length >= 5
                    && !!expectedPrevious
                    && matchesCloudRanks
                    && subjects.every((row) => (
                        /本次\s*\d+\s*上次\s*(?:\d+|-)\s*变化/.test(row.classRank)
                        && /本次\s*\d+\s*上次\s*(?:\d+|-)\s*变化/.test(row.schoolRank)
                    )),
                historyCount: Array.isArray(cachedHistory) ? cachedHistory.length : 0,
                expectedPrevious: expectedPrevious ? {
                    examId: expectedPrevious.examFullKey || expectedPrevious.examId || '',
                    subjectRanks: expectedSubjectRanks
                } : null,
                matchesCloudRanks,
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
