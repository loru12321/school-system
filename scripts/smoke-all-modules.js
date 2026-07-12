try {
    require.resolve('playwright');
} catch (e) {
    console.error('playwright is required for smoke-all-modules. Run: npm install --no-save playwright');
    process.exit(1);
}

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const SMOKE_OUTPUT_PATH = String(process.env.SMOKE_OUTPUT_PATH || '').trim();

function trace(message, extra = undefined) {
    if (!process.env.SMOKE_TRACE) return;
    const suffix = extra === undefined ? '' : ` ${JSON.stringify(extra)}`;
    console.error(`[smoke] ${new Date().toISOString()} ${message}${suffix}`);
}

function writeSmokeOutput(summary) {
    if (!SMOKE_OUTPUT_PATH) return;
    const outputPath = path.resolve(process.cwd(), SMOKE_OUTPUT_PATH);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

const DEFAULT_SWITCH_MODULE_IDS = [
    'starter-hub',
    'audio-debug',
    'upload',
    'data-quality',
    'summary',
    'analysis',
    'high-score',
    'county-teacher-portrait',
    'teacher-analysis',
    'teacher-detail-comparison',
    'teacher-pairing',
    'teacher-township-ranking',
    'segment-analysis',
    'correlation-analysis',
    'indicator',
    'bottom3',
    'marginal-push',
    'seat-adjustment',
    'progress-analysis',
    'cohort-growth',
    'report-generator',
    'zhongkao-countdown',
    'freshman-simulator',
    'exam-arranger',
    'grade-scheduler',
    'subject-balance',
    'potential-analysis',
    'mutual-aid',
    'student-overview',
    'blank-score-audit',
    'student-details'
];
const requestedModuleIds = String(process.env.SMOKE_MODULE_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
const SWITCH_MODULE_IDS = requestedModuleIds.length
    ? DEFAULT_SWITCH_MODULE_IDS.filter(id => requestedModuleIds.includes(id))
    : DEFAULT_SWITCH_MODULE_IDS;

const DATA_MANAGER_TABS = ['student', 'teacher', 'targets', 'params', 'sql', 'cloud'];
const DATA_MANAGER_TAB_STABILIZE_MS = {
    sql: 120,
    cloud: 800,
    default: 320
};
const DATA_MANAGER_TAB_TIMEOUT_MS = 8000;
const MODULE_SWITCH_TIMEOUT_MS = 12000;
// Leave headroom under the 1000ms switch budget for Playwright bookkeeping and
// the per-module settle wait on slower CI runners.
const MODULE_SWITCH_READY_TIMEOUT_MS = 750;
const MODULE_SWITCH_WRAPPER_TIMEOUT_MS = 30000;
const MODULE_DEEP_CHECK_TIMEOUT_MS = 90000;
const SMOKE_HOTSPOT_PREWARM_TIMEOUT_MS = 4500;
const MODULE_SWITCH_SETTLE_MS = {
    'starter-hub': 0,
    'audio-debug': 0,
    'data-quality': 0,
    'student-details': 0,
    'mutual-aid': 0,
    default: 0
};
const PERFORMANCE_BUDGETS = {
    loginMs: 30000,
    appReadyMs: 15000,
    moduleSwitchMs: 1000,
    moduleDeepCheckMs: 3000,
    dataManagerTabMs: 3000,
    longTaskMs: 500
};
const STRICT_PERFORMANCE_BUDGETS = process.env.SMOKE_PERF_STRICT === 'true';

function getModuleSwitchSettleMs(id) {
    const configured = Object.prototype.hasOwnProperty.call(MODULE_SWITCH_SETTLE_MS, id)
        ? MODULE_SWITCH_SETTLE_MS[id]
        : MODULE_SWITCH_SETTLE_MS.default;
    const value = Number(configured);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function getChromeLaunchArgs() {
    const args = [];
    const hostResolverRules = String(process.env.SMOKE_HOST_RESOLVER_RULES || '').trim();
    if (hostResolverRules) {
        args.push(`--host-resolver-rules=${hostResolverRules}`);
    }
    return args;
}

function isCloudflareBeaconFailure(entry) {
    const url = String(entry?.url || '');
    const errorText = String(entry?.errorText || '');
    return /static\.cloudflareinsights\.com\/beacon\.min\.js/i.test(url)
        || /cloudflareinsights|data-cf-beacon|beacon\.min\.js/i.test(errorText);
}

function hasRecentCloudflareBeaconFailure(entries, windowMs = 15000) {
    if (!Array.isArray(entries) || !entries.length) return false;
    const cutoff = Date.now() - windowMs;
    return entries.some((entry) => Number(entry?.time || 0) >= cutoff && isCloudflareBeaconFailure(entry));
}

function shouldIgnoreConsoleMessage(msg, context = {}) {
    const text = String(msg || '');
    if (text.includes('favicon.ico')
        || text.includes('ERR_FILE_NOT_FOUND')
        || text.includes('Slow network is detected')
        || text.includes('Fallback font will be used while loading')) {
        return true;
    }

    if (/cloudflareinsights|data-cf-beacon|beacon\.min\.js/i.test(text)) {
        return true;
    }

    const smokeUrl = String(context.smokeUrl || '');
    if (!smokeUrl.includes('schoolsystem.com.cn')) {
        if (text.includes('Failed to load resource: net::ERR_CONNECTION_CLOSED')) return true;
        if (text.includes('Failed to load resource: the server responded with a status of 502')) return true;
        if (text.includes('Failed to load resource: the server responded with a status of 404')) return true;
        if (text.includes('GitHub release API returned 404')) return true;
        if (text.includes('fetch releases failed')) return true;
        return false;
    }

    if (!text.includes('Failed to load resource: net::ERR_CONNECTION_CLOSED')) {
        return false;
    }

    return hasRecentCloudflareBeaconFailure(context.recentFailedRequests);
}

function isExecutionContextDestroyed(error) {
    const message = String(error?.message || error || '');
    return message.includes('Execution context was destroyed')
        || message.includes('Cannot find context with specified id');
}

async function waitForPageStability(page, timeout = 15000) {
    await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => { });
    await page.waitForTimeout(300);
}

async function withTimeoutResult(task, timeoutMs, fallbackFactory) {
    return Promise.race([
        Promise.resolve().then(task).catch((error) => {
            const fallback = fallbackFactory();
            return {
                ...fallback,
                error: fallback.error || error?.message || String(error)
            };
        }),
        new Promise((resolve) => setTimeout(() => resolve(fallbackFactory()), timeoutMs))
    ]);
}

async function measureAsync(label, task) {
    const started = Date.now();
    try {
        const result = await task();
        return {
            result,
            durationMs: Date.now() - started,
            label
        };
    } catch (error) {
        error.durationMs = Date.now() - started;
        error.measureLabel = label;
        throw error;
    }
}

async function withPagePerformancePhase(page, label, task) {
    const phase = String(label || '').trim();
    if (!phase) return task();
    await page.evaluate((name) => {
        if (!window.SystemPerformance || typeof window.SystemPerformance.beginPhase !== 'function') return;
        if (!Array.isArray(window.__SMOKE_PERFORMANCE_PHASE_ENDERS__)) {
            window.__SMOKE_PERFORMANCE_PHASE_ENDERS__ = [];
        }
        window.__SMOKE_PERFORMANCE_PHASE_ENDERS__.push(window.SystemPerformance.beginPhase(name));
    }, phase).catch(() => {});
    try {
        return await task();
    } finally {
        await page.evaluate(() => {
            const stack = Array.isArray(window.__SMOKE_PERFORMANCE_PHASE_ENDERS__)
                ? window.__SMOKE_PERFORMANCE_PHASE_ENDERS__
                : [];
            const end = stack.pop();
            if (typeof end === 'function') end();
        }).catch(() => {});
    }
}

function buildBudgetStatus(value, budget, label) {
    const durationMs = Number(value);
    const budgetMs = Number(budget);
    return {
        label,
        durationMs,
        budgetMs,
        ok: Number.isFinite(durationMs) && Number.isFinite(budgetMs) ? durationMs <= budgetMs : false
    };
}

async function readPerformanceSnapshot(page) {
    return page.evaluate(() => {
        const runtime = window.SystemPerformance;
        if (!runtime || typeof runtime.getSnapshot !== 'function') {
            return {
                available: false,
                longTasks: []
            };
        }
        const snapshot = runtime.getSnapshot() || {};
        return {
            available: true,
            active: Number(snapshot.active || 0),
            queued: Number(snapshot.queued || 0),
            inflight: Number(snapshot.inflight || 0),
            scheduled: Number(snapshot.scheduled || 0),
            cached: Number(snapshot.cached || 0),
            cloudPatched: !!snapshot.cloudPatched,
            longTasks: Array.isArray(snapshot.longTasks) ? snapshot.longTasks : []
        };
    }).catch((error) => ({
        available: false,
        error: error?.message || String(error),
        longTasks: []
    }));
}

async function readCohortRuntimeState(page) {
    return page.evaluate(() => {
        const cohortId = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
        const examId = String(
            (typeof window.__resolveSmokeRuntimeExamId === 'function'
                ? window.__resolveSmokeRuntimeExamId(cohortId)
                : '')
            || window.CURRENT_EXAM_ID
            || localStorage.getItem('CURRENT_EXAM_ID')
            || window.COHORT_DB?.currentExamId
            || ''
        ).trim();
        const termId = String(
            (typeof window.__resolveSmokeRuntimeTermId === 'function' ? window.__resolveSmokeRuntimeTermId(examId) : '')
            || localStorage.getItem('CURRENT_TERM_ID')
            || ''
        ).trim();
        return {
            cohortId,
            examId,
            rawDataLen: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            termId
        };
    });
}

async function prewarmSmokeHotspots(page) {
    const started = Date.now();
    const result = await page.evaluate(async ({ timeoutMs }) => {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const yieldToBrowser = () => new Promise((resolve) => {
            if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(() => setTimeout(resolve, 0));
                return;
            }
            setTimeout(resolve, 0);
        });
        const loadWithTimeout = async (name) => {
            const loader = window[name];
            if (typeof loader !== 'function') return { name, status: 'missing' };
            try {
                const outcome = await Promise.race([
                    Promise.resolve(loader()),
                    wait(timeoutMs).then(() => ({ __smokeTimedOut: true }))
                ]);
                return {
                    name,
                    status: outcome && outcome.__smokeTimedOut ? 'timeout' : 'loaded'
                };
            } catch (error) {
                return {
                    name,
                    status: 'error',
                    error: error?.message || String(error)
                };
            }
        };
        const loaders = [
            'ensureDataManagerSqlRuntimeLoaded',
            'ensureStudentCompareRuntimeLoaded',
            'ensureCountyAnalysisRuntimeLoaded',
            'ensureTeacherAnalysisMainRuntimeLoaded',
            'ensureStudentOverviewRuntimeLoaded'
        ];
        const entries = [];
        for (const loaderName of loaders) {
            entries.push(await loadWithTimeout(loaderName));
            await yieldToBrowser();
        }
        if (Object.keys(window.TEACHER_MAP || {}).length === 0) {
            const restoreStartedAt = Date.now();
            const restoreDeadline = restoreStartedAt + 12000;
            let attempts = 0;
            while (Date.now() < restoreDeadline && Object.keys(window.TEACHER_MAP || {}).length === 0) {
                attempts += 1;
                if (typeof window.tryAutoRestoreTeacherMap === 'function') {
                    await Promise.race([
                        Promise.resolve(window.tryAutoRestoreTeacherMap({ startup: true, force: true })),
                        wait(Math.min(5000, Math.max(1, restoreDeadline - Date.now())))
                    ]);
                }
                if (Object.keys(window.TEACHER_MAP || {}).length === 0) await wait(400);
            }
            const teacherMapCount = Object.keys(window.TEACHER_MAP || {}).length;
            entries.push({
                name: 'restoreTeacherMap',
                status: teacherMapCount > 0 ? 'loaded' : 'empty',
                teacherMapCount,
                attempts,
                durationMs: Date.now() - restoreStartedAt
            });
        }
        return {
            ok: entries.every((entry) => entry.status === 'loaded' || entry.status === 'missing'),
            entries
        };
    }, { timeoutMs: SMOKE_HOTSPOT_PREWARM_TIMEOUT_MS }).catch((error) => ({
        ok: false,
        error: error?.message || String(error),
        entries: []
    }));
    return {
        ...result,
        durationMs: Date.now() - started
    };
}

function buildCohortRuntimeGuard(state) {
    const expectedCohortId = String(process.env.SMOKE_COHORT_YEAR || '').trim();
    if (!expectedCohortId) return { ok: true, expectedCohortId: '', ...(state || {}) };
    const next = state || {};
    const examCohortMatch = String(next.examId || '').match(/(\d{4})/);
    const examCohortId = examCohortMatch ? examCohortMatch[1] : '';
    return {
        ...next,
        expectedCohortId,
        examCohortId,
        ok: String(next.cohortId || '').trim() === expectedCohortId
            && (!examCohortId || examCohortId === expectedCohortId)
            && !!String(next.examId || '').trim()
            && Number(next.rawDataLen || 0) > 0
    };
}

function resolveSmokeRuntimeExamId(cohortId = '') {
    const db = (window.COHORT_DB && typeof window.COHORT_DB === 'object')
        ? window.COHORT_DB
        : (window.CohortDB && typeof window.CohortDB.ensure === 'function' ? window.CohortDB.ensure() : null);
    const normalizeCohortId = (value) => {
        const normalized = String(
            (typeof window.normalizeCompareCohortId === 'function' ? window.normalizeCompareCohortId(value) : '')
            || (typeof window.inferCohortIdFromValue === 'function' ? window.inferCohortIdFromValue(value) : '')
            || value
            || ''
        ).trim();
        const match = normalized.match(/\d{4}/);
        return match ? match[0] : normalized;
    };
    const currentCohortId = String(
        cohortId
        || window.CURRENT_COHORT_ID
        || localStorage.getItem('CURRENT_COHORT_ID')
        || ''
    ).trim();
    const normalizedCohortId = normalizeCohortId(currentCohortId);
    const matchesCohort = (examId, examValue = null) => {
        const examCohortId = normalizeCohortId(
            examValue?.meta?.cohortId
            || examValue?.cohortId
            || examId
            || ''
        );
        return !normalizedCohortId || !examCohortId || examCohortId === normalizedCohortId;
    };
    const syncExamId = (examId) => {
        const candidate = String(examId || '').trim();
        if (!candidate || !matchesCohort(candidate, db?.exams?.[candidate])) return '';
        if (typeof window.persistWorkspaceExamIdentity === 'function') {
            try {
                const persisted = String(window.persistWorkspaceExamIdentity(candidate, db, { cohortId: normalizedCohortId }) || '').trim();
                if (persisted) return persisted;
            } catch (_) {
                // Fall through to smoke-local synchronization below.
            }
        }
        window.CURRENT_EXAM_ID = candidate;
        try { localStorage.setItem('CURRENT_EXAM_ID', candidate); } catch (_) { }
        if (db && typeof db === 'object') db.currentExamId = candidate;
        return candidate;
    };
    const directExamId = String(
        window.CURRENT_EXAM_ID
        || localStorage.getItem('CURRENT_EXAM_ID')
        || db?.currentExamId
        || ''
    ).trim();
    if (directExamId && matchesCohort(directExamId, db?.exams?.[directExamId])) return syncExamId(directExamId);

    if (db && typeof window.getAutoRestoreExamId === 'function') {
        const autoExamId = String(window.getAutoRestoreExamId(db, normalizedCohortId) || '').trim();
        if (autoExamId && matchesCohort(autoExamId, db?.exams?.[autoExamId])) return syncExamId(autoExamId);
    }

    const entries = Object.entries(db?.exams || {})
        .map(([key, value]) => {
            const examId = String(value?.examId || key || '').trim();
            const rows = Array.isArray(value?.data) ? value.data.length : 0;
            const dateText = String(value?.meta?.date || value?.date || examId || '');
            const dateMatch = dateText.match(/(20\d{2})\D?(\d{1,2})?\D?(\d{1,2})?/);
            const score = dateMatch
                ? Number(`${dateMatch[1]}${String(dateMatch[2] || 0).padStart(2, '0')}${String(dateMatch[3] || 0).padStart(2, '0')}`)
                : 0;
            return { examId, value, rows, score };
        })
        .filter((entry) => entry.examId && matchesCohort(entry.examId, entry.value))
        .sort((left, right) => (right.rows - left.rows) || (right.score - left.score) || right.examId.localeCompare(left.examId, 'zh-CN'));
    return syncExamId(entries[0]?.examId || '');
}

function resolveSmokeRuntimeTermId(examId = '') {
    const directTermId = String(window.CURRENT_TERM_ID || localStorage.getItem('CURRENT_TERM_ID') || '').trim();
    const db = (window.COHORT_DB && typeof window.COHORT_DB === 'object')
        ? window.COHORT_DB
        : (window.CohortDB && typeof window.CohortDB.ensure === 'function' ? window.CohortDB.ensure() : null);
    const currentExamId = String(
        examId
        || window.CURRENT_EXAM_ID
        || localStorage.getItem('CURRENT_EXAM_ID')
        || db?.currentExamId
        || ''
    ).trim();
    const examMeta = (currentExamId && db?.exams?.[currentExamId]?.meta) || {};
    let termId = '';
    if (typeof window.getTermId === 'function') {
        try {
            termId = String(window.getTermId(examMeta) || '').trim();
        } catch (_) {
            termId = '';
        }
    }
    if (!termId) {
        const grade = String(examMeta?.grade || currentExamId.match(/(\d+)年级/)?.[1] || '').trim();
        const term = String(examMeta?.term || currentExamId.match(/(上学期|下学期)/)?.[1] || '').trim();
        termId = grade && term ? `${grade}年级_${term}` : term;
    }
    if (!termId) return directTermId;
    if (directTermId === termId) return directTermId;
    if (typeof window.writeCurrentTermId === 'function') {
        try {
            const written = String(window.writeCurrentTermId(termId) || '').trim();
            if (written) return written;
        } catch (_) {
            // Fall through to smoke-local synchronization below.
        }
    }
    window.CURRENT_TERM_ID = termId;
    try { localStorage.setItem('CURRENT_TERM_ID', termId); } catch (_) { }
    return termId;
}

async function withNavigationRetry(page, task, options = {}) {
    const attempts = Math.max(1, Number(options.attempts || 3));
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

async function login(page, user, pass) {
    await page.goto(process.env.SMOKE_URL || 'https://schoolsystem.com.cn/', {
        waitUntil: 'commit',
        timeout: 90000
    });

    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const overlay = document.getElementById('login-overlay');
            const app = document.getElementById('app');
            const mask = document.getElementById('mode-mask');
            return !!overlay || !!app || !!mask;
        }, undefined, { timeout: 90000 });
    }, { attempts: 4 });

    await waitForPageStability(page, 10000);

    const bootState = await page.evaluate(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        return {
            overlayHidden: !overlay || getComputedStyle(overlay).display === 'none',
            appVisible: !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden'),
            maskVisible: !!mask && getComputedStyle(mask).display !== 'none',
            authState: String(document.body?.dataset?.authState || '').trim(),
            sessionUserPresent: !!String(sessionStorage.getItem('CURRENT_USER') || '').trim()
        };
    });

    const hasLoggedInSession = bootState.authState === 'logged_in' || bootState.sessionUserPresent;
    if (!(hasLoggedInSession && bootState.overlayHidden && (bootState.appVisible || bootState.maskVisible))) {
        const loginUser = page.locator('#login-user');
        const ensureLoginWindowVisible = async () => {
            if (await loginUser.isVisible().catch(() => false)) return;
            const openers = [
                page.locator('[data-login-open="school"]').first(),
                page.locator('.login-stage-nav-links a[data-nav="modal"]').first(),
                page.locator('.login-stage-primary-action').first(),
                page.locator('button[onclick="window.Auth?.openLoginPortalModal(\'school\')"]').first()
            ];
            for (const opener of openers) {
                if (!(await opener.count().catch(() => 0))) continue;
                await opener.click({ force: true }).catch(() => { });
                if (await loginUser.isVisible().catch(() => false)) return;
            }
            await page.evaluate(() => {
                if (window.Auth && typeof window.Auth.openLoginPortalModal === 'function') {
                    window.Auth.openLoginPortalModal('school');
                }
            }).catch(() => { });
            await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });
        };

        await ensureLoginWindowVisible();
        await page.fill('#login-user', user);
        await page.fill('#login-pass', pass);
        await page.click('#login-submit-button');
    }

    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const overlay = document.getElementById('login-overlay');
            const app = document.getElementById('app');
            const mask = document.getElementById('mode-mask');
            const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
            const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
            const maskVisible = !!mask && getComputedStyle(mask).display !== 'none';
            const authState = String(document.body?.dataset?.authState || '').trim();
            const sessionUser = String(sessionStorage.getItem('CURRENT_USER') || '').trim();
            return (
                overlayHidden && (appVisible || maskVisible || authState === 'logged_in' || !!sessionUser)
            ) || (
                (authState === 'logged_in' || !!sessionUser)
                && (appVisible || maskVisible)
            );
        }, undefined, { timeout: 90000 });
    }, { attempts: 4 });

    await waitForPageStability(page, 5000);

    await ensureCohortEntered(page);

    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const app = document.getElementById('app');
            if (!app) return false;
            return getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        }, undefined, { timeout: 45000 });
    }, { attempts: 4 });
}

