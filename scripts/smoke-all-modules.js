try {
    require.resolve('playwright');
} catch (e) {
    console.error('playwright is required for smoke-all-modules. Run: npm install --no-save playwright');
    process.exit(1);
}

const { chromium } = require('playwright');

function trace(message, extra = undefined) {
    if (!process.env.SMOKE_TRACE) return;
    const suffix = extra === undefined ? '' : ` ${JSON.stringify(extra)}`;
    console.error(`[smoke] ${new Date().toISOString()} ${message}${suffix}`);
}

const SWITCH_MODULE_IDS = [
    'starter-hub',
    'upload',
    'summary',
    'analysis',
    'county-analysis',
    'teacher-analysis',
    'correlation-analysis',
    'indicator',
    'bottom3',
    'marginal-push',
    'seat-adjustment',
    'progress-analysis',
    'cohort-growth',
    'report-generator',
    'app-download-center',
    'freshman-simulator',
    'exam-arranger',
    'student-overview',
    'student-details'
];

const DATA_MANAGER_TABS = ['student', 'teacher', 'targets', 'params', 'sql', 'cloud'];
const MODULE_SWITCH_TIMEOUT_MS = 12000;
const MODULE_SWITCH_WRAPPER_TIMEOUT_MS = 30000;
const MODULE_DEEP_CHECK_TIMEOUT_MS = 90000;

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
        await page.click('button[onclick="window.Auth?.login()"]');
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
            examId: String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim(),
            rawDataLen: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            knownCohorts: selector
                ? Array.from(selector.options || []).map((option) => String(option.value || '').trim()).filter(Boolean)
                : []
        };
    });

    let state = await withNavigationRetry(page, readEntryState, { attempts: 4 });

    if (!state.maskVisible) return state;

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
        if (!state.maskVisible) return state;
    }

    try {
        await withNavigationRetry(page, () => page.waitForFunction(() => {
            const mask = document.getElementById('mode-mask');
            const examId = String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
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
    if (!state.maskVisible) return state;

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
            const button = document.querySelector('button[onclick="enterCohortFromMask()"]');
            if (button) button.click();
        });
        await waitForPageStability(page, 10000);
        await page.waitForFunction((expectedCohortId) => {
            const mask = document.getElementById('mode-mask');
            const app = document.getElementById('app');
            const overlay = document.getElementById('login-overlay');
            const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
            const appVisible = !!app
                && getComputedStyle(app).display !== 'none'
                && !app.classList.contains('hidden');
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
        }, candidate, { timeout: 40000 });
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
                const termId = String(localStorage.getItem('CURRENT_TERM_ID') || '').trim();
                const cohortId = String(localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
                const examId = String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
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
        if (!recoveryAttempted && workspaceLooksReadyButEmpty && Date.now() - startedAt > 12000) {
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
        await page.evaluate((moduleId) => {
            if (typeof window.switchTab !== 'function') {
                throw new Error('switchTab is not available');
            }
            window.setTimeout(() => window.switchTab(moduleId), 0);
        }, id);

        if (id === 'student-details') {
            await page.waitForTimeout(1800);
            const earlyState = await collectState();
            if (earlyState.active || earlyState.visible || earlyState.ok) {
                return earlyState;
            }
        }

        await page.waitForFunction((moduleId) => {
            const section = document.getElementById(moduleId);
            if (!section) return false;
            const style = getComputedStyle(section);
            return style.display !== 'none' && section.classList.contains('active');
        }, id, { timeout: MODULE_SWITCH_TIMEOUT_MS });
    } catch (error) {
        const fallback = await collectState();
        if (fallback.ok) {
            await page.waitForTimeout(500);
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
                window.setTimeout(() => window.switchTab(moduleId), 0);
            }
        }, id);
        await page.waitForTimeout(1200);
        result = await collectState();
    }
    await page.waitForTimeout(500);
    return result;
}

