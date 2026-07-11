(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerStudentRuntime) return;
    root.DataManagerStudentRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerStudentRuntime(root) {
    function ensureStudentSelection(manager) {
        if (!manager) return new Set();
        if (manager.studentSelection instanceof Set) return manager.studentSelection;

        let selection = new Set();
        if (manager.studentSelection && typeof manager.studentSelection.forEach === 'function') {
            manager.studentSelection.forEach((item) => selection.add(item));
        }
        manager.studentSelection = selection;
        return selection;
    }

    function getRawDataRef() {
        if (Array.isArray(root.RAW_DATA)) return root.RAW_DATA;
        try {
            if (typeof RAW_DATA !== 'undefined' && Array.isArray(RAW_DATA)) return RAW_DATA;
        } catch (_) { }
        return null;
    }

    function syncRawDataRef(rawData) {
        if (!Array.isArray(rawData)) return;
        root.RAW_DATA = rawData;
        try {
            if (typeof RAW_DATA !== 'undefined') RAW_DATA = rawData;
        } catch (_) { }
    }

    function queryStudentTableBody() {
        const doc = root.document;
        if (!doc || typeof doc.querySelector !== 'function') return null;
        return doc.querySelector('#dm-student-table tbody');
    }

    function renderStudents(manager, keyword) {
        const rawData = getRawDataRef();
        if (!manager || !Array.isArray(rawData)) return;

        const normalizedKeyword = String(keyword || '').trim().toLowerCase();
        let list = null;
        if (normalizedKeyword) {
            const filterSignature = `${Number(root.__RAW_DATA_VERSION || 0)}::${rawData.length}::${normalizedKeyword}`;
            const cachedFilter = manager.studentFilterCache && manager.studentFilterCache.signature === filterSignature
                ? manager.studentFilterCache.list
                : null;
            if (cachedFilter) {
                list = cachedFilter;
            } else {
                list = [];
                for (let index = 0; index < rawData.length; index += 1) {
                    const student = rawData[index] || {};
                const name = String(student.name != null ? student.name : '').toLowerCase();
                const examId = String(student.id != null ? student.id : '');
                const klass = String(student.class != null ? student.class : '').toLowerCase();
                const school = String(student.school != null ? student.school : '').toLowerCase();
                if (!name.includes(normalizedKeyword)
                    && !examId.includes(normalizedKeyword)
                    && !klass.includes(normalizedKeyword)
                    && !school.includes(normalizedKeyword)) {
                    continue;
                }
                    list.push({ student, _originalIndex: index });
                }
                manager.studentFilterCache = { signature: filterSignature, list };
            }
        }

        manager.pagination = manager.pagination || { page: 1, size: 20, total: 0 };
        if (!Number.isFinite(manager.pagination.size) || manager.pagination.size <= 0) {
            manager.pagination.size = 20;
        }
        if (!Number.isFinite(manager.pagination.page)) {
            manager.pagination.page = 1;
        }

        manager.pagination.total = list ? list.length : rawData.length;
        const totalPages = Math.ceil(manager.pagination.total / manager.pagination.size) || 1;
        if (manager.pagination.page > totalPages) manager.pagination.page = totalPages;
        if (manager.pagination.page < 1) manager.pagination.page = 1;

        const start = (manager.pagination.page - 1) * manager.pagination.size;
        const pageData = list
            ? list.slice(start, start + manager.pagination.size)
            : rawData.slice(start, start + manager.pagination.size).map((student, offset) => ({
                student,
                _originalIndex: start + offset
            }));
        const validIndexSet = list ? new Set(list.map((item) => item._originalIndex)) : null;
        const selection = ensureStudentSelection(manager);
        selection.forEach((idx) => {
            if (validIndexSet) {
                if (!validIndexSet.has(idx)) selection.delete(idx);
            } else if (idx < 0 || idx >= rawData.length) {
                selection.delete(idx);
            }
        });

        const tbody = queryStudentTableBody();
        if (!tbody) return;

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">无数据</td></tr>';
        } else {
            const rows = pageData.map((item) => {
                const student = item && item.student ? item.student : {};
                const school = student.school != null ? student.school : '';
                const klass = student.class != null ? student.class : '';
                const name = student.name != null ? student.name : '';
                const examId = student.id != null ? student.id : '';
                const total = student.total != null ? student.total : '';
                const originalIndex = item && Number.isInteger(item._originalIndex) ? item._originalIndex : -1;
                return `
                <tr>
                    <td style="text-align:center;"><input type="checkbox" class="dm-stu-select" data-idx="${originalIndex}" ${selection.has(originalIndex) ? 'checked' : ''} onchange="DataManager.toggleStudentSelection(this)"></td>
                    <td>${school}</td>
                    <td>${klass}</td>
                    <td style="font-weight:bold;">${name}</td>
                    <td>${examId}</td>
                    <td>${total}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="DataManager.editStudent(${originalIndex})" style="padding:2px 6px; font-size:11px;">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="DataManager.deleteStudent(${originalIndex})" style="padding:2px 6px; background:#dc2626; font-size:11px;">删除</button>
                    </td>
                </tr>`;
            });
            tbody.innerHTML = rows.join('');
        }

        if (typeof manager.updateStudentSelectionUI === 'function') {
            manager.updateStudentSelectionUI();
        }
        if (typeof manager.updatePaginationUI === 'function') {
            manager.updatePaginationUI(totalPages);
        }
    }

    function toggleStudentSelection(manager, inputEl) {
        if (!manager || !inputEl) return;
        const idx = parseInt(inputEl.dataset && inputEl.dataset.idx, 10);
        if (Number.isNaN(idx)) return;

        const selection = ensureStudentSelection(manager);
        if (inputEl.checked) selection.add(idx);
        else selection.delete(idx);

        if (typeof manager.updateStudentSelectionUI === 'function') {
            manager.updateStudentSelectionUI();
        }
    }

    function toggleStudentSelectAll(manager, checked) {
        if (!manager) return;
        const doc = root.document;
        if (!doc || typeof doc.querySelectorAll !== 'function') return;

        const selection = ensureStudentSelection(manager);
        const boxes = Array.from(doc.querySelectorAll('#dm-student-table tbody .dm-stu-select'));
        boxes.forEach((box) => {
            box.checked = !!checked;
            const idx = parseInt(box.dataset && box.dataset.idx, 10);
            if (Number.isNaN(idx)) return;
            if (checked) selection.add(idx);
            else selection.delete(idx);
        });

        if (typeof manager.updateStudentSelectionUI === 'function') {
            manager.updateStudentSelectionUI();
        }
    }

    function updateStudentSelectionUI(manager) {
        if (!manager) return;
        const doc = root.document;
        if (!doc || typeof doc.querySelectorAll !== 'function' || typeof doc.getElementById !== 'function') return;

        const selection = ensureStudentSelection(manager);
        const boxes = Array.from(doc.querySelectorAll('#dm-student-table tbody .dm-stu-select'));
        const headerBox = doc.getElementById('dm-stu-select-all');
        const countEl = doc.getElementById('dm-stu-selected-count');
        const batchBtn = doc.getElementById('dm-stu-batch-delete');

        let visibleSelected = 0;
        boxes.forEach((box) => {
            const idx = parseInt(box.dataset && box.dataset.idx, 10);
            if (!Number.isNaN(idx) && selection.has(idx)) {
                box.checked = true;
                visibleSelected += 1;
            }
        });

        if (headerBox) {
            headerBox.indeterminate = visibleSelected > 0 && visibleSelected < boxes.length;
            headerBox.checked = boxes.length > 0 && visibleSelected === boxes.length;
        }
        if (countEl) countEl.textContent = `已选 ${selection.size} 项`;
        if (batchBtn) {
            batchBtn.disabled = selection.size === 0;
            batchBtn.style.opacity = selection.size === 0 ? '0.6' : '1';
        }
    }

    function deleteSelectedStudents(manager) {
        if (!manager) return;
        const rawData = getRawDataRef();
        if (!Array.isArray(rawData)) return;

        const selection = ensureStudentSelection(manager);
        const indexes = Array.from(selection).filter((idx) => Number.isInteger(idx));
        if (!indexes.length) {
            if (typeof root.alert === 'function') root.alert('请先勾选要删除的学生');
            return;
        }

        if (typeof root.confirm === 'function') {
            const confirmed = root.confirm(`⚠️ 确定删除选中的 ${indexes.length} 名学生吗？`);
            if (!confirmed) return;
        }

        indexes.sort((a, b) => b - a).forEach((idx) => {
            if (idx >= 0 && idx < rawData.length) rawData.splice(idx, 1);
        });
        syncRawDataRef(rawData);
        selection.clear();

        if (typeof manager.renderCurrentTab === 'function') {
            manager.renderCurrentTab();
        }
        if (root.UI && typeof root.UI === 'object' && typeof root.UI.toast === 'function') {
            root.UI.toast(`已暂存删除 ${indexes.length} 项 (请点击保存)`, 'info');
        }
    }

    function changePage(manager, delta) {
        if (!manager) return;
        manager.pagination = manager.pagination || { page: 1 };
        const step = Number(delta);
        manager.pagination.page = Number.isFinite(manager.pagination.page) ? manager.pagination.page : 1;
        manager.pagination.page += Number.isFinite(step) ? step : 0;
        if (typeof manager.renderCurrentTab === 'function') {
            manager.renderCurrentTab();
        }
    }

    return {
        renderStudents,
        toggleStudentSelection,
        toggleStudentSelectAll,
        updateStudentSelectionUI,
        deleteSelectedStudents,
        changePage
    };
});
