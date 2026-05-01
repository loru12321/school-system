try {
    require.resolve('playwright');
} catch (error) {
    console.error('playwright is required for smoke-layout-regression. Run: npm install --no-save playwright');
    process.exit(1);
}

const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const user = process.env.SMOKE_USER || 'admin';
const pass = process.env.SMOKE_PASS || 'admin123';
const cohortYear = process.env.SMOKE_COHORT_YEAR || '2022';

function isIgnorableMessage(text) {
    return /favicon|GitHub release API|fetch releases|cloudflareinsights|beacon\.min\.js|Failed to load resource/i.test(String(text || ''));
}

async function loginAndEnterCohort(page) {
    await page.goto(url, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForSelector('#login-user', { state: 'visible', timeout: 90000 });
    await page.fill('#login-user', user);
    await page.fill('#login-pass', pass);
    await page.click('#login-submit-button');

    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const mask = document.getElementById('mode-mask');
        const app = document.getElementById('app');
        return (!overlay || getComputedStyle(overlay).display === 'none')
            && (!!mask || !!app || document.body?.dataset?.authState === 'logged_in');
    }, null, { timeout: 90000 });

    await page.waitForFunction(() => typeof window.enterCohortFromMask === 'function', null, { timeout: 30000 }).catch(() => {});
    const maskVisible = await page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        return !!mask && getComputedStyle(mask).display !== 'none';
    });
    if (maskVisible) {
        const input = page.locator('#entry-cohort-year');
        if (await input.count()) await input.fill(cohortYear);
        await page.evaluate(async () => {
            if (typeof window.enterCohortFromMask === 'function') {
                await window.enterCohortFromMask();
                return;
            }
            document.querySelector('button[onclick="enterCohortFromMask()"]')?.click();
        });
    }

    await page.waitForFunction(() => {
        const cohortId = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        return !!cohortId && rawDataLen > 0;
    }, null, { timeout: 90000 });
}

async function openUploadModule(page) {
    await page.waitForFunction(() => typeof window.switchTab === 'function', null, { timeout: 60000 });
    await page.evaluate(() => window.switchTab('upload'));
    await page.waitForFunction(() => {
        const upload = document.getElementById('upload');
        return !!upload && upload.classList.contains('active') && getComputedStyle(upload).display !== 'none';
    }, null, { timeout: 30000 });
    await page.waitForTimeout(500);
}

async function ensureMobileShell(page) {
    await page.evaluate(() => window.ensureMobileManagerRuntimeLoaded?.()).catch(() => {});
    await page.evaluate(() => window.MobileQueryUI?.refresh?.()).catch(() => {});
    await page.waitForFunction(() => {
        const shell = document.getElementById('apk-mobile-shell');
        return document.body?.dataset?.mobileQuery === 'true'
            && document.body?.dataset?.mobileArchitecture === 'apk-v2'
            && !!shell
            && shell.getAttribute('aria-hidden') === 'false';
    }, null, { timeout: 30000 });
}

