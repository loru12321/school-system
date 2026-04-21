(() => {
    if (typeof window === 'undefined' || window.__LOGIN_ENTRY_RUNTIME_PATCHED__) return;

    const PORTAL_LABELS = {
        school: {
            userPrefix: 'User',
            userPlaceholder: '管理员账号 / 教师姓名',
            passPrefix: 'Password',
            submit: '进入学校工作台',
            helper: '当前为学校端，验证通过后进入届别选择和工作台。'
        },
        parent: {
            userPrefix: 'Student',
            userPlaceholder: '请输入学生姓名',
            passPrefix: 'Password',
            submit: '家长端登录',
            helper: '家长端统一承接原学生端与家长端入口：填写学生姓名、班级和密码。首次使用默认密钥会被强制修改。'
        }
    };

    function getPortal() {
        if (window.Auth && typeof window.Auth.getLoginPortal === 'function') {
            return window.Auth.getLoginPortal() === 'parent' ? 'parent' : 'school';
        }
        return localStorage.getItem('LOGIN_PORTAL_V1') === 'parent' ? 'parent' : 'school';
    }

    function ensureFieldShell(input, field, prefixText) {
        if (!input) return null;
        let shell = input.closest('.login-entry-field');
        if (!shell) {
            shell = document.createElement('div');
            shell.className = 'login-entry-field';
            shell.dataset.loginField = field;
            input.parentNode.insertBefore(shell, input);
            shell.appendChild(input);
        }
        let prefix = shell.querySelector('.login-entry-prefix');
        if (!prefix) {
            prefix = document.createElement('span');
            prefix.className = 'login-entry-prefix';
            shell.insertBefore(prefix, shell.firstChild);
        }
        if (prefix.textContent !== prefixText) prefix.textContent = prefixText;
        return shell;
    }

    function removeLegacyStudentEntry() {
        document.querySelectorAll([
            '#role-student',
            'label[for="role-student"]',
            '#form-student',
            '[data-portal="student"]',
            '[data-login-open="student"]'
        ].join(',')).forEach((node) => node.remove());
    }

    function normalizePortalButtons(portal) {
        const schoolButtons = document.querySelectorAll('#btn-role-school, [data-portal="school"], [data-login-open="school"]');
        const parentButtons = document.querySelectorAll('#btn-role-parent, [data-portal="parent"], [data-login-open="parent"]');
        schoolButtons.forEach((button) => {
            if (button.textContent !== '学校端') button.textContent = '学校端';
            button.classList.toggle('active', portal === 'school');
            button.setAttribute('aria-pressed', portal === 'school' ? 'true' : 'false');
        });
        parentButtons.forEach((button) => {
            if (button.textContent !== '家长端登录') button.textContent = '家长端登录';
            button.classList.toggle('active', portal === 'parent');
            button.setAttribute('aria-pressed', portal === 'parent' ? 'true' : 'false');
        });
    }

    function polishLoginShell() {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return;
        const portal = getPortal();
        const copy = PORTAL_LABELS[portal] || PORTAL_LABELS.school;

        removeLegacyStudentEntry();
        normalizePortalButtons(portal);
        overlay.dataset.loginPortal = portal;

        document.querySelectorAll('#login-overlay .advanced-input-group i, #login-overlay .login-field-icon').forEach((node) => node.remove());

        const userInput = document.getElementById('login-user');
        const classInput = document.getElementById('login-class');
        const passInput = document.getElementById('login-pass');
        ensureFieldShell(userInput, 'user', copy.userPrefix);
        ensureFieldShell(classInput, 'class', 'Class');
        ensureFieldShell(passInput, 'password', copy.passPrefix);

        if (userInput) userInput.placeholder = copy.userPlaceholder;
        if (classInput) classInput.placeholder = '请输入学生班级，如 701';
        if (passInput) passInput.placeholder = '输入密码';

        const classGroup = document.getElementById('login-class-group');
        if (classGroup) {
            const showClass = portal === 'parent';
            classGroup.style.display = showClass ? 'block' : 'none';
            classGroup.setAttribute('aria-hidden', showClass ? 'false' : 'true');
        }

        const submit = document.getElementById('login-submit-button');
        if (submit && submit.dataset.bootBusy !== '1' && submit.textContent !== copy.submit) submit.textContent = copy.submit;
        const helper = document.getElementById('login-portal-helper');
        if (helper && !String(helper.textContent || '').includes('正在') && helper.textContent !== copy.helper) helper.textContent = copy.helper;
    }

    function patchAuthMethod(methodName) {
        if (!window.Auth || window.Auth[`__loginEntryPatched_${methodName}`]) return false;
        const original = window.Auth[methodName];
        if (typeof original !== 'function') return false;
        window.Auth[methodName] = function patchedLoginEntryMethod(...args) {
            const result = original.apply(this, args);
            setTimeout(polishLoginShell, 0);
            return result;
        };
        window.Auth[`__loginEntryPatched_${methodName}`] = true;
        return true;
    }

    function patchAuth() {
        if (!window.Auth) return;
        patchAuthMethod('syncLoginPortalUI');
        patchAuthMethod('setLoginPortal');
        patchAuthMethod('rebuildPassportLoginShell');
        patchAuthMethod('ensureLoginWorkbench');
    }

    function boot() {
        polishLoginShell();
        patchAuth();
        const observer = new MutationObserver(() => polishLoginShell());
        const overlay = document.getElementById('login-overlay');
        if (overlay) observer.observe(overlay, { childList: true, subtree: true });
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;
            patchAuth();
            polishLoginShell();
            if (attempts > 80) clearInterval(timer);
        }, 250);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.polishLoginEntryShell = polishLoginShell;
    window.__LOGIN_ENTRY_RUNTIME_PATCHED__ = true;
})();
