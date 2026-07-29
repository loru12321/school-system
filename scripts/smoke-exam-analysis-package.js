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

function normalizeCompareValue(value) {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text) return '';
    const numeric = Number(text.replace(/%$/, ''));
    if (Number.isFinite(numeric)) return Number(numeric.toFixed(2));
    return text.replace(/\s+/g, '');
}

function assertSheetRowsMatchExpected(rows, expectedRows, label, columns) {
    const header = rows[0] || [];
    const nameIndex = findColumn(header, ['学校', '学校名称']);
    if (nameIndex < 0) fail(`${label} missing school column: ${header.join(',')}; firstRows=${JSON.stringify((rows || []).slice(0, 5))}`);
    const byName = new Map(rows.slice(1).filter((row) => String(row?.[nameIndex] || '').trim()).map((row) => [String(row[nameIndex]).trim(), row]));
    if (byName.size < expectedRows.length) fail(`${label} has too few school rows: ${byName.size} < ${expectedRows.length}`);
    expectedRows.forEach((expected) => {
        const actual = byName.get(expected.name);
        if (!actual) fail(`${label} missing row for ${expected.name}`);
        columns.forEach((column) => {
            const columnIndex = findColumn(header, column.names);
            if (columnIndex < 0) fail(`${label} missing column ${column.names.join('/')}: ${header.join(',')}`);
            const actualValue = normalizeCompareValue(actual[columnIndex]);
            const expectedValue = normalizeCompareValue(expected[column.key]);
            if (actualValue !== expectedValue) {
                fail(`${label} mismatch ${expected.name}.${column.key}: actual=${actualValue} expected=${expectedValue} row=${JSON.stringify(actual)} header=${JSON.stringify(header)}`);
            }
        });
    });
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
                mySchoolName: String(window.MY_SCHOOL || window.DEFAULT_MY_SCHOOL_NAME || '').trim(),
                countyDirectNames: names.filter((name) => {
                    if (typeof window.isTownshipManagedSchool === 'function') {
                        return !window.isTownshipManagedSchool(name, names);
                    }
                    return !(townshipNames || []).some((item) => String(item || '').trim() === String(name || '').trim());
                })
            };
        });
        // 中考政治仅作同届二模参考，但教师乡镇表必须带齐二模外校学校聚合行。
        // 导出函数应自行完成读取/回填；回归断言只使用正式的乡镇学校范围，避免先
        // 行为加载掩盖下载路径本身的遗漏问题。
        const politicsReferenceScope = await page.evaluate((townshipNames) => {
            const ownSchool = String(window.MY_SCHOOL || window.DEFAULT_MY_SCHOOL_NAME || '').trim();
            const sameSchool = typeof window.sameAppSchoolName === 'function'
                ? window.sameAppSchoolName
                : (left, right) => String(left || '').trim() === String(right || '').trim();
            const externalSchoolNames = (townshipNames || [])
                .map((name) => String(name || '').trim())
                .filter((name) => name && !sameSchool(name, ownSchool));
            if (!externalSchoolNames.length) {
                throw new Error('grade-9 politics reference has no external township schools');
            }
            return { externalSchoolNames };
        }, packageScope.townshipNames);
        const expectedSupportRows = await page.evaluate(() => {
            if (typeof window.renderTables === 'function') window.renderTables();
            if (typeof window.calcSummary === 'function') window.calcSummary(true);
            if (typeof window.renderHighScoreTable === 'function') window.renderHighScoreTable();
            if (typeof window.renderBottom3TableOnly === 'function') window.renderBottom3TableOnly();
            let indicatorRows = [];
            if (typeof window.calcIndicators === 'function') {
                const result = window.calcIndicators(true);
                if (Array.isArray(result)) indicatorRows = result;
            }
            if (!indicatorRows.length && Array.isArray(window.__LAST_INDICATOR_CALC_DATA__)) indicatorRows = window.__LAST_INDICATOR_CALC_DATA__;
            const schools = typeof window.getSummaryTownshipSchools === 'function'
                ? window.getSummaryTownshipSchools()
                : Object.values(window.SCHOOLS || {});
            const round = (value, digits = 2) => {
                const number = Number(value);
                return Number.isFinite(number) ? Number(number.toFixed(digits)) : '';
            };
            const pct = (value) => {
                const number = Number(value);
                return Number.isFinite(number) ? Number((number * 100).toFixed(2)) : '';
            };
            const countStudentsForSchool = (name) => {
                const target = String(name || '').trim();
                return (window.RAW_DATA || []).filter((student) => {
                    const schoolName = String(student?.school || '').trim();
                    if (typeof window.sameAppSchoolName === 'function') return window.sameAppSchoolName(schoolName, target);
                    return schoolName === target;
                }).length;
            };
            const domHighRows = Array.from(document.querySelectorAll('#tb-high-score tbody tr')).map((tr) => {
                const cells = Array.from(tr.querySelectorAll('td')).map((td) => td.textContent.trim());
                if (cells.length < 6 || !cells[0] || /无高分段|请先上传/.test(cells.join(''))) return null;
                return {
                    name: cells[0],
                    count: Number(cells[1]) || 0,
                    highCount: Number(cells[2]) || 0,
                    highRate: Number(String(cells[3] || '').replace(/%$/, '')) || 0,
                    score: round(cells[4]),
                    rank: Number(cells[5]) || 0
                };
            }).filter(Boolean);
            if (domHighRows.length) {
                const highScore = domHighRows;
                const indicator = (indicatorRows || []).slice()
                    .sort((left, right) => (Number(left.rank) || 9999) - (Number(right.rank) || 9999) || String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN', { numeric: true }))
                    .map((row) => ({
                        name: row.name || '',
                        studentCount: row.studentCount || '',
                        targetKey: row.targetKey || '',
                        ind1: `${row.t1 || (row.invalidTarget ? '异常' : (row.missingTarget ? '未匹配' : 0))}/${row.r1 || 0}`,
                        base1: round(row.base1),
                        bonus1: round(row.bonus1),
                        score1: round(row.score1),
                        ind2: `${row.t2 || (row.invalidTarget ? '异常' : (row.missingTarget ? '未匹配' : 0))}/${row.r2 || 0}`,
                        base2: round(row.base2),
                        bonus2: round(row.bonus2),
                        score2: round(row.score2),
                        finalScore: round(row.finalScore),
                        rank: row.rank || '',
                    }));
                const bottomBase = schools.map((school) => {
                    const name = school.name || '';
                    const schoolRows = (window.RAW_DATA || []).filter((student) => {
                        const schoolName = String(student?.school || '').trim();
                        if (typeof window.sameAppSchoolName === 'function') return window.sameAppSchoolName(schoolName, name);
                        return schoolName === String(name || '').trim();
                    }).filter((student) => Number.isFinite(Number(student?.total)));
                    const totals = schoolRows.map((student) => Number(student.total)).sort((left, right) => left - right);
                    const totalN = totals.length;
                    const bottomN = Math.floor(totalN / 3);
                    const excRate = Number(window.CONFIG?.excRate) || 0;
                    const excN = Math.ceil(bottomN * excRate);
                    const bottomTotals = totals.slice(0, bottomN);
                    const validTotals = bottomTotals.slice(excN);
                    const avg = validTotals.length ? validTotals.reduce((sum, value) => sum + value, 0) / validTotals.length : 0;
                    return { name, totalN, bottomN, excN, avg };
                });
                const maxBottomAvg = Math.max(...bottomBase.map((row) => Number(row.avg) || 0), 0);
                const bottom = bottomBase.map((row) => ({
                    ...row,
                    avg: round(row.avg),
                    score: round(maxBottomAvg ? row.avg / maxBottomAvg * 40 : 0)
                })).sort((left, right) => Number(right.score) - Number(left.score))
                    .map((row, index) => ({ ...row, rank: index + 1 }));
                return { highScore, indicator, bottom };
            }
            const highSource = schools.map((school) => {
                const name = school.name || '';
                const schoolRows = (window.RAW_DATA || []).filter((student) => {
                    const schoolName = String(student?.school || '').trim();
                    if (typeof window.sameAppSchoolName === 'function') return window.sameAppSchoolName(schoolName, name);
                    return schoolName === String(name || '').trim();
                });
                const highCount = schoolRows.filter((student) => Number(student?.total) >= 490).length;
                return {
                    name,
                    count: schoolRows.length || Number(school.metrics?.total?.count) || countStudentsForSchool(name),
                    highCount,
                    highRatioRaw: schoolRows.length ? highCount / schoolRows.length : 0
                };
            });
            const maxHighRatio = Math.max(...highSource.map((row) => Number(row.highRatioRaw) || 0), 0);
            const highScore = highSource.map((row) => {
                const score = maxHighRatio > 0 ? row.highRatioRaw / maxHighRatio * 50 : 0;
                return {
                    name: row.name,
                    count: row.count,
                    highCount: row.highCount,
                    highRate: pct(row.highRatioRaw),
                    score: round(score),
                };
            }).sort((left, right) => Number(right.score) - Number(left.score))
                .map((row, index) => ({ ...row, rank: index + 1 }));
            const indicator = (indicatorRows || []).slice()
                .sort((left, right) => (Number(left.rank) || 9999) - (Number(right.rank) || 9999) || String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN', { numeric: true }))
                .map((row) => ({
                    name: row.name || '',
                    studentCount: row.studentCount || '',
                    targetKey: row.targetKey || '',
                    ind1: `${row.t1 || (row.invalidTarget ? '异常' : (row.missingTarget ? '未匹配' : 0))}/${row.r1 || 0}`,
                    base1: round(row.base1),
                    bonus1: round(row.bonus1),
                    score1: round(row.score1),
                    ind2: `${row.t2 || (row.invalidTarget ? '异常' : (row.missingTarget ? '未匹配' : 0))}/${row.r2 || 0}`,
                    base2: round(row.base2),
                    bonus2: round(row.bonus2),
                    score2: round(row.score2),
                    finalScore: round(row.finalScore),
                    rank: row.rank || '',
                }));
            const bottom = schools.slice()
                .sort((left, right) => (left.rankBottom || 9999) - (right.rankBottom || 9999) || String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN', { numeric: true }))
                .map((school) => ({
                    name: school.name || '',
                    totalN: school.bottom3?.totalN || '',
                    bottomN: school.bottom3?.bottomN || '',
                    excN: school.bottom3?.excN || '',
                    avg: round(school.bottom3?.avg),
                    score: round(school.scoreBottom),
                    rank: school.rankBottom || '',
                }));
            return { highScore, indicator, bottom };
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
        // 日期后缀跟随当前考试，不写死某一次考试；县域分表只在数据含县域范围时生成。
        const dateSuffix = (() => {
            const match = files.map((name) => /成绩(\d{4})\.xlsx$/.exec(name)).find(Boolean);
            if (!match) fail(`cannot resolve package date suffix; files=${files.join(', ')}`);
            return match[1];
        })();
        const hasCountyWorkbooks = files.some((name) => /县域/.test(name));
        const workbookPattern = {
            rawScore: new RegExp(`(^|/).*成绩${dateSuffix}\\.xlsx$`),
            schoolAnalysis: new RegExp(`学校/.*学校分析(?:（不含政治）)?${dateSuffix}\\.xlsx$`),
            schoolCounty: new RegExp(`学校/.*学校县域分析${dateSuffix}\\.xlsx$`),
            teacherTown: new RegExp(`教师/.*教师分析${dateSuffix}\\.xlsx$`)
        };
        const minimumWorkbooks = hasCountyWorkbooks ? 7 : 4;
        if (workbookEntries.length < minimumWorkbooks) {
            fail(`analysis package has too few workbooks (county=${hasCountyWorkbooks}): ${workbookEntries.map((entry) => entry.name).join(', ')}`);
        }
        workbookEntries.forEach((entry) => assertWorkbookCommon(entry.summary, entry.name));
        let teacherCountyName = '';
        let teacherCountySummary = { rowCounts: {}, sheetNames: [] };
        let schoolCountyName = '';
        let schoolCountySummary = { sheetNames: [], rowsBySheetName: {} };
        let countySchoolRows = [];
        let studentCountyName = '';

        if (hasCountyWorkbooks) {
            const teacherCountyWorkbook = await readWorkbookFromPackage(outerZip, files, new RegExp(`教师\\/.*教师县域分析${dateSuffix}\\.xlsx$`), 'county teacher workbook');
            teacherCountyName = teacherCountyWorkbook.name;
            teacherCountySummary = teacherCountyWorkbook.summary;
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
            if (!teacherCountySummary.sheetNames.includes('政治（二模参考） 同学科县域排名')) {
                fail(`teacher county workbook missing politics reference sheet: ${teacherCountySummary.sheetNames.join(', ')}`);
            }
        }

        const { name: rawScoreName, summary: rawScoreSummary } = await readWorkbookFromPackage(outerZip, files, workbookPattern.rawScore, 'raw score workbook');
        if (!rawScoreSummary.text.includes('_标记') || !rawScoreSummary.text.includes('本校')) {
            fail('raw score workbook is missing own-school markers');
        }
        Object.entries(rawScoreSummary.rowsBySheetName).forEach(([sheet, rows]) => {
            const header = rows[0] || [];
            const nameIndex = findColumn(header, ['姓名']);
            if (nameIndex < 0) return;
            assertNumericColumn(rows, header, nameIndex, ['总分', '五科总'], `${rawScoreName}:${sheet}`, { minimumRows: 1, allowZero: true });
            assertNumericColumn(rows, header, nameIndex, ['政治（二模参考）'], `${rawScoreName}:${sheet}`, { minimumRows: 1, allowZero: true });
        });

        const { name: schoolAnalysisName, summary: schoolAnalysisSummary } = await readWorkbookFromPackage(outerZip, files, workbookPattern.schoolAnalysis, 'school analysis workbook');
        const schoolFirstSheetRows = schoolAnalysisSummary.rowCounts['xl/worksheets/sheet1.xml'] || 0;
        if (schoolFirstSheetRows < 18) {
            fail(`school comprehensive report is too short: ${JSON.stringify(schoolAnalysisSummary.rowCounts)}`);
        }
        ['学校名称', '两率一分得分', '后1/3得分', '综合总分', '总排名', packageScope.mySchoolName].filter(Boolean).forEach((needle) => {
            if (!schoolAnalysisSummary.text.includes(needle)) {
                fail(`school comprehensive report missing ${needle}`);
            }
        });
        if (!/高分段赋分\(50\)|高分段赋分&#40;50&#41;/.test(schoolAnalysisSummary.text)) {
            fail('grade 9 school comprehensive report is missing high-score contribution column');
        }
        const comprehensiveRows = schoolAnalysisSummary.rowsBySheetName['综合分析报告'] || [];
        const comprehensiveHeader = comprehensiveRows[0] || [];
        if (findColumn(comprehensiveHeader, ['高中上线率赋分(50)', '高中上线率赋分']) < 0) {
            fail('grade 9 school comprehensive report is missing high-school admission contribution column');
        }
        if (!schoolAnalysisSummary.text.includes('_标记') || !schoolAnalysisSummary.text.includes('本校')) {
            fail('school comprehensive report is missing own-school marker');
        }
        const townshipTotalSheetName = schoolAnalysisSummary.sheetNames.find((sheet) => /五科总.*综合分析表/.test(sheet)) || '';
        const townshipTotalRows = schoolAnalysisSummary.rowsBySheetName[townshipTotalSheetName] || [];
        const townshipHeader = townshipTotalRows[0] || [];
        const townshipSchoolIndex = findColumn(townshipHeader, ['学校']);
        if (!townshipTotalSheetName) fail(`${schoolAnalysisName} is missing the five-subject summary sheet`);
        assertNumericColumn(townshipTotalRows, townshipHeader, townshipSchoolIndex, ['两率一分'], `${schoolAnalysisName}:${townshipTotalSheetName}`, { minimumRows: 5 });
        assertNumericColumn(townshipTotalRows, townshipHeader, townshipSchoolIndex, ['综合排名'], `${schoolAnalysisName}:${townshipTotalSheetName}`, { minimumRows: 5 });
        assertHorizontalRankCells(schoolAnalysisSummary, '横向对比一览表', schoolAnalysisName);
        const highScoreRows = schoolAnalysisSummary.rowsBySheetName['高分段赋分详情'] || [];
        assertSheetRowsMatchExpected(highScoreRows, expectedSupportRows.highScore, `${schoolAnalysisName}:高分段赋分详情`, [
            { key: 'count', names: ['实考人数'] },
            { key: 'highCount', names: ['高分人数(≥490)', '高分人数'] },
            { key: 'highRate', names: ['高分率(%)'] },
            { key: 'score', names: ['高分赋分(50)', '高分段赋分'] },
            { key: 'rank', names: ['排名'] }
        ]);
        const highSchoolAdmissionRows = schoolAnalysisSummary.rowsBySheetName['高中上线率赋分详情'] || [];
        if (!highSchoolAdmissionRows.length) {
            fail(`${schoolAnalysisName}:高中上线率赋分详情 is empty; sheets=${schoolAnalysisSummary.sheetNames.join(', ')}`);
        }
        const highSchoolAdmissionHeader = highSchoolAdmissionRows[0] || [];
        const highSchoolAdmissionSchoolIndex = findColumn(highSchoolAdmissionHeader, ['学校名称', '学校']);
        assertNumericColumn(highSchoolAdmissionRows, highSchoolAdmissionHeader, highSchoolAdmissionSchoolIndex, ['高中上线人数'], `${schoolAnalysisName}:高中上线率赋分详情`, { minimumRows: 5, allowZero: true });
        assertNumericColumn(highSchoolAdmissionRows, highSchoolAdmissionHeader, highSchoolAdmissionSchoolIndex, ['高中上线率赋分(50)', '高中上线率赋分'], `${schoolAnalysisName}:高中上线率赋分详情`, { minimumRows: 5, allowZero: true });
        const indicatorRows = schoolAnalysisSummary.rowsBySheetName['指标生达标核算'] || [];
        if (!indicatorRows.length) {
            fail(`${schoolAnalysisName}:指标生达标核算 is empty; sheets=${schoolAnalysisSummary.sheetNames.join(', ')}; rowCounts=${JSON.stringify(schoolAnalysisSummary.rowCounts)}; availableKeys=${Object.keys(schoolAnalysisSummary.rowsBySheetName).join(', ')}`);
        }
        assertSheetRowsMatchExpected(indicatorRows, expectedSupportRows.indicator, `${schoolAnalysisName}:指标生达标核算`, [
            { key: 'studentCount', names: ['学生数'] },
            { key: 'ind1', names: ['指标一目标/达标'] },
            { key: 'base1', names: ['指标一基础分'] },
            { key: 'bonus1', names: ['指标一附加分'] },
            { key: 'score1', names: ['指标一小计'] },
            { key: 'ind2', names: ['指标二目标/达标'] },
            { key: 'base2', names: ['指标二基础分'] },
            { key: 'bonus2', names: ['指标二附加分'] },
            { key: 'score2', names: ['指标二小计'] },
            { key: 'finalScore', names: ['指标总分'] },
            { key: 'rank', names: ['排名'] }
        ]);
        const bottomRows = schoolAnalysisSummary.rowsBySheetName['后三分之一学生核算'] || schoolAnalysisSummary.rowsBySheetName['后1/3学生核算'] || [];
        assertSheetRowsMatchExpected(bottomRows, expectedSupportRows.bottom, `${schoolAnalysisName}:后三分之一学生核算`, [
            { key: 'totalN', names: ['总人数'] },
            { key: 'bottomN', names: ['后1/3人数'] },
            { key: 'excN', names: ['剔除人数'] },
            { key: 'avg', names: ['有效后1/3均分', '后1/3平均分'] },
            { key: 'score', names: ['后1/3得分'] },
            { key: 'rank', names: ['排名'] }
        ]);
        if (!schoolAnalysisSummary.sheetNames.includes('9年级专项核算对照表')) {
            fail(`school analysis workbook missing 9年级专项核算对照表: ${schoolAnalysisSummary.sheetNames.join(', ')}`);
        }
        const supportRows = schoolAnalysisSummary.rowsBySheetName['9年级专项核算对照表'] || [];
        const supportHeader = supportRows[0] || [];
        const supportSchoolIndex = findColumn(supportHeader, ['学校']);
        const requiredSupportColumns = [
            '高分人数',
            '高分率(%)',
            '高分赋分(50)',
            '高分排名',
            '指标一目标/达标',
            '指标二目标/达标',
            '指标总分',
            '指标排名',
            '后1/3均分',
            '后1/3得分',
            '后1/3排名'
        ].map((name) => ({ name, index: findColumn(supportHeader, [name]) }));
        requiredSupportColumns.forEach((column) => {
            if (column.index < 0) fail(`${schoolAnalysisName}:9年级专项核算对照表 missing column ${column.name}`);
        });
        supportRows.slice(1).forEach((row, index) => {
            const schoolName = String(row[supportSchoolIndex] || '').trim();
            if (!schoolName) return;
            if (schoolName === '说明') fail(`${schoolAnalysisName}:9年级专项核算对照表 should not include explanation rows inside the data table`);
            requiredSupportColumns.forEach((column) => {
                const value = String(row[column.index] ?? '').trim();
                if (!value) fail(`${schoolAnalysisName}:9年级专项核算对照表 row ${index + 2} ${schoolName} blank ${column.name}`);
            });
        });

        if (hasCountyWorkbooks) {
        const schoolCountyWorkbook = await readWorkbookFromPackage(outerZip, files, workbookPattern.schoolCounty, 'county school analysis workbook');
        schoolCountyName = schoolCountyWorkbook.name;
        schoolCountySummary = schoolCountyWorkbook.summary;
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
        countySchoolRows = countyTotalRows.slice(1).filter((row) => String(row[schoolIndex] || '').trim());
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
        }

        const { name: studentTownName, summary: studentTownSummary } = await readWorkbookFromPackage(outerZip, files, /学生\/.*学生乡镇考试明细\.xlsx$/, 'township student workbook');
        const studentTownRows = studentTownSummary.rowsBySheetName['学生考试明细'] || [];
        const studentTownHeader = studentTownRows[0] || [];
        const studentTownNameIndex = findColumn(studentTownHeader, ['姓名']);
        assertNumericColumn(studentTownRows, studentTownHeader, studentTownNameIndex, ['总分', '五科总'], `${studentTownName}:学生考试明细`, { minimumRows: 50, allowZero: true });
        assertNumericColumn(studentTownRows, studentTownHeader, studentTownNameIndex, ['总分镇排', '五科总镇排'], `${studentTownName}:学生考试明细`, { minimumRows: 50, requiredWhenColumnNames: ['总分', '五科总'] });
        assertNumericColumn(studentTownRows, studentTownHeader, studentTownNameIndex, ['政治（二模参考）分数'], `${studentTownName}:学生考试明细`, { minimumRows: 50, allowZero: true });
        assertNumericColumn(studentTownRows, studentTownHeader, studentTownNameIndex, ['政治（二模参考）镇排'], `${studentTownName}:学生考试明细`, { minimumRows: 50, requiredWhenColumnNames: ['政治（二模参考）分数'] });

        if (hasCountyWorkbooks) {
        const studentCountyWorkbook = await readWorkbookFromPackage(outerZip, files, /学生\/.*学生考试明细 县域排名\.xlsx$/, 'county student workbook');
        studentCountyName = studentCountyWorkbook.name;
        const studentCountySummary = studentCountyWorkbook.summary;
        const studentCountyRows = studentCountySummary.rowsBySheetName['学生考试明细'] || [];
        const studentCountyHeader = studentCountyRows[0] || [];
        const studentCountyNameIndex = findColumn(studentCountyHeader, ['姓名']);
        const studentCountySchoolIndex = findColumn(studentCountyHeader, ['学校']);
        assertNumericColumn(studentCountyRows, studentCountyHeader, studentCountyNameIndex, ['总分', '五科总'], `${studentCountyName}:学生考试明细`, { minimumRows: 50, allowZero: true });
        assertNumericColumn(studentCountyRows, studentCountyHeader, studentCountyNameIndex, ['总分县排', '五科总县排'], `${studentCountyName}:学生考试明细`, { minimumRows: 50, requiredWhenColumnNames: ['总分', '五科总'] });
        assertNumericColumn(studentCountyRows, studentCountyHeader, studentCountyNameIndex, ['政治（二模参考）分数'], `${studentCountyName}:学生考试明细`, { minimumRows: 50, allowZero: true });
        assertNumericColumn(studentCountyRows, studentCountyHeader, studentCountyNameIndex, ['政治（二模参考）县排'], `${studentCountyName}:学生考试明细`, { minimumRows: 50, requiredWhenColumnNames: ['政治（二模参考）分数'] });
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
        }

        const { name: teacherTownName, summary: teacherTownSummary } = await readWorkbookFromPackage(outerZip, files, workbookPattern.teacherTown, 'township teacher workbook');
        if (!teacherTownSummary.sheetNames.includes('政治（二模参考） 教师乡镇排名')) {
            fail(`teacher township workbook missing politics reference sheet: ${teacherTownSummary.sheetNames.join(', ')}`);
        }
        const politicsTeacherRows = teacherTownSummary.rowsBySheetName['政治（二模参考） 教师乡镇排名'] || [];
        const politicsTeacherHeader = politicsTeacherRows[0] || [];
        const politicsTeacherNameIndex = findColumn(politicsTeacherHeader, ['教师/学校']);
        const politicsTeacherTypeIndex = findColumn(politicsTeacherHeader, ['类型']);
        if (politicsTeacherNameIndex < 0 || politicsTeacherTypeIndex < 0) {
            fail(`${teacherTownName}:政治（二模参考） 教师乡镇排名 missing name/type columns: ${politicsTeacherHeader.join(',')}`);
        }
        const politicsExternalSchoolRows = getDataRows(politicsTeacherRows, politicsTeacherNameIndex)
            .filter((row) => String(row?.[politicsTeacherTypeIndex] || '').trim() === '学校');
        const politicsExternalSchoolNames = new Set(politicsExternalSchoolRows
            .map((row) => String(row?.[politicsTeacherNameIndex] || '').trim()));
        const missingPoliticsSchools = politicsReferenceScope.externalSchoolNames
            .filter((name) => !politicsExternalSchoolNames.has(name));
        if (missingPoliticsSchools.length) {
            fail(`${teacherTownName}:政治（二模参考） 教师乡镇排名 is missing external schools: ${missingPoliticsSchools.join(', ')}`);
        }
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
            teacherCountyRows: teacherCountySummary.rowCounts,
            politicsExternalSchoolRows: politicsExternalSchoolRows.length
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
