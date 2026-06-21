# Responsive Login, Cloud Archive, and Premium App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a non-overlapping responsive login experience, a reliably visible cloud archive table, and the selected “Knowledge Bloom” icon across the Windows, Android, iOS, latest-version, and release-history surfaces.

**Architecture:** Add one final, narrowly scoped responsive stylesheet after the legacy login styles instead of rewriting the existing theme. Extract cloud-table state rendering into testable runtime helpers and give the table one explicit scroll container. Keep the existing release catalog as the source of truth, add generated platform icon assets, and render the same branded mark through the current version-center components.

**Tech Stack:** Vite, vanilla HTML/CSS/JavaScript, Node.js contract tests, Sharp/PNG-to-ICO for deterministic icon derivation, Electron Builder, Capacitor, Cloudflare Workers/Wrangler.

---

## File Structure

- Create `src/assets/css/responsive-login-final.css`: final desktop/tablet/mobile login layout authority.
- Create `src/assets/css/cloud-archive-visibility.css`: cloud table sizing, scroll, sticky header, and state styles.
- Modify `src/index.html`: load the final styles last, add cloud table state hooks, and add branded version-center image hooks.
- Modify `public/assets/js/data-cloud-runtime.js`: render explicit loading/empty/filtered/error/data states.
- Create `scripts/test-responsive-login-contract.js`: verify breakpoints and prohibit overlap-causing layout rules.
- Create `scripts/test-cloud-archive-visibility.js`: verify all table states and table contract.
- Create `scripts/generate-app-icon-assets.mjs`: derive deterministic platform assets from the selected source.
- Create `scripts/test-app-icon-assets.mjs`: verify dimensions, format, safety area, and manifest references.
- Create `public/assets/brand/app-icon-source.png`: approved Knowledge Bloom source artwork.
- Create `public/assets/brand/app-icon-*.png` and `desktop/assets/icon.ico`: generated web/platform assets.
- Create/update Android launcher assets in `android/app/src/main/res/`.
- Create/update iOS AppIcon assets in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` when the iOS project is present.
- Modify `public/assets/js/app-download-runtime.js`: attach the brand icon to platform/latest/history view models.
- Modify `public/assets/css/app-download-module.css`: premium icon presentation consistent with the current theme.
- Modify `package.json`: add focused test and icon-generation scripts plus free build-time dependencies.

### Task 1: Add Failing Layout and Archive Contracts

**Files:**
- Create: `scripts/test-responsive-login-contract.js`
- Create: `scripts/test-cloud-archive-visibility.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing responsive-login contract**

```js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const cssPath = path.join(root, 'src/assets/css/responsive-login-final.css');

assert.ok(fs.existsSync(cssPath), 'final responsive login stylesheet must exist');
const css = fs.readFileSync(cssPath, 'utf8');
assert.ok(html.includes('./assets/css/responsive-login-final.css'), 'final login stylesheet must be loaded');
assert.ok(css.includes('@media (min-width: 769px) and (max-width: 960px)'), 'tablet breakpoint must exist');
assert.ok(css.includes('grid-template-columns: minmax(220px, 40fr) minmax(0, 60fr)'), 'tablet must use the approved 40/60 split');
assert.ok(css.includes('@media (max-width: 768px)'), 'phone breakpoint must exist');
assert.ok(css.includes('min-height: 100dvh'), 'phone layout must use dynamic viewport height');
assert.ok(css.includes('padding-bottom: calc(24px + env(safe-area-inset-bottom))'), 'phone layout must respect the safe area');

const responsiveBlocks = css.match(/@media[^}]+\{[\s\S]*?\n\}/g)?.join('\n') || '';
assert.ok(!/\.login-auth-panel\s*\{[^}]*position:\s*absolute/i.test(responsiveBlocks), 'responsive auth panel must not be absolute');
assert.ok(!/\.login-auth-panel\s*\{[^}]*margin-top:\s*-/i.test(responsiveBlocks), 'responsive auth panel must not use negative overlap margins');

console.log('responsive login contract tests passed');
```

- [ ] **Step 2: Write the failing cloud archive contract**

