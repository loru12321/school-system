import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const DEFAULT_SOURCE_REST_URL = 'https://okwcciujnfvobbwaydiv.supabase.co';
const DEFAULT_SOURCE_GATEWAY_URL = 'https://okwcciujnfvobbwaydiv.supabase.co/functions/v1/edu-gateway-v2';
const DEFAULT_SOURCE_KEY = 'sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4';
const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_ADMIN_PASS = 'admin123';
const DEFAULT_TARGET_DB = 'school-system-gateway';
const DEFAULT_PAGE_SIZE = 500;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const schemaFiles = [
  path.resolve(workspaceRoot, 'cloudflare', 'd1', '002_gateway_data.sql'),
  path.resolve(workspaceRoot, 'cloudflare', 'd1', '003_gateway_accounts.sql')
];
function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Invalid JSON response (${response.status}): ${text.slice(0, 500)}`);
  }
}

async function fetchJson(url, init = {}, label = 'request') {
  const response = await fetch(url, init);
  const data = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data;
}

async function loginGateway({ gatewayUrl, sourceKey, adminUser, adminPass }) {
  const headers = {
    apikey: sourceKey,
    'Content-Type': 'application/json'
  };
  const payload = {
    action: 'login',
    payload: {
      username: adminUser,
      password: adminPass
    }
  };
  const data = await fetchJson(gatewayUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  }, 'gateway login');
  if (!data?.ok || !data?.token) {
    throw new Error('Gateway login did not return a token');
  }
  return data.token;
}

async function fetchGatewayRecords({ gatewayUrl, sourceKey, token, action, payload = {} }) {
  const headers = {
    apikey: sourceKey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const data = await fetchJson(gatewayUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, payload })
  }, action);
  if (Array.isArray(data?.records)) return data.records;
  return [];
}

async function fetchRestRows({ restUrl, sourceKey, table, pageSize }) {
  const rows = [];
  let offset = 0;

  while (true) {
    const url = `${restUrl}/rest/v1/${table}?select=*&order=created_at.asc&limit=${pageSize}&offset=${offset}`;
    const batch = await fetchJson(url, {
      headers: {
        apikey: sourceKey,
        Authorization: `Bearer ${sourceKey}`,
        Accept: 'application/json'
      }
    }, `${table} fetch`);
    const nextRows = Array.isArray(batch) ? batch : [];
    rows.push(...nextRows);
    if (nextRows.length < pageSize) break;
    offset += nextRows.length;
  }

  return rows;
}

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value, fallback) {
  const nextValue = value === undefined ? fallback : value;
  return sqlValue(JSON.stringify(nextValue));
}

function buildInsertStatements(tableName, columns, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const chunks = [];
  const batchSize = 25;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const valuesSql = batch.map((row) => `(${columns.map((column) => sqlValue(row[column])).join(', ')})`).join(',\n');
    chunks.push(`INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES\n${valuesSql};`);
  }
  return chunks;
}

function normalizeAliasRow(row) {
  return {
    id: String(row?.id || '').trim(),
    rule_type: String(row?.rule_type || '').trim(),
    standard_name: String(row?.standard_name || '').trim(),
    alias_name: String(row?.alias_name || '').trim(),
    scope: String(row?.scope || 'global').trim() || 'global',
    project_key: row?.project_key ?? null,
    cohort_id: row?.cohort_id ?? null,
    school_name: row?.school_name ?? null,
    grade_range: row?.grade_range ?? null,
    priority: Number(row?.priority ?? 100),
    is_active: row?.is_active === false ? 0 : 1,
    remark: row?.remark ?? null,
    created_by: row?.created_by ?? null,
    created_at: row?.created_at || new Date().toISOString(),
    updated_at: row?.updated_at || row?.created_at || new Date().toISOString()
  };
}

function normalizeWarningRow(row) {
  return {
    id: String(row?.id || '').trim(),
    warning_type: String(row?.warning_type || '').trim(),
    warning_code: String(row?.warning_code || '').trim(),
    warning_level: String(row?.warning_level || 'medium').trim() || 'medium',
    project_key: row?.project_key ?? null,
    cohort_id: row?.cohort_id ?? null,
    snapshot_key: row?.snapshot_key ?? null,
    exam_id: row?.exam_id ?? null,
    school_name: row?.school_name ?? null,
    grade_name: row?.grade_name ?? null,
    class_name: row?.class_name ?? null,
    subject_name: row?.subject_name ?? null,
    teacher_name: row?.teacher_name ?? null,
    student_name: row?.student_name ?? null,
    source_module: row?.source_module ?? null,
    metric_name: row?.metric_name ?? null,
    metric_value: row?.metric_value === null || row?.metric_value === undefined ? null : Number(row.metric_value),
    threshold_value: row?.threshold_value === null || row?.threshold_value === undefined ? null : Number(row.threshold_value),
    description: row?.description ?? null,
    status: String(row?.status || 'open').trim() || 'open',
    created_at: row?.created_at || new Date().toISOString(),
    updated_at: row?.updated_at || row?.created_at || new Date().toISOString()
  };
}

function normalizeRectifyRow(row) {
  return {
    id: String(row?.id || '').trim(),
    source_warning_id: row?.source_warning_id ?? null,
    task_type: String(row?.task_type || '').trim(),
    title: String(row?.title || '').trim(),
    project_key: row?.project_key ?? null,
    cohort_id: row?.cohort_id ?? null,
    exam_id: row?.exam_id ?? null,
    school_name: row?.school_name ?? null,
    grade_name: row?.grade_name ?? null,
    class_name: row?.class_name ?? null,
    subject_name: row?.subject_name ?? null,
    teacher_name: row?.teacher_name ?? null,
    student_name: row?.student_name ?? null,
    problem_desc: row?.problem_desc ?? null,
    action_plan: row?.action_plan ?? null,
    owner_name: row?.owner_name ?? null,
    assist_users_json: JSON.stringify(Array.isArray(row?.assist_users) ? row.assist_users : []),
    due_date: row?.due_date ?? null,
    priority: String(row?.priority || 'medium').trim() || 'medium',
    status: String(row?.status || 'todo').trim() || 'todo',
    progress: Number(row?.progress ?? 0),
    review_result: row?.review_result ?? null,
    created_by: row?.created_by ?? null,
    created_at: row?.created_at || new Date().toISOString(),
    updated_at: row?.updated_at || row?.created_at || new Date().toISOString()
  };
}

function normalizeVersionRow(row) {
  return {
    id: String(row?.id || '').trim(),
    version_name: String(row?.version_name || '').trim(),
    project_key: String(row?.project_key || '').trim(),
    cohort_id: String(row?.cohort_id || '').trim(),
    snapshot_key: row?.snapshot_key ?? null,
    exam_scope: row?.exam_scope ?? null,
    score_hash: row?.score_hash ?? null,
    teacher_hash: row?.teacher_hash ?? null,
    target_hash: row?.target_hash ?? null,
    alias_hash: row?.alias_hash ?? null,
    config_hash: row?.config_hash ?? null,
    summary_json: JSON.stringify(row?.summary_json && typeof row.summary_json === 'object' ? row.summary_json : {}),
    is_stable: row?.is_stable ? 1 : 0,
    created_by: row?.created_by ?? null,
    created_at: row?.created_at || new Date().toISOString()
  };
}

function normalizeIssueRow(row) {
  return {
    id: Number(row?.id),
    student_name: String(row?.student_name || '').trim(),
    student_class: String(row?.student_class || '').trim(),
    school: String(row?.school || '').trim(),
    issue_type: String(row?.issue_type || '').trim(),
    description: String(row?.description || '').trim(),
    contact_info: row?.contact_info ?? null,
    status: String(row?.status || 'pending').trim() || 'pending',
    created_at: row?.created_at || new Date().toISOString()
  };
}

function normalizeLogRow(row) {
  return {
    id: Number(row?.id),
    operator: row?.operator ?? null,
    action: String(row?.action || '').trim(),
    details: row?.details ?? null,
    status: String(row?.status || 'normal').trim() || 'normal',
    created_at: row?.created_at || new Date().toISOString()
  };
}

function normalizeAccountStagingRow(row, importedAt) {
  const roles = Array.isArray(row?.roles) ? row.roles : [row?.role].filter(Boolean);
  return {
    username: String(row?.username || '').trim(),
    role: String(row?.role || 'guest').trim() || 'guest',
    roles_json: JSON.stringify(roles),
    school: row?.school ?? null,
    class_name: row?.class_name ?? null,
    teacher_name: row?.teacher_name ?? null,
    has_password: row?.has_password ? 1 : 0,
    password_display: row?.password_display ?? null,
    imported_at: importedAt
  };
}

function normalizeSystemUserRow(row, importedAt) {
  const roles = Array.isArray(row?.roles) ? row.roles : [row?.role].filter(Boolean);
  return {
    username: String(row?.username || '').trim(),
    role: String(row?.role || 'guest').trim() || 'guest',
    roles_json: JSON.stringify(roles),
    school: row?.school ?? null,
    class_name: row?.class_name ?? null,
    teacher_name: row?.teacher_name ?? row?.username ?? null,
    password_hash: null,
    password_scheme: '',
    password_source: row?.has_password ? 'supabase_export' : '',
    has_password: row?.has_password ? 1 : 0,
    password_display: row?.password_display ?? null,
    is_active: 1,
    last_login_at: null,
    created_at: importedAt,
    updated_at: importedAt
  };
}

async function runWranglerD1(args, cwd) {
  const { stdout, stderr } = await execFileAsync('cmd.exe', ['/c', 'npx', 'wrangler', 'd1', ...args], {
    cwd,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 32
  });
  return `${stdout || ''}${stderr || ''}`.trim();
}

async function runWranglerD1Commands(targetDb, statements) {
  for (const statement of statements) {
    const sql = String(statement || '').replace(/\s+/g, ' ').trim();
    if (!sql) continue;
    await runWranglerD1(['execute', targetDb, '--remote', '--command', sql], workspaceRoot);
  }
}

async function ensureSchema(targetDb) {
  for (const schemaFile of schemaFiles) {
    const statements = (await import('node:fs/promises')).readFile(schemaFile, 'utf8').then((content) =>
      content
        .split(/;\s*(?:\r?\n|$)/)
        .map((statement) => statement.trim())
        .filter(Boolean)
        .map((statement) => `${statement};`)
    );
    await runWranglerD1Commands(targetDb, await statements);
  }
}

async function importIntoD1(targetDb, datasets) {
  const importedAt = new Date().toISOString();
  const sqlParts = [
    'DELETE FROM issues;',
    'DELETE FROM system_logs;',
    'DELETE FROM config_alias_rules;',
    'DELETE FROM warning_records;',
    'DELETE FROM rectify_tasks;',
    'DELETE FROM snapshot_versions;',
    'DELETE FROM system_users;',
    'DELETE FROM system_users_staging;'
  ];

  sqlParts.push(
    ...buildInsertStatements('issues', ['id', 'student_name', 'student_class', 'school', 'issue_type', 'description', 'contact_info', 'status', 'created_at'], datasets.issues.map(normalizeIssueRow)),
    ...buildInsertStatements('system_logs', ['id', 'operator', 'action', 'details', 'status', 'created_at'], datasets.system_logs.map(normalizeLogRow)),
    ...buildInsertStatements('config_alias_rules', ['id', 'rule_type', 'standard_name', 'alias_name', 'scope', 'project_key', 'cohort_id', 'school_name', 'grade_range', 'priority', 'is_active', 'remark', 'created_by', 'created_at', 'updated_at'], datasets.aliases.map(normalizeAliasRow)),
    ...buildInsertStatements('warning_records', ['id', 'warning_type', 'warning_code', 'warning_level', 'project_key', 'cohort_id', 'snapshot_key', 'exam_id', 'school_name', 'grade_name', 'class_name', 'subject_name', 'teacher_name', 'student_name', 'source_module', 'metric_name', 'metric_value', 'threshold_value', 'description', 'status', 'created_at', 'updated_at'], datasets.warnings.map(normalizeWarningRow)),
    ...buildInsertStatements('rectify_tasks', ['id', 'source_warning_id', 'task_type', 'title', 'project_key', 'cohort_id', 'exam_id', 'school_name', 'grade_name', 'class_name', 'subject_name', 'teacher_name', 'student_name', 'problem_desc', 'action_plan', 'owner_name', 'assist_users_json', 'due_date', 'priority', 'status', 'progress', 'review_result', 'created_by', 'created_at', 'updated_at'], datasets.rectify_tasks.map(normalizeRectifyRow)),
    ...buildInsertStatements('snapshot_versions', ['id', 'version_name', 'project_key', 'cohort_id', 'snapshot_key', 'exam_scope', 'score_hash', 'teacher_hash', 'target_hash', 'alias_hash', 'config_hash', 'summary_json', 'is_stable', 'created_by', 'created_at'], datasets.snapshot_versions.map(normalizeVersionRow)),
    ...buildInsertStatements('system_users', ['username', 'role', 'roles_json', 'school', 'class_name', 'teacher_name', 'password_hash', 'password_scheme', 'password_source', 'has_password', 'password_display', 'is_active', 'last_login_at', 'created_at', 'updated_at'], datasets.accounts.map((row) => normalizeSystemUserRow(row, importedAt))),
    ...buildInsertStatements('system_users_staging', ['username', 'role', 'roles_json', 'school', 'class_name', 'teacher_name', 'has_password', 'password_display', 'imported_at'], datasets.accounts.map((row) => normalizeAccountStagingRow(row, importedAt)))
  );

  const summaryRows = [
    { dataset_name: 'issues', row_count: datasets.issues.length },
    { dataset_name: 'system_logs', row_count: datasets.system_logs.length },
    { dataset_name: 'config_alias_rules', row_count: datasets.aliases.length },
    { dataset_name: 'warning_records', row_count: datasets.warnings.length },
    { dataset_name: 'rectify_tasks', row_count: datasets.rectify_tasks.length },
    { dataset_name: 'snapshot_versions', row_count: datasets.snapshot_versions.length },
    { dataset_name: 'system_users', row_count: datasets.accounts.length },
    { dataset_name: 'system_users_staging', row_count: datasets.accounts.length }
  ];
  const detailJson = JSON.stringify({
    imported_at: importedAt,
    source_rest_url: datasets.source_rest_url,
    source_gateway_url: datasets.source_gateway_url
  });
  sqlParts.push(
    ...summaryRows.map((row) => `INSERT INTO migration_runs (source_name, dataset_name, row_count, detail_json) VALUES (${sqlValue('supabase')}, ${sqlValue(row.dataset_name)}, ${sqlValue(row.row_count)}, ${sqlValue(detailJson)});`)
  );

  await runWranglerD1Commands(targetDb, sqlParts);
}

async function readD1Counts(targetDb) {
  const tables = [
    'issues',
    'system_logs',
    'config_alias_rules',
    'warning_records',
    'rectify_tasks',
    'snapshot_versions',
    'system_users',
    'system_users_staging'
  ];
  const results = [];
  for (const tableName of tables) {
    const output = await runWranglerD1([
      'execute',
      targetDb,
      '--remote',
      '--command',
      `SELECT COUNT(*) AS row_count FROM ${tableName};`
    ], workspaceRoot);
    results.push(`${tableName}: ${output}`);
  }
  return results.join('\n\n');
}

async function main() {
  const restUrl = normalizeBaseUrl(process.env.SOURCE_REST_URL || DEFAULT_SOURCE_REST_URL);
  const gatewayUrl = normalizeBaseUrl(process.env.SOURCE_GATEWAY_URL || DEFAULT_SOURCE_GATEWAY_URL);
  const sourceKey = String(process.env.SOURCE_SUPABASE_KEY || DEFAULT_SOURCE_KEY).trim();
  const adminUser = String(process.env.MIGRATION_ADMIN_USER || DEFAULT_ADMIN_USER).trim();
  const adminPass = String(process.env.MIGRATION_ADMIN_PASS || DEFAULT_ADMIN_PASS).trim();
  const targetDb = String(process.env.TARGET_GATEWAY_DB || DEFAULT_TARGET_DB).trim();
  const pageSize = toPositiveInt(process.env.MIGRATION_PAGE_SIZE || DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);

  if (!restUrl || !gatewayUrl || !sourceKey || !adminUser || !adminPass || !targetDb) {
    throw new Error('SOURCE_REST_URL, SOURCE_GATEWAY_URL, SOURCE_SUPABASE_KEY, MIGRATION_ADMIN_USER, MIGRATION_ADMIN_PASS, TARGET_GATEWAY_DB are required');
  }

  console.log(`Using source REST: ${restUrl}`);
  console.log(`Using source gateway: ${gatewayUrl}`);
  console.log(`Using target D1: ${targetDb}`);

  await ensureSchema(targetDb);
  const token = await loginGateway({ gatewayUrl, sourceKey, adminUser, adminPass });

  const [issues, systemLogs, aliases, warnings, rectifyTasks, snapshotVersions, accounts] = await Promise.all([
    fetchRestRows({ restUrl, sourceKey, table: 'issues', pageSize }),
    fetchRestRows({ restUrl, sourceKey, table: 'system_logs', pageSize }),
    fetchGatewayRecords({ gatewayUrl, sourceKey, token, action: 'alias.list', payload: { limit: 10000 } }),
    fetchGatewayRecords({ gatewayUrl, sourceKey, token, action: 'warning.list', payload: { limit: 10000 } }),
    fetchGatewayRecords({ gatewayUrl, sourceKey, token, action: 'rectify.list', payload: { limit: 10000 } }),
    fetchGatewayRecords({ gatewayUrl, sourceKey, token, action: 'version.list', payload: { limit: 10000 } }),
    fetchGatewayRecords({ gatewayUrl, sourceKey, token, action: 'account.export', payload: { limit: 10000 } })
  ]);

  const datasets = {
    source_rest_url: restUrl,
    source_gateway_url: gatewayUrl,
    issues,
    system_logs: systemLogs,
    aliases,
    warnings,
    rectify_tasks: rectifyTasks,
    snapshot_versions: snapshotVersions,
    accounts
  };

  console.log(`Fetched issues=${issues.length}, system_logs=${systemLogs.length}, aliases=${aliases.length}, warnings=${warnings.length}, rectify_tasks=${rectifyTasks.length}, snapshot_versions=${snapshotVersions.length}, accounts=${accounts.length}`);

  await importIntoD1(targetDb, datasets);
  const counts = await readD1Counts(targetDb);
  console.log('D1 counts:');
  console.log(counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
