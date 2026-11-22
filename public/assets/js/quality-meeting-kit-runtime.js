/*
 * 质量分析会一键工具箱（quality-meeting-kit）按需运行时模块
 *
 * 设计原则：100% 立足本系统（澄见 school-system）原生考核算法与分年级差异化评价体系：
 * - 9年级模式（毕业班中考冲刺全维体系）：
 *   综合总分 = 两率一分(均分50 + 优率80 + 及格50 = 180) + 后1/3托底(剔除前15%赋40) + 高分段(≥490赋50) + 指标生达标(指标一/二基础+附加) + 高中上线率(仅7月中考赋50)。
 *   正式科目：五科总（语数英物化），政治单列（参考二模数据，不计五科总分）。
 * - 8年级模式（地生小中考 + 物理防分化双口径体系）：
 *   综合总分 = 两率一分(均分60 + 优率70 + 及格70 = 200) + 后1/3托底(40) = 240分。
 *   双口径自动对照：全科口径 vs 五科主科口径（语数英物化）+ 展示科目（政史地生）单列对比，重点突出物理防分化与地生会考。
 * - 7年级模式（初一防分化 + 三科主科夯实体系）：
 *   综合总分 = 两率一分(60+70+70=200) + 后1/3托底(40) = 240分。
 *   双口径自动对照：全科口径 vs 三科主科口径（语数英）+ 政史地生单科对比，重点突出数学/英语防早发分化与后1/3托底。
 * - 6年级模式（小初衔接 + 习惯奠基与三科主科体系）：
 *   综合总分 = 两率一分(60+70+70=200) + 后1/3托底(40) = 240分。
 *   双口径自动对照：三科主科（语数英）核心底盘 + 消灭低分与班级均衡度。
 *
 * 同时深度接入本系统 TEACHER_STATS（公平绩效分、生源增值纠偏、样本稳定性、边缘转化分）与 TOWNSHIP_RANKING_DATA。
 * 零内联 on* 事件，全部通过 addEventListener 绑定，完整适配浅色与深色模式。
 */
