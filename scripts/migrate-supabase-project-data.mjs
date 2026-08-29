import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, execFile } from 'node:child_process';
import { promisify } from 'node:util';

const DEFAULT_SOURCE_REST_URL = 'https://okwcciujnfvobbwaydiv.supabase.co';
const DEFAULT_SOURCE_GATEWAY_URL = 'https://okwcciujnfvobbwaydiv.supabase.co/functions/v1/edu-gateway-v2';
const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_TARGET_PROJECT_REF = '';
const DEFAULT_PAGE_SIZE = 500;
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_CLOUDFLARE_D1_DB = 'school-system-gateway';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const schemaFiles = [
  path.resolve(workspaceRoot, 'supabase', 'sql', '000_app_tables_bootstrap.sql'),
  path.resolve(workspaceRoot, 'supabase', 'sql', '001_management_tables.sql'),
  path.resolve(workspaceRoot, 'supabase', 'sql', '002_management_rls_minimal.sql'),
  path.resolve(workspaceRoot, 'supabase', 'sql', '003_system_users_password_hardening.sql'),
  path.resolve(workspaceRoot, 'supabase', 'sql', '009_lockdown_legacy_public_tables.sql')
];

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function requireSecretEnv(name) {
  const value = normalizeText(process.env[name]);
  if (!value) {
    throw new Error(`${name} is required; refusing to use a shared default password`);
  }
  return value;
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
  } catch {
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

function sourceRestHeaders(sourceKey) {
  return {
    apikey: sourceKey,
    Accept: 'application/json'
  };
}

function targetRestHeaders(targetKey) {
  return {
    apikey: targetKey,
    Authorization: `Bearer ${targetKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation'
  };
}

async function loginGateway({ gatewayUrl, sourceKey, adminUser, adminPass }) {
  const data = await fetchJson(gatewayUrl, {
    method: 'POST',
    headers: {
      apikey: sourceKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'login',
      payload: {
        username: adminUser,
        password: adminPass
      }
    })
  }, 'gateway login');

  if (!data?.ok || !data?.token) {
    throw new Error('Gateway login did not return a token');
  }
  return data.token;
}

async function fetchGatewayRecords({ gatewayUrl, sourceKey, token, action, payload = {} }) {
  const data = await fetchJson(gatewayUrl, {
    method: 'POST',
    headers: {
      apikey: sourceKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action, payload })
  }, action);
  return Array.isArray(data?.records) ? data.records : [];
}

async function fetchRestRows({ restUrl, sourceKey, table, pageSize, select = '*', order = 'created_at.asc' }) {
  const rows = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${restUrl}/rest/v1/${table}`);
    url.searchParams.set('select', select);
    if (order) url.searchParams.set('order', order);
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));

    const batch = await fetchJson(url.toString(), {
      headers: sourceRestHeaders(sourceKey)
    }, `${table} fetch`);

    const nextRows = Array.isArray(batch) ? batch : [];
    rows.push(...nextRows);
    if (nextRows.length < pageSize) break;
    offset += nextRows.length;
  }

  return rows;
}

