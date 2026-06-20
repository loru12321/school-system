# Multiplatform Version Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows, Android, and iOS version center that exposes latest and historical builds, ties every build to a source commit, and automates beta and stable release packaging.

**Architecture:** Keep the existing Vite application as the shared product surface. Add a manifest-normalization runtime that maps GitHub Releases into a three-platform catalog, render the selected “platform-focused” UI in the existing final mother module, package Android/iOS with Capacitor and Windows with Electron Builder, and publish beta/stable assets through GitHub Actions. iOS remains build-verified but not downloadable until Apple signing is configured.

**Tech Stack:** Vite 7, vanilla JavaScript/CSS, Node.js 24, GitHub Actions/Releases, Capacitor 8, Gradle, Xcode/macOS Runner, Electron, Electron Builder, Playwright.

---

## File map

- `public/assets/js/app-release-catalog-runtime.js`: normalize, validate, sort, filter, and cache release manifests.
- `public/releases/release-manifest.json`: checked-in fallback manifest used when GitHub is unavailable.
- `public/assets/js/app-download-runtime.js`: bind catalog data to the version-center UI and platform interactions.
- `src/index.html`: platform-focused version-center markup and history drawer.
- `public/assets/css/app-download-module.css`: existing-theme layout, responsive states, drawer, and accessibility styling.
- `scripts/build-release-manifest.mjs`: generate beta/stable manifest data and SHA-256 values from actual build assets.
- `scripts/test-app-release-catalog-runtime.js`: catalog unit/contract tests.
- `scripts/test-release-manifest.mjs`: generated-manifest and retention-policy tests.
- `scripts/test-app-download-clicks.js`: browser tests for three platform tabs, disabled assets, history filters, and downloads.
- `desktop/main.cjs`, `desktop/preload.cjs`, `desktop/offline.html`, `electron-builder.yml`: Windows shell and package configuration.
- `capacitor.config.ts`, `android/`, `ios/`: Capacitor mobile projects with bundle id `cn.com.schoolsystem.app`.
- `.github/workflows/build-apps-beta.yml`: per-`main` three-platform beta build and prerelease publication.
- `.github/workflows/release-apps.yml`: stable tag build and permanent Release publication.
- `.github/workflows/cleanup-beta-releases.yml`: delete prereleases older than 90 days without touching stable releases.

---

### Task 1: Define the three-platform release catalog contract

**Files:**
- Create: `scripts/test-app-release-catalog-runtime.js`
- Create: `public/assets/js/app-release-catalog-runtime.js`
- Create: `public/releases/release-manifest.json`
- Modify: `package.json`
- Modify: `src/index.html`

- [ ] **Step 1: Write the failing catalog contract test**

Create `scripts/test-app-release-catalog-runtime.js` with Node `vm` coverage for three platforms, beta expiry, stable retention, asset validation, filtering, and platform detection:

```js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app-release-catalog-runtime.js'), 'utf8');
const sandbox = { window: {}, globalThis: {}, console, URL, Date, setTimeout, clearTimeout };
sandbox.window = sandbox.globalThis = sandbox;
vm.runInNewContext(source, sandbox, { filename: 'app-release-catalog-runtime.js' });

const runtime = sandbox.AppReleaseCatalogRuntime;
assert.ok(runtime, 'catalog runtime should be exported');

const records = runtime.normalizeCatalog({
  schemaVersion: 1,
  releases: [
    {
      releaseTag: 'beta-20260620-cb785f5',
      channel: 'beta',
      sourceSha: 'cb785f5',
      generatedAt: '2026-06-20T08:00:00.000Z',
      expiresAt: '2026-09-18T08:00:00.000Z',
      platforms: {
        windows: { status: 'ready', assetName: 'school-system-windows-beta.exe', assetUrl: 'https://example.test/windows.exe', bytes: 90000000, sha256: 'a'.repeat(64) },
        android: { status: 'ready', signed: 'test-signed', assetName: 'school-system-android-beta.apk', assetUrl: 'https://example.test/android.apk', bytes: 24000000, sha256: 'b'.repeat(64) },
        ios: { status: 'awaiting-signing', signed: false, assetName: '', assetUrl: '', bytes: 0, sha256: '' }
      }
    },
    {
      releaseTag: 'school-system-v1.4.0',
      channel: 'stable',
      sourceSha: 'stable123',
      generatedAt: '2026-06-19T08:00:00.000Z',
      expiresAt: '',
      platforms: {}
    }
  ]
});

assert.strictEqual(records.length, 2);
assert.strictEqual(records[0].releaseTag, 'beta-20260620-cb785f5');
assert.strictEqual(runtime.isDownloadable(records[0].platforms.windows), true);
assert.strictEqual(runtime.isDownloadable(records[0].platforms.ios), false);
assert.strictEqual(runtime.isExpired(records[1], new Date('2030-01-01')), false);
assert.deepStrictEqual(runtime.filterCatalog(records, { platform: 'android', channel: 'beta' }).map(item => item.releaseTag), ['beta-20260620-cb785f5']);
assert.strictEqual(runtime.detectPlatform('Mozilla/5.0 (Windows NT 10.0)'), 'windows');
assert.strictEqual(runtime.detectPlatform('Mozilla/5.0 (Linux; Android 15)'), 'android');
assert.strictEqual(runtime.detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios');
console.log('app release catalog runtime tests passed');
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node scripts/test-app-release-catalog-runtime.js`

