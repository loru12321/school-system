const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'src/index.html'), 'utf8');
const cssPath = path.join(rootDir, 'src/assets/css/cloud-archive-visibility.css');
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const createDataCloudRuntime = require(path.join(rootDir, 'public/assets/js/data-cloud-runtime.js'));

function createElement() {
    const listeners = {};
    return {
        dataset: {},
        style: {},
        innerHTML: '',
        textContent: '',
        addEventListener(type, listener) {
            listeners[type] = listener;
        },
        dispatch(type, target) {
            if (listeners[type]) listeners[type]({ target });
        },
        querySelectorAll() {
            return [];
        }
    };
}

async function run() {
    assert.match(html, /cloud-archive-visibility\.css[^"']*["']/);

    const scrollOwner = html.match(/<div[^>]*class="[^"]*dm-cloud-table-scroll[^"]*"[^>]*>[\s\S]*?<table[^>]*id="dm-cloud-table"/);
    assert.ok(scrollOwner, 'cloud table should be inside its dedicated scroll owner');
    assert.match(scrollOwner[0], /tabindex="0"/);
    assert.match(scrollOwner[0], /aria-label="[^"]+"/);
    assert.match(html, /class="[^"]*dm-cloud-table-shell[^"]*"[^>]*data-cloud-state="loading"/);
    assert.match(html, /id="dm-cloud-summary"[^>]*aria-live="polite"/);
    assert.match(html, /<tbody\s+id="dm-cloud-tbody"/);

    assert.match(css, /\.dm-cloud-table-shell\s*\{[^}]*min-height:\s*2(?:1\d|2\d|3\d)px/s);
    assert.match(css, /\.dm-cloud-table-scroll\s*\{[^}]*min-height:\s*1(?:7\d|8\d|9\d)px[^}]*overflow:\s*auto/s);
    assert.match(css, /max-height:\s*min\(52dvh,\s*560px\)/);
    assert.match(css, /#dm-cloud-table\s*\{[^}]*min-width:\s*7[4-9]\dpx/s);
    assert.match(css, /position:\s*sticky/);

    const tbody = createElement();
    const shell = createElement();
    const summary = createElement();
    const runtime = createDataCloudRuntime({ console });

    const expectedStates = ['loading', 'empty', 'filtered-empty', 'error'];
    for (const state of expectedStates) {
        runtime.renderCloudTableState(tbody, shell, state, {
            message: state === 'error' ? '<unsafe>' : undefined,
            summaryEl: summary
        });
        assert.strictEqual(shell.dataset.cloudState, state);
        assert.match(tbody.innerHTML, /dm-cloud-state-cell/);
    }
    assert.ok(!tbody.innerHTML.includes('<unsafe>'), 'state messages must be HTML escaped');
    assert.ok(tbody.innerHTML.includes('&lt;unsafe&gt;'));
    assert.match(tbody.innerHTML, /data-cloud-retry/);

    const readyMarkup = '<tr><td>record</td></tr>';
    tbody.innerHTML = readyMarkup;
    runtime.renderCloudTableState(tbody, shell, 'ready');
    assert.strictEqual(shell.dataset.cloudState, 'ready');
    assert.strictEqual(tbody.innerHTML, readyMarkup, 'ready state must preserve rendered records');

    let retryCount = 0;
    runtime.renderCloudBackups = async (manager) => {
        retryCount += 1;
        assert.strictEqual(manager.marker, 'manager');
    };
    await runtime.retryCloudBackups({ marker: 'manager' });
    assert.strictEqual(retryCount, 1);

    const delegatedBody = createElement();
    const delegatedShell = createElement();
    const delegatedSummary = createElement();
    const filters = { checked: true };
    const delegatedRuntime = createDataCloudRuntime({
        console: { error() {} },
        CloudApi: {},
        sessionStorage: { getItem() { return null; } },
        localStorage: { getItem() { return null; } },
        CloudDataService: {
            async selectSystemDataRecords() {
                throw new Error('network <offline>');
            }
        },
        document: {
            querySelector(selector) {
                return selector === '#dm-cloud-table tbody' ? delegatedBody : null;
            },
            querySelectorAll() {
                return [];
            },
            getElementById(id) {
                if (id === 'dm-cloud-table-shell') return delegatedShell;
                if (id === 'dm-cloud-summary') return delegatedSummary;
                if (id === 'cloud-filter-current' || id === 'cloud-filter-snapshots') return filters;
                return null;
            }
        }
    });
    const delegatedManager = { cloudSelection: new Set() };
    await delegatedRuntime.renderCloudBackups(delegatedManager);
    assert.strictEqual(delegatedShell.dataset.cloudState, 'error');
    assert.ok(delegatedSummary.textContent.includes('加载失败'));
    assert.ok(!delegatedBody.innerHTML.includes('<offline>'));

    let delegatedRetries = 0;
    delegatedRuntime.renderCloudBackups = async () => { delegatedRetries += 1; };
    delegatedShell.dispatch('click', { closest() { return {}; } });
    await Promise.resolve();
    assert.strictEqual(delegatedRetries, 1, 'retry button should use one delegated shell listener');

    console.log('cloud archive visibility tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
