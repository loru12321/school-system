// Audit + optional strip of PROVABLY-DEAD CSS rules.
//
// A top-level rule R is dead iff a LATER top-level rule S in the SAME file has:
//   - the identical (whitespace-normalized) selector, AND
//   - S declares every property-name that R declares, AND
//   - for each such property, S's importance >= R's importance
//     (S !important covers R !important or R normal; S normal covers only R normal)
//
// Under CSS cascade (same file, same specificity, source order), S wins every
// property R sets, so R contributes nothing to the computed style. No property
// can leak. @-rules (e.g. @media) and rules whose body contains nested blocks
// are NEVER touched. Dry-run by default; pass --write to apply.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssDir = path.resolve(__dirname, '../../src/assets/css');

function parseTopLevel(css) {
  const rules = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    while (i < n && /\s/.test(css[i])) i++;
    if (i >= n) break;
    if (css[i] === '/' && css[i + 1] === '*') {
      const e = css.indexOf('*/', i);
      i = e < 0 ? n : e + 2;
      continue;
    }
    let j = i;
    while (j < n && css[j] !== '{' && css[j] !== '}') j++;
    if (j >= n || css[j] === '}') { i = j + 1; continue; }
    const sel = css.slice(i, j).trim().replace(/\s+/g, ' ');
    let d = 0, k = j;
    for (; k < n; k++) {
      if (css[k] === '{') d++;
      else if (css[k] === '}') { d--; if (d === 0) break; }
    }
    const body = css.slice(j + 1, k);
    rules.push({
      sel,
      body,
      start: i,
      end: k + 1,
      isAt: sel.startsWith('@'),
      nested: body.includes('{'),
    });
    i = k + 1;
  }
  return rules;
}

function props(body) {
  const map = {};
  body.split(';').forEach((decl) => {
    const c = decl.indexOf(':');
    if (c <= 0) return;
    const p = decl.slice(0, c).trim().toLowerCase();
    if (!p) return;
    map[p] = decl.slice(c + 1).includes('!important');
  });
  return map;
}

function findDead(rules) {
  const dead = new Set();
  for (let a = 0; a < rules.length; a++) {
    const ra = rules[a];
    if (ra.isAt || ra.nested) continue;
    const pa = props(ra.body);
    const names = Object.keys(pa);
    if (names.length === 0) continue;
    for (let b = a + 1; b < rules.length; b++) {
      const rb = rules[b];
      if (rb.isAt || rb.nested) continue;
      if (rb.sel !== ra.sel) continue;
      const pb = props(rb.body);
      const covers = names.every((p) => (p in pb) && (pb[p] || !pa[p]));
      if (covers) { dead.add(a); break; }
    }
  }
  return dead;
}

function resolveCssFile(input) {
  if (path.isAbsolute(input)) return input;
  const fromCwd = path.resolve(process.cwd(), input);
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.join(cssDir, input);
}

const targets = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const write = process.argv.includes('--write');
const files = targets.length ? targets : fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));

let grandBytes = 0;
for (const file of files) {
  const full = resolveCssFile(file);
  const label = path.relative(cssDir, full).replace(/\\/g, '/');
  const css = fs.readFileSync(full, 'utf8');
  const rules = parseTopLevel(css);
  const dead = findDead(rules);
  if (dead.size === 0) { console.log(`${label}: 0 dead rules`); continue; }
  let bytes = 0;
  [...dead].forEach((idx) => { bytes += rules[idx].end - rules[idx].start; });
  grandBytes += bytes;
  console.log(`${label}: ${dead.size} dead rules, ~${bytes} bytes`);
  if (write) {
    // Build output skipping dead ranges (keep inter-rule whitespace/comments).
    const ranges = [...dead].map((idx) => [rules[idx].start, rules[idx].end]).sort((x, y) => x[0] - y[0]);
    let out = '';
    let cursor = 0;
    for (const [s, e] of ranges) {
      out += css.slice(cursor, s);
      cursor = e;
    }
    out += css.slice(cursor);
    // Collapse blank-line runs left behind.
    out = out.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(full, out, 'utf8');
    console.log(`  -> written (${css.length} -> ${out.length} bytes)`);
  }
}
console.log(`TOTAL removable: ~${grandBytes} source bytes${write ? ' (WRITTEN)' : ' (dry-run; pass --write)'}`);
