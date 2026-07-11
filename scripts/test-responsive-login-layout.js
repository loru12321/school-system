const assert = require('assert');
const { chromium } = require('playwright');

const viewports = [
    { width: 1440, height: 1000, mode: 'desktop' },
    { width: 1366, height: 768, mode: 'desktop' },
    { width: 1024, height: 768, mode: 'tablet-stacked' },
    { width: 834, height: 1194, mode: 'tablet-stacked' },
    { width: 960, height: 900, mode: 'tablet' },
    { width: 769, height: 900, mode: 'tablet' },
    { width: 768, height: 900, mode: 'phone' },
    { width: 430, height: 932, mode: 'phone' },
    { width: 390, height: 844, mode: 'phone' },
    { width: 390, height: 560, mode: 'phone-short' }
];

async function inspectLayout(page, viewport) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(page.url(), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-overlay .login-clean-card', { state: 'visible' });

    return page.evaluate(() => {
        const stage = document.querySelector('.login-clean-stage');
        const card = document.querySelector('.login-clean-card');
        const overlay = document.querySelector('#login-overlay');
        const shell = document.querySelector('.login-clean-shell');
        const submit = document.querySelector('#login-submit-button');
        const styleboard = document.querySelector('.login-styleboard');
        const app = document.querySelector('#app');
        const rect = node => {
            const value = node.getBoundingClientRect();
            return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
        };
        const style = node => {
            const value = getComputedStyle(node);
            return {
                position: value.position,
                transform: value.transform,
                marginTop: Number.parseFloat(value.marginTop) || 0
            };
        };
        return {
            overlay: rect(overlay),
            stage: rect(stage),
            card: rect(card),
            shell: rect(shell),
            submit: rect(submit),
            styleboard: styleboard ? rect(styleboard) : null,
            stageStyle: style(stage),
            cardStyle: style(card),
            styleboardStyle: styleboard ? {
                display: getComputedStyle(styleboard).display,
                visibility: getComputedStyle(styleboard).visibility,
                opacity: getComputedStyle(styleboard).opacity
            } : null,
            appDisplay: app ? getComputedStyle(app).display : null,
            cardOwnsTopLayer: (() => {
                const cardRect = card.getBoundingClientRect();
                const topNode = document.elementFromPoint(
                    Math.min(window.innerWidth - 1, Math.max(0, cardRect.left + cardRect.width / 2)),
                    Math.min(window.innerHeight - 1, Math.max(0, cardRect.top + Math.min(cardRect.height / 2, 120)))
                );
                return Boolean(topNode && overlay.contains(topNode));
            })(),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            documentScrollOverflow: document.documentElement.scrollHeight - window.innerHeight,
            overlayScrollOverflow: overlay.scrollHeight - overlay.clientHeight,
            cardScrollOverflow: card.scrollHeight - card.clientHeight,
            horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
        };
    });
}