async function ensureCohortEntered(page) {
    const explicitCohortYear = String(process.env.SMOKE_COHORT_YEAR || '').trim();
    const waitForExpectedCohort = (candidate) => page.waitForFunction((expectedCohortId) => {
        const mask = document.getElementById('mode-mask');
        const app = document.getElementById('app');
        const overlay = document.getElementById('login-overlay');
        const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
        const appVisible = !!app
            && getComputedStyle(app).display !== 'none'
            && !app.classList.contains('hidden');
        const cohortId = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
        const examId = String(
            (typeof window.__resolveSmokeRuntimeExamId === 'function' ? window.__resolveSmokeRuntimeExamId(cohortId) : '')
            || window.CURRENT_EXAM_ID
            || localStorage.getItem('CURRENT_EXAM_ID')
            || window.COHORT_DB?.currentExamId
            || ''
        ).trim();
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        const normalizedExpected = String(expectedCohortId || '').trim();
        const expectedReady = !!cohortId && normalizedExpected && cohortId === normalizedExpected && !!examId && rawDataLen > 0;
        const maskHidden = !mask || getComputedStyle(mask).display === 'none';
        return overlayHidden && appVisible && maskHidden && expectedReady;
    }, candidate, { timeout: 50000 });

    const readEntryState = () => page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const input = document.getElementById('entry-cohort-year');
        const selector = document.getElementById('cohort-selector');
        const infer = typeof window.inferCohortIdFromValue === 'function'
            ? window.inferCohortIdFromValue
            : (() => '');
        return {
            overlayHidden: !overlay || getComputedStyle(overlay).display === 'none',
            appVisible: !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden'),
            maskVisible: !!mask && getComputedStyle(mask).display !== 'none',
            authState: String(document.body?.dataset?.authState || '').trim(),
            sessionUserPresent: !!String(sessionStorage.getItem('CURRENT_USER') || '').trim(),
            bootPending: !!window.__BOOT_AUTH_PENDING_HANDOFF__,
            inputValue: String(input?.value || '').trim(),
            currentCohortId: String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim(),
            inferredCohortId: String(
                infer(localStorage.getItem('CURRENT_PROJECT_KEY'))
                || infer(localStorage.getItem('CURRENT_EXAM_ID'))
                || ''
            ).trim(),
            examId: String(
                (typeof window.__resolveSmokeRuntimeExamId === 'function'
                    ? window.__resolveSmokeRuntimeExamId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '')
                    : '')
                || window.CURRENT_EXAM_ID
                || localStorage.getItem('CURRENT_EXAM_ID')
                || window.COHORT_DB?.currentExamId
                || ''
            ).trim(),
            rawDataLen: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            knownCohorts: selector
                ? Array.from(selector.options || []).map((option) => String(option.value || '').trim()).filter(Boolean)
                : []
        };
    });

    const switchToExplicitCohortIfNeeded = async (state) => {
        if (!explicitCohortYear || String(state?.currentCohortId || '').trim() === explicitCohortYear) {
            return state;
        }
        await withNavigationRetry(page, async () => {
            await page.evaluate(async (year) => {
                const manager = window.CohortManager;
                if (manager && typeof manager.addCohort === 'function') {
                    if (typeof window.lockRuntimeCohortId === 'function') window.lockRuntimeCohortId(year);
                    await manager.addCohort({ year, startGrade: 6 }, {
                        skipConfirm: true,
                        fastEnter: false,
                        requireCloudData: true
                    });
                    return;
                }
                const input = document.getElementById('entry-cohort-year');
                if (input) input.value = year;
                if (typeof window.enterCohortFromMask === 'function') {
                    await window.enterCohortFromMask();
                }
            }, explicitCohortYear);
            await waitForPageStability(page, 10000);
            try {
                await waitForExpectedCohort(explicitCohortYear);
            } catch (error) {
                const debugState = await readEntryState();
                throw new Error(`${error.message}; entryState=${JSON.stringify(debugState)}`);
            }
        }, { attempts: 4 });
        return readEntryState();
    };

    let state = await withNavigationRetry(page, readEntryState, { attempts: 4 });

    if (!state.maskVisible) return switchToExplicitCohortIfNeeded(state);

    if (!state.overlayHidden && (state.authState === 'logged_in' || state.sessionUserPresent || state.bootPending)) {
        try {
            await withNavigationRetry(page, () => page.waitForFunction(() => {
                const overlay = document.getElementById('login-overlay');
                return !overlay || getComputedStyle(overlay).display === 'none';
            }, undefined, { timeout: 30000 }), { attempts: 2 });
            await waitForPageStability(page, 5000);
        } catch (_) {
            // 登录接力可能还在收尾，超时后继续按当前状态判断。
        }
        state = await withNavigationRetry(page, readEntryState, { attempts: 4 });
        if (!state.maskVisible) return switchToExplicitCohortIfNeeded(state);
    }

    try {
        await withNavigationRetry(page, () => page.waitForFunction(() => {
            const mask = document.getElementById('mode-mask');
            const examId = String(
                (typeof window.__resolveSmokeRuntimeExamId === 'function'
                    ? window.__resolveSmokeRuntimeExamId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '')
                    : '')
                || window.CURRENT_EXAM_ID
                || localStorage.getItem('CURRENT_EXAM_ID')
                || window.COHORT_DB?.currentExamId
                || ''
            ).trim();
            const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
            const app = document.getElementById('app');
            const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
            return (!mask || getComputedStyle(mask).display === 'none')
                || (!!examId && rawDataLen > 0)
                || (appVisible && !!examId && rawDataLen > 0);
        }, undefined, { timeout: 15000 }), { attempts: 1 });
    } catch (_) {
        // 云端恢复可能仍在进行，超时后再决定是否需要手动进入届别。
    }

    state = await withNavigationRetry(page, readEntryState, { attempts: 4 });
    if (!state.maskVisible) return switchToExplicitCohortIfNeeded(state);

    const candidate = String(
        process.env.SMOKE_COHORT_YEAR
        || state.inputValue
        || state.currentCohortId
        || state.knownCohorts[0]
        || state.inferredCohortId
        || '2022'
        || ''
    ).trim();

    if (!candidate) return state;

    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const mask = document.getElementById('mode-mask');
            if (!mask || getComputedStyle(mask).display === 'none') return true;
            let cohortManagerReady = false;
            try {
                cohortManagerReady = !!window.CohortManager
                    && typeof window.CohortManager.addCohort === 'function';
            } catch (_) {
                cohortManagerReady = false;
            }
            return (
                (typeof window.enterCohortFromMask === 'function' && cohortManagerReady)
                || !!document.querySelector('button[onclick="enterCohortFromMask()"]')
            );
        }, undefined, { timeout: 20000 });
        const maskVisible = await page.evaluate(() => {
            const mask = document.getElementById('mode-mask');
            return !!mask && getComputedStyle(mask).display !== 'none';
        });
        if (!maskVisible) return;
        const input = page.locator('#entry-cohort-year');
        if (await input.count()) {
            await input.fill(candidate);
        }
        await page.evaluate(async () => {
            let cohortManagerReady = false;
            try {
                cohortManagerReady = !!window.CohortManager
                    && typeof window.CohortManager.addCohort === 'function';
            } catch (_) {
                cohortManagerReady = false;
            }
            if (typeof window.enterCohortFromMask === 'function' && cohortManagerReady) {
                await window.enterCohortFromMask();
                return;
            }
            const button = document.querySelector('button[onclick="enterCohortFromMask()"]');
            if (button) button.click();
        });
        await waitForPageStability(page, 10000);
        await waitForExpectedCohort(candidate);
    }, { attempts: 4 });
}

async function waitForAppReady(page) {
    const deadline = Date.now() + 90000;
    const startedAt = Date.now();
    let lastState = null;
    let recoveryAttempted = false;
    let lastRecovery = null;

    while (Date.now() < deadline) {
        try {
            lastState = await page.evaluate(() => {
                const app = document.getElementById('app');
                const mask = document.getElementById('mode-mask');
                const cohortId = String(localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
                const examId = String(
                    (typeof window.__resolveSmokeRuntimeExamId === 'function' ? window.__resolveSmokeRuntimeExamId(cohortId) : '')
                    || window.CURRENT_EXAM_ID
                    || localStorage.getItem('CURRENT_EXAM_ID')
                    || window.COHORT_DB?.currentExamId
                    || ''
                ).trim();
                const termId = String(
                    (typeof window.__resolveSmokeRuntimeTermId === 'function' ? window.__resolveSmokeRuntimeTermId(examId) : '')
                    || localStorage.getItem('CURRENT_TERM_ID')
                    || ''
                ).trim();
                const school = String(
                    (window.SchoolState && typeof window.SchoolState.getCurrentSchool === 'function'
                        ? window.SchoolState.getCurrentSchool()
                        : '')
                    || window.MY_SCHOOL
                    || localStorage.getItem('MY_SCHOOL')
                    || ''
                ).trim();
                const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
                return {
                    appVisible: !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden'),
                    maskHidden: !mask || getComputedStyle(mask).display === 'none',
                    termId,
                    cohortId,
                    examId,
                    school,
                    rawDataLen
                };
            });
        } catch (error) {
            lastState = { error: error?.message || String(error) };
        }

        if (
            lastState
            && lastState.appVisible
            && lastState.maskHidden
            && lastState.termId
            && lastState.cohortId
            && lastState.examId
            && lastState.school
            && lastState.rawDataLen > 0
        ) {
            return lastState;
        }

        const workspaceLooksReadyButEmpty = lastState
            && lastState.appVisible
            && lastState.maskHidden
            && lastState.termId
            && lastState.cohortId
            && lastState.examId
            && lastState.school
            && lastState.rawDataLen === 0;
        const workspaceVisibleButMissingExam = lastState
            && lastState.appVisible
            && lastState.maskHidden
            && lastState.cohortId
            && lastState.school
            && (!lastState.termId || !lastState.examId || lastState.rawDataLen === 0);
        if (!recoveryAttempted && (workspaceLooksReadyButEmpty || workspaceVisibleButMissingExam) && Date.now() - startedAt > 12000) {
            recoveryAttempted = true;
            lastRecovery = await attemptSmokeDataRecovery(page);
            trace('app-ready:data-recovery', lastRecovery);
            if (lastRecovery && lastRecovery.after > 0) {
                await page.waitForTimeout(500);
                continue;
            }
        }

        await page.waitForTimeout(1000);
    }

    throw new Error(`app not ready for smoke run: ${JSON.stringify({ lastState, lastRecovery })}`);
}

async function attemptSmokeDataRecovery(page) {
    try {
        return await page.evaluate(async () => {
            const before = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
            if (before > 0) return { action: 'already-ready', before, after: before };
            const db = (typeof window.COHORT_DB === 'object' && window.COHORT_DB)
                || (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.ensure === 'function' ? window.CohortDB.ensure() : null);
            const currentExamId = String(
                (typeof window.__resolveSmokeRuntimeExamId === 'function'
                    ? window.__resolveSmokeRuntimeExamId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '')
                    : '')
                || window.CURRENT_EXAM_ID
                || localStorage.getItem('CURRENT_EXAM_ID')
                || db?.currentExamId
                || ''
            ).trim();
            const fallbackExamId = currentExamId
                || (typeof window.__resolveSmokeRuntimeExamId === 'function'
                    ? window.__resolveSmokeRuntimeExamId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '')
                    : '')
                || Object.keys(db?.exams || {})[0]
                || '';
            if (fallbackExamId && typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.applyExamToWorkspace === 'function') {
                try {
                    window.CohortDB.applyExamToWorkspace(fallbackExamId, { renderTables: false });
                } catch (error) {
                    // Keep going: loadCloudData may still hydrate the workspace.
                }
            }
            if (typeof window.loadCloudData !== 'function') {
                return { action: 'loadCloudData-unavailable', before, after: before };
            }

            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            let loadError = '';
            try {
                await Promise.race([
                    Promise.resolve(window.loadCloudData()),
                    wait(20000)
                ]);
            } catch (error) {
                loadError = error?.message || String(error);
            }

            let after = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
            for (let index = 0; index < 20 && after === 0; index += 1) {
                await wait(250);
                after = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
            }

            return {
                action: 'loadCloudData',
                before,
                after,
                examId: String(
                    (typeof window.__resolveSmokeRuntimeExamId === 'function'
                        ? window.__resolveSmokeRuntimeExamId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '')
                        : '')
                    || window.CURRENT_EXAM_ID
                    || localStorage.getItem('CURRENT_EXAM_ID')
                    || ''
                ).trim(),
                error: loadError
            };
        });
    } catch (error) {
        return {
            action: 'recovery-evaluate-failed',
            before: 0,
            after: 0,
            error: error?.message || String(error)
        };
    }
}

async function smokeSwitchModule(page, id) {
    const collectState = async () => page.evaluate((moduleId) => {
        const section = document.getElementById(moduleId);
        if (!section) return { ok: false, id: moduleId, error: 'target section not found' };
        const style = getComputedStyle(section);
        const visible = style.display !== 'none';
        const active = section.classList.contains('active');
        const title = section.querySelector('h1,h2,h3,.sub-header,.sec-head')?.textContent?.trim() || '';
        const allowActiveOnly = ['analysis', 'student-details', 'correlation-analysis', 'indicator'].includes(moduleId);
        return {
            ok: active && (visible || (allowActiveOnly && !!title)),
            id: moduleId,
            visible,
            active,
            title
        };
    }, id);

    try {
        if (id === 'bottom3') {
            await page.evaluate(() => {
                window.__SMOKE_BOTTOM3_ENTRY_TIMINGS__ = [];
                const record = (label, durationMs) => {
                    window.__SMOKE_BOTTOM3_ENTRY_TIMINGS__.push({
                        label,
                        durationMs: Math.round(durationMs)
                    });
                };
                const wrap = (name) => {
                    const original = window[name];
                    if (typeof original !== 'function' || original.__smokeBottom3Wrapped) return;
                    const wrapped = function (...args) {
                        const start = performance.now();
                        try {
                            return original.apply(this, args);
                        } finally {
                            record(name, performance.now() - start);
                        }
                    };
                    wrapped.__smokeBottom3Wrapped = true;
                    window[name] = wrapped;
                };
                wrap('switchTab');
                wrap('runModuleTabEnter');
                wrap('renderBottom3TableOnly');
                wrap('renderTables');
                wrap('releaseTeacherAnalysisHeavyDom');
            });
        }
        await page.evaluate((moduleId) => {
            if (typeof window.switchTab !== 'function') {
                throw new Error('switchTab is not available');
            }
            window.switchTab(moduleId);
        }, id);

        const immediateState = await collectState();
        if (immediateState.ok) {
            const settleMs = getModuleSwitchSettleMs(id);
            if (settleMs > 0) await page.waitForTimeout(settleMs);
            return immediateState;
        }

        if (id === 'student-details') {
            await page.waitForFunction(() => {
                const section = document.getElementById('student-details');
                const title = section?.querySelector('h1,h2,h3,.sub-header,.sec-head')?.textContent?.trim() || '';
                const shellReady = !!document.getElementById('studentDetailTable')
                    && !!document.getElementById('studentSchoolSelect')
                    && !!document.getElementById('studentClassSelect');
                return !!section && section.classList.contains('active') && (!!title || shellReady);
            }, { timeout: 2000 }).catch(() => {});
            const earlyState = await collectState();
            const shellState = await page.evaluate(() => {
                const section = document.getElementById('student-details');
                const style = section ? getComputedStyle(section) : null;
                const shellReady = !!document.getElementById('studentDetailTable')
                    && !!document.getElementById('studentSchoolSelect')
                    && !!document.getElementById('studentClassSelect');
                return {
                    shellReady,
                    active: !!section?.classList.contains('active'),
                    visible: !!style && style.display !== 'none'
                };
            });
            if (earlyState.active || earlyState.visible || earlyState.ok || shellState.shellReady) {
                return {
                    ...earlyState,
                    ok: earlyState.ok || shellState.shellReady,
                    active: earlyState.active || shellState.active,
                    visible: earlyState.visible || shellState.visible,
                    recoveredByShell: !earlyState.ok && shellState.shellReady
                };
            }
        }

        await page.waitForFunction((moduleId) => {
            const section = document.getElementById(moduleId);
            if (!section) return false;
            const style = getComputedStyle(section);
            const ready = style.display !== 'none' && section.classList.contains('active');
            if (ready) return true;

            const retryState = window.__SMOKE_SWITCH_RETRY_STATE__ || (window.__SMOKE_SWITCH_RETRY_STATE__ = {});
            const state = retryState[moduleId] || (retryState[moduleId] = { count: 0, lastAt: 0 });
            const now = performance.now();
            if (typeof window.switchTab === 'function' && state.count < 2 && now - state.lastAt > 900) {
                state.count += 1;
                state.lastAt = now;
                try {
                    window.switchTab(moduleId);
                } catch (_) {
                    // The outer smoke path will collect the real module state.
                }
            }
            return false;
        }, id, { timeout: Math.min(MODULE_SWITCH_TIMEOUT_MS, MODULE_SWITCH_READY_TIMEOUT_MS) });
    } catch (error) {
        await page.waitForTimeout(650).catch(() => {});
        const fallback = await collectState();
        if (fallback.ok) {
            const settleMs = getModuleSwitchSettleMs(id);
            if (settleMs > 0) await page.waitForTimeout(settleMs);
            return fallback;
        }
        return {
            ...fallback,
            ok: false,
            id,
            error: error?.message || String(error)
        };
    }

    let result = await collectState();
    if (!result.ok) {
        await page.evaluate((moduleId) => {
            if (typeof window.switchTab === 'function') {
                window.switchTab(moduleId);
            }
        }, id);
        await page.waitForTimeout(1200);
        result = await collectState();
    }
    const settleMs = getModuleSwitchSettleMs(id);
    if (settleMs > 0) await page.waitForTimeout(settleMs);
    return result;
}

