const DEFAULT_BASE_URL = process.env.AI_GATEWAY_URL || process.env.SITE_URL || 'https://schoolsystem.com.cn';
const CHAT_PATH = process.env.AI_GATEWAY_CHAT_PATH || '/api/ai/chat';
const DIAGNOSE_PATH = process.env.AI_GATEWAY_DIAGNOSE_PATH || '/api/ai/diagnose';
const HEALTH_PATH = process.env.AI_GATEWAY_HEALTH_PATH || '/api/health';
const REQUEST_TIMEOUT_MS = Number(process.env.AI_GATEWAY_TIMEOUT_MS || 30000);

function normalizeBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function joinUrl(baseUrl, path) {
    const normalizedBase = normalizeBaseUrl(baseUrl);
    const normalizedPath = String(path || '').trim();
    if (!normalizedBase) throw new Error('AI_GATEWAY_URL is required');
    if (!normalizedPath.startsWith('/')) return `${normalizedBase}/${normalizedPath}`;
    return `${normalizedBase}${normalizedPath}`;
}

async function fetchJson(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (error) {
            data = null;
        }
        return { response, text, data };
    } finally {
        clearTimeout(timer);
    }
}

function summarizeResult(name, result) {
    const status = result.response ? result.response.status : 0;
    const dataError = result.data && typeof result.data === 'object' ? result.data.error : '';
    const text = String(result.text || '').trim();
    return {
        name,
        status,
        ok: status >= 200 && status < 300,
        error: dataError || text.slice(0, 200)
    };
}

function isMissingKeyResponse(result) {
    return result.response
        && result.response.status === 400
        && result.data
        && result.data.error === 'AI_API_KEY_MISSING';
}

async function main() {
    const baseUrl = normalizeBaseUrl(DEFAULT_BASE_URL);
    const healthUrl = joinUrl(baseUrl, HEALTH_PATH);
    const chatUrl = joinUrl(baseUrl, CHAT_PATH);
    const diagnoseUrl = joinUrl(baseUrl, DIAGNOSE_PATH);

    const health = await fetchJson(healthUrl);
    const chat = await fetchJson(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: 'hello',
            model: 'deepseek-chat',
            stream: false
        })
    });
    const diagnose = await fetchJson(diagnoseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: 'hello diagnose',
            model: 'deepseek-chat'
        })
    });

    const summary = {
        baseUrl,
        health: summarizeResult('health', health),
        chat: summarizeResult('chat', chat),
        diagnose: summarizeResult('diagnose', diagnose),
        configured: chat.ok || diagnose.ok,
        missingKey: isMissingKeyResponse(chat) && isMissingKeyResponse(diagnose)
    };

    console.log(JSON.stringify(summary, null, 2));

    if (!health.response || !health.response.ok) {
        process.exitCode = 1;
        return;
    }

    if (summary.configured || summary.missingKey) {
        process.exitCode = 0;
        return;
    }

    process.exitCode = 1;
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