async function main() {
    const { createServer } = await import('vite');
    const server = await createServer({
        logLevel: 'error',
        server: { host: '127.0.0.1', port: 0, open: false }
    });
    await server.listen();
    const origin = server.resolvedUrls.local[0];
    const browser = await chromium.launch({ headless: true });

    try {
        const page = await browser.newPage();
        if (process.env.RESPONSIVE_LOGIN_DISABLE_FINAL_CSS === '1') {
            await page.route('**/responsive-login-final.css*', route => route.abort());
        }
        await page.goto(origin, { waitUntil: 'domcontentloaded' });

        for (const viewport of viewports) {
            const state = await inspectLayout(page, viewport);
            const label = `${viewport.width}x${viewport.height}`;
            for (const [name, styles] of [['stage', state.stageStyle], ['card', state.cardStyle]]) {
                assert.ok(!['absolute', 'fixed'].includes(styles.position), `${label}: ${name} must remain in document flow`);
                assert.strictEqual(styles.transform, 'none', `${label}: ${name} must not be transformed`);
                assert.ok(styles.marginTop >= 0, `${label}: ${name} must not have a negative top margin`);
            }
            assert.ok(state.horizontalOverflow <= 1, `${label}: document must not overflow horizontally`);
            assert.ok(state.overlay.left >= -1, `${label}: overlay must start inside the viewport`);
            assert.ok(state.overlay.top >= -1, `${label}: overlay must start inside the viewport`);
            assert.ok(state.overlay.right <= state.viewportWidth + 1, `${label}: overlay must not exceed viewport width`);
            assert.ok(state.overlay.bottom <= state.viewportHeight + 1, `${label}: overlay must not exceed viewport height`);
            assert.ok(state.shell.top >= -1, `${label}: login shell must start inside the viewport`);
            assert.ok(state.shell.left >= -1, `${label}: login shell must not start before viewport`);
            assert.ok(state.shell.right <= state.viewportWidth + 1, `${label}: login shell must stay inside viewport`);
            assert.ok(state.card.left >= state.shell.left - 1, `${label}: login card must stay inside shell`);
            assert.ok(state.card.right <= state.shell.right + 1, `${label}: login card must not overflow shell`);
            assert.strictEqual(state.appDisplay, 'none', `${label}: logged-out workbench must stay hidden behind the login overlay`);
            assert.ok(state.cardOwnsTopLayer, `${label}: login card must remain the top interactive layer`);

            if (viewport.mode !== 'desktop') {
                if (state.styleboardStyle) {
                    assert.strictEqual(state.styleboardStyle.display, 'none', `${label}: decorative styleboard must be hidden on tablet and phone`);
                    assert.strictEqual(state.styleboardStyle.visibility, 'hidden', `${label}: decorative styleboard must not be visible on tablet and phone`);
                    assert.ok(state.styleboard.right - state.styleboard.left <= 1, `${label}: decorative styleboard must not reserve width`);
                    assert.ok(state.styleboard.bottom - state.styleboard.top <= 1, `${label}: decorative styleboard must not reserve height`);
                }
            }

            if (viewport.mode === 'desktop') {
                assert.ok(Math.abs(state.shell.width - state.viewportWidth) <= 1, `${label}: desktop shell must fill the viewport width`);
                assert.ok(Math.abs(state.shell.height - state.viewportHeight) <= 1, `${label}: desktop shell must fill the viewport height`);
                assert.ok(state.documentScrollOverflow <= 1, `${label}: desktop document must not need vertical scrolling`);
                assert.ok(state.overlayScrollOverflow <= 1, `${label}: desktop login overlay must not need vertical scrolling`);
                assert.ok(state.cardScrollOverflow <= 1, `${label}: desktop login card must not need internal scrolling`);
                assert.ok(state.card.bottom <= state.shell.bottom + 1, `${label}: desktop login card must not overflow shell vertically`);
            } else if (viewport.mode === 'tablet') {
                const intersectionWidth = Math.min(state.stage.right, state.card.right) - Math.max(state.stage.left, state.card.left);
                const intersectionHeight = Math.min(state.stage.bottom, state.card.bottom) - Math.max(state.stage.top, state.card.top);
                assert.ok(intersectionWidth <= 0 || intersectionHeight <= 0, `${label}: tablet stage and card must not overlap`);
            } else if (viewport.mode === 'tablet-stacked') {
                assert.ok(state.card.top >= state.stage.bottom - 1, `${label}: tablet card must follow the compact brand band`);
            } else {
                assert.ok(state.card.top >= state.stage.bottom - 1, `${label}: phone card must follow the stage`);
            }

            await page.locator('#login-submit-button').scrollIntoViewIfNeeded();
            const submit = await page.locator('#login-submit-button').boundingBox();
            assert.ok(submit && submit.y >= -1 && submit.y + submit.height <= viewport.height + 1, `${label}: submit must be reachable by scrolling (${JSON.stringify(submit)})`);
        }
        console.log(`Responsive login layout passed at ${viewports.length} viewport sizes.`);
    } finally {
        await browser.close();
        await server.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
