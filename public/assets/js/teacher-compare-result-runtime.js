(() => {
    if (typeof window === 'undefined' || window.__TEACHER_COMPARE_RESULT_RUNTIME_PATCHED__) return;

const readTeacherCompareCacheState = typeof window.readTeacherCompareCacheState === 'function'
    ? window.readTeacherCompareCacheState
    : (() => (window.TEACHER_MULTI_PERIOD_COMPARE_CACHE && typeof window.TEACHER_MULTI_PERIOD_COMPARE_CACHE === 'object'
        ? window.TEACHER_MULTI_PERIOD_COMPARE_CACHE
        : null));
const setTeacherCompareCacheState = typeof window.setTeacherCompareCacheState === 'function'
    ? window.setTeacherCompareCacheState
    : ((cache) => {
        const nextCache = cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : null;
        window.TEACHER_MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    });
const readAllTeachersDiffCacheState = typeof window.readAllTeachersDiffCacheState === 'function'
    ? window.readAllTeachersDiffCacheState
    : (() => (window.ALL_TEACHERS_DIFF_CACHE && typeof window.ALL_TEACHERS_DIFF_CACHE === 'object'
        ? window.ALL_TEACHERS_DIFF_CACHE
        : null));
const setAllTeachersDiffCacheState = typeof window.setAllTeachersDiffCacheState === 'function'
    ? window.setAllTeachersDiffCacheState
    : ((cache) => {
        const nextCache = cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : null;
        window.ALL_TEACHERS_DIFF_CACHE = nextCache;
        return nextCache;
    });

function buildTeacherStatsForExam(rows, school, subjectFilter) {
    const rowsSchool = rows.filter(r => r.school === school);
    const classSet = new Set(rowsSchool.map(r => normalizeClass(r.class)));
    const excRatio = (CONFIG?.name && String(CONFIG.name).includes('9')) ? 0.15 : 0.2;

    const gradeStats = {};
    SUBJECTS.forEach(sub => {
        const vals = rowsSchool.map(r => parseFloat(r.scores?.[sub])).filter(v => !isNaN(v)).sort((a, b) => b - a);
        if (!vals.length) return;
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const exc = vals[Math.floor(vals.length * excRatio)] || 0;
        const pass = vals[Math.floor(vals.length * 0.5)] || 0;
        gradeStats[sub] = { avg, exc, pass, low: pass * 0.6 };
    });

    const bucket = {};
    Object.entries(TEACHER_MAP || {}).forEach(([key, teacherName]) => {
        const [rawClass, rawSubject] = String(key).split('_');
        const cls = normalizeClass(rawClass);
        const subject = SUBJECTS.find(s => normalizeSubject(s) === normalizeSubject(rawSubject));
        if (!cls || !subject || !classSet.has(cls)) return;
        if (subjectFilter && subject !== subjectFilter) return;
        const teacher = String(teacherName || '').trim();
        if (!teacher) return;

        const students = rowsSchool.filter(r => normalizeClass(r.class) === cls && !isNaN(parseFloat(r.scores?.[subject])));
        if (!students.length) return;

        const keyName = `${teacher}__${subject}`;
        if (!bucket[keyName]) bucket[keyName] = { teacher, subject, classes: new Set(), students: [] };
        bucket[keyName].classes.add(cls);
        bucket[keyName].students.push(...students);
    });

    const list = Object.values(bucket).map(item => {
        const gs = gradeStats[item.subject] || { avg: 0, exc: 0, pass: 0, low: 36 };
        const vals = item.students.map(s => parseFloat(s.scores[item.subject])).filter(v => !isNaN(v));
        const count = vals.length;
        const avg = count ? vals.reduce((a, b) => a + b, 0) / count : 0;
        const excellentRate = count ? vals.filter(v => v >= gs.exc).length / count : 0;
        const passRate = count ? vals.filter(v => v >= gs.pass).length / count : 0;
        const lowRate = count ? vals.filter(v => v < gs.low).length / count : 0;
        const contribution = avg - gs.avg;
        const finalScore = 30 + contribution + excellentRate * 30 + passRate * 30 - lowRate * 20;

        return {
            teacher: item.teacher,
            subject: item.subject,
            classes: [...item.classes].sort().join(','),
            studentCount: count,
            avg,
            excellentRate,
            passRate,
            lowRate,
            contribution,
            finalScore,
            subjectRank: 0,
            townshipRankAvg: null,
            townshipRankExc: null,
            townshipRankPass: null
        };
    });

    const bySubject = {};
    list.forEach(x => {
        if (!bySubject[x.subject]) bySubject[x.subject] = [];
        bySubject[x.subject].push(x);
    });
    Object.values(bySubject).forEach(arr => {
        arr.sort((a, b) => b.finalScore - a.finalScore);
        arr.forEach((x, i) => {
            if (i > 0 && Math.abs(x.finalScore - arr[i - 1].finalScore) < 0.0001) x.subjectRank = arr[i - 1].subjectRank;
            else x.subjectRank = i + 1;
        });
    });

    return list;
}

function attachTeacherTownshipAvgRank(rows, school, teacherStatsList) {
    const subjectSet = [...new Set(teacherStatsList.map(x => x.subject))];
    subjectSet.forEach(subject => {
        const ranking = [];
        teacherStatsList.filter(x => x.subject === subject).forEach(x => {
            ranking.push({ type: 'teacher', teacher: x.teacher, avg: x.avg, excellentRate: x.excellentRate, passRate: x.passRate });
        });

        const schoolScores = {};
        rows.forEach(r => {
            if (r.school === school) return;
            const score = parseFloat(r.scores?.[subject]);
            if (isNaN(score)) return;
            if (!schoolScores[r.school]) schoolScores[r.school] = [];
            schoolScores[r.school].push(score);
        });
        Object.entries(schoolScores).forEach(([name, vals]) => {
            if (!vals.length) return;
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            const excCount = vals.filter(v => v >= 85).length;
            const passCount = vals.filter(v => v >= 60).length;
            ranking.push({
                type: 'school',
                school: name,
                avg,
                excellentRate: vals.length ? (excCount / vals.length) : 0,
                passRate: vals.length ? (passCount / vals.length) : 0
            });
        });

        ranking.sort((a, b) => b.avg - a.avg);
        ranking.forEach((row, i) => { row.rankAvg = i + 1; });
        ranking.sort((a, b) => b.excellentRate - a.excellentRate);
        ranking.forEach((row, i) => { row.rankExc = i + 1; });
        ranking.sort((a, b) => b.passRate - a.passRate);
        ranking.forEach((row, i) => { row.rankPass = i + 1; });
        ranking.sort((a, b) => b.avg - a.avg);

        teacherStatsList.filter(x => x.subject === subject).forEach(x => {
            const mine = ranking.find(r => r.type === 'teacher' && r.teacher === x.teacher);
            x.townshipRankAvg = mine ? mine.rankAvg : null;
            x.townshipRankExc = mine ? mine.rankExc : null;
            x.townshipRankPass = mine ? mine.rankPass : null;
        });
    });
}

function renderTeacherMultiPeriodComparison() {
    const hintEl = document.getElementById('teacherCompareHint');
    const resultEl = document.getElementById('teacherCompareResult');
    const countEl = document.getElementById('teacherComparePeriodCount');
    const schoolEl = document.getElementById('teacherCompareSchool');
    const subjectEl = document.getElementById('teacherCompareSubject');
    const teacherEl = document.getElementById('teacherCompareTeacher');
    const e1El = document.getElementById('teacherCompareExam1');
    const e2El = document.getElementById('teacherCompareExam2');
    const e3El = document.getElementById('teacherCompareExam3');
    if (!hintEl || !resultEl || !countEl || !schoolEl || !subjectEl || !teacherEl || !e1El || !e2El || !e3El) return;

    const periodCount = parseInt(countEl.value || '2');
    const school = schoolEl.value;
    const subject = subjectEl.value;
    const teacher = teacherEl.value;
    const examIds = periodCount === 3 ? [e1El.value, e2El.value, e3El.value] : [e1El.value, e2El.value];

    if (!school || !subject || !teacher) {
        hintEl.innerHTML = '❌ 请先选择学校、学科、教师。';
        resultEl.innerHTML = '';
        return;
    }
    if (examIds.some(x => !x)) {
        hintEl.innerHTML = '❌ 请完整选择所有考试期次。';
        resultEl.innerHTML = '';
        return;
    }
    if (new Set(examIds).size !== examIds.length) {
        hintEl.innerHTML = '❌ 期次不能重复，请选择不同考试。';
        resultEl.innerHTML = '';
        return;
    }

    const examStats = examIds.map(examId => {
        const rows = getExamRowsForCompare(examId);
        const list = buildTeacherStatsForExam(rows, school, subject);
        attachTeacherTownshipAvgRank(rows, school, list);
        const current = list.find(x => x.teacher === teacher && x.subject === subject);
        return { examId, list, current };
    });

    if (examStats.some(x => !x.current)) {
        hintEl.innerHTML = '❌ 该教师在某些期次无有效数据（可能未任教该学科或缺少成绩）。';
        resultEl.innerHTML = '';
        return;
    }

    const metricRows = examStats.map(x => {
        const d = x.current;
        return `<tr><td>${x.examId}</td><td>${d.townshipRankAvg || '-'}</td><td>${d.townshipRankExc || '-'}</td><td>${d.townshipRankPass || '-'}</td></tr>`;
    }).join('');

    const first = examStats[0].current;
    const last = examStats[examStats.length - 1].current;
    const delta = {
        townshipAvg: (first.townshipRankAvg && last.townshipRankAvg) ? (first.townshipRankAvg - last.townshipRankAvg) : null,
        townshipExc: (first.townshipRankExc && last.townshipRankExc) ? (first.townshipRankExc - last.townshipRankExc) : null,
        townshipPass: (first.townshipRankPass && last.townshipRankPass) ? (first.townshipRankPass - last.townshipRankPass) : null
    };
    const dAvg = (typeof delta.townshipAvg === 'number') ? delta.townshipAvg : null;
    const dExc = (typeof delta.townshipExc === 'number') ? delta.townshipExc : null;
    const dPass = (typeof delta.townshipPass === 'number') ? delta.townshipPass : null;

    resultEl.innerHTML = `
            <div class="sub-header">👨‍🏫 教师同学科多期表现（${teacher} / ${subject}）</div>
            <div class="table-wrap"><table class="mobile-card-table"><thead><tr><th>期次</th><th>均分镇排</th><th>优秀率镇排</th><th>及格率镇排</th></tr></thead><tbody>${metricRows}</tbody></table></div>
            <div style="margin-top:8px; font-size:12px; color:#475569;">
                首末期变化（${examIds[0]} → ${examIds[examIds.length - 1]}）：
                均分镇排 ${dAvg === null ? '-' : (dAvg >= 0 ? '+' : '') + dAvg}，
                优秀率镇排 ${dExc === null ? '-' : (dExc >= 0 ? '+' : '') + dExc}，
                及格率镇排 ${dPass === null ? '-' : (dPass >= 0 ? '+' : '') + dPass}
            </div>
        `;

    hintEl.innerHTML = `✅ 已完成 ${periodCount} 期教师对比：${examIds.join(' → ')}`;
    hintEl.style.color = '#16a34a';
    window.TEACHER_MULTI_PERIOD_COMPARE_CACHE = { school, subject, teacher, examIds, periodCount, examStats, delta, metricRows };
    setTeacherCompareCacheState(window.TEACHER_MULTI_PERIOD_COMPARE_CACHE);
}

// 🆕 生成某学校所有教师的多期对比（大表模式）
function renderAllTeachersMultiPeriodComparison() {
    const hintEl = document.getElementById('teacherCompareHint');
    const resultEl = document.getElementById('teacherCompareResult');
    const countEl = document.getElementById('teacherComparePeriodCount');
    const schoolEl = document.getElementById('teacherCompareSchool');
    const e1El = document.getElementById('teacherCompareExam1');
    const e2El = document.getElementById('teacherCompareExam2');
    const e3El = document.getElementById('teacherCompareExam3');

    if (!hintEl || !resultEl || !countEl || !schoolEl || !e1El || !e2El || !e3El) return;

    const periodCount = parseInt(countEl.value || '2');
    const school = schoolEl.value;
    const examIds = periodCount === 3 ? [e1El.value, e2El.value, e3El.value] : [e1El.value, e2El.value];

    if (!school) return alert('请先选择学校');
    if (examIds.some(x => !x)) return alert('请先选择所有对比的考试期次');
    if (new Set(examIds).size !== examIds.length) return alert('期次不能重复');

    if (window.UI) UI.loading(true, `正在生成 ${school} 全校教师对比...`);

    // 1. 获取该校所有参与这几次考试的 (学科, 教师) 组合
    // 遍历所有期次，收集所有出现的教师
    const allTeachersSet = new Set();
    const teacherSubjectMap = {}; // "TeacherName": Set("Subject")

    // Helper: 从某次考试中提取该校所有教师数据
    const processExamForTeachers = (examId) => {
        const rows = getExamRowsForCompare(examId);
        // 与“乡镇排名”模块保持一致：只使用系统学科清单
        const subjects = Array.isArray(SUBJECTS) ? SUBJECTS : [];

        subjects.forEach(sub => {
            // 计算该次考试、该校、该学科的所有教师
            const stats = buildTeacherStatsForExam(rows, school, sub);
            stats.forEach(s => {
                if (s.teacher && s.teacher !== '未分配') {
                    allTeachersSet.add(s.teacher);
                    if (!teacherSubjectMap[s.teacher]) teacherSubjectMap[s.teacher] = new Set();
                    teacherSubjectMap[s.teacher].add(sub);
                }
            });
        });
    };

    examIds.forEach(eid => processExamForTeachers(eid));

    if (allTeachersSet.size === 0) {
        if (window.UI) UI.loading(false);
        return alert('未找到该校的相关教师数据');
    }

    // 2. 对每个 (教师, 学科) 生成对比数据
    const results = [];

    for (const teacher of allTeachersSet) {
        const subjects = teacherSubjectMap[teacher];
        for (const subject of subjects) {
            // 计算该教师在该学科的多期表现
            const examStats = examIds.map(examId => {
                const rows = getExamRowsForCompare(examId);
                const list = buildTeacherStatsForExam(rows, school, subject);
                attachTeacherTownshipAvgRank(rows, school, list);
                const current = list.find(x => x.teacher === teacher && x.subject === subject);
                return { examId, current };
            });

            // 只有当至少有一期有数据时才展示？或者要求每一期都有？
            // 通常多期对比要求连续性，或者至少显示变化。如果某一期没数据，那变化就是 null
            // 这里策略：只要有一期有数据就列出，但变化值可能为空

            const validPoints = examStats.filter(x => x.current).length;
            if (validPoints === 0) continue;

            const firstStats = examStats[0].current;
            const lastStats = examStats[examStats.length - 1].current;

            let rowData = {
                teacher,
                subject,
                details: examStats // 包含每一期的数据
            };

            // 计算变化 (Last - First)
            if (firstStats && lastStats) {
                rowData.delta = {
                    townshipAvg: (firstStats.townshipRankAvg && lastStats.townshipRankAvg) ? (firstStats.townshipRankAvg - lastStats.townshipRankAvg) : null,
                    townshipExc: (firstStats.townshipRankExc && lastStats.townshipRankExc) ? (firstStats.townshipRankExc - lastStats.townshipRankExc) : null,
                    townshipPass: (firstStats.townshipRankPass && lastStats.townshipRankPass) ? (firstStats.townshipRankPass - lastStats.townshipRankPass) : null
                };
            } else {
                rowData.delta = null;
            }

            results.push(rowData);
        }
    }

    // 3. 排序：按学科 -> 教师名
    results.sort((a, b) => {
        if (a.subject !== b.subject) {
            if (typeof sortSubjects === 'function') return sortSubjects(a.subject, b.subject);
            return a.subject.localeCompare(b.subject, 'zh');
        }
        return a.teacher.localeCompare(b.teacher, 'zh');
    });

    // 4. 渲染大表格
    // 表头：教师 | 学科 | 第1期(均分/优率/绩效) | ... | 第N期(...) | 变化(均分/绩效)
    // 为了不过分拥挤，列可以精简：只显示 均分/绩效/校名次 ? 
    // 用户通常关注：均分、贡献值、绩效分、校内排名。

    let ths = `<th>教师</th><th>学科</th>`;
    examIds.forEach(eid => {
        // 简写期次名
        const shortName = eid.split('-').pop() || eid;
        ths += `<th style="background:#f1f5f9; border-left:2px solid white;">${shortName}<br><span style="font-size:10px;font-weight:normal">均镇排|优镇排|及格镇排</span></th>`;
    });
    ths += `<th style="background:#fff7ed; border-left:2px solid white;">变化<br><span style="font-size:10px;font-weight:normal">均镇排|优镇排|及格镇排</span></th>`;

    const trs = results.map(r => {
        let tds = `<td style="font-weight:bold;">${r.teacher}</td><td>${r.subject}</td>`;

        r.details.forEach(p => {
            if (p.current) {
                const c = p.current;
                tds += `<td style="border-left:1px solid #e2e8f0; text-align:center;">
                        <div style="font-size:11px; color:#334155;">均 #${(typeof c.townshipRankAvg === 'number' ? c.townshipRankAvg : '-')}</div>
                        <div style="font-size:11px; color:#334155;">优 #${(typeof c.townshipRankExc === 'number' ? c.townshipRankExc : '-')}</div>
                        <div style="font-size:11px; color:#334155;">及 #${(typeof c.townshipRankPass === 'number' ? c.townshipRankPass : '-')}</div>
                    </td>`;
            } else {
                tds += `<td style="border-left:1px solid #e2e8f0; text-align:center; color:#cbd5e1;">-</td>`;
            }
        });

        if (r.delta) {
            const d = r.delta;
            const fmtDelta = (deltaVal) => {
                if (typeof deltaVal !== 'number') return '<span style="color:#94a3b8;">-</span>';
                const color = deltaVal > 0 ? 'green' : (deltaVal < 0 ? 'red' : 'gray');
                const icon = deltaVal > 0 ? '↑' : (deltaVal < 0 ? '↓' : '-');
                return `<span style="color:${color};">${icon} ${Math.abs(deltaVal)}</span>`;
            };

            tds += `<td style="border-left:1px solid #e2e8f0; text-align:center; background:#fffbf0;">
                    <div style="font-size:11px;">均 ${fmtDelta(d.townshipAvg)}</div>
                    <div style="font-size:11px;">优 ${fmtDelta(d.townshipExc)}</div>
                    <div style="font-size:11px;">及 ${fmtDelta(d.townshipPass)}</div>
                </td>`;
        } else {
            tds += `<td style="border-left:1px solid #e2e8f0; text-align:center; background:#fffbf0; color:#cbd5e1;">-</td>`;
        }

        return `<tr>${tds}</tr>`;
    }).join('');

    resultEl.innerHTML = `
            <div class="sub-header" style="color:#ea580c;">📊 全校教师多期对比总表（${school}）</div>
            <div class="table-wrap" style="max-height:600px; overflow-y:auto;">
                <table class="common-table" style="font-size:13px;">
                    <thead style="position:sticky; top:0; z-index:10;"><tr>${ths}</tr></thead>
                    <tbody>${trs}</tbody>
                </table>
            </div>
            <div style="margin-top:10px; display:flex; gap:10px;">
                <button class="btn btn-sm" onclick="exportAllTeachersMultiPeriodDiff('${school}', '${examIds.join('_')}')">📤 导出Excel</button>
            </div>
        `;

    // 缓存结果用于导出和云端保存
    setAllTeachersDiffCacheState({ results, school, examIds, periodCount });
    window.TEACHER_MULTI_PERIOD_COMPARE_CACHE = {
        school,
        subject: '全学科',
        teacher: '全校教师',
        examIds,
        periodCount,
        delta: null, // 全校模式无单一变化量
        metricRows: trs, // 复用 HTML
        isBatchMode: true, // 标记为批量模式
        batchResults: results, // 保存完整数据对象
        thsHtml: ths // 保存表头
    };

    hintEl.innerHTML = `✅ 已生成 ${school} 全校 ${results.length} 条对比记录；点击表格上方可导出。`;
    hintEl.style.color = '#16a34a';

    setTeacherCompareCacheState(window.TEACHER_MULTI_PERIOD_COMPARE_CACHE);
    if (window.UI) UI.loading(false);
}

// 🆕 导出全校教师对比
function exportAllTeachersMultiPeriodDiff(school, examIdsStr) {
    const ALL_TEACHERS_DIFF_CACHE = readAllTeachersDiffCacheState();
    if (!ALL_TEACHERS_DIFF_CACHE) return alert('请先生成表格');
    const { results, examIds } = ALL_TEACHERS_DIFF_CACHE;

    // 构建 Excel 数据 [Teacher, Subject, 每期三类镇排, 变化三类镇排]
    const header = ['教师', '学科'];
    examIds.forEach(eid => {
        header.push(`${eid}\n均分镇排`, `${eid}\n优秀率镇排`, `${eid}\n及格率镇排`);
    });
    header.push('变化_均分镇排(正数进/负数退)', '变化_优秀率镇排(正数进/负数退)', '变化_及格率镇排(正数进/负数退)');

    const data = results.map(r => {
        const row = [r.teacher, r.subject];
        r.details.forEach(p => {
            const c = p.current;
            if (c) {
                row.push(
                    (typeof c.townshipRankAvg === 'number' ? c.townshipRankAvg : '-'),
                    (typeof c.townshipRankExc === 'number' ? c.townshipRankExc : '-'),
                    (typeof c.townshipRankPass === 'number' ? c.townshipRankPass : '-')
                );
            } else {
                row.push('-', '-', '-');
            }
        });
        if (r.delta) {
            row.push(
                (typeof r.delta.townshipAvg === 'number' ? r.delta.townshipAvg : '-'),
                (typeof r.delta.townshipExc === 'number' ? r.delta.townshipExc : '-'),
                (typeof r.delta.townshipPass === 'number' ? r.delta.townshipPass : '-')
            );
        } else {
            row.push('-', '-', '-');
        }
        return row;
    });

    data.unshift(header);

    try {
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "教师多期对比");
        XLSX.writeFile(wb, `${school}_教师多期对比总表_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
        console.error(e);
        alert('导出失败 (请确保xlsx库已加载)');
    }
}

// 教师云对比运行时已拆分到 public/assets/js/teacher-compare-cloud-runtime.js

function exportTeacherMultiPeriodComparison() {
    const TEACHER_MULTI_PERIOD_COMPARE_CACHE = readTeacherCompareCacheState();
    if (!TEACHER_MULTI_PERIOD_COMPARE_CACHE) return alert('请先生成教师多期对比结果');
    const { school, subject, teacher, examIds, examStats, delta } = TEACHER_MULTI_PERIOD_COMPARE_CACHE;
    const wb = XLSX.utils.book_new();

    const detail = [['学校', '教师', '学科', '期次', '均分镇排', '优秀率镇排', '及格率镇排']];
    examStats.forEach(x => {
        const d = x.current;
        detail.push([school, teacher, subject, x.examId, d.townshipRankAvg || '', d.townshipRankExc || '', d.townshipRankPass || '']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detail), '教师多期明细');

    const first = examIds[0];
    const last = examIds[examIds.length - 1];
    const deltaRows = [[
        '学校', '教师', '学科', '对比区间',
        '均分镇排变化(正数进/负数退)', '优秀率镇排变化(正数进/负数退)', '及格率镇排变化(正数进/负数退)'
    ], [
        school, teacher, subject, `${first}→${last}`,
        delta.townshipAvg === null ? '' : delta.townshipAvg,
        delta.townshipExc === null ? '' : delta.townshipExc,
        delta.townshipPass === null ? '' : delta.townshipPass
    ]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deltaRows), '首末期变化');

    XLSX.writeFile(wb, `教师多期对比_${school}_${subject}_${teacher}_${examIds.join('_')}.xlsx`);
}

// ============================================================
//  智能版上次成绩加载函数 (自动适配 9年级五科模式 vs 其他年级全科模式)
// ============================================================

    Object.assign(window, {
        buildTeacherStatsForExam,
        attachTeacherTownshipAvgRank,
        renderTeacherMultiPeriodComparison,
        renderAllTeachersMultiPeriodComparison,
        exportAllTeachersMultiPeriodDiff,
        exportTeacherMultiPeriodComparison
    });

    window.__TEACHER_COMPARE_RESULT_RUNTIME_PATCHED__ = true;
})();
