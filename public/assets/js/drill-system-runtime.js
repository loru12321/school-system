/*
 * 数据钻取弹窗运行时。
 *
 * 该模块只在用户第一次打开名单钻取时按需加载，负责班级名单、学生详情
 * 和钻取结果导出。它不参与成绩计算，只读调用方传入的名单并写入懒加载
 * 的 drill-modal DOM。按钮使用 data-drill-* 属性，避免动态 HTML 中继续
 * 依赖 inline onclick，移动端点击和键盘激活共用同一条委托路径。
 */
(function (root) {
    if (!root || (root.DrillSystem && !root.DrillSystem.__drillProxy)) return;

    const previous = root.DrillSystem && root.DrillSystem.__drillProxy
        ? root.DrillSystem
        : null;

    function escapeHtml(value) {
        if (root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function') {
            return root.SchoolRuntime.escapeHtml(value);
        }
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function safeGet(obj, path, fallback = '-') {
        const value = String(path || '').split('.').reduce((acc, key) => acc && acc[key], obj);
        return value === undefined || value === null || value === '' ? fallback : value;
    }

    function ensureDrillModalDom() {
        if (typeof root.ensureLazySectionLoaded === 'function') {
            root.ensureLazySectionLoaded('drill-modal');
        }
        return root.document.getElementById('drill-modal');
    }

    function hideModal() {
        const modal = root.document.getElementById('drill-modal');
        if (modal) modal.style.display = 'none';
    }

    function openStudentDetails(student) {
        if (typeof root.jumpToStudent === 'function') {
            root.jumpToStudent(student.name, student.school, student.class);
        }
        hideModal();
    }

    const DrillSystem = {
        history: previous?.history || [],
        currentData: previous?.currentData || null,
        exportData: previous?.exportData || null,
        __drillRuntime: true,

        open(title, studentList, scoreLabel = '总分') {
            ensureDrillModalDom();
            this.history = [];
            this.currentData = {
                title: String(title || ''),
                list: Array.isArray(studentList) ? studentList : [],
                scoreLabel: String(scoreLabel || '总分')
            };
            this.exportData = { type: 'list', data: this.currentData.list, fileName: this.currentData.title };

            const exportButton = root.document.getElementById('drill-export-btn');
            if (exportButton) exportButton.classList.remove('hidden');
            const modal = root.document.getElementById('drill-modal');
            if (modal) modal.style.display = 'flex';
            this.renderClassView();
            return true;
        },

        async exportExcel() {
            if (!this.exportData || !this.exportData.data) {
                if (typeof root.appAlertDialog === 'function') return root.appAlertDialog('当前无数据可导出', 'warning');
                return false;
            }
            if ((!root.XLSX || !root.XLSX.utils) && typeof root.ensureXlsxVendorLoaded === 'function') {
                try { await root.ensureXlsxVendorLoaded(); } catch (error) {
                    if (typeof root.appAlertDialog === 'function') await root.appAlertDialog(`Excel 组件加载失败：${error?.message || error}`, 'error');
                    return false;
                }
            }
            if (!root.XLSX || !root.XLSX.utils) return false;

            const wb = root.XLSX.utils.book_new();
            let ws;
            const filename = `${this.exportData.fileName || '导出数据'}.xlsx`;
            if (this.exportData.type === 'gap') {
                const rows = [['班级', '姓名', '当前总分', '距目标分差', '建议补救/潜力学科', '该科与年级均分差']];
                this.exportData.data.forEach(item => rows.push([
                    item.class,
                    item.name,
                    item.total,
                    Number(item.scoreGap || 0).toFixed(1),
                    String(item.worstSub || '').replace(/<[^>]+>/g, ''),
                    item.worstDiff
                ]));
                ws = root.XLSX.utils.aoa_to_sheet(rows);
                ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 15 }];
            } else {
                const rows = [['班级', '姓名', '考号', '总分', '全镇排名']];
                this.exportData.data.forEach(student => rows.push([
                    student.class,
                    student.name,
                    student.id,
                    student.total,
                    safeGet(student, 'ranks.total.township', '-')
                ]));
                ws = root.XLSX.utils.aoa_to_sheet(rows);
            }
            root.XLSX.utils.book_append_sheet(wb, ws, '导出数据');
            root.XLSX.writeFile(wb, filename);
            return true;
        },

        renderClassView() {
            if (!this.currentData) return;
            const { title, list } = this.currentData;
            const titleNode = root.document.getElementById('drill-title');
            const backButton = root.document.getElementById('drill-back-btn');
            const content = root.document.getElementById('drill-content');
            const footer = root.document.getElementById('drill-footer');
            if (!content) return;
            if (titleNode) titleNode.innerText = title;
            if (backButton) backButton.classList.add('hidden');

            const classMap = {};
            list.forEach(student => {
                const className = String(student?.class || '').trim() || '未分班';
                if (!classMap[className]) classMap[className] = [];
                classMap[className].push(student);
            });
            const classes = Object.keys(classMap).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
            let html = '<div class="drill-class-grid">';
            classes.forEach(className => {
                const count = classMap[className].length;
                html += `<button type="button" class="drill-class-card" data-drill-class="${escapeHtml(className)}" aria-label="查看${escapeHtml(className)}班${count}名学生名单">
                    <div class="drill-label">${escapeHtml(className)}</div>
                    <div class="drill-val">${count} 人</div>
                    <div class="drill-label" style="font-size:10px;">点击查看名单 &gt;</div>
                </button>`;
            });
            html += '</div>';
            if (!list.length) html = '<div style="text-align:center; padding:30px; color:#999;">暂无相关学生数据</div>';
            content.innerHTML = html;
            if (footer) footer.innerText = `合计: ${list.length} 人`;
        },

        renderStudentView(className) {
            if (!this.currentData) return;
            const { list } = this.currentData;
            this.history.push('class_view');
            const titleNode = root.document.getElementById('drill-title');
            const backButton = root.document.getElementById('drill-back-btn');
            const content = root.document.getElementById('drill-content');
            if (!content) return;
            if (titleNode) titleNode.innerText = `${className} - 名单`;
            if (backButton) backButton.classList.remove('hidden');
            const students = list
                .filter(student => String(student?.class || '') === String(className || ''))
                .sort((left, right) => Number(right?.total || 0) - Number(left?.total || 0));
            content.innerHTML = `<div class="drill-stu-list">${students.map(student => {
                const encoded = escapeHtml(JSON.stringify({
                    name: student?.name || '',
                    school: student?.school || '',
                    class: student?.class || ''
                }));
                return `<button type="button" class="drill-stu-tag" data-drill-student="${encoded}" aria-label="查看${escapeHtml(student?.name || '')}学生详情">
                    <span>${escapeHtml(student?.name || '')}</span>
                    <span class="drill-stu-score">${escapeHtml(student?.total ?? '')}</span>
                </button>`;
            }).join('')}</div>`;
        },

        goBack() {
            if (this.history.length > 0) {
                this.history.pop();
                this.renderClassView();
            }
        }
    };

    root.DrillSystem = DrillSystem;
    root.ensureDrillSystemRuntimeLoaded = () => Promise.resolve(DrillSystem);

    if (!root.__DRILL_SYSTEM_BINDINGS__) {
        root.__DRILL_SYSTEM_BINDINGS__ = true;
        root.document.addEventListener('click', (event) => {
            const classButton = event.target?.closest?.('[data-drill-class]');
            if (classButton) {
                event.preventDefault();
                DrillSystem.renderStudentView(classButton.getAttribute('data-drill-class') || '');
                return;
            }
            const studentButton = event.target?.closest?.('[data-drill-student]');
            if (studentButton) {
                event.preventDefault();
                try {
                    const student = JSON.parse(studentButton.getAttribute('data-drill-student') || '{}');
                    openStudentDetails(student);
                } catch (error) {
                    console.warn('[drill-system] invalid student payload:', error);
                }
                return;
            }
            const action = event.target?.closest?.('[data-drill-action]');
            if (!action) return;
            event.preventDefault();
            const name = action.getAttribute('data-drill-action');
            if (name === 'back') DrillSystem.goBack();
            if (name === 'export') void DrillSystem.exportExcel();
        }, true);
    }
})(typeof window !== 'undefined' ? window : globalThis);
