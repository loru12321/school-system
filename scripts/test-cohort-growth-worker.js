const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const runtimeSource = fs.readFileSync(path.join(rootDir, 'public/assets/js/cohort-growth-runtime.js'), 'utf8');
const workerSource = fs.readFileSync(path.join(rootDir, 'public/assets/js/cohort-growth-worker.js'), 'utf8');

const students = [
  ['u1', '甲', '701', '一中'],
  ['u2', '乙', '701', '一中'],
  ['u3', '丙', '702', '一中'],
  ['u4', '丁', '702', '二中'],
  ['u5', '戊', '703', '二中'],
  ['u6', '己', '703', '二中']
];
const scoreSets = [
  [500, 480, 480, 450, 430, 410],
  [505, 470, 490, 455, 420, 415],
  [510, 465, 495, 460, 425, 405],
  [515, 475, 485, 470, 415, 400],
  [520, 490, 480, 465, 410, 395]
];
const exams = scoreSets.map((scores, examIndex) => ({
  examId: `exam-${examIndex + 1}`,
  createdAt: examIndex + 1,
  data: students.map(([uuid, name, klass, school], index) => ({
    uuid,
    name,
    class: klass,
    school,
    total: scores[index]
  }))
}));

const runtimeContext = {
  console,
  globalThis: null,
  COHORT_DB: { exams: Object.fromEntries(exams.map((exam) => [exam.examId, exam])) },
  RAW_DATA: [],
  SCHOOLS: {},
  setTimeout
};
runtimeContext.globalThis = runtimeContext;
vm.runInNewContext(runtimeSource, runtimeContext);
const expected = JSON.parse(JSON.stringify(runtimeContext.CohortGrowth.compute({ school: 'ALL', className: 'ALL' })));

let workerMessage = null;
const workerContext = {
  console,
  Map,
  Set,
  Math,
  Number,
  Object,
  Array,
  String,
  Error,
  self: {
    postMessage(message) {
      workerMessage = message;
    }
  }
};
vm.runInNewContext(workerSource, workerContext);
workerContext.self.onmessage({
  data: {
    cmd: 'COMPUTE_COHORT_GROWTH',
    requestId: 7,
    signature: 'fixture-signature',
    scope: { school: 'ALL', className: 'ALL' },
    exams: exams.map((exam) => ({
      rows: exam.data.map((student, index) => ({
        key: student.uuid,
        name: student.name,
        class: student.class,
        total: student.total,
        index
      }))
    }))
  }
});

assert.strictEqual(workerMessage.status, 'ok');
assert.strictEqual(workerMessage.requestId, 7);
assert.strictEqual(workerMessage.signature, 'fixture-signature');
assert.deepStrictEqual(JSON.parse(JSON.stringify(workerMessage.result)), expected);
console.log('cohort-growth worker equivalence tests passed');
