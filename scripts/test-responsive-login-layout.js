const assert = require('assert');
const { chromium } = require('playwright');

const viewports = [
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
        const shell = document.querySelector('.login-clean-shell');
        const submit = document.querySelector('#login-submit-button');
        const styleboard = document.querySelector('.login-styleboard');
        const rect = node => {
            const value = node.getBoundingClientRect();
            return { left: value.left, right: value.right, top: value.top, bottom: value.bottom };
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
            stage: rect(stage),
            card: rect(card),
            shell: rect(shell),
            submit: rect(submit),
            styleboard: rect(styleboard),
            stageStyle: style(stage),
            cardStyle: style(card),
            styleboardStyle: {
                display: getComputedStyle(styleboard).display,
                visibility: getComputedStyle(styleboard).visibility,
                opacity: getComputedStyle(styleboard).opacity
            },
            viewportWidth: window.innerWidth,
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
            assert.ok(state.shell.top >= -1, `${label}: login shell must start inside the viewport`);
            assert.strictEqual(state.styleboardStyle.display, 'none', `${label}: decorative styleboard must be hidden on tablet and phone`);
            assert.strictEqual(state.styleboardStyle.visibility, 'hidden', `${label}: decorative styleboard must not be visible on tablet and phone`);
            assert.ok(state.styleboard.right - state.styleboard.left <= 1, `${label}: decorative styleboard must not reserve width`);
            assert.ok(state.styleboard.bottom - state.styleboard.top <= 1, `${label}: decorative styleboard must not reserve height`);

            if (viewport.mode === 'tablet') {
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
