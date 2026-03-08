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
        buildBasicMultiPeriodExportData: buildBasicMultiPeriodExportData
    };
})();
