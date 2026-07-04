// student-details-render-runtime.js — StudentDetails rendering, rank display, exportStudentDetails (extracted from app.js)
const StudentDetailsPerfCache = {
    schoolOptionsSignature: '',
    accessibleSchools: [],
    classOptions: new Map(),
    subjectListSignature: '',
    subjectList: [],
    renderMetaSignature: '',
    renderMeta: null,
    querySignature: '',
    queryData: [],
    queryMeta: null,
    pageSizeWidth: 0,
    pageSize: 40,
    domCache: null,
    domSignature: '',
    headerHtmlSignature: '',
    headerHtml: '',
    bodyHtmlSignature: '',
    bodyHtml: '',
    paginationSignature: '',
    paginationHtml: '',
    desktopRowsSignature: '',
    desktopRowsHtml: '',
    mobileRowsSignature: '',
    mobileRowsHtml: '',
    rankSnapshotSignature: '',
    rankSnapshotByStudent: new WeakMap(),
    cellValueSignature: '',
    cellValueByStudent: new WeakMap(),
    openFilterMenu: null,
    filterSearchCache: new WeakMap()
};

function hasStudentDetailsQueryRole(user, roleName) {
    if (window.PermissionPolicy && typeof PermissionPolicy.hasQueryRole === 'function') {
        return PermissionPolicy.hasQueryRole(user, roleName);
    }
    if (Array.isArray(user?.roles)) return user.roles.includes(roleName);
    return user?.role === roleName;
}

function isStudentDetailsClassTeacher(user) {
    return window.PermissionPolicy && typeof PermissionPolicy.isClassTeacher === 'function'
        ? PermissionPolicy.isClassTeacher(user)
        : hasStudentDetailsQueryRole(user, 'class_teacher');
}

function isStudentDetailsTeacher(user) {
    return hasStudentDetailsQueryRole(user, 'teacher');
}

function getStudentDetailsHomeroomClass(user) {
    return window.PermissionPolicy && typeof PermissionPolicy.getHomeroomClass === 'function'
        ? PermissionPolicy.getHomeroomClass(user)
        : normalizeClass(user?.class_name || user?.class || '');
}

function getStudentDetailsRowsForSchoolOption(schoolName) {
    const selectedSchool = String(schoolName || '').trim();
    if (!selectedSchool) return [];
    const schoolMap = SCHOOLS || {};
    const directRows = Array.isArray(schoolMap[selectedSchool]?.students)
        ? schoolMap[selectedSchool].students
        : [];
    if (directRows.length) return directRows;

    const matchedKey = Object.keys(schoolMap).find(key => sameAppSchoolName(key, selectedSchool) || key === selectedSchool);
    const matchedRows = matchedKey && Array.isArray(schoolMap[matchedKey]?.students)
        ? schoolMap[matchedKey].students
        : [];
    if (matchedRows.length) return matchedRows;

    return (Array.isArray(RAW_DATA) ? RAW_DATA : [])
        .filter(row => sameAppSchoolName(row?.school, selectedSchool));
}

function getStudentDetailsClassNamesForSchoolOption(schoolName) {
    return Array.from(new Set(getStudentDetailsRowsForSchoolOption(schoolName)
        .map(student => normalizeClass(student?.class) || String(student?.class || '').trim())
        .filter(Boolean)))
        .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true, sensitivity: 'base' }));
}

function updateStudentSchoolSelect() {
    const select = document.getElementById('studentSchoolSelect');
    const classSelect = document.getElementById('studentClassSelect');
    const modeWrap = document.getElementById('classTeacherViewModeWrap');
    const modeSelect = document.getElementById('classTeacherViewMode');
    if (!select || !classSelect) return;
    const setOptionsIfChanged = (target, html, signature) => {
        const sig = String(signature || html || '');
        if (target.dataset.studentDetailOptionsSig === sig) return;
        target.innerHTML = html;
        target.dataset.studentDetailOptionsSig = sig;
    };
    const buildClassOptions = (classes, includeAll = true) => {
        const classList = Array.from(classes || []).map(c => String(c || '').trim()).filter(Boolean);
        return (includeAll ? '<option value="">全部班级</option>' : '')
            + classList.map(c => `<option value="${tmEscapeHtml(c)}">${tmEscapeHtml(c)}</option>`).join('');
    };
    const findMatchingSchoolOption = (schoolName) => {
        const target = String(schoolName || '').trim();
        if (!target) return '';
        return accessibleSchools.find(school => sameAppSchoolName(school, target) || school === target) || '';
    };
    const previousSchool = select.value;
    const previousClass = classSelect.value;
    select.disabled = false;
    classSelect.disabled = false;
    if (modeWrap) modeWrap.style.display = 'none';

    const user = getCurrentUser();
    const role = user?.role;
    const isClassTeacherUser = isStudentDetailsClassTeacher(user);
    const isTeacherUser = isStudentDetailsTeacher(user);
    const homeroomClass = getStudentDetailsHomeroomClass(user);
    const schoolSignature = [
        Object.keys(SCHOOLS || {}).sort().join('|'),
        String(user?.role || ''),
        Array.isArray(user?.roles) ? user.roles.join('|') : '',
        String(user?.school || ''),
        String(user?.class_name || ''),
        String(user?.class || ''),
        String(user?.name || '')
    ].join('::');
    if (StudentDetailsPerfCache.schoolOptionsSignature !== schoolSignature) {
        const availableSchools = (typeof listAvailableSchoolsForCompare === 'function')
            ? listAvailableSchoolsForCompare('all')
            : Object.keys(SCHOOLS || {});
        StudentDetailsPerfCache.accessibleSchools = PermissionPolicy.getAccessibleSchoolNames(user, availableSchools);
        StudentDetailsPerfCache.schoolOptionsSignature = schoolSignature;
        StudentDetailsPerfCache.classOptions.clear();
    }
    const accessibleSchools = StudentDetailsPerfCache.accessibleSchools;
    const schoolOptionsHtml = '<option value="">--请选择本校--</option>'
        + accessibleSchools.map(school => `<option value="${school}">${school}</option>`).join('');
    setOptionsIfChanged(select, schoolOptionsHtml, `schools:${accessibleSchools.join('|')}`);
    const previousSchoolMatch = findMatchingSchoolOption(previousSchool);
    if (previousSchoolMatch) select.value = previousSchoolMatch;

    const updateClassOptionsForSchool = (school, options = {}) => {
        const includeAll = options.includeAll !== false;
        const selectedSchool = String(school || '').trim();
        const classQueryMode = isClassTeacherUser ? getClassTeacherStudentViewMode() : (options.mode || 'teaching');
        const classCacheKey = `${selectedSchool}::${includeAll}::${classQueryMode}::${role || ''}::${Array.isArray(user?.roles) ? user.roles.join('|') : ''}::${user?.school || ''}::${user?.class_name || ''}::${user?.class || ''}::${window.__RAW_DATA_VERSION || 0}`;
        let classes = StudentDetailsPerfCache.classOptions.get(classCacheKey);
        if (!classes) {
            const sourceClasses = selectedSchool ? getStudentDetailsClassNamesForSchoolOption(selectedSchool) : [];
            classes = PermissionPolicy.getAccessibleClassNames(
                user,
                sourceClasses,
                selectedSchool,
                { mode: classQueryMode }
            );
            StudentDetailsPerfCache.classOptions.set(classCacheKey, classes);
        }
        const html = buildClassOptions(classes, includeAll);
        setOptionsIfChanged(classSelect, html || '<option value="">全部班级</option>', `classes:${selectedSchool}:${includeAll}:${classes.join('|')}`);
        if (options.preservePrevious !== false && previousClass && classes.includes(previousClass)) classSelect.value = previousClass;
        else if (includeAll) classSelect.value = '';
    };

    if (isClassTeacherUser) {
        const school = findMatchingSchoolOption(user.school) || findMatchingSchoolOption(MY_SCHOOL) || user.school || MY_SCHOOL || '';
        if (school) {
            select.value = school;
            select.disabled = true;
        }
        const scope = getTeacherScopeForUser(user);
        const classTeacherClasses = Array.from(new Set([
            homeroomClass,
            ...Array.from(scope.classes || [])
        ].map(c => normalizeClass(c)).filter(Boolean))).sort();
        const fallbackLabel = String(user?.class_name || user?.class || homeroomClass || '未配置班级');
        const classOptionsHtml = classTeacherClasses.length
            ? buildClassOptions(classTeacherClasses, false)
            : `<option value="${tmEscapeHtml(homeroomClass || '')}">${tmEscapeHtml(fallbackLabel)}</option>`;
        setOptionsIfChanged(classSelect, classOptionsHtml, `class-teacher:${school}:${classTeacherClasses.join('|')}:${fallbackLabel}`);
        if (previousClass && classTeacherClasses.includes(normalizeClass(previousClass))) {
            classSelect.value = normalizeClass(previousClass);
        } else {
            classSelect.value = homeroomClass || classTeacherClasses[0] || '';
        }
        classSelect.disabled = classTeacherClasses.length === 0;

        if (modeWrap) modeWrap.style.display = 'inline-flex';
        if (modeSelect && !modeSelect.value) modeSelect.value = 'class_all';
    } else if (isTeacherUser) {
        const school = findMatchingSchoolOption(user.school) || findMatchingSchoolOption(MY_SCHOOL) || user.school || MY_SCHOOL || '';
        if (school) {
            select.value = school;
            select.disabled = true;
        }
        const scope = getTeacherScopeForUser(user);
        const classes = Array.from(scope.classes).sort();
        setOptionsIfChanged(classSelect, buildClassOptions(classes, true), `teacher:${school}:${classes.join('|')}`);
        if (previousClass && classes.includes(previousClass)) classSelect.value = previousClass;
    } else if (role === 'director' || role === 'grade_director') {
        const school = PermissionPolicy.getBoundSchool(user);
        if (school) {
            select.value = school;
            select.disabled = true;
        }
        const classes = PermissionPolicy.getAccessibleClassNames(user, getStudentDetailsClassNamesForSchoolOption(school), school, { mode: 'homeroom' });
        setOptionsIfChanged(classSelect, buildClassOptions(classes, true), `director:${school}:${classes.join('|')}`);
        if (previousClass && classes.includes(previousClass)) classSelect.value = previousClass;
    } else {
        updateClassOptionsForSchool(select.value);
    }

    select.onchange = function () {
        const selectedSchool = this.value;
        classSelect.value = '';
        updateClassOptionsForSchool(selectedSchool, { preservePrevious: false });
        renderStudentDetails(true);
    };

    classSelect.onchange = function () {
        renderStudentDetails(true);
    };

    if (modeSelect) {
        modeSelect.onchange = function () {
            renderStudentDetails(true);
        };
    }
}


