const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const distDir = path.resolve(__dirname, '../dist');
const port = Number(process.env.APP_DOWNLOAD_SMOKE_PORT || 4189);

const testReleaseManifest = {
    schemaVersion: 1,
    releases: [{
        schemaVersion: 1,
        releaseTag: 'beta-20260620-cb785f5',
        channel: 'beta',
        sourceSha: 'cb785f5'.padEnd(40, '0'),
        generatedAt: '2026-06-20T08:00:00.000Z',
        expiresAt: '2026-09-18T08:00:00.000Z',
        releaseUrl: 'https://github.com/hka123321/school-system/releases/tag/beta-20260620-cb785f5',
        platforms: {
            windows: { platform: 'windows', version: '2026.6.20-beta.42', buildNumber: '42', status: 'ready', signed: 'unsigned', minimumOs: 'Windows 10 22H2', architectures: ['x64'], assetName: 'school-system-windows-beta.exe', assetUrl: 'https://example.test/school-system-windows-beta.exe', bytes: 90000000, sha256: 'a'.repeat(64), notes: ['内部测试版本'], buildUrl: 'https://github.com/hka123321/school-system/actions/runs/42' },
            android: { platform: 'android', version: '2026.6.20-beta.42', buildNumber: '42', status: 'ready', signed: 'test-signed', minimumOs: 'Android 10', architectures: ['arm64-v8a'], assetName: 'school-system-android-beta.apk', assetUrl: 'https://example.test/school-system-android-beta.apk', bytes: 24000000, sha256: 'b'.repeat(64), notes: ['测试签名安装包'], buildUrl: 'https://github.com/hka123321/school-system/actions/runs/42' },
            ios: { platform: 'ios', version: '2026.6.20-beta.42', buildNumber: '42', status: 'awaiting-signing', signed: 'unsigned', minimumOs: 'iOS 16', architectures: ['arm64'], assetName: '', assetUrl: '', bytes: 0, sha256: '', notes: ['等待 Apple 签名'], buildUrl: 'https://github.com/hka123321/school-system/actions/runs/42' }
        }
    }, {
        schemaVersion: 1,
        releaseTag: 'stable-windows-only',
        channel: 'stable',
        generatedAt: '2026-06-21T08:00:00.000Z',
        releaseUrl: 'https://example.test/releases/stable-windows-only',
        platforms: {
            windows: { platform: 'windows', version: '3.0.0-win', buildNumber: '51', status: 'ready', signed: 'signed', minimumOs: 'Windows 10 22H2', architectures: ['x64'], assetName: 'windows-only.exe', assetUrl: 'https://example.test/windows-only.exe', bytes: 51000000, sha256: 'c'.repeat(64), notes: [], buildUrl: '' }
        }
    }, {
        schemaVersion: 1,
        releaseTag: 'beta-android-only',
        channel: 'beta',
        generatedAt: '2026-06-19T08:00:00.000Z',
        releaseUrl: 'https://example.test/releases/beta-android-only',
        platforms: {
            android: { platform: 'android', version: '3.0.0-android', buildNumber: '49', status: 'ready', signed: 'test-signed', minimumOs: 'Android 10', architectures: ['arm64-v8a'], assetName: 'android-only.apk', assetUrl: 'https://example.test/android-only.apk', bytes: 19000000, sha256: 'd'.repeat(64), notes: [], buildUrl: '' }
        }
    }]
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
        if (String(req.url || '').split('?')[0] === '/releases/release-manifest.json') {
            const body = Buffer.from(JSON.stringify(testReleaseManifest));
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': body.length });
            res.end(body);
            return;
        }
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
    await page.click('#login-submit-button');
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
        if (typeof window.renderAppDownloadCenter === 'function') window.renderAppDownloadCenter('windows');
    });
    await page.waitForFunction(() => {
        const section = document.getElementById('app-download-center');
        return !!section && section.classList.contains('active') && getComputedStyle(section).display !== 'none';
    }, null, { timeout: 30000 });
    await page.waitForSelector('[data-app-download-platform="windows"]', { state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => document.getElementById('app-release-focused-detail')?.textContent?.includes('2026.6.20-beta.42'), null, { timeout: 30000 });
}