Expected: FAIL because `public/assets/js/app-release-catalog-runtime.js` does not exist.

- [ ] **Step 3: Implement the catalog runtime**

Create an IIFE exporting these exact methods on `window.AppReleaseCatalogRuntime`:

```js
(() => {
  const PLATFORMS = ['windows', 'android', 'ios'];
  const CHANNELS = ['beta', 'stable'];
  const ensureArray = value => Array.isArray(value) ? value : [];
  const normalizeText = value => String(value || '').trim();
  const normalizePlatform = value => PLATFORMS.includes(value) ? value : '';
  const normalizeChannel = value => CHANNELS.includes(value) ? value : 'beta';

  function normalizeAsset(platform, source = {}) {
    return {
      platform,
      version: normalizeText(source.version),
      buildNumber: normalizeText(source.buildNumber),
      status: normalizeText(source.status) || 'unavailable',
      signed: source.signed === true ? 'signed' : normalizeText(source.signed) || 'unsigned',
      minimumOs: normalizeText(source.minimumOs),
      architectures: ensureArray(source.architectures).map(normalizeText).filter(Boolean),
      assetName: normalizeText(source.assetName),
      assetUrl: normalizeText(source.assetUrl),
      bytes: Number(source.bytes || 0),
      sha256: normalizeText(source.sha256).toLowerCase(),
      notes: ensureArray(source.notes).map(normalizeText).filter(Boolean),
      buildUrl: normalizeText(source.buildUrl)
    };
  }

  function normalizeRelease(source = {}) {
    const platforms = {};
    PLATFORMS.forEach(platform => { platforms[platform] = normalizeAsset(platform, source.platforms?.[platform]); });
    return {
      schemaVersion: Number(source.schemaVersion || 1),
      releaseTag: normalizeText(source.releaseTag),
      channel: normalizeChannel(source.channel),
      sourceSha: normalizeText(source.sourceSha),
      generatedAt: normalizeText(source.generatedAt),
      expiresAt: normalizeText(source.expiresAt),
      releaseUrl: normalizeText(source.releaseUrl),
      platforms
    };
  }

  function normalizeCatalog(payload = {}) {
    const releases = ensureArray(payload.releases?.length ? payload.releases : [payload]);
    return releases.map(normalizeRelease).filter(item => item.releaseTag).sort((a, b) => Date.parse(b.generatedAt || 0) - Date.parse(a.generatedAt || 0));
  }

  function isDownloadable(asset = {}) {
    return asset.status === 'ready' && !!asset.assetName && /^https?:\/\//.test(asset.assetUrl) && asset.bytes > 0 && /^[a-f0-9]{64}$/.test(asset.sha256);
  }

  function isExpired(release, now = new Date()) {
    return release?.channel === 'beta' && !!release.expiresAt && Date.parse(release.expiresAt) <= now.getTime();
  }

  function filterCatalog(releases, filters = {}) {
    return ensureArray(releases).filter(release => {
      if (filters.channel && release.channel !== filters.channel) return false;
      if (filters.platform && normalizePlatform(filters.platform) && release.platforms[filters.platform]?.status === 'unavailable') return false;
      return true;
    });
  }

  function detectPlatform(userAgent = navigator.userAgent) {
    const value = normalizeText(userAgent).toLowerCase();
    if (/iphone|ipad|ipod/.test(value)) return 'ios';
    if (/android/.test(value)) return 'android';
    return 'windows';
  }

  window.AppReleaseCatalogRuntime = Object.freeze({ PLATFORMS, normalizeCatalog, isDownloadable, isExpired, filterCatalog, detectPlatform });
})();
```

Create `public/releases/release-manifest.json` with `schemaVersion: 1`, one cached release entry, and explicit unavailable states for all three platforms. Add a deferred script tag for `app-release-catalog-runtime.js` before `app-download-runtime.js` in `src/index.html`.

- [ ] **Step 4: Register and run the new test**

Add to `package.json`:

```json
"test:app-release-catalog-runtime": "node scripts/test-app-release-catalog-runtime.js"
```

Add it to `validate` immediately before `test:app-download-runtime-hygiene`.

Run: `npm.cmd run test:app-release-catalog-runtime`

Expected: `app release catalog runtime tests passed`.

- [ ] **Step 5: Commit the catalog contract**

```powershell
git add package.json public/assets/js/app-release-catalog-runtime.js public/releases/release-manifest.json scripts/test-app-release-catalog-runtime.js src/index.html
git commit -m "feat: define multiplatform release catalog"
```

---

### Task 2: Generate manifests from real build assets

