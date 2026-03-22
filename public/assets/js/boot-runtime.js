var sbClient = window.sbClient || null;
window.SUPABASE_URL = localStorage.getItem('SUPABASE_URL') || 'https://okwcciujnfvobbwaydiv.supabase.co';
window.SUPABASE_KEY = localStorage.getItem('SUPABASE_KEY') || 'sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4';
window.EDGE_GATEWAY_URL = localStorage.getItem('EDGE_GATEWAY_URL') || 'https://okwcciujnfvobbwaydiv.supabase.co/functions/v1/edu-gateway-v2';
window.initSupabase = function () {
    if (window.supabase && !sbClient) {
        sbClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
        window.sbClient = sbClient;
        console.log('✅ Supabase 连接初始化成功');
    }
};

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
