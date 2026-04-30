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
const proxyOrigin = String(process.env.SMOKE_PROXY_ORIGIN || 'https://schoolsystem.com.cn').trim().replace(/\/+$/, '');

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
const requiredSidebarText = ['数据管理', '联考分析', '教学管理', '学情诊断'];
const removedAnalysisText = ['AI分析', 'AI工作台', 'AI 配置', '单学生 AI 评语', '批量 AI 评语', '宏观 AI 报告', 'AI 学情建议', '生成 AI 评语'];
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

function shouldProxyRequest(urlPath) {
    const pathname = String(urlPath || '/').split('?')[0];
    return pathname.startsWith('/api/') || pathname.startsWith('/sb/');
}

async function readRequestBody(req) {
    if (req.method === 'GET' || req.method === 'HEAD') return undefined;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function proxyRequest(req, res) {
    const headers = {};
    Object.entries(req.headers || {}).forEach(([key, value]) => {
        if (!value) return;
        const lower = String(key || '').toLowerCase();
        if (lower === 'host' || lower === 'connection' || lower === 'content-length') return;
        headers[key] = value;
    });

    const upstream = await fetch(`${proxyOrigin}${req.url || '/'}`, {
        method: req.method || 'GET',
        headers,
        body: await readRequestBody(req),
        redirect: 'manual'
    });

    const responseHeaders = {};
    upstream.headers.forEach((value, key) => {
        const lower = String(key || '').toLowerCase();
        if (lower === 'connection' || lower === 'content-length' || lower === 'content-encoding' || lower === 'transfer-encoding') return;
        responseHeaders[key] = value;
    });

    res.writeHead(upstream.status, responseHeaders);
    const body = Buffer.from(await upstream.arrayBuffer());
    res.end(body);
}

function sendNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
}

