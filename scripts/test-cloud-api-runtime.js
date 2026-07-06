const assert = require('assert');
const path = require('path');

const createCloudApiRuntime = require(path.resolve(__dirname, '../public/assets/js/cloud-api-runtime.js'));

function createMockStorage(initialState = {}) {
    const state = new Map(Object.entries(initialState));
    return {
        getItem(key) {
            return state.has(key) ? state.get(key) : null;
        },
        setItem(key, value) {
            state.set(key, String(value));
        },
        removeItem(key) {
            state.delete(key);
        }
    };
}

function createJsonResponse(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        async text() {
            return body == null ? '' : JSON.stringify(body);
        }
    };
}

function createSupabaseClient(log, options = {}) {
    return {
        from(table) {
            assert.strictEqual(table, 'system_data');
            const state = {
                table,
                select: '',
                keyEq: '',
                keyLike: '',
                keyIn: [],
                order: '',
                ascending: false,
                limit: null,
                rangeFrom: null,
                rangeTo: null,
                maybeSingle: false,
                deleting: false,
                updating: false,
                updatePayload: null
            };

            function execute() {
                log.push({ ...state });
                if (state.deleting) {
                    return { data: [], error: null };
                }
                if (state.updating) {
                    return { data: [{ key: state.keyEq, ...state.updatePayload }], error: null };
                }

                const rows = state.keyEq
                    ? [{ key: state.keyEq, content: '{"hello":"world"}' }]
                    : [{ key: 'LOCAL_KEY', content: '{"hello":"world"}' }];

                return {
                    data: state.maybeSingle ? rows[0] || null : rows,
                    error: null
                };
            }

            const query = {
                select(value) {
                    state.select = String(value || '');
                    return query;
                },
                eq(field, value) {
                    if (field === 'key') state.keyEq = String(value || '');
                    return query;
                },
                like(field, value) {
                    if (field === 'key') state.keyLike = String(value || '');
                    return query;
                },
                in(field, values) {
                    if (field === 'key') state.keyIn = Array.isArray(values) ? values.slice() : [];
                    return query;
                },
                order(field, orderOptions) {
                    state.order = String(field || '');
                    state.ascending = !!(orderOptions && orderOptions.ascending);
                    return query;
                },
                limit(value) {
                    state.limit = Number(value);
                    return query;
                },
                range(from, to) {
                    state.rangeFrom = Number(from);
                    state.rangeTo = Number(to);
                    return query;
                },
                maybeSingle() {
                    state.maybeSingle = true;
                    return query;
                },
                delete() {
                    state.deleting = true;
                    return query;
                },
                update(values) {
                    state.updating = true;
                    state.updatePayload = values;
                    return query;
                },
                then(resolve, reject) {
                    return Promise.resolve(execute()).then(resolve, reject);
                }
            };

            query.upsert = async function (payload, upsertOptions) {
                log.push({
                    type: 'upsert',
                    payload,
                    options: upsertOptions
                });
                if (options.duplicateOnUpsert) {
                    return {
                        data: null,
                        error: {
                            message: 'duplicate key value violates unique constraint "system_data_pkey"'
                        }
                    };
                }
                return { data: payload, error: null };
            };

            return query;
        }
    };
}