**Files:**
- Create: `scripts/build-release-manifest.mjs`
- Create: `scripts/test-release-manifest.mjs`
- Modify: `scripts/prepare-github-release-assets.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing manifest generator test**

Create a temp fixture with Windows and Android files, invoke the generator with `RELEASE_CHANNEL=beta`, and assert:

```js
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.channel, 'beta');
assert.match(manifest.releaseTag, /^beta-/);
assert.equal(manifest.platforms.windows.status, 'ready');
assert.equal(manifest.platforms.android.signed, 'test-signed');
assert.equal(manifest.platforms.ios.status, 'awaiting-signing');
assert.match(manifest.platforms.windows.sha256, /^[a-f0-9]{64}$/);
assert.ok(Date.parse(manifest.expiresAt) - Date.parse(manifest.generatedAt) === 90 * 86400000);
```

Run: `node scripts/test-release-manifest.mjs`

Expected: FAIL because the generator does not exist.

- [ ] **Step 2: Implement `scripts/build-release-manifest.mjs`**

The script must accept these environment variables:

```text
RELEASE_CHANNEL=beta|stable
RELEASE_TAG=beta-20260620-cb785f5|school-system-v2026.06.20
RELEASE_SOURCE_SHA=<40-char SHA>
RELEASE_ASSET_DIR=<absolute or repo-relative directory>
RELEASE_OUTPUT=<manifest path>
RELEASE_BUILD_URL=<GitHub Actions run URL>
```

Use `crypto.createHash('sha256')`, `fs.statSync`, and this asset table:

```js
const definitions = {
  windows: { pattern: /\.exe$/i, minimumOs: 'Windows 10 22H2', architectures: ['x64'], signed: 'unsigned' },
  android: { pattern: /\.apk$/i, minimumOs: 'Android 10', architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'], signed: 'test-signed' },
  ios: { pattern: /\.ipa$/i, minimumOs: 'iOS 16', architectures: ['arm64'], signed: false }
};
```

When no IPA exists, emit `status: 'awaiting-signing'` and blank asset fields. Stable releases must have a blank `expiresAt`; beta releases must add exactly 90 days.

- [ ] **Step 3: Extend the existing release preparation script**

Replace its two hard-coded assets with discovery from `release-assets/input/`, call the manifest generator, and emit:

```text
release-assets/release-manifest.json
release-assets/release-notes.md
release-assets/school-system-windows-<tag>.exe
release-assets/school-system-android-<tag>.apk
```

Do not copy the current 730-byte ZIP or the stale checked-in APK into new releases.

- [ ] **Step 4: Register and run tests**

Add:

```json
"test:release-manifest": "node scripts/test-release-manifest.mjs"
```

Run: `npm.cmd run test:release-manifest`

Expected: manifest tests pass and fixture files are removed.

- [ ] **Step 5: Commit the manifest generator**

```powershell
git add package.json scripts/build-release-manifest.mjs scripts/prepare-github-release-assets.mjs scripts/test-release-manifest.mjs
git commit -m "feat: generate release manifests from build assets"
```

---

### Task 3: Stamp every native build with the source version

**Files:**
- Create: `scripts/resolve-app-version.mjs`
- Create: `scripts/test-resolve-app-version.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing version resolver test**

Create `scripts/test-resolve-app-version.mjs` and invoke the resolver twice with fixed environments:

```js
const beta = resolveAppVersion({ channel: 'beta', tag: 'beta-20260620-cb785f5', sha: 'cb785f5abc', runNumber: '42' });
assert.deepEqual(beta, {
  releaseTag: 'beta-20260620-cb785f5',
  versionName: '2026.6.20-beta.42',
  buildNumber: 42,
  sourceSha: 'cb785f5abc'
});

const stable = resolveAppVersion({ channel: 'stable', tag: 'school-system-v2026.06.20', sha: 'stable123', runNumber: '43' });
assert.equal(stable.versionName, '2026.6.20');
assert.equal(stable.buildNumber, 43);
```

Run: `node scripts/test-resolve-app-version.mjs`

Expected: FAIL because the resolver does not exist.

- [ ] **Step 2: Implement the version resolver**

Export `resolveAppVersion(input)` and implement these rules exactly:

```js
const DATE_TAG = /(\d{4})[.-]?(\d{2})[.-]?(\d{2})/;
const match = String(input.tag || '').match(DATE_TAG);
if (!match) throw new Error(`Release tag must contain YYYYMMDD or YYYY.MM.DD: ${input.tag}`);
const base = `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}`;
const buildNumber = Number(input.runNumber);
if (!Number.isSafeInteger(buildNumber) || buildNumber <= 0) throw new Error('runNumber must be a positive integer');
return {
  releaseTag: String(input.tag),
  versionName: input.channel === 'stable' ? base : `${base}-beta.${buildNumber}`,
  buildNumber,
  sourceSha: String(input.sha || '')
};
```

