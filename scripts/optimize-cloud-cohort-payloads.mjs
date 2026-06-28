import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const LZString = require('../public/assets/vendor/lz-string/lz-string.min.js');

const API_BASE = process.env.SYSTEM_DATA_API_BASE || 'https://schoolsystem.com.cn/api/system-data';
const PACKED_T_SCORE_SCALE = 10;
const WORKSPACE_SPLIT_VERSION = 'workspace-split-v1';
const WRITE = process.argv.includes('--write');

function text(value) {
  return String(value ?? '').trim();
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeCohortId(raw) {
  const value = text(raw);
  if (!value) return '';
  let match = value.match(/^cohort::(\d{4})/i);
  if (match) return match[1];
  match = value.match(/^(\d{4})(?!\d)/);
  if (match) return match[1];
  match = value.match(/(\d{4})\u7ea7/);
  if (match) return match[1];
  match = value.match(/(\d{4})/);
  return match ? match[1] : '';
}

function parsePayload(content) {
  let raw = content;
  if (typeof raw === 'string' && raw.startsWith('LZB64|')) {
    raw = LZString.decompressFromBase64(raw.slice(6));
  } else if (typeof raw === 'string' && raw.startsWith('LZ|')) {
    raw = LZString.decompressFromUTF16(raw.slice(3));
  }
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function packPayload(payload) {
  const json = JSON.stringify(compactPayloadForStorage(payload || {}));
  return `LZB64|${LZString.compressToBase64(json)}`;
}

function collectPackedSubjects(rows, subjectHint = []) {
  const subjects = [];
  const push = (value) => {
    const subject = text(value);
    if (subject && !subjects.includes(subject)) subjects.push(subject);
  };
  (Array.isArray(subjectHint) ? subjectHint : []).forEach(push);
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    Object.keys(row?.scores || {}).forEach(push);
    Object.keys(row?.ranks || {}).forEach((key) => {
      if (key !== 'total') push(key);
    });
  });
  return subjects;
}

function scalePackedScoreValue(value, scale = PACKED_T_SCORE_SCALE) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(value * scale)
    : value;
}

function restorePackedScoreValue(value, scale = 1) {
  return typeof value === 'number' && Number.isFinite(value) && scale > 1
    ? Number((value / scale).toFixed(1))
    : value;
}

function compactStudentExtras(extras, subjects = [], scale = PACKED_T_SCORE_SCALE) {
  if (!extras || typeof extras !== 'object') return null;
  const next = clone(extras);
  if (next.tScores && typeof next.tScores === 'object' && !Array.isArray(next.tScores)) {
    next.tScores = subjects.map((subject) => {
      const value = next.tScores[subject];
      return value === undefined ? null : scalePackedScoreValue(value, scale);
    });
  }
  if (Array.isArray(next.blankScoreSubjects) && next.blankScoreSubjects.length === 0) {
    delete next.blankScoreSubjects;
  }
  delete next.totalTScore;
  if (next.hasValidScore === true) delete next.hasValidScore;
  if (next.examRoom === '-') delete next.examRoom;
  if (typeof next.countyScope === 'string') delete next.countyScope;
  return Object.keys(next).length ? next : null;
}

function restoreStudentExtrasFromPacked(extras, subjects = [], scale = 1) {
  if (!extras || typeof extras !== 'object' || Array.isArray(extras)) return {};
  const next = clone(extras);
  if (Array.isArray(next.tScores)) {
    const tScores = {};
    subjects.forEach((subject, index) => {
      const value = next.tScores[index];
      if (value !== null && value !== undefined && value !== '') {
        tScores[subject] = restorePackedScoreValue(value, scale);
      }
    });
    next.tScores = tScores;
  }
  if (!Array.isArray(next.blankScoreSubjects)) next.blankScoreSubjects = [];
  return next;
}

