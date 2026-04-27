const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const distDir = path.resolve(__dirname, '../dist');
const smokeScript = path.resolve(__dirname, process.env.SMOKE_SCRIPT || './smoke-all-modules.js');
const port = Number(process.env.SMOKE_LOCAL_PORT || 4173);
const proxyOrigin = String(process.env.SMOKE_PROXY_ORIGIN || 'https://schoolsystem.com.cn').trim().replace(/\/+$/, '');

const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

function sendNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
}

function resolveFilePath(urlPath) {
    const decodedPath = decodeURIComponent(String(urlPath || '/').split('?')[0]);
    const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\\/])+/, '');
    return path.join(distDir, safePath);
}

function shouldProxyRequest(urlPath) {
    const pathname = String(urlPath || '/').split('?')[0];
    return pathname.startsWith('/api/') || pathname.startsWith('/sb/');
}

async function readRequestBody(req) {
    if (req.method === 'GET' || req.method === 'HEAD') return undefined;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function proxyRequest(req, res) {
    const headers = {};
    Object.entries(req.headers || {}).forEach(([key, value]) => {
        if (!value) return;
        const lower = String(key || '').toLowerCase();
        if (lower === 'host' || lower === 'connection' || lower === 'content-length') return;
        headers[key] = value;
    });

    const upstream = await fetch(`${proxyOrigin}${req.url || '/'}`, {
        method: req.method || 'GET',
        headers,
        body: await readRequestBody(req),
        redirect: 'manual'
    });

    const responseHeaders = {};
    upstream.headers.forEach((value, key) => {
        const lower = String(key || '').toLowerCase();
        if (lower === 'connection' || lower === 'content-length' || lower === 'content-encoding' || lower === 'transfer-encoding') return;
        responseHeaders[key] = value;
    });

    res.writeHead(upstream.status, responseHeaders);
    const body = Buffer.from(await upstream.arrayBuffer());
    res.end(body);
}

async function startServer() {
    if (!fs.existsSync(distDir)) {
        throw new Error(`dist not found: ${distDir}`);
    }

    const server = http.createServer(async (req, res) => {
        if (shouldProxyRequest(req.url || '/')) {
            try {
                await proxyRequest(req, res);
            } catch (error) {
                res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Proxy Error: ${error instanceof Error ? error.message : String(error)}`);
            }
            return;
        }

        const filePath = resolveFilePath(req.url || '/');
        if (!filePath.startsWith(distDir)) {
            sendNotFound(res);
            return;
        }

        fs.stat(filePath, (statError, stats) => {
            if (statError) {
                sendNotFound(res);
                return;
            }

            const targetFile = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
            fs.readFile(targetFile, (readError, data) => {
                if (readError) {
                    sendNotFound(res);
                    return;
                }

                const contentType = mimeTypes[path.extname(targetFile).toLowerCase()] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data);
            });
        });
    });

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve());
    });

    return server;
}

async function main() {
    const server = await startServer();
    const env = {
        ...process.env,
        SMOKE_URL: process.env.SMOKE_URL || `http://127.0.0.1:${port}/`,
        SMOKE_USER: process.env.SMOKE_USER || 'admin',
        SMOKE_PASS: process.env.SMOKE_PASS || 'admin123',
        SMOKE_COHORT_YEAR: process.env.SMOKE_COHORT_YEAR || '2022'
    };

    const child = spawn(process.execPath, [smokeScript], {
        cwd: path.resolve(__dirname, '..'),
        env,
        stdio: 'inherit'
    });

    const closeServer = () => new Promise(resolve => server.close(() => resolve()));

    child.on('exit', async code => {
        await closeServer();
        process.exit(code == null ? 1 : code);
    });

    child.on('error', async error => {
        console.error(error);
        await closeServer();
        process.exit(1);
    });
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