When run as a CLI, write `APP_VERSION_NAME`, `APP_BUILD_NUMBER`, `APP_RELEASE_TAG`, and `APP_SOURCE_SHA` to both stdout and `$GITHUB_OUTPUT` when that variable is present.

- [ ] **Step 3: Add native stamping hooks**

Electron Builder reads the temporary `package.json` version written by the workflow. Android receives `-PappVersionName=$APP_VERSION_NAME -PappVersionCode=$APP_BUILD_NUMBER`. iOS receives `MARKETING_VERSION=$APP_VERSION_NAME CURRENT_PROJECT_VERSION=$APP_BUILD_NUMBER` on the `xcodebuild` command. No generated version change is committed by CI.

- [ ] **Step 4: Register, test, and commit**

Add:

```json
"test:resolve-app-version": "node scripts/test-resolve-app-version.mjs"
```

Run: `npm.cmd run test:resolve-app-version`

Expected: PASS.

Commit:

```powershell
git add package.json scripts/resolve-app-version.mjs scripts/test-resolve-app-version.mjs
git commit -m "build: derive native versions from every source revision"
```

---

### Task 4: Build the platform-focused version-center UI

**Files:**
- Modify: `src/index.html:4097`
- Modify: `public/assets/css/app-download-module.css`
- Modify: `public/assets/js/app-download-runtime.js`
- Modify: `scripts/test-app-download-runtime-hygiene.js`
- Modify: `scripts/test-app-download-clicks.js`

- [ ] **Step 1: Add failing structural assertions**

Assert the HTML contains:

```js
['windows', 'android', 'ios'].forEach(platform => {
  assert.ok(html.includes(`data-app-download-platform="${platform}"`));
});
assert.ok(html.includes('id="app-release-timeline"'));
assert.ok(html.includes('id="app-release-history-drawer"'));
assert.ok(html.includes('id="app-release-history-platform"'));
assert.ok(html.includes('id="app-release-history-channel"'));
```

Assert the runtime contains `loadReleaseCatalog`, `renderFocusedPlatform`, `renderReleaseTimeline`, `openReleaseHistory`, and `filterReleaseHistory`.

Run: `npm.cmd run test:app-download-runtime-hygiene`

Expected: FAIL on the missing three-platform contracts.

- [ ] **Step 2: Replace the dual-platform template**

Use one `role="tablist"` with three buttons, one focused detail region, one timeline aside, and one `dialog` history drawer. Preserve the surrounding mother-module heading and existing shell classes. Required IDs:

```html
<div class="app-release-platform-tabs" role="tablist" aria-label="选择应用平台">
  <button type="button" role="tab" data-app-download-platform="windows">Windows</button>
  <button type="button" role="tab" data-app-download-platform="android">Android</button>
  <button type="button" role="tab" data-app-download-platform="ios">iOS <span data-ios-status>待签名</span></button>
</div>
<section id="app-release-focused-detail" aria-live="polite"></section>
<aside id="app-release-timeline" aria-label="发布轨迹"></aside>
<div id="app-release-history-drawer" role="dialog" aria-modal="true" aria-labelledby="app-release-history-title" hidden>
  <select id="app-release-history-platform"><option value="">全部平台</option><option value="windows">Windows</option><option value="android">Android</option><option value="ios">iOS</option></select>
  <select id="app-release-history-channel"><option value="">全部渠道</option><option value="beta">测试版</option><option value="stable">稳定版</option></select>
  <div id="app-release-history-list"></div>
</div>
```

- [ ] **Step 3: Refactor runtime state around the catalog**

Use these state keys:

```js
const state = {
  selectedPlatform: AppReleaseCatalogRuntime.detectPlatform(),
  releases: [],
  loading: false,
  lastError: '',
  lastFetchedAt: 0,
  historyFilters: { platform: '', channel: '' }
};
```

Fetch GitHub Releases with `per_page=50`, map Windows `.exe`, Android `.apk`, and iOS `.ipa` assets, then merge with `/releases/release-manifest.json`. Persist the selected platform and successful catalog in `sessionStorage`/`localStorage`. A missing iOS asset must render the five-step Apple progress state instead of a download button.

- [ ] **Step 4: Implement focused rendering and history interactions**

Render the current platform with escaped text only. A download link is enabled only when `AppReleaseCatalogRuntime.isDownloadable(asset)` is true. Implement:

