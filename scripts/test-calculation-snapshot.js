const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/?verify=calc-snapshot';
const user = process.env.SMOKE_USER || 'admin';
const pass = process.env.SMOKE_PASS || 'admin123';

function isExecutionContextDestroyed(error) {
    const message = String(error?.message || error || '');
    return message.includes('Execution context was destroyed')
        || message.includes('Cannot find context with specified id');
}

async function waitForPageStability(page, timeout = 15000) {
    await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {});
    await page.waitForTimeout(300);
}

async function withNavigationRetry(page, task, attempts = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await task(attempt);
        } catch (error) {
            lastError = error;
            if (!isExecutionContextDestroyed(error) || attempt >= attempts) throw error;
            await waitForPageStability(page);
        }
    }
    throw lastError;
}

async function readLoginState(page) {
    return withNavigationRetry(page, () => page.evaluate(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        const input = document.getElementById('entry-cohort-year');
        const selector = document.getElementById('cohort-selector');
        return {
            overlayHidden: !overlay || getComputedStyle(overlay).display === 'none',
            appVisible: !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden'),
            maskVisible: !!mask && getComputedStyle(mask).display !== 'none',
            authState: String(document.body?.dataset?.authState || '').trim(),
            sessionUserPresent: !!String(sessionStorage.getItem('CURRENT_USER') || '').trim(),
            bootPending: !!window.__BOOT_AUTH_PENDING_HANDOFF__,
            inputValue: String(input?.value || '').trim(),
            currentCohortId: String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim(),
            examId: String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim(),
            rawDataLen: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            schoolCount: window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0,
            knownCohorts: selector
                ? Array.from(selector.options || []).map((option) => String(option.value || '').trim()).filter(Boolean)
                : []
        };
    }), 4);
}

function isLoggedInShellReady(state) {
    return (
        state.overlayHidden && (state.appVisible || state.maskVisible || state.authState === 'logged_in' || state.sessionUserPresent)
    ) || (
        (state.authState === 'logged_in' || state.sessionUserPresent || state.bootPending)
        && (state.appVisible || state.maskVisible)
    );
}

async function ensureLoginWindowVisible(page) {
    const loginUser = page.locator('#login-user');
    if (await loginUser.isVisible().catch(() => false)) return;

    const openers = [
        page.locator('[data-login-open="school"]').first(),
        page.locator('.login-stage-nav-links a[data-nav="modal"]').first(),
        page.locator('.login-stage-primary-action').first(),
        page.locator('button[onclick="window.Auth?.openLoginPortalModal(\'school\')"]').first()
    ];

    for (const opener of openers) {
        if (!(await opener.count().catch(() => 0))) continue;
        await opener.click({ force: true }).catch(() => {});
        if (await loginUser.isVisible().catch(() => false)) return;
    }

    await page.evaluate(() => {
        if (window.Auth && typeof window.Auth.openLoginPortalModal === 'function') {
            window.Auth.openLoginPortalModal('school');
        }
    }).catch(() => {});
    await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });
}

async function waitForLoggedInShell(page) {
    await withNavigationRetry(page, () => page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
        const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        const maskVisible = !!mask && getComputedStyle(mask).display !== 'none';
        const authState = String(document.body?.dataset?.authState || '').trim();
        const sessionUser = String(sessionStorage.getItem('CURRENT_USER') || '').trim();
        const bootPending = !!window.__BOOT_AUTH_PENDING_HANDOFF__;
        return (
            overlayHidden && (appVisible || maskVisible || authState === 'logged_in' || !!sessionUser)
        ) || (
            (authState === 'logged_in' || !!sessionUser || bootPending)
            && (appVisible || maskVisible)
        );
    }, null, { timeout: 180000 }), 4);
}

