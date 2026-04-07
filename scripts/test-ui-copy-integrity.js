const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');

try {
    require.resolve('playwright');
} catch (error) {
    console.error('playwright is required for test-ui-copy-integrity. Run: npm install --no-save playwright');
    process.exit(1);
}

const { chromium } = require('playwright');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const port = Number(process.env.UI_COPY_PORT || 4174);

const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const requiredLoginText = ['学校端', '家长端', '账号 / 姓名', '密码'];
const requiredSidebarText = ['数据管理', '联考分析', '教学管理', '学情诊断', 'AI分析'];
const requiredAIWorkbenchText = ['AI工作台', 'AI 配置', '单学生 AI 评语', '批量 AI 评语', '宏观 AI 报告'];
const requiredParentText = ['AI 学情建议', '生成 AI 评语'];
const forbiddenTokens = [
    '馃',
    '锛',
    '銆',
    '鈫',
    '宸ヤ綔鍙',
    '閫氳褰',
    '鏁版嵁鏋㈢航',
    '鍓旈櫎瑙勫垯',
    '鏅鸿兘鎬绘帶鍙',
    '瀛︽牎椹鹃┒鑸',
    '瀹堕暱绔',
    '璇峰厛',
    '鍒嗘瀽鎶ヨ〃'
];

function assertContainsAll(label, text, required) {
    const missing = required.filter((token) => !String(text || '').includes(token));
    assert.deepStrictEqual(missing, [], `${label} missing expected text: ${missing.join(', ')}`);
}

function assertContainsNoForbidden(label, text) {
    const hit = forbiddenTokens.filter((token) => String(text || '').includes(token));
    assert.deepStrictEqual(hit, [], `${label} contains mojibake tokens: ${hit.join(', ')}`);
}

function scanConflictMarkers() {
    const files = [
        path.join(projectRoot, 'src', 'index.html'),
        path.join(projectRoot, 'lt.html'),
        path.join(projectRoot, 'dist', 'index.html')
    ];

    const jsDir = path.join(projectRoot, 'public', 'assets', 'js');
    fs.readdirSync(jsDir)
        .filter((name) => name.endsWith('.js'))
        .forEach((name) => files.push(path.join(jsDir, name)));

    const offenders = [];
    const markerRe = /^(<<<<<<< |=======|>>>>>>> )/m;
    files.forEach((file) => {
        if (!fs.existsSync(file)) return;
        const text = fs.readFileSync(file, 'utf8');
        if (markerRe.test(text)) offenders.push(path.relative(projectRoot, file));
    });

    assert.deepStrictEqual(offenders, [], `Found unresolved merge markers in: ${offenders.join(', ')}`);
}

function resolveFilePath(urlPath) {
    const decodedPath = decodeURIComponent(String(urlPath || '/').split('?')[0]);
    const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\\/])+/, '');
    return path.join(distDir, safePath);
}

function sendNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
}

async function startServer() {
    if (!fs.existsSync(distDir)) {
        throw new Error(`dist not found: ${distDir}`);
    }

    const server = http.createServer((req, res) => {
        const filePath = resolveFilePath(req.url || '/');
        if (!filePath.startsWith(distDir)) {
            sendNotFound(res);
            return;
        }

        fs.stat(filePath, (statError, stats) => {
            if (statError) {
                sendNotFound(res);
                return;
            }

            const targetFile = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
            fs.readFile(targetFile, (readError, data) => {
                if (readError) {
                    sendNotFound(res);
                    return;
                }

                const contentType = mimeTypes[path.extname(targetFile).toLowerCase()] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            });
        });
    });

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve());
    });

    return server;
}

async function ensureCohortEntered(page) {
    const readEntryState = () => page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        return {
            maskVisible: !!mask && getComputedStyle(mask).display !== 'none',
            examId: String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim(),
            rawDataLen: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0
        };
    });
    let state = await readEntryState();
    if (!state.maskVisible) return;

    try {
        await page.waitForFunction(() => {
            const mask = document.getElementById('mode-mask');
            const examId = String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
            const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
            return (!mask || getComputedStyle(mask).display === 'none')
                || (!!examId && rawDataLen > 0);
        }, { timeout: 15000 });
    } catch (_) {
        // 云端恢复未接管时，再回退到手动进入届别。
    }

    state = await readEntryState();
    if (!state.maskVisible || (state.examId && state.rawDataLen > 0)) return;

    const candidate = String(process.env.SMOKE_COHORT_YEAR || '2022').trim();
    const input = page.locator('#entry-cohort-year');
    if (await input.count()) await input.fill(candidate);

    await page.evaluate(() => {
        if (typeof window.enterCohortFromMask === 'function') {
            window.enterCohortFromMask();
            return;
        }
        const button = document.querySelector('button[onclick="enterCohortFromMask()"]');
        if (button) button.click();
    });

    await page.waitForFunction(() => {
        const mask = document.getElementById('mode-mask');
        return !mask || getComputedStyle(mask).display === 'none';
    }, { timeout: 20000 });
}