```js
const PLATFORM_KEYS = ['windows', 'android', 'ios'];
let historyTrigger = null;

function getLatestReleaseForPlatform(platform) {
  return state.releases.find(release => release.platforms?.[platform]?.status !== 'unavailable') || null;
}

function setSelectedPlatform(platform) {
  if (!PLATFORM_KEYS.includes(platform)) return false;
  state.selectedPlatform = platform;
  sessionStorage.setItem('APP_RELEASE_SELECTED_PLATFORM', platform);
  renderFocusedPlatform(platform);
  renderReleaseTimeline(platform);
  document.querySelectorAll('[data-app-download-platform]').forEach(button => {
    const selected = button.dataset.appDownloadPlatform === platform;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  return true;
}

function renderFocusedPlatform(platform = state.selectedPlatform) {
  const root = document.getElementById('app-release-focused-detail');
  if (!root) return;
  const release = getLatestReleaseForPlatform(platform);
  const asset = release?.platforms?.[platform] || { status: 'unavailable' };
  const downloadable = AppReleaseCatalogRuntime.isDownloadable(asset);
  root.innerHTML = `<p class="app-release-eyebrow">${escapeHtml(platform.toUpperCase())} LATEST</p>
    <h3>${escapeHtml(asset.version || (platform === 'ios' ? '工程已就绪' : '暂无可用版本'))}</h3>
    <p>${escapeHtml(asset.notes?.[0] || (platform === 'ios' ? '等待 Apple Developer 账号与签名配置' : '当前平台尚无有效安装包'))}</p>
    <a id="app-download-primary-link" class="btn btn-blue${downloadable ? '' : ' is-disabled'}" ${downloadable ? `href="${escapeHtml(asset.assetUrl)}" download="${escapeHtml(asset.assetName)}"` : 'aria-disabled="true" tabindex="-1"'}>${downloadable ? '下载最新版本' : '查看构建状态'}</a>`;
}

function renderReleaseTimeline(platform = state.selectedPlatform) {
  const root = document.getElementById('app-release-timeline');
  if (!root) return;
  root.innerHTML = state.releases.slice(0, 6).map(release => `<article class="app-release-timeline-item"><strong>${escapeHtml(release.releaseTag)}</strong><span>${escapeHtml(release.channel)}</span><p>${escapeHtml(release.platforms?.[platform]?.status || 'unavailable')}</p></article>`).join('');
}

function openReleaseHistory(event) {
  const drawer = document.getElementById('app-release-history-drawer');
  if (!drawer) return;
  historyTrigger = event?.currentTarget || document.activeElement;
  drawer.hidden = false;
  filterReleaseHistory();
  drawer.querySelector('[data-close-release-history]')?.focus();
}

function closeReleaseHistory() {
  const drawer = document.getElementById('app-release-history-drawer');
  if (!drawer) return;
  drawer.hidden = true;
  historyTrigger?.focus?.();
}

function filterReleaseHistory() {
  const platform = document.getElementById('app-release-history-platform')?.value || '';
  const channel = document.getElementById('app-release-history-channel')?.value || '';
  const list = document.getElementById('app-release-history-list');
  if (!list) return;
  const releases = AppReleaseCatalogRuntime.filterCatalog(state.releases, { platform, channel });
  list.innerHTML = releases.map(release => `<article><strong>${escapeHtml(release.releaseTag)}</strong><span>${escapeHtml(release.generatedAt)}</span></article>`).join('') || '<p>没有符合条件的历史版本。</p>';
}
```

Bind Escape, tab activation, history selectors, copy checksum, retry, and close actions with `addEventListener`; add no new inline handlers.

- [ ] **Step 5: Implement existing-theme CSS**

Replace the blue gradient hero with the selected editorial treatment: white base, thin dividers, existing typography, platform accent line, two-column detail/timeline layout, and full-width drawer. At `max-width: 768px`, stack timeline below detail and make tab buttons horizontally scrollable. Preserve `.is-disabled` behavior and visible `:focus-visible` outlines.

- [ ] **Step 6: Extend browser tests**

Update `scripts/test-app-download-clicks.js` to verify:

```js
await page.locator('[data-app-download-platform="ios"]').click();
await expect(page.locator('#app-release-focused-detail')).toContainText('等待 Apple 签名');
await expect(page.locator('#app-download-primary-link')).toHaveAttribute('aria-disabled', 'true');
await page.locator('[data-app-download-platform="android"]').click();
await expect(page.locator('#app-release-focused-detail')).toContainText('测试签名');
await page.locator('[data-open-release-history]').click();
await expect(page.locator('#app-release-history-drawer')).toBeVisible();
```

Keep the test in the existing plain Playwright style if `@playwright/test` is not installed; use equivalent `assert` calls around locator values.

- [ ] **Step 7: Run and commit**

Run:

```powershell
npm.cmd run test:app-release-catalog-runtime
npm.cmd run test:app-download-runtime-hygiene
npm.cmd run build
npm.cmd run test:app-download-clicks
```

Expected: all four commands pass.

Commit:

```powershell
git add src/index.html public/assets/css/app-download-module.css public/assets/js/app-download-runtime.js scripts/test-app-download-runtime-hygiene.js scripts/test-app-download-clicks.js
git commit -m "feat: redesign the app version center for three platforms"
```

---

### Task 5: Add the Windows Electron package

**Files:**
- Create: `desktop/main.cjs`
- Create: `desktop/preload.cjs`
- Create: `desktop/offline.html`
- Create: `electron-builder.yml`
- Create: `scripts/test-desktop-package-contract.js`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing desktop contract test**

Assert the main process uses a single instance lock, context isolation, no Node integration, an allowlisted production origin, external-link blocking, an offline fallback, and version metadata:

