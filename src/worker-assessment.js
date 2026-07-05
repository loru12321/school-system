// Assessment score synchronization handlers for the D1 gateway.
// Connects to an external Supabase-based assessment system to sync teacher scores.
import { normalizeText } from './worker-http-helpers.js';
import {
  jsonResponse, badRequest, forbidden,
  canSyncAssessmentScores
} from './worker-auth.js';

// ---------------------------------------------------------------------------
// Constants (copied from gateway — assessment-specific limits)
// ---------------------------------------------------------------------------

const ASSESSMENT_SYNC_BATCH_LIMIT = 600;
const ASSESSMENT_PROJECT_LIMITS = {
  teacher_two_rates_one_score: 60,
  teacher_class_collaboration: 10,
  teacher_subject_collaboration: 10,
  teacher_bottom_third: 10,
  teacher_excellent_contribution: 5,
  class_target_grad: 33,
  class_high_school_contribution_grad: 15
};

// ---------------------------------------------------------------------------
// Supabase REST client
// ---------------------------------------------------------------------------

function getAssessmentSupabaseConfig(env) {
  const url = normalizeText(env.ASSESSMENT_SUPABASE_URL).replace(/\/+$/, '');
  const serviceRoleKey = normalizeText(env.ASSESSMENT_SUPABASE_SERVICE_ROLE_KEY);
  return { url, serviceRoleKey, ready: !!(url && serviceRoleKey) };
}

async function assessmentRestFetch(env, path, init = {}) {
  const config = getAssessmentSupabaseConfig(env);
  if (!config.ready) throw new Error('ASSESSMENT_SUPABASE_NOT_CONFIGURED');
  const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${path}`;
  const headers = new Headers(init.headers || {});
  headers.set('apikey', config.serviceRoleKey);
  headers.set('Authorization', `Bearer ${config.serviceRoleKey}`);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${config.url}${normalizedPath}`, { ...init, headers });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!response.ok) {
    const message = normalizeText(data?.message || data?.error || text || `ASSESSMENT_REST_${response.status}`);
    throw new Error(message);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Value normalizers
// ---------------------------------------------------------------------------

function normalizeAssessmentAcademicYear(value) {
  const text = normalizeText(value);
  const match = text.match(/(20\d{2})\D+(20\d{2})/);
  if (!match) return '';
  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end !== start + 1) return '';
  return `${start}-${end}`;
}

function normalizeAssessmentGrade(value) {
  const text = normalizeText(value);
  if (!text) return '';
  const cnMap = { 六: '6', 七: '7', 八: '8', 九: '9' };
  for (const [key, grade] of Object.entries(cnMap)) {
    if (text.includes(`${key}年级`) || text === key) return grade;
  }
  const match = text.match(/[6-9]/);
  return match ? match[0] : '';
}

function normalizeAssessmentSubject(value) {
  let text = normalizeText(value).replace(/\s+/g, '');
  const aliasMap = {
    语: '语文',
    数: '数学',
    英: '英语',
    道法: '政治',
    道德与法治: '政治',
    思政: '政治',
    科学: '科学',
    体育与健康: '体育'
  };
  text = aliasMap[text] || text;
  return text;
}

function normalizeAssessmentName(value) {
  return normalizeText(value).replace(/\s+/g, '').toLowerCase();
}

function parseAssessmentClasses(value) {
  const raw = Array.isArray(value) ? value : String(value || '').split(/[、,，;；|\s]+/);
  const classes = raw
    .map((item) => normalizeText(item).replace(/班$/, ''))
    .filter(Boolean);
  return Array.from(new Set(classes));
}

function assessmentClassOverlap(left, right) {
  const leftSet = new Set(parseAssessmentClasses(left));
  const rightSet = new Set(parseAssessmentClasses(right));
  if (!leftSet.size || !rightSet.size) return 0;
  let count = 0;
  leftSet.forEach((item) => { if (rightSet.has(item)) count += 1; });
  return count;
}