(function (root) {
    if (!root || root.__QUALITY_MEETING_KIT_PATCHED__) return;

    const DEFAULT_EXC_PCT = 0.15;
    const DEFAULT_PASS_PCT = 0.50;
    const DEFAULT_MARGIN = 10;

    const PPT_THEMES = {
        editorial: { name: '澄见极简', bg: '0F1419', accent: '1D9BF0', accent2: '00BA7C', accent3: 'F59E0B', tblHead: '0F1419', soft: 'F7F9F9', rowTint: 'EFF6FF', text: '0F1419' },
        navy: { name: '商务深蓝', bg: '0B2545', accent: '165DFF', accent2: '00B2D8', accent3: 'F59E0B', tblHead: '1E3A8A', soft: 'F8FAFC', rowTint: 'DBEAFE', text: '0F172A' },
        emerald: { name: '教研墨绿', bg: '064E3B', accent: '0D9488', accent2: '10B981', accent3: 'F59E0B', tblHead: '0F766E', soft: 'F0FDFA', rowTint: 'CCFBF1', text: '0F172A' }
    };

    const GRADE_PROFILES = {
        '9': {
            grade: '9',
            name: '九年级 · 中考冲刺全维评价模式',
            shortTag: '9年级中考全维模式',
            weights: { avg: 50, exc: 80, pass: 50, total: 180, bottom3: 40, highScore: 50 },
            majorSubjects: ['语文', '数学', '英语', '物理', '化学'],
            majorLabel: '五科总（语数英物化）',
            formulaDesc: '两率一分(50+80+50=180) + 后1/3托底(40) + 高分段(≥490赋50) + 指标生达标(基础+附加) [+ 7月中考高中上线率(50)]',
            specialSlideTitle: '九年级专项核算：高分段(≥490) · 指标生 · 后1/3托底',
            specialSheetName: '9年级专项核算',
            pedagogyFocus: '锚定指标生一/二达标线、壮大490+高分尖子群、五科总分均衡冲刺与后1/3有效分托底（政治按二模参考单列分析）',
            actionThemes: ['指标生与490+尖子突破', '五科短板与理化压轴攻坚', '班级均衡与临界生包保', '后1/3有效分托底清零']
        },
        '8': {
            grade: '8',
            name: '八年级 · 地生会考与物理防分化双口径模式',
            shortTag: '8年级五科主科+地生模式',
            weights: { avg: 60, exc: 70, pass: 70, total: 200, bottom3: 40, highScore: 0 },
            majorSubjects: ['语文', '数学', '英语', '物理', '化学'],
            majorLabel: '五科主科（语数英物化）',
            formulaDesc: '两率一分(均分60+优率70+及格70=200) + 后1/3学生核算(剔除前15%赋40) = 240分；全科 vs 五科主科双口径对照',
            specialSlideTitle: '八年级专项：五科主科 vs 全科双口径 & 后1/3托底 & 地生会考诊断',
            specialSheetName: '8年级主科与后三分之一专项',
            pedagogyFocus: '严防八年级物理新开科与数学/英语腰部塌陷，同步推进地理/生物小中考（会考）全员达优及格，守住后1/3有效均分底盘',
            actionThemes: ['五科主科与全科双轨追赶', '物理防分化与地生小中考冲A', '消除班际极差与腰部断层', '后1/3托底与临界生转化']
        },
        '7': {
            grade: '7',
            name: '七年级 · 初一防分化与三科主科夯实模式',
            shortTag: '7年级三科主科防分化模式',
            weights: { avg: 60, exc: 70, pass: 70, total: 200, bottom3: 40, highScore: 0 },
            majorSubjects: ['语文', '数学', '英语'],
            majorLabel: '三科主科（语数英）',
            formulaDesc: '两率一分(均分60+优率70+及格70=200) + 后1/3学生核算(剔除前15%赋40) = 240分；全科 vs 语数英三科主科双口径对照',
            specialSlideTitle: '七年级专项：语数英三科主科 vs 全科对照 & 后1/3托底防掉队',
            specialSheetName: '7年级三科主科与后三分之一',
            pedagogyFocus: '筑牢语数英三科主科核心底盘，严防初一数学、英语早发性两极分化，狠抓后1/3有效均分托底与政史地生学科规范',
            actionThemes: ['语数英三科主科镇域追赶', '数学/英语防早发两极分化', '班级均衡与学习常规固化', '后1/3托底与及格边缘清零']
        },
        '6': {
            grade: '6',
            name: '六年级 · 小初衔接习惯奠基与三科主科模式',
            shortTag: '6年级小初衔接奠基模式',
            weights: { avg: 60, exc: 70, pass: 70, total: 200, bottom3: 40, highScore: 0 },
            majorSubjects: ['语文', '数学', '英语'],
            majorLabel: '三科主科（语数英）',
            formulaDesc: '两率一分(均分60+优率70+及格70=200) + 后1/3学生核算(剔除前15%赋40) = 240分；聚焦小初衔接及格底盘与后1/3托底',
            specialSlideTitle: '六年级专项：小初衔接三科主科（语数英）底盘 & 后1/3托底核算',
            specialSheetName: '6年级小初衔接与后三分之一',
            pedagogyFocus: '平稳推进小初衔接学习习惯养成，以语数英三科主科及格率与后1/3有效均分为第一生命线，消灭低分并缩小班际差距',
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

    function getExamTitle() {
        const id = String(root.CURRENT_EXAM_ID || '').trim();
        const meta = (id && root.COHORT_DB?.exams?.[id]?.meta) || {};
        return String(meta.name || meta.examName || root.CONFIG?.name || id || '当前考试').trim();
    }

    function getAllRows() {
        return Array.isArray(root.RAW_DATA) ? root.RAW_DATA.slice() : [];
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
        if (/六年级|初一上|小初/.test(source)) return '6';
        if (/七年级|初一/.test(source)) return '7';
        if (/八年级|初二/.test(source)) return '8';
        if (/九年级|初三|中考|一模|二模|三模/.test(source)) return '9';
        const subjs = getSubjects(getAllRows());
        if (subjs.includes('化学')) return '9';
        if (subjs.includes('物理')) return '8';
        return '7';
    }

    function getGradeAnalysisProfile(overrideGrade = '') {
        const g = resolveCurrentGradeNumber(overrideGrade);
        return GRADE_PROFILES[g] || GRADE_PROFILES['9'];
    }

    function getSubjects(rows) {
        if (Array.isArray(root.SUBJECTS) && root.SUBJECTS.length) return root.SUBJECTS.filter(Boolean);
        const set = new Set();
        (rows || []).forEach((r) => Object.keys(r?.scores || {}).forEach((s) => set.add(s)));
        return Array.from(set);
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
        // For Grade 9 Zhongkao/mock with politics reference:
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

    // Ensure school-system's own authoritative summary, teacher, bottom3, highScore, and indicator engines run
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

    // Compute raw group metrics (avg, excRate%, passRate%, excRatio, passRatio)
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

    // Apply school-system's authentic two-rate-one-average relative scoring:
    // Grade 9: avg/maxAvg*50 + exc/maxExc*80 + pass/maxPass*50 (max 180)
    // Grade 6-8: avg/maxAvg*60 + exc/maxExc*70 + pass/maxPass*70 (max 200)
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

    // Calculate school-system's authentic Bottom 1/3 metric (excluding top 15% of bottom 1/3, max 40 points)
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
        const validGroup = bottomGroup.slice(excN); // bottomGroup is sorted desc, so top excN of bottomGroup are the first excN
        const validCount = validGroup.length;
        const avg = validCount ? validGroup.reduce((a, b) => a + b, 0) / validCount : 0;
        return {
            totalN,
            bottomN,
            excN,
            validCount,
            avg: Number(avg.toFixed(2))
        };
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

    // Pull Grade 9 Indicator scores from school-system's native calcIndicators engine
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

    // Build Township School Matrix aligned 100% with school-system's comprehensive evaluation formula
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
                // Check if window.SCHOOLS has authoritative metrics for this school
                const sysSchool = root.SCHOOLS?.[name];
                const sysKey = k === '总分' ? 'total' : k;
                const sysMetric = sysSchool?.metrics?.[sysKey];
                if (sysMetric && Number(sysMetric.count) > 0) {
                    base.count = Number(sysMetric.count);
                    base.avg = Number(Number(sysMetric.avg || 0).toFixed(2));
                    base.excRate = Number(((Number(sysMetric.excRate) || 0) * 100).toFixed(1));
                    base.passRate = Number(((Number(sysMetric.passRate) || 0) * 100).toFixed(1));
                }
                return {
                    name,
                    isOwn: sameSchool(name, mySchool),
                    students: rows,
                    ...base
                };
            });
            applyAuthenticTwoRateScoring(list, gradeProfile);
            // If window.SCHOOLS already computed score2Rate for total, honor it
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

        // Compute comprehensive evaluation components across schools:
        // 1. Bottom 1/3 (max 40 pts)
        // 2. Grade 9 High Score >=490 (max 50 pts)
        // 3. Grade 9 Indicator (from calcIndicators)
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

        // Compute Major Subject (三科主科 for G6/7, 五科主科 for G8) snapshot for Grades 6-8
        const majorSubjects = (gradeProfile.majorSubjects || []).filter((s) => (subjects || []).includes(s));
        let majorSchoolRows = [];
        if (gradeProfile.grade !== '9' && majorSubjects.length) {
            const majorTh = computeThresholdForSubject(allRows, '主科总', majorSubjects);
            majorSchoolRows = Array.from(bySchool.entries()).map(([name, rows]) => {
                const m = calcGroupMetrics(rows, '主科总', majorTh, majorSubjects);
                const b3 = computeBottom3ForStudents(rows, majorSubjects);
                return {
                    name,
                    isOwn: sameSchool(name, mySchool),
                    ...m,
                    bottom3Avg: b3.avg
                };
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
            const classRows = buildClassRows(mySchoolRows, subj, thresholdsMap?.[subj], gradeProfile);
            const classSpread = classRows.length >= 2
                ? Number((classRows[0].avg - classRows[classRows.length - 1].avg).toFixed(1))
                : 0;
            const topClass = classRows[0] || null;
            const weakClass = classRows.length >= 2 ? classRows[classRows.length - 1] : null;
            const isDisplayOnly = displaySet.has(subj) || (gradeProfile.grade === '9' && subj === '政治');
            const isMajor = majorSet.has(subj);
            const roleLabel = isDisplayOnly
                ? (gradeProfile.grade === '9' && subj === '政治' ? '参考二模单列' : '展示对比科')
                : (isMajor ? '核心主科' : '考核科目');

            let tier = '稳健保持';
            let issueType = '均衡';
            let measure = '保持现有教学节奏，依托集体备课固化优势，冲刺全镇更高位次。';
            if (townMatrix.hasTownship && rank <= Math.max(1, Math.ceil(totalSchools * 0.3)) && avgDiff >= 0) {
                tier = '优势领跑';
                issueType = '标杆';
                measure = '总结学科教研组有效做法并在校内推广，进一步扩大高分段领先优势。';
            } else if (townMatrix.hasTownship && (rank > Math.ceil(totalSchools * 0.6) || avgDiff < -2)) {
                tier = '重点短板';
                if (excDiff >= 0 && passDiff < -3) {
                    issueType = '两极分化';
                    measure = '及格率明显低于镇均，立即启动后 1/3 基础过关周测、错题重做与分层作业，先守住及格底盘。';
                } else if (passDiff >= 0 && excDiff < -3) {
                    issueType = '拔尖不足';
                    measure = '底盘尚可但高分偏少，建议增设压轴题微专题、尖子生面批与限时拉练，拉升优秀率。';
                } else {
                    issueType = '整体偏弱';
                    measure = '均分与两率均落后镇均，建议教务处下沉听课，梳理高频失分知识点，统一教案与堂清节奏。';
                }
            } else if (excDiff < -2.5) {
                tier = '冲优潜力';
                issueType = '高分偏弱';
                measure = '重点盯紧优秀边缘生，强化中档题准确率与综合题规范作答。';
            } else if (passDiff < -2.5) {
                tier = '保底预警';
                issueType = '及格偏弱';
                measure = '重点盯紧及格边缘生，落实核心概念默写与基础题每日清零。';
            }
            if (gradeProfile.grade === '8' && (subj === '地理' || subj === '生物')) {
                measure += '（八年级地生小中考会考科目：实行识图与必考题逐人过关打卡）';
            } else if (gradeProfile.grade === '8' && subj === '物理') {
                measure += '（八年级物理新开科：严抓受力/光学/电学基础实验建模，防止期中后两极分化）';
            } else if ((gradeProfile.grade === '6' || gradeProfile.grade === '7') && isMajor) {
                measure += `（${gradeProfile.grade}年级核心主科：坚持每日计算/默写/阅读微训练，防止早发掉队）`;
            }
            if (classSpread >= 8 && weakClass) {
                measure += `（班际极差 ${classSpread} 分，重点帮扶 ${weakClass.name}）`;
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

        // Dimension 1: School-level Township Positioning & Grade-Specific Evaluation Target
        if (townMatrix.hasTownship && own) {
            const strongList = subjectDiag.filter((d) => d.tier === '优势领跑').map((d) => d.subject);
            const weakList = subjectDiag.filter((d) => d.tier === '重点短板' || d.tier === '保底预警').map((d) => d.subject);
            const chaseText = townMatrix.targetAhead
                ? `锚定前一名「${townMatrix.targetAhead.name}」（综合总分差 ${townMatrix.compGapToAhead} 分，均分差 ${townMatrix.gapToAhead} 分）作为下阶段直接追赶目标`
                : '当前稳居全镇第一，下阶段目标为巩固综合总分领先身位并扩大优势';
            const ownMajor = townMatrix.majorSchoolRows?.find((m) => m.isOwn);
            const modeSpecificStep = g === '9'
                ? `九年级专项抓手：当前两率一分 ${own.score2Rate} 分、后1/3得分 ${own.scoreBottom} 分（第${own.rankBottom}名）、490+高分 ${own.highCount490} 人（赋${own.scoreHigh490}分，第${own.rankHigh490}名）、指标生得分 ${own.scoreIndicator} 分，需四维同步发力。`
                : `${gradeProfile.majorLabel}双口径对标：全科综合第 ${own.comprehensiveRank} 名（${own.comprehensiveTotal} 分）${ownMajor ? `，${gradeProfile.majorLabel}口径第 ${ownMajor.comprehensiveRank} 名（均分 ${ownMajor.avg}，两率一分 ${ownMajor.score2Rate} 分）` : ''}，后1/3托底得分 ${own.scoreBottom} 分（全镇第 ${own.rankBottom} 名）。`;
            actions.push({
                dimension: `${gradeProfile.actionThemes[0]}（校级镇域定位）`,
                owner: '校长室 / 教导处',
                priority: '核心方向',
                summary: `按${gradeProfile.shortTag}核算，本校综合总分 ${own.comprehensiveTotal} 分，居全镇第 ${own.comprehensiveRank}/${townMatrix.totalSchools} 名（两率一分第 ${own.scoreRank} 名，较镇均 ${townMatrix.gapToTownAvg >= 0 ? '+' : ''}${townMatrix.gapToTownAvg} 分），${chaseText}。`,
                steps: [
                    modeSpecificStep,
                    `优势巩固与短板攻坚：优势科（${strongList.join('、') || '前列学科'}）保持高位；把（${weakList.join('、') || '相对滞后学科'}）列为下月重点提质学科，每周开展 1 次专项教研会诊。`
                ]
            });
        } else {
            actions.push({
                dimension: `${gradeProfile.actionThemes[0]}（年级整体方向）`,
                owner: '教导处 / 级部',
                priority: '核心方向',
                summary: `当前启用【${gradeProfile.name}】，参评 ${overall.count} 人，平均分 ${overall.avg}，优秀率 ${overall.excRate}%，及格率 ${overall.passRate}%。`,
                steps: [
                    `考核口径：${gradeProfile.formulaDesc}。`,
                    `战略重心：${gradeProfile.pedagogyFocus}。`
                ]
            });
        }

        // Dimension 2: Grade-Specific Subject Strategy
        const prioritySubjs = subjectDiag.slice().sort((a, b) => a.avgDiff - b.avgDiff).slice(0, 3);
        const gradeSubjectNote = g === '9'
            ? '九年级聚焦五科总分（语数英物化）协同，强化理化综合压轴与文科规范答题；政治按二模参考单科诊断到人。'
            : (g === '8'
                ? '八年级一手抓「语数英物」主科防分化（重点防范物理新开科滑坡），一手抓「地理、生物」小中考会考冲A过关。'
                : `${g}年级聚焦「语文、数学、英语」三科主科核心底盘，严防数学与英语过早出现两极分化，政史地生抓实课堂当堂消化。`);
        actions.push({
            dimension: `${gradeProfile.actionThemes[1]}（学科分类施策）`,
            owner: '各学科备课组长',
            priority: '教学重点',
            summary: prioritySubjs.length
                ? `${gradeSubjectNote} 优先攻坚 ${prioritySubjs.map((s) => `${s.subject}（${s.tier}，较镇均 ${s.avgDiff >= 0 ? '+' : ''}${s.avgDiff}）`).join('、')}。`
                : gradeSubjectNote,
            steps: prioritySubjs.map((s) => `${s.subject}［${s.roleLabel}·${s.issueType}］：${s.measure}`)
        });

        // Dimension 3: Class Balance & Weak Class Support
        const maxSpreadSubj = subjectDiag.slice().sort((a, b) => b.classSpread - a.classSpread)[0];
        const leadCls = classRows[0];
        const lagCls = classRows.length >= 2 ? classRows[classRows.length - 1] : null;
        actions.push({
            dimension: `${gradeProfile.actionThemes[2]}（班级均衡管理）`,
            owner: '级部主任 / 班主任',
            priority: '管理抓手',
            summary: (leadCls && lagCls)
                ? `总分领跑班为 ${leadCls.name}（均分 ${leadCls.avg}，两率一分 ${leadCls.score}），相对薄弱班为 ${lagCls.name}（均分 ${lagCls.avg}，班际均分极差 ${(leadCls.avg - lagCls.avg).toFixed(1)} 分，后1/3均分 ${lagCls.bottom3Avg || 0}）。`
                : '推进班级日常常规与课堂效率均衡发展。',
            steps: [
                maxSpreadSubj && maxSpreadSubj.classSpread > 0
                    ? `消除学科失衡：${maxSpreadSubj.subject} 班际极差最大（${maxSpreadSubj.classSpread} 分），组织 ${maxSpreadSubj.topClass} 与 ${maxSpreadSubj.weakClass} 任课教师开展同课异构与共案备课。`
                    : '保持各班教学进度与作业难度同步，防止中后期拉大差距。',
                lagCls ? `薄弱班与后1/3包保：级部下沉 ${lagCls.name} 推门听课，重点督导后1/3学生（有效均分 ${lagCls.bottom3Avg || 0} 分）的课堂专注度与作业订正闭环。` : '持续落实班主任与任课教师周会商机制。'
            ]
        });

        // Dimension 4: Borderline Conversion, Bottom 1/3 Floor & Top Student Mentoring
        const n = Math.max(1, overall.count || 1);
        const excGain = Number(((totalBorderline.excMarginal.length / n) * 100).toFixed(1));
        const passGain = Number(((totalBorderline.passMarginal.length / n) * 100).toFixed(1));
        const topGoalStep = g === '9'
            ? `490+尖子与指标生包保：本校当前 ≥490 分 ${own ? own.highCount490 : 0} 人，依托「育苗包保档案」为前 30 名指派导师，一人一档消灭偏科短板。`
            : `主科拔尖与防偏科包保：依托「育苗包保档案」锁定年级前 30 名（聚焦${gradeProfile.majorLabel}无短板），建立单科偏离度预警与导师面批档案。`;
        actions.push({
            dimension: `${gradeProfile.actionThemes[3]}（精准包保到人）`,
            owner: '全体任课教师 / 包保导师',
            priority: '提分抓手',
            summary: `若下阶段成功转化 ${totalBorderline.excMarginal.length} 名优秀边缘生、${totalBorderline.passMarginal.length} 名及格边缘生，本校优秀率最高可提升 +${excGain}%、及格率最高可提升 +${passGain}%，同时直接拉升后1/3有效分（满分40分）。`,
            steps: [
                `优秀边缘生（${totalBorderline.excMarginal.length} 人）与及格边缘生（${totalBorderline.passMarginal.length} 人）：按「一师一策画像表」名单分解到各班任课教师，每周面批 1 次错题。`,
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

    // Build Teacher Handbook Rows deeply integrated with school-system's TEACHER_STATS & TOWNSHIP_RANKING_DATA
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

            // Connect with school-system's native TEACHER_STATS and TEACHER_TOWNSHIP_RANKINGS when available
            const sysStat = root.TEACHER_STATS?.[entry.teacher]?.[entry.subject] || null;
            const sysTown = root.TEACHER_TOWNSHIP_RANKINGS?.[entry.teacher]?.[entry.subject] || null;

            const clsAvgs = entry.classMetrics.map((c) => c.avg);
            const classSpread = clsAvgs.length >= 2 ? Number((Math.max(...clsAvgs) - Math.min(...clsAvgs)).toFixed(1)) : 0;
            const border = buildBorderlineChips(entry.students, entry.subject, threshold);
            const n = Math.max(1, metrics.count);
            const excLift = Number(((border.excMarginal.length / n) * 100).toFixed(1));
            const passLift = Number(((border.passMarginal.length / n) * 100).toFixed(1));

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
                // Rich fields from school-system's analyzeTeachersV2 engine:
                fairScore: sysStat && Number.isFinite(Number(sysStat.fairScore)) ? Number(Number(sysStat.fairScore).toFixed(1)) : null,
                fairRank: sysStat?.fairRank || null,
                baselineAdjustment: sysStat && Number.isFinite(Number(sysStat.baselineAdjustment)) ? Number(Number(sysStat.baselineAdjustment).toFixed(1)) : null,
                conversionSummary: sysStat?.conversionSummary || `待转化：优边${border.excMarginal.length}人 / 及边${border.passMarginal.length}人`,
                sampleStabilityText: sysStat?.sampleStabilityText || '当前样本',
                continuityText: sysStat?.teacherContinuityText || '正常任教'
            };
        });

        const bySubject = new Map();
        rows.forEach((r) => {
            if (!bySubject.has(r.subject)) bySubject.set(r.subject, []);
            bySubject.get(r.subject).push(r);
        });
        const ranked = [];
        bySubject.forEach((list, subj) => {
            // Apply authentic grade-weighted two-rate-one-average scoring across teachers + external schools
            const extList = (list[0]?.extList || []).map((e) => ({ ...e }));
            applyAuthenticTwoRateScoring([...list, ...extList], gradeProfile);
            // Also compute pure intra-school two-rate-one-avg score
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
                    advice = `校内第1（全镇同台第${townRank}，两率一分 ${item.score} 分），建议在备课组示范课堂与作业抓手，冲刺更高优秀率。`;
                } else if (item.excRate < 12 && item.passRate >= 55) {
                    profileTag = '底盘稳·待拔尖';
                    advice = `及格率稳健但高分偏少，重点面批名下 ${item.excMarginal.length} 名优秀边缘生（全部转化可提优率 +${item.excLift}%）。`;
                } else if (item.passRate < 50 || item.diffVsSchoolAvg < -2) {
                    profileTag = '重点帮扶';
                    advice = `先抓基础过关与堂清，重点盯紧名下 ${item.passMarginal.length} 名及格边缘生（全部转化可提及格率 +${item.passLift}%）。`;
                }
                if (item.baselineAdjustment !== null && item.baselineAdjustment >= 2) {
                    profileTag += '·增值显著';
                } else if (item.baselineAdjustment !== null && item.baselineAdjustment <= -3) {
                    advice += ` 历史基线增值偏低（${item.baselineAdjustment}），需排查近期掉队学生。`;
                }
                if (item.classSpread >= 6) {
                    advice += ` 所教班级间均分极差达 ${item.classSpread} 分，需平衡两班课堂落实。`;
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

    // Teacher + External Township Schools combined benchmark for a single subject
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
            ? `，综合总分 ${own.comprehensiveTotal} 分（全镇第 ${own.comprehensiveRank}/${townMatrix.totalSchools} 名，两率一分 ${own.score2Rate} 分、后1/3得分 ${own.scoreBottom} 分${gradeProfile.grade === '9' ? `、490+高分赋分 ${own.scoreHigh490} 分、指标生 ${own.scoreIndicator} 分` : ''}${townMatrix.targetAhead ? `，距前一名「${townMatrix.targetAhead.name}」差 ${townMatrix.compGapToAhead} 分` : ''}）`
            : '';
        bullets.push(`【${gradeProfile.shortTag}】全级部参评 ${overall.count} 人，均分 ${overall.avg}，优秀率 ${overall.excRate}%，及格率 ${overall.passRate}%${townNote}。`);
        if (gradeProfile.grade !== '9' && townMatrix?.majorSchoolRows?.length) {
            const ownMajor = townMatrix.majorSchoolRows.find((m) => m.isOwn);
            if (ownMajor) {
                bullets.push(`【主科双口径】${gradeProfile.majorLabel}口径下，本校均分 ${ownMajor.avg}，两率一分 ${ownMajor.score2Rate} 分，后1/3均分 ${ownMajor.bottom3Avg}（赋 ${ownMajor.scoreBottom} 分），主科综合全镇第 ${ownMajor.comprehensiveRank}/${townMatrix.totalSchools} 名。`);
            }
        } else if (gradeProfile.grade === '9' && own) {
            bullets.push(`【九年级专项】≥490 分高分人数 ${own.highCount490} 人（高分率 ${own.highRate490Pct}%，全镇第 ${own.rankHigh490} 名）；有效后1/3均分 ${own.bottom3?.avg || 0} 分（全镇第 ${own.rankBottom} 名）。`);
        }
        if (classRows.length >= 2) {
            const top = classRows[0];
            const bottom = classRows[classRows.length - 1];
            const diff = (top.avg - bottom.avg).toFixed(1);
            bullets.push(`【班级与后1/3】${top.name} 两率一分领先（均分 ${top.avg}，得分 ${top.score}）；${bottom.name} 相对靠后（均分 ${bottom.avg}，班际极差 ${diff} 分，后1/3均分 ${bottom.bottom3Avg || 0}），需重点帮扶。`);
        }
        if (subjectOverview.length >= 2) {
            const bestAvg = subjectOverview.slice().sort((a, b) => b.avg - a.avg)[0];
            const lowPass = subjectOverview.slice().sort((a, b) => a.passRate - b.passRate)[0];
            bullets.push(`【学科与临界生】均分最高为 ${bestAvg.subject}（${bestAvg.avg} 分），及格率最低为 ${lowPass.subject}（${lowPass.passRate}%）；总分优秀边缘 ${totalBorderline.excMarginal.length} 人、及格边缘 ${totalBorderline.passMarginal.length} 人。`);
        }
        return bullets;
    }

    // -------------------------------------------------------------------------
    // Native OOXML Bar Chart Generator (<c:chartSpace> / <c:barChart>)
    // -------------------------------------------------------------------------
    function buildNativeBarChartXml(chartSpec) {
        const categories = Array.isArray(chartSpec?.categories) ? chartSpec.categories : [];
        const seriesList = Array.isArray(chartSpec?.series) ? chartSpec.series : [];
        const serXml = seriesList.map((ser, sIdx) => {
            const color = ser.color || (sIdx === 0 ? '165DFF' : (sIdx === 1 ? '00B2D8' : 'F59E0B'));
            const catPts = categories.map((cat, i) => `<c:pt idx="${i}"><c:v>${escXml(cat)}</c:v></c:pt>`).join('');
            const valPts = (ser.values || []).map((v, i) => `<c:pt idx="${i}"><c:v>${Number(v) || 0}</c:v></c:pt>`).join('');
            return `<c:ser><c:idx val="${sIdx}"/><c:order val="${sIdx}"/>
<c:tx><c:strRef><c:f>Sheet1!$B$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${escXml(ser.name || `系列${sIdx + 1}`)}</c:v></c:pt></c:strCache></c:strRef></c:tx>
<c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></c:spPr>
<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$${categories.length + 1}</c:f><c:strCache><c:ptCount val="${categories.length}"/>${catPts}</c:strCache></c:strRef></c:cat>
<c:val><c:numRef><c:f>Sheet1!$B$2:$B$${categories.length + 1}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${categories.length}"/>${valPts}</c:numCache></c:numRef></c:val>
</c:ser>`;
        }).join('');
        const legendXml = seriesList.length > 1 ? '<c:legend><c:legendPos val="t"/><c:overlay val="0"/></c:legend>' : '';
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:date1904 val="0"/>
<c:chart><c:autoTitleDeleted val="1"/>
<c:plotArea><c:layout/>
<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${serXml}<c:gapWidth val="150"/><c:axId val="110001"/><c:axId val="110002"/></c:barChart>
<c:catAx><c:axId val="110001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="110002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/></c:catAx>
<c:valAx><c:axId val="110002"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="110001"/><c:crosses val="autoZero"/></c:valAx>
</c:plotArea>${legendXml}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"/></a:pPr><a:endParaRPr lang="zh-CN"/></a:p></c:txPr>
</c:chartSpace>`;
    }

    function pptChartFrame(id, relId, x, y, cx, cy) {
        return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Chart ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>
<p:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></p:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="${relId}"/></a:graphicData></a:graphic></p:graphicFrame>`;
    }

    // -------------------------------------------------------------------------
    // Structured Deck Model (Grade-Differentiated for Grades 6 / 7 / 8 / 9)
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

    function buildGradeSpecialSlide(gradeProfile, townMatrix, classRows, activeRows, theme) {
        const g = gradeProfile.grade;
        const own = townMatrix.ownTotal;
        if (g === '9') {
            const schools = townMatrix.schoolMatrixRows.slice(0, 10);
            const chartPool = schools.slice(0, 7);
            return {
                kind: 'splitChartTable',
                title: gradeProfile.specialSlideTitle,
                subtitle: `九年级综合总分 = 两率一分(180) + 后1/3(40) + 高分段≥490(50) + 指标生得分  |  本校综合总分 ${own ? own.comprehensiveTotal : '—'} 分（第 ${own ? own.comprehensiveRank : 1} 名）`,
                chart: {
                    title: '各校两率一分 / 后1/3 / 490+高分赋分对比',
                    categories: chartPool.map((s) => s.name),
                    series: [
                        { name: '两率一分(180)', color: theme.accent, values: chartPool.map((s) => s.score2Rate) },
                        { name: '后1/3得分(40)', color: theme.accent2, values: chartPool.map((s) => s.scoreBottom) },
                        { name: '490+赋分(50)', color: theme.accent3, values: chartPool.map((s) => s.scoreHigh490) }
                    ]
                },
                headers: ['学校', '两率一分', '≥490人数/赋分', '指标生分', '后1/3均分/得分', '综合总分(排)'],
                rows: schools.map((s) => ({
                    isEmph: s.isOwn,
                    cells: [
                        s.isOwn ? `★ ${s.name}` : s.name,
                        `${s.score2Rate}`,
                        `${s.highCount490}人 / ${s.scoreHigh490}`,
                        `${s.scoreIndicator}`,
                        `${s.bottom3?.avg || 0} / ${s.scoreBottom}`,
                        `${s.comprehensiveTotal} (#${s.comprehensiveRank})`
                    ]
                }))
            };
        }

        // Grades 6, 7, 8: Dual-Caliber (Major Subjects vs All Subjects) + Bottom 1/3 Floor
        const hasMajor = townMatrix.majorSchoolRows && townMatrix.majorSchoolRows.length > 0;
        if (townMatrix.hasTownship && hasMajor) {
            const schools = townMatrix.schoolMatrixRows.slice(0, 10);
            const chartPool = schools.slice(0, 7);
            return {
                kind: 'splitChartTable',
                title: gradeProfile.specialSlideTitle,
                subtitle: `${gradeProfile.name}：全科综合(240) vs ${gradeProfile.majorLabel}双口径对标 + 后1/3有效分托底(40分)`,
                chart: {
                    title: `各校全科两率一分 vs ${gradeProfile.majorLabel}两率一分 vs 后1/3得分`,
                    categories: chartPool.map((s) => s.name),
                    series: [
                        { name: '全科两率一分(200)', color: theme.accent, values: chartPool.map((s) => s.score2Rate) },
                        { name: `${gradeProfile.majorLabel}(200)`, color: theme.accent2, values: chartPool.map((s) => s.majorMatch ? s.majorMatch.score2Rate : s.score2Rate) },
                        { name: '后1/3得分(40)', color: theme.accent3, values: chartPool.map((s) => s.scoreBottom) }
                    ]
                },
                headers: ['学校', '全科两率一分(排)', `${gradeProfile.majorLabel}均分(排)`, '后1/3均分/得分', '综合总分(240)'],
                rows: schools.map((s) => ({
                    isEmph: s.isOwn,
                    cells: [
                        s.isOwn ? `★ ${s.name}` : s.name,
                        `${s.score2Rate} (#${s.scoreRank})`,
                        s.majorMatch ? `${s.majorMatch.avg} (#${s.majorMatch.comprehensiveRank})` : `${s.avg}`,
                        `${s.bottom3?.avg || 0} / ${s.scoreBottom}`,
                        `${s.comprehensiveTotal} (#${s.comprehensiveRank})`
                    ]
                }))
            };
        }

        // Fallback single-school Grade 6-8 class-level Major vs All + Bottom 1/3 comparison
        const cPool = classRows.slice(0, 10);
        return {
            kind: 'splitChartTable',
            title: gradeProfile.specialSlideTitle,
            subtitle: `${gradeProfile.name}：各班两率一分(200分) + 有效后1/3均分托底(40分)对照`,
            chart: {
                title: '各班总分均分 vs 有效后1/3均分 vs 两率一分得分',
                categories: cPool.map((c) => c.name),
                series: [
                    { name: '班级均分', color: theme.accent, values: cPool.map((c) => c.avg) },
                    { name: '后1/3有效均分', color: theme.accent2, values: cPool.map((c) => c.bottom3Avg || 0) },
                    { name: '两率一分(200)', color: theme.accent3, values: cPool.map((c) => c.score) }
                ]
            },
            headers: ['班级', '人数', '总分均分', '后1/3有效均分', '后1/3赋分(40)', '两率一分(200)'],
            rows: cPool.map((c, idx) => ({
                isEmph: idx === 0,
                cells: [c.name, `${c.count}`, `${c.avg}`, `${c.bottom3Avg || 0}`, `${c.scoreBottom || 0}`, `${c.score}`]
            }))
        };
    }

    function buildMeetingDeckModel(options = {}) {
        const allRows = options.allRows || getAllRows();
        if (!allRows.length) throw new Error('暂无成绩数据，请先导入数据');
        const gradeProfile = getGradeAnalysisProfile(options.grade);
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
        const subjectOverview = subjects.map((subj) => ({
            subject: subj,
            ...calcGroupMetrics(activeRows, subj, thresholdInfo.thresholds[subj])
        }));
        const totalBorderline = buildBorderlineChips(activeRows, '总分', thresholdInfo.thresholds['总分']);
        const townMatrix = buildTownshipSchoolMatrix(allRows, mySchool, subjects, thresholdInfo.thresholds, gradeProfile);
        const diagnostics = buildSmartDiagnostics(overall, classRows, subjectOverview, totalBorderline, townMatrix, gradeProfile);
        const teacherRows = buildTeacherHandbookRows(activeRows, subjects, teacherMap, thresholdInfo.thresholds, allRows, gradeProfile);
        const subjectDiag = buildSubjectDiagnosis(townMatrix, activeRows, subjects, thresholdInfo.thresholds, gradeProfile, subjectPolicy.displayOnlySubjects);
        const actionPlan = buildActionPlan(townMatrix, subjectDiag, classRows, totalBorderline, overall, gradeProfile);

        const modeLabel = thresholdInfo.source === 'township'
            ? `${gradeProfile.shortTag} · 全镇对标（${thresholdInfo.schoolCount}校${allRows.length}人 · 本校${activeRows.length}人）`
            : `${gradeProfile.shortTag} · 本校分析（共${activeRows.length}人）`;

        const slides = [];
        // Slide 1: Cover (explicitly showing Grade Analysis Mode & Formula)
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
                title: `年级总体概览与各科均分对比（${gradeProfile.shortTag}）`,
                subtitle: `${mySchool} · ${modeLabel}`,
                kpis: [
                    { label: '参评人数 / 均分', val: `${overall.count}人 / ${overall.avg}`, color: theme.accent },
                    { label: `两率一分(${gradeProfile.weights.total})`, val: own ? `${own.score2Rate} (#${own.scoreRank})` : `${overall.excRate}%优`, color: '1D4ED8' },
                    { label: '后1/3有效分(40)', val: own ? `${own.scoreBottom} (#${own.rankBottom})` : `${classRows[0]?.bottom3Avg || 0}`, color: '0D9488' },
                    {
                        label: gradeProfile.grade === '9' ? '综合总分 / 490+高分' : `综合总分(240) / 及格率`,
                        val: own
                            ? (gradeProfile.grade === '9' ? `${own.comprehensiveTotal} (${own.highCount490}人)` : `${own.comprehensiveTotal} (#${own.comprehensiveRank})`)
                            : `${overall.passRate}%`,
                        color: 'B45309'
                    }
                ],
                chart: {
                    title: '各学科本校均分与全镇均分对比',
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

        // Slide 3: Grade-Differentiated Special Evaluation Slide (G9: 490+ / Indicator / Bottom 1/3; G6-8: Major Subjects vs All Subjects + Bottom 1/3)
        if (include.gradeSpecial) {
            slides.push(buildGradeSpecialSlide(gradeProfile, townMatrix, classRows, activeRows, theme));
        }

        // Slide 4: Township School Matrix & Subject Diagnosis
        if (include.townPosition && townMatrix.hasTownship) {
            const own = townMatrix.ownTotal;
            const targetNote = townMatrix.targetAhead
                ? `本校全镇综合第 ${own.comprehensiveRank}/${townMatrix.totalSchools} 名（两率一分第 ${own.scoreRank} 名）· 距前一名「${townMatrix.targetAhead.name}」综合差 ${townMatrix.compGapToAhead} 分（均分差 ${townMatrix.gapToAhead} 分）`
                : `本校稳居全镇综合第 1/${townMatrix.totalSchools} 名 · 较镇均 +${townMatrix.gapToTownAvg} 分`;
            slides.push({
                kind: 'table',
                title: '全镇校际定位与各科强弱诊断（区分主科与展示科）',
                subtitle: targetNote,
                headers: ['学科', '口径属性', '本校均分', '全镇均分', '较镇均差', '两率一分(排)', '班际极差', '强弱判定', '病因诊断'],
                rows: subjectDiag.map((d) => ({
                    isEmph: d.tier === '重点短板' || d.tier === '优势领跑',
                    cells: [d.subject, d.roleLabel, String(d.ownAvg), String(d.townAvg), `${d.avgDiff >= 0 ? '+' : ''}${d.avgDiff}`, `${d.score2Rate} (第${d.rank})`, `${d.classSpread}`, d.tier, d.issueType]
                })),
                footerNote: `战略焦点：${gradeProfile.pedagogyFocus}。`
            });
        }

        // Slide 5: Class Total & Township Split Slide (Left: Native Grouped Bar Chart, Right: Ranking Table)
        if ((include.classRank || include.townBenchmark) && classRows.length) {
            const useBench = include.townBenchmark && thresholdInfo.hasTownship;
            const rowsSource = useBench
                ? buildClassTownshipBenchmark(allRows, mySchool, '总分', thresholdInfo.thresholds['总分'], gradeProfile).slice(0, 12)
                : classRows.slice(0, 12);
            const chartSource = rowsSource.slice(0, 8);
            slides.push({
                kind: 'splitChartTable',
                title: useBench ? `班级总分对比（本校班级 × 全镇各校同台 · 满分${gradeProfile.weights.total}）` : `班级总分两率一分对比（满分${gradeProfile.weights.total}）`,
                subtitle: useBench ? `左图：均分 / 优秀率 / 及格率分组对比  |  右表：按${gradeProfile.shortTag}权重(${gradeProfile.weights.avg}/${gradeProfile.weights.exc}/${gradeProfile.weights.pass})赋分` : '左图：各班两率一分分组柱状图  |  右表：各班两率一分与后1/3有效均分',
                chart: {
                    title: '各班均分 / 优秀率 / 及格率分组对比',
                    categories: chartSource.map((r) => r.name),
                    series: [
                        { name: '均分', color: theme.accent, values: chartSource.map((r) => r.avg) },
                        { name: '优秀率%', color: theme.accent2, values: chartSource.map((r) => r.excRate) },
                        { name: '及格率%', color: theme.accent3, values: chartSource.map((r) => r.passRate) }
                    ]
                },
                headers: ['班级/学校', '均分', '优秀率%', '及格率%', `两率一分(${gradeProfile.weights.total})`],
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

        // Slides 6..N: Per-Subject Rich Dashboard
        if (include.subjects) {
            subjects.forEach((subj) => {
                const th = thresholdInfo.thresholds[subj] || { exc: 0, pass: 0 };
                const subjMetric = calcGroupMetrics(activeRows, subj, th);
                const subjTeachers = teacherRows.filter((t) => t.subject === subj);
                const subjClasses = buildClassRows(activeRows, subj, th, gradeProfile);
                const classVsTown = thresholdInfo.hasTownship
                    ? buildClassTownshipBenchmark(allRows, mySchool, subj, th, gradeProfile).slice(0, 8)
                    : subjClasses.slice(0, 8);
                const teacherVsTown = subjTeachers.length
                    ? buildTeacherTownshipBenchmark(allRows, mySchool, subj, subjTeachers, th, gradeProfile).slice(0, 9)
                    : classVsTown.map((c, idx) => ({ ...c, scoreRank: idx + 1 }));
                const border = buildBorderlineChips(activeRows, subj, th);
                const diag = subjectDiag.find((d) => d.subject === subj);

                const classChart = {
                    title: `班级·${subj}对比`,
                    categories: classVsTown.map((c) => c.name),
                    series: [
                        { name: '均分', color: theme.accent, values: classVsTown.map((c) => c.avg) },
                        { name: '优秀率%', color: theme.accent2, values: classVsTown.map((c) => c.excRate) },
                        { name: '及格率%', color: theme.accent3, values: classVsTown.map((c) => c.passRate) }
                    ]
                };
                const teacherChartPool = (subjTeachers.length ? subjTeachers : subjClasses).slice(0, 6);
                const teacherChart = {
                    title: `同学科教师·${subj}对比`,
                    categories: teacherChartPool.map((t) => t.teacher ? `${t.teacher}(${t.classes.join('/')})` : t.name),
                    series: [
                        { name: '均分', color: theme.accent, values: teacherChartPool.map((t) => t.avg) },
                        { name: '优秀率%', color: theme.accent2, values: teacherChartPool.map((t) => t.excRate) },
                        { name: '及格率%', color: theme.accent3, values: teacherChartPool.map((t) => t.passRate) }
                    ]
                };

                slides.push({
                    kind: 'subjectDashboard',
                    subject: subj,
                    title: `${subj}［${diag?.roleLabel || '学科'}］· 班级与教师两率一分对比`,
                    subtitle: diag && townMatrix.hasTownship
                        ? `本校全镇第 ${diag.rank}/${diag.totalSchools} 名（${diag.tier} · 两率一分 ${diag.score2Rate} · 较镇均 ${diag.avgDiff >= 0 ? '+' : ''}${diag.avgDiff} 分 · 班际极差 ${diag.classSpread} 分）`
                        : `${mySchool} · 优秀线 ${th.exc} / 及格线 ${th.pass}`,
                    kpis: [
                        { label: '人数 / 角色', val: `${subjMetric.count}人·${diag?.roleLabel || '考核'}`, color: theme.accent },
                        { label: '学科均分', val: `${subjMetric.avg}`, color: '1D4ED8' },
                        { label: '优秀率%', val: `${subjMetric.excRate}%`, color: '0D9488' },
                        { label: '及格率%', val: `${subjMetric.passRate}%`, color: 'B45309' }
                    ],
                    classChart,
                    teacherChart,
                    headers: ['名次', '教师/班级(外校)', '均分', '优秀率%', '及格率%', `两率一分(${gradeProfile.weights.total})`],
                    rows: teacherVsTown.map((r) => ({
                        isEmph: r.kind === 'own-teacher' || r.kind === 'own-class',
                        cells: [
                            String(r.scoreRank || ''),
                            r.name,
                            String(r.avg),
                            String(r.excRate),
                            String(r.passRate),
                            String(r.score)
                        ]
                    })),
                    footerNote: `${subj}均分 ${subjMetric.avg}，优率 ${subjMetric.excRate}%，及格 ${subjMetric.passRate}%；优秀边缘 ${border.excMarginal.length} 人（${border.excMarginal.slice(0, 4).map((s) => `${s.name}${s.score}`).join('、') || '无'}）、及格边缘 ${border.passMarginal.length} 人。施策：${diag ? diag.measure : '精准面批临界生。'}`
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
            subtitle: `${presenter}  ·  ${examTitle}（${gradeProfile.shortTag}）`
        });

        return { slides, gradeProfile, subjectPolicy, theme, themeKey, examTitle, presenter, mySchool, thresholdInfo, townMatrix, subjectDiag, actionPlan, activeRowsCount: activeRows.length, allRowsCount: allRows.length, subjects };
    }

    // -------------------------------------------------------------------------
    // OOXML (.pptx) Serialization with Native Charts (<c:chartSpace>)
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
        return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
<a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fillHex}"/></a:solidFill>${lnXml}</p:spPr></p:sp>`;
    }

    function pptTextBox(id, x, y, cx, cy, lines, opts = {}) {
        const fontSize = Math.round((opts.fontSize || 16) * 100);
        const color = opts.color || '0F1419';
        const bold = opts.bold ? ' b="1"' : '';
        const align = opts.align || 'l';
        const paragraphs = (Array.isArray(lines) ? lines : [lines]).map((line) => (
            `<a:p><a:pPr algn="${align}"/><a:r><a:rPr lang="zh-CN" sz="${fontSize}"${bold} dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:rPr><a:t>${escXml(line)}</a:t></a:r></a:p>`
        )).join('');
        return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
<p:txBody><a:bodyPr wrap="square" lIns="50000" tIns="35000" rIns="50000" bIns="35000"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
    }

    function pptTable(id, x, y, cx, cy, headers, rows, theme, fontPt = 10.5) {
        const colCount = Math.max(1, headers.length);
        const colW = Math.floor(cx / colCount);
        const rowH = Math.min(330000, Math.floor(cy / Math.max(2, rows.length + 1)));
        const gridCols = headers.map(() => `<a:gridCol w="${colW}"/>`).join('');
        const bodySz = Math.round(fontPt * 100);
        const headSz = Math.round((fontPt + 0.8) * 100);
        const makeRow = (cells, isHeader, rowIdx, isEmph) => {
            const fill = isHeader ? theme.tblHead : (isEmph ? theme.rowTint : (rowIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF'));
            const txtColor = isHeader ? 'FFFFFF' : '0F1419';
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

    function pptKpiStrip(kpis, theme, y = 1220000, h = 980000) {
        return (kpis || []).map((k, kIdx) => {
            const x = 457200 + kIdx * 2880000;
            const base = 10 + kIdx * 3;
            return pptRect(base, x, y, 2680000, h, theme.soft, 'roundRect', 'CBD5E1') +
                pptTextBox(base + 1, x + 120000, y + 80000, 2400000, 280000, k.label, { fontSize: 11.5, color: '64748B', bold: true }) +
                pptTextBox(base + 2, x + 120000, y + 360000, 2400000, 520000, k.val, { fontSize: 21, bold: true, color: k.color || theme.accent });
        }).join('');
    }

    async function buildMeetingPptxBlob(options = {}) {
        const JSZipCtor = options.JSZip || root.JSZip;
        if (!JSZipCtor) throw new Error('JSZip 未加载，无法生成 PPT');
        const deck = buildMeetingDeckModel(options);
        const { theme, examTitle, presenter } = deck;
        const totalSlides = deck.slides.length;

        const headerBand = (title, subtitle, pageNo) => (
            pptRect(2, 0, 0, 12192000, 1040000, theme.bg) +
            pptRect(3, 0, 1015000, 12192000, 55000, theme.accent) +
            pptTextBox(4, 457200, 150000, 10400000, 440000, title, { fontSize: 22, bold: true, color: 'FFFFFF' }) +
            pptTextBox(5, 457200, 595000, 10400000, 320000, subtitle, { fontSize: 11.5, color: '93C5FD' }) +
            pptTextBox(98, 457200, 6520000, 9200000, 260000, `${presenter} · ${examTitle}（${deck.gradeProfile.shortTag}）`, { fontSize: 9.5, color: '94A3B8' }) +
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
                        pptTextBox(4, 720000, 1800000, 10750000, 1000000, s.title, { fontSize: 34, bold: true, color: 'FFFFFF' }) +
                        pptTextBox(5, 720000, 2950000, 10750000, 600000, s.subtitle, { fontSize: 18, color: '93C5FD' }) +
                        pptTextBox(6, 720000, 4200000, 10750000, 500000, s.meta, { fontSize: 13, color: 'CBD5E1' })
                    ),
                    images: [],
                    charts: []
                };
            }
            if (s.kind === 'overview') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptKpiStrip(s.kpis, theme, 1220000, 980000) +
                        pptChartFrame(30, 'rIdChart1', 457200, 2360000, 5600000, 4050000) +
                        pptRect(31, 6250000, 2360000, 5480000, 4050000, theme.soft, 'roundRect', 'CBD5E1') +
                        pptTextBox(32, 6430000, 2500000, 5120000, 360000, `核心诊断与全镇定位研判（${deck.gradeProfile.shortTag}）`, { fontSize: 14.5, bold: true, color: theme.tblHead }) +
                        pptTextBox(33, 6430000, 2920000, 5120000, 3350000, s.diagnostics, { fontSize: 12, color: theme.text })
                    ),
                    images: [],
                    charts: [s.chart]
                };
            }
            if (s.kind === 'splitChartTable') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptChartFrame(20, 'rIdChart1', 457200, 1300000, 5950000, 5100000) +
                        pptTable(21, 6550000, 1300000, 5180000, 5100000, s.headers, s.rows, theme, 9.5)
                    ),
                    images: [],
                    charts: [s.chart]
                };
            }
            if (s.kind === 'subjectDashboard') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptKpiStrip(s.kpis, theme, 1180000, 880000) +
                        pptTextBox(25, 457200, 2140000, 5480000, 280000, `班级 · ${s.subject}两率一分对比`, { fontSize: 12, bold: true, color: theme.tblHead }) +
                        pptChartFrame(26, 'rIdChart1', 457200, 2420000, 5480000, 3400000) +
                        pptTextBox(27, 6200000, 2140000, 5530000, 280000, `同学科教师 · ${s.subject}对比与全镇同台排名`, { fontSize: 12, bold: true, color: theme.tblHead }) +
                        pptChartFrame(28, 'rIdChart2', 6200000, 2420000, 5530000, 1580000) +
                        pptTable(29, 6200000, 4060000, 5530000, 1760000, s.headers, s.rows.slice(0, 7), theme, 9.5) +
                        pptRect(30, 457200, 5920000, 11270000, 520000, theme.soft, 'roundRect', 'CBD5E1') +
                        pptTextBox(31, 580000, 5960000, 11000000, 440000, s.footerNote, { fontSize: 10.5, color: '334155' })
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
                        pptTable(10, 457200, 1260000, 11270000, tableH, s.headers, s.rows, theme, 9.8) +
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
                    return pptPicture(20 + i, `rIdImg${i + 1}`, x, 1380000, w, 4750000);
                }).join('');
                return { xml: xmlSlideShell(headerBand(s.title, s.subtitle, pageNo) + pics), images: s.images || [], charts: [] };
            }
            if (s.kind === 'borderline') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptRect(10, 457200, 1300000, 11270000, 2320000, 'EFF6FF', 'roundRect', 'BFDBFE') +
                        pptTextBox(11, 640000, 1420000, 10850000, 380000, s.excTitle, { fontSize: 15, bold: true, color: '1D4ED8' }) +
                        pptTextBox(12, 640000, 1860000, 10850000, 1620000, s.excNames, { fontSize: 12, color: '0F1419' }) +
                        pptRect(13, 457200, 3860000, 11270000, 2320000, 'FFFBEB', 'roundRect', 'FDE68A') +
                        pptTextBox(14, 640000, 3980000, 10850000, 380000, s.passTitle, { fontSize: 15, bold: true, color: 'B45309' }) +
                        pptTextBox(15, 640000, 4420000, 10850000, 1620000, s.passNames, { fontSize: 12, color: '0F1419' })
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
                    const y = 1280000 + row * 2550000;
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
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
${slideOverrides}${chartOverrides.join('')}
</Types>`);
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);
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
<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`);
        zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);
        zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`);
        zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);
        zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SchoolTheme">
<a:themeElements><a:clrScheme name="School"><a:dk1><a:srgbClr val="0F1419"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="334155"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2><a:accent1><a:srgbClr val="${theme.accent}"/></a:accent1><a:accent2><a:srgbClr val="1D4ED8"/></a:accent2><a:accent3><a:srgbClr val="7C3AED"/></a:accent3><a:accent4><a:srgbClr val="B45309"/></a:accent4><a:accent5><a:srgbClr val="0EA5E9"/></a:accent5><a:accent6><a:srgbClr val="16A34A"/></a:accent6><a:hlink><a:srgbClr val="0284C7"/></a:hlink><a:folHlink><a:srgbClr val="6D28D9"/></a:folHlink></a:clrScheme>
<a:fontScheme name="School"><a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:majorFont><a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme>
<a:fmtScheme name="School"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
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
    // Rich 10-Sheet Grade-Differentiated Teacher Analysis Handbook Excel Exporter
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
        const gradeProfile = getGradeAnalysisProfile(options.grade);
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
        const diagnostics = buildSmartDiagnostics(overall, classTotalRows, subjectDiag.map((d) => ({ subject: d.subject, avg: d.ownAvg, passRate: d.ownPass })), totalBorderline, townMatrix, gradeProfile);

        const wb = XLSX.utils.book_new();
        const own = townMatrix.ownTotal;

        // Sheet 1: 封面与导读（含当前年级专属考核口径说明）
        const coverAoa = [
            [`${mySchool} · 澄见教学质量分析系统`],
            [`${examTitle} · 教师教学质量分析手册（${gradeProfile.shortTag}）`],
            ['生成时间', new Date().toLocaleString('zh-CN')],
            ['当前年级模式', gradeProfile.name],
            ['本年级考核算法', gradeProfile.formulaDesc],
            ['学科口径区分', `考核科目：${subjectPolicy.officialSubjects.join('、') || '全科'}；核心主科：${gradeProfile.majorSubjects.join('、')}${subjectPolicy.displayOnlySubjects.length ? `；展示/单列对比科目（不计入考核总分）：${subjectPolicy.displayOnlySubjects.join('、')}` : ''}`],
            ['划线标准', thInfo.source === 'township' ? `全镇统一划线（全镇 ${thInfo.schoolCount} 校 ${allRows.length} 人，本校 ${activeRows.length} 人）：总分优秀线 ${thInfo.thresholds['总分'].exc} 分（前15%） / 及格线 ${thInfo.thresholds['总分'].pass} 分（前50%）` : `本校划线（共 ${activeRows.length} 人）：总分优秀线 ${thInfo.thresholds['总分'].exc} 分 / 及格线 ${thInfo.thresholds['总分'].pass} 分`],
            ['本校全镇定位', townMatrix.hasTownship && own ? `综合总分 ${own.comprehensiveTotal} 分，居全镇第 ${own.comprehensiveRank}/${townMatrix.totalSchools} 名（两率一分 ${own.score2Rate} 分［第${own.scoreRank}名］，后1/3得分 ${own.scoreBottom} 分［第${own.rankBottom}名］${gradeProfile.grade === '9' ? `，490+高分赋分 ${own.scoreHigh490} 分，指标生 ${own.scoreIndicator} 分` : ''}${townMatrix.targetAhead ? `，距前一名「${townMatrix.targetAhead.name}」差 ${townMatrix.compGapToAhead} 分` : ''}）` : '单校分析模式'],
            ['年级教学重心', gradeProfile.pedagogyFocus],
            ['工作表导读', '核心用途与阅读建议'],
            ['1. 总览与全镇定位', `按本系统${gradeProfile.shortTag}展示全镇各校两率一分(${gradeProfile.weights.total})、后1/3得分(40)${gradeProfile.grade === '9' ? '、490+高分赋分(50)、指标生得分' : `、${gradeProfile.majorLabel}对标`}与综合总分排名`],
            [`2. ${gradeProfile.specialSheetName}`, gradeProfile.grade === '9' ? '九年级专属：高分段(≥490分)赋分、指标生一/二达标核算、有效后1/3学生托底三表合一' : `${gradeProfile.grade}年级专属：${gradeProfile.majorLabel} vs 全科双口径对照表 + 有效后1/3学生（剔除前15%）托底核算`],
            ['3. 班级排名', `涵盖总分与各科的各班均分、优秀率、及格率、后1/3有效均分、两率一分(${gradeProfile.weights.total})及全镇同台位次`],
            ['4. 教师排名', '涵盖本校各科任课教师校内排名、全镇外校同台排名、公平绩效分、历史生源增值纠偏与边缘转化率'],
            ['5. 一师一策画像', '【教研核心】每位任课教师专属诊断单：校内/全镇位次、增值评价、班际极差、名下优秀/及格临界生点名、转化提分幅度与改进措施'],
            ['6. 单科明细与诊断', '明确区分【核心主科 / 考核科目 / 展示对比科】，对比本校 vs 全镇均分、两率差值、班际极差、强弱判定与整改方向'],
            ['7. 优秀生名单', '总分及各学科达优秀线学生光荣榜（自动关联任课教师）'],
            ['8. 边缘生名单', '总分及各学科优秀边缘生、及格边缘生包保推进表（精确到任课教师与距线分差）'],
            ['9. 智能解读与措施', `贴合${gradeProfile.name}的考后质量分析会完整发言研判与下阶段 4 维具体整改措施清单`]
        ];
        appendHandbookSheet(XLSX, wb, '封面与导读', coverAoa, { isCover: true });

        // Sheet 2: 总览与全镇定位（100% 遵循本系统分年级综合评价公式）
        const overviewHeaders = gradeProfile.grade === '9'
            ? ['学校名称', '参评人数', '总分均分', '优秀率(%)', '及格率(%)', '两率一分(180)', '两率排名', '后1/3均分', '后1/3得分(40)', '≥490人数', '高分赋分(50)', '指标生得分', '综合总分', '综合总排名', '较镇均分差']
            : ['学校名称', '参评人数', '全科均分', '优秀率(%)', '及格率(%)', '两率一分(200)', '两率排名', '后1/3有效均分', '后1/3得分(40)', '后1/3排名', `${gradeProfile.majorLabel}均分`, `${gradeProfile.majorLabel}两率分`, '综合总分(240)', '综合总排名', '较镇均分差'];
        const overviewAoa = [
            overviewHeaders,
            ...townMatrix.schoolMatrixRows.map((sch) => (
                gradeProfile.grade === '9'
                    ? [
                        sch.isOwn ? `★ ${sch.name}（本校）` : sch.name,
                        sch.count,
                        sch.avg,
                        sch.excRate,
                        sch.passRate,
                        sch.score2Rate,
                        sch.scoreRank,
                        sch.bottom3?.avg || 0,
                        sch.scoreBottom,
                        sch.highCount490,
                        sch.scoreHigh490,
                        sch.scoreIndicator,
                        sch.comprehensiveTotal,
                        sch.comprehensiveRank,
                        Number((sch.avg - townMatrix.townOverall['总分'].avg).toFixed(2))
                    ]
                    : [
                        sch.isOwn ? `★ ${sch.name}（本校）` : sch.name,
                        sch.count,
                        sch.avg,
                        sch.excRate,
                        sch.passRate,
                        sch.score2Rate,
                        sch.scoreRank,
                        sch.bottom3?.avg || 0,
                        sch.scoreBottom,
                        sch.rankBottom,
                        sch.majorMatch ? sch.majorMatch.avg : sch.avg,
                        sch.majorMatch ? sch.majorMatch.score2Rate : sch.score2Rate,
                        sch.comprehensiveTotal,
                        sch.comprehensiveRank,
                        Number((sch.avg - townMatrix.townOverall['总分'].avg).toFixed(2))
                    ]
            ))
        ];
        appendHandbookSheet(XLSX, wb, '总览与全镇定位', overviewAoa);

        // Sheet 3: 年级专项核算表（9年级：490高分+指标生+后1/3；6/7/8年级：主科双口径对照+后1/3托底）
        if (gradeProfile.grade === '9') {
            const g9Aoa = [
                ['学校名称', '实考人数', '≥490高分人数', '高分率(%)', '高分赋分(50)', '高分排名', '指标一目标/达标', '指标二目标/达标', '指标生总分', '后1/3总人数', '剔除前15%人数', '有效后1/3均分', '后1/3得分(40)', '后1/3排名'],
                ...townMatrix.schoolMatrixRows.map((sch) => {
                    const ind = sch.indicatorInfo;
                    return [
                        sch.isOwn ? `★ ${sch.name}（本校）` : sch.name,
                        sch.count,
                        sch.highCount490,
                        sch.highRate490Pct,
                        sch.scoreHigh490,
                        sch.rankHigh490,
                        ind ? `${ind.t1}/${ind.r1}` : '未配置',
                        ind ? `${ind.t2}/${ind.r2}` : '未配置',
                        sch.scoreIndicator,
                        sch.bottom3?.bottomN || 0,
                        sch.bottom3?.excN || 0,
                        sch.bottom3?.avg || 0,
                        sch.scoreBottom,
                        sch.rankBottom
                    ];
                })
            ];
            appendHandbookSheet(XLSX, wb, gradeProfile.specialSheetName, g9Aoa);
        } else {
            const majorAoa = [
                ['对象名称', '类型', '人数', `${gradeProfile.majorLabel}均分`, '主科优秀率%', '主科及格率%', '主科两率一分(200)', '全科两率一分(200)', '有效后1/3均分', '后1/3得分(40)', '主科综合总分(240)', '主科综合排名', '诊断说明']
            ];
            (townMatrix.majorSchoolRows || []).forEach((m) => {
                const fullMatch = townMatrix.schoolMatrixRows.find((s) => s.name === m.name);
                majorAoa.push([
                    m.isOwn ? `★ ${m.name}（本校）` : m.name,
                    '全镇学校对照',
                    m.count,
                    m.avg,
                    m.excRate,
                    m.passRate,
                    m.score2Rate,
                    fullMatch ? fullMatch.score2Rate : m.score2Rate,
                    m.bottom3Avg || 0,
                    m.scoreBottom,
                    m.comprehensiveTotal,
                    m.comprehensiveRank,
                    m.isOwn ? `本校${gradeProfile.majorLabel}全镇第 ${m.comprehensiveRank} 名` : ''
                ]);
            });
            // Also append own school's classes under Major Subject caliber
            const ownMajorTh = computeThresholdForSubject(allRows, '主科总', townMatrix.majorSubjects);
            const ownMajorClasses = buildClassRows(activeRows, '总分', ownMajorTh, gradeProfile, townMatrix.majorSubjects);
            ownMajorClasses.forEach((c) => {
                const fullCls = classTotalRows.find((fc) => fc.name === c.name);
                majorAoa.push([
                    `★ 本校·${c.name}`,
                    '本校班级主科',
                    c.count,
                    c.avg,
                    c.excRate,
                    c.passRate,
                    c.score,
                    fullCls ? fullCls.score : c.score,
                    c.bottom3Avg || 0,
                    c.scoreBottom || 0,
                    Number(((c.score || 0) + (c.scoreBottom || 0)).toFixed(2)),
                    c.scoreRank,
                    `班内后1/3有效学生 ${c.bottom3ValidN || 0} 人`
                ]);
            });
            appendHandbookSheet(XLSX, wb, gradeProfile.specialSheetName, majorAoa);
        }

        // Sheet 4: 班级排名（总分 + 各科，含全镇同台名次与后1/3有效均分）
        const classRankAoa = [
            ['科目', '校内名次', '班级', '全镇同台位次', '人数', '均分', '均分名次', '优秀率%', '优秀率名次', '及格率%', '及格率名次', `两率一分(${gradeProfile.weights.total})`, '后1/3有效均分', '诊断备注']
        ];
        ['总分', ...subjects].forEach((subj) => {
            const cRows = buildClassRows(activeRows, subj, thInfo.thresholds[subj], gradeProfile);
            const tBench = thInfo.hasTownship ? buildClassTownshipBenchmark(allRows, mySchool, subj, thInfo.thresholds[subj], gradeProfile) : [];
            const topAvg = cRows[0]?.avg || 0;
            cRows.forEach((c) => {
                const inTown = tBench.find((x) => x.kind === 'own-class' && x.name === c.name);
                const gap = Number((topAvg - c.avg).toFixed(1));
                classRankAoa.push([
                    subj,
                    c.scoreRank,
                    c.name,
                    inTown ? `全镇同台第 ${inTown.scoreRank} 名` : `校内第 ${c.scoreRank} 名`,
                    c.count,
                    c.avg,
                    c.avgRank,
                    c.excRate,
                    c.excRank,
                    c.passRate,
                    c.passRank,
                    c.score,
                    subj === '总分' ? (c.bottom3Avg || 0) : '—',
                    c.scoreRank === 1 ? '★ 领跑班级' : (gap >= 8 ? `距领跑班差 ${gap} 分，需重点帮扶` : `距领跑班差 ${gap} 分`)
                ]);
            });
        });
        appendHandbookSheet(XLSX, wb, '班级排名', classRankAoa);

        // Sheet 5: 教师排名（校内 + 全镇同台 + 公平绩效分 + 生源增值）
        const teacherRankAoa = [
            ['学科', '校内名次', '教师', '任教班', '全镇同台名次', '人数', '均分', '校均排/镇均排', '优秀率%', '校优排/镇优排', '及格率%', '校及排/镇及排', `两率一分(${gradeProfile.weights.total})`, '公平绩效分', '历史生源增值', '边缘转化成效', '较镇均差', '画像标签']
        ];
        teacherRows.forEach((r) => {
            teacherRankAoa.push([
                r.subject,
                r.scoreRank,
                r.teacher,
                r.classes.join('、'),
                `全镇第 ${r.townRank}/${r.townSchoolTotal} 名`,
                r.count,
                r.avg,
                `校#${r.avgRank} / 镇#${r.townAvgRank}`,
                r.excRate,
                `校#${r.excRank} / 镇#${r.townExcRank}`,
                r.passRate,
                `校#${r.passRank} / 镇#${r.townPassRank}`,
                r.score,
                r.fairScore !== null ? `${r.fairScore} (#${r.fairRank || '-'})` : '—',
                r.baselineAdjustment !== null ? (r.baselineAdjustment >= 0 ? `+${r.baselineAdjustment}` : String(r.baselineAdjustment)) : '无历史基线',
                r.conversionSummary,
                r.diffVsTownAvg,
                r.profileTag
            ]);
        });
        appendHandbookSheet(XLSX, wb, '教师排名', teacherRankAoa);

        // Sheet 6: 一师一策画像与包保任务（直接点名每位老师名下的临界生与提分潜力）
        const portraitAoa = [
            ['学科', '任课教师', '任教班级', '人数', '均分(校排/镇排)', `两率一分(${gradeProfile.weights.total})`, '公平绩效与增值', '所教班极差', '画像诊断', '名下优秀边缘生(面批冲优名单)', '冲优可提幅度', '名下及格边缘生(保底清零名单)', '保底可提幅度', '下阶段具体教学改进措施']
        ];
        teacherRows.forEach((r) => {
            portraitAoa.push([
                r.subject,
                r.teacher,
                r.classes.join('、'),
                r.count,
                `${r.avg} (校#${r.avgRank} / 镇#${r.townAvgRank})`,
                r.score,
                r.fairScore !== null ? `绩效${r.fairScore} (增值${r.baselineAdjustment >= 0 ? '+' : ''}${r.baselineAdjustment || 0})` : r.conversionSummary,
                r.classSpread,
                r.profileTag,
                r.excMarginal.slice(0, 15).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '无',
                `+${r.excLift}% (${r.excMarginal.length}人)`,
                r.passMarginal.slice(0, 15).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '无',
                `+${r.passLift}% (${r.passMarginal.length}人)`,
                r.advice
            ]);
        });
        appendHandbookSheet(XLSX, wb, '一师一策画像', portraitAoa);

        // Sheet 7: 单科明细与强弱诊断（含口径属性区分：核心主科 / 考核科目 / 展示对比科）
        const subjectDetailAoa = [
            ['学科', '口径属性', '人数', '本校均分', '全镇均分', '较镇均差', `两率一分(${gradeProfile.weights.total})`, '全镇位次', '优秀线', '优秀率%', '优秀人数', '优秀边缘', '及格线', '及格率%', '及格边缘', '班际极差', '领跑班', '薄弱班', '强弱判定', '病因诊断', '教研组整改方向与措施']
        ];
        subjectDiag.forEach((d) => {
            const th = thInfo.thresholds[d.subject] || { exc: 0, pass: 0 };
            const m = calcGroupMetrics(activeRows, d.subject, th);
            const b = buildBorderlineChips(activeRows, d.subject, th);
            subjectDetailAoa.push([
                d.subject,
                d.roleLabel,
                m.count,
                d.ownAvg,
                d.townAvg,
                d.avgDiff,
                d.score2Rate,
                `第 ${d.rank}/${d.totalSchools} 名`,
                th.exc,
                d.ownExc,
                m.excCount,
                b.excMarginal.length,
                th.pass,
                d.ownPass,
                b.passMarginal.length,
                d.classSpread,
                d.topClass,
                d.weakClass,
                d.tier,
                d.issueType,
                d.measure
            ]);
        });
        appendHandbookSheet(XLSX, wb, '单科明细', subjectDetailAoa);

        // Sheet 8: 优秀生名单（总分 + 单科）
        const excListAoa = [['类别', '科目', '姓名', '班级', '学校', '任课教师', '分数', '对应优秀线', '超线分值']];
        ['总分', ...subjects].forEach((subj) => {
            const b = buildBorderlineChips(activeRows, subj, thInfo.thresholds[subj]);
            b.excellent.forEach((s) => {
                excListAoa.push([
                    subj === '总分' ? '总分优秀' : '单科优秀',
                    subj,
                    s.name,
                    s.class,
                    s.school || mySchool,
                    subj === '总分' ? '全科教师' : (teacherLookup.get(s.class, subj) || '—'),
                    s.score,
                    b.exc,
                    Number((s.score - b.exc).toFixed(1))
                ]);
            });
        });
        appendHandbookSheet(XLSX, wb, '优秀生名单', excListAoa);

        // Sheet 9: 边缘生名单（精确到任课教师与距线分差）
        const borderAoa = [['类别', '科目', '姓名', '班级', '学校', '任课教师', '当前分数', '目标分数线', '距达线分差', '转化动作建议']];
        ['总分', ...subjects].forEach((subj) => {
            const b = buildBorderlineChips(activeRows, subj, thInfo.thresholds[subj]);
            b.excMarginal.forEach((s) => {
                borderAoa.push([
                    '优秀边缘',
                    subj,
                    s.name,
                    s.class,
                    s.school || mySchool,
                    subj === '总分' ? '班主任统筹' : (teacherLookup.get(s.class, subj) || '—'),
                    s.score,
                    b.exc,
                    `差 ${s.gapToExc} 分达优`,
                    '每周面批 1 次综合卷，减少中档题非智力失分'
                ]);
            });
            b.passMarginal.forEach((s) => {
                borderAoa.push([
                    '及格边缘',
                    subj,
                    s.name,
                    s.class,
                    s.school || mySchool,
                    subj === '总分' ? '班主任统筹' : (teacherLookup.get(s.class, subj) || '—'),
                    s.score,
                    b.pass,
                    `差 ${s.gapToPass} 分及格`,
                    '落实课本基础题与核心概念每日过关打卡'
                ]);
            });
        });
        appendHandbookSheet(XLSX, wb, '边缘生名单', borderAoa);

        // Sheet 10: 智能解读与整改方案（分年级定制）
        const smartAoa = [
            ['维度标签', '责任主体', '分析结论与具体落地措施'],
            ['年级考核模式', '教导处 / 级部', `${gradeProfile.name} —— 考核公式：${gradeProfile.formulaDesc}。教学战略重心：${gradeProfile.pedagogyFocus}`],
            ...diagnostics.map((line, i) => [['总体与镇域定位', '年级专项剖析', '班级与后1/3诊断', '学科与临界生抓手'][i] || '综合研判', '教导处 / 级部', line]),
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
            ...benchRows.map((r) => [r.name, r.kind === 'own-class' ? '本校班级' : '外校', r.count, r.avg, r.avgRank, r.excRate, r.excRank, r.passRate, r.passRank, r.score, r.scoreRank])
        ];
        appendHandbookSheet(XLSX, wb, `${subject}镇域对标`, aoa);
        const fileName = `班级镇域对标_${gradeProfile.shortTag}_${subject}_${examTitle.replace(/[\\/:*?"<>|]/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast(`已导出 ${fileName}`, 'success');
        return true;
    }

    // -------------------------------------------------------------------------
    // Refined Scoped Styles + Rich Visual Bar Chart Preview in 16:9 Stage
    // -------------------------------------------------------------------------
    function ensureStyles() {
        const doc = root.document;
        if (!doc || doc.getElementById('qmk-style')) return;
        const style = doc.createElement('style');
        style.id = 'qmk-style';
        style.textContent = `
.qmk-mask{position:fixed;inset:0;background:rgba(15,20,25,.48);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
.qmk-dialog{background:var(--bg-card,#fff);color:var(--color-data,#0f1419);border:1px solid var(--border,#e5e7eb);border-radius:18px;width:min(1200px,96vw);max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(15,20,25,.18);overflow:hidden}
.qmk-head{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border,#eff3f4);background:var(--bg-card,#fff)}
.qmk-head-meta{display:grid;gap:3px}
.qmk-head h3{margin:0;font-size:17px;font-weight:700;letter-spacing:-.01em;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.qmk-head p{margin:0;font-size:12px;color:var(--secondary,#536471)}
.qmk-mode-badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;font-size:11.5px;font-weight:700;background:rgba(29,155,240,.12);color:#0284c7}
.qmk-close{width:34px;height:34px;border-radius:999px;border:1px solid var(--border,#e5e7eb);background:transparent;color:var(--secondary,#536471);font-size:18px;cursor:pointer;display:grid;place-items:center;transition:background .15s}
.qmk-close:hover{background:var(--primary-light,#eff3f4);color:var(--color-data,#0f1419)}
.qmk-body{padding:18px 24px;overflow:auto;display:grid;gap:14px;background:var(--bg-body,#f7f9f9)}
.qmk-grade-bar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:12px;padding:10px 14px;font-size:12px}
.qmk-grade-pills{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.qmk-grade-pill{padding:4px 11px;border-radius:999px;border:1px solid var(--border,#d1d5db);background:transparent;color:var(--color-data,#0f1419);font-size:12px;font-weight:600;cursor:pointer}
.qmk-grade-pill.is-active{background:#0284c7;color:#fff;border-color:#0284c7}
.qmk-nav-pills{display:flex;gap:8px;flex-wrap:wrap;background:var(--bg-card,#fff);padding:6px;border-radius:14px;border:1px solid var(--border,#e5e7eb);width:fit-content}
.qmk-nav-pill{padding:7px 16px;border-radius:10px;border:none;background:transparent;color:var(--secondary,#536471);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
.qmk-nav-pill.is-active{background:var(--primary,#0f1419);color:var(--bg-card,#fff)}
.qmk-studio{display:grid;grid-template-columns:340px minmax(0,1fr);gap:18px;align-items:start}
@media(max-width:860px){.qmk-studio{grid-template-columns:1fr}}
.qmk-panel{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:16px;display:grid;gap:11px}
.qmk-label{display:grid;gap:5px;font-size:12px;font-weight:600;color:var(--secondary,#536471)}
.qmk-input{padding:8px 11px;border:1px solid var(--border,#d1d5db);border-radius:10px;background:var(--bg-card,#fff);color:var(--color-data,#0f1419);font-size:13px;outline:none}
.qmk-input:focus{border-color:#1d9bf0}
.qmk-theme-row{display:flex;gap:8px;flex-wrap:wrap}
.qmk-swatch{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid var(--border,#d1d5db);background:var(--bg-card,#fff);color:var(--color-data,#0f1419);font-size:12px;cursor:pointer}
.qmk-swatch.is-active{border-color:#1d9bf0;box-shadow:0 0 0 2px rgba(29,155,240,.18);font-weight:600}
.qmk-dot{width:10px;height:10px;border-radius:999px;display:inline-block}
.qmk-check-list{display:grid;gap:6px}
.qmk-check-item{display:flex;gap:8px;align-items:center;padding:6px 10px;border:1px solid var(--border,#e5e7eb);border-radius:10px;background:var(--bg-body,#f7f9f9);font-size:12px;cursor:pointer}
.qmk-stage-wrap{display:grid;gap:12px}
.qmk-stage{aspect-ratio:16/9;width:100%;border-radius:14px;overflow:hidden;border:1px solid var(--border,#dbe2e8);background:#fff;box-shadow:0 12px 32px rgba(15,20,25,.08);display:flex;flex-direction:column;color:#0f1419}
.qmk-stage-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.qmk-thumbs{display:flex;gap:5px;flex-wrap:wrap}
.qmk-thumb{padding:4px 9px;border-radius:999px;border:1px solid var(--border,#d1d5db);background:var(--bg-card,#fff);color:var(--secondary,#536471);font-size:11.5px;cursor:pointer}
.qmk-thumb.is-active{background:var(--primary,#0f1419);color:var(--bg-card,#fff);border-color:var(--primary,#0f1419)}
.qmk-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:720px){.qmk-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.qmk-kpi{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:14px 16px;display:grid;gap:4px}
.qmk-kpi span{font-size:12px;color:var(--secondary,#536471)}
.qmk-kpi strong{font-size:20px;font-weight:700;letter-spacing:-.02em}
.qmk-kpi small{font-size:11.5px;color:var(--secondary,#536471)}
.qmk-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:var(--bg-card,#fff);padding:12px 16px;border-radius:14px;border:1px solid var(--border,#e5e7eb)}
.qmk-tabs{display:flex;flex-wrap:wrap;gap:6px}
.qmk-tab{padding:5px 12px;border-radius:999px;border:1px solid var(--border,#d1d5db);background:transparent;color:var(--color-data,#0f1419);cursor:pointer;font-size:12.5px;transition:all .15s}
.qmk-tab:hover{background:var(--primary-light,#eff3f4)}
.qmk-tab.is-active{background:var(--primary,#0f1419);color:var(--bg-card,#fff);border-color:var(--primary,#0f1419)}
.qmk-table-card{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;overflow:auto}
.qmk-table{width:100%;border-collapse:collapse;font-size:13px}
.qmk-table th,.qmk-table td{padding:10px 12px;border-bottom:1px solid var(--border,#eff3f4);text-align:center;white-space:nowrap}
.qmk-table th{background:var(--bg-body,#f7f9f9);font-weight:600;color:var(--secondary,#536471);font-size:12px;cursor:pointer;user-select:none}
.qmk-table th:first-child,.qmk-table td:first-child{text-align:left;padding-left:16px}
.qmk-table tr.is-own{background:rgba(0,186,124,.07);font-weight:600}
.qmk-metric{display:inline-flex;flex-direction:column;align-items:center;gap:3px;min-width:74px}
.qmk-metric-top{display:inline-flex;align-items:center;gap:4px}
.qmk-meter{width:68px;height:4px;border-radius:999px;background:rgba(148,163,184,.24);overflow:hidden}
.qmk-meter>i{display:block;height:100%;border-radius:999px;background:#1d9bf0}
.qmk-rk{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;font-size:11px;font-weight:700}
.qmk-rk-1{background:#fef3c7;color:#b45309}
.qmk-rk-2{background:#e2e8f0;color:#334155}
.qmk-rk-3{background:#ffedd5;color:#c2410c}
.qmk-rk-n{background:rgba(148,163,184,.16);color:var(--secondary,#536471)}
.qmk-tag{display:inline-block;padding:2px 7px;border-radius:999px;font-size:11px;margin-left:6px;font-weight:600}
.qmk-tag-own,.qmk-tier-lead{background:rgba(0,186,124,.14);color:#00875a}
.qmk-tag-ext,.qmk-tier-mid{background:rgba(148,163,184,.16);color:var(--secondary,#536471)}
.qmk-tier-weak{background:rgba(244,33,46,.12);color:#dc2626}
.qmk-tier-warn{background:rgba(245,158,11,.14);color:#b45309}
.qmk-plan-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:14px}
@media(max-width:560px){.qmk-plan-grid{grid-template-columns:1fr}}
.qmk-plan-card{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:16px 18px;display:grid;gap:8px;align-content:start}
.qmk-plan-head{display:flex;justify-content:space-between;align-items:center;gap:8px}
.qmk-plan-head strong{font-size:14.5px}
.qmk-plan-summary{font-size:13px;line-height:1.6;color:var(--color-data,#0f1419);background:var(--bg-body,#f7f9f9);padding:9px 12px;border-radius:10px}
.qmk-plan-steps{margin:0;padding-left:18px;display:grid;gap:5px;font-size:12.5px;line-height:1.6;color:var(--secondary,#475569)}
.qmk-chips-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
.qmk-chips-box{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:14px 16px;display:grid;gap:10px}
.qmk-chips-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;font-weight:600}
.qmk-chips{display:flex;flex-wrap:wrap;gap:6px}
.qmk-chip{padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid var(--border,#e5e7eb);background:var(--bg-body,#f7f9f9)}
.qmk-chip-exc{background:rgba(29,155,240,.08);border-color:rgba(29,155,240,.25);color:#0369a1}
.qmk-chip-pass{background:rgba(245,158,11,.10);border-color:rgba(245,158,11,.30);color:#b45309}
.qmk-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 24px;border-top:1px solid var(--border,#eff3f4);background:var(--bg-card,#fff)}
body.dark-mode .qmk-chip-exc,body.dark-mode .qmk-mode-badge{color:#7dd3fc}
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
                <div class="qmk-head-meta"><h3>${escHtml(title)}</h3><p>${escHtml(subtitle || '')}</p></div>
                <button type="button" class="qmk-close" aria-label="关闭">&times;</button>
            </div>
            <div class="qmk-body"></div>
            <div class="qmk-foot"></div>
        </div>`;
        const close = () => mask.remove();
        mask.querySelector('.qmk-close').addEventListener('click', close);
        mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
        doc.body.appendChild(mask);
        return { mask, body: mask.querySelector('.qmk-body'), foot: mask.querySelector('.qmk-foot'), close };
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

    function renderMiniBarChartHtml(chartSpec, heightPx = 150) {
        if (!chartSpec || !Array.isArray(chartSpec.categories) || !chartSpec.categories.length) return '';
        const cats = chartSpec.categories.slice(0, 8);
        const series = chartSpec.series || [];
        const allVals = series.flatMap((s) => (s.values || []).slice(0, 8).map((v) => Number(v) || 0));
        const maxVal = Math.max(...allVals, 10);
        const legend = series.map((s) => `<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;color:#475569;"><i style="width:8px;height:8px;border-radius:2px;background:#${s.color || '165DFF'};display:inline-block;"></i>${escHtml(s.name)}</span>`).join('');
        const cols = cats.map((cat, cIdx) => {
            const bars = series.map((s) => {
                const v = Number(s.values?.[cIdx]) || 0;
                const hPct = Math.max(4, Math.min(100, Math.round((v / maxVal) * 100)));
                return `<div title="${escHtml(s.name)}: ${v}" style="flex:1;max-width:14px;height:${hPct}%;background:#${s.color || '165DFF'};border-radius:3px 3px 0 0;"></div>`;
            }).join('');
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;min-width:0;">
                <div style="width:100%;flex:1;display:flex;align-items:flex-end;justify-content:center;gap:2px;border-bottom:1px solid #cbd5e1;padding:0 2px;">${bars}</div>
                <div style="font-size:9.5px;color:#475569;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${escHtml(String(cat).slice(0, 5))}</div>
            </div>`;
        }).join('');
        return `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;background:#fff;display:flex;flex-direction:column;gap:6px;height:${heightPx}px;box-sizing:border-box;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;"><strong style="font-size:10.5px;color:#0f172a;">${escHtml(chartSpec.title || '')}</strong><div style="display:flex;gap:8px;">${legend}</div></div>
            <div style="flex:1;display:flex;gap:6px;align-items:flex-end;min-height:0;">${cols}</div>
        </div>`;
    }

    function renderMiniTableHtml(headers, rows, theme, maxRows = 7) {
        return `<table style="width:100%;border-collapse:collapse;font-size:9.8px;">
            <thead><tr>${(headers || []).map((h) => `<th style="background:#${theme.tblHead};color:#fff;padding:4px 5px;text-align:center;">${escHtml(h)}</th>`).join('')}</tr></thead>
            <tbody>${(rows || []).slice(0, maxRows).map((r, i) => `<tr style="background:${r.isEmph ? `#${theme.rowTint};font-weight:600;` : (i % 2 ? '#f8fafc' : '#fff')}">${(r.cells || r).map((c) => `<td style="padding:3.5px 5px;border-bottom:1px solid #e2e8f0;text-align:center;">${escHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
    }

    function renderSlidePreviewHtml(slide, theme, pageNo, total) {
        if (!slide) return '';
        if (slide.kind === 'cover' || slide.kind === 'closing') {
            return `<div style="flex:1;background:#${theme.bg};color:#fff;padding:8% 9%;display:flex;flex-direction:column;justify-content:center;gap:14px;${slide.kind === 'closing' ? 'align-items:center;text-align:center;' : ''}">
                ${slide.kind === 'cover' ? `<div style="width:56px;height:5px;border-radius:99px;background:#${theme.accent};"></div>` : ''}
                <div style="font-size:23px;font-weight:700;line-height:1.25;">${escHtml(slide.title)}</div>
                <div style="font-size:13.5px;color:#93c5fd;">${escHtml(slide.subtitle)}</div>
                ${slide.meta ? `<div style="font-size:11px;color:#cbd5e1;margin-top:6px;line-height:1.5;">${escHtml(slide.meta)}</div>` : ''}
            </div>`;
        }
        const headHtml = `<div style="background:#${theme.bg};color:#fff;padding:10px 18px;border-bottom:3px solid #${theme.accent};display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-size:14.5px;font-weight:700;">${escHtml(slide.title)}</div><div style="font-size:10.2px;color:#93c5fd;margin-top:2px;">${escHtml(slide.subtitle || '')}</div></div>
            <div style="font-size:10.5px;color:#94a3b8;">${pageNo} / ${total}</div>
        </div>`;
        const kpiRow = (kpis) => `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
            ${(kpis || []).map((k) => `<div style="background:#${theme.soft};border-radius:8px;padding:6px 10px;border:1px solid #cbd5e1;"><div style="font-size:9.8px;color:#64748b;">${escHtml(k.label)}</div><div style="font-size:13.5px;font-weight:700;color:#${k.color};">${escHtml(k.val)}</div></div>`).join('')}
        </div>`;

        if (slide.kind === 'overview') {
            return `${headHtml}<div style="flex:1;padding:12px 18px;display:grid;gap:10px;align-content:start;background:#fff;">
                ${kpiRow(slide.kpis)}
                <div style="display:grid;grid-template-columns:1.05fr 1fr;gap:10px;align-items:stretch;">
                    ${renderMiniBarChartHtml(slide.chart, 175)}
                    <div style="background:#${theme.soft};border-radius:8px;padding:10px 12px;border:1px solid #cbd5e1;font-size:10.2px;line-height:1.55;color:#1e293b;">
                        <div style="font-weight:700;color:#${theme.tblHead};margin-bottom:4px;">核心诊断与全镇定位研判</div>
                        ${slide.diagnostics.map((d) => `<div style="margin-bottom:3px;">${escHtml(d)}</div>`).join('')}
                    </div>
                </div>
            </div>`;
        }
        if (slide.kind === 'splitChartTable') {
            return `${headHtml}<div style="flex:1;padding:12px 18px;display:grid;grid-template-columns:1.15fr 1.05fr;gap:12px;align-items:start;background:#fff;overflow:hidden;">
                ${renderMiniBarChartHtml(slide.chart, 235)}
                <div>${renderMiniTableHtml(slide.headers, slide.rows, theme, 9)}</div>
            </div>`;
        }
        if (slide.kind === 'subjectDashboard') {
            return `${headHtml}<div style="flex:1;padding:10px 18px;display:grid;gap:8px;align-content:start;background:#fff;overflow:hidden;">
                ${kpiRow(slide.kpis)}
                <div style="display:grid;grid-template-columns:1fr 1.05fr;gap:10px;align-items:start;">
                    ${renderMiniBarChartHtml(slide.classChart, 165)}
                    <div style="display:grid;gap:6px;">
                        ${renderMiniBarChartHtml(slide.teacherChart, 78)}
                        ${renderMiniTableHtml(slide.headers, slide.rows, theme, 4)}
                    </div>
                </div>
                <div style="background:#${theme.soft};border:1px solid #cbd5e1;border-radius:6px;padding:5px 10px;font-size:9.8px;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(slide.footerNote)}</div>
            </div>`;
        }
        if (slide.kind === 'table') {
            return `${headHtml}<div style="flex:1;padding:12px 18px;overflow:hidden;display:flex;flex-direction:column;gap:8px;background:#fff;">
                ${renderMiniTableHtml(slide.headers, slide.rows, theme, 8)}
                ${slide.footerNote ? `<div style="font-size:10.2px;color:#475569;">${escHtml(slide.footerNote)}</div>` : ''}
            </div>`;
        }
        if (slide.kind === 'charts') {
            return `${headHtml}<div style="flex:1;padding:14px 20px;display:flex;gap:12px;align-items:center;justify-content:center;background:#fff;">
                ${(slide.images || []).map((img) => `<img src="data:image/png;base64,${img.base64}" alt="${escHtml(img.title)}" style="max-height:100%;max-width:${slide.images.length > 1 ? '48%' : '92%'};object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;">`).join('')}
            </div>`;
        }
        if (slide.kind === 'actionPlan') {
            return `${headHtml}<div style="flex:1;padding:12px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#fff;align-content:start;">
                ${(slide.actions || []).slice(0, 4).map((a, i) => `<div style="background:#${theme.soft};border:1px solid #cbd5e1;border-radius:10px;padding:9px 11px;font-size:10.2px;line-height:1.5;">
                    <div style="font-weight:700;color:#${theme.tblHead};margin-bottom:3px;">${i + 1}. ${escHtml(a.dimension)}（${escHtml(a.owner)}）</div>
                    <div style="color:#0f1419;margin-bottom:3px;">${escHtml(a.summary)}</div>
                    ${(a.steps || []).slice(0, 2).map((st) => `<div style="color:#475569;">• ${escHtml(st)}</div>`).join('')}
                </div>`).join('')}
            </div>`;
        }
        return `${headHtml}<div style="flex:1;padding:14px 20px;display:grid;gap:10px;background:#fff;align-content:start;">
            <div style="background:#eff6ff;border-radius:10px;padding:10px 14px;font-size:11.5px;line-height:1.6;"><div style="font-weight:700;color:#1d4ed8;margin-bottom:4px;">${escHtml(slide.excTitle)}</div><div>${escHtml(slide.excNames)}</div></div>
            <div style="background:#fffbeb;border-radius:10px;padding:10px 14px;font-size:11.5px;line-height:1.6;"><div style="font-weight:700;color:#b45309;margin-bottom:4px;">${escHtml(slide.passTitle)}</div><div>${escHtml(slide.passNames)}</div></div>
        </div>`;
    }

    function renderGradeModeSelectorHtml(currentGrade, gradeProfile) {
        return `<div class="qmk-grade-bar">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span class="qmk-mode-badge">${escHtml(gradeProfile.name)}</span>
                <span style="color:var(--secondary,#536471);">口径：${escHtml(gradeProfile.formulaDesc)}</span>
            </div>
            <div class="qmk-grade-pills">
                <span style="color:var(--secondary,#536471);">切换年级分析模式：</span>
                ${['6', '7', '8', '9'].map((g) => `<button type="button" class="qmk-grade-pill ${g === currentGrade ? 'is-active' : ''}" data-qmk-grade="${g}">${g}年级模式</button>`).join('')}
            </div>
        </div>`;
    }

    // -------------------------------------------------------------------------
    // UI Entry 1: Quality Analysis Meeting PPT Studio (Live 16:9 Preview)
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
        const modal = createModalShell('qmk-ppt-modal', '质量分析会 PPT 课件工作室（分年级评价引擎 + 原生矢量图表）', '基于本系统 6/7/8/9 年级差异化考核口径自动生成左图右表 PPT 与 10 表精装版教师手册');

        function render() {
            const deck = buildMeetingDeckModel(state);
            const gp = deck.gradeProfile;
            if (state.previewIdx >= deck.slides.length) state.previewIdx = deck.slides.length - 1;
            const currentSlide = deck.slides[state.previewIdx];

            const slideChecks = [
                { key: 'overview', label: `总体概览 + 各科均分图 (${gp.shortTag})` },
                { key: 'gradeSpecial', label: gp.specialSlideTitle.slice(0, 22) },
                { key: 'townPosition', label: '全镇校际定位与各科强弱诊断表' },
                { key: 'classRank', label: `班级总分左图右表 (满分${gp.weights.total})` },
                { key: 'subjects', label: `分学科双柱状图 + 教师同台表 (${deck.subjects.length}科)` },
                { key: 'borderline', label: '重点临界生抓手与提分测算' },
                { key: 'actionPlan', label: `下阶段 4 维提质方向 (${gp.grade}年级定制)` }
            ];

            modal.body.innerHTML = `${renderGradeModeSelectorHtml(state.grade, gp)}
            <div class="qmk-studio">
                <div class="qmk-panel">
                    <label class="qmk-label">汇报主标题<input class="qmk-input" id="qmk-ppt-title" value="${escHtml(state.examTitle)}"></label>
                    <label class="qmk-label">汇报单位 / 汇报人<input class="qmk-input" id="qmk-ppt-presenter" value="${escHtml(state.presenter)}"></label>
                    <div class="qmk-label">课件视觉主题
                        <div class="qmk-theme-row">
                            ${Object.entries(PPT_THEMES).map(([k, t]) => `<button type="button" class="qmk-swatch ${k === state.theme ? 'is-active' : ''}" data-qmk-theme="${k}"><span class="qmk-dot" style="background:#${t.bg};"></span>${escHtml(t.name)}</button>`).join('')}
                        </div>
                    </div>
                    <label class="qmk-check-item" style="justify-content:space-between;">
                        <span>套用全镇划线（优 ${deck.thresholdInfo.thresholds['总分'].exc} / 及 ${deck.thresholdInfo.thresholds['总分'].pass}）</span>
                        <input type="checkbox" id="qmk-use-township-line" ${deck.thresholdInfo.source === 'township' ? 'checked' : ''} ${deck.thresholdInfo.hasTownship ? '' : 'disabled'}>
                    </label>
                    <div class="qmk-label">包含页面（共 ${deck.slides.length} 页）
                        <div class="qmk-check-list">
                            ${slideChecks.map((item) => `<label class="qmk-check-item"><input type="checkbox" data-qmk-slide="${item.key}" ${state.include[item.key] ? 'checked' : ''}><span>${escHtml(item.label)}</span></label>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="qmk-stage-wrap">
                    <div class="qmk-stage">${renderSlidePreviewHtml(currentSlide, deck.theme, state.previewIdx + 1, deck.slides.length)}</div>
                    <div class="qmk-stage-nav">
                        <div class="qmk-thumbs">
                            ${deck.slides.map((s, i) => `<button type="button" class="qmk-thumb ${i === state.previewIdx ? 'is-active' : ''}" data-qmk-page="${i}">${i + 1}. ${escHtml(s.title.slice(0, 6))}</button>`).join('')}
                        </div>
                        <div style="display:flex;gap:6px;">
                            <button type="button" class="qmk-tab" id="qmk-prev-slide" ${state.previewIdx <= 0 ? 'disabled' : ''}>上一页</button>
                            <button type="button" class="qmk-tab" id="qmk-next-slide" ${state.previewIdx >= deck.slides.length - 1 ? 'disabled' : ''}>下一页</button>
                        </div>
                    </div>
                </div>
            </div>`;

            modal.foot.innerHTML = `
                <span style="font-size:12px;color:var(--secondary,#536471);">当前模式：${escHtml(gp.name)} · 支持一键导出 10 表精装教师分析手册与原生矢量图表 PPT</span>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="btn" id="qmk-btn-handbook">导出 10 表教师分析手册 (${gp.grade}年级版 Excel)</button>
                    <button type="button" class="btn btn-green" id="qmk-btn-download-ppt">下载质量分析会 PPT（${deck.slides.length} 页）</button>
                </div>`;

            modal.body.querySelectorAll('[data-qmk-grade]').forEach((btn) => btn.addEventListener('click', () => {
                state.grade = btn.dataset.qmkGrade;
                render();
            }));
            modal.body.querySelector('#qmk-ppt-title').addEventListener('change', (e) => { state.examTitle = e.target.value.trim() || getExamTitle(); render(); });
            modal.body.querySelector('#qmk-ppt-presenter').addEventListener('change', (e) => { state.presenter = e.target.value.trim() || `${mySchool}教务处`; render(); });
            modal.body.querySelectorAll('[data-qmk-theme]').forEach((btn) => btn.addEventListener('click', () => { state.theme = btn.dataset.qmkTheme; render(); }));
            modal.body.querySelector('#qmk-use-township-line').addEventListener('change', (e) => { state.useTownshipLine = e.target.checked; render(); });
            modal.body.querySelectorAll('[data-qmk-slide]').forEach((el) => el.addEventListener('change', () => {
                state.include[el.dataset.qmkSlide] = el.checked;
                if (el.dataset.qmkSlide === 'classRank') state.include.townBenchmark = el.checked;
                render();
            }));
            modal.body.querySelectorAll('[data-qmk-page]').forEach((btn) => btn.addEventListener('click', () => { state.previewIdx = Number(btn.dataset.qmkPage); render(); }));
            modal.body.querySelector('#qmk-prev-slide').addEventListener('click', () => { if (state.previewIdx > 0) { state.previewIdx -= 1; render(); } });
            modal.body.querySelector('#qmk-next-slide').addEventListener('click', () => { if (state.previewIdx < deck.slides.length - 1) { state.previewIdx += 1; render(); } });
            modal.foot.querySelector('#qmk-btn-handbook').addEventListener('click', () => exportTeacherAnalysisHandbookExcel({ grade: state.grade, useTownshipLine: state.useTownshipLine, examTitle: state.examTitle }));
            modal.foot.querySelector('#qmk-btn-download-ppt').addEventListener('click', async () => {
                try {
                    const result = await buildMeetingPptxBlob(state);
                    triggerDownloadBlob(result.payload, result.fileName);
                    toast(`已生成 ${result.slideCount} 页课件（${result.gradeModeName} · 含 ${result.chartCount} 个原生图表）：${result.fileName}`, 'success');
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
        const modal = createModalShell('qmk-bench-modal', '镇域定位、班级对标与整改决策工作台（分年级差异化引擎）', '自动适配 6/7/8/9 年级综合评价体系：校际位次、主科/全科双口径、后1/3托底、临界生测算与整改措施');

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

        function render() {
            const gradeProfile = getGradeAnalysisProfile(currentGrade);
            const subjectPolicy = getDisplayAndOfficialSubjects(allRows, gradeProfile);
            const subjects = subjectPolicy.allSubjects;
            if (currentSubject !== '总分' && !subjects.includes(currentSubject)) currentSubject = '总分';
            const thInfo = resolveThresholds(allRows, activeRows, subjects, useTownshipLine);
            const th = thInfo.thresholds[currentSubject] || { exc: 0, pass: 0 };
            const overallTotal = calcGroupMetrics(activeRows, '总分', thInfo.thresholds['总分']);
            const overallSubj = calcGroupMetrics(activeRows, currentSubject, th);
            const classTotalRows = buildClassRows(activeRows, '总分', thInfo.thresholds['总分'], gradeProfile);
            const totalBorderline = buildBorderlineChips(activeRows, '总分', thInfo.thresholds['总分'], margin);
            const townMatrix = buildTownshipSchoolMatrix(allRows, mySchool, subjects, thInfo.thresholds, gradeProfile);
            const subjectDiag = buildSubjectDiagnosis(townMatrix, activeRows, subjects, thInfo.thresholds, gradeProfile, subjectPolicy.displayOnlySubjects);
            const actionPlan = buildActionPlan(townMatrix, subjectDiag, classTotalRows, totalBorderline, overallTotal, gradeProfile);

            const navHtml = `${renderGradeModeSelectorHtml(currentGrade, gradeProfile)}
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div class="qmk-nav-pills">
                    <button type="button" class="qmk-nav-pill ${activeTab === 'strategy' ? 'is-active' : ''}" data-qmk-tab="strategy">全镇定位与分年级整改方向</button>
                    <button type="button" class="qmk-nav-pill ${activeTab === 'benchmark' ? 'is-active' : ''}" data-qmk-tab="benchmark">本校班级镇域对标</button>
                    <button type="button" class="qmk-nav-pill ${activeTab === 'borderline' ? 'is-active' : ''}" data-qmk-tab="borderline">临界生名单与提分测算</button>
                </div>
                <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;">
                    <input type="checkbox" id="qmk-bench-town-line" ${thInfo.source === 'township' ? 'checked' : ''} ${thInfo.hasTownship ? '' : 'disabled'}>
                    ${thInfo.source === 'township' ? `已套用全镇线（${thInfo.schoolCount}校）` : '校内划线'}
                </label>
            </div>`;

            let contentHtml = '';
            if (activeTab === 'strategy') {
                const own = townMatrix.ownTotal;
                const ownMajor = townMatrix.majorSchoolRows?.find((m) => m.isOwn);
                const rankText = townMatrix.hasTownship && own ? `第 ${own.comprehensiveRank} / ${townMatrix.totalSchools} 名` : '单校模式';
                const targetText = townMatrix.targetAhead ? `综合差 ${townMatrix.compGapToAhead} 分` : (townMatrix.hasTownship ? '全镇领跑' : '—');
                const targetSub = townMatrix.targetAhead ? `追赶：${townMatrix.targetAhead.name}（均分差 ${townMatrix.gapToAhead}）` : (townMatrix.hasTownship ? '当前稳居第一' : '导入多校解锁对标');
                const thirdKpiTitle = gradeProfile.grade === '9' ? '490+高分 / 指标生 / 后1/3' : `${gradeProfile.majorLabel} / 后1/3托底`;
                const thirdKpiVal = gradeProfile.grade === '9'
                    ? (own ? `${own.highCount490}人 · 后1/3 #${own.rankBottom}` : '—')
                    : (ownMajor ? `主科 #${ownMajor.comprehensiveRank} · 后1/3 #${own?.rankBottom || 1}` : `后1/3均分 ${classTotalRows[0]?.bottom3Avg || 0}`);
                const thirdKpiSub = gradeProfile.grade === '9'
                    ? (own ? `高分赋${own.scoreHigh490} / 指标${own.scoreIndicator} / 后1/3赋${own.scoreBottom}` : '九年级四维核算')
                    : (own ? `主科均分 ${ownMajor?.avg || own.avg} · 后1/3赋 ${own.scoreBottom}分` : '主科+后1/3双轨核算');

                contentHtml = `
                    <div class="qmk-kpis">
                        <div class="qmk-kpi"><span>全镇综合总分位次</span><strong style="color:#1d9bf0;">${rankText}</strong><small>${own ? `综合 ${own.comprehensiveTotal} 分 · 两率一分 ${own.score2Rate} (#${own.scoreRank})` : `均分 ${overallTotal.avg}`}</small></div>
                        <div class="qmk-kpi"><span>距前一名追赶校</span><strong style="color:#f59e0b;">${targetText}</strong><small>${escHtml(targetSub)}</small></div>
                        <div class="qmk-kpi"><span>${escHtml(thirdKpiTitle)}</span><strong style="color:#00ba7c;">${escHtml(thirdKpiVal)}</strong><small>${escHtml(thirdKpiSub)}</small></div>
                        <div class="qmk-kpi"><span>临界生转化潜力</span><strong>优 +${actionPlan.excGain}% / 及 +${actionPlan.passGain}%</strong><small>优边 ${totalBorderline.excMarginal.length} 人 · 及边 ${totalBorderline.passMarginal.length} 人</small></div>
                    </div>
                    <div class="qmk-table-card">
                        <table class="qmk-table">
                            <thead><tr><th>学科</th><th>口径属性</th><th>本校均分</th><th>全镇均分</th><th>较镇均差</th><th>两率一分(${gradeProfile.weights.total})</th><th>全镇位次</th><th>优秀率差</th><th>及格率差</th><th>班际极差</th><th>强弱判定</th></tr></thead>
                            <tbody>
                                ${subjectDiag.map((d) => `<tr class="${d.tier === '重点短板' ? '' : (d.tier === '优势领跑' ? 'is-own' : '')}">
                                    <td><strong>${escHtml(d.subject)}</strong></td>
                                    <td><span class="qmk-tag ${d.isDisplayOnly ? 'qmk-tier-warn' : (d.isMajor ? 'qmk-tag-own' : 'qmk-tag-ext')}">${escHtml(d.roleLabel)}</span></td>
                                    <td>${d.ownAvg}</td>
                                    <td>${d.townAvg}</td>
                                    <td style="color:${d.avgDiff >= 0 ? '#00875a' : '#dc2626'};font-weight:700;">${d.avgDiff >= 0 ? '+' : ''}${d.avgDiff}</td>
                                    <td><strong>${d.score2Rate}</strong></td>
                                    <td>${buildInlineRankBadgeHtml(d.rank)} <span style="font-size:11.5px;color:var(--secondary,#536471);">/${d.totalSchools}</span></td>
                                    <td style="color:${d.excDiff >= 0 ? '#00875a' : '#dc2626'};">${d.excDiff >= 0 ? '+' : ''}${d.excDiff}%</td>
                                    <td style="color:${d.passDiff >= 0 ? '#00875a' : '#dc2626'};">${d.passDiff >= 0 ? '+' : ''}${d.passDiff}%</td>
                                    <td>${d.classSpread}</td>
                                    <td><span class="qmk-tag ${tierClass(d.tier)}">${escHtml(d.tier)}</span></td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="qmk-bar" style="padding:10px 14px;">
                        <strong style="font-size:13.5px;">下阶段提质方向与可落地整改措施（${escHtml(gradeProfile.shortTag)}）</strong>
                        <button type="button" class="qmk-tab" id="qmk-copy-plan">一键复制会议发言稿 / 整改措施</button>
                    </div>
                    <div class="qmk-plan-grid">
                        ${actionPlan.actions.map((a, idx) => `<div class="qmk-plan-card">
                            <div class="qmk-plan-head"><strong>${idx + 1}. ${escHtml(a.dimension)}</strong><span class="qmk-tag qmk-tag-ext">${escHtml(a.owner)}</span></div>
                            <div class="qmk-plan-summary">${escHtml(a.summary)}</div>
                            <ul class="qmk-plan-steps">${(a.steps || []).map((st) => `<li>${escHtml(st)}</li>`).join('')}</ul>
                        </div>`).join('')}
                    </div>`;
            } else if (activeTab === 'benchmark') {
                const rawBench = thInfo.hasTownship
                    ? buildClassTownshipBenchmark(allRows, mySchool, currentSubject, th, gradeProfile)
                    : buildClassRows(activeRows, currentSubject, th, gradeProfile).map((c) => ({ ...c, kind: 'own-class' }));
                const benchRows = rawBench.slice().sort((a, b) => sortDir * ((Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0)));
                const maxAvg = Math.max(...benchRows.map((r) => Number(r.avg) || 0), 1);
                const sortArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '');
                contentHtml = `
                    <div class="qmk-kpis">
                        <div class="qmk-kpi"><span>${escHtml(mySchool)} · ${escHtml(currentSubject)}</span><strong>${overallSubj.count} 人</strong></div>
                        <div class="qmk-kpi"><span>本校平均分</span><strong style="color:#1d9bf0;">${overallSubj.avg}</strong></div>
                        <div class="qmk-kpi"><span>优秀率（线 ${th.exc}）</span><strong style="color:#00ba7c;">${overallSubj.excRate}%</strong></div>
                        <div class="qmk-kpi"><span>及格率（线 ${th.pass}）</span><strong style="color:#f59e0b;">${overallSubj.passRate}%</strong></div>
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
                                    <td>${escHtml(r.name)}<span class="qmk-tag ${r.kind === 'own-class' ? 'qmk-tag-own' : 'qmk-tag-ext'}">${r.kind === 'own-class' ? '本校班级' : '外校'}</span></td>
                                    <td>${r.count}</td>
                                    <td><div class="qmk-metric"><div class="qmk-metric-top"><span>${r.avg}</span>${buildInlineRankBadgeHtml(r.avgRank)}</div><div class="qmk-meter"><i style="width:${Math.min(100, Math.round((r.avg / maxAvg) * 100))}%;"></i></div></div></td>
                                    <td><div class="qmk-metric"><div class="qmk-metric-top"><span>${r.excRate}%</span>${buildInlineRankBadgeHtml(r.excRank)}</div><div class="qmk-meter"><i style="width:${Math.min(100, Math.round(r.excRate))}%;background:#00ba7c;"></i></div></div></td>
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
                            <div class="qmk-chips">${chips.excMarginal.length ? chips.excMarginal.map((s) => `<span class="qmk-chip qmk-chip-exc">${escHtml(s.name)} · ${escHtml(s.class)} · ${s.score}</span>`).join('') : '<span style="color:var(--secondary,#64748b);font-size:12px;">当前条件下暂无</span>'}</div>
                        </div>
                        <div class="qmk-chips-box">
                            <div class="qmk-chips-head">
                                <span>及格边缘生（${(chips.pass - chips.margin).toFixed(1)}~${chips.pass}，${chips.passMarginal.length} 人 · 转化可提 +${passLift}%）</span>
                                <button type="button" class="qmk-tab" data-qmk-copy="pass">一键复制</button>
                            </div>
                            <div class="qmk-chips">${chips.passMarginal.length ? chips.passMarginal.map((s) => `<span class="qmk-chip qmk-chip-pass">${escHtml(s.name)} · ${escHtml(s.class)} · ${s.score}</span>`).join('') : '<span style="color:var(--secondary,#64748b);font-size:12px;">当前条件下暂无</span>'}</div>
                        </div>
                    </div>`;
            }

            modal.body.innerHTML = navHtml + contentHtml;

            modal.body.querySelectorAll('[data-qmk-grade]').forEach((btn) => btn.addEventListener('click', () => {
                currentGrade = btn.dataset.qmkGrade;
                render();
            }));
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
                    const rawBench = thInfo.hasTownship
                        ? buildClassTownshipBenchmark(allRows, mySchool, currentSubject, th, gradeProfile)
                        : buildClassRows(activeRows, currentSubject, th, gradeProfile).map((c) => ({ ...c, kind: 'own-class' }));
                    exportBenchmarkExcel(rawBench, currentSubject, getExamTitle(), gradeProfile);
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

        modal.foot.innerHTML = `<span style="font-size:12px;color:var(--secondary,#536471);">所有分年级考核口径、主科双口径对标、后1/3托底与整改措施均同步写入 PPT 与 10 表教师分析手册</span><button type="button" class="btn btn-green" id="qmk-bench-to-ppt">打开质量分析会 PPT 工作室</button>`;
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
        GRADE_PROFILES,
        resolveCurrentGradeNumber,
        getGradeAnalysisProfile,
        getDisplayAndOfficialSubjects,
        resolveThresholds,
        calcGroupMetrics,
        applyAuthenticTwoRateScoring,
        computeBottom3ForStudents,
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
