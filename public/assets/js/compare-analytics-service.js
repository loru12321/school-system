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
            return { indicatorCount: 0, indicatorRate: 0, label: '未设置' };
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
            label: '未设置（回退到高分段）'
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
                ? '红色预警'
                : (metrics.passRate < 0.75 || metrics.excRate < 0.15 ? '黄色关注' : '绿色稳定');

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

        const schoolSheet = [['学校', '期次', '人数', '总分均分', '优秀率', '及格率', '校际均分排位']];
        summaryByExam.forEach(function(item) {
            const summary = getSummaryEntryBySchool(item.summary, school, { normalizeSchoolName: normalizeSchoolName });
            if (!summary) return;
            schoolSheet.push([school, item.examId, summary.count, summary.avg, summary.excRate, summary.passRate, summary.rankAvg]);
        });

        const first = examIds[0] || '首期';
        const last = examIds[examIds.length - 1] || '末期';
        const allSchoolsSheet = [[
            '学校',
            first + ' -> ' + last + ' 均分变化',
            first + ' -> ' + last + ' 优秀率变化',
            first + ' -> ' + last + ' 及格率变化',
            first + ' -> ' + last + ' 排位变化'
        ]];
        allSchoolsChange.forEach(function(item) {
            allSchoolsSheet.push([item.school, item.dAvg, item.dExc, item.dPass, item.dRank]);
        });

        const moduleSheet = [['期次', '预警等级', '高分段人数', '高分段占比', '指标生人数', '指标生占比', '后1/3均分', '低分率']];
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

    window.CompareAnalyticsService = {
        calcSchoolMetricsFromRows: calcSchoolMetricsFromRows,
        getSummaryEntryBySchool: getSummaryEntryBySchool,
        buildSchoolSummaryForExam: buildSchoolSummaryForExam,
        calcBottomGroupMetrics: calcBottomGroupMetrics,
        calcHighScoreMetrics: calcHighScoreMetrics,
        calcIndicatorMetrics: calcIndicatorMetrics,
        buildMacroMultiPeriodComparison: buildMacroMultiPeriodComparison,
        buildMacroMultiPeriodExportData: buildMacroMultiPeriodExportData
    };
})();
