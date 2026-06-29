const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function duplicates(values) {
  const seen = new Set();
  const dupes = new Set();
  values.filter(Boolean).forEach((value) => {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  });
  return Array.from(dupes).sort();
}

function extractQuotedArray(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!match) return [];
  return unique(Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g), (item) => item[1]));
}

function printList(title, values) {
  if (!values.length) return;
  console.error(`\n${title}`);
  values.forEach((value) => console.error(`- ${value}`));
}

const html = read('src/index.html');
const shellRuntime = read('public/assets/js/shell-runtime.js');
const appRuntime = read('public/assets/js/app.js');
const smokeRuntime = read('scripts/smoke-all-modules.js');
const htmlWithoutTemplates = html.replace(/<script\s+type="text\/html"[\s\S]*?<\/script>/g, '');

const rawSectionIds = Array.from(
  htmlWithoutTemplates.matchAll(/<div\s+id="([^"]+)"\s+class="[^"]*\bsection\b[^"]*"/g),
  (match) => match[1]
);
const sectionIds = unique(rawSectionIds);

const navItemMatches = Array.from(shellRuntime.matchAll(/\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?text:\s*['"]([^'"]*)['"][\s\S]*?hint:\s*['"]([^'"]*)['"]/g));
const rawNavIds = navItemMatches.map((match) => match[1]);
const navIds = unique(rawNavIds);
const navTextMap = new Map(navItemMatches.map((match) => [match[1], { text: match[2], hint: match[3] }]));
const categoryItemBlocks = Array.from(
  shellRuntime.matchAll(/(\w+):\s*\{[\s\S]*?items:\s*\[([\s\S]*?)\]\s*\n\s*\}/g),
  (match) => ({ key: match[1], itemsBlock: match[2] })
);

const rawTemplateIds = Array.from(
  html.matchAll(/<script\s+type="text\/html"\s+id="([^"]+)"/g),
  (match) => match[1]
);
const templateIds = unique(rawTemplateIds);
const lazyPlaceholders = Array.from(
  html.matchAll(/<div\s+id="([^"]+)"[^>]*data-lazy-section-template="([^"]+)"[^>]*data-lazy-section-placeholder="1"/g),
  (match) => ({ id: match[1], templateId: match[2] })
);
const lazyTemplateRootIds = Array.from(
  html.matchAll(/<script\s+type="text\/html"\s+id="([^"]+)">[\s\S]*?<div\s+id="([^"]+)"/g),
  (match) => ({ templateId: match[1], rootId: match[2] })
);

const rawSmokeIds = extractQuotedArray(smokeRuntime, 'DEFAULT_SWITCH_MODULE_IDS');
const rawGuardedIds = extractQuotedArray(appRuntime, 'needGuard');

const removedRedirectIds = unique(Array.from(
  appRuntime.matchAll(/['"]([^'"]+)['"]:\s*['"][^'"]+['"]/g),
  (match) => match[1]
).filter((id) => appRuntime.includes('removedModuleRedirects') && ['macro-watch', 'teaching-overview', 'teaching-issue-board', 'teaching-warning-center', 'single-school-eval'].includes(id)));

const dynamicSectionIds = new Set([
  'county-teacher-portrait',
  'county-school-horizontal',
  'teacher-detail-comparison',
  'teacher-pairing',
  'teacher-township-ranking'
]);

const validModuleIds = new Set([...sectionIds, ...dynamicSectionIds]);
const guardedIds = new Set(rawGuardedIds);
const smokeIds = new Set(rawSmokeIds);

const duplicateSections = duplicates(rawSectionIds);
const duplicateNavIds = duplicates(rawNavIds);
const duplicateTemplateIds = duplicates(rawTemplateIds);
const duplicateSmokeIds = duplicates(rawSmokeIds);
const duplicateGuardIds = duplicates(rawGuardedIds);

const navIdsWithMissingCopy = navIds.filter((id) => {
  const meta = navTextMap.get(id) || {};
  return !String(meta.text || '').trim() || !String(meta.hint || '').trim();
});

