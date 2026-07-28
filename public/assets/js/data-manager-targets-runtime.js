(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerTargetsRuntime) return;
    root.DataManagerTargetsRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerTargetsRuntime(root) {
    function readTargetsStateSafe() {
        if (typeof root.readTargetsState === 'function') {
            const state = root.readTargetsState();
            if (state && typeof state === 'object' && !Array.isArray(state)) return state;
        }
        if (root.window && root.window.TARGETS && typeof root.window.TARGETS === 'object') return root.window.TARGETS;
        if (root.TARGETS && typeof root.TARGETS === 'object') return root.TARGETS;
        return {};
    }

    function writeTargetsState(nextTargets) {
        const safeTargets = nextTargets && typeof nextTargets === 'object' && !Array.isArray(nextTargets) ? nextTargets : {};
        if (typeof root.setTargetsState === 'function') {
            root.setTargetsState(safeTargets);
        } else {
            if (root.window) root.window.TARGETS = safeTargets;
            root.TARGETS = safeTargets;
        }
    }

    function safeToast(text, type) {
        if (root.UI && typeof root.UI === 'object' && typeof root.UI.toast === 'function') {
            root.UI.toast(text, type);
        }
    }

    function safeAlert(message) {
        if (typeof root.alert === 'function') root.alert(String(message || ''));
    }

    function isIndicatorWorkspaceAllowed() {
        // 独立单元测试/离线工具没有 app.js 的年级解析器时保留既有行为；线上
        // 工作区总会提供该函数，因此低年级会按年级门禁隐藏目标人数维护。
        return typeof root.isIndicatorPromptAllowed !== 'function' || root.isIndicatorPromptAllowed();
    }

    function hideTargetWorkspace() {
        const area = root.document && typeof root.document.getElementById === 'function'
            ? root.document.getElementById('dm-targets-area')
            : null;
        if (area && area.style) area.style.display = 'none';
    }

    function escapeHtml(value) {
        const runtimeEscape = root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
            ? root.SchoolRuntime.escapeHtml
            : null;
        if (runtimeEscape) return runtimeEscape(value);
        return String(value ?? '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function bindTargetRowActions(manager, tbody) {
        if (!tbody || typeof tbody.querySelectorAll !== 'function') return;
        tbody.querySelectorAll('[data-target-action]').forEach((button) => {
            button.addEventListener('click', () => {
                const schoolName = button.dataset.targetSchool || '';
                if (button.dataset.targetAction === 'edit') {
                    editTarget(manager, schoolName);
                } else if (button.dataset.targetAction === 'delete') {
                    deleteTarget(manager, schoolName);
                }
            });
        });
    }

    function renderTargets(manager) {
        if (!manager) return;
        if (!isIndicatorWorkspaceAllowed()) {
            hideTargetWorkspace();
            return;
        }
        const doc = root.document;
        const tbody = doc && typeof doc.getElementById === 'function' ? doc.getElementById('dm-targets-tbody') : null;
        if (!tbody) return;

        readTargetsStateSafe();
        if (typeof root.ensureNormalizedTargets === 'function') root.ensureNormalizedTargets();
        if (Object.keys(readTargetsStateSafe()).length === 0 && typeof manager.restoreGrade9TargetsTemplate === 'function') {
            manager.restoreGrade9TargetsTemplate();
            if (typeof root.ensureNormalizedTargets === 'function') root.ensureNormalizedTargets();
        }

        const list = Object.keys(readTargetsStateSafe()).sort();
        if (typeof manager.renderSchoolAliasMappings === 'function') manager.renderSchoolAliasMappings();

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#999;">暂无数据，请先点击上方按钮导入 Excel</td></tr>';
            return;
        }

        const targets = readTargetsStateSafe();
        const rows = list.map((school) => {
            const item = targets[school] || { t1: 0, t2: 0 };
            const safeSchool = escapeHtml(school);
            const t1 = Number.isFinite(Number(item.t1)) ? Number(item.t1) : 0;
            const t2 = Number.isFinite(Number(item.t2)) ? Number(item.t2) : 0;
            return `<tr><td style="font-weight:bold;">${safeSchool}</td><td>${t1}</td><td>${t2}</td><td><button class="btn btn-sm btn-primary" type="button" data-target-action="edit" data-target-school="${safeSchool}" style="padding:2px 6px;">修改</button> <button class="btn btn-sm btn-danger" type="button" data-target-action="delete" data-target-school="${safeSchool}" style="padding:2px 6px;">删除</button></td></tr>`;
        });
        tbody.innerHTML = rows.join('');
        bindTargetRowActions(manager, tbody);

        if (typeof manager.renderDataManagerStatus === 'function') {
            manager.renderDataManagerStatus();
        }
    }

    function editTarget(manager, schoolName) {
        if (!isIndicatorWorkspaceAllowed()) {
            safeToast('指标目标人数仅可在 9 年级维护', 'info');
            return;
        }
        const swal = root.Swal;
        if (!manager || !swal || typeof swal.fire !== 'function') return;

        const targets = readTargetsStateSafe();
        const current = targets[schoolName] || { t1: 0, t2: 0 };
        const currentT1 = Number.isFinite(Number(current.t1)) ? Number(current.t1) : 0;
        const currentT2 = Number.isFinite(Number(current.t2)) ? Number(current.t2) : 0;

        return swal.fire({
            title: `编辑目标 - ${schoolName}`,
            html: `<div style="text-align:left;line-height:2.5;"><label>指标一:</label><input id="swal-t1" type="number" class="swal2-input" value="${currentT1}" style="width:100px;height:30px;"><br><label>指标二:</label><input id="swal-t2" type="number" class="swal2-input" value="${currentT2}" style="width:100px;height:30px;"></div>`,
            showCancelButton: true,
            confirmButtonText: '确定',
            preConfirm: () => ({
                t1: parseInt((root.document && root.document.getElementById('swal-t1')?.value) || 0, 10) || 0,
                t2: parseInt((root.document && root.document.getElementById('swal-t2')?.value) || 0, 10) || 0
            })
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            targets[schoolName] = result.value;
            writeTargetsState(targets);
            if (typeof manager.renderTargets === 'function') manager.renderTargets();
            if (typeof manager.persistGrade9TargetsTemplate === 'function') manager.persistGrade9TargetsTemplate();
            if (typeof root.saveCloudData === 'function') {
                const ok = await root.saveCloudData({ background: true, sourceLabel: 'targets-edit' });
                safeToast(ok ? '✅ 目标修改已暂存，云端正在后台同步' : '⚠️ 目标修改已暂存，本次未成功同步云端', ok ? 'success' : 'warning');
            }
        });
    }

    async function deleteTarget(manager, schoolName) {
        if (!manager) return;
        if (!isIndicatorWorkspaceAllowed()) {
            safeToast('指标目标人数仅可在 9 年级维护', 'info');
            return;
        }
        if (typeof root.confirm === 'function' && !root.confirm('确定删除？')) return;

        const targets = readTargetsStateSafe();
        delete targets[schoolName];
        writeTargetsState(targets);

        if (typeof manager.renderTargets === 'function') manager.renderTargets();
        if (typeof manager.persistGrade9TargetsTemplate === 'function') manager.persistGrade9TargetsTemplate();
        if (typeof root.saveCloudData === 'function') {
            const ok = await root.saveCloudData({ background: true, sourceLabel: 'targets-delete' });
            safeToast(ok ? '✅ 目标删除已暂存，云端正在后台同步' : '⚠️ 目标删除已暂存，本次未成功同步云端', ok ? 'success' : 'warning');
        }
        if (typeof manager.renderDataManagerStatus === 'function') manager.renderDataManagerStatus();
    }

    function handleTargetUpload(manager, input) {
        if (!manager || !input) return;
        if (!isIndicatorWorkspaceAllowed()) {
            safeToast('指标目标人数仅可在 9 年级维护', 'info');
            return;
        }
        if (typeof root.isArchiveLocked === 'function' && root.isArchiveLocked()) {
            safeAlert('⛔ 当前考试已封存，禁止导入目标人数');
            return;
        }

        const file = input.files && input.files[0];
        if (!file) return;
        if (typeof root.FileReader !== 'function' || !root.XLSX || typeof root.XLSX.read !== 'function') {
            safeAlert('导入失败：环境缺少文件读取或 Excel 解析能力');
            return;
        }

        const reader = new root.FileReader();
        reader.onload = async function (event) {
            try {
                const result = event && event.target ? event.target.result : null;
                const data = new Uint8Array(result || []);
                const workbook = root.XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook && Array.isArray(workbook.SheetNames) ? workbook.SheetNames[0] : '';
                const firstSheet = firstSheetName && workbook.Sheets ? workbook.Sheets[firstSheetName] : null;
                const json = root.XLSX.utils && typeof root.XLSX.utils.sheet_to_json === 'function'
                    ? root.XLSX.utils.sheet_to_json(firstSheet)
                    : [];
                if (!Array.isArray(json) || json.length === 0) {
                    safeAlert('空表格');
                    return;
                }

                const targets = readTargetsStateSafe();
                const schools = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
                let successCount = 0;
                let errorCount = 0;
                let duplicateCount = 0;
                const seen = new Set();
                const errors = [];

                json.forEach((row, idx) => {
                    const rowNo = idx + 2;
                    const rawName = row['学校名称'] || row['学校'];
                    const t1Key = Object.keys(row || {}).find((key) => key.includes('指标一') || key.includes('目标一'));
                    const t2Key = Object.keys(row || {}).find((key) => key.includes('指标二') || key.includes('目标二'));

                    if (!rawName) {
                        errorCount += 1;
                        errors.push(`第 ${rowNo} 行：学校名称为空`);
                        return;
                    }

                    const existingKey = typeof root.resolveSchoolNameFromCollection === 'function'
                        ? root.resolveSchoolNameFromCollection(targets || {}, rawName)
                        : '';
                    const name = typeof root.getCanonicalSchoolName === 'function'
                        ? root.getCanonicalSchoolName(rawName, [...Object.keys(targets || {}), ...Object.keys(schools), rawName])
                        : String(rawName || '').trim();
                    const normalizedName = typeof root.normalizeSchoolName === 'function'
                        ? (root.normalizeSchoolName(name) || name)
                        : name;
                    if (seen.has(normalizedName)) duplicateCount += 1;
                    seen.add(normalizedName);

                    const t1 = parseInt((t1Key && row[t1Key]) || row['指标一目标人数'] || 0, 10);
                    const t2 = parseInt((t2Key && row[t2Key]) || row['指标二目标人数'] || 0, 10);
                    if (Number.isNaN(t1) || Number.isNaN(t2)) {
                        errorCount += 1;
                        errors.push(`第 ${rowNo} 行：目标人数非数字 (${name})`);
                        return;
                    }

                    if (existingKey && existingKey !== name) delete targets[existingKey];
                    targets[name] = { t1, t2 };
                    successCount += 1;
                });

                writeTargetsState(targets);
                if (typeof manager.renderTargets === 'function') manager.renderTargets();
                if (typeof manager.persistGrade9TargetsTemplate === 'function') manager.persistGrade9TargetsTemplate();

                if (typeof root.saveCloudData === 'function') {
                    const ok = await root.saveCloudData({ background: true, sourceLabel: 'targets-upload' });
                    safeToast(ok ? '✅ 目标数据已写入本地缓存，云端正在后台同步' : '⚠️ 目标数据已暂存，本次未成功同步云端', ok ? 'success' : 'warning');
                }

                const message = `✅ 导入完成：成功 ${successCount} 条，重复 ${duplicateCount} 条，错误 ${errorCount} 条。`;
                if (errors.length > 0 && root.Swal && typeof root.Swal.fire === 'function') {
                    root.Swal.fire(
                        '导入结果',
                        `<div style="text-align:left; font-size:12px;">${escapeHtml(message)}<br><br>${errors.slice(0, 8).map(escapeHtml).join('<br>')}${errors.length > 8 ? '<br>...' : ''}</div>`,
                        errorCount > 0 ? 'warning' : 'success'
                    );
                } else {
                    safeAlert(message);
                }

                input.value = '';
            } catch (error) {
                safeAlert(`失败：${error && error.message ? error.message : String(error)}`);
            }
        };

        reader.readAsArrayBuffer(file);
    }

    return {
        renderTargets,
        editTarget,
        deleteTarget,
        handleTargetUpload
    };
});
