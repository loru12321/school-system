const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/grade-scheduler-runtime.js'), 'utf8');

assert.ok(source.includes('teacherSlotIndex: null'), 'grade scheduler should keep a per-run teacher slot index');
assert.ok(source.includes('resetTeacherSlotIndex: function'), 'grade scheduler should expose a teacher slot index reset helper');
assert.ok(source.includes('markTeacherBusy: function'), 'grade scheduler should expose a teacher slot index mark helper');
assert.ok(source.includes('this.resetTeacherSlotIndex();'), 'grade scheduler should reset the teacher slot index before each run');
assert.ok(source.includes("this.markTeacherBusy('班主任', slotId);"), 'fixed meeting slots should register teacher occupancy');
assert.ok(source.includes('this.markTeacherBusy(t.name, fullSlotId);'), 'combined slots should register teacher occupancy');
assert.ok(source.includes('this.markTeacherBusy(t.name, sid);'), 'normal scheduled slots should register teacher occupancy');
assert.ok(
  source.includes('if (this.teacherSlotIndex && this.teacherSlotIndex[`${normalizedTeacher}_${slotId}`]) return true;'),
  'teacher conflict checks should use the indexed fast path before scanning classes'
);

console.log(JSON.stringify({
  ok: true,
  contract: 'grade-scheduler-teacher-slot-index'
}, null, 2));
