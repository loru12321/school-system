const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const runtimeSource = fs.readFileSync(path.join(root, 'public/assets/js/login-entry-runtime.js'), 'utf8');
const bootSource = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');
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
        value: '2026'
    };
    const group = {
        style: {},
        setAttribute() {}
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
        'login-cohort-select': select
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
        setInterval: window.setInterval,
        setTimeout: window.setTimeout,
        window
    };
    vm.runInNewContext(runtimeSource, context, { filename: 'login-entry-runtime.js' });
    assert.strictEqual(typeof onReady, 'function', 'login runtime should register its boot callback');
    onReady();
    return { select, window };
}

const spring = runLoginRuntime('2026-05-25T00:00:00Z');
assert.strictEqual(spring.select.value, '2022', 'before September, current grade 9 should map to the prior academic year cohort');
assert.ok(spring.select.innerHTML.includes('2022届'), 'grade 9 cohort should be included in selectable years');
spring.select.value = '2024';
spring.window.polishLoginEntryShell();
assert.strictEqual(spring.select.value, '2024', 'refreshing the login shell should preserve a manual cohort selection');

const autumn = runLoginRuntime('2026-09-01T00:00:00Z');
assert.strictEqual(autumn.select.value, '2023', 'from September, grade 9 should roll forward by one cohort');

assert.ok(bootSource.includes('getBootCurrentGrade9CohortYear'), 'boot login path should calculate the grade 9 cohort');
assert.ok(bootSource.includes("select.dataset.cohortInitialized = '1'"), 'boot login path should preserve manual selection after initialization');
assert.ok(htmlSource.includes('<option value="2022" selected>2022届</option>'), 'static login fallback should default to the current grade 9 cohort for this release');

console.log('login cohort runtime tests passed');
