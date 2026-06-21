const assert = require('assert');
const { chromium } = require('playwright');

const viewports = [
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
        const shell = document.querySelector('.login-clean-shell');
        const card = document.querySelector('.login-clean-card');
        const submit = document.querySelector('#login-submit-button');
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
            shell: rect(shell),
            stage: rect(stage),
            card: rect(card),
            submit: rect(submit),
            stageStyle: style(stage),
            cardStyle: style(card),
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

            if (viewport.mode === 'tablet') {
                const intersectionWidth = Math.min(state.stage.right, state.card.right) - Math.max(state.stage.left, state.card.left);
                const intersectionHeight = Math.min(state.stage.bottom, state.card.bottom) - Math.max(state.stage.top, state.card.top);
                assert.ok(intersectionWidth <= 0 || intersectionHeight <= 0, `${label}: tablet stage and card must not overlap`);
                assert.ok(Math.abs(state.stage.top - state.shell.top) <= 1 && Math.abs(state.stage.bottom - state.shell.bottom) <= 1, `${label}: tablet stage must stretch to the shell edges`);
                assert.ok(Math.abs(state.card.top - state.shell.top) <= 1 && Math.abs(state.card.bottom - state.shell.bottom) <= 1, `${label}: tablet card must stretch to the shell edges`);
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