```js
assert.ok(main.includes('requestSingleInstanceLock'));
assert.ok(main.includes("contextIsolation: true"));
assert.ok(main.includes("nodeIntegration: false"));
assert.ok(main.includes("https://schoolsystem.com.cn"));
assert.ok(main.includes('setWindowOpenHandler'));
assert.ok(main.includes('offline.html'));
assert.ok(builder.includes('school-system-windows-${version}-${arch}.${ext}'));
```

Run: `node scripts/test-desktop-package-contract.js`

Expected: FAIL because desktop files do not exist.

- [ ] **Step 2: Install Electron packaging dependencies**

Run:

```powershell
npm.cmd install --save-dev electron electron-builder
```

Expected: `package.json` and `package-lock.json` update without audit errors.

- [ ] **Step 3: Implement the secure Electron shell**

`desktop/main.cjs` must create one `BrowserWindow`, expose only frozen version metadata through `desktop/preload.cjs`, load `https://schoolsystem.com.cn`, reject non-HTTPS navigation, open allowlisted GitHub Release links through `shell.openExternal`, and show `desktop/offline.html` after a failed initial load. Do not expose arbitrary IPC or filesystem access.

- [ ] **Step 4: Configure the NSIS installer**

Set `appId: cn.com.schoolsystem.app`, `productName: 校衡台`, `artifactName: school-system-windows-${version}-${arch}.${ext}`, target `nsis`/`x64`, and output `native-builds/windows`. Add `native-builds/` to `.gitignore`.

Add scripts:

```json
"desktop:start": "electron desktop/main.cjs",
"desktop:build": "electron-builder --win nsis --x64",
"test:desktop-package-contract": "node scripts/test-desktop-package-contract.js"
```

- [ ] **Step 5: Run and commit**

Run:

```powershell
npm.cmd run test:desktop-package-contract
npm.cmd run desktop:build
```

Expected: the contract passes and `native-builds/windows/*.exe` is larger than 50 MB.

Commit:

```powershell
git add package.json package-lock.json .gitignore desktop electron-builder.yml scripts/test-desktop-package-contract.js
git commit -m "feat: add the Windows desktop installer"
```

---

### Task 6: Scaffold Capacitor Android and iOS projects

**Files:**
- Create: `capacitor.config.ts`
- Create: `android/`
- Create: `ios/`
- Create: `scripts/test-capacitor-package-contract.js`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing Capacitor contract test**

Assert:

```js
assert.equal(config.appId, 'cn.com.schoolsystem.app');
assert.equal(config.appName, '校衡台');
assert.equal(config.webDir, 'dist');
assert.equal(config.server.url, 'https://schoolsystem.com.cn');
assert.equal(config.server.cleartext, false);
assert.ok(fs.existsSync(path.join(root, 'android/app/build.gradle')) || fs.existsSync(path.join(root, 'android/app/build.gradle.kts')));
assert.ok(fs.existsSync(path.join(root, 'ios/App/App.xcodeproj/project.pbxproj')));
```

Run: `node scripts/test-capacitor-package-contract.js`

Expected: FAIL because the native projects do not exist.

- [ ] **Step 2: Install iOS support and TypeScript config loading**

Run:

```powershell
npm.cmd install @capacitor/ios@^8.1.0
```

Create `capacitor.config.ts` with app id/name, `webDir: 'dist'`, production HTTPS URL, `cleartext: false`, and platform-specific background colors.

- [ ] **Step 3: Generate native projects**

Run:

```powershell
npm.cmd run build
npx.cmd cap add android
npx.cmd cap add ios
npx.cmd cap sync
```

Expected: `android/` and `ios/` are created and sync completes. On Windows, iOS project generation may succeed while Xcode compilation remains unavailable; compilation is deferred to the macOS CI task.

- [ ] **Step 4: Add mobile scripts and contract checks**

Add:

```json
"mobile:sync": "npm run build && cap sync",
"android:build:test": "npm run mobile:sync && cd android && gradlew.bat assembleDebug",
"ios:sync": "npm run mobile:sync",
"test:capacitor-package-contract": "node scripts/test-capacitor-package-contract.js"
```

Run: `npm.cmd run test:capacitor-package-contract`

Expected: PASS.

- [ ] **Step 5: Commit generated native projects**

Exclude Gradle caches, Pods, DerivedData, and build outputs, but commit project files and Gradle wrapper:

```powershell
git add package.json package-lock.json capacitor.config.ts android ios .gitignore scripts/test-capacitor-package-contract.js
git commit -m "feat: add Android and iOS application projects"
```

---

### Task 7: Configure Android test signing without committing secrets

**Files:**
- Create: `scripts/configure-android-test-signing.mjs`
- Create: `scripts/test-android-signing-contract.js`
- Modify: `android/app/build.gradle` or `android/app/build.gradle.kts`
- Modify: `.github/workflows/build-apps-beta.yml`
- Modify: `.gitignore`

