/*
 * 质量分析会一键工具箱（quality-meeting-kit）按需运行时模块
 *
 * 视觉与交互设计遵循澄见（school-system）极简克制风格，完整适配浅色与深色模式：
 * 1. 「质量分析会 PPT 工作室」：左栏配置（自定义标题/汇报人/配色主题/页签勾选）+ 右栏 16:9 实时幻灯片预览器 + 纯前端 JSZip 生成标准 .pptx
 * 2. 「教师分析手册（Excel）」：按任课教师聚合多班两率一分、排名及分学科临界生名单
 * 3. 「本校班级插入全镇学校对标 & 临界生速览」：4 张 KPI 卡 + 表头点击排序 + 横向数据条 + 金/银/铜内联排名徽章 + 自定义容差/按班筛选临界生芯片 + 导出对标 Excel
 *
 * 零内联 on* 事件，全部通过 addEventListener 绑定，满足严格 CSP。
 */
(function (root) {
    if (!root || root.__QUALITY_MEETING_KIT_PATCHED__) return;

    const DEFAULT_EXC_PCT = 0.15;
    const DEFAULT_PASS_PCT = 0.50;
    const DEFAULT_MARGIN = 10;

    const PPT_THEMES = {
        editorial: { name: '澄见极简', bg: '0F1419', accent: '1D9BF0', tblHead: '0F1419', soft: 'F7F9F9', rowTint: 'EFF6FF', text: '0F1419' },
        navy: { name: '商务深蓝', bg: '0F172A', accent: '2563EB', tblHead: '1E3A8A', soft: 'F8FAFC', rowTint: 'DBEAFE', text: '0F172A' },
        emerald: { name: '教研墨绿', bg: '064E3B', accent: '0D9488', tblHead: '0F766E', soft: 'F0FDFA', rowTint: 'CCFBF1', text: '0F172A' }
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
        return String(a || '').trim() === String(b || '').trim();
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

    function getSubjects(rows) {
        if (Array.isArray(root.SUBJECTS) && root.SUBJECTS.length) return root.SUBJECTS.filter(Boolean);
        const set = new Set();
        (rows || []).forEach((r) => Object.keys(r?.scores || {}).forEach((s) => set.add(s)));
        return Array.from(set);
    }

    function getStudentScore(student, subject) {
        if (!student) return NaN;
        if (!subject || subject === '总分') {
            const total = Number(student.total);
            return Number.isFinite(total) ? total : NaN;
        }
        const val = student.scores ? Number(student.scores[subject]) : NaN;
        return Number.isFinite(val) ? val : NaN;
    }

    function quantileCutoff(sortedDesc, ratio) {
        if (!sortedDesc.length) return 0;
        const idx = Math.min(sortedDesc.length - 1, Math.max(0, Math.floor(sortedDesc.length * ratio) - 1));
        return Number(sortedDesc[idx].toFixed(1));
    }

    function computeThresholdForSubject(rows, subject) {
        const scores = (rows || [])
            .map((r) => getStudentScore(r, subject))
            .filter((v) => Number.isFinite(v) && v >= 0)
            .sort((a, b) => b - a);
        if (!scores.length) return { exc: 0, pass: 0, count: 0 };
        return {
            exc: quantileCutoff(scores, DEFAULT_EXC_PCT),
            pass: quantileCutoff(scores, DEFAULT_PASS_PCT),
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

    function calcGroupMetrics(rows, subject, threshold) {
        const vals = (rows || []).map((r) => getStudentScore(r, subject)).filter((v) => Number.isFinite(v));
        const count = vals.length;
        if (!count) return { count: 0, avg: 0, excCount: 0, passCount: 0, excRate: 0, passRate: 0, score: 0 };
        const sum = vals.reduce((acc, v) => acc + v, 0);
        const avg = sum / count;
        const excCount = vals.filter((v) => v >= (threshold?.exc || 0)).length;
        const passCount = vals.filter((v) => v >= (threshold?.pass || 0)).length;
        const excRate = excCount / count;
        const passRate = passCount / count;
        return {
            count,
            avg: Number(avg.toFixed(2)),
            excCount,
            passCount,
            excRate: Number((excRate * 100).toFixed(1)),
            passRate: Number((passRate * 100).toFixed(1)),
            score: Number((avg * 0.6 + excRate * 100 * 0.2 + passRate * 100 * 0.2).toFixed(2))
        };
    }

    function assignRanks(items, key) {
        const sorted = items.slice().sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));
        const rankMap = new Map();
        sorted.forEach((item, idx) => {
            if (idx > 0 && Number(item[key]) === Number(sorted[idx - 1][key])) {
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

    function buildClassRows(mySchoolRows, subject, threshold) {
        const byClass = new Map();
        (mySchoolRows || []).forEach((r) => {
            const cls = String(r?.class || '未分班').trim() || '未分班';
            if (!byClass.has(cls)) byClass.set(cls, []);
            byClass.get(cls).push(r);
        });
        const items = Array.from(byClass.entries()).map(([cls, list]) => ({
            name: cls,
            ...calcGroupMetrics(list, subject, threshold)
        }));
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

    function buildClassTownshipBenchmark(allRows, mySchool, subject, threshold) {
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

    function buildTeacherHandbookRows(mySchoolRows, subjects, teacherMap, thresholdsMap) {
        const map = teacherMap && typeof teacherMap === 'object' ? teacherMap : {};
        const byClass = new Map();
        (mySchoolRows || []).forEach((r) => {
            const cls = String(r?.class || '').trim();
            if (!cls) return;
            if (!byClass.has(cls)) byClass.set(cls, []);
            byClass.get(cls).push(r);
        });
        const grouped = new Map();
        Object.entries(map).forEach(([key, teacherName]) => {
            const parts = String(key || '').split('_');
            if (parts.length < 2) return;
            const cls = String(parts[0] || '').trim();
            const subj = parts.slice(1).join('_').trim();
            const teacher = String(teacherName || '').trim();
            if (!cls || !subj || !teacher || !byClass.has(cls)) return;
            if (subjects && subjects.length && !subjects.includes(subj)) return;
            const gKey = `${subj}::${teacher}`;
            if (!grouped.has(gKey)) grouped.set(gKey, { teacher, subject: subj, classes: [], students: [] });
            const entry = grouped.get(gKey);
            if (!entry.classes.includes(cls)) {
                entry.classes.push(cls);
                entry.students.push(...byClass.get(cls));
            }
        });
        const rows = Array.from(grouped.values()).map((entry) => {
            const threshold = thresholdsMap?.[entry.subject] || { exc: 0, pass: 0 };
            return {
                teacher: entry.teacher,
                subject: entry.subject,
                classes: entry.classes.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')),
                ...calcGroupMetrics(entry.students, entry.subject, threshold)
            };
        });
        const bySubject = new Map();
        rows.forEach((r) => {
            if (!bySubject.has(r.subject)) bySubject.set(r.subject, []);
            bySubject.get(r.subject).push(r);
        });
        const ranked = [];
        bySubject.forEach((list) => {
            const rAvg = assignRanks(list, 'avg');
            const rExc = assignRanks(list, 'excRate');
            const rPass = assignRanks(list, 'passRate');
            const rScore = assignRanks(list, 'score');
            list.forEach((item) => {
                ranked.push({
                    ...item,
                    avgRank: rAvg.get(item),
                    excRank: rExc.get(item),
                    passRank: rPass.get(item),
                    scoreRank: rScore.get(item)
                });
            });
        });
        return ranked.sort((a, b) => {
            const sCmp = (subjects || []).indexOf(a.subject) - (subjects || []).indexOf(b.subject);
            return sCmp !== 0 ? sCmp : a.scoreRank - b.scoreRank;
        });
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
                score: Number(val.toFixed(1))
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

    function buildSmartDiagnostics(overall, classRows, subjectOverview, totalBorderline) {
        const bullets = [];
        bullets.push(`总体：本次参评 ${overall.count} 人，平均分 ${overall.avg}，优秀率 ${overall.excRate}%，及格率 ${overall.passRate}%。`);
        if (classRows.length >= 2) {
            const top = classRows[0];
            const bottom = classRows[classRows.length - 1];
            const diff = (top.avg - bottom.avg).toFixed(1);
            bullets.push(`班级：${top.name} 综合领先（均分 ${top.avg}，优秀率 ${top.excRate}%），${bottom.name} 相对薄弱（均分 ${bottom.avg}），班际均分极差 ${diff} 分。`);
        }
        if (subjectOverview.length >= 2) {
            const bestPass = subjectOverview.slice().sort((a, b) => b.passRate - a.passRate)[0];
            const lowPass = subjectOverview.slice().sort((a, b) => a.passRate - b.passRate)[0];
            bullets.push(`学科：${bestPass.subject} 及格率最高（${bestPass.passRate}%，均分 ${bestPass.avg}），${lowPass.subject} 及格率偏低（${lowPass.passRate}%，均分 ${lowPass.avg}），建议重点复盘。`);
        }
        bullets.push(`临界生：总分优秀边缘生 ${totalBorderline.excMarginal.length} 人、及格边缘生 ${totalBorderline.passMarginal.length} 人，建议会后按班按科直接分配包保教师盯紧提分。`);
        return bullets;
    }

    // -------------------------------------------------------------------------
    // Structured Deck Model (drives BOTH live 16:9 HTML preview AND OOXML .pptx)
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

    function buildMeetingDeckModel(options = {}) {
        const allRows = options.allRows || getAllRows();
        if (!allRows.length) throw new Error('暂无成绩数据，请先导入数据');
        const mySchool = options.mySchool || getMySchoolName(allRows);
        const mySchoolRows = allRows.filter((r) => sameSchool(r?.school, mySchool));
        const activeRows = mySchoolRows.length ? mySchoolRows : allRows;
        const subjects = options.subjects || getSubjects(allRows);
        const examTitle = options.examTitle || getExamTitle();
        const presenter = String(options.presenter || `${mySchool}教务处`).trim();
        const themeKey = PPT_THEMES[options.theme] ? options.theme : 'editorial';
        const theme = PPT_THEMES[themeKey];
        const useTownshipLine = options.useTownshipLine !== false;
        const thresholdInfo = resolveThresholds(allRows, activeRows, subjects, useTownshipLine);
        const teacherMap = options.teacherMap || root.TEACHER_MAP || {};
        const include = {
            overview: true,
            classRank: true,
            townBenchmark: true,
            subjects: true,
            charts: true,
            borderline: true,
            ...(options.include || {})
        };

        const overall = calcGroupMetrics(activeRows, '总分', thresholdInfo.thresholds['总分']);
        const classRows = buildClassRows(activeRows, '总分', thresholdInfo.thresholds['总分']);
        const subjectOverview = subjects.map((subj) => ({
            subject: subj,
            ...calcGroupMetrics(activeRows, subj, thresholdInfo.thresholds[subj])
        }));
        const totalBorderline = buildBorderlineChips(activeRows, '总分', thresholdInfo.thresholds['总分']);
        const diagnostics = buildSmartDiagnostics(overall, classRows, subjectOverview, totalBorderline);
        const teacherRows = buildTeacherHandbookRows(activeRows, subjects, teacherMap, thresholdInfo.thresholds);
        const modeLabel = thresholdInfo.source === 'township'
            ? `已套用全镇划线（${thresholdInfo.schoolCount}校 · 共${allRows.length}人）`
            : `本校模式（共${activeRows.length}人）`;

        const slides = [];
        slides.push({
            kind: 'cover',
            title: `${examTitle} · 教学质量分析会`,
            subtitle: `${presenter}  |  ${modeLabel}`,
            meta: `总分优秀线 ${thresholdInfo.thresholds['总分'].exc}  ·  及格线 ${thresholdInfo.thresholds['总分'].pass}  ·  ${new Date().toISOString().slice(0, 10)}`
        });

        if (include.overview) {
            slides.push({
                kind: 'overview',
                title: '总体概览与核心诊断',
                subtitle: `${mySchool} · ${modeLabel}`,
                kpis: [
                    { label: '参评人数', val: `${overall.count} 人`, color: '0F766E' },
                    { label: '年级平均分', val: `${overall.avg}`, color: '1D4ED8' },
                    { label: '优秀率', val: `${overall.excRate}%`, color: '7C3AED' },
                    { label: '及格率', val: `${overall.passRate}%`, color: 'B45309' }
                ],
                diagnostics
            });
        }

        if (include.classRank && classRows.length) {
            slides.push({
                kind: 'table',
                title: '班级总分对标排名',
                subtitle: `${mySchool} 各班两率一分与单项排名（# 为单项名次）`,
                headers: ['班级', '人数', '均分', '优秀率', '及格率', '综合得分'],
                rows: classRows.slice(0, 14).map((c) => ({
                    isEmph: c.scoreRank === 1,
                    cells: [c.name, String(c.count), `${c.avg} (#${c.avgRank})`, `${c.excRate}% (#${c.excRank})`, `${c.passRate}% (#${c.passRank})`, `${c.score} (#${c.scoreRank})`]
                }))
            });
        }

        if (include.townBenchmark && thresholdInfo.hasTownship) {
            const bench = buildClassTownshipBenchmark(allRows, mySchool, '总分', thresholdInfo.thresholds['总分']);
            slides.push({
                kind: 'table',
                title: '本校班级插入全镇学校对标',
                subtitle: '★ 本校班级分别与全镇各外校同台排名（本校班级间不互比）',
                headers: ['班级 / 学校', '人数', '均分', '优秀率', '及格率', '综合得分'],
                rows: bench.slice(0, 15).map((r) => ({
                    isEmph: r.kind === 'own-class',
                    cells: [r.kind === 'own-class' ? `★ ${r.name}` : `${r.name} (外校)`, String(r.count), `${r.avg} (#${r.avgRank})`, `${r.excRate}% (#${r.excRank})`, `${r.passRate}% (#${r.passRank})`, `${r.score}`]
                }))
            });
        }

        if (include.subjects) {
            subjects.forEach((subj) => {
                const th = thresholdInfo.thresholds[subj] || { exc: 0, pass: 0 };
                const subjTeachers = teacherRows.filter((t) => t.subject === subj);
                const subjClasses = buildClassRows(activeRows, subj, th);
                const useTeacher = subjTeachers.length > 0;
                const border = buildBorderlineChips(activeRows, subj, th);
                slides.push({
                    kind: 'table',
                    title: `分学科质量分析 · ${subj}`,
                    subtitle: useTeacher ? '按任课教师聚合两率一分与单项排名' : '按班级统计两率一分与单项排名',
                    headers: useTeacher ? ['任课教师', '任教班级', '人数', '均分', '优秀率', '及格率'] : ['班级', '人数', '均分', '优秀率', '及格率', '综合得分'],
                    rows: useTeacher
                        ? subjTeachers.slice(0, 12).map((t) => ({ isEmph: t.scoreRank === 1, cells: [t.teacher, t.classes.join('、'), String(t.count), `${t.avg} (#${t.avgRank})`, `${t.excRate}% (#${t.excRank})`, `${t.passRate}% (#${t.passRank})`] }))
                        : subjClasses.slice(0, 12).map((c) => ({ isEmph: c.scoreRank === 1, cells: [c.name, String(c.count), `${c.avg} (#${c.avgRank})`, `${c.excRate}% (#${c.excRank})`, `${c.passRate}% (#${c.passRank})`, `${c.score}`] })),
                    footerNote: `优秀线 ${th.exc} · 及格线 ${th.pass} | 优秀边缘 ${border.excMarginal.length} 人：${border.excMarginal.slice(0, 6).map((s) => `${s.name}(${s.score})`).join('、') || '无'}`
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
                title: '重点临界生抓手清单',
                subtitle: `总分优秀线 ${totalBorderline.exc}（±${totalBorderline.margin}分） / 及格线 ${totalBorderline.pass}（±${totalBorderline.margin}分）`,
                excTitle: `优秀边缘生（共 ${totalBorderline.excMarginal.length} 人，冲刺优秀线）`,
                excNames: totalBorderline.excMarginal.slice(0, 18).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '暂无',
                passTitle: `及格边缘生（共 ${totalBorderline.passMarginal.length} 人，守住及格线）`,
                passNames: totalBorderline.passMarginal.slice(0, 18).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '暂无'
            });
        }

        slides.push({
            kind: 'closing',
            title: '感谢聆听 · 聚力提质',
            subtitle: `${presenter}  ·  ${examTitle}`
        });

        return { slides, theme, themeKey, examTitle, presenter, mySchool, thresholdInfo, activeRowsCount: activeRows.length, allRowsCount: allRows.length, subjects };
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

    function pptRect(id, x, y, cx, cy, fillHex) {
        return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Rect ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fillHex}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>`;
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
<p:txBody><a:bodyPr wrap="square" lIns="60000" tIns="40000" rIns="60000" bIns="40000"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
    }

    function pptTable(id, x, y, cx, cy, headers, rows, theme) {
        const colCount = Math.max(1, headers.length);
        const colW = Math.floor(cx / colCount);
        const rowH = Math.min(350000, Math.floor(cy / Math.max(2, rows.length + 1)));
        const gridCols = headers.map(() => `<a:gridCol w="${colW}"/>`).join('');
        const makeRow = (cells, isHeader, rowIdx, isEmph) => {
            const fill = isHeader ? theme.tblHead : (isEmph ? theme.rowTint : (rowIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF'));
            const txtColor = isHeader ? 'FFFFFF' : '0F1419';
            const bold = (isHeader || isEmph) ? ' b="1"' : '';
            const tcs = cells.map((cell) => `<a:tc><a:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="zh-CN" sz="${isHeader ? 1200 : 1100}"${bold}><a:solidFill><a:srgbClr val="${txtColor}"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:rPr><a:t>${escXml(cell)}</a:t></a:r></a:p></a:txBody><a:tcPr><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill></a:tcPr></a:tc>`).join('');
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

    async function buildMeetingPptxBlob(options = {}) {
        const JSZipCtor = options.JSZip || root.JSZip;
        if (!JSZipCtor) throw new Error('JSZip 未加载，无法生成 PPT');
        const deck = buildMeetingDeckModel(options);
        const { theme, examTitle, presenter } = deck;
        const totalSlides = deck.slides.length;

        const headerBand = (title, subtitle, pageNo) => (
            pptRect(2, 0, 0, 12192000, 1020000, theme.bg) +
            pptRect(3, 0, 995000, 12192000, 42000, theme.accent) +
            pptTextBox(4, 480000, 160000, 10400000, 440000, title, { fontSize: 23, bold: true, color: 'FFFFFF' }) +
            pptTextBox(5, 480000, 590000, 10400000, 320000, subtitle, { fontSize: 12.5, color: '94A3B8' }) +
            pptTextBox(98, 480000, 6480000, 9200000, 280000, `${presenter} · ${examTitle}`, { fontSize: 10, color: '94A3B8' }) +
            pptTextBox(99, 10400000, 6480000, 1300000, 280000, `${pageNo} / ${totalSlides}`, { fontSize: 10, color: '64748B', align: 'r' })
        );

        const builtSlides = deck.slides.map((s, idx) => {
            const pageNo = idx + 1;
            if (s.kind === 'cover') {
                return {
                    xml: xmlSlideShell(
                        pptRect(2, 0, 0, 12192000, 6858000, theme.bg) +
                        pptRect(3, 720000, 1520000, 920000, 75000, theme.accent) +
                        pptTextBox(4, 720000, 1800000, 10750000, 1000000, s.title, { fontSize: 34, bold: true, color: 'FFFFFF' }) +
                        pptTextBox(5, 720000, 2950000, 10750000, 600000, s.subtitle, { fontSize: 18, color: '93C5FD' }) +
                        pptTextBox(6, 720000, 4200000, 10750000, 500000, s.meta, { fontSize: 13.5, color: 'CBD5E1' })
                    ),
                    images: []
                };
            }
            if (s.kind === 'overview') {
                const kpiCards = s.kpis.map((k, kIdx) => {
                    const x = 480000 + kIdx * 2850000;
                    const base = 10 + kIdx * 3;
                    return pptRect(base, x, 1280000, 2650000, 1150000, theme.soft) +
                        pptTextBox(base + 1, x + 140000, 1400000, 2350000, 320000, k.label, { fontSize: 13, color: '64748B' }) +
                        pptTextBox(base + 2, x + 140000, 1760000, 2350000, 520000, k.val, { fontSize: 28, bold: true, color: k.color });
                }).join('');
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        kpiCards +
                        pptRect(30, 480000, 2680000, 11230000, 3550000, theme.soft) +
                        pptTextBox(31, 660000, 2820000, 10800000, 380000, '智能诊断要点', { fontSize: 16, bold: true, color: theme.tblHead }) +
                        pptTextBox(32, 660000, 3300000, 10800000, 2750000, s.diagnostics.map((d, i) => `${i + 1}. ${d}`), { fontSize: 14, color: theme.text })
                    ),
                    images: []
                };
            }
            if (s.kind === 'table') {
                const tableH = s.footerNote ? 4400000 : 5000000;
                const noteXml = s.footerNote ? pptTextBox(11, 480000, 5780000, 11230000, 620000, s.footerNote, { fontSize: 12, color: '475569' }) : '';
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptTable(10, 480000, 1260000, 11230000, tableH, s.headers, s.rows, theme) +
                        noteXml
                    ),
                    images: []
                };
            }
            if (s.kind === 'charts') {
                const pics = (s.images || []).map((img, i) => {
                    const w = s.images.length === 1 ? 9600000 : 5400000;
                    const x = s.images.length === 1 ? 1296000 : (480000 + i * 5800000);
                    return pptPicture(20 + i, `rIdImg${i + 1}`, x, 1380000, w, 4750000);
                }).join('');
                return { xml: xmlSlideShell(headerBand(s.title, s.subtitle, pageNo) + pics), images: s.images || [] };
            }
            if (s.kind === 'borderline') {
                return {
                    xml: xmlSlideShell(
                        headerBand(s.title, s.subtitle, pageNo) +
                        pptRect(10, 480000, 1300000, 11230000, 2320000, 'EFF6FF') +
                        pptTextBox(11, 660000, 1420000, 10850000, 380000, s.excTitle, { fontSize: 15, bold: true, color: '1D4ED8' }) +
                        pptTextBox(12, 660000, 1860000, 10850000, 1620000, s.excNames, { fontSize: 12, color: '0F1419' }) +
                        pptRect(13, 480000, 3860000, 11230000, 2320000, 'FFFBEB') +
                        pptTextBox(14, 660000, 3980000, 10850000, 380000, s.passTitle, { fontSize: 15, bold: true, color: 'B45309' }) +
                        pptTextBox(15, 660000, 4420000, 10850000, 1620000, s.passNames, { fontSize: 12, color: '0F1419' })
                    ),
                    images: []
                };
            }
            return {
                xml: xmlSlideShell(
                    pptRect(2, 0, 0, 12192000, 6858000, theme.bg) +
                    pptTextBox(4, 1200000, 2550000, 9792000, 900000, s.title, { fontSize: 34, bold: true, color: 'FFFFFF', align: 'ctr' }) +
                    pptTextBox(5, 1200000, 3650000, 9792000, 500000, s.subtitle, { fontSize: 16, color: '94A3B8', align: 'ctr' })
                ),
                images: []
            };
        });

        const zip = new JSZipCtor();
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
${slideOverrides}
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

        let imgCounter = 0;
        builtSlides.forEach((slide, idx) => {
            const slideNo = idx + 1;
            zip.file(`ppt/slides/slide${slideNo}.xml`, slide.xml);
            const imgRels = (slide.images || []).map((img, i) => {
                imgCounter += 1;
                const mediaName = `chart${imgCounter}.png`;
                zip.file(`ppt/media/${mediaName}`, img.base64, { base64: true });
                return `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaName}"/>`;
            }).join('');
            zip.file(`ppt/slides/_rels/slide${slideNo}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
${imgRels}
</Relationships>`);
        });

        const payload = await zip.generateAsync({ type: options.outputType || 'blob', compression: 'DEFLATE' });
        return {
            payload,
            slideCount: builtSlides.length,
            fileName: `质量分析会_${examTitle.replace(/[\\/:*?"<>|]/g, '_')}.pptx`
        };
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
        const mySchool = options.mySchool || getMySchoolName(allRows);
        const mySchoolRows = allRows.filter((r) => sameSchool(r?.school, mySchool));
        const activeRows = mySchoolRows.length ? mySchoolRows : allRows;
        const subjects = options.subjects || getSubjects(allRows);
        const examTitle = options.examTitle || getExamTitle();
        const thInfo = resolveThresholds(allRows, activeRows, subjects, options.useTownshipLine !== false);
        const teacherRows = buildTeacherHandbookRows(activeRows, subjects, options.teacherMap || root.TEACHER_MAP || {}, thInfo.thresholds);
        const classRows = buildClassRows(activeRows, '总分', thInfo.thresholds['总分']);

        const wb = XLSX.utils.book_new();
        const sheet1Data = [
            ['学科', '任课教师', '所教班级', '参评人数', '平均分', '均分排名', '优秀率(%)', '优率排名', '及格率(%)', '及格排名', '综合得分', '综合排名'],
            ...teacherRows.map((r) => [r.subject, r.teacher, r.classes.join('、'), r.count, r.avg, r.avgRank, r.excRate, r.excRank, r.passRate, r.passRank, r.score, r.scoreRank])
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
        if (typeof root.decorateExcelSheet === 'function') root.decorateExcelSheet(ws1, sheet1Data[0]);
        XLSX.utils.book_append_sheet(wb, ws1, '教师任教汇总');

        const sheet2Data = [
            ['班级', '参评人数', '平均分', '均分排名', '优秀率(%)', '优率排名', '及格率(%)', '及格排名', '综合得分', '综合排名'],
            ...classRows.map((c) => [c.name, c.count, c.avg, c.avgRank, c.excRate, c.excRank, c.passRate, c.passRank, c.score, c.scoreRank])
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
        if (typeof root.decorateExcelSheet === 'function') root.decorateExcelSheet(ws2, sheet2Data[0]);
        XLSX.utils.book_append_sheet(wb, ws2, '班级总分排名');

        const borderRows = [['学科', '类型', '姓名', '班级', '分数', '对应分数线']];
        ['总分', ...subjects].forEach((subj) => {
            const b = buildBorderlineChips(activeRows, subj, thInfo.thresholds[subj]);
            b.excMarginal.forEach((s) => borderRows.push([subj, '优秀边缘生', s.name, s.class, s.score, b.exc]));
            b.passMarginal.forEach((s) => borderRows.push([subj, '及格边缘生', s.name, s.class, s.score, b.pass]));
        });
        const ws3 = XLSX.utils.aoa_to_sheet(borderRows);
        if (typeof root.decorateExcelSheet === 'function') root.decorateExcelSheet(ws3, borderRows[0]);
        XLSX.utils.book_append_sheet(wb, ws3, '分学科临界生名单');

        const fileName = `教师分析手册_${examTitle.replace(/[\\/:*?"<>|]/g, '_')}.xlsx`;
        if (!options.dryRun) XLSX.writeFile(wb, fileName);
        toast(`已导出 ${fileName}`, 'success');
        return { ok: true, fileName, teacherCount: teacherRows.length, classCount: classRows.length };
    }

    function exportBenchmarkExcel(benchRows, subject, examTitle) {
        const XLSX = root.XLSX;
        if (!XLSX?.utils) {
            toast('Excel 导出组件未就绪', 'error');
            return false;
        }
        const wb = XLSX.utils.book_new();
        const aoa = [
            ['班级 / 学校', '类型', '参评人数', '平均分', '均分排名', '优秀率(%)', '优率排名', '及格率(%)', '及格排名', '综合得分', '综合排名'],
            ...benchRows.map((r) => [r.name, r.kind === 'own-class' ? '本校班级' : '外校', r.count, r.avg, r.avgRank, r.excRate, r.excRank, r.passRate, r.passRank, r.score, r.scoreRank])
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        if (typeof root.decorateExcelSheet === 'function') root.decorateExcelSheet(ws, aoa[0]);
        XLSX.utils.book_append_sheet(wb, ws, `${subject}镇域对标`);
        const fileName = `班级镇域对标_${subject}_${examTitle.replace(/[\\/:*?"<>|]/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast(`已导出 ${fileName}`, 'success');
        return true;
    }

    // -------------------------------------------------------------------------
    // Refined Scoped Styles (Editorial Minimalism + Full Dark-Mode Support)
    // -------------------------------------------------------------------------
    function ensureStyles() {
        const doc = root.document;
        if (!doc || doc.getElementById('qmk-style')) return;
        const style = doc.createElement('style');
        style.id = 'qmk-style';
        style.textContent = `
.qmk-mask{position:fixed;inset:0;background:rgba(15,20,25,.48);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
.qmk-dialog{background:var(--bg-card,#fff);color:var(--color-data,#0f1419);border:1px solid var(--border,#e5e7eb);border-radius:18px;width:min(1140px,96vw);max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(15,20,25,.18);overflow:hidden}
.qmk-head{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--border,#eff3f4);background:var(--bg-card,#fff)}
.qmk-head-meta{display:grid;gap:2px}
.qmk-head h3{margin:0;font-size:17px;font-weight:700;letter-spacing:-.01em}
.qmk-head p{margin:0;font-size:12.5px;color:var(--secondary,#536471)}
.qmk-close{width:34px;height:34px;border-radius:999px;border:1px solid var(--border,#e5e7eb);background:transparent;color:var(--secondary,#536471);font-size:18px;cursor:pointer;display:grid;place-items:center;transition:background .15s}
.qmk-close:hover{background:var(--primary-light,#eff3f4);color:var(--color-data,#0f1419)}
.qmk-body{padding:20px 24px;overflow:auto;display:grid;gap:16px;background:var(--bg-body,#f7f9f9)}
.qmk-studio{display:grid;grid-template-columns:340px minmax(0,1fr);gap:18px;align-items:start}
@media(max-width:860px){.qmk-studio{grid-template-columns:1fr}}
.qmk-panel{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:16px;display:grid;gap:12px}
.qmk-label{display:grid;gap:5px;font-size:12px;font-weight:600;color:var(--secondary,#536471)}
.qmk-input{padding:8px 11px;border:1px solid var(--border,#d1d5db);border-radius:10px;background:var(--bg-card,#fff);color:var(--color-data,#0f1419);font-size:13px;outline:none}
.qmk-input:focus{border-color:#1d9bf0}
.qmk-theme-row{display:flex;gap:8px;flex-wrap:wrap}
.qmk-swatch{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid var(--border,#d1d5db);background:var(--bg-card,#fff);color:var(--color-data,#0f1419);font-size:12px;cursor:pointer}
.qmk-swatch.is-active{border-color:#1d9bf0;box-shadow:0 0 0 2px rgba(29,155,240,.18);font-weight:600}
.qmk-dot{width:10px;height:10px;border-radius:999px;display:inline-block}
.qmk-check-list{display:grid;gap:6px}
.qmk-check-item{display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid var(--border,#e5e7eb);border-radius:10px;background:var(--bg-body,#f7f9f9);font-size:12.5px;cursor:pointer;transition:border-color .15s}
.qmk-check-item:hover{border-color:#94a3b8}
.qmk-stage-wrap{display:grid;gap:12px}
.qmk-stage{aspect-ratio:16/9;width:100%;border-radius:14px;overflow:hidden;border:1px solid var(--border,#dbe2e8);background:#fff;box-shadow:0 12px 32px rgba(15,20,25,.08);display:flex;flex-direction:column;color:#0f1419}
.qmk-stage-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.qmk-thumbs{display:flex;gap:6px;flex-wrap:wrap}
.qmk-thumb{padding:4px 10px;border-radius:999px;border:1px solid var(--border,#d1d5db);background:var(--bg-card,#fff);color:var(--secondary,#536471);font-size:12px;cursor:pointer}
.qmk-thumb.is-active{background:var(--primary,#0f1419);color:var(--bg-card,#fff);border-color:var(--primary,#0f1419)}
.qmk-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:720px){.qmk-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
.qmk-kpi{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:14px 16px;display:grid;gap:4px}
.qmk-kpi span{font-size:12px;color:var(--secondary,#536471)}
.qmk-kpi strong{font-size:22px;font-weight:700;letter-spacing:-.02em}
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
.qmk-tag-own{background:rgba(0,186,124,.14);color:#00875a}
.qmk-tag-ext{background:rgba(148,163,184,.16);color:var(--secondary,#536471)}
.qmk-chips-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
.qmk-chips-box{background:var(--bg-card,#fff);border:1px solid var(--border,#e5e7eb);border-radius:14px;padding:14px 16px;display:grid;gap:10px}
.qmk-chips-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;font-weight:600}
.qmk-chips{display:flex;flex-wrap:wrap;gap:6px}
.qmk-chip{padding:4px 10px;border-radius:999px;font-size:12px;border:1px solid var(--border,#e5e7eb);background:var(--bg-body,#f7f9f9)}
.qmk-chip-exc{background:rgba(29,155,240,.08);border-color:rgba(29,155,240,.25);color:#0369a1}
.qmk-chip-pass{background:rgba(245,158,11,.10);border-color:rgba(245,158,11,.30);color:#b45309}
.qmk-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 24px;border-top:1px solid var(--border,#eff3f4);background:var(--bg-card,#fff)}
body.dark-mode .qmk-chip-exc{color:#7dd3fc}
body.dark-mode .qmk-chip-pass{color:#fcd34d}
body.dark-mode .qmk-tag-own{color:#34d399}
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

    function renderSlidePreviewHtml(slide, theme, pageNo, total) {
        if (!slide) return '';
        if (slide.kind === 'cover' || slide.kind === 'closing') {
            return `<div style="flex:1;background:#${theme.bg};color:#fff;padding:8% 9%;display:flex;flex-direction:column;justify-content:center;gap:14px;${slide.kind === 'closing' ? 'align-items:center;text-align:center;' : ''}">
                ${slide.kind === 'cover' ? `<div style="width:52px;height:5px;border-radius:99px;background:#${theme.accent};"></div>` : ''}
                <div style="font-size:24px;font-weight:700;line-height:1.25;">${escHtml(slide.title)}</div>
                <div style="font-size:14px;color:#93c5fd;">${escHtml(slide.subtitle)}</div>
                ${slide.meta ? `<div style="font-size:12px;color:#cbd5e1;margin-top:8px;">${escHtml(slide.meta)}</div>` : ''}
            </div>`;
        }
        const headHtml = `<div style="background:#${theme.bg};color:#fff;padding:12px 20px;border-bottom:3px solid #${theme.accent};display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-size:16px;font-weight:700;">${escHtml(slide.title)}</div><div style="font-size:11px;color:#94a3b8;margin-top:2px;">${escHtml(slide.subtitle || '')}</div></div>
            <div style="font-size:11px;color:#94a3b8;">${pageNo} / ${total}</div>
        </div>`;
        if (slide.kind === 'overview') {
            return `${headHtml}<div style="flex:1;padding:16px 20px;display:grid;gap:12px;align-content:start;background:#fff;">
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                    ${slide.kpis.map((k) => `<div style="background:#${theme.soft};border-radius:10px;padding:10px 12px;border:1px solid #e2e8f0;"><div style="font-size:11px;color:#64748b;">${escHtml(k.label)}</div><div style="font-size:18px;font-weight:700;color:#${k.color};margin-top:3px;">${escHtml(k.val)}</div></div>`).join('')}
                </div>
                <div style="background:#${theme.soft};border-radius:10px;padding:12px 14px;border:1px solid #e2e8f0;font-size:12px;line-height:1.65;color:#1e293b;">
                    <div style="font-weight:700;color:#${theme.tblHead};margin-bottom:6px;">智能诊断要点</div>
                    ${slide.diagnostics.map((d, i) => `<div>${i + 1}. ${escHtml(d)}</div>`).join('')}
                </div>
            </div>`;
        }
        if (slide.kind === 'table') {
            return `${headHtml}<div style="flex:1;padding:12px 20px;overflow:hidden;display:flex;flex-direction:column;gap:8px;background:#fff;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead><tr>${slide.headers.map((h) => `<th style="background:#${theme.tblHead};color:#fff;padding:5px 6px;text-align:center;">${escHtml(h)}</th>`).join('')}</tr></thead>
                    <tbody>${slide.rows.slice(0, 8).map((r, i) => `<tr style="background:${r.isEmph ? `#${theme.rowTint};font-weight:600;` : (i % 2 ? '#f8fafc' : '#fff')}">${(r.cells || r).map((c) => `<td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">${escHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
                ${slide.footerNote ? `<div style="font-size:10.5px;color:#475569;">${escHtml(slide.footerNote)}</div>` : ''}
            </div>`;
        }
        if (slide.kind === 'charts') {
            return `${headHtml}<div style="flex:1;padding:14px 20px;display:flex;gap:12px;align-items:center;justify-content:center;background:#fff;">
                ${(slide.images || []).map((img) => `<img src="data:image/png;base64,${img.base64}" alt="${escHtml(img.title)}" style="max-height:100%;max-width:${slide.images.length > 1 ? '48%' : '92%'};object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;">`).join('')}
            </div>`;
        }
        return `${headHtml}<div style="flex:1;padding:14px 20px;display:grid;gap:10px;background:#fff;align-content:start;">
            <div style="background:#eff6ff;border-radius:10px;padding:10px 14px;font-size:11.5px;line-height:1.6;"><div style="font-weight:700;color:#1d4ed8;margin-bottom:4px;">${escHtml(slide.excTitle)}</div><div>${escHtml(slide.excNames)}</div></div>
            <div style="background:#fffbeb;border-radius:10px;padding:10px 14px;font-size:11.5px;line-height:1.6;"><div style="font-weight:700;color:#b45309;margin-bottom:4px;">${escHtml(slide.passTitle)}</div><div>${escHtml(slide.passNames)}</div></div>
        </div>`;
    }

    // -------------------------------------------------------------------------
    // UI Entry 1: Quality Analysis Meeting PPT Studio (Live 16:9 Preview)
    // -------------------------------------------------------------------------
    function openQualityMeetingPptModal() {
        const allRows = getAllRows();
        if (!allRows.length) {
            toast('请先上传成绩数据', 'error');
            return false;
        }
        const mySchool = getMySchoolName(allRows);
        const subjects = getSubjects(allRows);
        const state = {
            examTitle: getExamTitle(),
            presenter: `${mySchool}教务处`,
            theme: 'editorial',
            useTownshipLine: true,
            include: { overview: true, classRank: true, townBenchmark: true, subjects: true, charts: true, borderline: true },
            previewIdx: 0
        };
        const modal = createModalShell('qmk-ppt-modal', '质量分析会 PPT 课件工作室', '左侧自定义内容与配色，右侧实时预览 16:9 幻灯片，确认无误后一键导出标准 .pptx');

        const slideChecks = [
            { key: 'overview', label: '总体概览与 4 维智能诊断' },
            { key: 'classRank', label: '班级总分排名表（含单项名次）' },
            { key: 'townBenchmark', label: '本校班级插入全镇学校对标' },
            { key: 'subjects', label: `分学科逐科分析（${subjects.length} 科）` },
            { key: 'charts', label: '页面可视化图表快照' },
            { key: 'borderline', label: '重点临界生抓手清单' }
        ];

        function render() {
            const deck = buildMeetingDeckModel(state);
            if (state.previewIdx >= deck.slides.length) state.previewIdx = deck.slides.length - 1;
            const currentSlide = deck.slides[state.previewIdx];
            modal.body.innerHTML = `<div class="qmk-studio">
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
                            ${deck.slides.map((s, i) => `<button type="button" class="qmk-thumb ${i === state.previewIdx ? 'is-active' : ''}" data-qmk-page="${i}">${i + 1}. ${escHtml(s.title.slice(0, 7))}</button>`).join('')}
                        </div>
                        <div style="display:flex;gap:6px;">
                            <button type="button" class="qmk-tab" id="qmk-prev-slide" ${state.previewIdx <= 0 ? 'disabled' : ''}>上一页</button>
                            <button type="button" class="qmk-tab" id="qmk-next-slide" ${state.previewIdx >= deck.slides.length - 1 ? 'disabled' : ''}>下一页</button>
                        </div>
                    </div>
                </div>
            </div>`;

            modal.foot.innerHTML = `
                <span style="font-size:12.5px;color:var(--secondary,#536471);">标准 16:9 宽屏 .pptx，支持 PowerPoint / WPS 直接编辑</span>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" class="btn" id="qmk-btn-handbook">导出教师分析手册 (Excel)</button>
                    <button type="button" class="btn btn-green" id="qmk-btn-download-ppt">下载质量分析会 PPT（${deck.slides.length} 页）</button>
                </div>`;

            modal.body.querySelector('#qmk-ppt-title').addEventListener('change', (e) => { state.examTitle = e.target.value.trim() || getExamTitle(); render(); });
            modal.body.querySelector('#qmk-ppt-presenter').addEventListener('change', (e) => { state.presenter = e.target.value.trim() || `${mySchool}教务处`; render(); });
            modal.body.querySelectorAll('[data-qmk-theme]').forEach((btn) => btn.addEventListener('click', () => { state.theme = btn.dataset.qmkTheme; render(); }));
            modal.body.querySelector('#qmk-use-township-line').addEventListener('change', (e) => { state.useTownshipLine = e.target.checked; render(); });
            modal.body.querySelectorAll('[data-qmk-slide]').forEach((el) => el.addEventListener('change', () => { state.include[el.dataset.qmkSlide] = el.checked; render(); }));
            modal.body.querySelectorAll('[data-qmk-page]').forEach((btn) => btn.addEventListener('click', () => { state.previewIdx = Number(btn.dataset.qmkPage); render(); }));
            modal.body.querySelector('#qmk-prev-slide').addEventListener('click', () => { if (state.previewIdx > 0) { state.previewIdx -= 1; render(); } });
            modal.body.querySelector('#qmk-next-slide').addEventListener('click', () => { if (state.previewIdx < deck.slides.length - 1) { state.previewIdx += 1; render(); } });
            modal.foot.querySelector('#qmk-btn-handbook').addEventListener('click', () => exportTeacherAnalysisHandbookExcel({ useTownshipLine: state.useTownshipLine, examTitle: state.examTitle }));
            modal.foot.querySelector('#qmk-btn-download-ppt').addEventListener('click', async () => {
                try {
                    const result = await buildMeetingPptxBlob(state);
                    triggerDownloadBlob(result.payload, result.fileName);
                    toast(`已生成 ${result.slideCount} 页课件：${result.fileName}`, 'success');
                } catch (err) {
                    toast(`生成 PPT 失败：${err?.message || err}`, 'error');
                }
            });
        }
        render();
        return true;
    }

    // -------------------------------------------------------------------------
    // UI Entry 2: Class-vs-Township Benchmark + Interactive Borderline Chips
    // -------------------------------------------------------------------------
    function openClassTownshipBenchmarkModal() {
        const allRows = getAllRows();
        if (!allRows.length) {
            toast('请先上传成绩数据', 'error');
            return false;
        }
        const mySchool = getMySchoolName(allRows);
        const mySchoolRows = allRows.filter((r) => sameSchool(r?.school, mySchool));
        const activeRows = mySchoolRows.length ? mySchoolRows : allRows;
        const subjects = getSubjects(allRows);
        const ownClasses = Array.from(new Set(activeRows.map((r) => String(r?.class || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
        const modal = createModalShell('qmk-bench-modal', '本校班级全镇对标 & 临界生速览', '本校各班插入全镇外校榜单同台排名（点击表头可排序），下方实时联动临界生名单');

        let currentSubject = '总分';
        let useTownshipLine = true;
        let sortKey = 'score';
        let sortDir = -1;
        let margin = DEFAULT_MARGIN;
        let classFilter = '';

        function render() {
            const thInfo = resolveThresholds(allRows, activeRows, subjects, useTownshipLine);
            const th = thInfo.thresholds[currentSubject] || { exc: 0, pass: 0 };
            const overall = calcGroupMetrics(activeRows, currentSubject, th);
            const rawBench = thInfo.hasTownship
                ? buildClassTownshipBenchmark(allRows, mySchool, currentSubject, th)
                : buildClassRows(activeRows, currentSubject, th).map((c) => ({ ...c, kind: 'own-class' }));
            const benchRows = rawBench.slice().sort((a, b) => sortDir * ((Number(a[sortKey]) || 0) - (Number(b[sortKey]) || 0)));
            const maxAvg = Math.max(...benchRows.map((r) => Number(r.avg) || 0), 1);
            const filteredRowsForChips = classFilter ? activeRows.filter((r) => String(r?.class || '').trim() === classFilter) : activeRows;
            const chips = buildBorderlineChips(filteredRowsForChips, currentSubject, th, margin);
            const sortArrow = (k) => (sortKey === k ? (sortDir < 0 ? ' ↓' : ' ↑') : '');

            modal.body.innerHTML = `
                <div class="qmk-kpis">
                    <div class="qmk-kpi"><span>${escHtml(mySchool)} · ${escHtml(currentSubject)}参评</span><strong>${overall.count} 人</strong></div>
                    <div class="qmk-kpi"><span>本校平均分</span><strong style="color:#1d9bf0;">${overall.avg}</strong></div>
                    <div class="qmk-kpi"><span>优秀率（线 ${th.exc}）</span><strong style="color:#00ba7c;">${overall.excRate}%</strong></div>
                    <div class="qmk-kpi"><span>及格率（线 ${th.pass}）</span><strong style="color:#f59e0b;">${overall.passRate}%</strong></div>
                </div>
                <div class="qmk-bar">
                    <div class="qmk-tabs">
                        ${['总分', ...subjects].map((s) => `<button type="button" class="qmk-tab ${s === currentSubject ? 'is-active' : ''}" data-qmk-subj="${escHtml(s)}">${escHtml(s)}</button>`).join('')}
                    </div>
                    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:12.5px;">
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                            <input type="checkbox" id="qmk-bench-town-line" ${thInfo.source === 'township' ? 'checked' : ''} ${thInfo.hasTownship ? '' : 'disabled'}>
                            ${thInfo.source === 'township' ? '已套用乡镇线' : '校内划线'}
                        </label>
                        <button type="button" class="qmk-tab" id="qmk-export-bench">导出对标 Excel</button>
                    </div>
                </div>
                <div class="qmk-table-card">
                    <table class="qmk-table">
                        <thead><tr>
                            <th>班级 / 学校</th>
                            <th data-qmk-sort="count">人数${sortArrow('count')}</th>
                            <th data-qmk-sort="avg">均分${sortArrow('avg')}</th>
                            <th data-qmk-sort="excRate">优秀率${sortArrow('excRate')}</th>
                            <th data-qmk-sort="passRate">及格率${sortArrow('passRate')}</th>
                            <th data-qmk-sort="score">综合得分${sortArrow('score')}</th>
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
                </div>
                <div class="qmk-bar" style="padding:10px 14px;">
                    <div style="font-size:13px;font-weight:600;">${escHtml(currentSubject)} 临界生名单筛选</div>
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
                            <span>优秀边缘生（${(chips.exc - chips.margin).toFixed(1)}~${chips.exc}，${chips.excMarginal.length} 人）</span>
                            <button type="button" class="qmk-tab" data-qmk-copy="exc">一键复制</button>
                        </div>
                        <div class="qmk-chips">${chips.excMarginal.length ? chips.excMarginal.map((s) => `<span class="qmk-chip qmk-chip-exc">${escHtml(s.name)} · ${escHtml(s.class)} · ${s.score}</span>`).join('') : '<span style="color:var(--secondary,#64748b);font-size:12px;">当前条件下暂无</span>'}</div>
                    </div>
                    <div class="qmk-chips-box">
                        <div class="qmk-chips-head">
                            <span>及格边缘生（${(chips.pass - chips.margin).toFixed(1)}~${chips.pass}，${chips.passMarginal.length} 人）</span>
                            <button type="button" class="qmk-tab" data-qmk-copy="pass">一键复制</button>
                        </div>
                        <div class="qmk-chips">${chips.passMarginal.length ? chips.passMarginal.map((s) => `<span class="qmk-chip qmk-chip-pass">${escHtml(s.name)} · ${escHtml(s.class)} · ${s.score}</span>`).join('') : '<span style="color:var(--secondary,#64748b);font-size:12px;">当前条件下暂无</span>'}</div>
                    </div>
                </div>`;

            modal.body.querySelectorAll('[data-qmk-subj]').forEach((btn) => btn.addEventListener('click', () => { currentSubject = btn.dataset.qmkSubj; render(); }));
            modal.body.querySelectorAll('[data-qmk-sort]').forEach((thEl) => thEl.addEventListener('click', () => {
                const k = thEl.dataset.qmkSort;
                if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = -1; }
                render();
            }));
            const townToggle = modal.body.querySelector('#qmk-bench-town-line');
            if (townToggle) townToggle.addEventListener('change', () => { useTownshipLine = townToggle.checked; render(); });
            modal.body.querySelector('#qmk-export-bench').addEventListener('click', () => exportBenchmarkExcel(benchRows, currentSubject, getExamTitle()));
            modal.body.querySelector('#qmk-chip-class').addEventListener('change', (e) => { classFilter = e.target.value; render(); });
            modal.body.querySelector('#qmk-chip-margin').addEventListener('change', (e) => { margin = Number(e.target.value) || DEFAULT_MARGIN; render(); });
            modal.body.querySelectorAll('[data-qmk-copy]').forEach((btn) => btn.addEventListener('click', async () => {
                const isExc = btn.dataset.qmkCopy === 'exc';
                const text = formatChipsCopyText(`${getExamTitle()} ${currentSubject} ${isExc ? '优秀边缘生' : '及格边缘生'}`, isExc ? chips.excMarginal : chips.passMarginal);
                try {
                    await root.navigator.clipboard.writeText(text);
                    toast('名单已复制到剪贴板', 'success');
                } catch (_) {
                    toast(text, 'info');
                }
            }));
        }

        modal.foot.innerHTML = `<span style="font-size:12px;color:var(--secondary,#536471);">注：本校班级分别与全镇各外校对标，本校班级间不互比；点击表头可升降序排列</span><button type="button" class="btn btn-green" id="qmk-bench-to-ppt">打开质量分析会 PPT 工作室</button>`;
        modal.foot.querySelector('#qmk-bench-to-ppt').addEventListener('click', () => { modal.close(); openQualityMeetingPptModal(); });
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
        resolveThresholds,
        calcGroupMetrics,
        buildInlineRankBadgeHtml,
        buildClassRows,
        buildClassTownshipBenchmark,
        buildTeacherHandbookRows,
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
