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

const DATA_MANAGER_TABS = ['student', 'teacher', 'targets', 'params', 'cloud'];

function shouldIgnoreConsoleMessage(msg) {
    const text = String(msg || '');
    return text.includes('favicon.ico')
        || text.includes('Slow network is detected')
        || text.includes('Fallback font will be used while loading');
}

async function login(page, user, pass) {
    await page.goto(process.env.SMOKE_URL || 'https://schoolsystem.com.cn/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    await page.waitForSelector('#login-user', { timeout: 30000 });
    await page.fill('#login-user', user);
    await page.fill('#login-pass', pass);
    await page.click('button[onclick="window.Auth?.login()"]');

    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        if (!overlay || !app) return false;
        return getComputedStyle(overlay).display === 'none' && getComputedStyle(app).display !== 'none';
    }, { timeout: 30000 });
}

async function smokeSwitchModule(page, id) {
    const result = await page.evaluate(async (moduleId) => {
        try {
            if (typeof window.switchTab !== 'function') {
                return { ok: false, id: moduleId, error: 'switchTab is not available' };
            }
            window.switchTab(moduleId);
            await new Promise(resolve => setTimeout(resolve, 1800));
            const section = document.getElementById(moduleId);
            if (!section) return { ok: false, id: moduleId, error: 'target section not found' };
            const style = getComputedStyle(section);
            const visible = style.display !== 'none';
            const active = section.classList.contains('active');
            const title = section.querySelector('h1,h2,h3,.sub-header,.sec-head')?.textContent?.trim() || '';
            return { ok: visible && active, id: moduleId, visible, active, title };
        } catch (error) {
            return { ok: false, id: moduleId, error: error?.message || String(error) };
        }
    }, id);
    await page.waitForTimeout(700);
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
    if (id === 'teacher-analysis') {
        return page.evaluate(async () => {
            const checks = {
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
            const checks = {
                doQuery: typeof window.doQuery === 'function',
                getComparisonStudentView: typeof window.getComparisonStudentView === 'function',
                getComparisonStudentList: typeof window.getComparisonStudentList === 'function',
                formatComparisonExamLabel: typeof window.formatComparisonExamLabel === 'function',
                getStudentExamHistory: typeof window.getStudentExamHistory === 'function'
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
            window.DataManager.switchTab(tabId);
            await new Promise(resolve => setTimeout(resolve, 800));
            const activePanel = document.querySelector('.data-manager-tab.active,[data-dm-tab].active,.tab-pane.active');
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

    const summary = {
        login: await page.evaluate(() => ({
            overlayHidden: getComputedStyle(document.getElementById('login-overlay')).display === 'none',
            appVisible: getComputedStyle(document.getElementById('app')).display !== 'none',
            roleText: document.body.innerText.includes('Role:')
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

    const failedSwitch = summary.switchModules.find(item => !item.ok);
    const failedDm = summary.dataManagerTabs.find(item => !item.ok);
    if (!summary.login.overlayHidden || !summary.login.appVisible || failedSwitch || failedDm || errors.length > 0) {
        process.exit(1);
    }
})().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
