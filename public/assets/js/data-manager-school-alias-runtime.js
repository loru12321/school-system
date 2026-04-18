(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerSchoolAliasRuntime) return;
    root.DataManagerSchoolAliasRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerSchoolAliasRuntime(root) {
    function safeToast(text, type) {
        if (root.UI && typeof root.UI === 'object' && typeof root.UI.toast === 'function') {
            root.UI.toast(text, type);
        }
    }

    function getCustomAliasRows() {
        if (typeof root.ensureSchoolAliasStore !== 'function') return [];
        return root.ensureSchoolAliasStore()
            .slice()
            .map((item, index) => ({
                index,
                canonical: String(item && item.canonical ? item.canonical : '').trim(),
                alias: String(item && item.alias ? item.alias : '').trim()
            }))
            .filter((item) => item.canonical && item.alias)
            .sort((a, b) => {
                const byCanonical = a.canonical.localeCompare(b.canonical, 'zh-CN');
                return byCanonical !== 0 ? byCanonical : a.alias.localeCompare(b.alias, 'zh-CN');
            });
    }

    function renderSchoolAliasMappings(manager) {
        const doc = root.document;
        if (!doc || typeof doc.getElementById !== 'function') return;

        const defaultTbody = doc.getElementById('dm-default-school-aliases-tbody');
        const customTbody = doc.getElementById('dm-custom-school-aliases-tbody');
        const summaryEl = doc.getElementById('dm-school-aliases-summary');
        if (!defaultTbody && !customTbody && !summaryEl) return;

        const defaultRows = Array.isArray(root.SCHOOL_ALIAS_GROUPS)
            ? root.SCHOOL_ALIAS_GROUPS.slice().sort((a, b) => String(a.canonical || '').localeCompare(String(b.canonical || ''), 'zh-CN'))
            : [];
        const customRows = getCustomAliasRows();

        if (summaryEl) {
            summaryEl.innerHTML = `默认规则 <strong>${defaultRows.length}</strong> 组，自定义补充 <strong>${customRows.length}</strong> 条。系统会优先保留“实验学校”等关键区分，避免把相近学校误并。`;
        }

        if (defaultTbody) {
            defaultTbody.innerHTML = defaultRows.map((row) => `
                <tr>
                    <td style="font-weight:700;">${row.canonical}</td>
                    <td>${(row.aliases || []).join('、') || '-'}</td>
                    <td><span class="badge" style="background:#e2e8f0; color:#475569;">系统默认</span></td>
                </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">暂无默认规则</td></tr>';
        }

        if (customTbody) {
            customTbody.innerHTML = customRows.map((row) => `
                <tr>
                    <td style="font-weight:700;">${row.canonical}</td>
                    <td>${row.alias}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="DataManager.openSchoolAliasEditor(${row.index})" style="padding:2px 8px;">修改</button>
                        <button class="btn btn-sm btn-danger" onclick="DataManager.deleteSchoolAliasMapping(${row.index})" style="padding:2px 8px;">删除</button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">暂无自定义对应，可点击上方“新增对应”补充。</td></tr>';
        }

        if (manager && typeof manager.renderDataManagerStatus === 'function') {
            manager.renderDataManagerStatus();
        }
    }

    async function syncSchoolAliasSettingsFromGateway(manager) {
        const user = typeof root.getCurrentUser === 'function'
            ? root.getCurrentUser()
            : (root.window && root.window.Auth ? root.window.Auth.currentUser : null);
        const role = String(user && user.role ? user.role : '').trim();
        if (role !== 'admin' && role !== 'director') return false;

        if (!(root.EdgeGateway
            && typeof root.EdgeGateway.listAliasRules === 'function'
            && typeof root.EdgeGateway.canUseAuthorizedRequests === 'function'
            && root.EdgeGateway.canUseAuthorizedRequests())) {
            return false;
        }

        const data = await root.EdgeGateway.listAliasRules();
        if (typeof root.mapGatewaySchoolAliasRows !== 'function' || typeof root.replaceCustomSchoolAliasStore !== 'function') {
            return false;
        }
        const remoteRows = root.mapGatewaySchoolAliasRows((data && data.records) || []);
        root.replaceCustomSchoolAliasStore(remoteRows);
        if (manager && typeof manager.renderSchoolAliasMappings === 'function') {
            manager.renderSchoolAliasMappings();
        }
        return true;
    }

    async function persistSchoolAliasSettings(manager) {
        if (typeof root.ensureSchoolAliasStore === 'function') root.ensureSchoolAliasStore();
        if (typeof root.persistSchoolAliasSettingsLocal === 'function') root.persistSchoolAliasSettingsLocal();

        let gatewayOk = false;
        let gatewayError = null;
        if (root.EdgeGateway
            && typeof root.EdgeGateway.saveAliasRules === 'function'
            && typeof root.EdgeGateway.canUseAuthorizedRequests === 'function'
            && root.EdgeGateway.canUseAuthorizedRequests()) {
            try {
                const rows = typeof root.buildSchoolAliasGatewayRows === 'function' ? root.buildSchoolAliasGatewayRows() : [];
                await root.EdgeGateway.saveAliasRules(rows, { replace_scope: true });
                gatewayOk = true;
            } catch (error) {
                gatewayError = error;
                console.warn('[EdgeGateway] school alias save failed:', error && error.message ? error.message : error);
            }
        }

        let snapshotOk = false;
        if (typeof root.saveCloudData === 'function') {
            const ok = await root.saveCloudData({ background: true, sourceLabel: 'school-alias-save' });
            snapshotOk = !!ok;
        }

        if (manager && typeof manager.renderDataManagerStatus === 'function') {
            manager.renderDataManagerStatus();
        }
        if (!(gatewayOk || snapshotOk) && gatewayError) throw gatewayError;
        return gatewayOk || snapshotOk;
    }

    function openSchoolAliasEditor(manager, index = -1) {
        if (!root.Swal || typeof root.Swal.fire !== 'function' || typeof root.ensureSchoolAliasStore !== 'function') return;
        const list = root.ensureSchoolAliasStore();
        const current = index >= 0 ? (list[index] || {}) : {};

        root.Swal.fire({
            title: index >= 0 ? '修改学校名称对应' : '新增学校名称对应',
            html: `
                <div style="text-align:left; line-height:2.2;">
                    <label>规范学校名</label>
                    <input id="swal-school-canonical" class="swal2-input" placeholder="如：银山实验学校" value="${String(current.canonical || '').replace(/"/g, '&quot;')}">
                    <label>别名/导入名称</label>
                    <input id="swal-school-alias" class="swal2-input" placeholder="如：银山镇实验学校" value="${String(current.alias || '').replace(/"/g, '&quot;')}">
                    <div style="font-size:12px; color:#64748b; margin-top:6px;">提示：这里用于补充你自己的学校名称对应。系统默认规则仍会保留，不会把“中学”和“实验学校”混在一起。</div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '保存',
            cancelButtonText: '取消',
            focusConfirm: false,
            preConfirm: () => {
                const doc = root.document;
                const canonical = String((doc && doc.getElementById('swal-school-canonical')?.value) || '').trim();
                const alias = String((doc && doc.getElementById('swal-school-alias')?.value) || '').trim();
                if (!canonical || !alias) {
                    root.Swal.showValidationMessage('规范学校名和别名都不能为空');
                    return false;
                }
                if (typeof root.sanitizeSchoolText === 'function' && root.sanitizeSchoolText(canonical) === root.sanitizeSchoolText(alias)) {
                    root.Swal.showValidationMessage('别名与规范学校名完全相同，无需重复添加');
                    return false;
                }
                const duplicate = list.findIndex((item, idx) =>
                    idx !== index
                    && typeof root.sanitizeSchoolText === 'function'
                    && root.sanitizeSchoolText(item && item.alias ? item.alias : '') === root.sanitizeSchoolText(alias)
                );
                if (duplicate >= 0) {
                    root.Swal.showValidationMessage(`别名“${alias}”已存在于自定义对应表中`);
                    return false;
                }
                return { canonical, alias };
            }
        }).then(async (result) => {
            if (!result.isConfirmed || !result.value) return;
            const next = root.ensureSchoolAliasStore().slice();
            if (index >= 0) next[index] = result.value;
            else next.push(result.value);
            if (typeof root.setSchoolAliasState === 'function') root.setSchoolAliasState(next);
            if (manager && typeof manager.renderSchoolAliasMappings === 'function') manager.renderSchoolAliasMappings();

            try {
                if (manager && typeof manager.persistSchoolAliasSettings === 'function') {
                    await manager.persistSchoolAliasSettings();
                }
                safeToast('学校名称对应已保存', 'success');
            } catch (_) {
                safeToast('学校名称对应已暂存到本地，云端同步失败', 'warning');
            }
        });
    }

    async function deleteSchoolAliasMapping(manager, index) {
        if (typeof root.ensureSchoolAliasStore !== 'function') return;
        const list = root.ensureSchoolAliasStore().slice();
        const current = list[index];
        if (!current) return;

        if (typeof root.confirm === 'function' && !root.confirm(`确定删除对应：${current.alias} → ${current.canonical} 吗？`)) return;
        list.splice(index, 1);
        if (typeof root.setSchoolAliasState === 'function') root.setSchoolAliasState(list);
        if (manager && typeof manager.renderSchoolAliasMappings === 'function') manager.renderSchoolAliasMappings();

        try {
            if (manager && typeof manager.persistSchoolAliasSettings === 'function') {
                await manager.persistSchoolAliasSettings();
            }
            safeToast('学校名称对应已删除', 'success');
        } catch (_) {
            safeToast('已删除本地对应，但云端同步失败', 'warning');
        }
    }

    return {
        renderSchoolAliasMappings,
        syncSchoolAliasSettingsFromGateway,
        persistSchoolAliasSettings,
        openSchoolAliasEditor,
        deleteSchoolAliasMapping
    };
});
