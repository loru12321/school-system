const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const JSZip = require('jszip');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/exam-arranger-docx-runtime.js'), 'utf8');
const context = { console, JSZip };
context.window = context;
vm.runInNewContext(source, context, { filename: 'exam-arranger-docx-runtime.js' });

const workspace = { meta: { grade: '八年级', name: '期中考试' } };
const generation = {
    ok: true,
    rooms: [{
        id: 'room-1', name: '第一考场', building: 'A', classroom: '101',
        students: [
            { examNo: '261580001', name: '甲', currentClass: '1班', roomName: '第一考场', seatNo: 1 },
            { examNo: '261580002', name: '乙', currentClass: '1班', roomName: '第一考场', seatNo: 2 }
        ]
    }]
};

(async () => {
    const files = await context.ExamArrangerDocx.buildPrintFiles(workspace, generation);
    assert.ok(files['考场门牌.docx']);
    assert.ok(files['桌签/第一考场桌签.docx']);
    const signZip = await JSZip.loadAsync(files['考场门牌.docx']);
    const signXml = await signZip.file('word/document.xml').async('string');
    assert.ok(signXml.includes('八年级'));
    assert.ok(signXml.includes('第一考场'));
    assert.ok(signXml.includes('261580001') && signXml.includes('261580002'));
    assert.ok(!signXml.includes('99') && !signXml.includes('总分'));
    assert.ok(signXml.includes('w:orient="landscape"'));

    const deskZip = await JSZip.loadAsync(files['桌签/第一考场桌签.docx']);
    const deskXml = await deskZip.file('word/document.xml').async('string');
    assert.ok((deskXml.match(/<w:tc>/g) || []).length >= 16, 'desk labels should fill a 2x8 page');
    assert.ok(deskXml.includes('w:color w:val="C62828"'));
    assert.ok(deskXml.includes('261580001') && deskXml.includes('甲'));
    assert.ok(!deskXml.includes('总分'));
    console.log(JSON.stringify({ ok: true, contract: 'exam-arranger-docx-print', files: Object.keys(files).length }));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
