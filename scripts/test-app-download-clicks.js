const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const distDir = path.resolve(__dirname, '../dist');
const port = Number(process.env.APP_DOWNLOAD_SMOKE_PORT || 4189);

const expectedDownloads = {
    windows: {
        hrefPart: '/downloads/smartedu-windows-latest.zip',
        fileName: 'smartedu-windows-latest.zip',
        minBytes: 500
    },
    android: {
        hrefPart: '/downloads/school-system-android-v1.0.apk',
        fileName: 'school-system-android-v1.0.apk',
        minBytes: 1024 * 1024
    }
};

const mimeTypes = {
    '.apk': 'application/vnd.android.package-archive',
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
    '.woff2': 'font/woff2',
    '.zip': 'application/zip'
};

function resolveFilePath(urlPath) {
    const decodedPath = decodeURIComponent(String(urlPath || '/').split('?')[0]);
    const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\\/])+/, '');
    return path.join(distDir, safePath);
}

function startServer() {
    if (!fs.existsSync(distDir)) throw new Error(`dist not found: ${distDir}`);
    const server = http.createServer((req, res) => {
        const filePath = resolveFilePath(req.url || '/');
        if (!filePath.startsWith(distDir)) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }
        fs.stat(filePath, (statError, stats) => {
            if (statError) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
                return;
            }
            const targetFile = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
            fs.readFile(targetFile, (readError, data) => {
                if (readError) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('Not Found');
                    return;
                }
                const contentType = mimeTypes[path.extname(targetFile).toLowerCase()] || 'application/octet-stream';
                const headers = {
                    'Content-Type': contentType,
                    'Content-Length': data.length
                };
                if (targetFile.includes(`${path.sep}downloads${path.sep}`)) {
                    headers['Content-Disposition'] = `attachment; filename="${path.basename(targetFile)}"`;
                }
                res.writeHead(200, headers);
                if (req.method === 'HEAD') {
                    res.end();
                } else {
                    res.end(data);
                }
            });
        });
    });
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve(server));
    });
}

async function login(page, baseUrl) {
    await page.goto(baseUrl, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForFunction(() => document.getElementById('login-overlay') || document.getElementById('app'), null, { timeout: 90000 });
    await page.waitForTimeout(2000);
    const appVisible = await page.evaluate(() => {
        const app = document.getElementById('app');
        const overlay = document.getElementById('login-overlay');
        return !!app && getComputedStyle(app).display !== 'none' && (!overlay || getComputedStyle(overlay).display === 'none');
    });
    if (appVisible) return;
    await page.evaluate(() => {
        if (window.Auth && typeof window.Auth.openLoginPortalModal === 'function') {
            window.Auth.openLoginPortalModal('school');
        }
    }).catch(() => {});
    await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });
    await page.fill('#login-user', process.env.SMOKE_USER || 'admin');
    await page.fill('#login-pass', process.env.SMOKE_PASS || 'admin123');
    await page.click('button[onclick="window.Auth?.login()"]');
    await page.waitForFunction(() => {
        const app = document.getElementById('app');
        const overlay = document.getElementById('login-overlay');
        return !!app && getComputedStyle(app).display !== 'none' && (!overlay || getComputedStyle(overlay).display === 'none');
    }, null, { timeout: 90000 });
    await enterCohortIfNeeded(page);
}

async function enterCohortIfNeeded(page) {
    const candidate = process.env.SMOKE_COHORT_YEAR || '2022';
    const maskVisible = await page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        return !!mask && getComputedStyle(mask).display !== 'none';
    }).catch(() => false);
    if (!maskVisible) return;
    const input = page.locator('#entry-cohort-year');
    if (await input.count()) await input.fill(candidate);
    await page.evaluate(async () => {
        let cohortManagerReady = false;
        try {
            cohortManagerReady = typeof CohortManager !== 'undefined'
                && !!CohortManager
                && typeof CohortManager.addCohort === 'function';
        } catch (_) {
            cohortManagerReady = false;
        }
        if (typeof window.enterCohortFromMask === 'function' && cohortManagerReady) {
            await window.enterCohortFromMask();
            return;
        }
        const button = document.querySelector('button[onclick="enterCohortFromMask()"]');
        if (button) button.click();
    });
    await page.waitForFunction(() => {
        const mask = document.getElementById('mode-mask');
        const app = document.getElementById('app');
        const maskHidden = !mask || getComputedStyle(mask).display === 'none';
        const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        return maskHidden && appVisible;
    }, null, { timeout: 90000 });
}

async function openDownloadCenter(page) {
    await page.evaluate(async () => {
        if (typeof window.ensureLazySectionLoaded === 'function') window.ensureLazySectionLoaded('app-download-center');
        if (typeof window.switchTab === 'function') window.switchTab('app-download-center');
        if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
            await window.SystemRuntimeLoader.load('app-download');
        }
        if (typeof window.renderAppDownloadCenter === 'function') window.renderAppDownloadCenter('desktop');
    });
    await page.waitForFunction(() => {
        const section = document.getElementById('app-download-center');
        return !!section && section.classList.contains('active') && getComputedStyle(section).display !== 'none';
    }, null, { timeout: 30000 });
    await page.waitForSelector('#app-download-primary-link[href]', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('#app-download-secondary-link[href]', { state: 'visible', timeout: 30000 });
}

async function verifyLinkResponse(page, selector, expected) {
    const href = await page.getAttribute(selector, 'href');
    if (!href || !href.includes(expected.hrefPart)) {
        throw new Error(`${selector} href mismatch: ${href}`);
    }
    const response = await page.evaluate(async (url) => {
        const result = await fetch(url, { cache: 'no-store' });
        const buffer = await result.arrayBuffer();
        return {
            ok: result.ok,
            status: result.status,
            type: result.headers.get('content-type') || '',
            bytes: buffer.byteLength
        };
    }, href);
    if (!response.ok || response.bytes < expected.minBytes) {
        throw new Error(`${selector} fetch failed: ${JSON.stringify(response)}`);
    }
    return { href, ...response };
}

async function clickAndVerifyDownload(page, selector, expected) {
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        page.click(selector)
    ]);
    const suggested = download.suggestedFilename();
    const filePath = await download.path();
    const bytes = fs.statSync(filePath).size;
    if (suggested !== expected.fileName) {
        throw new Error(`${selector} downloaded ${suggested}, expected ${expected.fileName}`);
    }
    if (bytes < expected.minBytes) {
        throw new Error(`${selector} downloaded too few bytes: ${bytes}`);
    }
    return { suggested, bytes };
}

async function main() {
    const server = await startServer();
    const baseUrl = `http://127.0.0.1:${port}/`;
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    try {
        await login(page, baseUrl);
        await openDownloadCenter(page);
        const primaryResponse = await verifyLinkResponse(page, '#app-download-primary-link', expectedDownloads.windows);
        const secondaryResponse = await verifyLinkResponse(page, '#app-download-secondary-link', expectedDownloads.android);
        const primaryDownload = await clickAndVerifyDownload(page, '#app-download-primary-link', expectedDownloads.windows);
        const secondaryDownload = await clickAndVerifyDownload(page, '#app-download-secondary-link', expectedDownloads.android);
        console.log(JSON.stringify({
            ok: true,
            primaryResponse,
            secondaryResponse,
            primaryDownload,
            secondaryDownload
        }, null, 2));
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
