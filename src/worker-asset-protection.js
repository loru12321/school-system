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

function isVersionedStaticAsset(pathname) {
  if (/\/assets\/vendor\//.test(pathname)) return true;
  if (/\.(?:woff2?|ttf|eot)$/i.test(pathname)) return true;
  // Content-derived hash marker: the last hyphen-delimited segment of the
  // filename is a Vite-style base64url hash (e.g. `style-DKN0ss9n.css`,
  // `boot-runtime-runtime-dcf6d7a5d7ea.js`) containing at least one digit.
  // `-(?!.*-)` anchors the match on the *last* hyphen so the prefix may itself
  // contain hyphens (boot-runtime-runtime-<hash>) without ambiguity.
  // The digit requirement is deliberate — convention names like
  // `auth-state-runtime.js` end in `-runtime.js` but are NOT content-hashed,
  // and caching them immutable would serve stale code after a deploy.
  return /-(?!.*-)[A-Za-z0-9_]*[0-9][A-Za-z0-9_]*\.(?:js|css|png|jpg|jpeg|gif|svg|webp|avif)$/i.test(pathname);
}

function getStaticAssetCacheControl(url) {
  let pathname = String(url.pathname || '');
  // Precompressed twins (asset.js.br) are served for br-capable clients and
  // must inherit the policy of their source asset — never an independent one.
  if (pathname.endsWith('.br')) {
    pathname = pathname.slice(0, -3);
  }
  if (pathname === '/sw.js' || pathname.endsWith('/sw.js')) {
    return getHtmlShellCacheControl();
  }
  // Content-hashed bundles (boot-runtime-runtime-<hash>.js, style-<hash>.css,
  // vendor files) are immutable by URL: a new hash means new content, and the
  // old URL never changes. They must win over the /assets/js/ catch-all below,
  // or the no-store rule would force a fresh origin fetch on every page load.
  if (isStaticAssetPath(pathname) && isVersionedStaticAsset(pathname)) {
    return 'public, max-age=31536000, immutable';
  }
  // Unversioned runtime JS (app.js and friends) is served no-store so a
  // deployment can never serve stale app code behind the boot loader.
  if (pathname.startsWith('/assets/js/')) {
    return getHtmlShellCacheControl();
  }
  // Everything else that is a static asset gets a short browser cache; truly
  // non-static paths (robots.txt, sitemap.xml, site.webmanifest) are left
  // untouched so the public/_headers rules for them keep applying.
  if (!isStaticAssetPath(pathname)) {
    return '';
  }
  return 'public, max-age=3600, stale-while-revalidate=86400';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply HTML and static asset protections to a response fetched from ASSETS.
 * - Forces no-store / CDN-no-store on HTML shell responses.
 * - Injects immutable / long-lived Cache-Control on versioned static assets.
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
  if (!cacheControl) return protectedHtml;
  const headers = new Headers(protectedHtml.headers);
  headers.set('Cache-Control', cacheControl);
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(protectedHtml.body, {
    status: protectedHtml.status,
    statusText: protectedHtml.statusText,
    headers
  });
}
