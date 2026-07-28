/*
 * 成绩导入行解析（parse-rows）运行时模块
 *
 * 从 app.js 抽出的 parseRows(rows, defaultSchool)：把一张导入的 Excel 工作表(表头+数据行)
 * 解析成学生记录 —— 识别姓名/考号/学校/班级/考场列与各科成绩列(含别名匹配、半角归一、
 * 缺考/作弊等关键字判 0、空白科目单元格记录),按配置的计总科目累加总分,并写入全局状态:
 *   - RAW_DATA.push(stu)                 —— 就地追加(共享引用,非重绑定)
 *   - SCHOOLS[school].students.push(stu) —— 就地建桶+追加
 *   - SUBJECTS.push / setSubjects(...)   —— 探测到的科目集(setSubjects 同步 window.SUBJECTS)
 *
 * CORE 槽模块(boot APP_MODULES，在 school-normalization 之后、app.js 之前，同 indicator-calc/
 * excel-style 一族)：只在加载时定义 window.parseRows；真正解析发生在导入点击时(readExcel
 * 逐 sheet 调用)，那时 app.js 早已加载完。放 CORE 槽是因为唯一调用者 readExcel(app.js:4653)
 * 裸调 parseRows(...)，要求它在 app.js 之前已就位。
 *
 * 数据写口径:所有状态写都是"就地变更"共享对象引用或经 setter(setSubjects)，无 let 重绑定，
 * 故 root.RAW_DATA.push / root.SCHOOLS[x]= 改的是与 app.js 同一份对象，写回正确。核心解析
 * 逻辑与原 app.js 逐字一致，仅把脚本作用域裸标识符改 root.*。
 *
 * 依赖(导入点击期均在 window 上)：
 *   CONFIG / RAW_DATA / SCHOOLS / SUBJECTS / TARGETS —— app.js setter 镜像到 window
 *   getConfiguredDisplaySubjects / setSubjects / refreshTotalSubjectPresentation /
 *   normalizeImportedClassForGrade                  —— app.js 顶层 function=隐式 window 全局
 *   getExamMetaFromUI / getEffectiveGrade / getActiveGrade / getCanonicalSchoolName /
 *   updateStatusPanel                               —— 其他 runtime 的 window 全局(typeof 守卫)
 *   嵌套私有(随本模块)：findBestHeaderIndex / toHalfWidth / isBlankSubjectScoreCell / cleanNameStr
 */
