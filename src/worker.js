import { handleGatewayRequest } from './worker-gateway-d1.js';
import {
  buildCorsHeaders,
  jsonResponse,
  buildErrorDetail,
  buildWorkerErrorBody,
  buildWorkerErrorHeaders
} from './worker-http-helpers.js';
import {
  SYSTEM_DATA_API_PATH,
  SYSTEM_DATA_BOOTSTRAP_API_PATH,
  SYSTEM_DATA_PATH,
  handleSystemDataProxy,
  handleSystemDataBootstrapProxy,
  handleCloudRestProxy,
  getSystemDataHealthInfo
} from './worker-system-data.js';
import { protectAssetResponse } from './worker-asset-protection.js';

// Production Cloudflare Worker entrypoint.
// Routing, static asset protection, and health reporting live here.
// All business logic is delegated to the domain modules imported above.
async function handleGatewayProxy(request, env, url, ctx) {
  try {
    const managed = await handleGatewayRequest(request, env, ctx);
    if (managed) return managed;
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: 'GATEWAY_DATA_RUNTIME_FAILED',
      detail: buildErrorDetail(error, env)
    }, request, env);
  }
  return jsonResponse(404, { ok: false, error: 'CLOUDFLARE_GATEWAY_ACTION_NOT_SUPPORTED' }, request, env);
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (request.method === 'OPTIONS' && (
        url.pathname === '/api/edu-gateway'
        || url.pathname === '/api/gateway'
        || url.pathname === SYSTEM_DATA_API_PATH
        || url.pathname === SYSTEM_DATA_BOOTSTRAP_API_PATH
        || url.pathname.startsWith('/sb/')
      )) {
        return new Response(null, { status: 204, headers: buildCorsHeaders(request, env) });
      }

      if (url.pathname === '/api/health') {
        return jsonResponse(200, { ok: true, ...getSystemDataHealthInfo(env) }, request, env);
      }

      if (url.pathname === '/api/csp-report') {
        // Surface violations in Workers observability logs so the CSP can be
        // tightened (unsafe-inline / unsafe-eval) with real data.
        if (request.method === 'POST') {
          try {
            const text = (await request.text()).slice(0, 4096);
            const report = JSON.parse(text || '{}');
            const item = report['csp-report'] || (Array.isArray(report) ? report[0]?.body : report?.body) || report;
            console.warn('[csp-report]', JSON.stringify({
              directive: item?.['violated-directive'] || item?.effectiveDirective || '',
              blocked: item?.['blocked-uri'] || item?.blockedURL || '',
              source: item?.['source-file'] || item?.sourceFile || '',
              line: item?.['line-number'] || item?.lineNumber || 0
            }));
          } catch (_) { /* ignore malformed reports */ }
        }
        return new Response(null, {
          status: 204,
          headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
        });
      }

      if (url.pathname === '/api/edu-gateway' || url.pathname === '/api/edu_gateway' || url.pathname === '/api/gateway') {
        return await handleGatewayProxy(request, env, url, ctx);
      }

      if (url.pathname === SYSTEM_DATA_API_PATH) {
        return await handleSystemDataProxy(request, env, url);
      }

      if (url.pathname === SYSTEM_DATA_BOOTSTRAP_API_PATH) {
        return await handleSystemDataBootstrapProxy(request, env);
      }

      if (url.pathname.startsWith('/sb/')) {
        return await handleCloudRestProxy(request, env, url);
      }

      try {
        const response = await env.ASSETS.fetch(request);
        return protectAssetResponse(request, response);
      } catch (error) {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      return new Response(JSON.stringify(buildWorkerErrorBody(error, env)), {
        status: 500,
        headers: buildWorkerErrorHeaders()
      });
    }
  }
};