let STD_STATE = {
    page: 1,
    size: 40,
    sortCol: null,     // 当前排序列
    sortDir: 'desc',   // desc 或 asc
    activeFilters: {}, // 存储筛选状态: { 'school': new Set(['实验中学', '二中']), '语文': ... }
    cacheData: [],     // 最终展示的数据
    renderMeta: null,  // 当前筛选批次的表格渲染元信息
    dataSignature: '',
    filterValueCache: Object.create(null),
    lastBodySignature: '',
    lastHeaderSignature: '',
    lastScrollSignature: ''
};

function buildStudentDetailsFilterSignature() {
    return Object.entries(STD_STATE.activeFilters || {})
        .map(([key, values]) => {
            const list = values && typeof values.forEach === 'function'
                ? Array.from(values).map(value => String(value)).sort()
                : [];
            return `${key}:${list.join('|')}`;
        })
        .sort()
        .join(';');
}

function getStudentDetailsConfiguredSubjectList(list = []) {
    const configuredSubjects = Array.isArray(SUBJECTS) ? SUBJECTS.filter(Boolean) : [];
    const rows = Array.isArray(list) ? list : [];
    const detailSubjects = [...configuredSubjects];
    getConfiguredExtraDisplaySubjects(CONFIG).forEach((subject) => {
        if (!subject || detailSubjects.includes(subject)) return;
        const hasSubjectScore = rows.some((row) => Object.prototype.hasOwnProperty.call(row?.scores || {}, subject));
        if (hasSubjectScore) detailSubjects.push(subject);
    });
    return detailSubjects;
}

function buildStudentDetailsDataSignature(list = []) {
    const rows = Array.isArray(list) ? list : [];
    const detailSubjects = getStudentDetailsConfiguredSubjectList(rows);
    let totalSum = 0;
    let subjectSum = 0;
    rows.forEach((row) => {
        totalSum += Number(row?.total) || 0;
        const scores = row?.scores || {};
        detailSubjects.forEach((subject) => {
            subjectSum += Number(scores[subject]) || 0;
        });
    });
    const first = rows[0] || {};
    const last = rows[rows.length - 1] || {};
    return [
        rows.length,
        totalSum.toFixed(2),
        subjectSum.toFixed(2),
        String(first.school || ''),
        String(first.class || ''),
        String(first.name || ''),
        String(last.school || ''),
        String(last.class || ''),
        String(last.name || ''),
        STD_STATE.sortCol || '',
        STD_STATE.sortDir || '',
        buildStudentDetailsFilterSignature()
    ].join('::');
}

function setStudentDetailsHtmlIfChanged(element, html, signature) {
    if (!element) return false;
    if (element.dataset.studentDetailsRenderSig === signature && element.innerHTML === html) return false;
    element.innerHTML = html;
    element.dataset.studentDetailsRenderSig = signature;
    return true;
}

function getStudentDetailsDomCache() {
    const section = document.getElementById('student-details');
    const signature = section
        ? [
            section.isConnected ? 'connected' : 'detached',
            !!document.getElementById('studentDetailTable'),
            !!document.querySelector('#studentDetailTable thead tr'),
            !!document.querySelector('#studentDetailTable tbody')
        ].join('::')
        : 'missing';
    if (StudentDetailsPerfCache.domCache && StudentDetailsPerfCache.domSignature === signature) {
        return StudentDetailsPerfCache.domCache;
    }
    const detailTable = document.getElementById('studentDetailTable');
    StudentDetailsPerfCache.domSignature = signature;
    StudentDetailsPerfCache.domCache = {
        section,
        detailTable,
        thead: detailTable?.querySelector('thead tr') || document.querySelector('#studentDetailTable thead tr'),
        tbody: detailTable?.querySelector('tbody') || document.querySelector('#studentDetailTable tbody'),
        tableWrap: section?.querySelector('.table-wrap') || null,
        compareSection: document.getElementById('student-multi-period-compare-section')
    };
    return StudentDetailsPerfCache.domCache;
}

function getStudentDetailsPageSize() {
    const width = Number(window.innerWidth || 1280);
    if (StudentDetailsPerfCache.pageSizeWidth === width) return StudentDetailsPerfCache.pageSize;
    StudentDetailsPerfCache.pageSizeWidth = width;
    StudentDetailsPerfCache.pageSize = width <= 640 ? 12 : (width <= 1024 ? 24 : 40);
    return StudentDetailsPerfCache.pageSize;
}

function getStudentDetailsSubjectList(list = []) {
    const rows = Array.isArray(list) ? list : [];
    const configuredSubjects = getStudentDetailsConfiguredSubjectList(rows);
    const signature = [
        configuredSubjects.join('|'),
        rows.length,
        String(rows[0]?.school || ''),
        String(rows[0]?.class || ''),
        String(rows[rows.length - 1]?.school || ''),
        String(rows[rows.length - 1]?.class || '')
    ].join('::');
    if (StudentDetailsPerfCache.subjectListSignature === signature) {
        return StudentDetailsPerfCache.subjectList;
    }
    if (configuredSubjects.length) {
        StudentDetailsPerfCache.subjectListSignature = signature;
        StudentDetailsPerfCache.subjectList = configuredSubjects;
        return configuredSubjects;
    }

    const seen = new Set();
    rows.forEach(row => {
        Object.keys(row?.scores || {}).forEach(subject => {
            const normalized = normalizeSubject(subject);
            if (normalized) seen.add(normalized);
        });
    });
    const preferredOrder = ['语文', '数学', '英语', '物理', '化学', '历史', '地理', '生物', '政治'];
    const ordered = preferredOrder.filter(subject => seen.has(subject));
    Array.from(seen).forEach(subject => {
        if (!ordered.includes(subject)) ordered.push(subject);
    });
    StudentDetailsPerfCache.subjectListSignature = signature;
    StudentDetailsPerfCache.subjectList = ordered;
    return ordered;
}

function buildStudentDetailsRenderMeta(list = []) {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const isClassTeacher = isStudentDetailsClassTeacher(user);
    const isTeacher = isStudentDetailsTeacher(user);
    const classTeacherMode = isClassTeacher ? getClassTeacherStudentViewMode() : 'teaching';
    const selectedClass = document.getElementById('studentClassSelect')?.value || '';
    const queryMode = isClassTeacher ? getStudentDetailsClassTeacherQueryMode(user, selectedClass) : 'teaching';
    const useTeachingSubjectScope = (!isClassTeacher && isTeacher) || (isClassTeacher && queryMode === 'teaching');
    const needTeacherScope = useTeachingSubjectScope;
    const teacherScope = needTeacherScope ? getTeacherScopeForUser(user) : null;
    const listSignature = buildStudentDetailsDataSignature(list);
    const metaSignature = [
        listSignature,
        role,
        classTeacherMode,
        queryMode,
        normalizeClass(selectedClass || ''),
        teacherScope ? Array.from(teacherScope.subjects || []).sort().join('|') : '',
        teacherScope ? Array.from(teacherScope.classes || []).sort().join('|') : ''
    ].join('::');
    if (StudentDetailsPerfCache.renderMetaSignature === metaSignature && StudentDetailsPerfCache.renderMeta) {
        return StudentDetailsPerfCache.renderMeta;
    }
    const subjectList = getStudentDetailsSubjectList(list);
    const visibleSubjects = useTeachingSubjectScope
        ? subjectList.filter(s => teacherScope.subjects.has(normalizeSubject(s)))
        : subjectList;
    const rankVisibility = window.RankingDataService && typeof window.RankingDataService.getStudentRankVisibility === 'function'
        ? window.RankingDataService.getStudentRankVisibility(list, visibleSubjects, { isSingleSchoolMode })
        : {
            countyRankVisible: hasStudentCountyRankData(list, visibleSubjects),
            townRankVisible: hasStudentTownshipRankData(list, visibleSubjects)
        };
    const meta = {
        role,
        isTeacher,
        isClassTeacher,
        visibleSubjects,
        countyRankVisible: rankVisibility.countyRankVisible,
        townRankVisible: rankVisibility.townRankVisible
    };
    StudentDetailsPerfCache.renderMetaSignature = metaSignature;
    StudentDetailsPerfCache.renderMeta = meta;
    return meta;
}

