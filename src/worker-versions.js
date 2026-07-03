// Snapshot version management handlers for the D1 gateway.
import { normalizeText, safeJsonParse } from './worker-http-helpers.js';
import {
  jsonResponse, badRequest, forbidden,
  isAdminLike,
  queryRows, querySingleRow
} from './worker-auth.js';

// ---------------------------------------------------------------------------
// Row normalizer
// ---------------------------------------------------------------------------

function normalizeVersionRow(row) {
  return {
    ...row,
    summary_json: safeJsonParse(row?.summary_json, {}),
    is_stable: Number(row?.is_stable || 0) === 1,
    version: Number(row?.version || 0),
    updated_at: normalizeText(row?.updated_at) || normalizeText(row?.created_at) || ''
  };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function handleVersionList(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can list versions');
  const conditions = [];
  const bindings = [];
  if (payload.project_key) {
    conditions.push('project_key = ?');
    bindings.push(normalizeText(payload.project_key));
  }
  if (payload.cohort_id) {
    conditions.push('cohort_id = ?');
    bindings.push(normalizeText(payload.cohort_id));
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 100) || 100, 500));
  const rows = await queryRows(db, `
    SELECT * FROM snapshot_versions
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
  `, [...bindings, limit], normalizeVersionRow);
  return jsonResponse(200, { ok: true, records: rows }, request);
}

export async function handleVersionCreate(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can create versions');
  const versionName = normalizeText(payload.version_name);
  const projectKey = normalizeText(payload.project_key);
  const cohortId = normalizeText(payload.cohort_id);
  if (!versionName || !projectKey || !cohortId) return badRequest(request, 'version_name, project_key and cohort_id are required');
  const nowIso = new Date().toISOString();
  const wantsStable = Boolean(payload.is_stable);
  const row = {
    id: crypto.randomUUID(),
    version_name: versionName,
    project_key: projectKey,
    cohort_id: cohortId,
    snapshot_key: normalizeText(payload.snapshot_key) || null,
    exam_scope: normalizeText(payload.exam_scope) || null,
    score_hash: normalizeText(payload.score_hash) || null,
    teacher_hash: normalizeText(payload.teacher_hash) || null,
    target_hash: normalizeText(payload.target_hash) || null,
    alias_hash: normalizeText(payload.alias_hash) || null,
    config_hash: normalizeText(payload.config_hash) || null,
    summary_json: JSON.stringify(payload.summary_json && typeof payload.summary_json === 'object' ? payload.summary_json : {}),
    is_stable: wantsStable ? 1 : 0,
    created_by: normalizeText(session.username),
    created_at: nowIso
  };
  const insertStmt = db.prepare(`
    INSERT INTO snapshot_versions (
      id, version_name, project_key, cohort_id, snapshot_key, exam_scope,
      score_hash, teacher_hash, target_hash, alias_hash, config_hash,
      summary_json, is_stable, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    row.id, row.version_name, row.project_key, row.cohort_id, row.snapshot_key, row.exam_scope,
    row.score_hash, row.teacher_hash, row.target_hash, row.alias_hash, row.config_hash,
    row.summary_json, row.is_stable, row.created_by, row.created_at
  );
  if (wantsStable) {
    const clearStmt = db.prepare(`
      UPDATE snapshot_versions
      SET is_stable = 0, version = version + 1, updated_at = ?
      WHERE project_key = ? AND cohort_id = ? AND id <> ? AND is_stable = 1
    `).bind(nowIso, projectKey, cohortId, row.id);
    await db.batch([clearStmt, insertStmt]);
  } else {
    await insertStmt.run();
  }
  const created = await querySingleRow(db, 'SELECT * FROM snapshot_versions WHERE id = ? LIMIT 1', [row.id], normalizeVersionRow);
  return jsonResponse(200, { ok: true, record: created }, request);
}

export async function handleVersionUpdate(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can update versions');
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await querySingleRow(db, 'SELECT * FROM snapshot_versions WHERE id = ? LIMIT 1', [id], normalizeVersionRow);
  if (!existing) return badRequest(request, 'snapshot version not found');

  const nowIso = new Date().toISOString();
  const patchColumns = [];
  const bindings = [];
  const settingStable = 'is_stable' in payload && Boolean(payload.is_stable);

  if ('is_stable' in payload) {
    patchColumns.push('is_stable = ?');
    bindings.push(payload.is_stable ? 1 : 0);
  }
  if ('version_name' in payload) {
    const versionName = normalizeText(payload.version_name);
    if (!versionName) return badRequest(request, 'version_name cannot be empty');
    patchColumns.push('version_name = ?');
    bindings.push(versionName);
  }
  if (!patchColumns.length) return badRequest(request, 'No supported fields to update');

  // Always bump version + updated_at so the row tracks its last-write time.
  patchColumns.push('version = version + 1', 'updated_at = ?');
  bindings.push(nowIso);

  if (settingStable) {
    // Atomically clear other stable marks and set this one in a single D1 batch
    // (all statements in a D1 batch execute within one implicit transaction).
    const clearStmt = db.prepare(
      `UPDATE snapshot_versions
       SET is_stable = 0, version = version + 1, updated_at = ?
       WHERE project_key = ? AND cohort_id = ? AND id <> ? AND is_stable = 1`
    ).bind(nowIso, normalizeText(existing.project_key), normalizeText(existing.cohort_id), id);

    const setStmt = db.prepare(
      `UPDATE snapshot_versions SET ${patchColumns.join(', ')} WHERE id = ?`
    ).bind(...bindings, id);

    const results = await db.batch([clearStmt, setStmt]);
    // results[1].meta.changes === 0 means the row disappeared between SELECT and UPDATE
    if (!results[1]?.meta?.changes) {
      return badRequest(request, 'snapshot version not found or unchanged');
    }
  } else {
    // Simple update — clearing stable flag or renaming (no cross-row invariant needed)
    await db.prepare(
      `UPDATE snapshot_versions SET ${patchColumns.join(', ')} WHERE id = ?`
    ).bind(...bindings, id).run();
  }

  const updated = await querySingleRow(db, 'SELECT * FROM snapshot_versions WHERE id = ? LIMIT 1', [id], normalizeVersionRow);
  return jsonResponse(200, { ok: true, record: updated }, request);
}

export async function handleVersionDelete(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can delete versions');
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await querySingleRow(db, 'SELECT * FROM snapshot_versions WHERE id = ? LIMIT 1', [id], normalizeVersionRow);
  if (!existing) return badRequest(request, 'snapshot version not found');
  await db.prepare('DELETE FROM snapshot_versions WHERE id = ?').bind(id).run();
  return jsonResponse(200, {
    ok: true,
    deleted: {
      id,
      version_name: normalizeText(existing.version_name),
      is_stable: Boolean(existing.is_stable)
    }
  }, request);
}