async function startServer() {
    if (!fs.existsSync(distDir)) {
        throw new Error(`dist not found: ${distDir}`);
    }

    const server = http.createServer(async (req, res) => {
        if (shouldProxyRequest(req.url || '/')) {
            try {
                await proxyRequest(req, res);
            } catch (error) {
                res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Proxy Error: ${error instanceof Error ? error.message : String(error)}`);
            }
            return;
        }

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
            // 登录接力可能仍在收尾，超时后按当前状态继续判断。
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
            const overlay = document.getElementById('login-overlay');
            const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
            const appVisible = !!app
                && getComputedStyle(app).display !== 'none'
                && !app.classList.contains('hidden');
            const cohortId = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
            const examId = String(localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
            const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
            const readyWorkspace = !!cohortId && !!examId && rawDataLen > 0;
            return overlayHidden && (
                ((!mask || getComputedStyle(mask).display === 'none') && appVisible)
                || (appVisible && readyWorkspace)
            );
        }, undefined, { timeout: 40000 });
    }, { attempts: 4 });

    return withNavigationRetry(page, readEntryState, { attempts: 4 });
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

async function readBootState(page) {
    return page.evaluate(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        return {
            overlayHidden: !overlay || getComputedStyle(overlay).display === 'none',
            appVisible: !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden'),
            maskVisible: !!mask && getComputedStyle(mask).display !== 'none'
        };
    });
}

async function waitForAppReady(page, timeout = 90000) {
    const deadline = Date.now() + timeout;
    let lastState = null;

    while (Date.now() < deadline) {
        try {
            lastState = await withNavigationRetry(page, () => readAppReadyState(page), { attempts: 2 });
        } catch (error) {
            lastState = { error: error?.message || String(error) };
        }

        if (
            lastState
            && lastState.appVisible
            && lastState.maskHidden
            && (lastState.cohortId || lastState.rawDataLen > 0 || lastState.examId)
        ) {
            return lastState;
        }

        await page.waitForTimeout(1000);
    }

    throw new Error(`app not ready for ui-copy-integrity: ${JSON.stringify(lastState)}`);
}

async function login(page) {
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'commit', timeout: 90000 });
    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const overlay = document.getElementById('login-overlay');
            const app = document.getElementById('app');
            const mask = document.getElementById('mode-mask');
            return (!!overlay || !!app || !!mask) && !!window.Auth;
        }, undefined, { timeout: 90000 });
    }, { attempts: 4 });
    await waitForPageStability(page, 10000);

    const bootState = await readBootState(page).catch(() => ({
        overlayHidden: false,
        appVisible: false,
        maskVisible: false
    }));

    if (!(bootState.overlayHidden && (bootState.appVisible || bootState.maskVisible))) {
        const loginUser = page.locator('#login-user');
        if (!(await loginUser.isVisible().catch(() => false))) {
            const openers = [
                page.locator('[data-login-open="school"]').first(),
                page.locator('.login-stage-nav-links a[data-nav="modal"]').first(),
                page.locator('.login-stage-primary-action').first(),
                page.locator('button[onclick="window.Auth?.openLoginPortalModal(\'school\')"]').first()
            ];
            for (const opener of openers) {
                if (!(await opener.count().catch(() => 0))) continue;
                await opener.click({ force: true }).catch(() => { });
                await page.waitForTimeout(200);
                if (await loginUser.isVisible().catch(() => false)) break;
            }
            if (!(await loginUser.isVisible().catch(() => false))) {
                await page.evaluate(() => {
                    if (window.Auth && typeof window.Auth.openLoginPortalModal === 'function') {
                        window.Auth.openLoginPortalModal('school');
                    }
                }).catch(() => { });
            }
        }

        await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });

        const loginText = await page.locator('#login-overlay').innerText();
        assertContainsAll('login overlay', loginText, requiredLoginText);
        assertContainsNoForbidden('login overlay', loginText);

        await page.fill('#login-user', process.env.SMOKE_USER || 'admin');
        await page.fill('#login-pass', process.env.SMOKE_PASS || 'admin123');
        await page.click('button[onclick="window.Auth?.login()"]');
    }

    async function waitForLoggedInState(timeout = 90000) {
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
        }, undefined, { timeout });
    }

    try {
        await withNavigationRetry(page, () => waitForLoggedInState(20000), { attempts: 1 });
    } catch (_) {
        await page.evaluate(() => {
            const user = {
                name: 'Admin',
                role: 'admin',
                roles: ['admin'],
                school: '银山实验学校',
                class: ''
            };
            if (window.AuthState && typeof window.AuthState.setCurrentUser === 'function') {
                window.AuthState.setCurrentUser(user);
            } else {
                sessionStorage.setItem('CURRENT_USER', JSON.stringify(user));
                window.CURRENT_USER = user;
            }
            if (window.Auth) {
                window.Auth.currentUser = window.AuthState?.getCurrentUser?.() || user;
                window.Auth.setLoginPortal?.('school');
                window.Auth.syncLoginOverlayState?.(false);
                window.Auth.applyRoleView?.();
            }
            document.body.dataset.authState = 'logged_in';
            if (typeof window.renderNavigation === 'function') window.renderNavigation();
            if (typeof window.updateAdminOnlyButtons === 'function') window.updateAdminOnlyButtons();
            if (typeof window.updateWatermark === 'function') window.updateWatermark();
            if (typeof window.CohortManager !== 'undefined') window.CohortManager.init();
            if (typeof window.showCohortPicker === 'function') window.showCohortPicker();
        });
        await withNavigationRetry(page, () => waitForLoggedInState(45000), { attempts: 2 });
    }

    await waitForPageStability(page, 5000);
    await ensureCohortEntered(page);
    await withNavigationRetry(page, async () => {
        await page.waitForFunction(() => {
            const app = document.getElementById('app');
            if (!app) return false;
            return getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        }, undefined, { timeout: 45000 });
    }, { attempts: 4 });

    await waitForAppReady(page);
}

async function verifyAnalysisModuleRemoved(page) {
    const sidebarText = await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('#sidebar-nav .sidebar-menu-item .sidebar-menu-item__title'));
        const fallback = Array.from(document.querySelectorAll('#sidebar-nav .sidebar-menu-item span'));
        const source = labels.length > 0 ? labels : fallback;
        return source.map((el) => el.textContent.trim()).join('\n');
    });
    assertContainsAll('sidebar navigation', sidebarText, requiredSidebarText);
    assertContainsNoForbidden('sidebar navigation', sidebarText);

    const removedState = await page.evaluate((tokens) => {
        const bodyText = document.body ? document.body.innerText : '';
        return {
            hasSection: !!document.getElementById('ai-analysis'),
            hasNavCategory: !!(window.NAV_STRUCTURE && window.NAV_STRUCTURE.ai),
            leakedTokens: tokens.filter((token) => bodyText.includes(token))
        };
    }, removedAnalysisText);
    assert.strictEqual(removedState.hasSection, false, 'removed analysis section should not exist');
    assert.strictEqual(removedState.hasNavCategory, false, 'removed analysis navigation category should not exist');
    assert.deepStrictEqual(removedState.leakedTokens, [], `removed analysis copy leaked: ${removedState.leakedTokens.join(', ')}`);
}

async function verifyParentAnalysisCopyRemoved(page) {
    const result = await page.evaluate(async () => {
        const buildFallbackStudent = () => {
            const subjects = Array.isArray(window.SUBJECTS) && window.SUBJECTS.length
                ? window.SUBJECTS
                : ['语文', '数学', '英语'];
            const scores = {};
            const ranks = { total: { class: 1, school: 1, township: 1, county: 1 } };
            subjects.forEach((subject, index) => {
                scores[subject] = 90 - index;
                ranks[subject] = { class: 1, school: 1, township: 1, county: 1 };
            });
            return {
                name: '测试学生',
                class: '9.1',
                school: '银山实验学校',
                scores,
                total: Object.values(scores).reduce((sum, score) => sum + Number(score || 0), 0),
                ranks
            };
        };
        const existingSample = (window.RAW_DATA || []).find((row) => row && row.name && row.class && row.school);
        const sample = existingSample || buildFallbackStudent();
        if (!existingSample) {
            window.RAW_DATA = [sample];
            window.SCHOOLS = Object.assign({}, window.SCHOOLS || {}, {
                [sample.school]: {
                    students: [sample]
                }
            });
        }
        if (!sample || !window.Auth || typeof window.Auth.renderParentView !== 'function') {
            return { ok: false, reason: 'missing sample or renderParentView' };
        }

        const parentUser = { name: sample.name, class: sample.class, school: sample.school, role: 'parent', roles: ['parent'] };
        window.Auth.currentUser = parentUser;
        if (window.AuthState && typeof window.AuthState.setCurrentUser === 'function') {
            window.AuthState.setCurrentUser(parentUser);
        }
        if (typeof window.setCurrentReportStudentState === 'function') window.setCurrentReportStudentState(sample);
        if (typeof window.ensureReportRenderRuntimeLoaded === 'function') {
            await window.ensureReportRenderRuntimeLoaded();
        }
        window.Auth.renderParentView();

        const deadline = Date.now() + 20000;
        let container = document.getElementById('parent-view-container');
        while (Date.now() < deadline) {
            container = document.getElementById('parent-view-container');
            if (container && String(container.innerText || '').includes(sample.name)) break;
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
        return {
            ok: !!container,
            text: container ? container.innerText : ''
        };
    });

    assert.strictEqual(result.ok, true, `parent view failed to render: ${result.reason || 'unknown error'}`);
    const leakedTokens = removedAnalysisText.filter((token) => result.text.includes(token));
    assert.deepStrictEqual(leakedTokens, [], `parent view leaked removed analysis copy: ${leakedTokens.join(', ')}`);
    assertContainsNoForbidden('parent view', result.text);
}

async function main() {
    scanConflictMarkers();

    const server = await startServer();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    page.on('dialog', async (dialog) => {
        await dialog.dismiss().catch(() => { });
    });

    try {
        await login(page);
        await verifyAnalysisModuleRemoved(page);
        await verifyParentAnalysisCopyRemoved(page);
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
