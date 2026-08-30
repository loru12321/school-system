const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/grade-scheduler-runtime.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');

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
assert.ok(source.includes('applyGrade8Preset: async function'), 'grade scheduler should provide a one-click new grade-8 preset');
assert.ok(source.includes('buildGrade8DemandsFromTeacherMap: function'), 'grade-8 preset should derive per-class demands from the imported teacher map');
assert.ok(source.includes("'语文': 8") && source.includes("'数学': 9") && source.includes("'英语': 9"), 'grade-8 preset should encode the requested core-subject weekly hours');
assert.ok(source.includes('applyConsecutivePairRules: function'), 'grade scheduler should support weekly same-class consecutive composition periods');
assert.ok(source.includes('getSoftBusyScore: function'), 'grade scheduler should support soft teacher meeting avoidance');
assert.ok(source.includes('buildCompactGradeSheet: function'), 'grade scheduler should provide a compact all-class timetable sheet');
assert.ok(indexHtml.includes("value=\"subject\""), 'grade scheduler should provide subject-focused timetable mode');
assert.ok(indexHtml.includes("value=\"grade\""), 'grade scheduler should provide an all-class grade timetable mode');
assert.ok(indexHtml.includes('id="sch_filter_chips"'), 'grade scheduler UI should expose quick timetable filters');
assert.ok(indexHtml.includes('data-scheduler-click="apply-grade8-preset"'), 'grade scheduler UI should expose the grade-8 preset action');
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
