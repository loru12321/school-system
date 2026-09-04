// cohort-db-core-runtime.js — CohortDB object, cloud/local DB operations (extracted from app.js)
const CohortDB = {
    ensure: function () {
        if (!COHORT_DB) {
            const runtimeDb = readWorkspaceCohortDb();
            if (runtimeDb && typeof runtimeDb === 'object') {
                COHORT_DB = runtimeDb;
                COHORT_DB.students = COHORT_DB.students || {};
                COHORT_DB.teachingHistory = COHORT_DB.teachingHistory || {};
                COHORT_DB.exams = COHORT_DB.exams || {};
                COHORT_DB.resetPoints = COHORT_DB.resetPoints || [];
                COHORT_DB.currentExamId = COHORT_DB.currentExamId || CURRENT_EXAM_ID || readWorkspaceExamId() || '';
            } else {
                COHORT_DB = {
                    cohortId: CURRENT_COHORT_ID || '',
                    cohortMeta: CURRENT_COHORT_META || null,
                    students: {},
                    teachingHistory: {},
                    exams: {},
                    currentExamId: CURRENT_EXAM_ID || '',
                    resetPoints: []
                };
            }
            syncRuntimeStateToWindow();
        }
        // 老考试统一到考核口径（政史地生不进 SUBJECTS / 不计总分）。按 exam.subjectPolicy 标记幂等。
        // 当前考试同步处理（马上要展示），其余考试交给空闲期分批，避免叠在登录首屏与切届上。
        if (typeof normalizeCohortExamSubjectPolicy === 'function') {
            const currentExamId = String(COHORT_DB.currentExamId || CURRENT_EXAM_ID || readWorkspaceExamId() || '').trim();
            const result = normalizeCohortExamSubjectPolicy(COHORT_DB, currentExamId ? { onlyExamIds: [currentExamId] } : { maxExams: 1 });
            if (result.remaining > 0 && typeof scheduleDeferredCohortExamSubjectPolicy === 'function') {
                scheduleDeferredCohortExamSubjectPolicy(COHORT_DB);
            }
        }
        return COHORT_DB;
    },

    isLoaderActive: function () {
        const loader = document.getElementById('global-loader');
        if (!loader) return false;
        return !loader.classList.contains('hidden');
    },

    removeStudentHistoryByExamId: function (examId) {
        const normalizedExamId = String(examId || '').trim();
        if (!normalizedExamId) return 0;
        const db = this.ensure();
        let removed = 0;
        Object.values(db.students || {}).forEach((student) => {
            if (!Array.isArray(student?.history)) return;
            const before = student.history.length;
            student.history = student.history.filter((item) => String(item?.examId || '').trim() !== normalizedExamId);
            removed += before - student.history.length;
            if (String(student.lastExamId || '').trim() === normalizedExamId) {
                const last = student.history[student.history.length - 1] || null;
                student.lastExamId = last?.examId || null;
                student.lastScore = typeof last?.total === 'number' ? last.total : null;
            }
        });
        return removed;
    },

    renderExamList: function () {
        const sel = document.getElementById('exam-history-select');
        if (!sel) {
            scheduleExamSelectorRefresh();
            return;
        }
        const db = this.ensure();
        const exams = Object.entries(db.exams || {})
            .sort(compareExamRecordsByDateDesc)
            .map(([, exam]) => exam);
        if (!exams.length) {
            sel.innerHTML = '<option value="">暂无历史考试</option>';
            scheduleExamSelectorRefresh();
            return;
        }
        sel.innerHTML = exams.map(ex => `<option value="${ex.examId}">${ex.examId}</option>`).join('');
        if (db.currentExamId) sel.value = db.currentExamId;
        scheduleExamSelectorRefresh();
    },

    loadExamFromSelect: function () {
        const sel = document.getElementById('exam-history-select');
        if (!sel || !sel.value) return;
        const examId = sel.value;
        const ok = this.applyExamToWorkspace(examId);
        if (ok) {
            applyExamMetaUI();
            renderTables();
            updateSchoolSelect();
            updateMySchoolSelect();
            updateStudentSchoolSelect();
            updateMarginalSchoolSelect();
            updateClassSelect();
            updateSegmentSelects();
            updatePotentialSchoolSelect();
            if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
            if (typeof updateSeatAdjSelects === 'function') updateSeatAdjSelects();
            updateProgressSchoolSelect();
            updateMutualAidSelects();
            updateMpSchoolSelect();
            UI.toast('✅ 已切换到历史考试', 'success');
        }
    },

    syncCurrentExam: async function () {
        if (!CURRENT_COHORT_ID) return;
        if (!CURRENT_EXAM_ID) setCurrentExamMeta();
        if (!CURRENT_EXAM_ID) return;

        const meta = getExamMetaFromUI();
        const db = this.ensure();
        const examId = CURRENT_EXAM_ID;
        // 写入侧跨届守卫：切届竞速时 CURRENT_EXAM_ID 可能已是新届别的考试而 COHORT_DB 仍是旧届别，
        // 直接写入会把外届考试塞进本届库并随自动保存上云，之后每次登录恢复都被跨届锁挡住。
        // 拉取侧（fetchCohortExamsToLocal / applyExamToWorkspace）早有同类校验，这里补齐对称的一端。
        const examCohortId = inferCohortIdFromValue(examId) || inferCohortIdFromValue(meta?.cohortId || '');
        const dbCohortId = inferCohortIdFromValue(db?.cohortId || '') || String(CURRENT_COHORT_ID || '').trim();
        if (examCohortId && dbCohortId && examCohortId !== dbCohortId) {
            console.warn('[CohortDB] blocked cross-cohort exam write', { examId, examCohortId, dbCohortId });
            return;
        }
        const existing = db.exams?.[examId] || null;

        this.removeStudentHistoryByExamId(examId);
        await this.smartLinkStudents(examId, meta);

        // structuredClone is faster than JSON.parse(JSON.stringify()) and handles
        // typed arrays correctly.  Falls back to JSON round-trip on older browsers.
        const deepClone = (typeof structuredClone === 'function')
            ? (v) => structuredClone(v)
            : (v) => JSON.parse(JSON.stringify(v));

        db.exams[examId] = {
            examId,
            meta,
            data: deepClone(RAW_DATA || []),
            schools: deepClone(SCHOOLS || {}),
            teacherMap: deepClone(TEACHER_MAP || {}),
            subjects: deepClone(SUBJECTS || []),
            thresholds: deepClone(THRESHOLDS || {}),
            config: deepClone(CONFIG || {}),
            schoolNameMapping: typeof window.getUploadSchoolMappingConfirmation === 'function'
                ? deepClone(window.getUploadSchoolMappingConfirmation().mapping || {})
                : deepClone(existing?.schoolNameMapping || meta?.schoolNameMapping || {}),
            fingerprint: computeExamDataFingerprint(RAW_DATA || []),
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        db.exams[examId].meta = {
            ...(db.exams[examId].meta || {}),
            schoolNameMapping: deepClone(db.exams[examId].schoolNameMapping || {})
        };
        db.currentExamId = examId;
        const termId = getTermId(meta);
        if (termId) {
            db.teachingHistory = db.teachingHistory || {};
            db.teachingHistory[termId] = deepClone(TEACHER_MAP || {});
        }
        this.renderExamList();
        if (meta.resetPoint) {
            db.resetPoints = db.resetPoints || [];
            if (!db.resetPoints.includes(examId)) db.resetPoints.push(examId);
        }
        syncRuntimeStateToWindow();
    },

    applyExamToWorkspace: function (examId, options = {}) {
        if (isScoreImportInProgress() && options.allowDuringImport !== true) {
            console.warn('[CohortDB] blocked exam apply during score import', {
                requestedExamId: examId,
                importingExamId: window.__SCORE_IMPORT_IN_PROGRESS__?.examId || ''
            });
            return false;
        }
        const db = this.ensure();
        const exam = db.exams?.[examId];
        if (!exam) return false;
        // 即将套用的考试必须先落到考核口径（ensure 只同步处理了 db.currentExamId，这里可能是别的一场）。
        if (typeof normalizeCohortExamSubjectPolicy === 'function' && exam.subjectPolicy !== (typeof SUBJECT_POLICY_VERSION !== 'undefined' ? SUBJECT_POLICY_VERSION : 'assessment-core-v1')) {
            normalizeCohortExamSubjectPolicy(db, { onlyExamIds: [examId] });
        }
        const currentCohortId = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
        const examCohortId = inferCohortIdFromValue(examId) || inferCohortIdFromValue(exam?.meta?.cohortId || '');
        if (currentCohortId && examCohortId && currentCohortId !== examCohortId && options.allowCrossCohort !== true) {
            console.warn('[CohortDB] blocked cross-cohort exam apply', { examId, examCohortId, currentCohortId });
            return false;
        }
        const hasProcessedSchools = !!(exam.schools && typeof exam.schools === 'object' && Object.keys(exam.schools).length > 0);
        const hasProcessedSchoolMetrics = hasUsableProcessedSchoolMetrics(exam.schools);
        let shouldRecalculate = options.recalculate !== false || !hasProcessedSchools || !hasProcessedSchoolMetrics;
        const shouldRenderTables = options.renderTables !== false;
        // 显式带上这场考试自己的身份：跨届守卫推断“来料届别”时会退到 window.CURRENT_EXAM_ID /
        // localStorage 里的旧指针，若那是外届考试（切届竞速、跨设备残留），本届考试的数据会被
        // 误判为跨届写入而整批丢弃，工作区停在“无数据、无弹窗”的死局。
        syncDataRuntimeState({
            currentExamId: examId,
            currentCohortId: examCohortId || currentCohortId || '',
            rawData: exam.data || [],
            schools: (exam.schools && typeof exam.schools === 'object') ? exam.schools : {},
            subjects: exam.subjects || [],
            thresholds: exam.thresholds || {},
            config: exam.config || readConfigState()
        });
        const examTeacherMap = exam.teacherMap && typeof exam.teacherMap === 'object' ? exam.teacherMap : null;
        if (examTeacherMap && Object.keys(examTeacherMap).length > 0) {
            setTeacherMap(examTeacherMap);
        }

        if (!SCHOOLS || Object.keys(SCHOOLS).length === 0) {
            const rebuiltSchools = {};
            (RAW_DATA || []).forEach(stu => {
                const schoolName = String(stu?.school || '').trim() || '未命名学校';
                if (!rebuiltSchools[schoolName]) {
                    rebuiltSchools[schoolName] = { name: schoolName, students: [], metrics: {}, rankings: {} };
                }
                rebuiltSchools[schoolName].students.push(stu);
            });
            setSchools(rebuiltSchools);
        }

        CURRENT_EXAM_ID = examId;
        writeWorkspaceExamId(examId);
        writeArchiveMeta(exam.meta || {});
        syncRuntimeStateToWindow();
        const effectiveGrade = getEffectiveGrade(exam.meta || {});
        if (effectiveGrade && exam.meta && exam.meta.grade !== effectiveGrade) exam.meta.grade = effectiveGrade;
        const termId = getTermId(exam.meta || {});
        if (termId) writeCurrentTermId(termId);
        const modeResult = applyModeByGrade(effectiveGrade || exam.meta?.grade);
        // 存档 SUBJECTS 若还带着展示科目，说明这份考试的 total / 学校指标仍是旧口径：
        // 即使调用方要求 recalculate:false（登录恢复路径）也必须重算一次，并把收敛后的学科写回存档。
        if (modeResult && modeResult.changed) {
            exam.subjects = Array.isArray(SUBJECTS) ? SUBJECTS.slice() : [];
            shouldRecalculate = true;
        }

        if (shouldRecalculate && RAW_DATA.length > 0 && typeof processData === 'function') {
            // Coalesce back-to-back recomputes queued within the same tick. The
            // cold login-restore path applies the exam twice synchronously
            // (switchCohort ~app.js:1926, then tryAutoRestoreWorkspaceExam ~cohort-
            // exam-meta:1283 because school metrics are not yet ready), and each
            // would otherwise schedule a full processData over every row. Both
            // callbacks run against the identical final RAW_DATA, so the first is
            // pure waste. Merge them into one trailing recompute and OR the render
            // flag so no requested renderTables is dropped. A recompute that has
            // already STARTED (flag cleared below) does not absorb a later apply,
            // so a genuine subsequent re-run is preserved. No口径 change — the
            // surviving processData reads the same state and computes identically.
            this.__pendingRecalcRender = (this.__pendingRecalcRender === true) || shouldRenderTables;
            if (!this.__pendingRecalc) {
                this.__pendingRecalc = true;
                setTimeout(() => {
                    const renderAfter = this.__pendingRecalcRender === true;
                    this.__pendingRecalc = false;
                    this.__pendingRecalcRender = false;
                    processData()
                        .then(() => {
                            if (renderAfter && typeof renderTables === 'function') renderTables();
                            if (typeof updateStatusPanel === 'function') updateStatusPanel();
                        })
                        .catch(err => console.warn('历史考试重算失败:', err));
                }, 0);
            }
        } else if (typeof updateStatusPanel === 'function') {
            setTimeout(() => updateStatusPanel(), 0);
        }

        return true;
    },

    smartLinkStudents: async function (examId, meta) {
        const db = this.ensure();
        const roster = db.students || {};
        const nameIndex = {};

        Object.values(roster).forEach(stu => {
            if (!nameIndex[stu.name]) nameIndex[stu.name] = [];
            nameIndex[stu.name].push(stu);
        });

        const conflicts = [];

        RAW_DATA.forEach(stu => {
            const name = String(stu.name || '').trim();
            if (!name) return;
            const candidates = nameIndex[name] || [];
            if (candidates.length === 0) {
                const uuid = this.createUUID();
                const rec = {
                    uuid,
                    name,
                    status: 'transfer_in',
                    history: [],
                    lastScore: null,
                    lastExamId: null
                };
                roster[uuid] = rec;
                stu.uuid = uuid;
            } else if (candidates.length === 1) {
                const target = candidates[0];
                stu.uuid = target.uuid;
            } else {
                conflicts.push({ current: stu, candidates });
            }
        });

        if (conflicts.length) {
            if (this.isLoaderActive()) {
                this.autoResolveConflicts(conflicts);
                if (window.UI) UI.toast(`⚠️ 检测到 ${conflicts.length} 条重名，已按分数最接近自动匹配`, 'warning');
            } else {
                await this.resolveConflicts(conflicts);
            }
        }

        RAW_DATA.forEach(stu => {
            if (!stu.uuid) return;
            const rec = roster[stu.uuid];
            if (!rec) return;
            rec.name = stu.name;
            rec.lastScore = typeof stu.total === 'number' ? stu.total : null;
            rec.lastExamId = examId;
            rec.history = rec.history || [];
            rec.history.push({ examId, class: stu.class, school: stu.school, total: stu.total });
        });

        db.students = roster;
        syncRuntimeStateToWindow();
    },

    autoResolveConflicts: function (conflicts) {
        const db = this.ensure();
        conflicts.forEach(item => {
            const current = item.current;
            const candidates = item.candidates || [];
            const currentScore = parseFloat(current.total) || 0;
            const sorted = candidates.slice().sort((a, b) => {
                const da = Math.abs((a.lastScore ?? 0) - currentScore);
                const dbv = Math.abs((b.lastScore ?? 0) - currentScore);
                return da - dbv;
            });
            const best = sorted[0];
            if (best && best.uuid) {
                current.uuid = best.uuid;
            } else {
                const uuid = this.createUUID();
                db.students[uuid] = {
                    uuid,
                    name: current.name,
                    status: 'transfer_in',
                    history: [],
                    lastScore: null,
                    lastExamId: null
                };
                current.uuid = uuid;
            }
        });
    },

    resolveConflicts: async function (conflicts) {
        const db = this.ensure();
        for (const item of conflicts) {
            const current = item.current;
            const candidates = item.candidates || [];
            const options = {};
            const currentScore = current.total || 0;
            const sorted = candidates.slice().sort((a, b) => {
                const da = Math.abs((a.lastScore ?? 0) - currentScore);
                const db = Math.abs((b.lastScore ?? 0) - currentScore);
                return da - db;
            });

            sorted.forEach((c, idx) => {
                const label = `原${c.history?.slice(-1)[0]?.class || c.lastClass || '-'}班 ${c.name} (上次${c.lastScore ?? '-'})${idx === 0 ? ' —— 系统推荐' : ''}`;
                options[c.uuid] = label;
            });
            options['NEW'] = '以上都不是（新增转学生）';

            const result = await Swal.fire({
                title: '⚠️ 检测到重名冲突',
                html: `您上传了 ${current.class || '-'}班 的 ${current.name} (本次${currentScore}分)，请选择其历史身份：`,
                input: 'radio',
                inputOptions: options,
                inputValidator: value => !value ? '请选择一个匹配项' : undefined,
                confirmButtonText: '确认匹配',
                confirmButtonColor: '#4f46e5',
                showCancelButton: true,
                cancelButtonText: '设为新增'
            });

            const chosen = result.isConfirmed ? result.value : 'NEW';
            if (chosen === 'NEW') {
                const uuid = this.createUUID();
                db.students[uuid] = {
                    uuid,
                    name: current.name,
                    status: 'transfer_in',
                    history: [],
                    lastScore: null,
                    lastExamId: null
                };
                current.uuid = uuid;
            } else {
                current.uuid = chosen;
            }
        }
    },

    createUUID: function () {
        return 'stu_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
};

window.CohortDB = CohortDB;