- [ ] **Step 1: Write a failing signing contract test**

Assert the Gradle config reads only environment variables and never contains keystore bytes or passwords:

```js
['ANDROID_TEST_KEYSTORE_FILE', 'ANDROID_TEST_KEYSTORE_PASSWORD', 'ANDROID_TEST_KEY_ALIAS', 'ANDROID_TEST_KEY_PASSWORD'].forEach(name => assert.ok(gradle.includes(name)));
assert.ok(!/storePassword\s+["'][^$]/.test(gradle));
assert.ok(!fs.existsSync(path.join(root, 'android-test.keystore')));
```

- [ ] **Step 2: Implement environment-only signing**

Configure the beta release build type to use the environment-provided keystore and fail with a clear message when a beta packaging workflow requests signing without all four variables. Keep local debug builds on the standard debug configuration.

- [ ] **Step 3: Add the secret bootstrap script**

`scripts/configure-android-test-signing.mjs` must generate a random 32-character password, call `keytool -genkeypair` for alias `school-system-test`, print the four required GitHub secret names, and save the keystore only to a user-specified output path outside the repository. It must refuse output paths inside the repository.

- [ ] **Step 4: Run and commit**

Run: `node scripts/test-android-signing-contract.js`

Expected: PASS.

Commit:

```powershell
git add android scripts/configure-android-test-signing.mjs scripts/test-android-signing-contract.js .gitignore
git commit -m "build: require secret-backed Android test signing"
```

Do not call `gh secret set` until the user approves creating the test keystore and storing the four values in the repository’s GitHub Actions secrets.

---

### Task 8: Add per-commit beta build and publication workflow

