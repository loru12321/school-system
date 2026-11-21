/*
 * 育苗 / 尖子生包保培养档案（top-student-mentoring）按需运行时模块
 *
 * 视觉与交互遵循澄见（school-system）极简克制风格，完整适配浅色与深色模式：
 * 1. 顶部 4 张梯队统计卡（纳入人数 / 冲刺梯队 / 稳进梯队 / 包保覆盖率）与前 20/30/50 名切换。
 * 2. 支持按梯队筛选、姓名/班级/包保教师检索，以及一键「批量导出育苗台账 (Excel)」。
 * 3. 学生卡片内置梯队色条、级部名次徽章、较上次考试进退标签、优势/薄弱学科胶囊。
 * 4. 详情页提供精致 A4 公文质感档案预览（含各科相对级部均分双向柱状条、历次追踪、三方签字栏）、上一份/下一份翻页、直接下载 A4 档案与免弹窗 iframe 打印。
 *
 * 零内联 on* 事件，全部通过 addEventListener 绑定，满足严格 CSP。
 */
(function (root) {
    if (!root || root.__TOP_STUDENT_MENTORING_PATCHED__) return;

    const STORAGE_PREFIX = 'TOP_STUDENT_MENTORING_V1:';
    const DEFAULT_TOP_N = 30;

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

    function computeGradeSubjectAverages(rows, subjects) {
        const avgs = {};
        (subjects || []).forEach((subj) => {
            const vals = (rows || [])
                .map((r) => Number(r?.scores?.[subj]))
                .filter((v) => Number.isFinite(v));
            avgs[subj] = vals.length
                ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
                : 0;
        });
        return avgs;
    }

    function diagnoseStudentSubjects(student, subjects, gradeAverages) {
        const diffs = (subjects || []).map((subj) => {
            const score = Number(student?.scores?.[subj]);
            const avg = Number(gradeAverages?.[subj] || 0);
            if (!Number.isFinite(score)) return null;
            return { subject: subj, score: Number(score.toFixed(1)), avg, diff: Number((score - avg).toFixed(1)) };
        }).filter(Boolean);
        const sorted = diffs.slice().sort((a, b) => b.diff - a.diff);
        const strengths = sorted.filter((d) => d.diff > 0).slice(0, 2);
        const weaknesses = sorted.slice().reverse().slice(0, 2);
        const advice = weaknesses.length
            ? `巩固 ${strengths.map((s) => s.subject).join('、') || '优势学科'}，重点围绕 ${weaknesses.map((w) => `${w.subject}（较级部均分 ${w.diff >= 0 ? '+' : ''}${w.diff}）`).join('、')} 开展面批与专题突破。`
            : '各科发展较为均衡，建议聚焦压轴题与限时训练，冲刺更高名次。';
        return { diffs, strengths, weaknesses, advice };
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
        const mySchool = String(options.mySchool || root.MY_SCHOOL || root.DEFAULT_MY_SCHOOL_NAME || '').trim();
        const filtered = mySchool
            ? (allRows || []).filter((r) => sameSchool(r?.school, mySchool))
            : (allRows || []).slice();
        const pool = filtered.length ? filtered : (allRows || []).slice();
        const subjects = options.subjects || getSubjects(pool);
        const gradeAverages = computeGradeSubjectAverages(pool, subjects);
        const topN = Math.max(1, Number(options.topN) || DEFAULT_TOP_N);
        const store = options.store || loadMentoringStore(options.cohortKey);
        const examLabel = String(options.examLabel || root.CONFIG?.name || root.CURRENT_EXAM_ID || '本次考试').trim();

        const sorted = pool
            .filter((r) => Number.isFinite(Number(r?.total)))
            .slice()
            .sort((a, b) => Number(b.total) - Number(a.total));

        const list = sorted.slice(0, topN).map((student, idx) => {
            const gradeRank = idx + 1;
            const total = Number(Number(student.total).toFixed(1));
            const tier = (total >= 490 || gradeRank <= Math.ceil(topN / 3))
                ? '冲刺梯队'
                : (gradeRank <= Math.ceil((topN * 2) / 3) ? '稳进梯队' : '提升梯队');
            const key = getStudentKey(student);
            const meta = store[key] || {};
            const enriched = { ...student, gradeRank, total };
            const diagnosis = diagnoseStudentSubjects(enriched, subjects, gradeAverages);
            const history = collectStudentHistory(enriched, examLabel);
            const latestDelta = history.length > 1 ? history[history.length - 1].delta : null;
            return {
                key,
                name: String(student.name || '未知').trim(),
                class: String(student.class || '').trim(),
                school: String(student.school || mySchool || '本校').trim(),
                total,
                gradeRank,
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
        return { list, subjects, gradeAverages, examLabel, schoolName: mySchool || (pool[0]?.school || '本校'), totalPool: sorted.length };
    }

    function buildArchiveFileName(student, context) {
        const safe = (v) => String(v || '').replace(/[\\/:*?"<>|]/g, '_').trim();
        const exam = safe(context?.examLabel || '考试');
        const cls = safe(student?.class || '');
        const name = safe(student?.name || '学生');
        return `育苗培养档案_${cls ? `${cls}_` : ''}${name}_${exam}.html`;
    }

    function buildDiffBarHtml(diff, maxAbs) {
        const pct = Math.min(100, Math.round((Math.abs(diff) / Math.max(1, maxAbs)) * 100));
        const pos = diff >= 0;
        return `<div style="display:flex;align-items:center;gap:6px;justify-content:center;">
            <div style="width:46px;height:6px;background:#f1f5f9;border-radius:99px;display:flex;justify-content:flex-end;overflow:hidden;">${!pos ? `<i style="width:${pct}%;background:#ef4444;border-radius:99px;"></i>` : ''}</div>
            <span style="min-width:44px;font-weight:700;color:${pos ? '#15803d' : '#b91c1c'};">${pos ? '+' : ''}${diff}</span>
            <div style="width:46px;height:6px;background:#f1f5f9;border-radius:99px;display:flex;justify-content:flex-start;overflow:hidden;">${pos ? `<i style="width:${pct}%;background:#10b981;border-radius:99px;"></i>` : ''}</div>
        </div>`;
    }

    function buildPrintableArchiveHtml(student, context) {
        const diffs = student.diagnosis?.diffs || [];
        const maxAbs = Math.max(...diffs.map((d) => Math.abs(d.diff)), 10);
        const subjectRows = diffs.map((d) => `
            <tr>
                <td><strong>${escHtml(d.subject)}</strong></td>
                <td>${d.score}</td>
                <td>${d.avg}</td>
                <td>${buildDiffBarHtml(d.diff, maxAbs)}</td>
            </tr>`).join('');
        const historyRows = (student.history || []).map((h) => `
            <tr>
                <td>${escHtml(h.exam)}</td>
                <td><strong>${h.total}</strong></td>
                <td>第 ${h.rank || '-'} 名</td>
                <td style="color:${h.delta > 0 ? '#15803d' : (h.delta < 0 ? '#b91c1c' : '#475569')};font-weight:600;">${h.delta == null ? '—' : (h.delta > 0 ? `↑ 进步 ${h.delta} 名` : (h.delta < 0 ? `↓ 退步 ${Math.abs(h.delta)} 名` : '持平'))}</td>
            </tr>`).join('');
        return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>育苗培养档案 - ${escHtml(student.name)}</title>
<style>
@page{size:A4;margin:14mm}
body{font-family:"Microsoft YaHei",system-ui,sans-serif;color:#0f1419;margin:0;padding:16px;background:#fff}
.sheet{max-width:760px;margin:0 auto;border:1.5px solid #0f1419;padding:26px 30px;border-radius:4px}
.head{text-align:center;border-bottom:3px double #0f1419;padding-bottom:12px;margin-bottom:16px}
.head h1{margin:0;font-size:21px;letter-spacing:3px}
.head p{margin:6px 0 0;font-size:12.5px;color:#536471}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;font-size:13px;background:#f8fafc;padding:12px 14px;border:1px solid #cbd5e1;border-radius:6px}
h2{font-size:14px;color:#0f1419;margin:16px 0 8px;border-left:4px solid #0f1419;padding-left:8px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px}
th,td{border:1px solid #cbd5e1;padding:7px 8px;text-align:center}
th{background:#f1f5f9;font-weight:600}
.diag{background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:12px 14px;font-size:13px;line-height:1.75}
.signs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:28px;padding-top:14px;border-top:1px dashed #94a3b8;font-size:13px}
</style></head><body>
<div class="sheet">
  <div class="head">
    <h1>尖子生「育苗」包保培养档案</h1>
    <p>${escHtml(context.schoolName)} · ${escHtml(context.examLabel)} · 生成日期 ${new Date().toISOString().slice(0, 10)}</p>
  </div>
  <div class="meta">
    <div><strong>姓名：</strong>${escHtml(student.name)}</div>
    <div><strong>班级：</strong>${escHtml(student.class)}</div>
    <div><strong>培养梯队：</strong>${escHtml(student.tier)}</div>
    <div><strong>本次总分：</strong>${student.total} 分</div>
    <div><strong>级部名次：</strong>第 ${student.gradeRank} 名</div>
    <div><strong>包保教师：</strong>${escHtml(student.mentor || '待指派')}</div>
    <div style="grid-column:span 3;"><strong>家长联系：</strong>${escHtml(student.parentContact || '未填写')} &nbsp;|&nbsp; <strong>阶段目标：</strong>${escHtml(student.targetNote || '稳步冲刺前列')}</div>
  </div>
  <h2>一、本次各科成绩与级部均分对标</h2>
  <table><thead><tr><th>学科</th><th>个人得分</th><th>级部均分</th><th>相对均分偏离</th></tr></thead><tbody>${subjectRows}</tbody></table>
  <h2>二、优势与薄弱学科自动诊断</h2>
  <div class="diag">
    <div><strong>优势学科：</strong>${escHtml((student.diagnosis?.strengths || []).map((s) => `${s.subject}(+${s.diff})`).join('、') || '均衡')}</div>
    <div><strong>薄弱学科：</strong>${escHtml((student.diagnosis?.weaknesses || []).map((w) => `${w.subject}(${w.diff >= 0 ? '+' : ''}${w.diff})`).join('、') || '无明显短板')}</div>
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
        const wb = XLSX.utils.book_new();
        const header = ['级部名次', '梯队', '姓名', '班级', '本次总分', '较上次名次变化', '包保教师', '家长联系', '阶段目标', '优势学科', '薄弱学科', '诊断建议'];
        const aoa = [
            header,
            ...rosterCtx.list.map((s) => [
                s.gradeRank,
                s.tier,
                s.name,
                s.class,
                s.total,
                s.latestDelta == null ? '' : (s.latestDelta > 0 ? `+${s.latestDelta}` : String(s.latestDelta)),
                s.mentor || '',
                s.parentContact || '',
                s.targetNote || '',
                (s.diagnosis?.strengths || []).map((x) => `${x.subject}(+${x.diff})`).join('、'),
                (s.diagnosis?.weaknesses || []).map((x) => `${x.subject}(${x.diff >= 0 ? '+' : ''}${x.diff})`).join('、'),
                s.diagnosis?.advice || ''
            ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        if (typeof root.decorateExcelSheet === 'function') root.decorateExcelSheet(ws, header);
        XLSX.utils.book_append_sheet(wb, ws, '育苗包保培养台账');
        const safeExam = String(rosterCtx.examLabel || '考试').replace(/[\\/:*?"<>|]/g, '_');
        const fileName = `育苗包保培养台账_${safeExam}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast(`已导出 ${fileName}`, 'success');
        return true;
    }

    function ensureStyles() {
        const doc = root.document;
        if (!doc || doc.getElementById('tsm-style')) return;
        const style = doc.createElement('style');
        style.id = 'tsm-style';
        style.textContent = `
.tsm-mask{position:fixed;inset:0;background:rgba(15,20,25,.48);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
.tsm-dialog{background:var(--bg-card,#fff);color:var(--color-data,#0f1419);border:1px solid var(--border,#e5e7eb);border-radius:18px;width:min(1100px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(15,20,25,.18)}
.tsm-head{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--border,#eff3f4);background:var(--bg-card,#fff)}
.tsm-head-meta{display:grid;gap:2px}
.tsm-head h3{margin:0;font-size:17px;font-weight:700;letter-spacing:-.01em}
.tsm-head p{margin:0;font-size:12.5px;color:var(--secondary,#536471)}
.tsm-close{width:34px;height:34px;border-radius:999px;border:1px solid var(--border,#e5e7eb);background:transparent;color:var(--secondary,#536471);font-size:18px;cursor:pointer;display:grid;place-items:center}
.tsm-close:hover{background:var(--primary-light,#eff3f4);color:var(--color-data,#0f1419)}
.tsm-body{padding:20px 24px;overflow:auto;display:grid;gap:16px;background:var(--bg-body,#f7f9f9)}
.tsm-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:720px){.tsm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tsm-kpi{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:14px 16px;display:grid;gap:4px}
.tsm-kpi span{font-size:12px;color:var(--secondary,#536471)}
.tsm-kpi strong{font-size:22px;font-weight:700;letter-spacing:-.02em}
.tsm-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:var(--bg-card,#fff);padding:12px 16px;border-radius:14px;border:1px solid var(--border,#e5e7eb)}
.tsm-pill{padding:5px 12px;border-radius:999px;border:1px solid var(--border,#d1d5db);background:transparent;color:var(--color-data,#0f1419);cursor:pointer;font-size:12.5px;transition:all .15s}
.tsm-pill:hover{background:var(--primary-light,#eff3f4)}
.tsm-pill.is-active{background:var(--primary,#0f1419);color:var(--bg-card,#fff);border-color:var(--primary,#0f1419)}
.tsm-input{padding:6px 11px;border:1px solid var(--border,#d1d5db);border-radius:10px;background:var(--bg-card,#fff);color:var(--color-data,#0f1419);font-size:13px;outline:none}
.tsm-input:focus{border-color:#1d9bf0}
.tsm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.tsm-card{position:relative;border:1px solid var(--border,#e5e7eb);border-left:4px solid #1d9bf0;border-radius:14px;padding:14px 15px;background:var(--bg-card,#fff);display:grid;gap:8px;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s}
.tsm-card:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(15,20,25,.06);border-color:#94a3b8}
.tsm-card[data-tier="冲刺梯队"]{border-left-color:#f59e0b}
.tsm-card[data-tier="稳进梯队"]{border-left-color:#1d9bf0}
.tsm-card[data-tier="提升梯队"]{border-left-color:#00ba7c}
.tsm-rk{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;font-size:12px;font-weight:700;background:var(--primary-light,#eff3f4);color:var(--color-data,#0f1419)}
.tsm-rk-top{background:#fef3c7;color:#b45309}
.tsm-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:var(--primary-light,#eff3f4);color:var(--secondary,#536471)}
.tsm-delta{font-size:11.5px;font-weight:700;padding:1px 6px;border-radius:999px}
.tsm-delta-up{background:rgba(0,186,124,.14);color:#00875a}
.tsm-delta-down{background:rgba(244,33,46,.12);color:#dc2626}
.tsm-tags{display:flex;flex-wrap:wrap;gap:5px;font-size:11.5px}
.tsm-tag-s{padding:2px 7px;border-radius:6px;background:rgba(0,186,124,.10);color:#00875a}
.tsm-tag-w{padding:2px 7px;border-radius:6px;background:rgba(244,33,46,.08);color:#dc2626}
.tsm-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;background:var(--bg-card,#fff);padding:14px 16px;border-radius:14px;border:1px solid var(--border,#e5e7eb)}
.tsm-form label{display:grid;gap:5px;font-size:12px;font-weight:600;color:var(--secondary,#536471)}
.tsm-a4{max-width:820px;width:100%;margin:0 auto;border:1px solid #cbd5e1;border-radius:10px;padding:24px 28px;background:#fff;color:#0f1419;box-shadow:0 10px 28px rgba(15,20,25,.06);display:grid;gap:14px}
.tsm-a4-head{text-align:center;border-bottom:3px double #0f1419;padding-bottom:10px}
.tsm-a4-head h4{margin:0;font-size:19px;letter-spacing:2px}
.tsm-a4-head p{margin:4px 0 0;font-size:12px;color:#536471}
.tsm-a4-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:13px}
.tsm-table{width:100%;border-collapse:collapse;font-size:13px}
.tsm-table th,.tsm-table td{border:1px solid #e2e8f0;padding:7px 10px;text-align:center}
.tsm-table th{background:#f8fafc;font-weight:600;color:#475569}
.tsm-signs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding-top:12px;border-top:1px dashed #94a3b8;font-size:12.5px;color:#475569}
.tsm-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 24px;border-top:1px solid var(--border,#eff3f4);background:var(--bg-card,#fff)}
body.dark-mode .tsm-tag-s,body.dark-mode .tsm-delta-up{color:#34d399}
body.dark-mode .tsm-tag-w,body.dark-mode .tsm-delta-down{color:#f87171}
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
                <div class="tsm-head-meta"><h3>育苗 · 尖子生包保培养台账与 A4 档案</h3><p>按成绩自动分梯队、追踪进退与学科偏离，支持批量导出台账 Excel 及单人 A4 签字档案</p></div>
                <button type="button" class="tsm-close" aria-label="关闭">&times;</button>
            </div>
            <div class="tsm-body"></div>
            <div class="tsm-foot"></div>
        </div>`;
        const close = () => mask.remove();
        mask.querySelector('.tsm-close').addEventListener('click', close);
        mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
        doc.body.appendChild(mask);

        const body = mask.querySelector('.tsm-body');
        const foot = mask.querySelector('.tsm-foot');
        let activeTier = '全部';
        let query = '';
        let topN = Number(options.topN) || DEFAULT_TOP_N;
        let selectedIdx = -1;
        let rosterCtx = buildTopStudentRoster(allRows, { ...options, topN });

        function refreshData() {
            rosterCtx = buildTopStudentRoster(allRows, { ...options, topN });
        }

        function renderList() {
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
                    <div class="tsm-kpi"><span>纳入育苗人数</span><strong>${rosterCtx.list.length} 人</strong></div>
                    <div class="tsm-kpi"><span>冲刺梯队</span><strong style="color:#f59e0b;">${sprintCnt} 人</strong></div>
                    <div class="tsm-kpi"><span>稳进梯队</span><strong style="color:#1d9bf0;">${steadyCnt} 人</strong></div>
                    <div class="tsm-kpi"><span>已指派包保教师</span><strong style="color:#00ba7c;">${assignedCnt} / ${rosterCtx.list.length}</strong></div>
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
                        return `<div class="tsm-card" data-tsm-idx="${origIdx}" data-tier="${escHtml(s.tier)}">
                            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <span class="tsm-rk ${s.gradeRank <= 3 ? 'tsm-rk-top' : ''}">${s.gradeRank}</span>
                                    <div><strong style="font-size:14.5px;">${escHtml(s.name)}</strong> <span style="color:var(--secondary,#536471);font-size:12px;">${escHtml(s.class)}</span></div>
                                </div>
                                <span class="tsm-badge">${escHtml(s.tier)}</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
                                <span>总分 <strong style="font-size:15px;">${s.total}</strong> ${deltaHtml}</span>
                                <span style="font-size:12px;color:var(--secondary,#536471);">包保：${escHtml(s.mentor || '待指派')}</span>
                            </div>
                            <div class="tsm-tags">
                                ${strong ? `<span class="tsm-tag-s">优 ${escHtml(strong.subject)} +${strong.diff}</span>` : ''}
                                ${weak ? `<span class="tsm-tag-w">弱 ${escHtml(weak.subject)} ${weak.diff >= 0 ? '+' : ''}${weak.diff}</span>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
            foot.innerHTML = `
                <span style="font-size:12.5px;color:var(--secondary,#536471);">点击任意学生卡片查看 A4 签字档案并维护包保教师</span>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="btn btn-green" id="tsm-export-ledger">导出育苗台账 (Excel)</button>
                    <button type="button" class="btn" id="tsm-close-btn">关闭</button>
                </div>`;
            foot.querySelector('#tsm-close-btn').addEventListener('click', close);
            foot.querySelector('#tsm-export-ledger').addEventListener('click', () => exportMentoringLedgerExcel(rosterCtx));
            body.querySelectorAll('[data-tsm-tier]').forEach((btn) => btn.addEventListener('click', () => { activeTier = btn.dataset.tsmTier; renderList(); }));
            body.querySelector('#tsm-topn').addEventListener('change', (e) => { topN = Number(e.target.value) || DEFAULT_TOP_N; refreshData(); renderList(); });
            const searchEl = body.querySelector('#tsm-search');
            searchEl.addEventListener('input', () => { query = searchEl.value.trim(); renderList(); });
            body.querySelectorAll('[data-tsm-idx]').forEach((card) => card.addEventListener('click', () => { selectedIdx = Number(card.dataset.tsmIdx); renderDetail(); }));
        }

        function renderDetail() {
            const student = rosterCtx.list[selectedIdx];
            if (!student) { renderList(); return; }
            const diffs = student.diagnosis?.diffs || [];
            const maxAbs = Math.max(...diffs.map((d) => Math.abs(d.diff)), 10);
            body.innerHTML = `
                <div class="tsm-toolbar">
                    <button type="button" class="tsm-pill" id="tsm-back">← 返回育苗台账</button>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button type="button" class="tsm-pill" id="tsm-prev" ${selectedIdx <= 0 ? 'disabled' : ''}>上一份</button>
                        <span style="font-size:12.5px;color:var(--secondary,#536471);">${selectedIdx + 1} / ${rosterCtx.list.length}</span>
                        <button type="button" class="tsm-pill" id="tsm-next" ${selectedIdx >= rosterCtx.list.length - 1 ? 'disabled' : ''}>下一份</button>
                    </div>
                </div>
                <div class="tsm-form">
                    <label>包保教师<input type="text" class="tsm-input" id="tsm-mentor" value="${escHtml(student.mentor)}" placeholder="例如：张老师"></label>
                    <label>家长联系方式<input type="text" class="tsm-input" id="tsm-contact" value="${escHtml(student.parentContact)}" placeholder="家长姓名 / 电话"></label>
                    <label>阶段培养目标<input type="text" class="tsm-input" id="tsm-target" value="${escHtml(student.targetNote)}" placeholder="例如：稳进年级前10，数学提分10分"></label>
                </div>
                <div class="tsm-a4">
                    <div class="tsm-a4-head">
                        <h4>尖子生「育苗」包保培养档案</h4>
                        <p>${escHtml(rosterCtx.schoolName)} · ${escHtml(rosterCtx.examLabel)} · ${new Date().toISOString().slice(0, 10)}</p>
                    </div>
                    <div class="tsm-a4-meta">
                        <div><strong>姓名：</strong>${escHtml(student.name)}</div>
                        <div><strong>班级：</strong>${escHtml(student.class)}</div>
                        <div><strong>培养梯队：</strong>${escHtml(student.tier)}</div>
                        <div><strong>本次总分：</strong>${student.total} 分</div>
                        <div><strong>级部名次：</strong>第 ${student.gradeRank} 名</div>
                        <div><strong>包保教师：</strong>${escHtml(student.mentor || '待指派')}</div>
                    </div>
                    <table class="tsm-table">
                        <thead><tr><th>学科</th><th>个人得分</th><th>级部均分</th><th>相对级部均分偏离</th></tr></thead>
                        <tbody>${diffs.map((d) => `<tr><td><strong>${escHtml(d.subject)}</strong></td><td>${d.score}</td><td>${d.avg}</td><td>${buildDiffBarHtml(d.diff, maxAbs)}</td></tr>`).join('')}</tbody>
                    </table>
                    <div style="font-size:13px;line-height:1.7;background:#f8fafc;padding:12px 14px;border-radius:8px;border:1px solid #e2e8f0;">
                        <div><strong>优势学科：</strong>${escHtml((student.diagnosis.strengths || []).map((s) => `${s.subject}(+${s.diff})`).join('、') || '均衡')} &nbsp;|&nbsp; <strong>薄弱学科：</strong>${escHtml((student.diagnosis.weaknesses || []).map((w) => `${w.subject}(${w.diff >= 0 ? '+' : ''}${w.diff})`).join('、') || '无明显短板')}</div>
                        <div style="margin-top:4px;"><strong>培养建议：</strong>${escHtml(student.diagnosis.advice)}</div>
                    </div>
                    <div class="tsm-signs">
                        <div>班主任签字：______________</div>
                        <div>包保教师签字：____________</div>
                        <div>教导主任签字：____________</div>
                    </div>
                </div>`;
            foot.innerHTML = `
                <button type="button" class="btn" id="tsm-save-meta">保存包保信息</button>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="btn" id="tsm-download-a4">下载 A4 档案</button>
                    <button type="button" class="btn btn-green" id="tsm-print-a4">打印 / 存为 PDF</button>
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
        getStorageKey,
        loadMentoringStore,
        saveMentoringStore,
        computeGradeSubjectAverages,
        diagnoseStudentSubjects,
        buildTopStudentRoster,
        buildPrintableArchiveHtml,
        buildArchiveFileName,
        exportMentoringLedgerExcel,
        openTopStudentMentoringModal
    };
})(typeof window !== 'undefined' ? window : globalThis);
