(function attachExamArrangerExport(root) {
    'use strict';

    if (!root || root.ExamArrangerExport) return;

    function ensureGeneration(generation) {
        if (!generation?.ok || !Array.isArray(generation.assignments)) {
            throw new Error('请先生成考场安排');
        }
        return generation;
    }

    function publicAssignment(student) {
        return {
            考号: student.examNo || '',
            姓名: student.name || '',
            班级: student.currentClass || '',
            考场: student.roomName || '',
            座号: student.seatNo || ''
        };
    }

    function projectPublicAssignments(assignments) {
        return (Array.isArray(assignments) ? assignments : []).map(publicAssignment);
    }

    function projectConfidentialAssignments(assignments) {
        return (Array.isArray(assignments) ? assignments : []).map((student) => ({
            考号: student.examNo || '',
            姓名: student.name || '',
            学号: student.studentNo || '',
            班级: student.currentClass || '',
            原班级: student.originalClass || '',
            性别: student.gender || '',
            总分: student.totalScore ?? '',
            排名: student.rank || '',
            语文: student.subjects?.语文 ?? '',
            数学: student.subjects?.数学 ?? '',
            英语: student.subjects?.英语 ?? '',
            考场: student.roomName || '',
            座号: student.seatNo || '',
            状态: student.status || '',
            排除原因: student.exclusionReason || ''
        }));
    }

    function roomRows(generation) {
        return (generation.rooms || []).filter((room) => room.students?.length).map((room) => ({
            考场: room.name,
            教学楼: room.building || '',
            教室: room.classroom || '',
            人数: room.students.length,
            起始考号: room.students[0]?.examNo || '',
            结束考号: room.students[room.students.length - 1]?.examNo || ''
        }));
    }

    function classRows(assignments) {
        const groups = new Map();
        projectPublicAssignments(assignments).forEach((row) => {
            const list = groups.get(row.班级) || [];
            list.push(row);
            groups.set(row.班级, list);
        });
        return groups;
    }

    function makeWorkbook(rows, sheetName) {
        if (!root.XLSX?.utils?.book_new) throw new Error('Excel 组件尚未加载');
        const workbook = root.XLSX.utils.book_new();
        const sheet = root.XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
        root.XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
        return workbook;
    }

    function workbookBuffer(rows, sheetName) {
        return root.XLSX.write(makeWorkbook(rows, sheetName), { type: 'array', bookType: 'xlsx' });
    }

    function addWorkbook(zip, fileName, rows, sheetName) {
        zip.file(fileName, workbookBuffer(rows, sheetName));
    }

    function buildOutputPackage(workspace, generation, options = {}) {
        ensureGeneration(generation);
        if (!root.JSZip) throw new Error('ZIP 组件尚未加载');
        const publicRows = projectPublicAssignments(generation.assignments);
        const confidentialRows = projectConfidentialAssignments(generation.assignments);
        const zip = new root.JSZip();
        const files = [];
        const manifest = {
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            cohortId: workspace?.meta?.cohortId || '',
            examId: workspace?.meta?.examId || '',
            generationSignature: generation.generationSignature || '',
            confidentiality: {
                publicFilesExclude: ['总分', '排名', '语文', '数学', '英语', '性别', '学号', '排除原因', 'source'],
                confidentialFiles: ['成绩排名.xlsx', '异常与排除.xlsx']
            },
            files
        };
        const add = (name, content) => {
            zip.file(name, content);
            files.push(name);
        };
        const confidentialWorkbook = workbookBuffer(confidentialRows, '成绩排名');
        add('保密资料/成绩排名.xlsx', confidentialWorkbook);
        const issues = (workspace?.issues || []).map((issue) => ({
            类型: issue.code || '', 状态: issue.blocking ? '阻断' : '提醒', 说明: issue.message || '', 文件: issue.fileName || '', 工作表: issue.sheetName || '', 行号: issue.rowNumber || ''
        }));
        add('保密资料/异常与排除.xlsx', workbookBuffer(issues, '异常与排除'));
        add('公开考务/考场总表.xlsx', workbookBuffer(publicRows, '考场总表'));
        add('公开考务/考场汇总.xlsx', workbookBuffer(roomRows(generation), '考场汇总'));
        const classGroups = classRows(generation.assignments);
        classGroups.forEach((rows, className) => add(`公开考务/按班级/${String(className || '未分班').replace(/[\\/:*?"<>|]/g, '_')}.xlsx`, workbookBuffer(rows, '名单')));
        (generation.rooms || []).filter((room) => room.students?.length).forEach((room) => {
            add(`公开考务/按考场/${String(room.name).replace(/[\\/:*?"<>|]/g, '_')}.xlsx`, workbookBuffer(projectPublicAssignments(room.students), '名单'));
        });
        if (options.printFiles) {
            Object.entries(options.printFiles).forEach(([name, content]) => add(`打印文件/${name}`, content));
        }
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
        const publicPayloadText = JSON.stringify(publicRows);
        return { zip, manifest, publicPayloadText, publicRows, confidentialRows };
    }

    function downloadBlob(blob, fileName) {
        if (!root.document?.createElement || !root.URL?.createObjectURL) return false;
        const link = root.document.createElement('a');
        link.href = root.URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        root.setTimeout?.(() => root.URL.revokeObjectURL(link.href), 0);
        return true;
    }

    async function downloadPackage(workspace, generation, options = {}) {
        const result = buildOutputPackage(workspace, generation, options);
        const blob = await result.zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, options.fileName || '考场编排完整输出.zip');
        return result;
    }

    async function downloadPublic(workspace, generation) {
        ensureGeneration(generation);
        const zip = new root.JSZip();
        zip.file('考场总表.xlsx', workbookBuffer(projectPublicAssignments(generation.assignments), '考场总表'));
        zip.file('考场汇总.xlsx', workbookBuffer(roomRows(generation), '考场汇总'));
        const blob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(blob, '公开考务名单.zip');
        return { ok: true, rows: projectPublicAssignments(generation.assignments) };
    }

    async function downloadConfidential(workspace, generation) {
        ensureGeneration(generation);
        const blob = new Blob([workbookBuffer(projectConfidentialAssignments(generation.assignments), '成绩排名')], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(blob, '保密资料-成绩排名.xlsx');
        return { ok: true, rows: projectConfidentialAssignments(generation.assignments) };
    }

    async function downloadPrint(workspace, generation) {
        ensureGeneration(generation);
        if (!root.ExamArrangerDocx?.buildPrintFiles) return { ok: false, code: 'DOCX_RUNTIME_NOT_READY' };
        const printFiles = await root.ExamArrangerDocx.buildPrintFiles(workspace, generation);
        const result = await downloadPackage(workspace, generation, { printFiles, fileName: '考场打印文件.zip' });
        return { ok: true, ...result };
    }

    async function downloadDefaultPackage(workspace, generation) {
        return downloadPackage(workspace, generation);
    }

    root.ExamArrangerExport = Object.freeze({
        projectPublicAssignments,
        projectConfidentialAssignments,
        buildOutputPackage,
        downloadPackage,
        downloadPublic,
        downloadConfidential,
        downloadPrint,
        downloadDefaultPackage
    });
})(typeof window !== 'undefined' ? window : globalThis);
