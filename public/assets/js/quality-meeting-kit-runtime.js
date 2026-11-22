/*
 * 质量分析会一键工具箱（quality-meeting-kit）按需运行时模块
 *
 * 100% 立足本系统（澄见 school-system）原生分年级考核算法与真实实考科目：
 * - 9年级模式：两率一分(50+80+50=180) + 后1/3托底(40) + 高分段(≥490赋50) + 指标生达标
 * - 6/7/8年级模式：两率一分(60+70+70=200) + 后1/3托底(40) = 240分
 * - 实考科目动态驱动：全科多于主科时自动激活「全科 vs 主科双口径」；实考即主科时不重复造表，切换为「两率一分 + 后1/3 综合拆解与学科分化诊断」；实考含地生时才启用地生会考诊断。
 * - 自动识别小样本/特殊班（人数不足班均45%），避免污染常规行政班班际极差与薄弱班诊断。
 * - 零内联 on* 事件，高优先级独立作用域样式（压制全局 button !important），16:9 预览与原生 OOXML 图表零截断。
 */
(function (root) {
    if (!root || root.__QUALITY_MEETING_KIT_PATCHED__) return;

    const DEFAULT_EXC_PCT = 0.15;
    const DEFAULT_PASS_PCT = 0.50;
    const DEFAULT_MARGIN = 10;

    const PPT_THEMES = {
        editorial: { name: '澄见极简', bg: '0F172A', accent: '2563EB', accent2: '10B981', accent3: 'F59E0B', tblHead: '1E293B', soft: 'F8FAFC', rowTint: 'EFF6FF', text: '0F172A' },
        navy: { name: '商务深蓝', bg: '0B2545', accent: '1D4ED8', accent2: '0EA5E9', accent3: 'F59E0B', tblHead: '1E3A8A', soft: 'F8FAFC', rowTint: 'DBEAFE', text: '0F172A' },
        emerald: { name: '教研墨绿', bg: '064E3B', accent: '0D9488', accent2: '10B981', accent3: 'F59E0B', tblHead: '0F766E', soft: 'F0FDFA', rowTint: 'CCFBF1', text: '0F172A' }
    };

    const GRADE_BASE_PROFILES = {
        '9': {
            grade: '9',
            name: '九年级 · 中考冲刺全维评价模式',
            shortTag: '9年级中考全维模式',
            weights: { avg: 50, exc: 80, pass: 50, total: 180, bottom3: 40, highScore: 50 },
            majorSubjects: ['语文', '数学', '英语', '物理', '化学'],
            majorLabel: '五科总',
            formulaDesc: '两率一分(50+80+50=180) + 后1/3托底(40) + 高分段≥490(50) + 指标生达标',
            specialSlideTitle: '九年级专项核算：高分段(≥490) · 指标生 · 后1/3托底',
            specialSheetName: '9年级专项核算',
            pedagogyFocus: '锚定指标生达标线、壮大490+高分尖子群、五科总分均衡冲刺与后1/3有效分托底',
            actionThemes: ['指标生与490+尖子突破', '五科短板与压轴攻坚', '班级均衡与临界生包保', '后1/3有效分托底清零']
        },
        '8': {
            grade: '8',
            name: '八年级 · 五科核心与防分化评价模式',
            shortTag: '8年级五科防分化模式',
            weights: { avg: 60, exc: 70, pass: 70, total: 200, bottom3: 40, highScore: 0 },
            majorSubjects: ['语文', '数学', '英语', '物理', '化学'],
            majorLabel: '五科主科',
            formulaDesc: '两率一分(均分60+优率70+及格70=200) + 后1/3托底(40) = 240分',
            specialSlideTitle: '八年级专项：综合总分(240)结构拆解与后1/3托底对标',
            specialSheetName: '8年级综合与后三分之一专项',
            pedagogyFocus: '严防八年级物理/化学与数英腰部塌陷，狠抓高分段拉升与后1/3有效均分托底',
            actionThemes: ['全镇综合位次与追赶路径', '理科防分化与短板学科攻坚', '消除行政班极差与腰部断层', '后1/3托底与临界生转化']
        },
        '7': {
            grade: '7',
            name: '七年级 · 初一防分化与三科主科模式',
            shortTag: '7年级三科主科模式',
            weights: { avg: 60, exc: 70, pass: 70, total: 200, bottom3: 40, highScore: 0 },
            majorSubjects: ['语文', '数学', '英语'],
            majorLabel: '三科主科',
            formulaDesc: '两率一分(均分60+优率70+及格70=200) + 后1/3托底(40) = 240分',
            specialSlideTitle: '七年级专项：语数英三科主科对标 & 后1/3托底防掉队',
            specialSheetName: '7年级三科主科与后三分之一',
            pedagogyFocus: '筑牢语数英三科核心底盘，严防初一数学、英语早发性两极分化，守住后1/3有效分',
            actionThemes: ['语数英三科主科镇域追赶', '数学/英语防早发两极分化', '班级均衡与学习常规固化', '后1/3托底与及格边缘清零']
        },
        '6': {
            grade: '6',
            name: '六年级 · 小初衔接与三科奠基模式',
            shortTag: '6年级小初衔接模式',
            weights: { avg: 60, exc: 70, pass: 70, total: 200, bottom3: 40, highScore: 0 },
            majorSubjects: ['语文', '数学', '英语'],
            majorLabel: '三科主科',
            formulaDesc: '两率一分(均分60+优率70+及格70=200) + 后1/3托底(40) = 240分',
            specialSlideTitle: '六年级专项：小初衔接三科主科底盘 & 后1/3托底核算',
            specialSheetName: '6年级小初衔接与后三分之一',
            pedagogyFocus: '平稳推进小初衔接习惯养成，以语数英及格率与后1/3有效均分为第一生命线',
            actionThemes: ['小初衔接全镇站位与三科底盘', '语数英基础过关与习惯养成', '班级均衡发展与常规督导', '后1/3学困生托底与脱低行动']
        }
    };

    function escHtml(value) {
        if (typeof root.escapeAppHtml === 'function') return root.escapeAppHtml(value);
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escXml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function toast(message, type = 'info') {
        if (root.UI && typeof root.UI.toast === 'function') return root.UI.toast(message, type);
        if (type === 'error' && typeof root.alert === 'function') return root.alert(message);
        return undefined;
    }

    function sameSchool(a, b) {
        if (typeof root.sameAppSchoolName === 'function') return root.sameAppSchoolName(a, b);
        if (typeof root.areSchoolNamesEquivalent === 'function') return root.areSchoolNamesEquivalent(a, b);
        return String(a || '').trim() === String(b || '').trim();
    }

    function normClass(cls) {
        if (typeof root.normalizeClass === 'function') return String(root.normalizeClass(cls) || '').trim();
        return String(cls || '').trim().replace(/\s+/g, '');
    }

    function getMySchoolName(rows) {
        const explicit = String(root.MY_SCHOOL || root.DEFAULT_MY_SCHOOL_NAME || '').trim();
        if (explicit) return explicit;
        const first = (rows || []).find((r) => String(r?.school || '').trim());
        return first ? String(first.school).trim() : '本校';
    }

    // Build a complete, human-friendly exam title (never a bare "期末" when CURRENT_EXAM_ID has full context)
    function getExamTitle() {
        const id = String(root.CURRENT_EXAM_ID || '').trim();
        const meta = (id && root.COHORT_DB?.exams?.[id]?.meta) || {};
        const rawMetaName = String(meta.name || meta.examName || '').trim();
        const cfgName = String(root.CONFIG?.name || '').trim();
        if (rawMetaName && rawMetaName.length >= 6) return rawMetaName;
        if (id) {
            // Convert "2023级-8年级-2025-2026-下学期-期末-2026-07-02" -> "2023级8年级 2025-2026下学期期末"
            const cleaned = id.replace(/[-_]20\d{2}-\d{2}-\d{2}$/, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleaned.length >= 6) return cleaned;
        }
        const combined = [cfgName, rawMetaName].filter(Boolean).join(' ').trim();
        return combined || id || '当前考试';
    }

    function getAllRows() {
        return Array.isArray(root.RAW_DATA) ? root.RAW_DATA.slice() : [];
    }

    function getSubjects(rows) {
        if (Array.isArray(root.SUBJECTS) && root.SUBJECTS.length) return root.SUBJECTS.filter(Boolean);
        const set = new Set();
        (rows || []).forEach((r) => Object.keys(r?.scores || {}).forEach((s) => set.add(s)));
        return Array.from(set);
    }

    function resolveCurrentGradeNumber(overrideGrade = '') {
        const explicit = String(overrideGrade || '').trim().match(/^[6-9]$/);
        if (explicit) return explicit[0];
        if (typeof root.resolveWorkspaceGrade === 'function') {
            const id = String(root.CURRENT_EXAM_ID || '').trim();
            const meta = (id && root.COHORT_DB?.exams?.[id]?.meta) || {};
            const resolved = String(root.resolveWorkspaceGrade({ examId: id, meta }) || '').trim();
            if (/^[6-9]$/.test(resolved)) return resolved;
        }
        const source = `${root.CURRENT_EXAM_ID || ''} ${root.CONFIG?.name || ''} ${getExamTitle()}`;
        const digit = source.match(/([6-9])\s*年级/);
        if (digit) return digit[1];
        if (/六年级|小初/.test(source)) return '6';
        if (/七年级|初一/.test(source)) return '7';
        if (/八年级|初二/.test(source)) return '8';
        if (/九年级|初三|中考|一模|二模|三模/.test(source)) return '9';
        const subjs = getSubjects(getAllRows());
        if (subjs.includes('化学')) return '9';
        if (subjs.includes('物理')) return '8';
        return '7';
    }

    // Dynamically adapt Grade Profile to the ACTUAL subjects present in this exam (never hallucinate Geography/Biology if absent!)
    function getGradeAnalysisProfile(overrideGrade = '', rows = getAllRows()) {
        const g = resolveCurrentGradeNumber(overrideGrade);
        const base = { ...(GRADE_BASE_PROFILES[g] || GRADE_BASE_PROFILES['9']) };
        const officialSubjs = getSubjects(rows);
        const hasGeoBio = officialSubjs.includes('地理') || officialSubjs.includes('生物');
        const presentMajor = base.majorSubjects.filter((s) => officialSubjs.includes(s));
        const hasDistinctMajorCaliber = g !== '9' && presentMajor.length > 0 && presentMajor.length < officialSubjs.length;
        base.hasGeoBio = hasGeoBio;
        base.hasDistinctMajorCaliber = hasDistinctMajorCaliber;
        if (g === '8') {
            if (hasGeoBio && hasDistinctMajorCaliber) {
                base.name = '八年级 · 五科主科与地生会考双口径模式';
                base.shortTag = '8年级主科+地生双口径';
                base.specialSlideTitle = '八年级专项：五科主科 vs 全科双口径 & 后1/3托底';
                base.pedagogyFocus = '严防物理与数英腰部分化，同步推进地理/生物小中考会考达优及格，守住后1/3底盘';
            } else if (hasDistinctMajorCaliber) {
                base.name = '八年级 · 五科主科与全科双口径模式';
                base.shortTag = '8年级五科双口径模式';
                base.specialSlideTitle = '八年级专项：五科主科 vs 全科双口径 & 后1/3托底';
            }
        }
        return base;
    }

    function getDisplayAndOfficialSubjects(rows, gradeProfile) {
        const base = getSubjects(rows);
        const extraConfig = typeof root.getConfiguredExtraDisplaySubjects === 'function'
            ? root.getConfiguredExtraDisplaySubjects(root.CONFIG || {})
            : (Array.isArray(root.CONFIG?.extraDisplaySubs) ? root.CONFIG.extraDisplaySubs : []);
        const presentExtras = (Array.isArray(extraConfig) ? extraConfig : []).filter((s) => (
            s && !base.includes(s) && (rows || []).some((r) => Number.isFinite(Number(r?.scores?.[s])))
        ));
        const allPresent = [...base];
        presentExtras.forEach((s) => { if (!allPresent.includes(s)) allPresent.push(s); });
        if (gradeProfile.grade === '9' && (rows || []).some((r) => Number.isFinite(Number(r?.scores?.['政治']))) && !allPresent.includes('政治')) {
            allPresent.push('政治');
        }
        const officialSubjects = gradeProfile.grade === '9'
            ? base.filter((s) => s !== '政治')
            : base;
        const displayOnlySubjects = allPresent.filter((s) => !officialSubjects.includes(s));
        const majorSubjects = (gradeProfile.majorSubjects || []).filter((s) => allPresent.includes(s));
        return {
            officialSubjects: officialSubjects.length ? officialSubjects : allPresent,
            displayOnlySubjects,
            allSubjects: allPresent,
            majorSubjects
        };
    }

    function syncSystemEngines() {
        try {
            if (typeof root.calcSummary === 'function' && Array.isArray(root.RAW_DATA) && root.RAW_DATA.length) {
                root.calcSummary(true);
            }
            if (typeof root.renderBottom3TableOnly === 'function') {
                root.renderBottom3TableOnly();
            }
            if (typeof root.calcIndicators === 'function' && resolveCurrentGradeNumber() === '9') {
                root.calcIndicators(true);
            }
            if (typeof root.calculateTeacherTownshipRanking === 'function' && root.TEACHER_MAP && Object.keys(root.TEACHER_MAP).length) {
                root.calculateTeacherTownshipRanking({ force: false, teacherMetricScope: 'admin' });
            }
        } catch (_) { /* non-fatal in headless test */ }
    }

    function getStudentScore(student, subject, customSubjects = null) {
        if (!student) return NaN;
        if (Array.isArray(customSubjects) && customSubjects.length) {
            let sum = 0;
            let count = 0;
            customSubjects.forEach((s) => {
                const v = Number(student?.scores?.[s]);
                if (Number.isFinite(v)) {
                    sum += v;
                    count += 1;
                }
            });
            return count ? Number(sum.toFixed(2)) : NaN;
        }
        if (!subject || subject === '总分') {
            const total = Number(student.total);
            return Number.isFinite(total) ? total : NaN;
        }
        const val = student.scores ? Number(student.scores[subject]) : NaN;
        return Number.isFinite(val) ? val : NaN;
    }

    function quantileCutoff(sortedDesc, ratio) {
        if (!sortedDesc.length) return 0;
        const idx = Math.min(sortedDesc.length - 1, Math.max(0, Math.ceil(sortedDesc.length * ratio) - 1));
        return Number(sortedDesc[idx].toFixed(1));
    }

    function computeThresholdForSubject(rows, subject, customSubjects = null) {
        if (!customSubjects && subject && root.THRESHOLDS) {
            const key = subject === '总分' ? 'total' : subject;
            const sysTh = root.THRESHOLDS[key];
            if (sysTh && Number.isFinite(Number(sysTh.exc)) && Number.isFinite(Number(sysTh.pass)) && Number(sysTh.exc) > 0) {
                return { exc: Number(Number(sysTh.exc).toFixed(1)), pass: Number(Number(sysTh.pass).toFixed(1)), count: (rows || []).length };
            }
        }
        const scores = (rows || [])
            .map((r) => getStudentScore(r, subject, customSubjects))
            .filter((v) => Number.isFinite(v) && v >= 0)
            .sort((a, b) => b - a);
        if (!scores.length) return { exc: 0, pass: 0, count: 0 };
        const excRatio = Number(root.CONFIG?.excRate) || DEFAULT_EXC_PCT;
        const passRatio = Number(root.CONFIG?.passRate) || DEFAULT_PASS_PCT;
        return {
            exc: quantileCutoff(scores, excRatio),
            pass: quantileCutoff(scores, passRatio),
            count: scores.length
        };
    }

    function resolveThresholds(allRows, mySchoolRows, subjects, useTownshipLine = true) {
        const distinctSchools = new Set((allRows || []).map((r) => String(r?.school || '').trim()).filter(Boolean));
        const hasTownship = distinctSchools.size > 1;
        const baseRows = (useTownshipLine && hasTownship) ? allRows : (mySchoolRows.length ? mySchoolRows : allRows);
        const map = {};
        ['总分', ...(subjects || [])].forEach((subj) => {
            map[subj] = computeThresholdForSubject(baseRows, subj);
        });
        return {
            source: (useTownshipLine && hasTownship) ? 'township' : 'school',
            hasTownship,
            schoolCount: distinctSchools.size,
            thresholds: map
        };
    }

    function calcGroupMetrics(rows, subject, threshold, customSubjects = null) {
        const vals = (rows || []).map((r) => getStudentScore(r, subject, customSubjects)).filter((v) => Number.isFinite(v));
        const count = vals.length;
        if (!count) return { count: 0, avg: 0, excCount: 0, passCount: 0, excRate: 0, passRate: 0, excRatio: 0, passRatio: 0, ratedAvg: 0, ratedExc: 0, ratedPass: 0, score: 0 };
        const sum = vals.reduce((acc, v) => acc + v, 0);
        const avg = sum / count;
        const excCount = vals.filter((v) => v >= (threshold?.exc || 0)).length;
        const passCount = vals.filter((v) => v >= (threshold?.pass || 0)).length;
        const excRatio = excCount / count;
        const passRatio = passCount / count;
        return {
            count,
            avg: Number(avg.toFixed(2)),
            excCount,
            passCount,
            excRatio,
            passRatio,
            excRate: Number((excRatio * 100).toFixed(1)),
            passRate: Number((passRatio * 100).toFixed(1)),
            ratedAvg: 0,
            ratedExc: 0,
            ratedPass: 0,
            score: Number((avg * 0.6 + excRatio * 100 * 0.2 + passRatio * 100 * 0.2).toFixed(2))
        };
    }

    function applyAuthenticTwoRateScoring(items, gradeProfile = getGradeAnalysisProfile()) {
        const weights = gradeProfile?.weights || { avg: 60, exc: 70, pass: 70, total: 200 };
        const list = Array.isArray(items) ? items : [];
        const maxAvg = Math.max(...list.map((x) => Number(x.avg) || 0), 0);
        const maxExc = Math.max(...list.map((x) => Number(x.excRate) || 0), 0);
        const maxPass = Math.max(...list.map((x) => Number(x.passRate) || 0), 0);
        list.forEach((item) => {
            const rAvg = maxAvg > 0 ? ((Number(item.avg) || 0) / maxAvg) * weights.avg : 0;
            const rExc = maxExc > 0 ? ((Number(item.excRate) || 0) / maxExc) * weights.exc : 0;
            const rPass = maxPass > 0 ? ((Number(item.passRate) || 0) / maxPass) * weights.pass : 0;
            item.ratedAvg = Number(rAvg.toFixed(2));
            item.ratedExc = Number(rExc.toFixed(2));
            item.ratedPass = Number(rPass.toFixed(2));
            item.score2Rate = Number((rAvg + rExc + rPass).toFixed(2));
            item.score = item.score2Rate;
        });
        return list;
    }

    function computeBottom3ForStudents(students, customSubjects = null) {
        const vals = (students || [])
            .map((s) => getStudentScore(s, '总分', customSubjects))
            .filter((v) => Number.isFinite(v))
            .sort((a, b) => b - a);
        const totalN = vals.length;
        const bottomN = Math.max(0, Math.floor(totalN / 3));
        const excRatio = Number(root.CONFIG?.excRate) || 0.15;
        const excN = bottomN > 0 ? Math.ceil(bottomN * excRatio) : 0;
        const bottomGroup = bottomN > 0 ? vals.slice(-bottomN) : [];
        const validGroup = bottomGroup.slice(excN);
        const validCount = validGroup.length;
        const avg = validCount ? validGroup.reduce((a, b) => a + b, 0) / validCount : 0;
        return { totalN, bottomN, excN, validCount, avg: Number(avg.toFixed(2)) };
    }

    function assignRanks(items, key) {
        const sorted = items.slice().sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));
        const rankMap = new Map();
        sorted.forEach((item, idx) => {
            if (idx > 0 && Math.abs((Number(item[key]) || 0) - (Number(sorted[idx - 1][key]) || 0)) < 0.0001) {
                rankMap.set(item, rankMap.get(sorted[idx - 1]));
            } else {
                rankMap.set(item, idx + 1);
            }
        });
        return rankMap;
    }

    function buildInlineRankBadgeHtml(rank) {
        const n = Number(rank);
        if (!Number.isFinite(n) || n <= 0) return '';
        const cls = n === 1 ? 'qmk-rk-1' : (n === 2 ? 'qmk-rk-2' : (n === 3 ? 'qmk-rk-3' : 'qmk-rk-n'));
        return `<span class="qmk-rk ${cls}" title="单项排名第${n}">${n}</span>`;
    }

    // Detect regular administrative classes vs tiny special/outlier classes (< 45% of median class size)
    function annotateSmallClasses(classItems) {
        const counts = (classItems || []).map((c) => Number(c.count) || 0).filter((n) => n > 0).sort((a, b) => a - b);
        if (counts.length < 3) {
            (classItems || []).forEach((c) => { c.isSmallClass = false; });
            return classItems;
        }
        const median = counts[Math.floor(counts.length / 2)];
        const minRegular = Math.max(15, Math.floor(median * 0.45));
        (classItems || []).forEach((c) => {
            c.isSmallClass = (Number(c.count) || 0) < minRegular;
        });
        return classItems;
    }

    function getRegularClasses(classRows) {
        const regular = (classRows || []).filter((c) => !c.isSmallClass);
        return regular.length >= 2 ? regular : (classRows || []);
    }

    function buildClassRows(mySchoolRows, subject, threshold, gradeProfile = getGradeAnalysisProfile(), customSubjects = null) {
        const byClass = new Map();
        (mySchoolRows || []).forEach((r) => {
            const cls = String(r?.class || '未分班').trim() || '未分班';
            if (!byClass.has(cls)) byClass.set(cls, []);
            byClass.get(cls).push(r);
        });
        const items = Array.from(byClass.entries()).map(([cls, list]) => {
            const b3 = (!subject || subject === '总分') ? computeBottom3ForStudents(list, customSubjects) : null;
            return {
                name: cls,
                ...calcGroupMetrics(list, subject, threshold, customSubjects),
                bottom3Avg: b3 ? b3.avg : 0,
                bottom3ValidN: b3 ? b3.validCount : 0
            };
        });
        annotateSmallClasses(items);
        applyAuthenticTwoRateScoring(items, gradeProfile);
        const maxB3 = Math.max(...items.map((x) => x.bottom3Avg || 0), 0);
        items.forEach((x) => {
            x.scoreBottom = maxB3 > 0 ? Number(((x.bottom3Avg / maxB3) * 40).toFixed(2)) : 0;
        });
        const rAvg = assignRanks(items, 'avg');
        const rExc = assignRanks(items, 'excRate');
        const rPass = assignRanks(items, 'passRate');
        const rScore = assignRanks(items, 'score');
        return items.map((item) => ({
            ...item,
            avgRank: rAvg.get(item),
            excRank: rExc.get(item),
            passRank: rPass.get(item),
            scoreRank: rScore.get(item)
        })).sort((a, b) => a.scoreRank - b.scoreRank || a.name.localeCompare(b.name, 'zh-Hans-CN'));
    }

    function buildClassTownshipBenchmark(allRows, mySchool, subject, threshold, gradeProfile = getGradeAnalysisProfile()) {
        const externalBySchool = new Map();
        const ownByClass = new Map();
        (allRows || []).forEach((r) => {
            const sch = String(r?.school || '').trim() || '未知学校';
            if (sameSchool(sch, mySchool)) {
                const cls = String(r?.class || '未分班').trim() || '未分班';
                if (!ownByClass.has(cls)) ownByClass.set(cls, []);
                ownByClass.get(cls).push(r);
            } else {
                if (!externalBySchool.has(sch)) externalBySchool.set(sch, []);
                externalBySchool.get(sch).push(r);
            }
        });
        const externalRows = Array.from(externalBySchool.entries()).map(([name, list]) => ({
            name,
            kind: 'external',
            ...calcGroupMetrics(list, subject, threshold)
        }));
        const ownClassRows = Array.from(ownByClass.entries()).map(([name, list]) => ({
            name,
            kind: 'own-class',
            ...calcGroupMetrics(list, subject, threshold)
        }));
        annotateSmallClasses(ownClassRows);
        const combinedPool = [...ownClassRows, ...externalRows];
        applyAuthenticTwoRateScoring(combinedPool, gradeProfile);

        const rankAgainstExternal = (val, key) => 1 + externalRows.filter((ext) => Number(ext[key]) > Number(val)).length;
        const extAvgRank = assignRanks(externalRows, 'avg');
        const extExcRank = assignRanks(externalRows, 'excRate');
        const extPassRank = assignRanks(externalRows, 'passRate');
        const extScoreRank = assignRanks(externalRows, 'score');

        const decoratedExternal = externalRows.map((row) => ({
            ...row,
            avgRank: extAvgRank.get(row),
            excRank: extExcRank.get(row),
            passRank: extPassRank.get(row),
            scoreRank: extScoreRank.get(row)
        }));
        const decoratedOwn = ownClassRows.map((row) => ({
            ...row,
            avgRank: rankAgainstExternal(row.avg, 'avg'),
            excRank: rankAgainstExternal(row.excRate, 'excRate'),
            passRank: rankAgainstExternal(row.passRate, 'passRate'),
            scoreRank: rankAgainstExternal(row.score, 'score')
        }));
        return [...decoratedOwn, ...decoratedExternal].sort((a, b) => Number(b.score) - Number(a.score));
    }

    function getSystemIndicatorMap() {
        const map = new Map();
        let rows = Array.isArray(root.__LAST_INDICATOR_CALC_DATA__) && root.__LAST_INDICATOR_CALC_DATA__.length
            ? root.__LAST_INDICATOR_CALC_DATA__
            : (Array.isArray(root.INDICATOR_LAST_RESULT) ? root.INDICATOR_LAST_RESULT : []);
        if (!rows.length && typeof root.calcIndicators === 'function') {
            try {
                const res = root.calcIndicators(true);
                if (Array.isArray(res)) rows = res;
            } catch (_) {}
        }
        (rows || []).forEach((r) => {
            const name = String(r?.name || '').trim();
            if (!name) return;
            map.set(name, {
                t1: r.t1 || 0,
                r1: r.r1 || 0,
                score1: Number(Number(r.score1 || 0).toFixed(2)),
                t2: r.t2 || 0,
                r2: r.r2 || 0,
                score2: Number(Number(r.score2 || 0).toFixed(2)),
                finalScore: Number(Number(r.finalScore || 0).toFixed(2)),
                rank: r.rank || ''
            });
        });
        return map;
    }

    function buildTownshipSchoolMatrix(allRows, mySchool, subjects, thresholdsMap, gradeProfile = getGradeAnalysisProfile()) {
        syncSystemEngines();
        const bySchool = new Map();
        (allRows || []).forEach((r) => {
            const sch = String(r?.school || '').trim() || '未知学校';
            if (!bySchool.has(sch)) bySchool.set(sch, []);
            bySchool.get(sch).push(r);
        });
        const allKeys = ['总分', ...(subjects || [])];
        const townOverall = {};
        allKeys.forEach((k) => {
            townOverall[k] = calcGroupMetrics(allRows, k, thresholdsMap?.[k]);
        });

        const perKeyRanking = {};
        allKeys.forEach((k) => {
            const list = Array.from(bySchool.entries()).map(([name, rows]) => {
                const base = calcGroupMetrics(rows, k, thresholdsMap?.[k]);
                const sysSchool = root.SCHOOLS?.[name];
                const sysKey = k === '总分' ? 'total' : k;
                const sysMetric = sysSchool?.metrics?.[sysKey];
                if (sysMetric && Number(sysMetric.count) > 0) {
                    base.count = Number(sysMetric.count);
                    base.avg = Number(Number(sysMetric.avg || 0).toFixed(2));
                    base.excRate = Number(((Number(sysMetric.excRate) || 0) * 100).toFixed(1));
                    base.passRate = Number(((Number(sysMetric.passRate) || 0) * 100).toFixed(1));
                }
                return { name, isOwn: sameSchool(name, mySchool), students: rows, ...base };
            });
            applyAuthenticTwoRateScoring(list, gradeProfile);
            if (k === '总分') {
                list.forEach((item) => {
                    const sysSchool = root.SCHOOLS?.[item.name];
                    if (sysSchool && Number.isFinite(Number(sysSchool.score2Rate)) && Number(sysSchool.score2Rate) > 0) {
                        item.score2Rate = Number(Number(sysSchool.score2Rate).toFixed(2));
                        item.score = item.score2Rate;
                    }
                });
            }
            const rAvg = assignRanks(list, 'avg');
            const rExc = assignRanks(list, 'excRate');
            const rPass = assignRanks(list, 'passRate');
            const rScore = assignRanks(list, 'score');
            const ranked = list.map((item) => ({
                ...item,
                avgRank: rAvg.get(item),
                excRank: rExc.get(item),
                passRank: rPass.get(item),
                scoreRank: rScore.get(item)
            })).sort((a, b) => a.scoreRank - b.scoreRank || b.avg - a.avg);
            perKeyRanking[k] = ranked;
        });

        const totalList = perKeyRanking['总分'] || [];
        const indicatorMap = gradeProfile.grade === '9' ? getSystemIndicatorMap() : new Map();

        totalList.forEach((item) => {
            const sysSchool = root.SCHOOLS?.[item.name];
            const b3 = sysSchool?.bottom3 && Number.isFinite(Number(sysSchool.bottom3.avg))
                ? { totalN: sysSchool.bottom3.totalN, bottomN: sysSchool.bottom3.bottomN, excN: sysSchool.bottom3.excN, avg: Number(Number(sysSchool.bottom3.avg).toFixed(2)) }
                : computeBottom3ForStudents(item.students);
            item.bottom3 = b3;
            const highCount = (item.students || []).filter((s) => Number(s?.total) >= 490).length;
            item.highCount490 = highCount;
            item.highRate490 = item.count ? highCount / item.count : 0;
            item.highRate490Pct = Number((item.highRate490 * 100).toFixed(1));
        });

        const maxBottomAvg = Math.max(...totalList.map((x) => x.bottom3?.avg || 0), 0);
        const maxHighRate = Math.max(...totalList.map((x) => x.highRate490 || 0), 0);

        totalList.forEach((item) => {
            const sysSchool = root.SCHOOLS?.[item.name];
            item.scoreBottom = (sysSchool && Number.isFinite(Number(sysSchool.scoreBottom)) && Number(sysSchool.scoreBottom) > 0)
                ? Number(Number(sysSchool.scoreBottom).toFixed(2))
                : (maxBottomAvg > 0 ? Number((((item.bottom3?.avg || 0) / maxBottomAvg) * 40).toFixed(2)) : 0);

            if (gradeProfile.grade === '9') {
                item.scoreHigh490 = maxHighRate > 0 ? Number(((item.highRate490 / maxHighRate) * 50).toFixed(2)) : 0;
                const ind = indicatorMap.get(item.name) || null;
                item.indicatorInfo = ind;
                item.scoreIndicator = ind ? ind.finalScore : Number(sysSchool?.scoreInd || 0);
                item.comprehensiveTotal = Number((item.score2Rate + item.scoreBottom + item.scoreHigh490 + item.scoreIndicator).toFixed(2));
            } else {
                item.scoreHigh490 = 0;
                item.indicatorInfo = null;
                item.scoreIndicator = 0;
                item.comprehensiveTotal = Number((item.score2Rate + item.scoreBottom).toFixed(2));
            }
        });

        const rBottom = assignRanks(totalList, 'scoreBottom');
        const rHigh = assignRanks(totalList, 'scoreHigh490');
        const rComp = assignRanks(totalList, 'comprehensiveTotal');
        totalList.forEach((item) => {
            item.rankBottom = rBottom.get(item);
            item.rankHigh490 = rHigh.get(item);
            item.comprehensiveRank = rComp.get(item);
        });

        // Compute Major Subject snapshot ONLY when distinct from official subjects
        const majorSubjects = (gradeProfile.majorSubjects || []).filter((s) => (subjects || []).includes(s));
        const hasDistinctMajor = gradeProfile.grade !== '9' && majorSubjects.length > 0 && majorSubjects.length < (subjects || []).length;
        let majorSchoolRows = [];
        if (hasDistinctMajor) {
            const majorTh = computeThresholdForSubject(allRows, '主科总', majorSubjects);
            majorSchoolRows = Array.from(bySchool.entries()).map(([name, rows]) => {
                const m = calcGroupMetrics(rows, '主科总', majorTh, majorSubjects);
                const b3 = computeBottom3ForStudents(rows, majorSubjects);
                return { name, isOwn: sameSchool(name, mySchool), ...m, bottom3Avg: b3.avg };
            });
            applyAuthenticTwoRateScoring(majorSchoolRows, gradeProfile);
            const maxMB3 = Math.max(...majorSchoolRows.map((x) => x.bottom3Avg || 0), 0);
            majorSchoolRows.forEach((x) => {
                x.scoreBottom = maxMB3 > 0 ? Number(((x.bottom3Avg / maxMB3) * 40).toFixed(2)) : 0;
                x.comprehensiveTotal = Number((x.score2Rate + x.scoreBottom).toFixed(2));
            });
            const rM2 = assignRanks(majorSchoolRows, 'score2Rate');
            const rMC = assignRanks(majorSchoolRows, 'comprehensiveTotal');
            majorSchoolRows.forEach((x) => {
                x.rank2Rate = rM2.get(x);
                x.comprehensiveRank = rMC.get(x);
            });
            majorSchoolRows.sort((a, b) => a.comprehensiveRank - b.comprehensiveRank);
        }

        const totalSchools = bySchool.size;
        const totalBoard = totalList.slice().sort((a, b) => a.comprehensiveRank - b.comprehensiveRank || a.scoreRank - b.scoreRank);
        const ownIdx = totalBoard.findIndex((s) => s.isOwn);
        const ownTotal = ownIdx >= 0 ? totalBoard[ownIdx] : (totalBoard[0] || null);
        const leaderSchool = totalBoard[0] || null;
        const targetAhead = ownIdx > 0 ? totalBoard[ownIdx - 1] : null;
        const schoolMatrixRows = totalBoard.map((sch) => {
            const subjectRanks = {};
            (subjects || []).forEach((subj) => {
                const found = (perKeyRanking[subj] || []).find((x) => x.name === sch.name);
                subjectRanks[subj] = found ? { avg: found.avg, rank: found.scoreRank, avgRank: found.avgRank, excRate: found.excRate, passRate: found.passRate, score2Rate: found.score2Rate } : null;
            });
            const majorMatch = majorSchoolRows.find((m) => m.name === sch.name) || null;
            return { ...sch, subjectRanks, majorMatch };
        });

        return {
            gradeProfile,
            totalSchools,
            hasTownship: totalSchools > 1,
            townOverall,
            perKeyRanking,
            schoolMatrixRows,
            majorSchoolRows,
            majorSubjects,
            ownTotal,
            leaderSchool,
            targetAhead,
            gapToTownAvg: ownTotal ? Number((ownTotal.avg - townOverall['总分'].avg).toFixed(2)) : 0,
            gapToLeader: (ownTotal && leaderSchool) ? Number((leaderSchool.avg - ownTotal.avg).toFixed(2)) : 0,
            gapToAhead: (ownTotal && targetAhead) ? Number((targetAhead.avg - ownTotal.avg).toFixed(2)) : 0,
            compGapToAhead: (ownTotal && targetAhead) ? Number((targetAhead.comprehensiveTotal - ownTotal.comprehensiveTotal).toFixed(2)) : 0
        };
    }

    function buildSubjectDiagnosis(townMatrix, mySchoolRows, subjects, thresholdsMap, gradeProfile = getGradeAnalysisProfile(), displayOnlySubjects = []) {
        const totalSchools = Math.max(1, townMatrix.totalSchools || 1);
        const majorSet = new Set(gradeProfile.majorSubjects || []);
        const displaySet = new Set(displayOnlySubjects || []);
        return (subjects || []).map((subj) => {
            const ranking = townMatrix.perKeyRanking?.[subj] || [];
            const own = ranking.find((s) => s.isOwn) || calcGroupMetrics(mySchoolRows, subj, thresholdsMap?.[subj]);
            const town = townMatrix.townOverall?.[subj] || own;
            const rank = Number(own.scoreRank || 1);
            const avgDiff = Number(((own.avg || 0) - (town.avg || 0)).toFixed(2));
            const excDiff = Number(((own.excRate || 0) - (town.excRate || 0)).toFixed(1));
            const passDiff = Number(((own.passRate || 0) - (town.passRate || 0)).toFixed(1));
            const allClassRows = buildClassRows(mySchoolRows, subj, thresholdsMap?.[subj], gradeProfile);
            const regularClassRows = getRegularClasses(allClassRows);
            const sortedByAvg = regularClassRows.slice().sort((a, b) => b.avg - a.avg);
            const classSpread = sortedByAvg.length >= 2
                ? Number((sortedByAvg[0].avg - sortedByAvg[sortedByAvg.length - 1].avg).toFixed(1))
                : 0;
            const topClass = sortedByAvg[0] || null;
            const weakClass = sortedByAvg.length >= 2 ? sortedByAvg[sortedByAvg.length - 1] : null;
            const isDisplayOnly = displaySet.has(subj) || (gradeProfile.grade === '9' && subj === '政治');
            const isMajor = majorSet.has(subj);
            const roleLabel = isDisplayOnly
                ? (gradeProfile.grade === '9' && subj === '政治' ? '二模参考' : '展示对比')
                : (isMajor ? '核心主科' : '考核科目');

            let tier = '稳健保持';
            let issueType = '均衡';
            let measure = '保持现有教学节奏，依托集体备课固化优势，冲刺全镇更高位次。';
            if (townMatrix.hasTownship && rank <= Math.max(1, Math.ceil(totalSchools * 0.3)) && avgDiff >= 0) {
                tier = '优势领跑';
                issueType = '标杆';
                measure = '总结备课组有效做法并在校内推广，进一步扩大高分段领先优势。';
            } else if (townMatrix.hasTownship && (rank > Math.ceil(totalSchools * 0.6) || avgDiff < -2)) {
                tier = '重点短板';
                if (excDiff >= 0 && passDiff < -3) {
                    issueType = '两极分化';
                    measure = '及格率低于镇均，立即启动后1/3基础过关周测与分层作业，先守住及格底盘。';
                } else if (passDiff >= 0 && excDiff < -3) {
                    issueType = '拔尖不足';
                    measure = '底盘尚可但高分偏少，建议增设压轴题微专题与尖子生面批，拉升优秀率。';
                } else {
                    issueType = '整体偏弱';
                    measure = '均分与两率均落后镇均，建议教务下沉听课，梳理高频失分点并统一堂清节奏。';
                }
            } else if (excDiff < -2.5) {
                tier = '冲优潜力';
                issueType = '高分偏弱';
                measure = '盯紧优秀边缘生，强化中档题准确率与综合题规范作答。';
            } else if (passDiff < -2.5) {
                tier = '保底预警';
                issueType = '及格偏弱';
                measure = '盯紧及格边缘生，落实核心概念默写与基础题每日清零。';
            }
            if (gradeProfile.grade === '8' && gradeProfile.hasGeoBio && (subj === '地理' || subj === '生物')) {
                measure += '（地生会考科：实行识图与必考题逐人过关）';
            } else if (gradeProfile.grade === '8' && (subj === '物理' || subj === '化学')) {
                measure += '（理科防分化：狠抓实验建模与中档计算规范）';
            } else if ((gradeProfile.grade === '6' || gradeProfile.grade === '7') && isMajor) {
                measure += `（${gradeProfile.grade}年级核心主科：坚持每日基础微训练，防早发掉队）`;
            }
            if (classSpread >= 8 && weakClass) {
                measure += `（常规班极差 ${classSpread} 分，帮扶 ${weakClass.name}）`;
            }

            return {
                subject: subj,
                roleLabel,
                isDisplayOnly,
                isMajor,
                ownAvg: own.avg || 0,
                townAvg: town.avg || 0,
                avgDiff,
                ownExc: own.excRate || 0,
                townExc: town.excRate || 0,
                excDiff,
                ownPass: own.passRate || 0,
                townPass: town.passRate || 0,
                passDiff,
                score2Rate: own.score2Rate || own.score || 0,
                rank,
                totalSchools,
                classSpread,
                topClass: topClass?.name || '',
                weakClass: weakClass?.name || '',
                tier,
                issueType,
                measure
            };
        });
    }

    function buildActionPlan(townMatrix, subjectDiag, classRows, totalBorderline, overall, gradeProfile = getGradeAnalysisProfile()) {
        const actions = [];
        const own = townMatrix.ownTotal;
        const g = gradeProfile.grade;
        const regClasses = getRegularClasses(classRows);
        const smallClasses = (classRows || []).filter((c) => c.isSmallClass);

        if (townMatrix.hasTownship && own) {
            const strongList = subjectDiag.filter((d) => d.tier === '优势领跑').map((d) => d.subject);
            const weakList = subjectDiag.filter((d) => d.tier === '重点短板' || d.tier === '保底预警' || d.tier === '冲优潜力').map((d) => d.subject);
            const chaseText = townMatrix.targetAhead
                ? `锚定前一名「${townMatrix.targetAhead.name}」（综合差 ${townMatrix.compGapToAhead} 分，均分差 ${townMatrix.gapToAhead} 分）为直接追赶目标`
                : '当前稳居全镇第一，下阶段目标为巩固领先身位并扩大优势';
            const ownMajor = townMatrix.majorSchoolRows?.find((m) => m.isOwn);
            const modeSpecificStep = g === '9'
                ? `九年级四维拆解：两率一分 ${own.score2Rate} 分、后1/3得分 ${own.scoreBottom} 分（第${own.rankBottom}名）、490+高分 ${own.highCount490} 人（赋${own.scoreHigh490}分）、指标生 ${own.scoreIndicator} 分。`
                : (ownMajor
                    ? `双口径对标：全科综合第 ${own.comprehensiveRank} 名（${own.comprehensiveTotal} 分），${gradeProfile.majorLabel}口径第 ${ownMajor.comprehensiveRank} 名（均分 ${ownMajor.avg}），后1/3托底 ${own.scoreBottom} 分（第 ${own.rankBottom} 名）。`
                    : `综合结构拆解：两率一分 ${own.score2Rate} 分（全镇第 ${own.scoreRank} 名）+ 后1/3有效分 ${own.scoreBottom} 分（均分 ${own.bottom3?.avg || 0}，第 ${own.rankBottom} 名），两项协同发力。`);
            actions.push({
                dimension: `${gradeProfile.actionThemes[0]}`,
                owner: '校长室 / 教导处',
                priority: '核心方向',
                summary: `按${gradeProfile.shortTag}核算，本校综合总分 ${own.comprehensiveTotal} 分，居全镇第 ${own.comprehensiveRank}/${townMatrix.totalSchools} 名（较镇均 ${townMatrix.gapToTownAvg >= 0 ? '+' : ''}${townMatrix.gapToTownAvg} 分），${chaseText}。`,
                steps: [
                    modeSpecificStep,
                    `强弱协同：巩固优势科（${strongList.join('、') || '前列学科'}）；将（${weakList.join('、') || '相对薄弱学科'}）列为重点提质学科，每周开展 1 次专项教研会诊。`
                ]
            });
        } else {
            actions.push({
                dimension: `${gradeProfile.actionThemes[0]}`,
                owner: '教导处 / 级部',
                priority: '核心方向',
                summary: `当前启用【${gradeProfile.name}】，参评 ${overall.count} 人，均分 ${overall.avg}，优秀率 ${overall.excRate}%，及格率 ${overall.passRate}%。`,
                steps: [`考核口径：${gradeProfile.formulaDesc}。`, `战略重心：${gradeProfile.pedagogyFocus}。`]
            });
        }

        const prioritySubjs = subjectDiag.slice().sort((a, b) => a.rank - b.rank ? b.rank - a.rank : a.avgDiff - b.avgDiff).slice(0, 3);
        const gradeSubjectNote = g === '9'
            ? '九年级聚焦五科总分协同，强化压轴题与规范答题；政治按二模参考单科诊断到人。'
            : (g === '8'
                ? (gradeProfile.hasGeoBio
                    ? '八年级一手抓主科防分化，一手抓地理/生物小中考会考过关冲A。'
                    : '八年级聚焦语数英物化五科均衡，重点防范理科中档题失分与腰部断层。')
                : `${g}年级聚焦语数英三科核心底盘，严防数学/英语早发两极分化。`);
        actions.push({
            dimension: `${gradeProfile.actionThemes[1]}`,
            owner: '各学科备课组长',
            priority: '教学重点',
            summary: prioritySubjs.length
                ? `${gradeSubjectNote} 优先攻坚 ${prioritySubjs.map((s) => `${s.subject}(全镇#${s.rank}·${s.tier})`).join('、')}。`
                : gradeSubjectNote,
            steps: prioritySubjs.map((s) => `${s.subject}［${s.roleLabel}·${s.issueType}］：${s.measure}`)
        });

        const maxSpreadSubj = subjectDiag.slice().sort((a, b) => b.classSpread - a.classSpread)[0];
        const sortedReg = regClasses.slice().sort((a, b) => b.avg - a.avg);
        const leadCls = sortedReg[0];
        const lagCls = sortedReg.length >= 2 ? sortedReg[sortedReg.length - 1] : null;
        const smallNote = smallClasses.length ? `（另含小样本班 ${smallClasses.map((c) => `${c.name}[${c.count}人]`).join('、')} 单独跟进，不计入常规极差）` : '';
        actions.push({
            dimension: `${gradeProfile.actionThemes[2]}`,
            owner: '级部主任 / 班主任',
            priority: '管理抓手',
            summary: (leadCls && lagCls)
                ? `常规行政班中，${leadCls.name} 领跑（均分 ${leadCls.avg}），${lagCls.name} 相对靠后（均分 ${lagCls.avg}，常规班极差 ${(leadCls.avg - lagCls.avg).toFixed(1)} 分，后1/3均分 ${lagCls.bottom3Avg || 0}）${smallNote}。`
                : '推进班级日常常规与课堂效率均衡发展。',
            steps: [
                maxSpreadSubj && maxSpreadSubj.classSpread > 0
                    ? `消除学科极差：${maxSpreadSubj.subject} 常规班极差最大（${maxSpreadSubj.classSpread} 分），组织 ${maxSpreadSubj.topClass} 与 ${maxSpreadSubj.weakClass} 开展共案备课与同课异构。`
                    : '保持各班教学进度与作业难度同步，防止中后期拉大差距。',
                lagCls ? `薄弱班包保：级部下沉 ${lagCls.name} 推门听课，紧盯后1/3学生（有效均分 ${lagCls.bottom3Avg || 0} 分）课堂专注度与作业订正闭环。` : '持续落实班主任与任课教师周会商机制。'
            ]
        });

        const n = Math.max(1, overall.count || 1);
        const excGain = Number(((totalBorderline.excMarginal.length / n) * 100).toFixed(1));
        const passGain = Number(((totalBorderline.passMarginal.length / n) * 100).toFixed(1));
        const topGoalStep = g === '9'
            ? `490+尖子与指标生包保：本校当前 ≥490 分 ${own ? own.highCount490 : 0} 人，依托「育苗包保档案」为前 30 名指派导师，按标准分消灭偏科短板。`
            : `尖子生标准分诊断包保：依托「育苗包保档案」锁定年级前 30 名，按学科标准分（T值）精准识别相对弱科，导师一对一面批。`;
        actions.push({
            dimension: `${gradeProfile.actionThemes[3]}`,
            owner: '全体任课教师 / 包保导师',
            priority: '提分抓手',
            summary: `若成功转化 ${totalBorderline.excMarginal.length} 名优秀边缘生、${totalBorderline.passMarginal.length} 名及格边缘生，优秀率最高可提 +${excGain}%、及格率最高可提 +${passGain}%，同步拉升后1/3有效分。`,
            steps: [
                `临界生包保到师：按「一师一策画像表」将优秀边缘（${totalBorderline.excMarginal.length}人）与及格边缘（${totalBorderline.passMarginal.length}人）分解到任课教师，每周面批 1 次错题。`,
                topGoalStep
            ]
        });

        return { actions, excGain, passGain };
    }

    function formatActionPlanCopyText(examTitle, mySchool, actionPlan, gradeProfile = getGradeAnalysisProfile()) {
        const lines = [
            `【${examTitle} · ${mySchool} 质量分析方向与整改措施】`,
            `适用模式：${gradeProfile.name}（${gradeProfile.formulaDesc}）`
        ];
        (actionPlan?.actions || []).forEach((item, idx) => {
            lines.push(`\n${idx + 1}. ${item.dimension}（责任人：${item.owner}）`);
            lines.push(`   研判：${item.summary}`);
            (item.steps || []).forEach((st) => lines.push(`   - ${st}`));
        });
        return lines.join('\n');
    }

    function resolveTeacherLookup(teacherMap) {
        const map = teacherMap && typeof teacherMap === 'object' ? teacherMap : {};
        const lookup = new Map();
        Object.entries(map).forEach(([key, teacherName]) => {
            const parts = String(key || '').split('_');
            if (parts.length < 2) return;
            const rawCls = String(parts[0] || '').trim();
            const subj = parts.slice(1).join('_').trim();
            const teacher = String(teacherName || '').trim();
            if (!rawCls || !subj || !teacher) return;
            lookup.set(`${rawCls}::${subj}`, teacher);
            lookup.set(`${normClass(rawCls)}::${subj}`, teacher);
        });
        return {
            get(cls, subj) {
                return lookup.get(`${cls}::${subj}`) || lookup.get(`${normClass(cls)}::${subj}`) || '';
            }
        };
    }

    function buildTeacherHandbookRows(mySchoolRows, subjects, teacherMap, thresholdsMap, allRows = [], gradeProfile = getGradeAnalysisProfile()) {
        syncSystemEngines();
        const map = teacherMap && typeof teacherMap === 'object' ? teacherMap : {};
        const byClass = new Map();
        const normToDisplayClass = new Map();
        (mySchoolRows || []).forEach((r) => {
            const cls = String(r?.class || '').trim();
            if (!cls) return;
            const nCls = normClass(cls);
            if (!byClass.has(nCls)) {
                byClass.set(nCls, []);
                normToDisplayClass.set(nCls, cls);
            }
            byClass.get(nCls).push(r);
        });
        const grouped = new Map();
        Object.entries(map).forEach(([key, teacherName]) => {
            const parts = String(key || '').split('_');
            if (parts.length < 2) return;
            const nCls = normClass(parts[0]);
            const subj = parts.slice(1).join('_').trim();
            const teacher = String(teacherName || '').trim();
            if (!nCls || !subj || !teacher || !byClass.has(nCls)) return;
            if (subjects && subjects.length && !subjects.includes(subj)) return;
            const dispCls = normToDisplayClass.get(nCls) || parts[0];
            const gKey = `${subj}::${teacher}`;
            if (!grouped.has(gKey)) grouped.set(gKey, { teacher, subject: subj, classes: [], students: [], classMetrics: [] });
            const entry = grouped.get(gKey);
            if (!entry.classes.includes(dispCls)) {
                const clsStudents = byClass.get(nCls);
                entry.classes.push(dispCls);
                entry.students.push(...clsStudents);
                entry.classMetrics.push({ className: dispCls, ...calcGroupMetrics(clsStudents, subj, thresholdsMap?.[subj]) });
            }
        });

        const mySchool = getMySchoolName(mySchoolRows.length ? mySchoolRows : allRows);
        const externalSchoolsBySubj = new Map();
        (subjects || []).forEach((subj) => {
            const extMap = new Map();
            (allRows || []).forEach((r) => {
                const sch = String(r?.school || '').trim();
                if (!sch || sameSchool(sch, mySchool)) return;
                if (!extMap.has(sch)) extMap.set(sch, []);
                extMap.get(sch).push(r);
            });
            const extMetrics = Array.from(extMap.entries()).map(([name, list]) => ({
                name,
                ...calcGroupMetrics(list, subj, thresholdsMap?.[subj])
            }));
            externalSchoolsBySubj.set(subj, extMetrics);
        });

        const rows = Array.from(grouped.values()).map((entry) => {
            const threshold = thresholdsMap?.[entry.subject] || { exc: 0, pass: 0 };
            const metrics = calcGroupMetrics(entry.students, entry.subject, threshold);
            const schoolSubj = calcGroupMetrics(mySchoolRows, entry.subject, threshold);
            const townSubj = allRows.length ? calcGroupMetrics(allRows, entry.subject, threshold) : schoolSubj;
            const extList = externalSchoolsBySubj.get(entry.subject) || [];
            const sysStat = root.TEACHER_STATS?.[entry.teacher]?.[entry.subject] || null;
            const sysTown = root.TEACHER_TOWNSHIP_RANKINGS?.[entry.teacher]?.[entry.subject] || null;

            const clsAvgs = entry.classMetrics.map((c) => c.avg);
            const classSpread = clsAvgs.length >= 2 ? Number((Math.max(...clsAvgs) - Math.min(...clsAvgs)).toFixed(1)) : 0;
            const border = buildBorderlineChips(entry.students, entry.subject, threshold);
            const n = Math.max(1, metrics.count);
            const excLift = Number(((border.excMarginal.length / n) * 100).toFixed(1));
            const passLift = Number(((border.passMarginal.length / n) * 100).toFixed(1));

            // Never show ugly "转优 0/0 · 转及格 0/0 · 脱低 0/0" when there is no baseline match
            const rawConv = String(sysStat?.conversionSummary || '').trim();
            const hasRealConv = rawConv && !/0\/0\s*·\s*转及格\s*0\/0/.test(rawConv);
            const conversionSummary = hasRealConv
                ? rawConv
                : `待转优 ${border.excMarginal.length}人 · 待及格 ${border.passMarginal.length}人`;

            const hasBaseline = sysStat && Number(sysStat.baselineMatchedCount || 0) > 0 && Number.isFinite(Number(sysStat.baselineAdjustment));

            return {
                teacher: entry.teacher,
                subject: entry.subject,
                classes: entry.classes.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')),
                ...metrics,
                diffVsSchoolAvg: Number((metrics.avg - schoolSubj.avg).toFixed(2)),
                diffVsTownAvg: Number((metrics.avg - townSubj.avg).toFixed(2)),
                extList,
                sysTown,
                townSchoolTotal: extList.length + 1,
                classSpread,
                excMarginal: border.excMarginal,
                passMarginal: border.passMarginal,
                excLift,
                passLift,
                fairScore: sysStat && Number.isFinite(Number(sysStat.fairScore)) ? Number(Number(sysStat.fairScore).toFixed(1)) : null,
                fairRank: sysStat?.fairRank || null,
                baselineAdjustment: hasBaseline ? Number(Number(sysStat.baselineAdjustment).toFixed(1)) : null,
                conversionSummary
            };
        });

        const bySubject = new Map();
        rows.forEach((r) => {
            if (!bySubject.has(r.subject)) bySubject.set(r.subject, []);
            bySubject.get(r.subject).push(r);
        });
        const ranked = [];
        bySubject.forEach((list) => {
            const extList = (list[0]?.extList || []).map((e) => ({ ...e }));
            applyAuthenticTwoRateScoring([...list, ...extList], gradeProfile);
            const rAvg = assignRanks(list, 'avg');
            const rExc = assignRanks(list, 'excRate');
            const rPass = assignRanks(list, 'passRate');
            const rScore = assignRanks(list, 'score');
            list.forEach((item) => {
                const scoreRank = rScore.get(item);
                const townRank = extList.length ? 1 + extList.filter((e) => e.score > item.score).length : 1;
                const townAvgRank = item.sysTown?.rankAvg || (extList.length ? 1 + extList.filter((e) => e.avg > item.avg).length : 1);
                const townExcRank = item.sysTown?.rankExc || (extList.length ? 1 + extList.filter((e) => e.excRate > item.excRate).length : 1);
                const townPassRank = item.sysTown?.rankPass || (extList.length ? 1 + extList.filter((e) => e.passRate > item.passRate).length : 1);

                let profileTag = '稳健均衡';
                let advice = '保持教学节奏，结合临界生名单开展针对性面批。';
                if (scoreRank === 1 && item.diffVsTownAvg >= 0) {
                    profileTag = '学科标杆';
                    advice = `校内第1（全镇同台第${townRank}，两率一分 ${item.score}），建议在备课组分享课堂抓手，冲刺更高优秀率。`;
                } else if (item.excRate < 12 && item.passRate >= 55) {
                    profileTag = '底盘稳·待拔尖';
                    advice = `及格率稳健但高分偏少，重点面批名下 ${item.excMarginal.length} 名优秀边缘生（可提优率 +${item.excLift}%）。`;
                } else if (item.passRate < 50 || item.diffVsSchoolAvg < -2) {
                    profileTag = '重点帮扶';
                    advice = `先抓基础过关与堂清，紧盯名下 ${item.passMarginal.length} 名及格边缘生（可提及格率 +${item.passLift}%）。`;
                }
                if (item.baselineAdjustment !== null && item.baselineAdjustment >= 2) {
                    profileTag += '·增值显著';
                } else if (item.baselineAdjustment !== null && item.baselineAdjustment <= -3) {
                    advice += ` 历史基线增值偏低（${item.baselineAdjustment}），需排查掉队学生。`;
                }
                if (item.classSpread >= 6) {
                    advice += ` 所教班级间均分极差 ${item.classSpread} 分，需平衡两班课堂落实。`;
                }
                delete item.extList;
                delete item.sysTown;
                ranked.push({
                    ...item,
                    townRank,
                    townAvgRank,
                    townExcRank,
                    townPassRank,
                    avgRank: rAvg.get(item),
                    excRank: rExc.get(item),
                    passRank: rPass.get(item),
                    scoreRank,
                    profileTag,
                    advice
                });
            });
        });
        return ranked.sort((a, b) => {
            const sCmp = (subjects || []).indexOf(a.subject) - (subjects || []).indexOf(b.subject);
            return sCmp !== 0 ? sCmp : a.scoreRank - b.scoreRank;
        });
    }

    function buildTeacherTownshipBenchmark(allRows, mySchool, subject, subjTeachers, threshold, gradeProfile = getGradeAnalysisProfile()) {
        const extMap = new Map();
        (allRows || []).forEach((r) => {
            const sch = String(r?.school || '').trim();
            if (!sch || sameSchool(sch, mySchool)) return;
            if (!extMap.has(sch)) extMap.set(sch, []);
            extMap.get(sch).push(r);
        });
        const externalRows = Array.from(extMap.entries()).map(([name, list]) => ({
            name,
            kind: 'external',
            ...calcGroupMetrics(list, subject, threshold)
        }));
        const teacherEntries = (subjTeachers || []).map((t) => ({
            name: `${t.teacher}·${t.classes.join('/')}`,
            teacher: t.teacher,
            classesText: t.classes.join('、'),
            kind: 'own-teacher',
            count: t.count,
            avg: t.avg,
            excRate: t.excRate,
            passRate: t.passRate,
            score: t.score
        }));
        const combined = [...teacherEntries, ...externalRows];
        applyAuthenticTwoRateScoring(combined, gradeProfile);
        combined.sort((a, b) => Number(b.score) - Number(a.score));
        const rAvg = assignRanks(combined, 'avg');
        const rExc = assignRanks(combined, 'excRate');
        const rPass = assignRanks(combined, 'passRate');
        const rScore = assignRanks(combined, 'score');
        return combined.map((item) => ({
            ...item,
            avgRank: rAvg.get(item),
            excRank: rExc.get(item),
            passRank: rPass.get(item),
            scoreRank: rScore.get(item)
        }));
    }

    function buildBorderlineChips(mySchoolRows, subject, threshold, margin = DEFAULT_MARGIN) {
        const exc = Number(threshold?.exc || 0);
        const pass = Number(threshold?.pass || 0);
        const gap = Math.max(1, Number(margin) || DEFAULT_MARGIN);
        const excellent = [];
        const excMarginal = [];
        const passMarginal = [];
        (mySchoolRows || []).forEach((r) => {
            const val = getStudentScore(r, subject);
            if (!Number.isFinite(val)) return;
            const item = {
                name: String(r?.name || '未知').trim(),
                class: String(r?.class || '').trim(),
                school: String(r?.school || '').trim(),
                score: Number(val.toFixed(1)),
                gapToExc: Number((exc - val).toFixed(1)),
                gapToPass: Number((pass - val).toFixed(1))
            };
            if (val >= exc) excellent.push(item);
            else if (val >= exc - gap) excMarginal.push(item);
            if (val < pass && val >= pass - gap) passMarginal.push(item);
        });
        const byScoreDesc = (a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh-Hans-CN');
        excellent.sort(byScoreDesc);
        excMarginal.sort(byScoreDesc);
        passMarginal.sort(byScoreDesc);
        return { excellent, excMarginal, passMarginal, exc, pass, margin: gap };
    }

    function formatChipsCopyText(title, list) {
        if (!list || !list.length) return `${title}：无`;
        return `${title}（共${list.length}人）：` + list.map((s) => `${s.name}(${s.class} ${s.score})`).join('、');
    }

    function buildSmartDiagnostics(overall, classRows, subjectOverview, totalBorderline, townMatrix, gradeProfile = getGradeAnalysisProfile()) {
        const bullets = [];
        const own = townMatrix?.ownTotal;
        const townNote = (townMatrix && townMatrix.hasTownship && own)
            ? `，综合总分 ${own.comprehensiveTotal} 分（全镇第 ${own.comprehensiveRank}/${townMatrix.totalSchools} 名，两率一分 ${own.score2Rate}、后1/3得分 ${own.scoreBottom}${gradeProfile.grade === '9' ? `、490+高分赋 ${own.scoreHigh490}、指标生 ${own.scoreIndicator}` : ''}${townMatrix.targetAhead ? `，距「${townMatrix.targetAhead.name}」差 ${townMatrix.compGapToAhead} 分` : ''}）`
            : '';
        bullets.push(`【${gradeProfile.shortTag}】参评 ${overall.count} 人，均分 ${overall.avg}，优秀率 ${overall.excRate}%，及格率 ${overall.passRate}%${townNote}。`);

        if (gradeProfile.grade === '9' && own) {
            bullets.push(`【九年级专项】≥490 高分 ${own.highCount490} 人（高分率 ${own.highRate490Pct}%，全镇第 ${own.rankHigh490} 名）；有效后1/3均分 ${own.bottom3?.avg || 0} 分（第 ${own.rankBottom} 名）。`);
        } else if (gradeProfile.hasDistinctMajorCaliber && townMatrix?.majorSchoolRows?.length) {
            const ownMajor = townMatrix.majorSchoolRows.find((m) => m.isOwn);
            if (ownMajor) {
                bullets.push(`【主科双口径】${gradeProfile.majorLabel}均分 ${ownMajor.avg}，两率一分 ${ownMajor.score2Rate}，主科综合全镇第 ${ownMajor.comprehensiveRank}/${townMatrix.totalSchools} 名。`);
            }
        } else if (own) {
            bullets.push(`【后1/3托底】有效后1/3均分 ${own.bottom3?.avg || 0} 分，获 ${own.scoreBottom}/40 分（全镇第 ${own.rankBottom}/${townMatrix.totalSchools} 名），底盘${own.rankBottom <= 3 ? '稳健领跑' : '仍有提升空间'}。`);
        }

        const regClasses = getRegularClasses(classRows);
        if (regClasses.length >= 2) {
            const sortedReg = regClasses.slice().sort((a, b) => b.avg - a.avg);
            const top = sortedReg[0];
            const bottom = sortedReg[sortedReg.length - 1];
            const diff = (top.avg - bottom.avg).toFixed(1);
            const smallCnt = (classRows || []).filter((c) => c.isSmallClass).length;
            bullets.push(`【常规行政班】${top.name} 领跑（均分 ${top.avg}，两率一分 ${top.score}）；${bottom.name} 相对靠后（均分 ${bottom.avg}，常规班极差 ${diff} 分）${smallCnt ? `，另有 ${smallCnt} 个小样本班单列跟进` : ''}。`);
        }
        if (subjectOverview.length >= 2) {
            const bestRank = subjectOverview.slice().sort((a, b) => (a.rank || 99) - (b.rank || 99))[0];
            const lowPass = subjectOverview.slice().sort((a, b) => a.passRate - b.passRate)[0];
            bullets.push(`【学科与临界生】优势领先科为 ${bestRank.subject}（全镇第 ${bestRank.rank || 1}）；及格率最低为 ${lowPass.subject}（${lowPass.passRate}%）；总分优边 ${totalBorderline.excMarginal.length} 人、及边 ${totalBorderline.passMarginal.length} 人。`);
        }
        return bullets;
    }

    // -------------------------------------------------------------------------
    // Native OOXML Bar Chart Generator (ISO/IEC 29500 Strict XSD Sequence)
    // -------------------------------------------------------------------------
    function buildNativeBarChartXml(chartSpec) {
        const categories = Array.isArray(chartSpec?.categories) ? chartSpec.categories : [];
        const seriesList = Array.isArray(chartSpec?.series) ? chartSpec.series : [];
        const showLabels = seriesList.length <= 2 || categories.length <= 6;
        const serXml = seriesList.map((ser, sIdx) => {
            const color = ser.color || (sIdx === 0 ? '1D4ED8' : (sIdx === 1 ? '0EA5E9' : 'F59E0B'));
            const catPts = categories.map((cat, i) => `<c:pt idx="${i}"><c:v>${escXml(cat)}</c:v></c:pt>`).join('');
            const valPts = (ser.values || []).map((v, i) => `<c:pt idx="${i}"><c:v>${Number(v) || 0}</c:v></c:pt>`).join('');
            const dLblXml = showLabels
                ? '<c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>'
                : '';
            return `<c:ser><c:idx val="${sIdx}"/><c:order val="${sIdx}"/>
<c:tx><c:v>${escXml(ser.name || `系列${sIdx + 1}`)}</c:v></c:tx>
<c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr>
${dLblXml}
<c:cat><c:strLit><c:ptCount val="${categories.length}"/>${catPts}</c:strLit></c:cat>
<c:val><c:numLit><c:formatCode>General</c:formatCode><c:ptCount val="${categories.length}"/>${valPts}</c:numLit></c:val>
</c:ser>`;
        }).join('');
        const legendXml = seriesList.length > 1 ? '<c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend>' : '';
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:date1904 val="0"/>
<c:lang val="zh-CN"/>
<c:roundedCorners val="0"/>
<c:chart><c:autoTitleDeleted val="1"/>
<c:plotArea><c:layout/>
<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${serXml}<c:gapWidth val="120"/><c:overlap val="-15"/><c:axId val="110001"/><c:axId val="110002"/></c:barChart>
<c:catAx><c:axId val="110001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill></a:ln></c:spPr><c:crossAx val="110002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/></c:catAx>
<c:valAx><c:axId val="110002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr><c:crossAx val="110001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>
</c:plotArea>${legendXml}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>
<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="850"><a:solidFill><a:srgbClr val="475569"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:defRPr></a:pPr><a:endParaRPr lang="zh-CN"/></a:p></c:txPr>
</c:chartSpace>`;
    }

    function pptChartFrame(id, relId, x, y, cx, cy) {
        return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Chart ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>
<p:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></p:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="${relId}"/></a:graphicData></a:graphic></p:graphicFrame>`;
    }

    // -------------------------------------------------------------------------
    // Structured Deck Model (Zero-Truncation Compact Tables & Real-Subject Driven)
    // -------------------------------------------------------------------------
    function captureVisibleChartImages(maxCount = 2) {
        const doc = root.document;
        if (!doc) return [];
        const canvases = Array.from(doc.querySelectorAll('canvas'));
        const images = [];
        for (const canvas of canvases) {
            if (images.length >= maxCount) break;
            if (!canvas || !canvas.width || !canvas.height) continue;
            try {
                const dataUrl = canvas.toDataURL('image/png');
                if (dataUrl && dataUrl.startsWith('data:image/png;base64,') && dataUrl.length > 2000) {
                    images.push({
                        title: String(canvas.getAttribute('aria-label') || canvas.id || `可视化图表 ${images.length + 1}`),
                        base64: dataUrl.slice('data:image/png;base64,'.length)
                    });
                }
            } catch (_) { /* skip tainted canvas */ }
        }
        return images;
    }

    function buildGradeSpecialSlide(gradeProfile, townMatrix, classRows, theme) {
        const g = gradeProfile.grade;
        const own = townMatrix.ownTotal;
        if (g === '9') {
            const schools = townMatrix.schoolMatrixRows.slice(0, 8);
            const chartPool = schools.slice(0, 6);
            return {
                kind: 'splitChartTable',
                title: gradeProfile.specialSlideTitle,
                subtitle: `综合总分 = 两率一分(180) + 后1/3(40) + 高分≥490(50) + 指标生  |  本校 ${own ? own.comprehensiveTotal : '—'} 分（第 ${own ? own.comprehensiveRank : 1} 名）`,
                chart: {
                    title: '各校综合构成赋分对比',
                    categories: chartPool.map((s) => s.name),
                    series: [
                        { name: '两率一分', color: theme.accent, values: chartPool.map((s) => s.score2Rate) },
                        { name: '后1/3得分', color: theme.accent2, values: chartPool.map((s) => s.scoreBottom) },
                        { name: '490+赋分', color: theme.accent3, values: chartPool.map((s) => s.scoreHigh490) }
                    ]
                },
                headers: ['学校', '两率(180)', '490+人/分', '指标分', '后1/3', '综合(排)'],
                rows: schools.map((s) => ({
                    isEmph: s.isOwn,
                    cells: [
                        s.isOwn ? `★ ${s.name}` : s.name,
                        `${s.score2Rate}`,
                        `${s.highCount490}/${s.scoreHigh490}`,
                        `${s.scoreIndicator}`,
                        `${s.scoreBottom}`,
                        `${s.comprehensiveTotal}(#${s.comprehensiveRank})`
                    ]
                }))
            };
        }

        // Grades 6-8 with distinct Major vs All caliber
        if (townMatrix.hasTownship && gradeProfile.hasDistinctMajorCaliber && townMatrix.majorSchoolRows?.length) {
            const schools = townMatrix.schoolMatrixRows.slice(0, 8);
            const chartPool = schools.slice(0, 6);
            return {
                kind: 'splitChartTable',
                title: gradeProfile.specialSlideTitle,
                subtitle: `${gradeProfile.name}：全科综合(240) vs ${gradeProfile.majorLabel}双口径对照 + 后1/3托底`,
                chart: {
                    title: `全科 vs ${gradeProfile.majorLabel} 两率一分对比`,
                    categories: chartPool.map((s) => s.name),
                    series: [
                        { name: '全科两率', color: theme.accent, values: chartPool.map((s) => s.score2Rate) },
                        { name: gradeProfile.majorLabel, color: theme.accent2, values: chartPool.map((s) => s.majorMatch ? s.majorMatch.score2Rate : s.score2Rate) },
                        { name: '后1/3分', color: theme.accent3, values: chartPool.map((s) => s.scoreBottom) }
                    ]
                },
                headers: ['学校', '全科两率', `${gradeProfile.majorLabel}均分`, '后1/3分', '综合(排)'],
                rows: schools.map((s) => ({
                    isEmph: s.isOwn,
                    cells: [
                        s.isOwn ? `★ ${s.name}` : s.name,
                        `${s.score2Rate}`,
                        s.majorMatch ? `${s.majorMatch.avg}(#${s.majorMatch.comprehensiveRank})` : `${s.avg}`,
                        `${s.scoreBottom}`,
                        `${s.comprehensiveTotal}(#${s.comprehensiveRank})`
                    ]
                }))
            };
        }

        // Grades 6-8 when official subjects ALREADY equal major subjects: show Comprehensive Structure Breakdown (Two-Rate 200 + Bottom 1/3 40)
        if (townMatrix.hasTownship) {
            const schools = townMatrix.schoolMatrixRows.slice(0, 8);
            const chartPool = schools.slice(0, 6);
            return {
                kind: 'splitChartTable',
                title: gradeProfile.specialSlideTitle,
                subtitle: `${gradeProfile.name}：两率一分(200) + 后1/3有效分(40) 综合总分拆解（本校第 ${own?.comprehensiveRank || 1}/${townMatrix.totalSchools} 名）`,
                chart: {
                    title: '各校两率一分(200) 与 后1/3托底(40) 对比',
                    categories: chartPool.map((s) => s.name),
                    series: [
                        { name: '两率一分(200)', color: theme.accent, values: chartPool.map((s) => s.score2Rate) },
                        { name: '后1/3得分(40)', color: theme.accent2, values: chartPool.map((s) => s.scoreBottom) }
                    ]
                },
                headers: ['学校', '总分均分', '两率(200)', '后1/3均分', '后1/3(40)', '综合(排)'],
                rows: schools.map((s) => ({
                    isEmph: s.isOwn,
                    cells: [
                        s.isOwn ? `★ ${s.name}` : s.name,
                        `${s.avg}`,
                        `${s.score2Rate}`,
                        `${s.bottom3?.avg || 0}`,
                        `${s.scoreBottom}`,
                        `${s.comprehensiveTotal}(#${s.comprehensiveRank})`
                    ]
                }))
            };
        }

        const cPool = getRegularClasses(classRows).slice(0, 8);
        return {
            kind: 'splitChartTable',
            title: gradeProfile.specialSlideTitle,
            subtitle: `${gradeProfile.name}：各班两率一分(200) 与 有效后1/3托底(40) 对照`,
            chart: {
                title: '各班均分与后1/3有效均分对比',
                categories: cPool.map((c) => c.name),
                series: [
                    { name: '班级均分', color: theme.accent, values: cPool.map((c) => c.avg) },
                    { name: '后1/3均分', color: theme.accent2, values: cPool.map((c) => c.bottom3Avg || 0) }
                ]
            },
            headers: ['班级', '人数', '总分均分', '后1/3均分', '后1/3(40)', '两率(200)'],
            rows: cPool.map((c, idx) => ({
                isEmph: idx === 0,
                cells: [c.name, `${c.count}`, `${c.avg}`, `${c.bottom3Avg || 0}`, `${c.scoreBottom || 0}`, `${c.score}`]
            }))
        };
    }

    function buildMeetingDeckModel(options = {}) {
        const allRows = options.allRows || getAllRows();
        if (!allRows.length) throw new Error('暂无成绩数据，请先导入数据');
        const gradeProfile = getGradeAnalysisProfile(options.grade, allRows);
        const mySchool = options.mySchool || getMySchoolName(allRows);
        const mySchoolRows = allRows.filter((r) => sameSchool(r?.school, mySchool));
        const activeRows = mySchoolRows.length ? mySchoolRows : allRows;
        const subjectPolicy = getDisplayAndOfficialSubjects(allRows, gradeProfile);
        const subjects = options.subjects || subjectPolicy.allSubjects;
        const examTitle = options.examTitle || getExamTitle();
        const presenter = String(options.presenter || `${mySchool}教务处`).trim();
        const themeKey = PPT_THEMES[options.theme] ? options.theme : 'navy';
        const theme = PPT_THEMES[themeKey];
        const useTownshipLine = options.useTownshipLine !== false;
        const thresholdInfo = resolveThresholds(allRows, activeRows, subjects, useTownshipLine);
        const teacherMap = options.teacherMap || root.TEACHER_MAP || {};
        const include = {
            overview: true,
            gradeSpecial: true,
            townPosition: true,
            classRank: true,
            townBenchmark: true,
            subjects: true,
            charts: true,
            borderline: true,
            actionPlan: true,
            ...(options.include || {})
        };

        const overall = calcGroupMetrics(activeRows, '总分', thresholdInfo.thresholds['总分']);
        const classRows = buildClassRows(activeRows, '总分', thresholdInfo.thresholds['总分'], gradeProfile);
        const totalBorderline = buildBorderlineChips(activeRows, '总分', thresholdInfo.thresholds['总分']);
        const townMatrix = buildTownshipSchoolMatrix(allRows, mySchool, subjects, thresholdInfo.thresholds, gradeProfile);
        const subjectDiag = buildSubjectDiagnosis(townMatrix, activeRows, subjects, thresholdInfo.thresholds, gradeProfile, subjectPolicy.displayOnlySubjects);
        const diagnostics = buildSmartDiagnostics(overall, classRows, subjectDiag.map((d) => ({ subject: d.subject, avg: d.ownAvg, passRate: d.ownPass, rank: d.rank })), totalBorderline, townMatrix, gradeProfile);
        const teacherRows = buildTeacherHandbookRows(activeRows, subjects, teacherMap, thresholdInfo.thresholds, allRows, gradeProfile);
        const actionPlan = buildActionPlan(townMatrix, subjectDiag, classRows, totalBorderline, overall, gradeProfile);

        const modeLabel = thresholdInfo.source === 'township'
            ? `${gradeProfile.shortTag} · 全镇 ${thresholdInfo.schoolCount} 校（共 ${allRows.length} 人 · 本校 ${activeRows.length} 人）`
            : `${gradeProfile.shortTag} · 本校分析（共 ${activeRows.length} 人）`;

        const slides = [];
        // Slide 1: Cover
        slides.push({
            kind: 'cover',
            title: `${examTitle} · 教学质量分析会`,
            subtitle: `${presenter}  |  ${gradeProfile.name}`,
            meta: `考核口径：${gradeProfile.formulaDesc}  ·  总分优线 ${thresholdInfo.thresholds['总分'].exc} / 及线 ${thresholdInfo.thresholds['总分'].pass}`
        });

        // Slide 2: Overview + Native Subject Avg Bar Chart + Grade-Aware Diagnostics
        if (include.overview) {
            const own = townMatrix.ownTotal;
            slides.push({
                kind: 'overview',
                title: `年级总体概览与各科均分对比`,
                subtitle: `${mySchool} · ${modeLabel}`,
                kpis: [
                    { label: '参评人数 / 均分', val: `${overall.count}人 · ${overall.avg}`, color: theme.accent },
                    { label: `两率一分(${gradeProfile.weights.total})`, val: own ? `${own.score2Rate} (#${own.scoreRank})` : `${overall.excRate}%优`, color: '1D4ED8' },
                    { label: '后1/3有效分(40)', val: own ? `${own.scoreBottom} (#${own.rankBottom})` : `${classRows[0]?.bottom3Avg || 0}`, color: '0D9488' },
                    {
                        label: gradeProfile.grade === '9' ? '综合总分 / 490+高分' : '综合总分(240)',
                        val: own
                            ? (gradeProfile.grade === '9' ? `${own.comprehensiveTotal} (${own.highCount490}人)` : `${own.comprehensiveTotal} (#${own.comprehensiveRank})`)
                            : `${overall.passRate}%`,
                        color: 'B45309'
                    }
                ],
                chart: {
                    title: '各学科本校均分 vs 全镇均分',
                    categories: subjectDiag.map((d) => d.subject),
                    series: townMatrix.hasTownship
                        ? [
                            { name: '本校均分', color: theme.accent, values: subjectDiag.map((d) => d.ownAvg) },
                            { name: '全镇均分', color: '94A3B8', values: subjectDiag.map((d) => d.townAvg) }
                        ]
                        : [{ name: '各科均分', color: theme.accent, values: subjectDiag.map((d) => d.ownAvg) }]
                },
                diagnostics
            });
        }

        // Slide 3: Grade-Differentiated Special Slide
        if (include.gradeSpecial) {
            slides.push(buildGradeSpecialSlide(gradeProfile, townMatrix, classRows, theme));
        }

        // Slide 4: Township School Matrix & Subject Diagnosis
        if (include.townPosition && townMatrix.hasTownship) {
            const own = townMatrix.ownTotal;
            const targetNote = townMatrix.targetAhead
                ? `本校综合第 ${own.comprehensiveRank}/${townMatrix.totalSchools} 名 · 距前一名「${townMatrix.targetAhead.name}」综合差 ${townMatrix.compGapToAhead} 分（均分差 ${townMatrix.gapToAhead}）`
                : `本校稳居全镇综合第 1/${townMatrix.totalSchools} 名 · 较镇均 +${townMatrix.gapToTownAvg} 分`;
            slides.push({
                kind: 'table',
                title: '全镇校际定位与各科强弱诊断',
                subtitle: targetNote,
                headers: ['学科', '属性', '本校均分', '镇均分', '均分差', '两率(排)', '常规极差', '强弱判定'],
                rows: subjectDiag.map((d) => ({
                    isEmph: d.tier === '重点短板' || d.tier === '优势领跑',
                    cells: [d.subject, d.roleLabel, String(d.ownAvg), String(d.townAvg), `${d.avgDiff >= 0 ? '+' : ''}${d.avgDiff}`, `${d.score2Rate}(#${d.rank})`, `${d.classSpread}`, d.tier]
                })),
                footerNote: `战略焦点：${gradeProfile.pedagogyFocus}。`
            });
        }

        // Slide 5: Class Total & Township Split Slide
        if ((include.classRank || include.townBenchmark) && classRows.length) {
            const useBench = include.townBenchmark && thresholdInfo.hasTownship;
            const rawList = useBench
                ? buildClassTownshipBenchmark(allRows, mySchool, '总分', thresholdInfo.thresholds['总分'], gradeProfile)
                : classRows;
            const rowsSource = rawList.filter((r) => !r.isSmallClass).slice(0, 9);
            const chartSource = rowsSource.slice(0, 6);
            slides.push({
                kind: 'splitChartTable',
                title: useBench ? `班级总分对比（本校常规班 × 全镇各校）` : `班级总分两率一分对比`,
                subtitle: `按${gradeProfile.shortTag}权重(${gradeProfile.weights.avg}/${gradeProfile.weights.exc}/${gradeProfile.weights.pass})赋分 · ★ 为本校常规行政班`,
                chart: {
                    title: '均分与两率一分对比',
                    categories: chartSource.map((r) => r.name),
                    series: [
                        { name: '均分', color: theme.accent, values: chartSource.map((r) => r.avg) },
                        { name: `两率(${gradeProfile.weights.total})`, color: theme.accent2, values: chartSource.map((r) => r.score) }
                    ]
                },
                headers: ['班级/学校', '均分', '优率%', '及格%', `两率(${gradeProfile.weights.total})`],
                rows: rowsSource.map((r) => ({
                    isEmph: r.kind === 'own-class' || (!useBench && r.scoreRank === 1),
                    cells: [
                        r.kind === 'own-class' ? `★ ${r.name}` : r.name,
                        `${r.avg}`,
                        `${r.excRate}`,
                        `${r.passRate}`,
                        `${r.score}`
                    ]
                }))
            });
        }

        // Slides 6..N: Per-Subject Rich Dashboard (Compact Zero-Truncation Layout)
        if (include.subjects) {
            subjects.forEach((subj) => {
                const th = thresholdInfo.thresholds[subj] || { exc: 0, pass: 0 };
                const subjMetric = calcGroupMetrics(activeRows, subj, th);
                const subjTeachers = teacherRows.filter((t) => t.subject === subj);
                const subjClasses = getRegularClasses(buildClassRows(activeRows, subj, th, gradeProfile));
                const classVsTown = thresholdInfo.hasTownship
                    ? buildClassTownshipBenchmark(allRows, mySchool, subj, th, gradeProfile).filter((r) => !r.isSmallClass).slice(0, 6)
                    : subjClasses.slice(0, 6);
                const teacherVsTown = subjTeachers.length
                    ? buildTeacherTownshipBenchmark(allRows, mySchool, subj, subjTeachers, th, gradeProfile).slice(0, 6)
                    : classVsTown.map((c, idx) => ({ ...c, scoreRank: idx + 1 }));
                const border = buildBorderlineChips(activeRows, subj, th);
                const diag = subjectDiag.find((d) => d.subject === subj);

                const classChart = {
                    title: `班级 · ${subj}对比`,
                    categories: classVsTown.map((c) => c.name),
                    series: [
                        { name: '均分', color: theme.accent, values: classVsTown.map((c) => c.avg) },
                        { name: '及格%', color: theme.accent3, values: classVsTown.map((c) => c.passRate) }
                    ]
                };
                const teacherChartPool = (subjTeachers.length ? subjTeachers : subjClasses).slice(0, 5);
                const teacherChart = {
                    title: `任课教师 · ${subj}对比`,
                    categories: teacherChartPool.map((t) => t.teacher ? `${t.teacher}` : t.name),
                    series: [
                        { name: '均分', color: theme.accent, values: teacherChartPool.map((t) => t.avg) },
                        { name: '及格%', color: theme.accent2, values: teacherChartPool.map((t) => t.passRate) }
                    ]
                };

                slides.push({
                    kind: 'subjectDashboard',
                    subject: subj,
                    title: `${subj}［${diag?.roleLabel || '学科'}］· 班级与教师两率一分对比`,
                    subtitle: diag && townMatrix.hasTownship
                        ? `本校全镇第 ${diag.rank}/${diag.totalSchools} 名（${diag.tier} · 较镇均 ${diag.avgDiff >= 0 ? '+' : ''}${diag.avgDiff} · 常规班极差 ${diag.classSpread}）`
                        : `${mySchool} · 优秀线 ${th.exc} / 及格线 ${th.pass}`,
                    kpis: [
                        { label: '人数 · 属性', val: `${subjMetric.count}人 · ${diag?.roleLabel || '考核'}`, color: theme.accent },
                        { label: '学科均分', val: `${subjMetric.avg}`, color: '1D4ED8' },
                        { label: '优秀率%', val: `${subjMetric.excRate}%`, color: '0D9488' },
                        { label: '及格率%', val: `${subjMetric.passRate}%`, color: 'B45309' }
                    ],
                    classChart,
                    teacherChart,
                    headers: ['位次', '教师/外校', '均分', '优率%', '两率分'],
                    rows: teacherVsTown.map((r) => ({
                        isEmph: r.kind === 'own-teacher' || r.kind === 'own-class',
                        cells: [
                            `#${r.scoreRank || ''}`,
                            r.name,
                            String(r.avg),
                            String(r.excRate),
                            String(r.score)
                        ]
                    })),
                    footerNote: `边缘生：优边 ${border.excMarginal.length} 人（${border.excMarginal.slice(0, 3).map((s) => `${s.name} ${s.score}`).join('、') || '无'}）、及边 ${border.passMarginal.length} 人。施策：${diag ? diag.measure : '精准面批临界生。'}`
                });
            });
        }

        if (include.charts) {
            const chartImgs = Array.isArray(options.chartImages) ? options.chartImages : captureVisibleChartImages(2);
            if (chartImgs.length) {
                slides.push({
                    kind: 'charts',
                    title: '可视化图表快照',
                    subtitle: '直接截取当前分析页面的交互式图表用于会议展示',
                    images: chartImgs
                });
            }
        }

        if (include.borderline) {
            slides.push({
                kind: 'borderline',
                title: '重点临界生抓手与提分测算',
                subtitle: `全部转化可提升优秀率 +${actionPlan.excGain}% / 及格率 +${actionPlan.passGain}%（同步拉升两率一分与后1/3得分）`,
                excTitle: `优秀边缘生（共 ${totalBorderline.excMarginal.length} 人，冲刺优秀线 ${totalBorderline.exc}）`,
                excNames: totalBorderline.excMarginal.slice(0, 18).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '暂无',
                passTitle: `及格边缘生（共 ${totalBorderline.passMarginal.length} 人，守住及格线 ${totalBorderline.pass}）`,
                passNames: totalBorderline.passMarginal.slice(0, 18).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '暂无'
            });
        }

        if (include.actionPlan) {
            slides.push({
                kind: 'actionPlan',
                title: `下阶段提质方向与整改措施（${gradeProfile.shortTag}）`,
                subtitle: gradeProfile.pedagogyFocus,
                actions: actionPlan.actions
            });
        }

        slides.push({
            kind: 'closing',
            title: '感谢聆听 · 聚力提质',
            subtitle: `${presenter}  ·  ${examTitle}`
        });

        return { slides, gradeProfile, subjectPolicy, theme, themeKey, examTitle, presenter, mySchool, thresholdInfo, townMatrix, subjectDiag, actionPlan, activeRowsCount: activeRows.length, allRowsCount: allRows.length, subjects };
    }

    // -------------------------------------------------------------------------
    // OOXML (.pptx) Serialization
    // -------------------------------------------------------------------------
    function xmlSlideShell(shapesXml) {
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
${shapesXml}
</p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
    }

    function pptRect(id, x, y, cx, cy, fillHex, geom = 'rect', strokeHex = '') {
        const lnXml = strokeHex ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${strokeHex}"/></a:solidFill></a:ln>` : '<a:ln><a:noFill/></a:ln>';
        const avLst = geom === 'roundRect' ? '<a:avLst><a:gd name="adj" fmla="val 4500"/></a:avLst>' : '<a:avLst/>';
        return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
<a:prstGeom prst="${geom}">${avLst}</a:prstGeom><a:solidFill><a:srgbClr val="${fillHex}"/></a:solidFill>${lnXml}</p:spPr></p:sp>`;
    }

    function pptTextBox(id, x, y, cx, cy, lines, opts = {}) {
        const fontSize = Math.round((opts.fontSize || 16) * 100);
        const color = opts.color || '0F172A';
        const bold = opts.bold ? ' b="1"' : '';
        const align = opts.align || 'l';
        const paragraphs = (Array.isArray(lines) ? lines : [lines]).map((line) => (
            `<a:p><a:pPr algn="${align}"/><a:r><a:rPr lang="zh-CN" sz="${fontSize}"${bold} dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:rPr><a:t>${escXml(line)}</a:t></a:r></a:p>`
        )).join('');
        return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
<p:txBody><a:bodyPr wrap="square" lIns="50000" tIns="35000" rIns="50000" bIns="35000"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
    }

    function pptTable(id, x, y, cx, cy, headers, rows, theme, fontPt = 10) {
        const colCount = Math.max(1, headers.length);
        const colW = Math.floor(cx / colCount);
        const rowH = Math.min(330000, Math.floor(cy / Math.max(2, rows.length + 1)));
        const gridCols = headers.map(() => `<a:gridCol w="${colW}"/>`).join('');
        const bodySz = Math.round(fontPt * 100);
        const headSz = Math.round((fontPt + 0.5) * 100);
        const makeRow = (cells, isHeader, rowIdx, isEmph) => {
            const fill = isHeader ? theme.tblHead : (isEmph ? theme.rowTint : (rowIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF'));
            const txtColor = isHeader ? 'FFFFFF' : '0F172A';
            const bold = (isHeader || isEmph) ? ' b="1"' : '';
            const tcs = cells.map((cell) => `<a:tc><a:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="zh-CN" sz="${isHeader ? headSz : bodySz}"${bold}><a:solidFill><a:srgbClr val="${txtColor}"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:rPr><a:t>${escXml(cell)}</a:t></a:r></a:p></a:txBody><a:tcPr><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill></a:tcPr></a:tc>`).join('');
            return `<a:tr h="${rowH}">${tcs}</a:tr>`;
        };
        const trXml = [makeRow(headers, true, 0, false), ...rows.map((r, i) => makeRow(r.cells || r, false, i + 1, !!r.isEmph))].join('');
        return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Table ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>
<p:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></p:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>${gridCols}</a:tblGrid>${trXml}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
    }

    function pptPicture(id, relId, x, y, cx, cy) {
        return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Chart ${id}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
<p:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
    }

    function pptKpiStrip(kpis, theme, y = 1200000, h = 920000) {
        return (kpis || []).map((k, kIdx) => {
            const x = 457200 + kIdx * 2880000;
            const base = 10 + kIdx * 3;
            return pptRect(base, x, y, 2680000, h, theme.soft, 'roundRect', 'CBD5E1') +
                pptTextBox(base + 1, x + 120000, y + 70000, 2400000, 260000, k.label, { fontSize: 11, color: '64748B', bold: true }) +
                pptTextBox(base + 2, x + 120000, y + 340000, 2400000, 480000, k.val, { fontSize: 20, bold: true, color: k.color || theme.accent });
        }).join('');
    }

    async function buildMeetingPptxBlob(options = {}) {
        const JSZipCtor = options.JSZip || root.JSZip;
        if (!JSZipCtor) throw new Error('JSZip 未加载，无法生成 PPT');
        const deck = buildMeetingDeckModel(options);
        const { theme, examTitle, presenter } = deck;
        const totalSlides = deck.slides.length;

        const headerBand = (title, subtitle, pageNo) => (
            pptRect(2, 0, 0, 12192000, 1020000, theme.bg) +
            pptRect(3, 0, 995000, 12192000, 50000, theme.accent) +
            pptTextBox(4, 457200, 140000, 10400000, 430000, title, { fontSize: 21, bold: true, color: 'FFFFFF' }) +
            pptTextBox(5, 457200, 580000, 10400000, 310000, subtitle, { fontSize: 11, color: '93C5FD' }) +
            pptTextBox(98, 457200, 6520000, 9200000, 260000, `${presenter} · ${examTitle}`, { fontSize: 9.5, color: '94A3B8' }) +
            pptTextBox(99, 10400000, 6520000, 1330000, 260000, `${pageNo} / ${totalSlides}`, { fontSize: 9.5, color: '64748B', align: 'r' })
        );

        const builtSlides = deck.slides.map((s, idx) => {
            const pageNo = idx + 1;
            if (s.kind === 'cover') {
                return {
                    xml: xmlSlideShell(
                        pptRect(2, 0, 0, 12192000, 6858000, theme.bg) +
                        pptRect(3, 0, 6680000, 12192000, 178000, theme.accent) +
                        pptRect(7, 720000, 1520000, 960000, 75000, theme.accent2) +
                        pptTextBox(4, 720000, 1800000, 10750000, 1000000, s.title, { fontSize: 32, bold: true, color: 'FFFFFF' }) +
                        pptTextBox(5, 720000, 2950000, 10750000, 600000, s.subtitle, { fontSize: 17, color: '93C5FD' }) +
                        pptTextBox(6, 720000, 4200000, 10750000, 500000, s.meta, { fontSize: 12.5, color: 'CBD5E1' })
                    ),
                    images: [],
                    charts: []
                };
            }
            if (s.kind === 'overview') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptKpiStrip(s.kpis, theme, 1200000, 920000) +
                        pptChartFrame(30, 'rIdChart1', 457200, 2300000, 5600000, 4050000) +
                        pptRect(31, 6250000, 2300000, 5480000, 4050000, theme.soft, 'roundRect', 'CBD5E1') +
                        pptTextBox(32, 6430000, 2440000, 5120000, 350000, `核心诊断与全镇定位研判`, { fontSize: 14, bold: true, color: theme.tblHead }) +
                        pptTextBox(33, 6430000, 2840000, 5120000, 3400000, s.diagnostics, { fontSize: 11.5, color: theme.text })
                    ),
                    images: [],
                    charts: [s.chart]
                };
            }
            if (s.kind === 'splitChartTable') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptChartFrame(20, 'rIdChart1', 457200, 1280000, 5700000, 5100000) +
                        pptTable(21, 6320000, 1280000, 5410000, 5100000, s.headers, s.rows, theme, 9.5)
                    ),
                    images: [],
                    charts: [s.chart]
                };
            }
            if (s.kind === 'subjectDashboard') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptKpiStrip(s.kpis, theme, 1140000, 820000) +
                        pptTextBox(25, 457200, 2060000, 5480000, 260000, `班级 · ${s.subject}均分与及格率对比`, { fontSize: 11.5, bold: true, color: theme.tblHead }) +
                        pptChartFrame(26, 'rIdChart1', 457200, 2340000, 5480000, 3420000) +
                        pptTextBox(27, 6160000, 2060000, 5570000, 260000, `同学科教师 · ${s.subject}对比与全镇同台`, { fontSize: 11.5, bold: true, color: theme.tblHead }) +
                        pptChartFrame(28, 'rIdChart2', 6160000, 2340000, 5570000, 1620000) +
                        pptTable(29, 6160000, 4040000, 5570000, 1720000, s.headers, s.rows.slice(0, 6), theme, 9.2) +
                        pptRect(30, 457200, 5880000, 11270000, 520000, theme.soft, 'roundRect', 'CBD5E1') +
                        pptTextBox(31, 580000, 5920000, 11000000, 440000, s.footerNote, { fontSize: 10.2, color: '334155' })
                    ),
                    images: [],
                    charts: [s.classChart, s.teacherChart]
                };
            }
            if (s.kind === 'table') {
                const tableH = s.footerNote ? 4400000 : 5000000;
                const noteXml = s.footerNote ? pptTextBox(11, 457200, 5780000, 11270000, 620000, s.footerNote, { fontSize: 11.5, color: '475569' }) : '';
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptTable(10, 457200, 1240000, 11270000, tableH, s.headers, s.rows, theme, 9.8) +
                        noteXml
                    ),
                    images: [],
                    charts: []
                };
            }
            if (s.kind === 'charts') {
                const pics = (s.images || []).map((img, i) => {
                    const w = s.images.length === 1 ? 9600000 : 5400000;
                    const x = s.images.length === 1 ? 1296000 : (457200 + i * 5800000);
                    return pptPicture(20 + i, `rIdImg${i + 1}`, x, 1360000, w, 4750000);
                }).join('');
                return { xml: xmlSlideShell(headerBand(s.title, s.subtitle, pageNo) + pics), images: s.images || [], charts: [] };
            }
            if (s.kind === 'borderline') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptRect(10, 457200, 1280000, 11270000, 2320000, 'EFF6FF', 'roundRect', 'BFDBFE') +
                        pptTextBox(11, 640000, 1400000, 10850000, 380000, s.excTitle, { fontSize: 14.5, bold: true, color: '1D4ED8' }) +
                        pptTextBox(12, 640000, 1840000, 10850000, 1620000, s.excNames, { fontSize: 12, color: '0F172A' }) +
                        pptRect(13, 457200, 3840000, 11270000, 2320000, 'FFFBEB', 'roundRect', 'FDE68A') +
                        pptTextBox(14, 640000, 3960000, 10850000, 380000, s.passTitle, { fontSize: 14.5, bold: true, color: 'B45309' }) +
                        pptTextBox(15, 640000, 4400000, 10850000, 1620000, s.passNames, { fontSize: 12, color: '0F172A' })
                    ),
                    images: [],
                    charts: []
                };
            }
            if (s.kind === 'actionPlan') {
                const cardsXml = (s.actions || []).slice(0, 4).map((act, i) => {
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    const x = 457200 + col * 5740000;
                    const y = 1260000 + row * 2550000;
                    const base = 10 + i * 4;
                    return pptRect(base, x, y, 5520000, 2380000, theme.soft, 'roundRect', 'CBD5E1') +
                        pptTextBox(base + 1, x + 140000, y + 100000, 5220000, 340000, `${i + 1}. ${act.dimension}（${act.owner}）`, { fontSize: 13, bold: true, color: theme.tblHead }) +
                        pptTextBox(base + 2, x + 140000, y + 480000, 5220000, 1780000, [act.summary, ...(act.steps || []).slice(0, 2).map((st) => `• ${st}`)], { fontSize: 10.5, color: '334155' });
                }).join('');
                return { xml: xmlSlideShell(headerBand(s.title, s.subtitle, pageNo) + cardsXml), images: [], charts: [] };
            }
            return {
                xml: xmlSlideShell(
                    pptRect(2, 0, 0, 12192000, 6858000, theme.bg) +
                    pptTextBox(4, 1200000, 2550000, 9792000, 900000, s.title, { fontSize: 34, bold: true, color: 'FFFFFF', align: 'ctr' }) +
                    pptTextBox(5, 1200000, 3650000, 9792000, 500000, s.subtitle, { fontSize: 16, color: '94A3B8', align: 'ctr' })
                ),
                images: [],
                charts: []
            };
        });

        const zip = new JSZipCtor();
        let imgCounter = 0;
        let chartCounter = 0;
        const chartOverrides = [];

        builtSlides.forEach((slide, idx) => {
            const slideNo = idx + 1;
            zip.file(`ppt/slides/slide${slideNo}.xml`, slide.xml);
            const imgRels = (slide.images || []).map((img, i) => {
                imgCounter += 1;
                const mediaName = `chartimg${imgCounter}.png`;
                zip.file(`ppt/media/${mediaName}`, img.base64, { base64: true });
                return `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaName}"/>`;
            }).join('');
            const chartRels = (slide.charts || []).map((cSpec, i) => {
                chartCounter += 1;
                const chartFile = `chart${chartCounter}.xml`;
                zip.file(`ppt/charts/${chartFile}`, buildNativeBarChartXml(cSpec));
                chartOverrides.push(`<Override PartName="/ppt/charts/${chartFile}" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`);
                return `<Relationship Id="rIdChart${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/${chartFile}"/>`;
            }).join('');
            zip.file(`ppt/slides/_rels/slide${slideNo}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
${imgRels}${chartRels}
</Relationships>`);
        });

        const slideOverrides = builtSlides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('');
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
${slideOverrides}${chartOverrides.join('')}
</Types>`);
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);
        const nowIso = new Date().toISOString();
        zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${escXml(examTitle)}</dc:title>
<dc:creator>${escXml(presenter)}</dc:creator>
<dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`);
        zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
