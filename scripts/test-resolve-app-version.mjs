import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { resolveAppVersion } from './resolve-app-version.mjs';

test('resolves beta release metadata', () => {
  assert.deepEqual(resolveAppVersion({
    channel: 'beta',
    tag: 'beta-20260620-cb785f5',
    sha: 'cb785f5abc',
    runNumber: '42',
  }), {
    releaseTag: 'beta-20260620-cb785f5',
    versionName: '2026.6.20-beta.42',
    buildNumber: 42,
    sourceSha: 'cb785f5abc',
  });
});

test('resolves stable release metadata without a prerelease suffix', () => {
  assert.deepEqual(resolveAppVersion({
    channel: 'stable',
    tag: 'school-system-v2026.06.20',
    sha: 'stable123',
    runNumber: '43',
  }), {
    releaseTag: 'school-system-v2026.06.20',
    versionName: '2026.6.20',
    buildNumber: 43,
    sourceSha: 'stable123',
  });
});

test('rejects tags without a valid calendar date', () => {
  assert.throws(
    () => resolveAppVersion({ channel: 'beta', tag: 'beta-latest', sha: 'abc', runNumber: '1' }),
    { message: 'Release tag must contain YYYYMMDD or YYYY.MM.DD: beta-latest' },
  );
  for (const tag of ['', 'beta-latest', 'beta-20260230-deadbee', 'v2026-13-01']) {
    assert.throws(
      () => resolveAppVersion({ channel: 'beta', tag, sha: 'abc', runNumber: '1' }),
      /YYYYMMDD|invalid calendar date/i,
      tag,
    );
  }
});

test('rejects invalid build numbers', () => {
  for (const runNumber of ['', '0', '-1', '1.5', '1e2', 'abc', String(Number.MAX_SAFE_INTEGER + 1)]) {
    assert.throws(
      () => resolveAppVersion({ channel: 'beta', tag: 'beta-20260620-abc', sha: 'abc', runNumber }),
      /runNumber/i,
      String(runNumber),
    );
  }
});

test('all non-stable channels use the beta version suffix', () => {
  assert.equal(resolveAppVersion({ channel: 'nightly', tag: 'nightly-2026-06-20', sha: 'abc', runNumber: 7 }).versionName, '2026.6.20-beta.7');
});

test('CLI prints outputs and appends the same values to GITHUB_OUTPUT', () => {
  const directory = mkdtempSync(join(tmpdir(), 'resolve-app-version-'));
  const outputPath = join(directory, 'github-output.txt');

  try {
    const stdout = execFileSync(process.execPath, [
      fileURLToPath(new URL('./resolve-app-version.mjs', import.meta.url)),
      '--channel', 'beta',
      '--tag', 'beta-20260620-cb785f5',
      '--sha', 'cb785f5abc',
      '--run-number', '42',
    ], {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: outputPath },
    });
    const expected = [
      'APP_VERSION_NAME=2026.6.20-beta.42',
      'APP_BUILD_NUMBER=42',
      'APP_RELEASE_TAG=beta-20260620-cb785f5',
      'APP_SOURCE_SHA=cb785f5abc',
      '',
    ].join('\n');

    assert.equal(stdout.replaceAll('\r\n', '\n'), expected);
    assert.equal(readFileSync(outputPath, 'utf8').replaceAll('\r\n', '\n'), expected);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('CLI reads the documented GitHub release environment', () => {
  const stdout = execFileSync(process.execPath, [fileURLToPath(new URL('./resolve-app-version.mjs', import.meta.url))], {
    encoding: 'utf8',
    env: {
      ...process.env,
      APP_RELEASE_CHANNEL: 'stable',
      GITHUB_REF_NAME: 'school-system-v2026.06.20',
      GITHUB_SHA: 'stable123',
      GITHUB_RUN_NUMBER: '43',
      GITHUB_OUTPUT: '',
    },
  });

  assert.match(stdout, /^APP_VERSION_NAME=2026\.6\.20\nAPP_BUILD_NUMBER=43\nAPP_RELEASE_TAG=school-system-v2026\.06\.20\nAPP_SOURCE_SHA=stable123\n$/);
});
