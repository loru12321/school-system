const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/assets/css/main.css'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'public/assets/js/exam-arranger-runtime.js'), 'utf8');
const start = html.indexOf('id="exam-arranger"');
const end = html.indexOf('id="grade-scheduler"', start);
assert.ok(start >= 0 && end > start, 'exam arranger section should be present');
const section = html.slice(start, end);
const visibleStart = section.indexOf('class="exam-arranger-workbench"');
const legacyStart = section.indexOf('<template id="exam-arranger-legacy-fallback">');
const visibleSection = section.slice(visibleStart, legacyStart > visibleStart ? legacyStart : section.length);

[
    'exam-step-import',
    'exam-step-review',
    'exam-step-arrange',
    'exam-step-output',
    'exam-summary-strip',
    'exam-issue-list',
    'exam-room-editor',
    'exam-output-center'
].forEach((id) => assert.ok(visibleSection.includes(`id="${id}"`), `workbench should include ${id}`));

[
    '姓名', '班级', '总分', '不参加考试名单', '考场名称', '容量',
    '模板', '本机处理', '保密', '公开', '需要处理'
].forEach((copy) => assert.ok(visibleSection.includes(copy), `workbench should explain ${copy}`));

assert.ok(visibleSection.includes('data-exam-action="pick-folder"'), 'folder picker action should exist');
assert.ok(visibleSection.includes('data-exam-change="files"'), 'file input should use a scoped change action');
assert.ok(section.includes('data-exam-action="save-draft"'), 'explicit local save action should exist');
assert.ok(section.includes('data-exam-action="clear"'), 'clear workspace action should exist');
assert.ok(visibleSection.includes('data-exam-action="generate"'), 'generate action should exist');
assert.ok(visibleSection.includes('data-exam-action="export"'), 'export action should exist');
assert.ok(visibleSection.includes('data-exam-step="1"') && visibleSection.includes('data-exam-step="4"'), 'step controls should exist');
assert.ok(/ti ti-[a-z0-9-]+/.test(visibleSection), 'workbench should use Tabler icons');
assert.ok(!/[🚀🔀🐍🏷️👀👨‍🏫📋👮]/u.test(visibleSection), 'exam arranger buttons should not use emoji labels');

[
    '.exam-arranger-workbench',
    '.exam-stepper',
    '.exam-summary-strip',
    '.exam-issue-list',
    '.exam-room-editor',
    '.exam-output-center',
    '.exam-sticky-rail',
    '.exam-table-scroll',
    '.exam-status-blocking'
].forEach((selector) => assert.ok(css.includes(selector), `stylesheet should define ${selector}`));

assert.ok(runtime.includes('data-exam-panel') && runtime.includes('renderWorkbench'), 'runtime should render workbench state');
console.log(JSON.stringify({ ok: true, contract: 'exam-arranger-four-step-ui' }, null, 2));
