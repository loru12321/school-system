(function (root) {
    if (!root || root.CloudSyncIndicator) return;

    const CLOUD_STARTUP_LOAD_TIMEOUT_MS = 25000;
    const SYSTEM_DATA_READ_TTL_MS = 5 * 60 * 1000;
    const SYSTEM_DATA_SELECT_TTL_MS = 2 * 60 * 1000;
    const SYSTEM_DATA_MAX_CACHE_SIZE = 120;
    const systemDataCache = new Map();
    const systemDataInflight = new Map();

    async function withTimeout(promise, timeoutMs = 8000, timeoutMessage = 'Request timeout') {
        let timer = null;
        const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        });
        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    function getCloudApiRuntime() {
        return root.CloudApi && typeof root.CloudApi === 'object' ? root.CloudApi : null;
    }

    function stableCacheString(value) {
        if (value == null) return '';
        if (typeof value !== 'object') return String(value);
        if (Array.isArray(value)) return `[${value.map(stableCacheString).join(',')}]`;
        return `{${Object.keys(value).sort().map((key) => `${key}:${stableCacheString(value[key])}`).join(',')}}`;
    }

    function cloneCacheValue(value) {
        if (value == null) return value;
        if (typeof root.structuredClone === 'function') {
            try {
                return root.structuredClone(value);
            } catch (_) { }
        }
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_) {
            return value;
        }
    }

    function readSystemDataCache(cacheKey) {
        const cached = systemDataCache.get(cacheKey);
        if (!cached) return { hit: false };
        if (Date.now() - cached.time > cached.ttlMs) {
            systemDataCache.delete(cacheKey);
            return { hit: false };
        }
        return { hit: true, value: cloneCacheValue(cached.value) };
    }

    function rememberSystemDataCache(cacheKey, value, ttlMs) {
        if (!cacheKey || ttlMs <= 0) return;
        systemDataCache.set(cacheKey, {
            time: Date.now(),
            ttlMs,
            value: cloneCacheValue(value)
        });
        if (systemDataCache.size > SYSTEM_DATA_MAX_CACHE_SIZE) {
            const firstKey = systemDataCache.keys().next().value;
            if (firstKey) systemDataCache.delete(firstKey);
        }
    }

    function runCachedSystemData(cacheKey, ttlMs, task) {
        const cached = readSystemDataCache(cacheKey);
        if (cached.hit) return Promise.resolve(cached.value);
        if (systemDataInflight.has(cacheKey)) return systemDataInflight.get(cacheKey);
        const promise = Promise.resolve()
            .then(task)
            .then((value) => {
                if (!value?.error) rememberSystemDataCache(cacheKey, value, ttlMs);
                return value;
            })
            .finally(() => systemDataInflight.delete(cacheKey));
        systemDataInflight.set(cacheKey, promise);
        return promise;
    }

    function clearSystemDataRuntimeCache(prefix = '') {
        const text = String(prefix || '');
        if (!text) {
            systemDataCache.clear();
            systemDataInflight.clear();
            root.CloudDataService?.clear?.();
            return;
        }
        Array.from(systemDataCache.keys()).forEach((key) => {
            if (String(key).includes(text)) systemDataCache.delete(key);
        });
        Array.from(systemDataInflight.keys()).forEach((key) => {
            if (String(key).includes(text)) systemDataInflight.delete(key);
        });
        root.CloudDataService?.clear?.(text);
    }

    async function selectSystemDataRecords(options = {}) {
        const cacheKey = options.cache === false || options.noCache === true || options.force === true
            ? ''
            : `system-data:select:${stableCacheString({
                select: options.select || 'key',
                keyEq: options.keyEq || '',
                keyLike: options.keyLike || '',
                keyIn: Array.isArray(options.keyIn) ? options.keyIn : [],
                order: options.order || '',
                ascending: !!options.ascending,
                limit: options.limit || '',
                maybeSingle: !!options.maybeSingle
            })}`;
        if (cacheKey) {
            return runCachedSystemData(cacheKey, SYSTEM_DATA_SELECT_TTL_MS, () => selectSystemDataRecords({ ...options, cache: false }));
        }

        const api = getCloudApiRuntime();
        if (api && typeof api.selectSystemData === 'function') {
            return api.selectSystemData(options);
        }

        const cloudClient = root.cloudClient || root.sbClient;
        if (!cloudClient) {
            return {
                data: options.maybeSingle ? null : [],
                error: new Error('CLOUD_CLIENT_MISSING'),
                source: 'none'
            };
        }

        try {
            let query = cloudClient.from('system_data').select(options.select || 'key');
            if (options.keyEq) {
                query = query.eq('key', options.keyEq);
            } else if (options.keyLike) {
                query = query.like('key', options.keyLike);
            } else if (Array.isArray(options.keyIn) && options.keyIn.length) {
                query = query.in('key', options.keyIn);
            }
            if (options.order) {
                query = query.order(options.order, { ascending: !!options.ascending });
            }
            if (Number.isFinite(Number(options.limit)) && Number(options.limit) > 0) {
                query = query.limit(Number(options.limit));
            }
            if (options.maybeSingle) {
                query = query.maybeSingle();
            }
            const result = await query;
            return {
                data: result?.data ?? (options.maybeSingle ? null : []),
                error: result?.error || null,
                source: 'compat'
            };
        } catch (error) {
            return {
                data: options.maybeSingle ? null : [],
                error: error instanceof Error ? error : new Error(String(error)),
                source: 'compat'
            };
        }
    }

    async function readSystemDataRecord(key, select = 'content') {
        const normalizedKey = String(key || '').trim();
        const cacheKey = `system-data:read:${normalizedKey}:${String(select || 'content')}`;
        return runCachedSystemData(cacheKey, SYSTEM_DATA_READ_TTL_MS, () => selectSystemDataRecords({
            select,
            keyEq: normalizedKey,
            maybeSingle: true,
            cache: false
        }));
    }

    async function upsertSystemDataRecord(rows) {
        clearSystemDataRuntimeCache();
        const api = getCloudApiRuntime();
        if (api && typeof api.upsertSystemData === 'function') {
            return api.upsertSystemData(rows);
        }
        const cloudClient = root.cloudClient || root.sbClient;
        if (!cloudClient) {
            return { data: null, error: new Error('CLOUD_CLIENT_MISSING'), source: 'none' };
        }
        try {
            const result = await cloudClient.from('system_data').upsert(rows, { onConflict: 'key' });
            return { data: result?.data ?? null, error: result?.error || null, source: 'compat' };
        } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error(String(error)), source: 'compat' };
        }
    }

    async function deleteSystemDataRecords(options = {}) {
        clearSystemDataRuntimeCache();
        const api = getCloudApiRuntime();
        if (api && typeof api.deleteSystemData === 'function') {
            return api.deleteSystemData(options);
        }
        const cloudClient = root.cloudClient || root.sbClient;
        if (!cloudClient) {
            return { data: null, error: new Error('CLOUD_CLIENT_MISSING'), source: 'none' };
        }
        try {
            let query = cloudClient.from('system_data').delete();
            if (options.keyEq) {
                query = query.eq('key', options.keyEq);
            } else if (Array.isArray(options.keyIn) && options.keyIn.length) {
                query = query.in('key', options.keyIn);
            } else {
                return { data: null, error: new Error('SYSTEM_DATA_DELETE_FILTER_MISSING'), source: 'compat' };
            }
            const result = await query;
            return { data: result?.data ?? null, error: result?.error || null, source: 'compat' };
        } catch (error) {
            return { data: null, error: error instanceof Error ? error : new Error(String(error)), source: 'compat' };
        }
    }

    async function probeSystemDataConnection() {
        const api = getCloudApiRuntime();
        if (api && typeof api.probeSystemData === 'function') {
            const result = await api.probeSystemData();
            if (!result.ok) throw result.error || new Error('SYSTEM_DATA_PROBE_FAILED');
            return result;
        }
        const result = await selectSystemDataRecords({ select: 'key', limit: 1 });
        if (result.error) throw result.error;
        return result;
    }

    const CloudSyncIndicator = {
        el: null,
        timer: null,
        state: 'idle',
        started: false,
        probeTimer: null,
        probePromise: null,
        lastProbeAt: 0,
        probeMinInterval: 12000,
        ensure: function () {
            if (this.el && root.document && root.document.body.contains(this.el)) return this.el;
            const node = root.document.createElement('div');
            node.id = 'cloud-sync-indicator';
            node.style.cssText = [
                'position:fixed',
                'top:12px',
                'right:12px',
                'z-index:10000',
                'display:flex',
                'align-items:center',
                'gap:8px',
                'padding:6px 10px',
                'border-radius:9999px',
                'font-size:12px',
                'font-weight:600',
                'border:1px solid #cbd5e1',
                'background:rgba(255,255,255,0.9)',
                'color:#334155',
                'backdrop-filter:blur(6px)',
                'box-shadow:0 4px 12px rgba(15,23,42,0.08)'
            ].join(';');
            node.innerHTML = '<span style="font-size:10px;">●</span><span>云端: 未连接</span>';
            root.document.body.appendChild(node);
            this.el = node;
            return node;
        },
        set: function (state, detail = '') {
            const el = this.ensure();
            this.state = state;
            if (this.timer) clearTimeout(this.timer);
            const map = {
                idle: { dot: '#94a3b8', text: '未连接', bg: 'rgba(255,255,255,0.9)', bd: '#cbd5e1', fg: '#334155' },
                connecting: { dot: '#f59e0b', text: '连接中', bg: '#fffbeb', bd: '#fde68a', fg: '#92400e' },
                connected: { dot: '#10b981', text: '已连接', bg: '#ecfdf5', bd: '#86efac', fg: '#065f46' },
                syncing: { dot: '#0ea5e9', text: '同步中', bg: '#eff6ff', bd: '#bfdbfe', fg: '#1e3a8a' },
                success: { dot: '#22c55e', text: '同步成功', bg: '#ecfdf5', bd: '#86efac', fg: '#166534' },
                error: { dot: '#ef4444', text: '同步失败', bg: '#fef2f2', bd: '#fecaca', fg: '#991b1b' }
            };
            const cfg = map[state] || map.idle;
            const text = detail ? `${cfg.text} (${detail})` : cfg.text;
            el.style.background = cfg.bg;
            el.style.borderColor = cfg.bd;
            el.style.color = cfg.fg;
            el.innerHTML = `<span style="font-size:10px;color:${cfg.dot};">●</span><span>云端: ${text}</span>`;

            if (state === 'success') {
                this.timer = setTimeout(() => this.set('connected'), 2200);
            }
        },
        probe: async function (force = false) {
            if (this.probePromise) return this.probePromise;
            const now = Date.now();
            const recentlyChecked = this.lastProbeAt && now - this.lastProbeAt < this.probeMinInterval;
            if (!force && recentlyChecked && (this.state === 'connected' || this.state === 'connecting')) {
                return;
            }
            this.lastProbeAt = now;
            this.probePromise = (async () => {
                const authState = root.AuthState;
                const hasSessionUser = authState && typeof authState.hasActiveSession === 'function'
                    ? authState.hasActiveSession(root.Auth && root.Auth.currentUser)
                    : !!(root.Auth && root.Auth.currentUser);
                if (!hasSessionUser) {
                    this.set('idle');
                    return;
                }
                if (root.navigator && !root.navigator.onLine) {
                    this.set('error', '离线');
                    return;
                }
                if (!root.CloudApi && !root.sbClient) {
                    this.set('connecting', '等待初始化');
                    return;
                }
                try {
                    await withTimeout(probeSystemDataConnection(), 4000, 'probe-timeout');
                    this.set('connected');
                } catch (e) {
                    this.set('error', '连接异常');
                }
            })().finally(() => {
                this.probePromise = null;
            });
            return this.probePromise;
        },
        start: function () {
            if (this.started) return;
            this.started = true;
            this.ensure();
            this.probe(true);
            root.addEventListener('online', () => this.probe(true));
            root.addEventListener('offline', () => this.set('error', '离线'));
            this.probeTimer = setInterval(() => this.probe(), 30000);
        }
    };

    root.CLOUD_STARTUP_LOAD_TIMEOUT_MS = CLOUD_STARTUP_LOAD_TIMEOUT_MS;
    root.withTimeout = withTimeout;
    root.getCloudApiRuntime = getCloudApiRuntime;
    root.selectSystemDataRecords = selectSystemDataRecords;
    root.readSystemDataRecord = readSystemDataRecord;
    root.upsertSystemDataRecord = upsertSystemDataRecord;
    root.deleteSystemDataRecords = deleteSystemDataRecords;
    root.probeSystemDataConnection = probeSystemDataConnection;
    root.clearSystemDataRuntimeCache = clearSystemDataRuntimeCache;
    root.CloudSyncIndicator = CloudSyncIndicator;
})(typeof globalThis !== 'undefined' ? globalThis : this);
