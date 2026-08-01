const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/grade-scheduler-runtime.js'), 'utf8');

assert.ok(source.includes('teacherSlotIndex: null'), 'grade scheduler should keep a per-run teacher slot index');
assert.ok(source.includes('venueSlotIndex: null'), 'grade scheduler should keep a per-run shared-venue slot index');
assert.ok(source.includes('demands: []'), 'grade scheduler should store scheduling work as per-class demands');
assert.ok(source.includes('lockedSchedule: Object.create(null)'), 'grade scheduler should support an immutable locked timetable base');
assert.ok(source.includes('resetTeacherSlotIndex: function'), 'grade scheduler should expose a teacher slot index reset helper');
assert.ok(source.includes('resetVenueSlotIndex: function'), 'grade scheduler should expose a venue slot index reset helper');
assert.ok(source.includes('markTeacherBusy: function'), 'grade scheduler should expose a teacher slot index mark helper');
assert.ok(source.includes('markVenueBusy: function'), 'grade scheduler should expose a venue slot index mark helper');
assert.ok(source.includes('this.resetTeacherSlotIndex();'), 'grade scheduler should reset the teacher slot index before each run');
assert.ok(source.includes('this.resetVenueSlotIndex();'), 'grade scheduler should reset the venue slot index before each run');
assert.ok(source.includes('this.cloneLockedSchedule()'), 'each run should begin from the locked timetable base');
assert.ok(source.includes('this.markTeacherBusy(demand.name, slot.id);'), 'normal scheduled slots should register teacher occupancy');
assert.ok(source.includes('this.markVenueBusy(demand.venue, slot.id);'), 'normal scheduled slots should register venue occupancy');
assert.ok(source.includes('this.isVenueBusyInOtherClass(demand.venue, slot.id)'), 'placement should reject shared-venue collisions');
assert.ok(
  source.includes('if (this.teacherSlotIndex && this.teacherSlotIndex[`${normalizedTeacher}_${slotId}`]) return true;'),
  'teacher conflict checks should use the indexed fast path before scanning classes'
);
assert.ok(
  source.includes('if (this.venueSlotIndex && this.venueSlotIndex[`${venue}_${slotId}`]) return true;'),
  'venue conflict checks should use the indexed fast path before scanning classes'
);

console.log(JSON.stringify({
  ok: true,
  contract: 'grade-scheduler-teacher-slot-index'
}, null, 2));
