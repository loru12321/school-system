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
let port = Number(process.env.UI_COPY_PORT || 4174);
const hasExplicitPort = !!process.env.UI_COPY_PORT;
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
    '.wav': 'audio/wav',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const requiredLoginText = ['学校端', '家长端', '账号 / 姓名', '密码'];
const requiredSidebarText = ['数据准备', '联考评价', '教学改进', '学生发展', '县域对标', '教务执行'];
const removedAnalysisText = ['AI分析', 'AI工作台', 'AI 配置', '单学生 AI 评语', '批量 AI 评语', '宏观 AI 报告', 'AI 学情建议', '生成 AI 评语', '绩效公平考核模型', '校内绩效公平考核', '公平绩效'];
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

function scanReplacementCharacters() {
    const files = [
        path.join(projectRoot, 'src', 'index.html'),
        path.join(projectRoot, 'public', 'site.webmanifest'),
        path.join(projectRoot, 'public', 'assets', 'js', 'app.js'),
        path.join(projectRoot, 'public', 'assets', 'js', 'app-foundation-runtime.js'),
        path.join(projectRoot, 'public', 'assets', 'js', 'service-worker-runtime.js'),
        path.join(projectRoot, 'dist', 'index.html'),
        path.join(projectRoot, 'dist', 'site.webmanifest'),
        path.join(projectRoot, 'dist', 'assets', 'js', 'app.js')
    ];

    const offenders = [];
    files.forEach((file) => {
        if (!fs.existsSync(file)) return;
        const text = fs.readFileSync(file, 'utf8');
        if (text.includes('\uFFFD')) offenders.push(path.relative(projectRoot, file));
    });

    assert.deepStrictEqual(offenders, [], `Found replacement characters in user-facing release files: ${offenders.join(', ')}`);
}

function scanBlankScoreAuditPlacement() {
    const sourcePath = path.join(projectRoot, 'src', 'index.html');
    const source = fs.readFileSync(sourcePath, 'utf8');
    const analysisStart = source.indexOf('<div id="analysis"');
    const analysisEnd = source.indexOf('<div id="high-score"', analysisStart);
    assert.ok(analysisStart >= 0 && analysisEnd > analysisStart, 'analysis section boundaries should be discoverable');

    const analysisSection = source.slice(analysisStart, analysisEnd);
    assert.ok(!analysisSection.includes('blank-score-audit-panel'), 'two-rate analysis should not contain the old blank score audit panel');
    assert.ok(!analysisSection.includes('空分/0分学科核对清单'), 'two-rate analysis should not render the blank score audit checklist');
    assert.ok(source.includes('<div id="blank-score-audit"'), 'independent blank score audit module should remain available');
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

    const listen = (targetPort) => new Promise((resolve, reject) => {
        const onError = (error) => {
            server.off('listening', onListening);
            reject(error);
        };
        const onListening = () => {
            server.off('error', onError);
            resolve();
        };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(targetPort, '127.0.0.1');
    });

    try {
        await listen(port);
    } catch (error) {
        if (hasExplicitPort || error?.code !== 'EADDRINUSE') throw error;
        await listen(0);
    }

    port = server.address().port;

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
            authState: String(document.body?.dataset?.authState || '').trim(),
            authUser: window.AuthState?.getCurrentUser?.()?.username || '',
            edgeToken: !!window.EdgeGateway?.getToken?.(),
            sessionUser: !!sessionStorage.getItem('CURRENT_USER'),
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
        await page.click('#login-submit-button');
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
            if (window.EdgeGateway && typeof window.EdgeGateway.setToken === 'function') {
                window.EdgeGateway.setToken('ui-copy-integrity-session');
                window.EdgeGateway.verify = async () => ({ ok: true, token: 'ui-copy-integrity-session' });
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
    const result = await page.evaluate(() => {
        const renderParentView = window.Auth?.renderParentView;
        return {
            ok: typeof renderParentView === 'function',
            source: typeof renderParentView === 'function' ? String(renderParentView) : ''
        };
    });

    assert.strictEqual(result.ok, true, 'parent view renderer should remain available');
    const parentSources = [
        path.join(projectRoot, 'src', 'index.html'),
        path.join(projectRoot, 'public', 'assets', 'js', 'auth-login-runtime.js'),
        path.join(projectRoot, 'public', 'assets', 'js', 'report-render-runtime.js'),
        path.join(projectRoot, 'public', 'assets', 'js', 'report-insight-runtime.js')
    ].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    const leakedTokens = removedAnalysisText.filter((token) => parentSources.includes(token) || result.source.includes(token));
    assert.deepStrictEqual(leakedTokens, [], `parent view sources leaked removed analysis copy: ${leakedTokens.join(', ')}`);
    assertContainsNoForbidden('parent view sources', parentSources);
}

async function main() {
    scanConflictMarkers();
    scanReplacementCharacters();
    scanBlankScoreAuditPlacement();

    const server = await startServer();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    page.on('dialog', async (dialog) => {
        await dialog.dismiss().catch(() => { });
    });

    try {
        console.error('[ui-copy] login:start');
        await login(page);
        console.error('[ui-copy] login:done');
        await verifyAnalysisModuleRemoved(page);
        console.error('[ui-copy] shell-copy:done');
        await verifyParentAnalysisCopyRemoved(page);
        console.error('[ui-copy] parent-copy:done');
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
