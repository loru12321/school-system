/*
 * 新教师上手引导（starter-guide）运行时模块
 *
 * 从 app.js 抽出的「新教师上手引导」展示模块：弹出五步上手引导
 * （选择届别/学期 → 导入成绩表 → 导入任课表并同步 → 选择本校 →
 * 进入教师画像查看结果），并把 HAS_SEEN_STARTER 标记写入 localStorage。
 * SweetAlert2 (Swal) 未加载时降级为原生 alert，语义一致。
 *
 * 纯展示逻辑，不涉及任何成绩计算口径（两率一分 / 优秀线 / 排名核算 /
 * 学校归一化 均不在此）。依赖的全局（Swal / localStorage）由 vendor 与
 * 浏览器提供，本模块在其后（DEFERRED_APP_MODULES）加载，通过 root.*
 * 访问并带 typeof 兜底。
 */
(function (root) {
    if (!root) return;

    function openStarterGuide() {
        if (typeof root.Swal === 'undefined') {
            root.alert('新教师上手引导：\n1. 选择【届别】与【学期】\n2. 导入成绩表\n3. 导入任课表并同步\n4. 选择本校\n5. 进入教师画像查看结果');
            root.localStorage.setItem('HAS_SEEN_STARTER', '1');
            return;
        }
        root.Swal.fire({
            title: '🧭 新教师上手引导',
            html: `
                <ol style="text-align:left; line-height:1.8; font-size:13px; color:#475569;">
                    <li>选择【届别】与【学期】</li>
                    <li>在“数据上传与设置”导入成绩表</li>
                    <li>在“教师任课”导入任课表并同步</li>
                    <li>选择本校</li>
                    <li>进入“教师教学质量画像”查看结果</li>
                </ol>
            `,
            confirmButtonText: '我知道了',
            confirmButtonColor: '#0ea5e9'
        });
        root.localStorage.setItem('HAS_SEEN_STARTER', '1');
    }

    // 回挂到 window，供 HTML onclick（index.html 移动端网格 + 桌面按钮）
    // 与 cloud.js 首次登录自动引导（typeof 守卫）调用点。
    root.openStarterGuide = openStarterGuide;
    root.StarterGuideRuntime = { openStarterGuide };
})(typeof window !== 'undefined' ? window : globalThis);
