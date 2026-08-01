(() => {
    if (typeof window === 'undefined' || window.__FRESHMAN_CONSTRAINT_INSIGHT_RUNTIME_PATCHED__) return;

    const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));

    const read = (id) => document.getElementById(id);
    const optionText = (id) => {
        const select = read(id);
        return String(select?.selectedOptions?.[0]?.textContent || select?.value || '').trim();
    };

    function getCloudExamCount() {
        const exams = window.COHORT_DB?.exams;
        return exams && typeof exams === 'object' ? Object.keys(exams).length : 0;
    }

    function getRuntimeStatus() {
        const status = window.FreshmanExamRuntime?.assignmentDataStatus;
        return status && typeof status === 'object'
            ? status
            : { studentCount: 0, genderRows: 0, violationRows: 0, lastAssembly: null };
    }

    function buildReview() {
        const source = String(read('fb_data_source')?.value || 'cloud');
        const classCount = Math.max(0, Number(read('fb_cls_num')?.value) || 0);
        const requestedExamCount = Math.max(1, Number(read('fb_exam_count')?.value) || 2);
        const status = getRuntimeStatus();
        const errors = [];
        const warnings = [];

        if (!classCount) errors.push('请填写拟分班级数。');
        if (classCount > 30) errors.push('拟分班级数不能超过 30 个。');
        if (classCount === 1) warnings.push('当前仅设置 1 个班级，不会形成“均衡分班”的比较结果。');

        if (source === 'manual') {
            if (!status.studentCount) errors.push('手动数据源尚未导入学生名单。');
            if (!status.genderRows && status.studentCount) warnings.push('未识别到性别名单；系统会按导入名单中的性别字段执行均衡。');
        } else {
            const cloudExamCount = getCloudExamCount();
            if (!cloudExamCount) errors.push('当前届别没有可用于分班的云端考试数据。');
            if (cloudExamCount && cloudExamCount < requestedExamCount) {
                warnings.push(`云端仅找到 ${cloudExamCount} 场考试，少于已选的最近 ${requestedExamCount} 次。`);
            }
            if (!status.genderRows) warnings.push('尚未上传性别名单；未匹配学生会按默认性别处理，无法保证性别均衡。');
        }
        if (!status.violationRows) warnings.push('未上传违纪名单；“违纪学生”规则不会新增特殊约束。');

        const rules = [
            ['班额', optionText('fb_cls_size')],
            ['性别', optionText('fb_rule_gender')],
            ['违纪', optionText('fb_rule_diff')],
            ['档次', optionText('fb_rule_tier')],
            ['主科', optionText('fb_rule_subject')],
            ['名次', optionText('fb_rule_rank')],
            ['算法', optionText('fb_algorithm')]
        ];
        return {
            ok: errors.length === 0,
            errors,
            warnings,
            source,
            classCount,
            rules,
            status,
            cloudExamCount: getCloudExamCount()
        };
    }

    function render(review) {
        const area = read('fb_constraint_review');
        const summary = read('fb_constraint_summary');
        const rules = read('fb_constraint_rules');
        const issues = read('fb_constraint_issues');
        if (!area || !summary || !rules || !issues) return;
        area.classList.remove('hidden');
        const dataText = review.source === 'cloud'
            ? `云端 ${review.cloudExamCount} 场成绩`
            : `${review.status.studentCount || 0} 名已导入学生`;
        summary.innerHTML = `<strong>${review.ok ? '条件可执行' : '需先处理问题'}</strong> · ${review.classCount || 0} 个拟分班级 · ${escapeHtml(dataText)}`;
        rules.innerHTML = review.rules.map(([name, value]) => `<span class="freshman-rule-chip"><b>${escapeHtml(name)}</b>${escapeHtml(value || '未设置')}</span>`).join('');
        const notes = [
            ...review.errors.map(text => ['error', text]),
            ...review.warnings.map(text => ['warning', text])
        ];
        issues.innerHTML = notes.length
            ? notes.map(([type, text]) => `<div class="freshman-review-note is-${type}"><i class="ti ${type === 'error' ? 'ti-alert-triangle' : 'ti-info-circle'}"></i>${escapeHtml(text)}</div>`).join('')
            : '<div class="freshman-review-note is-ok"><i class="ti ti-circle-check"></i>数据来源、班级数和当前规则已准备好；生成后可直接比较均分、性别、档次和主科均衡。</div>';
    }

    function preflight(options = {}) {
        const review = buildReview();
        render(review);
        if (!options.silent && window.UI) {
            UI.toast(review.ok ? '分班条件检查通过，可生成并比较方案。' : `分班条件检查发现 ${review.errors.length} 项问题。`, review.ok ? 'success' : 'warning');
        }
        return review;
    }

    // 预检是按需运行时提供的动作，使用明确的 data 值绑定，而不是把新的
    // onclick 散落回页面。只接受一个白名单动作，避免属性值成为函数跳板。
    function bindDeclarativeHandlers() {
        if (document.documentElement.dataset.fbInsightBound === '1') return;
        document.documentElement.dataset.fbInsightBound = '1';
        document.addEventListener('click', (event) => {
            const trigger = event.target?.closest?.('[data-fb-insight-action]');
            if (!trigger || !document.documentElement.contains(trigger) || trigger.disabled) return;
            if (trigger.dataset.fbInsightAction === 'preflight') preflight();
        });
    }

    window.FB_preflight = preflight;
    window.FreshmanConstraintInsightRuntime = { preflight, buildReview, bindDeclarativeHandlers };
    window.__FRESHMAN_CONSTRAINT_INSIGHT_RUNTIME_PATCHED__ = true;

    bindDeclarativeHandlers();
    window.setTimeout(() => preflight({ silent: true }), 0);
})();
