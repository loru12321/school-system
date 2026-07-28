// Sync schoolsystem teaching-analysis scores into the independent teacher assessment system.
(function () {
    const root = window;
    const PROJECTS = {
        twoRates: 'teacher_two_rates_one_score',
        classCollaboration: 'teacher_class_collaboration',
        subjectCollaboration: 'teacher_subject_collaboration',
        bottomThird: 'teacher_bottom_third',
        excellentContribution: 'teacher_excellent_contribution',
        teacherWorkload: 'teacher_workload',
        classTermScoreNonGrad: 'class_term_score_non_grad',
        classTopStudentsNonGrad: 'class_top_students_non_grad',
        classAverageNonGrad: 'class_average_non_grad',
        classTargetNonGrad: 'class_target_non_grad',
        classBottomThirdNonGrad: 'class_bottom_third_non_grad',
        classTwoRatesOneScoreGrad: 'class_two_rates_one_score_grad',
        classTargetGrad: 'class_target_grad',
        classBottomThirdGrad: 'class_bottom_third_grad',
        classHighSchoolContribution: 'class_high_school_contribution_grad',
        classHighScoreGrad: 'class_high_score_grad'
    };

    const SYNC_ENABLED_PROJECT_IDS = [
        PROJECTS.twoRates,
        PROJECTS.classCollaboration,
        PROJECTS.subjectCollaboration,
        PROJECTS.bottomThird,
        PROJECTS.excellentContribution
    ];

    const PREVIEW_ONLY_PROJECT_IDS = [
        PROJECTS.classTermScoreNonGrad,
        PROJECTS.classTopStudentsNonGrad,
        PROJECTS.classAverageNonGrad,
        PROJECTS.classTargetNonGrad,
        PROJECTS.classBottomThirdNonGrad,
        PROJECTS.classTwoRatesOneScoreGrad,
        PROJECTS.classTargetGrad,
        PROJECTS.classBottomThirdGrad,
        PROJECTS.classHighSchoolContribution,
        PROJECTS.classHighScoreGrad
    ];

    const PROJECT_LABELS = {
        [PROJECTS.twoRates]: '两率一分',
        [PROJECTS.classCollaboration]: '班级协调成绩',
        [PROJECTS.subjectCollaboration]: '学科组协同成绩',
        [PROJECTS.bottomThird]: '后 1/3 学生成绩',
        [PROJECTS.excellentContribution]: '尖子生培养贡献',
        [PROJECTS.teacherWorkload]: '课时量成绩',
        [PROJECTS.classTermScoreNonGrad]: '班级期末成绩',
        [PROJECTS.classTopStudentsNonGrad]: '尖优学生得分',
        [PROJECTS.classAverageNonGrad]: '班级平均分',
        [PROJECTS.classTargetNonGrad]: '优秀指标完成',
        [PROJECTS.classBottomThirdNonGrad]: '班级后 1/3 学生成绩',
        [PROJECTS.classTwoRatesOneScoreGrad]: '毕业班两率一分',
        [PROJECTS.classTargetGrad]: '毕业班指标完成',
        [PROJECTS.classBottomThirdGrad]: '毕业班后 1/3 学生成绩',
        [PROJECTS.classHighSchoolContribution]: '高中贡献率',
        [PROJECTS.classHighScoreGrad]: '高分段贡献'
    };

    const PROJECT_RULES = {
        [PROJECTS.twoRates]: {
            max: 60,
            autoMax: 54,
            requiresJuly: true,
            syncMode: 'sync',
            source: '联考分析 · 两率一分',
            formula: '教师两率一分主体 =（个人优秀率/最高学校优秀率*40 + 个人及格率/最高学校及格率*30 + 个人平均分/最高学校平均分*30）/最高教师成绩*54；乡镇最高值比较含银山实验本校；优秀率增幅6分按当前任教班级学生名单反查基准考试并重组基准成绩：7-9年级用上年度7月同一批学生成绩，6年级用已确认的上学期期中或期末同一批学生成绩。'
        },
        [PROJECTS.classCollaboration]: {
            max: 10,
            requiresJuly: true,
            syncMode: 'sync',
            source: '教学管理 · 任教班级总分',
            formula: '班级协调组成绩 = 班级三项原始成绩 / 全镇班级最高原始成绩 × 10；优秀线、及格线只取联考分析已确认分数线，95%名册实考不足按规则补零；不读取联考评价的学校赋分或学校排名。'
        },
        [PROJECTS.subjectCollaboration]: {
            max: 10,
            requiresJuly: true,
            syncMode: 'sync',
            source: '教学管理 · 本校同学科整体指标',
            formula: '学科集体协作成绩 = 本校学科组三项原始成绩 / 全镇同学科最高原始成绩 × 10；优秀线、及格线只取联考分析已确认分数线，95%名册实考不足按规则补零；不读取联考评价的学校赋分或学校排名。'
        },
        [PROJECTS.bottomThird]: {
            max: 10,
            requiresJuly: true,
            syncMode: 'sync',
            source: '联考分析 · 后 1/3 总分',
            formula: '后 1/3 学生成绩 = 任教班级后 1/3 学生平均分 / 全镇最高后 1/3 学生平均分 × 10；教师个人成绩以《教师个人成绩计算》为准，只看平均分，95%名册实考不足按规则补零。'
        },
        [PROJECTS.excellentContribution]: {
            max: 5,
            requiresJuly: true,
            syncMode: 'sync',
            source: '联考分析 · 7 月期末/中考尖子生',
            formula: '尖子生培养贡献只限 7 月成绩：非毕业年级按第二学期期末乡镇前 150 名及学科位次累加；九年级按 7 月上传的中考成绩确定尖子生/优秀尖子，中考总分含体育60分，但体育教师不进入教师考核；教师原始贡献按本校最高教师折算 5 分。'
        },
        [PROJECTS.classTermScoreNonGrad]: {
            max: 60,
            requiresJuly: true,
            syncMode: 'preview',
            source: '公式审计 · 非毕业年级第二学期期末成绩',
            formula: '非毕业年级班级期末成绩 = 班级总成绩两率一分 50 分 + 班级优秀率增幅 10 分；乡镇最高值比较含银山实验本校；增幅基准必须按当前班级学生名单反查上一基准考试并重组，不按旧班号直接相减；依赖7月/期末成绩、上一基准成绩和95%人数补零规则。'
        },
        [PROJECTS.classTopStudentsNonGrad]: {
            max: 10,
            requiresJuly: true,
            syncMode: 'preview',
            source: '公式审计 · 非毕业年级尖优学生名次段',
            formula: '尖优学生得分按名次段赋原始分后，再以本班原始分 / 本校最高班级原始分 × 10 折算；学生排名范围仍需最终确认，不按乡镇最高班级作分母。'
        },
        [PROJECTS.classAverageNonGrad]: {
            max: 10,
            requiresJuly: true,
            syncMode: 'preview',
            source: '公式审计 · 非毕业年级班级平均分',
            formula: '班级平均分 = 本班总成绩平均分 / 本校同级部最高班级平均分 × 10；这是本校内部班级比较，适合自动化但先只做预览。'
        },
        [PROJECTS.classTargetNonGrad]: {
            max: 15,
            requiresJuly: true,
            syncMode: 'blocked',
            source: '公式审计 · 非毕业年级优秀指标/尖子生育苗',
            formula: '优秀指标完成/尖子生育苗依赖上一基准考试、6年级抽签基准和“达标+附加后再除最高×15”的二次折算，需人工确认后再自动化。'
        },
        [PROJECTS.classBottomThirdNonGrad]: {
            max: 5,
            requiresJuly: true,
            syncMode: 'blocked',
            source: '公式审计 · 非毕业年级后 1/3',
            formula: '方案写“同文化课教师相同”，需确认是沿用后1/3平均分口径还是完整两率一分口径后再接入。'
        },
        [PROJECTS.classTwoRatesOneScoreGrad]: {
            max: 45,
            requiresJuly: true,
            syncMode: 'preview',
            source: '公式审计 · 9 年级 7 月中考/统一模拟',
            formula: '毕业班两率一分 = 及格率10分 + 平均分10分 + 优秀率20分 + 优秀率增幅5分；涉及乡镇最高值比较时含银山实验本校；优秀率增幅按当前班级学生名单反查上一基准考试并重组，不按旧班号直接相减；依赖9年级7月中考或最后一次统一模拟。'
        },
        [PROJECTS.classHighSchoolContribution]: {
            max: 15,
            requiresJuly: true,
            syncMode: 'preview',
            source: '教学管理 · 9 年级 7 月中考高中过线',
            formula: '高中贡献率只使用 9 年级 7 月上传的中考成绩：中考总分含体育60分，按云端管理填写的中考高中过线分数统计本校每班过线率，再按“本班过线率 / 本校级部班级最高过线率 × 15”折算；当前仅预览，不写入考核系统。'
        },
        [PROJECTS.classTargetGrad]: {
            max: 33,
            requiresJuly: true,
            syncMode: 'preview',
            source: '教学管理 · 9 年级 7 月中考指标完成',
            formula: '毕业班指标完成只使用 9 年级 7 月中考成绩：中考总分含体育60分；指标一每班9人基础10分、超额额外按本校级部最高超额人数加5分；指标二每班40人基础10分、超额额外按本校级部最高超额人数加8分；当前仅预览，不写入考核系统。'
        },
        [PROJECTS.classBottomThirdGrad]: {
            max: 5,
            requiresJuly: true,
            syncMode: 'blocked',
            source: '公式审计 · 毕业班后 1/3',
            formula: '毕业班后1/3需沿用已确认的教师后1/3口径后再自动化；当前只列入审计，不生成分值。'
        },
        [PROJECTS.classHighScoreGrad]: {
            max: 15,
            requiresJuly: true,
            syncMode: 'preview',
            source: '公式审计 · 9 年级 7 月中考高分段',
            formula: '高分段贡献只使用9年级7月中考，中考总分含体育60分；总分550分以上人数 / 本校级部最高班级550分以上人数 × 15；这是本校内部班级比较，当前仅预览，不写入考核系统。'
        },
        [PROJECTS.teacherWorkload]: {
            max: 5,
            requiresJuly: false,
            manual: true,
            syncMode: 'manual',
            source: '考核系统手填',
            formula: '课时量成绩 system 暂无自动来源，由考核组长或管理员在考核系统中手动填写。'
        }
    };

    const SUBJECT_ORDER = ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物', '体育', '音乐', '美术', '信息', '科学'];
    const ASSESSMENT_SECOND_MOCK_SUBJECTS_BY_GRADE = {
        8: ['历史', '地理', '生物'],
        9: ['政治']
    };
    const GRADE8_SECOND_MOCK_ASSESSMENT_SUBJECTS = new Set(['历史', '地理', '生物']);
    const ASSESSMENT_CALCULATION_VERSION = 'teacher-personal-v3.2026-07';
    const ASSESSMENT_ROSTER_INCLUDED_STATUSES = new Set(['active', 'transfer_in', 'leave', 'dropout']);
    const ASSESSMENT_ROSTER_EXCLUDED_STATUSES = new Set(['transfer_out', 'not_enrolled']);
    const NON_GRAD_TOP_SUBJECTS = {
        6: ['语文', '数学', '英语'],
        7: ['语文', '数学', '英语'],
        8: ['语文', '数学', '英语', '物理', '化学']
    };

    function text(value) {
        return String(value ?? '').trim();
    }

    function assessmentAcademicYearForContext(context = getCurrentExamContext()) {
        const exam = context?.exam || {};
        const direct = text(exam?.meta?.year || exam?.meta?.academicYear || exam?.academic_year || exam?.academicYear);
        if (/^20\d{2}-20\d{2}$/.test(direct)) return direct;
        return getAcademicYearForSync();
    }

    function assessmentRosterKey(academicYear, grade, school, className) {
        return [text(academicYear), normalizeGrade(grade), normalizeSchoolForSync(school), text(className)].join('::');
    }

    function normalizeAssessmentRosterStatus(value) {
        const status = text(value).toLowerCase();
        if (status === 'transfer_out' || status === 'not_enrolled') return status;
        if (status === 'transfer_in' || status === 'leave' || status === 'dropout') return status;
        return 'active';
    }

    function assessmentRosterStore() {
        const db = root.CohortDB && typeof root.CohortDB.ensure === 'function' ? root.CohortDB.ensure() : null;
        if (!db) return null;
        db.assessmentRosters = db.assessmentRosters || {};
        return db.assessmentRosters;
    }

    function assessmentStudentStatus(row) {
        const db = root.CohortDB && typeof root.CohortDB.ensure === 'function' ? root.CohortDB.ensure() : null;
        const byId = row?.uuid && db?.students ? db.students[row.uuid] : null;
        return normalizeAssessmentRosterStatus(row?.status || byId?.status || 'active');
    }

    function getAssessmentRosterSnapshot(context, school, className) {
        const store = assessmentRosterStore();
        if (!store) return null;
        const grade = getExamGrade(context?.currentExamId, context?.exam || {}, getExamRows(context?.exam));
        return store[assessmentRosterKey(assessmentAcademicYearForContext(context), grade, school, className)] || null;
    }

    function buildAssessmentRosterSnapshot(context = getCurrentExamContext()) {
        const rows = getExamRows(context?.exam).length ? getExamRows(context.exam) : getCurrentRows();
        const grade = getExamGrade(context?.currentExamId, context?.exam || {}, rows);
        const academicYear = assessmentAcademicYearForContext(context);
        const store = assessmentRosterStore();
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        if (!store || !rows.length || !grade) return { ok: false, reason: '当前届别、年级或成绩数据不完整，无法锁定考核名册。', snapshots: [] };
        const byClass = new Map();
        rows.forEach((row) => {
            const school = normalizeSchoolForSync(row?.school);
            const className = normalizeStudentClass(row);
            if (!school || school !== ownSchool || !className) return;
            const key = assessmentRosterKey(academicYear, grade, school, className);
            if (!byClass.has(key)) byClass.set(key, { school, className, students: [] });
            byClass.get(key).students.push(row);
        });
        const now = new Date().toISOString();
        const snapshots = [];
        byClass.forEach((entry, key) => {
            const students = entry.students.filter((row) => !ASSESSMENT_ROSTER_EXCLUDED_STATUSES.has(assessmentStudentStatus(row)));
            const initialCount = students.length;
            const statusCounts = students.reduce((counts, row) => {
                const status = assessmentStudentStatus(row);
                counts[status] = (counts[status] || 0) + 1;
                return counts;
            }, {});
            store[key] = {
                academic_year: academicYear,
                grade: normalizeGrade(grade),
                school: entry.school,
                class_name: entry.className,
                initial_count: initialCount,
                target_count: Math.floor(initialCount * 0.95),
                locked_at: now,
                locked_exam_id: context?.currentExamId || '',
                status_counts: statusCounts,
                locked: true
            };
            snapshots.push(store[key]);
        });
        return { ok: true, academic_year: academicYear, grade: normalizeGrade(grade), snapshots };
    }

    function listAssessmentRosterSnapshots(context = getCurrentExamContext()) {
        const store = assessmentRosterStore() || {};
        const academicYear = assessmentAcademicYearForContext(context);
        const grade = getExamGrade(context?.currentExamId, context?.exam || {}, getExamRows(context?.exam));
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        return Object.values(store)
            .filter((snapshot) => text(snapshot.academic_year) === academicYear)
            .filter((snapshot) => normalizeGrade(snapshot.grade) === normalizeGrade(grade))
            .filter((snapshot) => normalizeSchoolForSync(snapshot.school) === ownSchool)
            .sort((left, right) => text(left.class_name).localeCompare(text(right.class_name), 'zh-Hans-CN', { numeric: true }));
    }

    async function persistAssessmentRosters(sourceLabel) {
        // The cloud snapshot reads WorkspaceState, not just the mutable CohortDB
        // reference. Publish the roster mutation before saving it.
        try {
            root.syncRuntimeStateToWindow?.();
        } catch (error) {
            console.warn('[assessment-sync] publish roster state failed:', error);
        }
        if (typeof root.saveCloudData !== 'function') return false;
        return root.saveCloudData({ mode: 'workspace', forceUpload: true, sourceLabel });
    }

    async function lockAssessmentRosters() {
        const result = buildAssessmentRosterSnapshot(getCurrentExamContext());
        if (!result.ok) throw new Error(result.reason);
        await persistAssessmentRosters('assessment-roster-lock');
        root.dispatchEvent?.(new CustomEvent('assessment-roster-locked', { detail: result }));
        setTimeout(() => runAutomaticAssessmentSync({ force: false }).catch(() => {}), 300);
        return result;
    }

    async function unlockAssessmentRoster(className) {
        const context = getCurrentExamContext();
        const store = assessmentRosterStore();
        if (!store) return false;
        const grade = getExamGrade(context?.currentExamId, context?.exam || {}, getExamRows(context?.exam));
        const key = assessmentRosterKey(assessmentAcademicYearForContext(context), grade, root.MY_SCHOOL || '银山实验学校', className);
        if (!store[key]) return false;
        store[key] = { ...store[key], locked: false, unlocked_at: new Date().toISOString() };
        await persistAssessmentRosters('assessment-roster-unlock');
        root.dispatchEvent?.(new CustomEvent('assessment-roster-unlocked', { detail: { className } }));
        return true;
    }

    function getAssessmentRosterPanelState() {
        const context = getCurrentExamContext();
        const rows = getExamRows(context?.exam).length ? getExamRows(context.exam) : getCurrentRows();
        const grade = getExamGrade(context?.currentExamId, context?.exam || {}, rows);
        const academicYear = assessmentAcademicYearForContext(context);
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        const snapshots = new Map(listAssessmentRosterSnapshots(context).map((snapshot) => [snapshot.class_name, snapshot]));
        const classes = Array.from(new Set(rows
            .filter((row) => normalizeSchoolForSync(row?.school) === ownSchool)
            .map(normalizeStudentClass)
            .filter(Boolean))).sort((left, right) => text(left).localeCompare(text(right), 'zh-Hans-CN', { numeric: true })).map((className) => {
            const snapshot = snapshots.get(className);
            const classRows = rows.filter((row) => normalizeSchoolForSync(row?.school) === ownSchool && normalizeStudentClass(row) === className);
            const valid = classRows.filter((row) => ASSESSMENT_ROSTER_INCLUDED_STATUSES.has(assessmentStudentStatus(row))).length;
            const status = classRows.reduce((counts, row) => {
                const key = assessmentStudentStatus(row);
                counts[key] = (counts[key] || 0) + 1;
                return counts;
            }, {});
            const initial = snapshot?.initial_count ?? classRows.filter((row) => !ASSESSMENT_ROSTER_EXCLUDED_STATUSES.has(assessmentStudentStatus(row))).length;
            const target = snapshot?.target_count ?? Math.floor(initial * 0.95);
            return {
                class_name: className,
                initial_count: initial,
                target_count: target,
                valid_count: valid,
                zero_fill: Math.max(0, target - valid),
                status_counts: status,
                snapshot
            };
        });
        return { academicYear, grade: gradeLabel(grade), school: ownSchool, classes };
    }

    function assessmentRosterValues(rows, context, school, className, valueGetter) {
        const snapshot = getAssessmentRosterSnapshot(context, school, className);
        if (!snapshot?.locked) {
            return { ready: false, values: [], snapshot: null, reason: `${gradeLabel(getExamGrade(context?.currentExamId, context?.exam || {}, rows))}${className} 未锁定95%考核名册` };
        }
        const values = (rows || [])
            .filter((row) => normalizeSchoolForSync(row?.school) === normalizeSchoolForSync(school))
            .filter((row) => normalizeStudentClass(row) === className)
            .filter((row) => ASSESSMENT_ROSTER_INCLUDED_STATUSES.has(assessmentStudentStatus(row)))
            .map(valueGetter)
            .filter(Number.isFinite);
        const targetCount = Math.max(0, Number(snapshot.target_count) || 0);
        const zeroFill = Math.max(0, targetCount - values.length);
        return {
            ready: true,
            values: values.concat(Array(zeroFill).fill(0)),
            actual_count: values.length,
            zero_fill: zeroFill,
            snapshot
        };
    }

    function readAssessmentThresholds(context = getCurrentExamContext()) {
        const source = context?.exam?.thresholds || context?.exam?.meta?.thresholds || root.THRESHOLDS || {};
        const map = new Map();
        Object.entries(source || {}).forEach(([key, value]) => {
            const entry = value && typeof value === 'object' ? value : {};
            const excellent = toNumber(entry.exc ?? entry.excellent ?? entry.excellentLine, NaN);
            const pass = toNumber(entry.pass ?? entry.passLine, NaN);
            if (!Number.isFinite(excellent) || !Number.isFinite(pass)) return;
            const normalized = key === 'total' ? 'total' : normalizeSubject(key);
            if (normalized) map.set(normalized, { exc: excellent, pass });
        });
        return map;
    }

    function getAssessmentThreshold(thresholds, subject) {
        const key = subject === 'total' ? 'total' : normalizeSubject(subject);
        const threshold = thresholds?.get?.(key) || null;
        if (!threshold || !Number.isFinite(threshold.exc) || !Number.isFinite(threshold.pass)) return null;
        return threshold;
    }

    function assessmentThresholdSnapshot(thresholds) {
        return Array.from(thresholds || new Map())
            .map(([subject, value]) => `${subject}:${round(value.exc, 2)}/${round(value.pass, 2)}`)
            .sort()
            .join(',');
    }

    function getAssessmentRosterReadiness(teachers, rows, context) {
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        const expected = new Map();
        (teachers || []).forEach((teacher) => {
            if (normalizeSchoolForSync(teacher.school) !== ownSchool) return;
            (teacher.classes || []).forEach((className) => {
                const normalizedClass = text(className);
                if (!normalizedClass) return;
                const snapshot = getAssessmentRosterSnapshot(context, ownSchool, normalizedClass);
                const key = assessmentRosterKey(assessmentAcademicYearForContext(context), teacher.grade, ownSchool, normalizedClass);
                expected.set(key, { className: normalizedClass, snapshot });
            });
        });
        const missing = Array.from(expected.values()).filter((entry) => !entry.snapshot?.locked);
        const snapshots = Array.from(expected.values()).map((entry) => entry.snapshot).filter(Boolean);
        const zeroFill = snapshots.reduce((sum, snapshot) => {
            const actual = (rows || []).filter((row) => (
                normalizeSchoolForSync(row?.school) === ownSchool
                && normalizeStudentClass(row) === snapshot.class_name
                && ASSESSMENT_ROSTER_INCLUDED_STATUSES.has(assessmentStudentStatus(row))
            )).length;
            return sum + Math.max(0, Number(snapshot.target_count || 0) - actual);
        }, 0);
        return {
            ready: missing.length === 0,
            snapshots,
            zero_fill: zeroFill,
            missing: missing.map((entry) => entry.className)
        };
    }

    function getAssessmentTopTotal(row, grade) {
        const subjects = NON_GRAD_TOP_SUBJECTS[normalizeGrade(grade)];
        if (!subjects) return getTotal(row);
        const values = subjects.map((subject) => getSubjectScore(row, subject));
        if (values.some((value) => !Number.isFinite(value))) return NaN;
        return values.reduce((sum, value) => sum + value, 0);
    }

    function escapeHtml(value) {
        if (typeof root.tmEscapeHtml === 'function') return root.tmEscapeHtml(value);
        return text(value).replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }

    function toNumber(value, fallback = NaN) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function round(value, digits = 2) {
        const number = toNumber(value, 0);
        const factor = 10 ** digits;
        return Math.round(number * factor) / factor;
    }

    function pct(value) {
        return `${round(toNumber(value, 0) * 100, 1)}%`;
    }

    function normalizeGrade(value) {
        const source = text(value);
        const cn = { 六: '6', 七: '7', 八: '8', 九: '9' };
        for (const [key, grade] of Object.entries(cn)) {
            if (source.includes(`${key}年级`) || source === key) return grade;
        }
        const explicit = source.match(/([6-9])\s*年级/);
        if (explicit) return explicit[1];
        const dottedClass = source.match(/\b([6-9])\s*[.．]\s*\d+\b/);
        if (dottedClass) return dottedClass[1];
        const match = source.match(/(?:^|[^\d])([6-9])(?:$|[^\d])/);
        return match ? match[1] : '';
    }

    function gradeLabel(value) {
        const grade = normalizeGrade(value);
        return grade ? `${grade}年级` : text(value);
    }

    function normalizeSubject(value) {
        const raw = text(value).replace(/\s+/g, '');
        const map = {
            语: '语文',
            数: '数学',
            英: '英语',
            道法: '政治',
            道德与法治: '政治',
            思政: '政治',
            体育与健康: '体育'
        };
        if (map[raw]) return map[raw];
        if (typeof root.normalizeSubject === 'function') return root.normalizeSubject(raw);
        return raw;
    }

    function normalizeSchoolForSync(value) {
        const raw = text(value);
        if (!raw) return '';
        if (typeof root.getCanonicalSchoolName === 'function') {
            const canonical = text(root.getCanonicalSchoolName(raw));
            if (canonical) return canonical;
        }
        if (typeof root.normalizeSchoolName === 'function') {
            const normalized = text(root.normalizeSchoolName(raw));
            if (normalized) return normalized;
        }
        return raw.replace(/学校$/, '').trim();
    }

    function parseClasses(value) {
        const raw = Array.isArray(value) ? value : text(value).split(/[、,，;；|\s]+/);
        return Array.from(new Set(raw.map((item) => text(item).replace(/班$/, '')).filter(Boolean)));
    }

    function getAcademicYearForSync(date = new Date()) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const start = month <= 6 ? year - 2 : year - 1;
        return `${start}-${start + 1}`;
    }

    function getCurrentRows() {
        if (Array.isArray(root.RAW_DATA) && root.RAW_DATA.length) return root.RAW_DATA;
        const db = root.CohortDB && typeof root.CohortDB.ensure === 'function' ? root.CohortDB.ensure() : null;
        const currentExam = root.CURRENT_EXAM_ID || db?.currentExamId || '';
        const exam = currentExam && db?.exams ? db.exams[currentExam] : null;
        return Array.isArray(exam?.data) ? exam.data : [];
    }

    function getCurrentExamContext() {
        const db = root.CohortDB && typeof root.CohortDB.ensure === 'function' ? root.CohortDB.ensure() : null;
        const currentExamId = text(root.CURRENT_EXAM_ID || db?.currentExamId || root.__CURRENT_EXAM_KEY || '');
        const exam = currentExamId && db?.exams ? db.exams[currentExamId] : null;
        return { db, currentExamId, exam };
    }

    async function ensureAssessmentSecondMockHistoryReady(rows) {
        let context = getCurrentExamContext();
        if (!isJulyExam(context)) return context;
        const baseInfo = getCurrentCompositeBaseInfo(rows, context);
        if (!getSecondMockSubjectsForGrade(baseInfo.grade).length) return context;
        if (findLatestSecondMockExam(baseInfo, context)) return context;
        if (!baseInfo.cohortId || !root.CloudManager || typeof root.CloudManager.fetchCohortExamsToLocal !== 'function') return context;
        try {
            await root.CloudManager.fetchCohortExamsToLocal(baseInfo.cohortId, {
                background: false,
                latestOnly: false,
                minCount: 3,
                refreshSelectors: false
            });
            context = getCurrentExamContext();
        } catch (error) {
            console.warn('[assessment-sync] failed to hydrate cohort exam history before composite build:', error?.message || error);
        }
        return context;
    }

    function extractExamMonth(context = getCurrentExamContext()) {
        const exam = context.exam || {};
        const candidates = [
            context.currentExamId,
            exam.date,
            exam.examDate,
            exam.exam_date,
            exam.name,
            exam.title,
            exam.label,
            exam.updatedAt,
            exam.createdAt
        ].map(text).filter(Boolean);
        for (const value of candidates) {
            const dateMatches = Array.from(value.matchAll(/(20\d{2})[-_/年.](\d{1,2})(?:[-_/月.](\d{1,2}))?/g));
            for (const dateMatch of dateMatches) {
                const month = Number(dateMatch[2]);
                if (month >= 1 && month <= 12) return month;
            }
            const cnMonth = value.match(/(?:^|[^0-9])(\d{1,2})\s*月/);
            if (cnMonth) {
                const month = Number(cnMonth[1]);
                if (month >= 1 && month <= 12) return month;
            }
        }
        return 0;
    }

    function extractExamDate(context = getCurrentExamContext()) {
        const exam = context.exam || {};
        const meta = getExamMeta(exam);
        const candidates = [
            meta.date,
            meta.examDate,
            meta.exam_date,
            exam.date,
            exam.examDate,
            exam.exam_date,
            context.currentExamId,
            exam.name,
            exam.title,
            exam.label
        ].map(text).filter(Boolean);
        for (const value of candidates) {
            const match = value.match(/(20\d{2})[-_/年.](\d{1,2})(?:[-_/月.](\d{1,2}))?/);
            if (match) {
                const year = match[1];
                const month = String(match[2]).padStart(2, '0');
                const day = match[3] ? String(match[3]).padStart(2, '0') : '';
                return day ? `${year}-${month}-${day}` : `${year}-${month}`;
            }
        }
        return '';
    }

    function getExamLabel(context = getCurrentExamContext()) {
        const exam = context.exam || {};
        return text(exam.name || exam.title || exam.label || context.currentExamId || '当前考试');
    }

    function isJulyExam(context = getCurrentExamContext()) {
        return extractExamMonth(context) === 7;
    }

    function isGrade9Exam(context = getCurrentExamContext(), rows = getCurrentRows()) {
        return normalizeGrade(getExamGrade(context.currentExamId, context.exam || {}, rows)) === '9';
    }

    function isGrade9ZhongkaoExam(context = getCurrentExamContext(), rows = getCurrentRows()) {
        if (!isGrade9Exam(context, rows) || !isJulyExam(context)) return false;
        const exam = context?.exam || {};
        const descriptor = [
            context?.currentExamId,
            exam?.name,
            exam?.title,
            exam?.label,
            exam?.date,
            exam?.examDate,
            exam?.exam_date,
            getExamLabel(context)
        ].map(text).filter(Boolean).join(' ');
        return /中考/.test(descriptor);
    }

    function getGrade9ZhongkaoAdmissionTotal(row) {
        if (typeof root.getHighSchoolAdmissionTotal === 'function') {
            const total = root.getHighSchoolAdmissionTotal(row);
            return Number.isFinite(total) ? total : NaN;
        }
        // 运行时容错：主程序尚未暴露 helper 时，仍按同一口径失败关闭，
        // 不回退到已被规范为“五科总”的 row.total。
        const directTotal = row?.zhongkaoTotal;
        if (directTotal !== null && directTotal !== undefined && String(directTotal).trim() !== '') {
            const numeric = toNumber(directTotal, NaN);
            if (Number.isFinite(numeric)) return numeric;
        }
        const scores = row?.scores && typeof row.scores === 'object' ? row.scores : null;
        if (!scores) return NaN;
        let total = 0;
        for (const subject of ['语文', '数学', '英语', '物理', '化学', '体育']) {
            const value = subject === '体育'
                ? (Object.prototype.hasOwnProperty.call(scores, '体育') ? scores.体育 : scores.体育与健康)
                : scores[subject];
            const numeric = toNumber(value, NaN);
            if (!Number.isFinite(numeric)) return NaN;
            total += numeric;
        }
        return total;
    }

    function readHighSchoolLine() {
        const indicator = typeof root.readIndicatorState === 'function'
            ? (root.readIndicatorState() || {})
            : (root.SYS_VARS?.indicator || {});
        const value = indicator.highSchoolLine || indicator.graduateHighSchoolLine || root.document?.getElementById?.('dm_high_school_line_input')?.value || '';
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : 0;
    }

    function readIndicatorRankLines() {
        const indicator = typeof root.readIndicatorState === 'function'
            ? (root.readIndicatorState() || {})
            : (root.SYS_VARS?.indicator || {});
        const ind1 = Number(indicator.ind1 || indicator.target1 || indicator.indicator1 || 0);
        const ind2 = Number(indicator.ind2 || indicator.target2 || indicator.indicator2 || 0);
        return {
            ind1: Number.isFinite(ind1) && ind1 > 0 ? Math.floor(ind1) : 0,
            ind2: Number.isFinite(ind2) && ind2 > 0 ? Math.floor(ind2) : 0
        };
    }

    function getExamMeta(exam = {}) {
        return exam?.meta && typeof exam.meta === 'object' ? exam.meta : {};
    }

    function getExamCohortId(examId = '', exam = {}) {
        const meta = getExamMeta(exam);
        const candidates = [
            meta.cohortId,
            meta.cohort_id,
            exam.cohortId,
            exam.cohort_id,
            examId
        ].map(text).filter(Boolean);
        for (const candidate of candidates) {
            const match = candidate.match(/20\d{2}/);
            if (match) return match[0];
        }
        return '';
    }

    function getExamAcademicYear(examId = '', exam = {}) {
        const meta = getExamMeta(exam);
        const candidates = [
            meta.year,
            meta.academicYear,
            meta.academic_year,
            exam.academicYear,
            exam.academic_year,
            examId
        ].map(text).filter(Boolean);
        for (const candidate of candidates) {
            const match = candidate.match(/(20\d{2})\s*[-~—至]\s*(20\d{2})/);
            if (match) return `${match[1]}-${match[2]}`;
        }
        return '';
    }

    function getExamGrade(examId = '', exam = {}, rows = []) {
        const meta = getExamMeta(exam);
        const candidates = [
            meta.grade,
            meta.gradeLabel,
            exam.grade,
            exam.gradeLabel,
            examId
        ].map(text).filter(Boolean);
        for (const candidate of candidates) {
            const grade = normalizeGrade(candidate);
            if (grade) return grade;
        }
        const classGrades = (rows || []).map((row) => inferGradeFromClass(row?.class)).filter(Boolean);
        return classGrades.length ? classGrades[0] : '';
    }

    function getExamTimestamp(examId = '', exam = {}) {
        if (typeof root.getExamRecordDateSortTimestamp === 'function') {
            const ts = root.getExamRecordDateSortTimestamp(examId, exam);
            if (Number.isFinite(Number(ts)) && Number(ts) > 0) return Number(ts);
        }
        const context = { currentExamId: examId, exam };
        const date = extractExamDate(context);
        const dateTs = date ? Date.parse(`${date.length === 7 ? `${date}-01` : date}T00:00:00`) : 0;
        if (Number.isFinite(dateTs) && dateTs > 0) return dateTs;
        return Number(exam?.updatedAt || exam?.createdAt || 0);
    }

    function isSecondMockExam(examId = '', exam = {}) {
        const meta = getExamMeta(exam);
        const haystack = [
            examId,
            meta.type,
            meta.name,
            meta.examName,
            exam.name,
            exam.title,
            exam.label
        ].map(text).join(' ');
        return /二模/.test(haystack);
    }

    function getExamRows(exam = {}) {
        return Array.isArray(exam?.data) ? exam.data : [];
    }

    function getSecondMockSubjectsForGrade(grade) {
        return ASSESSMENT_SECOND_MOCK_SUBJECTS_BY_GRADE[normalizeGrade(grade)] || [];
    }

    function isSecondMockAssessmentTeacher(teacher) {
        return getSecondMockSubjectsForGrade(teacher?.grade).includes(normalizeSubject(teacher?.subject));
    }

    function isGrade8SecondMockAssessmentTeacher(teacher) {
        return isSecondMockAssessmentTeacher(teacher)
            && normalizeGrade(teacher?.grade) === '8'
            && GRADE8_SECOND_MOCK_ASSESSMENT_SUBJECTS.has(normalizeSubject(teacher?.subject));
    }

    function getCurrentCompositeBaseInfo(rows, context) {
        const currentExam = context.exam || {};
        return {
            cohortId: getExamCohortId(context.currentExamId, currentExam),
            academicYear: getExamAcademicYear(context.currentExamId, currentExam),
            grade: getExamGrade(context.currentExamId, currentExam, rows)
        };
    }

    function findLatestSecondMockExam(baseInfo, currentContext) {
        const exams = currentContext.db?.exams || {};
        const candidates = Object.entries(exams)
            .map(([examId, exam]) => ({ examId, exam }))
            .filter(({ examId, exam }) => examId !== currentContext.currentExamId)
            .filter(({ examId, exam }) => isSecondMockExam(examId, exam))
            .filter(({ examId, exam }) => getExamRows(exam).length > 0)
            .filter(({ examId, exam }) => !baseInfo.cohortId || getExamCohortId(examId, exam) === baseInfo.cohortId)
            .filter(({ examId, exam }) => !baseInfo.academicYear || getExamAcademicYear(examId, exam) === baseInfo.academicYear)
            .sort((left, right) => getExamTimestamp(right.examId, right.exam) - getExamTimestamp(left.examId, left.exam));
        return candidates[0] || null;
    }

    function getExamSearchText(examId = '', exam = {}) {
        const meta = getExamMeta(exam);
        return [
            examId,
            meta.type,
            meta.name,
            meta.examName,
            meta.term,
            exam.name,
            exam.title,
            exam.label
        ].map(text).join(' ');
    }

    function isGrade6GrowthBaselineExam(examId = '', exam = {}, baselineType = 'first_term_final') {
        const haystack = getExamSearchText(examId, exam);
        if (baselineType === 'first_term_midterm') return /期中/.test(haystack);
        return /期末/.test(haystack);
    }

    function isLikelyFirstTermExam(examId = '', exam = {}) {
        const haystack = getExamSearchText(examId, exam);
        if (/上学期|第一学期|一学期|上期/.test(haystack)) return true;
        const month = extractExamMonth({ currentExamId: examId, exam });
        return [9, 10, 11, 12, 1, 2].includes(month);
    }

    function findGrade6GrowthBaselineExam(baseInfo, currentContext, baselineType = 'first_term_final') {
        const exams = currentContext.db?.exams || {};
        const candidates = Object.entries(exams)
            .map(([examId, exam]) => ({ examId, exam }))
            .filter(({ examId }) => examId !== currentContext.currentExamId)
            .filter(({ examId, exam }) => getExamRows(exam).length > 0)
            .filter(({ examId, exam }) => normalizeGrade(getExamGrade(examId, exam, getExamRows(exam))) === '6')
            .filter(({ examId, exam }) => !baseInfo.cohortId || getExamCohortId(examId, exam) === baseInfo.cohortId)
            .filter(({ examId, exam }) => !baseInfo.academicYear || getExamAcademicYear(examId, exam) === baseInfo.academicYear)
            .filter(({ examId, exam }) => isGrade6GrowthBaselineExam(examId, exam, baselineType))
            .filter(({ examId, exam }) => isLikelyFirstTermExam(examId, exam))
            .sort((left, right) => getExamTimestamp(right.examId, right.exam) - getExamTimestamp(left.examId, left.exam));
        return candidates[0] || null;
    }

    function findPreviousJulyGrowthBaselineExam(baseInfo, currentContext) {
        const exams = currentContext.db?.exams || {};
        const currentTs = getExamTimestamp(currentContext.currentExamId, currentContext.exam || {});
        const currentGrade = Number(normalizeGrade(baseInfo.grade));
        const previousGrade = Number.isFinite(currentGrade) && currentGrade > 6 ? String(currentGrade - 1) : '';
        const candidates = Object.entries(exams)
            .map(([examId, exam]) => ({ examId, exam }))
            .filter(({ examId }) => examId !== currentContext.currentExamId)
            .filter(({ exam }) => getExamRows(exam).length > 0)
            .filter(({ examId, exam }) => extractExamMonth({ currentExamId: examId, exam }) === 7)
            .filter(({ examId, exam }) => {
                const ts = getExamTimestamp(examId, exam);
                return !currentTs || !ts || ts < currentTs;
            })
            .filter(({ examId, exam }) => !baseInfo.cohortId || getExamCohortId(examId, exam) === baseInfo.cohortId)
            .filter(({ examId, exam }) => !previousGrade || normalizeGrade(getExamGrade(examId, exam, getExamRows(exam))) === previousGrade)
            .sort((left, right) => getExamTimestamp(right.examId, right.exam) - getExamTimestamp(left.examId, left.exam));
        return candidates[0] || null;
    }

    function findGrowthBaselineExam(baseInfo, currentContext, syncSettings = {}) {
        const grade = normalizeGrade(baseInfo.grade);
        if (grade === '6') {
            return findGrade6GrowthBaselineExam(baseInfo, currentContext, syncSettings.grade6_growth_baseline);
        }
        return findPreviousJulyGrowthBaselineExam(baseInfo, currentContext);
    }

    function normalizeStudentName(row) {
        return text(row?.name || row?.studentName || row?.student_name || row?.姓名 || row?.student || '').replace(/\s+/g, '');
    }

    function normalizeStudentClass(row) {
        const raw = row?.class ?? row?.className ?? row?.班级 ?? '';
        return typeof root.normalizeClass === 'function' ? root.normalizeClass(raw) : text(raw);
    }

    function buildStudentExactKey(row) {
        return [
            normalizeSchoolForSync(row?.school),
            normalizeStudentName(row),
            normalizeStudentClass(row)
        ].join('::');
    }

    function buildStudentNameKey(row) {
        return [
            normalizeSchoolForSync(row?.school),
            normalizeStudentName(row)
        ].join('::');
    }

    function buildStudentGradeNameKey(row, fallbackGrade = '') {
        return [
            normalizeSchoolForSync(row?.school),
            normalizeGrade(fallbackGrade || getExamGrade('', {}, [row])),
            normalizeStudentName(row)
        ].join('::');
    }

    function sortRowsByTotalDesc(rows) {
        return (rows || []).slice().sort((left, right) => getTotal(right) - getTotal(left));
    }

    function indexBaselineRowsForGrowth(rows, fallbackGrade = '') {
        const exact = new Map();
        const byGradeName = new Map();
        (rows || []).forEach((row) => {
            const exactKey = buildStudentExactKey(row);
            if (!exact.has(exactKey)) exact.set(exactKey, []);
            exact.get(exactKey).push(row);

            const nameKey = buildStudentGradeNameKey(row, fallbackGrade);
            if (!byGradeName.has(nameKey)) byGradeName.set(nameKey, []);
            byGradeName.get(nameKey).push(row);
        });
        byGradeName.forEach((items, key) => {
            byGradeName.set(key, sortRowsByTotalDesc(items));
        });
        return { exact, byGradeName };
    }

    function teacherKeyFor(name, grade, subject) {
        return `${text(name)}::${normalizeGrade(grade)}::${normalizeSubject(subject)}`;
    }

    function filterItemsByTeacherSet(items, teacherSet) {
        if (!teacherSet?.size) return [];
        return (items || []).filter((item) => teacherSet.has(teacherKeyFor(item.teacher_name, item.grade, item.subject)));
    }

    function attachSourceToItems(items, source = {}) {
        const suffix = source.noteSuffix ? ` ${source.noteSuffix}` : '';
        return (items || []).map((item) => ({
            ...item,
            source_exam_id: source.examId || '',
            source_exam_label: source.examLabel || '',
            source_exam_date: source.examDate || '',
            note: `${item.note} 来源考试：${source.examDate || source.examLabel || source.examId || '未识别'}。${suffix}`.trim()
        }));
    }

    function withCompositeTeacherStats(rows, examContext, callback) {
        const previousRows = root.RAW_DATA;
        const previousStats = root.TEACHER_STATS;
        const previousThresholds = root.THRESHOLDS;
        root.RAW_DATA = rows;
        root.TEACHER_STATS = {};
        if (examContext?.exam?.thresholds && typeof examContext.exam.thresholds === 'object') {
            root.THRESHOLDS = examContext.exam.thresholds;
        }
        ensureTeacherStats();
        try {
            return callback();
        } finally {
            root.RAW_DATA = previousRows;
            root.TEACHER_STATS = previousStats;
            root.THRESHOLDS = previousThresholds;
        }
    }

    function buildAssessmentItemsForRows({ teachers, rows, examContext, syncSettings, skipped, sourceNoteSuffix = '' }) {
        const baseInfo = getCurrentCompositeBaseInfo(rows, examContext);
        const growthBaselineExam = findGrowthBaselineExam(baseInfo, examContext, syncSettings);
        const grade = normalizeGrade(baseInfo.grade);
        const thresholds = readAssessmentThresholds(examContext);
        const requiredThresholds = new Set(['total', ...(teachers || []).map((teacher) => normalizeSubject(teacher.subject)).filter(Boolean)]);
        const missingThresholds = Array.from(requiredThresholds).filter((subject) => !getAssessmentThreshold(thresholds, subject));
        const roster = getAssessmentRosterReadiness(teachers, rows, examContext);
        if (missingThresholds.length) {
            skipped.push(`${gradeLabel(baseInfo.grade)}联考分析缺少已确认的${missingThresholds.map((subject) => subject === 'total' ? '总分' : subject).join('、')}优秀线/及格线，教师个人自动分不生成。`);
        }
        if (!roster.ready) {
            skipped.push(`${gradeLabel(baseInfo.grade)}未锁定95%考核名册：${roster.missing.join('、')}；为避免以不完整人数写入教师自动分，本次不生成正式同步分。`);
        }
        if (missingThresholds.length || !roster.ready) {
            return {
                baseInfo,
                growthBaselineExam,
                thresholds,
                roster,
                items: []
            };
        }
        if (!growthBaselineExam) {
            if (grade === '6') {
                skipped.push(`6年级优秀率增幅基准已设置为${syncSettings.grade6_growth_baseline === 'first_term_midterm' ? '上学期期中' : '上学期期末'}，但 system 未找到同届同学年度对应考试；两率一分仅同步54分主体。`);
            } else if (grade) {
                skipped.push(`${grade}年级优秀率增幅需要同一届学生上年度7月成绩作基准，但 system 未找到对应考试；两率一分仅同步54分主体。`);
            }
        }
        const items = withCompositeTeacherStats(rows, examContext, () => {
            let growthContext = null;
            if (growthBaselineExam) {
                growthContext = buildStudentGrowthContext(teachers, rows, getExamRows(growthBaselineExam.exam), {
                    id: growthBaselineExam.examId,
                    label: getExamLabel({ currentExamId: growthBaselineExam.examId, exam: growthBaselineExam.exam }),
                    date: extractExamDate({ currentExamId: growthBaselineExam.examId, exam: growthBaselineExam.exam }),
                    type: syncSettings.grade6_growth_baseline,
                    grade: baseInfo.grade,
                    baselineGrade: getExamGrade(growthBaselineExam.examId, growthBaselineExam.exam, getExamRows(growthBaselineExam.exam)),
                    thresholds: readAssessmentThresholds({ exam: growthBaselineExam.exam })
                });
                if (!growthContext) {
                    skipped.push(`${gradeLabel(baseInfo.grade)}优秀率增幅基准考试已匹配，但当前学生无法与基准考试按姓名/年级重组；两率一分仅同步54分主体。`);
                }
            }
            return [
                ...buildTwoRatesItems(teachers, rows, { grade6GrowthContext: growthContext, thresholds, examContext, skipped }),
                ...buildClassCollaborationItems(teachers, rows, { thresholds, examContext, skipped }),
                ...buildSubjectCollaborationItems(teachers, rows, { thresholds, examContext, skipped }),
                ...buildBottomThirdItems(teachers, rows, { thresholds, examContext, skipped }),
                ...buildExcellentContributionItems(teachers, rows, { examContext, skipped })
            ];
        }).filter((item) => Number.isFinite(toNumber(item.score, NaN)) && item.score >= 0);
        const examDate = extractExamDate(examContext);
        const examLabel = getExamLabel(examContext);
        const source = {
            baseInfo,
            growthBaselineExam,
            examId: examContext.currentExamId,
            examLabel,
            examDate
        };
        const withGrowthNotes = items.map((item) => {
            const growthSuffix = item.project_id === PROJECTS.twoRates
                ? `${normalizeGrade(item.grade) === '6' ? `6年级增幅基准：${syncSettings.grade6_growth_baseline === 'first_term_midterm' ? '上学期期中' : '上学期期末'}；` : '优秀率增幅基准：上年度7月同一批学生；'}基准考试：${growthBaselineExam ? (extractExamDate({ currentExamId: growthBaselineExam.examId, exam: growthBaselineExam.exam }) || getExamLabel({ currentExamId: growthBaselineExam.examId, exam: growthBaselineExam.exam })) : '未匹配'}。`
                : '';
            return {
                ...item,
                note: `${item.note}${growthSuffix}`
            };
        });
        return {
            baseInfo,
            growthBaselineExam,
            thresholds,
            roster,
            items: attachSourceToItems(withGrowthNotes, {
                examId: source.examId,
                examLabel: source.examLabel,
                examDate: source.examDate,
                noteSuffix: sourceNoteSuffix
            })
        };
    }

    function getTotal(row) {
        const direct = toNumber(row?.total ?? row?.totalScore ?? row?.score_total, NaN);
        if (Number.isFinite(direct)) return direct;
        const scores = row?.scores && typeof row.scores === 'object' ? row.scores : {};
        const values = Object.values(scores).map((value) => toNumber(value, NaN)).filter(Number.isFinite);
        return values.length ? values.reduce((sum, value) => sum + value, 0) : NaN;
    }

    function getSubjectScore(row, subject) {
        const normalized = normalizeSubject(subject);
        const scores = row?.scores && typeof row.scores === 'object' ? row.scores : {};
        for (const [key, value] of Object.entries(scores)) {
            if (normalizeSubject(key) === normalized) return toNumber(value, NaN);
        }
        return NaN;
    }

    function inferGradeFromClass(className) {
        const cls = text(className);
        const match = cls.match(/[6-9]/);
        return match ? match[0] : '';
    }

    function resolveTotalThresholds(rows) {
        const totals = rows.map(getTotal).filter(Number.isFinite).sort((a, b) => b - a);
        if (!totals.length) return { exc: 0, pass: 0 };
        const totalMax = Math.max(...totals, 1);
        const at = (ratio) => totals[Math.min(totals.length - 1, Math.max(0, Math.floor((totals.length - 1) * ratio)))] || 0;
        return {
            exc: Math.max(at(0.20), totalMax * 0.80),
            pass: Math.max(at(0.60), totalMax * 0.60)
        };
    }

    function metricFromValues(values, thresholds) {
        const list = values.filter(Number.isFinite);
        if (!list.length) return null;
        const total = list.reduce((sum, value) => sum + value, 0);
        return {
            count: list.length,
            avg: total / list.length,
            excellentRate: thresholds.exc > 0 ? list.filter((value) => value >= thresholds.exc).length / list.length : 0,
            passRate: thresholds.pass > 0 ? list.filter((value) => value >= thresholds.pass).length / list.length : 0
        };
    }

    function weightedScore(metric, highest) {
        if (!metric || !highest) return null;
        const raw = [
            highest.excellentRate > 0 ? (metric.excellentRate / highest.excellentRate) * 40 : 0,
            highest.passRate > 0 ? (metric.passRate / highest.passRate) * 30 : 0,
            highest.avg > 0 ? (metric.avg / highest.avg) * 30 : 0
        ].reduce((sum, value) => sum + value, 0);
        return raw;
    }

    function scaleWithinGroup(rawScores, maxScore) {
        const maxRaw = Math.max(...rawScores.map((item) => toNumber(item.raw, 0)), 0);
        return rawScores.map((item) => ({
            ...item,
            score: maxRaw > 0 ? round((item.raw / maxRaw) * maxScore, 2) : 0
        }));
    }

    function readTeacherAssignments() {
        return Object.entries(root.TEACHER_MAP || {}).map(([key, teacherName]) => {
            const [rawClass, rawSubject] = text(key).split('_');
            const className = typeof root.normalizeClass === 'function' ? root.normalizeClass(rawClass) : text(rawClass);
            return {
                key,
                teacherName: text(teacherName),
                className,
                grade: inferGradeFromClass(className),
                subject: normalizeSubject(rawSubject),
                school: normalizeSchoolForSync((root.TEACHER_SCHOOL_MAP || {})[key] || root.MY_SCHOOL || '')
            };
        }).filter((item) => item.teacherName && item.className && item.subject && isTeacherAssessmentSubject(item.subject));
    }

    function isTeacherAssessmentSubject(subject) {
        return normalizeSubject(subject) !== '体育';
    }

    function groupAssignmentsByTeacher(assignments) {
        const map = new Map();
        assignments.forEach((assignment) => {
            const key = `${assignment.teacherName}::${assignment.grade}::${assignment.subject}`;
            if (!map.has(key)) {
                map.set(key, {
                    teacher_name: assignment.teacherName,
                    grade: assignment.grade,
                    subject: assignment.subject,
                    classes: [],
                    school: assignment.school
                });
            }
            const current = map.get(key);
            current.classes.push(assignment.className);
        });
        return Array.from(map.values()).map((item) => ({
            ...item,
            classes: Array.from(new Set(item.classes))
        })).sort(sortTeacherItems);
    }

    function sortTeacherItems(left, right) {
        const gradeDiff = toNumber(left.grade, 99) - toNumber(right.grade, 99);
        if (gradeDiff) return gradeDiff;
        const subjectDiff = SUBJECT_ORDER.indexOf(left.subject) - SUBJECT_ORDER.indexOf(right.subject);
        if (subjectDiff) return subjectDiff;
        return text(left.teacher_name).localeCompare(text(right.teacher_name), 'zh-Hans-CN');
    }

    function ensureTeacherStats() {
        if (typeof root.analyzeTeachersV2 === 'function') {
            try {
                root.analyzeTeachersV2({ force: true, render: false, township: false, teacherMetricScope: 'admin' });
            } catch (error) {
                console.warn('[assessment-sync] teacher analysis failed:', error);
            }
        }
        if (typeof root.calculateTeacherTownshipRanking === 'function') {
            try {
                root.calculateTeacherTownshipRanking({ force: true, teacherMetricScope: 'admin' });
            } catch (error) {
                console.warn('[assessment-sync] township ranking failed:', error);
            }
        }
    }

    function getTeacherSubjectStats(stats, teacherName, subject) {
        const record = stats?.[teacherName];
        if (!record || typeof record !== 'object') return null;
        const normalized = normalizeSubject(subject);
        return record.subjects?.[subject]
            || record.subjects?.[normalized]
            || record[subject]
            || record[normalized]
            || null;
    }

    function buildTownSubjectHighest(rows, thresholds) {
        const subjectValues = new Map();
        rows.forEach((row) => {
            const scores = row?.scores && typeof row.scores === 'object' ? row.scores : {};
            Object.keys(scores).forEach((rawSubject) => {
                const subject = normalizeSubject(rawSubject);
                const value = getSubjectScore(row, subject);
                if (!subject || !Number.isFinite(value)) return;
                if (!subjectValues.has(subject)) subjectValues.set(subject, []);
                subjectValues.get(subject).push(value);
            });
        });
        const schoolSubject = new Map();
        rows.forEach((row) => {
            const school = normalizeSchoolForSync(row?.school);
            if (!school) return;
            const scores = row?.scores && typeof row.scores === 'object' ? row.scores : {};
            Object.keys(scores).forEach((rawSubject) => {
                const subject = normalizeSubject(rawSubject);
                const value = getSubjectScore(row, subject);
                if (!subject || !Number.isFinite(value)) return;
                const key = `${school}::${subject}`;
                if (!schoolSubject.has(key)) schoolSubject.set(key, { school, subject, values: [] });
                schoolSubject.get(key).values.push(value);
            });
        });
        const highest = new Map();
        schoolSubject.forEach((entry) => {
            const threshold = getAssessmentThreshold(thresholds, entry.subject);
            if (!threshold) return;
            const metric = metricFromValues(entry.values, threshold);
            if (!metric) return;
            const current = highest.get(entry.subject) || { excellentRate: 0, passRate: 0, avg: 0 };
            highest.set(entry.subject, {
                excellentRate: Math.max(current.excellentRate, metric.excellentRate),
                passRate: Math.max(current.passRate, metric.passRate),
                avg: Math.max(current.avg, metric.avg)
            });
        });
        return highest;
    }

    function getSubjectExcellentThreshold(thresholds, subject) {
        return getAssessmentThreshold(thresholds, subject)?.exc ?? NaN;
    }

    function buildGrowthBaselineMatchedRows(teacher, currentRows, baselineRows, fallbackGrade = '') {
        const baselineIndex = indexBaselineRowsForGrowth(baselineRows, fallbackGrade);
        const teacherClasses = new Set((teacher.classes || []).map(text));
        const currentCandidates = (currentRows || [])
            .filter((row) => teacherClasses.has(normalizeStudentClass(row)))
            .filter((row) => Number.isFinite(getSubjectScore(row, teacher.subject)))
            .filter((row) => normalizeSchoolForSync(row?.school) === normalizeSchoolForSync(teacher.school));
        const exactMatchedBaselineRows = new Set();
        const matched = [];
        const unmatched = [];

        currentCandidates.forEach((row) => {
            const exactRows = baselineIndex.exact.get(buildStudentExactKey(row)) || [];
            const available = exactRows.filter((item) => !exactMatchedBaselineRows.has(item));
            if (available.length === 1) {
                exactMatchedBaselineRows.add(available[0]);
                matched.push({ current: row, baseline: available[0], mode: 'same-class' });
                return;
            }
            unmatched.push(row);
        });

        const currentGroups = new Map();
        unmatched.forEach((row) => {
            const key = buildStudentGradeNameKey(row, fallbackGrade);
            if (!currentGroups.has(key)) currentGroups.set(key, []);
            currentGroups.get(key).push(row);
        });

        const matchedCurrentRows = new Set(matched.map((item) => item.current));
        currentGroups.forEach((groupRows, key) => {
            const orderedCurrent = sortRowsByTotalDesc(groupRows);
            const orderedBaseline = (baselineIndex.byGradeName.get(key) || [])
                .filter((row) => !exactMatchedBaselineRows.has(row));
            orderedCurrent.forEach((row, index) => {
                const baseline = orderedBaseline[index];
                if (!baseline) return;
                matched.push({ current: row, baseline, mode: orderedBaseline.length > 1 ? 'same-name-rank' : 'same-name' });
                matchedCurrentRows.add(row);
            });
        });

        return {
            matched,
            unmatched: currentCandidates
                .filter((row) => !matchedCurrentRows.has(row))
                .map((row) => ({
                    row,
                    reason: '基准考试中未找到同一学生可比成绩，可能是厌学、生病、缺考、转入转出或只有一次成绩记录'
                })),
            currentCount: currentCandidates.length
        };
    }

    function summarizeBaselineGrowthForTeacher(teacher, currentRows, baselineRows, fallbackGrade = '', baselineThresholds = null) {
        const current = getTeacherSubjectStats(root.TEACHER_STATS || {}, teacher.teacher_name, teacher.subject);
        if (!current || !toNumber(current.studentCount, 0)) return null;
        const matchResult = buildGrowthBaselineMatchedRows(teacher, currentRows, baselineRows, fallbackGrade);
        const usableMatches = matchResult.matched.filter((item) => Number.isFinite(getSubjectScore(item.baseline, teacher.subject)));
        const baselineScores = usableMatches.map((item) => getSubjectScore(item.baseline, teacher.subject));
        const subjectMissing = matchResult.matched
            .filter((item) => !Number.isFinite(getSubjectScore(item.baseline, teacher.subject)))
            .map((item) => ({
                row: item.current,
                reason: `基准考试中找到学生，但缺少${teacher.subject}成绩，不能参与优秀率增幅比较`
            }));
        const ignored = matchResult.unmatched.concat(subjectMissing);
        if (!baselineScores.length && !ignored.length) return null;
        const baselineThreshold = getSubjectExcellentThreshold(baselineThresholds, teacher.subject);
        if (!Number.isFinite(baselineThreshold)) return null;
        if (!baselineScores.length) return null;
        return {
            teacher,
            currentExcellentRate: toNumber(current.excellentRate, 0),
            currentStudentCount: toNumber(current.studentCount, 0),
            baselineStudentCount: baselineScores.length,
            baselineExcellentRate: baselineScores.filter((score) => score >= baselineThreshold).length / baselineScores.length,
            rankMatchedCount: usableMatches.filter((item) => item.mode === 'same-name-rank').length,
            fallbackMatchedCount: usableMatches.filter((item) => item.mode === 'same-name').length,
            ignoredStudentCount: ignored.length,
            ignoredStudents: ignored.slice(0, 12).map((item) => ({
                name: normalizeStudentName(item.row),
                className: normalizeStudentClass(item.row),
                reason: item.reason
            })),
            ignoredStudentOverflow: Math.max(ignored.length - 12, 0)
        };
    }

    function buildStudentGrowthContext(teachers, currentRows, baselineRows, baselineInfo) {
        if (!baselineRows?.length) return null;
        const fallbackGrade = normalizeGrade(baselineInfo?.baselineGrade || baselineInfo?.grade || '');
        const targetGrade = normalizeGrade(baselineInfo?.grade || '');
        const baselineThresholds = baselineInfo?.thresholds || null;
        const entries = teachers
            .filter((teacher) => !targetGrade || normalizeGrade(teacher.grade) === targetGrade)
            .map((teacher) => summarizeBaselineGrowthForTeacher(teacher, currentRows, baselineRows, fallbackGrade, baselineThresholds))
            .filter(Boolean);
        if (!entries.length) return null;

        const subjectAverages = new Map();
        entries.forEach((entry) => {
            const subject = entry.teacher.subject;
            if (!subjectAverages.has(subject)) subjectAverages.set(subject, { weightedSum: 0, count: 0 });
            const current = subjectAverages.get(subject);
            current.weightedSum += entry.currentExcellentRate * entry.currentStudentCount;
            current.count += entry.currentStudentCount;
        });
        subjectAverages.forEach((value, subject) => {
            subjectAverages.set(subject, value.count ? value.weightedSum / value.count : 0);
        });

        const byKey = new Map();
        const highestBySubject = new Map();
        entries.forEach((entry) => {
            const subjectAverage = subjectAverages.get(entry.teacher.subject) || 0;
            const regularGrowth = entry.currentExcellentRate - entry.baselineExcellentRate;
            const specialGrowth = entry.currentExcellentRate >= entry.baselineExcellentRate
                ? entry.currentExcellentRate - subjectAverage
                : 0;
            const growth = Math.max(regularGrowth, specialGrowth, 0);
            const key = teacherKeyFor(entry.teacher.teacher_name, entry.teacher.grade, entry.teacher.subject);
            byKey.set(key, {
                ...entry,
                subjectAverage,
                regularGrowth,
                specialGrowth,
                growth
            });
            highestBySubject.set(entry.teacher.subject, Math.max(highestBySubject.get(entry.teacher.subject) || 0, growth));
        });

        return { byKey, highestBySubject, baselineInfo };
    }

    function getGrade6GrowthScore(context, teacher) {
        if (!context) return null;
        const key = teacherKeyFor(teacher.teacher_name, teacher.grade, teacher.subject);
        const entry = context.byKey.get(key);
        if (!entry) return null;
        const highest = context.highestBySubject.get(teacher.subject) || 0;
        const score = highest > 0 ? round((entry.growth / highest) * 6, 2) : 0;
        return { ...entry, highest, score };
    }

    function buildTwoRatesItems(teachers, rows, options = {}) {
        const stats = root.TEACHER_STATS || {};
        const townHighestBySubject = buildTownSubjectHighest(rows, options.thresholds);
        const growthContext = options.grade6GrowthContext || null;
        const bySubject = new Map();
        teachers.forEach((teacher) => {
            const data = getTeacherSubjectStats(stats, teacher.teacher_name, teacher.subject);
            if (!data || !toNumber(data.studentCount, 0)) return;
            const subjectKey = teacher.subject;
            if (!bySubject.has(subjectKey)) bySubject.set(subjectKey, []);
            bySubject.get(subjectKey).push({ teacher, data });
        });

        const items = [];
        bySubject.forEach((entries) => {
            const subject = entries[0]?.teacher?.subject;
            const highest = townHighestBySubject.get(subject);
            if (!highest) {
                options.skipped?.push(`${subject}未找到联考分析已确认分数线对应的全镇学校比较值，两率一分不生成。`);
                return;
            }
            const rawScores = entries.map((entry) => ({
                teacher: entry.teacher,
                data: entry.data,
                raw: weightedScore({
                    excellentRate: toNumber(entry.data.excellentRate, 0),
                    passRate: toNumber(entry.data.passRate, 0),
                    avg: toNumber(entry.data.avgValue ?? entry.data.avg, 0)
                }, highest)
            })).filter((entry) => Number.isFinite(entry.raw));
            scaleWithinGroup(rawScores, 54).forEach((entry) => {
                const growth = getGrade6GrowthScore(growthContext, entry.teacher);
                const score = round(entry.score + (growth?.score || 0), 2);
                const ignoredSummary = growth?.ignoredStudentCount
                    ? `；${growth.ignoredStudentCount} 名学生因只有一次可比成绩或基准学科成绩缺失已按规则忽略`
                    : '';
                const growthNote = growth
                    ? `优秀率增幅 ${growth.score}/6；基准：${growthContext.baselineInfo.label || growthContext.baselineInfo.id}；按当前任教班级学生名单重组基准成绩 ${growth.baselineStudentCount}/${growth.currentStudentCount} 人，同年级重名按当前/基准总分高低顺位配对 ${growth.rankMatchedCount} 人${ignoredSummary}；常规增幅 ${pct(growth.regularGrowth)}，特殊增幅 ${pct(growth.specialGrowth)}，采用 ${pct(growth.growth)}，本学科最高增幅 ${pct(growth.highest)}。`
                    : '优秀率增幅未自动加入：未匹配到对应基准考试，或当前学生在基准考试中无法按姓名/年级匹配重组。';
                const growthWarning = growth?.ignoredStudentCount ? {
                    title: '优秀率增幅有学生未参与比较',
                    message: [
                        `${entry.teacher.teacher_name} ${gradeLabel(entry.teacher.grade)} ${entry.teacher.subject} 有 ${growth.ignoredStudentCount} 名当前任教学生没有进入增幅计算。`,
                        '原因：增幅只比较前后两次都有可比成绩的同一批学生；厌学、生病、缺考、转入转出或只有一次成绩记录的学生按规则忽略，不补零、不强行配对。',
                        `已匹配重组基准成绩 ${growth.baselineStudentCount}/${growth.currentStudentCount} 人；同年级重名顺位配对 ${growth.rankMatchedCount} 人。`,
                        growth.ignoredStudents?.length
                            ? `被忽略学生：${growth.ignoredStudents.map((student) => `${student.name || '未命名'}（${student.className || '未识别班级'}，${student.reason}）`).join('；')}${growth.ignoredStudentOverflow ? `；另有 ${growth.ignoredStudentOverflow} 人未展开` : ''}`
                            : ''
                    ].filter(Boolean).join('\n')
                } : null;
                items.push({
                    ...entry.teacher,
                    project_id: PROJECTS.twoRates,
                    score,
                    max_score: 60,
                    note: `联考两率一分主体 ${entry.score}/54；分数线取联考分析已确认的${subject}优秀线/及格线，乡镇最高学校指标比较含本校；优秀率 ${pct(entry.data.excellentRate)}，及格率 ${pct(entry.data.passRate)}，均分 ${round(entry.data.avgValue ?? entry.data.avg, 2)}。${growthNote}`,
                    warning: growthWarning,
                    source: 'teaching-management'
                });
            });
        });
        return items;
    }

    function buildClassMetrics(rows, options = {}) {
        const thresholds = options.thresholds;
        const context = options.examContext || getCurrentExamContext();
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        const classes = new Map();
        (rows || []).forEach((row) => {
            const school = normalizeSchoolForSync(row?.school);
            const className = normalizeStudentClass(row);
            if (!school || !className) return;
            const key = `${school}::${className}`;
            if (!classes.has(key)) classes.set(key, { school, className });
        });
        const entries = [];
        const missingRoster = [];
        classes.forEach((item) => {
            let totals;
            let zeroFill = 0;
            let snapshot = null;
            if (item.school === ownSchool) {
                const roster = assessmentRosterValues(rows, context, item.school, item.className, getTotal);
                if (!roster.ready) {
                    missingRoster.push(item.className);
                    return;
                }
                totals = roster.values;
                zeroFill = roster.zero_fill;
                snapshot = roster.snapshot;
            } else {
                totals = (rows || [])
                    .filter((row) => normalizeSchoolForSync(row?.school) === item.school && normalizeStudentClass(row) === item.className)
                    .map(getTotal)
                    .filter(Number.isFinite);
            }
            const metric = metricFromValues(totals, getAssessmentThreshold(thresholds, 'total'));
            if (metric) entries.push({ ...item, totals, metric, zero_fill: zeroFill, snapshot });
        });
        return { entries, missingRoster };
    }

    function buildClassCollaborationItems(teachers, rows, options = {}) {
        const classResult = buildClassMetrics(rows, options);
        const classMetrics = classResult.entries;
        if (classResult.missingRoster.length) {
            options.skipped?.push(`班级协调缺少已锁定95%名册：${classResult.missingRoster.join('、')}。`);
        }
        if (!classMetrics.length) return [];
        const highest = {
            excellentRate: Math.max(...classMetrics.map((item) => item.metric.excellentRate), 0),
            passRate: Math.max(...classMetrics.map((item) => item.metric.passRate), 0),
            avg: Math.max(...classMetrics.map((item) => item.metric.avg), 0)
        };
        const townHighestRaw = Math.max(...classMetrics.map((item) => weightedScore(item.metric, highest) || 0), 0);
        const metricByClass = new Map(classMetrics.map((item) => [`${item.school}::${item.className}`, item]));
        return teachers.map((teacher) => {
            const metrics = (teacher.classes || [])
                .map((className) => metricByClass.get(`${teacher.school}::${className}`))
                .filter(Boolean);
            const totalCount = metrics.reduce((sum, item) => sum + item.metric.count, 0);
            if (!totalCount || !townHighestRaw) return null;
            const metric = {
                count: totalCount,
                avg: metrics.reduce((sum, item) => sum + item.metric.avg * item.metric.count, 0) / totalCount,
                excellentRate: metrics.reduce((sum, item) => sum + item.metric.excellentRate * item.metric.count, 0) / totalCount,
                passRate: metrics.reduce((sum, item) => sum + item.metric.passRate * item.metric.count, 0) / totalCount
            };
            const raw = weightedScore(metric, highest);
            if (!Number.isFinite(raw)) return null;
            const zeroFill = metrics.reduce((sum, item) => sum + item.zero_fill, 0);
            return {
                ...teacher,
                project_id: PROJECTS.classCollaboration,
                score: round((raw / townHighestRaw) * 10, 2),
                max_score: 10,
                note: `按任教班级总分三项核算；优秀线/及格线取联考分析已确认总分线。原始成绩 ${round(raw, 2)}，全镇班级最高原始成绩 ${round(townHighestRaw, 2)}，按全镇原始最高值折算；优秀率 ${pct(metric.excellentRate)}，及格率 ${pct(metric.passRate)}，均分 ${round(metric.avg, 2)}；95%名册补零 ${zeroFill} 人。`,
                source: 'teaching-management',
                roster_zero_fill: zeroFill
            };
        }).filter(Boolean);
    }

    function buildSubjectCollaborationItems(teachers, rows, options = {}) {
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        const context = options.examContext || getCurrentExamContext();
        const subjects = new Set((teachers || []).map((teacher) => normalizeSubject(teacher.subject)).filter(Boolean));
        const schoolSubjects = new Map();
        (rows || []).forEach((row) => {
            const school = normalizeSchoolForSync(row?.school);
            if (!school) return;
            Object.keys(row?.scores || {}).forEach((rawSubject) => {
                const subject = normalizeSubject(rawSubject);
                const score = getSubjectScore(row, subject);
                if (!subjects.has(subject) || !Number.isFinite(score)) return;
                const key = `${school}::${subject}`;
                if (!schoolSubjects.has(key)) schoolSubjects.set(key, { school, subject, values: [] });
                schoolSubjects.get(key).values.push(score);
            });
        });

        const ownClasses = new Set((rows || [])
            .filter((row) => normalizeSchoolForSync(row?.school) === ownSchool)
            .map(normalizeStudentClass)
            .filter(Boolean));
        const ownSubjectValues = new Map();
        const missingRoster = new Set();
        subjects.forEach((subject) => {
            const values = [];
            ownClasses.forEach((className) => {
                const roster = assessmentRosterValues(rows, context, ownSchool, className, (row) => getSubjectScore(row, subject));
                if (!roster.ready) {
                    missingRoster.add(className);
                    return;
                }
                values.push(...roster.values);
            });
            if (values.length) ownSubjectValues.set(subject, values);
        });
        if (missingRoster.size) {
            options.skipped?.push(`学科协同缺少已锁定95%名册：${Array.from(missingRoster).join('、')}。`);
            return [];
        }
        ownSubjectValues.forEach((values, subject) => {
            const key = `${ownSchool}::${subject}`;
            schoolSubjects.set(key, { school: ownSchool, subject, values, roster_values: true });
        });

        const townBySubject = new Map();
        schoolSubjects.forEach((entry) => {
            const threshold = getAssessmentThreshold(options.thresholds, entry.subject);
            const metric = metricFromValues(entry.values, threshold);
            if (!metric) return;
            if (!townBySubject.has(entry.subject)) townBySubject.set(entry.subject, []);
            townBySubject.get(entry.subject).push({ ...entry, metric });
        });
        const townStats = new Map();
        townBySubject.forEach((entries, subject) => {
            const highest = {
                excellentRate: Math.max(...entries.map((entry) => entry.metric.excellentRate), 0),
                passRate: Math.max(...entries.map((entry) => entry.metric.passRate), 0),
                avg: Math.max(...entries.map((entry) => entry.metric.avg), 0)
            };
            townStats.set(subject, {
                entries,
                highest,
                highestRaw: Math.max(...entries.map((entry) => weightedScore(entry.metric, highest) || 0), 0)
            });
        });
        return (teachers || []).map((teacher) => {
            const subject = normalizeSubject(teacher.subject);
            const stats = townStats.get(subject);
            const entry = stats?.entries.find((item) => item.school === normalizeSchoolForSync(teacher.school));
            if (!stats?.highestRaw || !entry) return null;
            const raw = weightedScore(entry.metric, stats.highest);
            if (!Number.isFinite(raw)) return null;
            return {
                ...teacher,
                project_id: PROJECTS.subjectCollaboration,
                score: round((raw / stats.highestRaw) * 10, 2),
                max_score: 10,
                note: `本校${subject}学科组按联考分析已确认优秀线/及格线核算；原始成绩 ${round(raw, 2)}，全镇同学科最高原始成绩 ${round(stats.highestRaw, 2)}，按全镇原始最高值折算；优秀率 ${pct(entry.metric.excellentRate)}，及格率 ${pct(entry.metric.passRate)}，均分 ${round(entry.metric.avg, 2)}。`,
                source: 'teaching-management'
            };
        }).filter(Boolean);
    }

    function buildBottomThirdItems(teachers, rows, options = {}) {
        const schoolClassMetrics = buildClassMetrics(rows, options);
        if (schoolClassMetrics.missingRoster.length) {
            options.skipped?.push(`后 1/3 缺少已锁定95%名册：${schoolClassMetrics.missingRoster.join('、')}。`);
        }
        const bottomByClass = new Map();
        schoolClassMetrics.entries.forEach((item) => {
            const totals = item.totals.slice().sort((a, b) => a - b);
            const count = Math.max(1, Math.ceil(totals.length / 3));
            const bottom = totals.slice(0, count);
            const avg = bottom.reduce((sum, value) => sum + value, 0) / bottom.length;
            bottomByClass.set(`${item.school}::${item.className}`, {
                count,
                avg,
                zero_fill: item.zero_fill || 0
            });
        });
        const highestAvg = Math.max(...Array.from(bottomByClass.values()).map((item) => item.avg), 0);
        return (teachers || []).map((teacher) => {
            const metrics = (teacher.classes || [])
                .map((className) => bottomByClass.get(`${teacher.school}::${className}`))
                .filter(Boolean);
            const totalCount = metrics.reduce((sum, item) => sum + item.count, 0);
            if (!totalCount || !highestAvg) return null;
            const avg = metrics.reduce((sum, item) => sum + item.avg * item.count, 0) / totalCount;
            const zeroFill = metrics.reduce((sum, item) => sum + item.zero_fill, 0);
            return {
                ...teacher,
                project_id: PROJECTS.bottomThird,
                score: round((avg / highestAvg) * 10, 2),
                max_score: 10,
                note: `任教班级后 1/3 学生只按总分平均分核算；后 1/3 均分 ${round(avg, 2)}，全镇最高后 1/3 均分 ${round(highestAvg, 2)}；95%名册补零 ${zeroFill} 人。`,
                source: 'teaching-management',
                roster_zero_fill: zeroFill
            };
        }).filter(Boolean);
    }

    function buildExcellentContributionItems(teachers, rows, options = {}) {
        const grade = normalizeGrade(getCurrentCompositeBaseInfo(rows, options.examContext || getCurrentExamContext()).grade || getExamGrade('', {}, rows));
        if (grade === '9') return buildGrade9ExcellentContributionItems(teachers, rows);
        const ranked = rows.map((row) => ({
            row,
            total: getAssessmentTopTotal(row, grade)
        })).filter((item) => Number.isFinite(item.total)).sort((a, b) => b.total - a.total);
        const top = ranked.slice(0, 150);
        if (!top.length) return [];
        const contribution = new Map();
        teachers.forEach((teacher) => {
            teacher.classes.forEach((className) => {
                top.forEach(({ row }) => {
                    const rowClass = typeof root.normalizeClass === 'function' ? root.normalizeClass(row?.class) : text(row?.class);
                    if (rowClass !== className) return;
                    const score = getSubjectScore(row, teacher.subject);
                    if (!Number.isFinite(score)) return;
                    const key = `${teacher.teacher_name}::${teacher.grade}::${teacher.subject}`;
                    contribution.set(key, {
                        teacher,
                        value: (contribution.get(key)?.value || 0) + 1
                    });
                });
            });
        });
        const rawScores = Array.from(contribution.values()).map((item) => ({
            teacher: item.teacher,
            raw: item.value
        }));
        return scaleWithinGroup(rawScores, 5).map((entry) => ({
            ...entry.teacher,
            project_id: PROJECTS.excellentContribution,
            score: entry.score,
            max_score: 5,
            note: `按全镇前 150 名学生与本校任教学科匹配生成贡献值 ${entry.raw}；${grade === '8' ? '前150名总分固定为语文、数学、英语、物理、化学之和' : '前150名总分固定为语文、数学、英语之和'}，不使用Excel其它科目总分字段；再按本校教师内部最高贡献折算5分。`,
            source: 'teaching-management'
        }));
    }

    function getSubjectRankMap(rows, subject) {
        const ranked = rows
            .map((row) => ({ row, score: getSubjectScore(row, subject) }))
            .filter((item) => Number.isFinite(item.score))
            .sort((left, right) => right.score - left.score);
        const map = new Map();
        let lastScore = null;
        let lastRank = 0;
        ranked.forEach((item, index) => {
            if (lastScore === null || item.score !== lastScore) {
                lastScore = item.score;
                lastRank = index + 1;
            }
            map.set(item.row, lastRank);
        });
        return map;
    }

    function findTeachersForClassSubject(teachers, className, subject) {
        const normalizedClass = typeof root.normalizeClass === 'function' ? root.normalizeClass(className) : text(className);
        const normalizedSubject = normalizeSubject(subject);
        return teachers.filter((teacher) => (
            normalizeGrade(teacher.grade) === '9'
            && normalizeSubject(teacher.subject) === normalizedSubject
            && (teacher.classes || []).includes(normalizedClass)
        ));
    }

    function buildGrade9ExcellentContributionItems(teachers, rows) {
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        const subjects = Array.from(new Set(rows.flatMap((row) => Object.keys(row?.scores || {}).map(normalizeSubject)).filter(isTeacherAssessmentSubject)));
        const rankMaps = new Map(subjects.map((subject) => [subject, getSubjectRankMap(rows, subject)]));
        const contribution = new Map();
        const tierCounters = new Map();
        const qualifyingRows = rows
            .map((row) => ({ row, total: getTotal(row), school: normalizeSchoolForSync(row?.school) }))
            .filter((item) => item.school === ownSchool && Number.isFinite(item.total) && item.total >= 550);

        subjects.forEach((subject) => {
            const rankMap = rankMaps.get(subject) || new Map();
            const excellent = qualifyingRows
                .filter((item) => item.total >= 600 && Number.isFinite(getSubjectScore(item.row, subject)))
                .sort((left, right) => (rankMap.get(left.row) || 999999) - (rankMap.get(right.row) || 999999));
            const top = qualifyingRows
                .filter((item) => item.total >= 550 && item.total < 600 && Number.isFinite(getSubjectScore(item.row, subject)))
                .sort((left, right) => (rankMap.get(left.row) || 999999) - (rankMap.get(right.row) || 999999));
            excellent.forEach((item, index) => {
                const points = Math.max(0, 10 - index * 2);
                if (points <= 0) return;
                const className = typeof root.normalizeClass === 'function' ? root.normalizeClass(item.row?.class) : text(item.row?.class);
                findTeachersForClassSubject(teachers, className, subject).forEach((teacher) => {
                    const key = teacherKeyFor(teacher.teacher_name, teacher.grade, teacher.subject);
                    contribution.set(key, { teacher, value: (contribution.get(key)?.value || 0) + points });
                    tierCounters.set(key, { ...(tierCounters.get(key) || {}), excellent: ((tierCounters.get(key) || {}).excellent || 0) + 1 });
                });
            });
            top.forEach((item, index) => {
                const points = Math.max(0, 5 - index);
                if (points <= 0) return;
                const className = typeof root.normalizeClass === 'function' ? root.normalizeClass(item.row?.class) : text(item.row?.class);
                findTeachersForClassSubject(teachers, className, subject).forEach((teacher) => {
                    const key = teacherKeyFor(teacher.teacher_name, teacher.grade, teacher.subject);
                    contribution.set(key, { teacher, value: (contribution.get(key)?.value || 0) + points });
                    tierCounters.set(key, { ...(tierCounters.get(key) || {}), top: ((tierCounters.get(key) || {}).top || 0) + 1 });
                });
            });
        });

        const rawScores = Array.from(contribution.entries()).map(([key, item]) => ({
            teacher: item.teacher,
            raw: item.value,
            counters: tierCounters.get(key) || {}
        }));
        return scaleWithinGroup(rawScores, 5).map((entry) => ({
            ...entry.teacher,
            project_id: PROJECTS.excellentContribution,
            score: entry.score,
            max_score: 5,
            note: `9年级中考尖子生培养：中考总分含体育60分，但体育教师不进入教师考核；总分600分以上为优秀尖子，按文化学科位次10分起递减2分；550-599分为尖子生，按文化学科位次5分起递减1分。原始贡献 ${entry.raw}（优秀尖子${entry.counters.excellent || 0}项，尖子生${entry.counters.top || 0}项），再按本校最高教师折算5分。`,
            source: 'teaching-management'
        }));
    }

    function getIndicatorScoreLines(rows) {
        const ranks = readIndicatorRankLines();
        const ordered = rows.map(getTotal).filter(Number.isFinite).sort((a, b) => b - a);
        const lineForRank = (rank) => {
            if (!rank || !ordered.length) return NaN;
            return ordered[Math.min(Math.max(rank, 1), ordered.length) - 1];
        };
        return {
            ind1Rank: ranks.ind1,
            ind2Rank: ranks.ind2,
            ind1Line: lineForRank(ranks.ind1),
            ind2Line: lineForRank(ranks.ind2)
        };
    }

    function buildOwnSchoolClassTargetMetrics(rows) {
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        const { ind1Rank, ind2Rank, ind1Line, ind2Line } = getIndicatorScoreLines(rows);
        if (!Number.isFinite(ind1Line) || !Number.isFinite(ind2Line)) {
            return { metrics: [], ind1Rank, ind2Rank, ind1Line, ind2Line };
        }
        const classMap = new Map();
        rows.filter((row) => normalizeSchoolForSync(row?.school) === ownSchool).forEach((row) => {
            const className = typeof root.normalizeClass === 'function' ? root.normalizeClass(row?.class) : text(row?.class);
            const total = getTotal(row);
            if (!className || !Number.isFinite(total)) return;
            if (!classMap.has(className)) {
                classMap.set(className, { className, total: 0, ind1: 0, ind2: 0 });
            }
            const metric = classMap.get(className);
            metric.total += 1;
            if (total >= ind1Line) metric.ind1 += 1;
            if (total >= ind2Line) metric.ind2 += 1;
        });
        const metrics = Array.from(classMap.values()).map((item) => ({
            ...item,
            ind1Base: Math.min(10, (item.ind1 / 9) * 10),
            ind2Base: Math.min(10, (item.ind2 / 40) * 10),
            ind1Excess: Math.max(0, item.ind1 - 9),
            ind2Excess: Math.max(0, item.ind2 - 40)
        }));
        const maxExcess1 = Math.max(...metrics.map((item) => item.ind1Excess), 0);
        const maxExcess2 = Math.max(...metrics.map((item) => item.ind2Excess), 0);
        metrics.forEach((item) => {
            item.ind1Bonus = maxExcess1 > 0 ? (item.ind1Excess / maxExcess1) * 5 : 0;
            item.ind2Bonus = maxExcess2 > 0 ? (item.ind2Excess / maxExcess2) * 8 : 0;
            item.score = item.ind1Base + item.ind1Bonus + item.ind2Base + item.ind2Bonus;
            item.maxExcess1 = maxExcess1;
            item.maxExcess2 = maxExcess2;
        });
        return { metrics, ind1Rank, ind2Rank, ind1Line, ind2Line };
    }

    function buildClassTargetGradItems(teachers, rows) {
        const target = buildOwnSchoolClassTargetMetrics(rows);
        if (!target.metrics.length) return [];
        const metricByClass = new Map(target.metrics.map((item) => [item.className, item]));
        return teachers
            .filter((teacher) => normalizeGrade(teacher.grade) === '9')
            .filter((teacher) => normalizeSchoolForSync(teacher.school) === normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校'))
            .map((teacher) => {
                const metrics = teacher.classes.map((className) => metricByClass.get(className)).filter(Boolean);
                if (!metrics.length) return null;
                const weight = metrics.reduce((sum, item) => sum + item.total, 0) || metrics.length;
                const merged = metrics.reduce((acc, item) => {
                    const factor = (item.total || 1) / weight;
                    acc.ind1 += item.ind1 * factor;
                    acc.ind2 += item.ind2 * factor;
                    acc.ind1Base += item.ind1Base * factor;
                    acc.ind2Base += item.ind2Base * factor;
                    acc.ind1Bonus += item.ind1Bonus * factor;
                    acc.ind2Bonus += item.ind2Bonus * factor;
                    acc.score += item.score * factor;
                    return acc;
                }, { ind1: 0, ind2: 0, ind1Base: 0, ind2Base: 0, ind1Bonus: 0, ind2Bonus: 0, score: 0 });
                return {
                    ...teacher,
                    project_id: PROJECTS.classTargetGrad,
                    score: round(merged.score, 2),
                    max_score: 33,
                    note: `9年级班级指标完成：指标一线${round(target.ind1Line, 2)}（划线名次${target.ind1Rank}），每班9人基础10分，超额额外最高+5分；指标二线${round(target.ind2Line, 2)}（划线名次${target.ind2Rank}），每班40人基础10分，超额额外最高+8分。当前任教班级折算：指标一${round(merged.ind1, 2)}人，基础${round(merged.ind1Base, 2)}，额外附加${round(merged.ind1Bonus, 2)}；指标二${round(merged.ind2, 2)}人，基础${round(merged.ind2Base, 2)}，额外附加${round(merged.ind2Bonus, 2)}。`,
                    source: 'teaching-management'
                };
            })
            .filter(Boolean);
    }

    function buildClassHighSchoolContributionItems(teachers, rows, line) {
        if (!Number.isFinite(line) || line <= 0) return [];
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        const ownRows = rows.filter((row) => normalizeSchoolForSync(row?.school) === ownSchool);
        const admissionTotals = ownRows.map((row) => getGrade9ZhongkaoAdmissionTotal(row));
        // 上线率不能把缺体育的“五科总”错当中考录取总分；数据不完整时停止生成正式预览。
        if (admissionTotals.some((total) => !Number.isFinite(total))) return [];
        const classMap = new Map();
        ownRows.forEach((row, index) => {
            const className = typeof root.normalizeClass === 'function' ? root.normalizeClass(row?.class) : text(row?.class);
            const total = admissionTotals[index];
            if (!className || !Number.isFinite(total)) return;
            if (!classMap.has(className)) classMap.set(className, { className, total: 0, over: 0 });
            const metric = classMap.get(className);
            metric.total += 1;
            if (total >= line) metric.over += 1;
        });
        const classMetrics = Array.from(classMap.values()).map((item) => ({
            ...item,
            rate: item.total ? item.over / item.total : 0
        }));
        const highestRate = Math.max(...classMetrics.map((item) => item.rate), 0);
        if (highestRate <= 0) return [];
        const metricByClass = new Map(classMetrics.map((item) => [item.className, item]));
        return teachers
            .filter((teacher) => normalizeGrade(teacher.grade) === '9')
            .filter((teacher) => normalizeSchoolForSync(teacher.school) === ownSchool)
            .map((teacher) => {
                const metrics = teacher.classes.map((className) => metricByClass.get(className)).filter(Boolean);
                const total = metrics.reduce((sum, item) => sum + item.total, 0);
                if (!total) return null;
                const over = metrics.reduce((sum, item) => sum + item.over, 0);
                const rate = over / total;
                const score = round((rate / highestRate) * 15, 2);
                return {
                    ...teacher,
                    project_id: PROJECTS.classHighSchoolContribution,
                    score,
                    max_score: 15,
                    note: `9年级7月中考高中过线分数 ${line}（语数外物化+体育）；任教班级 ${over}/${total} 人过线，过线率 ${pct(rate)}；本校级部班级最高过线率 ${pct(highestRate)}，折算 ${score}/15。`,
                    source: 'teaching-management'
                };
            })
            .filter(Boolean);
    }

    function buildClassHighScoreGradItems(teachers, rows) {
        const ownSchool = normalizeSchoolForSync(root.MY_SCHOOL || '银山实验学校');
        const classMap = new Map();
        rows.filter((row) => normalizeSchoolForSync(row?.school) === ownSchool).forEach((row) => {
            const className = typeof root.normalizeClass === 'function' ? root.normalizeClass(row?.class) : text(row?.class);
            const total = getTotal(row);
            if (!className || !Number.isFinite(total)) return;
            if (!classMap.has(className)) classMap.set(className, { className, total: 0, high: 0 });
            const metric = classMap.get(className);
            metric.total += 1;
            if (total >= 550) metric.high += 1;
        });
        const metrics = Array.from(classMap.values());
        const highest = Math.max(...metrics.map((item) => item.high), 0);
        if (highest <= 0) return [];
        const metricByClass = new Map(metrics.map((item) => [item.className, item]));
        return teachers
            .filter((teacher) => normalizeGrade(teacher.grade) === '9')
            .filter((teacher) => normalizeSchoolForSync(teacher.school) === ownSchool)
            .map((teacher) => {
                const teacherMetrics = teacher.classes.map((className) => metricByClass.get(className)).filter(Boolean);
                if (!teacherMetrics.length) return null;
                const high = teacherMetrics.reduce((sum, item) => sum + item.high, 0);
                const total = teacherMetrics.reduce((sum, item) => sum + item.total, 0);
                const score = round((high / highest) * 15, 2);
                return {
                    ...teacher,
                    project_id: PROJECTS.classHighScoreGrad,
                    score,
                    max_score: 15,
                    preview_only: true,
                    note: `9年级7月中考高分段贡献预览：任教班级550分以上 ${high}/${total} 人，本校级部最高班级高分段 ${highest} 人，折算 ${score}/15。`,
                    source: 'teaching-management-preview'
                };
            })
            .filter(Boolean);
    }

    function markPreviewOnly(items, reason) {
        return (items || []).map((item) => ({
            ...item,
            preview_only: true,
            note: `${item.note || ''}${item.note ? ' ' : ''}${reason || '当前仅做公式审计预览，不写入考核系统。'}`
        }));
    }

    function buildFormulaAuditPreviewItems({ teachers, rows, examContext, highSchoolLine, skipped }) {
        if (!isJulyExam(examContext)) return [];
        if (!isGrade9Exam(examContext, rows)) return [];
        const preview = [
            ...markPreviewOnly(buildClassTargetGradItems(teachers, rows), '当前仅做毕业班指标完成公式预览，不写入考核系统。')
        ];
        if (isGrade9ZhongkaoExam(examContext, rows) && highSchoolLine > 0) {
            preview.push(...markPreviewOnly(buildClassHighSchoolContributionItems(teachers, rows, highSchoolLine), '当前仅做高中贡献率公式预览，不写入考核系统。'));
        } else if (isGrade9ZhongkaoExam(examContext, rows)) {
            skipped.push('9年级7月中考缺少“中考高中过线分数”，高中贡献率只显示公式审计，不生成预览分。');
        }
        preview.push(...markPreviewOnly(buildClassHighScoreGradItems(teachers, rows), '当前仅做高分段贡献公式预览，不写入考核系统。'));
        return preview.filter((item) => Number.isFinite(toNumber(item.score, NaN)) && item.score >= 0);
    }

    function assessmentRosterSummary(roster = {}) {
        const snapshots = roster.snapshots || [];
        const initial = snapshots.reduce((sum, snapshot) => sum + toNumber(snapshot.initial_count, 0), 0);
        const target = snapshots.reduce((sum, snapshot) => sum + toNumber(snapshot.target_count, 0), 0);
        const latestLock = snapshots.map((snapshot) => text(snapshot.locked_at)).filter(Boolean).sort().pop() || '';
        return `名册${snapshots.length}班，初始${initial}人，95%目标${target}人，实考补零${toNumber(roster.zero_fill, 0)}人，锁定${latestLock || '未锁定'}`;
    }

    function attachAssessmentCalculationMetadata(items, build = {}, extra = {}) {
        const thresholdSnapshot = assessmentThresholdSnapshot(build.thresholds);
        const rosterSummary = assessmentRosterSummary(build.roster);
        const thresholdSource = extra.threshold_source || `联考分析分数线：${extra.source_label || '当前考试'}`;
        return (items || []).map((item) => ({
            ...item,
            calculation_version: ASSESSMENT_CALCULATION_VERSION,
            threshold_source: thresholdSource,
            threshold_snapshot: thresholdSnapshot,
            roster_summary: rosterSummary,
            roster_zero_fill: toNumber(item.roster_zero_fill, toNumber(build.roster?.zero_fill, 0)),
            note: `${item.note || ''} 计算版本：${ASSESSMENT_CALCULATION_VERSION}；${thresholdSource}；${rosterSummary}。`.trim()
        }));
    }

    function rankAssessmentTeacherGroups(items) {
        const totals = new Map();
        (items || []).filter((item) => SYNC_ENABLED_PROJECT_IDS.includes(item.project_id)).forEach((item) => {
            const key = teacherKeyFor(item.teacher_name, item.grade, item.subject);
            const entry = totals.get(key) || { key, teacher_name: item.teacher_name, grade: normalizeGrade(item.grade), subject: normalizeSubject(item.subject), total: 0 };
            entry.total += toNumber(item.score, 0);
            totals.set(key, entry);
        });
        const ranks = new Map();
        const byGrade = new Map();
        totals.forEach((entry) => {
            if (!byGrade.has(entry.grade)) byGrade.set(entry.grade, []);
            byGrade.get(entry.grade).push(entry);
        });
        byGrade.forEach((entries) => {
            entries.sort((left, right) => right.total - left.total || text(left.teacher_name).localeCompare(text(right.teacher_name), 'zh-Hans-CN'));
            let previous = null;
            let rank = 0;
            entries.forEach((entry, index) => {
                if (previous === null || previous !== entry.total) rank = index + 1;
                previous = entry.total;
                ranks.set(entry.key, { ...entry, rank });
            });
        });
        return ranks;
    }

    function applyCrossGradeAssessmentRule(items, skipped = []) {
        const automatic = (items || []).filter((item) => SYNC_ENABLED_PROJECT_IDS.includes(item.project_id));
        const ranks = rankAssessmentTeacherGroups(automatic);
        const byName = new Map();
        automatic.forEach((item) => {
            const name = text(item.teacher_name).replace(/\s+/g, '');
            if (!name) return;
            if (!byName.has(name)) byName.set(name, []);
            byName.get(name).push(item);
        });
        const removeKeys = new Set();
        const additions = [];
        const manualReview = [];
        const merged = [];
        const pending = [];
        byName.forEach((nameItems, name) => {
            const grades = new Set(nameItems.map((item) => normalizeGrade(item.grade)).filter(Boolean));
            const subjects = new Set(nameItems.map((item) => normalizeSubject(item.subject)).filter(Boolean));
            if (grades.size < 2) return;
            if (subjects.size > 1) {
                nameItems.forEach((item) => removeKeys.add(`${teacherKeyFor(item.teacher_name, item.grade, item.subject)}::${item.project_id}`));
                manualReview.push({ teacher_name: name, reason: '跨级不同学科，等待管理员人工复核' });
                skipped.push({ teacher_name: name, reason: '跨级不同学科，等待管理员人工复核' });
                return;
            }
            const subject = Array.from(subjects)[0];
            const teacherGroups = new Map();
            nameItems.forEach((item) => {
                const key = teacherKeyFor(item.teacher_name, item.grade, item.subject);
                if (!teacherGroups.has(key)) teacherGroups.set(key, []);
                teacherGroups.get(key).push(item);
            });
            if (teacherGroups.size !== 2) {
                pending.push({ teacher_name: name, subject, reason: '跨级任教需要恰好两个年级，当前不自动合并' });
                return;
            }
            const groups = Array.from(teacherGroups.entries()).map(([key, groupItems]) => ({ key, items: groupItems, rank: ranks.get(key) }));
            if (groups.some((group) => !group.rank || group.items.length !== SYNC_ENABLED_PROJECT_IDS.length)) {
                pending.push({ teacher_name: name, subject, reason: '跨级教师项目不完整，保留各年级原始结果等待补齐后合并' });
                return;
            }
            groups.sort((left, right) => left.rank.rank - right.rank.rank || right.rank.total - left.rank.total);
            const preferred = groups[0];
            const other = groups[1];
            const rankDifference = Math.abs(preferred.rank.rank - other.rank.rank);
            groups.forEach((group) => group.items.forEach((item) => removeKeys.add(`${teacherKeyFor(item.teacher_name, item.grade, item.subject)}::${item.project_id}`)));
            const otherByProject = new Map(other.items.map((item) => [item.project_id, item]));
            const mode = rankDifference <= 2 ? 'higher_rank_grade' : 'project_average';
            preferred.items.forEach((item) => {
                const peer = otherByProject.get(item.project_id);
                const score = mode === 'higher_rank_grade' ? toNumber(item.score, 0) : round((toNumber(item.score, 0) + toNumber(peer?.score, 0)) / 2, 2);
                additions.push({
                    ...item,
                    score,
                    cross_grade_mode: mode,
                    cross_grade_rank_difference: rankDifference,
                    cross_grade_source_grades: [preferred.rank.grade, other.rank.grade],
                    note: `${item.note || ''} 跨级合并：${mode === 'higher_rank_grade' ? `采用${preferred.rank.grade}年级全部项目分` : '两个年级逐项目算术平均'}；${preferred.rank.grade}年级排名第${preferred.rank.rank}，${other.rank.grade}年级排名第${other.rank.rank}，名次差${rankDifference}。`.trim()
                });
            });
            merged.push({ teacher_name: name, subject, grade: preferred.rank.grade, mode, rank_difference: rankDifference });
        });
        const remaining = (items || []).filter((item) => !removeKeys.has(`${teacherKeyFor(item.teacher_name, item.grade, item.subject)}::${item.project_id}`));
        return {
            items: remaining.concat(additions).sort(sortTeacherItems),
            summary: { merged, manual_review: manualReview, pending }
        };
    }

    async function buildAssessmentSyncPayload() {
        if (root.SystemRuntimeLoader && typeof root.SystemRuntimeLoader.load === 'function') {
            try {
                await root.SystemRuntimeLoader.load('teacher-analysis');
            } catch (error) {
                console.warn('[assessment-sync] load teacher-analysis failed:', error);
            }
        }
        if (root.CloudManager && typeof root.CloudManager.loadTeachers === 'function') {
            try {
                // Cohort switches hydrate scores before their term-specific roster. Wait
                // for that roster so a background sync never mistakes it for no teachers.
                await root.CloudManager.loadTeachers({ background: true, toast: false });
            } catch (error) {
                console.warn('[assessment-sync] load teacher assignments failed:', error);
            }
        }
        const rows = getCurrentRows();
        const teachers = groupAssignmentsByTeacher(readTeacherAssignments());
        const skipped = [];
        if (!rows.length) skipped.push('当前没有可用成绩数据，不能自动同步。');
        if (!teachers.length) skipped.push('当前没有教师任课表，不能自动同步。');
        if (!rows.length || !teachers.length) {
            return {
                academic_year: getAcademicYearForSync(),
                items: [],
                preview_items: [],
                skipped
            };
        }
        const examContext = await ensureAssessmentSecondMockHistoryReady(rows);
        const examDate = extractExamDate(examContext);
        const examLabel = getExamLabel(examContext);
        const examMonth = extractExamMonth(examContext);
        const highSchoolLine = readHighSchoolLine();
        if (!isJulyExam(examContext)) {
            skipped.push(`教师个人成绩考核自动同步全部以本学年度 7 月成绩为基准；当前来源考试为 ${examDate || examLabel || '未知日期'}，不是 7 月，已停止生成和写入所有教师个人成绩同步分。`);
            return {
                academic_year: getAcademicYearForSync(),
                source_exam_id: examContext.currentExamId,
                source_exam_label: examLabel,
                source_exam_date: examDate,
                source_exam_month: examMonth,
                items: [],
                preview_items: [],
                skipped
            };
        }
        const syncSettings = await fetchAssessmentSyncSettings(getAcademicYearForSync());
        const julyTeachers = teachers.filter((teacher) => !isSecondMockAssessmentTeacher(teacher));
        const grade8SecondMockTeachers = teachers.filter(isGrade8SecondMockAssessmentTeacher);
        const secondMockTeachers = teachers.filter(isSecondMockAssessmentTeacher);
        const julyBuild = buildAssessmentItemsForRows({
            teachers: julyTeachers,
            rows,
            examContext,
            syncSettings,
            skipped,
            sourceNoteSuffix: '本系统所有模块均只按7月期末上传成绩本身计算，不合并二模补科。'
        });
        const julyItems = attachAssessmentCalculationMetadata(julyBuild.items, julyBuild, {
            source_label: examLabel,
            threshold_source: `联考分析分数线：${examLabel || examDate || '当前7月考试'}`
        });
        const secondMockSubjects = getSecondMockSubjectsForGrade(julyBuild.baseInfo.grade)
            .filter((subject) => GRADE8_SECOND_MOCK_ASSESSMENT_SUBJECTS.has(subject));
        let secondMockExam = null;
        let secondMockBuild = null;
        let secondMockItems = [];
        if (secondMockTeachers.length) {
            secondMockExam = findLatestSecondMockExam(julyBuild.baseInfo, examContext);
            if (!secondMockExam) {
                skipped.push(`${gradeLabel(julyBuild.baseInfo.grade)}${getSecondMockSubjectsForGrade(julyBuild.baseInfo.grade).join('、')}教师考核需从同届同学年度二模读取，但未找到二模考试；相关教师自动同步将跳过。`);
            } else {
                const mockRows = getExamRows(secondMockExam.exam);
                const mockContext = {
                    db: examContext.db,
                    currentExamId: secondMockExam.examId,
                    exam: secondMockExam.exam
                };
                secondMockBuild = buildAssessmentItemsForRows({
                    teachers: secondMockTeachers,
                    rows: mockRows,
                    examContext: mockContext,
                    syncSettings,
                    skipped,
                    sourceNoteSuffix: `${gradeLabel(julyBuild.baseInfo.grade)}${getSecondMockSubjectsForGrade(julyBuild.baseInfo.grade).join('、')}教师考核按规则单独读取二模结果；该二模数据不参与本系统7月期末任何模块统计。`
                });
                const allowedKeys = new Set(secondMockTeachers.map((teacher) => teacherKeyFor(teacher.teacher_name, teacher.grade, teacher.subject)));
                const grade8Keys = new Set(grade8SecondMockTeachers.map((teacher) => teacherKeyFor(teacher.teacher_name, teacher.grade, teacher.subject)));
                secondMockItems = filterItemsByTeacherSet(attachAssessmentCalculationMetadata(secondMockBuild.items, secondMockBuild, {
                    source_label: getExamLabel(mockContext),
                    threshold_source: `联考分析分数线：${getExamLabel(mockContext) || extractExamDate(mockContext) || '同届最新二模'}`
                }), allowedKeys).map((item) => ({
                    ...item,
                    second_mock_source: true,
                    second_mock_subjects: getSecondMockSubjectsForGrade(item.grade),
                    grade8_second_mock_source: grade8Keys.has(teacherKeyFor(item.teacher_name, item.grade, item.subject))
                }));
            }
        }
        const crossGrade = applyCrossGradeAssessmentRule([
            ...julyItems,
            ...secondMockItems
        ], skipped);
        const items = crossGrade.items;
        const previewItems = buildFormulaAuditPreviewItems({ teachers, rows, examContext, highSchoolLine, skipped })
            .map((item) => ({
                ...item,
                source_exam_id: examContext.currentExamId,
                source_exam_label: examLabel,
                source_exam_date: examDate
            }));
        const compositeGrade = normalizeGrade(julyBuild.baseInfo.grade);
        const growthBaselineExam = julyBuild.growthBaselineExam;
        const grade8SecondMockItems = secondMockItems.filter((item) => item.grade8_second_mock_source);
        const hasGrade8SecondMockItems = grade8SecondMockItems.length > 0;
        return {
            academic_year: getAcademicYearForSync(),
            source_exam_id: examContext.currentExamId,
            source_exam_label: examLabel,
            source_exam_date: examDate,
            source_exam_month: examMonth,
            calculation_version: ASSESSMENT_CALCULATION_VERSION,
            threshold_source: `联考分析分数线：${examLabel || examDate || '当前7月考试'}`,
            threshold_snapshot: assessmentThresholdSnapshot(julyBuild.thresholds),
            roster_summary: assessmentRosterSummary(julyBuild.roster),
            roster_locked: !!julyBuild.roster?.ready,
            roster_zero_fill: toNumber(julyBuild.roster?.zero_fill, 0),
            cross_grade: crossGrade.summary,
            composite_mode: secondMockItems.length ? 'july_plain_with_second_mock_teacher_source' : 'plain_july',
            composite_base_grade: julyBuild.baseInfo.grade,
            growth_baseline_exam_id: growthBaselineExam?.examId || '',
            growth_baseline_exam_label: growthBaselineExam ? getExamLabel({ currentExamId: growthBaselineExam.examId, exam: growthBaselineExam.exam }) : '',
            growth_baseline_exam_date: growthBaselineExam ? extractExamDate({ currentExamId: growthBaselineExam.examId, exam: growthBaselineExam.exam }) : '',
            grade6_growth_baseline: syncSettings.grade6_growth_baseline || 'first_term_final',
            grade6_growth_baseline_exam_id: compositeGrade === '6' ? (growthBaselineExam?.examId || '') : '',
            grade6_growth_baseline_exam_label: compositeGrade === '6' && growthBaselineExam ? getExamLabel({ currentExamId: growthBaselineExam.examId, exam: growthBaselineExam.exam }) : '',
            grade6_growth_baseline_exam_date: compositeGrade === '6' && growthBaselineExam ? extractExamDate({ currentExamId: growthBaselineExam.examId, exam: growthBaselineExam.exam }) : '',
            makeup_exam_id: '',
            makeup_exam_label: '',
            makeup_exam_date: '',
            makeup_subjects: [],
            makeup_missing_count: 0,
            makeup_missing: [],
            makeup_fallback_matches: 0,
            second_mock_exam_id: secondMockExam?.examId || '',
            second_mock_exam_label: secondMockExam ? getExamLabel({ currentExamId: secondMockExam.examId, exam: secondMockExam.exam }) : '',
            second_mock_exam_date: secondMockExam ? extractExamDate({ currentExamId: secondMockExam.examId, exam: secondMockExam.exam }) : '',
            second_mock_subjects: getSecondMockSubjectsForGrade(julyBuild.baseInfo.grade),
            second_mock_items: secondMockItems.length,
            grade8_second_mock_exam_id: hasGrade8SecondMockItems ? (secondMockExam?.examId || '') : '',
            grade8_second_mock_exam_label: hasGrade8SecondMockItems && secondMockExam ? getExamLabel({ currentExamId: secondMockExam.examId, exam: secondMockExam.exam }) : '',
            grade8_second_mock_exam_date: hasGrade8SecondMockItems && secondMockExam ? extractExamDate({ currentExamId: secondMockExam.examId, exam: secondMockExam.exam }) : '',
            grade8_second_mock_subjects: hasGrade8SecondMockItems ? secondMockSubjects : [],
            grade8_second_mock_items: grade8SecondMockItems.length,
            items,
            preview_items: previewItems,
            skipped
        };
    }

    function getAssessmentSyncItemDigest(items) {
        const rows = (items || []).map((item) => [
            text(item.teacher_name),
            normalizeGrade(item.grade),
            normalizeSubject(item.subject),
            (item.classes || []).map(text).filter(Boolean).sort().join(','),
            text(item.project_id),
            Number(item.score || 0).toFixed(3),
            text(item.source_exam_id),
            text(item.source_exam_date),
            text(item.makeup_exam_id),
            text(item.makeup_exam_date),
            (item.makeup_subjects || []).map(normalizeSubject).filter(Boolean).sort().join(','),
            item.second_mock_source === true ? 'second-mock' : '',
            (item.second_mock_subjects || []).map(normalizeSubject).filter(Boolean).sort().join(','),
            text(item.calculation_version),
            text(item.threshold_snapshot),
            text(item.roster_summary),
            Number(item.roster_zero_fill || 0),
            text(item.cross_grade_mode),
            Number(item.cross_grade_rank_difference || 0),
            text(item.note)
        ].join('\u001f')).sort();
        const source = rows.join('\u001e');
        let primary = 2166136261;
        let secondary = 5381;
        for (let index = 0; index < source.length; index += 1) {
            const code = source.charCodeAt(index);
            primary = Math.imul(primary ^ code, 16777619);
            secondary = ((secondary << 5) + secondary) ^ code;
        }
        return `${rows.length}:${(primary >>> 0).toString(36)}:${(secondary >>> 0).toString(36)}`;
    }

    function getAutomaticSyncSignature(payload) {
        const context = getCurrentExamContext();
        const rows = getCurrentRows();
        const teachers = groupAssignmentsByTeacher(readTeacherAssignments());
        const counts = {};
        const indicatorLines = readIndicatorRankLines();
        const highSchoolLine = readHighSchoolLine();
        (payload.items || []).forEach((item) => {
            counts[item.project_id] = (counts[item.project_id] || 0) + 1;
        });
        return [
            payload.academic_year,
            context.currentExamId || 'no-exam',
            payload.calculation_version || ASSESSMENT_CALCULATION_VERSION,
            payload.threshold_snapshot || 'no-thresholds',
            payload.roster_summary || 'no-roster',
            `roster-zero:${payload.roster_zero_fill || 0}`,
            `cross:${JSON.stringify(payload.cross_grade || {})}`,
            payload.composite_mode || 'plain',
            payload.makeup_exam_id || 'no-makeup',
            (payload.makeup_subjects || []).join(','),
            payload.makeup_missing_count || 0,
            `g8mock:${payload.grade8_second_mock_exam_id || 'none'}`,
            `g8subjects:${(payload.grade8_second_mock_subjects || []).join(',')}`,
            `g8items:${payload.grade8_second_mock_items || 0}`,
            `growth:${payload.growth_baseline_exam_id || 'none'}`,
            `g6base:${payload.grade6_growth_baseline || 'none'}`,
            `g6exam:${payload.grade6_growth_baseline_exam_id || 'none'}`,
            `ind1:${indicatorLines.ind1}`,
            `ind2:${indicatorLines.ind2}`,
            `hs:${highSchoolLine || 0}`,
            rows.length,
            teachers.length,
            Object.keys(counts).sort().map((key) => `${key}:${counts[key]}`).join(','),
            `items:${getAssessmentSyncItemDigest(payload.items)}`
        ].join('|');
    }

    function canRunAutomaticAssessmentSync() {
        return !!(
            root.EdgeGateway
            && typeof root.EdgeGateway.syncAssessmentScores === 'function'
            && typeof root.EdgeGateway.canUseAuthorizedRequests === 'function'
            && root.EdgeGateway.canUseAuthorizedRequests()
        );
    }

    async function fetchAssessmentSyncSettings(academicYear) {
        if (!root.EdgeGateway || typeof root.EdgeGateway.getAssessmentSyncSettings !== 'function') {
            return { grade6_growth_baseline: 'first_term_final', unavailable: true };
        }
        try {
            const response = await root.EdgeGateway.getAssessmentSyncSettings({ academic_year: academicYear });
            return response?.settings || { grade6_growth_baseline: 'first_term_final' };
        } catch (error) {
            console.warn('[assessment-sync] load sync settings failed:', error?.message || error);
            return { grade6_growth_baseline: 'first_term_final', unavailable: true, error: error?.message || String(error) };
        }
    }

    async function runAutomaticAssessmentSync(options = {}) {
        const force = !!options.force;
        if (root.__TM_ASSESSMENT_AUTO_SYNC_RUNNING__) return root.__TM_ASSESSMENT_AUTO_SYNC_RUNNING__;
        if (!canRunAutomaticAssessmentSync()) return null;
        root.__TM_ASSESSMENT_AUTO_SYNC_RUNNING__ = (async () => {
            const payload = await buildAssessmentSyncPayload();
            if (!payload.items?.length) return { skipped: payload.skipped || [], written: 0 };
            const signature = getAutomaticSyncSignature(payload);
            const key = `TM_ASSESSMENT_AUTO_SYNC:${signature}`;
            if (!force) {
                try {
                    if (localStorage.getItem(key) === 'done') return { skipped: ['本次成绩与任课表已自动同步过。'], written: 0 };
                } catch (_) {}
            }
            const result = await root.EdgeGateway.syncAssessmentScores({
                academic_year: payload.academic_year,
                overwrite_manual: true,
                automatic: true,
                items: payload.items
            });
            try {
                localStorage.setItem(key, 'done');
                localStorage.setItem('TM_ASSESSMENT_AUTO_SYNC_LAST', JSON.stringify({
                    at: new Date().toISOString(),
                    signature,
                    academic_year: payload.academic_year,
                    written: result?.written || 0,
                    skipped: result?.skipped?.length || 0
                }));
            } catch (_) {}
            root.dispatchEvent?.(new CustomEvent('tm-assessment-auto-sync-complete', { detail: { payload, result } }));
            return result;
        })();
        try {
            return await root.__TM_ASSESSMENT_AUTO_SYNC_RUNNING__;
        } finally {
            root.__TM_ASSESSMENT_AUTO_SYNC_RUNNING__ = null;
        }
    }

    function scheduleAutomaticAssessmentSync() {
        if (root.__TM_ASSESSMENT_AUTO_SYNC_SCHEDULED__) return;
        root.__TM_ASSESSMENT_AUTO_SYNC_SCHEDULED__ = true;
        let attempts = 0;
        const tick = () => {
            attempts += 1;
            runAutomaticAssessmentSync().catch((error) => {
                console.warn('[assessment-sync] automatic sync skipped:', error?.message || error);
            });
            if (attempts < 40) setTimeout(tick, attempts < 8 ? 2500 : 10000);
        };
        setTimeout(tick, 2500);
        ['cloud-sync-state', 'cohort-exam-hydrated', 'teacher-sync-complete', 'tm-teacher-analysis-ready'].forEach((eventName) => {
            root.addEventListener?.(eventName, () => {
                setTimeout(() => runAutomaticAssessmentSync({ force: false }).catch(() => {}), 800);
            });
        });
    }

    function summarizeItems(items) {
        const counts = {};
        (items || []).forEach((item) => {
            const label = PROJECT_LABELS[item.project_id] || item.project_id;
            counts[label] = (counts[label] || 0) + 1;
        });
        return Object.entries(counts).map(([label, count]) => `${label} ${count}条`).join('，') || '暂无可同步分值';
    }

    function countItemsByProject(items) {
        const counts = {};
        (items || []).forEach((item) => {
            counts[item.project_id] = (counts[item.project_id] || 0) + 1;
        });
        return counts;
    }

    function countSkippedByProject(skipped) {
        const counts = {};
        (skipped || []).forEach((item) => {
            const projectId = item?.project_id;
            if (projectId) counts[projectId] = (counts[projectId] || 0) + 1;
        });
        return counts;
    }

    function buildAssessmentSyncAudit(payload = {}, result = null) {
        const context = getCurrentExamContext();
        const itemCounts = countItemsByProject(payload.items || []);
        const previewCounts = countItemsByProject(payload.preview_items || []);
        const skippedCounts = countSkippedByProject(result?.skipped || []);
        const projectIds = [
            ...SYNC_ENABLED_PROJECT_IDS,
            PROJECTS.teacherWorkload,
            ...PREVIEW_ONLY_PROJECT_IDS
        ];
        const projects = {};
        projectIds.forEach((projectId) => {
            const rule = PROJECT_RULES[projectId] || {};
            const mode = rule.syncMode || (rule.manual ? 'manual' : 'blocked');
            projects[projectId] = {
                id: projectId,
                label: PROJECT_LABELS[projectId] || projectId,
                max: rule.max || 0,
                autoMax: rule.autoMax || rule.max || 0,
                requiresJuly: !!rule.requiresJuly,
                manual: !!rule.manual,
                mode,
                source: rule.source || '',
                formula: rule.formula || '',
                syncable: itemCounts[projectId] || 0,
                preview: previewCounts[projectId] || 0,
                written: result?.project_counts?.[projectId] || 0,
                skipped: skippedCounts[projectId] || 0
            };
        });
        return {
            academic_year: payload.academic_year || getAcademicYearForSync(),
            calculation: {
                version: payload.calculation_version || ASSESSMENT_CALCULATION_VERSION,
                thresholdSource: payload.threshold_source || '联考分析已确认分数线',
                thresholdSnapshot: payload.threshold_snapshot || '',
                rosterSummary: payload.roster_summary || '未锁定',
                rosterZeroFill: payload.roster_zero_fill || 0,
                rosterLocked: payload.roster_locked === true,
                crossGrade: payload.cross_grade || { merged: [], manual_review: [], pending: [] }
            },
            exam: {
                id: payload.source_exam_id || context.currentExamId,
                label: payload.source_exam_label || getExamLabel(context),
                date: payload.source_exam_date || extractExamDate(context),
                month: payload.source_exam_month || extractExamMonth(context),
                isJuly: (payload.source_exam_month || extractExamMonth(context)) === 7
            },
            composite: {
                mode: payload.composite_mode || 'plain',
                grade: payload.composite_base_grade || '',
                makeupExamId: payload.makeup_exam_id || '',
                makeupExamLabel: payload.makeup_exam_label || '',
                makeupExamDate: payload.makeup_exam_date || '',
                makeupSubjects: payload.makeup_subjects || [],
                missingCount: payload.makeup_missing_count || 0,
                missing: payload.makeup_missing || [],
                fallbackMatches: payload.makeup_fallback_matches || 0,
                secondMockExamId: payload.second_mock_exam_id || '',
                secondMockExamLabel: payload.second_mock_exam_label || '',
                secondMockExamDate: payload.second_mock_exam_date || '',
                secondMockSubjects: payload.second_mock_subjects || [],
                secondMockItems: payload.second_mock_items || 0,
                grade8SecondMockExamId: payload.grade8_second_mock_exam_id || '',
                grade8SecondMockExamLabel: payload.grade8_second_mock_exam_label || '',
                grade8SecondMockExamDate: payload.grade8_second_mock_exam_date || '',
                grade8SecondMockSubjects: payload.grade8_second_mock_subjects || [],
                grade8SecondMockItems: payload.grade8_second_mock_items || 0
            },
            received: result?.received || (payload.items || []).length,
            valid: result?.valid || (payload.items || []).length,
            written: result?.written || 0,
            wouldWrite: result?.would_write || (payload.items || []).length,
            changed: result?.changed_count || 0,
            protectedManual: result?.protected_manual_count || 0,
            differences: result?.differences || [],
            previewOnly: (payload.preview_items || []).length,
            skipped: [
                ...(payload.skipped || []).map((item) => typeof item === 'string' ? ({ reason: item }) : item),
                ...((result?.skipped || []).map((item) => ({ ...item, label: PROJECT_LABELS[item.project_id] || item.project_id })))
            ],
            projects,
            formulas: Object.fromEntries(projectIds.map((projectId) => [projectId, PROJECT_RULES[projectId]?.formula || '']))
        };
    }

    function buildAuditHtml(audit) {
        const ruleChip = (project) => {
            if (project.mode === 'sync') return project.requiresJuly ? '<span class="status-chip ok">7月可同步</span>' : '<span class="status-chip ok">可同步</span>';
            if (project.mode === 'preview') return '<span class="status-chip info">只预览</span>';
            if (project.mode === 'manual') return '<span class="status-chip info">手填</span>';
            return '<span class="status-chip warn">需确认</span>';
        };
        const projectRows = Object.values(audit.projects).map((project) => `
            <tr>
                <td><strong>${escapeHtml(project.label)}</strong><div class="tm-assessment-sync-mini">${escapeHtml(project.source)}</div></td>
                <td>${ruleChip(project)}</td>
                <td><strong>${escapeHtml(project.syncable)}</strong> 条</td>
                <td><strong>${escapeHtml(project.preview)}</strong> 条</td>
                <td>${project.written ? `<strong>${escapeHtml(project.written)}</strong> 条` : '-'}</td>
                <td>${project.skipped ? `<span class="status-chip warn">${escapeHtml(project.skipped)} 条</span>` : '-'}</td>
                <td>${escapeHtml(project.formula)}</td>
            </tr>
        `).join('');
        const composite = audit.composite || {};
        const calculation = audit.calculation || {};
        const hasSecondMockSource = !!composite.secondMockExamId || !!composite.secondMockItems;
        const secondMockSubjects = composite.secondMockSubjects || [];
        const isGrade9PoliticsSecondMock = String(composite.grade) === '9' && secondMockSubjects.includes('政治');
        const isGrade8HistoryGeoBioSecondMock = String(composite.grade) === '8'
            && ['历史', '地理', '生物'].some((subject) => secondMockSubjects.includes(subject));
        const secondMockSourceLabel = isGrade9PoliticsSecondMock
            ? '九年级政治教师考核取二模'
            : (isGrade8HistoryGeoBioSecondMock ? '八年级史地生教师考核取二模' : '二模教师考核来源');
        const missingRows = (composite.missing || []).slice(0, 10).map((item) => `
            <tr>
                <td>${escapeHtml(item.school || '-')}</td>
                <td>${escapeHtml(item.className || '-')}</td>
                <td>${escapeHtml(item.studentName || '-')}</td>
                <td>${escapeHtml(item.subject || '-')}</td>
                <td><span class="status-chip warn">${escapeHtml(item.reason || '缺失')}</span></td>
            </tr>
        `).join('');
        return `
            <div class="tm-assessment-audit">
                <div class="tm-assessment-sync-summary">
                    <span class="status-chip info">来源考试：${escapeHtml(audit.exam.date || audit.exam.label || '-')}</span>
                    <span class="status-chip ${audit.exam.isJuly ? 'ok' : 'warn'}">${audit.exam.isJuly ? '7 月基准，可自动同步' : '非 7 月，禁止写入教师个人成绩'}</span>
                    <span class="status-chip ok">本系统7月数据不合并二模</span>
                    <span class="status-chip info">${escapeHtml(calculation.version || '')}</span>
                    <span class="status-chip ${calculation.rosterLocked ? 'ok' : 'warn'}">${calculation.rosterLocked ? '95%名册已锁定' : '95%名册未锁定'}</span>
                    <span class="status-chip info">补零 ${escapeHtml(calculation.rosterZeroFill || 0)} 人</span>
                    ${hasSecondMockSource ? `<span class="status-chip info">${secondMockSourceLabel}：${escapeHtml(composite.secondMockExamDate || composite.secondMockExamLabel || composite.secondMockExamId)}</span>` : ''}
                    ${hasSecondMockSource && secondMockSubjects.length ? `<span class="status-chip info">二模科目：${escapeHtml(secondMockSubjects.join('、'))}；已生成 ${escapeHtml(composite.secondMockItems || 0)} 条</span>` : ''}
                    ${composite.missingCount ? `<span class="status-chip warn">补科缺失 ${escapeHtml(composite.missingCount)} 条</span>` : ''}
                    <span class="status-chip info">预计写入 ${escapeHtml(audit.wouldWrite)} 条</span>
                    <span class="status-chip info">只读预览 ${escapeHtml(audit.previewOnly)} 条</span>
                    <span class="status-chip ok">已写入 ${escapeHtml(audit.written)} 条</span>
                    ${audit.changed ? `<span class="status-chip warn">旧新差异 ${escapeHtml(audit.changed)} 条</span>` : ''}
                    ${audit.protectedManual ? `<span class="status-chip info">保护人工分 ${escapeHtml(audit.protectedManual)} 条</span>` : ''}
                </div>
                <div class="tm-assessment-sync-note is-soft"><strong>分数线来源：</strong>${escapeHtml(calculation.thresholdSource || '-')}<br><strong>名册：</strong>${escapeHtml(calculation.rosterSummary || '-')}<br><strong>跨级：</strong>已合并 ${escapeHtml(calculation.crossGrade?.merged?.length || 0)} 人，人工复核 ${escapeHtml(calculation.crossGrade?.manual_review?.length || 0)} 人，待补齐 ${escapeHtml(calculation.crossGrade?.pending?.length || 0)} 人。</div>
                ${missingRows ? `<div class="table-wrap analysis-table-shell tm-assessment-sync-table"><table><thead><tr><th>学校</th><th>班级</th><th>学生</th><th>补科科目</th><th>原因</th></tr></thead><tbody>${missingRows}</tbody></table></div>` : ''}
                <div class="table-wrap analysis-table-shell tm-assessment-sync-table">
                    <table>
                        <thead><tr><th>项目</th><th>规则</th><th>可同步</th><th>只读预览</th><th>已写入</th><th>跳过</th><th>计算口径</th></tr></thead>
                        <tbody>${projectRows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function summarizeMissingProjects(items) {
        const projectSet = new Set((items || []).map((item) => item.project_id));
        const missing = SYNC_ENABLED_PROJECT_IDS.filter((projectId) => !projectSet.has(projectId));
        const manual = ['课时量'];
        return {
            missing: missing.map((projectId) => PROJECT_LABELS[projectId] || projectId),
            manual
        };
    }

    function buildProjectMatrixHtml(items) {
        const counts = {};
        (items || []).forEach((item) => {
            counts[item.project_id] = (counts[item.project_id] || 0) + 1;
        });
        const rows = SYNC_ENABLED_PROJECT_IDS.map((projectId) => {
            const count = counts[projectId] || 0;
            const ok = count > 0;
            return `
                <div class="tm-assessment-sync-project ${ok ? 'is-ready' : 'is-missing'}">
                    <strong>${escapeHtml(PROJECT_LABELS[projectId] || projectId)}</strong>
                    <span>${ok ? `可同步 ${count} 条` : '缺少可同步数据'}</span>
                </div>
            `;
        }).join('');
        return `
            <div class="tm-assessment-sync-projects">
                ${rows}
                <div class="tm-assessment-sync-project is-manual">
                    <strong>课时量成绩</strong>
                    <span>system 暂无课时量来源，仍由组长手填</span>
                </div>
            </div>
        `;
    }

    function csvEscape(value) {
        const raw = text(value);
        return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
    }

    function downloadAssessmentSyncCsv(panel) {
        const payload = panel.__assessmentSyncPayload || { academic_year: getAcademicYearForSync(), items: [] };
        const result = panel.__assessmentSyncResult || null;
        const rows = [[
            '类型', '教师', '年级', '学科', '项目', '分值', '满分', '说明', '警示说明'
        ]];
        (payload.items || []).forEach((item) => {
            rows.push([
                result?.dry_run ? '预计写入' : '预览可同步',
                item.teacher_name,
                gradeLabel(item.grade),
                item.subject,
                PROJECT_LABELS[item.project_id] || item.project_id,
                item.score,
                item.max_score,
                item.note,
                item.warning?.message || ''
            ]);
        });
        (payload.preview_items || []).forEach((item) => {
            rows.push([
                '只读预览',
                item.teacher_name,
                gradeLabel(item.grade),
                item.subject,
                PROJECT_LABELS[item.project_id] || item.project_id,
                item.score,
                item.max_score,
                item.note,
                item.warning?.message || ''
            ]);
        });
        (result?.skipped || []).forEach((item) => {
            rows.push([
                '跳过',
                item.teacher_name,
                gradeLabel(item.grade),
                item.subject,
                PROJECT_LABELS[item.project_id] || item.project_id,
                '',
                '',
                '',
                item.reason
            ]);
        });
        (payload.skipped || []).forEach((reason) => {
            rows.push(['本地缺项', '', '', '', '', '', '', reason, '']);
        });
        const csv = `\ufeff${rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `教师考核同步检查_${payload.academic_year || getAcademicYearForSync()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function renderScoreCell(item) {
        const warning = item.warning?.message ? `
            <button type="button"
                class="tm-assessment-score-warning"
                data-title="${escapeAttr(item.warning.title || '分值说明')}"
                data-message="${escapeAttr(item.warning.message)}"
                aria-label="查看分值警示说明">!</button>
        ` : '';
        return `<strong>${escapeHtml(item.score)}</strong>${warning} / ${escapeHtml(item.max_score || '')}`;
    }

    function renderResult(panel, payload, result = null, error = null) {
        const resultEl = panel.querySelector('#tmAssessmentSyncResult');
        if (!resultEl) return;
        resultEl.classList.remove('is-collapsed');
        panel.dataset.assessmentSyncOpen = 'true';
        panel.__assessmentSyncPayload = payload;
        panel.__assessmentSyncResult = result || null;
        const audit = buildAssessmentSyncAudit(payload, result);
        const missing = summarizeMissingProjects(payload.items || []);
        const sampleRows = (payload.items || []).slice(0, 8).map((item) => `
            <tr>
                <td>${escapeHtml(item.teacher_name)}</td>
                <td>${escapeHtml(gradeLabel(item.grade))}</td>
                <td>${escapeHtml(item.subject)}</td>
                <td>${escapeHtml(PROJECT_LABELS[item.project_id] || item.project_id)}</td>
                <td>${renderScoreCell(item)}</td>
            </tr>
        `).join('');
        const previewRows = (payload.preview_items || []).slice(0, 8).map((item) => `
            <tr>
                <td>${escapeHtml(item.teacher_name || '-')}</td>
                <td>${escapeHtml(gradeLabel(item.grade))}</td>
                <td>${escapeHtml(item.subject || '-')}</td>
                <td>${escapeHtml(PROJECT_LABELS[item.project_id] || item.project_id)}</td>
                <td>${renderScoreCell(item)}</td>
                <td>${escapeHtml(item.note || '')}</td>
            </tr>
        `).join('');
        const skippedRows = (result?.skipped || []).slice(0, 8).map((item) => `
            <li><strong>${escapeHtml(item.teacher_name || '')}</strong> ${escapeHtml(gradeLabel(item.grade || ''))} ${escapeHtml(item.subject || '')} ${escapeHtml(PROJECT_LABELS[item.project_id] || item.project_id || '')}：${escapeHtml(item.reason || '')}</li>
        `).join('');
        const differenceRows = (result?.differences || []).filter((item) => item.changed).slice(0, 12).map((item) => `
            <tr><td>${escapeHtml(item.teacher_name)}</td><td>${escapeHtml(gradeLabel(item.grade))}</td><td>${escapeHtml(item.subject)}</td><td>${escapeHtml(PROJECT_LABELS[item.project_id] || item.project_id)}</td><td>${escapeHtml(item.previous_score ?? '-')}</td><td><strong>${escapeHtml(item.proposed_score)}</strong></td></tr>
        `).join('');
        resultEl.innerHTML = `
            <div class="tm-assessment-sync-summary">
                <span class="status-chip info">学年度 ${escapeHtml(payload.academic_year)}</span>
                <span class="status-chip ${payload.items?.length ? 'ok' : 'warn'}">${escapeHtml(summarizeItems(payload.items))}</span>
                ${payload.preview_items?.length ? `<span class="status-chip info">只读预览 ${escapeHtml(payload.preview_items.length)} 条</span>` : ''}
                ${result?.dry_run ? `<span class="status-chip info">预计写入 ${escapeHtml(result.would_write || 0)} 条</span>` : ''}
                ${result?.changed_count ? `<span class="status-chip warn">旧新差异 ${escapeHtml(result.changed_count)} 条</span>` : ''}
                ${result?.protected_manual_count ? `<span class="status-chip info">保护人工分 ${escapeHtml(result.protected_manual_count)} 条</span>` : ''}
                ${result && !result.dry_run ? `<span class="status-chip ok">已写入 ${escapeHtml(result.written || 0)} 条</span>` : ''}
                ${result?.skipped?.length ? `<span class="status-chip warn">跳过 ${escapeHtml(result.skipped.length)} 条</span>` : ''}
                ${error ? `<span class="status-chip warn">${escapeHtml(error.message || error)}</span>` : ''}
            </div>
            ${buildAuditHtml(audit)}
            ${buildProjectMatrixHtml(payload.items || [])}
            ${sampleRows ? `<div class="table-wrap analysis-table-shell tm-assessment-sync-table"><table><thead><tr><th>教师</th><th>年级</th><th>学科</th><th>项目</th><th>分值</th></tr></thead><tbody>${sampleRows}</tbody></table></div>` : ''}
            ${previewRows ? `<div class="table-wrap analysis-table-shell tm-assessment-sync-table"><table><thead><tr><th>教师</th><th>年级</th><th>学科</th><th>预览项目</th><th>分值</th><th>说明</th></tr></thead><tbody>${previewRows}</tbody></table></div>` : ''}
            ${differenceRows ? `<div class="table-wrap analysis-table-shell tm-assessment-sync-table"><table><thead><tr><th>教师</th><th>年级</th><th>学科</th><th>项目</th><th>旧分</th><th>新分</th></tr></thead><tbody>${differenceRows}</tbody></table></div>` : ''}
            ${(payload.items?.length || payload.preview_items?.length || result?.skipped?.length || payload.skipped?.length) ? `<div><button type="button" class="btn btn-secondary tm-assessment-export-btn"><i class="ti ti-download"></i> 导出检查结果</button></div>` : ''}
            ${payload.skipped?.length ? `<div class="tm-assessment-sync-note">${payload.skipped.map((item) => escapeHtml(typeof item === 'string' ? item : item.reason || '')).join('<br>')}</div>` : ''}
            ${missing.missing.length ? `<div class="tm-assessment-sync-note"><strong>暂未自动生成：</strong>${escapeHtml(missing.missing.join('、'))}。请检查当前成绩、任课表或对应公式数据是否完整。</div>` : ''}
            <div class="tm-assessment-sync-note is-soft"><strong>保留手填：</strong>${escapeHtml(missing.manual.join('、'))}。</div>
            ${skippedRows ? `<div class="tm-assessment-sync-note"><strong>同步跳过：</strong><ul>${skippedRows}</ul></div>` : ''}
        `;
        setPreviewButtonState(panel, true);
        resultEl.querySelectorAll('.tm-assessment-score-warning').forEach((button) => {
            button.addEventListener('click', () => {
                const title = button.dataset.title || '分值说明';
                const message = button.dataset.message || '';
                if (typeof root.tmShowModal === 'function') {
                    root.tmShowModal(title, `<pre class="tm-assessment-warning-dialog">${escapeHtml(message)}</pre>`);
                    return;
                }
                root.alert?.(`${title}\n\n${message}`);
            });
        });
        const exportBtn = resultEl.querySelector('.tm-assessment-export-btn');
        if (exportBtn) exportBtn.onclick = () => downloadAssessmentSyncCsv(panel);
    }

    function setPreviewButtonState(panel, open) {
        const previewBtn = panel.querySelector('#tmAssessmentPreviewBtn');
        if (!previewBtn) return;
        previewBtn.innerHTML = open
            ? '<i class="ti ti-eye-off"></i> 隐藏同步对账'
            : '<i class="ti ti-eye"></i> 查看同步对账';
    }

    function collapseAssessmentResult(panel) {
        const resultEl = panel.querySelector('#tmAssessmentSyncResult');
        if (!resultEl) return;
        resultEl.classList.add('is-collapsed');
        panel.dataset.assessmentSyncOpen = 'false';
        setPreviewButtonState(panel, false);
    }

    function expandAssessmentResult(panel) {
        const resultEl = panel.querySelector('#tmAssessmentSyncResult');
        if (!resultEl) return;
        resultEl.classList.remove('is-collapsed');
        panel.dataset.assessmentSyncOpen = 'true';
        setPreviewButtonState(panel, true);
    }

    function renderPanel() {
        const existingPanel = document.getElementById('tmAssessmentSyncPanel');
        if (existingPanel) {
            if (!existingPanel.dataset.assessmentSyncBound) {
                bindPanel(existingPanel);
                existingPanel.dataset.assessmentSyncBound = 'true';
            }
            return;
        }
        const container = document.getElementById('tmNextAction') || document.querySelector('#teacher-analysis .analysis-content-stack');
        if (!container) return;
        const panel = document.createElement('div');
        panel.id = 'tmAssessmentSyncPanel';
        panel.className = 'tm-next-card tm-assessment-sync-panel';
        panel.innerHTML = `
            <div class="tm-assessment-sync-copy">
                <div class="tm-next-title"><i class="ti ti-cloud-upload"></i> 同步到教师教学质量考核系统</div>
                <div class="tm-next-desc"><strong>位置：教学管理首页。</strong>从当前联考成绩和教学管理任课表生成教师个人考核分值。合规的新计算结果会覆盖考核系统中同一教师、同一项目的旧分；缺成绩、缺任课表或目标系统未匹配到教师时不会写入。</div>
                <div class="tm-assessment-sync-note is-soft">班级考核项目当前只做公式审计预览，不写入考核系统；6-9年级缺少对应7月成绩时不会生成真实同步分。</div>
                <div class="tm-next-meta">
                    <span class="status-chip info">两率一分</span>
                    <span class="status-chip info">班级协调</span>
                    <span class="status-chip info">学科协作</span>
                    <span class="status-chip info">后 1/3</span>
                    <span class="status-chip info">尖子生</span>
                </div>
                <label class="tm-assessment-sync-toggle">
                    <input type="checkbox" id="tmAssessmentOverwriteManual">
                    覆盖考核系统中已有人工分数
                </label>
            </div>
            <div class="tm-assessment-sync-actions">
                <button type="button" class="btn btn-secondary" id="tmAssessmentPreviewBtn"><i class="ti ti-eye"></i> 预览</button>
                <button type="button" class="btn btn-secondary" id="tmAssessmentDryRunBtn"><i class="ti ti-shield-check"></i> 检查匹配</button>
                <button type="button" class="btn btn-blue" id="tmAssessmentSyncBtn"><i class="ti ti-cloud-upload"></i> 同步</button>
            </div>
            <div id="tmAssessmentSyncResult" class="tm-assessment-sync-result"></div>
        `;
        container.insertAdjacentElement('afterend', panel);
        bindPanel(panel);
        panel.dataset.assessmentSyncBound = 'true';
    }

    function setBusy(panel, busy) {
        panel.querySelectorAll('button').forEach((button) => {
            button.disabled = !!busy;
        });
    }

    function bindPanel(panel) {
        const previewBtn = panel.querySelector('#tmAssessmentPreviewBtn');
        const dryRunBtn = panel.querySelector('#tmAssessmentDryRunBtn');
        const syncBtn = panel.querySelector('#tmAssessmentSyncBtn');
        if (previewBtn) previewBtn.onclick = async () => {
            if (panel.dataset.assessmentSyncOpen === 'true') {
                collapseAssessmentResult(panel);
                return;
            }
            setBusy(panel, true);
            try {
                const payload = await buildAssessmentSyncPayload();
                panel.__assessmentSyncPayload = payload;
                renderResult(panel, payload);
                expandAssessmentResult(panel);
            } catch (error) {
                renderResult(panel, { academic_year: getAcademicYearForSync(), items: [] }, null, error);
                expandAssessmentResult(panel);
            } finally {
                setBusy(panel, false);
            }
        };
        if (dryRunBtn) dryRunBtn.onclick = async () => {
            setBusy(panel, true);
            try {
                const payload = panel.__assessmentSyncPayload || await buildAssessmentSyncPayload();
                panel.__assessmentSyncPayload = payload;
                const overwrite = !!panel.querySelector('#tmAssessmentOverwriteManual')?.checked;
                if (!payload.items?.length) throw new Error('没有可核验的分值');
                if (!root.EdgeGateway || typeof root.EdgeGateway.syncAssessmentScores !== 'function') {
                    throw new Error('当前网关不支持考核同步，请先部署最新版本');
                }
                const result = await root.EdgeGateway.syncAssessmentScores({
                    academic_year: payload.academic_year,
                    overwrite_manual: overwrite,
                    dry_run: true,
                    items: payload.items
                });
                renderResult(panel, payload, result);
            } catch (error) {
                const payload = panel.__assessmentSyncPayload || { academic_year: getAcademicYearForSync(), items: [] };
                renderResult(panel, payload, null, error);
            } finally {
                setBusy(panel, false);
            }
        };
        if (syncBtn) syncBtn.onclick = async () => {
            setBusy(panel, true);
            try {
                const payload = panel.__assessmentSyncPayload || await buildAssessmentSyncPayload();
                const overwrite = !!panel.querySelector('#tmAssessmentOverwriteManual')?.checked;
                if (!payload.items?.length) throw new Error('没有可同步的分值');
                if (!root.EdgeGateway || typeof root.EdgeGateway.syncAssessmentScores !== 'function') {
                    throw new Error('当前网关不支持考核同步，请先部署最新版本');
                }
                const result = await root.EdgeGateway.syncAssessmentScores({
                    academic_year: payload.academic_year,
                    overwrite_manual: overwrite,
                    items: payload.items
                });
                renderResult(panel, payload, result);
            } catch (error) {
                const payload = panel.__assessmentSyncPayload || { academic_year: getAcademicYearForSync(), items: [] };
                renderResult(panel, payload, null, error);
            } finally {
                setBusy(panel, false);
            }
        };
    }

    function installAssessmentSyncPanel() {
        renderPanel();
        setTimeout(renderPanel, 400);
        setTimeout(renderPanel, 1200);
    }

    function watchAssessmentSyncMount() {
        if (root.__TM_ASSESSMENT_SYNC_WATCHING__) return;
        root.__TM_ASSESSMENT_SYNC_WATCHING__ = true;
        document.addEventListener('click', (event) => {
            const target = event.target && typeof event.target.closest === 'function'
                ? event.target.closest('[data-target="teaching-overview"], [onclick*="teaching-overview"], [onclick*="teacher-analysis"]')
                : null;
            if (target) setTimeout(installAssessmentSyncPanel, 180);
            const syncPanel = event.target && typeof event.target.closest === 'function'
                ? event.target.closest('#tmAssessmentSyncPanel')
                : null;
            if (syncPanel && !syncPanel.dataset.assessmentSyncBound) installAssessmentSyncPanel();
        }, true);
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                const syncPanel = document.getElementById('tmAssessmentSyncPanel');
                if (syncPanel && !syncPanel.dataset.assessmentSyncBound) {
                    installAssessmentSyncPanel();
                } else if (document.getElementById('tmNextAction') && !syncPanel) {
                    installAssessmentSyncPanel();
                }
            });
            observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
        }
    }

    root.tmBuildTeacherAssessmentSyncPayload = buildAssessmentSyncPayload;
    root.tmBuildTeacherAssessmentSyncAudit = buildAssessmentSyncAudit;
    root.tmApplyCrossGradeAssessmentRule = applyCrossGradeAssessmentRule;
    root.tmRenderAssessmentSyncPanel = installAssessmentSyncPanel;
    root.tmRunAutomaticAssessmentSync = runAutomaticAssessmentSync;
    root.AssessmentRosterCore = {
        lockCurrentRoster: lockAssessmentRosters,
        unlockRoster: unlockAssessmentRoster,
        listSnapshots: listAssessmentRosterSnapshots,
        getPanelState: getAssessmentRosterPanelState
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            installAssessmentSyncPanel();
            watchAssessmentSyncMount();
            scheduleAutomaticAssessmentSync();
        });
    } else {
        installAssessmentSyncPanel();
        watchAssessmentSyncMount();
        scheduleAutomaticAssessmentSync();
    }
})();
