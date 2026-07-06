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
        if (value === null || value === undefined || String(value).trim() === '') return '';
        const number = Number(value);
        if (!Number.isFinite(number)) return '';
        return Number(number.toFixed(digits));
    }

    function pct(value) {
        if (value === null || value === undefined || String(value).trim() === '') return '';
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

    function getCurrentTeacherName() {
        const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
        return String(user?.name || user?.username || '').trim();
    }

    function getCohortGradeLabel() {
        const examId = String(window.CURRENT_EXAM_ID || '').trim();
        const cohortFromExam = (examId.match(/(\d{4})级/) || [])[1] || '';
        const cohort = String(window.CURRENT_COHORT_ID || window.CURRENT_COHORT || cohortFromExam || '').trim();
        const configName = String(window.CONFIG?.name || '').trim();
        const gradeMatch = configName.match(/[6-9]年级/) || examId.match(/[6-9]年级/);
        const grade = gradeMatch ? gradeMatch[0] : (configName || '当前年级');
        const cohortLabel = cohort ? `${cohort.replace(/届$/, '')}届` : '当前届别';
        return `${cohortLabel}${grade}`;
    }

    function isGrade9Exam() {
        const source = `${window.CONFIG?.name || ''} ${window.CURRENT_EXAM_ID || ''} ${getCohortGradeLabel()}`;
        return /9\s*年级|九年级/.test(source);
    }

    function sameSchool(left, right) {
        if (typeof window.sameAppSchoolName === 'function') return window.sameAppSchoolName(left, right);
        if (typeof window.areSchoolNamesEquivalent === 'function') return window.areSchoolNamesEquivalent(left, right);
        return String(left || '').trim() === String(right || '').trim();
    }

    function getSchoolLookupKeys(name, extraNames = []) {
        const keys = new Set();
        const add = (value) => {
            const text = String(value || '').trim();
            if (!text) return;
            keys.add(text);
            if (typeof window.normalizeSchoolName === 'function') {
                const normalized = window.normalizeSchoolName(text);
                if (normalized) keys.add(normalized);
            }
            if (typeof window.getCanonicalSchoolName === 'function') {
                const canonical = window.getCanonicalSchoolName(text);
                if (canonical) keys.add(canonical);
            }
        };
        add(name);
        (Array.isArray(extraNames) ? extraNames : []).forEach(add);
        return Array.from(keys);
    }

    function mapRowsBySchool(rows, nameIndex = 0, extraNamesGetter = null) {
        const map = new Map();
        (rows || []).forEach((row) => {
            const name = Array.isArray(row) ? row[nameIndex] : row?.name;
            const extraNames = typeof extraNamesGetter === 'function' ? extraNamesGetter(row) : [];
            getSchoolLookupKeys(name, extraNames).forEach((key) => map.set(key, row));
        });
        return map;
    }

    function findSchoolRow(map, name) {
        for (const key of getSchoolLookupKeys(name)) {
            if (map.has(key)) return map.get(key);
        }
        for (const row of map.values()) {
            const rowName = Array.isArray(row) ? row[0] : row?.name;
            if (sameSchool(rowName, name)) return row;
        }
        return null;
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

    function getHighSchoolAdmissionLine() {
        const indicator = typeof window.readIndicatorState === 'function'
            ? window.readIndicatorState()
            : (window.SYS_VARS?.indicator || {});
        const value = indicator?.highSchoolLine
            || indicator?.graduateHighSchoolLine
            || window.document?.getElementById?.('dm_high_school_line_input')?.value
            || '';
        const line = Number(value);
        return Number.isFinite(line) && line > 0 ? line : 0;
    }

    const townshipSchoolPackageCache = new Map();
    let townshipSchoolPackageNames = null;

    function isTownshipSchoolForPackage(schoolName) {
        const name = String(schoolName || '').trim();
        if (!name) return false;
        if (townshipSchoolPackageCache.has(name)) return townshipSchoolPackageCache.get(name);
        if (!townshipSchoolPackageNames) townshipSchoolPackageNames = Object.keys(window.SCHOOLS || {});
        const schoolNames = townshipSchoolPackageNames;
        let result;
        if (typeof window.isTownshipManagedSchool === 'function') {
            result = window.isTownshipManagedSchool(name, schoolNames);
        } else {
            result = getTownshipSchools().some((school) => sameSchool(school?.name, name));
        }
        townshipSchoolPackageCache.set(name, result);
        return result;
    }

    function hasCountyScope() {
        const rows = getAllRows();
        const townshipRows = getTownshipRows();
        const scope = window.CountyAnalysisRuntime?.getCurrentScope?.();
        if (scope && scope.includesCounty) return true;
        return rows.length > 0 && townshipRows.length > 0 && rows.length > townshipRows.length;
    }

    function cloneStyle(style) {
        return style ? JSON.parse(JSON.stringify(style)) : {};
    }

    function mergeCellStyle(cell, patch) {
        if (!cell) return;
        const base = cloneStyle(cell.s);
        cell.s = {
            ...base,
            ...patch,
            font: { ...(base.font || {}), ...(patch.font || {}) },
            fill: patch.fill || base.fill,
            alignment: { ...(base.alignment || {}), ...(patch.alignment || {}) },
            border: patch.border || base.border
        };
    }

    function textDisplayWidth(value) {
        return String(value ?? '').split('').reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? 2 : 1), 0);
    }

    function isMarkerHeader(header) {
        return /^_/.test(String(header || '')) || /标记/.test(String(header || ''));
    }

    function rowHasHighlightMarker(row) {
        return (Array.isArray(row) ? row : []).some((value) => /本校|本校教师|当前教师/.test(String(value || '')));
    }

    function getTwoRateWeightsForPackage() {
        return isGrade9Exam()
            ? { avg: 50, excellent: 80, pass: 50 }
            : { avg: 60, excellent: 70, pass: 70 };
    }

    function assignCompetitionRanks(rows, valueGetter, rankKey) {
        const sorted = (rows || [])
            .filter((row) => Number.isFinite(Number(valueGetter(row))))
            .sort((left, right) => Number(valueGetter(right)) - Number(valueGetter(left)));
        let lastValue = null;
        let lastRank = 0;
        sorted.forEach((row, index) => {
            const value = Number(valueGetter(row));
            const rank = lastValue !== null && Math.abs(value - lastValue) < 0.0001 ? lastRank : index + 1;
            row[rankKey] = rank;
            lastValue = value;
            lastRank = rank;
        });
    }

    function getRankValue(header, value) {
        if (!/排|名次|序号/.test(String(header || ''))) return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function buildPackageColumns(rows, range, hiddenCols) {
        return Array.from({ length: range.e.c + 1 }, (_, index) => {
            const header = rows?.[0]?.[index] ?? '';
            if (hiddenCols.has(index)) return { hidden: true, wch: 0 };
            let maxWidth = textDisplayWidth(header);
            for (let R = 1; R <= Math.min(range.e.r, 80); R += 1) {
                maxWidth = Math.max(maxWidth, textDisplayWidth(rows?.[R]?.[index] ?? ''));
            }
            const headerText = String(header || '');
            const numericLike = /分|率|排|人数|名次|序号|考场/.test(headerText);
            const minWidth = index === 0 ? 10 : (numericLike ? 9 : 12);
            const maxAllowed = /内容|说明|学科/.test(headerText)
                ? 46
                : (/学校|教师/.test(headerText) ? 28 : (/姓名/.test(headerText) ? 14 : (maxWidth > 24 ? 42 : 18)));
            return { wch: Math.max(minWidth, Math.min(maxWidth + 3, maxAllowed)) };
        });
    }

    function applyPackageSheetStyle(ws, rows) {
        if (!ws?.['!ref']) return;
        const range = window.XLSX.utils.decode_range(ws['!ref']);
        const markerCols = new Set();
        const hiddenCols = new Set();
        const headers = Array.isArray(rows?.[0]) ? rows[0] : [];
        headers.forEach((header, index) => {
            if (isMarkerHeader(header)) {
                markerCols.add(index);
                hiddenCols.add(index);
            }
        });
        for (let R = range.s.r; R <= range.e.r; R += 1) {
            const row = rows?.[R] || [];
            const marker = markerCols.size
                ? Array.from(markerCols).map((index) => String(row[index] || '')).filter(Boolean).join(' / ')
                : '';
            const highlight = R > 0 && (marker || rowHasHighlightMarker(row));
            for (let C = range.s.c; C <= range.e.c; C += 1) {
                const ref = window.XLSX.utils.encode_cell({ r: R, c: C });
                const cell = ws[ref];
                if (!cell) continue;
                const header = headers[C] || '';
                const rankValue = R > 0 ? getRankValue(header, cell.v) : null;
                const isTextIdentityCol = /学校|教师|姓名/.test(String(header || '')) || C === 0;
                mergeCellStyle(cell, {
                    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
                    font: R === 0
                        ? { bold: true, color: { rgb: 'FFFFFF' } }
                        : {
                            bold: highlight && isTextIdentityCol,
                            color: rankValue && rankValue <= 3 ? { rgb: 'DC2626' } : (highlight ? { rgb: '0F3D5E' } : { rgb: '111827' })
                        },
                    fill: R === 0
                        ? { fgColor: { rgb: '0F766E' } }
                        : (highlight ? { fgColor: { rgb: 'EAF6FF' } } : { fgColor: { rgb: R % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } }),
                    border: {
                        top: { style: 'thin', color: { rgb: 'D8DEE6' } },
                        bottom: { style: 'thin', color: { rgb: 'D8DEE6' } },
                        left: { style: 'thin', color: { rgb: highlight && C === range.s.c ? '0284C7' : 'D8DEE6' } },
                        right: { style: 'thin', color: { rgb: 'D8DEE6' } }
                    }
                });
                if (rankValue && rankValue <= 3) {
                    mergeCellStyle(cell, {
                        font: { bold: true, color: { rgb: 'DC2626' } }
                    });
                }
                if (typeof cell.v === 'number') cell.z = Number.isInteger(cell.v) ? '#,##0' : '0.00';
            }
        }
        ws['!autofilter'] = { ref: ws['!ref'] };
        ws['!cols'] = buildPackageColumns(rows, range, hiddenCols);
        ws['!rows'] = Array.from({ length: range.e.r + 1 }, (_, index) => ({ hpt: index === 0 ? 26 : 22 }));
    }

    function addWorksheet(workbook, name, rows, options = {}) {
        const ws = window.XLSX.utils.aoa_to_sheet(rows && rows.length ? rows : [['暂无数据']]);
        if (options.freeze) ws['!freeze'] = options.freeze;
        applyPackageSheetStyle(ws, rows);
        window.XLSX.utils.book_append_sheet(workbook, ws, excelSafeName(name));
        return ws;
    }

    function addWorksheetIfUseful(workbook, name, rows, options = {}) {
        if (!Array.isArray(rows) || rows.length <= 1) return null;
        return addWorksheet(workbook, name, rows, options);
    }

    function workbookToArrayBuffer(workbook) {
        return window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    }

    function schoolRankRows(schools, subject, scope = 'township') {
        if (scope === 'county') {
            return countySchoolRankRows(schools, subject);
        }
        const isTotal = subject === 'total';
        const title = isTotal ? (window.CONFIG?.label || '总分') : subject;
        const rows = [[
            '序号', '学校', '实考人数', `${title}平均分`, '优秀率(%)', '及格率(%)',
            '平均分排名', '优秀率排名', '及格率排名', '两率一分', '综合排名', '_标记'
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
                metric.count || 0,
                num(metric.avg),
                pct(metric.excRate),
                pct(metric.passRate),
                ranking.avg || '',
                ranking.excRate || '',
                ranking.passRate || '',
                num(isTotal ? school.score2Rate : ((metric.ratedAvg || 0) + (metric.ratedExc || 0) + (metric.ratedPass || 0))),
                isTotal ? (school.rank2Rate || '') : '',
                sameSchool(school.name, mySchool) ? '本校' : ''
            ]);
        });
        return rows;
    }

    function countySchoolRankRows(schools, subject) {
        const isTotal = subject === 'total';
        const title = isTotal ? (window.CONFIG?.label || '总分') : subject;
        const weights = getTwoRateWeightsForPackage();
        const entries = (schools || [])
            .filter((school) => school?.metrics?.[subject])
            .map((school) => {
                const metric = school.metrics[subject] || {};
                return {
                    school,
                    name: school.name || '',
                    count: Number(metric.count) || 0,
                    avg: Number(metric.avg) || 0,
                    excRate: Number(metric.excRate) || 0,
                    passRate: Number(metric.passRate) || 0
                };
            });
        const maxes = entries.reduce((acc, row) => {
            acc.avg = Math.max(acc.avg, row.avg);
            acc.excRate = Math.max(acc.excRate, row.excRate);
            acc.passRate = Math.max(acc.passRate, row.passRate);
            return acc;
        }, { avg: 0, excRate: 0, passRate: 0 });
        entries.forEach((row) => {
            row.ratedAvg = maxes.avg ? row.avg / maxes.avg * weights.avg : 0;
            row.ratedExc = maxes.excRate ? row.excRate / maxes.excRate * weights.excellent : 0;
            row.ratedPass = maxes.passRate ? row.passRate / maxes.passRate * weights.pass : 0;
            row.score = row.ratedAvg + row.ratedExc + row.ratedPass;
        });
        assignCompetitionRanks(entries, (row) => row.avg, 'rankAvg');
        assignCompetitionRanks(entries, (row) => row.excRate, 'rankExc');
        assignCompetitionRanks(entries, (row) => row.passRate, 'rankPass');
        assignCompetitionRanks(entries, (row) => row.score, 'rankScore');
        entries.sort((left, right) => (left.rankScore || 9999) - (right.rankScore || 9999) || String(left.name).localeCompare(String(right.name), 'zh-CN', { numeric: true }));

        const rows = [[
            '序号', '学校名称', '实考人数', `${title}平均分`, '平均分排名', '优秀率(%)', '优秀率排名',
            '及格率(%)', '及格率排名', '平均分赋分', '优秀率赋分', '及格率赋分',
            isTotal ? '两率一分总分' : '两率一分', '县域排名', '_标记'
        ]];
        entries.forEach((entry, index) => {
            rows.push([
                index + 1,
                entry.name,
                entry.count,
                num(entry.avg),
                entry.rankAvg || '',
                pct(entry.excRate),
                entry.rankExc || '',
                pct(entry.passRate),
                entry.rankPass || '',
                num(entry.ratedAvg),
                num(entry.ratedExc),
                num(entry.ratedPass),
                num(entry.score),
                entry.rankScore || '',
                sameSchool(entry.name, getMySchoolName()) ? '本校' : ''
            ]);
        });
        return rows;
    }

    function getSchoolScoreForHorizontal(school, scope) {
        if (scope === 'county') {
            const metric = school?.metrics?.total || {};
            const score = Number(metric.countyScore2Rate ?? school?.countyScore2Rate);
            if (Number.isFinite(score) && score > 0) return score;
        }
        return Number(school?.score2Rate) || 0;
    }

    function buildSchoolMetricRankMap(schools, subject) {
        const entries = (schools || [])
            .filter((school) => school?.metrics?.[subject])
            .map((school) => ({ school, metric: school.metrics[subject] || {} }));
        const rankMap = new Map();
        const assign = (key, valueGetter) => {
            const ranked = entries
                .filter((entry) => Number.isFinite(Number(valueGetter(entry))))
                .sort((left, right) => Number(valueGetter(right)) - Number(valueGetter(left)));
            let lastValue = null;
            let lastRank = 0;
            ranked.forEach((entry, index) => {
                const value = Number(valueGetter(entry));
                const rank = lastValue !== null && Math.abs(value - lastValue) < 0.0001 ? lastRank : index + 1;
                if (!rankMap.has(entry.school)) rankMap.set(entry.school, {});
                rankMap.get(entry.school)[key] = rank;
                lastValue = value;
                lastRank = rank;
            });
        };
        assign('avg', (entry) => entry.metric.avg);
        assign('excRate', (entry) => entry.metric.excRate);
        assign('passRate', (entry) => entry.metric.passRate);
        return rankMap;
    }

    function buildSchoolAnalysisWorkbook(scope = 'township') {
        const wb = window.XLSX.utils.book_new();
        const schools = scope === 'county' ? Object.values(window.SCHOOLS || {}) : getTownshipSchools();
        const subjects = getSubjectList(getAllRows());
        if (scope !== 'county') addWorksheet(wb, '综合分析报告', buildComprehensiveSummaryRows(schools, subjects, scope));
        addWorksheet(wb, '横向对比一览表', buildHorizontalRows(schools, subjects, scope));
        if (scope !== 'county' && isGrade9Exam()) addWorksheet(wb, '9年级专项核算对照表', buildSupportMetricComparisonRows(schools));
        addWorksheet(wb, '五科总 - 综合分析表', schoolRankRows(schools, 'total', scope));
        subjects.forEach((subject) => addWorksheet(wb, `${subject} 学科明细`, schoolRankRows(schools, subject, scope)));
        if (scope !== 'county') {
            addWorksheetIfUseful(wb, '高分段赋分详情', buildHighScoreRows(schools));
            addWorksheetIfUseful(wb, '指标生达标核算', buildIndicatorRows());
            if (isGrade9Exam()) addWorksheetIfUseful(wb, '高中上线率赋分详情', buildHighSchoolAdmissionRows(schools));
            addWorksheetIfUseful(wb, '后三分之一学生核算', buildBottomRows(schools));
        }
        return wb;
    }

    function getIndicatorScoreMap() {
        let indicatorRows = [];
        if (Array.isArray(window.INDICATOR_LAST_RESULT) && window.INDICATOR_LAST_RESULT.length) {
            indicatorRows = window.INDICATOR_LAST_RESULT;
        } else if (Array.isArray(window.__LAST_INDICATOR_CALC_DATA__) && window.__LAST_INDICATOR_CALC_DATA__.length) {
            indicatorRows = window.__LAST_INDICATOR_CALC_DATA__;
        } else if (typeof window.calcIndicators === 'function') {
            try {
                const result = window.calcIndicators(true);
                if (Array.isArray(result)) indicatorRows = result;
            } catch (error) {
                console.warn('[exam-analysis-package] indicator warmup failed:', error);
            }
        }
        const map = new Map();
        indicatorRows.forEach((row) => {
            const score = Number(row?.finalScore);
            if (!Number.isFinite(score)) return;
            const names = [row?.name, ...(Array.isArray(row?.rawNames) ? row.rawNames : [])]
                .map((name) => String(name || '').trim())
                .filter(Boolean);
            names.forEach((name) => {
                map.set(name, score);
                if (typeof window.normalizeSchoolName === 'function') {
                    const normalized = window.normalizeSchoolName(name);
                    if (normalized) map.set(normalized, score);
                }
            });
        });
        return map;
    }

    function getIndicatorScoreForSchool(school, indicatorScoreMap) {
        const name = String(school?.name || '').trim();
        const normalized = typeof window.normalizeSchoolName === 'function' ? window.normalizeSchoolName(name) : '';
        return Number(school?.scoreInd) || indicatorScoreMap.get(name) || indicatorScoreMap.get(normalized) || 0;
    }

    function buildComprehensiveSummaryRows(schools, subjects, scope) {
        const grade9 = isGrade9Exam();
        const indicatorScoreMap = grade9 ? getIndicatorScoreMap() : new Map();
        const highScoreMap = grade9 ? getHighScoreMap(schools) : new Map();
        const highSchoolAdmissionMap = grade9 ? getHighSchoolAdmissionMap(schools) : new Map();
        const rows = [[
            '学校名称',
            '两率一分得分',
            '后1/3得分',
            ...(grade9 ? ['指标生得分', '高分段赋分(50)', '高中上线率赋分(50)'] : []),
            '综合总分',
            '总排名',
            '_标记'
        ]];
        const summaryRows = (schools || [])
            .filter((school) => school && school.name)
            .map((school) => {
                const twoRates = Number(school.score2Rate) || 0;
                const bottom = Number(school.scoreBottom) || 0;
                const indicator = grade9 ? getIndicatorScoreForSchool(school, indicatorScoreMap) : 0;
                const highScoreName = String(school.name || '').trim();
                const highScoreKey = typeof window.normalizeSchoolName === 'function' ? window.normalizeSchoolName(highScoreName) : '';
                const highScore = grade9 ? (highScoreMap.get(highScoreName) ?? highScoreMap.get(highScoreKey) ?? 0) : 0;
                const highSchoolAdmission = grade9 ? (highSchoolAdmissionMap.get(highScoreName) ?? highSchoolAdmissionMap.get(highScoreKey) ?? 0) : 0;
                return {
                    name: school.name || '',
                    twoRates,
                    bottom,
                    indicator,
                    highScore,
                    highSchoolAdmission,
                    total: twoRates + bottom + indicator + highScore + highSchoolAdmission
                };
            })
            .sort((left, right) => right.total - left.total || String(left.name).localeCompare(String(right.name), 'zh-CN', { numeric: true }))
            .map((item, index) => ({ ...item, rank: index + 1 }));

        summaryRows.forEach((item) => {
            rows.push([
                item.name,
                num(item.twoRates),
                num(item.bottom),
                ...(grade9 ? [num(item.indicator), num(item.highScore), num(item.highSchoolAdmission)] : []),
                num(item.total),
                item.rank,
                sameSchool(item.name, getMySchoolName()) ? '本校' : ''
            ]);
        });

        rows.push([]);
        rows.push(['考试概况', '内容']);
        rows.push(['考试', getExamLabel()]);
        rows.push(['考试日期', getCurrentExamDate()]);
        rows.push(['范围', scope === 'county' ? '县域全部学校' : '乡镇学校']);
        rows.push(['本校', getMySchoolName()]);
        rows.push(['学校数', schools.length]);
        rows.push(['学生数', scope === 'county' ? getAllRows().length : getTownshipRows().length]);
        rows.push(['学科', subjects.join('、')]);
        return rows;
    }

    function formatHorizontalValue(value, rank, options = {}) {
        const display = options.percent ? pct(value) : num(value);
        if (display === '') return '';
        return `${display}${options.percent ? '%' : ''}${rank ? `（${rank}）` : ''}`;
    }

    function getHorizontalMetricRank(rankMaps, school, subject, key, scope) {
        if (scope === 'county') return rankMaps.get(subject)?.get(school)?.[key] || '';
        return school?.rankings?.[subject]?.[key] || rankMaps.get(subject)?.get(school)?.[key] || '';
    }

    function buildHorizontalRows(schools, subjects, scope = 'township') {
        const sortedSchools = schools.slice().sort((a, b) => {
            const leftRank = scope === 'county' ? (a.countyRank2Rate || 9999) : (a.rank2Rate || 9999);
            const rightRank = scope === 'county' ? (b.countyRank2Rate || 9999) : (b.rank2Rate || 9999);
            if (leftRank !== rightRank) return leftRank - rightRank;
            return getSchoolScoreForHorizontal(b, scope) - getSchoolScoreForHorizontal(a, scope);
        });
        const rankMaps = new Map([...subjects, 'total'].map((subject) => [subject, buildSchoolMetricRankMap(schools, subject)]));
        const rows = [['统计项目 / 学校', ...sortedSchools.map((school) => `${school.name}${sameSchool(school.name, getMySchoolName()) ? '（本校）' : ''}`)]];
        [...subjects, 'total'].forEach((subject) => {
            const label = subject === 'total' ? (window.CONFIG?.label || '总分') : subject;
            rows.push([`${label}平均分（排名）`, ...sortedSchools.map((school) => formatHorizontalValue(
                school.metrics?.[subject]?.avg,
                getHorizontalMetricRank(rankMaps, school, subject, 'avg', scope)
            ))]);
            rows.push([`${label}优秀率（排名）`, ...sortedSchools.map((school) => formatHorizontalValue(
                school.metrics?.[subject]?.excRate,
                getHorizontalMetricRank(rankMaps, school, subject, 'excRate', scope),
                { percent: true }
            ))]);
            rows.push([`${label}及格率（排名）`, ...sortedSchools.map((school) => formatHorizontalValue(
                school.metrics?.[subject]?.passRate,
                getHorizontalMetricRank(rankMaps, school, subject, 'passRate', scope),
                { percent: true }
            ))]);
        });
        return rows;
    }

    function getHighScoreMap(schools) {
        const map = new Map();
        buildHighScoreRows(schools).slice(1).forEach((row) => {
            const name = String(row?.[0] || '').trim();
            if (!name) return;
            const score = Number(row?.[4]);
            if (!Number.isFinite(score)) return;
            map.set(name, score);
            if (typeof window.normalizeSchoolName === 'function') {
                const normalized = window.normalizeSchoolName(name);
                if (normalized) map.set(normalized, score);
            }
        });
        return map;
    }

    function getHighSchoolAdmissionMap(schools) {
        const map = new Map();
        buildHighSchoolAdmissionRows(schools).slice(1).forEach((row) => {
            const name = String(row?.[0] || '').trim();
            if (!name) return;
            const score = Number(row?.[5]);
            if (!Number.isFinite(score)) return;
            map.set(name, score);
            if (typeof window.normalizeSchoolName === 'function') {
                const normalized = window.normalizeSchoolName(name);
                if (normalized) map.set(normalized, score);
            }
        });
        return map;
    }

    function buildHighScoreRows(schools) {
        const rows = [['学校名称', '实考人数', '高分人数(≥490)', '高分率(%)', '高分赋分(50)', '排名', '_标记']];
        const baseList = (schools || []).map((school) => {
            const students = Array.isArray(school.students) ? school.students : getAllRows().filter((student) => sameSchool(student?.school, school.name));
            const studentCount = Number(school.metrics?.total?.count) || (Array.isArray(school.students) ? school.students.length : 0);
            const highCount = students.filter((student) => Number(student?.total) >= 490).length;
            const highRate = studentCount ? highCount / studentCount : 0;
            return {
                name: school.name || '',
                count: studentCount,
                highCount,
                highRate
            };
        });
        const maxHighRate = Math.max(...baseList.map((item) => item.highRate), 0);
        const list = baseList.map((item) => ({
            ...item,
            score: maxHighRate ? item.highRate / maxHighRate * 50 : 0
        })).sort((left, right) => right.score - left.score);
        list.forEach((item, index) => {
            rows.push([
                item.name,
                item.count,
                item.highCount,
                pct(item.highRate),
                num(item.score),
                index + 1,
                sameSchool(item.name, getMySchoolName()) ? '本校' : ''
            ]);
        });
        return rows;
    }

    function buildHighSchoolAdmissionRows(schools) {
        const line = getHighSchoolAdmissionLine();
        const rows = [['学校名称', '公办高中录取分数线', '实考人数', '高中上线人数', '高中上线率(%)', '高中上线率赋分(50)', '排名', '_标记']];
        const baseList = (schools || []).map((school) => {
            const students = Array.isArray(school.students) ? school.students : getAllRows().filter((student) => sameSchool(student?.school, school.name));
            const studentCount = Number(school.metrics?.total?.count) || students.length || 0;
            const admissionCount = line > 0 ? students.filter((student) => Number(student?.total) >= line).length : 0;
            const admissionRate = studentCount ? admissionCount / studentCount : 0;
            return {
                name: school.name || '',
                line,
                count: studentCount,
                admissionCount,
                admissionRate
            };
        });
        const maxAdmissionRate = Math.max(...baseList.map((item) => item.admissionRate), 0);
        const list = baseList.map((item) => ({
            ...item,
            score: maxAdmissionRate ? item.admissionRate / maxAdmissionRate * 50 : 0
        })).sort((left, right) => right.score - left.score || String(left.name).localeCompare(String(right.name), 'zh-CN', { numeric: true }));
        list.forEach((item, index) => {
            rows.push([
                item.name,
                item.line || '',
                item.count,
                item.admissionCount,
                pct(item.admissionRate),
                num(item.score),
                index + 1,
                sameSchool(item.name, getMySchoolName()) ? '本校' : ''
            ]);
        });
        return rows;
    }

    function getIndicatorCalcRows() {
        let rows = Array.isArray(window.__LAST_INDICATOR_CALC_DATA__) ? window.__LAST_INDICATOR_CALC_DATA__ : [];
        if (!rows.length && Array.isArray(window.INDICATOR_LAST_RESULT)) rows = window.INDICATOR_LAST_RESULT;
        if (!rows.length && typeof window.calcIndicators === 'function') {
            try {
                const result = window.calcIndicators(true);
                if (Array.isArray(result)) rows = result;
            } catch (_) {}
        }
        return Array.isArray(rows) ? rows.slice() : [];
    }

    function buildIndicatorRows() {
        const rows = getIndicatorCalcRows()
            .sort((left, right) => (Number(left.rank) || 9999) - (Number(right.rank) || 9999) || String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN', { numeric: true }));
        return [
            ['学校', '学生数', '目标匹配', '指标一目标/达标', '指标一基础分', '指标一附加分', '指标一小计', '指标二目标/达标', '指标二基础分', '指标二附加分', '指标二小计', '指标总分', '排名', '说明', '_标记'],
            ...rows.map((row) => [
                row.name || '',
                row.studentCount || '',
                row.targetKey || '',
                `${row.t1 || (row.invalidTarget ? '异常' : (row.missingTarget ? '未匹配' : 0))}/${row.r1 || 0}`,
                num(row.base1),
                num(row.bonus1),
                num(row.score1),
                `${row.t2 || (row.invalidTarget ? '异常' : (row.missingTarget ? '未匹配' : 0))}/${row.r2 || 0}`,
                num(row.base2),
                num(row.bonus2),
                num(row.score2),
                num(row.finalScore),
                row.rank || '',
                [
                    row.invalidTarget ? `目标异常：学生数${row.studentCount || 0}，原目标${row.rawT1 || 0}/${row.rawT2 || 0}` : '',
                    row.missingTarget ? '未匹配目标人数' : ''
                ].filter(Boolean).join('；'),
                sameSchool(row.name, getMySchoolName()) ? '本校' : ''
            ])
        ];
    }

    function buildBottomRows(schools) {
        const rows = [['学校', '总人数', '后1/3人数', '剔除人数', '有效后1/3均分', '后1/3得分', '排名', '_标记']];
        (schools || [])
            .slice()
            .sort((left, right) => (left.rankBottom || 9999) - (right.rankBottom || 9999) || String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN', { numeric: true }))
            .forEach((school) => {
                const bottom = school.bottom3 || {};
                rows.push([
                    school.name || '',
                    bottom.totalN || '',
                    bottom.bottomN || '',
                    bottom.excN || '',
                    num(bottom.avg),
                    num(school.scoreBottom),
                    school.rankBottom || '',
                    sameSchool(school.name, getMySchoolName()) ? '本校' : ''
                ]);
            });
        return rows;
    }

    function buildSupportMetricComparisonRows(schools) {
        const highRows = buildHighScoreRows(schools).slice(1);
        const indicatorCalcRows = getIndicatorCalcRows();
        const bottomRows = buildBottomRows(schools).slice(1);
        const highMap = mapRowsBySchool(highRows);
        const indicatorMap = mapRowsBySchool(indicatorCalcRows, 0, (row) => row?.rawNames || []);
        const bottomMap = mapRowsBySchool(bottomRows);
        return [
            ['学校', '高分人数', '高分率(%)', '高分赋分(50)', '高分排名', '指标一目标/达标', '指标二目标/达标', '指标总分', '指标排名', '后1/3均分', '后1/3得分', '后1/3排名', '_标记'],
            ...(schools || []).map((school) => {
                const name = String(school?.name || '').trim();
                const high = findSchoolRow(highMap, name) || [];
                const indicator = findSchoolRow(indicatorMap, name) || null;
                const bottom = findSchoolRow(bottomMap, name) || [];
                const indicatorOne = indicator
                    ? `${indicator.t1 || (indicator.invalidTarget ? '异常' : (indicator.missingTarget ? '未匹配' : 0))}/${indicator.r1 || 0}`
                    : '未设置目标';
                const indicatorTwo = indicator
                    ? `${indicator.t2 || (indicator.invalidTarget ? '异常' : (indicator.missingTarget ? '未匹配' : 0))}/${indicator.r2 || 0}`
                    : '未设置目标';
                return [
                    name,
                    high[2] ?? 0,
                    high[3] ?? 0,
                    high[4] ?? 0,
                    high[5] ?? '未排名',
                    indicatorOne,
                    indicatorTwo,
                    indicator ? num(indicator.finalScore) : 0,
                    indicator?.rank || '未参与',
                    bottom[4] ?? 0,
                    bottom[5] ?? 0,
                    bottom[6] ?? '未排名',
                    sameSchool(name, getMySchoolName()) ? '本校' : ''
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
            const data = [['学校', '班级', '姓名', '考号', '考场', ...subjects, window.CONFIG?.label || '总分', '_标记']];
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
                        num(student.total, 1),
                        sameSchool(student.school, getMySchoolName()) ? '本校' : ''
                    ]);
                });
            addWorksheet(wb, school, data, { freeze: { xSplit: 0, ySplit: 1 } });
        });
        return wb;
    }

    function studentRankKey(student) {
        return [
            student?.school,
            student?.class,
            student?.name,
            student?.id || student?.examNo,
            student?.total
        ].map((value) => String(value ?? '').trim()).join('::');
    }

    function writeStudentRank(rankMap, student, label, rank) {
        const current = rankMap.get(student) || {};
        current[label] = rank;
        rankMap.set(student, current);
        const key = studentRankKey(student);
        if (key.replace(/:/g, '')) {
            const keyed = rankMap.get(key) || {};
            keyed[label] = rank;
            rankMap.set(key, keyed);
        }
    }

    function assignStudentRankMap(rankMap, students, valueGetter, label) {
        const ranked = (students || [])
            .filter((student) => Number.isFinite(Number(valueGetter(student))))
            .sort((left, right) => Number(valueGetter(right)) - Number(valueGetter(left)));
        let lastValue = null;
        let lastRank = 0;
        ranked.forEach((student, index) => {
            const value = Number(valueGetter(student));
            const rank = lastValue !== null && Math.abs(value - lastValue) < 0.0001 ? lastRank : index + 1;
            writeStudentRank(rankMap, student, label, rank);
            lastValue = value;
            lastRank = rank;
        });
    }

    function buildStudentRankFallbacks(rows, subjects, includeCounty) {
        const rankMap = new Map();
        const list = Array.isArray(rows) ? rows : [];
        const townshipList = includeCounty ? getTownshipRows() : list;
        assignStudentRankMap(rankMap, townshipList, (student) => student.total, 'totalScope');
        if (includeCounty) assignStudentRankMap(rankMap, getAllRows(), (student) => student.total, 'totalCounty');

        const bySchool = new Map();
        const byClass = new Map();
        list.forEach((student) => {
            const school = String(student?.school || '').trim();
            const className = String(student?.class || '').trim();
            if (!bySchool.has(school)) bySchool.set(school, []);
            bySchool.get(school).push(student);
            const classKey = `${school}::${className}`;
            if (!byClass.has(classKey)) byClass.set(classKey, []);
            byClass.get(classKey).push(student);
        });
        bySchool.forEach((students) => assignStudentRankMap(rankMap, students, (student) => student.total, 'totalSchool'));
        byClass.forEach((students) => assignStudentRankMap(rankMap, students, (student) => student.total, 'totalClass'));

        (subjects || []).forEach((subject) => {
            assignStudentRankMap(rankMap, townshipList, (student) => student.scores?.[subject], `${subject}:scope`);
            if (includeCounty) assignStudentRankMap(rankMap, getAllRows(), (student) => student.scores?.[subject], `${subject}:county`);
            bySchool.forEach((students) => assignStudentRankMap(rankMap, students, (student) => student.scores?.[subject], `${subject}:school`));
        });
        return rankMap;
    }

    function getStudentFallbackRank(rankMap, student, key) {
        return rankMap.get(student)?.[key] || rankMap.get(studentRankKey(student))?.[key] || '';
    }

    function rankValueOrFallback(value, rankMap, student, key) {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : getStudentFallbackRank(rankMap, student, key);
    }

    function townshipRankValueOrBlank(value, rankMap, student, key, includeCounty) {
        if (includeCounty && !isTownshipSchoolForPackage(student?.school)) return '';
        return rankValueOrFallback(value, rankMap, student, key);
    }

    function buildStudentDetailWorkbook(rows, options = {}) {
        const subjects = getSubjectList(rows);
        const includeCounty = !!options.includeCounty;
        const fallbackRanks = buildStudentRankFallbacks(rows, subjects, includeCounty);
        const headers = ['学校', '班级', '姓名', '考号', '考场'];
        subjects.forEach((subject) => {
            headers.push(`${subject}分数`, `${subject}校排`, `${subject}镇排`);
            if (includeCounty) headers.push(`${subject}县排`);
        });
        headers.push(`${window.CONFIG?.label || '总分'}`, '总分班排', '总分校排', '总分镇排');
        if (includeCounty) headers.push('总分县排');
        headers.push('_标记');
        const data = [headers];
        rows.slice().sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0)).forEach((student) => {
            const row = [
                student.school || '',
                student.class || '',
                student.name || '',
                student.id || student.examNo || '',
                student.examRoom || ''
            ];
            subjects.forEach((subject) => {
                row.push(
                    student.scores?.[subject] ?? '',
                    rankValueOrFallback(student.ranks?.[subject]?.school, fallbackRanks, student, `${subject}:school`),
                    townshipRankValueOrBlank(student.ranks?.[subject]?.township, fallbackRanks, student, `${subject}:scope`, includeCounty)
                );
                if (includeCounty) row.push(rankValueOrFallback(student.ranks?.[subject]?.county, fallbackRanks, student, `${subject}:county`));
            });
            row.push(
                num(student.total, 1),
                rankValueOrFallback(student.ranks?.total?.class, fallbackRanks, student, 'totalClass'),
                rankValueOrFallback(student.ranks?.total?.school, fallbackRanks, student, 'totalSchool'),
                townshipRankValueOrBlank(student.ranks?.total?.township, fallbackRanks, student, 'totalScope', includeCounty)
            );
            if (includeCounty) row.push(rankValueOrFallback(student.ranks?.total?.county, fallbackRanks, student, 'totalCounty'));
            row.push(sameSchool(student.school, getMySchoolName()) ? '本校' : '');
            data.push(row);
        });
        const wb = window.XLSX.utils.book_new();
        addWorksheet(wb, '学生考试明细', data, { freeze: { xSplit: 5, ySplit: 1 } });
        return wb;
    }

    async function ensureTeacherRankings(includeCounty = false) {
        if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
            await window.SystemRuntimeLoader.load('teacher-analysis').catch(() => {});
        }
        if (typeof window.calculateTeacherTownshipRanking === 'function') {
            window.calculateTeacherTownshipRanking({ teacherMetricScope: 'admin' });
        }
        if (includeCounty && window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
            await window.SystemRuntimeLoader.load('county-analysis').catch(() => {});
            try {
                if (window.CountyAnalysisRuntime?.ensureTeacherContextForCountyAnalysis) {
                    await window.CountyAnalysisRuntime.ensureTeacherContextForCountyAnalysis(true, { requireActive: false });
                }
                if (window.CountyAnalysisRuntime?.applyCountyRanks) window.CountyAnalysisRuntime.applyCountyRanks();
                if (window.CountyAnalysisRuntime?.renderCountyAnalysis) window.CountyAnalysisRuntime.renderCountyAnalysis();
            } catch (error) {
                console.warn('[exam-analysis-package] county teacher ranking warmup failed:', error);
            }
        }
    }

    async function ensureSupportMetricsForPackage() {
        if (typeof window.renderHighScoreTable === 'function') {
            try {
                window.renderHighScoreTable();
            } catch (error) {
                console.warn('[exam-analysis-package] high-score warmup failed:', error);
            }
        }
        if (typeof window.renderBottom3TableOnly === 'function') {
            try {
                window.renderBottom3TableOnly();
            } catch (error) {
                console.warn('[exam-analysis-package] bottom3 warmup failed:', error);
            }
        }
        if (!isGrade9Exam()) return;
        try {
            if (typeof window.refreshIndicatorResults === 'function') {
                await Promise.resolve(window.refreshIndicatorResults(true, { waitForInputs: true, timeoutMs: 12000 }));
            } else if (typeof window.ensureIndicatorWorkspaceFromCloud === 'function') {
                await Promise.resolve(window.ensureIndicatorWorkspaceFromCloud('analysis-package', 12000));
            }
            if (typeof window.calcIndicators === 'function') window.calcIndicators(true);
        } catch (error) {
            console.warn('[exam-analysis-package] indicator warmup failed:', error);
        }
    }

    function buildTeacherMark(item) {
        const name = String(item?.name || '').trim();
        const currentTeacher = getCurrentTeacherName();
        if (item?.type === 'teacher') {
            return currentTeacher && name === currentTeacher ? '当前教师/本校教师' : '本校教师';
        }
        return sameSchool(name, getMySchoolName()) ? '本校' : '';
    }

    function buildTeacherTownWorkbook() {
        const wb = window.XLSX.utils.book_new();
        const data = window.TOWNSHIP_RANKING_DATA || {};
        const subjects = getSubjectList(getAllRows());
        subjects.forEach((subject) => {
            const rows = data[subject] || [];
            addWorksheet(wb, `${subject} 教师乡镇排名`, [
                ['教师/学校', '类型', '平均分', '乡镇均分排名', '优秀率(%)', '乡镇优率排名', '及格率(%)', '乡镇及格排名', '样本人数', '_对象标记'],
                ...rows.map((item) => [
                    item.name || '',
                    item.type === 'teacher' ? '教师' : '学校',
                    num(item.avg),
                    item.rankAvg || '',
                    pct(item.excellentRate),
                    item.rankExc || '',
                    pct(item.passRate),
                    item.rankPass || '',
                    item.studentCount || '',
                    buildTeacherMark(item)
                ])
            ]);
        });
        return wb;
    }

    function buildTeacherCountyWorkbook() {
        const wb = window.XLSX.utils.book_new();
        const rankingData = window.COUNTY_TEACHER_RANKING_DATA || {};
        const subjects = getSubjectList(getAllRows());
        subjects.forEach((subject) => {
            const rows = (rankingData[subject] || []).slice().sort((a, b) => {
                if ((a.rankAvg || 9999) !== (b.rankAvg || 9999)) return (a.rankAvg || 9999) - (b.rankAvg || 9999);
                if (a.type !== b.type) return a.type === 'teacher' ? -1 : 1;
                return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN', { numeric: true });
            });
            addWorksheet(wb, `${subject} 同学科县域排名`, [
                ['县均分排', '教师/学校', '类型', '平均分', '县优率排', '优秀率(%)', '县及格排', '及格率(%)', '样本人数', '_对象标记'],
                ...rows.map((item) => [
                    item.rankAvg || '',
                    item.name || '',
                    item.type === 'teacher' ? '教师' : '学校整体',
                    num(item.avg),
                    item.rankExc || '',
                    pct(item.excellentRate),
                    item.rankPass || '',
                    pct(item.passRate),
                    item.studentCount || '',
                    buildTeacherMark(item)
                ])
            ]);
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
            await ensureSupportMetricsForPackage();
            if (typeof window.calcSummary === 'function') window.calcSummary(true);

            const zip = new window.JSZip();
            const suffix = getDateSuffix();
            const includeCounty = hasCountyScope();
            const townshipRows = getTownshipRows();
            const allRows = getAllRows();
            await ensureTeacherRankings(includeCounty);

            await addWorkbook(zip, `二模成绩${suffix}.xlsx`, buildRawScoreWorkbook(allRows));
            await addWorkbook(zip, `学校/二模成绩分析${suffix}.xlsx`, buildSchoolAnalysisWorkbook('township'));
            if (includeCounty) await addWorkbook(zip, `学校/二模学校县域分析${suffix}.xlsx`, buildSchoolAnalysisWorkbook('county'));
            await addWorkbook(zip, `学生/二模学生乡镇考试明细.xlsx`, buildStudentDetailWorkbook(townshipRows, { includeCounty: false }));
            if (includeCounty) await addWorkbook(zip, `学生/二模学生考试明细 县域排名.xlsx`, buildStudentDetailWorkbook(allRows, { includeCounty: true }));
            await addWorkbook(zip, `教师/二模教师分析${suffix}.xlsx`, buildTeacherTownWorkbook());
            if (includeCounty) await addWorkbook(zip, `教师/二模教师县域分析${suffix}.xlsx`, buildTeacherCountyWorkbook());

            const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 1 } });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileSafeName(`二模分析_${getCohortGradeLabel()}_${getCurrentExamDate()}.zip`);
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
