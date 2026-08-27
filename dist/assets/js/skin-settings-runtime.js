// ================== 外观定制逻辑 (换肤 & Logo) ==================
const SKIN_CONFIG_KEY = 'app_skin_config';
let currentSkin = {
    primaryColor: '#4f46e5', // 默认颜色
    logoBase64: '',
    customTitle: ''
};

// 1. 打开模态框
function openSkinModal() {
    document.getElementById('skin-modal').style.display = 'flex';
    // 填充当前值
    document.getElementById('custom-color-input').value = currentSkin.primaryColor || '#4f46e5';
    document.getElementById('custom-title-input').value = currentSkin.customTitle || '';
}

// 2. 设置主题色 (动态计算深色变体)
function setThemeColor(color) {
    currentSkin.primaryColor = color;
    // 更新 CSS 变量
    document.documentElement.style.setProperty('--primary', color);

    // 简单的颜色变暗逻辑，用于 --primary-dark
    const darkenColor = (hex, percent) => {
        let num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) - amt,
            B = ((num >> 8) & 0x00FF) - amt,
            G = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
    };

    try {
        const darkColor = darkenColor(color, 30); // 变暗 30% 形成渐变
        const lightColor = color + '1A'; // 增加 10% 透明度 (Hex Alpha)
        document.documentElement.style.setProperty('--primary-dark', darkColor);
        document.documentElement.style.setProperty('--primary-light', lightColor);

        // 手动更新 Header 背景 (因为 CSS 变量在 linear-gradient 有时需要强制刷新)
        const header = document.querySelector('header');
        if (header) {
            header.style.background = `linear-gradient(135deg, ${color} 0%, ${darkColor} 100%)`;
        }
    } catch (e) { console.warn("颜色计算错误", e); }
}

// 3. 处理 Logo 上传
function handleLogoUpload(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) return window.UI.alert("Logo 图片过大，请使用 500KB 以内的图片");

    const reader = new FileReader();
    reader.onload = function (e) {
        currentSkin.logoBase64 = e.target.result;
        applyLogo(currentSkin.logoBase64);
    };
    reader.readAsDataURL(file);
}

function applyLogo(base64) {
    void base64;
}

function clearLogo() {
    currentSkin.logoBase64 = '';
    applyLogo('');
}

// 4. 标题实时预览
function updateTitlePreview(val) {
    const titleEl = document.getElementById('app-title');
    // 保留里面的 span (badge)
    const badge = titleEl.querySelector('.badge');
    const badgeHtml = badge ? badge.outerHTML : '';

    if (val.trim()) {
        titleEl.innerHTML = val + ' ' + badgeHtml;
    } else {
        titleEl.innerHTML = '乡镇学校成绩分析与教务管理系统 ' + badgeHtml;
    }
    currentSkin.customTitle = val;
}

// 5. 保存设置到 LocalStorage
function saveSkinSettings() {
    localStorage.setItem(SKIN_CONFIG_KEY, JSON.stringify(currentSkin));
    document.getElementById('skin-modal').style.display = 'none';
    if (window.UI?.toast) window.UI.toast("✅ 外观设置已保存", "success");
    else if (window.UI?.alert) window.UI.alert("设置已保存");
}

// 6. 初始化加载设置
function loadSkinSettings() {
    const saved = localStorage.getItem(SKIN_CONFIG_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            currentSkin = { ...currentSkin, ...parsed };
            if (currentSkin.primaryColor) setThemeColor(currentSkin.primaryColor);
            if (currentSkin.logoBase64) applyLogo(currentSkin.logoBase64);
            if (currentSkin.customTitle) updateTitlePreview(currentSkin.customTitle);
        } catch (e) { console.error("加载皮肤配置失败", e); }
    }
}
