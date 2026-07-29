const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/exam-analysis-package-runtime.js'), 'utf8');

assert.ok(
    source.includes('function getMajorSubjectsForPackage(rows = getAllRows())'),
    'exam package runtime should define a dedicated major-subject selector'
);

assert.ok(
    /if \(grade === '9'\) return \[\];/.test(source),
    'major-subject school workbook must not be generated for grade 9'
);

assert.ok(
    /\? \['语文', '数学', '英语', '物理', '化学'\]\s*:\s*\(grade === '6' \|\| grade === '7' \? \['语文', '数学', '英语'\]/.test(source),
    'grade 8 should use Chinese/Math/English/Physics/Chemistry, while grades 6-7 should use Chinese/Math/English'
);

assert.ok(
    /const present = new Set\(getSubjectList\(rows\)\);[\s\S]*return allowed\.filter\(\(subject\) => present\.has\(subject\)\);/.test(source),
    'major-subject list should only include subjects actually present in the uploaded Excel'
);

assert.ok(
    source.includes('function buildMajorSubjectSchoolAnalysisWorkbook()')
        && source.includes('const snapshot = calculateMajorSubjectSnapshot(rows, subjects);')
        && source.includes('const totalLabel = getPackageTotalLabel(snapshot.subjects);')
        && source.includes('totalLabel'),
    'major-subject workbook should recalculate a separate school-analysis snapshot and carry its own total label'
);

assert.ok(
    /if \(majorSubjectWorkbook\) await addWorkbook\(zip, `学校\/\$\{packageStem\}主科学校分析\$\{suffix\}\.xlsx`, majorSubjectWorkbook\);/.test(source),
    'downloaded exam analysis package should include the major-subject school workbook under the 学校 folder'
);

assert.ok(
    /const majorRows = buildMajorSubjectRows\(rows, subjects\);/.test(source)
        && /const total = subjects\.reduce\(\(sum, subject\) => sum \+/.test(source)
        && /scores\[subject\] = value;/.test(source),
    'major-subject snapshot should rebuild student scores and total from only selected major subjects'
);

assert.ok(
    source.includes('function buildGrade9ZhongkaoPoliticsReferenceWorkbooks()')
        && source.includes("学校分析（不含政治）")
        && source.includes("学校分析（含政治·中考整理表参考）"),
    'grade 9 Zhongkao package should generate separate school-analysis workbooks with and without latest-sheet politics'
);

assert.ok(
    source.includes('不参与')
        && source.includes('中考五科总分、排名、两率一分、指标生、高分段、高中上线率'),
    'grade 9 politics reference workbook should explicitly protect official Zhongkao calculations'
);

assert.ok(
    source.includes('function getGrade9ZhongkaoDisplayData')
        && source.includes("return { rows: politics.rows, subjects: [...officialSubjects, '政治'], politics }"),
    'grade 9 export details should use latest-sheet politics only as display data'
);

function createRuntimeContext({ grade, subjects, zhongkao = false }) {
    const files = [];
    const students = [
        {
            school: '银山实验学校',
            class: `${grade}.1`,
            name: '甲',
            scores: Object.fromEntries(subjects.map((subject, index) => [subject, 80 + index])),
            total: 600
        },
        {
            school: '州城中学',
            class: `${grade}.1`,
            name: '乙',
            scores: Object.fromEntries(subjects.map((subject, index) => [subject, 70 + index])),
            total: 500
        }
    ];
    const xlsx = {
        utils: {
            book_new: () => ({ SheetNames: [], Sheets: {} }),
            aoa_to_sheet: (rows) => ({ rows, '!ref': `A1:Z${rows.length}` }),
            book_append_sheet: (wb, ws, name) => {
                wb.SheetNames.push(name);
                wb.Sheets[name] = ws;
            },
            decode_range: () => ({ s: { r: 0, c: 0 }, e: { r: 1, c: 1 } }),
            encode_cell: ({ r, c }) => `${String.fromCharCode(65 + c)}${r + 1}`
        },
        write: (wb) => wb
    };
    const context = {
        console,
        document: {
            readyState: 'loading',
            getElementById: () => null,
            createElement: () => ({
                click() {},
                remove() {}
            }),
            body: {
                appendChild() {}
            },
            addEventListener() {}
        },
        setTimeout() {},
        setInterval() {},
        URL: { createObjectURL: () => 'blob:mock', revokeObjectURL() {} },
        JSZip: function JSZipMock() {
            return {
                file: (name, payload) => files.push({ name, payload }),
                generateAsync: async () => ({})
            };
        },
        XLSX: xlsx,
        RAW_DATA: students,
        SUBJECTS: subjects,
        SCHOOLS: {
            '银山实验学校': { name: '银山实验学校', students: students.slice(0, 1), metrics: {}, rankings: {} },
            '州城中学': { name: '州城中学', students: students.slice(1), metrics: {}, rankings: {} }
        },
        // 模拟当前全科界面仍显示“七科总”；主科包必须忽略它，改用传入的主科集合。
        CONFIG: { name: `${grade}年级`, label: '七科总', excRate: 0.15 },
        CURRENT_EXAM_ID: zhongkao
            ? `2023级-${grade}年级-2025-2026-暑假-中考-2026-07-12`
            : `2023级-${grade}年级-2025-2026-下学期-期末-2026-07-01`,
        CURRENT_COHORT_ID: '2023',
        CURRENT_COHORT_META: { id: '2023', year: '2023' },
        COHORT_DB: { exams: {} },
        MY_SCHOOL: '银山实验学校',
        ensureXlsxVendorLoaded: async () => {},
        renderTables() {},
        calcSummary() {},
        filterRowsToTownshipSchools: (rows) => rows,
        getSummaryTownshipSchools() {
            return Object.values(context.SCHOOLS);
        },
        getTotalSubjectLabel({ subjects: labelSubjects = [] } = {}) {
            const numerals = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
            const count = Array.isArray(labelSubjects) ? labelSubjects.length : 0;
            return count ? `${numerals[count] || count}科总` : context.CONFIG.label;
        }
    };
    if (zhongkao) {
        students.forEach((student, index) => {
            student.scores.政治 = 80 - index * 10;
        });
        context.COHORT_DB.exams[context.CURRENT_EXAM_ID] = {
            data: students,
            meta: { cohortId: '2023', grade: '9', year: '2025-2026', type: '中考', date: '2026-07-12' }
        };
        context.COHORT_DB.exams['2023级-9年级-2025-2026-下学期-二模-2026-05-27'] = {
            data: students.map((student, index) => ({
                ...student,
                scores: { 政治: 70 + index }
            })).concat([{ school: '州城中学', class: '9.1', name: '二模独有', scores: { 政治: 99 } }]),
            meta: { cohortId: '2023', grade: '9', year: '2025-2026', type: '二模', date: '2026-05-27' }
        };
    }
    context.window = context;
    vm.runInNewContext(source, context, { filename: 'exam-analysis-package-runtime.js' });
    return { context, files };
}

function getWorkbookRows(file, sheetName) {
    const workbook = file?.payload;
    return workbook?.Sheets?.[sheetName]?.rows || [];
}

(async () => {
    {
        const { context, files } = createRuntimeContext({ grade: '8', subjects: ['语文', '数学', '英语', '物理', '化学', '历史', '地理', '生物'] });
        await context.downloadExamAnalysisPackage();
        assert.ok(
            files.some((file) => /学校\/.*主科学校分析.*\.xlsx$/.test(file.name)),
            'grade 8 package should include a major-subject school workbook'
        );
    }
    {
        const { context, files } = createRuntimeContext({ grade: '7', subjects: ['语文', '数学', '英语', '历史', '地理', '生物'] });
        await context.downloadExamAnalysisPackage();
        const majorFile = files.find((file) => /学校\/.*主科学校分析.*\.xlsx$/.test(file.name));
        assert.ok(majorFile, 'grade 7 package should include a major-subject school workbook');
        const totalRows = getWorkbookRows(majorFile, '三科总 - 综合分析表');
        assert.strictEqual(totalRows[0]?.[3], '三科总平均分', 'major total sheet header must use the three-subject label');
        const horizontalRows = getWorkbookRows(majorFile, '横向对比一览表');
        const horizontalLabels = horizontalRows.map((row) => String(row?.[0] || '')).join('|');
        assert.ok(horizontalLabels.includes('三科总平均分（排名）'), 'major horizontal sheet must use the three-subject label');
        assert.ok(!/七科总/.test(`${totalRows.flat().join('|')}|${horizontalLabels}`), 'major workbook must never leak the full-subject label');
    }
    {
        const { context, files } = createRuntimeContext({ grade: '9', subjects: ['语文', '数学', '英语', '物理', '化学', '政治'] });
        await context.downloadExamAnalysisPackage();
        assert.ok(
            !files.some((file) => /主科学校分析/.test(file.name)),
            'grade 9 package should not include the non-grade-9 major-subject workbook'
        );
    }
    {
        const { context, files } = createRuntimeContext({ grade: '9', subjects: ['语文', '数学', '英语', '物理', '化学'], zhongkao: true });
        await context.downloadExamAnalysisPackage();
        assert.ok(
            files.some((file) => /学校\/.*学校分析（不含政治）.*\.xlsx$/.test(file.name)),
            'grade 9 Zhongkao package should include the official five-subject school workbook'
        );
        assert.ok(
            files.some((file) => /学校\/.*学校分析（含政治·中考整理表参考）.*\.xlsx$/.test(file.name)),
            'grade 9 Zhongkao package should include the isolated latest-sheet politics reference workbook'
        );
        const rawScoreFile = files.find((file) => /成绩.*\.xlsx$/.test(file.name) && !file.name.includes('/'));
        const rawScoreRows = getWorkbookRows(rawScoreFile, '银山实验学校');
        assert.ok(rawScoreRows[0]?.includes('政治（中考整理表参考）'), 'raw score workbook should include latest-sheet politics as a display-only column');
        assert.strictEqual(rawScoreRows[1]?.[rawScoreRows[0].indexOf('政治（中考整理表参考）')], 80, 'raw score workbook must retain the latest Zhongkao politics score instead of the conflicting second-mock value');
        assert.strictEqual(rawScoreRows[0]?.at(-2), '五科总', 'raw score workbook total must remain the formal five-subject total');

        const studentDetailFile = files.find((file) => /学生\/.*学生乡镇考试明细\.xlsx$/.test(file.name));
        const studentDetailRows = getWorkbookRows(studentDetailFile, '学生考试明细');
        assert.ok(studentDetailRows[0]?.includes('政治（中考整理表参考）分数'), 'student detail workbook should include latest-sheet politics score');
        assert.ok(studentDetailRows[0]?.includes('政治（中考整理表参考）镇排'), 'student detail workbook should include latest-sheet politics township rank');

        const teacherFile = files.find((file) => /教师\/.*教师分析.*\.xlsx$/.test(file.name));
        assert.ok(teacherFile?.payload?.SheetNames.includes('政治（中考整理表参考） 教师乡镇排名'), 'teacher workbook should include politics teacher township ranking sheet');
    }
    console.log('test-exam-analysis-package-major-subjects passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
