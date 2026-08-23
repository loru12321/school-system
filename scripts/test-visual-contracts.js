const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const teacherUi = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'teacher-analysis-ui-runtime.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'app.js'), 'utf8');
const polish = fs.readFileSync(path.join(root, 'src', 'assets', 'css', 'visual-polish-2026.css'), 'utf8');
const drill = fs.readFileSync(path.join(root, 'src', 'assets', 'css', 'drill-modal.css'), 'utf8');

for (const metric of ['rankAvg', 'rankExc', 'rankPass']) {
    if (!teacherUi.includes(`class="teacher-rank-badge"`)) {
        throw new Error('teacher ranking values must be rendered as real badge elements');
    }
}
if (!teacherUi.includes('aria-label="均分镇排')) throw new Error('average-rank badge is missing an accessible label');
if (!teacherUi.includes('aria-label="优秀率镇排')) throw new Error('excellent-rank badge is missing an accessible label');
if (!teacherUi.includes('aria-label="及格率镇排')) throw new Error('pass-rank badge is missing an accessible label');
if (!app.includes('function syncVisibleCohortSelector()')) throw new Error('cohort selector reconciliation is missing');
if (!app.includes('selector.dataset.restoredCohort = cohortId')) throw new Error('cohort restore marker is missing');
if (!polish.includes('content: none !important')) throw new Error('detached rank pseudo-element neutralization is missing');
if (!app.includes('class="clickable-num" onclick="handleExcludedClick')) throw new Error('bottom-third exclusion drill control is missing');
if (!drill.includes('text-decoration-style: wavy')) throw new Error('clickable exclusion number wave affordance is missing');
if (!drill.includes('grid-template-columns: repeat(auto-fit')) throw new Error('drill class cards are not using a responsive grid');

console.log('[visual-contracts] ranking badges, accessible labels, and cohort selector restore are present');
