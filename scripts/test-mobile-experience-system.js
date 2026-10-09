const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const cssPath = path.join(root, 'src/assets/css/mobile-experience-system.css');
const applicationCss = fs.readFileSync(path.join(root, 'src/assets/css/application.css'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.ok(fs.existsSync(cssPath), 'mobile-experience-system.css must exist');
const css = fs.readFileSync(cssPath, 'utf8');

const mobileImport = '@import "./mobile-experience-system.css";';
const mobileIndex = applicationCss.indexOf(mobileImport);
assert.ok(mobileIndex > applicationCss.indexOf('@import "./ux-review-2026.css";'), 'mobile experience layer must follow ux review');
assert.ok(mobileIndex < applicationCss.indexOf('utility-classes.css";'), 'mobile experience layer must precede utilities');

for (const token of [
  '--mobile-page-gutter',
  '--mobile-control-min',
  '--mobile-control-primary',
  '--mobile-shell-top',
  '--mobile-shell-bottom',
  '--mobile-content-bottom'
]) {
  assert.match(css, new RegExp(`${token}\\s*:`), `missing ${token}`);
}

assert.match(css, /--mobile-control-min\s*:\s*44px/, 'standard touch targets must be at least 44px');
assert.match(css, /--mobile-control-primary\s*:\s*46px/, 'primary controls must be at least 46px');
assert.match(css, /safe-area-inset-bottom/, 'bottom actions must account for the device safe area');
assert.match(css, /touch-action\s*:\s*manipulation/, 'interactive controls must use manipulation touch action');
assert.match(css, /:focus-visible/, 'keyboard focus must remain visible');
assert.match(css, /prefers-reduced-motion\s*:\s*reduce/, 'reduced motion must be supported');
assert.match(css, /color-scheme\s*:\s*dark/, 'native controls must use dark colors in dark mode');

for (const hook of [
  '[data-mobile-surface]',
  '[data-mobile-action-bar]',
  '[data-mobile-table]',
  '[data-mobile-sheet]'
]) {
  assert.ok(css.includes(hook), `missing semantic hook ${hook}`);
}

assert.equal(packageJson.scripts['test:mobile-experience-system'], 'node scripts/test-mobile-experience-system.js');
assert.match(packageJson.scripts['validate:build'], /test:mobile-experience-system/, 'validate:build must run the mobile experience contract');
assert.match(packageJson.scripts['check:release-fast'], /test:mobile-experience-system/, 'fast release checks must run the mobile experience contract');

console.log('mobile experience system contract passed');