async function ensureCohortEntered(page) {
    let state = await readLoginState(page);
    if (!state.maskVisible) return state;

    if (!state.overlayHidden && (state.authState === 'logged_in' || state.sessionUserPresent || state.bootPending)) {
        await withNavigationRetry(page, () => page.waitForFunction(() => {
            const overlay = document.getElementById('login-overlay');
            return !overlay || getComputedStyle(overlay).display === 'none';
        }, null, { timeout: 30000 }), 2).catch(() => {});
        await waitForPageStability(page, 5000);
        state = await readLoginState(page);
        if (!state.maskVisible) return state;
    }

    await withNavigationRetry(page, () => page.waitForFunction(() => {
        const mask = document.getElementById('mode-mask');
        const app = document.getElementById('app');
        const examId = String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        return (!mask || getComputedStyle(mask).display === 'none')
            || (!!examId && rawDataLen > 0)
            || (appVisible && !!examId && rawDataLen > 0);
    }, null, { timeout: 15000 }), 1).catch(() => {});

    state = await readLoginState(page);
    if (!state.maskVisible) return state;

    const candidate = String(
        process.env.SMOKE_COHORT_YEAR
        || state.inputValue
        || state.currentCohortId
        || state.knownCohorts[0]
        || '2022'
    ).trim();

    if (!candidate) return state;

    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const mask = document.getElementById('mode-mask');
            if (!mask || getComputedStyle(mask).display === 'none') return true;
            let cohortManagerReady = false;
            try {
                cohortManagerReady = typeof CohortManager !== 'undefined'
                    && !!CohortManager
                    && typeof CohortManager.addCohort === 'function';
            } catch (_) {
                cohortManagerReady = false;
            }
            return (
                (typeof window.enterCohortFromMask === 'function' && cohortManagerReady)
                || !!document.querySelector('button[onclick="enterCohortFromMask()"]')
            );
        }, null, { timeout: 30000 });

        const input = page.locator('#entry-cohort-year');
        if (await input.count()) await input.fill(candidate);

        await page.evaluate(async () => {
            let cohortManagerReady = false;
            try {
                cohortManagerReady = typeof CohortManager !== 'undefined'
                    && !!CohortManager
                    && typeof CohortManager.addCohort === 'function';
            } catch (_) {
                cohortManagerReady = false;
            }
            if (typeof window.enterCohortFromMask === 'function' && cohortManagerReady) {
                await window.enterCohortFromMask();
                return;
            }
            document.querySelector('button[onclick="enterCohortFromMask()"]')?.click();
        });

        await waitForPageStability(page, 10000);
        await page.waitForFunction((expectedCohortId) => {
            const mask = document.getElementById('mode-mask');
            const app = document.getElementById('app');
            const overlay = document.getElementById('login-overlay');
            const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
            const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
            const cohortId = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
            const examId = String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
            const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
            const readyWorkspace = !!cohortId && !!examId && rawDataLen > 0;
            const maskHidden = !mask || getComputedStyle(mask).display === 'none';
            const normalizedExpected = String(expectedCohortId || '').trim();
            return overlayHidden && (
                (maskHidden && appVisible)
                || (!!cohortId && normalizedExpected && cohortId === normalizedExpected)
                || (appVisible && readyWorkspace)
            );
        }, candidate, { timeout: 60000 });
    }, 4);

    return readLoginState(page);
}

