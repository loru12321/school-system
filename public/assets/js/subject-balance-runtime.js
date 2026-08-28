/*
 * 学科优劣势透视（subject-balance）运行时模块
 *
 * 从 app.js 抽出的「学生优劣势 / 学科均衡」展示模块：学生各科相对年级均分的
 * 差值可视化、kmeans 文理/均衡聚类分组与辅导策略、Excel 导出。
 *
 * 纯展示逻辑，不涉及任何成绩计算口径（两率一分 / 优秀线 / 排名核算 / 学校归一化
 * 均不在此）。依赖的全局（SUBJECTS / RAW_DATA / getAppSchoolRecord / escapeAppHtml
 * / safeGet / listAvailableSchoolsForCompare / readCurrentSchool / sameAppSchoolName
 * / XLSX）都由 app.js 或 vendor 提供，本模块在其后（DEFERRED_APP_MODULES）加载，
 * 通过 root.* 访问并带 typeof 兜底。
 */
(function (root) {
    if (!root) return;

    const esc = (value) => (typeof root.escapeAppHtml === 'function'
        ? root.escapeAppHtml(value)
        : String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char])));

    const safeGetValue = (obj, path, defaultValue = '-') => (typeof root.safeGet === 'function'
        ? root.safeGet(obj, path, defaultValue)
        : (path.split('.').reduce((acc, key) => acc && acc[key], obj) || defaultValue));

    const getSubjects = () => (Array.isArray(root.SUBJECTS) ? root.SUBJECTS : []);
    const getRawData = () => (Array.isArray(root.RAW_DATA) ? root.RAW_DATA : []);
    const getSchoolRecord = (school) => (typeof root.getAppSchoolRecord === 'function'
        ? root.getAppSchoolRecord(school) : null);
    const showAlert = (message, type = 'info') => {
        if (root.UI && typeof root.UI.alert === 'function') return root.UI.alert(message, type);
        if (typeof root.uiAlert === 'function') return root.uiAlert(message, type);
        return root.alert(message);
    };

    // 缓存最近一次分析结果，供导出复用（原 app.js 的 SB_CACHE_DATA）。
    let SB_CACHE_DATA = [];
    let SB_GRADE_STATS_SIGNATURE = '';
    let SB_GRADE_STATS_CACHE = null;
    let SB_RENDER_CACHE = null;
    let SB_SELECT_OPTIONS_CACHE = { schoolSignature: '', classSignature: '', classSchool: '' };

    function getGradeStatsSignature() {
        const rows = getRawData();
        const first = rows[0] || {};
        const last = rows[rows.length - 1] || {};
        return [
            rows.length,
            getSubjects().join('|'),
            String(first.name || ''),
            String(last.name || ''),
            String(first.total || ''),
            String(last.total || '')
        ].join('::');
    }

    function updateSubjectBalanceSelects() {
        const schSel = root.document.getElementById('sbSchoolSelect');
        const clsSel = root.document.getElementById('sbClassSelect');
        if (!schSel || !clsSel) return;

        const schoolList = (typeof root.listAvailableSchoolsForCompare === 'function')
            ? root.listAvailableSchoolsForCompare('all')
            : Object.keys(root.SCHOOLS || {});
        const schoolOptionsHtml = `<option value="">--请选择学校--</option>${schoolList.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}`;
        const schoolSignature = schoolList.join('|');
        if (SB_SELECT_OPTIONS_CACHE.schoolSignature !== schoolSignature) {
            schSel.innerHTML = schoolOptionsHtml;
            SB_SELECT_OPTIONS_CACHE.schoolSignature = schoolSignature;
        }
        const currentSchool = typeof root.readCurrentSchool === 'function' ? root.readCurrentSchool() : '';
        const matched = Array.from(schSel.options || []).find(option =>
            (typeof root.sameAppSchoolName === 'function' ? root.sameAppSchoolName(option.value, currentSchool) : option.value === currentSchool));
        if (matched) schSel.value = matched.value;

        schSel.onchange = () => {
            const schoolRecord = getSchoolRecord(schSel.value);
            const classes = schoolRecord ? [...new Set((schoolRecord.students || []).map(s => s.class))].sort() : [];
            const classOptionsHtml = `<option value="">全部</option>${classes.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}`;
            const classSignature = `${schSel.value}::${classes.join('|')}`;
            if (SB_SELECT_OPTIONS_CACHE.classSignature !== classSignature
                || SB_SELECT_OPTIONS_CACHE.classSchool !== schSel.value) {
                clsSel.innerHTML = classOptionsHtml;
                SB_SELECT_OPTIONS_CACHE.classSignature = classSignature;
                SB_SELECT_OPTIONS_CACHE.classSchool = schSel.value;
            }
        };
        schSel.onchange();
    }

    function SB_renderTable() {
        const sch = root.document.getElementById('sbSchoolSelect').value;
        const cls = root.document.getElementById('sbClassSelect').value;
        const sortType = root.document.getElementById('sbSortBy').value;

        if (!sch) return showAlert("请先选择学校");

        const schoolRecord = getSchoolRecord(sch);
        if (!schoolRecord || !Array.isArray(schoolRecord.students)) return showAlert("该学校暂无学生数据");
        let students = schoolRecord.students;
        if (cls && cls !== '全部') students = students.filter(s => s.class === cls);

        const sourceRows = schoolRecord.students;
        const firstRow = sourceRows[0] || {};
        const lastRow = sourceRows[sourceRows.length - 1] || {};
        const renderSignature = [
            sch,
            cls || '全部',
            sortType || 'balance',
            getGradeStatsSignature(),
            sourceRows.length,
            String(firstRow.name || ''),
            String(firstRow.total || ''),
            String(lastRow.name || ''),
            String(lastRow.total || ''),
            students.length
        ].join('::');
        const tbody = root.document.querySelector('#sb-table tbody');
        if (SB_RENDER_CACHE?.signature === renderSignature && tbody) {
            SB_CACHE_DATA = SB_RENDER_CACHE.renderList;
            tbody.innerHTML = SB_RENDER_CACHE.html;
            return;
        }

        const gradeStats = SB_getGradeStats();

        const renderList = students.map(s => {
            const items = [];
            let maxDiff = -999;
            let minDiff = 999;

            getSubjects().forEach(sub => {
                if (s.scores[sub] === undefined) return;
                const diff = s.scores[sub] - gradeStats[sub]; // 差值
                items.push({ sub, score: s.scores[sub], diff });

                if (diff > maxDiff) maxDiff = diff;
                if (diff < minDiff) minDiff = diff;
            });

            items.sort((a, b) => b.diff - a.diff);

            const balanceScore = maxDiff - minDiff;

            return {
                name: s.name,
                class: s.class,
                total: s.total,
                rank: safeGetValue(s, 'ranks.total.township', '-'),
                items,
                balanceScore
            };
        });

        if (sortType === 'total') {
            renderList.sort((a, b) => b.total - a.total);
        } else {
            renderList.sort((a, b) => b.balanceScore - a.balanceScore); // 越不均衡排越前
        }

        SB_CACHE_DATA = renderList; // 存入缓存

        let html = '';

        renderList.forEach(row => {

            let barsHtml = `<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">`;

            row.items.forEach(item => {
                const isStrong = item.diff >= 0;
                const color = isStrong ? '#16a34a' : '#dc2626';
                const icon = isStrong ? '📈' : '📉';

                const absDiff = Math.abs(item.diff);
                const barWidth = Math.min(absDiff * 2, 50); // 限制最大宽度

                barsHtml += `
                        <div style="display:flex; flex-direction:column; align-items:center; width:50px;">
                            <div style="font-size:10px; font-weight:bold; color:#333;">${item.sub}</div>
                            <div style="display:flex; align-items:flex-end; height:40px; justify-content:center; width:100%;">
                                <div style="
                                    width: 12px;
                                    height: ${Math.max(barWidth, 2)}px;
                                    background-color: ${color};
                                    border-radius: 2px;
                                    opacity: ${absDiff < 2 ? 0.3 : 1};
                                " title="分数: ${item.score} (比平均${item.diff > 0 ? '+' : ''}${item.diff.toFixed(1)})"></div>
                            </div>
                            <div style="font-size:10px; color:${color}; font-weight:bold;">
                                ${item.diff > 0 ? '+' : ''}${item.diff.toFixed(0)}
                            </div>
                        </div>
                    `;
            });
            barsHtml += `</div>`;

            const strongSub = row.items[0];
            const weakSub = row.items[row.items.length - 1];
            let comment = "";
            if (row.balanceScore < 15) comment = `<span class="badge" style="background:#3b82f6">⚖️ 非常均衡</span>`;
            else {
                comment = `<div style="font-size:12px; line-height:1.4;">
                        <div>👍 强: <strong>${strongSub.sub}</strong> (+${strongSub.diff.toFixed(0)})</div>
                        <div style="color:#dc2626;">🆘 弱: <strong>${weakSub.sub}</strong> (${weakSub.diff.toFixed(0)})</div>
                    </div>`;
            }

            html += `
                    <tr>
                        <td>
                            <div style="font-weight:bold;">${row.name}</div>
                            <div style="font-size:10px; color:#999;">${row.class}</div>
                        </td>
                        <td style="font-weight:bold; font-size:14px;">${row.total}</td>
                        <td>${row.rank}</td>
                        <td style="padding:10px 5px;">${barsHtml}</td>
                        <td>${comment}</td>
                    </tr>
                `;
        });

        if (renderList.length === 0) html = '<tr><td colspan="5" style="text-align:center; padding:20px;">无数据</td></tr>';
        SB_RENDER_CACHE = { signature: renderSignature, renderList, html };
        if (tbody) tbody.innerHTML = html;
    }

    function SB_getGradeStats() {
        const signature = getGradeStatsSignature();
        if (signature === SB_GRADE_STATS_SIGNATURE && SB_GRADE_STATS_CACHE) return SB_GRADE_STATS_CACHE;
        const gradeStats = {};
        getSubjects().forEach(sub => {
            const allScores = getRawData().map(s => s.scores[sub]).filter(v => typeof v === 'number');
            const avg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
            gradeStats[sub] = avg;
        });
        SB_GRADE_STATS_SIGNATURE = signature;
        SB_GRADE_STATS_CACHE = gradeStats;
        return gradeStats;
    }

    function SB_runCluster() {
        const sch = root.document.getElementById('sbSchoolSelect').value;
        const cls = root.document.getElementById('sbClassSelect').value;
        if (!sch) return showAlert("请先选择学校");

        const schoolRecord = getSchoolRecord(sch);
        if (!schoolRecord || !Array.isArray(schoolRecord.students)) return showAlert("该学校暂无学生数据");
        let students = schoolRecord.students;
        if (cls && cls !== '全部') students = students.filter(s => s.class === cls);
        if (!students.length) return showAlert("无可用学生数据");

        const gradeStats = SB_getGradeStats();
        const humanities = ['语文', '英语', '政治', '历史', '地理'];
        const sciences = ['数学', '物理', '化学', '生物', '科学'];

        const vectors = [];
        const meta = [];

        students.forEach(s => {
            const diffs = [];
            getSubjects().forEach(sub => {
                const v = s.scores[sub];
                if (typeof v === 'number') diffs.push({ sub, diff: v - (gradeStats[sub] || 0) });
            });
            if (diffs.length === 0) return;

            const hList = diffs.filter(d => humanities.includes(d.sub));
            const sList = diffs.filter(d => sciences.includes(d.sub));
            const hAvg = hList.length ? hList.reduce((a, b) => a + b.diff, 0) / hList.length : 0;
            const sAvg = sList.length ? sList.reduce((a, b) => a + b.diff, 0) / sList.length : 0;
            const maxAbs = Math.max(...diffs.map(d => Math.abs(d.diff)));
            const balance = Math.max(...diffs.map(d => d.diff)) - Math.min(...diffs.map(d => d.diff));

            vectors.push([hAvg, sAvg, maxAbs, balance]);
            meta.push({ name: s.name, class: s.class, hAvg, sAvg, maxAbs, balance });
        });

        const { labels, centroids } = kmeans(vectors, 4, 12);
        const clusterMap = {};
        labels.forEach((c, i) => {
            if (!clusterMap[c]) clusterMap[c] = [];
            clusterMap[c].push(meta[i]);
        });

        const clusterLabels = {};
        centroids.forEach((centroid, idx) => {
            const [hAvg, sAvg, maxAbs, balance] = centroid;
            let tag = '全科均衡型';
            if (balance < 8 && Math.abs(hAvg - sAvg) < 6) tag = '全科均衡型';
            else if (hAvg - sAvg > 6) tag = '文强理弱型';
            else if (sAvg - hAvg > 6) tag = '理强文弱型';
            else if (maxAbs > 12 || balance > 18) tag = '单科突围型';
            clusterLabels[idx] = tag;
        });

        SB_renderClusterResults(clusterMap, clusterLabels);
    }

    function SB_renderClusterResults(clusterMap, clusterLabels) {
        const container = root.document.getElementById('sb-cluster-results');
        if (!container) return;

        const strategy = {
            '全科均衡型': '策略：保持节奏，适度强化拔高题；每周1次综合训练，避免短板出现。',
            '文强理弱型': '策略：补数学/物理基础概念与题型套路，每天固定15-20分钟理科训练。',
            '理强文弱型': '策略：语文/英语以“阅读+词汇+写作”三板斧推进，重点提升语感与表达。',
            '单科突围型': '策略：保优势学科的同时补齐最弱科，制定“主攻+补弱”双轨计划。'
        };

        let html = '';
        Object.keys(clusterMap).forEach(k => {
            const label = clusterLabels[k] || '未命名';
            const list = clusterMap[k] || [];
            html += `<div style="margin-bottom:12px; padding:10px; border:1px dashed #fed7aa; border-radius:8px; background:#fff;">
                    <div style="font-weight:bold; color:#9a3412;">${esc(label)}（${list.length}人）</div>
                    <div style="margin:6px 0; color:#7c2d12;">${esc(strategy[label] || '')}</div>
                    <div style="font-size:11px; color:#64748b;">示例名单：${list.slice(0, 8).map(s => `${esc(s.name)}(${esc(s.class)})`).join('、')}${list.length > 8 ? ' …' : ''}</div>
                </div>`;
        });
        container.innerHTML = html || '暂无聚类结果';
    }

    function kmeans(data, k = 4, maxIter = 10) {
        if (!data.length) return { labels: [], centroids: [] };
        const dim = data[0].length;
        const centroids = [];
        const used = new Set();
        while (centroids.length < k && used.size < data.length) {
            const idx = Math.floor(Math.random() * data.length);
            if (!used.has(idx)) { used.add(idx); centroids.push([...data[idx]]); }
        }
        const labels = new Array(data.length).fill(0);

        for (let iter = 0; iter < maxIter; iter++) {
            for (let i = 0; i < data.length; i++) {
                let best = 0, bestDist = Infinity;
                for (let c = 0; c < centroids.length; c++) {
                    const dist = euclid(data[i], centroids[c]);
                    if (dist < bestDist) { bestDist = dist; best = c; }
                }
                labels[i] = best;
            }
            const sums = Array.from({ length: centroids.length }, () => new Array(dim).fill(0));
            const counts = new Array(centroids.length).fill(0);
            for (let i = 0; i < data.length; i++) {
                const c = labels[i];
                counts[c]++;
                for (let d = 0; d < dim; d++) sums[c][d] += data[i][d];
            }
            for (let c = 0; c < centroids.length; c++) {
                if (counts[c] === 0) continue;
                for (let d = 0; d < dim; d++) centroids[c][d] = sums[c][d] / counts[c];
            }
        }
        return { labels, centroids };
    }

    function euclid(a, b) {
        let s = 0;
        for (let i = 0; i < a.length; i++) s += Math.pow(a[i] - b[i], 2);
        return Math.sqrt(s);
    }

    function SB_exportExcel() {
        if (!SB_CACHE_DATA.length) return showAlert("请先生成分析数据");
        if (typeof root.XLSX === 'undefined') return showAlert("导出组件尚未加载完成，请稍后重试。");

        const wb = root.XLSX.utils.book_new();
        const headers = ["班级", "姓名", "总分", "全镇排名", "最强学科", "最强分差", "最弱学科", "最弱分差"];

        getSubjects().forEach(s => headers.push(`${s}分差`));

        const data = [headers];

        SB_CACHE_DATA.forEach(r => {
            const strong = r.items[0];
            const weak = r.items[r.items.length - 1];

            const row = [
                r.class, r.name, r.total, r.rank,
                strong.sub, `+${strong.diff.toFixed(1)}`,
                weak.sub, weak.diff.toFixed(1)
            ];

            getSubjects().forEach(s => {
                const item = r.items.find(i => i.sub === s);
                row.push(item ? item.diff.toFixed(1) : '-');
            });

            data.push(row);
        });

        const ws = root.XLSX.utils.aoa_to_sheet(data);
        root.XLSX.utils.book_append_sheet(wb, ws, "学生优劣势分析");
        root.XLSX.writeFile(wb, `优劣势学科分析_${root.document.getElementById('sbSchoolSelect').value}.xlsx`);
    }

    // 回挂到 window，供 HTML onclick（SB_renderTable/SB_runCluster/SB_exportExcel）
    // 与 module-entry-runtime 的 updateSubjectBalanceSelects 调用。
    root.updateSubjectBalanceSelects = updateSubjectBalanceSelects;
    root.SB_renderTable = SB_renderTable;
    root.SB_getGradeStats = SB_getGradeStats;
    root.SB_runCluster = SB_runCluster;
    root.SB_renderClusterResults = SB_renderClusterResults;
    root.SB_exportExcel = SB_exportExcel;
    root.SubjectBalanceRuntime = {
        updateSubjectBalanceSelects,
        renderTable: SB_renderTable,
        runCluster: SB_runCluster,
        exportExcel: SB_exportExcel
    };
})(typeof window !== 'undefined' ? window : globalThis);
