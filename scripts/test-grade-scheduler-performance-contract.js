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
assert.ok(source.includes('areAdjacentClasses: function'), 'scheduler should identify adjacent classes for teacher blocks');
assert.ok(source.includes('isSameClassSubjectConsecutiveAllowed: function'), 'scheduler should allow only explicit same-class consecutive exceptions');
assert.ok(source.includes('isEveningThirdReserved: function'), 'scheduler should reserve evening third period for eligible combined lessons');
assert.ok(source.includes('isNonTeachingHourCombinedCell: function'), 'scheduler should identify evening third combined supervision cells');
assert.ok(source.includes('countNormalDemandLessons: function'), 'scheduler should keep a separate normal-demand hour counter');
assert.ok(source.includes('(includeCombined || !this.isNonTeachingHourCombinedCell(cell, slotId))'), 'total demand hours should include evening third combined supervision cells');
assert.ok(source.includes('applyEveningThirdCombinedRules: function'), 'scheduler should build evening third combined lessons from front-period subjects');
assert.ok(source.includes('includeFulfilled: true'), 'evening third combined lessons should still be generated after normal hours are filled');
assert.ok(source.includes('teacherDaySlotIndex: null'), 'teacher day load should track unique occupied slots for combined lessons');
assert.ok(source.includes('deferEveningThird: true'), 'scheduler should defer evening third combined placement until front periods are known');
assert.ok(source.includes('adjacentClassWeight: 160'), 'scheduler should prioritize adjacent-class teacher continuity');
assert.ok(source.includes('getSoftBusyScore: function'), 'grade scheduler should support soft teacher meeting avoidance');
assert.ok(source.includes('getClassSubjectPeriodRepeatCount: function'), 'scheduler should track repeated class subject periods across days');
assert.ok(source.includes('getCrossClassSubjectSlotRepeatCount: function'), 'scheduler should spread the same subject across different classes and periods');
assert.ok(source.includes('violatesGrade9MathPm4Eve1Rule: function'), 'scheduler should enforce the grade-9.3/9.4 math pm4/eve1 exclusive rule');
assert.ok(source.includes('if (this.violatesGrade9MathPm4Eve1Rule(demand, slot)) return false;'), 'grade-9.3/9.4 math pm4/eve1 rule must be enforced during placement');
assert.ok(source.includes('getTeacherSubjectPeriodRepeatCount: function'), 'scheduler should track repeated teacher subject periods across days');
assert.ok(source.includes('isPreferredFiveSixClassPair: function'), 'scheduler should recognize the preferred 5/6 class pair for three-class teachers');
assert.ok(source.includes('getAdjacentClassContinuityScore: function'), 'scheduler should model continuity as adjacent-class same-subject switching');
assert.ok(source.includes('adjacentClassContinuity'), 'scheduler should apply adjacent-class continuity scoring');
assert.ok(source.includes('existingSlots = null'), 'continuity scoring should accept the already computed teacher-subject slots');
assert.ok(source.includes("options.composition"), 'same-class consecutive lessons should require an explicit composition exception');
assert.ok(source.includes("lessonType: 'composition'"), 'composition pair placements should be marked distinctly from normal Chinese lessons');
assert.ok(source.includes("&& cell.lessonType !== 'composition'"), 'composition lessons should remain immovable during repair passes');
assert.ok(source.includes("return cell.lessonType === 'composition' ? '作文'"), 'composition lessons should display as 作文 in timetable views');
assert.ok(source.includes('getTeacherSubjectDayBalanceScore: function'), 'scheduler should balance same-teacher subject counts by day across classes');
assert.ok(source.includes('getDailyCoreCoverageMissing: function'), 'scheduler should audit daily Chinese/math/English coverage');
assert.ok(source.includes('isGrade9MathTeacher'), 'scheduler should identify teachers serving grade 9.3/9.4 mathematics');
assert.ok(source.includes('slot.type === \'am\' && Number(slot.period) === 4) return -520'), 'grade 9.3/9.4 math teachers should avoid morning period 4 when possible');
assert.ok(source.includes('ensureDailyCoreCoverage: function'), 'scheduler should seed daily Chinese/math/English coverage before remaining placement');
assert.ok(source.includes('repairDailyCoreCoverage: function'), 'scheduler should repair daily core coverage by bounded legal swaps');
assert.ok(source.includes('synchronizeEveningThirdSubject: function'), 'scheduler should synchronize evening-third subjects across the full grade');
assert.ok(source.includes("cell.lessonType !== 'composition'"), 'daily coverage and evening synchronization must not break composition pairs');
assert.ok(source.includes('const dailyCoreCoverageMissing = this.ensureDailyCoreCoverage'), 'scheduler should enforce daily core coverage before ordinary placement');
assert.ok(source.includes('dailyCoreCoverageMissing'), 'scheduler should surface missing daily core coverage in run status');
assert.ok(source.includes('score += core.has(subject) ? 420 : -180;'), 'evening third should strongly prefer Chinese, math, and English while retaining non-core fallback');
assert.ok(source.includes(".replace(/\\(合\\)$/, '').trim() === '体育' && slot.type === 'eve'"), 'scheduler should forbid PE in evening slots');
assert.ok(source.includes('getSubjectTimeDistributionScore: function'), 'scheduler should score subject time-slot variety');
assert.ok(source.includes('classSubjectPeriodRepeats'), 'fatigue audit should report repeated class subject periods');
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
