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
            formula: '教师两率一分主体 =（个人优秀率/最高学校优秀率*40 + 个人及格率/最高学校及格率*30 + 个人平均分/最高学校平均分*30）/最高教师成绩*54；乡镇最高值比较含银山实验本校；优秀率增幅 6 分需用本年度 7 月与上年度 7 月基准考试对比。'
        },
        [PROJECTS.classCollaboration]: {
            max: 10,
            requiresJuly: true,
            syncMode: 'sync',
            source: '教学管理 · 任教班级总分',
            formula: '班级协调组成绩 =（个人班级优秀率/最高班级优秀率*40 + 个人班级及格率/最高班级及格率*30 + 个人班级平均分/最高班级平均分*30）/最高班级成绩*10；乡镇最高值比较含银山实验本校。'
        },
        [PROJECTS.subjectCollaboration]: {
            max: 10,
            requiresJuly: true,
            syncMode: 'sync',
            source: '教学管理 · 本校同学科整体指标',
            formula: '学科集体协作成绩 =（学科优秀率/最高学科优秀率*40 + 学科及格率/最高学科及格率*30 + 学科平均分/最高学科平均分*30）/最高学科成绩*10；乡镇同学科最高值比较含银山实验本校。'
        },
        [PROJECTS.bottomThird]: {
            max: 10,
            requiresJuly: true,
            syncMode: 'sync',
            source: '联考分析 · 后 1/3 总分',
            formula: '后 1/3 学生成绩 = 任教班级后 1/3 学生总分平均分 / 乡镇最高后 1/3 学生平均分 * 10；乡镇最高值比较含银山实验本校。'
        },
        [PROJECTS.excellentContribution]: {
            max: 5,
            requiresJuly: true,
            syncMode: 'sync',
            source: '联考分析 · 7 月期末/中考尖子生',
            formula: '尖子生培养贡献只限 7 月成绩：非毕业年级按第二学期期末乡镇前 150 名及学科位次累加；九年级按 7 月上传的中考成绩确定尖子生/优秀尖子；教师原始贡献按最高教师折算 5 分，最高教师比较含银山实验本校。'
        },
        [PROJECTS.classTermScoreNonGrad]: {
            max: 60,
            requiresJuly: true,
            syncMode: 'preview',
            source: '公式审计 · 非毕业年级第二学期期末成绩',
            formula: '非毕业年级班级期末成绩 = 班级总成绩两率一分 50 分 + 班级优秀率增幅 10 分；乡镇最高值比较含银山实验本校；依赖7月/期末成绩、上一基准成绩和95%人数补零规则。'
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
            formula: '毕业班两率一分 = 及格率10分 + 平均分10分 + 优秀率20分 + 优秀率增幅5分；涉及乡镇最高值比较时含银山实验本校；依赖9年级7月中考或最后一次统一模拟。'
        },
        [PROJECTS.classHighSchoolContribution]: {
            max: 15,
            requiresJuly: true,
            syncMode: 'preview',
            source: '教学管理 · 9 年级 7 月中考高中过线',
            formula: '高中贡献率只使用 9 年级 7 月上传的中考成绩：按云端管理填写的中考高中过线分数统计本校每班过线率，再按“本班过线率 / 本校级部班级最高过线率 × 15”折算；当前仅预览，不写入考核系统。'
        },
        [PROJECTS.classTargetGrad]: {
            max: 33,
            requiresJuly: true,
            syncMode: 'preview',
            source: '教学管理 · 9 年级 7 月中考指标完成',
            formula: '毕业班指标完成只使用 9 年级 7 月中考成绩：指标一每班9人基础10分、超额额外按本校级部最高超额人数加5分；指标二每班40人基础10分、超额额外按本校级部最高超额人数加8分；当前仅预览，不写入考核系统。'
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
            formula: '高分段贡献只使用9年级7月中考，总分550分以上人数 / 本校级部最高班级550分以上人数 × 15；这是本校内部班级比较，当前仅预览，不写入考核系统。'
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
    const COMPOSITE_MAKEUP_SUBJECTS_BY_GRADE = {
        8: ['历史', '地理', '生物'],
        9: ['政治']
    };

    function text(value) {
        return String(value ?? '').trim();
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
        const match = source.match(/[6-9]/);
        return match ? match[0] : '';
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
        const candidates = [
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

    function getMakeupSubjectsForGrade(grade) {
        return COMPOSITE_MAKEUP_SUBJECTS_BY_GRADE[normalizeGrade(grade)] || [];
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

    function indexRowsForMakeup(rows) {
        const exact = new Map();
        const byName = new Map();
        (rows || []).forEach((row) => {
            const exactKey = buildStudentExactKey(row);
            const nameKey = buildStudentNameKey(row);
            if (!exact.has(exactKey)) exact.set(exactKey, []);
            exact.get(exactKey).push(row);
            if (!byName.has(nameKey)) byName.set(nameKey, []);
            byName.get(nameKey).push(row);
        });
        return { exact, byName };
    }

    function resolveMakeupRow(row, index) {
        const exactRows = index.exact.get(buildStudentExactKey(row)) || [];
        if (exactRows.length === 1) return { row: exactRows[0], mode: '学校+姓名+班级' };
        if (exactRows.length > 1) return { row: null, mode: '学校+姓名+班级', ambiguous: true };
        const nameRows = index.byName.get(buildStudentNameKey(row)) || [];
        if (nameRows.length === 1) return { row: nameRows[0], mode: '学校+姓名唯一' };
        return { row: null, mode: '学校+姓名唯一', ambiguous: nameRows.length > 1 };
    }

    function teacherKeyFor(name, grade, subject) {
        return `${text(name)}::${normalizeGrade(grade)}::${normalizeSubject(subject)}`;
    }

    function buildMissingTeacherKeys(missingRows, teachers) {
        const classTeacher = new Map();
        (teachers || []).forEach((teacher) => {
            (teacher.classes || []).forEach((className) => {
                classTeacher.set(`${text(className)}::${teacher.subject}`, teacher);
            });
        });
        const keys = new Set();
        missingRows.forEach((item) => {
            const teacher = classTeacher.get(`${item.className}::${item.subject}`);
            if (teacher) keys.add(teacherKeyFor(teacher.teacher_name, teacher.grade, teacher.subject));
        });
        return keys;
    }

    function buildCompositeAssessmentRows(julyRows, teachers, examContext) {
        const baseInfo = getCurrentCompositeBaseInfo(julyRows, examContext);
        const makeupSubjects = getMakeupSubjectsForGrade(baseInfo.grade);
        const result = {
            rows: julyRows.map((row) => ({
                ...row,
                scores: { ...(row?.scores || {}) }
            })),
            baseInfo,
            makeupExam: null,
            makeupSubjects,
            missing: [],
            missingTeacherKeys: new Set(),
            skipped: [],
            usedFallbackMatches: 0
        };
        if (!makeupSubjects.length) return result;

        const candidate = findLatestSecondMockExam(baseInfo, examContext);
        if (!candidate) {
            result.skipped.push(`${baseInfo.grade}年级 ${makeupSubjects.join('、')} 需要二模补科，但未找到同届同学年度二模考试；相关教师自动同步将跳过。`);
            result.missingTeacherKeys = new Set((teachers || [])
                .filter((teacher) => normalizeGrade(teacher.grade) === baseInfo.grade && makeupSubjects.includes(teacher.subject))
                .map((teacher) => teacherKeyFor(teacher.teacher_name, teacher.grade, teacher.subject)));
            return result;
        }

        const makeupRows = getExamRows(candidate.exam);
        const makeupIndex = indexRowsForMakeup(makeupRows);
        result.makeupExam = {
            id: candidate.examId,
            label: getExamLabel({ currentExamId: candidate.examId, exam: candidate.exam }),
            date: extractExamDate({ currentExamId: candidate.examId, exam: candidate.exam })
        };

        result.rows.forEach((row) => {
            const rowGrade = getExamGrade('', {}, [row]) || baseInfo.grade;
            if (rowGrade !== baseInfo.grade) return;
            const resolved = resolveMakeupRow(row, makeupIndex);
            makeupSubjects.forEach((subject) => {
                const currentScore = getSubjectScore(row, subject);
                if (Number.isFinite(currentScore)) return;
                const makeupScore = resolved.row ? getSubjectScore(resolved.row, subject) : NaN;
                if (Number.isFinite(makeupScore)) {
                    row.scores[subject] = makeupScore;
                    if (resolved.mode === '学校+姓名唯一') result.usedFallbackMatches += 1;
                    return;
                }
                result.missing.push({
                    school: normalizeSchoolForSync(row?.school),
                    className: normalizeStudentClass(row),
                    studentName: normalizeStudentName(row),
                    subject,
                    reason: resolved.ambiguous ? `${resolved.mode}匹配不唯一` : '二模补科成绩缺失'
                });
            });
        });
        result.missingTeacherKeys = buildMissingTeacherKeys(result.missing, teachers);
        return result;
    }

    function filterCompositeItems(items, composite, projectId) {
        if (!composite?.missingTeacherKeys?.size) return items;
        return (items || []).filter((item) => {
            if (!composite.makeupSubjects.includes(normalizeSubject(item.subject))) return true;
            const key = teacherKeyFor(item.teacher_name, item.grade, item.subject);
            if (!composite.missingTeacherKeys.has(key)) return true;
            return false;
        }).map((item) => ({ ...item, project_id: item.project_id || projectId }));
    }

    function withCompositeTeacherStats(rows, callback) {
        const previousRows = root.RAW_DATA;
        const previousStats = root.TEACHER_STATS;
        root.RAW_DATA = rows;
        root.TEACHER_STATS = {};
        ensureTeacherStats();
        try {
            return callback();
        } finally {
            root.RAW_DATA = previousRows;
            root.TEACHER_STATS = previousStats;
        }
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
        }).filter((item) => item.teacherName && item.className && item.subject);
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

    function buildTownSubjectHighest(rows) {
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
        const thresholdsBySubject = new Map();
        subjectValues.forEach((values, subject) => {
            const ordered = values.slice().sort((a, b) => b - a);
            const top = ordered[0] || 0;
            thresholdsBySubject.set(subject, {
                exc: Math.max(ordered[Math.floor(ordered.length * 0.2)] || 0, top * 0.8),
                pass: Math.max(ordered[Math.floor(ordered.length * 0.6)] || 0, top * 0.6)
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
            const metric = metricFromValues(entry.values, thresholdsBySubject.get(entry.subject) || { exc: 0, pass: 0 });
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

    function buildTwoRatesItems(teachers, rows) {
        const stats = root.TEACHER_STATS || {};
        const townHighestBySubject = buildTownSubjectHighest(rows);
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
            const highest = townHighestBySubject.get(entries[0]?.teacher?.subject) || {
                excellentRate: Math.max(...entries.map((entry) => toNumber(entry.data.excellentRate, 0)), 0),
                passRate: Math.max(...entries.map((entry) => toNumber(entry.data.passRate, 0)), 0),
                avg: Math.max(...entries.map((entry) => toNumber(entry.data.avgValue ?? entry.data.avg, 0)), 0)
            };
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
                items.push({
                    ...entry.teacher,
                    project_id: PROJECTS.twoRates,
                    score: entry.score,
                    max_score: 60,
                    note: `联考两率一分主体 ${entry.score}/54；乡镇最高值比较含本校；优秀率 ${pct(entry.data.excellentRate)}，及格率 ${pct(entry.data.passRate)}，均分 ${round(entry.data.avgValue ?? entry.data.avg, 2)}。优秀率增幅需有基准考试后另行同步或手填。`,
                    source: 'teaching-management'
                });
            });
        });
        return items;
    }

    function buildClassMetrics(rows) {
        const thresholds = resolveTotalThresholds(rows);
        const map = new Map();
        rows.forEach((row) => {
            const school = normalizeSchoolForSync(row?.school);
            const className = typeof root.normalizeClass === 'function' ? root.normalizeClass(row?.class) : text(row?.class);
            if (!school || !className) return;
            const key = `${school}::${className}`;
            if (!map.has(key)) map.set(key, { school, className, totals: [] });
            const total = getTotal(row);
            if (Number.isFinite(total)) map.get(key).totals.push(total);
        });
        return Array.from(map.values()).map((item) => ({
            ...item,
            metric: metricFromValues(item.totals, thresholds)
        })).filter((item) => item.metric);
    }

    function buildClassCollaborationItems(teachers, rows) {
        const classMetrics = buildClassMetrics(rows);
        const highest = {
            excellentRate: Math.max(...classMetrics.map((item) => item.metric.excellentRate), 0),
            passRate: Math.max(...classMetrics.map((item) => item.metric.passRate), 0),
            avg: Math.max(...classMetrics.map((item) => item.metric.avg), 0)
        };
        const metricByClass = new Map(classMetrics.map((item) => [`${item.school}::${item.className}`, item.metric]));
        const rawScores = teachers.map((teacher) => {
            const metrics = teacher.classes
                .map((className) => metricByClass.get(`${teacher.school}::${className}`))
                .filter(Boolean);
            const totalCount = metrics.reduce((sum, metric) => sum + metric.count, 0);
            if (!totalCount) return null;
            const metric = {
                count: totalCount,
                avg: metrics.reduce((sum, metric) => sum + metric.avg * metric.count, 0) / totalCount,
                excellentRate: metrics.reduce((sum, metric) => sum + metric.excellentRate * metric.count, 0) / totalCount,
                passRate: metrics.reduce((sum, metric) => sum + metric.passRate * metric.count, 0) / totalCount
            };
            return {
                teacher,
                metric,
                raw: weightedScore(metric, highest)
            };
        }).filter(Boolean);
        return scaleWithinGroup(rawScores, 10).map((entry) => ({
            ...entry.teacher,
            project_id: PROJECTS.classCollaboration,
            score: entry.score,
            max_score: 10,
            note: `按任教班级总分三项核算，乡镇最高值比较含本校：优秀率 ${pct(entry.metric.excellentRate)}，及格率 ${pct(entry.metric.passRate)}，均分 ${round(entry.metric.avg, 2)}。`,
            source: 'teaching-management'
        }));
    }

    function buildSubjectCollaborationItems(teachers, rows) {
        const stats = root.TEACHER_STATS || {};
        const subjectRows = new Map();
        rows.forEach((row) => {
            const scores = row?.scores && typeof row.scores === 'object' ? row.scores : {};
            Object.keys(scores).forEach((rawSubject) => {
                const subject = normalizeSubject(rawSubject);
                if (!subject) return;
                const school = normalizeSchoolForSync(row?.school);
                const value = getSubjectScore(row, subject);
                if (!school || !Number.isFinite(value)) return;
                const key = `${school}::${subject}`;
                if (!subjectRows.has(key)) subjectRows.set(key, { school, subject, values: [], thresholds: { exc: 0, pass: 0 } });
                subjectRows.get(key).values.push(value);
            });
        });
        const thresholdsBySubject = new Map();
        subjectRows.forEach((entry) => {
            if (thresholdsBySubject.has(entry.subject)) return;
            const values = [];
            rows.forEach((row) => {
                const value = getSubjectScore(row, entry.subject);
                if (Number.isFinite(value)) values.push(value);
            });
            const ordered = values.sort((a, b) => b - a);
            const top = ordered[0] || 0;
            thresholdsBySubject.set(entry.subject, {
                exc: Math.max(ordered[Math.floor(ordered.length * 0.2)] || 0, top * 0.8),
                pass: Math.max(ordered[Math.floor(ordered.length * 0.6)] || 0, top * 0.6)
            });
        });
        const townBySubject = new Map();
        subjectRows.forEach((entry) => {
            const metric = metricFromValues(entry.values, thresholdsBySubject.get(entry.subject) || { exc: 0, pass: 0 });
            if (!metric) return;
            if (!townBySubject.has(entry.subject)) townBySubject.set(entry.subject, []);
            townBySubject.get(entry.subject).push({ ...entry, metric });
        });
        const highestBySubject = new Map();
        townBySubject.forEach((entries, subject) => {
            highestBySubject.set(subject, {
                excellentRate: Math.max(...entries.map((entry) => entry.metric.excellentRate), 0),
                passRate: Math.max(...entries.map((entry) => entry.metric.passRate), 0),
                avg: Math.max(...entries.map((entry) => entry.metric.avg), 0)
            });
        });
        const bySubject = new Map();
        teachers.forEach((teacher) => {
            const data = getTeacherSubjectStats(stats, teacher.teacher_name, teacher.subject);
            if (!data || !toNumber(data.studentCount, 0)) return;
            if (!bySubject.has(teacher.subject)) bySubject.set(teacher.subject, []);
            bySubject.get(teacher.subject).push({ teacher, data });
        });
        const items = [];
        bySubject.forEach((entries) => {
            const totalCount = entries.reduce((sum, entry) => sum + toNumber(entry.data.studentCount, 0), 0);
            if (!totalCount) return;
            const subjectMetric = {
                count: totalCount,
                excellentRate: entries.reduce((sum, entry) => sum + toNumber(entry.data.excellentRate, 0) * toNumber(entry.data.studentCount, 0), 0) / totalCount,
                passRate: entries.reduce((sum, entry) => sum + toNumber(entry.data.passRate, 0) * toNumber(entry.data.studentCount, 0), 0) / totalCount,
                avg: entries.reduce((sum, entry) => sum + toNumber(entry.data.avgValue ?? entry.data.avg, 0) * toNumber(entry.data.studentCount, 0), 0) / totalCount
            };
            const highest = highestBySubject.get(entries[0]?.teacher?.subject) || subjectMetric;
            const raw = weightedScore(subjectMetric, highest);
            const score = Number.isFinite(raw) ? round(Math.min(10, (raw / 100) * 10), 2) : 0;
            entries.forEach((entry) => {
                items.push({
                    ...entry.teacher,
                    project_id: PROJECTS.subjectCollaboration,
                    score,
                    max_score: 10,
                    note: `本校同学科协作项按全镇同学科最高指标折算，最高值比较含本校；${entry.teacher.subject}优秀率 ${pct(subjectMetric.excellentRate)}，及格率 ${pct(subjectMetric.passRate)}，均分 ${round(subjectMetric.avg, 2)}。`,
                    source: 'teaching-management'
                });
            });
        });
        return items;
    }

    function buildBottomThirdItems(teachers, rows) {
        const schoolClassMetrics = buildClassMetrics(rows);
        const bottomByClass = new Map();
        schoolClassMetrics.forEach((item) => {
            const totals = item.totals.slice().sort((a, b) => a - b);
            const count = Math.max(1, Math.ceil(totals.length / 3));
            const bottom = totals.slice(0, count);
            const avg = bottom.reduce((sum, value) => sum + value, 0) / bottom.length;
            bottomByClass.set(`${item.school}::${item.className}`, { avg, count: bottom.length });
        });
        const highest = Math.max(...Array.from(bottomByClass.values()).map((item) => item.avg), 0);
        return teachers.map((teacher) => {
            const metrics = teacher.classes.map((className) => bottomByClass.get(`${teacher.school}::${className}`)).filter(Boolean);
            const count = metrics.reduce((sum, item) => sum + item.count, 0);
            if (!count || highest <= 0) return null;
            const avg = metrics.reduce((sum, item) => sum + item.avg * item.count, 0) / count;
            return {
                ...teacher,
                project_id: PROJECTS.bottomThird,
                score: round((avg / highest) * 10, 2),
                max_score: 10,
                note: `任教班级后 1/3 总分均分 ${round(avg, 2)}，全镇最高 ${round(highest, 2)}（含本校）。`,
                source: 'teaching-management'
            };
        }).filter(Boolean);
    }

    function buildExcellentContributionItems(teachers, rows) {
        const grade = normalizeGrade(getCurrentCompositeBaseInfo(rows, getCurrentExamContext()).grade || getExamGrade('', {}, rows));
        if (grade === '9') return buildGrade9ExcellentContributionItems(teachers, rows);
        const ranked = rows.map((row) => ({
            row,
            total: getTotal(row)
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
            note: `按全镇前 150 名学生与任教学科匹配生成贡献值 ${entry.raw}，再按最高教师折算 5 分（最高教师比较含本校）。`,
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
        const subjects = Array.from(new Set(rows.flatMap((row) => Object.keys(row?.scores || {}).map(normalizeSubject)).filter(Boolean)));
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
            note: `9年级中考尖子生培养：总分600分以上为优秀尖子，按学科位次10分起递减2分；550-599分为尖子生，按学科位次5分起递减1分。原始贡献 ${entry.raw}（优秀尖子${entry.counters.excellent || 0}项，尖子生${entry.counters.top || 0}项），再按最高教师折算5分（最高教师比较含本校）。`,
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
        const classMap = new Map();
        ownRows.forEach((row) => {
            const className = typeof root.normalizeClass === 'function' ? root.normalizeClass(row?.class) : text(row?.class);
            const total = getTotal(row);
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
                    note: `9年级7月中考高中过线分数 ${line}；任教班级 ${over}/${total} 人过线，过线率 ${pct(rate)}；本校级部班级最高过线率 ${pct(highestRate)}，折算 ${score}/15。`,
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
        if (highSchoolLine > 0) {
            preview.push(...markPreviewOnly(buildClassHighSchoolContributionItems(teachers, rows, highSchoolLine), '当前仅做高中贡献率公式预览，不写入考核系统。'));
        } else {
            skipped.push('9年级7月中考缺少“中考高中过线分数”，高中贡献率只显示公式审计，不生成预览分。');
        }
        preview.push(...markPreviewOnly(buildClassHighScoreGradItems(teachers, rows), '当前仅做高分段贡献公式预览，不写入考核系统。'));
        return preview.filter((item) => Number.isFinite(toNumber(item.score, NaN)) && item.score >= 0);
    }

    async function buildAssessmentSyncPayload() {
        if (root.SystemRuntimeLoader && typeof root.SystemRuntimeLoader.load === 'function') {
            try {
                await root.SystemRuntimeLoader.load('teacher-analysis');
            } catch (error) {
                console.warn('[assessment-sync] load teacher-analysis failed:', error);
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
        const examContext = getCurrentExamContext();
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
        const composite = buildCompositeAssessmentRows(rows, teachers, examContext);
        skipped.push(...(composite.skipped || []));
        if (composite.missing.length) {
            skipped.push(`合成成绩表有 ${composite.missing.length} 条二模补科缺失或匹配异常；对应补科教师不会自动写入分数。`);
        }

        const items = withCompositeTeacherStats(composite.rows, () => {
            const twoRates = filterCompositeItems(buildTwoRatesItems(teachers, composite.rows), composite, PROJECTS.twoRates);
            const classCollaboration = filterCompositeItems(buildClassCollaborationItems(teachers, composite.rows), composite, PROJECTS.classCollaboration);
            const subjectCollaboration = filterCompositeItems(buildSubjectCollaborationItems(teachers, composite.rows), composite, PROJECTS.subjectCollaboration);
            const bottomThird = filterCompositeItems(buildBottomThirdItems(teachers, composite.rows), composite, PROJECTS.bottomThird);
            const excellentItems = filterCompositeItems(buildExcellentContributionItems(teachers, composite.rows), composite, PROJECTS.excellentContribution);
            return [
                ...twoRates,
                ...classCollaboration,
                ...subjectCollaboration,
                ...bottomThird,
                ...excellentItems
            ];
        }).filter((item) => Number.isFinite(toNumber(item.score, NaN)) && item.score >= 0)
            .map((item) => ({
                ...item,
                source_exam_id: examContext.currentExamId,
                source_exam_label: examLabel,
                source_exam_date: examDate,
                makeup_exam_id: composite.makeupExam?.id || '',
                makeup_exam_label: composite.makeupExam?.label || '',
                makeup_exam_date: composite.makeupExam?.date || '',
                makeup_subjects: composite.makeupSubjects,
                composite_missing_count: composite.missing.length,
                note: `${item.note} 来源考试：${examDate || examLabel}；本项目以 7 月基准 + 二模补科合成成绩表计算。${composite.makeupSubjects.length ? `补科科目：${composite.makeupSubjects.join('、')}；二模来源：${composite.makeupExam ? (composite.makeupExam.date || composite.makeupExam.label) : '未匹配'}。` : '本年级无需二模补科。'}`
            }));
        const previewItems = buildFormulaAuditPreviewItems({ teachers, rows, examContext, highSchoolLine, skipped })
            .map((item) => ({
                ...item,
                source_exam_id: examContext.currentExamId,
                source_exam_label: examLabel,
                source_exam_date: examDate
            }));
        return {
            academic_year: getAcademicYearForSync(),
            source_exam_id: examContext.currentExamId,
            source_exam_label: examLabel,
            source_exam_date: examDate,
            source_exam_month: examMonth,
            composite_mode: 'july_with_second_mock_makeup',
            composite_base_grade: composite.baseInfo.grade,
            makeup_exam_id: composite.makeupExam?.id || '',
            makeup_exam_label: composite.makeupExam?.label || '',
            makeup_exam_date: composite.makeupExam?.date || '',
            makeup_subjects: composite.makeupSubjects,
            makeup_missing_count: composite.missing.length,
            makeup_missing: composite.missing.slice(0, 120),
            makeup_fallback_matches: composite.usedFallbackMatches,
            items,
            preview_items: previewItems,
            skipped
        };
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
            payload.composite_mode || 'plain',
            payload.makeup_exam_id || 'no-makeup',
            (payload.makeup_subjects || []).join(','),
            payload.makeup_missing_count || 0,
            `ind1:${indicatorLines.ind1}`,
            `ind2:${indicatorLines.ind2}`,
            `hs:${highSchoolLine || 0}`,
            rows.length,
            teachers.length,
            Object.keys(counts).sort().map((key) => `${key}:${counts[key]}`).join(',')
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
                overwrite_manual: false,
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
                fallbackMatches: payload.makeup_fallback_matches || 0
            },
            received: result?.received || (payload.items || []).length,
            valid: result?.valid || (payload.items || []).length,
            written: result?.written || 0,
            wouldWrite: result?.would_write || (payload.items || []).length,
            previewOnly: (payload.preview_items || []).length,
            skipped: [
                ...(payload.skipped || []).map((reason) => ({ reason })),
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
                    <span class="status-chip info">合成口径：7月 + 二模补科</span>
                    ${composite.makeupSubjects?.length ? `<span class="status-chip info">补科：${escapeHtml(composite.makeupSubjects.join('、'))}</span>` : '<span class="status-chip ok">无需补科</span>'}
                    ${composite.makeupExamId ? `<span class="status-chip info">二模：${escapeHtml(composite.makeupExamDate || composite.makeupExamLabel || composite.makeupExamId)}</span>` : ''}
                    ${composite.missingCount ? `<span class="status-chip warn">补科缺失 ${escapeHtml(composite.missingCount)} 条</span>` : ''}
                    <span class="status-chip info">预计写入 ${escapeHtml(audit.wouldWrite)} 条</span>
                    <span class="status-chip info">只读预览 ${escapeHtml(audit.previewOnly)} 条</span>
                    <span class="status-chip ok">已写入 ${escapeHtml(audit.written)} 条</span>
                </div>
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
            '类型', '教师', '年级', '学科', '项目', '分值', '满分', '说明'
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
                item.note
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
                item.note
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
                item.reason
            ]);
        });
        (payload.skipped || []).forEach((reason) => {
            rows.push(['本地缺项', '', '', '', '', '', '', reason]);
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
                <td><strong>${escapeHtml(item.score)}</strong> / ${escapeHtml(item.max_score || '')}</td>
            </tr>
        `).join('');
        const previewRows = (payload.preview_items || []).slice(0, 8).map((item) => `
            <tr>
                <td>${escapeHtml(item.teacher_name || '-')}</td>
                <td>${escapeHtml(gradeLabel(item.grade))}</td>
                <td>${escapeHtml(item.subject || '-')}</td>
                <td>${escapeHtml(PROJECT_LABELS[item.project_id] || item.project_id)}</td>
                <td><strong>${escapeHtml(item.score)}</strong> / ${escapeHtml(item.max_score || '')}</td>
                <td>${escapeHtml(item.note || '')}</td>
            </tr>
        `).join('');
        const skippedRows = (result?.skipped || []).slice(0, 8).map((item) => `
            <li><strong>${escapeHtml(item.teacher_name || '')}</strong> ${escapeHtml(gradeLabel(item.grade || ''))} ${escapeHtml(item.subject || '')} ${escapeHtml(PROJECT_LABELS[item.project_id] || item.project_id || '')}：${escapeHtml(item.reason || '')}</li>
        `).join('');
        resultEl.innerHTML = `
            <div class="tm-assessment-sync-summary">
                <span class="status-chip info">学年度 ${escapeHtml(payload.academic_year)}</span>
                <span class="status-chip ${payload.items?.length ? 'ok' : 'warn'}">${escapeHtml(summarizeItems(payload.items))}</span>
                ${payload.preview_items?.length ? `<span class="status-chip info">只读预览 ${escapeHtml(payload.preview_items.length)} 条</span>` : ''}
                ${result?.dry_run ? `<span class="status-chip info">预计写入 ${escapeHtml(result.would_write || 0)} 条</span>` : ''}
                ${result && !result.dry_run ? `<span class="status-chip ok">已写入 ${escapeHtml(result.written || 0)} 条</span>` : ''}
                ${result?.skipped?.length ? `<span class="status-chip warn">跳过 ${escapeHtml(result.skipped.length)} 条</span>` : ''}
                ${error ? `<span class="status-chip warn">${escapeHtml(error.message || error)}</span>` : ''}
            </div>
            ${buildAuditHtml(audit)}
            ${buildProjectMatrixHtml(payload.items || [])}
            ${sampleRows ? `<div class="table-wrap analysis-table-shell tm-assessment-sync-table"><table><thead><tr><th>教师</th><th>年级</th><th>学科</th><th>项目</th><th>分值</th></tr></thead><tbody>${sampleRows}</tbody></table></div>` : ''}
            ${previewRows ? `<div class="table-wrap analysis-table-shell tm-assessment-sync-table"><table><thead><tr><th>教师</th><th>年级</th><th>学科</th><th>预览项目</th><th>分值</th><th>说明</th></tr></thead><tbody>${previewRows}</tbody></table></div>` : ''}
            ${(payload.items?.length || payload.preview_items?.length || result?.skipped?.length || payload.skipped?.length) ? `<div><button type="button" class="btn btn-secondary tm-assessment-export-btn"><i class="ti ti-download"></i> 导出检查结果</button></div>` : ''}
            ${payload.skipped?.length ? `<div class="tm-assessment-sync-note">${payload.skipped.map(escapeHtml).join('<br>')}</div>` : ''}
            ${missing.missing.length ? `<div class="tm-assessment-sync-note"><strong>暂未自动生成：</strong>${escapeHtml(missing.missing.join('、'))}。请检查当前成绩、任课表或对应公式数据是否完整。</div>` : ''}
            <div class="tm-assessment-sync-note is-soft"><strong>保留手填：</strong>${escapeHtml(missing.manual.join('、'))}。</div>
            ${skippedRows ? `<div class="tm-assessment-sync-note"><strong>同步跳过：</strong><ul>${skippedRows}</ul></div>` : ''}
        `;
        setPreviewButtonState(panel, true);
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
                <div class="tm-next-desc"><strong>位置：教学管理首页。</strong>从当前联考成绩和教学管理任课表生成教师个人考核分值。缺成绩、缺任课表或目标系统未匹配到教师时不会写入，仍由考核组长手动填写。</div>
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
    root.tmRenderAssessmentSyncPanel = installAssessmentSyncPanel;
    root.tmRunAutomaticAssessmentSync = runAutomaticAssessmentSync;

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
