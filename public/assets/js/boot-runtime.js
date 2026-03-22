document.addEventListener('DOMContentLoaded', function () {
    if (typeof initMacroAnomalyConfigUI === 'function') initMacroAnomalyConfigUI();
});

window.scrollToAnchor = function (id, triggerEl) {
    var el = document.getElementById(id);
    if (el) {
        var headerH = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
        var y = el.getBoundingClientRect().top + window.pageYOffset - headerH - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
};

window.ensureTeacherDataAlpineStore = function () {
    if (!window.Alpine || typeof window.Alpine.store !== 'function') return;
    const existing = window.Alpine.store('teacherData');
    if (existing) {
        if (!Array.isArray(existing.list)) existing.list = [];
        return;
    }
    window.Alpine.store('teacherData', { list: [] });
};
document.addEventListener('alpine:init', window.ensureTeacherDataAlpineStore);

window.addEventListener('scroll', function () {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    if (window.scrollY > 300) {
        btn.style.display = 'block';
        btn.style.opacity = '1';
    } else {
        btn.style.display = 'none';
    }
});
