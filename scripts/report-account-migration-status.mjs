import { exec, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const dbName = String(process.env.MIGRATION_DB || 'school-system-gateway').trim();
const useRemote = !process.argv.includes('--local');
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const queries = {
  summary: `
    SELECT
      COUNT(*) AS total_accounts,
      SUM(CASE WHEN is_active = 1 AND password_hash IS NOT NULL AND password_hash <> '' THEN 1 ELSE 0 END) AS migrated_accounts,
      SUM(CASE WHEN is_active = 1 AND (password_hash IS NULL OR password_hash = '') THEN 1 ELSE 0 END) AS pending_accounts
    FROM system_users
    WHERE is_active = 1;
  `,
  pendingBySchool: `
    SELECT
      COALESCE(school, '未分配') AS school,
      COUNT(*) AS pending_accounts
    FROM system_users
    WHERE is_active = 1
      AND (password_hash IS NULL OR password_hash = '')
    GROUP BY COALESCE(school, '未分配')
    ORDER BY pending_accounts DESC, school ASC;
  `,
  pendingByRole: `
    SELECT
      COALESCE(role, 'guest') AS role,
      COUNT(*) AS pending_accounts
    FROM system_users
    WHERE is_active = 1
      AND (password_hash IS NULL OR password_hash = '')
    GROUP BY COALESCE(role, 'guest')
    ORDER BY pending_accounts DESC, role ASC;
  `,
  passwordSources: `
    SELECT
      COALESCE(password_source, 'pending') AS password_source,
      COUNT(*) AS account_count
    FROM system_users
    WHERE is_active = 1
    GROUP BY COALESCE(password_source, 'pending')
    ORDER BY account_count DESC, password_source ASC;
  `,
  pendingParentsByClass: `
    SELECT
      COALESCE(class_name, '未分班') AS class_name,
      COUNT(*) AS pending_parents
    FROM system_users
    WHERE is_active = 1
      AND role = 'parent'
      AND (password_hash IS NULL OR password_hash = '')
    GROUP BY COALESCE(class_name, '未分班')
    ORDER BY pending_parents DESC, class_name ASC;
  `,
  pendingNonParents: `
    SELECT
      username,
      role,
      COALESCE(class_name, '未分配') AS class_name,
      COALESCE(teacher_name, '未填写') AS teacher_name
    FROM system_users
    WHERE is_active = 1
      AND role <> 'parent'
      AND (password_hash IS NULL OR password_hash = '')
    ORDER BY role ASC, class_name ASC, username ASC;
  `,
  pendingLoginBuckets: `
    SELECT
      CASE
        WHEN last_login_at IS NULL OR TRIM(last_login_at) = '' THEN 'never'
        WHEN julianday('now') - julianday(last_login_at) <= 30 THEN 'within_30d'
        WHEN julianday('now') - julianday(last_login_at) <= 90 THEN 'within_90d'
        ELSE 'over_90d'
      END AS login_bucket,
      COUNT(*) AS pending_accounts
    FROM system_users
    WHERE is_active = 1
      AND (password_hash IS NULL OR password_hash = '')
    GROUP BY 1
    ORDER BY pending_accounts DESC;
  `
};

async function runWranglerQuery(sql) {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();
  const args = ['wrangler', 'd1', 'execute', dbName];
  if (useRemote) args.push('--remote');
  args.push('--command', normalizedSql);
  const runner = process.platform === 'win32'
    ? execAsync(`npx wrangler d1 execute "${dbName}" ${useRemote ? '--remote ' : ''}--command "${normalizedSql}"`, {
      cwd: process.cwd(),
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8
    })
    : execFileAsync(npxCommand, args, {
      cwd: process.cwd(),
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8
    });
  const { stdout, stderr } = await runner;
  const combined = `${stdout}\n${stderr}`.trim();
  const jsonStart = combined.indexOf('[');
  if (jsonStart < 0) {
    throw new Error(`Unable to parse wrangler output:\n${combined}`);
  }
  const parsed = JSON.parse(combined.slice(jsonStart));
  return Array.isArray(parsed?.[0]?.results) ? parsed[0].results : [];
}

function formatTable(rows, columns) {
  if (!rows.length) return '(none)';
  const widths = columns.map((column) => {
    const headerWidth = column.label.length;
    const valueWidth = rows.reduce((maxWidth, row) => {
      const text = String(row[column.key] ?? '');
      return Math.max(maxWidth, text.length);
    }, 0);
    return Math.max(headerWidth, valueWidth);
  });

  const formatRow = (row) => columns
    .map((column, index) => String(row[column.key] ?? '').padEnd(widths[index], ' '))
    .join(' | ');

  const header = formatRow(Object.fromEntries(columns.map((column) => [column.key, column.label])));
  const divider = widths.map((width) => '-'.repeat(width)).join('-|-');
  const body = rows.map(formatRow).join('\n');
  return `${header}\n${divider}\n${body}`;
}

async function main() {
  const result = {};
  for (const [key, sql] of Object.entries(queries)) {
    result[key] = await runWranglerQuery(sql);
  }

  const summary = result.summary[0] || {};
  const total = Number(summary.total_accounts || 0);
  const migrated = Number(summary.migrated_accounts || 0);
  const pending = Number(summary.pending_accounts || 0);
  const completionRate = total > 0 ? ((migrated / total) * 100).toFixed(1) : '100.0';

  console.log(`Account migration report (${useRemote ? 'remote' : 'local'})`);
  console.log(`DB: ${dbName}`);
  console.log(`Total active accounts: ${total}`);
  console.log(`Migrated accounts: ${migrated}`);
  console.log(`Pending accounts: ${pending}`);
  console.log(`Completion rate: ${completionRate}%`);
  console.log('');

  console.log('Pending by school');
  console.log(formatTable(result.pendingBySchool, [
    { key: 'school', label: 'school' },
    { key: 'pending_accounts', label: 'pending_accounts' }
  ]));
  console.log('');

  console.log('Pending by role');
  console.log(formatTable(result.pendingByRole, [
    { key: 'role', label: 'role' },
    { key: 'pending_accounts', label: 'pending_accounts' }
  ]));
  console.log('');

  console.log('Password sources');
  console.log(formatTable(result.passwordSources, [
    { key: 'password_source', label: 'password_source' },
    { key: 'account_count', label: 'account_count' }
  ]));
  console.log('');

  console.log('Pending parent accounts by class');
  console.log(formatTable(result.pendingParentsByClass, [
    { key: 'class_name', label: 'class_name' },
    { key: 'pending_parents', label: 'pending_parents' }
  ]));
  console.log('');

  console.log('Pending login buckets');
  console.log(formatTable(result.pendingLoginBuckets, [
    { key: 'login_bucket', label: 'login_bucket' },
    { key: 'pending_accounts', label: 'pending_accounts' }
  ]));
  console.log('');

  console.log('Pending non-parent accounts');
  console.log(formatTable(result.pendingNonParents, [
    { key: 'username', label: 'username' },
    { key: 'role', label: 'role' },
    { key: 'class_name', label: 'class_name' },
    { key: 'teacher_name', label: 'teacher_name' }
  ]));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
