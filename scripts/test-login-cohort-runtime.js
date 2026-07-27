const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const runtimeSource = fs.readFileSync(path.join(root, 'public/assets/js/login-entry-runtime.js'), 'utf8');
const bootSource = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');
const authLoginSource = fs.readFileSync(path.join(root, 'public/assets/js/auth-login-runtime.js'), 'utf8');
const cohortMetaSource = fs.readFileSync(path.join(root, 'public/assets/js/cohort-exam-meta-runtime.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');

function createFixedDate(isoDate) {
    return class FixedDate extends Date {
        constructor(...args) {
            super(...(args.length ? args : [isoDate]));
        }
    };
}

function runLoginRuntime(isoDate) {
    const select = {
        dataset: {},
        innerHTML: '',
        value: '2026',
        addEventListener() {}
    };
    const group = {
        style: {},
        setAttribute() {}
    };
    const graduatePanel = {
        hidden: true,
        style: {},
        classList: {
            add() {},
            remove() {},
            toggle() {}
        },
        setAttribute() {}
    };
    const graduateSelect = {
        dataset: {},
        innerHTML: '',
        value: ''
    };
    const passShell = {
        querySelector() {
            return { textContent: 'Password' };
        }
    };
    const elements = {
        'login-overlay': { dataset: {} },
        'login-form': {},
        'login-pass': { closest: () => passShell, placeholder: '' },
        'login-cohort-group': group,
        'login-cohort-select': select,
        'login-graduate-cohort-panel': graduatePanel,
        'login-graduate-cohort-select': graduateSelect,
        'login-graduate-cohort-button': { dataset: {}, addEventListener() {} },
        'login-graduate-cohort-helper': { textContent: '' },
        'login-portal-helper': { textContent: '' }
    };
    let onReady = null;
    const document = {
        readyState: 'loading',
        getElementById(id) {
            return elements[id] || null;
        },
        querySelectorAll() {
            return [];
        },
        addEventListener(type, handler) {
            if (type === 'DOMContentLoaded') onReady = handler;
        }
    };
    const window = {
        Auth: null,
        document,
        localStorage: {
            getItem() {
                return 'school';
            }
        },
        sessionStorage: {
            getItem() {
                return '';
            },
            setItem() {},
            removeItem() {}
        },
        setTimeout() {},
        setInterval() {}
    };
    const context = {
        Date: createFixedDate(isoDate),
        MutationObserver: class {
            observe() {}
        },
        document,
        localStorage: window.localStorage,
        sessionStorage: window.sessionStorage,
        setInterval: window.setInterval,
        setTimeout: window.setTimeout,
        window
    };
    vm.runInNewContext(runtimeSource, context, { filename: 'login-entry-runtime.js' });
    assert.strictEqual(typeof onReady, 'function', 'login runtime should register its boot callback');
    onReady();
    return { select, graduatePanel, graduateSelect, window };
}

const spring = runLoginRuntime('2026-05-25T00:00:00Z');
assert.strictEqual(spring.select.value, '2022', 'before September, current grade 9 should map to the prior academic year cohort');
assert.ok(spring.select.innerHTML.includes('2022届'), 'grade 9 cohort should be included in selectable years');
spring.select.value = '2024';
spring.window.polishLoginEntryShell();
assert.strictEqual(spring.select.value, '2024', 'refreshing the login shell should preserve a manual cohort selection');

const autumn = runLoginRuntime('2026-09-01T00:00:00Z');
assert.strictEqual(autumn.select.value, '2023', 'from September, grade 9 should roll forward by one cohort');
assert.ok(autumn.select.innerHTML.includes('2027届'), 'from September, the new incoming cohort should appear in active login choices');
assert.ok(!autumn.select.innerHTML.includes('2022届'), 'from September, the graduated cohort should leave active login choices');
assert.ok(autumn.graduateSelect.innerHTML.includes('2022届 · 已毕业'), 'from September, the graduated cohort should move to the graduate archive choices');
assert.strictEqual(
    autumn.window.BootCohortLifecycle.getLoginCohortYears(new Date('2026-09-01T00:00:00Z')).join('|'),
    '2023|2024|2025|2026|2027',
    'login lifecycle API should expose active cohorts after September rollover'
);

assert.ok(bootSource.includes('getBootCurrentGrade9CohortYear'), 'boot login path should calculate the grade 9 cohort');
assert.ok(bootSource.includes('getBootGraduatedCohortYears'), 'boot login path should calculate graduated cohorts separately');
assert.ok(bootSource.includes('LOGIN_GRADUATE_COHORT_TARGET_V1'), 'boot login path should preserve a selected graduate cohort through login');
assert.ok(bootSource.includes('getBootSelectedLoginCohortYear'), 'app and boot login paths should share the selected cohort resolver');
assert.ok(bootSource.includes("select.dataset.cohortInitialized = '1'"), 'boot login path should preserve manual selection after initialization');
assert.ok(htmlSource.includes('<option value="2022" selected>2022届</option>'), 'static login fallback should default to the current grade 9 cohort for this release');
assert.ok(htmlSource.includes('id="login-graduate-cohort-panel"'), 'login page should expose a dedicated graduate cohort panel');
assert.ok(
    authLoginSource.includes('let sessionCohortRestoreScheduled = false')
        && authLoginSource.includes("document.getElementById('login-cohort-select')?.value")
        && authLoginSource.includes("enterSessionCohort({ fastEnter: false, requireCloudData: true })")
        && authLoginSource.includes('!sessionCohortRestoreScheduled && !this.currentUser.local_only'),
    'an existing authenticated session with an empty workspace identity must re-enter the selected cohort instead of loading an unscoped cloud workspace'
);
assert.ok(
    authLoginSource.includes("typeof getRememberedUserCohort === 'function' && getRememberedUserCohort()"),
    'an authenticated session should restore the last user cohort when runtime cohort state is empty'
);
assert.ok(
    authLoginSource.includes('const requestedLoginCohort = String(')
        && authLoginSource.includes('requestedLoginCohort\n                || window.BootCohortLifecycle?.getSelectedLoginCohortYear?.()'),
    'the cohort selected when login starts must survive asynchronous credential validation'
);
assert.ok(
    authLoginSource.includes("window.BootCohortLifecycle?.getLoginCohortYears?.()?.[0]"),
    'a session without a saved preference should enter the current grade 9 cohort'
);
assert.ok(
    cohortMetaSource.includes('function getRememberedUserCohort()')
        && cohortMetaSource.includes('window.getRememberedUserCohort = getRememberedUserCohort;')
        && /if \(saved !== current\) \{\s*ensureCohortRegistered\(saved\);\s*CohortManager\.switchTo\(saved\);/.test(cohortMetaSource),
    'a saved cohort should remain restorable before the local cohort registry has loaded'
);
assert.ok(
    authLoginSource.includes("data.display_name || data.teacher_name || user || '用户'")
        && authLoginSource.includes("const accountDisplayName = String(")
        && authLoginSource.includes('title="退出登录 (${accountDisplayName})"'),
    'login and account actions must never render an undefined user display name'
);

const guardStart = appSource.indexOf('function beginCohortSwitchGuard(');
const guardEnd = appSource.indexOf('async function switchCohort(', guardStart);
assert.ok(guardStart >= 0 && guardEnd > guardStart, 'cohort switch request guard helpers should be present');
const guardContext = {
    window: {},
    Number,
    String,
    normalizeCompareCohortId(value) {
        return String(value || '').trim();
    }
};
vm.runInNewContext(appSource.slice(guardStart, guardEnd), guardContext, { filename: 'cohort-switch-guard.js' });
const firstSwitch = guardContext.beginCohortSwitchGuard('2022');
const secondSwitch = guardContext.beginCohortSwitchGuard('2023');
assert.strictEqual(guardContext.isCurrentCohortSwitch(firstSwitch), false,
    'a late result from an earlier cohort switch must be rejected');
assert.strictEqual(guardContext.isCurrentCohortSwitch(secondSwitch), true,
    'only the latest requested cohort switch may update workspace state');
assert.ok(
    /const readyGuard = beginCohortSwitchGuard\(targetCohortId \|\| cohortId\);[\s\S]*completeCohortSwitch\(readyGuard\);[\s\S]*if \(!options\.skipConfirm && !confirm[\s\S]*const switchGuard = beginCohortSwitchGuard\(targetCohortId \|\| cohortId\);[\s\S]*const isCurrentSwitch = \(\) => isCurrentCohortSwitch\(switchGuard\);[\s\S]*const cohortDbRuntime = await ensureCohortDbForSwitch\(cohortId\);\s*if \(!isCurrentSwitch\(\)\) return false;[\s\S]*const cachedData = options\.preloadedData \|\|(?: [A-Za-z_$][\w$]* \|\|)* await DB\.get\(cohortKey, \{ localOnly: true \}\);\s*if \(!isCurrentSwitch\(\)\) return false;/.test(appSource),
    'cohort switching must reject stale async runtime and cache responses before they mutate workspace state'
);
// The cold-login warm-up awaits a batched cloud read before `cachedData` is
// resolved, so it needs its own staleness check: without it a slow warm-up for
// an older cohort could still feed `bootstrapPreloaded` into a newer switch.
assert.ok(
    /await DB\.warmColdLoginCaches\(cohortKey\);[\s\S]{0,600}?if \(!isCurrentSwitch\(\)\) return false;\s*\}/.test(appSource),
    'the cold-login cache warm-up must re-check the switch guard before its payload is used'
);
assert.ok(
    /\.then\(\(syncRes\) => \{\s*if \(!isCurrentSwitch\(\)\) return false;[\s\S]*const restored = await hydrateFromExamArchive\(\);\s*if \(!isCurrentSwitch\(\)\) return false;/.test(appSource),
    'cloud archive responses must not restore an older cohort after a newer selection'
);

console.log('login cohort runtime tests passed');
