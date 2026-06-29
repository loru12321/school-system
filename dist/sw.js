/**
 * Service Worker (PWA offline support)
 * Keeps registration stable, caches the app shell, and provides predictable
 * fallbacks when the network is unavailable.
 */

const CACHE_VERSION = 'school-system-runtime-7104c5af4163';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Only precache deterministic app shell assets to avoid install failures.
const APP_SHELL_ASSETS = [
    './',
    './index.html',
    './favicon.ico',
    './icon.svg',
    './site.webmanifest',
    './robots.txt',
    './sitemap.xml'
];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(STATIC_CACHE);
        await Promise.all(APP_SHELL_ASSETS.map(asset => precacheAsset(cache, asset)));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames
                .filter(name => ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(name))
                .map(name => caches.delete(name))
        );
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const { request } = event;

    const url = new URL(request.url);
    if (url.protocol === 'chrome-extension:') return;

    if (request.method !== 'GET') {
        if (isApiRequest(url.pathname)) {
            event.waitUntil(clearApiCacheAfterMutation(url));
        }
        return;
    }

    if (request.mode === 'navigate' || acceptsHtml(request)) {
        event.respondWith(networkFirstHtml(request));
        return;
    }

    if (isApiRequest(url.pathname)) {
        event.respondWith(networkFirstApi(request, url));
        return;
    }

    if (isRuntimeAsset(url.pathname)) {
        event.respondWith(isVersionedRuntimeAsset(url)
            ? cacheFirstRuntimeAsset(request)
            : networkFirstRuntimeAsset(request));
        return;
    }

    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStatic(request));
        return;
    }

    event.respondWith(fetch(request));
});

async function precacheAsset(cache, asset) {
    try {
        await cache.add(new Request(asset, { cache: 'reload' }));
    } catch (error) {
        console.warn('[SW] precache skipped:', asset, error);
    }
}

async function cacheFirstStatic(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (isCacheable(response)) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Resource unavailable while offline', { status: 404 });
    }
}

async function networkFirstRuntimeAsset(request) {
    try {
        const response = await fetch(new Request(request, { cache: 'reload' }));
        if (isCacheable(response)) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('Runtime resource unavailable while offline', { status: 404 });
    }
}

async function cacheFirstRuntimeAsset(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (isCacheable(response)) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Runtime resource unavailable while offline', { status: 404 });
    }
}

async function networkFirstApi(request, url) {
    const eligible = isApiCacheEligible(url);
    if (eligible) {
        const cache = await caches.open(API_CACHE);
        const cached = await cache.match(request);
        if (cached) {
            fetch(request).then((r) => { if (r.ok) cache.put(request, r.clone()); }).catch(() => {});
            return cached;
        }
    }
    try {
        const response = await fetch(request);
        if (isCacheable(response) && eligible) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
            JSON.stringify({ error: 'Network unavailable and no cached data exists' }),
            {
                status: 503,
                headers: buildOfflineHeaders('application/json; charset=utf-8')
            }
        );
    }
}

async function networkFirstHtml(request) {
    try {
        const response = await fetch(request);
        if (isCacheable(response)) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        const shell = await caches.match('./index.html') || await caches.match('./');
        if (shell) return shell;

        return new Response(
            '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>离线模式</title><body><h1>离线模式</h1><p>网络恢复后请刷新页面。</p></body></html>',
            {
                status: 503,
                headers: buildOfflineHeaders('text/html; charset=utf-8')
            }
        );
    }
}

function buildOfflineHeaders(contentType) {
    return {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
    };
}

function isCacheable(response) {
    return !!response && response.ok;
}

function acceptsHtml(request) {
    const accept = request.headers.get('accept') || '';
    return accept.includes('text/html');
}

function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/i.test(pathname);
}

function isRuntimeAsset(pathname) {
    return /\.(js|css)$/i.test(pathname) && !pathname.includes('/assets/vendor/');
}

function isVersionedRuntimeAsset(url) {
    if (!url || !isRuntimeAsset(url.pathname)) return false;
    return url.searchParams.has('v') || /-[0-9a-f]{8,}\.(?:js|css)$/i.test(url.pathname);
}

function isApiRequest(pathname) {
    return pathname.includes('/api/') || pathname.includes('/rest/');
}

function isApiCacheEligible(url) {
    const pathname = String(url && url.pathname || '');
    if (pathname === '/api/health') return true;
    if (pathname === '/api/system-data') {
        const searchParams = url && url.searchParams;
        return !!searchParams
            && searchParams.has('select')
            && (searchParams.has('key') || searchParams.has('limit'));
    }
    return false;
}

async function clearApiCacheAfterMutation(url) {
    if (!url || !isApiRequest(url.pathname)) return;
    await caches.delete(API_CACHE);
}

self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(Promise.resolve());
    }
});
