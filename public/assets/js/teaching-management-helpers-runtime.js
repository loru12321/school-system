// Shared, low-cost helpers for the teaching-management and student-overview
// runtimes.  This file is loaded before app.js so the helpers remain available
// as legacy globals without keeping their implementation in the main bundle.
(function installTeachingManagementHelpers(root) {
    if (!root || root.TeachingManagementHelpersRuntime) return;

    function tmEscapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function tmSetHtml(id, html) {
        const el = document.getElementById(id);
        if (el && el.innerHTML !== html) el.innerHTML = html;
    }

    function tmLooksLikePendingValue(value) {
        const text = String(value || '').trim();
        if (!text) return true;
        return text.includes('请选择') || text.includes('考试数量不足') || text.includes('正在同步');
    }

    function tmGetSelectDisplayValue(ids, fallback = '') {
        for (const id of ids) {
            const el = document.getElementById(id);
            if (!el) continue;
            const text = el.selectedOptions && el.selectedOptions[0]
                ? String(el.selectedOptions[0].textContent || '').trim()
                : String(el.value || '').trim();
            if (tmLooksLikePendingValue(text)) continue;
            return text;
        }
        return fallback;
    }

    function tmGetSelectRawValue(ids, fallback = '') {
        for (const id of ids) {
            const el = document.getElementById(id);
            if (!el) continue;
            const value = String(el.value || '').trim();
            if (tmLooksLikePendingValue(value)) continue;
            return value;
        }
        return fallback;
    }

    function tmBuildStatusChip(text, tone = 'neutral') {
        return `<span class="status-chip ${tone}">${tmEscapeHtml(text)}</span>`;
    }

    function tmBuildStatCard(title, stateText, tone, main, sub) {
        return `
            <div class="tm-stat-card-inner">
                <div class="tm-stat-head">
                    <strong>${tmEscapeHtml(title)}</strong>
                    ${tmBuildStatusChip(stateText, tone)}
                </div>
                <div class="tm-stat-main">${tmEscapeHtml(main)}</div>
                <div class="tm-stat-sub">${tmEscapeHtml(sub)}</div>
            </div>
        `;
    }

    function tmBuildMiniCard(title, value) {
        return `
            <div class="tm-mini-card">
                <strong>${tmEscapeHtml(title)}</strong>
                <span>${tmEscapeHtml(value)}</span>
            </div>
        `;
    }

    const getCoverageCache = () => root.TM_TEACHER_COVERAGE_CACHE || (root.TM_TEACHER_COVERAGE_CACHE = { teacherMap: null, result: null });
    const getExamCache = () => root.TM_AVAILABLE_EXAM_LIST_CACHE || (root.TM_AVAILABLE_EXAM_LIST_CACHE = { signature: '', result: [] });
    const getInsightCache = () => root.TM_TEACHER_INSIGHT_CACHE || (root.TM_TEACHER_INSIGHT_CACHE = {
        stats: null,
        subjectFilter: '',
        teacherFilter: '',
        result: null
    });

    function tmGetTeacherCoverageFromMap() {
        const teacherMap = root.TEACHER_MAP && typeof root.TEACHER_MAP === 'object' ? root.TEACHER_MAP : {};
        const cache = getCoverageCache();
        if (cache.teacherMap === teacherMap && cache.result) {
            return cache.result;
        }
        const keys = Object.keys(teacherMap);
        const teachers = new Set();
        const classes = new Set();
        const subjects = new Set();
        keys.forEach((key) => {
            const teacherName = String(teacherMap[key] || '').trim();
            if (teacherName) teachers.add(teacherName);
            const [className, subjectName] = String(key).split('_');
            if (className) classes.add(String(className).trim());
            if (subjectName) subjects.add(String(subjectName).trim());
        });
        const result = {
            mappingCount: keys.length,
            teacherCount: teachers.size,
            classCount: classes.size,
            subjectCount: subjects.size
        };
        root.TM_TEACHER_COVERAGE_CACHE = { teacherMap, result };
        return result;
    }

    function tmGetAvailableExamList() {
        const db = (typeof root.CohortDB !== 'undefined' && root.CohortDB && typeof root.CohortDB.ensure === 'function')
            ? root.CohortDB.ensure()
            : (root.COHORT_DB || null);
        const examSignature = db?.exams && typeof db.exams === 'object'
            ? Object.values(db.exams).map(ex => [
                String(ex?.examId || ex?.id || ''),
                String(ex?.createdAt || 0),
                String(ex?.fingerprint || ''),
                Array.isArray(ex?.data) ? ex.data.length : 0
            ].join(':')).sort().join('|')
            : '';
        const cloudHistorySignature = Array.isArray(root.PREV_DATA)
            ? root.PREV_DATA.map(row => [
                String(row?.examFullKey || row?.examId || ''),
                String(row?.fingerprint || ''),
                String(row?.updatedAt || '')
            ].join(':')).sort().join('|')
            : '';
        const signature = [
            typeof root.listAvailableExamsForCompare === 'function' ? 'compare' : 'local',
            String(root.CURRENT_COHORT_ID || ''),
            String(root.CURRENT_EXAM_ID || ''),
            String(root.__RAW_DATA_VERSION || 0),
            Array.isArray(root.RAW_DATA) ? root.RAW_DATA.length : 0,
            examSignature,
            cloudHistorySignature
        ].join('::');
        const cache = getExamCache();
        if (cache.signature === signature && Array.isArray(cache.result)) {
            return cache.result.map(ex => ({ ...ex }));
        }
        if (typeof root.listAvailableExamsForCompare === 'function') {
            const compareList = root.listAvailableExamsForCompare();
            if (Array.isArray(compareList) && compareList.length) {
                root.TM_AVAILABLE_EXAM_LIST_CACHE = { signature, result: compareList.map(ex => ({ ...ex })) };
                return compareList;
            }
        }
        if (db?.exams && typeof db.exams === 'object') {
            const result = Object.values(db.exams).map(ex => ({
                id: ex?.examId || ex?.id || '',
                label: ex?.examLabel || ex?.label || ex?.examId || ex?.id || '',
                createdAt: ex?.createdAt || 0
            })).filter(ex => ex.id);
            root.TM_AVAILABLE_EXAM_LIST_CACHE = { signature, result: result.map(ex => ({ ...ex })) };
            return result;
        }
        root.TM_AVAILABLE_EXAM_LIST_CACHE = { signature, result: [] };
        return [];
    }

    function tmBuildTeacherInsight(subjectFilter = '', teacherFilter = '') {
        const stats = typeof root.readTeacherStats === 'function' ? root.readTeacherStats() : {};
        const useSubjectFilter = String(subjectFilter || '').trim();
        const useTeacherFilter = String(teacherFilter || '').trim();
        const cache = getInsightCache();
        if (cache.stats === stats
            && cache.subjectFilter === useSubjectFilter
            && cache.teacherFilter === useTeacherFilter
            && cache.result) {
            return cache.result;
        }
        const teacherSet = new Set();
        const classSet = new Set();
        const subjectSet = new Set();
        const lowRiskTeachers = new Set();
        const scoreRiskTeachers = new Set();
        const passRiskTeachers = new Set();
        const subjectBuckets = {};

        Object.entries(stats || {}).forEach(([teacherName, subjectMap]) => {
            if (useTeacherFilter && useTeacherFilter !== '全部教师' && teacherName !== useTeacherFilter) return;
            Object.entries(subjectMap || {}).forEach(([subjectName, data]) => {
                if (useSubjectFilter && useSubjectFilter !== '全部学科' && subjectName !== useSubjectFilter) return;
                teacherSet.add(teacherName);
                subjectSet.add(subjectName);
                const classText = Array.isArray(data?.classes) ? data.classes.join(',') : String(data?.classes || '');
                classText.split(',').map(item => item.trim()).filter(Boolean).forEach(item => classSet.add(item));

                const lowRate = Number(data?.lowRate || 0);
                const passRate = Number(data?.passRate || 0);
                const fairScore = Number(data?.fairScore ?? data?.finalScore ?? 0);
                const baselineAdjustment = Number(data?.baselineAdjustment || 0);
                const sampleStabilityRate = Number(data?.sampleStabilityRate || 0);
                const sampleShiftCount = Number(data?.sampleShiftCount || 0);
                const teacherChangeProtected = !!data?.teacherChangeProtected;
                const conversionScore = Number(data?.conversionScore || 50);

                if (lowRate >= 0.12) lowRiskTeachers.add(teacherName);
                if (passRate > 0 && passRate < 0.6) passRiskTeachers.add(teacherName);
                if ((fairScore > 0 && fairScore < 60) || baselineAdjustment <= -6 || teacherChangeProtected || conversionScore < 45 || (sampleStabilityRate > 0 && sampleStabilityRate < 0.75 && sampleShiftCount >= 3)) scoreRiskTeachers.add(teacherName);

                if (!subjectBuckets[subjectName]) subjectBuckets[subjectName] = { count: 0, totalLowRate: 0, totalScore: 0, riskCount: 0 };
                subjectBuckets[subjectName].count += 1;
                subjectBuckets[subjectName].totalLowRate += lowRate;
                subjectBuckets[subjectName].totalScore += fairScore;
                if (lowRate >= 0.12 || fairScore < 60 || baselineAdjustment <= -6 || teacherChangeProtected || conversionScore < 45 || (passRate > 0 && passRate < 0.6) || (sampleStabilityRate > 0 && sampleStabilityRate < 0.75 && sampleShiftCount >= 3)) subjectBuckets[subjectName].riskCount += 1;
            });
        });

        const focusSubject = Object.entries(subjectBuckets)
            .map(([subjectName, bucket]) => ({
                subjectName,
                avgLowRate: bucket.count ? bucket.totalLowRate / bucket.count : 0,
                avgScore: bucket.count ? bucket.totalScore / bucket.count : 0,
                riskCount: bucket.riskCount
            }))
            .sort((a, b) => b.riskCount - a.riskCount || b.avgLowRate - a.avgLowRate || a.avgScore - b.avgScore)[0] || null;

        const result = {
            teacherCount: teacherSet.size,
            classCount: classSet.size,
            subjectCount: subjectSet.size,
            lowRiskTeacherCount: lowRiskTeachers.size,
            scoreRiskTeacherCount: scoreRiskTeachers.size,
            passRiskTeacherCount: passRiskTeachers.size,
            riskTeacherCount: new Set([...lowRiskTeachers, ...scoreRiskTeachers, ...passRiskTeachers]).size,
            focusSubject
        };
        root.TM_TEACHER_INSIGHT_CACHE = { stats, subjectFilter: useSubjectFilter, teacherFilter: useTeacherFilter, result };
        return result;
    }

    function tmApplySelectValue(selectId, preferredValue = '', preferredText = '') {
        const el = document.getElementById(selectId);
        if (!el) return false;
        const valueText = String(preferredValue || '').trim();
        const labelText = String(preferredText || preferredValue || '').trim();
        if (!valueText && !labelText) return false;
        let matched = null;
        const options = Array.from(el.options || []);
        if (valueText) matched = options.find(opt => String(opt.value || '').trim() === valueText);
        if (!matched && labelText) matched = options.find(opt => String(opt.textContent || '').trim() === labelText);
        if (!matched) return false;
        el.value = matched.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    const exports = {
        tmEscapeHtml, tmSetHtml, tmLooksLikePendingValue, tmGetSelectDisplayValue,
        tmGetSelectRawValue, tmBuildStatusChip, tmBuildStatCard, tmBuildMiniCard,
        tmGetTeacherCoverageFromMap, tmGetAvailableExamList, tmBuildTeacherInsight,
        tmApplySelectValue
    };
    root.TeachingManagementHelpersRuntime = exports;
    Object.assign(root, exports);
}(window));
