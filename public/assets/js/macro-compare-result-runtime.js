(() => {
    if (typeof window === 'undefined' || window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__) return;

    const readMacroCompareCacheState = typeof window.readMacroCompareCacheState === 'function'
        ? window.readMacroCompareCacheState
        : (() => (window.MACRO_MULTI_PERIOD_COMPARE_CACHE && typeof window.MACRO_MULTI_PERIOD_COMPARE_CACHE === 'object'
            ? window.MACRO_MULTI_PERIOD_COMPARE_CACHE
            : null));
    const setMacroCompareCacheState = typeof window.setMacroCompareCacheState === 'function'
        ? window.setMacroCompareCacheState
        : ((cache) => {
            const nextCache = cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : null;
            window.MACRO_MULTI_PERIOD_COMPARE_CACHE = nextCache;
            return nextCache;
        });

    function setMacroCompareHintState(hintEl, message, state = 'idle') {
        if (!hintEl) return;
        hintEl.textContent = message;
        hintEl.className = `analysis-hint analysis-status-text${state === 'success' ? ' is-success' : state === 'error' ? ' is-error' : ''}`;
    }

    function renderMacroCompareEmptyState(resultEl, title, message) {
        if (!resultEl) return;
        resultEl.innerHTML = `<div class="analysis-empty-state analysis-empty-state-compact"><strong>${title}</strong>${message}</div>`;
    }

    function macroEscapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;'
        }[ch]));
    }

    function macroFormatRank(rank) {
        const num = Number(rank);
        return Number.isFinite(num) ? `#${num}` : '-';
    }

    function macroFormatRankShift(shift) {
        const num = Number(shift);
        if (!Number.isFinite(num) || num === 0) return '0';
        return `${num > 0 ? '+' : ''}${num}`;
    }

    function macroFormatSignedValue(value, digits = 2) {
        const num = Number(value);
        if (!Number.isFinite(num)) return '-';
        return `${num > 0 ? '+' : ''}${num.toFixed(digits)}`;
    }

    function macroFormatPlainValue(value, digits = 2) {
        const num = Number(value);
        if (!Number.isFinite(num)) return '-';
        return num.toFixed(digits);
    }

    function macroJoinSubjects(list, fallback) {
        const items = Array.isArray(list)
            ? list.map(item => String(item || '').trim()).filter(Boolean)
            : [];
        return items.length ? items.slice(0, 3).join('、') : fallback;
    }

    function macroResolveRankBand(rank, totalSchools) {
        const rankNum = Number(rank);
        const totalNum = Number(totalSchools);
        if (!Number.isFinite(rankNum) || !Number.isFinite(totalNum) || totalNum <= 0) return '-';

        const ratio = rankNum / totalNum;
        if (ratio <= 0.2) return '前列';
        if (ratio <= 0.5) return '中上';
        if (ratio <= 0.8) return '中段';
        return '后段';
    }

    function macroResolveCurrentSchoolName() {
        const names = Object.keys(SCHOOLS || {});
        if (!names.length) return '';
        if (typeof resolveSchoolNameFromCollection === 'function') {
            return resolveSchoolNameFromCollection(names, MY_SCHOOL) || String(MY_SCHOOL || '').trim();
        }
        return String(MY_SCHOOL || '').trim();
    }

    function macroBuildSchoolTrendRows(examIds, overviewByExam, school) {
        return examIds.map((examId, index) => {
            const overview = overviewByExam[index];
            const entry = getSchoolRankOverviewEntryBySchool(overview, school);
            if (!entry || !entry.total) return null;

            return {
                examId,
                count: entry.total.count,
                avg: entry.total.avg,
                excRate: entry.total.excRate,
                passRate: entry.total.passRate,
                totalRank: entry.total.rankAvg,
                avgSubjectRank: entry.avgSubjectRank,
                leaderSubjectsText: macroJoinSubjects(
                    entry.leaderSubjects.length ? entry.leaderSubjects : entry.advantageSubjects,
                    '暂无明显领跑学科'
                ),
                weakSubjectsText: macroJoinSubjects(entry.weakSubjects, '暂无明显短板学科')
            };
        }).filter(Boolean);
    }

    function macroBuildCountyInsightRows(examIds, overviewByExam, school) {
        return examIds.map((examId, index) => {
            const overview = overviewByExam[index];
            const entry = getSchoolRankOverviewEntryBySchool(overview, school);
            if (!overview || !entry || !entry.total) return null;

            const schools = Array.isArray(overview.schools) ? overview.schools : [];
            const leader = schools[0] || null;
            const schoolCount = schools.length;
            const countyAvg = schools.length
                ? schools.reduce((sum, item) => sum + Number(item.total?.avg || 0), 0) / schools.length
                : null;
            const gapToTopAvg = leader && Number.isFinite(Number(leader.total?.avg))
                ? Number(leader.total.avg) - Number(entry.total.avg || 0)
                : null;
            const gapToCountyAvg = Number.isFinite(Number(countyAvg))
                ? Number(entry.total.avg || 0) - Number(countyAvg)
                : null;

            return {
                examId,
                totalRank: entry.total.rankAvg,
                avgSubjectRank: entry.avgSubjectRank,
                leaderCount: entry.subjectLeaderCount || 0,
                advantageSubjectsText: macroJoinSubjects(entry.advantageSubjects, '暂无明显优势学科'),
                weakSubjectsText: macroJoinSubjects(entry.weakSubjects, '暂无明显短板学科'),
                gapToTopAvg,
                gapToCountyAvg,
                rankBand: macroResolveRankBand(entry.total.rankAvg, schoolCount)
            };
        }).filter(Boolean);
    }

    function macroBuildLatestRankMatrix(overview, baseOverview, focusSchool) {
        const focusEntry = getSchoolRankOverviewEntryBySchool(overview, focusSchool);
        const focusName = focusEntry?.school || String(focusSchool || '').trim();

        return (overview?.schools || []).map((entry) => {
            const previous = baseOverview ? getSchoolRankOverviewEntryBySchool(baseOverview, entry.school) : null;
            const rankShift = Number.isFinite(Number(previous?.total?.rankAvg)) && Number.isFinite(Number(entry.total?.rankAvg))
                ? Number(previous.total.rankAvg) - Number(entry.total.rankAvg)
                : null;

            return {
                school: entry.school,
                totalRank: entry.total?.rankAvg ?? null,
                rankShift,
                avg: entry.total?.avg ?? 0,
                avgSubjectRank: entry.avgSubjectRank,
                subjectLeaderCount: entry.subjectLeaderCount || 0,
                leaderSubjectsText: macroJoinSubjects(
                    entry.leaderSubjects.length ? entry.leaderSubjects : entry.advantageSubjects,
                    '较均衡'
                ),
                weakSubjectsText: macroJoinSubjects(entry.weakSubjects, '暂无明显短板'),
                subjectRanks: (overview?.subjectList || []).map(subject => entry.subjects[subject]?.rankAvg ?? ''),
                isFocusSchool: entry.school === focusName
            };
        });
    }

    function macroBuildTeacherCountyBridgeData(school) {
        const schoolNames = Object.keys(SCHOOLS || {});
        const targetSchool = typeof resolveSchoolNameFromCollection === 'function'
            ? (resolveSchoolNameFromCollection(schoolNames, school) || String(school || '').trim())
            : String(school || '').trim();
        const currentSchool = macroResolveCurrentSchoolName();
        const cacheKey = [
            String(CURRENT_EXAM_ID || 'current'),
            targetSchool,
            currentSchool,
            Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
            Object.keys(TEACHER_MAP || {}).length
        ].join('|');

        if (window.__COUNTY_TEACHER_BRIDGE_CACHE__?.key === cacheKey) {
            return window.__COUNTY_TEACHER_BRIDGE_CACHE__.data;
        }

        if (!targetSchool || !SCHOOLS?.[targetSchool]) {
            return { school: targetSchool, rows: [], summary: null, emptyMessage: '当前学校未找到，无法生成教师同学科对比。' };
        }
        if (!currentSchool || targetSchool !== currentSchool) {
            return { school: targetSchool, rows: [], summary: null, emptyMessage: '教师对标基于当前已加载本校任课表，请选择本校查看。' };
        }
        if (!Object.keys(TEACHER_MAP || {}).length) {
            return { school: targetSchool, rows: [], summary: null, emptyMessage: '当前还没有导入任课表，暂时无法生成教师同学科对比。' };
        }

        const students = Array.isArray(SCHOOLS[targetSchool]?.students) ? SCHOOLS[targetSchool].students : [];
        if (!students.length) {
            return { school: targetSchool, rows: [], summary: null, emptyMessage: '当前本校没有可用于教师对标的学生数据。' };
        }

        const normalizeSubjectFn = typeof normalizeSubject === 'function'
            ? normalizeSubject
            : ((value) => String(value || '').trim());
        const normalizeClassFn = typeof normalizeClass === 'function'
            ? normalizeClass
            : ((value) => String(value || '').trim());

        const studentsByClass = {};
        students.forEach((student) => {
            const cls = normalizeClassFn(student?.class || '');
            if (!cls) return;
            if (!studentsByClass[cls]) studentsByClass[cls] = [];
            studentsByClass[cls].push(student);
        });

        const teacherBuckets = {};
        Object.entries(TEACHER_MAP || {}).forEach(([key, teacherName]) => {
            const teacher = String(teacherName || '').trim();
            if (!teacher) return;

            const parts = String(key || '').split('_');
            if (parts.length < 2) return;
            const rawClass = parts.shift();
            const rawSubject = parts.join('_');
            const cls = normalizeClassFn(rawClass);
            const subject = (SUBJECTS || []).find(item => normalizeSubjectFn(item) === normalizeSubjectFn(rawSubject));

            if (!cls || !subject || !studentsByClass[cls]?.length) return;

            const bucketKey = `${teacher}__${subject}`;
            if (!teacherBuckets[bucketKey]) {
                teacherBuckets[bucketKey] = { teacher, subject, classes: new Set(), students: [] };
            }
            teacherBuckets[bucketKey].classes.add(cls);
            teacherBuckets[bucketKey].students.push(...studentsByClass[cls]);
        });

        const rows = Object.values(teacherBuckets).map((bucket) => {
            const scores = bucket.students
                .map(student => Number(student?.scores?.[bucket.subject]))
                .filter(score => Number.isFinite(score));
            if (!scores.length) return null;

            const threshold = THRESHOLDS?.[bucket.subject] || {};
            const excLine = Number.isFinite(Number(threshold.exc)) ? Number(threshold.exc) : 85;
            const passLine = Number.isFinite(Number(threshold.pass)) ? Number(threshold.pass) : 60;
            const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const excRate = scores.filter(score => score >= excLine).length / scores.length;
            const passRate = scores.filter(score => score >= passLine).length / scores.length;
            const schoolSubjectRank = Number(SCHOOLS[targetSchool]?.rankings?.[bucket.subject]?.avg ?? NaN);
            const countyMetrics = Object.values(SCHOOLS || {}).map(item => item?.metrics?.[bucket.subject]).filter(Boolean);
            const countyAvg = countyMetrics.length
                ? countyMetrics.reduce((sum, metric) => sum + Number(metric.avg || 0), 0) / countyMetrics.length
                : null;

            return {
                teacher: bucket.teacher,
                subject: bucket.subject,
                classes: Array.from(bucket.classes).sort().join('、'),
                studentCount: scores.length,
                avg,
                excRate,
                passRate,
                countyAvg,
                schoolSubjectRank,
                rankAvg: null,
                rankExc: null,
                rankPass: null,
                schoolRankDelta: null,
                diagnosis: ''
            };
        }).filter(Boolean);

        const bySubject = {};
        rows.forEach((row) => {
            if (!bySubject[row.subject]) bySubject[row.subject] = [];
            bySubject[row.subject].push(row);
        });

        Object.entries(bySubject).forEach(([subject, subjectRows]) => {
            const pool = [
                ...subjectRows.map(row => ({
                    key: `teacher:${row.teacher}`,
                    avg: row.avg,
                    excRate: row.excRate,
                    passRate: row.passRate
                })),
                ...Object.entries(SCHOOLS || {})
                    .filter(([name, schoolItem]) => name !== targetSchool && schoolItem?.metrics?.[subject])
                    .map(([name, schoolItem]) => ({
                        key: `school:${name}`,
                        avg: Number(schoolItem.metrics[subject].avg || 0),
                        excRate: Number(schoolItem.metrics[subject].excRate || 0),
                        passRate: Number(schoolItem.metrics[subject].passRate || 0)
                    }))
            ];

            const avgRankMap = typeof buildCompetitionRankMap === 'function'
                ? buildCompetitionRankMap(pool, item => item.key, item => item.avg)
                : new Map();
            const excRankMap = typeof buildCompetitionRankMap === 'function'
                ? buildCompetitionRankMap(pool, item => item.key, item => item.excRate)
                : new Map();
            const passRankMap = typeof buildCompetitionRankMap === 'function'
                ? buildCompetitionRankMap(pool, item => item.key, item => item.passRate)
                : new Map();

            subjectRows.forEach((row) => {
                row.rankAvg = avgRankMap.get(`teacher:${row.teacher}`) ?? null;
                row.rankExc = excRankMap.get(`teacher:${row.teacher}`) ?? null;
                row.rankPass = passRankMap.get(`teacher:${row.teacher}`) ?? null;
                row.schoolRankDelta = Number.isFinite(row.schoolSubjectRank) && Number.isFinite(Number(row.rankAvg))
                    ? Number(row.schoolSubjectRank) - Number(row.rankAvg)
                    : null;

                const diagnosis = [];
                if (Number.isFinite(Number(row.rankAvg)) && Number(row.rankAvg) <= Math.min(3, pool.length)) {
                    diagnosis.push('县域前列');
                }
                if (Number.isFinite(Number(row.schoolRankDelta)) && Number(row.schoolRankDelta) >= 2) {
                    diagnosis.push(`高于本校学科站位${row.schoolRankDelta}名`);
                } else if (Number.isFinite(Number(row.schoolRankDelta)) && Number(row.schoolRankDelta) <= -2) {
                    diagnosis.push(`低于本校学科站位${Math.abs(row.schoolRankDelta)}名`);
                } else if (Number.isFinite(Number(row.schoolRankDelta))) {
                    diagnosis.push('与本校学科站位接近');
                }
                if (!diagnosis.length) diagnosis.push('待结合课堂与班级结构复核');
                row.diagnosis = diagnosis.join('；');
            });
        });

        rows.sort((left, right) => {
            const rankDiff = Number(left.rankAvg || Number.POSITIVE_INFINITY) - Number(right.rankAvg || Number.POSITIVE_INFINITY);
            if (rankDiff !== 0) return rankDiff;
            const avgDiff = Number(right.avg || 0) - Number(left.avg || 0);
            if (avgDiff !== 0) return avgDiff;
            return String(left.teacher || '').localeCompare(String(right.teacher || ''), 'zh-CN');
        });

        const bestRow = rows[0] || null;
        const summary = {
            recordCount: rows.length,
            bestRank: bestRow?.rankAvg ?? null,
            aheadCount: rows.filter(row => Number.isFinite(Number(row.schoolRankDelta)) && Number(row.schoolRankDelta) >= 1).length,
            concernCount: rows.filter(row => Number.isFinite(Number(row.schoolRankDelta)) && Number(row.schoolRankDelta) <= -1).length
        };

        const data = { school: targetSchool, rows, summary, emptyMessage: '' };
        window.__COUNTY_TEACHER_BRIDGE_CACHE__ = { key: cacheKey, data };
        return data;
    }

    function renderMacroMultiPeriodComparison() {
        const hintEl = document.getElementById('macroCompareHint');
        const resultEl = document.getElementById('macroCompareResult');
        const countEl = document.getElementById('macroComparePeriodCount');
        const schoolEl = document.getElementById('macroCompareSchool');
        const e1El = document.getElementById('macroCompareExam1');
        const e2El = document.getElementById('macroCompareExam2');
        const e3El = document.getElementById('macroCompareExam3');
        if (!hintEl || !resultEl || !countEl || !schoolEl || !e1El || !e2El || !e3El) return;

        const periodCount = parseInt(countEl.value || '2', 10);
        const school = schoolEl.value;
        const examIds = periodCount === 3 ? [e1El.value, e2El.value, e3El.value] : [e1El.value, e2El.value];

        if (!school) {
            setMacroCompareHintState(hintEl, '请先选择学校。', 'error');
            renderMacroCompareEmptyState(resultEl, '尚未生成县域多期对比', '请先选择学校后再生成结果。');
            return;
        }
        if (examIds.some(id => !id)) {
            setMacroCompareHintState(hintEl, '请完整选择所有考试期次。', 'error');
            renderMacroCompareEmptyState(resultEl, '考试期次未选完整', '补齐所需期次后，系统会生成县域多期分析。');
            return;
        }
        if (new Set(examIds).size !== examIds.length) {
            setMacroCompareHintState(hintEl, '期次不能重复，请选择不同考试。', 'error');
            renderMacroCompareEmptyState(resultEl, '期次配置有冲突', '请使用不同的考试期次进行对比。');
            return;
        }

        const rowsByExam = examIds.map(examId => ({ examId, rows: getExamRowsForCompare(examId) }));
        if (rowsByExam.some(item => !item.rows.length)) {
            setMacroCompareHintState(hintEl, '某些期次没有可用成绩数据，请检查考试数据。', 'error');
            renderMacroCompareEmptyState(resultEl, '缺少可用成绩数据', '至少有一期考试没有可用于县域分析的成绩。');
            return;
        }

        const summaryByExam = rowsByExam.map(item => ({
            examId: item.examId,
            summary: buildSchoolSummaryForExam(item.rows)
        }));
        const overviewByExam = rowsByExam.map(item => ({
            examId: item.examId,
            overview: buildSchoolRankOverviewForRows(item.rows)
        }));

        const schoolEntries = overviewByExam.map(item => ({
            examId: item.examId,
            entry: getSchoolRankOverviewEntryBySchool(item.overview, school)
        }));
        if (schoolEntries.some(item => !item.entry || !item.entry.total)) {
            setMacroCompareHintState(hintEl, '所选学校在某些期次中无数据，无法对比。', 'error');
            renderMacroCompareEmptyState(resultEl, '学校数据不完整', '所选学校在部分考试里没有成绩，当前无法生成连续对比。');
            return;
        }

        const schoolTrendRows = macroBuildSchoolTrendRows(
            examIds,
            overviewByExam.map(item => item.overview),
            school
        );
        const countyInsightRows = macroBuildCountyInsightRows(
            examIds,
            overviewByExam.map(item => item.overview),
            school
        );

        const schoolRowsHtml = schoolTrendRows.map(row => `
            <tr>
                <td>${macroEscapeHtml(row.examId)}</td>
                <td>${row.count}</td>
                <td>${macroFormatPlainValue(row.avg)}</td>
                <td>${macroFormatRank(row.totalRank)}</td>
                <td>${(Number(row.excRate || 0) * 100).toFixed(1)}%</td>
                <td>${(Number(row.passRate || 0) * 100).toFixed(1)}%</td>
                <td>${macroFormatPlainValue(row.avgSubjectRank)}</td>
                <td>${macroEscapeHtml(row.leaderSubjectsText)}</td>
                <td>${macroEscapeHtml(row.weakSubjectsText)}</td>
            </tr>
        `).join('');

        const countyInsightRowsHtml = countyInsightRows.map(row => `
            <tr>
                <td>${macroEscapeHtml(row.examId)}</td>
                <td>${macroFormatRank(row.totalRank)}</td>
                <td>${macroFormatPlainValue(row.avgSubjectRank)}</td>
                <td>${row.leaderCount}</td>
                <td>${macroEscapeHtml(row.advantageSubjectsText)}</td>
                <td>${macroEscapeHtml(row.weakSubjectsText)}</td>
                <td>${macroFormatPlainValue(row.gapToTopAvg)}</td>
                <td>${macroFormatSignedValue(row.gapToCountyAvg)}</td>
                <td>${macroEscapeHtml(row.rankBand)}</td>
            </tr>
        `).join('');

        const firstSummary = summaryByExam[0].summary;
        const lastSummary = summaryByExam[summaryByExam.length - 1].summary;
        const allSchoolsChange = Object.keys(lastSummary).map((schoolName) => {
            const previous = getSummaryEntryBySchool(firstSummary, schoolName);
            const current = lastSummary[schoolName];
            if (!previous || !current) return null;

            return {
                school: schoolName,
                dAvg: Number(current.avg || 0) - Number(previous.avg || 0),
                dExc: Number(current.excRate || 0) - Number(previous.excRate || 0),
                dPass: Number(current.passRate || 0) - Number(previous.passRate || 0),
                dRank: Number(previous.rankAvg || 0) - Number(current.rankAvg || 0)
            };
        }).filter(Boolean).sort((left, right) => Math.abs(right.dAvg) - Math.abs(left.dAvg));

        const allRowsHtml = allSchoolsChange.length
            ? allSchoolsChange.map(row => `
                <tr>
                    <td>${macroEscapeHtml(row.school)}</td>
                    <td style="font-weight:bold; color:${row.dAvg >= 0 ? 'var(--success)' : 'var(--danger)'};">${macroFormatSignedValue(row.dAvg)}</td>
                    <td>${row.dExc >= 0 ? '+' : ''}${(row.dExc * 100).toFixed(1)}%</td>
                    <td>${row.dPass >= 0 ? '+' : ''}${(row.dPass * 100).toFixed(1)}%</td>
                    <td style="font-weight:bold; color:${row.dRank >= 0 ? 'var(--success)' : 'var(--danger)'};">${row.dRank >= 0 ? '+' : ''}${row.dRank}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="5" style="text-align:center; color:#999;">暂无可比数据</td></tr>';

        const latestOverview = overviewByExam[overviewByExam.length - 1]?.overview || null;
        const firstOverview = overviewByExam[0]?.overview || null;
        const latestRankMatrix = latestOverview
            ? macroBuildLatestRankMatrix(latestOverview, firstOverview, school)
            : [];
        const rankMatrixHeaders = latestOverview
            ? ['学校', '总分县排', '位次变化', '总分均分', ...latestOverview.subjectList, '学科平均排位', '榜首学科数', '优势学科', '短板学科']
            : [];
        const rankMatrixRows = latestRankMatrix.map((row) => ([
            row.school,
            row.totalRank,
            row.rankShift,
            row.avg,
            ...row.subjectRanks,
            row.avgSubjectRank,
            row.subjectLeaderCount,
            row.leaderSubjectsText,
            row.weakSubjectsText
        ]));
        const rankMatrixHtml = latestOverview
            ? latestRankMatrix.map((row) => `
                <tr class="${row.isFocusSchool ? 'bg-highlight' : ''}">
                    <td style="font-weight:${row.isFocusSchool ? '700' : '600'};">${macroEscapeHtml(row.school)}</td>
                    <td>${macroFormatRank(row.totalRank)}</td>
                    <td style="font-weight:700; color:${Number(row.rankShift) > 0 ? 'var(--success)' : Number(row.rankShift) < 0 ? 'var(--danger)' : '#64748b'};">${macroFormatRankShift(row.rankShift)}</td>
                    <td>${macroFormatPlainValue(row.avg)}</td>
                    ${row.subjectRanks.map(rank => `<td>${macroFormatRank(rank)}</td>`).join('')}
                    <td>${macroFormatPlainValue(row.avgSubjectRank)}</td>
                    <td>${row.subjectLeaderCount}</td>
                    <td>${macroEscapeHtml(row.leaderSubjectsText)}</td>
                    <td>${macroEscapeHtml(row.weakSubjectsText)}</td>
                </tr>
            `).join('')
            : '';

        const latestFocusEntry = latestOverview ? getSchoolRankOverviewEntryBySchool(latestOverview, school) : null;
        const rankMatrixNote = latestFocusEntry
            ? `${latestFocusEntry.school} 末期总分县排 ${macroFormatRank(latestFocusEntry.total?.rankAvg)}，优势学科：${macroJoinSubjects(latestFocusEntry.leaderSubjects.length ? latestFocusEntry.leaderSubjects : latestFocusEntry.advantageSubjects, '暂无明显领跑学科')}；短板学科：${macroJoinSubjects(latestFocusEntry.weakSubjects, '暂无明显短板学科')}。`
            : '末期矩阵会把镇所有学校与县级所有学校一起纳入同一张表，便于判断本校在完整学校池中的位置。';

        const teacherBridgeData = macroBuildTeacherCountyBridgeData(school);
        const teacherSummaryCards = teacherBridgeData.summary ? [
            { label: '本校', value: teacherBridgeData.school, sub: `${teacherBridgeData.summary.recordCount} 条教师学科记录` },
            { label: '最佳县排', value: Number.isFinite(Number(teacherBridgeData.summary.bestRank)) ? `#${teacherBridgeData.summary.bestRank}` : '-', sub: teacherBridgeData.rows[0] ? `${teacherBridgeData.rows[0].teacher} · ${teacherBridgeData.rows[0].subject}` : '暂无最佳记录' },
            { label: '高于本校学科站位', value: String(teacherBridgeData.summary.aheadCount), sub: '说明教师表现高于学校同科站位' },
            { label: '需要重点关注', value: String(teacherBridgeData.summary.concernCount), sub: '说明教师表现低于学校同科站位' }
        ] : [];
        const teacherCardsHtml = teacherSummaryCards.map(card => `
            <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:14px; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                <div style="font-size:12px; color:#64748b; margin-bottom:6px;">${macroEscapeHtml(card.label)}</div>
                <div style="font-size:20px; font-weight:800; color:#0f172a;">${macroEscapeHtml(card.value)}</div>
                <div style="font-size:12px; color:#475569; margin-top:6px;">${macroEscapeHtml(card.sub)}</div>
            </div>
        `).join('');
        const teacherRowsHtml = teacherBridgeData.rows.map((row) => {
            const countyDiff = Number.isFinite(Number(row.countyAvg)) ? Number(row.avg) - Number(row.countyAvg) : null;
            return `
                <tr>
                    <td style="font-weight:600;">${macroEscapeHtml(row.teacher)}</td>
                    <td>${macroEscapeHtml(row.subject)}</td>
                    <td>${macroEscapeHtml(row.classes)}</td>
                    <td>${row.studentCount}</td>
                    <td>${macroFormatPlainValue(row.avg)}</td>
                    <td class="${Number(countyDiff) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(countyDiff)) ? macroFormatSignedValue(countyDiff) : '-'}</td>
                    <td>${macroFormatRank(row.rankAvg)}</td>
                    <td>${macroFormatRank(row.rankExc)}</td>
                    <td>${macroFormatRank(row.rankPass)}</td>
                    <td>${macroEscapeHtml(row.diagnosis)}</td>
                </tr>
            `;
        }).join('');
        const teacherPanelHtml = teacherBridgeData.rows.length
            ? `
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>教师与其他学校同学科排名对比</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">${macroEscapeHtml(teacherBridgeData.school)}</span>
                            <span class="analysis-table-tag">覆盖镇所有学校 + 县级所有学校</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">教师对标基于当前已加载考试和本校任课表，把本校教师直接放到全学校池同学科里比较均分、优秀率和及格率排名。</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin:14px 0 16px 0;">
                        ${teacherCardsHtml}
                    </div>
                    <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                        <table class="common-table analysis-generated-table" style="font-size:13px;">
                            <thead>
                                <tr>
                                    <th>教师</th>
                                    <th>学科</th>
                                    <th>班级</th>
                                    <th>学生数</th>
                                    <th>均分</th>
                                    <th>较县均差</th>
                                    <th>均分排名</th>
                                    <th>优秀率排名</th>
                                    <th>及格率排名</th>
                                    <th>诊断</th>
                                </tr>
                            </thead>
                            <tbody>${teacherRowsHtml}</tbody>
                        </table>
                    </div>
                </div>
            `
            : `
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>教师与其他学校同学科排名对比</span>
                    </div>
                    <div class="analysis-empty-state">${macroEscapeHtml(teacherBridgeData.emptyMessage || '暂无教师同学科对比数据')}</div>
                </div>
            `;

        const changeLabel = `${examIds[0]} → ${examIds[examIds.length - 1]}`;
        resultEl.innerHTML = `
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>县域学校多期趋势（${macroEscapeHtml(school)}）</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${periodCount} 期对比</span>
                        <span class="analysis-table-tag">${macroEscapeHtml(changeLabel)}</span>
                    </span>
                </div>
                <div class="analysis-generated-note">学校趋势和后续矩阵都按“镇所有学校 + 县级所有学校”的完整学校池计算，不会只看镇内学校。</div>
                <div class="table-wrap analysis-table-shell">
                    <table class="mobile-card-table analysis-generated-table">
                        <thead>
                            <tr>
                                <th>期次</th>
                                <th>人数</th>
                                <th>总分均分</th>
                                <th>总分县排</th>
                                <th>优秀率</th>
                                <th>及格率</th>
                                <th>学科平均排位</th>
                                <th>优势学科</th>
                                <th>短板学科</th>
                            </tr>
                        </thead>
                        <tbody>${schoolRowsHtml}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>县域竞争结构追踪</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">不使用高分段 / 指标生 / 后三分之一</span>
                    </span>
                </div>
                <div class="analysis-generated-note">改看县排、与榜首差距、较县均差和学科结构，判断学校在完整县域学校池中的真实位置。</div>
                <div class="table-wrap analysis-table-shell">
                    <table class="mobile-card-table analysis-generated-table">
                        <thead>
                            <tr>
                                <th>期次</th>
                                <th>总分县排</th>
                                <th>学科平均排位</th>
                                <th>榜首学科数</th>
                                <th>优势学科</th>
                                <th>短板学科</th>
                                <th>距榜首均分</th>
                                <th>较县均差</th>
                                <th>县域梯队</th>
                            </tr>
                        </thead>
                        <tbody>${countyInsightRowsHtml}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>所有学校首末期变化</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${macroEscapeHtml(changeLabel)}</span>
                        <span class="analysis-table-tag">覆盖镇所有学校 + 县级所有学校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">查看本校与其他所有学校是同步拉开还是缩小差距，辅助判断变化是个体波动还是整体波动。</div>
                <div class="table-wrap analysis-table-shell">
                    <table class="mobile-card-table analysis-generated-table">
                        <thead>
                            <tr>
                                <th>学校</th>
                                <th>均分变化</th>
                                <th>优秀率变化</th>
                                <th>及格率变化</th>
                                <th>排位变化</th>
                            </tr>
                        </thead>
                        <tbody>${allRowsHtml}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>所有学校总排与学科排位矩阵（末期）</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${macroEscapeHtml(examIds[examIds.length - 1])}</span>
                        <span class="analysis-table-tag">${latestRankMatrix.length} 校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">${macroEscapeHtml(rankMatrixNote)}</div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>${rankMatrixHeaders.map(header => `<th>${macroEscapeHtml(header)}</th>`).join('')}</tr>
                        </thead>
                        <tbody>${rankMatrixHtml || `<tr><td colspan="${rankMatrixHeaders.length || 1}" style="text-align:center; color:#94a3b8;">暂无末期排名数据</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            ${teacherPanelHtml}
        `;

        setMacroCompareHintState(hintEl, `已完成 ${periodCount} 期县域对比：${examIds.join(' → ')}`, 'success');
        setMacroCompareCacheState({
            school,
            examIds,
            periodCount,
            summaryByExam,
            overviewByExam,
            allSchoolsChange,
            countyInsightRows,
            schoolTrendRows,
            latestRankMatrix,
            rankMatrixHeaders,
            rankMatrixRows,
            teacherCountyRows: teacherBridgeData.rows,
            teacherCountySummary: teacherBridgeData.summary,
            teacherCountyMessage: teacherBridgeData.emptyMessage || '',
            html: resultEl.innerHTML
        });
    }

    function exportMacroMultiPeriodComparison() {
        const cache = readMacroCompareCacheState();
        if (!cache) return alert('请先生成县域多期对比结果');

        const {
            school,
            examIds,
            allSchoolsChange = [],
            countyInsightRows = [],
            schoolTrendRows = [],
            rankMatrixHeaders = [],
            rankMatrixRows = [],
            teacherCountyRows = []
        } = cache;

        const wb = XLSX.utils.book_new();

        const schoolData = [['学校', '期次', '人数', '总分均分', '总分县排', '优秀率', '及格率', '学科平均排位', '优势学科', '短板学科']];
        schoolTrendRows.forEach(row => {
            schoolData.push([
                school,
                row.examId,
                row.count,
                row.avg,
                row.totalRank,
                row.excRate,
                row.passRate,
                row.avgSubjectRank,
                row.leaderSubjectsText,
                row.weakSubjectsText
            ]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(schoolData), '指定学校多期');

        const first = examIds[0];
        const last = examIds[examIds.length - 1];
        const allData = [['学校', `${first}→${last}均分变化`, `${first}→${last}优秀率变化`, `${first}→${last}及格率变化`, `${first}→${last}排位变化`]];
        allSchoolsChange.forEach(row => allData.push([row.school, row.dAvg, row.dExc, row.dPass, row.dRank]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(allData), '所有学校首末期变化');

        const countyData = [['期次', '总分县排', '学科平均排位', '榜首学科数', '优势学科', '短板学科', '距榜首均分', '较县均差', '县域梯队']];
        countyInsightRows.forEach(row => {
            countyData.push([
                row.examId,
                row.totalRank,
                row.avgSubjectRank,
                row.leaderCount,
                row.advantageSubjectsText,
                row.weakSubjectsText,
                row.gapToTopAvg,
                row.gapToCountyAvg,
                row.rankBand
            ]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(countyData), '县域结构追踪');

        if (rankMatrixHeaders.length && rankMatrixRows.length) {
            XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.aoa_to_sheet([rankMatrixHeaders, ...rankMatrixRows]),
                '所有学校排名矩阵'
            );
        }

        if (teacherCountyRows.length) {
            const teacherData = [['教师', '学科', '班级', '学生数', '均分', '较县均差', '均分排名', '优秀率排名', '及格率排名', '诊断']];
            teacherCountyRows.forEach(row => {
                const countyDiff = Number.isFinite(Number(row.countyAvg)) ? Number(row.avg) - Number(row.countyAvg) : null;
                teacherData.push([
                    row.teacher,
                    row.subject,
                    row.classes,
                    row.studentCount,
                    row.avg,
                    countyDiff,
                    row.rankAvg,
                    row.rankExc,
                    row.rankPass,
                    row.diagnosis
                ]);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(teacherData), '教师同学科对比');
        }

        XLSX.writeFile(wb, `县域多期对比_${school}_${examIds.join('_')}.xlsx`);
    }

    Object.assign(window, {
        renderMacroMultiPeriodComparison,
        exportMacroMultiPeriodComparison
    });

    window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__ = true;
})();