(function (root) {
    if (!root) return;

    function parseRows(rows, defaultSchool) {
        const headers = rows[0].map(h => String(h).trim());
        const importExamMeta = typeof root.getExamMetaFromUI === 'function' ? root.getExamMetaFromUI() : {};
        const importGrade = String(
            (typeof root.getEffectiveGrade === 'function' ? root.getEffectiveGrade(importExamMeta) : '')
            || importExamMeta?.grade
            || (typeof root.getActiveGrade === 'function' ? root.getActiveGrade() : '')
            || ''
        ).trim();

        const idxMap = { name: -1, id: -1, school: -1, class: -1, examRoom: -1, zhongkaoTotal: -1, scores: {} };

        const aliasMap = {
            name: ['姓名', '学生姓名', '学生', 'Name', '考生姓名'],
            id: ['考号', '学号', '准考证号', 'ID', '考生号'],
            school: ['学校名称', '学校名', '学校', '校名', '所在学校', '就读学校', '毕业学校', '初中学校', '报名学校', '参考学校', '参考单位', '单位名称', '单位'],
            class: ['班级', '班', '班次', 'Class', '行政班'],
            examRoom: ['考场', '考室', 'Room', '考试地点']
        };

        const subjectMap = { '语文': '语文', '数学': '数学', '英语': '英语', '物理': '物理', '化学': '化学', '政治': '政治', '道法': '政治', '道德与法治': '政治', '历史': '历史', '地理': '地理', '生物': '生物', '科学': '科学' };
        const excludeKeywords = ['排', '次', '级', 'Rank', '赋分', '相对分', '折算', '等级', '优劣'];

        const schoolHeaderExcludeKeywords = ['排名', '名次', '序号', '代码', '编号', '赋分', '得分', '分数', '成绩', '班级', '年级'];
        const findBestHeaderIndex = (aliases, excludes = []) => {
            let best = { index: -1, score: -1 };
            headers.forEach((header, index) => {
                const text = String(header || '').trim().replace(/\s+/g, '').replace(/[：:]/g, '');
                if (!text) return;
                if (excludes.some(ex => text.includes(ex))) return;
                aliases.forEach(alias => {
                    const key = String(alias || '').trim().replace(/\s+/g, '').replace(/[：:]/g, '');
                    if (!key) return;
                    let score = -1;
                    if (text === key) score = 100 + key.length;
                    else if (text.includes(key)) score = 50 + key.length;
                    if (score > best.score) best = { index, score };
                });
            });
            return best.index;
        };

        headers.forEach((h, i) => {
            const hTrim = h.replace(/\s+/g, '');
            for (const [key, aliases] of Object.entries(aliasMap)) {
                if (key === 'school') continue;
                if (aliases.some(alias => hTrim.includes(alias))) idxMap[key] = i;
            }
            for (const [key, standardName] of Object.entries(subjectMap)) {
                if (h.includes(key) && !excludeKeywords.some(ex => h.includes(ex))) {
                    if (!idxMap.scores[standardName]) idxMap.scores[standardName] = [];
                    idxMap.scores[standardName].push(i);
                    if (!root.SUBJECTS.includes(standardName)) root.SUBJECTS.push(standardName);
                }
            }
        });
        idxMap.school = findBestHeaderIndex(aliasMap.school, schoolHeaderExcludeKeywords);
        // 「中考总分」是九年级正式中考的独立录取口径：它已含体育，
        // 不能混入日常“五科总”，也不能被当作一个普通学科。
        // 只接受明确的总分列，避免误把“中考总分排名/分数线”解析为学生成绩。
        idxMap.zhongkaoTotal = findBestHeaderIndex(
            ['中考总分', '中考总成绩', '中招总分'],
            ['排名', '名次', '位次', '分数线', '赋分']
        );

        const detectedSubjects = Array.isArray(root.SUBJECTS) ? [...root.SUBJECTS] : [];
        const analysisSubjects = root.getConfiguredDisplaySubjects(root.CONFIG, { includeExtra: false });
        if (analysisSubjects && analysisSubjects !== 'auto') {
            root.setSubjects(root.SUBJECTS.filter(s => analysisSubjects.includes(s)));
        }
        root.refreshTotalSubjectPresentation();
        const subsForTotal = root.CONFIG.totalSubs === 'auto' ? root.SUBJECTS : root.CONFIG.totalSubs;

        const toHalfWidth = (str) => {
            if (typeof str !== 'string') return str;
            return str.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
                .replace(/\u3000/g, ' ');
        };

        const isBlankSubjectScoreCell = (value) => {
            if (value === undefined || value === null) return true;
            const normalized = typeof value === 'string' ? toHalfWidth(value) : value;
            return typeof normalized === 'string' && normalized.trim() === '';
        };

        const parseExplicitNumericScore = (value) => {
            if (isBlankSubjectScoreCell(value)) return null;
            const normalized = typeof value === 'string' ? toHalfWidth(value).trim() : value;
            const numeric = Number(normalized);
            return Number.isFinite(numeric) ? numeric : null;
        };

        const cleanNameStr = (str) => {
            if (!str) return "";
            return String(str).replace(/\s+/g, '').replace(/[\u200b-\u200f\uFEFF]/g, '');
        };

        let lastDetectedSchool = '';
        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || !r.length) continue;

            let rawName = idxMap.name !== -1 ? (r[idxMap.name] || "") : "";
            let nameStr = cleanNameStr(rawName);
            let isAutoGeneratedName = false;
            const rawIdValue = idxMap.id !== -1 ? r[idxMap.id] : '';
            const idStr = String(rawIdValue || '').trim();

            const rowHasExplicitScoreEvidence = Object.values(idxMap.scores || {}).some((colIndices) => (
                Array.isArray(colIndices) && colIndices.some((idx) => {
                    let rawVal = r[idx];
                    if (isBlankSubjectScoreCell(rawVal)) return false;
                    if (typeof rawVal === 'string') rawVal = toHalfWidth(rawVal).trim();
                    const numeric = parseFloat(rawVal);
                    if (!isNaN(numeric)) return true;
                    const strVal = String(rawVal || "").trim().toUpperCase();
                    const zeroKeywords = ["缺", "ABS", "作弊", "违纪", "病假", "缓考", "取消", "零分", "Q", "CHE"];
                    return zeroKeywords.some(key => strVal.includes(key));
                })
            ));

            if (!nameStr && !idStr && !rowHasExplicitScoreEvidence) continue;

            if (!nameStr || nameStr === '-' || nameStr === '0' || nameStr === '0.0' || nameStr === '姓名') {
                nameStr = `考生${String(i).padStart(3, '0')}`;
                isAutoGeneratedName = true;
            }

            let classStr = "未分班";
            if (idxMap.class !== -1 && r[idxMap.class]) {
                classStr = root.normalizeImportedClassForGrade(r[idxMap.class], importGrade);
            }

            const rawSchool = idxMap.school !== -1 ? String(r[idxMap.school] || '').trim() : '';
            const fallbackSchool = String(defaultSchool || '').trim();
            const schoolCandidates = [
                ...Object.keys(root.SCHOOLS || {}),
                ...Object.keys(root.TARGETS || {}),
                rawSchool,
                fallbackSchool
            ].filter(Boolean);
            const detectedSchool = rawSchool
                ? (typeof root.getCanonicalSchoolName === 'function'
                    ? (root.getCanonicalSchoolName(rawSchool, schoolCandidates) || rawSchool)
                    : rawSchool)
                : '';
            if (detectedSchool) lastDetectedSchool = detectedSchool;
            const schoolName = detectedSchool || lastDetectedSchool || fallbackSchool;

            const stu = {
                name: nameStr,
                id: idxMap.id !== -1 ? r[idxMap.id] : '-',

                school: schoolName || fallbackSchool || '未知学校',
                originalSchoolName: rawSchool || schoolName || fallbackSchool || '未知学校',
                class: classStr,

                examRoom: idxMap.examRoom !== -1 ? r[idxMap.examRoom] : '-',
                scores: {},
                total: 0,
                hasValidScore: false,
                blankScoreSubjects: []
            };

            let hasAnyScore = false;
            let hasExplicitScoreEvidence = false;
            const blankScoreSubjects = [];
            detectedSubjects.forEach(sub => {
                const colIndices = idxMap.scores[sub];
                if (colIndices && colIndices.length > 0) {
                    let subSum = 0;
                    let validSub = false;
                    let hasBlankScoreCell = false;
                    colIndices.forEach(idx => {
                        let rawVal = r[idx];
                        if (isBlankSubjectScoreCell(rawVal)) {
                            validSub = true;
                            hasBlankScoreCell = true;
                            return;
                        }
                        if (typeof rawVal === 'string') {
                            rawVal = toHalfWidth(rawVal).trim();
                        }
                        let val = parseFloat(rawVal);

                        if (isNaN(val)) {
                            const strVal = String(rawVal || "").trim().toUpperCase(); // 转大写去空格

                            const zeroKeywords = ["缺", "ABS", "作弊", "违纪", "病假", "缓考", "取消", "零分", "Q", "CHE"];

                            if (zeroKeywords.some(key => strVal.includes(key))) {
                                val = 0;
                            }
                        }
                        if (!isNaN(val)) { subSum += val; validSub = true; hasExplicitScoreEvidence = true; }
                    });
                    if (validSub) {
                        stu.scores[sub] = parseFloat(subSum.toFixed(2));
                        if (hasBlankScoreCell) blankScoreSubjects.push(sub);
                        stu.hasValidScore = true;
                        hasAnyScore = true;
                        if (subsForTotal.includes(sub)) stu.total += subSum;
                    }
                }
            });
            stu.blankScoreSubjects = [...new Set(blankScoreSubjects)];

            // 保留文件中的正式中考总分（含体育）供“高中上线率”专用。
            // student.total 仍严格由当前配置的五科计算，保证两率一分、排名、
            // 指标生和高分段不因体育或政治而改变。
            if (idxMap.zhongkaoTotal !== -1) {
                const zhongkaoTotal = parseExplicitNumericScore(r[idxMap.zhongkaoTotal]);
                if (Number.isFinite(zhongkaoTotal)) {
                    stu.zhongkaoTotal = parseFloat(zhongkaoTotal.toFixed(2));
                }
            }

            if (!hasExplicitScoreEvidence && isAutoGeneratedName) continue;
            if (!hasAnyScore && nameStr.startsWith("考生")) continue;

            stu.total = parseFloat(stu.total.toFixed(2));
            root.RAW_DATA.push(stu);

            if (!root.SCHOOLS[stu.school]) root.SCHOOLS[stu.school] = { name: stu.school, students: [], metrics: {}, rankings: {} };
            root.SCHOOLS[stu.school].students.push(stu);
        }
        root.updateStatusPanel();
    }

    // 回挂到 window：CORE 槽预置 window.parseRows，供唯一调用者 readExcel(app.js:4653)裸调解析。
    root.parseRows = parseRows;
    root.ParseRowsRuntime = { parseRows };
})(typeof window !== 'undefined' ? window : globalThis);
