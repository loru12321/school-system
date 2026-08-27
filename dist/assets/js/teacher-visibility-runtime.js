function normalizeTeacherName(name) {
    return String(name || '').trim().replace(/\s+/g, '');
}

function getTeacherVisibilitySchoolMap() {
    if (window.TEACHER_SCHOOL_MAP && typeof window.TEACHER_SCHOOL_MAP === 'object') return window.TEACHER_SCHOOL_MAP;
    if (typeof TEACHER_SCHOOL_MAP !== 'undefined' && TEACHER_SCHOOL_MAP && typeof TEACHER_SCHOOL_MAP === 'object') return TEACHER_SCHOOL_MAP;
    return {};
}

function normalizeTeacherVisibilitySchool(value) {
    return String(value || '').trim();
}

function sameTeacherVisibilitySchool(left, right) {
    const leftName = normalizeTeacherVisibilitySchool(left);
    const rightName = normalizeTeacherVisibilitySchool(right);
    if (!leftName || !rightName) return false;
    if (window.PermissionPolicy && typeof window.PermissionPolicy.sameSchoolName === 'function') {
        return window.PermissionPolicy.sameSchoolName(leftName, rightName);
    }
    if (typeof areSchoolNamesEquivalent === 'function') return areSchoolNamesEquivalent(leftName, rightName);
    return leftName === rightName;
}

function getTeacherVisibilityBoundSchool(user) {
    const candidates = [
        user?.school,
        typeof readCurrentSchool === 'function' ? readCurrentSchool() : '',
        window.MY_SCHOOL,
        typeof MY_SCHOOL !== 'undefined' ? MY_SCHOOL : '',
        window.localStorage && typeof window.localStorage.getItem === 'function' ? window.localStorage.getItem('MY_SCHOOL') : ''
    ];
    return normalizeTeacherVisibilitySchool(candidates.find(value => normalizeTeacherVisibilitySchool(value)) || '');
}

function getTeacherVisibilityHomeroomClass(user) {
    if (window.PermissionPolicy && typeof window.PermissionPolicy.getHomeroomClass === 'function') {
        return window.PermissionPolicy.getHomeroomClass(user);
    }
    return normalizeClass(user?.class_name || user?.class || '');
}

function hasTeacherVisibilityRole(user, roleName) {
    if (window.PermissionPolicy && typeof window.PermissionPolicy.hasQueryRole === 'function') {
        return window.PermissionPolicy.hasQueryRole(user, roleName);
    }
    if (Array.isArray(user?.roles)) return user.roles.includes(roleName);
    return user?.role === roleName;
}

function isTeacherAssignmentVisibleForSchool(key, schoolName) {
    const targetSchool = normalizeTeacherVisibilitySchool(schoolName);
    if (!targetSchool) return true;
    const explicitSchool = normalizeTeacherVisibilitySchool(getTeacherVisibilitySchoolMap()[key]);
    return !explicitSchool || sameTeacherVisibilitySchool(explicitSchool, targetSchool);
}

function resolveTeacherVisibilitySchoolData(schoolName) {
    const targetSchool = normalizeTeacherVisibilitySchool(schoolName);
    const schools = window.SCHOOLS || {};
    if (!targetSchool) return null;
    if (schools[targetSchool]) return schools[targetSchool];
    const entry = Object.entries(schools || {}).find(([key, schoolData]) => (
        sameTeacherVisibilitySchool(key, targetSchool)
        || sameTeacherVisibilitySchool(schoolData?.name, targetSchool)
    ));
    return entry?.[1] || null;
}

