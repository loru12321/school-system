import { handleGatewayRequest } from './worker-gateway-d1.js';
import {
  buildCorsHeaders,
  jsonResponse,
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
const ENTRANCE_AUDIO_MANIFEST_API_PATH = '/api/entrance-audio-manifest';
const ENTRANCE_AUDIO_MANIFEST_ASSET_PATH = '/assets/audio/entrance/manifest.json';

async function handleGatewayProxy(request, env, url, ctx) {
  try {
    const managed = await handleGatewayRequest(request, env, ctx);
    if (managed) return managed;
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: 'GATEWAY_DATA_RUNTIME_FAILED',
      detail: error instanceof Error ? error.message : String(error)
    }, request);
  }
  return jsonResponse(404, { ok: false, error: 'CLOUDFLARE_GATEWAY_ACTION_NOT_SUPPORTED' }, request, env);
}

async function handleEntranceAudioManifest(request, env) {
  const method = String(request.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    return jsonResponse(405, { ok: false, error: 'ENTRANCE_AUDIO_MANIFEST_METHOD_NOT_ALLOWED' }, request, env);
  }
  const assetUrl = new URL(ENTRANCE_AUDIO_MANIFEST_ASSET_PATH, request.url);
  const assetResponse = await env.ASSETS.fetch(new Request(assetUrl.toString(), { method: 'GET' }));
  if (!assetResponse.ok) {
    return jsonResponse(404, { ok: false, error: 'ENTRANCE_AUDIO_MANIFEST_NOT_FOUND' }, request, env);
  }
  const headers = buildCorsHeaders(request, env);
  headers['Content-Type'] = 'application/json; charset=utf-8';
  headers['Cache-Control'] = 'no-store';
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-School-System-Gateway'] = 'cloudflare-worker';
  const body = method === 'HEAD' ? null : await assetResponse.text();
  return new Response(body, { status: 200, headers });
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
        || url.pathname === ENTRANCE_AUDIO_MANIFEST_API_PATH
        || url.pathname.startsWith('/sb/')
      )) {
        return new Response(null, { status: 204, headers: buildCorsHeaders(request, env) });
      }

      if (url.pathname === '/api/health') {
        return jsonResponse(200, { ok: true, ...getSystemDataHealthInfo(env) }, request, env);
      }

      if (url.pathname === '/api/csp-report') {
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

      if (url.pathname === ENTRANCE_AUDIO_MANIFEST_API_PATH) {
        return await handleEntranceAudioManifest(request, env);
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
