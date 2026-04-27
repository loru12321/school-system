function normalizeTeacherName(name) {
    return String(name || '').trim().replace(/\s+/g, '');
}

function getTeacherScopeForUser(user) {
    const scope = { classes: new Set(), subjects: new Set() };
    if (!user || !window.TEACHER_MAP) {
        console.warn('[权限检查] TEACHER_MAP 未加载或用户未登录');
        return scope;
    }

    const uname = normalizeTeacherName(user.name);
    appDebug(`[权限检查] 检查教师: ${user.name} (规范化: ${uname})`);
    appDebug('[权限检查] TEACHER_MAP内容:', TEACHER_MAP);

    Object.entries(TEACHER_MAP).forEach(([key, teacher]) => {
        const normalizedTeacher = normalizeTeacherName(teacher);
        if (normalizedTeacher === uname) {
            const parts = key.split('_');
            const cls = normalizeClass(parts[0]);
            const sub = normalizeSubject(parts[1] || '');
            appDebug(`[权限检查] ✅ 匹配到任课: ${key} -> 班级:${cls}, 科目:${sub}`);
            if (cls) scope.classes.add(cls);
            if (sub) scope.subjects.add(sub);
        }
    });

    appDebug(`[权限检查] 该教师任教班级:`, Array.from(scope.classes));
    appDebug(`[权限检查] 该教师任教科目:`, Array.from(scope.subjects));
    return scope;
}


function buildClassTeacherStatsForClass(className) {
    const stats = {};
    const mySchoolData = SCHOOLS[MY_SCHOOL];
    if (!mySchoolData || !className) return stats;
    Object.entries(TEACHER_MAP || {}).forEach(([key, teacherName]) => {
        const [rawClass, rawSubject] = key.split('_');
        const cls = normalizeClass(rawClass);
        if (cls !== className) return;
        const subject = normalizeSubject(rawSubject);
        const useSubject = SUBJECTS.find(s => normalizeSubject(s) === subject) || subject;
        if (!useSubject) return;
        if (!stats[teacherName]) stats[teacherName] = {};
        const students = mySchoolData.students.filter(s => s.class === cls && s.scores[useSubject] !== undefined);
        const gs = { exc: THRESHOLDS[useSubject]?.exc || 0, pass: THRESHOLDS[useSubject]?.pass || 0, low: (THRESHOLDS[useSubject]?.pass || 60) * 0.6 };
        const totalScore = students.reduce((sum, s) => sum + s.scores[useSubject], 0);
        const avg = students.length ? (totalScore / students.length).toFixed(2) : '0.00';
        const excellentCount = students.filter(s => s.scores[useSubject] >= gs.exc).length;
        const passCount = students.filter(s => s.scores[useSubject] >= gs.pass).length;
        const lowCount = students.filter(s => s.scores[useSubject] < gs.low).length;
        stats[teacherName][useSubject] = {
            classes: className,
            students: [],
            totalScore,
            avg,
            studentCount: students.length,
            excellentCount,
            passCount,
            lowCount,
            excellentRate: students.length ? excellentCount / students.length : 0,
            passRate: students.length ? passCount / students.length : 0,
            lowRate: students.length ? lowCount / students.length : 0,
            contribution: 0,
            finalScore: 0
        };
    });
    return stats;
}

function getVisibleSubjectsForTeacherUser(user) {
    const role = user?.role || 'guest';
    const set = new Set();
    if (!(role === 'teacher' || role === 'class_teacher')) {
        (SUBJECTS || []).forEach(s => set.add(normalizeSubject(s)));
        return set;
    }

    // 班主任：可看“本班所有学科” + 自己任教学科
    if (role === 'class_teacher') {
        const myClass = normalizeClass(user?.class || '');

        // 1) 从任课表提取本班学科
        Object.keys(TEACHER_MAP || {}).forEach(key => {
            const [rawClass, rawSubject] = String(key || '').split('_');
            if (normalizeClass(rawClass) === myClass) {
                const sub = normalizeSubject(rawSubject || '');
                if (sub) set.add(sub);
            }
        });

        // 2) 兜底：从学生成绩提取本班学科
        const classRows = (RAW_DATA || []).filter(s => normalizeClass(s?.class) === myClass);
        classRows.forEach(s => {
            Object.keys(s?.scores || {}).forEach(sub => {
                const nsub = normalizeSubject(sub);
                if (nsub) set.add(nsub);
            });
        });
    }

    const scope = getTeacherScopeForUser(user);
    (scope.subjects || new Set()).forEach(s => set.add(normalizeSubject(s)));

    const normalizedName = normalizeTeacherName(user?.name || '').toLowerCase();
    if (!normalizedName) return set;

    Object.entries(TEACHER_STATS || {}).forEach(([teacherName, subMap]) => {
        const tNorm = normalizeTeacherName(teacherName).toLowerCase();
        if (tNorm === normalizedName || tNorm.startsWith(normalizedName + '(') || tNorm.startsWith(normalizedName + '（')) {
            Object.keys(subMap || {}).forEach(sub => set.add(normalizeSubject(sub)));
        }
    });

    return set;
}

function getVisibleTeacherStats() {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const scopedStats = PermissionPolicy.filterTeacherStats(user, TEACHER_STATS || {}, MY_SCHOOL);
    if (role === 'teacher' || role === 'class_teacher') {
        const allStats = scopedStats;
        const filtered = {};
        if (Object.keys(allStats).length === 0) return filtered;

        const visibleSubjects = getVisibleSubjectsForTeacherUser(user);

        if (visibleSubjects.size === 0) {
            if (role === 'class_teacher') {
                return buildClassTeacherStatsForClass(user?.class);
            }
            const normalizedName = String(user?.name || '').replace(/\s+/g, '').toLowerCase();
            Object.keys(allStats).forEach(k => {
                const keyNorm = String(k || '').replace(/\s+/g, '').toLowerCase();
                if (keyNorm === normalizedName || keyNorm.startsWith(normalizedName + '(') || keyNorm.startsWith(normalizedName + '（')) {
                    filtered[k] = allStats[k];
                }
            });
            return filtered;
        }

        Object.entries(allStats).forEach(([teacherName, subMap]) => {
            const matchedSubjects = {};
            Object.entries(subMap || {}).forEach(([subject, dataItem]) => {
                if (visibleSubjects.has(normalizeSubject(subject))) {
                    matchedSubjects[subject] = dataItem;
                }
            });
            if (Object.keys(matchedSubjects).length > 0) {
                filtered[teacherName] = matchedSubjects;
            }
        });

        return filtered;
    }
    return scopedStats;
}