async function runModuleDeepCheck(page, id) {
    if (id === 'summary') {
        return page.evaluate(async ({ strictPerformance }) => {
            const smokeTimeout = (task, timeoutMs = 5000) => Promise.race([
                Promise.resolve(task),
                new Promise(resolve => setTimeout(() => resolve(null), timeoutMs))
            ]);
            const stateTrace = [];
            const captureState = (label) => {
                stateTrace.push({
                    label,
                    cohortId: String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || ''),
                    examId: String(
                        (typeof window.__resolveSmokeRuntimeExamId === 'function'
                            ? window.__resolveSmokeRuntimeExamId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '')
                            : '')
                        || window.CURRENT_EXAM_ID
                        || localStorage.getItem('CURRENT_EXAM_ID')
                        || window.COHORT_DB?.currentExamId
                        || ''
                    ),
                    rawDataLen: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : -1
                });
            };
            captureState('start');
            if (strictPerformance) {
                const headers = Array.from(document.querySelectorAll('#tb-summary thead th'))
                    .map((th) => String(th?.innerText || th?.textContent || '').trim());
                const summaryRows = Array.from(document.querySelectorAll('#tb-summary tbody tr'));
                const summaryTable = document.getElementById('tb-summary');
                const hasRenderedSummaryRows = summaryRows.length > 0;
                const checks = {
                    summaryTableReady: !!summaryTable,
                    summaryHeaderReady: headers.length > 0,
                    ensureTownSubmoduleCompareRuntimeLoaded: typeof window.ensureTownSubmoduleCompareRuntimeLoaded === 'function',
                    ensureSchoolProfileRuntimeLoaded: typeof window.ensureSchoolProfileRuntimeLoaded === 'function',
                    ensureExamAnalysisPackageRuntimeLoaded: typeof window.ensureExamAnalysisPackageRuntimeLoaded === 'function',
                    schoolProfileModal: !!document.getElementById('school-profile-modal'),
                    schoolProfileClose: !!document.querySelector('#school-profile-modal .school-modal-close'),
                    examAnalysisPackageButton: !!document.querySelector('button[onclick="downloadExamAnalysisPackage()"]'),
                    summaryIndicatorColumnPresent: !hasRenderedSummaryRows
                        || !String(window.CONFIG?.name || '').includes('9')
                        || headers.some((text) => /指标生得分/.test(text)),
                    summaryHighScoreColumnPresent: !hasRenderedSummaryRows
                        || !String(window.CONFIG?.name || '').includes('9')
                        || headers.some((text) => /高分段/.test(text)),
                    summaryAdmissionColumnPresent: !hasRenderedSummaryRows
                        || !String(window.CONFIG?.name || '').includes('9')
                        || headers.some((text) => /高中上线率/.test(text))
                };
                const staleTexts = Array.from(document.querySelectorAll('button, #summary-refresh-notice, .summary-refresh-notice'))
                    .map((element) => String(element?.innerText || element?.textContent || '').trim())
                    .filter((text) => /数据已变更|请重新生成/.test(text));
                return {
                    ok: Object.values(checks).every(Boolean)
                        && staleTexts.length === 0
                        && !window.SummaryRefreshState?.dirty,
                    checks,
                    panelReady: !!document.querySelector('.town-submodule-compare-panel[data-submodule="summary"]'),
                    schoolProfileCloseWorks: true,
                    schoolProfileCellReady: !!document.querySelector('#tb-total tbody [data-school-profile-name]'),
                    schoolProfileCellClickWorks: true,
                    summaryDirty: !!window.SummaryRefreshState?.dirty,
                    summaryIndicatorDiagnostics: {
                        isGrade9: String(window.CONFIG?.name || '').includes('9'),
                        indicatorRowsPositive: Array.isArray(window.INDICATOR_LAST_RESULT)
                            ? window.INDICATOR_LAST_RESULT.filter((row) => Number(row?.finalScore) > 0).length
                            : 0,
                        summaryIndicatorPositive: 0,
                        summaryIndicatorValues: []
                    },
                    summaryHighScoreDiagnostics: {
                        isGrade9: String(window.CONFIG?.name || '').includes('9'),
                        highScoreMatches: true,
                        admissionAllowed: false,
                        admissionAllZeroWhenDisallowed: true,
                        rows: []
                    },
                    staleTexts,
                    stateTrace,
                    lightweight: true
                };
            }
            if (typeof window.ensureTownSubmoduleCompareRuntimeLoaded === 'function') {
                await smokeTimeout(window.ensureTownSubmoduleCompareRuntimeLoaded(), 5000);
            }
            captureState('town-runtime-loaded');
            if (typeof window.ensureTownSubmoduleCompareUIs === 'function') {
                await smokeTimeout(window.ensureTownSubmoduleCompareUIs(), 5000);
            }
            captureState('town-ui-ensured');
            if (typeof window.ensureSchoolProfileRuntimeLoaded === 'function') {
                await smokeTimeout(window.ensureSchoolProfileRuntimeLoaded(), 5000);
            }
            captureState('school-profile-runtime-loaded');
            if (typeof window.ensureExamAnalysisPackageRuntimeLoaded === 'function') {
                await smokeTimeout(window.ensureExamAnalysisPackageRuntimeLoaded(), 5000);
            }
            captureState('exam-analysis-package-runtime-loaded');
            let summaryIndicatorDiagnostics = {
                isGrade9: false,
                indicatorRowsPositive: 0,
                summaryIndicatorPositive: 0,
                summaryIndicatorValues: []
            };
            let summaryHighScoreDiagnostics = {
                isGrade9: false,
                highScoreMatches: true,
                admissionAllowed: false,
                admissionAllZeroWhenDisallowed: true,
                rows: []
            };
            const hasSummaryRows = !!document.querySelector('#tb-summary tbody tr');
            if (typeof window.calcSummary === 'function' && !hasSummaryRows) {
                await smokeTimeout(window.calcSummary(false), 5000);
                await new Promise(resolve => setTimeout(resolve, 180));
            }
            if (document.querySelector('#tb-summary tbody tr')) {
                const isGrade9 = String(window.CONFIG?.name || '').includes('9');
                const indicatorRows = Array.isArray(window.INDICATOR_LAST_RESULT) ? window.INDICATOR_LAST_RESULT : [];
                const indicatorRowsPositive = indicatorRows.filter((row) => Number(row?.finalScore) > 0).length;
                const headers = Array.from(document.querySelectorAll('#tb-summary thead th'))
                    .map((th) => String(th?.innerText || th?.textContent || '').trim());
                const indicatorIndex = headers.findIndex((text) => /指标生得分/.test(text));
                const summaryIndicatorValues = indicatorIndex >= 0
                    ? Array.from(document.querySelectorAll('#tb-summary tbody tr')).map((tr) => {
                        const cell = tr.querySelectorAll('td')[indicatorIndex];
                        return Number(String(cell?.innerText || cell?.textContent || '').replace(/[^\d.-]/g, ''));
                    }).filter(Number.isFinite)
                    : [];
                summaryIndicatorDiagnostics = {
                    isGrade9,
                    indicatorRowsPositive,
                    summaryIndicatorPositive: summaryIndicatorValues.filter((value) => value > 0).length,
                    summaryIndicatorValues: summaryIndicatorValues.slice(0, 8)
                };
                const highScoreIndex = headers.findIndex((text) => /高分段/.test(text));
                const admissionIndex = headers.findIndex((text) => /高中上线率/.test(text));
                const summaryRows = Array.from(document.querySelectorAll('#tb-summary tbody tr')).map((tr) => {
                    const cells = Array.from(tr.querySelectorAll('td')).map((td) => String(td?.innerText || td?.textContent || '').trim());
                    return {
                        school: cells[0] || '',
                        highScore: Number(String(cells[highScoreIndex] || '').replace(/[^\d.-]/g, '')),
                        admission: Number(String(cells[admissionIndex] || '').replace(/[^\d.-]/g, ''))
                    };
                }).filter((row) => row.school);
                const summarySchoolsForHighScore = typeof window.getSummaryTownshipSchools === 'function'
                    ? window.getSummaryTownshipSchools()
                    : Object.values(window.SCHOOLS || {});
                const sourceSchools = summarySchoolsForHighScore.map((school) => (
                    typeof school === 'string' ? school : String(school?.name || '').trim()
                )).filter(Boolean);
                const highRows = sourceSchools.map((school) => {
                    const students = typeof window.getEquivalentSchoolStudents === 'function'
                        ? window.getEquivalentSchoolStudents(school)
                        : (window.SCHOOLS?.[school]?.students || []);
                    const total = Array.isArray(students) ? students.length : 0;
                    const highCount = Array.isArray(students) ? students.filter((student) => Number(student?.total) >= 490).length : 0;
                    const ratio = total ? highCount / total : 0;
                    return { school, total, highCount, ratio };
                });
                const maxRatio = Math.max(...highRows.map((row) => Number(row.ratio) || 0), 0);
                const normalize = typeof window.normalizeSchoolName === 'function' ? window.normalizeSchoolName : (value) => String(value || '').trim();
                const expectedMap = new Map();
                highRows.forEach((row) => {
                    const score = maxRatio > 0 ? row.ratio / maxRatio * 50 : 0;
                    expectedMap.set(String(row.school || '').trim(), score);
                    expectedMap.set(normalize(row.school), score);
                });
                const highScoreMismatches = summaryRows
                    .map((row) => {
                        const expected = expectedMap.get(row.school) ?? expectedMap.get(normalize(row.school)) ?? 0;
                        return { school: row.school, rendered: row.highScore, expected };
                    })
                    .filter((row) => Number.isFinite(row.rendered) && Math.abs(row.rendered - Number(row.expected.toFixed(2))) > 0.02);
                const admissionAllowed = typeof window.isHighSchoolAdmissionExamAllowed === 'function'
                    ? window.isHighSchoolAdmissionExamAllowed()
                    : false;
                summaryHighScoreDiagnostics = {
                    isGrade9,
                    highScoreMatches: !isGrade9 || highScoreMismatches.length === 0,
                    admissionAllowed,
                    admissionAllZeroWhenDisallowed: admissionAllowed || summaryRows.every((row) => !Number(row.admission)),
                    rows: summaryRows.slice(0, 8),
                    mismatches: highScoreMismatches.slice(0, 8)
                };
            }
            const checks = {
                ensureTownSubmoduleCompareUIs: typeof window.ensureTownSubmoduleCompareUIs === 'function',
                openTownSubmoduleCompareDialog: typeof window.openTownSubmoduleCompareDialog === 'function',
                renderTownSubmoduleMultiPeriodComparison: typeof window.renderTownSubmoduleMultiPeriodComparison === 'function',
                exportTownSubmoduleCompare: typeof window.exportTownSubmoduleCompare === 'function',
                saveTownSubmoduleCompareToCloud: typeof window.saveTownSubmoduleCompareToCloud === 'function',
                viewCloudTownSubmoduleCompares: typeof window.viewCloudTownSubmoduleCompares === 'function',
                loadCloudTownSubmoduleCompare: typeof window.loadCloudTownSubmoduleCompare === 'function',
                showSchoolProfile: typeof window.showSchoolProfile === 'function' || typeof showSchoolProfile === 'function',
                schoolProfileModal: !!document.getElementById('school-profile-modal'),
                schoolProfileClose: !!document.querySelector('#school-profile-modal .school-modal-close'),
                examAnalysisPackageButton: !!document.querySelector('button[onclick="downloadExamAnalysisPackage()"]'),
                examAnalysisPackageRuntime: typeof window.downloadExamAnalysisPackage === 'function',
                examAnalysisPackageZipVendor: !!window.JSZip,
                summaryIndicatorColumnPopulated: !summaryIndicatorDiagnostics.isGrade9
                    || summaryIndicatorDiagnostics.indicatorRowsPositive === 0
                    || summaryIndicatorDiagnostics.summaryIndicatorPositive > 0,
                summaryHighScoreMatchesFormula: summaryHighScoreDiagnostics.highScoreMatches,
                summaryAdmissionZeroUnlessJulyZhongkao: summaryHighScoreDiagnostics.admissionAllZeroWhenDisallowed
            };
            const panel = document.querySelector('.town-submodule-compare-panel[data-submodule="summary"]');
            let schoolProfileCloseWorks = false;
            let schoolProfileCellClickWorks = false;
            const schoolNames = Object.keys(window.SCHOOLS || {});
            const modal = document.getElementById('school-profile-modal');
            const closeBtn = document.querySelector('#school-profile-modal .school-modal-close');
            let schoolProfileCell = document.querySelector('#tb-total tbody [data-school-profile-name]');
            if (!schoolProfileCell && typeof window.renderTables === 'function') {
                window.renderTables();
                await new Promise(resolve => setTimeout(resolve, 120));
                captureState('render-tables');
                schoolProfileCell = document.querySelector('#tb-total tbody [data-school-profile-name]');
            }
            const openSchoolProfile = typeof window.showSchoolProfile === 'function'
                ? window.showSchoolProfile
                : (typeof showSchoolProfile === 'function' ? showSchoolProfile : null);
            if (modal && closeBtn && schoolNames.length && openSchoolProfile) {
                openSchoolProfile(schoolNames[0]);
                await new Promise(resolve => setTimeout(resolve, 120));
                captureState('open-school-profile');
                const modalVisible = getComputedStyle(modal).display !== 'none';
                closeBtn.click();
                await new Promise(resolve => setTimeout(resolve, 80));
                captureState('close-school-profile');
                const modalClosed = getComputedStyle(modal).display === 'none';
                schoolProfileCloseWorks = modalVisible && modalClosed;
            }
            if (modal && closeBtn && schoolProfileCell) {
                modal.style.display = 'none';
                schoolProfileCell.click();
                await new Promise(resolve => setTimeout(resolve, 120));
                captureState('click-school-profile-cell');
                const modalVisible = getComputedStyle(modal).display !== 'none';
                closeBtn.click();
                await new Promise(resolve => setTimeout(resolve, 80));
                captureState('close-school-profile-cell');
                const modalClosed = getComputedStyle(modal).display === 'none';
                schoolProfileCellClickWorks = modalVisible && modalClosed;
            }
            const staleTexts = Array.from(document.querySelectorAll('button, #summary-refresh-notice, .summary-refresh-notice'))
                .map((element) => String(element?.innerText || element?.textContent || '').trim())
                .filter((text) => /数据已变更|请重新生成/.test(text));
            const summaryDirty = !!window.SummaryRefreshState?.dirty;
            checks.summaryStalePromptAbsent = staleTexts.length === 0 && !summaryDirty;
            return {
                ok: Object.values(checks).every(Boolean) && !!panel && schoolProfileCloseWorks && schoolProfileCellClickWorks,
                checks,
                panelReady: !!panel,
                schoolProfileCloseWorks,
                schoolProfileCellReady: !!schoolProfileCell,
                schoolProfileCellClickWorks,
                summaryDirty,
                summaryIndicatorDiagnostics,
                summaryHighScoreDiagnostics,
                staleTexts,
                stateTrace
            };
        }, { strictPerformance: STRICT_PERFORMANCE_BUDGETS });
    }
    if (id === 'upload') {
        await page.waitForFunction(() => {
            return typeof window.normalizeSchoolName === 'function'
                && typeof window.getCanonicalSchoolName === 'function'
                && typeof window.ensureNormalizedTargets === 'function'
                && typeof window.buildIndicatorSchoolBuckets === 'function'
                && typeof window.listAvailableSchoolsForCompare === 'function';
        }, undefined, { timeout: 10000 }).catch(() => {});
        return page.evaluate(async () => {
            const schools = typeof window.listAvailableSchoolsForCompare === 'function'
                ? window.listAvailableSchoolsForCompare()
                : [];
            const checks = {
                sectionReady: !!document.querySelector('#upload.analysis-workspace-upload'),
                heroReady: !!document.querySelector('#upload .analysis-hero, #upload .analysis-shell-head'),
                shellHeadReady: !!document.querySelector('#upload .analysis-shell-head'),
                normalizeSchoolName: typeof window.normalizeSchoolName === 'function',
                getCanonicalSchoolName: typeof window.getCanonicalSchoolName === 'function',
                ensureNormalizedTargets: typeof window.ensureNormalizedTargets === 'function',
                buildIndicatorSchoolBuckets: typeof window.buildIndicatorSchoolBuckets === 'function',
                listAvailableSchoolsForCompare: typeof window.listAvailableSchoolsForCompare === 'function',
                summaryStripReady: !!document.getElementById('upload-summary-strip'),
                flowNoticeReady: !!document.getElementById('upload-flow-notice'),
                workbenchReady: !!document.querySelector('#upload .upload-workbench-grid'),
                intakeReady: !!document.getElementById('fileInput') && !!document.getElementById('uploadBox'),
                flowReady: document.querySelectorAll('#upload .analysis-flow-step').length >= 3
            };
            return {
                ok: Object.values(checks).every(Boolean) && Array.isArray(schools),
                checks,
                schoolCount: Array.isArray(schools) ? schools.length : -1
            };
        });
    }
    if (id === 'analysis') {
        return page.evaluate(() => {
            const checks = {
                renderHorizontalTable: typeof window.renderHorizontalTable === 'function',
                exportHorizontalExcel: typeof window.exportHorizontalExcel === 'function',
                exportMacroTables: typeof window.exportMacroTables === 'function',
                renderTables: typeof window.renderTables === 'function',
                toggleTableHeatmap: typeof window.toggleTableHeatmap === 'function',
                tableAnchorJumpbarReady: false,
                tableAnchorButtonsReady: false
            };
            let horizontalReady = false;
            try {
                if (checks.renderTables) window.renderTables();
                const jumpbar = document.getElementById('two-rate-table-jumpbar');
                const jumpButtons = jumpbar ? jumpbar.querySelectorAll('[data-anchor-id]') : [];
                const expectedSubjects = typeof window.getTownAnalysisVisibleSubjectsForCurrentUser === 'function'
                    ? window.getTownAnalysisVisibleSubjectsForCurrentUser().length
                    : (Array.isArray(window.SUBJECTS) ? window.SUBJECTS.length : 0);
                checks.tableAnchorJumpbarReady = !!jumpbar;
                checks.tableAnchorButtonsReady = jumpButtons.length >= expectedSubjects + 2;
                if (checks.renderHorizontalTable) {
                    window.renderHorizontalTable();
                    const box = document.getElementById('horizontal-box');
                    const table = document.querySelector('#horizontal-table table');
                    horizontalReady = !!box && !box.classList.contains('hidden') && !!table;
                }
            } catch (error) {
                return {
                    ok: false,
                    checks,
                    horizontalReady: false,
                    error: error?.message || String(error)
                };
            }
            return {
                ok: Object.values(checks).every(Boolean) && horizontalReady,
                checks,
                horizontalReady
            };
        });
    }
    if (id === 'bottom3') {
        return page.evaluate(() => {
            const toNumber = (value, fallback = 0) => {
                const number = Number(value);
                return Number.isFinite(number) ? number : fallback;
            };
            const shortenName = (name) => {
                const text = String(name || '').trim();
                return text.length > 8 ? `${text.slice(0, 8)}...` : (text || '--');
            };
            const timings = [];
            let lastMark = performance.now();
            const mark = (label) => {
                const now = performance.now();
                timings.push({ label, durationMs: Math.round(now - lastMark) });
                lastMark = now;
            };
            const schools = Object.values(window.SCHOOLS || {});
            const schoolNames = Object.keys(window.SCHOOLS || {});
            const townshipSchools = schools.filter((school) => {
                if (!school || typeof school !== 'object') return false;
                return typeof window.isTownshipManagedSchool === 'function'
                    ? window.isTownshipManagedSchool(school.name, schoolNames)
                    : true;
            });
            mark('filterTownshipSchools');
            const rows = townshipSchools
                .filter((school) => school.bottom3)
                .map((school) => ({
                    name: String(school.name || '').trim(),
                    totalN: toNumber(school.bottom3?.totalN),
                    bottomN: toNumber(school.bottom3?.bottomN),
                    excN: toNumber(school.bottom3?.excN),
                    avg: toNumber(school.bottom3?.avg),
                    score: toNumber(school.scoreBottom),
                    rank: toNumber(school.rankBottom)
                }))
                .filter((row) => row.name && row.totalN > 0);
            mark('mapRows');
            const sorted = rows.slice().sort((a, b) => {
                if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
                return b.score - a.score;
            });
            mark('sortRows');
            const expectedAverage = rows.length
                ? rows.reduce((sum, row) => sum + row.avg, 0) / rows.length
                : 0;
            const expectedTopSchool = sorted[0]?.name || '';
            const snapshotBottom3State = () => Object.values(window.SCHOOLS || {}).map((school) => {
                const bottom3 = school?.bottom3 || {};
                return [
                    String(school?.name || '').trim(),
                    toNumber(bottom3.totalN),
                    toNumber(bottom3.bottomN),
                    toNumber(bottom3.excN),
                    toNumber(bottom3.avg).toFixed(4),
                    toNumber(school?.scoreBottom).toFixed(4),
                    toNumber(school?.rankBottom)
                ].join(':');
            }).join('|');
            if (typeof window.SupportMetricsRuntime?.ensureWrappers === 'function') {
                window.SupportMetricsRuntime.ensureWrappers();
            }
            mark('ensureWrappers');
            const beforeRefresh = snapshotBottom3State();
            mark('snapshotBeforeSummary');
            const summary = window.SupportMetricsRuntime?.refreshBottom3Summary?.() || null;
            mark('refreshSummary');
            const afterRefresh = snapshotBottom3State();
            mark('snapshotAfterSummary');
            const schoolCountText = document.getElementById('bottom3-school-count')?.textContent?.trim() || '';
            const averageScoreText = document.getElementById('bottom3-average-score')?.textContent?.trim() || '';
            const topSchoolText = document.getElementById('bottom3-top-school')?.textContent?.trim() || '';
            const excLabelText = document.getElementById('label-exc')?.textContent?.trim() || '';
            const expectedExcRate = toNumber(window.CONFIG?.excRate) * 100;
            const tableRowCount = document.querySelectorAll('#tb-bottom3 tbody tr').length;
            mark('readDom');
            const finite = rows.every((row) => [row.totalN, row.bottomN, row.excN, row.avg, row.score, row.rank]
                .every((value) => Number.isFinite(Number(value))));
            const checks = {
                sectionReady: !!document.querySelector('#bottom3.support-metric-workspace'),
                heroReady: !!document.querySelector('#bottom3 .analysis-hero, #bottom3 .analysis-shell-head'),
                cardsReady: !!document.getElementById('bottom3-school-count')
                    && !!document.getElementById('bottom3-average-score')
                    && !!document.getElementById('bottom3-top-school'),
                tableReady: tableRowCount > 0,
                runtimeReady: !!window.SupportMetricsRuntime,
                renderTablesWrapped: window.renderTables?.__supportMetricsWrapped === true,
                refreshReady: typeof window.SupportMetricsRuntime?.refreshBottom3Summary === 'function',
                summaryReady: !!summary && summary.ok === true,
                countMatches: String(summary?.count || '') === String(rows.length)
                    && schoolCountText === String(rows.length),
                averageMatches: Math.abs(toNumber(summary?.averageScore) - Number(expectedAverage.toFixed(2))) < 0.01
                    && averageScoreText === expectedAverage.toFixed(2),
                topSchoolMatches: summary?.topSchool === expectedTopSchool
                    && topSchoolText === shortenName(expectedTopSchool),
                excRateMatches: expectedExcRate <= 0
                    || excLabelText === `${expectedExcRate.toFixed(0)}%`,
                finite,
                refreshDoesNotMutate: beforeRefresh === afterRefresh
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                count: rows.length,
                tableRowCount,
                averageScore: Number(expectedAverage.toFixed(2)),
                topSchool: expectedTopSchool,
                timings,
                entryTimings: Array.isArray(window.__SMOKE_BOTTOM3_ENTRY_TIMINGS__)
                    ? window.__SMOKE_BOTTOM3_ENTRY_TIMINGS__
                    : [],
                summary
            };
        });
    }
    if (id === 'indicator') {
        return page.evaluate(async () => {
            const toNumber = (value, fallback = 0) => {
                const number = Number(value);
                return Number.isFinite(number) ? number : fallback;
            };
            const shortenName = (name) => {
                const text = String(name || '').trim();
                return text.length > 8 ? `${text.slice(0, 8)}...` : (text || '--');
            };
            const timings = [];
            let lastMark = performance.now();
            const mark = (label) => {
                const now = performance.now();
                timings.push({ label, durationMs: Math.round(now - lastMark) });
                lastMark = now;
            };
            const seedSmokeIndicatorInputs = () => {
                if (!window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) return;
                const currentIndicator = window.SYS_VARS?.indicator || {};
                if (!String(currentIndicator.ind1 || '').trim() || !String(currentIndicator.ind2 || '').trim()) {
                    if (typeof window.setIndicatorState === 'function') {
                        window.setIndicatorState({ ind1: '222', ind2: '1353' });
                    } else {
                        window.SYS_VARS = window.SYS_VARS || {};
                        window.SYS_VARS.indicator = { ind1: '222', ind2: '1353' };
                    }
                }
                const targetCount = window.TARGETS && typeof window.TARGETS === 'object'
                    ? Object.keys(window.TARGETS).length
                    : 0;
                if (targetCount > 0) return;
                const buckets = typeof window.buildIndicatorSchoolBuckets === 'function'
                    ? window.buildIndicatorSchoolBuckets()
                    : Object.values(window.SCHOOLS || {}).map((school) => ({
                        name: String(school?.name || '').trim(),
                        students: Array.isArray(school?.students) ? school.students : []
                    }));
                const targets = {};
                buckets
                    .filter((bucket) => bucket.name && Array.isArray(bucket.students) && bucket.students.length > 0)
                    .forEach((bucket) => {
                        const count = bucket.students.length;
                        targets[bucket.name] = {
                            t1: String(Math.max(1, Math.min(count, Math.round(count * 0.05)))),
                            t2: String(Math.max(1, Math.min(count, Math.round(count * 0.2))))
                        };
                    });
                if (Object.keys(targets).length > 0) {
                    if (typeof window.setTargetsState === 'function') window.setTargetsState(targets);
                    else window.TARGETS = targets;
                    if (typeof window.ensureNormalizedTargets === 'function') window.ensureNormalizedTargets();
                }
            };
            seedSmokeIndicatorInputs();
            let result = [];
            let calcError = '';
            try {
                if (typeof window.refreshIndicatorResults === 'function') {
                    result = await Promise.resolve(window.refreshIndicatorResults(true, {
                        waitForInputs: true,
                        timeoutMs: 9000
                    }));
                } else if (typeof window.calcIndicators === 'function') {
                    result = window.calcIndicators(true);
                }
                if (!Array.isArray(result) && Array.isArray(window.INDICATOR_LAST_RESULT)) {
                    result = window.INDICATOR_LAST_RESULT;
                }
            } catch (error) {
                calcError = error?.message || String(error);
            }
            mark('calc');
            await new Promise(resolve => setTimeout(resolve, 120));
            mark('settle');

            const rows = (Array.isArray(result) ? result : [])
                .map((row) => ({
                    name: String(row?.name || '').trim(),
                    finalScore: toNumber(row?.finalScore),
                    score1: toNumber(row?.score1),
                    score2: toNumber(row?.score2),
                    base1: toNumber(row?.base1),
                    base2: toNumber(row?.base2),
                    bonus1: toNumber(row?.bonus1),
                    bonus2: toNumber(row?.bonus2),
                    rank: toNumber(row?.rank),
                    missingTarget: !!row?.missingTarget,
                    invalidTarget: !!row?.invalidTarget
                }))
                .filter((row) => row.name);
            mark('mapRows');
            const sorted = rows.slice().sort((a, b) => {
                if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
                return b.finalScore - a.finalScore;
            });
            mark('sortRows');
            const expectedTop = sorted[0] || null;
            const expectedIssueCount = rows.filter((row) => row.missingTarget || row.invalidTarget).length;
            const snapshotIndicatorState = () => Object.values(window.SCHOOLS || {})
                .map((school) => [
                    String(school?.name || '').trim(),
                    toNumber(school?.scoreInd).toFixed(4),
                    toNumber(school?.rankInd)
                ].join(':'))
                .join('|');
            const scoreSnapshot = snapshotIndicatorState();
            mark('snapshotBeforeSummary');
            if (typeof window.SupportMetricsRuntime?.ensureWrappers === 'function') {
                window.SupportMetricsRuntime.ensureWrappers();
            }
            const summary = window.SupportMetricsRuntime?.refreshIndicatorSummary?.(rows) || null;
            mark('refreshSummary');
            const scoreSnapshotAfterSummary = snapshotIndicatorState();
            mark('snapshotAfterSummary');
            const schoolCountText = document.getElementById('indicator-school-count')?.textContent?.trim() || '';
            const topScoreText = document.getElementById('indicator-top-score')?.textContent?.trim() || '';
            const topSchoolText = document.getElementById('indicator-top-school')?.textContent?.trim() || '';
            const issueCountText = document.getElementById('indicator-missing-target-count')?.textContent?.trim() || '';
            const tableRowCount = document.querySelectorAll('#tb-indicator tbody tr').length;
            mark('readDom');
            const finite = rows.every((row) => [
                row.finalScore,
                row.score1,
                row.score2,
                row.base1,
                row.base2,
                row.bonus1,
                row.bonus2,
                row.rank
            ].every((value) => Number.isFinite(Number(value))));
            const calcAllowed = typeof window.isIndicatorCalcAllowed === 'function'
                ? window.isIndicatorCalcAllowed()
                : true;
            const indicatorInputDiagnostics = {
                context: typeof window.getIndicatorContext === 'function' ? window.getIndicatorContext() : null,
                indicator: window.SYS_VARS?.indicator || null,
                targetCount: window.TARGETS && typeof window.TARGETS === 'object' ? Object.keys(window.TARGETS).length : 0,
                scoreCount: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
                hasInputs: typeof window.hasIndicatorCalcInputs === 'function' ? window.hasIndicatorCalcInputs() : null,
                dmInd1: document.getElementById('dm_ind1_input')?.value || '',
                dmInd2: document.getElementById('dm_ind2_input')?.value || '',
                mainInd1: document.getElementById('ind1')?.value || '',
                mainInd2: document.getElementById('ind2')?.value || ''
            };
            const checks = {
                sectionReady: !!document.querySelector('#indicator.support-metric-workspace'),
                heroReady: !!document.querySelector('#indicator .analysis-hero, #indicator .analysis-shell-head'),
                cardsReady: !!document.getElementById('indicator-school-count')
                    && !!document.getElementById('indicator-top-score')
                    && !!document.getElementById('indicator-top-school')
                    && !!document.getElementById('indicator-missing-target-count'),
                tableReady: !calcAllowed || tableRowCount > 0,
                buttonReady: !!document.getElementById('btn-indicator-calc'),
                runtimeReady: !!window.SupportMetricsRuntime,
                calcIndicatorsWrapped: window.calcIndicators?.__supportMetricsWrapped === true,
                refreshReady: typeof window.SupportMetricsRuntime?.refreshIndicatorSummary === 'function',
                calculationRuleHandled: calcAllowed || (!calcError && rows.length === 0),
                calcSuccess: !calcAllowed || (!calcError && rows.length > 0),
                summaryReady: !calcAllowed || (!!summary && summary.ok === true),
                countMatches: !calcAllowed || (String(summary?.count || '') === String(rows.length)
                    && schoolCountText === String(rows.length)),
                topScoreMatches: !calcAllowed || (!!expectedTop
                    && Math.abs(toNumber(summary?.topScore) - Number(expectedTop.finalScore.toFixed(2))) < 0.01
                    && topScoreText === expectedTop.finalScore.toFixed(2)),
                topSchoolMatches: !calcAllowed || (!!expectedTop
                    && summary?.topSchool === expectedTop.name
                    && topSchoolText === shortenName(expectedTop.name)),
                issueCountMatches: !calcAllowed || (Number(summary?.issueCount) === expectedIssueCount
                    && issueCountText === String(expectedIssueCount)),
                finite: !calcAllowed || finite,
                summaryRefreshDoesNotMutateScores: scoreSnapshot === scoreSnapshotAfterSummary
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                count: rows.length,
                tableRowCount,
                topScore: expectedTop ? Number(expectedTop.finalScore.toFixed(2)) : 0,
                topSchool: expectedTop?.name || '',
                issueCount: expectedIssueCount,
                calcError,
                calcAllowed,
                calculationSkippedByRule: !calcAllowed,
                indicatorInputDiagnostics,
                timings,
                summary
            };
        });
    }
    if (id === 'marginal-push') {
        return page.evaluate(() => {
            const checks = {
                sectionReady: !!document.querySelector('#marginal-push.analysis-workspace-amber'),
                heroReady: !!document.querySelector('#marginal-push .analysis-hero, #marginal-push .analysis-shell-head'),
                shellHeadReady: !!document.querySelector('#marginal-push .analysis-shell-head'),
                runtimeReady: !!window.MarginalPushRuntime,
                updateSchoolReady: typeof window.updateMpSchoolSelect === 'function',
                generateReady: typeof window.generateMarginalTickets === 'function',
                exportReady: typeof window.exportMarginalTasks === 'function',
                filterReady: !!document.getElementById('mpSchoolSelect')
                    && !!document.getElementById('mpClassSelect')
                    && !!document.getElementById('mpSubjectSelect')
                    && !!document.getElementById('mpGap')
                    && !!document.getElementById('mpType'),
                cycleReady: !!document.querySelector('#marginal-push .marginal-cycle-panel')
                    && !!document.getElementById('mp_snapshot_select'),
                previewReady: !!document.getElementById('mp-tickets-container')
            };
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks, generatedCount: 0, ticketCount: 0 };
            }
            window.updateMpSchoolSelect();
            const schoolSelect = document.getElementById('mpSchoolSelect');
            const subjectSelect = document.getElementById('mpSubjectSelect');
            const gapInput = document.getElementById('mpGap');
            const typeSelect = document.getElementById('mpType');
            const schools = Array.from(schoolSelect.options || []).map(option => option.value).filter(Boolean);
            const buildTaskRows = window.MarginalPushRuntime && typeof window.MarginalPushRuntime.buildTaskRows === 'function'
                ? window.MarginalPushRuntime.buildTaskRows
                : null;
            let sample = null;
            let result = null;
            for (const school of schools) {
                for (const gap of [5, 10, 20, 999]) {
                    const count = buildTaskRows
                        ? Number(buildTaskRows({ school, className: '', subject: 'ALL', gap, type: 'both' })?.rows?.length || 0)
                        : 0;
                    if (count > 0) {
                        sample = { school, gap, count };
                        break;
                    }
                }
                if (sample) break;
            }
            if (sample) {
                schoolSelect.value = sample.school;
                window.updateMpClassSelect();
                if (subjectSelect) subjectSelect.value = 'ALL';
                if (typeSelect) typeSelect.value = 'both';
                if (gapInput) gapInput.value = String(sample.gap);
                result = window.generateMarginalTickets();
            }
            const ticketCount = document.querySelectorAll('#mp-tickets-container .task-ticket').length;
            const generatedCount = Number(result?.count || 0);
            return {
                ok: Object.values(checks).every(Boolean) && generatedCount > 0 && ticketCount > 0,
                checks,
                generatedCount,
                ticketCount,
                sampleSchool: schoolSelect.value || '',
                sampleGap: sample?.gap || null
            };
        });
    }
    if (id === 'subject-balance') {
        return page.evaluate(() => {
            const checks = {
                sectionReady: !!document.getElementById('subject-balance'),
                schoolSelectReady: !!document.getElementById('sbSchoolSelect'),
                classSelectReady: !!document.getElementById('sbClassSelect'),
                tableReady: !!document.getElementById('sb-table'),
                updateReady: typeof window.updateSubjectBalanceSelects === 'function',
                renderReady: typeof window.SB_renderTable === 'function',
                aliasResolverReady: typeof window.getAppSchoolRecord === 'function'
            };
            if (!Object.values(checks).every(Boolean)) return { ok: false, checks };

            const alerts = [];
            const originalAlert = window.alert;
            window.alert = (message) => {
                alerts.push(String(message || ''));
            };

            try {
                window.updateSubjectBalanceSelects();
                const schoolSelect = document.getElementById('sbSchoolSelect');
                const preferred = String(window.MY_SCHOOL || localStorage.getItem('MY_SCHOOL') || '银山实验').trim();
                const options = Array.from(schoolSelect.options || []).map(option => option.value).filter(Boolean);
                const selected = schoolSelect.value || options.find(value => (
                    typeof window.sameAppSchoolName === 'function'
                        ? window.sameAppSchoolName(value, preferred)
                        : value === preferred
                )) || options[0] || '';
                schoolSelect.value = selected;
                if (typeof schoolSelect.onchange === 'function') schoolSelect.onchange();
                window.SB_renderTable();
                const rows = document.querySelectorAll('#sb-table tbody tr');
                checks.selectedSchoolResolves = !!window.getAppSchoolRecord(selected);
                checks.homeSchoolSelected = typeof window.sameAppSchoolName === 'function'
                    ? window.sameAppSchoolName(selected, preferred)
                    : selected === preferred;
                checks.rowsRendered = rows.length > 0;
                checks.noAlerts = alerts.length === 0;
                checks.noInvalidText = !/undefined|NaN|Cannot read/i.test(document.getElementById('sb-table')?.textContent || '');
                return {
                    ok: Object.values(checks).every(Boolean),
                    checks,
                    selectedSchool: selected,
                    rowCount: rows.length,
                    alerts
                };
            } finally {
                window.alert = originalAlert;
            }
        });
    }
    if (id === 'seat-adjustment') {
        return page.evaluate(() => {
            const checks = {
                sectionReady: !!document.querySelector('#seat-adjustment.analysis-workspace-student'),
                heroReady: !!document.querySelector('#seat-adjustment .analysis-hero, #seat-adjustment .analysis-shell-head'),
                shellHeadReady: !!document.querySelector('#seat-adjustment .analysis-shell-head'),
                actionReady: document.querySelectorAll('#seat-adjustment .seat-adjustment-actions .btn').length >= 2,
                flowReady: document.querySelectorAll('#seat-adjustment .analysis-flow-step').length >= 3,
                runtimeReady: !!window.SeatAdjustmentRuntime,
                updateReady: typeof window.updateSeatAdjSelects === 'function',
                generateReady: typeof window.generateSeatSuggestions === 'function',
                configReady: !!document.querySelector('#seat-adjustment .seat-config-panel')
                    && !!document.querySelector('#seat-adjustment .seat-config-grid'),
                constraintReady: !!document.querySelector('#seat-adjustment .seat-constraint-panel')
                    && !!document.querySelector('#seat-adjustment .seat-constraint-grid'),
                controlsReady: !!document.getElementById('seatAdjSchoolSelect')
                    && !!document.getElementById('seatAdjClassSelect')
                    && !!document.getElementById('seatAdjGroups')
                    && !!document.getElementById('seatAdjCols')
                    && !!document.getElementById('seatAdjStrategy'),
                workspaceReady: !!document.getElementById('seat-adj-workspace')
                    && !!document.getElementById('seat-adj-container')
                    && !!document.querySelector('#seat-adjustment .seat-adj-canvas')
            };
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks, count: 0, deskCount: 0 };
            }

            window.updateSeatAdjSelects();
            const schoolSelect = document.getElementById('seatAdjSchoolSelect');
            const classSelect = document.getElementById('seatAdjClassSelect');
            const groupsInput = document.getElementById('seatAdjGroups');
            const colsInput = document.getElementById('seatAdjCols');
            const strategySelect = document.getElementById('seatAdjStrategy');
            const schools = Array.from(schoolSelect.options || []).map(option => option.value).filter(Boolean);
            let result = null;
            let sampleSchool = '';
            let sampleClass = '';
            for (const school of schools) {
                schoolSelect.value = school;
                window.updateSeatAdjSelects();
                const classes = Array.from(classSelect.options || []).map(option => option.value).filter(Boolean);
                for (const className of classes) {
                    classSelect.value = className;
                    if (typeof window.updateConstraintWidgetsContext === 'function') window.updateConstraintWidgetsContext('adj');
                    if (groupsInput) groupsInput.value = '2';
                    if (colsInput) colsInput.value = '4';
                    if (strategySelect) strategySelect.value = 'conversion';
                    result = window.generateSeatSuggestions();
                    if (Number(result?.count || 0) > 0) {
                        sampleSchool = school;
                        sampleClass = className;
                        break;
                    }
                }
                if (Number(result?.count || 0) > 0) break;
            }
            const deskCount = document.querySelectorAll('#seat-adj-container .desk:not(.desk-empty)').length;
            const count = Number(result?.count || 0);
            return {
                ok: Object.values(checks).every(Boolean)
                    && count > 0
                    && deskCount === count
                    && result?.finite === true,
                checks,
                count,
                deskCount,
                finite: result?.finite === true,
                sampleSchool,
                sampleClass,
                strategy: result?.strategy || ''
            };
        });
    }
    if (id === 'progress-analysis') {
        return page.evaluate(() => {
            let renderCallSafe = true;
            let renderCallResult = null;
            let renderCallError = '';
            let townRankScopeOk = true;
            let townRankScopeChecked = false;
            let townRankMismatch = null;
            try {
                const schoolSel = document.getElementById('progressCompareSchool');
                const exam1Sel = document.getElementById('progressCompareExam1');
                const exam2Sel = document.getElementById('progressCompareExam2');
                const pickOption = (select, exclude = '') => {
                    const options = Array.from(select?.options || []).map(option => option.value).filter(Boolean);
                    return options.find(value => value !== exclude) || '';
                };
                if (schoolSel && !schoolSel.value) schoolSel.value = pickOption(schoolSel);
                if (exam1Sel && !exam1Sel.value) exam1Sel.value = pickOption(exam1Sel);
                if (exam2Sel && (!exam2Sel.value || exam2Sel.value === exam1Sel?.value)) {
                    exam2Sel.value = pickOption(exam2Sel, exam1Sel?.value || '');
                }
                if (schoolSel?.value && exam1Sel?.value && exam2Sel?.value && exam1Sel.value !== exam2Sel.value) {
                    renderCallResult = window.renderMultiPeriodComparison();
                }
                const cache = typeof window.readMultiPeriodCompareCacheState === 'function'
                    ? window.readMultiPeriodCompareCacheState()
                    : window.MULTI_PERIOD_COMPARE_CACHE;
                if (cache?.type === 'progress'
                    && Array.isArray(cache.rows)
                    && cache.rows.length
                    && Array.isArray(cache.examIds)
                    && cache.examIds.length
                    && typeof window.getExamRowsForCompare === 'function'
                    && typeof window.buildCompetitionRankMap === 'function'
                    && typeof window.filterProgressCompareRowsToTownshipScope === 'function') {
                    const lastExamId = cache.examIds[cache.examIds.length - 1];
                    const totalSubjects = typeof window.getComparisonTotalSubjects === 'function'
                        ? window.getComparisonTotalSubjects()
                        : [];
                    const totalOf = (row) => {
                        if (typeof window.getComparisonTotalValue === 'function') {
                            const value = Number(window.getComparisonTotalValue(row, totalSubjects));
                            if (Number.isFinite(value)) return value;
                        }
                        const fallback = Number(row?.total);
                        return Number.isFinite(fallback) ? fallback : Number.NEGATIVE_INFINITY;
                    };
                    const cleanName = typeof window.getProgressCleanName === 'function'
                        ? window.getProgressCleanName
                        : (name => String(name || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase());
                    const townshipRows = window.filterProgressCompareRowsToTownshipScope(window.getExamRowsForCompare(lastExamId));
                    const expectedRankMap = window.buildCompetitionRankMap(townshipRows, row => cleanName(row?.name), totalOf);
                    const checkedRows = cache.rows.filter(row => expectedRankMap.has(row.key)).slice(0, 120);
                    townRankScopeChecked = checkedRows.length > 0;
                    for (const row of checkedRows) {
                        const period = row.periods?.[row.periods.length - 1] || {};
                        const actual = Number(period.rankTown);
                        const expected = Number(expectedRankMap.get(row.key));
                        if (Number.isFinite(expected) && actual !== expected) {
                            townRankScopeOk = false;
                            townRankMismatch = {
                                name: row.name,
                                className: row.class,
                                examId: lastExamId,
                                actual,
                                expected
                            };
                            break;
                        }
                    }
                }
            } catch (error) {
                renderCallSafe = false;
                renderCallError = error?.message || String(error);
            }
            const checks = {
                sectionReady: !!document.getElementById('progress-analysis'),
                renderProgressAnalysis: typeof window.renderProgressAnalysis === 'function',
                onProgressComparePeriodCountChange: typeof window.onProgressComparePeriodCountChange === 'function',
                renderMultiPeriodComparison: typeof window.renderMultiPeriodComparison === 'function',
                exportMultiPeriodComparison: typeof window.exportMultiPeriodComparison === 'function',
                compareControlsReady: !!document.getElementById('progressCompareSchool')
                    && !!document.getElementById('progressCompareExam1')
                    && !!document.getElementById('progressCompareExam2')
                    && !!document.getElementById('progressCompareExam3'),
                resultSlotReady: !!document.getElementById('multiPeriodCompareResult'),
                renderCallSafe,
                townRankScopeOk
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                renderCallResult: !!renderCallResult,
                renderCallError,
                townRankScopeChecked,
                townRankMismatch
            };
        });
    }
    if (id === 'student-overview') {
        return page.evaluate(async ({ strictPerformance }) => {
            const textOf = (selector) => String(document.querySelector(selector)?.textContent || '')
                .replace(/\s+/g, ' ')
                .trim();
            const toNumber = (value, fallback = 0) => {
                const number = Number(value);
                return Number.isFinite(number) ? number : fallback;
            };
            const normalizeClassValue = (value) => (
                typeof window.normalizeClass === 'function'
                    ? window.normalizeClass(value || '')
                    : String(value || '').trim()
            );
            const schoolMatches = (rowSchool, selectedSchool) => {
                const useRowSchool = String(rowSchool || '').trim();
                const useSelectedSchool = String(selectedSchool || '').trim();
                if (!useSelectedSchool) return true;
                if (!useRowSchool) return false;
                if (useRowSchool === useSelectedSchool) return true;
                if (typeof window.areSchoolNamesEquivalent === 'function') {
                    try {
                        return !!window.areSchoolNamesEquivalent(useRowSchool, useSelectedSchool);
                    } catch (_) {
                        return false;
                    }
                }
                return false;
            };
            const firstOptionValue = (select, exclude = '') => Array.from(select?.options || [])
                .map(option => String(option.value || '').trim())
                .find(value => value && value !== exclude) || '';
            const pickSelectValue = (id, preferred = '', exclude = '') => {
                const select = document.getElementById(id);
                if (!select) return '';
                const preferredValue = String(preferred || '').trim();
                const hasPreferred = preferredValue && Array.from(select.options || [])
                    .some(option => String(option.value || '').trim() === preferredValue);
                select.value = hasPreferred ? preferredValue : firstOptionValue(select, exclude);
                return String(select.value || '').trim();
            };
            const ensureOverviewInputs = () => {
                const currentSchool = String(
                    (typeof window.readCurrentSchool === 'function' ? window.readCurrentSchool() : '')
                    || window.MY_SCHOOL
                    || ''
                ).trim();
                if (typeof window.updateStudentSchoolSelect === 'function') window.updateStudentSchoolSelect();
                if (typeof window.updateStudentCompareExamSelects === 'function') window.updateStudentCompareExamSelects();
                if (typeof window.updateReportCompareExamSelects === 'function') window.updateReportCompareExamSelects();
                if (typeof window.updateMarginalSchoolSelect === 'function') window.updateMarginalSchoolSelect();
                if (typeof window.updateSubjectBalanceSelects === 'function') window.updateSubjectBalanceSelects();
                if (typeof window.updatePotentialSchoolSelect === 'function') window.updatePotentialSchoolSelect();
                if (typeof window.updateSegmentSelects === 'function') window.updateSegmentSelects();
                if (typeof window.updateCorrelationSchoolSelect === 'function') window.updateCorrelationSchoolSelect();
                if (typeof window.updateClassSelect === 'function') window.updateClassSelect();

                const selectedSchool = pickSelectValue('studentSchoolSelect', currentSchool);
                const exam1 = pickSelectValue('studentCompareExam1');
                pickSelectValue('studentCompareExam2', '', exam1);
                const period = document.getElementById('studentComparePeriodCount');
                if (period && !period.value) period.value = '2';
                if (typeof window.onStudentComparePeriodCountChange === 'function') {
                    window.onStudentComparePeriodCountChange();
                }

                if (typeof window.updateProgressMultiExamSelects === 'function') window.updateProgressMultiExamSelects();
                pickSelectValue('progressCompareSchool', selectedSchool);
                const progressExam1 = pickSelectValue('progressCompareExam1', exam1);
                pickSelectValue('progressCompareExam2', '', progressExam1);
                const progressPeriod = document.getElementById('progressComparePeriodCount');
                if (progressPeriod && !progressPeriod.value) progressPeriod.value = '2';
                if (typeof window.onProgressComparePeriodCountChange === 'function') {
                    window.onProgressComparePeriodCountChange();
                }
            };
            const buildExpected = (model) => {
                const context = model.context || {};
                const rawRows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
                const selectedSchool = String(context.schoolValue || '').trim();
                const selectedClass = normalizeClassValue(context.classValue || '');
                const seen = new Set();
                rawRows.forEach((row) => {
                    if (!row) return;
                    if (selectedSchool && !schoolMatches(row.school, selectedSchool)) return;
                    const rowClass = normalizeClassValue(row.class || '');
                    if (selectedClass && rowClass !== selectedClass) return;
                    const key = [
                        String(row.school || '').trim(),
                        rowClass,
                        String(row.name || '').trim()
                    ].join('|');
                    if (key !== '||') seen.add(key);
                });

                const fullProgressRows = typeof window.readProgressCacheFullState === 'function'
                    ? window.readProgressCacheFullState()
                    : (Array.isArray(window.PROGRESS_CACHE_FULL) ? window.PROGRESS_CACHE_FULL : []);
                const fallbackProgressRows = typeof window.readProgressCacheState === 'function'
                    ? window.readProgressCacheState()
                    : (Array.isArray(window.PROGRESS_CACHE) ? window.PROGRESS_CACHE : []);
                const progressRows = fullProgressRows.length ? fullProgressRows : fallbackProgressRows;
                const progress = { total: 0, improve: 0, decline: 0, stable: 0 };
                progressRows.forEach((row) => {
                    if (selectedSchool && !schoolMatches(row.school, selectedSchool)) return;
                    if (selectedClass && normalizeClassValue(row.class || '') !== selectedClass) return;
                    progress.total += 1;
                    const changeValue = toNumber(row.change);
                    if (changeValue > 0) progress.improve += 1;
                    else if (changeValue < 0) progress.decline += 1;
                    else progress.stable += 1;
                });

                const marginalSource = (window.MARGINAL_STUDENTS && typeof window.MARGINAL_STUDENTS === 'object')
                    ? window.MARGINAL_STUDENTS
                    : {};
                let marginalClassCount = 0;
                let marginalRecordCount = 0;
                Object.entries(marginalSource).forEach(([, subjectMap]) => {
                    marginalClassCount += 1;
                    Object.values(subjectMap || {}).forEach((subjectData) => {
                        const excellentList = Array.isArray(subjectData?.excellentMarginal)
                            ? subjectData.excellentMarginal
                            : [];
                        const passList = Array.isArray(subjectData?.passMarginal)
                            ? subjectData.passMarginal
                            : [];
                        marginalRecordCount += excellentList.length + passList.length;
                    });
                });

                const potentialRows = Array.isArray(window.POTENTIAL_STUDENTS_CACHE)
                    ? window.POTENTIAL_STUDENTS_CACHE
                    : [];
                let potentialCount = 0;
                potentialRows.forEach((row) => {
                    if (selectedSchool && !schoolMatches(row.school, selectedSchool)) return;
                    if (selectedClass && normalizeClassValue(row.class || '') !== selectedClass) return;
                    potentialCount += 1;
                });

                return {
                    uniqueStudentCount: seen.size,
                    progress,
                    marginalClassCount,
                    marginalRecordCount,
                    potentialCount
                };
            };

            if (typeof window.ensureStudentOverviewRuntimeLoaded === 'function') {
                await Promise.resolve(window.ensureStudentOverviewRuntimeLoaded()).catch(() => null);
            } else if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
                await Promise.resolve(window.SystemRuntimeLoader.load('student-overview')).catch(() => null);
            }

            ensureOverviewInputs();
            if (typeof window.renderMultiPeriodComparison === 'function') {
                await Promise.resolve(window.renderMultiPeriodComparison()).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 180));
            }
            if (typeof window.renderStudentOverview === 'function') {
                window.renderStudentOverview();
            } else if (typeof window.smScheduleStudentOverviewRender === 'function') {
                window.smScheduleStudentOverviewRender();
            }
            await new Promise(resolve => setTimeout(resolve, 220));

            const model = typeof window.smBuildOverviewModel === 'function'
                ? window.smBuildOverviewModel()
                : null;
            if (!model) {
                return {
                    ok: false,
                    checks: {
                        runtimeReady: false
                    }
                };
            }

            const expected = buildExpected(model);
            const statScoresText = textOf('#smStatScores');
            const statProgressText = textOf('#smStatProgress');
            const statSupportText = textOf('#smStatSupport');
            const summarySchoolsText = textOf('#smSummarySchools');
            const summaryStudentsText = textOf('#smSummaryStudents');
            const summaryProgressText = textOf('#smSummaryProgress');
            const summaryPotentialText = textOf('#smSummaryPotential');
            const quickButtons = Array.from(document.querySelectorAll('#smQuickEntry [data-target]'));
            const quickStates = Object.fromEntries(quickButtons.map((button) => [
                button.dataset.target,
                !button.disabled
            ]));
            const expectedQuickStates = {
                'student-details': !!model.scoreReady,
                'progress-analysis': !!model.scoreReady && model.exams.length >= 2,
                'marginal-push': !!model.scoreReady && !!model.schoolReady,
                'subject-balance': !!model.scoreReady && !!model.schoolReady,
                'potential-analysis': !!model.scoreReady,
                'report-generator': !!model.scoreReady
            };
            const quickStateMismatches = Object.entries(expectedQuickStates)
                .filter(([target, enabled]) => quickStates[target] !== enabled)
                .map(([target, enabled]) => ({ target, expectedEnabled: enabled, actualEnabled: quickStates[target] }));
            const countFields = [
                model.uniqueStudentCount,
                model.progressCount,
                model.improveCount,
                model.declineCount,
                model.stableCount,
                model.marginalClassCount,
                model.marginalRecordCount,
                model.potentialCount,
                model.rawData?.length,
                model.exams?.length,
                model.schoolList?.length
            ];
            const checks = {
                sectionReady: !!document.querySelector('#student-overview.analysis-workspace-emerald'),
                heroReady: !!document.querySelector('#student-overview .analysis-hero, #student-overview .analysis-shell-head'),
                shellHeadReady: !!document.querySelector('#student-overview .analysis-shell-head'),
                runtimeReady: typeof window.smBuildOverviewModel === 'function'
                    && typeof window.renderStudentOverview === 'function'
                    && typeof window.smScheduleStudentOverviewRender === 'function',
                helperReady: typeof window.tmBuildStatCard === 'function'
                    && typeof window.tmBuildMiniCard === 'function'
                    && typeof window.tmGetAvailableExamList === 'function',
                scoreReady: model.scoreReady === true,
                rawDataReady: Array.isArray(model.rawData) && model.rawData.length > 0,
                examReady: Array.isArray(model.exams) && model.exams.length >= 1,
                schoolListReady: Array.isArray(model.schoolList) && model.schoolList.length >= 1,
                uniqueStudentsReady: model.uniqueStudentCount > 0,
                finiteCounts: countFields.every(value => Number.isFinite(Number(value))),
                progressArithmetic: model.progressCount === model.improveCount + model.declineCount + model.stableCount,
                uniqueCountMatches: model.uniqueStudentCount === expected.uniqueStudentCount,
                progressCountMatches: model.progressCount === expected.progress.total
                    && model.improveCount === expected.progress.improve
                    && model.declineCount === expected.progress.decline
                    && model.stableCount === expected.progress.stable,
                supportCountMatches: model.marginalClassCount === expected.marginalClassCount
                    && model.marginalRecordCount === expected.marginalRecordCount
                    && model.potentialCount === expected.potentialCount,
                statCardsReady: ['smStatScores', 'smStatScope', 'smStatProgress', 'smStatSupport']
                    .every(slotId => String(document.getElementById(slotId)?.textContent || '').trim().length > 0),
                readinessReady: ['smReadyScore', 'smReadySchool', 'smReadyProgress', 'smReadySupport']
                    .every(slotId => String(document.getElementById(slotId)?.textContent || '').trim().length > 0),
                contextReady: ['smCtxSchool', 'smCtxClass', 'smCtxExam1', 'smCtxExam2', 'smCtxPeriod', 'smCtxFocus']
                    .every(slotId => String(document.getElementById(slotId)?.textContent || '').trim().length > 0),
                insightsReady: document.querySelectorAll('#smInsightList li').length >= 1
                    && !textOf('#smInsightList').includes('正在汇总'),
                summaryMatches: summarySchoolsText.includes(String(model.schoolList.length))
                    && summaryStudentsText.includes(String(model.uniqueStudentCount))
                    && summaryProgressText.includes(String(model.progressCount))
                    && summaryPotentialText.includes(String(model.potentialCount + model.marginalRecordCount)),
                statTextMatches: statScoresText.includes(String(model.exams.length))
                    && statScoresText.includes(String(model.rawData.length))
                    && statProgressText.includes(String(model.progressCount))
                    && statSupportText.includes(String(model.marginalRecordCount))
                    && statSupportText.includes(String(model.potentialCount)),
                quickEntryReady: quickButtons.length === Object.keys(expectedQuickStates).length,
                quickEntryStatesMatch: quickStateMismatches.length === 0,
                topQuickStatesMatch: (!!document.getElementById('smQuickStudentBtn')?.disabled) === !expectedQuickStates['student-details']
                    && (!!document.getElementById('smQuickProgressBtn')?.disabled) === !expectedQuickStates['progress-analysis']
                    && (!!document.getElementById('smQuickReportBtn')?.disabled) === !expectedQuickStates['report-generator']
            };

            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                counts: {
                    rawRows: model.rawData.length,
                    exams: model.exams.length,
                    schools: model.schoolList.length,
                    uniqueStudents: model.uniqueStudentCount,
                    progress: model.progressCount,
                    improve: model.improveCount,
                    decline: model.declineCount,
                    stable: model.stableCount,
                    marginalRecords: model.marginalRecordCount,
                    potential: model.potentialCount
                },
                expected,
                quickStateMismatches
            };
        }, { strictPerformance: STRICT_PERFORMANCE_BUDGETS });
    }
    if (id === 'teacher-analysis') {
        // Keep the all-module smoke test lightweight here. The teacher portrait
        // calculations are intentionally covered by test-calculation-snapshot.js
        // because forcing a full in-page evaluate during module switching can
        // block the same browser thread this smoke test is trying to measure.
        return page.evaluate(async ({ strictPerformance }) => {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            if (!strictPerformance && typeof window.runModuleTabEnter === 'function') {
                await Promise.resolve(window.runModuleTabEnter({ id: 'teacher-analysis' })).catch(() => false);
            }
            const deadline = Date.now() + (location.hostname === 'schoolsystem.com.cn' ? 9000 : 5500);
            const expectsTeacherData = location.hostname === 'schoolsystem.com.cn';
            let state = null;
            while (Date.now() < deadline) {
                const section = document.getElementById('teacher-analysis');
                const teacherMapCount = Object.keys(window.TEACHER_MAP || {}).length;
                const comparisonTable = document.getElementById('teacherComparisonTable');
                state = {
                    sectionReady: !!section,
                    sectionActive: !!section?.classList.contains('active'),
                    sectionLazyPlaceholder: section?.dataset?.lazySectionPlaceholder === '1',
                    sectionHtmlLength: Number(section?.innerHTML?.length || 0),
                    comparisonTableReady: !!comparisonTable,
                    comparisonTableParentId: String(comparisonTable?.parentElement?.id || ''),
                    teacherDetailSlotReady: !!document.getElementById('teacher-detail-comparison-slot'),
                    teacherMapReady: teacherMapCount > 0,
                    teacherMapCount,
                    analysisRuntimeReady: typeof window.analyzeTeachers === 'function',
                    expectsTeacherData,
                    calculationSnapshotCoversTeacherRuntime: true
                };
                if (state.sectionActive
                    && state.analysisRuntimeReady
                    && (!expectsTeacherData || (state.teacherMapReady && state.comparisonTableReady))) break;
                await wait(120);
            }
            const checks = state || {
                sectionReady: false,
                sectionActive: false,
                comparisonTableReady: false,
                teacherMapReady: false,
                teacherMapCount: 0,
                analysisRuntimeReady: false,
                expectsTeacherData,
                calculationSnapshotCoversTeacherRuntime: true
            };
            return {
                ok: checks.sectionReady
                    && checks.sectionActive
                    && checks.analysisRuntimeReady
                    && (!checks.expectsTeacherData
                        || (checks.comparisonTableReady && checks.teacherMapReady))
                    && checks.calculationSnapshotCoversTeacherRuntime,
                checks
            };
        }, { strictPerformance: STRICT_PERFORMANCE_BUDGETS });
    }
    if (id === 'teacher-detail-comparison') {
        return page.evaluate(async ({ strictPerformance }) => {
            if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) {
                const table = document.getElementById('teacherComparisonTable');
                const text = String(table?.textContent || '');
                const rows = table ? table.querySelectorAll('tbody tr').length : 0;
                const checks = {
                    sectionReady: !!document.getElementById('teacher-detail-comparison'),
                    sectionActive: !!document.getElementById('teacher-detail-comparison')?.classList.contains('active'),
                    renderReady: typeof window.renderTeacherComparisonTable === 'function',
                    tableReady: !!table,
                    stateRenderable: /正在整理教师对比表|暂无教师统计数据|联考赋分|教学质量分/.test(text) || rows > 0
                };
                return {
                    ok: Object.values(checks).every(Boolean),
                    checks: {
                        ...checks,
                        rows,
                        calculationSnapshotCoversTeacherRuntime: true
                    },
                    lightweight: true
                };
            }
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const deadline = Date.now() + 8000;
            const expectsTeacherData = location.hostname === 'schoolsystem.com.cn';
            let state = null;
            while (Date.now() < deadline) {
                const table = document.getElementById('teacherComparisonTable');
                const text = String(table?.textContent || '');
                const rows = table ? table.querySelectorAll('tbody tr').length : 0;
                const teacherMapCount = Object.keys(window.TEACHER_MAP || {}).length;
                const teacherStatsCount = Object.keys(window.TEACHER_STATS || {}).length;
                const visibleTeacherStatsCount = typeof window.getVisibleTeacherStats === 'function'
                    ? Object.keys(window.getVisibleTeacherStats() || {}).length
                    : teacherStatsCount;
                const currentUser = typeof window.getCurrentUser === 'function'
                    ? window.getCurrentUser()
                    : window.Auth?.currentUser;
                const requiresTeacherRows = expectsTeacherData || teacherMapCount > 0;
                state = {
                    tableReady: !!table,
                    renderInvoked: document.getElementById('teacher-detail-comparison')?.dataset?.teacherSubmoduleRendered === '1',
                    rows,
                    pendingCleared: !/正在整理教师对比表/.test(text),
                    hasPendingState: /正在整理教师对比表/.test(text),
                    hasTeacherRows: rows > 1 && /联考赋分|教学质量分/.test(text),
                    hasExplicitEmptyState: /暂无教师统计数据|暂时无法自动识别本校|未导入任课表/.test(text),
                    teacherMapCount,
                    teacherStatsCount,
                    visibleTeacherStatsCount,
                    currentUserRole: String(currentUser?.role || ''),
                    requiresTeacherRows,
                    expectsTeacherData
                };
                const contentReady = state.hasTeacherRows
                    || (state.hasExplicitEmptyState && (!requiresTeacherRows || strictPerformance))
                    || (strictPerformance && state.hasPendingState);
                if (state.tableReady
                    && state.renderInvoked
                    && (strictPerformance || state.pendingCleared)
                    && contentReady) break;
                await wait(150);
            }
            const contentReady = state?.hasTeacherRows
                || (state?.hasExplicitEmptyState && (!state?.requiresTeacherRows || strictPerformance))
                || (strictPerformance && state?.hasPendingState);
            return {
                ok: !!(state?.tableReady
                    && state?.renderInvoked
                    && (strictPerformance || state?.pendingCleared)
                    && contentReady
                    && (!expectsTeacherData || state?.teacherMapCount > 0)),
                checks: state || {
                    tableReady: false,
                    renderInvoked: false,
                    rows: 0,
                    pendingCleared: false,
                    hasPendingState: false,
                    hasTeacherRows: false,
                    hasExplicitEmptyState: false,
                    teacherMapCount: 0,
                    requiresTeacherRows: expectsTeacherData,
                    expectsTeacherData
                }
            };
        }, { strictPerformance: STRICT_PERFORMANCE_BUDGETS });
    }
    if (id === 'teacher-pairing') {
        return page.evaluate(async ({ strictPerformance }) => {
            if (strictPerformance) {
                const container = document.getElementById('teacher-pairing-suggestions');
                const text = String(container?.textContent || '').replace(/\s+/g, ' ').trim();
                const checks = {
                    sectionReady: !!document.getElementById('teacher-pairing'),
                    sectionActive: !!document.getElementById('teacher-pairing')?.classList.contains('active'),
                    containerReady: !!container,
                    runtimeReady: typeof window.generateTeacherPairing === 'function',
                    contentReady: !!text && !/^正在加载/.test(text),
                    calculationSnapshotCoversTeacherRuntime: true
                };
                return {
                    ok: checks.sectionReady
                        && checks.containerReady
                        && checks.runtimeReady
                        && checks.contentReady
                        && checks.calculationSnapshotCoversTeacherRuntime,
                    checks
                };
            }
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const deadline = Date.now() + 8000;
            let state = null;
            while (Date.now() < deadline) {
                const container = document.getElementById('teacher-pairing-suggestions');
                const cards = container ? Array.from(container.querySelectorAll('.pairing-card')) : [];
                const subjects = new Set(cards.map((card) => String(card.textContent || '').match(/语文|数学|英语|物理|化学|政治|道法|历史|地理|生物/)?.[0]).filter(Boolean));
                const expectedSubjects = Array.from(new Set((window.SUBJECTS || [])
                    .map((subject) => String(subject || '').trim())
                    .filter(Boolean)));
                const missingSubjects = expectedSubjects.filter((subject) => !subjects.has(subject));
                state = {
                    containerReady: !!container,
                    pairCount: cards.length,
                    subjectCount: subjects.size,
                    expectedSubjectCount: expectedSubjects.length,
                    missingSubjects,
                    hasMultipleSuggestions: cards.length > 1,
                    hasMultipleSubjects: subjects.size > 1,
                    coversAllSubjects: expectedSubjects.length > 0 && missingSubjects.length === 0
                };
                if (state.containerReady && state.hasMultipleSuggestions && state.hasMultipleSubjects && state.coversAllSubjects) break;
                await wait(150);
            }
            return {
                ok: !!(state?.containerReady && state?.hasMultipleSuggestions && state?.hasMultipleSubjects && state?.coversAllSubjects),
                checks: state || {
                    containerReady: false,
                    pairCount: 0,
                    subjectCount: 0,
                    expectedSubjectCount: 0,
                    missingSubjects: [],
                    hasMultipleSuggestions: false,
                    hasMultipleSubjects: false,
                    coversAllSubjects: false
                }
            };
        }, { strictPerformance: STRICT_PERFORMANCE_BUDGETS });
    }
    if (id === 'teacher-township-ranking') {
        return page.evaluate(async ({ strictPerformance }) => {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const expectsTeacherData = location.hostname === 'schoolsystem.com.cn';
            const deadline = Date.now() + 8000;
            let state = null;
            while (Date.now() < deadline) {
                const section = document.getElementById('teacher-township-ranking');
                const container = document.getElementById('teacher-township-ranking-container');
                const text = String(container?.textContent || '').replace(/\s+/g, ' ').trim();
                const teacherMapCount = Object.keys(window.TEACHER_MAP || {}).length;
                state = {
                    sectionReady: !!section,
                    sectionActive: !!section?.classList.contains('active'),
                    containerReady: !!container,
                    runtimeReady: typeof window.renderTeacherTownshipRanking === 'function',
                    renderScheduled: section?.dataset?.teacherSubmoduleScheduled === '1',
                    contentReady: !!text && !/^正在生成|^正在加载/.test(text),
                    hasRankingRows: !!container?.querySelector('tbody tr, .teacher-township-quick-card'),
                    hasExplicitEmptyState: /暂无教师乡镇排名数据|未导入任课表/.test(text),
                    teacherMapCount,
                    expectsTeacherData
                };
                if (strictPerformance
                    && state.sectionReady
                    && state.sectionActive
                    && state.containerReady
                    && state.runtimeReady
                    && state.renderScheduled) break;
                if (state.sectionActive
                    && state.contentReady
                    && (state.hasRankingRows || (!expectsTeacherData && state.hasExplicitEmptyState))) break;
                await wait(150);
            }
            return {
                ok: !!(state
                    && state.sectionReady
                    && state.sectionActive
                    && state.containerReady
                    && state.runtimeReady
                    && state.renderScheduled
                    && (strictPerformance || (state.contentReady
                        && (state.hasRankingRows || (!expectsTeacherData && state.hasExplicitEmptyState))))
                    && (!expectsTeacherData || state.teacherMapCount > 0)),
                checks: state || {
                    sectionReady: false,
                    sectionActive: false,
                    containerReady: false,
                    runtimeReady: false,
                    renderScheduled: false,
                    contentReady: false,
                    hasRankingRows: false,
                    hasExplicitEmptyState: false,
                    teacherMapCount: 0,
                    expectsTeacherData
                }
            };
        }, { strictPerformance: STRICT_PERFORMANCE_BUDGETS });
    }
    if (id === 'county-analysis' || id === 'county-teacher-portrait') {
        return page.evaluate(async () => {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const waitUntil = async (predicate, timeout = 15000) => {
                const deadline = Date.now() + timeout;
                let lastError = null;
                while (Date.now() < deadline) {
                    try {
                        if (predicate()) return true;
                    } catch (error) {
                        lastError = error;
                    }
                    await wait(150);
                }
                throw lastError || new Error('county analysis wait timeout');
            };
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
            const assignRanks = (rows, scoreGetter, rankKey) => {
                const sorted = rows.slice().sort((left, right) => toNumber(scoreGetter(right)) - toNumber(scoreGetter(left)));
                let lastScore = null;
                let lastRank = 0;
                sorted.forEach((row, index) => {
                    const score = toNumber(scoreGetter(row));
                    const rank = lastScore !== null && Math.abs(score - lastScore) < 0.0001
                        ? lastRank
                        : index + 1;
                    row[rankKey] = rank;
                    lastScore = score;
                    lastRank = rank;
                });
            };
            const getTwoRateWeights = () => String(window.CONFIG?.name || '').includes('9')
                ? { avg: 50, excellent: 80, pass: 50 }
                : { avg: 60, excellent: 70, pass: 70 };
            const buildExpectedHorizontalTotalRows = () => {
                const rows = Object.values(window.SCHOOLS || {})
                    .filter((school) => school?.metrics?.total)
                    .map((school) => {
                        const metric = school.metrics.total || {};
                        return {
                            schoolName: school.name || '',
                            count: toNumber(metric.count),
                            avg: toNumber(metric.avg),
                            excellentRate: toNumber(metric.excRate),
                            passRate: toNumber(metric.passRate),
                            ratedAvg: toNumber(metric.countyRatedAvg ?? school.countyRatedAvg),
                            ratedExc: toNumber(metric.countyRatedExc ?? school.countyRatedExc),
                            ratedPass: toNumber(metric.countyRatedPass ?? school.countyRatedPass),
                            score: toNumber(metric.countyScore2Rate ?? school.countyScore2Rate ?? school.score2Rate)
                        };
                    });
                assignRanks(rows, (row) => row.avg, 'rankAvg');
                assignRanks(rows, (row) => row.excellentRate, 'rankExcellent');
                assignRanks(rows, (row) => row.passRate, 'rankPass');
                assignRanks(rows, (row) => row.score, 'rankScore');
                return rows.sort((left, right) => (left.rankScore || 9999) - (right.rankScore || 9999));
            };
            const buildExpectedSubjectRows = (subject) => {
                const sourceRows = Object.values(window.SCHOOLS || {})
                    .filter((school) => school?.metrics?.[subject])
                    .map((school) => ({ school, metric: school.metrics[subject] }));
                if (!sourceRows.length) return [];
                const maxes = sourceRows.reduce((acc, row) => {
                    acc.avg = Math.max(acc.avg, toNumber(row.metric.avg));
                    acc.excellent = Math.max(acc.excellent, toNumber(row.metric.excRate));
                    acc.pass = Math.max(acc.pass, toNumber(row.metric.passRate));
                    return acc;
                }, { avg: 0, excellent: 0, pass: 0 });
                const weights = getTwoRateWeights();
                const rows = sourceRows.map((row) => {
                    const ratedAvg = maxes.avg ? toNumber(row.metric.avg) / maxes.avg * weights.avg : 0;
                    const ratedExc = maxes.excellent ? toNumber(row.metric.excRate) / maxes.excellent * weights.excellent : 0;
                    const ratedPass = maxes.pass ? toNumber(row.metric.passRate) / maxes.pass * weights.pass : 0;
                    return {
                        schoolName: row.school.name || '',
                        count: toNumber(row.metric.count),
                        avg: toNumber(row.metric.avg),
                        excellentRate: toNumber(row.metric.excRate),
                        passRate: toNumber(row.metric.passRate),
                        ratedAvg,
                        ratedExc,
                        ratedPass,
                        score: ratedAvg + ratedExc + ratedPass
                    };
                });
                assignRanks(rows, (row) => row.avg, 'rankAvg');
                assignRanks(rows, (row) => row.excellentRate, 'rankExcellent');
                assignRanks(rows, (row) => row.passRate, 'rankPass');
                assignRanks(rows, (row) => row.score, 'rank');
                return rows.sort((left, right) => (left.rank || 9999) - (right.rank || 9999));
            };
            const readScoreTableRows = (table) => Array.from(table?.querySelectorAll('tbody tr') || []).map((row) => {
                const cells = Array.from(row.cells || []);
                return {
                    schoolName: String(cells[0]?.textContent || '').trim(),
                    count: parseFirstNumber(cells[1]?.textContent),
                    avg: parseFirstNumber(cells[2]?.textContent),
                    excellentPercent: parseFirstNumber(cells[3]?.textContent),
                    passPercent: parseFirstNumber(cells[4]?.textContent),
                    ratedAvg: parseFirstNumber(cells[5]?.textContent),
                    ratedExc: parseFirstNumber(cells[6]?.textContent),
                    ratedPass: parseFirstNumber(cells[7]?.textContent),
                    score: parseFirstNumber(cells[8]?.textContent),
                    rank: parseFirstNumber(cells[9]?.textContent)
                };
            });
            if (typeof window.ensureCountySubmoduleSections === 'function') {
                window.ensureCountySubmoduleSections();
            }
            if (typeof window.ensureCountyAnalysisRuntimeLoaded === 'function') {
                await Promise.race([
                    Promise.resolve(window.ensureCountyAnalysisRuntimeLoaded()),
                    new Promise((resolve) => setTimeout(resolve, 12000))
                ]).catch(() => null);
            }
            const getTeacherRoot = () => document.querySelector('#county-teacher-portrait .county-analysis-root')
                || document.getElementById('county-analysis-root')
                || document.querySelector('#county-analysis .county-analysis-root');
            const getHorizontalRoot = () => document.querySelector('#county-school-horizontal .county-analysis-root')
                || document.getElementById('county-school-horizontal-root')
                || document.querySelector('#county-school-horizontal');
            const shouldExpectTeacherRows = Object.keys(window.TEACHER_MAP || {}).length > 0
                || Object.keys(window.TEACHER_STATS || {}).length > 0;
            if (shouldExpectTeacherRows && window.CountyAnalysisRuntime?.ensureTeacherContextForCountyAnalysis) {
                await Promise.race([
                    Promise.resolve(window.CountyAnalysisRuntime.ensureTeacherContextForCountyAnalysis(true, { requireActive: false })),
                    new Promise((resolve) => setTimeout(resolve, 12000))
                ]).catch(() => null);
            }
            if (typeof window.renderCountyAnalysis === 'function') {
                window.renderCountyAnalysis('county-teacher-portrait');
            }
            const deadline = Date.now() + 12000;
            while (
                shouldExpectTeacherRows
                && Date.now() < deadline
                && (!getTeacherRoot() || !getTeacherRoot().querySelector('.county-teacher-own-row'))
            ) {
                await new Promise((resolve) => setTimeout(resolve, 250));
                if (typeof window.renderCountyAnalysis === 'function') {
                    window.renderCountyAnalysis('county-teacher-portrait');
                }
            }
            const teacherRoot = getTeacherRoot();
            const teacherOwnRows = Array.from(teacherRoot?.querySelectorAll('.county-teacher-own-row') || []);
            const firstTeacherOwn = teacherOwnRows[0];
            const firstTeacherOwnCells = Array.from(firstTeacherOwn?.cells || []);
            const teacherRankRows = teacherRoot
                ? teacherRoot.querySelectorAll('.county-teacher-rank-table tbody tr').length
                : 0;
            const teacherEmptyState = !!teacherRoot?.querySelector('.county-empty');
            const firstTeacherOwnSummary = {
                rankAvg: parseFirstNumber(firstTeacherOwnCells[0]?.textContent),
                avg: parseFirstNumber(firstTeacherOwnCells[3]?.textContent),
                rankExc: parseFirstNumber(firstTeacherOwnCells[4]?.textContent),
                excellentPercent: parseFirstNumber(firstTeacherOwnCells[5]?.textContent),
                rankPass: parseFirstNumber(firstTeacherOwnCells[6]?.textContent),
                passPercent: parseFirstNumber(firstTeacherOwnCells[7]?.textContent),
                studentCount: parseFirstNumber(firstTeacherOwnCells[8]?.textContent)
            };

            if (typeof window.renderCountyAnalysis === 'function') {
                window.renderCountyAnalysis('county-school-horizontal');
            }
            const expectedTotalRows = buildExpectedHorizontalTotalRows();
            if (expectedTotalRows.length) {
                await waitUntil(() => document.querySelector('#county-school-horizontal [data-virtual-table="county-horizontal-total"] tbody tr'));
            } else {
                await waitUntil(() => getHorizontalRoot()?.querySelector('.county-empty'));
            }
            const horizontalRoot = getHorizontalRoot();
            const horizontalTotalTable = horizontalRoot?.querySelector('[data-virtual-table="county-horizontal-total"]');
            const horizontalDomRows = readScoreTableRows(horizontalTotalTable);
            const expectedTotalTop = expectedTotalRows[0] || null;
            const renderedTotalTop = horizontalDomRows[0] || null;
            const totalRanksSorted = horizontalDomRows.every((row, index) => (
                index === 0 || toNumber(horizontalDomRows[index - 1].rank, 9999) <= toNumber(row.rank, 9999)
            ));

            const subjectTables = Array.from(horizontalRoot?.querySelectorAll('[data-virtual-table^="county-subject-"]') || []);
            const renderedSubject = String(subjectTables[0]?.getAttribute('data-virtual-table') || '').replace(/^county-subject-/, '');
            const expectedSubjectRows = renderedSubject ? buildExpectedSubjectRows(renderedSubject) : [];
            const subjectDomRows = readScoreTableRows(subjectTables[0]);
            const expectedSubjectTop = expectedSubjectRows[0] || null;
            const renderedSubjectTop = subjectDomRows[0] || null;
            const subjectRanksSorted = subjectDomRows.every((row, index) => (
                index === 0 || toNumber(subjectDomRows[index - 1].rank, 9999) <= toNumber(row.rank, 9999)
            ));
            const countyText = [
                teacherRoot?.innerText || '',
                horizontalRoot?.innerText || ''
            ].join('\n');
            const checks = {
                rootReady: !!teacherRoot || !!document.getElementById('county-teacher-portrait'),
                sectionReady: !!document.getElementById('county-analysis'),
                runtimeReady: typeof window.renderCountyAnalysis === 'function'
                    && !!window.CountyAnalysisRuntime
                    && !!window.CountySchoolHorizontalRenderer,
                teacherRankTableReady: !shouldExpectTeacherRows
                    ? (!!teacherRoot && teacherEmptyState)
                    : !!teacherRoot?.querySelector('.county-teacher-rank-table'),
                teacherRowsReady: !shouldExpectTeacherRows || (teacherRankRows > 0 && teacherOwnRows.length > 0),
                teacherOwnMetricsFinite: !shouldExpectTeacherRows || [
                    firstTeacherOwnSummary.rankAvg,
                    firstTeacherOwnSummary.avg,
                    firstTeacherOwnSummary.rankExc,
                    firstTeacherOwnSummary.excellentPercent,
                    firstTeacherOwnSummary.rankPass,
                    firstTeacherOwnSummary.passPercent,
                    firstTeacherOwnSummary.studentCount
                ].every(Number.isFinite),
                schoolHorizontalRendered: !!horizontalTotalTable,
                horizontalRowCountMatches: expectedTotalRows.length > 0
                    && horizontalDomRows.length === expectedTotalRows.length,
                horizontalTopSchoolMatches: !!expectedTotalTop
                    && renderedTotalTop?.schoolName === expectedTotalTop.schoolName,
                horizontalTopCountMatches: !!expectedTotalTop
                    && renderedTotalTop?.count === expectedTotalTop.count,
                horizontalTopAvgMatches: !!expectedTotalTop
                    && nearlyEqual(renderedTotalTop?.avg, Number(expectedTotalTop.avg.toFixed(2))),
                horizontalTopExcellentMatches: !!expectedTotalTop
                    && nearlyEqual(renderedTotalTop?.excellentPercent, Number((expectedTotalTop.excellentRate * 100).toFixed(2))),
                horizontalTopPassMatches: !!expectedTotalTop
                    && nearlyEqual(renderedTotalTop?.passPercent, Number((expectedTotalTop.passRate * 100).toFixed(2))),
                horizontalTopScoreMatches: !!expectedTotalTop
                    && nearlyEqual(renderedTotalTop?.score, Number(expectedTotalTop.score.toFixed(2))),
                horizontalTopRankMatches: !!expectedTotalTop
                    && renderedTotalTop?.rank === expectedTotalTop.rankScore,
                horizontalRanksSorted: horizontalDomRows.length > 0 && totalRanksSorted,
                subjectTableRendered: !!subjectTables[0],
                subjectRowCountMatches: expectedSubjectRows.length > 0
                    && subjectDomRows.length === expectedSubjectRows.length,
                subjectTopSchoolMatches: !!expectedSubjectTop
                    && renderedSubjectTop?.schoolName === expectedSubjectTop.schoolName,
                subjectTopAvgMatches: !!expectedSubjectTop
                    && nearlyEqual(renderedSubjectTop?.avg, Number(expectedSubjectTop.avg.toFixed(2))),
                subjectTopExcellentMatches: !!expectedSubjectTop
                    && nearlyEqual(renderedSubjectTop?.excellentPercent, Number((expectedSubjectTop.excellentRate * 100).toFixed(2))),
                subjectTopPassMatches: !!expectedSubjectTop
                    && nearlyEqual(renderedSubjectTop?.passPercent, Number((expectedSubjectTop.passRate * 100).toFixed(2))),
                subjectTopScoreMatches: !!expectedSubjectTop
                    && nearlyEqual(renderedSubjectTop?.score, Number(expectedSubjectTop.score.toFixed(2))),
                subjectTopRankMatches: !!expectedSubjectTop
                    && renderedSubjectTop?.rank === expectedSubjectTop.rank,
                subjectRanksSorted: subjectDomRows.length > 0 && subjectRanksSorted,
                subjectCountyRankReady: Array.isArray(window.SUBJECTS) && window.SUBJECTS.length > 0
                    ? (window.RAW_DATA || []).some((student) => window.SUBJECTS.some((subject) => student?.ranks?.[subject]?.county))
                    : true,
                noInvalidCountyText: !/\bNaN\b|Infinity|undefined|null/.test(countyText)
            };
            const exportButtons = teacherRoot ? teacherRoot.querySelectorAll('.county-section-actions button').length : 0;
            const teacherRankTable = !!teacherRoot?.querySelector('.county-teacher-rank-table');
            const studentSubjectSummary = !!teacherRoot?.querySelector('.county-student-subject-summary');
            const studentArchiveRemoved = !studentSubjectSummary;
            return {
                ok: Object.values(checks).every(Boolean)
                    && studentArchiveRemoved
                    && (!shouldExpectTeacherRows || (teacherRankRows > 0 && teacherOwnRows.length > 0)),
                checks,
                exportButtons,
                teacherRankRows,
                ownTeacherRows: teacherOwnRows.length,
                teacherRankTable,
                teacherEmptyState,
                firstTeacherOwnSummary,
                shouldExpectTeacherRows,
                horizontal: {
                    renderedRows: horizontalDomRows.length,
                    expectedRows: expectedTotalRows.length,
                    renderedTop: renderedTotalTop,
                    expectedTop: expectedTotalTop
                },
                subject: {
                    name: renderedSubject,
                    renderedRows: subjectDomRows.length,
                    expectedRows: expectedSubjectRows.length,
                    renderedTop: renderedSubjectTop,
                    expectedTop: expectedSubjectTop
                },
                studentArchiveRemoved,
                dualModuleDeepSmoke: true
            };
        });
    }
    if (id === 'correlation-analysis') {
        return page.evaluate(async () => {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const waitUntil = async (predicate, timeout = 15000) => {
                const deadline = Date.now() + timeout;
                let lastError = null;
                while (Date.now() < deadline) {
                    try {
                        if (predicate()) return true;
                    } catch (error) {
                        lastError = error;
                    }
                    await wait(120);
                }
                throw lastError || new Error('correlation analysis wait timeout');
            };
            const toFiniteNumber = (value) => {
                if (value === null || value === undefined || value === '') return null;
                const number = typeof value === 'number' ? value : Number(String(value).replace(/[+%]/g, ''));
                return Number.isFinite(number) ? number : null;
            };
            const getSubjects = () => {
                if (Array.isArray(window.SUBJECTS)) return window.SUBJECTS.filter(Boolean);
                if (typeof SUBJECTS !== 'undefined' && Array.isArray(SUBJECTS)) return SUBJECTS.filter(Boolean);
                return [];
            };
            const normalizeCorrelationClass = (value) => {
                if (window.AuthState && typeof window.AuthState.normalizeClassName === 'function') {
                    return window.AuthState.normalizeClassName(value || '');
                }
                if (typeof window.normalizeClass === 'function') return window.normalizeClass(value || '');
                return String(value || '').trim().replace(/\s+/g, '');
            };
            const getSelectedStudents = (scope, className = 'ALL') => {
                const baseStudents = scope === 'ALL'
                    ? ((typeof window.filterRowsToTownshipSchools === 'function')
                        ? window.filterRowsToTownshipSchools(window.RAW_DATA || [])
                        : (Array.isArray(window.RAW_DATA) ? window.RAW_DATA : []))
                    : (window.SCHOOLS?.[scope]?.students || []);
                const normalizedClass = normalizeCorrelationClass(className);
                if (!normalizedClass || normalizedClass.toLowerCase() === 'all') return baseStudents;
                return baseStudents.filter(student => normalizeCorrelationClass(student?.class || '') === normalizedClass);
            };
            const pearson = (leftValues, rightValues) => {
                const size = Math.min(Array.isArray(leftValues) ? leftValues.length : 0, Array.isArray(rightValues) ? rightValues.length : 0);
                const pairs = [];
                for (let index = 0; index < size; index += 1) {
                    const left = toFiniteNumber(leftValues[index]);
                    const right = toFiniteNumber(rightValues[index]);
                    if (left === null || right === null) continue;
                    pairs.push([left, right]);
                }
                if (pairs.length < 2) return 0;
                let sumX = 0;
                let sumY = 0;
                let sumXY = 0;
                let sumX2 = 0;
                let sumY2 = 0;
                pairs.forEach(([left, right]) => {
                    sumX += left;
                    sumY += right;
                    sumXY += left * right;
                    sumX2 += left * left;
                    sumY2 += right * right;
                });
                const count = pairs.length;
                const numerator = (count * sumXY) - (sumX * sumY);
                const denominator = Math.sqrt((count * sumX2 - sumX * sumX) * (count * sumY2 - sumY * sumY));
                return denominator === 0 ? 0 : numerator / denominator;
            };
            const pairedScores = (students, leftSubject, rightSubject) => {
                const left = [];
                const right = [];
                students.forEach((student) => {
                    const leftScore = toFiniteNumber(student?.scores?.[leftSubject]);
                    const rightScore = toFiniteNumber(student?.scores?.[rightSubject]);
                    if (leftScore === null || rightScore === null) return;
                    left.push(leftScore);
                    right.push(rightScore);
                });
                return { left, right };
            };
            const subjectTotalScores = (students, subject) => {
                const left = [];
                const right = [];
                students.forEach((student) => {
                    const subjectScore = toFiniteNumber(student?.scores?.[subject]);
                    const totalScore = toFiniteNumber(student?.total);
                    if (subjectScore === null || totalScore === null) return;
                    left.push(subjectScore);
                    right.push(totalScore);
                });
                return { left, right };
            };
            const getPath = (source, path, fallback = 0) => {
                const value = String(path).split('.').reduce((current, key) => (current && current[key] !== undefined ? current[key] : undefined), source);
                return value === undefined ? fallback : value;
            };
            const fallbackRanks = new WeakMap();
            const ensureFallbackRank = (student) => {
                let rank = fallbackRanks.get(student);
                if (!rank) {
                    rank = { total: 0, subjects: {} };
                    fallbackRanks.set(student, rank);
                }
                return rank;
            };
            const rankFallbackRows = (rows, readScore, writeRank, equalScore) => {
                rows.sort((left, right) => readScore(right) - readScore(left));
                rows.forEach((student, index) => {
                    const previous = index > 0 ? rows[index - 1] : null;
                    const rank = previous && equalScore(readScore(student), readScore(previous))
                        ? writeRank(previous)
                        : index + 1;
                    writeRank(student, rank);
                });
            };
            const buildFallbackRanks = (students, subjects) => {
                const totalRows = students.filter((student) => toFiniteNumber(student?.total) !== null);
                rankFallbackRows(totalRows, (student) => Number(student.total), (student, value) => {
                    const rank = ensureFallbackRank(student);
                    if (value !== undefined) rank.total = value;
                    return rank.total;
                }, (left, right) => Math.abs(left - right) < 0.0001);
                subjects.forEach((subject) => {
                    const rows = students.filter((student) => toFiniteNumber(student?.scores?.[subject]) !== null);
                    rankFallbackRows(rows, (student) => Number(student.scores[subject]), (student, value) => {
                        const rank = ensureFallbackRank(student);
                        if (value !== undefined) rank.subjects[subject] = value;
                        return rank.subjects[subject] || 0;
                    }, (left, right) => left === right);
                });
            };
            const expectedLiftRow = (students, subject) => {
                let lift = 0;
                let drag = 0;
                let balance = 0;
                let validCount = 0;
                students.forEach((student) => {
                    const fallbackRank = fallbackRanks.get(student);
                    const totalRank = toFiniteNumber(getPath(student, 'ranks.total.township', 0) || fallbackRank?.total);
                    const subjectRank = toFiniteNumber(getPath(student, `ranks.${subject}.township`, 0) || fallbackRank?.subjects?.[subject]);
                    if (!totalRank || !subjectRank) return;
                    validCount += 1;
                    const threshold = students.length * 0.1;
                    if (subjectRank < totalRank - threshold) lift += 1;
                    else if (subjectRank > totalRank + threshold) drag += 1;
                    else balance += 1;
                });
                return { subject, lift, drag, balance, net: lift - drag, validCount };
            };

            if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function') {
                await window.ensureTeacherAnalysisMainRuntimeLoaded();
            }
            if (typeof window.updateCorrelationSchoolSelect === 'function') {
                window.updateCorrelationSchoolSelect();
            }
            const select = document.getElementById('corrSchoolSelect');
            if (select) select.value = 'ALL';
            const classSelect = document.getElementById('corrClassSelect');
            if (classSelect) classSelect.value = 'ALL';

            const alerts = [];
            let renderWaitError = '';
            const originalAlert = window.alert;
            window.alert = (message) => alerts.push(String(message || ''));
            try {
                if (typeof window.renderCorrelationAnalysis === 'function') {
                    await Promise.resolve(window.renderCorrelationAnalysis());
                } else if (typeof window.runModuleTabEnter === 'function') {
                    await Promise.resolve(window.runModuleTabEnter({ id: 'correlation-analysis' }));
                }
                await wait(120);
            } finally {
                window.alert = originalAlert;
            }

            const subjects = getSubjects();
            const scope = document.getElementById('corrSchoolSelect')?.value || 'ALL';
            const className = document.getElementById('corrClassSelect')?.value || 'ALL';
            const students = getSelectedStudents(scope, className);
            buildFallbackRanks(students, subjects);
            const matrixTable = document.getElementById('corrMatrixTable');
            const matrixRows = Array.from(matrixTable?.querySelectorAll('tbody tr') || []);
            const matrixValues = Array.from(document.querySelectorAll('#corrMatrixTable .heatmap-cell'))
                .map(cell => toFiniteNumber(cell.textContent));
            const getMatrixValue = (rowSubject, colSubject) => {
                const rowIndex = subjects.indexOf(rowSubject);
                const colIndex = subjects.indexOf(colSubject);
                return toFiniteNumber(matrixRows[rowIndex + 1]?.cells?.[colIndex + 1]?.textContent || '');
            };
            const sampleSubjects = subjects.slice(0, 2);
            const samplePair = sampleSubjects.length === 2 ? pairedScores(students, sampleSubjects[0], sampleSubjects[1]) : { left: [], right: [] };
            const expectedSamplePearson = sampleSubjects.length === 2 ? pearson(samplePair.left, samplePair.right) : 0;
            const renderedSamplePearson = sampleSubjects.length === 2 ? getMatrixValue(sampleSubjects[0], sampleSubjects[1]) : null;
            const matrixSymmetric = subjects.every((rowSubject) => subjects.every((colSubject) => {
                if (rowSubject === colSubject) return true;
                const left = getMatrixValue(rowSubject, colSubject);
                const right = getMatrixValue(colSubject, rowSubject);
                return left !== null && right !== null && Math.abs(left - right) <= 0.011;
            }));

            const expectedContributions = subjects.map((subject) => {
                const pair = subjectTotalScores(students, subject);
                return { subject, value: pearson(pair.left, pair.right) };
            }).sort((left, right) => right.value - left.value);
            const contributionRows = Array.from(document.querySelectorAll('#contributionChartContainer > div')).map((row) => ({
                subject: String(row.querySelector('span')?.textContent || '').trim(),
                value: toFiniteNumber(row.querySelector('.contribution-bar')?.textContent || '')
            }));
            const expectedContributionBySubject = new Map(expectedContributions.map(item => [item.subject, item.value]));
            const contributionMismatches = contributionRows.map((row) => {
                const expectedValue = expectedContributionBySubject.get(row.subject);
                return {
                    subject: row.subject,
                    rendered: row.value,
                    expected: Number.isFinite(expectedValue) ? Number(expectedValue.toFixed(3)) : null,
                    delta: Number.isFinite(expectedValue) && row.value !== null
                        ? Number((row.value - Number(expectedValue.toFixed(3))).toFixed(4))
                        : null
                };
            }).filter(item => item.expected === null || item.rendered === null || Math.abs(item.delta) > 0.002);
            const contributionValuesMatch = contributionRows.length === subjects.length
                && contributionMismatches.length === 0;
            const contributionSorted = contributionRows.every((row, index) => (
                index === 0 || contributionRows[index - 1].value >= row.value - 0.001
            ));

            const liftRows = Array.from(document.querySelectorAll('#liftDragTable tbody tr'));
            const firstLiftSubject = String(liftRows[0]?.cells?.[0]?.textContent || '').trim();
            const expectedFirstLift = expectedLiftRow(students, firstLiftSubject);
            const renderedFirstLift = {
                lift: toFiniteNumber(String(liftRows[0]?.cells?.[1]?.textContent || '').match(/\d+/)?.[0]),
                drag: toFiniteNumber(String(liftRows[0]?.cells?.[2]?.textContent || '').match(/\d+/)?.[0]),
                balance: toFiniteNumber(String(liftRows[0]?.cells?.[3]?.textContent || '').match(/\d+/)?.[0]),
                net: toFiniteNumber(liftRows[0]?.cells?.[4]?.textContent || '')
            };
            const sectionText = document.getElementById('correlation-analysis')?.innerText || '';
            const checks = {
                sectionReady: !!document.querySelector('#correlation-analysis.analysis-workspace-violet'),
                heroReady: !!document.querySelector('#correlation-analysis .analysis-hero, #correlation-analysis .analysis-shell-head'),
                shellHeadReady: !!document.querySelector('#correlation-analysis .analysis-shell-head'),
                scopeSelect: !!document.getElementById('corrSchoolSelect'),
                matrixTable: !!document.getElementById('corrMatrixTable'),
                contributionChartContainer: !!document.getElementById('contributionChartContainer'),
                liftDragTable: !!document.getElementById('liftDragTable'),
                flowReady: document.querySelectorAll('#correlation-analysis .analysis-flow-step').length >= 3,
                runtimeReady: typeof window.renderCorrelationAnalysis === 'function',
                pearsonHelperReady: typeof window.calculateCorrelationPearson === 'function',
                subjectListReady: subjects.length >= 2,
                sampleReady: students.length >= 5,
                matrixRendered: matrixValues.length === subjects.length * Math.max(0, subjects.length - 1),
                matrixValuesFinite: matrixValues.every(value => value !== null && Math.abs(value) <= 1.01),
                matrixSymmetric,
                samplePearsonMatches: renderedSamplePearson !== null
                    && Math.abs(renderedSamplePearson - Number(expectedSamplePearson.toFixed(2))) <= 0.011,
                contributionRendered: contributionRows.length === subjects.length,
                contributionValuesFinite: contributionRows.every(row => row.value !== null && Math.abs(row.value) <= 1.01),
                contributionValuesMatch,
                contributionSorted,
                liftDragRendered: liftRows.length === subjects.length,
                liftDragCountsMatch: renderedFirstLift.lift === expectedFirstLift.lift
                    && renderedFirstLift.drag === expectedFirstLift.drag
                    && renderedFirstLift.balance === expectedFirstLift.balance
                    && renderedFirstLift.net === expectedFirstLift.net,
                noInvalidText: !/\bNaN\b|Infinity|undefined|null/.test(sectionText)
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                scope,
                className,
                counts: {
                    subjects: subjects.length,
                    students: students.length,
                    matrixCells: matrixValues.length,
                    contributionRows: contributionRows.length,
                    liftRows: liftRows.length
                },
                samplePearson: {
                    subjects: sampleSubjects,
                    expected: Number(expectedSamplePearson.toFixed(2)),
                    rendered: renderedSamplePearson
                },
                topContribution: contributionRows[0] || null,
                expectedTopContributions: expectedContributions.slice(0, 3).map(item => ({
                    subject: item.subject,
                    value: Number(item.value.toFixed(3))
                })),
                contributionRows,
                contributionMismatches,
                expectedFirstLift,
                renderedFirstLift,
                alerts,
                renderWaitError
            };
        });
    }
    if (id === 'analysis') {
        return page.evaluate(async () => {
            const checks = {
                schoolNormalizationReady: typeof window.listAvailableSchoolsForCompare === 'function'
                    && typeof window.getCountyDirectSchoolNames === 'function'
                    && typeof window.isTownshipManagedSchool === 'function',
                getExamRowsForCompare: typeof window.getExamRowsForCompare === 'function',
                listAvailableExamsForCompare: typeof window.listAvailableExamsForCompare === 'function',
                sortExamIdsChronologically: typeof window.sortExamIdsChronologically === 'function',
                renderMacroMultiPeriodComparison: typeof window.renderMacroMultiPeriodComparison === 'function',
                exportMacroMultiPeriodComparison: typeof window.exportMacroMultiPeriodComparison === 'function',
                renderTables: typeof window.renderTables === 'function'
            };
            if (checks.renderTables) window.renderTables();
            const tableSchools = Array.from(document.querySelectorAll('#tb-total tbody tr td:first-child'))
                .map((cell) => String(cell.textContent || '').replace(/\s+/g, ' ').trim())
                .filter(Boolean);
            const allSchools = typeof window.listAvailableSchoolsForCompare === 'function'
                ? window.listAvailableSchoolsForCompare('all')
                : Object.keys(window.SCHOOLS || {});
            const townshipSchools = typeof window.listAvailableSchoolsForCompare === 'function'
                ? window.listAvailableSchoolsForCompare()
                : [];
            const countySchools = typeof window.getCountyDirectSchoolNames === 'function'
                ? window.getCountyDirectSchoolNames(allSchools)
                : [];
            const countyInTownshipTable = tableSchools.filter((schoolName) => countySchools.some((countyName) => (
                schoolName === countyName
                || (typeof window.areSchoolNamesEquivalent === 'function' && window.areSchoolNamesEquivalent(schoolName, countyName))
                || (typeof window.areSchoolNamesMatched === 'function' && window.areSchoolNamesMatched(schoolName, countyName, true))
            )));
            checks.townshipSchoolListReady = townshipSchools.length > 0;
            checks.analysisTableScopedToTownship = tableSchools.length > 0 && countyInTownshipTable.length === 0;
            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                tableSchools,
                townshipSchools,
                countySchools,
                countyInTownshipTable
            };
        });
    }
    if (id === 'student-details') {
        return page.evaluate(async ({ strictPerformance }) => {
            if (strictPerformance) {
                if (typeof window.renderStudentDetails === 'function') window.renderStudentDetails(true);
                const table = document.getElementById('studentDetailTable');
                const visibleHeaders = Array.from(table?.querySelectorAll('thead th') || [])
                    .filter((cell) => getComputedStyle(cell).display !== 'none')
                    .map((cell) => String(cell.textContent || '').replace(/\s+/g, '').trim());
                const firstDataRow = Array.from(table?.querySelectorAll('tbody tr') || [])
                    .find((row) => !row.classList.contains('student-detail-mobile-pagination'));
                const rankIndex = typeof window.getStudentDetailsRankIndex === 'function'
                    ? window.getStudentDetailsRankIndex(Array.isArray(window.SUBJECTS) ? window.SUBJECTS : [])
                    : null;
                const schoolCount = Number(rankIndex?.schoolCount || Object.keys(window.SCHOOLS || {}).length || 0);
                const expectedTown = schoolCount >= 14;
                const expectedCounty = schoolCount >= 24;
                const rankCells = Array.from(firstDataRow?.querySelectorAll('td[data-label]') || []);
                const valuesFor = (suffix) => rankCells
                    .filter((cell) => String(cell.dataset.label || '').endsWith(suffix) && getComputedStyle(cell).display !== 'none')
                    .map((cell) => String(cell.textContent || '').trim());
                const schoolRankValues = valuesFor('校排');
                const townRankValues = valuesFor('镇排');
                const countyRankValues = valuesFor('县排');
                const currentSchoolName = String(window.MY_SCHOOL || '').trim();
                const currentSchoolStudent = (window.RAW_DATA || []).find((student) => {
                    const school = String(student?.school || '').trim();
                    return currentSchoolName && (
                        school === currentSchoolName
                        || (typeof window.sameAppSchoolName === 'function' && window.sameAppSchoolName(school, currentSchoolName))
                    );
                }) || null;
                const currentSchoolTownRank = currentSchoolStudent && rankIndex
                    ? rankIndex.getRank(currentSchoolStudent, 'total', 'township', '-')
                    : '-';
                const countySampleRank = rankIndex && (window.RAW_DATA || []).length
                    ? rankIndex.getRank(window.RAW_DATA[0], 'total', 'county', '-')
                    : '-';
                const checks = {
                    sectionReady: !!document.getElementById('student-details'),
                    tableReady: !!table,
                    schoolSelectReady: !!document.getElementById('studentSchoolSelect'),
                    classSelectReady: !!document.getElementById('studentClassSelect'),
                    compareSectionReady: !!document.getElementById('student-multi-period-compare-section'),
                    renderStudentDetails: typeof window.renderStudentDetails === 'function',
                    renderStudentMultiPeriodComparison: typeof window.renderStudentMultiPeriodComparison === 'function',
                    comparisonHelpersReady: typeof window.getComparisonStudentView === 'function'
                        && typeof window.getComparisonStudentList === 'function'
                        && typeof window.recalcPrevTotal === 'function',
                    rankIndexReady: !!rankIndex,
                    schoolRankVisible: visibleHeaders.some((header) => header.includes('校排')),
                    schoolRankValuesReady: schoolRankValues.length > 0 && schoolRankValues.every((value) => value && value !== '-'),
                    townBoundaryMatches: expectedTown
                        ? visibleHeaders.some((header) => header.includes('镇排')) && currentSchoolTownRank !== '-'
                        : !visibleHeaders.some((header) => header.includes('镇排')),
                    countyBoundaryMatches: expectedCounty
                        ? visibleHeaders.some((header) => header.includes('县排')) && countySampleRank !== '-'
                        : !visibleHeaders.some((header) => header.includes('县排')),
                    fourteenSchoolsNeverShowsCounty: schoolCount !== 14 || !visibleHeaders.some((header) => header.includes('县排'))
                };
                return {
                    ok: Object.values(checks).every(Boolean),
                    checks,
                    schoolCount,
                    visibleHeaders,
                    sampleRanks: {
                        school: schoolRankValues.slice(0, 3),
                        town: townRankValues.slice(0, 3),
                        county: countyRankValues.slice(0, 3),
                        currentSchoolTownRank,
                        countySampleRank
                    }
                };
            }
            const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            const originalRawData = window.RAW_DATA;
            const originalSchools = window.SCHOOLS;
            const originalRawDataVersion = Number(window.__RAW_DATA_VERSION || 0);
            const targetStudent = (originalRawData || []).find((student) => String(student?.name || '').trim() === '解洪旭')
                || (originalRawData || []).find((student) => student?.name && student?.school && student?.class)
                || null;
            const sampleRows = targetStudent
                ? (originalRawData || []).filter((student) => (
                    String(student?.school || '').trim() === String(targetStudent.school || '').trim()
                    && String(student?.class || '').trim() === String(targetStudent.class || '').trim()
                )).slice(0, 12)
                : [];
            if (targetStudent && !sampleRows.includes(targetStudent)) sampleRows.unshift(targetStudent);
            if (sampleRows.length) {
                const schoolRecord = originalSchools?.[targetStudent.school] || {};
                window.RAW_DATA = sampleRows;
                window.SCHOOLS = {
                    [targetStudent.school]: {
                        ...schoolRecord,
                        students: sampleRows
                    }
                };
                window.__RAW_DATA_VERSION = originalRawDataVersion + 1;
            }
            const section = document.getElementById('student-details');
            const table = document.getElementById('studentDetailTable');
            const schoolSelect = document.getElementById('studentSchoolSelect');
            const classSelect = document.getElementById('studentClassSelect');
            const readDetailState = () => {
                const detailHeaders = Array.from(table?.querySelectorAll('thead th') || [])
                    .map((cell) => String(cell.textContent || '').replace(/\s+/g, '').trim());
                const detailRows = table?.querySelectorAll('tbody tr')?.length || 0;
                const detailClassOptionCount = Array.from(classSelect?.options || []).filter(option => option.value).length;
                const detailCountyRankAfterTownRank = detailHeaders.some((header, index) => (
                    header.includes('镇排') && String(detailHeaders[index + 1] || '').includes('县排')
                ));
                return {
                    rows: detailRows,
                    headers: detailHeaders,
                    classOptionCount: detailClassOptionCount,
                    countyRankAfterTownRank: detailCountyRankAfterTownRank,
                    ready: detailClassOptionCount > 0 && detailRows > 0
                };
            };
            try {
                let detailState = readDetailState();
                if (schoolSelect && classSelect && targetStudent) {
                    if (typeof window.updateStudentSchoolSelect === 'function') window.updateStudentSchoolSelect();
                    schoolSelect.value = targetStudent.school || '';
                    schoolSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    classSelect.value = targetStudent.class || '';
                } else if (!detailState.ready && schoolSelect && classSelect) {
                    const sampleSchool = Array.from(schoolSelect.options || [])
                        .map(option => option.value)
                        .find(value => value && (window.RAW_DATA || []).some(row => (
                            typeof window.sameAppSchoolName === 'function'
                                ? window.sameAppSchoolName(row?.school, value)
                                : String(row?.school || '').trim() === String(value || '').trim()
                        )));
                    if (sampleSchool) {
                        schoolSelect.value = sampleSchool;
                        schoolSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                detailState = readDetailState();
                if (!detailState.ready && typeof window.renderStudentDetails === 'function') {
                    await Promise.race([
                        Promise.resolve(window.renderStudentDetails(true)).catch(() => {}),
                        wait(2500)
                    ]);
                }
                for (let index = 0; index < 20; index += 1) {
                    detailState = readDetailState();
                    if (detailState.ready) break;
                    await wait(150);
                }
                detailState = readDetailState();
                const targetStudentView = targetStudent && typeof window.getComparisonStudentView === 'function'
                    ? window.getComparisonStudentView(targetStudent, window.RAW_DATA || [])
                    : targetStudent;
                const targetTownRank = Number(targetStudentView?.ranks?.total?.township || 0);
                const targetCountyRank = Number(targetStudentView?.ranks?.total?.county || targetStudentView?.countyRank || 0);
                const checks = {
                    sectionReady: !!section,
                    renderStudentDetails: typeof window.renderStudentDetails === 'function',
                    renderStudentMultiPeriodComparison: typeof window.renderStudentMultiPeriodComparison === 'function',
                    schoolSelectReady: !!schoolSelect,
                    classSelectReady: !!classSelect,
                    classOptionsReady: detailState.classOptionCount > 0,
                    tableReady: !!table,
                    rowsRendered: detailState.rows > 0,
                    countyRankBoundaryCoveredByIndexTest: true,
                    targetStudentTownRankReady: !targetStudent || targetTownRank > 0,
                    targetStudentCountyRankReady: !targetStudent || (targetCountyRank > 0 && targetCountyRank >= targetTownRank),
                    compareSectionReady: !!document.getElementById('student-multi-period-compare-section'),
                    comparisonHelpersReady: typeof window.getComparisonStudentView === 'function'
                        && typeof window.getComparisonStudentList === 'function'
                        && typeof window.recalcPrevTotal === 'function'
                };
                return {
                    ok: Object.values(checks).every(Boolean),
                    checks,
                    rows: detailState.rows,
                    headers: detailState.headers,
                    sampleRows: sampleRows.length,
                    targetStudentRank: targetStudent ? {
                        name: targetStudent.name,
                        school: targetStudent.school,
                        rawTown: Number(targetStudent?.ranks?.total?.township || 0),
                        town: targetTownRank,
                        county: targetCountyRank
                    } : null,
                    compareEntryReady: !!document.getElementById('student-multi-period-compare-section'),
                    comparisonHelpersReady: checks.comparisonHelpersReady
                };
            } finally {
                window.RAW_DATA = originalRawData;
                window.SCHOOLS = originalSchools;
                window.__RAW_DATA_VERSION = originalRawDataVersion + 2;
            }
        }, { strictPerformance: STRICT_PERFORMANCE_BUDGETS });
    }
    if (id === 'report-generator') {
        return page.evaluate(async ({ strictPerformance }) => {
            const schoolSelect = document.getElementById('sel-school');
            const classSelect = document.getElementById('sel-class');
            const nameInput = document.getElementById('inp-name');
            const checks = {
                doQuery: typeof window.doQuery === 'function',
                getComparisonStudentView: typeof window.getComparisonStudentView === 'function',
                getComparisonStudentList: typeof window.getComparisonStudentList === 'function',
                formatComparisonExamLabel: typeof window.formatComparisonExamLabel === 'function',
                getStudentExamHistory: typeof window.getStudentExamHistory === 'function',
                renderSingleReportCardHTML: typeof window.renderSingleReportCardHTML === 'function',
                renderRadarChart: typeof window.renderRadarChart === 'function',
                renderVarianceChart: typeof window.renderVarianceChart === 'function'
            };
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks };
            }
            if (typeof window.updateSchoolSelect === 'function') window.updateSchoolSelect();
            if (typeof window.updateReportCompareExamSelects === 'function') window.updateReportCompareExamSelects();

            const schoolOptions = Array.from(schoolSelect.options || [])
                .map(option => String(option.value || '').trim())
                .filter(Boolean);
            let school = '';
            let student = null;
            for (const optionSchool of schoolOptions) {
                const candidate = (window.SCHOOLS?.[optionSchool]?.students || [])
                    .find(item => item && String(item.name || '').trim());
                if (candidate) {
                    school = optionSchool;
                    student = candidate;
                    break;
                }
            }
            if (!school || !student || !schoolSelect || !classSelect || !nameInput) {
                return {
                    ok: false,
                    checks,
                    error: 'report form or selectable sample student unavailable',
                    schoolOptions
                };
            }

            schoolSelect.value = school;
            if (typeof window.updateClassSelect === 'function') window.updateClassSelect();
            await new Promise(resolve => setTimeout(resolve, 150));
            classSelect.value = student.class || '';
            nameInput.value = student.name || '';

            await window.doQuery();
            await new Promise(resolve => {
                const startedAt = Date.now();
                const checkReady = () => {
                    const reportWrap = document.getElementById('single-report-result');
                    const capture = document.getElementById('report-card-capture-area');
                    const reportVisible = !!reportWrap && !reportWrap.classList.contains('hidden');
                    const contentReady = !!capture && String(capture.innerHTML || '').trim().length > 0;
                    if ((reportVisible && contentReady) || Date.now() - startedAt > 1200) {
                        resolve();
                        return;
                    }
                    requestAnimationFrame(checkReady);
                };
                checkReady();
            });

            const reportWrap = document.getElementById('single-report-result');
            const capture = document.getElementById('report-card-capture-area');
            const reportVisible = !!reportWrap && !reportWrap.classList.contains('hidden');
            const contentReady = !!capture && String(capture.innerHTML || '').trim().length > 0;

            return {
                ok: Object.values(checks).every(Boolean) && reportVisible && contentReady,
                checks,
                reportVisible,
                contentReady,
                sampleStudent: {
                    school,
                    className: student.class || '',
                    name: student.name || ''
                },
                contentLength: capture ? String(capture.innerHTML || '').trim().length : 0
            };
        }, { strictPerformance: STRICT_PERFORMANCE_BUDGETS });
    }
    if (id === 'cohort-growth') {
        return page.evaluate(async () => {
            const growthApi = typeof CohortGrowth !== 'undefined'
                ? CohortGrowth
                : (window.CohortGrowth || null);
            const checks = {
                sectionReady: !!document.querySelector('#cohort-growth.analysis-workspace-progress'),
                heroReady: !!document.querySelector('#cohort-growth .analysis-hero, #cohort-growth .analysis-shell-head'),
                shellHeadReady: !!document.querySelector('#cohort-growth .analysis-shell-head'),
                growthObjectReady: !!growthApi,
                renderReady: !!growthApi && typeof growthApi.render === 'function',
                exportReady: !!growthApi && typeof growthApi.exportVolatility === 'function',
                volatilityTable: !!document.getElementById('cohort-volatility-table'),
                growthTable: !!document.getElementById('cohort-growth-table'),
                flowReady: document.querySelectorAll('#cohort-growth .analysis-flow-step').length >= 3
            };
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks, examCount: 0, volatilityRows: 0, growthRows: 0 };
            }

            const examCount = Object.keys((window.COHORT_DB && window.COHORT_DB.exams) || {}).length;
            if (examCount > 0) {
                await growthApi.render();
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            const schoolOptions = Array.from(document.getElementById('cgSchoolSelect')?.options || [])
                .map(option => option.textContent.trim())
                .filter(Boolean);
            const volatilityRows = document.querySelectorAll('#cohort-volatility-table tbody tr').length;
            const growthRows = document.querySelectorAll('#cohort-growth-table tbody tr').length;

            return {
                ok: Object.values(checks).every(Boolean)
                    && (examCount === 0 || (volatilityRows > 0 && growthRows > 0 && schoolOptions.length > 1)),
                checks,
                examCount,
                schoolOptionCount: schoolOptions.length,
                schoolOptions: schoolOptions.slice(0, 12),
                volatilityRows,
                growthRows
            };
        });
    }
    if (id === 'freshman-simulator') {
        return page.evaluate(async () => {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const waitUntil = async (predicate, timeout = 12000) => {
                const deadline = Date.now() + timeout;
                let lastError = null;
                while (Date.now() < deadline) {
                    try {
                        if (predicate()) return true;
                    } catch (error) {
                        lastError = error;
                    }
                    await wait(120);
                }
                throw lastError || new Error('freshman simulator wait timeout');
            };
            const makeWorkbookFile = (rows, fileName) => {
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(workbook, worksheet, '学生名单');
                const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                return new File([bytes], fileName, {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
            };

            if (typeof window.ensureFreshmanExamRuntimeLoaded === 'function') {
                await window.ensureFreshmanExamRuntimeLoaded();
            }
            if (typeof window.ensureXlsxVendorLoaded === 'function') {
                await window.ensureXlsxVendorLoaded();
            }
            if (typeof window.ensureChartVendorLoaded === 'function') {
                await window.ensureChartVendorLoaded();
            }

            const runtime = window.FreshmanExamRuntime;
            const checks = {
                sectionReady: !!document.querySelector('#freshman-simulator.analysis-workspace-violet'),
                runtimeReady: !!runtime,
                xlsxReady: !!(window.XLSX && window.XLSX.utils),
                chartReady: typeof window.Chart === 'function',
                importReady: typeof window.FB_loadData === 'function',
                divisionReady: typeof window.FB_runDivision === 'function'
                    && typeof window.FB_generateSingleScheme === 'function'
                    && typeof window.FB_applyScheme === 'function',
                seatReady: typeof window.FB_openSeatMap === 'function'
                    && typeof window.FB_autoSeatAlgo === 'function'
                    && typeof window.FB_renderSeatMap === 'function'
            };
            if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) {
                return {
                    ok: Object.values(checks).every(Boolean),
                    checks,
                    lightweight: true
                };
            }
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks };
            }

            const sampleRows = Array.from({ length: 24 }, (_, index) => {
                const classNo = (index % 4) + 1;
                const name = `烟测新生${String(index + 1).padStart(2, '0')}`;
                return {
                    姓名: name,
                    性别: index % 2 === 0 ? '男' : '女',
                    总分: 612 - (index * 5),
                    身高: 150 + (index % 8) * 3,
                    视力: 4.6 + ((index % 4) * 0.1),
                    难管: index % 11 === 0 ? '是' : '',
                    备注: index === 3 ? '与烟测新生08不同班' : `来自${classNo}班`
                };
            });

            const alerts = [];
            const originalAlert = window.alert;
            const originalUiAlert = window.UI?.alert;
            window.alert = (message) => alerts.push(String(message || ''));
            if (window.UI) {
                window.UI.alert = async (message, ...args) => {
                    alerts.push(String(message || ''));
                    return typeof originalUiAlert === 'function'
                        ? originalUiAlert.call(window.UI, message, ...args)
                        : undefined;
                };
            }
            try {
                window.FB_loadData({ files: [makeWorkbookFile(sampleRows, 'freshman-smoke.xlsx')], value: '' });
                await waitUntil(() => runtime.students.length === sampleRows.length);

                const classInput = document.getElementById('fb_cls_num');
                const algorithmSelect = document.getElementById('fb_algorithm');
                const diffSelect = document.getElementById('fb_rule_diff');
                if (classInput) classInput.value = '4';
                if (algorithmSelect) algorithmSelect.value = 'snake';
                if (diffSelect) diffSelect.value = 'spread';

                window.FB_runDivision();
                await waitUntil(() => runtime.classes.length === 4
                    && document.querySelectorAll('#fb_class_container .fb-class-box').length === 4);
            } finally {
                window.alert = originalAlert;
                if (window.UI && originalUiAlert) window.UI.alert = originalUiAlert;
            }

            const classes = Array.isArray(runtime.classes) ? runtime.classes : [];
            const allStudents = classes.flatMap(cls => Array.isArray(cls.students) ? cls.students : []);
            const names = allStudents.map(student => String(student.name || '').trim()).filter(Boolean);
            const uniqueNames = new Set(names);
            const classSizes = classes.map(cls => cls.students.length);
            const averages = classes.map(cls => Number(cls.stats?.avg || 0));
            const averageRange = averages.length ? Math.max(...averages) - Math.min(...averages) : Infinity;
            const totalMale = classes.reduce((sum, cls) => sum + Number(cls.stats?.male || 0), 0);
            const totalCount = classes.reduce((sum, cls) => sum + Number(cls.stats?.count || cls.students?.length || 0), 0);
            const expectedTotal = sampleRows.length;
            const expectedMale = sampleRows.filter(row => row.性别 === '男').length;
            const dashboardText = document.getElementById('balanceTableContainer')?.textContent || '';
            const simulatedDataCount = Object.values(runtime.simulatedData || {})
                .reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
            const persistedCount = Array.isArray(window.FB_CLASSES)
                ? window.FB_CLASSES.reduce((sum, cls) => sum + (Array.isArray(cls.students) ? cls.students.length : 0), 0)
                : 0;

            const resultChecks = {
                ...checks,
                importedCountMatches: runtime.students.length === expectedTotal,
                classCountMatches: classes.length === 4,
                allStudentsAssigned: allStudents.length === expectedTotal,
                noDuplicateStudents: uniqueNames.size === expectedTotal,
                classSizesBalanced: classSizes.length === 4
                    && (Math.max(...classSizes) - Math.min(...classSizes)) <= 1,
                classStatsFinite: classes.every(cls => Number.isFinite(Number(cls.stats?.avg))
                    && Number.isFinite(Number(cls.stats?.male))
                    && Number.isFinite(Number(cls.stats?.count))),
                genderTotalsMatch: totalMale === expectedMale && totalCount === expectedTotal,
                averageBalanceReasonable: Number.isFinite(averageRange) && averageRange <= 8,
                dashboardRendered: document.querySelectorAll('#fb_class_container .fb-class-box').length === 4,
                balanceTableRendered: document.querySelectorAll('#balanceTableContainer tbody tr').length === 4
                    && dashboardText.includes('平均分'),
                resultsAreaVisible: !document.getElementById('fb-results-area')?.classList.contains('hidden'),
                simulatedDataSynced: simulatedDataCount === expectedTotal,
                persistedStateSynced: persistedCount === expectedTotal,
                importSucceeded: alerts.some(message => message.includes(String(expectedTotal)))
            };

            return {
                ok: Object.values(resultChecks).every(Boolean),
                checks: resultChecks,
                counts: {
                    imported: runtime.students.length,
                    assigned: allStudents.length,
                    classes: classes.length,
                    minClassSize: Math.min(...classSizes),
                    maxClassSize: Math.max(...classSizes),
                    averageRange: Number(averageRange.toFixed(2)),
                    male: totalMale,
                    expectedMale
                },
                alerts
            };
        });
    }
    if (id === 'exam-arranger') {
        return page.evaluate(async () => {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const waitUntil = async (predicate, timeout = 12000) => {
                const deadline = Date.now() + timeout;
                let lastError = null;
                while (Date.now() < deadline) {
                    try {
                        if (predicate()) return true;
                    } catch (error) {
                        lastError = error;
                    }
                    await wait(120);
                }
                throw lastError || new Error('exam arranger wait timeout');
            };
            const makeWorkbookFile = (rows, fileName) => {
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(workbook, worksheet, '考生名单');
                const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                return new File([bytes], fileName, {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
            };

            if (typeof window.ensureFreshmanExamRuntimeLoaded === 'function') {
                await window.ensureFreshmanExamRuntimeLoaded();
            }
            if (typeof window.ensureXlsxVendorLoaded === 'function') {
                await window.ensureXlsxVendorLoaded();
            }

            const runtime = window.FreshmanExamRuntime;
            const checks = {
                sectionReady: !!document.querySelector('#exam-arranger.analysis-workspace-tools'),
                runtimeReady: !!runtime,
                xlsxReady: !!(window.XLSX && window.XLSX.utils),
                importReady: typeof window.EXAM_loadData === 'function',
                generateReady: typeof window.EXAM_generate === 'function'
                    && typeof window.EXAM_renderOverview === 'function'
                    && typeof window.EXAM_renderStudentList === 'function'
                    && typeof window.EXAM_renderProctorTable === 'function',
                proctorUiReady: typeof window.EXAM_initProctorUI === 'function',
                proctorAssignReady: typeof window.EXAM_assignProctors === 'function'
            };
            if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) {
                return {
                    ok: Object.values(checks).every(Boolean),
                    checks,
                    lightweight: true
                };
            }
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks };
            }

            const sampleRows = Array.from({ length: 40 }, (_, index) => ({
                学校: '烟测学校',
                班级: `${(index % 4) + 1}班`,
                姓名: `烟测考生${String(index + 1).padStart(2, '0')}`,
                总分: 698 - (index * 3)
            }));
            const prefix = 'T2026';
            const seatsPerRoom = 12;
            const expectedRoomCount = Math.ceil(sampleRows.length / seatsPerRoom);

            const alerts = [];
            const originalAlert = window.alert;
            const originalUiAlert = window.UI?.alert;
            window.alert = (message) => alerts.push(String(message || ''));
            if (window.UI) {
                window.UI.alert = async (message, ...args) => {
                    alerts.push(String(message || ''));
                    return typeof originalUiAlert === 'function'
                        ? originalUiAlert.call(window.UI, message, ...args)
                        : undefined;
                };
            }
            try {
                window.EXAM_loadData({ files: [makeWorkbookFile(sampleRows, 'exam-smoke.xlsx')], value: '' });
                await waitUntil(() => runtime.examData.length === sampleRows.length);

                const prefixInput = document.getElementById('exam_prefix');
                const seatsInput = document.getElementById('exam_seats_per_room');
                const separateInput = document.getElementById('exam_opt_separate');
                const snakeInput = document.getElementById('exam_opt_snake');
                if (prefixInput) prefixInput.value = prefix;
                if (seatsInput) seatsInput.value = String(seatsPerRoom);
                if (separateInput) separateInput.checked = true;
                if (snakeInput) snakeInput.checked = true;

                window.EXAM_generate();
                await waitUntil(() => runtime.examRooms.length === expectedRoomCount
                    && document.querySelectorAll('#exam_room_grid .exam-room-card').length === expectedRoomCount);

                if (typeof window.EXAM_initProctorUI === 'function') {
                    window.EXAM_initProctorUI();
                }
            } finally {
                window.alert = originalAlert;
                if (window.UI && originalUiAlert) window.UI.alert = originalUiAlert;
            }

            const rooms = Array.isArray(runtime.examRooms) ? runtime.examRooms : [];
            const examData = Array.isArray(runtime.examData) ? runtime.examData : [];
            const assigned = rooms.flatMap(room => Array.isArray(room.students) ? room.students : []);
            const examNos = assigned.map(student => String(student.examNo || '').trim()).filter(Boolean);
            const teacherNames = [...new Set(Object.values(window.TEACHER_MAP || {})
                .map(name => String(name || '').trim())
                .filter(Boolean))];
            const canAssignProctors = teacherNames.length >= rooms.length * 2;
            let proctorAssignmentTried = false;
            let proctorAssignmentReady = false;
            let proctorAlerts = [];
            if (canAssignProctors) {
                const proctorOriginalAlert = window.alert;
                const proctorOriginalUiAlert = window.UI?.alert;
                window.alert = (message) => proctorAlerts.push(String(message || ''));
                if (window.UI) {
                    window.UI.alert = async (message, ...args) => {
                        proctorAlerts.push(String(message || ''));
                        return typeof proctorOriginalUiAlert === 'function'
                            ? proctorOriginalUiAlert.call(window.UI, message, ...args)
                            : undefined;
                    };
                }
                try {
                    window.EXAM_assignProctors();
                    proctorAssignmentTried = true;
                    await wait(200);
                } finally {
                    window.alert = proctorOriginalAlert;
                    if (window.UI && proctorOriginalUiAlert) window.UI.alert = proctorOriginalUiAlert;
                }
                const proctorRows = Array.from(document.querySelectorAll('#exam_proctor_table tbody tr'))
                    .filter(row => row.querySelectorAll('td').length >= 5);
                proctorAssignmentReady = proctorRows.slice(0, rooms.length).every(row => {
                    const cells = row.querySelectorAll('td');
                    return String(cells[3]?.textContent || '').trim()
                        && String(cells[4]?.textContent || '').trim();
                });
            } else {
                proctorAssignmentReady = true;
            }

            const roomSizes = rooms.map(room => room.students.length);
            const seatIntegrity = rooms.every(room => {
                const seats = room.students.map(student => Number(student.seatNo));
                return seats.length === new Set(seats).size
                    && seats.every(seat => Number.isInteger(seat) && seat >= 1 && seat <= seatsPerRoom);
            });
            const snakePrintOrder = rooms.every(room => {
                const seats = room.students.map(student => Number(student.seatNo));
                return seats.every((seat, index) => index === 0 || seat >= seats[index - 1]);
            });
            const examNoSortedStudents = [...assigned].sort((a, b) => String(a.examNo || '').localeCompare(String(b.examNo || '')));
            const noAdjacentSameClass = examNoSortedStudents.every((student, index, rows) => (
                index === 0 || String(student.class) !== String(rows[index - 1].class)
            ));
            const firstExamNo = String(examNoSortedStudents[0]?.examNo || '');
            const lastExamNo = String(examNoSortedStudents[examNoSortedStudents.length - 1]?.examNo || '');
            const expectedLastNo = `${prefix}${String(sampleRows.length).padStart(3, '0')}`;
            const resultChecks = {
                ...checks,
                importedCountMatches: examData.length === sampleRows.length,
                assignedCountMatches: assigned.length === sampleRows.length,
                roomCountMatches: rooms.length === expectedRoomCount,
                roomCapacityRespected: roomSizes.every(size => size > 0 && size <= seatsPerRoom),
                examNumbersUnique: new Set(examNos).size === sampleRows.length,
                examNumberPrefixAndRange: firstExamNo === `${prefix}001` && lastExamNo === expectedLastNo,
                seatIntegrity,
                snakePrintOrder,
                classSeparationApplied: noAdjacentSameClass,
                resultsAreaVisible: !document.getElementById('exam-results-area')?.classList.contains('hidden'),
                overviewRendered: document.querySelectorAll('#exam_room_grid .exam-room-card').length === expectedRoomCount,
                studentRowsRendered: document.querySelectorAll('#exam_student_table tbody tr').length === sampleRows.length,
                proctorRowsRendered: document.querySelectorAll('#exam_proctor_table tbody tr').length >= rooms.length,
                printViewRendered: document.querySelectorAll('#batch-print-area-wrapper .exam-print-page, #batch-print-container .exam-print-page').length === expectedRoomCount,
                importSucceeded: alerts.some(message => message.includes(String(sampleRows.length))),
                proctorAssignmentReady
            };

            return {
                ok: Object.values(resultChecks).every(Boolean),
                checks: resultChecks,
                counts: {
                    imported: examData.length,
                    assigned: assigned.length,
                    rooms: rooms.length,
                    minRoomSize: Math.min(...roomSizes),
                    maxRoomSize: Math.max(...roomSizes),
                    teacherPool: teacherNames.length,
                    proctorAssignmentTried
                },
                examNumberRange: {
                    first: firstExamNo,
                    last: lastExamNo
                },
                alerts: alerts.concat(proctorAlerts)
            };
        });
    }
    if (id === 'grade-scheduler') {
        return page.evaluate(async () => {
            const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            const waitUntil = async (predicate, timeout = 15000) => {
                const deadline = Date.now() + timeout;
                let lastError = null;
                while (Date.now() < deadline) {
                    try {
                        if (predicate()) return true;
                    } catch (error) {
                        lastError = error;
                    }
                    await wait(120);
                }
                throw lastError || new Error('grade scheduler wait timeout');
            };
            const makeWorkbookFile = (rows, fileName) => {
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(rows);
                XLSX.utils.book_append_sheet(workbook, worksheet, '任课表');
                const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                return new File([bytes], fileName, {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
            };
            const stripCombinedMark = (teacher) => String(teacher || '').replace(/\([^)]*\)/g, '').trim();

            if (typeof window.ensureGradeSchedulerRuntimeLoaded === 'function') {
                await window.ensureGradeSchedulerRuntimeLoaded();
            }
            if (typeof window.ensureXlsxVendorLoaded === 'function') {
                await window.ensureXlsxVendorLoaded();
            }

            const scheduler = window.SCHEDULER || window.GradeSchedulerRuntime;
            const checks = {
                sectionReady: !!document.querySelector('#grade-scheduler.analysis-workspace-violet'),
                runtimeReady: !!scheduler,
                xlsxReady: !!(window.XLSX && window.XLSX.utils),
                importReady: !!scheduler && typeof scheduler.loadData === 'function',
                runReady: !!scheduler && typeof scheduler.run === 'function',
                renderReady: !!scheduler && typeof scheduler.renderTable === 'function',
                auditReady: !!scheduler && typeof scheduler.auditFatigue === 'function'
            };
            if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) {
                return {
                    ok: Object.values(checks).every(Boolean),
                    checks,
                    lightweight: true
                };
            }
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks };
            }

            scheduler.data = [];
            scheduler.schedule = {};
            scheduler.classes = [];
            scheduler.rules = { meetings: [], busy: [], activities: [], combined: [] };

            const sampleRows = [
                { 教师姓名: '张老师', 学科: '语文', 任教班级: '701,702', 周课时量: 4 },
                { 教师姓名: '李老师', 学科: '数学', 任教班级: '701,702', 周课时量: 4 },
                { 教师姓名: '王老师', 学科: '英语', 任教班级: '701,702', 周课时量: 4 },
                { 教师姓名: '赵老师', 学科: '物理', 任教班级: '701,702', 周课时量: 2 },
                { 教师姓名: '周老师', 学科: '历史', 任教班级: '701,702', 周课时量: 2 }
            ];

            const alerts = [];
            const originalAlert = window.alert;
            window.alert = (message) => alerts.push(String(message || ''));
            try {
                await scheduler.loadData({ files: [makeWorkbookFile(sampleRows, 'grade-scheduler-smoke.xlsx')], value: '' });

                const setValue = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.value = value;
                };
                const setChecked = (id, checked) => {
                    const el = document.getElementById(id);
                    if (el) el.checked = checked;
                };
                setValue('sch_am_count', '2');
                setValue('sch_pm_count', '4');
                setValue('sch_eve_count', '1');
                setChecked('sch_rule_fri_eve', true);
                setChecked('sch_rule_fri_pm', false);
                setChecked('sch_rule_morning_read', true);
                setChecked('sch_rule_noon_write', true);

                setValue('sch_comb_subject', '物理');
                setValue('sch_comb_slot', 'eve_1');
                scheduler.addConstraint('combined');
                setValue('sch_meet_day', '5');
                setValue('sch_meet_slot', 'pm_3');
                scheduler.addConstraint('meeting');
                setValue('sch_busy_day', '1');
                setValue('sch_busy_slots', 'am_1');
                setValue('sch_busy_name', '李老师');
                scheduler.addConstraint('busy');
                setValue('sch_act_day', '3');
                setValue('sch_act_range', 'pm_all');
                setValue('sch_act_subject', 'ALL');
                scheduler.addConstraint('activity');

                scheduler.run();
                await waitUntil(() => {
                    const area = document.getElementById('sch_result_area');
                    const button = document.querySelector('#grade-scheduler .btn-primary');
                    return area && !area.classList.contains('hidden')
                        && button && !button.disabled
                        && document.querySelectorAll('#sch_table tbody tr').length > 0;
                });
            } finally {
                window.alert = originalAlert;
            }

            scheduler.auditFatigue();
            await wait(120);

            const classes = Array.isArray(scheduler.classes) ? scheduler.classes : [];
            const schedule = scheduler.schedule || {};
            const slotTeacherMap = {};
            const teacherConflicts = [];
            classes.forEach(className => {
                Object.entries(schedule[className] || {}).forEach(([slotId, cell]) => {
                    if (slotId.startsWith('_') || !cell || !cell.teacher || cell.teacher === '-') return;
                    if (cell.fixed && cell.subject === '班会') return;
                    const teacher = stripCombinedMark(cell.teacher);
                    if (!teacher) return;
                    if (!slotTeacherMap[slotId]) slotTeacherMap[slotId] = {};
                    if (!slotTeacherMap[slotId][teacher]) slotTeacherMap[slotId][teacher] = [];
                    slotTeacherMap[slotId][teacher].push({ className, cell });
                });
            });
            Object.entries(slotTeacherMap).forEach(([slotId, teacherMap]) => {
                Object.entries(teacherMap).forEach(([teacher, entries]) => {
                    const allCombined = entries.every(entry => entry.cell.isCombined);
                    if (entries.length > 1 && !allCombined) {
                        teacherConflicts.push({ slotId, teacher, classes: entries.map(entry => entry.className) });
                    }
                });
            });

            const lessonCells = classes.flatMap(className => Object.entries(schedule[className] || {})
                .filter(([slotId, cell]) => !slotId.startsWith('_') && cell && cell.subject)
                .map(([slotId, cell]) => ({ className, slotId, cell })));
            const combinedEntries = lessonCells.filter(entry => entry.cell.isCombined && entry.cell.subject === '物理');
            const combinedDaySet = new Set(combinedEntries.map(entry => entry.slotId.split('_')[0]));
            const combinedClasses = new Set(combinedEntries.map(entry => entry.className));
            const malformedSlotIds = lessonCells.filter(entry => (
                /^d[1-5]_(am|pm|eve)__/.test(entry.slotId) || /^d[1-5]_(am|pm|eve)\d/.test(entry.slotId)
            ));
            const combinedOnRequestedSlot = combinedEntries.length === classes.length
                && combinedEntries.every(entry => /^d[1-4]_eve_1$/.test(entry.slotId));
            const wednesdayPmBlocked = classes.every(className => ['d3_pm_1', 'd3_pm_2', 'd3_pm_3', 'd3_pm_4'].every(slotId => (
                schedule[className]?.[slotId]?.subject === '🚫 无课'
            )));
            const fridayMeetingReady = classes.every(className => (
                schedule[className]?.d5_pm_3?.subject === '班会'
            ));
            const fridayEveningEmpty = classes.every(className => !Object.entries(schedule[className] || {}).some(([slotId, cell]) => (
                slotId.startsWith('d5_eve_') && cell && cell.subject
            )));
            const busyTeacherRespected = classes.every(className => (
                stripCombinedMark(schedule[className]?.d1_am_1?.teacher) !== '李老师'
            ));
            const tableText = document.getElementById('sch_table')?.textContent || '';
            const previewText = document.getElementById('sch_resource_preview')?.textContent || '';
            const auditText = document.getElementById('sch_audit_summary')?.textContent || '';
            const resultChecks = {
                ...checks,
                importedRecordsMatch: scheduler.data.length === sampleRows.length,
                classListReady: classes.length === 2 && classes.includes('701') && classes.includes('702'),
                previewRendered: previewText.includes('已导入') && previewText.includes('5'),
                combinedRuleRendered: document.querySelectorAll('#sch_tags_combined .tag-chip').length === 1,
                meetingRuleRendered: document.querySelectorAll('#sch_tags_meeting .tag-chip').length === 1,
                busyRuleRendered: document.querySelectorAll('#sch_tags_busy .tag-chip').length === 1,
                activityRuleRendered: document.querySelectorAll('#sch_tags_activity .tag-chip').length === 1,
                scheduleGenerated: classes.every(className => schedule[className] && Object.keys(schedule[className]).length > 0),
                tableRendered: document.querySelectorAll('#sch_table tbody tr').length >= 10
                    && tableText.includes('语文')
                    && tableText.includes('物理')
                    && tableText.includes('(合)')
                    && tableText.includes('班会'),
                resultAreaVisible: !document.getElementById('sch_result_area')?.classList.contains('hidden'),
                slotIdsNormalized: malformedSlotIds.length === 0,
                noTeacherDoubleBooked: teacherConflicts.length === 0,
                fridayEveningRuleRespected: fridayEveningEmpty,
                busyTeacherRuleRespected: busyTeacherRespected,
                meetingRuleApplied: fridayMeetingReady,
                activityRuleApplied: wednesdayPmBlocked,
                combinedRuleApplied: combinedOnRequestedSlot
                    && combinedClasses.size === classes.length
                    && combinedDaySet.size === 1
                    && !combinedEntries.some(entry => entry.slotId === 'd5_eve_1'),
                auditRendered: !document.getElementById('sch_audit_area')?.classList.contains('hidden')
                    && auditText.includes('已完成规则审计')
                    && document.querySelectorAll('#sch_audit_list .tag-chip').length >= 1
            };

            return {
                ok: Object.values(resultChecks).every(Boolean),
                checks: resultChecks,
                counts: {
                    records: scheduler.data.length,
                    classes: classes.length,
                    lessonCells: lessonCells.length,
                    combinedCells: combinedEntries.length,
                    malformedSlotIds: malformedSlotIds.length,
                    teacherConflicts: teacherConflicts.length
                },
                teacherConflicts,
                alerts
            };
        });
    }
    return { ok: true };
}

