/*
 * 育苗 / 尖子生包保培养档案（top-student-mentoring）按需运行时模块
 *
 * 功能：
 * 1. 自动从本校当前成绩中提取前 N 名尖子生（默认 30 人），划分为「冲刺梯队 / 稳进梯队 / 提升梯队」。
 * 2. 支持维护每位学生的包保教师、家长联系方式、培养目标备注（按届别持久化到 localStorage）。
 * 3. 自动对比年级各科均分，生成优势学科 / 薄弱学科诊断与针对性培养建议，并串联历次考试名次进退。
 * 4. 提供单页 A4 育苗档案预览（含班主任、包保教师、教导主任签字栏）、上一份/下一份连续翻页，以及一键打印/导出 PDF。
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
            return {
                key,
                name: String(student.name || '未知').trim(),
                class: String(student.class || '').trim(),
                school: String(student.school || mySchool || '本校').trim(),
                total,
                gradeRank,
                tier,
                mentor: String(meta.mentor || '').trim(),
                parentContact: String(meta.parentContact || '').trim(),
                targetNote: String(meta.targetNote || '').trim(),
                scores: student.scores || {},
                diagnosis,
                history
            };
        });
        return { list, subjects, gradeAverages, examLabel, schoolName: mySchool || (pool[0]?.school || '本校') };
    }

    function buildPrintableArchiveHtml(student, context) {
        const subjectRows = (student.diagnosis?.diffs || []).map((d) => `
            <tr>
                <td>${escHtml(d.subject)}</td>
                <td><strong>${d.score}</strong></td>
                <td>${d.avg}</td>
                <td style="color:${d.diff >= 0 ? '#15803d' : '#b91c1c'};font-weight:600;">${d.diff >= 0 ? '+' : ''}${d.diff}</td>
            </tr>`).join('');
        const historyRows = (student.history || []).map((h) => `
            <tr>
                <td>${escHtml(h.exam)}</td>
                <td>${h.total}</td>
                <td>第 ${h.rank || '-'} 名</td>
                <td>${h.delta == null ? '—' : (h.delta > 0 ? `↑ 进步 ${h.delta} 名` : (h.delta < 0 ? `↓ 退步 ${Math.abs(h.delta)} 名` : '持平'))}</td>
            </tr>`).join('');
        return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>育苗培养档案 - ${escHtml(student.name)}</title>
<style>
@page{size:A4;margin:14mm}
body{font-family:"Microsoft YaHei",sans-serif;color:#0f172a;margin:0;padding:16px;background:#fff}
.sheet{max-width:760px;margin:0 auto;border:1.5px solid #334155;padding:22px 26px;border-radius:6px}
.head{text-align:center;border-bottom:2px solid #0f766e;padding-bottom:10px;margin-bottom:14px}
.head h1{margin:0;font-size:21px;letter-spacing:2px}
.head p{margin:6px 0 0;font-size:13px;color:#475569}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;font-size:13px;background:#f8fafc;padding:10px 12px;border:1px solid #cbd5e1;border-radius:6px}
h2{font-size:14px;color:#0f766e;margin:14px 0 6px;border-left:4px solid #0f766e;padding-left:8px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px}
th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:center}
th{background:#f1f5f9}
.diag{background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:10px 12px;font-size:13px;line-height:1.7}
.signs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px;padding-top:12px;border-top:1px dashed #94a3b8;font-size:13px}
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
  <table><thead><tr><th>学科</th><th>个人得分</th><th>级部均分</th><th>较均分差值</th></tr></thead><tbody>${subjectRows}</tbody></table>
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

    function ensureStyles() {
        const doc = root.document;
        if (!doc || doc.getElementById('tsm-style')) return;
        const style = doc.createElement('style');
        style.id = 'tsm-style';
        style.textContent = `
.tsm-mask{position:fixed;inset:0;background:rgba(15,23,42,.58);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px}
.tsm-dialog{background:#fff;color:#0f172a;border-radius:14px;width:min(1040px,96vw);max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,.28)}
.tsm-head{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:linear-gradient(90deg,#4c1d95,#0f766e);color:#fff}
.tsm-head h3{margin:0;font-size:16px}
.tsm-close{background:transparent;border:none;color:#e2e8f0;font-size:22px;cursor:pointer}
.tsm-body{padding:16px 20px;overflow:auto;display:grid;gap:12px}
.tsm-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;background:#f8fafc;padding:10px 12px;border-radius:10px;border:1px solid #e2e8f0}
.tsm-pill{padding:5px 12px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:13px}
.tsm-pill.is-active{background:#6d28d9;color:#fff;border-color:#6d28d9}
.tsm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.tsm-card{border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:#fff;display:grid;gap:6px;cursor:pointer;transition:border-color .15s}
.tsm-card:hover{border-color:#6d28d9}
.tsm-badge{display:inline-block;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:600;background:#ede9fe;color:#6d28d9}
.tsm-a4{border:1px solid #cbd5e1;border-radius:10px;padding:18px;background:#fff;display:grid;gap:12px}
.tsm-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0}
.tsm-form label{display:grid;gap:4px;font-size:12px;color:#475569}
.tsm-form input{padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px}
.tsm-table{width:100%;border-collapse:collapse;font-size:13px}
.tsm-table th,.tsm-table td{border:1px solid #e2e8f0;padding:6px 8px;text-align:center}
.tsm-table th{background:#f1f5f9}
.tsm-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 20px;border-top:1px solid #e2e8f0;background:#f8fafc}
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
            <div class="tsm-head"><h3>🌱 育苗 · 尖子生包保培养档案（支持 A4 签字版导出）</h3><button type="button" class="tsm-close" aria-label="关闭">&times;</button></div>
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
        let selectedIdx = -1;
        let rosterCtx = buildTopStudentRoster(allRows, options);

        function refreshData() {
            rosterCtx = buildTopStudentRoster(allRows, options);
        }

        function renderList() {
            const filtered = rosterCtx.list.filter((s) => {
                if (activeTier !== '全部' && s.tier !== activeTier) return false;
                if (query && !s.name.includes(query) && !s.class.includes(query) && !s.mentor.includes(query)) return false;
                return true;
            });
            body.innerHTML = `
                <div class="tsm-toolbar">
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        ${['全部', '冲刺梯队', '稳进梯队', '提升梯队'].map((t) => `<button type="button" class="tsm-pill ${t === activeTier ? 'is-active' : ''}" data-tsm-tier="${t}">${t}</button>`).join('')}
                    </div>
                    <input type="text" id="tsm-search" value="${escHtml(query)}" placeholder="搜索姓名 / 班级 / 包保教师" style="padding:5px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;width:210px;">
                </div>
                <div class="tsm-grid">
                    ${filtered.map((s) => {
                        const origIdx = rosterCtx.list.indexOf(s);
                        return `<div class="tsm-card" data-tsm-idx="${origIdx}">
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <strong>${escHtml(s.name)} <span style="font-weight:400;color:#64748b;font-size:12px;">${escHtml(s.class)}</span></strong>
                                <span class="tsm-badge">${escHtml(s.tier)}</span>
                            </div>
                            <div style="font-size:13px;">总分 <strong>${s.total}</strong> · 级部第 <strong>${s.gradeRank}</strong> 名</div>
                            <div style="font-size:12px;color:#475569;">包保教师：${escHtml(s.mentor || '点击设置')}</div>
                            <div style="font-size:12px;color:#0f766e;">优势：${escHtml((s.diagnosis.strengths || []).map((x) => x.subject).join('、') || '均衡')}</div>
                        </div>`;
                    }).join('')}
                </div>`;
            foot.innerHTML = `<span style="font-size:12px;color:#64748b;">共纳入 ${rosterCtx.list.length} 名尖子生，点击任意卡片进入 A4 育苗档案与包保编辑。</span><button type="button" class="btn" id="tsm-close-btn">关闭</button>`;
            foot.querySelector('#tsm-close-btn').addEventListener('click', close);
            body.querySelectorAll('[data-tsm-tier]').forEach((btn) => {
                btn.addEventListener('click', () => { activeTier = btn.dataset.tsmTier; renderList(); });
            });
            const searchEl = body.querySelector('#tsm-search');
            searchEl.addEventListener('input', () => { query = searchEl.value.trim(); renderList(); });
            body.querySelectorAll('[data-tsm-idx]').forEach((card) => {
                card.addEventListener('click', () => {
                    selectedIdx = Number(card.dataset.tsmIdx);
                    renderDetail();
                });
            });
        }

        function renderDetail() {
            const student = rosterCtx.list[selectedIdx];
            if (!student) { renderList(); return; }
            body.innerHTML = `
                <div class="tsm-toolbar">
                    <button type="button" class="tsm-pill" id="tsm-back">← 返回育苗名单</button>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button type="button" class="tsm-pill" id="tsm-prev" ${selectedIdx <= 0 ? 'disabled' : ''}>上一份</button>
                        <span style="font-size:12px;color:#475569;">${selectedIdx + 1} / ${rosterCtx.list.length}</span>
                        <button type="button" class="tsm-pill" id="tsm-next" ${selectedIdx >= rosterCtx.list.length - 1 ? 'disabled' : ''}>下一份</button>
                    </div>
                </div>
                <div class="tsm-form">
                    <label>包保教师<input type="text" id="tsm-mentor" value="${escHtml(student.mentor)}" placeholder="例如：张老师"></label>
                    <label>家长联系方式<input type="text" id="tsm-contact" value="${escHtml(student.parentContact)}" placeholder="家长姓名 / 电话"></label>
                    <label>阶段培养目标<input type="text" id="tsm-target" value="${escHtml(student.targetNote)}" placeholder="例如：稳进年级前10，数学提分10分"></label>
                </div>
                <div class="tsm-a4">
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f766e;padding-bottom:8px;">
                        <div><strong style="font-size:17px;">${escHtml(student.name)}</strong>（${escHtml(student.class)} · ${escHtml(student.tier)}）</div>
                        <div>总分 <strong>${student.total}</strong> · 级部第 <strong>${student.gradeRank}</strong> 名</div>
                    </div>
                    <table class="tsm-table">
                        <thead><tr><th>学科</th><th>个人得分</th><th>级部均分</th><th>较均分差值</th></tr></thead>
                        <tbody>${student.diagnosis.diffs.map((d) => `<tr><td>${escHtml(d.subject)}</td><td><strong>${d.score}</strong></td><td>${d.avg}</td><td style="color:${d.diff >= 0 ? '#15803d' : '#b91c1c'};">${d.diff >= 0 ? '+' : ''}${d.diff}</td></tr>`).join('')}</tbody>
                    </table>
                    <div style="font-size:13px;line-height:1.6;background:#f8fafc;padding:10px 12px;border-radius:8px;">
                        <div><strong>自动诊断建议：</strong>${escHtml(student.diagnosis.advice)}</div>
                    </div>
                </div>`;
            foot.innerHTML = `
                <button type="button" class="btn" id="tsm-save-meta">💾 保存包保信息</button>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="btn" id="tsm-download-a4">📥 下载 A4 档案</button>
                    <button type="button" class="btn btn-green" id="tsm-print-a4">🖨️ 打印 / 存为 PDF</button>
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

    function buildArchiveFileName(student, context) {
        const safe = (v) => String(v || '').replace(/[\\/:*?"<>|]/g, '_').trim();
        const exam = safe(context?.examLabel || '考试');
        const cls = safe(student?.class || '');
        const name = safe(student?.name || '学生');
        return `育苗培养档案_${cls ? `${cls}_` : ''}${name}_${exam}.html`;
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
        openTopStudentMentoringModal
    };
})(typeof window !== 'undefined' ? window : globalThis);
