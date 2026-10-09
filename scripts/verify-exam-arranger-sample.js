const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const XLSX = require('xlsx-js-style');

const root = path.resolve(__dirname, '..');
const folder = path.resolve(process.argv[2] || 'C:/Users/loru/Desktop/考号及考场');
const coreContext = { console, XLSX };
coreContext.window = coreContext;
vm.runInNewContext(fs.readFileSync(path.join(root, 'public/assets/js/exam-arranger-core-runtime.js'), 'utf8'), coreContext);
const core = coreContext.ExamArrangerCore;

function readWorkbook(fileName) {
    return XLSX.readFile(path.join(folder, fileName));
}

function rows(fileName, sheetName) {
    const workbook = readWorkbook(fileName);
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: true });
}

function key(name, currentClass) {
    return `${String(name || '').trim()}|${String(currentClass || '').trim()}`;
}

const source = core.inspectWorkbook({ name: '新生分班方案.xlsx', workbook: readWorkbook('新生分班方案.xlsx'), xlsx: XLSX });
const currentSheets = source.sheets.filter((sheet) => sheet.kind === 'students-current');
const currentCount = currentSheets.reduce((sum, sheet) => sum + sheet.records.length, 0);
const approvedRows = rows('考场考号总表.xlsx', '考场考号总表');
const approvedKeys = new Set(approvedRows.map((row) => key(row.姓名, row.原班级)));
const exclusionRecords = currentSheets.flatMap((sheet) => sheet.records)
    .filter((student) => !approvedKeys.has(key(student.name, student.currentClass)))
    .map((student) => ({ name: student.name, currentClass: student.currentClass, reason: '样例输出未包含' }));
const currentSource = {
    name: '新生分班方案.xlsx',
    sheets: [...currentSheets, { name: '样例推导排除', kind: 'exclusions', records: exclusionRecords, issues: [], rowCount: exclusionRecords.length }]
};
const merged = core.mergeImportSources([currentSource]);
const roomRows = XLSX.readFile(path.join(folder, '考场考号-按考场分表.xlsx'));
const rooms = roomRows.SheetNames.map((name, index) => ({
    id: `room-${index + 1}`,
    name,
    capacity: XLSX.utils.sheet_to_json(roomRows.Sheets[name], { defval: '', raw: true }).length,
    order: index + 1
}));
const generation = core.assignStudents(merged.students, rooms, { prefix: '261580', serialWidth: 3 });
assert.equal(currentCount, 337, `current sample rows should be 337, got ${currentCount}`);
assert.equal(exclusionRecords.length, 12, `sample derived exclusions should be 12, got ${exclusionRecords.length}`);
assert.equal(approvedRows.length, 325, `approved total should contain 325 rows, got ${approvedRows.length}`);
assert.equal(generation.ok, true);
assert.deepEqual(generation.rooms.map((room) => room.students.length), [55, 54, 54, 54, 54, 54]);
assert.equal(generation.assignments[0].examNo, '261580001');
assert.equal(generation.assignments.at(-1).examNo, '261580325');
generation.assignments.forEach((student, index) => {
    const approved = approvedRows[index];
    assert.equal(student.name, approved.姓名, `name mismatch at row ${index + 1}`);
    assert.equal(student.currentClass, approved.原班级, `class mismatch at row ${index + 1}`);
    assert.equal(student.roomName, approved.考场, `room mismatch at row ${index + 1}`);
    assert.equal(student.seatNo, approved.座号, `seat mismatch at row ${index + 1}`);
    assert.equal(Number(student.examNo), Number(approved.考号), `exam number mismatch at row ${index + 1}`);
});
['考场标志.docx', '考号桌签-第一考场.docx', '考号桌签-第六考场.docx'].forEach((fileName) => assert.ok(fs.existsSync(path.join(folder, fileName)), `${fileName} should exist`));

console.log(JSON.stringify({
    ok: true,
    contract: 'exam-arranger-desktop-sample',
    folder,
    currentStudents: currentCount,
    derivedExclusions: exclusionRecords.length,
    approvedStudents: approvedRows.length,
    rooms: generation.rooms.map((room) => ({ name: room.name, count: room.students.length }))
}, null, 2));
