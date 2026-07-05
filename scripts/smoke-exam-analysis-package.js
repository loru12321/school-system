try {
    require.resolve('playwright');
} catch (error) {
    console.error('playwright is required for smoke-exam-analysis-package');
    process.exit(1);
}

const fs = require('fs');
const JSZip = require('jszip');
const { chromium } = require('playwright');

const SMOKE_URL = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const SMOKE_USER = process.env.SMOKE_USER || 'admin';
const SMOKE_PASS = process.env.SMOKE_PASS || 'admin123';

function xmlTextToList(xml) {
    return String(xml || '')
        .match(/<t[^>]*>([\s\S]*?)<\/t>/g)
        ?.map((item) => item.replace(/<[^>]+>/g, '')) || [];
}

async function readWorkbookSummary(buffer) {
    const zip = await JSZip.loadAsync(buffer);
    const workbookFiles = Object.keys(zip.files);
    const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string').catch(() => '') || '';
    const stylesXml = await zip.file('xl/styles.xml')?.async('string').catch(() => '') || '';
    const sharedStrings = xmlTextToList(sharedStringsXml).join('|');
    const sheetEntries = Object.keys(zip.files)
        .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    const rowCounts = {};
    const sheetTextParts = [];
    const sheetXmlParts = [];
    for (const sheetName of sheetEntries) {
        const xml = await zip.file(sheetName).async('string');
        rowCounts[sheetName] = (xml.match(/<row\b/g) || []).length;
        sheetTextParts.push(xml.replace(/<[^>]+>/g, '|'));
        sheetXmlParts.push(xml);
    }
    return { text: `${sharedStrings}|${sheetTextParts.join('|')}`, stylesXml, sheetXml: sheetXmlParts.join('\n'), rowCounts, workbookFiles };
}

async function login(page) {
    await page.goto(SMOKE_URL, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForFunction(() => !!document.getElementById('login-overlay') || !!document.getElementById('app'), null, { timeout: 90000 });
    await page.waitForTimeout(1200);
    const loggedIn = await page.evaluate(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        return (!overlay || getComputedStyle(overlay).display === 'none')
            && !!app
            && getComputedStyle(app).display !== 'none'
            && !app.classList.contains('hidden');
    }).catch(() => false);
    if (!loggedIn) {
        await page.waitForSelector('#login-user', { state: 'visible', timeout: 45000 });
        await page.fill('#login-user', SMOKE_USER);
        await page.fill('#login-pass', SMOKE_PASS);
        await page.click('#login-submit-button');
    }
    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        return (!overlay || getComputedStyle(overlay).display === 'none')
            && !!app
            && getComputedStyle(app).display !== 'none'
            && !app.classList.contains('hidden');
    }, null, { timeout: 90000 });
    await page.waitForFunction(() => Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0, null, { timeout: 90000 });
}

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({
        acceptDownloads: true,
        viewport: { width: 1440, height: 1800 }
    });
    const page = await context.newPage();
    page.on('dialog', async (dialog) => {
        if (dialog.type() === 'confirm') await dialog.accept();
        else await dialog.dismiss();
    });

    try {
        await login(page);
        await page.evaluate(async () => {
            if (typeof window.ensureExamAnalysisPackageRuntimeLoaded === 'function') {
                await window.ensureExamAnalysisPackageRuntimeLoaded();
            }
            if (typeof window.switchTab === 'function') window.switchTab('summary');
        });
        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 120000 }),
            page.evaluate(() => window.downloadExamAnalysisPackage())
        ]);
        const suggestedName = download.suggestedFilename();
        if (/当前届别/.test(suggestedName) || !/2022届9年级/.test(suggestedName)) {
            throw new Error(`analysis package filename is not explicit enough: ${suggestedName}`);
        }
        const downloadPath = await download.path();
        const outerBuffer = fs.readFileSync(downloadPath);
        const outerZip = await JSZip.loadAsync(outerBuffer);
        const files = Object.keys(outerZip.files).filter((name) => !outerZip.files[name].dir);
        const teacherCountyName = files.find((name) => /教师\/二模教师县域分析0527\.xlsx$/.test(name));
        if (!teacherCountyName) throw new Error(`missing county teacher workbook; files=${files.join(', ')}`);
        const teacherCountyBuffer = await outerZip.file(teacherCountyName).async('nodebuffer');
        const teacherCountySummary = await readWorkbookSummary(teacherCountyBuffer);
        const rowCounts = Object.values(teacherCountySummary.rowCounts);
        if (!rowCounts.length || rowCounts.some((count) => count <= 1)) {
            throw new Error(`county teacher workbook has blank sheet(s): ${JSON.stringify(teacherCountySummary.rowCounts)}`);
        }
        if (!teacherCountySummary.text.includes('_对象标记') || !teacherCountySummary.text.includes('本校教师')) {
            throw new Error('county teacher workbook is missing object markers');
        }
        if (!/hidden="1"|hidden="true"/i.test(teacherCountySummary.sheetXml)) {
            throw new Error('county teacher workbook marker columns should be hidden');
        }
        if (teacherCountySummary.workbookFiles.some((name) => /comments|threadedComments/i.test(name))) {
            throw new Error('county teacher workbook should not contain popup comments');
        }
        if (!/horizontal="center"/i.test(teacherCountySummary.stylesXml) || !/vertical="center"/i.test(teacherCountySummary.stylesXml)) {
            throw new Error('county teacher workbook is missing centered alignment styles');
        }
        if (!/EAF6FF/i.test(teacherCountySummary.stylesXml)) {
            throw new Error('county teacher workbook is missing highlight colors');
        }
        if (/FEF3C7|FDE68A/i.test(teacherCountySummary.stylesXml)) {
            throw new Error('county teacher workbook should not use ambiguous yellow highlights');
        }
        const rawScoreName = files.find((name) => /二模成绩0527\.xlsx$/.test(name));
        if (!rawScoreName) throw new Error(`missing raw score workbook; files=${files.join(', ')}`);
        const rawScoreBuffer = await outerZip.file(rawScoreName).async('nodebuffer');
        const rawScoreSummary = await readWorkbookSummary(rawScoreBuffer);
        if (!rawScoreSummary.text.includes('_标记') || !rawScoreSummary.text.includes('本校')) {
            throw new Error('raw score workbook is missing own-school markers');
        }
        if (!/hidden="1"|hidden="true"/i.test(rawScoreSummary.sheetXml)) {
            throw new Error('raw score workbook marker columns should be hidden');
        }
        if (rawScoreSummary.workbookFiles.some((name) => /comments|threadedComments/i.test(name))) {
            throw new Error('raw score workbook should not contain popup comments');
        }
        if (!/horizontal="center"/i.test(rawScoreSummary.stylesXml) || !/EAF6FF/i.test(rawScoreSummary.stylesXml)) {
            throw new Error('raw score workbook is missing centered alignment or highlight colors');
        }
        if (/FEF3C7|FDE68A/i.test(rawScoreSummary.stylesXml)) {
            throw new Error('raw score workbook should not use ambiguous yellow highlights');
        }
        const result = {
            ok: true,
            suggestedName,
            fileCount: files.length,
            teacherCountyName,
            teacherCountyRows: teacherCountySummary.rowCounts
        };
        console.log(JSON.stringify(result, null, 2));
    } finally {
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