async function login(page) {
    await page.goto(url, { waitUntil: 'commit', timeout: 90000 });
    await withNavigationRetry(page, () => page.waitForFunction(() => {
        return document.getElementById('login-overlay')
            || document.getElementById('app')
            || document.getElementById('mode-mask');
    }, null, { timeout: 90000 }), 4);
    await page.waitForFunction(() => window.__APP_MODULES_LOADED__ === true || !!sessionStorage.getItem('CURRENT_USER'), null, { timeout: 90000 }).catch(() => {});
    await waitForPageStability(page, 10000);

    let ready = await readLoginState(page);
    if (!isLoggedInShellReady(ready)) {
        await ensureLoginWindowVisible(page);
        await page.fill('#login-user', user);
        await page.fill('#login-pass', pass);
        const submit = page.locator('#login-submit-button').first();
        if (await submit.count().catch(() => 0)) {
            await submit.click({ force: true });
        } else {
            await page.click('button[onclick="window.Auth?.login()"]', { force: true });
        }
    }

    try {
        await waitForLoggedInShell(page);
    } catch (error) {
        ready = await readLoginState(page).catch(() => null);
        throw new Error(`Login shell did not become ready: ${error.message}; state=${JSON.stringify(ready)}`);
    }

    await ensureCohortEntered(page);
    await page.waitForFunction(() => {
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        const schools = window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0;
        return rawDataLen > 0 && schools > 0;
    }, null, { timeout: 180000 });
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
        const toNumber = (value, fallback = 0) => {
            const number = Number(value);
            return Number.isFinite(number) ? number : fallback;
        };
        const parseFirstNumber = (value) => {
            const match = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
            return match ? Number(match[0]) : null;
        };
        const nearlyEqual = (left, right, tolerance = 0.02) => (
            Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= tolerance
        );
        const buildTownshipSchoolMatcher = () => {
            const allSchoolNames = Object.keys(window.SCHOOLS || {});
            const hasHelper = typeof window.getTownshipManagedSchoolNames === 'function';
            const townshipSet = new Set(
                hasHelper
                    ? window.getTownshipManagedSchoolNames(allSchoolNames).map((name) => String(name || '').trim())
                    : allSchoolNames.map((name) => String(name || '').trim())
            );
            return (schoolName) => {
                const normalizedName = String(schoolName || '').trim();
                if (!hasHelper) return true;
                if (typeof window.isTownshipManagedSchool === 'function') {
                    return window.isTownshipManagedSchool(normalizedName, allSchoolNames);
                }
                return townshipSet.has(normalizedName);
            };
        };
        const isTownshipSchoolName = buildTownshipSchoolMatcher();
        const buildIndependentTeacherTownshipRows = () => {
            const rows = [];
            (window.SUBJECTS || []).forEach((subject) => {
                const rankingData = [];
                Object.keys(window.TEACHER_STATS || {}).forEach((teacherName) => {
                    const data = window.TEACHER_STATS?.[teacherName]?.[subject];
                    if (!data) return;
                    rankingData.push({
                        subject,
                        name: teacherName,
                        type: 'teacher',
                        avg: toNumber(data.avg),
                        excellentRate: toNumber(data.excellentRate),
                        passRate: toNumber(data.passRate),
                        studentCount: toNumber(data.studentCount)
                    });
                });
                Object.keys(window.SCHOOLS || {}).forEach((schoolName) => {
                    const metrics = window.SCHOOLS?.[schoolName]?.metrics?.[subject];
                    if (!metrics || schoolName === window.MY_SCHOOL || !isTownshipSchoolName(schoolName)) return;
                    rankingData.push({
                        subject,
                        name: schoolName,
                        type: 'school',
                        avg: toNumber(metrics.avg),
                        excellentRate: toNumber(metrics.excRate),
                        passRate: toNumber(metrics.passRate),
                        studentCount: toNumber(metrics.count)
                    });
                });
                rankingData.sort((left, right) => right.avg - left.avg);
                rankingData.forEach((item, index) => { item.rankAvg = index + 1; });
                rankingData.sort((left, right) => right.excellentRate - left.excellentRate);
                rankingData.forEach((item, index) => { item.rankExc = index + 1; });
                rankingData.sort((left, right) => right.passRate - left.passRate);
                rankingData.forEach((item, index) => { item.rankPass = index + 1; });
                rankingData.sort((left, right) => right.avg - left.avg);
                rows.push(...rankingData);
            });
            return rows;
        };
        const readTeacherTownshipDomRows = () => {
            const container = document.getElementById('teacher-township-ranking-container');
            return Array.from(container?.querySelectorAll('.analysis-anchor-panel') || []).flatMap((panel) => {
                const heading = String(panel.querySelector('.analysis-section-head > span')?.textContent || '').trim();
                const subject = heading.replace(/\s*教师乡镇排名\s*$/, '');
                return Array.from(panel.querySelectorAll('tbody tr')).map((row) => {
                    const cells = Array.from(row.cells || []);
                    return {
                        subject,
                        name: String(cells[0]?.textContent || '').trim(),
                        type: String(cells[1]?.textContent || '').includes('教师') ? 'teacher' : 'school',
                        avg: parseFirstNumber(cells[2]?.textContent),
                        avgComparison: parseFirstNumber(cells[3]?.textContent),
                        rankAvg: parseFirstNumber(cells[4]?.textContent),
                        excellentPercent: parseFirstNumber(cells[5]?.textContent),
                        excellentComparison: parseFirstNumber(cells[6]?.textContent),
                        rankExc: parseFirstNumber(cells[7]?.textContent),
                        passPercent: parseFirstNumber(cells[8]?.textContent),
                        passComparison: parseFirstNumber(cells[9]?.textContent),
                        rankPass: parseFirstNumber(cells[10]?.textContent)
                    };
                });
            });
        };
        const expectedTownshipRows = buildIndependentTeacherTownshipRows();
        const renderedTownshipRows = readTeacherTownshipDomRows();
        const renderedTownshipRowMap = new Map(renderedTownshipRows.map((row) => [`${row.subject}::${row.type}::${row.name}`, row]));
        const townshipAverages = window.TEACHER_TOWNSHIP_AVERAGES || {};
        const calcBenchmarkDelta = (value, benchmark) => {
            if (!Number.isFinite(value) || !Number.isFinite(benchmark) || Math.abs(benchmark) < 1e-9) return null;
            return ((value - benchmark) / benchmark) * 100;
        };
        const compareTownshipRow = (expected) => {
            const rendered = renderedTownshipRowMap.get(`${expected.subject}::${expected.type}::${expected.name}`);
            if (!rendered) return { key: `${expected.subject}::${expected.type}::${expected.name}`, reason: 'missing-rendered-row' };
            const avgBenchmark = toNumber(townshipAverages?.[expected.subject]?.avg, NaN);
            const excBenchmark = toNumber(townshipAverages?.[expected.subject]?.excRate, NaN);
            const passBenchmark = toNumber(townshipAverages?.[expected.subject]?.passRate, NaN);
            const expectedAvgComparison = calcBenchmarkDelta(expected.avg, avgBenchmark);
            const expectedExcComparison = calcBenchmarkDelta(expected.excellentRate, excBenchmark);
            const expectedPassComparison = calcBenchmarkDelta(expected.passRate, passBenchmark);
            const mismatches = [];
            if (!nearlyEqual(rendered.avg, Number(expected.avg.toFixed(2)))) mismatches.push('avg');
            if (rendered.rankAvg !== expected.rankAvg) mismatches.push('rankAvg');
            if (!nearlyEqual(rendered.excellentPercent, Number((expected.excellentRate * 100).toFixed(2)))) mismatches.push('excellentPercent');
            if (rendered.rankExc !== expected.rankExc) mismatches.push('rankExc');
            if (!nearlyEqual(rendered.passPercent, Number((expected.passRate * 100).toFixed(2)))) mismatches.push('passPercent');
            if (rendered.rankPass !== expected.rankPass) mismatches.push('rankPass');
            if (expectedAvgComparison !== null && !nearlyEqual(rendered.avgComparison, Number(expectedAvgComparison.toFixed(2)))) mismatches.push('avgComparison');
            if (expectedExcComparison !== null && !nearlyEqual(rendered.excellentComparison, Number(expectedExcComparison.toFixed(2)))) mismatches.push('excellentComparison');
            if (expectedPassComparison !== null && !nearlyEqual(rendered.passComparison, Number(expectedPassComparison.toFixed(2)))) mismatches.push('passComparison');
            return mismatches.length ? {
                key: `${expected.subject}::${expected.type}::${expected.name}`,
                mismatches,
                rendered,
                expected: {
                    ...expected,
                    avgComparison: expectedAvgComparison === null ? null : Number(expectedAvgComparison.toFixed(2)),
                    excellentComparison: expectedExcComparison === null ? null : Number(expectedExcComparison.toFixed(2)),
                    passComparison: expectedPassComparison === null ? null : Number(expectedPassComparison.toFixed(2))
                }
            } : null;
        };
        const teacherTownshipValueMismatches = expectedTownshipRows
            .filter((row) => row.type === 'teacher')
            .map(compareTownshipRow)
            .filter(Boolean);
        const townshipAverageChecks = (window.SUBJECTS || []).map((subject) => {
            const rows = (window.RAW_DATA || []).filter((row) => {
                const schoolName = String(row?.school || '').trim();
                const score = toNumber(row?.scores?.[subject], NaN);
                return Number.isFinite(score) && (!schoolName || isTownshipSchoolName(schoolName));
            });
            const scores = rows.map((row) => toNumber(row?.scores?.[subject], NaN)).filter(Number.isFinite);
            const avg = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
            const renderedAverage = townshipAverages?.[subject] || {};
            return {
                subject,
                rawCount: scores.length,
                renderedCount: toNumber(renderedAverage.count),
                avg,
                renderedAvg: toNumber(renderedAverage.avg),
                countMatches: scores.length === toNumber(renderedAverage.count),
                avgMatches: nearlyEqual(toNumber(renderedAverage.avg), avg, 0.0001)
            };
        });
        const townshipAverageMismatches = townshipAverageChecks.filter((item) => !item.countMatches || !item.avgMatches);
        await boundedSwitchTab('marginal-push');
        if (typeof window.updateMpSchoolSelect === 'function') window.updateMpSchoolSelect();
        const marginalResult = (() => {
            const schoolSelect = document.getElementById('mpSchoolSelect');
            const subjectSelect = document.getElementById('mpSubjectSelect');
            const gapInput = document.getElementById('mpGap');
            const typeSelect = document.getElementById('mpType');
            const schools = Array.from(schoolSelect?.options || []).map((option) => option.value).filter(Boolean);
            let result = null;
            for (const school of schools) {
                schoolSelect.value = school;
                window.updateMpClassSelect?.();
                if (subjectSelect) subjectSelect.value = 'ALL';
                if (typeSelect) typeSelect.value = 'both';
                for (const gap of [5, 10, 20, 999]) {
                    if (gapInput) gapInput.value = String(gap);
                    result = typeof window.generateMarginalTickets === 'function'
                        ? window.generateMarginalTickets()
                        : null;
                    if (Number(result?.count || 0) > 0) return result;
                }
            }
            return result;
        })();
        const marginalRows = typeof MP_DATA_CACHE !== 'undefined' && Array.isArray(MP_DATA_CACHE)
            ? MP_DATA_CACHE
            : (Array.isArray(window.MP_DATA_CACHE) ? window.MP_DATA_CACHE : []);
        const marginalValues = marginalRows.flatMap((row) => [row.score, row.target, row.diff]);
        await boundedSwitchTab('seat-adjustment');
        if (typeof window.updateSeatAdjSelects === 'function') window.updateSeatAdjSelects();
        const seatAdjustmentResult = (() => {
            const schoolSelect = document.getElementById('seatAdjSchoolSelect');
            const classSelect = document.getElementById('seatAdjClassSelect');
            const groupsInput = document.getElementById('seatAdjGroups');
            const colsInput = document.getElementById('seatAdjCols');
            const strategySelect = document.getElementById('seatAdjStrategy');
            const schools = Array.from(schoolSelect?.options || []).map((option) => option.value).filter(Boolean);
            let result = null;
            for (const school of schools) {
                schoolSelect.value = school;
                window.updateSeatAdjSelects?.();
                const classes = Array.from(classSelect?.options || []).map((option) => option.value).filter(Boolean);
                for (const className of classes) {
                    classSelect.value = className;
                    window.updateConstraintWidgetsContext?.('adj');
                    if (groupsInput) groupsInput.value = '2';
                    if (colsInput) colsInput.value = '4';
                    if (strategySelect) strategySelect.value = 'conversion';
                    result = typeof window.generateSeatSuggestions === 'function'
                        ? window.generateSeatSuggestions()
                        : null;
                    if (Number(result?.count || 0) > 0) return result;
                }
            }
            return result;
        })();
        const seatAdjustmentDeskCount = document.querySelectorAll('#seat-adj-container .desk:not(.desk-empty)').length;
        await boundedSwitchTab('cohort-growth');
        const cohortGrowthResult = typeof window.CohortGrowth?.compute === 'function'
            ? window.CohortGrowth.compute()
            : { volatility: [], growth: [] };
        const cohortGrowthValues = [
            ...(cohortGrowthResult.volatility || []).flatMap((row) => [row.count, row.sigma]),
            ...(cohortGrowthResult.growth || []).flatMap((row) => [row.start, row.end, row.delta])
        ];

        const teacherRoot = getTeacherRoot();
        const studentSection = document.getElementById('student-details');
        const teacherRankSection = document.getElementById('teacher-township-ranking-container');
        const teacherTownshipComparisonCells = teacherRankSection
            ? Array.from(teacherRankSection.querySelectorAll('td[data-label="与镇均比"]')).map((cell) => cell.innerText.trim()).filter(Boolean)
            : [];
        const headers = studentSection
            ? Array.from(studentSection.querySelectorAll('thead th')).map((th) => th.innerText.trim()).filter(Boolean)
            : [];
        const policySubjects = ['语文', '数学', '英语', '历史', '地理', '生物', '政治', '物理', '化学'];
        const readFullScorePolicy = (grade) => Object.fromEntries(policySubjects.map((subject) => [
            subject,
            window.AnalyticsKernel?.getSubjectFullScore?.(subject, { grade }) ?? null
        ]));
        const subjectFullScorePolicy = Object.fromEntries([6, 7, 8, 9].map((grade) => [grade, readFullScorePolicy(grade)]));
        const currentSubjectFullScores = Object.fromEntries((window.SUBJECTS || []).map((subject) => [
            subject,
            window.AnalyticsKernel?.getSubjectFullScore?.(subject, { config: window.CONFIG }) ?? null
        ]));
        const target = (window.RAW_DATA || []).find((student) => String(student?.name || '').trim() === '解洪旭');
        return {
            rawData: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            schoolCount: window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0,
            subjectCount: Array.isArray(window.SUBJECTS) ? window.SUBJECTS.length : 0,
            subjectFullScorePolicy,
            currentSubjectFullScores,
            currentSubjectFullScoreTotal: window.AnalyticsKernel?.getTotalFullScore?.(window.SUBJECTS || [], { config: window.CONFIG }) ?? null,
            score2RatePositive: Object.values(window.SCHOOLS || {}).filter((school) => Number(school?.score2Rate) > 0).length,
            teacherRows: Object.values(window.TEACHER_STATS || {}).reduce((sum, subjects) => sum + Object.keys(subjects || {}).length, 0),
            teacherPositive: Object.values(window.TEACHER_STATS || {}).flatMap((subjects) => Object.values(subjects || {}))
                .filter((row) => Number(row?.avgValue) > 0 || Number(row?.fairScore) > 0).length,
            countyTeacherRankRows: teacherRoot ? teacherRoot.querySelectorAll('.county-teacher-rank-table tbody tr').length : 0,
            countyOwnTeacherRows: teacherRoot ? teacherRoot.querySelectorAll('.county-teacher-own-row').length : 0,
            teacherTownshipAverageSubjects: Object.values(window.TEACHER_TOWNSHIP_AVERAGES || {}).filter((row) => Number(row?.count) > 0).length,
            teacherTownshipComparisonCells,
            teacherTownshipRenderedRows: renderedTownshipRows.length,
            teacherTownshipExpectedRows: expectedTownshipRows.length,
            teacherTownshipRenderedTeacherRows: renderedTownshipRows.filter((row) => row.type === 'teacher').length,
            teacherTownshipExpectedTeacherRows: expectedTownshipRows.filter((row) => row.type === 'teacher').length,
            teacherTownshipValueMismatches,
            teacherTownshipAverageChecks: townshipAverageChecks,
            teacherTownshipAverageMismatches: townshipAverageMismatches,
            marginalGeneratedCount: Number(marginalResult?.count || 0),
            marginalTicketCount: document.querySelectorAll('#mp-tickets-container .task-ticket').length,
            marginalFinite: marginalValues.every((value) => Number.isFinite(Number(value))),
            seatAdjustmentCount: Number(seatAdjustmentResult?.count || 0),
            seatAdjustmentDeskCount,
            seatAdjustmentFinite: seatAdjustmentResult?.finite === true,
            seatAdjustmentSample: seatAdjustmentResult ? {
                school: seatAdjustmentResult.schoolName || '',
                className: seatAdjustmentResult.className || '',
                strategy: seatAdjustmentResult.strategy || ''
            } : null,
            cohortExamCount: Object.keys(window.COHORT_DB?.exams || {}).length,
            cohortVolatilityRows: Array.isArray(cohortGrowthResult.volatility) ? cohortGrowthResult.volatility.length : 0,
            cohortGrowthRows: Array.isArray(cohortGrowthResult.growth) ? cohortGrowthResult.growth.length : 0,
            cohortGrowthFinite: cohortGrowthValues.every((value) => Number.isFinite(Number(value))),
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
    assert.deepStrictEqual(snapshot.subjectFullScorePolicy, {
        6: { '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100, '物理': null, '化学': null },
        7: { '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100, '物理': null, '化学': null },
        8: { '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100, '物理': 100, '化学': 100 },
        9: { '语文': 150, '数学': 150, '英语': 150, '历史': null, '地理': null, '生物': null, '政治': 100, '物理': 90, '化学': 60 }
    }, 'subject full score policy changed');
    assert.deepStrictEqual(snapshot.currentSubjectFullScores, { '语文': 150, '数学': 150, '英语': 150, '物理': 90, '化学': 60 }, 'current 9th-grade subject full scores changed');
    assert.strictEqual(snapshot.currentSubjectFullScoreTotal, 600, 'current 9th-grade full score total changed');
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
    assert.ok(snapshot.teacherTownshipExpectedRows > 0, 'teacher township expected rows missing');
    assert.strictEqual(
        snapshot.teacherTownshipRenderedRows,
        snapshot.teacherTownshipExpectedRows,
        'teacher township rendered row count does not match independent expected rows'
    );
    assert.strictEqual(
        snapshot.teacherTownshipRenderedTeacherRows,
        snapshot.teacherTownshipExpectedTeacherRows,
        'teacher township rendered teacher row count does not match independent expected rows'
    );
    assert.strictEqual(
        snapshot.teacherTownshipExpectedTeacherRows,
        snapshot.teacherRows,
        'teacher township expected teacher rows do not match teacher stats rows'
    );
    assert.deepStrictEqual(
        snapshot.teacherTownshipValueMismatches,
        [],
        'teacher township ranking table diverged from independent calculation'
    );
    assert.deepStrictEqual(
        snapshot.teacherTownshipAverageMismatches,
        [],
        'teacher township averages diverged from raw student scores'
    );
    assert.ok(snapshot.marginalGeneratedCount > 0, 'marginal task generation produced no rows');
    assert.ok(snapshot.marginalTicketCount > 0, 'marginal task ticket rendering failed');
    assert.ok(snapshot.marginalFinite, 'marginal task calculation produced non-finite values');
    assert.ok(snapshot.seatAdjustmentCount > 0, 'seat adjustment generation produced no seats');
    assert.strictEqual(snapshot.seatAdjustmentDeskCount, snapshot.seatAdjustmentCount, 'seat adjustment rendered seat count mismatch');
    assert.ok(snapshot.seatAdjustmentFinite, 'seat adjustment calculation produced non-finite values');
    assert.ok(snapshot.cohortExamCount >= 2, `cohort exam count too low: ${snapshot.cohortExamCount}`);
    assert.ok(snapshot.cohortGrowthRows > 0, 'cohort growth rows missing');
    assert.ok(snapshot.cohortGrowthFinite, 'cohort growth calculation produced non-finite values');

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