<Application>Microsoft Office PowerPoint</Application>
<Slides>${builtSlides.length}</Slides>
</Properties>`);
        const sldIdLst = builtSlides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('');
        const presRels = builtSlides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('');
        zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>${sldIdLst}</p:sldIdLst>
<p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);
        zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${presRels}
</Relationships>`);
        zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`);
        zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);
        zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`);
        zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);
        zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SchoolTheme">
<a:themeElements><a:clrScheme name="School"><a:dk1><a:srgbClr val="0F172A"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="334155"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2><a:accent1><a:srgbClr val="${theme.accent}"/></a:accent1><a:accent2><a:srgbClr val="1D4ED8"/></a:accent2><a:accent3><a:srgbClr val="7C3AED"/></a:accent3><a:accent4><a:srgbClr val="B45309"/></a:accent4><a:accent5><a:srgbClr val="0EA5E9"/></a:accent5><a:accent6><a:srgbClr val="16A34A"/></a:accent6><a:hlink><a:srgbClr val="0284C7"/></a:hlink><a:folHlink><a:srgbClr val="6D28D9"/></a:folHlink></a:clrScheme>
<a:fontScheme name="School"><a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:majorFont><a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme>
<a:fmtScheme name="School">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements></a:theme>`);

        const payload = await zip.generateAsync({ type: options.outputType || 'blob', compression: 'DEFLATE' });
        return {
            payload,
            slideCount: builtSlides.length,
            chartCount: chartCounter,
            grade: deck.gradeProfile.grade,
            gradeModeName: deck.gradeProfile.name,
            fileName: `质量分析会_${deck.gradeProfile.shortTag}_${examTitle.replace(/[\\/:*?"<>|]/g, '_')}.pptx`
        };
    }

    // -------------------------------------------------------------------------
    // Rich 10-Sheet Teacher Analysis Handbook Excel Exporter
    // -------------------------------------------------------------------------
    function textWidth(val) {
        return String(val ?? '').split('').reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? 2 : 1), 0);
    }

    function styleHandbookSheet(XLSX, ws, aoa, opts = {}) {
        if (!ws || !ws['!ref'] || !XLSX?.utils) return;
        const range = XLSX.utils.decode_range(ws['!ref']);
        const headers = Array.isArray(aoa?.[0]) ? aoa[0] : [];
        for (let R = range.s.r; R <= range.e.r; R += 1) {
            const row = aoa?.[R] || [];
            const isHeader = R === 0 && !opts.isCover;
            const isOwnRow = R > 0 && row.some((v) => /本校|★|学科标杆|优势领跑/.test(String(v || '')));
            const isWarnRow = R > 0 && row.some((v) => /重点短板|重点帮扶/.test(String(v || '')));
            for (let C = range.s.c; C <= range.e.c; C += 1) {
                const ref = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = ws[ref];
                if (!cell) continue;
                const hText = String(headers[C] || '');
                const isRankCol = /名次|排名|位次/.test(hText);
                const rankVal = (R > 0 && isRankCol) ? Number(String(cell.v).replace(/[^0-9]/g, '')) : NaN;
                const isTop3 = Number.isFinite(rankVal) && rankVal >= 1 && rankVal <= 3;
                const alignLeft = opts.isCover || /措施|建议|名单|结论|研判|说明|任教班/.test(hText) || (C === 0 && opts.leftFirst);
                cell.s = {
                    alignment: { horizontal: alignLeft ? 'left' : 'center', vertical: 'center', wrapText: true },
                    font: isHeader
                        ? { name: 'Microsoft YaHei', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } }
                        : {
                            name: 'Microsoft YaHei',
                            sz: opts.isCover && R === 1 ? 16 : 10,
                            bold: (opts.isCover && (R <= 1 || C === 0)) || isTop3 || (isOwnRow && C <= 2),
                            color: { rgb: isTop3 ? 'DC2626' : (isWarnRow && C >= 6 ? 'B91C1C' : (isOwnRow ? '0F3D5E' : '1E293B')) }
                        },
                    fill: isHeader
                        ? { fgColor: { rgb: '0F766E' } }
                        : { fgColor: { rgb: isOwnRow ? 'EAF6FF' : (isWarnRow ? 'FEF2F2' : (R % 2 === 0 ? 'F8FAFC' : 'FFFFFF')) } },
                    border: {
                        top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                        bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                        left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                        right: { style: 'thin', color: { rgb: 'E2E8F0' } }
                    }
                };
            }
        }
        if (!opts.isCover) ws['!autofilter'] = { ref: ws['!ref'] };
        ws['!cols'] = Array.from({ length: range.e.c + 1 }, (_, cIdx) => {
            if (opts.isCover) return { wch: cIdx === 0 ? 22 : 82 };
            let maxW = textWidth(headers[cIdx] || '');
            for (let rIdx = 1; rIdx <= Math.min(range.e.r, 80); rIdx += 1) {
                maxW = Math.max(maxW, textWidth(aoa?.[rIdx]?.[cIdx] ?? ''));
            }
            return { wch: Math.max(10, Math.min(maxW + 4, 52)) };
        });
        ws['!rows'] = Array.from({ length: range.e.r + 1 }, (_, rIdx) => ({ hpt: (opts.isCover && rIdx === 1) ? 32 : (rIdx === 0 ? 26 : 22) }));
    }

    function appendHandbookSheet(XLSX, wb, name, aoa, opts = {}) {
        const safeName = String(name || 'Sheet').replace(/[\\/?*\[\]:]/g, '').slice(0, 31);
        const ws = XLSX.utils.aoa_to_sheet(aoa && aoa.length ? aoa : [['暂无数据']]);
        if (typeof root.decorateExcelSheet === 'function' && !opts.isCover) {
            try { root.decorateExcelSheet(ws, aoa[0] || []); } catch (_) { }
        }
        styleHandbookSheet(XLSX, ws, aoa, opts);
        XLSX.utils.book_append_sheet(wb, ws, safeName);
        return ws;
    }

    function exportTeacherAnalysisHandbookExcel(options = {}) {
        const XLSX = options.XLSX || root.XLSX;
        if (!XLSX?.utils) {
            toast('Excel 导出组件未就绪', 'error');
            return false;
        }
        const allRows = options.allRows || getAllRows();
        if (!allRows.length) {
            toast('请先上传成绩数据', 'error');
            return false;
        }
        const gradeProfile = getGradeAnalysisProfile(options.grade, allRows);
        const mySchool = options.mySchool || getMySchoolName(allRows);
        const mySchoolRows = allRows.filter((r) => sameSchool(r?.school, mySchool));
        const activeRows = mySchoolRows.length ? mySchoolRows : allRows;
        const subjectPolicy = getDisplayAndOfficialSubjects(allRows, gradeProfile);
        const subjects = options.subjects || subjectPolicy.allSubjects;
        const examTitle = options.examTitle || getExamTitle();
        const teacherMap = options.teacherMap || root.TEACHER_MAP || {};
        const teacherLookup = resolveTeacherLookup(teacherMap);
        const thInfo = resolveThresholds(allRows, activeRows, subjects, options.useTownshipLine !== false);
        const teacherRows = buildTeacherHandbookRows(activeRows, subjects, teacherMap, thInfo.thresholds, allRows, gradeProfile);
        const classTotalRows = buildClassRows(activeRows, '总分', thInfo.thresholds['总分'], gradeProfile);
        const overall = calcGroupMetrics(activeRows, '总分', thInfo.thresholds['总分']);
        const totalBorderline = buildBorderlineChips(activeRows, '总分', thInfo.thresholds['总分']);
        const townMatrix = buildTownshipSchoolMatrix(allRows, mySchool, subjects, thInfo.thresholds, gradeProfile);
        const subjectDiag = buildSubjectDiagnosis(townMatrix, activeRows, subjects, thInfo.thresholds, gradeProfile, subjectPolicy.displayOnlySubjects);
        const actionPlan = buildActionPlan(townMatrix, subjectDiag, classTotalRows, totalBorderline, overall, gradeProfile);
        const diagnostics = buildSmartDiagnostics(overall, classTotalRows, subjectDiag.map((d) => ({ subject: d.subject, avg: d.ownAvg, passRate: d.ownPass, rank: d.rank })), totalBorderline, townMatrix, gradeProfile);

        const wb = XLSX.utils.book_new();
        const own = townMatrix.ownTotal;

        // Sheet 1: 封面与导读
        const coverAoa = [
            [`${mySchool} · 澄见教学质量分析系统`],
            [`${examTitle} · 教师教学质量分析手册（${gradeProfile.shortTag}）`],
            ['生成时间', new Date().toLocaleString('zh-CN')],
            ['当前年级模式', gradeProfile.name],
            ['本年级考核算法', gradeProfile.formulaDesc],
            ['学科口径区分', `考核科目：${subjectPolicy.officialSubjects.join('、') || '全科'}${subjectPolicy.displayOnlySubjects.length ? `；展示/单列对比科目（不计入考核总分）：${subjectPolicy.displayOnlySubjects.join('、')}` : ''}`],
            ['划线标准', thInfo.source === 'township' ? `全镇统一划线（全镇 ${thInfo.schoolCount} 校 ${allRows.length} 人，本校 ${activeRows.length} 人）：总分优秀线 ${thInfo.thresholds['总分'].exc} 分 / 及格线 ${thInfo.thresholds['总分'].pass} 分` : `本校划线（共 ${activeRows.length} 人）：优秀线 ${thInfo.thresholds['总分'].exc} / 及格线 ${thInfo.thresholds['总分'].pass}`],
            ['本校全镇定位', townMatrix.hasTownship && own ? `综合总分 ${own.comprehensiveTotal} 分，全镇第 ${own.comprehensiveRank}/${townMatrix.totalSchools} 名（两率一分 ${own.score2Rate}［#${own.scoreRank}］，后1/3得分 ${own.scoreBottom}［#${own.rankBottom}］${gradeProfile.grade === '9' ? `，490+赋分 ${own.scoreHigh490}，指标生 ${own.scoreIndicator}` : ''}${townMatrix.targetAhead ? `，距「${townMatrix.targetAhead.name}」差 ${townMatrix.compGapToAhead} 分` : ''}）` : '单校分析模式'],
            ['年级教学重心', gradeProfile.pedagogyFocus],
            ['工作表导读', '核心用途与阅读建议'],
            ['1. 总览与全镇定位', `全镇各校两率一分(${gradeProfile.weights.total})、后1/3得分(40)${gradeProfile.grade === '9' ? '、490+高分赋分(50)、指标生得分' : ''}与综合总分排名`],
            [`2. ${gradeProfile.specialSheetName}`, gradeProfile.grade === '9' ? '九年级专属：高分段(≥490)、指标生达标、有效后1/3学生托底三表合一' : `${gradeProfile.grade}年级专属：各校与本校各班综合总分拆解与有效后1/3托底核算`],
            ['3. 班级排名', `总分与各科各班均分、优秀率、及格率、后1/3均分、两率一分(${gradeProfile.weights.total})及小样本班标注`],
            ['4. 教师排名', '校内排名、全镇外校同台排名、公平绩效分、生源增值与临界生转化储备'],
            ['5. 一师一策画像', '【教研核心】每位教师专属诊断：校内/全镇位次、班际极差、名下临界生点名与提分幅度'],
            ['6. 单科明细与诊断', '区分【核心主科 / 考核科目 / 展示对比】，对比全镇均分、两率差值、常规班极差与整改方向'],
            ['7. 优秀生名单', '总分及各科达优秀线学生光荣榜（自动关联任课教师）'],
            ['8. 边缘生名单', '总分及各科优秀边缘、及格边缘包保推进表（精确到任课教师与距线分差）'],
            ['9. 智能解读与措施', `贴合${gradeProfile.name}的考后质量分析会完整发言研判与 4 维落地整改措施`]
        ];
        appendHandbookSheet(XLSX, wb, '封面与导读', coverAoa, { isCover: true });

        // Sheet 2: 总览与全镇定位
        const overviewHeaders = gradeProfile.grade === '9'
            ? ['学校名称', '参评人数', '总分均分', '优秀率(%)', '及格率(%)', '两率一分(180)', '两率排名', '后1/3均分', '后1/3得分(40)', '≥490人数', '高分赋分(50)', '指标生得分', '综合总分', '综合总排名', '较镇均分差']
            : ['学校名称', '参评人数', '总分均分', '优秀率(%)', '及格率(%)', '两率一分(200)', '两率排名', '后1/3有效均分', '后1/3得分(40)', '后1/3排名', '综合总分(240)', '综合总排名', '较镇均分差'];
        const overviewAoa = [
            overviewHeaders,
            ...townMatrix.schoolMatrixRows.map((sch) => (
                gradeProfile.grade === '9'
                    ? [sch.isOwn ? `★ ${sch.name}（本校）` : sch.name, sch.count, sch.avg, sch.excRate, sch.passRate, sch.score2Rate, sch.scoreRank, sch.bottom3?.avg || 0, sch.scoreBottom, sch.highCount490, sch.scoreHigh490, sch.scoreIndicator, sch.comprehensiveTotal, sch.comprehensiveRank, Number((sch.avg - townMatrix.townOverall['总分'].avg).toFixed(2))]
                    : [sch.isOwn ? `★ ${sch.name}（本校）` : sch.name, sch.count, sch.avg, sch.excRate, sch.passRate, sch.score2Rate, sch.scoreRank, sch.bottom3?.avg || 0, sch.scoreBottom, sch.rankBottom, sch.comprehensiveTotal, sch.comprehensiveRank, Number((sch.avg - townMatrix.townOverall['总分'].avg).toFixed(2))]
            ))
        ];
        appendHandbookSheet(XLSX, wb, '总览与全镇定位', overviewAoa);

        // Sheet 3: 年级专项核算表
        if (gradeProfile.grade === '9') {
            const g9Aoa = [
                ['学校名称', '实考人数', '≥490高分人数', '高分率(%)', '高分赋分(50)', '高分排名', '指标一目标/达标', '指标二目标/达标', '指标生总分', '后1/3人数', '剔除人数', '有效后1/3均分', '后1/3得分(40)', '后1/3排名'],
                ...townMatrix.schoolMatrixRows.map((sch) => {
                    const ind = sch.indicatorInfo;
                    return [sch.isOwn ? `★ ${sch.name}（本校）` : sch.name, sch.count, sch.highCount490, sch.highRate490Pct, sch.scoreHigh490, sch.rankHigh490, ind ? `${ind.t1}/${ind.r1}` : '未配置', ind ? `${ind.t2}/${ind.r2}` : '未配置', sch.scoreIndicator, sch.bottom3?.bottomN || 0, sch.bottom3?.excN || 0, sch.bottom3?.avg || 0, sch.scoreBottom, sch.rankBottom];
                })
            ];
            appendHandbookSheet(XLSX, wb, gradeProfile.specialSheetName, g9Aoa);
        } else {
            const specAoa = [
                ['对象名称', '类型', '人数', '总分均分', '优秀率%', '及格率%', '两率一分(200)', '有效后1/3均分', '后1/3得分(40)', '综合总分(240)', '排名', '诊断说明']
            ];
            townMatrix.schoolMatrixRows.forEach((s) => {
                specAoa.push([
                    s.isOwn ? `★ ${s.name}（本校）` : s.name,
                    '全镇学校',
                    s.count,
                    s.avg,
                    s.excRate,
                    s.passRate,
                    s.score2Rate,
                    s.bottom3?.avg || 0,
                    s.scoreBottom,
                    s.comprehensiveTotal,
                    s.comprehensiveRank,
                    s.isOwn ? `全镇综合第 ${s.comprehensiveRank} 名` : ''
                ]);
            });
            classTotalRows.forEach((c) => {
                specAoa.push([
                    `★ 本校·${c.name}`,
                    c.isSmallClass ? '小样本/特殊班' : '本校常规班',
                    c.count,
                    c.avg,
                    c.excRate,
                    c.passRate,
                    c.score,
                    c.bottom3Avg || 0,
                    c.scoreBottom || 0,
                    Number(((c.score || 0) + (c.scoreBottom || 0)).toFixed(2)),
                    c.scoreRank,
                    c.isSmallClass ? '小样本班单独跟进，不计常规极差' : `班内后1/3有效学生 ${c.bottom3ValidN || 0} 人`
                ]);
            });
            appendHandbookSheet(XLSX, wb, gradeProfile.specialSheetName, specAoa);
        }

        // Sheet 4: 班级排名
        const classRankAoa = [
            ['科目', '校内名次', '班级', '班级类型', '全镇同台位次', '人数', '均分', '均分名次', '优秀率%', '及格率%', `两率一分(${gradeProfile.weights.total})`, '后1/3有效均分', '诊断备注']
        ];
        ['总分', ...subjects].forEach((subj) => {
            const cRows = buildClassRows(activeRows, subj, thInfo.thresholds[subj], gradeProfile);
            const tBench = thInfo.hasTownship ? buildClassTownshipBenchmark(allRows, mySchool, subj, thInfo.thresholds[subj], gradeProfile) : [];
            const regRows = getRegularClasses(cRows);
            const topAvg = regRows.length ? Math.max(...regRows.map((x) => x.avg)) : 0;
            cRows.forEach((c) => {
                const inTown = tBench.find((x) => x.kind === 'own-class' && x.name === c.name);
                const gap = Number((topAvg - c.avg).toFixed(1));
                const note = c.isSmallClass
                    ? '小样本/特殊班（单列关注）'
                    : (c.scoreRank === 1 ? '★ 领跑班级' : (gap >= 10 ? `距常规领跑班差 ${gap} 分，需帮扶` : `距常规领跑班差 ${gap} 分`));
                classRankAoa.push([
                    subj, c.scoreRank, c.name, c.isSmallClass ? '小样本班' : '常规班',
                    inTown ? `全镇同台第 ${inTown.scoreRank} 名` : `校内第 ${c.scoreRank} 名`,
                    c.count, c.avg, c.avgRank, c.excRate, c.passRate, c.score,
                    subj === '总分' ? (c.bottom3Avg || 0) : '—', note
                ]);
            });
        });
        appendHandbookSheet(XLSX, wb, '班级排名', classRankAoa);

        // Sheet 5: 教师排名
        const teacherRankAoa = [
            ['学科', '校内名次', '教师', '任教班', '全镇同台名次', '人数', '均分', '校均/镇均排', '优秀率%', '及格率%', `两率一分(${gradeProfile.weights.total})`, '公平绩效分', '历史生源增值', '临界生转化/储备', '较镇均差', '画像标签']
        ];
        teacherRows.forEach((r) => {
            teacherRankAoa.push([
                r.subject, r.scoreRank, r.teacher, r.classes.join('、'),
                `全镇第 ${r.townRank}/${r.townSchoolTotal} 名`, r.count, r.avg,
                `校#${r.avgRank} / 镇#${r.townAvgRank}`, r.excRate, r.passRate, r.score,
                r.fairScore !== null ? `${r.fairScore} (#${r.fairRank || '-'})` : '—',
                r.baselineAdjustment !== null ? (r.baselineAdjustment >= 0 ? `+${r.baselineAdjustment}` : String(r.baselineAdjustment)) : '首次基线',
                r.conversionSummary, r.diffVsTownAvg, r.profileTag
            ]);
        });
        appendHandbookSheet(XLSX, wb, '教师排名', teacherRankAoa);

        // Sheet 6: 一师一策画像
        const portraitAoa = [
            ['学科', '任课教师', '任教班级', '人数', '均分(校排/镇排)', `两率一分(${gradeProfile.weights.total})`, '公平绩效', '所教班极差', '画像诊断', '名下优秀边缘生(面批冲优)', '冲优可提幅度', '名下及格边缘生(保底清零)', '保底可提幅度', '下阶段教学改进措施']
        ];
        teacherRows.forEach((r) => {
            portraitAoa.push([
                r.subject, r.teacher, r.classes.join('、'), r.count,
                `${r.avg} (校#${r.avgRank} / 镇#${r.townAvgRank})`, r.score,
                r.fairScore !== null ? `${r.fairScore} (#${r.fairRank || '-'})` : '—',
                r.classSpread, r.profileTag,
                r.excMarginal.slice(0, 15).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '无',
                `+${r.excLift}% (${r.excMarginal.length}人)`,
                r.passMarginal.slice(0, 15).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '无',
                `+${r.passLift}% (${r.passMarginal.length}人)`,
                r.advice
            ]);
        });
        appendHandbookSheet(XLSX, wb, '一师一策画像', portraitAoa);

        // Sheet 7: 单科明细
        const subjectDetailAoa = [
            ['学科', '口径属性', '人数', '本校均分', '全镇均分', '较镇均差', `两率一分(${gradeProfile.weights.total})`, '全镇位次', '优秀线', '优秀率%', '及格线', '及格率%', '常规班极差', '领跑班', '薄弱班', '强弱判定', '病因诊断', '教研组整改方向']
        ];
        subjectDiag.forEach((d) => {
            const th = thInfo.thresholds[d.subject] || { exc: 0, pass: 0 };
            const m = calcGroupMetrics(activeRows, d.subject, th);
            subjectDetailAoa.push([
                d.subject, d.roleLabel, m.count, d.ownAvg, d.townAvg, d.avgDiff, d.score2Rate,
                `第 ${d.rank}/${d.totalSchools} 名`, th.exc, d.ownExc, th.pass, d.ownPass,
                d.classSpread, d.topClass, d.weakClass, d.tier, d.issueType, d.measure
            ]);
        });
        appendHandbookSheet(XLSX, wb, '单科明细', subjectDetailAoa);

        // Sheet 8: 优秀生名单
        const excListAoa = [['类别', '科目', '姓名', '班级', '学校', '任课教师', '分数', '优秀线', '超线分值']];
        ['总分', ...subjects].forEach((subj) => {
            const b = buildBorderlineChips(activeRows, subj, thInfo.thresholds[subj]);
            b.excellent.forEach((s) => {
                excListAoa.push([subj === '总分' ? '总分优秀' : '单科优秀', subj, s.name, s.class, s.school || mySchool, subj === '总分' ? '全科教师' : (teacherLookup.get(s.class, subj) || '—'), s.score, b.exc, Number((s.score - b.exc).toFixed(1))]);
            });
        });
        appendHandbookSheet(XLSX, wb, '优秀生名单', excListAoa);

        // Sheet 9: 边缘生名单
        const borderAoa = [['类别', '科目', '姓名', '班级', '学校', '任课教师', '当前分数', '目标线', '距达线分差', '转化动作建议']];
        ['总分', ...subjects].forEach((subj) => {
            const b = buildBorderlineChips(activeRows, subj, thInfo.thresholds[subj]);
            b.excMarginal.forEach((s) => {
                borderAoa.push(['优秀边缘', subj, s.name, s.class, s.school || mySchool, subj === '总分' ? '班主任统筹' : (teacherLookup.get(s.class, subj) || '—'), s.score, b.exc, `差 ${s.gapToExc} 分达优`, '每周面批 1 次综合卷，减少中档题失分']);
            });
            b.passMarginal.forEach((s) => {
                borderAoa.push(['及格边缘', subj, s.name, s.class, s.school || mySchool, subj === '总分' ? '班主任统筹' : (teacherLookup.get(s.class, subj) || '—'), s.score, b.pass, `差 ${s.gapToPass} 分及格`, '落实基础题与核心概念每日过关打卡']);
            });
        });
        appendHandbookSheet(XLSX, wb, '边缘生名单', borderAoa);

        // Sheet 10: 智能解读与整改方案
        const smartAoa = [
            ['维度标签', '责任主体', '分析结论与具体落地措施'],
            ['年级考核模式', '教导处 / 级部', `${gradeProfile.name} —— 考核公式：${gradeProfile.formulaDesc}。教学重心：${gradeProfile.pedagogyFocus}`],
            ...diagnostics.map((line, i) => [['总体与镇域定位', '年级专项剖析', '常规行政班诊断', '学科与临界生抓手'][i] || '综合研判', '教导处 / 级部', line]),
            ...actionPlan.actions.map((act) => [act.dimension, act.owner, `${act.summary} 落实步骤：${act.steps.join('；')}`])
        ];
        appendHandbookSheet(XLSX, wb, '智能解读', smartAoa, { leftFirst: true });

        const fileName = `教师分析手册_${gradeProfile.shortTag}_${examTitle.replace(/[\\/:*?"<>|]/g, '_')}.xlsx`;
        if (!options.dryRun) XLSX.writeFile(wb, fileName);
        toast(`已生成 ${wb.SheetNames.length} 表精装版（${gradeProfile.shortTag}）${fileName}`, 'success');
        return { ok: true, fileName, grade: gradeProfile.grade, gradeModeName: gradeProfile.name, sheetNames: wb.SheetNames, teacherCount: teacherRows.length, classCount: classTotalRows.length };
    }

    function exportBenchmarkExcel(benchRows, subject, examTitle, gradeProfile = getGradeAnalysisProfile()) {
        const XLSX = root.XLSX;
        if (!XLSX?.utils) {
            toast('Excel 导出组件未就绪', 'error');
            return false;
        }
        const wb = XLSX.utils.book_new();
        const aoa = [
            ['班级 / 学校', '类型', '参评人数', '平均分', '均分排名', '优秀率(%)', '优率排名', '及格率(%)', '及格排名', `两率一分(${gradeProfile.weights.total})`, '综合排名'],
            ...benchRows.map((r) => [r.name, r.kind === 'own-class' ? (r.isSmallClass ? '本校小样本班' : '本校常规班') : '外校', r.count, r.avg, r.avgRank, r.excRate, r.excRank, r.passRate, r.passRank, r.score, r.scoreRank])
        ];
        appendHandbookSheet(XLSX, wb, `${subject}镇域对标`, aoa);
        const fileName = `班级镇域对标_${gradeProfile.shortTag}_${subject}_${examTitle.replace(/[\\/:*?"<>|]/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast(`已导出 ${fileName}`, 'success');
        return true;
    }

    // -------------------------------------------------------------------------
    // High-Specificity Scoped Styles (Overrides product-redesign.css button !important)
    // -------------------------------------------------------------------------
    function ensureStyles() {
        const doc = root.document;
        if (!doc) return;
        const old = doc.getElementById('qmk-style');
        if (old) old.remove();
        const style = doc.createElement('style');
        style.id = 'qmk-style';
        style.textContent = `
.qmk-mask{position:fixed;inset:0;background:rgba(15,23,42,.52);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
.qmk-dialog{background:var(--bg-card,#fff);color:var(--color-data,#0f172a);border:1px solid var(--border,#e2e8f0);border-radius:20px;width:min(1220px,96vw);max-height:93vh;display:flex;flex-direction:column;box-shadow:0 28px 70px rgba(15,23,42,.24);overflow:hidden}
.qmk-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 22px;border-bottom:1px solid var(--border,#e2e8f0);background:var(--bg-card,#fff)}
.qmk-head-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0}
.qmk-head h3{margin:0;font-size:16.5px;font-weight:700;letter-spacing:-.01em;color:var(--color-data,#0f172a)}
.qmk-head-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
.qmk-mode-chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:700;background:rgba(37,99,235,.10);color:#1d4ed8}
.qmk-seg{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:10px;background:var(--bg-body,#f1f5f9);border:1px solid var(--border,#e2e8f0)}
.qmk-mask button.qmk-grade-pill{min-height:28px !important;height:28px !important;padding:0 11px !important;border-radius:7px !important;border:1px solid transparent !important;background:transparent !important;color:var(--secondary,#475569) !important;font-size:12px !important;font-weight:600 !important;box-shadow:none !important;transform:none !important;cursor:pointer;transition:all .15s}
.qmk-mask button.qmk-grade-pill:hover{background:rgba(15,23,42,.06) !important;color:#0f172a !important;transform:none !important}
.qmk-mask button.qmk-grade-pill.is-active,.qmk-mask button.qmk-grade-pill.is-active:hover{background:#0f172a !important;color:#fff !important;border-color:#0f172a !important;box-shadow:0 2px 6px rgba(15,23,42,.18) !important;transform:none !important}
.qmk-mask button.qmk-close{width:32px !important;height:32px !important;min-height:32px !important;padding:0 !important;border-radius:999px !important;border:1px solid var(--border,#e2e8f0) !important;background:transparent !important;color:var(--secondary,#64748b) !important;font-size:18px !important;display:grid;place-items:center;cursor:pointer;transform:none !important}
.qmk-mask button.qmk-close:hover{background:#f1f5f9 !important;color:#0f172a !important}
.qmk-body{padding:18px 22px;overflow:auto;display:flex;flex-direction:column;gap:14px;background:var(--bg-body,#f8fafc)}
.qmk-nav-row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;flex-shrink:0}
.qmk-nav-pills{display:inline-flex;gap:4px;padding:4px;border-radius:12px;background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0)}
.qmk-mask button.qmk-nav-pill{min-height:32px !important;height:32px !important;padding:0 15px !important;border-radius:8px !important;border:1px solid transparent !important;background:transparent !important;color:var(--secondary,#475569) !important;font-size:13px !important;font-weight:600 !important;box-shadow:none !important;transform:none !important;cursor:pointer}
.qmk-mask button.qmk-nav-pill:hover{background:#f1f5f9 !important;color:#0f172a !important;transform:none !important}
.qmk-mask button.qmk-nav-pill.is-active,.qmk-mask button.qmk-nav-pill.is-active:hover{background:#1d4ed8 !important;color:#fff !important;border-color:#1d4ed8 !important;box-shadow:0 2px 8px rgba(29,78,216,.24) !important;transform:none !important}
.qmk-studio{display:grid;grid-template-columns:300px minmax(0,1fr);gap:18px;align-items:start}
@media(max-width:900px){.qmk-studio{grid-template-columns:1fr}}
.qmk-panel{background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:15px;display:grid;gap:11px}
.qmk-label{display:grid;gap:5px;font-size:12px;font-weight:600;color:var(--secondary,#475569)}
.qmk-input{padding:7px 10px;border:1px solid var(--border,#cbd5e1);border-radius:9px;background:var(--bg-card,#fff);color:var(--color-data,#0f172a);font-size:12.5px;outline:none}
.qmk-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.qmk-theme-row{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.qmk-mask button.qmk-swatch{min-height:32px !important;height:32px !important;padding:0 8px !important;border-radius:9px !important;border:1.5px solid var(--border,#e2e8f0) !important;background:var(--bg-card,#fff) !important;color:var(--color-data,#334155) !important;font-size:11.5px !important;font-weight:600 !important;display:flex !important;align-items:center;justify-content:center;gap:5px;transform:none !important}
.qmk-mask button.qmk-swatch.is-active,.qmk-mask button.qmk-swatch.is-active:hover{border-color:#2563eb !important;background:#eff6ff !important;color:#1d4ed8 !important;box-shadow:0 0 0 2px rgba(37,99,235,.16) !important;transform:none !important}
.qmk-dot{width:10px;height:10px;border-radius:999px;display:inline-block;flex-shrink:0}
.qmk-check-list{display:grid;gap:5px}
.qmk-check-item{display:flex;gap:8px;align-items:center;padding:6px 10px;border:1px solid var(--border,#e2e8f0);border-radius:9px;background:var(--bg-body,#f8fafc);font-size:12px;color:var(--color-data,#1e293b);cursor:pointer}
.qmk-stage-wrap{display:grid;gap:10px;min-width:0;overflow:hidden}
.qmk-stage{aspect-ratio:16/9;width:100%;max-width:100%;border-radius:14px;overflow:hidden;border:1px solid #cbd5e1;background:#fff;box-shadow:0 16px 36px rgba(15,23,42,.10);display:flex;flex-direction:column;color:#0f172a}
.qmk-filmstrip{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:8px 12px;min-width:0;max-width:100%;box-sizing:border-box}
.qmk-thumbs{display:flex;gap:5px;overflow-x:auto;padding-bottom:2px;flex:1;min-width:0}
.qmk-mask button.qmk-thumb{min-height:26px !important;height:26px !important;padding:0 10px !important;border-radius:999px !important;border:1px solid var(--border,#e2e8f0) !important;background:var(--bg-body,#f8fafc) !important;color:var(--secondary,#475569) !important;font-size:11.5px !important;font-weight:600 !important;white-space:nowrap;flex-shrink:0;transform:none !important}
.qmk-mask button.qmk-thumb.is-active,.qmk-mask button.qmk-thumb.is-active:hover{background:#0f172a !important;color:#fff !important;border-color:#0f172a !important;transform:none !important}
.qmk-mask button.qmk-tab{min-height:30px !important;height:30px !important;padding:0 12px !important;border-radius:999px !important;border:1px solid var(--border,#cbd5e1) !important;background:var(--bg-card,#fff) !important;color:var(--color-data,#334155) !important;font-size:12px !important;font-weight:600 !important;white-space:nowrap;transform:none !important;cursor:pointer}
.qmk-mask button.qmk-tab:hover{background:#f1f5f9 !important;border-color:#94a3b8 !important;transform:none !important}
.qmk-mask button.qmk-tab.is-active,.qmk-mask button.qmk-tab.is-active:hover{background:#0f172a !important;color:#fff !important;border-color:#0f172a !important;transform:none !important}
.qmk-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:720px){.qmk-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.qmk-kpi{background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);border-top:3px solid #2563eb;border-radius:12px;padding:12px 15px;display:grid;gap:3px}
.qmk-kpi span{font-size:11.5px;font-weight:600;color:var(--secondary,#64748b)}
.qmk-kpi strong{font-size:20px;font-weight:750;letter-spacing:-.02em}
.qmk-kpi small{font-size:11.5px;color:var(--secondary,#64748b)}
.qmk-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:var(--bg-card,#fff);padding:10px 14px;border-radius:12px;border:1px solid var(--border,#e2e8f0)}
.qmk-tabs{display:flex;flex-wrap:wrap;gap:6px}
.qmk-table-card{background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);border-radius:12px;overflow-x:auto;flex-shrink:0}
.qmk-table{width:100%;border-collapse:collapse;font-size:12.5px}
.qmk-table th,.qmk-table td{padding:9px 11px;border-bottom:1px solid var(--border,#f1f5f9);text-align:center;white-space:nowrap}
.qmk-table th{background:var(--bg-body,#f8fafc);font-weight:600;color:var(--secondary,#475569);font-size:11.5px;cursor:pointer;user-select:none}
.qmk-table th:first-child,.qmk-table td:first-child{text-align:left;padding-left:15px}
.qmk-table tr.is-own{background:rgba(16,185,129,.08);font-weight:600}
.qmk-metric{display:inline-flex;flex-direction:column;align-items:center;gap:3px;min-width:74px}
.qmk-metric-top{display:inline-flex;align-items:center;gap:4px}
.qmk-meter{width:68px;height:4px;border-radius:999px;background:rgba(148,163,184,.22);overflow:hidden}
.qmk-meter>i{display:block;height:100%;border-radius:999px;background:#2563eb}
.qmk-rk{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;font-size:11px;font-weight:700}
.qmk-rk-1{background:#fef3c7;color:#b45309}
.qmk-rk-2{background:#e2e8f0;color:#334155}
.qmk-rk-3{background:#ffedd5;color:#c2410c}
.qmk-rk-n{background:rgba(148,163,184,.16);color:var(--secondary,#64748b)}
.qmk-tag{display:inline-block;padding:2px 7px;border-radius:999px;font-size:11px;margin-left:4px;font-weight:600}
.qmk-tag-own,.qmk-tier-lead{background:rgba(16,185,129,.14);color:#047857}
.qmk-tag-ext,.qmk-tier-mid{background:rgba(148,163,184,.16);color:var(--secondary,#475569)}
.qmk-tier-weak{background:rgba(239,68,68,.12);color:#dc2626}
.qmk-tier-warn{background:rgba(245,158,11,.14);color:#b45309}
.qmk-plan-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(max-width:760px){.qmk-plan-grid{grid-template-columns:1fr}}
.qmk-plan-card{background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);border-left:4px solid #2563eb;border-radius:12px;padding:14px 16px;display:grid;gap:7px;align-content:start}
.qmk-plan-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.qmk-plan-head strong{font-size:13.5px;color:var(--color-data,#0f172a)}
.qmk-plan-summary{font-size:12.5px;line-height:1.55;color:var(--color-data,#1e293b);background:var(--bg-body,#f8fafc);padding:8px 11px;border-radius:8px}
.qmk-plan-steps{margin:0;padding-left:16px;display:grid;gap:4px;font-size:12px;line-height:1.55;color:var(--secondary,#475569)}
.qmk-chips-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
.qmk-chips-box{background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:14px 16px;display:grid;gap:10px}
.qmk-chips-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;font-weight:600}
.qmk-chips{display:flex;flex-wrap:wrap;gap:6px}
.qmk-chip{padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid var(--border,#e2e8f0)}
.qmk-chip-exc{background:rgba(37,99,235,.08);border-color:rgba(37,99,235,.22);color:#1d4ed8}
.qmk-chip-pass{background:rgba(245,158,11,.10);border-color:rgba(245,158,11,.28);color:#b45309}
.qmk-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 22px;border-top:1px solid var(--border,#e2e8f0);background:var(--bg-card,#fff)}
.qmk-mask button.qmk-btn-primary{min-height:36px !important;padding:0 16px !important;border-radius:10px !important;border:1px solid #0d9488 !important;background:#0d9488 !important;color:#fff !important;font-size:13px !important;font-weight:600 !important;cursor:pointer}
.qmk-mask button.qmk-btn-primary:hover{background:#0f766e !important;border-color:#0f766e !important;color:#fff !important}
.qmk-mask button.qmk-btn-secondary{min-height:36px !important;padding:0 15px !important;border-radius:10px !important;border:1px solid #1d4ed8 !important;background:#eff6ff !important;color:#1d4ed8 !important;font-size:13px !important;font-weight:600 !important;cursor:pointer}
.qmk-mask button.qmk-btn-secondary:hover{background:#dbeafe !important;color:#1e40af !important}
body.dark-mode .qmk-mode-chip,body.dark-mode .qmk-chip-exc{color:#93c5fd}
body.dark-mode .qmk-chip-pass,body.dark-mode .qmk-tier-warn{color:#fcd34d}
body.dark-mode .qmk-tag-own,body.dark-mode .qmk-tier-lead{color:#34d399}
body.dark-mode .qmk-tier-weak{color:#f87171}
`;
        doc.head.appendChild(style);
    }

    function createModalShell(id, title, subtitle) {
        ensureStyles();
        const doc = root.document;
        const existing = doc.getElementById(id);
        if (existing) existing.remove();
        const mask = doc.createElement('div');
        mask.id = id;
        mask.className = 'qmk-mask';
        mask.innerHTML = `<div class="qmk-dialog" role="dialog" aria-modal="true">
            <div class="qmk-head">
                <div class="qmk-head-left"><h3>${escHtml(title)}</h3><span class="qmk-mode-chip" id="${id}-mode-chip"></span></div>
                <div class="qmk-head-right">
                    <div class="qmk-seg" id="${id}-grade-seg"></div>
                    <button type="button" class="qmk-close" aria-label="关闭">&times;</button>
                </div>
            </div>
            <div class="qmk-body"></div>
            <div class="qmk-foot"></div>
        </div>`;
        const onEscKey = (e) => { if (e.key === 'Escape') close(); };
        const close = () => { doc.removeEventListener('keydown', onEscKey); mask.remove(); };
        mask.querySelector('.qmk-close').addEventListener('click', close);
        mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
        doc.addEventListener('keydown', onEscKey);
        doc.body.appendChild(mask);
        return {
            mask,
            modeChip: mask.querySelector(`#${id}-mode-chip`),
            gradeSeg: mask.querySelector(`#${id}-grade-seg`),
            body: mask.querySelector('.qmk-body'),
            foot: mask.querySelector('.qmk-foot'),
            close
        };
    }

    function triggerDownloadBlob(blob, fileName) {
        const url = root.URL.createObjectURL(blob);
        const a = root.document.createElement('a');
        a.href = url;
        a.download = fileName;
        root.document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => root.URL.revokeObjectURL(url), 1500);
    }

    // Crisp, Data-Labelled Bar Chart Preview (Zero Legend Wrapping, Zero Clipping)
    function renderMiniBarChartHtml(chartSpec, heightPx = 155, compact = false) {
        if (!chartSpec || !Array.isArray(chartSpec.categories) || !chartSpec.categories.length) return '';
        const cats = chartSpec.categories.slice(0, compact ? 5 : 6);
        const series = chartSpec.series || [];
        const allVals = series.flatMap((s) => (s.values || []).slice(0, cats.length).map((v) => Number(v) || 0));
        const maxVal = Math.max(...allVals, 10) * 1.12;
        const legend = series.map((s) => `<span style="display:inline-flex;align-items:center;gap:4px;font-size:9.5px;color:#475569;white-space:nowrap;"><i style="width:7px;height:7px;border-radius:2px;background:#${s.color || '1D4ED8'};display:inline-block;"></i>${escHtml(s.name)}</span>`).join('');
        const cols = cats.map((cat, cIdx) => {
            const bars = series.map((s) => {
                const v = Number(s.values?.[cIdx]) || 0;
                const hPct = Math.max(5, Math.min(96, Math.round((v / maxVal) * 100)));
                const vLabel = v >= 100 ? Math.round(v) : Number(v.toFixed(1));
                return `<div style="flex:1;max-width:${compact ? '18px' : '20px'};height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;">
                    <span style="font-size:${compact ? '8px' : '8.5px'};color:#334155;font-weight:600;line-height:1.1;margin-bottom:2px;">${vLabel}</span>
                    <div style="width:100%;height:${hPct}%;background:#${s.color || '1D4ED8'};border-radius:3px 3px 0 0;"></div>
                </div>`;
            }).join('');
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;min-width:0;">
                <div style="width:100%;flex:1;display:flex;align-items:flex-end;justify-content:center;gap:3px;border-bottom:1px solid #cbd5e1;padding:0 2px;">${bars}</div>
                <div style="font-size:9.5px;color:#475569;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;" title="${escHtml(cat)}">${escHtml(String(cat).slice(0, 5))}</div>
            </div>`;
        }).join('');
        return `<div style="border:1px solid #e2e8f0;border-radius:9px;padding:8px 10px;background:#fff;display:flex;flex-direction:column;gap:5px;height:${heightPx}px;box-sizing:border-box;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-shrink:0;">
                <strong style="font-size:10.5px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(chartSpec.title || '')}</strong>
                <div style="display:flex;gap:8px;flex-shrink:0;">${legend}</div>
            </div>
            <div style="flex:1;display:flex;gap:6px;align-items:flex-end;min-height:0;background:repeating-linear-gradient(to top,transparent,transparent 24%,#f1f5f9 24%,#f1f5f9 25%);">${cols}</div>
        </div>`;
    }

    // Zero-Truncation Compact Preview Table (table-layout: fixed, ellipsis-safe)
    function renderMiniTableHtml(headers, rows, theme, maxRows = 7) {
        return `<table style="width:100%;border-collapse:collapse;font-size:9.5px;table-layout:fixed;">
            <thead><tr>${(headers || []).map((h, idx) => `<th style="background:#${theme.tblHead};color:#fff;padding:4.5px 3px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${idx === 0 ? 'width:24%;' : ''}">${escHtml(h)}</th>`).join('')}</tr></thead>
            <tbody>${(rows || []).slice(0, maxRows).map((r, i) => `<tr style="background:${r.isEmph ? `#${theme.rowTint};font-weight:700;` : (i % 2 ? '#f8fafc' : '#fff')}">${(r.cells || r).map((c) => `<td style="padding:3.5px 3px;border-bottom:1px solid #e2e8f0;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
    }

    function renderSlidePreviewHtml(slide, theme, pageNo, total) {
        if (!slide) return '';
        if (slide.kind === 'cover' || slide.kind === 'closing') {
            return `<div style="flex:1;background:#${theme.bg};color:#fff;padding:8% 9%;display:flex;flex-direction:column;justify-content:center;gap:14px;${slide.kind === 'closing' ? 'align-items:center;text-align:center;' : ''}">
                ${slide.kind === 'cover' ? `<div style="width:52px;height:4px;border-radius:99px;background:#${theme.accent2};"></div>` : ''}
                <div style="font-size:23px;font-weight:750;line-height:1.25;letter-spacing:-.01em;">${escHtml(slide.title)}</div>
                <div style="font-size:13.5px;color:#93c5fd;">${escHtml(slide.subtitle)}</div>
                ${slide.meta ? `<div style="font-size:11px;color:#cbd5e1;margin-top:6px;line-height:1.55;">${escHtml(slide.meta)}</div>` : ''}
            </div>`;
        }
        const headHtml = `<div style="background:#${theme.bg};color:#fff;padding:9px 16px;border-bottom:3px solid #${theme.accent};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="min-width:0;"><div style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(slide.title)}</div><div style="font-size:10px;color:#93c5fd;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(slide.subtitle || '')}</div></div>
            <div style="font-size:10.5px;color:#94a3b8;flex-shrink:0;margin-left:10px;">${pageNo} / ${total}</div>
        </div>`;
        const kpiRow = (kpis) => `<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;flex-shrink:0;">
            ${(kpis || []).map((k) => `<div style="background:#${theme.soft};border-radius:8px;padding:6px 10px;border:1px solid #cbd5e1;min-width:0;"><div style="font-size:9.5px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(k.label)}</div><div style="font-size:13px;font-weight:750;color:#${k.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(k.val)}</div></div>`).join('')}
        </div>`;

        if (slide.kind === 'overview') {
            return `${headHtml}<div style="flex:1;padding:12px 16px;display:flex;flex-direction:column;gap:10px;background:#fff;min-height:0;">
                ${kpiRow(slide.kpis)}
                <div style="flex:1;display:grid;grid-template-columns:1.05fr 1fr;gap:10px;min-height:0;">
                    ${renderMiniBarChartHtml(slide.chart, 215)}
                    <div style="background:#${theme.soft};border-radius:9px;padding:10px 12px;border:1px solid #cbd5e1;font-size:10px;line-height:1.58;color:#1e293b;overflow:hidden;">
                        <div style="font-weight:700;color:#${theme.tblHead};margin-bottom:5px;font-size:11px;">核心诊断与全镇定位研判</div>
                        ${slide.diagnostics.map((d) => `<div style="margin-bottom:4px;">${escHtml(d)}</div>`).join('')}
                    </div>
                </div>
            </div>`;
        }
        if (slide.kind === 'splitChartTable') {
            return `${headHtml}<div style="flex:1;padding:12px 16px;display:grid;grid-template-columns:0.95fr 1.15fr;gap:12px;align-items:start;background:#fff;overflow:hidden;min-height:0;">
                ${renderMiniBarChartHtml(slide.chart, 265)}
                <div style="overflow:hidden;border:1px solid #e2e8f0;border-radius:8px;">${renderMiniTableHtml(slide.headers, slide.rows, theme, 8)}</div>
            </div>`;
        }
        if (slide.kind === 'subjectDashboard') {
            return `${headHtml}<div style="flex:1;padding:9px 16px;display:flex;flex-direction:column;gap:7px;background:#fff;overflow:hidden;min-height:0;">
                ${kpiRow(slide.kpis)}
                <div style="flex:1;display:grid;grid-template-columns:0.92fr 1.08fr;gap:10px;align-items:stretch;min-height:0;">
                    ${renderMiniBarChartHtml(slide.classChart, 188)}
                    <div style="display:flex;flex-direction:column;gap:6px;min-width:0;">
                        ${renderMiniBarChartHtml(slide.teacherChart, 88, true)}
                        <div style="overflow:hidden;border:1px solid #e2e8f0;border-radius:7px;">${renderMiniTableHtml(slide.headers, slide.rows, theme, 4)}</div>
                    </div>
                </div>
                <div style="background:#${theme.soft};border:1px solid #cbd5e1;border-radius:6px;padding:4.5px 9px;font-size:9.5px;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;">${escHtml(slide.footerNote)}</div>
            </div>`;
        }
        if (slide.kind === 'table') {
            return `${headHtml}<div style="flex:1;padding:12px 16px;overflow:hidden;display:flex;flex-direction:column;gap:8px;background:#fff;">
                <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">${renderMiniTableHtml(slide.headers, slide.rows, theme, 8)}</div>
                ${slide.footerNote ? `<div style="font-size:10px;color:#475569;">${escHtml(slide.footerNote)}</div>` : ''}
            </div>`;
        }
        if (slide.kind === 'charts') {
            return `${headHtml}<div style="flex:1;padding:14px 18px;display:flex;gap:12px;align-items:center;justify-content:center;background:#fff;">
                ${(slide.images || []).map((img) => `<img src="data:image/png;base64,${img.base64}" alt="${escHtml(img.title)}" style="max-height:100%;max-width:${slide.images.length > 1 ? '48%' : '92%'};object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;">`).join('')}
            </div>`;
        }
        if (slide.kind === 'actionPlan') {
            return `${headHtml}<div style="flex:1;padding:11px 16px;display:grid;grid-template-columns:1fr 1fr;gap:9px;background:#fff;align-content:start;">
                ${(slide.actions || []).slice(0, 4).map((a, i) => `<div style="background:#${theme.soft};border:1px solid #cbd5e1;border-left:3px solid #${theme.accent};border-radius:8px;padding:8px 10px;font-size:9.8px;line-height:1.48;">
                    <div style="font-weight:700;color:#${theme.tblHead};margin-bottom:3px;">${i + 1}. ${escHtml(a.dimension)}（${escHtml(a.owner)}）</div>
                    <div style="color:#0f172a;margin-bottom:3px;">${escHtml(a.summary)}</div>
                    ${(a.steps || []).slice(0, 2).map((st) => `<div style="color:#475569;">• ${escHtml(st)}</div>`).join('')}
                </div>`).join('')}
            </div>`;
        }
        return `${headHtml}<div style="flex:1;padding:12px 18px;display:grid;gap:10px;background:#fff;align-content:start;">
            <div style="background:#eff6ff;border-radius:9px;padding:10px 14px;font-size:11px;line-height:1.6;"><div style="font-weight:700;color:#1d4ed8;margin-bottom:4px;">${escHtml(slide.excTitle)}</div><div>${escHtml(slide.excNames)}</div></div>
            <div style="background:#fffbeb;border-radius:9px;padding:10px 14px;font-size:11px;line-height:1.6;"><div style="font-weight:700;color:#b45309;margin-bottom:4px;">${escHtml(slide.passTitle)}</div><div>${escHtml(slide.passNames)}</div></div>
        </div>`;
    }

    function bindHeaderGradeSeg(modal, currentGrade, gradeProfile, onGradeChange) {
        modal.modeChip.textContent = gradeProfile.shortTag;
        modal.modeChip.title = gradeProfile.formulaDesc;
        modal.gradeSeg.innerHTML = ['6', '7', '8', '9'].map((g) => `<button type="button" class="qmk-grade-pill ${g === currentGrade ? 'is-active' : ''}" data-qmk-grade="${g}">${g}年级</button>`).join('');
        modal.gradeSeg.querySelectorAll('[data-qmk-grade]').forEach((btn) => btn.addEventListener('click', () => onGradeChange(btn.dataset.qmkGrade)));
    }

    // -------------------------------------------------------------------------
    // UI Entry 1: Quality Analysis Meeting PPT Studio
    // -------------------------------------------------------------------------
    function openQualityMeetingPptModal(options = {}) {
        const allRows = getAllRows();
        if (!allRows.length) {
            toast('请先上传成绩数据', 'error');
            return false;
        }
        const mySchool = getMySchoolName(allRows);
        const state = {
            grade: resolveCurrentGradeNumber(options.grade),
            examTitle: getExamTitle(),
            presenter: `${mySchool}教务处`,
            theme: 'navy',
            useTownshipLine: true,
            include: { overview: true, gradeSpecial: true, townPosition: true, classRank: true, townBenchmark: true, subjects: true, charts: true, borderline: true, actionPlan: true },
            previewIdx: 0
        };
        const modal = createModalShell('qmk-ppt-modal', '质量分析会 PPT 课件工作室', '');

        // The deck model is expensive (township matrix + teacher handbook rows re-run the
        // system engines), so it is cached per model-affecting state; slide navigation
        // reuses the cache and only repaints the stage.
        let cachedDeck = null;
        let cachedDeckKey = '';
        function getDeck() {
            const key = JSON.stringify([state.grade, state.examTitle, state.presenter, state.theme, state.useTownshipLine, state.include]);
            if (!cachedDeck || cachedDeckKey !== key) {
                cachedDeck = buildMeetingDeckModel(state);
                cachedDeckKey = key;
            }
            return cachedDeck;
        }

        function updatePreview(deck) {
            const stage = modal.body.querySelector('.qmk-stage');
            if (!stage) return;
            stage.innerHTML = renderSlidePreviewHtml(deck.slides[state.previewIdx], deck.theme, state.previewIdx + 1, deck.slides.length);
            const prevBtn = modal.body.querySelector('#qmk-prev-slide');
            const nextBtn = modal.body.querySelector('#qmk-next-slide');
            if (prevBtn) prevBtn.disabled = state.previewIdx <= 0;
            if (nextBtn) nextBtn.disabled = state.previewIdx >= deck.slides.length - 1;
            modal.body.querySelectorAll('[data-qmk-page]').forEach((btn) => {
                const active = Number(btn.dataset.qmkPage) === state.previewIdx;
                btn.classList.toggle('is-active', active);
                if (active && typeof btn.scrollIntoView === 'function') btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        }

        function render() {
            const deck = getDeck();
            const gp = deck.gradeProfile;
            if (state.previewIdx >= deck.slides.length) state.previewIdx = deck.slides.length - 1;
            const currentSlide = deck.slides[state.previewIdx];

            bindHeaderGradeSeg(modal, state.grade, gp, (nextGrade) => { state.grade = nextGrade; render(); });

            const slideChecks = [
                { key: 'overview', label: '总体概览与各科均分对比' },
                { key: 'gradeSpecial', label: gp.grade === '9' ? '9年级专项（490+·指标·后1/3）' : `${gp.grade}年级专项（综合与后1/3）` },
                { key: 'townPosition', label: '全镇校际定位与学科诊断' },
                { key: 'classRank', label: `班级总分左图右表（满分${gp.weights.total}）` },
                { key: 'subjects', label: `分学科双图表看板（${deck.subjects.length}科）` },
                { key: 'borderline', label: '临界生抓手与提分测算' },
                { key: 'actionPlan', label: `下阶段 4 维整改措施` }
            ];

            modal.body.innerHTML = `<div class="qmk-studio">
                <div class="qmk-panel">
                    <label class="qmk-label">汇报主标题<input class="qmk-input" id="qmk-ppt-title" value="${escHtml(state.examTitle)}"></label>
                    <label class="qmk-label">汇报单位 / 汇报人<input class="qmk-input" id="qmk-ppt-presenter" value="${escHtml(state.presenter)}"></label>
                    <div class="qmk-label">视觉主题
                        <div class="qmk-theme-row">
                            ${Object.entries(PPT_THEMES).map(([k, t]) => `<button type="button" class="qmk-swatch ${k === state.theme ? 'is-active' : ''}" data-qmk-theme="${k}"><span class="qmk-dot" style="background:#${t.bg};"></span>${escHtml(t.name)}</button>`).join('')}
                        </div>
                    </div>
                    <label class="qmk-check-item" style="justify-content:space-between;">
                        <span>全镇划线（优 ${deck.thresholdInfo.thresholds['总分'].exc} / 及 ${deck.thresholdInfo.thresholds['总分'].pass}）</span>
                        <input type="checkbox" id="qmk-use-township-line" ${deck.thresholdInfo.source === 'township' ? 'checked' : ''} ${deck.thresholdInfo.hasTownship ? '' : 'disabled'}>
                    </label>
                    <div class="qmk-label">课件章节（共 ${deck.slides.length} 页）
                        <div class="qmk-check-list">
                            ${slideChecks.map((item) => `<label class="qmk-check-item"><input type="checkbox" data-qmk-slide="${item.key}" ${state.include[item.key] ? 'checked' : ''}><span>${escHtml(item.label)}</span></label>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="qmk-stage-wrap">
                    <div class="qmk-stage">${renderSlidePreviewHtml(currentSlide, deck.theme, state.previewIdx + 1, deck.slides.length)}</div>
                    <div class="qmk-filmstrip">
                        <div style="display:flex;gap:5px;flex-shrink:0;">
                            <button type="button" class="qmk-tab" id="qmk-prev-slide" ${state.previewIdx <= 0 ? 'disabled' : ''}>‹ 上页</button>
                            <button type="button" class="qmk-tab" id="qmk-next-slide" ${state.previewIdx >= deck.slides.length - 1 ? 'disabled' : ''}>下页 ›</button>
                        </div>
                        <div class="qmk-thumbs">
                            ${deck.slides.map((s, i) => `<button type="button" class="qmk-thumb ${i === state.previewIdx ? 'is-active' : ''}" data-qmk-page="${i}">${i + 1}. ${escHtml(s.subject || s.title.slice(0, 5))}</button>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`;

            modal.foot.innerHTML = `
                <span style="font-size:12px;color:var(--secondary,#64748b);">口径：${escHtml(gp.formulaDesc)}</span>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="qmk-btn-secondary" id="qmk-btn-handbook">导出 10 表教师分析手册 (Excel)</button>
                    <button type="button" class="qmk-btn-primary" id="qmk-btn-download-ppt">下载质量分析会 PPT（${deck.slides.length} 页）</button>
                </div>`;

            modal.body.querySelector('#qmk-ppt-title').addEventListener('change', (e) => { state.examTitle = e.target.value.trim() || getExamTitle(); render(); });
            modal.body.querySelector('#qmk-ppt-presenter').addEventListener('change', (e) => { state.presenter = e.target.value.trim() || `${mySchool}教务处`; render(); });
            modal.body.querySelectorAll('[data-qmk-theme]').forEach((btn) => btn.addEventListener('click', () => { state.theme = btn.dataset.qmkTheme; render(); }));
            modal.body.querySelector('#qmk-use-township-line').addEventListener('change', (e) => { state.useTownshipLine = e.target.checked; render(); });
            modal.body.querySelectorAll('[data-qmk-slide]').forEach((el) => el.addEventListener('change', () => {
                state.include[el.dataset.qmkSlide] = el.checked;
                if (el.dataset.qmkSlide === 'classRank') state.include.townBenchmark = el.checked;
                render();
            }));
            modal.body.querySelectorAll('[data-qmk-page]').forEach((btn) => btn.addEventListener('click', () => { state.previewIdx = Number(btn.dataset.qmkPage); updatePreview(deck); }));
            modal.body.querySelector('#qmk-prev-slide').addEventListener('click', () => { if (state.previewIdx > 0) { state.previewIdx -= 1; updatePreview(deck); } });
            modal.body.querySelector('#qmk-next-slide').addEventListener('click', () => { if (state.previewIdx < deck.slides.length - 1) { state.previewIdx += 1; updatePreview(deck); } });
            modal.foot.querySelector('#qmk-btn-handbook').addEventListener('click', () => exportTeacherAnalysisHandbookExcel({ grade: state.grade, useTownshipLine: state.useTownshipLine, examTitle: state.examTitle }));
            modal.foot.querySelector('#qmk-btn-download-ppt').addEventListener('click', async () => {
                try {
                    const result = await buildMeetingPptxBlob(state);
                    triggerDownloadBlob(result.payload, result.fileName);
                    toast(`已生成 ${result.slideCount} 页课件（含 ${result.chartCount} 个原生图表）：${result.fileName}`, 'success');
                } catch (err) {
                    toast(`生成 PPT 失败：${err?.message || err}`, 'error');
                }
            });
        }
        render();
        return true;
    }

    // -------------------------------------------------------------------------
    // UI Entry 2: 3-Tab Township Decision, Class Benchmark & Borderline Workbench
    // -------------------------------------------------------------------------
    function openClassTownshipBenchmarkModal(options = {}) {
        const allRows = getAllRows();
        if (!allRows.length) {
            toast('请先上传成绩数据', 'error');
            return false;
        }
        const mySchool = getMySchoolName(allRows);
        const mySchoolRows = allRows.filter((r) => sameSchool(r?.school, mySchool));
        const activeRows = mySchoolRows.length ? mySchoolRows : allRows;
        const ownClasses = Array.from(new Set(activeRows.map((r) => String(r?.class || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
        const modal = createModalShell('qmk-bench-modal', '镇域定位、班级对标与整改决策工作台', '');

        let currentGrade = resolveCurrentGradeNumber(options.grade);
        let activeTab = 'strategy';
        let currentSubject = '总分';
        let useTownshipLine = true;
        let sortKey = 'score';
        let sortDir = -1;
        let margin = DEFAULT_MARGIN;
        let classFilter = '';

        function tierClass(tier) {
            if (tier === '优势领跑') return 'qmk-tier-lead';
            if (tier === '重点短板') return 'qmk-tier-weak';
            if (tier === '保底预警' || tier === '冲优潜力') return 'qmk-tier-warn';
            return 'qmk-tier-mid';
        }

        // The township matrix and per-subject diagnosis re-run the system engines, so they are
        // cached per grade + threshold-line choice; sort / tab / margin / filter interactions reuse it.
        const analysisCache = new Map();
        function getAnalysis(gradeProfile) {
            const key = `${gradeProfile.grade}::${useTownshipLine ? 'town' : 'school'}`;
            let cached = analysisCache.get(key);
            if (!cached) {
                const subjectPolicy = getDisplayAndOfficialSubjects(allRows, gradeProfile);
                const subjects = subjectPolicy.allSubjects;
                const thInfo = resolveThresholds(allRows, activeRows, subjects, useTownshipLine);
                const overallTotal = calcGroupMetrics(activeRows, '总分', thInfo.thresholds['总分']);
                const classTotalRows = buildClassRows(activeRows, '总分', thInfo.thresholds['总分'], gradeProfile);
                const townMatrix = buildTownshipSchoolMatrix(allRows, mySchool, subjects, thInfo.thresholds, gradeProfile);
                const subjectDiag = buildSubjectDiagnosis(townMatrix, activeRows, subjects, thInfo.thresholds, gradeProfile, subjectPolicy.displayOnlySubjects);
                cached = { subjects, thInfo, overallTotal, classTotalRows, townMatrix, subjectDiag, benchBySubject: new Map() };
                analysisCache.set(key, cached);
            }
            return cached;
        }

        function render() {
            const gradeProfile = getGradeAnalysisProfile(currentGrade, allRows);
            bindHeaderGradeSeg(modal, currentGrade, gradeProfile, (nextGrade) => { currentGrade = nextGrade; render(); });

            const analysis = getAnalysis(gradeProfile);
            const { subjects, thInfo, overallTotal, classTotalRows, townMatrix, subjectDiag } = analysis;
            if (currentSubject !== '总分' && !subjects.includes(currentSubject)) currentSubject = '总分';
            const th = thInfo.thresholds[currentSubject] || { exc: 0, pass: 0 };
            const overallSubj = calcGroupMetrics(activeRows, currentSubject, th);
            const totalBorderline = buildBorderlineChips(activeRows, '总分', thInfo.thresholds['总分'], margin);
            const actionPlan = buildActionPlan(townMatrix, subjectDiag, classTotalRows, totalBorderline, overallTotal, gradeProfile);
            const getBenchRows = () => {
                let rows = analysis.benchBySubject.get(currentSubject);
                if (!rows) {
                    rows = thInfo.hasTownship
                        ? buildClassTownshipBenchmark(allRows, mySchool, currentSubject, th, gradeProfile)
                        : buildClassRows(activeRows, currentSubject, th, gradeProfile).map((c) => ({ ...c, kind: 'own-class' }));
                    analysis.benchBySubject.set(currentSubject, rows);
                }
                return rows;
            };

            const navHtml = `<div class="qmk-nav-row">
                <div class="qmk-nav-pills">
                    <button type="button" class="qmk-nav-pill ${activeTab === 'strategy' ? 'is-active' : ''}" data-qmk-tab="strategy">全镇定位与整改方向</button>
                    <button type="button" class="qmk-nav-pill ${activeTab === 'benchmark' ? 'is-active' : ''}" data-qmk-tab="benchmark">本校班级镇域对标</button>
                    <button type="button" class="qmk-nav-pill ${activeTab === 'borderline' ? 'is-active' : ''}" data-qmk-tab="borderline">临界生名单与提分测算</button>
                </div>
                <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--secondary,#475569);cursor:pointer;">
                    <input type="checkbox" id="qmk-bench-town-line" ${thInfo.source === 'township' ? 'checked' : ''} ${thInfo.hasTownship ? '' : 'disabled'}>
                    ${thInfo.source === 'township' ? `全镇统一划线（${thInfo.schoolCount}校）` : '校内划线'}
                </label>
            </div>`;

            let contentHtml = '';
            if (activeTab === 'strategy') {
                const own = townMatrix.ownTotal;
                const rankText = townMatrix.hasTownship && own ? `第 ${own.comprehensiveRank} / ${townMatrix.totalSchools} 名` : '单校模式';
                const targetText = townMatrix.targetAhead ? `差 ${townMatrix.compGapToAhead} 分` : (townMatrix.hasTownship ? '全镇领跑' : '—');
                const targetSub = townMatrix.targetAhead ? `追赶：${townMatrix.targetAhead.name}（均分差 ${townMatrix.gapToAhead}）` : (townMatrix.hasTownship ? '当前稳居第一' : '导入多校解锁对标');
                const thirdTitle = gradeProfile.grade === '9' ? '490+高分 · 后1/3托底' : '后1/3有效分托底(40)';
                const thirdVal = gradeProfile.grade === '9'
                    ? (own ? `${own.highCount490}人 · #${own.rankBottom}` : '—')
                    : (own ? `${own.scoreBottom} 分 (#${own.rankBottom})` : '—');
                const thirdSub = gradeProfile.grade === '9'
                    ? (own ? `高分赋${own.scoreHigh490} · 指标${own.scoreIndicator} · 后1/3赋${own.scoreBottom}` : '九年级专项')
                    : (own ? `有效后1/3均分 ${own.bottom3?.avg || 0} 分` : '后1/3托底核算');

                contentHtml = `
                    <div class="qmk-kpis">
                        <div class="qmk-kpi" style="border-top-color:#2563eb;"><span>全镇综合总分位次</span><strong style="color:#1d4ed8;">${rankText}</strong><small>${own ? `综合 ${own.comprehensiveTotal} 分 · 两率一分 ${own.score2Rate} (#${own.scoreRank})` : `均分 ${overallTotal.avg}`}</small></div>
                        <div class="qmk-kpi" style="border-top-color:#f59e0b;"><span>距前一名追赶校</span><strong style="color:#d97706;">${targetText}</strong><small>${escHtml(targetSub)}</small></div>
                        <div class="qmk-kpi" style="border-top-color:#10b981;"><span>${escHtml(thirdTitle)}</span><strong style="color:#059669;">${escHtml(thirdVal)}</strong><small>${escHtml(thirdSub)}</small></div>
                        <div class="qmk-kpi" style="border-top-color:#8b5cf6;"><span>临界生转化潜力</span><strong style="color:#6d28d9;">优 +${actionPlan.excGain}% / 及 +${actionPlan.passGain}%</strong><small>优边 ${totalBorderline.excMarginal.length} 人 · 及边 ${totalBorderline.passMarginal.length} 人</small></div>
                    </div>
                    <div class="qmk-table-card">
                        <table class="qmk-table">
                            <thead><tr><th>学科</th><th>属性</th><th>本校均分</th><th>全镇均分</th><th>较镇均差</th><th>两率一分(${gradeProfile.weights.total})</th><th>全镇位次</th><th>优率差</th><th>及格差</th><th>常规极差</th><th>强弱判定</th></tr></thead>
                            <tbody>
                                ${subjectDiag.map((d) => `<tr class="${d.tier === '优势领跑' ? 'is-own' : ''}">
                                    <td><strong>${escHtml(d.subject)}</strong></td>
                                    <td><span class="qmk-tag ${d.isDisplayOnly ? 'qmk-tier-warn' : (d.isMajor ? 'qmk-tag-own' : 'qmk-tag-ext')}">${escHtml(d.roleLabel)}</span></td>
                                    <td>${d.ownAvg}</td>
                                    <td>${d.townAvg}</td>
                                    <td style="color:${d.avgDiff >= 0 ? '#059669' : '#dc2626'};font-weight:700;">${d.avgDiff >= 0 ? '+' : ''}${d.avgDiff}</td>
                                    <td><strong>${d.score2Rate}</strong></td>
                                    <td>${buildInlineRankBadgeHtml(d.rank)} <span style="font-size:11px;color:#64748b;">/${d.totalSchools}</span></td>
                                    <td style="color:${d.excDiff >= 0 ? '#059669' : '#dc2626'};">${d.excDiff >= 0 ? '+' : ''}${d.excDiff}%</td>
                                    <td style="color:${d.passDiff >= 0 ? '#059669' : '#dc2626'};">${d.passDiff >= 0 ? '+' : ''}${d.passDiff}%</td>
                                    <td>${d.classSpread}</td>
                                    <td><span class="qmk-tag ${tierClass(d.tier)}">${escHtml(d.tier)}</span></td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="qmk-bar" style="padding:9px 14px;">
                        <strong style="font-size:13px;">下阶段 4 维提质方向与整改措施（${escHtml(gradeProfile.shortTag)}）</strong>
                        <button type="button" class="qmk-tab" id="qmk-copy-plan">一键复制会议发言稿</button>
                    </div>
                    <div class="qmk-plan-grid">
                        ${actionPlan.actions.map((a, idx) => `<div class="qmk-plan-card" style="border-left-color:${['#2563eb', '#0d9488', '#f59e0b', '#7c3aed'][idx % 4]};">
                            <div class="qmk-plan-head"><strong>${idx + 1}. ${escHtml(a.dimension)}</strong><span class="qmk-tag qmk-tag-ext">${escHtml(a.owner)}</span></div>
                            <div class="qmk-plan-summary">${escHtml(a.summary)}</div>
                            <ul class="qmk-plan-steps">${(a.steps || []).map((st) => `<li>${escHtml(st)}</li>`).join('')}</ul>
                        </div>`).join('')}
                    </div>`;
            } else if (activeTab === 'benchmark') {
                const rawBench = getBenchRows();
                const benchRows = rawBench.slice().sort((a, b) => sortDir * ((Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0)));
                const maxAvg = Math.max(...benchRows.map((r) => Number(r.avg) || 0), 1);
                const sortArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '');
                contentHtml = `
                    <div class="qmk-kpis">
                        <div class="qmk-kpi" style="border-top-color:#0f172a;"><span>${escHtml(mySchool)} · ${escHtml(currentSubject)}</span><strong>${overallSubj.count} 人</strong></div>
                        <div class="qmk-kpi" style="border-top-color:#2563eb;"><span>本校平均分</span><strong style="color:#1d4ed8;">${overallSubj.avg}</strong></div>
                        <div class="qmk-kpi" style="border-top-color:#10b981;"><span>优秀率（线 ${th.exc}）</span><strong style="color:#059669;">${overallSubj.excRate}%</strong></div>
                        <div class="qmk-kpi" style="border-top-color:#f59e0b;"><span>及格率（线 ${th.pass}）</span><strong style="color:#d97706;">${overallSubj.passRate}%</strong></div>
                    </div>
                    <div class="qmk-bar">
                        <div class="qmk-tabs">${['总分', ...subjects].map((s) => `<button type="button" class="qmk-tab ${s === currentSubject ? 'is-active' : ''}" data-qmk-subj="${escHtml(s)}">${escHtml(s)}</button>`).join('')}</div>
                        <button type="button" class="qmk-tab" id="qmk-export-bench">导出对标 Excel</button>
                    </div>
                    <div class="qmk-table-card">
                        <table class="qmk-table">
                            <thead><tr>
                                <th>班级 / 学校</th>
                                <th data-qmk-sort="count">人数${sortArrow('count')}</th>
                                <th data-qmk-sort="avg">均分${sortArrow('avg')}</th>
                                <th data-qmk-sort="excRate">优秀率${sortArrow('excRate')}</th>
                                <th data-qmk-sort="passRate">及格率${sortArrow('passRate')}</th>
                                <th data-qmk-sort="score">两率一分(${gradeProfile.weights.total})${sortArrow('score')}</th>
                            </tr></thead>
                            <tbody>
                                ${benchRows.map((r) => `<tr class="${r.kind === 'own-class' ? 'is-own' : ''}">
                                    <td>${escHtml(r.name)}<span class="qmk-tag ${r.kind === 'own-class' ? (r.isSmallClass ? 'qmk-tier-warn' : 'qmk-tag-own') : 'qmk-tag-ext'}">${r.kind === 'own-class' ? (r.isSmallClass ? '小样本班' : '本校班级') : '外校'}</span></td>
                                    <td>${r.count}</td>
                                    <td><div class="qmk-metric"><div class="qmk-metric-top"><span>${r.avg}</span>${buildInlineRankBadgeHtml(r.avgRank)}</div><div class="qmk-meter"><i style="width:${Math.min(100, Math.round((r.avg / maxAvg) * 100))}%;"></i></div></div></td>
                                    <td><div class="qmk-metric"><div class="qmk-metric-top"><span>${r.excRate}%</span>${buildInlineRankBadgeHtml(r.excRank)}</div><div class="qmk-meter"><i style="width:${Math.min(100, Math.round(r.excRate))}%;background:#10b981;"></i></div></div></td>
                                    <td><div class="qmk-metric"><div class="qmk-metric-top"><span>${r.passRate}%</span>${buildInlineRankBadgeHtml(r.passRank)}</div><div class="qmk-meter"><i style="width:${Math.min(100, Math.round(r.passRate))}%;background:#f59e0b;"></i></div></div></td>
                                    <td><div class="qmk-metric-top"><strong>${r.score}</strong>${buildInlineRankBadgeHtml(r.scoreRank)}</div></td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>`;
            } else {
                const filteredRows = classFilter ? activeRows.filter((r) => String(r?.class || '').trim() === classFilter) : activeRows;
                const chips = buildBorderlineChips(filteredRows, currentSubject, th, margin);
                const baseCount = Math.max(1, filteredRows.length);
                const excLift = ((chips.excMarginal.length / baseCount) * 100).toFixed(1);
                const passLift = ((chips.passMarginal.length / baseCount) * 100).toFixed(1);
                contentHtml = `
                    <div class="qmk-bar">
                        <div class="qmk-tabs">${['总分', ...subjects].map((s) => `<button type="button" class="qmk-tab ${s === currentSubject ? 'is-active' : ''}" data-qmk-subj="${escHtml(s)}">${escHtml(s)}</button>`).join('')}</div>
                        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12.5px;">
                            <select class="qmk-input" id="qmk-chip-class" style="padding:4px 8px;">
                                <option value="">全部班级</option>
                                ${ownClasses.map((c) => `<option value="${escHtml(c)}" ${c === classFilter ? 'selected' : ''}>${escHtml(c)}</option>`).join('')}
                            </select>
                            <select class="qmk-input" id="qmk-chip-margin" style="padding:4px 8px;">
                                ${[5, 10, 15, 20].map((m) => `<option value="${m}" ${m === margin ? 'selected' : ''}>容差 ±${m} 分</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="qmk-chips-grid">
                        <div class="qmk-chips-box">
                            <div class="qmk-chips-head">
                                <span>优秀边缘生（${(chips.exc - chips.margin).toFixed(1)}~${chips.exc}，${chips.excMarginal.length} 人 · 转化可提 +${excLift}%）</span>
                                <button type="button" class="qmk-tab" data-qmk-copy="exc">一键复制</button>
                            </div>
                            <div class="qmk-chips">${chips.excMarginal.length ? chips.excMarginal.map((s) => `<span class="qmk-chip qmk-chip-exc">${escHtml(s.name)} · ${escHtml(s.class)} · ${s.score}（差${s.gapToExc}）</span>`).join('') : '<span style="color:#64748b;font-size:12px;">当前条件下暂无</span>'}</div>
                        </div>
                        <div class="qmk-chips-box">
                            <div class="qmk-chips-head">
                                <span>及格边缘生（${(chips.pass - chips.margin).toFixed(1)}~${chips.pass}，${chips.passMarginal.length} 人 · 转化可提 +${passLift}%）</span>
                                <button type="button" class="qmk-tab" data-qmk-copy="pass">一键复制</button>
                            </div>
                            <div class="qmk-chips">${chips.passMarginal.length ? chips.passMarginal.map((s) => `<span class="qmk-chip qmk-chip-pass">${escHtml(s.name)} · ${escHtml(s.class)} · ${s.score}（差${s.gapToPass}）</span>`).join('') : '<span style="color:#64748b;font-size:12px;">当前条件下暂无</span>'}</div>
                        </div>
                    </div>`;
            }

            modal.body.innerHTML = navHtml + contentHtml;

            modal.body.querySelectorAll('[data-qmk-tab]').forEach((btn) => btn.addEventListener('click', () => { activeTab = btn.dataset.qmkTab; render(); }));
            const townToggle = modal.body.querySelector('#qmk-bench-town-line');
            if (townToggle) townToggle.addEventListener('change', () => { useTownshipLine = townToggle.checked; render(); });
            modal.body.querySelectorAll('[data-qmk-subj]').forEach((btn) => btn.addEventListener('click', () => { currentSubject = btn.dataset.qmkSubj; render(); }));
            modal.body.querySelectorAll('[data-qmk-sort]').forEach((thEl) => thEl.addEventListener('click', () => {
                const k = thEl.dataset.qmkSort;
                if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = -1; }
                render();
            }));
            const copyPlanBtn = modal.body.querySelector('#qmk-copy-plan');
            if (copyPlanBtn) {
                copyPlanBtn.addEventListener('click', async () => {
                    const txt = formatActionPlanCopyText(getExamTitle(), mySchool, actionPlan, gradeProfile);
                    try { await root.navigator.clipboard.writeText(txt); toast('会议发言稿与整改措施已复制', 'success'); } catch (_) { toast(txt, 'info'); }
                });
            }
            const expBenchBtn = modal.body.querySelector('#qmk-export-bench');
            if (expBenchBtn) {
                expBenchBtn.addEventListener('click', () => {
                    exportBenchmarkExcel(getBenchRows(), currentSubject, getExamTitle(), gradeProfile);
                });
            }
            const clsSel = modal.body.querySelector('#qmk-chip-class');
            if (clsSel) clsSel.addEventListener('change', (e) => { classFilter = e.target.value; render(); });
            const marSel = modal.body.querySelector('#qmk-chip-margin');
            if (marSel) marSel.addEventListener('change', (e) => { margin = Number(e.target.value) || DEFAULT_MARGIN; render(); });
            modal.body.querySelectorAll('[data-qmk-copy]').forEach((btn) => btn.addEventListener('click', async () => {
                const isExc = btn.dataset.qmkCopy === 'exc';
                const filteredRows = classFilter ? activeRows.filter((r) => String(r?.class || '').trim() === classFilter) : activeRows;
                const chips = buildBorderlineChips(filteredRows, currentSubject, th, margin);
                const text = formatChipsCopyText(`${getExamTitle()} ${currentSubject} ${isExc ? '优秀边缘生' : '及格边缘生'}`, isExc ? chips.excMarginal : chips.passMarginal);
                try { await root.navigator.clipboard.writeText(text); toast('名单已复制到剪贴板', 'success'); } catch (_) { toast(text, 'info'); }
            }));
        }

        modal.foot.innerHTML = `<span style="font-size:12px;color:var(--secondary,#64748b);">所有分年级考核口径、常规班极差与整改措施均同步写入 PPT 与 10 表教师分析手册</span><button type="button" class="qmk-btn-primary" id="qmk-bench-to-ppt">打开质量分析会 PPT 工作室</button>`;
        modal.foot.querySelector('#qmk-bench-to-ppt').addEventListener('click', () => { modal.close(); openQualityMeetingPptModal({ grade: currentGrade }); });
        render();
        return true;
    }

    function runQualityMeetingAction(action) {
        if (action === 'ppt') return openQualityMeetingPptModal();
        if (action === 'handbook') return exportTeacherAnalysisHandbookExcel();
        if (action === 'bench') return openClassTownshipBenchmarkModal();
        if (action === 'mentoring' && typeof root.openTopStudentMentoringModal === 'function') {
            return root.openTopStudentMentoringModal();
        }
        return false;
    }

    root.__QUALITY_MEETING_KIT_PATCHED__ = true;
    root.runQualityMeetingAction = runQualityMeetingAction;
    root.openQualityMeetingPptModal = openQualityMeetingPptModal;
    root.exportTeacherAnalysisHandbookExcel = exportTeacherAnalysisHandbookExcel;
    root.openClassTownshipBenchmarkModal = openClassTownshipBenchmarkModal;
    root.QualityMeetingKit = {
        GRADE_PROFILES: GRADE_BASE_PROFILES,
        resolveCurrentGradeNumber,
        getGradeAnalysisProfile,
        getDisplayAndOfficialSubjects,
        resolveThresholds,
        calcGroupMetrics,
        applyAuthenticTwoRateScoring,
        computeBottom3ForStudents,
        annotateSmallClasses,
        getRegularClasses,
        buildInlineRankBadgeHtml,
        buildClassRows,
        buildClassTownshipBenchmark,
        buildTownshipSchoolMatrix,
        buildSubjectDiagnosis,
        buildActionPlan,
        formatActionPlanCopyText,
        buildTeacherHandbookRows,
        buildTeacherTownshipBenchmark,
        buildNativeBarChartXml,
        buildBorderlineChips,
        formatChipsCopyText,
        buildSmartDiagnostics,
        buildMeetingDeckModel,
        buildMeetingPptxBlob,
        exportTeacherAnalysisHandbookExcel,
        openQualityMeetingPptModal,
        openClassTownshipBenchmarkModal
    };
})(typeof window !== 'undefined' ? window : globalThis);
