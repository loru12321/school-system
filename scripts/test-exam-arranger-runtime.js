const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => {
    const target = path.join(root, relativePath);
    return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
};

const loader = read('public/assets/js/runtime-loader-runtime.js');
const freshman = read('public/assets/js/freshman-exam-runtime.js');
const runtime = read('public/assets/js/exam-arranger-runtime.js');

assert.ok(runtime, 'exam-arranger-runtime.js should exist');
[
    "bootEntry('xlsx-js-style-vendor'",
    "bootEntry('jszip-vendor'",
    "bootEntry('exam-arranger-core'",
    "bootEntry('freshman-exam'",
    "bootEntry('exam-arranger'"
].reduce((previousIndex, token) => {
    const index = loader.indexOf(token);
    assert.ok(index >= 0, `runtime loader should include ${token}`);
    assert.ok(index > previousIndex, `${token} should load after the preceding exam arranger dependency`);
    return index;
}, -1);

assert.ok(runtime.includes('[data-exam-action]'), 'controller should use scoped declarative actions');
assert.ok(runtime.includes('showDirectoryPicker'), 'controller should support directory selection');
assert.ok(runtime.includes('examFileInput'), 'directory selection should fall back to the file input');
assert.ok(!/\bfetch\s*\(/.test(runtime), 'exam arranger must not upload raw score files');
assert.ok(!/cloudSync|syncToCloud|CloudDataService/.test(runtime), 'exam arranger must not join cloud synchronization');
assert.ok(!/let\s+EXAM_(?:DATA|ROOMS)\s*=/.test(freshman), 'freshman runtime must not own exam arranger state');
assert.ok(!freshman.includes('function EXAM_loadData'), 'freshman runtime must not keep legacy exam handlers');

const storage = new Map();
let fallbackClicks = 0;
const listeners = {};
const fileInput = { click: () => { fallbackClicks += 1; }, files: [] };
const document = {
    readyState: 'loading',
    addEventListener: (name, handler) => { listeners[name] = handler; },
    getElementById: (id) => id === 'examFileInput' ? fileInput : null,
    querySelector: () => null,
    querySelectorAll: () => []
};
const context = {
    console,
    Date,
    Math,
    JSON,
    String,
    Number,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    Error,
    Promise,
    Uint8Array,
    Blob,
    document,
    localStorage: {
        getItem: (key) => storage.has(key) ? storage.get(key) : null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key)
    },
    CURRENT_COHORT_ID: '2024',
    CURRENT_EXAM_ID: 'midterm',
    XLSX: { read: () => ({ SheetNames: [], Sheets: {} }) },
    ExamArrangerCore: {
        createWorkspace: (meta) => ({ schemaVersion: 1, meta, students: [], rooms: [], issues: [], settings: {}, assignments: [], step: 1, dirty: false }),
        inspectWorkbook: () => ({ name: 'fixture.xlsx', sheets: [] }),
        mergeImportSources: () => ({ students: [], exclusions: [], rooms: [], issues: [], summary: {} }),
        validateWorkspace: () => ({ valid: true, blockingIssues: [], warnings: [], summary: {} }),
        deriveBalancedRooms: () => [],
        assignStudents: () => ({ ok: true, assignments: [], rooms: [], summary: {}, warnings: [], generationSignature: 'fixture' })
    }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(runtime, context, { filename: 'exam-arranger-runtime.js' });

const controller = context.ExamArranger;
assert.ok(controller, 'ExamArranger facade should be exposed');
[
    'init', 'loadFiles', 'loadDirectory', 'setStep', 'toggleExcluded', 'generate',
    'saveDraft', 'restoreDraft', 'clearWorkspace'
].forEach((method) => assert.strictEqual(typeof controller[method], 'function', `${method} should be a function`));

controller.init();
assert.strictEqual(storage.size, 0, 'initialization must not persist sensitive data automatically');
controller.saveDraft();
assert.strictEqual(storage.size, 1, 'saveDraft should persist only after the explicit call');
const savedKey = Array.from(storage.keys())[0];
assert.ok(savedKey.includes('2024') && savedKey.includes('midterm'), 'draft key should be scoped by cohort and exam');
assert.strictEqual(JSON.parse(storage.get(savedKey)).schemaVersion, 1);

controller.clearWorkspace();
assert.strictEqual(storage.size, 0, 'clearWorkspace should remove the saved draft');
assert.strictEqual(controller.getWorkspace().students.length, 0);

Promise.resolve(controller.loadDirectory()).then((result) => {
    assert.strictEqual(result, 'fallback');
    assert.strictEqual(fallbackClicks, 1, 'unsupported directory picker should open the file input');
    assert.ok(listeners.click, 'controller should bind delegated click handling');
    console.log(JSON.stringify({ ok: true, contract: 'exam-arranger-runtime-local-controller' }, null, 2));
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