function normalizeAssessmentScoreItem(input) {
  const projectId = normalizeText(input?.project_id);
  const maxScore = ASSESSMENT_PROJECT_LIMITS[projectId];
  if (!maxScore) return null;
  const score = Number(input?.score);
  if (!Number.isFinite(score) || score < 0 || score > maxScore + 0.001) return null;
  const teacherName = normalizeText(input?.teacher_name || input?.name);
  if (!teacherName) return null;
  return {
    teacher_name: teacherName,
    grade: normalizeAssessmentGrade(input?.grade),
    subject: normalizeAssessmentSubject(input?.subject),
    classes: parseAssessmentClasses(input?.classes),
    project_id: projectId,
    score: Number(score.toFixed(3)),
    note: normalizeText(input?.note).slice(0, 500),
    source: normalizeText(input?.source || 'schoolsystem').slice(0, 60),
    source_exam_date: normalizeText(input?.source_exam_date).slice(0, 40),
    source_exam_label: normalizeText(input?.source_exam_label).slice(0, 120),
    makeup_exam_date: normalizeText(input?.makeup_exam_date).slice(0, 40),
    makeup_exam_label: normalizeText(input?.makeup_exam_label).slice(0, 120),
    makeup_subjects: Array.isArray(input?.makeup_subjects)
      ? input.makeup_subjects.map(normalizeAssessmentSubject).filter(Boolean).slice(0, 8)
      : [],
    composite_missing_count: Math.max(0, Number(input?.composite_missing_count || 0) || 0)
  };
}

function buildAssessmentSyncChangeNote(item) {
  const parts = [];
  const sourceExam = item.source_exam_date || item.source_exam_label;
  if (sourceExam) parts.push(`来源考试：${sourceExam}`);
  if (item.makeup_subjects?.length) {
    parts.push(`合成口径：7月基准 + 二模补科`);
    parts.push(`二模补科科目：${item.makeup_subjects.join('、')}`);
    if (item.makeup_exam_date || item.makeup_exam_label) {
      parts.push(`二模来源：${item.makeup_exam_date || item.makeup_exam_label}`);
    }
  }
  if (item.composite_missing_count) parts.push(`补科缺失：${item.composite_missing_count}条，相关教师已跳过`);
  if (!parts.length) parts.push(`来源：${item.source || 'schoolsystem'}`);
  return parts.join('；').slice(0, 500);
}

// ---------------------------------------------------------------------------
// Teacher matching / data fetch helpers
// ---------------------------------------------------------------------------

function findAssessmentTeacherMatch(yearPeople, item) {
  const teacherName = normalizeAssessmentName(item.teacher_name);
  const candidates = yearPeople
    .filter((person) => normalizeAssessmentName(person.full_name) === teacherName)
    .map((person) => {
      let weight = 10;
      if (item.grade && normalizeAssessmentGrade(person.grade) === item.grade) weight += 4;
      if (item.subject && normalizeAssessmentSubject(person.subject) === item.subject) weight += 3;
      weight += Math.min(assessmentClassOverlap(person.classes, item.classes), 3);
      return { person, weight };
    })
    .sort((left, right) => right.weight - left.weight);
  if (!candidates.length) {
    return { teacher: null, ambiguous: false, candidateCount: 0 };
  }
  const topWeight = candidates[0].weight;
  const topCandidates = candidates.filter((candidate) => candidate.weight === topWeight);
  if (topCandidates.length > 1) {
    return {
      teacher: null,
      ambiguous: true,
      candidateCount: topCandidates.length,
      candidates: topCandidates.map((candidate) => ({
        full_name: candidate.person.full_name,
        grade: candidate.person.grade,
        subject: candidate.person.subject,
        classes: candidate.person.classes
      }))
    };
  }
  return { teacher: candidates[0].person, ambiguous: false, candidateCount: candidates.length };
}

async function fetchAssessmentTeachersForYear(env, academicYear) {
  const year = encodeURIComponent(academicYear);
  const [peopleRows, profileRows] = await Promise.all([
    assessmentRestFetch(env, `/rest/v1/year_people?select=user_id,grade,subject,classes,role,academic_year&academic_year=eq.${year}&role=eq.teacher`),
    assessmentRestFetch(env, '/rest/v1/profiles?select=id,full_name,username,role&role=eq.teacher')
  ]);
  const profileMap = new Map((Array.isArray(profileRows) ? profileRows : []).map((profile) => [normalizeText(profile.id), profile]));
  return (Array.isArray(peopleRows) ? peopleRows : []).map((person) => {
    const profile = profileMap.get(normalizeText(person.user_id)) || {};
    return {
      user_id: normalizeText(person.user_id),
      full_name: normalizeText(profile.full_name || profile.username || person.user_id),
      username: normalizeText(profile.username),
      grade: normalizeText(person.grade),
      subject: normalizeText(person.subject),
      classes: parseAssessmentClasses(person.classes),
      academic_year: normalizeText(person.academic_year)
    };
  }).filter((person) => person.user_id && person.full_name);
}

