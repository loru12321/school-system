const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const dataManagerCore = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'data-manager-core-runtime.js'), 'utf8');
const cohortExamMeta = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'cohort-exam-meta-runtime.js'), 'utf8');
const tabRuntime = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'data-manager-tab-runtime.js'), 'utf8');

assert.ok(html.includes('id="tab-data-exams"'), 'data manager must expose the exam batch tab');
assert.ok(html.includes("DataManager.switchTab('exams')"), 'exam batch tab must switch to the exams view');
assert.ok(html.includes('id="dm-exams-area"'), 'exam batch area must exist');
assert.ok(html.includes('id="dm-exams-tbody"'), 'exam batch table body must exist');
assert.ok(html.includes('DataManager.selectRecognizedExamBatches()'), 'exam batch view must provide bulk recognition');
assert.ok(html.includes('DataManager.deleteSelectedExamBatches()'), 'exam batch view must provide bulk deletion');
assert.ok(html.includes('DataManager.refreshExamBatchesFromCloud()'), 'exam batch view must expose cloud history hydration');
assert.ok(html.includes('height:clamp(420px, 52vh, 620px)'), 'exam batch table must have a readable viewport height');

[
    'examBatchSelection: new Set()',
    'examBatchHydratedCohorts: new Set()',
    "if (tab === 'exams') tabId = 'tab-data-exams';",
    "examsArea.style.display = tab === 'exams' ? 'flex' : 'none'",
    "const isExamBatchTab = this.currentTab === 'exams';",
    "if (isExamBatchTab) {",
    'this.ensureExamBatchesHydrated();',
    'ensureExamBatchesHydrated: function (options = {})',
    'refreshExamBatchesFromCloud: function ()',
    'CloudManager.fetchCohortExamsToLocal(cohortId',
    'latestOnly: !force',
    'maxFetch: force ? 0 : 1',
    'minCount: force ? 50 : 1',
    'getExamBatchDateSortTs: function (examId, meta = {})',
    'return b.examDateTs - a.examDateTs',
    'renderExamBatches: function ()',
    'DataManager.editExamSchoolMappings',
    'editExamSchoolMappings: async function (examId)',
    'selectRecognizedExamBatches: function ()',
    'deleteSelectedExamBatches: async function ()',
    'removeExamBatchLocal: async function (examId)',
    "saveCloudData({ mode: 'workspace'"
].forEach((needle) => {
    assert.ok(dataManagerCore.includes(needle), `data-manager-core-runtime.js missing exam batch contract: ${needle}`);
});

[
    'getUploadSchoolMappingConfirmation',
    'editExamSchoolNameMappings',
    'applyExamSchoolNameMappings',
    "sourceLabel: 'school-mapping-edit'",
    '学校名称映射已应用，本场考试已重算并同步云端'
].forEach((needle) => {
    const uploadSchoolMapRuntime = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'upload-school-map-runtime.js'), 'utf8');
    assert.ok(uploadSchoolMapRuntime.includes(needle), `upload-school-map-runtime.js missing exam mapping edit contract: ${needle}`);
});

const cohortDbCore = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'cohort-db-core-runtime.js'), 'utf8');
assert.ok(cohortDbCore.includes('schoolNameMapping'), 'cohort exam snapshots must persist school name mappings');

[
    'function getExamRecordDateSortTimestamp(examId, exam = {})',
    'function getLatestExamRecordId(exams = {})',
    'sort(compareExamRecordsByDateDesc)',
    'function compareExamRecordsByDateAsc(left, right)'
].forEach((needle) => {
    assert.ok(cohortExamMeta.includes(needle), `cohort-exam-meta-runtime.js missing exam batch contract: ${needle}`);
});

assert.ok(tabRuntime.includes("manager.currentTab === 'exams'"), 'tab runtime must dispatch the exams tab');
assert.ok(tabRuntime.includes('manager.renderExamBatches'), 'tab runtime must call renderExamBatches');

console.log('data-manager exam batches contract passed');
