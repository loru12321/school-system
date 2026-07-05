(() => {
    if (typeof window === 'undefined' || window.__EXAM_ANALYSIS_PACKAGE_RUNTIME_PATCHED__) return;

    const DEFAULT_EXAM_DATE = '2026-05-27';
    const INVALID_SHEET_CHARS = /[\\/?*\[\]:]/g;

    function toast(message, type = 'info') {
        if (window.UI && typeof window.UI.toast === 'function') return window.UI.toast(message, type);
        if (type === 'error' && typeof window.alert === 'function') return window.alert(message);
        return undefined;
    }

    function num(value, digits = 2) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '';
        return Number(number.toFixed(digits));
    }

    function pct(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '';
        return Number((number * 100).toFixed(2));
    }

    function excelSafeName(name, fallback = 'Sheet') {
        const text = String(name || fallback).replace(INVALID_SHEET_CHARS, '').trim() || fallback;
        return text.slice(0, 31);
    }

    function fileSafeName(name) {
        return String(name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
    }

    function getMySchoolName() {
        return String(window.MY_SCHOOL || window.DEFAULT_MY_SCHOOL_NAME || '银山实验学校').trim();
    }

    function sameSchool(left, right) {
        if (typeof window.sameAppSchoolName === 'function') return window.sameAppSchoolName(left, right);
        if (typeof window.areSchoolNamesEquivalent === 'function') return window.areSchoolNamesEquivalent(left, right);
        return String(left || '').trim() === String(right || '').trim();
    }

    function getSubjectList(rows) {
        if (Array.isArray(window.SUBJECTS) && window.SUBJECTS.length) return window.SUBJECTS.filter(Boolean);
        const subjectSet = new Set();
        (rows || []).forEach((row) => {
            Object.keys(row?.scores || {}).forEach((subject) => subjectSet.add(subject));
        });
        return Array.from(subjectSet);
    }

    function getCurrentExamDate() {
        const id = String(window.CURRENT_EXAM_ID || '').trim();
        const match = id.match(/\d{4}-\d{2}-\d{2}/);
        if (match) return match[0];
        const meta = window.COHORT_DB?.exams?.[id]?.meta || {};
        return String(meta.date || meta.examDate || DEFAULT_EXAM_DATE).trim() || DEFAULT_EXAM_DATE;
    }

    function getExamLabel() {
        const id = String(window.CURRENT_EXAM_ID || '').trim();
        const meta = window.COHORT_DB?.exams?.[id]?.meta || {};
        return meta.name || meta.examName || id || `${window.CONFIG?.name || ''}二模${getCurrentExamDate()}`;
    }

    function getDateSuffix() {
        const date = getCurrentExamDate();
        const parts = date.split('-');
        return parts.length === 3 ? `${parts[1]}${parts[2]}` : '0527';
    }

    function getAllRows() {
        return Array.isArray(window.RAW_DATA) ? window.RAW_DATA.slice() : [];
    }

    function getTownshipRows() {
        const rows = getAllRows();
        if (typeof window.filterRowsToTownshipSchools === 'function') return window.filterRowsToTownshipSchools(rows).slice();
        return rows;
    }

    function getTownshipSchools() {
        if (typeof window.getSummaryTownshipSchools === 'function') return window.getSummaryTownshipSchools().slice();
        const names = typeof window.listAvailableSchoolsForCompare === 'function'
            ? window.listAvailableSchoolsForCompare()
            : Object.keys(window.SCHOOLS || {});
        const nameSet = new Set((names || []).map((name) => String(name || '').trim()));
        return Object.values(window.SCHOOLS || {}).filter((school) => !nameSet.size || nameSet.has(String(school?.name || '').trim()));
    }

    function hasCountyScope() {
        const rows = getAllRows();
        const townshipRows = getTownshipRows();
        const scope = window.CountyAnalysisRuntime?.getCurrentScope?.();
        if (scope && scope.includesCounty) return true;
        return rows.length > 0 && townshipRows.length > 0 && rows.length > townshipRows.length;
    }

    function addWorksheet(workbook, name, rows, options = {}) {
        const ws = window.XLSX.utils.aoa_to_sheet(rows && rows.length ? rows : [['暂无数据']]);
        const widthCount = (rows || []).reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 1);
        ws['!cols'] = Array.from({ length: widthCount }, (_, index) => ({ wch: index === 0 ? 18 : 13 }));
        if (options.freeze) ws['!freeze'] = options.freeze;
        if (typeof window.decorateExcelSheet === 'function' && rows?.[0]) {
            try { window.decorateExcelSheet(ws, rows[0]); } catch (_) {}
        }
        window.XLSX.utils.book_append_sheet(workbook, ws, excelSafeName(name));
        return ws;
    }

    function workbookToArrayBuffer(workbook) {
        return window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    }

    function schoolRankRows(schools, subject) {
        const isTotal = subject === 'total';
        const title = isTotal ? (window.CONFIG?.label || '总分') : subject;
        const rows = [[
            '序号', '学校', '本校标记', '实考人数', `${title}平均分`, '优秀率(%)', '及格率(%)',
            '平均分排名', '优秀率排名', '及格率排名', '两率一分', '综合排名'
        ]];
        const list = schools
            .filter((school) => school?.metrics?.[subject])
            .sort((a, b) => {
                const leftRank = isTotal ? (a.rank2Rate || 9999) : (a.rankings?.[subject]?.avg || 9999);
                const rightRank = isTotal ? (b.rank2Rate || 9999) : (b.rankings?.[subject]?.avg || 9999);
                return leftRank - rightRank || String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
            });
        const mySchool = getMySchoolName();
        list.forEach((school, index) => {
            const metric = school.metrics[subject] || {};
            const ranking = school.rankings?.[subject] || {};
            rows.push([
                index + 1,
                school.name || '',
                sameSchool(school.name, mySchool) ? '本校' : '',
                metric.count || 0,
                num(metric.avg),
                pct(metric.excRate),
                pct(metric.passRate),
                ranking.avg || '',
                ranking.excRate || '',
                ranking.passRate || '',
                num(isTotal ? school.score2Rate : ((metric.ratedAvg || 0) + (metric.ratedExc || 0) + (metric.ratedPass || 0))),
                isTotal ? (school.rank2Rate || '') : ''
            ]);
        });
        return rows;
    }

    function buildSchoolAnalysisWorkbook(scope = 'township') {
        const wb = window.XLSX.utils.book_new();
        const schools = scope === 'county' ? Object.values(window.SCHOOLS || {}) : getTownshipSchools();
        const subjects = getSubjectList(getAllRows());
        const mySchool = getMySchoolName();
        const examLabel = getExamLabel();
        addWorksheet(wb, '综合分析报告', [
            ['项目', '内容'],
            ['考试', examLabel],
            ['考试日期', getCurrentExamDate()],
            ['范围', scope === 'county' ? '县域全部学校' : '乡镇学校'],
            ['本校', mySchool],
            ['学校数', schools.length],
            ['学生数', scope === 'county' ? getAllRows().length : getTownshipRows().length],
            ['学科', subjects.join('、')]
        ]);
        addWorksheet(wb, '横向对比一览表', buildHorizontalRows(schools, subjects));
        addWorksheet(wb, '五科总 - 综合分析表', schoolRankRows(schools, 'total'));
        subjects.forEach((subject) => addWorksheet(wb, `${subject} 学科明细`, schoolRankRows(schools, subject)));
        if (scope !== 'county') {
            addWorksheet(wb, '高分段赋分详情', buildHighScoreRows(schools));
            addWorksheet(wb, '指标生达标核算', buildIndicatorRows());
            addWorksheet(wb, '后三分之一学生核算', buildBottomRows(schools));
        }
        return wb;
    }

    function buildHorizontalRows(schools, subjects) {
        const sortedSchools = schools.slice().sort((a, b) => (a.rank2Rate || 9999) - (b.rank2Rate || 9999));
        const rows = [['统计项目 / 学校', ...sortedSchools.map((school) => `${school.name}${sameSchool(school.name, getMySchoolName()) ? '（本校）' : ''}`)]];
        [...subjects, 'total'].forEach((subject) => {
            const label = subject === 'total' ? (window.CONFIG?.label || '总分') : subject;
            rows.push([`${label}平均分`, ...sortedSchools.map((school) => num(school.metrics?.[subject]?.avg))]);
            rows.push([`${label}优秀率(%)`, ...sortedSchools.map((school) => pct(school.metrics?.[subject]?.excRate))]);
            rows.push([`${label}及格率(%)`, ...sortedSchools.map((school) => pct(school.metrics?.[subject]?.passRate))]);
        });
        return rows;
    }

    function buildHighScoreRows(schools) {
        const rows = [['学校', '本校标记', '高分人数', '高分率(%)', '高分段赋分']];
        schools.forEach((school) => {
            const stats = school.highScoreStats || {};
            rows.push([
                school.name || '',
                sameSchool(school.name, getMySchoolName()) ? '本校' : '',
                stats.count || stats.hsCount || 0,
                pct(stats.ratio || stats.hsRatio || 0),
                num(stats.score || 0)
            ]);
        });
        return rows;
    }

    function buildIndicatorRows() {
        let rows = Array.isArray(window.__LAST_INDICATOR_CALC_DATA__) ? window.__LAST_INDICATOR_CALC_DATA__ : [];
        if (!rows.length && typeof window.calcIndicators === 'function') {
            try {
                const result = window.calcIndicators(true);
                if (Array.isArray(result)) rows = result;
            } catch (_) {}
        }
        return [
            ['学校', '本校标记', '指标生得分', '名次', '说明'],
            ...rows.map((row) => [
                row.name || '',
                sameSchool(row.name, getMySchoolName()) ? '本校' : '',
                num(row.finalScore),
                row.rank || '',
                row.missingTarget ? '缺目标人数' : ''
            ])
        ];
    }

    function buildBottomRows(schools) {
        return [
            ['学校', '本校标记', '总人数', '后1/3人数', '剔除人数', '后1/3平均分', '后1/3得分', '排名'],
            ...schools.map((school) => {
                const bottom = school.bottom3 || {};
                return [
                    school.name || '',
                    sameSchool(school.name, getMySchoolName()) ? '本校' : '',
                    bottom.totalN || '',
                    bottom.bottomN || '',
                    bottom.excN || '',
                    num(bottom.avg),
                    num(school.scoreBottom),
                    school.rankBottom || ''
                ];
            })
        ];
    }

    function buildRawScoreWorkbook(rows = getAllRows()) {
        const wb = window.XLSX.utils.book_new();
        const subjects = getSubjectList(rows);
        const grouped = new Map();
        rows.forEach((student) => {
            const school = String(student?.school || '未知学校').trim() || '未知学校';
            if (!grouped.has(school)) grouped.set(school, []);
            grouped.get(school).push(student);
        });
        grouped.forEach((students, school) => {
            const data = [['学校', '班级', '姓名', '考号', '考场', ...subjects, window.CONFIG?.label || '总分']];
            students
                .slice()
                .sort((a, b) => String(a.class || '').localeCompare(String(b.class || ''), 'zh-CN', { numeric: true }) || (Number(b.total) || 0) - (Number(a.total) || 0))
                .forEach((student) => {
                    data.push([
                        student.school || '',
                        student.class || '',
                        student.name || '',
                        student.id || student.examNo || '',
                        student.examRoom || '',
                        ...subjects.map((subject) => student.scores?.[subject] ?? ''),
                        num(student.total, 1)
                    ]);
                });
            addWorksheet(wb, school, data, { freeze: { xSplit: 0, ySplit: 1 } });
        });
        return wb;
    }

    function buildStudentDetailWorkbook(rows, options = {}) {
        const subjects = getSubjectList(rows);
        const includeCounty = !!options.includeCounty;
        const headers = ['学校', '班级', '姓名', '考号', '考场'];
        subjects.forEach((subject) => {
            headers.push(`${subject}分数`, `${subject}校排`, `${subject}镇排`);
            if (includeCounty) headers.push(`${subject}县排`);
        });
        headers.push(`${window.CONFIG?.label || '总分'}`, '总分班排', '总分校排', '总分镇排');
        if (includeCounty) headers.push('总分县排');
        const data = [headers];
        rows.slice().sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0)).forEach((student) => {
            const row = [student.school || '', student.class || '', student.name || '', student.id || student.examNo || '', student.examRoom || ''];
            subjects.forEach((subject) => {
                row.push(
                    student.scores?.[subject] ?? '',
                    student.ranks?.[subject]?.school ?? '',
                    student.ranks?.[subject]?.township ?? ''
                );
                if (includeCounty) row.push(student.ranks?.[subject]?.county ?? '');
            });
            row.push(
                num(student.total, 1),
                student.ranks?.total?.class ?? '',
                student.ranks?.total?.school ?? '',
                student.ranks?.total?.township ?? ''
            );
            if (includeCounty) row.push(student.ranks?.total?.county ?? '');
            data.push(row);
        });
        const wb = window.XLSX.utils.book_new();
        addWorksheet(wb, '学生考试明细', data, { freeze: { xSplit: 5, ySplit: 1 } });
        return wb;
    }

    async function ensureTeacherRankings() {
        if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
            await window.SystemRuntimeLoader.load('teacher-analysis').catch(() => {});
        }
        if (typeof window.calculateTeacherTownshipRanking === 'function') {
            window.calculateTeacherTownshipRanking({ teacherMetricScope: 'admin' });
        }
    }

    function buildTeacherTownWorkbook() {
        const wb = window.XLSX.utils.book_new();
        const data = window.TOWNSHIP_RANKING_DATA || {};
        const subjects = getSubjectList(getAllRows());
        subjects.forEach((subject) => {
            const rows = data[subject] || [];
            addWorksheet(wb, `${subject} 教师乡镇排名`, [
                ['教师/学校', '类型', '平均分', '乡镇均分排名', '优秀率(%)', '乡镇优率排名', '及格率(%)', '乡镇及格排名'],
                ...rows.map((item) => [
                    item.name || '',
                    item.type === 'teacher' ? '教师' : '学校',
                    num(item.avg),
                    item.rankAvg || '',
                    pct(item.excellentRate),
                    item.rankExc || '',
                    pct(item.passRate),
                    item.rankPass || ''
                ])
            ]);
        });
        return wb;
    }

    function buildTeacherCountyWorkbook() {
        const wb = window.XLSX.utils.book_new();
        const stats = window.TEACHER_STATS || {};
        const subjects = getSubjectList(getAllRows());
        subjects.forEach((subject) => {
            const rows = [['教师', '学校', '班级', '学科', '平均分', '优秀率(%)', '及格率(%)', '样本人数']];
            Object.entries(stats).forEach(([teacherName, subjectMap]) => {
                const data = subjectMap?.[subject];
                if (!data) return;
                rows.push([
                    teacherName,
                    data.school || data.schoolName || '',
                    Array.isArray(data.classes) ? data.classes.join('、') : (data.className || ''),
                    subject,
                    num(data.avg),
                    pct(data.excellentRate ?? data.excRate),
                    pct(data.passRate),
                    data.count || data.studentCount || (Array.isArray(data.students) ? data.students.length : '')
                ]);
            });
            const sortedRows = [rows[0], ...rows.slice(1).sort((a, b) => (Number(b[4]) || 0) - (Number(a[4]) || 0))];
            addWorksheet(wb, `${subject} 同学科县域排名`, sortedRows);
        });
        return wb;
    }

    async function addWorkbook(zip, path, workbook) {
        zip.file(path, workbookToArrayBuffer(workbook));
    }

    async function downloadExamAnalysisPackage() {
        try {
            if (!getAllRows().length) return toast('请先上传成绩数据，再下载二模分析包。', 'error');
            if (!window.XLSX || !window.XLSX.utils) await window.ensureXlsxVendorLoaded?.();
            if (!window.XLSX || !window.XLSX.utils) throw new Error('XLSX 组件未加载');
            if (!window.JSZip) throw new Error('JSZip 组件未加载');
            if (typeof window.renderTables === 'function') window.renderTables();
            if (typeof window.calcSummary === 'function') window.calcSummary(true);
            await ensureTeacherRankings();

            const zip = new window.JSZip();
            const suffix = getDateSuffix();
            const includeCounty = hasCountyScope();
            const townshipRows = getTownshipRows();
            const allRows = getAllRows();

            await addWorkbook(zip, `二模成绩${suffix}.xlsx`, buildRawScoreWorkbook(allRows));
            await addWorkbook(zip, `学校/二模成绩分析${suffix}.xlsx`, buildSchoolAnalysisWorkbook('township'));
            if (includeCounty) await addWorkbook(zip, `学校/二模学校县域分析${suffix}.xlsx`, buildSchoolAnalysisWorkbook('county'));
            await addWorkbook(zip, `学生/二模学生乡镇考试明细.xlsx`, buildStudentDetailWorkbook(townshipRows, { includeCounty: false }));
            if (includeCounty) await addWorkbook(zip, `学生/二模学生考试明细 县域排名.xlsx`, buildStudentDetailWorkbook(allRows, { includeCounty: true }));
            await addWorkbook(zip, `教师/二模教师分析${suffix}.xlsx`, buildTeacherTownWorkbook());
            if (includeCounty) await addWorkbook(zip, `教师/二模教师县域分析${suffix}.xlsx`, buildTeacherCountyWorkbook());

            const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
            const link = document.createElement('a');
            const cohort = String(window.CURRENT_COHORT || window.CohortManager?.getCurrentCohort?.() || '').trim();
            link.href = URL.createObjectURL(blob);
            link.download = fileSafeName(`二模分析_${cohort || '当前届别'}_${getCurrentExamDate()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            toast(`已生成二模分析包：${link.download}`, 'success');
            return link.download;
        } catch (error) {
            console.error('[exam-analysis-package] download failed:', error);
            toast(`二模分析包生成失败：${error?.message || error}`, 'error');
            throw error;
        }
    }

    Object.assign(window, { downloadExamAnalysisPackage });
    window.__EXAM_ANALYSIS_PACKAGE_RUNTIME_PATCHED__ = true;
})();
