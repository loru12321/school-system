const assert = require('assert');
const path = require('path');

const createTeacherRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-teacher-runtime.js'));

const rt = createTeacherRuntime({
    normalizeClass(v) {
        const s = String(v || '').trim();
        const map = { '六': '6', '七': '7', '八': '8', '九': '9' };
        const cn = s.match(/^([六七八九])年级?([一二三四五六七八九十\d]+)班?$/);
        if (cn) {
            const numMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
            const cls = numMap[cn[2]] || Number(cn[2]) || cn[2];
            return `${map[cn[1]]}.${cls}`;
        }
        return s;
    },
    normalizeSubject(v) {
        const s = String(v || '').trim();
        return s === '道法' || s === '道德与法治' ? '政治' : s;
    }
});

// 1. Parse real space-ledger roster sheet format (headers with parenthetical hints + Chinese class names)
const spaceLedgerRows = [
    {
        '姓名（必填）': '张老师',
        '登录邮箱（新教师必填）': 'zhang@school.edu.cn',
        '办公室': '崇德楼 3楼 语文组',
        '班主任班级（不当班主任留空）': '八年级一班',
        '任课班级（顿号分隔）': '八年级一班、八年级二班'
    },
    {
        '姓名（必填）': '李老师',
        '登录邮箱（新教师必填）': 'li@school.edu.cn',
        '办公室': '厚德楼 2楼 物理组',
        '班主任班级（不当班主任留空）': '',
        '任课班级（顿号分隔）': '8.1、8.2、8.3'
    },
    {
        '姓名（必填）': '王老师',
        '登录邮箱（新教师必填）': 'wang@school.edu.cn',
        '办公室': '行政楼 1楼',
        '班主任班级（不当班主任留空）': '',
        '任课班级（顿号分隔）': '8.4'
    }
];

const parsed = rt.parseSpaceLedgerRosterRows(spaceLedgerRows, { defaultSchool: '银山实验' });
assert.strictEqual(parsed.matched, true);
assert.strictEqual(parsed.assignments.length, 5);
assert.deepStrictEqual(parsed.assignments[0], { key: '8.1_语文', teacher: '张老师', school: '银山实验' });
assert.deepStrictEqual(parsed.assignments[1], { key: '8.2_语文', teacher: '张老师', school: '银山实验' });
assert.deepStrictEqual(parsed.assignments[2], { key: '8.1_物理', teacher: '李老师', school: '银山实验' });
assert.strictEqual(parsed.homerooms['8.1'], '张老师');
assert.strictEqual(parsed.skippedWithoutSubject.length, 1);
assert.strictEqual(parsed.skippedWithoutSubject[0].teacher, '王老师');

// 2. Non-space-ledger standard sheet should NOT match
const standardRows = [{ '班级': '8.1', '学科': '语文', '教师': '张老师' }];
assert.strictEqual(rt.parseSpaceLedgerRosterRows(standardRows).matched, false);

// 3. Export back to space-ledger roster format
const exported = rt.buildSpaceLedgerRosterExportRows(
    { '8.1_语文': '张老师', '8.2_语文': '张老师', '8.1_物理': '李老师' },
    { '8.1_语文': '银山实验', '8.2_语文': '银山实验', '8.1_物理': '银山实验' },
    { school: '银山实验' }
);
assert.strictEqual(exported.length, 3);
assert.strictEqual(exported[0][0], '姓名（必填）');
const zhangRow = exported.find((r) => r[0] === '张老师');
assert.ok(zhangRow, 'exported rows should include 张老师');
assert.strictEqual(zhangRow[2], '语文组');
assert.strictEqual(zhangRow[4], '8.1、8.2');

// 4. Stale cross-grade TEACHER_MAP (e.g. 7.x classes when current term is 8年级) must trigger cloud reload
let cloudReloadTriggered = false;
const staleRt = createTeacherRuntime({
    TEACHER_MAP: { '7.1_语文': '王旋', '7.3_语文': '郭延美' },
    getPreferredTeacherTermId() { return '2026-2027_上学期_8年级'; },
    resolveTeacherHistoryEntry() { return null; },
    CloudManager: {
        loadTeachers(opts) {
            cloudReloadTriggered = Boolean(opts && opts.force && opts.preferRemote);
            return Promise.resolve(true);
        }
    }
});
assert.strictEqual(staleRt.isTeacherMapCompatibleWithTerm({ '7.1_语文': '王旋' }, '2026-2027_上学期_8年级'), false);
assert.strictEqual(staleRt.isTeacherMapCompatibleWithTerm({ '8.1_语文': '郭延美' }, '2026-2027_上学期_8年级'), true);
assert.strictEqual(staleRt.ensureTeacherMap({}, true), false);
assert.strictEqual(cloudReloadTriggered, true, 'stale 7.x TEACHER_MAP must trigger cloud loadTeachers for 8年级');

console.log('space-ledger roster interop tests passed');
