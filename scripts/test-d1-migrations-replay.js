// Every numbered migration in cloudflare/d1 must apply cleanly, in order, to a
// brand-new database, and the result must contain the tables the Worker uses.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'cloudflare', 'd1');
const files = fs.readdirSync(dir).filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
assert.ok(files.length >= 8, 'expected the numbered D1 migrations');

const db = new DatabaseSync(':memory:');
for (const name of files) {
  try {
    db.exec(fs.readFileSync(path.join(dir, name), 'utf8'));
  } catch (error) {
    assert.fail(`${name} does not apply to a fresh database: ${error.message}`);
  }
}

const objects = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','index')").all().map((row) => row.name));
[
  'cloud_system_data', 'system_users', 'login_sessions', 'login_rate_limits', 'issues', 'system_logs',
  'config_alias_rules', 'warning_records', 'rectify_tasks', 'snapshot_versions',
  'idx_login_sessions_session_id', 'idx_login_rate_limits_locked_until'
].forEach((name) => assert.ok(objects.has(name), `fresh database should contain ${name}`));

console.log(`d1 migrations replay tests passed (${files.length} files)`);
