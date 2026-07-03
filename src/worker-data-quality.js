// Data quality handlers: alias rules, warning records, and rectify tasks.
import { normalizeText, safeJsonParse } from './worker-http-helpers.js';
import {
  jsonResponse, badRequest, forbidden,
  isAdmin, hasRole, hasAnyRole, isAdminLike,
  warningVisible, rectifyVisible,
  queryRows, querySingleRow
} from './worker-auth.js';

// ---------------------------------------------------------------------------
// Row normalizers
// ---------------------------------------------------------------------------

function parseAssistUsers(row) {
  if (Array.isArray(row?.assist_users)) return row.assist_users;
  const parsed = safeJsonParse(row?.assist_users_json, []);
  return Array.isArray(parsed) ? parsed : [];
}

function normalizeWarningRow(row) {
  return {
    ...row,
    metric_value: row?.metric_value == null ? null : Number(row.metric_value),
    threshold_value: row?.threshold_value == null ? null : Number(row.threshold_value)
  };
}

function normalizeRectifyRow(row) {
  return {
    ...row,
    progress: Number(row?.progress || 0),
    assist_users: parseAssistUsers(row)
  };
}

// ---------------------------------------------------------------------------
// Alias handlers
// ---------------------------------------------------------------------------

export async function handleAliasList(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can list alias rules');
  const conditions = [];
  const bindings = [];
  if (payload.rule_type) {
    conditions.push('rule_type = ?');
    bindings.push(normalizeText(payload.rule_type));
  }
  if (payload.project_key) {
    conditions.push('project_key = ?');
    bindings.push(normalizeText(payload.project_key));
  }
  if (payload.cohort_id) {
    conditions.push('cohort_id = ?');
    bindings.push(normalizeText(payload.cohort_id));
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await queryRows(db, `
    SELECT * FROM config_alias_rules
    ${where}
    ORDER BY priority ASC, created_at DESC
  `, bindings);
  return jsonResponse(200, { ok: true, records: rows }, request);
}

export async function handleAliasSave(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can save alias rules');
  const rows = Array.isArray(payload.rows) ? payload.rows : [payload];
  const replaceScope = Boolean(payload.replace_scope ?? false);
  const sanitizedRows = rows.map((row) => ({
    id: normalizeText(row?.id) || crypto.randomUUID(),
    rule_type: normalizeText(row?.rule_type),
    standard_name: normalizeText(row?.standard_name),
    alias_name: normalizeText(row?.alias_name),
    scope: normalizeText(row?.scope) || 'global',
    project_key: normalizeText(row?.project_key) || '',
    cohort_id: normalizeText(row?.cohort_id) || '',
    school_name: normalizeText(row?.school_name) || null,
    grade_range: normalizeText(row?.grade_range) || null,
    priority: Number(row?.priority ?? 100),
    is_active: row?.is_active === false ? 0 : 1,
    remark: normalizeText(row?.remark) || null,
    created_by: normalizeText(session.username),
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: new Date().toISOString()
  })).filter((row) => row.rule_type && row.standard_name && row.alias_name);

  if (replaceScope) {
    const scopeSeed = sanitizedRows[0] || {
      rule_type: normalizeText(payload.rule_type) || 'school',
      scope: normalizeText(payload.scope) || 'global',
      project_key: normalizeText(payload.project_key),
      cohort_id: normalizeText(payload.cohort_id)
    };
    await db.prepare(`
      DELETE FROM config_alias_rules
      WHERE rule_type = ? AND scope = ? AND IFNULL(project_key, '') = ? AND IFNULL(cohort_id, '') = ?
    `).bind(scopeSeed.rule_type, scopeSeed.scope, scopeSeed.project_key || '', scopeSeed.cohort_id || '').run();
  }

  if (!sanitizedRows.length) {
    return jsonResponse(200, { ok: true, records: [] }, request);
  }

  const statements = sanitizedRows.map((row) => db.prepare(`
    INSERT INTO config_alias_rules (
      id, rule_type, standard_name, alias_name, scope, project_key, cohort_id,
      school_name, grade_range, priority, is_active, remark, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      rule_type = excluded.rule_type,
      standard_name = excluded.standard_name,
      alias_name = excluded.alias_name,
      scope = excluded.scope,
      project_key = excluded.project_key,
      cohort_id = excluded.cohort_id,
      school_name = excluded.school_name,
      grade_range = excluded.grade_range,
      priority = excluded.priority,
      is_active = excluded.is_active,
      remark = excluded.remark,
      created_by = excluded.created_by,
      updated_at = excluded.updated_at
  `).bind(
    row.id, row.rule_type, row.standard_name, row.alias_name, row.scope,
    row.project_key, row.cohort_id, row.school_name, row.grade_range,
    row.priority, row.is_active, row.remark, row.created_by, row.created_at, row.updated_at
  ));
  await db.batch(statements);
  return jsonResponse(200, { ok: true, records: sanitizedRows }, request);
}

// ---------------------------------------------------------------------------
// Warning handlers
// ---------------------------------------------------------------------------

export async function handleWarningList(request, db, session, payload) {
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
  if (payload.warning_level) {
    conditions.push('warning_level = ?');
    bindings.push(normalizeText(payload.warning_level));
  }
  if (payload.status) {
    conditions.push('status = ?');
    bindings.push(normalizeText(payload.status));
  }
  // Push school-scope filter into SQL for non-admin roles to avoid fetching
  // and then discarding unrelated rows in JS (see warningVisible).
  if (!isAdmin(session) && !hasRole(session, 'director')) {
    const school = normalizeText(session.school);
    if (school) {
      conditions.push('school_name = ?');
      bindings.push(school);
    }
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 100) || 100, 500));
  const rows = await queryRows(db, `
    SELECT * FROM warning_records
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
  `, [...bindings, limit], normalizeWarningRow);
  // Fine-grained JS filter still applied for grade/class/teacher scope within the school.
  return jsonResponse(200, { ok: true, records: rows.filter((row) => warningVisible(session, row)) }, request);
}