```js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'public/assets/js/data-cloud-runtime.js'), 'utf8');
const cssPath = path.join(root, 'src/assets/css/cloud-archive-visibility.css');

assert.ok(fs.existsSync(cssPath), 'cloud archive visibility stylesheet must exist');
assert.ok(html.includes('class="dm-cloud-table-scroll"'), 'cloud table needs one explicit scroll container');
assert.ok(html.includes('aria-live="polite"'), 'cloud archive summary must announce state changes');
['loading', 'empty', 'filtered-empty', 'error', 'ready'].forEach((state) => {
    assert.ok(runtime.includes(`'${state}'`), `cloud runtime must support ${state}`);
});
assert.ok(runtime.includes('renderCloudTableState'), 'cloud runtime must centralize state rendering');
assert.ok(runtime.includes('retryCloudBackups'), 'error state must expose a retry action');

console.log('cloud archive visibility tests passed');
```

- [ ] **Step 3: Register focused scripts and verify both tests fail**

Add to `package.json`:

```json
{
  "scripts": {
    "test:responsive-login-contract": "node scripts/test-responsive-login-contract.js",
    "test:cloud-archive-visibility": "node scripts/test-cloud-archive-visibility.js"
  }
}
```

Run:

```powershell
npm run test:responsive-login-contract
npm run test:cloud-archive-visibility
```

Expected: both fail because the new styles and state helper do not yet exist.

- [ ] **Step 4: Commit the failing contracts**

```powershell
git add package.json scripts/test-responsive-login-contract.js scripts/test-cloud-archive-visibility.js
git commit -m "test: define responsive login and cloud archive contracts"
```

### Task 2: Implement the Final Responsive Login Layout

**Files:**
- Create: `src/assets/css/responsive-login-final.css`
- Modify: `src/index.html`
- Test: `scripts/test-responsive-login-contract.js`

- [ ] **Step 1: Load the final stylesheet after all legacy login styles**

Add immediately after the final existing login stylesheet in `src/index.html`:

```html
<link rel="stylesheet" href="./assets/css/responsive-login-final.css">
```

- [ ] **Step 2: Implement the approved tablet 40/60 layout**

Create `src/assets/css/responsive-login-final.css` with the tablet authority:

```css
@media (min-width: 769px) and (max-width: 960px) {
  #login-overlay {
    align-items: stretch !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    padding: 18px !important;
  }

  #login-overlay > .login-shell {
    width: min(100%, 920px) !important;
    min-height: calc(100dvh - 36px) !important;
    display: grid !important;
    grid-template-columns: minmax(220px, 40fr) minmax(0, 60fr) !important;
    align-items: stretch !important;
    gap: 16px !important;
  }

  #login-overlay .login-stage,
  #login-overlay .login-auth-panel {
    position: relative !important;
    inset: auto !important;
    transform: none !important;
    min-height: 0 !important;
    margin: 0 !important;
  }

  #login-overlay .login-stage {
    display: flex !important;
    padding: 28px 22px !important;
  }

  #login-overlay .login-stage-spotlight,
  #login-overlay .login-stage-actions,
  #login-overlay .login-stage-meta {
    display: none !important;
  }

  #login-overlay .login-auth-panel {
    overflow: visible !important;
    justify-content: flex-start !important;
    padding: 28px 24px !important;
  }
}
```

- [ ] **Step 3: Implement the phone document flow**

Append:

```css
@media (max-width: 768px) {
  #login-overlay {
    display: block !important;
    min-height: 100dvh !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    padding: 0 !important;
  }

  #login-overlay > .login-shell {
    width: 100% !important;
    min-height: 100dvh !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0 !important;
  }

  #login-overlay .login-stage {
    position: relative !important;
    display: block !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: calc(16px + env(safe-area-inset-top)) 18px 16px !important;
    border-radius: 0 0 24px 24px !important;
  }

  #login-overlay .login-stage-hero {
    min-height: 0 !important;
    padding: 0 !important;
  }

  #login-overlay .login-stage-showcase,
  #login-overlay .login-stage-spotlight,
  #login-overlay .login-stage-actions,
  #login-overlay .login-stage-meta,
  #login-overlay .login-stage-platforms {
    display: none !important;
  }

  #login-overlay .login-auth-panel {
    position: relative !important;
    inset: auto !important;
    transform: none !important;
    min-height: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    padding: 22px 16px calc(24px + env(safe-area-inset-bottom)) !important;
    border-radius: 0 !important;
  }

  #login-overlay input,
  #login-overlay select {
    min-height: 48px !important;
    font-size: 16px !important;
  }

  #login-submit-button {
    min-height: 50px !important;
  }
}
```

- [ ] **Step 4: Run the focused and existing login tests**

Run:

```powershell
npm run test:responsive-login-contract
npm run test:login-cohort-runtime
npm run check:syntax
```

Expected: all pass.

