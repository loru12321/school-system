import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DATE_PATTERN = /(\d{4})[.-]?(\d{2})[.-]?(\d{2})/;

export function resolveAppVersion(input) {
  const channel = String(input?.channel ?? '');
  const releaseTag = String(input?.tag ?? '');
  const sourceSha = String(input?.sha ?? '');
  const dateMatch = releaseTag.match(DATE_PATTERN);

  if (!dateMatch) {
    throw new Error(`release tag must contain a date: ${releaseTag}`);
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`release tag contains an invalid calendar date: ${releaseTag}`);
  }

  const runNumberInput = input?.runNumber;
  const validRunNumberSyntax = typeof runNumberInput === 'number'
    || (typeof runNumberInput === 'string' && /^\d+$/.test(runNumberInput));
  const runNumber = Number(runNumberInput);
  if (!validRunNumberSyntax || !Number.isSafeInteger(runNumber) || runNumber <= 0) {
    throw new Error(`runNumber must be a positive safe integer: ${input?.runNumber ?? ''}`);
  }

  const baseVersion = `${year}.${month}.${day}`;
  return {
    releaseTag,
    versionName: channel === 'stable' ? baseVersion : `${baseVersion}-beta.${runNumber}`,
    buildNumber: runNumber,
    sourceSha,
  };
}

function readArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const option = argv[index];
    const value = argv[index + 1];
    if (!option?.startsWith('--') || value === undefined) {
      throw new Error(`expected --name value arguments, received: ${argv.join(' ')}`);
    }
    values[option.slice(2)] = value;
  }
  return values;
}

function assertSingleLine(value, name) {
  if (/\r|\n/.test(value)) {
    throw new Error(`${name} must not contain line breaks`);
  }
}

function runCli() {
  const args = readArguments(process.argv.slice(2));
  const resolved = resolveAppVersion({
    channel: args.channel ?? process.env.APP_RELEASE_CHANNEL,
    tag: args.tag ?? process.env.GITHUB_REF_NAME,
    sha: args.sha ?? process.env.GITHUB_SHA,
    runNumber: args['run-number'] ?? process.env.GITHUB_RUN_NUMBER,
  });
  const outputs = {
    APP_VERSION_NAME: resolved.versionName,
    APP_BUILD_NUMBER: String(resolved.buildNumber),
    APP_RELEASE_TAG: resolved.releaseTag,
    APP_SOURCE_SHA: resolved.sourceSha,
  };
  const lines = Object.entries(outputs).map(([key, value]) => {
    assertSingleLine(value, key);
    return `${key}=${value}`;
  }).join('\n') + '\n';

  process.stdout.write(lines);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, lines, 'utf8');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli();
}