export async function handleWarningIgnore(request, db, session, payload) {
  if (!hasAnyRole(session, ['admin', 'director', 'grade_director'])) {
    return forbidden(request, 'Only management roles can ignore warnings');
  }
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await querySingleRow(db, 'SELECT * FROM warning_records WHERE id = ? LIMIT 1', [id], normalizeWarningRow);
  if (!existing) return badRequest(request, 'warning record not found');
  if (!warningVisible(session, existing)) return forbidden(request, 'Out of scope');
  await db.prepare('UPDATE warning_records SET status = ?, updated_at = ? WHERE id = ?').bind('ignored', new Date().toISOString(), id).run();
  const updated = await querySingleRow(db, 'SELECT * FROM warning_records WHERE id = ? LIMIT 1', [id], normalizeWarningRow);
  return jsonResponse(200, { ok: true, record: updated }, request);
}

// ---------------------------------------------------------------------------
// Rectify handlers
// ---------------------------------------------------------------------------

export async function handleRectifyList(request, db, session, payload) {
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
  if (payload.status) {
    conditions.push('status = ?');
    bindings.push(normalizeText(payload.status));
  }
  // Push school-scope filter into SQL for non-admin roles to reduce D1 read rows.
  if (!isAdmin(session) && !hasRole(session, 'director')) {
    const school = normalizeText(session.school);
    if (school) {
      conditions.push('school_name = ?');
      bindings.push(school);
    }
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 100) || 100, 500));
  const rows = await queryRows(db, `
    SELECT * FROM rectify_tasks
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
  `, [...bindings, limit], normalizeRectifyRow);
  // Fine-grained JS filter still applied for grade/class/teacher/participant scope.
  return jsonResponse(200, { ok: true, records: rows.filter((row) => rectifyVisible(session, row)) }, request);
}