async function main() {
    const server = await startServer();
    const baseUrl = `http://127.0.0.1:${port}/`;
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    await page.route('https://api.github.com/**', (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]'
    }));
    try {
        await login(page, baseUrl);
        await openDownloadCenter(page);
        await page.locator('[data-app-download-platform="ios"]').click();
        const iosDetail = await page.locator('#app-release-focused-detail').textContent();
        assert.match(iosDetail || '', /等待 Apple 签名/);
        assert.equal(await page.locator('#app-download-primary-link').getAttribute('aria-disabled'), 'true');

        await page.locator('[data-app-download-platform="android"]').click();
        const androidDetail = await page.locator('#app-release-focused-detail').textContent();
        assert.match(androidDetail || '', /测试签名/);
        assert.equal(await page.locator('[data-app-download-platform="android"]').getAttribute('aria-selected'), 'true');

        await page.locator('[data-open-release-history]').click();
        assert.equal(await page.locator('#app-release-history-drawer').isVisible(), true);

        await page.locator('#app-release-history-platform').selectOption('');
        const allPlatformRows = page.locator('#app-release-history-list .app-release-history-item');
        const windowsOnlyRow = allPlatformRows.filter({ hasText: 'stable-windows-only' });
        const androidOnlyRow = allPlatformRows.filter({ hasText: 'beta-android-only' });
        const iosPendingRow = allPlatformRows.filter({ hasText: 'beta-20260620-cb785f5' }).filter({ hasText: 'iOS' });
        assert.equal(await windowsOnlyRow.count(), 1, 'all-platform history should render the Windows-only asset once');
        assert.match(await windowsOnlyRow.textContent() || '', /Windows.*3\.0\.0-win.*安装包已就绪/s);
        assert.equal(await windowsOnlyRow.locator('a[href]').getAttribute('href'), 'https://example.test/windows-only.exe');
        assert.equal(await androidOnlyRow.count(), 1, 'all-platform history should render the Android-only asset once');
        assert.match(await androidOnlyRow.textContent() || '', /Android.*3\.0\.0-android.*安装包已就绪/s);
        assert.equal(await androidOnlyRow.locator('a[href]').getAttribute('href'), 'https://example.test/android-only.apk');
        assert.equal(await iosPendingRow.count(), 1, 'all-platform history should retain unavailable-to-download platform status rows');
        assert.equal(await iosPendingRow.locator('[aria-disabled="true"]').count(), 1, 'unverified or pending assets should stay disabled');
        assert.match(await allPlatformRows.first().textContent() || '', /stable-windows-only/, 'history releases should remain newest-first');

        await page.locator('#app-release-history-platform').selectOption('android');
        const androidHistory = await page.locator('#app-release-history-list').textContent() || '';
        assert.match(androidHistory, /beta-20260620-cb785f5/);
        assert.match(androidHistory, /beta-android-only/);
        assert.doesNotMatch(androidHistory, /stable-windows-only/, 'specific-platform filtering should omit releases missing that platform');
        assert.equal(await page.locator('#app-release-history-list .app-release-history-item').count(), 2);

        await page.locator('#app-release-history-platform').selectOption('');
        await page.locator('#app-release-history-channel').selectOption('stable');
        assert.match(await page.locator('#app-release-history-list').textContent() || '', /stable-windows-only/);
        assert.doesNotMatch(await page.locator('#app-release-history-list').textContent() || '', /beta-android-only/, 'channel filtering should remain intact');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#app-release-history-drawer').isHidden(), true);

        console.log(JSON.stringify({
            ok: true,
            selectedPlatform: 'android',
            iosAwaitingSigning: true,
            historyDrawer: true
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
