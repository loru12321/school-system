(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.AnalyticsKernel) return;
    root.AnalyticsKernel = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createAnalyticsKernel(root) {
    const HASH_SEED = 2166136261;
    const PROCESS_CACHE_LIMIT = normalizeProcessCacheLimit(root.ANALYTICS_PROCESS_CACHE_LIMIT, 5);
    const SUBJECT_ALIAS_MAP = Object.freeze({
        '语文': '语文',
        '数学': '数学',
        '英语': '英语',
        '物理': '物理',
        '化学': '化学',
        '政治': '政治',
        '道法': '政治',
        '道德与法治': '政治',
        '思政': '政治',
        '历史': '历史',
        '地理': '地理',
        '生物': '生物',
        '生物学': '生物',
        '科学': '科学'
    });
    const SUBJECT_FULL_SCORE_RULES = Object.freeze({
        6: Object.freeze({ '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100 }),
        7: Object.freeze({ '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100 }),
        8: Object.freeze({ '语文': 150, '数学': 150, '英语': 150, '历史': 50, '地理': 50, '生物': 50, '政治': 100, '物理': 100, '化学': 100 }),
        9: Object.freeze({ '语文': 150, '数学': 150, '英语': 150, '政治': 100, '物理': 90, '化学': 60 })
    });
    const CHINESE_GRADE_MAP = Object.freeze({
        '六': 6,
        '七': 7,
        '八': 8,
        '九': 9,
        '初一': 7,
        '初二': 8,
        '初三': 9
    });
    const state = {
        snapshotSignature: '',
        snapshot: null,
        processCache: new Map(),
        processOrder: []
    };

    function normalizeText(value) {
        return String(value == null ? '' : value).trim();
    }

    function normalizeProcessCacheLimit(value, fallback = 5) {
        const limit = Number(value);
        if (!Number.isFinite(limit)) return fallback;
        return Math.max(1, Math.min(Math.floor(limit), 20));
    }

    function normalizeName(value) {
        return normalizeText(value).replace(/\s+/g, '');
    }

    function normalizeClassName(value) {
        if (typeof root.normalizeClass === 'function') return root.normalizeClass(value);
        if (root.AuthState && typeof root.AuthState.normalizeClassName === 'function') {
            return root.AuthState.normalizeClassName(value);
        }
        return normalizeText(value).replace(/班$/, '');
    }

    function normalizeSubjectName(value) {
        if (typeof root.normalizeSubject === 'function') return root.normalizeSubject(value);
        const normalized = normalizeText(value).replace(/\s+/g, '');
        return SUBJECT_ALIAS_MAP[normalized] || normalized;
    }

    function readLocalStorageValue(key) {
        try {
            return root.localStorage && typeof root.localStorage.getItem === 'function'
                ? root.localStorage.getItem(key)
                : '';
        } catch {
            return '';
        }
    }

    function extractGradeNumber(value) {
        if (value == null || value === '') return null;
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value >= 6 && value <= 9 ? value : null;
        }
        const text = normalizeText(value).replace(/\s+/g, '');
        if (!text) return null;
        if (/^[6-9]$/.test(text)) return Number(text);
        const arabicMatch = text.match(/(?:^|[^\d])([6-9])(?:年级|年級|级|級)?(?:$|[^\d])/);
        if (arabicMatch) return Number(arabicMatch[1]);
        const juniorMatch = text.match(/初[一二三]/);
        if (juniorMatch && CHINESE_GRADE_MAP[juniorMatch[0]]) return CHINESE_GRADE_MAP[juniorMatch[0]];
        const chineseMatch = text.match(/[六七八九](?:年级|年級|级|級)/);
        if (chineseMatch && CHINESE_GRADE_MAP[chineseMatch[0][0]]) return CHINESE_GRADE_MAP[chineseMatch[0][0]];
        return null;
    }

    function inferGradeNumber(options = {}) {
        const settings = options && typeof options === 'object' ? options : {};
        const optionConfig = settings && typeof settings.config === 'object' ? settings.config : null;
        let uiMeta = null;
        try {
            uiMeta = typeof root.getExamMetaFromUI === 'function' ? root.getExamMetaFromUI() : null;
        } catch {
            uiMeta = null;
        }
        const config = optionConfig || (root.CONFIG && typeof root.CONFIG === 'object' ? root.CONFIG : {});
        const cohortMeta = root.CURRENT_COHORT_META && typeof root.CURRENT_COHORT_META === 'object'
            ? root.CURRENT_COHORT_META
            : {};
        const candidates = [
            settings.grade,
            settings.gradeNumber,
            settings.gradeName,
            settings.name,
            settings.examName,
            settings.examId,
            uiMeta && uiMeta.grade,
            uiMeta && uiMeta.gradeName,
            uiMeta && uiMeta.name,
            cohortMeta.grade,
            cohortMeta.gradeName,
            cohortMeta.name,
            config.grade,
            config.gradeNumber,
            config.gradeName,
            config.name,
            root.CURRENT_EXAM_ID,
            root.CURRENT_TERM_ID,
            readLocalStorageValue('CURRENT_EXAM_ID'),
            readLocalStorageValue('CURRENT_TERM_ID'),
            readLocalStorageValue('CURRENT_TEACHER_TERM_ID')
        ];
        for (const candidate of candidates) {
            const grade = extractGradeNumber(candidate);
            if (grade) return grade;
        }
        return null;
    }

    function getSubjectFullScore(subject, options = {}) {
        const grade = inferGradeNumber(options);
        const subjectName = normalizeSubjectName(subject);
        if (!grade || !subjectName || !SUBJECT_FULL_SCORE_RULES[grade]) return null;
        const fullScore = SUBJECT_FULL_SCORE_RULES[grade][subjectName];
        return Number.isFinite(Number(fullScore)) ? Number(fullScore) : null;
    }

    function getSubjectFullScoreMap(subjects, options = {}) {
        const settings = options && typeof options === 'object' ? options : {};
        const subjectList = Array.isArray(subjects)
            ? subjects
            : getDataState(settings).subjects;
        return (Array.isArray(subjectList) ? subjectList : []).reduce((map, subject) => {
            const fullScore = getSubjectFullScore(subject, settings);
            if (Number.isFinite(Number(fullScore))) map[subject] = Number(fullScore);
            return map;
        }, {});
    }

    function getTotalFullScore(subjects, options = {}) {
        const fullScoreMap = getSubjectFullScoreMap(subjects, options);
        const scores = Object.values(fullScoreMap).map(Number).filter(Number.isFinite);
        if (!scores.length) return null;
        return scores.reduce((sum, score) => sum + score, 0);
    }

    function isScoreAboveSubjectFullScore(subject, score, options = {}) {
        const value = Number(score);
        const fullScore = getSubjectFullScore(subject, options);
        return Number.isFinite(value) && Number.isFinite(Number(fullScore)) && value > Number(fullScore);
    }

    function getSubjectFullScoreRules() {
        return JSON.parse(JSON.stringify(SUBJECT_FULL_SCORE_RULES));
    }

    function toNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function hashText(hash, text) {
        const input = String(text == null ? '' : text);
        let next = hash >>> 0;
        for (let index = 0; index < input.length; index += 1) {
            next ^= input.charCodeAt(index);
            next = Math.imul(next, 16777619) >>> 0;
        }
        return next >>> 0;
    }

    function hashJson(value, hash = HASH_SEED) {
        if (value == null) return hashText(hash, '');
        if (Array.isArray(value)) {
            const listHash = value.reduce((next, item) => hashJson(item, next), hashText(hash, '['));
            return hashText(listHash, ']');
        }
        if (typeof value === 'object') {
            return Object.keys(value).sort().reduce((next, key) => {
                const withKey = hashText(next, `${key}:`);
                return hashJson(value[key], withKey);
            }, hashText(hash, '{'));
        }
        return hashText(hash, String(value));
    }

    function hashRows(rows, subjects) {
        const list = Array.isArray(rows) ? rows : [];
        const subjectList = Array.isArray(subjects) ? subjects : [];
        let hash = HASH_SEED;
        list.forEach((row, index) => {
            hash = hashText(hash, `${index}|${normalizeText(row && row.school)}|${normalizeText(row && row.class)}|${normalizeName(row && row.name)}|${normalizeText(row && (row.id || row.examNo || row.studentId))}|${toNumber(row && row.total, NaN)}`);
            subjectList.forEach((subject) => {
                hash = hashText(hash, `|${normalizeText(subject)}=${toNumber(row && row.scores && row.scores[subject], NaN)}`);
            });
        });
        return (hash >>> 0).toString(36);
    }

    function getDataState(source = {}) {
        const snapshot = root.DataState && typeof root.DataState.snapshotDataState === 'function'
            ? root.DataState.snapshotDataState()
            : {};
        const thresholdMetadata = source.THRESHOLD_METADATA && typeof source.THRESHOLD_METADATA === 'object'
            ? source.THRESHOLD_METADATA
            : (source.thresholdMetadata && typeof source.thresholdMetadata === 'object'
                ? source.thresholdMetadata
                : (snapshot.thresholdMetadata || root.THRESHOLD_METADATA || {}));
        return {
            rows: Array.isArray(source.RAW_DATA) ? source.RAW_DATA : (Array.isArray(source.rawData) ? source.rawData : (Array.isArray(snapshot.rawData) ? snapshot.rawData : (root.RAW_DATA || []))),
            schools: source.SCHOOLS && typeof source.SCHOOLS === 'object' ? source.SCHOOLS : (source.schools && typeof source.schools === 'object' ? source.schools : (snapshot.schools || root.SCHOOLS || {})),
            subjects: Array.isArray(source.SUBJECTS) ? source.SUBJECTS : (Array.isArray(source.subjects) ? source.subjects : (Array.isArray(snapshot.subjects) ? snapshot.subjects : (root.SUBJECTS || []))),
            thresholds: source.THRESHOLDS && typeof source.THRESHOLDS === 'object' ? source.THRESHOLDS : (source.thresholds && typeof source.thresholds === 'object' ? source.thresholds : (snapshot.thresholds || root.THRESHOLDS || {})),
            thresholdMetadata,
            config: source.CONFIG && typeof source.CONFIG === 'object' ? source.CONFIG : (source.config && typeof source.config === 'object' ? source.config : (snapshot.config || root.CONFIG || {}))
        };
    }

    function getCurrentSchoolName() {
        if (root.SchoolState && typeof root.SchoolState.getCurrentSchool === 'function') {
            return normalizeText(root.SchoolState.getCurrentSchool());
        }
        return normalizeText(root.MY_SCHOOL || (root.localStorage && root.localStorage.getItem('MY_SCHOOL')) || '');
    }

    function sameSchoolName(left, right) {
        const leftName = normalizeText(left);
        const rightName = normalizeText(right);
        if (!leftName || !rightName) return false;
        if (root.PermissionPolicy && typeof root.PermissionPolicy.sameSchoolName === 'function') {
            return root.PermissionPolicy.sameSchoolName(leftName, rightName);
        }
        if (typeof root.areSchoolNamesEquivalent === 'function') {
            return root.areSchoolNamesEquivalent(leftName, rightName);
        }
        return leftName === rightName;
    }

    function getTeacherMap() {
        if (root.TeacherState && typeof root.TeacherState.getTeacherMap === 'function') {
            return root.TeacherState.getTeacherMap();
        }
        return root.TEACHER_MAP && typeof root.TEACHER_MAP === 'object' ? { ...root.TEACHER_MAP } : {};
    }

    function getTeacherSchoolMap() {
        if (root.TeacherState && typeof root.TeacherState.getTeacherSchoolMap === 'function') {
            return root.TeacherState.getTeacherSchoolMap();
        }
        return root.TEACHER_SCHOOL_MAP && typeof root.TEACHER_SCHOOL_MAP === 'object' ? { ...root.TEACHER_SCHOOL_MAP } : {};
    }

    function buildProcessSignature(source = {}) {
        const data = getDataState(source);
        const schoolKeys = Object.keys(data.schools || {}).sort();
        const townshipNames = Array.isArray(source.TOWNSHIP_SCHOOL_NAMES)
            ? source.TOWNSHIP_SCHOOL_NAMES.map(normalizeText).filter(Boolean).sort()
            : [];
        let hash = HASH_SEED;
        hash = hashText(hash, `rows:${data.rows.length}:${hashRows(data.rows, data.subjects)}`);
        hash = hashText(hash, `subjects:${data.subjects.map(normalizeText).join('|')}`);
        hash = hashText(hash, `schools:${schoolKeys.join('|')}`);
        hash = hashText(hash, `township:${townshipNames.join('|')}`);
        hash = hashText(hash, `config:${normalizeText(data.config && data.config.name)}:${normalizeText(data.config && data.config.grade)}:${normalizeText(root.CURRENT_EXAM_ID || '')}:${normalizeText(root.CURRENT_TERM_ID || '')}`);
        hash = hashJson(data.thresholds, hash);
        return `ak:${data.rows.length}:${schoolKeys.length}:${(hash >>> 0).toString(36)}`;
    }

    function cloneData(value) {
        if (value == null) return value;
        if (typeof root.structuredClone === 'function') {
            try {
                return root.structuredClone(value);
            } catch {
                // fall through to JSON clone
            }
        }
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return value;
        }
    }

    function getProcessResult(signature) {
        const key = normalizeText(signature);
        if (!key || !state.processCache.has(key)) return null;
        return cloneData(state.processCache.get(key));
    }

    function setProcessResult(signature, result) {
        const key = normalizeText(signature);
        if (!key || !result) return null;
        state.processCache.set(key, cloneData(result));
        state.processOrder = state.processOrder.filter((item) => item !== key);
        state.processOrder.push(key);
        while (state.processOrder.length > PROCESS_CACHE_LIMIT) {
            const stale = state.processOrder.shift();
            if (stale) state.processCache.delete(stale);
        }
        return result;
    }

    function buildClassSchoolCandidates(rows) {
        const map = new Map();
        (Array.isArray(rows) ? rows : []).forEach((student) => {
            const cls = normalizeClassName(student && student.class);
            const school = normalizeText(student && student.school);
            if (!cls || !school) return;
            if (!map.has(cls)) map.set(cls, new Set());
            map.get(cls).add(school);
        });
        return map;
    }

    function inferTeacherSchool(teacherMap, rows) {
        const currentSchool = getCurrentSchoolName();
        const teacherSchoolMap = getTeacherSchoolMap();
        const explicitValues = Object.values(teacherSchoolMap).map(normalizeText).filter(Boolean);
        if (explicitValues.length) return currentSchool || explicitValues[0] || '';
        const candidates = buildClassSchoolCandidates(rows);
        const counts = new Map();
        Object.keys(teacherMap || {}).forEach((key) => {
            const cls = normalizeClassName(String(key || '').split('_')[0]);
            if (!cls || !candidates.has(cls)) return;
            candidates.get(cls).forEach((school) => {
                counts.set(school, (counts.get(school) || 0) + 1);
            });
        });
        return Array.from(counts.entries()).sort((left, right) => {
            if (right[1] !== left[1]) return right[1] - left[1];
            if (sameSchoolName(left[0], currentSchool)) return -1;
            if (sameSchoolName(right[0], currentSchool)) return 1;
            return String(left[0]).localeCompare(String(right[0]), 'zh-CN', { numeric: true });
        })[0]?.[0] || currentSchool || '';
    }

    function getScopedTeacherAssignments() {
        const teacherMap = getTeacherMap();
        const teacherSchoolMap = getTeacherSchoolMap();
        const currentSchool = getCurrentSchoolName();
        const schoolValues = Object.values(teacherSchoolMap).map(normalizeText).filter(Boolean);
        if (!currentSchool || !schoolValues.length) {
            return { map: teacherMap, schoolMap: teacherSchoolMap, schoolName: currentSchool, scoped: false };
        }
        const scopedMap = {};
        const scopedSchoolMap = {};
        Object.entries(teacherMap).forEach(([key, teacherName]) => {
            if (!sameSchoolName(teacherSchoolMap[key], currentSchool)) return;
            scopedMap[key] = teacherName;
            scopedSchoolMap[key] = teacherSchoolMap[key];
        });
        return { map: scopedMap, schoolMap: scopedSchoolMap, schoolName: currentSchool, scoped: true };
    }

    function resolveSubjectThreshold(subject, kind, scores, thresholds) {
        if (root.ThresholdRuntime && typeof root.ThresholdRuntime.resolveSubjectThreshold === 'function') {
            return root.ThresholdRuntime.resolveSubjectThreshold(subject, kind, scores, {
                thresholds,
                sourceLabel: '当前数据范围按比例划线'
            }).value;
        }
        const subjectKey = normalizeText(subject);
        const normalizedKey = normalizeSubjectName(subject);
        const config = thresholds?.[subjectKey] || thresholds?.[normalizedKey] || {};
        const direct = kind === 'excellent'
            ? (config.excellent ?? config.exc ?? config.good)
            : (config.pass ?? config.passLine);
        const directNumber = Number(direct);
        if (Number.isFinite(directNumber) && directNumber > 0) return directNumber;
        const sorted = (scores || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        if (!sorted.length) return Number.POSITIVE_INFINITY;
        const ratio = kind === 'excellent' ? 0.85 : 0.6;
        return sorted[Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * ratio)))];
    }

    function summarizeScores(subject, students, thresholds) {
        const scores = (students || [])
            .map((student) => Number(student && student.scores && student.scores[subject]))
            .filter(Number.isFinite);
        const count = scores.length;
        const avg = count ? scores.reduce((sum, score) => sum + score, 0) / count : 0;
        const excellentLine = resolveSubjectThreshold(subject, 'excellent', scores, thresholds);
        const passLine = resolveSubjectThreshold(subject, 'pass', scores, thresholds);
        return {
            count,
            avg,
            excellentRate: count ? scores.filter((score) => score >= excellentLine).length / count : 0,
            passRate: count ? scores.filter((score) => score >= passLine).length / count : 0
        };
    }

    function makeStudentIdentity(student) {
        return [
            normalizeText(student && student.school),
            normalizeClassName(student && student.class),
            normalizeName(student && student.name),
            normalizeText(student && (student.id || student.examNo || student.studentId))
        ].join('__');
    }

    function buildTeacherStats(rows, subjects, thresholds) {
        const scoped = getScopedTeacherAssignments();
        const teacherMap = scoped.map || {};
        const teacherSchool = scoped.scoped ? scoped.schoolName : inferTeacherSchool(teacherMap, rows);
        const subjectList = Array.isArray(subjects) ? subjects : [];
        const schoolRows = teacherSchool
            ? (rows || []).filter((student) => sameSchoolName(student && student.school, teacherSchool))
            : (rows || []);
        const subjectByNormalized = new Map(
            subjectList.map((subject) => [normalizeSubjectName(subject), subject])
        );
        const rowsByClassSubject = new Map();
        schoolRows.forEach((student) => {
            const className = normalizeClassName(student && student.class);
            if (!className || !student || !student.scores) return;
            Object.keys(student.scores || {}).forEach((rawSubject) => {
                if (!Number.isFinite(Number(student.scores[rawSubject]))) return;
                const subjectKey = normalizeSubjectName(rawSubject);
                if (!subjectKey) return;
                const key = `${className}__${subjectKey}`;
                if (!rowsByClassSubject.has(key)) rowsByClassSubject.set(key, []);
                rowsByClassSubject.get(key).push(student);
            });
        });
        const stats = {};
        Object.entries(teacherMap).forEach(([key, teacherName]) => {
            const parts = String(key || '').split('_');
            const className = normalizeClassName(parts[0]);
            const rawSubject = parts.slice(1).join('_');
            const subjectKey = normalizeSubjectName(rawSubject);
            const subject = subjectByNormalized.get(subjectKey) || rawSubject;
            if (!teacherName || !className || !subject) return;
            const students = rowsByClassSubject.get(`${className}__${subjectKey}`) || [];
            if (!students.length) return;
            if (!stats[teacherName]) stats[teacherName] = {};
            if (!stats[teacherName][subject]) {
                stats[teacherName][subject] = { classes: [], students: [], subject };
            }
            stats[teacherName][subject].classes.push(className);
            stats[teacherName][subject].students.push(...students);
        });
        Object.values(stats).forEach((subjectMap) => {
            Object.values(subjectMap || {}).forEach((data) => {
                const uniqueStudents = new Map();
                (data.students || []).forEach((student) => {
                    uniqueStudents.set(makeStudentIdentity(student), student);
                });
                data.students = Array.from(uniqueStudents.values());
                data.classes = [...new Set((data.classes || []).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
                const summary = summarizeScores(data.subject, data.students, thresholds);
                data.studentCount = summary.count;
                data.count = summary.count;
                data.avgValue = summary.avg;
                data.avg = summary.avg;
                data.excellentRate = summary.excellentRate;
                data.passRate = summary.passRate;
                data.fairScore = summary.avg;
            });
        });
        return {
            schoolName: teacherSchool,
            rows: stats
        };
    }

    function buildSnapshot(options = {}) {
        const data = getDataState(options);
        const signature = [
            buildProcessSignature(data),
            `teacher:${getCurrentSchoolName()}:${hashJson(getTeacherMap()).toString(36)}:${hashJson(getTeacherSchoolMap()).toString(36)}`
        ].join('::');
        if (!options.force && state.snapshot && state.snapshotSignature === signature) {
            return state.snapshot;
        }

        const rows = Array.isArray(data.rows) ? data.rows : [];
        const subjects = Array.isArray(data.subjects) ? data.subjects : [];
        const studentIndex = root.RankingDataService && typeof root.RankingDataService.getStudentIndex === 'function'
            ? root.RankingDataService.getStudentIndex(rows)
            : null;
        const teacherStats = buildTeacherStats(rows, subjects, data.thresholds || {});
        const snapshot = {
            version: 1,
            signature,
            rawDataCount: rows.length,
            schoolCount: Object.keys(data.schools || {}).length,
            subjectCount: subjects.length,
            rows,
            schools: data.schools || {},
            subjects,
            thresholds: data.thresholds || {},
            thresholdMetadata: data.thresholdMetadata || {},
            config: data.config || {},
            studentIndex,
            teacherStats: teacherStats.rows,
            teacherSchoolName: teacherStats.schoolName,
            createdAt: Date.now()
        };
        state.snapshotSignature = signature;
        state.snapshot = snapshot;
        root.AnalyticsSnapshot = snapshot;
        return snapshot;
    }

    function getSnapshot(options = {}) {
        return buildSnapshot(options);
    }

    function invalidate(options = {}) {
        state.snapshotSignature = '';
        state.snapshot = null;
        if (!options.keepProcessCache) {
            state.processCache.clear();
            state.processOrder = [];
        }
        if (root.AnalyticsSnapshot) root.AnalyticsSnapshot = null;
    }

    return {
        buildProcessSignature,
        getProcessResult,
        setProcessResult,
        getSnapshot,
        buildSnapshot,
        invalidate,
        normalizeText,
        normalizeClassName,
        normalizeSubjectName,
        inferGradeNumber,
        getSubjectFullScore,
        getSubjectFullScoreMap,
        getTotalFullScore,
        isScoreAboveSubjectFullScore,
        getSubjectFullScoreRules
    };
});
