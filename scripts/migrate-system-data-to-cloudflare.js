const DEFAULT_SOURCE_SUPABASE_URL = 'https://okwcciujnfvobbwaydiv.supabase.co';
const DEFAULT_SOURCE_SUPABASE_KEY = 'sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4';
const DEFAULT_TARGET_BASE_URL = 'https://schoolsystem.com.cn';
const DEFAULT_BATCH_SIZE = 20;

function normalizeBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function toNumber(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
}

async function readJson(response) {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : null;
    } catch (error) {
        throw new Error(`Invalid JSON response (${response.status}): ${text.slice(0, 300)}`);
    }
}

async function fetchSourceBatch(sourceUrl, sourceKey, offset, batchSize) {
    const url = `${sourceUrl}/rest/v1/system_data?select=key,content,created_at,updated_at&order=updated_at.asc&limit=${batchSize}&offset=${offset}`;
    const response = await fetch(url, {
        headers: {
            'apikey': sourceKey,
            'Authorization': `Bearer ${sourceKey}`,
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Source fetch failed (${response.status}): ${detail.slice(0, 400)}`);
    }
    const data = await readJson(response);
    return Array.isArray(data) ? data : [];
}

async function pushTargetBatch(targetBaseUrl, rows) {
    const response = await fetch(`${targetBaseUrl}/sb/rest/v1/system_data?on_conflict=key`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(rows)
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Target upsert failed (${response.status}): ${detail.slice(0, 400)}`);
    }
    return readJson(response);
}

async function verifyTargetHealth(targetBaseUrl) {
    const response = await fetch(`${targetBaseUrl}/api/health`, {
        headers: {
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Health check failed (${response.status}): ${detail.slice(0, 400)}`);
    }
    return readJson(response);
}

async function main() {
    const sourceUrl = normalizeBaseUrl(process.env.SOURCE_SUPABASE_URL || DEFAULT_SOURCE_SUPABASE_URL);
    const sourceKey = String(process.env.SOURCE_SUPABASE_KEY || DEFAULT_SOURCE_SUPABASE_KEY).trim();
    const targetBaseUrl = normalizeBaseUrl(process.env.TARGET_BASE_URL || DEFAULT_TARGET_BASE_URL);
    const batchSize = toNumber(process.env.BATCH_SIZE || DEFAULT_BATCH_SIZE, DEFAULT_BATCH_SIZE);

    if (!sourceUrl || !sourceKey || !targetBaseUrl) {
        throw new Error('SOURCE_SUPABASE_URL, SOURCE_SUPABASE_KEY, TARGET_BASE_URL are required');
    }

    const health = await verifyTargetHealth(targetBaseUrl);
    console.log('Target health:', JSON.stringify(health));

    let offset = 0;
    let total = 0;
    let batchIndex = 0;

    while (true) {
        const rows = await fetchSourceBatch(sourceUrl, sourceKey, offset, batchSize);
        if (!rows.length) break;

        const payload = rows.map((row) => ({
            key: String(row.key || '').trim(),
            content: typeof row.content === 'string' ? row.content : '',
            created_at: String(row.created_at || '').trim(),
            updated_at: String(row.updated_at || '').trim()
        })).filter((row) => row.key && row.content);

        if (payload.length) {
            await pushTargetBatch(targetBaseUrl, payload);
        }

        batchIndex += 1;
        total += rows.length;
        offset += rows.length;
        console.log(`Migrated batch ${batchIndex}: ${rows.length} rows (total ${total})`);

        if (rows.length < batchSize) break;
    }

    console.log(`Migration complete. Total rows migrated: ${total}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
