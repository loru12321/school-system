const assert = require('assert');
const path = require('path');

const createAuthStateRuntime = require(path.resolve(__dirname, '../public/assets/js/auth-state-runtime.js'));

function createMockStorage(initialState = {}) {
    const state = new Map(Object.entries(initialState));
    return {
        getItem(key) {
            return state.has(key) ? state.get(key) : null;
        },
        setItem(key, value) {
            state.set(key, String(value));
        },
        removeItem(key) {
            state.delete(key);
        }
    };
}

function createMockBody() {
    const body = {
        dataset: {},
        className: 'shell role-legacy',
        classList: {
            add(name) {
                const next = new Set(String(body.className || '').split(/\s+/).filter(Boolean));
                next.add(name);
                body.className = Array.from(next).join(' ');
            }
        }
    };
    return body;
}

function run() {
    const root = {
        localStorage: createMockStorage(),
        sessionStorage: createMockStorage(),
        document: {
            body: createMockBody()
        }
    };
    const authState = createAuthStateRuntime(root);

    const sanitizedDb = authState.sanitizeLocalAuthDb({
        admin: { pass: 'admin123' },
        director: { pass: 'director123' },
        teachers: [
            { name: 'Teacher Default', pass: 'yssy2016' },
            { name: 'Teacher Custom', pass: 'custom123' }
        ],
        parents: [
            { name: 'Parent Local', class: '701', pass: '123456' },
            { name: 'Parent Variant', class: '9.04', pass: '123456' }
        ]
    });

    assert.strictEqual(sanitizedDb.admin.pass, authState.MASKED_PASSWORD_DISPLAY);
    assert.strictEqual(sanitizedDb.director.pass, authState.MASKED_PASSWORD_DISPLAY);
    assert.strictEqual(sanitizedDb.teachers[0].password_mode, 'default');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(sanitizedDb.teachers[0], 'pass'), false);
    assert.strictEqual(sanitizedDb.teachers[1].password_mode, 'custom');
    assert.strictEqual(sanitizedDb.teachers[1].pass, 'custom123');
    assert.strictEqual(authState.getManagedAccountPassword(sanitizedDb.teachers[0], 'teacher'), 'yssy2016');
    assert.strictEqual(authState.getManagedAccountPassword(sanitizedDb.parents[0], 'parent'), '123456');
    assert.strictEqual(authState.matchesManagedPassword(sanitizedDb.parents[0], 'parent', '123456'), true);

    authState.persistLocalAuthDb(sanitizedDb);
    const storedDb = JSON.parse(root.localStorage.getItem(authState.LOCAL_AUTH_DB_KEY));
    assert.strictEqual(storedDb.teachers[0].password_mode, 'default');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(storedDb.teachers[0], 'pass'), false);

    const currentUser = authState.setCurrentUser({
        name: 'Director User',
        role: 'director',
        roles: ['director', 'admin'],
        school: 'Demo School',
        class_name: '701'
    });

    assert.strictEqual(currentUser.role, 'admin');
    assert.deepStrictEqual(currentUser.roles, ['director', 'admin']);
    assert.strictEqual(root.sessionStorage.getItem(authState.SESSION_ROLE_KEY), 'admin');
    assert.deepStrictEqual(JSON.parse(root.sessionStorage.getItem(authState.SESSION_ROLES_KEY)), ['director', 'admin']);
    assert.strictEqual(authState.getCurrentRole(), 'admin');
    assert.deepStrictEqual(authState.getCurrentRoles(), ['director', 'admin']);

    authState.applyRolesToBody(currentUser);
    assert.strictEqual(root.document.body.dataset.role, 'admin');
    assert.ok(root.document.body.className.includes('role-admin'));
    assert.ok(root.document.body.className.includes('role-director'));

    assert.strictEqual(authState.normalizeClassName('9.4'), '9.4');
    assert.strictEqual(authState.normalizeClassName('94'), '9.4');
    assert.strictEqual(authState.normalizeClassName('904'), '9.4');
    assert.strictEqual(authState.normalizeClassName('9/04班'), '9.4');
    assert.strictEqual(authState.areEquivalentClasses('9.4', '94'), true);
    assert.strictEqual(authState.areEquivalentClasses('9.4', '904'), true);
    assert.strictEqual(authState.areEquivalentClasses('701', '7.01'), true);

    const parentMatch = authState.findManagedAccount(storedDb, 'Parent Local', '701');
    assert.strictEqual(parentMatch.role, 'parent');
    assert.strictEqual(authState.findManagedAccount(storedDb, 'Parent Variant', '9.4').record.class, '9.04');
    assert.strictEqual(authState.findManagedAccount(storedDb, 'Parent Variant', '94').record.class, '9.04');

    const teacherMatch = authState.findManagedAccount(storedDb, 'Teacher Default', '');
    assert.strictEqual(teacherMatch.role, 'teacher');

    authState.clearCurrentUser();
    assert.strictEqual(root.sessionStorage.getItem(authState.SESSION_USER_KEY), null);
    assert.strictEqual(authState.hasActiveSession(), false);

    console.log('auth-state-runtime tests passed');
}

run();
