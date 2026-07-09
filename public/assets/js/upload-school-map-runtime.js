(() => {
    if (typeof window === 'undefined' || window.__UPLOAD_SCHOOL_MAP_RUNTIME__) return;
    window.__UPLOAD_SCHOOL_MAP_RUNTIME__ = true;

    function getUploadSchoolStandardOptions(rawNames = []) {
        const options = new Set();
        const add = (value) => {
            const text = String(value || '').trim();
            if (text && !/^Sheet\d+$/i.test(text) && !/教育局|教体局|市局|区局/.test(text)) options.add(text);
        };
        (window.SCHOOL_ALIAS_GROUPS || []).forEach((group) => add(group?.canonical));
        (window.COUNTY_STANDARD_SCHOOL_NAMES || []).forEach(add);
        Object.keys(window.TARGETS || {}).forEach(add);
        Object.keys(window.SCHOOLS || {}).forEach(add);
        rawNames.forEach((name) => {
            const canonical = typeof window.getCanonicalSchoolName === 'function'
                ? window.getCanonicalSchoolName(name, Array.from(options))
                : '';
            add(canonical || name);
        });
        add(window.MY_SCHOOL || window.DEFAULT_MY_SCHOOL_NAME);
        return Array.from(options).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function inferUploadStandardSchoolName(rawName, options = []) {
        const raw = String(rawName || '').trim();
        if (!raw) return '';
        const candidates = Array.isArray(options) ? options.filter(Boolean) : [];
        if (typeof window.getCanonicalSchoolName === 'function') {
            const canonical = window.getCanonicalSchoolName(raw, candidates);
            if (canonical) return canonical;
        }
        if (typeof window.resolveSchoolNameFromCollection === 'function') {
            const resolved = window.resolveSchoolNameFromCollection(candidates, raw);
            if (resolved) return resolved;
        }
        return raw;
    }

    function rebuildSchoolsFromRawData() {
        const nextSchools = {};
        (Array.isArray(window.RAW_DATA) ? window.RAW_DATA : []).forEach((stu) => {
            const school = String(stu?.school || '').trim() || '未知学校';
            if (!nextSchools[school]) nextSchools[school] = { name: school, students: [], metrics: {}, rankings: {} };
            nextSchools[school].students.push(stu);
        });
        if (typeof window.setSchools === 'function') window.setSchools(nextSchools);
        window.SCHOOLS = nextSchools;
        return nextSchools;
    }

    function applyUploadSchoolNameMappings(mapping = {}) {
        const rows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
        rows.forEach((stu) => {
            const raw = String(stu?.originalSchoolName || stu?.school || '').trim();
            stu.school = String(mapping[raw] || stu?.school || raw || '未知学校').trim();
        });
        if (typeof window.setRawData === 'function') window.setRawData(rows);
        rebuildSchoolsFromRawData();

        const existing = typeof window.readSchoolAliasState === 'function'
            ? window.readSchoolAliasState()
            : (window.SYS_VARS?.schoolAliases || []);
        const aliasMap = new Map((Array.isArray(existing) ? existing : []).map((item) => [
            `${String(item?.alias || '').trim()}=>${String(item?.canonical || '').trim()}`,
            { alias: String(item?.alias || '').trim(), canonical: String(item?.canonical || '').trim() }
        ]));
        Object.entries(mapping).forEach(([alias, canonical]) => {
            const rawAlias = String(alias || '').trim();
            const standard = String(canonical || '').trim();
            if (!rawAlias || !standard || rawAlias === standard) return;
            aliasMap.set(`${rawAlias}=>${standard}`, { alias: rawAlias, canonical: standard });
        });
        const nextAliases = Array.from(aliasMap.values()).filter((item) => item.alias && item.canonical);
        if (typeof window.setSchoolAliasState === 'function') window.setSchoolAliasState(nextAliases);
        else {
            window.SYS_VARS = window.SYS_VARS || {};
            window.SYS_VARS.schoolAliases = nextAliases;
        }
        if (typeof window.persistSchoolAliasSettingsLocal === 'function') window.persistSchoolAliasSettingsLocal();
    }

    function buildUploadSchoolMappingRows() {
        const counter = new Map();
        (Array.isArray(window.RAW_DATA) ? window.RAW_DATA : []).forEach((row) => {
            const raw = String(row?.originalSchoolName || row?.school || '').trim();
            if (raw) counter.set(raw, (counter.get(raw) || 0) + 1);
        });
        const rawNames = Array.from(counter.keys());
        const options = getUploadSchoolStandardOptions(rawNames);
        const rows = rawNames.map((raw) => ({
            raw,
            count: counter.get(raw) || 0,
            standard: inferUploadStandardSchoolName(raw, options)
        })).sort((a, b) => b.count - a.count || a.raw.localeCompare(b.raw, 'zh-CN'));
        return { rows, options };
    }

    let uploadSchoolMappingConfirmation = {
        confirmed: false,
        confirmedAt: 0,
        mapping: null
    };

    function resetUploadSchoolMappingConfirmation() {
        uploadSchoolMappingConfirmation = {
            confirmed: false,
            confirmedAt: 0,
            mapping: null
        };
    }

    function markUploadSchoolMappingConfirmed(mapping = {}) {
        uploadSchoolMappingConfirmation = {
            confirmed: true,
            confirmedAt: Date.now(),
            mapping: { ...mapping }
        };
        return uploadSchoolMappingConfirmation;
    }

    function hasUploadSchoolMappingConfirmation() {
        return !!uploadSchoolMappingConfirmation.confirmed;
    }

    function getUploadSchoolMappingConfirmation() {
        return uploadSchoolMappingConfirmation && typeof uploadSchoolMappingConfirmation === 'object'
            ? { ...uploadSchoolMappingConfirmation, mapping: { ...(uploadSchoolMappingConfirmation.mapping || {}) } }
            : { confirmed: false, confirmedAt: 0, mapping: {} };
    }

    function bringUploadSchoolMapModalToFront(overlay) {
        if (typeof window.bringSchoolModalToFront === 'function') {
            window.bringSchoolModalToFront(overlay);
            return;
        }
        overlay.style.zIndex = '1000000';
    }

    function renderUploadSchoolMappingModal({ rows, options, title, description, confirmText = '确认并继续', cancelText = '取消' }) {
        return new Promise((resolve, reject) => {
            const overlay = document.createElement('div');
            overlay.className = 'upload-school-map-modal';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.42);display:flex;align-items:center;justify-content:center;padding:20px;';
            const optionHtml = (selected) => options.map((name) => {
                const value = String(name || '').trim();
                return `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`;
            }).join('');
            overlay.innerHTML = `
                <div style="width:min(920px,96vw);max-height:86vh;overflow:hidden;background:#fff;border-radius:12px;box-shadow:0 24px 80px rgba(15,23,42,.25);display:flex;flex-direction:column;">
                    <div style="padding:18px 22px;border-bottom:1px solid #e5e7eb;">
                        <div style="font-size:18px;font-weight:800;color:#0f172a;">${escapeHtml(title || '确认学校名称对应关系')}</div>
                        <div style="margin-top:6px;color:#64748b;font-size:13px;">${escapeHtml(description || '左侧为本次 Excel 识别出的原始学校名，右侧为系统将使用的标准学校名。确认后再计算、排名和同步云端。')}</div>
                    </div>
                    <div style="padding:14px 22px;overflow:auto;">
                        <table class="mobile-card-table" style="width:100%;border-collapse:collapse;">
                            <thead><tr><th style="text-align:left;">本次学校名称</th><th>人数</th><th style="text-align:left;">标准学校名称</th><th>状态</th></tr></thead>
                            <tbody>
                                ${rows.map((row, index) => {
                                    const changed = row.raw !== row.standard;
                                    return `<tr>
                                        <td style="font-weight:700;color:#0f172a;">${escapeHtml(row.raw)}</td>
                                        <td>${row.count}</td>
                                        <td>
                                            <select class="upload-school-map-select" data-index="${index}" data-raw="${escapeHtml(row.raw)}" style="width:100%;min-width:220px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;">
                                                ${optionHtml(row.standard)}
                                                ${options.includes(row.raw) ? '' : `<option value="${escapeHtml(row.raw)}"${row.raw === row.standard ? ' selected' : ''}>${escapeHtml(row.raw)}（保持原名）</option>`}
                                            </select>
                                        </td>
                                        <td style="color:${changed ? '#b45309' : '#047857'};font-weight:700;">${changed ? '自动匹配' : '一致'}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="padding:14px 22px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:12px;align-items:center;">
                        <div style="font-size:12px;color:#64748b;">如发现自动匹配不对，请先在右侧下拉框改正，再点击确认。</div>
                        <div style="display:flex;gap:10px;">
                            <button type="button" class="btn btn-gray" data-action="cancel">${escapeHtml(cancelText)}</button>
                            <button type="button" class="btn btn-blue" data-action="confirm">${escapeHtml(confirmText)}</button>
                        </div>
                    </div>
                </div>`;

            const cleanup = () => overlay.remove();
            overlay.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
                cleanup();
                reject(new Error('已取消学校名称映射确认'));
            });
            overlay.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
                const mapping = {};
                overlay.querySelectorAll('.upload-school-map-select').forEach((select) => {
                    const raw = String(select.getAttribute('data-raw') || '').trim();
                    const standard = String(select.value || '').trim();
                    if (raw && standard) mapping[raw] = standard;
                });
                cleanup();
                resolve(mapping);
            });
            document.body.appendChild(overlay);
            bringUploadSchoolMapModalToFront(overlay);
        });
    }

    function confirmUploadSchoolNameMappings() {
        resetUploadSchoolMappingConfirmation();
        const { rows, options } = buildUploadSchoolMappingRows();
        if (!rows.length) {
            markUploadSchoolMappingConfirmed({});
            return Promise.resolve({});
        }

        return renderUploadSchoolMappingModal({
            rows,
            options,
            title: '确认学校名称对应关系',
            description: '左侧为本次 Excel 识别出的原始学校名，右侧为系统将使用的标准学校名。确认后再计算、排名和同步云端。',
            confirmText: '确认并继续',
            cancelText: '取消上传'
        }).then((mapping) => {
                applyUploadSchoolNameMappings(mapping);
                markUploadSchoolMappingConfirmed(mapping);
                return mapping;
        });
    }

    Object.assign(window, {
        confirmUploadSchoolNameMappings,
        buildUploadSchoolMappingRows,
        applyUploadSchoolNameMappings,
        resetUploadSchoolMappingConfirmation,
        hasUploadSchoolMappingConfirmation,
        getUploadSchoolMappingConfirmation
    });
})();
