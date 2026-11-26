const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appJs = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
const metaJs = fs.readFileSync(path.join(root, 'public/assets/js/cohort-exam-meta-runtime.js'), 'utf8');

// 1. switchCohort must NOT derive restoredGrade solely from stale getExamMetaFromUI()
assert.ok(
    !appJs.includes('const restoredGrade = getEffectiveGrade(getExamMetaFromUI());'),
    'switchCohort must resolve grade from the restored exam metadata/ID instead of stale UI inputs'
);
assert.ok(
    appJs.includes('resolveWorkspaceGrade({ examId: CURRENT_EXAM_ID, meta: restoredExamMeta })'),
    'switchCohort and restore paths must prefer resolveWorkspaceGrade with examId + restoredExamMeta'
);

// 2. applyConfiguredAnalysisSubjects must restore allowed subjects present in RAW_DATA
assert.ok(
    appJs.includes('const restored = [];') && appJs.includes('return { changed: true, removed, restored };'),
    'applyConfiguredAnalysisSubjects must self-heal allowed subjects (e.g. 物理/化学) from RAW_DATA'
);

// 3. getEffectiveGrade must not let empty meta.year override explicit meta.grade
const effIdx = metaJs.indexOf('function getEffectiveGrade(meta)');
assert.ok(effIdx > -1, 'getEffectiveGrade must exist');
const effSnippet = metaJs.slice(effIdx, effIdx + 500);
assert.ok(
    effSnippet.includes('if (meta && meta.year)') && effSnippet.includes('if (direct) return direct;'),
    'getEffectiveGrade must only computeCohortGrade when meta.year is present, honoring explicit meta.grade otherwise'
);

// 4. normalizeCohortExamSubjectPolicy must pass examId to resolveWorkspaceGrade
assert.ok(
    metaJs.includes('resolveWorkspaceGrade({ examId, meta, allowCalendarFallback: false })'),
    'normalizeCohortExamSubjectPolicy must resolve grade using examId + meta'
);

console.log('grade8-subject-persistence tests passed');
