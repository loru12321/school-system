const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const snapshotSource = read('scripts/test-calculation-snapshot.js');

const protectedPolicies = [
    'subjectFullScorePolicy',
    'blankSubjectScorePolicy',
    'classSchoolIsolationPolicy',
    'analyticsKernelSchoolAliasPolicy',
    'teacherCompareSchoolIsolationPolicy',
    'teacherTownshipValueMismatches',
    'teacherTownshipAverageMismatches',
    'currentExam'
];

protectedPolicies.forEach((token) => {
    assert.ok(snapshotSource.includes(token), `calculation snapshot must keep protected policy guard: ${token}`);
});

assert.ok(
    snapshotSource.includes('console.log(JSON.stringify(snapshot, null, 2))'),
    'calculation snapshot should print structured JSON for release comparison'
);
assert.strictEqual(
    scripts['test:calculation-snapshot:contract'],
    'node scripts/test-calculation-snapshot-contract.js',
    'package.json should expose the calculation snapshot source contract'
);
assert.ok(
    scripts['check:calculation']?.includes('test:calculation-snapshot:contract'),
    'calculation release check should run the source contract before browser snapshot'
);
assert.ok(
    scripts['check:calculation']?.includes('test:calculation-snapshot:local'),
    'calculation release check should use the freshly built local surface instead of a deployment-timed production request'
);

// ─── 两率赋分权重与后1/3系数：worker 侧与导出侧必须保持同一口径 ───────────────
//
// score2Rate / scoreBottom 有两处**各自独立**的实现，且都是活代码：
//   1) data-processing-worker.js「D. 学校综合排名」—— 网页侧，按乡镇范围归一
//   2) exam-analysis-package-runtime.js calculateMajorSubjectSnapshot() —— 分析包
//      导出侧，基于自建的主科 schoolsMap（学校集合与 worker 不同，故必须独立算）
// 两者不是冗余副本、不能合并，但常量一旦漂移就会造成 Excel 与网页背离 —— 与历史上
// 高中上线率门禁缺失同类的问题。这里锁定常量，让任何一侧改动都必须同步。
const workerSource = read('public/assets/js/data-processing-worker.js');
const packageRuntimeSource = read('public/assets/js/exam-analysis-package-runtime.js');

assert.ok(
    /let wAvg = 60, wExc = 70, wPass = 70;/.test(workerSource),
    'worker 侧非9年级两率权重必须保持 avg=60 exc=70 pass=70'
);
assert.ok(
    /wAvg = 50;[\s\S]{0,120}?wExc = 80;[\s\S]{0,120}?wPass = 50;/.test(workerSource),
    'worker 侧9年级两率权重必须保持 avg=50 exc=80 pass=50'
);
assert.ok(
    /\{ avg: 50, excellent: 80, pass: 50 \}/.test(packageRuntimeSource)
        && /\{ avg: 60, excellent: 70, pass: 70 \}/.test(packageRuntimeSource),
    '导出侧 getTwoRateWeightsForPackage 权重必须与 worker 侧一致（9年级 50/80/50，其余 60/70/70）'
);

// 后1/3 赋分满分系数（40）两侧都必须是 40。
assert.ok(
    /s\.bottom3\.avg \/ maxBAvg \* 40/.test(workerSource),
    'worker 侧后1/3 赋分系数必须保持 40'
);
assert.ok(
    /maxBottomAvg \* 40/.test(packageRuntimeSource),
    '导出侧后1/3 赋分系数必须保持 40'
);

// 高中上线率导出门禁必须 fail-closed（依赖缺失时返回 0，而不是跳过门禁）。
assert.ok(
    /typeof window\.isHighSchoolAdmissionExamAllowed !== 'function'\)\s*\{[\s\S]{0,240}?return 0;/
        .test(packageRuntimeSource),
    '导出侧高中上线率门禁必须 fail-closed：依赖缺失时返回 0'
);

console.log(JSON.stringify({
    ok: true,
    protectedPolicies: protectedPolicies.length,
    crossImplementationConstants: ['twoRateWeights', 'bottom3Coefficient', 'admissionGateFailClosed']
}, null, 2));
