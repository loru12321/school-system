/*
 * 指标生目标编辑器按需运行时模块。
 *
 * 目标编辑器只在用户点击“在线调整目标”时使用，因此不再占用首屏
 * app.js 体积。模块只读写 window 上的状态门面，不改变目标数据结构、
 * 学校名称归一化或指标生核算公式。
 */
(function (root) {
    if (!root || root.__TARGET_EDITOR_RUNTIME_PATCHED__) return;

    function readSchools() {
        return root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
    }

    function escapeHtml(value) {
        const runtimeEscape = root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
            ? root.SchoolRuntime.escapeHtml
            : null;
        if (runtimeEscape) return runtimeEscape(value);
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function readTargets() {
        if (typeof root.readTargetsState === 'function') {
            const targets = root.readTargetsState();
            if (targets && typeof targets === 'object' && !Array.isArray(targets)) return targets;
        }
        return root.TARGETS && typeof root.TARGETS === 'object' ? root.TARGETS : {};
    }

    function normalizeTargets() {
        if (typeof root.ensureNormalizedTargets === 'function') return root.ensureNormalizedTargets() || {};
        return readTargets();
    }

    function targetForSchool(schoolName) {
        if (typeof root.getTargetConfigBySchool === 'function') {
            return root.getTargetConfigBySchool(schoolName) || { value: null };
        }
        const targets = readTargets();
        return { value: targets[schoolName] || null };
    }

    function getSchoolCanonicalName(schoolName) {
        const candidates = [...Object.keys(readTargets()), ...Object.keys(readSchools()), schoolName];
        if (typeof root.getCanonicalSchoolName === 'function') {
            return root.getCanonicalSchoolName(schoolName, candidates);
        }
        return String(schoolName || '').trim();
    }

    function safeAlert(message, type = 'warning') {
        if (root.UI && typeof root.UI.alert === 'function') return root.UI.alert(message, type);
        if (typeof root.alert === 'function') return root.alert(message);
        return undefined;
    }

    function getRankParams() {
        if (typeof root.getIndicatorRankParams === 'function') return root.getIndicatorRankParams();
        const indicator = root.SYS_VARS?.indicator || {};
        const raw1 = indicator.ind1 || root.document?.getElementById('dm_ind1_input')?.value || root.document?.getElementById('ind1')?.value || '';
        const raw2 = indicator.ind2 || root.document?.getElementById('dm_ind2_input')?.value || root.document?.getElementById('ind2')?.value || '';
        return {
            r1: parseInt(String(raw1).trim(), 10) || 0,
            r2: parseInt(String(raw2).trim(), 10) || 0
        };
    }

    function openTargetEditor() {
        const schools = readSchools();
        if (Object.keys(schools).length === 0) {
            safeAlert('请先上传成绩数据，系统需要读取学校列表。');
            return false;
        }

        normalizeTargets();
        const tbody = root.document?.querySelector('#target-editor-table tbody');
        if (!tbody) return false;

        tbody.innerHTML = Object.keys(schools).map((schoolName) => {
            const target = targetForSchool(schoolName).value || { t1: 0, t2: 0 };
            return `
                <tr data-school="${escapeHtml(schoolName)}">
                    <td style="font-weight:bold;">${escapeHtml(schoolName)}</td>
                    <td>
                        <input type="number" class="inp-t1" value="${Number(target.t1) || 0}" style="width:80px; text-align:center; border:1px solid #93c5fd;">
                    </td>
                    <td>
                        <input type="number" class="inp-t2" value="${Number(target.t2) || 0}" style="width:80px; text-align:center; border:1px solid #fdba74;">
                    </td>
                </tr>
            `;
        }).join('');

        const modal = root.document.getElementById('target-editor-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
        }
        return true;
    }

    function saveTargetEditor() {
        const rows = root.document?.querySelectorAll('#target-editor-table tbody tr');
        if (!rows) return false;

        const targets = normalizeTargets();
        if (typeof root.setTargetsState === 'function') root.setTargetsState(targets);
        let updateCount = 0;

        rows.forEach((row) => {
            const rawSchool = row.dataset.school || '';
            const school = getSchoolCanonicalName(rawSchool);
            if (!school) return;
            const t1 = parseInt(row.querySelector('.inp-t1')?.value, 10) || 0;
            const t2 = parseInt(row.querySelector('.inp-t2')?.value, 10) || 0;
            targets[school] = { t1, t2 };
            updateCount += 1;
        });

        if (typeof root.setTargetsState === 'function') root.setTargetsState(normalizeTargets());
        else root.TARGETS = normalizeTargets();

        const modal = root.document.getElementById('target-editor-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }

        if (root.UI && typeof root.UI.toast === 'function') {
            root.UI.toast(`✅ 已更新 ${updateCount} 所学校的目标设定`, 'success');
        }

        const { r1, r2 } = getRankParams();
        if (r1 && r2 && typeof root.calcIndicators === 'function') {
            root.calcIndicators();
        } else {
            safeAlert('目标已保存！\n请记得在上方输入框设置【划线名次】，然后点击【开始计算】。', 'info');
        }
        return true;
    }

    root.openTargetEditor = openTargetEditor;
    root.saveTargetEditor = saveTargetEditor;
    root.__TARGET_EDITOR_RUNTIME_PATCHED__ = true;
})(typeof globalThis !== 'undefined' ? globalThis : this);