async function fetchAssessmentScoresForYear(env, academicYear) {
  const year = encodeURIComponent(academicYear);
  const rows = await assessmentRestFetch(env, `/rest/v1/assessment_scores?select=teacher_id,project_id,score,change_tag&academic_year=eq.${year}`);
  const map = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    map.set(`${normalizeText(row.teacher_id)}::${normalizeText(row.project_id)}`, row);
  });
  return map;
}

// ---------------------------------------------------------------------------
// Exported handler
// ---------------------------------------------------------------------------

export async function handleAssessmentScoreSync(request, env, session, payload) {
  if (!canSyncAssessmentScores(session)) return forbidden(request, 'No permission to sync assessment scores');
  const academicYear = normalizeAssessmentAcademicYear(payload?.academic_year);
  if (!academicYear) return badRequest(request, 'academic_year is invalid');
  const config = getAssessmentSupabaseConfig(env);
  if (!config.ready) {
    return jsonResponse(503, {
      ok: false,
      error: 'ASSESSMENT_SUPABASE_NOT_CONFIGURED',
      message: 'Set ASSESSMENT_SUPABASE_URL and ASSESSMENT_SUPABASE_SERVICE_ROLE_KEY on the Worker.'
    }, request);
  }

  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  if (!rawItems.length) return badRequest(request, 'items are required');
  if (rawItems.length > ASSESSMENT_SYNC_BATCH_LIMIT) return badRequest(request, 'too many items');
  const items = rawItems.map(normalizeAssessmentScoreItem).filter(Boolean);
  if (!items.length) return badRequest(request, 'no valid score items');

  const overwriteManual = payload?.overwrite_manual === true;
  const dryRun = payload?.dry_run === true;
  const [teachers, existingScores] = await Promise.all([
    fetchAssessmentTeachersForYear(env, academicYear),
    fetchAssessmentScoresForYear(env, academicYear)
  ]);

  const now = new Date().toISOString();
  const rows = [];
  const skipped = [];
  const projectCounts = {};
  const matchedTeacherIds = new Set();

  items.forEach((item) => {
    const match = findAssessmentTeacherMatch(teachers, item);
    if (match.ambiguous) {
      skipped.push({ teacher_name: item.teacher_name, grade: item.grade, subject: item.subject, project_id: item.project_id, reason: `目标考核系统教师匹配不唯一（${match.candidateCount}人）` });
      return;
    }
    const teacher = match.teacher;
    if (!teacher) {
      skipped.push({ teacher_name: item.teacher_name, grade: item.grade, subject: item.subject, project_id: item.project_id, reason: '目标考核系统教师名单未匹配' });
      return;
    }
    const existing = existingScores.get(`${teacher.user_id}::${item.project_id}`);
    if (existing && normalizeText(existing.change_tag) !== 'system_sync' && !overwriteManual) {
      skipped.push({ teacher_name: item.teacher_name, grade: item.grade, subject: item.subject, project_id: item.project_id, reason: '已有人工分数，未勾选覆盖' });
      return;
    }
    rows.push({
      academic_year: academicYear,
      teacher_id: teacher.user_id,
      project_id: item.project_id,
      score: item.score,
      note: item.note || '由 schoolsystem.com.cn 自动同步',
      status: 'submitted',
      scorer_id: null,
      scorer_name: 'system自动同步',
      updated_at: now,
      previous_score: existing?.score ?? null,
      previous_note: existing?.note ?? null,
      change_tag: 'system_sync',
      change_note: buildAssessmentSyncChangeNote(item)
    });
    matchedTeacherIds.add(teacher.user_id);
    projectCounts[item.project_id] = (projectCounts[item.project_id] || 0) + 1;
  });

  if (rows.length && !dryRun) {
    await assessmentRestFetch(env, '/rest/v1/assessment_scores?on_conflict=academic_year,teacher_id,project_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows)
    });
  }

  return jsonResponse(200, {
    ok: true,
    academic_year: academicYear,
    dry_run: dryRun,
    received: rawItems.length,
    valid: items.length,
    written: dryRun ? 0 : rows.length,
    would_write: rows.length,
    matched_teachers: matchedTeacherIds.size,
    skipped,
    project_counts: projectCounts
  }, request);
}