**Files:**
- Create: `.github/workflows/build-apps-beta.yml`
- Create: `scripts/test-beta-release-workflow.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing workflow contract test**

Assert the workflow has `push: branches: [main]`, `workflow_dispatch`, `concurrency.cancel-in-progress: true`, three OS jobs, artifact upload, a publish job, prerelease creation, and no App Store upload step while Apple secrets are absent.

- [ ] **Step 2: Implement three build jobs**

Each job first runs `node scripts/resolve-app-version.mjs` with the beta tag, `GITHUB_SHA`, and `GITHUB_RUN_NUMBER`.

- `windows-latest`: `npm ci`, guards, write `APP_VERSION_NAME` into the temporary checkout’s `package.json`, `npm run desktop:build`, upload EXE.
- `ubuntu-latest`: Java 21, `npm ci`, Capacitor sync, `./gradlew assembleRelease -PappVersionName=$APP_VERSION_NAME -PappVersionCode=$APP_BUILD_NUMBER`, upload the test-signed APK.
- `macos-latest`: `npm ci`, Capacitor sync, `xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO MARKETING_VERSION=$APP_VERSION_NAME CURRENT_PROJECT_VERSION=$APP_BUILD_NUMBER build`, upload build log and zipped Xcode project metadata, but no IPA.

- [ ] **Step 3: Implement the publish job**

Download platform artifacts, run `scripts/build-release-manifest.mjs`, and create/update a GitHub prerelease tagged `beta-YYYYMMDD-<short-sha>` using `gh release create`. Asset names must be immutable and the Release notes must include platform statuses, source SHA, build URLs, sizes, and SHA-256 values.

- [ ] **Step 4: Run and commit**

Run: `node scripts/test-beta-release-workflow.js`

Expected: PASS.

Commit:

```powershell
git add .github/workflows/build-apps-beta.yml scripts/test-beta-release-workflow.js package.json
git commit -m "ci: publish multiplatform beta builds"
```

---

### Task 9: Upgrade stable releases and add 90-day cleanup

**Files:**
- Modify: `.github/workflows/release-apps.yml`
- Create: `.github/workflows/cleanup-beta-releases.yml`
- Modify: `scripts/test-release-automation.js`

- [ ] **Step 1: Add failing stable/cleanup assertions**

Assert stable releases run the same three platform jobs, never set `--prerelease`, and cleanup only selects `.prerelease === true` records older than 90 days whose tags start with `beta-`.

- [ ] **Step 2: Refactor stable workflow**

Reuse the platform commands from Task 8, resolve a stable version from the `school-system-v*` tag, publish Windows EXE and Android APK, record iOS as `awaiting-signing`, attach the manifest, and create a permanent Release for `school-system-v*` tags.

- [ ] **Step 3: Implement scheduled cleanup**

Run weekly and on manual dispatch. Use `gh api --paginate repos/$GITHUB_REPOSITORY/releases` plus `jq` to select only expired `beta-` prereleases, then delete their Releases and tags. Print the selected IDs before deletion and exit successfully when none are eligible.

- [ ] **Step 4: Run and commit**

Run: `npm.cmd run test:release-automation`

Expected: PASS.

Commit:

```powershell
git add .github/workflows/release-apps.yml .github/workflows/cleanup-beta-releases.yml scripts/test-release-automation.js
git commit -m "ci: retain stable releases and prune expired betas"
```

---

### Task 10: Harden package verification and release gates

**Files:**
- Modify: `scripts/test-build-size-budget.js`
- Modify: `scripts/verify-release-assets.mjs`
- Modify: `scripts/test-release-hardening.js`
- Modify: `scripts/test-release-surface.js`
- Modify: `package.json`

- [ ] **Step 1: Write failing real-package assertions**

Replace the 500-byte Windows ZIP allowance with these rules:

```js
windows: { extension: '.exe', minimumBytes: 50 * 1024 * 1024 },
android: { extension: '.apk', minimumBytes: 10 * 1024 * 1024 },
ios: { downloadableOnlyWhenStatusReady: true, extension: '.ipa', minimumBytes: 5 * 1024 * 1024 }
```

Assert every downloadable asset has a valid SHA-256 and a successful HEAD response; iOS `awaiting-signing` must have blank asset fields.

- [ ] **Step 2: Update release verification**

Teach `verify-release-assets.mjs` to read `release-manifest.json`, verify platform statuses independently, detect HTML/error responses masquerading as packages, and return a structured failure list.

- [ ] **Step 3: Add gates**

Add `test:release-manifest`, `test:desktop-package-contract`, `test:capacitor-package-contract`, and `test:beta-release-workflow` to `validate` immediately before the build step. Add the four contract tests to `check:release-fast` immediately after `test:release-surface`. In both app release workflows, run the manifest and platform contract tests after `npm ci` and before any native build. Keep native package builds out of the ordinary fast web gate; contract tests remain in the fast gate.

- [ ] **Step 4: Run and commit**

Run:

```powershell
npm.cmd run test:release-hardening
npm.cmd run test:release-surface
npm.cmd run check:release-fast
```

Expected: all pass; native builds are validated by their platform workflows.

Commit:

```powershell
git add package.json scripts/test-build-size-budget.js scripts/verify-release-assets.mjs scripts/test-release-hardening.js scripts/test-release-surface.js
git commit -m "test: enforce real multiplatform release assets"
```

---

### Task 11: Perform browser, responsive, and native build verification

**Files:**
- Modify: `scripts/smoke-mobile-shell.js`
- Modify: `scripts/smoke-layout-regression.js`
- Modify: `README.md`

- [ ] **Step 1: Add responsive browser checks**

At desktop width, verify detail/timeline columns; at 390 px, verify timeline follows detail, tabs scroll, drawer fills width, and all three platform controls remain keyboard reachable.

- [ ] **Step 2: Run the complete web verification set**

```powershell
npm.cmd run check:syntax
npm.cmd run test:app-release-catalog-runtime
npm.cmd run test:app-download-runtime-hygiene
npm.cmd run build
npm.cmd run test:ui-copy-integrity
npm.cmd run test:app-download-clicks
npm.cmd run smoke:mobile:local
npm.cmd run smoke:layout:local
npm.cmd run check:release-fast
```

Expected: every command passes with no new browser errors.

- [ ] **Step 3: Run locally available native checks**

```powershell
npm.cmd run desktop:build
npm.cmd run android:build:test
```

Expected: Windows EXE and Android APK are produced. iOS must be verified by the macOS GitHub Actions job; do not claim a local Windows iOS build.

- [ ] **Step 4: Update documentation**

Document platform requirements, beta/stable retention, signing statuses, secret names, installation warnings, TestFlight prerequisites, and exact commands for manual rebuilds.

- [ ] **Step 5: Commit verification updates**

```powershell
git add README.md scripts/smoke-mobile-shell.js scripts/smoke-layout-regression.js
git commit -m "docs: document multiplatform application releases"
```

---

### Task 12: Publish and verify production

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run the final repository audit**

```powershell
git status --short
git diff --check HEAD~10..HEAD
npm.cmd run check:release-data-safe
```

Expected: clean diff checks and all release/calculation gates pass.

- [ ] **Step 2: Push the implementation branch**

```powershell
git push origin main
```

Expected: GitHub accepts the commits and starts CI plus the beta build workflow.

- [ ] **Step 3: Monitor the beta workflow**

Use `gh run list --workflow build-apps-beta.yml --limit 3` and `gh run watch <run-id> --exit-status`. Confirm Windows/Android artifacts, iOS simulator build status, manifest generation, and prerelease publication.

- [ ] **Step 4: Deploy the web version center**

```powershell
$env:npm_config_cache="$PWD\.npm-cache"
npx.cmd wrangler deploy
```

Expected: Cloudflare returns a new Worker version ID for `schoolsystem.com.cn`.

- [ ] **Step 5: Verify production**

Run `npm.cmd run verify:prod-minimal`, then use the in-app browser to log in, open the final mother module, switch all three platforms, open/filter history, verify the beta Release is visible, and confirm the browser console has no errors.

- [ ] **Step 6: Create the first permanent stable release only after beta verification**

Create and push tag `school-system-v2026.06.20`, watch `release-apps.yml`, and verify the stable Release remains excluded from the cleanup workflow.
