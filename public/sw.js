/**
 * 🟢 Service Worker (PWA 离线支持)
 * 用途：缓存关键资源，实现离线访问和后台同步
 * 
 * 缓存策略：
 * 1. 静态资源（JS, CSS, 字体）：Cache First（优先使用缓存）
 * 2. HTML 页面：Network First（优先使用网络，网络失败时使用缓存）
 * 3. API 数据：Network First（优先使用网络，网络失败时使用缓存）
 */

const CACHE_VERSION = 'school-system-v1.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 需要预缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/public/assets/css/style.css',
    '/public/assets/js/app.js',
    '/public/assets/js/cloud.js',
    '/public/assets/js/data-pagination.js',
    '/public/assets/libs/chart.js',
    '/public/assets/libs/xlsx.full.min.js',
    '/public/assets/libs/lz-string.js'
];

/**
 * Service Worker 安装事件
 * 预加载静态资源到缓存
 */
self.addEventListener('install', event => {
    console.log('🔧 Service Worker 正在安装...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            console.log('📦 预加载静态资源到缓存');
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('⚠️ 部分资源预加载失败（可能是网络问题）:', err);
                // 即使部分资源加载失败，也继续安装
                return Promise.resolve();
            });
        })
    );
    
    self.skipWaiting();
});

/**
 * Service Worker 激活事件
 * 清理旧版本的缓存
 */
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker 已激活');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
                    .map(name => {
                        console.log(`🗑️ 删除旧缓存: ${name}`);
                        return caches.delete(name);
                    })
            );
        })
    );
    
    self.clients.claim();
});

/**
 * Service Worker 请求拦截
 * 根据资源类型采用不同的缓存策略
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // 跳过非 GET 请求
    if (request.method !== 'GET') {
        return;
    }

    // 跳过 Chrome 扩展请求
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // 1. 静态资源：Cache First 策略
    if (isStaticAsset(url.pathname)) {
        event.respondWith(
            caches.match(request).then(response => {
                if (response) {
                    console.log(`✅ 从缓存加载: ${url.pathname}`);
                    return response;
                }

                return fetch(request).then(response => {
                    // 仅缓存成功的响应
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(STATIC_CACHE).then(cache => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                }).catch(() => {
                    console.warn(`❌ 无法加载静态资源: ${url.pathname}`);
                    return new Response('资源加载失败', { status: 404 });
                });
            })
        );
        return;
    }

    // 2. API 请求：Network First 策略
    if (isApiRequest(url.pathname)) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // 缓存成功的 API 响应
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(API_CACHE).then(cache => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // 网络失败，尝试从缓存读取
                    console.log(`🔄 网络失败，尝试从缓存读取: ${url.pathname}`);
                    return caches.match(request).then(response => {
                        if (response) {
                            return response;
                        }
                        return new Response(
                            JSON.stringify({ error: '网络不可用，且无缓存数据' }),
                            { status: 503, headers: { 'Content-Type': 'application/json' } }
                        );
                    });
                })
        );
        return;
    }

    // 3. HTML 页面：Network First 策略
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    console.log(`🔄 网络失败，尝试从缓存读取 HTML: ${url.pathname}`);
                    return caches.match(request).then(response => {
                        if (response) {
                            return response;
                        }
                        // 返回离线页面
                        return caches.match('/offline.html').catch(() => {
                            return new Response('离线模式下无法访问此页面', { status: 503 });
                        });
                    });
                })
        );
        return;
    }

    // 4. 其他资源：使用默认行为
    event.respondWith(fetch(request).catch(() => {
        return new Response('资源加载失败', { status: 404 });
    }));
});

/**
 * 判断是否为静态资源
 * @param {String} pathname - 请求路径
 * @returns {Boolean}
 */
function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/.test(pathname);
}

/**
 * 判断是否为 API 请求
 * @param {String} pathname - 请求路径
 * @returns {Boolean}
 */
function isApiRequest(pathname) {
    return pathname.includes('/api/') || pathname.includes('/rest/');
}

/**
 * 后台同步（可选）
 * 当网络恢复时，自动同步待发送的数据
 */
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        console.log('🔄 后台同步已触发');
        event.waitUntil(
            // 这里可以添加数据同步逻辑
            Promise.resolve()
        );
    }
});

console.log('✅ Service Worker 已加载');
