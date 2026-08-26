const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const teacherUi = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'teacher-analysis-ui-runtime.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'app.js'), 'utf8');
const polish = fs.readFileSync(path.join(root, 'src', 'assets', 'css', 'visual-polish-2026.css'), 'utf8');
const drill = fs.readFileSync(path.join(root, 'src', 'assets', 'css', 'drill-modal.css'), 'utf8');
const sourceHtml = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const uiActions = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'ui-actions-runtime.js'), 'utf8');
const utilities = fs.readFileSync(path.join(root, 'public', 'assets', 'css', 'utility-classes.css'), 'utf8');
const moduleUrlState = fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'module-url-state-runtime.js'), 'utf8');

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
if (!sourceHtml.includes('<button type="button" class="mob-nav-btn active" data-ui-action="mobile-switch-tab"')) {
    throw new Error('mobile primary navigation must use semantic buttons');
}
if (/<(?:div|span)\b[^>]*class="[^"]*mob-nav-btn[^"]*"[^>]*onclick=/i.test(sourceHtml)) {
    throw new Error('mobile primary navigation must not use inline div/span click handlers');
}
if (!uiActions.includes("'mobile-switch-tab':")) throw new Error('mobile navigation action delegation is missing');
if (!utilities.includes(':focus-visible') || !utilities.includes('outline: 3px solid')) {
    throw new Error('shared visible focus treatment is missing');
}
if (!moduleUrlState.includes("searchParams.get('module')") || !moduleUrlState.includes("searchParams.set('module', id)")) {
    throw new Error('module URL deep-link synchronization is missing');
}
if (!moduleUrlState.includes("addEventListener('popstate'")) throw new Error('module browser-history restore is missing');
if (/transition:\s*all\b/i.test([
    ...fs.readdirSync(path.join(root, 'src', 'assets', 'css')).filter((name) => name.endsWith('.css')).map((name) => fs.readFileSync(path.join(root, 'src', 'assets', 'css', name), 'utf8')),
    ...fs.readdirSync(path.join(root, 'public', 'assets', 'css')).filter((name) => name.endsWith('.css')).map((name) => fs.readFileSync(path.join(root, 'public', 'assets', 'css', name), 'utf8'))
].join('\n'))) throw new Error('transition: all must not return to application styles');

console.log('[visual-contracts] visual, semantic navigation, focus, motion, and cohort contracts are present');
