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
    let activeTermId = '';

    function safeClone(value) {
        try {
            return JSON.parse(JSON.stringify(value || {}));
        } catch (_) {
            return {};
        }
    }

    function asPlainMap(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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

    function sameSchoolName(left, right) {
        const leftName = String(left || '').trim();
        const rightName = String(right || '').trim();
        if (!leftName || !rightName) return leftName === rightName;
        if (typeof root.areSchoolNamesEquivalent === 'function') {
            return root.areSchoolNamesEquivalent(leftName, rightName);
        }
        return leftName === rightName;
    }

    function buildTeacherImportMaps(assignments) {
        const teacherMap = {};
        const schoolMap = {};
        const conflicts = [];
        const imported = {};

        (Array.isArray(assignments) ? assignments : []).forEach((assignment) => {
            const key = String(assignment && assignment.key || '').trim();
            const teacher = String(assignment && assignment.teacher || '').trim();
            const school = String(assignment && assignment.school || '').trim();
            if (!key || !teacher) return;

            const current = imported[key];
            if (current) {
                const isSameSchool = sameSchoolName(current.school, school);
                if (!isSameSchool || current.teacher !== teacher) {
                    conflicts.push({
                        key,
                        first: current,
                        next: { key, teacher, school }
                    });
                }
                return;
            }

            imported[key] = { key, teacher, school };
            teacherMap[key] = teacher;
            if (school) schoolMap[key] = school;
        });

        return {
            teacherMap,
            schoolMap,
            conflicts,
            count: Object.keys(teacherMap).length
        };
    }

    function formatTeacherImportConflictMessage(conflicts) {
        const conflictLines = (Array.isArray(conflicts) ? conflicts : []).slice(0, 5).map((conflict) => {
            const firstSchool = conflict.first.school || '未填写学校';
            const nextSchool = conflict.next.school || '未填写学校';
            return `- ${conflict.key}: ${firstSchool} / ${nextSchool}`;
        });
        return `❌ 任课表存在不能安全合并的重复课程\n\n当前任课数据按“班级 + 学科”保存，检测到以下记录会互相覆盖：\n${conflictLines.join('\n')}\n\n对于存在重复班级/学科的学校，请分别上传任课表，并将 Sheet 名改为学校名称。原有任课数据未被修改。`;
    }

    function formatTeacherSchoolOwnershipConflictMessage(key, existingSchool, selectedSchool) {
        return `❌ ${String(key || '').replace('_', ' ')} 已属于 ${existingSchool}，不能直接覆盖为 ${selectedSchool} 的教师。\n\n请分别维护存在同名班级/学科的学校任课表。`;
    }

    function parseTeacherTermContext(termId, fallbackCohortId = '') {
        const exactTermId = String(termId || '').trim();
        const parts = exactTermId.split('_').filter(Boolean);
        const academicYear = /^\d{4}-\d{4}$/.test(parts[0] || '') ? parts[0] : '';
        const term = parts[1] || '';
        const gradeMatch = String(parts[2] || '').match(/(\d+)/);
        const grade = gradeMatch ? Number(gradeMatch[1]) : 0;
        const yearMatch = academicYear.match(/^(\d{4})/);
        const inferredCohortId = yearMatch && grade >= 6
            ? String(Number(yearMatch[1]) - (grade - 6))
            : '';
        const cohortId = inferredCohortId || String(fallbackCohortId || '').trim();
        const scopeParts = [
            cohortId ? `${cohortId}届` : '',
            academicYear ? `${academicYear}学年` : '',
            term,
            grade ? `${grade}年级` : ''
        ].filter(Boolean);
        return {
            termId: exactTermId,
            academicYear,
            term,
            grade,
            cohortId,
            label: scopeParts.join(' · ') || exactTermId || '未选择学期'
        };
    }

    function summarizeTeacherImportContext(assignments, termId, fallbackCohortId = '') {
        const context = parseTeacherTermContext(termId, fallbackCohortId);
        const schools = new Set();
        const subjects = new Set();
        const detectedGrades = new Set();
        let unknownGradeCount = 0;
        (Array.isArray(assignments) ? assignments : []).forEach((assignment) => {
            const key = String(assignment?.key || '').trim();
            const separator = key.indexOf('_');
            const className = separator >= 0 ? key.slice(0, separator) : key;
            const subject = separator >= 0 ? key.slice(separator + 1) : '';
            const gradeMatch = String(className || '').match(/^\s*(\d{1,2})/);
            const grade = gradeMatch ? Number(String(gradeMatch[1])[0]) : 0;
            if (grade >= 6 && grade <= 9) detectedGrades.add(grade);
            else unknownGradeCount += 1;
            if (subject) subjects.add(subject);
            if (assignment?.school) schools.add(String(assignment.school).trim());
        });
        const mismatchedGrades = context.grade
            ? [...detectedGrades].filter((grade) => grade !== context.grade).sort((a, b) => a - b)
            : [];
        return {
            ...context,
            assignmentCount: Array.isArray(assignments) ? assignments.length : 0,
            schoolCount: schools.size,
            subjectCount: subjects.size,
            detectedGrades: [...detectedGrades].sort((a, b) => a - b),
            schoolNames: [...schools].sort(),
            mismatchedGrades,
            unknownGradeCount
        };
    }

    function switchTeacherTerm(manager, termId) {
        if (!termId) return;
        const exactTermId = String(termId || '').trim();
        const storedTermId = typeof root.readCurrentTeacherTermId === 'function'
            ? String(root.readCurrentTeacherTermId() || '').trim()
            : activeTermId;
        if (activeTermId === exactTermId && storedTermId === exactTermId
            && root.TEACHER_MAP && Object.keys(root.TEACHER_MAP).length > 0) {
            callManagerMethod(manager, 'renderTeacherContextStatus');
            return true;
        }

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
            activeTermId = exactTermId;
            if (typeof root.syncTeacherTermStorage === 'function') {
                root.syncTeacherTermStorage(resolved.key);
            }
            if (typeof root.setTeacherMap === 'function') {
                root.setTeacherMap(asPlainMap(resolved.map));
            }
            if (typeof root.setTeacherSchoolMap === 'function') {
                root.setTeacherSchoolMap(asPlainMap(resolved.schoolMap));
            }
            callManagerMethod(manager, 'renderTeachers');
            callManagerMethod(manager, 'renderTeacherContextStatus');
            callManagerMethod(manager, 'refreshTeacherAnalysis');
            return true;
        }

        activeTermId = exactTermId;
        if (typeof root.setTeacherMap === 'function') root.setTeacherMap({});
        if (typeof root.setTeacherSchoolMap === 'function') root.setTeacherSchoolMap({});
        callManagerMethod(manager, 'renderTeachers');
        callManagerMethod(manager, 'renderTeacherContextStatus');

        console.log(`⚠️ 本地无学期 ${baseTermId || exactTermId} 的任课数据，尝试从云端同步...`);
        if (root.CloudManager && typeof root.CloudManager.loadTeachers === 'function') {
            safeToast('📧 正在从云端加载该学期任课表...', 'info');
            root.CloudManager.loadTeachers({ background: true, force: true, preferRemote: true }).then((ok) => {
                if (!ok) safeToast('☁️ 云端暂无该学期任课数据', 'warning');
            }).catch((error) => {
                console.warn('云端加载失败:', error);
                safeToast('☁️ 云端暂无该学期任课数据', 'warning');
            });
        }
        return false;
    }

    function syncTeacherHistory(manager, opts = {}) {
        const termId = opts.termId
            || (typeof root.getPreferredTeacherTermId === 'function' ? root.getPreferredTeacherTermId() : '')
            || (typeof root.buildTeacherTermId === 'function' && typeof root.getExamMetaFromUI === 'function'
                ? root.buildTeacherTermId(root.getExamMetaFromUI())
                : '');
        if (!termId) return;

        activeTermId = String(termId || '').trim();
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

        if (opts.deferAnalysis !== true) {
            callManagerMethod(manager, 'refreshTeacherAnalysis');
        }
    }

    function isTeacherMapCompatibleWithTerm(teacherMap, termId) {
        const keys = Object.keys(asPlainMap(teacherMap));
        if (!keys.length) return false;
        const g = parseTeacherTermContext(termId).grade;
        if (!g) return true;
        let seen = 0, hit = 0;
        keys.forEach((k) => {
            const m = String(k || '').split('_')[0].trim().match(/^([6-9])(?:[.\-\s]|\d{2})/);
            if (!m) return;
            seen++;
            if (m[1] === String(g)) hit++;
        });
        return !seen || hit > 0;
    }

    function ensureTeacherMap(_manager, triggerCloud) {
        const termId = typeof root.getPreferredTeacherTermId === 'function' ? root.getPreferredTeacherTermId() : '';
        if (!termId) return false;
        if (root.TEACHER_MAP && Object.keys(root.TEACHER_MAP).length > 0 && isTeacherMapCompatibleWithTerm(root.TEACHER_MAP, termId)) return true;

        const resolved = typeof root.resolveTeacherHistoryEntry === 'function' ? root.resolveTeacherHistoryEntry(termId) : null;
        if (resolved && isTeacherMapCompatibleWithTerm(resolved.map, termId)) {
            activeTermId = String(termId || '').trim();
            if (typeof root.syncTeacherTermStorage === 'function') root.syncTeacherTermStorage(resolved.key);
            if (typeof root.setTeacherMap === 'function') root.setTeacherMap(asPlainMap(resolved.map));
            if (typeof root.setTeacherSchoolMap === 'function') root.setTeacherSchoolMap(asPlainMap(resolved.schoolMap));
            return true;
        }

        if (triggerCloud && root.CloudManager && typeof root.CloudManager.loadTeachers === 'function') {
            Promise.resolve(root.CloudManager.loadTeachers({ background: true, force: true, preferRemote: true }))
                .then((ok) => {
                    if (!ok) return;
                    refreshTeacherAnalysis();
                    if (root.document?.getElementById?.('county-teacher-portrait')?.classList?.contains('active')
                        && typeof root.renderCountyTeacherPortrait === 'function') {
                        root.renderCountyTeacherPortrait();
                    }
                }).catch(() => {});
        }
        return false;
    }

    function refreshTeacherAnalysis() {
        const doc = root.document || null;
        const section = doc && typeof doc.getElementById === 'function'
            ? doc.getElementById('teacher-analysis')
            : null;
        const isTeacherAnalysisActive = !!(
            section
            && section.classList
            && typeof section.classList.contains === 'function'
            && section.classList.contains('active')
        );
        if (!isTeacherAnalysisActive) return;

        if (typeof root.syncTeacherAnalysisSchoolContext === 'function') {
            root.syncTeacherAnalysisSchoolContext();
        }
        if (typeof root.renderTeacherAnalysisState === 'function') {
            root.renderTeacherAnalysisState();
        } else if (typeof root.analyzeTeachers === 'function') {
            root.analyzeTeachers();
        }
        if (typeof root.updateStatusPanel === 'function') {
            root.updateStatusPanel();
        }
    }

    const SL_SUBJ = [['语文','语文'],['数学','数学'],['英语','英语'],['物理','物理'],['化学','化学'],['道德与法治','政治'],['道法','政治'],['政治','政治'],['历史','历史'],['地理','地理'],['生物','生物'],['科学','科学']];
    const normSlKey = (v) => String(v == null ? '' : v).normalize('NFKC').replace(/[（(][^）)]*[）)]/g, '').trim().toLowerCase().replace(/[\s\u3000_./\\\-—:：()（）【】\[\]*＊]/g, '').replace(/(?:必填|必选|填写|选填|勿改|留空跳过|留空不变)$/g, '');
    function inferSubjectFromText(raw, normSubj) {
        const s = String(raw || '').trim();
        for (const [t, c] of SL_SUBJ) if (s.includes(t)) return typeof normSubj === 'function' ? normSubj(c) : c;
        return '';
    }
    function parseSpaceLedgerRosterRows(rows, options = {}) {
        const list = Array.isArray(rows) ? rows : [];
        const first = list[0];
        if (!first || typeof first !== 'object' || Array.isArray(first)) return { matched: false, assignments: [], homerooms: {}, skippedWithoutSubject: [] };
        const km = {};
        Object.keys(first).forEach((rk) => {
            const nk = normSlKey(rk);
            if (!nk) return;
            if (!km.name && ['姓名','教师姓名','老师姓名','name','displayname'].includes(nk)) km.name = rk;
            else if (!km.subjectClasses && ['任课班级','任教班级','授课班级','subjectclasses','classes'].includes(nk)) km.subjectClasses = rk;
            else if (!km.homeroomClass && ['班主任班级','班主任','负责班级','homeroom','homeroomclass'].includes(nk)) km.homeroomClass = rk;
            else if (!km.office && ['办公室','办公地点','所在办公室','office','officename'].includes(nk)) km.office = rk;
            else if (!km.subject && ['学科','科目','任教科目','subject'].includes(nk)) km.subject = rk;
            else if (!km.school && ['学校','所属学校','school'].includes(nk)) km.school = rk;
        });
        if (!km.name || !km.subjectClasses) return { matched: false, assignments: [], homerooms: {}, skippedWithoutSubject: [] };
        const nCls = typeof options.normalizeClass === 'function' ? options.normalizeClass : (typeof root.normalizeClass === 'function' ? root.normalizeClass : (v) => String(v || '').trim());
        const nSub = typeof options.normalizeSubject === 'function' ? options.normalizeSubject : (typeof root.normalizeSubject === 'function' ? root.normalizeSubject : (v) => String(v || '').trim());
        const defSch = String(options.defaultSchool || '').trim();
        const assignments = [], homerooms = {}, skippedWithoutSubject = [];
        list.forEach((row) => {
            const teacher = String(row[km.name] || '').trim();
            if (!teacher) return;
            const school = String((km.school ? row[km.school] : '') || defSch).trim();
            const hr = km.homeroomClass ? nCls(String(row[km.homeroomClass] || '').trim()) : '';
            if (hr) homerooms[hr] = teacher;
            const rawC = String(row[km.subjectClasses] || '').trim();
            if (!rawC) return;
            const classes = rawC.split(/[、,，;；/\s]+/).map((c) => nCls(c)).filter(Boolean);
            const rawS = km.subject ? String(row[km.subject] || '').trim() : '';
            const office = km.office ? String(row[km.office] || '').trim() : '';
            const subject = rawS ? nSub(rawS) : inferSubjectFromText(office, nSub);
            if (!subject) { skippedWithoutSubject.push({ teacher, office, classes }); return; }
            classes.forEach((c) => assignments.push({ key: `${c}_${subject}`, teacher, school }));
        });
        return { matched: true, assignments, homerooms, skippedWithoutSubject };
    }
    function buildSpaceLedgerRosterExportRows(teacherMap, teacherSchoolMap = {}, options = {}) {
        const byT = new Map(), fSch = String(options.school || '').trim(), sMap = asPlainMap(teacherSchoolMap);
        Object.entries(asPlainMap(teacherMap)).forEach(([k, v]) => {
            const t = String(v || '').trim();
            if (!t) return;
            const rs = String(sMap[k] || '').trim();
            if (fSch && rs && !sameSchoolName(rs, fSch)) return;
            const i = k.indexOf('_'), cls = i >= 0 ? k.slice(0, i) : k, sub = i >= 0 ? k.slice(i + 1) : '';
            if (!byT.has(t)) byT.set(t, { teacher: t, subjects: new Set(), classes: new Set() });
            if (sub) byT.get(t).subjects.add(sub);
            if (cls) byT.get(t).classes.add(cls);
        });
        const rows = [['姓名（必填）','登录邮箱（新教师必填）','办公室','班主任班级（不当班主任留空）','任课班级（顿号分隔）','学科（澄见扩展）']];
        Array.from(byT.values()).sort((a, b) => a.teacher.localeCompare(b.teacher, 'zh-CN')).forEach((e) => {
            const st = Array.from(e.subjects).join('、');
            rows.push([e.teacher, '', st ? `${st}组` : '', '', Array.from(e.classes).sort().join('、'), st]);
        });
        return rows;
    }

    return {
        switchTeacherTerm,
        syncTeacherHistory,
        ensureTeacherMap,
        isTeacherMapCompatibleWithTerm,
        refreshTeacherAnalysis,
        buildTeacherImportMaps,
        formatTeacherImportConflictMessage,
        formatTeacherSchoolOwnershipConflictMessage,
        parseTeacherTermContext,
        summarizeTeacherImportContext,
        parseSpaceLedgerRosterRows,
        buildSpaceLedgerRosterExportRows
    };
});
