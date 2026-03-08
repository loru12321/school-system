(function() {
    function getNormalizeSchoolName() {
        if (window.CompareDataService && typeof window.CompareDataService.normalizeSchoolName === 'function') {
            return window.CompareDataService.normalizeSchoolName;
        }
        return function(name) {
            return String(name || '')
                .replace(/\s+/g, '')
                .replace(/[()\uFF08\uFF09\-\u2014]/g, '')
                .trim();
        };
    }

    function getFilterRowsBySchool() {
        if (window.CompareDataService && typeof window.CompareDataService.filterRowsBySchool === 'function') {
            return window.CompareDataService.filterRowsBySchool;
        }
        const normalizeSchoolName = getNormalizeSchoolName();
        return function(rows, school) {
            const key = normalizeSchoolName(school);
            return (rows || []).filter(function(row) {
                return normalizeSchoolName(row && row.school) === key;
            });
        };
    }

    function getSubjectCount(rows, options) {
        const subjects = Array.isArray(options && options.subjects) ? options.subjects.filter(Boolean) : [];
        if (subjects.length) return subjects.length;
        const list = Array.isArray(rows) ? rows : [];
        const countFromRows = list.reduce(function(maxCount, row) {
            const scoreCount = Object.keys((row && row.scores) || {}).length;
            return Math.max(maxCount, scoreCount);
        }, 0);
        return countFromRows || 1;
    }

    function getNumericTotals(rows) {
        return (rows || [])
            .map(function(row) { return Number(row && row.total); })
            .filter(function(value) { return Number.isFinite(value); });
    }

    function calcSchoolMetricsFromRows(rows, options) {
        const list = (rows || []).filter(function(row) {
            return Number.isFinite(Number(row && row.total));
        });
        const count = list.length;
        if (!count) return null;

        const subjectCount = getSubjectCount(list, options || {});
        const totalExc = subjectCount * 90;
        const totalPass = subjectCount * 72;
        const totals = list.map(function(row) { return Number(row.total); });
        const avg = totals.reduce(function(sum, value) { return sum + value; }, 0) / count;
        const excRate = totals.filter(function(value) { return value >= totalExc; }).length / count;
        const passRate = totals.filter(function(value) { return value >= totalPass; }).length / count;
        return { count: count, avg: avg, excRate: excRate, passRate: passRate };
    }

    function getSummaryEntryBySchool(summary, school, options) {
        if (!summary) return null;
        if (summary[school]) return summary[school];
        const normalizeSchoolName = typeof (options && options.normalizeSchoolName) === 'function'
            ? options.normalizeSchoolName
            : getNormalizeSchoolName();
        const key = normalizeSchoolName(school);
        const matchedKey = Object.keys(summary).find(function(name) {
            return normalizeSchoolName(name) === key;
        });
        return matchedKey ? summary[matchedKey] : null;
    }

    function buildSchoolSummaryForExam(rows, options) {
        const summary = {};
        const grouped = {};
        (rows || []).forEach(function(row) {
            const school = String((row && row.school) || '').trim();
            if (!school) return;
            if (!grouped[school]) grouped[school] = [];
            grouped[school].push(row);
        });

        Object.entries(grouped).forEach(function(entry) {
            const school = entry[0];
            const schoolRows = entry[1];
            const metrics = calcSchoolMetricsFromRows(schoolRows, options || {});
            if (metrics) summary[school] = metrics;
        });

        const rank = Object.entries(summary).sort(function(a, b) {
            return b[1].avg - a[1].avg;
        });
        rank.forEach(function(entry, index) {
            summary[entry[0]].rankAvg = index + 1;
        });
        return summary;
    }

    function calcBottomGroupMetrics(rows, options) {
        const totals = getNumericTotals(rows).sort(function(a, b) { return b - a; });
        if (!totals.length) return { avg: 0, lowRate: 0 };

        const subjectCount = getSubjectCount(rows, options || {});
        const totalCount = totals.length;
        const bottomCount = Math.ceil(totalCount / 3);
        const config = (options && options.config) || {};
        const excRate = Number(config.excRate);
        const excludedCount = Math.ceil(bottomCount * (Number.isFinite(excRate) ? excRate : 0));
        const bottomGroup = totals.slice(-bottomCount);
        const validGroup = bottomGroup.slice(0, Math.max(0, bottomGroup.length - excludedCount));
        const avg = validGroup.length
            ? validGroup.reduce(function(sum, value) { return sum + value; }, 0) / validGroup.length
            : 0;
        const lowThreshold = subjectCount * 72 * 0.6;
        const lowRate = totals.filter(function(value) { return value < lowThreshold; }).length / totalCount;
        return { avg: avg, lowRate: lowRate };
    }

    function calcHighScoreMetrics(rows, options) {
        const totals = getNumericTotals(rows);
        const count = totals.length;
        if (!count) return { highCount: 0, highRate: 0 };
        const subjectCount = getSubjectCount(rows, options || {});
        const highThreshold = subjectCount * 90;
        const highCount = totals.filter(function(value) { return value >= highThreshold; }).length;
        return { highCount: highCount, highRate: highCount / count };
    }

    function calcIndicatorMetrics(rows, options) {
        const totals = getNumericTotals(rows);
        const count = totals.length;
        if (!count) {
            return { indicatorCount: 0, indicatorRate: 0, label: '\u672a\u8bbe\u7f6e' };
        }

        const indicatorVars = (options && options.indicator) || {};
        const ind1 = Number(indicatorVars.ind1);
        const ind2 = Number(indicatorVars.ind2);
        if (Number.isFinite(ind1) && Number.isFinite(ind2)) {
            const minValue = Math.min(ind1, ind2);
            const maxValue = Math.max(ind1, ind2);
            const indicatorCount = totals.filter(function(value) {
                return value >= minValue && value <= maxValue;
            }).length;
            return {
                indicatorCount: indicatorCount,
                indicatorRate: indicatorCount / count,
                label: minValue + '-' + maxValue
            };
        }

        const highScore = calcHighScoreMetrics(rows, options || {});
        return {
            indicatorCount: highScore.highCount,
            indicatorRate: highScore.highRate,
            label: '\u672a\u8bbe\u7f6e\uff08\u56de\u9000\u5230\u9ad8\u5206\u6bb5\uff09'
        };
    }

    function buildMacroMultiPeriodComparison(options) {
        const opts = options || {};
        const school = String(opts.school || '').trim();
        const rowsByExam = Array.isArray(opts.rowsByExam) ? opts.rowsByExam : [];
        const filterRowsBySchool = typeof opts.filterRowsBySchool === 'function'
            ? opts.filterRowsBySchool
            : getFilterRowsBySchool();
        const normalizeSchoolName = typeof opts.normalizeSchoolName === 'function'
            ? opts.normalizeSchoolName
            : getNormalizeSchoolName();
        const metricOptions = {
            subjects: Array.isArray(opts.subjects) ? opts.subjects : [],
            config: opts.config || {},
            indicator: opts.indicator || {}
        };

        const hasMissingRows = rowsByExam.some(function(item) {
            return !item || !Array.isArray(item.rows) || !item.rows.length;
        });
        const summaryByExam = rowsByExam.map(function(item) {
            return {
                examId: item.examId,
                summary: buildSchoolSummaryForExam(item.rows, metricOptions)
            };
        });
        const selectedByExam = rowsByExam.map(function(item) {
            return {
                examId: item.examId,
                rows: filterRowsBySchool(item.rows, school)
            };
        });
        const hasMissingSelectedRows = selectedByExam.some(function(item) {
            return !item.rows.length;
        });

        const moduleSeries = hasMissingSelectedRows ? [] : selectedByExam.map(function(item, index) {
            const schoolSummary = getSummaryEntryBySchool(summaryByExam[index] && summaryByExam[index].summary, school, {
                normalizeSchoolName: normalizeSchoolName
            });
            const metrics = calcSchoolMetricsFromRows(item.rows, metricOptions);
            const bottomGroup = calcBottomGroupMetrics(item.rows, metricOptions);
            const highScore = calcHighScoreMetrics(item.rows, metricOptions);
            const indicator = calcIndicatorMetrics(item.rows, metricOptions);

            const riskLevel = metrics.passRate < 0.6
                ? '\u7ea2\u8272\u9884\u8b66'
                : (metrics.passRate < 0.75 || metrics.excRate < 0.15 ? '\u9ec4\u8272\u5173\u6ce8' : '\u7eff\u8272\u7a33\u5b9a');

            return {
                examId: item.examId,
                count: metrics.count,
                avg: metrics.avg,
                excRate: metrics.excRate,
                passRate: metrics.passRate,
                rankAvg: (schoolSummary && schoolSummary.rankAvg) || '-',
                riskLevel: riskLevel,
                highCount: highScore.highCount,
                highRate: highScore.highRate,
                indicatorCount: indicator.indicatorCount,
                indicatorRate: indicator.indicatorRate,
                indicatorLabel: indicator.label,
                bottom3Avg: bottomGroup.avg,
                lowRate: bottomGroup.lowRate
            };
        });

        const firstSummary = summaryByExam.length ? summaryByExam[0].summary : null;
        const lastSummary = summaryByExam.length ? summaryByExam[summaryByExam.length - 1].summary : null;
        const allSchoolsChange = firstSummary && lastSummary
            ? Object.keys(lastSummary).map(function(name) {
                const before = getSummaryEntryBySchool(firstSummary, name, { normalizeSchoolName: normalizeSchoolName });
                const after = lastSummary[name];
                if (!before || !after) return null;
                return {
                    school: name,
                    dAvg: after.avg - before.avg,
                    dExc: after.excRate - before.excRate,
                    dPass: after.passRate - before.passRate,
                    dRank: before.rankAvg - after.rankAvg
                };
            }).filter(Boolean).sort(function(a, b) {
                return Math.abs(b.dAvg) - Math.abs(a.dAvg);
            })
            : [];

        return {
            school: school,
            rowsByExam: rowsByExam,
            summaryByExam: summaryByExam,
            selectedByExam: selectedByExam,
            moduleSeries: moduleSeries,
            allSchoolsChange: allSchoolsChange,
            hasMissingRows: hasMissingRows,
            hasMissingSelectedRows: hasMissingSelectedRows
        };
    }

    function buildMacroMultiPeriodExportData(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const school = String(cache.school || '').trim();
        const examIds = Array.isArray(cache.examIds) ? cache.examIds : [];
        const summaryByExam = Array.isArray(cache.summaryByExam) ? cache.summaryByExam : [];
        const allSchoolsChange = Array.isArray(cache.allSchoolsChange) ? cache.allSchoolsChange : [];
        const moduleSeries = Array.isArray(cache.moduleSeries) ? cache.moduleSeries : [];
        const normalizeSchoolName = typeof opts.normalizeSchoolName === 'function'
            ? opts.normalizeSchoolName
            : getNormalizeSchoolName();

        const schoolSheet = [['\u5b66\u6821', '\u671f\u6b21', '\u4eba\u6570', '\u603b\u5206\u5747\u5206', '\u4f18\u79c0\u7387', '\u53ca\u683c\u7387', '\u6821\u9645\u5747\u5206\u6392\u4f4d']];
        summaryByExam.forEach(function(item) {
            const summary = getSummaryEntryBySchool(item.summary, school, { normalizeSchoolName: normalizeSchoolName });
            if (!summary) return;
            schoolSheet.push([school, item.examId, summary.count, summary.avg, summary.excRate, summary.passRate, summary.rankAvg]);
        });

        const first = examIds[0] || '\u9996\u671f';
        const last = examIds[examIds.length - 1] || '\u672b\u671f';
        const allSchoolsSheet = [[
            '\u5b66\u6821',
            first + ' -> ' + last + ' \u5747\u5206\u53d8\u5316',
            first + ' -> ' + last + ' \u4f18\u79c0\u7387\u53d8\u5316',
            first + ' -> ' + last + ' \u53ca\u683c\u7387\u53d8\u5316',
            first + ' -> ' + last + ' \u6392\u4f4d\u53d8\u5316'
        ]];
        allSchoolsChange.forEach(function(item) {
            allSchoolsSheet.push([item.school, item.dAvg, item.dExc, item.dPass, item.dRank]);
        });

        const moduleSheet = [['\u671f\u6b21', '\u9884\u8b66\u7b49\u7ea7', '\u9ad8\u5206\u6bb5\u4eba\u6570', '\u9ad8\u5206\u6bb5\u5360\u6bd4', '\u6307\u6807\u751f\u4eba\u6570', '\u6307\u6807\u751f\u5360\u6bd4', '\u540e1/3\u5747\u5206', '\u4f4e\u5206\u7387']];
        moduleSeries.forEach(function(item) {
            moduleSheet.push([
                item.examId,
                item.riskLevel,
                item.highCount,
                item.highRate,
                item.indicatorCount,
                item.indicatorRate,
                item.bottom3Avg,
                item.lowRate
            ]);
        });

        return {
            schoolSheet: schoolSheet,
            allSchoolsSheet: allSchoolsSheet,
            moduleSheet: moduleSheet
        };
    }

    function normalizeStudentCompareName(name) {
        return String(name || '')
            .replace(/\s+/g, '')
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    }

    function resolveStudentCompareSubjects(options) {
        const opts = options || {};
        const examIds = Array.isArray(opts.examIds) ? opts.examIds : [];
        const currentExamId = String(opts.currentExamId || '').trim();
        const currentSubjects = Array.isArray(opts.currentSubjects) ? opts.currentSubjects : [];
        const exams = opts.exams || {};
        const subjects = [];

        examIds.forEach(function(examId) {
            if (!examId) return;
            if (examId === currentExamId) {
                currentSubjects.forEach(function(subject) {
                    if (subject) subjects.push(subject);
                });
                return;
            }
            const exam = exams && exams[examId];
            if (!exam || !Array.isArray(exam.subjects)) return;
            exam.subjects.forEach(function(subject) {
                if (subject) subjects.push(subject);
            });
        });

        return Array.from(new Set(subjects));
    }

    function buildStudentCompareRankMap(rows, scoreGetter) {
        const getter = typeof scoreGetter === 'function'
            ? scoreGetter
            : function(row) { return Number(row && row.total) || 0; };
        const sortedRows = (Array.isArray(rows) ? rows : []).slice().sort(function(a, b) {
            return getter(b) - getter(a);
        });
        const rankMap = {};
        sortedRows.forEach(function(row, index) {
            const key = normalizeStudentCompareName(row && row.name);
            if (key && rankMap[key] == null) rankMap[key] = index + 1;
        });
        return rankMap;
    }

    function calcStudentCompareProgressType(scoreDiff, rankSchoolDiff, rankTownDiff) {
        if (
            rankTownDiff > 0
            || (rankTownDiff === 0 && rankSchoolDiff > 0)
            || (rankTownDiff === 0 && rankSchoolDiff === 0 && scoreDiff > 1)
        ) {
            return 'improve';
        }
        if (
            rankTownDiff < 0
            || (rankTownDiff === 0 && rankSchoolDiff < 0)
            || (rankTownDiff === 0 && rankSchoolDiff === 0 && scoreDiff < -1)
        ) {
            return 'decline';
        }
        return 'stable';
    }

    function buildStudentMultiPeriodComparison(options) {
        const opts = options || {};
        const examDataList = Array.isArray(opts.examDataList) ? opts.examDataList : [];
        const allSubjects = Array.isArray(opts.allSubjects) ? opts.allSubjects.filter(Boolean) : [];
        const isClassEquivalent = typeof opts.isClassEquivalent === 'function'
            ? opts.isClassEquivalent
            : function(a, b) { return String(a || '').trim() === String(b || '').trim(); };

        const preparedExams = examDataList.map(function(item) {
            const allRows = Array.isArray(item && item.allRows) ? item.allRows : [];
            const schoolRows = Array.isArray(item && item.schoolRows) ? item.schoolRows : [];
            const schoolNameMap = {};
            schoolRows.forEach(function(row) {
                const key = normalizeStudentCompareName(row && row.name);
                if (key && !schoolNameMap[key]) schoolNameMap[key] = row;
            });

            const totalTownRanks = buildStudentCompareRankMap(allRows);
            const totalSchoolRanks = buildStudentCompareRankMap(schoolRows);
            const townSubjectRanks = new Map();
            const schoolSubjectRanks = new Map();
            const classCache = new Map();

            function getSubjectRankMap(cache, rows, subject) {
                const cacheKey = String(subject || '');
                if (!cache.has(cacheKey)) {
                    cache.set(cacheKey, buildStudentCompareRankMap(rows, function(row) {
                        const value = parseFloat(row && row.scores && row.scores[subject]);
                        return Number.isFinite(value) ? value : 0;
                    }));
                }
                return cache.get(cacheKey);
            }

            function getClassBundle(studentClass) {
                const classKey = String(studentClass || '');
                if (!classCache.has(classKey)) {
                    const classRows = schoolRows.filter(function(row) {
                        return isClassEquivalent((row && row.class) || '', classKey);
                    });
                    classCache.set(classKey, {
                        rows: classRows,
                        totalRanks: buildStudentCompareRankMap(classRows),
                        subjectRanks: new Map()
                    });
                }
                const bundle = classCache.get(classKey);
                bundle.getSubjectRanks = function(subject) {
                    return getSubjectRankMap(bundle.subjectRanks, bundle.rows, subject);
                };
                return bundle;
            }

            return {
                examId: item && item.examId,
                schoolNameMap: schoolNameMap,
                totalTownRanks: totalTownRanks,
                totalSchoolRanks: totalSchoolRanks,
                getTownSubjectRanks: function(subject) {
                    return getSubjectRankMap(townSubjectRanks, allRows, subject);
                },
                getSchoolSubjectRanks: function(subject) {
                    return getSubjectRankMap(schoolSubjectRanks, schoolRows, subject);
                },
                getClassBundle: getClassBundle
            };
        });

        const allStudentNames = new Set();
        preparedExams.forEach(function(item) {
            Object.keys(item.schoolNameMap).forEach(function(name) {
                if (name) allStudentNames.add(name);
            });
        });

        const studentsCompareData = [];
        allStudentNames.forEach(function(cleanedName) {
            const studentPeriods = [];
            let displayName = cleanedName;
            let studentClass = '';

            preparedExams.forEach(function(item) {
                const studentRow = item.schoolNameMap[cleanedName];
                if (!studentRow) {
                    studentPeriods.push({
                        examId: item.examId,
                        total: null,
                        rankClass: null,
                        rankTown: null,
                        rankSchool: null,
                        subjects: {}
                    });
                    return;
                }

                displayName = studentRow.name || displayName;
                studentClass = studentRow.class || studentClass;

                const classBundle = item.getClassBundle(studentClass);
                const subjectRanks = {};
                allSubjects.forEach(function(subject) {
                    const subScore = parseFloat(studentRow && studentRow.scores && studentRow.scores[subject]);
                    if (!Number.isFinite(subScore)) return;
                    const classSubjectRanks = classBundle.getSubjectRanks(subject);
                    const townSubjectRanksForSubject = item.getTownSubjectRanks(subject);
                    const schoolSubjectRanksForSubject = item.getSchoolSubjectRanks(subject);
                    subjectRanks[subject] = {
                        score: subScore,
                        rankClass: classSubjectRanks[cleanedName] || null,
                        rankTown: townSubjectRanksForSubject[cleanedName] || null,
                        rankSchool: schoolSubjectRanksForSubject[cleanedName] || null
                    };
                });

                studentPeriods.push({
                    examId: item.examId,
                    total: Number(studentRow && studentRow.total) || 0,
                    rankClass: classBundle.totalRanks[cleanedName] || null,
                    rankTown: item.totalTownRanks[cleanedName] || null,
                    rankSchool: item.totalSchoolRanks[cleanedName] || null,
                    subjects: subjectRanks
                });
            });

            const first = studentPeriods[0] || {};
            const last = studentPeriods[studentPeriods.length - 1] || {};
            const scoreDiff = first.total != null && last.total != null ? Number(last.total) - Number(first.total) : 0;
            const rankSchoolDiff = first.rankSchool != null && last.rankSchool != null ? Number(first.rankSchool) - Number(last.rankSchool) : 0;
            const rankTownDiff = first.rankTown != null && last.rankTown != null ? Number(first.rankTown) - Number(last.rankTown) : 0;

            studentsCompareData.push({
                name: displayName,
                cleanName: cleanedName,
                class: studentClass,
                periods: studentPeriods,
                scoreDiff: scoreDiff,
                rankSchoolDiff: rankSchoolDiff,
                rankTownDiff: rankTownDiff,
                latestTotal: last.total || 0,
                progressType: calcStudentCompareProgressType(scoreDiff, rankSchoolDiff, rankTownDiff)
            });
        });

        studentsCompareData.sort(function(a, b) {
            const classCompare = String(a && a.class || '').localeCompare(String(b && b.class || ''), 'zh-CN');
            if (classCompare !== 0) return classCompare;
            return String(a && a.name || '').localeCompare(String(b && b.name || ''), 'zh-CN');
        });

        return studentsCompareData;
    }

    function filterStudentCompareRowsByClasses(options) {
        const opts = options || {};
        const rows = Array.isArray(opts.rows) ? opts.rows : [];
        const normalizeClass = typeof opts.normalizeClass === 'function'
            ? opts.normalizeClass
            : function(value) { return String(value || '').trim(); };
        const allowedClasses = opts.allowedClasses instanceof Set
            ? opts.allowedClasses
            : new Set(Array.isArray(opts.allowedClasses) ? opts.allowedClasses : []);

        if (!allowedClasses.size) return rows.slice();
        return rows.filter(function(row) {
            return allowedClasses.has(normalizeClass(row && row.class));
        });
    }

    function buildBasicStudentCompareRows(selectedByExam, periodCount) {
        const schoolMaps = (selectedByExam || []).map(function(item) {
            const map = {};
            ((item && item.rows) || []).forEach(function(row) {
                map[normalizeStudentCompareName(row && row.name)] = row;
            });
            return map;
        });

        const studentRows = [];
        if (periodCount === 2) {
            const firstMap = schoolMaps[0] || {};
            const secondMap = schoolMaps[1] || {};
            Object.keys(secondMap).forEach(function(key) {
                if (!firstMap[key]) return;
                const first = firstMap[key];
                const second = secondMap[key];
                studentRows.push({
                    class: second.class,
                    name: second.name,
                    r1: first.rankSchool,
                    r2: second.rankSchool,
                    t1: first.total,
                    t2: second.total,
                    dRank12: first.rankSchool - second.rankSchool,
                    dScore12: second.total - first.total
                });
            });
            studentRows.sort(function(a, b) {
                return Math.abs(b.dRank12) - Math.abs(a.dRank12);
            });
            return studentRows;
        }

        const firstMap = schoolMaps[0] || {};
        const secondMap = schoolMaps[1] || {};
        const thirdMap = schoolMaps[2] || {};
        Object.keys(thirdMap).forEach(function(key) {
            if (!firstMap[key] || !secondMap[key]) return;
            const first = firstMap[key];
            const second = secondMap[key];
            const third = thirdMap[key];
            studentRows.push({
                class: third.class,
                name: third.name,
                r1: first.rankSchool,
                r2: second.rankSchool,
                r3: third.rankSchool,
                t1: first.total,
                t2: second.total,
                t3: third.total,
                dRank12: first.rankSchool - second.rankSchool,
                dRank23: second.rankSchool - third.rankSchool,
                dRank13: first.rankSchool - third.rankSchool,
                dScore13: third.total - first.total
            });
        });
        studentRows.sort(function(a, b) {
            return Math.abs(b.dRank13) - Math.abs(a.dRank13);
        });
        return studentRows;
    }

    function buildBasicMultiPeriodComparison(options) {
        const opts = options || {};
        const school = String(opts.school || '').trim();
        const rowsByExam = Array.isArray(opts.rowsByExam) ? opts.rowsByExam : [];
        const periodCount = Number(opts.periodCount) === 3 ? 3 : 2;
        const filterRowsBySchool = typeof opts.filterRowsBySchool === 'function'
            ? opts.filterRowsBySchool
            : getFilterRowsBySchool();
        const normalizeSchoolName = typeof opts.normalizeSchoolName === 'function'
            ? opts.normalizeSchoolName
            : getNormalizeSchoolName();
        const metricOptions = {
            subjects: Array.isArray(opts.subjects) ? opts.subjects : []
        };

        const hasMissingRows = rowsByExam.some(function(item) {
            return !item || !Array.isArray(item.rows) || !item.rows.length;
        });
        const summaryByExam = rowsByExam.map(function(item) {
            return {
                examId: item.examId,
                summary: buildSchoolSummaryForExam(item.rows, metricOptions)
            };
        });
        const selectedByExam = rowsByExam.map(function(item) {
            return {
                examId: item.examId,
                rows: filterRowsBySchool(item.rows, school)
            };
        });
        const hasMissingSelectedRows = selectedByExam.some(function(item) {
            return !item.rows.length;
        });

        const schoolSeries = hasMissingSelectedRows ? [] : selectedByExam.map(function(item, index) {
            const metrics = calcSchoolMetricsFromRows(item.rows, metricOptions);
            const schoolSummary = getSummaryEntryBySchool(summaryByExam[index] && summaryByExam[index].summary, school, {
                normalizeSchoolName: normalizeSchoolName
            });
            return {
                examId: item.examId,
                count: metrics.count,
                avg: metrics.avg,
                excRate: metrics.excRate,
                passRate: metrics.passRate,
                rankAvg: (schoolSummary && schoolSummary.rankAvg) || '-'
            };
        });

        const studentRows = hasMissingSelectedRows
            ? []
            : buildBasicStudentCompareRows(selectedByExam, periodCount);
        const avgChangeValue = studentRows.length
            ? studentRows.reduce(function(sum, item) {
                return sum + (periodCount === 2 ? item.dRank12 : item.dRank13);
            }, 0) / studentRows.length
            : 0;

        return {
            school: school,
            rowsByExam: rowsByExam,
            summaryByExam: summaryByExam,
            selectedByExam: selectedByExam,
            schoolSeries: schoolSeries,
            studentRows: studentRows,
            avgChangeValue: avgChangeValue,
            hasMissingRows: hasMissingRows,
            hasMissingSelectedRows: hasMissingSelectedRows
        };
    }

    function buildBasicMultiPeriodExportData(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const school = String(cache.school || '').trim();
        const examIds = Array.isArray(cache.examIds) ? cache.examIds : [];
        const periodCount = Number(cache.periodCount) === 3 ? 3 : 2;
        const summaryByExam = Array.isArray(cache.summaryByExam) ? cache.summaryByExam : [];
        const studentRows = Array.isArray(cache.studentRows) ? cache.studentRows : [];
        const normalizeSchoolName = typeof opts.normalizeSchoolName === 'function'
            ? opts.normalizeSchoolName
            : getNormalizeSchoolName();

        const summarySheet = [['\u5b66\u6821', '\u671f\u6b21', '\u4eba\u6570', '\u603b\u5206\u5747\u5206', '\u4f18\u79c0\u7387', '\u53ca\u683c\u7387', '\u6821\u9645\u5747\u5206\u6392\u4f4d']];
        summaryByExam.forEach(function(item) {
            const summary = getSummaryEntryBySchool(item.summary, school, { normalizeSchoolName: normalizeSchoolName });
            if (!summary) return;
            summarySheet.push([school, item.examId, summary.count, summary.avg, summary.excRate, summary.passRate, summary.rankAvg]);
        });

        let detailHeader = [];
        let detailRows = [];
        if (periodCount === 2) {
            detailHeader = ['\u73ed\u7ea7', '\u59d3\u540d', examIds[0] + '\u6821\u6392', examIds[1] + '\u6821\u6392', '\u540d\u6b21\u53d8\u5316', examIds[0] + '\u603b\u5206', examIds[1] + '\u603b\u5206', '\u5206\u6570\u53d8\u5316'];
            detailRows = studentRows.map(function(item) {
                return [item.class, item.name, item.r1, item.r2, item.dRank12, item.t1, item.t2, item.dScore12];
            });
        } else {
            detailHeader = ['\u73ed\u7ea7', '\u59d3\u540d', examIds[0] + '\u6821\u6392', examIds[1] + '\u6821\u6392', examIds[2] + '\u6821\u6392', '1\u21922', '2\u21923', '1\u21923', examIds[0] + '\u603b\u5206', examIds[2] + '\u603b\u5206', '\u603b\u52061\u21923'];
            detailRows = studentRows.map(function(item) {
                return [item.class, item.name, item.r1, item.r2, item.r3, item.dRank12, item.dRank23, item.dRank13, item.t1, item.t3, item.dScore13];
            });
        }

        return {
            summarySheet: summarySheet,
            detailSheet: [detailHeader].concat(detailRows)
        };
    }



    function buildTeacherStatsForExam(options) {
        const opts = options || {};
        const rows = Array.isArray(opts.rows) ? opts.rows : [];
        const school = String(opts.school || '').trim();
        const subjectFilter = String(opts.subjectFilter || '').trim();
        const teacherMap = opts.teacherMap || {};
        const subjects = Array.isArray(opts.subjects) ? opts.subjects : [];
        const normalizeClass = typeof opts.normalizeClass === 'function' ? opts.normalizeClass : function(value) { return String(value || '').trim(); };
        const normalizeSubject = typeof opts.normalizeSubject === 'function' ? opts.normalizeSubject : function(value) { return String(value || '').trim(); };
        const configName = String(opts.configName || '');

        const rowsSchool = rows.filter(function(row) {
            return String(row && row.school || '').trim() === school;
        });
        const classSet = new Set(rowsSchool.map(function(row) {
            return normalizeClass(row && row.class);
        }));
        const excRatio = configName.includes('9') ? 0.15 : 0.2;

        const gradeStats = {};
        subjects.forEach(function(subject) {
            const vals = rowsSchool
                .map(function(row) { return parseFloat(row && row.scores && row.scores[subject]); })
                .filter(function(value) { return !isNaN(value); })
                .sort(function(a, b) { return b - a; });
            if (!vals.length) return;
            const avg = vals.reduce(function(sum, value) { return sum + value; }, 0) / vals.length;
            const exc = vals[Math.floor(vals.length * excRatio)] || 0;
            const pass = vals[Math.floor(vals.length * 0.5)] || 0;
            gradeStats[subject] = { avg: avg, exc: exc, pass: pass, low: pass * 0.6 };
        });

        const bucket = {};
        Object.entries(teacherMap).forEach(function(entry) {
            const key = entry[0];
            const teacherName = entry[1];
            const parts = String(key).split('_');
            const cls = normalizeClass(parts[0]);
            const subject = subjects.find(function(item) {
                return normalizeSubject(item) === normalizeSubject(parts[1]);
            });
            if (!cls || !subject || !classSet.has(cls)) return;
            if (subjectFilter && subject !== subjectFilter) return;
            const teacher = String(teacherName || '').trim();
            if (!teacher) return;

            const students = rowsSchool.filter(function(row) {
                return normalizeClass(row && row.class) === cls && !isNaN(parseFloat(row && row.scores && row.scores[subject]));
            });
            if (!students.length) return;

            const keyName = teacher + '__' + subject;
            if (!bucket[keyName]) bucket[keyName] = { teacher: teacher, subject: subject, classes: new Set(), students: [] };
            bucket[keyName].classes.add(cls);
            bucket[keyName].students.push.apply(bucket[keyName].students, students);
        });

        const list = Object.values(bucket).map(function(item) {
            const gs = gradeStats[item.subject] || { avg: 0, exc: 0, pass: 0, low: 36 };
            const vals = item.students
                .map(function(student) { return parseFloat(student && student.scores && student.scores[item.subject]); })
                .filter(function(value) { return !isNaN(value); });
            const count = vals.length;
            const avg = count ? vals.reduce(function(sum, value) { return sum + value; }, 0) / count : 0;
            const excellentRate = count ? vals.filter(function(value) { return value >= gs.exc; }).length / count : 0;
            const passRate = count ? vals.filter(function(value) { return value >= gs.pass; }).length / count : 0;
            const lowRate = count ? vals.filter(function(value) { return value < gs.low; }).length / count : 0;
            const contribution = avg - gs.avg;
            const finalScore = 30 + contribution + excellentRate * 30 + passRate * 30 - lowRate * 20;

            return {
                teacher: item.teacher,
                subject: item.subject,
                classes: Array.from(item.classes).sort().join(','),
                studentCount: count,
                avg: avg,
                excellentRate: excellentRate,
                passRate: passRate,
                lowRate: lowRate,
                contribution: contribution,
                finalScore: finalScore,
                subjectRank: 0,
                townshipRankAvg: null,
                townshipRankExc: null,
                townshipRankPass: null
            };
        });

        const bySubject = {};
        list.forEach(function(item) {
            if (!bySubject[item.subject]) bySubject[item.subject] = [];
            bySubject[item.subject].push(item);
        });
        Object.values(bySubject).forEach(function(items) {
            items.sort(function(a, b) { return b.finalScore - a.finalScore; });
            items.forEach(function(item, index) {
                if (index > 0 && Math.abs(item.finalScore - items[index - 1].finalScore) < 0.0001) {
                    item.subjectRank = items[index - 1].subjectRank;
                } else {
                    item.subjectRank = index + 1;
                }
            });
        });

        return list;
    }

    function attachTeacherTownshipAvgRank(options) {
        const opts = options || {};
        const rows = Array.isArray(opts.rows) ? opts.rows : [];
        const school = String(opts.school || '').trim();
        const teacherStatsList = Array.isArray(opts.teacherStatsList) ? opts.teacherStatsList : [];

        const subjectSet = Array.from(new Set(teacherStatsList.map(function(item) {
            return item.subject;
        }).filter(Boolean)));

        subjectSet.forEach(function(subject) {
            const ranking = [];
            teacherStatsList.filter(function(item) {
                return item.subject === subject;
            }).forEach(function(item) {
                ranking.push({ type: 'teacher', teacher: item.teacher, avg: item.avg, excellentRate: item.excellentRate, passRate: item.passRate });
            });

            const schoolScores = {};
            rows.forEach(function(row) {
                if (String(row && row.school || '').trim() === school) return;
                const score = parseFloat(row && row.scores && row.scores[subject]);
                if (isNaN(score)) return;
                const schoolName = String(row && row.school || '').trim();
                if (!schoolName) return;
                if (!schoolScores[schoolName]) schoolScores[schoolName] = [];
                schoolScores[schoolName].push(score);
            });

            Object.entries(schoolScores).forEach(function(entry) {
                const schoolName = entry[0];
                const vals = entry[1];
                if (!vals.length) return;
                const avg = vals.reduce(function(sum, value) { return sum + value; }, 0) / vals.length;
                const excCount = vals.filter(function(value) { return value >= 85; }).length;
                const passCount = vals.filter(function(value) { return value >= 60; }).length;
                ranking.push({
                    type: 'school',
                    school: schoolName,
                    avg: avg,
                    excellentRate: vals.length ? excCount / vals.length : 0,
                    passRate: vals.length ? passCount / vals.length : 0
                });
            });

            ranking.sort(function(a, b) { return b.avg - a.avg; });
            ranking.forEach(function(item, index) { item.rankAvg = index + 1; });
            ranking.sort(function(a, b) { return b.excellentRate - a.excellentRate; });
            ranking.forEach(function(item, index) { item.rankExc = index + 1; });
            ranking.sort(function(a, b) { return b.passRate - a.passRate; });
            ranking.forEach(function(item, index) { item.rankPass = index + 1; });

            teacherStatsList.filter(function(item) {
                return item.subject === subject;
            }).forEach(function(item) {
                const mine = ranking.find(function(rankItem) {
                    return rankItem.type === 'teacher' && rankItem.teacher === item.teacher;
                });
                item.townshipRankAvg = mine ? mine.rankAvg : null;
                item.townshipRankExc = mine ? mine.rankExc : null;
                item.townshipRankPass = mine ? mine.rankPass : null;
            });
        });

        return teacherStatsList;
    }
    function buildTeacherMultiPeriodComparison(options) {
        const opts = options || {};
        const school = String(opts.school || '').trim();
        const subject = String(opts.subject || '').trim();
        const teacher = String(opts.teacher || '').trim();
        const examIds = Array.isArray(opts.examIds) ? opts.examIds : [];
        const getExamRows = typeof opts.getExamRows === 'function' ? opts.getExamRows : function() { return []; };
        const buildTeacherStats = typeof opts.buildTeacherStats === 'function' ? opts.buildTeacherStats : function() { return []; };
        const attachTeacherRanks = typeof opts.attachTeacherRanks === 'function' ? opts.attachTeacherRanks : function() {};

        const examStats = examIds.map(function(examId) {
            const rows = getExamRows(examId) || [];
            const list = buildTeacherStats(rows, school, subject) || [];
            attachTeacherRanks(rows, school, list);
            const current = list.find(function(item) {
                return item.teacher === teacher && item.subject === subject;
            }) || null;
            return { examId: examId, list: list, current: current };
        });

        const hasMissingCurrent = examStats.some(function(item) {
            return !item.current;
        });
        const metricRowsHtml = hasMissingCurrent ? '' : examStats.map(function(item) {
            const current = item.current;
            return '<tr><td>' + item.examId + '</td><td>' + (current.townshipRankAvg || '-') + '</td><td>' + (current.townshipRankExc || '-') + '</td><td>' + (current.townshipRankPass || '-') + '</td></tr>';
        }).join('');

        const first = examStats.length ? examStats[0].current : null;
        const last = examStats.length ? examStats[examStats.length - 1].current : null;
        const delta = {
            townshipAvg: (first && last && first.townshipRankAvg && last.townshipRankAvg) ? (first.townshipRankAvg - last.townshipRankAvg) : null,
            townshipExc: (first && last && first.townshipRankExc && last.townshipRankExc) ? (first.townshipRankExc - last.townshipRankExc) : null,
            townshipPass: (first && last && first.townshipRankPass && last.townshipRankPass) ? (first.townshipRankPass - last.townshipRankPass) : null
        };

        return {
            school: school,
            subject: subject,
            teacher: teacher,
            examIds: examIds,
            examStats: examStats,
            delta: delta,
            metricRowsHtml: metricRowsHtml,
            hasMissingCurrent: hasMissingCurrent
        };
    }

    function buildTeacherMultiPeriodExportData(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const school = String(cache.school || '').trim();
        const subject = String(cache.subject || '').trim();
        const teacher = String(cache.teacher || '').trim();
        const examIds = Array.isArray(cache.examIds) ? cache.examIds : [];
        const examStats = Array.isArray(cache.examStats) ? cache.examStats : [];
        const delta = cache.delta || {};

        const detailSheet = [['\u5b66\u6821', '\u6559\u5e08', '\u5b66\u79d1', '\u671f\u6b21', '\u4e61\u9547\u5747\u5206\u6392\u4f4d', '\u4f18\u79c0\u7387\u6392\u4f4d', '\u53ca\u683c\u7387\u6392\u4f4d']];
        examStats.forEach(function(item) {
            const current = item.current || {};
            detailSheet.push([
                school,
                teacher,
                subject,
                item.examId,
                current.townshipRankAvg || '',
                current.townshipRankExc || '',
                current.townshipRankPass || ''
            ]);
        });

        const first = examIds[0] || '\u9996\u671f';
        const last = examIds[examIds.length - 1] || '\u672b\u671f';
        const deltaSheet = [[
            '\u5b66\u6821', '\u6559\u5e08', '\u5b66\u79d1', '\u53d8\u5316\u533a\u95f4',
            '\u4e61\u9547\u5747\u5206\u6392\u4f4d\u53d8\u5316', '\u4f18\u79c0\u7387\u6392\u4f4d\u53d8\u5316', '\u53ca\u683c\u7387\u6392\u4f4d\u53d8\u5316'
        ], [
            school,
            teacher,
            subject,
            first + '\u2192' + last,
            delta.townshipAvg === null ? '' : delta.townshipAvg,
            delta.townshipExc === null ? '' : delta.townshipExc,
            delta.townshipPass === null ? '' : delta.townshipPass
        ]];

        return {
            detailSheet: detailSheet,
            deltaSheet: deltaSheet
        };
    }

    function buildAllTeachersMultiPeriodComparison(options) {
        const opts = options || {};
        const school = String(opts.school || '').trim();
        const examIds = Array.isArray(opts.examIds) ? opts.examIds : [];
        const periodCount = Number(opts.periodCount) === 3 ? 3 : 2;
        const subjects = Array.isArray(opts.subjects) ? opts.subjects.filter(Boolean) : [];
        const getExamRows = typeof opts.getExamRows === 'function' ? opts.getExamRows : function() { return []; };
        const buildTeacherStats = typeof opts.buildTeacherStats === 'function' ? opts.buildTeacherStats : function() { return []; };
        const attachTeacherRanks = typeof opts.attachTeacherRanks === 'function' ? opts.attachTeacherRanks : function() {};
        const sortSubjects = typeof opts.sortSubjects === 'function' ? opts.sortSubjects : null;

        const teacherSubjectMap = {};
        examIds.forEach(function(examId) {
            const rows = getExamRows(examId) || [];
            subjects.forEach(function(subject) {
                const stats = buildTeacherStats(rows, school, subject) || [];
                stats.forEach(function(item) {
                    const teacher = String(item && item.teacher || '').trim();
                    if (!teacher) return;
                    if (!teacherSubjectMap[teacher]) teacherSubjectMap[teacher] = new Set();
                    teacherSubjectMap[teacher].add(subject);
                });
            });
        });

        const results = [];
        Object.keys(teacherSubjectMap).forEach(function(teacher) {
            teacherSubjectMap[teacher].forEach(function(subject) {
                const details = examIds.map(function(examId) {
                    const rows = getExamRows(examId) || [];
                    const list = buildTeacherStats(rows, school, subject) || [];
                    attachTeacherRanks(rows, school, list);
                    const current = list.find(function(item) {
                        return item.teacher === teacher && item.subject === subject;
                    }) || null;
                    return { examId: examId, current: current };
                });

                const validPoints = details.filter(function(item) { return !!item.current; }).length;
                if (!validPoints) return;

                const first = details[0] && details[0].current;
                const last = details[details.length - 1] && details[details.length - 1].current;
                const delta = (first && last)
                    ? {
                        townshipAvg: (first.townshipRankAvg && last.townshipRankAvg) ? (first.townshipRankAvg - last.townshipRankAvg) : null,
                        townshipExc: (first.townshipRankExc && last.townshipRankExc) ? (first.townshipRankExc - last.townshipRankExc) : null,
                        townshipPass: (first.townshipRankPass && last.townshipRankPass) ? (first.townshipRankPass - last.townshipRankPass) : null
                    }
                    : null;

                results.push({
                    teacher: teacher,
                    subject: subject,
                    details: details,
                    delta: delta
                });
            });
        });

        results.sort(function(a, b) {
            if (a.subject !== b.subject) {
                if (sortSubjects) return sortSubjects(a.subject, b.subject);
                return a.subject.localeCompare(b.subject, 'zh');
            }
            return a.teacher.localeCompare(b.teacher, 'zh');
        });

        return {
            school: school,
            examIds: examIds,
            periodCount: periodCount,
            results: results,
            teacherCount: Object.keys(teacherSubjectMap).length
        };
    }

    function buildAllTeachersMultiPeriodExportData(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const examIds = Array.isArray(cache.examIds) ? cache.examIds : [];
        const results = Array.isArray(cache.results) ? cache.results : [];
        const school = String(cache.school || '').trim();

        const header = ['\u6559\u5e08', '\u5b66\u79d1'];
        examIds.forEach(function(examId) {
            header.push(
                examId + '\n\u4e61\u9547\u5747\u5206\u6392\u4f4d',
                examId + '\n\u4f18\u79c0\u7387\u6392\u4f4d',
                examId + '\n\u53ca\u683c\u7387\u6392\u4f4d'
            );
        });
        header.push(
            '\u4e61\u9547\u5747\u5206\u6392\u4f4d\u53d8\u5316',
            '\u4f18\u79c0\u7387\u6392\u4f4d\u53d8\u5316',
            '\u53ca\u683c\u7387\u6392\u4f4d\u53d8\u5316'
        );

        const rows = results.map(function(item) {
            const row = [item.teacher, item.subject];
            (item.details || []).forEach(function(detail) {
                const current = detail.current;
                if (current) {
                    row.push(
                        (typeof current.townshipRankAvg === 'number' ? current.townshipRankAvg : '-'),
                        (typeof current.townshipRankExc === 'number' ? current.townshipRankExc : '-'),
                        (typeof current.townshipRankPass === 'number' ? current.townshipRankPass : '-')
                    );
                } else {
                    row.push('-', '-', '-');
                }
            });
            if (item.delta) {
                row.push(
                    (typeof item.delta.townshipRankAvg === 'number' ? item.delta.townshipRankAvg : (typeof item.delta.townshipAvg === 'number' ? item.delta.townshipAvg : '-')),
                    (typeof item.delta.townshipExc === 'number' ? item.delta.townshipExc : '-'),
                    (typeof item.delta.townshipPass === 'number' ? item.delta.townshipPass : '-')
                );
            } else {
                row.push('-', '-', '-');
            }
            return row;
        });

        return {
            sheetName: '\u6559\u5e08\u6279\u91cf\u591a\u671f\u5bf9\u6bd4',
            sheetData: [header].concat(rows),
            fileName: school
        };
    }
    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sanitizeCloudSegment(value) {
        return String(value || '').replace(/[^\w\u4e00-\u9fa5]/g, '');
    }

    function formatZhDateTime(value) {
        if (!value) return '';
        const date = new Date(value);
        return isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN');
    }

    function buildTeacherCompareCloudPayload(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const user = opts.user || {};
        const cohortId = String(opts.cohortId || 'unknown').trim() || 'unknown';
        const timestamp = String(opts.timestamp || '').trim() || new Date().toISOString().slice(0, 10);
        const rand = String(opts.rand || '').trim() || Date.now().toString().slice(-4);
        const isBatch = !!cache.isBatchMode;
        const safeSchool = sanitizeCloudSegment(cache.school);
        const safeTeacher = sanitizeCloudSegment(cache.teacher);
        const safeSubject = sanitizeCloudSegment(cache.subject) || 'subject';

        let key = '';
        let title = '';
        if (isBatch) {
            key = 'TEACHER_COMPARE_BATCH_' + cohortId + '_' + (safeSchool || 'school') + '_' + timestamp + '_' + rand;
            title = String(cache.school || '') + ' 教师多期对比（批量）';
        } else {
            key = 'TEACHER_COMPARE_' + cohortId + '_' + (safeTeacher || 'teacher') + '_' + safeSubject + '_' + timestamp + '_' + rand;
            title = [cache.school, cache.teacher, cache.subject].filter(Boolean).join(' ') + '教师多期对比';
        }

        return {
            key: key,
            title: title,
            payload: {
                school: cache.school,
                subject: cache.subject,
                teacher: cache.teacher,
                examIds: cache.examIds,
                periodCount: cache.periodCount,
                examStats: cache.examStats || null,
                delta: cache.delta,
                metricRows: cache.metricRows,
                isBatchMode: isBatch,
                batchResults: cache.batchResults || null,
                thsHtml: cache.thsHtml || null,
                title: title,
                createdBy: user.username || user.name || user.email,
                createdAt: new Date().toISOString()
            }
        };
    }

    function parseTeacherCompareCloudKey(key) {
        const rawKey = String(key || '').trim();
        const batchPrefix = 'TEACHER_COMPARE_BATCH_';
        const singlePrefix = 'TEACHER_COMPARE_';
        let isBatch = false;
        let body = '';
        if (rawKey.indexOf(batchPrefix) === 0) {
            isBatch = true;
            body = rawKey.substring(batchPrefix.length);
        } else if (rawKey.indexOf(singlePrefix) === 0) {
            body = rawKey.substring(singlePrefix.length);
        } else {
            body = rawKey;
        }

        const parts = body.split('_').filter(function(part) { return part !== ''; });
        const cohortId = parts[0] || '';
        const dateTag = parts.length >= 2 ? parts[parts.length - 2] : '';
        const bodyParts = parts.slice(1, Math.max(1, parts.length - 2));
        let name = '';
        let subject = '';
        if (isBatch) {
            name = bodyParts.join('_');
        } else {
            name = bodyParts[0] || '';
            subject = bodyParts.slice(1).join('_');
        }

        return {
            key: rawKey,
            isBatch: isBatch,
            cohortId: cohortId,
            name: name,
            subject: subject,
            dateTag: dateTag
        };
    }

    function buildTeacherCompareListItems(options) {
        const opts = options || {};
        const records = Array.isArray(opts.records) ? opts.records : [];
        return records.map(function(record) {
            const parsed = parseTeacherCompareCloudKey(record && record.key);
            return {
                key: String(record && record.key || ''),
                displayDate: formatZhDateTime(record && record.updated_at),
                cohortLabel: parsed.cohortId || '\u672a\u77e5\u5c4a\u522b',
                typeLabel: parsed.isBatch ? '\u6279\u91cf' : '\u5355\u6559\u5e08',
                nameLabel: parsed.name || (parsed.isBatch ? '\u6559\u5e08\u6279\u91cf\u5bf9\u6bd4' : '\u672a\u547d\u540d\u6559\u5e08'),
                subjectLabel: parsed.isBatch ? '\u6279\u91cf\u5206\u6790' : (parsed.subject || '\u672a\u77e5\u5b66\u79d1')
            };
        });
    }

    function buildTeacherCompareListHtml(options) {
        const items = buildTeacherCompareListItems(options);
        return items.map(function(item) {
            return '<div style="padding:12px; border-bottom:1px solid #e2e8f0; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" data-key="' + escapeHtml(item.key) + '" onclick="loadCloudTeacherCompare(this.getAttribute(&quot;data-key&quot;))">'
                + '<div style="flex:1;">'
                + '<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">'
                + '<span style="background:#faf5ff; color:#7c3aed; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">' + escapeHtml(item.cohortLabel) + '</span>'
                + '<span style="background:#fff7ed; color:#ea580c; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">' + escapeHtml(item.typeLabel) + '</span>'
                + '<span style="font-weight:600; color:#334155;">' + escapeHtml(item.nameLabel) + ' (' + escapeHtml(item.subjectLabel) + ')</span>'
                + '</div>'
                + '<div style="font-size:11px; color:#94a3b8; font-family:monospace;">' + escapeHtml(item.key) + '</div>'
                + '</div>'
                + '<div style="text-align:right;">'
                + '<div style="font-size:12px; color:#64748b;">' + escapeHtml(item.displayDate || '-') + '</div>'
                + '<div style="font-size:11px; color:#3b82f6; margin-top:2px;">\u70b9\u51fb\u67e5\u770b &gt;</div>'
                + '</div>'
                + '</div>';
        }).join('');
    }

    function buildTeacherCompareDetailView(options) {
        const opts = options || {};
        const payload = opts.payload || {};
        const school = String(payload.school || '').trim();
        const subject = String(payload.subject || '').trim();
        const teacher = String(payload.teacher || '').trim();
        const examIds = Array.isArray(payload.examIds) ? payload.examIds : [];
        const periodCount = Number(payload.periodCount) === 3 ? 3 : 2;
        const delta = payload.delta || {};
        const metricRows = String(payload.metricRows || '');
        const title = String(payload.title || '').trim() || (payload.isBatchMode
            ? (school + ' \u6559\u5e08\u591a\u671f\u5bf9\u6bd4\uff08\u6279\u91cf\uff09')
            : [school, teacher, subject].filter(Boolean).join(' ') + '\u6559\u5e08\u591a\u671f\u5bf9\u6bd4');
        const createdAtLabel = formatZhDateTime(payload.createdAt) || '-';
        const createdByLabel = escapeHtml(payload.createdBy || '\u672a\u77e5');
        const titleHtml = escapeHtml(title);
        const firstExam = escapeHtml(examIds[0] || '\u9996\u671f');
        const lastExam = escapeHtml(examIds[examIds.length - 1] || '\u672b\u671f');

        const restoredTeacherCompareCache = {
            school: school,
            subject: subject,
            teacher: teacher,
            examIds: examIds,
            periodCount: periodCount,
            examStats: Array.isArray(payload.examStats) ? payload.examStats : [],
            delta: delta,
            metricRows: metricRows,
            isBatchMode: !!payload.isBatchMode,
            batchResults: payload.batchResults || null,
            thsHtml: payload.thsHtml || null
        };

        if (payload.isBatchMode) {
            const resultHtml = ''
                + '<div class="sub-header" style="color:#7c3aed;">\u4e91\u7aef\u6559\u5e08\u591a\u671f\u5bf9\u6bd4\uff1a' + titleHtml + '</div>'
                + '<div class="table-wrap" style="max-height:600px; overflow-y:auto;">'
                + '<table class="common-table" style="font-size:13px;">'
                + '<thead style="position:sticky; top:0; z-index:10;"><tr>' + String(payload.thsHtml || '') + '</tr></thead>'
                + '<tbody>' + metricRows + '</tbody>'
                + '</table>'
                + '</div>'
                + '<div style="margin-top:10px; display:flex; gap:10px;">'
                + '<button class="btn btn-sm" data-school="' + escapeHtml(school) + '" data-exams="' + escapeHtml(examIds.join('_')) + '" onclick="exportAllTeachersMultiPeriodDiff(this.getAttribute(&quot;data-school&quot;), this.getAttribute(&quot;data-exams&quot;))">\u5bfc\u51fa\u6279\u91cf\u5bf9\u6bd4 Excel</button>'
                + '</div>'
                + '<div style="margin-top:10px; font-size:12px; color:#94a3b8; text-align:right;">'
                + '\u4fdd\u5b58\u65f6\u95f4\uff1a' + escapeHtml(createdAtLabel) + ' | '
                + '\u4fdd\u5b58\u4eba\uff1a' + createdByLabel
                + '</div>';

            return {
                resultHtml: resultHtml,
                hintHtml: '\u5df2\u4ece\u4e91\u7aef\u8f7d\u5165\u6559\u5e08\u6279\u91cf\u591a\u671f\u5bf9\u6bd4\uff1a' + titleHtml,
                hintColor: '#7c3aed',
                restoredTeacherCompareCache: restoredTeacherCompareCache,
                restoredAllTeachersCache: payload.batchResults ? {
                    results: payload.batchResults,
                    school: school,
                    examIds: examIds,
                    periodCount: periodCount
                } : null
            };
        }

        const deltaAvg = (typeof delta.townshipAvg === 'number') ? delta.townshipAvg : ((typeof delta.township === 'number') ? delta.township : null);
        const deltaExc = (typeof delta.townshipExc === 'number') ? delta.townshipExc : null;
        const deltaPass = (typeof delta.townshipPass === 'number') ? delta.townshipPass : null;
        const formatSigned = function(value) {
            if (typeof value !== 'number') return '-';
            return (value >= 0 ? '+' : '') + value;
        };

        return {
            resultHtml: ''
                + '<div class="sub-header" style="color:#7c3aed;">\u4e91\u7aef\u6559\u5e08\u591a\u671f\u5bf9\u6bd4\uff1a' + titleHtml + '</div>'
                + '<div class="table-wrap"><table class="mobile-card-table"><thead><tr>'
                + '<th>\u671f\u6b21</th><th>\u4e61\u9547\u5747\u5206\u6392\u540d</th><th>\u4f18\u79c0\u7387\u6392\u540d</th><th>\u53ca\u683c\u7387\u6392\u540d</th>'
                + '</tr></thead><tbody>' + metricRows + '</tbody></table></div>'
                + '<div style="margin-top:8px; font-size:12px; color:#475569;">'
                + '\u5bf9\u6bd4\u533a\u95f4\uff1a' + firstExam + ' -> ' + lastExam + '\uff1b'
                + '\u4e61\u9547\u5747\u5206\u6392\u540d\u53d8\u5316\uff1a' + escapeHtml(formatSigned(deltaAvg)) + '\uff1b'
                + '\u4f18\u79c0\u7387\u6392\u540d\u53d8\u5316\uff1a' + escapeHtml(formatSigned(deltaExc)) + '\uff1b'
                + '\u53ca\u683c\u7387\u6392\u540d\u53d8\u5316\uff1a' + escapeHtml(formatSigned(deltaPass))
                + '</div>'
                + '<div style="margin-top:10px; font-size:12px; color:#94a3b8; text-align:right;">'
                + '\u4fdd\u5b58\u65f6\u95f4\uff1a' + escapeHtml(createdAtLabel) + ' | '
                + '\u4fdd\u5b58\u4eba\uff1a' + createdByLabel
                + '</div>',
            hintHtml: '\u5df2\u4ece\u4e91\u7aef\u8f7d\u5165\u6559\u5e08\u591a\u671f\u5bf9\u6bd4\uff1a' + titleHtml,
            hintColor: '#7c3aed',
            restoredTeacherCompareCache: restoredTeacherCompareCache,
            restoredAllTeachersCache: null
        };
    }

    function sanitizeSheetName(name, fallback) {
        const base = String(name || fallback || '\u5de5\u4f5c\u8868')
            .replace(/[\\/:*?[]]/g, '_')
            .trim();
        return (base || fallback || '\u5de5\u4f5c\u8868').slice(0, 31);
    }

    function formatStudentCompareNumber(value, digits) {
        if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
        if (typeof digits === 'number') return value.toFixed(digits);
        return String(value);
    }

    function formatStudentCompareSigned(value, digits) {
        if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
        const num = typeof digits === 'number' ? value.toFixed(digits) : String(value);
        return (value >= 0 ? '+' : '') + num;
    }

    function buildStudentCompareTotalSheet(cache, visibleStudents, totalLabel) {
        const examIds = Array.isArray(cache && cache.examIds) ? cache.examIds : [];
        const header = ['\u5b66\u751f', '\u73ed\u7ea7'];
        examIds.forEach(function(examId) {
            header.push(examId + '-' + totalLabel, examId + '-\u6821\u6392\u540d', examId + '-\u9547\u6392\u540d');
        });
        const rows = [header];
        (visibleStudents || []).forEach(function(student) {
            const row = [student && student.name || '', student && student.class || ''];
            (student && student.periods || []).forEach(function(period) {
                row.push(
                    period && typeof period.total === 'number' ? period.total.toFixed(1) : '-',
                    period && period.rankSchool != null ? period.rankSchool : '-',
                    period && period.rankTown != null ? period.rankTown : '-'
                );
            });
            rows.push(row);
        });
        return {
            name: sanitizeSheetName('\u603b\u5206\u5bf9\u6bd4', 'Sheet1'),
            data: rows
        };
    }

    function buildStudentCompareSubjectSheets(cache, visibleStudents) {
        const examIds = Array.isArray(cache && cache.examIds) ? cache.examIds : [];
        const subjects = Array.isArray(cache && cache.subjects) ? cache.subjects : [];
        return subjects.map(function(subject) {
            const header = ['\u5b66\u751f', '\u73ed\u7ea7'];
            examIds.forEach(function(examId) {
                header.push(examId + '-\u5206\u6570', examId + '-\u6821\u6392\u540d', examId + '-\u9547\u6392\u540d');
            });
            const rows = [header];
            (visibleStudents || []).forEach(function(student) {
                const row = [student && student.name || '', student && student.class || ''];
                (student && student.periods || []).forEach(function(period) {
                    const subjectData = period && period.subjects ? period.subjects[subject] : null;
                    row.push(
                        subjectData && subjectData.score != null ? subjectData.score : '-',
                        subjectData && subjectData.rankSchool != null ? subjectData.rankSchool : '-',
                        subjectData && subjectData.rankTown != null ? subjectData.rankTown : '-'
                    );
                });
                rows.push(row);
            });
            return {
                name: sanitizeSheetName(subject, '\u5b66\u79d1'),
                data: rows
            };
        });
    }

    function buildStudentCompareDetailSheet(cache, visibleStudents, totalLabel) {
        const periodCount = Number(cache && cache.periodCount) === 3 ? 3 : 2;
        if (periodCount <= 1) return null;
        const examIds = Array.isArray(cache && cache.examIds) ? cache.examIds : [];
        const header = ['\u5b66\u751f', '\u73ed\u7ea7', '\u6307\u6807'];
        examIds.forEach(function(examId, idx) {
            header.push(examId);
            if (idx > 0) header.push('\u53d8\u5316');
        });
        const rows = [header];
        (visibleStudents || []).forEach(function(student) {
            const periods = Array.isArray(student && student.periods) ? student.periods : [];
            const totalRow = [student && student.name || '', student && student.class || '', totalLabel];
            const schoolRankRow = [student && student.name || '', student && student.class || '', '\u6821\u6392\u540d'];
            const townRankRow = [student && student.name || '', student && student.class || '', '\u9547\u6392\u540d'];
            periods.forEach(function(period, idx) {
                totalRow.push(period && typeof period.total === 'number' ? period.total.toFixed(1) : '-');
                schoolRankRow.push(period && period.rankSchool != null ? period.rankSchool : '-');
                townRankRow.push(period && period.rankTown != null ? period.rankTown : '-');
                if (idx > 0) {
                    const prev = periods[idx - 1] || {};
                    const totalDiff = typeof period.total === 'number' && typeof prev.total === 'number' ? period.total - prev.total : null;
                    const schoolDiff = period.rankSchool != null && prev.rankSchool != null ? prev.rankSchool - period.rankSchool : null;
                    const townDiff = period.rankTown != null && prev.rankTown != null ? prev.rankTown - period.rankTown : null;
                    totalRow.push(formatStudentCompareSigned(totalDiff, 1));
                    schoolRankRow.push(formatStudentCompareSigned(schoolDiff));
                    townRankRow.push(formatStudentCompareSigned(townDiff));
                }
            });
            rows.push(totalRow, schoolRankRow, townRankRow, []);
        });
        return {
            name: sanitizeSheetName('\u8be6\u7ec6\u53d8\u5316', '\u8be6\u7ec6'),
            data: rows
        };
    }

    function buildStudentCompareProgressSheet(visibleStudents) {
        const list = Array.isArray(visibleStudents) ? visibleStudents : [];
        if (!list.length) {
            return {
                name: sanitizeSheetName('\u8fdb\u9000\6b65\u5206\u6790', '\u8fdb\u9000\6b65'),
                data: [['\u6682\u65e0\u53ef\u5bfc\u51fa\u7684\u5b66\u751f\u6570\u636e']]
            };
        }
        const improveList = list.filter(function(item) { return Number(item && item.scoreDiff || 0) > 0; }).sort(function(a, b) { return Number(b.scoreDiff || 0) - Number(a.scoreDiff || 0); }).slice(0, 20);
        const declineList = list.filter(function(item) { return Number(item && item.scoreDiff || 0) < 0; }).sort(function(a, b) { return Number(a.scoreDiff || 0) - Number(b.scoreDiff || 0); }).slice(0, 20);
        const header = ['\u6392\u540d', '\u5b66\u751f', '\u73ed\u7ea7', '\u9996\u671f\u603b\u5206', '\u672b\u671f\u603b\u5206', '\u603b\u5206\u53d8\u5316', '\u6821\u6392\u53d8\u5316', '\u9547\u6392\u53d8\u5316'];
        const rows = [['Top20 \u8fdb\u6b65\u5b66\u751f'], header];
        improveList.forEach(function(student, index) {
            const periods = Array.isArray(student && student.periods) ? student.periods : [];
            const first = periods[0] || {};
            const last = periods[periods.length - 1] || {};
            rows.push([
                index + 1,
                student && student.name || '',
                student && student.class || '',
                typeof first.total === 'number' ? first.total.toFixed(1) : '-',
                typeof last.total === 'number' ? last.total.toFixed(1) : '-',
                formatStudentCompareNumber(Number(student && student.scoreDiff || 0), 1),
                student && student.rankSchoolDiff != null ? student.rankSchoolDiff : '-',
                student && student.rankTownDiff != null ? student.rankTownDiff : '-'
            ]);
        });
        rows.push([], ['Top20 \u9000\u6b65\u5b66\u751f'], header);
        declineList.forEach(function(student, index) {
            const periods = Array.isArray(student && student.periods) ? student.periods : [];
            const first = periods[0] || {};
            const last = periods[periods.length - 1] || {};
            rows.push([
                index + 1,
                student && student.name || '',
                student && student.class || '',
                typeof first.total === 'number' ? first.total.toFixed(1) : '-',
                typeof last.total === 'number' ? last.total.toFixed(1) : '-',
                formatStudentCompareNumber(Number(student && student.scoreDiff || 0), 1),
                student && student.rankSchoolDiff != null ? student.rankSchoolDiff : '-',
                student && student.rankTownDiff != null ? student.rankTownDiff : '-'
            ]);
        });
        return {
            name: sanitizeSheetName('\u8fdb\u9000\u6b65\u5206\u6790', '\u8fdb\u9000\u6b65'),
            data: rows
        };
    }

    function buildStudentCompareStatSheet(visibleStudents) {
        const list = Array.isArray(visibleStudents) ? visibleStudents : [];
        const rows = [['\u5b66\u751f\u591a\u671f\u5bf9\u6bd4\u7edf\u8ba1'], [], ['\u6307\u6807', '\u6570\u503c']];
        const totalCount = list.length;
        if (!totalCount) {
            rows.push(['\u53ef\u5bfc\u51fa\u5b66\u751f\u6570', 0]);
            return {
                name: sanitizeSheetName('\u5bf9\u6bd4\u7edf\u8ba1', '\u7edf\u8ba1'),
                data: rows
            };
        }
        const improveCount = list.filter(function(item) { return item && item.progressType === 'improve'; }).length;
        const declineCount = list.filter(function(item) { return item && item.progressType === 'decline'; }).length;
        const stableCount = list.filter(function(item) { return item && item.progressType === 'stable'; }).length;
        const avgScoreDiff = list.reduce(function(sum, item) { return sum + Number(item && item.scoreDiff || 0); }, 0) / totalCount;
        const scoreDiffs = list.map(function(item) { return Number(item && item.scoreDiff || 0); });
        rows.push(['\u53ef\u5bfc\u51fa\u5b66\u751f\u6570', totalCount]);
        rows.push(['\u8fdb\u6b65\u5b66\u751f', improveCount + ' (' + (improveCount / totalCount * 100).toFixed(1) + '%)']);
        rows.push(['\u9000\u6b65\u5b66\u751f', declineCount + ' (' + (declineCount / totalCount * 100).toFixed(1) + '%)']);
        rows.push(['\u7a33\u5b9a\u5b66\u751f', stableCount + ' (' + (stableCount / totalCount * 100).toFixed(1) + '%)']);
        rows.push(['\u5e73\u5747\u603b\u5206\u53d8\u5316', avgScoreDiff.toFixed(2)]);
        rows.push(['\u6700\u5927\u8fdb\u6b65\u5206\u6570', Math.max.apply(null, scoreDiffs).toFixed(1)]);
        rows.push(['\u6700\u5927\u9000\u6b65\u5206\u6570', Math.min.apply(null, scoreDiffs).toFixed(1)]);
        rows.push([], [], ['\u73ed\u7ea7', '\u5b66\u751f\u6570', '\u8fdb\u6b65\u4eba\u6570', '\u9000\u6b65\u4eba\u6570', '\u5e73\u5747\u603b\u5206\u53d8\u5316', '\u5e73\u5747\u6821\u6392\u53d8\u5316']);
        const classStats = {};
        list.forEach(function(student) {
            const className = String(student && student.class || '').trim() || '\u672a\u5206\u73ed';
            if (!classStats[className]) {
                classStats[className] = { count: 0, improveCount: 0, declineCount: 0, totalScoreDiff: 0, totalRankDiff: 0 };
            }
            classStats[className].count += 1;
            if (student && student.progressType === 'improve') classStats[className].improveCount += 1;
            if (student && student.progressType === 'decline') classStats[className].declineCount += 1;
            classStats[className].totalScoreDiff += Number(student && student.scoreDiff || 0);
            classStats[className].totalRankDiff += Number(student && student.rankSchoolDiff || 0);
        });
        Object.keys(classStats).sort(function(a, b) { return a.localeCompare(b, 'zh-CN'); }).forEach(function(className) {
            const stat = classStats[className];
            rows.push([
                className,
                stat.count,
                stat.improveCount,
                stat.declineCount,
                (stat.totalScoreDiff / stat.count).toFixed(2),
                (stat.totalRankDiff / stat.count).toFixed(2)
            ]);
        });
        return {
            name: sanitizeSheetName('\u5bf9\u6bd4\u7edf\u8ba1', '\u7edf\u8ba1'),
            data: rows
        };
    }

    function buildStudentCompareExportFileName(options) {
        const opts = options || {};
        const school = String(opts.school || '').trim() || '\u5b66\u751f\u5bf9\u6bd4';
        const examIds = Array.isArray(opts.examIds) ? opts.examIds : [];
        const visibleStudents = Array.isArray(opts.visibleStudents) ? opts.visibleStudents : [];
        if (visibleStudents.length === 1) {
            return visibleStudents[0].name + '_' + examIds.join('_') + '.xlsx';
        }
        return school + '_\u5b66\u751f\u591a\u671f\u5bf9\u6bd4_' + visibleStudents.length + '\u4eba_' + examIds.join('_') + '.xlsx';
    }

    function buildStudentMultiPeriodExportData(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const visibleStudents = Array.isArray(opts.visibleStudents) ? opts.visibleStudents : [];
        const totalLabel = String(opts.totalLabel || '\u603b\u5206');
        const sheets = [];
        sheets.push(buildStudentCompareTotalSheet(cache, visibleStudents, totalLabel));
        buildStudentCompareSubjectSheets(cache, visibleStudents).forEach(function(sheet) { sheets.push(sheet); });
        const detailSheet = buildStudentCompareDetailSheet(cache, visibleStudents, totalLabel);
        if (detailSheet) sheets.push(detailSheet);
        if (Number(cache && cache.periodCount) > 1) {
            sheets.push(buildStudentCompareProgressSheet(visibleStudents));
            sheets.push(buildStudentCompareStatSheet(visibleStudents));
        }
        return {
            sheets: sheets,
            fileName: buildStudentCompareExportFileName({
                school: cache.school,
                examIds: cache.examIds,
                visibleStudents: visibleStudents
            })
        };
    }

    function buildStudentCompareCloudPayload(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const user = opts.user || {};
        const cohortId = String(opts.cohortId || 'unknown').trim() || 'unknown';
        const timestamp = String(opts.timestamp || '').trim() || new Date().toISOString().slice(0, 10);
        const school = String(cache.school || '').trim();
        const safeSchool = sanitizeCloudSegment(school) || 'school';
        const examIds = Array.isArray(cache.examIds) ? cache.examIds.filter(Boolean) : [];
        const periodCount = Number(cache.periodCount) === 3 ? 3 : 2;
        const title = String(opts.title || '').trim() || (school + ' ' + periodCount + '\u671f\u5b66\u751f\u591a\u671f\u5bf9\u6bd4(' + examIds.join(' vs ') + ')');
        return {
            key: 'STUDENT_COMPARE_' + cohortId + '_' + safeSchool + '_' + examIds.join('_') + '_' + timestamp,
            title: title,
            payload: {
                school: school,
                examIds: examIds,
                periodCount: periodCount,
                subjects: Array.isArray(cache.subjects) ? cache.subjects : [],
                title: title,
                studentCount: Array.isArray(cache.studentsCompareData) ? cache.studentsCompareData.length : 0,
                studentsCompareData: (Array.isArray(cache.studentsCompareData) ? cache.studentsCompareData : []).map(function(student) {
                    return {
                        id: student && student.id,
                        school: student && student.school,
                        name: student && student.name,
                        class: student && student.class,
                        periods: student && student.periods,
                        scoreDiff: student && student.scoreDiff,
                        rankSchoolDiff: student && student.rankSchoolDiff,
                        rankTownDiff: student && student.rankTownDiff,
                        latestTotal: student && student.latestTotal,
                        progressType: student && student.progressType
                    };
                }),
                createdBy: user.username || user.name || user.email,
                createdAt: new Date().toISOString()
            }
        };
    }

    function parseStudentCompareCloudKey(key) {
        const rawKey = String(key || '').trim();
        const prefix = 'STUDENT_COMPARE_';
        const body = rawKey.indexOf(prefix) === 0 ? rawKey.substring(prefix.length) : rawKey;
        const parts = body.split('_').filter(function(part) { return part !== ''; });
        let cohortId = parts[0] || '';
        const cohortMatch = cohortId.match(/^(\d{4}(?:\u7ea7)?)/);
        if (cohortMatch) cohortId = cohortMatch[1];
        return {
            key: rawKey,
            cohortId: cohortId,
            school: parts[1] || '',
            dateTag: parts.length ? parts[parts.length - 1] : ''
        };
    }

    function buildStudentCompareListItems(options) {
        const opts = options || {};
        const records = Array.isArray(opts.records) ? opts.records : [];
        return records.map(function(record) {
            const parsed = parseStudentCompareCloudKey(record && record.key);
            return {
                key: String(record && record.key || ''),
                displayDate: formatZhDateTime(record && record.updated_at),
                cohortLabel: parsed.cohortId || '\u672a\u77e5\u5c4a\u522b',
                schoolLabel: parsed.school || '\u5b66\u751f\u591a\u671f\u5bf9\u6bd4'
            };
        });
    }

    function buildStudentCompareListHtml(options) {
        const opts = options || {};
        const items = buildStudentCompareListItems(opts);
        const loadFunctionName = /^[\w$.]+$/.test(String(opts.loadFunctionName || '')) ? String(opts.loadFunctionName) : 'loadCloudStudentCompare';
        return items.map(function(item) {
            return '<div style="padding:12px; border-bottom:1px solid #e2e8f0; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" data-key="' + escapeHtml(item.key) + '" onclick="' + loadFunctionName + '(this.getAttribute(&quot;data-key&quot;))">'
                + '<div style="flex:1;">'
                + '<div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">'
                + '<span style="background:#f0fdf4; color:#16a34a; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">' + escapeHtml(item.cohortLabel) + '</span>'
                + '<span style="font-weight:600; color:#334155;">' + escapeHtml(item.schoolLabel) + '</span>'
                + '</div>'
                + '<div style="font-size:11px; color:#94a3b8; font-family:monospace;">' + escapeHtml(item.key) + '</div>'
                + '</div>'
                + '<div style="text-align:right;">'
                + '<div style="font-size:12px; color:#64748b;">' + escapeHtml(item.displayDate || '-') + '</div>'
                + '<div style="font-size:11px; color:#3b82f6; margin-top:2px;">\u70b9\u51fb\u67e5\u770b &gt;</div>'
                + '</div>'
                + '</div>';
        }).join('');
    }

    function buildStudentCompareDetailView(options) {
        const opts = options || {};
        const payload = opts.payload || {};
        const school = String(payload.school || '').trim();
        const examIds = Array.isArray(payload.examIds) ? payload.examIds : [];
        const periodCount = Number(payload.periodCount) === 3 ? 3 : 2;
        const subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
        const studentsCompareData = Array.isArray(opts.studentsCompareData)
            ? opts.studentsCompareData
            : (Array.isArray(payload.studentsCompareData) ? payload.studentsCompareData : []);
        const pageSize = typeof opts.pageSize === 'number' ? opts.pageSize : 20;
        const title = String(payload.title || '').trim() || (school + ' ' + periodCount + '\u671f\u5b66\u751f\u591a\u671f\u5bf9\u6bd4(' + examIds.join(' vs ') + ')');
        const displayCount = typeof opts.displayCount === 'number' ? opts.displayCount : studentsCompareData.length;
        const createdAtLabel = formatZhDateTime(payload.createdAt) || '-';
        return {
            restoredStudentCompareCache: {
                school: school,
                examIds: examIds,
                periodCount: periodCount,
                subjects: subjects,
                studentsCompareData: studentsCompareData,
                currentPage: 1,
                pageSize: pageSize
            },
            hintHtml: '\u5df2\u4ece\u4e91\u7aef\u8f7d\u5165\u5b66\u751f\u591a\u671f\u5bf9\u6bd4\uff1a' + escapeHtml(title)
                + ' (' + displayCount + '\u540d\u5b66\u751f / ' + escapeHtml(createdAtLabel) + ')',
            hintColor: '#16a34a'
        };
    }
    window.CompareAnalyticsService = {
        calcSchoolMetricsFromRows: calcSchoolMetricsFromRows,
        getSummaryEntryBySchool: getSummaryEntryBySchool,
        buildSchoolSummaryForExam: buildSchoolSummaryForExam,
        calcBottomGroupMetrics: calcBottomGroupMetrics,
        calcHighScoreMetrics: calcHighScoreMetrics,
        calcIndicatorMetrics: calcIndicatorMetrics,
        buildMacroMultiPeriodComparison: buildMacroMultiPeriodComparison,
        buildMacroMultiPeriodExportData: buildMacroMultiPeriodExportData,
        buildBasicMultiPeriodComparison: buildBasicMultiPeriodComparison,
        buildBasicMultiPeriodExportData: buildBasicMultiPeriodExportData,
        resolveStudentCompareSubjects: resolveStudentCompareSubjects,
        buildStudentMultiPeriodComparison: buildStudentMultiPeriodComparison,
        filterStudentCompareRowsByClasses: filterStudentCompareRowsByClasses,
        buildTeacherStatsForExam: buildTeacherStatsForExam,
        attachTeacherTownshipAvgRank: attachTeacherTownshipAvgRank,
        buildTeacherMultiPeriodComparison: buildTeacherMultiPeriodComparison,
        buildTeacherMultiPeriodExportData: buildTeacherMultiPeriodExportData,
        buildAllTeachersMultiPeriodComparison: buildAllTeachersMultiPeriodComparison,
        buildAllTeachersMultiPeriodExportData: buildAllTeachersMultiPeriodExportData,
        buildStudentCompareCloudPayload: buildStudentCompareCloudPayload,
        buildStudentCompareListItems: buildStudentCompareListItems,
        buildStudentCompareListHtml: buildStudentCompareListHtml,
        buildStudentCompareDetailView: buildStudentCompareDetailView
    };
})();