function compactStudentRows(rows, subjectHint = []) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return [];
  const subjects = collectPackedSubjects(list, subjectHint);
  const reservedKeys = new Set([
    'school', 'class', 'name', 'id', 'total', 'scores', 'ranks',
    'uuid', 'status', 'townRank', 'schoolRank', 'classRank', 'countyRank', 'rankCounty'
  ]);
  const transientKeys = new Set(['_tempRank']);

  return {
    __packedRows: 'rows-v1',
    subjects,
    tScoreScale: PACKED_T_SCORE_SCALE,
    rows: list.map((row) => {
      const extras = {};
      Object.keys(row || {}).forEach((key) => {
        if (!reservedKeys.has(key) && !transientKeys.has(key)) extras[key] = clone(row[key]);
      });
      const totalTScore = typeof extras.totalTScore === 'number'
        ? scalePackedScoreValue(extras.totalTScore, PACKED_T_SCORE_SCALE)
        : null;
      const totalRanks = row?.ranks?.total && typeof row.ranks.total === 'object' ? row.ranks.total : {};
      const totalRankTuple = [
        totalRanks.class ?? row?.classRank ?? null,
        totalRanks.school ?? row?.schoolRank ?? null,
        totalRanks.township ?? row?.townRank ?? null,
        totalRanks.county ?? row?.countyRank ?? row?.rankCounty ?? null
      ];
      return [
        String(row?.school || ''),
        String(row?.class || ''),
        String(row?.name || ''),
        row?.id ?? null,
        row?.total ?? null,
        subjects.map((subject) => {
          const value = row?.scores && Object.prototype.hasOwnProperty.call(row.scores, subject)
            ? row.scores[subject]
            : null;
          return value === undefined ? null : value;
        }),
        totalRankTuple.some((value) => value != null) ? totalRankTuple : null,
        subjects.map((subject) => {
          const ranks = row?.ranks?.[subject];
          if (!ranks || typeof ranks !== 'object') return null;
          const tuple = [ranks.class ?? null, ranks.school ?? null, ranks.township ?? null, ranks.county ?? null];
          return tuple.some((value) => value != null) ? tuple : null;
        }),
        row?.uuid ?? null,
        row?.status ?? null,
        compactStudentExtras(extras, subjects, PACKED_T_SCORE_SCALE),
        totalTScore
      ];
    })
  };
}

function inflateStudentRows(packedRows, subjectHint = []) {
  if (!packedRows || typeof packedRows !== 'object' || packedRows.__packedRows !== 'rows-v1') {
    return Array.isArray(packedRows) ? packedRows : [];
  }
  const subjects = collectPackedSubjects([], Array.isArray(packedRows.subjects) ? packedRows.subjects : subjectHint);
  const scale = Number(packedRows.tScoreScale) || 1;
  return (Array.isArray(packedRows.rows) ? packedRows.rows : []).map((entry) => {
    if (!Array.isArray(entry)) return null;
    const row = {
      school: String(entry[0] || ''),
      class: String(entry[1] || ''),
      name: String(entry[2] || ''),
      total: entry[4] ?? 0,
      scores: {},
      ranks: {}
    };
    if (entry[3] !== null && entry[3] !== undefined && entry[3] !== '') row.id = entry[3];
    if (entry[8] !== null && entry[8] !== undefined && entry[8] !== '') row.uuid = entry[8];
    if (entry[9] !== null && entry[9] !== undefined && entry[9] !== '') row.status = entry[9];
    if (entry[11] !== null && entry[11] !== undefined && entry[11] !== '') {
      row.totalTScore = restorePackedScoreValue(entry[11], scale);
    }
    const scoreValues = Array.isArray(entry[5]) ? entry[5] : [];
    subjects.forEach((subject, index) => {
      const value = scoreValues[index];
      if (value !== null && value !== undefined && value !== '') row.scores[subject] = value;
    });
    const totalRanks = Array.isArray(entry[6]) ? entry[6] : null;
    if (totalRanks) {
      const rankMap = {};
      if (totalRanks[0] !== null && totalRanks[0] !== undefined) { rankMap.class = totalRanks[0]; row.classRank = totalRanks[0]; }
      if (totalRanks[1] !== null && totalRanks[1] !== undefined) { rankMap.school = totalRanks[1]; row.schoolRank = totalRanks[1]; }
      if (totalRanks[2] !== null && totalRanks[2] !== undefined) { rankMap.township = totalRanks[2]; row.townRank = totalRanks[2]; }
      if (totalRanks[3] !== null && totalRanks[3] !== undefined) { rankMap.county = totalRanks[3]; row.countyRank = totalRanks[3]; }
      if (Object.keys(rankMap).length) row.ranks.total = rankMap;
    }
    const subjectRanks = Array.isArray(entry[7]) ? entry[7] : [];
    subjects.forEach((subject, index) => {
      const tuple = subjectRanks[index];
      if (!Array.isArray(tuple)) return;
      const rankMap = {};
      if (tuple[0] !== null && tuple[0] !== undefined) rankMap.class = tuple[0];
      if (tuple[1] !== null && tuple[1] !== undefined) rankMap.school = tuple[1];
      if (tuple[2] !== null && tuple[2] !== undefined) rankMap.township = tuple[2];
      if (tuple[3] !== null && tuple[3] !== undefined) rankMap.county = tuple[3];
      if (Object.keys(rankMap).length) row.ranks[subject] = rankMap;
    });
    const restoredExtras = restoreStudentExtrasFromPacked(entry[10], subjects, scale);
    Object.keys(restoredExtras || {}).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(row, key)) row[key] = clone(restoredExtras[key]);
    });
    if (!Object.prototype.hasOwnProperty.call(row, 'examRoom')) row.examRoom = restoredExtras.examRoom || '-';
    if (!Object.prototype.hasOwnProperty.call(row, 'hasValidScore')) {
      row.hasValidScore = Object.values(row.scores || {}).some((value) => typeof value === 'number' && Number.isFinite(value));
    }
    if (!Object.prototype.hasOwnProperty.call(row, 'countyScope')) row.countyScope = row.townshipRank ? 'township' : 'county';
    return row;
  }).filter(Boolean);
}