function getClassTeacherStudentViewMode() {
    const sel = document.getElementById('classTeacherViewMode');
    const val = sel?.value;
    return (val === 'teaching') ? 'teaching' : 'class_all';
}

function getStudentDetailsClassTeacherQueryMode(user, selectedClass = '') {
    if (!isStudentDetailsClassTeacher(user)) return 'teaching';
    if (getClassTeacherStudentViewMode() === 'teaching') return 'teaching';
    const normalizedSelectedClass = normalizeClass(selectedClass || '');
    if (!normalizedSelectedClass) return 'homeroom';
    const homeroomClass = getStudentDetailsHomeroomClass(user);
    if (normalizedSelectedClass === homeroomClass) return 'homeroom';
    const scope = getTeacherScopeForUser(user);
    return scope?.classes?.has(normalizedSelectedClass) ? 'teaching' : 'homeroom';
}

function isStudentDetailsMobileCardMode() {
    if (document.body?.dataset?.mobileQuery === 'true') return true;
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(max-width: 768px)').matches;
}

function getStudentDetailsRankSnapshot(student, visibleSubjects, townRankVisible, countyRankVisible, dataSignature) {
    if (!student || typeof student !== 'object') return null;
    const signature = [
        dataSignature || '',
        visibleSubjects.join('|'),
        townRankVisible ? 'town' : 'no-town',
        countyRankVisible ? 'county' : 'no-county',
        getReportStudentIdentity(student)
    ].join('::');
    if (StudentDetailsPerfCache.rankSnapshotSignature !== (dataSignature || '')) {
        StudentDetailsPerfCache.rankSnapshotSignature = dataSignature || '';
        StudentDetailsPerfCache.rankSnapshotByStudent = new WeakMap();
    }
    const cached = StudentDetailsPerfCache.rankSnapshotByStudent.get(student);
    if (cached?.signature === signature) return cached;
    const showTownRankForStudent = !isCountyDirectStudentForRank(student);
    const subjects = {};
    visibleSubjects.forEach((sub) => {
        subjects[sub] = {
            score: student.scores?.[sub] !== undefined ? student.scores[sub] : '-',
            school: safeGet(student, `ranks.${sub}.school`, '-'),
            township: townRankVisible && showTownRankForStudent ? getDisplayRankValue(student, `ranks.${sub}.township`, { scope: 'township' }) : '-',
            county: countyRankVisible ? getStudentCountyRankValue(student, sub) : '-'
        };
    });
    const snapshot = {
        signature,
        showTownRankForStudent,
        subjects,
        totalClass: getDisplayRankValue(student, 'ranks.total.class', { scope: 'class' }),
        totalSchool: safeGet(student, 'ranks.total.school', '-'),
        totalTown: townRankVisible && showTownRankForStudent ? getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' }) : '-',
        totalCounty: countyRankVisible ? getStudentCountyRankValue(student, 'total') : '-'
    };
    StudentDetailsPerfCache.rankSnapshotByStudent.set(student, snapshot);
    return snapshot;
}

function buildStudentDetailMobileInfoItem(label, value, accentClass = '') {
    const displayValue = value == null || value === '' ? '-' : String(value);
    return `
        <div class="student-detail-mobile-info ${accentClass}">
            <span>${tmEscapeHtml(label)}</span>
            <strong>${tmEscapeHtml(displayValue)}</strong>
        </div>
    `;
}

function getStudentCountyRankValue(student, key = 'total') {
    if (window.RankingDataService && typeof window.RankingDataService.getStudentRankValue === 'function') {
        return window.RankingDataService.getStudentRankValue(student, key, 'county');
    }
    const fallback = key === 'total' ? (student?.countyRank ?? '-') : '-';
    const value = safeGet(student, `ranks.${key}.county`, fallback);
    return value == null || value === '' ? fallback : value;
}
window.getStudentCountyRankValue = getStudentCountyRankValue;

function hasStudentClassRankScope(studentLike) {
    if (window.RankingDataService && typeof window.RankingDataService.hasStudentClassRankScope === 'function') {
        return window.RankingDataService.hasStudentClassRankScope(studentLike);
    }
    const rawClass = String(studentLike?.class ?? '').trim();
    const normalizedClass = typeof normalizeClass === 'function' ? normalizeClass(rawClass) : rawClass;
    if (!normalizedClass || normalizedClass === '-') return false;
    return !/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(normalizedClass);
}
window.hasStudentClassRankScope = hasStudentClassRankScope;

function isCountyDirectStudentForRank(studentLike) {
    if (window.RankingDataService && typeof window.RankingDataService.isCountyDirectStudent === 'function') {
        return window.RankingDataService.isCountyDirectStudent(studentLike, { rows: RAW_DATA });
    }
    const schoolName = String(studentLike?.school || '').trim();
    if (!schoolName || typeof getCountyDirectSchoolNames !== 'function' || typeof getTownshipManagedSchoolNames !== 'function') return false;
    const schoolKeys = Object.keys(SCHOOLS || {});
    const candidateNames = schoolKeys.length
        ? schoolKeys.map(name => String(name || '').trim()).filter(Boolean)
        : Array.from(new Set((RAW_DATA || []).map(row => String(row?.school || '').trim()).filter(Boolean)));
    const baseKey = candidateNames.slice().sort().join('||');
    if (!window.__countyDirectRankCache || window.__countyDirectRankCache.baseKey !== baseKey) {
        const townshipNames = getTownshipManagedSchoolNames(candidateNames);
        const directNames = townshipNames.length ? getCountyDirectSchoolNames(candidateNames) : [];
        window.__countyDirectRankCache = {
            baseKey,
            townshipNames,
            directNames,
            resultBySchool: new Map()
        };
    }
    const cache = window.__countyDirectRankCache;
    if (!cache.townshipNames.length) return false;
    if (cache.resultBySchool.has(schoolName)) return cache.resultBySchool.get(schoolName);
    const isDirect = cache.directNames.some(name => (
        name === schoolName
        || (typeof areSchoolNamesEquivalent === 'function' && areSchoolNamesEquivalent(name, schoolName))
        || (typeof areSchoolNamesMatched === 'function' && areSchoolNamesMatched(name, schoolName, true))
    ));
    cache.resultBySchool.set(schoolName, isDirect);
    return isDirect;
}
window.isCountyDirectStudentForRank = isCountyDirectStudentForRank;

function getDisplayRankValue(studentLike, keyPath, options = {}) {
    if (window.RankingDataService && typeof window.RankingDataService.getStudentRankValue === 'function') {
        const match = String(keyPath || '').match(/^ranks\.([^.]+)\.([^.]+)$/);
        if (match) return window.RankingDataService.getStudentRankValue(studentLike, match[1], options.scope || match[2], { rows: RAW_DATA });
    }
    if (options.scope === 'class' && !hasStudentClassRankScope(studentLike)) return '-';
    if (options.scope === 'township' && isCountyDirectStudentForRank(studentLike)) return '-';
    const value = safeGet(studentLike, keyPath, '-');
    return value == null || value === '' ? '-' : value;
}
window.getDisplayRankValue = getDisplayRankValue;

function getCountyRankScopeForDisplay() {
    if (window.COUNTY_ANALYSIS_SCOPE && typeof window.COUNTY_ANALYSIS_SCOPE === 'object') {
        return window.COUNTY_ANALYSIS_SCOPE;
    }
    try {
        const rawMap = localStorage.getItem('COUNTY_ANALYSIS_SCOPE_V1');
        const map = rawMap ? JSON.parse(rawMap) : {};
        const examKey = String(
            window.CURRENT_EXAM_ID
            || (typeof readWorkspaceExamId === 'function' ? readWorkspaceExamId() : '')
            || window.COHORT_DB?.currentExamId
            || 'current'
        ).trim() || 'current';
        return map?.[examKey] || null;
    } catch (_) {
        return null;
    }
}
window.getCountyRankScopeForDisplay = getCountyRankScopeForDisplay;

function hasCountyRankScopeForDisplay() {
    const scope = getCountyRankScopeForDisplay();
    if (!scope || scope.includesCounty !== true) return false;
    const countyCount = Array.isArray(scope.countySchools) ? scope.countySchools.length : 0;
    const townshipCount = Array.isArray(scope.townshipSchools) ? scope.townshipSchools.length : 0;
    return countyCount > 0 || townshipCount > 0;
}
window.hasCountyRankScopeForDisplay = hasCountyRankScopeForDisplay;

function hasCountyRankValuesInData(list = RAW_DATA, subjects = SUBJECTS) {
    if (!Array.isArray(list) || list.length === 0) return false;
    return list.some((student) => {
        if (getStudentCountyRankValue(student, 'total') !== '-') return true;
        return (subjects || []).some((subject) => getStudentCountyRankValue(student, subject) !== '-');
    });
}
window.hasCountyRankValuesInData = hasCountyRankValuesInData;

function hasStudentCountyRankData(list = RAW_DATA, subjects = SUBJECTS) {
    if (window.RankingDataService && typeof window.RankingDataService.hasStudentRankData === 'function') {
        return window.RankingDataService.hasStudentRankData(list, subjects, 'county', { rows: RAW_DATA });
    }
    return hasCountyRankValuesInData(list, subjects);
}
window.hasStudentCountyRankData = hasStudentCountyRankData;

