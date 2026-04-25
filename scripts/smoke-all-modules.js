try {
    require.resolve('playwright');
} catch (e) {
    console.error('playwright is required for smoke-all-modules. Run: npm install --no-save playwright');
    process.exit(1);
}

const { chromium } = require('playwright');

const SWITCH_MODULE_IDS = [
    'starter-hub',
    'upload',
    'summary',
    'analysis',
    'teacher-analysis',
    'single-school-eval',
    'correlation-analysis',
    'indicator',
    'bottom3',
    'marginal-push',
    'progress-analysis',
    'cohort-growth',
    'report-generator',
    'ai-analysis',
    'app-download-center',
    'freshman-simulator',
    'exam-arranger',
    'teaching-overview',
    'teaching-issue-board',
    'teaching-warning-center',
    'teaching-rectify-center',
    'teaching-version-center',
    'student-overview',
    'student-details'
];

const DATA_MANAGER_TABS = ['student', 'teacher', 'targets', 'params', 'sql', 'cloud'];

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
            maskVisible: !!mask && getComputedStyle(mask).display !== 'none'
        };
    });

    if (!(bootState.overlayHidden && (bootState.appVisible || bootState.maskVisible))) {
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
            return overlayHidden && (appVisible || maskVisible);
        }, undefined, { timeout: 90000 });
    }, { attempts: 4 });

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
        const input = document.getElementById('entry-cohort-year');
        const selector = document.getElementById('cohort-selector');
        const infer = typeof window.inferCohortIdFromValue === 'function'
            ? window.inferCohortIdFromValue
            : (() => '');
        return {
            maskVisible: !!mask && getComputedStyle(mask).display !== 'none',
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

    try {
        await withNavigationRetry(page, () => page.waitForFunction(() => {
            const mask = document.getElementById('mode-mask');
            const examId = String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
            const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
            return (!mask || getComputedStyle(mask).display === 'none')
                || (!!examId && rawDataLen > 0);
        }, undefined, { timeout: 15000 }), { attempts: 1 });
    } catch (_) {
        // 云端恢复可能仍在进行，超时后再决定是否需要手动进入届别。
    }

    state = await withNavigationRetry(page, readEntryState, { attempts: 4 });
    if (!state.maskVisible || (state.examId && state.rawDataLen > 0)) return state;

    const candidate = String(
        process.env.SMOKE_COHORT_YEAR
        || state.inputValue
        || state.currentCohortId
        || state.knownCohorts[0]
        || state.inferredCohortId
        || ''
    ).trim();

    if (!candidate) return state;

    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const mask = document.getElementById('mode-mask');
            if (!mask || getComputedStyle(mask).display === 'none') return true;
            return (
                typeof window.enterCohortFromMask === 'function'
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
        await page.evaluate(() => {
            if (typeof window.enterCohortFromMask === 'function') {
                window.enterCohortFromMask();
                return;
            }
            const button = document.querySelector('button[onclick="enterCohortFromMask()"]');
            if (button) button.click();
        });
        await waitForPageStability(page, 10000);
        await page.waitForFunction(() => {
            const mask = document.getElementById('mode-mask');
            const app = document.getElementById('app');
            return (!mask || getComputedStyle(mask).display === 'none')
                && !!app
                && getComputedStyle(app).display !== 'none'
                && !app.classList.contains('hidden');
        }, undefined, { timeout: 20000 });
    }, { attempts: 4 });
}

async function waitForAppReady(page) {
    const deadline = Date.now() + 90000;
    let lastState = null;

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

        await page.waitForTimeout(1000);
    }

    throw new Error(`app not ready for smoke run: ${JSON.stringify(lastState)}`);
}