function inflatePayload(payload) {
  const next = clone(payload || {});
  const subjectHint = Array.isArray(next.SUBJECTS) ? next.SUBJECTS : [];
  const rows = inflateStudentRows(next.RAW_DATA, subjectHint);
  if (rows.length) next.RAW_DATA = rows;
  if (next.COHORT_DB?.exams && typeof next.COHORT_DB.exams === 'object') {
    Object.entries(next.COHORT_DB.exams).forEach(([examId, exam]) => {
      if (!exam || typeof exam !== 'object') return;
      const examRows = inflateStudentRows(exam.data, Array.isArray(exam.subjects) ? exam.subjects : subjectHint);
      if (examRows.length) next.COHORT_DB.exams[examId].data = examRows;
    });
  }
  return next;
}

function compactExamPayloadForStorage(examPayload) {
  if (!examPayload || typeof examPayload !== 'object') return examPayload;
  const nextExam = clone(examPayload);
  const subjectHint = Array.isArray(nextExam.subjects) ? nextExam.subjects : [];
  if (Array.isArray(nextExam.data) && nextExam.data.length) nextExam.data = compactStudentRows(nextExam.data, subjectHint);
  delete nextExam.schools;
  return nextExam;
}

function compactPayloadForStorage(payload) {
  const next = clone(payload || {});
  const topLevelSubjects = Array.isArray(next.SUBJECTS) ? next.SUBJECTS : [];
  delete next.CURRENT_REPORT_STUDENT;
  delete next.CURRENT_CONTEXT_STUDENTS;
  delete next.VA_VIEW_MODE;
  delete next.__PROGRESS_QUICK_MODE;
  delete next.TEACHER_STATS;
  if (Array.isArray(next.RAW_DATA) && next.RAW_DATA.length) next.RAW_DATA = compactStudentRows(next.RAW_DATA, topLevelSubjects);
  if (Array.isArray(next.PREV_DATA) && next.PREV_DATA.length) next.PREV_DATA = compactStudentRows(next.PREV_DATA, topLevelSubjects);
  delete next.SCHOOLS;
  if (next.COHORT_DB?.exams && typeof next.COHORT_DB.exams === 'object') {
    const compactExams = {};
    Object.entries(next.COHORT_DB.exams).forEach(([examId, examPayload]) => {
      const exactExamId = text(examId);
      if (exactExamId) compactExams[exactExamId] = compactExamPayloadForStorage(examPayload);
    });
    next.COHORT_DB.exams = compactExams;
  }
  next.__CLOUD_PAYLOAD_FORMAT = 'compact-v2';
  return next;
}

function getCurrentExamId(payload) {
  return text(payload?.CURRENT_EXAM_ID || payload?.COHORT_DB?.currentExamId);
}