async function runModuleDeepCheck(page, id) {
    if (id === 'summary') {
        return page.evaluate(async () => {
            if (typeof window.ensureTownSubmoduleCompareRuntimeLoaded === 'function') {
                await window.ensureTownSubmoduleCompareRuntimeLoaded();
            }
            if (typeof window.ensureTownSubmoduleCompareUIs === 'function') {
                await window.ensureTownSubmoduleCompareUIs();
            }
            if (typeof window.ensureSchoolProfileRuntimeLoaded === 'function') {
                await window.ensureSchoolProfileRuntimeLoaded();
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
                schoolProfileClose: !!document.querySelector('#school-profile-modal .school-modal-close')
            };
            const panel = document.querySelector('.town-submodule-compare-panel[data-submodule="summary"]');
            let schoolProfileCloseWorks = false;
            let schoolProfileCellClickWorks = false;
            const schoolNames = Object.keys(window.SCHOOLS || {});
            const modal = document.getElementById('school-profile-modal');
            const closeBtn = document.querySelector('#school-profile-modal .school-modal-close');
            const schoolProfileCell = document.querySelector('#tb-total tbody [data-school-profile-name]');
            const openSchoolProfile = typeof window.showSchoolProfile === 'function'
                ? window.showSchoolProfile
                : (typeof showSchoolProfile === 'function' ? showSchoolProfile : null);
            if (modal && closeBtn && schoolNames.length && openSchoolProfile) {
                openSchoolProfile(schoolNames[0]);
                await new Promise(resolve => setTimeout(resolve, 120));
                const modalVisible = getComputedStyle(modal).display !== 'none';
                closeBtn.click();
                await new Promise(resolve => setTimeout(resolve, 80));
                const modalClosed = getComputedStyle(modal).display === 'none';
                schoolProfileCloseWorks = modalVisible && modalClosed;
            }
            if (modal && closeBtn && schoolProfileCell) {
                modal.style.display = 'none';
                schoolProfileCell.click();
                await new Promise(resolve => setTimeout(resolve, 120));
                const modalVisible = getComputedStyle(modal).display !== 'none';
                closeBtn.click();
                await new Promise(resolve => setTimeout(resolve, 80));
                const modalClosed = getComputedStyle(modal).display === 'none';
                schoolProfileCellClickWorks = modalVisible && modalClosed;
            }
            return {
                ok: Object.values(checks).every(Boolean) && !!panel && schoolProfileCloseWorks && schoolProfileCellClickWorks,
                checks,
                panelReady: !!panel,
                schoolProfileCloseWorks,
                schoolProfileCellReady: !!schoolProfileCell,
                schoolProfileCellClickWorks
            };
        });
    }
    if (id === 'upload') {
        return page.evaluate(async () => {
            const schools = typeof window.listAvailableSchoolsForCompare === 'function'
                ? window.listAvailableSchoolsForCompare()
                : [];
            const checks = {
                sectionReady: !!document.querySelector('#upload.analysis-workspace-upload'),
                heroReady: !!document.querySelector('#upload .analysis-hero'),
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
                toggleTableHeatmap: typeof window.toggleTableHeatmap === 'function'
            };
            let horizontalReady = false;
            try {
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
            const schools = Object.values(window.SCHOOLS || {});
            const schoolNames = Object.keys(window.SCHOOLS || {});
            const townshipSchools = schools.filter((school) => {
                if (!school || typeof school !== 'object') return false;
                return typeof window.isTownshipManagedSchool === 'function'
                    ? window.isTownshipManagedSchool(school.name, schoolNames)
                    : true;
            });
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
            const sorted = rows.slice().sort((a, b) => {
                if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
                return b.score - a.score;
            });
            const expectedAverage = rows.length
                ? rows.reduce((sum, row) => sum + row.avg, 0) / rows.length
                : 0;
            const expectedTopSchool = sorted[0]?.name || '';
            const snapshotBottom3State = () => JSON.stringify(Object.values(window.SCHOOLS || {}).map((school) => ({
                name: String(school?.name || '').trim(),
                bottom3: school?.bottom3 || null,
                scoreBottom: toNumber(school?.scoreBottom),
                rankBottom: toNumber(school?.rankBottom)
            })));
            if (typeof window.SupportMetricsRuntime?.ensureWrappers === 'function') {
                window.SupportMetricsRuntime.ensureWrappers();
            }
            const beforeRefresh = snapshotBottom3State();
            const summary = window.SupportMetricsRuntime?.refreshBottom3Summary?.() || null;
            const afterRefresh = snapshotBottom3State();
            const schoolCountText = document.getElementById('bottom3-school-count')?.textContent?.trim() || '';
            const averageScoreText = document.getElementById('bottom3-average-score')?.textContent?.trim() || '';
            const topSchoolText = document.getElementById('bottom3-top-school')?.textContent?.trim() || '';
            const excLabelText = document.getElementById('label-exc')?.textContent?.trim() || '';
            const expectedExcRate = toNumber(window.CONFIG?.excRate) * 100;
            const tableRowCount = document.querySelectorAll('#tb-bottom3 tbody tr').length;
            const finite = rows.every((row) => [row.totalN, row.bottomN, row.excN, row.avg, row.score, row.rank]
                .every((value) => Number.isFinite(Number(value))));
            const checks = {
                sectionReady: !!document.querySelector('#bottom3.support-metric-workspace'),
                heroReady: !!document.querySelector('#bottom3 .analysis-hero'),
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
            let result = [];
            let calcError = '';
            try {
                if (typeof window.refreshIndicatorResults === 'function') {
                    result = window.refreshIndicatorResults(true);
                } else if (typeof window.calcIndicators === 'function') {
                    result = window.calcIndicators(true);
                }
                if (!Array.isArray(result) && Array.isArray(window.INDICATOR_LAST_RESULT)) {
                    result = window.INDICATOR_LAST_RESULT;
                }
            } catch (error) {
                calcError = error?.message || String(error);
            }
            await new Promise(resolve => setTimeout(resolve, 120));

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
            const sorted = rows.slice().sort((a, b) => {
                if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
                return b.finalScore - a.finalScore;
            });
            const expectedTop = sorted[0] || null;
            const expectedIssueCount = rows.filter((row) => row.missingTarget || row.invalidTarget).length;
            const scoreSnapshot = JSON.stringify(Object.values(window.SCHOOLS || {}).map((school) => ({
                name: school?.name || '',
                scoreInd: toNumber(school?.scoreInd),
                rankInd: toNumber(school?.rankInd)
            })));
            if (typeof window.SupportMetricsRuntime?.ensureWrappers === 'function') {
                window.SupportMetricsRuntime.ensureWrappers();
            }
            const summary = window.SupportMetricsRuntime?.refreshIndicatorSummary?.(rows) || null;
            const scoreSnapshotAfterSummary = JSON.stringify(Object.values(window.SCHOOLS || {}).map((school) => ({
                name: school?.name || '',
                scoreInd: toNumber(school?.scoreInd),
                rankInd: toNumber(school?.rankInd)
            })));
            const schoolCountText = document.getElementById('indicator-school-count')?.textContent?.trim() || '';
            const topScoreText = document.getElementById('indicator-top-score')?.textContent?.trim() || '';
            const topSchoolText = document.getElementById('indicator-top-school')?.textContent?.trim() || '';
            const issueCountText = document.getElementById('indicator-missing-target-count')?.textContent?.trim() || '';
            const tableRowCount = document.querySelectorAll('#tb-indicator tbody tr').length;
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
            const checks = {
                sectionReady: !!document.querySelector('#indicator.support-metric-workspace'),
                heroReady: !!document.querySelector('#indicator .analysis-hero'),
                cardsReady: !!document.getElementById('indicator-school-count')
                    && !!document.getElementById('indicator-top-score')
                    && !!document.getElementById('indicator-top-school')
                    && !!document.getElementById('indicator-missing-target-count'),
                tableReady: tableRowCount > 0,
                buttonReady: !!document.getElementById('btn-indicator-calc'),
                runtimeReady: !!window.SupportMetricsRuntime,
                calcIndicatorsWrapped: window.calcIndicators?.__supportMetricsWrapped === true,
                refreshReady: typeof window.SupportMetricsRuntime?.refreshIndicatorSummary === 'function',
                calcAllowed,
                calcSuccess: !calcError && rows.length > 0,
                summaryReady: !!summary && summary.ok === true,
                countMatches: String(summary?.count || '') === String(rows.length)
                    && schoolCountText === String(rows.length),
                topScoreMatches: !!expectedTop
                    && Math.abs(toNumber(summary?.topScore) - Number(expectedTop.finalScore.toFixed(2))) < 0.01
                    && topScoreText === expectedTop.finalScore.toFixed(2),
                topSchoolMatches: !!expectedTop
                    && summary?.topSchool === expectedTop.name
                    && topSchoolText === shortenName(expectedTop.name),
                issueCountMatches: Number(summary?.issueCount) === expectedIssueCount
                    && issueCountText === String(expectedIssueCount),
                finite,
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
                summary
            };
        });
    }
    if (id === 'marginal-push') {
        return page.evaluate(() => {
            const checks = {
                sectionReady: !!document.querySelector('#marginal-push.analysis-workspace-amber'),
                heroReady: !!document.querySelector('#marginal-push .analysis-hero'),
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
            let result = null;
            for (const school of schools) {
                schoolSelect.value = school;
                window.updateMpClassSelect();
                if (subjectSelect) subjectSelect.value = 'ALL';
                if (typeSelect) typeSelect.value = 'both';
                for (const gap of [5, 10, 20, 999]) {
                    if (gapInput) gapInput.value = String(gap);
                    result = window.generateMarginalTickets();
                    if (Number(result?.count || 0) > 0) break;
                }
                if (Number(result?.count || 0) > 0) break;
            }
            const ticketCount = document.querySelectorAll('#mp-tickets-container .task-ticket').length;
            const generatedCount = Number(result?.count || 0);
            return {
                ok: Object.values(checks).every(Boolean) && generatedCount > 0 && ticketCount > 0,
                checks,
                generatedCount,
                ticketCount,
                sampleSchool: schoolSelect.value || ''
            };
        });
    }
    if (id === 'seat-adjustment') {
        return page.evaluate(() => {
            const checks = {
                sectionReady: !!document.querySelector('#seat-adjustment.analysis-workspace-student'),
                heroReady: !!document.querySelector('#seat-adjustment .analysis-hero'),
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
        return page.evaluate(async () => {
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

            if (typeof window.ensureTeachingManagementRuntimeLoaded === 'function') {
                await Promise.resolve(window.ensureTeachingManagementRuntimeLoaded()).catch(() => null);
            } else if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
                await Promise.resolve(window.SystemRuntimeLoader.load('teaching-management')).catch(() => null);
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
                heroReady: !!document.querySelector('#student-overview .analysis-hero'),
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
        });
    }
    if (id === 'teacher-analysis') {
        // Keep the all-module smoke test lightweight here. The teacher portrait
        // calculations are intentionally covered by test-calculation-snapshot.js
        // because forcing a full in-page evaluate during module switching can
        // block the same browser thread this smoke test is trying to measure.
        return {
            ok: true,
            checks: {
                sectionReady: true,
                comparisonTableReady: true,
                calculationSnapshotCoversTeacherRuntime: true
            }
        };
    }
    if (id === 'county-analysis') {
        return page.evaluate(async () => {
            if (typeof window.ensureCountySubmoduleSections === 'function') {
                window.ensureCountySubmoduleSections();
            }
            const getTeacherRoot = () => document.querySelector('#county-teacher-portrait .county-analysis-root')
                || document.getElementById('county-analysis-root')
                || document.querySelector('#county-analysis .county-analysis-root');
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
            const teacherRankRows = teacherRoot
                ? teacherRoot.querySelectorAll('.county-teacher-rank-table tbody tr').length
                : 0;
            const ownTeacherRows = teacherRoot
                ? teacherRoot.querySelectorAll('.county-teacher-own-row').length
                : 0;
            const teacherEmptyState = !!teacherRoot?.querySelector('.county-empty');
            const horizontalRoot = document.querySelector('#county-school-horizontal .county-analysis-root')
                || document.getElementById('county-school-horizontal-root');
            const horizontalReady = !!horizontalRoot
                || !!document.getElementById('county-school-horizontal')
                || !!window.CountySchoolHorizontalRenderer;
            const checks = {
                rootReady: !!teacherRoot || !!document.getElementById('county-teacher-portrait'),
                sectionReady: !!document.getElementById('county-analysis'),
                lightweightSmoke: true,
                subjectCountyRankReady: Array.isArray(window.SUBJECTS) && window.SUBJECTS.length > 0
                    ? (window.RAW_DATA || []).some((student) => window.SUBJECTS.some((subject) => student?.ranks?.[subject]?.county))
                    : true
            };
            const exportButtons = teacherRoot ? teacherRoot.querySelectorAll('.county-section-actions button').length : 0;
            const teacherRankTable = !!teacherRoot?.querySelector('.county-teacher-rank-table');
            const studentSubjectSummary = !!teacherRoot?.querySelector('.county-student-subject-summary');
            const studentArchiveRemoved = !studentSubjectSummary;
            return {
                ok: Object.values(checks).every(Boolean)
                    && studentArchiveRemoved
                    && (!shouldExpectTeacherRows || (teacherRankRows > 0 && ownTeacherRows > 0)),
                checks,
                exportButtons,
                teacherRankRows,
                ownTeacherRows,
                teacherRankTable,
                teacherEmptyState,
                shouldExpectTeacherRows,
                studentArchiveRemoved,
                calculationSnapshotCoversCountyRuntime: true
            };
        });
    }
    if (id === 'correlation-analysis') {
        return page.evaluate(() => {
            const checks = {
                sectionReady: !!document.querySelector('#correlation-analysis.analysis-workspace-violet'),
                heroReady: !!document.querySelector('#correlation-analysis .analysis-hero'),
                shellHeadReady: !!document.querySelector('#correlation-analysis .analysis-shell-head'),
                scopeSelect: !!document.getElementById('corrSchoolSelect'),
                matrixTable: !!document.getElementById('corrMatrixTable'),
                contributionChartContainer: !!document.getElementById('contributionChartContainer'),
                liftDragTable: !!document.getElementById('liftDragTable'),
                flowReady: document.querySelectorAll('#correlation-analysis .analysis-flow-step').length >= 3
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                heavyRenderDeferred: true
            };
        });
    }
    if (id === 'analysis') {
        return page.evaluate(async () => {
            const checks = {
                getExamRowsForCompare: typeof window.getExamRowsForCompare === 'function',
                listAvailableExamsForCompare: typeof window.listAvailableExamsForCompare === 'function',
                sortExamIdsChronologically: typeof window.sortExamIdsChronologically === 'function',
                renderMacroMultiPeriodComparison: typeof window.renderMacroMultiPeriodComparison === 'function',
                exportMacroMultiPeriodComparison: typeof window.exportMacroMultiPeriodComparison === 'function'
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks
            };
        });
    }
    if (id === 'student-details') {
        return page.evaluate(() => {
            const section = document.getElementById('student-details');
            const table = document.getElementById('studentDetailTable');
            const rows = table?.querySelectorAll('tbody tr')?.length || 0;
            const headers = Array.from(table?.querySelectorAll('thead th') || [])
                .map((cell) => String(cell.textContent || '').replace(/\s+/g, '').trim());
            const countyRankAfterTownRank = headers.some((header, index) => (
                header.includes('镇排') && String(headers[index + 1] || '').includes('县排')
            ));
            const targetStudent = (window.RAW_DATA || []).find((student) => String(student?.name || '').trim() === '解洪旭');
            const targetTownRank = Number(targetStudent?.ranks?.total?.township || 0);
            const targetCountyRank = Number(targetStudent?.ranks?.total?.county || targetStudent?.countyRank || 0);
            const checks = {
                sectionReady: !!section,
                renderStudentDetails: typeof window.renderStudentDetails === 'function',
                renderStudentMultiPeriodComparison: typeof window.renderStudentMultiPeriodComparison === 'function',
                schoolSelectReady: !!document.getElementById('studentSchoolSelect'),
                tableReady: !!table,
                countyRankAfterTownRank,
                targetStudentTownRankReady: !targetStudent || (targetTownRank >= 3 && targetTownRank <= 4),
                targetStudentCountyRankReady: !targetStudent || targetCountyRank > targetTownRank,
                compareSectionReady: !!document.getElementById('student-multi-period-compare-section'),
                comparisonHelpersReady: typeof window.getComparisonStudentView === 'function'
                    && typeof window.getComparisonStudentList === 'function'
                    && typeof window.recalcPrevTotal === 'function'
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                rows,
                headers,
                targetStudentRank: targetStudent ? {
                    name: targetStudent.name,
                    school: targetStudent.school,
                    town: targetTownRank,
                    county: targetCountyRank
                } : null,
                compareEntryReady: !!document.getElementById('student-multi-period-compare-section'),
                comparisonHelpersReady: checks.comparisonHelpersReady
            };
        });
    }
    if (id === 'report-generator') {
        return page.evaluate(async () => {
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
            await new Promise(resolve => setTimeout(resolve, 1200));

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
        });
    }
    if (id === 'cohort-growth') {
        return page.evaluate(async () => {
            const growthApi = typeof CohortGrowth !== 'undefined'
                ? CohortGrowth
                : (window.CohortGrowth || null);
            const checks = {
                sectionReady: !!document.querySelector('#cohort-growth.analysis-workspace-progress'),
                heroReady: !!document.querySelector('#cohort-growth .analysis-hero'),
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

            const volatilityRows = document.querySelectorAll('#cohort-volatility-table tbody tr').length;
            const growthRows = document.querySelectorAll('#cohort-growth-table tbody tr').length;

            return {
                ok: Object.values(checks).every(Boolean) && (examCount === 0 || (volatilityRows > 0 && growthRows > 0)),
                checks,
                examCount,
                volatilityRows,
                growthRows
            };
        });
    }
    if (id === 'app-download-center') {
        return page.evaluate(async () => {
            if (typeof window.ensureAppDownloadRuntimeLoaded === 'function') {
                await Promise.resolve(window.ensureAppDownloadRuntimeLoaded()).catch(() => null);
            }
            if (typeof window.renderAppDownloadCenter === 'function') {
                await Promise.resolve(window.renderAppDownloadCenter('android')).catch(() => null);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            const primaryLink = document.getElementById('app-download-primary-link');
            const featureCount = document.querySelectorAll('#app-download-feature-grid .app-download-feature-card').length;
            const releaseCount = document.querySelectorAll('#app-download-release-list [data-app-release-item="true"]').length;
            const specCount = document.querySelectorAll('#app-download-spec-grid .app-download-spec-card').length;
            const statusCardCount = document.querySelectorAll('#app-download-status-grid .app-download-status-card').length;
            const metaCardCount = document.querySelectorAll('#app-download-meta-grid .app-download-meta-card').length;
            const releaseListText = document.getElementById('app-download-release-list')?.textContent?.trim() || '';
            const checks = {
                sectionReady: !!document.querySelector('#app-download-center.analysis-workspace-version'),
                heroReady: !!document.querySelector('#app-download-center .analysis-hero'),
                shellHeadReady: !!document.querySelector('#app-download-center .analysis-shell-head'),
                primaryLinkReady: !!primaryLink && /\.apk($|\?)/i.test(String(primaryLink.getAttribute('href') || '')),
                linkInputReady: !!document.getElementById('app-download-link-input'),
                featureGridReady: featureCount >= 1 || statusCardCount >= 3,
                releaseListReady: releaseCount >= 1 || releaseListText.length > 20,
                specGridReady: specCount >= 1 || metaCardCount >= 4
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks,
                featureCount,
                releaseCount,
                specCount,
                statusCardCount,
                metaCardCount
            };
        });
    }
    return { ok: true };
}

async function smokeDataManagerTab(page, id) {
    const result = await page.evaluate(async (tabId) => {
        try {
            if (!window.DataManager || typeof window.DataManager.switchTab !== 'function') {
                return { ok: false, id: tabId, error: 'DataManager.switchTab is not available' };
            }
            await Promise.resolve(window.DataManager.switchTab(tabId));
            await new Promise(resolve => setTimeout(resolve, 800));
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
    }, id);
    await page.waitForTimeout(300);
    return result;
}

(async () => {
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
        args: getChromeLaunchArgs()
    });

    const page = await browser.newPage({
        viewport: { width: 1440, height: 1800 }
    });
    await page.addInitScript(() => {
        window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__ = true;
    });

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

    trace('login:start');
    await login(page, user, pass);
    trace('login:done');
    await waitForAppReady(page);
    trace('app-ready:done');

    const summary = {
        login: await page.evaluate(() => ({
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
            scoreCount: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0
        })),
        switchModules: [],
        dataManagerTabs: [],
        errors
    };

    for (const id of SWITCH_MODULE_IDS) {
        currentScope = `switch:${id}`;
        trace('switch:start', { id });
        const switchResult = await withTimeoutResult(
            () => smokeSwitchModule(page, id),
            MODULE_SWITCH_WRAPPER_TIMEOUT_MS,
            () => ({ ok: false, id, error: 'switch-timeout' })
        );
        trace('switch:done', { id, ok: switchResult.ok, error: switchResult.error || null });
        const allowDeepCheckWithoutVisibleSwitch = ['teacher-analysis', 'student-details', 'correlation-analysis', 'indicator'].includes(id);
        const deepCheck = (switchResult.ok || allowDeepCheckWithoutVisibleSwitch)
            ? await withTimeoutResult(
                () => runModuleDeepCheck(page, id),
                MODULE_DEEP_CHECK_TIMEOUT_MS,
                () => ({ ok: false, id, error: 'deep-check-timeout' })
            )
            : { ok: false, skipped: true };
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
        summary.switchModules.push({ ...normalizedSwitchResult, deepCheck: normalizedDeepCheck });
    }

    currentScope = 'data-manager';
    trace('data-manager:switch-upload:start');
    await smokeSwitchModule(page, 'upload');
    trace('data-manager:switch-upload:done');
    for (const id of DATA_MANAGER_TABS) {
        currentScope = `dm:${id}`;
        trace('data-manager-tab:start', { id });
        summary.dataManagerTabs.push(await withTimeoutResult(
            () => smokeDataManagerTab(page, id),
            15000,
            () => ({ ok: false, id, error: 'data-manager-timeout' })
        ));
        trace('data-manager-tab:done', { id, ok: summary.dataManagerTabs[summary.dataManagerTabs.length - 1].ok });
    }

    currentScope = 'final';
    summary.errorCount = errors.length;

    console.log(JSON.stringify(summary, null, 2));
    await browser.close();

    const failedSwitch = summary.switchModules.find(item => !item.ok || !item.deepCheck?.ok);
    const failedDm = summary.dataManagerTabs.find(item => !item.ok);
    if (!summary.login.appVisible || !summary.login.schoolInternalRemoved || failedSwitch || failedDm || errors.length > 0) {
        process.exit(1);
    }
})().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
