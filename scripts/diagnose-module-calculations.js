try {
    require.resolve('playwright');
} catch (e) {
    console.error('playwright is required. Run: npm install --no-save playwright');
    process.exit(1);
}

const { chromium } = require('playwright');

const MODULES = [
    'upload',
    'summary',
    'analysis',
    'county-analysis',
    'teacher-analysis',
    'single-school-eval',
    'correlation-analysis',
    'indicator',
    'bottom3',
    'marginal-push',
    'progress-analysis',
    'cohort-growth',
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

async function login(page) {
    await page.goto(process.env.SMOKE_URL || 'https://schoolsystem.com.cn/', {
        waitUntil: 'commit',
        timeout: 90000
    });
    await page.waitForFunction(() => document.getElementById('login-overlay') || document.getElementById('app'), null, { timeout: 90000 });
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
        await page.evaluate(() => {
            if (window.Auth && typeof window.Auth.openLoginPortalModal === 'function') {
                window.Auth.openLoginPortalModal('school');
            }
        }).catch(() => {});
        await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });
        await page.fill('#login-user', process.env.SMOKE_USER || 'admin');
        await page.fill('#login-pass', process.env.SMOKE_PASS || 'admin123');
        await page.click('button[onclick="window.Auth?.login()"]');
    }
    await page.waitForFunction(() => {
        const app = document.getElementById('app');
        return !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
    }, null, { timeout: 90000 });
    await ensureCohortEntered(page);
    await waitForAppReady(page);
}

async function ensureCohortEntered(page) {
    const state = await page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        const input = document.getElementById('entry-cohort-year');
        const selector = document.getElementById('cohort-selector');
        return {
            maskVisible: !!mask && getComputedStyle(mask).display !== 'none',
            inputValue: String(input?.value || '').trim(),
            currentCohortId: String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim(),
            knownCohorts: selector ? Array.from(selector.options || []).map((option) => String(option.value || '').trim()).filter(Boolean) : []
        };
    });
    if (!state.maskVisible) return;
    const candidate = String(process.env.SMOKE_COHORT_YEAR || state.inputValue || state.currentCohortId || state.knownCohorts[0] || '2022').trim();
    await page.waitForFunction(() => typeof window.enterCohortFromMask === 'function' || !!document.querySelector('button[onclick="enterCohortFromMask()"]'), null, { timeout: 30000 });
    const input = page.locator('#entry-cohort-year');
    if (await input.count()) await input.fill(candidate);
    await page.evaluate(async () => {
        if (typeof window.enterCohortFromMask === 'function') {
            await window.enterCohortFromMask();
            return;
        }
        const button = document.querySelector('button[onclick="enterCohortFromMask()"]');
        if (button) button.click();
    });
}

async function waitForAppReady(page) {
    await page.waitForFunction(() => {
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        const maskHidden = !mask || getComputedStyle(mask).display === 'none';
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        const schools = window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0;
        const examId = String(localStorage.getItem('CURRENT_EXAM_ID') || window.CURRENT_EXAM_ID || '').trim();
        return appVisible && maskHidden && rawDataLen > 0 && schools > 0 && !!examId;
    }, null, { timeout: 90000 });
    await page.waitForTimeout(1200);
}

function summarizeNumbers(values) {
    const nums = values
        .map((value) => Number(String(value).replace(/[%▲▼,]/g, '').trim()))
        .filter((value) => Number.isFinite(value));
    const zeroCount = nums.filter((value) => value === 0).length;
    return {
        count: nums.length,
        zeroCount,
        zeroRatio: nums.length ? Number((zeroCount / nums.length).toFixed(3)) : 0,
        positiveCount: nums.filter((value) => value > 0).length,
        max: nums.length ? Math.max(...nums) : null
    };
}

