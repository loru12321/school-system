// 届别身份与跨届守卫契约（docs/cohort-identity-contract.md）的守卫清单必须在源码中一一存在。
// 这里只锁“行为片段”，不锁整行源码，避免重构时假红。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('public/assets/js/app.js');
const cohortDb = read('public/assets/js/cohort-db-core-runtime.js');
const cloudWorkspace = read('public/assets/js/cloud-workspace-runtime.js');
const orchestrator = read('public/assets/js/data-processing-orchestrator-runtime.js');
const authLogin = read('public/assets/js/auth-login-runtime.js');
const doc = read('docs/cohort-identity-contract.md');

// 文档存在且列出四个身份量与守卫清单
['__LOCKED_LOGIN_COHORT_ID__', 'CURRENT_COHORT_ID', 'CURRENT_PROJECT_KEY', 'CURRENT_EXAM_ID', 'syncCurrentExam', 'fetchCohortExamsToLocal', 'isRunStale'].forEach((needle) => {
    assert.ok(doc.includes(needle) || (needle === 'isRunStale' && doc.includes('整轮作废')), `contract doc must mention ${needle}`);
});

// 读侧：syncDataRuntimeState 用显式身份优先于存储指针
assert.ok(/patch\.currentExamId \|\| patch\.CURRENT_EXAM_ID \|\| window\.CURRENT_EXAM_ID/.test(app),
    'syncDataRuntimeState must prefer the explicit patch identity before falling back to stored pointers');
assert.ok(/blocked cross-cohort data write/.test(app), 'syncDataRuntimeState must keep the cross-cohort data guard');
assert.ok(/blocked cross-cohort raw data write/.test(app), 'setRawData must keep the lock-based guard');

// 套用考试：显式身份 + 读侧拒绝
assert.ok(/currentExamId: examId,\s*currentCohortId: examCohortId/.test(cohortDb),
    'applyExamToWorkspace must pass the exam identity into the guard');
assert.ok(/blocked cross-cohort exam apply/.test(cohortDb), 'applyExamToWorkspace must reject foreign exams');

// 写侧：syncCurrentExam 拒写外届考试
assert.ok(/blocked cross-cohort exam write/.test(cohortDb), 'syncCurrentExam must reject writing foreign exams into the cohort db');

// 拉云端：锁定届别放行
assert.ok(/lockedCohortId === cid/.test(cloudWorkspace), 'fetchCohortExamsToLocal must let the locked cohort through stale pointers');
assert.ok(/staleCohort: true/.test(cloudWorkspace), 'fetchCohortExamsToLocal must still skip genuinely stale cross-cohort tasks');

// 计算回写：过期 Worker 结果整轮作废（编排器与 app.js 兜底路径都要有）
assert.ok(/o\.isRunStale\(\)/.test(orchestrator), 'orchestrator must discard stale worker results');
assert.ok(/const isRunStale = \(\) => RAW_DATA !== runRows/.test(app), 'processData must bind the run to its RAW_DATA generation');
assert.ok(/if \(isRunStale\(\)\) \{/.test(app), 'fallback processData path must also discard stale worker results');

// 会话恢复：按锁定届别拉考试
assert.ok(/fetchCohortExamsToLocal\(preferredSessionCohort/.test(authLogin),
    'session restore must fetch the locked cohort\'s own exams when the global pointer is blocked');
assert.ok(/writeWorkspaceCohortId\(preferredSessionCohort\)/.test(authLogin),
    'session restore must realign CURRENT_COHORT_ID with the session cohort before fetching');

console.log('cohort identity contract passed');
