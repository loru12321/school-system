const QUERY_MODULE_ACCESS = {
    admin: ['*'],
    director: ['starter-hub', 'upload', 'county-analysis', 'teacher-analysis', 'indicator', 'bottom3', 'marginal-push', 'progress-analysis', 'report-generator', 'freshman-simulator', 'exam-arranger', 'student-overview', 'student-details', 'subject-balance', 'potential-analysis', 'segment-analysis', 'correlation-analysis', 'class-diagnosis', 'zhongkao-countdown', 'ai-analysis', 'app-download-center'],
    grade_director: ['starter-hub', 'county-analysis', 'teacher-analysis', 'indicator', 'bottom3', 'marginal-push', 'progress-analysis', 'report-generator', 'student-overview', 'student-details', 'subject-balance', 'potential-analysis', 'segment-analysis', 'correlation-analysis', 'class-diagnosis', 'zhongkao-countdown', 'ai-analysis', 'app-download-center'],
    class_teacher: ['starter-hub', 'student-overview', 'student-details', 'county-analysis', 'teacher-analysis', 'progress-analysis', 'subject-balance', 'potential-analysis', 'segment-analysis', 'correlation-analysis', 'class-diagnosis', 'marginal-push', 'report-generator', 'zhongkao-countdown', 'ai-analysis', 'app-download-center'],
    teacher: ['starter-hub', 'student-overview', 'student-details', 'county-analysis', 'teacher-analysis', 'progress-analysis', 'subject-balance', 'potential-analysis', 'segment-analysis', 'correlation-analysis', 'class-diagnosis', 'marginal-push', 'report-generator', 'zhongkao-countdown', 'ai-analysis', 'app-download-center'],
    parent: ['report-generator', 'ai-analysis', 'app-download-center'],
    student: ['report-generator', 'ai-analysis', 'app-download-center'],
    guest: ['starter-hub', 'app-download-center']
};