async function inspectModule(page, id) {
    await page.evaluate((moduleId) => {
        if (typeof window.switchTab === 'function') {
            window.setTimeout(() => window.switchTab(moduleId), 0);
        }
    }, id).catch(() => {});
    await page.waitForFunction((moduleId) => {
        const section = document.getElementById(moduleId);
        if (!section) return false;
        const style = getComputedStyle(section);
        const allowActiveOnly = ['analysis', 'student-details', 'single-school-eval', 'correlation-analysis', 'indicator'].includes(moduleId);
        return section.classList.contains('active') && (style.display !== 'none' || allowActiveOnly);
    }, id, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(id === 'teacher-analysis' || id === 'county-analysis' ? 2500 : 900);

    return page.evaluate((moduleId) => {
        const section = document.getElementById(moduleId);
        const text = section ? section.innerText || '' : '';
        const visible = !!section && getComputedStyle(section).display !== 'none';
        const tableRows = section ? Array.from(section.querySelectorAll('tbody tr')).length : 0;
        const tableCells = section ? Array.from(section.querySelectorAll('td')).map((td) => td.innerText.trim()).filter(Boolean) : [];
        const numbers = tableCells.filter((value) => /^-?\d+(\.\d+)?%?$/.test(value.replace(/[▲▼]/g, '').trim()));
        const nums = numbers
            .map((value) => Number(String(value).replace(/[%▲▼,]/g, '').trim()))
            .filter((value) => Number.isFinite(value));
        const zeroCount = nums.filter((value) => value === 0).length;
        const summary = {
            count: nums.length,
            zeroCount,
            zeroRatio: nums.length ? Number((zeroCount / nums.length).toFixed(3)) : 0,
            positiveCount: nums.filter((value) => value > 0).length,
            max: nums.length ? Math.max(...nums) : null
        };
        const hasNaN = /\bNaN\b|undefined|null分|Infinity/.test(text);
        const suspiciousZero = summary.count >= 12 && summary.positiveCount <= 2 && summary.zeroRatio >= 0.65;
        const cards = section ? Array.from(section.querySelectorAll('.teacher-card,.metric-card,.overview-card,.analysis-card,.module-card')).length : 0;
        return {
            id: moduleId,
            visible,
            tableRows,
            cards,
            numberSummary: summary,
            hasNaN,
            suspiciousZero,
            sample: text.replace(/\s+/g, ' ').slice(0, 240)
        };
    }, id);
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const consoleErrors = [];
    page.on('console', (msg) => {
        if (['error'].includes(msg.type())) consoleErrors.push(msg.text());
    });
    await login(page);

    const globalSnapshot = await page.evaluate(() => ({
        rawData: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
        schools: window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0,
        subjects: Array.isArray(window.SUBJECTS) ? window.SUBJECTS.slice() : [],
        score2RatePositive: Object.values(window.SCHOOLS || {}).filter((s) => Number(s?.score2Rate) > 0).length,
        totalMetricSchools: Object.values(window.SCHOOLS || {}).filter((s) => Number(s?.metrics?.total?.avg) > 0).length
    }));

    const modules = [];
    for (const id of MODULES) {
        modules.push(await inspectModule(page, id));
    }

    await inspectModule(page, 'teacher-analysis');
    const functionSnapshot = await page.evaluate(() => {
        const result = {};
        try {
            const stats = window.TEACHER_STATS || {};
            const rows = [];
            Object.keys(stats).forEach((teacherName) => {
                Object.keys(stats[teacherName] || {}).forEach((subject) => {
                    rows.push({ teacherName, subject, ...(stats[teacherName][subject] || {}) });
                });
            });
            result.teacherRows = rows.length;
            result.teacherPositive = rows.filter((row) => Number(row?.avgValue) > 0 || Number(row?.fairScore) > 0).length;
            result.teacherSamples = rows.slice(0, 8).map((row) => ({
                teacherName: row.teacherName,
                subject: row.subject,
                classes: row.classes,
                studentCount: row.studentCount,
                avgValue: row.avgValue,
                fairScore: row.fairScore
            }));
            result.teacherMapSize = Object.keys(window.TEACHER_MAP || {}).length;
            result.teacherSchoolMapSize = Object.keys(window.TEACHER_SCHOOL_MAP || {}).length;
            result.mySchool = window.MY_SCHOOL || localStorage.getItem('MY_SCHOOL') || '';
            result.teacherKeys = Object.keys(window.TEACHER_MAP || {}).slice(0, 12);
            result.mySchoolClasses = [...new Set((window.RAW_DATA || [])
                .filter((student) => String(student?.school || '').trim() === String(result.mySchool || '').trim())
                .map((student) => String(student?.class || '').trim())
                .filter(Boolean))]
                .slice(0, 30);
            result.teacherClassSchools = result.teacherKeys.slice(0, 10).map((key) => {
                const className = String(key).split('_')[0];
                const normalized = typeof window.normalizeClass === 'function' ? window.normalizeClass(className) : className;
                const schools = [...new Set((window.RAW_DATA || [])
                    .filter((student) => {
                        const cls = typeof window.normalizeClass === 'function' ? window.normalizeClass(student?.class) : String(student?.class || '').trim();
                        return cls === normalized;
                    })
                    .map((student) => String(student?.school || '').trim())
                    .filter(Boolean))]
                    .slice(0, 8);
                return { key, className, normalized, schools };
            });
        } catch (error) {
            result.teacherError = error?.message || String(error);
        }
        try {
            if (typeof window.calculateSummary === 'function') {
                const rows = window.calculateSummary({ silent: true }) || [];
                result.summaryRows = rows.length;
                result.summaryPositive = rows.filter((row) => Number(row?.totalScore) > 0 || Number(row?.score) > 0).length;
            }
        } catch (error) {
            result.summaryError = error?.message || String(error);
        }
        return result;
    });

    await browser.close();

    const issues = modules
        .filter((item) => !item.visible || item.hasNaN || item.suspiciousZero || (item.tableRows === 0 && item.cards === 0 && !['report-generator'].includes(item.id)))
        .map((item) => ({
            id: item.id,
            visible: item.visible,
            tableRows: item.tableRows,
            cards: item.cards,
            numberSummary: item.numberSummary,
            hasNaN: item.hasNaN,
            suspiciousZero: item.suspiciousZero,
            sample: item.sample
        }));

    console.log(JSON.stringify({
        url: process.env.SMOKE_URL || 'https://schoolsystem.com.cn/',
        globalSnapshot,
        functionSnapshot,
        issues,
        modules,
        consoleErrors: consoleErrors.slice(-20)
    }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
