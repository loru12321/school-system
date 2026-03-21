const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../src/index.html');
const runtimePath = path.resolve(__dirname, '../public/assets/js/auth-state-runtime.js');
const workspaceRuntimePath = path.resolve(__dirname, '../public/assets/js/workspace-state-runtime.js');

assert.ok(fs.existsSync(runtimePath), 'auth-state-runtime.js should exist');
assert.ok(fs.existsSync(workspaceRuntimePath), 'workspace-state-runtime.js should exist');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const authStateRef = './assets/js/auth-state-runtime.js';
const workspaceStateRef = './assets/js/workspace-state-runtime.js';
const cloudWorkspaceRef = './assets/js/cloud-workspace-runtime.js';
const cloudRef = './assets/js/cloud.js';
const appRef = './assets/js/app.js';

const authStateIndex = indexHtml.indexOf(authStateRef);
const workspaceStateIndex = indexHtml.indexOf(workspaceStateRef);
const cloudIndex = indexHtml.indexOf(cloudRef);
const cloudWorkspaceIndex = indexHtml.indexOf(cloudWorkspaceRef);
const appIndex = indexHtml.indexOf(appRef);

assert.ok(authStateIndex >= 0, 'index.html should load auth-state-runtime.js');
assert.ok(workspaceStateIndex >= 0, 'index.html should load workspace-state-runtime.js');
assert.ok(cloudIndex >= 0, 'index.html should load cloud.js');
assert.ok(cloudWorkspaceIndex >= 0, 'index.html should load cloud-workspace-runtime.js');
assert.ok(appIndex >= 0, 'index.html should load app.js');
assert.ok(authStateIndex < workspaceStateIndex, 'auth-state-runtime.js must load before workspace-state-runtime.js');
assert.ok(workspaceStateIndex < cloudIndex, 'workspace-state-runtime.js must load before cloud.js');
assert.ok(workspaceStateIndex < cloudWorkspaceIndex, 'workspace-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(workspaceStateIndex < appIndex, 'workspace-state-runtime.js must load before app.js');
assert.ok(authStateIndex < cloudWorkspaceIndex, 'auth-state-runtime.js must load before cloud-workspace-runtime.js');
assert.ok(authStateIndex < appIndex, 'auth-state-runtime.js must load before app.js');

console.log('runtime order tests passed');
