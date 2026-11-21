/*
 * 质量分析会一键工具箱（quality-meeting-kit）按需运行时模块
 *
 * 覆盖 5 项考后汇报与教研提效能力：
 * 1. 一键导出「质量分析会 PPT（.pptx）」（纯前端 JSZip 生成 OOXML，支持导出前勾选页签与内嵌页面图表）
 * 2. 一键导出「教师分析手册（Excel）」（按任课教师聚合多班两率一分、排名及分学科临界生名单）
 * 3. 表格内联「金/银/铜排名小徽章」渲染与表内增强
 * 4. 「本校班级插入全镇学校对标」与「本校模式一键套用乡镇线」
 * 5. 分学科「优秀生 / 优秀边缘生 / 及格边缘生」姓名速览芯片与一键复制
 *
 * 所有事件绑定均走 addEventListener（零内联 on* 事件，满足严格 CSP）。
 */
(function (root) {
    if (!root || root.__QUALITY_MEETING_KIT_PATCHED__) return;

    const DEFAULT_EXC_PCT = 0.15;
    const DEFAULT_PASS_PCT = 0.50;
    const DEFAULT_MARGIN = 10;

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
        (rows || []).forEach((r) => {
            Object.keys(r?.scores || {}).forEach((s) => set.add(s));
        });
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
    // Minimal Standards-Compliant OOXML (.pptx) Builder powered by JSZip
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
        const color = opts.color || '1E293B';
        const bold = opts.bold ? ' b="1"' : '';
        const align = opts.align || 'l';
        const paragraphs = (Array.isArray(lines) ? lines : [lines]).map((line) => (
            `<a:p><a:pPr algn="${align}"/><a:r><a:rPr lang="zh-CN" sz="${fontSize}"${bold} dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:rPr><a:t>${escXml(line)}</a:t></a:r></a:p>`
        )).join('');
        return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
<p:txBody><a:bodyPr wrap="square" lIns="60000" tIns="40000" rIns="60000" bIns="40000"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
    }

    function pptTable(id, x, y, cx, cy, headers, rows) {
        const colCount = Math.max(1, headers.length);
        const colW = Math.floor(cx / colCount);
        const rowH = Math.min(360000, Math.floor(cy / Math.max(2, rows.length + 1)));
        const gridCols = headers.map(() => `<a:gridCol w="${colW}"/>`).join('');
        const makeRow = (cells, isHeader, rowIdx) => {
            const fill = isHeader ? '0F766E' : (rowIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF');
            const txtColor = isHeader ? 'FFFFFF' : '1E293B';
            const bold = isHeader ? ' b="1"' : '';
            const tcs = cells.map((cell) => `<a:tc><a:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="zh-CN" sz="${isHeader ? 1200 : 1100}"${bold}><a:solidFill><a:srgbClr val="${txtColor}"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:rPr><a:t>${escXml(cell)}</a:t></a:r></a:p></a:txBody><a:tcPr><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill></a:tcPr></a:tc>`).join('');
            return `<a:tr h="${rowH}">${tcs}</a:tr>`;
        };
        const trXml = [makeRow(headers, true, 0), ...rows.map((r, i) => makeRow(r, false, i + 1))].join('');
        return `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Table ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>
<p:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></p:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>${gridCols}</a:tblGrid>${trXml}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
    }

    function pptPicture(id, relId, x, y, cx, cy) {
        return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Chart ${id}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
<p:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
    }

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

    async function buildMeetingPptxBlob(options = {}) {
        const JSZipCtor = options.JSZip || root.JSZip;
        if (!JSZipCtor) throw new Error('JSZip 未加载，无法生成 PPT');
        const allRows = options.allRows || getAllRows();
        if (!allRows.length) throw new Error('暂无成绩数据，请先导入数据');
        const mySchool = options.mySchool || getMySchoolName(allRows);
        const mySchoolRows = allRows.filter((r) => sameSchool(r?.school, mySchool));
        const activeRows = mySchoolRows.length ? mySchoolRows : allRows;
        const subjects = options.subjects || getSubjects(allRows);
        const examTitle = options.examTitle || getExamTitle();
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

        const slides = [];
        const addSlide = (shapesXml, images = []) => slides.push({ xml: xmlSlideShell(shapesXml), images });
        const headerBand = (title, subtitle) => (
            pptRect(2, 0, 0, 12192000, 1050000, '0F172A') +
            pptRect(3, 0, 1020000, 12192000, 45000, '0D9488') +
            pptTextBox(4, 480000, 180000, 11200000, 450000, title, { fontSize: 24, bold: true, color: 'FFFFFF' }) +
            pptTextBox(5, 480000, 620000, 11200000, 320000, subtitle, { fontSize: 13, color: '94A3B8' })
        );

        // Slide 1: Cover
        const modeLabel = thresholdInfo.source === 'township'
            ? `已套用全镇划线（${thresholdInfo.schoolCount}校 · 共${allRows.length}人）`
            : `本校模式（共${activeRows.length}人）`;
        addSlide(
            pptRect(2, 0, 0, 12192000, 6858000, '0F172A') +
            pptRect(3, 0, 5600000, 12192000, 120000, '0D9488') +
            pptTextBox(4, 720000, 1750000, 10750000, 900000, `${examTitle} · 教学质量分析会`, { fontSize: 34, bold: true, color: 'FFFFFF' }) +
            pptTextBox(5, 720000, 2850000, 10750000, 600000, `${mySchool}  |  ${modeLabel}`, { fontSize: 18, color: '5EEAD4' }) +
            pptTextBox(6, 720000, 3800000, 10750000, 500000, `总分优秀线 ${thresholdInfo.thresholds['总分'].exc}  ·  及格线 ${thresholdInfo.thresholds['总分'].pass}  ·  生成日期 ${new Date().toISOString().slice(0, 10)}`, { fontSize: 14, color: 'CBD5E1' })
        );

        // Slide 2: Overview & Smart Diagnostics
        if (include.overview) {
            const kpiCards = [
                { label: '参评人数', val: `${overall.count} 人`, color: '0F766E' },
                { label: '年级平均分', val: `${overall.avg}`, color: '1D4ED8' },
                { label: '优秀率', val: `${overall.excRate}%`, color: '7C3AED' },
                { label: '及格率', val: `${overall.passRate}%`, color: 'B45309' }
            ].map((k, idx) => {
                const x = 480000 + idx * 2850000;
                const base = 10 + idx * 3;
                return pptRect(base, x, 1300000, 2650000, 1150000, 'F8FAFC') +
                    pptTextBox(base + 1, x + 140000, 1420000, 2350000, 320000, k.label, { fontSize: 13, color: '64748B' }) +
                    pptTextBox(base + 2, x + 140000, 1780000, 2350000, 520000, k.val, { fontSize: 28, bold: true, color: k.color });
            }).join('');
            addSlide(
                headerBand('总体概览与核心诊断', `${mySchool} · ${modeLabel}`) +
                kpiCards +
                pptRect(30, 480000, 2720000, 11230000, 3600000, 'F8FAFC') +
                pptTextBox(31, 660000, 2860000, 10800000, 400000, '智能诊断要点', { fontSize: 16, bold: true, color: '0F766E' }) +
                pptTextBox(32, 660000, 3360000, 10800000, 2800000, diagnostics.map((d, i) => `${i + 1}. ${d}`), { fontSize: 14, color: '1E293B' })
            );
        }

        // Slide 3: Class Total Ranking
        if (include.classRank && classRows.length) {
            const tblRows = classRows.slice(0, 14).map((c) => [
                c.name,
                String(c.count),
                `${c.avg} (#${c.avgRank})`,
                `${c.excRate}% (#${c.excRank})`,
                `${c.passRate}% (#${c.passRank})`,
                `${c.score} (#${c.scoreRank})`
            ]);
            addSlide(
                headerBand('班级总分对标排名', `${mySchool} 各班两率一分与单项排名（# 为单项名次）`) +
                pptTable(10, 480000, 1300000, 11230000, 5100000, ['班级', '人数', '均分', '优秀率', '及格率', '综合得分'], tblRows)
            );
        }

        // Slide 4: Own-School Class vs Township Benchmark
        if (include.townBenchmark && thresholdInfo.hasTownship) {
            const bench = buildClassTownshipBenchmark(allRows, mySchool, '总分', thresholdInfo.thresholds['总分']);
            const tblRows = bench.slice(0, 15).map((r) => [
                r.kind === 'own-class' ? `★ ${r.name}` : `${r.name} (外校)`,
                String(r.count),
                `${r.avg} (#${r.avgRank})`,
                `${r.excRate}% (#${r.excRank})`,
                `${r.passRate}% (#${r.passRank})`,
                `${r.score}`
            ]);
            addSlide(
                headerBand('本校班级插入全镇学校对标', '★ 本校班级分别与全镇各外校同台排名（本校班级间不互比）') +
                pptTable(10, 480000, 1300000, 11230000, 5100000, ['班级 / 学校', '人数', '均分', '优秀率', '及格率', '综合得分'], tblRows)
            );
        }

        // Slides 5..N: Per-Subject Breakdown
        if (include.subjects) {
            subjects.forEach((subj) => {
                const th = thresholdInfo.thresholds[subj] || { exc: 0, pass: 0 };
                const subjTeachers = teacherRows.filter((t) => t.subject === subj);
                const subjClasses = buildClassRows(activeRows, subj, th);
                const useTeacher = subjTeachers.length > 0;
                const headers = useTeacher
                    ? ['任课教师', '任教班级', '人数', '均分', '优秀率', '及格率']
                    : ['班级', '人数', '均分', '优秀率', '及格率', '综合得分'];
                const rows = useTeacher
                    ? subjTeachers.slice(0, 12).map((t) => [t.teacher, t.classes.join('、'), String(t.count), `${t.avg} (#${t.avgRank})`, `${t.excRate}% (#${t.excRank})`, `${t.passRate}% (#${t.passRank})`])
                    : subjClasses.slice(0, 12).map((c) => [c.name, String(c.count), `${c.avg} (#${c.avgRank})`, `${c.excRate}% (#${c.excRank})`, `${c.passRate}% (#${c.passRank})`, `${c.score}`]);
                const border = buildBorderlineChips(activeRows, subj, th);
                const noteLine = `优秀线 ${th.exc} · 及格线 ${th.pass} | 优秀边缘 ${border.excMarginal.length} 人：${border.excMarginal.slice(0, 6).map((s) => `${s.name}(${s.score})`).join('、') || '无'}`;
                addSlide(
                    headerBand(`分学科质量分析 · ${subj}`, useTeacher ? '按任课教师聚合两率一分与单项排名' : '按班级统计两率一分与单项排名') +
                    pptTable(10, 480000, 1280000, 11230000, 4450000, headers, rows) +
                    pptTextBox(11, 480000, 5880000, 11230000, 700000, noteLine, { fontSize: 12, color: '475569' })
                );
            });
        }

        // Optional Chart Slide (live page charts)
        if (include.charts) {
            const chartImgs = Array.isArray(options.chartImages) ? options.chartImages : captureVisibleChartImages(2);
            if (chartImgs.length) {
                const pics = chartImgs.map((img, idx) => {
                    const w = chartImgs.length === 1 ? 9600000 : 5400000;
                    const x = chartImgs.length === 1 ? 1296000 : (480000 + idx * 5800000);
                    return pptPicture(20 + idx, `rIdImg${idx + 1}`, x, 1400000, w, 4800000);
                }).join('');
                addSlide(
                    headerBand('可视化图表快照', '直接截取当前分析页面的交互式图表用于会议展示') + pics,
                    chartImgs
                );
            }
        }

        // Borderline & Action Plan Slide
        if (include.borderline) {
            const excNames = totalBorderline.excMarginal.slice(0, 18).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '暂无';
            const passNames = totalBorderline.passMarginal.slice(0, 18).map((s) => `${s.name}(${s.class} ${s.score})`).join('、') || '暂无';
            addSlide(
                headerBand('重点临界生抓手清单', `总分优秀线 ${totalBorderline.exc}（±${totalBorderline.margin}分） / 及格线 ${totalBorderline.pass}（±${totalBorderline.margin}分）`) +
                pptRect(10, 480000, 1320000, 11230000, 2350000, 'EFF6FF') +
                pptTextBox(11, 660000, 1440000, 10850000, 380000, `优秀边缘生（共 ${totalBorderline.excMarginal.length} 人，冲刺优秀线）`, { fontSize: 15, bold: true, color: '1D4ED8' }) +
                pptTextBox(12, 660000, 1880000, 10850000, 1650000, excNames, { fontSize: 12, color: '1E293B' }) +
                pptRect(13, 480000, 3920000, 11230000, 2350000, 'FFFBEB') +
                pptTextBox(14, 660000, 4040000, 10850000, 380000, `及格边缘生（共 ${totalBorderline.passMarginal.length} 人，守住及格线）`, { fontSize: 15, bold: true, color: 'B45309' }) +
                pptTextBox(15, 660000, 4480000, 10850000, 1650000, passNames, { fontSize: 12, color: '1E293B' })
            );
        }

        // Assemble OOXML zip package
        const zip = new JSZipCtor();
        const slideOverrides = slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('');
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

        const sldIdLst = slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('');
        const presRels = slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('');
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
<a:themeElements><a:clrScheme name="School"><a:dk1><a:srgbClr val="0F172A"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="334155"/></a:dk2><a:lt2><a:srgbClr val="F8FAFC"/></a:lt2><a:accent1><a:srgbClr val="0F766E"/></a:accent1><a:accent2><a:srgbClr val="1D4ED8"/></a:accent2><a:accent3><a:srgbClr val="7C3AED"/></a:accent3><a:accent4><a:srgbClr val="B45309"/></a:accent4><a:accent5><a:srgbClr val="0EA5E9"/></a:accent5><a:accent6><a:srgbClr val="16A34A"/></a:accent6><a:hlink><a:srgbClr val="0284C7"/></a:hlink><a:folHlink><a:srgbClr val="6D28D9"/></a:folHlink></a:clrScheme>
<a:fontScheme name="School"><a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:majorFont><a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme>
<a:fmtScheme name="School"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
</a:themeElements></a:theme>`);

        let imgCounter = 0;
        slides.forEach((slide, idx) => {
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

        const outputType = options.outputType || 'blob';
        const payload = await zip.generateAsync({ type: outputType, compression: 'DEFLATE' });
        return {
            payload,
            slideCount: slides.length,
            fileName: `质量分析会_${examTitle.replace(/[\\/:*?"<>|]/g, '_')}.pptx`
        };
    }

    // -------------------------------------------------------------------------
    // Teacher Analysis Handbook Excel Export
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // Scoped UI Styles (keeps distAppCss strictly under 648,000 B budget)
    // -------------------------------------------------------------------------
    function ensureStyles() {
        const doc = root.document;
        if (!doc || doc.getElementById('qmk-style')) return;
        const style = doc.createElement('style');
        style.id = 'qmk-style';
        style.textContent = `
.qmk-mask{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px}
.qmk-dialog{background:#fff;color:#0f172a;border-radius:14px;width:min(980px,96vw);max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(15,23,42,.25);overflow:hidden}
.qmk-head{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#0f172a;color:#fff}
.qmk-head h3{margin:0;font-size:16px;font-weight:700}
.qmk-close{background:transparent;border:none;color:#cbd5e1;font-size:22px;cursor:pointer;line-height:1}
.qmk-body{padding:16px 20px;overflow:auto;display:grid;gap:14px}
.qmk-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;background:#f8fafc;padding:10px 14px;border-radius:10px;border:1px solid #e2e8f0}
.qmk-tabs{display:flex;flex-wrap:wrap;gap:6px}
.qmk-tab{padding:5px 12px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;cursor:pointer;font-size:13px}
.qmk-tab.is-active{background:#0f766e;color:#fff;border-color:#0f766e}
.qmk-table{width:100%;border-collapse:collapse;font-size:13px}
.qmk-table th,.qmk-table td{padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center}
.qmk-table th{background:#f1f5f9;font-weight:600}
.qmk-table tr.is-own{background:#ecfdf5;font-weight:600}
.qmk-rk{display:inline-block;margin-left:4px;padding:1px 6px;border-radius:999px;font-size:11px;font-weight:700;vertical-align:middle}
.qmk-rk-1{background:#fef3c7;color:#b45309}
.qmk-rk-2{background:#e2e8f0;color:#334155}
.qmk-rk-3{background:#ffedd5;color:#9a3412}
.qmk-rk-n{background:#f1f5f9;color:#64748b}
.qmk-tag{display:inline-block;padding:1px 6px;border-radius:4px;font-size:11px;margin-left:4px}
.qmk-tag-own{background:#dcfce7;color:#15803d}
.qmk-tag-ext{background:#f1f5f9;color:#64748b}
.qmk-chips-box{border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:#fff}
.qmk-chips-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px;font-weight:600}
.qmk-chips{display:flex;flex-wrap:wrap;gap:6px}
.qmk-chip{padding:3px 9px;border-radius:999px;font-size:12px;background:#f8fafc;border:1px solid #e2e8f0}
.qmk-chip-exc{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}
.qmk-chip-pass{background:#fffbeb;border-color:#fde68a;color:#b45309}
.qmk-check-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
.qmk-check-item{display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-size:13px;cursor:pointer}
.qmk-foot{display:flex;justify-content:flex-end;gap:10px;padding:12px 20px;border-top:1px solid #e2e8f0;background:#f8fafc}
`;
        doc.head.appendChild(style);
    }

    function createModalShell(id, title) {
        ensureStyles();
        const doc = root.document;
        const existing = doc.getElementById(id);
        if (existing) existing.remove();
        const mask = doc.createElement('div');
        mask.id = id;
        mask.className = 'qmk-mask';
        mask.innerHTML = `<div class="qmk-dialog" role="dialog" aria-modal="true">
            <div class="qmk-head"><h3>${escHtml(title)}</h3><button type="button" class="qmk-close" aria-label="关闭">&times;</button></div>
            <div class="qmk-body"></div>
            <div class="qmk-foot"></div>
        </div>`;
        const close = () => mask.remove();
        mask.querySelector('.qmk-close').addEventListener('click', close);
        mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
        doc.body.appendChild(mask);
        return {
            mask,
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

    // -------------------------------------------------------------------------
    // UI Entry 1: Quality Analysis Meeting PPT Config & Download Modal
    // -------------------------------------------------------------------------
    function openQualityMeetingPptModal() {
        const allRows = getAllRows();
        if (!allRows.length) {
            toast('请先上传成绩数据', 'error');
            return false;
        }
        const mySchool = getMySchoolName(allRows);
        const mySchoolRows = allRows.filter((r) => sameSchool(r?.school, mySchool));
        const activeRows = mySchoolRows.length ? mySchoolRows : allRows;
        const subjects = getSubjects(allRows);
        const thInfo = resolveThresholds(allRows, activeRows, subjects, true);
        const modal = createModalShell('qmk-ppt-modal', '📊 质量分析会 PPT 课件生成与预览');

        const slideItems = [
            { key: 'overview', label: '总体概览与智能诊断要点（KPI + 4维诊断）', checked: true },
            { key: 'classRank', label: '班级总分对标排名表（含单项排名）', checked: true },
            { key: 'townBenchmark', label: '本校班级插入全镇学校对标页', checked: thInfo.hasTownship },
            { key: 'subjects', label: `分学科逐科分析页（共 ${subjects.length} 科：班级/教师 + 临界生）`, checked: true },
            { key: 'charts', label: '当前页面可视化图表快照页（自动捕获 Canvas）', checked: true },
            { key: 'borderline', label: '重点临界生抓手清单（优秀边缘 + 及格边缘）', checked: true }
        ];

        modal.body.innerHTML = `
            <div class="qmk-bar">
                <div><strong>${escHtml(getExamTitle())}</strong> · ${escHtml(mySchool)}（本校 ${activeRows.length} 人${thInfo.hasTownship ? ` / 全镇 ${thInfo.schoolCount} 校 ${allRows.length} 人` : ''}）</div>
                <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
                    <input type="checkbox" id="qmk-use-township-line" ${thInfo.hasTownship ? 'checked' : ''} ${thInfo.hasTownship ? '' : 'disabled'}>
                    套用全镇划线（优秀线 ${thInfo.thresholds['总分'].exc} / 及格线 ${thInfo.thresholds['总分'].pass}）
                </label>
            </div>
            <div style="font-size:13px;color:#475569;">勾选需要包含在质量分析会课件（16:9 标准 .pptx）中的页面：</div>
            <div class="qmk-check-grid">
                ${slideItems.map((item) => `<label class="qmk-check-item"><input type="checkbox" data-qmk-slide="${item.key}" ${item.checked ? 'checked' : ''}><span>${escHtml(item.label)}</span></label>`).join('')}
            </div>`;

        modal.foot.innerHTML = `
            <button type="button" class="btn" id="qmk-btn-handbook">📘 顺便导出教师分析手册(Excel)</button>
            <button type="button" class="btn btn-green" id="qmk-btn-download-ppt">📥 立即生成并下载 PPT</button>`;

        modal.foot.querySelector('#qmk-btn-handbook').addEventListener('click', () => {
            const useTown = !!modal.body.querySelector('#qmk-use-township-line')?.checked;
            exportTeacherAnalysisHandbookExcel({ useTownshipLine: useTown });
        });
        modal.foot.querySelector('#qmk-btn-download-ppt').addEventListener('click', async () => {
            const include = {};
            modal.body.querySelectorAll('[data-qmk-slide]').forEach((el) => {
                include[el.dataset.qmkSlide] = el.checked;
            });
            const useTown = !!modal.body.querySelector('#qmk-use-township-line')?.checked;
            try {
                const result = await buildMeetingPptxBlob({ include, useTownshipLine: useTown });
                triggerDownloadBlob(result.payload, result.fileName);
                toast(`已生成 ${result.slideCount} 页课件：${result.fileName}`, 'success');
                modal.close();
            } catch (err) {
                toast(`生成 PPT 失败：${err?.message || err}`, 'error');
            }
        });
        return true;
    }

    // -------------------------------------------------------------------------
    // UI Entry 2: Class-vs-Township Benchmark + Borderline Student Chips Modal
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
        const modal = createModalShell('qmk-bench-modal', '🎯 本校班级全镇对标 & 临界生速览芯片');

        let currentSubject = '总分';
        let useTownshipLine = true;

        function render() {
            const thInfo = resolveThresholds(allRows, activeRows, subjects, useTownshipLine);
            const th = thInfo.thresholds[currentSubject] || { exc: 0, pass: 0 };
            const benchRows = thInfo.hasTownship
                ? buildClassTownshipBenchmark(allRows, mySchool, currentSubject, th)
                : buildClassRows(activeRows, currentSubject, th).map((c) => ({ ...c, kind: 'own-class' }));
            const chips = buildBorderlineChips(activeRows, currentSubject, th);

            modal.body.innerHTML = `
                <div class="qmk-bar">
                    <div class="qmk-tabs">
                        ${['总分', ...subjects].map((s) => `<button type="button" class="qmk-tab ${s === currentSubject ? 'is-active' : ''}" data-qmk-subj="${escHtml(s)}">${escHtml(s)}</button>`).join('')}
                    </div>
                    <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
                        <input type="checkbox" id="qmk-bench-town-line" ${thInfo.source === 'township' ? 'checked' : ''} ${thInfo.hasTownship ? '' : 'disabled'}>
                        ${thInfo.source === 'township' ? '已套用乡镇线' : '校内划线'}（优秀 ${th.exc} / 及格 ${th.pass}）
                    </label>
                </div>
                <div style="font-size:12px;color:#475569;">
                    ${thInfo.hasTownship ? '说明：本校各班分别插入全镇各外校榜单同台比较（外校整校计 1 个单位，本校班级之间不互比）；徽章数字为单项排名。' : '当前为单校数据，展示本校各班两率一分与内联排名徽章。'}
                </div>
                <div style="overflow:auto;">
                    <table class="qmk-table">
                        <thead><tr><th>班级 / 学校</th><th>人数</th><th>均分</th><th>优秀率</th><th>及格率</th><th>综合得分</th></tr></thead>
                        <tbody>
                            ${benchRows.map((r) => `<tr class="${r.kind === 'own-class' ? 'is-own' : ''}">
                                <td>${escHtml(r.name)}<span class="qmk-tag ${r.kind === 'own-class' ? 'qmk-tag-own' : 'qmk-tag-ext'}">${r.kind === 'own-class' ? '本校班级' : '外校'}</span></td>
                                <td>${r.count}</td>
                                <td>${r.avg}${buildInlineRankBadgeHtml(r.avgRank)}</td>
                                <td>${r.excRate}%${buildInlineRankBadgeHtml(r.excRank)}</td>
                                <td>${r.passRate}%${buildInlineRankBadgeHtml(r.passRank)}</td>
                                <td>${r.score}${buildInlineRankBadgeHtml(r.scoreRank)}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="qmk-chips-box">
                    <div class="qmk-chips-head">
                        <span>🎯 ${escHtml(currentSubject)} · 优秀边缘生（${chips.exc - chips.margin}~${chips.exc}分，共 ${chips.excMarginal.length} 人）</span>
                        <button type="button" class="qmk-tab" data-qmk-copy="exc">📋 一键复制名单</button>
                    </div>
                    <div class="qmk-chips">${chips.excMarginal.length ? chips.excMarginal.map((s) => `<span class="qmk-chip qmk-chip-exc">${escHtml(s.name)} ${escHtml(s.class)}·${s.score}</span>`).join('') : '<span style="color:#94a3b8;font-size:12px;">暂无</span>'}</div>
                </div>
                <div class="qmk-chips-box">
                    <div class="qmk-chips-head">
                        <span>📌 ${escHtml(currentSubject)} · 及格边缘生（${chips.pass - chips.margin}~${chips.pass}分，共 ${chips.passMarginal.length} 人）</span>
                        <button type="button" class="qmk-tab" data-qmk-copy="pass">📋 一键复制名单</button>
                    </div>
                    <div class="qmk-chips">${chips.passMarginal.length ? chips.passMarginal.map((s) => `<span class="qmk-chip qmk-chip-pass">${escHtml(s.name)} ${escHtml(s.class)}·${s.score}</span>`).join('') : '<span style="color:#94a3b8;font-size:12px;">暂无</span>'}</div>
                </div>`;

            modal.body.querySelectorAll('[data-qmk-subj]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    currentSubject = btn.dataset.qmkSubj;
                    render();
                });
            });
            const townToggle = modal.body.querySelector('#qmk-bench-town-line');
            if (townToggle) {
                townToggle.addEventListener('change', () => {
                    useTownshipLine = townToggle.checked;
                    render();
                });
            }
            modal.body.querySelectorAll('[data-qmk-copy]').forEach((btn) => {
                btn.addEventListener('click', async () => {
                    const isExc = btn.dataset.qmkCopy === 'exc';
                    const text = formatChipsCopyText(
                        `${getExamTitle()} ${currentSubject} ${isExc ? '优秀边缘生' : '及格边缘生'}`,
                        isExc ? chips.excMarginal : chips.passMarginal
                    );
                    try {
                        await root.navigator.clipboard.writeText(text);
                        toast('名单已复制到剪贴板，可直接粘贴发群', 'success');
                    } catch (_) {
                        toast(text, 'info');
                    }
                });
            });
        }

        modal.foot.innerHTML = `<button type="button" class="btn btn-green" id="qmk-bench-to-ppt">📊 生成质量分析会 PPT</button>`;
        modal.foot.querySelector('#qmk-bench-to-ppt').addEventListener('click', () => {
            modal.close();
            openQualityMeetingPptModal();
        });
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
        buildMeetingPptxBlob,
        exportTeacherAnalysisHandbookExcel,
        openQualityMeetingPptModal,
        openClassTownshipBenchmarkModal
    };
})(typeof window !== 'undefined' ? window : globalThis);
