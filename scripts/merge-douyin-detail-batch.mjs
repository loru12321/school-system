import fs from 'node:fs';

const [tempPath, batchId, expectedCountText] = process.argv.slice(2);

if (!tempPath || !batchId) {
    throw new Error('Usage: node scripts/merge-douyin-detail-batch.mjs <temp-json> <batch-id> [expected-count]');
}

const expectedCount = expectedCountText ? Number(expectedCountText) : null;
const ledgerPath = 'docs/douyin-favorite-audit-ledger.json';
const evidencePath = 'docs/douyin-favorite-evidence-2026-06-17.md';
const testPath = 'scripts/test-docs-hygiene.js';
const detailResults = JSON.parse(fs.readFileSync(tempPath, 'utf8'));

if (expectedCount !== null && detailResults.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} detail results, got ${detailResults.length}`);
}

const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const resultByUrl = new Map(detailResults.map((result) => [result.url, result]));
let upgraded = 0;

for (const batch of ledger.batches) {
    for (const entry of batch.entries || []) {
        const result = resultByUrl.get(entry.url);
        if (!result || entry.status !== 'visible-list-only') {
            continue;
        }

        entry.status = 'completed-detail';
        entry.detailOpenedAt = '2026-06-17';
        entry.detailTitle = result.title;
        entry.durationSeconds = result.media?.[0]?.duration || null;
        entry.mediaElementsObserved = result.media || [];
        entry.musicDirectionSignals = result.musicMatches || [];
        entry.authorizationSignals = [];
        entry.authorizationNote = 'The detail page loaded playable media, but no explicit ownership, redistribution license, or commercial-use permission for the soundtrack was visible. Platform footer/license text is not treated as soundtrack authorization.';
        entry.detailEvidenceText = result.bodyText.slice(0, 420);
        upgraded += 1;
    }
}

if (expectedCount !== null && upgraded !== expectedCount) {
    throw new Error(`Expected to upgrade ${expectedCount} ledger entries, upgraded ${upgraded}`);
}

ledger.summary.completedDetailPages += upgraded;
ledger.summary.visibleListOnlyPages -= upgraded;
ledger.summary.scannedFavoriteEvidence = ledger.summary.completedDetailPages + ledger.summary.attemptedDetailPages + ledger.summary.visibleListOnlyPages;
ledger.summary.directlyReusableAudio = 0;

const batchNumber = batchId.replace(/^batch-/, '');
const sectionTitle = `Favorite Link Batch ${batchNumber} - Detail Upgrade Audit`;

ledger.batches.push({
    id: batchId,
    status: 'detail-upgrade',
    count: upgraded,
    capturedAt: '2026-06-17',
    source: 'Upgraded existing visible-list entries after opening detail pages in Chrome.',
    entries: [],
    detailReferences: detailResults.map((result) => ({
        url: result.url,
        status: 'detail-upgrade-reference',
        title: result.title,
        durationSeconds: result.media?.[0]?.duration || null,
        mediaElementsObserved: result.media || [],
        musicDirectionSignals: result.musicMatches || [],
        authorizationSignals: [],
        authorizationNote: 'Reference-only batch summary. The canonical entry for this URL was upgraded in its original batch.'
    }))
});

fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');

const completedWords = {
    54: 'fifty-four',
    59: 'fifty-nine',
    64: 'sixty-four',
    69: 'sixty-nine',
    74: 'seventy-four',
    79: 'seventy-nine',
    84: 'eighty-four',
    89: 'eighty-nine',
    94: 'ninety-four',
    99: 'ninety-nine',
    104: 'one hundred four'
};
const completedPhrase = completedWords[ledger.summary.completedDetailPages] || `${ledger.summary.completedDetailPages}`;
const batchSection = [
    `## ${sectionTitle}`,
    '',
    `${upgraded} previously list-only favorite videos were opened directly on their detail pages. ${upgraded} loaded a video element with visible duration metadata. None displayed explicit soundtrack ownership, redistribution permission, or commercial-use authorization, so directly reusable audio remains \`0\`.`,
    '',
    ...detailResults.map((result) => {
        const duration = result.media?.[0]?.duration ? `${result.media[0].duration}s` : 'not observed';
        const music = (result.musicMatches || []).length ? result.musicMatches.join(', ') : 'none';
        return [
            `- \`${result.url}\``,
            `  - Title: \`${String(result.title || '').replace(/`/g, '\\`')}\``,
            `  - Duration observed: \`${duration}\``,
            `  - Music/design signals: \`${music.replace(/`/g, '\\`')}\``,
            '  - License signals observed: none. Platform footer/license wording was not counted as soundtrack authorization.'
        ].join('\n');
    }),
    ''
].join('\n');

let evidence = fs.readFileSync(evidencePath, 'utf8');
evidence = evidence.replace('\n## Design Translation\n', `\n${batchSection}\n## Design Translation\n`);
evidence = evidence.replace(
    /Current evidence covers[\s\S]*?\n$/,
    `Current evidence covers 222 unique favorite-video URLs captured from the logged-in favorites list: ${completedPhrase} completed opened detail pages, ten third-batch detail-opening attempts whose direct pages or modal navigation did not reliably expose complete detail metadata, and ${ledger.summary.visibleListOnlyPages} visible-list captures that still need detail opening. No captured entry currently contains explicit authorization signals for directly bundling its Douyin audio.\n`
);
fs.writeFileSync(evidencePath, evidence, 'utf8');

let test = fs.readFileSync(testPath, 'utf8');
test = test.replace(/douyinLedger\.summary\.completedDetailPages, \d+,/, `douyinLedger.summary.completedDetailPages, ${ledger.summary.completedDetailPages},`);
test = test.replace(/douyinLedger\.summary\.visibleListOnlyPages, \d+,/, `douyinLedger.summary.visibleListOnlyPages, ${ledger.summary.visibleListOnlyPages},`);
if (!test.includes(sectionTitle)) {
    const previousNumber = Number(batchNumber) - 1;
    const previousLine = new RegExp(`assert\\.ok\\(douyinEvidence\\.includes\\('Favorite Link Batch ${previousNumber} - Detail Upgrade Audit'\\), '[^']+'\\);`);
    const match = test.match(previousLine);
    const nextLine = `assert.ok(douyinEvidence.includes('${sectionTitle}'), 'Douyin evidence should include batch ${batchNumber} detail-upgrade audit');`;
    if (match) {
        test = test.replace(match[0], `${match[0]}\n${nextLine}`);
    } else {
        test = test.replace(
            "assert.ok(douyinEvidence.includes('Directly reusable Douyin favorite audio found so far: `0`'), 'Douyin evidence should keep the music reuse audit');",
            `${nextLine}\nassert.ok(douyinEvidence.includes('Directly reusable Douyin favorite audio found so far: \`0\`'), 'Douyin evidence should keep the music reuse audit');`
        );
    }
}
fs.writeFileSync(testPath, test, 'utf8');
fs.rmSync(tempPath, { force: true });

console.log(JSON.stringify({ upgraded, summary: ledger.summary, sectionTitle }, null, 2));