async function smokeSwitchModule(page, id) {
    const collectState = async () => page.evaluate((moduleId) => {
        const section = document.getElementById(moduleId);
        if (!section) return { ok: false, id: moduleId, error: 'target section not found' };
        const style = getComputedStyle(section);
        const visible = style.display !== 'none';
        const active = section.classList.contains('active');
        const title = section.querySelector('h1,h2,h3,.sub-header,.sec-head')?.textContent?.trim() || '';
        return { ok: visible && active, id: moduleId, visible, active, title };
    }, id);

    try {
        await page.evaluate((moduleId) => {
            if (typeof window.switchTab !== 'function') {
                throw new Error('switchTab is not available');
            }
            window.switchTab(moduleId);
        }, id);

        await page.waitForFunction((moduleId) => {
            const section = document.getElementById(moduleId);
            if (!section) return false;
            const style = getComputedStyle(section);
            return style.display !== 'none' && section.classList.contains('active');
        }, id, { timeout: 5000 });
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
            if (typeof window.switchTab === 'function') window.switchTab(moduleId);
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
            const schoolNames = Object.keys(window.SCHOOLS || {});
            const modal = document.getElementById('school-profile-modal');
            const closeBtn = document.querySelector('#school-profile-modal .school-modal-close');
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
            return {
                ok: Object.values(checks).every(Boolean) && !!panel && schoolProfileCloseWorks,
                checks,
                panelReady: !!panel,
                schoolProfileCloseWorks
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
    if (id === 'teacher-analysis') {
        await page.waitForFunction(() => window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__ === true, undefined, { timeout: 15000 });
        return page.evaluate(async () => {
            const checks = {
                runtimeLoaded: window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__ === true,
                analyzeTeachers: typeof window.analyzeTeachers === 'function',
                renderTeacherCards: typeof window.renderTeacherCards === 'function',
                renderTeacherComparisonTable: typeof window.renderTeacherComparisonTable === 'function',
                renderTeacherTownshipRanking: typeof window.renderTeacherTownshipRanking === 'function',
                renderTeacherMultiPeriodComparison: typeof window.renderTeacherMultiPeriodComparison === 'function',
                renderAllTeachersMultiPeriodComparison: typeof window.renderAllTeachersMultiPeriodComparison === 'function',
                exportTeacherMultiPeriodComparison: typeof window.exportTeacherMultiPeriodComparison === 'function'
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks
            };
        });
    }
    if (id === 'teaching-overview') {
        return page.evaluate(async () => {
            const checks = {
                renderTeachingOverview: typeof window.renderTeachingOverview === 'function',
                sectionReady: !!document.querySelector('#teaching-overview.analysis-workspace-management'),
                heroReady: !!document.querySelector('#teaching-overview .analysis-hero'),
                shellHeadReady: !!document.querySelector('#teaching-overview .analysis-shell-head'),
                statusStripReady: document.querySelectorAll('#tm-status-strip .tm-stat-card-inner').length >= 4,
                contextReady: !!document.querySelector('#tm-context-panel .analysis-section-head'),
                flowReady: document.querySelectorAll('#teaching-overview .analysis-flow-step').length >= 3,
                nextActionReady: !!document.querySelector('#tmNextAction .tm-next-card'),
                quickEntryReady: document.querySelectorAll('#tmQuickEntry [data-target]').length >= 4,
                cloudPanelReady: !!document.getElementById('tmCloudOpsList'),
                quickActionsReady: !!document.getElementById('tmQuickSyncTeacherBtn')
                    && !!document.getElementById('tmQuickOpenConsoleBtn')
                    && !!document.getElementById('tmQuickExportBtn')
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks
            };
        });
    }
    if (id === 'single-school-eval') {
        await page.evaluate(async () => {
            if (typeof window.ensureSingleSchoolEvalRuntimeLoaded === 'function') {
                await window.ensureSingleSchoolEvalRuntimeLoaded();
            }
        });
        await page.waitForFunction(() => window.__SINGLE_SCHOOL_EVAL_RUNTIME_PATCHED__ === true, undefined, { timeout: 15000 });
        return page.evaluate(async () => {
            const checks = {
                sectionReady: !!document.querySelector('#single-school-eval.analysis-workspace-management'),
                heroReady: !!document.querySelector('#single-school-eval .analysis-hero'),
                shellHeadReady: !!document.querySelector('#single-school-eval .analysis-shell-head'),
                runtimeLoaded: window.__SINGLE_SCHOOL_EVAL_RUNTIME_PATCHED__ === true,
                updateSSESchoolSelect: typeof window.updateSSESchoolSelect === 'function',
                SSE_calculate: typeof window.SSE_calculate === 'function',
                SSE_export: typeof window.SSE_export === 'function',
                schoolSelect: !!document.getElementById('sse_school_select'),
                resultContainer: !!document.getElementById('sse_result_container'),
                resultTable: !!document.getElementById('sse_table'),
                principleReady: document.querySelectorAll('#single-school-eval .sse-principle-card').length >= 3,
                flowReady: document.querySelectorAll('#single-school-eval .analysis-flow-step').length >= 3
            };
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks, schoolOptionCount: 0, rows: 0, resultVisible: false };
            }

            await window.updateSSESchoolSelect();
            await new Promise(resolve => setTimeout(resolve, 150));

            const schoolSelect = document.getElementById('sse_school_select');
            const schoolValues = Array.from(schoolSelect.options || [])
                .map((option) => String(option.value || '').trim())
                .filter(Boolean);

            if (!schoolValues.length) {
                return { ok: false, checks, schoolOptionCount: 0, rows: 0, resultVisible: false };
            }

            schoolSelect.value = schoolValues[0];
            await window.SSE_calculate();
            await new Promise(resolve => setTimeout(resolve, 600));

            const resultContainer = document.getElementById('sse_result_container');
            const rows = document.querySelectorAll('#sse_table tbody tr').length;
            const resultVisible = !!resultContainer && !resultContainer.classList.contains('hidden');

            return {
                ok: Object.values(checks).every(Boolean) && schoolValues.length > 0 && resultVisible && rows > 0,
                checks,
                schoolOptionCount: schoolValues.length,
                rows,
                resultVisible
            };
        });
    }
    if (id === 'correlation-analysis') {
        return page.evaluate(async () => {
            const checks = {
                sectionReady: !!document.querySelector('#correlation-analysis.analysis-workspace-violet'),
                heroReady: !!document.querySelector('#correlation-analysis .analysis-hero'),
                shellHeadReady: !!document.querySelector('#correlation-analysis .analysis-shell-head'),
                updateCorrelationSchoolSelect: typeof window.updateCorrelationSchoolSelect === 'function',
                renderCorrelationAnalysis: typeof window.renderCorrelationAnalysis === 'function',
                exportCorrelationExcel: typeof window.exportCorrelationExcel === 'function',
                scopeSelect: !!document.getElementById('corrSchoolSelect'),
                matrixTable: !!document.getElementById('corrMatrixTable'),
                contributionChartContainer: !!document.getElementById('contributionChartContainer'),
                liftDragTable: !!document.getElementById('liftDragTable'),
                flowReady: document.querySelectorAll('#correlation-analysis .analysis-flow-step').length >= 3
            };
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks, matrixRows: 0, liftRows: 0, chartReady: false };
            }

            await window.updateCorrelationSchoolSelect();
            await new Promise(resolve => setTimeout(resolve, 120));
            const scopeSelect = document.getElementById('corrSchoolSelect');
            if (scopeSelect && !String(scopeSelect.value || '').trim()) {
                scopeSelect.value = 'ALL';
            }
            await window.renderCorrelationAnalysis();
            await new Promise(resolve => setTimeout(resolve, 300));

            const matrixRows = document.querySelectorAll('#corrMatrixTable tbody tr').length;
            const liftRows = document.querySelectorAll('#liftDragTable tbody tr').length;
            const chartReady = String(document.getElementById('contributionChartContainer')?.innerHTML || '').trim().length > 0;

            return {
                ok: Object.values(checks).every(Boolean) && matrixRows > 0 && liftRows > 0 && chartReady,
                checks,
                matrixRows,
                liftRows,
                chartReady
            };
        });
    }
    if (id === 'teaching-warning-center') {
        return page.evaluate(async () => {
            const refreshButton = document.getElementById('tmWarningCenterRefreshBtn');
            const checks = {
                sectionReady: !!document.querySelector('#teaching-warning-center.analysis-workspace-management'),
                heroReady: !!document.querySelector('#teaching-warning-center .analysis-hero'),
                shellHeadReady: !!document.querySelector('#teaching-warning-center .analysis-shell-head'),
                tmRenderWarningCenter: typeof window.tmRenderWarningCenter === 'function',
                tmRefreshCloudOps: typeof window.tmRefreshCloudOps === 'function',
                tmCreateRectifyTaskFromWarning: typeof window.tmCreateRectifyTaskFromWarning === 'function',
                tmIgnoreCloudWarning: typeof window.tmIgnoreCloudWarning === 'function',
                refreshButton: !!refreshButton,
                refreshBound: !!refreshButton && typeof refreshButton.onclick === 'function',
                toolbarReady: !!document.getElementById('tmWarningLevelFilter')
                    && !!document.getElementById('tmWarningStatusFilter')
                    && !!document.getElementById('tmWarningTypeFilter'),
                listReady: !!document.getElementById('tmWarningCenterList'),
                summaryReady: document.querySelectorAll('#teaching-warning-center .tm-center-summary-grid > div').length >= 4,
                flowReady: document.querySelectorAll('#teaching-warning-center .analysis-flow-step').length >= 3
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks
            };
        });
    }
    if (id === 'teaching-rectify-center') {
        return page.evaluate(async () => {
            const refreshButton = document.getElementById('tmRectifyCenterRefreshBtn');
            const createButton = document.getElementById('tmRectifyCreateBtn');
            const checks = {
                sectionReady: !!document.querySelector('#teaching-rectify-center.analysis-workspace-management'),
                heroReady: !!document.querySelector('#teaching-rectify-center .analysis-hero'),
                shellHeadReady: !!document.querySelector('#teaching-rectify-center .analysis-shell-head'),
                tmRenderRectifyCenter: typeof window.tmRenderRectifyCenter === 'function',
                tmRefreshCloudOps: typeof window.tmRefreshCloudOps === 'function',
                tmCreateManualRectifyTask: typeof window.tmCreateManualRectifyTask === 'function',
                tmUpdateRectifyTaskStatus: typeof window.tmUpdateRectifyTaskStatus === 'function',
                tmPromptRectifyProgress: typeof window.tmPromptRectifyProgress === 'function',
                refreshButton: !!refreshButton,
                refreshBound: !!refreshButton && typeof refreshButton.onclick === 'function',
                createButton: !!createButton,
                createBound: !!createButton && typeof createButton.onclick === 'function',
                toolbarReady: !!document.getElementById('tmRectifyStatusFilter')
                    && !!document.getElementById('tmRectifyPriorityFilter')
                    && !!document.getElementById('tmRectifyOwnerFilter'),
                listReady: !!document.getElementById('tmRectifyCenterList'),
                summaryReady: document.querySelectorAll('#teaching-rectify-center .tm-center-summary-grid > div').length >= 4,
                flowReady: document.querySelectorAll('#teaching-rectify-center .analysis-flow-step').length >= 3
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks
            };
        });
    }
    if (id === 'teaching-issue-board') {
        return page.evaluate(async () => {
            const refreshButton = document.getElementById('tmIssueBoardRefreshBtn');
            const checks = {
                sectionReady: !!document.querySelector('#teaching-issue-board.analysis-workspace-management'),
                heroReady: !!document.querySelector('#teaching-issue-board .analysis-hero'),
                shellHeadReady: !!document.querySelector('#teaching-issue-board .analysis-shell-head'),
                tmRenderIssueBoard: typeof window.tmRenderIssueBoard === 'function',
                refreshButton: !!refreshButton,
                refreshBound: !!refreshButton && typeof refreshButton.onclick === 'function',
                listReady: !!document.getElementById('tmIssueBoardList'),
                summaryReady: document.querySelectorAll('#teaching-issue-board .tm-center-summary-grid > div').length >= 4,
                flowReady: document.querySelectorAll('#teaching-issue-board .analysis-flow-step').length >= 3
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks
            };
        });
    }
    if (id === 'teaching-version-center') {
        return page.evaluate(async () => {
            const refreshButton = document.getElementById('tmVersionRefreshBtn');
            const createButton = document.getElementById('tmVersionCreateBtn');
            const stableButton = document.getElementById('tmVersionMarkLatestStableBtn');
            const compareButton = document.getElementById('tmVersionCompareStableBtn');
            const checks = {
                sectionReady: !!document.querySelector('#teaching-version-center.analysis-workspace-version'),
                heroReady: !!document.querySelector('#teaching-version-center .analysis-hero'),
                shellHeadReady: !!document.querySelector('#teaching-version-center .analysis-shell-head'),
                tmRefreshVersionCenter: typeof window.tmRefreshVersionCenter === 'function',
                tmCreateCurrentVersionSnapshot: typeof window.tmCreateCurrentVersionSnapshot === 'function',
                tmMarkLatestVersionStable: typeof window.tmMarkLatestVersionStable === 'function',
                tmShowVersionDiff: typeof window.tmShowVersionDiff === 'function',
                refreshButton: !!refreshButton,
                refreshBound: !!refreshButton && typeof refreshButton.onclick === 'function',
                createButton: !!createButton,
                createBound: !!createButton && typeof createButton.onclick === 'function',
                stableButton: !!stableButton,
                stableBound: !!stableButton && typeof stableButton.onclick === 'function',
                compareButton: !!compareButton,
                compareBound: !!compareButton && typeof compareButton.onclick === 'function',
                toolbarReady: !!document.getElementById('tmVersionSearchInput')
                    && !!document.getElementById('tmVersionStableFilter')
                    && !!document.getElementById('tmVersionSortOrder')
                    && !!document.getElementById('tmVersionDiffOnlyBtn')
                    && !!document.getElementById('tmVersionNormalDiffBtn'),
                summaryReady: document.querySelectorAll('#teaching-version-center .tm-center-summary-grid > div').length >= 4,
                metaReady: !!document.getElementById('tmVersionScopeMeta')
                    && !!document.getElementById('tmVersionStableMeta'),
                diffPanelReady: !!document.getElementById('tmVersionDiffPanel')
                    && !!document.getElementById('tmVersionDiffEmpty'),
                flowReady: document.querySelectorAll('#teaching-version-center .analysis-flow-step').length >= 3,
                listReady: !!document.getElementById('tmVersionCenterList')
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks
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
        return page.evaluate(async () => {
            if (typeof window.renderStudentDetails !== 'function') {
                return { ok: false, id: 'student-details', error: 'renderStudentDetails is not available' };
            }
            if (typeof window.renderStudentMultiPeriodComparison !== 'function') {
                return { ok: false, id: 'student-details', error: 'renderStudentMultiPeriodComparison is not available' };
            }
            window.renderStudentDetails(true);
            await new Promise(resolve => setTimeout(resolve, 1200));
            const table = document.getElementById('studentDetailTable');
            const rows = table?.querySelectorAll('tbody tr')?.length || 0;
            return {
                ok: !!table && rows >= 0,
                rows,
                compareEntryReady: true,
                comparisonHelpersReady: typeof window.getComparisonStudentView === 'function'
                    && typeof window.getComparisonStudentList === 'function'
                    && typeof window.recalcPrevTotal === 'function'
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

            const schools = Object.keys(window.SCHOOLS || {});
            const school = schools[0] || '';
            const student = school ? (window.SCHOOLS?.[school]?.students?.[0] || null) : null;
            if (!school || !student || !schoolSelect || !classSelect || !nameInput) {
                return { ok: false, checks, error: 'report form or sample student unavailable' };
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
                contentReady
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
    if (id === 'ai-analysis') {
        return page.evaluate(async () => {
            const checks = {
                sectionReady: !!document.querySelector('#ai-analysis.analysis-workspace-ai'),
                heroReady: !!document.querySelector('#ai-analysis .analysis-hero'),
                shellHeadReady: !!document.querySelector('#ai-analysis .analysis-shell-head'),
                configInputsReady: !!document.getElementById('llm_apikey')
                    && !!document.getElementById('llm_baseurl')
                    && !!document.getElementById('llm_model'),
                batchSelectorsReady: !!document.getElementById('ai-school-select')
                    && !!document.getElementById('ai-class-select'),
                batchWorkspaceReady: !!document.getElementById('batch-ai-workspace'),
                statusBoxesReady: !!document.getElementById('ai-gateway-status')
                    && !!document.getElementById('ai-current-student-summary')
                    && !!document.getElementById('ai-batch-summary')
                    && !!document.getElementById('ai-macro-summary'),
                connectionActionReady: typeof window.testAIConnectionFromHub === 'function',
                batchActionReady: typeof window.openAIBatchWorkspaceFromHub === 'function',
                macroActionReady: typeof window.runAIMacroReportFromHub === 'function'
            };
            const panelCount = document.querySelectorAll('#ai-analysis .analysis-ai-panel').length;
            return {
                ok: Object.values(checks).every(Boolean) && panelCount >= 4,
                checks,
                panelCount
            };
        });
    }
    if (id === 'app-download-center') {
        return page.evaluate(async () => {
            const primaryLink = document.getElementById('app-download-primary-link');
            const checks = {
                sectionReady: !!document.querySelector('#app-download-center.analysis-workspace-version'),
                heroReady: !!document.querySelector('#app-download-center .analysis-hero'),
                shellHeadReady: !!document.querySelector('#app-download-center .analysis-shell-head'),
                primaryLinkReady: !!primaryLink && /\.apk($|\?)/i.test(String(primaryLink.getAttribute('href') || '')),
                linkInputReady: !!document.getElementById('app-download-link-input'),
                featureGridReady: document.querySelectorAll('#app-download-feature-grid .app-download-feature-card').length >= 4,
                releaseListReady: document.querySelectorAll('#app-download-release-list [data-app-release-item="true"]').length >= 2,
                specGridReady: document.querySelectorAll('#app-download-spec-grid .app-download-spec-card').length >= 6
            };
            return {
                ok: Object.values(checks).every(Boolean),
                checks
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
                    rowDownloadButton: !hasCloudRows || !!document.querySelector('#dm-cloud-table tbody button[onclick*="downloadCloudBackup"]')
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
        headless: true
    });

    const page = await browser.newPage({
        viewport: { width: 1440, height: 1800 }
    });

    const user = process.env.SMOKE_USER || 'admin';
    const pass = process.env.SMOKE_PASS || 'admin123';
    const errors = [];
    const recentFailedRequests = [];
    let currentScope = 'boot';

    page.on('pageerror', error => {
        errors.push({ scope: currentScope, type: 'pageerror', message: error.message });
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

    page.on('console', msg => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (shouldIgnoreConsoleMessage(text, {
            smokeUrl: process.env.SMOKE_URL || 'https://schoolsystem.com.cn/',
            recentFailedRequests
        })) return;
        errors.push({ scope: currentScope, type: 'console', message: text });
    });

    await login(page, user, pass);
    await waitForAppReady(page);

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
        const switchResult = await smokeSwitchModule(page, id);
        const deepCheck = switchResult.ok ? await runModuleDeepCheck(page, id) : { ok: false, skipped: true };
        summary.switchModules.push({ ...switchResult, deepCheck });
    }

    currentScope = 'data-manager';
    await smokeSwitchModule(page, 'upload');
    for (const id of DATA_MANAGER_TABS) {
        currentScope = `dm:${id}`;
        summary.dataManagerTabs.push(await smokeDataManagerTab(page, id));
    }

    currentScope = 'final';
    summary.errorCount = errors.length;

    console.log(JSON.stringify(summary, null, 2));
    await browser.close();

    const failedSwitch = summary.switchModules.find(item => !item.ok || !item.deepCheck?.ok);
    const failedDm = summary.dataManagerTabs.find(item => !item.ok);
    if (!summary.login.overlayHidden || !summary.login.appVisible || !summary.login.schoolInternalRemoved || failedSwitch || failedDm || errors.length > 0) {
        process.exit(1);
    }
})().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