- [ ] **Step 5: Commit responsive login**

```powershell
git add src/index.html src/assets/css/responsive-login-final.css
git commit -m "fix: make login responsive without panel overlap"
```

### Task 3: Make Cloud Archive States and Rows Reliably Visible

**Files:**
- Create: `src/assets/css/cloud-archive-visibility.css`
- Modify: `src/index.html`
- Modify: `public/assets/js/data-cloud-runtime.js`
- Test: `scripts/test-cloud-archive-visibility.js`

- [ ] **Step 1: Add semantic hooks and one scroll owner**

Change the cloud table wrapper in `src/index.html` to:

```html
<div class="dm-cloud-table-shell" data-cloud-state="loading">
  <div id="dm-cloud-summary" class="dm-cloud-summary" aria-live="polite"></div>
  <div class="dm-cloud-table-scroll" tabindex="0" aria-label="云端存档记录">
    <table class="comparison-table" id="dm-cloud-table">
      <!-- preserve the existing thead and tbody contract -->
    </table>
  </div>
</div>
```

Load `./assets/css/cloud-archive-visibility.css` after the existing data-manager styles.

- [ ] **Step 2: Add stable table sizing and sticky headers**

Create `src/assets/css/cloud-archive-visibility.css`:

```css
.dm-cloud-table-shell {
  min-height: 220px;
  margin-top: 18px;
}

.dm-cloud-table-scroll {
  width: 100%;
  min-height: 180px;
  max-height: min(52dvh, 560px);
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid #dfe5ec;
  border-radius: 14px;
  background: #fff;
}

#dm-cloud-table {
  width: 100%;
  min-width: 760px;
  border-collapse: separate;
  border-spacing: 0;
}

#dm-cloud-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f6f8fc;
}

#dm-cloud-table .dm-cloud-state-cell {
  height: 156px;
  padding: 28px;
  color: #6f7c91;
  text-align: center;
  white-space: normal;
}

@media (max-width: 768px) {
  .dm-cloud-table-scroll { max-height: 58dvh; }
}
```

- [ ] **Step 3: Centralize loading, empty, filtered, error, and ready states**

Add near `renderCloudBackups` in `public/assets/js/data-cloud-runtime.js`:

```js
function renderCloudTableState(tbody, shell, state, options = {}) {
    if (shell) shell.dataset.cloudState = state;
    if (!tbody || state === 'ready') return;
    const copy = {
        loading: ['正在读取云端存档…', '请稍候，正在同步记录。'],
        empty: ['暂无云端存档', '上传当前项目后，记录会显示在这里。'],
        'filtered-empty': ['当前筛选无结果', '可取消“仅当前项目”或“显示快照”后重试。'],
        error: ['云端存档读取失败', String(options.message || '请检查网络后重试。')]
    }[state];
    if (!copy) return;
    const retry = state === 'error'
        ? '<button type="button" class="btn btn-sm btn-primary" data-cloud-retry>重新加载</button>'
        : '';
    tbody.innerHTML = `<tr data-cloud-state-row="${state}"><td colspan="5" class="dm-cloud-state-cell"><strong>${escapeHtml(copy[0])}</strong><p>${escapeHtml(copy[1])}</p>${retry}</td></tr>`;
}

function retryCloudBackups(manager) {
    return renderCloudBackups(manager);
}
```

Wire one delegated click handler for `[data-cloud-retry]`, replace the current inline state rows with `renderCloudTableState`, set `ready` before writing data rows, and keep the existing selection/summary updates.

- [ ] **Step 4: Run focused archive and runtime tests**

Run:

```powershell
npm run test:cloud-archive-visibility
npm run test:cloud-api-runtime
npm run test:cloud-data-service-runtime
npm run test:data-manager-tab-runtime
```

Expected: all pass.

- [ ] **Step 5: Commit cloud archive visibility**

```powershell
git add src/index.html src/assets/css/cloud-archive-visibility.css public/assets/js/data-cloud-runtime.js
git commit -m "fix: keep cloud archive states and records visible"
```

### Task 4: Generate and Validate Cross-Platform Knowledge Bloom Assets

