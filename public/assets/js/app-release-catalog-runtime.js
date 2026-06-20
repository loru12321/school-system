(function (root) {
  'use strict';

  var PLATFORMS = Object.freeze(['windows', 'android', 'ios']);

  function asString(value) {
    return value == null ? '' : String(value).trim();
  }

  function normalizeSigned(value) {
    var text = typeof value === 'string' ? asString(value) : value;
    if (value === true || text === 'signed') return 'signed';
    if (value === false || text == null || text === '') return 'unsigned';
    return asString(text);
  }

  function normalizeAsset(platform, asset) {
    var source = asset && typeof asset === 'object' ? asset : {};
    return {
      platform: platform,
      version: asString(source.version),
      buildNumber: asString(source.buildNumber),
      status: asString(source.status) || 'unavailable',
      signed: normalizeSigned(source.signed),
      minimumOs: asString(source.minimumOs),
      architectures: Array.isArray(source.architectures) ? source.architectures.map(asString).filter(Boolean) : [],
      assetName: asString(source.assetName),
      assetUrl: asString(source.assetUrl),
      bytes: Number.isFinite(Number(source.bytes)) ? Number(source.bytes) : 0,
      sha256: asString(source.sha256).toLowerCase(),
      notes: Array.isArray(source.notes)
        ? source.notes.map(asString).filter(Boolean)
        : (asString(source.notes) ? [asString(source.notes)] : []),
      buildUrl: asString(source.buildUrl)
    };
  }

  function normalizeRelease(release) {
    if (!release || typeof release !== 'object' || !asString(release.releaseTag)) return null;
    var assets = release.platforms && typeof release.platforms === 'object' ? release.platforms : {};
    var schemaVersion = Number(release.schemaVersion == null ? 1 : release.schemaVersion);
    var channel = asString(release.channel);
    var platforms = {};
    PLATFORMS.forEach(function (platform) {
      platforms[platform] = normalizeAsset(platform, assets[platform]);
    });
    return {
      schemaVersion: Number.isFinite(schemaVersion) ? schemaVersion : 1,
      releaseTag: asString(release.releaseTag),
      channel: channel === 'stable' || channel === 'beta' ? channel : 'beta',
      sourceSha: asString(release.sourceSha),
      generatedAt: asString(release.generatedAt),
      expiresAt: asString(release.expiresAt),
      releaseUrl: asString(release.releaseUrl),
      platforms: platforms
    };
  }

  function normalizeCatalog(payload) {
    var entries = payload && Array.isArray(payload.releases) ? payload.releases : [payload];
    return entries.map(normalizeRelease).filter(Boolean).sort(function (left, right) {
      var leftTime = Date.parse(left.generatedAt) || 0;
      var rightTime = Date.parse(right.generatedAt) || 0;
      return rightTime - leftTime;
    });
  }

  function isDownloadable(asset) {
    if (!asset || asset.status !== 'ready' || !asset.assetName || Number(asset.bytes) <= 0) return false;
    try {
      var parsedUrl = new URL(asString(asset.assetUrl));
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return false;
    } catch (_) {
      return false;
    }
    return /^[a-f0-9]{64}$/.test(asString(asset.sha256));
  }

  function isExpired(release, now) {
    if (!release || release.channel !== 'beta' || !release.expiresAt) return false;
    var expiry = Date.parse(release.expiresAt);
    var current = now == null ? Date.now() : new Date(now).getTime();
    return Number.isFinite(expiry) && Number.isFinite(current) && expiry <= current;
  }

  function filterCatalog(releases, filters) {
    var options = filters || {};
    return (Array.isArray(releases) ? releases : []).filter(function (release) {
      if (options.channel && release.channel !== options.channel) return false;
      if (options.platform) {
        var asset = release.platforms && release.platforms[options.platform];
        if (!asset || asset.status === 'unavailable') return false;
      }
      return true;
    });
  }

  function detectPlatform(userAgent) {
    var fallbackNavigator = typeof navigator !== 'undefined' ? navigator : null;
    var agent = userAgent == null && fallbackNavigator ? fallbackNavigator.userAgent : userAgent;
    agent = asString(agent);
    if (/iPhone|iPad|iPod/i.test(agent)) return 'ios';
    if (/Android/i.test(agent)) return 'android';
    return 'windows';
  }

  root.AppReleaseCatalogRuntime = Object.freeze({
    PLATFORMS: PLATFORMS,
    normalizeCatalog: normalizeCatalog,
    isDownloadable: isDownloadable,
    isExpired: isExpired,
    filterCatalog: filterCatalog,
    detectPlatform: detectPlatform
  });
}(typeof window !== 'undefined' ? window : globalThis));
