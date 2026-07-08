const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const cohortExamMeta = read('public/assets/js/cohort-exam-meta-runtime.js');
const cloud = read('public/assets/js/cloud.js');
const dataManagerCore = read('public/assets/js/data-manager-core-runtime.js');

assert.ok(
  cohortExamMeta.includes('function isTeacherTermSelectActive(selectEl)')
    && cohortExamMeta.includes('teacherArea.style.display !== \'none\''),
  'teacher term preference should ignore hidden DataManager teacher term select values'
);

assert.ok(
  cohortExamMeta.includes('function readArchiveExamMetaForTeacherTerm()')
    && cohortExamMeta.includes('function getTeacherTermMetaFromRuntime()')
    && /function getPreferredTeacherTermId\(\)[\s\S]*const uiMeta = getTeacherTermMetaFromRuntime\(\)/.test(cohortExamMeta)
    && /function getTeacherTermCandidates\(termId\)[\s\S]*const uiMeta = getTeacherTermMetaFromRuntime\(\)/.test(cohortExamMeta),
  'teacher term preference should use the active archive exam meta when form controls or saved terms are stale'
);

assert.ok(
  /function getPreferredTeacherTermId\(\)[\s\S]*selectedTeacherTermId[\s\S]*\|\| uiTeacherTermId[\s\S]*\|\| readCurrentTeacherTermId\(\)/.test(cohortExamMeta),
  'current exam teacher term should outrank stale CURRENT_TEACHER_TERM_ID when the teacher tab is not active'
);

assert.ok(
  /\[\s*preferred,\s*uiTeacherTermId,\s*savedTeacherTermId,\s*getTeacherTermBase\(preferred\),\s*getTeacherTermBase\(uiTeacherTermId\),\s*getTeacherTermBase\(savedTeacherTermId\),\s*savedBaseTerm\s*\]\.forEach\(pushUnique\)/.test(cohortExamMeta),
  'teacher term candidates should prefer the current exam-derived term before saved stale terms'
);

assert.ok(
  cloud.includes('const preferredTeacherTermId = typeof window.getPreferredTeacherTermId === \'function\'')
    && /const termId = selectedTeacherTermId[\s\S]*\|\| preferredTeacherTermId[\s\S]*\|\| exactUiTeacherTerm[\s\S]*\|\| getCurrentTeacherTermId\(\)/.test(cloud),
  'CloudManager teacher keys should prefer the current exam teacher term before stale saved terms'
);

assert.ok(
  /const desiredTerms = \[\s*selectedTeacherTermId,\s*preferredTeacherTermId,\s*exactUiTeacherTerm,\s*getCurrentTeacherTermId\(\),\s*getCurrentTermId\(\)\s*\]/.test(cloud),
  'CloudManager teacher load fallback order should try current exam term before stale saved terms'
);

assert.ok(
  dataManagerCore.includes('const termId = getPreferredTeacherTermId() || buildTeacherTermId(getExamMetaFromUI()) || readCurrentTermId()'),
  'teacher upload should save under the preferred exact teacher term, not only the base current term'
);

console.log('teacher term sync runtime tests passed');
