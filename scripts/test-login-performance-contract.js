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

assert.ok(
  appJs.includes('async function initializeApplicationAfterLoad()')
    && appJs.includes('window.__APP_LOAD_INITIALIZATION_PROMISE__')
    && appJs.includes("if (document.readyState === 'complete')")
    && appJs.includes("window.addEventListener('load', initializeApplicationAfterLoad, { once: true })"),
  'dynamically loaded app runtime must initialize immediately after a completed page load and only once'
);

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
  /else\s*\{[\s\S]*?window\.showCohortPicker\(\)/,
  'school login must only show the cohort picker when no selected cohort entry is pending'
);

assert.match(
  entranceSoundJs,
  /const AUTOPLAY_KEY = 'SCHOOL_ENTRANCE_SOUND_AUTOPLAY_V1';/,
  'entrance audio must use an explicit autoplay opt-in flag'
);
assert.match(
  entranceSoundJs,
  /const DEFAULT_MODE = 'off';/,
  'entrance audio must default to off so login does not fetch media'
);
assert.match(
  entranceSoundJs,
  /function prewarmCustomAudio\(\)\s*\{[\s\S]*?!isAutoplayEnabled\(\)/,
  'entrance audio prewarm must not run unless autoplay was explicitly enabled'
);
assert.match(
  entranceSoundJs,
  /function unlockCustomAudio\(\)\s*\{[\s\S]*?!isAutoplayEnabled\(\)/,
  'login gestures must not unlock or fetch entrance audio unless autoplay was explicitly enabled'
);
assert.match(
  entranceSoundJs,
  /lastOverlayVisible && !visible && !playedForSession && isAutoplayEnabled\(\)/,
  'login overlay exit must not play entrance audio unless autoplay was explicitly enabled'
);
assert.match(
  bootRuntimeJs,
  /var LOGIN_MODULE_PREFETCH_LIMIT = 0;/,
  'login page must not compete with authentication by prefetching core modules'
);
assert.match(
  bootRuntimeJs,
  /var LOGIN_MODULE_PREFETCH_DELAY_MS = 2200;/,
  'login page module prefetch should wait for idle time instead of competing with first paint'
);
assert.match(
  bootRuntimeJs,
  /function shouldPrefetchLoginModules\(\)/,
  'login page module prefetch should have a connection and viewport gate'
);
assert.match(
  bootRuntimeJs,
  /var APP_MODULE_MAX_BATCH_SIZE = 12;/,
  'desktop session recovery should cap concurrency while avoiding cross-region serial waterfalls'
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
const coreManifest = bootRuntimeJs.match(/var APP_MODULES = \[[\s\S]*?\]\.map\(bootJs\);/)?.[0] || '';
assert.ok(coreManifest, 'authenticated startup must expose a bounded core manifest');
[
  'student-details-render-runtime.js',
  'comparison-render-runtime.js',
  'report-history-runtime.js',
  'teaching-management-modules-runtime.js',
  'data-quality-runtime.js'
].forEach((runtimeName) => {
  assert.ok(!coreManifest.includes(runtimeName), `${runtimeName} must load on feature entry, not during login`);
});
assert.match(
  bootRuntimeJs,
  /detail:\s*\{\s*phase:\s*'core'\s*\}/,
  'app readiness must explicitly mean core readiness rather than every feature runtime'
);
assert.doesNotMatch(
  bootRuntimeJs,
  /function scheduleAppModuleWarmup\(\)[\s\S]*?loadDeferredAppModules\(\)\.catch/,
  'post-login idle work must not execute the complete deferred feature bundle'
);
assert.doesNotMatch(
  bootRuntimeJs,
  /prefetchAppModuleList\(DEMAND_APP_MODULES, 'app-demand'\)/,
  'post-login work must not flood the network with every demand feature script'
);
assert.doesNotMatch(
  bootRuntimeJs,
  /loadMany\(\[\s*'student-details-core',\s*'student-report-core',\s*'seat-adjustment-core'/,
  'post-login warmup must not execute high-frequency feature runtimes while the workspace is restoring'
);
assert.doesNotMatch(
  bootRuntimeJs,
  /loadMany\(\[[\s\S]*?'teacher-analysis'[\s\S]*?'county-analysis'/,
  'priority warmup must not restore the previous all-analysis startup burst'
);
console.log('Login performance contract passed');
