(function (root) {
  'use strict';

  var PLATFORMS = Object.freeze(['windows', 'android', 'ios']);
  var RELEASE_BRAND_ICON_URL = './assets/brand/app-icon-128.png';

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
      iconUrl: RELEASE_BRAND_ICON_URL,
      version: asString(source.version),
      buildNumber: asString(source.buildNumber),
      status: asString(source.status) || 'unavailable',
      signed: normalizeSigned(source.signed),
      minimumOs: asString(source.minimumOs),
      architectures: Array.isArray(source.architectures) ? source.architectures.map(asString).filter(Boolean) : [],
      assetName: asString(source.assetName),
      assetUrl: asString(source.assetUrl),
      bytes: typeof source.bytes === 'number' && Number.isFinite(source.bytes) ? source.bytes : 0,
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
    if (!asset || asset.status !== 'ready' || !asString(asset.assetName)) return false;
    if (typeof asset.bytes !== 'number' || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0) return false;
    try {
      var parsedUrl = new URL(asString(asset.assetUrl));
      if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname || parsedUrl.username || parsedUrl.password) return false;
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

  function validateChunkDelivery(entry, filename) {
    return !!entry
      && entry.filename === filename
      && Number.isSafeInteger(entry.bytes)
      && entry.bytes > 0
      && Array.isArray(entry.chunks)
      && entry.chunks.length > 0
      && entry.chunks.every(function (chunk) {
        return isTrustedChunk(chunk);
      })
      && Array.isArray(entry.chunkBytes)
      && entry.chunkBytes.length === entry.chunks.length
      && entry.chunkBytes.every(function (bytes) { return Number.isSafeInteger(bytes) && bytes > 0; })
      && entry.chunkBytes.reduce(function (sum, bytes) { return sum + bytes; }, 0) === entry.bytes;
  }

  function isTrustedChunk(chunk) {
    return /^packages\/[A-Za-z0-9._-]+\/(windows|android)\/part-\d{4}$/.test(chunk)
      || /^https:\/\/api\.github\.com\/repos\/hka123321\/school-system\/releases\/assets\/\d+$/.test(chunk);
  }

  function hasExternalChunks(entry) {
    return !!entry && Array.isArray(entry.chunks) && entry.chunks.some(function (chunk) {
      return /^https:\/\//.test(chunk);
    });
  }

  async function loadChunkDelivery(filename) {
    var response = await root.fetch('/releases/download-map.json', { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error('版本分片清单暂不可用');
    var payload = await response.json();
    var entry = Array.isArray(payload && payload.downloads)
      ? payload.downloads.find(function (item) { return item && item.filename === filename; })
      : null;
    if (!validateChunkDelivery(entry, filename)) throw new Error('版本分片清单无效');
    return entry;
  }

  async function fetchChunk(entry, index) {
    var response = await root.fetch('/releases/' + entry.chunks[index], { credentials: 'same-origin' });
    if (!response.ok || !response.body) throw new Error('安装包分片下载失败');
    return response;
  }

  async function saveChunksToFile(entry, anchor) {
    var handle = await root.showSaveFilePicker({
      suggestedName: entry.filename,
      types: [{ description: '安装包', accept: { [entry.contentType]: ['.' + entry.filename.split('.').pop()] } }]
    });
    var writable = await handle.createWritable();
    var total = 0;
    try {
      for (var index = 0; index < entry.chunks.length; index += 1) {
        var response = await fetchChunk(entry, index);
        var reader = response.body.getReader();
        var chunkTotal = 0;
        while (true) {
          var result = await reader.read();
          if (result.done) break;
          chunkTotal += result.value.byteLength;
          total += result.value.byteLength;
          await writable.write(result.value);
          anchor.textContent = '正在下载 ' + Math.min(99, Math.floor(total * 100 / entry.bytes)) + '%';
        }
        if (chunkTotal !== entry.chunkBytes[index]) throw new Error('安装包分片长度不一致');
      }
      if (total !== entry.bytes) throw new Error('安装包长度不一致');
      await writable.close();
    } catch (error) {
      await writable.abort().catch(function () {});
      throw error;
    }
  }

  async function saveChunksAsBlob(entry, anchor) {
    var parts = [];
    var total = 0;
    for (var index = 0; index < entry.chunks.length; index += 1) {
      var response = await fetchChunk(entry, index);
      var bytes = await response.arrayBuffer();
      if (bytes.byteLength !== entry.chunkBytes[index]) throw new Error('安装包分片长度不一致');
      parts.push(bytes);
      total += bytes.byteLength;
      anchor.textContent = '正在下载 ' + Math.floor(total * 100 / entry.bytes) + '%';
    }
    if (total !== entry.bytes) throw new Error('安装包长度不一致');
    var objectUrl = root.URL.createObjectURL(new root.Blob(parts, { type: entry.contentType }));
    var link = root.document.createElement('a');
    link.href = objectUrl;
    link.download = entry.filename;
    link.click();
    root.setTimeout(function () { root.URL.revokeObjectURL(objectUrl); }, 60000);
  }

  async function handleChunkDownload(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    var url;
    try {
      url = new URL(anchor.href, root.location.href);
    } catch (_) {
      return;
    }
    if (url.origin !== root.location.origin || !/^\/downloads\/school-system-(windows|android)-beta-[^/]+\.(exe|apk)$/.test(url.pathname)) return;
    event.preventDefault();
    if (anchor.dataset.chunkDownloadBusy === 'true') return;
    anchor.dataset.chunkDownloadBusy = 'true';
    var originalHtml = anchor.innerHTML;
    try {
      var filename = decodeURIComponent(url.pathname.split('/').pop());
      var entry = await loadChunkDelivery(filename);
      if (hasExternalChunks(entry)) {
        root.location.href = anchor.href;
        return;
      }
      if (typeof root.showSaveFilePicker === 'function') await saveChunksToFile(entry, anchor);
      else await saveChunksAsBlob(entry, anchor);
      anchor.textContent = '下载完成';
    } catch (error) {
      anchor.innerHTML = originalHtml;
      if (error && error.name !== 'AbortError') root.alert(error.message || '安装包下载失败，请稍后重试');
    } finally {
      root.setTimeout(function () {
        anchor.innerHTML = originalHtml;
        delete anchor.dataset.chunkDownloadBusy;
      }, 1500);
    }
  }

  if (root.document && typeof root.document.addEventListener === 'function' && typeof root.fetch === 'function') {
    root.document.addEventListener('click', handleChunkDownload, true);
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