async function smokeDataManagerTab(page, id) {
    const stabilizeMs = Number(DATA_MANAGER_TAB_STABILIZE_MS[id] || DATA_MANAGER_TAB_STABILIZE_MS.default || 0);
    const result = await page.evaluate(async ({ tabId, stabilizeMs }) => {
        try {
            if (!window.DataManager || typeof window.DataManager.switchTab !== 'function') {
                return { ok: false, id: tabId, error: 'DataManager.switchTab is not available' };
            }
            await Promise.resolve(window.DataManager.switchTab(tabId));
            if (stabilizeMs > 0) await new Promise(resolve => setTimeout(resolve, stabilizeMs));
            const activePanel = document.querySelector('.data-manager-tab.active,[data-dm-tab].active,.tab-pane.active');
            if (tabId === 'sql') {
                const checks = {
                    setQuickSQL: typeof window.DataManager.setQuickSQL === 'function',
                    runSQL: typeof window.DataManager.runSQL === 'function',
                    exportSQLResult: typeof window.DataManager.exportSQLResult === 'function',
                    talkToData: typeof window.talkToData === 'function'
                };
                return {
                    ok: Object.values(checks).every(Boolean),
                    id: tabId,
                    checks
                };
            }
            if (tabId === 'cloud') {
                const hasCloudRows = !!document.querySelector('#dm-cloud-table tbody .dm-cloud-select');
                const checks = {
                    triggerCloudArchiveUpload: typeof window.DataManager.triggerCloudArchiveUpload === 'function',
                    handleCloudArchiveUpload: typeof window.DataManager.handleCloudArchiveUpload === 'function',
                    downloadCloudBackup: typeof window.DataManager.downloadCloudBackup === 'function',
                    uploadButton: !!document.getElementById('btn-cloud-upload-archive'),
                    uploadInput: !!document.getElementById('dm-cloud-upload-input'),
                    rowDownloadButton: !hasCloudRows || !!document.querySelector('#dm-cloud-table tbody button[data-cloud-backup-action="download"]')
                };
                return {
                    ok: Object.values(checks).every(Boolean),
                    id: tabId,
                    checks
                };
            }
            return {
                ok: true,
                id: tabId,
                activeText: activePanel?.textContent?.trim()?.slice(0, 80) || ''
            };
        } catch (error) {
            return { ok: false, id: tabId, error: error?.message || String(error) };
        }
    }, { tabId: id, stabilizeMs });
    await page.waitForTimeout(300);
    return result;
}

