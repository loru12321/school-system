const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/?verify=calc-snapshot';
const user = process.env.SMOKE_USER || 'admin';
const pass = process.env.SMOKE_PASS || 'admin123';

async function login(page) {
    await page.goto(url, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForFunction(() => document.getElementById('login-overlay') || document.getElementById('app'), null, { timeout: 90000 });
    await page.waitForFunction(() => window.__APP_MODULES_LOADED__ === true || !!sessionStorage.getItem('CURRENT_USER'), null, { timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(800);
    const ready = await page.evaluate(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        return {
            overlayHidden: !overlay || getComputedStyle(overlay).display === 'none',
            appVisible: !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden')
        };
    });
    if (!(ready.overlayHidden && ready.appVisible)) {
        await page.evaluate(() => window.Auth?.openLoginPortalModal?.('school')).catch(() => {});
        await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });
        await page.fill('#login-user', user);
        await page.fill('#login-pass', pass);
        await page.click('button[onclick="window.Auth?.login()"]', { force: true });
    }
    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
        const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        const maskVisible = !!mask && getComputedStyle(mask).display !== 'none';
        const authState = String(document.body?.dataset?.authState || '').trim();
        const sessionUser = String(sessionStorage.getItem('CURRENT_USER') || '').trim();
        return overlayHidden && (appVisible || maskVisible || authState === 'logged_in' || !!sessionUser);
    }, null, { timeout: 90000 });
    const maskVisible = await page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        return !!mask && getComputedStyle(mask).display !== 'none';
    });
    const cohortEntryVisible = await page.evaluate(() => {
        const input = document.getElementById('entry-cohort-year');
        return !!input && getComputedStyle(input).display !== 'none';
    });
    if (maskVisible || cohortEntryVisible) {
        const input = page.locator('#entry-cohort-year');
        if (await input.count()) await input.fill(process.env.SMOKE_COHORT_YEAR || '2022');
        await page.evaluate(async () => {
            if (typeof window.enterCohortFromMask === 'function') {
                await window.enterCohortFromMask();
            } else {
                const button = document.querySelector('button[onclick="enterCohortFromMask()"]');
                if (button) button.click();
            }
        }).catch(() => {});
    }
    await page.waitForFunction(() => {
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        const schools = window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0;
        return rawDataLen > 0 && schools > 0;
    }, null, { timeout: 90000 });
    await page.waitForTimeout(1000);
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await login(page);

    const snapshot = await page.evaluate(async () => {
        const loadRuntimeSkill = async (skillId) => {
            if (!window.SystemRuntimeLoader || typeof window.SystemRuntimeLoader.load !== 'function') return false;
            try {
                await window.SystemRuntimeLoader.load(skillId);
                return true;
            } catch (_) {
                return false;
            }
        };
        const boundedSwitchTab = async (moduleId, timeout = 5000) => {
            if (typeof window.switchTab !== 'function') return false;
            try {
                await Promise.race([
                    Promise.resolve(window.switchTab(moduleId)),
                    new Promise((resolve) => setTimeout(() => resolve(false), timeout))
                ]);
            } catch (_) {
                return false;
            }
            return true;
        };
        await loadRuntimeSkill('county-analysis');
        await boundedSwitchTab('county-analysis');
        await window.CountyAnalysisRuntime?.ensureTeacherContextForCountyAnalysis?.(true);
        window.renderCountyAnalysis?.('county-teacher-portrait');
        const getTeacherRoot = () => document.querySelector('#county-teacher-portrait .county-analysis-root')
            || document.getElementById('county-analysis-root')
            || document.querySelector('#county-analysis .county-analysis-root');
        const deadline = Date.now() + 10000;
        while (
            Date.now() < deadline
            && (!getTeacherRoot() || !getTeacherRoot().querySelector('.county-teacher-own-row'))
        ) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            window.renderCountyAnalysis?.('county-teacher-portrait');
        }
        await loadRuntimeSkill('student-compare');
        await boundedSwitchTab('student-details');
        window.renderStudentDetails?.();
        const studentDeadline = Date.now() + 10000;
        while (
            Date.now() < studentDeadline
            && !Array.from(document.querySelectorAll('#student-details thead th')).some((th) => th.innerText.trim() === '五科总分')
        ) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            window.renderStudentDetails?.();
        }
        await loadRuntimeSkill('teacher-analysis');
        await boundedSwitchTab('teacher-analysis');
        window.analyzeTeachers?.();
        window.calculateTeacherTownshipRanking?.();
        window.renderTeacherTownshipRanking?.();
        const teacherRankDeadline = Date.now() + 10000;
        while (
            Date.now() < teacherRankDeadline
            && !document.querySelector('#teacher-township-ranking-container tbody tr')
        ) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            window.calculateTeacherTownshipRanking?.();
            window.renderTeacherTownshipRanking?.();
        }

        const teacherRoot = getTeacherRoot();
        const studentSection = document.getElementById('student-details');
        const teacherRankSection = document.getElementById('teacher-township-ranking-container');
        const teacherTownshipComparisonCells = teacherRankSection
            ? Array.from(teacherRankSection.querySelectorAll('td[data-label="与镇均比"]')).map((cell) => cell.innerText.trim()).filter(Boolean)
            : [];
        const headers = studentSection
            ? Array.from(studentSection.querySelectorAll('thead th')).map((th) => th.innerText.trim()).filter(Boolean)
            : [];
        const target = (window.RAW_DATA || []).find((student) => String(student?.name || '').trim() === '解洪旭');
        return {
            rawData: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            schoolCount: window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0,
            subjectCount: Array.isArray(window.SUBJECTS) ? window.SUBJECTS.length : 0,
            score2RatePositive: Object.values(window.SCHOOLS || {}).filter((school) => Number(school?.score2Rate) > 0).length,
            teacherRows: Object.values(window.TEACHER_STATS || {}).reduce((sum, subjects) => sum + Object.keys(subjects || {}).length, 0),
            teacherPositive: Object.values(window.TEACHER_STATS || {}).flatMap((subjects) => Object.values(subjects || {}))
                .filter((row) => Number(row?.avgValue) > 0 || Number(row?.fairScore) > 0).length,
            countyTeacherRankRows: teacherRoot ? teacherRoot.querySelectorAll('.county-teacher-rank-table tbody tr').length : 0,
            countyOwnTeacherRows: teacherRoot ? teacherRoot.querySelectorAll('.county-teacher-own-row').length : 0,
            teacherTownshipAverageSubjects: Object.values(window.TEACHER_TOWNSHIP_AVERAGES || {}).filter((row) => Number(row?.count) > 0).length,
            teacherTownshipComparisonCells,
            headers,
            targetStudent: target ? {
                name: target.name,
                school: target.school,
                town: target.townshipRank || target.ranks?.total?.township || 0,
                county: target.countyRank || target.ranks?.total?.county || 0
            } : null
        };
    });

    await browser.close();

    assert.strictEqual(snapshot.rawData, 7809, 'RAW_DATA count changed');
    assert.ok(snapshot.schoolCount >= 24, `school count too low: ${snapshot.schoolCount}`);
    assert.strictEqual(snapshot.subjectCount, 5, 'subject count changed for current 9th-grade exam');
    assert.ok(snapshot.score2RatePositive >= 14, `score2Rate positive schools too low: ${snapshot.score2RatePositive}`);
    assert.strictEqual(snapshot.teacherRows, 13, 'teacher row count changed');
    assert.strictEqual(snapshot.teacherPositive, 13, 'teacher positive row count changed');
    assert.ok(snapshot.countyTeacherRankRows >= 120, `county teacher rank rows too low: ${snapshot.countyTeacherRankRows}`);
    assert.strictEqual(snapshot.countyOwnTeacherRows, 13, 'county own teacher rows changed');
    assert.ok(snapshot.teacherTownshipAverageSubjects >= 5, `teacher township benchmarks missing: ${snapshot.teacherTownshipAverageSubjects}`);
    assert.ok(snapshot.teacherTownshipComparisonCells.length > 0, 'teacher township comparison cells missing');
    assert.ok(
        snapshot.teacherTownshipComparisonCells.some((text) => text !== '+0.00%' && text !== '0.00%' && text !== '—'),
        'teacher township comparisons are all zero or empty'
    );

    const totalIndex = snapshot.headers.indexOf('五科总分');
    assert.ok(totalIndex >= 0, '五科总分 header missing');
    assert.deepStrictEqual(snapshot.headers.slice(totalIndex + 1, totalIndex + 5), ['班排', '校排', '镇排', '县排'], 'total rank column order changed');
    assert.ok(snapshot.targetStudent, 'target student 解洪旭 missing');
    assert.strictEqual(snapshot.targetStudent.school, '银山实验学校', 'target student school changed');
    assert.strictEqual(snapshot.targetStudent.town, 4, 'target student town rank changed');
    assert.strictEqual(snapshot.targetStudent.county, 222, 'target student county rank changed');

    console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
