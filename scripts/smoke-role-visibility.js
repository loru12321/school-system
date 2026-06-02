try {
    require.resolve('playwright');
} catch (error) {
    console.error('playwright is required for smoke-role-visibility. Run: npm install --no-save playwright');
    process.exit(1);
}

const { chromium } = require('playwright');

const SMOKE_URL = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const SMOKE_USER = process.env.SMOKE_USER || 'admin';
const SMOKE_PASS = process.env.SMOKE_PASS || 'admin123';
const TARGET_ROLES = ['teacher', 'class_teacher'];

async function login(page) {
    await page.goto(SMOKE_URL, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        return !!overlay || !!app;
    }, undefined, { timeout: 90000 });
    await page.waitForTimeout(500);

    const alreadyLoggedIn = await page.evaluate(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        return (!overlay || getComputedStyle(overlay).display === 'none')
            && !!app
            && getComputedStyle(app).display !== 'none'
            && !app.classList.contains('hidden');
    });

    if (!alreadyLoggedIn) {
        const loginUser = page.locator('#login-user');
        if (!(await loginUser.isVisible().catch(() => false))) {
            await page.evaluate(() => {
                if (window.Auth && typeof window.Auth.openLoginPortalModal === 'function') {
                    window.Auth.openLoginPortalModal('school');
                }
            }).catch(() => { });
        }
        await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });
        await page.fill('#login-user', SMOKE_USER);
        await page.fill('#login-pass', SMOKE_PASS);
        await page.click('#login-submit-button');
    }

    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
        const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
        const maskVisible = !!mask && getComputedStyle(mask).display !== 'none';
        return overlayHidden && (appVisible || maskVisible || !!sessionStorage.getItem('CURRENT_USER'));
    }, undefined, { timeout: 90000 });

    await page.waitForTimeout(1000);

    await page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        if (!mask || getComputedStyle(mask).display === 'none') return;
        const input = document.getElementById('entry-cohort-year');
        if (input && !String(input.value || '').trim()) input.value = '2022';
        if (typeof window.enterCohortFromMask === 'function') window.enterCohortFromMask();
    });

    await page.waitForFunction(() => {
        const app = document.getElementById('app');
        const mask = document.getElementById('mode-mask');
        return !!app
            && getComputedStyle(app).display !== 'none'
            && !app.classList.contains('hidden')
            && (!mask || getComputedStyle(mask).display === 'none');
    }, undefined, { timeout: 60000 });
}

async function impersonateRole(page, role) {
    await page.evaluate((targetRole) => {
        const user = {
            username: `smoke-${targetRole}`,
            name: targetRole === 'teacher' ? '白明新' : '班主任烟测',
            role: targetRole,
            roles: [targetRole],
            school: '银山实验学校',
            class: '9.1',
            subject: targetRole === 'teacher' ? '政治' : '',
            local_only: true
        };
        if (window.AuthState && typeof window.AuthState.setCurrentUser === 'function') {
            window.AuthState.setCurrentUser(user);
        } else {
            sessionStorage.setItem('CURRENT_USER', JSON.stringify(user));
        }
        if (window.Auth) window.Auth.currentUser = user;
        window.CURRENT_USER = user;
        if (window.RoleManager && typeof window.RoleManager.applyRolesToBody === 'function') {
            window.RoleManager.applyRolesToBody(user);
        }
        if (window.Auth && typeof window.Auth.applyRoleView === 'function') {
            window.Auth.applyRoleView();
        }
        if (typeof window.renderNavigation === 'function') window.renderNavigation();
        if (typeof window.applyRoleAllowVisibility === 'function') window.applyRoleAllowVisibility(document);
    }, role);
    await page.waitForTimeout(500);
}