async function inspectUploadLayout(page, mode) {
    await page.locator('#uploadBox').scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(250);
    return page.evaluate((layoutMode) => {
        function selectorFor(el) {
            if (!el) return '';
            if (el.id) return `#${el.id}`;
            const classes = Array.from(el.classList || []).slice(0, 3).join('.');
            const tag = String(el.tagName || '').toLowerCase();
            return classes ? `${tag}.${classes}` : tag;
        }

        function isVisible(el) {
            if (!el) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 1 && rect.height > 1;
        }

        function rectOf(selector) {
            const el = document.querySelector(selector);
            if (!isVisible(el)) return null;
            const rect = el.getBoundingClientRect();
            return {
                selector,
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                top: Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }

        function intersects(a, b) {
            if (!a || !b) return false;
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        }

        const viewportWidth = Math.round(document.documentElement.clientWidth || window.innerWidth || 0);
        const appMain = document.querySelector('.app-main');
        const scrollRoot = layoutMode === 'mobile' && appMain ? appMain : document.scrollingElement;
        const rootOverflow = scrollRoot ? Math.round(scrollRoot.scrollWidth - scrollRoot.clientWidth) : 0;
        const documentOverflow = Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const activeUpload = document.querySelector('#upload.section.active');
        const scope = activeUpload || document.getElementById('upload') || document.body;

        const overflowIssues = Array.from(scope.querySelectorAll('*'))
            .filter(isVisible)
            .map((el) => {
                const rect = el.getBoundingClientRect();
                const style = getComputedStyle(el);
                return {
                    selector: selectorFor(el),
                    width: Math.round(rect.width),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    position: style.position,
                    tag: String(el.tagName || '').toLowerCase()
                };
            })
            .filter((item) => {
                if (item.position === 'fixed') return false;
                if (item.right <= viewportWidth + 2 && item.left >= -2) return false;
                if (/table|thead|tbody|tr|th|td/.test(item.tag)) return false;
                return true;
            })
            .slice(0, 12);

        const uploadBox = document.querySelector('#uploadBox');
        const uploadBoxRect = rectOf('#uploadBox');
        let uploadBoxHitOk = false;
        let uploadBoxHitSelector = '';
        if (uploadBoxRect && uploadBox) {
            const x = Math.min(Math.max(uploadBoxRect.left + uploadBoxRect.width / 2, 1), window.innerWidth - 2);
            const y = Math.min(Math.max(uploadBoxRect.top + uploadBoxRect.height / 2, 1), window.innerHeight - 2);
            const hit = document.elementFromPoint(x, y);
            uploadBoxHitSelector = selectorFor(hit);
            uploadBoxHitOk = hit === uploadBox || uploadBox.contains(hit);
        }

        const tabsRect = rectOf('#apk-mobile-shell .apk-shell-tabs');
        const topShellRect = rectOf('#apk-mobile-shell .apk-shell-top');
        const topbarRect = rectOf('#apk-mobile-shell .apk-shell-topbar');

        return {
            mode: layoutMode,
            viewportWidth,
            bodyMobileQuery: String(document.body?.dataset?.mobileQuery || ''),
            bodyMobileArchitecture: String(document.body?.dataset?.mobileArchitecture || ''),
            uploadActive: !!activeUpload,
            rootOverflow,
            documentOverflow,
            overflowIssues,
            requiredPieces: {
                summary: !!document.querySelector('#upload-summary-strip'),
                notice: !!document.querySelector('#upload-flow-notice'),
                workbench: !!document.querySelector('#upload .upload-workbench-grid'),
                intake: !!document.querySelector('#upload .upload-intake-grid'),
                ops: !!document.querySelector('#upload .upload-ops-grid'),
                uploadBox: !!document.querySelector('#uploadBox')
            },
            uploadBoxRect,
            uploadBoxHitOk,
            uploadBoxHitSelector,
            tabsRect,
            topShellRect,
            topbarRect,
            tabsOverlapUploadBox: intersects(tabsRect, uploadBoxRect),
            topShellOverlapUploadBox: intersects(topShellRect, uploadBoxRect),
            topbarOverlapUploadBox: intersects(topbarRect, uploadBoxRect)
        };
    }, mode);
}

function assertUploadLayout(state) {
    assert.ok(state.uploadActive, `${state.mode} upload section is not active`);
    for (const [key, exists] of Object.entries(state.requiredPieces)) {
        assert.ok(exists, `${state.mode} upload required piece missing: ${key}`);
    }
    assert.ok(Math.abs(state.rootOverflow) <= 2, `${state.mode} root has horizontal overflow: ${state.rootOverflow}px`);
    assert.ok(state.documentOverflow <= 2, `${state.mode} document has horizontal overflow: ${state.documentOverflow}px`);
    assert.deepStrictEqual(state.overflowIssues, [], `${state.mode} visible upload overflow issues: ${JSON.stringify(state.overflowIssues)}`);
    assert.ok(state.uploadBoxRect && state.uploadBoxRect.width > 120 && state.uploadBoxRect.height > 80, `${state.mode} upload box is not a usable target`);
    assert.ok(state.uploadBoxHitOk, `${state.mode} upload box is visually covered at center by ${state.uploadBoxHitSelector || 'unknown element'}`);
    if (state.mode === 'mobile') {
        assert.strictEqual(state.bodyMobileQuery, 'true', 'mobile viewport was not detected');
        assert.strictEqual(state.bodyMobileArchitecture, 'apk-v2', 'mobile shell architecture did not activate');
        assert.strictEqual(state.tabsOverlapUploadBox, false, 'mobile bottom tabs overlap upload box');
        assert.strictEqual(state.topShellOverlapUploadBox, false, 'mobile top shell overlaps upload box');
        assert.strictEqual(state.topbarOverlapUploadBox, false, 'mobile top shell overlaps upload box');
    }
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const messages = [];
    const makePage = async (options) => {
        const page = await browser.newPage(options);
        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warning') messages.push(`${msg.type()}: ${msg.text()}`);
        });
        page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
        return page;
    };

    const desktopPage = await makePage({ viewport: { width: 1440, height: 1000 } });
    await loginAndEnterCohort(desktopPage);
    await openUploadModule(desktopPage);
    const desktopState = await inspectUploadLayout(desktopPage, 'desktop');
    assertUploadLayout(desktopState);
    await desktopPage.close();

    const mobilePage = await makePage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3
    });
    await loginAndEnterCohort(mobilePage);
    await ensureMobileShell(mobilePage);
    await openUploadModule(mobilePage);
    const mobileState = await inspectUploadLayout(mobilePage, 'mobile');
    assertUploadLayout(mobileState);
    await mobilePage.close();

    await browser.close();

    const actionableMessages = messages.filter((message) => !isIgnorableMessage(message));
    assert.ok(
        !actionableMessages.some((message) => /ReferenceError|TypeError|pageerror/i.test(message)),
        `layout smoke console errors found: ${actionableMessages.join('\n')}`
    );

    console.log(JSON.stringify({ desktopState, mobileState, actionableMessages }, null, 2));
}

main().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
