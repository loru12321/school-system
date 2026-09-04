// 教学工作台届别年级：必须以“当前加载的考试”为准，日期推算只做兜底。
// 回归背景：2026-09-01 学年翻篇后，2023 级按日期算成 9 年级，但数据仍是 8 年级期末，
// 8.x 班被 isAllowedGrade 全部过滤，座位/排考/排课空班级，新生分班误判“已到 9 年级”。
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/teaching-workbench-cohort-runtime.js'), 'utf8');

function boot(globals) {
    const context = {
        console,
        localStorage: { getItem: () => null },
        document: { getElementById: () => null, querySelector: () => null, readyState: 'complete', addEventListener() {} },
        addEventListener() {},
        Date,
        ...globals
    };
    context.window = context;
    vm.runInNewContext(source, context, { filename: 'teaching-workbench-cohort-runtime.js' });
    return context.TeachingWorkbenchCohort;
}

// 1. 9 月翻篇后、只有 8 年级期末数据：年级必须按考试算成 8，8.x 班可用，新生分班目标为 9。
{
    const api = boot({
        CURRENT_COHORT_ID: '2023',
        CURRENT_COHORT_META: { id: '2023', year: '2023' },
        CURRENT_EXAM_ID: '2023级-8年级-2025-2026-下学期-期末-2026-07-02',
        CONFIG: { name: '8年级' }
    });
    assert.strictEqual(api.currentGrade(), 8, 'grade must follow the loaded exam, not the calendar');
    assert.strictEqual(api.targetGrade(), 9);
    assert.strictEqual(api.isAllowedGrade('8.3'), true, '8.x classes of the 8th-grade exam must be allowed');
    assert.strictEqual(api.isAllowedGrade('9.1'), false);
    assert.strictEqual(api.isAllowedGrade('9.1', { target: true }), true, 'freshman target classes are 9.x');
    assert.strictEqual(api.cohortLabel(), '2023级 · 8年级');
}

// 2. 上传了 9 年级考试后自动跟上。
{
    const api = boot({
        CURRENT_COHORT_ID: '2023',
        CURRENT_COHORT_META: { id: '2023', year: '2023' },
        CURRENT_EXAM_ID: '2023级-9年级-2026-2027-上学期-月考-2026-10-08',
        CONFIG: { name: '9年级' }
    });
    assert.strictEqual(api.currentGrade(), 9);
    assert.strictEqual(api.targetGrade(), 0, 'no freshman target beyond grade 9');
    assert.strictEqual(api.isAllowedGrade('8.3'), false);
}

// 3. 考试 ID 没有年级时退到存档 meta，再退到精确的 CONFIG.name；旧默认名 '6-8年级' 不能被当成 6。
{
    const api = boot({
        CURRENT_COHORT_ID: '2024',
        CURRENT_EXAM_ID: 'custom-exam',
        readArchiveMeta: () => ({ grade: '7' }),
        CONFIG: { name: '6-8年级' }
    });
    assert.strictEqual(api.currentGrade(), 7);
}
{
    const api = boot({ CURRENT_COHORT_ID: '2024', CURRENT_EXAM_ID: 'custom-exam', CONFIG: { name: '7年级' } });
    assert.strictEqual(api.currentGrade(), 7);
}

// 4. 没有任何考试信息时才按入学年份 + 日期兜底（保持原行为）。
{
    const api = boot({ CURRENT_COHORT_ID: '2025', CONFIG: { name: '6-8年级' } });
    const now = new Date();
    const academicStart = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
    assert.strictEqual(api.currentGrade(), Math.min(9, Math.max(6, 6 + academicStart - 2025)));
}
// 类名不含年级数字时一律放行。
{
    const api = boot({ CURRENT_COHORT_ID: '2023', CURRENT_EXAM_ID: '2023级-8年级-x', CONFIG: { name: '8年级' } });
    assert.strictEqual(api.isAllowedGrade('一班'), true);
}

console.log('test-teaching-workbench-cohort-runtime passed');