**Files:**
- Create: `public/assets/brand/app-icon-source.png`
- Create: `scripts/generate-app-icon-assets.mjs`
- Create: `scripts/test-app-icon-assets.mjs`
- Modify: `package.json`
- Create/Modify: platform icon outputs under `public/assets/brand/`, `desktop/assets/`, `android/app/src/main/res/`, and `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

- [ ] **Step 1: Copy the approved source into the public brand directory**

Copy `docs/design-assets/app-icon-knowledge-bloom-reference.png` to `public/assets/brand/app-icon-source.png` without recompressing it.

- [ ] **Step 2: Add free build-time icon tooling and scripts**

Run:

```powershell
npm install --save-dev sharp png-to-ico
```

Add scripts:

```json
{
  "scripts": {
    "assets:app-icons": "node scripts/generate-app-icon-assets.mjs",
    "test:app-icon-assets": "node scripts/test-app-icon-assets.mjs"
  }
}
```

- [ ] **Step 3: Implement deterministic icon generation**

Create `scripts/generate-app-icon-assets.mjs` that:

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = process.cwd();
const source = path.join(root, 'public/assets/brand/app-icon-source.png');
const webDir = path.join(root, 'public/assets/brand');
const desktopDir = path.join(root, 'desktop/assets');
const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

await fs.mkdir(webDir, { recursive: true });
await fs.mkdir(desktopDir, { recursive: true });
const outputs = [];
for (const size of sizes) {
    const file = path.join(webDir, `app-icon-${size}.png`);
    await sharp(source).resize(size, size, { fit: 'cover' }).png().toFile(file);
    outputs.push(file);
}
await fs.writeFile(path.join(desktopDir, 'icon.ico'), await pngToIco(outputs.filter((file) => /-(16|24|32|48|64|128|256)\.png$/.test(file))));

// Generate Android mipmap PNGs and adaptive-icon XML from the same source.
// Generate iOS AppIcon PNGs plus Contents.json only when ios/App exists.
```

The Android map must cover mdpi through xxxhdpi and the iOS map must cover every slot declared in `Contents.json`; do not stretch or crop differently between platforms.

- [ ] **Step 4: Write the asset contract test**

Create `scripts/test-app-icon-assets.mjs` using `sharp().metadata()` to assert:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
for (const size of [16, 24, 48, 128, 512, 1024]) {
    const file = path.join(root, `public/assets/brand/app-icon-${size}.png`);
    const meta = await sharp(file).metadata();
    assert.equal(meta.width, size);
    assert.equal(meta.height, size);
}
await fs.access(path.join(root, 'desktop/assets/icon.ico'));
console.log('app icon asset tests passed');
```

- [ ] **Step 5: Generate assets and verify**

Run:

```powershell
npm run assets:app-icons
npm run test:app-icon-assets
npm run test:desktop-package-contract
npm run test:capacitor-package-contract
```

Expected: all pass and every platform receives the same Knowledge Bloom mark.

- [ ] **Step 6: Commit platform icon assets**

```powershell
git add package.json package-lock.json scripts/generate-app-icon-assets.mjs scripts/test-app-icon-assets.mjs public/assets/brand desktop/assets android/app/src/main/res ios/App/App/Assets.xcassets/AppIcon.appiconset
git commit -m "feat: add Knowledge Bloom icons for all app platforms"
```

If the iOS project is absent, omit the missing path from `git add`, keep the generator conditional, and make the test report `iOS project not present; source set ready for macOS sync` instead of pretending an AppIcon set exists.

### Task 5: Apply the Brand Icon to Latest and Historical Release Surfaces

**Files:**
- Modify: `src/index.html`
- Modify: `public/assets/js/app-download-runtime.js`
- Modify: `public/assets/css/app-download-module.css`
- Modify: `scripts/test-app-download-runtime-hygiene.js`

- [ ] **Step 1: Extend the existing hygiene test so it fails**

Add assertions:

```js
assert.ok(html.includes('class="app-release-brand-icon"'), 'version center must expose the unified app icon');
assert.ok(source.includes("iconUrl: './assets/brand/app-icon-128.png'"), 'all platform models must use the branded icon');
assert.ok(source.includes('renderReleaseBrandIcon'), 'latest and history views must share one icon renderer');
assert.ok(source.includes('app-release-history-icon'), 'history rows must expose the app icon');
```

Run `npm run test:app-download-runtime-hygiene`.

Expected: fail on the first missing icon assertion.

- [ ] **Step 2: Add the icon hook to the version-center template**

Use a real image asset in `src/index.html`:

```html
<img class="app-release-brand-icon" src="./assets/brand/app-icon-128.png" width="72" height="72" alt="校衡台应用图标">
```

Place it beside the focused release title without changing existing tabs, actions, detail IDs, or history drawer IDs.

- [ ] **Step 3: Use one icon renderer for current and historical releases**

Add to each platform model:

```js
iconUrl: './assets/brand/app-icon-128.png'
```

Add:

```js
function renderReleaseBrandIcon(channel, className = 'app-release-brand-icon') {
    const src = escapeHtml(channel?.iconUrl || './assets/brand/app-icon-128.png');
    return `<img class="${className}" src="${src}" width="48" height="48" alt="" aria-hidden="true">`;
}
```

Call it from `renderFocusedPlatform`, `renderReleaseTimeline`, and the history-row renderer so latest and historical records remain visually consistent.

- [ ] **Step 4: Style the asset in the approved premium language**

Add to `public/assets/css/app-download-module.css`:

```css
#app-download-center .app-release-brand-icon,
#app-download-center .app-release-history-icon {
  flex: 0 0 auto;
  border: 1px solid rgba(217, 95, 122, .18);
  border-radius: 22%;
  background: #fffaf3;
  box-shadow: 0 14px 32px rgba(49, 59, 78, .12);
  object-fit: cover;
}

