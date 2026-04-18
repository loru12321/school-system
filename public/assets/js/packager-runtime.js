(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.PackagerRuntime) return;
    root.PackagerRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createPackagerRuntime(root) {
    function getUi() {
        return root.UI && typeof root.UI === 'object' ? root.UI : null;
    }

    function safeLoading(show, text) {
        const ui = getUi();
        if (ui && typeof ui.loading === 'function') ui.loading(show, text);
    }

    function safeAlert(message) {
        if (typeof root.alert === 'function') root.alert(message);
    }

    function safeConfirm(message) {
        if (typeof root.confirm === 'function') return !!root.confirm(message);
        return true;
    }

    function getDocument() {
        return root.document || null;
    }

    function getBody(doc) {
        return doc && doc.body ? doc.body : null;
    }

    function getScheduler() {
        if (typeof root.setTimeout === 'function') return root.setTimeout.bind(root);
        if (typeof setTimeout === 'function') return setTimeout;
        return function (fn) {
            if (typeof fn === 'function') fn();
            return 0;
        };
    }

    function getBlobConstructor() {
        if (typeof root.Blob === 'function') return root.Blob;
        if (typeof Blob === 'function') return Blob;
        return null;
    }

    function exportDistributableHTML() {
        const rawData = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const authDb = root.Auth && root.Auth.db ? root.Auth.db : {};
        const parents = Array.isArray(authDb.parents) ? authDb.parents : [];
        const teachers = Array.isArray(authDb.teachers) ? authDb.teachers : [];

        if (!rawData.length) {
            safeAlert('当前无成绩数据，无法生成分发版。');
            return;
        }
        if (!parents.length && !teachers.length) {
            safeAlert('当前无账号信息，请先在账号管理中生成账号。');
            return;
        }

        if (!safeConfirm('⚠️ 准备生成【分发版网页】...\n\n此文件将包含：\n1. 所有学生成绩数据\n2. 所有生成的账号密码\n\n请将生成的 .html 文件发送给家长/老师。\n他们无需上传Excel，直接输入账号即可登录。\n\n确定继续吗？')) return;

        safeLoading(true, '正在打包全量数据...');

        const schedule = getScheduler();
        schedule(() => {
            try {
                const doc = getDocument();
                if (!doc || !doc.documentElement) {
                    throw new Error('document unavailable');
                }

                const dataPackage = {
                    timestamp: new Date().getTime(),
                    RAW_DATA: root.RAW_DATA,
                    SCHOOLS: root.SCHOOLS,
                    SUBJECTS: root.SUBJECTS,
                    THRESHOLDS: root.THRESHOLDS,
                    TEACHER_MAP: root.TEACHER_MAP,
                    TEACHER_SCHOOL_MAP: root.TEACHER_SCHOOL_MAP,
                    MY_SCHOOL: root.MY_SCHOOL,
                    CONFIG: root.CONFIG,
                    AUTH_DB: authDb,
                    LLM_CONFIG: root.LLM_CONFIG
                };

                let htmlContent = doc.documentElement.outerHTML;

                htmlContent = htmlContent.replace(
                    /<div id="login-overlay"([^>]*)>/,
                    (match, attrs = '') => {
                        if (/style="([^"]*)"/i.test(attrs)) {
                            const nextAttrs = attrs.replace(/style="([^"]*)"/i, (_, styleValue) => {
                                const normalized = String(styleValue || '')
                                    .replace(/display\s*:\s*[^;"]+;?/i, '')
                                    .trim();
                                const prefix = normalized ? `${normalized}${normalized.endsWith(';') ? '' : ';'}` : '';
                                return `style="${prefix}display:flex;"`;
                            });
                            return `<div id="login-overlay"${nextAttrs}>`;
                        }
                        return `<div id="login-overlay"${attrs} style="display:flex;">`;
                    }
                );

                if (htmlContent.includes('id="app" class="container"')) {
                    htmlContent = htmlContent.replace('id="app" class="container"', 'id="app" class="container hidden"');
                } else {
                    htmlContent = htmlContent.replace('id="app"', 'id="app" class="hidden"');
                }

                htmlContent = htmlContent.replace(
                    /id="admin-modal"\s+class="modal"\s+style="([^"]*)"/,
                    'id="admin-modal" class="modal" style="display: none; z-index: 60000;"'
                );

                htmlContent = htmlContent.replace(/<div id="logout-btn".*?<\/div>/, '');
                htmlContent = htmlContent.replace('id="admin-panel-btn" onclick', 'id="admin-panel-btn" style="display:none" onclick');
                htmlContent = htmlContent.replace(
                    /<div id="global-loader"[\s\S]*?>/,
                    '<div id="global-loader" class="hidden">'
                );

                const jsonStr = JSON.stringify(dataPackage).replace(/<\/script>/g, '<\\/script>');
                const injectionCode = `window.EMBEDDED_DB = ${jsonStr};`;
                const targetStr = 'window.EMBEDDED_DB = null;';

                if (!htmlContent.includes(targetStr)) {
                    throw new Error("模板插槽未找到，请检查 HTML 头部是否添加了 id='embedded-data-script'");
                }

                const newHtml = htmlContent.replace(targetStr, injectionCode);

                const BlobCtor = getBlobConstructor();
                if (!BlobCtor) throw new Error('Blob unavailable');
                if (!root.URL || typeof root.URL.createObjectURL !== 'function') {
                    throw new Error('URL.createObjectURL unavailable');
                }

                const blob = new BlobCtor([newHtml], { type: 'text/html;charset=utf-8' });
                const url = root.URL.createObjectURL(blob);
                const link = doc.createElement('a');
                link.href = url;
                link.download = `查分系统_分发版_${new Date().toLocaleDateString().replace(/\//g, '-')}.html`;

                const body = getBody(doc);
                if (!body || typeof body.appendChild !== 'function' || typeof body.removeChild !== 'function') {
                    throw new Error('document.body unavailable');
                }
                body.appendChild(link);
                link.click();
                body.removeChild(link);

                safeLoading(false);
                safeAlert('✅ 分发版已生成！\n\n请将下载的 .html 文件发送给家长。\n家长打开该文件后，可直接用账号登录。');
            } catch (error) {
                console.error(error);
                safeLoading(false);
                safeAlert(`打包失败: ${error.message}`);
            }
        }, 500);
    }

    return {
        exportDistributableHTML
    };
});
