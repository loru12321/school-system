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

const dataManagementModuleIds = ['starter-hub', 'upload', 'data-quality'];
for (const role of ['grade_director', 'class_teacher', 'teacher']) {
    const user = { role, roles: [role] };
    dataManagementModuleIds.forEach((moduleId) => {
        assert.strictEqual(
            context.PermissionPolicy.canAccessModule(user, moduleId),
            false,
            `${role} should not access data management module ${moduleId}`
        );
    });
}

const townModuleIds = ['summary', 'analysis', 'high-score', 'indicator', 'bottom3'];
for (const role of ['director', 'grade_director', 'class_teacher', 'teacher']) {
    const user = { role, roles: [role] };
    townModuleIds.forEach((moduleId) => {
        assert.strictEqual(
            context.PermissionPolicy.canAccessModule(user, moduleId),
            true,
            `${role} should access town analysis module ${moduleId}`
        );
    });
}

const directorTeachingModuleIds = [
    'teacher-analysis',
    'teacher-detail-comparison',
    'teacher-pairing',
    'teacher-township-ranking'
];
directorTeachingModuleIds.forEach((moduleId) => {
    assert.strictEqual(
        context.PermissionPolicy.canAccessModule({ role: 'director', roles: ['director'] }, moduleId),
        true,
        `director should access teaching management submodule ${moduleId}`
    );
});

['teacher-analysis', 'teacher-detail-comparison', 'teacher-pairing', 'teacher-township-ranking'].forEach((moduleId) => {
    assert.strictEqual(
        context.PermissionPolicy.canAccessModule({ role: 'grade_director', roles: ['grade_director'] }, moduleId),
        true,
        `grade director should access teaching management submodule ${moduleId}`
    );
});
for (const role of ['teacher', 'class_teacher']) {
    ['teacher-analysis', 'teacher-detail-comparison', 'teacher-pairing', 'teacher-township-ranking'].forEach((moduleId) => {
        assert.strictEqual(
            context.PermissionPolicy.canAccessModule({ role, roles: [role] }, moduleId),
            true,
            `${role} should access teaching analysis submodule ${moduleId}`
        );
    });
    ['teaching-overview', 'teaching-issue-board', 'teaching-warning-center', 'teaching-rectify-center', 'teaching-version-center'].forEach((moduleId) => {
        assert.strictEqual(
            context.PermissionPolicy.canAccessModule({ role, roles: [role] }, moduleId),
            false,
            `${role} should not access removed teaching management submodule ${moduleId}`
        );
    });
}

townModuleIds.forEach((moduleId) => {
    assert.strictEqual(
        context.PermissionPolicy.canAccessModule({ role: 'parent', roles: ['parent'] }, moduleId),
        false,
        `parent should not access town analysis module ${moduleId}`
    );
});

const studentDiagnosisModuleIds = [
    'zhongkao-countdown',
    'student-overview',
    'student-details',
    'subject-balance',
    'marginal-push',
    'progress-analysis',
    'cohort-growth',
    'potential-analysis',
    'segment-analysis',
    'correlation-analysis',
    'report-generator'
];
for (const role of ['teacher', 'class_teacher']) {
    studentDiagnosisModuleIds.forEach((moduleId) => {
        assert.strictEqual(
            context.PermissionPolicy.canAccessModule({ role, roles: [role] }, moduleId),
            moduleId === 'student-details',
            `${role} should only access student-details inside student diagnosis, not ${moduleId}`
        );
    });
}

