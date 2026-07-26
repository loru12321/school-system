/*
 * 系统自检（auto-diagnosis）运行时模块
 *
 * 从 app.js 抽出的「系统诊断」工具：一键检查学期/本校/成绩数据/任课表是否就绪，
 * 并探测云端连接与权限状态，用 Swal 弹窗 + 上手引导页内嵌区域展示结果。
 *
 * 纯只读诊断 + DOM 展示，零计算/口径耦合——只读 RAW_DATA/MY_SCHOOL/TEACHER_MAP
 * 与 CloudApi/sbClient 连接状态，不写任何全局状态、不改成绩/排名/评价。依赖经
 * root.* 读取（app.js 的 setter 已把这些镜像到 window；readCurrentTermId 为 app.js
 * 顶层函数即隐式 window 全局；getTermId/getExamMetaFromUI 由 cohort-exam-meta-runtime
 * 挂到 window；selectSystemDataRecords 由 cloud-connection-runtime 挂到 window）。
 *
 * 调用点不变：src/index.html:800 的 onclick="runAutoDiagnosis()"。
 */
(function (root) {
    if (!root) return;

    async function runAutoDiagnosis() {
        const RAW_DATA = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const termId = (typeof root.readCurrentTermId === 'function' ? root.readCurrentTermId() : '')
            || (typeof root.getTermId === 'function'
                ? root.getTermId(typeof root.getExamMetaFromUI === 'function' ? root.getExamMetaFromUI() : undefined)
                : '');
        const hasScores = RAW_DATA && RAW_DATA.length > 0;
        const hasTeachers = root.TEACHER_MAP && Object.keys(root.TEACHER_MAP).length > 0;
        const hasSchool = !!root.MY_SCHOOL;

        let cloudStatus = { text: '未连接', badge: 'badge-err' };
        if (root.CloudApi || root.sbClient) {
            try {
                const { error } = await root.selectSystemDataRecords({
                    select: 'key',
                    limit: 1
                });
                cloudStatus = error ? { text: '连接成功但可能无权限', badge: 'badge-warn' } : { text: '连接正常', badge: 'badge-ok' };
            } catch (e) {
                cloudStatus = { text: '连接异常', badge: 'badge-err' };
            }
        }

        const html = `
            <div style="text-align:left; font-size:13px; color:#475569; line-height:1.8;">
                <div>学期：${termId || '未选择'} ${termId ? '<span class="status-badge badge-ok">通过</span>' : '<span class="status-badge badge-err">缺失</span>'}</div>
                <div>本校：${hasSchool ? root.MY_SCHOOL : '未选择'} ${hasSchool ? '<span class="status-badge badge-ok">通过</span>' : '<span class="status-badge badge-err">缺失</span>'}</div>
                <div>成绩数据：${hasScores ? RAW_DATA.length + ' 条' : '未导入'} ${hasScores ? '<span class="status-badge badge-ok">通过</span>' : '<span class="status-badge badge-err">缺失</span>'}</div>
                <div>任课表：${hasTeachers ? Object.keys(root.TEACHER_MAP).length + ' 条' : '未导入'} ${hasTeachers ? '<span class="status-badge badge-ok">通过</span>' : '<span class="status-badge badge-err">缺失</span>'}</div>
                <div>云端权限：${cloudStatus.text} <span class="status-badge ${cloudStatus.badge}">诊断</span></div>
            </div>
        `;

        const resultEl = root.document && root.document.getElementById('starter-diagnose-result');
        if (resultEl) resultEl.innerHTML = html;

        if (root.Swal && typeof root.Swal.fire === 'function') {
            root.Swal.fire({
                title: '🧪 系统诊断结果',
                html,
                width: 620,
                confirmButtonText: '知道了',
                confirmButtonColor: '#4f46e5'
            });
        }
    }

    // 回挂到 window，供 HTML onclick（src/index.html:800）调用。
    root.runAutoDiagnosis = runAutoDiagnosis;
    root.AutoDiagnosisRuntime = { runAutoDiagnosis };
})(typeof window !== 'undefined' ? window : globalThis);