function compactExamMetadata(examId, examPayload = {}) {
  const next = {};
  Object.entries(examPayload && typeof examPayload === 'object' ? examPayload : {}).forEach(([field, value]) => {
    if (field === 'data' || field === 'schools' || field === 'teacherMap') return;
    next[field] = clone(value);
  });
  next.examId = text(next.examId || examId);
  const rowCount = Array.isArray(examPayload?.data)
    ? examPayload.data.length
    : (examPayload?.data && Array.isArray(examPayload.data.rows)
      ? examPayload.data.rows.length
      : Number(examPayload?.rowCount || 0));
  if (rowCount) next.rowCount = rowCount;
  return next;
}

function deriveExamLabel(examId) {
  const parts = text(examId).split(/[-_]/).filter(Boolean);
  return parts.slice(-3).join(' ') || text(examId);
}

function buildCurrentExamEntry(payload, examId) {
  const rows = Array.isArray(payload?.RAW_DATA) ? payload.RAW_DATA : [];
  if (!examId || !rows.length) return null;
  const existing = payload?.COHORT_DB?.exams?.[examId] || {};
  return {
    ...clone(existing),
    examId,
    examLabel: existing.examLabel || deriveExamLabel(examId),
    meta: clone(existing.meta || payload?.ARCHIVE_META || payload?.CONFIG || {}),
    data: clone(rows),
    schools: clone(existing.schools || payload?.SCHOOLS || {}),
    teacherMap: clone(existing.teacherMap || payload?.TEACHER_MAP || {}),
    subjects: clone(existing.subjects || payload?.SUBJECTS || []),
    thresholds: clone(existing.thresholds || payload?.THRESHOLDS || {}),
    config: clone(existing.config || payload?.CONFIG || {}),
    fingerprint: text(existing.fingerprint || payload?.FINGERPRINT),
    updatedAt: existing.updatedAt || ''
  };
}

function buildWorkspaceMetaPayload(payload, workspaceKey) {
  const source = clone(payload || {});
  [
    'RAW_DATA', 'SCHOOLS', 'PREV_DATA', 'PROGRESS_CACHE', 'PROGRESS_CACHE_FULL',
    'LAST_VA_DATA', 'CURRENT_REPORT_STUDENT', 'CURRENT_CONTEXT_STUDENTS', 'TEACHER_STATS'
  ].forEach((field) => delete source[field]);
  const currentExamId = getCurrentExamId(payload);
  const sourceExams = payload?.COHORT_DB?.exams && typeof payload.COHORT_DB.exams === 'object' ? payload.COHORT_DB.exams : {};
  const exams = {};
  Object.entries(sourceExams).forEach(([examId, examPayload]) => {
    const exactExamId = text(examId);
    if (exactExamId) exams[exactExamId] = compactExamMetadata(exactExamId, examPayload);
  });
  const currentEntry = buildCurrentExamEntry(payload, currentExamId);
  if (currentEntry) exams[currentExamId] = compactExamMetadata(currentExamId, currentEntry);
  const cohortDb = source.COHORT_DB && typeof source.COHORT_DB === 'object' ? source.COHORT_DB : {};
  source.COHORT_DB = {
    ...cohortDb,
    exams,
    currentExamId: currentExamId || cohortDb.currentExamId || ''
  };
  source.CURRENT_PROJECT_KEY = text(source.CURRENT_PROJECT_KEY || workspaceKey);
  source.CURRENT_EXAM_ID = currentExamId || source.COHORT_DB.currentExamId || '';
  source.__CLOUD_WORKSPACE_SPLIT_VERSION = WORKSPACE_SPLIT_VERSION;
  source.__CURRENT_EXAM_KEY = source.CURRENT_EXAM_ID;
  source.__EXAM_KEYS = Object.keys(exams);
  source.__META_UPDATED_AT = new Date().toISOString();
  return source;
}

