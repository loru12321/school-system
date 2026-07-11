const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
    path.resolve(__dirname, '../public/assets/js/data-manager-core-runtime.js'),
    'utf8'
);
const paramsSource = fs.readFileSync(
    path.resolve(__dirname, '../public/assets/js/data-manager-params-runtime.js'),
    'utf8'
);

assert.ok(
    source.includes("window.SystemPerformance.scheduleTask('data-manager-tab-render'")
        && source.includes("if (tab === 'cloud') manager.renderCloudBackups();")
        && source.includes("DataManager.switchTeacherTerm(termId, { render: false, refreshAnalysis: false });"),
    'data manager tabs should paint first, render once, and keep cloud work asynchronous'
);
assert.ok(
    !paramsSource.includes('scheduleDataManagerStatusRender'),
    'params runtime should render its small status refresh via a local frame queue instead of the DataManager idle queue'
);

console.log('data-manager-core-runtime contract tests passed');
