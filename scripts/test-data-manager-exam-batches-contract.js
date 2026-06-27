const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'app.js'), 'utf8');
const tabRuntime = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'data-manager-tab-runtime.js'), 'utf8');

assert.ok(html.includes('id="tab-data-exams"'), 'data manager must expose the exam batch tab');
assert.ok(html.includes("DataManager.switchTab('exams')"), 'exam batch tab must switch to the exams view');
assert.ok(html.includes('id="dm-exams-area"'), 'exam batch area must exist');
assert.ok(html.includes('id="dm-exams-tbody"'), 'exam batch table body must exist');
assert.ok(html.includes('DataManager.selectRecognizedExamBatches()'), 'exam batch view must provide bulk recognition');
assert.ok(html.includes('DataManager.deleteSelectedExamBatches()'), 'exam batch view must provide bulk deletion');

[
    'examBatchSelection: new Set()',
    "if (tab === 'exams') tabId = 'tab-data-exams';",
    "examsArea.style.display = tab === 'exams' ? 'flex' : 'none'",
    'renderExamBatches: function ()',
    'selectRecognizedExamBatches: function ()',
    'deleteSelectedExamBatches: async function ()',
    'removeExamBatchLocal: async function (examId)',
    "saveCloudData({ mode: 'workspace'"
].forEach((needle) => {
    assert.ok(app.includes(needle), `app.js missing exam batch contract: ${needle}`);
});

assert.ok(tabRuntime.includes("manager.currentTab === 'exams'"), 'tab runtime must dispatch the exams tab');
assert.ok(tabRuntime.includes('manager.renderExamBatches'), 'tab runtime must call renderExamBatches');

console.log('data-manager exam batches contract passed');