function buildExamShardPayload(payload, examId, examPayload) {
  const exactExamId = text(examId);
  const exam = examPayload && typeof examPayload === 'object' ? examPayload : {};
  const rows = Array.isArray(exam.data) && exam.data.length
    ? exam.data
    : (exactExamId === getCurrentExamId(payload) && Array.isArray(payload?.RAW_DATA) ? payload.RAW_DATA : []);
  if (!exactExamId || !rows.length) return null;
  const compactExam = compactExamMetadata(exactExamId, {
    ...exam,
    examId: exactExamId,
    examLabel: exam.examLabel || deriveExamLabel(exactExamId),
    data: rows,
    subjects: exam.subjects || payload?.SUBJECTS || [],
    thresholds: exam.thresholds || payload?.THRESHOLDS || {},
    config: exam.config || payload?.CONFIG || {},
    fingerprint: text(exam.fingerprint || payload?.FINGERPRINT)
  });
  return {
    CURRENT_PROJECT_KEY: payload?.CURRENT_PROJECT_KEY || '',
    CURRENT_COHORT_ID: payload?.CURRENT_COHORT_ID || payload?.COHORT_DB?.cohortId || normalizeCohortId(exactExamId),
    CURRENT_COHORT_META: clone(payload?.CURRENT_COHORT_META || payload?.COHORT_DB?.cohortMeta || null),
    CURRENT_EXAM_ID: exactExamId,
    CURRENT_TERM_ID: payload?.CURRENT_TERM_ID || '',
    CURRENT_TEACHER_TERM_ID: payload?.CURRENT_TEACHER_TERM_ID || '',
    ARCHIVE_META: clone(exam.meta || payload?.ARCHIVE_META || payload?.CONFIG || {}),
    ARCHIVE_LOCKED: payload?.ARCHIVE_LOCKED || '',
    ARCHIVE_LOCKED_KEY: payload?.ARCHIVE_LOCKED_KEY || '',
    RAW_DATA: clone(rows),
    SCHOOLS: clone(exam.schools || payload?.SCHOOLS || {}),
    SUBJECTS: clone(exam.subjects || payload?.SUBJECTS || []),
    THRESHOLDS: clone(exam.thresholds || payload?.THRESHOLDS || {}),
    TEACHER_MAP: clone(exam.teacherMap || payload?.TEACHER_MAP || {}),
    TEACHER_SCHOOL_MAP: clone(payload?.TEACHER_SCHOOL_MAP || {}),
    CONFIG: clone(exam.config || payload?.CONFIG || {}),
    MY_SCHOOL: payload?.MY_SCHOOL || '',
    TARGETS: clone(payload?.TARGETS || {}),
    INDICATOR_PARAMS: clone(payload?.INDICATOR_PARAMS || {}),
    SCHOOL_ALIAS_SETTINGS: clone(payload?.SCHOOL_ALIAS_SETTINGS || []),
    FINGERPRINT: text(exam.fingerprint || payload?.FINGERPRINT),
    timestamp: Number(exam.createdAt || payload?.timestamp || Date.now()),
    COHORT_DB: {
      cohortId: payload?.COHORT_DB?.cohortId || payload?.CURRENT_COHORT_ID || normalizeCohortId(exactExamId),
      cohortMeta: clone(payload?.COHORT_DB?.cohortMeta || payload?.CURRENT_COHORT_META || null),
      students: clone(payload?.COHORT_DB?.students || {}),
      teachingHistory: clone(payload?.COHORT_DB?.teachingHistory || {}),
      exams: { [exactExamId]: compactExam },
      currentExamId: exactExamId,
      resetPoints: clone(payload?.COHORT_DB?.resetPoints || [])
    }
  };
}