function getTeacherScopeForUser(user) {
    const scope = { classes: new Set(), subjects: new Set() };
    if (!user || !window.TEACHER_MAP) {
        console.warn('[权限检查] TEACHER_MAP 未加载或用户未登录');
        return scope;
    }

    const displayName = user.teacher_name || user.name || user.username || '';
    const uname = normalizeTeacherName(displayName);
    appDebug(`[权限检查] 检查教师: ${displayName} (规范化: ${uname})`);
    appDebug('[权限检查] TEACHER_MAP内容:', TEACHER_MAP);

    const boundSchool = getTeacherVisibilityBoundSchool(user);
    Object.entries(TEACHER_MAP).forEach(([key, teacher]) => {
        const normalizedTeacher = normalizeTeacherName(teacher);
        if (normalizedTeacher === uname) {
            if (!isTeacherAssignmentVisibleForSchool(key, boundSchool)) return;
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
    const boundSchool = getTeacherVisibilityBoundSchool(typeof getCurrentUser === 'function' ? getCurrentUser() : null) || normalizeTeacherVisibilitySchool(MY_SCHOOL);
    const mySchoolData = resolveTeacherVisibilitySchoolData(boundSchool);
    const sourceStudents = Array.isArray(mySchoolData?.students)
        ? mySchoolData.students
        : (RAW_DATA || []).filter(s => !boundSchool || sameTeacherVisibilitySchool(s?.school, boundSchool));
    if (!sourceStudents.length || !className) return stats;
    Object.entries(TEACHER_MAP || {}).forEach(([key, teacherName]) => {
        if (!isTeacherAssignmentVisibleForSchool(key, boundSchool)) return;
        const [rawClass, rawSubject] = key.split('_');
        const cls = normalizeClass(rawClass);
        if (cls !== className) return;
        const subject = normalizeSubject(rawSubject);
        const useSubject = SUBJECTS.find(s => normalizeSubject(s) === subject) || subject;
        if (!useSubject) return;
        if (!stats[teacherName]) stats[teacherName] = {};
        const students = sourceStudents.filter(s => normalizeClass(s.class) === cls && s.scores[useSubject] !== undefined);
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
    const isTeacherUser = hasTeacherVisibilityRole(user, 'teacher');
    const isClassTeacherUser = hasTeacherVisibilityRole(user, 'class_teacher');
    const set = new Set();
    if (!(isTeacherUser || isClassTeacherUser)) {
        (SUBJECTS || []).forEach(s => set.add(normalizeSubject(s)));
        return set;
    }

    // 班主任：可看“本班所有学科” + 自己任教学科
    if (isClassTeacherUser) {
        const myClass = getTeacherVisibilityHomeroomClass(user);
        const boundSchool = getTeacherVisibilityBoundSchool(user);

        // 1) 从任课表提取本班学科
        Object.keys(TEACHER_MAP || {}).forEach(key => {
            if (!isTeacherAssignmentVisibleForSchool(key, boundSchool)) return;
            const [rawClass, rawSubject] = String(key || '').split('_');
            if (normalizeClass(rawClass) === myClass) {
                const sub = normalizeSubject(rawSubject || '');
                if (sub) set.add(sub);
            }
        });

        // 2) 兜底：从学生成绩提取本班学科
        const classRows = (RAW_DATA || []).filter(s => (
            normalizeClass(s?.class) === myClass
            && (!boundSchool || sameTeacherVisibilitySchool(s?.school, boundSchool))
        ));
        classRows.forEach(s => {
            Object.keys(s?.scores || {}).forEach(sub => {
                const nsub = normalizeSubject(sub);
                if (nsub) set.add(nsub);
            });
        });
    }

    const scope = getTeacherScopeForUser(user);
    (scope.subjects || new Set()).forEach(s => set.add(normalizeSubject(s)));

    const normalizedName = normalizeTeacherName(user?.teacher_name || user?.name || user?.username || '').toLowerCase();
    if (!normalizedName) return set;

    Object.entries(TEACHER_STATS || {}).forEach(([teacherName, subMap]) => {
        const tNorm = normalizeTeacherName(teacherName).toLowerCase();
        if (tNorm === normalizedName || tNorm.startsWith(normalizedName + '(') || tNorm.startsWith(normalizedName + '（')) {
            Object.entries(subMap || {}).forEach(([sub, dataItem]) => {
                const boundSchool = getTeacherVisibilityBoundSchool(user);
                if (boundSchool
                    && window.PermissionPolicy
                    && typeof window.PermissionPolicy.canQueryTeacherMetric === 'function'
                    && !window.PermissionPolicy.canQueryTeacherMetric(user, teacherName, dataItem, boundSchool)) {
                    return;
                }
                set.add(normalizeSubject(sub));
            });
        }
    });

    return set;
}

function getVisibleTeacherStats() {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const isTeacherUser = hasTeacherVisibilityRole(user, 'teacher');
    const isClassTeacherUser = hasTeacherVisibilityRole(user, 'class_teacher');
    const scopedStats = PermissionPolicy.filterTeacherStats(user, TEACHER_STATS || {}, MY_SCHOOL);
    if (isTeacherUser || isClassTeacherUser) {
        const allStats = scopedStats;
        const filtered = {};
        if (Object.keys(allStats).length === 0) return filtered;

        const visibleSubjects = getVisibleSubjectsForTeacherUser(user);

        if (visibleSubjects.size === 0) {
            if (isClassTeacherUser) {
                return buildClassTeacherStatsForClass(getTeacherVisibilityHomeroomClass(user));
            }
            const normalizedName = String(user?.teacher_name || user?.name || user?.username || '').replace(/\s+/g, '').toLowerCase();
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