function hasStudentTownshipRankData(list = RAW_DATA, subjects = SUBJECTS) {
    if (window.RankingDataService && typeof window.RankingDataService.hasStudentRankData === 'function') {
        return !isSingleSchoolMode() && window.RankingDataService.hasStudentRankData(list, subjects, 'township', { rows: RAW_DATA });
    }
    if (!Array.isArray(list) || list.length === 0 || isSingleSchoolMode()) return false;
    return list.some((student) => {
        if (isCountyDirectStudentForRank(student)) return false;
        if (getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' }) !== '-') return true;
        return (subjects || []).some((subject) => (
            getDisplayRankValue(student, `ranks.${subject}.township`, { scope: 'township' }) !== '-'
        ));
    });
}
window.hasStudentTownshipRankData = hasStudentTownshipRankData;

function buildStudentScoreAuditSignature(list, subjects = SUBJECTS) {
    if (!Array.isArray(list) || !Array.isArray(subjects)) return '';
    return list.map(student => {
        const audit = getStudentZeroScoreAuditSubjects(student, subjects);
        if (!audit.allSubjects.length) return '';
        return `${student?.school || ''}/${student?.class || ''}/${student?.name || ''}:${audit.blankSubjects.join(',')}|${audit.zeroSubjects.join(',')}`;
    }).filter(Boolean).join(';');
}

function buildStudentScoreAuditBadge(student, subject, escapeFn = escapeAppHtml) {
    const blankSubjects = getStudentBlankScoreSubjects(student, [subject]);
    const score = Number(student?.scores?.[subject]);
    if (blankSubjects.includes(subject)) {
        return `<span style="display:inline-flex; margin-left:4px; padding:1px 6px; border-radius:999px; background:#fff7ed; color:#b45309; font-size:11px; font-weight:700;">${escapeFn('空白')}</span>`;
    }
    if (Number.isFinite(score) && score === 0) {
        return `<span style="display:inline-flex; margin-left:4px; padding:1px 6px; border-radius:999px; background:#fef2f2; color:#b91c1c; font-size:11px; font-weight:700;">${escapeFn('0分核对')}</span>`;
    }
    return '';
}

function buildStudentDetailMobileSubjectCard(student, sub, isTeacher, isClassTeacher, townRankVisible, countyRankVisible) {
    const score = student.scores[sub] !== undefined ? student.scores[sub] : '-';
    const townRank = getDisplayRankValue(student, `ranks.${sub}.township`, { scope: 'township' });
    const clickAttr = `onclick="updateStudentScore('${student.name}', '${student.class}', '${sub}', ${score})"`;
    const auditBadge = buildStudentScoreAuditBadge(student, sub, tmEscapeHtml);
    const scoreButton = `
        <button type="button" class="student-detail-mobile-score-btn" ${clickAttr} title="点击修改${tmEscapeHtml(sub)}成绩">
            ${tmEscapeHtml(score)}${auditBadge}
        </button>
    `;

    const rankChips = [];
    if (!isTeacher && !isClassTeacher) {
        rankChips.push(`<span>校 ${tmEscapeHtml(safeGet(student, `ranks.${sub}.school`, '-'))}</span>`);
        if (townRankVisible) rankChips.push(`<span>镇 ${tmEscapeHtml(townRank)}</span>`);
        if (countyRankVisible) rankChips.push(`<span>县 ${tmEscapeHtml(getStudentCountyRankValue(student, sub))}</span>`);
    } else {
        rankChips.push(`<span>级 ${tmEscapeHtml(safeGet(student, `ranks.${sub}.school`, '-'))}</span>`);
        if (townRankVisible) rankChips.push(`<span>镇 ${tmEscapeHtml(townRank)}</span>`);
        if (countyRankVisible) rankChips.push(`<span>县 ${tmEscapeHtml(getStudentCountyRankValue(student, sub))}</span>`);
    }

    return `
        <div class="student-detail-mobile-subject">
            <div class="student-detail-mobile-subject-head">
                <span>${tmEscapeHtml(sub)}</span>
                ${scoreButton}
            </div>
            <div class="student-detail-mobile-rank-row">
                ${rankChips.join('')}
            </div>
        </div>
    `;
}

function buildStudentDetailMobileRow(student, visibleSubjects, isTeacher, isClassTeacher, townRankVisible, countyRankVisible) {
    const schoolText = student.school || '-';
    const classText = student.class || '-';
    const totalText = student.total != null ? student.total : '-';
    const idText = student.id || '-';
    const examRoomText = student.examRoom || '-';
    const totalRankLabel = isTeacher || isClassTeacher ? '总分级排' : '总分校排';
    const totalRankValue = isTeacher || isClassTeacher
        ? safeGet(student, 'ranks.total.school', '-')
        : safeGet(student, 'ranks.total.school', '-');
    const totalRankClassLabel = '总分班排';
    const totalRankClassValue = getDisplayRankValue(student, 'ranks.total.class', { scope: 'class' });
    const totalRankCountyValue = getStudentCountyRankValue(student, 'total');
    const totalRankTownValue = getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' });

    const subjectCards = visibleSubjects.map((sub) => (
        buildStudentDetailMobileSubjectCard(student, sub, isTeacher, isClassTeacher, townRankVisible, countyRankVisible)
    )).join('');

    const metaCards = [
        buildStudentDetailMobileInfoItem('学校', schoolText),
        buildStudentDetailMobileInfoItem('考号', idText),
        buildStudentDetailMobileInfoItem('考场', examRoomText)
    ].join('');

    const rankCards = [
        buildStudentDetailMobileInfoItem(totalRankClassLabel, totalRankClassValue),
        buildStudentDetailMobileInfoItem(totalRankLabel, totalRankValue),
        townRankVisible ? buildStudentDetailMobileInfoItem('总分镇排', totalRankTownValue) : '',
        countyRankVisible ? buildStudentDetailMobileInfoItem('总分县排', totalRankCountyValue) : ''
    ].join('');

    return `
        <tr class="student-detail-mobile-row">
            <td colspan="100" class="student-detail-mobile-cell">
                <article class="student-detail-mobile-card">
                    <div class="student-detail-mobile-head">
                        <div>
                            <a href="javascript:void(0)" class="student-detail-mobile-name" onclick="jumpToStudent(${jsStringLiteral(student.name)}, ${jsStringLiteral(student.school)}, ${jsStringLiteral(student.class)})">${tmEscapeHtml(student.name || '-')}</a>
                            <div class="student-detail-mobile-submeta">${tmEscapeHtml(`${schoolText} · ${classText}`)}</div>
                        </div>
                        <div class="student-detail-mobile-score-summary">
                            <span>总分</span>
                            <strong>${tmEscapeHtml(totalText)}</strong>
                        </div>
                    </div>
                    <div class="student-detail-mobile-meta-grid">
                        ${metaCards}
                    </div>
                    <div class="student-detail-mobile-rank-grid">
                        ${rankCards}
                    </div>
                    <div class="student-detail-mobile-subject-grid">
                        ${subjectCards}
                    </div>
                </article>
            </td>
        </tr>
    `;
}

function shouldAutoFocusStudentDetailsDataOnMobile(reset) {
    if (!reset) return false;
    return document.body?.dataset?.mobileQuery === 'true' || window.innerWidth <= 768;
}

let __studentDetailsPrimaryFocusTimer = 0;
const STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS = [0, 120, 320, 760, 1280];

function focusStudentDetailsPrimaryFlow() {
    const section = document.getElementById('student-details');
    const firstCard = section?.querySelector('.student-detail-mobile-card');
    const primaryFlow = section?.querySelector('.student-details-primary-flow');
    const tableWrap = section?.querySelector('.table-wrap');
    const target = firstCard || primaryFlow || tableWrap || section;
    if (!target) return false;

    const appMain = document.querySelector('main.app-main');
    const mainCanScroll = appMain
        && typeof appMain.scrollTo === 'function'
        && (appMain.scrollHeight - appMain.clientHeight) > 24;
    if (mainCanScroll) {
        const nextTop = appMain.scrollTop + target.getBoundingClientRect().top - appMain.getBoundingClientRect().top - 16;
        appMain.scrollTo({ top: Math.max(0, nextTop), behavior: 'auto' });
        return true;
    }

    const scrollingEl = document.scrollingElement || document.documentElement || document.body;
    if (scrollingEl && typeof scrollingEl.scrollTo === 'function') {
        const currentTop = window.scrollY || scrollingEl.scrollTop || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const nextTop = currentTop + target.getBoundingClientRect().top - 16;
        scrollingEl.scrollTo({ top: Math.max(0, nextTop), behavior: 'auto' });
        return true;
    }

    if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return true;
    }
    return false;
}