async function apiGet(params) {
  const url = new URL(API_BASE);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-store'
        }
      });
      if (!response.ok) throw new Error(`GET ${url} failed: ${response.status} ${await response.text()}`);
      return response.json();
    } catch (error) {
      lastError = error;
      console.warn(`retryable_get_error attempt=${attempt} url=${url} detail=${error?.message || error}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

async function apiPost(rows) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(rows)
  });
  if (!response.ok) throw new Error(`POST failed: ${response.status} ${await response.text()}`);
}

async function fetchExactRow(key) {
  console.log(`fetch key=${key}`);
  const row = await apiGet({
    select: 'key,content,updated_at,size_bytes',
    key: `eq.${key}`,
    limit: '1'
  });
  return Array.isArray(row) ? row[0] : row;
}

function rowCountOf(payload) {
  if (Array.isArray(payload?.RAW_DATA)) return payload.RAW_DATA.length;
  if (Array.isArray(payload?.RAW_DATA?.rows)) return payload.RAW_DATA.rows.length;
  return 0;
}

function shouldConsiderKey(key) {
  const value = text(key);
  if (!value || value.startsWith('BACKUP_')) return false;
  if (/^cohort::\d{4}/i.test(value)) return true;
  return /^20\d{2}/.test(value);
}

function isCohortWorkspaceKey(key) {
  return /^cohort::\d{4}$/i.test(text(key));
}

async function main() {
  console.log(`mode=${WRITE ? 'write' : 'dry-run'} api=${API_BASE}`);
  const indexRows = await apiGet({
    select: 'key,updated_at,size_bytes',
    order: 'updated_at.desc',
    limit: '500'
  });
  const candidateKeys = indexRows
    .map((row) => row.key)
    .filter(shouldConsiderKey);

  const writes = [];
  const handled = new Set();
  const report = [];

  for (const key of candidateKeys) {
    if (handled.has(key)) continue;
    const row = await fetchExactRow(key);
    if (!row?.content) continue;
    const payload = inflatePayload(parsePayload(row.content));
    const before = Number(row.size_bytes || Buffer.byteLength(row.content));
    const currentExamId = getCurrentExamId(payload);
    const cohortId = normalizeCohortId(payload?.CURRENT_COHORT_ID || payload?.COHORT_DB?.cohortId || key);
    const rawCount = rowCountOf(payload);
    const sourceExams = payload?.COHORT_DB?.exams && typeof payload.COHORT_DB.exams === 'object'
      ? payload.COHORT_DB.exams
      : {};

    const hasShardableExam = !!currentExamId
      && (rawCount || Object.values(sourceExams).some((exam) => Array.isArray(exam?.data) && exam.data.length));
    if (isCohortWorkspaceKey(key) && hasShardableExam) {
      const metaContent = packPayload(buildWorkspaceMetaPayload(payload, key));
      writes.push({ key, content: metaContent, updated_at: new Date().toISOString() });
      report.push({ key, kind: 'meta', cohortId, before, after: Buffer.byteLength(metaContent), rows: rawCount, currentExamId });

      for (const [examId, examPayload] of Object.entries(sourceExams)) {
        const exactExamId = text(examId);
        const shard = buildExamShardPayload(payload, exactExamId, examPayload);
        if (!shard) continue;
        const content = packPayload(shard);
        writes.push({ key: exactExamId, content, updated_at: new Date().toISOString() });
        handled.add(exactExamId);
        report.push({ key: exactExamId, kind: 'exam-from-meta', cohortId, before: 0, after: Buffer.byteLength(content), rows: rowCountOf(shard), currentExamId: exactExamId });
      }

      if (currentExamId && !handled.has(currentExamId)) {
        const shard = buildExamShardPayload(payload, currentExamId, buildCurrentExamEntry(payload, currentExamId));
        if (shard) {
          const content = packPayload(shard);
          writes.push({ key: currentExamId, content, updated_at: new Date().toISOString() });
          handled.add(currentExamId);
          report.push({ key: currentExamId, kind: 'current-from-meta', cohortId, before: 0, after: Buffer.byteLength(content), rows: rowCountOf(shard), currentExamId });
        }
      }
      handled.add(key);
      continue;
    }

    if (!rawCount) continue;
    const content = packPayload(payload);
    if (Buffer.byteLength(content) >= before) continue;
    writes.push({ key, content, updated_at: new Date().toISOString() });
    handled.add(key);
    report.push({ key, kind: 'exam-in-place', cohortId, before, after: Buffer.byteLength(content), rows: rawCount, currentExamId });
  }

  report.sort((a, b) => String(a.cohortId).localeCompare(String(b.cohortId)) || String(a.key).localeCompare(String(b.key), 'zh-CN'));
  for (const item of report) {
    const delta = item.before ? item.before - item.after : 0;
    const pct = item.before ? `${((delta / item.before) * 100).toFixed(1)}%` : 'new';
    console.log([
      item.kind.padEnd(15),
      `cohort=${item.cohortId || '-'}`,
      `rows=${item.rows}`,
      `before=${item.before}`,
      `after=${item.after}`,
      `saved=${delta}`,
      `pct=${pct}`,
      `key=${item.key}`
    ].join(' '));
  }
  console.log(`planned_writes=${writes.length}`);

  if (WRITE && writes.length) {
    await apiPost(writes);
    console.log(`written=${writes.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
