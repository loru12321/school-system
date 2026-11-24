const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/starter-status-runtime.js'), 'utf8');

const sandbox = {
    window: {},
    localStorage: {
        getItem() { return null; },
        setItem() {},
        removeItem() {}
    },
    console
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'starter-status-runtime.js' });

const api = sandbox.NewAcademicYearReadiness;
assert.ok(api && typeof api.evaluateNewAcademicYearReadiness === 'function', 'NewAcademicYearReadiness API should be exported');

// 1. Inside Aug 1 - Sep 15 rollover window -> always show even if cohort exists
const augState = api.evaluateNewAcademicYearReadiness({
    now: new Date('2026-08-20T08:00:00Z'),
    existingCohorts: ['2023', '2024', '2025', '2026'],
    hasTeacherMap: true,
    dismissed: false,
    isAdminOrDirector: true
});
assert.strictEqual(augState.shouldShow, true);
assert.strictEqual(augState.inRolloverWindow, true);
assert.strictEqual(augState.academicYearLabel, '2026-2027');
assert.strictEqual(augState.incomingCohortYear, '2026');
assert.strictEqual(augState.graduatedCohortYear, '2022');

// 2. Outside rollover window, incoming cohort already exists -> hidden
const novReady = api.evaluateNewAcademicYearReadiness({
    now: new Date('2026-11-24T08:00:00Z'),
    existingCohorts: ['2023', '2024', '2025', '2026'],
    hasTeacherMap: true,
    dismissed: false,
    isAdminOrDirector: true
});
assert.strictEqual(novReady.shouldShow, false);
assert.strictEqual(novReady.inRolloverWindow, false);

// 3. Outside rollover window, incoming cohort missing -> show reminder
const novMissing = api.evaluateNewAcademicYearReadiness({
    now: new Date('2026-11-24T08:00:00Z'),
    existingCohorts: ['2023', '2024', '2025'],
    hasTeacherMap: false,
    dismissed: false,
    isAdminOrDirector: true
});
assert.strictEqual(novMissing.shouldShow, true);
assert.strictEqual(novMissing.hasIncomingCohort, false);

// 4. Dismissed or non-admin role -> hidden
const dismissedState = api.evaluateNewAcademicYearReadiness({
    now: new Date('2026-09-01T08:00:00Z'),
    existingCohorts: ['2023', '2024', '2025'],
    dismissed: true,
    isAdminOrDirector: true
});
assert.strictEqual(dismissedState.shouldShow, false);

const teacherRoleState = api.evaluateNewAcademicYearReadiness({
    now: new Date('2026-09-01T08:00:00Z'),
    existingCohorts: ['2023', '2024', '2025'],
    dismissed: false,
    isAdminOrDirector: false
});
assert.strictEqual(teacherRoleState.shouldShow, false);

console.log('new academic year readiness tests passed');