async function readAppReadyState(page) {
    return page.evaluate(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        const school = String(
            (window.SchoolState && typeof window.SchoolState.getCurrentSchool === 'function'
                ? window.SchoolState.getCurrentSchool()
                : '')
            || window.MY_SCHOOL
            || localStorage.getItem('MY_SCHOOL')
            || ''
        ).trim();

        return {
            overlayHidden: !overlay || getComputedStyle(overlay).display === 'none',
            appVisible: !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden'),
            maskHidden: !mask || getComputedStyle(mask).display === 'none',
            rawDataLen: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            cohortId: String(localStorage.getItem('CURRENT_COHORT_ID') || '').trim(),
            termId: String(localStorage.getItem('CURRENT_TERM_ID') || '').trim(),
            examId: String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim(),
            school
        };
    });
}

async function waitForAppReady(page, timeout = 90000) {
    const deadline = Date.now() + timeout;
    let lastState = null;

    while (Date.now() < deadline) {
        try {
            lastState = await readAppReadyState(page);
        } catch (error) {
            lastState = { error: error?.message || String(error) };
        }

        if (
            lastState
            && lastState.overlayHidden
            && lastState.appVisible
            && lastState.maskHidden
            && lastState.rawDataLen > 100
            && lastState.cohortId
            && lastState.termId
            && lastState.examId
            && lastState.school
        ) {
            return lastState;
        }

        await page.waitForTimeout(1000);
    }

    throw new Error(`app not ready for ui-copy-integrity: ${JSON.stringify(lastState)}`);
}

async function login(page) {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#login-user', { timeout: 30000 });

    const loginText = await page.locator('#login-overlay').innerText();
    assertContainsAll('login overlay', loginText, requiredLoginText);
    assertContainsNoForbidden('login overlay', loginText);

    await page.fill('#login-user', process.env.SMOKE_USER || 'admin');
    await page.fill('#login-pass', process.env.SMOKE_PASS || 'admin123');
    await page.click('button[onclick="window.Auth?.login()"]');

    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        return overlay && getComputedStyle(overlay).display === 'none';
    }, { timeout: 30000 });

    await ensureCohortEntered(page);

    await waitForAppReady(page);
}

async function verifyTeacherAiWorkbench(page) {
    const sidebarText = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('#sidebar-nav .sidebar-menu-item .sidebar-menu-item__title'));
        const fallback = Array.from(document.querySelectorAll('#sidebar-nav .sidebar-menu-item span'));
        const source = labels.length > 0 ? labels : fallback;
        return source.map((el) => el.textContent.trim()).join('\n');
    });
    assertContainsAll('sidebar navigation', sidebarText, requiredSidebarText);
    assertContainsNoForbidden('sidebar navigation', sidebarText);

    await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('#sidebar-nav .sidebar-menu-item'));
        if (items[4]) items[4].click();
    });
    await page.waitForTimeout(700);
    await page.evaluate(() => {
        const chips = Array.from(document.querySelectorAll('#sub-nav-container .shell-story-card, #sub-nav-container .chip-item'));
        if (chips[0]) chips[0].click();
    });
    await page.waitForFunction(() => {
        const section = document.getElementById('ai-analysis');
        const heading = document.querySelector('#ai-analysis .analysis-shell-head h2');
        return !!section
            && section.classList.contains('active')
            && !!heading
            && String(heading.textContent || '').includes('AI工作台');
    }, undefined, { timeout: 5000 });

    const aiText = await page.evaluate(() => {
        const section = document.getElementById('ai-analysis');
        return section ? section.textContent : '';
    });
    assertContainsAll('AI workbench', aiText, requiredAIWorkbenchText);
    assertContainsNoForbidden('AI workbench', aiText);
}

async function verifyParentAiBlock(page) {
    const result = await page.evaluate(async () => {
        const sample = (window.RAW_DATA || []).find((row) => row && row.name && row.class && row.school);
        if (!sample || !window.Auth || typeof window.Auth.renderParentView !== 'function') {
            return { ok: false, reason: 'missing sample or renderParentView' };
        }

        window.Auth.currentUser = { name: sample.name, class: sample.class, school: sample.school, role: 'parent', roles: ['parent'] };
        if (typeof window.setCurrentReportStudentState === 'function') window.setCurrentReportStudentState(sample);
        if (typeof window.ensureReportRenderRuntimeLoaded === 'function') {
            await window.ensureReportRenderRuntimeLoaded();
        }
        window.Auth.renderParentView();
        await new Promise((resolve) => setTimeout(resolve, 1800));

        const container = document.getElementById('parent-view-container');
        const text = container ? container.innerText : '';
        return {
            ok: !!container,
            text
        };
    });

    assert.strictEqual(result.ok, true, `parent view failed to render: ${result.reason || 'unknown error'}`);
    assertContainsAll('parent AI block', result.text, requiredParentText);
    assertContainsNoForbidden('parent AI block', result.text);
}

async function main() {
    scanConflictMarkers();

    const server = await startServer();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

    try {
        await login(page);
        await verifyTeacherAiWorkbench(page);
        await verifyParentAiBlock(page);
        console.log('ui-copy-integrity passed');
    } finally {
        await browser.close().catch(() => { });
        await new Promise((resolve) => server.close(() => resolve()));
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
