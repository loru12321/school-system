const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const XLSX = require('xlsx-js-style');

const root = path.resolve(__dirname, '..');
const runtimePath = path.join(root, 'public/assets/js/exam-arranger-core-runtime.js');
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
    Error
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

if (fs.existsSync(runtimePath)) {
    vm.runInContext(fs.readFileSync(runtimePath, 'utf8'), context, { filename: runtimePath });
}

assert.ok(context.ExamArrangerCore, 'ExamArrangerCore should be defined');

function makeWorkbook(sheets) {
    const workbook = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([name, rows]) => {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
    });
    return workbook;
}

const workbook = makeWorkbook({
    '1班': [
        ['序号', '姓名', '性别', '总分', '语文', '数学', '英语'],
        [1, '李华', '男', '600', 200, 200, 200],
        [2, '韩梅梅', '女', 580, 190, 195, 195]
    ],
    '2班': [
        ['序号', '姓名', '性别', '总分', '语文', '数学', '英语'],
        [1, '王敏', '女', 590, 190, 200, 200],
        [2, '韩梅梅', '女', 570, 185, 190, 195]
    ],
    '7.1': [
        ['原班级', '现班级', '姓名', '性别', '总分', '语文', '数学', '英语'],
        ['7.1', '1班', '李华', '男', 600, 200, 200, 200]
    ],
    '学生名单': [
        ['姓名', '班级', '总分'],
        ['', '3班', 500],
        ['缺班学生', '', 490]
    ],
    '不参加考试名单': [
        ['姓名', '班级', '不参加原因'],
        ['王敏', '2班', '转学'],
        ['韩梅梅', '2班', '请假'],
        ['未匹配学生', '9班', '转学']
    ],
    '考场配置': [
        ['考场名称', '容量', '教学楼', '教室', '排序'],
        ['第一考场', 55, '教学楼', '101', 1],
        ['第二考场', '54', '教学楼', '102', 2]
    ],
    '说明': [['这不是数据表'], ['仅供阅读']]
});

const source = context.ExamArrangerCore.inspectWorkbook({
    name: '新生分班方案.xlsx',
    workbook,
    xlsx: XLSX
});

assert.strictEqual(source.name, '新生分班方案.xlsx');
assert.strictEqual(source.sheets.find((sheet) => sheet.name === '1班').kind, 'students-current');
assert.strictEqual(source.sheets.find((sheet) => sheet.name === '7.1').kind, 'students-history');
assert.strictEqual(source.sheets.find((sheet) => sheet.name === '不参加考试名单').kind, 'exclusions');
assert.strictEqual(source.sheets.find((sheet) => sheet.name === '考场配置').kind, 'rooms');
assert.strictEqual(source.sheets.find((sheet) => sheet.name === '说明').kind, 'unknown');

const merged = context.ExamArrangerCore.mergeImportSources([source]);
assert.strictEqual(merged.students.filter((student) => student.name === '李华').length, 1,
    'current and historical copies of one student must merge');
assert.strictEqual(merged.students.find((student) => student.name === '李华').originalClass, '7.1');
assert.strictEqual(merged.students.filter((student) => student.name === '韩梅梅').length, 2,
    'same-name students from different classes must remain separate');
assert.strictEqual(merged.students.find((student) => student.name === '韩梅梅' && student.currentClass === '1班').excluded, false);
assert.strictEqual(merged.students.find((student) => student.name === '韩梅梅' && student.currentClass === '2班').excluded, true);
assert.strictEqual(merged.students.find((student) => student.name === '王敏').exclusionReason, '转学');
assert.deepStrictEqual(Array.from(merged.rooms, (room) => room.capacity), [55, 54]);
assert.ok(merged.issues.some((issue) => issue.code === 'UNMATCHED_EXCLUSION' && issue.blocking === false));
assert.ok(merged.issues.some((issue) => issue.code === 'MISSING_STUDENT_NAME' && issue.blocking === true));
assert.ok(merged.issues.some((issue) => issue.code === 'MISSING_STUDENT_CLASS' && issue.blocking === true));

const workspace = context.ExamArrangerCore.createWorkspace({ name: '八年级期中考试', grade: '八年级' });
workspace.students = merged.students;
workspace.exclusions = merged.exclusions;
workspace.rooms = merged.rooms;
workspace.issues = merged.issues;
const validation = context.ExamArrangerCore.validateWorkspace(workspace);
assert.strictEqual(validation.valid, false);
assert.ok(validation.blockingIssues.length >= 2);
assert.strictEqual(validation.summary.totalStudents, 5);
assert.strictEqual(validation.summary.excludedStudents, 2);

console.log(JSON.stringify({
    ok: true,
    contract: 'exam-arranger-core-imports',
    students: merged.students.length,
    exclusions: merged.exclusions.length,
    rooms: merged.rooms.length,
    blockingIssues: validation.blockingIssues.length
}, null, 2));
