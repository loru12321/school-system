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

    const teacherToNumber = typeof window.teacherToNumber === 'function'
        ? window.teacherToNumber
        : ((value, fallback = 0) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : fallback;
        });
    const teacherFormatPercent = typeof window.teacherFormatPercent === 'function'
        ? window.teacherFormatPercent
        : ((value, digits = 1) => `${(teacherToNumber(value, 0) * 100).toFixed(digits)}%`);
    const teacherFormatSigned = typeof window.teacherFormatSigned === 'function'
        ? window.teacherFormatSigned
        : ((value, digits = 1) => {
            const num = teacherToNumber(value, 0);
            return `${num >= 0 ? '+' : ''}${num.toFixed(digits)}`;
        });
    const teacherEscapeHtml = typeof window.teacherEscapeHtml === 'function'
        ? window.teacherEscapeHtml
        : ((value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;'
        }[ch])));
    const teacherFormatFocusList = typeof window.teacherFormatFocusList === 'function'
        ? window.teacherFormatFocusList
        : ((list, emptyText = '暂无') => {
            const rows = (list || []).slice(0, 8);
            if (!rows.length) return emptyText;
            return rows.map((row) => `${row.name}${row.className ? `(${row.className})` : ''}${Number.isFinite(row.score) ? ` ${row.score}` : ''}`).join('、');
        });
    const teacherGetWeightConfig = typeof window.teacherGetWeightConfig === 'function'
        ? window.teacherGetWeightConfig
        : (() => {
            const isGrade9 = String(window.CONFIG?.name || '').includes('9');
            return isGrade9
                ? { avg: 50, exc: 80, pass: 50, total: 180 }
                : { avg: 60, exc: 70, pass: 70, total: 200 };
        });
    const normalizeSubjectFn = typeof window.normalizeSubject === 'function'
        ? window.normalizeSubject
        : ((value) => String(value || '').trim());
    const sortSubjectsFn = typeof window.sortSubjects === 'function'
        ? window.sortSubjects
        : ((left, right) => String(left || '').localeCompare(String(right || ''), 'zh-Hans-CN'));
    const getCurrentUserFn = typeof window.getCurrentUser === 'function'
        ? window.getCurrentUser
        : (() => (window.Auth?.currentUser || null));

    function macroToNumber(value, fallback = NaN) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function macroAverage(values) {
        const list = (values || []).map((value) => Number(value)).filter(Number.isFinite);
        if (!list.length) return null;
        return list.reduce((sum, value) => sum + value, 0) / list.length;
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

    function macroFormatPercent(value, digits = 1) {
        const num = Number(value);
        if (!Number.isFinite(num)) return '-';
        return `${(num * 100).toFixed(digits)}%`;
    }

    function macroJoinSubjects(list, fallback) {
        const items = Array.isArray(list)
            ? list.map((item) => String(item || '').trim()).filter(Boolean)
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

    function setMacroCompareHintState(hintEl, message, state = 'idle') {
        if (!hintEl) return;
        hintEl.textContent = message;
        hintEl.className = `analysis-hint analysis-status-text${state === 'success' ? ' is-success' : state === 'error' ? ' is-error' : ''}`;
    }

    function renderMacroCompareEmptyState(resultEl, title, message) {
        if (!resultEl) return;
        resultEl.innerHTML = `<div class="analysis-empty-state analysis-empty-state-compact"><strong>${macroEscapeHtml(title)}</strong>${macroEscapeHtml(message)}</div>`;
    }

    function macroResolveCurrentSchoolName() {
        const names = Object.keys(SCHOOLS || {});
        if (!names.length) return '';
        if (typeof resolveSchoolNameFromCollection === 'function') {
            return resolveSchoolNameFromCollection(names, MY_SCHOOL) || String(MY_SCHOOL || '').trim();
        }
        return String(MY_SCHOOL || '').trim();
    }

    function macroResolveSchoolName(school) {
        const schoolNames = Object.keys(SCHOOLS || {});
        if (typeof resolveSchoolNameFromCollection === 'function') {
            return resolveSchoolNameFromCollection(schoolNames, school) || String(school || '').trim();
        }
        return String(school || '').trim();
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
                subjectRanks: (overview?.subjectList || []).map((subject) => entry.subjects[subject]?.rankAvg ?? ''),
                isFocusSchool: entry.school === focusName
            };
        });
    }

    function macroBuildCountyHorizontalRows(overview, focusSchool) {
        const schools = Array.isArray(overview?.schools) ? overview.schools : [];
        if (!schools.length) return [];

        const focusEntry = getSchoolRankOverviewEntryBySchool(overview, focusSchool);
        const focusName = focusEntry?.school || String(focusSchool || '').trim();
        const weights = teacherGetWeightConfig();
        const maxAvg = Math.max(...schools.map((entry) => macroToNumber(entry.total?.avg, 0)), 0);
        const maxExc = Math.max(...schools.map((entry) => macroToNumber(entry.total?.excRate, 0)), 0);
        const maxPass = Math.max(...schools.map((entry) => macroToNumber(entry.total?.passRate, 0)), 0);
        const countyAvg = macroAverage(schools.map((entry) => entry.total?.avg));
        const countyExc = macroAverage(schools.map((entry) => entry.total?.excRate));
        const countyPass = macroAverage(schools.map((entry) => entry.total?.passRate));

        const rows = schools.map((entry) => {
            const avg = macroToNumber(entry.total?.avg, 0);
            const excRate = macroToNumber(entry.total?.excRate, 0);
            const passRate = macroToNumber(entry.total?.passRate, 0);
            const ratedAvg = maxAvg > 0 ? (avg / maxAvg) * weights.avg : 0;
            const ratedExc = maxExc > 0 ? (excRate / maxExc) * weights.exc : 0;
            const ratedPass = maxPass > 0 ? (passRate / maxPass) * weights.pass : 0;
            return {
                school: entry.school,
                count: macroToNumber(entry.total?.count, 0),
                avg,
                excRate,
                passRate,
                totalRank: entry.total?.rankAvg ?? null,
                avgRank: entry.total?.rankAvg ?? null,
                excRank: entry.total?.rankExc ?? null,
                passRank: entry.total?.rankPass ?? null,
                ratedAvg,
                ratedExc,
                ratedPass,
                score2Rate: ratedAvg + ratedExc + ratedPass,
                avgDiff: Number.isFinite(Number(countyAvg)) ? avg - Number(countyAvg) : null,
                excDiff: Number.isFinite(Number(countyExc)) ? excRate - Number(countyExc) : null,
                passDiff: Number.isFinite(Number(countyPass)) ? passRate - Number(countyPass) : null,
                isFocusSchool: entry.school === focusName
            };
        });

        const rankMap = typeof buildCompetitionRankMap === 'function'
            ? buildCompetitionRankMap(rows, (row) => row.school, (row) => row.score2Rate)
            : new Map();
        rows.forEach((row) => {
            row.scoreRank = rankMap.get(row.school) ?? null;
        });
        rows.sort((left, right) => {
            const scoreDiff = macroToNumber(right.score2Rate, 0) - macroToNumber(left.score2Rate, 0);
            if (scoreDiff !== 0) return scoreDiff;
            const avgDiff = macroToNumber(right.avg, 0) - macroToNumber(left.avg, 0);
            if (avgDiff !== 0) return avgDiff;
            return String(left.school || '').localeCompare(String(right.school || ''), 'zh-CN');
        });

        return rows;
    }

    function macroBuildCountySubjectPortraitRows(overview, school) {
        const entry = getSchoolRankOverviewEntryBySchool(overview, school);
        if (!entry) return [];

        return (overview?.subjectList || []).map((subject) => {
            const metrics = entry.subjects?.[subject];
            if (!metrics) return null;

            const subjectRows = (overview?.schools || []).filter((schoolEntry) => schoolEntry.subjects?.[subject]);
            const leader = subjectRows
                .slice()
                .sort((left, right) => {
                    const leftRank = macroToNumber(left.subjects?.[subject]?.rankAvg, Number.POSITIVE_INFINITY);
                    const rightRank = macroToNumber(right.subjects?.[subject]?.rankAvg, Number.POSITIVE_INFINITY);
                    if (leftRank !== rightRank) return leftRank - rightRank;
                    return macroToNumber(right.subjects?.[subject]?.avg, 0) - macroToNumber(left.subjects?.[subject]?.avg, 0);
                })[0] || null;

            const countyAvg = macroAverage(subjectRows.map((schoolEntry) => schoolEntry.subjects?.[subject]?.avg));
            const countyExc = macroAverage(subjectRows.map((schoolEntry) => schoolEntry.subjects?.[subject]?.excRate));
            const countyPass = macroAverage(subjectRows.map((schoolEntry) => schoolEntry.subjects?.[subject]?.passRate));
            const topAvg = macroToNumber(leader?.subjects?.[subject]?.avg, NaN);

            return {
                subject,
                count: macroToNumber(metrics.count, 0),
                avg: macroToNumber(metrics.avg, 0),
                excRate: macroToNumber(metrics.excRate, 0),
                passRate: macroToNumber(metrics.passRate, 0),
                rankAvg: metrics.rankAvg ?? null,
                rankExc: metrics.rankExc ?? null,
                rankPass: metrics.rankPass ?? null,
                countyAvg,
                countyExc,
                countyPass,
                avgDiff: Number.isFinite(Number(countyAvg)) ? Number(metrics.avg) - Number(countyAvg) : null,
                excDiff: Number.isFinite(Number(countyExc)) ? Number(metrics.excRate) - Number(countyExc) : null,
                passDiff: Number.isFinite(Number(countyPass)) ? Number(metrics.passRate) - Number(countyPass) : null,
                topSchool: leader?.school || '',
                gapToTopAvg: Number.isFinite(topAvg) ? topAvg - Number(metrics.avg || 0) : null,
                schoolCount: subjectRows.length
            };
        }).filter(Boolean).sort((left, right) => {
            const rankDiff = macroToNumber(left.rankAvg, Number.POSITIVE_INFINITY) - macroToNumber(right.rankAvg, Number.POSITIVE_INFINITY);
            if (rankDiff !== 0) return rankDiff;
            return sortSubjectsFn(left.subject, right.subject);
        });
    }

    function macroBuildCountySubjectSchoolTables(overview, focusSchool) {
        const focusEntry = getSchoolRankOverviewEntryBySchool(overview, focusSchool);
        const focusName = focusEntry?.school || String(focusSchool || '').trim();

        return (overview?.subjectList || []).map((subject) => {
            const rows = (overview?.schools || []).map((entry) => {
                const metrics = entry.subjects?.[subject];
                if (!metrics) return null;
                return {
                    school: entry.school,
                    count: macroToNumber(metrics.count, 0),
                    avg: macroToNumber(metrics.avg, 0),
                    excRate: macroToNumber(metrics.excRate, 0),
                    passRate: macroToNumber(metrics.passRate, 0),
                    rankAvg: metrics.rankAvg ?? null,
                    rankExc: metrics.rankExc ?? null,
                    rankPass: metrics.rankPass ?? null,
                    isFocusSchool: entry.school === focusName
                };
            }).filter(Boolean);

            if (!rows.length) return null;

            const countyAvg = macroAverage(rows.map((row) => row.avg));
            const countyExc = macroAverage(rows.map((row) => row.excRate));
            const countyPass = macroAverage(rows.map((row) => row.passRate));
            const leader = rows.slice().sort((left, right) => {
                const rankDiff = macroToNumber(left.rankAvg, Number.POSITIVE_INFINITY) - macroToNumber(right.rankAvg, Number.POSITIVE_INFINITY);
                if (rankDiff !== 0) return rankDiff;
                return macroToNumber(right.avg, 0) - macroToNumber(left.avg, 0);
            })[0] || null;

            return {
                subject,
                leaderSchool: leader?.school || '',
                countyAvg,
                countyExc,
                countyPass,
                rows: rows
                    .map((row) => ({
                        ...row,
                        avgDiff: Number.isFinite(Number(countyAvg)) ? row.avg - Number(countyAvg) : null,
                        excDiff: Number.isFinite(Number(countyExc)) ? row.excRate - Number(countyExc) : null,
                        passDiff: Number.isFinite(Number(countyPass)) ? row.passRate - Number(countyPass) : null
                    }))
                    .sort((left, right) => {
                        const rankDiff = macroToNumber(left.rankAvg, Number.POSITIVE_INFINITY) - macroToNumber(right.rankAvg, Number.POSITIVE_INFINITY);
                        if (rankDiff !== 0) return rankDiff;
                        return macroToNumber(right.avg, 0) - macroToNumber(left.avg, 0);
                    })
            };
        }).filter(Boolean);
    }

    function macroBuildFallbackTeacherCardList(stats, rankings) {
        const cards = [];
        Object.keys(stats || {}).forEach((teacherName) => {
            Object.keys(stats[teacherName] || {}).forEach((subject) => {
                const data = stats[teacherName][subject];
                cards.push({
                    id: `${teacherName}-${subject}`,
                    name: teacherName,
                    subject,
                    classes: data.classesText || data.classes || '',
                    avg: teacherToNumber(data.avgValue, 0).toFixed(2),
                    fairScore: teacherToNumber(data.fairScore, 0).toFixed(1),
                    leagueScoreRaw: teacherToNumber(data.leagueScoreRaw, 0).toFixed(1),
                    baselineAdjustment: teacherFormatSigned(data.baselineAdjustment, 1),
                    baselineCoverage: data.baselineCoverageText || '0%',
                    sampleSummary: data.sampleSummary || '暂无历史样本',
                    sampleStability: data.sampleStabilityText || '0%',
                    conversionSummary: data.conversionSummary || '暂无转化样本',
                    conversionScore: teacherToNumber(data.conversionScore, 50).toFixed(1),
                    excRate: teacherFormatPercent(data.excellentRate, 1),
                    passRate: teacherFormatPercent(data.passRate, 1),
                    lowRate: teacherFormatPercent(data.lowRate, 1),
                    focusSummary: data.focusSummary || '培优0 / 临界0 / 辅差0',
                    rank: rankings?.[teacherName]?.[subject]?.rank || '-'
                });
            });
        });
        cards.sort((left, right) => {
            const fairDiff = teacherToNumber(right.fairScore, 0) - teacherToNumber(left.fairScore, 0);
            if (fairDiff !== 0) return fairDiff;
            return String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN');
        });
        return cards;
    }

    function macroEnsureTeacherCountySources(targetSchool) {
        const school = macroResolveSchoolName(targetSchool);
        const currentSchool = macroResolveCurrentSchoolName();

        if (!school || !SCHOOLS?.[school]) {
            return { school, emptyMessage: '当前学校未找到，无法生成教师县域画像。' };
        }
        if (!currentSchool || school !== currentSchool) {
            return { school, emptyMessage: '教师画像依赖当前已加载本校任课表，请选择本校查看。' };
        }
        if (!Object.keys(TEACHER_MAP || {}).length) {
            return { school, emptyMessage: '当前还没有导入任课表，暂时无法生成教师县域画像。' };
        }

        if ((!window.TEACHER_STATS || !Object.keys(window.TEACHER_STATS).length) && typeof window.analyzeTeachers === 'function') {
            try {
                window.analyzeTeachers();
            } catch (error) {
                console.warn('[county-macro] analyzeTeachers failed:', error);
            }
        }

        const stats = typeof window.getVisibleTeacherStats === 'function'
            ? (window.getVisibleTeacherStats() || {})
            : (window.TEACHER_STATS || {});
        if (!Object.keys(stats).length) {
            return { school, emptyMessage: '当前还没有可用的教师画像数据。' };
        }

        return {
            school,
            stats,
            rankings: window.TEACHER_TOWNSHIP_RANKINGS || {},
            rankingTables: window.TOWNSHIP_RANKING_DATA || {},
            emptyMessage: ''
        };
    }

    function macroBuildTeacherCountyPortraitData(school) {
        const currentSchool = macroResolveCurrentSchoolName();
        const cacheKey = [
            String(CURRENT_EXAM_ID || 'current'),
            String(school || ''),
            currentSchool,
            Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
            Object.keys(TEACHER_MAP || {}).length,
            Object.keys(window.TEACHER_STATS || {}).length
        ].join('|');

        if (window.__COUNTY_TEACHER_PORTRAIT_CACHE__?.key === cacheKey) {
            return window.__COUNTY_TEACHER_PORTRAIT_CACHE__.data;
        }

        const source = macroEnsureTeacherCountySources(school);
        if (source.emptyMessage) {
            const data = {
                school: source.school,
                cards: [],
                rows: [],
                rankingPanels: [],
                summary: null,
                emptyMessage: source.emptyMessage
            };
            window.__COUNTY_TEACHER_PORTRAIT_CACHE__ = { key: cacheKey, data };
            return data;
        }

        const schoolName = source.school;
        const stats = source.stats;
        const rankings = source.rankings;
        const schoolMetrics = SCHOOLS?.[schoolName]?.metrics || {};
        const schoolRankings = SCHOOLS?.[schoolName]?.rankings || {};
        const rankingPanels = [];
        const rows = [];

        Object.keys(stats || {}).forEach((teacherName) => {
            Object.keys(stats[teacherName] || {}).forEach((subject) => {
                const data = stats[teacherName][subject];
                const rankInfo = rankings?.[teacherName]?.[subject] || {};
                const countyAvg = macroAverage(
                    Object.values(SCHOOLS || {})
                        .map((item) => item?.metrics?.[subject]?.avg)
                        .filter((value) => Number.isFinite(Number(value)))
                );
                const schoolSubjectAvg = macroToNumber(schoolMetrics?.[subject]?.avg, NaN);
                const schoolSubjectRank = macroToNumber(schoolRankings?.[subject]?.avg, NaN);
                const schoolRankDelta = Number.isFinite(schoolSubjectRank) && Number.isFinite(Number(rankInfo.rankAvg))
                    ? schoolSubjectRank - Number(rankInfo.rankAvg)
                    : null;

                const diagnosis = [];
                if (Number.isFinite(Number(rankInfo.rankAvg)) && Number(rankInfo.rankAvg) <= 3) {
                    diagnosis.push('同学科县域前列');
                }
                if (Number.isFinite(Number(schoolRankDelta)) && Number(schoolRankDelta) >= 2) {
                    diagnosis.push(`高于本校学科站位${schoolRankDelta}名`);
                } else if (Number.isFinite(Number(schoolRankDelta)) && Number(schoolRankDelta) <= -2) {
                    diagnosis.push(`低于本校学科站位${Math.abs(schoolRankDelta)}名`);
                }
                if (teacherToNumber(data.riskLevel === 'risk' ? 1 : 0, 0) === 1) {
                    diagnosis.push('画像提示重点关注');
                } else if (teacherToNumber(data.fairScore, 0) >= 85) {
                    diagnosis.push('画像综合状态强势');
                }
                if (!diagnosis.length) diagnosis.push('与本校学科站位接近');

                rows.push({
                    teacher: teacherName,
                    subject,
                    classes: data.classesText || data.classes || '',
                    studentCount: teacherToNumber(data.studentCount, 0),
                    previousSampleCount: teacherToNumber(data.previousSampleCount, 0),
                    commonSampleCount: teacherToNumber(data.commonSampleCount, 0),
                    addedSampleCount: teacherToNumber(data.addedSampleCount, 0),
                    exitedSampleCount: teacherToNumber(data.exitedSampleCount, 0),
                    sampleStabilityText: data.sampleStabilityText || '0%',
                    sampleWarning: !!data.sampleWarning,
                    sampleDetailText: data.sampleDetailText || '',
                    sampleChangeText: teacherToNumber(data.previousSampleCount, 0) > 0
                        ? `新增 ${teacherToNumber(data.addedSampleCount, 0)} / 缺考退出 ${teacherToNumber(data.exitedSampleCount, 0)}`
                        : '暂无基线',
                    avg: teacherToNumber(data.avgValue, 0),
                    avgText: data.avg || teacherToNumber(data.avgValue, 0).toFixed(2),
                    countyAvg,
                    schoolSubjectAvg,
                    leagueScoreRaw: teacherToNumber(data.leagueScoreRaw, 0),
                    leagueScore: teacherToNumber(data.leagueScore, 0),
                    baselineAdjustment: teacherToNumber(data.baselineAdjustment, 0),
                    baselineCoverageText: data.baselineCoverageText || '0%',
                    excellentRate: teacherToNumber(data.excellentRate, 0),
                    passRate: teacherToNumber(data.passRate, 0),
                    lowRate: teacherToNumber(data.lowRate, 0),
                    conversionScore: teacherToNumber(data.conversionScore, 50),
                    conversionAdjustment: teacherToNumber(data.conversionAdjustment, 0),
                    conversionSummary: data.conversionSummary || '暂无转化样本',
                    focusSummary: data.focusSummary || '培优0 / 临界0 / 辅差0',
                    focusTargets: data.focusTargets || {},
                    fairScore: teacherToNumber(data.fairScore, 0),
                    fairRank: data.fairRank || null,
                    confidenceFactor: teacherToNumber(data.confidenceFactor, 1),
                    workloadAdjustment: teacherToNumber(data.workloadAdjustment, 0),
                    teacherContinuityText: data.teacherContinuityText || '',
                    expectedAvg: teacherToNumber(data.expectedAvg, 0),
                    expectedExcellentRate: teacherToNumber(data.expectedExcellentRate, 0),
                    expectedPassRate: teacherToNumber(data.expectedPassRate, 0),
                    expectedLowRate: teacherToNumber(data.expectedLowRate, 0),
                    rankAvg: rankInfo.rankAvg ?? null,
                    rankExc: rankInfo.rankExc ?? null,
                    rankPass: rankInfo.rankPass ?? null,
                    schoolRankDelta,
                    riskLevel: data.riskLevel || 'normal',
                    diagnosis: diagnosis.join('，')
                });
            });
        });

        rows.sort((left, right) => {
            const subjectDiff = sortSubjectsFn(left.subject, right.subject);
            if (subjectDiff !== 0) return subjectDiff;
            const fairDiff = teacherToNumber(right.fairScore, 0) - teacherToNumber(left.fairScore, 0);
            if (fairDiff !== 0) return fairDiff;
            return String(left.teacher || '').localeCompare(String(right.teacher || ''), 'zh-CN');
        });

        const teacherSubjectSet = new Set(rows.map((row) => row.subject));
        Object.keys(source.rankingTables || {}).sort(sortSubjectsFn).forEach((subject) => {
            if (teacherSubjectSet.size && !teacherSubjectSet.has(subject)) return;
            const panelRows = Array.isArray(source.rankingTables?.[subject])
                ? source.rankingTables[subject].slice()
                : [];
            if (!panelRows.length) return;

            const schoolRows = panelRows.filter((row) => row.type === 'school');
            const countyAvg = macroAverage(schoolRows.map((row) => row.avg));
            const countyExc = macroAverage(schoolRows.map((row) => row.excellentRate));
            const countyPass = macroAverage(schoolRows.map((row) => row.passRate));

            rankingPanels.push({
                subject,
                countyAvg,
                countyExc,
                countyPass,
                rows: panelRows.map((row) => {
                    const localTeacherRow = row.type === 'teacher'
                        ? rows.find((item) => item.teacher === row.name && item.subject === subject)
                        : null;
                    return {
                        name: row.name,
                        type: row.type,
                        avg: teacherToNumber(row.avg, 0),
                        excellentRate: teacherToNumber(row.excellentRate, 0),
                        passRate: teacherToNumber(row.passRate, 0),
                        rankAvg: row.rankAvg ?? null,
                        rankExc: row.rankExc ?? null,
                        rankPass: row.rankPass ?? null,
                        fairScore: localTeacherRow ? localTeacherRow.fairScore : null,
                        avgDiff: Number.isFinite(Number(countyAvg)) ? teacherToNumber(row.avg, 0) - Number(countyAvg) : null,
                        excDiff: Number.isFinite(Number(countyExc)) ? teacherToNumber(row.excellentRate, 0) - Number(countyExc) : null,
                        passDiff: Number.isFinite(Number(countyPass)) ? teacherToNumber(row.passRate, 0) - Number(countyPass) : null,
                        isTeacher: row.type === 'teacher',
                        isCurrentSchoolTeacher: row.type === 'teacher' && !!localTeacherRow
                    };
                }).sort((left, right) => {
                    const rankDiff = macroToNumber(left.rankAvg, Number.POSITIVE_INFINITY) - macroToNumber(right.rankAvg, Number.POSITIVE_INFINITY);
                    if (rankDiff !== 0) return rankDiff;
                    return teacherToNumber(right.avg, 0) - teacherToNumber(left.avg, 0);
                })
            });
        });

        const user = getCurrentUserFn();
        const cards = typeof window.teacherBuildCardList === 'function'
            ? window.teacherBuildCardList(stats, rankings, user?.name || '', user?.role || 'guest')
            : macroBuildFallbackTeacherCardList(stats, rankings);
        const bestRow = rows[0] || null;
        const summary = {
            recordCount: rows.length,
            bestRank: rows.reduce((best, row) => Math.min(best, teacherToNumber(row.rankAvg, Number.POSITIVE_INFINITY)), Number.POSITIVE_INFINITY),
            aheadCount: rows.filter((row) => Number.isFinite(Number(row.schoolRankDelta)) && Number(row.schoolRankDelta) >= 1).length,
            concernCount: rows.filter((row) => Number.isFinite(Number(row.schoolRankDelta)) && Number(row.schoolRankDelta) <= -2).length,
            avgFairScore: macroAverage(rows.map((row) => row.fairScore)),
            riskCount: rows.filter((row) => row.riskLevel === 'risk').length,
            bestTeacher: bestRow ? `${bestRow.teacher} · ${bestRow.subject}` : ''
        };

        const result = {
            school: schoolName,
            cards,
            rows,
            rankingPanels,
            summary,
            emptyMessage: ''
        };
        window.__COUNTY_TEACHER_PORTRAIT_CACHE__ = { key: cacheKey, data: result };
        return result;
    }

    function macroRenderSummaryCards(cards) {
        if (!Array.isArray(cards) || !cards.length) return '';
        return `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin:14px 0 16px 0;">
                ${cards.map((card) => `
                    <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:14px; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                        <div style="font-size:12px; color:#64748b; margin-bottom:6px;">${macroEscapeHtml(card.label)}</div>
                        <div style="font-size:20px; font-weight:800; color:#0f172a;">${macroEscapeHtml(card.value)}</div>
                        <div style="font-size:12px; color:#475569; margin-top:6px;">${macroEscapeHtml(card.sub)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function macroRenderTeacherCards(cards) {
        if (!Array.isArray(cards) || !cards.length) return '';
        return `
            <div class="teacher-cards-container" style="margin:10px 0 18px 0;">
                ${cards.map((item) => `
                    <div class="teacher-card">
                        <div class="teacher-header">
                            <div>
                                <div class="teacher-name">${teacherEscapeHtml(item.name)} - ${teacherEscapeHtml(item.subject)}</div>
                                <div class="teacher-classes">${teacherEscapeHtml(item.classes)}班</div>
                            </div>
                            <div class="performance-badge ${teacherEscapeHtml(item.badgeClass || 'performance-average')}">${teacherEscapeHtml(item.badgeText || '稳健')}</div>
                        </div>
                        <div class="teacher-stats">
                            <div class="stat-item">
                                <div class="stat-value">${teacherEscapeHtml(item.avg)}</div>
                                <div class="stat-label">均分</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${teacherEscapeHtml(item.leagueScoreRaw || '-')}</div>
                                <div class="stat-label">联考赋分</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${teacherEscapeHtml(item.fairScore || '-')}</div>
                                <div class="stat-label">公平绩效</div>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                            <span>优 / 及 / 低: ${teacherEscapeHtml(item.excRate || '-')} / ${teacherEscapeHtml(item.passRate || '-')} / ${teacherEscapeHtml(item.lowRate || '-')}</span>
                            <span>县排: <strong style="color:var(--primary)">${teacherEscapeHtml(item.rank || '-')}</strong></span>
                        </div>
                        <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                            <span>基线校正 ${teacherEscapeHtml(item.baselineAdjustment || '-')} · 覆盖 ${teacherEscapeHtml(item.baselineCoverage || '0%')}</span>
                            <span>稳定 ${teacherEscapeHtml(item.sampleStability || '0%')} · 转化 ${teacherEscapeHtml(item.conversionScore || '-')}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                            <span>${teacherEscapeHtml(item.sampleSummary || '暂无样本说明')}</span>
                            <span>${teacherEscapeHtml(item.focusSummary || '暂无重点学生')}</span>
                        </div>
                        ${typeof window.showTeacherDetails === 'function'
                            ? `<button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(item.name)}, ${JSON.stringify(item.subject)})'>查看详情</button>`
                            : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    function macroRenderTeacherRankingPanels(panels) {
        if (!Array.isArray(panels) || !panels.length) return '';

        return panels.map((panel) => {
            const bodyRows = panel.rows.map((row) => {
                const typeText = row.type === 'teacher' ? '教师' : '学校';
                const badgeClass = row.type === 'teacher'
                    ? 'analysis-row-badge analysis-row-badge-teacher'
                    : 'analysis-row-badge analysis-row-badge-school';
                return `
                    <tr class="${row.isCurrentSchoolTeacher ? 'analysis-row-emphasis' : ''}">
                        <td>${teacherEscapeHtml(row.name)}</td>
                        <td><span class="${badgeClass}">${typeText}</span></td>
                        <td>${macroFormatPlainValue(row.avg)}</td>
                        <td class="${teacherToNumber(row.avgDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.avgDiff)) ? macroFormatSignedValue(row.avgDiff) : '-'}</td>
                        <td>${macroFormatRank(row.rankAvg)}</td>
                        <td>${macroFormatPercent(row.excellentRate)}</td>
                        <td class="${teacherToNumber(row.excDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.excDiff)) ? macroFormatSignedValue(Number(row.excDiff) * 100, 1) + '%' : '-'}</td>
                        <td>${macroFormatRank(row.rankExc)}</td>
                        <td>${macroFormatPercent(row.passRate)}</td>
                        <td class="${teacherToNumber(row.passDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.passDiff)) ? macroFormatSignedValue(Number(row.passDiff) * 100, 1) + '%' : '-'}</td>
                        <td>${macroFormatRank(row.rankPass)}</td>
                        <td>${row.isTeacher && Number.isFinite(Number(row.fairScore)) ? macroFormatPlainValue(row.fairScore, 1) : '-'}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${macroEscapeHtml(panel.subject)} 同学科县域对标榜</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">教师 + 学校同表</span>
                            <span class="analysis-table-tag">教师与其他学校同学科对标</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">
                        该表把本校教师与县域内其他学校同学科表现放在同一张榜单里，直接查看均分、优秀率、及格率的真实站位。
                    </div>
                    <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                        <table class="common-table analysis-generated-table" style="font-size:13px;">
                            <thead>
                                <tr>
                                    <th>名称</th>
                                    <th>类型</th>
                                    <th>均分</th>
                                    <th>较县均差</th>
                                    <th>均分排</th>
                                    <th>优秀率</th>
                                    <th>较县均差</th>
                                    <th>优率排</th>
                                    <th>及格率</th>
                                    <th>较县均差</th>
                                    <th>及格排</th>
                                    <th>公平绩效</th>
                                </tr>
                            </thead>
                            <tbody>${bodyRows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('');
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
        if (examIds.some((id) => !id)) {
            setMacroCompareHintState(hintEl, '请完整选择所有考试期次。', 'error');
            renderMacroCompareEmptyState(resultEl, '考试期次未选完整', '补齐所需期次后，系统会生成县域多期分析。');
            return;
        }
        if (new Set(examIds).size !== examIds.length) {
            setMacroCompareHintState(hintEl, '期次不能重复，请选择不同考试。', 'error');
            renderMacroCompareEmptyState(resultEl, '期次配置有冲突', '请使用不同的考试期次进行对比。');
            return;
        }

        const rowsByExam = examIds.map((examId) => ({ examId, rows: getExamRowsForCompare(examId) }));
        if (rowsByExam.some((item) => !item.rows.length)) {
            setMacroCompareHintState(hintEl, '某些期次没有可用成绩数据，请检查考试数据。', 'error');
            renderMacroCompareEmptyState(resultEl, '缺少可用成绩数据', '至少有一期考试没有可用于县域分析的成绩。');
            return;
        }

        const summaryByExam = rowsByExam.map((item) => ({
            examId: item.examId,
            summary: buildSchoolSummaryForExam(item.rows)
        }));
        const overviewByExam = rowsByExam.map((item) => ({
            examId: item.examId,
            overview: buildSchoolRankOverviewForRows(item.rows)
        }));

        const schoolEntries = overviewByExam.map((item) => ({
            examId: item.examId,
            entry: getSchoolRankOverviewEntryBySchool(item.overview, school)
        }));
        if (schoolEntries.some((item) => !item.entry || !item.entry.total)) {
            setMacroCompareHintState(hintEl, '所选学校在某些期次中无数据，无法对比。', 'error');
            renderMacroCompareEmptyState(resultEl, '学校数据不完整', '所选学校在部分考试里没有成绩，当前无法生成连续对比。');
            return;
        }

        const schoolTrendRows = macroBuildSchoolTrendRows(
            examIds,
            overviewByExam.map((item) => item.overview),
            school
        );
        const countyInsightRows = macroBuildCountyInsightRows(
            examIds,
            overviewByExam.map((item) => item.overview),
            school
        );

        const schoolRowsHtml = schoolTrendRows.map((row) => `
            <tr>
                <td>${macroEscapeHtml(row.examId)}</td>
                <td>${row.count}</td>
                <td>${macroFormatPlainValue(row.avg)}</td>
                <td>${macroFormatRank(row.totalRank)}</td>
                <td>${macroFormatPercent(row.excRate)}</td>
                <td>${macroFormatPercent(row.passRate)}</td>
                <td>${macroFormatPlainValue(row.avgSubjectRank)}</td>
                <td>${macroEscapeHtml(row.leaderSubjectsText)}</td>
                <td>${macroEscapeHtml(row.weakSubjectsText)}</td>
            </tr>
        `).join('');

        const countyInsightRowsHtml = countyInsightRows.map((row) => `
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
            ? allSchoolsChange.map((row) => `
                <tr>
                    <td>${macroEscapeHtml(row.school)}</td>
                    <td style="font-weight:bold; color:${row.dAvg >= 0 ? 'var(--success)' : 'var(--danger)'};">${macroFormatSignedValue(row.dAvg)}</td>
                    <td>${macroFormatSignedValue(row.dExc * 100, 1)}%</td>
                    <td>${macroFormatSignedValue(row.dPass * 100, 1)}%</td>
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
                    ${row.subjectRanks.map((rank) => `<td>${macroFormatRank(rank)}</td>`).join('')}
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
            : '末期矩阵把镇所有学校与县级所有学校放进同一张表，便于判断本校在完整学校池中的真实位置。';

        const countyHorizontalRows = latestOverview ? macroBuildCountyHorizontalRows(latestOverview, school) : [];
        const countyHorizontalHeaders = ['学校', '人数', '均分', '均分县排', '优秀率', '优秀率排', '及格率', '及格率排', '均分赋分', '优率赋分', '及格赋分', '两率一分总分', '总分排位', '较县均差'];
        const countyHorizontalHtml = countyHorizontalRows.length
            ? countyHorizontalRows.map((row) => `
                <tr class="${row.isFocusSchool ? 'bg-highlight' : ''}">
                    <td style="font-weight:${row.isFocusSchool ? '700' : '600'};">${macroEscapeHtml(row.school)}</td>
                    <td>${row.count}</td>
                    <td>${macroFormatPlainValue(row.avg)}</td>
                    <td>${macroFormatRank(row.avgRank)}</td>
                    <td>${macroFormatPercent(row.excRate)}</td>
                    <td>${macroFormatRank(row.excRank)}</td>
                    <td>${macroFormatPercent(row.passRate)}</td>
                    <td>${macroFormatRank(row.passRank)}</td>
                    <td>${macroFormatPlainValue(row.ratedAvg)}</td>
                    <td>${macroFormatPlainValue(row.ratedExc)}</td>
                    <td>${macroFormatPlainValue(row.ratedPass)}</td>
                    <td style="font-weight:700; color:#b91c1c;">${macroFormatPlainValue(row.score2Rate)}</td>
                    <td>${macroFormatRank(row.scoreRank)}</td>
                    <td class="${teacherToNumber(row.avgDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.avgDiff)) ? macroFormatSignedValue(row.avgDiff) : '-'}</td>
                </tr>
            `).join('')
            : '';

        const countySubjectPortraitRows = latestOverview ? macroBuildCountySubjectPortraitRows(latestOverview, school) : [];
        const countySubjectPortraitHeaders = ['学科', '人数', '均分', '均分排', '较县均差', '优秀率', '优率排', '较县均差', '及格率', '及格率排', '较县均差', '榜首学校', '距榜首均分'];
        const countySubjectPortraitHtml = countySubjectPortraitRows.length
            ? countySubjectPortraitRows.map((row) => `
                <tr>
                    <td style="font-weight:600;">${macroEscapeHtml(row.subject)}</td>
                    <td>${row.count}</td>
                    <td>${macroFormatPlainValue(row.avg)}</td>
                    <td>${macroFormatRank(row.rankAvg)}</td>
                    <td class="${teacherToNumber(row.avgDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.avgDiff)) ? macroFormatSignedValue(row.avgDiff) : '-'}</td>
                    <td>${macroFormatPercent(row.excRate)}</td>
                    <td>${macroFormatRank(row.rankExc)}</td>
                    <td class="${teacherToNumber(row.excDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.excDiff)) ? macroFormatSignedValue(Number(row.excDiff) * 100, 1) + '%' : '-'}</td>
                    <td>${macroFormatPercent(row.passRate)}</td>
                    <td>${macroFormatRank(row.rankPass)}</td>
                    <td class="${teacherToNumber(row.passDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.passDiff)) ? macroFormatSignedValue(Number(row.passDiff) * 100, 1) + '%' : '-'}</td>
                    <td>${macroEscapeHtml(row.topSchool || '-')}</td>
                    <td>${macroFormatPlainValue(row.gapToTopAvg)}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="13" style="text-align:center; color:#94a3b8;">暂无学科画像数据</td></tr>';

        const countySubjectSchoolTables = latestOverview ? macroBuildCountySubjectSchoolTables(latestOverview, school) : [];
        const countySubjectSchoolPanelsHtml = countySubjectSchoolTables.map((panel) => `
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>${macroEscapeHtml(panel.subject)} 县域横向排名</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${macroEscapeHtml(panel.leaderSchool || '暂无榜首')}</span>
                        <span class="analysis-table-tag">${panel.rows.length} 校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">
                    这里展示末期 ${macroEscapeHtml(panel.subject)} 在完整学校池中的横向结果，可直接查看本校与所有学校的同学科位次差。
                </div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>
                                <th>学校</th>
                                <th>人数</th>
                                <th>均分</th>
                                <th>较县均差</th>
                                <th>均分排</th>
                                <th>优秀率</th>
                                <th>较县均差</th>
                                <th>优率排</th>
                                <th>及格率</th>
                                <th>较县均差</th>
                                <th>及格排</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${panel.rows.map((row) => `
                                <tr class="${row.isFocusSchool ? 'bg-highlight' : ''}">
                                    <td style="font-weight:${row.isFocusSchool ? '700' : '600'};">${macroEscapeHtml(row.school)}</td>
                                    <td>${row.count}</td>
                                    <td>${macroFormatPlainValue(row.avg)}</td>
                                    <td class="${teacherToNumber(row.avgDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.avgDiff)) ? macroFormatSignedValue(row.avgDiff) : '-'}</td>
                                    <td>${macroFormatRank(row.rankAvg)}</td>
                                    <td>${macroFormatPercent(row.excRate)}</td>
                                    <td class="${teacherToNumber(row.excDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.excDiff)) ? macroFormatSignedValue(Number(row.excDiff) * 100, 1) + '%' : '-'}</td>
                                    <td>${macroFormatRank(row.rankExc)}</td>
                                    <td>${macroFormatPercent(row.passRate)}</td>
                                    <td class="${teacherToNumber(row.passDiff, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${Number.isFinite(Number(row.passDiff)) ? macroFormatSignedValue(Number(row.passDiff) * 100, 1) + '%' : '-'}</td>
                                    <td>${macroFormatRank(row.rankPass)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');

        const teacherPortraitData = macroBuildTeacherCountyPortraitData(school);
        const teacherSummaryCards = teacherPortraitData.summary ? [
            { label: '本校', value: teacherPortraitData.school, sub: `${teacherPortraitData.summary.recordCount} 条教师学科画像` },
            { label: '最佳县排', value: Number.isFinite(Number(teacherPortraitData.summary.bestRank)) ? `#${teacherPortraitData.summary.bestRank}` : '-', sub: teacherPortraitData.summary.bestTeacher || '暂无最佳记录' },
            { label: '高于本校站位', value: String(teacherPortraitData.summary.aheadCount), sub: '教师表现高于本校对应学科站位' },
            { label: '重点关注', value: String(teacherPortraitData.summary.concernCount), sub: '教师表现低于本校对应学科站位' },
            { label: '平均公平绩效', value: Number.isFinite(Number(teacherPortraitData.summary.avgFairScore)) ? macroFormatPlainValue(teacherPortraitData.summary.avgFairScore, 1) : '-', sub: `${teacherPortraitData.summary.riskCount} 条画像提示风险` }
        ] : [];
        const teacherRowsHtml = teacherPortraitData.rows.map((row) => `
            <tr>
                <td style="font-weight:600;">${macroEscapeHtml(row.teacher)}</td>
                <td>${macroEscapeHtml(row.subject)}</td>
                <td>${macroEscapeHtml(row.classes)}</td>
                <td>${row.studentCount}</td>
                <td title="${macroEscapeHtml(row.sampleDetailText || '')}" style="${row.sampleWarning ? 'color:#b45309; font-weight:700;' : ''}">
                    <div>${row.previousSampleCount > 0 ? row.commonSampleCount : '—'}</div>
                    <div style="font-size:11px; color:#64748b;">稳定 ${macroEscapeHtml(row.previousSampleCount > 0 ? row.sampleStabilityText : '待历史样本')}</div>
                </td>
                <td title="${macroEscapeHtml(row.sampleDetailText || '')}" style="${row.sampleWarning ? 'color:#b45309; font-weight:700;' : ''}">
                    <div>${macroEscapeHtml(row.sampleChangeText)}</div>
                    <div style="font-size:11px; color:#64748b;">上次 ${row.previousSampleCount}</div>
                </td>
                <td>${macroFormatPlainValue(row.avg)}</td>
                <td>
                    <div style="font-weight:700; color:#0369a1;">${macroFormatPlainValue(row.leagueScoreRaw, 1)}</div>
                    <div style="font-size:11px; color:#64748b;">折算 ${macroFormatPlainValue(row.leagueScore, 1)} / 100</div>
                </td>
                <td>
                    <div class="${row.baselineAdjustment >= 0 ? 'positive-percent' : 'negative-percent'}" style="font-weight:700;">${teacherFormatSigned(row.baselineAdjustment, 1)}</div>
                    <div style="font-size:11px; color:#64748b;">覆盖 ${macroEscapeHtml(row.baselineCoverageText)}</div>
                </td>
                <td>${macroFormatPercent(row.excellentRate)}</td>
                <td>${macroFormatPercent(row.passRate)}</td>
                <td style="${row.lowRate >= 0.12 ? 'color:#dc2626; font-weight:700;' : ''}">${macroFormatPercent(row.lowRate)}</td>
                <td title="${macroEscapeHtml(row.conversionSummary || '')}">
                    <div style="font-weight:700; color:#0369a1;">${macroFormatPlainValue(row.conversionScore, 1)}${row.conversionAdjustment ? ` (${teacherFormatSigned(row.conversionAdjustment, 1)})` : ''}</div>
                    <div style="font-size:11px; color:#64748b;">${macroEscapeHtml(row.conversionSummary)}</div>
                </td>
                <td title="${macroEscapeHtml([
                    `培优: ${teacherFormatFocusList(row.focusTargets?.excellentEdges, '暂无')}`,
                    `临界: ${teacherFormatFocusList(row.focusTargets?.passEdges, '暂无')}`,
                    `辅差: ${teacherFormatFocusList(row.focusTargets?.lowRisk, '暂无')}`
                ].join(' | '))}">${macroEscapeHtml(row.focusSummary)}</td>
                <td style="background:#fffbeb; font-weight:800; color:#b45309;">
                    <div>${macroFormatPlainValue(row.fairScore, 1)}</div>
                    <div style="font-size:11px; color:#92400e;">校内同科第 ${macroEscapeHtml(row.fairRank || '-')}</div>
                </td>
                <td>${macroFormatRank(row.rankAvg)}</td>
                <td>${macroFormatRank(row.rankExc)}</td>
                <td>${macroFormatRank(row.rankPass)}</td>
                <td>${macroEscapeHtml(row.diagnosis)}</td>
            </tr>
        `).join('');
        const teacherPanelHtml = teacherPortraitData.rows.length
            ? `
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>县域版教师教学质量画像</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">${macroEscapeHtml(teacherPortraitData.school)}</span>
                            <span class="analysis-table-tag">教师与其他学校同学科排名对比</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">
                        教师画像基于当前已加载考试和本校任课表，完整展示联考赋分、基线校正、样本稳定、转化分、公平绩效，以及与其他学校同学科的县域排名。
                    </div>
                    ${macroRenderSummaryCards(teacherSummaryCards)}
                    ${macroRenderTeacherCards(teacherPortraitData.cards)}
                    <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                        <table class="common-table analysis-generated-table" style="font-size:13px;">
                            <thead>
                                <tr>
                                    <th>教师</th>
                                    <th>学科</th>
                                    <th>任教班级</th>
                                    <th>人数</th>
                                    <th>共同样本</th>
                                    <th>样本变动</th>
                                    <th>均分</th>
                                    <th>联考赋分</th>
                                    <th>基线校正</th>
                                    <th>优秀率</th>
                                    <th>及格率</th>
                                    <th>低分率</th>
                                    <th>转化分</th>
                                    <th>重点学生</th>
                                    <th>公平绩效</th>
                                    <th>均分县排</th>
                                    <th>优率排</th>
                                    <th>及格率排</th>
                                    <th>对标解读</th>
                                </tr>
                            </thead>
                            <tbody>${teacherRowsHtml}</tbody>
                        </table>
                    </div>
                </div>
                ${macroRenderTeacherRankingPanels(teacherPortraitData.rankingPanels)}
            `
            : `
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>县域版教师教学质量画像</span>
                    </div>
                    <div class="analysis-empty-state">${macroEscapeHtml(teacherPortraitData.emptyMessage || '暂无教师县域画像数据')}</div>
                </div>
            `;

        const changeLabel = `${examIds[0]} -> ${examIds[examIds.length - 1]}`;
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
                    <span>县域版两率一分（横向）总表</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${macroEscapeHtml(examIds[examIds.length - 1])}</span>
                        <span class="analysis-table-tag">${countyHorizontalRows.length} 校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">对齐“联考分析”的横向口径，在县域模块里直接看所有学校的均分、两率一分总分、总排名，以及和县均的差值。</div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>${countyHorizontalHeaders.map((header) => `<th>${macroEscapeHtml(header)}</th>`).join('')}</tr>
                        </thead>
                        <tbody>${countyHorizontalHtml || `<tr><td colspan="${countyHorizontalHeaders.length}" style="text-align:center; color:#94a3b8;">暂无横向总表数据</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>县域版两率一分（横向）学科画像</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${macroEscapeHtml(school)}</span>
                        <span class="analysis-table-tag">对齐联考分析子模块</span>
                    </span>
                </div>
                <div class="analysis-generated-note">这里专门展开本校各学科在县域内的均分、优秀率、及格率排名，并给出与县均、榜首学校的差距。</div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>${countySubjectPortraitHeaders.map((header) => `<th>${macroEscapeHtml(header)}</th>`).join('')}</tr>
                        </thead>
                        <tbody>${countySubjectPortraitHtml}</tbody>
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
                            <tr>${rankMatrixHeaders.map((header) => `<th>${macroEscapeHtml(header)}</th>`).join('')}</tr>
                        </thead>
                        <tbody>${rankMatrixHtml || `<tr><td colspan="${rankMatrixHeaders.length || 1}" style="text-align:center; color:#94a3b8;">暂无末期排名数据</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            ${countySubjectSchoolPanelsHtml}
            ${teacherPanelHtml}
        `;

        setMacroCompareHintState(hintEl, `已完成 ${periodCount} 期县域对比：${examIds.join(' -> ')}`, 'success');
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
            countyHorizontalHeaders,
            countyHorizontalRows,
            countySubjectPortraitHeaders,
            countySubjectPortraitRows,
            countySubjectSchoolTables,
            teacherCountyRows: teacherPortraitData.rows,
            teacherCountyCards: teacherPortraitData.cards,
            teacherCountySummary: teacherPortraitData.summary,
            teacherCountyRankingPanels: teacherPortraitData.rankingPanels,
            teacherCountyMessage: teacherPortraitData.emptyMessage || '',
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
            countyHorizontalHeaders = [],
            countyHorizontalRows = [],
            countySubjectPortraitHeaders = [],
            countySubjectPortraitRows = [],
            countySubjectSchoolTables = [],
            teacherCountyRows = [],
            teacherCountyRankingPanels = []
        } = cache;

        const wb = XLSX.utils.book_new();
        const sheetNameBuilder = typeof window.buildSafeSheetName === 'function'
            ? window.buildSafeSheetName
            : ((subject, prefix = '') => String(`${prefix}${subject}`).slice(0, 31));

        const schoolData = [['学校', '期次', '人数', '总分均分', '总分县排', '优秀率', '及格率', '学科平均排位', '优势学科', '短板学科']];
        schoolTrendRows.forEach((row) => {
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
        const allData = [['学校', `${first}->${last}均分变化`, `${first}->${last}优秀率变化`, `${first}->${last}及格率变化`, `${first}->${last}排位变化`]];
        allSchoolsChange.forEach((row) => allData.push([row.school, row.dAvg, row.dExc, row.dPass, row.dRank]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(allData), '所有学校首末变化');

        const countyData = [['期次', '总分县排', '学科平均排位', '榜首学科数', '优势学科', '短板学科', '距榜首均分', '较县均差', '县域梯队']];
        countyInsightRows.forEach((row) => {
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

        if (countyHorizontalHeaders.length && countyHorizontalRows.length) {
            const countyHorizontalData = [countyHorizontalHeaders];
            countyHorizontalRows.forEach((row) => {
                countyHorizontalData.push([
                    row.school,
                    row.count,
                    row.avg,
                    row.avgRank,
                    row.excRate,
                    row.excRank,
                    row.passRate,
                    row.passRank,
                    row.ratedAvg,
                    row.ratedExc,
                    row.ratedPass,
                    row.score2Rate,
                    row.scoreRank,
                    row.avgDiff
                ]);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(countyHorizontalData), '县域横向总表');
        }

        if (countySubjectPortraitHeaders.length && countySubjectPortraitRows.length) {
            const countySubjectPortraitData = [countySubjectPortraitHeaders];
            countySubjectPortraitRows.forEach((row) => {
                countySubjectPortraitData.push([
                    row.subject,
                    row.count,
                    row.avg,
                    row.rankAvg,
                    row.avgDiff,
                    row.excRate,
                    row.rankExc,
                    row.excDiff,
                    row.passRate,
                    row.rankPass,
                    row.passDiff,
                    row.topSchool,
                    row.gapToTopAvg
                ]);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(countySubjectPortraitData), '学科画像');
        }

        if (rankMatrixHeaders.length && rankMatrixRows.length) {
            XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.aoa_to_sheet([rankMatrixHeaders, ...rankMatrixRows]),
                '学校排名矩阵'
            );
        }

        countySubjectSchoolTables.forEach((panel) => {
            const rows = [['学校', '人数', '均分', '较县均差', '均分排', '优秀率', '较县均差', '优率排', '及格率', '较县均差', '及格率排']];
            panel.rows.forEach((row) => {
                rows.push([
                    row.school,
                    row.count,
                    row.avg,
                    row.avgDiff,
                    row.rankAvg,
                    row.excRate,
                    row.excDiff,
                    row.rankExc,
                    row.passRate,
                    row.passDiff,
                    row.rankPass
                ]);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetNameBuilder(panel.subject, '横向_'));
        });

        if (teacherCountyRows.length) {
            const teacherData = [[
                '教师', '学科', '任教班级', '人数', '共同样本', '样本变动', '均分', '较县均差',
                '联考赋分', '联考赋分(折算100)', '基线校正', '优秀率', '及格率', '低分率',
                '转化分', '重点学生', '公平绩效', '校内同科排名', '均分县排', '优率排', '及格率排', '对标解读'
            ]];
            teacherCountyRows.forEach((row) => {
                const countyDiff = Number.isFinite(Number(row.countyAvg)) ? Number(row.avg) - Number(row.countyAvg) : null;
                teacherData.push([
                    row.teacher,
                    row.subject,
                    row.classes,
                    row.studentCount,
                    row.commonSampleCount,
                    row.sampleChangeText,
                    row.avg,
                    countyDiff,
                    row.leagueScoreRaw,
                    row.leagueScore,
                    row.baselineAdjustment,
                    row.excellentRate,
                    row.passRate,
                    row.lowRate,
                    row.conversionScore,
                    row.focusSummary,
                    row.fairScore,
                    row.fairRank,
                    row.rankAvg,
                    row.rankExc,
                    row.rankPass,
                    row.diagnosis
                ]);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(teacherData), '教师县域画像');
        }

        teacherCountyRankingPanels.forEach((panel) => {
            const rows = [['名称', '类型', '均分', '较县均差', '均分排', '优秀率', '较县均差', '优率排', '及格率', '较县均差', '及格率排', '公平绩效']];
            panel.rows.forEach((row) => {
                rows.push([
                    row.name,
                    row.type,
                    row.avg,
                    row.avgDiff,
                    row.rankAvg,
                    row.excellentRate,
                    row.excDiff,
                    row.rankExc,
                    row.passRate,
                    row.passDiff,
                    row.rankPass,
                    row.fairScore
                ]);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetNameBuilder(panel.subject, '教师县排_'));
        });

        XLSX.writeFile(wb, `县域多期对比_${school}_${examIds.join('_')}.xlsx`);
    }

    Object.assign(window, {
        renderMacroMultiPeriodComparison,
        exportMacroMultiPeriodComparison
    });

    window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__ = true;
})();
