(function (root) {
    if (!root) return;

    const escapeHtml = root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
        ? root.SchoolRuntime.escapeHtml
        : (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));

    const originalGetTagsFromHidden = root.getTagsFromHidden;
    const originalRenderTagsUI = root.renderTagsUI;
    const originalAddTagToWidget = root.addTagToWidget;
    const originalRemoveTagFromWidget = root.removeTagFromWidget;
    const originalAddConflictPair = root.addConflictPair;
    const originalUpdateConstraintWidgetsContext = root.updateConstraintWidgetsContext;
    let lastArrangement = null;
    let lastContextSignature = '';
    let lastContextStudents = [];

    function isSeatWidget(wrapperId, hiddenInputId) {
        return String(wrapperId || '').startsWith('widget_adj_')
            || String(hiddenInputId || '').startsWith('adj_c_');
    }

    function getSchools() {
        try {
            if (root.SCHOOLS && typeof root.SCHOOLS === 'object') return root.SCHOOLS;
            if (typeof SCHOOLS !== 'undefined' && SCHOOLS && typeof SCHOOLS === 'object') return SCHOOLS;
        } catch (_) {}
        return {};
    }

    function getSchoolNames() {
        const schools = getSchools();
        if (typeof root.listAvailableSchoolsForCompare === 'function') {
            try {
                const names = root.listAvailableSchoolsForCompare().filter((name) => schools[name]);
                if (names.length) return names;
            } catch (_) {}
        }
        return Object.keys(schools).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
    }

    function getPreferredSchool(schoolNames) {
        const names = Array.isArray(schoolNames) ? schoolNames : [];
        const candidates = [];
        try { candidates.push(root.MY_SCHOOL, root.readCurrentSchool?.()); } catch (_) {}
        const selectedSchool = root.document?.getElementById('mySchoolSelect')?.value;
        if (selectedSchool) candidates.push(selectedSchool);
        const current = candidates.map(value => String(value || '').trim()).find(value => names.includes(value));
        return current || (names.length === 1 ? names[0] : '');
    }

    function toFiniteNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function clampInteger(value, min, max, fallback) {
        const number = Math.round(Number(value));
        if (!Number.isFinite(number)) return fallback;
        return Math.min(Math.max(number, min), max);
    }

    function getClassOptions(schoolName) {
        if (!schoolName) return [];
        if (typeof root.getSchoolClassOptions === 'function') {
            try {
                const classes = root.getSchoolClassOptions(schoolName);
                if (Array.isArray(classes)) return classes.filter((value) => !root.TeachingWorkbenchCohort?.isAllowedGrade || root.TeachingWorkbenchCohort.isAllowedGrade(value));
            } catch (_) {}
        }
        const school = getSchools()[schoolName];
        const students = Array.isArray(school?.students) ? school.students : [];
        return [...new Set(students.map((student) => String(student?.class || '').trim()).filter(Boolean))]
            .filter((value) => !root.TeachingWorkbenchCohort?.isAllowedGrade || root.TeachingWorkbenchCohort.isAllowedGrade(value))
            .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
    }

    function setSelectOptions(select, values, placeholder, preferredValue) {
        if (!select) return '';
        const cleanValues = (Array.isArray(values) ? values : [])
            .map((value) => String(value || '').trim())
            .filter(Boolean);
        const optionSignature = `${String(placeholder || '')}\u0000${cleanValues.join('\u0001')}`;
        if (select.dataset.seatOptionsSignature !== optionSignature) {
            select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${cleanValues
                .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
                .join('')}`;
            select.dataset.seatOptionsSignature = optionSignature;
        }
        const preferred = String(preferredValue || '').trim();
        if (preferred && cleanValues.includes(preferred)) select.value = preferred;
        else select.value = '';
        return select.value || '';
    }

    function getSelectedStudents() {
        const schoolName = root.document?.getElementById('seatAdjSchoolSelect')?.value || '';
        const className = root.document?.getElementById('seatAdjClassSelect')?.value || '';
        const school = getSchools()[schoolName];
        const students = Array.isArray(school?.students) ? school.students : [];
        return students
            .filter((student) => String(student?.class || '') === className)
            .map((student, index) => ({
                ...student,
                name: String(student?.name || '').trim() || `未命名${index + 1}`,
                class: String(student?.class || '').trim(),
                total: toFiniteNumber(student?.total ?? student?.score, 0)
            }));
    }

    function writeContextStudents(students) {
        const list = Array.isArray(students) ? students : [];
        const signature = list
            .map((student) => `${student?.name || ''}\u0001${student?.class || ''}\u0001${student?.total ?? student?.score ?? ''}`)
            .join('\u0002');
        if (signature === lastContextSignature) return lastContextStudents;
        if (typeof root.setCurrentContextStudentsState === 'function') {
            try {
                lastContextStudents = root.setCurrentContextStudentsState(list) || [];
                lastContextSignature = signature;
                return lastContextStudents;
            } catch (_) {}
        }
        root.CURRENT_CONTEXT_STUDENTS = list;
        lastContextStudents = list;
        lastContextSignature = signature;
        return lastContextStudents;
    }

    function readContextStudents() {
        if (typeof root.readCurrentContextStudentsState === 'function') {
            try {
                const students = root.readCurrentContextStudentsState();
                if (Array.isArray(students)) return students;
            } catch (_) {}
        }
        return Array.isArray(root.CURRENT_CONTEXT_STUDENTS) ? root.CURRENT_CONTEXT_STUDENTS : [];
    }

    function getHiddenTags(hiddenInputId) {
        const input = root.document?.getElementById(hiddenInputId);
        if (!input) return [];
        return String(input.value || '')
            .split(/[,;]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function writeHiddenTags(hiddenInputId, tags) {
        const input = root.document?.getElementById(hiddenInputId);
        if (!input) return;
        input.value = (Array.isArray(tags) ? tags : []).join(', ');
    }

    function parseNames(value) {
        return String(value || '')
            .split(/[,;，；]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function parseConflictPairs(value) {
        return parseNames(value)
            .map((item) => item.split(/[&|/、和]/).map((part) => part.trim()).filter(Boolean))
            .filter((parts) => parts.length >= 2)
            .map((parts) => [parts[0], parts[1]]);
    }

    function renderTagsUI(wrapperId, hiddenInputId) {
        const wrapper = root.document?.getElementById(wrapperId);
        if (!wrapper) return;
        const tags = getHiddenTags(hiddenInputId);
        wrapper.querySelectorAll('.tag-chip').forEach((chip) => chip.remove());
        const input = wrapper.querySelector('.tag-input-field');
        tags.forEach((tag) => {
            const chip = root.document.createElement('div');
            chip.className = 'tag-chip';
            chip.innerHTML = `${escapeHtml(tag)} <span class="tag-chip-remove" role="button" tabindex="0" data-tag-remove="${escapeHtml(tag)}">&times;</span>`;
            if (input) wrapper.insertBefore(chip, input);
            else wrapper.appendChild(chip);
        });
    }

    function addTagToWidget(wrapperId, hiddenInputId, name) {
        const cleanName = String(name || '').trim();
        if (!cleanName) return;
        const currentTags = getHiddenTags(hiddenInputId);
        if (!currentTags.includes(cleanName)) {
            currentTags.push(cleanName);
            writeHiddenTags(hiddenInputId, currentTags);
        }
        renderTagsUI(wrapperId, hiddenInputId);
        const input = root.document?.getElementById(wrapperId)?.querySelector('.tag-input-field');
        if (input) {
            input.value = '';
            input.focus();
        }
    }

    function removeTagFromWidget(wrapperId, hiddenInputId, name) {
        const cleanName = String(name || '').trim();
        const nextTags = getHiddenTags(hiddenInputId).filter((tag) => tag !== cleanName);
        writeHiddenTags(hiddenInputId, nextTags);
        renderTagsUI(wrapperId, hiddenInputId);
    }

    function bindTagWidget(wrapperId, hiddenInputId) {
        const wrapper = root.document?.getElementById(wrapperId);
        if (!wrapper || wrapper.dataset.seatRuntimeBound === 'true') return;
        wrapper.dataset.seatRuntimeBound = 'true';
        const input = wrapper.querySelector('.tag-input-field');
        const dropdown = wrapper.querySelector('.suggestion-dropdown');
        wrapper.addEventListener('click', (event) => {
            const removeButton = event.target?.closest?.('[data-tag-remove]');
            if (removeButton) {
                removeTagFromWidget(wrapperId, hiddenInputId, removeButton.getAttribute('data-tag-remove'));
                return;
            }
            if (event.target === wrapper && input) input.focus();
        });
        if (dropdown) {
            dropdown.addEventListener('mousedown', (event) => {
                const item = event.target?.closest?.('[data-seat-suggestion]');
                if (!item) return;
                event.preventDefault();
                addTagToWidget(wrapperId, hiddenInputId, item.getAttribute('data-seat-suggestion'));
                dropdown.style.display = 'none';
            });
        }
        if (input && dropdown) {
            input.addEventListener('input', () => {
                const keyword = String(input.value || '').trim().toLowerCase();
                if (!keyword) {
                    dropdown.style.display = 'none';
                    return;
                }
                const matches = readContextStudents()
                    .filter((student) => String(student?.name || '').toLowerCase().includes(keyword))
                    .slice(0, 8);
                if (!matches.length) {
                    dropdown.style.display = 'none';
                    return;
                }
                dropdown.innerHTML = matches
                    .map((student) => `<div class="suggestion-item" data-seat-suggestion="${escapeHtml(student.name)}">${escapeHtml(student.name)} <small>${escapeHtml(toFiniteNumber(student.total ?? student.score, 0))}分</small></div>`)
                    .join('');
                dropdown.style.display = 'block';
            });
            input.addEventListener('blur', () => {
                root.setTimeout(() => {
                    dropdown.style.display = 'none';
                }, 160);
            });
        }
    }

    function refreshConstraintContext() {
        const students = writeContextStudents(getSelectedStudents());
        ['diff', 'vision', 'psy', 'talk'].forEach((field) => {
            bindTagWidget(`widget_adj_${field}`, `adj_c_${field}`);
            renderTagsUI(`widget_adj_${field}`, `adj_c_${field}`);
        });
        renderTagsUI('widget_adj_conflict', 'adj_c_conflict');
        const options = students
            .slice()
            .sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN', { numeric: true }));
        const html = options.length
            ? `<option value="">--点击选择--</option>${options.map((student) => `<option value="${escapeHtml(student.name)}">${escapeHtml(student.name)}</option>`).join('')}`
            : '<option value="">(暂无学生数据)</option>';
        const selectA = root.document?.getElementById('conflict_sel_a');
        const selectB = root.document?.getElementById('conflict_sel_b');
        const optionSignature = options.map((student) => student.name).join('\u0001');
        if (selectA && selectA.dataset.seatStudentOptionsSignature !== optionSignature) {
            selectA.innerHTML = html;
            selectA.dataset.seatStudentOptionsSignature = optionSignature;
        }
        if (selectB && selectB.dataset.seatStudentOptionsSignature !== optionSignature) {
            selectB.innerHTML = html;
            selectB.dataset.seatStudentOptionsSignature = optionSignature;
        }
        return students;
    }

    function updateSeatAdjSelects() {
        const schoolSelect = root.document?.getElementById('seatAdjSchoolSelect');
        const classSelect = root.document?.getElementById('seatAdjClassSelect');
        if (!schoolSelect || !classSelect) return;
        const schoolNames = getSchoolNames();
        const previousSchool = schoolSelect.value || getPreferredSchool(schoolNames);
        const previousClass = classSelect.value;
        setSelectOptions(schoolSelect, schoolNames, '--请选择学校--', previousSchool);
        const classOptions = getClassOptions(schoolSelect.value);
        setSelectOptions(classSelect, classOptions, '--请选择班级--', previousClass || classOptions[0]);
        schoolSelect.onchange = () => {
            setSelectOptions(classSelect, getClassOptions(schoolSelect.value), '--请选择班级--', '');
            writeContextStudents([]);
            refreshConstraintContext();
        };
        classSelect.onchange = () => {
            refreshConstraintContext();
        };
        refreshConstraintContext();
    }

    function markStudentFlags(students, constraints) {
        const diffSet = new Set([...constraints.diff, ...constraints.talk]);
        const visionSet = new Set(constraints.vision);
        const psySet = new Set(constraints.psy);
        return students.map((student) => ({
            ...student,
            _isDiff: diffSet.has(student.name),
            _isVision: visionSet.has(student.name),
            _isPsy: psySet.has(student.name)
        }));
    }

    function buildSeatOrder(students, strategy) {
        const sorted = students.slice().sort((a, b) => {
            const scoreDiff = toFiniteNumber(b.total, 0) - toFiniteNumber(a.total, 0);
            if (scoreDiff) return scoreDiff;
            return String(a.name).localeCompare(String(b.name), 'zh-CN', { numeric: true });
        });
        if (strategy === 'conversion') {
            const quarter = Math.ceil(sorted.length / 4);
            const layers = [
                sorted.slice(0, quarter),
                sorted.slice(quarter, quarter * 2),
                sorted.slice(quarter * 2, quarter * 3),
                sorted.slice(quarter * 3)
            ];
            const maxLength = Math.max(...layers.map((layer) => layer.length));
            const order = [];
            for (let index = 0; index < maxLength; index += 1) {
                if (layers[0][index]) order.push(layers[0][index]);
                if (layers[2][index]) order.push(layers[2][index]);
                if (layers[1][index]) order.push(layers[1][index]);
                if (layers[3][index]) order.push(layers[3][index]);
            }
            return { order, sorted };
        }
        if (strategy === 'pair') {
            const order = [];
            let left = 0;
            let right = sorted.length - 1;
            while (left <= right) {
                if (left === right) order.push(sorted[left]);
                else order.push(sorted[left], sorted[right]);
                left += 1;
                right -= 1;
            }
            return { order, sorted };
        }
        return { order: sorted, sorted };
    }

    function applyVisionPriority(order) {
        const visionStudents = order.filter((student) => student._isVision);
        if (!visionStudents.length) return order;
        return [...visionStudents, ...order.filter((student) => !student._isVision)];
    }

    function findConflictSafeIndex(order, conflictName, avoidName) {
        for (let index = order.length - 1; index >= 0; index -= 1) {
            const candidate = order[index];
            if (!candidate || candidate.name === conflictName || candidate.name === avoidName) continue;
            const nearAvoid = Math.abs(order.findIndex((student) => student.name === avoidName) - index) <= 1;
            if (!nearAvoid) return index;
        }
        return -1;
    }

    function applyConflictSeparation(order, conflictPairs) {
        const nextOrder = order.slice();
        for (let pass = 0; pass < 3; pass += 1) {
            conflictPairs.forEach(([first, second]) => {
                const firstIndex = nextOrder.findIndex((student) => student.name === first);
                const secondIndex = nextOrder.findIndex((student) => student.name === second);
                if (firstIndex === -1 || secondIndex === -1 || Math.abs(firstIndex - secondIndex) > 1) return;
                const safeIndex = findConflictSafeIndex(nextOrder, second, first);
                if (safeIndex >= 0 && safeIndex !== firstIndex && safeIndex !== secondIndex) {
                    [nextOrder[secondIndex], nextOrder[safeIndex]] = [nextOrder[safeIndex], nextOrder[secondIndex]];
                }
            });
        }
        return nextOrder;
    }

    function getLayerClass(index, total) {
        const safeIndex = Math.max(Number(index) || 0, 0);
        const denominator = Math.max(Number(total) || 0, 1);
        const percentile = (safeIndex + 1) / denominator;
        if (percentile <= 0.25) return 'desk-rank-A';
        if (percentile <= 0.5) return 'desk-rank-B';
        if (percentile <= 0.75) return 'desk-rank-C';
        return 'desk-rank-D';
    }

    function buildLayerClassByName(sortedStudents) {
        const byName = new Map();
        const denominator = Math.max(sortedStudents.length, 1);
        sortedStudents.forEach((student, index) => {
            if (!byName.has(student.name)) byName.set(student.name, getLayerClass(index, denominator));
        });
        return byName;
    }

    function bindDeskDrag(desk) {
        desk.draggable = true;
        desk.ondragstart = (event) => {
            event.dataTransfer?.setData('text/plain', desk.dataset.studentName || '');
            desk.classList.add('dragging');
            root.dragSrcEl = desk;
        };
        desk.ondragover = (event) => event.preventDefault();
        desk.ondragend = () => desk.classList.remove('dragging');
        desk.ondrop = (event) => {
            event.preventDefault();
            if (!root.dragSrcEl || root.dragSrcEl === desk) return;
            const sourceHtml = root.dragSrcEl.innerHTML;
            const sourceClass = root.dragSrcEl.className;
            const sourceStyle = root.dragSrcEl.style.cssText;
            const sourceName = root.dragSrcEl.dataset.studentName || '';
            root.dragSrcEl.innerHTML = desk.innerHTML;
            root.dragSrcEl.className = desk.className;
            root.dragSrcEl.style.cssText = desk.style.cssText;
            root.dragSrcEl.dataset.studentName = desk.dataset.studentName || '';
            desk.innerHTML = sourceHtml;
            desk.className = sourceClass;
            desk.style.cssText = sourceStyle;
            desk.dataset.studentName = sourceName;
            root.dragSrcEl.classList.remove('dragging');
        };
    }

    function createDesk(student, layerClassByName) {
        const desk = root.document.createElement('div');
        desk.className = `desk ${layerClassByName.get(student.name) || 'desk-rank-D'}`;
        desk.dataset.studentName = student.name;
        if (student._isDiff) desk.classList.add('is-diff');
        if (student._isVision) desk.classList.add('is-vision');
        if (student._isPsy) desk.classList.add('is-psy');
        desk.innerHTML = `<div class="desk-name">${escapeHtml(student.name)}</div><div class="desk-info">${escapeHtml(toFiniteNumber(student.total, 0))}分</div>`;
        bindDeskDrag(desk);
        return desk;
    }

    function renderSeatLayout(order, sortedStudents, groupsCount, colsPerGroup, strategy) {
        const container = root.document?.getElementById('seat-adj-container');
        if (!container) return 0;
        container.innerHTML = '';
        container.style.setProperty('--seat-groups', String(groupsCount));
        container.style.setProperty('--seat-cols', String(colsPerGroup));
        container.style.gridTemplateColumns = `repeat(${groupsCount}, minmax(${Math.max(colsPerGroup * 84, 180)}px, 1fr))`;
        const rowCapacity = Math.max(groupsCount * colsPerGroup, 1);
        const totalRows = Math.ceil(order.length / rowCapacity);
        const layerClassByName = buildLayerClassByName(sortedStudents);
        const groupElements = [];
        const fragment = root.document.createDocumentFragment();
        for (let groupIndex = 0; groupIndex < groupsCount; groupIndex += 1) {
            const group = root.document.createElement('div');
            group.className = 'seat-group';
            group.style.gridTemplateColumns = `repeat(${colsPerGroup}, minmax(72px, 1fr))`;
            groupElements.push(group);
            fragment.appendChild(group);
        }
        for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
            for (let groupIndex = 0; groupIndex < groupsCount; groupIndex += 1) {
                for (let colIndex = 0; colIndex < colsPerGroup; colIndex += 1) {
                    let seatIndex = rowIndex * rowCapacity + groupIndex * colsPerGroup + colIndex;
                    if (strategy === 'balanced' && rowIndex % 2 !== 0) {
                        seatIndex = rowIndex * rowCapacity + groupIndex * colsPerGroup + (colsPerGroup - 1 - colIndex);
                    }
                    const group = groupElements[groupIndex];
                    if (order[seatIndex]) group.appendChild(createDesk(order[seatIndex], layerClassByName));
                    else {
                        const spacer = root.document.createElement('div');
                        spacer.className = 'desk desk-empty';
                        spacer.setAttribute('aria-hidden', 'true');
                        group.appendChild(spacer);
                    }
                }
            }
        }
        container.appendChild(fragment);
        return container.querySelectorAll('.desk:not(.desk-empty)').length;
    }

    function getStrategyText(strategy) {
        if (strategy === 'balanced') return '团队PK型：按成绩蛇形排列，尽量让相邻学习共同体保持均衡。';
        if (strategy === 'pair') return '传统互助型：高分段与低分段结对，更适合一对一互助场景。';
        return '提分转化型：A层带C层、B层带D层，优先服务临界生和后进生转化。';
    }

    function generateSeatSuggestions() {
        const schoolSelect = root.document?.getElementById('seatAdjSchoolSelect');
        const classSelect = root.document?.getElementById('seatAdjClassSelect');
        const groupsInput = root.document?.getElementById('seatAdjGroups');
        const colsInput = root.document?.getElementById('seatAdjCols');
        const strategySelect = root.document?.getElementById('seatAdjStrategy');
        const schoolName = schoolSelect?.value || '';
        const className = classSelect?.value || '';
        if (!schoolName || !className) {
            root.alert?.('请先选择学校和班级');
            return { ok: false, count: 0, deskCount: 0, reason: 'missing_scope' };
        }
        const rawStudents = getSelectedStudents();
        if (!rawStudents.length) {
            root.alert?.('该班级无学生数据');
            return { ok: false, count: 0, deskCount: 0, reason: 'empty_class' };
        }
        const groupsCount = clampInteger(groupsInput?.value, 1, 4, 2);
        const colsPerGroup = clampInteger(colsInput?.value, 2, 6, 4);
        if (groupsInput) groupsInput.value = String(groupsCount);
        if (colsInput) colsInput.value = String(colsPerGroup);
        const strategy = ['conversion', 'balanced', 'pair'].includes(strategySelect?.value)
            ? strategySelect.value
            : 'conversion';
        const constraints = {
            diff: parseNames(root.document?.getElementById('adj_c_diff')?.value),
            vision: parseNames(root.document?.getElementById('adj_c_vision')?.value),
            psy: parseNames(root.document?.getElementById('adj_c_psy')?.value),
            talk: parseNames(root.document?.getElementById('adj_c_talk')?.value)
        };
        const conflictPairs = parseConflictPairs(root.document?.getElementById('adj_c_conflict')?.value);
        const markedStudents = markStudentFlags(rawStudents, constraints);
        const { order, sorted } = buildSeatOrder(markedStudents, strategy);
        const orderedWithVision = applyVisionPriority(order);
        const finalOrder = applyConflictSeparation(orderedWithVision, conflictPairs);
        const workspace = root.document?.getElementById('seat-adj-workspace');
        const strategyDesc = root.document?.getElementById('seat-strategy-desc');
        const countDisplay = root.document?.getElementById('seat-count-display');
        const stats = root.document?.getElementById('seat-stats');
        if (workspace) workspace.classList.remove('hidden');
        if (strategyDesc) strategyDesc.textContent = getStrategyText(strategy);
        if (countDisplay) countDisplay.textContent = `当前班级：${className} | 总人数：${rawStudents.length} 人 | ${groupsCount} 个大组 × 每组 ${colsPerGroup} 列`;
        const deskCount = renderSeatLayout(finalOrder, sorted, groupsCount, colsPerGroup, strategy);
        if (stats) {
            const flaggedCount = markedStudents.filter((student) => student._isDiff || student._isVision || student._isPsy).length;
            stats.textContent = strategy === 'balanced'
                ? `已生成 ${deskCount} 个座位，含 ${flaggedCount} 名特殊关注学生；团队PK型建议以 4 人共同体为管理单元。`
                : `已生成 ${deskCount} 个座位，含 ${flaggedCount} 名特殊关注学生。`;
        }
        lastArrangement = {
            ok: deskCount === finalOrder.length && deskCount > 0,
            count: finalOrder.length,
            deskCount,
            schoolName,
            className,
            strategy,
            groupsCount,
            colsPerGroup,
            finite: finalOrder.every((student) => Number.isFinite(Number(student.total)))
        };
        root.SEAT_ADJUSTMENT_LAST_RESULT = lastArrangement;
        return lastArrangement;
    }

    function renderSeatGrid() {
        const workspace = root.document?.getElementById('seat-adj-workspace');
        if (workspace && !workspace.classList.contains('hidden')) return generateSeatSuggestions();
        return lastArrangement || { ok: true, count: 0, deskCount: 0 };
    }

    function bindActionButtons() {
        root.document?.querySelectorAll('[data-seat-adj-action]').forEach((button) => {
            if (button.dataset.seatAdjActionBound === 'true') return;
            button.dataset.seatAdjActionBound = 'true';
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const action = String(button.getAttribute('data-seat-adj-action') || '').trim();
                if (action === 'generate') {
                    generateSeatSuggestions();
                    return;
                }
                if (action === 'print' && typeof root.print === 'function') {
                    root.print();
                }
            });
        });
    }

    function addConflictPair(type) {
        if (type !== 'adj') {
            if (typeof originalAddConflictPair === 'function') {
                return originalAddConflictPair.call(root, type);
            }
            return;
        }
        const selectA = root.document?.getElementById('conflict_sel_a');
        const selectB = root.document?.getElementById('conflict_sel_b');
        if (!selectA || !selectB) return;
        if (!selectA.value || !selectB.value) return root.alert?.('请先选择两个学生');
        if (selectA.value === selectB.value) return root.alert?.('不能选择同一个学生');
        addTagToWidget('widget_adj_conflict', 'adj_c_conflict', `${selectA.value}&${selectB.value}`);
        selectA.value = '';
        selectB.value = '';
    }

    root.getTagsFromHidden = function (hiddenInputId) {
        if (isSeatWidget('', hiddenInputId)) return getHiddenTags(hiddenInputId);
        if (typeof originalGetTagsFromHidden === 'function') return originalGetTagsFromHidden.call(root, hiddenInputId);
        return getHiddenTags(hiddenInputId);
    };
    root.renderTagsUI = function (wrapperId, hiddenInputId) {
        if (isSeatWidget(wrapperId, hiddenInputId)) return renderTagsUI(wrapperId, hiddenInputId);
        if (typeof originalRenderTagsUI === 'function') return originalRenderTagsUI.call(root, wrapperId, hiddenInputId);
        return renderTagsUI(wrapperId, hiddenInputId);
    };
    root.addTagToWidget = function (wrapperId, hiddenInputId, name) {
        if (isSeatWidget(wrapperId, hiddenInputId)) return addTagToWidget(wrapperId, hiddenInputId, name);
        if (typeof originalAddTagToWidget === 'function') return originalAddTagToWidget.call(root, wrapperId, hiddenInputId, name);
        return addTagToWidget(wrapperId, hiddenInputId, name);
    };
    root.removeTagFromWidget = function (wrapperId, hiddenInputId, name) {
        if (isSeatWidget(wrapperId, hiddenInputId)) return removeTagFromWidget(wrapperId, hiddenInputId, name);
        if (typeof originalRemoveTagFromWidget === 'function') return originalRemoveTagFromWidget.call(root, wrapperId, hiddenInputId, name);
        return removeTagFromWidget(wrapperId, hiddenInputId, name);
    };
    root.addConflictPair = addConflictPair;
    root.updateConstraintWidgetsContext = function (type) {
        if (String(type || '') === 'adj') return refreshConstraintContext();
        if (typeof originalUpdateConstraintWidgetsContext === 'function') return originalUpdateConstraintWidgetsContext(type);
        return [];
    };
    root.updateSeatAdjSelects = updateSeatAdjSelects;
    root.renderSeatGrid = renderSeatGrid;
    root.generateSeatSuggestions = generateSeatSuggestions;
    root.SeatAdjustmentRuntime = {
        updateSeatAdjSelects,
        refreshConstraintContext,
        generateSeatSuggestions,
        renderSeatGrid,
        getLastResult: () => lastArrangement
    };

    function scheduleInitialRefresh() {
        root.setTimeout(() => {
            if (!root.document?.getElementById('seat-adjustment')) return;
            bindActionButtons();
            updateSeatAdjSelects();
        }, 0);
    }

    if (root.document?.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', scheduleInitialRefresh, { once: true });
    } else {
        scheduleInitialRefresh();
    }
})(typeof window !== 'undefined' ? window : globalThis);
