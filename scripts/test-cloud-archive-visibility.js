const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'src/index.html'), 'utf8');
const applicationCss = fs.readFileSync(path.join(rootDir, 'src/assets/css/application.css'), 'utf8');
const cssPath = path.join(rootDir, 'src/assets/css/cloud-archive-visibility.css');
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const createDataCloudRuntime = require(path.join(rootDir, 'public/assets/js/data-cloud-runtime.js'));

function getRuleDeclarations(source, selector) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
    assert.ok(match, `missing CSS rule for ${selector}`);
    return match[1].replace(/\s+/g, ' ');
}

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
    assert.ok(
        applicationCss.includes('@import "./cloud-archive-visibility.css";'),
        'application.css should include the cloud archive visibility layer'
    );

    const scrollOwner = html.match(/<div[^>]*class="[^"]*dm-cloud-table-scroll[^"]*"[^>]*>[\s\S]*?<table[^>]*id="dm-cloud-table"/);
    assert.ok(scrollOwner, 'cloud table should be inside its dedicated scroll owner');
    assert.match(scrollOwner[0], /tabindex="0"/);
    assert.match(scrollOwner[0], /aria-label="[^"]+"/);
    assert.match(html, /class="[^"]*dm-cloud-table-shell[^"]*"[^>]*data-cloud-state="loading"/);
    assert.match(html, /id="dm-cloud-summary"[^>]*aria-live="polite"/);
    assert.match(html, /<tbody\s+id="dm-cloud-tbody"/);

    const shellRule = getRuleDeclarations(css, '.dm-cloud-table-shell');
    assert.match(shellRule, /flex:\s*0 0 auto/);
    assert.match(shellRule, /min-height:\s*300px/);
    assert.match(shellRule, /height:\s*clamp\(300px,\s*40dvh,\s*520px\)/);
    assert.match(shellRule, /min-width:\s*0/);

    const scrollRule = getRuleDeclarations(css, '.dm-cloud-table-scroll');
    assert.match(scrollRule, /height:\s*100%/);
    assert.match(scrollRule, /min-height:\s*300px/);
    assert.match(scrollRule, /overflow:\s*auto/);
    assert.match(scrollRule, /overscroll-behavior:\s*contain/);
    assert.match(css, /#dm-cloud-area\s*\{[^}]*overflow-y:\s*auto\s*!important;/s);
    assert.match(css, /#dm-cloud-table tbody td\s*\{[^}]*height:\s*74px;/s);
    assert.match(css, /@media\s*\(min-height:\s*\d+px\)[\s\S]*\.dm-cloud-table-shell\s*\{[^}]*min-height:\s*340px/);
    assert.match(css, /#dm-cloud-table\s*\{[^}]*min-width:\s*7[4-9]\dpx/s);
    assert.match(css, /position:\s*sticky/);
    const validateContent = packageJson.scripts.validate + ' ' + (packageJson.scripts['validate:data'] || '');
    assert.ok(validateContent.includes('test:cloud-archive-visibility'), 'validate should invoke test:cloud-archive-visibility');
    assert.match(packageJson.scripts['check:p1'], /npm run test:cloud-archive-visibility/);

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

    const listBody = createElement();
    const listShell = createElement();
    const listSummary = createElement();
    const listRuntime = createDataCloudRuntime({
        console,
        CloudApi: {},
        sessionStorage: { getItem() { return null; } },
        localStorage: { getItem() { return null; } },
        CloudDataService: {
            async selectSystemDataRecords(options) {
                if (options.kind === 'exam') return { data: [{ key: '2022级_9年级_2026_下学期_二模', size_bytes: 100, updated_at: '2026-07-10' }], error: null };
                if (options.kind === 'workspace') return { data: [{ key: 'cohort::2022', size_bytes: 80, updated_at: '2026-07-10' }], error: null };
                if (options.kind === 'teacher_map') return { data: [{ key: 'TEACHERS_2022级_2025-2026_上学期_9年级', size_bytes: 60, updated_at: '2026-03-12' }], error: null };
                if (options.keyLike === 'BACKUP_%') return { data: [{ key: 'BACKUP_cohort::2022_pre_split', size_bytes: 50, updated_at: '2026-06-27' }], error: null };
                return { data: [], error: null };
            },
            async readSystemDataRecord(key) {
                return {
                    data: {
                        key,
                        content: JSON.stringify({ map: { '9.1_语文': '张老师', '9.1_数学': '王老师' } })
                    },
                    error: null
                };
            }
        },
        getExamMetaFromUI() { return { year: '2025-2026', grade: '9' }; },
        document: {
            querySelector(selector) { return selector === '#dm-cloud-table tbody' ? listBody : null; },
            querySelectorAll() { return []; },
            getElementById(id) {
                if (id === 'dm-cloud-table-shell') return listShell;
                if (id === 'dm-cloud-summary') return listSummary;
                if (id === 'cloud-filter-current') return { checked: false };
                if (id === 'cloud-filter-snapshots') return { checked: false };
                return null;
            }
        }
    });
    const listManager = {
        cloudSelection: new Set(),
        getCloudRecordKind(key) {
            if (key.startsWith('TEACHERS_')) return 'teacher';
            if (key.startsWith('BACKUP_')) return 'backup';
            if (key.startsWith('cohort::')) return 'cohort';
            return 'snapshot';
        },
        isCloudRecordInCurrentWorkspace() { return true; },
        isCloudWorkspaceSnapshotKey(key) { return !key.startsWith('TEACHERS_') && !key.startsWith('BACKUP_'); }
    };
    await listRuntime.renderCloudBackups(listManager);
    assert.match(listBody.innerHTML, /2022级/);
    assert.doesNotMatch(listBody.innerHTML, /教师任课表/);

    await listRuntime.setCloudRecordCategory(listManager, 'teacher');
    assert.match(listBody.innerHTML, /教师任课表/);
    assert.match(listBody.innerHTML, /加载并编辑/);

    const teacherPreview = listRuntime.buildTeacherPreview({
        map: {
            '9.1_语文': '张老师',
            '9.2_语文': '李老师',
            '9.1_数学': '王老师'
        }
    });
    assert.strictEqual(teacherPreview.subjectCount, 2);
    assert.strictEqual(teacherPreview.teacherCount, 3);
    assert.strictEqual(teacherPreview.recordCount, 3);
    assert.match(teacherPreview.text, /语文：张老师、李老师|语文：李老师、张老师/);
    assert.match(teacherPreview.text, /数学：王老师/);

    await listRuntime.setCloudRecordCategory(listManager, 'workspace');
    assert.match(listBody.innerHTML, /届别工作区/);
    assert.match(listBody.innerHTML, /当前九年级 · 含指标生参数、教师配置/);
    assert.doesNotMatch(listBody.innerHTML, /含指标参数、教师配置/);

    await listRuntime.setCloudRecordCategory(listManager, 'backup');
    assert.match(listBody.innerHTML, /拆分前历史备份/);

    console.log('cloud archive visibility tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
