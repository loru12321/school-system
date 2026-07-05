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

function decodeXmlText(value) {
    return String(value || '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}

function columnIndex(cellRef) {
    const letters = String(cellRef || '').replace(/\d+/g, '');
    let index = 0;
    for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
    return Math.max(index - 1, 0);
}

function parseWorksheetRows(xml, sharedStrings) {
    const rows = [];
    const rowMatches = String(xml || '').match(/<row\b[\s\S]*?<\/row>/g) || [];
    rowMatches.forEach((rowXml) => {
        const row = [];
        const cellMatches = rowXml.match(/<c\b[\s\S]*?<\/c>/g) || [];
        cellMatches.forEach((cellXml) => {
            const ref = (cellXml.match(/\br="([^"]+)"/) || [])[1] || '';
            const type = (cellXml.match(/\bt="([^"]+)"/) || [])[1] || '';
            const inline = (cellXml.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/) || [])[1];
            const raw = (cellXml.match(/<v[^>]*>([\s\S]*?)<\/v>/) || [])[1] || '';
            let value = '';
            if (type === 's') value = sharedStrings[Number(raw)] || '';
            else if (inline !== undefined) value = decodeXmlText(inline.replace(/<[^>]+>/g, ''));
            else if (raw !== '') {
                const number = Number(raw);
                value = Number.isFinite(number) ? number : decodeXmlText(raw);
            }
            row[columnIndex(ref)] = value;
        });
        rows.push(row);
    });
    return rows;
}

async function readWorkbookSummary(buffer) {
    const zip = await JSZip.loadAsync(buffer);
    const workbookFiles = Object.keys(zip.files);
    const workbookXml = await zip.file('xl/workbook.xml')?.async('string').catch(() => '') || '';
    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string').catch(() => '') || '';
    const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string').catch(() => '') || '';
    const stylesXml = await zip.file('xl/styles.xml')?.async('string').catch(() => '') || '';
    const sharedStringList = xmlTextToList(sharedStringsXml).map(decodeXmlText);
    const sharedStrings = sharedStringList.join('|');
    const relTargets = {};
    (relsXml.match(/<Relationship\b[^>]*>/g) || []).forEach((tag) => {
        const id = (tag.match(/\bId="([^"]+)"/) || [])[1];
        const target = (tag.match(/\bTarget="([^"]+)"/) || [])[1];
        if (id && target) relTargets[id] = target.replace(/^\/?xl\//, '');
    });
    const sheetNames = [];
    const sheetNameByPath = {};
    (workbookXml.match(/<sheet\b[^>]*>/g) || []).forEach((tag) => {
        const name = decodeXmlText((tag.match(/\bname="([^"]+)"/) || [])[1] || '');
        const relId = (tag.match(/\br:id="([^"]+)"/) || [])[1] || '';
        const target = relTargets[relId] || '';
        const normalizedTarget = target.startsWith('worksheets/') ? `xl/${target}` : `xl/${target}`;
        if (name) sheetNames.push(name);
        if (name && target) sheetNameByPath[normalizedTarget] = name;
    });
    const sheetEntries = Object.keys(zip.files)
        .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    const rowCounts = {};
    const rowsBySheetName = {};
    const sheetTextParts = [];
    const sheetXmlParts = [];
    for (const sheetName of sheetEntries) {
        const xml = await zip.file(sheetName).async('string');
        rowCounts[sheetName] = (xml.match(/<row\b/g) || []).length;
        const displayName = sheetNameByPath[sheetName] || sheetName;
        rowsBySheetName[displayName] = parseWorksheetRows(xml, sharedStringList);
        sheetTextParts.push(xml.replace(/<[^>]+>/g, '|'));
        sheetXmlParts.push(xml);
    }
    return {
        text: `${sharedStrings}|${sheetNames.join('|')}|${sheetTextParts.join('|')}`,
        stylesXml,
        sheetXml: sheetXmlParts.join('\n'),
        rowCounts,
        workbookFiles,
        sheetNames,
        rowsBySheetName
    };
}

function fail(message) {
    throw new Error(message);
}

function findRequiredFile(files, pattern, label) {
    const name = files.find((file) => pattern.test(file));
    if (!name) fail(`missing ${label}; files=${files.join(', ')}`);
    return name;
}

function normalizeHeader(value) {
    return String(value || '').replace(/\s+/g, '').trim();
}

function findColumn(header, candidates) {
    const normalizedCandidates = candidates.map(normalizeHeader);
    return (header || []).findIndex((cell) => normalizedCandidates.includes(normalizeHeader(cell)));
}

function getDataRows(rows, keyIndex) {
    return (rows || []).slice(1).filter((row) => String(row?.[keyIndex] ?? '').trim());
}

function isNumericCell(value) {
    if (value === null || value === undefined || String(value).trim() === '') return false;
    return Number.isFinite(Number(value));
}

function assertNumericColumn(rows, header, keyIndex, columnNames, label, options = {}) {
    const columnIndex = findColumn(header, columnNames);
    if (columnIndex < 0) fail(`${label} missing column: ${columnNames.join('/')}; header=${header.join(',')}`);
    const requiredWhenIndex = options.requiredWhenColumnNames ? findColumn(header, options.requiredWhenColumnNames) : -1;
    const dataRows = getDataRows(rows, keyIndex).filter((row) => {
        if (requiredWhenIndex < 0) return true;
        return isNumericCell(row[requiredWhenIndex]);
    });
    const minimumRows = options.minimumRows ?? 1;
    if (dataRows.length < minimumRows) fail(`${label} has too few rows: ${dataRows.length}`);
    const badRows = dataRows.filter((row) => {
        const value = Number(row[columnIndex]);
        if (!isNumericCell(row[columnIndex])) return true;
        return options.allowZero ? value < 0 : value <= 0;
    });
    if (badRows.length) {
        fail(`${label} has invalid ${header[columnIndex]} values: header=${JSON.stringify(header)} rows=${badRows.slice(0, 5).map((row) => `${row[keyIndex]}=${row[columnIndex]} row=${JSON.stringify(row)}`).join(' | ')}`);
    }
    return { columnIndex, rows: dataRows };
}

function assertHorizontalRankCells(summary, sheetName, label) {
    const rows = summary.rowsBySheetName[sheetName] || [];
    const header = rows[0] || [];
    if (!header.length) fail(`${label} missing horizontal sheet ${sheetName}`);
    const dataRows = rows.slice(1).filter((row) => String(row?.[0] || '').trim());
    if (!dataRows.length) fail(`${label} horizontal sheet has no rows`);
    const headerText = dataRows.map((row) => String(row[0] || '')).join('|');
    if (!/平均分（排名）/.test(headerText) || !/优秀率（排名）/.test(headerText) || !/及格率（排名）/.test(headerText)) {
        fail(`${label} horizontal rows should be value-with-rank labels: ${headerText}`);
    }
    const sampleValues = dataRows.flatMap((row) => row.slice(1).map((value) => String(value || '').trim()).filter(Boolean));
    if (!sampleValues.some((value) => /（\d+）/.test(value))) {
        fail(`${label} horizontal values should include rank in same cell`);
    }
}

function getColumnIndexesByPattern(header, pattern) {
    return (header || [])
        .map((cell, index) => ({ cell: String(cell || ''), index }))
        .filter((item) => pattern.test(item.cell))
        .map((item) => item.index);
}

function assertWorkbookCommon(summary, workbookName) {
    if (!summary.sheetNames.length) fail(`${workbookName} has no sheets`);
    const rowCounts = Object.values(summary.rowCounts);
    if (!rowCounts.length || rowCounts.some((count) => count <= 1)) {
        fail(`${workbookName} has blank sheet(s): ${JSON.stringify(summary.rowCounts)}`);
    }
    if (/_标记|_对象标记/.test(summary.text) && !/hidden="1"|hidden="true"/i.test(summary.sheetXml)) {
        fail(`${workbookName} marker columns should be hidden`);
    }
    if (summary.workbookFiles.some((name) => /comments|threadedComments/i.test(name))) {
        fail(`${workbookName} should not contain popup comments`);
    }
    if (!/horizontal="center"/i.test(summary.stylesXml) || !/vertical="center"/i.test(summary.stylesXml)) {
        fail(`${workbookName} is missing centered alignment styles`);
    }
    if (/_标记|_对象标记/.test(summary.text) && !/EAF6FF/i.test(summary.stylesXml)) {
        fail(`${workbookName} is missing own-school highlight color`);
    }
    if (/FEF3C7|FDE68A/i.test(summary.stylesXml)) {
        fail(`${workbookName} should not use ambiguous yellow highlights`);
    }
}

async function readWorkbookFromPackage(outerZip, files, pattern, label) {
    const name = findRequiredFile(files, pattern, label);
    const buffer = await outerZip.file(name).async('nodebuffer');
    return { name, summary: await readWorkbookSummary(buffer) };
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
        const packageScope = await page.evaluate(() => {
            const names = Object.keys(window.SCHOOLS || {});
            const townshipNames = typeof window.getTownshipManagedSchoolNames === 'function'
                ? window.getTownshipManagedSchoolNames(names)
                : names;
            return {
                townshipNames,
                countyDirectNames: names.filter((name) => {
                    if (typeof window.isTownshipManagedSchool === 'function') {
                        return !window.isTownshipManagedSchool(name, names);
                    }
                    return !(townshipNames || []).some((item) => String(item || '').trim() === String(name || '').trim());
                })
            };
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
        const workbookEntries = await Promise.all(files
            .filter((name) => /\.xlsx$/i.test(name))
            .map(async (name) => ({ name, summary: await readWorkbookSummary(await outerZip.file(name).async('nodebuffer')) })));
        if (workbookEntries.length < 7) fail(`analysis package has too few workbooks: ${workbookEntries.map((entry) => entry.name).join(', ')}`);
        workbookEntries.forEach((entry) => assertWorkbookCommon(entry.summary, entry.name));

        const { name: teacherCountyName, summary: teacherCountySummary } = await readWorkbookFromPackage(outerZip, files, /教师\/二模教师县域分析0527\.xlsx$/, 'county teacher workbook');
        if (!teacherCountySummary.text.includes('_对象标记') || !teacherCountySummary.text.includes('本校教师')) {
            fail('county teacher workbook is missing object markers');
        }
        Object.entries(teacherCountySummary.rowsBySheetName).forEach(([sheet, rows]) => {
            const header = rows[0] || [];
            const nameIndex = findColumn(header, ['教师/学校']);
            if (nameIndex < 0) return;
            assertNumericColumn(rows, header, nameIndex, ['县均分排'], `${teacherCountyName}:${sheet}`, { minimumRows: 2 });
            assertNumericColumn(rows, header, nameIndex, ['平均分'], `${teacherCountyName}:${sheet}`, { minimumRows: 2 });
        });

        const { name: rawScoreName, summary: rawScoreSummary } = await readWorkbookFromPackage(outerZip, files, /(^|\/)二模成绩0527\.xlsx$/, 'raw score workbook');
        if (!rawScoreSummary.text.includes('_标记') || !rawScoreSummary.text.includes('本校')) {
            fail('raw score workbook is missing own-school markers');
        }
        Object.entries(rawScoreSummary.rowsBySheetName).forEach(([sheet, rows]) => {
            const header = rows[0] || [];
            const nameIndex = findColumn(header, ['姓名']);
            if (nameIndex < 0) return;
            assertNumericColumn(rows, header, nameIndex, ['总分', '五科总'], `${rawScoreName}:${sheet}`, { minimumRows: 1, allowZero: true });
        });

        const { name: schoolAnalysisName, summary: schoolAnalysisSummary } = await readWorkbookFromPackage(outerZip, files, /学校\/二模成绩分析0527\.xlsx$/, 'school analysis workbook');
        const schoolFirstSheetRows = schoolAnalysisSummary.rowCounts['xl/worksheets/sheet1.xml'] || 0;
        if (schoolFirstSheetRows < 18) {
            fail(`school comprehensive report is too short: ${JSON.stringify(schoolAnalysisSummary.rowCounts)}`);
        }
        ['学校名称', '两率一分得分', '后1/3得分', '综合总分', '总排名', '银山实验学校'].forEach((needle) => {
            if (!schoolAnalysisSummary.text.includes(needle)) {
                fail(`school comprehensive report missing ${needle}`);
            }
        });
        if (!/高分段赋分\(70\)|高分段赋分&#40;70&#41;/.test(schoolAnalysisSummary.text)) {
            fail('grade 9 school comprehensive report is missing high-score contribution column');
        }
        if (!schoolAnalysisSummary.text.includes('_标记') || !schoolAnalysisSummary.text.includes('本校')) {
            fail('school comprehensive report is missing own-school marker');
        }
        const townshipTotalRows = schoolAnalysisSummary.rowsBySheetName['五科总 - 综合分析表'] || [];
        const townshipHeader = townshipTotalRows[0] || [];
        const townshipSchoolIndex = findColumn(townshipHeader, ['学校']);
        assertNumericColumn(townshipTotalRows, townshipHeader, townshipSchoolIndex, ['两率一分'], `${schoolAnalysisName}:五科总 - 综合分析表`, { minimumRows: 5 });
        assertNumericColumn(townshipTotalRows, townshipHeader, townshipSchoolIndex, ['综合排名'], `${schoolAnalysisName}:五科总 - 综合分析表`, { minimumRows: 5 });
        assertHorizontalRankCells(schoolAnalysisSummary, '横向对比一览表', schoolAnalysisName);

        const { name: schoolCountyName, summary: schoolCountySummary } = await readWorkbookFromPackage(outerZip, files, /学校\/二模学校县域分析0527\.xlsx$/, 'county school analysis workbook');
        if (schoolCountySummary.sheetNames.includes('综合分析报告')) {
            fail(`county school workbook should not include 综合分析报告: ${schoolCountySummary.sheetNames.join(', ')}`);
        }
        if (!schoolCountySummary.sheetNames.some((name) => /五科总.*综合分析表/.test(name))) {
            fail(`county school workbook missing total analysis sheet: ${schoolCountySummary.sheetNames.join(', ')}`);
        }
        const countyTotalSheetName = schoolCountySummary.sheetNames.find((name) => /五科总.*综合分析表/.test(name));
        const countyTotalRows = schoolCountySummary.rowsBySheetName[countyTotalSheetName] || [];
        const countyHeader = countyTotalRows[0] || [];
        const schoolIndex = findColumn(countyHeader, ['学校', '学校名称']);
        const scoreIndex = findColumn(countyHeader, ['两率一分', '两率一分总分']);
        const rankIndex = findColumn(countyHeader, ['综合排名', '县域排名']);
        if (schoolIndex < 0 || scoreIndex < 0 || rankIndex < 0) {
            fail(`county total sheet missing expected columns: ${countyHeader.join(',')}`);
        }
        const countySchoolRows = countyTotalRows.slice(1).filter((row) => String(row[schoolIndex] || '').trim());
        if (countySchoolRows.length < 20) {
            fail(`county total sheet has too few schools: ${countySchoolRows.length}`);
        }
        const blankCountyRows = countySchoolRows.filter((row) => !Number.isFinite(Number(row[scoreIndex])) || Number(row[scoreIndex]) <= 0 || !Number.isFinite(Number(row[rankIndex])) || Number(row[rankIndex]) <= 0);
        if (blankCountyRows.length) {
            fail(`county total sheet has blank/zero score rows: ${blankCountyRows.slice(0, 5).map((row) => row[schoolIndex]).join(', ')}`);
        }
        assertHorizontalRankCells(schoolCountySummary, '横向对比一览表', schoolCountyName);
        Object.entries(schoolCountySummary.rowsBySheetName)
            .filter(([sheet]) => /学科明细/.test(sheet))
            .forEach(([sheet, rows]) => {
                const header = rows[0] || [];
                const keyIndex = findColumn(header, ['学校', '学校名称']);
                assertNumericColumn(rows, header, keyIndex, ['两率一分'], `${schoolCountyName}:${sheet}`, { minimumRows: 20 });
                assertNumericColumn(rows, header, keyIndex, ['县域排名', '综合排名'], `${schoolCountyName}:${sheet}`, { minimumRows: 20 });
            });

        const { name: studentTownName, summary: studentTownSummary } = await readWorkbookFromPackage(outerZip, files, /学生\/二模学生乡镇考试明细\.xlsx$/, 'township student workbook');
        const studentTownRows = studentTownSummary.rowsBySheetName['学生考试明细'] || [];
        const studentTownHeader = studentTownRows[0] || [];
        const studentTownNameIndex = findColumn(studentTownHeader, ['姓名']);
        assertNumericColumn(studentTownRows, studentTownHeader, studentTownNameIndex, ['总分', '五科总'], `${studentTownName}:学生考试明细`, { minimumRows: 50, allowZero: true });
        assertNumericColumn(studentTownRows, studentTownHeader, studentTownNameIndex, ['总分镇排'], `${studentTownName}:学生考试明细`, { minimumRows: 50, requiredWhenColumnNames: ['总分', '五科总'] });

        const { name: studentCountyName, summary: studentCountySummary } = await readWorkbookFromPackage(outerZip, files, /学生\/二模学生考试明细 县域排名\.xlsx$/, 'county student workbook');
        const studentCountyRows = studentCountySummary.rowsBySheetName['学生考试明细'] || [];
        const studentCountyHeader = studentCountyRows[0] || [];
        const studentCountyNameIndex = findColumn(studentCountyHeader, ['姓名']);
        const studentCountySchoolIndex = findColumn(studentCountyHeader, ['学校']);
        assertNumericColumn(studentCountyRows, studentCountyHeader, studentCountyNameIndex, ['总分', '五科总'], `${studentCountyName}:学生考试明细`, { minimumRows: 50, allowZero: true });
        assertNumericColumn(studentCountyRows, studentCountyHeader, studentCountyNameIndex, ['总分县排'], `${studentCountyName}:学生考试明细`, { minimumRows: 50, requiredWhenColumnNames: ['总分', '五科总'] });
        const townshipRankColumns = getColumnIndexesByPattern(studentCountyHeader, /镇排/);
        const countyDirectSet = new Set((packageScope.countyDirectNames || []).map((name) => String(name || '').trim()));
        const badCountyDirectTownRanks = studentCountyRows.slice(1).filter((row) => {
            const school = String(row?.[studentCountySchoolIndex] || '').trim();
            if (!countyDirectSet.has(school)) return false;
            return townshipRankColumns.some((index) => String(row?.[index] || '').trim());
        });
        if (badCountyDirectTownRanks.length) {
            fail(`county-direct schools should not have township ranks: ${badCountyDirectTownRanks.slice(0, 5).map((row) => `${row[studentCountySchoolIndex]}:${row[studentCountyNameIndex]}`).join(', ')}`);
        }

        const { name: teacherTownName, summary: teacherTownSummary } = await readWorkbookFromPackage(outerZip, files, /教师\/二模教师分析0527\.xlsx$/, 'township teacher workbook');
        Object.entries(teacherTownSummary.rowsBySheetName).forEach(([sheet, rows]) => {
            const header = rows[0] || [];
            const nameIndex = findColumn(header, ['教师/学校']);
            if (nameIndex < 0) return;
            assertNumericColumn(rows, header, nameIndex, ['乡镇均分排名'], `${teacherTownName}:${sheet}`, { minimumRows: 2 });
            assertNumericColumn(rows, header, nameIndex, ['平均分'], `${teacherTownName}:${sheet}`, { minimumRows: 2 });
        });

        const result = {
            ok: true,
            suggestedName,
            fileCount: files.length,
            workbookCount: workbookEntries.length,
            teacherCountyName,
            schoolAnalysisName,
            schoolCountyName,
            studentTownName,
            studentCountyName,
            teacherTownName,
            schoolSummaryRows: schoolFirstSheetRows,
            schoolCountySheets: schoolCountySummary.sheetNames,
            schoolCountyRows: countySchoolRows.length,
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
