/**
 * Service Worker (PWA 离线支持)
 * 目标：保证 Service Worker 能稳定注册、缓存应用壳资源，并在离线时提供可预测的兜底。
 */

const CACHE_VERSION = 'school-system-v1.1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 仅预缓存确定存在的应用壳资源，避免因无效路径导致安装失败。
const APP_SHELL_ASSETS = [
    './',
    './index.html',
    './favicon.ico',
    './history-grade.js'
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

    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.protocol === 'chrome-extension:') return;

    if (request.mode === 'navigate' || acceptsHtml(request)) {
        event.respondWith(networkFirstHtml(request));
        return;
    }

    if (isApiRequest(url.pathname)) {
        event.respondWith(networkFirstApi(request));
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
        return new Response('资源加载失败', { status: 404 });
    }
}

async function networkFirstApi(request) {
    try {
        const response = await fetch(request);
        if (isCacheable(response)) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
            JSON.stringify({ error: '网络不可用，且无缓存数据' }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
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
            '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>离线模式</title><body><h1>当前处于离线模式</h1><p>请在网络恢复后刷新页面重试。</p></body></html>',
            {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
        );
    }
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

function isApiRequest(pathname) {
    return pathname.includes('/api/') || pathname.includes('/rest/');
}

self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(Promise.resolve());
    }
});

console.log('[SW] loaded');
