const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/ui-language-runtime.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const shellSource = fs.readFileSync(path.join(root, 'public/assets/js/shell-runtime.js'), 'utf8');
const window = {};

vm.runInNewContext(source, { window }, { filename: 'ui-language-runtime.js' });

assert.ok(window.SystemLanguage, 'language runtime should be installed');
assert.strictEqual(window.SystemLanguage.getDomain('student').title, '学生发展');
assert.strictEqual(window.SystemLanguage.getModule('student-details').title, '学生成绩明细');
assert.strictEqual(window.SystemLanguage.getModule('teacher-analysis').title, '教师表现');
assert.strictEqual(window.SystemLanguage.formatCohort('2022级 (六年级入学)'), '2022级');
assert.strictEqual(window.SystemLanguage.formatGrade('9年级模式'), '9年级');
assert.strictEqual(window.SystemLanguage.roles.class_teacher, '班主任');
assert.ok(
    indexSource.indexOf('ui-language-runtime.js') < indexSource.indexOf('boot-runtime-runtime-'),
    'language runtime should load before the application boot runtime'
);
assert.ok(
    shellSource.includes('const language = window.SystemLanguage || null;')
        && shellSource.includes('const moduleCopy = language.getModule(item.id);'),
    'shell navigation should consume the centralized language runtime'
);

console.log('ui language runtime tests passed');