assert.strictEqual(
    context.PermissionPolicy.canAccessModule({ role: 'teacher', roles: ['teacher'] }, 'county-teacher-portrait'),
    false,
    'teacher should not receive county teacher portrait access'
);
assert.strictEqual(
    context.PermissionPolicy.canAccessModule({ role: 'teacher', roles: ['teacher'] }, 'teacher-analysis'),
    true,
    'teacher should keep own teaching quality module access'
);
assert.strictEqual(
    context.PermissionPolicy.canAccessModule({ role: 'class_teacher', roles: ['class_teacher'] }, 'marginal-push'),
    false,
    'class teacher should only see student archive query inside student diagnosis'
);
assert.strictEqual(
    context.PermissionPolicy.canAccessModule({ role: 'class_teacher', roles: ['class_teacher'] }, 'county-school-horizontal'),
    false,
    'class teacher should not receive county horizontal analysis access'
);
assert.strictEqual(
    context.PermissionPolicy.canAccessModule({ role: 'grade_director', roles: ['grade_director'] }, 'county-analysis'),
    false,
    'grade director should not receive county-wide module access'
);
assert.strictEqual(
    context.PermissionPolicy.canAccessModule({ role: 'director', roles: ['director'] }, 'county-teacher-portrait'),
    true,
    'director should receive school management county context access'
);
assert.strictEqual(
    context.PermissionPolicy.canQueryClass(
        { role: 'director', roles: ['director'], school: '实验中学', class: '' },
        '实验中学',
        '9.1'
    ),
    true,
    'director should query every grade/class in own school without a bound grade'
);
assert.strictEqual(
    context.PermissionPolicy.canQueryClass(
        { role: 'director', roles: ['director'], school: '实验中学', class: '' },
        '外校',
        '9.1'
    ),
    false,
    'director should not query another school'
);
assert.strictEqual(
    context.PermissionPolicy.canQueryClass(
        { role: 'grade_director', roles: ['grade_director'], school: '实验中学', class: '9' },
        '实验中学',
        '9.1'
    ),
    true,
    'grade director should query own grade'
);
assert.strictEqual(
    context.PermissionPolicy.canQueryClass(
        { role: 'grade_director', roles: ['grade_director'], school: '实验中学', class: '9' },
        '实验中学',
        '8.1'
    ),
    false,
    'grade director should not query other grades'
);

context.getTeacherScopeForUser = () => ({ classes: new Set(['9.1']), subjects: new Set(['数学']) });
const mixedRows = [
    { school: '实验中学', class: '9.1', name: '张三', total: 500 },
    { school: '实验中学', class: '9.2', name: '李四', total: 490 },
    { school: '外校', class: '9.1', name: '王五', total: 480 }
];
assert.deepStrictEqual(
    context.PermissionPolicy.filterStudentRows({ role: 'teacher', roles: ['teacher'], school: '实验中学', name: '数学老师' }, mixedRows).map(row => row.name),
    ['张三'],
    'teacher should only search/query own teaching classes in own school'
);
assert.deepStrictEqual(
    context.PermissionPolicy.filterStudentRows({ role: 'class_teacher', roles: ['class_teacher'], school: '实验中学', class_name: '9.2', name: '班主任' }, mixedRows).map(row => row.name),
    ['张三', '李四'],
    'class teacher should query homeroom class plus teaching scope inside own school'
);
assert.strictEqual(
    context.PermissionPolicy.isClassTeacher({ role: 'teacher', roles: ['teacher', 'class_teacher'], school: '实验中学', class_name: '9.2' }),
    true,
    'query role union should recognize a teacher-primary account as class teacher when roles include class_teacher'
);
assert.strictEqual(
    context.PermissionPolicy.getHomeroomClass({ role: 'teacher', roles: ['teacher', 'class_teacher'], school: '实验中学', class_name: '9.2' }),
    '9.2',
    'homeroom class should use class_name when class is not populated'
);
assert.deepStrictEqual(
    context.PermissionPolicy.filterStudentRows(
        { role: 'teacher', roles: ['teacher', 'class_teacher'], school: '实验中学', class_name: '9.2', name: '班主任' },
        mixedRows,
        { mode: 'homeroom' }
    ).map(row => row.name),
    ['李四'],
    'class teacher homeroom mode should not leak teaching-only classes into class-all student diagnosis'
);
assert.deepStrictEqual(
    context.PermissionPolicy.filterStudentRows({ role: 'grade_director', roles: ['grade_director'], school: '实验中学', grade_name: '9年级' }, mixedRows).map(row => row.name),
    ['张三', '李四'],
    'grade director should query own grade inside own school only'
);
assert.deepStrictEqual(
    context.PermissionPolicy.filterStudentRows({ role: 'parent', roles: ['parent'], school: '实验中学', class_name: '9.1', name: '张三' }, mixedRows).map(row => row.name),
    ['张三'],
    'parent/student role should only query the bound student'
);
assert.ok(
    shellSource.includes("if (typeof canAccessModule === 'function' && !canAccessModule(item.id))"),
    'navigation should suppress any item rejected by permission policy'
);
assert.ok(
    shellSource.includes('resolveVisibleItems(category).length > 0'),
    'navigation should select the first accessible category instead of hard-coded role branches'
);

const spotlightSource = fs.readFileSync(path.join(root, 'public/assets/js/spotlight-context-runtime.js'), 'utf8');
assert.ok(
    spotlightSource.includes("typeof global.canAccessModule === 'function' && !global.canAccessModule(id)"),
    'spotlight module search should suppress inaccessible module hits'
);
assert.ok(
    spotlightSource.includes('PermissionPolicy.filterStudentRows(currentUser, matches)'),
    'spotlight student search should suppress inaccessible student hits'
);

console.log('permission policy runtime tests passed');
