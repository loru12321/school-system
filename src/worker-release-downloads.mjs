const RELEASE_MAP_PATH = '/releases/download-map.json';
const DOWNLOAD_PREFIX = '/downloads/';
const CHUNK_PATTERN = /^packages\/[A-Za-z0-9._-]+\/(windows|android)\/part-\d{4}$/;
const TRUSTED_EXTERNAL_CHUNK_PATTERN = /^https:\/\/api\.github\.com\/repos\/hka123321\/school-system\/releases\/assets\/\d+$/;
const FILENAME_PATTERN = /^school-system-(windows|android)-[A-Za-z0-9._-]+\.(exe|apk)$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const CONTENT_TYPES = new Set([
  'application/vnd.microsoft.portable-executable',
  'application/vnd.android.package-archive'
]);

function plainResponse(status, body, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders
    }
  });
}

function parseFilename(request) {
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith(DOWNLOAD_PREFIX)) return '';
  let filename;
  try {
    filename = decodeURIComponent(pathname.slice(DOWNLOAD_PREFIX.length));
  } catch {
    return '';
  }
  if (!FILENAME_PATTERN.test(filename) || filename.includes('/') || filename.includes('\\')) return '';
  return filename;
}

function validateDownloadEntry(entry, filename) {
  return !!entry
    && entry.filename === filename
    && CONTENT_TYPES.has(entry.contentType)
    && Number.isSafeInteger(entry.bytes)
    && entry.bytes > 0
    && SHA256_PATTERN.test(entry.sha256)
    && Array.isArray(entry.chunks)
    && entry.chunks.length > 0
    && entry.chunks.every((chunk) => isValidChunkReference(chunk))
    && Array.isArray(entry.chunkBytes)
    && entry.chunkBytes.length === entry.chunks.length
    && entry.chunkBytes.every((bytes) => Number.isSafeInteger(bytes) && bytes > 0)
    && entry.chunkBytes.reduce((sum, bytes) => sum + bytes, 0) === entry.bytes;
}

function isValidChunkReference(chunk) {
  return typeof chunk === 'string'
    && (CHUNK_PATTERN.test(chunk) || TRUSTED_EXTERNAL_CHUNK_PATTERN.test(chunk));
}

function buildChunkRequest(request, env, chunk, method = 'GET') {
  if (CHUNK_PATTERN.test(chunk)) {
    return {
      external: false,
      request: new Request(new URL(`/releases/${chunk}`, request.url), { method })
    };
  }
  const token = envGithubReleaseToken(env);
  return {
    external: true,
    request: new Request(chunk, {
      method,
      headers: {
        Accept: 'application/octet-stream',
        Authorization: token ? `Bearer ${token}` : '',
        'User-Agent': 'school-system-release-proxy'
      },
      redirect: 'follow'
    })
  };
}

function envGithubReleaseToken(env) {
  return env?.GITHUB_RELEASE_TOKEN || env?.GITHUB_TOKEN || '';
}

function fetchChunk(request, env, chunk, method = 'GET') {
  const target = buildChunkRequest(request, env, chunk, method);
  return target.external ? fetch(target.request) : env.ASSETS.fetch(target.request);
}

async function loadDownloadEntry(request, env, filename) {
  const mapUrl = new URL(RELEASE_MAP_PATH, request.url);
  const mapResponse = await env.ASSETS.fetch(new Request(mapUrl, { method: 'GET' }));
  if (!mapResponse.ok) return { fallback: true };
  let map;
  try {
    map = await mapResponse.json();
  } catch {
    return { fallback: true };
  }
  if (map?.schemaVersion !== 1 || !Array.isArray(map.downloads)) {
    return { fallback: true };
  }
  const entry = map.downloads.find((item) => item?.filename === filename);
  if (!entry) return { fallback: true };
  if (!validateDownloadEntry(entry, filename)) return { error: plainResponse(503, 'Release map invalid') };
  return { entry };
}

async function preflightChunks(request, env, entry) {
  const probes = await Promise.all(entry.chunks.map((chunk) => fetchChunk(request, env, chunk, 'HEAD')));
  if (probes.some((response) => !response.ok)) return null;
  return entry.chunks;
}

function buildDownloadHeaders(entry) {
  return new Headers({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': `attachment; filename="${entry.filename}"`,
    'Content-Length': String(entry.bytes),
    'Content-Type': entry.contentType,
    ETag: `"sha256-${entry.sha256}"`,
    'X-Content-SHA256': entry.sha256,
    'X-Content-Type-Options': 'nosniff'
  });
}

function streamChunks(request, env, chunks) {
  let chunkIndex = 0;
  let reader = null;
  return new ReadableStream({
    async pull(controller) {
      try {
        while (true) {
          if (!reader) {
            if (chunkIndex >= chunks.length) {
              controller.close();
              return;
            }
            const response = await fetchChunk(request, env, chunks[chunkIndex], 'GET');
            if (!response.ok || !response.body) throw new Error('release chunk unavailable');
            reader = response.body.getReader();
            chunkIndex += 1;
          }
          const { done, value } = await reader.read();
          if (done) {
            reader.releaseLock();
            reader = null;
            continue;
          }
          controller.enqueue(value);
          return;
        }
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel(reason) {
      if (reader) await reader.cancel(reason);
    }
  });
}

export async function handleReleaseDownload(request, env) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return plainResponse(405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
  }
  if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    return plainResponse(503, 'Release assets unavailable');
  }
  const filename = parseFilename(request);
  if (!filename) {
    const pathname = new URL(request.url).pathname;
    if (/\.(?:exe|apk)$/i.test(pathname)) return plainResponse(404, 'Not Found');
    return null;
  }
  const loaded = await loadDownloadEntry(request, env, filename);
  if (loaded.fallback) return null;
  if (loaded.error) return loaded.error;
  const chunkUrls = await preflightChunks(request, env, loaded.entry);
  if (!chunkUrls) return plainResponse(503, 'Release asset unavailable');
  const headers = buildDownloadHeaders(loaded.entry);
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
  return new Response(streamChunks(request, env, chunkUrls), { status: 200, headers });
}
