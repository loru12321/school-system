(function (root, factory) {
    function installCompareCloudContext(target, runtime) {
        if (!target || !runtime) return runtime;
        const readContext = function () {
            if (typeof target.readCloudStudentCompareContextState === 'function') {
                return target.readCloudStudentCompareContextState() || null;
            }
            if (target.CompareSessionState && typeof target.CompareSessionState.getCloudStudentCompareContext === 'function') {
                return target.CompareSessionState.getCloudStudentCompareContext() || null;
            }
            return target.CLOUD_STUDENT_COMPARE_CONTEXT || null;
        };
        const resolveTargetUser = function () {
            const currentUser = typeof target.getCurrentUser === 'function'
                ? target.getCurrentUser()
                : (target.Auth && target.Auth.currentUser) || null;
            return typeof target.resolveCloudCompareTarget === 'function'
                ? target.resolveCloudCompareTarget(currentUser)
                : currentUser;
        };
        const resolveOptions = function () {
            return {
                normalizeCompareName: target.normalizeCompareName || runtime.normalizeCompareName,
                normalizeClass: target.normalizeClass
            };
        };
        target.CompareCloudContext = runtime;
        target.normalizeCompareCloudName = runtime.normalizeCompareName;
        target.normalizeCompareName = target.normalizeCompareName || runtime.normalizeCompareName;
        target.isCloudCompareClassEquivalent = function (a, b, normalizeClassFn) {
            return runtime.isClassEquivalent(a, b, { normalizeClass: normalizeClassFn });
        };
        target.isCloudCompareContextMatchStudent = runtime.isContextMatchStudent;
        target.isCloudCompareContextLikelyCurrentTarget = runtime.isLikelyCurrentTarget;
        target.isCloudContextMatchStudent = function (student) {
            return runtime.isContextMatchStudent(readContext(), student, resolveOptions());
        };
        target.isCloudContextLikelyCurrentTarget = function (student) {
            return runtime.isLikelyCurrentTarget(readContext(), student, resolveTargetUser(), resolveOptions());
        };
        return runtime;
    }

    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return installCompareCloudContext(overrideRoot || root || {}, factory(overrideRoot || root || {}));
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.CompareCloudContext) return;
    installCompareCloudContext(root, runtime);
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCompareCloudContextRuntime(root) {
    function normalizeString(value) {
        return String(value || '').trim();
    }

    function normalizeCompareName(name) {
        return normalizeString(name).replace(/\s+/g, '').toLowerCase();
    }

    function normalizeClassValue(normalizeClassFn, value) {
        const normalized = typeof normalizeClassFn === 'function'
            ? normalizeClassFn(value || '')
            : value;
        return normalizeString(normalized);
    }

    function resolveNormalizeName(options = {}) {
        return typeof options.normalizeCompareName === 'function'
            ? options.normalizeCompareName
            : normalizeCompareName;
    }

    function isClassEquivalent(a, b, options = {}) {
        const normalizeClassFn = options.normalizeClass || options.normalizeClassFn;
        const c1 = normalizeClassValue(normalizeClassFn, a);
        const c2 = normalizeClassValue(normalizeClassFn, b);
        if (!c1 || !c2) return false;
        if (c1 === c2) return true;
        const n1 = c1.replace(/0/g, '');
        const n2 = c2.replace(/0/g, '');
        return n1.length > 0 && n1 === n2;
    }

    function resolveClassEquivalent(options = {}) {
        return typeof options.isClassEquivalent === 'function'
            ? options.isClassEquivalent
            : function defaultClassEquivalent(a, b) {
                return isClassEquivalent(a, b, options);
            };
    }

    function isContextMatchStudent(context, student, options = {}) {
        if (!context || !student) return false;
        const owner = context.owner || {};
        const normalizeName = resolveNormalizeName(options);
        const classEquivalent = resolveClassEquivalent(options);
        const studentName = normalizeName(student.name || '');
        const studentClass = String(student.class || '');
        const ownerName = normalizeName(owner.name || '');
        const ownerClass = String(owner.class || '');
        return studentName === ownerName && classEquivalent(studentClass, ownerClass);
    }

    function isLikelyCurrentTarget(context, student, target, options = {}) {
        if (!context || !student) return false;
        const owner = context.owner || {};
        const normalizeName = resolveNormalizeName(options);
        const classEquivalent = resolveClassEquivalent(options);
        const studentName = normalizeName(student?.name || '');
        const ownerName = normalizeName(owner?.name || '');
        const targetName = normalizeName(target?.name || '');
        const ownerClass = String(owner?.class || '');
        const targetClass = String(target?.class || '');
        const studentClass = String(student?.class || '');

        const nameMatchByOwner = !!ownerName && studentName === ownerName;
        const nameMatchByTarget = !!targetName && studentName === targetName;
        const classMatchByOwner = !!ownerClass && classEquivalent(studentClass, ownerClass);
        const classMatchByTarget = !!targetClass && classEquivalent(studentClass, targetClass);

        if (nameMatchByOwner && (classMatchByOwner || !ownerClass)) return true;
        if (nameMatchByTarget && (classMatchByTarget || !targetClass)) return true;
        return nameMatchByOwner || nameMatchByTarget;
    }

    return {
        normalizeCompareName,
        isClassEquivalent,
        isContextMatchStudent,
        isLikelyCurrentTarget
    };
});
