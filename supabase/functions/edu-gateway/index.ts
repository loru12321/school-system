import { createClient } from "npm:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs@2.4.3";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const textEncoder = new TextEncoder();
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const sessionSecret = Deno.env.get("APP_SESSION_SECRET") ?? "";
const bcryptRounds = 12;
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
  });
}
function badRequest(message, extra = {}) {
  return json(400, { ok: false, error: message, ...extra });
}
function unauthorized(message = "Unauthorized") {
  return json(401, { ok: false, error: message });
}
function forbidden(message = "Forbidden") {
  return json(403, { ok: false, error: message });
}
function serverError(message, extra = {}) {
  return json(500, { ok: false, error: message, ...extra });
}
function toBase64Url(input) {
  const bytes = typeof input === "string" ? textEncoder.encode(input) : input;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}
function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
async function signAppSession(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(sessionSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(content));
  return `${content}.${toBase64Url(new Uint8Array(signature))}`;
}
async function verifyAppSession(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, providedSignature] = parts;
  const content = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(sessionSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedSignature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(content));
  const expected = toBase64Url(new Uint8Array(expectedSignature));
  if (!timingSafeEqual(expected, providedSignature)) return null;
  const payloadJson = new TextDecoder().decode(fromBase64Url(encodedPayload));
  const payload = safeJsonParse(payloadJson);
  if (!payload) return null;
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1e3)) return null;
  return payload;
}
function getBearerToken(req) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const [, token] = authHeader.match(/^Bearer\s+(.+)$/i) ?? [];
  return token ?? "";
}
function extractGradeName(className) {
  const text = String(className || "").trim();
  const direct = text.match(/^(\d{1,2})/);
  if (direct) return direct[1];
  const dot = text.match(/^(\d{1,2})\./);
  if (dot) return dot[1];
  return "";
}
function normalizeRoles(row) {
  const role = String(row.role || "guest").trim() || "guest";
  const rolesRaw = row.roles;
  const roles = Array.isArray(rolesRaw) ? rolesRaw.map((item) => String(item || "").trim()).filter(Boolean) : [role];
  return Array.from(/* @__PURE__ */ new Set([role, ...roles]));
}
function getPrimaryRoleFromRoles(roles) {
  const hierarchy = ["admin", "director", "grade_director", "class_teacher", "teacher", "parent", "student", "guest"];
  for (const role of hierarchy) {
    if (roles.includes(role)) return role;
  }
  return roles[0] || "guest";
}
function buildSessionPayload(row) {
  const roles = normalizeRoles(row);
  const role = getPrimaryRoleFromRoles(roles);
  const school = String(row.school || "").trim();
  const className = String(row.class_name || "").trim();
  const gradeName = roles.includes("grade_director") ? className : extractGradeName(className);
  const teacherName = String(row.teacher_name || row.display_name || row.name || row.username || "").trim();
  return {
    username: String(row.username || "").trim(),
    role,
    roles,
    school,
    class_name: className,
    grade_name: gradeName,
    teacher_name: teacherName,
    exp: Math.floor(Date.now() / 1e3) + 60 * 60 * 12
  };
}
function hasAnyRole(session, roles) {
  return roles.some((role) => session.roles.includes(role));
}
function hasRole(session, role) {
  return session.roles.includes(role);
}
function isAdmin(session) {
  return hasRole(session, "admin");
}
function isAdminLike(session) {
  return hasAnyRole(session, ["admin", "director"]);
}
function sameDirectorSchool(session, schoolName) {
  return hasRole(session, "director") && String(schoolName || "").trim() === session.school;
}
function sameGrade(session, schoolName, gradeName, className) {
  return isAdmin(session) || hasRole(session, "grade_director") && String(schoolName || "").trim() === session.school && (String(gradeName || "").trim() === session.grade_name || extractGradeName(String(className || "").trim()) === session.grade_name);
}
function sameClass(session, schoolName, className) {
  return isAdmin(session) || hasRole(session, "class_teacher") && String(schoolName || "").trim() === session.school && String(className || "").trim() === session.class_name;
}
function sameTeacher(session, schoolName, teacherName) {
  return isAdmin(session) || hasRole(session, "teacher") && String(schoolName || "").trim() === session.school && String(teacherName || "").trim() === session.teacher_name;
}
function taskParticipant(session, ownerName, assistUsers, schoolName = "") {
  if (isAdmin(session) || sameDirectorSchool(session, schoolName)) return true;
  if (String(ownerName || "").trim() === session.teacher_name) return true;
  const users = Array.isArray(assistUsers) ? assistUsers : [];
  return users.map((item) => String(item || "").trim()).includes(session.teacher_name);
}
function warningVisible(session, row) {
  const schoolName = String(row.school_name || "");
  return isAdmin(session) || sameDirectorSchool(session, schoolName) || sameGrade(session, schoolName, String(row.grade_name || ""), String(row.class_name || "")) || sameClass(session, schoolName, String(row.class_name || "")) || sameTeacher(session, schoolName, String(row.teacher_name || ""));
}
function rectifyVisible(session, row) {
  const schoolName = String(row.school_name || "");
  return isAdmin(session) || sameDirectorSchool(session, schoolName) || sameGrade(session, schoolName, String(row.grade_name || ""), String(row.class_name || "")) || sameClass(session, schoolName, String(row.class_name || "")) || sameTeacher(session, schoolName, String(row.teacher_name || "")) || taskParticipant(session, String(row.owner_name || ""), row.assist_users, schoolName);
}
function normalizeAccountText(value) {
  return String(value || "").trim();
}
function getStoredPassword(row) {
  return normalizeAccountText(row?.password);
}
function getStoredPasswordHash(row) {
  return normalizeAccountText(row?.password_hash);
}
function hasStoredPassword(row) {
  return !!(getStoredPasswordHash(row) || getStoredPassword(row));
}
function hashAccountPassword(password) {
  return bcrypt.hashSync(normalizeAccountText(password), bcryptRounds);
}
function verifyAccountPassword(row, password) {
  const incomingPassword = normalizeAccountText(password);
  const passwordHash = getStoredPasswordHash(row);
  if (passwordHash) {
    try {
      return bcrypt.compareSync(incomingPassword, passwordHash);
    } catch {
      return false;
    }
  }
  const legacyPassword = getStoredPassword(row);
  if (!legacyPassword) return false;
  return timingSafeEqual(legacyPassword, incomingPassword);
}
function buildPasswordSecretPatch(password) {
  return {
    password_hash: hashAccountPassword(password),
    password: null
  };
}
async function migrateLegacyPasswordRecord(username, password) {
  const normalizedUsername = normalizeAccountText(username);
  const normalizedPassword = normalizeAccountText(password);
  if (!normalizedUsername || !normalizedPassword) return;
  try {
    await admin
      .from("system_users")
      .update(buildPasswordSecretPatch(normalizedPassword))
      .eq("username", normalizedUsername);
  } catch (error) {
    console.warn("[edu-gateway] legacy password migration skipped", normalizedUsername, error);
  }
}
function sanitizeAccountRecord(row) {
  const passwordPresent = hasStoredPassword(row);
  return {
    username: normalizeAccountText(row?.username),
    role: normalizeAccountText(row?.role) || "guest",
    roles: normalizeRoles(row || {}),
    school: normalizeAccountText(row?.school),
    class_name: normalizeAccountText(row?.class_name),
    teacher_name: normalizeAccountText(row?.teacher_name || row?.display_name || row?.name || row?.username),
    has_password: passwordPresent,
    password_display: passwordPresent ? "已设置(不显示明文)" : "未设置"
  };
}
function canSearchAccounts(session) {
  return hasAnyRole(session, [
    "admin",
    "director",
    "grade_director",
    "class_teacher"
  ]);
}
function canBulkManageAccounts(session) {
  return hasAnyRole(session, [
    "admin",
    "director"
  ]);
}
function accountVisible(session, row) {
  const role = normalizeAccountText(row?.role) || "guest";
  const school = normalizeAccountText(row?.school);
  const className = normalizeAccountText(row?.class_name);
  if (isAdmin(session)) return true;
  if (sameDirectorSchool(session, school)) return true;
  if (hasRole(session, "grade_director") && school === normalizeAccountText(session.school)) {
    const gradePrefix = normalizeAccountText(session.class_name || session.grade_name);
    if (!gradePrefix) return false;
    if (role === "teacher") return true;
    return role === "parent" && className.startsWith(gradePrefix);
  }
  if (hasRole(session, "class_teacher") && school === normalizeAccountText(session.school)) {
    return role === "parent" && className === normalizeAccountText(session.class_name);
  }
  return false;
}
function accountEditable(session, row) {
  if (!accountVisible(session, row)) return false;
  const role = normalizeAccountText(row?.role);
  const username = normalizeAccountText(row?.username);
  if (isAdmin(session)) {
    return role !== "admin" || username === normalizeAccountText(session.username);
  }
  if (hasRole(session, "director")) {
    return role !== "admin" && role !== "director";
  }
  if (hasRole(session, "grade_director")) {
    return role === "parent" || role === "teacher";
  }
  if (hasRole(session, "class_teacher")) {
    return role === "parent";
  }
  return false;
}
function normalizeAccountUpsertRow(input, session) {
  const role = normalizeAccountText(input?.role) || "teacher";
  const username = normalizeAccountText(input?.username);
  const password = normalizeAccountText(input?.password);
  let school = normalizeAccountText(input?.school);
  let className = normalizeAccountText(input?.class_name);
  if (role === "teacher" && !className) className = "教师";
  if (role !== "admin" && !school && !isAdmin(session)) {
    school = normalizeAccountText(session.school);
  }
  if (role === "admin") school = "系统";
  const roles = Array.isArray(input?.roles) && input.roles.length
    ? Array.from(new Set(input.roles.map((item) => normalizeAccountText(item)).filter(Boolean)))
    : [
      role
    ];
  return {
    username,
    ...(password ? buildPasswordSecretPatch(password) : { password_hash: "", password: null }),
    role,
    roles,
    school,
    class_name: className,
    teacher_name: normalizeAccountText(input?.teacher_name || input?.display_name || input?.name || input?.username) || username
  };
}
function validateAccountUpsertRow(session, row) {
  if (!row.username || !row.password_hash || !row.role) return "username、password、role 不能为空";
  if (row.role !== "admin" && !row.school) return "school 不能为空";
  if ((row.role === "parent" || row.role === "class_teacher") && !row.class_name) return "班级不能为空";
  if (row.role === "grade_director" && !row.class_name) return "级部/年级不能为空";
  if (hasRole(session, "director")) {
    if (row.role === "admin" || row.role === "director") return "教务主任不能创建或覆盖管理员/主任账号";
    if (normalizeAccountText(row.school) !== normalizeAccountText(session.school)) return "教务主任只能管理本校账号";
  }
  return "";
}
function requireEnv() {
  if (!supabaseUrl || !serviceRoleKey || !sessionSecret) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY or APP_SESSION_SECRET");
  }
}
async function handleLogin(payload) {
  const username = String(payload.username || "").trim();
  const password = String(payload.password || "").trim();
  const inputClass = String(payload.class_name || "").trim();
  if (!username || !password) return badRequest("username and password are required");
  const { data, error } = await admin.from("system_users").select("*").eq("username", username).maybeSingle();
  if (error) return serverError("system_users query failed", { detail: error.message });
  if (!data || !verifyAccountPassword(data, password)) return unauthorized("Invalid username or password");
  const role = String(data.role || "guest");
  if ((role === "parent" || role === "class_teacher") && inputClass && String(data.class_name || "").trim() !== inputClass) {
    return forbidden("class_name mismatch");
  }
  if (!getStoredPasswordHash(data) && getStoredPassword(data)) {
    await migrateLegacyPasswordRecord(username, password);
  }
  const session = buildSessionPayload(data);
  const token = await signAppSession(session);
  return json(200, {
    ok: true,
    token,
    user: {
      username: session.username,
      role: session.role,
      roles: session.roles,
      school: session.school,
      class_name: session.class_name,
      grade_name: session.grade_name,
      teacher_name: session.teacher_name,
      expires_at: session.exp
    }
  });
}
async function handleSessionVerify(session) {
  return json(200, { ok: true, session });
}
async function handleAliasList(session, payload) {
  if (!isAdminLike(session)) return forbidden("Only admin or director can list alias rules");
  let query = admin.from("config_alias_rules").select("*").order("priority", { ascending: true }).order("created_at", { ascending: false });
  if (payload.rule_type) query = query.eq("rule_type", String(payload.rule_type));
  if (payload.project_key) query = query.eq("project_key", String(payload.project_key));
  if (payload.cohort_id) query = query.eq("cohort_id", String(payload.cohort_id));
  const { data, error } = await query;
  if (error) return serverError("config_alias_rules query failed", { detail: error.message });
  return json(200, { ok: true, records: data ?? [] });
}
async function handleAliasSave(session, payload) {
  if (!isAdminLike(session)) return forbidden("Only admin or director can save alias rules");
  const rows = Array.isArray(payload.rows) ? payload.rows : [payload];
  const replaceScope = Boolean(payload.replace_scope ?? false);
  const sanitized = rows.map((row) => ({
    ...row && typeof row === "object" && row.id ? { id: row.id } : {},
    rule_type: String(row.rule_type || "").trim(),
    standard_name: String(row.standard_name || "").trim(),
    alias_name: String(row.alias_name || "").trim(),
    scope: String(row.scope || "global").trim(),
    project_key: String(row.project_key || "").trim(),
    cohort_id: String(row.cohort_id || "").trim(),
    school_name: String(row.school_name || "").trim() || null,
    grade_range: String(row.grade_range || "").trim() || null,
    priority: Number(row.priority ?? 100),
    is_active: Boolean(row.is_active ?? true),
    remark: String(row.remark || "").trim() || null,
    created_by: session.username
  })).filter((row) => row.rule_type && row.standard_name && row.alias_name);
  const scopeSeed = sanitized[0] || {
    rule_type: String(payload.rule_type || "school").trim() || "school",
    scope: String(payload.scope || "global").trim() || "global",
    project_key: String(payload.project_key || "").trim(),
    cohort_id: String(payload.cohort_id || "").trim()
  };
  if (replaceScope) {
    const { error: deleteError } = await admin.from("config_alias_rules").delete().eq("rule_type", scopeSeed.rule_type).eq("scope", scopeSeed.scope).eq("project_key", scopeSeed.project_key).eq("cohort_id", scopeSeed.cohort_id);
    if (deleteError) {
      return serverError("config_alias_rules replace delete failed", { detail: deleteError.message });
    }
  }
  if (!sanitized.length) return json(200, { ok: true, records: [] });
  const { data, error } = await admin.from("config_alias_rules").insert(sanitized).select();
  if (error) return serverError("config_alias_rules insert failed", { detail: error.message });
  return json(200, { ok: true, records: data ?? [] });
}
async function handleWarningList(session, payload) {
  let query = admin.from("warning_records").select("*").order("created_at", { ascending: false }).limit(Number(payload.limit ?? 100));
  if (payload.project_key) query = query.eq("project_key", String(payload.project_key));
  if (payload.cohort_id) query = query.eq("cohort_id", String(payload.cohort_id));
  if (payload.warning_level) query = query.eq("warning_level", String(payload.warning_level));
  if (payload.status) query = query.eq("status", String(payload.status));
  const { data, error } = await query;
  if (error) return serverError("warning_records query failed", { detail: error.message });
  const scoped = (data ?? []).filter((row) => warningVisible(session, row));
  return json(200, { ok: true, records: scoped });
}
async function handleWarningIgnore(session, payload) {
  if (!hasAnyRole(session, ["admin", "director", "grade_director"])) return forbidden("Only management roles can ignore warnings");
  const id = String(payload.id || "").trim();
  if (!id) return badRequest("id is required");
  const { data: existing, error: findError } = await admin.from("warning_records").select("*").eq("id", id).maybeSingle();
  if (findError) return serverError("warning_records lookup failed", { detail: findError.message });
  if (!existing) return badRequest("warning record not found");
  if (!warningVisible(session, existing)) return forbidden("Out of scope");
  const { data, error } = await admin.from("warning_records").update({ status: "ignored" }).eq("id", id).select().maybeSingle();
  if (error) return serverError("warning_records update failed", { detail: error.message });
  return json(200, { ok: true, record: data });
}
async function handleRectifyList(session, payload) {
  let query = admin.from("rectify_tasks").select("*").order("created_at", { ascending: false }).limit(Number(payload.limit ?? 100));
  if (payload.project_key) query = query.eq("project_key", String(payload.project_key));
  if (payload.cohort_id) query = query.eq("cohort_id", String(payload.cohort_id));
  if (payload.status) query = query.eq("status", String(payload.status));
  const { data, error } = await query;
  if (error) return serverError("rectify_tasks query failed", { detail: error.message });
  const scoped = (data ?? []).filter((row) => rectifyVisible(session, row));
  return json(200, { ok: true, records: scoped });
}
async function handleRectifySave(session, payload) {
  if (!hasAnyRole(session, ["admin", "director", "grade_director"])) return forbidden("Only management roles can create tasks");
  const title = String(payload.title || "").trim();
  if (!title) return badRequest("title is required");
  const row = {
    source_warning_id: String(payload.source_warning_id || "").trim() || null,
    task_type: String(payload.task_type || "teacher").trim(),
    title,
    project_key: String(payload.project_key || "").trim() || null,
    cohort_id: String(payload.cohort_id || "").trim() || null,
    exam_id: String(payload.exam_id || "").trim() || null,
    school_name: String(payload.school_name || session.school || "").trim() || null,
    grade_name: String(payload.grade_name || "").trim() || null,
    class_name: String(payload.class_name || "").trim() || null,
    subject_name: String(payload.subject_name || "").trim() || null,
    teacher_name: String(payload.teacher_name || "").trim() || null,
    student_name: String(payload.student_name || "").trim() || null,
    problem_desc: String(payload.problem_desc || "").trim() || null,
    action_plan: String(payload.action_plan || "").trim() || null,
    owner_name: String(payload.owner_name || "").trim() || null,
    assist_users: Array.isArray(payload.assist_users) ? payload.assist_users : [],
    due_date: String(payload.due_date || "").trim() || null,
    priority: String(payload.priority || "medium").trim(),
    status: String(payload.status || "todo").trim(),
    progress: Number(payload.progress ?? 0),
    review_result: String(payload.review_result || "").trim() || null,
    created_by: session.username
  };
  const { data, error } = await admin.from("rectify_tasks").insert(row).select().maybeSingle();
  if (error) return serverError("rectify_tasks insert failed", { detail: error.message });
  return json(200, { ok: true, record: data });
}
async function handleRectifyUpdate(session, payload) {
  const id = String(payload.id || "").trim();
  if (!id) return badRequest("id is required");
  const { data: existing, error: findError } = await admin.from("rectify_tasks").select("*").eq("id", id).maybeSingle();
  if (findError) return serverError("rectify_tasks lookup failed", { detail: findError.message });
  if (!existing) return badRequest("rectify task not found");
  if (!rectifyVisible(session, existing)) return forbidden("Out of scope");
  const patch = {};
  const allowedFields = ["status", "progress", "review_result", "action_plan", "owner_name", "assist_users", "due_date", "priority"];
  for (const field of allowedFields) {
    if (field in payload) patch[field] = payload[field];
  }
  const { data, error } = await admin.from("rectify_tasks").update(patch).eq("id", id).select().maybeSingle();
  if (error) return serverError("rectify_tasks update failed", { detail: error.message });
  return json(200, { ok: true, record: data });
}
async function handleVersionList(session, payload) {
  if (!isAdminLike(session)) return forbidden("Only admin or director can list versions");
  let query = admin.from("snapshot_versions").select("*").order("created_at", { ascending: false }).limit(Number(payload.limit ?? 100));
  if (payload.project_key) query = query.eq("project_key", String(payload.project_key));
  if (payload.cohort_id) query = query.eq("cohort_id", String(payload.cohort_id));
  const { data, error } = await query;
  if (error) return serverError("snapshot_versions query failed", { detail: error.message });
  return json(200, { ok: true, records: data ?? [] });
}
async function handleVersionCreate(session, payload) {
  if (!isAdminLike(session)) return forbidden("Only admin or director can create versions");
  const versionName = String(payload.version_name || "").trim();
  const projectKey = String(payload.project_key || "").trim();
  const cohortId = String(payload.cohort_id || "").trim();
  if (!versionName || !projectKey || !cohortId) return badRequest("version_name, project_key and cohort_id are required");
  const row = {
    version_name: versionName,
    project_key: projectKey,
    cohort_id: cohortId,
    snapshot_key: String(payload.snapshot_key || "").trim() || null,
    exam_scope: String(payload.exam_scope || "").trim() || null,
    score_hash: String(payload.score_hash || "").trim() || null,
    teacher_hash: String(payload.teacher_hash || "").trim() || null,
    target_hash: String(payload.target_hash || "").trim() || null,
    alias_hash: String(payload.alias_hash || "").trim() || null,
    config_hash: String(payload.config_hash || "").trim() || null,
    summary_json: payload.summary_json && typeof payload.summary_json === "object" ? payload.summary_json : {},
    is_stable: Boolean(payload.is_stable ?? false),
    created_by: session.username
  };
  const { data, error } = await admin.from("snapshot_versions").insert(row).select().maybeSingle();
  if (error) return serverError("snapshot_versions insert failed", { detail: error.message });
  return json(200, { ok: true, record: data });
}
async function handleVersionUpdate(session, payload) {
  if (!isAdminLike(session)) return forbidden("Only admin or director can update versions");
  const id = String(payload.id || "").trim();
  if (!id) return badRequest("id is required");
  const { data: existing, error: findError } = await admin.from("snapshot_versions").select("*").eq("id", id).maybeSingle();
  if (findError) return serverError("snapshot_versions lookup failed", { detail: findError.message });
  if (!existing) return badRequest("snapshot version not found");

  const patch: Record<string, unknown> = {};
  if ("is_stable" in payload) {
    const nextStable = Boolean(payload.is_stable);
    patch.is_stable = nextStable;
    if (nextStable) {
      const { error: clearError } = await admin
        .from("snapshot_versions")
        .update({ is_stable: false })
        .eq("project_key", String(existing.project_key || ""))
        .eq("cohort_id", String(existing.cohort_id || ""))
        .neq("id", id);
      if (clearError) {
        return serverError("snapshot_versions stable reset failed", { detail: clearError.message });
      }
    }
  }
  if ("version_name" in payload) {
    const versionName = String(payload.version_name || "").trim();
    if (!versionName) return badRequest("version_name cannot be empty");
    patch.version_name = versionName;
  }

  const { data, error } = await admin.from("snapshot_versions").update(patch).eq("id", id).select().maybeSingle();
  if (error) return serverError("snapshot_versions update failed", { detail: error.message });
  return json(200, { ok: true, record: data });
}
async function handleVersionDelete(session, payload) {
  if (!isAdminLike(session)) return forbidden("Only admin or director can delete versions");
  const id = String(payload.id || "").trim();
  if (!id) return badRequest("id is required");
  const { data: existing, error: findError } = await admin.from("snapshot_versions").select("*").eq("id", id).maybeSingle();
  if (findError) return serverError("snapshot_versions lookup failed", { detail: findError.message });
  if (!existing) return badRequest("snapshot version not found");

  const { error } = await admin.from("snapshot_versions").delete().eq("id", id);
  if (error) return serverError("snapshot_versions delete failed", { detail: error.message });
  return json(200, {
    ok: true,
    deleted: {
      id,
      version_name: String(existing.version_name || "").trim(),
      is_stable: Boolean(existing.is_stable)
    }
  });
}
async function handleAccountSearch(session, payload) {
  if (!canSearchAccounts(session)) return forbidden("No permission to search accounts");
  const keyword = normalizeAccountText(payload.keyword);
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 50) || 50, 100));
  if (!keyword) return badRequest("keyword is required");
  let query = admin.from("system_users").select("*").ilike("username", `%${keyword}%`).limit(limit);
  if (!isAdmin(session)) {
    query = query.eq("school", normalizeAccountText(session.school));
  }
  const { data, error } = await query;
  if (error) return serverError("system_users search failed", { detail: error.message });
  const records = (data ?? []).filter((row) => accountVisible(session, row)).map((row) => sanitizeAccountRecord(row));
  return json(200, { ok: true, records });
}
async function handleAccountUpdate(session, payload) {
  if (!canSearchAccounts(session)) return forbidden("No permission to update accounts");
  const username = normalizeAccountText(payload.username);
  if (!username) return badRequest("username is required");
  const { data: existing, error: findError } = await admin.from("system_users").select("*").eq("username", username).maybeSingle();
  if (findError) return serverError("system_users lookup failed", { detail: findError.message });
  if (!existing) return badRequest("account not found");
  if (!accountEditable(session, existing)) return forbidden("Out of scope");

  const nextRole = normalizeAccountText(payload.role) || normalizeAccountText(existing.role) || "teacher";
  const nextClassName = normalizeAccountText(payload.class_name ?? existing.class_name);
  if ((nextRole === "parent" || nextRole === "class_teacher") && !nextClassName) return badRequest("class_name is required");
  if (nextRole === "grade_director" && !nextClassName) return badRequest("class_name is required");
  if (!isAdmin(session) && (nextRole === "admin" || nextRole === "director")) {
    return forbidden("Only admin can elevate account to admin/director");
  }
  if (normalizeAccountText(existing.role) === "admin" && normalizeAccountText(existing.username) === normalizeAccountText(session.username) && nextRole !== "admin") {
    return forbidden("Cannot downgrade current admin account from browser");
  }

  const patch = {
    role: nextRole,
    roles: [nextRole],
    class_name: nextRole === "teacher" && !nextClassName ? "教师" : nextClassName
  };
  const { data, error } = await admin.from("system_users").update(patch).eq("username", username).select("*").maybeSingle();
  if (error) return serverError("system_users update failed", { detail: error.message });
  return json(200, { ok: true, record: sanitizeAccountRecord(data) });
}
async function handleAccountResetPassword(session, payload) {
  if (!canSearchAccounts(session)) return forbidden("No permission to reset accounts");
  const username = normalizeAccountText(payload.username);
  const newPassword = normalizeAccountText(payload.new_password);
  if (!username || !newPassword) return badRequest("username and new_password are required");
  if (newPassword.length < 6) return badRequest("new_password must be at least 6 characters");

  const { data: existing, error: findError } = await admin.from("system_users").select("*").eq("username", username).maybeSingle();
  if (findError) return serverError("system_users lookup failed", { detail: findError.message });
  if (!existing) return badRequest("account not found");
  if (!accountEditable(session, existing)) return forbidden("Out of scope");

  const { data, error } = await admin.from("system_users").update(buildPasswordSecretPatch(newPassword)).eq("username", username).select("*").maybeSingle();
  if (error) return serverError("system_users password reset failed", { detail: error.message });
  return json(200, { ok: true, record: sanitizeAccountRecord(data) });
}
async function handleAccountChangePassword(session, payload) {
  const oldPassword = normalizeAccountText(payload.old_password);
  const newPassword = normalizeAccountText(payload.new_password);
  if (!oldPassword || !newPassword) return badRequest("old_password and new_password are required");
  if (newPassword.length < 6) return badRequest("new_password must be at least 6 characters");
  if (oldPassword === newPassword) return badRequest("new_password must differ from old_password");

  const { data: existing, error: findError } = await admin.from("system_users").select("*").eq("username", normalizeAccountText(session.username)).maybeSingle();
  if (findError) return serverError("system_users lookup failed", { detail: findError.message });
  if (!existing) return badRequest("current account not found");
  if (!verifyAccountPassword(existing, oldPassword)) return forbidden("old password mismatch");

  const { data, error } = await admin.from("system_users").update(buildPasswordSecretPatch(newPassword)).eq("username", normalizeAccountText(session.username)).select("*").maybeSingle();
  if (error) return serverError("system_users password update failed", { detail: error.message });
  return json(200, { ok: true, record: sanitizeAccountRecord(data) });
}
async function handleAccountExport(session) {
  if (!canBulkManageAccounts(session)) return forbidden("No permission to export accounts");
  let query = admin.from("system_users").select("*").order("school", { ascending: true }).order("role", { ascending: true }).limit(10000);
  if (!isAdmin(session)) {
    query = query.eq("school", normalizeAccountText(session.school));
  }
  const { data, error } = await query;
  if (error) return serverError("system_users export failed", { detail: error.message });
  const records = (data ?? []).map((row) => sanitizeAccountRecord(row));
  return json(200, { ok: true, records });
}
async function handleAccountUpsertMany(session, payload) {
  if (!canBulkManageAccounts(session)) return forbidden("No permission to manage accounts");
  const rows = Array.isArray(payload.rows) ? payload.rows : [payload];
  const sanitizedRows = rows.map((row) => normalizeAccountUpsertRow(row, session));
  for (let i = 0; i < sanitizedRows.length; i += 1) {
    const reason = validateAccountUpsertRow(session, sanitizedRows[i]);
    if (reason) return badRequest(`第 ${i + 1} 条账号数据无效: ${reason}`);
  }
  if (!sanitizedRows.length) return json(200, { ok: true, count: 0 });
  const { error } = await admin.from("system_users").upsert(sanitizedRows, { onConflict: "username" });
  if (error) return serverError("system_users upsert failed", { detail: error.message });
  return json(200, { ok: true, count: sanitizedRows.length });
}
async function handleAccountDeleteNonAdmin(session) {
  if (!canBulkManageAccounts(session)) return forbidden("No permission to delete accounts");
  let query = admin.from("system_users").delete({ count: "exact" }).neq("role", "admin").neq("role", "director");
  if (!isAdmin(session)) {
    query = query.eq("school", normalizeAccountText(session.school));
  }
  const { error, count } = await query;
  if (error) return serverError("system_users delete failed", { detail: error.message });
  return json(200, { ok: true, count: Number(count || 0) });
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    requireEnv();
    if (req.method !== "POST") return badRequest("POST only");
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");
    const action = String(body.action || "").trim();
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    if (!action) return badRequest("action is required");
    if (action === "login") return await handleLogin(payload);
    const token = getBearerToken(req);
    if (!token) return unauthorized("Missing bearer token");
    const session = await verifyAppSession(token);
    if (!session) return unauthorized("Invalid or expired app session token");
    switch (action) {
      case "session.verify":
        return await handleSessionVerify(session);
      case "alias.list":
        return await handleAliasList(session, payload);
      case "alias.save":
        return await handleAliasSave(session, payload);
      case "warning.list":
        return await handleWarningList(session, payload);
      case "warning.ignore":
        return await handleWarningIgnore(session, payload);
      case "rectify.list":
        return await handleRectifyList(session, payload);
      case "rectify.save":
        return await handleRectifySave(session, payload);
      case "rectify.update":
        return await handleRectifyUpdate(session, payload);
      case "version.list":
        return await handleVersionList(session, payload);
      case "version.create":
        return await handleVersionCreate(session, payload);
      case "version.update":
        return await handleVersionUpdate(session, payload);
      case "version.delete":
        return await handleVersionDelete(session, payload);
      case "account.search":
        return await handleAccountSearch(session, payload);
      case "account.update":
        return await handleAccountUpdate(session, payload);
      case "account.reset_password":
        return await handleAccountResetPassword(session, payload);
      case "account.change_password":
        return await handleAccountChangePassword(session, payload);
      case "account.export":
        return await handleAccountExport(session);
      case "account.upsert_many":
        return await handleAccountUpsertMany(session, payload);
      case "account.delete_non_admin":
        return await handleAccountDeleteNonAdmin(session);
      default:
        return badRequest(`Unsupported action: ${action}`);
    }
  } catch (error) {
    return serverError("edu-gateway failed", {
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

