(function (root) {
    if (!root || root.SchoolRuntime) return;

    const values = Object.create(null);
    const skills = Object.create(null);

    function normalizeKey(key) {
        return String(key || '').trim();
    }

    function expose(key, value) {
        const normalized = normalizeKey(key);
        if (!normalized) return value;
        values[normalized] = value;
        return value;
    }

    function get(key) {
        return values[normalizeKey(key)];
    }

    function registerSkill(key, definition) {
        const normalized = normalizeKey(key);
        if (!normalized) return null;
        skills[normalized] = Object.freeze({ ...(definition || {}) });
        return skills[normalized];
    }

    function getSkill(key) {
        return skills[normalizeKey(key)] || null;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    root.SchoolRuntime = {
        expose,
        get,
        has: (key) => Object.prototype.hasOwnProperty.call(values, normalizeKey(key)),
        registerSkill,
        getSkill,
        listSkills: () => Object.keys(skills),
        escapeHtml
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
