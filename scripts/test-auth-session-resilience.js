const assert = require('assert');
const { chromium } = require('playwright');

async function main() {
    const { createServer } = await import('vite');
    const server = await createServer({
        logLevel: 'error',
        server: { host: '127.0.0.1', port: 0, open: false }
    });
    await server.listen();

    const origin = server.resolvedUrls.local[0];
    const browser = await chromium.launch({ headless: true });
    let verifyRequests = 0;

    try {
        const page = await browser.newPage();
        const gatewayPatterns = [
            '**/api/edu-gateway',
            '**/api/gateway',
            '**/functions/v1/edu-gateway-v2'
        ];
        for (const pattern of gatewayPatterns) {
            await page.route(pattern, async route => {
                let action = '';
                try {
                    action = JSON.parse(route.request().postData() || '{}').action || '';
                } catch (_) { }
                if (action === 'session.verify') {
                    verifyRequests += 1;
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: '{}'
                    });
                    return;
                }
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ok: true })
                });
            });
        }

        await page.goto(origin, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => typeof window.loadAppModules === 'function');
        await page.evaluate(() => window.loadAppModules());
        await page.waitForFunction(() => window.Auth
            && window.AuthState
            && window.EdgeGateway
            && window.GatewaySessionRuntime
            && typeof window.Auth.init === 'function'
            && typeof window.AuthState.setCurrentUser === 'function');

        await page.evaluate(() => {
            const sameOriginGateway = `${location.origin}/api/edu-gateway`;
            EdgeGateway.getGatewayCandidates = () => [sameOriginGateway];
            window.getExplicitCohortSelection = () => '';
            window.getRememberedUserCohort = () => '';
            if (window.BootCohortLifecycle) {
                window.BootCohortLifecycle.getLoginCohortYears = () => [];
            }

            const user = AuthState.setCurrentUser({
                name: 'admin',
                username: 'admin',
                role: 'admin',
                roles: ['admin'],
                school: '银山实验学校',
                class_name: '',
                local_only: true,
                must_change_password: false
            });
            Auth.currentUser = user;
            EdgeGateway.setToken('test-session-token');
        });

        assert.strictEqual(
            await page.evaluate(() => GatewaySessionRuntime.isAuthoritativeSessionFailure(
                new Error('EDGE_GATEWAY_INVALID_RESPONSE')
            )),
            false,
            'a malformed gateway response must remain a transient failure'
        );

        await page.evaluate(() => Auth.init());
        await page.waitForTimeout(350);

        const state = await page.evaluate(() => ({
            bootAuth: document.documentElement.dataset.bootAuth,
            bodyAuth: document.body.dataset.authState,
            appHidden: document.getElementById('app').classList.contains('hidden'),
            appDisplay: getComputedStyle(document.getElementById('app')).display,
            loginDisplay: getComputedStyle(document.getElementById('login-overlay')).display,
            currentUser: AuthState.getCurrentUser()?.username || AuthState.getCurrentUser()?.name || '',
            token: EdgeGateway.getToken()
        }));

        assert.ok(verifyRequests > 0, 'Auth.init must verify an active gateway session');
        assert.strictEqual(state.bootAuth, 'logged_in');
        assert.strictEqual(state.bodyAuth, 'logged_in');
        assert.strictEqual(state.appHidden, false);
        assert.notStrictEqual(state.appDisplay, 'none');
        assert.strictEqual(state.loginDisplay, 'none');
        assert.strictEqual(state.currentUser, 'admin');
        assert.strictEqual(state.token, 'test-session-token');
        console.log('Auth session resilience test passed.');
    } finally {
        await browser.close();
        await server.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
