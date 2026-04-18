(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerTeacherRuntime) return;
    root.DataManagerTeacherRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerTeacherRuntime(root) {
    function safeClone(value) {
        try {
            return JSON.parse(JSON.stringify(value || {}));
        } catch (_) {
            return {};
        }
    }

    function safeToast(text, type) {
        if (root.UI && typeof root.UI === 'object' && typeof root.UI.toast === 'function') {
            root.UI.toast(text, type);
        }
    }

    function callManagerMethod(manager, name, args) {
        if (!manager || typeof manager[name] !== 'function') return;
        return manager[name].apply(manager, args || []);
    }

    function switchTeacherTerm(manager, termId) {
        if (!termId) return;
        const exactTermId = String(termId || '').trim();

        const storageResult = typeof root.syncTeacherTermStorage === 'function'
            ? (root.syncTeacherTermStorage(exactTermId) || {})
            : {};
        const parts = exactTermId.split('_');
        const gradeInfo = parts[2] || '';
        const baseTermId = String(storageResult.baseTermId || parts.slice(0, 2).join('_') || exactTermId).trim();

        if (gradeInfo) {
            const gradeMatch = gradeInfo.match(/(\d+)/);
            const yearMatch = parts[0] && parts[0].match(/(\d{4})/);
            if (gradeMatch && yearMatch && typeof root.writeWorkspaceCohortId === 'function') {
                const grade = parseInt(gradeMatch[1], 10);
                const currentYear = parseInt(yearMatch[1], 10);
                const cohortId = currentYear - (grade - 6);
                root.writeWorkspaceCohortId(String(cohortId));
            }
        }

        const resolved = typeof root.resolveTeacherHistoryEntry === 'function'
            ? root.resolveTeacherHistoryEntry(exactTermId)
            : null;

        if (resolved) {
            if (typeof root.syncTeacherTermStorage === 'function') {
                root.syncTeacherTermStorage(resolved.key);
            }
            if (typeof root.setTeacherMap === 'function') {
                root.setTeacherMap(safeClone(resolved.map || {}));
            }
            if (typeof root.setTeacherSchoolMap === 'function') {
                root.setTeacherSchoolMap(safeClone(resolved.schoolMap || {}));
            }
            callManagerMethod(manager, 'renderTeachers');
            callManagerMethod(manager, 'refreshTeacherAnalysis');
            return;
        }

        if (typeof root.setTeacherMap === 'function') root.setTeacherMap({});
        if (typeof root.setTeacherSchoolMap === 'function') root.setTeacherSchoolMap({});
        callManagerMethod(manager, 'renderTeachers');

        console.log(`⚠️ 本地无学期 ${baseTermId || exactTermId} 的任课数据，尝试从云端同步...`);
        if (root.CloudManager && typeof root.CloudManager.loadTeachers === 'function') {
            safeToast('📧 正在从云端加载该学期任课表...', 'info');
            root.CloudManager.loadTeachers({ background: true }).then((ok) => {
                if (!ok) safeToast('☁️ 云端暂无该学期任课数据', 'warning');
            }).catch((error) => {
                console.warn('云端加载失败:', error);
                safeToast('☁️ 云端暂无该学期任课数据', 'warning');
            });
        }
    }

    function syncTeacherHistory(manager, opts = {}) {
        const termId = opts.termId
            || (typeof root.getPreferredTeacherTermId === 'function' ? root.getPreferredTeacherTermId() : '')
            || (typeof root.buildTeacherTermId === 'function' && typeof root.getExamMetaFromUI === 'function'
                ? root.buildTeacherTermId(root.getExamMetaFromUI())
                : '');
        if (!termId) return;

        if (typeof root.syncTeacherTermStorage === 'function') root.syncTeacherTermStorage(termId);
        if (!root.CohortDB || typeof root.CohortDB.ensure !== 'function') return;

        const db = root.CohortDB.ensure();
        db.teachingHistory = db.teachingHistory || {};
        const savedAt = (() => {
            const raw = opts.timestamp;
            if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
            if (typeof raw === 'string') {
                const parsed = Date.parse(raw);
                if (!Number.isNaN(parsed)) return parsed;
            }
            return Date.now();
        })();

        db.teachingHistory[termId] = {
            map: safeClone(root.TEACHER_MAP || {}),
            schoolMap: safeClone(root.TEACHER_SCHOOL_MAP || {}),
            savedAt,
            source: opts.source || 'local'
        };

        callManagerMethod(manager, 'refreshTeacherAnalysis');
    }

    function ensureTeacherMap(_manager, triggerCloud) {
        const termId = typeof root.getPreferredTeacherTermId === 'function'
            ? root.getPreferredTeacherTermId()
            : '';
        if (!termId) return false;
        if (root.TEACHER_MAP && Object.keys(root.TEACHER_MAP).length > 0) return true;

        const resolved = typeof root.resolveTeacherHistoryEntry === 'function'
            ? root.resolveTeacherHistoryEntry(termId)
            : null;
        if (resolved) {
            if (typeof root.syncTeacherTermStorage === 'function') root.syncTeacherTermStorage(resolved.key);
            if (typeof root.setTeacherMap === 'function') root.setTeacherMap(safeClone(resolved.map || {}));
            if (typeof root.setTeacherSchoolMap === 'function') root.setTeacherSchoolMap(safeClone(resolved.schoolMap || {}));
            return true;
        }

        if (triggerCloud && root.CloudManager && typeof root.CloudManager.loadTeachers === 'function') {
            root.CloudManager.loadTeachers({ background: true });
        }
        return false;
    }

    function refreshTeacherAnalysis() {
        const doc = root.document || null;
        const section = doc && typeof doc.getElementById === 'function'
            ? doc.getElementById('teacher-analysis')
            : null;

        if (typeof root.syncTeacherAnalysisSchoolContext === 'function') {
            root.syncTeacherAnalysisSchoolContext();
        }

        if (section && section.classList && typeof section.classList.contains === 'function' && section.classList.contains('active')) {
            if (typeof root.renderTeacherAnalysisState === 'function') {
                root.renderTeacherAnalysisState();
            } else if (typeof root.analyzeTeachers === 'function') {
                root.analyzeTeachers();
            }
            if (typeof root.updateStatusPanel === 'function') {
                root.updateStatusPanel();
            }
        }
    }

    return {
        switchTeacherTerm,
        syncTeacherHistory,
        ensureTeacherMap,
        refreshTeacherAnalysis
    };
});
