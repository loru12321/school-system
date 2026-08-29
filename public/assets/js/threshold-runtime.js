// threshold-runtime.js — unified excellent/pass threshold resolution.
// Keeps the existing calculation rules while making the source and sample scope explicit.
(function (root, factory) {
    const runtime = factory(root || {});
    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }
    if (!root || root.ThresholdRuntime) return;
    root.ThresholdRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createThresholdRuntime(root) {
    const SUBJECT_ALIAS_MAP = Object.freeze({
        '道法': '政治',
        '道德与法治': '政治',
        '思政': '政治',
        '生物学': '生物'
    });

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function number(value, fallback = NaN) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function normalizeSubject(subject) {
        const raw = text(subject).replace(/\s+/g, '');
        if (typeof root.normalizeSubject === 'function') {
            const normalized = text(root.normalizeSubject(raw));
            if (normalized) return normalized;
        }
        return SUBJECT_ALIAS_MAP[raw] || raw;
    }

    function readThresholdConfig(thresholds, subject) {
        const map = thresholds && typeof thresholds === 'object' ? thresholds : {};
        const raw = text(subject);
        const normalized = normalizeSubject(raw);
        return map[raw] || map[normalized] || {};
    }

    function readDirectThreshold(thresholds, subject, kind) {
        const config = readThresholdConfig(thresholds, subject);
        const direct = kind === 'excellent'
            ? (config.excellent ?? config.exc ?? config.good)
            : (config.pass ?? config.passLine);
        const value = number(direct);
        return value > 0 ? value : NaN;
    }

    function uniqueSchools(rows) {
        return new Set((rows || [])
            .map((row) => text(row && (row.school || row.schoolName)))
            .filter(Boolean));
    }

    function getScopeRows(options = {}) {
        const rows = Array.isArray(options.rows) ? options.rows : [];
        let townshipRows = Array.isArray(options.townshipRows) ? options.townshipRows : null;
        if (!townshipRows && typeof options.townshipFilter === 'function') {
            const filtered = options.townshipFilter(rows);
            townshipRows = Array.isArray(filtered) ? filtered : [];
        }
        townshipRows = townshipRows || [];
        const useTownship = townshipRows.length > 0;
        const sourceRows = useTownship ? townshipRows : rows;
        const source = useTownship ? 'township' : 'current';
        const sourceLabel = useTownship ? '全乡镇参评学校统一划线' : '当前数据范围划线';
        const schools = uniqueSchools(sourceRows);
        return {
            rows,
            sourceRows,
            source,
            sourceLabel,
            sampleCount: sourceRows.length,
            schoolCount: schools.size,
            scope: source === 'township' ? 'township' : (schools.size === 1 ? 'school' : 'current')
        };
    }

    function valuesForSubject(rows, subject) {
        const key = text(subject);
        return (rows || [])
            .map((row) => key === 'total' ? number(row && row.total) : number(row && row.scores && (row.scores[key] ?? row.scores[normalizeSubject(key)])))
            .filter(Number.isFinite)
            .sort((left, right) => right - left);
    }

    function percentileLine(values, ratio) {
        if (!values.length) return 0;
        const index = Math.max(0, Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1));
        return values[index] || 0;
    }

    function rankLine(values, rank) {
        if (!values.length) return 0;
        const index = Math.max(0, Math.min(values.length - 1, Math.floor(Number(rank)) - 1));
        return values[index] || 0;
    }

    function resolveSubjectThreshold(subject, kind, scores, options = {}) {
        const direct = readDirectThreshold(options.thresholds, subject, kind);
        if (Number.isFinite(direct)) {
            return {
                value: direct,
                source: 'explicit',
                sourceLabel: text(options.explicitSourceLabel) || '已配置显式分数线',
                sampleCount: Array.isArray(scores) ? scores.length : 0,
                schoolCount: number(options.schoolCount, 0),
                scope: text(options.scope) || 'configured'
            };
        }
        const values = (scores || []).map(Number).filter(Number.isFinite).sort((left, right) => right - left);
        if (!values.length) {
            return {
                value: number(options.emptyFallback, 0),
                source: 'empty',
                sourceLabel: '暂无有效成绩，无法划线',
                sampleCount: 0,
                schoolCount: number(options.schoolCount, 0),
                scope: text(options.scope) || 'empty'
            };
        }
        const ratio = kind === 'excellent' ? 0.15 : 0.5;
        return {
            value: percentileLine(values, ratio),
            source: 'percentile',
            sourceLabel: text(options.sourceLabel) || '当前数据范围按比例划线',
            sampleCount: values.length,
            schoolCount: number(options.schoolCount, 0),
            scope: text(options.scope) || 'current',
            ratio
        };
    }

    function resolvePair(subject, scores, options = {}) {
        const context = Object.keys(options).length ? options : {
            thresholds: root.THRESHOLDS,
            sourceLabel: root.THRESHOLD_SCOPE?.sourceLabel || '当前数据范围按比例划线',
            schoolCount: root.THRESHOLD_SCOPE?.schoolCount,
            scope: root.THRESHOLD_SCOPE?.scope
        };
        const excellent = resolveSubjectThreshold(subject, 'excellent', scores, context).value;
        const pass = resolveSubjectThreshold(subject, 'pass', scores, context).value;
        return { exc: excellent, pass, low: pass * 0.6 };
    }

    function buildThresholdSnapshot(options = {}) {
        const scope = getScopeRows(options);
        const allSchools = uniqueSchools(scope.rows);
        const singleSchool = options.singleSchool === true || (options.singleSchool !== false && allSchools.size === 1);
        const subjects = Array.isArray(options.subjects) ? options.subjects.slice() : [];
        const keys = [...new Set([...subjects, 'total'])];
        const topExcellent = number(options.topExcellent, 0);
        const topPass = number(options.topPass, 0);
        const thresholds = {};
        const metadata = {};

        keys.forEach((subject) => {
            const values = valuesForSubject(scope.sourceRows, subject);
            const directExcellent = readDirectThreshold(options.thresholds, subject, 'excellent');
            const directPass = readDirectThreshold(options.thresholds, subject, 'pass');
            let excellent;
            let pass;
            if (Number.isFinite(directExcellent) || Number.isFinite(directPass)) {
                excellent = Number.isFinite(directExcellent)
                    ? { value: directExcellent, source: 'explicit', sourceLabel: text(options.explicitSourceLabel) || '已配置显式分数线' }
                    : resolveSubjectThreshold(subject, 'excellent', values, scope);
                pass = Number.isFinite(directPass)
                    ? { value: directPass, source: 'explicit', sourceLabel: text(options.explicitSourceLabel) || '已配置显式分数线' }
                    : resolveSubjectThreshold(subject, 'pass', values, scope);
            } else if (singleSchool && subject === 'total' && topExcellent > 0 && topPass > 0) {
                excellent = { value: rankLine(values, topExcellent), source: 'rank', sourceLabel: `本校总分名次线 Top${Math.floor(topExcellent)}` };
                pass = { value: rankLine(values, topPass), source: 'rank', sourceLabel: `本校总分名次线 Top${Math.floor(topPass)}` };
            } else {
                excellent = { value: percentileLine(values, 0.15), source: 'percentile', sourceLabel: scope.sourceLabel, ratio: 0.15 };
                pass = { value: percentileLine(values, 0.5), source: 'percentile', sourceLabel: scope.sourceLabel, ratio: 0.5 };
            }
            const common = {
                sampleCount: values.length,
                schoolCount: scope.schoolCount,
                scope: scope.scope
            };
            thresholds[subject] = { exc: excellent.value || 0, pass: pass.value || 0 };
            metadata[subject] = {
                excellent: { ...excellent, ...common },
                pass: { ...pass, ...common },
                source: excellent.source === pass.source ? excellent.source : 'mixed',
                sourceLabel: excellent.sourceLabel === pass.sourceLabel ? excellent.sourceLabel : `${excellent.sourceLabel}；${pass.sourceLabel}`,
                sampleCount: common.sampleCount,
                schoolCount: common.schoolCount,
                scope: common.scope
            };
        });

        return {
            thresholds,
            metadata,
            source: scope.source,
            sourceLabel: scope.sourceLabel,
            sampleCount: scope.sampleCount,
            schoolCount: scope.schoolCount,
            scope: scope.scope,
            singleSchool
        };
    }

    function formatMetadata(metadata, subject) {
        const item = metadata && metadata[text(subject)];
        if (!item) return '';
        const sample = Number(item.sampleCount || 0);
        const schools = Number(item.schoolCount || 0);
        const coverage = schools > 0 ? `，覆盖${schools}校` : '';
        return `${item.sourceLabel || '当前数据范围划线'}（样本${sample}人${coverage}）`;
    }

    return {
        normalizeSubject,
        readDirectThreshold,
        resolveSubjectThreshold,
        resolvePair,
        buildThresholdSnapshot,
        formatMetadata,
        percentileLine,
        rankLine
    };
});