const PermissionPolicy = {
    normalizeName(value) {
        return String(value || '').trim().replace(/\s+/g, '').toLowerCase();
    },
    normalizeSchool(value) {
        return String(value || '').trim();
    },
    sameSchoolName(a, b) {
        const left = this.normalizeSchool(a);
        const right = this.normalizeSchool(b);
        if (!left || !right) return false;
        if (typeof areSchoolNamesEquivalent === 'function') return areSchoolNamesEquivalent(left, right);
        return left === right;
    },
    extractGrade(value) {
        const normalized = normalizeClass(value || '');
        const match = String(normalized || '').match(/^(\d{1,2})/);
        return match ? match[1] : '';
    },
    parseClasses(value) {
        return String(value || '').split(/[,\uff0c\u3001/|]/).map(item => normalizeClass(item)).filter(Boolean);
    },
    getPrimaryRole(user = getCurrentUser()) {
        if (!user) return 'guest';
        return typeof RoleManager !== 'undefined' && typeof RoleManager.getPrimaryRole === 'function'
            ? RoleManager.getPrimaryRole(user)
            : (user.role || 'guest');
    },
    getQueryRoles(user = getCurrentUser()) {
        if (!user) return ['guest'];
        if (typeof RoleManager !== 'undefined' && typeof RoleManager.getUserRoles === 'function') {
            const roles = RoleManager.getUserRoles(user).filter(Boolean);
            return roles.length ? roles : ['guest'];
        }
        if (Array.isArray(user.roles) && user.roles.length) return user.roles.filter(Boolean);
        return [user.role || 'guest'];
    },
    hasQueryRole(user, roleName) {
        return this.getQueryRoles(user).includes(roleName);
    },
    isAdmin(user = getCurrentUser()) {
        return this.getPrimaryRole(user) === 'admin';
    },
    isDirector(user = getCurrentUser()) {
        return this.getPrimaryRole(user) === 'director';
    },
    isGradeDirector(user = getCurrentUser()) {
        return this.getPrimaryRole(user) === 'grade_director';
    },
    isClassTeacher(user = getCurrentUser()) {
        return this.getPrimaryRole(user) === 'class_teacher';
    },
    isTeacher(user = getCurrentUser()) {
        return this.getPrimaryRole(user) === 'teacher';
    },
    isParentLike(user = getCurrentUser()) {
        const role = this.getPrimaryRole(user);
        return role === 'parent' || role === 'student';
    },
    getBoundSchool(user = getCurrentUser()) {
        return this.normalizeSchool(user?.school || readCurrentSchool() || '');
    },
    getBoundGrade(user = getCurrentUser()) {
        return this.extractGrade(user?.grade_name || user?.class || '');
    },
    getHomeroomClass(user = getCurrentUser()) {
        return normalizeClass(user?.class || '');
    },
    getTeachingScope(user = getCurrentUser()) {
        if (!(this.hasQueryRole(user, 'teacher') || this.hasQueryRole(user, 'class_teacher'))) {
            return { classes: new Set(), subjects: new Set() };
        }
        return getTeacherScopeForUser(user);
    },
    getAllowedModules(user = getCurrentUser()) {
        const roles = this.getQueryRoles(user);
        if (!roles.length) return QUERY_MODULE_ACCESS.guest;
        const merged = new Set();
        for (const role of roles) {
            const allow = QUERY_MODULE_ACCESS[role] || [];
            if (allow.includes('*')) return ['*'];
            allow.forEach(moduleId => merged.add(moduleId));
        }
        if (!merged.size) {
            (QUERY_MODULE_ACCESS.guest || []).forEach(moduleId => merged.add(moduleId));
        }
        return Array.from(merged);
    },
    canAccessModule(user, moduleId) {
        if (moduleId === 'county-teacher-portrait' || moduleId === 'county-school-horizontal') {
            moduleId = 'county-analysis';
        }
        const allow = this.getAllowedModules(user);
        return allow.includes('*') || allow.includes(moduleId);
    },
    canQuerySchool(user, schoolName) {
        if (!user) return true;
        if (this.hasQueryRole(user, 'admin')) return true;
        if (this.hasQueryRole(user, 'director')
            || this.hasQueryRole(user, 'grade_director')
            || this.hasQueryRole(user, 'class_teacher')
            || this.hasQueryRole(user, 'teacher')
            || this.hasQueryRole(user, 'parent')
            || this.hasQueryRole(user, 'student')) {
            return this.sameSchoolName(this.getBoundSchool(user), schoolName);
        }
        return false;
    },
    canQueryClass(user, schoolName, className, options = {}) {
        if (!user) return true;
        if (this.hasQueryRole(user, 'admin')) return true;
        if (!this.canQuerySchool(user, schoolName)) return false;
        const normalizedClass = normalizeClass(className || '');
        if (!normalizedClass) return false;
        if (this.hasQueryRole(user, 'director')) return true;

        const roleChecks = [];

        if (this.hasQueryRole(user, 'grade_director')) {
            const boundGrade = this.getBoundGrade(user);
            roleChecks.push(!!boundGrade && this.extractGrade(normalizedClass) === boundGrade);
        }

        if (this.hasQueryRole(user, 'class_teacher')) {
            const mode = options.mode || 'either';
            const homeroomClass = this.getHomeroomClass(user);
            const teachingScope = this.getTeachingScope(user);
            const homeroomMatch = !!homeroomClass && normalizedClass === homeroomClass;
            const teachingMatch = teachingScope.classes.has(normalizedClass);
            if (mode === 'homeroom') roleChecks.push(homeroomMatch);
            else if (mode === 'teaching') roleChecks.push(homeroomMatch || teachingMatch);
            else roleChecks.push(homeroomMatch || teachingMatch);
        }

        if (this.hasQueryRole(user, 'teacher')) {
            roleChecks.push(this.getTeachingScope(user).classes.has(normalizedClass));
        }

        if (this.hasQueryRole(user, 'parent') || this.hasQueryRole(user, 'student')) {
            roleChecks.push(normalizeClass(user?.class || '') === normalizedClass);
        }

        return roleChecks.some(Boolean);
    },
    canQueryStudent(user, row, options = {}) {
        if (!user) return true;
        if (!row) return false;
        const canByClassScope = this.canQueryClass(user, row?.school, row?.class, options);
        const canBySelf = (this.hasQueryRole(user, 'parent') || this.hasQueryRole(user, 'student'))
            && this.sameSchoolName(user?.school, row?.school)
            && normalizeClass(user?.class || '') === normalizeClass(row?.class || '')
            && this.normalizeName(user?.name) === this.normalizeName(row?.name);
        return canByClassScope || canBySelf;
    },
    filterStudentRows(user, rows, options = {}) {
        if (!user) return Array.isArray(rows) ? rows.slice() : [];
        if (this.hasQueryRole(user, 'admin')) return Array.isArray(rows) ? rows.slice() : [];
        return (Array.isArray(rows) ? rows : []).filter(row => this.canQueryStudent(user, row, options));
    },
    getAccessibleSchoolNames(user, schoolNames) {
        const names = Array.from(new Set((Array.isArray(schoolNames) ? schoolNames : []).map(name => String(name || '').trim()).filter(Boolean)));
        if (!user || this.isAdmin(user)) return names;
        return names.filter(name => this.canQuerySchool(user, name));
    },
    getAccessibleClassNames(user, classNames, schoolName, options = {}) {
        const names = Array.from(new Set((Array.isArray(classNames) ? classNames : []).map(name => String(name || '').trim()).filter(Boolean)));
        if (!user) return names;
        return names.filter(name => this.canQueryClass(user, schoolName, name, options));
    },
    canQueryTeacherMetric(user, teacherName, statItem, schoolName) {
        if (!user) return true;
        if (!this.canQuerySchool(user, schoolName)) return false;
        if (this.hasQueryRole(user, 'admin')) return true;
        if (this.hasQueryRole(user, 'director')) return true;
        const classes = this.parseClasses(statItem?.classes);
        const roleChecks = [];

        if (this.hasQueryRole(user, 'teacher')) {
            roleChecks.push(this.normalizeName(teacherName) === this.normalizeName(user?.name));
        }

        if (this.hasQueryRole(user, 'grade_director')) {
            const boundGrade = this.getBoundGrade(user);
            roleChecks.push(!!boundGrade && classes.some(cls => this.extractGrade(cls) === boundGrade));
        }

        if (this.hasQueryRole(user, 'class_teacher')) {
            const homeroomClass = this.getHomeroomClass(user);
            const ownTeacherMetric = this.normalizeName(teacherName) === this.normalizeName(user?.name);
            roleChecks.push(ownTeacherMetric || (!!homeroomClass && classes.some(cls => normalizeClass(cls) === homeroomClass)));
        }

        return roleChecks.some(Boolean);
    },
    filterTeacherStats(user, stats, schoolName) {
        if (!user) return stats;
        const filtered = {};
        Object.entries(stats || {}).forEach(([teacherName, subjectMap]) => {
            const scopedSubjects = {};
            Object.entries(subjectMap || {}).forEach(([subject, statItem]) => {
                if (this.canQueryTeacherMetric(user, teacherName, statItem, schoolName)) {
                    scopedSubjects[subject] = statItem;
                }
            });
            if (Object.keys(scopedSubjects).length > 0) filtered[teacherName] = scopedSubjects;
        });
        return filtered;
    },
    'permissions': {
        title: '权限说明·方案 C',
        fit: `用于<strong>查看当前角色的模块访问与数据查询边界</strong>，便于系统培训、审核和账号配置。`,
        when: `新增/调整角色，或需要解释多角色可查范围时使用。`,
        use: `<ul>
                <li><strong>模块访问：</strong>按最高优先级角色决定。</li>
                <li><strong>数据查询：</strong>按所有角色查询范围的并集决定。</li>
                <li><strong>优先级：</strong>admin > director > grade_director > class_teacher > teacher > parent > student > guest。</li>
              </ul>`,
        calc: `<div class="formula-box">
                <strong>方案 C 核心：</strong><br>
                模块访问 = 最高优先级角色<br>
                数据查询 = 所有角色范围并集
              </div>
              <div style="text-align:left; line-height:1.7;">
                <p><strong>典型示例：</strong></p>
                <ul>
                  <li>级部主任 + 班主任 + 教师：模块按 grade_director；数据按“本年级 ∪ 本班 ∪ 任教班级”。</li>
                  <li>班主任 + 教师：模块按 class_teacher；数据按“本班 ∪ 任教班级”。</li>
                  <li>director：本校全量；admin：全局。</li>
                  <li>parent/student：仅本人学生报告。</li>
                </ul>
              </div>`
    }
};

window.PermissionPolicy = PermissionPolicy;

function canAccessModule(id) {
    const user = getCurrentUser();
    if (!user) return true;
    return PermissionPolicy.canAccessModule(user, id);
}
