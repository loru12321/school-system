const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const assessmentDir = path.resolve(process.env.ASSESSMENT_APP_DIR || path.join(__dirname, '..', '..', '教学质量评价方案'));
const smokeScript = path.resolve(__dirname, 'smoke-assessment-system.js');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const requestPath = decodeURIComponent(String(req.url || '/').split('?')[0]);
      const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
      const filePath = path.resolve(assessmentDir, relativePath);
      if (!filePath.startsWith(assessmentDir)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      fs.readFile(filePath, (error, data) => {
        if (error) {
          res.writeHead(404).end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  if (!fs.existsSync(path.join(assessmentDir, 'app.html'))) {
    throw new Error(`assessment app not found: ${assessmentDir}`);
  }
  const server = await startServer();
  const child = spawn(process.execPath, [smokeScript], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      ASSESSMENT_SMOKE_URL: `http://127.0.0.1:${server.address().port}`
    },
    stdio: 'inherit'
  });
  child.once('exit', (code) => server.close(() => process.exit(code == null ? 1 : code)));
  child.once('error', (error) => server.close(() => { throw error; }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
