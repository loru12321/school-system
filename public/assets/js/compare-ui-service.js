(function() {
    function renderOptions(selectEl, options, placeholder) {
        if (!selectEl) return;
        const placeholderHtml = placeholder ? `<option value="">${placeholder}</option>` : '';
        const optionsHtml = (options || []).map(option => {
            const value = option && typeof option === 'object' ? option.value : option;
            const label = option && typeof option === 'object' ? option.label : option;
            return `<option value="${value}">${label}</option>`;
        }).join('');
        selectEl.innerHTML = placeholderHtml + optionsHtml;
    }

    function renderSchoolSelect(selectEl, schoolList, preferredSchool) {
        renderOptions(selectEl, schoolList || [], '--请选择学校--');
        const targetSchool = String(preferredSchool || '').trim();
        if (targetSchool && Array.isArray(schoolList) && schoolList.includes(targetSchool)) {
            selectEl.value = targetSchool;
        }
    }

    function renderSubjectSelect(selectEl, subjects, options) {
        const opts = options || {};
        const list = Array.isArray(subjects) ? [...subjects] : [];
        if (typeof opts.sortFn === 'function') {
            list.sort(opts.sortFn);
        }
        renderOptions(selectEl, list, opts.placeholder || '--请选择学科--');
    }

    function renderExamTriplet(exam1Sel, exam2Sel, exam3Sel, options) {
        const opts = options || {};
        if (window.ExamCatalog && typeof window.ExamCatalog.renderExamSelectTriplet === 'function') {
            return window.ExamCatalog.renderExamSelectTriplet(
                [exam1Sel, exam2Sel, exam3Sel],
                opts.examList || [],
                { currentExamId: opts.currentExamId }
            );
        }
        return { ok: false };
    }

    function initializeCompareFilters(config) {
        const cfg = config || {};
        const schoolList = Array.isArray(cfg.schoolList) ? cfg.schoolList : [];
        if (cfg.schoolSelect) {
            renderSchoolSelect(cfg.schoolSelect, schoolList, cfg.preferredSchool);
        }
        if (cfg.subjectSelect) {
            renderSubjectSelect(cfg.subjectSelect, cfg.subjects || [], {
                sortFn: cfg.subjectSortFn,
                placeholder: cfg.subjectPlaceholder || '--请选择学科--'
            });
        }
        if (cfg.examSelects && cfg.examSelects.length === 3) {
            renderExamTriplet(cfg.examSelects[0], cfg.examSelects[1], cfg.examSelects[2], {
                examList: cfg.examList || [],
                currentExamId: cfg.currentExamId
            });
        }
    }


    function renderTeacherSelect(selectEl, teacherNames, placeholder) {
        renderOptions(selectEl, teacherNames || [], placeholder || '--\u8bf7\u9009\u62e9\u6559\u5e08--');
    }

    function toggleConditionalWrap(controlEl, wrapEl, options) {
        if (!controlEl || !wrapEl) return;
        const opts = options || {};
        const displayValue = opts.displayValue || '3';
        const displayStyle = opts.displayStyle || 'inline-flex';
        wrapEl.style.display = String(controlEl.value || '') === String(displayValue) ? displayStyle : 'none';
    }

    function setCompareFeedback(config) {
        const cfg = config || {};
        const hintEl = cfg.hintEl;
        const resultEl = cfg.resultEl;
        if (hintEl) {
            hintEl.innerHTML = cfg.message || '';
            hintEl.style.color = cfg.color || '#64748b';
        }
        if (resultEl && cfg.clearResult) {
            resultEl.innerHTML = '';
        }
    }

    function buildTeacherSingleCompareView(options) {
        const opts = options || {};
        const teacher = String(opts.teacher || '').trim();
        const subject = String(opts.subject || '').trim();
        const examIds = Array.isArray(opts.examIds) ? opts.examIds : [];
        const metricRows = String(opts.metricRows || '');
        const delta = opts.delta || {};
        const deltaAvg = typeof delta.townshipAvg === 'number' ? delta.townshipAvg : null;
        const deltaExc = typeof delta.townshipExc === 'number' ? delta.townshipExc : null;
        const deltaPass = typeof delta.townshipPass === 'number' ? delta.townshipPass : null;
        const fmt = function(value) {
            if (typeof value !== 'number') return '-';
            return (value >= 0 ? '+' : '') + value;
        };

        return {
            resultHtml: ''
                + '<div class="sub-header">\u6559\u5e08\u591a\u671f\u5bf9\u6bd4\uff1a' + teacher + ' / ' + subject + '</div>'
                + '<div class="table-wrap"><table class="mobile-card-table"><thead><tr>'
                + '<th>\u671f\u6b21</th><th>\u4e61\u9547\u5747\u5206\u6392\u540d</th><th>\u4f18\u79c0\u7387\u6392\u540d</th><th>\u53ca\u683c\u7387\u6392\u540d</th>'
                + '</tr></thead><tbody>' + metricRows + '</tbody></table></div>'
                + '<div style="margin-top:8px; font-size:12px; color:#475569;">'
                + '\u5bf9\u6bd4\u533a\u95f4\uff1a' + (examIds[0] || '\u9996\u671f') + ' -> ' + (examIds[examIds.length - 1] || '\u672b\u671f') + '\uff1b'
                + '\u4e61\u9547\u5747\u5206\u6392\u540d\u53d8\u5316\uff1a' + fmt(deltaAvg) + '\uff1b'
                + '\u4f18\u79c0\u7387\u6392\u540d\u53d8\u5316\uff1a' + fmt(deltaExc) + '\uff1b'
                + '\u53ca\u683c\u7387\u6392\u540d\u53d8\u5316\uff1a' + fmt(deltaPass)
                + '</div>',
            hintHtml: '\u5df2\u751f\u6210 ' + (opts.periodCount || examIds.length || 2) + ' \u671f\u6559\u5e08\u591a\u671f\u5bf9\u6bd4\uff1a' + examIds.join(' / '),
            hintColor: '#16a34a'
        };
    }

    function buildTeacherBatchCompareView(options) {
        const opts = options || {};
        const school = String(opts.school || '').trim();
        const examIds = Array.isArray(opts.examIds) ? opts.examIds : [];
        const results = Array.isArray(opts.results) ? opts.results : [];
        let ths = '<th>\u6559\u5e08</th><th>\u5b66\u79d1</th>';
        examIds.forEach(function(eid) {
            const shortName = String(eid || '').split('-').pop() || eid;
            ths += '<th style="background:#f1f5f9; border-left:2px solid white;">' + shortName
                + '<br><span style="font-size:10px;font-weight:normal">\u5747\u5206\u6392\u540d / \u4f18\u79c0\u7387\u6392\u540d / \u53ca\u683c\u7387\u6392\u540d</span></th>';
        });
        ths += '<th style="background:#fff7ed; border-left:2px solid white;">\u53d8\u5316<br><span style="font-size:10px;font-weight:normal">\u6392\u540d\u53d8\u5316\u503c</span></th>';

        const fmtDelta = function(deltaVal) {
            if (typeof deltaVal !== 'number') return '<span style="color:#94a3b8;">-</span>';
            const color = deltaVal > 0 ? 'green' : (deltaVal < 0 ? 'red' : 'gray');
            const icon = deltaVal > 0 ? '\u2191' : (deltaVal < 0 ? '\u2193' : '-');
            return '<span style="color:' + color + ';">' + icon + ' ' + Math.abs(deltaVal) + '</span>';
        };

        const trs = results.map(function(item) {
            let tds = '<td style="font-weight:bold;">' + item.teacher + '</td><td>' + item.subject + '</td>';
            (item.details || []).forEach(function(detail) {
                const current = detail.current;
                if (current) {
                    tds += '<td style="border-left:1px solid #e2e8f0; text-align:center;">'
                        + '<div style="font-size:11px; color:#334155;">\u5747 ' + (typeof current.townshipRankAvg === 'number' ? current.townshipRankAvg : '-') + '</div>'
                        + '<div style="font-size:11px; color:#334155;">\u4f18 ' + (typeof current.townshipRankExc === 'number' ? current.townshipRankExc : '-') + '</div>'
                        + '<div style="font-size:11px; color:#334155;">\u53ca ' + (typeof current.townshipRankPass === 'number' ? current.townshipRankPass : '-') + '</div>'
                        + '</td>';
                } else {
                    tds += '<td style="border-left:1px solid #e2e8f0; text-align:center; color:#cbd5e1;">-</td>';
                }
            });

            if (item.delta) {
                tds += '<td style="border-left:1px solid #e2e8f0; text-align:center; background:#fffbf0;">'
                    + '<div style="font-size:11px;">\u5747 ' + fmtDelta(item.delta.townshipAvg) + '</div>'
                    + '<div style="font-size:11px;">\u4f18 ' + fmtDelta(item.delta.townshipExc) + '</div>'
                    + '<div style="font-size:11px;">\u53ca ' + fmtDelta(item.delta.townshipPass) + '</div>'
                    + '</td>';
            } else {
                tds += '<td style="border-left:1px solid #e2e8f0; text-align:center; background:#fffbf0; color:#cbd5e1;">-</td>';
            }

            return '<tr>' + tds + '</tr>';
        }).join('');

        return {
            thsHtml: ths,
            trsHtml: trs,
            resultHtml: ''
                + '<div class="sub-header" style="color:#ea580c;">\u5168\u6559\u5e08\u591a\u671f\u5bf9\u6bd4\uff1a' + school + '</div>'
                + '<div class="table-wrap" style="max-height:600px; overflow-y:auto;">'
                + '<table class="common-table" style="font-size:13px;">'
                + '<thead style="position:sticky; top:0; z-index:10;"><tr>' + ths + '</tr></thead>'
                + '<tbody>' + trs + '</tbody>'
                + '</table>'
                + '</div>'
                + '<div style="margin-top:10px; display:flex; gap:10px;">'
                + '<button class="btn btn-sm" onclick="exportAllTeachersMultiPeriodDiff(' + JSON.stringify(school) + ', ' + JSON.stringify(examIds.join('_')) + ')">\u5bfc\u51fa\u5168\u6559\u5e08\u5bf9\u6bd4 Excel</button>'
                + '</div>',
            hintHtml: '\u5df2\u751f\u6210 ' + school + ' \u5168\u6559\u5e08\u591a\u671f\u5bf9\u6bd4\uff0c\u5171 ' + results.length + ' \u6761\u8bb0\u5f55\uff1a' + examIds.join(' / '),
            hintColor: '#16a34a'
        };
    }

    window.CompareUiService = {
        renderOptions,
        renderSchoolSelect,
        renderSubjectSelect,
        renderExamTriplet,
        initializeCompareFilters,
        renderTeacherSelect,
        toggleConditionalWrap,
        setCompareFeedback,
        buildTeacherSingleCompareView,
        buildTeacherBatchCompareView
    };
})();