const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const permissionSource = fs.readFileSync(path.join(root, 'public/assets/js/permission-policy-runtime.js'), 'utf8');
const shellSource = fs.readFileSync(path.join(root, 'public/assets/js/shell-runtime.js'), 'utf8');

const context = {
    window: {},
    normalizeClass(value) {
        return String(value || '').trim();
    },
    readCurrentSchool() {
        return '';
    },
    getTeacherScopeForUser() {
        return { classes: new Set(), subjects: new Set() };
    },
    getCurrentUser() {
        return null;
    }
};
context.window = context;

vm.runInNewContext(permissionSource, context, { filename: 'permission-policy-runtime.js' });

const townModuleIds = ['summary', 'analysis', 'high-score', 'indicator', 'bottom3'];
for (const role of ['director', 'grade_director']) {
    const user = { role, roles: [role] };
    townModuleIds.forEach((moduleId) => {
        assert.strictEqual(
            context.PermissionPolicy.canAccessModule(user, moduleId),
            true,
            `${role} should access town analysis module ${moduleId}`
        );
    });
}

assert.strictEqual(
    context.PermissionPolicy.canAccessModule({ role: 'teacher', roles: ['teacher'] }, 'summary'),
    false,
    'teacher should not receive town-wide summary access'
);
assert.ok(
    shellSource.includes("if (typeof canAccessModule === 'function' && !canAccessModule(item.id))"),
    'navigation should suppress any item rejected by permission policy'
);

console.log('permission policy runtime tests passed');
