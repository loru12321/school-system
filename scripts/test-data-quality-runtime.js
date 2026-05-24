const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const runtimePath = path.join(projectRoot, 'public/assets/js/data-quality-runtime.js');
const indexPath = path.join(projectRoot, 'src/index.html');
const createDataQualityRuntime = require(runtimePath);

function assertCleanUserCopy(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const forbiddenTokens = ['\uFFFD', '\u93c1\u7248\u5d41', '\u7f02\u54c4', '\u7035\u7161', '\u95c2\u4729'];
  const hits = forbiddenTokens.filter((token) => text.includes(token));
  assert.deepStrictEqual(hits, [], `${path.relative(projectRoot, filePath)} contains mojibake tokens: ${hits.join(', ')}`);
  assert.ok(text.includes('\u6570\u636e\u8d28\u91cf\u4f53\u68c0'), `${path.relative(projectRoot, filePath)} should keep clean data quality title copy`);
}

assertCleanUserCopy(runtimePath);
assertCleanUserCopy(indexPath);

const root = {
  SUBJECTS: ['语文', '数学'],
  CONFIG: {
    fullScore: {
      语文: 120,
      数学: 120
    }
  },
  RAW_DATA: [
    { school: '一中', class: '1班', name: '张三', examNo: '001', scores: { 语文: 100, 数学: 121 } },
    { school: '一中', class: '1班', name: '张三', examNo: '001', scores: { 语文: 98, 数学: 110 } },
    { school: '', class: '2班', name: '', examNo: '003', scores: { 语文: 'abc' } },
    { school: '二中', class: '2班', name: '李四', examNo: '004', scores: { 语文: 90 } }
  ]
};

const runtime = createDataQualityRuntime(root);
const result = runtime.analyze();
const issueTypes = result.issues.map((issue) => issue.type);

assert.strictEqual(result.rowCount, 4);
assert.strictEqual(result.schoolCount, 2);
assert.ok(issueTypes.includes('score-out-of-range'), 'should flag score out of configured full score');
assert.ok(issueTypes.includes('duplicate-identity'), 'should flag duplicate identity');
assert.ok(issueTypes.includes('missing-school'), 'should flag missing school');
assert.ok(issueTypes.includes('missing-name'), 'should flag missing name');
assert.ok(issueTypes.includes('invalid-score'), 'should flag invalid numeric score');
assert.ok(issueTypes.includes('subject-missing-high'), 'should flag high subject missing ratio');
assert.ok(result.highCount >= 4, 'high severity issue count should be summarized');

const cohortRuntime = createDataQualityRuntime({
  SUBJECTS: ['语文'],
  CURRENT_EXAM_ID: 'exam-a',
  COHORT_DB: {
    exams: {
      'exam-a': {
        createdAt: 1,
        data: [
          { school: '三中', class: '1班', name: '王五', examNo: '101', scores: { 语文: 88 } }
        ]
      }
    }
  }
});
const cohortResult = cohortRuntime.analyze();
assert.strictEqual(cohortResult.rowCount, 1, 'should read current cohort exam rows when RAW_DATA is empty');
assert.strictEqual(cohortResult.schoolCount, 1);

const limitedRuntime = createDataQualityRuntime({
  SUBJECTS: ['语文'],
  RAW_DATA: Array.from({ length: 5 }, (_, index) => ({
    school: '',
    class: '',
    name: '',
    examNo: String(index + 1),
    scores: { 语文: 'bad' }
  }))
});
const limitedResult = limitedRuntime.analyze({ limit: 3 });
const fullResult = limitedRuntime.analyze({ limit: Infinity });
assert.ok(limitedResult.issueCount > limitedResult.issues.length, 'limited analysis should preserve total issue count');
assert.strictEqual(limitedResult.visibleIssueCount, 3, 'limited analysis should expose visible issue count');
assert.strictEqual(fullResult.issues.length, fullResult.issueCount, 'infinite limit should expose all issues for export');

console.log('data-quality-runtime tests passed');