async function inspectRole(page, role) {
    await impersonateRole(page, role);

    const modulesToInspect = [
        'teacher-analysis',
        'teacher-detail-comparison',
        'teacher-pairing',
        'teacher-township-ranking',
        'progress-analysis',
        'student-details',
        'analysis',
        'high-score',
        'indicator',
        'bottom3'
    ];

    const moduleResults = [];
    for (const moduleId of modulesToInspect) {
        await page.evaluate((id) => {
            if (typeof window.switchModule === 'function') window.switchModule(id);
        }, moduleId);
        await page.waitForFunction((id) => {
            const active = document.getElementById(id);
            return !!active && active.classList.contains('active');
        }, moduleId, { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(300);
        moduleResults.push(await page.evaluate((id) => {
            const active = document.getElementById(id);
            function isVisible(node) {
                if (!node || node.nodeType !== 1) return false;
                if (node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
                const style = getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
                const rect = node.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            }
            function collectVisibleText(root) {
                if (!root || !isVisible(root)) return '';
                const texts = [];
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                    acceptNode(node) {
                        const text = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
                        if (!text) return NodeFilter.FILTER_REJECT;
                        const parent = node.parentElement;
                        if (!parent || !isVisible(parent)) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT;
                    }
                });
                while (walker.nextNode()) texts.push(String(walker.currentNode.nodeValue || '').replace(/\s+/g, ' ').trim());
                return texts.join(' ');
            }
            const visibleText = collectVisibleText(active);
            const forbiddenPanels = Array.from((active || document).querySelectorAll('.analysis-inline-panel, .town-submodule-compare-panel'))
                .filter(node => {
                    return isVisible(node);
                })
                .filter(node => /多期对比|2期|3期/.test(String(node.textContent || '')));
            const oldTeachingText = /教学管理概览|任务清单|问题预警|整改中心|版本中心|数据状态面板|统一入口|数据导入|教师任课/.test(visibleText);
            return {
                id,
                active: !!active && active.classList.contains('active'),
                visibleForbiddenPanelCount: forbiddenPanels.length,
                visibleTextHasMultiPeriodCompare: /多期对比/.test(visibleText),
                visibleOldTeachingContent: oldTeachingText
            };
        }, moduleId));
    }

    const summary = await page.evaluate((targetRole) => {
        const visibleNav = Array.from(document.querySelectorAll('[data-module-id], [data-module], .nav-item, .module-nav-item, button, a'))
            .filter(node => {
                const style = getComputedStyle(node);
                return style.display !== 'none' && style.visibility !== 'hidden' && !node.hidden;
            })
            .map(node => ({
                moduleId: node.dataset?.moduleId || node.dataset?.module || '',
                text: String(node.textContent || '').replace(/\s+/g, ' ').trim()
            }))
            .filter(item => item.moduleId || item.text);
        const canAccess = (id) => typeof window.canAccessModule === 'function' ? window.canAccessModule(id) : null;
        return {
            role: targetRole,
            visibleDataManagement: visibleNav.some(item => item.moduleId && /upload|data-quality|account|data-manager/.test(item.moduleId)),
            visibleOldTeachingModules: visibleNav
                .filter(item => /教学管理概览|任务清单|问题预警|整改中心|版本中心|数据状态面板|统一入口/.test(item.text))
                .map(item => item.text),
            canAccessDataManagement: canAccess('upload') || canAccess('data-quality') || canAccess('account-manager'),
            canAccessStudentOverview: canAccess('student-overview'),
            canAccessStudentDetails: canAccess('student-details'),
            canAccessSplitTeacherModules: ['teacher-analysis', 'teacher-detail-comparison', 'teacher-pairing', 'teacher-township-ranking']
                .every(id => canAccess(id) === true)
        };
    }, role);

    const failures = [];
    if (summary.visibleDataManagement || summary.canAccessDataManagement) {
        failures.push(`${role}: still exposes data management`);
    }
    if (summary.visibleOldTeachingModules.length) {
        failures.push(`${role}: still exposes old teaching modules ${summary.visibleOldTeachingModules.join(', ')}`);
    }
    if (summary.canAccessStudentOverview) {
        failures.push(`${role}: can access student overview; should only keep student details in learning diagnosis`);
    }
    if (!summary.canAccessStudentDetails) {
        failures.push(`${role}: cannot access student details`);
    }
    if (!summary.canAccessSplitTeacherModules) {
        failures.push(`${role}: cannot access all split teacher insight modules`);
    }
    moduleResults.forEach(result => {
        if (result.visibleForbiddenPanelCount > 0 || result.visibleTextHasMultiPeriodCompare) {
            failures.push(`${role}/${result.id}: visible multi-period comparison remains`);
        }
        if (/^teacher-/.test(result.id) && result.visibleOldTeachingContent) {
            failures.push(`${role}/${result.id}: old teaching-management content remains`);
        }
    });

    return { ...summary, moduleResults, failures };
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
        await login(page);
        const results = [];
        for (const role of TARGET_ROLES) {
            results.push(await inspectRole(page, role));
        }
        const failures = results.flatMap(result => result.failures);
        const output = { url: SMOKE_URL, ok: failures.length === 0, results, consoleErrors: consoleErrors.slice(-10) };
        console.log(JSON.stringify(output, null, 2));
        if (failures.length) process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
