import { buildCorsHeaders } from './worker-http-helpers.js';

// ---------------------------------------------------------------------------
// HTML shell protection
// ---------------------------------------------------------------------------

function shouldProtectHtmlResponse(request, response) {
  if (!response || !response.ok) return false;
  const method = String(request.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return false;
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  return contentType.includes('text/html');
}

function getHtmlShellCacheControl() {
  return 'no-store, max-age=0, must-revalidate, no-transform';
}

function protectHtmlResponse(request, response) {
  if (!shouldProtectHtmlResponse(request, response)) return response;
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', getHtmlShellCacheControl());
  headers.set('CDN-Cache-Control', 'no-store');
  headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// ---------------------------------------------------------------------------
// Static asset cache-control
// ---------------------------------------------------------------------------

function isStaticAssetPath(pathname) {
  return /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|eot|ico)$/i.test(pathname);
}

function isVersionedStaticAsset(url) {
  const pathname = String(url.pathname || '');
  if (/\/assets\/vendor\//.test(pathname)) return true;
  if (/\.(?:woff2?|ttf|eot)$/i.test(pathname)) return true;
  return /-[A-Za-z0-9_-]{6,}\.(?:js|css|png|jpg|jpeg|gif|svg|webp|avif)$/i.test(pathname);
}

function getStaticAssetCacheControl(url) {
  const pathname = String(url.pathname || '');
  if (pathname === '/sw.js' || pathname.endsWith('/sw.js')) {
    return 'public, max-age=0, must-revalidate';
  }
  if (pathname.startsWith('/assets/js/')) {
    return getHtmlShellCacheControl();
  }
  if (!isStaticAssetPath(pathname)) return '';
  if (isVersionedStaticAsset(url)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=3600, stale-while-revalidate=86400';
}

function shouldExposeStaticAssetCors(url) {
  const pathname = String(url.pathname || '');
  return pathname.startsWith('/assets/audio/');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply HTML and static asset protections to a response fetched from ASSETS.
 * - Forces no-store / CDN-no-store on HTML shell responses.
 * - Injects immutable / long-lived Cache-Control on versioned static assets.
 * - Adds CORS headers for audio assets.
 *
 * @param {Request} request  The original incoming request.
 * @param {Response} response  The response from env.ASSETS.fetch().
 * @returns {Response}
 */
export function protectAssetResponse(request, response) {
  const protectedHtml = protectHtmlResponse(request, response);
  if (!protectedHtml || !protectedHtml.ok || shouldProtectHtmlResponse(request, protectedHtml)) {
    return protectedHtml;
  }
  const method = String(request.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return protectedHtml;
  const requestUrl = new URL(request.url);
  const cacheControl = getStaticAssetCacheControl(requestUrl);
  const exposeCors = shouldExposeStaticAssetCors(requestUrl);
  if (!cacheControl && !exposeCors) return protectedHtml;
  const headers = new Headers(protectedHtml.headers);
  if (cacheControl) headers.set('Cache-Control', cacheControl);
  headers.set('X-Content-Type-Options', 'nosniff');
  if (exposeCors) {
    Object.entries(buildCorsHeaders(request)).forEach(([key, value]) => headers.set(key, value));
  }
  return new Response(protectedHtml.body, {
    status: protectedHtml.status,
    statusText: protectedHtml.statusText,
    headers
  });
}