async function run() {
    const fetchLog = [];
    const apiRoot = {
        location: {
            protocol: 'https:',
            origin: 'https://schoolsystem.com.cn',
            hostname: 'schoolsystem.com.cn',
            href: 'https://schoolsystem.com.cn/'
        },
        SUPABASE_KEY: 'sb_publishable_example',
        sessionStorage: createMockStorage({
            'edu:session:token': 'session-token-example'
        }),
        fetch: async (url, init = {}) => {
            fetchLog.push({
                url: String(url),
                method: init.method || 'GET',
                headers: init.headers || {},
                body: init.body || ''
            });
            return createJsonResponse(200, [{ key: 'REMOTE_KEY', updated_at: '2026-04-11T00:00:00.000Z' }]);
        }
    };
    const apiRuntime = createCloudApiRuntime(apiRoot);

    assert.strictEqual(apiRuntime.getBackendMode(), 'api');
    assert.strictEqual(apiRuntime.getSystemDataApiUrl(), 'https://schoolsystem.com.cn/api/system-data');

    const apiResult = await apiRuntime.selectSystemData({
        select: 'key,updated_at',
        keyLike: '2022%',
        order: 'updated_at',
        limit: 50,
        offset: 25
    });

    assert.strictEqual(apiResult.error, null);
    assert.deepStrictEqual(apiResult.data, [{ key: 'REMOTE_KEY', updated_at: '2026-04-11T00:00:00.000Z' }]);
    assert.ok(fetchLog[0].url.includes('/api/system-data?'));
    assert.ok(fetchLog[0].url.includes('select=key%2Cupdated_at'));
    assert.ok(fetchLog[0].url.includes('key=like.2022%25'));
    assert.ok(fetchLog[0].url.includes('order=updated_at.desc'));
    assert.ok(fetchLog[0].url.includes('limit=50'));
    assert.ok(fetchLog[0].url.includes('offset=25'));
    assert.strictEqual(fetchLog[0].headers.apikey, 'sb_publishable_example');
    assert.strictEqual(fetchLog[0].headers.Authorization, 'Bearer session-token-example');

    apiResult.data[0].key = 'MUTATED_BY_CALLER';
    const cachedApiResult = await apiRuntime.selectSystemData({
        select: 'key,updated_at',
        keyLike: '2022%',
        order: 'updated_at',
        limit: 50,
        offset: 25
    });
    assert.strictEqual(fetchLog.length, 1, 'identical select should reuse cache');
    assert.deepStrictEqual(cachedApiResult.data, [{ key: 'REMOTE_KEY', updated_at: '2026-04-11T00:00:00.000Z' }]);
    const cacheStats = apiRuntime.getSystemDataCacheStats();
    assert.strictEqual(cacheStats.hits, 1);
    assert.strictEqual(cacheStats.misses, 1);
    assert.strictEqual(cacheStats.size, 1);
    assert.ok(Array.isArray(apiRuntime.getSystemDataPerfTimings()));
    assert.ok(apiRuntime.getSystemDataPerfTimings().some((entry) => entry.name === 'CloudApi.selectSystemData'));

    await apiRuntime.upsertSystemData({ key: 'REMOTE_KEY', content: '{}' });
    assert.strictEqual(fetchLog[1].method, 'POST');
    assert.ok(String(fetchLog[1].body).includes('"key":"REMOTE_KEY"'));
    assert.strictEqual(fetchLog[1].headers.apikey, 'sb_publishable_example');
    assert.strictEqual(fetchLog[1].headers.Authorization, 'Bearer session-token-example');

    await apiRuntime.deleteSystemData({ keyIn: ['REMOTE_KEY', 'OTHER_KEY'] });
    assert.strictEqual(fetchLog[2].method, 'DELETE');
    assert.ok(fetchLog[2].url.includes('key=in.%28REMOTE_KEY%2COTHER_KEY%29'));
    assert.strictEqual(fetchLog[2].headers.apikey, 'sb_publishable_example');
    assert.strictEqual(fetchLog[2].headers.Authorization, 'Bearer session-token-example');

    const gatewayFetchLog = [];
    const gatewayRoot = {
        location: {
            protocol: 'https:',
            origin: 'https://schoolsystem.com.cn',
            hostname: 'schoolsystem.com.cn',
            href: 'https://schoolsystem.com.cn/'
        },
        SUPABASE_KEY: 'sb_publishable_example',
        sessionStorage: createMockStorage({
            EDGE_GATEWAY_TOKEN_V1: 'edge-session-token'
        }),
        fetch: async (url, init = {}) => {
            gatewayFetchLog.push({
                url: String(url),
                method: init.method || 'GET',
                headers: init.headers || {},
                body: init.body || ''
            });
            return createJsonResponse(200, [{ key: 'REMOTE_KEY' }]);
        }
    };
    const gatewayRuntime = createCloudApiRuntime(gatewayRoot);
    await gatewayRuntime.upsertSystemData({ key: 'REMOTE_KEY', content: '{}' });
    assert.strictEqual(gatewayFetchLog[0].method, 'POST');
    assert.strictEqual(gatewayFetchLog[0].headers.Authorization, 'Bearer edge-session-token');

    const compatLog = [];
    const localRoot = {
        location: {
            protocol: 'file:',
            origin: 'null',
            hostname: '',
            href: 'file:///C:/Users/loru/Desktop/system/lt.html'
        },
        localStorage: createMockStorage(),
        sbClient: createSupabaseClient(compatLog)
    };
    const compatRuntime = createCloudApiRuntime(localRoot);

    assert.strictEqual(compatRuntime.getBackendMode(), 'compat');
    assert.strictEqual(compatRuntime.getSystemDataApiUrl(), '');

    const compatSelected = await compatRuntime.selectSystemData({
        select: 'key',
        order: 'updated_at',
        limit: 20,
        offset: 40
    });
    assert.strictEqual(compatSelected.error, null);
    assert.strictEqual(compatLog[0].limit, 20);
    assert.strictEqual(compatLog[0].rangeFrom, 40);
    assert.strictEqual(compatLog[0].rangeTo, 59);

    const localRead = await compatRuntime.readSystemDataRecord('LOCAL_KEY', 'content');
    assert.strictEqual(localRead.error, null);
    assert.deepStrictEqual(localRead.data, { key: 'LOCAL_KEY', content: '{"hello":"world"}' });
    assert.strictEqual(compatLog[1].select, 'content');
    assert.strictEqual(compatLog[1].keyEq, 'LOCAL_KEY');
    assert.strictEqual(compatLog[1].maybeSingle, true);

    const localProbe = await compatRuntime.probeSystemData();
    assert.strictEqual(localProbe.ok, true);

    await compatRuntime.upsertSystemData({ key: 'LOCAL_KEY', content: '{}' });
    assert.strictEqual(compatLog[3].type, 'upsert');
    assert.deepStrictEqual(compatLog[3].payload, { key: 'LOCAL_KEY', content: '{}' });

    await compatRuntime.deleteSystemData({ keyEq: 'LOCAL_KEY' });
    assert.strictEqual(compatLog[4].deleting, true);
    assert.strictEqual(compatLog[4].keyEq, 'LOCAL_KEY');

    const duplicateLog = [];
    const duplicateRoot = {
        location: {
            protocol: 'file:',
            origin: 'null',
            hostname: '',
            href: 'file:///C:/Users/loru/Desktop/system/lt.html'
        },
        localStorage: createMockStorage(),
        sbClient: createSupabaseClient(duplicateLog, { duplicateOnUpsert: true })
    };
    const duplicateRuntime = createCloudApiRuntime(duplicateRoot);
    const duplicateResult = await duplicateRuntime.upsertSystemData({ key: 'LOCAL_KEY', content: '{"v":1}' });
    assert.strictEqual(duplicateResult.error, null);
    assert.ok(duplicateLog.some((entry) => entry.updating === true), 'should fall back to update on duplicate key');

    console.log('cloud-api-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
