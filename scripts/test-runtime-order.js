const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../src/index.html');
const runtimePath = path.resolve(__dirname, '../public/assets/js/auth-state-runtime.js');
const workspaceRuntimePath = path.resolve(__dirname, '../public/assets/js/workspace-state-runtime.js');
const examRuntimePath = path.resolve(__dirname, '../public/assets/js/exam-state-runtime.js');
const schoolRuntimePath = path.resolve(__dirname, '../public/assets/js/school-state-runtime.js');
const teacherRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-state-runtime.js');

assert.ok(fs.existsSync(runtimePath), 'auth-state-runtime.js should exist');
assert.ok(fs.existsSync(workspaceRuntimePath), 'workspace-state-runtime.js should exist');
assert.ok(fs.existsSync(examRuntimePath), 'exam-state-runtime.js should exist');
assert.ok(fs.existsSync(schoolRuntimePath), 'school-state-runtime.js should exist');
assert.ok(fs.existsSync(teacherRuntimePath), 'teacher-state-runtime.js should exist');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const authStateRef = './assets/js/auth-state-runtime.js';
const workspaceStateRef = './assets/js/workspace-state-runtime.js';
const examStateRef = './assets/js/exam-state-runtime.js';
const schoolStateRef = './assets/js/school-state-runtime.js';
const teacherStateRef = './assets/js/teacher-state-runtime.js';
const cloudWorkspaceRef = './assets/js/cloud-workspace-runtime.js';
const cloudRef = './assets/js/cloud.js';
const appRef = './assets/js/app.js';

const authStateIndex = indexHtml.indexOf(authStateRef);
const workspaceStateIndex = indexHtml.indexOf(workspaceStateRef);
const examStateIndex = indexHtml.indexOf(examStateRef);
const schoolStateIndex = indexHtml.indexOf(schoolStateRef);
const teacherStateIndex = indexHtml.indexOf(teacherStateRef);
const cloudIndex = indexHtml.indexOf(cloudRef);
const cloudWorkspaceIndex = indexHtml.indexOf(cloudWorkspaceRef);
const appIndex = indexHtml.indexOf(appRef);

assert.ok(authStateIndex >= 0, 'index.html should load auth-state-runtime.js');
assert.ok(workspaceStateIndex >= 0, 'index.html should load workspace-state-runtime.js');
assert.ok(examStateIndex >= 0, 'index.html should load exam-state-runtime.js');
assert.ok(schoolStateIndex >= 0, 'index.html should load school-state-runtime.js');
assert.ok(teacherStateIndex >= 0, 'index.html should load teacher-state-runtime.js');
assert.ok(cloudIndex >= 0, 'index.html should load cloud.js');
assert.ok(cloudWorkspaceIndex >= 0, 'index.html should load cloud-workspace-runtime.js');
assert.ok(appIndex >= 0, 'index.html should load app.js');
assert.ok(authStateIndex < workspaceStateIndex, 'auth-state-runtime.js must load before workspace-state-runtime.js');
assert.ok(workspaceStateIndex < examStateIndex, 'workspace-state-runtime.js must load before exam-state-runtime.js');
assert.ok(examStateIndex < schoolStateIndex, 'exam-state-runtime.js must load before school-state-runtime.js');
assert.ok(schoolStateIndex < teacherStateIndex, 'school-state-runtime.js must load before teacher-state-runtime.js');
assert.ok(teacherStateIndex < cloudIndex, 'teacher-state-runtime.js must load before cloud.js');
assert.ok(teacherStateIndex < cloudWorkspaceIndex, 'teacher-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(teacherStateIndex < appIndex, 'teacher-state-runtime.js must load before app.js');
assert.ok(schoolStateIndex < cloudIndex, 'school-state-runtime.js must load before cloud.js');
assert.ok(schoolStateIndex < cloudWorkspaceIndex, 'school-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(schoolStateIndex < appIndex, 'school-state-runtime.js must load before app.js');
assert.ok(examStateIndex < cloudIndex, 'exam-state-runtime.js must load before cloud.js');
assert.ok(examStateIndex < cloudWorkspaceIndex, 'exam-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(examStateIndex < appIndex, 'exam-state-runtime.js must load before app.js');
assert.ok(workspaceStateIndex < cloudIndex, 'workspace-state-runtime.js must load before cloud.js');
assert.ok(workspaceStateIndex < cloudWorkspaceIndex, 'workspace-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(workspaceStateIndex < appIndex, 'workspace-state-runtime.js must load before app.js');
assert.ok(authStateIndex < cloudWorkspaceIndex, 'auth-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(authStateIndex < appIndex, 'auth-state-runtime.js must load before app.js');

console.log('runtime order tests passed');
