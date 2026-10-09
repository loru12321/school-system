const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const JSZip = require('jszip');
const XLSX = require('xlsx-js-style');

const root = path.resolve(__dirname, '..');
const coreSource = fs.readFileSync(path.join(root, 'public/assets/js/exam-arranger-core-runtime.js'), 'utf8');
const exportSource = fs.readFileSync(path.join(root, 'public/assets/js/exam-arranger-export-runtime.js'), 'utf8');
const context = { console, XLSX, JSZip, Blob, URL, setTimeout };
context.window = context;
vm.runInNewContext(coreSource, context, { filename: 'exam-arranger-core-runtime.js' });
vm.runInNewContext(exportSource, context, { filename: 'exam-arranger-export-runtime.js' });

const workspace = context.ExamArrangerCore.createWorkspace({ prefix: '261580' });
workspace.students = [
    { id: 'student:1', name: '甲', currentClass: '1班', originalClass: '1班', gender: '男', studentNo: 'S1', totalScore: 99, subjects: { 语文: 35 }, excluded: false, status: 'normal', source: { fileName: '成绩.xlsx', sheetName: '1班', rowNumber: 2 } },
    { id: 'student:2', name: '乙', currentClass: '1班', originalClass: '1班', gender: '女', studentNo: 'S2', totalScore: 0, subjects: {}, excluded: false, status: 'score-zero', source: { fileName: '成绩.xlsx', sheetName: '1班', rowNumber: 3 } },
    { id: 'student:3', name: '丙', currentClass: '2班', originalClass: '2班', gender: '男', studentNo: 'S3', totalScore: 88, subjects: {}, excluded: true, exclusionReason: '请假', status: 'excluded', source: { fileName: '成绩.xlsx', sheetName: '2班', rowNumber: 2 } }
];
const generation = context.ExamArrangerCore.assignStudents(workspace.students, [{ id: 'room-1', name: '第一考场', capacity: 2, building: 'A', classroom: '101', order: 1 }], { prefix: '261580', serialWidth: 3 });
assert.equal(generation.ok, true);

const publicRows = context.ExamArrangerExport.projectPublicAssignments(generation.assignments);
assert.ok(publicRows.length === 2);
assert.ok(!Object.keys(publicRows[0]).some((key) => /score|rank|subject|gender|studentNo|source/i.test(key)), 'public rows must not expose confidential fields');
assert.equal(publicRows[0].考号, '261580001');

const confidentialRows = context.ExamArrangerExport.projectConfidentialAssignments(generation.assignments);
assert.ok(confidentialRows[0].总分 === 99 && confidentialRows[0].排名 === 1);

const packageResult = context.ExamArrangerExport.buildOutputPackage(workspace, generation);
assert.ok(packageResult.manifest.files.some((name) => name.includes('保密资料')));
assert.ok(packageResult.manifest.files.some((name) => name.includes('公开考务')));
assert.ok(!packageResult.publicPayloadText.includes('totalScore'));
assert.ok(!packageResult.publicPayloadText.includes('subjects'));

packageResult.zip.generateAsync({ type: 'nodebuffer' }).then(async (buffer) => {
    const zip = await JSZip.loadAsync(buffer);
    const names = Object.keys(zip.files);
    assert.ok(names.includes('manifest.json'));
    assert.ok(names.some((name) => name.includes('公开考务/')));
    assert.ok(names.some((name) => name.includes('保密资料/')));
    console.log(JSON.stringify({ ok: true, contract: 'exam-arranger-export-boundary', files: names.length }));
}).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
