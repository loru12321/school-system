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


    function escapeStudentCompareHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildStudentCompareCardView(options) {
        const opts = options || {};
        const student = opts.student || {};
        const periodCount = Number(opts.periodCount) === 3 ? 3 : 2;
        const totalLabel = String(opts.totalLabel || '\u603b\u5206');
        const subjects = Array.isArray(opts.subjects) ? opts.subjects : [];
        let cardBg = '#f8fafc';
        let badge = '';
        let trendIcon = '\u2192';

        if (Number(student.scoreDiff) >= 10) {
            cardBg = '#f0fdf4';
            badge = '<span style="background:#16a34a; color:white; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:8px;">\u663e\u8457\u8fdb\u6b65</span>';
            trendIcon = '\u2191';
        } else if (Number(student.scoreDiff) > 1) {
            trendIcon = '\u2197';
        } else if (Number(student.scoreDiff) <= -10) {
            cardBg = '#fef2f2';
            badge = '<span style="background:#dc2626; color:white; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:8px;">\u9700\u8981\u5173\u6ce8</span>';
            trendIcon = '\u2193';
        } else if (Number(student.scoreDiff) < -1) {
            trendIcon = '\u2198';
        }

        if (Number(student.rankSchoolDiff) >= 5 && !badge) {
            badge = '<span style="background:#10b981; color:white; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:8px;">\u6821\u6392\u63d0\u5347</span>';
        }

        const studentName = escapeStudentCompareHtml(student.name || '');
        const studentClass = escapeStudentCompareHtml(student.class || '');
        const cleanName = escapeStudentCompareHtml(student.cleanName || student.name || '');
        const progressType = escapeStudentCompareHtml(student.progressType || 'stable');
        const periods = Array.isArray(student.periods) ? student.periods : [];

        let html = ''
            + '<div class="student-compare-card" data-student-name="' + cleanName + '" data-progress-type="' + progressType + '" style="margin-bottom:15px; border:1px solid #e2e8f0; border-radius:8px; padding:15px; background:' + cardBg + ';">'
            + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
            + '<div class="sub-header" style="font-size:14px; margin:0;">'
            + '\u5b66\u751f\uff1a' + studentName + (studentClass ? ' (' + studentClass + ')' : '') + badge
            + (periodCount > 1 ? '<span style="font-size:20px; margin-left:8px;">' + trendIcon + '</span>' : '')
            + '</div>'
            + '<button class="btn btn-sm btn-gray" onclick="toggleStudentDetail(this)" style="font-size:11px; padding:3px 10px;">\u5c55\u5f00\u660e\u7ec6</button>'
            + '</div>';

        html += ''
            + '<div style="font-weight:bold; margin-top:10px; margin-bottom:5px; font-size:13px;">\u6210\u7ee9\u6982\u89c8</div>'
            + '<div class="table-wrap">'
            + '<table class="mobile-card-table" style="font-size:12px;">'
            + '<thead><tr>'
            + '<th>\u671f\u6b21</th><th>' + escapeStudentCompareHtml(totalLabel) + '</th><th>\u6821\u6392\u540d</th><th>\u9547\u6392\u540d</th>'
            + (periodCount > 1 ? '<th>\u603b\u5206\u53d8\u5316</th><th>\u6821\u6392\u53d8\u5316</th><th>\u9547\u6392\u53d8\u5316</th>' : '')
            + '</tr></thead><tbody>';

        periods.forEach(function(period, idx) {
            const prevPeriod = idx > 0 ? periods[idx - 1] : null;
            const totalVal = typeof period.total === 'number' ? period.total : null;
            const prevTotal = prevPeriod && typeof prevPeriod.total === 'number' ? prevPeriod.total : null;
            const scoreDiff = prevPeriod && totalVal !== null && prevTotal !== null ? (totalVal - prevTotal) : null;
            const schoolRank = typeof period.rankSchool === 'number' ? period.rankSchool : null;
            const prevSchoolRank = prevPeriod && typeof prevPeriod.rankSchool === 'number' ? prevPeriod.rankSchool : null;
            const schoolRankDiff = prevPeriod && schoolRank !== null && prevSchoolRank !== null ? (prevSchoolRank - schoolRank) : null;
            const townRank = typeof period.rankTown === 'number' ? period.rankTown : null;
            const prevTownRank = prevPeriod && typeof prevPeriod.rankTown === 'number' ? prevPeriod.rankTown : null;
            const townRankDiff = prevPeriod && townRank !== null && prevTownRank !== null ? (prevTownRank - townRank) : null;
            html += '<tr>'
                + '<td><strong>' + escapeStudentCompareHtml(period.examId || '') + '</strong></td>'
                + '<td>' + (totalVal !== null ? totalVal.toFixed(1) : '-') + '</td>'
                + '<td>' + (schoolRank !== null ? schoolRank : '-') + '</td>'
                + '<td>' + (townRank !== null ? townRank : '-') + '</td>';
            if (periodCount > 1) {
                html += '<td style="color:' + ((scoreDiff || 0) >= 0 ? 'var(--success)' : 'var(--danger)') + ';">' + (scoreDiff === null ? '-' : ((scoreDiff >= 0 ? '+' : '') + scoreDiff.toFixed(1))) + '</td>'
                    + '<td style="font-weight:bold; color:' + ((schoolRankDiff || 0) >= 0 ? 'var(--success)' : 'var(--danger)') + ';">' + (schoolRankDiff === null ? '-' : ((schoolRankDiff >= 0 ? '+' : '') + schoolRankDiff)) + '</td>'
                    + '<td style="font-weight:bold; color:' + ((townRankDiff || 0) >= 0 ? 'var(--success)' : 'var(--danger)') + ';">' + (townRankDiff === null ? '-' : ((townRankDiff >= 0 ? '+' : '') + townRankDiff)) + '</td>';
            }
            html += '</tr>';
        });

        html += '</tbody></table></div>';

        if (subjects.length > 0) {
            html += ''
                + '<div class="student-detail-section" style="display:none; margin-top:15px;">'
                + '<div style="font-weight:bold; margin-bottom:5px; font-size:13px;">\u5b66\u79d1\u660e\u7ec6</div>'
                + '<div class="table-wrap">'
                + '<table class="mobile-card-table" style="font-size:11px;">'
                + '<thead><tr><th>\u5b66\u79d1</th>';
            periods.forEach(function(period) {
                html += '<th colspan="3" style="background:#f1f5f9;">' + escapeStudentCompareHtml(period.examId || '') + '</th>';
            });
            html += '</tr><tr><th></th>';
            periods.forEach(function() {
                html += '<th>\u5206\u6570</th><th>\u6821\u6392</th><th>\u9547\u6392</th>';
            });
            html += '</tr></thead><tbody>';
            subjects.forEach(function(subject) {
                html += '<tr><td><strong>' + escapeStudentCompareHtml(subject) + '</strong></td>';
                periods.forEach(function(period) {
                    const subData = period && period.subjects ? period.subjects[subject] : null;
                    if (subData) {
                        html += '<td>' + escapeStudentCompareHtml(subData.score) + '</td><td>' + escapeStudentCompareHtml(subData.rankSchool) + '</td><td>' + escapeStudentCompareHtml(subData.rankTown) + '</td>';
                    } else {
                        html += '<td>-</td><td>-</td><td>-</td>';
                    }
                });
                html += '</tr>';
            });
            html += '</tbody></table></div></div>';
        }

        html += '</div>';
        return html;
    }

    function buildStudentComparePaginationButtons(page, totalPages, renderPageFnName) {
        const fnName = /^[\w$.]+$/.test(String(renderPageFnName || '')) ? String(renderPageFnName) : 'renderStudentComparePage';
        let html = '';
        html += '<button class="btn btn-sm" onclick="' + fnName + '(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + ' style="padding:3px 10px;">\u4e0a\u4e00\u9875</button>';
        const maxButtons = 5;
        let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        if (startPage > 1) {
            html += '<button class="btn btn-sm" onclick="' + fnName + '(1)" style="padding:3px 10px;">1</button>';
            if (startPage > 2) html += '<span style="padding:3px 8px;">...</span>';
        }
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === page;
            html += '<button class="btn btn-sm ' + (isActive ? 'btn-blue' : '') + '" onclick="' + fnName + '(' + i + ')" style="padding:3px 10px; ' + (isActive ? 'font-weight:bold;' : '') + '">' + i + '</button>';
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += '<span style="padding:3px 8px;">...</span>';
            html += '<button class="btn btn-sm" onclick="' + fnName + '(' + totalPages + ')" style="padding:3px 10px;">' + totalPages + '</button>';
        }
        html += '<button class="btn btn-sm" onclick="' + fnName + '(' + (page + 1) + ')" ' + (page >= totalPages ? 'disabled' : '') + ' style="padding:3px 10px;">\u4e0b\u4e00\u9875</button>';
        return html;
    }

    function buildStudentComparePageView(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const pageSize = Math.max(1, Number(cache.pageSize) || 20);
        const students = Array.isArray(cache.studentsCompareData) ? cache.studentsCompareData : [];
        const totalCount = students.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
        const currentPage = Math.min(Math.max(1, Number(opts.page) || 1), totalPages);
        const startIdx = (currentPage - 1) * pageSize;
        const endIdx = Math.min(startIdx + pageSize, totalCount);
        const pageStudents = students.slice(startIdx, endIdx);
        return {
            currentPage: currentPage,
            resultHtml: pageStudents.map(function(student) {
                return buildStudentCompareCardView({
                    student: student,
                    periodCount: cache.periodCount,
                    totalLabel: opts.totalLabel,
                    subjects: cache.subjects
                });
            }).join(''),
            showPagination: totalCount > 10,
            paginationInfoHtml: '\u663e\u793a ' + (totalCount === 0 ? 0 : (startIdx + 1)) + '-' + endIdx + ' / \u5171 ' + totalCount + ' \u540d\u5b66\u751f',
            paginationButtonsHtml: buildStudentComparePaginationButtons(currentPage, totalPages, opts.renderPageFnName),
            totalCount: totalCount
        };
    }

    function buildStudentCompareSummaryView(options) {
        const opts = options || {};
        const cache = opts.cache || {};
        const students = Array.isArray(cache.studentsCompareData) ? cache.studentsCompareData : [];
        if (!students.length || Number(cache.periodCount) <= 1) {
            return { html: '' };
        }
        const improveCount = students.filter(function(item) { return item.progressType === 'improve'; }).length;
        const declineCount = students.filter(function(item) { return item.progressType === 'decline'; }).length;
        const stableCount = students.filter(function(item) { return item.progressType === 'stable'; }).length;
        const avgScoreDiff = students.reduce(function(sum, item) { return sum + Number(item.scoreDiff || 0); }, 0) / students.length;
        return {
            html: ''
                + '<div style="padding:12px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; margin-bottom:10px;">'
                + '<div style="font-weight:600; margin-bottom:8px; color:#0369a1;">\u5b66\u751f\u591a\u671f\u5bf9\u6bd4\u6c47\u603b</div>'
                + '<div style="display:flex; gap:15px; flex-wrap:wrap; font-size:13px;">'
                + '<span>\u5e73\u5747\u603b\u5206\u53d8\u5316 <strong style="color:' + (avgScoreDiff >= 0 ? '#16a34a' : '#dc2626') + ';">' + (avgScoreDiff >= 0 ? '+' : '') + avgScoreDiff.toFixed(2) + '</strong></span>'
                + '<span>\u8fdb\u6b65 <strong style="color:#16a34a;">' + improveCount + ' (' + (improveCount / students.length * 100).toFixed(1) + '%)</strong></span>'
                + '<span>\u9000\u6b65 <strong style="color:#dc2626;">' + declineCount + ' (' + (declineCount / students.length * 100).toFixed(1) + '%)</strong></span>'
                + '<span>\u7a33\u5b9a <strong>' + stableCount + ' (' + (stableCount / students.length * 100).toFixed(1) + '%)</strong></span>'
                + '</div>'
                + '</div>'
        };
    }

    function buildStudentCompareSearchFeedback(options) {
        const opts = options || {};
        return {
            message: '\u5df2\u7b5b\u9009\u51fa ' + Number(opts.count || 0) + ' \u540d\u5b66\u751f\uff1a"' + escapeStudentCompareHtml(opts.keywordLabel || '') + '"',
            color: '#16a34a'
        };
    }

    function buildStudentCompareSearchEmptyFeedback(options) {
        const opts = options || {};
        return {
            message: '\u672a\u627e\u5230\u5339\u914d\u7684\u5b66\u751f\uff1a"' + escapeStudentCompareHtml(opts.keyword || '') + '"',
            color: '#dc2626'
        };
    }

    function buildStudentCompareResetFeedback(options) {
        const opts = options || {};
        return {
            message: '\u5df2\u6062\u590d ' + escapeStudentCompareHtml(opts.school || '') + ' \u5171 ' + Number(opts.count || 0) + ' \u540d\u5b66\u751f\u7684 ' + Number(opts.periodCount || 2) + ' \u671f\u5bf9\u6bd4\u89c6\u56fe\u3002',
            color: '#16a34a'
        };
    }

    function buildStudentCompareProgressFeedback(options) {
        const opts = options || {};
        return {
            message: '\u5df2\u7b5b\u9009\u51fa ' + Number(opts.count || 0) + ' \u540d' + escapeStudentCompareHtml(opts.typeLabel || '\u5b66\u751f') + '\u5b66\u751f\u3002',
            color: '#16a34a'
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
        buildTeacherBatchCompareView,
        buildStudentCompareCardView,
        buildStudentComparePageView,
        buildStudentCompareSummaryView,
        buildStudentCompareSearchFeedback,
        buildStudentCompareSearchEmptyFeedback,
        buildStudentCompareResetFeedback,
        buildStudentCompareProgressFeedback
    };
})();