function requestStudentDetailsPrimaryFocus(startIndex = 0) {
    if (!(document.body?.dataset?.mobileQuery === 'true' || window.innerWidth <= 768)) return;
    clearTimeout(__studentDetailsPrimaryFocusTimer);
    const initialIndex = Math.max(0, Math.min(Number(startIndex) || 0, STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS.length - 1));
    const runFocus = (index) => {
        const section = document.getElementById('student-details');
        if (!section || !section.classList.contains('active')) return;
        const target = section.querySelector('.student-detail-mobile-card')
            || section.querySelector('.student-details-primary-flow')
            || section.querySelector('.table-wrap')
            || section;
        const appMain = document.querySelector('main.app-main');
        const didScroll = focusStudentDetailsPrimaryFlow();
        const targetTop = target?.getBoundingClientRect?.().top ?? 0;
        const appTop = appMain?.getBoundingClientRect?.().top ?? 0;
        const aligned = !!target && Math.abs(targetTop - appTop) <= 96;
        if ((didScroll && aligned) || index >= (STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS.length - 1)) return;
        const nextIndex = index + 1;
        __studentDetailsPrimaryFocusTimer = window.setTimeout(() => runFocus(nextIndex), STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS[nextIndex]);
    };
    __studentDetailsPrimaryFocusTimer = window.setTimeout(() => runFocus(initialIndex), STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS[initialIndex]);
}
window.requestStudentDetailsPrimaryFocus = requestStudentDetailsPrimaryFocus;

function renderStudentReportSkeleton(container, student) {
    if (!container) return;
    container.innerHTML = `
        <div class="student-report-wide-card student-report-loading">
            <div class="report-wide-header">
                <div>
                    <h2>${student?.school || '学生'} 学业发展报告</h2>
                    <p>${student?.name || '正在生成'} · ${student?.class || ''}</p>
                </div>
                <span class="pill">生成中</span>
            </div>
            <div class="report-wide-grid">
                <div class="report-metric-card shimmer"></div>
                <div class="report-metric-card shimmer"></div>
                <div class="report-metric-card shimmer"></div>
                <div class="report-metric-card shimmer"></div>
            </div>
            <div class="report-wide-grid report-wide-grid--two">
                <div class="report-panel shimmer"></div>
                <div class="report-panel shimmer"></div>
            </div>
        </div>
    `;
}

function scheduleStudentReportCharts(student, history) {
    const chartKey = buildStudentReportCacheKey(student, 'CHARTS');
    const scheduleKey = `${chartKey}::${Array.isArray(history) ? history.length : 0}`;
    if (ReportHistoryPerfCache.lastChartScheduleKey === scheduleKey) return;
    ReportHistoryPerfCache.lastChartScheduleKey = scheduleKey;
    const { container } = getReportDomCache();
    if (container?.dataset.reportChartCacheKey === chartKey) return;
    const render = async () => {
        const currentContainer = document.getElementById('report-card-capture-area');
        if (currentContainer?.dataset.reportChartCacheKey === chartKey) return;
        if (typeof window.ensureReportChartRuntimeLoaded === 'function' && !window.__REPORT_CHART_RUNTIME_PATCHED__) {
            try {
                await window.ensureReportChartRuntimeLoaded();
            } catch (error) {
                console.warn('[report] chart runtime load failed:', error);
                return;
            }
        }
        try { if (typeof renderRadarChart === 'function') renderRadarChart(student, history); } catch (e) { console.error(e); }
        try { if (typeof renderVarianceChart === 'function') renderVarianceChart(student, history); } catch (e) { console.error(e); }
        if (currentContainer) currentContainer.dataset.reportChartCacheKey = chartKey;
    };
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(render, { timeout: 1200 });
    } else {
        setTimeout(render, 160);
    }
}

function scheduleStudentReportStrengthAnalysis(student, strengthKey) {
    if (!student || ReportHistoryPerfCache.lastStrengthKey === strengthKey) return;
    ReportHistoryPerfCache.lastStrengthKey = strengthKey;
    const run = async () => {
        try {
            if (typeof window.ensureReportChartRuntimeLoaded === 'function' && !window.__REPORT_CHART_RUNTIME_PATCHED__) {
                await window.ensureReportChartRuntimeLoaded();
            }
            if (typeof analyzeStrengthsAndWeaknesses === 'function') analyzeStrengthsAndWeaknesses(student);
        } catch (e) {
            console.error(e);
        }
    };
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
        window.SystemPerformance.scheduleIdle(run, { label: 'report-strength-analysis', delay: 260, timeout: 2500 });
    } else if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(run, { timeout: 2500 });
    } else {
        setTimeout(run, 260);
    }
}

