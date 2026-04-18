(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerHistoryRuntime) return;
    root.DataManagerHistoryRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerHistoryRuntime(root) {
    function safeAlert(text) {
        if (typeof root.alert === 'function') root.alert(String(text || ''));
    }

    function readSubjectsRef() {
        if (typeof root.readSubjects === 'function') {
            const subjects = root.readSubjects();
            if (Array.isArray(subjects)) return subjects;
        }
        if (Array.isArray(root.SUBJECTS)) return root.SUBJECTS;
        root.SUBJECTS = [];
        return root.SUBJECTS;
    }

    function sortSubjectList(subjects) {
        if (!Array.isArray(subjects)) return;
        if (typeof root.sortSubjects === 'function') {
            subjects.sort(root.sortSubjects);
            return;
        }
        subjects.sort((a, b) => String(a || '').localeCompare(String(b || ''), 'zh-CN'));
    }

    function isGrade9Mode() {
        const config = typeof root.readConfigState === 'function'
            ? (root.readConfigState() || {})
            : (root.CONFIG || {});
        return String(config && config.name ? config.name : '').includes('9');
    }

    function normalizeClassName(value) {
        if (typeof root.normalizeClass === 'function') {
            return root.normalizeClass(value);
        }
        const text = String(value || '').trim();
        return text || '默认班级';
    }

    function applyCompetitionRanks(list, scoreGetter, rankSetter) {
        if (typeof root.assignCompetitionRanks === 'function') {
            return root.assignCompetitionRanks(list, scoreGetter, rankSetter);
        }
        const rows = Array.isArray(list) ? list.slice() : [];
        rows.sort((a, b) => {
            const left = Number(scoreGetter(b) ?? Number.NEGATIVE_INFINITY);
            const right = Number(scoreGetter(a) ?? Number.NEGATIVE_INFINITY);
            return left - right;
        });

        let prevScore = null;
        let prevRank = 0;
        rows.forEach((item, index) => {
            const score = Number(scoreGetter(item) ?? Number.NEGATIVE_INFINITY);
            const rank = index > 0 && prevScore !== null && Math.abs(score - prevScore) < 0.0001 ? prevRank : index + 1;
            prevScore = score;
            prevRank = rank;
            rankSetter(item, rank, index, rows);
        });
        return rows;
    }

    function setPrevDataRows(rows) {
        const nextRows = Array.isArray(rows) ? rows : [];
        if (typeof root.setPrevDataState === 'function') {
            root.setPrevDataState(nextRows);
            return;
        }
        root.PREV_DATA = nextRows;
        if (root.window && typeof root.window === 'object') {
            root.window.PREV_DATA = nextRows;
        }
    }

    function readPrevDataRows() {
        if (typeof root.readPrevDataState === 'function') {
            const rows = root.readPrevDataState();
            if (Array.isArray(rows)) return rows;
        }
        if (Array.isArray(root.PREV_DATA)) return root.PREV_DATA;
        if (root.window && Array.isArray(root.window.PREV_DATA)) return root.window.PREV_DATA;
        return [];
    }

    function getXlsxRuntime() {
        return (root.window && root.window.XLSX) || root.XLSX || null;
    }

    function handleHistoryUpload(manager, input) {
        const file = input && input.files ? input.files[0] : null;
        if (!file) return;

        const FileReaderCtor = (root.window && root.window.FileReader) || root.FileReader;
        if (!FileReaderCtor) {
            safeAlert('解析失败: FileReader unavailable');
            return;
        }

        const reader = new FileReaderCtor();
        reader.onload = function (event) {
            try {
                const xlsx = getXlsxRuntime();
                if (!xlsx || typeof xlsx.read !== 'function' || !xlsx.utils || typeof xlsx.utils.sheet_to_json !== 'function') {
                    throw new Error('XLSX runtime unavailable');
                }

                const data = new Uint8Array(event.target.result);
                const wb = xlsx.read(data, { type: 'array' });

                let parsedHistory = [];
                let calcModeMsg = '';
                const subjects = readSubjectsRef();

                wb.SheetNames.forEach((sheetName) => {
                    const json = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
                    if (!Array.isArray(json) || json.length === 0) return;

                    const sample = json[0];
                    const headers = Object.keys(sample || {});
                    const keyName = headers.find((k) => k.includes('姓名') || String(k || '').toLowerCase() === 'name');
                    const keyClass = headers.find((k) => k.includes('班') || String(k || '').toLowerCase().includes('class'));
                    const keyScore = headers.find((k) => k.includes('总分') || k.includes('得分') || k.includes('Total'));

                    const subjectKeywords = ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物', '科学', '道法'];
                    const subjectColMap = {};

                    headers.forEach((header) => {
                        const cleanHeader = String(header || '').trim();
                        if (!cleanHeader || cleanHeader.includes('排') || cleanHeader.includes('赋')) return;
                        const matchedSub = subjectKeywords.find((keyword) => cleanHeader.includes(keyword));
                        if (!matchedSub) return;
                        subjectColMap[matchedSub] = header;
                        if (!subjects.includes(matchedSub)) subjects.push(matchedSub);
                    });
                    sortSubjectList(subjects);

                    const grade9Mode = isGrade9Mode();
                    const targetSubjects = grade9Mode ? ['语文', '数学', '英语', '物理', '化学'] : Object.keys(subjectColMap);
                    calcModeMsg = grade9Mode ? '9年级模式' : '全科模式';

                    const schoolStudents = [];
                    json.forEach((row, idx) => {
                        let name = keyName ? row[keyName] : '';
                        if (!name || String(name).trim() === '') {
                            name = `${sheetName}_考生_${idx + 1}`;
                        }
                        const className = keyClass && row[keyClass] ? normalizeClassName(row[keyClass]) : '默认班级';

                        const scoresObj = {};
                        Object.keys(subjectColMap).forEach((sub) => {
                            const colName = subjectColMap[sub];
                            if (row[colName] === undefined) return;
                            const value = parseFloat(row[colName]);
                            if (!Number.isNaN(value)) scoresObj[sub] = value;
                        });

                        let totalScore = 0;
                        if (keyScore && row[keyScore] !== undefined) {
                            totalScore = parseFloat(row[keyScore]);
                        } else {
                            let sum = 0;
                            let hasValidSub = false;
                            targetSubjects.forEach((sub) => {
                                if (scoresObj[sub] === undefined) return;
                                sum += scoresObj[sub];
                                hasValidSub = true;
                            });
                            if (hasValidSub) totalScore = parseFloat(sum.toFixed(2));
                        }

                        schoolStudents.push({
                            name: String(name).trim(),
                            class: className,
                            school: sheetName,
                            total: totalScore || 0,
                            scores: scoresObj,
                            ranks: {}
                        });
                    });

                    parsedHistory = parsedHistory.concat(schoolStudents);
                });

                if (!parsedHistory.length) throw new Error('未解析到有效数据');

                const calcRank = (list, scoreGetter, rankSetter) => applyCompetitionRanks(list, scoreGetter, rankSetter);

                calcRank(parsedHistory, (s) => s.total, (s, rank) => {
                    if (!s.ranks.total) s.ranks.total = {};
                    s.townRank = rank;
                    s.ranks.total.township = rank;
                });

                subjects.forEach((sub) => {
                    const validList = parsedHistory.filter((s) => s.scores[sub] !== undefined);
                    calcRank(validList, (s) => s.scores[sub], (s, rank) => {
                        if (!s.ranks[sub]) s.ranks[sub] = {};
                        s.ranks[sub].township = rank;
                    });
                });

                const schoolGroups = {};
                parsedHistory.forEach((s) => {
                    if (!schoolGroups[s.school]) schoolGroups[s.school] = [];
                    schoolGroups[s.school].push(s);
                });
                Object.values(schoolGroups).forEach((group) => {
                    calcRank(group, (s) => s.total, (s, rank) => {
                        if (!s.ranks.total) s.ranks.total = {};
                        s.schoolRank = rank;
                        s.ranks.total.school = rank;
                    });
                    subjects.forEach((sub) => {
                        const validList = group.filter((s) => s.scores[sub] !== undefined);
                        calcRank(validList, (s) => s.scores[sub], (s, rank) => {
                            if (!s.ranks[sub]) s.ranks[sub] = {};
                            s.ranks[sub].school = rank;
                        });
                    });
                });

                const classGroups = {};
                parsedHistory.forEach((s) => {
                    const key = `${s.school}_${s.class}`;
                    if (!classGroups[key]) classGroups[key] = [];
                    classGroups[key].push(s);
                });
                Object.values(classGroups).forEach((group) => {
                    calcRank(group, (s) => s.total, (s, rank) => {
                        if (!s.ranks.total) s.ranks.total = {};
                        s.classRank = rank;
                        s.ranks.total.class = rank;
                    });
                    subjects.forEach((sub) => {
                        const validList = group.filter((s) => s.scores[sub] !== undefined);
                        calcRank(validList, (s) => s.scores[sub], (s, rank) => {
                            if (!s.ranks[sub]) s.ranks[sub] = {};
                            s.ranks[sub].class = rank;
                        });
                    });
                });

                setPrevDataRows(parsedHistory);

                const statusEl = root.document && typeof root.document.getElementById === 'function'
                    ? root.document.getElementById('dm-history-status')
                    : null;
                if (statusEl) {
                    statusEl.innerHTML = `✅ 已加载 ${parsedHistory.length} 条 | ${calcModeMsg}`;
                    if (statusEl.style) statusEl.style.color = '#16a34a';
                }

                if (manager && typeof manager.renderHistoryPreview === 'function') {
                    manager.renderHistoryPreview();
                }
                if (typeof root.performSilentMatching === 'function') {
                    root.performSilentMatching();
                }
                if (typeof root.saveCloudData === 'function') {
                    root.saveCloudData({ background: true, sourceLabel: 'history-import-auto' }).catch((err) => {
                        if (typeof root.logCloudSyncIssue === 'function') {
                            root.logCloudSyncIssue('历史数据后台同步失败', err);
                        }
                    });
                }

                safeAlert(`历史数据导入成功！\n共 ${parsedHistory.length} 人。\n✅ 已自动计算历史总分及单科的三级排名(班/校/镇)。`);
                if (manager && typeof manager.renderDataManagerStatus === 'function') {
                    manager.renderDataManagerStatus();
                }
                if (input) input.value = '';
            } catch (error) {
                if (root.console && typeof root.console.error === 'function') root.console.error(error);
                safeAlert(`解析失败: ${error && error.message ? error.message : String(error)}`);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function renderHistoryPreview() {
        const doc = root.document;
        const tbody = doc && typeof doc.querySelector === 'function'
            ? doc.querySelector('#dm-history-preview-table tbody')
            : null;
        if (!tbody) return;

        const prevData = readPrevDataRows();
        if (!prevData.length) return;

        const schools = new Set(prevData.map((s) => s.school));
        const isSingleSchool = schools.size === 1;

        let html = '';
        prevData.slice(0, 50).forEach((s) => {
            const townRankDisplay = isSingleSchool ? '<span style="color:#ccc">-</span>' : s.townRank;
            html += `
                <tr>
                    <td>${s.school}</td>
                    <td>${s.class}</td>
                    <td>${String(s.name || '').includes('无名氏') ? `<span style="color:#999;font-style:italic;">${s.name}</span>` : `<strong>${s.name}</strong>`}</td>
                    <td style="font-weight:bold; color:#1e3a8a;">${s.total}</td>
                    <td>${s.schoolRank}</td>
                    <td>${townRankDisplay}</td>
                </tr>
            `;
        });

        if (prevData.length > 50) {
            html += `<tr><td colspan="6" style="text-align:center; color:#666;">... 共 ${prevData.length} 条记录 ...</td></tr>`;
        }
        tbody.innerHTML = html;

        const townTh = doc && typeof doc.querySelector === 'function'
            ? doc.querySelector('#dm-history-preview-table th:last-child')
            : null;
        if (!townTh) return;
        if (isSingleSchool) {
            townTh.innerHTML = '<span style="color:#ccc; text-decoration:line-through">全镇排名</span><br><small>(单校已隐藏)</small>';
            return;
        }
        townTh.innerText = '全镇排名';
    }

    return {
        handleHistoryUpload,
        renderHistoryPreview
    };
});
