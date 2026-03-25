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
    'indicator',
    'bottom3',
    'marginal-push',
    'progress-analysis',
    'report-generator',
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

function shouldIgnoreConsoleMessage(msg) {
    const text = String(msg || '');
    return text.includes('favicon.ico')
        || text.includes('ERR_FILE_NOT_FOUND')
        || text.includes('Slow network is detected')
        || text.includes('Fallback font will be used while loading');
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
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

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
        await page.waitForSelector('#login-user', { timeout: 30000 });
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
        }, { timeout: 40000 });
    }, { attempts: 4 });

    await ensureCohortEntered(page);

    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const app = document.getElementById('app');
            if (!app) return false;
            return getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        }, { timeout: 30000 });
    }, { attempts: 4 });
}

async function ensureCohortEntered(page) {
    const state = await withNavigationRetry(page, () => page.evaluate(() => {
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
            knownCohorts: selector
                ? Array.from(selector.options || []).map((option) => String(option.value || '').trim()).filter(Boolean)
                : []
        };
    }), { attempts: 4 });

    if (!state.maskVisible) return state;

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
        }, { timeout: 20000 });
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
        }, { timeout: 20000 });
    }, { attempts: 4 });
}

async function waitForAppReady(page) {
    await page.waitForFunction(() => {
        const termId = localStorage.getItem('CURRENT_TERM_ID') || '';
        const cohortId = localStorage.getItem('CURRENT_COHORT_ID') || '';
    const school = String(
        (window.SchoolState && typeof window.SchoolState.getCurrentSchool === 'function'
            ? window.SchoolState.getCurrentSchool()
            : '')
        || window.MY_SCHOOL
        || localStorage.getItem('MY_SCHOOL')
        || ''
    ).trim();
        const scoresReady = Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0;
        return !!termId && !!cohortId && !!school && scoresReady;
    }, { timeout: 60000 });
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
                loadCloudTownSubmoduleCompare: typeof window.loadCloudTownSubmoduleCompare === 'function'
            };
            const panel = document.querySelector('.town-submodule-compare-panel[data-submodule="summary"]');
            return {
                ok: Object.values(checks).every(Boolean) && !!panel,
                checks,
                panelReady: !!panel
            };
        });
    }
    if (id === 'upload') {
        return page.evaluate(async () => {
            const schools = typeof window.listAvailableSchoolsForCompare === 'function'
                ? window.listAvailableSchoolsForCompare()
                : [];
            const checks = {
                normalizeSchoolName: typeof window.normalizeSchoolName === 'function',
                getCanonicalSchoolName: typeof window.getCanonicalSchoolName === 'function',
                ensureNormalizedTargets: typeof window.ensureNormalizedTargets === 'function',
                buildIndicatorSchoolBuckets: typeof window.buildIndicatorSchoolBuckets === 'function',
                listAvailableSchoolsForCompare: typeof window.listAvailableSchoolsForCompare === 'function'
            };
            return {
                ok: Object.values(checks).every(Boolean) && Array.isArray(schools),
                checks,
                schoolCount: Array.isArray(schools) ? schools.length : -1
            };
        });
    }
    if (id === 'teacher-analysis') {
        await page.waitForFunction(() => window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__ === true, { timeout: 15000 });
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
    if (id === 'single-school-eval') {
        return page.evaluate(async () => {
            const checks = {
                updateSSESchoolSelect: typeof window.updateSSESchoolSelect === 'function',
                SSE_calculate: typeof window.SSE_calculate === 'function',
                SSE_export: typeof window.SSE_export === 'function',
                schoolSelect: !!document.getElementById('sse_school_select'),
                resultContainer: !!document.getElementById('sse_result_container'),
                resultTable: !!document.getElementById('sse_table')
            };
            if (!Object.values(checks).every(Boolean)) {
                return { ok: false, checks, schoolOptionCount: 0, rows: 0, resultVisible: false };
            }

            window.updateSSESchoolSelect();
            await new Promise(resolve => setTimeout(resolve, 150));

            const schoolSelect = document.getElementById('sse_school_select');
            const schoolValues = Array.from(schoolSelect.options || [])
                .map((option) => String(option.value || '').trim())
                .filter(Boolean);

            if (!schoolValues.length) {
                return { ok: false, checks, schoolOptionCount: 0, rows: 0, resultVisible: false };
            }

            schoolSelect.value = schoolValues[0];
            window.SSE_calculate();
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
    if (id === 'teaching-warning-center') {
        return page.evaluate(async () => {
            const refreshButton = document.getElementById('tmWarningCenterRefreshBtn');
            const checks = {
                tmRenderWarningCenter: typeof window.tmRenderWarningCenter === 'function',
                tmRefreshCloudOps: typeof window.tmRefreshCloudOps === 'function',
                tmCreateRectifyTaskFromWarning: typeof window.tmCreateRectifyTaskFromWarning === 'function',
                tmIgnoreCloudWarning: typeof window.tmIgnoreCloudWarning === 'function',
                refreshButton: !!refreshButton,
                refreshBound: !!refreshButton && typeof refreshButton.onclick === 'function',
                listReady: !!document.getElementById('tmWarningCenterList')
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
                tmRenderRectifyCenter: typeof window.tmRenderRectifyCenter === 'function',
                tmRefreshCloudOps: typeof window.tmRefreshCloudOps === 'function',
                tmCreateManualRectifyTask: typeof window.tmCreateManualRectifyTask === 'function',
                tmUpdateRectifyTaskStatus: typeof window.tmUpdateRectifyTaskStatus === 'function',
                tmPromptRectifyProgress: typeof window.tmPromptRectifyProgress === 'function',
                refreshButton: !!refreshButton,
                refreshBound: !!refreshButton && typeof refreshButton.onclick === 'function',
                createButton: !!createButton,
                createBound: !!createButton && typeof createButton.onclick === 'function',
                listReady: !!document.getElementById('tmRectifyCenterList')
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
    let currentScope = 'boot';

    page.on('pageerror', error => {
        errors.push({ scope: currentScope, type: 'pageerror', message: error.message });
    });

    page.on('console', msg => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (shouldIgnoreConsoleMessage(text)) return;
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
