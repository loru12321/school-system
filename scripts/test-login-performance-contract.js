const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'public', 'assets', 'js', 'app.js');
const appJs = fs.readFileSync(appPath, 'utf8');

function assertParentPathUsesDeferredCloudLoad(marker, legacyGuard) {
  const rawMarkerIndex = appJs.indexOf(marker);
  assert.ok(rawMarkerIndex >= 0, `${marker} marker must exist`);
  let markerIndex = appJs.lastIndexOf('if (isParentLikeUser(this.currentUser)) {', rawMarkerIndex);
  if (markerIndex < 0) {
    markerIndex = appJs.indexOf('if (isParentLikeUser(this.currentUser)) {', rawMarkerIndex);
  }
  assert.ok(markerIndex >= 0, `${marker} parent branch must exist`);

  const renderIndex = appJs.indexOf('\n                this.renderParentView();', markerIndex);
  assert.ok(renderIndex > markerIndex, `${marker} must render the parent view`);

  const preRenderPath = appJs.slice(markerIndex, renderIndex);
  assert.match(
    preRenderPath,
    /scheduleStartupCloudTask\(\(\) => \{/,
    `${marker} must defer parent cloud restore instead of blocking entry`
  );
  assert.doesNotMatch(
    preRenderPath,
    /UI\.loading\(true,[\s\S]*await\s+(?:withTimeout\()?loadCloudData/,
    `${marker} must not show a blocking loader while awaiting parent cloud data`
  );

  assert.ok(
    !appJs.includes(legacyGuard),
    `${marker} legacy blocking cloud branch must be removed`
  );
}

assertParentPathUsesDeferredCloudLoad(
  'this.syncLoginOverlayState(false);',
  'if (false && !this.currentUser.local_only && (!RAW_DATA || RAW_DATA.length === 0) && typeof loadCloudData === \'function\' && !this._parentDataRecovering)'
);

assertParentPathUsesDeferredCloudLoad(
  "console.warn('[Auth.login] parent background cloud load timeout/fail:', e);",
  'if (false && !isLocalOnlySession && (!RAW_DATA || RAW_DATA.length === 0) && typeof loadCloudData === \'function\')'
);

const selectedCohortIndex = appJs.indexOf('let pendingLoginCohortEntry = null;');
assert.ok(selectedCohortIndex >= 0, 'school login must track selected cohort entry');
const schoolBranchIndex = appJs.indexOf('} else {\n                if (typeof renderNavigation === \'function\') renderNavigation();', selectedCohortIndex);
assert.ok(schoolBranchIndex > selectedCohortIndex, 'school post-login branch must exist after selected cohort handling');
const schoolBranchEnd = appJs.indexOf('\n\n                if (this.currentUser.school)', schoolBranchIndex);
assert.ok(schoolBranchEnd > schoolBranchIndex, 'school post-login branch must have a stable end marker');
const schoolBranch = appJs.slice(schoolBranchIndex, schoolBranchEnd);

assert.match(
  schoolBranch,
  /if\s*\(\s*pendingLoginCohortEntry\s*\)\s*\{[\s\S]*?await\s+pendingLoginCohortEntry/,
  'school login with a selected cohort must wait for the selected cohort entry instead of showing the cohort picker again'
);
assert.match(
  schoolBranch,
  /else\s*\{[\s\S]*?showCohortPicker\(\)/,
  'school login must only show the cohort picker when no selected cohort entry is pending'
);
console.log('Login performance contract passed');
