import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const lockdownSqlFile = path.resolve(workspaceRoot, 'supabase', 'sql', '009_lockdown_legacy_public_tables.sql');

function normalizeText(value) {
  return String(value || '').trim();
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON response (${response.status}): ${text.slice(0, 500)}`);
  }
}

async function runManagementQuery({ managementToken, projectRef, query }) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${managementToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  const data = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Supabase query failed (${response.status}): ${JSON.stringify(data).slice(0, 1000)}`);
  }
  return data;
}

async function main() {
  const managementToken = normalizeText(process.env.SUPABASE_MANAGEMENT_TOKEN || process.env.SUPABASE_ACCESS_TOKEN);
  const projectRef = normalizeText(process.env.TARGET_PROJECT_REF || process.env.SUPABASE_PROJECT_REF);
  if (!managementToken || !projectRef) {
    throw new Error('SUPABASE_MANAGEMENT_TOKEN (or SUPABASE_ACCESS_TOKEN) and TARGET_PROJECT_REF are required');
  }

  const query = await fs.readFile(lockdownSqlFile, 'utf8');
  await runManagementQuery({ managementToken, projectRef, query });
  console.log(JSON.stringify({
    ok: true,
    project_ref: projectRef,
    applied: path.relative(workspaceRoot, lockdownSqlFile).replace(/\\/g, '/')
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
