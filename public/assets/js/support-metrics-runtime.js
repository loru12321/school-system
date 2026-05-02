(function (root) {
    if (!root) return;

    const schedule = typeof root.setTimeout === 'function'
        ? root.setTimeout.bind(root)
        : (typeof setTimeout === 'function' ? setTimeout : (task) => task());
    let lastBottom3Summary = null;
    let lastIndicatorSummary = null;

    function getSchools() {
        try {
            if (root.SCHOOLS && typeof root.SCHOOLS === 'object') return root.SCHOOLS;
            if (typeof SCHOOLS !== 'undefined' && SCHOOLS && typeof SCHOOLS === 'object') return SCHOOLS;
        } catch (_) {}
        return {};
    }

    function getTownshipSchools() {
        const schools = getSchools();
        const names = Object.keys(schools);
        return Object.values(schools).filter((school) => {
            if (!school || typeof school !== 'object') return false;
            if (typeof root.isTownshipManagedSchool === 'function') {
                return root.isTownshipManagedSchool(school.name, names);
            }
            return true;
        });
    }

    function toFiniteNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function formatFixed(value, digits = 2) {
        const number = Number(value);
        return Number.isFinite(number) ? number.toFixed(digits) : '--';
    }

    function setText(id, value) {
        const element = root.document?.getElementById(id);
        if (element) element.textContent = String(value ?? '--');
    }

    function shortenName(name) {
        const text = String(name || '').trim();
        if (!text) return '--';
        return text.length > 8 ? `${text.slice(0, 8)}...` : text;
    }

    function refreshBottom3Summary() {
        const schools = getTownshipSchools();
        const rows = schools
            .filter((school) => school.bottom3)
            .map((school) => ({
                name: String(school.name || '').trim(),
                totalN: toFiniteNumber(school.bottom3?.totalN, 0),
                bottomN: toFiniteNumber(school.bottom3?.bottomN, 0),
                excN: toFiniteNumber(school.bottom3?.excN, 0),
                avg: toFiniteNumber(school.bottom3?.avg, 0),
                score: toFiniteNumber(school.scoreBottom, 0),
                rank: toFiniteNumber(school.rankBottom, 0)
            }))
            .filter((row) => row.name && row.totalN > 0);
        const finite = rows.every((row) => [row.totalN, row.bottomN, row.excN, row.avg, row.score, row.rank]
            .every((value) => Number.isFinite(Number(value))));
        const sorted = rows.slice().sort((a, b) => {
            if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
            return b.score - a.score;
        });
        const avgScore = rows.length
            ? rows.reduce((sum, row) => sum + row.avg, 0) / rows.length
            : 0;
        const excRate = root.CONFIG && Number.isFinite(Number(root.CONFIG.excRate))
            ? Number(root.CONFIG.excRate) * 100
            : 0;

        setText('bottom3-school-count', rows.length || '--');
        setText('bottom3-average-score', rows.length ? formatFixed(avgScore, 2) : '--');
        setText('bottom3-top-school', sorted[0] ? shortenName(sorted[0].name) : '--');
        if (excRate > 0) setText('label-exc', `${formatFixed(excRate, 0)}%`);

        lastBottom3Summary = {
            ok: rows.length > 0 && finite,
            count: rows.length,
            finite,
            averageScore: rows.length ? Number(avgScore.toFixed(2)) : 0,
            topSchool: sorted[0]?.name || '',
            excRate: excRate > 0 ? Number(excRate.toFixed(2)) : 0
        };
        root.BOTTOM3_LAST_SUMMARY = lastBottom3Summary;
        return lastBottom3Summary;
    }

    function normalizeIndicatorRows(result) {
        if (Array.isArray(result)) return result;
        if (Array.isArray(root.INDICATOR_LAST_RESULT)) return root.INDICATOR_LAST_RESULT;
        return [];
    }

    function refreshIndicatorSummary(result) {
        const rows = normalizeIndicatorRows(result)
            .map((row) => ({
                name: String(row?.name || '').trim(),
                finalScore: toFiniteNumber(row?.finalScore, 0),
                score1: toFiniteNumber(row?.score1, 0),
                score2: toFiniteNumber(row?.score2, 0),
                base1: toFiniteNumber(row?.base1, 0),
                base2: toFiniteNumber(row?.base2, 0),
                bonus1: toFiniteNumber(row?.bonus1, 0),
                bonus2: toFiniteNumber(row?.bonus2, 0),
                rank: toFiniteNumber(row?.rank, 0),
                missingTarget: !!row?.missingTarget,
                invalidTarget: !!row?.invalidTarget
            }))
            .filter((row) => row.name);
        const finite = rows.every((row) => [
            row.finalScore,
            row.score1,
            row.score2,
            row.base1,
            row.base2,
            row.bonus1,
            row.bonus2,
            row.rank
        ].every((value) => Number.isFinite(Number(value))));
        const sorted = rows.slice().sort((a, b) => {
            if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
            return b.finalScore - a.finalScore;
        });
        const issueCount = rows.filter((row) => row.missingTarget || row.invalidTarget).length;

        setText('indicator-school-count', rows.length || '--');
        setText('indicator-top-score', sorted[0] ? formatFixed(sorted[0].finalScore, 2) : '--');
        setText('indicator-top-school', sorted[0] ? shortenName(sorted[0].name) : '等待计算');
        setText('indicator-missing-target-count', rows.length ? issueCount : '--');

        lastIndicatorSummary = {
            ok: rows.length > 0 && finite,
            count: rows.length,
            finite,
            topScore: sorted[0] ? Number(sorted[0].finalScore.toFixed(2)) : 0,
            topSchool: sorted[0]?.name || '',
            issueCount
        };
        root.INDICATOR_LAST_SUMMARY = lastIndicatorSummary;
        return lastIndicatorSummary;
    }

    function refreshAll() {
        installWrappers();
        return {
            bottom3: refreshBottom3Summary(),
            indicator: refreshIndicatorSummary()
        };
    }

    function installRenderTablesWrapper() {
        const originalRenderTables = root.renderTables;
        if (typeof originalRenderTables !== 'function' || originalRenderTables.__supportMetricsWrapped) return false;
        const wrappedRenderTables = function (...args) {
            const result = originalRenderTables.apply(this, args);
            schedule(refreshAll, 0);
            return result;
        };
        wrappedRenderTables.__supportMetricsWrapped = true;
        wrappedRenderTables.__supportMetricsOriginal = originalRenderTables;
        root.renderTables = wrappedRenderTables;
        return true;
    }

    function installCalcIndicatorsWrapper() {
        const originalCalcIndicators = root.calcIndicators;
        if (typeof originalCalcIndicators !== 'function' || originalCalcIndicators.__supportMetricsWrapped) return false;
        const wrappedCalcIndicators = function (...args) {
            const result = originalCalcIndicators.apply(this, args);
            if (Array.isArray(result)) root.INDICATOR_LAST_RESULT = result;
            schedule(() => refreshIndicatorSummary(result), 0);
            return result;
        };
        wrappedCalcIndicators.__supportMetricsWrapped = true;
        wrappedCalcIndicators.__supportMetricsOriginal = originalCalcIndicators;
        root.calcIndicators = wrappedCalcIndicators;
        return true;
    }

    function installWrappers() {
        installRenderTablesWrapper();
        installCalcIndicatorsWrapper();
    }

    root.SupportMetricsRuntime = {
        refreshAll,
        refreshBottom3Summary,
        refreshIndicatorSummary,
        getLastBottom3Summary: () => lastBottom3Summary,
        getLastIndicatorSummary: () => lastIndicatorSummary
    };

    function scheduleInitialRefresh() {
        installWrappers();
        schedule(refreshAll, 0);
        schedule(refreshAll, 600);
    }

    if (root.document?.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', scheduleInitialRefresh, { once: true });
    } else {
        scheduleInitialRefresh();
    }
})(typeof window !== 'undefined' ? window : globalThis);