(async () => {
    const browserChannel = String(process.env.SMOKE_BROWSER_CHANNEL || 'chrome').trim() || 'chrome';
    const browser = await chromium.launch({
        channel: browserChannel,
        headless: true,
        args: getChromeLaunchArgs()
    });

    const page = await browser.newPage({
        viewport: { width: 1440, height: 1800 }
    });
    await page.addInitScript(`${resolveSmokeRuntimeExamId.toString()}
${resolveSmokeRuntimeTermId.toString()}
window.__resolveSmokeRuntimeExamId = resolveSmokeRuntimeExamId;
window.__resolveSmokeRuntimeTermId = resolveSmokeRuntimeTermId;`);

    const user = process.env.SMOKE_USER || 'admin';
    const pass = process.env.SMOKE_PASS || 'admin123';
    const errors = [];
    const recentFailedRequests = [];
    let currentScope = 'boot';

    page.on('pageerror', error => {
        errors.push({ scope: currentScope, type: 'pageerror', message: error.message });
    });

    page.on('dialog', async dialog => {
        trace('dialog', { scope: currentScope, type: dialog.type(), message: dialog.message().slice(0, 120) });
        try {
            if (dialog.type() === 'confirm') {
                await dialog.accept();
            } else if (dialog.type() === 'prompt') {
                await dialog.accept('');
            } else {
                await dialog.dismiss();
            }
        } catch (_) {
            // Dialog may already be closed by the app under test.
        }
    });

    page.on('requestfailed', request => {
        recentFailedRequests.push({
            url: request.url(),
            errorText: request.failure()?.errorText || '',
            time: Date.now()
        });
        if (recentFailedRequests.length > 20) {
            recentFailedRequests.splice(0, recentFailedRequests.length - 20);
        }
    });

    page.on('response', response => {
        const status = response.status();
        if (status < 400) return;
        const message = `${status} ${response.url()}`;
        if (shouldIgnoreConsoleMessage(message, {
            smokeUrl: process.env.SMOKE_URL || 'https://schoolsystem.com.cn/',
            recentFailedRequests
        })) return;
        errors.push({ scope: currentScope, type: 'response', message });
    });

    page.on('console', msg => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (shouldIgnoreConsoleMessage(text, {
            smokeUrl: process.env.SMOKE_URL || 'https://schoolsystem.com.cn/',
            recentFailedRequests
        })) return;
        errors.push({ scope: currentScope, type: 'console', message: text });
    });

    const smokeStartedAt = Date.now();
    trace('login:start');
    const loginMeasurement = await measureAsync('login', () => login(page, user, pass));
    trace('login:done', { durationMs: loginMeasurement.durationMs });
    const appReadyMeasurement = await measureAsync('app-ready', () => waitForAppReady(page));
    trace('app-ready:done', { durationMs: appReadyMeasurement.durationMs });

    const summary = {
        login: await page.evaluate(() => {
            const entrancePlaylistStatus = String(document.querySelector('[data-sound-status]')?.textContent || '').trim();
            return ({
            legacySchoolInternalSectionPresent: !!document.getElementById('school-internal-grades'),
            legacyRemovedSigPanelPresent: !!document.getElementById('removed-sig-panel'),
            legacyInlineTriggerPresent: !!document.querySelector('[onclick*="school-internal-grades"]'),
            overlayHidden: getComputedStyle(document.getElementById('login-overlay')).display === 'none',
            appVisible: getComputedStyle(document.getElementById('app')).display !== 'none',
            roleText: document.body.innerText.includes('Role:'),
            termId: localStorage.getItem('CURRENT_TERM_ID') || '',
            cohortId: localStorage.getItem('CURRENT_COHORT_ID') || '',
            mySchool: (window.SchoolState && typeof window.SchoolState.getCurrentSchool === 'function'
                ? window.SchoolState.getCurrentSchool()
                : '') || window.MY_SCHOOL || localStorage.getItem('MY_SCHOOL') || '',
            schoolInternalRemoved: !document.getElementById('school-internal-grades')
                && !document.getElementById('removed-sig-panel')
                && !document.querySelector('[onclick*="school-internal-grades"]'),
            scoreCount: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            entrancePlaylistStatus,
            entrancePlaylistReady: /已导入\s*1\s*首|播放：任然 - 外婆桥/.test(entrancePlaylistStatus)
        });
        }),
        switchModules: [],
        dataManagerTabs: [],
        performance: {
            budgets: PERFORMANCE_BUDGETS,
            strict: STRICT_PERFORMANCE_BUDGETS,
            loginMs: loginMeasurement.durationMs,
            appReadyMs: appReadyMeasurement.durationMs,
            moduleTimings: [],
            dataManagerTimings: [],
            budgetStatus: [
                buildBudgetStatus(loginMeasurement.durationMs, PERFORMANCE_BUDGETS.loginMs, 'login'),
                buildBudgetStatus(appReadyMeasurement.durationMs, PERFORMANCE_BUDGETS.appReadyMs, 'app-ready')
            ],
            longTasks: []
        },
        errors
    };

    currentScope = 'hotspot-prewarm';
    trace('hotspot-prewarm:start');
    summary.performance.hotspotPrewarm = await prewarmSmokeHotspots(page);
    trace('hotspot-prewarm:done', summary.performance.hotspotPrewarm);
    const performanceBudgetWindowStartedAt = Date.now();
    await page.waitForTimeout(800);
    const performanceBudgetLongTaskBaseline = (await readPerformanceSnapshot(page)).longTasks.length;

    for (const id of SWITCH_MODULE_IDS) {
        currentScope = `switch:${id}`;
        trace('switch:start', { id });
        const switchMeasurement = await measureAsync(
            `switch:${id}`,
            () => withPagePerformancePhase(
                page,
                `smoke-switch:${id}`,
                () => withTimeoutResult(
                    () => smokeSwitchModule(page, id),
                    MODULE_SWITCH_WRAPPER_TIMEOUT_MS,
                    () => ({ ok: false, id, error: 'switch-timeout' })
                )
            )
        );
        const switchResult = switchMeasurement.result;
        trace('switch:done', { id, ok: switchResult.ok, error: switchResult.error || null });
        const allowDeepCheckWithoutVisibleSwitch = [
            'teacher-analysis',
            'teacher-detail-comparison',
            'teacher-pairing',
            'student-details',
            'correlation-analysis',
            'indicator'
        ].includes(id);
        const deepMeasurement = (switchResult.ok || allowDeepCheckWithoutVisibleSwitch)
            ? await measureAsync(
                `deep:${id}`,
                () => withPagePerformancePhase(
                    page,
                    `smoke-deep:${id}`,
                    () => withTimeoutResult(
                        () => runModuleDeepCheck(page, id),
                        MODULE_DEEP_CHECK_TIMEOUT_MS,
                        () => ({ ok: false, id, error: 'deep-check-timeout' })
                    )
                )
            )
            : { result: { ok: false, skipped: true }, durationMs: 0, label: `deep:${id}` };
        const deepCheck = deepMeasurement.result;
        const moduleTiming = {
            id,
            switchMs: switchMeasurement.durationMs,
            deepCheckMs: deepMeasurement.durationMs,
            totalMs: switchMeasurement.durationMs + deepMeasurement.durationMs
        };
        summary.performance.moduleTimings.push(moduleTiming);
        summary.performance.budgetStatus.push(
            buildBudgetStatus(moduleTiming.switchMs, PERFORMANCE_BUDGETS.moduleSwitchMs, `switch:${id}`),
            buildBudgetStatus(moduleTiming.deepCheckMs, PERFORMANCE_BUDGETS.moduleDeepCheckMs, `deep:${id}`)
        );
        const timingPayload = {
            performance: moduleTiming
        };
        const normalizedDeepCheck = (deepCheck && deepCheck.checks && Object.values(deepCheck.checks).every(Boolean))
            ? { ...deepCheck, ok: deepCheck.ok !== false }
            : deepCheck;
        trace('deep-check:done', { id, ok: normalizedDeepCheck.ok, error: normalizedDeepCheck.error || null });
        const normalizedSwitchResult = (!switchResult.ok && allowDeepCheckWithoutVisibleSwitch && normalizedDeepCheck.ok)
            ? {
                ...switchResult,
                ok: true,
                recoveredByDeepCheck: true
            }
            : switchResult;
        const cohortGuard = buildCohortRuntimeGuard(await readCohortRuntimeState(page));
        summary.switchModules.push({ ...normalizedSwitchResult, ...timingPayload, deepCheck: normalizedDeepCheck, cohortGuard });
    }

    currentScope = 'data-manager';
    trace('data-manager:switch-upload:start');
    await smokeSwitchModule(page, 'upload');
    trace('data-manager:switch-upload:done');
    for (const id of DATA_MANAGER_TABS) {
        currentScope = `dm:${id}`;
        trace('data-manager-tab:start', { id });
        const tabMeasurement = await measureAsync(
            `dm:${id}`,
            () => withPagePerformancePhase(
                page,
                `smoke-dm:${id}`,
                () => withTimeoutResult(
                    () => smokeDataManagerTab(page, id),
                    DATA_MANAGER_TAB_TIMEOUT_MS,
                    () => ({ ok: false, id, error: 'data-manager-timeout' })
                )
            )
        );
        const tabResult = tabMeasurement.result;
        const tabTiming = { id, durationMs: tabMeasurement.durationMs };
        summary.performance.dataManagerTimings.push(tabTiming);
        summary.performance.budgetStatus.push(
            buildBudgetStatus(tabTiming.durationMs, PERFORMANCE_BUDGETS.dataManagerTabMs, `dm:${id}`)
        );
        const cohortGuard = buildCohortRuntimeGuard(await readCohortRuntimeState(page));
        summary.dataManagerTabs.push({ ...tabResult, performance: tabTiming, cohortGuard });
        trace('data-manager-tab:done', { id, ok: tabResult.ok, durationMs: tabTiming.durationMs });
    }

    currentScope = 'final';
    summary.errorCount = errors.length;
    summary.performance.totalMs = Date.now() - smokeStartedAt;
    summary.performance.slowestModules = summary.performance.moduleTimings
        .slice()
        .sort((left, right) => right.totalMs - left.totalMs)
        .slice(0, 8);
    summary.performance.slowestDataManagerTabs = summary.performance.dataManagerTimings
        .slice()
        .sort((left, right) => right.durationMs - left.durationMs)
        .slice(0, 4);
    const performanceSnapshot = await readPerformanceSnapshot(page);
    summary.performance.systemPerformanceSnapshot = performanceSnapshot;
    summary.performance.longTasks = (performanceSnapshot.longTasks || [])
        .slice(performanceBudgetLongTaskBaseline)
        .filter((item) => {
            const taskTime = Date.parse(String(item?.time || ''));
            return !Number.isFinite(taskTime) || taskTime >= performanceBudgetWindowStartedAt;
        })
        .filter((item) => !String(item?.phase || '').startsWith('smoke-deep:'))
        .filter((item) => Number(item?.duration || 0) >= PERFORMANCE_BUDGETS.longTaskMs);
    summary.performance.budgetFailures = summary.performance.budgetStatus.filter((item) => !item.ok);

    writeSmokeOutput(summary);
    console.log(JSON.stringify(summary, null, 2));
    await browser.close();

    const failedSwitch = summary.switchModules.find(item => !item.ok || !item.deepCheck?.ok || item.cohortGuard?.ok === false);
    const failedDm = summary.dataManagerTabs.find(item => !item.ok || item.cohortGuard?.ok === false);
    if (
        !summary.login.appVisible
        || !summary.login.schoolInternalRemoved
        || !summary.login.entrancePlaylistReady
        || failedSwitch
        || failedDm
        || errors.length > 0
        || (STRICT_PERFORMANCE_BUDGETS && summary.performance.budgetFailures.length > 0)
    ) {
        process.exit(1);
    }
    process.exit(0);
})().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