export async function handleRectifySave(request, db, session, payload) {
  if (!hasAnyRole(session, ['admin', 'director', 'grade_director'])) {
    return forbidden(request, 'Only management roles can create tasks');
  }
  const title = normalizeText(payload.title);
  if (!title) return badRequest(request, 'title is required');
  const row = {
    id: crypto.randomUUID(),
    source_warning_id: normalizeText(payload.source_warning_id) || null,
    task_type: normalizeText(payload.task_type) || 'teacher',
    title,
    project_key: normalizeText(payload.project_key) || null,
    cohort_id: normalizeText(payload.cohort_id) || null,
    exam_id: normalizeText(payload.exam_id) || null,
    school_name: normalizeText(payload.school_name || session.school) || null,
    grade_name: normalizeText(payload.grade_name) || null,
    class_name: normalizeText(payload.class_name) || null,
    subject_name: normalizeText(payload.subject_name) || null,
    teacher_name: normalizeText(payload.teacher_name) || null,
    student_name: normalizeText(payload.student_name) || null,
    problem_desc: normalizeText(payload.problem_desc) || null,
    action_plan: normalizeText(payload.action_plan) || null,
    owner_name: normalizeText(payload.owner_name) || null,
    assist_users_json: JSON.stringify(Array.isArray(payload.assist_users) ? payload.assist_users : []),
    due_date: normalizeText(payload.due_date) || null,
    priority: normalizeText(payload.priority) || 'medium',
    status: normalizeText(payload.status) || 'todo',
    progress: Number(payload.progress ?? 0),
    review_result: normalizeText(payload.review_result) || null,
    created_by: normalizeText(session.username),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  await db.prepare(`
    INSERT INTO rectify_tasks (
      id, source_warning_id, task_type, title, project_key, cohort_id, exam_id,
      school_name, grade_name, class_name, subject_name, teacher_name, student_name,
      problem_desc, action_plan, owner_name, assist_users_json, due_date, priority,
      status, progress, review_result, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    row.id, row.source_warning_id, row.task_type, row.title, row.project_key, row.cohort_id, row.exam_id,
    row.school_name, row.grade_name, row.class_name, row.subject_name, row.teacher_name, row.student_name,
    row.problem_desc, row.action_plan, row.owner_name, row.assist_users_json, row.due_date, row.priority,
    row.status, row.progress, row.review_result, row.created_by, row.created_at, row.updated_at
  ).run();
  const created = await querySingleRow(db, 'SELECT * FROM rectify_tasks WHERE id = ? LIMIT 1', [row.id], normalizeRectifyRow);
  return jsonResponse(200, { ok: true, record: created }, request);
}

export async function handleRectifyUpdate(request, db, session, payload) {
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await querySingleRow(db, 'SELECT * FROM rectify_tasks WHERE id = ? LIMIT 1', [id], normalizeRectifyRow);
  if (!existing) return badRequest(request, 'rectify task not found');
  if (!rectifyVisible(session, existing)) return forbidden(request, 'Out of scope');
  const allowedFields = ['status', 'progress', 'review_result', 'action_plan', 'owner_name', 'assist_users', 'due_date', 'priority'];
  const patchColumns = [];
  const bindings = [];
  for (const field of allowedFields) {
    if (!(field in payload)) continue;
    patchColumns.push(field === 'assist_users' ? 'assist_users_json = ?' : `${field} = ?`);
    bindings.push(field === 'assist_users' ? JSON.stringify(Array.isArray(payload[field]) ? payload[field] : []) : payload[field]);
  }
  if (!patchColumns.length) return badRequest(request, 'No supported fields to update');
  patchColumns.push('updated_at = ?');
  bindings.push(new Date().toISOString(), id);
  await db.prepare(`UPDATE rectify_tasks SET ${patchColumns.join(', ')} WHERE id = ?`).bind(...bindings).run();
  const updated = await querySingleRow(db, 'SELECT * FROM rectify_tasks WHERE id = ? LIMIT 1', [id], normalizeRectifyRow);
  return jsonResponse(200, { ok: true, record: updated }, request);
}
