/*
 * 育苗 / 尖子生包保培养档案（top-student-mentoring）按需运行时模块
 *
 * 100% 立足本系统（澄见 school-system）分年级评价体系与原生标准分（T-Score）算法：
 * - 跨 150 分制（语数英）与 100 分制（物化政史地生）使用标准分 T 值（优先读 student.tScores，缺失时按级部均值/标准差现场计算），彻底杜绝按绝对分差误将 98/100 判为“薄弱学科”的失真。
 * - 自动适配 6 / 7 / 8 / 9 年级差异化目标与实考科目，不考地生绝不硬写地生会考。
 * - 独立高权重作用域样式压制全局 button !important，零内联 on* 事件，满足严格 CSP。
 */
(function (root) {
    if (!root || root.__TOP_STUDENT_MENTORING_PATCHED__) return;

    const STORAGE_PREFIX = 'TOP_STUDENT_MENTORING_V1:';
    const DEFAULT_TOP_N = 30;

    const GRADE_MENTORING_PROFILES = {
        '9': {
            grade: '9',
            name: '九年级 · 490+高分与指标生育苗模式',
            shortTag: '9年级490+与指标生育苗',
            majorSubjects: ['语文', '数学', '英语', '物理', '化学'],
            majorLabel: '五科总分',
            sprintRuleDesc: '总分 ≥490 分或级部前 1/3（锚定重点高中与指标生达标）',
            goalTemplate: '冲刺中考 490+ 高分段与指标生达标线，均衡五科压轴得分'
        },
        '8': {
            grade: '8',
            name: '八年级 · 五科核心拔尖育苗模式',
            shortTag: '8年级五科拔尖育苗',
            majorSubjects: ['语文', '数学', '英语', '物理', '化学'],
            majorLabel: '五科主科',
            sprintRuleDesc: '级部前 1/3 且核心学科标准分均衡领跑',
            goalTemplate: '稳居全镇前 30 名，防止理科分化并保持五科均衡优势'
        },
        '7': {
            grade: '7',
            name: '七年级 · 语数英三科拔尖育苗模式',
            shortTag: '7年级三科拔尖育苗',
            majorSubjects: ['语文', '数学', '英语'],
            majorLabel: '三科主科',
            sprintRuleDesc: '级部前 1/3 且语数英三科均衡领跑（防早发偏科）',
            goalTemplate: '稳居全镇前 30 名，筑牢语数英三科主科优势，消除弱科苗头'
        },
        '6': {
            grade: '6',
            name: '六年级 · 小初衔接三科育苗模式',
            shortTag: '6年级小初衔接育苗',
            majorSubjects: ['语文', '数学', '英语'],
            majorLabel: '三科主科',
            sprintRuleDesc: '级部前 1/3 且语数英习惯优良',
            goalTemplate: '养成高效学习习惯，语数英三科总分稳居全镇前列'
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

    function toast(message, type = 'info') {
        if (root.UI && typeof root.UI.toast === 'function') return root.UI.toast(message, type);
        if (type === 'error' && typeof root.alert === 'function') return root.alert(message);
        return undefined;
    }

    function sameSchool(a, b) {
        if (typeof root.sameAppSchoolName === 'function') return root.sameAppSchoolName(a, b);
        return String(a || '').trim() === String(b || '').trim();
    }

    function getCohortKey() {
        const raw = String(
            root.CURRENT_COHORT_ID
            || root.CURRENT_COHORT
            || root.CURRENT_COHORT_META?.id
            || 'default'
        ).trim();
        return raw || 'default';
    }

    function getStorageKey(cohortKey = getCohortKey()) {
        return `${STORAGE_PREFIX}${cohortKey}`;
    }

    function loadMentoringStore(cohortKey = getCohortKey()) {
        try {
            const raw = root.localStorage?.getItem(getStorageKey(cohortKey));
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function saveMentoringStore(store, cohortKey = getCohortKey()) {
        try {
            root.localStorage?.setItem(getStorageKey(cohortKey), JSON.stringify(store || {}));
            return true;
        } catch (_) {
            return false;
        }
    }

    function getStudentKey(student) {
        const cls = String(student?.class || '').trim();
        const name = String(student?.name || '').trim();
        return `${cls}::${name}`;
    }

    function getSubjects(rows) {
        if (Array.isArray(root.SUBJECTS) && root.SUBJECTS.length) return root.SUBJECTS.filter(Boolean);
        const set = new Set();
        (rows || []).forEach((r) => Object.keys(r?.scores || {}).forEach((s) => set.add(s)));
        return Array.from(set);
    }

    function resolveMentoringGrade(overrideGrade = '', rows = []) {
        const explicit = String(overrideGrade || '').trim().match(/^[6-9]$/);
        if (explicit) return explicit[0];
        if (root.QualityMeetingKit && typeof root.QualityMeetingKit.resolveCurrentGradeNumber === 'function') {
            return root.QualityMeetingKit.resolveCurrentGradeNumber();
        }
        if (typeof root.resolveWorkspaceGrade === 'function') {
            const g = String(root.resolveWorkspaceGrade() || '').trim();
            if (/^[6-9]$/.test(g)) return g;
        }
        const source = `${root.CURRENT_EXAM_ID || ''} ${root.CONFIG?.name || ''}`;
        const m = source.match(/([6-9])\s*年级/);
        if (m) return m[1];
        const subjs = getSubjects(rows);
        if (subjs.includes('化学')) return '9';
        if (subjs.includes('物理')) return '8';
        return '7';
    }

    function getMentoringGradeProfile(overrideGrade = '', rows = []) {
        const g = resolveMentoringGrade(overrideGrade, rows);
        const base = { ...(GRADE_MENTORING_PROFILES[g] || GRADE_MENTORING_PROFILES['9']) };
        const subjs = getSubjects(rows);
        if (g === '8' && (subjs.includes('地理') || subjs.includes('生物'))) {
            base.name = '八年级 · 五科主科与地生双A育苗模式';
            base.shortTag = '8年级五科+地生双A育苗';
            base.goalTemplate = '稳居全镇前 30 名，确保物理不掉队、地理生物会考冲双A';
        }
        return base;
    }

    function computeMajorTotal(student, majorSubjects) {
        const list = Array.isArray(majorSubjects) ? majorSubjects : [];
        if (!list.length) return Number(student?.total || 0);
        let sum = 0;
        let hit = 0;
        list.forEach((s) => {
            const v = Number(student?.scores?.[s]);
            if (Number.isFinite(v)) {
                sum += v;
                hit += 1;
            }
        });
        return hit ? Number(sum.toFixed(1)) : Number(student?.total || 0);
    }

    function computeGradeSubjectStats(rows, subjects) {
        const stats = {};
        (subjects || []).forEach((subj) => {
            const vals = (rows || [])
                .map((r) => Number(r?.scores?.[subj]))
                .filter((v) => Number.isFinite(v));
            const n = vals.length;
            const avg = n ? vals.reduce((a, b) => a + b, 0) / n : 0;
            const variance = n ? vals.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / n : 0;
            const std = Math.sqrt(variance) || 1;
            const max = n ? Math.max(...vals) : 100;
            stats[subj] = { avg: Number(avg.toFixed(1)), std: Number(std.toFixed(2)), max };
        });
        return stats;
    }

    function computeGradeSubjectAverages(rows, subjects) {
        const stats = computeGradeSubjectStats(rows, subjects);
        const avgs = {};
        Object.keys(stats).forEach((s) => { avgs[s] = stats[s].avg; });
        return avgs;
    }

    // Use native T-Score (student.tScores) or computed Z-Score/T-Score for apples-to-apples comparison across 150-pt and 100-pt subjects!
    function diagnoseStudentSubjects(student, subjects, gradeAverages, gradeProfile = GRADE_MENTORING_PROFILES['9'], gradeStats = null) {
        const majorSet = new Set(gradeProfile?.majorSubjects || []);
        const diffs = (subjects || []).map((subj) => {
            const score = Number(student?.scores?.[subj]);
            const avg = Number(gradeStats?.[subj]?.avg ?? gradeAverages?.[subj] ?? 0);
            const std = Number(gradeStats?.[subj]?.std || 12);
            if (!Number.isFinite(score)) return null;
            const nativeT = Number(student?.tScores?.[subj]);
            const tScore = Number.isFinite(nativeT) && nativeT > 0
                ? Number(nativeT.toFixed(1))
                : Number((50 + 10 * ((score - avg) / Math.max(1, std))).toFixed(1));
            const schoolSubjRank = Number(student?.ranks?.[subj]?.school || 0) || null;
            const townSubjRank = Number(student?.ranks?.[subj]?.township || 0) || null;
            return {
                subject: subj,
                isMajor: majorSet.has(subj),
                score: Number(score.toFixed(1)),
                avg,
                diff: Number((score - avg).toFixed(1)),
                tScore,
                schoolSubjRank,
                townSubjRank
            };
        }).filter(Boolean);

        // Sort by standardized T-Score (descending) so 98/100 Chemistry is NEVER falsely judged weaker than 129/150 Chinese!
        const sortedByT = diffs.slice().sort((a, b) => b.tScore - a.tScore);
        const strengths = sortedByT.slice(0, 2);
        const lowestList = sortedByT.slice().reverse().slice(0, 2);
        const allTopTier = diffs.length > 0 && diffs.every((d) => d.tScore >= 60);
        const weakLabel = allTopTier ? '相对可挖潜学科' : '相对薄弱学科';
        const weaknesses = lowestList;

        const lowestOne = weaknesses[0];
        const gradeFocus = gradeProfile.grade === '9'
            ? (Number(student?.total) >= 490 ? '已达 490+ 高分段，重点稳固压轴题得分率；' : `距 490 高分线差 ${Math.max(0, Number((490 - Number(student?.total || 0)).toFixed(1)))} 分，优先突破中档提分点；`)
            : (allTopTier ? '全科标准分均超 60（全面优异），建议冲刺全镇顶尖位次；' : `${gradeProfile.majorLabel}核心引领，聚焦相对低位标准分科目精准补强；`);
        const advice = lowestOne
            ? `${gradeFocus}保持 ${strengths.map((s) => `${s.subject}(T=${s.tScore})`).join('、')} 领先优势，重点围绕${weakLabel} ${weaknesses.map((w) => `${w.subject}(${w.score}分·T=${w.tScore})`).join('、')} 开展导师面批。`
            : `${gradeFocus}各科发展均衡，建议聚焦限时压轴训练。`;
        return { diffs, strengths, weaknesses, weakLabel, allTopTier, advice };
    }

    function collectStudentHistory(student, currentExamLabel) {
        const history = [];
        const name = String(student?.name || '').trim();
        const cls = String(student?.class || '').trim();
        const prevRows = Array.isArray(root.PREV_DATA) ? root.PREV_DATA : [];
        if (prevRows.length) {
            const sortedPrev = prevRows.slice().sort((a, b) => (Number(b?.total) || 0) - (Number(a?.total) || 0));
            const idx = sortedPrev.findIndex((r) => String(r?.name || '').trim() === name && (!cls || String(r?.class || '').trim() === cls));
            if (idx >= 0) {
                history.push({
                    exam: '上次考试',
                    total: Number(Number(sortedPrev[idx].total || 0).toFixed(1)),
                    rank: idx + 1
                });
            }
        }
        history.push({
            exam: currentExamLabel || '本次考试',
            total: Number(Number(student?.total || 0).toFixed(1)),
            rank: Number(student?.gradeRank || 0)
        });
        for (let i = 1; i < history.length; i += 1) {
            history[i].delta = history[i - 1].rank && history[i].rank
                ? history[i - 1].rank - history[i].rank
                : 0;
        }
        return history;
    }

    function buildTopStudentRoster(allRows, options = {}) {
        const gradeProfile = getMentoringGradeProfile(options.grade, allRows);
        const mySchool = String(options.mySchool || root.MY_SCHOOL || root.DEFAULT_MY_SCHOOL_NAME || '').trim();
        const filtered = mySchool
            ? (allRows || []).filter((r) => sameSchool(r?.school, mySchool))
            : (allRows || []).slice();
        const pool = filtered.length ? filtered : (allRows || []).slice();
        const subjects = options.subjects || getSubjects(pool);
        const presentMajorSubjects = (gradeProfile.majorSubjects || []).filter((s) => subjects.includes(s));
        const gradeStats = computeGradeSubjectStats(pool, subjects);
        const gradeAverages = {};
        Object.keys(gradeStats).forEach((s) => { gradeAverages[s] = gradeStats[s].avg; });
        const topN = Math.max(1, Number(options.topN) || DEFAULT_TOP_N);
        const store = options.store || loadMentoringStore(options.cohortKey);
        const examLabel = String(options.examLabel || root.CONFIG?.name || root.CURRENT_EXAM_ID || '本次考试').trim();

        const sorted = pool
            .filter((r) => Number.isFinite(Number(r?.total)))
            .slice()
            .sort((a, b) => Number(b.total) - Number(a.total));
        const townSorted = (allRows || [])
            .filter((r) => Number.isFinite(Number(r?.total)))
            .slice()
            .sort((a, b) => Number(b.total) - Number(a.total));
        const distinctSchools = new Set((allRows || []).map((r) => String(r?.school || '').trim()).filter(Boolean));
        const hasTownship = distinctSchools.size > 1;
        const getTownRank = (score) => 1 + townSorted.filter((r) => Number(r.total) > Number(score)).length;

        const majorSortedPool = pool.map((s) => computeMajorTotal(s, presentMajorSubjects)).sort((a, b) => b - a);
        const getMajorGradeRank = (mTotal) => 1 + majorSortedPool.filter((v) => v > mTotal).length;

        const list = sorted.slice(0, topN).map((student, idx) => {
            const gradeRank = idx + 1;
            const total = Number(Number(student.total).toFixed(1));
            const majorTotal = computeMajorTotal(student, presentMajorSubjects);
            const majorRank = getMajorGradeRank(majorTotal);
            const townRank = hasTownship ? getTownRank(total) : null;
            const isSprint = gradeProfile.grade === '9'
                ? (total >= 490 || gradeRank <= Math.ceil(topN / 3))
                : (gradeRank <= Math.ceil(topN / 3));
            const tier = isSprint
                ? '冲刺梯队'
                : (gradeRank <= Math.ceil((topN * 2) / 3) ? '稳进梯队' : '提升梯队');
            const key = getStudentKey(student);
            const meta = store[key] || {};
            const enriched = { ...student, gradeRank, townRank, total, majorTotal, majorRank };
            const diagnosis = diagnoseStudentSubjects(enriched, subjects, gradeAverages, gradeProfile, gradeStats);
            if (townRank != null) {
                const nextMilestone = townRank <= 10 ? 5 : (townRank <= 30 ? 20 : (townRank <= 50 ? 30 : (townRank <= 100 ? 50 : 100)));
                diagnosis.townGoal = townRank <= 5
                    ? `当前全镇第 ${townRank} 名，已处于全镇顶尖行列，${gradeProfile.goalTemplate}。`
                    : `当前全镇第 ${townRank}/${townSorted.length} 名，下阶段方向：锚定全镇前 ${nextMilestone} 名（${gradeProfile.goalTemplate}）。`;
            } else {
                diagnosis.townGoal = gradeProfile.goalTemplate;
            }
            const history = collectStudentHistory(enriched, examLabel);
            const latestDelta = history.length > 1 ? history[history.length - 1].delta : null;
            return {
                key,
                name: String(student.name || '未知').trim(),
                class: String(student.class || '').trim(),
                school: String(student.school || mySchool || '本校').trim(),
                total,
                majorTotal,
                majorRank,
                gradeRank,
                townRank,
                townTotal: hasTownship ? townSorted.length : null,
                tier,
                latestDelta,
                mentor: String(meta.mentor || '').trim(),
                parentContact: String(meta.parentContact || '').trim(),
                targetNote: String(meta.targetNote || '').trim(),
                scores: student.scores || {},
                diagnosis,
                history
            };
        });
        return {
            list,
            gradeProfile,
            presentMajorSubjects,
            subjects,
            gradeAverages,
            examLabel,
            schoolName: mySchool || (pool[0]?.school || '本校'),
            totalPool: sorted.length,
            hasTownship,
            townTotal: townSorted.length
        };
    }

    function buildArchiveFileName(student, context) {
        const safe = (v) => String(v || '').replace(/[\\/:*?"<>|]/g, '_').trim();
        const exam = safe(context?.examLabel || '考试');
        const cls = safe(student?.class || '');
        const name = safe(student?.name || '学生');
        const gTag = safe(context?.gradeProfile?.shortTag || '');
        return `育苗培养档案_${gTag ? `${gTag}_` : ''}${cls ? `${cls}_` : ''}${name}_${exam}.html`;
    }

    function buildTScoreBarHtml(tScore) {
        const pct = Math.max(8, Math.min(100, Math.round(((tScore - 35) / 45) * 100)));
        const color = tScore >= 68 ? '#059669' : (tScore >= 58 ? '#2563eb' : '#d97706');
        return `<div style="display:flex;align-items:center;gap:8px;justify-content:center;">
            <span style="min-width:34px;font-weight:700;color:${color};">${tScore}</span>
            <div style="width:76px;height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden;"><i style="display:block;width:${pct}%;height:100%;background:${color};border-radius:99px;"></i></div>
        </div>`;
    }

    function buildPrintableArchiveHtml(student, context) {
        const gp = context?.gradeProfile || GRADE_MENTORING_PROFILES['9'];
        const diffs = student.diagnosis?.diffs || [];
        const subjectRows = diffs.map((d) => `
            <tr>
                <td><strong>${escHtml(d.subject)}</strong>${d.isMajor ? ' <span style="font-size:11px;color:#2563eb;">[主科]</span>' : ''}</td>
                <td><strong>${d.score}</strong></td>
                <td>${d.avg}</td>
                <td style="color:${d.diff >= 0 ? '#059669' : '#dc2626'};font-weight:600;">${d.diff >= 0 ? '+' : ''}${d.diff}</td>
                <td>${buildTScoreBarHtml(d.tScore)}</td>
                <td>${d.schoolSubjRank ? `校#${d.schoolSubjRank}` : '—'}${d.townSubjRank ? ` / 镇#${d.townSubjRank}` : ''}</td>
            </tr>`).join('');
        const historyRows = (student.history || []).map((h) => `
            <tr>
                <td>${escHtml(h.exam)}</td>
                <td><strong>${h.total}</strong></td>
                <td>第 ${h.rank || '-'} 名</td>
                <td style="color:${h.delta > 0 ? '#059669' : (h.delta < 0 ? '#dc2626' : '#475569')};font-weight:600;">${h.delta == null ? '—' : (h.delta > 0 ? `↑ 进步 ${h.delta} 名` : (h.delta < 0 ? `↓ 退步 ${Math.abs(h.delta)} 名` : '持平'))}</td>
            </tr>`).join('');
        return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>育苗培养档案 - ${escHtml(student.name)}</title>
<style>
@page{size:A4;margin:14mm}
body{font-family:"Microsoft YaHei",system-ui,sans-serif;color:#0f172a;margin:0;padding:16px;background:#fff}
.sheet{max-width:760px;margin:0 auto;border:1.5px solid #0f172a;padding:26px 30px;border-radius:4px}
.head{text-align:center;border-bottom:3px double #0f172a;padding-bottom:12px;margin-bottom:16px}
.head h1{margin:0;font-size:20px;letter-spacing:2px}
.head p{margin:6px 0 0;font-size:12.5px;color:#475569}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;font-size:13px;background:#f8fafc;padding:12px 14px;border:1px solid #cbd5e1;border-radius:6px}
h2{font-size:14px;color:#0f172a;margin:16px 0 8px;border-left:4px solid #0f172a;padding-left:8px}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:10px}
th,td{border:1px solid #cbd5e1;padding:7px 8px;text-align:center}
th{background:#f1f5f9;font-weight:600}
.diag{background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:12px 14px;font-size:13px;line-height:1.75}
.signs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px;padding-top:14px;border-top:1px dashed #94a3b8;font-size:13px}
</style></head><body>
<div class="sheet">
  <div class="head">
    <h1>尖子生「育苗」包保培养档案（${escHtml(gp.shortTag)}）</h1>
    <p>${escHtml(context.schoolName)} · ${escHtml(context.examLabel)} · 生成日期 ${new Date().toISOString().slice(0, 10)}</p>
  </div>
  <div class="meta">
    <div><strong>姓名：</strong>${escHtml(student.name)}</div>
    <div><strong>班级：</strong>${escHtml(student.class)}</div>
    <div><strong>培养梯队：</strong>${escHtml(student.tier)}</div>
    <div><strong>本次总分：</strong>${student.total} 分（校#${student.gradeRank}${student.townRank ? `/镇#${student.townRank}` : ''}）</div>
    <div><strong>${escHtml(gp.majorLabel)}：</strong>${student.majorTotal ?? student.total} 分（校#${student.majorRank || student.gradeRank}）</div>
    <div><strong>包保教师：</strong>${escHtml(student.mentor || '待指派')}</div>
    <div style="grid-column:span 3;"><strong>家长联系：</strong>${escHtml(student.parentContact || '未填写')} &nbsp;|&nbsp; <strong>阶段目标：</strong>${escHtml(student.targetNote || student.diagnosis?.townGoal || gp.goalTemplate)}</div>
  </div>
  <h2>一、各科成绩与跨分制标准分（T值）精准对标</h2>
  <table><thead><tr><th>学科</th><th>个人得分</th><th>级部均分</th><th>较均分差</th><th>标准分(T值)</th><th>单科位次</th></tr></thead><tbody>${subjectRows}</tbody></table>
  <h2>二、优势与挖潜学科自动诊断（基于标准分 T 值）</h2>
  <div class="diag">
    <div><strong>优势领跑学科：</strong>${escHtml((student.diagnosis?.strengths || []).map((s) => `${s.subject}(${s.score}分·T=${s.tScore})`).join('、') || '均衡')}</div>
    <div><strong>${escHtml(student.diagnosis?.weakLabel || '相对薄弱学科')}：</strong>${escHtml((student.diagnosis?.weaknesses || []).map((w) => `${w.subject}(${w.score}分·T=${w.tScore})`).join('、') || '无明显短板')}</div>
    <div><strong>培养建议：</strong>${escHtml(student.diagnosis?.advice || '')}</div>
  </div>
  <h2>三、历次考试追踪</h2>
  <table><thead><tr><th>考试</th><th>总分</th><th>级部名次</th><th>进退变化</th></tr></thead><tbody>${historyRows}</tbody></table>
  <div class="signs">
    <div>班主任签字：________________</div>
    <div>包保教师签字：______________</div>
    <div>教导主任签字：______________</div>
  </div>
</div>
</body></html>`;
    }

    function exportMentoringLedgerExcel(rosterCtx) {
        const XLSX = root.XLSX;
        if (!XLSX?.utils) {
            toast('Excel 导出组件未就绪', 'error');
            return false;
        }
        const gp = rosterCtx.gradeProfile || GRADE_MENTORING_PROFILES['9'];
        const wb = XLSX.utils.book_new();
        const header = ['级部名次', '全镇名次', '梯队', '姓名', '班级', '本次总分', `${gp.majorLabel}`, '主科校排', '较上次名次变化', '包保教师', '家长联系', '阶段目标', '优势领跑学科(T值)', '可挖潜/薄弱学科(T值)', '诊断建议'];
        const aoa = [
            header,
            ...rosterCtx.list.map((s) => [
                s.gradeRank,
                s.townRank || '—',
                s.tier,
                s.name,
                s.class,
                s.total,
                s.majorTotal ?? s.total,
                s.majorRank || s.gradeRank,
                s.latestDelta == null ? '' : (s.latestDelta > 0 ? `+${s.latestDelta}` : String(s.latestDelta)),
                s.mentor || '',
                s.parentContact || '',
                s.targetNote || s.diagnosis?.townGoal || '',
                (s.diagnosis?.strengths || []).map((x) => `${x.subject}(T=${x.tScore})`).join('、'),
                (s.diagnosis?.weaknesses || []).map((x) => `${x.subject}(T=${x.tScore})`).join('、'),
                s.diagnosis?.advice || ''
            ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        if (typeof root.decorateExcelSheet === 'function') root.decorateExcelSheet(ws, header);
        XLSX.utils.book_append_sheet(wb, ws, '育苗包保培养台账');
        const safeExam = String(rosterCtx.examLabel || '考试').replace(/[\\/:*?"<>|]/g, '_');
        const fileName = `育苗包保培养台账_${gp.shortTag}_${safeExam}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast(`已导出 ${fileName}`, 'success');
        return true;
    }

    function ensureStyles() {
        const doc = root.document;
        if (!doc) return;
        const old = doc.getElementById('tsm-style');
        if (old) old.remove();
        const style = doc.createElement('style');
        style.id = 'tsm-style';
        style.textContent = `
.tsm-mask{position:fixed;inset:0;background:rgba(15,23,42,.52);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
.tsm-dialog{background:var(--bg-card,#fff);color:var(--color-data,#0f172a);border:1px solid var(--border,#e2e8f0);border-radius:20px;width:min(1140px,96vw);max-height:93vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 28px 70px rgba(15,23,42,.24)}
.tsm-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 22px;border-bottom:1px solid var(--border,#e2e8f0);background:var(--bg-card,#fff)}
.tsm-head-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tsm-head h3{margin:0;font-size:16.5px;font-weight:700;letter-spacing:-.01em}
.tsm-mode-chip{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:700;background:rgba(16,185,129,.12);color:#047857}
.tsm-head-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
.tsm-seg{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:10px;background:var(--bg-body,#f1f5f9);border:1px solid var(--border,#e2e8f0)}
#tsm-modal.tsm-mask button.tsm-grade-btn{min-height:28px !important;height:28px !important;padding:0 11px !important;border-radius:7px !important;border:1px solid transparent !important;background:transparent !important;color:var(--secondary,#475569) !important;font-size:12px !important;font-weight:600 !important;box-shadow:none !important;transform:none !important;cursor:pointer}
#tsm-modal.tsm-mask button.tsm-grade-btn.is-active,#tsm-modal.tsm-mask button.tsm-grade-btn.is-active:hover{background:#0f172a !important;color:#fff !important;border-color:#0f172a !important;transform:none !important}
#tsm-modal.tsm-mask button.tsm-close{width:32px !important;height:32px !important;min-height:32px !important;padding:0 !important;border-radius:999px !important;border:1px solid var(--border,#e2e8f0) !important;background:transparent !important;color:var(--secondary,#64748b) !important;font-size:18px !important;display:grid;place-items:center;cursor:pointer;transform:none !important}
#tsm-modal.tsm-mask button.tsm-close:hover{background:#f1f5f9 !important;color:#0f172a !important}
.tsm-body{padding:18px 22px;overflow:auto;display:grid;gap:14px;background:var(--bg-body,#f8fafc)}
.tsm-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:720px){.tsm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tsm-kpi{background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);border-top:3px solid #0d9488;border-radius:12px;padding:12px 15px;display:grid;gap:3px}
.tsm-kpi span{font-size:11.5px;font-weight:600;color:var(--secondary,#64748b)}
.tsm-kpi strong{font-size:20px;font-weight:750;letter-spacing:-.02em}
.tsm-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:var(--bg-card,#fff);padding:10px 14px;border-radius:12px;border:1px solid var(--border,#e2e8f0)}
#tsm-modal.tsm-mask button.tsm-pill{min-height:30px !important;height:30px !important;padding:0 12px !important;border-radius:999px !important;border:1px solid var(--border,#cbd5e1) !important;background:var(--bg-card,#fff) !important;color:var(--color-data,#334155) !important;font-size:12px !important;font-weight:600 !important;transform:none !important;cursor:pointer}
#tsm-modal.tsm-mask button.tsm-pill:hover{background:#f1f5f9 !important;transform:none !important}
#tsm-modal.tsm-mask button.tsm-pill.is-active,#tsm-modal.tsm-mask button.tsm-pill.is-active:hover{background:#0f172a !important;color:#fff !important;border-color:#0f172a !important;transform:none !important}
.tsm-input{padding:6px 10px;border:1px solid var(--border,#cbd5e1);border-radius:9px;background:var(--bg-card,#fff);color:var(--color-data,#0f172a);font-size:12.5px;outline:none}
.tsm-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.tsm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:12px}
.tsm-card{position:relative;border:1px solid var(--border,#e2e8f0);border-left:4px solid #2563eb;border-radius:12px;padding:13px 14px;background:var(--bg-card,#fff);display:grid;gap:7px;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s}
.tsm-card:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(15,23,42,.08);border-color:#94a3b8}
.tsm-card[data-tier="冲刺梯队"]{border-left-color:#f59e0b}
.tsm-card[data-tier="稳进梯队"]{border-left-color:#2563eb}
.tsm-card[data-tier="提升梯队"]{border-left-color:#10b981}
.tsm-rk{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;font-size:12px;font-weight:700;background:#f1f5f9;color:#0f172a}
.tsm-rk-top{background:#fef3c7;color:#b45309}
.tsm-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#f1f5f9;color:#475569}
.tsm-delta{font-size:11px;font-weight:700;padding:1px 6px;border-radius:999px}
.tsm-delta-up{background:rgba(16,185,129,.14);color:#047857}
.tsm-delta-down{background:rgba(239,68,68,.12);color:#dc2626}
.tsm-tags{display:flex;flex-wrap:wrap;gap:5px;font-size:11px}
.tsm-tag-s{padding:2px 7px;border-radius:6px;background:rgba(16,185,129,.12);color:#047857;font-weight:600}
.tsm-tag-w{padding:2px 7px;border-radius:6px;background:rgba(245,158,11,.14);color:#b45309;font-weight:600}
.tsm-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;background:var(--bg-card,#fff);padding:13px 15px;border-radius:12px;border:1px solid var(--border,#e2e8f0)}
.tsm-form label{display:grid;gap:5px;font-size:12px;font-weight:600;color:var(--secondary,#475569)}
.tsm-a4{max-width:820px;width:100%;margin:0 auto;border:1px solid #cbd5e1;border-radius:10px;padding:22px 26px;background:#fff;color:#0f172a;box-shadow:0 12px 28px rgba(15,23,42,.06);display:grid;gap:14px}
.tsm-a4-head{text-align:center;border-bottom:3px double #0f172a;padding-bottom:10px}
.tsm-a4-head h4{margin:0;font-size:18.5px;letter-spacing:1.5px}
.tsm-a4-head p{margin:4px 0 0;font-size:12px;color:#475569}
.tsm-a4-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:12.5px}
.tsm-table{width:100%;border-collapse:collapse;font-size:12.5px}
.tsm-table th,.tsm-table td{border:1px solid #e2e8f0;padding:7px 9px;text-align:center}
.tsm-table th{background:#f8fafc;font-weight:600;color:#475569}
.tsm-signs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding-top:12px;border-top:1px dashed #94a3b8;font-size:12.5px;color:#475569}
.tsm-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 22px;border-top:1px solid var(--border,#e2e8f0);background:var(--bg-card,#fff)}
#tsm-modal.tsm-mask button.tsm-btn-primary{min-height:36px !important;padding:0 16px !important;border-radius:10px !important;border:1px solid #0d9488 !important;background:#0d9488 !important;color:#fff !important;font-size:13px !important;font-weight:600 !important;cursor:pointer}
#tsm-modal.tsm-mask button.tsm-btn-primary:hover{background:#0f766e !important;color:#fff !important}
#tsm-modal.tsm-mask button.tsm-btn-secondary{min-height:36px !important;padding:0 15px !important;border-radius:10px !important;border:1px solid #1d4ed8 !important;background:#eff6ff !important;color:#1d4ed8 !important;font-size:13px !important;font-weight:600 !important;cursor:pointer}
body.dark-mode .tsm-tag-s,body.dark-mode .tsm-delta-up,body.dark-mode .tsm-mode-chip{color:#34d399}
body.dark-mode .tsm-tag-w{color:#fcd34d}
body.dark-mode .tsm-delta-down{color:#f87171}
`;
        doc.head.appendChild(style);
    }

    function openTopStudentMentoringModal(options = {}) {
        const allRows = Array.isArray(options.allRows) ? options.allRows : (Array.isArray(root.RAW_DATA) ? root.RAW_DATA : []);
        if (!allRows.length) {
            toast('请先上传成绩数据', 'error');
            return false;
        }
        ensureStyles();
        const doc = root.document;
        const existing = doc.getElementById('tsm-modal');
        if (existing) existing.remove();

        const mask = doc.createElement('div');
        mask.id = 'tsm-modal';
        mask.className = 'tsm-mask';
        mask.innerHTML = `<div class="tsm-dialog" role="dialog" aria-modal="true">
            <div class="tsm-head">
                <div class="tsm-head-left"><h3>育苗 · 尖子生包保培养台账与 A4 档案</h3><span class="tsm-mode-chip" id="tsm-mode-chip"></span></div>
                <div class="tsm-head-right">
                    <div class="tsm-seg" id="tsm-grade-seg"></div>
                    <button type="button" class="tsm-close" aria-label="关闭">&times;</button>
                </div>
            </div>
            <div class="tsm-body"></div>
            <div class="tsm-foot"></div>
        </div>`;
        const close = () => mask.remove();
        mask.querySelector('.tsm-close').addEventListener('click', close);
        mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
        doc.body.appendChild(mask);

        const modeChip = mask.querySelector('#tsm-mode-chip');
        const gradeSeg = mask.querySelector('#tsm-grade-seg');
        const body = mask.querySelector('.tsm-body');
        const foot = mask.querySelector('.tsm-foot');
        let currentGrade = resolveMentoringGrade(options.grade, allRows);
        let activeTier = '全部';
        let query = '';
        let topN = Number(options.topN) || DEFAULT_TOP_N;
        let selectedIdx = -1;
        let rosterCtx = buildTopStudentRoster(allRows, { ...options, grade: currentGrade, topN });

        function refreshData() {
            rosterCtx = buildTopStudentRoster(allRows, { ...options, grade: currentGrade, topN });
        }

        function syncHeader() {
            const gp = rosterCtx.gradeProfile;
            modeChip.textContent = gp.shortTag;
            gradeSeg.innerHTML = ['6', '7', '8', '9'].map((g) => `<button type="button" class="tsm-grade-btn ${g === currentGrade ? 'is-active' : ''}" data-tsm-grade="${g}">${g}年级</button>`).join('');
            gradeSeg.querySelectorAll('[data-tsm-grade]').forEach((btn) => btn.addEventListener('click', () => {
                currentGrade = btn.dataset.tsmGrade;
                refreshData();
                if (selectedIdx >= 0) renderDetail(); else renderList();
            }));
        }

        function renderList() {
            selectedIdx = -1;
            syncHeader();
            const gp = rosterCtx.gradeProfile;
            const sprintCnt = rosterCtx.list.filter((s) => s.tier === '冲刺梯队').length;
            const steadyCnt = rosterCtx.list.filter((s) => s.tier === '稳进梯队').length;
            const assignedCnt = rosterCtx.list.filter((s) => s.mentor).length;
            const filtered = rosterCtx.list.filter((s) => {
                if (activeTier !== '全部' && s.tier !== activeTier) return false;
                if (query && !s.name.includes(query) && !s.class.includes(query) && !s.mentor.includes(query)) return false;
                return true;
            });
            body.innerHTML = `
                <div class="tsm-kpis">
                    <div class="tsm-kpi" style="border-top-color:#0f172a;"><span>纳入育苗人数</span><strong>${rosterCtx.list.length} 人</strong></div>
                    <div class="tsm-kpi" style="border-top-color:#f59e0b;"><span>冲刺梯队</span><strong style="color:#d97706;">${sprintCnt} 人</strong></div>
                    <div class="tsm-kpi" style="border-top-color:#2563eb;"><span>稳进梯队</span><strong style="color:#1d4ed8;">${steadyCnt} 人</strong></div>
                    <div class="tsm-kpi" style="border-top-color:#10b981;"><span>已指派包保教师</span><strong style="color:#059669;">${assignedCnt} / ${rosterCtx.list.length}</strong></div>
                </div>
                <div class="tsm-toolbar">
                    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                        ${['全部', '冲刺梯队', '稳进梯队', '提升梯队'].map((t) => `<button type="button" class="tsm-pill ${t === activeTier ? 'is-active' : ''}" data-tsm-tier="${t}">${t}</button>`).join('')}
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                        <select class="tsm-input" id="tsm-topn">
                            ${[20, 30, 50].map((n) => `<option value="${n}" ${n === topN ? 'selected' : ''}>纳入前 ${n} 名</option>`).join('')}
                        </select>
                        <input type="text" class="tsm-input" id="tsm-search" value="${escHtml(query)}" placeholder="搜索姓名 / 班级 / 包保教师" style="width:190px;">
                    </div>
                </div>
                <div class="tsm-grid">
                    ${filtered.map((s) => {
                        const origIdx = rosterCtx.list.indexOf(s);
                        const deltaHtml = s.latestDelta == null ? '' : (s.latestDelta > 0
                            ? `<span class="tsm-delta tsm-delta-up">↑${s.latestDelta}</span>`
                            : (s.latestDelta < 0 ? `<span class="tsm-delta tsm-delta-down">↓${Math.abs(s.latestDelta)}</span>` : ''));
                        const weak = s.diagnosis.weaknesses?.[0];
                        const strong = s.diagnosis.strengths?.[0];
                        const weakShortTag = s.diagnosis.allTopTier ? '潜' : '弱';
                        return `<div class="tsm-card" data-tsm-idx="${origIdx}" data-tier="${escHtml(s.tier)}">
                            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <span class="tsm-rk ${s.gradeRank <= 3 ? 'tsm-rk-top' : ''}">${s.gradeRank}</span>
                                    <div><strong style="font-size:14px;">${escHtml(s.name)}</strong> <span style="color:#64748b;font-size:12px;">${escHtml(s.class)}</span></div>
                                </div>
                                <span class="tsm-badge">${escHtml(s.tier)}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;">
                                <span>总分 <strong style="font-size:14.5px;">${s.total}</strong> ${deltaHtml}${s.townRank ? ` <span style="font-size:11.5px;color:#2563eb;font-weight:600;">镇#${s.townRank}</span>` : ''}</span>
                                <span style="color:#64748b;font-size:11.5px;">${escHtml(gp.majorLabel)} ${s.majorTotal}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#64748b;">
                                <span>包保：${escHtml(s.mentor || '待指派')}</span>
                                <div class="tsm-tags">
                                    ${strong ? `<span class="tsm-tag-s">优 ${escHtml(strong.subject)} T${strong.tScore}</span>` : ''}
                                    ${weak ? `<span class="tsm-tag-w">${weakShortTag} ${escHtml(weak.subject)} T${weak.tScore}</span>` : ''}
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
            foot.innerHTML = `
                <span style="font-size:12px;color:#64748b;">按本系统标准分（T值）跨分制精准诊断 · 点击学生卡片查看 A4 签字档案</span>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="tsm-btn-primary" id="tsm-export-ledger">导出育苗台账 (Excel)</button>
                </div>`;
            foot.querySelector('#tsm-export-ledger').addEventListener('click', () => exportMentoringLedgerExcel(rosterCtx));
            body.querySelectorAll('[data-tsm-tier]').forEach((btn) => btn.addEventListener('click', () => { activeTier = btn.dataset.tsmTier; renderList(); }));
            body.querySelector('#tsm-topn').addEventListener('change', (e) => { topN = Number(e.target.value) || DEFAULT_TOP_N; refreshData(); renderList(); });
            const searchEl = body.querySelector('#tsm-search');
            searchEl.addEventListener('input', () => { query = searchEl.value.trim(); renderList(); });
            body.querySelectorAll('[data-tsm-idx]').forEach((card) => card.addEventListener('click', () => { selectedIdx = Number(card.dataset.tsmIdx); renderDetail(); }));
        }

        function renderDetail() {
            syncHeader();
            const student = rosterCtx.list[selectedIdx];
            if (!student) { renderList(); return; }
            const gp = rosterCtx.gradeProfile;
            const diffs = student.diagnosis?.diffs || [];
            body.innerHTML = `
                <div class="tsm-toolbar">
                    <button type="button" class="tsm-pill" id="tsm-back">← 返回育苗台账</button>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button type="button" class="tsm-pill" id="tsm-prev" ${selectedIdx <= 0 ? 'disabled' : ''}>上一份</button>
                        <span style="font-size:12.5px;color:#64748b;">${selectedIdx + 1} / ${rosterCtx.list.length}</span>
                        <button type="button" class="tsm-pill" id="tsm-next" ${selectedIdx >= rosterCtx.list.length - 1 ? 'disabled' : ''}>下一份</button>
                    </div>
                </div>
                <div class="tsm-form">
                    <label>包保教师<input type="text" class="tsm-input" id="tsm-mentor" value="${escHtml(student.mentor)}" placeholder="例如：张老师"></label>
                    <label>家长联系方式<input type="text" class="tsm-input" id="tsm-contact" value="${escHtml(student.parentContact)}" placeholder="家长姓名 / 电话"></label>
                    <label>阶段培养目标<input type="text" class="tsm-input" id="tsm-target" value="${escHtml(student.targetNote)}" placeholder="${escHtml(gp.goalTemplate)}"></label>
                </div>
                <div class="tsm-a4">
                    <div class="tsm-a4-head">
                        <h4>尖子生「育苗」包保培养档案（${escHtml(gp.shortTag)}）</h4>
                        <p>${escHtml(rosterCtx.schoolName)} · ${escHtml(rosterCtx.examLabel)} · ${new Date().toISOString().slice(0, 10)}</p>
                    </div>
                    <div class="tsm-a4-meta">
                        <div><strong>姓名：</strong>${escHtml(student.name)}</div>
                        <div><strong>班级：</strong>${escHtml(student.class)}</div>
                        <div><strong>培养梯队：</strong>${escHtml(student.tier)}</div>
                        <div><strong>本次总分：</strong>${student.total} 分（校#${student.gradeRank}${student.townRank ? `/镇#${student.townRank}` : ''}）</div>
                        <div><strong>${escHtml(gp.majorLabel)}：</strong>${student.majorTotal} 分（校#${student.majorRank}）</div>
                        <div><strong>包保教师：</strong>${escHtml(student.mentor || '待指派')}</div>
                    </div>
                    <table class="tsm-table">
                        <thead><tr><th>学科</th><th>个人得分</th><th>级部均分</th><th>较均分差</th><th>标准分(T值)</th><th>单科位次</th></tr></thead>
                        <tbody>${diffs.map((d) => `<tr>
                            <td><strong>${escHtml(d.subject)}</strong>${d.isMajor ? ' <span style="font-size:11px;color:#2563eb;">[主科]</span>' : ''}</td>
                            <td><strong>${d.score}</strong></td>
                            <td>${d.avg}</td>
                            <td style="color:${d.diff >= 0 ? '#059669' : '#dc2626'};font-weight:600;">${d.diff >= 0 ? '+' : ''}${d.diff}</td>
                            <td>${buildTScoreBarHtml(d.tScore)}</td>
                            <td>${d.schoolSubjRank ? `校#${d.schoolSubjRank}` : '—'}${d.townSubjRank ? ` / 镇#${d.townSubjRank}` : ''}</td>
                        </tr>`).join('')}</tbody>
                    </table>
                    <div style="font-size:13px;line-height:1.7;background:#f8fafc;padding:12px 14px;border-radius:8px;border:1px solid #e2e8f0;">
                        <div><strong>优势领跑：</strong>${escHtml((student.diagnosis.strengths || []).map((s) => `${s.subject}(${s.score}分·T=${s.tScore})`).join('、') || '均衡')} &nbsp;|&nbsp; <strong>${escHtml(student.diagnosis.weakLabel || '相对薄弱')}：</strong>${escHtml((student.diagnosis.weaknesses || []).map((w) => `${w.subject}(${w.score}分·T=${w.tScore})`).join('、') || '无明显短板')}</div>
                        <div style="margin-top:4px;"><strong>培养建议：</strong>${escHtml(student.diagnosis.advice)}</div>
                    </div>
                    <div class="tsm-signs">
                        <div>班主任签字：______________</div>
                        <div>包保教师签字：____________</div>
                        <div>教导主任签字：____________</div>
                    </div>
                </div>`;
            foot.innerHTML = `
                <button type="button" class="tsm-btn-secondary" id="tsm-save-meta">保存包保信息</button>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="tsm-btn-secondary" id="tsm-download-a4">下载 A4 档案</button>
                    <button type="button" class="tsm-btn-primary" id="tsm-print-a4">打印 / 存为 PDF</button>
                </div>`;

            const saveCurrent = () => {
                const store = loadMentoringStore(options.cohortKey);
                store[student.key] = {
                    mentor: body.querySelector('#tsm-mentor').value.trim(),
                    parentContact: body.querySelector('#tsm-contact').value.trim(),
                    targetNote: body.querySelector('#tsm-target').value.trim()
                };
                saveMentoringStore(store, options.cohortKey);
                refreshData();
                toast(`已保存 ${student.name} 的包保培养信息`, 'success');
            };
            body.querySelector('#tsm-back').addEventListener('click', renderList);
            body.querySelector('#tsm-prev').addEventListener('click', () => { if (selectedIdx > 0) { selectedIdx -= 1; renderDetail(); } });
            body.querySelector('#tsm-next').addEventListener('click', () => { if (selectedIdx < rosterCtx.list.length - 1) { selectedIdx += 1; renderDetail(); } });
            foot.querySelector('#tsm-save-meta').addEventListener('click', saveCurrent);
            foot.querySelector('#tsm-download-a4').addEventListener('click', () => {
                saveCurrent();
                const latest = rosterCtx.list[selectedIdx];
                const html = buildPrintableArchiveHtml(latest, rosterCtx);
                const fileName = buildArchiveFileName(latest, rosterCtx);
                const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                const url = root.URL.createObjectURL(blob);
                const a = doc.createElement('a');
                a.href = url;
                a.download = fileName;
                doc.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => root.URL.revokeObjectURL(url), 1500);
                toast(`已下载 ${fileName}`, 'success');
            });
            foot.querySelector('#tsm-print-a4').addEventListener('click', () => {
                saveCurrent();
                const latest = rosterCtx.list[selectedIdx];
                const html = buildPrintableArchiveHtml(latest, rosterCtx);
                const iframe = doc.createElement('iframe');
                iframe.setAttribute('aria-hidden', 'true');
                iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
                iframe.srcdoc = html;
                const cleanup = () => { setTimeout(() => { try { iframe.remove(); } catch (_) { } }, 500); };
                iframe.addEventListener('load', () => {
                    try {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    } catch (_) {
                        toast('当前环境不支持直接拉起打印，请点击「下载 A4 档案」后打开打印', 'info');
                    }
                    cleanup();
                }, { once: true });
                doc.body.appendChild(iframe);
            });
        }

        renderList();
        return true;
    }

    root.__TOP_STUDENT_MENTORING_PATCHED__ = true;
    root.openTopStudentMentoringModal = openTopStudentMentoringModal;
    root.TopStudentMentoring = {
        GRADE_MENTORING_PROFILES,
        resolveMentoringGrade,
        getMentoringGradeProfile,
        getStorageKey,
        loadMentoringStore,
        saveMentoringStore,
        computeGradeSubjectStats,
        computeGradeSubjectAverages,
        diagnoseStudentSubjects,
        buildTopStudentRoster,
        buildPrintableArchiveHtml,
        buildArchiveFileName,
        exportMentoringLedgerExcel,
        openTopStudentMentoringModal
    };
})(typeof window !== 'undefined' ? window : globalThis);
