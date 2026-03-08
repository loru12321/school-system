(function() {
    function getNormalizeClass() {
        return typeof window.normalizeClass === 'function'
            ? window.normalizeClass
            : (value) => String(value || '').trim();
    }

    function getExamCatalog() {
        return window.ExamCatalog || {};
    }

    function getCohortDb() {
        if (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.ensure === 'function') {
            return window.CohortDB.ensure();
        }
        return window.COHORT_DB || null;
    }

    function normalizeSchoolName(name) {
        return String(name || '')
            .replace(/\s+/g, '')
            .replace(/[()（）\-—·]/g, '')
            .trim();
    }

    function filterRowsBySchool(rows, school) {
        const key = normalizeSchoolName(school);
        return (rows || []).filter(row => normalizeSchoolName(row?.school) === key);
    }

    function listAvailableSchools(options) {
        const opts = options || {};
        const names = new Set();
        const db = opts.db || getCohortDb();
        const teacherSchoolMap = opts.teacherSchoolMap || window.TEACHER_SCHOOL_MAP || {};
        const schoolMap = opts.schools || window.SCHOOLS || {};
        const rawData = Array.isArray(opts.rawData) ? opts.rawData : (window.RAW_DATA || []);
        const persistedSchool = String(opts.persistedSchool || localStorage.getItem('MY_SCHOOL') || '').trim();
        const runtimeSchool = String(opts.runtimeSchool || window.MY_SCHOOL || '').trim();

        Object.keys(schoolMap).forEach(name => {
            const school = String(name || '').trim();
            if (school) names.add(school);
        });

        rawData.forEach(row => {
            const school = String(row?.school || '').trim();
            if (school) names.add(school);
        });

        Object.values(teacherSchoolMap).forEach(name => {
            const school = String(name || '').trim();
            if (school) names.add(school);
        });

        if (persistedSchool) names.add(persistedSchool);
        if (runtimeSchool) names.add(runtimeSchool);

        if (db?.exams) {
            Object.values(db.exams).forEach(exam => {
                (exam?.data || []).forEach(row => {
                    const school = String(row?.school || '').trim();
                    if (school) names.add(school);
                });
            });
        }

        const blockList = ['教育局', '教体局', '市局', '区局', '市直局', '区直局', 'admin', '测试', '默认'];
        return [...names]
            .filter(name => {
                if (!name) return false;
                if (/^Sheet\d+$/i.test(name)) return false;
                return !blockList.some(blocked => name.includes(blocked) || name.toLowerCase() === blocked);
            })
            .sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    function getClassSchoolMap(options) {
        const opts = options || {};
        const normalizeClass = getNormalizeClass();
        const map = {};
        const db = opts.db || getCohortDb();
        const teacherSchoolMap = opts.teacherSchoolMap || window.TEACHER_SCHOOL_MAP || {};
        const schoolMap = opts.schools || window.SCHOOLS || {};
        const rawData = Array.isArray(opts.rawData) ? opts.rawData : (window.RAW_DATA || []);

        Object.entries(teacherSchoolMap).forEach(([key, school]) => {
            const cls = normalizeClass(String(key || '').split('_')[0]);
            const sch = String(school || '').trim();
            if (cls && sch) map[cls] = sch;
        });

        Object.entries(schoolMap).forEach(([school, payload]) => {
            (payload?.students || []).forEach(student => {
                const cls = normalizeClass(student?.class);
                if (cls && school && !map[cls]) map[cls] = school;
            });
        });

        rawData.forEach(row => {
            const school = String(row?.school || '').trim();
            const cls = normalizeClass(row?.class);
            if (cls && school && !map[cls]) map[cls] = school;
        });

        if (db?.exams) {
            Object.values(db.exams).forEach(exam => {
                (exam?.data || []).forEach(row => {
                    const school = String(row?.school || '').trim();
                    const cls = normalizeClass(row?.class);
                    if (cls && school && !map[cls]) map[cls] = school;
                });
            });
        }

        return map;
    }

    function inferDefaultSchool(options) {
        const opts = options || {};
        const saved = String(opts.runtimeSchool || window.MY_SCHOOL || localStorage.getItem('MY_SCHOOL') || '').trim();
        if (saved) return saved;
        const schoolList = listAvailableSchools(opts);
        return schoolList.length === 1 ? schoolList[0] : '';
    }

    function buildComparableRows(rawRows) {
        const rows = (rawRows || []).filter(row => row.name && row.school && Number.isFinite(Number(row.total)));
        const bySchool = {};
        rows.forEach(row => {
            if (!bySchool[row.school]) bySchool[row.school] = [];
            bySchool[row.school].push(row);
        });

        Object.values(bySchool).forEach(list => {
            list.sort((a, b) => b.total - a.total);
            list.forEach((row, index) => {
                if (index > 0 && Math.abs(row.total - list[index - 1].total) < 0.001) {
                    row.rankSchool = list[index - 1].rankSchool;
                } else {
                    row.rankSchool = index + 1;
                }
            });
        });

        return rows;
    }

    function getExamRowsForCompare(examId, options) {
        const opts = options || {};
        if (!examId) return [];

        const examCatalog = getExamCatalog();
        const cohortId = opts.cohortId || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
        const currentExamId = String(opts.currentExamId || window.CURRENT_EXAM_ID || '').trim();
        const currentRawData = Array.isArray(opts.rawData) ? opts.rawData : (window.RAW_DATA || []);
        const currentSubjects = Array.isArray(opts.subjects) ? opts.subjects : (window.SUBJECTS || []);
        const db = opts.db || getCohortDb();
        const normalizeClass = getNormalizeClass();

        if (examCatalog && typeof examCatalog.isSelectableExamKey === 'function' && !examCatalog.isSelectableExamKey(examId, cohortId)) {
            return [];
        }

        let rawRows = [];
        if (examId === currentExamId) {
            rawRows = currentRawData.map(student => ({
                name: student.name,
                school: student.school,
                class: normalizeClass(student.class),
                total: Number.isFinite(Number(student.total)) ? Number(student.total) : NaN,
                scores: student.scores || {}
            }));
        } else {
            const exam = db?.exams?.[examId];
            const list = exam?.data || [];
            const examSubjects = Array.isArray(exam?.subjects) && exam.subjects.length
                ? exam.subjects
                : currentSubjects;

            rawRows = list.map(student => {
                const scores = student.scores || {};
                let total = student.total;
                if (!Number.isFinite(Number(total))) {
                    const baseSubjects = examSubjects.length ? examSubjects : Object.keys(scores || {});
                    const values = baseSubjects.map(subject => parseFloat(scores[subject])).filter(value => !isNaN(value));
                    total = values.length ? values.reduce((sum, value) => sum + value, 0) : NaN;
                } else {
                    total = Number(total);
                }

                return {
                    name: student.name,
                    school: student.school,
                    class: normalizeClass(student.class),
                    total,
                    scores
                };
            });
        }

        return buildComparableRows(rawRows);
    }

    window.CompareDataService = {
        normalizeSchoolName,
        filterRowsBySchool,
        listAvailableSchools,
        getClassSchoolMap,
        inferDefaultSchool,
        getExamRowsForCompare
    };
})();