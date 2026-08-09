const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'public', 'assets', 'js', 'app.js');
const appJs = fs.readFileSync(appPath, 'utf8');
const authLoginPath = path.join(root, 'public', 'assets', 'js', 'auth-login-runtime.js');
const authLoginJs = fs.readFileSync(authLoginPath, 'utf8');
const cohortExamMetaPath = path.join(root, 'public', 'assets', 'js', 'cohort-exam-meta-runtime.js');
const cohortExamMetaJs = fs.readFileSync(cohortExamMetaPath, 'utf8');
const entranceSoundPath = path.join(root, 'public', 'assets', 'js', 'entrance-sound-runtime.js');
const entranceSoundJs = fs.readFileSync(entranceSoundPath, 'utf8');
const bootRuntimePath = path.join(root, 'public', 'assets', 'js', 'boot-runtime.js');
const bootRuntimeJs = fs.readFileSync(bootRuntimePath, 'utf8');

function assertParentPathUsesDeferredCloudLoad(marker, legacyGuard) {
  const loginSource = authLoginJs;
  const rawMarkerIndex = loginSource.indexOf(marker);
  assert.ok(rawMarkerIndex >= 0, `${marker} marker must exist`);
  let markerIndex = loginSource.lastIndexOf('if (isParentLikeUser(this.currentUser)) {', rawMarkerIndex);
  if (markerIndex < 0) {
    markerIndex = loginSource.indexOf('if (isParentLikeUser(this.currentUser)) {', rawMarkerIndex);
  }
  assert.ok(markerIndex >= 0, `${marker} parent branch must exist`);

  const renderIndex = loginSource.indexOf('\n                this.renderParentView();', markerIndex);
  assert.ok(renderIndex > markerIndex, `${marker} must render the parent view`);

  const preRenderPath = loginSource.slice(markerIndex, renderIndex);
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
    !loginSource.includes(legacyGuard),
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

const selectedCohortIndex = authLoginJs.indexOf('let pendingLoginCohortEntry = null;');
assert.ok(selectedCohortIndex >= 0, 'school login must track selected cohort entry');
const selectedCohortSetupEnd = authLoginJs.indexOf('if (!isLocalOnlySession && (!window.EdgeGateway || !EdgeGateway.getToken())', selectedCohortIndex);
assert.ok(selectedCohortSetupEnd > selectedCohortIndex, 'selected cohort setup must finish before gateway session backfill');
const selectedCohortSetup = authLoginJs.slice(selectedCohortIndex, selectedCohortSetupEnd);
assert.match(
  selectedCohortSetup,
  /enterCohortFromMask\(\{\s*fastEnter:\s*false,\s*requireCloudData:\s*true\s*\}\)/,
  'school login selected cohort entry must wait for cloud cohort data so first login lands on the selected data page'
);

assert.ok(
  bootRuntimeJs.includes('const preserveSelection = years.includes(select.value);')
    && authLoginJs.includes('getSelectedLoginCohortYear'),
  'login cohort selection should survive boot redraws instead of being reset to the default cohort'
);

const enterMaskIndex = cohortExamMetaJs.indexOf('async function enterCohortFromMask(');
assert.ok(enterMaskIndex >= 0, 'enterCohortFromMask must accept options');
const enterMaskEnd = cohortExamMetaJs.indexOf('\n\nfunction tryAutoEnterReadyCohortWorkspace()', enterMaskIndex);
assert.ok(enterMaskEnd > enterMaskIndex, 'enterCohortFromMask block must have a stable end marker');
const enterMaskBlock = cohortExamMetaJs.slice(enterMaskIndex, enterMaskEnd);
assert.match(enterMaskBlock, /fastEnter:\s*options\.fastEnter\s*!==\s*false/, 'enterCohortFromMask must default to fastEnter');
assert.match(enterMaskBlock, /requireCloudData:\s*options\.requireCloudData\s*===\s*true/, 'enterCohortFromMask must not require cloud data unless explicitly requested');

const schoolBranchIndex = authLoginJs.indexOf('} else {\n                if (typeof renderNavigation === \'function\') renderNavigation();', selectedCohortIndex);
assert.ok(schoolBranchIndex > selectedCohortIndex, 'school post-login branch must exist after selected cohort handling');
const schoolBranchEnd = authLoginJs.indexOf('\n\n                if (this.currentUser.school)', schoolBranchIndex);
assert.ok(schoolBranchEnd > schoolBranchIndex, 'school post-login branch must have a stable end marker');
const schoolBranch = authLoginJs.slice(schoolBranchIndex, schoolBranchEnd);

assert.match(
  schoolBranch,
  /if\s*\(\s*pendingLoginCohortEntry\s*\)\s*\{[\s\S]*?await\s+pendingLoginCohortEntry/,
  'school login with a selected cohort must wait for the selected cohort entry instead of showing the cohort picker again'
);
assert.match(
  schoolBranch,
  /else\s*\{[\s\S]*?setManualCohortSelectionGate\(!hasReadyWorkspace\);[\s\S]*?window\.showCohortPicker\(\{ autoEnter: false \}\)/,
  'school login must show a non-destructive cohort picker only when no selected cohort entry is pending'
);

assert.match(
  entranceSoundJs,
  /const AUTOPLAY_KEY = 'SCHOOL_ENTRANCE_SOUND_AUTOPLAY_V1';/,
  'entrance audio must use an explicit autoplay opt-in flag'
);
assert.match(
  entranceSoundJs,
  /const DEFAULT_MODE = 'custom';\s*\n\s*const DEFAULT_AUTOPLAY = true;/,
  'the project-selected entrance sequence must be enabled after the login gesture'
);
assert.match(
  entranceSoundJs,
  /function prewarmCustomAudio\(\)\s*\{[\s\S]*?!audioUnlocked\s*\|\|\s*!isAutoplayEnabled\(\)/,
  'entrance audio must not fetch while the login screen is painting before a user gesture'
);
assert.match(
  entranceSoundJs,
  /function unlockCustomAudio\(\)\s*\{[\s\S]*?!isAutoplayEnabled\(\)/,
  'login gestures must only unlock the selected entrance audio when it is enabled'
);
assert.match(
  entranceSoundJs,
  /lastOverlayVisible && !visible && !playedForSession && isAutoplayEnabled\(\)/,
  'the post-login transition must start the selected entrance sequence when enabled'
);
assert.match(
  bootRuntimeJs,
  /var LOGIN_MODULE_PREFETCH_LIMIT = 8;/,
  'login page should only prefetch a small number of core modules by default'
);
assert.match(
  bootRuntimeJs,
  /var LOGIN_MODULE_PREFETCH_DELAY_MS = 2200;/,
  'login page module prefetch should wait for idle time instead of competing with first paint'
);
assert.match(
  bootRuntimeJs,
  /function prewarmLoginTransitionModules\(\)[\s\S]*?Math\.min\(getLoginModulePrefetchLimit\(\), APP_MODULES\.length\)/,
  'post-auth warm-up must use the small login prefetch budget rather than the full desktop module budget'
);
const gatewayLoginIndex = bootRuntimeJs.indexOf('const loginRequest = bootGateway.login');
const gatewayResultIndex = bootRuntimeJs.indexOf('const result = await loginRequest;', gatewayLoginIndex);
const transitionPrefetchIndex = bootRuntimeJs.indexOf('prewarmLoginTransitionModules();', gatewayResultIndex);
assert.ok(
  gatewayLoginIndex >= 0 && gatewayResultIndex > gatewayLoginIndex && transitionPrefetchIndex > gatewayResultIndex,
  'login transition prefetch must start only after gateway authentication has completed'
);
assert.match(
  bootRuntimeJs,
  /function shouldPrefetchLoginModules\(\)/,
  'login page module prefetch should have a connection and viewport gate'
);
assert.match(
  bootRuntimeJs,
  /var APP_MODULE_MAX_BATCH_SIZE = 6;/,
  'authenticated session recovery must cap boot script bursts so Chrome can keep painting'
);
assert.match(
  bootRuntimeJs,
  /Math\.min\(APP_MODULE_MAX_BATCH_SIZE, Math\.max\(1, Math\.floor\(stored\)\)\)/,
  'legacy local boot tuning must not bypass the authenticated recovery responsiveness cap'
);
assert.doesNotMatch(
  bootRuntimeJs,
  /APP_MODULES\.slice\(0,\s*18\)|APP_MODULES\.slice\(18,\s*36\)/,
  'login page must not prefetch dozens of app modules before sign-in'
);
console.log('Login performance contract passed');
