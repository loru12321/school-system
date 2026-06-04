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
const TARGET_ROLES = ['teacher', 'class_teacher', 'grade_director', 'director'];
const ROLE_EXPECTATIONS = {
    teacher: {
        dataManagement: false,
        studentOverview: false,
        studentDetails: true,
        splitTeacherModules: true,
        studentDetailsAdminTools: false,
        oldTeachingModules: false,
        multiPeriodCompare: false
    },
    class_teacher: {
        dataManagement: false,
        studentOverview: false,
        studentDetails: true,
        splitTeacherModules: true,
        studentDetailsAdminTools: false,
        oldTeachingModules: false,
        multiPeriodCompare: false
    },
    grade_director: {
        dataManagement: false,
        studentOverview: true,
        studentDetails: true,
        splitTeacherModules: true,
        studentDetailsAdminTools: true,
        oldTeachingModules: false,
        multiPeriodCompare: true
    },
    director: {
        dataManagement: true,
        studentOverview: true,
        studentDetails: true,
        splitTeacherModules: true,
        studentDetailsAdminTools: true,
        oldTeachingModules: false,
        multiPeriodCompare: true
    }
};

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
        const roleConfig = {
            teacher: {
                username: 'smoke-teacher',
                name: '白明新',
                teacher_name: '白明新',
                school: '银山实验学校',
                class: '',
                subject: '政治'
            },
            class_teacher: {
                username: 'smoke-class_teacher',
                name: '孙少章',
                teacher_name: '孙少章',
                school: '银山实验学校',
                class: '9.4',
                class_name: '9.4',
                subject: '物理'
            },
            grade_director: {
                username: 'smoke-grade_director',
                name: '级部主任烟测',
                teacher_name: '级部主任烟测',
                school: '银山实验学校',
                class: '9',
                class_name: '9',
                grade_name: '9年级'
            },
            director: {
                username: 'smoke-director',
                name: '教务主任烟测',
                teacher_name: '教务主任烟测',
                school: '银山实验学校',
                class: '',
                class_name: ''
            }
        };
        const config = roleConfig[targetRole] || roleConfig.teacher;
        const user = {
            username: config.username,
            name: config.name,
            teacher_name: config.teacher_name || config.name,
            role: targetRole,
            roles: [targetRole],
            school: config.school,
            class: config.class || '',
            class_name: config.class_name || config.class || '',
            grade_name: config.grade_name || '',
            subject: config.subject || '',
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
            if (!document.getElementById(id)?.classList.contains('active')
                && typeof window.switchTab === 'function') {
                window.switchTab(id);
            }
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
            const visibleStudentDetailsRestrictedContent = id === 'student-details'
                && /学生明细使用建议|生成班级成绩长图|生成家长查分包|学生多期对比|查看云端对比|保存到云端/.test(visibleText);
            let studentDetailsClassFilterWorks = true;
            let studentDetailsClassFilterDebug = null;
            if (id === 'student-details') {
                const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : (window.CURRENT_USER || null);
                const role = String(user?.role || '');
                if (role === 'teacher' || role === 'class_teacher' || role === 'grade_director' || role === 'director') {
                    const classSelect = document.getElementById('studentClassSelect');
                    const classOptions = Array.from(classSelect?.options || []).map(option => option.value).filter(Boolean);
                    const targetClass = classOptions[classOptions.length - 1] || '';
                    if (classSelect && targetClass) {
                        classSelect.value = targetClass;
                        if (typeof window.renderStudentDetails === 'function') window.renderStudentDetails(true);
                        const visibleClasses = Array.from(document.querySelectorAll('#studentDetailTable tbody tr'))
                            .slice(0, 20)
                            .map(row => String(row.children?.[1]?.textContent || '').trim())
                            .filter(Boolean);
                        const normalize = typeof window.normalizeClass === 'function'
                            ? window.normalizeClass
                            : (value) => String(value || '').trim();
                        const normalizedTarget = normalize(targetClass);
                        studentDetailsClassFilterWorks = visibleClasses.length === 0
                            || visibleClasses.every(value => {
                                const normalizedValue = normalize(value);
                                return normalizedValue === normalizedTarget;
                            });
                        studentDetailsClassFilterDebug = {
                            targetClass,
                            classOptions,
                            visibleClasses: Array.from(new Set(visibleClasses)).sort()
                        };
                    }
                }
            }
            return {
                id,
                active: !!active && active.classList.contains('active'),
                visibleForbiddenPanelCount: forbiddenPanels.length,
                visibleTextHasMultiPeriodCompare: /多期对比/.test(visibleText),
                visibleOldTeachingContent: oldTeachingText,
                visibleStudentDetailsRestrictedContent,
                studentDetailsClassFilterWorks,
                studentDetailsClassFilterDebug
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
    const expected = ROLE_EXPECTATIONS[role] || ROLE_EXPECTATIONS.teacher;
    const hasDataManagement = !!(summary.visibleDataManagement || summary.canAccessDataManagement);
    if (hasDataManagement !== expected.dataManagement) {
        failures.push(`${role}: data management visibility expected ${expected.dataManagement}, got ${hasDataManagement}`);
    }
    if (!expected.oldTeachingModules && summary.visibleOldTeachingModules.length) {
        failures.push(`${role}: still exposes old teaching modules ${summary.visibleOldTeachingModules.join(', ')}`);
    }
    if (!!summary.canAccessStudentOverview !== expected.studentOverview) {
        failures.push(`${role}: student overview access expected ${expected.studentOverview}, got ${summary.canAccessStudentOverview}`);
    }
    if (!!summary.canAccessStudentDetails !== expected.studentDetails) {
        failures.push(`${role}: student details access expected ${expected.studentDetails}, got ${summary.canAccessStudentDetails}`);
    }
    if (!!summary.canAccessSplitTeacherModules !== expected.splitTeacherModules) {
        failures.push(`${role}: split teacher module access expected ${expected.splitTeacherModules}, got ${summary.canAccessSplitTeacherModules}`);
    }
    moduleResults.forEach(result => {
        if (!expected.multiPeriodCompare && (result.visibleForbiddenPanelCount > 0 || result.visibleTextHasMultiPeriodCompare)) {
            failures.push(`${role}/${result.id}: visible multi-period comparison remains`);
        }
        if (/^teacher-/.test(result.id) && result.visibleOldTeachingContent) {
            failures.push(`${role}/${result.id}: old teaching-management content remains`);
        }
        if (result.id === 'student-details' && !!result.visibleStudentDetailsRestrictedContent !== expected.studentDetailsAdminTools) {
            failures.push(`${role}/${result.id}: student detail admin tools expected ${expected.studentDetailsAdminTools}, got ${result.visibleStudentDetailsRestrictedContent}`);
        }
        if (result.studentDetailsClassFilterWorks === false) {
            failures.push(`${role}/${result.id}: class selector does not filter rows ${JSON.stringify(result.studentDetailsClassFilterDebug)}`);
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
