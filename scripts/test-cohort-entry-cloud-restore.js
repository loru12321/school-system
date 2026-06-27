const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');

assert.ok(
    /function showCohortPicker\(\)[\s\S]*CohortManager\.addCohort\(\{ year, startGrade: 6 \}, \{\s*skipConfirm: true,\s*fastEnter: false,\s*requireCloudData: true\s*\}\)/.test(appSource),
    'automatic cohort picker entry should wait for cloud data instead of opening an empty local shell'
);

assert.ok(
    /async function enterCohortFromMask\(\)[\s\S]*CohortManager\.addCohort\(\{ year, startGrade \}, \{\s*skipConfirm: true,\s*fastEnter: false,\s*requireCloudData: true\s*\}\)/.test(appSource),
    'login-selected cohort entry should require cloud data before showing the workspace'
);

assert.ok(
    /if \(options\.requireCloudData === true\) \{[\s\S]*setManualCohortSelectionGate\(true\);[\s\S]*return false;[\s\S]*\}\s*clearDataRuntimeState\(\);/.test(appSource),
    'cloud-required cohort entry should stop before creating an empty workspace when restore fails'
);

assert.ok(
    !/enterCohortFromMask\(\)[\s\S]{0,500}fastEnter: true/.test(appSource),
    'enterCohortFromMask must not use fastEnter:true because that exposes the empty shell before sync'
);

console.log('cohort entry cloud restore tests passed');