async function fetchOptionalRestRows(options) {
  try {
    const rows = await fetchRestRows(options);
    return { rows, error: null };
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runWranglerD1Query({ dbName, sql, useRemote }) {
  const normalizedSql = String(sql || '').replace(/\s+/g, ' ').trim();
  if (!normalizedSql) return [];

  if (process.platform === 'win32') {
    const remoteFlag = useRemote ? '--remote ' : '';
    const escapedDbName = String(dbName || DEFAULT_CLOUDFLARE_D1_DB).replace(/"/g, '""');
    const escapedSql = normalizedSql.replace(/"/g, '\\"');
    const { stdout, stderr } = await execAsync(
      `npx wrangler d1 execute "${escapedDbName}" ${remoteFlag}--command "${escapedSql}" --json`,
      {
        cwd: workspaceRoot,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 16
      }
    );
    const combined = `${stdout}\n${stderr}`.trim();
    const jsonStart = combined.indexOf('[');
    if (jsonStart < 0) {
      throw new Error(`Unable to parse wrangler D1 output: ${combined.slice(0, 1000)}`);
    }
    const parsed = JSON.parse(combined.slice(jsonStart));
    return Array.isArray(parsed?.[0]?.results) ? parsed[0].results : [];
  }

  const args = ['wrangler', 'd1', 'execute', String(dbName || DEFAULT_CLOUDFLARE_D1_DB)];
  if (useRemote) args.push('--remote');
  args.push('--command', normalizedSql, '--json');
  const { stdout, stderr } = await execFileAsync(npxCommand, args, {
    cwd: workspaceRoot,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 16
  });
  const combined = `${stdout}\n${stderr}`.trim();
  const jsonStart = combined.indexOf('[');
  if (jsonStart < 0) {
    throw new Error(`Unable to parse wrangler D1 output: ${combined.slice(0, 1000)}`);
  }
  const parsed = JSON.parse(combined.slice(jsonStart));
  return Array.isArray(parsed?.[0]?.results) ? parsed[0].results : [];
}

async function fetchCloudflareD1Accounts({ dbName, useRemote }) {
  const rows = await runWranglerD1Query({
    dbName,
    useRemote,
    sql: `
      SELECT
        username,
        role,
        roles_json,
        school,
        class_name,
        teacher_name,
        password_hash,
        password_scheme,
        password_source,
        has_password,
        is_active,
        last_login_at,
        created_at,
        updated_at
      FROM system_users
      WHERE is_active = 1
      ORDER BY username ASC
    `
  });
  return Array.isArray(rows) ? rows : [];
}

async function runManagementQuery({ managementToken, projectRef, query }) {
  return fetchJson(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${managementToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  }, 'management database query');
}

async function applySqlFile({ managementToken, projectRef, sqlFile }) {
  const sql = await fs.readFile(sqlFile, 'utf8');
  await runManagementQuery({ managementToken, projectRef, query: sql });
}

async function fetchTargetKeys({ managementToken, projectRef }) {
  const data = await fetchJson(`https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`, {
    headers: {
      Authorization: `Bearer ${managementToken}`
    }
  }, 'target api keys');

  const rows = Array.isArray(data?.value) ? data.value : Array.isArray(data) ? data : [];
  const byName = Object.fromEntries(rows.map((row) => [String(row?.name || row?.id || '').trim(), row]));
  const serviceRole = byName.service_role?.api_key || '';
  const publishable = rows.find((row) => row?.type === 'publishable')?.api_key || byName.anon?.api_key || '';

  if (!serviceRole || !publishable) {
    throw new Error('Failed to resolve target Supabase API keys');
  }

  return { serviceRole, publishable };
}

function sliceIntoBatches(rows, batchSize) {
  const batches = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    batches.push(rows.slice(index, index + batchSize));
  }
  return batches;
}

async function replaceTableRows({ targetBaseUrl, targetKey, table, rows, batchSize }) {
  if (!rows.length) return;

  const endpoint = `${targetBaseUrl}/rest/v1/${table}`;
  for (const batch of sliceIntoBatches(rows, batchSize)) {
    await fetchJson(endpoint, {
      method: 'POST',
      headers: targetRestHeaders(targetKey),
      body: JSON.stringify(batch)
    }, `${table} import`);
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeRoles(row) {
  const role = normalizeText(row?.role) || 'guest';
  const rolesRaw = Array.isArray(row?.roles)
    ? row.roles
    : Array.isArray(row?.roles_json)
      ? row.roles_json
      : [];
  const roles = rolesRaw.map((item) => normalizeText(item)).filter(Boolean);
  return Array.from(new Set([role, ...roles]));
}

function normalizeSystemDataRow(row) {
  return {
    key: normalizeText(row?.key),
    content: typeof row?.content === 'string' ? row.content : '',
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: normalizeText(row?.updated_at) || normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function normalizeIssueRow(row) {
  return {
    id: Number(row?.id),
    student_name: normalizeText(row?.student_name),
    student_class: normalizeText(row?.student_class),
    school: normalizeText(row?.school),
    issue_type: normalizeText(row?.issue_type),
    description: normalizeText(row?.description),
    contact_info: row?.contact_info ?? null,
    status: normalizeText(row?.status) || 'pending',
    created_at: normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function normalizeLogRow(row) {
  return {
    id: Number(row?.id),
    operator: row?.operator ?? null,
    action: normalizeText(row?.action),
    details: row?.details ?? null,
    status: normalizeText(row?.status) || 'normal',
    created_at: normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function normalizeAliasRow(row) {
  return {
    id: normalizeText(row?.id),
    rule_type: normalizeText(row?.rule_type),
    standard_name: normalizeText(row?.standard_name),
    alias_name: normalizeText(row?.alias_name),
    scope: normalizeText(row?.scope) || 'global',
    project_key: row?.project_key ?? null,
    cohort_id: row?.cohort_id ?? null,
    school_name: row?.school_name ?? null,
    grade_range: row?.grade_range ?? null,
    priority: Number(row?.priority ?? 100),
    is_active: row?.is_active !== false,
    remark: row?.remark ?? null,
    created_by: row?.created_by ?? null,
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: normalizeText(row?.updated_at) || normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function normalizeWarningRow(row) {
  return {
    id: normalizeText(row?.id),
    warning_type: normalizeText(row?.warning_type),
    warning_code: normalizeText(row?.warning_code),
    warning_level: normalizeText(row?.warning_level) || 'medium',
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
    status: normalizeText(row?.status) || 'open',
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: normalizeText(row?.updated_at) || normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function normalizeRectifyTaskRow(row) {
  return {
    id: normalizeText(row?.id),
    source_warning_id: row?.source_warning_id ?? null,
    task_type: normalizeText(row?.task_type),
    title: normalizeText(row?.title),
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
    assist_users: Array.isArray(row?.assist_users) ? row.assist_users : [],
    due_date: row?.due_date ?? null,
    priority: normalizeText(row?.priority) || 'medium',
    status: normalizeText(row?.status) || 'todo',
    progress: Number(row?.progress ?? 0),
    review_result: row?.review_result ?? null,
    created_by: row?.created_by ?? null,
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: normalizeText(row?.updated_at) || normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function normalizeSnapshotVersionRow(row) {
  return {
    id: normalizeText(row?.id),
    version_name: normalizeText(row?.version_name),
    project_key: normalizeText(row?.project_key),
    cohort_id: normalizeText(row?.cohort_id),
    snapshot_key: row?.snapshot_key ?? null,
    exam_scope: row?.exam_scope ?? null,
    score_hash: row?.score_hash ?? null,
    teacher_hash: row?.teacher_hash ?? null,
    target_hash: row?.target_hash ?? null,
    alias_hash: row?.alias_hash ?? null,
    config_hash: row?.config_hash ?? null,
    summary_json: row?.summary_json && typeof row.summary_json === 'object' ? row.summary_json : {},
    is_stable: Boolean(row?.is_stable),
    created_by: row?.created_by ?? null,
    created_at: normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function normalizeFullAccountRow(row) {
  const roles = normalizeRoles(row);
  const password = normalizeText(row?.password) || null;
  const passwordHash = normalizeText(row?.password_hash) || null;
  const hasPassword = Boolean(password || passwordHash);
  return {
    username: normalizeText(row?.username),
    role: normalizeText(row?.role) || 'guest',
    roles,
    school: row?.school ?? null,
    class_name: row?.class_name ?? null,
    teacher_name: row?.teacher_name ?? null,
    password,
    password_hash: passwordHash,
    password_scheme: passwordHash ? 'bcrypt' : '',
    password_source: hasPassword ? 'supabase_full_export' : '',
    has_password: hasPassword,
    is_active: row?.is_active !== false,
    last_login_at: row?.last_login_at ?? null,
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: normalizeText(row?.updated_at) || normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function normalizeMetadataAccountRow(row) {
  const roles = normalizeRoles(row);
  const hasPassword = Boolean(row?.has_password);
  return {
    username: normalizeText(row?.username),
    role: normalizeText(row?.role) || 'guest',
    roles,
    school: row?.school ?? null,
    class_name: row?.class_name ?? null,
    teacher_name: row?.teacher_name ?? null,
    password: null,
    password_hash: null,
    password_scheme: '',
    password_source: hasPassword ? 'supabase_metadata_only' : '',
    has_password: hasPassword,
    is_active: true,
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function normalizeCloudflareD1AccountRow(row) {
  const roles = normalizeRoles({
    role: row?.role,
    roles_json: normalizeText(row?.roles_json)
      ? safeJsonParseMaybeArray(row.roles_json)
      : []
  });
  const passwordHash = normalizeText(row?.password_hash) || null;
  const hasPassword = passwordHash
    ? true
    : Boolean(Number(row?.has_password || 0));
  return {
    username: normalizeText(row?.username),
    role: normalizeText(row?.role) || 'guest',
    roles,
    school: row?.school ?? null,
    class_name: row?.class_name ?? null,
    teacher_name: row?.teacher_name ?? null,
    password: null,
    password_hash: passwordHash,
    password_scheme: normalizeText(row?.password_scheme) || (passwordHash ? 'pbkdf2-sha256' : ''),
    password_source: normalizeText(row?.password_source) || (hasPassword ? 'cloudflare_d1' : ''),
    has_password: hasPassword,
    is_active: row?.is_active !== false && Number(row?.is_active ?? 1) !== 0,
    last_login_at: row?.last_login_at ?? null,
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: normalizeText(row?.updated_at) || normalizeText(row?.created_at) || new Date().toISOString()
  };
}

function safeJsonParseMaybeArray(value) {
  try {
    const parsed = JSON.parse(String(value || ''));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeStagingAccountRow(row) {
  return {
    username: row.username,
    role: row.role,
    roles: row.roles,
    school: row.school,
    class_name: row.class_name,
    teacher_name: row.teacher_name,
    has_password: row.has_password,
    imported_at: new Date().toISOString()
  };
}

async function writeMigrationRun({ managementToken, projectRef, datasetName, rowCount, detailJson }) {
  const detailSql = JSON.stringify(detailJson).replace(/'/g, "''");
  const datasetSql = String(datasetName).replace(/'/g, "''");
  await runManagementQuery({
    managementToken,
    projectRef,
    query: `insert into public.migration_runs (source_name, dataset_name, row_count, detail_json) values ('supabase', '${datasetSql}', ${Number(rowCount || 0)}, '${detailSql}'::jsonb);`
  });
}

async function readTargetCounts({ managementToken, projectRef, tables }) {
  const sql = tables
    .map((tableName) => `select '${tableName}' as table_name, count(*)::bigint as row_count from public.${tableName}`)
    .join(' union all ');
  const data = await runManagementQuery({ managementToken, projectRef, query: sql });
  return Array.isArray(data?.value) ? data.value : [];
}

async function main() {
  const sourceRestUrl = normalizeBaseUrl(process.env.SOURCE_REST_URL || DEFAULT_SOURCE_REST_URL);
  const sourceGatewayUrl = normalizeBaseUrl(process.env.SOURCE_GATEWAY_URL || DEFAULT_SOURCE_GATEWAY_URL);
  const sourceKey = normalizeText(process.env.SOURCE_SUPABASE_KEY);
  const adminUser = normalizeText(process.env.MIGRATION_ADMIN_USER || DEFAULT_ADMIN_USER);
  const adminPass = requireSecretEnv('MIGRATION_ADMIN_PASS');
  const managementToken = normalizeText(process.env.SUPABASE_MANAGEMENT_TOKEN);
  const projectRef = normalizeText(process.env.TARGET_PROJECT_REF || DEFAULT_TARGET_PROJECT_REF);
  const pageSize = toPositiveInt(process.env.MIGRATION_PAGE_SIZE || DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const batchSize = toPositiveInt(process.env.MIGRATION_BATCH_SIZE || DEFAULT_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const cloudflareD1DbName = normalizeText(process.env.CLOUDFLARE_D1_DB_NAME || DEFAULT_CLOUDFLARE_D1_DB);
  const useCloudflareD1Accounts = normalizeText(process.env.MIGRATION_USE_CLOUDFLARE_D1_ACCOUNTS || '1') !== '0';
  const cloudflareD1UseRemote = normalizeText(process.env.CLOUDFLARE_D1_REMOTE || '1') !== '0';

  if (!managementToken || !projectRef) {
    throw new Error('SUPABASE_MANAGEMENT_TOKEN and TARGET_PROJECT_REF are required');
  }

  const targetBaseUrl = normalizeBaseUrl(process.env.TARGET_SUPABASE_URL || `https://${projectRef}.supabase.co`);
  const targetKeys = await fetchTargetKeys({ managementToken, projectRef });
  const targetRestKey = targetKeys.serviceRole;

  console.log(`[migrate] target project ${projectRef}`);
  console.log('[migrate] applying schema');
  for (const sqlFile of schemaFiles) {
    console.log(`[migrate] apply ${path.basename(sqlFile)}`);
    await applySqlFile({ managementToken, projectRef, sqlFile });
  }

  console.log('[migrate] logging into source gateway');
  const gatewayToken = await loginGateway({
    gatewayUrl: sourceGatewayUrl,
    sourceKey,
    adminUser,
    adminPass
  });

  console.log('[migrate] fetching source datasets');
  const [systemData, issues, systemLogs, aliases, warnings, rectifyTasks, snapshotVersions, fullAccounts, importMappingRules, importLogs, rectifyLogs, auditLogs] = await Promise.all([
    fetchRestRows({ restUrl: sourceRestUrl, sourceKey, table: 'system_data', pageSize, select: 'key,content,created_at,updated_at', order: 'updated_at.asc' }),
    fetchRestRows({ restUrl: sourceRestUrl, sourceKey, table: 'issues', pageSize, select: 'id,student_name,student_class,school,issue_type,description,contact_info,status,created_at', order: 'id.asc' }),
    fetchRestRows({ restUrl: sourceRestUrl, sourceKey, table: 'system_logs', pageSize, select: 'id,operator,action,details,status,created_at', order: 'id.asc' }),
    fetchGatewayRecords({ gatewayUrl: sourceGatewayUrl, sourceKey, token: gatewayToken, action: 'alias.list', payload: { limit: 10000 } }),
    fetchGatewayRecords({ gatewayUrl: sourceGatewayUrl, sourceKey, token: gatewayToken, action: 'warning.list', payload: { limit: 10000 } }),
    fetchGatewayRecords({ gatewayUrl: sourceGatewayUrl, sourceKey, token: gatewayToken, action: 'rectify.list', payload: { limit: 10000 } }),
    fetchGatewayRecords({ gatewayUrl: sourceGatewayUrl, sourceKey, token: gatewayToken, action: 'version.list', payload: { limit: 10000 } }),
    fetchOptionalRestRows({ restUrl: sourceRestUrl, sourceKey, table: 'system_users', pageSize, select: 'username,role,roles,school,class_name,teacher_name,password,password_hash,is_active,last_login_at,created_at,updated_at', order: 'username.asc' }),
    fetchOptionalRestRows({ restUrl: sourceRestUrl, sourceKey, table: 'import_mapping_rules', pageSize, order: 'created_at.asc' }),
    fetchOptionalRestRows({ restUrl: sourceRestUrl, sourceKey, table: 'import_logs', pageSize, order: 'created_at.asc' }),
    fetchOptionalRestRows({ restUrl: sourceRestUrl, sourceKey, table: 'rectify_logs', pageSize, order: 'created_at.asc' }),
    fetchOptionalRestRows({ restUrl: sourceRestUrl, sourceKey, table: 'audit_logs', pageSize, order: 'created_at.asc' })
  ]);

  let accountMode = 'full_export';
  let accounts = fullAccounts.rows.map(normalizeFullAccountRow).filter((row) => row.username);
  let accountWarning = fullAccounts.error;

  if (!accounts.length) {
    if (useCloudflareD1Accounts) {
      try {
        console.log(`[migrate] full system_users export unavailable, falling back to Cloudflare D1 (${cloudflareD1DbName})`);
        const d1Accounts = await fetchCloudflareD1Accounts({
          dbName: cloudflareD1DbName,
          useRemote: cloudflareD1UseRemote
        });
        accounts = d1Accounts.map(normalizeCloudflareD1AccountRow).filter((row) => row.username);
        accountMode = 'cloudflare_d1';
      } catch (error) {
        const nextWarning = error instanceof Error ? error.message : String(error);
        accountWarning = accountWarning
          ? `${accountWarning}; cloudflare_d1: ${nextWarning}`
          : `cloudflare_d1: ${nextWarning}`;
      }
    }

    if (!accounts.length) {
      console.log('[migrate] Cloudflare D1 account export unavailable, falling back to account metadata');
      const accountMetadata = await fetchGatewayRecords({
        gatewayUrl: sourceGatewayUrl,
        sourceKey,
        token: gatewayToken,
        action: 'account.export',
        payload: { limit: 10000 }
      });
      accounts = accountMetadata.map(normalizeMetadataAccountRow).filter((row) => row.username);
      accountMode = 'metadata_only';
    }
  }

  console.log(`[migrate] fetched system_data=${systemData.length}, issues=${issues.length}, system_logs=${systemLogs.length}, aliases=${aliases.length}, warnings=${warnings.length}, rectify_tasks=${rectifyTasks.length}, snapshot_versions=${snapshotVersions.length}, accounts=${accounts.length}`);

  const datasets = {
    system_data: systemData.map(normalizeSystemDataRow).filter((row) => row.key),
    issues: issues.map(normalizeIssueRow).filter((row) => Number.isFinite(row.id)),
    system_logs: systemLogs.map(normalizeLogRow).filter((row) => Number.isFinite(row.id)),
    config_alias_rules: aliases.map(normalizeAliasRow).filter((row) => row.id),
    warning_records: warnings.map(normalizeWarningRow).filter((row) => row.id),
    rectify_tasks: rectifyTasks.map(normalizeRectifyTaskRow).filter((row) => row.id),
    snapshot_versions: snapshotVersions.map(normalizeSnapshotVersionRow).filter((row) => row.id),
    system_users: accounts,
    system_users_staging: accounts.map(normalizeStagingAccountRow),
    import_mapping_rules: importMappingRules.rows,
    import_logs: importLogs.rows,
    rectify_logs: rectifyLogs.rows,
    audit_logs: auditLogs.rows
  };

  const tableOrder = [
    'system_data',
    'issues',
    'system_logs',
    'config_alias_rules',
    'warning_records',
    'rectify_tasks',
    'snapshot_versions',
    'system_users',
    'system_users_staging',
    'import_mapping_rules',
    'import_logs',
    'rectify_logs',
    'audit_logs'
  ];

  await runManagementQuery({
    managementToken,
    projectRef,
    query: `
      TRUNCATE TABLE
        public.rectify_logs,
        public.rectify_tasks,
        public.warning_records,
        public.snapshot_versions,
        public.import_logs,
        public.import_mapping_rules,
        public.audit_logs,
        public.config_alias_rules,
        public.system_users_staging,
        public.system_users,
        public.issues,
        public.system_logs,
        public.system_data
      RESTART IDENTITY CASCADE;
      DELETE FROM public.migration_runs;
    `
  });

  console.log('[migrate] importing target datasets');
  for (const tableName of tableOrder) {
    console.log(`[migrate] import ${tableName} (${datasets[tableName].length})`);
    await replaceTableRows({
      targetBaseUrl,
      targetKey: targetRestKey,
      table: tableName,
      rows: datasets[tableName],
      batchSize
    });
  }

  const detailJson = {
    source_rest_url: sourceRestUrl,
    source_gateway_url: sourceGatewayUrl,
    target_project_ref: projectRef,
    account_mode: accountMode,
    warnings: {
      system_users_full_export: accountWarning || null,
      import_mapping_rules: importMappingRules.error,
      import_logs: importLogs.error,
      rectify_logs: rectifyLogs.error,
      audit_logs: auditLogs.error
    }
  };

  for (const tableName of tableOrder) {
    await writeMigrationRun({
      managementToken,
      projectRef,
      datasetName: tableName,
      rowCount: datasets[tableName].length,
      detailJson
    });
  }

  const counts = await readTargetCounts({
    managementToken,
    projectRef,
    tables: tableOrder
  });

  console.log('[migrate] done');
  console.log(JSON.stringify({
    ok: true,
    target_project_ref: projectRef,
    account_mode: accountMode,
    source_warnings: detailJson.warnings,
    counts
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
