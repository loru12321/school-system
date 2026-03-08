(function() {
    function getSnapshotKey(options) {
        const opts = options || {};
        const meta = typeof opts.getExamMeta === 'function'
            ? opts.getExamMeta()
            : (typeof window.getExamMetaFromUI === 'function' ? window.getExamMetaFromUI() : {});
        if (!meta.cohortId || !meta.year || !meta.term || !meta.type) return null;
        const parts = [
            meta.cohortId + '级',
            meta.grade ? meta.grade + '年级' : '未知年级',
            meta.year,
            meta.term,
            meta.type,
            meta.name || '标准考试'
        ];
        return parts.join('_').replace(/[\s\/\\\?]/g, '');
    }

    function parseSnapshotContent(content) {
        let raw = content;
        if (typeof raw === 'string' && raw.startsWith('LZ|')) {
            raw = LZString.decompressFromUTF16(raw.substring(3));
        }
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    async function saveSnapshot(options) {
        const opts = options || {};
        const sbClient = opts.sbClient || window.sbClient;
        if (!sbClient) return;

        const role = sessionStorage.getItem('CURRENT_ROLE');
        if (role !== 'admin' && role !== 'director' && role !== 'grade_director') {
            if (window.UI) UI.toast('权限不足', 'warning');
            return;
        }

        const key = opts.key || getSnapshotKey(opts);
        if (!key) {
            alert('请先完善考试信息');
            return;
        }

        if (window.UI) UI.loading(true, '☁️ 正在同步...');
        try {
            if (!window.SYS_VARS) window.SYS_VARS = { indicator: { ind1: '', ind2: '' }, targets: {} };
            const ind1Input = document.getElementById('dm_ind1_input');
            const ind2Input = document.getElementById('dm_ind2_input');
            if (ind1Input) window.SYS_VARS.indicator.ind1 = ind1Input.value;
            if (ind2Input) window.SYS_VARS.indicator.ind2 = ind2Input.value;
            window.SYS_VARS.targets = window.TARGETS || {};

            const payload = typeof window.getCurrentSnapshotPayload === 'function' ? window.getCurrentSnapshotPayload() : {};
            const compressed = 'LZ|' + LZString.compressToUTF16(JSON.stringify(payload));

            const { error } = await sbClient.from('system_data').upsert({
                key,
                content: compressed,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
            if (error) throw error;

            localStorage.setItem('CURRENT_PROJECT_KEY', key);
            if (window.idbKeyval) await window.idbKeyval.set(`cache_${key}`, payload);
            if (window.UI) UI.toast('云端同步成功', 'success');
            localStorage.setItem('CLOUD_SYNC_AT', new Date().toISOString());
            if (typeof window.logAction === 'function') window.logAction('云端同步', `全量数据已同步：${key}`);
            if (typeof window.updateStatusPanel === 'function') window.updateStatusPanel();
        } catch (error) {
            console.error('CloudManager Save Error:', error);
            alert('同步失败: ' + error.message);
        } finally {
            if (window.UI) UI.loading(false);
        }
    }

    async function loadSnapshot(options) {
        const opts = options || {};
        const sbClient = opts.sbClient || window.sbClient;
        if (!sbClient) return;

        const key = opts.key || getSnapshotKey(opts) || localStorage.getItem('CURRENT_PROJECT_KEY');
        if (!key) return;

        if (window.UI) UI.toast('正在检查云端数据...', 'info');
        try {
            const { data, error } = await sbClient
                .from('system_data')
                .select('content')
                .eq('key', key)
                .maybeSingle();
            if (error) throw error;
            if (!data) return;

            const payload = parseSnapshotContent(data.content);
            if (typeof window.applySnapshotPayload === 'function') window.applySnapshotPayload(payload);
            if (window.UI) UI.toast('数据已同步到本地', 'success');
            if (typeof window.logAction === 'function') window.logAction('云端加载', `已加载全量数据：${key}`);
        } catch (error) {
            console.error('CloudManager Load Error:', error);
            if (window.UI) UI.toast('加载失败', 'error');
        }
    }

    window.CloudSnapshotService = {
        getSnapshotKey,
        parseSnapshotContent,
        saveSnapshot,
        loadSnapshot
    };
})();