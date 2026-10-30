// Server-side access policy for the managed REST tables exposed under /sb/rest/v1/*.
// Every request must carry a valid session; reads and mutations are scoped by role
// so the browser-side filters (issue-manager-runtime / logger-runtime) are no longer
// the only line of defence.
import { normalizeText } from './worker-http-helpers.js';
import { hasRole, hasAnyRole, isAdmin } from './worker-auth.js';

const READ_METHODS = new Set(['GET', 'HEAD']);

function escapeLikePrefix(value) {
  return normalizeText(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}

// Returns { allowed: false } or { allowed: true, scope: { clause, bindings } }.
// `clause` is an SQL boolean expression (without WHERE) that is AND-ed onto the
// caller-provided filters, or '' for unrestricted access.
export function resolveIssuesAccess(session, method) {
  const verb = String(method || 'GET').toUpperCase();
  if (verb === 'POST') return { allowed: true, scope: { clause: '', bindings: [] } };

  if (isAdmin(session)) return { allowed: true, scope: { clause: '', bindings: [] } };

  const school = normalizeText(session?.school);
  const className = normalizeText(session?.class_name);

  if (hasRole(session, 'director') && school) {
    return { allowed: true, scope: { clause: 'school = ?', bindings: [school] } };
  }
  if (hasRole(session, 'grade_director') && className) {
    return {
      allowed: true,
      scope: { clause: "student_class LIKE ? ESCAPE '\\'", bindings: [`${escapeLikePrefix(className)}%`] }
    };
  }
  if (hasRole(session, 'class_teacher') && className) {
    return { allowed: true, scope: { clause: 'student_class = ?', bindings: [className] } };
  }
  return { allowed: false };
}

export function resolveSystemLogsAccess(session, method) {
  const verb = String(method || 'GET').toUpperCase();
  if (verb === 'POST') return { allowed: true, scope: { clause: '', bindings: [] } };
  if (READ_METHODS.has(verb) && hasAnyRole(session, ['admin', 'director'])) {
    return { allowed: true, scope: { clause: '', bindings: [] } };
  }
  // Audit records may only be altered or removed by administrators.
  if (isAdmin(session)) return { allowed: true, scope: { clause: '', bindings: [] } };
  return { allowed: false };
}

export function buildSessionOperatorLabel(session) {
  const name = normalizeText(session?.teacher_name) || normalizeText(session?.username) || 'unknown';
  const role = normalizeText(session?.role) || 'guest';
  return `${name} (${role})`;
}

export function mergeWhereWithScope(where, scope) {
  if (!scope || !scope.clause) return where;
  const base = String(where?.clause || '').replace(/^\s*WHERE\s+/i, '');
  const clause = base ? `WHERE (${base}) AND (${scope.clause})` : `WHERE ${scope.clause}`;
  return { clause, bindings: [...(where?.bindings || []), ...(scope.bindings || [])] };
}
