const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/?verify=calc-snapshot';
const minimumRawDataRows = Math.max(1, Number(process.env.CALC_SNAPSHOT_MIN_RAW_DATA || 2000));
const minimumSchoolCount = Math.max(1, Number(process.env.CALC_SNAPSHOT_MIN_SCHOOLS || 14));
const minimumCountyTeacherRankRows = Math.max(1, Number(process.env.CALC_SNAPSHOT_MIN_COUNTY_TEACHER_RANK_ROWS || 80));
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
            await page.click('#login-submit-button', { force: true });
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
        await loadRuntimeSkill('teaching-management');
        await loadRuntimeSkill('teacher-analysis');
        await boundedSwitchTab('teacher-analysis');
        window.TeachingManagementModulesRuntime?.relocateTeacherBlocks?.();
        await boundedSwitchTab('teacher-township-ranking');
        window.TeachingManagementModulesRuntime?.relocateTeacherBlocks?.();
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
        await window.ensureTeacherCompareRuntimeLoaded?.().catch(() => {});
        await loadRuntimeSkill('progress-analysis');
        await loadRuntimeSkill('town-submodule-compare');
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
                    if (!metrics || window.sameAppSchoolName(schoolName, window.MY_SCHOOL) || !isTownshipSchoolName(schoolName)) return;
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
        let renderedTownshipRows = readTeacherTownshipDomRows();
        let renderedTownshipRowMap = new Map(renderedTownshipRows.map((row) => [`${row.subject}::${row.type}::${row.name}`, row]));
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
        let teacherTownshipValueMismatches = expectedTownshipRows
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
        await boundedSwitchTab('teacher-township-ranking');
        window.calculateTeacherTownshipRanking?.();
        window.renderTeacherTownshipRanking?.();
        renderedTownshipRows = readTeacherTownshipDomRows();
        renderedTownshipRowMap = new Map(renderedTownshipRows.map((row) => [`${row.subject}::${row.type}::${row.name}`, row]));
        teacherTownshipValueMismatches = expectedTownshipRows
            .filter((row) => row.type === 'teacher')
            .map(compareTownshipRow)
            .filter(Boolean);

        const teacherRoot = getTeacherRoot();
        const studentSection = document.getElementById('student-details');
        const teacherRankSection = document.getElementById('teacher-township-ranking-container');
        const teacherTownshipComparisonCells = teacherRankSection
            ? Array.from(teacherRankSection.querySelectorAll('td[data-label="与镇均比"]')).map((cell) => cell.textContent.trim()).filter(Boolean)
            : [];
        const teacherTownshipRenderDebug = teacherRankSection ? {
            htmlLength: teacherRankSection.innerHTML.length,
            tableCount: teacherRankSection.querySelectorAll('table').length,
            rowCount: teacherRankSection.querySelectorAll('tbody tr').length,
            labeledCellCount: teacherRankSection.querySelectorAll('td[data-label]').length,
            textSample: teacherRankSection.textContent.trim().slice(0, 200)
        } : { missing: true };
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
        const blankSubjectScorePolicy = (() => {
            if (typeof window.parseRows !== 'function'
                || typeof window.readRawData !== 'function'
                || typeof window.setRawData !== 'function'
                || typeof window.readSchools !== 'function'
                || typeof window.setSchools !== 'function'
                || typeof window.readSubjects !== 'function'
                || typeof window.setSubjects !== 'function'
                || typeof window.readConfigState !== 'function'
                || typeof window.setConfigState !== 'function') {
                return { available: false };
            }
            const previousRawData = window.readRawData();
            const previousSchools = window.readSchools();
            const previousSubjects = window.readSubjects();
            const previousConfig = window.readConfigState();
            try {
                window.setRawData([]);
                window.setSchools({});
                window.setSubjects([]);
                window.setConfigState({ ...(previousConfig || {}), name: '6年级', analysisSubs: 'auto', totalSubs: 'auto' });
                window.parseRows([
                    ['学校', '班级', '姓名', '语文', '数学', '英语'],
                    ['测试学校', '6.10班', '空白数学', 120, '', 118],
                    ['测试学校', '6.10班', '完整学生', 121, 119, 117],
                    ['', '', '', '', '', '']
                ], '测试学校');
                const rows = window.readRawData();
                const blankRow = rows.find((student) => String(student?.name || '') === '空白数学');
                const fullRow = rows.find((student) => String(student?.name || '') === '完整学生');
                return {
                    available: true,
                    rowCount: rows.length,
                    blankMath: blankRow?.scores?.数学,
                    blankSubjects: blankRow?.blankScoreSubjects || [],
                    blankAuditSubjects: typeof window.getStudentZeroScoreAuditSubjects === 'function'
                        ? window.getStudentZeroScoreAuditSubjects(blankRow, ['语文', '数学', '英语']).allSubjects
                        : [],
                    blankTotal: blankRow?.total,
                    blankClass: blankRow?.class,
                    fullMath: fullRow?.scores?.数学,
                    fullTotal: fullRow?.total,
                    generatedNameRows: rows.filter((student) => /^考生/.test(String(student?.name || ''))).length
                };
            } finally {
                window.setRawData(previousRawData);
                window.setSchools(previousSchools);
                window.setSubjects(previousSubjects);
                window.setConfigState(previousConfig);
            }
        })();
        const classSchoolIsolationPolicy = (() => {
            if (typeof window.calculateClassRanksOnly !== 'function'
                || typeof window.getClassSchoolMapForAllData !== 'function'
                || typeof window.readRawData !== 'function'
                || typeof window.setRawData !== 'function'
                || typeof window.readSchools !== 'function'
                || typeof window.setSchools !== 'function'
                || typeof window.readSubjects !== 'function'
                || typeof window.setSubjects !== 'function'
                || typeof window.readTeacherSchoolMap !== 'function'
                || typeof window.setTeacherSchoolMap !== 'function') {
                return { available: false };
            }
            const previousRawData = window.readRawData();
            const previousSchools = window.readSchools();
            const previousSubjects = window.readSubjects();
            const previousTeacherSchoolMap = window.readTeacherSchoolMap();
            const rows = [
                { school: '甲校', class: '9.1', name: '甲校高分', total: 120, scores: { 数学: 120 }, ranks: { total: {}, 数学: {} } },
                { school: '甲校', class: '9.1', name: '甲校低分', total: 90, scores: { 数学: 90 }, ranks: { total: {}, 数学: {} } },
                { school: '乙校', class: '9.1', name: '乙校高分', total: 150, scores: { 数学: 150 }, ranks: { total: {}, 数学: {} } }
            ];
            try {
                window.setRawData(rows);
                window.setSchools({
                    甲校: { name: '甲校', students: rows.filter((row) => row.school === '甲校'), metrics: {}, rankings: {} },
                    乙校: { name: '乙校', students: rows.filter((row) => row.school === '乙校'), metrics: {}, rankings: {} }
                });
                window.setSubjects(['数学']);
                window.setTeacherSchoolMap({});
                window.calculateClassRanksOnly();
                const inferredMap = window.getClassSchoolMapForAllData();
                const hasAmbiguousClassMap = Object.prototype.hasOwnProperty.call(inferredMap || {}, '9.1');
                window.setTeacherSchoolMap({ '9.1_数学': '乙校' });
                const explicitMap = window.getClassSchoolMapForAllData();
                return {
                    available: true,
                    aHighClassRank: rows[0].ranks?.total?.class,
                    aLowClassRank: rows[1].ranks?.total?.class,
                    bHighClassRank: rows[2].ranks?.total?.class,
                    aHighMathRank: rows[0].ranks?.数学?.class,
                    bHighMathRank: rows[2].ranks?.数学?.class,
                    ambiguousClassSchool: hasAmbiguousClassMap ? inferredMap['9.1'] : null,
                    explicitClassSchool: explicitMap?.['9.1'] || null
                };
            } finally {
                window.setRawData(previousRawData);
                window.setSchools(previousSchools);
                window.setSubjects(previousSubjects);
                window.setTeacherSchoolMap(previousTeacherSchoolMap);
            }
        })();
        const analyticsKernelSchoolAliasPolicy = (() => {
            if (!window.AnalyticsKernel || typeof window.AnalyticsKernel.buildSnapshot !== 'function'
                || typeof window.readRawData !== 'function'
                || typeof window.setRawData !== 'function'
                || typeof window.readSchools !== 'function'
                || typeof window.setSchools !== 'function'
                || typeof window.readSubjects !== 'function'
                || typeof window.setSubjects !== 'function'
                || typeof window.readTeacherMap !== 'function'
                || typeof window.setTeacherMap !== 'function'
                || typeof window.readTeacherSchoolMap !== 'function'
                || typeof window.setTeacherSchoolMap !== 'function') {
                return { available: false };
            }
            const previousRawData = window.readRawData();
            const previousSchools = window.readSchools();
            const previousSubjects = window.readSubjects();
            const previousTeacherMap = window.readTeacherMap();
            const previousTeacherSchoolMap = window.readTeacherSchoolMap();
            const previousSchool = typeof window.readCurrentSchool === 'function'
                ? window.readCurrentSchool()
                : String(window.MY_SCHOOL || '');
            const previousSameSchool = window.areSchoolNamesEquivalent;
            const rows = [
                { school: '甲校', class: '9.1', name: '甲一', scores: { 数学: 90 } },
                { school: '甲校别名', class: '9.1', name: '甲二', scores: { 数学: 80 } },
                { school: '乙校', class: '9.2', name: '乙一', scores: { 数学: 100 } }
            ];
            const normalizeAliasSchool = (value) => String(value || '').trim().replace(/别名/g, '');
            try {
                window.areSchoolNamesEquivalent = (left, right) => (
                    normalizeAliasSchool(left) === normalizeAliasSchool(right)
                    || (typeof previousSameSchool === 'function' && previousSameSchool(left, right))
                );
                if (typeof window.writeCurrentSchool === 'function') window.writeCurrentSchool('甲校别名');
                else window.MY_SCHOOL = '甲校别名';
                window.setRawData(rows);
                window.setSchools({});
                window.setSubjects(['数学']);
                window.setTeacherMap({
                    '9.1_数学': '甲校教师',
                    '9.2_数学': '乙校教师'
                });
                window.setTeacherSchoolMap({
                    '9.1_数学': '甲校',
                    '9.2_数学': '乙校'
                });
                window.AnalyticsKernel.invalidate?.();
                const snapshot = window.AnalyticsKernel.buildSnapshot({ force: true });
                const stats = snapshot.teacherStats || {};
                const local = stats['甲校教师']?.数学 || null;
                return {
                    available: true,
                    teacherSchoolName: snapshot.teacherSchoolName,
                    teacherNames: Object.keys(stats).sort(),
                    localStudentCount: Number(local?.studentCount || 0),
                    localAvg: Number(local?.avg || 0),
                    containsForeignTeacher: !!stats['乙校教师']
                };
            } finally {
                window.areSchoolNamesEquivalent = previousSameSchool;
                if (typeof window.writeCurrentSchool === 'function') window.writeCurrentSchool(previousSchool);
                else window.MY_SCHOOL = previousSchool;
                window.setRawData(previousRawData);
                window.setSchools(previousSchools);
                window.setSubjects(previousSubjects);
                window.setTeacherMap(previousTeacherMap);
                window.setTeacherSchoolMap(previousTeacherSchoolMap);
                window.AnalyticsKernel.invalidate?.();
            }
        })();
        const teacherCompareSchoolIsolationPolicy = (() => {
            if (typeof window.buildTeacherStatsForExam !== 'function') return { available: false };
            const previousTeacherMap = typeof window.readTeacherMap === 'function'
                ? window.readTeacherMap()
                : (window.TEACHER_MAP || {});
            const previousTeacherSchoolMap = typeof window.readTeacherSchoolMap === 'function'
                ? window.readTeacherSchoolMap()
                : (window.TEACHER_SCHOOL_MAP || {});
            const applyTeacherMaps = (teacherMap, teacherSchoolMap) => {
                if (typeof window.setTeacherMap === 'function') window.setTeacherMap(teacherMap);
                else window.TEACHER_MAP = teacherMap;
                if (typeof window.setTeacherSchoolMap === 'function') window.setTeacherSchoolMap(teacherSchoolMap);
                else window.TEACHER_SCHOOL_MAP = teacherSchoolMap;
            };
            const rows = [
                { school: '甲校', class: '9.1', name: '甲一', scores: { 数学: 100 } },
                { school: '甲校', class: '9.1', name: '甲二', scores: { 数学: 80 } },
                { school: '甲校', class: '9.2', name: '甲三', scores: { 数学: 70 } },
                { school: '乙校', class: '9.1', name: '乙一', scores: { 数学: 95 } }
            ];
            try {
                applyTeacherMaps(
                    {
                        '9.1_数学': '乙校教师',
                        '9.2_数学': '甲校教师'
                    },
                    {
                        '9.1_数学': '乙校',
                        '9.2_数学': '甲校'
                    }
                );
                const stats = window.buildTeacherStatsForExam(rows, '甲校', '数学');
                const teacherNames = stats.map((item) => item.teacher).sort();
                const local = stats.find((item) => item.teacher === '甲校教师') || null;
                const foreign = stats.find((item) => item.teacher === '乙校教师') || null;
                return {
                    available: true,
                    teacherNames,
                    containsForeignTeacher: !!foreign,
                    localStudentCount: Number(local?.studentCount || 0),
                    foreignStudentCount: Number(foreign?.studentCount || 0)
                };
            } finally {
                applyTeacherMaps(previousTeacherMap, previousTeacherSchoolMap);
            }
        })();
        const compareSchoolAliasDefaultPolicy = (() => {
            if (typeof window.resolveCompareSchoolOption !== 'function'
                || typeof window.progressResolveSchoolOption !== 'function'
                || typeof window.resolveTownSubmoduleDefaultSchool !== 'function') {
                return { available: false };
            }
            const previousSameSchool = window.areSchoolNamesEquivalent;
            const normalizeAliasSchool = (value) => String(value || '').trim().replace(/别名/g, '');
            try {
                window.areSchoolNamesEquivalent = (left, right) => (
                    normalizeAliasSchool(left) === normalizeAliasSchool(right)
                    || (typeof previousSameSchool === 'function' && previousSameSchool(left, right))
                );
                const schoolList = ['甲校', '乙校'];
                return {
                    available: true,
                    compareDefault: window.resolveCompareSchoolOption(schoolList, '甲校别名'),
                    progressDefault: window.progressResolveSchoolOption(schoolList, '甲校别名'),
                    townDefault: window.resolveTownSubmoduleDefaultSchool(schoolList, '甲校别名'),
                    townFallback: window.resolveTownSubmoduleDefaultSchool(schoolList, '')
                };
            } finally {
                window.areSchoolNamesEquivalent = previousSameSchool;
            }
        })();
        const countyAnalysisSchoolAliasPolicy = (() => {
            const runtime = window.CountyAnalysisRuntime || {};
            if (typeof runtime.resolveSchoolOption !== 'function'
                || typeof runtime.sameSchoolName !== 'function'
                || !window.CountySchoolHorizontalRenderer
                || typeof window.CountySchoolHorizontalRenderer.renderTotalTable !== 'function') {
                return { available: false };
            }
            const previousSameSchool = window.areSchoolNamesEquivalent;
            const normalizeAliasSchool = (value) => String(value || '').trim().replace(/别名/g, '');
            try {
                window.areSchoolNamesEquivalent = (left, right) => (
                    normalizeAliasSchool(left) === normalizeAliasSchool(right)
                    || (typeof previousSameSchool === 'function' && previousSameSchool(left, right))
                );
                const html = window.CountySchoolHorizontalRenderer.renderTotalTable({
                    buildCountyHorizontalTotalRows: () => [
                        { schoolName: '甲校', count: 2, avg: 85, excellentRate: 0.5, passRate: 1, ratedAvg: 50, ratedExc: 80, ratedPass: 50, score: 180, rankScore: 1 },
                        { schoolName: '乙校', count: 1, avg: 100, excellentRate: 1, passRate: 1, ratedAvg: 60, ratedExc: 80, ratedPass: 50, score: 190, rankScore: 2 }
                    ],
                    toNumber: Number,
                    escapeHtml: (value) => String(value ?? ''),
                    formatCountyRankDisplay: (value) => String(value),
                    formatNumber: (value) => String(value),
                    sameSchoolName: runtime.sameSchoolName
                }, '甲校别名');
                const highlightedRows = String(html).match(/<tr class="bg-highlight">[\s\S]*?<\/tr>/g) || [];
                return {
                    available: true,
                    resolvedSchool: runtime.resolveSchoolOption(['甲校', '乙校'], '甲校别名'),
                    sameSchool: runtime.sameSchoolName('甲校别名', '甲校'),
                    highlightedRows: highlightedRows.length,
                    highlightedSchool: highlightedRows[0]?.includes('甲校') ? '甲校' : '',
                    highlightsForeignSchool: !!highlightedRows[0]?.includes('乙校')
                };
            } finally {
                window.areSchoolNamesEquivalent = previousSameSchool;
            }
        })();
        const studentAliasIdentityPolicy = (() => {
            if (typeof window.getCurrentBoundStudentFromUser !== 'function'
                || typeof window.pickSelfStudentFromCloudRows !== 'function'
                || typeof window.findStudentForJump !== 'function'
                || typeof window.buildClassTeacherStatsForClass !== 'function'
                || typeof window.setRawData !== 'function'
                || typeof window.setSchools !== 'function'
                || typeof window.setSubjects !== 'function'
                || typeof window.setTeacherMap !== 'function'
                || typeof window.setTeacherSchoolMap !== 'function') {
                return { available: false };
            }
            const previousRawData = typeof window.readRawData === 'function' ? window.readRawData() : (window.RAW_DATA || []);
            const previousSchools = typeof window.readSchools === 'function' ? window.readSchools() : (window.SCHOOLS || {});
            const previousSubjects = typeof window.readSubjects === 'function' ? window.readSubjects() : (window.SUBJECTS || []);
            const previousTeacherMap = typeof window.readTeacherMap === 'function' ? window.readTeacherMap() : (window.TEACHER_MAP || {});
            const previousTeacherSchoolMap = typeof window.readTeacherSchoolMap === 'function' ? window.readTeacherSchoolMap() : (window.TEACHER_SCHOOL_MAP || {});
            const previousThresholds = window.THRESHOLDS || {};
            const previousSchool = typeof window.readCurrentSchool === 'function'
                ? window.readCurrentSchool()
                : String(window.MY_SCHOOL || '');
            const previousSameSchool = window.areSchoolNamesEquivalent;
            const previousGetCurrentUser = window.getCurrentUser;
            const rows = [
                { school: '甲校', class: '9.1', name: '张三', total: 90, scores: { 数学: 90 } },
                { school: '乙校', class: '9.1', name: '张三', total: 60, scores: { 数学: 60 } }
            ];
            const normalizeAliasSchool = (value) => String(value || '').trim().replace(/别名/g, '');
            try {
                window.areSchoolNamesEquivalent = (left, right) => (
                    normalizeAliasSchool(left) === normalizeAliasSchool(right)
                    || (typeof previousSameSchool === 'function' && previousSameSchool(left, right))
                );
                window.getCurrentUser = () => ({ role: 'class_teacher', name: '王老师', school: '甲校别名', class: '9.1' });
                if (typeof window.writeCurrentSchool === 'function') window.writeCurrentSchool('甲校别名');
                else window.MY_SCHOOL = '甲校别名';
                window.setRawData(rows);
                window.setSchools({
                    甲校: { name: '甲校', students: [rows[0]], metrics: { 数学: { avg: 90, count: 1 } } },
                    乙校: { name: '乙校', students: [rows[1]], metrics: { 数学: { avg: 60, count: 1 } } }
                });
                window.setSubjects(['数学']);
                window.setTeacherMap({ '9.1_数学': '王老师' });
                window.setTeacherSchoolMap({ '9.1_数学': '甲校' });
                window.THRESHOLDS = { 数学: { exc: 85, pass: 60 } };
                const bound = window.getCurrentBoundStudentFromUser({
                    role: 'student',
                    name: '张三',
                    class: '9.1',
                    school: '甲校别名'
                });
                const picked = window.pickSelfStudentFromCloudRows([
                    { school: '乙校', class: '9.1', name: '张三', latestTotal: 60 },
                    { school: '甲校', class: '9.1', name: '张三', latestTotal: 90 }
                ], {
                    name: typeof window.normalizeCompareName === 'function' ? window.normalizeCompareName('张三') : '张三',
                    class: '9.1',
                    school: '甲校别名'
                });
                const jump = window.findStudentForJump('张三', '甲校别名', '9.1');
                const teacherStats = window.buildClassTeacherStatsForClass('9.1');
                return {
                    available: true,
                    boundSchool: bound?.school || '',
                    boundScore: Number(bound?.scores?.数学 || 0),
                    pickedSchool: picked?.student?.school || '',
                    pickedTotal: Number(picked?.student?.latestTotal || 0),
                    jumpSchool: jump?.school || '',
                    teacherStudentCount: Number(teacherStats?.王老师?.数学?.studentCount || 0),
                    teacherAvg: String(teacherStats?.王老师?.数学?.avg || '')
                };
            } finally {
                window.areSchoolNamesEquivalent = previousSameSchool;
                if (previousGetCurrentUser) window.getCurrentUser = previousGetCurrentUser;
                if (typeof window.writeCurrentSchool === 'function') window.writeCurrentSchool(previousSchool);
                else window.MY_SCHOOL = previousSchool;
                window.setRawData(previousRawData);
                window.setSchools(previousSchools);
                window.setSubjects(previousSubjects);
                window.setTeacherMap(previousTeacherMap);
                window.setTeacherSchoolMap(previousTeacherSchoolMap);
                window.THRESHOLDS = previousThresholds;
            }
        })();
        const appSchoolAliasHelperPolicy = (() => {
            if (typeof window.sameAppSchoolName !== 'function'
                || typeof window.getAppSchoolRecord !== 'function'
                || typeof window.filterRowsByAppSchool !== 'function'
                || typeof window.buildComparisonStudentRankContext !== 'function'
                || typeof window.setRawData !== 'function'
                || typeof window.setSchools !== 'function'
                || typeof window.setSubjects !== 'function') {
                return { available: false };
            }
            const previousRawData = typeof window.readRawData === 'function' ? window.readRawData() : (window.RAW_DATA || []);
            const previousSchools = typeof window.readSchools === 'function' ? window.readSchools() : (window.SCHOOLS || {});
            const previousSubjects = typeof window.readSubjects === 'function' ? window.readSubjects() : (window.SUBJECTS || []);
            const previousSameSchool = window.areSchoolNamesEquivalent;
            const rows = [
                { school: '甲校', class: '9.1', name: '甲一', total: 90, scores: { 数学: 90 } },
                { school: '甲校', class: '9.1', name: '甲二', total: 80, scores: { 数学: 80 } },
                { school: '乙校', class: '9.1', name: '乙一', total: 100, scores: { 数学: 100 } }
            ];
            const normalizeAliasSchool = (value) => String(value || '').trim().replace(/别名/g, '');
            try {
                window.areSchoolNamesEquivalent = (left, right) => (
                    normalizeAliasSchool(left) === normalizeAliasSchool(right)
                    || (typeof previousSameSchool === 'function' && previousSameSchool(left, right))
                );
                window.setRawData(rows);
                window.setSchools({
                    甲校: { name: '甲校', students: rows.filter((row) => row.school === '甲校') },
                    乙校: { name: '乙校', students: rows.filter((row) => row.school === '乙校') }
                });
                window.setSubjects(['数学']);
                const schoolRecord = window.getAppSchoolRecord('甲校别名');
                const filteredRows = window.filterRowsByAppSchool(rows, '甲校别名');
                const rankContext = window.buildComparisonStudentRankContext(rows, ['数学']);
                const targetKey = rankContext.keyOf(rows[0]);
                return {
                    available: true,
                    sameSchool: window.sameAppSchoolName('甲校别名', '甲校'),
                    resolvedStudentCount: Number(schoolRecord?.students?.length || 0),
                    filteredCount: filteredRows.length,
                    filteredForeignCount: filteredRows.filter((row) => row.school === '乙校').length,
                    aliasSchoolRank: rankContext.getSchoolRankMap('甲校别名').get(targetKey) || 0,
                    aliasClassRank: rankContext.getClassRankMap('甲校别名', '9.1').get(targetKey) || 0
                };
            } finally {
                window.areSchoolNamesEquivalent = previousSameSchool;
                window.setRawData(previousRawData);
                window.setSchools(previousSchools);
                window.setSubjects(previousSubjects);
            }
        })();
        const rankingDataServiceSchoolAliasPolicy = (() => {
            const service = window.RankingDataService;
            if (!service
                || typeof service.getRowsBySchoolClass !== 'function'
                || typeof service.getClassesForSchool !== 'function'
                || typeof service.findStudent !== 'function'
                || typeof service.getEquivalentSchoolLookupKeys !== 'function') {
                return { available: false };
            }
            const previousSameSchool = window.areSchoolNamesEquivalent;
            const rows = [
                { school: '甲校', class: '9.1', name: '甲一', id: 'A001', total: 90, scores: { 数学: 90 } },
                { school: '甲校', class: '9.2', name: '甲二', id: 'A002', total: 80, scores: { 数学: 80 } },
                { school: '乙校', class: '9.1', name: '乙一', id: 'B001', total: 100, scores: { 数学: 100 } }
            ];
            const normalizeAliasSchool = (value) => String(value || '').trim().replace(/别名/g, '');
            try {
                window.areSchoolNamesEquivalent = (left, right) => (
                    normalizeAliasSchool(left) === normalizeAliasSchool(right)
                    || (typeof previousSameSchool === 'function' && previousSameSchool(left, right))
                );
                const aliasRows = service.getRowsBySchoolClass(rows, '甲校别名', '9.1');
                const aliasClasses = service.getClassesForSchool(rows, '甲校别名');
                const found = service.findStudent(rows, { school: '甲校别名', className: '9.1', name: '甲一' });
                const index = service.getStudentIndex(rows);
                return {
                    available: true,
                    aliasRowCount: aliasRows.length,
                    aliasFirstName: aliasRows[0]?.name || '',
                    aliasForeignCount: aliasRows.filter((row) => row.school === '乙校').length,
                    aliasClasses,
                    foundSchool: found?.school || '',
                    lookupKeys: service.getEquivalentSchoolLookupKeys(index, '甲校别名')
                };
            } finally {
                window.areSchoolNamesEquivalent = previousSameSchool;
            }
        })();
        const teacherAnalysisCoreSchoolAliasPolicy = (() => {
            if (typeof window.analyzeTeachers !== 'function'
                || typeof window.calculateTeacherTownshipRanking !== 'function'
                || typeof window.generateTeacherPairing !== 'function'
                || typeof window.setRawData !== 'function'
                || typeof window.setSchools !== 'function'
                || typeof window.setSubjects !== 'function'
                || typeof window.setTeacherMap !== 'function'
                || typeof window.setTeacherSchoolMap !== 'function') {
                return { available: false };
            }
            const previousRawData = typeof window.readRawData === 'function' ? window.readRawData() : (window.RAW_DATA || []);
            const previousSchools = typeof window.readSchools === 'function' ? window.readSchools() : (window.SCHOOLS || {});
            const previousSubjects = typeof window.readSubjects === 'function' ? window.readSubjects() : (window.SUBJECTS || []);
            const previousTeacherMap = typeof window.readTeacherMap === 'function' ? window.readTeacherMap() : (window.TEACHER_MAP || {});
            const previousTeacherSchoolMap = typeof window.readTeacherSchoolMap === 'function' ? window.readTeacherSchoolMap() : (window.TEACHER_SCHOOL_MAP || {});
            const previousStats = window.TEACHER_STATS || {};
            const previousSchool = typeof window.readCurrentSchool === 'function'
                ? window.readCurrentSchool()
                : String(window.MY_SCHOOL || '');
            const previousSameSchool = window.areSchoolNamesEquivalent;
            const previousListAvailableSchoolsForCompare = window.listAvailableSchoolsForCompare;
            const previousGetTownshipManagedSchoolNames = window.getTownshipManagedSchoolNames;
            const previousIsTownshipManagedSchool = window.isTownshipManagedSchool;
            let pairingContainer = document.getElementById('teacher-pairing-suggestions');
            let temporaryPairingContainer = null;
            if (!pairingContainer && document.body && typeof document.createElement === 'function') {
                temporaryPairingContainer = document.createElement('div');
                temporaryPairingContainer.id = 'teacher-pairing-suggestions';
                document.body.appendChild(temporaryPairingContainer);
                pairingContainer = temporaryPairingContainer;
            }
            const previousPairingHtml = pairingContainer ? pairingContainer.innerHTML : '';
            const schoolSelect = document.getElementById('mySchoolSelect');
            const previousSchoolSelectValue = schoolSelect ? schoolSelect.value : '';
            const normalizeAliasSchool = (value) => String(value || '').trim().replace(/别名/g, '');
            const rows = [
                { school: '甲校', class: '9.1', name: '甲一', total: 90, scores: { 数学: 90 } },
                { school: '甲校', class: '9.1', name: '甲二', total: 80, scores: { 数学: 80 } },
                { school: '乙校', class: '9.1', name: '乙一', total: 100, scores: { 数学: 100 } }
            ];
            try {
                window.areSchoolNamesEquivalent = (left, right) => (
                    normalizeAliasSchool(left) === normalizeAliasSchool(right)
                    || (typeof previousSameSchool === 'function' && previousSameSchool(left, right))
                );
                window.listAvailableSchoolsForCompare = () => ['甲校别名', '乙校'];
                window.getTownshipManagedSchoolNames = (names = []) => names.map((name) => String(name || '').trim()).filter(Boolean);
                window.isTownshipManagedSchool = (schoolName, names = []) => {
                    const normalizedSchool = normalizeAliasSchool(schoolName);
                    return (names || []).some((name) => normalizeAliasSchool(name) === normalizedSchool);
                };
                if (typeof window.writeCurrentSchool === 'function') window.writeCurrentSchool('甲校别名');
                else window.MY_SCHOOL = '甲校别名';
                if (schoolSelect) schoolSelect.value = '甲校别名';
                window.setRawData(rows);
                window.setSchools({
                    甲校: { metrics: { 数学: { avg: 85, excRate: 0.5, passRate: 0.8, count: 2 } } },
                    乙校: { metrics: { 数学: { avg: 100, excRate: 1, passRate: 1, count: 1 } } }
                });
                window.setSubjects(['数学']);
                window.setTeacherMap({ '9.1_数学': '甲校教师' });
                window.setTeacherSchoolMap({ '9.1_数学': '甲校' });
                window.TEACHER_STATS = {};
                window.analyzeTeachers({ render: false, force: true });
                const local = window.TEACHER_STATS?.['甲校教师']?.数学 || null;
                const foreign = window.TEACHER_STATS?.['乙校教师']?.数学 || null;
                window.calculateTeacherTownshipRanking({ force: true });
                const aliasRows = window.TOWNSHIP_RANKING_DATA?.数学 || [];
                window.TEACHER_STATS = {
                    基础老师: { 数学: { passRate: 0.9, excellentRate: 0.2 } },
                    培优老师: { 数学: { passRate: 0.7, excellentRate: 0.6 } }
                };
                if (pairingContainer) pairingContainer.innerHTML = '';
                window.generateTeacherPairing();
                const pairingCount = pairingContainer ? pairingContainer.querySelectorAll('.pairing-card').length : 0;
                if (typeof window.writeCurrentSchool === 'function') window.writeCurrentSchool('乙校');
                else window.MY_SCHOOL = '乙校';
                if (schoolSelect) schoolSelect.value = '乙校';
                window.TEACHER_STATS = {
                    甲校教师: { 数学: { avg: 85, avgValue: 85, excellentRate: 0.5, passRate: 1, studentCount: 2 } }
                };
                window.calculateTeacherTownshipRanking();
                const switchedRows = window.TOWNSHIP_RANKING_DATA?.数学 || [];
                return {
                    available: true,
                    localStudentCount: Number(local?.studentCount || 0),
                    localAvg: Number(local?.avg || 0),
                    containsForeignTeacher: !!foreign,
                    townshipExcludesCanonical: !aliasRows.some((row) => row.type === 'school' && row.name === '甲校'),
                    townshipIncludesOther: aliasRows.some((row) => row.type === 'school' && row.name === '乙校'),
                    switchedIncludesCanonical: switchedRows.some((row) => row.type === 'school' && row.name === '甲校'),
                    switchedExcludesNewSchool: !switchedRows.some((row) => row.type === 'school' && row.name === '乙校'),
                    pairingCount
                };
            } finally {
                window.areSchoolNamesEquivalent = previousSameSchool;
                if (previousListAvailableSchoolsForCompare) {
                    window.listAvailableSchoolsForCompare = previousListAvailableSchoolsForCompare;
                } else {
                    delete window.listAvailableSchoolsForCompare;
                }
                if (previousGetTownshipManagedSchoolNames) {
                    window.getTownshipManagedSchoolNames = previousGetTownshipManagedSchoolNames;
                } else {
                    delete window.getTownshipManagedSchoolNames;
                }
                if (previousIsTownshipManagedSchool) {
                    window.isTownshipManagedSchool = previousIsTownshipManagedSchool;
                } else {
                    delete window.isTownshipManagedSchool;
                }
                if (typeof window.writeCurrentSchool === 'function') window.writeCurrentSchool(previousSchool);
                else window.MY_SCHOOL = previousSchool;
                window.setRawData(previousRawData);
                window.setSchools(previousSchools);
                window.setSubjects(previousSubjects);
                window.setTeacherMap(previousTeacherMap);
                window.setTeacherSchoolMap(previousTeacherSchoolMap);
                window.TEACHER_STATS = previousStats;
                if (temporaryPairingContainer) temporaryPairingContainer.remove();
                else if (pairingContainer) pairingContainer.innerHTML = previousPairingHtml;
                if (schoolSelect) schoolSelect.value = previousSchoolSelectValue;
                window.calculateTeacherTownshipRanking({ force: true });
            }
        })();
        const target = (window.RAW_DATA || []).find((student) => String(student?.name || '').trim() === '解洪旭');
        return {
            rawData: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            schoolCount: window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0,
            subjectCount: Array.isArray(window.SUBJECTS) ? window.SUBJECTS.length : 0,
            subjectFullScorePolicy,
            currentSubjectFullScores,
            currentSubjectFullScoreTotal: window.AnalyticsKernel?.getTotalFullScore?.(window.SUBJECTS || [], { config: window.CONFIG }) ?? null,
            blankSubjectScorePolicy,
            classSchoolIsolationPolicy,
            analyticsKernelSchoolAliasPolicy,
            teacherCompareSchoolIsolationPolicy,
            compareSchoolAliasDefaultPolicy,
            countyAnalysisSchoolAliasPolicy,
            studentAliasIdentityPolicy,
            appSchoolAliasHelperPolicy,
            rankingDataServiceSchoolAliasPolicy,
            teacherAnalysisCoreSchoolAliasPolicy,
            score2RatePositive: Object.values(window.SCHOOLS || {}).filter((school) => Number(school?.score2Rate) > 0).length,
            teacherRows: Object.values(window.TEACHER_STATS || {}).reduce((sum, subjects) => sum + Object.keys(subjects || {}).length, 0),
            teacherPositive: Object.values(window.TEACHER_STATS || {}).flatMap((subjects) => Object.values(subjects || {}))
                .filter((row) => Number(row?.avgValue) > 0 || Number(row?.fairScore) > 0).length,
            countyTeacherRankRows: teacherRoot ? teacherRoot.querySelectorAll('.county-teacher-rank-table tbody tr').length : 0,
            countyOwnTeacherRows: teacherRoot ? teacherRoot.querySelectorAll('.county-teacher-own-row').length : 0,
            teacherTownshipAverageSubjects: Object.values(window.TEACHER_TOWNSHIP_AVERAGES || {}).filter((row) => Number(row?.count) > 0).length,
            teacherTownshipComparisonCells,
            teacherTownshipRenderDebug,
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

    assert.ok(
        snapshot.rawData >= minimumRawDataRows,
        `RAW_DATA count below protected baseline: ${snapshot.rawData} < ${minimumRawDataRows}`
    );
    assert.ok(snapshot.schoolCount >= minimumSchoolCount, `school count too low: ${snapshot.schoolCount} < ${minimumSchoolCount}`);
    assert.ok(snapshot.subjectCount >= 5, `subject count too low for current exam: ${snapshot.subjectCount}`);
    assert.deepStrictEqual(snapshot.subjectFullScorePolicy, {
        6: { '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100, '物理': null, '化学': null },
        7: { '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100, '物理': null, '化学': null },
        8: { '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100, '物理': 100, '化学': 100 },
        9: { '语文': 150, '数学': 150, '英语': 150, '历史': null, '地理': null, '生物': null, '政治': 100, '物理': 90, '化学': 60 }
    }, 'subject full score policy changed');
    assert.ok(snapshot.currentSubjectFullScoreTotal >= 600 && snapshot.currentSubjectFullScoreTotal <= 700, `current 9th-grade full score total out of range: ${snapshot.currentSubjectFullScoreTotal}`);
    Object.entries(snapshot.currentSubjectFullScores).forEach(([subject, fullScore]) => {
        assert.strictEqual(fullScore, snapshot.subjectFullScorePolicy[9][subject], `current 9th-grade full score policy mismatch: ${subject}`);
    });
    assert.deepStrictEqual(snapshot.blankSubjectScorePolicy, {
        available: true,
        rowCount: 2,
        blankMath: 0,
        blankSubjects: ['数学'],
        blankAuditSubjects: ['数学'],
        blankTotal: 238,
        blankClass: '6.10',
        fullMath: 119,
        fullTotal: 357,
        generatedNameRows: 0
    }, 'blank subject score parsing policy changed');
    assert.deepStrictEqual(snapshot.classSchoolIsolationPolicy, {
        available: true,
        aHighClassRank: 1,
        aLowClassRank: 2,
        bHighClassRank: 1,
        aHighMathRank: 1,
        bHighMathRank: 1,
        ambiguousClassSchool: null,
        explicitClassSchool: '乙校'
    }, 'same class names across schools should stay school-scoped');
    assert.deepStrictEqual(snapshot.analyticsKernelSchoolAliasPolicy, {
        available: true,
        teacherSchoolName: '甲校别名',
        teacherNames: ['甲校教师'],
        localStudentCount: 2,
        localAvg: 85,
        containsForeignTeacher: false
    }, 'analytics kernel should keep teacher stats when current school is an alias');
    assert.deepStrictEqual(snapshot.teacherCompareSchoolIsolationPolicy, {
        available: true,
        teacherNames: ['甲校教师'],
        containsForeignTeacher: false,
        localStudentCount: 1,
        foreignStudentCount: 0
    }, 'teacher compare should ignore foreign explicit same-class assignment');
    assert.deepStrictEqual(snapshot.compareSchoolAliasDefaultPolicy, {
        available: true,
        compareDefault: '甲校',
        progressDefault: '甲校',
        townDefault: '甲校',
        townFallback: '甲校'
    }, 'compare selectors should resolve school aliases to canonical options');
    assert.deepStrictEqual(snapshot.countyAnalysisSchoolAliasPolicy, {
        available: true,
        resolvedSchool: '甲校',
        sameSchool: true,
        highlightedRows: 1,
        highlightedSchool: '甲校',
        highlightsForeignSchool: false
    }, 'county analysis should resolve and highlight school aliases consistently');
    assert.deepStrictEqual(snapshot.studentAliasIdentityPolicy, {
        available: true,
        boundSchool: '甲校',
        boundScore: 90,
        pickedSchool: '甲校',
        pickedTotal: 90,
        jumpSchool: '甲校',
        teacherStudentCount: 1,
        teacherAvg: '90.00'
    }, 'student identity, jump, and class-teacher stats should resolve school aliases without mixing foreign students');
    assert.deepStrictEqual(snapshot.appSchoolAliasHelperPolicy, {
        available: true,
        sameSchool: true,
        resolvedStudentCount: 2,
        filteredCount: 2,
        filteredForeignCount: 0,
        aliasSchoolRank: 1,
        aliasClassRank: 1
    }, 'app school alias helpers should keep filters and comparison ranks school-scoped');
    assert.deepStrictEqual(snapshot.rankingDataServiceSchoolAliasPolicy, {
        available: true,
        aliasRowCount: 1,
        aliasFirstName: '甲一',
        aliasForeignCount: 0,
        aliasClasses: ['9.1', '9.2'],
        foundSchool: '甲校',
        lookupKeys: ['甲校别名', '甲校']
    }, 'ranking data service should resolve school aliases for rows, classes, and student lookup without mixing foreign classes');
    assert.deepStrictEqual(snapshot.teacherAnalysisCoreSchoolAliasPolicy, {
        available: true,
        localStudentCount: 2,
        localAvg: 85,
        containsForeignTeacher: false,
        townshipExcludesCanonical: true,
        townshipIncludesOther: true,
        switchedIncludesCanonical: true,
        switchedExcludesNewSchool: true,
        pairingCount: 1
    }, 'teacher analysis core should treat equivalent school aliases consistently');
    assert.ok(snapshot.score2RatePositive >= minimumSchoolCount, `score2Rate positive schools too low: ${snapshot.score2RatePositive} < ${minimumSchoolCount}`);
    assert.ok(snapshot.teacherRows >= 10, `teacher row count too low: ${snapshot.teacherRows}`);
    assert.strictEqual(snapshot.teacherPositive, snapshot.teacherRows, 'teacher rows should all contain positive calculated metrics');
    assert.ok(snapshot.countyTeacherRankRows >= minimumCountyTeacherRankRows, `county teacher rank rows too low: ${snapshot.countyTeacherRankRows} < ${minimumCountyTeacherRankRows}`);
    assert.strictEqual(snapshot.countyOwnTeacherRows, snapshot.teacherRows, 'county own teacher rows should match calculated teacher rows');
    assert.ok(snapshot.teacherTownshipAverageSubjects >= 5, `teacher township benchmarks missing: ${snapshot.teacherTownshipAverageSubjects}`);
    assert.ok(
        snapshot.teacherTownshipComparisonCells.length > 0,
        `teacher township comparison cells missing: ${JSON.stringify(snapshot.teacherTownshipRenderDebug)}`
    );
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
    assert.ok(snapshot.cohortExamCount >= 1, `cohort exam count too low: ${snapshot.cohortExamCount}`);
    if (snapshot.cohortExamCount >= 2) {
        assert.ok(snapshot.cohortGrowthRows > 0, 'cohort growth rows missing');
    }
    assert.ok(snapshot.cohortGrowthFinite, 'cohort growth calculation produced non-finite values');

    const totalIndex = snapshot.headers.indexOf('五科总分');
    assert.ok(totalIndex >= 0, '五科总分 header missing');
    assert.deepStrictEqual(snapshot.headers.slice(totalIndex + 1, totalIndex + 5), ['班排', '校排', '镇排', '县排'], 'total rank column order changed');
    assert.ok(snapshot.targetStudent, 'target student 解洪旭 missing');
    assert.strictEqual(snapshot.targetStudent.school, '银山实验学校', 'target student school changed');
    assert.ok(snapshot.targetStudent.town > 0, `target student town rank invalid: ${snapshot.targetStudent.town}`);
    assert.ok(snapshot.targetStudent.county >= snapshot.targetStudent.town, `target student county rank invalid: ${snapshot.targetStudent.county}`);

    console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
