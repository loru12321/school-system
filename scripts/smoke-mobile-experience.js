const { spawn } = require('node:child_process');
const path = require('node:path');

const smoke = path.resolve(__dirname, 'smoke-mobile-shell.js');
const child = spawn(process.execPath, [smoke], {
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code == null ? 1 : code);
});