#app-download-center .app-release-history-icon {
  width: 42px;
  height: 42px;
}
```

- [ ] **Step 5: Run release-surface tests and commit**

Run:

```powershell
npm run test:app-download-runtime-hygiene
npm run test:app-release-catalog-runtime
npm run test:release-manifest
npm run test:release-surface
```

Expected: all pass.

Commit:

```powershell
git add src/index.html public/assets/js/app-download-runtime.js public/assets/css/app-download-module.css scripts/test-app-download-runtime-hygiene.js
git commit -m "feat: brand latest and historical app releases"
```

### Task 6: Visual QA, Calculation Verification, GitHub Push, and Cloudflare Deploy

**Files:**
- Modify only if verification exposes a defect in the files above.

- [ ] **Step 1: Run the focused regression suite**

```powershell
npm run test:responsive-login-contract
npm run test:cloud-archive-visibility
npm run test:app-icon-assets
npm run test:app-download-runtime-hygiene
npm run test:login-cohort-runtime
npm run test:release-manifest
npm run check:syntax
```

Expected: all pass.

- [ ] **Step 2: Build and run local smoke/calculation verification**

```powershell
npm run build
npm run smoke:layout:local
npm run test:calculation-snapshot:local
npm run check:release-fast
```

Expected: build succeeds; layout smoke and calculation snapshot pass; release-fast passes.

- [ ] **Step 3: Compare visual output at approved viewports**

Use the user's chosen browser and capture the login and cloud archive surfaces at:

```text
390×844
430×932
768×1024
834×1194
1440×1024
```

At each viewport verify: no overlap, no clipped form controls, no horizontal page overflow, cloud header and first/last records visible, and the selected Knowledge Bloom icon readable at release-card and history-row sizes. Compare captures with the supplied system screenshot and selected icon reference before accepting.

- [ ] **Step 4: Verify release metadata and installable assets**

```powershell
npm run release:verify-assets
npm run test:worker-release-chunks
npm run test:worker-release-downloads
```

Expected: version, filename, byte count, date, and SHA-256 contracts pass; unavailable iOS artifacts remain explicitly unavailable.

- [ ] **Step 5: Inspect the final diff and commit any QA-only correction**

```powershell
git diff --check
git status --short
```

If verification required a correction:

```powershell
git add <only-the-corrected-files>
git commit -m "fix: address responsive release QA findings"
```

- [ ] **Step 6: Push to GitHub**

```powershell
git push origin main
```

Expected: the remote `main` branch advances to the verified local commit. If GitHub authentication fails, stop and report the exact authentication blocker without rewriting history or changing remotes.

- [ ] **Step 7: Deploy to Cloudflare and verify production**

```powershell
npx wrangler deploy
npm run verify:prod-minimal
```

Expected: Wrangler reports a new deployed version; production login, cloud archive, downloads, and release metadata checks pass. If production verification fails, retain or roll back to the previously healthy Worker version.

## Self-Review

- Spec coverage: responsive login, archive states/scrolling, selected icon, platform assets, current/history release UI, calculations, GitHub, Cloudflare, and rollback each have a task.
- Placeholder scan: every implementation and error-state step contains concrete code, commands, and expected results.
- Type consistency: `renderCloudTableState`, `retryCloudBackups`, `renderReleaseBrandIcon`, icon paths, test script names, and package scripts are consistent across tasks.
- Scope control: desktop theme and existing business/data contracts remain intact; iOS availability is never fabricated.
