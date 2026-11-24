#!/usr/bin/env node
/**
 * D1 Deletion Tombstone Recovery Checker (modeled on space-ledger/scripts/check-tombstones.js).
 *
 * After a Cloudflare D1 Time Travel restore, run this read-only checker against an
 * offline tombstones JSON export and a list of current live keys/usernames to detect
 * any deleted exams, cohorts, or accounts that resurrected from an older backup.
 *
 * Usage:
 *   node scripts/check-tombstones.mjs --tombstones ./tombstones.json --live-keys ./live-keys.json
 */
import fs from 'node:fs';
import path from 'node:path';

export function detectResurrectedRecords(tombstones, liveState = {}) {
  const examKeys = new Set((liveState.examKeys || []).map((k) => String(k || '').trim()).filter(Boolean));
  const cohortKeys = new Set((liveState.cohortKeys || []).map((k) => String(k || '').trim()).filter(Boolean));
  const usernames = new Set((liveState.usernames || []).map((u) => String(u || '').trim()).filter(Boolean));

  const resurrected = [];
  for (const item of Array.isArray(tombstones) ? tombstones : []) {
    const type = String(item?.resource_type || '').trim();
    const key = String(item?.resource_key || '').trim();
    if (!type || !key) continue;
    let found = false;
    if (type === 'exam') found = examKeys.has(key);
    else if (type === 'cohort') found = cohortKeys.has(key) || examKeys.has(key);
    else if (type === 'account') found = usernames.has(key);
    if (found) {
      resurrected.push({
        id: item.id || '',
        resource_type: type,
        resource_key: key,
        deleted_at: item.deleted_at || '',
        actor_username: item.actor_username || ''
      });
    }
  }
  return resurrected;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--tombstones' && argv[i + 1]) { args.tombstones = argv[++i]; }
    else if (argv[i] === '--live-keys' && argv[i + 1]) { args.liveKeys = argv[++i]; }
  }
  return args;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
if (isCli) {
  const args = parseArgs(process.argv);
  if (!args.tombstones || !args.liveKeys) {
    console.error('Usage: node scripts/check-tombstones.mjs --tombstones <tombstones.json> --live-keys <live-keys.json>');
    process.exit(2);
  }
  const tombData = JSON.parse(fs.readFileSync(args.tombstones, 'utf8'));
  const tombList = Array.isArray(tombData) ? tombData : (tombData.rows || []);
  const liveState = JSON.parse(fs.readFileSync(args.liveKeys, 'utf8'));
  const resurrected = detectResurrectedRecords(tombList, liveState);
  console.log(JSON.stringify({ ok: resurrected.length === 0, checked: tombList.length, resurrectedCount: resurrected.length, resurrected }, null, 2));
  process.exit(resurrected.length === 0 ? 0 : 1);
}