const emptyNavCategories = categoryItemBlocks
  .filter((category) => !/\{\s*id:\s*['"][^'"]+['"]/.test(category.itemsBlock))
  .map((category) => category.key);

const smokeIdsWithoutModules = rawSmokeIds.filter((id) => !validModuleIds.has(id));
const guardIdsWithoutModules = rawGuardedIds.filter((id) => !validModuleIds.has(id));
const placeholdersWithoutTemplates = lazyPlaceholders
  .filter((placeholder) => !templateIds.includes(placeholder.templateId))
  .map((placeholder) => `${placeholder.id} -> ${placeholder.templateId}`);
const templatesWithoutPlaceholders = templateIds
  .filter((id) => id.startsWith('lazy-section-template-'))
  .filter((id) => !lazyPlaceholders.some((placeholder) => placeholder.templateId === id))
  .filter((id) => !['lazy-section-template-drill-modal', 'lazy-section-template-teacher-modal'].includes(id));
const lazyRootMismatches = lazyTemplateRootIds
  .filter((item) => !['lazy-section-template-drill-modal', 'lazy-section-template-teacher-modal'].includes(item.templateId))
  .filter((item) => {
    const placeholder = lazyPlaceholders.find((candidate) => candidate.templateId === item.templateId);
    return placeholder && placeholder.id !== item.rootId;
  })
  .map((item) => `${item.templateId}: placeholder ${lazyPlaceholders.find((candidate) => candidate.templateId === item.templateId)?.id} != root ${item.rootId}`);

const removedRedirectsInNavigation = navIds.filter((id) => removedRedirectIds.includes(id));

const rawShellNavIds = Array.from(
  shellRuntime.matchAll(/\{\s*id:\s*['"]([^'"]+)['"]/g),
  (match) => match[1]
);
const navParserMisses = unique(rawShellNavIds).filter((id) => !navIds.includes(id));

const scoreFreeIds = new Set([
  'starter-hub',
  'audio-debug',
  'upload',
  'data-quality',
  'zhongkao-countdown',
  'exam-arranger',
  'freshman-simulator',
  'grade-scheduler',
  'seat-adjustment',
  'mutual-aid'
]);

const guardAlias = new Map([
  ['county-teacher-portrait', 'county-analysis'],
  ['county-school-horizontal', 'county-analysis']
]);

const missingSections = navIds.filter((id) => !sectionIds.includes(id) && !dynamicSectionIds.has(id));
const missingGuards = navIds.filter((id) => {
  if (scoreFreeIds.has(id)) return false;
  const guardId = guardAlias.get(id) || id;
  return !guardedIds.has(guardId);
});
const smokeGaps = navIds.filter((id) => {
  if (id === 'county-teacher-portrait' || id === 'county-school-horizontal') {
    return smokeIds.has('county-analysis') ? false : true;
  }
  return !smokeIds.has(id);
});
const staleScoreFreeIds = Array.from(scoreFreeIds).filter((id) => !validModuleIds.has(id));
const missingDynamicCountySmoke = Array.from(dynamicSectionIds).length && !smokeIds.has('county-analysis')
  ? ['county-analysis']
  : [];

printList('Navigation items without a matching section or dynamic section handler:', missingSections);
printList('Duplicate section ids:', duplicateSections);
printList('Duplicate navigation ids:', duplicateNavIds);
printList('Duplicate lazy template ids:', duplicateTemplateIds);
printList('Duplicate smoke module ids:', duplicateSmokeIds);
printList('Duplicate guard module ids:', duplicateGuardIds);
printList('Navigation items missing text or hint copy:', navIdsWithMissingCopy);
printList('Navigation categories without items:', emptyNavCategories);
printList('Smoke module ids without a real section or dynamic handler:', smokeIdsWithoutModules);
printList('Guard module ids without a real section or dynamic handler:', guardIdsWithoutModules);
printList('Lazy placeholders without matching templates:', placeholdersWithoutTemplates);
printList('Lazy templates without matching placeholders:', templatesWithoutPlaceholders);
printList('Lazy template root id mismatches:', lazyRootMismatches);
printList('Removed redirect module ids still present in navigation:', removedRedirectsInNavigation);
printList('Navigation ids missed by metadata parser:', navParserMisses);
printList('Score-dependent navigation items missing base-config guard coverage:', missingGuards);
printList('Navigation items missing module switch smoke coverage:', smokeGaps);
printList('Score-free allowlist entries without modules:', staleScoreFreeIds);
printList('Dynamic county modules missing county-analysis smoke coverage:', missingDynamicCountySmoke);

const failures = [
  missingSections,
  duplicateSections,
  duplicateNavIds,
  duplicateTemplateIds,
  duplicateSmokeIds,
  duplicateGuardIds,
  navIdsWithMissingCopy,
  emptyNavCategories,
  smokeIdsWithoutModules,
  guardIdsWithoutModules,
  placeholdersWithoutTemplates,
  templatesWithoutPlaceholders,
  lazyRootMismatches,
  removedRedirectsInNavigation,
  navParserMisses,
  missingGuards,
  smokeGaps,
  staleScoreFreeIds,
  missingDynamicCountySmoke
].some((items) => items.length);

if (failures) {
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  navItems: navIds.length,
  sections: sectionIds.length,
  lazyPlaceholders: lazyPlaceholders.length,
  lazyTemplates: templateIds.filter((id) => id.startsWith('lazy-section-template-')).length,
  smokeCoverageGaps: smokeGaps
}, null, 2));
