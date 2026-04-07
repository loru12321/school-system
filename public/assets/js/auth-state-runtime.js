(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.AuthState) return;
    root.AuthState = runtime;
    root.MASKED_PASSWORD_DISPLAY = runtime.MASKED_PASSWORD_DISPLAY;
    root.sanitizeLocalAuthDb = runtime.sanitizeLocalAuthDb;
    root.persistLocalAuthDb = runtime.persistLocalAuthDb;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createAuthStateRuntime(root) {
    const MASKED_PASSWORD_DISPLAY = '已设置(不显示明文)';
    const SESSION_USER_KEY = 'CURRENT_USER';
    const SESSION_ROLE_KEY = 'CURRENT_ROLE';
    const SESSION_ROLES_KEY = 'CURRENT_ROLES';
    const LOCAL_AUTH_DB_KEY = 'SYS_USERS';
    const ROLE_HIERARCHY = ['admin', 'director', 'grade_director', 'class_teacher', 'teacher', 'parent', 'student', 'guest'];

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function normalizeClassName(value) {
        const raw = normalizeText(value)
            .replace(/[()（）]/g, '')
            .replace(/(?:班级|班|年级|grade|class)/gi, '')
            .replace(/[／/、_-]+/g, '.')
            .replace(/[·,，]+/g, '.')
            .replace(/\s+/g, '')
            .replace(/\.{2,}/g, '.')
            .replace(/^\./, '')
            .replace(/\.$/, '');

        if (!raw) return '';

        const digitChunks = raw.match(/\d+/g) || [];
        if ((raw.includes('.') || digitChunks.length >= 2) && digitChunks.length >= 2) {
            const grade = String(Number(digitChunks[0] || 0));
            const classNum = String(Number(digitChunks.slice(1).join('') || 0));
            if (grade && classNum) return `${grade}.${classNum}`;
        }

        const digitsOnly = raw.replace(/\D/g, '');
        if (/^[6-9]\d{1,3}$/.test(digitsOnly)) {
            return `${digitsOnly.charAt(0)}.${String(Number(digitsOnly.slice(1)))}`;
        }
        if (digitsOnly) return digitsOnly;
        return raw;
    }

    function areEquivalentClasses(left, right) {
        const normalizedLeft = normalizeClassName(left);
        const normalizedRight = normalizeClassName(right);
        if (!normalizedLeft || !normalizedRight) {
            return normalizedLeft === normalizedRight;
        }
        if (normalizedLeft === normalizedRight) return true;
        return normalizedLeft.replace(/[^\d]/g, '') === normalizedRight.replace(/[^\d]/g, '');
    }

    function getStorage(name) {
        try {
            const storage = root && root[name];
            if (!storage) return null;
            if (typeof storage.getItem !== 'function') return null;
            if (typeof storage.setItem !== 'function') return null;
            if (typeof storage.removeItem !== 'function') return null;
            return storage;
        } catch {
            return null;
        }
    }

    function safeParseJson(rawValue, fallbackValue) {
        if (!normalizeText(rawValue)) return fallbackValue;
        try {
            return JSON.parse(rawValue);
        } catch {
            return fallbackValue;
        }
    }

    function readJson(storage, key, fallbackValue) {
        if (!storage) return fallbackValue;
        return safeParseJson(storage.getItem(key), fallbackValue);
    }

    function writeJson(storage, key, value) {
        if (!storage) return;
        storage.setItem(key, JSON.stringify(value));
    }

    function getDefaultManagedPassword(role) {
        return normalizeText(role) === 'teacher' ? 'yssy2016' : '123456';
    }

    function isDefaultManagedPassword(role, password) {
        return normalizeText(password) === getDefaultManagedPassword(role);
    }

    function normalizeManagedLocalAccount(record, role) {
        const nextRecord = record && typeof record === 'object' ? { ...record } : {};
        const explicitPassword = normalizeText(nextRecord.pass);
        const storedMode = normalizeText(nextRecord.password_mode);
        const defaultPassword = getDefaultManagedPassword(role);

        if (explicitPassword && explicitPassword === defaultPassword) {
            delete nextRecord.pass;
            nextRecord.password_mode = 'default';
            return nextRecord;
        }

        if (explicitPassword) {
            nextRecord.password_mode = storedMode || 'custom';
            return nextRecord;
        }

        nextRecord.password_mode = storedMode || 'default';
        return nextRecord;
    }

    function getManagedAccountPassword(record, role) {
        const explicitPassword = normalizeText(record && record.pass);
        if (explicitPassword) return explicitPassword;
        const passwordMode = normalizeText(record && record.password_mode);
        if (!passwordMode || passwordMode === 'default') {
            return getDefaultManagedPassword(role);
        }
        return '';
    }

    function matchesManagedPassword(record, role, password) {
        return normalizeText(password) === getManagedAccountPassword(record, role);
    }

    function sanitizeLocalAuthDb(rawDb) {
        const source = rawDb && typeof rawDb === 'object' ? rawDb : {};
        const nextDb = {
            ...source,
            admin: {
                ...(source.admin && typeof source.admin === 'object' ? source.admin : {}),
                pass: MASKED_PASSWORD_DISPLAY,
                password_mode: 'masked'
            },
            teachers: Array.isArray(source.teachers)
                ? source.teachers.map((record) => normalizeManagedLocalAccount(record, 'teacher'))
                : [],
            parents: Array.isArray(source.parents)
                ? source.parents.map((record) => normalizeManagedLocalAccount(record, 'parent'))
                : []
        };

        if (source.director && typeof source.director === 'object') {
            nextDb.director = {
                ...source.director,
                pass: MASKED_PASSWORD_DISPLAY,
                password_mode: 'masked'
            };
        }

        return nextDb;
    }

    function readLocalAuthDb() {
        const storage = getStorage('localStorage');
        const fallbackDb = {
            admin: { pass: MASKED_PASSWORD_DISPLAY, password_mode: 'masked' },
            teachers: [],
            parents: []
        };
        return sanitizeLocalAuthDb(readJson(storage, LOCAL_AUTH_DB_KEY, fallbackDb));
    }

    function persistLocalAuthDb(rawDb) {
        const safeDb = sanitizeLocalAuthDb(rawDb);
        const storage = getStorage('localStorage');
        if (storage) writeJson(storage, LOCAL_AUTH_DB_KEY, safeDb);
        return safeDb;
    }

    function getUserRoles(user) {
        if (!user || typeof user !== 'object') return ['guest'];
        const rawRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
        const roles = rawRoles.map((role) => normalizeText(role)).filter(Boolean);
        return roles.length ? Array.from(new Set(roles)) : ['guest'];
    }

    function getPrimaryRole(user) {
        const roles = getUserRoles(user);
        for (const role of ROLE_HIERARCHY) {
            if (roles.includes(role)) return role;
        }
        return roles[0] || 'guest';
    }

    function normalizeSessionUser(user) {
        if (!user || typeof user !== 'object') return null;
        const normalized = { ...user };
        normalized.role = getPrimaryRole(user);
        normalized.roles = getUserRoles(user);
        if ('name' in normalized) normalized.name = normalizeText(normalized.name);
        if ('school' in normalized) normalized.school = normalizeText(normalized.school);
        if ('class' in normalized) normalized.class = normalizeText(normalized.class);
        if ('class_name' in normalized) normalized.class_name = normalizeText(normalized.class_name);
        if ('teacher_name' in normalized) normalized.teacher_name = normalizeText(normalized.teacher_name);
        if ('username' in normalized) normalized.username = normalizeText(normalized.username);
        return normalized;
    }

    function getCurrentUser() {
        if (root.Auth && root.Auth.currentUser) {
            return normalizeSessionUser(root.Auth.currentUser);
        }
        const storage = getStorage('sessionStorage');
        return normalizeSessionUser(readJson(storage, SESSION_USER_KEY, null));
    }

    function setCurrentUser(user) {
        const normalizedUser = normalizeSessionUser(user);
        const storage = getStorage('sessionStorage');
        if (!normalizedUser) {
            clearCurrentUser();
            return null;
        }
        if (storage) {
            writeJson(storage, SESSION_USER_KEY, normalizedUser);
            storage.setItem(SESSION_ROLE_KEY, normalizedUser.role);
            writeJson(storage, SESSION_ROLES_KEY, normalizedUser.roles);
        }
        if (root.Auth && typeof root.Auth === 'object') {
            root.Auth.currentUser = normalizedUser;
        }
        root.CURRENT_USER = normalizedUser;
        return normalizedUser;
    }

    function clearCurrentUser() {
        const storage = getStorage('sessionStorage');
        if (storage) {
            storage.removeItem(SESSION_USER_KEY);
            storage.removeItem(SESSION_ROLE_KEY);
            storage.removeItem(SESSION_ROLES_KEY);
        }
        if (root.Auth && typeof root.Auth === 'object') {
            root.Auth.currentUser = null;
        }
        if (typeof root.CURRENT_USER !== 'undefined') {
            try {
                delete root.CURRENT_USER;
            } catch {
                root.CURRENT_USER = null;
            }
        }
    }

    function getCurrentRole() {
        const user = getCurrentUser();
        return normalizeText(user && user.role) || normalizeText(root.document && root.document.body && root.document.body.dataset && root.document.body.dataset.role) || 'guest';
    }

    function getCurrentRoles() {
        const user = getCurrentUser();
        return getUserRoles(user);
    }

    function hasRole(user, roleName) {
        return getUserRoles(user).includes(normalizeText(roleName));
    }

    function hasAnyRole(user, roleNames) {
        const expectedRoles = Array.isArray(roleNames) ? roleNames : [roleNames];
        const roleSet = new Set(getUserRoles(user));
        return expectedRoles.some((role) => roleSet.has(normalizeText(role)));
    }

    function hasAllRoles(user, roleNames) {
        const expectedRoles = Array.isArray(roleNames) ? roleNames : [roleNames];
        const roleSet = new Set(getUserRoles(user));
        return expectedRoles.every((role) => roleSet.has(normalizeText(role)));
    }

    function hasActiveSession(explicitUser) {
        return !!normalizeSessionUser(explicitUser || getCurrentUser());
    }

    function applyRolesToBody(user) {
        const body = root.document && root.document.body;
        if (!body) return getPrimaryRole(user);

        const roles = getUserRoles(user);
        const primaryRole = getPrimaryRole(user);

        body.dataset.role = primaryRole;
        body.className = body.className.replace(/\brole-\w+\b/g, '').trim();
        roles.forEach((role) => {
            body.classList.add(`role-${role}`);
        });
        return primaryRole;
    }

    function findManagedAccount(authDb, username, className) {
        const normalizedUsername = normalizeText(username);
        const normalizedClass = normalizeClassName(className);
        const rawClass = normalizeText(className);
        const safeDb = sanitizeLocalAuthDb(authDb);

        const parent = safeDb.parents.find((record) =>
            normalizeText(record && record.name) === normalizedUsername
            && (() => {
                const recordClass = normalizeText(record && record.class);
                const normalizedRecordClass = normalizeClassName(recordClass);
                if (normalizedClass && normalizedRecordClass) {
                    return areEquivalentClasses(normalizedRecordClass, normalizedClass);
                }
                return recordClass === rawClass;
            })()
        );
        if (parent) return { role: 'parent', record: parent };

        const teacher = safeDb.teachers.find((record) =>
            normalizeText(record && record.name) === normalizedUsername
        );
        if (teacher) return { role: 'teacher', record: teacher };

        return null;
    }

    return {
        MASKED_PASSWORD_DISPLAY,
        SESSION_USER_KEY,
        SESSION_ROLE_KEY,
        SESSION_ROLES_KEY,
        LOCAL_AUTH_DB_KEY,
        ROLE_HIERARCHY,
        normalizeText,
        getDefaultManagedPassword,
        isDefaultManagedPassword,
        normalizeManagedLocalAccount,
        getManagedAccountPassword,
        matchesManagedPassword,
        sanitizeLocalAuthDb,
        readLocalAuthDb,
        persistLocalAuthDb,
        getUserRoles,
        getPrimaryRole,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        normalizeSessionUser,
        getCurrentUser,
        setCurrentUser,
        clearCurrentUser,
        getCurrentRole,
        getCurrentRoles,
        hasActiveSession,
        applyRolesToBody,
        normalizeClassName,
        areEquivalentClasses,
        findManagedAccount
    };
});