function renderStudentDetails(reset = true) {
    closeAllMenus();

    if (reset) {
        STD_STATE.page = 1;
        STD_STATE.size = getStudentDetailsPageSize();
        const user = getCurrentUser();
        const role = user?.role || 'guest';
        const isClassTeacher = isStudentDetailsClassTeacher(user);
        const isTeacher = isStudentDetailsTeacher(user);
        const selectedSchool = document.getElementById('studentSchoolSelect')?.value;
        const selectedClass = document.getElementById('studentClassSelect')?.value;
        const boundSchool = isTeacher || isClassTeacher
            ? (selectedSchool || user?.school || MY_SCHOOL || '')
            : selectedSchool;
        const effectiveSelectedSchool = String(boundSchool || '').trim();
        const effectiveSelectedClass = String(selectedClass || '').trim();
        const hasSelectedSchool = effectiveSelectedSchool && !effectiveSelectedSchool.includes('请选择');
        const hasSelectedClass = effectiveSelectedClass && effectiveSelectedClass !== '全部';
        let data = window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function'
            ? window.RankingDataService.getRowsBySchoolClass(RAW_DATA, hasSelectedSchool ? effectiveSelectedSchool : '', hasSelectedClass ? effectiveSelectedClass : '')
            : [...RAW_DATA];

        const classTeacherMode = isClassTeacher ? getClassTeacherStudentViewMode() : 'teaching';
        const queryMode = isClassTeacher ? getStudentDetailsClassTeacherQueryMode(user, effectiveSelectedClass) : 'teaching';
        const activeFilterSignature = buildStudentDetailsFilterSignature();
        const querySignature = [
            Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
            String(window.__RAW_DATA_VERSION || 0),
            String(window.CURRENT_EXAM_ID || ''),
            String(RAW_DATA?.[0]?.name || ''),
            String(RAW_DATA?.[RAW_DATA.length - 1]?.name || ''),
            String(effectiveSelectedSchool || ''),
            String(effectiveSelectedClass || ''),
            hasSelectedSchool ? 'school' : 'all-school',
            hasSelectedClass ? 'class' : 'all-class',
            String(role || ''),
            String(user?.school || ''),
            String(user?.class_name || ''),
            String(user?.class || ''),
            String(user?.name || ''),
            classTeacherMode,
            queryMode,
            STD_STATE.sortCol || '',
            STD_STATE.sortDir || '',
            activeFilterSignature,
            Object.keys(SCHOOLS || {}).length
        ].join('::');
        if (StudentDetailsPerfCache.querySignature === querySignature && Array.isArray(StudentDetailsPerfCache.queryData)) {
            STD_STATE.cacheData = StudentDetailsPerfCache.queryData;
            STD_STATE.renderMeta = StudentDetailsPerfCache.queryMeta || buildStudentDetailsRenderMeta(STD_STATE.cacheData);
            STD_STATE.dataSignature = buildStudentDetailsDataSignature(STD_STATE.cacheData);
            STD_STATE.filterValueCache = Object.create(null);
        } else {
        data = PermissionPolicy.filterStudentRows(user, data, { mode: queryMode });
        appDebug('[考试明细] 当前用户:', user);

        if (hasSelectedSchool) {
            data = data.filter(s => sameAppSchoolName(s.school, effectiveSelectedSchool));
            if (hasSelectedClass) {
                data = data.filter(s => normalizeClass(s.class) === normalizeClass(effectiveSelectedClass));
            }
        } else if (hasSelectedClass) {
            data = data.filter(s => normalizeClass(s.class) === normalizeClass(effectiveSelectedClass));
        }

        const hasExcelFilters = Object.values(STD_STATE.activeFilters || {}).some(values => values && values.size > 0);
        const canUseAllRowsFallback = ['admin', 'director', 'grade_director'].includes(role);
        if (!data.length && canUseAllRowsFallback && !hasExcelFilters && !hasSelectedSchool && Array.isArray(RAW_DATA) && RAW_DATA.length) {
            data = [...RAW_DATA];
            appDebug('[考试明细] 检测到空首屏，已回落到当前成绩库数据');
        }

        Object.keys(STD_STATE.activeFilters).forEach(colKey => {
            const allowedValues = STD_STATE.activeFilters[colKey]; // Set 对象
            if (!allowedValues || allowedValues.size === 0) return;

            data = data.filter(s => {
                let val = getCellValue(s, colKey);
                return allowedValues.has(String(val));
            });
        });

        if (STD_STATE.sortCol) {
            const key = STD_STATE.sortCol;
            const dir = STD_STATE.sortDir === 'asc' ? 1 : -1;

            data.sort((a, b) => {
                let valA = getCellValue(a, key);
                let valB = getCellValue(b, key);

                if (valA === '-' || valA === undefined) valA = -9999;
                if (valB === '-' || valB === undefined) valB = -9999;

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return (valA - valB) * dir;
                }
                return String(valA).localeCompare(String(valB), 'zh-CN', { numeric: true }) * dir;
            });
        } else {
            data.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
        }

        STD_STATE.cacheData = data;
        STD_STATE.renderMeta = buildStudentDetailsRenderMeta(data);
        STD_STATE.dataSignature = buildStudentDetailsDataSignature(data);
        STD_STATE.filterValueCache = Object.create(null);
        StudentDetailsPerfCache.querySignature = querySignature;
        StudentDetailsPerfCache.queryData = data;
        StudentDetailsPerfCache.queryMeta = STD_STATE.renderMeta;
        }
    }

    const totalItems = STD_STATE.cacheData.length;
    STD_STATE.size = getStudentDetailsPageSize();
    const totalPages = Math.ceil(totalItems / STD_STATE.size) || 1;
    if (STD_STATE.page > totalPages) STD_STATE.page = totalPages;
    if (STD_STATE.page < 1) STD_STATE.page = 1;

    const startIdx = (STD_STATE.page - 1) * STD_STATE.size;
    const endIdx = startIdx + STD_STATE.size;
    const displaySourceList = STD_STATE.cacheData.slice(startIdx, endIdx);
    const comparisonContext = getCachedComparisonStudentRankContext(RAW_DATA);
    const displayList = displaySourceList.map((student) => getComparisonStudentView(student, RAW_DATA, comparisonContext));

    const dom = getStudentDetailsDomCache();
    const thead = dom.thead;
    const tbody = dom.tbody;
    const detailTable = dom.detailTable;
    const isMobileStudentDetails = isStudentDetailsMobileCardMode();
    const shouldAutoFocusData = shouldAutoFocusStudentDetailsDataOnMobile(reset);
    if (detailTable) {
        detailTable.classList.toggle('student-detail-mobile-table', isMobileStudentDetails);
        if (isMobileStudentDetails) {
            detailTable.classList.remove('mobile-card-table');
        }
    }

    const renderMeta = STD_STATE.renderMeta || buildStudentDetailsRenderMeta(STD_STATE.cacheData);
    STD_STATE.renderMeta = renderMeta;
    const isTeacher = renderMeta.isTeacher;
    const isClassTeacher = renderMeta.isClassTeacher;
    const visibleSubjects = renderMeta.visibleSubjects;
    const countyRankVisible = renderMeta.countyRankVisible;
    const townRankVisible = renderMeta.townRankVisible;

    let headerHTML = '';

    const buildTh = (label, colKey, width = 'auto') => {
        const isFiltered = STD_STATE.activeFilters[colKey] && STD_STATE.activeFilters[colKey].size > 0;
        const isSorted = STD_STATE.sortCol === colKey;
        const sortIcon = isSorted ? (STD_STATE.sortDir === 'asc' ? '↑' : '↓') : '';

        const activeClass = (isFiltered || isSorted) ? 'active' : '';

        return `
                <th style="min-width:${width}">
                    <div class="excel-header" onclick="toggleExcelMenu('${colKey}', event)">
                        <div class="header-text">${label} <span style="color:#2563eb">${sortIcon}</span></div>
                        <div class="filter-icon-btn ${activeClass}">
                            <i class="ti ti-filter"></i>
                        </div>
                        <!-- 下拉菜单容器，点击时动态填充 -->
                        <div id="menu-${colKey}" class="excel-filter-menu" onclick="event.stopPropagation()"></div>
                    </div>
                </th>
            `;
    };

    headerHTML += buildTh('学校', 'school', '120px');
    headerHTML += buildTh('班级', 'class', '80px');
    headerHTML += buildTh('姓名', 'name', '100px');
    if (!isTeacher && !isClassTeacher) {
        headerHTML += buildTh('考号', 'id', '100px');
        headerHTML += buildTh('考场', 'examRoom', '80px');
    }

    const isSingleSchool = isSingleSchoolMode();
    const townHeaderStyle = townRankVisible ? '' : 'display:none;'; // 没有全镇成绩时隐藏列
    const countyHeaderStyle = countyRankVisible ? '' : 'display:none;'; // 没有全县成绩时隐藏列

    visibleSubjects.forEach(sub => {
        headerHTML += buildTh(sub, sub, '80px');
        if (!isTeacher && !isClassTeacher) {
            headerHTML += `<th>校排</th><th style="${townHeaderStyle}">镇排</th><th style="${countyHeaderStyle}">县排</th>`;
        } else {
            headerHTML += `<th>级排</th><th style="${townHeaderStyle}">镇排</th><th style="${countyHeaderStyle}">县排</th>`;
        }
    });

    const totalLabel = CONFIG.name === '9年级' ? '五科总分' : '总分';
    if (!isTeacher && !isClassTeacher) {
        headerHTML += buildTh(totalLabel, 'total', '80px');
        headerHTML += `<th>班排</th><th>校排</th><th style="${townHeaderStyle}">镇排</th><th style="${countyHeaderStyle}">县排</th>`;
    } else {
        headerHTML += buildTh(totalLabel, 'total', '80px');
        headerHTML += `<th>班排</th><th>级排</th><th style="${townHeaderStyle}">镇排</th><th style="${countyHeaderStyle}">县排</th>`;
    }

    const headerSignature = [
        STD_STATE.dataSignature,
        isTeacher ? 'teacher' : 'staff',
        isClassTeacher ? 'class-teacher' : 'regular',
        visibleSubjects.join('|'),
        townRankVisible ? 'town' : 'no-town',
        countyRankVisible ? 'county' : 'no-county',
        STD_STATE.sortCol || '',
        STD_STATE.sortDir || '',
        buildStudentDetailsFilterSignature()
    ].join('::');
    setStudentDetailsHtmlIfChanged(thead, headerHTML, headerSignature);
    StudentDetailsPerfCache.headerHtmlSignature = headerSignature;
    StudentDetailsPerfCache.headerHtml = headerHTML;

    const bodySignature = [
        STD_STATE.dataSignature,
        STD_STATE.page,
        STD_STATE.size,
        isMobileStudentDetails ? 'mobile' : 'desktop',
        visibleSubjects.join('|'),
        buildStudentScoreAuditSignature(displaySourceList, visibleSubjects),
        townRankVisible ? 'town' : 'no-town',
        countyRankVisible ? 'county' : 'no-county'
    ].join('::');
    let bodyHTML = StudentDetailsPerfCache.bodyHtmlSignature === bodySignature
        ? StudentDetailsPerfCache.bodyHtml
        : '';
    let rowsHTML = '';
    if (!bodyHTML) {
    const rowsSignature = `${bodySignature}::${startIdx}::${endIdx}`;
    const cachedRowsHtml = isMobileStudentDetails
        ? (StudentDetailsPerfCache.mobileRowsSignature === rowsSignature ? StudentDetailsPerfCache.mobileRowsHtml : '')
        : (StudentDetailsPerfCache.desktopRowsSignature === rowsSignature ? StudentDetailsPerfCache.desktopRowsHtml : '');
    if (cachedRowsHtml) {
        rowsHTML = cachedRowsHtml;
    } else if (isMobileStudentDetails) {
        rowsHTML = displayList.map(student => (
            buildStudentDetailMobileRow(student, visibleSubjects, isTeacher, isClassTeacher, townRankVisible, countyRankVisible)
        )).join('');
        StudentDetailsPerfCache.mobileRowsSignature = rowsSignature;
        StudentDetailsPerfCache.mobileRowsHtml = rowsHTML;
    } else {
        rowsHTML = displayList.map(student => {
            const nameLink = `<a href="javascript:void(0)" onclick="jumpToStudent(${jsStringLiteral(student.name)}, ${jsStringLiteral(student.school)}, ${jsStringLiteral(student.class)})" style="color:var(--primary); font-weight:800;">${student.name}</a>`;
            const rank = getStudentDetailsRankSnapshot(student, visibleSubjects, townRankVisible, countyRankVisible, STD_STATE.dataSignature);

            let row = `<tr>
                    <td data-label="学校">${student.school}</td>
                    <td data-label="班级">${student.class}</td>
                    <td data-label="姓名">${nameLink}</td>
                    ${!isTeacher && !isClassTeacher ? `<td data-label="考号">${student.id}</td><td data-label="考场">${student.examRoom || '-'}</td>` : ''}`;

            visibleSubjects.forEach(sub => {
                const rankItem = rank?.subjects?.[sub] || {};
                const score = rankItem.score !== undefined ? rankItem.score : '-';
                const scoreDisplay = `${escapeAppHtml(String(score))}${buildStudentScoreAuditBadge(student, sub, escapeAppHtml)}`;

                const clickAttr = `onclick="updateStudentScore('${student.name}', '${student.class}', '${sub}', ${score})"`;

                if (!isTeacher && !isClassTeacher) {
                    row += `<td data-label="${sub}分数" ${clickAttr} style="cursor:pointer;" title="点击修改">${scoreDisplay}</td>
                                <td data-label="${sub}校排" class="text-gray">${rankItem.school ?? '-'}</td>
                                <td data-label="${sub}镇排" class="text-gray" style="${townHeaderStyle}">${rankItem.township ?? '-'}</td>
                                <td data-label="${sub}县排" class="text-gray" style="${countyHeaderStyle}">${rankItem.county ?? '-'}</td>`;
                } else {
                    row += `<td data-label="${sub}分数" ${clickAttr} style="cursor:pointer;" title="点击修改">${scoreDisplay}</td>
                                <td data-label="${sub}级排" class="text-gray">${rankItem.school ?? '-'}</td>
                                <td data-label="${sub}镇排" class="text-gray" style="${townHeaderStyle}">${rankItem.township ?? '-'}</td>
                                <td data-label="${sub}县排" class="text-gray" style="${countyHeaderStyle}">${rankItem.county ?? '-'}</td>`;
                }
            });

            if (!isTeacher && !isClassTeacher) {
                row += `<td data-label="总分" style="color:#2563eb; font-weight:bold;">${student.total}</td>
                            <td data-label="总分班排">${rank?.totalClass ?? '-'}</td>
                            <td data-label="总分校排">${rank?.totalSchool ?? '-'}</td>
                            <td data-label="总分镇排" style="${townHeaderStyle}">${rank?.totalTown ?? '-'}</td>
                            <td data-label="总分县排" style="${countyHeaderStyle}">${rank?.totalCounty ?? '-'}</td>
                        </tr>`;
            } else {
                row += `<td data-label="总分" style="color:#2563eb; font-weight:bold;">${student.total}</td>
                        <td data-label="总分班排">${rank?.totalClass ?? '-'}</td>
                        <td data-label="总分级排">${rank?.totalSchool ?? '-'}</td>
                        <td data-label="总分镇排" style="${townHeaderStyle}">${rank?.totalTown ?? '-'}</td>
                        <td data-label="总分县排" style="${countyHeaderStyle}">${rank?.totalCounty ?? '-'}</td>
                    </tr>`;
            }
            return row;
        }).join('');
        StudentDetailsPerfCache.desktopRowsSignature = rowsSignature;
        StudentDetailsPerfCache.desktopRowsHtml = rowsHTML;
    }

    const paginationSignature = `${bodySignature}::${totalItems}::${totalPages}::${STD_STATE.page}`;
    let paginationHTML = StudentDetailsPerfCache.paginationSignature === paginationSignature
        ? StudentDetailsPerfCache.paginationHtml
        : '';
    if (!paginationHTML) {
        paginationHTML = isMobileStudentDetails
            ? `
            <tr class="student-detail-mobile-pagination">
                <td colspan="100" class="student-detail-mobile-pagination-cell">
                    <div class="student-detail-mobile-pagination-bar">
                        <span>共 ${totalItems} 条 · ${STD_STATE.page}/${totalPages} 页</span>
                        <div class="student-detail-mobile-pagination-actions">
                            <button class="btn btn-sm" onclick="changeStdPage(-1)" ${STD_STATE.page === 1 ? 'disabled' : ''}>◀ 上一页</button>
                            <button class="btn btn-sm" onclick="changeStdPage(1)" ${STD_STATE.page === totalPages ? 'disabled' : ''}>下一页 ▶</button>
                        </div>
                    </div>
                </td>
            </tr>`
        : `
            <tr style="background:#f8fafc; font-weight:bold; position:sticky; bottom:0; z-index:150; border-top:2px solid #cbd5e1;">
                <td colspan="100" style="text-align:center; padding:8px;">
                    <div style="display:flex; align-items:center; justify-content:center; gap:15px;">
                        <span style="font-size:12px; color:#666;">共 ${totalItems} 条 · ${STD_STATE.page}/${totalPages} 页</span>
                        <button class="btn btn-sm" onclick="changeStdPage(-1)" ${STD_STATE.page === 1 ? 'disabled' : ''}>◀</button>
                        <button class="btn btn-sm" onclick="changeStdPage(1)" ${STD_STATE.page === totalPages ? 'disabled' : ''}>▶</button>
                    </div>
                </td>
            </tr>`;
        StudentDetailsPerfCache.paginationSignature = paginationSignature;
        StudentDetailsPerfCache.paginationHtml = paginationHTML;
    }

    bodyHTML = totalItems === 0
        ? `<tr><td colspan="100" style="text-align:center; padding:30px; color:#999;">无数据</td></tr>`
        : rowsHTML + paginationHTML;
    StudentDetailsPerfCache.bodyHtmlSignature = bodySignature;
    StudentDetailsPerfCache.bodyHtml = bodyHTML;
    }
    const bodyChanged = setStudentDetailsHtmlIfChanged(tbody, bodyHTML, bodySignature);

    const compareSection = dom.compareSection;
    if (compareSection && compareSection.style.display !== 'none') compareSection.style.display = 'none';

    const scrollSignature = `${bodySignature}::${reset ? 'reset' : 'page'}`;
    if (bodyChanged || STD_STATE.lastScrollSignature !== scrollSignature) {
        STD_STATE.lastScrollSignature = scrollSignature;
        setTimeout(() => {
            const tableWrap = getStudentDetailsDomCache().tableWrap;
            const isMobileViewport = document.body?.dataset?.mobileQuery === 'true' || window.innerWidth <= 768;
            if (isMobileViewport) {
                if (shouldAutoFocusData) {
                    requestStudentDetailsPrimaryFocus();
                }
                return;
            }
            if (tableWrap) {
                tableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
}

function getCellValue(student, colKey) {
    if (StudentDetailsPerfCache.cellValueSignature !== STD_STATE.dataSignature) {
        StudentDetailsPerfCache.cellValueSignature = STD_STATE.dataSignature;
        StudentDetailsPerfCache.cellValueByStudent = new WeakMap();
    }
    if (student && typeof student === 'object') {
        let cached = StudentDetailsPerfCache.cellValueByStudent.get(student);
        if (!cached) {
            cached = Object.create(null);
            StudentDetailsPerfCache.cellValueByStudent.set(student, cached);
        } else if (Object.prototype.hasOwnProperty.call(cached, colKey)) {
            return cached[colKey];
        }
        let value;
        if (colKey === 'total') value = Number.isFinite(Number(student.total)) ? student.total : getComparisonStudentView(student, RAW_DATA)?.total;
        else if (colKey === 'totalTScore') value = student.totalTScore;
        else if (['school', 'class', 'name', 'id', 'examRoom'].includes(colKey)) value = student[colKey];
        else value = student.scores?.[colKey] !== undefined ? student.scores[colKey] : '-';
        cached[colKey] = value;
        return value;
    }
    if (colKey === 'totalTScore') return student.totalTScore;
    if (['school', 'class', 'name', 'id', 'examRoom'].includes(colKey)) return student[colKey];
    return student.scores[colKey] !== undefined ? student.scores[colKey] : '-';
}

function toggleExcelMenu(colKey, event) {
    event.stopPropagation();

    const menuId = `menu-${colKey}`;
    const menu = document.getElementById(menuId);

    if (menu.classList.contains('show')) {
        menu.classList.remove('show');
        if (StudentDetailsPerfCache.openFilterMenu === menu) StudentDetailsPerfCache.openFilterMenu = null;
        return;
    }

    closeAllMenus();

    buildFilterMenuContent(colKey, menu);

    menu.classList.add('show');
    StudentDetailsPerfCache.openFilterMenu = menu;
}

function buildFilterMenuContent(colKey, container) {
    const cacheKey = `${STD_STATE.dataSignature || buildStudentDetailsDataSignature(STD_STATE.cacheData)}::${colKey}`;
    let sortedValues = STD_STATE.filterValueCache[cacheKey];
    if (!sortedValues) {
        const uniqueValues = new Set();
        STD_STATE.cacheData.forEach(s => {
            let val = getCellValue(s, colKey);
            uniqueValues.add(String(val));
        });

        sortedValues = Array.from(uniqueValues).sort((a, b) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b, 'zh-CN', { numeric: true });
        });
        STD_STATE.filterValueCache[cacheKey] = sortedValues;
    }

    const currentSet = STD_STATE.activeFilters[colKey];
    const isAllChecked = !currentSet;
    const menuSignature = `${cacheKey}::${isAllChecked ? 'all' : Array.from(currentSet || []).sort().join('|')}`;
    if (container?.dataset.studentDetailsFilterMenuSig === menuSignature) return;

    let listHtml = '';
    sortedValues.forEach(v => {
        const checked = isAllChecked || currentSet.has(v) ? 'checked' : '';
        listHtml += `
                <label class="menu-item">
                    <input type="checkbox" value="${v}" ${checked} class="filter-cb-${colKey}"> ${v}
                </label>`;
    });

    container.innerHTML = `
            <div class="menu-actions">
                <button class="btn btn-sm btn-gray" style="width:100%" onclick="applySort('${colKey}', 'asc')">⬆️ 升序排列</button>
                <button class="btn btn-sm btn-gray" style="width:100%" onclick="applySort('${colKey}', 'desc')">⬇️ 降序排列</button>
                <input type="text" class="menu-search" placeholder="搜索..." oninput="filterCheckboxList(this)">
            </div>
            <div class="menu-list">
                <label class="menu-item" style="font-weight:bold; border-bottom:1px solid #eee;">
                    <input type="checkbox" id="cb-all-${colKey}" ${isAllChecked ? 'checked' : ''} onchange="toggleAllCheckboxes('${colKey}', this)"> (全选)
                </label>
                ${listHtml}
            </div>
            <div class="menu-footer">
                <button class="btn btn-sm btn-primary" onclick="confirmFilter('${colKey}')">确定</button>
                <button class="btn btn-sm btn-gray" onclick="clearFilter('${colKey}')">重置</button>
            </div>
        `;
    container.dataset.studentDetailsFilterMenuSig = menuSignature;
}

window.applySort = function (colKey, dir) {
    STD_STATE.sortCol = colKey;
    STD_STATE.sortDir = dir;
    renderStudentDetails(true); // 重绘
};

window.filterCheckboxList = function (input) {
    const text = input.value.toLowerCase();
    if (StudentDetailsPerfCache.filterSearchCache.get(input) === text) return;
    StudentDetailsPerfCache.filterSearchCache.set(input, text);
    const list = input.closest('.menu-actions').nextElementSibling;
    const items = list.querySelectorAll('.menu-item');
    for (let i = 1; i < items.length; i++) {
        const itemText = items[i].innerText.toLowerCase();
        items[i].style.display = itemText.includes(text) ? 'flex' : 'none';
    }
};

window.toggleAllCheckboxes = function (colKey, source) {
    const cbs = document.querySelectorAll(`.filter-cb-${colKey}`);
    cbs.forEach(cb => {
        if (cb.parentElement.style.display !== 'none') {
            cb.checked = source.checked;
        }
    });
};

window.confirmFilter = function (colKey) {
    const cbs = document.querySelectorAll(`.filter-cb-${colKey}:checked`);
    const allCbs = document.querySelectorAll(`.filter-cb-${colKey}`);

    if (cbs.length === allCbs.length) {
        delete STD_STATE.activeFilters[colKey];
    } else {
        const selectedValues = new Set();
        cbs.forEach(cb => selectedValues.add(cb.value));
        STD_STATE.activeFilters[colKey] = selectedValues;
    }

    renderStudentDetails(true);
};

window.clearFilter = function (colKey) {
    delete STD_STATE.activeFilters[colKey];
    renderStudentDetails(true);
};

function closeAllMenus() {
    const openMenu = StudentDetailsPerfCache.openFilterMenu;
    if (openMenu?.classList?.contains('show')) {
        openMenu.classList.remove('show');
        StudentDetailsPerfCache.openFilterMenu = null;
        return;
    }
    document.querySelectorAll('.excel-filter-menu.show').forEach(el => el.classList.remove('show'));
    StudentDetailsPerfCache.openFilterMenu = null;
}

document.addEventListener('click', closeAllMenus);

window.changeStdPage = function (delta) {
    STD_STATE.page += delta;
    renderStudentDetails(false);
    const tableWrap = getStudentDetailsDomCache().tableWrap;
    if (tableWrap && tableWrap.scrollTop !== 0) tableWrap.scrollTop = 0;
};


function exportStudentDetails() {
    if (!RAW_DATA.length) { alert('请先上传数据'); return; }

    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const isClassTeacher = isStudentDetailsClassTeacher(user);
    const isTeacher = isStudentDetailsTeacher(user);
    const classTeacherMode = isClassTeacher ? getClassTeacherStudentViewMode() : 'teaching';
    const selectedSchool = document.getElementById('studentSchoolSelect').value;
    const selectedClass = document.getElementById('studentClassSelect').value;
    const queryMode = isClassTeacher ? getStudentDetailsClassTeacherQueryMode(user, selectedClass) : 'teaching';
    const useTeachingSubjectScope = (!isClassTeacher && isTeacher) || (isClassTeacher && queryMode === 'teaching');
    const needTeacherScope = useTeachingSubjectScope;
    const teacherScope = needTeacherScope ? getTeacherScopeForUser(user) : null;

    const isSingleSchool = Object.keys(SCHOOLS).length <= 1;

    const wb = XLSX.utils.book_new();

    const headers = isClassTeacher
        ? ['学校', '班级', '姓名']
        : (isTeacher
            ? ['学校', '班级', '姓名']
            : ['学校', '班级', '姓名', '考号', '考场']);

    const data = [headers];

    let studentsToShow = window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function'
        ? window.RankingDataService.getRowsBySchoolClass(
            RAW_DATA,
            selectedSchool && !selectedSchool.includes('请选择') ? selectedSchool : '',
            selectedClass && selectedClass !== '全部' ? selectedClass : ''
        )
        : [...RAW_DATA];
    if (window.PermissionPolicy && typeof window.PermissionPolicy.filterStudentRows === 'function') {
        studentsToShow = PermissionPolicy.filterStudentRows(user, studentsToShow, { mode: queryMode });
    } else if (useTeachingSubjectScope && teacherScope && teacherScope.classes.size > 0) {
        studentsToShow = studentsToShow.filter(s => {
            const rawClass = String(s.class || '').trim();
            const normalizedClass = normalizeClass(s.class);
            if (teacherScope.classes.has(normalizedClass) || teacherScope.classes.has(rawClass)) return true;
            for (const allowedCls of teacherScope.classes) {
                if (String(allowedCls).replace(/[\s\.]/g, '') === String(rawClass).replace(/[\s\.]/g, '')) {
                    return true;
                }
            }
            return false;
        });
    } else if (isClassTeacher && getStudentDetailsHomeroomClass(user)) {
        const myClass = getStudentDetailsHomeroomClass(user);
        studentsToShow = studentsToShow.filter(s => normalizeClass(s.class) === myClass);
    } else if (selectedSchool && !selectedSchool.includes('请选择') && !(window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function')) {
        studentsToShow = studentsToShow.filter(s => sameAppSchoolName(s.school, selectedSchool));
        if (selectedClass && selectedClass !== '全部') studentsToShow = studentsToShow.filter(s => normalizeClass(s.class) === normalizeClass(selectedClass));
    }

    if (selectedSchool && !selectedSchool.includes('请选择') && !(window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function')) {
        studentsToShow = studentsToShow.filter(s => sameAppSchoolName(s.school, selectedSchool));
    }
    if (selectedClass && selectedClass !== '全部' && !(window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function')) {
        studentsToShow = studentsToShow.filter(s => normalizeClass(s.class) === normalizeClass(selectedClass));
    }

    studentsToShow = getComparisonStudentList(studentsToShow, RAW_DATA);
    const subjectListForExport = getStudentDetailsSubjectList(studentsToShow);
    const visibleSubjects = useTeachingSubjectScope
        ? subjectListForExport.filter(s => teacherScope.subjects.has(normalizeSubject(s)))
        : subjectListForExport;
    studentsToShow.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
    const exportTownRankVisible = hasStudentTownshipRankData(studentsToShow, visibleSubjects);
    const exportCountyRankVisible = hasStudentCountyRankData(studentsToShow, visibleSubjects);

    headers.length = isClassTeacher
        ? 3
        : (isTeacher ? 3 : 5);
    visibleSubjects.forEach(subject => {
        if (isTeacher || isClassTeacher) {
            headers.push(`${subject} 分数`, `${subject} 级排`);
        } else {
            headers.push(`${subject} 分数`, `${subject} 校排`);
        }
        if (exportTownRankVisible) headers.push(`${subject} 镇排`);
        if (exportCountyRankVisible) headers.push(`${subject} 县排`);
    });

    if (!isClassTeacher && !isTeacher) {
        if (CONFIG.name === '9年级') {
            headers.push('五科总分', '五科班排', '五科校排');
            if (exportTownRankVisible) headers.push('五科镇排');
            if (exportCountyRankVisible) headers.push('五科县排');
        } else {
            headers.push('总分', '总分班排', '总分校排');
            if (exportTownRankVisible) headers.push('总分镇排');
            if (exportCountyRankVisible) headers.push('总分县排');
        }
    } else {
        headers.push(CONFIG.name === '9年级' ? '五科总分' : '总分', '总分班排', '总分级排');
        if (exportTownRankVisible) headers.push('总分镇排');
        if (exportCountyRankVisible) headers.push('总分县排');
    }

    studentsToShow.forEach(student => {
        const row = (isTeacher || isClassTeacher)
            ? [student.school, student.class, student.name]
            : [student.school, student.class, student.name, student.id, student.examRoom];
        const showTownRankForStudent = !isCountyDirectStudentForRank(student);

        visibleSubjects.forEach(subject => {
            if (isTeacher || isClassTeacher) {
                row.push(
                    student.scores[subject] || '-',
                    safeGet(student, `ranks.${subject}.school`, '-')
                );
                if (exportTownRankVisible) {
                    row.push(showTownRankForStudent ? getDisplayRankValue(student, `ranks.${subject}.township`, { scope: 'township' }) : '-');
                }
                if (exportCountyRankVisible) {
                    row.push(getStudentCountyRankValue(student, subject));
                }
            } else {
                row.push(
                    student.scores[subject] || '-',
                    safeGet(student, `ranks.${subject}.school`, '-')
                );
                if (exportTownRankVisible) {
                    row.push(showTownRankForStudent ? getDisplayRankValue(student, `ranks.${subject}.township`, { scope: 'township' }) : '-');
                }
                if (exportCountyRankVisible) {
                    row.push(getStudentCountyRankValue(student, subject));
                }
            }
        });

        if (!isClassTeacher && !isTeacher) {
            row.push(
                student.total,
                getDisplayRankValue(student, 'ranks.total.class', { scope: 'class' }),
                safeGet(student, 'ranks.total.school', '-')
            );
            if (exportTownRankVisible) {
                row.push(showTownRankForStudent ? getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' }) : '-');
            }
            if (exportCountyRankVisible) {
                row.push(getStudentCountyRankValue(student, 'total'));
            }
        } else {
            row.push(
                student.total,
                getDisplayRankValue(student, 'ranks.total.class', { scope: 'class' }),
                safeGet(student, 'ranks.total.school', '-')
            );
            if (exportTownRankVisible) {
                row.push(showTownRankForStudent ? getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' }) : '-');
            }
            if (exportCountyRankVisible) {
                row.push(getStudentCountyRankValue(student, 'total'));
            }
        }

        data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    decorateExcelSheet(ws, headers);

    XLSX.utils.book_append_sheet(wb, ws, '学生考试明细');
    if (isTeacher || isClassTeacher) {
        const exportTag = buildTeacherExportTag(user, new Set(visibleSubjects || []));
        XLSX.writeFile(wb, `学生考试明细_${exportTag}.xlsx`);
    } else {
        XLSX.writeFile(wb, '学生考试明细.xlsx');
    }
}
